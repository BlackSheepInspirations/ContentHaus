# BSC Storefront — Audit & Launch Punch List

A living audit of the **public storefront** (the customer-facing site, as opposed to the
gated P2P member tools). Goal: get it launch-ready — the store is going public in **~weeks**.
Same method as `generator-inventory.md`: walk it, capture reality, prioritize, execute.

Started 2026-08-07. Walked the **live, unlocked** site as a logged-out visitor.

> **Where things live:** the storefront base theme (homepage `index.json`, `product`,
> `collection`, `password`, header/footer, section library) is in the **mirror**
> `/Users/blacksheepcreations/BSC-BSI-Store-theme`, **not** the main repo. The P2P
> `*-preview` pages + sections are in **both**. ⚠️ Base-theme files are currently
> mirror-only (not under git) — bring the ones we edit into version control.

---

## The big picture

BSC is **two businesses on one storefront**:
1. **The POD product store** — bold/snarky/faith apparel + digital downloads. **Mature & on-brand.**
2. **The P2P membership** — the OS, Learning Journey, 5 Hausen tools. Sold via **9 "access pass" products** + `*-preview` sales pages.

**The core problem is the seam between them.** The storefront barely acknowledges the
membership exists, and the membership's product pages are on the wrong (physical) template.

---

## Findings by area

