# P2P progress Worker

Cloudflare Worker backing the theme's cross-device progress sync
(`assets/p2p-progress.js` → Shopify App Proxy `/apps/p2p/progress` → here →
customer metafield `custom.p2p_progress`).

**Full setup + deploy walkthrough:** [`docs/p2p-progress-backend-setup.md`](../../docs/p2p-progress-backend-setup.md).

Quick deploy (after the Shopify app + secrets exist):
```bash
npx wrangler login
npx wrangler secret put SHOPIFY_APP_SECRET
npx wrangler secret put SHOPIFY_ADMIN_TOKEN
npx wrangler deploy
```

Secrets live encrypted in Cloudflare — never commit them, never paste them in chat.
`SHOP` / `API_VERSION` are non-secret vars in `wrangler.toml`.
