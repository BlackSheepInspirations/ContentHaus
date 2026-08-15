# THE LEADERSHIP IMPRINT
## Edge cases and data handling · v1.0
### Black Sheep Leadership Group

**Fifth build document.** Everything that happens when the normal path does not.

⚠️ **Every case in here will occur.** Without a specified behaviour, the code either fails or does
something arbitrary, and you find out on launch day in front of a customer.

---

## PLATFORM CONTEXT

| Layer | Holds |
|---|---|
| **Shopify** | Purchase, account, entitlement |
| **Cloudflare** | **All response data.** Raw responses, timings, scores, cohort membership |
| **Bunny.net** | Media delivery |

⚠️ **Cloudflare is the source of truth for anything that will be needed for validation.** Shopify
handles the transaction and nothing else.

---
---

# 1 · SESSION AND COMPLETION

## 1.1 No save, no resume

**There is no partial save and no resume.** If somebody leaves mid-assessment, they start fresh.

**What this requires:**

- ⚠️ **Stated on the pre-assessment screen**, not discovered at question 30
- Partial responses **still written to storage** even though no report is produced
- No "welcome back" flow. It cannot happen

**Copy to add to instruction Screen 1:**

> **Do this in one sitting.** There is no way to save halfway through, so if you close the tab you
> will start again from the beginning. Fifteen minutes, uninterrupted.

**Why this is acceptable rather than a limitation:** answers drift across sessions. A single sitting
produces more consistent data, and the constraint reinforces the quiet-fifteen-minutes framing.

## 1.2 Abandonment

| Condition | Behaviour |
|---|---|
| Session inactive 30 minutes | Mark abandoned. Write partial responses. No report |
| User closes and returns | New session, question 1. No reference to the previous attempt |
| Partial responses | **Stored and retained.** Not reported |

**Why store partials:** abandonment position is diagnostic. If people consistently stop at question
23, question 23 is a problem, and that is only knowable if the record exists.

---
---

# 2 · RESPONSE QUALITY

## 2.1 Randomised option order

⚠️ **Required, not optional.**

In every forced-choice item, **randomise which side each option appears on.** If option A is always
the "fast" answer, somebody clicking A forty times produces a clean Rocket result rather than a
flag.

```
Store: which option was presented in which position, per item
```

**Without this, straight-lining is undetectable in the forced-choice blocks.**

## 2.2 Timing

**Record and store:**

| Field | Use |
|---|---|
| Total duration | Speed flag input |
| Per-question duration | Item analysis. Which questions people stall on |
| Session start and end timestamps | Abandonment analysis |

⚠️ **Speed alone is never a flag.** Some people answer quickly and honestly.

**Flag only on combination:**

```
IF total_duration < 4 minutes
AND Block D internal consistency is poor
THEN low confidence
```

**Do not display a timer to the user.** A countdown encourages speed, and speed is the thing being
guarded against.

## 2.3 Straight-lining

| Pattern | Behaviour |
|---|---|
| All Block A on one side AND all Block B on one side | **Low confidence.** No style reported |
| Block D identical value across all five | **Low confidence** |
| Block C same option letter ≥ 10 of 12 | **Low confidence** |
| D4 ≤ 2 *(self-reported dishonesty)* | **Low confidence** |

**Low-confidence behaviour:**

- Do **not** report a style
- Show the retake invitation
- **Still store the responses.** They are valid data about response behaviour even if not about the
  person

⚠️ **Never report a style you do not believe.** A wrong profile does more damage than no profile,
because the person acts on it.

---
---

# 3 · SCORING EDGE CASES

## 3.1 Centred position

**Condition:** both PACE and PRIORITY fall between 45 and 55.

⚠️ **This is not an error and must not be treated as one.**

**Behaviour:**
- Report as **balanced**
- Use the centred-position copy from report template page 10
- Show all four blend percentages, which will be near-even
- Recommend a facilitated debrief

**Copy:** *"You sit near the centre on both. That is a real result, not a failure of the
instrument."*

## 3.2 Pressure equals natural

**Condition:** pressure style falls in the same quadrant as natural style.

**Behaviour:** use the **intensification** copy path, not the movement path.

⚠️ **Without this, the report says "under pressure you move toward Tractor" to a Tractor**, which
reads as broken.

Copy path is specified in report template pages 13–14.

## 3.3 Range under 8 points

**Condition:** distance between natural and pressure positions is under 8.

**Behaviour:** the two markers overlap on the grid and the connecting line is invisible.

- Draw the **combined marker** from visual spec §2.5
- Do not draw the range line
- Add the caption: *"Your pressure position sits almost exactly on your natural one."*

## 3.4 Incomplete Block C

**Condition:** fewer than 12 pressure scenarios answered.

⚠️ **Pressure position and range require all 12.**

**Behaviour:**
- Do **not** compute a pressure style
- Do **not** compute a range
- Report natural position only
- Grid shows the natural marker alone, no line, no legend
- Note: *"Your pressure position could not be calculated from the answers given."*

