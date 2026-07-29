# Purpose 2 Profit — Learning Journey: System Reference

*Complete build reference for the Purpose 2 Profit **Learning Journey** — the
gamified, self-paced course platform inside the password-locked Shopify store.*

> **Not to be confused with** the *Prompt to Profit Haus* generator tool
> (documented separately in `p2p-integration-reference.md`). That is a product
> generator; **this** is the learning/course experience — journey map, course
> player, badges, points, and streaks. Different product, different files.

Last updated: 2026-07-29.

---

## 1. What it is

A course platform modeled loosely on Circle.SO / Skool / Mighty Networks, but
**course-focused (no community)** and wrapped in a **Candy-Crush-style journey
board** built from baked-in AI-generated art. Learners unlock with an access
code (or a purchase later), work through courses at their own pace in a
suggested-but-not-forced order, earn points/badges/streaks, and finish each
course with a celebration + a downloadable certificate.

Everything is housed and viewed **entirely inside Shopify** as native theme
sections — no iframe, no external app, no build step. Progress currently lives
in the browser (`localStorage`); the design is built to lift into a customer
account backend before public launch (see §9).

## 1a. The five Realms (multi-board structure)

The journey is split into **five Realms**, each its own board + journey page
(the multi-board architecture — one board caps ~8000–11k px). The full
course/lesson plan lives in **`docs/P2P_Level_Map.xlsx`** (two tabs: Level
Legend, Course Map — every level, course, lesson order, and which course awards
which badge). Realms (a Realm = a stage; **do not** call them "Levels" — that
word is now the points meter, renamed **Merit**):

| # | Realm | Terrain | Anchor / gate |
|---|---|---|---|
| 1 | The Shoreline | Ocean → Shore | **GROWS** must be completed first (gates the rest of Realm 1) |
| 2 | The Thicket | Mystical Forest | none — fully open |
| 3 | The Bloom | Thriving Desert | none — fully open |
| 4 | The Fields | Grasslands | none — fully open |
| 5 | The Evergreens | Mature Woods | **ROOTED** must be completed first (gates the rest) |

> Note: the xlsx still labels Realm 5 "The Canopy" — the owner renamed it to
> **The Evergreens** (evergreen business); reconcile the sheet when convenient.

**Lock rules:** only *Your Journey Begins Here* and *Welcome Aboard (incl. RAFT)*
are always-locked-first. After that every Realm is open in any order, EXCEPT a
Realm with an anchor course (GROWS in 1, ROOTED in 5) keeps the rest of that
Realm locked until the anchor is done. Courses are **Main / Offshoot / Check**;
offshoots are optional and hang off a trunk course.

**Navigation:** the sticky toolbar has a **second row** of Realm buttons
(settings `realm_1..5_name/url/locked`, `current_realm`) for jumping between
boards; each board's bottom also links to the next. Realm 5 defaults locked.

---

## 2. Files (as built)

| File | Role |
|---|---|
| `sections/p2p-learning-journey.liquid` | The journey-map **dashboard**: hero, animated aurora, sticky nav toolbar + live stats, access gate, the board (art + clickable hotspots + progress overlays), inline panels (Progress / Bonuses / Journal), welcome popup, info modal, **Points breakdown modal**, and the "Your Journey Begins Here" onboarding flow. |
| `assets/p2p-journey.css` | Journey styles, all scoped under `#p2pj`. |
| `assets/p2p-journey.js` | Journey behavior: access gate, popups/modals, onboarding steps, nav→panel switching, journal (save/list/export), the JS sticky bar, and live-stat rendering. |
| `sections/p2p-learning-player.liquid` | The **course player**: lesson list, progress bar, per-lesson mark-complete, video/text/link-outs, completion celebration, and the certificate. Lessons are section **blocks**. |
| `assets/p2p-player.css` | Player styles, scoped under `#p2pp`. |
| `assets/p2p-player.js` | Player behavior: lesson nav, mark-complete, progress, celebration particle system, certificate fill + PNG download. |
| `sections/p2p-learning-badges.liquid` | The **Badges & Milestones** gallery. Badges are section **blocks** grouped by "Family". Includes the badge-unlock popup markup. |
| `assets/p2p-badges.css` | Badge styles + unlock-popup styles, scoped under `#p2pb`. |
| `assets/p2p-badges.js` | Applies auto-earned badges to the gallery, celebrates newly-earned ones (confetti), publishes the earned/total count, and shows live points/level/streak in the header. |
| `assets/p2p-progress.js` | **The shared progress engine** — streaks, points, and badge auto-awards. Loaded first on all three pages; exposes `window.P2P`. This is the heart of the system (see §6). |
| `assets/p2p-journey-board.jpg` | The baked journey-board art (course markers, RAFT/GROWS/ROOTED signs, side-quest checkpoints, "Your Journey Begins Here" sign). |
| `assets/p2p-certificate-bg.jpg` | The navy-and-gold certificate background. |

