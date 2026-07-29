/**
 * The AI Creator's Marketing Haus — Launch Content Bundle Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, marketing-haus-brandkit.js, and
 * marketing-haus-generators.js (all must load first — this file just
 * registers itself with that engine).
 *
 * A Page Bundle of the multi-piece social content a launch needs in
 * the run-up to going live — a slide carousel, a content series, and
 * a teaser — sharing one launch focus and tone. Migrated from ROOTED
 * Method's old flat generator catalog (launch-carousel, content-series,
 * launch-teaser). launch-announcement, the fourth item in that old
 * category, stays its own dedicated flagship generator inside ROOTED
 * Method itself (the Trigger/Day-8 "we're live" moment is the one
 * asset unique to that tool's own launch sequence) rather than being
 * folded in here.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var TONE_OPTIONS = ["Excited", "Premium", "Warm", "Bold"];
  var CHANNEL_OPTIONS = ["Instagram", "TikTok", "Email", "Pinterest", "Multi-channel"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "launch-content-bundle",
    label: "Launch Content Bundle Generator",
    icon: "layers",
    description: "The multi-piece social content set a launch needs before going live — a slide carousel, a content series, and a teaser, all sharing one focus and tone.",
    fieldGroupTitle: "Customize Your Launch Bundle",

    fields: [
      { name: "launchFocus", label: "What's Launching & The Hook", isFreeText: true, defaultValue: "the product and the one thing that makes it worth talking about", placeholder: "e.g. our new planner bundle — finally a system that sticks" },
      { name: "tone", label: "Tone", options: TONE_OPTIONS, defaultValue: TONE_OPTIONS[0] },
      { name: "channel", label: "Primary Channel", options: CHANNEL_OPTIONS, defaultValue: CHANNEL_OPTIONS[4] },
    ],

    computeExtraTokens: function () {
      var kit = MarketingHaus.brandKit && MarketingHaus.brandKit.getActiveKit();
      var mood = kit ? MarketingHaus.engine.resolveFieldValue(kit.fields.mood) : "";
      return {
        brandClause: mood ? " Matches the brand's " + mood + " voice." : "",
      };
    },

    pageTypesCap: 3,
    pageTypesLabel: "Bundle Pieces",
    defaultPageTypes: ["carousel", "contentseries", "teaser"],
    bundleBlockTitle: "Your Launch Content Bundle",
    pageTypes: [
      {
        id: "carousel",
        label: "Launch Carousel",
        promptTemplate:
          "A slide-by-slide launch carousel (7 slides) for {channel}, introducing {launchFocus}, in a {tone} tone.{brandClause} " +
          "Move from the problem, to the transformation, to what's included, ending on a clear call to action on the final slide.",
      },
      {
        id: "contentseries",
        label: "Content Series",
        promptTemplate:
          "A 5-post promotional content series for {channel} building up to the launch of {launchFocus}, in a {tone} tone.{brandClause} " +
          "Each post teases a different angle — the problem, the transformation, social proof, behind-the-scenes, and the final call to action — without giving away the whole offer in any single post.",
      },
      {
        id: "teaser",
        label: "Launch Teaser",
        promptTemplate:
          "A short suspense-building teaser post for {channel} hinting that {launchFocus} is coming soon, in a {tone} tone.{brandClause} " +
          "Enough curiosity to make someone want to find out more, without revealing the full offer yet.",
      },
    ],
  });
})();
