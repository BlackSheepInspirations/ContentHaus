/**
 * The AI Creator's Marketing Haus — Ad Copy & Creative Studio
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-ui.js's exposed
 * MarketingHaus.ui helpers (all must load first).
 *
 * Headline + body copy for paid ad platforms — Platform + Objective drive
 * the framing, Headline Style/Urgency/CTA drive the actual copy angle.
 * Variation count is pulled from the shared Business/Voice DNA bar (same
 * field every other studio already reads), not duplicated here.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var PLATFORM_OPTIONS = [
    "Meta (Facebook/Instagram) Ads", "Google Search Ads", "Google Display Ads",
    "TikTok Ads", "Pinterest Ads", "LinkedIn Ads",
  ];

  var OBJECTIVE_OPTIONS = sortAlpha([
    "brand awareness", "drive traffic", "generate leads", "drive sales / conversions",
    "app installs", "retarget past visitors",
  ]);

  var HEADLINE_STYLE_OPTIONS = sortAlpha([
    "benefit-driven", "curiosity / question", "urgency / scarcity",
    "social proof", "direct offer", "problem / solution",
  ]);

  var URGENCY_OPTIONS = ["none", "limited time", "limited quantity", "countdown / deadline"];

  var CTA_OPTIONS = ["Shop Now", "Learn More", "Sign Up", "Get Offer", "Download", "Book Now", "Subscribe"];

  var PRESETS = [
    {
      name: "Flash Sale Meta Ad",
      description: "Urgency-driven headline, limited-time offer.",
      apply: { platform: PLATFORM_OPTIONS[0], objective: "drive sales / conversions", headlineStyle: "urgency / scarcity", urgency: "limited time", cta: "Shop Now" },
    },
    {
      name: "Google Search Lead Gen Ad",
      description: "Direct offer, problem/solution framing.",
      apply: { platform: PLATFORM_OPTIONS[1], objective: "generate leads", headlineStyle: "problem / solution", urgency: "none", cta: "Sign Up" },
    },
    {
      name: "TikTok Awareness Ad",
      description: "Curiosity hook, no hard urgency.",
      apply: { platform: PLATFORM_OPTIONS[3], objective: "brand awareness", headlineStyle: "curiosity / question", urgency: "none", cta: "Learn More" },
    },
    {
      name: "Retargeting Offer Ad",
      description: "Social proof + countdown for past visitors.",
      apply: { platform: PLATFORM_OPTIONS[0], objective: "retarget past visitors", headlineStyle: "social proof", urgency: "countdown / deadline", cta: "Get Offer" },
    },
  ];

  function buildInitialState() {
    return {
      platform: makeField(PLATFORM_OPTIONS[0], PLATFORM_OPTIONS),
      objective: makeField("", OBJECTIVE_OPTIONS),
      offer: makeField("", [], { isFreeText: true }),
      headlineStyle: makeField("", HEADLINE_STYLE_OPTIONS),
      urgency: makeField("none", URGENCY_OPTIONS),
      cta: makeField("", CTA_OPTIONS),
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
      platform: Object.assign({}, state.platform, { value: a.platform, customValue: "" }),
      objective: Object.assign({}, state.objective, { value: a.objective, customValue: "" }),
      headlineStyle: Object.assign({}, state.headlineStyle, { value: a.headlineStyle, customValue: "" }),
      urgency: Object.assign({}, state.urgency, { value: a.urgency, customValue: "" }),
      cta: Object.assign({}, state.cta, { value: a.cta, customValue: "" }),
    });
  }

  function randomize() {
    var state = store.getState();
    var entries = [
      { fieldName: "objective", field: state.objective },
      { fieldName: "headlineStyle", field: state.headlineStyle },
      { fieldName: "urgency", field: state.urgency },
      { fieldName: "cta", field: state.cta },
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
      { label: "Platform", field: state.platform },
      { label: "Objective", field: state.objective },
      { label: "Product / Offer", field: state.offer },
      { label: "Headline Style", field: state.headlineStyle },
      { label: "Urgency Element", field: state.urgency },
      { label: "Call to Action", field: state.cta },
    ]);
    return MarketingHaus.engine.buildSentence({
      intro: "Write ad copy for:",
      fieldEntries: fieldEntries,
    });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var items = MarketingHaus.engine.resolveFields([
      { label: "Platform", field: state.platform },
      { label: "Objective", field: state.objective },
      { label: "Product / Offer", field: state.offer },
      { label: "Headline Style", field: state.headlineStyle },
      { label: "Urgency Element", field: state.urgency },
      { label: "Call to Action", field: state.cta },
    ]);
    return items.length ? [{ title: "Ad Copy & Creative Studio", items: items }] : [];
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Platform & Objective", [
      { label: "Platform", field: state.platform },
      { label: "Objective", field: state.objective },
    ], function (entry, changes) {
      if (entry.label === "Platform") updateField("platform", changes);
      else updateField("objective", changes);
      MarketingHaus.ui.renderApp();
    }));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Product / Offer", field: state.offer, placeholder: "e.g. \"our best-selling candle 3-pack, 20% off this week\"" }],
      function (entry, changes) { updateField("offer", changes); MarketingHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderFieldGroup("Angle", [
      { label: "Headline Style", field: state.headlineStyle },
      { label: "Urgency Element", field: state.urgency },
      { label: "Call to Action", field: state.cta },
    ], function (entry, changes) {
      if (entry.label === "Headline Style") updateField("headlineStyle", changes);
      else if (entry.label === "Urgency Element") updateField("urgency", changes);
      else updateField("cta", changes);
      MarketingHaus.ui.renderApp();
    }, "How many variations to generate is set by Variations in the bar above."));

    return wrap;
  }

  MarketingHaus.adcopy = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
