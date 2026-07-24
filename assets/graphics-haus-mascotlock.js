/**
 * The AI Creator's Graphics Haus — Mascot Lock
 * Depends on graphics-haus-util.js, graphics-haus-engine.js, and
 * graphics-haus-ui.js's exposed GraphicsHaus.ui helpers (all must load
 * first). Same named-profile pattern as Look Lock and Brand Kit, but for
 * a recurring brand CHARACTER instead of a general aesthetic or business
 * branding — species/type, signature traits, palette, art style, and
 * personality, authored once so every future pose of that character stays
 * recognizably the same mascot.
 *
 * Deliberately independent of Look Lock's `aesthetic` bridge: a mascot's
 * own art style and palette must stay fixed to that specific character
 * regardless of whatever Look happens to be active elsewhere — activating
 * a different Look for an unrelated clipart pack should never quietly
 * change what the shop's mascot looks like. graphics-haus-generators-
 * mascot.js reads the active mascot directly via getActiveMascot(),
 * the same way Brand Kit's entries get pulled in at assembly time, not
 * through the per-field `aesthetic` flag.
 *
 * Persisted independently, like Look Lock and Brand Kit — not part of a
 * Vault/Recent Log snapshot.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;
  var makeField = GraphicsHaus.util.makeField;

  var STORAGE_KEY = "graphicsHausMascotLocks";
  var MAX_MASCOTS = 3;

  var MASCOT_TYPE_OPTIONS = ["Cute Animal", "Fantasy Creature", "Blob / Abstract Character", "Object with a Face", "Human-like Character", "Robot / Sci-Fi Character"];
  var COLOR_PALETTE_OPTIONS = ["Soft Pastels", "Bright & Playful", "Warm Earth Tones", "Cool Blues & Teals", "Monochrome with One Pop Color", "Bold Primary Colors"];
  var ART_STYLE_OPTIONS = ["Chibi / Kawaii", "Flat Vector Illustration", "Hand-Drawn Doodle", "Soft 3D / Clay Render"];
  var PERSONALITY_OPTIONS = ["Friendly & Warm", "Playful & Silly", "Confident & Bold", "Calm & Wise", "Energetic & Bold"];

  function buildMascotFields() {
    return {
      mascotType: makeField("", MASCOT_TYPE_OPTIONS),
      signatureTraits: makeField("", [], { isFreeText: true }),
      colorPalette: makeField("", COLOR_PALETTE_OPTIONS),
      artStyle: makeField("", ART_STYLE_OPTIONS),
      personality: makeField("", PERSONALITY_OPTIONS),
    };
  }

  function readPersisted() {
    if (!window.localStorage) return { mascots: [], activeMascotId: null };
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (parsed && Array.isArray(parsed.mascots)) return { mascots: parsed.mascots, activeMascotId: parsed.activeMascotId || null };
    } catch (e) {
      // fall through to default
    }
    return { mascots: [], activeMascotId: null };
  }

  function writePersisted(state) {
    if (!window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mascots: state.mascots, activeMascotId: state.activeMascotId }));
  }

  var store = GraphicsHaus.util.createStore(readPersisted());

  function commit(patch) {
    store.setState(patch);
    writePersisted(store.getState());
  }

  function getAllMascots() {
    return store.getState().mascots;
  }
  function isFull() {
    return getAllMascots().length >= MAX_MASCOTS;
  }
  function getActiveMascotId() {
    return store.getState().activeMascotId;
  }
  function getActiveMascot() {
    var id = getActiveMascotId();
    if (!id) return null;
    return getAllMascots().filter(function (m) { return m.id === id; })[0] || null;
  }

  function createMascot(name) {
    var state = store.getState();
    if (state.mascots.length >= MAX_MASCOTS) {
      return { ok: false, reason: "You already have " + MAX_MASCOTS + " mascots saved — delete one to create another." };
    }
    var mascot = { id: "ghmascot-" + Date.now() + "-" + Math.floor(Math.random() * 10000), name: (name || "").trim() || "Untitled Mascot", createdAt: Date.now(), fields: buildMascotFields() };
    commit({ mascots: state.mascots.concat([mascot]) });
    return { ok: true, id: mascot.id };
  }

  function deleteMascot(id) {
    var state = store.getState();
    commit({ mascots: state.mascots.filter(function (m) { return m.id !== id; }), activeMascotId: state.activeMascotId === id ? null : state.activeMascotId });
  }

  function renameMascot(id, newName) {
    var state = store.getState();
    commit({ mascots: state.mascots.map(function (m) { return m.id === id ? Object.assign({}, m, { name: (newName || "").trim() || "Untitled Mascot" }) : m; }) });
  }

  function setActiveMascot(id) {
    commit({ activeMascotId: id });
  }

  function updateMascotField(id, fieldName, changes) {
    var state = store.getState();
    commit({
      mascots: state.mascots.map(function (m) {
        if (m.id !== id) return m;
        var fields = Object.assign({}, m.fields);
        fields[fieldName] = Object.assign({}, fields[fieldName], changes);
        return Object.assign({}, m, { fields: fields });
      }),
    });
  }

  // ---------------------------------------------------------------------
  // UI — persistent right-sidebar section, same placement as Look Lock
  // and Brand Kit, between the two (aesthetic-wide -> character-specific
  // -> business-wide reading order).
  // ---------------------------------------------------------------------
  var expandedMascotId = null;
  var renamingMascotId = null;
  var mascotLockExpanded = false;

  function renderMascotFields(mascot) {
    var ui = GraphicsHaus.ui;
    var fieldsWrap = ui.el("div", { class: "gh-field-group__fields" });

    fieldsWrap.appendChild(ui.renderPlainFieldRow(
      [
        { label: "Mascot Type", field: mascot.fields.mascotType },
        { label: "Art Style", field: mascot.fields.artStyle },
      ],
      function (entry, changes) {
        if (entry.label === "Mascot Type") updateMascotField(mascot.id, "mascotType", changes);
        else updateMascotField(mascot.id, "artStyle", changes);
        GraphicsHaus.ui.renderApp();
      }
    ));

    fieldsWrap.appendChild(ui.renderPlainFieldRow(
      [
        { label: "Color Palette", field: mascot.fields.colorPalette },
        { label: "Personality", field: mascot.fields.personality },
      ],
      function (entry, changes) {
        if (entry.label === "Color Palette") updateMascotField(mascot.id, "colorPalette", changes);
        else updateMascotField(mascot.id, "personality", changes);
        GraphicsHaus.ui.renderApp();
      }
    ));

    fieldsWrap.appendChild(ui.renderFreeTextField(
      { label: "Signature Traits", field: mascot.fields.signatureTraits, placeholder: "e.g. round glasses, a red bandana, one big front tooth" },
      function (changes) { updateMascotField(mascot.id, "signatureTraits", changes); GraphicsHaus.ui.renderApp(); }
    ));

    return fieldsWrap;
  }

  function renderMascotCard(mascot, isActive) {
    var ui = GraphicsHaus.ui;
    var isExpanded = expandedMascotId === mascot.id;

    var titleRow;
    if (renamingMascotId === mascot.id) {
      var titleInput = ui.el("input", { type: "text", class: "gh-saved__item-title-input", value: mascot.name });
      var confirmRename = function () { renameMascot(mascot.id, titleInput.value.trim() || mascot.name); renamingMascotId = null; GraphicsHaus.ui.renderApp(); };
      titleInput.addEventListener("keydown", function (e) { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") { renamingMascotId = null; GraphicsHaus.ui.renderApp(); } });
      titleInput.addEventListener("blur", confirmRename);
      titleRow = ui.el("div", { class: "gh-saved__item-title-row" }, [titleInput]);
    } else {
      var renameBtn = ui.el("button", { type: "button", class: "gh-saved__rename-btn", title: "Rename" }, [ui.icon("edit")]);
      renameBtn.addEventListener("click", function () { renamingMascotId = mascot.id; GraphicsHaus.ui.renderApp(); });
      titleRow = ui.el("div", { class: "gh-saved__item-title-row" }, [
        ui.el("p", { class: "gh-saved__item-title", text: mascot.name + (isActive ? " (active)" : "") }),
        renameBtn,
      ]);
    }

    var activeBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small " + (isActive ? "gh-btn--reset" : "gh-btn--copy"), text: isActive ? "Turn Off" : "Set Active" });
    activeBtn.addEventListener("click", function () { setActiveMascot(isActive ? null : mascot.id); GraphicsHaus.ui.renderApp(); });

    var expandBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small", text: isExpanded ? "Hide Fields" : "Edit Fields" });
    expandBtn.addEventListener("click", function () { expandedMascotId = isExpanded ? null : mascot.id; GraphicsHaus.ui.renderApp(); });

    var deleteBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--delete gh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { deleteMascot(mascot.id); GraphicsHaus.ui.renderApp(); });

    var children = [titleRow, ui.el("div", { class: "gh-saved__item-actions" }, [activeBtn, expandBtn, deleteBtn])];
    if (isExpanded) children.push(renderMascotFields(mascot));

    return ui.el("div", { class: "gh-saved__item" + (isActive ? " gh-collection__item--combined" : ""), style: isActive ? "border-color: var(--gh-espresso);" : "" }, children);
  }

  function renderSection(root) {
    var ui = GraphicsHaus.ui;
    var mascots = getAllMascots();
    var activeMascot = getActiveMascot();

    var list = ui.el("div", { class: "gh-saved__list" });
    if (!mascots.length) {
      list.appendChild(ui.el("p", { class: "gh-saved__empty", text: "No mascots yet — create one below, then use the Mascot Generator to render it in as many poses as you need." }));
    } else {
      // Collapsed by default to just the active mascot (or the first one if none is active).
      var visible = mascotLockExpanded ? mascots : [mascots[activeMascot ? mascots.indexOf(activeMascot) : 0] || mascots[0]];
      visible.forEach(function (mascot) { list.appendChild(renderMascotCard(mascot, !!activeMascot && activeMascot.id === mascot.id)); });
    }

    var createRow;
    if (!isFull()) {
      var nameInput = ui.el("input", { type: "text", class: "gh-field__custom", placeholder: "New mascot name, e.g. \"Biscuit the Shop Dog\"" });
      var createBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--add gh-btn--small", text: "+ Create Mascot" });
      createBtn.addEventListener("click", function () {
        var result = createMascot(nameInput.value);
        if (result.ok) GraphicsHaus.ui.renderApp();
      });
      createRow = ui.el("div", { class: "gh-companion__controls" }, [nameInput, createBtn]);
    } else {
      createRow = ui.el("p", { class: "gh-field-group__subtitle", text: "You have " + MAX_MASCOTS + "/" + MAX_MASCOTS + " mascots — delete one to create another." });
    }

    var headerChildren = [ui.el("h3", { class: "gh-saved__title" }, [ui.icon("person"), ui.el("span", { text: "Mascot Lock (" + mascots.length + "/" + MAX_MASCOTS + ")" })])];
    if (mascots.length > 1) {
      var toggleBtn = ui.el("button", { type: "button", class: "gh-faq__toggle" }, [
        ui.icon(mascotLockExpanded ? "eyeOff" : "eye"),
        ui.el("span", { text: mascotLockExpanded ? "Hide" : "Show full list" }),
      ]);
      toggleBtn.addEventListener("click", function () { mascotLockExpanded = !mascotLockExpanded; GraphicsHaus.ui.renderApp(); });
      headerChildren.push(toggleBtn);
    }
    root.appendChild(ui.el("div", { class: "gh-saved" }, [
      ui.el("div", { class: "gh-faq__header" }, headerChildren),
      ui.el("p", { class: "gh-field-group__subtitle", text: "Set your mascot's species, traits, palette, style, and personality once — the active mascot's identity carries into every pose the Mascot Generator creates, so it always stays recognizable." }),
      list,
      createRow,
    ]));
  }

  GraphicsHaus.mascotLock = {
    MAX_MASCOTS: MAX_MASCOTS,
    getAllMascots: getAllMascots,
    isFull: isFull,
    getActiveMascot: getActiveMascot,
    getActiveMascotId: getActiveMascotId,
    createMascot: createMascot,
    deleteMascot: deleteMascot,
    renameMascot: renameMascot,
    setActiveMascot: setActiveMascot,
    updateMascotField: updateMascotField,
    renderSection: renderSection,
  };
})();
