/**
 * The AI Creator's Marketing Haus — Lead Magnet Cover Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var RESOURCE_TYPE_OPTIONS = ["Ebook", "Checklist", "Workbook / Planner", "Template Pack", "Guide / Cheat Sheet", "Mini-Course Cover"];
  var ART_STYLE_OPTIONS = ["Clean & Professional", "Warm & Approachable", "Bold & Modern", "Elegant & Minimal"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var COVER_FORMAT_OPTIONS = ["Flat Cover (2D)", "3D Book / Booklet Mockup Style", "Tablet / Device Mockup Style"];

  var LOCKED_SUFFIX = " Professional digital product cover design, clean composition, print-and-web ready, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "lead-magnet-cover",
    usesSizing: true,
    label: "Lead Magnet Cover Generator",
    icon: "download",
    description: "A cover for your ebook, checklist, workbook, or template pack — the graphic that makes a free resource feel worth downloading.",
    fieldGroupTitle: "Customize Your Cover",

    fields: [
      { name: "resourceType", label: "Resource Type", options: RESOURCE_TYPE_OPTIONS, defaultValue: RESOURCE_TYPE_OPTIONS[0] },
      { name: "titleText", label: "Title", isFreeText: true, defaultValue: "The Ultimate Meal Planning Guide", placeholder: "e.g. The Ultimate Meal Planning Guide" },
      { name: "subtitleText", label: "Subtitle (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Simple, budget-friendly weekly plans" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "coverFormat", label: "Cover Format", options: COVER_FORMAT_OPTIONS, defaultValue: COVER_FORMAT_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        subtitleClause: valueMap.subtitleText ? ", with the subtitle \"" + valueMap.subtitleText + "\"" : "",
        resourceTypeArticle: /^[aeiou]/i.test(valueMap.resourceType) ? "An" : "A",
      };
    },

    basePromptTemplate:
      "{resourceTypeArticle} {resourceType} cover titled \"{titleText}\"{subtitleClause}. {artStyle} art style, a {colorPalette} color palette, presented as a {coverFormat}{holidayClause}.\n\n" +
      "Layout: the title as the clear focal point, with generous breathing room and a professional, trustworthy first impression." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create an inviting {resourceType} cover titled \"{titleText}\"{subtitleClause}, in a {artStyle} style, a {colorPalette} color palette, as a {coverFormat}{holidayClause}.\n\n" +
      "Layout: the title as the clear focal point, with a small warm decorative touch." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design a standout {resourceType} cover titled \"{titleText}\"{subtitleClause}, in a {artStyle} style, a {colorPalette} color palette, as a {coverFormat}{holidayClause}.\n\n" +
      "Layout: the title as the clear focal point, with bolder visual presence." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small decorative icon relevant to the topic",
      "a subtle background texture or pattern",
      "a thin decorative border frame",
    ],
    dynamicPool: [
      "bolder color contrast between the title and background",
      "a more dynamic angled composition",
      "larger, more confident title typography",
    ],
  });
})();
