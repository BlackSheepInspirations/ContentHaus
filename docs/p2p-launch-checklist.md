# Purpose 2 Profit — Pre-Launch Checklist

Things to finish before the Learning Journey goes public (the store is currently
password-locked / owner-only, so none of this blocks internal testing).

## 1. Cross-device progress (the big one) — "get it off our plate"

**Problem:** all progress (courses done, streak, points, badges, journal, wins,
certificates) lives in the browser's **localStorage** — per-browser, per-device.
Switch devices or clear the browser and it's gone. It doesn't follow the person.

**Why no off-the-shelf app fits:** LMS apps (Tevello/Courses, Courses Plus,
Thinkific, etc.) *do* save progress per customer across devices — but only for
*their* course player and UI. None can sync our custom realm board / badges /
journal, because that's bespoke code. Using one would mean rebuilding courses
inside their app and giving up the custom journey. So this is **build, not buy**.

**Plan (keep the custom journey, add sync for logged-in members):**
1. **Shopify App Proxy** — the theme calls `/apps/p2p/progress`; Shopify signs the
   request with the logged-in customer's id, so the backend knows who it is
   securely (no passwords through the theme).
2. **Storage** — start with a **customer metafield** (`custom.p2p_progress`, one
   JSON blob per customer). No separate database. Upgrade to a real DB later only
   if needed.
3. **Hosting** — a small serverless function (recommend **Cloudflare Workers**,
   free tier). Endpoints: `GET` (load blob for logged-in customer) and `POST`
   (save blob).
4. **Theme integration** (Andrea doesn't touch this — it's the dev side): update
   `assets/p2p-progress.js` so that, for logged-in members, it **loads server
   progress on page open** and **debounced-saves on every change**, keeping
   localStorage as an offline cache. Guests keep localStorage only.

**STATUS (2026-08-01): ✅ DONE & VERIFIED.** Worker deployed, App Proxy configured,
signature check passing, AND the logged-in round-trip **tested by Andrea — progress
follows across devices.** Deployed Worker mints its Admin token via the
client_credentials grant (no separate store token needed); vars live in the Cloudflare
dashboard. Repo copy in `backend/p2p-progress-worker/` matches the live version. Full
notes in **`docs/p2p-progress-backend-setup.md`**. Nothing left here.

**Correction:** App Proxy CANNOT be configured on a store "Develop apps" custom app
— it needs a **free Shopify Partner-dashboard app** (no fees/review). The Admin API
token still comes from installing that app on the store.

**What Andrea needs to do (see the setup doc for click-by-click):**
- Create a free **Cloudflare** account (hosts the Worker) and a free **Shopify
  Partner** account (hosts the app with App Proxy).
- Create the Partner app: scopes `read_customers` + `write_customers`, App Proxy
  subpath `apps/p2p`, install on the store.
- Deploy the Worker (`wrangler deploy`) and set two secrets in Cloudflare
  (`SHOPIFY_APP_SECRET`, `SHOPIFY_ADMIN_TOKEN`) — **never pasted in chat**.
- Point the App Proxy URL at the deployed Worker; (recommended) add the
  `custom.p2p_progress` JSON metafield definition on Customers.
- Storage decision: **metafield** to start (chosen).

**When:** matters once real customers log in from more than one device — i.e.,
just before public launch. Not urgent while password-locked.

## 2. Other pre-launch items

- **Assign templates to pages** in admin: `p2p-realm-2/3/4/5` → `/pages/realm-2..5`.
- **Create course pages** (`/pages/courses-<handle>`) using the course-player section.
- ~~**Auto-award realm / framework / capstone badges**~~ ✅ DONE — `reconcileMapBadges()`
  in `assets/p2p-progress.js` awards realm-completion (all Main courses of a realm
  done), Framework Masters (raft/grows/rooted anchor course done), *Reached Freedom*
  (all five realms), and *Every Path Walked* (every course incl. offshoots). Runs on
  load wherever `window.P2P_MAP` is present. Verified via `dev/badge-check.html`.
