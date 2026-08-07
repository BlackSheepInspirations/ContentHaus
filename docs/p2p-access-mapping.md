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

## ✅ LOCKED — product → grant mapping (Andrea 2026-08-07, incl. renamed handles)

⚠️ **Handles were changed** during the rename — these are the NEW ones. My digital-page
snippets (`p2p-digital-access.liquid`, `p2p-membership-crosssell.liquid`) still use the OLD
handles and **must be repointed** to these.

| Product | **New handle** | Grants | Tag | Preview page |
|---|---|---|---|---|
| The Content Haus – Access Pass | `content-haus-access-pass` | Content Haus only | `prompt-haus-access` | /pages/content-haus-preview |
| The Marketing Haus – Access Pass | `marketing-haus-access-pass` | Marketing Haus only | `marketing-haus-access` | /pages/marketing-haus-preview |
| The Graphic Haus – Access Pass | `graphic-haus-access-pass` | Graphics Haus only | `graphics-haus-access` | /pages/graphic-haus-preview |
| The Project Haus – Access Pass | `project-haus-access-pass` | Project Haus only | `product-haus-access` | /pages/project-haus-preview |
| The Growth Haus – Access Pass | `growth-haus-access-pass` | Growth Haus only | **`growth-haus-access`** (Andrea updated the section) | /pages/growth-haus-preview |
| The Idea Haus: Custom GPT – Access Pass | `idea-haus-gpt` | **Frank** Custom GPT (link) | `idea-haus-access` (confirm) | none (GPT lives in ChatGPT) |
| The Build Haus: Custom GPT – Access Pass | `build-haus-access-pass` | **Ruth** Custom GPT (link) | `build-haus-access` (confirm) | none (GPT lives in ChatGPT) |
| Purpose 2 Profit OS – Access Pass | `p2p-os-access` | **FULL access to everything** → grants `all-access`. **SUBSCRIPTION (recurring)** | `all-access` | /pages/p2p-os-preview |
| The Curriculum Haus – Access Pass | `curriculum-haus-access-pass` | Curriculum prompt-gen *(NOT LIVE — coming soon)* | future | future |
| The Curriculum Haus: Custom GPT | `curriculum-haus-gpt` | Curriculum GPT *(NOT LIVE — coming soon)* | future | future |

**Brand Haus:** exists (`brand-haus-access`, /pages/brand-haus + preview) — Andrea confirmed she sees it. Product/launch status TBD (Founders Assessment = free lead magnet).

**Key notes:**
- **`p2p-os-access` = the all-access full membership, sold as a SUBSCRIPTION.** The Flow is
  different from one-time passes: add `all-access` on subscription activation, **remove it on
  cancel/lapse** (needs the subscription app's events, not just "Order paid"). ⚠️ Flag for Flows.
- Growth Haus tag standardized to `growth-haus-access` (Andrea updated the section setting).
- GPTs (Frank/Ruth): no preview page — purchase grants the ChatGPT link via `gpt-access` section.
- ⚠️ **Growth Haus lost its hero banner** (Andrea noticed) — regression to fix.

### ✅ Resolved (Andrea 2026-08-07)
- **GPT products (Frank `idea-haus-gpt` + Ruth `build-haus-access-pass`) need NO access tag** —
  they don't gate anything on the site. Purchase just **delivers the ChatGPT link** to the buyer
  (order-confirmation email / post-purchase). So: no tag, no gated page. On the digital product
  page, message "your private ChatGPT link is sent when you buy" (no preview link). The existing
  `gpt-access` section's tag-gate is NOT needed for these.
- **Brand Haus = a paid pass** granting the **full Founders Assessment + the Brand & Logo Studio**.
  Tag `brand-haus-access`, page /pages/brand-haus, preview /pages/brand-haus-preview.
  ❓ **Product handle TBD** (need to create/confirm the Brand Haus access product). *(Note: the
  free mini Founders Assessment stays a lead magnet; the FULL one is inside this paid Haus.)*

### ⏸️ Parked / still open
1. **Subscription tooling** for the OS pass (`p2p-os-access` → `all-access`) — Andrea will learn
   more. Determines the add-on-activate / remove-on-cancel Flow. Not blocking other work.
2. **Brand Haus product** — create/confirm the handle.
3. **Growth Haus hero** — Andrea saw a missing hero; the 3 growth surfaces I checked are fine —
   need the exact surface/URL.
4. **Unified "Meet the Hausen" page** — DECIDED to build (one scrolling overview: OS + 5 Hausen +
   2 GPTs), keeping per-Haus previews as deep-dives. Also the GPTs' "learn more" home.

### 🔧 Aesthetic direction (decided)
Membership/digital product + preview pages → **OS/P2P aesthetic** (black-opal, aurora, gold).
Physical merch pages → **BSCI** (snarky-faith apparel). The `product.digital` template bridges:
BSCI shell + P2P-styled content blocks.

## Downstream (depends on the above — NOT yet done)
- The digital product page's per-product **"what's inside" copy + preview link** (`snippets/
  p2p-digital-access.liquid`) and the **cross-sell list** (`snippets/p2p-membership-crosssell.liquid`)
  are currently keyed to my **best-guess** mapping. They get corrected once the table above is final.
- **Do not finalize Shopify Flows** until tags per product are locked here.
