/**
 * The AI Creator's Marketing Haus — Video Ad Bundle Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, marketing-haus-brandkit.js, and
 * marketing-haus-generators.js (all must load first — this file just
 * registers itself with that engine).
 *
 * A Page Bundle of the separate shot/script pieces a creator layers
 * together into one finished product ad video — voiceover script,
 * demo shot, B-roll, and a cinematic reveal — sharing one ad angle and
 * production format so the pieces cut together. Migrated from ROOTED
 * Method's old flat generator catalog (voiceover-script, product-demo,
 * b-roll, cinematic-reveal, product-video-ad), folded into one bundle
 * per the owner's direction: keep them separately generated so each
 * piece can be used on its own to build the ad, rather than one flat
 * generator or five standalone ones.
 *
 * Not wired into the Look Lock `aesthetic` bridge — same reasoning as
 * Video Motion Prompt Generator: motion/production framing isn't an
 * aesthetic to lock the way art style/palette are.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var AD_ANGLE_OPTIONS = ["Problem & Solution", "Feature Showcase", "Testimonial Style", "Fast Promo Cuts"];
  var PRODUCTION_FORMAT_OPTIONS = ["Faceless", "Talking Head", "Product Demonstration", "Text-Led", "Hands-Only", "Screen Recording"];
  var DURATION_OPTIONS = ["15 seconds", "30 seconds", "45 seconds", "60 seconds"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "video-ad-bundle",
    textOnly: true,
    label: "Video Ad Bundle (separate shot prompts)",
    icon: "video",
    description: "SEVERAL separate AI-generatable prompts — one per shot (voiceover, demo shot, B-roll, cinematic reveal) — all sharing one angle, that you generate individually and layer together into the finished ad. Use this if you're producing the video clip-by-clip. (For one all-in-one written plan instead, use the Video Ad Kit.)",
    fieldGroupTitle: "Customize Your Ad Bundle",

    fields: [
      { name: "productFocus", label: "Product & Key Benefit", isFreeText: true, defaultValue: "the product and the one thing it does best", placeholder: "e.g. our leather planner — helps you actually finish your to-do list" },
      { name: "adAngle", label: "Ad Angle", options: AD_ANGLE_OPTIONS, defaultValue: AD_ANGLE_OPTIONS[0] },
      { name: "productionFormat", label: "Production Format", options: PRODUCTION_FORMAT_OPTIONS, defaultValue: PRODUCTION_FORMAT_OPTIONS[0] },
      { name: "overallDuration", label: "Target Ad Length", options: DURATION_OPTIONS, defaultValue: DURATION_OPTIONS[1] },
    ],

    computeExtraTokens: function (valueMap) {
      var kit = MarketingHaus.brandKit && MarketingHaus.brandKit.getActiveKit();
      var mood = kit ? MarketingHaus.engine.resolveFieldValue(kit.fields.mood) : "";
      return {
        brandClause: mood ? " Matches the brand's " + mood + " aesthetic." : "",
        formatClause: valueMap.productionFormat ? valueMap.productionFormat + "-style, " : "",
      };
    },

    pageTypesCap: 4,
    pageTypesLabel: "Ad Pieces",
    defaultPageTypes: ["voiceoverscript", "productdemo", "broll", "cinematicreveal"],
    bundleBlockTitle: "Your Video Ad Bundle",
    pageTypes: [
      {
        id: "voiceoverscript",
        label: "Voiceover Script",
        promptTemplate:
          "Write a natural, spoken promotional voiceover script for a ~{overallDuration} ad about {productFocus}, in a {adAngle} angle.{brandClause} " +
          "Structure it as short lines timed to roughly {overallDuration}, matched to the beats of a {productionFormat} video, ending on one clear call to action. " +
          "Write the script text only — no camera directions.",
      },
      {
        id: "productdemo",
        label: "Product Demo Shot",
        promptTemplate:
          "A {formatClause}product-demonstration video shot showing {productFocus} in actual use, cut for a {adAngle} ad paced to fit inside a ~{overallDuration} video.{brandClause} " +
          "Show the product clearly doing the thing it's best at, in real time, with nothing else competing for attention in frame.",
      },
      {
        id: "broll",
        label: "B-Roll Shot Set",
        promptTemplate:
          "A set of 4-5 clean B-roll shots of {productFocus} — a close-up detail shot, an establishing/context shot, and an in-use shot — {formatClause}cut for a {adAngle} ad and sized to fit inside a ~{overallDuration} video.{brandClause} " +
          "Each shot simple and steady enough to cut together smoothly with the other pieces of this ad.",
      },
      {
        id: "cinematicreveal",
        label: "Cinematic Reveal Shot",
        promptTemplate:
          "A short cinematic reveal shot of {productFocus}, opening with a slow push-in or orbit camera move, {formatClause}paced to work as the opening or closing beat of a ~{overallDuration} {adAngle} ad.{brandClause} " +
          "Clean, uncluttered composition — this shot needs to carry the moment on its own.",
      },
    ],
  });
})();
