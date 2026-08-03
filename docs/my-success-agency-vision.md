# My Success → TikTok Live Creator-Agency layer — vision notes

**Status:** exploration only. No build started. Captured from a late-night strategy
conversation so we can think on it well-rested. Andrea's friend owns an **official
TikTok LIVE creator network / agency (MCN)**; the goal is to make *My Success* the
tool those creators (and their managers) actually run their business on — a **true
value add**, not another cold analytics dashboard.

---

## The core thesis (Andrea's, and it's the right one)

**Hybrid: auto-quant + creator-supplied qual.**

- Pull the **numbers** automatically — straight from TikTok if possible, or at least
  from the Creator Network **daily**, so hours / diamonds / valid days / followers
  populate without anyone typing them.
- Hold the **creator accountable for the parts numbers can't catch** — the hook, the
  feeling, the energy, what they tried, the retro. The qualitative layer.
- Numbers say *what* happened; the creator's notes say *why*. The manager coaches on
  both. **That combination is the differentiator** — most tools do one or the other.

This is the spine to design around. Everything below serves it.

---

## Q1 — Low-lift, high-value adds for TikTok Live creators

My Success already has the scaffolding (typed items, calendar, dashboard widgets,
streaks, journal), so most of this is *new flavors of existing things* = small lift.
Ranked by value-per-effort:

1. **Live Session item type (keystone).** A variant of the existing Post: scheduled
   date/time + duration, then an after-stream log — **hours streamed, diamonds, peak/
   avg viewers, new followers, new subs**, PLUS the qual fields (hook, feeling, what I
   tried, retro). This is the atom everything else feeds off. Nothing works without it.
2. **Agency quota tracker (killer for a network).** Monthly targets (hours, valid days,
   diamonds) as progress rings — "38/60 hrs · 14/20 valid days." Sums logged sessions.
   #1 reason network creators get dropped is quietly missing quota; this makes it
   impossible to miss. Retention gold.
3. **Go-live consistency streak.** Point the existing streak engine at Live Sessions.
   Consistency is the algorithm lever.
4. **Best-time-to-go-live heatmap.** Computed purely from the creator's own logged
   sessions (peak viewers by weekday × hour). No external data, high "whoa," gets
   smarter with logging.
5. **Diamonds → earnings rollup.** Configurable diamond→$ rate, rolled alongside the
   product revenue already tracked, into goals.
6. **Post-live retro prompt.** Reuse the journal — "what worked, what to change." Builds
   a personal playbook. (This IS the qual layer of the thesis.)

**If forced to pick two:** #1 Live Session type + #2 quota rings. ~a day of work,
turns a generic planner into *the tool a TikTok Live agency runs on*.

---

## Q2 — Can we auto-port stats/analytics from the platforms?

**Push vs pull correction:** TikTok doesn't *push* scheduled exports to third parties.
The model is *we pull* on a schedule. Our side is trivial — Jessica (the Cloudflare
worker) already crons every 15 min; a job that loops the roster and upserts each
creator's numbers is normal. **The gate is entirely TikTok's side: does the API expose
the data?**

- **OAuth Display API** (creator authorizes our approved app): can pull **follower
  count, likes, video count, video list** on a schedule. **No LIVE data** — ceiling
  doesn't move.
- **LIVE metrics (diamonds, hours, gifts, live viewers, valid days): NOT in any public
  TikTok API.** They exist only in-app / Creator Center / LIVE Backstage / the **agency
  (MCN) backend**.
- The friend **is an official agency**, so the roster LIVE data exists in their agency
  backend — but that backend is primarily a **dashboard UI**. Whether their program tier
  exposes a **programmatic feed** (API / SFTP / scheduled CSV) is program- & region-
  specific and only their **TikTok account manager** can confirm.

**Two questions to put to the TikTok rep (get a fast yes/no):**
1. Does our LIVE agency program provide an **API or scheduled data feed** (not just the
   dashboard) for managed creators' LIVE metrics — hours, diamonds, valid days?
2. If yes, does pulling a creator's data need **that creator's individual OAuth consent**
   on top of agency membership, or does agency scope cover it?

**Scoping — confirmed:** either door, they can only ever see **their own managed /
consenting creators**, never arbitrary TikTok users. Likely a **two-layer consent**
(agency membership + per-creator OAuth for sensitive data) — normal, and good privacy
hygiene.

