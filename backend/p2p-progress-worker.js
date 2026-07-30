/* Purpose 2 Profit — cross-device progress sync (Cloudflare Worker)
 *
 * Flow: the theme calls /apps/p2p/progress on the storefront; Shopify's App Proxy
 * forwards it here with a SIGNED request that includes logged_in_customer_id. We
 * verify the signature, then read/write that customer's `custom.p2p_progress` JSON
 * metafield through the Admin API. Guests (not logged in) just keep using localStorage.
 *
 * Secrets to set in Cloudflare → your Worker → Settings → Variables (mark "Encrypted"):
 *   SHOP           blacksheepcreationsllc.myshopify.com
 *   CLIENT_ID      App's Client ID   (from Dev Dashboard → Settings)
 *   CLIENT_SECRET  App's Client Secret (also verifies App Proxy signatures)
 *   ADMIN_TOKEN    (optional) a static Admin API token, if the client-credentials grant isn't available
 */

const API_VERSION = '2026-07';
const NS = 'custom', KEY = 'p2p_progress';
let cachedToken = null, cachedAt = 0;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });

    // 1) confirm the request really came from Shopify's App Proxy
    if (!(await verifyProxySignature(url, env.CLIENT_SECRET))) return json({ error: 'bad signature' }, 401);

    // 2) require a logged-in customer (guests fall back to localStorage on the theme)
    const customerId = url.searchParams.get('logged_in_customer_id');
    if (!customerId) return json({ ok: true, progress: null, guest: true });

    try {
      if (request.method === 'GET') {
        return json({ ok: true, progress: await readProgress(env, customerId) });
      }
      if (request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);
        await writeProgress(env, customerId, body);
        return json({ ok: true });
      }
      return json({ error: 'method' }, 405);
    } catch (e) {
      return json({ error: 'server', detail: String((e && e.message) || e) }, 500);
    }
  }
};

/* ---- App Proxy signature: HMAC-SHA256 of sorted "key=value" params (hex) keyed with CLIENT_SECRET ---- */
async function verifyProxySignature(url, secret) {
  const params = [];
  let signature = '';
  for (const [k, v] of url.searchParams) {
    if (k === 'signature') { signature = v; continue; }
    params.push([k, v]);
  }
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

/* ---- Admin API auth ---- */
async function getToken(env) {
  if (env.ADMIN_TOKEN) return env.ADMIN_TOKEN;                 // static token wins if provided
  const now = Date.now();
  if (cachedToken && now - cachedAt < 50 * 60 * 1000) return cachedToken;  // reuse for ~50 min
  const res = await fetch(`https://${env.SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET, grant_type: 'client_credentials' })
  });
  if (!res.ok) throw new Error('token ' + res.status + ' ' + (await res.text()));
  const j = await res.json();
  cachedToken = j.access_token; cachedAt = now;
  return cachedToken;
}
async function adminGraphQL(env, query, variables) {
  const token = await getToken(env);
  const res = await fetch(`https://${env.SHOP}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables })
  });
  const j = await res.json();
  if (j.errors) throw new Error('gql ' + JSON.stringify(j.errors));
  return j.data;
}

/* ---- read / write the customer's progress metafield ---- */
async function readProgress(env, customerId) {
  const data = await adminGraphQL(env,
    `query($id: ID!){ customer(id:$id){ metafield(namespace:"${NS}", key:"${KEY}"){ value } } }`,
    { id: `gid://shopify/Customer/${customerId}` });
  const raw = data && data.customer && data.customer.metafield && data.customer.metafield.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}
async function writeProgress(env, customerId, progress) {
  const data = await adminGraphQL(env,
    `mutation($mf:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$mf){ userErrors{ field message } } }`,
    { mf: [{ ownerId: `gid://shopify/Customer/${customerId}`, namespace: NS, key: KEY, type: 'json', value: JSON.stringify(progress) }] });
  const errs = data && data.metafieldsSet && data.metafieldsSet.userErrors;
  if (errs && errs.length) throw new Error('set ' + JSON.stringify(errs));
}

/* ---- helpers ---- */
function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json', ...cors() } }); }
function cors() { return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' }; }
