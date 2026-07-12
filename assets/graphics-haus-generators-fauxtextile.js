/**
 * The AI Creator's Graphics Haus — Faux Textile Character / Object Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Consolidates the reference list's several faux-fabric-look generators
 * (Faux Yarn x2, Cozy Knit, Patchwork Stitch, Holiday Patchwork Row,
 * Yarn + Coquette Bow, Pearl Patch) into one generator: the shared
 * mechanic across all of them is a single subject — character or plain
 * object, either one — rendered to look like a handmade textile piece.
 * Technique (yarn/knit/patchwork/felt/quilted) and Embellishments
 * (bows, pearls, embroidery — the detail that gave several reference
 * tools their own name) are both their own fields rather than baked
 * into separate generators, so any combination is reachable.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var TEXTILE_TECHNIQUE_OPTIONS = ["Faux Yarn / Crochet", "Cozy Knit", "Patchwork Stitch", "Felt Applique", "Quilted Fabric"];
  var COLOR_PALETTE_OPTIONS = ["Soft Pastels", "Warm Cream & Tan", "Classic Red & Green", "Blush & Cream", "Muted Earth Tones", "Bright & Cheerful"];
  var SEASONAL_THEME_OPTIONS = ["Everyday", "Holiday", "Valentine's Day", "Fall", "Easter"];
  var BACKGROUND_FINISH_OPTIONS = ["Transparent (isolated for cutout)", "Soft Fabric-Texture Background", "White Background"];

  var LOCKED_SUFFIX = " Rendered to look like a real handmade textile object — visible stitching, fiber texture, and soft dimensional puffiness, with soft even studio lighting, isolated cleanly, high resolution, no text or watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "faux-textile",
    label: "Faux Textile Character & Object Generator",
    icon: "shirt",
    description: "A character or object rendered in the cozy handmade yarn, knit, or patchwork look — without the handmade time.",
    fieldGroupTitle: "Customize Your Textile Piece",

    fields: [
      { name: "subject", label: "Character or Object", isFreeText: true, defaultValue: "a small bunny", placeholder: "e.g. a bunny, a heart, a Christmas tree, a bow" },
      { name: "textileTechnique", label: "Textile Technique", options: TEXTILE_TECHNIQUE_OPTIONS, defaultValue: TEXTILE_TECHNIQUE_OPTIONS[0], aesthetic: "texture" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "embellishments", label: "Embellishments", isFreeText: true, defaultValue: "a small embroidered detail", placeholder: "e.g. pearl beading, a coquette bow, embroidered stitching", aesthetic: "motifs" },
      { name: "seasonalTheme", label: "Seasonal Theme", options: SEASONAL_THEME_OPTIONS, defaultValue: SEASONAL_THEME_OPTIONS[0] },
      { name: "backgroundFinish", label: "Background", options: BACKGROUND_FINISH_OPTIONS, defaultValue: BACKGROUND_FINISH_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        seasonalClause: (valueMap.seasonalTheme && valueMap.seasonalTheme !== "Everyday") ? ", styled for a " + valueMap.seasonalTheme + " theme" : "",
      };
    },

    basePromptTemplate:
      "A faux-{textileTechnique} rendering of {subject}, styled with {embellishments}{seasonalClause}. {colorPalette} color palette, {backgroundFinish}{holidayClause}.\n\n" +
      "Layout: the subject filling most of the frame, treated as a soft handmade textile object rather than a flat illustration." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a cozy faux-{textileTechnique} piece of {subject}, decorated with {embellishments}{seasonalClause}, in a {colorPalette} color palette, {backgroundFinish}{holidayClause}.\n\n" +
      "Layout: the subject filling most of the frame, with extra tactile charm and warmth." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an eye-catching faux-{textileTechnique} version of {subject}, featuring {embellishments}{seasonalClause}, in a {colorPalette} color palette, {backgroundFinish}{holidayClause}.\n\n" +
      "Layout: the subject filling most of the frame, with richer dimension and visual depth." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small embroidered detail tucked in one corner",
      "a subtle fuzzy halo of loose fiber texture",
      "one tiny extra decorative stitch pattern",
    ],
    dynamicPool: [
      "a slightly puffier, more three-dimensional look",
      "richer visible texture and depth",
      "a bit more playful asymmetry in the shape",
    ],
  });
})();
