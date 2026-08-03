# Growth Haus → ROOTED — Plan of Record

**What this is:** the Growth Haus is being rebuilt from a one-generator "Prompt 2 Profit"
shell into the home of the **ROOTED Method** — a guided, tracked, 6-stage launch cockpit that
a beginner can run start-to-finish, and that turns a one-time launch into an evergreen product.

Full visual blueprint (artifact): *Growth Haus, Rebuilt on ROOTED* — regenerate/redeploy from
`scratchpad/rooted-blueprint.html` if the link is lost.

---

## The vision (locked)

- **ROOTED is the spine, not a feature.** The six stages ARE the interface.
- **Growth Haus is the conductor** — it makes nothing itself; it *points* to the right generator
  in the right Haus at the right stage. Asset generators live in their home Haus (mostly
  **Marketing**, some **Graphics/Content**). Growth Haus keeps only three things of its own:
  the **ROOTED trail**, the **Launch Profile** (product/audience/offer/brand, entered once), and
  the **lead engine** (evergreen + Buyer GPT).
- **Every output is built to go evergreen** — each asset has a live version and an evergreen
  version, so a finished launch becomes a standing product. (Deepen already has a Live/Evergreen
  fork — make it the whole Haus's principle.)
- **One door.** The old OS "ROOTED — Light the Path" tab is folded in; nav renamed
  "Growth Haus — ROOTED". The "Enter the Evergreens" link (Realm 5) lives in the Deepen stage —
  *learn the method there, run it here.*

### The ROOTED stages (ids used in code)
`reach` R · `open` O · `offer` O · `trigger` T · `escalate` E · `deepen` D
(Reach D1–3 · Open D4 · Offer D5–7 · Trigger D8 GO LIVE · Escalate D9–10 · Deepen D11+ & evergreen)

---

## Shipped (verified live)

- **Phase 1 — Trail spine + consolidate.** Hero reframed to ROOTED identity; the 4-stop
  "Prompt → Profit" journey became the 6-station ROOTED trail (what-happens + why-it-works per
  stage); absorbed the "Light the Path" overview + Evergreens link; retired the OS tab; renamed
  nav to **Growth Haus — ROOTED** (OS section + rail snippet).
- **Phase 2 — Station actions.** Each station has **"Make: <tool> →"** (deep-link to the right
  Haus) and **"Log <item> to My Success →"** (opens the planner add-flow with the type
  preselected). Planner gained `window.P2P_PLANNER_ADD(type)` + a `?add=<type>` reader.
  Map: Reach/Open/Escalate→post, Offer→goal, Trigger→product, Deepen→reminder.
- **Phase 3 — Launch Readiness.** A per-station "Mark done" toggle + a readiness bar (0–6,
  aurora gradient). Wired into the SAME `appState.rootedStages` the generator already uses
  (`renderTrailProgress`), so it's one tracker with two views and it lights up the OS Growth
  journey node.
- **Phase 4a — Guided Mode.** A "Continue your launch" button that always points at the current
  (first not-done) stage; "Next up" badge + gold outline on the current station; celebrates when
  all six are done.

---

## Next up (in priority order)

1. **Launch Profile pre-fill / threading** — ✅ **SHIPPED (2026-08-03).** Growth Haus writes a
   `p2p_launch_prefill` blob + `?prefill=1` on a "Make →" click; new `assets/p2p-launch-prefill.js`
   (on Marketing/Graphics/Content) injects the shared free-text DNA fields via the styleDNA
   setters + `ui.renderApp()`, banners, and cleans up. Reliable today: **audience** carries into
   Marketing/Graphics (the always-present shared field); product/offer/tone/problem/outcome ride
   in the stash for the deeper per-studio seeding phase. Log → title threading already done
   (`updateTrailLogTitles`). Growth Haus has no brandName input (comes from the Brand Kit), so
   business-name prefill would need to source the kit — noted for later.
2. **Premium modules — Andrea's decision (2026-08-03): generators are 100% keepers; DEMOTE them
   in Growth Haus AND CLONE all of them into Marketing Haus (they live in both).**
   - Interim demote DONE: "Premium Output Modules" → "Bonus Launch Assets" copy reframe.
   - TODO (a) stronger demote — Andrea floated a **sidebar pop-up** format (compact launcher chips
     that open each output in a modal, rather than a big tabbed section). Feasible; TBD final form.
   - TODO (b) **clone ALL premium generators into Marketing Haus** — the big one. The 9 are text-
     prompt builders (buildFullAdPackage/buildSunoPrompt/buildVideoScriptPrompt/buildVoiceoverScript/
     buildMarketingPrompt/buildCustomGptConfig/buildPhotoAnimationPrompt + buildLaunchPlan/
     build30DayCalendar in p2p-haus.js). Marketing Haus is a modular namespaced app (studios with
     styleDNA + per-studio fields) — so each becomes a Marketing "studio" fed by Marketing's own
     inputs, not a literal copy of the launch-`data` version. Sizable, phased build.
3. **Evergreen conversion** — ✅ **Live/Evergreen mode toggle SHIPPED (Phase 8)** (bound to
   `appState.deepenMode`: Live = fixed-date plan; Evergreen = relative-day always-on funnel).
   Still could add: per-output evergreen variants + a Buyer GPT builder in Deepen.
4. **Worked example** — ✅ **SHIPPED (Phase 11).** "See a sample launch" loads the Focus Planner
   sample AND seeds a go-live date so the whole dated trail is demonstrated.

### Epic upgrades — make it a TRUE launch program (ideas, ranked)

1. **⭐ Launch date → a real, dated plan (the centerpiece).** ✅ **SHIPPED (Phase 5).** Go-live
   date picker on the trail; each station shows real dates (launch = Day 8; Reach = launch-7..-5
   … Deepen = launch+3..+9); T-minus countdown; one-click **"Add my whole launch to My Success"**
   writes `p2p_pending_launch` and imports via `?importlaunch=1` (`P2P_PLANNER_IMPORT_LAUNCH`).
2. **Per-stage asset checklists** — ✅ **SHIPPED (Phase 7).** Each station lists its deliverables
   (ROOTED_STAGES `.assets`) as checkable items with an X/N count, persisted in
   `appState.rootedAssets`; checking all auto-completes the stage (synced with the done toggle).
3. **A rewarding finish line** — ✅ **SHIPPED (Phase 6).** All 6 done → confetti + toast + the
   **"Launched" badge** (+225 pts one-time: R.launch 200 + badge 25) via `window.P2P.awardLaunch()`.
   (Still could add: the "turn this evergreen" flow off the finish line.)
4. **Launch retro → next launch** — ✅ **SHIPPED (Phase 10).** Finish-line retro card (persisted
   reflection) + a "Start my next launch" reset → ROOTED is now a repeatable engine.
5. **"Launching this week" in Community** — ✅ **SHIPPED (Phase 9).** "Announce your launch to the
   flock" posts the go-live date to the community for hype + accountability.

**Everything above except #1 (Make→ pre-fill) and #2 (relocation) is now SHIPPED.** Those two
remain — they reach into other Haus apps (`marketing-haus.js` etc.), so map those first.

### Loose ends — cleared
- ✅ Brand DNA paste box retired (lean on "Load your Brand Kit").
- ✅ Orphaned OS "ROOTED — Light the Path" view markup swept.
- ✅ Worker ("Jessica") deployed with all 130 memes — no open worker deploy.
- ✅ Masterclass player wiring (`p2p-player.js` + `p2p-learning-player.liquid`) — was
  deployed live but never committed (missed in the Phase-50 `git add`); now committed.

### Code scrub (full-surface QA pass) — done
A cold adversarial review + live console sweep of the whole session surface. All JS
parses, all Liquid schemas are valid, tag pairs balance. Three real bugs found & fixed:
- **Finish-line celebration replayed on every reload** of a completed launch — the
  once-guard was a transient `window.__rootedLaunchCelebrated` global that resets each
  load. Now a persisted `appState.rootedCelebrated` flag (fires on the transition only).
- **Two "mark done" controls disagreed** — the "Your ROOTED Progress" checklist set
  `rootedStages` but not `rootedAssets`, so checking one asset would silently un-complete
  a stage. The checklist handler now syncs assets like the trail button.
- **`clearAllData` threw on a stale generator key** (removed/renamed generator left in
  saved `generatorSettings`) → "New Project" half-cleared. Now guards + drops the key.
- Verified: fresh live load throws **zero** console errors; the two older console
  exceptions (`pad is not defined`, `clearAllData …fields`) were stale/pre-fix history,
  not reproducing.

---

## 2026-08-03 — Growth Haus review polish batch (Andrea) + launch-type build (designed, deferred)

Shipped this session (all live + committed):
- **1a Make → pre-fill** and **1b keep+demote** (see Next up #1/#2 above).
- **Evergreen explainer** — always-visible Live-vs-Evergreen helper under the mode toggle
  (the detailed note only showed *after* selecting). Evergreen stays a first-class option.
- **Reference-image guidance** — callout: it shapes Frank/Ruth's prompt, and the member must
  attach the actual image *in the chat* with the prompt (tool passes direction, not the file).
- **"Leaving Growth Haus" heads-up** — `wireLeaveGuard()` in p2p-haus.js: outbound in-content
  action links (Make→ / Log→ / Enter-the-Evergreens) pop a "hop back to keep ROOTING" modal with
  a "don't show again" opt-out (`localStorage p2p_hide_leave_note`). Bubble-phase so the prefill
  href-rewrite lands first; honors new-tab intent; does NOT touch the nav rail.
- **Purpose → Profit framing** — teal "The Purpose" eyebrow over the ROOTED trail + a
  "The purpose:" line in each of the 6 stations; gold "The Profit" eyebrow over the
  "see everything you'll walk away with" flip-cards. (script: scratchpad/purpose-notes.js)
- **Template renames** — "Etsy digital download" → **Digital Download**; "Shopify product" →
  **Physical Product** (data-preset keys unchanged).

**DEFERRED — the launch-type build (Andrea to react to the field spec):** one selector,
**What are you launching?** = Digital Download · Physical Product · Business Launch · LIVE on
Socials, driving templates + conditional fields + the readiness "types" — with the existing
**Live/Evergreen** as a separate *mode* toggle (two dials, not one list). Per-type fields
sketched; **LIVE on Socials** is the big departure (drops pricing → prep checklist + self-promo
templates; bridges to the parked TikTok-Live agency vision in docs/my-success-agency-vision.md).
Business Launch + LIVE on Socials templates ship WITH this build (not before). This is the last
open Growth-Haus item; everything else from the review batch is done.

## Architecture / file map (so future sessions move fast)

- **Growth Haus page** = `sections/p2p-haus.liquid` (+ `assets/p2p-haus.css`) with the generator
  app `assets/p2p-haus.js`. Page handle `growth-haus` uses template `page.p2p-haus.json`
  (`/pages/p2p-haus` redirects to `/pages/growth-haus`).
- **The ROOTED trail markup** is regenerated by the helper script
  `scratchpad/rooted-trail.js` — it replaces the region between the readiness block (or the
  `journey__trail` div on first run) and `<details class="journey__kit">`. Edit that script and
  re-run to change stations; it's idempotent (dedupes the readiness block).
- **ROOTED stage data** = `ROOTED_STAGES` in `p2p-haus.js` (ids/letters/day/what/why/assets);
  the two tracker views are `renderRootedStages()` (in-generator checkboxes) and
  `renderTrailProgress()` (the trail bar + Guided Mode). Both read/write
  `appState.rootedStages`, persisted to `localStorage['promptToProfit.currentProject']`.
- **OS Growth progress** reads `promptToProfit.currentProject.rootedStages` (any stage truthy →
  Growth node done) — see `sections/p2p-os.liquid` signals block.
- **My Success deep-links** (planner `assets/p2p-planner.js`): `?open=kind|id` opens an existing
  item; `?add=<type>` opens the typed add-flow on today with the type preselected
  (`window.P2P_PLANNER_ADD`).
- **Evergreens** = Realm 5 ("Evergreen"), default `/pages/realm-5` (section setting
  `evergreens_url`).

### Gotchas
- Deploy is the manual two-hop (see CLAUDE.md): `shopify theme push --theme 186593542462
  --allow-live --nodelete --only <file>` then copy to the mirror `/Users/blacksheepcreations/BSC-BSI-Store-theme/`.
- The worker (`p2p-progress` / "Jessica") is pasted into Cloudflare by the user; always copy the
  **ASCII-escaped** build (`node backend/p2p-progress-worker/ascii-escape.js | pbcopy`) so the
  paste can't mojibake emojis/typography.
- Shopify minifies JS assets on its CDN — grepping the deployed file for a function name can
  return 0 even though the code is live (names get stripped). Verify behavior, not name presence.
- The old OS `data-view="rooted"` markup still exists in `p2p-os.liquid` but is unreachable
  (nav entry removed). Sweep it in a cleanup whenever.
