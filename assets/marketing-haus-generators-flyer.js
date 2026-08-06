/**
 * The AI Creator's Marketing Haus — Promotional Flyer Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * First of the 6 image-generation generators added to Marketing Haus's
 * new Quick Generators tab — a locked-template flyer prompt, distinct
 * from the 6 existing broad studios which only ever write copy/captions.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var FLYER_PURPOSE_OPTIONS = ["Sales / Discount Event", "Grand Opening", "Service Announcement", "Seasonal Promotion", "Event Invitation", "New Product Launch"];
  var ART_STYLE_OPTIONS = ["Bold & Modern", "Clean & Minimal", "Retro / Vintage", "Playful & Colorful", "Elegant & Upscale"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var LAYOUT_STYLE_OPTIONS = ["Centered Hero Layout", "Grid / Sectioned Layout", "Asymmetric Modern Layout"];

  var LOCKED_SUFFIX = " Print-ready promotional flyer design, clear visual hierarchy, balanced negative space, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "promo-flyer",
    usesSizing: true,
    label: "Promotional Flyer Generator",
    icon: "document",
    description: "A print-ready promotional flyer — sales events, grand openings, service announcements, and more.",
    fieldGroupTitle: "Customize Your Flyer",

    fields: [
      { name: "flyerPurpose", label: "Flyer Purpose", options: FLYER_PURPOSE_OPTIONS, defaultValue: FLYER_PURPOSE_OPTIONS[0] },
      { name: "headlineText", label: "Headline Text", isFreeText: true, defaultValue: "50% OFF This Weekend Only", placeholder: "e.g. 50% OFF This Weekend Only" },
      { name: "keyDetails", label: "Key Details", isFreeText: true, defaultValue: "dates, location, and how to redeem", placeholder: "e.g. dates, location, discount code" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_STYLE_OPTIONS, defaultValue: LAYOUT_STYLE_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        flyerPurposeArticle: /^[aeiou]/i.test(valueMap.flyerPurpose) ? "An" : "A",
      };
    },

    basePromptTemplate:
      "{flyerPurposeArticle} {flyerPurpose} promotional flyer with the headline \"{headlineText}\", including {keyDetails}. {artStyle} art style, a {colorPalette} color palette, arranged in a {layoutStyle}{holidayClause}.\n\n" +
      "Layout: the headline as the clear focal point, supporting details easy to scan at a glance." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create an eye-catching {flyerPurpose} flyer featuring \"{headlineText}\", with {keyDetails}, in a {artStyle} style, a {colorPalette} color palette, using a {layoutStyle}{holidayClause}.\n\n" +
      "Layout: the headline as the clear focal point, with extra decorative charm around the edges." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design a bold {flyerPurpose} flyer around \"{headlineText}\", with {keyDetails}, in a {artStyle} style, a {colorPalette} color palette, using a {layoutStyle}{holidayClause}.\n\n" +
      "Layout: the headline as the clear focal point, with bolder visual energy and shelf-stopping contrast." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small decorative border or divider accent",
      "a subtle background pattern texture",
      "one small icon reinforcing the offer",
    ],
    dynamicPool: [
      "bolder color contrast for extra shelf-stopping power",
      "a diagonal or angled design element for visual energy",
      "larger, bolder headline typography",
    ],
  });
})();
