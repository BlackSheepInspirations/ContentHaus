/**
 * The AI Creator's Marketing Haus — Devotional & Motivation Card Studio
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-ui.js's exposed
 * MarketingHaus.ui helpers (all must load first).
 *
 * Covers faith-based and secular encouragement content alike — Faith
 * Tradition explicitly includes a non-faith "general inspirational"
 * option so this isn't Christian-only. Same "wording + visual style in
 * one prompt" pattern as Invitations & Stationery, since these are also
 * usually sold as one finished printable card.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var CARD_TYPE_OPTIONS = sortAlpha([
    "daily devotional", "scripture / verse card", "affirmation card", "prayer card",
    "motivational quote card", "recovery / sobriety encouragement card", "grief / comfort card",
  ]);

  var FAITH_TRADITION_OPTIONS = sortAlpha([
    "Christian", "non-denominational / spiritual", "secular / mindfulness-based",
    "Jewish", "Islamic", "general inspirational (no faith framing)",
  ]);

  var TONE_OPTIONS = sortAlpha(["gentle and comforting", "bold and empowering", "reflective and calm", "joyful and uplifting", "solemn and reverent"]);

  var FORMAT_OPTIONS = ["single card", "card deck / series (multiple cards)", "social-media-ready square graphic"];

  var PRESETS = [
    {
      name: "Daily Scripture Card (Christian)",
      description: "Gentle tone, floral watercolor border.",
      apply: { cardType: "scripture / verse card", faithTradition: "Christian", topic: "trust and anxiety", tone: "gentle and comforting", reference: "Philippians 4:6-7", visualStyle: "soft floral watercolor border", format: FORMAT_OPTIONS[0] },
    },
    {
      name: "Secular Morning Affirmation Card",
      description: "Bold, empowering, minimalist design.",
      apply: { cardType: "affirmation card", faithTradition: "secular / mindfulness-based", topic: "self-confidence and new beginnings", tone: "bold and empowering", reference: "", visualStyle: "minimalist line art with a sunrise motif", format: FORMAT_OPTIONS[0] },
    },
    {
      name: "Grief & Comfort Card",
      description: "Reflective, calm, soft muted palette.",
      apply: { cardType: "grief / comfort card", faithTradition: "general inspirational (no faith framing)", topic: "loss and remembrance", tone: "reflective and calm", reference: "", visualStyle: "soft muted watercolor with a single feather or dove motif", format: FORMAT_OPTIONS[0] },
    },
    {
      name: "Recovery Encouragement Card",
      description: "Joyful, uplifting, deck of daily cards.",
      apply: { cardType: "recovery / sobriety encouragement card", faithTradition: "non-denominational / spiritual", topic: "one day at a time, hope, and resilience", tone: "joyful and uplifting", reference: "", visualStyle: "warm sunrise gradient with simple line art", format: FORMAT_OPTIONS[1] },
    },
  ];

  function buildInitialState() {
    return {
      cardType: makeField("", CARD_TYPE_OPTIONS),
      faithTradition: makeField("", FAITH_TRADITION_OPTIONS),
      topic: makeField("", [], { isFreeText: true }),
      tone: makeField("", TONE_OPTIONS),
      reference: makeField("", [], { isFreeText: true }),
      visualStyle: makeField("", [], { isFreeText: true }),
      format: makeField(FORMAT_OPTIONS[0], FORMAT_OPTIONS),
    };
  }

  var store = MarketingHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    MarketingHaus.util.updateField(store, fieldName, changes);
  }

  function applyPreset(preset) {
    var a = preset.apply;
    var state = store.getState();
    store.setState({
      cardType: Object.assign({}, state.cardType, { value: a.cardType, customValue: "" }),
      faithTradition: Object.assign({}, state.faithTradition, { value: a.faithTradition, customValue: "" }),
      topic: Object.assign({}, state.topic, { value: a.topic }),
      tone: Object.assign({}, state.tone, { value: a.tone, customValue: "" }),
      reference: Object.assign({}, state.reference, { value: a.reference }),
      visualStyle: Object.assign({}, state.visualStyle, { value: a.visualStyle }),
      format: Object.assign({}, state.format, { value: a.format, customValue: "" }),
    });
  }

  function randomize() {
    var state = store.getState();
    var entries = [
      { fieldName: "cardType", field: state.cardType },
      { fieldName: "tone", field: state.tone },
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
    var fieldEntries = MarketingHaus.styleDNA.getVoiceEntries().concat(MarketingHaus.brandKit.getActiveKitEntries()).concat([
      { label: "Card Type", field: state.cardType },
      { label: "Faith Tradition / Framework", field: state.faithTradition },
      { label: "Topic / Focus", field: state.topic },
      { label: "Tone", field: state.tone },
      { label: "Scripture / Quote Reference", field: state.reference },
      { label: "Visual Style", field: state.visualStyle },
      { label: "Format", field: state.format },
    ]);
    return MarketingHaus.engine.buildSentence({
      intro: "Write the content for, and describe the visual design of, a:",
      fieldEntries: fieldEntries,
    });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var items = MarketingHaus.engine.resolveFields([
      { label: "Card Type", field: state.cardType },
      { label: "Faith Tradition / Framework", field: state.faithTradition },
      { label: "Topic / Focus", field: state.topic },
      { label: "Tone", field: state.tone },
      { label: "Scripture / Quote Reference", field: state.reference },
      { label: "Visual Style", field: state.visualStyle },
      { label: "Format", field: state.format },
    ]);
    return items.length ? [{ title: "Devotional & Motivation Card Studio", items: items }] : [];
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Card Type & Framework", [
      { label: "Card Type", field: state.cardType },
      { label: "Faith Tradition / Framework", field: state.faithTradition },
    ], function (entry, changes) {
      if (entry.label === "Card Type") updateField("cardType", changes);
      else updateField("faithTradition", changes);
      MarketingHaus.ui.renderApp();
    }, "\"General inspirational\" keeps the content secular — no faith framing at all."));

    wrap.appendChild(ui.renderPlainFieldRow(
      [
        { label: "Topic / Focus", field: state.topic, placeholder: "e.g. \"trust and anxiety\", \"gratitude\", \"new beginnings\"" },
        { label: "Scripture / Quote Reference (optional)", field: state.reference, placeholder: "e.g. \"Philippians 4:6-7\" or a specific quote to build around" },
      ],
      function (entry, changes) {
        if (entry.label === "Topic / Focus") updateField("topic", changes);
        else updateField("reference", changes);
        MarketingHaus.ui.renderApp();
      }
    ));

    wrap.appendChild(ui.renderFieldGroup("Tone & Format", [
      { label: "Tone", field: state.tone },
      { label: "Format", field: state.format },
    ], function (entry, changes) {
      if (entry.label === "Tone") updateField("tone", changes);
      else updateField("format", changes);
      MarketingHaus.ui.renderApp();
    }));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Visual Style (optional)", field: state.visualStyle, placeholder: "e.g. \"soft floral watercolor border\"" }],
      function (entry, changes) { updateField("visualStyle", changes); MarketingHaus.ui.renderApp(); }
    ));

    return wrap;
  }

  MarketingHaus.devotional = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
