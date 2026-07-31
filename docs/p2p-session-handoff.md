# Purpose 2 Profit — Session Handoff (2026-07-31)

Read this first in a fresh conversation, alongside the auto-loaded memory
(`memory/MEMORY.md` + files), `docs/p2p-os-build-plan.md`, and
`docs/p2p-launch-checklist.md`. Everything below is committed + live.

## Owner / voice
Andrea (admin@blacksheepcreations.com). Warm, high-energy, calls me "friend."
Copy voice = **quiet authority** (warm, reassuring, expert; no hype). Deadline is
**past due** — she's on a Max plan, wants momentum, will pay overages.

## Deploy (NO CI/CD — manual two-hop, per file)
1. Edit here. 2. `shopify theme push --theme 186593542462 --allow-live --nodelete --only <file>`
(live theme "BSC+BSI Store", store `blacksheepcreationsllc.myshopify.com`; the
"not a theme directory" warning is harmless). **Multiple `--only` flags only honor
the LAST — push files SEPARATELY.** 3. Copy each file to the mirror
`/Users/blacksheepcreations/BSC-BSI-Store-theme/` so a later full push can't delete it.
- **Theme editor REVERTS CLI-pushed JSON templates** → for `templates/*.json`,
  verify-by-pull (`shopify theme pull --theme 186593542462 --path <scratch> --only <file>`).
  Bake content into sections where revert-proofing matters.
- Store is **password-locked (owner-only)** but "live." Gated pages (Journey,
  realms, Milestones, courses, Haus tools) show a locked state to anonymous —
  can't be screenshot-verified without login; verify those by code + pull-back.
  The OS page (`/pages/p2p-os`) + tutorial + previews DO render for anonymous.

## Hard-won gotchas
- **Shopify blocks iframing its OWN pages** (`X-Frame-Options: DENY`) — the OS
  can't embed the Hausen. But embedding **external** sites INTO Shopify works
  (flipbooks, Canva, a community platform). Verified.
- **Naming (LOCKED):** stylized **Purpose 2 Profit** (aurora "2"); **Growth Haus**
  (was p2p-haus / "Prompt to Profit"); **Project Haus** (was product-haus);
  **Content Haus** (was prompt-builder / "Prompt Haus"); **ROOTED** (was PROFIT,
  the 6-stage launch method: Reach·Open·Offer·Trigger·Escalate·Deepen);
  **Status Checks** (journey Mindset/Purpose/Heart checkpoints); **Daily Boosters**
  (the daily rotating Heart/Purpose/Mindset cards, was "Daily Mindset Moment").
  Live handles: brand-haus, content-haus, graphics-haus, project-haus,
  marketing-haus, growth-haus (old product-haus/p2p-haus redirect). Access tags:
  brand-haus-access, prompt-haus-access, graphics-haus-access, product-haus-access,
  marketing-haus-access, P2P-haus-access; journey/courses = `p2p-learning`.
- Haus Mates: **Frank** = The Idea Haus GPT (Creative Director), **Ruth** = The
  Build Haus GPT (Design Meister). Seals: assets/haus-mate-idea.png / -build.png.

## DONE this session (all committed + live)
- **P2P Operating System** (`sections/p2p-os.liquid`, `/pages/p2p-os`): full
  sidebar-shell home base. Persistent fixed rail on every Haus page via
  `snippets/p2p-os-nav.liquid` (rendered from `snippets/haus-links.liquid`). Views:
  Journey-home (hero + Brand-DNA card + Daily Boosters carousel + live stats +
  road-ahead + reassurance + FAQ), Vault (cross-Haus dashboard, `assets/p2p-os-vault.js`),
  Checkpoint, Founders Assessment, 6 Hausen, ROOTED, Haus Mates (real seals +
  external-link modal), Community (embed slot), Tools, Notebook, Bonus (first
  freebie = Journal Creator Vol 1 Canva link).
- **Clickable stat pop-ups** — shared `assets/p2p-progress-popups.js` + `.css`
  (`window.P2PProgressPopups.mount`), OS chips/ring open Points/Badges/Streak/
  Merit/Courses detail (ported from the Journey; Journey untouched).
- **Road-ahead map wired** to real cross-Haus signals (p2p_archetype, brand-kit
  vault, `<haus>RecentLog`, growth rootedStages).
- **Tutorial page overhaul** (`sections/p2p-tutorial.liquid` + `templates/page.p2p-tutorial.json`):
  nav (back-to-OS/Journey + 'i' help), Haus Helper, and rewritten copy (Open
  Water→Evergreens, Status Checks, Daily Boosters, Journal=4 spaces, dropped
  "45 in all", static-board fix). NOTE: section PRESET still holds old copy
  (dormant; live uses the template).
- **Haus Helper** = `snippets/p2p-helper.liquid` — floating rule-based (decision
  tree, NO AI, $0) help widget with the BSC sheep avatar. Site-wide (via
  haus-links) + OS + tutorial + realm maps + Milestones. KB includes billing/
  account branch. Every path ends in a mailto human fallback.