**Practical stance:** don't make integrations the foundation. Foundation = fast manual
"log last night's live" (feature #1) + optional CSV import. Auto-data is a garnish that,
IF the agency feed lands, upgrades the whole thing from "as good as the creator's
diligence" to "real, trustworthy, automatic."

---

## Q3 — Access tiers + manager dashboard

**Feasible — mostly assembly of what we already have, with one security-critical piece.**

- **Tiers** reuse the existing Shopify customer-tag gating, plus a role hierarchy:
  **Creator** (own data) · **Manager** (own + their roster) · **Owner/Admin** (all).
  Defining tiers = cheap (tags + which pages/endpoints each can hit).
- **Roster model (lowest lift):** tag each creator with their manager (`mgr:jane`) and
  tag managers `role:manager`. Admin-editable in Shopify, no new datastore. (Alternatives:
  metafield list, or KV map in the worker.)
- **The one genuinely new capability — cross-user reads, enforced SERVER-SIDE.** Today
  the worker returns the *requesting* customer's own metafield (App Proxy signs = knows
  who's asking). A manager reading *other* creators' data must go through the worker:
  (1) verify requester is a manager, (2) verify each creator is in *that* manager's
  roster, (3) read those metafields via the **Admin API** (needs a server-held admin
  token; App Proxy only exposes the current customer). **Never client-side** — or anyone
  edits the JS and pulls the whole roster. This is the careful 20%; it's how any SaaS
  "team" feature works.
- **Manager dashboard:** a gated page → worker `/apps/p2p/roster` → compact rollup per
  creator (hours / diamonds / quota % / streak / last-live), sortable, click into one
  for detail. **Reuses existing dashboard widgets** → small-to-medium UI. One spot,
  only their people.
- **Dependency:** only as good as what's logged (mirror of Q1). Creator logging OR the
  agency feed fills it. The feed is what makes the manager view genuinely powerful.
- **Transparency note:** tell creators at onboarding their manager can see in-platform
  metrics. Normal for an agency; just say it so it's not a surprise.

**Effort read:** tiers/role tags trivial · manager-page gating small · worker roster
endpoint + Admin-API cross-read + scoping = the real build (bounded, careful auth) ·
dashboard UI small-medium.

---

## Competitor landscape (from general knowledge — verify with a sourced scan)

The space has lots of *adjacent* players but the specific intersection we're aiming at
is genuinely thin. Buckets:

- **Brand-side influencer marketing platforms** — Grin, CreatorIQ, Aspire, Captiv8,
  #paid. Powerful, but they serve *brands* running campaigns/ROI, not creators managing
  themselves or agencies managing Live rosters. Different buyer entirely.
- **General social scheduling + analytics** — Later, Planoly, Metricool, Sprout Social,
  Hootsuite. Multi-account, team seats, cross-platform analytics — but general social,
  not TikTok-Live, and none capture the qualitative/coaching layer.
- **"Everything app for creators" / link-in-bio** — Beacons, Linktree, Koji. Media kit +
  some analytics + monetization. Broad, shallow on Live, no agency roster/quota ops.
- **Creator finance** — Karat, Willa, Lumanu. Payments/banking/commission — orthogonal;
  could be a later integration angle, not a competitor.
- **Live-stream analytics (Twitch/YouTube origin)** — Streamlabs, StreamElements, Stream
  Hatchet. Live-native but not TikTok-agency roster/quota, and cold on qual.
- **TikTok's own** — Creator Center, LIVE Backstage/Studio, and the **agency/MCN portal**
  (roster hours/diamonds/valid days). Closest to the friend's need, but clunky,
  TikTok-scoped, no qual layer, no coaching, no cross-platform.
- **TikTok-Live-agency-specific SaaS** — a thin, newer, often **region-specific**
  (MENA/SEA, where Live gifting is huge) niche: host-hours/diamonds/commission dashboards
  + roster management. Names are fuzzy/regional — **do NOT fabricate; confirm in a sourced
  scan.** Reality on the ground: **most agencies run on spreadsheets + TikTok's portal.**

### Where the whitespace / true value-add is
1. **Quant + qual hybrid.** Almost nobody pairs auto-numbers with creator-supplied hook/
   feeling/retro. This is the moat (Andrea's thesis).
2. **Agency manager oversight scoped to a roster, with quota tracking** — underserved
   outside TikTok's own clunky portal.
3. **Embedded in a coaching ecosystem** — competitors are pure dashboards; ours is
   dashboard + curriculum (P2P journey / ROOTED) + community + accountability. That's the
   "do better" angle.
4. **The real competitor is the spreadsheet.** The bar isn't beating Grin — it's being
   obviously better than a Google Sheet + TikTok's portal. Value-add has to be *felt*
   fast (quota rings, streaks, one-tap log) or agencies won't switch.

---

## Social Media Realm (TikTok) — PARKED (blueprint only, do NOT build yet)

**Decision (Andrea):** shaped but intentionally **not built**. Focus stays on launching
the existing product and proving it (proof-of-concept traction) *before* expanding. This
lives here as a ready-to-go blueprint so nothing's lost.

**Scope: TikTok-only.** Every other platform (IG, YouTube, etc.) becomes its *own
separate* realm later — we don't know those platforms well enough yet, and mixing them
would dilute. One platform, taught deeply. (The earlier "FB/FF market" idea was a
misspeak — dropped.)

**Slots as:** Realm 6 in the Learning Journey — reuses the realm map / course player /
badges / points / certs / **Masterclass type** already built.

### Creator track (levels)
- **L1 Foundations** — mindset, platform literacy, profile/setup, how the algorithm
  rewards you, content pillars.
- **L2 Content craft** — short-form structure, **the hook / retention / feeling** (the
  qual thesis, taught explicitly), series thinking, trends without losing your voice.
- **L3 Going Live** — setup, hosting energy, holding a room, engagement loops, gifting
  mechanics, PK/battles, beating the lulls, consistency as the #1 lever.
- **L4 Growth engines** — grow rooms, PKs for reach, collabs, cross-promo (TikTok-native
  tactics).
- **L5 Monetize & scale** — diamonds → dollars, subs, brand deals, diversify, run it like
  a business.
- **L6 Modeling success** — case studies, shadow-a-pro, build your own playbook (also a
  recurring lesson device across levels).

### Manager split-level
Creator core (they must know the craft) **+ a manager branch unlocked by the
`role:manager` tag** (reuses the access-tier model above). Branch: manager foundations ·
roster ops (quotas + the manager dashboard) · coaching the *qual* layer + 1:1s ·
motivation/retention (spot burnout & churn early) · team & compliance (recruiting, TikTok
policy, safeguarding, group grow-room strategy).

### "Items" — the differentiator (beyond video)
Applied items that **write to My Success**: action items (log your first Live, set the
week's hour goal, run a grow room + log it) · templates (content calendar, Live
run-of-show, **hook bank**, PK scripts) · challenges wired to the **existing badges/points**
(7-day Live streak, first 1k diamonds) · reflection prompts (qual/journal) · **Masterclass
capstones** (type already built) · track-completion **certs**. Closes the loop:
lesson → logged Live → quota ring → manager coaches.

### Open when we return
- Name the realm (ideas: The Live Room · Center Stage · Spotlight Pasture · Flock & Follow).
- Format/voice: micro-lessons (3–7 min) vs full courses; her teaching vs guest creators
  vs curated mix.
- Whole-map-first vs spike **one** level (L3 · Going Live) as the proof-of-concept.
- Other-platform realms (IG/YT/…) = future, separate, need a subject-matter expert.

---

## Open questions / next steps (for a fresh session)

- [ ] Ask the TikTok rep the two feed/consent questions (Q2) — determines whether
      auto-quant is real or manual-first.
- [ ] Run a **sourced competitor scan** (WebSearch) to name the real TikTok-Live-agency
      tools and confirm the whitespace before committing to a design.
- [ ] Decide the MVP wedge: almost certainly **Live Session type + quota rings** (Q1
      #1+#2) — usable even before any TikTok feed exists.
- [ ] Design the **role/roster model** (tags) + the **server-side cross-read** contract
      in the worker (the security-critical piece).
- [ ] Sketch the **manager dashboard** rollup (offered as a mockup; deferred by Andrea).

**Guardrail carried over:** the worker is pasted into Cloudflare by Andrea (ASCII-escaped
copy), never auto-deployed; cross-user reads must be enforced in the worker, never the
client.
