/* Purpose 2 Profit — cross-device progress backend (Cloudflare Worker).
   ---------------------------------------------------------------------------
   THIS IS THE VERSION CURRENTLY DEPLOYED (managed in the Cloudflare dashboard).
   The theme's assets/p2p-progress.js calls /apps/p2p/progress; Shopify's App Proxy
   forwards it here after SIGNING it with the logged-in customer's id.
     • verifies the App Proxy signature (env.client_secret),
     • GET  -> { ok:true, progress:{…}|null }  (or { …, guest:true } when anonymous)
     • POST -> saves the JSON body to the customer metafield custom.p2p_progress
   The admin token is minted on the fly via the client_credentials grant from
   env.client_id + env.client_secret (or env.admin_token if set), so no separate
   store custom-app token is required.

   Worker environment (set in the Cloudflare dashboard → Settings → Variables):
     shop           blacksheepcreationsllc.myshopify.com   (plain var)
     client_id      the app's Client ID                    (plain var ok)
     client_secret  the app's Secret                        (ENCRYPTED secret)
     admin_token    optional shpat_… — skips client_credentials if present (secret)
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
    if (!customerId) return json({ ok: true, progress: null, guest: true });
    try {
      if (request.method === 'GET') return json({ ok: true, progress: await readProgress(env, customerId) });
      if (request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);
        await writeProgress(env, customerId, body);
        return json({ ok: true });
      }
      return json({ error: 'method' }, 405);
    } catch (e) { return json({ error: 'server', detail: String((e && e.message) || e) }, 500); }
  }
};

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
