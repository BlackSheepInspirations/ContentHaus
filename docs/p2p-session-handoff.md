# Purpose 2 Profit — Session Handoff (2026-08-01)

Read this first in a fresh conversation, alongside the auto-loaded memory
(`memory/MEMORY.md` + files), `docs/p2p-os-build-plan.md`, and
`docs/p2p-launch-checklist.md`. Everything below is committed + live.

## Community build — approved plan (2026-08-01, mockup v3 approved)
Mockup: scratchpad/community-mockup.html (dark-opal). Header **"P2P Community"** +
tagline "Where Your originality is rooted and ready to grow. From thought to thrive."
Layout: feed 3/5 (left) + narrow sidebar (right); map(3fr)+calendar(2fr) row below.
- **Sidebar order:** Upcoming events (scroll) → **P2P card** (rectangle logo
  `assets/p2p-community-logo.png` + Members/Active counts + Invite/Members) → Recent
  wins (leave as-is) → **Growth Board** (top 10; toggle pills **Weekly/Monthly/All-time**).
- **Main:** compact one-row Welcome checklist → cohesive composer+Wall feed; **long
  posts collapse** ("Read more"); feed stretches to align its bottom with the Growth Board.
- **Reactions on wall posts:** ❤ + 👍 + 🎉 (wins keep ❤ only).
- **Comments** on wall posts; **admin pin**; **Win of the week** pinned to top of wall
  with a fancy border (most-loved win in 7 days).
- **Bell notifications:** ping the author when their post/win is liked or commented on.
- **Auto welcome post** on new member: ~30 name-personalized templates (goal 100).
- **Growth Board rows:** rank · avatar · name · tier · **3 most-recent badges** (click →
  popup w/ badge + why earned) · points. (Dropped "Merit N".)
- **Streak flame 🔥** next to names on Growth Board + wall; **on the map** a pin shows a
  flame if on a streak, or a **🎉 celebration icon** if they just posted a win; clicking the
  pin shows streak days / most recent win.
- **Rotating member spotlight** in the sidebar. **Confetti** when a win is shared.
- Map: smaller (~300px) + fix the render bug (inits while panel hidden).
- "Report post" = member flags a post for admin review (optional; TBD).
Build order: A) layout+card+logo+growth(all-time)+welcome+collapsible+map-fix+upcoming
+spotlight+confetti (frontend). B) ONE Worker re-paste: comments, 3 reactions, pin,
notifications, welcome-posts, win-of-week, point-history (weekly/monthly), badge lists,
streak+celebration state. C) frontend for B.

## Latest session close-out (2026-07-31)
- **Daily libraries +100 net-new each** (deduped, PD-safe): `p2p-moments.js` 552→652,
  `p2p-purpose.js` 217→318, `p2p-heart.js` 220→320. Public-domain quotes (authors
  died pre-1940), WEB/KJV scripture, and original Affirmations/Reflections. Pushed +
  mirrored + committed. (Appender scripts w/ dedup in scratchpad; the `.js` files ARE
  the durable store.)
- **OS "Born an Original" carousel 25→100** statements (LINES array in
  `sections/p2p-os.liquid`). Pushed + mirrored + committed.
- **Gated pages hidden from search** — base-theme edits (mirror only, NOT git):
  `layout/theme.liquid` adds `<meta robots noindex,nofollow>` and
  `sections/main-search.liquid` + both `hdt_predictive-search*.liquid` skip any page
  whose `template.suffix` matches `courses-*`, `p2p-realm-*`, `p2p-learning*`,
  `p2p-tutorial`, or `p2p-course`. Public (indexable): OS, all 6 Hausen, previews,
  testimonials. Live-verified: realm-2/courses-*/p2p-learning → noindex; brand-haus/
  marketing-haus/p2p-os/p2p-os-preview → clean.

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

## 2026-08-01 — Map fixed + layout align + Phase B part 1 (reactions + badges)
- **Map bug fixed:** `[data-mb-map]` lives in the community view but p2p-members.js queried it via `mb.querySelector` (members view) → mapEl was null → map never ran. Now `root.querySelector('[data-mb-map]')`. Confirmed rendering by Andrea.
- **Layout:** main column is one bordered box (composer + Member Spotlight side-by-side + wall), stretched to align with sidebar/Growth Board bottom. Lower row map+calendar cards stretch to equal height; map flex-fills; new "Where's the flock?" title block.
- **Phase B part 1 (NEEDS Cloudflare worker re-paste):**
  - Reactions: ❤ 👍 🎉 per wall post. Worker `react` now takes `{type}`; stores `p.reactions={love,thumb,party}` (migrates legacy likedBy→love). community GET returns `reactions` + `mine`. Frontend: reactBar/wireReacts. Wins-side keeps a single ❤ (loveChip).
  - Badges: members.js publishes `recentBadges` (last 3 earned, emoji-mapped via badgeEmoji). Worker stores `sanitizeBadges`. Growth Board rows show up to 3 badge chips → click = badgePopup. `.osx-gb-who` flex + `.osx-gb-badge` CSS added.
- **Still Phase B (not started):** comments, 🔔 bell + profile bubble, Frank/Ruth house posts, 30 welcome msgs + auto-welcome, Win of the Week pin, Weekly/Monthly Growth toggle, streak flames, celebration map pin, confetti.

## 2026-08-01 (later) — Phase B part 2 (comments, bell, WoW, streaks, house voices)
Worker re-paste required + a NEW Cron Trigger for Frank/Ruth.
- **Comments:** `/apps/p2p/comment` POST {id,text,name} appends to post.comments; community GET returns `comments[]`. Frontend: 💬 toggle + inline thread + reply composer (wireComments/submitComment).
- **Bell + profile bubble:** sidebar `.osx-userbar` (bubble = customer initial, name, tier via P2P.tier). `/apps/p2p/notifs` GET {notifs,unread} / POST marks read. Reactions + comments on your post push a notif to the author (house- authors excluded). Polls every 60s. On ALL OS pages.
- **Win of the Week:** community GET computes `winOfWeek` = best-loved win in last 7d (tie→newest); frontend pins `.osx-wow` gold card atop the wall.
- **Streak flames:** members.js publishes `streak` (P2P.streak().count); posts carry denormalized `streak`. Shows 🔥N on Growth Board rows + wall/WoW names (≥2 days).
- **Auto-welcome:** profile POST with no `prev` drops a one-time house-welcome post (30-line WELCOME_LINES bank). Fires once per member.
- **Frank & Ruth:** worker `scheduled()` — Mon→Frank "Did you know" (FRANK_POSTS), Thu→Ruth insight (RUTH_POSTS), advancing a KV cursor, 1/author/day. Author ids house-frank/house-ruth, name Frank/Ruth, `house:true` → gold "✦ Haus" tag. **REQUIRES a Cron Trigger** (e.g. `0 15 * * *`). No cron = they never post.
- **Confetti:** canvas burst on a shared win (no dependency).
- Still open: the "Something else" Andrea flagged (undefined). Cross-device already live. Email alerts still need resend_key/alert_email (optional).

