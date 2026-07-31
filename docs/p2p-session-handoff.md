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

## OPEN DOCKET
1. **Course build-out — TEMPLATES DONE (2026-07-31).** Generated all **52**
   `templates/page.courses-<handle>.json` (Realm1=11, R2=15, R3=8, R4=10, R5=8)
   from `assets/p2p-journey-map.js`, pushed live + mirrored + committed (5454d26).
   Each is pre-wired to the P2P Course Player: kicker "Realm N · Name", course_title,
   course_handle, realm back_url, os_url /pages/p2p-os, access_tag `p2p-learning`,
   one starter lesson slot. Duplicate handle resolved: Realm 3's POD "What Every
   Product Needs" → **`what-pod-products-need`** (map + realm-3 marker updated).
   Generator script: scratchpad/gen_courses.py.
   **ANDREA'S REMAINING MANUAL STEPS (Shopify admin, per course):** (a) create the
   page at handle `courses-<handle>` if it doesn't exist yet — Realm 1's 11 pages
   already exist but on the DEFAULT template; (b) in the page editor, assign template
   `page.courses-<handle>`; (c) open the theme customizer for that page and fill the
   lesson blocks (video embed, body, links, downloads, flip-book embed). Templates
   are NOT browser-verifiable until a page is assigned — nothing consumes them yet
   except the demo `page.p2p-course`.
   NOTE: course `marketing-haus` (Realm 5) → page `/pages/courses-marketing-haus`,
   distinct from the Marketing Haus TOOL at `/pages/marketing-haus`. No collision.
2. **Haus rebuilds (luxe):** — **NAMING PASS DONE (2026-07-31, commit 5b81725).**
   All visible stale strings fixed: crown jewel `p2p-haus` (wordmark/footer/schema/
   locked copy/PDF export) → **Growth Haus**; its method → **ROOTED** (Reach·Open·
   Offer·Trigger·Escalate·Deepen), replacing the old PROFIT/Prime-Reveal-Offer-Flood-
   Ignite-Tend copy in `p2p-haus-preview`; `prompt-builder` + preview → **Content
   Haus**; a "Product Haus" ref → **Project Haus**. Comment headers note "formerly".
   localStorage keys `promptToProfit.*` left untouched (member data). The ~62 JS
   "Prompt Haus" hits are code-architecture COMMENTS (invisible) — intentionally left.
   **VISUAL REBUILD — HERO PASS DONE (2026-07-31).** Direction from Andrea: pilot
   one, then roll out; reskin the CHROME only (never the widgets); per-Haus palette
   made shimmery — each Haus's signature color DOMINANT + shared aurora/opal
   highlights. Delivered: the shared `.XX-marketing__hero` is now a black-opal band
   with a signature-dominant aurora shimmer + opal "fire" specks (moving sheen +
   specks are the shared layer; band/glows/accent/CTA use the dominant). Colors:
   Content=teal, Brand=teal, Graphics=violet, Project=blue, Marketing=magenta.
   Growth (crown jewel) already had the fullest opal-aurora hero — left as-is (it's
   the reference the others were brought up to). Shimmer accent scoped inside the
   hero so locked-state headings keep their on-cream color; per-prefix keyframes;
   prefers-reduced-motion respected; brand-header overflow relaxed for the shadow.
   FUN-SHIMMER v2 (779d4ad): livelier moving sheen, TWINKLING opal specks
   (opacity+scale pulse), white sparkles, shinier accent — all 5 siblings.
   Brand flipped teal -> GOLD (the one unused aurora color) so it no longer
   overlaps Content's teal; Brand hero + locked accent + locked heading base
   are gold/neutral now. Colors final: Content=teal, Brand=GOLD, Graphics=violet,
   Project=blue, Marketing=magenta, Growth=emerald/opal (crown jewel, already fun).
   Commits: b8eb5f6, 02ce440, d6730ba, 779d4ad. Scripts: scratchpad/reskin_hausen.py
   + fun_shimmer.py; harness dev/haus-reskin.html. Live-verified.
   NOT YET DONE (optional next): (a) extend the sheen INTO tool controls
   (buttons/tabs) — held per "don't compromise widgets"; (b) Brand's INTERIOR tool
   controls still use teal (only its branding/chrome went gold) — recolor to gold
   if Andrea wants the whole Brand tool gold, not just its hero.
3. **#9 Haus Helper free-type search — DONE (2026-07-31, commit 90c4504).** Added
   a persistent "Type your question…" box to `snippets/p2p-helper.liquid` (no AI).
   New `assets/p2p-faq-kb.js` = 56 deduped entries auto-harvested from Content
   FAQ_ITEMS(25)+TIPS(9), Brand FAQ_ITEMS, OS + Brand-preview template FAQ blocks,
   + curated common answers. Keyword scoring (question hits 3x, answer 1x), top
   answer + source Haus + Open link + 2 related + human fallback; gibberish →
   guided options + email. Harvest script: scratchpad/extract_kb.js (rerun to
   refresh the KB when FAQs change). Live-verified on the OS page. NOTE: the other
   3 Hausen (product/marketing/graphics-ui.js) have NO FAQ_ITEMS arrays to harvest.
4. **#11 Brand identity → OS — DONE (2026-07-31).** (a) BACKFILL (a45b2b9):
   brand-haus-founderinterview.js publishes p2p_archetype from the saved assessment
   snapshot on load if the key is missing — members who completed the assessment
   before the publish hook existed get the OS DNA card without a re-take. (b) RECOLOR
   (100d44a, Andrea chose full recolor): the OS reads the member's saved brand palette
   (custom brand kit first, else the archetype palette now in p2p_archetype.colors)
   and overrides --gold/--gold-bright/--gstroke/--aurora; hue+sat from the brand,
   LIGHTNESS forced legible on dark; near-greyscale → neutral accents; no palette →
   default aurora. (c) ASSESSMENT LINK (a9853ee): the "Discover your Brand DNA" nudge
   + "Refresh your assessment" now point at the REAL assessment
   /pages/brand-haus?bh_focus=1 (was the non-existent /pages/p2p-assessment). All
   live-verified. REFINED (d098ae9): recolor now uses ONLY the archetype's single
   Stand Out color (p2p_archetype.standOut, e.g. Bold Pioneer #3A86FF) — accents +
   an analogous-hue aurora shimmer, not the whole palette; AND the OS now follows
   the member's ACTIVE assessment version (republishes on load + on setActiveVersion
   switch, so photo + Stand Out color track the chosen one of their up-to-5 saved).
   OPEN (not blockers): (i) 2 archetype hero images have a baked-in
   transparency checkerboard — assets/brand-haus-hero-{trail-forger,quiet-authority}.jpg
   are WebP alpha=no with the grid flattened in; the other 9 are alpha=yes and clean;
   Andrea to re-supply the 2 good originals. (ii) the assessment is gated by
   brand-haus-access — decide if the Founders Assessment should be a free lead magnet.
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
