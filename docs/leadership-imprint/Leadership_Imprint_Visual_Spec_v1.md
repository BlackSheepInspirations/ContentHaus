# THE LEADERSHIP IMPRINT
## Visual construction specification · v1.0
### Black Sheep Leadership Group

**Fourth build document.** Construction rules for every visual element in the report.

⚠️ **Everything in this document is constructed, not generated.** Every element carries a number, a
label or an exact position. Image generation cannot set type or render precise values. **Build these
as SVG.**

The only generated art in the entire product is the six hero images, and those are already made.

---

## CONTENTS

| § | Element | Appears |
|---|---|---|
| 1 | Design tokens | Everywhere |
| 2 | **The Grid** | Pages 1, 10, 13 |
| 3 | Continuum bars | Pages 4–5 |
| 4 | Blend bars | Pages 1, 11 |
| 5 | Range bar | Pages 2, 15 |
| 6 | Fleet chart | Page 19 |
| 7 | Hero image placement | Cover, 6–9 |
| 8 | Build notes | — |

---
---

# 1 · DESIGN TOKENS

⚠️ **Every element in this document uses these values. Nothing is defined locally.**

## 1.1 Style colours

Each style has one colour, drawn from its hero image. Used consistently everywhere a style appears.

| Style | Primary | Light | Dark |
|---|---|---|---|
| **TRACTOR** | `#C87F0A` | `#F2DCA8` | `#8A5605` |
| **BUS** | `#2E8B45` | `#B4DCBE` | `#1B5E2C` |
| **JET** | `#1B3F8B` | `#AFC0E4` | `#0F2557` |
| **ROCKET** | `#C41E1E` | `#F0B4B4` | `#8A1212` |

**Rationale.** Burnt amber for earth and the field. Forest green for growth and people. Deep navy
for altitude. True red for heat and speed. Four genuinely distinct hues rather than four shades of
the same warmth.

⚠️ **Greyscale check.** These convert to roughly 52%, 45%, 25% and 33% lightness. That separation is
deliberate so the report survives black and white printing. **Re-check the fleet chart in greyscale
before release** — it is the element most dependent on colour.

⚠️ **Watch Jet at small sizes.** Deep navy sits close to `ink` and may read as dark grey in quadrant
labels or thin blend bars. If that shows up at real size, lift Jet one shade brighter and leave the
other three alone.

## 1.2 Interface colours

| Token | Hex | Use |
|---|---|---|
| `ink` | `#1A1F26` | Body text |
| `ink-soft` | `#4A5560` | Secondary text, axis labels |
| `ink-faint` | `#8A939C` | Gridlines, disabled states |
| `paper` | `#FBFAF7` | Page background |
| `paper-warm` | `#F4F1EA` | Panel fills |
| `rule` | `#D8D3C8` | Dividers, borders |
| `gold` | `#B8860B` | Accent, house mark |

## 1.3 Type

| Role | Weight | Size | Case | Tracking |
|---|---|---|---|---|
| Element title | Bold | 16px | Title | 0 |
| Axis label | Semibold | 11px | UPPERCASE | +0.08em |
| Pole label | Regular | 11px | Title | 0 |
| Data label | Semibold | 13px | Title | 0 |
| Value | Bold | 15px | — | 0 |
| Caption | Regular | 10px | Title | 0 |

⚠️ **Serif for report body, sans for all data elements.** Numbers and labels inside charts read
better sans, and the contrast between the two makes the visuals feel deliberate rather than
accidental.

## 1.4 Geometry

| Token | Value |
|---|---|
| Corner radius | 2px |
| Stroke, structural | 1.5px |
| Stroke, hairline | 0.75px |
| Grid unit | 8px |

---
---

# 2 · THE GRID

**The signature element.** Appears three times, in three states.

## 2.1 Dimensions

```
Canvas         640 × 640 px
Plot area      480 × 480 px
Margin         80 px all sides
Origin         bottom-left of plot area
```

## 2.2 Axes

**X axis — PACE.** Left `MEASURED` (0), right `FAST` (100)
**Y axis — PRIORITY.** Bottom `TASK` (0), top `PEOPLE` (100)

