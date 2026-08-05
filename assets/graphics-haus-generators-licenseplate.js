/**
 * The AI Creator's Graphics Haus — Custom License Plate Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * The REALISTIC plate: a genuine DMV-style custom plate (real state/region
 * name, standard embossed lettering, reflective finishes). Its glam
 * counterpart — bling, crystals, crowns, skulls — lives in the separate
 * Luxury Vanity Plate generator, so the "real look" and the "fun look"
 * each stay purpose-built instead of one muddy mixed field set. Option
 * depth ported/adapted from Content Haus's own vanity-plate catalogs.
 * Keeps Graphics Haus's standalone output (correct plate proportions,
 * isolated background, legibility) + 4-variation system + Look Lock.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var PLATE_STYLE_OPTIONS = [
    "Classic Americana", "European (long / narrow)", "Modern Reflective", "Vintage / Retro State",
    "Scenic / Nature State", "Specialty / Novelty", "Blank Custom Base",
  ];
  var LETTER_STYLE_OPTIONS = [
    "standard embossed block", "tall condensed block", "flat printed block",
    "stencil", "serif engraved", "reflective print",
  ];
  var PLATE_TEXT_COLOR_OPTIONS = [
    "black", "dark blue", "navy", "dark green", "red", "maroon", "gold", "gunmetal gray",
  ];
  var FINISH_OPTIONS = ["embossed metal", "flat matte print", "glossy laminate", "reflective / retroreflective"];
  var BORDER_STYLE_OPTIONS = ["standard bordered frame", "no border / full bleed", "state-name top banner", "slogan bottom banner"];

  // Flat (not grouped — the narrow-generator engine renders flat lists
  // only) list of ~65 states/territories/countries. "generic (no state
  // name)" first so a plain plate needs no region.
  var STATE_REGION_OPTIONS = [
    "generic (no state name)",
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
    "delaware", "district of columbia", "florida", "georgia", "hawaii", "idaho", "illinois",
    "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts",
    "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada",
    "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota",
    "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
    "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington",
    "west virginia", "wisconsin", "wyoming",
    "puerto rico", "guam", "us virgin islands", "american samoa", "northern mariana islands",
    "canada", "england", "scotland", "wales", "northern ireland", "mexico", "australia",
    "jamaica", "india",
  ];

  var LOCKED_SUFFIX = " Rendered as a realistic custom license plate graphic, correct wide-rectangle plate proportions, legible standard plate lettering, isolated on a plain or transparent background, high resolution, no watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "license-plate",
    label: "Custom License Plate Generator",
    icon: "car",
    description: "A realistic DMV-style custom plate — your text, a real state/region, standard lettering and finish. For bling, crowns, and glam, use the Luxury Vanity Plate generator instead.",
    fieldGroupTitle: "Customize Your License Plate",

    fields: [
      { name: "plateText", label: "Plate Text", isFreeText: true, defaultValue: "SUNNY DAYS", placeholder: "e.g. YEE HAW, BOOKWORM, EST 2024" },
      { name: "stateRegion", label: "State / Region", options: STATE_REGION_OPTIONS, defaultValue: STATE_REGION_OPTIONS[0] },
      { name: "plateStyle", label: "Plate Style", options: PLATE_STYLE_OPTIONS, defaultValue: PLATE_STYLE_OPTIONS[0] },
      { name: "letterStyle", label: "Letter Style", options: LETTER_STYLE_OPTIONS, defaultValue: LETTER_STYLE_OPTIONS[0] },
      { name: "plateTextColor", label: "Plate Text Color", options: PLATE_TEXT_COLOR_OPTIONS, defaultValue: PLATE_TEXT_COLOR_OPTIONS[0], aesthetic: "palette" },
      { name: "finish", label: "Finish", options: FINISH_OPTIONS, defaultValue: FINISH_OPTIONS[0], aesthetic: "texture" },
      { name: "borderStyle", label: "Border Style", options: BORDER_STYLE_OPTIONS, defaultValue: BORDER_STYLE_OPTIONS[0] },
      { name: "decorativeMotif", label: "Corner Motif (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. a palm tree, a small star, a mountain range", aesthetic: "motifs" },
    ],

    computeExtraTokens: function (valueMap) {
      var region = valueMap.stateRegion || "";
      return {
        stateClause: (region && region.indexOf("generic") !== 0)
          ? ", with \"" + region + "\" as the state/region name across the top" : "",
        motifClause: valueMap.decorativeMotif ? ", and a small " + valueMap.decorativeMotif + " accent in one corner" : "",
      };
    },

    basePromptTemplate:
      "A realistic custom license plate reading \"{plateText}\"{stateClause}, in a {plateStyle} plate design. {letterStyle} lettering in {plateTextColor}, {finish} finish, with a {borderStyle}{motifClause}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle license-plate proportions, text centered and dominant, isolated cleanly against the background." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A clean, realistic custom license plate reading \"{plateText}\"{stateClause}, styled as a {plateStyle} plate with {letterStyle} lettering in {plateTextColor}, {finish} finish, and a {borderStyle}{motifClause}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle license-plate proportions, with crisp, true-to-life plate detailing." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A sharp, realistic custom license plate reading \"{plateText}\"{stateClause}, in a {plateStyle} design with {letterStyle} lettering in {plateTextColor}, {finish} finish, and a {borderStyle}{motifClause}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle license-plate proportions, with bolder contrast and a crisp, dimensional look." +
      LOCKED_SUFFIX,

    charmPool: [
      "a subtle embossed shine highlight along the top edge",
      "a small realistic registration-sticker detail in one corner",
      "faint true-to-life surface texture on the metal",
    ],
    dynamicPool: [
      "a slight dimensional angle to the plate",
      "bolder contrast between the lettering and the plate background",
      "a subtle realistic reflection across the surface",
    ],
  });
})();