- **Daily Boosters rotation** on the OS hero AND all realm maps (journey
  `.mindset-moment` now rotates Heart/Purpose/Mindset like the OS). Libraries
  grown: p2p-purpose.js 199, p2p-heart.js 200, p2p-moments.js 530.
- **Course player** (`sections/p2p-learning-player.liquid` + `assets/p2p-player.css`):
  scrolling lesson sidebar; per-lesson **Downloads** (dl_1..3) + **Embed slot**
  (embed_url/ratio — flipbooks/Canva). Flipbook verified live in demo course
  (`templates/page.p2p-course.json` lesson 1 = "What POD Actually Means").
- **Testimonials** (`sections/p2p-testimonials.liquid` + page.testimonials.json) —
  curated, never auto-public.
- **Journey Recap shareable** (Share button: navigator.share / clipboard).
- Misc OS: "Born an Original" reassurance, hero 'i' help, "Show me around" → tutorial,
  scroll-jump + refresh(?v=) bug fixes, os_url → /pages/p2p-os.

## OPEN DOCKET (next up — nothing started)
1. **Course build-out (likely critical path):** Open Water (Realm 1) has 11 course
   PAGES live at `/pages/courses-<handle>` but they're on the DEFAULT template (no
   player). Each course needs its OWN template (lessons live in the template).
   Plan: auto-generate `templates/page.courses-<handle>.json` from `assets/p2p-journey-map.js`
   (pre-wired: course player section, course_title, course_handle=map handle,
   access_tag `p2p-learning`, back_url /pages/p2p-learning, os_url /pages/p2p-os,
   empty lesson slots) → Andrea assigns each page its template + adds lessons.
   Also: **`what-every-product-needs`** appears in Realm 2 (digital) AND Realm 3
   (POD) with the SAME handle — Andrea will give two distinct handles; update the
   map AND the realm-2/3 board-marker templates in sync.
2. **Haus rebuilds (luxe):** rebuild the 6 Haus tool standalone pages to the OS
   aesthetic + fix stale naming still in `sections/p2p-haus.liquid` (Growth) &
   `sections/prompt-builder.liquid` (Content) — ~15 visible strings ("Prompt to
   Profit Haus", "PROFIT Path", one "Product Haus", "Prompt Haus").
3. **#9 Haus Helper free-type search:** KB source MAPPED — each Haus keeps a
   `FAQ_ITEMS` array ([{q,a}]) + `TIPS` array in its `*-ui.js` (Content
   prompt-builder-ui.js = 9 TIPS + ~25 FAQ; brand-haus-ui.js = FAQ_ITEMS(10)+tips;
   p2p-haus.js ~15; product/marketing/graphics-haus-ui.js a few) + OS FAQ (7 in
   p2p-os.liquid) + Brand preview FAQ (7 in page.brand-haus-preview.json) + Journey
   info_body. BUILD: compile → `assets/p2p-faq-kb.js`; add "type your question" box
   to p2p-helper.liquid that keyword-matches; misses → mailto. No FAQ writing needed.
4. **#11 Brand identity → OS:** archetype hero card only populates when the Founders
   Assessment completes (writes `p2p_archetype` via publish hook in
   brand-haus-founderinterview.js). Saving a brand kit does NOT. Wire brand-kit
   save to also publish p2p_archetype. DESIGN CALL: should the OS recolor from the
   member's brand-kit colors, or keep its own aurora identity? (Currently its own.)
5. **#12 Checkpoint flip cards (LATER):** the "Meet your Hausen" cards on the
   Checkpoint view should flip/pop to reveal more about each Haus.
6. **Design calls:** OS color-porting (see #4); a real **tagline** for Purpose 2 Profit.

## Pre-launch (from docs/p2p-launch-checklist.md)
- **Cross-device progress backend** (the big one): App Proxy `/apps/p2p/progress` +
  Cloudflare Worker + customer metafield `custom.p2p_progress`. Andrea creates a
  custom app in admin + hands ONE token (NEVER pasted in chat — goes to Cloudflare
  secrets only). Updates `assets/p2p-progress.js` to load/debounce-save server side.
- Check-badge taxonomy input (Mindset/Purpose/Heart check ids). Certificate backfill.
- Course pages assigned templates (see docket #1). Realm gating order — confirm
  realms unlock progressively (currently some gate on `storefront-essentials`).

## Hosting model (for course media)
- **Video:** external host (YouTube-unlisted to start → Vimeo or Cloudflare Stream
  for paid; Stream ≈ $1/1000 min watched, scales with revenue; R2 free-egress is
  the escape hatch at huge scale). Player has a `video_embed` iframe field.
- **Files/downloads:** external (Canva link works; Cloudflare R2 free 10GB, free
  egress). Player lessons have Download fields + a generic Embed slot for flipbooks.
- **Community:** embed Circle/Bettermode into the OS Community view (external embed OK).
