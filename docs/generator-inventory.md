# Generator Inventory & Review

A living, haus-by-haus scrub of every generator: its **sections → widgets**, what it
**outputs** as a prompt, and recommendations on **order, gaps (added/needed), and
duplication**. Andrea marks each item **KEEP / TWEAK / ADD / REMOVE**; the resulting
punch-list is what we execute from.

Started 2026-08-05. Pulled from live code (not guessed).

### Update log

- **2026-08-05 — Marketing Haus restructure shipped.**
  - Shared bar re-org: split into **Brand DNA** (Business Name, Reading Level +
    text Negative Prompt; each field include/exclude toggle) shown everywhere, and
    **Image Output** (Variations, Target Platform, Aspect Ratio, Buffer, Output
    Format) scoped to image modes only (Mockup + Generators).
  - **Tone + Audience peeled out** of the shared bar into each studio's own Voice
    widget (Email, Sales, Testimonial got their own; Content Studio owns its own).
  - **Social Media + Ad Copy consolidated into "Content Studio"** (renamed from
    Content Kit). Ad Copy folds in as Purpose = "Run a paid ad" (Objective/Urgency/
    Headline Style + Offer + Headline/Primary text/Description deliverables). Social
    folds in as an optional Fine-tune panel (hook style, carousel slides, hashtag
    style, emoji usage). New: **Purpose** widget + **"Also make a matching image
    prompt"** sub-panel (Subject/Background/Lighting/Art Style, reuses the size).
  - Marketing tabs now: **Content Studio · Mockup · Email · Sales · Testimonial ·
    Customer Intelligence · Quick Generators** (was 7 studios).
  - **Quick Generators grouped** under 5 subheadings (Graphics · Copy · Video &
    Audio · Bundles & Kits · Strategy Docs) with per-group counts.
  - **Merges shipped:** Thank You Card + Gift Message → **Insert Card** (Card Type
    toggle); SEO Copy + GEO/AI Search → **Search Visibility Copy** (Optimize-For
    toggle, per-mode granularity folded away — flagged in-file). Originals kept
    registered but `hideFromGrid` (Vault-safe). Video Ad **Kit** (all-in-one plan)
    vs **Bundle** (separate shot prompts) differentiated via labels/descriptions.
  - 26 grid cards (28 registered − 2 hidden).
  - **✅ SHIPPED (task #79, commit `8b04605`):** Video Motion Prompt DRY — shared
    `marketing-haus-motion.js` now feeds both the standalone quick-gen and the
    Mockup Studio companion (duplicated vocabulary removed, both entry points kept,
    output byte-identical). Size-picker wired into all 11 graphic quick-gens via a
    `usesSizing` flag: the engine auto-injects one "Output Size" dropdown (25
    platform/format/px combos) and appends the size clause to every variation.
    Opt-in (defaults to "Any / no specific size"). Also committed the previously
    dangling Content Studio + `sizing.js` wiring (`dfc2c96`) so git matches live.
  - **✅ Mockup Studio premium pass (commit `c436235`):** was strong on inputs but
    only ever emitted ONE prompt. Added (1) an opt-in **multi-shot Listing Kit** —
    one product+design → coordinated Hero / Close-Up Detail / In-Use Lifestyle /
    Flat-Lay-Scale / Alternate-Angle prompts, each formatForPlatform'd; (2) **Design
    Placement** + **Material/Finish** fields (precise outro clauses); (3) the exact
    **Output Size** picker (shared 25-combo catalog); (4) catalog expansion
    (+socks/apron/beanie, koozie, poster/framed print, new Gifts & Novelties group).
  - **✅ Cross-Haus Copy-button bug fix (commit `26407a6`):** the variation/bundle
    Copy buttons in Graphics + Marketing dropped Aspect/Negative/Output/Buffer (same
    bug fixed in Project Haus); fixed both engines + block renderers.

---

## Top-level menu (all 6 Hausen)

- **Content Haus** (9 modes): Character · Couples · Friends & Family · Animals & Creatures · Text · Graphics · Combined · Image/Prompt Reference · Collection Builder
- **Marketing Haus** (7 studios + 28 quick gens): Mockup · Social Media · Ad Copy & Creative · Email · Sales & Landing Page · Testimonial · Customer Intelligence — plus 28 Quick Generators
- **Graphics Haus** (7): Clipart Pack · Seasonal Cute Animal · Faux Textile Character & Object · Retro Object Icon · License Plate · Mascot · Graphics Studio
- **Project Haus** (9): Cards & Invitations · Stationery & Devotionals · Journals · Planners & Checklists · eBook Pages · Devotional & Motivation Cards · Wall Art · Activities & Learning Pages · Stickers
- **Brand Haus** (guided flow): Archetype Guide → Welcome → Brand DNA Assessment → Your Brand DNA → Your Blueprint → Find Your Direction → Branding Studio
- **Growth Haus / ROOTED**: Your Product (Info · Audience · Pricing · Brand) → What to Make → Get Your Pack

---

## 1. Marketing Haus

Two systems: **7 Studios** (mostly text/copy, multi-section) + **28 Quick Generators**
(mostly image/graphic, single-purpose). Shared **Business/Voice DNA bar** (Business,
Tone, Audience, Reading Level, Holiday, Theme, Niche) + **Brand Kit** prepend to every
text studio; **Variations** count lives in the shared bar.

### 1A. The 7 Studios — verdict: KEEP all (each has a distinct output)

| Studio | Output | Note |
|---|---|---|
| Mockup | 🖼️ image (product mockup) | only image studio; embeds a Video-Motion add-on that literally duplicates the Video Motion quick-gen |
| Social Media | ✍️ social copy | broad social-copy tool |
| Ad Copy & Creative | ✍️ ad copy | headline+body |
| Email | ✍️ email + subject | distinct |
| Sales & Landing Page | ✍️ section-by-section sales copy | most powerful copy tool |
| Testimonial Formatter | ✍️ reshapes real feedback | unique transform tool (not a generator) |
| Customer Intelligence | 📄 multi-section report from a saved Customer Profile | most sophisticated; feeds voice/ideas everywhere |

### 1B. The 28 Quick Generators — grouped by output

**🖼️ Image / graphic (single):** Promotional Flyer · Hero Banner · Infographic · Lead Magnet Cover · Product Listing & Ad Photo (photo) · Pinterest Pin · Social Post Template · Product Ad Graphic · Quote Graphic · Social Cover/Banner · Gift Message insert · Thank You Card insert
**🖼️ Image bundles (multi-element):** Digital Elements Pack · Media Kit
**✍️ Copy (single):** 30-Day Content Calendar · Creative Direction Brief · Custom GPT Builder · GEO/AI Search · Product Listing · SEO Copy · Tags & Hashtags
**🎬 Video / audio:** Video Motion Prompt (image→video) · Short-Form Video Script · Voiceover Script · Suno Music
**📦 Copy/mixed bundles:** Launch Content Bundle (copy) · Video Ad Kit (written ad kit) · Video Ad Bundle (VO + video-shot prompts)

### 1C. Recommendations

**Clear merges (true duplicates):**
1. **Thank You Card + Gift Message → one "Insert Card"** with a Card-Type dropdown. Identical 6×4 Printify spec + near-identical fields. *[decision: ____]*
2. **SEO Copy + GEO/AI Search → one "Search Visibility Copy"** with an engine toggle (Google/traditional vs AI answer engines). Same input shape. *[decision: ____]*
3. **Video Ad Kit vs Video Ad Bundle** — heaviest overlap; both are "full video ad package." Kit = written plan; Bundle = generatable VO+shot prompts. Either merge, or sharply differentiate the labels so members know which to pick. *[decision: ____]*
4. **Video Motion Prompt** is literally duplicated between the standalone quick-gen and the Mockup Studio add-on — DRY to one shared module (keep both entry points). *[decision: ____]*

**Format-variant clusters (judgment call — many-simple vs fewer-smart):**
- Social graphics: Social Post Template · Pinterest Pin · Quote Graphic · Social Cover/Banner
- Ad/promo graphics: Flyer · Product Ad Graphic · Hero Banner
→ Could each collapse to ONE generator with a platform/surface dropdown. BUT for a beginner audience, discrete labeled buttons ("Pinterest Pin") reduce thinking. **Rec: keep discrete; don't over-merge.** *[decision: ____]*

**Order / organization (high-value, low-risk):**
- The Quick Generators grid should be **grouped with subheadings** (Graphics · Copy · Video & Audio · Bundles · Strategy Docs) instead of a flat list — makes 28 navigable. *[decision: ____]*

**Gaps / added-needed:** coverage is broad; the main "gap" is organization, not missing tools. Possible adds: a multi-slide **Carousel graphic** set; a **Story/Reel cover**. *[decision: ____]*


---

## 2. Brand Haus

A **guided 7-step wizard** (not a generator grid), gated on `brand-haus-access`/`all-access`.
Router in `assets/brand-haus-ui.js` (`STEPS`). `?bh_focus=1` hides the Branding Studio so
the P2P OS can embed the assessment alone as the "Founders Assessment."

### 2A. The 7 steps — section → widgets → output

| # | Step | Widgets / inputs | Output |
|---|---|---|---|
| 1 | **Archetype Guide** | Interactive Archetype Wheel (11 clickable wedges → name + one-word) + explainer + Continue | Educational only; no data written |
| 2 | **Welcome** | Intro copy + Begin button | Transition only |
| 3 | **Brand DNA Assessment** (Founder Interview™) | Intro (first name, business name, what you do, who you serve) → **30 one-at-a-time option-card questions** (Brand Tensions + Founder DNA + Customer Impression™), progress bar, Back/Next | Scores **8 Brand Tensions + 12 Founder DNA + 4 Customer Impressions**, matches 1 of **11 profiles** (+ alignment % + up to 2 influences), builds mission + core values. Saves version history (max 5). **Publishes `p2p_archetype` → P2P OS** |
| 4 | **Your Brand DNA** | 7-chapter read-only dashboard: alignment ring, Founder Fingerprint radar, 8 tension sliders, DNA bars, palette + typography cards ("Use This Pairing" applies fonts to Branding Studio), mission/values, strengths/blind-spots, Customer Impressions | Read-only diagnosis; only write is font-pairing apply |
| 5 | **Your Blueprint** | 3 collapsible exportable docs — **Snapshot** (one-pager) · **Brand DNA Report** · **Brand Playbook™** (21 chapters); each has Export → PDF (print dialog) | Merges Branding Studio edits over raw match; read-only deliverables |
| 6 | **Find Your Direction** (Path Intake) | Un-scored fork: **"I Am the Brand"** (8 Qs) vs **"Niche Product"** (mixed free-text + option Qs, with conditional physical/digital follow-ups) → assembles a **brief for Frank (Idea Haus GPT)** | Plain-text brief, Copy-for-Frank + external GPT link. **Not saved to Vault** |
| 7 | **Branding Studio** | 3 sub-tabs: **Branding Studio** (tagline, 6 colors, heading/body fonts, mood, voice, mission, core values, board layout + presets) · **Logo Studio** (deep logo prompt, ~20 fields, archetype-driven) · **Quick Generators** (4: Media Kit, Thank You Card, Business Card Kit, Gift Message) | Branding Studio → one brand-identity-board image prompt (exact hex + verbatim text). Auto-populated from the assessment match |

**Shared state / cross-Haus:** `blackSheepBrandKitVault` (shared Brand Kit — read by Marketing/Graphics/Product/P2P Haus) · `p2p_archetype` (recolors the OS rail + drives OS hero) · `brandHausFavorites` (Vault + assessment history) · `brandHausBrandKits`.

### 2B. Recommendations

**Duplication (within Brand Haus):**
1. **Thank You Card + Gift Message → "Insert Card"** — Brand Haus's Quick Generators has these as two separate gens, exactly the pair just merged in Marketing Haus. Mirror the same Card-Type-toggle merge here for consistency. *[decision: ____]*

**Duplication (across Hausen) — likely LEAVE:**
- Media Kit / Thank You / Gift Message also exist in Marketing Haus. Per the codebase's "verbatim port, never shared" rule (each Haus is a standalone purchase), this is intentional. **Rec: don't merge across Hausen.** *[decision: ____]*

**Flow / order:**
2. **"Find Your Direction" (step 6) placement** — it's an un-scored ideation handoff to an external GPT, sitting between Blueprint and Branding Studio and interrupting the DNA→Studio arc. Options: keep · move to after Branding Studio · make it an optional side-quest. Also: it's the **only step that doesn't persist** — save its brief to Vault/Recent Log. *[decision: ____]*
3. **Archetype Guide (step 1)** — purely educational, before the assessment even starts. Keep, or make it skippable/collapsible so eager users jump straight to the assessment. *[decision: ____]*

**Output quality:**
4. **Branding Studio prompt** — consider target-platform/size awareness (like Marketing's sizing picker) so the brand board can be exported at a chosen spec. Minor enhancement. *[decision: ____]*
5. **Quick Generators (only 4)** — too few to need the subheading grouping Marketing got. Keep flat. *[decision: keep flat]*

**Gaps:** Coverage is deep (this is the most sophisticated Haus). Main opportunities are consistency (the Insert Card merge) + the step-6 placement, not missing tools.

### 2C. Restructure shipped (2026-08-05)

- **Split into two products** (one access tag for now — `brand-haus-access`):
  - **Founders Assessment** = `/pages/brand-haus?bh_focus=1` → the diagnostic flow, steps 1–6 (Archetype Guide … Find Your Direction). Unchanged.
  - **Brand Haus** = `/pages/brand-haus` → the standalone **Branding Studio** only (Branding / Logo / Quick Generators as the sidebar nav). No assessment steps.
  - Branding Studio hydrates the saved assessment snapshot on load, so it still auto-populates colors/fonts/mission when standalone. "Continue to Branding Studio" in the assessment crosses to `/pages/brand-haus`; the studio shows a "Take the Founders Assessment" nudge when no assessment exists.
- **Insert Card merge** (Brand Haus Quick Gens): Thank You Card + Gift Message → one **Insert Card** (Card Type toggle), mirroring Marketing. `hideFromGrid` support added to the Brand Haus grid.
- **Find Your Direction now persists** — answers saved to `localStorage.brandHausDirection`, brief survives a refresh.
- Not done (not requested): Archetype Guide skippable.

---

## 3. Content Haus (Prompt Haus)

**9 modes** on a big shared spine. Entry `sections/prompt-builder.liquid` → `#prompt-haus-app`;
per-mode logic in `assets/prompt-builder-<mode>.js`, all rendering in `prompt-builder-ui.js`.
Modes hang off `window.PromptHaus`; Collection Builder has no module (lives in ui.js).

### 3A. Shared infrastructure (wraps every mode)

- **Style DNA / "Project Setup" bar** — Project Type (~24, drives auto aspect) · Aspect Ratio · Target Platform (8 tools, controls output formatting) · Variations (1–4) · Image Buffer · Output Format · Negative Prompt (+chips).
- **Concept • Creative Direction box** (rendered inside each mode) — Holiday (60+) · Creative Theme (~35) · Niche (~50) · Target Audience (~60) · Mood (~45). "Pick up to 2."
- **Imagery & Scene Elements** — 9 categories × 2 slots w/ quantity.
- **Filter** — shared post-look, next to Art Finish.
- **Engine** (`buildSentence` / `buildMetaInstruction` / `formatForPlatform`) · **Brand Kit** ("My HAUS Style", 3 kits) · **Vault** (max 5/mode) · **Character Style pill system** (shared by Character/Couples/Family/Animals/Reference) · Stepper · Tips · 23-Q FAQ.

### 3B. The 9 modes — verdict: KEEP all (each distinct)

| Mode | Core widgets (beyond shared) | Output |
|---|---|---|
| **Character** | Base Type (human/mascot), Character Style pill, Art Finish, Identity, Appearance, Styling, Presentation, up to 3 Companions, Extras, **Video Motion sub-panel** | single-sentence portrait prompt |
| **Couples** | A↔B swap, shared look, Couple Dynamic, two full person panels, Companions, Extras | multi-sentence "Character A / B" |
| **Friends & Family** | Group Dynamic, up to 5 Adults + 5 Kids slot lists, Companions, **Add Text**, Extras | one sentence per person + text |
| **Animals & Creatures** | 3 creature slots (Category→Breed cascade + colors/pose/props), style pill, Frame It, **Add Text** | one sentence per creature |
| **Text** | Core Style (Letter/Color/Case/Effects), Filter, **2nd Phrase** sub-panel, Variation Details | meta-instruction, forced to 1 image |
| **Graphics** | Illustrated/Realistic toggle, Frame It, 5 subject slots + Transportation, **Vanity Plate** sub-panel | "Create a graphic … featuring" |
| **Combined** | Orchestrates Character+Text+Graphics; Overall Style, Character Position | one woven `buildSentence` |
| **Image/Prompt Reference** | image-upload vs paste-prompt toggle, Reimagined Style, Presentation, Add Text, **live Generate Image** (Gemini) | anti-plagiarism reinterpret prompt |
| **Collection Builder** | View-all checklist + Combine-up-to-3 splicer over the other modes | aggregates/ splices other modes' prompts |

### 3C. Recommendations

**Gaps / asymmetries (user-facing — the high-value adds):**
1. **Add Text on Character & Couples** — Family/Animals/Reference have an Add Text sub-panel, but a plain Character or Couple portrait can't layer lettering without switching to Combined. Add the same sub-panel to both. *[decision: ____]*
2. **Frame It parity for Animals & Graphics** — both omit **Time/Era** + **Camera Angle** (and Graphics also omits **Scene Effect**) that the other presentation modes have. A vintage creature portrait / period graphic can't set era or angle. Add the missing fields. *[decision: ____]*
3. **Spread Video Motion Prompt** — only Character has the "animate this image" companion; Couples/Family/Animals/Graphics/Reference produce equally animatable images. Extend it (bigger, optional). *[decision: ____]*
4. **Hide Variations where it's ignored** — the shared Variations dropdown shows on every mode but Text forces it to 1 and Reference/Collection don't use it. Hide it there to stop implying it does something. *[decision: ____]*

**Duplication (internal tech-debt — invisible to users, real regression risk → recommend DEFER):**
- Companion slot, Add Text, animal-mascot Hair→Texture fix, the shared-DNA-entry appending, and the Character Type/Art Finish→paragraph pattern are each re-implemented across 3–7 modes. A shared-set change today means editing up to 7 files. Worth a DRY pass eventually, but no user-facing change and high blast radius — park it. *[decision: ____]*

**Not merging:** all 9 modes are genuinely distinct (Combined weaves one scene; Collection splices finished prompts — different jobs). Keep them.

### 3D. Shipped (2026-08-05)

- **Combined transposition bug fixed** — Character's Presentation scene fields
  (Background/Scene Effect/Lighting/Framing) had vanished from Combined (each of
  Character's Presentation and Graphics' Frame It deferred to the other, so
  neither rendered/assembled them). Now Character's Presentation owns them in
  Combined (shown + in the prompt), and Extras (fantasy elements/props) carry over
  too. Only Character's Style group stays excluded (Graphics Style It is the one
  overall style). Verified Background flows into the built prompt.
- **Frame It parity** — added **Time/Era + Camera Angle** to Animals & Graphics
  Frame It (both already had Background/Scene Effect/Lighting/Framing), default
  empty. Both verified.
- **Video Motion Prompt spread** — the "Turn This Into a Video Prompt" companion
  now shows in Couples/Family/Animals/Graphics/Reference (was Character-only);
  excluded from Combined. Vault snapshots extended so those modes save the video
  state. Verified.
- **Declined:** Add Text on Character/Couples (kept text in Combined only).
- **Open question:** Combined weaves a single **Character** (not a Couple) — if
  Combined should support couples, that's a separate larger build.

---

## 4. Graphics Haus

**Tab-bar Haus** (no grid): **7 generators** (Clipart Pack · Seasonal Cute Animal ·
Faux Textile · Retro Object Icon · **License Plate** · Mascot · **Graphics Studio**)
+ row-2 modes (Combined · Image/Prompt Reference · Collection Builder). Same narrow-
generator engine as Marketing (`registerGenerator`), shared Style DNA bar, Brand Kit,
Look Lock (aesthetic carry-over), Mascot Lock, Vault. Every generator emits 4 variation
blocks + platform formatting + auto Holiday clause.

### 4A. Key finding — the vanity/license plate

The intended structure is **already in place**: License Plate is its own standalone
tab (split out of Graphics Studio), and Graphics Studio mirrors Content Haus's Graphics
tab (~75–80%). The problem is **option depth**, not architecture:

| | Content Haus vanity (great) | Graphics Haus License Plate (weak) |
|---|---|---|
| Plate Type | **22** (glam + masculine range) | State/Plate Style — **5** |
| Frame / Base Style | **22** | Border Style — **3** |
| Finish | **19** | **3** |
| Letter Style | **15** | none (baked into suffix) |
| Top + Bottom Accents | **23 each** | 1 free-text corner motif |
| Plate Text Color | **16** | none |
| State/Region | **~65 grouped** | none |
| **Total** | **~9 controls / ~180 options** | **6 controls / ~17 options** |

**BUT** the Graphics Haus plate has the *better wrapper*: a real standalone plate brief
(wide-rectangle proportions, isolated on transparent bg, legibility suffix), 4
variations, Look Lock, paired-color presets — none of which Content Haus's vanity has
(it's a *facet of a scene*, not a standalone plate). **Ideal = Content Haus's field
depth inside Graphics Haus's standalone engine.**

### 4B. Graphics Studio vs Content Haus Graphics tab (the intended mirror)

Faithful subset. Gaps: single **Main Subject** dropdown vs Content Haus's **5 What-Is-It
slots with quantity**; flat 14-item Art Style vs ~60 + Illustrated/Realistic toggle;
**no Time/Era, no Camera Angle**; Transportation flattened to 16 items vs the 5-category
cascade. (Engine limit: narrow-generators support only flat option lists / free-text —
no grouped/cascading dropdowns; that's the one architectural limiter behind both the
flat Transportation and the missing State/Region picker.)

### 4C. Opportunities / recommendations

1. **Upgrade the License Plate tab** — port Content Haus's rich option depth (Plate Type
   22 · Base Style 22 · Letter Style 15 · Top/Bottom Accents 23 · Plate Text Color 16 ·
   Finish 19) into the Graphics Haus License Plate, KEEPING its standalone output +
   variations + Look Lock. Mostly additive field-list work. State/Region needs flattening
   (engine can't group) or an engine tweak. *[decision: ____]*
2. **Graphics Studio parity** — add Time/Era + Camera Angle (trivial, flat lists exist),
   matching the Content Haus Frame It parity already shipped. Multi-subject/quantity and
   the Transportation cascade are bigger (engine change). *[decision: ____]*
3. **Content Haus vanity** — already "great" on options but embedded in a scene; leave as
   is, or optionally give it the same standalone plate output the Graphics Haus one has.
   *[decision: ____]*

### 4D. Shipped (2026-08-05)

- **License plate split into two purpose-built tabs:**
  - **Custom License Plate** (realistic) — reworked the old weak one into a true DMV
    plate: state/region (~65 flat), plate style, letter style, plate text color,
    realistic finishes, border, corner motif.
  - **Luxury Vanity Plate** (NEW tab) — full port of Content Haus's rich vanity
    catalog: 22 plate types (glam + masculine), 22 frame styles, 15 letter styles,
    16 text colors, 23 top+bottom accents, 19 finishes, + 3 presets, a/an grammar.
  - Both keep Graphics Haus's standalone output + 4 variations + Look Lock. So the
    "real look" and the "fun look" are each great and separate.
- **Graphics Studio parity** — added Time/Era + Camera Angle (default empty).
- Deferred (bigger, engine change): multi-subject/quantity + Transportation cascade
  in Graphics Studio; leaving Content Haus's own vanity as-is (already loved).

### 4E. Engine/UX value-adds shipped (2026-08-05)

All applied across every tab via the shared bar/engine:
- **DNA cleanup:** removed Business Name (dead for image gen).
- **Product / Size** field (sticker, tumbler wrap, tee, mug, poster, coloring page,
  logo…) — auto-suggests aspect ratio + injects a product clause into every prompt,
  now **print-readiness-aware** (cutout → transparent/die-cut; wrap → seamless;
  print → 300 DPI + bleed).
- **Cross-Haus "Make a product mockup →"** on every generator preview → Marketing
  Mockup Studio (marketing-haus reads ?studio=<mode>).
- **"One Matching Sheet"** mode for page bundles (Clipart Pack) — single-prompt full
  set, guaranteed cohesive; plus the earlier cohesion clause + matching tip.
- **Grouped dropdowns (optgroups)** in the narrow-generator engine — Transportation
  grouped by category; State/Region grouped by US/Territories/International. (Chosen
  over a true per-field cascade: same benefit, far lower risk.)

---

## 5. Project Haus

**Tab Haus** (9 tabs, ~18 generators), files prefixed `product-haus-*` (section
`sections/product-haus.liquid`, template suffix `product-haus`; gated `product-haus-access`).
Same narrow-generator engine as Graphics/Marketing (registerGenerator, page bundles,
4 variations, Look Lock, Vault). **DNA bar = Business/Voice DNA** (Business Name, Tone,
Audience, Reading Level, Holiday, Theme, Niche, Target Platform, Aspect Ratio, Output
Format, Buffer, Negative). Deepest generators: Journal Pages (13 fields, dynamic bundle),
Planner Pages, Devotional (multi-sheet decks), Stickers.

### 5A. Print-product vet (the priority)

| Product | Status | Premium? | Gaps |
|---|---|---|---|
| **Stickers** | ✅ `sticker-sheet` | ~7.5/10 (best of the 4) | no **kiss-cut**, no standalone single die-cut, no 300 DPI/bleed, no finishes (matte/gloss/holo), no matching-set bundle |
| **Coloring Pages** | ✅ 3 gens (cute single · adult · coloring-book bundle) | ~7/10 (closed-region note is genuinely premium) | **no KDP framing** (trim size, one-sided/no-bleed-through, gutter, 300 DPI); singles are 3-variation, no multi-page pack |
| **Seamless Patterns** | ❌ **DOES NOT EXIST** | — | net-new (digital paper / wrapping / fabric) |
| **Tumbler / Product Wrap** | ❌ **DOES NOT EXIST** | — | net-new (edge-to-edge seamless wrap, tumbler sizes, seam alignment) |

### 5B. Structural findings

- **No Product/Size field in the DNA bar** (unlike Graphics Haus now) — sizes are scattered per-generator, many generators have no size field at all. No global print-size/orientation/DPI concept.
- **Print-readiness inconsistent** — "300 DPI" appears in exactly ONE generator (`kids-worksheet`); no generator specifies bleed/safe-zone/trim/gutter.
- **BUG (high-impact, low-effort):** Output Format / Aspect Ratio / Negative Prompt / Buffer only reach the LIVE preview — the variation ("+ Charm") and bundle-page **Copy buttons emit raw text WITHOUT** the transparency/aspect/negative directives (`renderLabeledBlocksSection` uses raw `v.text`; only `renderPreview` runs `formatForPlatform`). So copying a transparent-PNG sticker variation loses the transparency instruction.
- Duplication: coloring line-style/complexity/closed-region constants + checklist option arrays copy-pasted across files.

### 5C. Opportunities (recommendations)

1. **Build the 2 missing generators** — **Seamless Pattern** + **Tumbler/Product Wrap** (both pure data-definition files, no engine change). *[decision: ____]*
2. **Upgrade Stickers to premium** — Cut Type (Die-Cut / Kiss-Cut), standalone single-sticker mode, finishes, 300 DPI/bleed, matching-set bundle. *[decision: ____]*
3. **Coloring KDP framing** — trim sizes (6×9/8.5×11/8×10), one-sided/no-bleed-through, bind gutter, 300 DPI; optional multi-page pack for the singles. *[decision: ____]*
4. **Systemic (mirror Graphics Haus):** add a **Product/Size** DNA field + a **shared print-readiness clause** (300 DPI / transparent-where-relevant / bleed / trim) injected into every generator — premium-ifies all 18 at once. *[decision: ____]*
5. **Fix the Copy-block format bug** so Output Format/Aspect/Negative apply to variation + bundle Copy buttons, not just the live preview. *[decision: ____]*

### 5D. ✅ SHIPPED (2026-08-05) — all 4 workstreams approved & built, verified live

- **Chunk 1 — systemic + Copy bug** (commit `7688b3e`): **Product / Size** dropdown added to the DNA bar (15 products) → auto-suggests aspect ratio + injects a per-product **print-readiness clause** into every generator (cutout→transparent/die-cut · wrap→seamless · KDP→single-sided+gutter · other print→300 DPI+bleed/safe margin). Copy-button bug fixed: variation + bundle Copy buttons now run through `formatForPlatform` (`formatBlockText` in `product-haus-generators.js`); engine `toTagStyle` now falls back to `assembled.text` when no fragments, so Midjourney/Leonardo block copies keep the full prompt (was collapsing to `--ar/--no`). Files: `product-haus-styledna.js`, `product-haus-generators.js`, `product-haus-ui.js`, `product-haus-engine.js`.
- **Chunk 2 — 2 new generators** (commit `f8559c9`): new **Patterns & Wraps** category. **Seamless Pattern** (`seamless-pattern`) — tileable digital paper / wrapping / fabric / background, repeat layout + motif scale, locked seamless-tile suffix (L→R, T→B edge continuity). **Tumbler / Product Wrap** (`tumbler-wrap`) — full-bleed wraps for 20/30/40 oz tumblers + glass cans + mugs + bottles, per-product template dims injected, seam-alignment + top/bottom safe-zone suffix, 300 DPI sublimation-ready.
- **Chunk 3 — Stickers premium** (commit `7aea25b`): **Cut Type** (Die-Cut vs Kiss-Cut), **Finish** (matte/gloss/holo/glitter/clear), **standalone single mode** (count=1 → centered single-piece framing, not sheet-grid; arrangement + size are count-computed tokens), **matching-set cohesion** in Variety/Single-Subject modes, **300 DPI + bleed + safe cut margin** in the locked suffix.
- **Chunk 4 — Coloring KDP framing** (commit `267d7d7`): new shared helper `product-haus-kdp.js` (trim sizes 8.5×11 / 8×10 / 6×9 / 7×10 / 8.5×8.5, Print Setup single-printable-vs-bound-gutter, one clause builder) wired into all 3 coloring generators. Trim + orientation + 300 DPI, gutter vs even margins, single-sided/no-bleed-through on every prompt; the Coloring Book bundle stamps every page (multi-page pack). Removed redundant baked-in "8.5x11" page-format labels.

**Deferred / not built:** true multi-product sticker *bundle* (engine is either-4-variations-OR-page-bundle, so a bundle would drop the 4 variations — cohesion delivered in-mode instead).
