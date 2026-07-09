# Brand DNA Blueprint — Working Canon
### Black Sheep Creations LLC · Index of Record

Single source of truth for what's actually been decided on the Brand DNA
Blueprint. Doesn't duplicate content — points to where each piece lives,
and labels its status so nothing gets re-debated by accident.

**Status key:** ✅ Approved · 🟡 Pending · 🔵 Future Consideration (not v1)

---

## 1. Vision / Positioning
✅ **Approved.** The Blueprint is a discovery engine, not a preference
form — it exists because most people fail at AI-generated branding by
jumping straight to creation without knowing who they are, who they
serve, or what they stand for. The assessment becomes the front door;
branding output is the translation of what it discovers, not the
starting point. *(No standalone file yet — captured in conversation
history and echoed throughout the Framework and Principles docs.)*

**Scope boundary — approved.** The Founder Interview diagnoses *who the
founder is and how that should show up* (voice, aesthetic, values,
mission tone) — it does not diagnose *what business to build*. Figuring
out business type/niche is Idea Haus's job, upstream of Marketing Haus,
consistent with the Haus product funnel (Idea Haus → conceptualize the
business → Marketing Haus → brand and market it → Prompt Haus → create
the assets). The interview reads Niche/Audience from Marketing Haus's
existing shared Business/Voice DNA bar (or asks one plain, unscored
question if those are empty) purely to fill the `[audience]`/`[problem]`
placeholders in Mission Statement fragments — it does not replace those
fields or attempt to discover niche itself. The Haus tools are meant to
bridge into and inform each other, not duplicate each other's job.

## 2. Philosophy — The 13 Design Principles
✅ **Approved.** See [`brand-dna-design-principles.md`](brand-dna-design-principles.md).
Internal-only governing constitution. Includes the Black Sheep Standard
(5-question check before shipping anything new) and the closing
distinction: the 13 Principles are portable across every future Haus
product; the specific Tensions/Profile Library below are not — each
domain gets its own instrument built *under* these same principles.

## 3. The Founder Interview™ — Three Invisible Layers
✅ **Approved.** See [`brand-dna-framework.md`](brand-dna-framework.md).
Every question contributes to up to three independent scoring systems:

- **Layer One — Brand Expression™**: direct literal picks (photography,
  typography, color direction, mood, voice) for questions that map
  almost 1:1 to a real field.
- **Layer Two — Brand Tensions™**: the 8 bipolar tensions
  (Warmth↔Authority, Freedom↔Purpose, Tradition↔Innovation,
  Community↔Recognition, Structure↔Expression, Calm↔Energy,
  Accessibility↔Luxury, Playfulness↔Sophistication), each scored -3 to
  +3, feeding the Profile Library nearest-match lookup.
- **Layer Three — Founder DNA™**: 12 independent (non-bipolar)
  motivational dimensions (Purpose, Legacy, Belonging, Freedom,
  Recognition, Creativity, Security, Excellence, Impact, Stewardship,
  Growth, Service), each carrying a mission-statement fragment and
  candidate values — feeds Mission Statement, Core Values, Brand
  Promise, Brand North Star, Decision Filters, Founder Narrative.

## 4. Profile Library
✅ **Approved.** Also in [`brand-dna-framework.md`](brand-dna-framework.md).
10 named brand profiles (The Trusted Guide, The Bold Pioneer, The Cozy
Craftsman, The Elevated Icon, The Free Spirit, The Joyful Connector, The
Quiet Authority, The Modern Minimalist, The Community Builder, The Luxe
Rebel), each a qualitative position across the 8 tensions plus a full
output bundle (mood, voice, colors, fonts, starter values, mission
statement template). Functions as the expanded version of Branding
Studio's existing 4 Starter Presets.

## 5. The Founder Interview™ — 21 Questions
✅ **Approved** (wording, sequencing, per-question layer tagging).
🟡 **Pending** (numeric scoring, presentation UI). See
[`brand-dna-assessment-questions.md`](brand-dna-assessment-questions.md).
21 questions, deliberately paced (light aesthetic questions alternating
with heavier identity/motivation questions), 12-18 minute completion
target, ending on a signature closing question (Q21) that's explicitly
locked from future revision.

## 6. Field Mappings
✅ **Approved.** Every tension and every profile traces to a real,
already-shipped field in `marketing-haus-branding.js` — `mood`,
`brandVoice`, `headingFont`/`bodyFont`, `colors`, Core Values, Mission
Statement, `boardLayout`. Nothing in the Blueprint invents a new field;
it's a guided way of filling in ones that currently sit blank.

## 7. Manuscript Authoring Approach
✅ **Approved.** Manuscripts get authored from scratch as polished,
publisher-ready prose using agreed canon as source material — not
transcribed from conversation. 🟡 **Pending**: "Black Sheep Principles"
margin-quote system (concept approved, specific quotable principles not
yet written); Manuscript 02 ("The Discovery Engine") content; Manuscript
03 ("Brand Identity Haus") scope.

---

## 🟡 Pending — needs decision or work before implementation

- Numeric point values per answer, per layer (Expression pick strength,
  Tensions delta magnitude, Founder DNA delta magnitude) — currently
  qualitative tags only, see Assessment Questions doc
- Nearest-match distance formula for scoring a person's 8-number Tensions
  fingerprint against the Profile Library
- Founder DNA scoring mechanics — how the 12 dimensions' averaged scores
  pick which 2-3 mission fragments/values assemble into the final output
- Assessment presentation UI/UX (one question per screen vs. scrolling,
  progress indicator, back navigation)
- Mission Statement seed template rendering mechanics (how the
  fill-in-the-blank templates in the Profile Library actually populate)
- "Black Sheep Principles" margin-quote content
- Manuscript 02 and 03 full content

## 🔵 Future Consideration — explicitly not Version 1

- Cross-product Brand Blueprint portability (a saved Blueprint
  auto-informing Prompt Haus, Curriculum Haus, etc.) — requires
  customer-account-linked backend storage, which doesn't exist in the
  current static-theme architecture. Manual copy/export between
  products is the realistic near-term substitute.
- Separate Tension/Profile frameworks for other Haus products
  (Curriculum Haus learning-identity, a possible future Business Haus
  leadership/culture tool) — same 13 Principles would govern them, but
  each needs its own domain-specific instrument, not a reused one.
- Industry-specific expansion libraries within the Profile Library
- Hybrid rules-engine + AI creative-generation layer on top of the
  assessment's deterministic output (assessment does the psychology, AI
  does creative execution) — noted as an idea, not a decided direction
- Whether the Profile Library grows beyond 10 profiles