```
Axis line     1.5px  ink-soft
Midlines      0.75px ink-faint, at x=50 and y=50, dashed 4 2
Ticks         at 0, 25, 50, 75, 100. 6px, ink-faint
Labels        UPPERCASE, 11px, +0.08em, ink-soft
              X labels below axis, 16px clear
              Y labels rotated -90°, left of axis, 16px clear
```

⚠️ **No numeric scale on the axes.** Poles are named, values are not shown on the grid itself.
Numbers appear in the accompanying text. **A visible 0-to-100 scale makes it look like a score.**

## 2.3 Quadrants

Each quadrant filled at **6% opacity** of its style colour. Barely there — enough to orient, not
enough to compete with the plotted points.

```
Top-left      (0-50, 50-100)   BUS      #C4622D @ 6%
Top-right     (50-100, 50-100) JET      #2E6B8A @ 6%
Bottom-left   (0-50, 0-50)     TRACTOR  #C8922A @ 6%
Bottom-right  (50-100, 0-50)   ROCKET   #7A3E8C @ 6%
```

**Quadrant labels** at each corner, 20px inset from the plot edge:

```
Style name    Semibold, 13px, style dark colour
```

Position: **outer corner of each quadrant**, so labels never collide with a plotted point near the
centre.

## 2.4 Plotted points

**NATURAL POSITION — filled**

```
Outer ring    r=11, fill paper, stroke 2px style primary
Inner dot     r=6,  fill style primary
```

**PRESSURE POSITION — open**

```
Ring          r=11, fill none, stroke 2px style primary, dashed 3 2
Centre dot    r=2.5, fill style primary
```

⚠️ **Filled means natural, open means pressure. Never reversed.** This is the single most important
visual convention in the report and it must be identical in all three uses.

## 2.5 The range line

**The line between the two points is the range.** It is the most informative mark on the page.

```
Path          straight line, natural centre to pressure centre
Stroke        2px, ink-soft, dashed 5 3
Arrowhead     at pressure end, 8px, ink-soft
Layer         below both points
```

**[CONDITIONAL — range < 8 points]**
Points overlap. Do not draw the line. Instead:

```
Single marker at natural position
Outer ring r=15, stroke 2px style primary, solid
Inner ring r=11, stroke 1.5px style primary, dashed 3 2
Inner dot  r=6, fill style primary
Caption below plot: "Your pressure position sits almost exactly on your natural one."
```

## 2.6 Legend

Below the plot, horizontal, centred:

```
[filled marker]  Everyday        [open marker]  Under pressure
```

11px, ink-soft, 24px gap between the two.

## 2.7 The three states

| Use | Shows | Notes |
|---|---|---|
| **Page 1** | Both points, range line, legend | Full version |
| **Page 10** | Natural point only, no line, no legend | Pressure not yet introduced. **Do not show it early** |
| **Page 13** | Both points, range line, arrowhead emphasised, legend | Direction is the subject here |

## 2.8 Framework version — page 5

Empty grid, no plotted points. Each quadrant carries its hero image as a **clipped thumbnail**:

```
Thumbnail     140 × 140 px, centred in quadrant
Clip          rounded rect, 2px radius
Opacity       100%
Label         style name below thumbnail, semibold 13px, style dark
Quadrant fill none in this version
```

---
---

# 3 · CONTINUUM BARS

Two bars, one per axis. Framework section only.

## 3.1 Dimensions

```
Canvas        560 × 90 px
Track         520 × 14 px, centred, corner radius 7
```

## 3.2 Construction

```
Track fill    linear gradient, left to right
              PACE:     #4A5560 → #C8922A
              PRIORITY: #4A5560 → #2E6B8A
Track stroke  0.75px rule
```

⚠️ **The gradient must not imply direction of quality.** Both ends are the same lightness value.
Test in greyscale: if one end looks brighter, adjust until they match.

**Pole labels**, 12px below the track:

```
Left pole     Regular 11px ink-soft, left-aligned to track start
Right pole    Regular 11px ink-soft, right-aligned to track end
```

