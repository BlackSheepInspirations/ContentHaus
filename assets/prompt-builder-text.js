/**
 * The AI Creator's Prompt Haus — Text Mode
 * Depends on prompt-builder-styledna.js and prompt-builder-engine.js.
 *
 * Meta-instruction assembler: a "Core Style" group that must stay
 * consistent across all 4 generated variations, and a "Variation Details"
 * group the AI is free to vary between them.
 *
 * Two fields beyond the build plan's original schema — Text Case and
 * Surface Texture — per the "don't just clone the reference tool" call:
 * both are real levers in print-on-demand prompt engineering (case affects
 * legibility/vibe, material finish is a huge lever for physical mockups)
 * that the reference tool's field set didn't cover at all.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;

  // ---------------------------------------------------------------------
  // Option lists — build plan Section 3 as the base, alphabetized, plus a
  // few new options per field so the catalog isn't a 1:1 clone. Text
  // Spacing is left in its tight -> wide progression (ordinal, not
  // categorical) rather than alphabetized, same reasoning as Character
  // Mode's Age Group/Height.
  // ---------------------------------------------------------------------
  var LETTER_STYLE_OPTIONS = sortAlpha([
    "bubble/puffy", "graffiti streetwear typography", "3d block", "dripping liquid",
    "y2k chrome", "neon glow", "retro 70s", "cyberpunk", "grunge", "calligraphy",
    "metal/punk", "shadow 3d", "sticker", "gel/jelly", "outline/stroke",
    "airbrush 90s typography", "kawaii cartoon typography", "puffy sticker letters",
    "retro pixel", "handwritten marker style", "chunky varsity letters",
    "chenille varsity patch", "chenille script varsity patch", "burn book",
    "ransom note", "coloring book", "pixel art",
    // new
    "brush lettering script", "art deco lettering", "acid wash tie-dye lettering",
  ]);

  var COLOR_SCHEME_OPTIONS = sortAlpha([
    "orange", "rainbow", "pastel", "gold", "ice blue", "silver/chrome", "sunset",
    "ocean", "forest", "red/fire", "purple", "lime green", "black", "copper/bronze",
    "mint", "vibrant multicolor", "electric neon mix", "candy bright multicolor",
    "tropical vibrant", "bold gradient blend",
    // new
    "champagne gold", "emerald jewel tone", "monochrome grayscale",
  ]);

  var MOCKUP_VIEW_OPTIONS = sortAlpha([
    "none", "on a black t-shirt", "on a white t-shirt", "on a black sweatshirt",
    "on a white sweatshirt", "large", "poster mockup", "candle mockup", "tote bag mockup",
    "tumbler mockup", "laptop mockup", "decal mockup", "onesie mockup", "fitted cap mockup",
    "trucker hat mockup", "phone case mockup", "shopping bag mockup", "perfume mockup",
    "ebook cover mockup", "billboard mockup", "storefront mockup", "sticker sheet mockup",
    // new
    "coffee mug mockup", "hat patch mockup", "notebook cover mockup",
  ]);

  // New field — case affects both legibility and vibe (e.g. "grunge" reads
  // very differently in lowercase vs. all-caps), and the reference tool
  // never lets the shopper control it at all.
  var TEXT_CASE_OPTIONS = sortAlpha([
    "uppercase", "lowercase", "title case", "sentence case", "mixed case (random)",
  ]);

  // New field — the letters' own material/surface finish, distinct from
  // Add-Ons below (which are border/shadow effects layered on top).
  var SURFACE_TEXTURE_OPTIONS = sortAlpha([
    "glitter texture", "foil texture", "chrome texture", "denim texture", "leather texture",
    "embroidered thread texture", "distressed grunge texture", "holographic texture",
    "glossy vinyl texture", "matte rubber texture",
  ]);

  var BACKGROUND_OPTIONS = sortAlpha([
    "clean white", "gradient", "paint splatter", "themed scene", "transparent", "smoke/clouds",
    // new
    "halftone dot pattern", "bokeh light blur", "geometric pattern",
  ]);

  var TEXT_SPACING_OPTIONS = ["ultra tight", "slightly tight", "balanced", "airy", "ultra wide"];

  var WORD_SHAPE_OPTIONS = sortAlpha([
    "straight line", "arched", "wave", "circular", "vertical stack", "pyramid",
    "scattered", "spiral", "zig-zag", "explosion layout",
    // new
    "diagonal slant", "heart shape", "starburst radial",
  ]);

  var WORD_STACK_OPTIONS = sortAlpha(["one line only", "multi line", "line per word"]);

  var ICON_PACKS_OPTIONS = sortAlpha([
    "none", "hearts", "sparkles", "money bags", "music notes", "roses", "cute stars",
    "floating dots", "clouds", "bubbles", "sunflowers", "kissy lips", "dollar signs",
    "bows", "diamonds", "90s hip hop", "zodiac", "kawaii", "makeup", "basketballs",
    "faith/scripture (cross, dove, olive branch)", "military/veteran (dog tags, stars, flag element)",
    "nurse (caduceus, stethoscope, heart monitor line)", "teacher (apple, pencil, books)",
    "firefighter (helmet, flame, maltese cross)", "small business owner (box, growth arrow, coffee cup)",
    // new
    "coffee/cafe icons", "beach/tropical icons", "gaming/controller icons",
  ]);

  var ADD_ONS_OPTIONS = sortAlpha([
    "none", "thin white outline", "thin pink outline", "thin gradient outline",
    "thick white outline", "thick black outline", "double outline", "embossed layers",
    "drop shadow", "stitched border", "camera lights",
    // new
    "glow outline", "confetti scatter overlay", "grain/noise overlay",
  ]);

  var FIXED_LABELS = {
    yourText: "Text Content",
    letterStyle: "Letter Style",
    colorScheme: "Color Scheme",
    mockupView: "Mockup View",
    textCase: "Text Case",
    surfaceTexture: "Surface Texture",
  };
  var VARIABLE_LABELS = {
    background: "Background",
    textSpacing: "Text Spacing",
    wordShape: "Word Shape",
    wordStack: "Word Stack",
    iconPacks: "Icon Pack",
    addOns: "Add-Ons",
  };

  // ---------------------------------------------------------------------
  // State — flat, matching the build plan's textConfig shape. "Core
  // Style" fields stay fixed across the 4 variations the meta-instruction
  // prompt asks for; "Variation Details" are what's free to vary.
  // ---------------------------------------------------------------------
  function buildInitialState() {
    return {
      yourText: makeField("", [], { isFreeText: true }),
      letterStyle: makeField("", LETTER_STYLE_OPTIONS),
      colorScheme: makeField("", COLOR_SCHEME_OPTIONS),
      mockupView: makeField("none", MOCKUP_VIEW_OPTIONS),
      textCase: makeField("", TEXT_CASE_OPTIONS),
      surfaceTexture: makeField("", SURFACE_TEXTURE_OPTIONS),
      background: makeField("", BACKGROUND_OPTIONS),
      textSpacing: makeField("balanced", TEXT_SPACING_OPTIONS),
      wordShape: makeField("", WORD_SHAPE_OPTIONS),
      wordStack: makeField("", WORD_STACK_OPTIONS),
      iconPacks: makeField("none", ICON_PACKS_OPTIONS),
      addOns: makeField("none", ADD_ONS_OPTIONS),
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state[fieldName], changes);
    store.setState(patch);
  }

  function getFixedEntries() {
    var state = store.getState();
    return Object.keys(FIXED_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: FIXED_LABELS[fieldName], field: state[fieldName] };
    });
  }

  function getVariableEntries() {
    var state = store.getState();
    return Object.keys(VARIABLE_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: VARIABLE_LABELS[fieldName], field: state[fieldName] };
    });
  }

  function assemblePrompt() {
    var toEntry = function (e) {
      return { label: e.label, field: e.field };
    };
    return PromptHaus.engine.buildMetaInstruction({
      intro: "Interpretation guide:",
      fixedFieldEntries: getFixedEntries().map(toEntry),
      variableFieldEntries: getVariableEntries().map(toEntry),
      outro:
        "High quality digital illustration, immaculate composition, vibrant and polished finish with professional rendering.",
    });
  }

  function randomize() {
    getFixedEntries().concat(getVariableEntries()).forEach(function (e) {
      if (e.fieldName === "yourText") return; // free text is never randomized
      if (!e.field.includeInPrompt) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      updateField(e.fieldName, { value: randomValue, customValue: "" });
    });
  }

  function reset() {
    store.setState(buildInitialState());
  }

  PromptHaus.text = Object.assign({}, store, {
    updateField: updateField,
    getFixedEntries: getFixedEntries,
    getVariableEntries: getVariableEntries,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
  });
})();
