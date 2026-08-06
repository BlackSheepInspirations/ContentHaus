/**
 * The AI Creator's Marketing Haus — Sales & Landing Page Studio
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-ui.js's exposed
 * MarketingHaus.ui helpers (all must load first).
 *
 * Covers everything from a short product description up to a full
 * multi-section landing/sales page — Content Type decides whether the
 * Sections checklist (structural, page-form only) applies. Like Branding
 * Studio, this writes explicit named zones instead of a flat comma list
 * once a page format is picked, since a landing page has real structure
 * an AI needs spelled out to get right.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var CONTENT_TYPE_OPTIONS = ["Product Description (short)", "Landing Page (headline + sections)", "Sales Page (long-form persuasive)"];

  var SOCIAL_PROOF_OPTIONS = ["none", "customer testimonial callout", "number / stat-based (e.g. \"10,000+ happy customers\")", "media / press mention style"];

  var PRICE_FRAMING_OPTIONS = ["none", "value-stack framing", "urgency / scarcity", "payment-plan / affordability", "guarantee-focused"];

  var SECTION_OPTIONS = ["Headline", "Subheadline", "Benefits", "How It Works", "Testimonials", "FAQ", "Guarantee", "Final CTA"];
  var SECTION_CAP = SECTION_OPTIONS.length;

  // Tone + Audience now live per-studio (were shared in the DNA bar).
  var TONE_OPTIONS = MarketingHaus.styleDNA.TONE_OPTIONS;

  var MAX_BENEFITS = 5;

  var PRESETS = [
    {
      name: "Quick Product Description",
      description: "Short single-paragraph product copy.",
      apply: { contentType: CONTENT_TYPE_OPTIONS[0], benefits: ["Handmade quality", "Fast shipping"], socialProof: "none", priceFraming: "none", sections: [] },
    },
    {
      name: "Full Landing Page",
      description: "Headline through final CTA, value-stack pricing.",
      apply: { contentType: CONTENT_TYPE_OPTIONS[1], benefits: ["Saves you time", "Backed by a guarantee", "Loved by thousands"], socialProof: "customer testimonial callout", priceFraming: "value-stack framing", sections: ["Headline", "Subheadline", "Benefits", "Testimonials", "Final CTA"] },
    },
    {
      name: "Long-Form Sales Page",
      description: "Objection-handling, guarantee-focused, full structure.",
      apply: { contentType: CONTENT_TYPE_OPTIONS[2], benefits: ["Proven results", "Risk-free guarantee", "Limited availability"], socialProof: "number / stat-based (e.g. \"10,000+ happy customers\")", priceFraming: "guarantee-focused", sections: SECTION_OPTIONS.slice() },
    },
  ];

  function buildInitialState() {
    return {
      tone: makeField("", TONE_OPTIONS),
      audience: makeField("", [], { isFreeText: true }),
      contentType: makeField(CONTENT_TYPE_OPTIONS[0], CONTENT_TYPE_OPTIONS),
      offer: makeField("", [], { isFreeText: true }),
      benefits: [],
      objection: makeField("", [], { isFreeText: true }),
      socialProof: makeField("none", SOCIAL_PROOF_OPTIONS),
      priceFraming: makeField("none", PRICE_FRAMING_OPTIONS),
      sections: SECTION_OPTIONS.reduce(function (acc, s) { acc[s] = false; return acc; }, {}),
    };
  }

  var store = MarketingHaus.util.createStore(buildInitialState());

  function resolved(field) {
    return MarketingHaus.engine.resolveFieldValue(field);
  }

  function updateField(fieldName, changes) {
    MarketingHaus.util.updateField(store, fieldName, changes);
  }

  function isPageForm(state) {
    return resolved(state.contentType) !== CONTENT_TYPE_OPTIONS[0];
  }

  function selectedSections() {
    var state = store.getState();
    return SECTION_OPTIONS.filter(function (s) { return state.sections[s]; });
  }

  function toggleSection(section, checked) {
    var state = store.getState();
    var next = Object.assign({}, state.sections);
    next[section] = checked;
    store.setState({ sections: next });
  }

  function addBenefit() {
    var state = store.getState();
    if (state.benefits.length >= MAX_BENEFITS) return;
    store.setState({ benefits: state.benefits.concat([""]) });
  }
  function updateBenefit(index, value) {
    var state = store.getState();
    var next = state.benefits.slice();
    next[index] = value;
    store.setState({ benefits: next });
  }
  function removeBenefit(index) {
    var state = store.getState();
    store.setState({ benefits: state.benefits.filter(function (_, i) { return i !== index; }) });
  }

  function applyPreset(preset) {
    var a = preset.apply;
    var state = store.getState();
    store.setState({
      contentType: Object.assign({}, state.contentType, { value: a.contentType, customValue: "" }),
      benefits: a.benefits.slice(),
      socialProof: Object.assign({}, state.socialProof, { value: a.socialProof, customValue: "" }),
      priceFraming: Object.assign({}, state.priceFraming, { value: a.priceFraming, customValue: "" }),
      sections: SECTION_OPTIONS.reduce(function (acc, s) { acc[s] = a.sections.indexOf(s) !== -1; return acc; }, {}),
    });
  }

  function randomize() {
    var state = store.getState();
    if (state.tone.includeInPrompt !== false) {
      updateField("tone", { value: TONE_OPTIONS[Math.floor(Math.random() * TONE_OPTIONS.length)], customValue: "" });
    }
    if (state.socialProof.includeInPrompt !== false) {
      var sp = SOCIAL_PROOF_OPTIONS.filter(function (o) { return o !== "none"; });
      updateField("socialProof", { value: sp[Math.floor(Math.random() * sp.length)], customValue: "" });
    }
    if (state.priceFraming.includeInPrompt !== false) {
      var pf = PRICE_FRAMING_OPTIONS.filter(function (o) { return o !== "none"; });
      updateField("priceFraming", { value: pf[Math.floor(Math.random() * pf.length)], customValue: "" });
    }
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function assemblePrompt() {
    var state = store.getState();
    var contentType = resolved(state.contentType) || CONTENT_TYPE_OPTIONS[0];
    var pageForm = isPageForm(state);
    var offer = resolved(state.offer);
    var benefits = state.benefits.map(function (v) { return (v || "").trim(); }).filter(Boolean);
    var objection = resolved(state.objection);
    var socialProof = resolved(state.socialProof);
    var priceFraming = resolved(state.priceFraming);
    var sections = selectedSections();

    var zones = [];
    var fragments = [];
    function addZone(text, fragment) {
      if (!text) return;
      zones.push(text);
      if (fragment) fragments.push(fragment);
    }

    MarketingHaus.engine.resolveFields(MarketingHaus.styleDNA.getVoiceEntries().concat([
      { label: "Tone", field: state.tone },
      { label: "Audience", field: state.audience },
    ])).forEach(function (entry) {
      addZone(entry.value, entry.value);
    });
    MarketingHaus.brandKit.getActiveKitEntries().forEach(function (entry) {
      var value = MarketingHaus.engine.resolveFieldValue(entry.field);
      if (value) addZone(value, value);
    });

    if (offer) addZone("what's being sold: " + offer, offer);
    if (benefits.length) addZone("key benefits to highlight: " + benefits.join(", "), benefits.join(", "));
    if (objection) addZone("address this objection head-on: " + objection, objection);
    if (socialProof && socialProof.toLowerCase() !== "none") addZone("include social proof styled as " + socialProof, socialProof);
    if (priceFraming && priceFraming.toLowerCase() !== "none") addZone("frame the price/offer using " + priceFraming, priceFraming);
    if (pageForm && sections.length) addZone("structure the page with these sections in order: " + sections.join(", "), sections.join(", "));

    var intro = pageForm
      ? "Write " + contentType + " copy, laid out section by section, covering:"
      : "Write a " + contentType.replace(" (short)", "").toLowerCase() + " covering:";
    var text = zones.length ? intro + " " + zones.join("; ") + "." : intro;
    return { text: text, fragments: fragments, skipPlatformFormat: true }; // sales copy is text
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var groups = [];
    var core = MarketingHaus.engine.resolveFields([
      { label: "Tone", field: state.tone },
      { label: "Audience", field: state.audience },
      { label: "Content Type", field: state.contentType },
      { label: "Product / Offer", field: state.offer },
      { label: "Objection to Address", field: state.objection },
      { label: "Social Proof", field: state.socialProof },
      { label: "Price Framing", field: state.priceFraming },
    ]);
    var benefits = state.benefits.map(function (v) { return (v || "").trim(); }).filter(Boolean);
    if (benefits.length) core.push({ label: "Key Benefits", value: benefits.join(", ") });
    if (core.length) groups.push({ title: "Sales & Landing Page Studio", items: core });

    var sections = selectedSections();
    if (isPageForm(state) && sections.length) groups.push({ title: "Sections", items: [{ label: "Included", value: sections.join(", ") }] });

    return groups;
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Voice", [
      { label: "Tone", field: state.tone },
      { label: "Audience", field: state.audience, placeholder: "e.g. first-time buyers comparing options" },
    ], function (entry, changes) {
      if (entry.label === "Tone") updateField("tone", changes);
      else updateField("audience", changes);
      MarketingHaus.ui.renderApp();
    }, "How it sounds and who it's for."));

    wrap.appendChild(ui.renderFieldGroup("Content Type", [{ label: "Content Type", field: state.contentType }], function (entry, changes) { updateField("contentType", changes); MarketingHaus.ui.renderApp(); }, "Changes whether the Sections checklist below applies."));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Product / Offer", field: state.offer, placeholder: "e.g. \"our 12-week fitness coaching program\"" }],
      function (entry, changes) { updateField("offer", changes); MarketingHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderTextSlotList({
      title: "Key Benefits",
      subtitle: "Up to " + MAX_BENEFITS + " short benefits to highlight.",
      icon: "sparkle",
      values: state.benefits,
      max: MAX_BENEFITS,
      singular: "Benefit",
      placeholder: "e.g. Saves you 5 hours a week",
      onUpdate: function (index, value) { updateBenefit(index, value); },
      onAdd: function () { addBenefit(); MarketingHaus.ui.renderApp(); },
      onRemove: function (index) { removeBenefit(index); MarketingHaus.ui.renderApp(); },
    }));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Objection to Address (optional)", field: state.objection, placeholder: "e.g. \"worried it's too expensive\"" }],
      function (entry, changes) { updateField("objection", changes); MarketingHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderFieldGroup("Persuasion", [
      { label: "Social Proof", field: state.socialProof },
      { label: "Price Framing", field: state.priceFraming },
    ], function (entry, changes) {
      if (entry.label === "Social Proof") updateField("socialProof", changes);
      else updateField("priceFraming", changes);
      MarketingHaus.ui.renderApp();
    }));

    if (isPageForm(state)) {
      wrap.appendChild(ui.renderCappedChecklist({
        title: "Sections to Include",
        subtitle: "Pick as many as apply — shown in the order listed.",
        icon: "document",
        items: SECTION_OPTIONS,
        selected: selectedSections(),
        cap: SECTION_CAP,
        onToggle: function (section, checked) { toggleSection(section, checked); MarketingHaus.ui.renderApp(); },
      }));
    }

    return wrap;
  }

  MarketingHaus.sales = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
