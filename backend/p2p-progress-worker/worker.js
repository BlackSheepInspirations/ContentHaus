/* Purpose 2 Profit — community + progress backend (Cloudflare Worker), v2.
   ---------------------------------------------------------------------------
   Routed by the App Proxy path tail (/apps/p2p/<seg>):
     progress  GET/POST  -> per-customer metafield custom.p2p_progress (UNCHANGED)
     profile   GET/POST   -> this member's own PUBLIC card (KV), incl. opt-out + geo
     members   GET        -> all non-hidden public cards (directory + map)
     community GET/POST    -> GET the wall (with love counts); POST publishes IMMEDIATELY
     react     POST         -> toggle a love on a post {id} -> {likes, liked}
     suggest   POST         -> private question/suggestion -> emails hello@ (+ KV log)
     moderate  POST        -> ADMIN (optional): {id, action:'delete'} — spam safety valve

   Emails (community posts, messages, suggestions, questions) go to env.alert_email
   (set it to hello@blacksheepcreations.com) via Resend (env.resend_key).

   Every request is App-Proxy-signed (env.client_secret) so logged_in_customer_id
   is trustworthy. Admin = customerId listed in env.admin_ids (comma-separated).

   Cloudflare env:
     shop, client_id           plain vars
     client_secret             secret (also verifies the proxy signature)
     admin_token               optional secret (else client_credentials grant)
     admin_ids                 comma-separated customer ids allowed to moderate
     resend_key, alert_email   optional — email alerts on new posts (Resend free tier)
   Cloudflare binding:
     P2P_KV                    a KV namespace (shared store for cards + posts)
*/
const API_VERSION = '2026-07';
const NS = 'custom', KEY = 'p2p_progress';
let cachedToken = null, cachedAt = 0;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (!(await verifyProxySignature(url, env.client_secret))) return json({ error: 'bad signature' }, 401);

    const customerId = url.searchParams.get('logged_in_customer_id');
    const seg = url.pathname.replace(/\/+$/, '').split('/').pop() || 'progress';

    // Everything here is members-only. Anonymous visitors stay on localStorage.
    if (!customerId) return json({ ok: true, guest: true, progress: null });

    const kv = env.P2P_KV;
    try {
      /* ---------- progress (unchanged behaviour) ---------- */
      if (seg === 'progress' || seg === 'p2p' || seg === '') {
        if (request.method === 'GET') return json({ ok: true, progress: await readProgress(env, customerId) });
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);
          await writeProgress(env, customerId, body);
          return json({ ok: true });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- member public profile card ---------- */
      if (seg === 'profile') {
        if (!kv) return json({ error: 'no_store' }, 501);
        if (request.method === 'GET') return json({ ok: true, profile: await kv.get('member:' + customerId, 'json') });
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);
          const info = await customerInfo(env, customerId);
          const geo = geoFrom(request);
          const prev = await kv.get('member:' + customerId, 'json');
          const rec = {
            id: customerId,
            name: String(body.name || info.firstName || 'Member').slice(0, 40),
            tier: String(body.tier || '').slice(0, 40),
            points: Number(body.points) || 0,
            badges: Number(body.badges) || 0,
            recentBadges: sanitizeBadges(body.recentBadges),
            since: info.createdAt || (prev && prev.since) || null,
            photo: sanitizeUrl(body.photo),
            quote: String(body.quote || '').slice(0, 140),
            about: String(body.about || '').slice(0, 320),
            social: sanitizeSocial(body.social),
            hidden: !!body.hidden,                         // member opted out of map/directory
            adminHidden: !!(prev && prev.adminHidden),     // admin-hidden (light moderation), preserved
            city: geo.city, region: geo.region, country: geo.country, lat: geo.lat, lng: geo.lng,
            ts: Date.now()
          };
          await kv.put('member:' + customerId, JSON.stringify(rec));
          return json({ ok: true });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- members directory + map ---------- */
      if (seg === 'members') {
        if (!kv) return json({ ok: true, members: [] });
        const list = await kv.list({ prefix: 'member:' });
        const members = [];
        for (const k of list.keys) {
          const r = await kv.get(k.name, 'json');
          if (r && !r.hidden && !r.adminHidden) members.push(r);
        }
        return json({ ok: true, members });
      }

      /* ---------- community wall ---------- */
      if (seg === 'community') {
        if (!kv) return json({ ok: true, posts: [] });
        if (request.method === 'GET') {
          const list = await kv.list({ prefix: 'post:' });
          const posts = [];
          for (const k of list.keys) {
            const p = await kv.get(k.name, 'json');
            if (!p) continue;
            const rs = reactState(p, customerId);
            posts.push({ id: p.id, name: p.name, text: p.text, kind: p.kind, ts: p.ts, reactions: rs.counts, mine: rs.mine, likes: rs.counts.love, liked: rs.mine.love });
          }
          posts.sort((a, b) => b.ts - a.ts);
          return json({ ok: true, posts });
        }
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          const text = String((body && body.text) || '').trim();
          if (!text) return json({ error: 'empty' }, 400);
          const info = await customerInfo(env, customerId);
          const id = Date.now() + '-' + customerId;
          const kind = ((body && body.kind) === 'win') ? 'win' : 'post';   // wins get their own board
          const post = { id, author: customerId, name: String((body && body.name) || info.firstName || 'Member').slice(0, 40), text: text.slice(0, 1000), kind: kind, ts: Date.now() };
          await kv.put('post:' + id, JSON.stringify(post));   // live immediately (unmoderated)
          await alertAdmin(env, post).catch(() => {});         // optional email ping to you
          return json({ ok: true });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- love/react on a post (toggle) ---------- */
      if (seg === 'react') {
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const pid = body && body.id;
        if (!pid) return json({ error: 'no_id' }, 400);
        const p = await kv.get('post:' + pid, 'json');
        if (!p) return json({ error: 'not_found' }, 404);
        const type = ['love', 'thumb', 'party'].indexOf(body && body.type) > -1 ? body.type : 'love';
        const r = normalizeReactions(p);
        const arr = r[type];
        const i = arr.indexOf(customerId);
        if (i > -1) arr.splice(i, 1); else arr.push(customerId);
        p.reactions = r; delete p.likedBy;
        await kv.put('post:' + pid, JSON.stringify(p));
        const rs = reactState(p, customerId);
        return json({ ok: true, reactions: rs.counts, mine: rs.mine, likes: rs.counts.love, liked: rs.mine.love });
      }

      /* ---------- suggestions / questions (private → email you) ---------- */
      if (seg === 'suggest') {
        const body = await request.json().catch(() => null);
        const text = String((body && body.text) || '').trim();
        if (!text) return json({ error: 'empty' }, 400);
        const kind = String((body && body.kind) || 'Suggestion').slice(0, 40);
        const info = await customerInfo(env, customerId);
        const rec = { id: Date.now() + '-' + customerId, from: customerId, name: info.firstName || 'Member', kind: kind, text: text.slice(0, 2000), ts: Date.now() };
        if (kv) await kv.put('suggest:' + rec.id, JSON.stringify(rec)).catch(() => {});   // keep a log
        await sendEmail(env, kind + ' from ' + rec.name, rec.name + ' sent a ' + kind.toLowerCase() + ':\n\n' + rec.text).catch(() => {});
        return json({ ok: true });
      }

      /* ---------- admin (optional): delete a post — spam safety valve ---------- */
      if (seg === 'moderate') {
        if (!isAdmin(env, customerId)) return json({ error: 'forbidden' }, 403);
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const pid = body && body.id;
        if (!pid) return json({ error: 'no_id' }, 400);
        if ((body && body.action) === 'delete') { await kv.delete('post:' + pid); return json({ ok: true }); }
        return json({ error: 'bad_action' }, 400);
      }

      return json({ error: 'not_found' }, 404);
    } catch (e) { return json({ error: 'server', detail: String((e && e.message) || e) }, 500); }
  }
};