### 1. Homepage (`index.json`) — GOOD, but 100% merch
Fully built and cohesive: marquee → hero ("Designed for the One / Bold, snarky, faith-rooted
designs for those who don't follow the herd") → "Pick Your Vibe" category grid → New Drops →
Best Sellers → newsletter (20% off) → "Why the Flock Shops Here" (Made-to-Order · Veteran-Owned ·
Designed to Stand Apart · Supporting Real Causes) → mission → FAQ links. Strong.
- 🔴 **Zero P2P presence** — never mentions the membership, OS, Learning Journey, or Hausen.
- 🟠 Category grid advertises **empty collections**: Lil Fuzzy Flock (0), The Military Files (0),
  Wool @ Work (0), Heard by the Herd (0). Only Snark & Wool (2) + The Flock Files (10) have items.

### 2. Navigation & footer — the #1 structural gap (Andrea's flag)
Header: **BSC Home · Shop By Collection · The Flock Files · About Us · Search**. Footer + header
liquid contain **no** P2P / OS / Learning / Members links (confirmed in code + render).
- 🔴 **No way to reach the P2P OS / member area from any storefront page.** (Andrea: "we
  definitely need a way to find the P2P OS system from any page.")
- 🟠 "The Flock Files" is doing double duty (see §4) — confusing IA.

### 3. Collections — polished, but thin catalog + mislabeled
Custom branded banners per collection (e.g. Flock Files "Digital Downloads / Wool of Wisdom"
with the bespectacled black sheep) — good production value.
- 🟠 4 of 6 homepage categories are **empty** (0 items) — populate or hide before launch.

### 4. 🔴 The P2P funnel is buried in "The Flock Files"
`/collections/the-flock-files` actually contains the **membership access-pass products**:
`p2p-access-pass`, `the-ai-creators-prompt-haus-access-pass`, `…-marketing-haus-…`,
`the-graphic-haus-access-pass`, `the-product-haus-access-pass`, `build-haus-access-pass`,
`curriculum-haus-access-pass`, `idea-haus-gpt`, `curriculum-haus-gpt`.
So the buy-flow **exists as products** — but it's filed under a collection the homepage brands
generically as "Digital Downloads." A visitor would never connect that to the membership.

### 5. 🔴 Digital / access-pass product pages are broken (LAUNCH BLOCKER)
Sampled **The Prompt 2 Profit Haus – Access Pass** ($197, "60% OFF" from $497.99):
- **"PHOTO COMING SOON"** placeholder as the main (only) image on the flagship product.
- Rendered on the **physical-product template** → shows *"Estimate delivery times: 12–26 days
  (International), 3–6 days (US)"*, *"Duties & taxes non-refundable"*, *"Return within 30 days"* —
  **shipping/customs language on a digital membership.** Nonsensical + trust-killing.
- No "what's included / instant access / how to get in / link to the preview page" content.
- Same template → same problem across **all 9 access-pass / GPT products.**

### 6. Physical product pages — AUDIT (2026-08-07)
Catalog: **49 products** = 10 access-pass/GPT + **39 merch** (37 are T-Shirts; theme is
adventure/outdoor/fishing/coffee-heavy — lighter on the "faith/snark" the brand leads with).
Rendered "All American Mama Tee" (87 imgs / 96 variants) as a representative page.

**Findings:**
- 🔴 **Color swatches render as blank grey circles** — the theme isn't mapping the Printify
  color names to real colors, so a shopper can't see any color. **Biggest fixable page issue.**
- 🟠 **Image-gallery overload** — products sync **24–87 images** each (Printify dumps every color's
  mockups). Overwhelming + slow. Needs curation to a lead set (lifestyle + a few key colors +
  a size chart), which is mostly a Printify-sync setting + maybe a template display cap.
- 🟠 **Catalog hygiene:** a live **"Copy of I'd Rather Be Lost T-Shirt"** draft
  (`copy-of-id-rather-be-lost…`) should be deleted/renamed; "Houston, I Might Be the Whole
  Problem" has no product_type + 1 variant (check it's set up right); the OS access product has
  **0 images** (needs its digital-page image).
- 🟢 **Descriptions exist** and are reasonable length (~1,000–2,600 chars) — a consistency/on-brand
  pass is polish, not a blocker.
- 🟢 Layout is otherwise clean (lifestyle hero, size buttons XS–4XL, qty, sticky ATC).
- Minor: an empty/broken thumbnail box top-left of the gallery.

**Prioritized punch list (product pages):**
1. 🔴 **Fix color swatches** (code) — map color names → real swatches so shoppers see colors. Top win.
2. 🟠 **Curate images** — cap/curate the mega-galleries (Andrea's Printify sync + possibly a template limit).
3. 🟠 **Catalog hygiene** (Andrea, admin) — delete the "Copy of" product; check the typeless one; OS image.
4. **P2P cross-sell on merch pages** (code) — a small "psst, there's a whole creator OS" nudge, mirroring the homepage bridge, so merch shoppers discover the membership.
5. Polish: description on-brand consistency; the empty-thumbnail glitch.

### 7. Preview / sales pages — built, need a wiring + quality check
Real content (not stubs): `p2p-os-preview` (263 lines), `brand-haus-preview` (203) are deep;
`prompt/marketing/graphics/product/p2p-haus` previews (~110 lines each) are a shared moderate
pattern. TODO: render-walk logged-out + verify each **buy button → the right access product**
and each links **back to the store + into the OS**.

---

## Prioritized punch list

### 🔴 P0 — launch blockers
1. **Fix the digital/access-pass product experience.**
   - ✅ **DONE (2026-08-07) — template built + verified via `?view=digital`.** New
     `templates/product.digital.json` (mirror): removes `delivery_return` / `countdown_timer` /
     `quantity_selector`, turns off the delivery link, adds a `custom_liquid` block →
     `snippets/p2p-digital-access.liquid` (instant-access bar + per-product what's-included +
     "See everything inside" button, handle-keyed to the verified preview pages), and swaps the
     random-merch related row for `snippets/p2p-membership-crosssell.liquid` (the other 8 passes,
     current excluded, priced, linking to each product). Copy is a DRAFT — edit in the snippet.
   - ⏳ **TODO (Andrea, admin):** (a) **assign the 9 access-pass/GPT products to the "digital"
     template** (Products → each → Theme template → `digital`); (b) **replace "PHOTO COMING
     SOON"** with real/branded images per product. ⚠️ 3 base-theme files edited **mirror-only** —
     bring under version control.
2. **Global P2P entry point** *(Andrea's flag).*
   - ✅ **DONE (2026-08-07) — footer:** persistent `.hdt-p2p-entry` aurora bar added to
     `sections/footer.liquid` (mirror), on **every** storefront page, → `/pages/p2p-os`
     (self-routes: members → OS shell, visitors → sales preview). Deployed live + verified.
     ⚠️ Base-theme file — edited in the **mirror only**; bring under version control.
   - ⏳ **TODO — header (admin, ~2 min, Andrea):** add a top-level Main-menu item
     "Purpose 2 Profit" → `/pages/p2p-os` (Online Store → Navigation → Main menu). The
     header nav is an admin-managed menu, so this is content, not code.
3. **Empty collections** — hide the 4 zero-item categories from the homepage grid (or populate),
   so launch doesn't show dead ends.

### 🟠 P1 — high impact
4. **Homepage membership bridge** — a section that introduces the P2P world (OS + Hausen +
   Learning) and routes to it, so the store cross-sells the membership.
5. **Product-page overhaul — all items** (Andrea's ask) — description quality, imagery, sizing/
   care, trust, cross-sell; per §6.
6. **IA cleanup** — separate the **membership/access** offering from the **digital-download
   merch** (they're both under "The Flock Files" now). Clear collection(s) + nav.
7. **Preview-page wiring/quality pass** — verify buy buttons → correct products; links back to
   store + OS; render well logged-out.

### 🟡 P2 — polish
8. Cross-storefront consistency (typography/spacing/CTA style between merch pages and P2P pages).
9. Password page (pre-launch "coming soon") — confirm it's on-brand for any relock windows.
10. SEO/meta + the search-hiding rules from `p2p-launch-checklist.md` §3b for gated pages.

---

## Suggested starting point
**P0 #1 + #2 together** — they're the launch-critical seam: make the membership *buyable*
(fix the digital product pages) and *findable* (global nav entry). Everything else builds on a
site where the two businesses are actually connected.