**Axis name**, 14px above the track, centred:

```
Semibold 11px, UPPERCASE, +0.08em, ink-soft
```

⚠️ **No marker on the framework bars.** These teach the axis. They do not show the reader's
position — that is the grid's job.

## 3.3 Copy

| Axis | Left pole | Right pole |
|---|---|---|
| PACE | Measured | Fast |
| PRIORITY | Task | People |

---
---

# 4 · BLEND BARS

Four horizontal bars showing the percentage blend.

## 4.1 Dimensions

```
Canvas        480 × 200 px
Bar height    24 px
Bar gap       16 px
Label column  110 px (left)
Track         300 px (centre)
Value column  50 px (right)
```

## 4.2 Construction

**Order: always descending by percentage.** Primary at top.

```
Track background   full 300px, fill paper-warm, radius 2
Fill               (pct / 100) × 300 px, fill style primary, radius 2
Label              Semibold 13px, style dark, right-aligned in label column
Value              Bold 15px, ink, left-aligned in value column, "68%"
```

**[CONDITIONAL — primary bar]**
```
Fill opacity 100%
Label weight bold
```

**[CONDITIONAL — bars below 10%]**
```
Fill opacity 45%
Label colour ink-faint
```

⚠️ **All four bars always appear, even at 3%.** Showing the full blend is the point. A reader who
sees only their top two thinks the model has two styles.

## 4.3 Minimum fill

Any percentage above 0 renders **at least 4px of fill**, so a 1% bar is visible as a sliver rather
than nothing at all.

---
---

# 5 · RANGE BAR

Four bands, marker at the reader's position.

## 5.1 Dimensions

```
Canvas        560 × 110 px
Track         520 × 20 px, radius 3
Band widths   proportional to their point ranges
```

## 5.2 Bands

| Band | Points | Width of 520px | Fill |
|---|---|---|---|
| Anchored | 0–15 | 78 px | `#E8E4DA` |
| Steady | 16–30 | 78 px | `#DAD5C8` |
| Adaptive | 31–50 | 104 px | `#C8C2B2` |
| Wide | 51–141 | 260 px | `#B6AF9C` |

⚠️ **The bands are neutral greys, not style colours and not a red-to-green ramp.** A colour ramp
would imply one end is better. That would break the central design rule of the entire instrument.

**Band dividers:** 0.75px `paper`, full height of track.

**Band labels**, below track:
```
Regular 11px, ink-soft, centred under each band
```

## 5.3 Marker

```
Position      proportional within the band, based on actual distance
Marker        vertical line, 2px ink, extending 6px above and below track
Cap           filled circle r=4 at top, fill ink
Value         Bold 13px, above the cap, centred, "34"
```

## 5.4 Caption

Below the labels, centred, 10px ink-faint:

> No band is better than another. Each one costs something.

⚠️ **This caption is fixed and must not be removed.**

---
---

# 6 · FLEET CHART

## 6.1 Dimensions

```
Canvas        560 × 280 px
Bar height    36 px
Bar gap       20 px
Label column  110 px
Track         340 px
Count column  60 px
```

## 6.2 Construction

**Order: fixed, always Tractor, Bus, Jet, Rocket.** Not sorted by count.

⚠️ **Fixed order matters here.** The reader is looking for a *shape*, and a shape is only readable
if the axis stays put. Sorting by size destroys the comparison.

```
Track background  full 340px, fill paper-warm, radius 2
Fill              (count / total) × 340 px, style primary, radius 2
Label             Semibold 13px, style dark
Count             Bold 15px ink, "7"
Percentage        Regular 11px ink-soft, below count, "28%"
```

## 6.3 State overlays

**[DOMINANT — style ≥ 50%]**
```
Fill stroke      2px style dark
Flag             small triangle, 10px, style dark, right of the bar
Label suffix     " — dominant" in regular 11px style dark
```

**[MISSING — count = 0]**
```
Track            dashed outline 1px style primary @ 40%, no fill
Label colour     ink-faint
Label suffix     " — none" in regular 11px ink-faint
```

