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
  - **Deferred (task #79):** Video Motion Prompt DRY (internal refactor, no user
    change); wiring the size-picker into the ~11 graphic quick-gens (enhancement).

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
