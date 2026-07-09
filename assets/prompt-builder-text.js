/**
 * The AI Creator's Prompt Haus — Text Mode
 * Depends on prompt-builder-styledna.js and prompt-builder-engine.js.
 *
 * Meta-instruction assembler: a "Core Style" group that must stay
 * consistent across all 4 generated variations, and a "Variation Details"
 * group the AI is free to vary between them.
 *
 * Beyond the build plan's original schema, per the "don't just clone the
 * reference tool" call: a Text Case field (affects legibility/vibe) and a
 * grouped Text Effects field (glow/atmosphere/decorative finish — a much
 * bigger lever than a plain material texture), plus an opt-in Second
 * Phrase sub-panel that gives one word — or a fully separate second line/
 * phrase — its own distinct styling and position relative to the main
 * text.
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

  // Grouped like Character Type/Text Effects — curated category order
  // (not alphabetized), so related colors browse together.
  var COLOR_SCHEME_GROUPS = [
    {
      label: "Standard Colors",
      options: ["black", "white", "brown", "red", "yellow", "blue", "green", "teal", "purple", "pink", "orange"],
    },
    {
      label: "Neutral / Minimal",
      options: ["tan", "gray", "grayscale monochrome", "cream neutral", "soft beige"],
    },
    {
      label: "Warm / Earthy",
      options: ["red/fire", "sunset", "copper/bronze", "desert clay"],
    },
    {
      label: "Cool / Nature",
      options: ["forest", "ocean", "ice blue", "mint"],
    },
    {
      label: "Bright / Playful",
      options: ["rainbow", "candy bright multicolor", "vibrant multicolor", "pastel multicolor", "tropical brights", "lime green"],
    },
    {
      label: "Luxury / Metallic",
      options: ["gold", "champagne gold", "silver/chrome", "emerald jewel", "rose gold", "sapphire blue", "opal"],
    },
    {
      label: "Gradient / Special Mix",
      options: ["pastel gradient", "purple mix", "bold gradient blend", "neon mix", "holographic rainbow"],
    },
  ];

  // Mockup View moved to shared Style DNA (next to Buffer/Padding) — it
  // applies just as much to a Character portrait or Graphics design as it
  // does to Text lettering, so it's no longer Text Mode's own field.

  // New field — case affects both legibility and vibe (e.g. "grunge" reads
  // very differently in lowercase vs. all-caps), and the reference tool
  // never lets the shopper control it at all.
  var TEXT_CASE_OPTIONS = sortAlpha([
    "uppercase", "lowercase", "title case", "sentence case", "mixed case (random)",
  ]);

  // New field — a broader, more dramatic effect layered over the whole
  // word (glow, atmosphere, decorative finish), distinct from Add-Ons
  // below (border/shadow accents). Grouped like Character Type/Holiday —
  // browses better by category than as one 35+-item flat wall.
  var TEXT_EFFECTS_GROUPS = [
    {
      label: "Material / Surface",
      options: [
        "high gloss", "super matte", "metallic foil", "marble texture", "velvet texture", "glass text effect",
        // folded in from the old standalone Surface Texture field
        "chrome texture", "denim texture", "leather texture", "embroidered thread texture",
        "distressed grunge texture", "holographic texture", "glossy vinyl texture", "matte rubber texture",
      ],
    },
    {
      label: "Glow / Light",
      options: ["neon glow text", "flame glow text", "ember glow", "aura glow text", "backlit sign effect"],
    },
    {
      label: "Cool / Soft Atmosphere",
      options: ["ice lettering", "frosty glow text", "cloud soft text", "mist text effect", "ice crystal text"],
    },
    {
      label: "Luxury / Decorative",
      options: ["glitter texture", "rhinestone effect", "diamond lettering", "pearl finish", "gold leaf foil"],
    },
    {
      label: "Fluid / Playful",
      options: ["jelly texture", "gummy candy texture", "liquid ripple", "marshmallow puff text", "candy coated"],
    },
    {
      label: "Digital / Effects",
      options: ["holographic shift", "chrome gradient warp", "glitch text effect", "3d extruded typography", "pixel distortion text"],
    },
  ];

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

  // Second Phrase's own relationship to the main text — "inline accent"
  // covers the original one-word-called-out-within-a-sentence case (e.g.
  // "Blessed" inside "Blessed Mama"); the other 3 cover a fully separate
  // second line/phrase with its own typography (e.g. a call-and-response
  // design: "Do You Trust Me" / "Well, Do Ya?").
  var ACCENT_POSITION_OPTIONS = sortAlpha([
    "inline accent within main text", "below main text", "above main text", "beside main text",
  ]);

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

  // Second Phrase sub-panel — lets the shopper call out one word inline
  // (e.g. "Blessed" in cursive gold inside "Blessed Mama") OR add a fully
  // separate second line/phrase with its own typography and position
  // relative to the main text (e.g. a call-and-response design: "Do You
  // Trust Me" / "Well, Do Ya?" positioned below). Reuses the exact same 4
  // option lists as Core Style (Letter Style/Color Scheme/Text Case/Text
  // Effects) rather than a separate smaller list, so it gets the same
  // depth of control as the main text.

  // No separate Surface Texture here — Text Effects's own Material /
  // Surface category absorbed it (see TEXT_EFFECTS_GROUPS above), so the
  // two don't read as two overlapping answers to the same question.
  var FIXED_LABELS = {
    yourText: "Text Content",
    letterStyle: "Letter Style",
    colorScheme: "Color Scheme",
    textCase: "Text Case",
    textEffects: "Text Effects",
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
      colorScheme: PromptHaus.util.makeGroupedField("", COLOR_SCHEME_GROUPS),
      textCase: makeField("", TEXT_CASE_OPTIONS),
      textEffects: PromptHaus.util.makeGroupedField("", TEXT_EFFECTS_GROUPS),
      background: makeField("", BACKGROUND_OPTIONS),
      textSpacing: makeField("balanced", TEXT_SPACING_OPTIONS),
      wordShape: makeField("", WORD_SHAPE_OPTIONS),
      wordStack: makeField("", WORD_STACK_OPTIONS),
      iconPacks: makeField("none", ICON_PACKS_OPTIONS),
      addOns: makeField("none", ADD_ONS_OPTIONS),
      accent: {
        include: false,
        phrase: makeField("", [], { isFreeText: true }),
        letterStyle: makeField("", LETTER_STYLE_OPTIONS),
        colorScheme: PromptHaus.util.makeGroupedField("", COLOR_SCHEME_GROUPS),
        textCase: makeField("", TEXT_CASE_OPTIONS),
        // Text Effects replaces Surface Texture here too — same widget as
        // Core Style's, so the accent phrase gets the same depth of
        // control (glow/atmosphere/decorative finish, not just a plain
        // material texture).
        textEffects: PromptHaus.util.makeGroupedField("", TEXT_EFFECTS_GROUPS),
        position: makeField("", ACCENT_POSITION_OPTIONS),
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

  var ACCENT_STYLE_LABELS = {
    letterStyle: "Letter Style",
    colorScheme: "Color Scheme",
    textCase: "Text Case",
    textEffects: "Text Effects",
  };

  function getAccentStyleEntries() {
    var accent = store.getState().accent;
    return Object.keys(ACCENT_STYLE_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: ACCENT_STYLE_LABELS[fieldName], field: accent[fieldName] };
    });
  }

  // Composes the accent phrase + its own Letter Style/Color Scheme/Text
  // Case/Text Effects into one descriptive clause rather than letting
  // them appear as several disconnected list items in the "Maintain: ..."
  // clause — null when the shopper hasn't opted in or hasn't typed a
  // phrase yet.
  //
  // Position changes the framing entirely, not just adds a detail: a
  // Position other than the inline default means this isn't one word
  // called out inside the main sentence (e.g. "Blessed" in "Blessed
  // Mama") — it's a fully separate second line/phrase with its own
  // typography (e.g. a call-and-response design: "Do You Trust Me" /
  // "Well, Do Ya?"), so it needs its own "second line of text" wording
  // rather than "set apart from the rest of the text," which implies it's
  // carved out of the main text instead of standing beside it.
  function buildAccentField() {
    var state = store.getState();
    if (!state.accent.include) return null;
    var phrase = (state.accent.phrase.value || "").trim();
    if (!phrase) return null;
    var descriptors = PromptHaus.engine.resolveFields(
      getAccentStyleEntries().map(function (e) {
        return { label: e.label, field: e.field };
      })
    ).map(function (r) {
      return r.value;
    });
    var position = PromptHaus.engine.resolveFieldValue(state.accent.position);
    var isSeparateLine = position && position !== "inline accent within main text";
    var subject = isSeparateLine ? 'a second line of text reading "' + phrase + '"' : 'the word/phrase "' + phrase + '"';

    var pieces = [];
    if (descriptors.length) pieces.push("styled with " + descriptors.join(", "));
    if (isSeparateLine) {
      pieces.push("positioned " + position);
    } else if (!descriptors.length) {
      pieces.push("set apart from the rest of the text");
    }

    return makeField((subject + " " + pieces.join(", ")).trim());
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

  var PROMPT_OUTRO =
    "High quality digital illustration, immaculate composition, vibrant and polished finish with professional rendering.";

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
    if (accentField) fixedEntries.push({ label: "Second Phrase", field: accentField });
    // Holiday, Theme, Niche, Mockup View, Filter, and Buffer/Padding live
    // in shared Style DNA — stay fixed across variations same as
    // everything else in Core Style.
    fixedEntries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    fixedEntries.push({ label: "Theme", field: PromptHaus.styleDNA.getState().theme });
    fixedEntries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    fixedEntries.push({ label: "Mockup View", field: PromptHaus.styleDNA.getState().mockupView });
    fixedEntries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    fixedEntries = fixedEntries.concat(PromptHaus.styleDNA.getImageryEntries());
    fixedEntries = fixedEntries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("text");
    if (projectTypeEntry) fixedEntries.push(projectTypeEntry);
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
      outro: PROMPT_OUTRO,
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
    // Accent's own style fields (and Position) may randomize too, but the
    // typed phrase itself never does.
    var state = store.getState();
    if (state.accent.include) {
      getAccentStyleEntries().forEach(function (e) {
        if (!e.field.includeInPrompt) return;
        var options = e.field.options || [];
        if (!options.length) return;
        var randomValue = options[Math.floor(Math.random() * options.length)];
        updateAccentField(e.fieldName, { value: randomValue, customValue: "" });
      });
      if (state.accent.position.includeInPrompt) {
        var positionOptions = state.accent.position.options || [];
        if (positionOptions.length) {
          updateAccentField("position", {
            value: positionOptions[Math.floor(Math.random() * positionOptions.length)],
            customValue: "",
          });
        }
      }
    }
    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState());
    PromptHaus.styleDNA.resetContent();
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
        title: "Second Phrase",
        items: [{ label: "Second Phrase", value: PromptHaus.engine.resolveFieldValue(accentField) }],
      });
    }

    var variableResolved = PromptHaus.engine.resolveFields(getVariableEntries().map(toEntry));
    if (variableResolved.length) groups.push({ title: "Variation Details", items: variableResolved });

    var holidayResolved = PromptHaus.engine.resolveFields([
      { label: "Holiday", field: PromptHaus.styleDNA.getState().holiday },
      { label: "Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Mockup View", field: PromptHaus.styleDNA.getState().mockupView },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ]);
    if (holidayResolved.length) groups.push({ title: "Holiday, Theme & Niche", items: holidayResolved });

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
    if (bufferEntry) groups.push({ title: "Image Buffer/Padding", items: [{ label: bufferEntry.label, value: bufferEntry.field.value }] });

    return groups;
  }

  // ---------------------------------------------------------------------
  // Starter Presets — sets Core Style/Variation Details fields only,
  // never Text Content itself (yourText stays whatever the shopper typed).
  // ---------------------------------------------------------------------
  var PRESETS = [
    {
      id: "boldStatementTee",
      name: "Bold Statement Tee",
      description: "Chunky varsity letters, vibrant multicolor, uppercase.",
      apply: function () {
        updateField("letterStyle", { value: "chunky varsity letters", customValue: "" });
        updateField("colorScheme", { value: "vibrant multicolor", customValue: "" });
        updateField("textCase", { value: "uppercase", customValue: "" });
      },
    },
    {
      id: "bohoScript",
      name: "Boho Script",
      description: "Calligraphy lettering, pastel gradient color scheme, title case.",
      apply: function () {
        updateField("letterStyle", { value: "calligraphy", customValue: "" });
        updateField("colorScheme", { value: "pastel gradient", customValue: "" });
        updateField("textCase", { value: "title case", customValue: "" });
      },
    },
    {
      id: "retroVarsityText",
      name: "Retro Varsity Text",
      description: "Chenille varsity patch lettering, bold gradient blend.",
      apply: function () {
        updateField("letterStyle", { value: "chenille varsity patch", customValue: "" });
        updateField("colorScheme", { value: "bold gradient blend", customValue: "" });
      },
    },
    {
      id: "faithBasedScript",
      name: "Faith-Based Script",
      description: "Brush lettering script, champagne gold color scheme.",
      apply: function () {
        updateField("letterStyle", { value: "brush lettering script", customValue: "" });
        updateField("colorScheme", { value: "champagne gold", customValue: "" });
      },
    },
  ];

  PromptHaus.text = Object.assign({}, store, {
    presets: PRESETS,
    updateField: updateField,
    getSelectionsByGroup: getSelectionsByGroup,
    toggleAccentInclude: toggleAccentInclude,
    updateAccentField: updateAccentField,
    getFixedEntries: getFixedEntries,
    getVariableEntries: getVariableEntries,
    buildAccentField: buildAccentField,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    // Single source of truth for option lists other modes need to reuse
    // (Reference Mode now) rather than duplicating them.
    optionLists: {
      letterStyle: LETTER_STYLE_OPTIONS,
      colorSchemeGroups: COLOR_SCHEME_GROUPS,
      textCase: TEXT_CASE_OPTIONS,
      textEffectsGroups: TEXT_EFFECTS_GROUPS,
    },
  });
})();
