/**
 * The AI Creator's Graphics Haus — Look Lock
 * Depends on graphics-haus-util.js, graphics-haus-engine.js, and
 * graphics-haus-ui.js's exposed GraphicsHaus.ui helpers (all must load
 * first). Quick Generators' cross-generator answer to Brand Kit: instead
 * of business branding (colors, fonts, voice), a Look captures the
 * *aesthetic* of one creative page (art style, palette, mood, texture,
 * motifs) so it can drive every OTHER generator's matching fields too —
 * the fix for "I loved page 1's look, now page 2 doesn't match."
 *
 * Persisted independently, like Brand Kit — not part of a Vault/Recent
 * Log snapshot. A Look is meant to outlive any single saved prompt (you
 * build a whole themed set under one active Look), so loading an old,
 * unrelated saved item should never silently switch which Look is
 * active — same reasoning Brand Kit's own kit selection already follows.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;
  var makeField = GraphicsHaus.util.makeField;

  var STORAGE_KEY = "graphicsHausLookLocks";
  var MAX_LOOKS = 5;

  // Universal aesthetic vocabulary every generator's `aesthetic`-flagged
  // fields map onto — see graphics-haus-generators.js's applyActiveLookToGenerator.
  var LOOK_FIELD_NAMES = ["artStyle", "palette", "mood", "texture", "motifs"];
  var LOOK_FIELD_LABELS = {
    artStyle: "Art Style",
    palette: "Color Palette",
    mood: "Mood",
    texture: "Texture / Background",
    motifs: "Recurring Motifs",
  };

  function buildLookFields() {
    var fields = {};
    LOOK_FIELD_NAMES.forEach(function (name) {
      fields[name] = makeField("", [], { isFreeText: true });
    });
    return fields;
  }

  function readPersisted() {
    if (!window.localStorage) return { looks: [], activeLookId: null };
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (parsed && Array.isArray(parsed.looks)) return { looks: parsed.looks, activeLookId: parsed.activeLookId || null };
    } catch (e) {
      // fall through to default
    }
    return { looks: [], activeLookId: null };
  }

  function writePersisted(state) {
    if (!window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ looks: state.looks, activeLookId: state.activeLookId }));
  }

  var store = GraphicsHaus.util.createStore(readPersisted());

  function commit(patch) {
    store.setState(patch);
    writePersisted(store.getState());
  }

  function getAllLooks() {
    return store.getState().looks;
  }
  function isFull() {
    return getAllLooks().length >= MAX_LOOKS;
  }
  function getActiveLookId() {
    return store.getState().activeLookId;
  }
  function getActiveLook() {
    var id = getActiveLookId();
    if (!id) return null;
    return getAllLooks().filter(function (l) { return l.id === id; })[0] || null;
  }

  function createLook(name) {
    var state = store.getState();
    if (state.looks.length >= MAX_LOOKS) {
      return { ok: false, reason: "You already have " + MAX_LOOKS + " Looks saved — delete one to create another." };
    }
    var look = { id: "ghlook-" + Date.now() + "-" + Math.floor(Math.random() * 10000), name: (name || "").trim() || "Untitled Look", createdAt: Date.now(), fields: buildLookFields() };
    commit({ looks: state.looks.concat([look]) });
    return { ok: true, id: look.id };
  }

  function deleteLook(id) {
    var state = store.getState();
    commit({ looks: state.looks.filter(function (l) { return l.id !== id; }), activeLookId: state.activeLookId === id ? null : state.activeLookId });
  }

  function renameLook(id, newName) {
    var state = store.getState();
    commit({ looks: state.looks.map(function (l) { return l.id === id ? Object.assign({}, l, { name: (newName || "").trim() || "Untitled Look" }) : l; }) });
  }

  function setActiveLook(id) {
    commit({ activeLookId: id });
  }

  function updateLookField(id, fieldName, changes) {
    var state = store.getState();
    commit({
      looks: state.looks.map(function (l) {
        if (l.id !== id) return l;
        var fields = Object.assign({}, l.fields);
        fields[fieldName] = Object.assign({}, fields[fieldName], changes);
        return Object.assign({}, l, { fields: fields });
      }),
    });
  }

  // Patches the active Look's fields from a plain {key: value} map (only
  // overwriting keys present in the map — a generator with only 2 of the
  // 5 aesthetic fields shouldn't blank out the other 3), or creates+
  // activates a brand-new Look if none is active yet. This is the "Lock
  // This Look" button's whole implementation — zero retyping.
  function captureIntoActiveOrNewLook(map, sourceLabel) {
    var active = getActiveLook();
    if (!active) {
      var result = createLook("Look from " + sourceLabel);
      if (!result.ok) return result;
      setActiveLook(result.id);
      active = getAllLooks().filter(function (l) { return l.id === result.id; })[0];
    }
    Object.keys(map).forEach(function (key) {
      if (LOOK_FIELD_NAMES.indexOf(key) === -1) return;
      updateLookField(active.id, key, { value: map[key] });
    });
    return { ok: true, id: active.id };
  }

  // ---------------------------------------------------------------------
  // UI — persistent right-sidebar section inside Quick Generators only
  // (per-generator apply/capture is wired from graphics-haus-generators.js).
  // ---------------------------------------------------------------------
  var expandedLookId = null;
  var renamingLookId = null;

  function renderLookFields(look) {
    var ui = GraphicsHaus.ui;
    var fieldsWrap = ui.el("div", { class: "gh-field-group__fields" });
    LOOK_FIELD_NAMES.forEach(function (name) {
      fieldsWrap.appendChild(ui.renderFreeTextField(
        { label: LOOK_FIELD_LABELS[name], field: look.fields[name], placeholder: "e.g. ..." },
        function (changes) { updateLookField(look.id, name, changes); GraphicsHaus.ui.renderApp(); }
      ));
    });
    return fieldsWrap;
  }

  function renderLookCard(look, isActive) {
    var ui = GraphicsHaus.ui;
    var isExpanded = expandedLookId === look.id;

    var titleRow;
    if (renamingLookId === look.id) {
      var titleInput = ui.el("input", { type: "text", class: "gh-saved__item-title-input", value: look.name });
      var confirmRename = function () { renameLook(look.id, titleInput.value.trim() || look.name); renamingLookId = null; GraphicsHaus.ui.renderApp(); };
      titleInput.addEventListener("keydown", function (e) { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") { renamingLookId = null; GraphicsHaus.ui.renderApp(); } });
      titleInput.addEventListener("blur", confirmRename);
      titleRow = ui.el("div", { class: "gh-saved__item-title-row" }, [titleInput]);
    } else {
      var renameBtn = ui.el("button", { type: "button", class: "gh-saved__rename-btn", title: "Rename" }, [ui.icon("edit")]);
      renameBtn.addEventListener("click", function () { renamingLookId = look.id; GraphicsHaus.ui.renderApp(); });
      titleRow = ui.el("div", { class: "gh-saved__item-title-row" }, [
        ui.el("p", { class: "gh-saved__item-title", text: look.name + (isActive ? " (active)" : "") }),
        renameBtn,
      ]);
    }

    var activeBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small " + (isActive ? "gh-btn--reset" : "gh-btn--copy"), text: isActive ? "Turn Off" : "Set Active" });
    activeBtn.addEventListener("click", function () { setActiveLook(isActive ? null : look.id); GraphicsHaus.ui.renderApp(); });

    var expandBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small", text: isExpanded ? "Hide Fields" : "Edit Fields" });
    expandBtn.addEventListener("click", function () { expandedLookId = isExpanded ? null : look.id; GraphicsHaus.ui.renderApp(); });

    var deleteBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--delete gh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { deleteLook(look.id); GraphicsHaus.ui.renderApp(); });

    var children = [titleRow, ui.el("div", { class: "gh-saved__item-actions" }, [activeBtn, expandBtn, deleteBtn])];
    if (isExpanded) children.push(renderLookFields(look));

    return ui.el("div", { class: "gh-saved__item" + (isActive ? " gh-collection__item--combined" : ""), style: isActive ? "border-color: var(--gh-espresso);" : "" }, children);
  }

  function renderSection(root) {
    var ui = GraphicsHaus.ui;
    var looks = getAllLooks();
    var activeLook = getActiveLook();

    var list = ui.el("div", { class: "gh-saved__list" });
    if (!looks.length) {
      list.appendChild(ui.el("p", { class: "gh-saved__empty", text: "No Looks yet — build a generator result you love, then click \"Lock This Look\" below its fields, or create one here." }));
    } else {
      looks.forEach(function (look) { list.appendChild(renderLookCard(look, !!activeLook && activeLook.id === look.id)); });
    }

    var createRow;
    if (!isFull()) {
      var nameInput = ui.el("input", { type: "text", class: "gh-field__custom", placeholder: "New Look name, e.g. \"Dark Academia Journal\"" });
      var createBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--add gh-btn--small", text: "+ Create Look" });
      createBtn.addEventListener("click", function () {
        var result = createLook(nameInput.value);
        if (result.ok) GraphicsHaus.ui.renderApp();
      });
      createRow = ui.el("div", { class: "gh-companion__controls" }, [nameInput, createBtn]);
    } else {
      createRow = ui.el("p", { class: "gh-field-group__subtitle", text: "You have " + MAX_LOOKS + "/" + MAX_LOOKS + " Looks — delete one to create another." });
    }

    root.appendChild(ui.el("div", { class: "gh-saved" }, [
      ui.el("h3", { class: "gh-saved__title" }, [ui.icon("palette"), ui.el("span", { text: "Look Lock (" + looks.length + "/" + MAX_LOOKS + ")" })]),
      ui.el("p", { class: "gh-field-group__subtitle", text: "Lock one generator's art style, palette, mood, and texture, then every other generator's matching fields pick it up automatically — the fix for a second page not matching the first." }),
      list,
      createRow,
    ]));
  }

  GraphicsHaus.lookLock = {
    MAX_LOOKS: MAX_LOOKS,
    LOOK_FIELD_NAMES: LOOK_FIELD_NAMES,
    getAllLooks: getAllLooks,
    isFull: isFull,
    getActiveLook: getActiveLook,
    getActiveLookId: getActiveLookId,
    createLook: createLook,
    deleteLook: deleteLook,
    renameLook: renameLook,
    setActiveLook: setActiveLook,
    updateLookField: updateLookField,
    captureIntoActiveOrNewLook: captureIntoActiveOrNewLook,
    renderSection: renderSection,
  };
})();
