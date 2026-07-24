/**
 * The AI Creator's Graphics Haus — Collection Builder
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, graphics-haus-favorites.js,
 * graphics-haus-generators.js, graphics-haus-combined.js,
 * graphics-haus-reference.js — all must load first.
 *
 * Port of Content Haus's own Collection Builder (prompt-builder-ui.js):
 * a pure aggregation view over every OTHER mode's own live, currently-
 * set-up prompt (not a Vault browser) — "View All" any of them side by
 * side with a Select All/Deselect All toggle, or check up to 3 to splice
 * into one combined document. Eligible sources are the 7 generators plus
 * Combined and Image/Prompt Reference — Graphics Haus's own modes only,
 * per the owner's explicit "of the 7, not of things from other hauses"
 * scoping (Combined already enforces the same rule one level down).
 *
 * Unlike a generator, this mode has no single "current prompt" of its
 * own, so it doesn't plug into the standard Selections/Preview/Vault-for-
 * this-mode right column the way Combined/Reference do — it renders its
 * own self-contained panel (including its own Vault display for anything
 * saved from its "Combine" action) in graphics-haus-ui.js's dispatch.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var COMBINE_MAX = 3;

  var viewSelected = {};
  var combineSelected = {};

  function eligibleSources() {
    var sources = GraphicsHaus.generators.getAllDefs().map(function (def) {
      return { id: def.id, label: def.label, icon: def.icon || "sparkle" };
    });
    sources.push({ id: "combined", label: "Combined", icon: "layers" });
    sources.push({ id: "reference", label: "Image/Prompt Reference", icon: "upload" });
    return sources;
  }

  function vaultKeyFor(sourceId) {
    return GraphicsHaus.generators.getGeneratorDef(sourceId) ? "gen:" + sourceId : sourceId;
  }

  function getFormattedTextForSource(sourceId) {
    var assembled = sourceId === "combined"
      ? GraphicsHaus.combined.assemblePrompt()
      : sourceId === "reference"
        ? GraphicsHaus.reference.assemblePrompt()
        : GraphicsHaus.generators.assemblePromptForId(sourceId);
    var styleDNAState = GraphicsHaus.styleDNA.getState();
    return GraphicsHaus.engine.formatForPlatform(
      assembled,
      styleDNAState.targetPlatform.value,
      styleDNAState.aspectRatio.value,
      styleDNAState.negativePrompt.value,
      styleDNAState.addBuffer,
      styleDNAState.outputFormat.value
    );
  }

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  var saveFeedback = {};

  function renderViewChecklist(sources) {
    var ui = GraphicsHaus.ui;
    var allSelected = sources.every(function (s) { return !!viewSelected[s.id]; });
    var selectAllBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small " + (allSelected ? "gh-btn--delete" : "gh-btn--add"), text: allSelected ? "Deselect All" : "Select All" });
    selectAllBtn.addEventListener("click", function () {
      sources.forEach(function (s) { viewSelected[s.id] = !allSelected; });
      GraphicsHaus.ui.renderApp();
    });

    var list = ui.el("div", { class: "gh-collection__checklist" });
    sources.forEach(function (s) {
      var checkbox = ui.el("input", { type: "checkbox", class: "gh-field__checkbox" });
      checkbox.checked = !!viewSelected[s.id];
      checkbox.addEventListener("change", function () { viewSelected[s.id] = checkbox.checked; GraphicsHaus.ui.renderApp(); });
      var item = ui.el("label", { class: "gh-collection__checklist-item" }, [checkbox, ui.icon(s.icon), ui.el("span", { text: s.label })]);
      list.appendChild(item);
    });

    return ui.el("fieldset", { class: "gh-field-group" }, [
      ui.el("legend", { class: "gh-field-group__title" }, [ui.icon("document"), ui.el("span", { text: "View All" })]),
      ui.el("p", { class: "gh-field-group__subtitle" }, [selectAllBtn]),
      list,
    ]);
  }

  function renderViewedItem(source) {
    var ui = GraphicsHaus.ui;
    var text = getFormattedTextForSource(source.id);
    var copyBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--copy", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      ui.copyTextToClipboard(text, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });
    var vaultKey = vaultKeyFor(source.id);
    var isFull = GraphicsHaus.favorites.isFull(vaultKey);
    var saveBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--save", text: "Save to Vault" });
    saveBtn.disabled = isFull;
    saveBtn.addEventListener("click", function () {
      var result = GraphicsHaus.favorites.save(vaultKey, { text: text, title: ui.buildVaultTitle(vaultKey), snapshot: ui.buildVaultSnapshot(vaultKey) });
      saveFeedback[source.id] = result.ok ? "Saved!" : result.reason;
      GraphicsHaus.ui.renderApp();
      setTimeout(function () { delete saveFeedback[source.id]; GraphicsHaus.ui.renderApp(); }, 2500);
    });
    var children = [
      ui.el("h4", { class: "gh-collection__item-title" }, [ui.icon(source.icon), ui.el("span", { text: source.label })]),
      ui.el("p", { class: "gh-generator-variation__text", text: text }),
      ui.el("div", { class: "gh-collection__item-actions" }, [copyBtn, saveBtn]),
    ];
    if (saveFeedback[source.id]) children.push(ui.el("p", { class: "gh-preview__save-feedback is-success", text: saveFeedback[source.id] }));
    return ui.el("div", { class: "gh-collection__item" }, children);
  }

  function renderCombineChecklist(sources) {
    var ui = GraphicsHaus.ui;
    var count = sources.filter(function (s) { return !!combineSelected[s.id]; }).length;
    var list = ui.el("div", { class: "gh-collection__checklist" });
    sources.forEach(function (s) {
      var checkbox = ui.el("input", { type: "checkbox", class: "gh-field__checkbox" });
      checkbox.checked = !!combineSelected[s.id];
      checkbox.disabled = !checkbox.checked && count >= COMBINE_MAX;
      checkbox.addEventListener("change", function () { combineSelected[s.id] = checkbox.checked; GraphicsHaus.ui.renderApp(); });
      var item = ui.el("label", { class: "gh-collection__checklist-item" }, [checkbox, ui.icon(s.icon), ui.el("span", { text: s.label })]);
      list.appendChild(item);
    });
    return ui.el("fieldset", { class: "gh-field-group" }, [
      ui.el("legend", { class: "gh-field-group__title" }, [ui.icon("layers"), ui.el("span", { text: "Combine Prompts (choose up to " + COMBINE_MAX + ")" })]),
      ui.el("p", { class: "gh-field-group__subtitle", text: count + " of " + COMBINE_MAX + " selected" }),
      list,
    ]);
  }

  function renderCombinedResult(sources) {
    var ui = GraphicsHaus.ui;
    var chosen = sources.filter(function (s) { return !!combineSelected[s.id]; });
    if (!chosen.length) return null;
    var combinedText = chosen.map(function (s) { return s.label + ": " + getFormattedTextForSource(s.id); }).join("\n\n");

    var copyBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--copy", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      ui.copyTextToClipboard(combinedText, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });
    var isFull = GraphicsHaus.favorites.isFull("collection");
    var saveBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--save", text: "Save Combined to Vault" });
    saveBtn.disabled = isFull;
    saveBtn.addEventListener("click", function () {
      var result = GraphicsHaus.favorites.save("collection", { text: combinedText, title: chosen.map(function (s) { return s.label; }).join(" + ") });
      saveFeedback.combined = result.ok ? "Saved!" : result.reason;
      GraphicsHaus.ui.renderApp();
      setTimeout(function () { delete saveFeedback.combined; GraphicsHaus.ui.renderApp(); }, 2500);
    });
    var children = [
      ui.el("h4", { class: "gh-collection__item-title" }, [ui.icon("vault"), ui.el("span", { text: "Combined Result" })]),
      ui.el("p", { class: "gh-generator-variation__text", text: combinedText }),
      ui.el("div", { class: "gh-collection__item-actions" }, [copyBtn, saveBtn]),
    ];
    if (saveFeedback.combined) children.push(ui.el("p", { class: "gh-preview__save-feedback is-success", text: saveFeedback.combined }));
    return ui.el("div", { class: "gh-collection__item gh-collection__item--combined" }, children);
  }

  function renderPanel() {
    var ui = GraphicsHaus.ui;
    var sources = eligibleSources();
    var wrap = ui.el("div", { class: "gh-panel gh-generator-panel" });
    wrap.appendChild(ui.el("h3", { class: "gh-generator-panel__title" }, [ui.icon("document"), ui.el("span", { text: "Collection Builder" })]));
    wrap.appendChild(ui.el("p", { class: "gh-generator-panel__description", text: "See any of your generators' current prompts side by side, or combine up to " + COMBINE_MAX + " of them into one spliced-together prompt." }));

    wrap.appendChild(renderViewChecklist(sources));
    var viewed = sources.filter(function (s) { return !!viewSelected[s.id]; });
    if (viewed.length) {
      var viewedWrap = ui.el("div", { style: "margin-bottom: 20px;" });
      viewed.forEach(function (s) { viewedWrap.appendChild(renderViewedItem(s)); });
      wrap.appendChild(viewedWrap);
    }

    wrap.appendChild(renderCombineChecklist(sources));
    var combinedResult = renderCombinedResult(sources);
    if (combinedResult) wrap.appendChild(combinedResult);

    ui.renderSavedPrompts(wrap, "collection");
    return wrap;
  }

  GraphicsHaus.collection = {
    renderPanel: renderPanel,
  };
})();
