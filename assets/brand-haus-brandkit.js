/**
 * The AI Creator's Brand Haus — Brand Kit (up to 3 saved identities)
 * Depends on brand-haus-util.js, brand-haus-engine.js, and brand-haus-
 * ui.js's exposed BrandHaus.ui helpers (all must load first). Lives
 * inside the Branding Studio step (wizard step 4), same right-column
 * placement Marketing Haus's own Brand Kit uses.
 *
 * Brand Haus is the source of truth for cross-product brand identities.
 * Every save here also mirrors into SHARED_STORAGE_KEY, a plain
 * localStorage bucket (same browser, same domain — not a new access
 * mechanism) that other Haus products can read to offer these same 3
 * identities without redefining them. Other products never write back
 * to this key — editing a synced kit always means coming back here,
 * so there's exactly one place these 3 records can drift out of sync
 * with themselves.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var makeField = BrandHaus.util.makeField;
  var sortAlpha = BrandHaus.util.sortAlpha;

  var STORAGE_KEY = "brandHausBrandKits";
  var SHARED_STORAGE_KEY = "blackSheepBrandKitVault";
  var MAX_KITS = 3;
  var MAX_COLORS = 6;
  var MAX_VALUES = 5;

  var WEB_SAFE_FONTS = ["Georgia", "Helvetica", "Arial", "Times New Roman", "Courier New"];
  var GOOGLE_FONTS = [
    "Playfair Display", "Merriweather", "Lora", "Montserrat", "Poppins", "Inter", "Open Sans",
    "Caveat", "Dancing Script", "Pacifico", "Sacramento", "Bebas Neue", "Oswald", "Abril Fatface", "Roboto Mono",
  ];
  var FONT_OPTIONS = sortAlpha(WEB_SAFE_FONTS.concat(GOOGLE_FONTS));

  var MOOD_OPTIONS = sortAlpha([
    "minimalist and clean", "warm and cozy", "bold and vibrant", "elegant and luxurious", "playful and fun",
    "rustic and organic", "modern and edgy", "romantic and soft", "professional and polished", "boho and eclectic",
    "rugged and outdoorsy",
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
      mission: makeField("", [], { isFreeText: true }),
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
    writeSharedVault(state.kits);
  }

  // Mirrors this product's own kits into the shared vault other Haus
  // products read — flattened to plain hex/string values (no field-
  // shape objects) so any consumer can use them without knowing this
  // file's internal makeField structure.
  function writeSharedVault(kits) {
    if (!window.localStorage) return;
    var shared = kits.map(function (kit) {
      return {
        id: kit.id,
        source: "brandHaus",
        name: kit.name,
        savedAt: kit.createdAt,
        colors: (kit.fields.colors || []).filter(Boolean),
        headingFont: resolved(kit.fields.headingFont),
        bodyFont: resolved(kit.fields.bodyFont),
        mood: resolved(kit.fields.mood),
        voice: resolved(kit.fields.voice),
        coreValues: (kit.fields.coreValues || []).map(function (v) { return (v || "").trim(); }).filter(Boolean),
        mission: resolved(kit.fields.mission),
      };
    });
    window.localStorage.setItem(SHARED_STORAGE_KEY, JSON.stringify({ brandHausKits: shared }));
  }

  var store = BrandHaus.util.createStore(readPersisted());

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

  function createKit(name, prefillFields) {
    var state = store.getState();
    if (state.kits.length >= MAX_KITS) {
      return { ok: false, reason: "You already have " + MAX_KITS + " Brand Kits saved — delete one to create another." };
    }
    var fields = buildKitFields();
    if (prefillFields) fields = Object.assign(fields, prefillFields);
    var kit = { id: "bhbk-" + Date.now() + "-" + Math.floor(Math.random() * 10000), name: (name || "").trim() || "Untitled Identity", createdAt: Date.now(), fields: fields };
    commit({ kits: state.kits.concat([kit]) });
    return { ok: true, id: kit.id };
  }

  function deleteKit(id) {
    var state = store.getState();
    commit({ kits: state.kits.filter(function (k) { return k.id !== id; }), activeKitId: state.activeKitId === id ? null : state.activeKitId });
  }

  function renameKit(id, newName) {
    var state = store.getState();
    commit({ kits: state.kits.map(function (k) { return k.id === id ? Object.assign({}, k, { name: (newName || "").trim() || "Untitled Identity" }) : k; }) });
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
    return BrandHaus.engine.resolveFieldValue(field);
  }

  // Saves the current match from the Brand DNA Assessment as a new kit
  // — called from the "Save to Brand Kit" action in Branding Studio.
  function createKitFromAssessment(name, profile, founderOutput) {
    return createKit(name || profile.name, {
      colors: ["primary", "secondary", "neutral", "accent", "support", "standOut"].map(function (role) { return profile.output.colors[role]; }).filter(Boolean),
      headingFont: makeField(profile.output.headingFont, FONT_OPTIONS),
      bodyFont: makeField(profile.output.bodyFont, FONT_OPTIONS),
      mood: makeField(profile.output.mood, MOOD_OPTIONS),
      voice: makeField(profile.output.voice, BRAND_VOICE_OPTIONS),
      coreValues: founderOutput.values.slice(),
      mission: makeField(founderOutput.missionStatement, [], { isFreeText: true }),
    });
  }

  // ---------------------------------------------------------------------
  // UI — right-column section inside the Branding Studio step.
  // ---------------------------------------------------------------------
  var expandedKitId = null;
  var renamingKitId = null;

  function renderKitFields(kit) {
    var ui = BrandHaus.ui;
    var fieldsWrap = ui.el("div", { class: "bh-field-group__fields" });

    fieldsWrap.appendChild(ui.renderColorPickerList({
      title: "Colors", subtitle: "Up to " + MAX_COLORS + ".", colors: kit.fields.colors, max: MAX_COLORS,
      onUpdate: function (i, hex) { var next = kit.fields.colors.slice(); next[i] = hex; updateKitColors(kit.id, next); BrandHaus.ui.renderApp(); },
      onAdd: function () { updateKitColors(kit.id, kit.fields.colors.concat(["#6B6860"])); BrandHaus.ui.renderApp(); },
      onRemove: function (i) { updateKitColors(kit.id, kit.fields.colors.filter(function (_, idx) { return idx !== i; })); BrandHaus.ui.renderApp(); },
    }));

    fieldsWrap.appendChild(ui.el("div", { class: "bh-field-group__fields" }, [
      ui.renderFontPreviewField({ label: "Heading Font", field: kit.fields.headingFont }, function (changes) { updateKitField(kit.id, "headingFont", changes); BrandHaus.ui.renderApp(); }),
      ui.renderFontPreviewField({ label: "Body Font", field: kit.fields.bodyFont }, function (changes) { updateKitField(kit.id, "bodyFont", changes); BrandHaus.ui.renderApp(); }),
    ]));

    fieldsWrap.appendChild(ui.renderPlainFieldRow(
      [{ label: "Mood", field: kit.fields.mood }, { label: "Voice", field: kit.fields.voice }],
      function (entry, changes) {
        if (entry.label === "Mood") updateKitField(kit.id, "mood", changes);
        else updateKitField(kit.id, "voice", changes);
        BrandHaus.ui.renderApp();
      }
    ));

    fieldsWrap.appendChild(ui.renderTextSlotList({
      title: "Core Values", subtitle: "Up to " + MAX_VALUES + ".", icon: "heart", values: kit.fields.coreValues, max: MAX_VALUES, singular: "Value", placeholder: "e.g. Community",
      onUpdate: function (i, v) { var next = kit.fields.coreValues.slice(); next[i] = v; updateKitValues(kit.id, next); },
      onAdd: function () { updateKitValues(kit.id, kit.fields.coreValues.concat([""])); BrandHaus.ui.renderApp(); },
      onRemove: function (i) { updateKitValues(kit.id, kit.fields.coreValues.filter(function (_, idx) { return idx !== i; })); BrandHaus.ui.renderApp(); },
    }));

    fieldsWrap.appendChild(ui.renderFreeTextField({ label: "Mission Statement", field: kit.fields.mission, placeholder: "In a sentence or two, what does this brand do and why does it matter?" }, function (changes) { updateKitField(kit.id, "mission", changes); BrandHaus.ui.renderApp(); }));

    return fieldsWrap;
  }

  // "Set Active" used to only flip a flag other Haus products read later
  // (Marketing Haus folds it into generated prompts at assembly time) —
  // inside Brand Haus itself nothing ever consumed that flag, so clicking
  // it visibly did nothing. These two functions are what "active" should
  // have meant here all along: load the kit straight into whichever
  // studio is open, right now, the same way finishing the Brand DNA
  // Assessment already auto-populates Branding Studio.
  function applyKitToBranding(kit) {
    if (!BrandHaus.branding) return;
    BrandHaus.branding.applyBrandDNAResult({
      colors: (kit.fields.colors || []).filter(Boolean),
      headingFont: resolved(kit.fields.headingFont),
      bodyFont: resolved(kit.fields.bodyFont),
      mood: resolved(kit.fields.mood),
      brandVoice: resolved(kit.fields.voice),
      values: (kit.fields.coreValues || []).map(function (v) { return (v || "").trim(); }).filter(Boolean),
      mission: resolved(kit.fields.mission),
    });
  }

  // Logo Studio has no mood/voice/values/mission concept and only 4
  // named color roles (not a free-length palette) — apply what maps
  // cleanly (first 4 saved colors, heading/body font) and leave the rest
  // of its own fields (logo type, iconography, etc.) untouched.
  function applyKitToLogo(kit) {
    if (!BrandHaus.logo) return;
    var colors = (kit.fields.colors || []).filter(Boolean);
    ["primary", "secondary", "accent", "neutral"].forEach(function (role, i) {
      if (colors[i]) BrandHaus.logo.updateColorField(role, { value: colors[i] });
    });
    var headingFont = resolved(kit.fields.headingFont);
    var bodyFont = resolved(kit.fields.bodyFont);
    if (headingFont) BrandHaus.logo.updateTypographyField("primaryFont", { value: headingFont, customValue: "" });
    if (bodyFont) BrandHaus.logo.updateTypographyField("secondaryFont", { value: bodyFont, customValue: "" });
  }

  function renderKitCard(kit, isActive, mode) {
    var ui = BrandHaus.ui;
    var isExpanded = expandedKitId === kit.id;

    var titleRow;
    if (renamingKitId === kit.id) {
      var titleInput = ui.el("input", { type: "text", class: "bh-saved__item-title-input", value: kit.name });
      var confirmRename = function () { renameKit(kit.id, titleInput.value.trim() || kit.name); renamingKitId = null; BrandHaus.ui.renderApp(); };
      titleInput.addEventListener("keydown", function (e) { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") { renamingKitId = null; BrandHaus.ui.renderApp(); } });
      titleInput.addEventListener("blur", confirmRename);
      titleRow = ui.el("div", { class: "bh-saved__item-title-row" }, [titleInput]);
    } else {
      var renameBtn = ui.el("button", { type: "button", class: "bh-saved__rename-btn", title: "Rename" }, [ui.icon("edit")]);
      renameBtn.addEventListener("click", function () { renamingKitId = kit.id; BrandHaus.ui.renderApp(); });
      titleRow = ui.el("div", { class: "bh-saved__item-title-row" }, [
        ui.el("p", { class: "bh-saved__item-title", text: kit.name + (isActive ? " (active)" : "") }),
        renameBtn,
      ]);
    }

    var activeBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--small " + (isActive ? "bh-btn--reset" : "bh-btn--copy"), text: isActive ? "Turn Off" : "Set Active — Apply to This Studio" });
    activeBtn.addEventListener("click", function () {
      var turningOn = !isActive;
      setActiveKit(turningOn ? kit.id : null);
      if (turningOn) {
        if (mode === "logo") applyKitToLogo(kit); else applyKitToBranding(kit);
      }
      BrandHaus.ui.renderApp();
    });

    var expandBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--small", text: isExpanded ? "Hide Fields" : "Edit Fields" });
    expandBtn.addEventListener("click", function () { expandedKitId = isExpanded ? null : kit.id; BrandHaus.ui.renderApp(); });

    var deleteBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--delete bh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { deleteKit(kit.id); BrandHaus.ui.renderApp(); });

    var children = [titleRow, ui.el("div", { class: "bh-saved__item-actions" }, [activeBtn, expandBtn, deleteBtn])];
    if (isExpanded) children.push(renderKitFields(kit));

    return ui.el("div", { class: "bh-saved__item" + (isActive ? " bh-collection__item--combined" : "") }, children);
  }

  function renderSaveFromAssessmentRow() {
    var ui = BrandHaus.ui;
    var results = BrandHaus.founderInterview.getState().results;
    if (!results || isFull()) return null;
    var nameInput = ui.el("input", { type: "text", class: "bh-field__custom", placeholder: "Name this identity, e.g. \"" + results.match.best.profile.name + "\"" });
    var saveBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--add bh-btn--small", text: "+ Save Assessment Match to Brand Kit" });
    saveBtn.addEventListener("click", function () {
      var result = createKitFromAssessment(nameInput.value, results.match.best.profile, results.founderOutput);
      if (result.ok) BrandHaus.ui.renderApp();
    });
    return ui.el("div", { class: "bh-companion__controls" }, [nameInput, saveBtn]);
  }

  function renderSection(root, mode) {
    var ui = BrandHaus.ui;
    var kits = getAllKits();
    var activeKit = getActiveKit();

    var list = ui.el("div", { class: "bh-saved__list" });
    if (!kits.length) {
      list.appendChild(ui.el("p", { class: "bh-saved__empty", text: "No Brand Kits yet — save your assessment match or create one below." }));
    } else {
      kits.forEach(function (kit) { list.appendChild(renderKitCard(kit, !!activeKit && activeKit.id === kit.id, mode)); });
    }

    var fromAssessmentRow = renderSaveFromAssessmentRow();

    var createRow;
    if (!isFull()) {
      var nameInput = ui.el("input", { type: "text", class: "bh-field__custom", placeholder: "New identity name, e.g. \"Client: Wildroot\"" });
      var createBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--add bh-btn--small", text: "+ Create Blank Brand Kit" });
      createBtn.addEventListener("click", function () {
        var result = createKit(nameInput.value);
        if (result.ok) BrandHaus.ui.renderApp();
      });
      createRow = ui.el("div", { class: "bh-companion__controls" }, [nameInput, createBtn]);
    } else {
      createRow = ui.el("p", { class: "bh-field-group__subtitle", text: "You have " + MAX_KITS + "/" + MAX_KITS + " Brand Kits — delete one to create another." });
    }

    var children = [
      ui.el("h3", { class: "bh-saved__title" }, [ui.icon("palette"), ui.el("span", { text: "Brand Kit (" + kits.length + "/" + MAX_KITS + ")" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "Up to " + MAX_KITS + " saved identities — these also appear in Marketing Haus's own Brand Kit if you have access there. \"Set Active\" loads a kit's colors and fonts straight into this studio's fields." }),
      list,
    ];
    if (fromAssessmentRow) children.push(fromAssessmentRow);
    children.push(createRow);

    root.appendChild(ui.el("div", { class: "bh-saved" }, children));
  }

  BrandHaus.brandKit = {
    MAX_KITS: MAX_KITS,
    getAllKits: getAllKits,
    isFull: isFull,
    getActiveKit: getActiveKit,
    createKit: createKit,
    createKitFromAssessment: createKitFromAssessment,
    deleteKit: deleteKit,
    renameKit: renameKit,
    setActiveKit: setActiveKit,
    renderSection: renderSection,
  };
})();
