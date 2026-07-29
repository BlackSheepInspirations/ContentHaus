# Course Haus — Build Spec (Draft v2)

*A gated course + membership system that lives entirely inside Shopify. No community
features, no third-party platform, no member ever leaves the site. Styled to inherit the
P2P "Black Opal" look (rotating opal gradient, color-cycling letters, dark hero).*

> Name "Course Haus" is a placeholder to match the suite naming — rename freely.

**Grounding — this is not greenfield:**
- The **gate already exists**: [`sections/gpt-access.liquid`](../sections/gpt-access.liquid)
  is the exact pattern (`customer.tags contains section.settings.access_tag`, a
  `request.design_mode` unlock for the editor, a locked "Get Access" product CTA, and an
  unlocked reveal). The course system scales this up.
- The **aesthetic already exists**: [`assets/p2p-haus.css`](../assets/p2p-haus.css) has
  `--opal-fire` (rotating gradient), the `p2p-opalText` color-cycling keyframe, the
  ticker, journey stepper, and confetti. The course UI inherits this stylesheet.

---

## 1. Goal in one sentence

Members get access via a **Founder's Pass (one-time, lifetime)** or a **recurring
subscription** (and optionally per-course purchases); the dashboard is a **journey game
board** (Candy-Crush-style map of programs); a locked node prompts them to pay or redeem
a code; an unlocked course launches in-site in a course-player styled like P2P — items
can be video/text/downloads or link straight out to a Custom GPT, a Prompt Haus, or the
P2P OS; finishing a course fires **confetti**, unlocks a **customizable completion
certificate**, and lights up a gold node on the board — all wrapped in a **gamification**
layer (XP, tiers, badges, streaks) that extends the existing Launch Readiness system.

---

## 2. Core concepts

| Term | Meaning |
|---|---|
| **Program** | A top-level course/product shown as a card on the Student Dashboard. A Shopify **product** + a content definition (its items). |
| **Item** | A unit inside a program with its own completion checkmark. Types: `video`, `text`, `download`, `link-out`. |
| **Link-out item** | An item whose "content" is a jump to a Custom GPT, a Prompt Haus, or the P2P OS. First-class type, not a special case. |
| **Founder's Pass** | One-time product → permanent `founder-lifetime` tag. Never removed. Includes all current + future programs. |
| **Subscription** | Recurring product → `all-access` tag while active, removed on lapse (managed by a subscription app). |
| **Per-course purchase** *(optional)* | Buying a single program → `program-<handle>` tag. |
| **Access code** | A 100%-off discount code → $0 checkout → same tag path → unlock. |

**Design principle:** the gate checks *entitlement tags only* and never cares how they
were earned — paid, comped, code, Founder, or subscriber all resolve to the same tag check.

---

## 3. Entitlement model (the secure core)

