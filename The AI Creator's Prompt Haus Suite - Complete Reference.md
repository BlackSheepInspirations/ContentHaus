# The AI Creator's Haus Suite — Complete Reference

*Black Sheep Creations & Inspirations*

This document is the full, current inventory of every Haus in the suite: what each one is for, everything inside it, and what each individual piece actually does. It reflects the tools as they exist right now — every mode, generator, and mechanic described here has been verified directly against the live code.

---

## The Big Picture

The Prompt Haus Suite is five gated, independently-purchasable Shopify tools, plus one external AI business partner (Frank, in the Idea Haus), built around one idea: a creator shouldn't need to know prompt-engineering conventions to get a professional, well-formed AI prompt. Each Haus is a guided form — pick from curated options, and the tool assembles a polished, platform-formatted prompt behind the scenes. None of the Hauses generate images or copy themselves; they produce the *text* a creator pastes into an AI image tool (Midjourney, ChatGPT/GPT Image, Kittl, Ideogram, Leonardo AI, Adobe Firefly, Flux) or hands to Frank.

The six pieces, and the role each plays in a creator's actual journey:

- **Idea Haus (Frank)** — where an idea gets validated and sharpened before anything gets built.
- **Content Haus** — where a specific image/character/text asset gets designed, one prompt at a time.
- **Project Haus** — where that asset becomes a sellable printable/digital product (planners, journals, coloring books, cards, checklists).
- **Graphics Haus** — where standalone graphic assets get built (clipart, mascots, icons, novelty items).
- **Marketing Haus** — where a creator promotes and sells what they've made (ads, social content, mockups, email, sales copy).
- **Brand Haus** — where a creator discovers and locks in who they are as a brand, so everything above stays visually and tonally consistent.

Every Haus shares a common design language: a Business/Voice DNA bar for shared context (tone, audience, holiday/theme/niche, negative prompt, target platform/aspect ratio/buffer), a Vault for saved prompts (with version history), a Recent Log safety net, Starter Presets, and — in the newer Hauses — a Look Lock or Brand Kit so a creator's aesthetic carries consistently from one generation to the next. Nothing generated in one Haus is ever silently duplicated into another; each Haus that shares a capability (Look Lock, Brand Kit, the 3-variation system, Page Bundles) implements its own copy, adapted to that Haus's own vocabulary — a deliberate choice so each product can evolve independently.

---

## Idea Haus — Frank, the AI Business Partner

