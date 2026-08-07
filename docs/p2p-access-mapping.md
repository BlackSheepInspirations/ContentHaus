# P2P Access Mapping — products → tags → pages → Flows

The single source of truth for how a purchase unlocks a surface. Built from the live theme
code 2026-08-07 while sorting the "Prompt 2 Profit Haus → Growth Haus" rename. **Confirmed**
rows are read from code; **❓ rows** are open questions for Andrea before we finalize Flows.

## How gating works (confirmed)
Each Haus section checks `customer.tags contains <access_tag>` **OR** `all-access` (master),
plus `request.design_mode` (editor bypass). A Shopify **Flow** (Order paid + line-item is the
access product → Add customer tag) grants the tag. The OS (`/pages/p2p-os`) shows the shell to
anyone holding **any** Haus/journey tag or `all-access`, else redirects to `/pages/p2p-os-preview`.

## The clean part — the 5 creator Hausen (confirmed from code)

| Haus | Tool page | **Access tag** | Preview page | Access-pass product (handle) |
|---|---|---|---|---|
| **Content Haus** (Prompt Haus) | /pages/content-haus | `prompt-haus-access` | /pages/content-haus-preview | `the-ai-creators-prompt-haus-access-pass` |
| **Marketing Haus** | /pages/marketing-haus | `marketing-haus-access` | /pages/marketing-haus-preview | `the-ai-creators-marketing-haus-access-pass` |
| **Graphics Haus** | /pages/graphics-haus | `graphics-haus-access` | /pages/graphic-haus-preview | `the-graphic-haus-access-pass` |
| **Project Haus** | /pages/project-haus | `product-haus-access` | /pages/project-haus-preview | `the-product-haus-access-pass` |
| **Brand Haus** | /pages/brand-haus | `brand-haus-access` | /pages/brand-haus-preview | ❓ **no product found** |

## The Journey + OS (confirmed)

| Surface | Page | Tag |
|---|---|---|
| **Learning Journey** (+ realms, player, badges) | /pages/p2p-learning (+ realm-2..5) | `p2p-learning` |
| **P2P OS** (member hub) | /pages/p2p-os | any Haus/journey tag **or** `all-access` |
| **Master unlock** | everything, incl. OS shell | `all-access` |

## 🔴 The tangle — "Growth Haus" / "P2P Haus" / "Build Haus"

Three names, overlapping. What the code actually says:
- **`sections/p2p-haus.liquid`** (page `/pages/p2p-haus`, tag **`P2P-haus-access`**) — its own preview
  copy reads *"The Growth Haus turns your product into a full, on-brand launch kit… a day-by-day
  ROOTED plan."* → **this section IS the Growth Haus (ROOTED launch cockpit).**
- **`sections/growth-haus.liquid`** (page `/pages/growth-haus`) — also exists; no access-tag gate
  found. Possibly the legacy/older Growth Haus, or a duplicate.
- **`/pages/p2p-haus-preview`** 301-redirects to **`/pages/growth-haus-preview`**.
- Products: **`p2p-access-pass`** ("The Prompt 2 Profit Haus – Access Pass") — Andrea: rename to
  **Growth Haus**, grant the **Growth Haus tool only**; AND a separate **`build-haus-access-pass`**.

### ❓ Open questions to resolve before Flows
1. **Which page is the real Growth Haus** members use — `/pages/p2p-haus` (tag `P2P-haus-access`,
   the ROOTED cockpit) or `/pages/growth-haus`? The other should be retired/redirected.
2. **`p2p-access-pass` (→ "Growth Haus")** — its Flow should add **which tag**? Recommend
   standardizing on a clean **`growth-haus-access`** and pointing the Growth Haus section at it
   (instead of the confusing `P2P-haus-access`).
3. **`build-haus-access-pass`** — what is it? (a) a duplicate of the Growth pass → retire; or
   (b) something else (e.g., the **full all-access bundle** → adds `all-access`)?
4. **The full "all-access" membership** — **which product adds `all-access`?** This unlocks
   everything + the OS shell + drives the cross-sell "full membership" card. If `p2p-access-pass`
   used to be it and is now Growth-only, **we need a dedicated all-access product.**
5. **Brand Haus** — is there an access-pass product? (tag `brand-haus-access` exists; no product seen.)
6. **Curriculum Haus / the GPT products** (`curriculum-haus-access-pass`, `curriculum-haus-gpt`,
   `idea-haus-gpt`) — do these gate a theme page (need a tag) or just deliver a GPT link on purchase
   (no gate)? What tag(s), if any?

## Downstream (depends on the above — NOT yet done)
- The digital product page's per-product **"what's inside" copy + preview link** (`snippets/
  p2p-digital-access.liquid`) and the **cross-sell list** (`snippets/p2p-membership-crosssell.liquid`)
  are currently keyed to my **best-guess** mapping. They get corrected once the table above is final.
- **Do not finalize Shopify Flows** until tags per product are locked here.
