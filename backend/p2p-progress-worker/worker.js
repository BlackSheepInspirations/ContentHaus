/* Purpose 2 Profit — cross-device progress backend (Cloudflare Worker).
   ---------------------------------------------------------------------------
   The theme's assets/p2p-progress.js talks to /apps/p2p/progress, which Shopify's
   App Proxy forwards here after SIGNING the request with the logged-in customer's
   id. This Worker:
     • verifies the App Proxy signature (so nobody can forge a customer id),
     • GET  -> returns { guest:true } for anonymous, else { progress:{…} } read
               from the customer metafield custom.p2p_progress,
     • POST -> writes the posted JSON blob to that same metafield.

   Secrets (set with `wrangler secret put …`, NEVER committed):
     SHOPIFY_APP_SECRET   the app's API secret key — verifies the proxy signature
     SHOPIFY_ADMIN_TOKEN  Admin API access token — reads/writes the metafield
   Vars (safe to keep in wrangler.toml):
     SHOP                 e.g. blacksheepcreationsllc.myshopify.com
     API_VERSION          e.g. 2025-01
*/

const MF_NAMESPACE = "custom";
const MF_KEY = "p2p_progress";
const MAX_BYTES = 60000; // stay under Shopify's ~65,535-char metafield value limit

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // 1) Verify this really came through Shopify's signed App Proxy.
      const valid = await verifyProxySignature(url.searchParams, env.SHOPIFY_APP_SECRET);
      if (!valid) return json({ error: "unauthorized" }, 401);

      // logged_in_customer_id is inside the signed params, so it's trustworthy.
      const customerId = (url.searchParams.get("logged_in_customer_id") || "").trim();

      // Anonymous visitor: tell the client to stay on localStorage only.
      if (!customerId) return json({ guest: true });

      if (request.method === "GET") {
        const progress = await readProgress(env, customerId);
        return json({ progress: progress || {} });
      }

      if (request.method === "POST") {
        let blob;
        try { blob = await request.json(); }
        catch { return json({ error: "bad_json" }, 400); }
        if (!blob || typeof blob !== "object" || Array.isArray(blob)) {
          return json({ error: "bad_body" }, 400);
        }
        const value = JSON.stringify(blob);
        if (value.length > MAX_BYTES) return json({ error: "too_large" }, 413);
        const errs = await writeProgress(env, customerId, value);
        if (errs && errs.length) return json({ error: "write_failed", detail: errs }, 502);
        return json({ ok: true });
      }

      return json({ error: "method_not_allowed" }, 405);
    } catch (e) {
      return json({ error: "server_error", detail: String(e && e.message || e) }, 500);
    }
  }
};

/* ---- App Proxy signature verification ----
   Shopify concatenates every query param EXCEPT `signature` as `key=value`,
   sorted by key (array values joined with ','), then HMAC-SHA256 (hex) with the
   app's API secret key. See Shopify "App proxy" docs. */
async function verifyProxySignature(params, secret) {
  if (!secret) return false;
  const sig = params.get("signature");
  if (!sig) return false;

  // Group values by key (URLSearchParams yields duplicate keys separately).
  const grouped = {};
  for (const [k, v] of params.entries()) {
    if (k === "signature") continue;
    (grouped[k] = grouped[k] || []).push(v);
  }
  const message = Object.keys(grouped)
    .sort()
    .map((k) => `${k}=${grouped[k].join(",")}`)
    .join("");

  const expected = await hmacHex(secret, message);
  return timingSafeEqualHex(expected, sig);
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---- Admin API (GraphQL) helpers ---- */
async function adminGraphQL(env, query, variables) {
  const res = await fetch(
    `https://${env.SHOP}/admin/api/${env.API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_TOKEN
      },
      body: JSON.stringify({ query, variables })
    }
  );
  return res.json();
}

async function readProgress(env, customerId) {
  const data = await adminGraphQL(
    env,
    `query($id: ID!) {
       customer(id: $id) {
         metafield(namespace: "${MF_NAMESPACE}", key: "${MF_KEY}") { value }
       }
     }`,
    { id: `gid://shopify/Customer/${customerId}` }
  );
  const value = data && data.data && data.data.customer && data.data.customer.metafield && data.data.customer.metafield.value;
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

async function writeProgress(env, customerId, value) {
  const data = await adminGraphQL(
    env,
    `mutation($mf: [MetafieldsSetInput!]!) {
       metafieldsSet(metafields: $mf) {
         userErrors { field message }
       }
     }`,
    {
      mf: [{
        ownerId: `gid://shopify/Customer/${customerId}`,
        namespace: MF_NAMESPACE,
        key: MF_KEY,
        type: "json",
        value
      }]
    }
  );
  const top = (data && data.errors) || [];
  const userErrors = (data && data.data && data.data.metafieldsSet && data.data.metafieldsSet.userErrors) || [];
  return [...top, ...userErrors];
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