- **Check badges still need Andrea's input:** Mindset/Purpose/Heart I·II + Clear
  Mind/True Purpose/Open Heart aren't auto-wired because the Check taxonomy is
  unknown to the engine — need the exact Check titles and how many of each
  category exist (they're `check` blocks in the journey section). Once known, map
  `checksDone` ids → these badges in `reconcileMapBadges()`.
- ~~**Dynamic badge counter**~~ ✅ Already live — `assets/p2p-badges.js` recomputes
  `earned/total` from the DOM after applying auto-earned badges and updates the
  summary ring + text (lines ~68-78).
- **P2P Operating System page** — build the page (or repoint the hero back-link
  `os_url`, currently `/pages/p2p-operating-system`).
- **Certificate backfill:** certs only record from the deploy onward; past
  completions won't show until re-completed unless we backfill.
- **Mindset Moment library → 500:** currently ~120 items in `assets/p2p-moments.js`;
  grow in ~100-item batches (say "keep going").

## 3. Access gating for launch — every page must gate (storefront-searchable)

**Why (Andrea, 2026-07-31):** all P2P pages are searchable in the Shopify
storefront, so a non-member can land on any of them. Before launch, EVERY content
surface must gate on the member's tag — its own access tag **or** the master
**`all-access`** tag — so found pages don't leak content.

**The shared gating framework** (Andrea confirms the Journey was updated to match the
Hausen — this is the canonical pattern to follow). Every gated section does:
```liquid
{%- assign has_access = false -%}
{%- if customer and customer.tags contains section.settings.access_tag -%}{%- assign has_access = true -%}{%- endif -%}
{%- if request.design_mode -%}{%- assign has_access = true -%}{%- endif -%}
```
Confirmed present in: `p2p-learning-journey.liquid`, `p2p-learning-player.liquid`,
`p2p-learning-badges.liquid`, and each Haus tool (`prompt-builder.liquid` uses
`ph_has_access` = `customer.tags contains access_tag` + design_mode; the others follow suit).

**`all-access` is NOT wired (confirmed by Andrea 2026-07-31).** The only place it
appears is the OS *nav* (`snippets/p2p-os-nav.liquid`, `sections/p2p-os.liquid`:
`owns_all = customer.tags contains 'all-access'`) — and that only controls whether a
sidebar item LOOKS locked. It does NOT gate the destination page. So an all-access
member still hits each page's own tag-gate and is locked out.

**DONE (2026-07-31, commit 8a905e3):** every gated section now honors `all-access` —
the course player (all 52 courses), Journey, Milestones, and all 6 Haus tools (crown
jewel via its case-insensitive match). Realms inherit via the journey section. Only
remaining for this: Shopify Flow must add the `all-access` tag on that purchase.

~~**Launch task:** extend the shared framework so every gated section's `has_access`
also honors all-access, i.e. add to each:~~
`{%- if customer and customer.tags contains 'all-access' -%}{%- assign has_access = true -%}{%- endif -%}`
(ideally via a shared `all_access_tag` setting, default `all-access`). Sweep: the 6
Haus tools + preview pages, `p2p-learning-*` (journey/player/badges), all 52
`page.courses-*` (they use the player, so fixing the player section covers them), and
the realm templates. Then wire Shopify Flow to add `all-access` on the all-access
purchase. NOTE: this is small + low-risk (one OR-branch per section) and could be done
now if Andrea wants, but she's scoped it as an after-everything-is-built sweep.

### 3a. OS page must require login — DECIDED (Andrea 2026-07-31)

The OS page (`/pages/p2p-os`) must gate like the Hausen: logged-out / non-members see a
**preview** (marketing + "get access" purchase link), not the shell. TO BUILD: (a) add
the shared `has_access` gate to `sections/p2p-os.liquid` (currently ungated — renders the
shell to anyone); (b) build an **OS preview page/section** modeled on the Haus previews
(`sections/p2p-haus-preview.liquid` + `templates/page.*-preview.json`) — needs an **OS
access product** for the "Get Access" button; (c) the locked state links to that preview.
The OS itself STAYS searchable (entry point; non-members get the preview).

### 3b. Hide gated pages from search — DECIDED (Andrea 2026-07-31)

**Keep searchable:** P2P OS + the 6 Haus tool pages only. **Hide everything else P2P:**
the 52 `courses-*`, realms, Journey, Milestones, tutorial, demo course (decide: Haus
*preview* pages — likely keep, they're the sales pages). Two layers, BOTH in the BASE
THEME (which lives in the staging mirror `/BSC-BSI-Store-theme`, NOT this repo):
- **Shopify storefront search** (the real concern): `sections/main-search.liquid` builds
  `search_pages_list = search.results | where:"object_type","page"` and renders it ~L518
  (`{% for page in search_pages_list %}`); also `sections/hdt_predictive-search*.liquid`.
  Add a skip for gated handles (prefixes `courses-`, `realm-`, `p2p-learning`,
  `p2p-tutorial`, `p2p-course`), keeping p2p-os + the Hausen.
- **SEO / Google** (secondary): `<meta name="robots" content="noindex">` in
  `layout/theme.liquid` head, conditional on the gated page templates.
- CAVEAT: base-theme files are mirror-only (not in this repo) — consider bringing them
  under version control if we edit them.

**At launch:** sweep every page template + section, confirm the tag-gate (+ all-access)
is present, and that Flow grants the right tags on purchase.

## 4. ~~Known bug — panel-switch scroll~~ ✅ FIXED

Clicking a nav tab now scrolls the toolbar to pin at the top with the panel title
just beneath it — consistently, no bounce. Fix (in `assets/p2p-journey.js` +
`.css`): a single scroll to a *stable* target (`panelDocY - stickyOff - barH + 2`;
panelDocY is constant because the bar/spacer always occupies barH before the panel,
so no re-measuring/feedback loop = no bounce), plus a `min-height:calc(100vh - 40px)`
on `.panel` so even short panels (Progress/Bonuses) have room to pin the bar the
same way tall ones do. Verified against a faithful sticky-bar mock.
