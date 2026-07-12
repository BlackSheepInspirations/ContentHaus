/**
 * The AI Creator's Graphics Haus — Retro Object Icon Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Consolidates the reference list's several single-nostalgic-object
 * generators (Retro Stamps, Soda Can, It's My Jam, Vintage Thrifting,
 * Crystal Gem, Textured Popsicle) into one Object Type field — same
 * mechanic every time (one retro-styled object icon), just a different
 * object. "Trendy Stripes" folds in as an optional Decorative Pattern
 * accent rather than its own generator, since it's a pattern treatment
 * that can layer onto any of these objects rather than an object itself.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var OBJECT_TYPE_OPTIONS = ["Postage Stamp", "Soda Can", "Vinyl Record", "Cassette Tape", "Vintage Clothing Item", "Gemstone / Crystal", "Popsicle", "Retro Radio", "Roller Skate", "Camera"];
  var RETRO_ERA_OPTIONS = ["70s Retro", "80s Neon", "90s Y2K", "Mid-Century", "Vintage Americana"];
  var COLOR_PALETTE_OPTIONS = ["Warm Sunset (orange, mustard, brown)", "Neon Pastels", "Classic Diner (red, cream, chrome)", "Muted Earth Tones", "Bright Pop Colors"];
  var TEXTURE_FINISH_OPTIONS = ["Glossy", "Grainy / Halftone Print", "Textured / Fuzzy", "Sticker-Style with White Border"];
  var BACKGROUND_OPTIONS = ["Transparent (isolated for cutout)", "White Background", "Retro Sunburst Background"];

  var LOCKED_SUFFIX = " Single isolated object icon, crisp clean edges, no clutter, commercial print-and-sticker ready, high resolution, no text or watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "retro-object-icon",
    label: "Retro Object Icon Generator",
    icon: "gift",
    description: "A single nostalgic object icon — stamps, soda cans, vinyl records, gems, and more — in a consistent retro style.",
    fieldGroupTitle: "Customize Your Retro Icon",

    fields: [
      { name: "objectType", label: "Object Type", options: OBJECT_TYPE_OPTIONS, defaultValue: OBJECT_TYPE_OPTIONS[0] },
      { name: "retroEra", label: "Retro Era", options: RETRO_ERA_OPTIONS, defaultValue: RETRO_ERA_OPTIONS[0], aesthetic: "mood" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "textureFinish", label: "Texture / Finish", options: TEXTURE_FINISH_OPTIONS, defaultValue: TEXTURE_FINISH_OPTIONS[0], aesthetic: "texture" },
      { name: "decorativePattern", label: "Decorative Pattern (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. bold stripes, polka dots, checkerboard" },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        patternClause: valueMap.decorativePattern ? ", accented with a " + valueMap.decorativePattern + " pattern" : "",
      };
    },

    basePromptTemplate:
      "A {retroEra} styled {objectType} icon{patternClause}. {colorPalette} color palette, {textureFinish} finish, {background}{holidayClause}.\n\n" +
      "Layout: one single object centered and filling most of the frame, treated as a standalone collectible icon." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a fun {retroEra} {objectType} icon{patternClause}, with a {colorPalette} color palette and {textureFinish} finish, {background}{holidayClause}.\n\n" +
      "Layout: one single object centered and filling most of the frame, with extra retro charm and personality." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an eye-catching {retroEra} {objectType} icon{patternClause}, in a {colorPalette} color palette with a {textureFinish} finish, {background}{holidayClause}.\n\n" +
      "Layout: one single object centered and filling most of the frame, with bolder visual energy." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small retro sparkle or shine accent",
      "a subtle drop shadow for a collectible-sticker feel",
      "one tiny extra decorative detail matching the era",
    ],
    dynamicPool: [
      "bolder color contrast for extra visual pop",
      "a slight dynamic tilt to the object",
      "small motion or shine lines suggesting energy",
    ],
  });
})();
