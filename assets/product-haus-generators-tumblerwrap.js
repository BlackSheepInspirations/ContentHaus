/**
 * The AI Creator's Project Haus — Tumbler / Product Wrap Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A full edge-to-edge wrap design for tumblers, mugs, glass cans, and
 * bottles. The critical constraint is SEAM ALIGNMENT: the left and right
 * edges of the flat artwork physically meet when wrapped around the cup,
 * so they must line up seamlessly. The locked suffix hammers full-bleed,
 * seam continuity, and keeping key elements away from the top/bottom trim
 * (which curves/crops on a real tumbler). Per-product template dimensions
 * are injected so the aspect and safe area are correct for each size.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var sortAlpha = ProductHaus.util.sortAlpha;

  // Approximate flat wrap template dimensions (W x H) for common blanks.
  // These are the standard sublimation-template sizes creators expect;
  // the AI can't hit exact pixels, but stating them anchors the aspect
  // ratio and the "tall wide rectangle" proportion.
  var PRODUCT_OPTIONS = [
    "20 oz Skinny Tumbler",
    "30 oz Tumbler",
    "40 oz Tumbler (Quencher style)",
    "16 oz Glass Can / Libbey",
    "12 oz Mug",
    "15 oz Mug",
    "20 oz Straight Tumbler",
    "Water Bottle",
  ];
  var PRODUCT_DIMS = {
    "20 oz Skinny Tumbler": "about 9.3 in wide by 8.2 in tall (standard 20 oz skinny sublimation template)",
    "30 oz Tumbler": "about 9.5 in wide by 8.3 in tall (standard 30 oz sublimation template)",
    "40 oz Tumbler (Quencher style)": "about 11.7 in wide by 8.0 in tall (40 oz Quencher-style template)",
    "16 oz Glass Can / Libbey": "about 8.4 in wide by 5.0 in tall (16 oz glass can template)",
    "12 oz Mug": "about 8.5 in wide by 3.4 in tall (11-12 oz mug wrap template)",
    "15 oz Mug": "about 8.6 in wide by 4.3 in tall (15 oz mug wrap template)",
    "20 oz Straight Tumbler": "about 9.3 in wide by 8.2 in tall (20 oz straight-wall template)",
    "Water Bottle": "a tall narrow wrap template sized for a slim water bottle",
  };

  var WRAP_THEME_OPTIONS = sortAlpha([
    "Florals & Botanicals",
    "Boho / Aesthetic (Cottagecore, Coquette, Y2K)",
    "Holiday & Seasonal",
    "Christmas & Winter",
    "Halloween & Spooky",
    "Western & Cowgirl",
    "Faith & Inspirational",
    "Motivational Quotes & Affirmations",
    "Cute / Kawaii",
    "Nature & Landscapes",
    "Celestial / Mystical",
    "Tropical & Summer",
    "Mama / Family",
    "Nurse / Teacher / Profession",
    "Sports & Team",
    "Retro & Vintage",
    "Coffee & Drinks",
    "Animals & Pets",
  ]);

  var LAYOUT_OPTIONS = [
    "Wrap-Around Scene (one continuous design all the way around)",
    "Repeating Pattern (all-over, seamless)",
    "Centered Focal Design with Pattern Fill Around It",
    "Color Block / Ombre Background with Motifs",
  ];
  var ART_STYLE_OPTIONS = ["Watercolor", "Flat Vector / Bold Graphic", "Hand-Drawn Doodle", "Line Art / Minimalist", "Vintage / Retro", "Realistic / Painterly", "Glitter / Sparkle Look"];
  var COLOR_PALETTE_OPTIONS = ["Soft Pastels", "Bold & Bright", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold", "Muted Boho Neutrals", "Jewel Tones"];

  var LOCKED_SUFFIX =
    " This is a flat, full-bleed wrap design that gets printed and wrapped around the product, so it MUST fill the entire rectangular canvas edge to edge with no border, frame, white margin, or empty space on any side." +
    " SEAM ALIGNMENT IS CRITICAL: the left edge and the right edge physically meet when the artwork is wrapped around the product, so the design must line up seamlessly where those two edges join — the pattern or scene running off the right edge must continue exactly onto the left edge, with no hard seam, mismatch, or abruptly cut-off element at that join." +
    " Keep any important text, faces, or focal elements within the vertical middle safe zone, away from the very top and very bottom edges, which curve and crop on the finished product." +
    " Present it as the flat rectangular print template only (not a 3D mockup of the cup). High resolution, 300 DPI, crisp and clean, sublimation print-ready.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "tumbler-wrap",
    label: "Tumbler / Product Wrap Generator",
    icon: "droplet",
    description: "A full edge-to-edge wrap for tumblers, mugs, glass cans, and bottles — correct template size with seamlessly aligned left/right edges.",
    fieldGroupTitle: "Customize Your Tumbler / Product Wrap",

    presets: [
      { name: "Boho Wildflower 20oz", description: "Continuous wildflower scene, muted neutrals.",
        apply: { productType: "20 oz Skinny Tumbler", wrapTheme: "Florals & Botanicals", layout: "Wrap-Around Scene (one continuous design all the way around)", artStyle: "Watercolor", colorPalette: "Muted Boho Neutrals" } },
      { name: "Christmas 40oz", description: "Festive repeating pattern, bold & bright.",
        apply: { productType: "40 oz Tumbler (Quencher style)", wrapTheme: "Christmas & Winter", layout: "Repeating Pattern (all-over, seamless)", artStyle: "Flat Vector / Bold Graphic", colorPalette: "Bold & Bright" } },
      { name: "Western Mama Mug", description: "Centered western motif, warm earth tones.",
        apply: { productType: "15 oz Mug", wrapTheme: "Western & Cowgirl", layout: "Centered Focal Design with Pattern Fill Around It", artStyle: "Vintage / Retro", colorPalette: "Warm Earth Tones" } },
    ],

    fields: [
      { name: "productType", label: "Product / Blank", options: PRODUCT_OPTIONS, defaultValue: PRODUCT_OPTIONS[0] },
      { name: "wrapTheme", label: "Theme / Genre", options: WRAP_THEME_OPTIONS, defaultValue: WRAP_THEME_OPTIONS[0] },
      { name: "subjectDescription", label: "What Should It Show?", isFreeText: true, defaultValue: "", placeholder: "e.g. a rolling wildflower meadow with mountains behind" },
      { name: "wrapText", label: "Add Text / Name (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. a name, monogram, or short quote" },
      { name: "layout", label: "Layout Style", options: LAYOUT_OPTIONS, defaultValue: LAYOUT_OPTIONS[0] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
    ],

    computeExtraTokens: function (valueMap) {
      var dims = PRODUCT_DIMS[valueMap.productType] || "a standard tumbler wrap template";
      var dimClause = "sized as a flat wrap template for a " + valueMap.productType + " — " + dims;

      var hasSubject = !!valueMap.subjectDescription;
      var themeClause = " in the " + valueMap.wrapTheme + " theme";
      var layoutName = (valueMap.layout || "").replace(/\s*\(.*\)\s*$/, "");

      var contentClause;
      if (/Wrap-Around Scene/i.test(valueMap.layout)) {
        contentClause = hasSubject
          ? "one continuous wrap-around scene of " + valueMap.subjectDescription + themeClause + " that flows unbroken all the way around"
          : "one continuous wrap-around scene" + themeClause + " that flows unbroken all the way around";
      } else if (/Repeating Pattern/i.test(valueMap.layout)) {
        contentClause = hasSubject
          ? "a seamless all-over repeating pattern of " + valueMap.subjectDescription + themeClause
          : "a seamless all-over repeating pattern" + themeClause;
      } else if (/Centered Focal/i.test(valueMap.layout)) {
        contentClause = hasSubject
          ? "a centered focal design of " + valueMap.subjectDescription + themeClause + ", with a coordinating pattern filling the space around it"
          : "a centered focal design" + themeClause + ", with a coordinating pattern filling the space around it";
      } else {
        contentClause = hasSubject
          ? "a color-block / ombre background" + themeClause + " with motifs of " + valueMap.subjectDescription + " layered on top"
          : "a color-block / ombre background" + themeClause + " with coordinating motifs layered on top";
      }

      var textClause = "";
      if (valueMap.wrapText) {
        textClause = " Include the text \"" + valueMap.wrapText + "\" worked into the design, kept within the vertical middle safe zone and styled to match the overall art style and color palette.";
      }

      return {
        dimClause: dimClause,
        contentClause: contentClause,
        layoutClause: layoutName.toLowerCase(),
        textClause: textClause,
      };
    },

    basePromptTemplate:
      "A print-ready product wrap, {dimClause}: {contentClause}.{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A print-ready product wrap with extra charm, {dimClause}: {contentClause}.{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A bold, standout product wrap, {dimClause}: {contentClause}.{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}." +
      LOCKED_SUFFIX,

    charmPool: [
      "a few small accent motifs scattered into the negative space to keep the wrap full and balanced",
      "a subtle soft texture or gentle highlight across the whole wrap",
      "a delicate coordinating border detail running along the top and bottom",
    ],
    dynamicPool: [
      "richer, more saturated colors and stronger contrast throughout",
      "a more graphic, high-impact treatment of the main design",
      "a bolder sense of movement flowing around the wrap",
    ],
  });
})();