**[THIN — 1 to 15%]**
```
Fill opacity     60%
Label suffix     " — thin" in regular 11px ink-soft
```

## 6.4 Balance indicator

A single horizontal strip **above** the four bars, 12px tall, full 340px width:

```
Four segments, widths proportional to counts, style primary colours, no gaps
```

⚠️ **This one strip is the whole fleet argument in a single image.** A dominant fleet is one big
block. A balanced fleet is four even segments. It reads instantly, before anybody looks at numbers.

Caption above, 11px ink-soft: `Your fleet at a glance`

## 6.5 Estimate flag

**[CONDITIONAL — Path A, self-estimated]**

Small banner above the whole chart:

```
Height        24px
Fill          paper-warm
Border-left   3px gold
Text          Regular 11px ink-soft, 12px inset
              "Based on your estimate of your team, not on their own results."
```

---
---

# 7 · HERO IMAGE PLACEMENT

Six generated images. **These are the only generated assets in the product.**

| Image | Placement | Treatment |
|---|---|---|
| **Atmospheric** *(golden line to space)* | Cover, full bleed | Full width, 60% page height. Gradient scrim bottom third for title legibility |
| **Composite** *(four vehicles, landscape)* | Page 5, framework | Full column width, 16:9, 2px radius |
| **Tractor** | Page 6 + cover if primary | Quarter page on style pages |
| **Bus** | Page 7 + cover if primary | Same |
| **Jet** | Page 8 + cover if primary | Same |
| **Rocket** | Page 9 + cover if primary | Same |

## 7.1 Cover treatment

```
Image           full bleed, top 60% of page
Scrim           linear gradient, transparent → paper, over bottom 25% of image
Title           positioned in the scrim zone, 48px bold, ink
Name and date   24px regular, ink-soft, below title
Style + tagline 18px semibold, style primary, below name
```

## 7.2 Style page treatment

```
Image     240 × 135 px, 16:9, radius 2, top-right of the page
Caption   none
```

⚠️ **No text over any hero image except on the cover**, where the scrim makes it legible. Text
over an unscrimmed painterly image is unreadable at the exact moment it matters.

---
---

# 8 · BUILD NOTES

## 8.1 Format

**All elements as inline SVG**, not raster.

- Scales cleanly to print without a second asset set
- Text stays selectable and accessible
- Values are data-bound rather than baked in
- **Never generate these as images**

## 8.2 Print

The report will be printed. Every element must survive:

| Check | Requirement |
|---|---|
| **Greyscale** | All four style colours distinguishable when converted |
| **No colour-only meaning** | Every distinction also carried by position, label or pattern |
| **Minimum text size** | 10px, nothing smaller |
| **Fill contrast** | Data fills at least 3:1 against `paper-warm` |

⚠️ **Test the fleet chart in greyscale first.** It is the element most dependent on colour and the
one most likely to be printed.

## 8.3 Accessibility

| Element | Requirement |
|---|---|
| Grid | `role="img"` with an `aria-label` describing both positions in words |
| All charts | Text alternative stating the values |
| Colour | Never the only carrier of meaning |
| Contrast | Body text 7:1, labels 4.5:1 minimum |

**Example grid alt text:**
> "A grid showing leadership style. Your everyday position sits in the Tractor quadrant, measured
> pace and task priority. Under pressure you move toward Rocket, a distance of 34 points."

## 8.4 Responsive

| Breakpoint | Behaviour |
|---|---|
| ≥ 720px | Full specification as written |
| < 720px | Grid to 320 × 320. Blend and fleet bars to 100% width. Range bar labels stack two lines |
| Print | Fixed at specified dimensions, do not scale |

## 8.5 What must never happen

- ⚠️ **Never generate a chart as an image.** Values must be exact
- ⚠️ **Never reverse the filled/open convention.** Filled is everyday, open is pressure
- ⚠️ **Never sort the fleet chart by size.** Fixed order or the shape is unreadable
- ⚠️ **Never colour the range bar as a ramp.** It implies one end is better
- ⚠️ **Never put a numeric scale on the grid axes.** It makes a position look like a score
- ⚠️ **Never omit a blend bar** because the percentage is small