CSS is isolated by **selector-prefixing**: journey rules under `#p2pj`, player
under `#p2pp`, badges under `#p2pb`. Nothing leaks onto the host theme.

---

## 3. Pages & routing

| Page | Section | Notes |
|---|---|---|
| Journey dashboard | `p2p-learning-journey` | The home of the experience. The **Milestones** toolbar tab links to the badges page via the `milestones_url` setting (default `/pages/p2p-badges`). |
| Course player | `p2p-learning-player` | One page per course; the course's title/handle and lessons are set in the section. |
| Badges & Milestones | `p2p-learning-badges` | Reached from the Milestones tab. |

Each needs a Shopify **page template** (`templates/page.*.json`) assigning the
section, then the page's *Theme template* set in Admin. The section only appears
in the page's template dropdown once its template JSON is on the **published**
theme.

---

## 4. Access gate

- The journey section renders locked by default and reveals on the correct
  **access code**: `p2p-learning` (set via the `access_code` setting).
- On success the unlock is remembered per-browser (`localStorage`
  `p2p_access_<slug>`), so a returning learner skips the gate.
- A future purchase path can gate on a customer tag / access product instead;
  the code already supports an `access_product` "get access" link on the gate.
- **Founder's Pass** (lifetime) is the intended first offer, with a subscription
  model layered on later.

---

## 5. The journey dashboard, in parts

- **Hero** — title "Purpose 2 Profit" with an animated "2", plus a second
  all-caps line "LEARNING JOURNEY" carrying the moving aurora gradient. A
  moving-aurora backdrop (green/teal/blue base, pink/purple accents) fades into
  the board.
- **Sticky toolbar** — a JS-based sticky bar (`position:fixed`, auto-offset
  below the theme's own sticky header; it never measures while the board is
  locked/hidden). Tabs: **Journey Map · Progress · Bonuses · Milestones ·
  Journal**, a standalone info (ⓘ) button, and **live stats** (Points · Badges ·
  Streak · Level).
- **The board** — the baked art with transparent **hotspots** overlaid:
  - Course markers (open each course)
  - The **RAFT / GROWS / ROOTED** framework signs (open an explainer; opening
    all three earns *Trail Explorer*)
  - Side-quest checkpoints (Mindset / Purpose / Heart)
  - "Your Journey Begins Here" → the onboarding flow
  - Five progress overlays that light up per completed course
- **Inline panels** (swap in place of the board):
  - **Progress** — completion ring, "courses done", points, badges, day streak,
    level, and an "up next" card. All the live numbers are engine-driven.
  - **Bonuses** — the three side-quest cards.
  - **Journal** — write/save/list/delete/export reflections (see §7).
- **Onboarding** ("Your Journey Begins Here"): a note from Andrea → "You have a
  Founder Fingerprint" → the Brand DNA question ("Have you completed your Brand
  DNA Blueprint?" — **Yes** self-attests the *Founder Fingerprint* badge; **Not
  yet** routes to the Blueprint) → "How This Journey Works" → Continue to Lesson 1.