## 2026-08-01 (later 2) — house voices x4, admin pin, walkthrough, quick polish
- **House voices:** now 4 — Mon Frank ("Let me be Frank with you…"), Wed Drea ("Drea's Mid‑Week Heart Check"), Thu Ruth ("A Word from Ruth"), Fri Eric ("Uncle Eric's Baaad Jokes"). Config in `HOUSE[]`; scheduled() loops it by UTC day. **Starter banks only (~8–16 each) — needs expansion to 150 each.**
- **Post titles:** posts now carry `title` (house posts titled; user posts optional — full user title UI comes with the rich composer).
- **Admin pin:** community GET returns `isAdmin`; `moderate` gained action pin/unpin; pinned posts sort to top (below WoW). Admin sees 📌 buttons. **Andrea must add her Shopify customer id to Cloudflare var `admin_ids`.**
- **Welcome:** added first item "Take the community walkthrough" (data-wc=tour) → openTour() stepped modal (7 steps), marks p2p_wc_tour. Done items now show a ✓ inside the dot.
- **Gradient 'flock?'** via `.osx-flock-grad` (aurora clip).
- **STILL NEEDS:** Cron Trigger for house voices; admin_ids for pin.

## NEXT BIG BUILD — Channels/Categories system (Skool-parity)
Andrea wants: category channels + filter tabs, post search, sort (New→Old with Day/Week/Month/Year/All-time; New(last week); Unread), and a POP-UP rich composer (title + body + photo + gif + link + emoji + category select; small collapsed line that expands on click). Wins auto-copy into a Wins channel + the rotating box. Graph/youtube optional.
Proposed categories (confirm): General Discussion · Introductions 👋 · Wins•Habits•Growth 🏆 (auto-copy wins) · Questions & Help 🙏 · Testimonials 🙌 · P2P Announcements 📣 (admin/house-only). Optional Daily Check-Ins.
Content vaults: Frank/Ruth/Eric/Drea × 150 posts each (600 total) — generate as a dedicated content pass; consider KV-seeding to keep the worker paste small.

## 2026-08-01 (later 3) — CHANNELS BACKBONE shipped (needs worker re-paste)
Categories locked: general·intro·wins·help·testimonial·announce (announce=admin/house-only). Media: links+Giphy(URL)+YouTube now; R2 uploads later.
- **Worker:** CATEGORIES/CAT_LIST/RANGES; posts carry `category`+`attachments`; community GET does category filter + range(day/week/month/year) + search(q) + unreadSince + pagination(limit/offset)→{posts,total,hasMore,wowPost,isAdmin,categories}; wins forced to 'wins'; announce gated via catFor; house posts→general, auto-welcome→intro; sanitizeAttachments (image/gif/youtube[+vid]/link); tierNum stored on cards.
- **Frontend (community.js):** channel tabs (data-cat-tabs), search (debounced), sort/range select, load-more pagination; pop-up rich composer (title/body/category select/emoji picker/image-url/gif-url/youtube/link) replacing inline composer; feed page renders all kinds; post header = avatar(photo or initial)+tier# badge+category chip+unread teal dot; attachments render (img→lightbox, youtube iframe, link chip); sidebar Recent Wins now via separate loadWins(category=wins). memberMap built from members for avatars/tiers.
- **members.js:** publishes tierNum (P2P.tier().index).
- **DEFERRED (next chunks):** full post-detail modal (click post opens big view w/ comment composer), follow-a-user + hover profile card, engagement points+caps+cooldown, Cloudflare R2 real uploads + PDF scroll, live Giphy search UI (needs free key), 600-post house vaults (150×4).
- Perf note: GET still loads all posts then filters in-worker; fine for hundreds. Add per-channel index before thousands.

## 2026-08-01 (later 4) — edit/delete, garble fix, gold polish, Trusted Guide logo
NEEDS worker re-paste (620 lines) for edit/delete + charset.
- **Edit/Delete:** worker `postmod` (author edit / author+admin delete) + `commentmod` (author edit / author+admin+postOwner delete). GET now returns `owner` per post+comment and stops leaking comment author ids. Frontend: ⋯ menu on posts & comments (Edit/Delete/Report), inline comment edit, edit-post modal, "· edited" flag. Report moved into the ⋯ menu.
- **Garbled category text fix:** category emoji AND label now sourced from the UTF-8 JS file (CATS) not the JSON; worker json() now sends `charset=utf-8` (root fix for the `•` bullets in "Wins • Habits • Growth" on some devices).
- **Gold polish:** spotlight + Recent-Wins gold outline/glow fixed (specificity was overridden by `.osx-side-card`; now `.osx-side-card.osx-wins-card` + stronger). Invite button now filled gold (Members stays ghost).
- **Trusted Guide logo:** new transparent grayscale tree/fingerprint art `assets/p2p-trusted-guide.png` (592x1526, sheep is black → invisible on dark bg by design). Hero mark swapped to it (`.osx-tg-mark`, drop-shadow glow). A glowing `.osx-tlogo` is injected before the first `.osx-h2` of every `.osx-view` via inline script — glow uses `--gold-bright` so it follows the recolor. Recolor var confirmed: recolor writes Stand Out hue into `--gold`/`--gold-bright`/`--gstroke`/`--aurora` (p2p-os.liquid ~line 1707+).