/* ---------- helpers ---------- */
function geoFrom(request) {
  const c = request.cf || {};
  return {
    city: c.city || '', region: c.region || '', country: c.country || '',
    lat: c.latitude ? Number(c.latitude) : null, lng: c.longitude ? Number(c.longitude) : null
  };
}
function isAdmin(env, customerId) {
  return String(env.admin_ids || '').split(',').map(s => s.trim()).filter(Boolean).indexOf(String(customerId)) !== -1;
}
function sanitizeUrl(u) {
  u = String(u || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(u) ? u.slice(0, 400) : '';
}
function sanitizeSocial(s) {
  const out = {}; if (!s || typeof s !== 'object') return out;
  ['website', 'instagram', 'facebook', 'youtube', 'x', 'linkedin', 'tiktok'].forEach(function (k) {
    const v = sanitizeUrl(s[k]); if (v) out[k] = v;
  });
  return out;
}
// A member's most-recent earned badges (for the Growth Board): [{label, emoji}], max 3.
function sanitizeBadges(a) {
  if (!Array.isArray(a)) return [];
  return a.slice(0, 3).map(function (b) {
    b = b || {};
    return { label: String(b.label || '').slice(0, 60), emoji: String(b.emoji || '🏅').slice(0, 8) };
  }).filter(function (b) { return b.label; });
}
// Reactions: {love:[ids], thumb:[ids], party:[ids]}. Migrates legacy p.likedBy → love.
function normalizeReactions(p) {
  const r = (p && p.reactions) || {};
  return {
    love: Array.isArray(r.love) ? r.love : ((p && p.likedBy) || []),
    thumb: Array.isArray(r.thumb) ? r.thumb : [],
    party: Array.isArray(r.party) ? r.party : []
  };
}
function reactState(p, customerId) {
  const r = normalizeReactions(p);
  return {
    counts: { love: r.love.length, thumb: r.thumb.length, party: r.party.length },
    mine: { love: r.love.indexOf(customerId) > -1, thumb: r.thumb.indexOf(customerId) > -1, party: r.party.indexOf(customerId) > -1 }
  };
}
async function sendEmail(env, subject, text) {
  if (!env.resend_key || !env.alert_email) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.resend_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.alert_from || 'P2P Community <onboarding@resend.dev>',
      to: [env.alert_email],
      subject: subject,
      text: text
    })
  });
}
async function alertAdmin(env, post) {
  await sendEmail(env, 'New post on your community wall', post.name + ' just posted:\n\n' + post.text + '\n\nSee it in your OS → Community.');
}

