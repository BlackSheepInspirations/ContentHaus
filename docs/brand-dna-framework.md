# Brand DNA Framework — Marketing Haus

The reference document everything else builds from. Not the quiz, not the
scoring code, not the UI — the underlying model of what's actually being
measured and what it produces. Quiz questions get *tagged* against this
framework; the scoring engine reads this framework; the output generator
(mission statement drafts, suggested values, color/voice/font direction)
is a lookup against this framework's Profile Library. If a future
question, output, or profile doesn't trace back to something defined
here, it doesn't belong in the assessment yet.

## The 8 Brand Tensions

Every founder/brand sits somewhere on each of these 8 spectrums — never
purely at one end. The assessment's job is to locate where, across all 8,
and the Profile Library (below) turns that location into concrete
recommendations.

| Tension | Why it exists | Drives |
|---|---|---|
| Warmth ↔ Authority | Relationship style | Voice, photography, copy |
| Freedom ↔ Purpose | Founder motivation | Mission, values |
| Tradition ↔ Innovation | Creative direction | Visual identity |
| Community ↔ Recognition | Marketing style | Messaging |
| Structure ↔ Expression | Workflow & design instinct | Layout, typography |
| Calm ↔ Energy | Brand personality pace | Color saturation/contrast, mood |
| Accessibility ↔ Luxury | Market position | Pricing tone, visuals |
| Playfulness ↔ Sophistication | Emotional tone | Brand personality, voice |

Each tension is scored on a **-3 to +3 scale** (negative = first pole,
positive = second pole, e.g. Warmth = -3, Authority = +3). A completed
assessment produces one 8-number "tension fingerprint" per person. Quiz
answers apply weighted deltas to one or more axes at once — most answers
will touch 1-3 tensions, never all 8, which is what lets 20 questions
produce a nuanced fingerprint instead of 20 independent data points.

---

## Tension breakdowns

### 1. Warmth ↔ Authority
*Relationship style — does the brand relate as a peer, or as a guide?*

- **High Warmth**: Voice is conversational, first-name, empathetic ("we're
  in this together"). Photography is candid, natural light, real people,
  imperfect/authentic moments. Copy leans on storytelling and second-person
  warmth ("you deserve...").
- **High Authority**: Voice is declarative, confident, expert-toned.
  Photography is composed, studio-lit, credential-forward. Copy is
  proof/data-driven, structured claims, credentials front and center.
- **Feeds**: `brandVoice` (warm and approachable ↔ confident and bold /
  sophisticated and refined), `mood` (cozy/rustic ↔ professional/polished).

### 2. Freedom ↔ Purpose
*Founder motivation — building for personal autonomy, or for a mission
bigger than themselves?*

- **High Freedom**: Mission language centers independence, creative
  control, "on my own terms." Values: Autonomy, Creativity, Flexibility.
- **High Purpose**: Mission language centers impact, service, legacy,
  "bigger than me." Values: Impact, Service, Legacy, Integrity.
- **Feeds**: Mission Statement seed template, Core Values suggestions.

### 3. Tradition ↔ Innovation
*Creative direction — looking backward to craft/heritage, or forward to
disruption?*

- **High Tradition**: Classic serif typography, muted/earthy or jewel
  palettes, heritage motifs, symmetry. Mood: rustic, elegant, classic.
- **High Innovation**: Geometric sans-serif, bold/unexpected color
  combinations, asymmetric layouts. Mood: modern, edgy.
- **Feeds**: `headingFont`/`bodyFont` direction, `mood`, color palette
  family (earthy/jewel vs. bright/unconventional).

### 4. Community ↔ Recognition
*Marketing style — talking about "us" (belonging), or "me" (individual
achievement)?*

- **High Community**: Messaging is inclusive, "join us," customer-as-hero,
  shared identity. Values: Belonging, Connection, Inclusion.
- **High Recognition**: Messaging is aspirational-status, customer-as-
  individual-achiever. Values: Excellence, Distinction, Achievement.
- **Feeds**: Core Values, and downstream copy tone across Ad Copy, Social,
  and Email Studios (not just Branding Studio).

### 5. Structure ↔ Expression
*Workflow & design instinct — systems and order, or spontaneity and
freeform creativity?*

- **High Structure**: Grid-based, sectioned, symmetrical layout. Clean
  geometric sans typography, consistent hierarchy.
- **High Expression**: Asymmetric, collage-like, organic flow. Script/
  display/expressive typography mixes.
- **Feeds**: `boardLayout` (sectioned grid ↔ single cohesive mood board),
  typography direction.

### 6. Calm ↔ Energy
*Brand personality's emotional pace — soothing, or activating?*

- **High Calm**: Soft, muted, low-contrast colors. Unhurried copy pacing,
  breathing room, minimal exclamation. Mood: calm, grounded, serene.
- **High Energy**: Saturated, high-contrast, vibrant colors. Short, punchy
  copy pacing. Mood: vibrant, energetic.
- **Feeds**: Color palette saturation/contrast direction, `mood`.

### 7. Accessibility ↔ Luxury
*Market position — for everyone and approachable, or elevated and
aspirational?*

- **High Accessibility**: Friendly, approachable colors, casual
  typography, everyday imagery. Copy is plain-language, value-forward.
- **High Luxury**: Black/gold/jewel tones, refined serif or minimal
  display type, aspirational imagery. Copy emphasizes craftsmanship and
  quality over price.
- **Feeds**: Color palette family, `mood`, `brandVoice`.

### 8. Playfulness ↔ Sophistication
*Emotional tone — make people smile, or make people feel elevated?*

- **High Playfulness**: Witty, humor-forward voice. Rounded/script/
  display typography. Bright, whimsical visual style.
- **High Sophistication**: Measured, elegant, restrained voice. Refined
  serif or thin sans typography. Minimal, muted, editorial visual style.
- **Feeds**: `brandVoice`, typography direction, `mood`.

---

## What this framework outputs

Every tension breakdown above ends in **Feeds:** — a pointer to a real
field that already exists in `marketing-haus-branding.js`:

- `mood` (10 curated options)
- `brandVoice` (8 curated options)
- `headingFont` / `bodyFont` (curated font list)
- `colors` (freeform picker, guided by palette-family recommendations)
- Core Values (free-text, up to 5 — the assessment will suggest starting
  values, fully editable)
- Mission Statement (free-text — the assessment drafts a seed sentence,
  fully editable)
- `boardLayout` (3 options)

Nothing in this framework invents a new field — it's entirely a smarter,
guided way of filling in fields that already exist and currently sit
blank waiting for manual input.

---

## Founder DNA — the third layer

Where the 8 Tensions drive *how the brand looks and sounds*, Founder DNA
drives *what the brand means* — it powers Mission Statement, Core
Values, Brand Promise, Brand North Star, Decision Filters, and Founder
Narrative. Twelve independent dimensions, each scored on its own (not
bipolar pairs like the Tensions) — a founder can score high on both
Purpose and Security at once, for instance, where a Tensions-style
either/or wouldn't allow that.

Each dimension carries one mission-statement fragment and 2-3 candidate
Core Values. The final Mission Statement and Values assemble from
whichever 2-3 dimensions score highest for that founder — a small
fragment library, not a full combinatorial matrix, which is what keeps
12 independent dimensions tractable to build. Assembly template: **"We
exist for [fragment], and [fragment], and [fragment]."** — every fragment
must be a noun phrase that reads naturally slotted directly after "We
exist for" (caught one real bug during testing: a causal-clause fragment
like "because X deserves a better answer" reads as "We exist for because
X..." once concatenated — broken. Any new fragment added later must be
checked against the template the same way before being trusted.)