## 2026-08-01 (later 5) — "My Success" command center (all private, localStorage synced via p2p_ metafield; NO worker paste)
New top-level OS tab **My Success** (nav `success^My Success^rocket^view^^`; hero h2 "My Success (G + R) × O × W = S"). Everything renders from assets/p2p-planner.js into `[data-planner]` (moved out of the Members tab). Data key `p2p_planner`. Sub-views (osx-pl-nav):
- **📊 Dashboard** — launch-countdown banner (nearest GROWS Window) + activity strip (followers from latest snap / total lives / total posts / this-week lives+posts) + roll-up rings (Day/Week/Month/Qtr/Year via periodPct) + goal summaries.
- **🎯 Goals (GROWS)** — data.goals[]; fields g/r/o/w/s + roadmap[] (gauges) + stage(grows/rooted/evergreen) + Window date; momentum = ((G01+R01)/2)×O×W (multiplicative → 0 warning); ROOTED roadmap template.
- **📡 Lives** — data.lives[]; plan (date/time/platform/topic/hook/goal + Marketing Haus link) + post-live stats (followers/gifts/hearts/comments/peak/duration/sales) + trends (totals/avg/best-time/follower sparkline).
- **📝 Posts** — data.posts[]; type(Video/Reel/Carousel/Photo/Story/Text)/hook/CTA/length/music/topic/time + stats(views/likes/comments/shares/saves/followers) + best-type trend. Reuses osx-lv-* card CSS.
- **💡 Ideas** — data.ideas[]; capture + "Plan as post" (creates a data.posts entry) + delete.
- **📈 Growth** — data.snaps[] weekly snapshots (followers/likes/diamonds/revenue) + follower sparkline + week delta + auto livesInWeek/postsInWeek.
- **✅ Lists** — Top3+To-dos per timeframe, gauges, carry-over + Completed archive (unchanged engine).
Also earlier: personal CALENDAR (visit stars via p2p_visit_days + p2p_my_events plans; window.P2P_CAL_REFRESH) lives in the Community mini-modal + Members inline.
STILL QUEUED: 📓 Journal-everywhere (needs p2p-notebook.js multi-instance refactor); calendar "posted today?" checkbox → Posts (cross-file localStorage sync caveat); RAFT framework template (needs the RAFT worksheet content — GROWS + ROOTED already templated).

