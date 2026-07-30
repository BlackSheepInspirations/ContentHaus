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

**What Andrea needs to provide when we start:**
- Turn on **Settings → Apps and sales channels → Develop apps** in the store admin
  and create a custom app (owner permission — no Shopify Partner account needed).
- Hand over one API key/token from that app.
- Pick metafield-vs-database (recommend **metafield** to start).

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

## 3. ~~Known bug — panel-switch scroll~~ ✅ FIXED

Clicking a nav tab now scrolls the toolbar to pin at the top with the panel title
just beneath it — consistently, no bounce. Fix (in `assets/p2p-journey.js` +
`.css`): a single scroll to a *stable* target (`panelDocY - stickyOff - barH + 2`;
panelDocY is constant because the bar/spacer always occupies barH before the panel,
so no re-measuring/feedback loop = no bounce), plus a `min-height:calc(100vh - 40px)`
on `.panel` so even short panels (Progress/Bonuses) have room to pin the bar the
same way tall ones do. Verified against a faithful sticky-bar mock.