Idea Haus isn't a Shopify tool — it's a custom GPT, [The Idea Haus](https://chatgpt.com/g/g-6a489ad05ac48191a7692939b09fc6f1-the-idea-haus), and Frank is the persona inside it. Access to Frank is included with a Brand Haus purchase.

Frank's role is deliberately different from the other Hauses: he doesn't hand back a finished prompt or asset — he has a real conversation. When a creator brings him an idea (whether it's a raw thought or a structured brief handed off from Brand Haus's Find Your Direction), Frank is built to ask clarifying questions back rather than simply answer, so the exchange sharpens the idea rather than just validating whatever was typed first. That's the specific gap he fills: every other Haus assumes the creator already knows what they're building. Frank is where "what should I even build" gets worked out.

**How he connects to the rest of the suite:**
- **Brand Haus → Frank**: Find Your Direction (a step inside Brand Haus) produces a ready-to-paste brief — built from a short intake specific to whether the creator is building a personal/creator brand or a niche product — with a "Copy for Frank" button and a direct link into the Idea Haus. Frank picks up exactly where that intake left off.
- **Frank → every other Haus**: once an idea is validated and sharpened, the actual building happens back across Content/Product/Graphics/Marketing/Brand Haus — Frank is the front door, not a replacement for any of them.

Frank's presence is also woven into the tone of the rest of the ecosystem — the "Coffee with Frank" quotes and tips that appear throughout Brand Haus's Find Your Direction flow (and the standalone QuickStart companion guides) are written in his voice, so a creator meets the same personality whether they're inside the Shopify tools or talking to the GPT directly.

---

## Content Haus

*(code-named "Prompt Haus" internally — the original, foundational tool in the suite)*

**What it's for:** Building a single, polished AI image-generation prompt — a portrait, a character, a couple, a family, a group of animals, standalone text-art, or a graphic — without knowing prompt-engineering conventions. This is the most granular Haus: every other Haus either builds on top of Content Haus's own engine or exists to turn a Content-Haus-style asset into something sellable or promotable.

### The 9 Modes

**Character** — One stylized human or "animal mascot" portrait. A Base Type toggle (Human vs. Animal Mascot) swaps the entire Identity field set. Covers Character Style (59 curated style options, each carrying a full descriptive paragraph behind a simple label, across 8 buckets like Cartoon & Animation, Realism & Portraiture, Retro/Alternative/Digital), full Identity (ethnicity/species, age, gender, body type, occupation), Appearance (hair, eyes, expression, facial features, makeup, beard), Styling (outfit, shoes, accessories, jewelry, tattoos, headwear), Presentation (pose, background, lighting, camera angle, framing), Extras (fantasy elements, props, archetype), and an optional Companion (up to 3 animal companions). Also the only mode with a **Video Motion Prompt** companion — a second, separate prompt for animating the rendered image in an image-to-video tool (MidJourney, Kling AI, Runway, or a generic option), covering motion/action, camera movement, duration, audio, and quality — built specifically so a creator doesn't need a second manual round-trip to Frank just to get a motion prompt.

**Couples** — One shared-scene portrait of two people or two mascots together. Person A and Person B each get their own full Identity/Appearance/Styling set (with a Swap button), while scene-level fields (style, background, lighting, relationship vibe, pose/interaction) live once, in a shared Couple Dynamic group, so the two people are never described into contradictory scenes.

**Friends & Family** — Group portraits, from a couple of people up to a full multi-generational shot. Adults and Kids are two independent, progressively-revealed slot arrays (currently capped at 5 each), each with a trimmed identity/appearance/styling field set. A shared Family Dynamic group covers group pose, coordination style, and relationship vibe; also has its own optional Add Text sub-panel.

**Animals & Creatures** — The animal(s) or creature(s) themselves are the entire subject (distinct from Character Mode's lightweight Companion attachment). Up to 3 independently detailed creature slots (breed cascade, color, outfit, props, attitude, pose), each rendered as its own sentence in the final prompt.

**Text** — Standalone text-art/typography prompts (e.g. a t-shirt phrase). Core Style fields (Letter Style — 34 options, each a full styled paragraph; Color Scheme; Text Case; Text Effects) stay fixed across every variation, while Variation Details (spacing, word shape/stack, icon pack, background) are free to vary. Supports an optional Second Phrase — either an inline accent word or a fully independent second line with its own complete style set and its own position.

**Graphics** — Standalone graphics distinct from full portraits: vanity plates, product shots, transportation art, decorative object compositions. "What Is It" lets a creator pick one core element per category (animal, character, nature, food, object) each with its own quantity stepper; "Style It" toggles between Illustrated and Realistic; a dedicated Custom Vanity Plate sub-system covers plate style/finish/lettering/accents/text; a Transportation sub-system cascades from category (air/land/rail/water/military) to a matching vehicle list.

**Combined** — Weaves a Character-mode subject, Text-mode lettering, and Graphics-mode style into one single cohesive scene, not three side-by-side prompts. It reads the *same live state* the standalone Character/Text/Graphics tabs edit — build a character on the Character tab, switch to Combined, it's already there.

**Image/Prompt Reference** — Recreate or reinterpret an existing image or a prompt found elsewhere as an original AI generation. A dual toggle covers "Reference an Image" (uploaded photo stays browser-only, purely visual; a required description is what actually feeds the prompt) or "Reference a Prompt" (pasted prompt used only as loose creative direction, with an explicit instruction to the receiving AI not to reproduce it verbatim). A **Regenerate** button rerolls just the style/scene fields while leaving the typed source untouched — a quicker "give me another take" than a full Randomize.

**Collection Builder** — A pure aggregation view across the other 8 modes: "View All" shows every checked mode's live, fully-formatted prompt side by side; "Combine Prompts" (capped at 3) splices several modes' finished prompts into one labeled document.

### Shared across every mode
A dark "Project Setup" bar (Project Type, Aspect Ratio, Target Platform, Variations, Image Buffer, Output Format, Negative Prompt) and a "Concept / Creative Direction" box (Holiday, Creative Theme, Niche, Target Audience, Mood) apply everywhere. Every mode has its own tuned Randomizer (caps decorative fields, excludes identity-defining and creative-direction fields from ever being randomized), a Reset, a 5-slot Vault per mode (each with up to 5 versions), a 10-entry Recent Log, and a set of Starter Presets that touch only style/scene — never who's depicted. A **Brand Kit** (up to 3 saved identities: colors, fonts, mood, voice, core values) can inject brand-consistent descriptors into any mode's assembled prompt.

---

## Project Haus

**What it's for:** Turning an idea into a sellable printable or digital product — planners, journals, coloring books, invitations, devotional cards, checklists, activity pages, and more. Built from two families sharing one shell: a few **broad, fully-editable Studios**, and a larger set of **narrow "Quick Generators"** (a locked base prompt plus 3–6 visible fields, each usable with zero input).

### The 8 Categories

**Cards & Invitations** — *Invitations & Stationery Studio*: writes wording and describes visual design for weddings, showers, birthdays, graduations, holidays, and thank-you cards, with 4 starter presets.

**Stationery & Devotionals** — *Stationery Studio* (business note cards, change-of-address cards) and the *Devotional Pages Generator* (a Page Bundle: cover, daily reading spread, reflection/journal prompt spread, blank/notes pages, closing — pick up to 6).

**Journals** — *Journal Page Generator*: a category-conditional Page Bundle where the chosen Journal Category (Financial, Health, Personal Growth, Relationships, Creativity) determines which page types are even offered, each auto-translating its stated purpose into a natural instruction. *Junk Journal Generator*: cover, ephemera spread (a scattered/collaged look), themed spread, blank/notes pages, closing — pick up to 6.

**Planners & Checklists** — *Planner Pages That Sell*: title/goal, target user, page type, vibe, style, and a grouped Sections picker (up to 10 across Productivity/Goals/Mindset/Wellness/Creative/Finance). *Event Checklist Generator*: supports **17 event types** (Wedding through Vacation/Group Trip), each with its own real planning-checklist content that swaps in based on the chosen event, every item individually toggleable, plus a separate "design frame" prompt that explicitly avoids rendering any text. *Event Vendor Checklist Generator*: the same mechanic applied to a fixed vendor-tracking category list (name/contact/quote/deposit rows) rather than an event-specific list.

**eBook Pages** — *Ebook Pages Generator*: cover, intro/TOC, a reusable content-page template, blank/write-in pages, notes, and a closing/CTA page — pick up to 6.

**Devotional & Motivation Cards** — *Devotional & Motivation Card Studio*: single cards, social graphics, or a full card deck/series (with sheet layout math so front and back prompts stay aligned when printed double-sided); Faith Tradition spans Christian, Jewish, Islamic, Hindu, Buddhist, Sikh, secular, and general-inspirational. *Prayer Cards Generator*: a boxed 3-card-plus-back set.

**Wall Art** — *Retro Muse Wall Art Generator*: a locked mid-century-modern flat-vector identity. *Quote Wall Art Generator*: 14 design styles worded by appearance rather than abstract name, plus a Text Color Mode that changes the actual rendering instruction (single solid, two-tone, per-line, per-letter, high-contrast).

**Activities & Learning Pages** — *Cute Animals Coloring Page*, *Adult Coloring Page* (mandala/botanical/geometric/zen/paisley/celestial themes), *Coloring Book Generator* (cover + 3 interior pages, bundle), *Activity Book Generator* (cover, maze, word search, connect-the-dots, matching — genuinely different activity types per page, not variations of one page), *Kids Worksheet Generator* (with a capped Activities picker and an explicit privacy steer against a child's real name/school/address), and *Learning Cards Generator* (a flashcard set: ABCs, numbers, shapes, colors, sight words, animals, days/months, or any custom focus).

### Look Lock & Brand Kit
**Look Lock** (Quick Generators only) captures the *aesthetic* of one page — art style, color palette, mood, texture, motifs — as a saved Look (cap 5), so a second, different generation can carry the same feel forward. **Brand Kit** (visible everywhere, cap 5 total: 2 of your own plus up to 3 read-only kits synced in from Brand Haus) stores colors, fonts, mood, voice, and core values, contributed as extra descriptor text to whatever's currently generating.

### Shared mechanics
The 3-variation system (As Selected / + A Little Extra Charm / + More Dynamic) on every non-bundle generator; Page Bundles replace it entirely where used; a Randomizer, Reset, 5-slot Vault per mode (5 versions each), 10-entry Recent Log, and the shared Business/Voice DNA bar (Business Name, Tone, Audience, Reading Level, Target Platform, Aspect Ratio, Buffer, Output Format, Negative Prompt, Holiday/Theme/Niche).

---

## Graphics Haus

**What it's for:** Standalone AI-image prompt building for sellable graphic assets — clipart, characters, icons, mascots, novelty items — rather than full portraits or written copy. Grid-first: every mode is a narrow, single-purpose generator, reachable through a two-row tab bar.

### The 7 Generators

**Clipart Pack Generator** — A themed clipart *pack*, not a single image: hero icon, supporting icon set, seamless pattern, and a decorative banner/frame (pick up to 4, sharing one locked look), across 12 named themes (Holiday, Y2K, AfroLuxe, Cozy Bookish, Coastal Soul, and more) with 6 starter looks.

**Seasonal Cute Animal Generator** — One charming, seasonally-dressed animal character.

**Faux Textile Character & Object Generator** — A character or object rendered as a handmade yarn/knit/patchwork/felt/quilted textile piece.

**Retro Object Icon Generator** — A single nostalgic object icon (stamps, soda cans, vinyl records, gems) in a consistent retro style.

**License Plate Generator** — A custom novelty license-plate graphic with its own proportion/lettering/border conventions.

**Mascot Generator** — Renders a saved recurring brand mascot in a new pose. Its own visible fields are pose-only (action, scene context, expression) — the mascot's actual identity (species, traits, palette, art style, personality) is pulled live from a saved **Mascot Lock** profile, so the same character stays recognizable across every pose.

**Graphics Studio Generator** — A flexible "any subject, any style, any scene" generator for anything that doesn't fit the other six.

### Combined, Reference, and Collection Builder
**Combined Mode** lets a creator pick 2–3 of the 7 generators plus one shared art style and color palette, then composes all of them into one unified scene — not separate panels. **Image/Prompt Reference Mode** mirrors Content Haus's own version (reference an image or a pasted prompt, with a Regenerate button), adapted to graphics vocabulary. **Collection Builder** aggregates across all 7 generators plus Combined and Reference — View All or Combine up to 3.

### Look Lock, Mascot Lock & Brand Kit
**Look Lock** (cap 5) captures general aesthetic — art style, palette, mood, texture, motifs — shareable across any generator. **Mascot Lock** (cap 3) is deliberately separate: it locks a *specific character's identity* so it never drifts even if a different Look gets activated elsewhere. **Brand Kit** (cap 5: 2 own + 3 synced from Brand Haus) contributes business-level descriptors (colors, fonts, mood, voice, values).

### Shared mechanics
Same 3-variation system, Page Bundles (used by Clipart Pack), Randomizer, Reset, 5-slot Vault per mode (5 versions each), 10-entry Recent Log, and the shared Business/Voice DNA bar as the other Hauses.

---

## Marketing Haus

**What it's for:** Everything a creator needs to promote and sell what they've made — product mockups, social captions, ad copy, marketing emails, sales/landing page copy, testimonial formatting, and a full grab-bag of ready-to-use marketing graphics.

### The 6 Broad Studios

**Mockup Studio** — Stages a finished design onto a real product (apparel, drinkware, candles, bottle labels, bags, stationery, tech, home decor) in a styled photorealistic scene, with a capped Surrounding Props checklist.

**Social Media Studio** — One studio covering every common post shape (Instagram/Facebook post, carousel, TikTok/Reels hook+caption, Pinterest pin description, LinkedIn post, Story overlay) — writes captions/copy only; the actual graphic comes from the Quick Generators below.

**Ad Copy & Creative Studio** — Headline and body copy for Meta, Google Search/Display, TikTok, Pinterest, and LinkedIn ads.

**Email Studio** — Subject line and body for newsletters, promotions, welcome series, abandoned-cart recovery, launches, and win-backs.

**Sales & Landing Page Studio** — Everything from a short product description up to a full multi-section sales page, with explicit named zones (headline, benefits, how-it-works, testimonials, FAQ, guarantee, final CTA) once a longer format is chosen.

**Testimonial & Social Proof Formatter** — A transformation tool, not a from-scratch generator: takes a customer's actual words and reformats them (Instagram graphic caption, website card, star-rating snippet, before/after, video script, case study) without ever rewriting the substance. Randomize is intentionally disabled here — scrambling someone else's real words defeats the purpose. Carries a standing legal/permissions reminder.

### Quick Generators (12 narrow generators)
Infographic Generator (6 structural types, each with its own layout instruction), Promotional Flyer Generator, Pinterest Pin Generator (the actual pin graphic, distinct from Social Studio's caption), Quote Graphic Generator (for social/marketing use, distinct from Project Haus's sellable Quote Wall Art), Lead Magnet Cover Generator, Product Advertisement Graphic Generator, Media Kit Generator (a 4-page bundle pulling colors/fonts/mood from the active Brand Kit), Social Media Cover/Banner Generator (with real, source-checked pixel dimensions per platform), Social Post Template Generator, Digital Elements Pack Generator (icon sets, dividers, callouts, frames — a bundle of small reusable branded pieces), Video Motion Prompt Generator (a second prompt for animating an already-rendered image, pulling brand mood in automatically), and Short-Form Video Script Generator (the one generator that writes an actual script — hook, body, on-screen text, CTA — rather than an image prompt).

### Look Lock & Brand Kit
Same pattern as Graphics Haus: Look Lock (cap 5, aesthetic profiles) for the Quick Generators tab, Brand Kit (cap 5: 2 own + 3 synced) visible on every tab.

### Shared mechanics
The Business/Voice DNA bar (Business Name, Tone, Audience, Reading Level, Variations, Target Platform, Aspect Ratio, Buffer, Output Format, Negative Prompt, Holiday/Theme/Niche), the 3-variation system on narrow generators, Randomizer, Reset, 5-slot Vault per mode (5 versions each), 10-entry Recent Log, and a full cross-mode Vault export.

---

## Brand Haus

**What it's for:** Discovering and locking in who a creator is as a brand — a personalized **Brand DNA Blueprint™** that then cascades into everything else: colors, fonts, mission, voice, a logo, and a set of ready-to-use branded assets. This is the most feature-rich Haus in the suite.

### The Journey, Step by Step

**1. The Archetype Guide** — Before answering a single question, a creator can click through all 11 Brand DNA archetypes on an interactive wheel to see each one's name and one-word identity. Purely exploratory — nothing here affects the real result.

**2. Welcome** — Sets expectations for the assessment ahead.

**3. Brand DNA Assessment (Founder Interview™)** — A 30-question, one-at-a-time conversation (not multiple-choice trivia) with a progress bar and a revisit-without-erasing Back/Next mechanic. Scores across 8 Brand Tensions™ (e.g. Warmth↔Authority, Freedom↔Purpose), 12 Founder DNA™ dimensions, and a Customer Impression™ layer (self-image, reflection, relationship, differentiation).

**4. Your Brand DNA** — The results reveal, matched to one of **11 brand-identity profiles** (The Trusted Guide, The Bold Pioneer, The Cozy Craftsman, The Elevated Icon, The Free Spirit, The Joyful Connector, The Quiet Authority, The Modern Minimalist, The Community Builder, The Luxe Rebel, and The Trail Forger). Presented as a 7-chapter narrative: an identity reveal with a percentage Alignment Score and a personalized **Founder Fingerprint™** radar wheel, the full Tension/DNA breakdown, how the brand naturally expresses itself (voice, mood, color, typography), an AI-drafted mission/North Star/promise/core values, why it fits, how it lands with customers, and next steps.

**5. Your Blueprint** — Three exportable documents: a one-page **Blueprint Snapshot**, a full **Brand DNA Report**, and the **Brand Playbook™** — a 19-guide deep-dive organized into 5 Parts (Understanding Your Brand, Building Your Brand, Bringing Your Brand to Life, Operating Your Brand, Long-Term Growth), each with a real table of contents, chapter badges, and a dramatic cover treatment. A Save Results vault (3 slots) and automatic version history (5-deep) both live alongside this step.

**6. Find Your Direction** — A short, un-scored intake with two paths: **"I Am the Brand"** (creator/influencer — platform, content genre, format, audience size, goals, blockers) or **"I'm Building a Niche Product"** (spark, buyer, product type, platform, gaps, blockers). Produces a ready-to-paste brief with a direct link into the Idea Haus, so Frank picks up exactly where the intake left off.

**7. Branding Studio** — with three sub-tabs:
- **Branding Studio** — one composed brand-identity-board image prompt (palette, typography, mood, mission, values), auto-populated from the assessment match.
- **Logo Studio** — a deeper 3-tier field set (Lite/Standard/Pro) producing a full **Logo Board**: primary logo, simplified icon, wordmark-only, favicon, and single-color versions.
- **Quick Generators** — the **Business Card Kit Generator** (front + back, pulling colors/fonts/mood from the active Brand Kit, with name/title/contact fields, a logo-space toggle, and a QR-code-placement choice) and the **Media Kit Generator** (a 4-page bundle — cover, stats & audience, portfolio, contact — with named stat widgets that never invent a number for anything left blank).

**Brand Kit** — Up to 3 saved identities (colors, fonts, mood, voice, values, mission), shareable into Marketing Haus and Graphics Haus/Project Haus's own Brand Kits.

**FAQ & Help** — A standing reference covering the assessment, the archetype system, what a purchase unlocks, what Find Your Direction is, who Frank is, and how retaking works.

---

## How It All Connects

A creator's actual path through the suite usually looks like this: an idea starts vague, gets sharpened with **Frank** in the Idea Haus (often via a brief handed off from Brand Haus's **Find Your Direction**), gets built into a real asset in **Content**, **Product**, or **Graphics** Haus, gets promoted and sold with **Marketing Haus**, and stays visually and tonally consistent across all of it because **Brand Haus** already defined the colors, fonts, mission, and voice everything else is quietly pulling from — via each Haus's own Brand Kit, synced from the one Brand Haus actually owns.

No single Haus is required to use another — each is independently purchasable and useful entirely on its own — but they're built to reinforce each other: a Business Name typed once in Brand Haus can show up correctly in a Media Kit generated in Marketing Haus; a Look locked while building one coloring page in Project Haus carries into the next; a character built in Content Haus's Character Mode is exactly what's already loaded when that same creator switches to Combined Mode.
