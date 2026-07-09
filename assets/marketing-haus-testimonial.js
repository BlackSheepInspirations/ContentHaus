/**
 * The AI Creator's Marketing Haus — Testimonial & Social Proof Formatter
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-ui.js's exposed
 * MarketingHaus.ui helpers (all must load first).
 *
 * A transformation tool, not a from-scratch generator — the input is the
 * customer's actual raw words, which get carried through as a quoted
 * block rather than folded into a comma-joined descriptor list like every
 * other studio, so the AI reformats real feedback instead of inventing a
 * new quote.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var OUTPUT_FORMAT_OPTIONS = sortAlpha([
    "Instagram testimonial graphic caption", "website testimonial card", "star-rating review snippet",
    "before/after style testimonial", "video testimonial script / talking points", "case-study style long-form",
  ]);

  var POLISH_LEVEL_OPTIONS = ["light touch (fix grammar only)", "moderate polish (tighten wording, keep their voice)", "full rewrite (punchy marketing version)"];

  var ATTRIBUTION_OPTIONS = sortAlpha([
    "full name and location", "first name and last initial", "anonymous / first initial only",
    "\"Verified Buyer\" only", "include star rating",
  ]);

  var PRESETS = [
    {
      name: "Polish for Instagram Graphic",
      description: "Moderate polish, short caption format.",
      apply: { outputFormat: "Instagram testimonial graphic caption", polishLevel: POLISH_LEVEL_OPTIONS[1], attribution: "first name and last initial" },
    },
    {
      name: "Website Testimonial Card",
      description: "Light touch, keeps their authentic voice.",
      apply: { outputFormat: "website testimonial card", polishLevel: POLISH_LEVEL_OPTIONS[0], attribution: "full name and location" },
    },
    {
      name: "Star Rating Review Snippet",
      description: "Short snippet with star rating included.",
      apply: { outputFormat: "star-rating review snippet", polishLevel: POLISH_LEVEL_OPTIONS[0], attribution: "include star rating" },
    },
    {
      name: "Video Testimonial Talking Points",
      description: "Full rewrite into spoken-style talking points.",
      apply: { outputFormat: "video testimonial script / talking points", polishLevel: POLISH_LEVEL_OPTIONS[2], attribution: "first name and last initial" },
    },
  ];

  function buildInitialState() {
    return {
      rawFeedback: makeField("", [], { isFreeText: true }),
      outputFormat: makeField("", OUTPUT_FORMAT_OPTIONS),
      polishLevel: makeField(POLISH_LEVEL_OPTIONS[1], POLISH_LEVEL_OPTIONS),
      highlightFocus: makeField("", [], { isFreeText: true }),
      attribution: makeField("", ATTRIBUTION_OPTIONS),
    };
  }

  var store = MarketingHaus.util.createStore(buildInitialState());

  function resolved(field) {
    return MarketingHaus.engine.resolveFieldValue(field);
  }

  function updateField(fieldName, changes) {
    MarketingHaus.util.updateField(store, fieldName, changes);
  }

  function applyPreset(preset) {
    var a = preset.apply;
    var state = store.getState();
    store.setState({
      outputFormat: Object.assign({}, state.outputFormat, { value: a.outputFormat, customValue: "" }),
      polishLevel: Object.assign({}, state.polishLevel, { value: a.polishLevel, customValue: "" }),
      attribution: Object.assign({}, state.attribution, { value: a.attribution, customValue: "" }),
    });
  }

  function randomize() {
    // Intentionally not randomized — the raw feedback and how it's
    // presented shouldn't be scrambled the way descriptor fields are
    // elsewhere; the only "random" thing here would be someone else's
    // words, which defeats the point.
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function assemblePrompt() {
    var state = store.getState();
    var rawFeedback = resolved(state.rawFeedback);
    var format = resolved(state.outputFormat);
    var polish = resolved(state.polishLevel);
    var highlight = resolved(state.highlightFocus);
    var attribution = resolved(state.attribution);
    var voiceDescriptors = MarketingHaus.engine.resolveFields(MarketingHaus.styleDNA.getVoiceEntries()).map(function (e) { return e.value; });
    voiceDescriptors = voiceDescriptors.concat(MarketingHaus.engine.resolveFields(MarketingHaus.brandKit.getActiveKitEntries()).map(function (e) { return e.value; }));

    var instructionBits = [];
    if (format) instructionBits.push("formatted as a " + format);
    if (polish) instructionBits.push(polish);
    if (highlight) instructionBits.push("highlighting: " + highlight);
    if (attribution) instructionBits.push("attributed as " + attribution);
    instructionBits = instructionBits.concat(voiceDescriptors);

    var intro = "Reformat this customer feedback into polished marketing testimonial content";
    var instructionText = instructionBits.length ? ", " + instructionBits.join(", ") + ":" : ":";
    var feedbackBlock = rawFeedback
      ? ' Original feedback: "' + rawFeedback + '"'
      : " (No original feedback pasted in yet — add the customer's actual words above.)";

    var text = intro + instructionText + feedbackBlock;
    var fragments = instructionBits.concat(rawFeedback ? [rawFeedback] : []);
    return { text: text, fragments: fragments };
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var items = MarketingHaus.engine.resolveFields([
      { label: "Raw Feedback", field: state.rawFeedback },
      { label: "Output Format", field: state.outputFormat },
      { label: "Polish Level", field: state.polishLevel },
      { label: "Highlight Focus", field: state.highlightFocus },
      { label: "Attribution Style", field: state.attribution },
    ]);
    return items.length ? [{ title: "Testimonial & Social Proof Formatter", items: items }] : [];
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });
    var state = store.getState();

    wrap.appendChild(ui.el("p", { class: "mh-logo-callout" }, [
      ui.icon("shield"),
      ui.el("span", { text: "Only use feedback you have permission to share publicly — check your platform's terms (e.g. marketplace review policies) before reposting a customer's exact words as a testimonial." }),
    ]));

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Raw Feedback / Quote — paste the customer's actual words", field: state.rawFeedback, placeholder: "e.g. \"omg i love this so much!! shipping was fast too, will def buy again\"" }],
      function (entry, changes) { updateField("rawFeedback", changes); MarketingHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderFieldGroup("Format & Polish", [
      { label: "Output Format", field: state.outputFormat },
      { label: "Polish Level", field: state.polishLevel },
    ], function (entry, changes) {
      if (entry.label === "Output Format") updateField("outputFormat", changes);
      else updateField("polishLevel", changes);
      MarketingHaus.ui.renderApp();
    }));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Highlight Focus (optional)", field: state.highlightFocus, placeholder: "e.g. \"focus on the fast shipping and quality\"" }],
      function (entry, changes) { updateField("highlightFocus", changes); MarketingHaus.ui.renderApp(); }
    ));

    wrap.appendChild(ui.renderFieldGroup("Attribution", [{ label: "Attribution Style", field: state.attribution }], function (entry, changes) { updateField("attribution", changes); MarketingHaus.ui.renderApp(); }));

    return wrap;
  }

  MarketingHaus.testimonial = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