| Dimension | Mission fragment | Candidate values |
|---|---|---|
| Purpose | "a better answer to [problem]" | Purpose, Impact, Integrity |
| Legacy | "something that outlasts me" | Legacy, Excellence, Craftsmanship |
| Belonging | "a sense of belonging for [audience]" | Belonging, Community, Connection |
| Freedom | "the freedom to build this on my own terms" | Freedom, Autonomy, Authenticity |
| Recognition | "the recognition that comes from doing it right" | Excellence, Distinction, Quality |
| Creativity | "ideas nobody else was brave enough to try" | Creativity, Originality, Innovation |
| Security | "something steady people can count on" | Trust, Reliability, Consistency |
| Excellence | "refusing to compromise on quality" | Excellence, Craftsmanship, Standards |
| Impact | "changing what's possible for [audience]" | Impact, Service, Purpose |
| Stewardship | "protecting what matters for those who come next" | Stewardship, Responsibility, Care |
| Growth | "always becoming more of who we are" | Growth, Evolution, Curiosity |
| Service | "showing up for people, fully" | Service, Generosity, Care |

**Feeds**: Mission Statement (assembled from top 2-3 dimensions), Core
Values (assembled the same way), and downstream Brand Promise / Brand
North Star / Decision Filters / Founder Narrative once those get built
out as their own outputs.

---

## The Profile Library

The scoring engine's job, eventually, is to take a person's 8-number
tension fingerprint and find the **nearest matching profile** below
(closest by distance across all 8 axes), then hand back that profile's
full output bundle. This is the expanded, named version of Branding
Studio's existing 4 Starter Presets — same mechanism, just triggered by
quiz results instead of a manual click, and with more coverage.

Positions below are qualitative (High / Mid / Low) for now — exact
numeric thresholds get calibrated once real quiz answers exist to test
against, not invented in advance.

### The Trusted Guide
Warmth: High · Purpose: High · Tradition: Mid · Community: High ·
Structure: Mid · Calm: Mid-High · Accessibility: High · Sophistication: Mid
- **Mood**: warm and cozy · **Voice**: warm and approachable
- **Colors**: warm earth tones + soft blue · **Fonts**: Lora + Georgia
- **Values seed**: Trust, Service, Integrity, Community
- **Mission seed**: "We exist to guide [audience] toward [transformation], with honesty and care at every step."