## 2026-08-01 (later 6) — command center: gamification, products/creator-mode, RAFT + reframed dashboard
- **Gamification:** 17 MILESTONES[] in p2p-planner.js (id,label,emoji,check) + confetti + celebration modal (queue) + dashboard medal strip. Baseline-silent on first run (data.milestones). Data lives in p2p_planner.
- **Creator mode:** data.ctype = content|product|both; TABS[] filtered by tabShown(); selector on Dashboard. Content hides Products; Product hides Lives/Posts/Ideas; Both = all.
- **Products (📦):** data.products[] (name/type/price/status idea→building→live→retired/launch/sold/revenue). "Plan launch with ROOTED" seeds a GROWS goal w/ ROOTED_STEPS_P roadmap. Status badge colors s-idea/building/live/retired.
- **Growth metrics expanded:** SNAP_STATS now followers/email/likes/diamonds/visits/engagement/sold/testimonials/revenue.
- **RAFT weekly loop:** data.raft.cycles[] {week,relieve,actText,act(0-3),fastWin,corrected}; raftCycle() auto-creates current week; T→next R via lastCycleWithWin()/tractionStreak(). Leads the Dashboard.
- **Dashboard reframed (Andrea's rule):** controllable-first — RAFT loop + artifactCount() ("things shipped" = lives done+posts done+products live+roadmap steps done+fastWins) + 8-week barChart() of artifacts + horizon rings + goals + milestones. Lagging metrics (followers/likes/revenue) DEMOTED to a quiet dashed .osx-lag panel with a grey follower line. Traction label mode-swaps by ctype.
- All private (localStorage p2p_planner, synced via p2p_ metafield). NO worker paste for any of this.

### STILL OPEN (morning):
1. **📓 Journal-everywhere** — copy the 4-tab notebook into My Success (needs p2p-notebook.js multi-instance refactor).
2. **Calendar "posted today?" checkbox** → auto-create a Post (cross-file localStorage sync caveat: planner.js holds data in memory; community.js writing p2p_planner directly won't reflect until reload — do it inside planner or via a shared setter).
3. **RAFT as onboarding vs recurring** — currently built as recurring weekly loop (option b, Andrea's framing). Confirm.
4. **Richer viz полиш** — bar chart done; consider a semicircle gauge + TIME-tracking (auto time-on-view) — Andrea flagged wanting "time spent" viz; deferred per her own sequencing note (ship tracker, see if Traction gets filled, then decide on heavier infra).
5. **RAFT/ROOTED/GROWS template menu** — GROWS(goal builder)+ROOTED(templated) done; wire a proper template dropdown (currently confirm dialogs).
6. **Content Planner calendar drag** — Idea Vault → "Plan as post" done; dragging ideas onto calendar days is the fuller version.
7. **Beta test w/ real members**, **Frank/Ruth/Eric/Drea 150-post vaults**, **Cloudflare R2 uploads**, **Shopify Flow all-access tag** (pre-existing backlog).

## 2026-08-01 (later 7) — dashboard Chunk 4, reminders, bell fix, social widgets, OS rail everywhere
All committed + live. Worker WAS re-pasted this session (Andrea deployed) — reminder-firing + house engagement.
- **Dashboard reworked to two columns** (`.osx-dash-grid` in p2p-planner.js): left = RAFT/stats/social widgets/shipped chart/rings/goals/milestones; right = radar + full month calendar.
  - **Full calendar** `dashCalHTML()` reads lives/goals/products + window.P2P_EVENTS + p2p_my_events (plans) + p2p_visit_days (★), colored markers (live/goal/launch/event/plan), today ring, ‹›month nav, day-click popup `openDcDay(iso)`.
  - **"Coming up" radar** `radarHTML()` — next-14-day lives/launches/goals, MOVED above the calendar, capped at 5 with `.osx-radar-scroll` for more; rows are buttons → `openItemDetail(kind,id)` (jumps to the item + scrolls it into view).
  - **Clickable "What you shipped" bars** → `openShipWeek(wk)` lists that week's exact lives/posts/fast-wins, each with an "open & update" link (`weekArtifacts()`).
- **Social snapshot widgets** `socialWidgetsHTML()` (hidden for ctype=product): last-live recap (viewers/followers/avg-watch + goals-met pill, clicks through), follower-growth sparkline (from data.snaps), 12-week consistency heatmap (lives+posts), top-platform/best-time. CSS `.osx-sw-*`.
- **Reminders** (bell alerts before lives/goals/launches): `REMIND_OFFS` chips (`remindRow`) on live/goal/product cards; `rebuildReminders()` (called in save()) writes flat `localStorage.p2p_reminders` [{nid,id,kind,title,label,fireAt,startAt}] + debounced best-effort `POST /apps/p2p/reminders`. **Bell client** (p2p-community.js) `dueReminders()` fires due+unfired into the menu/count, `p2p_rem_fired` dedupes (once), marked on bell-open. **Worker**: `POST /apps/p2p/reminders` stores `rem:<id>`; `scheduled()` fires due into the bell (`remfired:<id>` dedupe) so they arrive cross-device/away. Client dedupes local vs server-fired by nid.
- **Bell now lights up** — root cause was NO triggers in solo testing (house voices only posted; can't self-notify). Fix: reminders drive it + **house voices now react to (and ~1/3 comment on) recent member posts** in `scheduled()` (HOUSE_REACTS/HOUSE_COMMENTS, guarded per-house so idempotent). Bell IIFE generalized: finds `[data-userbar]` anywhere (works on the rail too).
- **OS shell everywhere** — see memory `p2p-os-rail.md`. `snippets/p2p-os-rail.liquid` + `assets/p2p-os-shell.css` (scoped #p2posrail) render the sidebar on the OS + all 5 built Haus tools (brand/content(prompt-builder)/graphics/project(product-haus)/marketing), gated per-page, `push:'#<mount>-app'` margin-shift. **NOT on the Journey realms** (Andrea's call — reverted). Rail sits below the sticky theme header via `.shopify-section-group-header-group` measurement (JS in the snippet). View nav items deep-link `/pages/p2p-os?v=<view>` (OS handler already existed ~line 2044).
- **Transparent hero images** verified (WebP alpha=yes) + re-pushed: brand-haus-hero-{trail-forger,quiet-authority}.jpg.
- **Confirmed already-done** (were stale in this doc): courses built; all-access Flow in testing; mini Founders Assessment = lead magnet on OS Preview (full stays gated); realm unlock IMPLEMENTED (`unlock_after_handle` anchors, e.g. Realm 5 after `rooted`); tagline live ("Where Your originality is rooted and ready to grow. From thought to thrive." / short "thought to thrive").
- **⚠️ Andrea's Cloudflare to-dos:** cron Trigger → **every 15 min** (runs reminder-firing + house engagement); add `admin_ids` = her customer id (post pinning). Optional: Giphy key, resend_key/alert_email.
- **STILL OPEN carries forward:** journal-everywhere, calendar "posted today?"→Post, template dropdown, idea→calendar drag, "goals mandatory each live" hard gate, time-on-view viz; Community channels big build (post-detail modal, follow/hover card, engagement points, R2 uploads, live Giphy, 600-post house vaults); check-badge taxonomy input (for cert/check badges); Checkpoint flip cards (#12). Growth Haus + standalone Bonus page don't exist as sections yet (rail extends to them once built).

## 2026-08-01 (later 8) — big stabilization + Haus sidebar rebuild + cross-device sync + emoji fix
Andrea test-drove with multiple real accounts (Andrea/Justin/Jessica); this run fixed a cascade of issues. All committed + live unless noted.
- **Check badges auto-wired:** Mindset/Purpose/Heart checks now carry `data-check-id="check:<cat>:<blockid>"` (category-encoded, realm-unique) so completions count across all 5 realms. `reconcileCheckBadges()` in p2p-progress.js awards Mindset/Purpose/Heart **I** (1st), **II** (2nd), **Clear Mind/True Purpose/Open Heart** (all 5; CHECK_TOTAL=5). Badge names live in sections/p2p-learning-badges.liquid. openCheck reads data-check-id.
- **Order-confirmation welcome email (replaces the marketing email):** Andrea's Flow "P2P OS - Access" (Order paid → Condition `Product handle is equal to p2p-os-access` → Add customer tag `all-access`; marketing-email step deleted — it errored for non-subscribers). Access delivery is now a branded block pasted at the TOP of Settings → Notifications → **Order confirmation** (right after `<body>`); emblem = Files URL (Trusted_Guide.png). Full multi-Haus + simple/OS-only versions in scratchpad (order-confirmation-welcome*.txt). **Access model decided:** NO forced login-to-purchase (kills impulse buys); guest checkout still creates a tag-able customer; with **new customer accounts** they log in later via email code and the `all-access` tag applies — fully retroactive. Can't force marketing consent (illegal) so access email must be transactional (order confirmation), not marketing.
- **OS page regressions fixed:** boosters / Born-an-Original / flip cards had all died — one uncaught throw in the hero-title rewriter (insertBefore when a view's title isn't a direct child, e.g. Notebook) halted the whole DOMContentLoaded handler. Guarded the insertBefore (insert at the title's real parent) + wrapped every enhancement IIFE in try/catch. Also: booster box compacted, archetype hero image enlarged (300→360px), Notebook fingerprint restored + its subtext nested into the lockrow.
- **HAUS SIDEBAR = OS sidebar (the big one):** the Haus pages already had a rail (`snippets/p2p-os-nav.liquid`, rendered via `snippets/haus-links.liquid`) — my earlier `p2p-os-rail.liquid`/`p2p-os-shell.css` were a DUPLICATE (removed from all 5 Haus sections; those two files now unused). Rebuilt **p2p-os-nav.liquid** to match /pages/p2p-os exactly: BSC favicon brand, P2P emblem card + Members/Active counts + Invite/Members, profile bubble + tier + bell. Loads p2p-progress.js + p2p-community.js (only the [data-userbar] bell IIFE activates off-OS; wall/map bail without #p2pos). Counts + Invite wired by a small local script. Nav list synced item-for-item with the OS. Header no longer shifts (pad `#MainContent`, not `body`). Rail scrolls (overflow-y). OS sidebar also made to scroll as one unit.
- **Mobile menu buttons:** both the OS (`.osx-burger`) and Haus (`.p2posnav-burger`) menu buttons are now bright **gold**, high z-index. OS button is `position:fixed` with a JS-measured top (`--osx-bt` = header bottom + 8) so it sits below the theme's own hamburger. Drawer breakpoint 1024px.
- **CROSS-DEVICE SYNC FIXED (#28, launch-critical):** the old sync was pure newest-timestamp-wins with NO customer identity, so a new/other account on a browser holding someone else's newer localStorage uploaded THAT data into its own metafield + displayed it (the "shared brand kits/badges/points/completed courses" bug). Now: **worker GET /progress returns `customerId`**; client stamps `p2p_owner`; on load if `owner !== cid` it WIPES local P2P state and loads THAT customer's own server copy (never inherits local). Same account keeps newest-wins cross-device. NOTE: already-contaminated test metafields stay contaminated — test with BRAND-NEW accounts (or incognito). **Needed a worker re-paste (Andrea deployed).**
- **EMOJI GARBLE FIXED (#29):** worker `json()` now escapes all non-ASCII (incl. emoji surrogate pairs) to `\uXXXX` → pure-ASCII response body, immune to the App Proxy re-interpreting UTF-8 bytes on some devices. **Needs a worker re-paste** (verify Andrea deployed).
- **Files now unused (left in place):** snippets/p2p-os-rail.liquid, assets/p2p-os-shell.css (the duplicate-rail experiment).

## 2026-08-01 (later 9) — command-center finish, community feedback, full Members page, gamification tab, cumulative streaks
All committed + live. **⚠️ ONE Cloudflare paste pending** (worker copied to Andrea's clipboard): activates unique display names + profanity block + follow alerts. Everything else is already live.
- **Command center finished** (p2p-planner.js): journal-everywhere tab; RAFT/ROOTED/GROWS template dropdown; calendar day-click **"＋ Log a post I made this day"** (creates a done post, new sky-blue "posted" dot + legend); **✨ Ideas to schedule** tray under the dashboard calendar — drag an idea chip onto a day (or tap-chip-then-tap-day on mobile) to schedule it as a draft post (`scheduleIdea()`, marks idea used).
- **Community feedback** (p2p-community.js + os.liquid): per-post **unread-comment badge** (teal "N new" + dot, baseline seeded on first view via `p2p_cm_seen`, clears on open, excludes own replies); up to **5 commenter avatars** beside 💬; **profile hover/click card** on any author name/avatar (post/comment/win/commenter) — `showProf()`, delegated on #p2pos, appended to root z-index 4200, "See their posts"; **bell notifications click through** to the post (`window.P2P_OPEN_POST` on OS, else `/pages/p2p-os?post=<id>`).
- **Posts-tab bug fix:** `.osx-lv-check` was BOTH the "How did it do?" stats container AND a 16px select checkbox — the checkbox rule collapsed the stats onto Delete. Renamed the Lives checkbox → `.osx-lv-selbox`.
- **MEMBERS PAGE finished (#31)** (p2p-members.js + os.liquid): **~30 preset avatar icons** (stored `preset:<emoji>` in the photo field; rendered everywhere incl. community via `avInner()`); **follow bell** per member (local `p2p_follows` + `/apps/p2p/follow`, cross-device via server `following`); directory **sort** (Top points/Newest/Longest here/Following/Most engaged/A–Z) + **search** + live **count**; member cards open a **detail modal** (stats/quote/about/socials/follow/"See their posts" → `P2P_OSX_GO('community')`+`P2P_COMMUNITY_SEARCH(name)`); **custom display name** field w/ client profanity+dupe pre-check; **social icons → external-link confirm** popup; **quick links** to Community + My Success (`data-osx-goto`, wired by the OS nav). New bridges: `window.P2P_OSX_GO(view)` (os.liquid inline), `window.P2P_COMMUNITY_SEARCH(q)` (community.js).
- **"How You Level Up" gamification view (#46)** — new nav item (trophy icon, added to os.liquid + p2p-os-nav.liquid + both icon switches). Live "you are a &lt;tier&gt;" strip + full 20-tier ladder built from `window.P2P` (current highlighted) + points-earning table + full badge catalog. **Tier order confirmed:** every 500 pts, Dreamer(0)→Seeker(500)→…→Unbound(9500), then Unbound II+. A new account = 0 pts = Dreamer; a "wrong level" new account is contaminated test data from the pre-fix sync bug (test with brand-new/incognito).
- **STREAKS → CUMULATIVE (Andrea's call, agreed):** streak badges (5/10/15) now unlock on **cumulative days shown up** (`daysActive`, already tracked) not consecutive — a busy day never wipes earned progress. The live 🔥 stays as a soft motivator. One-line change in p2p-progress.js `tick()`: `awardStreakBadges(get(K.daysActive,...))`. Badge names still say "X-Day Streak" (can rename if wanted).
- **Welcome-message mojibake:** verified it's a remnant — worker `json()` ASCII-escapes on every read, so old + new welcome posts render clean after the (already-deployed) worker; a stale cached page hard-refreshes away.
- **⚠️ Cloudflare paste (worker.js, this session):** profile POST resolves a **unique** display name (name↔owner index; explicit Save strict → `name_taken`/`name_blocked`; background auto-save auto-disambiguates "Name 2"); server `NAME_BLOCK` profanity list; new **/apps/p2p/follow** endpoint (`followers:<name>`, `following:<cid>`); members GET returns caller's `following`; **new posts notify followers** (`type:'follow'`, click-through); posts use the member's canonical saved name. Client already live & handles the responses.

## 2026-08-02 (later 10) — realm/course locking rework, Bonuses coming-soon, NEW/SOON stickers, member fixes
- **Member fixes:** worker `photo` keeps `preset:<emoji>` (sanitizeUrl was stripping it → avatars vanished); NAME_BLOCK expanded (loser/idiot/etc.) on worker + client; custom name + avatar propagate everywhere via `applyIdentity()` (sidebar bubble/name, community, own profile card) not just the directory; commenter avatars 24→34px; sidebar profile (`.osx-me`) is a clickable profile card; comment replies got an emoji picker + link button + linkify. **⚠️ worker re-paste still pending** for avatars/uniqueness/blocklist/follow-alerts — after pasting, re-save profile once.
- **Realm/course LOCKING (per Andrea's exact spec):** lock engine (p2p-journey.js `nodeState`) now honors each realm's anchor (section `unlock_after_handle`) for ALL nodes incl. checks/signs — not just offshoots. Anchors set in templates: R1=welcome-aboard, R2=grows, R3=pod-foundations, R4=turning-digital-to-physical, R5=rooted. R1 flow: begin → onboarding unlocks Welcome Aboard (anchor) → rest of R1, except 4 Selling-on (after storefront-essentials). Map gates updated to match (Course Directory). Lock messages name the required course. **Test with a fresh account** (existing test accounts have courses marked done).
- **Bonuses = coming soon:** `^soon` 7th field on nav string (OS + rail) → greyed item + gold "Soon" badge; OS click shows a "…— coming soon" placeholder. Reusable for any nav item.
- **NEW / SOON course stickers:** Course + Offshoot blocks got theme-editor settings `new_since` (date; gold NEW sticker for 21 days then auto-clears) + `coming_soon` (checkbox; SOON sticker, node stays clickable → point its Course page at a teaser/waitlist). Rendered as a separate `.cs-tag` overlay in p2p-journey.js; CSS in p2p-journey.css. Andrea sets these per course as she builds/updates content.
- **STILL OPEN:** (1) worker paste (above). (2) Dead link in the Start view "Your Journey Starts Here" — Andrea to confirm WHICH link; target is `/pages/courses-welcome-aboard`. (3) Cross-realm sequencing question — right now each realm's anchor is reachable after onboarding (a keen member could unlock realms out of order by doing anchors); chain them only if Andrea wants strict realm-after-realm.

## 2026-08-02 (later 11) — member card polish, retroactive rename, opt-in email
Worker re-pasted by Andrea (deployed). All live.
- **Member detail modal:** 24px padding; Follow button moved from the top-right corner (overlapped the ✕) into the actions row beside "See their posts"; widened to min(400px,92vw).
- **Retroactive identity:** worker profile POST, on name change (prevLow !== low), scans post:* and renames this author's posts + embedded comments to the new name — which also fixes their avatar everywhere (posts look up the avatar by name via memberMap). New posts always use current name/avatar.
- **Opt-in "Email me":** My Profile has an optional Email field + default-OFF "Show an ✉️ Email me button on my card" toggle. Card shows a click-to-reveal button (mailto on click). Raw email is STRIPPED from the bulk /members response (`hasEmail` flag only) and served one-at-a-time via logged-in-only GET `/apps/p2p/member-email?id=<memberId>` — not mass-scrapable. Worker validates email format + caps 120 chars.
- **Onboarding 404 fixed:** "Your First Course Awaits" now derives /pages/courses-<first course handle> instead of the dead /pages/p2p-course.
- **Locking confirmed with Andrea:** R1 two-step (Begins Here → Welcome Aboard → rest) correct; realms NOT chained (2-4 independent via their anchors; R1 & R5 kept most accessible — ROOTED stays R5's short-but-required anchor).

## 2026-08-02 (later 12) — real photo upload to R2
Photo URL field was bad UX (nobody has one). Replaced with a 📷 upload. Client resizes to 512px JPEG (canvas, q.85) → POST /apps/p2p/upload → worker stores in R2 (`env.MEDIA` binding) → returns URL. Uses `env.r2_public_base` when set, else serves via GET `/apps/p2p/imgget?key=...` (whitelisted through the photo sanitizer). Live preview; graceful "not switched on yet" if R2 unbound. URL field kept as advanced fallback; presets unchanged. Reusable for post media later (`kind:'post'`). **⚠️ Needs Andrea's Cloudflare R2 setup + worker paste — full steps in docs/p2p-r2-media-setup.md** (create bucket `p2p-media`, bind as `MEDIA`, optionally set `r2_public_base`, deploy worker).

## 2026-08-02 (later 13) — R2 photo upload, brand social icons, unified card, follow/followers/block, feed pagination, Growth Board move
Big members/community round. **⚠️ ONE worker paste pending** (worker.js 927 lines on clipboard) activates: server-side block filtering + followers list + Growth-Board daily snapshots (7d/30d). Everything else is client-side and live.
- **R2 photo upload** (task done): 📷 Choose-a-photo + drag-and-drop; client resizes to 512px JPEG → POST /apps/p2p/upload → R2 (`MEDIA` binding). Uses `r2_public_base` if set else serves via /apps/p2p/imgget. Setup guide: docs/p2p-r2-media-setup.md. Andrea did the R2 setup; uploads work. Sidebar bubble (OS + rail) now shows the uploaded photo (applyIdentity handles real photos; rail fetches /apps/p2p/profile).
- **Socials fixed**: client + worker normalize @handle / bare-domain / link → full https URL (sanitizeUrl only accepted https). Inputs are text w/ "@handle or link" placeholders + helper note. Real brand SVG icons (IG/FB/YT/TT/LinkedIn/X/globe) replace emoji.
- **Member-map overlap**: isolation:isolate on .osx-mb-map (Leaflet controls were painting over the store's sticky header/footer).
- **Unified member card**: community hover = rich preview (quote/location/socials/points/badges); click anywhere opens the SAME full modal (members.js exposes P2P_OPEN_MEMBER / P2P_MEMBER_BY_NAME / P2P_MEMBER_SOCIAL_HTML / P2P_EXT_CONFIRM). Retired the thin card.
- **Following/Followers/Block**: "Your circle" in My Profile (Following/Followers/Blocked chips). Block = one-way (their posts+comments vanish from my feed via client `p2p_blocked` names + server filter on community GET; severs follow both ways; Blocked list to undo). Worker: /apps/p2p/block, profile GET returns followers+blocked, community GET filters blocked authors.
- **Feed pagination**: 30/page, ‹ › + first/last + ellipses + jump-to-page input; replaced endless Load-more. Server already returned total. `filter.page`.
- **Growth Board moved to Members aside**: All-Time / 30d / 7d toggle + 🔥 streak by name + rows click to open the card. Worker records `snap:<cid>` daily points snapshots; members GET returns d7/d30 (windows fill in going forward). Also: order-confirmation welcome email, cumulative streaks, NEW/Coming-Soon course stickers, "How You Level Up" tab, realm/course locking, opt-in "Email me", retroactive rename — all from earlier in this session, live.

## 2026-08-02 (later 14) — Rewards Map pop-up, days counter, community layout, comment media, full code scan
All committed + live. **No worker paste pending** — the one worker change this round (comment attachments) was already pasted + deployed by Andrea.
- **The Rewards Map pop-up** — a read-only in-OS reference (points ledger + 20-tier ladder + all 10 badge families, Parts 1–3 of the published Rewards Map artifact; Part 4 "decisions" is internal-only, left out). Opens from **How You Level Up** (a "🗺️ Open the full Rewards Map" CTA under the intro) and **Checkpoint & Tools** (a "The Rewards Map" card in *Find your way around*). Markup + CSS + open/close JS all in sections/p2p-os.liquid (CSS in assets/p2p-os.css). The artifact itself: https://claude.ai/code/artifact/0d6c9ed5-a7a8-4715-a322-b0ff770ea9ab (private to Andrea's Claude acct — the in-OS pop-up is the member-facing copy).
- **⚠️ CLASS COLLISION BUG (found + fixed same session):** the new modal reused `class="osx-map"` — the exact class the dashboard's "Your road ahead" step map already uses — so the modal's `position:fixed;inset:0` overlay rule hijacked the road-ahead and covered the whole page (un-closeable). Fixed by renaming the modal container to **`.osx-rwm`** (its inner `.osx-map-*` children don't collide — road-ahead has no such children). Lesson: grep existing class names before reusing a generic one like `.osx-map`.
- **256 KB limit:** adding the map tipped sections/p2p-os.liquid over Shopify's 256 KB per-template limit. Moved the section's big inline `<style>` (~157 KB) into **assets/p2p-os.css** (linked via `stylesheet_tag`; FOUC-hide `<style>#p2pos{display:none!important}</style>` still inline, revealed by `#p2pos.osx` in the external file). Section now ~129 KB. **All new OS CSS goes in assets/p2p-os.css now, not inline.**
- **"Days shown up" counter** — new 🗓️ chip beside the 🔥 streak on the dashboard face (`.p2pos-days` ← `window.P2P.daysActive()`); the streak pop-up (p2p-progress-popups.js `viewStreak`) also shows the cumulative total ("N days shown up — cumulative, so a missed day never sets it back").
- **Community layout:** Win of the Week + Member Spotlight now sit together in a **flex row directly under the Welcome strip** (`.osx-comm-topcards`), composer + feed below. A single visible card fills the row; two split it. Win of the Week renders into a dedicated top slot (`data-wotw-slot`) via `renderWall()`; **falls back to top-of-feed on any embed without the slot** (Haus rail etc.). Extracted shared per-post wiring into `wirePosts(container)` so both the slot and the feed get reacts/comments/lightbox/menus.
- **Photos & GIFs in comment replies:** reply box gained 🖼️ (photo URL) + **GIF** (Giphy) buttons with a staged preview strip (`cmPendingAtts`, max 2/reply, image-only replies allowed); posted comments render inline with lightbox (`cmAttHTML`). **Worker** (deployed): comment POST stores `attachments: sanitizeAttachments(body.attachments, 2)` + echoes them; community GET serves `c.attachments`; guard relaxed to allow image-only. `sanitizeAttachments(a, max)` now takes an optional cap.
- **Full code scan (100% clean of real bugs):** `node --check` on all 142 JS assets + worker = pass. `shopify theme check` = 29 offenses, all triaged: 15 ImgWidthAndHeight (perf/CLS lint), 4 RemoteAsset + 3 ParserBlockingScript (perf), 1 OrphanedSnippet (the retired p2p-os-rail.liquid), 2 UnclosedHTMLElement (the badges `forloop.first/last` row-wrap pattern — balanced at runtime, static-parser false positive), 2 LiquidHTMLSyntaxError (curly-quote+em-dash placeholders in jr-title inputs — **valid HTML, verified via hexdump**, theme-check parser false positive), 2 MissingAsset → **the one real find, fixed:** sections/p2p-haus.liquid `<video id="howToVideo">` referenced `how-to.mp4`/`how-to-poster.jpg` (never uploaded) and its "coming soon" placeholder had no reveal script → showed a broken empty player. Added a small inline script that reveals `#howToPlaceholder` (and hides the player) on source error / no-readyState. Andrea can just drop `assets/how-to.mp4` (+ optional `how-to-poster.jpg`) whenever the clip exists.

### ▶ TO-DO for tomorrow (2026-08-03)
**Andrea (no code — content / Cloudflare / testing):**
1. **Confirm the Cloudflare Cron Trigger is active + every 15 min** — it drives reminder-firing, house-voice engagement AND the Monday house auto-posts. Frank is scheduled to post **Monday**; verify it fires.
2. **Test comment photos/GIFs** end-to-end: text+photo, GIF (Giphy), image-only reply, remove-staged ✕, reload persistence, lightbox. (Worker is deployed.)
3. Eyeball the three shipped UI bits on a fresh/incognito account: the **Days shown up** chip, the **Win-of-Week + Spotlight** row, and the **Rewards Map** button (both entry points).
4. Fill remaining **course content** (52) + set per-course **NEW `new_since` / Coming-Soon** flags in the theme editor as content lands.
5. Optional: drop an **`assets/how-to.mp4`** (P2P Haus walkthrough) — the player now shows "coming soon" until then.
6. **Expand Drea's house-voice bank** (only 8 vs Frank/Ruth 12, Eric 16 — repeats after ~2 months).

**Code backlog (Claude — when Andrea wants them):**
- **Masterclass wiring** — define what counts as a "masterclass" course type so the **Masterclass Grad** badge (+250) can auto-earn (badge exists, no trigger yet).
- **Growth Haus** page/sections + a **standalone Bonus Resources** page (rail already links them; sections don't exist yet).
- **Photos/GIFs in top-level posts via R2 upload** (device upload, not just URL) + **live Giphy key** (currently Giphy needs `GIPHY_KEY`); comment media reuses the same pattern.
- **House-voice vaults expansion** toward the 600-post goal (auto-drip cadence already built).
- **Cross-realm sequencing decision** — realm anchors are individually reachable after onboarding; chain them strictly only if Andrea wants realm-after-realm.
- Perf lint (optional, non-blocking): add width/height to the rail `<img>`s, lazy the parser-blocking scripts.

## 2026-08-02 (later 15) — Store unlocked + live browser verification; big OS pass + full calendar-and-profile arc
Store password is OFF now (owner still gates by tag). **Live visual verification is possible via the user's Mac Chrome (the claude-in-chrome extension = "Browser 1", macOS/local), logged into the store as a member whose customer has the `all-access` tag.** The Windows Chrome ("Browser 2") was a stale/web login and bounced to the preview — always use Browser 1. The OS still hard-redirects any non-tagged customer to /pages/p2p-os-preview, so the driving Chrome MUST be signed in as a tagged member. Everything below is deployed + committed; the ONLY Cloudflare action this session (map-pin worker) was pasted by the user and the cron trigger is confirmed set.

- **Rewards Map pop-up** (earlier): read-only reference modal opened from How You Level Up + Checkpoint & Tools. Class collided with the dashboard's `.osx-map` (road-ahead) → renamed the modal to **`.osx-rwm`**. Also moved the section's big inline `<style>` into **assets/p2p-os.css** (256 KB template limit) — **all new OS CSS goes there now**; the stylesheet `<link>` sits at the TOP of the section so the shell paints already-styled (fixed a gold-flash regression).
- **"Days shown up" chip** on the dashboard; **Level-Up Growth Board** (leaderboard beside a narrower 20 Tiers) + a Help-us-be-better box; **Community layout** = Win-of-Week + Member Spotlight row above the composer; **photos/GIFs in comments** (worker already deployed prior session).
- **Tools & Resources flip cards** — "Find your way around" + "Work faster" cards flip (reuse `.osx-meetcard`); Rewards Map card is `data-noflip` (opens the pop-up). Second sidebar Members button → **"My Profile"** (OS + rail; deep-links `?v=members&tab=profile`, `?tab=` handled in the OS deep-link reader).
- **My Profile photo** — big live avatar preview beside the name + a **crop-before-save modal** (drag/zoom → 512px square).
- **Bonus Resources = nested accordion** (category → sub-category → cards), built in `sections/p2p-os.liquid` + `snippets/p2p-bonus-card.liquid`. The baked "Journal Creator" freebie now flows INTO the tree (Digital Products → Journals) — baked items carry `^category^subcategory` and render through the snippet alongside theme-editor `bonus` blocks (block gains category `select` + subcategory `text`). Accordion only shows categories that have items.
- **Brand recolor on Haus pages** — was gold because the recolor only ran on the OS. New **assets/p2p-os-recolor.js** (loaded via the rail snippet) applies the Stand-Out color to `#p2posnav` on all Haus/Assessment pages. (Andrea's archetype = The Luxe Rebel, standOut `#7B2CBF` purple.)
- **Calendar dots** 4px→10px, distinct fixed high-contrast colors (goal off the gold var; ★ stays brand gold); legend recolored.
- **Planner tab-jump fix** — field `change` handlers were full-`render()`ing and dropping focus to page top. Lives/Posts/Products now `renderKeepFocus()` (defers a tick, restores focus+caret); Goals text fields just `save()` (no render). Rename **Products tab → "Product Launch"**.

### The calendar-and-profile arc (Stages 1–4) — all in assets/p2p-planner.js + p2p-community.js + p2p-os.liquid/css + worker.js
- **Stage 1 — typed add-flow + under-calendar day panel (My Success).** Click a day → items list UNDER the calendar (no pop-up), each typed item has a "details →" deep-link (`openItemDetail`). **＋ Add event** → type (Live/Product Launch/Post/Goal/Reminder/Event) → platform (lives/posts) → title → time (hr·min·am-pm·tz) → writes to the correct typed store; generic reminders/events go to **`data.events`**. One-time migration folds the old disconnected `p2p_my_events` into `data.events`, so the **"Coming up · 14 days" radar** now sees posts + events. Legend `plan→reminder`; selected-day highlight.
- **Stage 2 — post-event check-in + badge gate + bell nudge.** A past-dated live that isn't logged shows a check-in banner atop My Success (**Yes, it happened** → `done`, only THEN counts toward the went-live badge; **It was canceled** → reason). `milestoneCounts` lives = `done && !canceled && date not in the future`. Same lives push a one-time OS **bell nudge** (`checkin-<id>` reminder, `post:true`, stamped now). After "Yes," an **afterCheckinPop** nudges "update your live" → opens the live.
- **Bell click-through** — reminder/check-in notifications carry `kind|id`, are clickable, and jump to the item (`P2P_PLANNER_OPEN` on the OS; `?open=kind|id` deep-link from the rail).
- **Stage 3 — Community/Members calendars = HAUS EVENTS ONLY** (`window.P2P_EVENTS`, fed by theme-editor "Live session" blocks). Dropped personal plans/add/stars from those two. Event day = **white square + gold "P2P" pill**; tap → **Skool-style detail card** (cover image, P2P Event pill, title, date/time, LIVE badge, description, Join button, **Add-to-calendar** via Google Calendar link). Added a **"P2P Event" legend** to both. Event block gained a **Cover image** field; `P2P_EVENTS` carries `image` + `joinLabel`. (Needs event blocks with `iso_date` to show highlighted days.)
- **Stage 4 — My Profile city typeahead overrides the auto map pin.** OpenStreetMap **Nominatim** typeahead in My Profile → chosen city (label + city-level lat/lng, rounded ~1km) becomes the pin instead of the auto edge-geo. "Use approximate instead" reverts; the hide toggle still removes the pin. **Worker: `sanitizeLoc` + `body.location`** (object=set / `null`=revert / absent=keep as `customLoc`), stored + preferred. **✅ Worker PASTED by Andrea; cron trigger confirmed at `*/15 * * * *` (scheduled handler).** City-pin test passed live.

### ▶ Still open / next
- **Content:** fill course pages; add theme-editor **event blocks** (with `iso_date` + cover image) to light up the Community/Members calendars; add **bonus download blocks** (with category/sub-category) to grow the accordion.
- **Backlog:** Growth Haus + standalone Bonus page sections; **Masterclass Grad** needs a defined "masterclass" course type to auto-earn; expand Drea's house-voice bank (8 vs 12/16); post-media R2 upload + live Giphy key; house-vault expansion toward 600.
- **Nominatim note:** browser fetch works (CORS ok, Referer = store domain); it's rate-limited (fine for occasional profile edits) — if it ever gets heavy, self-host or swap geocoder.

## 2026-08-03 — Pre-launch QA sweep (3 parallel static audits + live console sweep)
All code-fixable issues fixed, live-verified, committed. **Live console sweep** (Browser 1, tagged
member) across OS home, Community, My Success, Realm 2, a course page, Content/Growth/Marketing Haus =
**zero console errors, no broken images.** Static audits (gating/dead-links · journey/courses/progress ·
community/members/success) found:
- ✅ **BLOCKER fixed — Growth Haus gate was case-sensitive** (`P2P-haus-access`) in the OS shell while the
  tool page downcases; a Growth-Haus-only member could be locked out of the OS entirely. Now case-
  insensitive (`tags_lc`) in both p2p-os.liquid + p2p-os-nav.liquid (whole-page gate + per-nav-item gate).
- ✅ **MAJOR fixed — Upcoming-events sidebar click threw** (`openDay` out of scope); the baked Aug-15
  "Store Opens" event is the one item every member sees. Exposed `window.P2P_OPEN_EVENT_DAY`.
- ✅ **MAJOR fixed — Milestones dead link** `/pages/p2p-badges` → `/pages/p2p-learning-badges` (3 spots).
- ✅ **MAJOR fixed — Growth Haus preview owner button** defaulted (`| default: '/pages/growth-haus'`).
- ✅ **MINOR fixed — orphaned page.p2p-course** stale `/pages/p2p-haus` → `/pages/p2p-os`.
- ⚠️ **FALSE ALARM (verified, no change):** the "Masterclass/Launched badge name mismatch" — blocks ARE
  named exactly "Masterclass"/"Launched" (p2p-learning-badges.liquid:262-263); they display fine.
- **CLEAN:** journey locking (no traps, all 52 courses reachable), course player, progress engine
  (fresh-account safe), planner/community/members (no empty-state throws), all worker endpoints matched.

### ▶ Andrea smoke-test items (can't verify from code — Shopify admin / real member):
1. Confirm the **Growth Haus Flow tag case** (fix works either way now, but good to know).
2. Confirm the **5 realm pages** exist + assigned templates (handles p2p-learning, realm-2..5) — nav
   hardcodes them; a missing one = 404 trap.
3. Confirm **preview pages** exist (content-/project-/growth-haus-preview, etc.) — non-owner landing spot.
4. Confirm **/pages/p2p-learning, /pages/p2p-tutorial, /pages/p2p-learning-badges** resolve.
5. Confirm the **KV binding is live** (one logged-in round-trip) — community/members depend on it.
6. **Click-through the journey board** — each node derives `/pages/courses-<handle>`; confirm pages exist.
### Non-blocker radar: worker per-request KV scan needs pagination at scale; WoW reaction-sync cosmetic
nit; dead snippet p2p-os-rail.liquid (unused).
