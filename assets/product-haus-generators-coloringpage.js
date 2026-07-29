/**
 * The AI Creator's Project Haus — Coloring Page Generator
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

  // Curated so this isn't a blank text box with zero ideation help — the
  // one gap this generator had that every sibling generator already
  // avoided. Dropdown-or-type-your-own, same as every other field here:
  // picking one of these fills the field, typing anything else still
  // works via the field's own customValue override.
  var MAIN_CHARACTER_OPTIONS = ProductHaus.util.sortAlpha([
    "bunny", "kitten", "puppy", "baby fox", "baby deer (fawn)", "koala", "panda cub", "baby elephant",
    "giraffe calf", "lion cub", "owl", "hedgehog", "sloth", "penguin chick", "otter", "duckling", "lamb", "baby raccoon",
  ]);

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

  // Same two fields (and same option lists) as the Coloring Book bundle
  // generator, added here for parity — this generator used to hardcode
  // "uniform medium line weight" with no user control and no age-range
  // signal at all.
  var LINE_STYLE_OPTIONS = ["Simple Bold Outlines (toddler-friendly)", "Medium Detail Line Art", "Intricate Detailed Line Art (advanced colorists)"];
  var PAGE_COMPLEXITY_OPTIONS = ["Simple (ages 2-5)", "Moderate (ages 6-10)", "Detailed (adult coloring)"];

  // A baseline quality bar, not a style choice — an AI-generated coloring
  // page doesn't reliably close every shape on its own, and an open gap
  // makes a region uncolorable. Always on, appended to every variation.
  var CLOSED_REGION_NOTE = " Uniform line weight throughout. All shapes must have fully enclosed, closed outlines with no open line gaps, so every region is cleanly colorable.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "coloring-page",
    label: "Cute Animals Coloring Page",
    icon: "heart",
    description: "A printable black-and-white line-art coloring page starring one small character — works even if you don't touch a single field below.",
    fieldGroupTitle: "Customize Your Coloring Page",

    fields: [
      { name: "mainCharacter", label: "Main Animal Character", options: MAIN_CHARACTER_OPTIONS, defaultValue: "bunny", placeholder: "e.g. bunny, kitten, puppy — or pick one, or type your own" },
      { name: "characterGroup", label: "Character Group", options: CHARACTER_GROUP_OPTIONS, defaultValue: CHARACTER_GROUP_OPTIONS[0] },
      { name: "pose", label: "Pose / Action", options: POSE_OPTIONS, defaultValue: POSE_OPTIONS[0] },
      { name: "setting", label: "Setting", options: SETTING_OPTIONS, defaultValue: SETTING_OPTIONS[0] },
      { name: "skyElements", label: "Sky Details", options: SKY_OPTIONS, defaultValue: SKY_OPTIONS[0] },
      { name: "groundElements", label: "Ground Details", options: GROUND_OPTIONS, defaultValue: GROUND_OPTIONS[0] },
      { name: "pageFormat", label: "Page Format", options: PAGE_FORMAT_OPTIONS, defaultValue: PAGE_FORMAT_OPTIONS[0] },
      { name: "lineStyle", label: "Line Style", options: LINE_STYLE_OPTIONS, defaultValue: LINE_STYLE_OPTIONS[1], aesthetic: "artStyle" },
      { name: "pageComplexity", label: "Page Complexity", options: PAGE_COMPLEXITY_OPTIONS, defaultValue: PAGE_COMPLEXITY_OPTIONS[1] },
    ],

    // Ground/Sky as their own separate sentence ("Surround with X and
    // include Y.") rather than chained into the scene sentence with
    // repeated "and"s — a run-on clause reads worse to these image
    // models than two short, distinct instructions do.
    computeExtraTokens: function (valueMap) {
      var parts = [];
      if (valueMap.groundElements) parts.push("Surround with " + valueMap.groundElements.toLowerCase());
      if (valueMap.skyElements) parts.push((parts.length ? "include " : "Include ") + valueMap.skyElements.toLowerCase());
      return { extrasClause: parts.length ? " " + parts.join(" and ") + "." : "" };
    },

    basePromptTemplate:
      "Cute {mainCharacter}, {characterGroup}, {pose}, centered composition. Large round glossy eyes with bright highlights, soft rounded body proportions, tiny expressive facial features. Scene set in {setting}{holidayClause}.{extrasClause} Style: black and white coloring book page, clean smooth vector line art, bold clear outlines, no shading, no grayscale, no color, white background, crisp digital ink lines, smooth curves, printable outline art, high resolution, {pageFormat}, {lineStyle}, {pageComplexity}." +
      CLOSED_REGION_NOTE,

    charmPromptTemplate:
      "Adorable {mainCharacter} illustrated as {characterGroup}, {pose} in a {setting} environment{holidayClause} for whimsical detail.{extrasClause} Character has oversized glossy eyes, rounded cheeks, simple cute expression, balanced composition. Style: black and white coloring page illustration, clean vector outline art, bold smooth outlines, no shading, no grayscale, no color, white background, symmetrical layout, printable outline art, high resolution, {pageFormat}, {lineStyle}, {pageComplexity}." +
      CLOSED_REGION_NOTE,

    dynamicPromptTemplate:
      "Cute cartoon {mainCharacter}, designed as {characterGroup}, {pose} within {setting}{holidayClause} for playful atmosphere.{extrasClause} Front-facing or gently balanced composition, expressive oversized eyes, soft rounded shapes. Style: children's black and white coloring book page, clean smooth vector line art, bold outlines, no shading, no grayscale, no color, white background, crisp digital ink lines, printable outline art, high resolution, {pageFormat}, {lineStyle}, {pageComplexity}." +
      CLOSED_REGION_NOTE,

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
