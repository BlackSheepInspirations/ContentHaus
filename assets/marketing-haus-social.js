/**
 * The AI Creator's Marketing Haus — Social Media Studio
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-ui.js's exposed
 * MarketingHaus.ui helpers (all must load first).
 *
 * One studio covering every common post shape (single post, carousel,
 * TikTok/Reels, Pinterest, LinkedIn, Story) rather than a separate mode
 * per platform — Content Format drives which extra fields show, same
 * "one field changes what else is relevant" pattern as Logo Studio's
 * tier toggle.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var FORMAT_OPTIONS = [
    "Instagram / Facebook single post",
    "Carousel / multi-slide sequence",
    "TikTok / Reels (hook + caption)",
    "Pinterest pin + description",
    "LinkedIn post",
    "Story text overlay",
  ];

  var SLIDE_COUNT_OPTIONS = ["3 slides", "4 slides", "5 slides", "6 slides", "7 slides", "8 slides", "9 slides", "10 slides"];

  var HOOK_STYLE_OPTIONS = sortAlpha([
    "question hook", "bold statement", "relatable pain point", "curiosity gap",
    "before / after", "\"you need this\"", "myth-busting", "quick tip / how-to",
  ]);

  var CTA_OPTIONS = sortAlpha([
    "shop now", "link in bio", "save this post", "comment below", "tag a friend",
    "DM us", "swipe up", "follow for more", "share with someone who needs this", "none",
  ]);

  var HASHTAG_STYLE_OPTIONS = ["none", "minimal (3-5 niche tags)", "broad reach mix", "branded hashtag included"];
  var EMOJI_USAGE_OPTIONS = ["none", "light touch", "expressive"];

  var PRESETS = [
    {
      name: "Product Launch Carousel",
      description: "Multi-slide sequence, curiosity hook, shop-now CTA.",
      apply: { format: FORMAT_OPTIONS[1], slideCount: "5 slides", hookStyle: "curiosity gap", cta: "shop now", hashtagStyle: "minimal (3-5 niche tags)", emojiUsage: "light touch" },
    },
    {
      name: "TikTok Hook + Caption",
      description: "Fast hook, relatable pain point, follow CTA.",
      apply: { format: FORMAT_OPTIONS[2], slideCount: "3 slides", hookStyle: "relatable pain point", cta: "follow for more", hashtagStyle: "broad reach mix", emojiUsage: "expressive" },
    },
    {
      name: "Pinterest Pin for Blog Post",
      description: "Search-friendly pin description, link in bio.",
      apply: { format: FORMAT_OPTIONS[3], slideCount: "3 slides", hookStyle: "quick tip / how-to", cta: "link in bio", hashtagStyle: "minimal (3-5 niche tags)", emojiUsage: "none" },
    },
    {
      name: "LinkedIn Thought Leadership Post",
      description: "Bold statement hook, no emojis, comment CTA.",
      apply: { format: FORMAT_OPTIONS[4], slideCount: "3 slides", hookStyle: "bold statement", cta: "comment below", hashtagStyle: "minimal (3-5 niche tags)", emojiUsage: "none" },
    },
  ];

  function buildInitialState() {
    return {
      format: makeField(FORMAT_OPTIONS[0], FORMAT_OPTIONS),
      topic: makeField("", [], { isFreeText: true }),
      slideCount: makeField("5 slides", SLIDE_COUNT_OPTIONS),
      hookStyle: makeField("", HOOK_STYLE_OPTIONS),
      cta: makeField("", CTA_OPTIONS),
      hashtagStyle: makeField("none", HASHTAG_STYLE_OPTIONS),
      emojiUsage: makeField("light touch", EMOJI_USAGE_OPTIONS),
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
      format: Object.assign({}, state.format, { value: a.format, customValue: "" }),
      slideCount: Object.assign({}, state.slideCount, { value: a.slideCount, customValue: "" }),
      hookStyle: Object.assign({}, state.hookStyle, { value: a.hookStyle, customValue: "" }),
      cta: Object.assign({}, state.cta, { value: a.cta, customValue: "" }),
      hashtagStyle: Object.assign({}, state.hashtagStyle, { value: a.hashtagStyle, customValue: "" }),
      emojiUsage: Object.assign({}, state.emojiUsage, { value: a.emojiUsage, customValue: "" }),
    });
  }

  function randomize() {
    var state = store.getState();
    var entries = [
      { fieldName: "hookStyle", field: state.hookStyle },
      { fieldName: "cta", field: state.cta },
      { fieldName: "hashtagStyle", field: state.hashtagStyle },
      { fieldName: "emojiUsage", field: state.emojiUsage },
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

  function isCarousel(state) {
    return MarketingHaus.engine.resolveFieldValue(state.format) === FORMAT_OPTIONS[1];
  }
  function isHookFormat(state) {
    var value = MarketingHaus.engine.resolveFieldValue(state.format);
    return value === FORMAT_OPTIONS[2] || value === FORMAT_OPTIONS[1];
  }

  function assemblePrompt() {
    var state = store.getState();
    var fieldEntries = MarketingHaus.styleDNA.getVoiceEntries().concat(MarketingHaus.brandKit.getActiveKitEntries()).concat([
      { label: "Format", field: state.format },
      { label: "Topic", field: state.topic },
    ]);
    if (isCarousel(state)) fieldEntries.push({ label: "Slide Count", field: state.slideCount });
    if (isHookFormat(state)) fieldEntries.push({ label: "Hook Style", field: state.hookStyle });
    fieldEntries.push(
      { label: "Call to Action", field: state.cta },
      { label: "Hashtag Style", field: state.hashtagStyle },
      { label: "Emoji Usage", field: state.emojiUsage }
    );
    return MarketingHaus.engine.buildSentence({
      intro: "Write social media content for:",
      fieldEntries: fieldEntries,
    });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var fields = [
      { label: "Format", field: state.format },
      { label: "Topic", field: state.topic },
    ];
    if (isCarousel(state)) fields.push({ label: "Slide Count", field: state.slideCount });
    if (isHookFormat(state)) fields.push({ label: "Hook Style", field: state.hookStyle });
    fields.push(
      { label: "Call to Action", field: state.cta },
      { label: "Hashtag Style", field: state.hashtagStyle },
      { label: "Emoji Usage", field: state.emojiUsage }
    );
    var items = MarketingHaus.engine.resolveFields(fields);
    return items.length ? [{ title: "Social Media Studio", items: items }] : [];
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Content Format", [{ label: "Format", field: state.format }], function (entry, changes) { updateField("format", changes); MarketingHaus.ui.renderApp(); }, "Changes which fields below actually apply."));

    wrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Topic / What's This Post About", field: state.topic, placeholder: "e.g. \"our new fall candle collection just dropped\"" }],
      function (entry, changes) { updateField("topic", changes); MarketingHaus.ui.renderApp(); }
    ));

    var conditionalFields = [];
    if (isCarousel(state)) conditionalFields.push({ label: "Slide Count", field: state.slideCount });
    if (isHookFormat(state)) conditionalFields.push({ label: "Hook Style", field: state.hookStyle });
    if (conditionalFields.length) {
      wrap.appendChild(ui.renderFieldGroup("Format Details", conditionalFields, function (entry, changes) {
        if (entry.label === "Slide Count") updateField("slideCount", changes);
        else updateField("hookStyle", changes);
        MarketingHaus.ui.renderApp();
      }, isCarousel(state) ? "How many slides in the sequence." : "Sets the tone of the opening line."));
    }

    wrap.appendChild(ui.renderFieldGroup("Engagement", [
      { label: "Call to Action", field: state.cta },
      { label: "Hashtag Style", field: state.hashtagStyle },
      { label: "Emoji Usage", field: state.emojiUsage },
    ], function (entry, changes) {
      if (entry.label === "Call to Action") updateField("cta", changes);
      else if (entry.label === "Hashtag Style") updateField("hashtagStyle", changes);
      else updateField("emojiUsage", changes);
      MarketingHaus.ui.renderApp();
    }));

    return wrap;
  }

  MarketingHaus.social = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
