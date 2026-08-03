# Haus Design System — reference spec (Content Haus first, then propagate)

**Goal:** one unified aesthetic across all six Haus tools. Build it on **Content Haus** as the
reference, propagate to the other four standard Hausen, then rebuild **Growth Haus** onto it last
(Growth Haus keeps its ROOTED engine — this is a presentation/skin standardization, not a rewrite).

Approved by Andrea 2026-08-03. Build via a **shared base** (shared CSS + color tokens) so one change
ripples to all six.

---

## 1. The hero (uniform across ALL Hausen)

- **Same background on every Haus:** the Growth-Haus hero — black-opal base + emerald/opal aurora
  shimmer. Identical everywhere (a shared brand anchor). *(Andrea's call: same hero background for
  all, NOT per-Haus-colored heroes.)*
- **Layout:** eyebrow (— SECTION · tagline) → big **title** → colored **subtitle** → **description**
  paragraph → **video placeholder** (goal: a short per-generator tutorial clip) → **button row**
  (per-Haus actions).
- Per-Haus identity comes through in the **accent bars + card accents**, not the hero.

## 2. Section header (hybrid: Content Haus marker + Growth Haus body)

- **Section marker (Content Haus style):** ✦ sparkle icon + label (e.g. "Concept • Creative
  Direction") + a thin **hairline rule** trailing to the right.
- **Then (Growth Haus style):** **title** → colored **subtitle** → **description**.

## 3. Accent bars (the differentiation system)

- **Primary cards → thick bar across the TOP, in that Haus's signature color.** (Growth-Haus bar
  weight — a little thicker.)
- **Callout / aside cards → thick bar down the LEFT, in GOLD.** Same gold on every Haus, so callouts
  always read the same. Gold is reserved for this — no Haus wears gold as its signature.

## 4. "White box + eyebrow" encasing (Content Haus specifics)

Wrap these in their own white card with an eyebrow label:
- **Add a companion** → eyebrow **"Companion"**
- **Turn this into a video prompt** → eyebrow **"Make it a Video"**
- **Human / Animal Mascot** toggle → eyebrow **"Type"**
- **Starter Presets** → white box (already has its eyebrow text)

## 5. Primary vs. Secondary (Content Haus)

**Primary (burnt-orange top bar):** Project Setup *(the top black box — "Project Setup" becomes the
✦ eyebrow)* · Select the Prompt Generator · Concept • Creative Direction · Character Style · Filter &
Finish · Human Identity · Appearance · Styling · Presentation · Add a Companion · Extras · Turn this
into a Video Prompt · Imagery & Scene Elements.

**Secondary (gold left bar):** Your Prompt, Built Live · Your Vault · Recently Generated · My Haus
Style – Brand Kit · FAQs · (Type toggle + Starter Presets are white-boxed) · …future directional
widgets.

Rule of thumb: **main build sections = primary/top bar; supporting/aside/notes = secondary/gold left.**

## 6. The six Haus signatures (approved palette)

| Haus | Tone | Hex (draft — final-tuned + aurora sheen at build) |
|---|---|---|
| **Content** | Burnt Sunflower (burnt orange, locked) | `#E06A2B` |
| **Growth** | Emerald · Opal | `#14A880` |
| **Marketing** | Fuchsia | `#C51E98` |
| **Graphics** | Amethyst | `#7C3AED` |
| **Project** | Sapphire | `#2560E6` |
| **Brand** | Ruby · Garnet *(moved OFF gold)* | `#C31D48` |

- Each tone is used for that Haus's **top accent bar** (+ per-Haus card accents), NOT the hero.
- **Gold** (`#E4AE3C` family) = the universal callout / left-bar accent everywhere.
- Content's burnt orange is pitched **deep/red enough** to stay distinct from the gold bars.
- Draft palette mockup: `scratchpad/haus-palette-draft.html`.

## 7. Widgets / fields (keep as-is)

- Content Haus's **compact** pattern — dropdown → "or type your own", collapsed-to-one-line,
  expandable — is the target everywhere. Wearing the Growth-Haus **card shape/look** (rounded cards,
  cream surfaces).

---

## Build order

1. **Shared base** — a shared stylesheet + color tokens (`--haus-accent`, `--haus-gold`, section-
   header, top-bar/left-bar card classes, hero shell). One place → ripples to all six.
2. **Content Haus** = the reference build: add the hero, apply section headers + accent bars +
   white-box eyebrows per §4–5, wire its signature (burnt orange).
3. **Propagate** to Brand / Graphics / Project / Marketing (swap the token, apply the classes).
4. **Growth Haus** last — rebuild its right column on the widget system + adopt the shared base,
   keeping the ROOTED engine.

## Notes / open at build time
- Each standard Haus is JS-rendered (`*-ui.js` renderApp) with its own `*.css`; the shared base sits
  above those. Section headers/accent bars are applied in each renderApp + shared CSS.
- Growth Haus is Liquid-static (ported standalone) — it consumes the shared base directly.
- Video placeholder: reuse Growth Haus's pattern (`assets/how-to.mp4` per tool, "coming soon" until
  a clip is dropped).
