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

