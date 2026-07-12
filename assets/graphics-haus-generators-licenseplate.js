/**
 * The AI Creator's Graphics Haus — License Plate Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Kept as its own dedicated generator rather than folded into Retro
 * Object Icon, per explicit request — a novelty license plate has its
 * own real-world design conventions (plate proportions, state-style
 * lettering, corner motifs, border framing) that don't map cleanly onto
 * the generic "one nostalgic object" mechanic the other generator
 * covers. No reference tool for this one — fields below are an original
 * design following this codebase's own dropdown-plus-freeform pattern.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var STATE_STYLE_OPTIONS = ["Classic Americana", "European (long/narrow)", "Colorful Novelty / Vanity", "Retro 70s / 80s State Plate", "Beach / Coastal State Plate"];
  var COLOR_PALETTE_OPTIONS = ["Classic Blue & White", "Sunny Yellow & Black", "Coastal Teal & Sand", "Bold Red & Cream", "Pastel Pink & Gold", "Forest Green & Cream"];
  var FINISH_OPTIONS = ["Embossed Metal", "Flat Matte Print", "Glossy Sticker Finish"];
  var BORDER_STYLE_OPTIONS = ["Classic Bordered Frame", "No Border / Full Bleed", "Decorative Scalloped Border"];

  var LOCKED_SUFFIX = " Rendered as a realistic novelty license plate graphic, correct wide-rectangle plate proportions, legible bold plate-style lettering, isolated on a plain or transparent background, high resolution, no watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "license-plate",
    label: "License Plate Generator",
    icon: "car",
    description: "A custom novelty license plate graphic — your text, your state style, your colors — with its own dedicated set of controls.",
    fieldGroupTitle: "Customize Your License Plate",

    fields: [
      { name: "plateText", label: "Plate Text", isFreeText: true, defaultValue: "SUNNY DAYS", placeholder: "e.g. YEE HAW, BOOKWORM, EST 2024" },
      { name: "stateStyle", label: "State / Plate Style", options: STATE_STYLE_OPTIONS, defaultValue: STATE_STYLE_OPTIONS[0] },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "decorativeMotif", label: "Decorative Corner Motif", isFreeText: true, defaultValue: "a small sun", placeholder: "e.g. a palm tree, a heart, a mountain range", aesthetic: "motifs" },
      { name: "finish", label: "Finish", options: FINISH_OPTIONS, defaultValue: FINISH_OPTIONS[0], aesthetic: "texture" },
      { name: "borderStyle", label: "Border Style", options: BORDER_STYLE_OPTIONS, defaultValue: BORDER_STYLE_OPTIONS[0] },
    ],

    basePromptTemplate:
      "A custom novelty license plate reading \"{plateText}\" in a {stateStyle} plate design. {colorPalette} color palette, featuring a small {decorativeMotif} accent in one corner, {finish} finish, with a {borderStyle}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle license-plate proportions, text centered and dominant, isolated cleanly against the background." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a fun novelty license plate reading \"{plateText}\", styled as a {stateStyle} plate with a {colorPalette} color palette, a small {decorativeMotif} accent tucked in one corner, {finish} finish, and a {borderStyle}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle license-plate proportions, with extra decorative charm around the edges." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an eye-catching novelty license plate reading \"{plateText}\", in a {stateStyle} plate design with a {colorPalette} color palette, a {decorativeMotif} accent, {finish} finish, and a {borderStyle}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle license-plate proportions, with bolder color contrast and visual presence." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small embossed shine highlight along the top edge",
      "a subtle decorative flourish echoing the corner motif",
      "a tiny registration-sticker-style detail in one corner",
    ],
    dynamicPool: [
      "a slight dynamic angle to the plate for a more dimensional look",
      "bolder color contrast between the text and background",
      "a subtle glossy reflection across the surface",
    ],
  });
})();
