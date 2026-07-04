/**
 * The AI Creator's Prompt Haus — Text Mode
 * Depends on prompt-builder-styledna.js and prompt-builder-engine.js.
 *
 * Meta-instruction assembler: a "Core Style" group that must stay
 * consistent across all 4 generated variations, and a "Variation Details"
 * group the AI is free to vary between them.
 *
 * Beyond the build plan's original schema, per the "don't just clone the
 * reference tool" call: Text Case and Surface Texture fields (case affects
 * legibility/vibe, material finish is a huge lever for physical mockups),
 * plus an opt-in Accent Word/Phrase sub-panel that lets one word get its
 * own distinct styling separate from the rest of the text.
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

  // New sub-panel — lets the shopper call out one word or short phrase with
  // its own distinct look (e.g. "Blessed" in cursive gold, rest of the text
  // in plain white block letters). Common in this niche's real designs;
  // the reference tool has no way to single out part of the text at all.
  var ACCENT_STYLE_OPTIONS = sortAlpha([
    "contrasting color accent", "cursive script accent", "outlined accent",
    "glitter accent", "larger scale accent", "metallic foil accent",
    "underline accent", "circled/highlighted accent",
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
      accent: {
        include: false,
        phrase: makeField("", [], { isFreeText: true }),
        style: makeField("", ACCENT_STYLE_OPTIONS),
      },
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state[fieldName], changes);
    store.setState(patch);
  }

  function toggleAccentInclude(include) {
    var state = store.getState();
    store.setState({ accent: Object.assign({}, state.accent, { include: include }) });
  }

  function updateAccentField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.accent[fieldName], changes);
    store.setState({ accent: Object.assign({}, state.accent, patch) });
  }

  // Composes the accent phrase + style into one descriptive clause rather
  // than letting them appear as two disconnected list items in the
  // "Maintain: ..." clause — null when the shopper hasn't opted in or
  // hasn't typed a phrase yet.
  function buildAccentField() {
    var state = store.getState();
    if (!state.accent.include) return null;
    var phrase = (state.accent.phrase.value || "").trim();
    if (!phrase) return null;
    var style = PromptHaus.engine.resolveFieldValue(state.accent.style);
    var text = style
      ? 'the word/phrase "' + phrase + '" styled with ' + style
      : 'the word/phrase "' + phrase + '" set apart from the rest of the text';
    return makeField(text);
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

  // extraFixedEntries lets Combined Mode layer in the live-linked mascot
  // description (and its alignment) without duplicating this assembler —
  // standalone Text Mode never passes anything, so its output is unchanged.
  function assemblePrompt(extraFixedEntries) {
    var toEntry = function (e) {
      return { label: e.label, field: e.field };
    };
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var fixedEntries = getFixedEntries().map(toEntry);
    var accentField = buildAccentField();
    if (accentField) fixedEntries.push({ label: "Accent", field: accentField });
    // Holiday / Theme and Buffer/Padding live in shared Style DNA — stay
    // fixed across variations same as everything else in Core Style.
    fixedEntries.push({ label: "Holiday / Theme", field: PromptHaus.styleDNA.getState().holiday });
    fixedEntries = fixedEntries.concat(PromptHaus.styleDNA.getImageryEntries());
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) fixedEntries.push(bufferEntry);
    if (extraFixedEntries && extraFixedEntries.length) fixedEntries = fixedEntries.concat(extraFixedEntries);

    var intro = "Generate " + count + (count === 1 ? " variation." : " variations.");
    if (count > 1) intro += " Interpretation guide:";

    return PromptHaus.engine.buildMetaInstruction({
      intro: intro,
      fixedFieldEntries: fixedEntries,
      variableFieldEntries: getVariableEntries().map(toEntry),
      variationCount: count,
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
    // Accent style may randomize too, but the typed phrase itself never does.
    var state = store.getState();
    if (state.accent.include && state.accent.style.includeInPrompt) {
      var styleOptions = state.accent.style.options || [];
      if (styleOptions.length) {
        var randomStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];
        updateAccentField("style", { value: randomStyle, customValue: "" });
      }
    }
  }

  function reset() {
    store.setState(buildInitialState());
  }

  // Mirrors Character Mode's getSelectionsByGroup() — feeds the "Your
  // Selections" panel, grouped the same way the field panel itself is.
  function getSelectionsByGroup() {
    var toEntry = function (e) {
      return { label: e.label, field: e.field };
    };
    var groups = [];

    var coreResolved = PromptHaus.engine.resolveFields(getFixedEntries().map(toEntry));
    if (coreResolved.length) groups.push({ title: "Core Style", items: coreResolved });

    var accentField = buildAccentField();
    if (accentField) {
      groups.push({
        title: "Accent",
        items: [{ label: "Accent", value: PromptHaus.engine.resolveFieldValue(accentField) }],
      });
    }

    var variableResolved = PromptHaus.engine.resolveFields(getVariableEntries().map(toEntry));
    if (variableResolved.length) groups.push({ title: "Variation Details", items: variableResolved });

    var holidayResolved = PromptHaus.engine.resolveFields([
      { label: "Holiday / Theme", field: PromptHaus.styleDNA.getState().holiday },
    ]);
    if (holidayResolved.length) groups.push({ title: "Holiday / Theme", items: holidayResolved });

    var imageryEntries = PromptHaus.styleDNA.getImageryEntries();
    if (imageryEntries.length) {
      groups.push({
        title: "Imagery",
        items: imageryEntries.map(function (e) {
          return { label: e.label, value: e.field.value };
        }),
      });
    }

    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) groups.push({ title: "Buffer/Padding", items: [{ label: bufferEntry.label, value: bufferEntry.field.value }] });

    return groups;
  }

  PromptHaus.text = Object.assign({}, store, {
    updateField: updateField,
    getSelectionsByGroup: getSelectionsByGroup,
    toggleAccentInclude: toggleAccentInclude,
    updateAccentField: updateAccentField,
    getFixedEntries: getFixedEntries,
    getVariableEntries: getVariableEntries,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
  });
})();
