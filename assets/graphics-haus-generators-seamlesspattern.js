/**
 * The AI Creator's Graphics Haus — Seamless Pattern Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A perfectly TILEABLE repeating pattern — digital/scrapbook paper,
 * wrapping paper, fabric (Spoonflower), or a website/product surface
 * tile. Ported from the Project Haus generator of the same name so both
 * tools share the feature; the locked suffix leans hard on edge-continuity
 * language (left edge must flow into the right, top into the bottom) so
 * the receiving AI produces a true seamless tile with no visible seam.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;
  var sortAlpha = GraphicsHaus.util.sortAlpha;

  var PATTERN_USE_OPTIONS = [
    "Digital / Scrapbook Paper",
    "Wrapping Paper / Gift Wrap",
    "Fabric / Textile (Spoonflower, etc.)",
    "Website / Background Tile",
    "Product Surface Pattern",
  ];

  var PATTERN_THEME_OPTIONS = sortAlpha([
    "Florals & Botanicals",
    "Geometric & Abstract",
    "Holiday & Seasonal",
    "Cute / Kawaii Animals",
    "Baby & Nursery",
    "Boho / Aesthetic (Cottagecore, Coquette, Y2K)",
    "Christmas & Winter",
    "Halloween & Spooky",
    "Nautical & Coastal",
    "Food & Drink",
    "Celestial / Mystical",
    "Tropical & Summer",
    "Farmhouse & Rustic",
    "Retro & Vintage",
    "Watercolor Splashes & Textures",
    "Polka Dots, Stripes & Basics",
    "Faith & Inspirational",
    "Sports & Hobbies",
  ]);

  var LAYOUT_OPTIONS = [
    "Tossed / Scattered (motifs at varied angles)",
    "Regular Grid Repeat (neat rows and columns)",
    "Half-Drop Repeat (offset rows)",
    "Ogee / Diamond Repeat",
    "Stripe / Banded Repeat",
  ];
  var SCALE_OPTIONS = ["Small & Dense", "Medium / Balanced", "Large & Airy"];
  var ART_STYLE_OPTIONS = ["Watercolor", "Flat Vector / Bold Graphic", "Hand-Drawn Doodle", "Line Art / Minimalist", "Vintage / Retro", "Realistic / Painterly", "Textured / Gouache"];
  var COLOR_PALETTE_OPTIONS = ["Soft Pastels", "Bold Primary Colors", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold", "Muted Boho Neutrals", "Bright & Saturated"];
  var BACKGROUND_OPTIONS = ["Colored / Filled Background", "White Background", "Transparent Background (motifs only, for overlays)"];

  var LOCKED_SUFFIX =
    " Designed as a PERFECTLY SEAMLESS repeating tile: the pattern must continue flawlessly across all four edges so it can be tiled infinitely with no visible seams, breaks, or hard lines where the tiles meet. The motifs running off the left edge must continue exactly onto the right edge, and those running off the top must continue exactly onto the bottom, with no motif abruptly cut off or clipped at any edge." +
    " Fill the entire square canvas edge to edge — absolutely no border, frame, margin, drop shadow, or empty gutter around the outside." +
    " Even, all-over coverage with no obvious single focal point. High resolution, 300 DPI, crisp and clean, commercial print-ready.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "seamless-pattern",
    label: "Seamless Pattern Generator",
    icon: "palette",
    description: "A perfectly tileable repeating pattern for digital paper, wrapping paper, fabric, or backgrounds — repeats infinitely with no visible seam.",
    fieldGroupTitle: "Customize Your Seamless Pattern",

    presets: [
      { name: "Watercolor Florals", description: "Soft tossed watercolor blooms, pastel, airy.",
        apply: { patternUse: "Fabric / Textile (Spoonflower, etc.)", patternTheme: "Florals & Botanicals", layout: "Tossed / Scattered (motifs at varied angles)", scale: "Large & Airy", artStyle: "Watercolor", colorPalette: "Soft Pastels", background: "White Background" } },
      { name: "Christmas Gift Wrap", description: "Dense festive icons, bold, colored ground.",
        apply: { patternUse: "Wrapping Paper / Gift Wrap", patternTheme: "Christmas & Winter", layout: "Half-Drop Repeat (offset rows)", scale: "Small & Dense", artStyle: "Flat Vector / Bold Graphic", colorPalette: "Bold Primary Colors", background: "Colored / Filled Background" } },
      { name: "Boho Digital Paper", description: "Muted neutral doodles, balanced grid.",
        apply: { patternUse: "Digital / Scrapbook Paper", patternTheme: "Boho / Aesthetic (Cottagecore, Coquette, Y2K)", layout: "Regular Grid Repeat (neat rows and columns)", scale: "Medium / Balanced", artStyle: "Hand-Drawn Doodle", colorPalette: "Muted Boho Neutrals", background: "Colored / Filled Background" } },
    ],

    fields: [
      { name: "patternUse", label: "What It's For", options: PATTERN_USE_OPTIONS, defaultValue: PATTERN_USE_OPTIONS[0] },
      { name: "patternTheme", label: "Theme / Genre", options: PATTERN_THEME_OPTIONS, defaultValue: PATTERN_THEME_OPTIONS[0] },
      { name: "subjectDescription", label: "What Should It Show?", isFreeText: true, defaultValue: "", placeholder: "e.g. tiny daisies, eucalyptus sprigs, and small dots" },
      { name: "layout", label: "Repeat Layout", options: LAYOUT_OPTIONS, defaultValue: LAYOUT_OPTIONS[0] },
      { name: "scale", label: "Motif Scale", options: SCALE_OPTIONS, defaultValue: SCALE_OPTIONS[1] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var hasSubject = !!valueMap.subjectDescription;
      var themeClause = " in the " + valueMap.patternTheme + " theme";
      var contentClause = hasSubject
        ? "an all-over repeating pattern of " + valueMap.subjectDescription + themeClause
        : "an all-over repeating pattern" + themeClause;

      var scaleWord = valueMap.scale || "";
      var scaleClause;
      if (/Small/i.test(scaleWord)) {
        scaleClause = "small, densely packed motifs with lots of repetition across the tile";
      } else if (/Large/i.test(scaleWord)) {
        scaleClause = "larger, more spacious motifs with airy breathing room between them";
      } else {
        scaleClause = "balanced, medium-scale motifs evenly distributed across the tile";
      }

      var layoutName = (valueMap.layout || "").replace(/\s*\(.*\)\s*$/, "");
      var layoutClause = "arranged in a " + layoutName.toLowerCase() + " layout";

      return {
        contentClause: contentClause,
        scaleClause: scaleClause,
        layoutClause: layoutClause,
      };
    },

    basePromptTemplate:
      "A seamless tileable pattern intended for {patternUse}: {contentClause}, {layoutClause}, with {scaleClause}. {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A seamless tileable pattern with extra charm, intended for {patternUse}: {contentClause}, {layoutClause}, with {scaleClause}. {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A bold, standout seamless tileable pattern for {patternUse}: {contentClause}, {layoutClause}, with {scaleClause}. {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}." +
      LOCKED_SUFFIX,

    charmPool: [
      "a few tiny accent motifs (dots, sparkles, or leaves) tucked into the gaps to fill negative space",
      "a subtle secondary layer of smaller motifs behind the main ones for depth",
      "a soft hand-painted texture across the whole tile",
    ],
    dynamicPool: [
      "richer, more saturated colors and higher contrast between the motifs and the ground",
      "a slightly more graphic, high-impact treatment of every motif",
      "a bolder mix of motif sizes for a more dynamic all-over rhythm",
    ],
  });
})();
