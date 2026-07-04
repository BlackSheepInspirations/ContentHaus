/**
 * The AI Creator's Prompt Haus — UI
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js, and the
 * mode modules (character/text/couples). Mode tabs, generic field DOM
 * rendering, live preview panel, randomize/reset/copy.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;

  var MODES = ["character", "text", "couples", "combined"];
  var MODE_LABELS = { character: "Character", text: "Text", couples: "Couples", combined: "Combined" };
  // Flips to true as each mode ships in later build steps.
  var BUILT_MODES = { character: true, text: true, couples: false, combined: false };

  var activeMode = "character";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  // One field row: label, "Include in prompt" checkbox, dropdown, custom
  // value override. Shared by every mode.
  function renderField(entry, onChange) {
    var field = entry.field;

    var select = el("select", { class: "ph-field__select" });
    select.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    (field.options || []).forEach(function (opt) {
      var optionNode = el("option", { value: opt });
      optionNode.textContent = opt;
      if (opt === field.value) optionNode.selected = true;
      select.appendChild(optionNode);
    });
    select.addEventListener("change", function () {
      onChange({ value: select.value });
    });

    var customInput = el("input", {
      type: "text",
      class: "ph-field__custom",
      placeholder: "Or type your own...",
    });
    customInput.value = field.customValue || "";
    customInput.addEventListener("input", function () {
      onChange({ customValue: customInput.value });
    });

    var checkbox = el("input", { type: "checkbox", class: "ph-field__checkbox" });
    checkbox.checked = field.includeInPrompt !== false;
    checkbox.addEventListener("change", function () {
      onChange({ includeInPrompt: checkbox.checked });
    });

    var labelRow = el("div", { class: "ph-field__label-row" }, [
      el("span", { class: "ph-field__label", text: entry.label }),
      el("label", { class: "ph-field__include" }, [checkbox, el("span", { text: "Include in prompt" })]),
    ]);

    return el("div", { class: "ph-field" }, [labelRow, select, customInput]);
  }

  // Plain text input — no dropdown, no custom-value split, no "Include in
  // prompt" checkbox (the whole point of Text Mode is stylizing this exact
  // text, so it's always included when non-empty).
  function renderFreeTextField(entry, onChange) {
    var input = el("textarea", {
      class: "ph-field__custom ph-field__freetext",
      placeholder: 'Type the text you want stylized (e.g. "Blessed & Grateful")',
      rows: "2",
    });
    input.value = entry.field.value || "";
    input.addEventListener("input", function () {
      onChange({ value: input.value });
    });
    return el("div", { class: "ph-field" }, [
      el("div", { class: "ph-field__label-row" }, [el("span", { class: "ph-field__label", text: entry.label })]),
      input,
    ]);
  }

  // Opt-in sub-panel: a checkbox that reveals a field group when checked.
  // Shared shape for Character's Companion and Text's Accent Word/Phrase.
  function renderSubPanel(headerText, isChecked, onToggle, renderContent) {
    var toggle = el("input", { type: "checkbox", class: "ph-subpanel__toggle" });
    toggle.checked = isChecked;
    toggle.addEventListener("change", function () {
      onToggle(toggle.checked);
    });
    var panel = el("div", { class: "ph-subpanel" }, [
      el("label", { class: "ph-subpanel__header" }, [toggle, el("span", { text: headerText })]),
    ]);
    if (isChecked) panel.appendChild(renderContent());
    return panel;
  }

  function renderFieldGroup(title, entries, onChange, subtitle) {
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = entry.field.isFreeText ? renderFreeTextField : renderField;
      fieldsContainer.appendChild(
        renderFn(entry, function (changes) {
          onChange(entry, changes);
        })
      );
    });
    var children = [el("legend", { class: "ph-field-group__title", text: title })];
    if (subtitle) children.push(el("p", { class: "ph-field-group__subtitle", text: subtitle }));
    children.push(fieldsContainer);
    return el("fieldset", { class: "ph-field-group" }, children);
  }

  // ---------------------------------------------------------------------
  // Character Mode panel
  // ---------------------------------------------------------------------
  function renderCharacterPanel() {
    var character = PromptHaus.character;
    var state = character.getState();

    function handleFieldChange(entry, changes) {
      if (entry.groupName === "companion") {
        var companionState = character.getState().companion;
        var patch = {};
        patch[entry.fieldName] = Object.assign({}, companionState[entry.fieldName], changes);
        character.setState({ companion: Object.assign({}, companionState, patch) });
      } else {
        character.updateNestedField(entry.groupName, entry.fieldName, changes);
      }
      renderApp();
    }

    var panel = el("div", { class: "ph-panel ph-panel--character" });

    var humanBtn = el("button", {
      type: "button",
      class: "ph-basetype-toggle__btn" + (state.baseType === "human" ? " is-active" : ""),
      text: "Human",
    });
    var mascotBtn = el("button", {
      type: "button",
      class: "ph-basetype-toggle__btn" + (state.baseType === "animalMascot" ? " is-active" : ""),
      text: "Animal Mascot",
    });
    humanBtn.addEventListener("click", function () {
      character.setBaseType("human");
      renderApp();
    });
    mascotBtn.addEventListener("click", function () {
      character.setBaseType("animalMascot");
      renderApp();
    });
    panel.appendChild(el("div", { class: "ph-basetype-toggle" }, [humanBtn, mascotBtn]));

    var identityGroup = state.baseType === "animalMascot" ? "animalIdentity" : "humanIdentity";
    var identityLabels = character.labels.identity[identityGroup];

    function entriesFor(groupName, labels) {
      var group = state[groupName];
      return Object.keys(labels).map(function (fieldName) {
        return { groupName: groupName, fieldName: fieldName, label: labels[fieldName], field: group[fieldName] };
      });
    }

    panel.appendChild(renderFieldGroup("Style", entriesFor("style", character.labels.style), handleFieldChange));
    panel.appendChild(
      renderFieldGroup(
        state.baseType === "animalMascot" ? "Animal Identity" : "Human Identity",
        entriesFor(identityGroup, identityLabels),
        handleFieldChange
      )
    );
    panel.appendChild(renderFieldGroup("Appearance", entriesFor("appearance", character.labels.appearance), handleFieldChange));
    panel.appendChild(renderFieldGroup("Styling", entriesFor("styling", character.labels.styling), handleFieldChange));
    panel.appendChild(renderFieldGroup("Presentation", entriesFor("presentation", character.labels.presentation), handleFieldChange));
    panel.appendChild(renderFieldGroup("Extras", entriesFor("extras", character.labels.extras), handleFieldChange));

    panel.appendChild(
      renderSubPanel(
        "Add a Companion",
        state.companion.include,
        function (checked) {
          character.toggleCompanionInclude(checked);
          renderApp();
        },
        function () {
          return renderFieldGroup(
            "Companion Details",
            [
              { groupName: "companion", fieldName: "species", label: "Companion Species", field: state.companion.species },
              { groupName: "companion", fieldName: "position", label: "Companion Position", field: state.companion.position },
              { groupName: "companion", fieldName: "accessories", label: "Companion Accessories", field: state.companion.accessories },
            ],
            handleFieldChange
          );
        }
      )
    );

    return panel;
  }

  // ---------------------------------------------------------------------
  // Text Mode panel
  // ---------------------------------------------------------------------
  function renderTextPanel() {
    var text = PromptHaus.text;

    function handleFieldChange(entry, changes) {
      text.updateField(entry.fieldName, changes);
      renderApp();
    }

    var count = PromptHaus.styleDNA.getState().variationCount.value;
    var countLabel = count + (count === "1" ? " variation" : " variations");

    var panel = el("div", { class: "ph-panel ph-panel--text" });
    panel.appendChild(
      renderFieldGroup(
        "Core Style",
        text.getFixedEntries(),
        handleFieldChange,
        "Stays consistent across all " + countLabel + "."
      )
    );

    var state = text.getState();
    panel.appendChild(
      renderSubPanel(
        "Add an Accent Word/Phrase",
        state.accent.include,
        function (checked) {
          text.toggleAccentInclude(checked);
          renderApp();
        },
        function () {
          return renderFieldGroup(
            "Accent Details",
            [
              { fieldName: "phrase", label: "Accent Word/Phrase", field: state.accent.phrase },
              { fieldName: "style", label: "Accent Style", field: state.accent.style },
            ],
            function (entry, changes) {
              text.updateAccentField(entry.fieldName, changes);
              renderApp();
            },
            "Give one word or short phrase its own distinct look — the rest of the text keeps its normal style."
          );
        }
      )
    );

    panel.appendChild(
      renderFieldGroup(
        "Variation Details",
        text.getVariableEntries(),
        handleFieldChange,
        count === "1"
          ? "Only 1 variation selected above, so these just describe the single output."
          : "Free to vary between the " + countLabel + " for different artistic takes."
      )
    );
    return panel;
  }

  // ---------------------------------------------------------------------
  // Shell: tabs, live preview, action buttons
  // ---------------------------------------------------------------------
  function renderTabs(root) {
    var tabs = el("div", { class: "ph-tabs" });
    MODES.forEach(function (mode) {
      var isBuilt = BUILT_MODES[mode];
      var btn = el("button", {
        type: "button",
        class: "ph-tabs__btn" + (mode === activeMode ? " is-active" : "") + (!isBuilt ? " is-disabled" : ""),
        text: MODE_LABELS[mode] + (!isBuilt ? " (coming soon)" : ""),
      });
      if (isBuilt) {
        btn.addEventListener("click", function () {
          activeMode = mode;
          renderApp();
        });
      } else {
        btn.disabled = true;
      }
      tabs.appendChild(btn);
    });
    root.appendChild(tabs);
  }

  // "Your Selections" — a live, scrollable, human-readable recap of every
  // currently-included field with a resolved value, grouped the same way
  // the field panel above it is grouped. Sits above the prompt preview.
  function renderSelectionsPanel(root, groups) {
    var body;
    if (!groups.length) {
      body = el("p", {
        class: "ph-selections__empty",
        text: "Nothing selected yet — choices you make above will appear here.",
      });
    } else {
      body = el("div", { class: "ph-selections__scroll" });
      groups.forEach(function (group, idx) {
        if (idx > 0) body.appendChild(el("hr", { class: "ph-selections__divider" }));
        body.appendChild(el("h4", { class: "ph-selections__group-title", text: group.title }));
        group.items.forEach(function (item) {
          body.appendChild(
            el("div", { class: "ph-selections__item" }, [
              el("span", { class: "ph-selections__item-label", text: item.label + ":" }),
              el("span", { class: "ph-selections__item-value", text: " " + item.value }),
            ])
          );
        });
      });
    }

    root.appendChild(
      el("div", { class: "ph-selections" }, [
        el("h3", { class: "ph-selections__title", text: "Your Selections" }),
        el("p", { class: "ph-selections__subtitle", text: "Live preview of what you've chosen." }),
        body,
      ])
    );
  }

  function renderPreview(root, assembled, modeApi) {
    var styleDNAState = PromptHaus.styleDNA.getState();
    var platform = styleDNAState.targetPlatform.value;
    var formatted = PromptHaus.engine.formatForPlatform(assembled, platform, styleDNAState.aspectRatio.value);

    var textarea = el("textarea", { class: "ph-preview__text", readonly: "readonly" });
    textarea.value = formatted;

    var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy", text: "Copy Prompt" });
    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(formatted);
      } else {
        textarea.select();
        document.execCommand("copy");
      }
      copyBtn.textContent = "Copied!";
      setTimeout(function () {
        copyBtn.textContent = "Copy Prompt";
      }, 1500);
    });

    var randomizeBtn = el("button", { type: "button", class: "ph-btn ph-btn--randomize", text: "Randomize" });
    randomizeBtn.title =
      'Picks a new random value for every field with "Include in prompt" checked, and clears any typed custom value for those fields.';
    randomizeBtn.addEventListener("click", function () {
      modeApi.randomize();
      renderApp();
    });

    var resetBtn = el("button", { type: "button", class: "ph-btn ph-btn--reset", text: "Reset" });
    resetBtn.title = "Clears every field back to Select.../None.";
    resetBtn.addEventListener("click", function () {
      modeApi.reset();
      renderApp();
    });

    root.appendChild(
      el("div", { class: "ph-preview" }, [
        el("h3", { class: "ph-preview__title", text: "Live Prompt Preview" }),
        textarea,
        el("div", { class: "ph-preview__actions" }, [randomizeBtn, resetBtn, copyBtn]),
      ])
    );
  }

  function renderStyleDNA(root) {
    var styleDNAState = PromptHaus.styleDNA.getState();

    var projectSelect = el("select", { class: "ph-field__select" });
    styleDNAState.projectType.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt });
      optionNode.textContent = opt;
      if (opt === styleDNAState.projectType.value) optionNode.selected = true;
      projectSelect.appendChild(optionNode);
    });
    projectSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setProjectType(projectSelect.value);
      renderApp();
    });

    var aspectSelect = el("select", { class: "ph-field__select" });
    styleDNAState.aspectRatio.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt });
      optionNode.textContent = opt;
      if (opt === styleDNAState.aspectRatio.value) optionNode.selected = true;
      aspectSelect.appendChild(optionNode);
    });
    aspectSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setAspectRatioManually(aspectSelect.value);
      renderApp();
    });

    var autoBadge = styleDNAState.aspectRatio.auto
      ? el("span", { class: "ph-styledna__auto-badge", text: "auto" })
      : el("button", { type: "button", class: "ph-styledna__reset-auto", text: "reset to auto" });
    if (!styleDNAState.aspectRatio.auto) {
      autoBadge.addEventListener("click", function () {
        PromptHaus.styleDNA.resetAspectRatioToAuto();
        renderApp();
      });
    }

    var platformSelect = el("select", { class: "ph-field__select" });
    platformSelect.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    styleDNAState.targetPlatform.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt });
      optionNode.textContent = opt;
      if (opt === styleDNAState.targetPlatform.value) optionNode.selected = true;
      platformSelect.appendChild(optionNode);
    });
    platformSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setTargetPlatform(platformSelect.value);
      renderApp();
    });

    var variationSelect = el("select", { class: "ph-field__select" });
    styleDNAState.variationCount.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt });
      optionNode.textContent = opt + (opt === "1" ? " variation" : " variations");
      if (opt === styleDNAState.variationCount.value) optionNode.selected = true;
      variationSelect.appendChild(optionNode);
    });
    variationSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setVariationCount(variationSelect.value);
      renderApp();
    });

    root.appendChild(
      el("div", { class: "ph-styledna" }, [
        el("div", { class: "ph-styledna__field" }, [el("span", { class: "ph-field__label", text: "Project Type" }), projectSelect]),
        el("div", { class: "ph-styledna__field" }, [
          el("span", { class: "ph-field__label", text: "Aspect Ratio" }),
          aspectSelect,
          autoBadge,
        ]),
        el("div", { class: "ph-styledna__field" }, [el("span", { class: "ph-field__label", text: "Target Platform" }), platformSelect]),
        el("div", { class: "ph-styledna__field" }, [el("span", { class: "ph-field__label", text: "Variations" }), variationSelect]),
      ])
    );
  }

  function renderApp() {
    var root = document.getElementById("prompt-haus-app");
    if (!root) return;
    root.innerHTML = "";

    var shell = el("div", { class: "ph-shell" });
    renderTabs(shell);
    renderStyleDNA(shell);

    var body = el("div", { class: "ph-body" });
    var left = el("div", { class: "ph-body__fields" });
    var right = el("div", { class: "ph-body__preview" });

    if (activeMode === "character") {
      left.appendChild(renderCharacterPanel());
      renderSelectionsPanel(right, PromptHaus.character.getSelectionsByGroup());
      renderPreview(right, PromptHaus.character.assemblePrompt(), PromptHaus.character);
    } else if (activeMode === "text") {
      left.appendChild(renderTextPanel());
      renderSelectionsPanel(right, PromptHaus.text.getSelectionsByGroup());
      renderPreview(right, PromptHaus.text.assemblePrompt(), PromptHaus.text);
    } else {
      left.appendChild(el("p", { class: "ph-coming-soon", text: MODE_LABELS[activeMode] + " Mode is coming soon." }));
    }

    body.appendChild(left);
    body.appendChild(right);
    shell.appendChild(body);
    root.appendChild(shell);
  }

  PromptHaus.ui = { renderApp: renderApp };

  document.addEventListener("DOMContentLoaded", function () {
    renderApp();
  });
})();