async function verifyProxySignature(url, secret) {
  const params = []; let signature = '';
  for (const [k, v] of url.searchParams) { if (k === 'signature') { signature = v; continue; } params.push([k, v]); }
  params.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const message = params.map(([k, v]) => `${k}=${v}`).join('');
  const expected = await hmacHex(secret, message);
  return !!signature && signature.length === expected.length && timingSafeEqual(signature, expected);
}
async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function timingSafeEqual(a, b) { let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
function enc(s) { return new TextEncoder().encode(s); }

async function getToken(env) {
  if (env.admin_token) return env.admin_token;
  const now = Date.now();
  if (cachedToken && now - cachedAt < 50 * 60 * 1000) return cachedToken;
  const res = await fetch(`https://${env.shop}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: env.client_id, client_secret: env.client_secret, grant_type: 'client_credentials' })
  });
  if (!res.ok) throw new Error('token ' + res.status + ' ' + (await res.text()));
  const j = await res.json(); cachedToken = j.access_token; cachedAt = now; return cachedToken;
}
async function adminGraphQL(env, query, variables) {
  const token = await getToken(env);
  const res = await fetch(`https://${env.shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables })
  });
  const j = await res.json();
  if (j.errors) throw new Error('gql ' + JSON.stringify(j.errors));
  return j.data;
}
async function customerInfo(env, customerId) {
  try {
    const data = await adminGraphQL(env, `query($id: ID!){ customer(id:$id){ firstName createdAt } }`, { id: `gid://shopify/Customer/${customerId}` });
    const c = (data && data.customer) || {};
    return { firstName: c.firstName || '', createdAt: c.createdAt || null };
  } catch (e) { return { firstName: '', createdAt: null }; }
}
async function readProgress(env, customerId) {
  const data = await adminGraphQL(env, `query($id: ID!){ customer(id:$id){ metafield(namespace:"${NS}", key:"${KEY}"){ value } } }`, { id: `gid://shopify/Customer/${customerId}` });
  const raw = data && data.customer && data.customer.metafield && data.customer.metafield.value;
  if (!raw) return null; try { return JSON.parse(raw); } catch (e) { return null; }
}
async function writeProgress(env, customerId, progress) {
  const data = await adminGraphQL(env, `mutation($mf:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$mf){ userErrors{ field message } } }`, { mf: [{ ownerId: `gid://shopify/Customer/${customerId}`, namespace: NS, key: KEY, type: 'json', value: JSON.stringify(progress) }] });
  const errs = data && data.metafieldsSet && data.metafieldsSet.userErrors;
  if (errs && errs.length) throw new Error('set ' + JSON.stringify(errs));
}
function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...cors() } }); }
function cors() { return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' }; }
