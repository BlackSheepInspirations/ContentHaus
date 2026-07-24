/**
 * The AI Creator's Brand Haus — Media Kit Generator
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-brandkit.js, and brand-haus-generators.js (all must load
 * first — this file just registers itself with that engine).
 *
 * A 4-page Page Bundle (Cover/Overview, Stats & Audience, Portfolio/
 * Services, Contact) for a creator building a media kit — either their
 * own, or one for a client. Same reasoning as Business Card Kit: no Art
 * Style or Color Palette field of its own, every aesthetic value comes
 * live from the active Brand Kit via computeExtraTokens, with generic
 * fallback phrasing when none is active. This is the Brand Haus version
 * of Media Kit — a separate, simpler Marketing Haus version is planned
 * as its own generator there, not shared with this file.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var sortAlpha = BrandHaus.util.sortAlpha;

  var PURPOSE_OPTIONS = sortAlpha(["Influencer / Creator Pitch", "Business Press Kit", "Service Provider One-Pager"]);
  var LAYOUT_OPTIONS = ["Single-Page Overview", "Multi-Section Grid", "Portfolio-Forward"];

  BrandHaus.generatorEngine.registerGenerator({
    id: "media-kit",
    label: "Media Kit Generator",
    icon: "document",
    description: "A 4-page media kit — cover, stats, portfolio, and contact — built straight from your active Brand Kit's colors, fonts, and mood. This produces an AI image-generation prompt for each page — paste it into an image tool (ChatGPT's image generator, Midjourney, Kittl, etc.), not into Frank. Frank's built for business/strategy conversations, not generating visuals, and without a business name he'll default to talking about himself.",
    fieldGroupTitle: "Customize Your Media Kit",

    fields: [
      { name: "mediaKitPurpose", label: "Media Kit Purpose", options: PURPOSE_OPTIONS, defaultValue: PURPOSE_OPTIONS[0] },
      { name: "audienceSize", label: "Audience Size (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. 12,000 total followers" },
      { name: "engagementRate", label: "Engagement Rate (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. 4.2% average engagement" },
      { name: "topPlatforms", label: "Top Platforms (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Instagram, TikTok, YouTube" },
      { name: "notableCollabs", label: "Notable Collaborations (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. brands or clients you've worked with" },
      { name: "customStat1", label: "Add Your Own Stat #1 (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Newsletter Subscribers: 5,200" },
      { name: "customStat2", label: "Add Your Own Stat #2 (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Audience Location: USA 38%, Canada 28%, UK 22%, Other 12%" },
      { name: "bioFocus", label: "Bio / Portfolio Focus", isFreeText: true, defaultValue: "past collaborations and areas of expertise", placeholder: "e.g. past brand collaborations, specialty niches" },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_OPTIONS, defaultValue: LAYOUT_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var kit = BrandHaus.brandKit && BrandHaus.brandKit.getActiveKit();
      var resolve = BrandHaus.engine.resolveFieldValue;
      var colors = kit ? (kit.fields.colors || []).filter(Boolean) : [];
      var headingFont = kit ? resolve(kit.fields.headingFont) : "";
      var bodyFont = kit ? resolve(kit.fields.bodyFont) : "";
      var mood = kit ? resolve(kit.fields.mood) : "";
      var mission = kit ? resolve(kit.fields.mission) : "";
      // Neither this generator's own fields nor the active Brand Kit carry
      // a business/creator name — that lives on the shared identity bar
      // (Branding Studio/Logo Studio's "Business Name" field). Without
      // pulling it in explicitly, every page template's generic "the
      // business/creator name" phrasing left the actual name unspecified,
      // and the AI tool receiving the prompt would invent one.
      var businessName = BrandHaus.identity ? resolve(BrandHaus.identity.getState().businessName) : "";

      // Named stat widgets so real numbers land in named slots instead of
      // one free-text blob the AI has to parse and fill gaps in on its
      // own — the reported "the stats are pretty much made up" problem.
      var statParts = [
        valueMap.audienceSize ? "Audience size: " + valueMap.audienceSize : null,
        valueMap.engagementRate ? "Engagement rate: " + valueMap.engagementRate : null,
        valueMap.topPlatforms ? "Top platforms: " + valueMap.topPlatforms : null,
        valueMap.notableCollabs ? "Notable collaborations: " + valueMap.notableCollabs : null,
        valueMap.customStat1 ? valueMap.customStat1 : null,
        valueMap.customStat2 ? valueMap.customStat2 : null,
      ].filter(Boolean);

      return {
        forClause: businessName ? " for \"" + businessName + "\"" : "",
        coverNameClause: businessName
          ? "Feature the name \"" + businessName + "\" prominently"
          : "Feature the business/creator's name prominently (use a clean placeholder name, not a real brand, since none was specified)",
        brandColorsClause: colors.length ? "Use this exact color palette: " + colors.join(", ") + "." : "Use a cohesive, professional color palette.",
        brandFontClause: (headingFont || bodyFont)
          ? "Typography should reflect " + (headingFont || bodyFont) + " for headings and " + (bodyFont || headingFont) + " for supporting text."
          : "Use clean, professional typography.",
        brandMoodClause: mood ? " with a " + mood + " overall feel" : "",
        missionClause: mission ? " Incorporate this mission statement as supporting context: \"" + mission + "\"." : "",
        statsBlock: statParts.length ? statParts.join(" | ") : "no specific stats provided",
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
          "Design the cover/overview page of a {mediaKitPurpose} media kit{forClause}{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} {coverNameClause}, along with a short one-line positioning statement.{missionClause} " +
          "Layout style: {layoutStyle}.",
      },
      {
        id: "stats",
        label: "Stats & Audience",
        promptTemplate:
          "MEDIA KIT — STATS & AUDIENCE PAGE\n\n" +
          "Design a stats and audience page continuing the same {mediaKitPurpose} media kit style{forClause}{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Present these stats as bold-number stat widgets (a large number/percentage with a short label underneath): {statsBlock}. " +
          "Do not invent or estimate numbers for any stat that wasn't provided above — for those, leave a clean placeholder widget (label only, no number) that the creator can fill in later. " +
          "Layout style: {layoutStyle}.",
      },
      {
        id: "portfolio",
        label: "Portfolio / Services",
        promptTemplate:
          "MEDIA KIT — PORTFOLIO / SERVICES PAGE\n\n" +
          "Design a portfolio/services page continuing the same style{forClause}{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Highlight the following focus: {bioFocus}. " +
          "Layout style: {layoutStyle}.",
      },
      {
        id: "contact",
        label: "Contact",
        promptTemplate:
          "MEDIA KIT — CONTACT PAGE\n\n" +
          "Design a closing contact page continuing the same style{forClause}{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Include clean space for contact details (email, website, social handles) and a clear call-to-action to get in touch. " +
          "Layout style: {layoutStyle}.",
      },
    ],
  });
})();
