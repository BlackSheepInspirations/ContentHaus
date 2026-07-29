/**
 * The AI Creator's Project Haus — Invitations & Stationery Studio
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-ui.js's exposed
 * ProductHaus.ui helpers (all must load first).
 *
 * Covers both halves of a card at once — the wording (names/date/time/
 * RSVP, in the right tone) and, optionally, a visual style descriptor for
 * the card design itself — since sellers here are usually producing one
 * finished printable, not text and art separately.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var makeField = ProductHaus.util.makeField;
  var sortAlpha = ProductHaus.util.sortAlpha;

  var ITEM_TYPE_OPTIONS = sortAlpha([
    "wedding invitation", "birthday invitation", "baby shower invitation", "bridal shower invitation",
    "graduation announcement", "holiday card", "thank you card", "save the date",
  ]);

  var WORDING_TONE_OPTIONS = sortAlpha([
    "formal / traditional", "casual / fun", "playful / whimsical", "elegant / romantic", "modern / minimal", "heartfelt / sentimental",
  ]);

  var LAYOUT_OPTIONS = ["flat card", "folded card", "digital / e-invite", "postcard"];

  var PRESETS = [
    {
      name: "Rustic Fall Wedding Invitation",
      description: "Elegant wording, watercolor florals, folded card.",
      apply: { itemType: "wedding invitation", occasion: "rustic fall wedding", wordingTone: "elegant / romantic", visualStyle: "watercolor florals in burnt orange and sage", layout: "folded card" },
    },
    {
      name: "Whimsical Kids Birthday Invite",
      description: "Playful tone, bold illustration style.",
      apply: { itemType: "birthday invitation", occasion: "superhero-themed 5th birthday", wordingTone: "playful / whimsical", visualStyle: "bold cartoon illustration style", layout: "flat card" },
    },
    {
      name: "Elegant Baby Shower Invite",
      description: "Heartfelt wording, soft pastel design.",
      apply: { itemType: "baby shower invitation", occasion: "spring garden baby shower", wordingTone: "heartfelt / sentimental", visualStyle: "soft pastel watercolor with delicate line art", layout: "flat card" },
    },
    {
      name: "Minimalist Holiday Card",
      description: "Modern tone, clean geometric design.",
      apply: { itemType: "holiday card", occasion: "modern family holiday card", wordingTone: "modern / minimal", visualStyle: "clean geometric line art with gold foil accents", layout: "flat card" },
    },
  ];

  function buildInitialState() {
    return {
      itemType: makeField("", ITEM_TYPE_OPTIONS),
      occasion: makeField("", [], { isFreeText: true }),
      keyDetails: makeField("", [], { isFreeText: true }),
      wordingTone: makeField("", WORDING_TONE_OPTIONS),
      visualStyle: makeField("", [], { isFreeText: true }),
      layout: makeField(LAYOUT_OPTIONS[0], LAYOUT_OPTIONS),
    };
  }

  var store = ProductHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    ProductHaus.util.updateField(store, fieldName, changes);
  }

  function applyPreset(preset) {
    var a = preset.apply;
    var state = store.getState();
    store.setState({
      itemType: Object.assign({}, state.itemType, { value: a.itemType, customValue: "" }),
      occasion: Object.assign({}, state.occasion, { value: a.occasion }),
      wordingTone: Object.assign({}, state.wordingTone, { value: a.wordingTone, customValue: "" }),
      visualStyle: Object.assign({}, state.visualStyle, { value: a.visualStyle }),
      layout: Object.assign({}, state.layout, { value: a.layout, customValue: "" }),
    });
  }

  function randomize() {
    var state = store.getState();
    var entries = [
      { fieldName: "itemType", field: state.itemType },
      { fieldName: "wordingTone", field: state.wordingTone },
      { fieldName: "layout", field: state.layout },
    ];
    entries.forEach(function (e) {
      if (e.field.includeInPrompt === false) return;
      var options = e.field.options || [];
      if (!options.length) return;
      updateField(e.fieldName, { value: options[Math.floor(Math.random() * options.length)], customValue: "" });
    });
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function assemblePrompt() {
    var state = store.getState();
    var fieldEntries = ProductHaus.styleDNA.getVoiceEntries().concat(ProductHaus.brandKit.getActiveKitEntries()).concat([
      { label: "Item Type", field: state.itemType },
      { label: "Occasion / Theme", field: state.occasion },
      { label: "Key Details to Include", field: state.keyDetails },
      { label: "Wording Tone", field: state.wordingTone },
      { label: "Visual Style", field: state.visualStyle },
      { label: "Layout", field: state.layout },
    ]);
    return ProductHaus.engine.buildSentence({
      intro: "Write the wording for, and create the visual design of, a:",
      fieldEntries: fieldEntries,
    });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var items = ProductHaus.engine.resolveFields([
      { label: "Item Type", field: state.itemType },
      { label: "Occasion / Theme", field: state.occasion },
      { label: "Key Details to Include", field: state.keyDetails },
      { label: "Wording Tone", field: state.wordingTone },
      { label: "Visual Style", field: state.visualStyle },
      { label: "Layout", field: state.layout },
    ]);
    return items.length ? [{ title: "Invitations & Stationery Studio", items: items }] : [];
  }

  function renderPanel() {
    var ui = ProductHaus.ui;
    var wrap = ui.el("div", { class: "pdh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); ProductHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Item Type", [{ label: "Item Type", field: state.itemType }], function (entry, changes) { updateField("itemType", changes); ProductHaus.ui.renderApp(); }));

    wrap.appendChild(ui.renderFieldGroup("Content Details", [
      { label: "Occasion / Theme", field: state.occasion, placeholder: "e.g. \"rustic fall wedding\"" },
      { label: "Key Details to Include", field: state.keyDetails, placeholder: "names, date, time, location, RSVP info" },
    ], function (entry, changes) {
      if (entry.label === "Occasion / Theme") updateField("occasion", changes);
      else updateField("keyDetails", changes);
      ProductHaus.ui.renderApp();
    }, "What the card should actually say."));

    wrap.appendChild(ui.renderFieldGroup("Wording & Format", [
      { label: "Wording Tone", field: state.wordingTone },
      { label: "Layout", field: state.layout },
    ], function (entry, changes) {
      if (entry.label === "Wording Tone") updateField("wordingTone", changes);
      else updateField("layout", changes);
      ProductHaus.ui.renderApp();
    }));

    wrap.appendChild(ui.renderFieldGroup("Visual Style", [
      { label: "Visual Style (optional)", field: state.visualStyle, placeholder: "e.g. \"watercolor florals in burnt orange and sage\"" },
    ], function (entry, changes) { updateField("visualStyle", changes); ProductHaus.ui.renderApp(); }));

    return wrap;
  }

  ProductHaus.invitations = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
