/**
 * The AI Creator's Graphics Haus — Luxury Vanity Plate Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * The GLAM/FUN plate: bling, crystals, crowns, chrome, plus a masculine
 * range (blacked-out, carbon fiber, skulls, chains). Its realistic
 * counterpart is the separate Custom License Plate generator, so the "fun
 * look" and the "real look" each stay purpose-built. Option depth ported
 * from Content Haus's own vanity-plate catalogs (which the shop already
 * loved), wrapped in Graphics Haus's standalone output + 4-variation
 * system + Look Lock.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  // Spans glam/feminine AND rugged/masculine across every list, so the
  // feature never reads as one-note.
  var PLATE_TYPE_OPTIONS = [
    "iced diamond bling", "glam rhinestone", "luxe crystal", "pearl elegance", "rose gold sparkle",
    "holographic shimmer", "deluxe pink bling", "sapphire glam", "emerald luxe", "onyx bling",
    "opal shimmer", "frosted platinum", "amethyst glam", "ruby red bling", "citrine gold sparkle",
    "turquoise glam", "blacked-out matte", "gunmetal bling", "carbon fiber bling",
    "chrome skull bling", "iced-out chain style",
  ];
  var BASE_STYLE_OPTIONS = [
    "oem bling plate", "diamond-studded frame", "crystal-encrusted frame", "chrome luxe frame",
    "rose gold frame", "gold-plated frame", "pink glam frame", "black diamond frame",
    "platinum frame", "fully iced frame", "sapphire frame", "emerald frame", "onyx frame",
    "opal frame", "two-tone frame", "matte black frame", "engraved vintage frame",
    "brushed titanium frame", "skull-accented frame", "chain-link frame", "carbon fiber frame",
    "gunmetal frame",
  ];
  var LETTER_STYLE_OPTIONS = [
    "tall condensed embossed", "raised block embossed", "deep luxe embossed", "chrome embossed",
    "matte black embossed", "elegant script embossed", "retro block embossed", "bold sans embossed",
    "flowing cursive embossed", "stencil-cut embossed", "engraved serif", "3d raised lettering",
    "gothic blackletter embossed", "military stencil embossed", "biker script embossed",
  ];
  var LETTER_COLOR_OPTIONS = [
    "black gloss", "chrome", "silver", "gold", "rose gold", "chrome pink", "white", "matte black",
    "copper", "gold champagne", "holographic", "chrome red", "navy blue", "emerald green",
    "gunmetal gray", "blood red",
  ];
  // Shared list for Top Accent and Bottom Accent.
  var ACCENT_OPTIONS = [
    "none", "gem crown", "princess tiara", "queen's crown", "rhinestone bow", "butterfly charm",
    "angel wings", "sparkling heart", "classic tiara", "starburst shimmer", "glowing halo",
    "flower crown", "laurel wreath", "lightning bolt", "faith cross", "paw print",
    "shooting star", "infinity charm", "skull accent", "chain link accent", "flame accent",
    "dagger accent", "wolf head accent",
  ];
  var FINISH_OPTIONS = [
    "ivory enamel", "white enamel", "pearl white sheen", "satin white", "glossy white",
    "metallic silver", "glossy black", "rose gold metallic", "matte black",
    "champagne gold metallic", "copper metallic", "deep red enamel", "navy enamel", "mirror chrome",
    "gunmetal gray", "champagne pearl", "carbon fiber finish", "brushed steel finish",
    "black chrome finish",
  ];
  var STATE_REGION_GROUPS = [
    { label: "General", options: ["generic (no state name)"] },
    { label: "US States & DC", options: [
      "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
      "delaware", "district of columbia", "florida", "georgia", "hawaii", "idaho", "illinois",
      "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts",
      "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada",
      "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota",
      "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
      "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington",
      "west virginia", "wisconsin", "wyoming",
    ] },
    { label: "US Territories", options: ["puerto rico", "guam", "us virgin islands", "american samoa", "northern mariana islands"] },
    { label: "International", options: ["canada", "england", "scotland", "wales", "northern ireland", "mexico", "australia", "jamaica", "india"] },
  ];

  var LOCKED_SUFFIX = " Rendered as a high-shine luxury novelty vanity plate graphic, correct wide-rectangle plate proportions, sparkling embellishments crisp and legible, isolated on a plain or transparent background, high resolution, no watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "luxury-vanity-plate",
    label: "Luxury Vanity Plate Generator",
    icon: "gift",
    description: "A glam novelty vanity plate — bling, crystals, chrome, crowns (plus a blacked-out/carbon-fiber/skull range). For a true-to-life DMV plate, use the Custom License Plate generator instead.",
    fieldGroupTitle: "Customize Your Vanity Plate",

    presets: [
      { name: "Iced Diamond Bling", description: "Diamond-studded, chrome lettering, gem crown, mirror chrome.",
        apply: { plateType: "iced diamond bling", baseStyle: "diamond-studded frame", letterStyle: "chrome embossed", plateTextColor: "chrome", topAccent: "gem crown", finish: "mirror chrome" } },
      { name: "Rose Gold Glam", description: "Rose gold frame, elegant script, princess tiara.",
        apply: { plateType: "rose gold sparkle", baseStyle: "rose gold frame", letterStyle: "elegant script embossed", plateTextColor: "rose gold", topAccent: "princess tiara", finish: "rose gold metallic" } },
      { name: "Blacked-Out Edge", description: "Matte black, carbon fiber, gothic lettering, skull accent.",
        apply: { plateType: "blacked-out matte", baseStyle: "carbon fiber frame", letterStyle: "gothic blackletter embossed", plateTextColor: "gunmetal gray", topAccent: "skull accent", finish: "carbon fiber finish" } },
    ],

    fields: [
      { name: "plateText", label: "Plate Text", isFreeText: true, defaultValue: "GLAM GIRL", placeholder: "e.g. QUEEN B, BLESSED, RIDE OR DIE" },
      { name: "plateType", label: "Plate Type", options: PLATE_TYPE_OPTIONS, defaultValue: PLATE_TYPE_OPTIONS[0] },
      { name: "baseStyle", label: "Frame / Base Style", options: BASE_STYLE_OPTIONS, defaultValue: BASE_STYLE_OPTIONS[1] },
      { name: "letterStyle", label: "Letter Style", options: LETTER_STYLE_OPTIONS, defaultValue: LETTER_STYLE_OPTIONS[3] },
      { name: "plateTextColor", label: "Plate Text Color", options: LETTER_COLOR_OPTIONS, defaultValue: LETTER_COLOR_OPTIONS[1], aesthetic: "palette" },
      { name: "topAccent", label: "Top Accent", options: ACCENT_OPTIONS, defaultValue: "gem crown", aesthetic: "motifs" },
      { name: "bottomAccent", label: "Bottom Accent", options: ACCENT_OPTIONS, defaultValue: "none" },
      { name: "finish", label: "Plate Finish", options: FINISH_OPTIONS, defaultValue: FINISH_OPTIONS[13], aesthetic: "texture" },
      { name: "stateRegion", label: "State / Region (optional)", optionGroups: STATE_REGION_GROUPS, defaultValue: "generic (no state name)" },
    ],

    computeExtraTokens: function (valueMap) {
      var region = valueMap.stateRegion || "";
      function art(w) { return (/^[aeiou]/i.test(w || "") ? "an " : "a ") + (w || ""); }
      return {
        plateTypeArt: art(valueMap.plateType),
        baseStyleArt: art(valueMap.baseStyle),
        topAccentClause: (valueMap.topAccent && valueMap.topAccent !== "none") ? ", a " + valueMap.topAccent + " embellishment across the top" : "",
        bottomAccentClause: (valueMap.bottomAccent && valueMap.bottomAccent !== "none") ? ", a " + valueMap.bottomAccent + " embellishment along the bottom" : "",
        stateClause: (region && region.indexOf("generic") !== 0) ? " with \"" + region + "\" across the top" : "",
      };
    },

    basePromptTemplate:
      "A glamorous luxury vanity license plate reading \"{plateText}\"{stateClause}, in {plateTypeArt} style set in {baseStyleArt}. {letterStyle} lettering in {plateTextColor}, {finish} finish{topAccentClause}{bottomAccentClause}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle vanity-plate proportions, text centered and dominant, isolated cleanly against the background." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A dazzling luxury vanity license plate reading \"{plateText}\"{stateClause}, styled as {plateTypeArt} plate in {baseStyleArt}, with {letterStyle} lettering in {plateTextColor}, {finish} finish{topAccentClause}{bottomAccentClause}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle vanity-plate proportions, with extra sparkle and shine catching the light." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A show-stopping luxury vanity license plate reading \"{plateText}\"{stateClause}, in {plateTypeArt} style set in {baseStyleArt}, {letterStyle} lettering in {plateTextColor}, {finish} finish{topAccentClause}{bottomAccentClause}{holidayClause}.\n\n" +
      "Layout: standard wide-rectangle vanity-plate proportions, with bolder contrast and a dimensional, jewel-like presence." +
      LOCKED_SUFFIX,

    charmPool: [
      "extra tiny sparkle glints scattered across the embellishments",
      "a delicate rhinestone shimmer along the frame edge",
      "a soft luxe reflection across the plate surface",
    ],
    dynamicPool: [
      "bolder jewel-tone contrast between the lettering and the plate",
      "a slight dimensional angle for a more three-dimensional bling look",
      "a brighter, more brilliant sparkle on every embellishment",
    ],
  });
})();
