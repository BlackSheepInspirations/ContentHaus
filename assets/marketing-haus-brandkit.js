/**
 * The AI Creator's Marketing Haus — Brand Kit
 * Depends on marketing-haus-util.js, marketing-haus-engine.js, and
 * marketing-haus-ui.js's exposed MarketingHaus.ui helpers (all must load
 * first). Every other mode's assemblePrompt calls getActiveKitEntries()
 * and concats the result into its own fieldEntries.
 *
 * Simpler than Content Haus's own Brand Kit by necessity, not by
 * omission: Content Haus's modes (Text, Logo, Character, Reference) each
 * have real color/typography fields to write values into directly. None
 * of Marketing Haus's remaining 8 studios (Mockup, Social, Ad Copy,
 * Email, Sales, Invitations, Devotional, Testimonial) do — Branding
 * Studio and Logo Studio, which did, moved to Brand Haus. So there's
 * only one mechanism here: synthetic descriptor entries, read fresh at
 * assembly time and appended to whatever's being generated, the same way
 * Holiday/Theme/Niche already fold in via Business/Voice DNA. No
 * per-category override toggles either — there's only one category of
 * fields, so a kit is either active or it isn't.
 *
 * Same multi-kit management depth as Content Haus (up to 3, one active,
 * persisted to localStorage) since that's genuinely useful for anyone
 * doing client/resale work with more than one brand to juggle.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var STORAGE_KEY = "marketingHausBrandKits";
  var MAX_KITS = 3;
  var MAX_COLORS = 5;
  var MAX_VALUES = 5;

  var WEB_SAFE_FONTS = ["Georgia", "Helvetica", "Arial", "Times New Roman", "Courier New"];
  var GOOGLE_FONTS = [
    "Playfair Display", "Merriweather", "Lora", "Montserrat", "Poppins", "Inter", "Open Sans",
    "Caveat", "Dancing Script", "Pacifico", "Sacramento", "Bebas Neue", "Oswald", "Abril Fatface", "Roboto Mono",
  ];
  var FONT_OPTIONS = sortAlpha(WEB_SAFE_FONTS.concat(GOOGLE_FONTS));

  (function loadGoogleFonts() {
    if (document.getElementById("mh-brandkit-fonts-link")) return;
    var families = GOOGLE_FONTS.map(function (name) { return "family=" + name.replace(/ /g, "+") + ":wght@400;600;700"; }).join("&");
    var link = document.createElement("link");
    link.id = "mh-brandkit-fonts-link";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?" + families + "&display=swap";
    document.head.appendChild(link);
  })();

  var MOOD_OPTIONS = sortAlpha([
    "minimalist and clean", "warm and cozy", "bold and vibrant", "elegant and luxurious", "playful and fun",
    "rustic and organic", "modern and edgy", "romantic and soft", "professional and polished", "boho and eclectic",
  ]);
  var BRAND_VOICE_OPTIONS = sortAlpha([
    "warm and approachable", "confident and bold", "playful and quirky", "sophisticated and refined",
    "nurturing and supportive", "edgy and rebellious", "calm and grounded", "energetic and motivating",
  ]);

  function buildKitFields() {
    return {
      colors: [],
      headingFont: makeField("", FONT_OPTIONS),
      bodyFont: makeField("", FONT_OPTIONS),
      mood: makeField("", MOOD_OPTIONS),
      voice: makeField("", BRAND_VOICE_OPTIONS),
      coreValues: [],
      notThis: makeField("", [], { isFreeText: true }),
    };
  }

  function readPersisted() {
    if (!window.localStorage) return { kits: [], activeKitId: null };
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (parsed && Array.isArray(parsed.kits)) return { kits: parsed.kits, activeKitId: parsed.activeKitId || null };
    } catch (e) {
      // fall through to default
    }
    return { kits: [], activeKitId: null };
  }

  function writePersisted(state) {
    if (!window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ kits: state.kits, activeKitId: state.activeKitId }));
  }

  var store = MarketingHaus.util.createStore(readPersisted());

  function commit(patch) {
    store.setState(patch);
    writePersisted(store.getState());
  }

  function getAllKits() {
    return store.getState().kits;
  }
  function isFull() {
    return store.getState().kits.length >= MAX_KITS;
  }
  function getActiveKit() {
    var state = store.getState();
    if (!state.activeKitId) return null;
    return state.kits.filter(function (k) { return k.id === state.activeKitId; })[0] || null;
  }

  function createKit(name) {
    var state = store.getState();
    if (state.kits.length >= MAX_KITS) {
      return { ok: false, reason: "You already have " + MAX_KITS + " Brand Kits saved — delete one to create another." };
    }
    var kit = { id: "mhbk-" + Date.now() + "-" + Math.floor(Math.random() * 10000), name: (name || "").trim() || "Untitled Brand Kit", createdAt: Date.now(), fields: buildKitFields() };
    commit({ kits: state.kits.concat([kit]) });
    return { ok: true, id: kit.id };
  }

  function deleteKit(id) {
    var state = store.getState();
    commit({ kits: state.kits.filter(function (k) { return k.id !== id; }), activeKitId: state.activeKitId === id ? null : state.activeKitId });
  }

  function renameKit(id, newName) {
    var state = store.getState();
    commit({ kits: state.kits.map(function (k) { return k.id === id ? Object.assign({}, k, { name: (newName || "").trim() || "Untitled Brand Kit" }) : k; }) });
  }

  function setActiveKit(id) {
    commit({ activeKitId: id });
  }

  function updateKitField(id, fieldName, changes) {
    var state = store.getState();
    commit({
      kits: state.kits.map(function (k) {
        if (k.id !== id) return k;
        var fields = Object.assign({}, k.fields);
        fields[fieldName] = Object.assign({}, fields[fieldName], changes);
        return Object.assign({}, k, { fields: fields });
      }),
    });
  }

  function updateKitColors(id, colors) {
    var state = store.getState();
    commit({ kits: state.kits.map(function (k) { return k.id === id ? Object.assign({}, k, { fields: Object.assign({}, k.fields, { colors: colors }) }) : k; }) });
  }

  function updateKitValues(id, values) {
    var state = store.getState();
    commit({ kits: state.kits.map(function (k) { return k.id === id ? Object.assign({}, k, { fields: Object.assign({}, k.fields, { coreValues: values }) }) : k; }) });
  }

  function resolved(field) {
    return MarketingHaus.engine.resolveFieldValue(field);
  }

  // Synthetic entries — read fresh at assembly time, concatenated onto
  // whichever mode is currently generating, same pattern Holiday/Theme/
  // Niche already use via getVoiceEntries().
  function getActiveKitEntries() {
    var kit = getActiveKit();
    if (!kit) return [];
    var entries = [];
    var colors = (kit.fields.colors || []).filter(Boolean);
    if (colors.length) entries.push({ label: "Brand Colors", field: makeField(colors.join(", ")) });
    var headingFont = resolved(kit.fields.headingFont);
    var bodyFont = resolved(kit.fields.bodyFont);
    if (headingFont || bodyFont) {
      var typo = [headingFont && "heading font " + headingFont, bodyFont && "body font " + bodyFont].filter(Boolean).join(", ");
      entries.push({ label: "Brand Typography", field: makeField(typo) });
    }
    var mood = resolved(kit.fields.mood);
    if (mood) entries.push({ label: "Brand Mood", field: makeField(mood) });
    var voice = resolved(kit.fields.voice);
    if (voice) entries.push({ label: "Brand Voice", field: makeField(voice) });
    var values = (kit.fields.coreValues || []).map(function (v) { return (v || "").trim(); }).filter(Boolean);
    if (values.length) entries.push({ label: "Brand Values", field: makeField(values.join(", ")) });
    return entries;
  }

  function getActiveKitNegativeContribution() {
    var kit = getActiveKit();
    if (!kit) return "";
    return resolved(kit.fields.notThis);
  }

  function buildKitSummaryText(kit) {
    var lines = ["BRAND KIT: " + kit.name, ""];
    function addLine(label, value) { if (value) lines.push(label + ": " + value); }
    addLine("Colors", (kit.fields.colors || []).filter(Boolean).join(", "));
    addLine("Heading Font", resolved(kit.fields.headingFont));
    addLine("Body Font", resolved(kit.fields.bodyFont));
    addLine("Mood", resolved(kit.fields.mood));
    addLine("Voice", resolved(kit.fields.voice));
    addLine("Core Values", (kit.fields.coreValues || []).filter(Boolean).join(", "));
    addLine("What the Brand is NOT", resolved(kit.fields.notThis));
    return lines.join("\n");
  }

  function buildAllKitsSummaryText() {
    return getAllKits().map(buildKitSummaryText).join("\n\n" + "—".repeat(24) + "\n\n");
  }

  // ---------------------------------------------------------------------
  // UI — a persistent right-sidebar section, visible across every mode
  // (same placement Content Haus uses), not its own tab.
  // ---------------------------------------------------------------------
  var expandedKitId = null;
  var renamingKitId = null;
  var newKitNameDraft = "";

  function renderKitFields(kit) {
    var ui = MarketingHaus.ui;
    var fieldsWrap = ui.el("div", { class: "mh-field-group__fields" });

    fieldsWrap.appendChild(ui.renderColorPickerList({
      title: "Colors", subtitle: "Up to " + MAX_COLORS + ".", colors: kit.fields.colors, max: MAX_COLORS,
      onUpdate: function (i, hex) { var next = kit.fields.colors.slice(); next[i] = hex; updateKitColors(kit.id, next); MarketingHaus.ui.renderApp(); },
      onAdd: function () { updateKitColors(kit.id, kit.fields.colors.concat(["#6B6860"])); MarketingHaus.ui.renderApp(); },
      onRemove: function (i) { updateKitColors(kit.id, kit.fields.colors.filter(function (_, idx) { return idx !== i; })); MarketingHaus.ui.renderApp(); },
    }));

    var typographyFields = ui.el("div", { class: "mh-field-group__fields" }, [
      ui.renderFontPreviewField({ label: "Heading Font", field: kit.fields.headingFont }, function (changes) { updateKitField(kit.id, "headingFont", changes); MarketingHaus.ui.renderApp(); }),
      ui.renderFontPreviewField({ label: "Body Font", field: kit.fields.bodyFont }, function (changes) { updateKitField(kit.id, "bodyFont", changes); MarketingHaus.ui.renderApp(); }),
    ]);
    fieldsWrap.appendChild(typographyFields);

    fieldsWrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Mood", field: kit.fields.mood }, { label: "Voice", field: kit.fields.voice }],
      function (entry, changes) {
        if (entry.label === "Mood") updateKitField(kit.id, "mood", changes);
        else updateKitField(kit.id, "voice", changes);
        MarketingHaus.ui.renderApp();
      }
    ));

    fieldsWrap.appendChild(ui.renderTextSlotList({
      title: "Core Values", subtitle: "Up to " + MAX_VALUES + ".", icon: "heart", values: kit.fields.coreValues, max: MAX_VALUES, singular: "Value", placeholder: "e.g. Community",
      onUpdate: function (i, v) { var next = kit.fields.coreValues.slice(); next[i] = v; updateKitValues(kit.id, next); },
      onAdd: function () { updateKitValues(kit.id, kit.fields.coreValues.concat([""])); MarketingHaus.ui.renderApp(); },
      onRemove: function (i) { updateKitValues(kit.id, kit.fields.coreValues.filter(function (_, idx) { return idx !== i; })); MarketingHaus.ui.renderApp(); },
    }));

    fieldsWrap.appendChild(ui.renderFreeTextField({ label: "What the Brand is NOT (optional)", field: kit.fields.notThis, placeholder: "e.g. \"corporate, cold, overly polished\"" }, function (changes) { updateKitField(kit.id, "notThis", changes); MarketingHaus.ui.renderApp(); }));

    return fieldsWrap;
  }

  function renderKitCard(kit, isActive) {
    var ui = MarketingHaus.ui;
    var isExpanded = expandedKitId === kit.id;

    var titleRow;
    if (renamingKitId === kit.id) {
      var titleInput = ui.el("input", { type: "text", class: "mh-saved__item-title-input", value: kit.name });
      var confirmRename = function () { renameKit(kit.id, titleInput.value.trim() || kit.name); renamingKitId = null; MarketingHaus.ui.renderApp(); };
      titleInput.addEventListener("keydown", function (e) { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") { renamingKitId = null; MarketingHaus.ui.renderApp(); } });
      titleInput.addEventListener("blur", confirmRename);
      titleRow = ui.el("div", { class: "mh-saved__item-title-row" }, [titleInput]);
    } else {
      var renameBtn = ui.el("button", { type: "button", class: "mh-saved__rename-btn", title: "Rename" }, [ui.icon("edit")]);
      renameBtn.addEventListener("click", function () { renamingKitId = kit.id; MarketingHaus.ui.renderApp(); });
      titleRow = ui.el("div", { class: "mh-saved__item-title-row" }, [
        ui.el("p", { class: "mh-saved__item-title", text: kit.name + (isActive ? " (active)" : "") }),
        renameBtn,
      ]);
    }

    var activeBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small " + (isActive ? "mh-btn--reset" : "mh-btn--copy"), text: isActive ? "Turn Off" : "Set Active" });
    activeBtn.addEventListener("click", function () { setActiveKit(isActive ? null : kit.id); MarketingHaus.ui.renderApp(); });

    var expandBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small", text: isExpanded ? "Hide Fields" : "Edit Fields" });
    expandBtn.addEventListener("click", function () { expandedKitId = isExpanded ? null : kit.id; MarketingHaus.ui.renderApp(); });

    var deleteBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--delete mh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { deleteKit(kit.id); MarketingHaus.ui.renderApp(); });

    var children = [titleRow, ui.el("div", { class: "mh-saved__item-actions" }, [activeBtn, expandBtn, deleteBtn])];
    if (isExpanded) children.push(renderKitFields(kit));

    return ui.el("div", { class: "mh-saved__item" + (isActive ? " mh-collection__item--combined" : ""), style: isActive ? "border-color: var(--mh-espresso);" : "" }, children);
  }

  function renderSection(root) {
    var ui = MarketingHaus.ui;
    var kits = getAllKits();
    var activeKit = getActiveKit();

    var list = ui.el("div", { class: "mh-saved__list" });
    if (!kits.length) {
      list.appendChild(ui.el("p", { class: "mh-saved__empty", text: "No Brand Kits yet — create one below to give every studio brand context automatically." }));
    } else {
      kits.forEach(function (kit) { list.appendChild(renderKitCard(kit, !!activeKit && activeKit.id === kit.id)); });
    }

    var createRow = ui.el("div", {});
    if (!isFull()) {
      var nameInput = ui.el("input", { type: "text", class: "mh-field__custom", placeholder: "New kit name, e.g. \"Client: Wildroot\"" });
      var createBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--add mh-btn--small", text: "+ Create Brand Kit" });
      createBtn.addEventListener("click", function () {
        var result = createKit(nameInput.value);
        if (result.ok) MarketingHaus.ui.renderApp();
      });
      createRow = ui.el("div", { class: "mh-companion__controls" }, [nameInput, createBtn]);
    } else {
      createRow = ui.el("p", { class: "mh-field-group__subtitle", text: "You have " + MAX_KITS + "/" + MAX_KITS + " Brand Kits — delete one to create another." });
    }

    root.appendChild(ui.el("div", { class: "mh-saved" }, [
      ui.el("h3", { class: "mh-saved__title" }, [ui.icon("palette"), ui.el("span", { text: "Brand Kit (" + kits.length + "/" + MAX_KITS + ")" })]),
      ui.el("p", { class: "mh-field-group__subtitle", text: "Set colors, fonts, mood, voice, and values once — the active kit automatically informs every studio's output." }),
      list,
      createRow,
    ]));
  }

  MarketingHaus.brandKit = {
    MAX_KITS: MAX_KITS,
    getAllKits: getAllKits,
    isFull: isFull,
    getActiveKit: getActiveKit,
    createKit: createKit,
    deleteKit: deleteKit,
    renameKit: renameKit,
    setActiveKit: setActiveKit,
    getActiveKitEntries: getActiveKitEntries,
    getActiveKitNegativeContribution: getActiveKitNegativeContribution,
    buildKitSummaryText: buildKitSummaryText,
    buildAllKitsSummaryText: buildAllKitsSummaryText,
    renderSection: renderSection,
  };
})();
