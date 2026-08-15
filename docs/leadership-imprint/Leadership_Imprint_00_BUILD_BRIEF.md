# THE LEADERSHIP IMPRINT
## Master build brief · v1.0
### Black Sheep Leadership Group

**Read this first.** It tells you what is being built, which document governs which part, and the
decisions that are already made.

---

## WHAT THIS IS

A leadership assessment. Forty questions, roughly fifteen minutes, producing a report that tells
somebody how they lead, what happens to that under pressure, how far they move, how to lead the
three styles they are not, and what their team is missing.

**The last one is the product.** Every comparable instrument tells you about yourself and stops.

---

## THE DOCUMENT SET

| # | Document | Governs |
|---|---|---|
| **0** | **This brief** | Scope, decisions, order of work |
| **1** | `Leadership_Imprint_Full_Specification_v1.md` | The model, all 40 questions, scoring maths, the four written profiles, Fleet logic |
| **2** | `Leadership_Imprint_Report_Template_v1.md` | Report structure, every variable, every conditional, all fixed copy |
| **3** | `Leadership_Imprint_Instructions_v1.md` | Everything a user sees before question one, block transitions, completion screens, invitations |
| **4** | `Leadership_Imprint_Visual_Spec_v1.md` | Construction rules for all six chart elements, design tokens, print and accessibility |
| **5** | `Leadership_Imprint_Edge_Cases_v1.md` | Everything that happens when the normal path does not. **What to store** |

**Reference implementation:** four sample SVGs demonstrating the visual spec. Reimplement in the
target stack rather than porting the Python.

**Assets already made:** six hero images. Four style heroes, one four-vehicle composite, one
atmospheric cover image. These are the **only** generated art in the product.

---

## THE TEN RULES

⚠️ **These are binding. Breaking any one of them breaks the instrument.**

**1 · No style is better than another.** Every gift is paired with its cost. Every range band names
a downside. If any copy or colour implies a preferred quadrant, it is wrong.

**2 · Store raw responses, not just scores.** Every validation step in specification Part Nine is
impossible without them, and it cannot be retrofitted. **This is the single most important
non-obvious requirement in the build.**

**3 · Only the six hero images are generated.** Everything carrying a number, a label or an exact
position is constructed SVG. Generated images cannot set type or render precise values.

**4 · Filled marker means everyday. Open marker means under pressure.** Never reversed, in any of
the three grid uses.

**5 · The fleet chart never sorts by size.** Fixed order: Tractor, Bus, Jet, Rocket. The reader is
looking for a shape and a shape needs a stable axis.

**6 · No numeric scale on the grid axes.** Poles are named, values are not drawn. A visible 0-to-100
scale makes a position look like a score.

**7 · The pressure copy is not softened.** It has to sting slightly. A report nobody flinches at is
a horoscope.

**8 · No em dashes anywhere in user-facing text.** Grade 7 to 8, second person, contractions fine.

**9 · Never call it a test.** Not in copy, not in UI, not in emails. Test invites passing.

**10 · Block E results are withheld** from the standard individual report. Released at a facilitated
session or as a separate unlock.

---

## DECISIONS ALREADY MADE

**Do not re-open these.**

| Decision | Settled as |
|---|---|
| Question count | 40 |
| Blocks | A pace 10 · B priority 10 · C pressure 12 · D validity 5 · E conflict 3 |
| Style names | Tractor, Bus, Jet, Rocket |
| Range | Measured as distance between natural and pressure positions, not asked separately |
| Output | Blend percentages with supporting influences, never a bare quadrant |
| Fleet | Both paths built. **Path A self-estimated is what the Unifi pilot uses** |
| Reading level | Grade 7 to 8 |
| Palette | Amber, forest green, deep navy, red. Locked in document 4 |
| Validation claim | "Behaviourally grounded, validation in progress." Nothing stronger |

---

## STILL OPEN

**These need answers from Andrea before or during build.**

| Question | Why it matters |
|---|---|
| ~~Platform and stack~~ | **SETTLED.** Shopify for purchase and account. **Cloudflare holds all response data.** Bunny.net for media |
| **Auth** | Account required? How does somebody return to their report? |
| **Report delivery** | Web page, generated PDF, or both? Affects how the SVGs are rendered |
| **Retakes** | Allowed? Does a new result replace or sit alongside the old one? |
| **Block E release** | Code, admin toggle, or separate link? |
| **Team grouping** | How does a cohort get created and joined? |
| **Brand** | Typefaces and logo placement. Palette is settled, the rest is not |

⚠️ **Build the team-grouping logic even though the Unifi pilot uses Path A.** Twenty-five leaders in
one cohort means real data exists for a cohort fleet view, which is the most useful thing that could
appear on Day 2 of the workshop.

---

## SUGGESTED ORDER OF WORK

| Phase | What | Depends on |
|---|---|---|
| **1** | Data model and raw response storage | Rule 2 |
| **2** | Assessment flow, 40 items, instruction screens | Docs 1 and 3 |
| **3** | Scoring engine including confidence flags | Doc 1 Part Four |
| **4** | Visual components as reusable SVG | Doc 4 |
| **5** | Report generator, two tiers, all conditionals | Docs 2 and 4 |
| **6** | Fleet input, both paths | Doc 1 §4.6 |
| **7** | Team grouping and cohort view | — |

**Phase 1 first, always.** Everything else can be rebuilt. Lost response data cannot.

---

## EDGE CASES TO HANDLE

⚠️ **All edge cases are specified in document 5.** Read it before phase 2.

**The three that matter most:**

| Case | Behaviour |
|---|---|
| **Write failure** | ⚠️ **Never show a report if the raw responses did not save.** A report without stored data is a permanent validation gap |
| **No save, no resume** | If somebody leaves, they start fresh. Partial responses still stored |
| **Randomised option order** | Required. Otherwise straight-lining is undetectable in forced-choice blocks |

---

## OUT OF SCOPE FOR V1

Frontline version · 360 or rater version · industry variants · facilitator kit · certification
platform · the Unifi four-day workshop materials.

---

## WHAT GOOD LOOKS LIKE

Somebody takes this in fifteen quiet minutes, reads two pages, and says *"that is uncomfortably
accurate."*

Then they turn to the Fleet section and realise their team has no Rocket in it, and that this
explains something they have been failing to name for two years.

**That second moment is the product.** Build toward it.