A program is unlocked if the logged-in customer has **any** of:
- `founder-lifetime`  (one-time Founder's Pass — permanent, never auto-removed)
- `all-access`         (active subscription — added/removed by subs app on status change)
- `program-<handle>`   (that specific program bought standalone) *(optional path)*

```liquid
{% assign has_access = false %}
{% if customer
   and customer.tags contains 'founder-lifetime'
   or customer.tags contains 'all-access'
   or customer.tags contains section.settings.program_tag %}
  {% assign has_access = true %}
{% endif %}
{% if request.design_mode %}{% assign has_access = true %}{% endif %}
```

Because the gate is server-side Liquid, **locked content never reaches a non-buyer's
browser** — same guarantee as the existing gpt-access gate, not a JS hide-the-div trick.

### Why Founder + subscription coexist cleanly
- Founder's Pass tag `founder-lifetime` is written once and **no automation ever removes
  it** → true lifetime access, including every *future* program (the gate is tag-based,
  not per-course, so new programs are covered automatically).
- Subscription tag `all-access` is lifecycle-managed by the subs app (active → add,
  failed/cancelled → remove). This is the source of the classic "lost access = failed
  payment" support note; plan a small banner for it.

---

## 4. Data model

**Products**
- One product per **Program** (its price if sold standalone). Metafields:
  `program.tag` → `program-<handle>`, plus `thumbnail`, `summary`, `duration`, `level`.
- One **Founder's Pass** product (one-time). Optionally limited quantity / time-boxed for urgency.
- One **Subscription** product (via subscription app).

**Program structure** — recommend **Metaobjects**:
- `program` metaobject → repeating `item` entries. Each item:
  - `type`: `video | text | download | link-out`
  - `title`, `body` (richtext), `duration`
  - `video_url` (for video), `file` (for download), `link_url` + `link_label` (for link-out)
- Admin-editable, no dev needed to add lessons later.

**Progress**
- Per-customer completion in a customer metafield `course.progress`
  (JSON: `{ "<program-handle>": ["item-1","item-4"] }`), localStorage fallback for preview.

---

## 5. Surfaces (pages)

### 5a. Journey Game Board  *(the dashboard — our signature piece, not the reference grids)*
- The dashboard **is** a Candy-Crush-style winding path; each **program is a node**.
- **Node states:** `locked` (not owned → tap = paywall) · `available` (owned, not
  started) · `in-progress` (progress ring) · `complete` (gold + certificate ready).
- **Non-linear but suggested:** the path implies an order; any *unlocked* node is tappable.
- **Serpentine auto-layout:** nodes flow left→right→left down the page automatically, so
  adding programs extends the path with no hand-placement. Scales to any catalog size.
- Show **all** programs (locked ones drive upsells). Optional membership-status banner
  (the "failed payment = lost access" note).

### 5b. Course-player  *(ref: Daily Digital Moms / ACA screenshots — structure only)*
- **Left rail:** list of items, each with a completion checkmark; a progress bar / % at top.
- **Right pane:** the selected item —
  - `video` → embedded player (protection layer deferred, per your call)
  - `text` → richtext / checklist
  - `download` → resource link(s)
  - `link-out` → a prominent button to the Custom GPT / Prompt Haus / P2P OS
- "Mark complete" per item → updates progress + (optionally) gamification.
- Styled with the P2P Black Opal system (opal gradient header, color-cycling title,
  dark surfaces) — **not** the light look of the reference screenshots.

### 5c. Paywall (non-entitled program)
```
Program clicked
   ├─ Entitled? ──▶ LAUNCH course-player
   └─ Not entitled ──▶ PAYWALL
                         ├─ "Founder's Pass — lifetime"  ▶ checkout
                         ├─ "Subscribe"                  ▶ checkout (subs app)
                         ├─ "Buy this course" (optional) ▶ checkout
                         └─ "Have an access code?"       ▶ redeem ▶ unlock
```

### 5d. Gamification layer  *(extends the existing Launch Readiness system)*
- **XP** awarded per completed item and per completed program → drives **levels / tiers**.
- **Badges** for milestones: first course, 3 courses, all courses, streak milestones.
- **Streaks:** consecutive active days.
- **Progress rings** on each board node are fed by the same completion data.
- Reuses the existing **confetti** (`p2p-haus`) and the tier/badge patterns already built
  for Launch Readiness — one coherent point economy, not a second system.
- Stored per-customer (metafield `course.progress` + `course.stats`), localStorage fallback.

### 5e. Completion certificates  *(ref: navy-and-gold diploma screenshots = target design)*
- Unlocks at **100% completion** of a program; announced with the existing
  **confetti + "Achievement Unlocked / Congratulations"** celebration modal.
- **Customizable fields:** learner name (pre-filled from `customer`), course name (auto),
  brand / instructor name, date awarded, auto-generated verification ID.
- **Actions:** Download **PNG**, Download **PDF**, **Print**, **Share** — reuse the export
  code already used by the generators (invitations, event checklist, etc.).
- Styled navy + gold (diploma palette) with seal + signature line, per the screenshots.
- Becomes the **trophy** on the completed board node → closes the loop:
  finish course → confetti → certificate → gold star on the map.

---

## 6. Backend pieces (minimal)

- **One-time products (Founder's Pass, per-course):** a **Shopify Flow** rule —
  *order paid → add the matching tag.* `founder-lifetime` is add-only, never removed.
- **Subscription:** a **subscription app** (recommend **Seal** or **Appstle** — both add
  `all-access` on active and remove it on lapse automatically; Shopify Subscriptions +
  Flow also works but you manage removal via Flow).
- **Access codes:** native 100%-off discount codes scoped to a program → $0 checkout →
  same Flow path. (Instant no-checkout unlock would need a tiny App Proxy — only if wanted.)

---

## 7. Content / video protection

Deferred by decision — courses aren't built yet. When video ships, add a domain-locked /
signed-playback host (e.g. Vimeo) for the video layer. Text, checklists, downloads, and
link-outs are fully protected by the tag gate today.

---

## 8. Section / snippet architecture

| File | Role |
|---|---|
| `sections/course-dashboard.liquid` | Program-card grid; owned vs locked states. |
| `sections/course-player.liquid` | The gate + left-rail/right-pane player. |
| `snippets/course-item.liquid` | Renders one item by `type` (video/text/download/link-out). |
| `snippets/course-paywall.liquid` | Founder / subscribe / buy / access-code CTAs. |
| `assets/course-haus.js` | Item nav, progress, mark-complete, code redemption. |
| `assets/course-haus.css` | Thin layer over `p2p-haus.css` (inherits Black Opal). |

Reuses your established pattern (Liquid section + paired JS/CSS), the gpt-access gate, and
the P2P stylesheet. Gamification extends the existing Launch Readiness system.

---

## 9. Security model & limits (plain English)

✅ Locked programs don't render locked HTML to non-buyers (server-side, like gpt-access).
✅ Access = Shopify login + entitlement tag; no shared client-side secret.
✅ Founder access is permanent by design; subscriber access is app-managed.
✅ Codes are native discount codes — revocable, trackable, expirable.
⚠️ Video needs a domain-locked host to be leak-resistant (deferred).
⚠️ Any logged-in buyer can screen-record their own course — true of every platform; not chased.

---

## 10. Build phases

- **Phase 1 — The loop (prototype):** the **journey game board** with a few sample nodes
  in each state → tap an `available` node → **course-player** (Black Opal, left-rail items
  of each type incl. a link-out) → mark items complete → hit 100% → **confetti celebration**
  → **completion certificate** (customizable, downloadable) → node turns gold on the board.
  Launch-vs-paywall toggled by a test tag. *Demonstrates the whole emotional loop on one
  course, no backend needed.*
- **Phase 2 — Catalog + payments:** real programs on the board; Founder / subscribe /
  per-course CTAs wired to Shopify checkout; paywall on locked nodes.
- **Phase 3 — Automation:** Flow rule (Founder + per-course tagging), Shopify Subscriptions
  + Flow (all-access lifecycle), access codes.
- **Phase 4 — Depth:** full gamification (XP/tiers/badges/streaks), metafield persistence,
  video host, edge states, membership-status banner.

---

## 11. Decisions

**Locked in:**
1. **Dashboard visibility:** ✅ **Show all, lock the rest** — unowned programs show a
   locked overlay + "Unlock" CTA to drive upsells.
2. **Purchase model:** ✅ **All-access + per-course** — Founder's Pass (lifetime) and
   subscription (recurring) unlock everything; individual programs also sold standalone
   (`program-<handle>` tag).
3. **Subscription app:** ✅ **Launch on Shopify Subscriptions (native, free) + Flow** for
   entitlement tagging (same automation home as the one-time Founder's Pass). Upgrade to
   **Seal / Appstle** later only if failed-payment dunning / retention becomes a priority.
   The gate is app-agnostic (checks `all-access`), so switching later changes nothing.
4. **Rollout sequence:** ✅ **Founder's Pass first**; add recurring subscription *later,
   demand-dependent*. The board/gate are built for both from day one, so turning on
   subscriptions later is a config step, not a rebuild.
5. **Scope additions:** ✅ journey game board (dashboard), per-course completion
   certificates (customizable, downloadable), and a gamification layer (XP/tiers/badges/
   streaks) extending Launch Readiness.

**Still open (minor — don't block the build):**
6. **Founder's Pass:** limited quantity / time-boxed for urgency, or open-ended?
7. **Naming:** keep "Course Haus"?

---

*Next: Phase 1 prototype — one Black-Opal-styled course-player with mixed items (video,
text, download, and a link-out to a Haus/GPT), progress, and the launch-vs-paywall gate,
clickable in both states.*
