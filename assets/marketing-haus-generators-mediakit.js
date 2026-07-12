/**
 * The AI Creator's Marketing Haus — Media Kit Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-brandkit.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * The Marketing Haus counterpart to Brand Haus's own Media Kit Generator
 * — same 4-page shape (Cover/Overview, Stats & Audience, Portfolio/
 * Services, Contact), same reasoning for exposing no Art Style/Palette
 * field of its own (every aesthetic value comes live from the active
 * Brand Kit via computeExtraTokens, generic fallback when none is
 * active). Reads MarketingHaus.brandKit.getActiveKit() directly (the
 * same mechanism Video Motion Prompt already uses for mood alone)
 * rather than getActiveKitEntries() — that helper's synthetic-entry
 * shape is for the broad copywriting Studios' fieldEntries concat, not
 * for pulling specific values into computeExtraTokens.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var PURPOSE_OPTIONS = sortAlpha(["Influencer / Creator Pitch", "Business Press Kit", "Service Provider One-Pager"]);
  var LAYOUT_OPTIONS = ["Single-Page Overview", "Multi-Section Grid", "Portfolio-Forward"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "media-kit",
    label: "Media Kit Generator",
    icon: "document",
    description: "A 4-page media kit — cover, stats, portfolio, and contact — built straight from your active Brand Kit's colors, fonts, and mood.",
    fieldGroupTitle: "Customize Your Media Kit",

    fields: [
      { name: "mediaKitPurpose", label: "Media Kit Purpose", options: PURPOSE_OPTIONS, defaultValue: PURPOSE_OPTIONS[0] },
      { name: "keyStats", label: "Key Stats / Highlights", isFreeText: true, defaultValue: "50K social followers, 4.2% engagement rate", placeholder: "e.g. 50K Instagram followers, 4.2% engagement rate" },
      { name: "bioFocus", label: "Bio / Portfolio Focus", isFreeText: true, defaultValue: "past collaborations and areas of expertise", placeholder: "e.g. past brand collaborations, specialty niches" },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_OPTIONS, defaultValue: LAYOUT_OPTIONS[0] },
    ],

    computeExtraTokens: function () {
      var kit = MarketingHaus.brandKit && MarketingHaus.brandKit.getActiveKit();
      var resolve = MarketingHaus.engine.resolveFieldValue;
      var colors = kit ? (kit.fields.colors || []).filter(Boolean) : [];
      var headingFont = kit ? resolve(kit.fields.headingFont) : "";
      var bodyFont = kit ? resolve(kit.fields.bodyFont) : "";
      var mood = kit ? resolve(kit.fields.mood) : "";

      return {
        brandColorsClause: colors.length ? "Use this exact color palette: " + colors.join(", ") + "." : "Use a cohesive, professional color palette.",
        brandFontClause: (headingFont || bodyFont)
          ? "Typography should reflect " + (headingFont || bodyFont) + " for headings and " + (bodyFont || headingFont) + " for supporting text."
          : "Use clean, professional typography.",
        brandMoodClause: mood ? " with a " + mood + " overall feel" : "",
      };
    },

    pageTypesCap: 4,
    pageTypesLabel: "Pages",
    defaultPageTypes: ["cover", "stats", "portfolio", "contact"],
    bundleBlockTitle: "Your Media Kit",
    pageTypes: [
      {
        id: "cover",
        label: "Cover / Overview",
        promptTemplate:
          "MEDIA KIT — COVER / OVERVIEW PAGE\n\n" +
          "Design the cover/overview page of a {mediaKitPurpose} media kit{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Feature the business/creator name prominently along with a short one-line positioning statement. " +
          "Layout style: {layoutStyle}.",
      },
      {
        id: "stats",
        label: "Stats & Audience",
        promptTemplate:
          "MEDIA KIT — STATS & AUDIENCE PAGE\n\n" +
          "Design a stats and audience page continuing the same {mediaKitPurpose} media kit style{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Present these key stats/highlights in a clean, scannable layout: {keyStats}. " +
          "Layout style: {layoutStyle}.",
      },
      {
        id: "portfolio",
        label: "Portfolio / Services",
        promptTemplate:
          "MEDIA KIT — PORTFOLIO / SERVICES PAGE\n\n" +
          "Design a portfolio/services page continuing the same style{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Highlight the following focus: {bioFocus}. " +
          "Layout style: {layoutStyle}.",
      },
      {
        id: "contact",
        label: "Contact",
        promptTemplate:
          "MEDIA KIT — CONTACT PAGE\n\n" +
          "Design a closing contact page continuing the same style{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Include clean space for contact details (email, website, social handles) and a clear call-to-action to get in touch. " +
          "Layout style: {layoutStyle}.",
      },
    ],
  });
})();
