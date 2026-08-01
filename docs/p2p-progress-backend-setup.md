# P2P cross-device progress — backend setup

> ## ✅ STATUS (2026-08-01): BUILT & LIVE
> The Worker is **deployed**, the Shopify **App Proxy is configured**, and the
> **signature check passes** — verified live: `GET https://blacksheepcreations.com/apps/p2p/progress`
> returns `{"ok":true,"progress":null,"guest":true}` (the correct anonymous answer).
>
> The deployed Worker (see `worker.js`) mints its Admin token on the fly via the
> **client_credentials** grant from the app's `client_id` + `client_secret`, so no
> separate store custom-app token was needed. Variables live in the Cloudflare
> dashboard (Workers & Pages → **p2p-progress** → Settings → Variables):
> `shop`, `client_id`, `client_secret` (encrypted), optional `admin_token`.
>
> **Only remaining check — the logged-in round-trip.** The guest path is proven; the
> read/write-a-metafield path only runs for a signed-in customer. To confirm it:
> 1. Log into the storefront as a real **customer** (not admin preview).
> 2. Visit `/pages/p2p-learning` and do something that earns progress (open a
>    course, add a journal note).
> 3. Check it worked either way:
>    - **Cloudflare** → Workers & Pages → p2p-progress → **Logs**: a `200` on the
>      `progress` POST = success; a `500` with `"token …"` or `"gql …"` = the admin
>      token/scope needs a look.
>    - **Shopify admin** → that Customer → **Metafields** → `custom.p2p_progress`
>      should hold a JSON blob.
> 4. Open the same account in a **different browser/device** → progress should load
>    in (one quiet auto-refresh pulls the server copy).
>
> If the POST 500s on a token error, the fix is to add an `admin_token` secret
> (a `shpat_…` from a 2-min store custom app with `write_customers`) — the Worker
> already prefers it over client_credentials when present.
>
> Everything below is the original build reference.

---

**Goal:** make a member's progress (courses done, points, badges, streak, journal,
certificates) follow them across devices and browsers, instead of living only in
one browser.

**How it works (plain version):** the theme already saves everything to the
browser. This backend adds a mirror in the cloud, tied to the *logged-in Shopify
customer*. Three pieces:

1. **Shopify App Proxy** — when the theme calls `/apps/p2p/progress`, Shopify
   forwards it to our Worker and **signs it with the customer's id**, so the
   backend knows who it is without any passwords going through the theme.
2. **A Cloudflare Worker** (tiny serverless function, free tier) — the code is
   already written in `backend/p2p-progress-worker/`. It verifies Shopify's
   signature, then reads/writes the customer's progress.
3. **A customer metafield** `custom.p2p_progress` — one JSON blob per customer,
   holding their progress. No separate database.

**The theme side is already done** — `assets/p2p-progress.js` loads server progress
on page open and saves (debounced) on every change, with localStorage as the
offline cache. Guests are untouched. Nothing else in the UI changes.

---

## ⚠️ One correction to the old plan
The earlier note said "custom app, no Partner account needed." That's true for the
*Admin API token*, but **App Proxy can only be configured on a Partner-dashboard
app**, not a store "Develop apps" custom app. A **free** Partner account (5 min,
no fees, no review) is required. Everything below reflects that.

---

## Who does what
- **You (Andrea):** create the two free accounts (Cloudflare + Shopify Partner),
  click through the app + proxy setup, and paste two secret values into Cloudflare.
- **Me (Claude):** wrote the Worker; I can run the Cloudflare deploy commands *with*
  you once you're logged in. **Secrets (the app secret + admin token) you set
  yourself in Cloudflare — never paste them into chat.**

Do the steps in this order (it avoids a chicken-and-egg between URLs).

---

## Step 1 — Create a free Cloudflare account
1. Go to **dash.cloudflare.com/sign-up**, create the account, verify your email.
2. That's all for now — we deploy in Step 3.

## Step 2 — Create the Shopify app (Partner dashboard)
1. Go to **partners.shopify.com**, create a free Partner account (choose
   "Shopify Partner"). No fees, no review.
