# AI Creators Prompt Haus — project orientation

This repo holds the source for the Black Sheep Creations & Inspirations Shopify
store: five "Hausen" tools (Content/Prompt, Project, Graphics, Marketing, Brand)
plus two separate P2P products. Vanilla JS + Liquid sections, no bundler/build.

## Reference docs — read these before rebuilding anything P2P

- **`docs/p2p-learning-journey-reference.md`** — the **Purpose 2 Profit Learning
  Journey**: the gamified course platform (journey board, course player, badges,
  points, streaks). Covers every file, the shared progress engine
  (`assets/p2p-progress.js`, `window.P2P`), the full localStorage schema, the
  points economy, all badges, and the deploy steps. Start here for anything
  Learning-Journey-related.
- **`docs/p2p-integration-reference.md`** — a *different* product: the **Prompt
  to Profit Haus** generator tool (`#p2p-haus-app`). Don't confuse the two.
- **`docs/*-access-control-setup.md`** — per-Haus Shopify access-tag/Flow setup.

## Deploy (no CI/CD — manual two-hop)

1. Edit here. 2. `shopify theme push --theme 186593542462 --allow-live --nodelete --only <file>` (live theme "BSC+BSI Store — Prompt Haus", store `blacksheepcreationsllc.myshopify.com`; the "not a theme directory" warning is harmless with `--only`). 3. Copy the same files into the staging mirror `/Users/blacksheepcreations/BSC-BSI-Store-theme` so a later full push can't delete them. The store is password-locked, so "live" is owner-only for now.

## CSS isolation

Each surface is selector-prefixed so nothing leaks: Learning Journey `#p2pj`,
course player `#p2pp`, badges `#p2pb`; the Prompt-to-Profit tool `#p2p-haus-app`.