**This should be rare** given no partial save, but it can occur through a client error mid-block.

---
---

# 4 · FLEET EDGE CASES

## 4.1 Estimate totals zero

**Condition:** Path A, all four counts entered as 0.

**Behaviour:** **skip the Fleet section entirely.** Do not divide by zero, do not show an empty
chart.

## 4.2 Team of one

**Condition:** total fleet count is 1.

**Behaviour:** **suppress the Fleet section.**

A fleet of one is not a finding. Reporting "100% Tractor, dominant" from a single person is
meaningless and looks broken.

## 4.3 Team of two or three

**Condition:** total fleet count is 2 or 3.

**Behaviour:** show the Fleet section **with a caution banner:**

> With a team this size, one person changes the picture considerably. Treat this as a starting
> point for a conversation rather than a diagnosis.

⚠️ **Percentages get unstable below about five people.** One person in a team of three is 33%.

## 4.4 Blend percentage under 10

**Condition:** any style scores below 10% in the blend.

**Behaviour:** **bar still renders**, at 45% opacity, minimum 4px fill.

⚠️ **Never omit a bar.** Showing all four is the point. A reader who sees only two thinks the model
has two styles.

---
---

# 5 · DATA INTEGRITY

## 5.1 Write failure

⚠️ **This is the most important rule in this document.**

**Never show a report if the raw responses did not save.**

```
1. Attempt write to Cloudflare
2. On failure, retry (3 attempts, exponential backoff)
3. On final failure, show an error. Do not generate a report
```

**Why:** a report without stored responses is a permanent validation gap. The person has taken the
assessment, you have their result, and you have nothing to analyse later. **That cannot be fixed
retrospectively.**

**Error copy:**

> Something went wrong saving your answers. Nothing has been lost on your end, but we would rather
> not show you a report we cannot stand behind. Please try again.

## 5.2 Retakes

**Condition:** same person takes the assessment more than once.

**Behaviour:**

| Rule | Detail |
|---|---|
| **Both stored** | Never overwrite a previous attempt |
| Report from | Most recent completed attempt |
| Flag | Second and subsequent attempts marked as retakes |
| Interval | Store days between attempts |

⚠️ **Retakes are free test-retest data.** Test-retest reliability is one of the validation steps
needed at six months, and this is where the sample comes from. **Build for it deliberately rather
than treating retakes as an accident.**

## 5.3 Cohort deleted mid-assessment

**Condition:** an organisational cohort is removed while somebody is taking the assessment.

**Behaviour:** **orphan the response, do not delete it.** It still counts for validation even if the
cohort no longer exists.

## 5.4 Duplicate submission

**Condition:** the same session submits twice, usually a double-click or a retry.

**Behaviour:** idempotency key per session. Second submission returns the first result rather than
creating a new record.

⚠️ **Distinguish this from a genuine retake.** Same session equals duplicate. New session equals
retake.

---
---

# 6 · WHAT TO STORE

⚠️ **Rule 2 of the build brief: store raw responses, not just scores.** Every validation step
depends on it and none of it can be retrofitted.

## Per response record

| Field | Notes |
|---|---|
| Response ID | |
| User ID | |
| Cohort ID | Nullable |
| Started at, completed at | |
| Status | complete · abandoned · low-confidence |
| **Raw answers, all 40** | ⚠️ Item ID, selected option, **and which position it was displayed in** |
| Per-item duration | Milliseconds |
| Computed scores | Pace, priority, pressure pace, pressure priority, range |
| Blend percentages | All four |
| Confidence flags | Which triggered, if any |
| Attempt number | 1, 2, 3 |
| Instrument version | ⚠️ **Essential.** Questions will change, and old data must remain interpretable |

## Per fleet record

| Field |
|---|
| Response ID |
| Path (A estimated / B calculated) |
| Four counts |
| Total |
| Findings triggered (dominant / heavy / missing / thin / balanced) |

⚠️ **Instrument version on every record.** When questions get rewritten after the first hundred
responses, version-tagged data is analysable and untagged data is not.

---
---

# 7 · SUMMARY TABLE

| Case | Behaviour |
|---|---|
| Leaves mid-assessment | No resume. Fresh start. Partial stored |
| Under 4 min + poor Block D | Low confidence |
| Fast but consistent | **Valid.** Report normally |
| Straight-lined | Low confidence. No style reported |
| Both scores 45–55 | **Valid.** Balanced copy path |
| Pressure equals natural | Intensification copy path |
| Range under 8 | Combined marker, no line |
| Block C incomplete | Natural position only |
| Fleet estimate zero | Skip Fleet section |
| Team of one | Suppress Fleet section |
| Team of 2–3 | Show with caution banner |
| Blend under 10% | Render at reduced opacity. Never omit |
| **Write failure** | ⚠️ **Error. No report** |
| Retake | Store both. Report from latest. Flag as retake |
| Duplicate submit | Idempotency key. Return the first result |
| Cohort deleted | Orphan the response. Do not delete |
