/**
 * The AI Creator's Brand Haus — Narrow Generator Engine
 * Depends on brand-haus-util.js and brand-haus-engine.js (must load
 * first). Ported from Product/Graphics/Marketing Haus's own generator
 * engine (the "quick generator" pattern's reference implementation),
 * per this codebase's established "verbatim port, never shared"
 * convention — with one deliberate omission: no Look Lock bridge.
 * Look Lock exists elsewhere to give a generator an aesthetic source
 * of truth when none exists otherwise; Brand Haus's own Brand Kit
 * (brand-haus-brandkit.js) already IS that source of truth here, so
 * every generator built on this engine reads it directly via its own
 * computeExtraTokens instead of an `aesthetic:` field bridge. There is
 * also no {holiday}/{holidayClause} token — that comes from the other
 * three Hauses' shared Style DNA bar, which Brand Haus doesn't have.
 *
 * Individual generator definitions (e.g.
 * brand-haus-generators-businesscardkit.js) call registerGenerator() at
 * load time and must load after this file, but before brand-haus-ui.js's
 * own renderApp() ever runs — normal deferred-script load order already
 * guarantees that.
 *
 * Three prompt variations, same meaning on every generator so the
 * labels stay trustworthy no matter which one you're using:
 *   - As Selected             — exactly what the fields say, nothing
 *     added. This is also the mode's standard "Your Prompt, Built
 *     Live" preview (assemblePrompt() below), so it gets every existing
 *     Copy/Save/Vault/Recent Log feature for free.
 *   - + A Little Extra Charm  — same fields, plus one small decorative
 *     detail pulled from the generator's own charm pool (falls back to
 *     a generic pool if the generator didn't define one).
 *   - + More Dynamic          — same fields, plus one small livelier-
 *     energy phrase pulled from the generator's own dynamic pool (same
 *     fallback behavior).
 * A generator that declares `pageTypes` (both of this Haus's first two
 * generators do) gets a Page Bundle instead — one prompt per selected
 * page type, replacing the 3-variation system for that generator rather
 * than combining with it.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var makeField = BrandHaus.util.makeField;
  var createStore = BrandHaus.util.createStore;
  var updateFieldUtil = BrandHaus.util.updateField;
  var resolveFieldValue = BrandHaus.engine.resolveFieldValue;
  var isNoneSelection = BrandHaus.engine.isNoneSelection;
  var resolveFields = BrandHaus.engine.resolveFields;

  var DEFAULT_CHARM_POOL = [
    "one small extra decorative flourish",
    "a subtle charming little detail",
    "one small whimsical touch for personality",
  ];
  var DEFAULT_DYNAMIC_POOL = [
    "a livelier, more energetic sense of motion",
    "a bit more playful energy in the pose",
    "a more dynamic, animated feel overall",
  ];

  var registry = []; // [definition, ...] in registration order
  var stores = {}; // generatorId -> store
  var currentId = null;

  function randomIndex(len) {
    return Math.floor(Math.random() * len);
  }

  function buildInitialState(def) {
    var state = {};
    def.fields.forEach(function (f) {
      state[f.name] = makeField(f.defaultValue || "", f.options || [], { isFreeText: !!f.isFreeText });
    });
    state._charmIndex = randomIndex((def.charmPool || DEFAULT_CHARM_POOL).length);
    state._dynamicIndex = randomIndex((def.dynamicPool || DEFAULT_DYNAMIC_POOL).length);
    if (def.sectionGroups) state._sections = [];
    if (def.pageTypes) state._pageTypes = [];
    return state;
  }

  function flattenSectionOptions(def) {
    var all = [];
    (def.sectionGroups || []).forEach(function (group) { all = all.concat(group.options); });
    return all;
  }

  // A generator definition is a plain data object:
  //   id, label, description, icon, fieldGroupTitle
  //   fields: [{ name, label, options, defaultValue, isFreeText, placeholder }, 3-6 entries]
  //   basePromptTemplate: string with {fieldName} tokens — the locked part
  //   charmPromptTemplate / dynamicPromptTemplate: optional alternates,
  //     default to basePromptTemplate if not given
  //   charmPool / dynamicPool: optional string arrays, default to the
  //     generic pools above if not given
  //   sectionGroups/sectionsCap/sectionsLabel/defaultSections: optional —
  //     adds the grouped/capped Sections multi-select
  //   pageTypes/pageTypesCap/pageTypesLabel/defaultPageTypes/
  //     bundleBlockTitle: optional — turns this generator into a Page
  //     Bundle (one prompt per selected page type, replacing the
  //     3-variation system rather than combining with it).
  //     pageTypes is [{ id, label, promptTemplate }].
  //   presets/presetsLabel: optional — [{ name, description, apply }],
  //     apply is { fieldName: value }.
  function registerGenerator(def) {
    registry.push(def);
    stores[def.id] = createStore(buildInitialState(def));
  }

  function getDef(id) {
    for (var i = 0; i < registry.length; i++) {
      if (registry[i].id === id) return registry[i];
    }
    return null;
  }

  function getStore(id) {
    return stores[id];
  }

  function updateField(id, fieldName, changes) {
    updateFieldUtil(stores[id], fieldName, changes);
  }

  function updateSections(id, sections) {
    stores[id].setState({ _sections: sections });
  }

  function updatePageTypes(id, pageTypeIds) {
    stores[id].setState({ _pageTypes: pageTypeIds });
  }

  // Optional `def.presets` — [{ name, description, apply: {fieldName: value} }].
  function applyPresetToGenerator(id, applyMap) {
    Object.keys(applyMap).forEach(function (fieldName) {
      updateField(id, fieldName, { value: applyMap[fieldName], customValue: "" });
    });
  }

  function randomizeGenerator(id) {
    var def = getDef(id);
    var store = getStore(id);
    var state = store.getState();
    def.fields.forEach(function (f) {
      var field = state[f.name];
      if (field.includeInPrompt === false) return;
      var options = field.options || [];
      if (!options.length) return;
      updateField(id, f.name, { value: options[randomIndex(options.length)], customValue: "" });
    });
    var patch = {
      _charmIndex: randomIndex((def.charmPool || DEFAULT_CHARM_POOL).length),
      _dynamicIndex: randomIndex((def.dynamicPool || DEFAULT_DYNAMIC_POOL).length),
    };
    if (def.sectionGroups) {
      var cap = def.sectionsCap || 4;
      var shuffled = flattenSectionOptions(def).slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = randomIndex(i + 1);
        var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
      }
      patch._sections = shuffled.slice(0, cap);
    }
    if (def.pageTypes) {
      var ptCap = def.pageTypesCap || 4;
      var shuffledIds = def.pageTypes.map(function (pt) { return pt.id; });
      for (var k = shuffledIds.length - 1; k > 0; k--) {
        var m = randomIndex(k + 1);
        var tmp2 = shuffledIds[k]; shuffledIds[k] = shuffledIds[m]; shuffledIds[m] = tmp2;
      }
      patch._pageTypes = shuffledIds.slice(0, ptCap);
    }
    store.setState(patch);
  }

  function resetGenerator(id) {
    getStore(id).setState(buildInitialState(getDef(id)));
  }

  // { label, field, name, placeholder } — the extra `name`/`placeholder`
  // keys pass through renderFieldGroup/renderPlainFieldRow untouched, so
  // the panel's onChange callback can address the right field by name
  // instead of relying on label-string matching.
  function getFieldEntries(def, state) {
    return def.fields.map(function (f) {
      return { label: f.label, field: state[f.name], name: f.name, placeholder: f.placeholder };
    });
  }

  // computeExtraTokens is an optional per-generator hook (e.g. pulling
  // the active Brand Kit, or joining two fields into one natural clause)
  // for anything beyond simple 1:1 field substitution.
  function getFieldValueMap(def, state) {
    var map = {};
    def.fields.forEach(function (f) {
      var fieldState = state[f.name];
      var resolved = resolveFieldValue(fieldState);
      var excluded = fieldState && fieldState.includeInPrompt === false;
      map[f.name] = resolved || ((excluded || isNoneSelection(fieldState)) ? "" : f.defaultValue) || "";
    });
    if (def.sectionGroups) {
      var chosen = (state._sections && state._sections.length) ? state._sections : (def.defaultSections || []);
      map.sectionsCount = String(chosen.length);
      map.sectionsBlock = chosen.map(function (s, i) { return " " + (i + 1) + ". " + s; }).join("\n");
    }
    if (typeof def.computeExtraTokens === "function") {
      Object.assign(map, def.computeExtraTokens(map));
    }
    return map;
  }

  // Fills {fieldName} tokens; collapses any double-spacing left behind
  // by a field that resolved empty despite having a defaultValue (should
  // be rare — generator authors are expected to give every templated
  // field a real default so the template never visibly breaks).
  function substituteTemplate(template, valueMap) {
    return (template || "")
      .replace(/\{(\w+)\}/g, function (match, key) {
        return valueMap[key] != null ? valueMap[key] : "";
      })
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\s+([,.])/g, "$1")
      .trim();
  }

  function assembleVariations(id) {
    var def = getDef(id);
    var state = getStore(id).getState();
    var valueMap = getFieldValueMap(def, state);

    var asSelectedText = substituteTemplate(def.basePromptTemplate, valueMap);

    var charmPool = def.charmPool || DEFAULT_CHARM_POOL;
    var charmPhrase = charmPool[state._charmIndex % charmPool.length];
    var charmText = substituteTemplate(def.charmPromptTemplate || def.basePromptTemplate, valueMap) + " Include " + charmPhrase + ".";

    var dynamicPool = def.dynamicPool || DEFAULT_DYNAMIC_POOL;
    var dynamicPhrase = dynamicPool[state._dynamicIndex % dynamicPool.length];
    var dynamicText = substituteTemplate(def.dynamicPromptTemplate || def.basePromptTemplate, valueMap) + " Give it " + dynamicPhrase + ".";

    return [
      { key: "asSelected", label: "As Selected", text: asSelectedText },
      { key: "extraCharm", label: "+ A Little Extra Charm", text: charmText },
      { key: "moreDynamic", label: "+ More Dynamic", text: dynamicText },
    ];
  }

  // Page Bundles — opt-in via `def.pageTypes`. One prompt per selected
  // page type (or `def.defaultPageTypes` if none chosen), each with its
  // own full template, all built from the same shared valueMap. Replaces
  // the 3-variation system for that generator rather than combining with
  // it — 4 page types × 3 variations would be 12 blocks, a deliberate
  // scope choice, not an oversight.
  function assembleBundle(id) {
    var def = getDef(id);
    var state = getStore(id).getState();
    var valueMap = getFieldValueMap(def, state);
    var chosenIds = (state._pageTypes && state._pageTypes.length) ? state._pageTypes : (def.defaultPageTypes || []);
    return chosenIds.map(function (ptId) {
      var pt = def.pageTypes.filter(function (p) { return p.id === ptId; })[0];
      if (!pt) return null;
      return { key: pt.id, label: pt.label, text: substituteTemplate(pt.promptTemplate, valueMap) };
    }).filter(Boolean);
  }

  // Matches buildSentence()'s { text, fragments, resolved } shape so the
  // standard renderPreview/formatForPlatform/Vault/Recent Log machinery
  // in brand-haus-ui.js works completely unchanged — Variation 1 ("As
  // Selected"), or a bundle's first page, IS this mode's live "Your
  // Prompt, Built Live" preview.
  function assemblePromptForModeApi(id) {
    if (!id) return { text: "", fragments: [], resolved: [] };
    var def = getDef(id);
    var state = getStore(id).getState();
    var resolved = resolveFields(getFieldEntries(def, state));
    var text;
    if (def.pageTypes) {
      var bundleBlocks = assembleBundle(id);
      text = bundleBlocks.length ? bundleBlocks[0].text : "";
    } else {
      text = assembleVariations(id)[0].text;
    }
    return {
      text: text,
      fragments: resolved.map(function (r) { return r.value; }),
      resolved: resolved,
    };
  }

  function getSelectionsByGroupForId(id) {
    if (!id) return [];
    var def = getDef(id);
    var state = getStore(id).getState();
    var items = resolveFields(getFieldEntries(def, state));
    if (def.sectionGroups && state._sections && state._sections.length) {
      items.push({ label: def.sectionsLabel || "Sections", value: state._sections.join(", ") });
    }
    if (def.pageTypes && state._pageTypes && state._pageTypes.length) {
      var chosenLabels = state._pageTypes.map(function (ptId) {
        var pt = def.pageTypes.filter(function (p) { return p.id === ptId; })[0];
        return pt ? pt.label : ptId;
      });
      items.push({ label: def.pageTypesLabel || "Pages", value: chosenLabels.join(", ") });
    }
    return items.length ? [{ title: def.label, items: items }] : [];
  }

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------

  function renderGrid(onSelect) {
    var ui = BrandHaus.ui;
    var cards = registry.map(function (def) {
      var card = ui.el("button", { type: "button", class: "bh-generator-card" }, [
        ui.icon(def.icon || "sparkle"),
        ui.el("span", { class: "bh-generator-card__name", text: def.label }),
        ui.el("span", { class: "bh-generator-card__description", text: def.description || "" }),
      ]);
      card.addEventListener("click", function () { onSelect(def.id); });
      return card;
    });
    return ui.el("div", { class: "bh-generator-grid" }, cards);
  }

  // Generic "list of labeled prompt blocks, each individually copyable" —
  // shared by the 3-variation system and Page Bundles below.
  function renderLabeledBlocksSection(titleText, blocks) {
    var ui = BrandHaus.ui;
    var wrap = ui.el("div", { class: "bh-generator-variations" });
    wrap.appendChild(ui.el("h4", { class: "bh-generator-variations__title" }, [ui.icon("layers"), ui.el("span", { text: titleText })]));
    blocks.forEach(function (v) {
      var copyBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--copy", text: "Copy" });
      copyBtn.addEventListener("click", function () {
        ui.copyTextToClipboard(v.text, function (ok) {
          copyBtn.textContent = ok ? "Copied!" : "Copy failed";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
        });
      });
      wrap.appendChild(ui.el("div", { class: "bh-generator-variation" }, [
        ui.el("div", { class: "bh-generator-variation__header" }, [
          ui.el("span", { class: "bh-generator-variation__label", text: v.label }),
          copyBtn,
        ]),
        ui.el("p", { class: "bh-generator-variation__text", text: v.text }),
      ]));
    });
    return wrap;
  }

  function renderVariationsBlock(id) {
    return renderLabeledBlocksSection("More Ways to Generate This", assembleVariations(id).slice(1));
  }

  var bundleSaveFeedback = null;

  // One Vault slot for the whole bundle (not one per page) — per-page
  // copying is already covered by each block's own Copy button above.
  function renderBundleBlock(id) {
    var ui = BrandHaus.ui;
    var def = getDef(id);
    var blocks = assembleBundle(id);
    var wrap = renderLabeledBlocksSection(def.bundleBlockTitle || "Your Page Bundle", blocks);

    var saveBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--save", text: "Save Whole Bundle to Vault" });
    saveBtn.addEventListener("click", function () {
      var vaultKey = "gen:" + id;
      var combined = blocks.map(function (b) { return b.label.toUpperCase() + "\n\n" + b.text; }).join("\n\n" + "—".repeat(24) + "\n\n");
      var title = ui.buildVaultTitle(vaultKey) + " (" + blocks.length + " pages)";
      var result = BrandHaus.favorites.save(vaultKey, { text: combined, title: title, snapshot: ui.buildVaultSnapshot(vaultKey) });
      bundleSaveFeedback = result.ok ? "Saved!" : result.reason;
      BrandHaus.ui.renderApp();
      setTimeout(function () { bundleSaveFeedback = null; BrandHaus.ui.renderApp(); }, 2500);
    });
    var row = ui.el("div", { class: "bh-companion__controls" }, [saveBtn]);
    if (bundleSaveFeedback) row.appendChild(ui.el("span", { style: "color: var(--bh-teal); font-weight: 600; font-size: 13px;", text: bundleSaveFeedback }));
    wrap.appendChild(row);
    return wrap;
  }

  // Same transparent-cap pattern as the Sections picker, over {id,label}
  // page-type objects instead of flat strings.
  function renderPageTypesPicker(id, def, state) {
    var ui = BrandHaus.ui;
    var chosen = state._pageTypes || [];
    var cap = def.pageTypesCap || 4;
    var wrap = ui.el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("layers"), ui.el("span", { text: def.pageTypesLabel || "Pages" })]));
    var subtitleText = chosen.length + " of " + cap + " selected" + (chosen.length === 0 ? " — leave blank and we'll use a solid default set" : "");
    wrap.appendChild(ui.el("p", { class: "bh-field-group__subtitle", text: subtitleText }));
    var row = ui.el("div", { class: "bh-pill-toggle" });
    def.pageTypes.forEach(function (pt) {
      var isActive = chosen.indexOf(pt.id) !== -1;
      var btn = ui.el("button", { type: "button", class: "bh-pill-toggle__btn" + (isActive ? " is-active" : "") }, [ui.el("span", { text: pt.label })]);
      btn.disabled = !isActive && chosen.length >= cap;
      btn.addEventListener("click", function () {
        var next = chosen.slice();
        var i = next.indexOf(pt.id);
        if (i !== -1) next.splice(i, 1);
        else if (next.length < cap) next.push(pt.id);
        updatePageTypes(id, next);
        BrandHaus.ui.renderApp();
      });
      row.appendChild(btn);
    });
    wrap.appendChild(row);
    return wrap;
  }

  // Grouped, capped multi-select — reserved for any future generator on
  // this engine that wants it (neither Business Card Kit nor Media Kit
  // uses it yet). Capped and enforced right in the UI (checkboxes
  // disable once full) rather than silently truncating a longer
  // selection at prompt-assembly time.
  function renderSectionsPicker(id, def, state) {
    var ui = BrandHaus.ui;
    var chosen = state._sections || [];
    var cap = def.sectionsCap || 4;
    var wrap = ui.el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("layers"), ui.el("span", { text: def.sectionsLabel || "Sections" })]));
    var subtitleText = chosen.length + " of " + cap + " selected" + (chosen.length === 0 ? " — leave blank and we'll use a solid default set" : "");
    wrap.appendChild(ui.el("p", { class: "bh-field-group__subtitle", text: subtitleText }));
    (def.sectionGroups || []).forEach(function (group) {
      wrap.appendChild(ui.el("p", { class: "bh-imagery__category-label", text: group.label }));
      var row = ui.el("div", { class: "bh-pill-toggle" });
      group.options.forEach(function (opt) {
        var isActive = chosen.indexOf(opt) !== -1;
        var btn = ui.el("button", { type: "button", class: "bh-pill-toggle__btn" + (isActive ? " is-active" : "") }, [ui.el("span", { text: opt })]);
        btn.disabled = !isActive && chosen.length >= cap;
        btn.addEventListener("click", function () {
          var next = chosen.slice();
          var i = next.indexOf(opt);
          if (i !== -1) next.splice(i, 1);
          else if (next.length < cap) next.push(opt);
          updateSections(id, next);
          BrandHaus.ui.renderApp();
        });
        row.appendChild(btn);
      });
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderGeneratorPanel(id) {
    var ui = BrandHaus.ui;
    var def = getDef(id);
    var state = getStore(id).getState();
    var wrap = ui.el("div", { class: "bh-panel bh-generator-panel" });

    var backBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--reset bh-generator-panel__back", text: "← All Generators" });
    backBtn.addEventListener("click", function () { currentId = null; BrandHaus.ui.renderApp(); });
    wrap.appendChild(backBtn);

    wrap.appendChild(ui.el("h3", { class: "bh-generator-panel__title" }, [ui.icon(def.icon || "sparkle"), ui.el("span", { text: def.label })]));
    if (def.description) wrap.appendChild(ui.el("p", { class: "bh-generator-panel__description", text: def.description }));

    if (def.presets && def.presets.length) {
      var presetRow = ui.renderPresetRow(def.presets, function (preset) {
        applyPresetToGenerator(id, preset.apply);
        BrandHaus.ui.renderApp();
      }, def.presetsLabel || "Starter Looks — click one, then customize");
      if (presetRow) wrap.appendChild(presetRow);
    }

    wrap.appendChild(ui.renderFieldGroup(
      def.fieldGroupTitle || "Customize",
      getFieldEntries(def, state),
      function (entry, changes) {
        updateField(id, entry.name, changes);
        BrandHaus.ui.renderApp();
      }
    ));

    if (def.sectionGroups) wrap.appendChild(renderSectionsPicker(id, def, state));

    if (def.pageTypes) wrap.appendChild(renderPageTypesPicker(id, def, state));

    wrap.appendChild(def.pageTypes ? renderBundleBlock(id) : renderVariationsBlock(id));
    return wrap;
  }

  function renderPanel() {
    var ui = BrandHaus.ui;
    var wrap = ui.el("div", { class: "bh-panel" });
    if (!currentId) {
      wrap.appendChild(ui.el("p", { class: "bh-generator-grid__intro", text: "Pick a generator below — each one has just a few fields, and works even if you leave everything at its default." }));
      wrap.appendChild(renderGrid(function (id) { currentId = id; BrandHaus.ui.renderApp(); }));
    } else {
      wrap.appendChild(renderGeneratorPanel(currentId));
    }
    return wrap;
  }

  BrandHaus.generatorEngine = {
    registerGenerator: registerGenerator,
  };

  BrandHaus.generators = {
    renderPanel: renderPanel,
    getSelectionsByGroup: function () { return getSelectionsByGroupForId(currentId); },
    assemblePrompt: function () { return assemblePromptForModeApi(currentId); },
    randomize: function () { if (currentId) randomizeGenerator(currentId); },
    reset: function () { if (currentId) resetGenerator(currentId); },
    getActiveGeneratorId: function () { return currentId; },
    setActiveGenerator: function (id) { currentId = id; },
    // The Vault/Recent Log snapshot machinery in brand-haus-ui.js reads
    // and writes state via `BrandHaus[mode].getState()/.setState()` —
    // Quick Generators' vault key ("gen:<id>") doesn't map to a top-level
    // BrandHaus property the way every other mode's does, so it reads
    // the right generator's store through these instead.
    getGeneratorStore: function (id) { return getStore(id); },
    getGeneratorLabel: function (id) { var def = getDef(id); return def ? def.label : id; },
  };
})();
