/**
 * Marketing Haus — 30-Day Content Calendar (cloned from Growth Haus's "30-Day Calendar"
 * bonus module). Outputs a month of dated post ideas. Declarative Quick Generator.
 *
 * Depth pass (2026-08-07): added a **primary goal** (so the whole month pulls
 * toward one outcome instead of generic "balanced" filler) and an optional
 * **anchor moment** (a launch, sale, or key date the runway builds toward),
 * both threaded into the weekly themes.
 */
(function () {
  "use strict";
  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var PLATFORM = ["TikTok", "Instagram", "YouTube", "LinkedIn", "Multi-platform"];
  var CADENCE = ["3 posts / week", "5 posts / week", "7 posts / week (daily)"];
  var MIX = ["Balanced (educate / entertain / sell)", "Mostly value", "Growth-focused", "Launch runway"];
  var GOAL = ["Grow the audience", "Drive sales", "Launch a product", "Build authority & trust", "Boost engagement"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "content-calendar-30",
    textOnly: true,
    label: "30-Day Content Calendar",
    icon: "document",
    description: "A month of post ideas mapped to days — hook, format, and CTA for each, grouped by week with a weekly theme, all pulling toward one goal.",
    fieldGroupTitle: "Plan Your Month",
    fields: [
      { name: "subject", label: "Brand / product / niche", isFreeText: true, defaultValue: "my brand", placeholder: "e.g. hand-poured soy candles for cozy homes" },
      { name: "platform", label: "Platform", options: PLATFORM, defaultValue: PLATFORM[0] },
      { name: "primaryGoal", label: "Primary Goal This Month", options: GOAL, defaultValue: GOAL[0] },
      { name: "cadence", label: "Posting Cadence", options: CADENCE, defaultValue: CADENCE[1] },
      { name: "mix", label: "Content Mix", options: MIX, defaultValue: MIX[0] },
      { name: "anchor", label: "Big Moment This Month (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. new scent drops on the 22nd · a weekend flash sale" },
    ],
    computeExtraTokens: function (v) {
      return {
        anchorClause: v.anchor ? " Build the month toward this key moment and let the final week ramp up to it: " + v.anchor + "." : "",
      };
    },
    basePromptTemplate:
      "Build a 30-day content calendar for {subject}{holidayClause} on {platform}, at {cadence}, with a {mix} content mix, all pulling toward one goal: {primaryGoal}.{anchorClause} " +
      "Group it by week with one theme per week that advances that goal. For each post give: the day, a hook, the format (Reel / carousel / story / photo / etc.), a one-line description, and a CTA.",
    charmPromptTemplate:
      "Build an inspired 30-day content calendar for {subject}{holidayClause} on {platform}, at {cadence}, with a {mix} mix, aimed at one goal: {primaryGoal}.{anchorClause} " +
      "Give each week a clear theme that moves toward the goal, and for each post a scroll-stopping hook, the format, a one-line description, and a CTA.",
    dynamicPromptTemplate:
      "Build a growth-minded 30-day content calendar for {subject}{holidayClause} on {platform}, at {cadence}, with a {mix} mix, engineered around one goal: {primaryGoal}.{anchorClause} " +
      "Theme each week toward momentum, and for each post give a bold hook, the format, a one-line description, and a CTA that drives the next action.",
    charmPool: [
      "one recurring series idea to anchor the month",
      "a mid-month engagement post (poll / question / duet)",
      "a batch-filming tip so a week can be shot in one sitting",
    ],
    dynamicPool: [
      "a viral-leaning trend slot each week",
      "a soft-sell-to-hard-sell ramp across the weeks",
      "a call-to-save or call-to-share post to boost reach",
    ],
  });
})();
