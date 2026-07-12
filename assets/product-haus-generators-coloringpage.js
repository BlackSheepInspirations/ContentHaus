/**
 * The AI Creator's Product Haus — Coloring Page Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * First narrow generator built against the pattern: a large locked base
 * (line-art/no-color/no-shading rendering directives), plus a handful of
 * small visible fields, most defaulted, so leaving everything untouched
 * still produces a usable coloring page. Setting is deliberately
 * evergreen-only — seasonal/holiday scenes go through the shared Holiday
 * field ({holidayClause} below) instead of duplicating holiday options
 * inside this generator's own Setting list.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var CHARACTER_GROUP_OPTIONS = ["Solo (baby/cute style)", "Two Friends", "Parent + Baby", "Family of Three"];

  var POSE_OPTIONS = [
    "Standing upright", "Sitting", "Jumping", "Running", "Flying", "Skipping", "Twirling", "Dancing", "Waving",
    "Hugging another character", "Holding hands", "Carrying a basket", "Holding balloons", "Reading a book",
    "Splashing in a puddle", "Climbing a tree", "Sleeping peacefully", "Playing with a butterfly",
  ];

  var SETTING_OPTIONS = [
    "Spring garden", "Sunny meadow", "Rainy day scene", "Woodland clearing", "Mushroom forest", "Blossom tree setting",
    "Wildflower field", "Lily pad pond", "Forest path", "Pumpkin patch", "Snowy woodland", "Minimal sky background",
    "Autumn harvest field", "Summer beach scene",
  ];

  var SKY_OPTIONS = ["Butterflies", "Smiling Sun", "Clouds", "Hearts", "Birds", "Sparkles", "None"];

  var GROUND_OPTIONS = [
    "Flowers and grass", "Grass and rocks", "Fallen leaves", "Sand and shells", "Snow and pinecones",
    "Wildflowers", "Mushrooms and toadstools", "None",
  ];

  var PAGE_FORMAT_OPTIONS = ["Standard vertical 8.5x11", "Centered square layout", "Balanced symmetrical layout"];

  ProductHaus.generatorEngine.registerGenerator({
    id: "coloring-page",
    label: "Cute Animals Coloring Page",
    icon: "heart",
    description: "A printable black-and-white line-art coloring page starring one small character — works even if you don't touch a single field below.",
    fieldGroupTitle: "Customize Your Coloring Page",

    fields: [
      { name: "mainCharacter", label: "Main Animal Character", isFreeText: true, defaultValue: "bunny", placeholder: "e.g. bunny, kitten, puppy — leave blank for a bunny" },
      { name: "characterGroup", label: "Character Group", options: CHARACTER_GROUP_OPTIONS, defaultValue: CHARACTER_GROUP_OPTIONS[0] },
      { name: "pose", label: "Pose / Action", options: POSE_OPTIONS, defaultValue: POSE_OPTIONS[0] },
      { name: "setting", label: "Setting", options: SETTING_OPTIONS, defaultValue: SETTING_OPTIONS[0] },
      { name: "skyElements", label: "Sky Details", options: SKY_OPTIONS, defaultValue: SKY_OPTIONS[0] },
      { name: "groundElements", label: "Ground Details", options: GROUND_OPTIONS, defaultValue: GROUND_OPTIONS[0] },
      { name: "pageFormat", label: "Page Format", options: PAGE_FORMAT_OPTIONS, defaultValue: PAGE_FORMAT_OPTIONS[0] },
    ],

    // Joins Sky/Ground into one natural clause instead of a fixed "with
    // X and Y" phrase that would look broken once either resolves empty
    // (its dropdown's "None" option).
    computeExtraTokens: function (valueMap) {
      var parts = [];
      if (valueMap.groundElements) parts.push(valueMap.groundElements.toLowerCase());
      if (valueMap.skyElements) parts.push(valueMap.skyElements.toLowerCase());
      return { extrasClause: parts.length ? " with " + parts.join(" and ") : "" };
    },

    basePromptTemplate:
      "Cute {mainCharacter}, {characterGroup}, {pose}, centered composition. Large round glossy eyes with bright highlights, soft rounded body proportions, tiny expressive facial features. Scene set in {setting}{extrasClause}{holidayClause}. Style: black and white coloring book page, clean smooth vector line art, uniform medium line weight, bold clear outlines, no shading, no grayscale, no color, white background, crisp digital ink lines, smooth curves, printable outline art, high resolution, {pageFormat}.",

    charmPromptTemplate:
      "Adorable {mainCharacter} illustrated as {characterGroup}, {pose} in a {setting} environment{extrasClause}{holidayClause} for whimsical detail. Character has oversized glossy eyes, rounded cheeks, simple cute expression, balanced composition. Style: black and white coloring page illustration, clean vector outline art, uniform line weight, bold smooth outlines, no shading, no grayscale, no color, white background, symmetrical layout, printable outline art, high resolution, {pageFormat}.",

    dynamicPromptTemplate:
      "Cute cartoon {mainCharacter}, designed as {characterGroup}, {pose} within {setting}{extrasClause}{holidayClause} for playful atmosphere. Front-facing or gently balanced composition, expressive oversized eyes, soft rounded shapes. Style: children's black and white coloring book page, clean smooth vector line art, uniform medium line weight, bold outlines, no shading, no grayscale, no color, white background, crisp digital ink lines, printable outline art, high resolution, {pageFormat}.",

    charmPool: [
      "a small ribbon or bow on the character",
      "a scattering of tiny stars in the background",
      "a friendly little ladybug nearby",
      "a small heart shape tucked in one corner",
    ],
    dynamicPool: [
      "a bit more spring and bounce in the pose",
      "a playful mid-motion feel, like it's about to hop or skip",
      "an extra-cheerful, wide-open expression",
    ],
  });
})();
