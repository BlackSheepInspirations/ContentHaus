/**
 * The AI Creator's Brand Haus — Branding Studio
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-identity.js, and brand-haus-ui.js's exposed
 * BrandHaus.ui helpers (all must load first).
 *
 * Produces a multi-zone brand identity BOARD (colors, typography, mood,
 * mission, values, voice all composed into one image) rather than a
 * single-subject image — this is the mode that needed the "layout &
 * structure" prompting vocabulary the original ebook/infographic examples
 * called for, so assemblePrompt below writes explicit named zones instead
 * of using the shared comma-joined buildSentence assembler (same reasoning
 * Logo Studio already applies for its own structured output).
 *
 * Color palette and Typography use the two new components built for this
 * studio (BrandHaus.ui.renderColorPickerList / renderFontPreviewField)
 * — scoped here only, per instruction, not wired into any other studio.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var makeField = BrandHaus.util.makeField;
  var sortAlpha = BrandHaus.util.sortAlpha;

  // Curated font set: a handful of web-safe fonts (render immediately, no
  // load needed) plus a curated set of Google Fonts spanning serif/
  // sans-serif/script/display/monospace, loaded once below so the preview
  // dropdown actually renders each option in its own real typeface instead
  // of falling back to the browser default.
  var WEB_SAFE_FONTS = ["Georgia", "Helvetica", "Arial", "Times New Roman", "Courier New"];
  var GOOGLE_FONTS = [
    "Playfair Display", "Merriweather", "Lora", "Montserrat", "Poppins", "Inter", "Open Sans",
    "Caveat", "Dancing Script", "Pacifico", "Sacramento", "Bebas Neue", "Oswald", "Abril Fatface", "Roboto Mono",
  ];
  var FONT_OPTIONS = sortAlpha(WEB_SAFE_FONTS.concat(GOOGLE_FONTS));

  (function loadGoogleFonts() {
    if (document.getElementById("bh-branding-fonts-link")) return;
    var families = GOOGLE_FONTS.map(function (name) {
      return "family=" + name.replace(/ /g, "+") + ":wght@400;600;700";
    }).join("&");
    var link = document.createElement("link");
    link.id = "bh-branding-fonts-link";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?" + families + "&display=swap";
    document.head.appendChild(link);
  })();

  var MOOD_OPTIONS = sortAlpha([
    "minimalist and clean", "warm and cozy", "bold and vibrant", "elegant and luxurious", "playful and fun",
    "rustic and organic", "modern and edgy", "romantic and soft", "professional and polished", "boho and eclectic",
  ]);

  var BRAND_VOICE_OPTIONS = sortAlpha([
    "warm and approachable", "confident and bold", "playful and quirky", "sophisticated and refined",
    "nurturing and supportive", "edgy and rebellious", "calm and grounded", "energetic and motivating",
  ]);

  var BOARD_LAYOUT_OPTIONS = [
    "sectioned grid (colors, fonts, mood each in their own block)",
    "single cohesive mood board",
    "side-by-side comparison layout",
  ];

  var MAX_COLORS = 5;
  var MAX_VALUES = 5;

  var PRESETS = [
    {
      name: "Cozy Farmhouse Brand",
      description: "Warm earth tones, classic serif, family-first values.",
      apply: { colors: ["#8B5E3C", "#F5F0E6", "#4A5D45"], headingFont: "Playfair Display", bodyFont: "Georgia", mood: "warm and cozy", values: ["Family", "Tradition", "Comfort"], brandVoice: "warm and approachable", boardLayout: BOARD_LAYOUT_OPTIONS[1] },
    },
    {
      name: "Bold Modern Boutique",
      description: "High contrast, punchy display type, confident voice.",
      apply: { colors: ["#1A1815", "#D6336C", "#F2F0EB"], headingFont: "Bebas Neue", bodyFont: "Inter", mood: "bold and vibrant", values: ["Confidence", "Individuality", "Quality"], brandVoice: "confident and bold", boardLayout: BOARD_LAYOUT_OPTIONS[0] },
    },
    {
      name: "Elegant Luxury Brand",
      description: "Black and gold, refined serif, sophisticated voice.",
      apply: { colors: ["#1A1815", "#C9A84C", "#FAF6EF"], headingFont: "Playfair Display", bodyFont: "Lora", mood: "elegant and luxurious", values: ["Excellence", "Craftsmanship", "Exclusivity"], brandVoice: "sophisticated and refined", boardLayout: BOARD_LAYOUT_OPTIONS[1] },
    },
    {
      name: "Playful Creative Brand",
      description: "Bright palette, hand-lettered script, quirky voice.",
      apply: { colors: ["#FFB703", "#FB8500", "#219EBC"], headingFont: "Pacifico", bodyFont: "Poppins", mood: "playful and fun", values: ["Creativity", "Joy", "Community"], brandVoice: "playful and quirky", boardLayout: BOARD_LAYOUT_OPTIONS[0] },
    },
  ];

  function buildInitialState() {
    return {
      tagline: makeField("", [], { isFreeText: true }),
      colors: [],
      headingFont: makeField("", FONT_OPTIONS),
      bodyFont: makeField("", FONT_OPTIONS),
      mood: makeField("", MOOD_OPTIONS),
      mission: makeField("", [], { isFreeText: true }),
      coreValues: [],
      brandVoice: makeField("", BRAND_VOICE_OPTIONS),
      boardLayout: makeField(BOARD_LAYOUT_OPTIONS[0], BOARD_LAYOUT_OPTIONS),
    };
  }

  var store = BrandHaus.util.createStore(buildInitialState());

  function resolved(field) {
    return BrandHaus.engine.resolveFieldValue(field);
  }

  function updateField(fieldName, changes) {
    BrandHaus.util.updateField(store, fieldName, changes);
  }

  function addColor() {
    var state = store.getState();
    if (state.colors.length >= MAX_COLORS) return;
    store.setState({ colors: state.colors.concat(["#6B6860"]) });
  }
  function updateColor(index, hex) {
    var state = store.getState();
    var next = state.colors.slice();
    next[index] = hex;
    store.setState({ colors: next });
  }
  function removeColor(index) {
    var state = store.getState();
    store.setState({ colors: state.colors.filter(function (_, i) { return i !== index; }) });
  }

  function addValue() {
    var state = store.getState();
    if (state.coreValues.length >= MAX_VALUES) return;
    store.setState({ coreValues: state.coreValues.concat([""]) });
  }
  function updateValue(index, value) {
    var state = store.getState();
    var next = state.coreValues.slice();
    next[index] = value;
    store.setState({ coreValues: next });
  }
  function removeValue(index) {
    var state = store.getState();
    store.setState({ coreValues: state.coreValues.filter(function (_, i) { return i !== index; }) });
  }

  function applyPreset(preset) {
    var a = preset.apply;
    var state = store.getState();
    store.setState({
      colors: a.colors.slice(),
      headingFont: Object.assign({}, state.headingFont, { value: a.headingFont, customValue: "" }),
      bodyFont: Object.assign({}, state.bodyFont, { value: a.bodyFont, customValue: "" }),
      mood: Object.assign({}, state.mood, { value: a.mood, customValue: "" }),
      coreValues: a.values.slice(),
      brandVoice: Object.assign({}, state.brandVoice, { value: a.brandVoice, customValue: "" }),
      boardLayout: Object.assign({}, state.boardLayout, { value: a.boardLayout, customValue: "" }),
    });
  }

  // Applied from the Brand DNA Assessment's matched profile + Founder DNA
  // output — same shape as applyPreset, plus mission (which presets don't
  // set) since only the assessment currently generates a mission draft.
  function applyBrandDNAResult(result) {
    var state = store.getState();
    store.setState({
      colors: result.colors.slice(),
      headingFont: Object.assign({}, state.headingFont, { value: result.headingFont, customValue: "" }),
      bodyFont: Object.assign({}, state.bodyFont, { value: result.bodyFont, customValue: "" }),
      mood: Object.assign({}, state.mood, { value: result.mood, customValue: "" }),
      brandVoice: Object.assign({}, state.brandVoice, { value: result.brandVoice, customValue: "" }),
      coreValues: result.values.slice(),
      mission: Object.assign({}, state.mission, { value: result.mission }),
    });
  }

  function randomize() {
    var state = store.getState();
    function randomPick(field) {
      var options = field.options || [];
      return options.length ? options[Math.floor(Math.random() * options.length)] : "";
    }
    if (state.headingFont.includeInPrompt !== false) updateField("headingFont", { value: randomPick(state.headingFont), customValue: "" });
    if (state.bodyFont.includeInPrompt !== false) updateField("bodyFont", { value: randomPick(state.bodyFont), customValue: "" });
    if (state.mood.includeInPrompt !== false) updateField("mood", { value: randomPick(state.mood), customValue: "" });
    if (state.brandVoice.includeInPrompt !== false) updateField("brandVoice", { value: randomPick(state.brandVoice), customValue: "" });
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function effectiveBusinessName() {
    return BrandHaus.engine.resolveFieldValue(BrandHaus.identity.getState().businessName);
  }

  function assemblePrompt() {
    var state = store.getState();
    var businessName = effectiveBusinessName();
    var tagline = resolved(state.tagline);
    var colors = state.colors.filter(Boolean);
    var headingFont = resolved(state.headingFont);
    var bodyFont = resolved(state.bodyFont);
    var mood = resolved(state.mood);
    var mission = resolved(state.mission);
    var values = state.coreValues.map(function (v) { return (v || "").trim(); }).filter(Boolean);
    var brandVoice = resolved(state.brandVoice);
    var layoutStyle = resolved(state.boardLayout) || BOARD_LAYOUT_OPTIONS[0];

    var zones = [];
    var fragments = [];
    function addZone(text, fragment) {
      if (!text) return;
      zones.push(text);
      if (fragment) fragments.push(fragment);
    }

    if (businessName) {
      var headerText = tagline ? businessName + ' — "' + tagline + '"' : businessName;
      addZone('a header zone with the business name and tagline reading exactly: "' + headerText + '"', businessName);
    }
    if (colors.length) addZone("a color palette strip showing these exact swatches in order: " + colors.join(", "), colors.join(", ") + " color palette");
    if (headingFont || bodyFont) {
      var typoBits = [];
      if (headingFont) typoBits.push("heading text styled like a " + headingFont + " typeface");
      if (bodyFont) typoBits.push("body text styled like a " + bodyFont + " typeface");
      addZone("a typography sample zone showing " + typoBits.join(" and "), typoBits.join(", "));
    }
    if (mood) addZone("an overall mood/aesthetic direction of " + mood, mood);
    if (mission) addZone('a mission statement zone reading: "' + mission + '"', "mission statement");
    if (values.length) addZone("a core values list zone displaying: " + values.join(", "), values.join(", "));
    if (brandVoice) addZone("a brand voice/personality of " + brandVoice, brandVoice);

    var intro = "Design a cohesive brand identity board as one image, laid out as a " + layoutStyle + ", including:";
    var text = zones.length ? intro + " " + zones.join("; ") + "." : intro;
    return { text: text, fragments: fragments };
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var groups = [];

    var brandStory = BrandHaus.engine.resolveFields([
      { label: "Tagline", field: state.tagline },
      { label: "Mission Statement", field: state.mission },
      { label: "Brand Voice", field: state.brandVoice },
    ]);
    var values = state.coreValues.map(function (v) { return (v || "").trim(); }).filter(Boolean);
    if (values.length) brandStory.push({ label: "Core Values", value: values.join(", ") });
    if (brandStory.length) groups.push({ title: "Brand Story", items: brandStory });

    var visual = BrandHaus.engine.resolveFields([
      { label: "Heading Font", field: state.headingFont },
      { label: "Body Font", field: state.bodyFont },
      { label: "Mood", field: state.mood },
    ]);
    var colors = state.colors.filter(Boolean);
    if (colors.length) visual.unshift({ label: "Colors", value: colors.join(", ") });
    if (visual.length) groups.push({ title: "Visual Identity", items: visual });

    var layout = BrandHaus.engine.resolveFields([{ label: "Board Layout", field: state.boardLayout }]);
    if (layout.length) groups.push({ title: "Layout", items: layout });

    return groups;
  }

  function renderPanel() {
    var ui = BrandHaus.ui;
    var wrap = ui.el("div", { class: "bh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); BrandHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    var businessName = effectiveBusinessName();
    wrap.appendChild(ui.el("p", { class: "bh-field-group__subtitle" }, [
      ui.icon("shirt"),
      ui.el("span", { text: businessName ? ("Business Name: \"" + businessName + "\" (from the bar above)") : "Set your Business Name in the bar above to include it on the board." }),
    ]));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Tagline", field: state.tagline, placeholder: "e.g. \"Handmade with heart\"" }],
      function (entry, changes) { updateField("tagline", changes); BrandHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderColorPickerList({
      title: "Color Palette",
      subtitle: "Pick up to " + MAX_COLORS + " brand colors — shown in a row on the board.",
      colors: state.colors,
      max: MAX_COLORS,
      onUpdate: function (index, hex) { updateColor(index, hex); BrandHaus.ui.renderApp(); },
      onAdd: function () { addColor(); BrandHaus.ui.renderApp(); },
      onRemove: function (index) { removeColor(index); BrandHaus.ui.renderApp(); },
    }));

    var typographyGroup = ui.el("fieldset", { class: "bh-field-group" }, [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("type"), ui.el("span", { text: "Typography" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "Curated fonts, previewed in their own typeface — heading and body." }),
      ui.el("div", { class: "bh-field-group__fields" }, [
        ui.renderFontPreviewField({ label: "Heading Font", field: state.headingFont }, function (changes) { updateField("headingFont", changes); BrandHaus.ui.renderApp(); }),
        ui.renderFontPreviewField({ label: "Body Font", field: state.bodyFont }, function (changes) { updateField("bodyFont", changes); BrandHaus.ui.renderApp(); }),
      ]),
    ]);
    wrap.appendChild(typographyGroup);

    wrap.appendChild(ui.renderFieldGroup("Mood & Voice", [
      { label: "Mood / Aesthetic", field: state.mood },
      { label: "Brand Voice / Personality", field: state.brandVoice },
    ], function (entry, changes) {
      if (entry.label === "Mood / Aesthetic") updateField("mood", changes);
      else updateField("brandVoice", changes);
      BrandHaus.ui.renderApp();
    }));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Mission Statement", field: state.mission, placeholder: "In a sentence or two, what does this brand do and why does it matter?" }],
      function (entry, changes) { updateField("mission", changes); BrandHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderTextSlotList({
      title: "Core Values",
      subtitle: "Up to " + MAX_VALUES + " short values or pillars.",
      icon: "heart",
      values: state.coreValues,
      max: MAX_VALUES,
      singular: "Value",
      placeholder: "e.g. Community",
      onUpdate: function (index, value) { updateValue(index, value); },
      onAdd: function () { addValue(); BrandHaus.ui.renderApp(); },
      onRemove: function (index) { removeValue(index); BrandHaus.ui.renderApp(); },
    }));

    wrap.appendChild(ui.renderFieldGroup("Board Layout", [{ label: "Layout Style", field: state.boardLayout }], function (entry, changes) { updateField("boardLayout", changes); BrandHaus.ui.renderApp(); }, "How the zones above are composed into one image."));

    return wrap;
  }

  BrandHaus.branding = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    applyBrandDNAResult: applyBrandDNAResult,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