### The Bold Pioneer
Authority: Mid · Purpose: High · Innovation: High · Recognition: Mid ·
Expression: High · Energy: High · Accessibility: Mid · Sophistication: Mid
- **Mood**: bold and vibrant · **Voice**: confident and bold
- **Colors**: black + one electric accent · **Fonts**: Bebas Neue + Inter
- **Values seed**: Courage, Innovation, Impact
- **Mission seed**: "We're building [what], because the old way of [problem] isn't good enough anymore."

### The Cozy Craftsman
Warmth: High · Freedom: Mid · Tradition: High · Community: High ·
Structure: Mid · Calm: High · Accessibility: High · Playfulness: Mid
- **Mood**: warm and cozy · **Voice**: warm and approachable
- **Colors**: warm neutrals + sage · **Fonts**: Playfair Display + Georgia
- **Values seed**: Craftsmanship, Family, Comfort
- **Mission seed**: "Every [product] is made by hand, for the people and moments that matter most."

### The Elevated Icon
Authority: High · Purpose: Mid · Tradition: High · Recognition: High ·
Structure: High · Calm: Mid · Luxury: High · Sophistication: High
- **Mood**: elegant and luxurious · **Voice**: sophisticated and refined
- **Colors**: black + gold + ivory · **Fonts**: Playfair Display + Lora
- **Values seed**: Excellence, Craftsmanship, Legacy
- **Mission seed**: "We create [what] for those who refuse to settle for ordinary."

### The Free Spirit
Warmth: Mid · Freedom: High · Innovation: Mid · Community: Mid ·
Expression: High · Energy: Mid-High · Accessibility: High · Playfulness: High
- **Mood**: boho and eclectic · **Voice**: playful and quirky
- **Colors**: bright, eclectic mix · **Fonts**: Pacifico + Poppins
- **Values seed**: Freedom, Creativity, Authenticity
- **Mission seed**: "We make [what] for people who'd rather stand out than fit in."

### The Joyful Connector
Warmth: High · Purpose: Mid · Innovation: Mid · Community: High ·
Expression: Mid-High · Energy: High · Accessibility: High · Playfulness: High
- **Mood**: playful and fun · **Voice**: playful and quirky
- **Colors**: bright, punchy palette · **Fonts**: Pacifico + Poppins
- **Values seed**: Joy, Community, Connection
- **Mission seed**: "We bring people together around [what], one [moment/product] at a time."

### The Quiet Authority
Authority: High · Purpose: High · Tradition: High · Recognition: Mid ·
Structure: High · Calm: High · Accessibility: Mid · Sophistication: High
- **Mood**: professional and polished · **Voice**: authoritative and expert
- **Colors**: muted neutrals + deep navy · **Fonts**: Merriweather + Inter
- **Values seed**: Trust, Excellence, Integrity
- **Mission seed**: "We help [audience] get [outcome] right, without the guesswork."

### The Modern Minimalist
Authority: Mid · Purpose: Mid · Innovation: High · Recognition: Mid ·
Structure: High · Calm: High · Accessibility: Mid · Sophistication: High
- **Mood**: minimalist and clean · **Voice**: confident and bold
- **Colors**: black/white + one muted accent · **Fonts**: Montserrat + Inter
- **Values seed**: Clarity, Quality, Simplicity
- **Mission seed**: "We strip away everything that doesn't matter, so [what] just works."

### The Community Builder
Warmth: High · Purpose: High · Tradition: Mid · Community: High ·
Structure: Mid · Calm: Mid · Accessibility: High · Playfulness: Mid
- **Mood**: warm and cozy · **Voice**: warm and approachable
- **Colors**: warm terracotta + cream · **Fonts**: Lora + Open Sans
- **Values seed**: Belonging, Purpose, Generosity
- **Mission seed**: "We're building something bigger than a business — a sense of belonging for [audience]."

### The Luxe Rebel
Authority: Mid · Freedom: High · Innovation: High · Recognition: High ·
Expression: High · Energy: High · Luxury: High · Playfulness: Mid
- **Mood**: bold and vibrant · **Voice**: confident and bold
- **Colors**: black + hot pink/electric accent + gold · **Fonts**: Oswald + Montserrat
- **Values seed**: Individuality, Boldness, Excellence
- **Mission seed**: "We make [what] for people who were never going to play it safe anyway."

---

## What's intentionally not decided yet

- **Exact numeric scoring weights per quiz answer** — comes after the
  20-question bank (already drafted separately) gets tagged against
  these 8 tensions, answer by answer.
- **Nearest-match distance formula** — likely simple Euclidean distance
  across the 8 axes, but worth revisiting once real fingerprints exist to
  test against.
- **Whether Profile Library grows beyond 10** — start here, expand only
  if real results cluster awkwardly between existing profiles.
