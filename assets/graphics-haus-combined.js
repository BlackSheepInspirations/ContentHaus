/**
 * The AI Creator's Graphics Haus — Combined Mode
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, graphics-haus-generators.js, and (for the
 * shared-style prefill) graphics-haus-looklock.js — all must load first.
 *
 * Content Haus's own Combined Mode is a fixed, always-on weave across a
 * fixed set of modes (Character + Text + Graphics) that share one natural
 * "one photo" subject. Graphics Haus's 7 generators don't share that —
 * a Clipart Pack fox and a License Plate and a Mascot pose have nothing
 * in common to weave field-by-field. So this is a different, simpler
 * mechanic tailored to that reality (confirmed with the owner, who was
 * open to "guardrails" on this): pick 2-3 generators, declare ONE shared
 * art style + color palette, and get one prompt instructing the AI to
 * render all of the selected generators' own current subjects together
 * sharing that one look — never reaching into any other Haus, per the
 * owner's explicit "of the 7, not of things from other hauses" scoping.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;
  var makeField = GraphicsHaus.util.makeField;
  var createStore = GraphicsHaus.util.createStore;
  var updateFieldUtil = GraphicsHaus.util.updateField;
  var resolveFieldValue = GraphicsHaus.engine.resolveFieldValue;

  var MAX_SELECTED = 3;
  var MIN_SELECTED = 2;

  var ART_STYLE_OPTIONS = [
    "cartoon style illustration", "flat vector illustration", "storybook gouache illustration",
    "retro comic pop art", "photorealistic product shot", "clean vector flat design",
    "bold graphic poster design", "coloring book illustration",
  ].sort();

  var PALETTE_OPTIONS = [
    "Warm Autumn (rust, cream, forest green)", "Pastel Dreamscape (blush, lilac, sky blue)",
    "Bold Primary Pop (red, blue, yellow)", "Classic Black & Gold",
    "Soft Neutral (beige, cream, taupe)", "Vibrant Tropical (coral, teal, sunshine yellow)",
    "Moody Jewel Tones (emerald, sapphire, plum)", "Rainbow Multicolor",
  ];

  function buildInitialState() {
    return {
      selectedIds: [],
      sharedArtStyle: makeField("", ART_STYLE_OPTIONS),
      sharedPalette: makeField("", PALETTE_OPTIONS),
      _styleSyncedLookId: null,
    };
  }

  var store = createStore(buildInitialState());

  function toggleGenerator(id) {
    var state = store.getState();
    var chosen = state.selectedIds.slice();
    var i = chosen.indexOf(id);
    if (i !== -1) chosen.splice(i, 1);
    else if (chosen.length < MAX_SELECTED) chosen.push(id);
    store.setState({ selectedIds: chosen });
  }

  // Prefills the shared style/palette from the active Look Lock look
  // (once per Look change) so Combined starts from whatever aesthetic is
  // already active elsewhere, rather than an empty dropdown every time —
  // same "zero input still works" convention as every generator.
  function ensureStyleFromLookLock() {
    if (!GraphicsHaus.lookLock) return;
    var state = store.getState();
    var activeLookId = GraphicsHaus.lookLock.getActiveLookId();
    if (state._styleSyncedLookId === activeLookId) return;
    if (activeLookId) {
      var look = GraphicsHaus.lookLock.getActiveLook();
      if (look) {
        var artStyle = resolveFieldValue(look.fields.artStyle);
        var palette = resolveFieldValue(look.fields.palette);
        var patch = {};
        if (artStyle) patch.sharedArtStyle = Object.assign({}, state.sharedArtStyle, { value: "", customValue: artStyle });
        if (palette) patch.sharedPalette = Object.assign({}, state.sharedPalette, { value: "", customValue: palette });
        if (Object.keys(patch).length) store.setState(patch);
      }
    }
    store.setState({ _styleSyncedLookId: activeLookId });
  }

  function assemble() {
    var state = store.getState();
    var chosen = state.selectedIds || [];
    var artStyle = resolveFieldValue(state.sharedArtStyle) || "a cohesive illustrated style";
    var palette = resolveFieldValue(state.sharedPalette) || "a cohesive color palette";
    if (chosen.length < MIN_SELECTED) {
      return {
        text: "Pick at least " + MIN_SELECTED + " generators above (up to " + MAX_SELECTED + ") to build a combined prompt.",
        fragments: [],
        resolved: [],
      };
    }
    var parts = chosen.map(function (id, i) {
      var def = GraphicsHaus.generators.getGeneratorDef(id);
      var piece = GraphicsHaus.generators.assemblePromptForId(id);
      return (i + 1) + ". " + (def ? def.label : id) + " — " + piece.text;
    });
    var intro = "Combine the following " + chosen.length + " elements into one single, cohesively composed graphic:";
    var outro = "Apply this shared look uniformly across every element above: " + artStyle + ", with " + palette + ". Compose all elements together in one balanced, unified scene — not separate panels or a grid of unrelated pieces.\n\nClean commercial-quality graphic, crisp clean edges, high resolution, no watermarks.";
    var text = intro + "\n\n" + parts.join("\n\n") + "\n\n" + outro;
    return { text: text, fragments: [artStyle, palette], resolved: [] };
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var chosen = state.selectedIds || [];
    if (!chosen.length) return [];
    var labels = chosen.map(function (id) {
      var def = GraphicsHaus.generators.getGeneratorDef(id);
      return def ? def.label : id;
    });
    var items = [
      { label: "Elements", value: labels.join(", ") },
      { label: "Shared Art Style", value: resolveFieldValue(state.sharedArtStyle) || "a cohesive illustrated style" },
      { label: "Shared Palette", value: resolveFieldValue(state.sharedPalette) || "a cohesive color palette" },
    ];
    return [{ title: "Combined", items: items }];
  }

  function randomize() {
    var defs = GraphicsHaus.generators.getAllDefs();
    var ids = defs.map(function (d) { return d.id; });
    var shuffled = ids.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
    }
    var count = Math.min(MAX_SELECTED, Math.max(MIN_SELECTED, Math.floor(Math.random() * (MAX_SELECTED - MIN_SELECTED + 1)) + MIN_SELECTED));
    var state = store.getState();
    store.setState({
      selectedIds: shuffled.slice(0, count),
      sharedArtStyle: Object.assign({}, state.sharedArtStyle, { value: ART_STYLE_OPTIONS[Math.floor(Math.random() * ART_STYLE_OPTIONS.length)], customValue: "" }),
      sharedPalette: Object.assign({}, state.sharedPalette, { value: PALETTE_OPTIONS[Math.floor(Math.random() * PALETTE_OPTIONS.length)], customValue: "" }),
    });
  }

  function reset() {
    store.setState(buildInitialState());
  }

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  function renderGeneratorPicker(state) {
    var ui = GraphicsHaus.ui;
    var defs = GraphicsHaus.generators.getAllDefs();
    var chosen = state.selectedIds || [];
    var wrap = ui.el("fieldset", { class: "gh-field-group" });
    wrap.appendChild(ui.el("legend", { class: "gh-field-group__title" }, [ui.icon("layers"), ui.el("span", { text: "Choose 2-3 Generators to Combine" })]));
    wrap.appendChild(ui.el("p", { class: "gh-field-group__subtitle", text: chosen.length + " of " + MAX_SELECTED + " selected (minimum " + MIN_SELECTED + ") — only these 7 generators, never pulled from another Haus." }));
    var row = ui.el("div", { class: "gh-pill-toggle" });
    defs.forEach(function (def) {
      var isActive = chosen.indexOf(def.id) !== -1;
      var btn = ui.el("button", { type: "button", class: "gh-pill-toggle__btn" + (isActive ? " is-active" : "") }, [ui.icon(def.icon || "sparkle", "gh-pill-toggle__icon"), ui.el("span", { text: def.label })]);
      btn.disabled = !isActive && chosen.length >= MAX_SELECTED;
      btn.addEventListener("click", function () { toggleGenerator(def.id); GraphicsHaus.ui.renderApp(); });
      row.appendChild(btn);
    });
    wrap.appendChild(row);
    return wrap;
  }

  function renderPanel() {
    ensureStyleFromLookLock();
    var ui = GraphicsHaus.ui;
    var state = store.getState();
    var wrap = ui.el("div", { class: "gh-panel gh-generator-panel" });
    wrap.appendChild(ui.el("h3", { class: "gh-generator-panel__title" }, [ui.icon("layers"), ui.el("span", { text: "Combined" })]));
    wrap.appendChild(ui.el("p", { class: "gh-generator-panel__description", text: "Blend 2-3 of your own generators into one cohesively-styled combined graphic. Each generator keeps its own current subject/fields — you're just declaring one shared art style and palette across all of them." }));
    wrap.appendChild(renderGeneratorPicker(state));
    wrap.appendChild(ui.renderFieldGroup(
      "Shared Look",
      [
        { label: "Shared Art Style", field: state.sharedArtStyle, name: "sharedArtStyle" },
        { label: "Shared Color Palette", field: state.sharedPalette, name: "sharedPalette" },
      ],
      function (entry, changes) {
        updateFieldUtil(store, entry.name, changes);
        GraphicsHaus.ui.renderApp();
      },
      GraphicsHaus.lookLock && GraphicsHaus.lookLock.getActiveLookId() ? "Prefilled from your active Look — change it here without affecting that Look." : "Applies once, across every combined element."
    ));
    return wrap;
  }

  GraphicsHaus.combined = {
    getState: store.getState,
    setState: store.setState,
    renderPanel: renderPanel,
    getSelectionsByGroup: getSelectionsByGroup,
    assemblePrompt: assemble,
    randomize: randomize,
    reset: reset,
  };
})();
