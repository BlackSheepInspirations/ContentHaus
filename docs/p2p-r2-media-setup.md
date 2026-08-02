# P2P media uploads — Cloudflare R2 setup

Direct photo upload (member avatars now; post media later) stores images in a
Cloudflare **R2** bucket via the `p2p-progress` worker. The client resizes to a
512px JPEG before upload, so files are small (~30–80 KB each).

The **code is already deployed**. Uploads stay switched off (the button says
"Photo uploads aren't switched on yet") until the two required steps below are
done. Presets and the paste-a-URL fallback keep working in the meantime.

## One-time setup (in the Cloudflare dashboard)

### 1. Turn on R2 + create the bucket
- Cloudflare dashboard → **R2** → (enable R2 if prompted; needs a card on file —
  cost for avatars is effectively $0; R2 free tier is 10 GB storage + generous
  ops, and there are **no egress fees**).
- **Create bucket** → name it `p2p-media` → Create.

### 2. Bind the bucket to the worker  ← REQUIRED
- Workers & Pages → **p2p-progress** → **Settings** → **Bindings** (a.k.a.
  Variables) → **R2 bucket bindings** → **Add binding**.
  - Variable name: **`MEDIA`**  (exactly this)
  - Bucket: **`p2p-media`**
- Save.

### 3. (Recommended) Public URL for fast, cached serving
Two options — pick one:

**A. Quick (r2.dev):** bucket → **Settings** → **Public access** → allow
`r2.dev`. Copy the URL it gives you (looks like
`https://pub-xxxxxxxx.r2.dev`). Then Worker → Settings → **Variables** →
add a plaintext variable **`r2_public_base`** = that URL (no trailing slash).

**B. Branded (custom domain):** bucket → Settings → **Custom Domains** → add
e.g. `cdn.blacksheepcreations.com` (Cloudflare adds the DNS). Then set
`r2_public_base` to `https://cdn.blacksheepcreations.com`.

If you **skip step 3**, uploads still work — images are served through the
worker at `/apps/p2p/imgget?key=...`. That's fine to start, just a little
slower on pages with many avatars (the directory). You can add `r2_public_base`
any time later with no code change.

### 4. Deploy the worker
Paste the current `backend/p2p-progress-worker/worker.js` into the worker editor
and **Deploy** (it already contains the `/apps/p2p/upload` + `/apps/p2p/imgget`
endpoints).

## Test
Member OS → **Members → My Profile → 📷 Choose a photo** → pick an image → it
previews and says "Photo ready — hit Save." → **Save my profile**. Your avatar
should now show on your card, on the map pin, and on your community posts.

## Notes
- Only logged-in members can upload; images capped at 3 MB post-resize.
- Keys are namespaced `avatar_<customerId>_<timestamp>.<ext>`.
- The same endpoint is ready to reuse for community post media later
  (`kind: 'post'`).
