/**
 * The AI Creator's Marketing Haus — Narrow Generator Engine
 * Depends on marketing-haus-util.js and marketing-haus-engine.js (must load
 * first). Ported verbatim from Graphics Haus's own generator engine (the
 * "quick generator" pattern's reference implementation — see that file's
 * own header for the full rationale) rather than shared, per this
 * codebase's established "verbatim port, never shared" convention.
 * Unlike Graphics Haus (generator-grid-first, no broad studios at all),
 * Marketing Haus keeps its existing 6 broad copywriting studios (Mockup,
 * Social Media, Ad Copy, Email, Sales, Testimonial) and adds this engine
 * as a 7th "Quick Generators" tab alongside them — the same dual-nature
 * pattern Project Haus already proved, for a different family of
 * deliverable (image-generation prompts for flyers/infographics/pins/
 * etc., which need a locked template + a handful of aesthetic fields,
 * not the free-flowing copy the 6 existing studios write). Individual
 * generator definitions (e.g. marketing-haus-generators-flyer.js)
 * call registerGenerator() at load time and must load AFTER this file,
 * but before marketing-haus-ui.js's own renderApp() ever runs (deferred
 * script tags all resolve before DOMContentLoaded fires, so normal load
 * order is enough — no explicit ordering beyond "after this file").
 *
 * This file itself only reaches into MarketingHaus.ui lazily, inside
 * functions that don't run until a user actually opens the Quick
 * Generators tab — same deferred-call convention marketing-haus-ui.js's
 * own header comment documents — so it can sit anywhere in the script
 * list relative to marketing-haus-ui.js itself.
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
 * Both extra picks are stored in the generator's own state so they stay
 * stable across re-renders and only change on Randomize/Reset — matching
 * how every other randomized field in this app already behaves, instead
 * of re-rolling on every keystroke.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;
  var createStore = MarketingHaus.util.createStore;
  var updateFieldUtil = MarketingHaus.util.updateField;
  var resolveFieldValue = MarketingHaus.engine.resolveFieldValue;
  var isNoneSelection = MarketingHaus.engine.isNoneSelection;
  var resolveFields = MarketingHaus.engine.resolveFields;

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
  var DEFAULT_FOURTH_POOL = [
    "a fresh, unexpected creative twist",
    "a bolder, more attention-grabbing take",
    "an alternate mood or color emphasis for variety",
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
    state._fourthIndex = randomIndex((def.fourthPool || DEFAULT_FOURTH_POOL).length);
    if (def.sectionGroups) state._sections = [];
    if (def.pageTypes) state._pageTypes = [];
    state._lookLockAppliedThemeId = null;
    return state;
  }

  function flattenSectionOptions(def) {
    var all = [];
    (def.sectionGroups || []).forEach(function (group) { all = all.concat(group.options); });
    return all;
  }

  // A generator definition is a plain data object:
  //   id, label, description, icon, fieldGroupTitle
  //   fields: [{ name, label, options, defaultValue, isFreeText, placeholder,
  //     aesthetic }, 3-6 entries]. `aesthetic` is optional — one of
  //     artStyle/palette/mood/texture/motifs, opts this field into Look
  //     Lock (see the "Look Lock bridge" functions below).
  //   basePromptTemplate: string with {fieldName} tokens — the locked part
  //   charmPromptTemplate / dynamicPromptTemplate: optional alternates,
  //     default to basePromptTemplate if not given
  //   charmPool / dynamicPool: optional string arrays, default to the
  //     generic pools above if not given
  //   sectionGroups/sectionsCap/sectionsLabel/defaultSections: optional —
  //     adds the grouped/capped Sections multi-select (see Planner Pages)
  //   pageTypes/pageTypesCap/pageTypesLabel/defaultPageTypes/
  //     bundleBlockTitle: optional — turns this generator into a Page
  //     Bundle (one prompt per selected page type, sharing one Look,
  //     replacing the 3-variation system rather than combining with it).
  //     pageTypes is [{ id, label, promptTemplate }].
  //   presets/presetsLabel: optional — [{ name, description, apply }],
  //     apply is { fieldName: value }. For generators with several
  //     independent style-ish dropdowns that are hard to picture in
  //     combination (e.g. Design Style + Typography + Text Color Mode),
  //     gives one concrete named starting look instead of guessing
  //     across every axis at once — still fully editable after.
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
  // For generators with several independent style-ish dropdowns (Design
  // Style, Typography, Text Color Mode, ...) that are hard to picture in
  // combination, a preset gives one concrete, named starting look instead
  // of guessing across every axis at once — still fully editable after,
  // same as the broad-mode Starter Presets this reuses the exact card UI
  // from (ui.renderPresetRow).
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
      _fourthIndex: randomIndex((def.fourthPool || DEFAULT_FOURTH_POOL).length),
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

  // ---------------------------------------------------------------------
  // Look Lock bridge — a field opts in via `aesthetic: "<universalKey>"`
  // (artStyle/palette/mood/texture/motifs, see marketing-haus-looklock.js).
  // Everything here is inert if marketing-haus-looklock.js hasn't loaded.
  // ---------------------------------------------------------------------

  function hasAestheticFields(def) {
    return def.fields.some(function (f) { return !!f.aesthetic; });
  }

  // Applies the active Look's values onto this generator's own aesthetic
  // fields — free-text fields just take the value directly; dropdown
  // fields take it as a real selection if it matches one of their own
  // options verbatim, else as a typed customValue override (the meaning
  // still carries even when the wording doesn't match a specific pill).
  function applyActiveLookToGenerator(id, look) {
    var def = getDef(id);
    def.fields.forEach(function (f) {
      if (!f.aesthetic) return;
      var lookField = look.fields[f.aesthetic];
      if (!lookField) return;
      var value = resolveFieldValue(lookField);
      if (!value) return;
      if (f.isFreeText) {
        updateField(id, f.name, { value: value });
      } else if ((f.options || []).indexOf(value) !== -1) {
        updateField(id, f.name, { value: value, customValue: "" });
      } else {
        updateField(id, f.name, { value: "", customValue: value });
      }
    });
  }

  // Inverse — reads this generator's current aesthetic-field values into
  // a plain { universalKey: value } map, skipping anything unresolved.
  // Feeds "Lock This Look."
  function captureLookFromGenerator(id) {
    var def = getDef(id);
    var state = getStore(id).getState();
    var map = {};
    def.fields.forEach(function (f) {
      if (!f.aesthetic) return;
      var value = resolveFieldValue(state[f.name]);
      if (value) map[f.aesthetic] = value;
    });
    return map;
  }

  // Re-syncs at most once per Look change (or per generator open) by
  // comparing a stamped id against the currently active Look — never on
  // every keystroke, so it can't stomp a field someone is mid-edit on.
  function ensureLookLockApplied(id) {
    if (!MarketingHaus.lookLock || !hasAestheticFields(getDef(id))) return;
    var store = getStore(id);
    var state = store.getState();
    var activeLookId = MarketingHaus.lookLock.getActiveLookId();
    if (state._lookLockAppliedThemeId === activeLookId) return;
    if (activeLookId) {
      var look = MarketingHaus.lookLock.getActiveLook();
      if (look) applyActiveLookToGenerator(id, look);
    }
    store.setState({ _lookLockAppliedThemeId: activeLookId });
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

  // Beyond the generator's own fields, every template also gets
  // {holiday}/{holidayClause} for free, pulled from the shared Style DNA
  // bar's Holiday field rather than duplicated per generator — confirmed
  // as a cross-cutting field every narrow generator should have access
  // to. holidayClause is "" when no holiday is set, so a template can
  // drop it straight into a sentence without ever producing an awkward
  // dangling clause. computeExtraTokens is an optional per-generator
  // hook (e.g. joining two fields into one natural clause) for anything
  // beyond simple 1:1 field substitution.
  function getFieldValueMap(def, state) {
    var map = {};
    def.fields.forEach(function (f) {
      var fieldState = state[f.name];
      var resolved = resolveFieldValue(fieldState);
      var excluded = fieldState && fieldState.includeInPrompt === false;
      map[f.name] = resolved || ((excluded || isNoneSelection(fieldState)) ? "" : f.defaultValue) || "";
    });
    var holidayValue = resolveFieldValue(MarketingHaus.styleDNA.getState().holiday);
    map.holiday = holidayValue || "";
    map.holidayClause = holidayValue ? ", with a festive " + holidayValue + " theme" : "";
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

    var fourthPool = def.fourthPool || DEFAULT_FOURTH_POOL;
    var fourthPhrase = fourthPool[state._fourthIndex % fourthPool.length];
    var fourthText = substituteTemplate(def.fourthPromptTemplate || def.basePromptTemplate, valueMap) + " Try " + fourthPhrase + ".";

    return [
      { key: "asSelected", label: "As Selected", text: asSelectedText },
      { key: "extraCharm", label: "+ A Little Extra Charm", text: charmText },
      { key: "moreDynamic", label: "+ More Dynamic", text: dynamicText },
      { key: "somethingDifferent", label: "+ Something Different", text: fourthText },
    ];
  }

  // Page Bundles — opt-in via `def.pageTypes`. One prompt per selected
  // page type (or `def.defaultPageTypes` if none chosen), each with its
  // own full template, all built from the same shared valueMap so Look
  // Lock's aesthetic values (and Holiday/Sections/etc.) flow into every
  // page type uniformly. Replaces the 3-variation system for that
  // generator rather than combining with it — 4 page types × 3 variations
  // would be 12 blocks, a deliberate scope choice, not an oversight.
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
  // in marketing-haus-ui.js works completely unchanged — Variation 1 ("As
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
    var ui = MarketingHaus.ui;
    // `hideFromGrid` — for a generator given its own top-level Studio tab
    // (see MarketingHaus.customerIntel/customerintel.js): it's still
    // registered here so pageTypes/computeExtraTokens/etc. all work, but
    // shouldn't ALSO appear as a duplicate entry point in this grid.
    var cards = registry.filter(function (def) { return !def.hideFromGrid; }).map(function (def) {
      var card = ui.el("button", { type: "button", class: "mh-generator-card" }, [
        ui.icon(def.icon || "sparkle"),
        ui.el("span", { class: "mh-generator-card__name", text: def.label }),
        ui.el("span", { class: "mh-generator-card__description", text: def.description || "" }),
      ]);
      card.addEventListener("click", function () { onSelect(def.id); });
      return card;
    });
    return ui.el("div", { class: "mh-generator-grid" }, cards);
  }

  // Generic "list of labeled prompt blocks, each individually copyable" —
  // shared by the 3-variation system and Page Bundles below.
  function renderLabeledBlocksSection(titleText, blocks) {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-generator-variations" });
    wrap.appendChild(ui.el("h4", { class: "mh-generator-variations__title" }, [ui.icon("layers"), ui.el("span", { text: titleText })]));
    blocks.forEach(function (v) {
      var copyBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small mh-btn--copy", text: "Copy" });
      copyBtn.addEventListener("click", function () {
        ui.copyTextToClipboard(v.text, function (ok) {
          copyBtn.textContent = ok ? "Copied!" : "Copy failed";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
        });
      });
      wrap.appendChild(ui.el("div", { class: "mh-generator-variation" }, [
        ui.el("div", { class: "mh-generator-variation__header" }, [
          ui.el("span", { class: "mh-generator-variation__label", text: v.label }),
          copyBtn,
        ]),
        ui.el("p", { class: "mh-generator-variation__text", text: v.text }),
      ]));
    });
    return wrap;
  }

  // Variations (DNA bar dropdown) caps how many of the 3 always-built
  // blocks actually render — 1 hides "More Ways to Generate This"
  // entirely, 2 shows just "+ A Little Extra Charm", 3+ shows both extras.
  // None of the block TEXT itself ever changes with this value — each
  // block is always phrased as a single standalone image, matching the
  // fix applied everywhere else in this app for the "N variations landing
  // on one image" bug.
  function renderVariationsBlock(id) {
    var cap = parseInt(MarketingHaus.styleDNA.getState().variationCount.value, 10) || 3;
    var extraBlocks = assembleVariations(id).slice(1, Math.max(1, cap));
    if (!extraBlocks.length) return MarketingHaus.ui.el("div", { class: "mh-generator-variations mh-generator-variations--empty" });
    return renderLabeledBlocksSection("More Ways to Generate This", extraBlocks);
  }

  // ChatGPT (unlike Midjourney/Kittl/Leonardo/etc.) is a conversational
  // agent that can call its own image tool multiple times within one
  // reply — so, uniquely for that platform, a single request CAN
  // actually produce several separate images. Every other platform
  // genuinely cannot do this regardless of wording, which is why this is
  // gated to ChatGPT only rather than reintroducing the "Generate N
  // images" instruction everywhere (the exact thing that caused the
  // collage bug this session).
  function buildChatGPTMultiImageText(id) {
    var cap = parseInt(MarketingHaus.styleDNA.getState().variationCount.value, 10) || 1;
    var blocks = assembleVariations(id).slice(0, Math.max(1, cap));
    if (blocks.length <= 1) return blocks.length ? blocks[0].text : "";
    var lines = blocks.map(function (b, i) { return (i + 1) + ") " + b.text; });
    return "Generate the following as " + blocks.length + " separate, individual images in this same reply — call your image generation tool " + blocks.length + " separate times, once per item below, and do not combine them into a single collage, grid, or comparison sheet:\n\n" + lines.join("\n\n");
  }

  function renderChatGPTMultiImageRow(id) {
    var ui = MarketingHaus.ui;
    var platform = MarketingHaus.styleDNA.getState().targetPlatform.value;
    var cap = parseInt(MarketingHaus.styleDNA.getState().variationCount.value, 10) || 1;
    if (platform !== "ChatGPT (GPT Image)" || cap <= 1) {
      return ui.el("div", { class: "mh-generator-chatgpt-multi mh-generator-chatgpt-multi--empty" });
    }
    var text = buildChatGPTMultiImageText(id);
    var wrap = ui.el("div", { class: "mh-generator-chatgpt-multi" });
    wrap.appendChild(ui.el("h4", { class: "mh-generator-chatgpt-multi__title" }, [ui.icon("sparkle"), ui.el("span", { text: "Generate All " + cap + " at Once (ChatGPT Only)" })]));
    wrap.appendChild(ui.el("p", { class: "mh-generator-chatgpt-multi__note", text: "ChatGPT can call its image tool multiple times in one reply, so this one request can produce " + cap + " separate images there. Other platforms can't do this no matter the wording — use the blocks above instead, one at a time." }));
    var copyBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small mh-btn--copy", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      ui.copyTextToClipboard(text, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });
    wrap.appendChild(ui.el("div", { class: "mh-generator-chatgpt-multi__actions" }, [copyBtn]));
    wrap.appendChild(ui.el("p", { class: "mh-generator-chatgpt-multi__text", text: text }));
    return wrap;
  }

  var bundleSaveFeedback = null;

  // One Vault slot for the whole bundle (not one per page) — per-page
  // copying is already covered by each block's own Copy button above.
  function renderBundleBlock(id) {
    var ui = MarketingHaus.ui;
    var def = getDef(id);
    var blocks = assembleBundle(id);
    var wrap = renderLabeledBlocksSection(def.bundleBlockTitle || "Your Page Bundle", blocks);

    var saveBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small mh-btn--save", text: "Save Whole Bundle to Vault" });
    saveBtn.addEventListener("click", function () {
      var vaultKey = "gen:" + id;
      var combined = blocks.map(function (b) { return b.label.toUpperCase() + "\n\n" + b.text; }).join("\n\n" + "—".repeat(24) + "\n\n");
      var title = ui.buildVaultTitle(vaultKey) + " (" + blocks.length + " pages)";
      var result = MarketingHaus.favorites.save(vaultKey, { text: combined, title: title, snapshot: ui.buildVaultSnapshot(vaultKey) });
      bundleSaveFeedback = result.ok ? "Saved!" : result.reason;
      MarketingHaus.ui.renderApp();
      setTimeout(function () { bundleSaveFeedback = null; MarketingHaus.ui.renderApp(); }, 2500);
    });
    var row = ui.el("div", { class: "mh-companion__controls" }, [saveBtn]);
    if (bundleSaveFeedback) row.appendChild(ui.el("span", { style: "color: var(--mh-teal); font-weight: 600; font-size: 13px;", text: bundleSaveFeedback }));
    wrap.appendChild(row);
    return wrap;
  }

  // Same transparent-cap pattern as the Sections picker, over {id,label}
  // page-type objects instead of flat strings.
  function renderPageTypesPicker(id, def, state) {
    var ui = MarketingHaus.ui;
    var chosen = state._pageTypes || [];
    var cap = def.pageTypesCap || 4;
    var wrap = ui.el("fieldset", { class: "mh-field-group" });
    wrap.appendChild(ui.el("legend", { class: "mh-field-group__title" }, [ui.icon("layers"), ui.el("span", { text: def.pageTypesLabel || "Pages" })]));
    var subtitleText = chosen.length + " of " + cap + " selected" + (chosen.length === 0 ? " — leave blank and we'll use a solid default set" : "");
    wrap.appendChild(ui.el("p", { class: "mh-field-group__subtitle", text: subtitleText }));
    var row = ui.el("div", { class: "mh-pill-toggle" });
    def.pageTypes.forEach(function (pt) {
      var isActive = chosen.indexOf(pt.id) !== -1;
      var btn = ui.el("button", { type: "button", class: "mh-pill-toggle__btn" + (isActive ? " is-active" : "") }, [ui.el("span", { text: pt.label })]);
      btn.disabled = !isActive && chosen.length >= cap;
      btn.addEventListener("click", function () {
        var next = chosen.slice();
        var i = next.indexOf(pt.id);
        if (i !== -1) next.splice(i, 1);
        else if (next.length < cap) next.push(pt.id);
        updatePageTypes(id, next);
        MarketingHaus.ui.renderApp();
      });
      row.appendChild(btn);
    });
    wrap.appendChild(row);
    return wrap;
  }

  // Grouped, capped multi-select — e.g. Planner Pages' Sections picker.
  // Capped and enforced right in the UI (checkboxes disable once full)
  // rather than silently truncating a longer selection at prompt-assembly
  // time, so what you pick is exactly what you get.
  function renderSectionsPicker(id, def, state) {
    var ui = MarketingHaus.ui;
    var chosen = state._sections || [];
    var cap = def.sectionsCap || 4;
    var wrap = ui.el("fieldset", { class: "mh-field-group" });
    wrap.appendChild(ui.el("legend", { class: "mh-field-group__title" }, [ui.icon("layers"), ui.el("span", { text: def.sectionsLabel || "Sections" })]));
    var subtitleText = chosen.length + " of " + cap + " selected" + (chosen.length === 0 ? " — leave blank and we'll use a solid default set" : "");
    wrap.appendChild(ui.el("p", { class: "mh-field-group__subtitle", text: subtitleText }));
    (def.sectionGroups || []).forEach(function (group) {
      wrap.appendChild(ui.el("p", { class: "mh-imagery__category-label", text: group.label }));
      var row = ui.el("div", { class: "mh-pill-toggle" });
      group.options.forEach(function (opt) {
        var isActive = chosen.indexOf(opt) !== -1;
        var btn = ui.el("button", { type: "button", class: "mh-pill-toggle__btn" + (isActive ? " is-active" : "") }, [ui.el("span", { text: opt })]);
        btn.disabled = !isActive && chosen.length >= cap;
        btn.addEventListener("click", function () {
          var next = chosen.slice();
          var i = next.indexOf(opt);
          if (i !== -1) next.splice(i, 1);
          else if (next.length < cap) next.push(opt);
          updateSections(id, next);
          MarketingHaus.ui.renderApp();
        });
        row.appendChild(btn);
      });
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderLockThisLookRow(id, def) {
    var ui = MarketingHaus.ui;
    var btn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small mh-btn--add", text: "Lock This Look" });
    btn.title = "Saves this generator's art style, palette, mood, and texture as a reusable Look — every other generator's matching fields will pick it up automatically.";
    btn.addEventListener("click", function () {
      var map = captureLookFromGenerator(id);
      MarketingHaus.lookLock.captureIntoActiveOrNewLook(map, def.label);
      MarketingHaus.ui.renderApp();
    });
    return ui.el("div", { class: "mh-companion__controls" }, [btn]);
  }

  function renderGeneratorPanel(id, opts) {
    ensureLookLockApplied(id);
    var ui = MarketingHaus.ui;
    var def = getDef(id);
    var state = getStore(id).getState();
    var wrap = ui.el("div", { class: "mh-panel mh-generator-panel" });

    // Suppressed for generators given their own top-level Studio tab (see
    // MarketingHaus.customerIntel) — there's no shared grid for "back" to
    // return to, and the grid's own `currentId` is a single module-level
    // variable shared across every generator, so a generator living
    // outside the Quick Generators tab must never touch it.
    if (!opts || !opts.hideBackButton) {
      var backBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small mh-btn--reset mh-generator-panel__back", text: "← All Generators" });
      backBtn.addEventListener("click", function () { currentId = null; MarketingHaus.ui.renderApp(); });
      wrap.appendChild(backBtn);
    }

    wrap.appendChild(ui.el("h3", { class: "mh-generator-panel__title" }, [ui.icon(def.icon || "sparkle"), ui.el("span", { text: def.label })]));
    if (def.description) wrap.appendChild(ui.el("p", { class: "mh-generator-panel__description", text: def.description }));

    if (def.presets && def.presets.length) {
      var presetRow = ui.renderPresetRow(def.presets, function (preset) {
        applyPresetToGenerator(id, preset.apply);
        MarketingHaus.ui.renderApp();
      }, def.presetsLabel || "Starter Looks — click one, then customize");
      if (presetRow) wrap.appendChild(presetRow);
    }

    wrap.appendChild(ui.renderFieldGroup(
      def.fieldGroupTitle || "Customize",
      getFieldEntries(def, state),
      function (entry, changes) {
        updateField(id, entry.name, changes);
        MarketingHaus.ui.renderApp();
      }
    ));

    if (hasAestheticFields(def) && MarketingHaus.lookLock) wrap.appendChild(renderLockThisLookRow(id, def));

    if (def.sectionGroups) wrap.appendChild(renderSectionsPicker(id, def, state));

    if (def.pageTypes) wrap.appendChild(renderPageTypesPicker(id, def, state));

    wrap.appendChild(def.pageTypes ? renderBundleBlock(id) : renderVariationsBlock(id));
    if (!def.pageTypes) wrap.appendChild(renderChatGPTMultiImageRow(id));
    return wrap;
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-panel" });
    if (!currentId) {
      wrap.appendChild(ui.el("p", { class: "mh-generator-grid__intro", text: "Pick a generator below — each one has just a few fields, and works even if you leave everything at its default." }));
      wrap.appendChild(renderGrid(function (id) { currentId = id; MarketingHaus.ui.renderApp(); }));
    } else {
      wrap.appendChild(renderGeneratorPanel(currentId));
    }
    return wrap;
  }

  MarketingHaus.generatorEngine = {
    registerGenerator: registerGenerator,
  };

  MarketingHaus.generators = {
    renderPanel: renderPanel,
    getSelectionsByGroup: function () { return getSelectionsByGroupForId(currentId); },
    assemblePrompt: function () { return assemblePromptForModeApi(currentId); },
    randomize: function () { if (currentId) randomizeGenerator(currentId); },
    reset: function () { if (currentId) resetGenerator(currentId); },
    getActiveGeneratorId: function () { return currentId; },
    setActiveGenerator: function (id) { currentId = id; },
    // The Vault/Recent Log snapshot machinery in marketing-haus-ui.js reads
    // and writes state via `MarketingHaus[mode].getState()/.setState()` —
    // Quick Generators' vault key ("gen:<id>") doesn't map to a top-level
    // MarketingHaus property the way every other mode's does, so it reads
    // the right generator's store through these instead.
    getGeneratorStore: function (id) { return getStore(id); },
    getGeneratorLabel: function (id) { var def = getDef(id); return def ? def.label : id; },
    // By-id variants, bypassing the shared `currentId` entirely — for a
    // generator given its own top-level Studio tab (one generator, no
    // grid) rather than living inside the shared Quick Generators grid.
    // Using the plain (non-"ById") functions above for that would
    // silently hijack whatever generator the Quick Generators tab had
    // open, since `currentId` is one module-level variable shared by
    // both. See MarketingHaus.customerIntel for the adapter that uses these.
    renderGeneratorPanelById: function (id) { return renderGeneratorPanel(id, { hideBackButton: true }); },
    assemblePromptForId: function (id) { return assemblePromptForModeApi(id); },
    getSelectionsByGroupForId: function (id) { return getSelectionsByGroupForId(id); },
    randomizeGeneratorById: function (id) { randomizeGenerator(id); },
    resetGeneratorById: function (id) { resetGenerator(id); },
  };
})();