2. **Apps → Create app → Create app manually.** Name it **P2P Progress**.
3. In the app's **Configuration** (or "App setup"):
   - **Admin API access scopes:** enable **`read_customers`** and **`write_customers`**.
     (These allow reading/writing customer metafields.)
   - **App proxy** — set:
     - **Subpath prefix:** `apps`
     - **Subpath:** `p2p`
     - **Proxy URL:** leave blank for a moment — you'll paste the Worker URL here in
       Step 4. (If it won't save empty, paste `https://example.com` as a placeholder.)
4. **Distribution → Custom distribution** → enter your store domain
   (`blacksheepcreationsllc.myshopify.com`) → generate the install link → **install
   the app on your store.**
5. After installing, collect two values (keep them somewhere private — **not chat**):
   - **Admin API access token** — shown once on the API credentials page after
     install (starts with `shpat_…`). This is `SHOPIFY_ADMIN_TOKEN`.
   - **API secret key** — on the same API credentials / "Client credentials" page.
     This is `SHOPIFY_APP_SECRET`.

## Step 3 — Deploy the Worker to Cloudflare
From the repo (I can run these with you; you'll do the login + secrets):

```bash
cd backend/p2p-progress-worker
npx wrangler login          # opens a browser; approve access to YOUR Cloudflare account
npx wrangler secret put SHOPIFY_APP_SECRET     # paste the API secret key when prompted
npx wrangler secret put SHOPIFY_ADMIN_TOKEN    # paste the shpat_… token when prompted
npx wrangler deploy
```

`wrangler deploy` prints the Worker's URL, e.g.
`https://p2p-progress.<your-subdomain>.workers.dev`. **Copy it.**

> The two secrets are stored encrypted in Cloudflare — they never touch git or chat.
> `SHOP` and `API_VERSION` are already set (non-secret) in `wrangler.toml`.

## Step 4 — Point the App Proxy at the Worker
Back in the Partner app → **App proxy** → set **Proxy URL** to the Worker URL from
Step 3 → **Save**. Now `https://blacksheepcreations.com/apps/p2p/progress` is live
and forwards to the Worker.

## Step 5 — (Recommended) Create the metafield definition
So the blob is visible/typed in admin:
**Settings → Custom data → Customers → Add definition**
- **Namespace and key:** `custom.p2p_progress`
- **Type:** JSON
- Save. (Optional — the Worker can write it without this — but it makes the data
  visible on the customer's admin page.)

## Step 6 — Test it
1. Log into the storefront as a real customer (not the admin preview).
2. Visit **/pages/p2p-learning**, do something that earns progress (open a course,
   add a journal note).
3. In admin, open that customer → check the `custom.p2p_progress` metafield is
   populated (or, if you skipped Step 5, query it via the app).
4. Open the same account in a **different browser or device** → your progress should
   load in. (First load may do one quiet auto-refresh to pull the server copy.)

If something's off, the quickest checks:
- **Browser devtools → Network → `progress`** call: a `200` with `{ "guest": true }`
  means the customer id isn't reaching the Worker (not logged in, or proxy misconfigured);
  a `401` means the signature check failed (wrong `SHOPIFY_APP_SECRET`).
- **Cloudflare → your Worker → Logs** shows each request and any error detail.

---

## Contract (for reference)
- `GET /apps/p2p/progress` → `{ "guest": true }` (anonymous) or `{ "progress": { … , "_ts": <ms> } }`.
- `POST /apps/p2p/progress` with body `{ <all p2p_* keys as strings>, "_ts": <ms> }`
  → `{ "ok": true }`. Newest `_ts` wins; localStorage stays the offline cache.

## Security
- The Worker rejects any request whose Shopify signature doesn't verify, so the
  customer id can't be forged.
- Secrets live only in Cloudflare (`wrangler secret put`). Never commit them; never
  paste them in chat. If one leaks, rotate it (regenerate in the Partner app / reset
  the Cloudflare secret) and redeploy.
