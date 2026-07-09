/**
 * The AI Creator's Marketing Haus — Email Studio
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-ui.js's exposed
 * MarketingHaus.ui helpers (all must load first).
 *
 * Subject line + body copy for the common lifecycle/campaign email types —
 * Email Type drives the framing, Length controls how much body copy to
 * generate.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var EMAIL_TYPE_OPTIONS = sortAlpha([
    "newsletter", "promotional / sale", "welcome / onboarding", "abandoned cart",
    "product launch", "re-engagement / win-back", "thank you / order confirmation",
  ]);

  var SUBJECT_STYLE_OPTIONS = sortAlpha([
    "curiosity", "benefit-driven", "urgency", "personalized", "question", "emoji-forward", "plain / direct",
  ]);

  var LENGTH_OPTIONS = ["short (1-2 sentences + CTA)", "medium (a few short paragraphs)", "long (full newsletter-style)"];

  var CTA_OPTIONS = ["Shop Now", "Read More", "Claim Offer", "Complete Your Purchase", "Reply to This Email", "Update Preferences"];

  var PERSONALIZATION_OPTIONS = ["none", "first-name greeting", "purchase-history reference", "location-based"];

  var PRESETS = [
    {
      name: "Abandoned Cart Recovery Email",
      description: "Short, personalized, urgency-tinged nudge.",
      apply: { emailType: "abandoned cart", subjectStyle: "urgency", length: LENGTH_OPTIONS[0], cta: "Complete Your Purchase", personalization: "first-name greeting" },
    },
    {
      name: "Welcome Series Email #1",
      description: "Warm onboarding, medium length, no hard sell.",
      apply: { emailType: "welcome / onboarding", subjectStyle: "personalized", length: LENGTH_OPTIONS[1], cta: "Read More", personalization: "first-name greeting" },
    },
    {
      name: "Flash Sale Newsletter",
      description: "Urgency subject, medium length, shop-now CTA.",
      apply: { emailType: "promotional / sale", subjectStyle: "urgency", length: LENGTH_OPTIONS[1], cta: "Shop Now", personalization: "none" },
    },
    {
      name: "Win-Back Re-engagement Email",
      description: "Curiosity subject, personalized nudge to return.",
      apply: { emailType: "re-engagement / win-back", subjectStyle: "curiosity", length: LENGTH_OPTIONS[0], cta: "Claim Offer", personalization: "purchase-history reference" },
    },
  ];

  function buildInitialState() {
    return {
      emailType: makeField("", EMAIL_TYPE_OPTIONS),
      subjectStyle: makeField("", SUBJECT_STYLE_OPTIONS),
      topic: makeField("", [], { isFreeText: true }),
      length: makeField(LENGTH_OPTIONS[1], LENGTH_OPTIONS),
      cta: makeField("", CTA_OPTIONS),
      personalization: makeField("none", PERSONALIZATION_OPTIONS),
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
      emailType: Object.assign({}, state.emailType, { value: a.emailType, customValue: "" }),
      subjectStyle: Object.assign({}, state.subjectStyle, { value: a.subjectStyle, customValue: "" }),
      length: Object.assign({}, state.length, { value: a.length, customValue: "" }),
      cta: Object.assign({}, state.cta, { value: a.cta, customValue: "" }),
      personalization: Object.assign({}, state.personalization, { value: a.personalization, customValue: "" }),
    });
  }

  function randomize() {
    var state = store.getState();
    var entries = [
      { fieldName: "emailType", field: state.emailType },
      { fieldName: "subjectStyle", field: state.subjectStyle },
      { fieldName: "cta", field: state.cta },
      { fieldName: "personalization", field: state.personalization },
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
      { label: "Email Type", field: state.emailType },
      { label: "Subject Line Style", field: state.subjectStyle },
      { label: "Topic", field: state.topic },
      { label: "Length", field: state.length },
      { label: "Call to Action", field: state.cta },
      { label: "Personalization", field: state.personalization },
    ]);
    return MarketingHaus.engine.buildSentence({
      intro: "Write a marketing email, including a subject line, for:",
      fieldEntries: fieldEntries,
    });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var items = MarketingHaus.engine.resolveFields([
      { label: "Email Type", field: state.emailType },
      { label: "Subject Line Style", field: state.subjectStyle },
      { label: "Topic", field: state.topic },
      { label: "Length", field: state.length },
      { label: "Call to Action", field: state.cta },
      { label: "Personalization", field: state.personalization },
    ]);
    return items.length ? [{ title: "Email Studio", items: items }] : [];
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Email Type", [{ label: "Email Type", field: state.emailType }], function (entry, changes) { updateField("emailType", changes); MarketingHaus.ui.renderApp(); }));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Topic / What's This Email About", field: state.topic, placeholder: "e.g. \"reminder about the items left in their cart\"" }],
      function (entry, changes) { updateField("topic", changes); MarketingHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderFieldGroup("Style & Format", [
      { label: "Subject Line Style", field: state.subjectStyle },
      { label: "Length", field: state.length },
      { label: "Personalization", field: state.personalization },
    ], function (entry, changes) {
      if (entry.label === "Subject Line Style") updateField("subjectStyle", changes);
      else if (entry.label === "Length") updateField("length", changes);
      else updateField("personalization", changes);
      MarketingHaus.ui.renderApp();
    }));

    wrap.appendChild(ui.renderFieldGroup("Call to Action", [{ label: "Call to Action", field: state.cta }], function (entry, changes) { updateField("cta", changes); MarketingHaus.ui.renderApp(); }));

    return wrap;
  }

  MarketingHaus.email = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
