/**
 * The AI Creator's Marketing Haus — Quote Graphic Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Named "Quote Graphic Generator" rather than "Quote Wall Art" on
 * purpose — Project Haus already has its own Quote Wall Art Generator
 * (a sellable print product). This one is the same underlying mechanic
 * for a different market: a shareable social/marketing graphic, not
 * wall art. Each Haus keeps its own copy per the established
 * "verbatim port, never shared" convention; the naming keeps them
 * unambiguous from each other in the shop owner's own admin.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var QUOTE_CATEGORY_OPTIONS = ["Motivational", "Business / Entrepreneurial", "Faith-Based", "Humor / Relatable", "Educational Tip"];
  var ART_STYLE_OPTIONS = ["Minimal Typography", "Bold Color Block", "Soft Editorial", "Hand-Lettered"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var BACKGROUND_STYLE_OPTIONS = ["Solid Color Background", "Soft Gradient Background", "Textured / Photo Background"];

  var LOCKED_SUFFIX = " Clean flat design, no shadows or 3D effects, balanced spacing, social-media ready, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "marketing-quote-graphic",
    label: "Quote Graphic Generator",
    icon: "type",
    description: "A shareable social-media quote graphic — for posts and pins, not wall art.",
    fieldGroupTitle: "Customize Your Quote Graphic",

    fields: [
      { name: "quoteText", label: "Quote Text", isFreeText: true, defaultValue: "Be the reason someone smiles today", placeholder: "Enter your quote or affirmation here..." },
      { name: "quoteCategory", label: "Quote Category", options: QUOTE_CATEGORY_OPTIONS, defaultValue: QUOTE_CATEGORY_OPTIONS[0] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "backgroundStyle", label: "Background Style", options: BACKGROUND_STYLE_OPTIONS, defaultValue: BACKGROUND_STYLE_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        quoteCategoryArticle: /^[aeiou]/i.test(valueMap.quoteCategory) ? "An" : "A",
      };
    },

    basePromptTemplate:
      "{quoteCategoryArticle} {quoteCategory} quote graphic displaying the text: \"{quoteText}\". {artStyle} style, a {colorPalette} color palette, on a {backgroundStyle}{holidayClause}.\n\n" +
      "Layout: the quote text centered and dominant, filling most of the frame, legible at a glance." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a warm {quoteCategory} quote graphic featuring: \"{quoteText}\", in a {artStyle} style, a {colorPalette} color palette, on a {backgroundStyle}{holidayClause}.\n\n" +
      "Layout: the quote text centered and dominant, with a small decorative touch for extra charm." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design a bold {quoteCategory} quote graphic featuring: \"{quoteText}\", in a {artStyle} style, a {colorPalette} color palette, on a {backgroundStyle}{holidayClause}.\n\n" +
      "Layout: the quote text centered and dominant, with bolder visual energy." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small decorative divider beneath the quote",
      "a subtle corner flourish",
      "delicate small dots or stars scattered lightly around the text",
    ],
    dynamicPool: [
      "bolder scale contrast between words for visual rhythm",
      "a slightly asymmetric, dynamic text arrangement",
      "extra emphasis on the most important word or phrase",
    ],
  });
})();
