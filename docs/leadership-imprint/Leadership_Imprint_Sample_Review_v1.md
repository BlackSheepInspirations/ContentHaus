# THE LEADERSHIP IMPRINT
## Sample report review · fix list
### Reviewed: Tractor, Bus, Jet, Rocket · 33 pages each

**All four samples reviewed.** Every issue below appears identically in all four unless noted.
None are style-specific.

**Overall: a strong first build.** Copy landed intact, palette is correct, visuals are constructed
rather than generated, blend bars work exactly as intended. The list below is finishing, not rework.

---
---

# FIX BEFORE SHIP

---

## 1 · Page 2 is blank

**All four samples.** Header band only, no content. 66 characters, all of it the footer mark.

**Fix:** delete the page.

---

## 2 · Low-confidence warning is firing, and it is orphaned

**All four samples, page 8.**

```
"The result below may not be an accurate picture. It is worth taking
this again when you have twenty quiet minutes."
```

**Two problems.**

**It should not be firing.** These are clean sample profiles. Check the trigger conditions in
specification §4.5 — something is evaluating true when it should not.

**And it is broken across a page break.** The opening of the warning is missing. The reader sees a
fragment with no context, on its own page.

**Fix:** correct the trigger. Then wrap the whole warning block so it cannot split across pages.

---

## 3 · Grid axis labels are reversed in the text layer

**All four samples, pages 10, 20 and 25.**

Text extraction returns `ELPOEP` and `K S AT` — PEOPLE and TASK with the character order flipped.

⚠️ **This may look correct on screen and still be wrong in the file.** The rotated text is being
constructed character by character in reverse rather than rotated as a single string.

**Why it matters:** breaks text search, breaks copy and paste, breaks screen readers, and will
break the accessibility requirement in visual spec §8.3.

**Fix:** render each rotated label as one text element with a transform, not as reversed
characters.

```svg
<text transform="translate(x,y) rotate(-90)">PEOPLE</text>
```

---

## 4 · Only two of four quadrants are tinted

**All four samples. Verified by pixel sampling.**

| Quadrant | Rendered |
|---|---|
| Bus, top-left | `#FFFFFF` — **no tint** |
| Jet, top-right | `#FFFFFF` — **no tint** |
| Tractor, bottom-left | `#EFF0E8` — tinted |
| Rocket, bottom-right | `#F0E5EB` — tinted |

⚠️ **This is not "your own style is highlighted."** The Bus sample has no tint on the Bus quadrant.
The pattern is positional, not personal. **The top two quadrants are receiving no fill in any
report.**

**Likely cause:** the rect for the top quadrants is being drawn with a negative or zero height,
because the y-axis inverts between data space and SVG space.

**Fix:** all four quadrants at **6% opacity** of their style colour, per visual spec §2.3.

---

## 5 · The reader's own profile is printed twice, in full

**All four samples.** Pages 11–13 and pages 22–24 are identical, word for word.

⚠️ **This is my specification's fault, not a build error.** The report template asked for all four
styles in Part III and the reader's own again in Part IV.

**Fix — spec change:**

**Part III, pages 6–9:** keep all four styles in full. Correct as built. Keep the `THIS IS YOURS`
marker.

**Part IV, "Your Imprint":** **position, blend and percentages only.** Remove the repeated profile.
Add a single line:

> Your full Tractor profile is on page 11.

**Saves 3 pages.** 33 → 30.

---

## 6 · Range bar labels are colliding

**All four samples, page 27.** Renders as `AnchoredSteady Adaptive` with the first two labels run
together.

**Cause:** the Anchored and Steady bands are 78px wide each and the labels are wider than that.

**Fix, two options:**

**Preferred** — abbreviate nothing, but set the labels at 10px and add 4px letter-spacing tolerance,
then verify no overlap at the narrowest band.

**Alternative** — stagger the labels on two rows, alternating.

⚠️ **Do not shrink the bands to fit the labels.** The band widths are proportional to their point
ranges and that proportionality is meaningful.

---
---

# WORTH A LOOK

---

## 7 · Quadrant thumbnails are captioned twice

**All four samples, page 10.**

Each style name appears twice — once as the quadrant corner label, once as a caption under the
thumbnail image.

**Fix:** drop the caption. The quadrant label is sufficient.

---

## 8 · Cover tagline is not from the specification

**All four samples.**

> Leadership is more than style. It's the imprint you leave.

Good line, and it did not come from any of the six build documents.

**Action:** confirm it is intentional and that it is the tagline. If it is, add it to the report
template so it does not drift between builds.

---

## 9 · Style taglines are not appearing

Report template specifies a tagline under the style name on the cover:

| Style | Tagline |
|---|---|
| Tractor | Straight rows, every time |
| Bus | Everybody on board |
| Jet | Around the weather |
| Rocket | Straight up, no stops |

The Tractor cover shows *"Steady. Thorough. Built to..."* instead.

**Action:** decide which set is correct and apply consistently. **The three-adjective version is not
in the spec** but may be a deliberate improvement.

---

## 10 · Page count is high

**33 pages, against a specified 22.**

Fix 5 removes 3. Fix 1 removes 1. That lands at 29.

⚠️ **The Tier One promise is that pages 1–2 work alone.** Verify that still holds — a reader with
fifteen minutes should be able to stop after the summary and have a usable result.

**Not necessarily a problem.** The Brand Playbook runs 21 guides and readers value the weight. Worth
a deliberate decision rather than an accident.

---
---

# CONFIRMED WORKING

**Do not change these.**

| Element | Status |
|---|---|
| **Cover** | Composite hero used correctly. Strong |
| **Blend bars** | ✓ All four render. 12% Jet bar still visible. Percentages correct |
| **Palette** | ✓ Amber, green, navy, red. Correct throughout |
| **No numeric scale on grid axes** | ✓ Per spec |
| **Fleet chart order** | ✓ Fixed, not sorted |
| **Marker convention** | ✓ Filled for everyday |
| **Range band caption** | ✓ *"No band is better than another"* present |
| **Blend copy** | ✓ *"You are mostly Tractor at 58%, with 15% Bus, 15% Rocket"* |
| **Limits and validity page** | ✓ Present and unedited |
| **Pressure copy** | ✓ Not softened |
| **`THIS IS YOURS` marker** | ✓ Working |

---
---

# SUMMARY

| # | Issue | Severity | Where |
|---|---|---|---|
| 1 | Blank page 2 | **Ship-blocker** | All |
| 2 | Low-confidence warning firing and orphaned | **Ship-blocker** | p8 |
| 3 | Axis labels reversed in text layer | **Ship-blocker** | p10, 20, 25 |
| 4 | Two quadrants untinted | **Ship-blocker** | All grids |
| 5 | Profile duplicated | **Ship-blocker** | p11–13 / 22–24 |
| 6 | Range labels colliding | **Ship-blocker** | p27 |
| 7 | Thumbnails double-captioned | Worth a look | p10 |
| 8 | Cover tagline unspecified | Decision | Cover |
| 9 | Style taglines differ from spec | Decision | Cover |
| 10 | 33 pages vs 22 specified | Decision | — |

**Six fixes, four decisions.** None are structural. The build is sound.
