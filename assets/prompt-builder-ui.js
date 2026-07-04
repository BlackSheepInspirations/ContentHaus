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

  var MODES = ["character", "couples", "text", "graphics", "combined"];
  var MODE_LABELS = { character: "Character", text: "Text", couples: "Couples", combined: "Combined", graphics: "Graphics" };
  // Flips to true as each mode ships in later build steps.
  var BUILT_MODES = { character: true, text: true, couples: true, combined: true, graphics: true };

  var activeMode = "character";
  // Transient banner shown after a Save Prompt click (success or "limit
  // reached"). Lives at module scope, not on a DOM node, so it survives
  // the full re-render that click triggers; cleared by its own timeout.
  var saveFeedback = null;

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

  // ---------------------------------------------------------------------
  // Icon system — one icon per field CATEGORY (Ethnicity, Gender, Style
  // DNA fields, tabs, etc.), not per individual option value. Per-value
  // icons would mean hand-mapping an icon to every option string across
  // 500+ options app-wide (Character Type alone has 54) — impractical at
  // that granularity. Hand-rolled inline SVG (not emoji, not an icon
  // font) so there's no external dependency and no build step, and every
  // icon renders identically regardless of OS/browser.
  // ---------------------------------------------------------------------
  var ICONS = {
    person: '<circle cx="10" cy="6.5" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>',
    paw: '<circle cx="6" cy="6.5" r="1.5"/><circle cx="10" cy="4.5" r="1.5"/><circle cx="14" cy="6.5" r="1.5"/><ellipse cx="10" cy="12.5" rx="5" ry="4"/>',
    text: '<path d="M4 4h12M10 4v12"/>',
    heart: '<path d="M10 17S3 12.5 3 7.5C3 5 5 3.5 7.2 3.5c1.5 0 2.5.8 2.8 1.8.3-1 1.3-1.8 2.8-1.8C15 3.5 17 5 17 7.5 17 12.5 10 17 10 17Z"/>',
    layers: '<path d="M10 2 18 6l-8 4-8-4Z"/><path d="M2 10l8 4 8-4M2 14l8 4 8-4"/>',
    image: '<rect x="2" y="3" width="16" height="14" rx="1.5"/><circle cx="7" cy="8" r="1.3"/><path d="M2.5 15 7 10.5l4 3.5 3.5-3.5 3 3"/>',
    shirt: '<path d="M7 3 3 6l2 3 2-1.5V17h6V7.5L15 9l2-3-4-3c0 1.4-1.3 2.5-3 2.5S7 4.4 7 3Z"/>',
    crop: '<path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"/>',
    monitor: '<rect x="2" y="4" width="16" height="11" rx="1.2"/><path d="M7 18h6M10 15v3"/>',
    sparkle: '<path d="M10 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>',
    gift: '<rect x="3" y="8" width="14" height="9" rx="1"/><path d="M3 8h14M10 8v9"/><path d="M10 8c0-2-1.5-4.5-3.5-4.5C5 3.5 4.3 5.6 6 6.8 7.3 7.7 8.8 8 10 8Zm0 0c0-2 1.5-4.5 3.5-4.5C15 3.5 15.7 5.6 14 6.8 12.7 7.7 11.2 8 10 8Z"/>',
    bufferBox: '<rect x="3" y="3" width="14" height="14" rx="2" stroke-dasharray="3 2.5"/>',
    document: '<rect x="4" y="2" width="12" height="16" rx="1.2"/><path d="M7 6.5h6M7 9.5h6M7 12.5h3.5"/>',
    lightning: '<path d="M11 2 4 11h5l-1 7 8-9h-5l1-7Z"/>',
    eye: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/>',
    eyeOff: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/><path d="M3 3l14 14"/>',
    copy: '<rect x="6.5" y="6.5" width="10" height="10" rx="1.2"/><path d="M4 12.5V4.8C4 4 4.7 3.3 5.5 3.3H13"/>',
    vault: '<rect x="4" y="9" width="12" height="8" rx="1.2"/><path d="M6 9V6.3C6 3.9 7.8 2 10 2s4 1.9 4 4.3V9"/>',
    shuffle: '<path d="M3 6h4l7 8h3M3 14h4l2.2-2.5"/><path d="M14.5 4 17 6l-2.5 2M14.5 12 17 14l-2.5 2"/>',
    refresh: '<path d="M17 10a7 7 0 0 0-12.8-4M3 10a7 7 0 0 0 12.8 4"/><path d="M3 3v4.5h4.5M17 17v-4.5h-4.5"/>',
    step1: '<circle cx="10" cy="10" r="7.5"/><path d="M8 10l1.5 1.5L13 8"/>',
    step2: '<circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l3 2"/>',
    step3: '<circle cx="10" cy="10" r="7.5"/><path d="M4 10s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4Z"/>',
    step4: '<circle cx="10" cy="10" r="7.5"/><rect x="7.5" y="7" width="6" height="6.5" rx="1"/><path d="M6.5 8.5V5.5A1 1 0 0 1 7.5 4.5h4.3"/>',
  };

  // Field-category -> icon name, used by both the Style DNA bar and each
  // mode's fieldset headers so the same concept always gets the same icon.
  var FIELD_ICONS = {
    projectType: "shirt", aspectRatio: "crop", targetPlatform: "monitor",
    variationCount: "sparkle", holiday: "gift", addBuffer: "bufferBox",
    style: "sparkle", humanIdentity: "person", animalIdentity: "paw",
    appearance: "sparkle", styling: "shirt", presentation: "monitor",
    extras: "sparkle", companion: "paw", coupleDynamic: "heart",
    whatIsIt: "sparkle", frameIt: "crop", hauteDetails: "gift",
  };

  function icon(name, extraClass) {
    var span = el("span", { class: "ph-icon" + (extraClass ? " " + extraClass : "") });
    span.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
    return span;
  }

  // A field/section label with its category icon leading it — used
  // anywhere a plain text label previously stood alone (Style DNA bar,
  // fieldset legends, etc.).
  function labelWithIcon(iconName, text, labelClass) {
    return el("span", { class: (labelClass || "ph-field__label") + " ph-label--icon" }, [icon(iconName), el("span", { text: text })]);
  }

  // Human/Animal-Mascot toggle, shared by Character and Couples Mode —
  // icon + title + one-line subtitle per option, matching the reference
  // mockup's card-style base-type picker.
  // Generic two-option icon+title+subtitle toggle — the base-type picker
  // (Character/Couples) and Graphics Mode's Illustrated/Realistic toggle
  // are the same shape, just different option sets.
  function renderTwoOptionToggle(options) {
    function optionButton(opt) {
      var btn = el("button", { type: "button", class: "ph-basetype-toggle__btn" + (opt.isActive ? " is-active" : "") }, [
        icon(opt.icon, "ph-basetype-toggle__icon"),
        el("span", { class: "ph-basetype-toggle__text" }, [
          el("span", { class: "ph-basetype-toggle__title", text: opt.title }),
          el("span", { class: "ph-basetype-toggle__subtitle", text: opt.subtitle }),
        ]),
      ]);
      btn.addEventListener("click", opt.onClick);
      return btn;
    }
    return el("div", { class: "ph-basetype-toggle" }, options.map(optionButton));
  }

  function renderBaseTypeToggle(currentBaseType, onSetHuman, onSetMascot) {
    return renderTwoOptionToggle([
      { isActive: currentBaseType === "human", icon: "person", title: "Human", subtitle: "People characters", onClick: onSetHuman },
      { isActive: currentBaseType === "animalMascot", icon: "paw", title: "Animal Mascot", subtitle: "Mascots & animals", onClick: onSetMascot },
    ]);
  }

  // Appends a "Select..." placeholder plus every option to a <select>,
  // grouped into <optgroup> sections when the field defines them (long,
  // varied lists like Character Type or Holiday browse better by category
  // than as one flat alphabetized wall). Shared by the per-mode field
  // renderer below and the Style DNA bar's own selects.
  function appendSelectOptions(select, field, currentValue) {
    select.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    if (field.optionGroups) {
      field.optionGroups.forEach(function (group) {
        var optgroup = el("optgroup", { label: group.label });
        group.options.forEach(function (opt) {
          var optionNode = el("option", { value: opt });
          optionNode.textContent = opt;
          if (opt === currentValue) optionNode.selected = true;
          optgroup.appendChild(optionNode);
        });
        select.appendChild(optgroup);
      });
    } else {
      (field.options || []).forEach(function (opt) {
        var optionNode = el("option", { value: opt });
        optionNode.textContent = opt;
        if (opt === currentValue) optionNode.selected = true;
        select.appendChild(optionNode);
      });
    }
  }

  // One field row: label, "Include in prompt" checkbox, dropdown, custom
  // value override. Shared by every mode.
  function renderField(entry, onChange) {
    var field = entry.field;

    var select = el("select", { class: "ph-field__select" });
    appendSelectOptions(select, field, field.value);
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

    panel.appendChild(
      renderBaseTypeToggle(
        state.baseType,
        function () {
          character.setBaseType("human");
          renderApp();
        },
        function () {
          character.setBaseType("animalMascot");
          renderApp();
        }
      )
    );

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
  // Couples Mode panel
  // ---------------------------------------------------------------------
  function renderPersonPanel(person, title) {
    var couples = PromptHaus.couples;
    var state = couples.getState();
    var personState = person === "B" ? state.characterB : state.characterA;
    var identityGroup = state.baseType === "animalMascot" ? "animalIdentity" : "humanIdentity";
    var identityLabels = PromptHaus.character.labels.identity[identityGroup];

    function handleFieldChange(entry, changes) {
      couples.updatePersonField(person, entry.groupName, entry.fieldName, changes);
      renderApp();
    }

    function entriesFor(groupName, labels, group) {
      return Object.keys(labels).map(function (fieldName) {
        return { groupName: groupName, fieldName: fieldName, label: labels[fieldName], field: group[fieldName] };
      });
    }

    var panel = el("div", { class: "ph-panel ph-panel--person" });
    panel.appendChild(el("h4", { class: "ph-person__title", text: title }));
    panel.appendChild(
      renderFieldGroup(
        identityGroup === "animalIdentity" ? "Animal Identity" : "Human Identity",
        entriesFor(identityGroup, identityLabels, personState[identityGroup]),
        handleFieldChange
      )
    );
    panel.appendChild(
      renderFieldGroup("Appearance", entriesFor("appearance", PromptHaus.character.labels.appearance, personState.appearance), handleFieldChange)
    );

    var stylingLabelsMinusOptional = Object.assign({}, PromptHaus.character.labels.styling);
    delete stylingLabelsMinusOptional.makeup;
    delete stylingLabelsMinusOptional.nails;
    panel.appendChild(
      renderFieldGroup("Styling", entriesFor("styling", stylingLabelsMinusOptional, personState.styling), handleFieldChange)
    );

    panel.appendChild(
      renderSubPanel(
        "Show additional details (Makeup, Nails)",
        personState.showOptionalDetails,
        function (checked) {
          couples.toggleOptionalDetails(person, checked);
          renderApp();
        },
        function () {
          return renderFieldGroup(
            "Makeup & Nails",
            [
              { groupName: "styling", fieldName: "makeup", label: "Makeup", field: personState.styling.makeup },
              { groupName: "styling", fieldName: "nails", label: "Nails", field: personState.styling.nails },
            ],
            handleFieldChange
          );
        }
      )
    );

    return panel;
  }

  function renderCouplesPanel() {
    var couples = PromptHaus.couples;
    var state = couples.getState();

    function handleDynamicChange(entry, changes) {
      couples.updateCoupleDynamicField(entry.fieldName, changes);
      renderApp();
    }

    var panel = el("div", { class: "ph-panel ph-panel--couples" });

    panel.appendChild(
      renderBaseTypeToggle(
        state.baseType,
        function () {
          couples.setBaseType("human");
          renderApp();
        },
        function () {
          couples.setBaseType("animalMascot");
          renderApp();
        }
      )
    );

    var swapBtn = el("button", { type: "button", class: "ph-btn ph-btn--swap", text: "Swap Character A ↔ B" });
    swapBtn.title = "Swaps every field between Character A and Character B.";
    swapBtn.addEventListener("click", function () {
      couples.swapCharacters();
      renderApp();
    });
    panel.appendChild(swapBtn);

    var dynamicEntries = couples.getSceneFieldEntries().map(function (e) {
      return { fieldName: e.fieldName, label: e.label, field: e.field };
    });
    panel.appendChild(
      renderFieldGroup(
        "Couple Dynamic",
        dynamicEntries,
        handleDynamicChange,
        "Shared scene/style for both people — kept in one place so they can't contradict each other."
      )
    );

    panel.appendChild(
      el("div", { class: "ph-couples__people" }, [renderPersonPanel("A", "Character A"), renderPersonPanel("B", "Character B")])
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
  // Combined ("Social Post") Mode panel
  // ---------------------------------------------------------------------
  function renderCombinedPanel() {
    var combined = PromptHaus.combined;
    var state = combined.getState();

    var liveLinkToggle = el("input", { type: "checkbox", class: "ph-subpanel__toggle" });
    liveLinkToggle.checked = state.mascotLiveLink;
    liveLinkToggle.addEventListener("change", function () {
      combined.toggleMascotLiveLink(liveLinkToggle.checked);
      renderApp();
    });

    var mascotSection = el("div", { class: "ph-subpanel" }, [
      el("label", { class: "ph-subpanel__header" }, [
        liveLinkToggle,
        el("span", { text: "Live-link mascot from the Character panel below" }),
      ]),
    ]);
    if (state.mascotLiveLink) {
      mascotSection.appendChild(
        renderFieldGroup(
          "Mascot Link",
          [
            { fieldName: "mascotAlignment", label: "Mascot Position", field: state.mascotAlignment },
            { fieldName: "mascotArchetype", label: "Mascot Archetype", field: state.mascotArchetype },
          ],
          function (entry, changes) {
            combined.updateField(entry.fieldName, changes);
            renderApp();
          },
          "Archetype layers on top of the live character (e.g. \"nurse mascot\") rather than replacing it."
        )
      );
    }

    var panel = el("div", { class: "ph-panel ph-panel--combined" });
    panel.appendChild(mascotSection);
    panel.appendChild(el("h4", { class: "ph-person__title", text: "Character" }));
    panel.appendChild(renderCharacterPanel());
    panel.appendChild(el("h4", { class: "ph-person__title", text: "Text" }));
    panel.appendChild(renderTextPanel());
    return panel;
  }

  // Combined Mode doesn't produce one merged prompt — it runs Character's
  // sentence assembler and Text's meta-instruction assembler side by side,
  // each with its own box, sharing one set of Randomize All/Reset
  // All/Save actions since the two are meant to be used together.
  function renderCombinedPreview(root) {
    var combined = PromptHaus.combined;
    var styleDNAState = PromptHaus.styleDNA.getState();
    var platform = styleDNAState.targetPlatform.value;

    var charAssembled = combined.assembleCharacterPrompt();
    var textAssembled = combined.assembleTextPrompt();
    var charFormatted = PromptHaus.engine.formatForPlatform(charAssembled, platform, styleDNAState.aspectRatio.value);
    var textFormatted = PromptHaus.engine.formatForPlatform(textAssembled, platform, styleDNAState.aspectRatio.value);
    var combinedText = "CHARACTER PROMPT:\n" + charFormatted + "\n\nTEXT PROMPT:\n" + textFormatted;

    function makeBox(titleText, formatted) {
      var textarea = el("textarea", { class: "ph-preview__text", readonly: "readonly" });
      textarea.value = formatted;
      var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small" }, [icon("copy"), el("span", { text: "Copy" })]);
      copyBtn.addEventListener("click", function () {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(formatted);
        var label = copyBtn.querySelector("span");
        label.textContent = "Copied!";
        setTimeout(function () {
          label.textContent = "Copy";
        }, 1500);
      });
      return el("div", { class: "ph-preview__subbox" }, [
        el("div", { class: "ph-preview__subbox-header" }, [el("span", { text: titleText }), copyBtn]),
        textarea,
      ]);
    }

    var actions = renderPreviewActions(
      combinedText,
      function () {
        combined.randomize();
        renderApp();
      },
      function () {
        combined.reset();
        renderApp();
      },
      function () {
        var result = PromptHaus.favorites.save("combined", { text: combinedText, platform: platform });
        saveFeedback = result.ok ? { text: "Saved!", isError: false } : { text: result.reason, isError: true };
        renderApp();
        setTimeout(function () {
          saveFeedback = null;
          renderApp();
        }, 2500);
      },
      "combined"
    );

    var previewChildren = [
      el("h3", { class: "ph-preview__title" }, [icon("lightning"), el("span", { text: "Your Prompt, Built Live" })]),
      el("p", { class: "ph-preview__subtitle", text: "Watch your creative direction turn into a ready-to-use AI prompt." }),
      makeBox("Character Prompt", charFormatted),
      makeBox("Text Prompt", textFormatted),
      actions,
    ];
    if (saveFeedback) {
      previewChildren.push(
        el("p", {
          class: "ph-preview__save-feedback" + (saveFeedback.isError ? " is-error" : " is-success"),
          text: saveFeedback.text,
        })
      );
    }

    root.appendChild(el("div", { class: "ph-preview" }, previewChildren));
  }

  // ---------------------------------------------------------------------
  // Graphics Mode panel
  // ---------------------------------------------------------------------
  // Like renderField, but adds a quantity number input ("3x sparkles") —
  // only the 4 What Is It fields need this, so a dedicated renderer is
  // simpler than overloading the generic one for a one-off need.
  function renderWhatIsItField(entry, onChange) {
    var field = entry.field;

    var select = el("select", { class: "ph-field__select" });
    appendSelectOptions(select, field, field.value);
    select.addEventListener("change", function () {
      onChange({ value: select.value });
    });

    var customInput = el("input", { type: "text", class: "ph-field__custom", placeholder: "Or type your own..." });
    customInput.value = field.customValue || "";
    customInput.addEventListener("input", function () {
      onChange({ customValue: customInput.value });
    });

    var quantityInput = el("input", { type: "number", min: "1", class: "ph-field__quantity" });
    quantityInput.value = field.quantity || 1;
    quantityInput.addEventListener("change", function () {
      onChange({ quantity: parseInt(quantityInput.value, 10) || 1 });
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

    return el("div", { class: "ph-field" }, [
      labelRow,
      select,
      customInput,
      el("label", { class: "ph-field__quantity-label" }, [el("span", { text: "Quantity" }), quantityInput]),
    ]);
  }

  function renderGraphicsPanel() {
    var graphics = PromptHaus.graphics;
    var state = graphics.getState();

    var panel = el("div", { class: "ph-panel ph-panel--graphics" });

    // What Is It
    var whatIsItFields = el("div", { class: "ph-field-group__fields" });
    graphics.getWhatIsItEntries().forEach(function (entry) {
      whatIsItFields.appendChild(
        renderWhatIsItField(entry, function (changes) {
          graphics.updateWhatIsItField(entry.fieldName, changes);
          renderApp();
        })
      );
    });
    panel.appendChild(
      el("fieldset", { class: "ph-field-group" }, [
        el("legend", { class: "ph-field-group__title", text: "What Is It" }),
        el("p", { class: "ph-field-group__subtitle", text: 'Pro tip: pick ONE category for best results — mix two only if they genuinely combine (e.g. a fantasy element + animal).' }),
        whatIsItFields,
      ])
    );

    // Style It
    panel.appendChild(el("h4", { class: "ph-person__title", text: "Style It" }));
    panel.appendChild(
      renderTwoOptionToggle([
        {
          isActive: state.styleCategory === "illustrated",
          icon: "sparkle",
          title: "Illustrated",
          subtitle: "Cartoon, chibi & art styles",
          onClick: function () {
            graphics.setStyleCategory("illustrated");
            renderApp();
          },
        },
        {
          isActive: state.styleCategory === "realistic",
          icon: "image",
          title: "Realistic",
          subtitle: "Ads & product photography",
          onClick: function () {
            graphics.setStyleCategory("realistic");
            renderApp();
          },
        },
      ])
    );

    if (state.styleCategory === "realistic") {
      panel.appendChild(
        renderFieldGroup(
          "Realistic Style",
          [{ fieldName: "realisticStyle", label: "Style", field: state.realisticStyle }],
          function (entry, changes) {
            graphics.updateRealisticStyle(changes);
            renderApp();
          }
        )
      );
    } else {
      panel.appendChild(
        renderFieldGroup(
          "Illustrated Style",
          [
            { fieldName: "characterType", label: "Character Type", field: state.illustrated.characterType },
            { fieldName: "artFinish", label: "Art Finish", field: state.illustrated.artFinish },
          ],
          function (entry, changes) {
            graphics.updateIllustratedField(entry.fieldName, changes);
            renderApp();
          }
        )
      );
    }

    // Frame It
    panel.appendChild(
      renderFieldGroup(
        "Frame It",
        graphics.getFrameItEntries(),
        function (entry, changes) {
          graphics.updateFrameItField(entry.fieldName, changes);
          renderApp();
        }
      )
    );

    // Haute Details
    var hauteSection = el("fieldset", { class: "ph-field-group" });
    hauteSection.appendChild(el("legend", { class: "ph-field-group__title", text: "Haute Details" }));
    hauteSection.appendChild(
      el("div", { class: "ph-field-group__fields" }, [
        renderField({ label: "Vanity Plate Type", field: state.haute.vanityPlateType }, function (changes) {
          graphics.updateVanityPlateType(changes);
          renderApp();
        }),
      ])
    );

    var vanityPlateOn = PromptHaus.engine.resolveFieldValue(state.haute.vanityPlateType);
    if (vanityPlateOn) {
      hauteSection.appendChild(
        renderFieldGroup(
          "Vanity Plate Details",
          graphics.getHauteDetailEntries(),
          function (entry, changes) {
            graphics.updateHauteDetailField(entry.fieldName, changes);
            renderApp();
          }
        )
      );
      hauteSection.appendChild(
        renderFieldGroup(
          "Plate Text",
          [
            { fieldName: "plateText", label: "Plate Text", field: state.haute.plateText },
            { fieldName: "plateTextColor", label: "Plate Text Color", field: state.haute.plateTextColor },
          ],
          function (entry, changes) {
            if (entry.fieldName === "plateText") graphics.updatePlateText(changes);
            else graphics.updatePlateTextColor(changes);
            renderApp();
          }
        )
      );
    }
    panel.appendChild(hauteSection);

    // Transportation — same "pick a type, reveal a color detail" shape as
    // Haute Details above.
    var transportSection = el("fieldset", { class: "ph-field-group" });
    transportSection.appendChild(el("legend", { class: "ph-field-group__title", text: "Transportation" }));
    transportSection.appendChild(
      el("div", { class: "ph-field-group__fields" }, [
        renderField({ label: "Transportation Type", field: state.transportation.type }, function (changes) {
          graphics.updateTransportationType(changes);
          renderApp();
        }),
      ])
    );
    var transportationOn = PromptHaus.engine.resolveFieldValue(state.transportation.type);
    if (transportationOn) {
      transportSection.appendChild(
        renderFieldGroup(
          "Transportation Color",
          [{ fieldName: "color", label: "Color", field: state.transportation.color }],
          function (entry, changes) {
            graphics.updateTransportationColor(changes);
            renderApp();
          }
        )
      );
    }
    panel.appendChild(transportSection);

    return panel;
  }

  // ---------------------------------------------------------------------
  // Shell: tabs, live preview, action buttons
  // ---------------------------------------------------------------------
  var MODE_ICONS = { character: "person", text: "text", couples: "heart", combined: "layers", graphics: "image" };

  function renderTabs(root) {
    var tabs = el("div", { class: "ph-tabs" });
    MODES.forEach(function (mode) {
      var isBuilt = BUILT_MODES[mode];
      var btn = el("button", {
        type: "button",
        class: "ph-tabs__btn" + (mode === activeMode ? " is-active" : "") + (!isBuilt ? " is-disabled" : ""),
      }, [
        icon(MODE_ICONS[mode]),
        el("span", { text: MODE_LABELS[mode] + (!isBuilt ? " (coming soon)" : "") }),
      ]);
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
  // Up to 2 mode-specific "headline" facts for the curated Creative Brief
  // — Project/Format/Variations (pure Style DNA) cover the rest and are
  // the same across every mode.
  function getBriefHighlights(mode) {
    var resolve = PromptHaus.engine.resolveFieldValue;
    if (mode === "character") {
      var cs = PromptHaus.character.getState();
      return [
        { icon: cs.baseType === "animalMascot" ? "paw" : "person", label: "Style", value: cs.baseType === "animalMascot" ? "Animal Mascot" : "Human Character" },
        { icon: "crop", label: "Frame", value: resolve(cs.presentation.framing) || "No Frame" },
      ];
    }
    if (mode === "text") {
      var ts = PromptHaus.text.getState();
      return [
        { icon: "text", label: "Letter Style", value: resolve(ts.letterStyle) || "Not set" },
        { icon: "sparkle", label: "Color Scheme", value: resolve(ts.colorScheme) || "Not set" },
      ];
    }
    if (mode === "couples") {
      var cps = PromptHaus.couples.getState();
      return [
        { icon: cps.baseType === "animalMascot" ? "paw" : "person", label: "Style", value: cps.baseType === "animalMascot" ? "Animal Mascots" : "Human Characters" },
        { icon: "heart", label: "Relationship Vibe", value: resolve(cps.coupleDynamic.relationshipVibe) || "Not set" },
      ];
    }
    if (mode === "combined") {
      var comboChar = PromptHaus.character.getState();
      var combo = PromptHaus.combined.getState();
      return [
        { icon: comboChar.baseType === "animalMascot" ? "paw" : "person", label: "Style", value: comboChar.baseType === "animalMascot" ? "Animal Mascot" : "Human Character" },
        { icon: "sparkle", label: "Mascot Archetype", value: resolve(combo.mascotArchetype) || "Not set" },
      ];
    }
    if (mode === "graphics") {
      var gs = PromptHaus.graphics.getState();
      return [
        { icon: "image", label: "Style", value: gs.styleCategory === "realistic" ? "Realistic" : "Illustrated" },
        { icon: "gift", label: "Vanity Plate", value: resolve(gs.haute.vanityPlateType) || "None" },
      ];
    }
    return [];
  }

  // Persists across re-renders (module scope, not component state) so
  // toggling it and clicking a field don't fight each other.
  var briefExpanded = false;

  // "Creative Brief" — a short curated 5-line summary (Project/Format/
  // Variations from shared Style DNA, plus 2 mode-specific highlights) by
  // default, with an eye-icon toggle to expand into the full existing
  // grouped list of every included field. The full list logic is
  // unchanged from the original "Your Selections" — just collapsed by
  // default now.
  function renderSelectionsPanel(root, mode, groups) {
    var styleDNAState = PromptHaus.styleDNA.getState();
    var briefRows = [{ icon: "shirt", label: "Project", value: styleDNAState.projectType.value }, { icon: "crop", label: "Format", value: styleDNAState.aspectRatio.value }]
      .concat(getBriefHighlights(mode))
      .concat([{ icon: "sparkle", label: "Variations", value: styleDNAState.variationCount.value }]);

    var eyeBtn = el("button", { type: "button", class: "ph-selections__eye-btn" }, [icon(briefExpanded ? "eyeOff" : "eye")]);
    eyeBtn.title = briefExpanded ? "Hide the full list" : "See everything you've selected";
    eyeBtn.addEventListener("click", function () {
      briefExpanded = !briefExpanded;
      renderApp();
    });

    var briefList = el("div", { class: "ph-selections__brief" });
    briefRows.forEach(function (row) {
      briefList.appendChild(
        el("div", { class: "ph-selections__brief-row" }, [
          icon(row.icon, "ph-selections__brief-icon"),
          el("span", { class: "ph-selections__brief-label", text: row.label + ":" }),
          el("span", { class: "ph-selections__brief-value", text: row.value }),
        ])
      );
    });

    var children = [
      el("div", { class: "ph-selections__header" }, [
        el("div", {}, [
          el("h3", { class: "ph-selections__title" }, [icon("document"), el("span", { text: "Creative Brief" })]),
          el("p", { class: "ph-selections__subtitle", text: "Live summary of your build." }),
        ]),
        eyeBtn,
      ]),
      briefList,
    ];

    if (briefExpanded) {
      var body;
      if (!groups.length) {
        body = el("p", {
          class: "ph-selections__empty",
          text: "Nothing else selected yet — choices you make above will appear here.",
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
      children.push(el("hr", { class: "ph-selections__divider" }), body);
    }

    root.appendChild(el("div", { class: "ph-selections" }, children));
  }

  // Shared button builder for the 2x2 action grid (Randomize/Copy/Save/
  // Reset) — same 4 actions everywhere, only the callbacks differ per mode.
  function renderPreviewActions(formatted, onRandomize, onReset, onSave, mode) {
    var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy" }, [icon("copy"), el("span", { text: "Copy My Prompt" })]);
    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(formatted);
      }
      var label = copyBtn.querySelector("span");
      label.textContent = "Copied!";
      setTimeout(function () {
        label.textContent = "Copy My Prompt";
      }, 1500);
    });

    var randomizeBtn = el("button", { type: "button", class: "ph-btn ph-btn--randomize" }, [icon("shuffle"), el("span", { text: "Randomize" })]);
    randomizeBtn.title = 'Picks a new random value for every field with "Include in prompt" checked, and clears any typed custom value for those fields.';
    randomizeBtn.addEventListener("click", onRandomize);

    var resetBtn = el("button", { type: "button", class: "ph-btn ph-btn--reset" }, [icon("refresh"), el("span", { text: "Reset" })]);
    resetBtn.title = "Clears every field back to Select.../None.";
    resetBtn.addEventListener("click", onReset);

    var isFull = PromptHaus.favorites.isFull(mode);
    var saveBtn = el("button", { type: "button", class: "ph-btn ph-btn--save" }, [icon("vault"), el("span", { text: "Save to Vault" })]);
    saveBtn.disabled = isFull;
    saveBtn.title = isFull
      ? "You have " + PromptHaus.favorites.MAX_PER_MODE + "/" + PromptHaus.favorites.MAX_PER_MODE + " saved here — delete one below to save another."
      : "Saves this exact prompt text below (up to " + PromptHaus.favorites.MAX_PER_MODE + " per mode).";
    saveBtn.addEventListener("click", onSave);

    return el("div", { class: "ph-preview__actions" }, [randomizeBtn, copyBtn, saveBtn, resetBtn]);
  }

  function renderPreview(root, assembled, modeApi, mode) {
    var styleDNAState = PromptHaus.styleDNA.getState();
    var platform = styleDNAState.targetPlatform.value;
    var formatted = PromptHaus.engine.formatForPlatform(assembled, platform, styleDNAState.aspectRatio.value);

    var textarea = el("textarea", { class: "ph-preview__text", readonly: "readonly" });
    textarea.value = formatted;

    var actions = renderPreviewActions(
      formatted,
      function () {
        modeApi.randomize();
        renderApp();
      },
      function () {
        modeApi.reset();
        renderApp();
      },
      function () {
        var result = PromptHaus.favorites.save(mode, { text: formatted, platform: platform });
        saveFeedback = result.ok ? { text: "Saved!", isError: false } : { text: result.reason, isError: true };
        renderApp();
        setTimeout(function () {
          saveFeedback = null;
          renderApp();
        }, 2500);
      },
      mode
    );

    var previewChildren = [
      el("h3", { class: "ph-preview__title" }, [icon("lightning"), el("span", { text: "Your Prompt, Built Live" })]),
      el("p", { class: "ph-preview__subtitle", text: "Watch your creative direction turn into a ready-to-use AI prompt." }),
      textarea,
      actions,
    ];
    if (saveFeedback) {
      previewChildren.push(
        el("p", {
          class: "ph-preview__save-feedback" + (saveFeedback.isError ? " is-error" : " is-success"),
          text: saveFeedback.text,
        })
      );
    }

    root.appendChild(el("div", { class: "ph-preview" }, previewChildren));
  }

  // "Saved Prompts" — below the Live Prompt Preview, per mode (5 slots
  // each). Each entry keeps its own Copy/Delete so a saved prompt is
  // useful without needing to regenerate the fields that made it.
  function renderSavedPrompts(root, mode) {
    var saved = PromptHaus.favorites.getAll(mode);
    var max = PromptHaus.favorites.MAX_PER_MODE;

    var list = el("div", { class: "ph-saved__list" });
    if (!saved.length) {
      list.appendChild(el("p", { class: "ph-saved__empty", text: "Your vault is empty — use \"Save to Vault\" above." }));
    } else {
      saved.forEach(function (fav) {
        var preview = fav.text.length > 160 ? fav.text.slice(0, 160) + "…" : fav.text;

        var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small", text: "Copy" });
        copyBtn.addEventListener("click", function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fav.text);
          }
          copyBtn.textContent = "Copied!";
          setTimeout(function () {
            copyBtn.textContent = "Copy";
          }, 1500);
        });

        var deleteBtn = el("button", { type: "button", class: "ph-btn ph-btn--delete ph-btn--small", text: "Delete" });
        deleteBtn.addEventListener("click", function () {
          PromptHaus.favorites.remove(mode, fav.id);
          renderApp();
        });

        var metaParts = [];
        if (fav.platform) metaParts.push(fav.platform);
        metaParts.push(new Date(fav.createdAt).toLocaleDateString());

        list.appendChild(
          el("div", { class: "ph-saved__item" }, [
            el("p", { class: "ph-saved__item-text", text: preview }),
            el("div", { class: "ph-saved__item-meta" }, [
              el("span", { class: "ph-saved__item-tag", text: metaParts.join(" · ") }),
              el("div", { class: "ph-saved__item-actions" }, [copyBtn, deleteBtn]),
            ]),
          ])
        );
      });
    }

    root.appendChild(
      el("div", { class: "ph-saved" }, [
        el("h3", { class: "ph-saved__title" }, [icon("vault"), el("span", { text: "Your Vault (" + saved.length + "/" + max + ")" })]),
        list,
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
    appendSelectOptions(platformSelect, styleDNAState.targetPlatform, styleDNAState.targetPlatform.value);
    platformSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setTargetPlatform(platformSelect.value);
      renderApp();
    });

    var holidaySelect = el("select", { class: "ph-field__select" });
    appendSelectOptions(holidaySelect, styleDNAState.holiday, styleDNAState.holiday.value);
    holidaySelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setHoliday(holidaySelect.value);
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

    var bufferCheckbox = el("input", { type: "checkbox", class: "ph-styledna__checkbox" });
    bufferCheckbox.checked = styleDNAState.addBuffer;
    bufferCheckbox.addEventListener("change", function () {
      PromptHaus.styleDNA.setAddBuffer(bufferCheckbox.checked);
      renderApp();
    });
    var bufferField = el("div", { class: "ph-styledna__field" }, [
      el("label", { class: "ph-styledna__checkbox-label" }, [
        bufferCheckbox,
        icon("bufferBox"),
        el("span", { text: "Add a buffer/padding around the image" }),
      ]),
    ]);
    bufferField.title = "Asks the AI to leave empty space around the edges so nothing gets cropped at the borders.";

    root.appendChild(
      el("div", { class: "ph-styledna" }, [
        el("div", { class: "ph-styledna__field" }, [labelWithIcon("shirt", "Project Type"), projectSelect]),
        el("div", { class: "ph-styledna__field" }, [labelWithIcon("crop", "Aspect Ratio"), aspectSelect, autoBadge]),
        el("div", { class: "ph-styledna__field" }, [labelWithIcon("monitor", "Target Platform"), platformSelect]),
        el("div", { class: "ph-styledna__field" }, [labelWithIcon("sparkle", "Variations"), variationSelect]),
        el("div", { class: "ph-styledna__field" }, [labelWithIcon("gift", "Holiday Theme"), holidaySelect]),
        bufferField,
      ])
    );
  }

  // Decorative-only progress narration — doesn't gate anything, every
  // field stays visible/editable at once same as always. Purely a visual
  // anchor for the "build a prompt in 4 moves" story.
  var STEPS = [
    { icon: "step1", title: "Choose", subtitle: "Set the foundation" },
    { icon: "step2", title: "Customize", subtitle: "Dial in the details" },
    { icon: "step3", title: "Preview", subtitle: "See it come to life" },
    { icon: "step4", title: "Copy", subtitle: "Save and use anywhere" },
  ];

  // All 4 steps render identically (uniform teal) — this is purely a
  // "here's the process you'll walk through" narration, not a progress
  // tracker, so no single step should read as more/less complete than
  // another.
  function renderStepper(root) {
    var row = el("div", { class: "ph-stepper" });
    STEPS.forEach(function (step, index) {
      row.appendChild(
        el("div", { class: "ph-stepper__step" }, [
          icon(step.icon, "ph-stepper__icon"),
          el("div", { class: "ph-stepper__text" }, [
            el("span", { class: "ph-stepper__title", text: (index + 1) + " " + step.title }),
            el("span", { class: "ph-stepper__subtitle", text: step.subtitle }),
          ]),
        ])
      );
      if (index < STEPS.length - 1) row.appendChild(el("div", { class: "ph-stepper__connector" }));
    });
    root.appendChild(row);
  }

  function renderApp() {
    var root = document.getElementById("prompt-haus-app");
    if (!root) return;
    root.innerHTML = "";

    var shell = el("div", { class: "ph-shell" });
    renderTabs(shell);
    renderStepper(shell);
    renderStyleDNA(shell);

    var body = el("div", { class: "ph-body" });
    var left = el("div", { class: "ph-body__fields" });
    var right = el("div", { class: "ph-body__preview" });

    if (activeMode === "character") {
      left.appendChild(renderCharacterPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.character.getSelectionsByGroup());
      renderPreview(right, PromptHaus.character.assemblePrompt(), PromptHaus.character, activeMode);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "text") {
      left.appendChild(renderTextPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.text.getSelectionsByGroup());
      renderPreview(right, PromptHaus.text.assemblePrompt(), PromptHaus.text, activeMode);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "couples") {
      left.appendChild(renderCouplesPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.couples.getSelectionsByGroup());
      renderPreview(right, PromptHaus.couples.assemblePrompt(), PromptHaus.couples, activeMode);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "combined") {
      left.appendChild(renderCombinedPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.combined.getSelectionsByGroup());
      renderCombinedPreview(right);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "graphics") {
      left.appendChild(renderGraphicsPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.graphics.getSelectionsByGroup());
      renderPreview(right, PromptHaus.graphics.assemblePrompt(), PromptHaus.graphics, activeMode);
      renderSavedPrompts(right, activeMode);
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