- **Points modal** — tapping the **Points** stat opens a bar chart explaining
  how points are earned (values from the section settings). See §8.
- **Welcome popup** (once, with "don't show again") and **Info/Help modal**
  (getting around, account housekeeping, honest income disclaimer).

---

## 6. The progress engine (`assets/p2p-progress.js`) — the heart

Loaded first on every P2P page; everything else calls into `window.P2P`. It owns
three things: **streaks, points, and badge auto-awards**, all persisted in
`localStorage`.

### 6.1 Streaks — how "showing up" is tracked

A **show-up** is any visit to a P2P page. On each load the engine stamps today's
calendar date and compares it to the last date seen:

- **same day** → no change (multiple visits in a day count once)
- **exactly yesterday** → streak **+1**
- **gap of 2+ days** → the run **broke**; it resets to **1** today

It keeps the **current run** (`count`), **best run ever** (`longest`), and
**last active date** (`last`). **Missed days are detected on the next visit** —
that's when the gap appears, so the displayed number is always recalculated
fresh. Streak-milestone badges are permanent high-water marks (reaching a 10-day
run keeps the 10-Day badge forever, even after a break). **Comeback** fires when
a run of **7+ days** (`COMEBACK_MIN`) breaks and the learner returns.

### 6.2 Points — live accrual

Points accrue from tracked events, using rates the journey page passes in
(`window.P2P_POINTS`, cached to `localStorage` so the player/badges pages award
the same amounts). Total is computed as:

```
points =
    (courses completed  × course rate)
  + (Brand DNA done?    → dna rate)      // "Founder Fingerprint" earned
  + (certificate saved? → cert rate)     // "Certified" earned
  + streak-points ledger                 // +streak rate per new day
  + journal-points ledger                // +journal rate per entry, max 5/day
```

