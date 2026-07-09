/**
 * The AI Creator's Marketing Haus — Product Mockup Studio
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-ui.js's exposed
 * MarketingHaus.ui helpers (all must load first).
 *
 * Stages a finished design (built in the original Prompt Haus) onto a
 * real product in a styled scene — a marketing/selling activity, not an
 * image-creation one, which is why it lives here rather than in Prompt
 * Haus itself.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var makeGroupedField = MarketingHaus.util.makeGroupedField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var PRODUCT_GROUPS = [
    { label: "Apparel", options: sortAlpha(["t-shirt", "hoodie", "crewneck sweatshirt", "tank top", "long sleeve tee", "baby onesie"]) },
    { label: "Drinkware", options: sortAlpha(["coffee mug", "tumbler", "water bottle", "wine glass", "shot glass"]) },
    { label: "Candles", options: sortAlpha(["jar candle", "tin candle", "pillar candle"]) },
    { label: "Beverage Bottle Labels", options: sortAlpha(["wine bottle label", "beer bottle label", "water bottle label"]) },
    { label: "Perfume & Beauty", options: sortAlpha(["perfume bottle", "lotion bottle", "soap bar packaging", "lip balm tube"]) },
    { label: "Bags", options: sortAlpha(["tote bag", "drawstring bag", "makeup bag", "backpack"]) },
    { label: "Stationery", options: sortAlpha(["greeting card", "notebook cover", "sticker sheet", "planner cover"]) },
    { label: "Tech", options: sortAlpha(["phone case", "laptop sleeve", "mouse pad"]) },
    { label: "Home Decor", options: sortAlpha(["throw pillow", "blanket", "wall art / canvas", "doormat"]) },
  ];

  var PRESENTATION_OPTIONS = sortAlpha(["worn / being used", "flat lay", "on a table or surface", "held in hand", "styled lifestyle scene"]);

  var PROP_OPTIONS = sortAlpha(["shoes", "sunglasses", "coffee cup", "plants", "books", "jewelry", "candles", "blankets", "tech accessories", "seasonal decor"]);
  var PROP_CAP = 5;

  var SETTING_OPTIONS = sortAlpha([
    "marble countertop", "wooden table", "outdoor patio", "cozy bedroom", "minimalist studio",
    "coffee shop", "beach", "office desk", "seasonal backdrop", "linen backdrop",
  ]);

  var MOOD_OPTIONS = sortAlpha(["cozy", "minimalist", "luxury", "boho", "vibrant and colorful", "rustic", "modern", "elegant"]);

  var LIGHTING_OPTIONS = sortAlpha([
    "natural window light", "golden hour", "studio lighting, flat lay from above",
    "soft diffused light", "close-up macro detail", "wide angle establishing shot",
  ]);

  var PRESETS = [
    {
      name: "Cozy Coffee Mug Flat Lay",
      description: "Mug, warm styling, soft morning light.",
      apply: { product: "coffee mug", presentation: "flat lay", props: ["coffee cup", "plants", "books"], setting: "wooden table", mood: "cozy", lighting: "natural window light" },
    },
    {
      name: "Boho Tote Lifestyle",
      description: "Tote bag worn, boho outdoor scene.",
      apply: { product: "tote bag", presentation: "worn / being used", props: ["sunglasses", "jewelry"], setting: "beach", mood: "boho", lighting: "golden hour" },
    },
    {
      name: "Minimalist Studio Tee",
      description: "T-shirt, clean studio backdrop, no clutter.",
      apply: { product: "t-shirt", presentation: "worn / being used", props: [], setting: "minimalist studio", mood: "minimalist", lighting: "studio lighting, flat lay from above" },
    },
    {
      name: "Holiday Candle Table Setting",
      description: "Candle styled with seasonal decor.",
      apply: { product: "jar candle", presentation: "on a table or surface", props: ["seasonal decor", "blankets"], setting: "seasonal backdrop", mood: "cozy", lighting: "soft diffused light" },
    },
  ];

  function buildInitialState() {
    return {
      product: makeGroupedField("", PRODUCT_GROUPS),
      designDescription: makeField("", [], { isFreeText: true }),
      productColor: makeField("", [], { isFreeText: true }),
      presentation: makeField("", PRESENTATION_OPTIONS),
      props: PROP_OPTIONS.reduce(function (acc, prop) {
        acc[prop] = false;
        return acc;
      }, {}),
      setting: makeField("", SETTING_OPTIONS),
      mood: makeField("", MOOD_OPTIONS),
      lighting: makeField("", LIGHTING_OPTIONS),
    };
  }

  var store = MarketingHaus.util.createStore(buildInitialState());

  function selectedProps() {
    var state = store.getState();
    return PROP_OPTIONS.filter(function (p) { return state.props[p]; });
  }

  function toggleProp(prop, checked) {
    var state = store.getState();
    if (checked && selectedProps().length >= PROP_CAP) return;
    var next = Object.assign({}, state.props);
    next[prop] = checked;
    store.setState({ props: next });
  }

  function updateField(fieldName, changes) {
    MarketingHaus.util.updateField(store, fieldName, changes);
  }

  function applyPreset(preset) {
    var a = preset.apply;
    var nextProps = PROP_OPTIONS.reduce(function (acc, prop) {
      acc[prop] = a.props.indexOf(prop) !== -1;
      return acc;
    }, {});
    store.setState({
      product: Object.assign({}, store.getState().product, { value: a.product, customValue: "" }),
      presentation: Object.assign({}, store.getState().presentation, { value: a.presentation, customValue: "" }),
      props: nextProps,
      setting: Object.assign({}, store.getState().setting, { value: a.setting, customValue: "" }),
      mood: Object.assign({}, store.getState().mood, { value: a.mood, customValue: "" }),
      lighting: Object.assign({}, store.getState().lighting, { value: a.lighting, customValue: "" }),
    });
  }

  function randomize() {
    var state = store.getState();
    var entries = [
      { fieldName: "product", field: state.product },
      { fieldName: "presentation", field: state.presentation },
      { fieldName: "setting", field: state.setting },
      { fieldName: "mood", field: state.mood },
      { fieldName: "lighting", field: state.lighting },
    ];
    entries.forEach(function (e) {
      if (e.field.includeInPrompt === false) return;
      var options = e.field.options || [];
      if (!options.length) return;
      updateField(e.fieldName, { value: options[Math.floor(Math.random() * options.length)], customValue: "" });
    });
    var shuffledProps = PROP_OPTIONS.slice();
    for (var i = shuffledProps.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffledProps[i];
      shuffledProps[i] = shuffledProps[j];
      shuffledProps[j] = tmp;
    }
    var chosen = shuffledProps.slice(0, Math.floor(Math.random() * (PROP_CAP + 1)));
    store.setState({
      props: PROP_OPTIONS.reduce(function (acc, prop) {
        acc[prop] = chosen.indexOf(prop) !== -1;
        return acc;
      }, {}),
    });
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function assemblePrompt() {
    var state = store.getState();
    var fieldEntries = MarketingHaus.styleDNA.getVoiceEntries().concat(MarketingHaus.brandKit.getActiveKitEntries()).concat([
      { label: "Product", field: state.product },
      { label: "Design", field: state.designDescription },
      { label: "Product Color", field: state.productColor },
      { label: "Presentation", field: state.presentation },
      { label: "Props", field: makeField(selectedProps().join(", "), [], { includeInPrompt: selectedProps().length > 0 }) },
      { label: "Setting", field: state.setting },
      { label: "Mood", field: state.mood },
      { label: "Lighting", field: state.lighting },
    ]);
    return MarketingHaus.engine.buildSentence({
      intro: "Create a photorealistic product mockup:",
      fieldEntries: fieldEntries,
    });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var items = MarketingHaus.engine.resolveFields([
      { label: "Product", field: state.product },
      { label: "Design", field: state.designDescription },
      { label: "Product Color", field: state.productColor },
      { label: "Presentation", field: state.presentation },
      { label: "Setting", field: state.setting },
      { label: "Mood", field: state.mood },
      { label: "Lighting", field: state.lighting },
    ]);
    if (selectedProps().length) items.push({ label: "Props", value: selectedProps().join(", ") });
    return items.length ? [{ title: "Mockup Studio", items: items }] : [];
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Hero Product", [{ label: "Product", field: store.getState().product }], function (entry, changes) { updateField("product", changes); MarketingHaus.ui.renderApp(); }));

    wrap.appendChild(ui.renderPlainFieldRow(
      [
        { label: "Your Design / Print", field: store.getState().designDescription, placeholder: "Describe the design you already created (e.g. \"a watercolor floral wreath with the words Bless This Home\")" },
        { label: "Product Color / Variant", field: store.getState().productColor, placeholder: "e.g. sage green, black, natural wood" },
      ],
      function (entry, changes) {
        if (entry.label === "Your Design / Print") updateField("designDescription", changes);
        else updateField("productColor", changes);
        MarketingHaus.ui.renderApp();
      }
    ));

    wrap.appendChild(ui.renderFieldGroup("Presentation Style", [{ label: "Presentation", field: store.getState().presentation }], function (entry, changes) { updateField("presentation", changes); MarketingHaus.ui.renderApp(); }));

    wrap.appendChild(ui.renderCappedChecklist({
      title: "Surrounding Props",
      subtitle: "Pick up to " + PROP_CAP + ".",
      icon: "sparkle",
      items: PROP_OPTIONS,
      selected: selectedProps(),
      cap: PROP_CAP,
      onToggle: function (prop, checked) { toggleProp(prop, checked); MarketingHaus.ui.renderApp(); },
    }));

    wrap.appendChild(ui.renderFieldGroup("Setting", [{ label: "Setting", field: store.getState().setting }], function (entry, changes) { updateField("setting", changes); MarketingHaus.ui.renderApp(); }));

    wrap.appendChild(ui.renderFieldGroup("Style", [
      { label: "Styling Mood", field: store.getState().mood },
      { label: "Lighting & Camera Angle", field: store.getState().lighting },
    ], function (entry, changes) {
      if (entry.label === "Styling Mood") updateField("mood", changes);
      else updateField("lighting", changes);
      MarketingHaus.ui.renderApp();
    }));

    return wrap;
  }

  MarketingHaus.mockup = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
