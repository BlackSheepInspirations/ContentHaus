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
 *
 * Two things fixed/added in this rebuild:
 * 1. The Design/Print field is a placeholder for artwork the creator
 *    already made — but Niche/Theme/Holiday/Mood used to get folded into
 *    the same flat sentence with no guardrail, so the AI would paint that
 *    styling directly onto the product's print surface. assemblePrompt()
 *    now adds an explicit outro clause locking the print area to exactly
 *    what was described (or blank) whenever any of those fields are set.
 * 2. A real Model/Person system (appearance/clothing/hairstyle/pose),
 *    a lifestyle Background field (distinct from the tabletop Setting
 *    field), a much larger Props & Accessories list with a freeform
 *    add-your-own box (reused as tabletop styling OR model accessories),
 *    and a compact opt-in Video Motion Prompt companion — same field
 *    vocabulary as marketing-haus-generators-videomotion.js, duplicated
 *    inline here rather than shared, since this Studio isn't built on
 *    the generator engine.
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

  var PRESENTATION_OPTIONS_PRODUCT_ONLY = sortAlpha(["flat lay", "held in a hand (cropped, no visible model)", "on a table or surface"]);
  var PRESENTATION_OPTIONS_WITH_MODEL = sortAlpha(["held by the model", "styled lifestyle scene, model in full view", "the model is sitting with it", "the model is walking with it", "worn by the model"]);

  var ITEM_OPTIONS = sortAlpha([
    "balloons", "beach towel", "bicycle", "blankets & throws", "books", "camera", "candles",
    "coffee cup", "dog or cat (pet)", "earbuds / headphones", "flowers / floral bouquet",
    "gift box, wrapped", "grocery / shopping bags", "handbag / purse", "hat or cap",
    "jewelry (necklace, rings)", "laptop or tablet", "makeup & beauty items", "notebook & pen",
    "perfume or lotion bottle", "phone", "picnic basket", "plants (potted greenery)", "scarf",
    "seasonal decor", "shoes", "skateboard", "smartwatch", "sunglasses", "tea cup or teapot",
    "umbrella", "water bottle", "wine glass", "wrapped snack or treat",
  ]);
  var ITEM_CAP = 6;

  var SETTING_OPTIONS = sortAlpha([
    "marble countertop", "wooden table", "outdoor patio", "cozy bedroom", "minimalist studio",
    "coffee shop", "beach", "office desk", "seasonal backdrop", "linen backdrop",
  ]);

  var BACKGROUND_OPTIONS = sortAlpha([
    "outdoors in nature", "city street / urban", "urban rooftop with skyline view", "public park",
    "beach / seaside", "gym or fitness studio", "cozy home interior", "coffee shop / café interior",
    "café patio / outdoor seating", "garden", "forest / wooded trail", "poolside",
    "office / workspace", "farmers market",
  ]);

  var MOOD_OPTIONS = sortAlpha(["cozy", "minimalist", "luxury", "boho", "vibrant and colorful", "rustic", "modern", "elegant"]);

  var LIGHTING_OPTIONS = sortAlpha([
    "natural window light", "golden hour", "studio lighting, flat lay from above",
    "soft diffused light", "close-up macro detail", "wide angle establishing shot",
  ]);

  var MODEL_CLOTHING_OPTIONS = sortAlpha(["Athletic / Activewear", "Beachwear", "Business Casual", "Casual Everyday Outfit", "Cozy Loungewear", "Seasonal Outerwear (Jacket/Coat)", "Streetwear"]);
  var MODEL_HAIRSTYLE_OPTIONS = sortAlpha(["Braids", "Bun / Updo", "Curly", "Natural / Down", "Ponytail", "Short & Textured", "Straight & Sleek"]);
  var MODEL_POSE_OPTIONS = sortAlpha(["Direct Eye Contact with Camera", "Laughing / Candid Moment", "Looking Off-Camera", "Mid-Action (e.g. Sipping, Adjusting)", "Sitting", "Standing, Relaxed", "Walking"]);

  // Video Motion Prompt companion — vocabulary + assembler now come from
  // the shared module marketing-haus-motion.js (also used by the
  // standalone Video Motion Prompt quick-gen), so there is one source of
  // truth. Both entry points remain; only the duplicated copy is gone.
  var VIDEO_TOOL_OPTIONS = MarketingHaus.motion.TOOL_OPTIONS;
  var VIDEO_CAMERA_OPTIONS = MarketingHaus.motion.CAMERA_OPTIONS;
  var VIDEO_DURATION_OPTIONS = MarketingHaus.motion.DURATION_OPTIONS;
  var VIDEO_AUDIO_OPTIONS = MarketingHaus.motion.AUDIO_OPTIONS;
  var VIDEO_QUALITY_OPTIONS = MarketingHaus.motion.QUALITY_OPTIONS;

  var PRESETS = [
    {
      name: "Cozy Coffee Mug Flat Lay",
      description: "Mug, warm styling, soft morning light.",
      apply: { product: "coffee mug", presentation: "flat lay", items: ["coffee cup", "plants (potted greenery)", "books"], setting: "wooden table", mood: "cozy", lighting: "natural window light" },
    },
    {
      name: "Boho Tote Flat Lay",
      description: "Tote bag styled with boho accessories.",
      apply: { product: "tote bag", presentation: "on a table or surface", items: ["sunglasses", "jewelry (necklace, rings)"], setting: "linen backdrop", mood: "boho", lighting: "golden hour" },
    },
    {
      name: "Minimalist Studio Tee",
      description: "T-shirt, clean studio backdrop, no clutter.",
      apply: { product: "t-shirt", presentation: "flat lay", items: [], setting: "minimalist studio", mood: "minimalist", lighting: "studio lighting, flat lay from above" },
    },
    {
      name: "Holiday Candle Table Setting",
      description: "Candle styled with seasonal decor.",
      apply: { product: "jar candle", presentation: "on a table or surface", items: ["seasonal decor", "blankets & throws"], setting: "seasonal backdrop", mood: "cozy", lighting: "soft diffused light" },
    },
    {
      name: "Guy Wearing It Outdoors",
      description: "Model outdoors, tee worn, golden hour.",
      apply: {
        product: "t-shirt", modelEnabled: true, presentation: "worn by the model",
        modelAppearance: "a man in his 20s-30s, casual and approachable",
        modelClothing: "Casual Everyday Outfit", modelHairstyle: "Short & Textured", modelPose: "Standing, Relaxed",
        items: ["sunglasses", "water bottle"], background: "outdoors in nature", mood: "vibrant and colorful", lighting: "golden hour",
      },
    },
    {
      name: "Girls in the City",
      description: "Two models, streetwear, urban lifestyle scene.",
      apply: {
        product: "hoodie", modelEnabled: true, presentation: "styled lifestyle scene, model in full view",
        modelAppearance: "two women in their 20s, friends laughing together",
        modelClothing: "Streetwear", modelHairstyle: "Natural / Down", modelPose: "Laughing / Candid Moment",
        items: ["handbag / purse", "phone"], background: "city street / urban", mood: "modern", lighting: "wide angle establishing shot",
      },
    },
  ];

  function buildInitialState() {
    return {
      product: makeGroupedField("", PRODUCT_GROUPS),
      designDescription: makeField("", [], { isFreeText: true }),
      productColor: makeField("", [], { isFreeText: true }),
      modelEnabled: false,
      presentation: makeField("", PRESENTATION_OPTIONS_PRODUCT_ONLY),
      modelAppearance: makeField("", [], { isFreeText: true }),
      modelClothing: makeField("", MODEL_CLOTHING_OPTIONS),
      modelHairstyle: makeField("", MODEL_HAIRSTYLE_OPTIONS),
      modelPose: makeField("", MODEL_POSE_OPTIONS),
      setting: makeField("", SETTING_OPTIONS),
      background: makeField("", BACKGROUND_OPTIONS),
      mood: makeField("", MOOD_OPTIONS),
      lighting: makeField("", LIGHTING_OPTIONS),
      items: ITEM_OPTIONS.reduce(function (acc, item) {
        acc[item] = false;
        return acc;
      }, {}),
      customItems: makeField("", [], { isFreeText: true }),
      videoEnabled: false,
      videoMotion: makeField("", [], { isFreeText: true }),
      videoTool: makeField(VIDEO_TOOL_OPTIONS[0], VIDEO_TOOL_OPTIONS),
      videoCamera: makeField(VIDEO_CAMERA_OPTIONS[0], VIDEO_CAMERA_OPTIONS),
      videoDuration: makeField(VIDEO_DURATION_OPTIONS[1], VIDEO_DURATION_OPTIONS),
      videoAudio: makeField(VIDEO_AUDIO_OPTIONS[0], VIDEO_AUDIO_OPTIONS),
      videoQuality: makeField(VIDEO_QUALITY_OPTIONS[0], VIDEO_QUALITY_OPTIONS),
    };
  }

  var store = MarketingHaus.util.createStore(buildInitialState());

  function selectedItems() {
    var state = store.getState();
    return ITEM_OPTIONS.filter(function (p) { return state.items[p]; });
  }

  function resolvedItemsList() {
    var custom = (store.getState().customItems.value || "")
      .split(",")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    return selectedItems().concat(custom);
  }

  function toggleItem(item, checked) {
    var state = store.getState();
    if (checked && selectedItems().length >= ITEM_CAP) return;
    var next = Object.assign({}, state.items);
    next[item] = checked;
    store.setState({ items: next });
  }

  function updateField(fieldName, changes) {
    MarketingHaus.util.updateField(store, fieldName, changes);
  }

  // Switching whether a model is present swaps Presentation's own option
  // list (tabletop phrasing vs. model phrasing) — if the currently chosen
  // value doesn't exist in the new list, it's cleared back to Select...
  // rather than silently keeping a mismatched value.
  function setModelEnabled(checked) {
    var state = store.getState();
    var options = checked ? PRESENTATION_OPTIONS_WITH_MODEL : PRESENTATION_OPTIONS_PRODUCT_ONLY;
    var nextValue = options.indexOf(state.presentation.value) !== -1 ? state.presentation.value : "";
    store.setState({
      modelEnabled: checked,
      presentation: Object.assign({}, state.presentation, { options: options, value: nextValue }),
    });
  }

  function applyPreset(preset) {
    var a = preset.apply;
    var state = store.getState();
    var nextItems = ITEM_OPTIONS.reduce(function (acc, item) {
      acc[item] = (a.items || []).indexOf(item) !== -1;
      return acc;
    }, {});
    var modelOn = !!a.modelEnabled;
    var presentationOptions = modelOn ? PRESENTATION_OPTIONS_WITH_MODEL : PRESENTATION_OPTIONS_PRODUCT_ONLY;
    var patch = {
      product: Object.assign({}, state.product, { value: a.product, customValue: "" }),
      modelEnabled: modelOn,
      presentation: Object.assign({}, state.presentation, { options: presentationOptions, value: a.presentation, customValue: "" }),
      items: nextItems,
      mood: Object.assign({}, state.mood, { value: a.mood, customValue: "" }),
      lighting: Object.assign({}, state.lighting, { value: a.lighting, customValue: "" }),
    };
    if (modelOn) {
      patch.modelAppearance = Object.assign({}, state.modelAppearance, { value: a.modelAppearance || "" });
      patch.modelClothing = Object.assign({}, state.modelClothing, { value: a.modelClothing || "", customValue: "" });
      patch.modelHairstyle = Object.assign({}, state.modelHairstyle, { value: a.modelHairstyle || "", customValue: "" });
      patch.modelPose = Object.assign({}, state.modelPose, { value: a.modelPose || "", customValue: "" });
      patch.background = Object.assign({}, state.background, { value: a.background || "", customValue: "" });
    } else {
      patch.setting = Object.assign({}, state.setting, { value: a.setting || "", customValue: "" });
    }
    store.setState(patch);
  }

  function randomize() {
    var state = store.getState();
    var entries = [
      { fieldName: "product", field: state.product },
      { fieldName: "presentation", field: state.presentation },
      { fieldName: "mood", field: state.mood },
      { fieldName: "lighting", field: state.lighting },
    ];
    if (state.modelEnabled) {
      entries.push({ fieldName: "background", field: state.background });
      entries.push({ fieldName: "modelClothing", field: state.modelClothing });
      entries.push({ fieldName: "modelHairstyle", field: state.modelHairstyle });
      entries.push({ fieldName: "modelPose", field: state.modelPose });
    } else {
      entries.push({ fieldName: "setting", field: state.setting });
    }
    entries.forEach(function (e) {
      if (e.field.includeInPrompt === false) return;
      var options = e.field.options || [];
      if (!options.length) return;
      updateField(e.fieldName, { value: options[Math.floor(Math.random() * options.length)], customValue: "" });
    });
    var shuffled = ITEM_OPTIONS.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    var chosen = shuffled.slice(0, Math.floor(Math.random() * (ITEM_CAP + 1)));
    store.setState({
      items: ITEM_OPTIONS.reduce(function (acc, item) {
        acc[item] = chosen.indexOf(item) !== -1;
        return acc;
      }, {}),
    });
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function assembleVideoPrompt() {
    var state = store.getState();
    var rv = MarketingHaus.engine.resolveFieldValue;
    return MarketingHaus.motion.assemble({
      tool: rv(state.videoTool),
      motion: (state.videoMotion.value || "").trim() || "the scene comes to life with natural, subtle motion",
      camera: rv(state.videoCamera) || VIDEO_CAMERA_OPTIONS[0],
      duration: rv(state.videoDuration) || VIDEO_DURATION_OPTIONS[1],
      audioType: rv(state.videoAudio) || VIDEO_AUDIO_OPTIONS[0],
      quality: rv(state.videoQuality) || VIDEO_QUALITY_OPTIONS[0],
    });
  }

  function assemblePrompt() {
    var state = store.getState();
    var modelOn = state.modelEnabled;
    var productLabel = MarketingHaus.engine.resolveFieldValue(state.product) || "product";

    var fieldEntries = MarketingHaus.styleDNA.getVoiceEntries().concat(MarketingHaus.brandKit.getActiveKitEntries()).concat([
      { label: "Product", field: state.product },
      { label: "Design", field: state.designDescription },
      { label: "Product Color", field: state.productColor },
    ]);

    if (modelOn) {
      fieldEntries = fieldEntries.concat([
        { label: "Model", field: state.modelAppearance },
        { label: "Model's Clothing", field: state.modelClothing },
        { label: "Model's Hairstyle", field: state.modelHairstyle },
        { label: "Model's Pose", field: state.modelPose },
      ]);
    }

    fieldEntries.push({ label: "Presentation", field: state.presentation });

    var items = resolvedItemsList();
    fieldEntries.push({ label: "Props & Accessories", field: makeField(items.join(", "), [], { includeInPrompt: items.length > 0 }) });

    fieldEntries.push({ label: modelOn ? "Background" : "Setting", field: modelOn ? state.background : state.setting });
    fieldEntries.push({ label: "Styling Mood", field: state.mood });
    fieldEntries.push({ label: "Lighting & Camera Angle", field: state.lighting });

    // Guardrail against the "Niche/Theme/Holiday paint over the blank
    // design" bug — only added when one of those fields (or Mood) is
    // actually set, so a plain zero-styling mockup stays a clean sentence.
    var dnaState = MarketingHaus.styleDNA.getState();
    var stylingRisk = [dnaState.niche, dnaState.theme, dnaState.holiday, state.mood].some(function (f) {
      return !!MarketingHaus.engine.resolveFieldValue(f);
    });

    var outroParts = [];
    if (stylingRisk) {
      outroParts.push(
        "Keep the " + productLabel + "'s exact print/design surface showing only what was described above (or a plain, unprinted surface if nothing was specified) — do not let the Niche, Theme, Holiday, or Mood styling add extra artwork, patterns, or seasonal decoration onto the product's own print area; confine that styling to the surrounding scene, props, and " + (modelOn ? "background" : "setting") + " only."
      );
    }
    if (modelOn) {
      outroParts.push(
        "Keep the " + productLabel + " itself clearly visible and unobstructed in the shot — if it's held, position it so the design faces the camera; if it's worn, keep the fabric or surface smooth, unwrinkled, and unobstructed by hair, hands, or other items."
      );
    }

    return MarketingHaus.engine.buildSentence({
      intro: "Create a photorealistic product mockup:",
      fieldEntries: fieldEntries,
      outro: outroParts.join(" "),
    });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var modelOn = state.modelEnabled;
    var entries = [
      { label: "Product", field: state.product },
      { label: "Design", field: state.designDescription },
      { label: "Product Color", field: state.productColor },
    ];
    if (modelOn) {
      entries = entries.concat([
        { label: "Model", field: state.modelAppearance },
        { label: "Model's Clothing", field: state.modelClothing },
        { label: "Model's Hairstyle", field: state.modelHairstyle },
        { label: "Model's Pose", field: state.modelPose },
      ]);
    }
    entries.push({ label: "Presentation", field: state.presentation });
    entries.push({ label: modelOn ? "Background" : "Setting", field: modelOn ? state.background : state.setting });
    entries.push({ label: "Styling Mood", field: state.mood });
    entries.push({ label: "Lighting & Camera Angle", field: state.lighting });

    var resolved = MarketingHaus.engine.resolveFields(entries);
    var items = resolvedItemsList();
    if (items.length) resolved.push({ label: "Props & Accessories", value: items.join(", ") });
    if (state.videoEnabled) resolved.push({ label: "Video Motion Prompt", value: "Enabled — " + assembleVideoPrompt() });
    return resolved.length ? [{ title: "Mockup Studio", items: resolved }] : [];
  }

  function renderModelSection(ui, state) {
    return ui.renderSubPanel(
      "Include a Model / Person in This Mockup?",
      state.modelEnabled,
      function (checked) { setModelEnabled(checked); MarketingHaus.ui.renderApp(); },
      function () {
        return ui.renderFieldGroup(
          "Model / Person",
          [
            { label: "Model Appearance", field: state.modelAppearance, placeholder: "e.g. a woman in her 20s, athletic build, warm smile" },
            { label: "Clothing (Besides the Product)", field: state.modelClothing },
            { label: "Hairstyle", field: state.modelHairstyle },
            { label: "Pose / Action", field: state.modelPose },
          ],
          function (entry, changes) {
            if (entry.label === "Model Appearance") updateField("modelAppearance", changes);
            else if (entry.label === "Clothing (Besides the Product)") updateField("modelClothing", changes);
            else if (entry.label === "Hairstyle") updateField("modelHairstyle", changes);
            else updateField("modelPose", changes);
            MarketingHaus.ui.renderApp();
          },
          "Describe who's shown with the product — clothing besides the item itself, hairstyle, and pose."
        );
      },
      "Adds a person wearing, holding, or using the product, instead of a plain product-only shot."
    );
  }

  function renderVideoSection(ui, state) {
    return ui.renderSubPanel(
      "Also Generate a Video Motion Prompt?",
      state.videoEnabled,
      function (checked) { store.setState({ videoEnabled: checked }); MarketingHaus.ui.renderApp(); },
      function () {
        var fieldMap = {
          "Motion / Action": "videoMotion",
          "Target Tool": "videoTool",
          "Camera Movement": "videoCamera",
          "Duration": "videoDuration",
          "Audio": "videoAudio",
          "Quality": "videoQuality",
        };
        var fields = ui.renderFieldGroup(
          "Video Motion Prompt",
          [
            { label: "Motion / Action", field: state.videoMotion, placeholder: "e.g. the model takes a sip of coffee and smiles" },
            { label: "Target Tool", field: state.videoTool },
            { label: "Camera Movement", field: state.videoCamera },
            { label: "Duration", field: state.videoDuration },
            { label: "Audio", field: state.videoAudio },
            { label: "Quality", field: state.videoQuality },
          ],
          function (entry, changes) {
            updateField(fieldMap[entry.label], changes);
            MarketingHaus.ui.renderApp();
          },
          "A second, separate prompt for animating this mockup into a moving scene once the image exists — paste it into an image-to-video tool."
        );

        var previewText = assembleVideoPrompt();
        var copyBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small mh-btn--copy", text: "Copy Video Prompt" });
        copyBtn.addEventListener("click", function () {
          ui.copyTextToClipboard(previewText, function (ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { copyBtn.textContent = "Copy Video Prompt"; }, 1500);
          });
        });
        var preview = ui.el("div", { class: "mh-video-preview" }, [
          ui.el("p", { class: "mh-video-preview__text", text: previewText }),
          copyBtn,
        ]);
        return ui.el("div", {}, [fields, preview]);
      },
      "Adds a second prompt, separate from your mockup image prompt, for turning the finished image into a short video."
    );
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var state = store.getState();
    var modelOn = state.modelEnabled;
    var wrap = ui.el("div", { class: "mh-panel" });

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); MarketingHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Hero Product", [{ label: "Product", field: state.product }], function (entry, changes) { updateField("product", changes); MarketingHaus.ui.renderApp(); }));

    wrap.appendChild(ui.renderFieldGroup(
      "Presentation Style",
      [
        { label: "Presentation", field: state.presentation },
        { label: "Your Design / Print", field: state.designDescription, placeholder: "Describe the design you already created (e.g. \"a watercolor floral wreath with the words Bless This Home\")" },
        { label: "Product Color / Variant", field: state.productColor, placeholder: "e.g. sage green, black, natural wood" },
        { label: modelOn ? "Background" : "Setting", field: modelOn ? state.background : state.setting },
      ],
      function (entry, changes) {
        if (entry.label === "Presentation") updateField("presentation", changes);
        else if (entry.label === "Your Design / Print") updateField("designDescription", changes);
        else if (entry.label === "Product Color / Variant") updateField("productColor", changes);
        else updateField(modelOn ? "background" : "setting", changes);
        MarketingHaus.ui.renderApp();
      },
      "How it's shown, your own design, and the surrounding scene."
    ));

    wrap.appendChild(renderModelSection(ui, state));

    wrap.appendChild(ui.renderFieldGroup("Style", [
      { label: "Styling Mood", field: state.mood },
      { label: "Lighting & Camera Angle", field: state.lighting },
    ], function (entry, changes) {
      if (entry.label === "Styling Mood") updateField("mood", changes);
      else updateField("lighting", changes);
      MarketingHaus.ui.renderApp();
    }));

    wrap.appendChild(ui.renderCappedChecklist({
      title: "Props & Accessories",
      subtitle: modelOn
        ? "Pick up to " + ITEM_CAP + " — these can be held or worn by your model."
        : "Pick up to " + ITEM_CAP + " — these style the scene around the product.",
      icon: "hanger",
      items: ITEM_OPTIONS,
      selected: selectedItems(),
      cap: ITEM_CAP,
      onToggle: function (item, checked) { toggleItem(item, checked); MarketingHaus.ui.renderApp(); },
      freeform: {
        label: "Add Your Own (comma-separated)",
        value: state.customItems.value,
        placeholder: "e.g. tote bag, roller skates, birthday cake",
        onChange: function (value) { updateField("customItems", { value: value }); MarketingHaus.ui.renderApp(); },
      },
    }));

    wrap.appendChild(renderVideoSection(ui, state));

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