Milestone points (courses / DNA / cert) are **recomputed from state** each load
(so they're retroactive and never double-count); streak and journal points use
running ledgers incremented once per day / per capped entry. **Level** climbs
one step per `level` points (default 250): `level = 1 + floor(points / step)`.

### 6.3 Badge auto-awards

| Trigger | Badge(s) |
|---|---|
| Daily streak reaches 5/10/…/150 | the matching **N-Day Streak** |
| A 7+ day run breaks, then returns | **Comeback** |
| Open RAFT + GROWS + ROOTED signs | **Trail Explorer** |
| Journal reaches 1 / 10 / 15 entries | **First Reflection / Journal Keeper / Journal Devotee** |
| 1st / 3rd / 100th course completed | **First Steps / Finding Your Current / Reached Freedom** |
| Certificate PNG downloaded | **Certified** |
| "Yes, I've completed my Brand DNA" | **Founder Fingerprint** (self-attest; auto via metafield at launch) |

### 6.4 `window.P2P` API

| Member | Purpose |
|---|---|
| `streak()` | `{ last, count, longest }` |
| `markSign(key)` | Record an opened framework sign (`raft`/`grows`/`rooted`); earns Trail Explorer when all three seen |
| `earnBadge(name)` | Add a badge to the earned set (idempotent) |
| `earnedSet()` | Array of auto-earned badge names |
| `checkJournal()` | Reconcile journal-count badges |
| `addJournalPoint()` | +journal points for a new entry (capped 5/day) |
| `completeCourse(slug)` | Record a finished course; awards First Steps / Finding Your Current / Reached Freedom |
| `points()` / `level()` | Live totals |
| `coursesDone()` | Count of finished courses |
| `badgesStat()` | `{ earned, total }` the badges page publishes for the journey to display |
| `rates` | The active point rates |
| `STREAK_BADGES` | Map of streak thresholds → badge names |

### 6.5 `localStorage` schema

| Key | Shape / meaning |
|---|---|
| `p2p_access_<slug>` | `"1"` once the access code is redeemed |
| `p2p_welcome_dismissed` | `"1"` once the welcome popup is dismissed "don't show again" |
| `p2p_streak` | `{ last:"YYYY-MM-DD", count, longest }` |
| `p2p_signs` | Array of opened framework signs |
| `p2p_journal` | Array of `{ ts, prompt, text }` entries |
| `p2p_courses_done` | Array of completed course slugs |
| `p2p_badges_earned` | Array of auto-earned badge names |
| `p2p_badges_seen` | Array of already-celebrated badge names |
| `p2p_badges_stat` | `{ earned, total }` published by the badges page |
| `p2p_rates` | Cached point rates from the journey settings |
| `p2p_pts_streak`, `p2p_pts_journal` | Running point ledgers |
| `p2p_journal_day` | `{ d:"YYYY-MM-DD", c }` per-day journal-points cap |
| `p2p_course_<course>_done` | Array of completed lesson indexes (per course, set by the player) |

---

## 7. Journal

Entries save to `p2p_journal` and render newest-first with date, optional
prompt, and delete. An **Export** button downloads a `.txt` copy. Saving an entry
also reconciles the journal badges and adds journal points (capped 5/day).
(Because it's `localStorage`, entries are per-browser until the account backend —
Export exists so learners can keep a copy in the meantime.)

---

## 8. Points economy (defaults, editable in the theme editor)

Set under the journey section's **"Points breakdown"** settings; the tap-Points
chart and the accrual math both read these same values.

| Action | Points |
|---|---|
| Finish a course | **100** |
| Brand DNA Blueprint | **75** |
| Side quest (Mindset / Purpose / Heart) | **40** |
| Download a certificate | **25** |
| Journal entry (each, up to 5/day) | **5** |
| Daily streak (each day) | **5** |
| **Earn a Merit every** | **250 points** |

The points meter (`points ÷ 250`) is labeled **Merit** in the UI (renamed from
"Level," which now belongs to the Realms). The engine function is still
`P2P.level()`; only the display label changed.

Tagline in the modal: *"These numbers will grow with you — as new courses land,
so might new ways to earn."*

---

## 9. Badges roster (42 total)

Badges are section blocks in `p2p-learning-badges.liquid`, grouped by "Family".
Each has a name, requirement, icon, color, and earned state. **Auto** = awarded
by the engine; **Manual** = editor toggle / human-granted / pending content.

**Journey Milestones** — Set Sail (auto, on reaching the journey) · First Steps
(auto, 1 course) · First Win (manual — pending Quick Wins course) · Finding Your
Current (auto, 3 courses).

**The Realms** — Made it to Shore (wave) · Through the Thicket (thicket) · In
Full Bloom (bloom) · Across the Fields (wheat) · ROOTED to Thrive (evergreen) —
one per Realm, manual until each Realm's required-course set is mapped — plus
**Reached Freedom** (star cluster) the **capstone**, auto-awarded on the badges
page once all five Realm badges are earned. These read together as the progress
journey.

**Framework Masteries** — RAFT / GROWS / ROOTED Master (manual — award on
completing that framework's course; see the xlsx badge column).

**Habits & Wins** — Founder Fingerprint (auto, Brand DNA self-attest) · First
Reflection (auto, 1 entry) · Journal Keeper (auto, 10) · Journal Devotee (auto,
15) · Trail Explorer (auto, all 3 signs) · Certified (auto, cert download) ·
Comeback (auto, streak recovered).

**Mindset Check** — Mindset I · Mindset II · Clear Mind (manual — pending
Mindset courses).

**Purpose Check** — Purpose I · Purpose II · True Purpose (manual — pending
Purpose courses).

**Heart Check** — Heart I · Heart II · Open Heart (manual — pending Heart
courses).

**Streaks** — 5 / 10 / 15 / 20 / 25 / 50 / 75 / 100 / 125 / 150-Day (all auto).

**Special** — Every Path Walked (footprints — manual, complete every course incl.
optionals) · Founder (manual, Founder's Pass) · Masterclass (manual, live event).

The badges page shows a live "X of 42 earned" summary and a badge-unlock
**popup** (aurora confetti + stars + twinkles) the first time each newly-earned
badge is seen in a browser. Icons added for the Realms: `wave`, `thicket`,
`bloom`, `grass`, `evergreen`, and `compassrose` (Every Path Walked).

---

## 10. Course player & certificate

- Lessons are section blocks (title, video embed, rich-text body, up to 3
  link-outs). Each has a **Mark lesson complete** toggle; per-course completion
  is stored in `p2p_course_<course>_done`.
- Finishing every lesson fires the **completion celebration**: a black aurora
  backdrop with drifting sparkles, falling leaves, and rising iridescent
  butterflies/dragonflies (a touch of pink — deliberately *not* falling stars).
- The **certificate** is a navy-and-gold diploma: learner name in script, course
  name, award date, and a generated ID. **Download PNG** renders it to canvas and
  saves it — which also earns **Certified**.

---

## 11. Deploy (two-hop CLI push)

There is **no GitHub → Shopify CI/CD**. Live pushes go:

1. Edit/build in this repo (`AI Creators Prompt Haus`).
2. `shopify theme push --theme 186593542462 --allow-live --nodelete --only <file> …`
   (Shopify CLI, store `blacksheepcreationsllc.myshopify.com`, live theme
   `BSC+BSI Store — Prompt Haus` #186593542462). The "not a theme directory"
   warning is harmless with `--only`.
3. **Copy the same files** into the staging mirror
   `/Users/blacksheepcreations/BSC-BSI-Store-theme` so a later full push can't
   delete the P2P files.

The store is currently **password-locked**, so "live" is visible only to the
owner — safe for staging in-progress work.

---

## 12. Key section settings

**Journey** — access code/slug; course 1–5 titles + URLs; `milestones_url`;
`brand_dna_url`; sticky offset; **`board_courses`** (drives the Progress ring &
"courses done" tile); the **Points breakdown** numbers; the four stat
placeholders; Info/Help title + body. **Badges** — eyebrow/title/subtitle; stat
placeholders; one block per badge (family, name, requirement, icon, color,
earned). **Player** — course handle + title; one block per lesson.

---

## 13. Open items / roadmap

- **Manual badges awaiting content/decisions:** First Win (Quick Wins course),
  RAFT/GROWS/ROOTED Masters (leg mapping), Mindset/Purpose/Heart families (those
  courses). Founder & Masterclass stay human-granted by design.
- **Account backend (pre-public-launch):** move all progress from `localStorage`
  → **customer metafields via App Proxy** (cross-device, no data loss on
  cookie-clear, server-timestamped streaks). Have the **Brand DNA Blueprint write
  to a shared metafield** so every Haus + the Founder Fingerprint badge read one
  source of truth — which upgrades Founder Fingerprint from self-attest to fully
  automatic, and lets onboarding pre-check itself ("✓ Already done").
- **Content:** build the actual courses + the Brand DNA assessment; define the
  leg mapping and the real total-course count (replace the Reached-Freedom-100
  placeholder).
- **Commerce:** product/preview sales page; Founder's Pass pricing; per-course
  vs. all-access paths; subscription later.
- **Multi-board / per-leg architecture (scaling the map):** a single baked board
  caps at ~8000 px tall (the art tool's limit; Shopify's 20 MP cap is higher, so
  the tool is the binding constraint) — roughly ~10 course stops per board. Do
  **not** grow one endless image. When the catalog outgrows a board, split the
  journey into **legs/chapters**, each its own board image + journey-style page,
  with a "path continues…" hand-off linking one to the next. The **RAFT → GROWS →
  ROOTED** structure is the natural regional split (one board per leg). Because
  points/badges/streaks all live in the shared engine (`window.P2P`), not in any
  one board, the multi-board map stays a single connected journey — each new leg
  is just another `p2p-learning-journey` page pointing to the next. Treat the
  current board as **leg one**, not the whole map.
