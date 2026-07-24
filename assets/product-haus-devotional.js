/**
 * The AI Creator's Product Haus — Devotional & Motivation Card Studio
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-ui.js's exposed
 * ProductHaus.ui helpers (all must load first).
 *
 * Covers faith-based and secular encouragement content alike — Faith
 * Tradition explicitly includes a non-faith "general inspirational"
 * option so this isn't Christian-only. Same "wording + visual style in
 * one prompt" pattern as Invitations & Stationery, since these are also
 * usually sold as one finished printable card.
 *
 * Multi-sheet decks: a real image-generation call produces one image,
 * so "27 cards across 3 sheets" can never be one prompt — it has to be
 * 3 separate prompts, one per sheet. Number of Sheets (only shown once
 * Format is set to a deck) drives exactly that. The same one-image
 * limit also applies to front vs. back: a single generation call can't
 * reliably produce two pages, so each physical sheet gets its own Front
 * prompt AND its own Back prompt (assembleCardDeck below), rather than
 * one prompt asking for both — that's what previously caused a 1-sheet
 * deck to only ever come back with a front. Front and Back always share
 * the exact same grid/size wording so they line up when printed
 * double-sided. Cards Per Sheet is capped at 2/4/6 — anything denser
 * makes each card too small to read.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var makeField = ProductHaus.util.makeField;
  var sortAlpha = ProductHaus.util.sortAlpha;

  var CARD_TYPE_OPTIONS = sortAlpha([
    "daily devotional", "scripture / verse card", "affirmation card", "prayer card",
    "motivational quote card", "recovery / sobriety encouragement card", "grief / comfort card",
  ]);

  var FAITH_TRADITION_OPTIONS = sortAlpha([
    "Christian", "non-denominational / spiritual", "secular / mindfulness-based",
    "Jewish", "Islamic", "Hindu", "Buddhist", "Sikh", "general inspirational (no faith framing)",
  ]);

  var TONE_OPTIONS = sortAlpha(["gentle and comforting", "bold and empowering", "reflective and calm", "joyful and uplifting", "solemn and reverent"]);

  var FORMAT_OPTIONS = ["single card", "card deck / series (multiple cards)", "social-media-ready square graphic"];

  // Only shown/used once Format is the deck option — a single card or a
  // social graphic has no sheet to lay out. Capped at 2/4/6 — denser
  // grids (the old 9/12 options) made each card too small to read.
  var CARDS_PER_SHEET_OPTIONS = ["2", "4", "6"];
  var SHEET_SIZE_OPTIONS = ["Letter (8.5 x 11 in)", "A4"];
  var NUMBER_OF_SHEETS_OPTIONS = ["1 sheet", "2 sheets", "3 sheets", "4 sheets", "5 sheets"];

  var AESTHETIC_MOTIF_OPTIONS = sortAlpha([
    "soft floral watercolor", "greenery / botanical accents", "ink splash / brush stroke", "marble texture",
    "geometric line art", "delicate lace border", "star and celestial accents", "minimalist line border",
    "vintage paper texture", "ribbon and bow accents",
  ]);
  var COLOR_TONE_OPTIONS = sortAlpha(["neutrals", "pastels", "bold and vibrant", "jewel tones", "earthy and muted", "monochrome", "warm tones", "cool tones"]);

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
      aestheticMotif: makeField("", AESTHETIC_MOTIF_OPTIONS),
      colorTone: makeField("", COLOR_TONE_OPTIONS),
      format: makeField(FORMAT_OPTIONS[0], FORMAT_OPTIONS),
      cardsPerSheet: makeField(CARDS_PER_SHEET_OPTIONS[1], CARDS_PER_SHEET_OPTIONS),
      sheetSize: makeField(SHEET_SIZE_OPTIONS[0], SHEET_SIZE_OPTIONS),
      numberOfSheets: makeField(NUMBER_OF_SHEETS_OPTIONS[0], NUMBER_OF_SHEETS_OPTIONS),
    };
  }

  var store = ProductHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    ProductHaus.util.updateField(store, fieldName, changes);
  }

  // Resets the deck/aesthetic fields to defaults on every preset apply
  // (not just whatever a prior manual edit left them at) so a Starter
  // Preset always produces the same predictable state.
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
      aestheticMotif: Object.assign({}, state.aestheticMotif, { value: "", customValue: "" }),
      colorTone: Object.assign({}, state.colorTone, { value: "", customValue: "" }),
      format: Object.assign({}, state.format, { value: a.format, customValue: "" }),
      cardsPerSheet: Object.assign({}, state.cardsPerSheet, { value: CARDS_PER_SHEET_OPTIONS[1], customValue: "" }),
      sheetSize: Object.assign({}, state.sheetSize, { value: SHEET_SIZE_OPTIONS[0], customValue: "" }),
      numberOfSheets: Object.assign({}, state.numberOfSheets, { value: NUMBER_OF_SHEETS_OPTIONS[0], customValue: "" }),
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

  function isDeckFormat(state) {
    return (state.format.value || "") === FORMAT_OPTIONS[1];
  }

  function totalSheetsFromState(state) {
    if (!isDeckFormat(state)) return 1;
    var match = /^(\d+)/.exec(state.numberOfSheets.value || "1");
    return match ? parseInt(match[1], 10) : 1;
  }

  function buildFieldEntries(state) {
    return ProductHaus.styleDNA.getVoiceEntries().concat(ProductHaus.brandKit.getActiveKitEntries()).concat([
      { label: "Card Type", field: state.cardType },
      { label: "Faith Tradition / Framework", field: state.faithTradition },
      { label: "Topic / Focus", field: state.topic },
      { label: "Tone", field: state.tone },
      { label: "Scripture / Quote Reference", field: state.reference },
      { label: "Visual Style", field: state.visualStyle },
      { label: "Decorative Motif", field: state.aestheticMotif },
      { label: "Color Tone", field: state.colorTone },
      { label: "Format", field: state.format },
    ]);
  }

  // Shared grid/size wording between a sheet's Front and Back prompts —
  // only meaningful once Format is the deck option, since a single card
  // or social graphic has no sheet grid to describe. Kept as its own
  // function so Front and Back are guaranteed to describe the identical
  // grid, never two independently-worded descriptions that could drift.
  function buildGridClause(state) {
    var perSheet = state.cardsPerSheet.value || CARDS_PER_SHEET_OPTIONS[1];
    var size = state.sheetSize.value || SHEET_SIZE_OPTIONS[0];
    return perSheet + " cards arranged in a clean, evenly-spaced grid on the sheet, sized for " + size + " paper, with consistent equal-size margins around every card.";
  }

  function buildVarietyNote(sheetIndex, totalSheets) {
    if (totalSheets <= 1) return "";
    return (
      "This is sheet " + sheetIndex + " of " + totalSheets + " in the same card deck — use different specific scripture " +
      "references, quotes, or wording than the other sheets so the full deck doesn't repeat itself, while keeping the same " +
      "overall theme, tone, and visual style across every sheet."
    );
  }

  // Front prompt: the full written content + visual design, same as a
  // single card, plus (for deck format) the grid layout instruction.
  function assembleFrontPromptForSheet(state, sheetIndex, totalSheets) {
    if (!isDeckFormat(state)) {
      return ProductHaus.engine.buildSentence({
        intro: "Write the content for, and create the visual design of, a:",
        fieldEntries: buildFieldEntries(state),
      });
    }
    var outroParts = [
      "Layout: " + buildGridClause(state) + " This is the FRONT sheet — every card shows its own full written content and visual design as described above.",
      buildVarietyNote(sheetIndex, totalSheets),
    ].filter(Boolean);
    return ProductHaus.engine.buildSentence({
      intro: "Write the content for, and create the visual design of, a:",
      fieldEntries: buildFieldEntries(state),
      outro: outroParts.join(" "),
    });
  }

  // Back prompt: a separate generation call from the Front (one image
  // call can't reliably produce two pages) — a simple recurring
  // decorative design only, no written content, locked to the exact
  // same grid/size as the Front sheet so the two align when printed
  // double-sided and cut.
  function assembleBackPromptForSheet(state) {
    var backFieldEntries = ProductHaus.styleDNA.getVoiceEntries().concat(ProductHaus.brandKit.getActiveKitEntries()).concat([
      { label: "Visual Style", field: state.visualStyle },
      { label: "Decorative Motif", field: state.aestheticMotif },
      { label: "Color Tone", field: state.colorTone },
    ]);
    var outro = (
      "Layout: " + buildGridClause(state) + " This is the BACK sheet — every card shows the same simple recurring decorative " +
      "design and no written text at all. Use the exact same card width, height, number of rows and columns, margins, and " +
      "spacing as the front sheet, so each back card lines up precisely behind its matching front card when the sheet is " +
      "printed double-sided and cut along the same guide lines. Do not resize, re-space, or re-crop the grid from the front sheet."
    );
    return ProductHaus.engine.buildSentence({
      intro: "Create the visual design of the back of a:",
      fieldEntries: backFieldEntries,
      outro: outro,
    });
  }

  // One labeled block per Front/Back page — same "labeled blocks, each
  // individually copyable" pattern the narrow generators' Page Bundles
  // already use. Non-deck formats (single card, social graphic) get one
  // block, same as before; deck format always gets a Front AND a Back
  // block per physical sheet, even when there's only 1 sheet — omitting
  // the Back for a 1-sheet deck was the actual bug.
  function assembleCardDeck(state) {
    if (!isDeckFormat(state)) {
      return [{ key: "sheet1", label: "Your Prompt", text: assembleFrontPromptForSheet(state, 1, 1).text }];
    }
    var total = totalSheetsFromState(state);
    var blocks = [];
    for (var i = 1; i <= total; i++) {
      var frontLabel = total > 1 ? "Sheet " + i + " of " + total + " — Front" : "Front";
      var backLabel = total > 1 ? "Sheet " + i + " of " + total + " — Back" : "Back";
      blocks.push({ key: "sheet" + i + "-front", label: frontLabel, text: assembleFrontPromptForSheet(state, i, total).text });
      blocks.push({ key: "sheet" + i + "-back", label: backLabel, text: assembleBackPromptForSheet(state).text });
    }
    return blocks;
  }

  // The shared "Your Prompt, Built Live" box / Copy / Save-to-Vault /
  // Recent Log all call this one function and expect a single {text,
  // fragments} — so this always returns sheet 1, exactly like Logo
  // Board's assemblePrompt() returns its first board piece. The full set
  // of sheets (when there's more than one) renders separately inside
  // this Studio's own panel, see renderCardDeckBlock below.
  function assemblePrompt() {
    var state = store.getState();
    var resolved = ProductHaus.engine.resolveFields(buildFieldEntries(state));
    var blocks = assembleCardDeck(state);
    return { text: blocks[0].text, fragments: resolved.map(function (r) { return r.value; }) };
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var items = ProductHaus.engine.resolveFields(buildFieldEntries(state));
    if (isDeckFormat(state)) {
      items = items.concat(ProductHaus.engine.resolveFields([
        { label: "Cards Per Sheet", field: state.cardsPerSheet },
        { label: "Sheet Size", field: state.sheetSize },
        { label: "Number of Sheets", field: state.numberOfSheets },
      ]));
    }
    return items.length ? [{ title: "Devotional & Motivation Card Studio", items: items }] : [];
  }

  // -----------------------------------------------------------------------
  // Panel rendering
  // -----------------------------------------------------------------------
  var deckSaveFeedback = null;

  function renderCardDeckBlock(state) {
    var ui = ProductHaus.ui;
    var blocks = assembleCardDeck(state);
    var totalSheets = totalSheetsFromState(state);
    var titleText = totalSheets > 1
      ? "Your Card Deck (" + totalSheets + " sheets, front + back — " + blocks.length + " pages to print)"
      : "Your Card (front + back — 2 pages to print)";
    var wrap = ui.el("div", { class: "pdh-generator-variations" });
    wrap.appendChild(ui.el("h4", { class: "pdh-generator-variations__title" }, [icon("sparkle"), ui.el("span", { text: titleText })]));

    blocks.forEach(function (block) {
      var copyBtn = ui.el("button", { type: "button", class: "pdh-btn pdh-btn--small pdh-btn--copy", text: "Copy" });
      copyBtn.addEventListener("click", function () {
        ui.copyTextToClipboard(block.text, function (ok) {
          copyBtn.textContent = ok ? "Copied!" : "Copy failed";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
        });
      });
      wrap.appendChild(ui.el("div", { class: "pdh-generator-variation" }, [
        ui.el("div", { class: "pdh-generator-variation__header" }, [
          ui.el("span", { class: "pdh-generator-variation__label", text: block.label }),
          copyBtn,
        ]),
        ui.el("p", { class: "pdh-generator-variation__text", text: block.text }),
      ]));
    });

    var saveBtn = ui.el("button", { type: "button", class: "pdh-btn pdh-btn--small pdh-btn--save", text: "Save Whole Deck to Vault" });
    saveBtn.addEventListener("click", function () {
      var combined = blocks.map(function (b) { return b.label.toUpperCase() + "\n\n" + b.text; }).join("\n\n" + "—".repeat(24) + "\n\n");
      var title = ui.buildVaultTitle("devotional") + " (" + blocks.length + "-sheet deck)";
      var result = ProductHaus.favorites.save("devotional", { text: combined, title: title, snapshot: ui.buildVaultSnapshot("devotional") });
      deckSaveFeedback = result.ok ? "Saved!" : result.reason;
      ProductHaus.ui.renderApp();
      setTimeout(function () { deckSaveFeedback = null; ProductHaus.ui.renderApp(); }, 2500);
    });
    var row = ui.el("div", { class: "pdh-companion__controls" }, [saveBtn]);
    if (deckSaveFeedback) row.appendChild(ui.el("span", { style: "color: var(--pdh-teal); font-weight: 600; font-size: 13px;", text: deckSaveFeedback }));
    wrap.appendChild(row);

    return wrap;
  }

  function icon(name) {
    return ProductHaus.ui.icon(name);
  }

  function renderPanel() {
    var ui = ProductHaus.ui;
    var wrap = ui.el("div", { class: "pdh-panel" });
    var state = store.getState();

    var presetRow = ui.renderPresetRow(PRESETS, function (preset) { applyPreset(preset); ProductHaus.ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    wrap.appendChild(ui.renderFieldGroup("Card Type & Framework", [
      { label: "Card Type", field: state.cardType },
      { label: "Faith Tradition / Framework", field: state.faithTradition },
    ], function (entry, changes) {
      if (entry.label === "Card Type") updateField("cardType", changes);
      else updateField("faithTradition", changes);
      ProductHaus.ui.renderApp();
    }, "\"General inspirational\" keeps the content secular — no faith framing at all."));

    wrap.appendChild(ui.renderFieldGroup("Content Details", [
      { label: "Topic / Focus", field: state.topic, placeholder: "e.g. \"trust and anxiety\", \"gratitude\", \"new beginnings\"" },
      { label: "Scripture / Quote Reference (optional)", field: state.reference, placeholder: "e.g. \"Philippians 4:6-7\" or a specific quote to build around" },
    ], function (entry, changes) {
      if (entry.label === "Topic / Focus") updateField("topic", changes);
      else updateField("reference", changes);
      ProductHaus.ui.renderApp();
    }, "What the card(s) should actually say."));

    wrap.appendChild(ui.renderFieldGroup("Tone & Format", [
      { label: "Tone", field: state.tone },
      { label: "Format", field: state.format },
    ], function (entry, changes) {
      if (entry.label === "Tone") updateField("tone", changes);
      else updateField("format", changes);
      ProductHaus.ui.renderApp();
    }));

    if (isDeckFormat(state)) {
      wrap.appendChild(ui.renderFieldGroup("Deck Layout", [
        { label: "Cards Per Sheet", field: state.cardsPerSheet },
        { label: "Sheet Size", field: state.sheetSize },
        { label: "Number of Sheets", field: state.numberOfSheets },
      ], function (entry, changes) {
        if (entry.label === "Cards Per Sheet") updateField("cardsPerSheet", changes);
        else if (entry.label === "Sheet Size") updateField("sheetSize", changes);
        else updateField("numberOfSheets", changes);
        ProductHaus.ui.renderApp();
      }, "Produces separate, individually-copyable Front and Back prompts below for every sheet — a single image can only ever be one page, so front and back always need their own prompt."));
    }

    wrap.appendChild(ui.renderFieldGroup("Visual Style & Aesthetic", [
      { label: "Visual Style — free description (optional)", field: state.visualStyle, placeholder: "e.g. \"soft floral watercolor border\"" },
      { label: "Decorative Motif", field: state.aestheticMotif },
      { label: "Color Tone", field: state.colorTone },
    ], function (entry, changes) {
      if (entry.label === "Visual Style — free description (optional)") updateField("visualStyle", changes);
      else if (entry.label === "Decorative Motif") updateField("aestheticMotif", changes);
      else updateField("colorTone", changes);
      ProductHaus.ui.renderApp();
    }, "Pick a Decorative Motif or Color Tone from the list or type your own for either — Color Tone is a mood (pastels, bold, earthy...) rather than a literal named color."));

    if (isDeckFormat(state)) {
      wrap.appendChild(renderCardDeckBlock(state));
    }

    return wrap;
  }

  ProductHaus.devotional = Object.assign({}, store, {
    randomize: randomize,
    reset: reset,
    assemblePrompt: assemblePrompt,
    assembleCardDeck: assembleCardDeck,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
