/**
 * The AI Creator's Project Haus — Retro Muse Wall Art Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * One printable piece, not a multi-page set, so this stays on the
 * 3-variation system rather than Page Bundles — the same reasoning
 * Coloring Page/Planner Pages/Kids Worksheet already follow.
 *
 * The signature "retro mid-century flat vector illustration" look is
 * baked into the locked template rather than exposed as an Art Style
 * field — that IS this generator's whole identity ("Retro Muse"),
 * mirroring how Coloring Page locks "line art, no color" without a
 * field for it either. Occasion/Theme and Main Object stay pure
 * free-text (genuinely open-ended, same call already made for Coloring
 * Page's Main Animal Character and Junk Journal's Theme/Focus); Color
 * Palette and Background Style get the dropdown-or-type-your-own
 * hybrid, fixing the reference tool's all-typed-in fields.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var COLOR_PALETTE_OPTIONS = ["Bold Rockstar Colors", "Pastel Dreamy Tones", "Warm Autumn Palette", "Cool Blues & Silvers", "Black & Gold Glam", "Bright Pop Colors", "Blush & Sage", "Classic Red & Green"];
  var BACKGROUND_OPTIONS = ["Dark with Studio Lighting", "Soft Gradient", "Solid Pastel", "Textured Paper", "Bokeh Lights", "Minimal White"];

  var LOCKED_STYLE_SUFFIX = "\n\nHigh resolution, cohesive composition, professional illustration quality — ready to print as wall art.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "retro-wall-art",
    label: "Retro Muse Wall Art Generator",
    icon: "palette",
    description: "A retro-styled printable wall art piece — pick a theme, an object or scene, and an optional message, and it works even if you leave everything at default.",
    fieldGroupTitle: "Customize Your Wall Art",

    fields: [
      { name: "theme", label: "Occasion or Theme", isFreeText: true, defaultValue: "birthday", placeholder: "e.g. Christmas, Valentine's, Rock n Roll, Birthday, Coffee Lover..." },
      { name: "mainObject", label: "Main Object or Scene", isFreeText: true, defaultValue: "a bouquet of flowers", placeholder: "e.g. champagne glasses, bows, cupcake" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[1], aesthetic: "palette" },
      { name: "textOrMessage", label: "Text or Message (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. \"Love & Bubbles\", \"Be Kind Always\", \"Born to Rock\"" },
      { name: "background", label: "Background Style", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[1], aesthetic: "texture" },
    ],

    // Wraps the optional Text/Message field into a natural clause instead
    // of a fixed "with text X" phrase that would look broken once it
    // resolves empty — same pattern as Planner Pages' holidayClause.
    computeExtraTokens: function (valueMap) {
      return { textClause: valueMap.textOrMessage ? ", with the handwritten phrase \"" + valueMap.textOrMessage + "\"" : "" };
    },

    basePromptTemplate:
      "A retro {theme} illustration featuring {mainObject}{textClause}, rendered in a {colorPalette} color palette against a {background} backdrop{holidayClause}.\n\n" +
      "Style: mid-century modern flat vector illustration, minimalist vintage aesthetic with soft muted tones, a wavy or scalloped border detail, and a subtle hand-drawn texture throughout." +
      LOCKED_STYLE_SUFFIX,

    charmPromptTemplate:
      "Create a retro mid-century {theme} design featuring {mainObject}{textClause}, rendered in {colorPalette} hues against a {background} backdrop{holidayClause}.\n\n" +
      "Style: minimal flat vector illustration with soft vintage tones and visible brushstroke texture, balanced composition, professional finish." +
      LOCKED_STYLE_SUFFIX,

    dynamicPromptTemplate:
      "A vintage-inspired {theme} art print showcasing {mainObject}{textClause}, in a {colorPalette} color palette on a {background} backdrop{holidayClause}.\n\n" +
      "Style: mid-century modern minimalist illustration with a subtle textured finish, soft pastel palette, professional composition." +
      LOCKED_STYLE_SUFFIX,

    charmPool: [
      "a small retro starburst accent in one corner",
      "a subtle scalloped-edge frame around the whole piece",
      "one small vintage-style ornament tucked near the text",
      "a soft radial glow behind the main object",
    ],
    dynamicPool: [
      "a bit more dynamic diagonal composition",
      "bolder color contrast for extra visual punch",
      "a slightly more playful, energetic arrangement of elements",
    ],
  });
})();
