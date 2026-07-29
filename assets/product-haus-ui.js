/**
 * The AI Creator's Project Haus — UI
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-favorites.js, product-haus-styledna.js. Loads BEFORE
 * the mode modules in the section/dev-harness script order, but its own
 * generic render helpers (exposed on ProductHaus.ui) are only ever
 * CALLED from inside each mode's own renderPanel function — which
 * doesn't run until a user actually visits that tab, long after every
 * script has finished loading — so the load-order works fine even
 * though the mode files come before this one.
 *
 * Architecture note vs. Prompt Haus's own prompt-builder-ui.js: that
 * file owns every mode's renderXPanel function directly. Here, each
 * mode file owns its own renderPanel (as ProductHaus.<mode>.renderPanel)
 * and this file only holds the generic shell + reusable field/section
 * helpers — keeps each Studio self-contained in its own file instead of
 * one file needing to know every mode's internal field structure.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var pdhKeyCounter = 0;
  var FOCUSABLE_TAGS = { input: true, select: true, textarea: true };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (FOCUSABLE_TAGS[tag]) {
      node.setAttribute("data-pdh-key", String(pdhKeyCounter++));
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function copyTextToClipboard(text, onDone) {
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(textarea);
      onDone(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { onDone(true); },
        function () { fallbackCopy(); }
      );
    } else {
      fallbackCopy();
    }
  }

  function downloadTextAsFile(text, filename) {
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printPromptText(text) {
    var win = window.open("", "_blank", "width=650,height=800");
    if (!win) return;
    var escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    win.document.write(
      "<html><head><title>Your Marketing Prompt — The AI Creator's Project Haus</title><style>" +
        "body{font-family:Georgia,serif;padding:48px;color:#1A1815;line-height:1.6;max-width:600px;margin:0 auto;}" +
        "h1{font-size:16px;letter-spacing:0.05em;text-transform:uppercase;color:#B5502B;margin-bottom:28px;}" +
        "p{font-size:15px;white-space:pre-wrap;}" +
        "</style></head><body>" +
        "<h1>Black Sheep Creations &amp; Inspirations — The AI Creator's Project Haus</h1>" +
        "<p>" + escaped + "</p>" +
        "</body></html>"
    );
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 250);
  }

  function buildShareUrl(text) {
    var encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(text))));
    var base = window.location.origin + window.location.pathname;
    return base + "?pdh_shared_prompt=" + encoded;
  }

  // ---------------------------------------------------------------------
  // Vault snapshot save/restore — same crash-safety pattern as Prompt
  // Haus (deep-merge onto current defaults, never wholesale-replace).
  // ---------------------------------------------------------------------

  // Every ordinary mode's state store lives at ProductHaus[mode] directly.
  // Quick Generators is one mode holding many small generators, so its
  // vault key is "gen:<generatorId>" instead — this resolves either shape
  // to the right store so Vault save/load doesn't need to special-case it
  // at every call site.
  function getModeStore(mode) {
    if (mode.indexOf("gen:") === 0) return ProductHaus.generators.getGeneratorStore(mode.slice(4));
    return ProductHaus[mode];
  }

  function buildVaultSnapshot(mode) {
    var snapshot = { styleDNA: JSON.parse(JSON.stringify(ProductHaus.styleDNA.getState())) };
    snapshot[mode] = JSON.parse(JSON.stringify(getModeStore(mode).getState()));
    return snapshot;
  }

  function isFieldShape(obj) {
    return !!obj && typeof obj === "object" && !Array.isArray(obj) &&
      Object.prototype.hasOwnProperty.call(obj, "value") &&
      Object.prototype.hasOwnProperty.call(obj, "options");
  }

  function deepMergeSnapshot(current, saved) {
    if (Array.isArray(saved)) {
      var currentArr = Array.isArray(current) ? current : [];
      return saved.map(function (item, i) { return deepMergeSnapshot(currentArr[i], item); });
    }
    if (!saved || typeof saved !== "object") return saved === undefined ? current : saved;
    if (!current || typeof current !== "object") return saved;
    if (isFieldShape(saved) && isFieldShape(current)) {
      return Object.assign({}, current, {
        value: saved.value,
        customValue: saved.customValue,
        includeInPrompt: saved.includeInPrompt,
      });
    }
    var result = Object.assign({}, current);
    Object.keys(saved).forEach(function (key) {
      // Leading-underscore keys (_sections, _pageTypes, _checklistOverrides,
      // etc.) are generator-internal generated/transient state, not
      // user-authored field data — arrays among them already replace
      // wholesale via the array branch above, but a PLAIN OBJECT one
      // (_checklistOverrides) would otherwise fall through to the
      // generic union-merge below, letting a stale override key from a
      // different eventType's section ids survive a Vault/Recent Log
      // Load. Replace those wholesale too, same as the array case.
      if (key.charAt(0) === "_" && saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key])) {
        result[key] = saved[key];
        return;
      }
      result[key] = deepMergeSnapshot(current[key], saved[key]);
    });
    return result;
  }

  function loadVaultSnapshot(mode, snapshot) {
    if (!snapshot) return;
    if (snapshot.styleDNA) ProductHaus.styleDNA.setState(deepMergeSnapshot(ProductHaus.styleDNA.getState(), snapshot.styleDNA));
    var store = getModeStore(mode);
    if (snapshot[mode] && store) store.setState(deepMergeSnapshot(store.getState(), snapshot[mode]));
  }

  function modeLabel(mode) {
    if (mode.indexOf("gen:") === 0) return ProductHaus.generators.getGeneratorLabel(mode.slice(4));
    return BROAD_MODE_LABELS[mode] || mode;
  }

  function buildVaultTitle(mode) {
    var styleDNA = ProductHaus.styleDNA.getState();
    var context =
      ProductHaus.engine.resolveFieldValue(styleDNA.niche) ||
      ProductHaus.engine.resolveFieldValue(styleDNA.theme) ||
      ProductHaus.engine.resolveFieldValue(styleDNA.holiday) ||
      ProductHaus.engine.resolveFieldValue(styleDNA.businessName);
    return context ? modeLabel(mode) + " — " + context : modeLabel(mode);
  }

  function buildFullVaultText() {
    var byMode = {};
    ProductHaus.favorites.getAllFlat().forEach(function (fav) {
      byMode[fav.mode] = byMode[fav.mode] || [];
      byMode[fav.mode].push(fav);
    });
    var sections = [];
    Object.keys(byMode).forEach(function (mode) {
      var label = modeLabel(mode).toUpperCase();
      var lines = byMode[mode].map(function (fav, index) {
        return (fav.title || "Untitled " + (index + 1)) + "\n" + fav.text;
      });
      sections.push(label + "\n\n" + lines.join("\n\n"));
    });
    return sections.join("\n\n" + "—".repeat(24) + "\n\n");
  }

  // ---------------------------------------------------------------------
  // Icon system — same hand-rolled inline SVG approach as Prompt Haus,
  // no external dependency.
  // ---------------------------------------------------------------------
  var ICONS = {
    bufferBox: '<rect x="3" y="3" width="14" height="14" rx="2" stroke-dasharray="3 2.5"/>',
    person: '<circle cx="10" cy="6.5" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>',
    people: '<circle cx="6.5" cy="6" r="2.2"/><path d="M2.5 17c0-2.7 1.8-4.8 4-4.8s4 2.1 4 4.8"/><circle cx="14" cy="7.3" r="1.8"/><path d="M10.7 17c.3-2.2 1.8-3.9 3.3-3.9s3 1.7 3.3 3.9"/>',
    text: '<path d="M4 4h12M10 4v12"/>',
    heart: '<path d="M10 17S3 12.5 3 7.5C3 5 5 3.5 7.2 3.5c1.5 0 2.5.8 2.8 1.8.3-1 1.3-1.8 2.8-1.8C15 3.5 17 5 17 7.5 17 12.5 10 17 10 17Z"/>',
    layers: '<path d="M10 2 18 6l-8 4-8-4Z"/><path d="M2 10l8 4 8-4M2 14l8 4 8-4"/>',
    image: '<rect x="2" y="3" width="16" height="14" rx="1.5"/><circle cx="7" cy="8" r="1.3"/><path d="M2.5 15 7 10.5l4 3.5 3.5-3.5 3 3"/>',
    shirt: '<path d="M7 3 3 6l2 3 2-1.5V17h6V7.5L15 9l2-3-4-3c0 1.4-1.3 2.5-3 2.5S7 4.4 7 3Z"/>',
    crop: '<path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"/>',
    monitor: '<rect x="2" y="4" width="16" height="11" rx="1.2"/><path d="M7 18h6M10 15v3"/>',
    sparkle: '<path d="M10 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>',
    gift: '<rect x="3" y="8" width="14" height="9" rx="1"/><path d="M3 8h14M10 8v9"/><path d="M10 8c0-2-1.5-4.5-3.5-4.5C5 3.5 4.3 5.6 6 6.8 7.3 7.7 8.8 8 10 8Zm0 0c0-2 1.5-4.5 3.5-4.5C15 3.5 15.7 5.6 14 6.8 12.7 7.7 11.2 8 10 8Z"/>',
    upload: '<path d="M10 13V3M6 7l4-4 4 4"/><path d="M3 13v2.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V13"/>',
    download: '<path d="M10 3v10M6 9l4 4 4-4"/><path d="M3 13v2.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V13"/>',
    share: '<circle cx="15" cy="4.5" r="2"/><circle cx="5" cy="10" r="2"/><circle cx="15" cy="15.5" r="2"/><path d="M6.7 9 13.3 5.5M6.7 11 13.3 14.5"/>',
    print: '<rect x="5" y="2.5" width="10" height="6" rx="1"/><rect x="3" y="8" width="14" height="7" rx="1.2"/><rect x="6" y="12" width="8" height="5"/>',
    document: '<rect x="4" y="2" width="12" height="16" rx="1.2"/><path d="M7 6.5h6M7 9.5h6M7 12.5h3.5"/>',
    lightning: '<path d="M11 2 4 11h5l-1 7 8-9h-5l1-7Z"/>',
    eye: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/>',
    eyeOff: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/><path d="M3 3l14 14"/>',
    copy: '<rect x="6.5" y="6.5" width="10" height="10" rx="1.2"/><path d="M4 12.5V4.8C4 4 4.7 3.3 5.5 3.3H13"/>',
    vault: '<rect x="4" y="9" width="12" height="8" rx="1.2"/><path d="M6 9V6.3C6 3.9 7.8 2 10 2s4 1.9 4 4.3V9"/>',
    edit: '<path d="M13.5 2.5 17 6l-9.5 9.5-4 1 1-4Z"/>',
    logoMark: '<circle cx="10" cy="10" r="7.5"/><path d="M7 10.5 9 12.5 13.5 8"/>',
    shuffle: '<path d="M3 6h4l7 8h3M3 14h4l2.2-2.5"/><path d="M14.5 4 17 6l-2.5 2M14.5 12 17 14l-2.5 2"/>',
    refresh: '<path d="M17 10a7 7 0 0 0-12.8-4M3 10a7 7 0 0 0 12.8 4"/><path d="M3 3v4.5h4.5M17 17v-4.5h-4.5"/>',
    shield: '<path d="M10 2 16 4.5V10c0 4-3 6.5-6 8-3-1.5-6-4-6-8V4.5Z"/><path d="M7 9l3 2 3-2"/>',
    warning: '<path d="M10 2.5 18 17H2Z"/><path d="M10 8v3.5"/><circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none"/>',
    palette: '<circle cx="10" cy="10" r="7.5"/><circle cx="7" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="1" fill="currentColor" stroke="none"/><path d="M10 17.5c-4.1 0-7.5-3.4-7.5-7.5 0-1 3-1 3-2.5 0-1 4.5-1 4.5 1 0 1.5 3 1 3 2.5 0 3.7-1.5 6.5-3 6.5Z"/>',
    type: '<path d="M4 5h12M10 5v11M7 16h6"/>',
    hanger: '<path d="M10 3a1.5 1.5 0 1 1 1.5 1.5H10"/><path d="M10 4.5 3 10.5c-.5.4-.2 1.2.4 1.2H16.6c.6 0 .9-.8.4-1.2L10 4.5Z"/><path d="M4 15.5h12"/>',
    droplet: '<path d="M10 2.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10Z"/>',
    car: '<path d="M4 13 5.5 8h9L16 13"/><rect x="3" y="13" width="14" height="3" rx="1"/><circle cx="6.5" cy="16.5" r="1.3"/><circle cx="13.5" cy="16.5" r="1.3"/>',
    bulb: '<path d="M7 15h6M8 17.5h4"/><path d="M10 2.5c-3 0-5 2.2-5 5 0 2 1.1 3.3 2 4.2.5.5.8 1 .9 1.8h4.2c.1-.8.4-1.3.9-1.8.9-.9 2-2.2 2-4.2 0-2.8-2-5-5-5Z"/>',
    mail: '<rect x="2.5" y="4.5" width="15" height="11" rx="1.3"/><path d="M3 5.5 10 11l7-5.5"/>',
  };

  var TITLE_ICONS = {
    "Style": "sparkle", "Extras": "sparkle", "Filter It": "image",
    "Hero Product": "shirt", "Presentation Style": "person", "Surrounding Props": "hanger",
    "Setting": "image", "Foundation": "logoMark", "Color & Format": "palette",
    "Typography Direction": "type", "Composition & Lockup": "crop", "Brand Story": "heart",
    "Negative Constraints": "shield", "Pro Mode": "sparkle", "Colors": "palette",
    "Typography": "type", "Core Values": "heart", "Brand Voice": "sparkle",
  };

  function icon(name, extraClass) {
    var span = el("span", { class: "pdh-icon" + (extraClass ? " " + extraClass : ""), "aria-hidden": "true" });
    span.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
    return span;
  }

  function infoIcon(text) {
    return el("details", { class: "pdh-info" }, [
      el("summary", { class: "pdh-info__icon", "aria-label": "More info" }, [el("span", { text: "i" })]),
      el("p", { class: "pdh-info__body", text: text }),
    ]);
  }

  function labelWithIcon(iconName, text, forId, labelClass, helpText) {
    var attrs = { class: (labelClass || "pdh-field__label") + " pdh-label--icon" };
    if (forId) attrs.for = forId;
    var children = [icon(iconName), el("span", { text: text })];
    if (helpText) children.push(infoIcon(helpText));
    return el(forId ? "label" : "span", attrs, children);
  }

  function renderPillToggle(options) {
    function pillButton(opt) {
      var btn = el("button", { type: "button", class: "pdh-pill-toggle__btn" + (opt.isActive ? " is-active" : "") }, [
        icon(opt.icon, "pdh-pill-toggle__icon"),
        el("span", { class: "pdh-pill-toggle__label", text: opt.title }),
      ]);
      btn.addEventListener("click", opt.onClick);
      return btn;
    }
    return el("div", { class: "pdh-pill-toggle" }, options.map(pillButton));
  }

  // Shared Yes/No pill toggle — used by Image Buffer/Padding (Style DNA
  // bar), matching Content Haus's own yesNoButton exactly.
  function yesNoButton(label, isActive, onClick) {
    var btn = el("button", {
      type: "button",
      class: "pdh-styledna__yesno-btn" + (isActive ? " is-active" : ""),
      "aria-pressed": isActive ? "true" : "false",
      text: label,
    });
    btn.addEventListener("click", onClick);
    return btn;
  }

  function renderPresetRow(presets, onApply, labelText) {
    if (!presets || !presets.length) return null;
    var cards = presets.map(function (preset) {
      var card = el("button", { type: "button", class: "pdh-preset-card" }, [
        el("span", { class: "pdh-preset-card__name", text: preset.name }),
        el("span", { class: "pdh-preset-card__description", text: preset.description }),
      ]);
      card.addEventListener("click", function () { onApply(preset); });
      return card;
    });
    return el("div", { class: "pdh-preset-row" }, [
      el("p", { class: "pdh-preset-row__label" }, [icon("sparkle"), el("span", { text: labelText || "Starter Presets — click one, then customize" })]),
      el("div", { class: "pdh-preset-row__cards" }, cards),
    ]);
  }

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

  function fieldHasValue(field) {
    var custom = (field.customValue || "").trim();
    if (custom) return true;
    var value = (field.value || "").trim();
    return value !== "" && value.toLowerCase() !== "none";
  }

  function renderField(entry, onChange) {
    var field = entry.field;
    var select = el("select", { class: "pdh-field__select" });
    appendSelectOptions(select, field, field.value);
    select.addEventListener("change", function () { onChange({ value: select.value, customValue: "" }); });
    var selectId = "pdh-field-" + select.getAttribute("data-pdh-key");
    select.id = selectId;

    var customInput = el("input", { type: "text", class: "pdh-field__custom", placeholder: "Or type your own..." });
    customInput.value = field.customValue || "";
    customInput.addEventListener("input", function () { onChange({ customValue: customInput.value }); });

    var checkbox = el("input", { type: "checkbox", class: "pdh-field__checkbox" });
    checkbox.checked = field.includeInPrompt !== false && fieldHasValue(field);
    checkbox.addEventListener("change", function () { onChange({ includeInPrompt: checkbox.checked }); });

    var labelRow = el("div", { class: "pdh-field__label-row" }, [
      el("label", { class: "pdh-field__label", for: selectId, text: entry.label }),
      el("label", { class: "pdh-field__include" }, [checkbox, el("span", { text: "Include in prompt" })]),
    ]);
    return el("div", { class: "pdh-field" }, [labelRow, select, customInput]);
  }

  function renderFreeTextField(entry, onChange) {
    var input = el("textarea", { class: "pdh-field__custom pdh-field__freetext", placeholder: entry.placeholder || "Type here...", rows: "2" });
    input.value = entry.field.value || "";
    input.addEventListener("input", function () { onChange({ value: input.value }); });
    var inputId = "pdh-field-" + input.getAttribute("data-pdh-key");
    input.id = inputId;
    return el("div", { class: "pdh-field" }, [
      el("div", { class: "pdh-field__label-row" }, [el("label", { class: "pdh-field__label", for: inputId, text: entry.label })]),
      input,
    ]);
  }

  function renderSubPanel(headerText, isChecked, onToggle, renderContent, tooltip) {
    var toggle = el("input", { type: "checkbox", class: "pdh-subpanel__toggle" });
    toggle.checked = isChecked;
    toggle.addEventListener("change", function () { onToggle(toggle.checked); });
    var header = el("label", { class: "pdh-subpanel__header" }, [toggle, el("span", { text: headerText })]);
    if (tooltip) header.title = tooltip;
    var panel = el("div", { class: "pdh-subpanel" }, [header]);
    if (isChecked) panel.appendChild(renderContent());
    return panel;
  }

  // ---------------------------------------------------------------------
  // Generic "checklist with a cap" — Mockup Studio's Surrounding Props
  // (pick up to 5 from a list). Same disable-once-full pattern as Prompt
  // Haus's Collection Builder combine checklist.
  // ---------------------------------------------------------------------
  function renderCappedChecklist(options) {
    var wrap = el("fieldset", { class: "pdh-field-group" });
    wrap.appendChild(el("legend", { class: "pdh-field-group__title" }, [icon(options.icon || "sparkle"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "pdh-field-group__subtitle", text: options.subtitle }));
    var list = el("div", { class: "pdh-checklist" });
    options.items.forEach(function (item) {
      var checkbox = el("input", { type: "checkbox", class: "pdh-field__checkbox" });
      checkbox.checked = options.selected.indexOf(item) !== -1;
      checkbox.disabled = !checkbox.checked && options.selected.length >= options.cap;
      checkbox.addEventListener("change", function () {
        options.onToggle(item, checkbox.checked);
      });
      list.appendChild(el("label", { class: "pdh-checklist__item" }, [checkbox, el("span", { text: item })]));
    });
    wrap.appendChild(list);
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Generic progressive text-slot list — Branding Studio's Core Values
  // (up to N short free-text items, "+ Add" / individual Remove), same
  // progressive pattern as Prompt Haus's Companion/Adults/Kids slots but
  // with one plain text field per slot instead of several.
  // ---------------------------------------------------------------------
  function renderTextSlotList(options) {
    var wrap = el("fieldset", { class: "pdh-field-group" });
    wrap.appendChild(el("legend", { class: "pdh-field-group__title" }, [icon(options.icon || "heart"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "pdh-field-group__subtitle", text: options.subtitle }));
    var fieldsWrap = el("div", { class: "pdh-field-group__fields" });
    options.values.forEach(function (value, index) {
      var input = el("input", { type: "text", class: "pdh-field__custom", placeholder: options.placeholder || "" });
      input.value = value || "";
      input.addEventListener("input", function () { options.onUpdate(index, input.value); });
      var removeBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--small pdh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      fieldsWrap.appendChild(el("div", { class: "pdh-text-slot-row" }, [input, removeBtn]));
    });
    wrap.appendChild(fieldsWrap);
    if (options.values.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "pdh-btn pdh-btn--small pdh-btn--add",
        text: "+ Add " + options.singular + " (" + (options.values.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "pdh-companion__controls" }, [addBtn]));
    }
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Color picker — native input[type=color] (which on most desktop
  // browsers opens the OS's own color picker/spectrum) plus an editable
  // hex text field kept in sync both ways, and a Remove button. Scoped to
  // Branding Studio only, per instruction. Up to `max` swatches.
  // ---------------------------------------------------------------------
  var HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  function renderColorPickerList(options) {
    var wrap = el("fieldset", { class: "pdh-field-group" });
    wrap.appendChild(el("legend", { class: "pdh-field-group__title" }, [icon("palette"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "pdh-field-group__subtitle", text: options.subtitle }));
    var row = el("div", { class: "pdh-color-row" });
    options.colors.forEach(function (hex, index) {
      var swatchInput = el("input", { type: "color" });
      swatchInput.value = HEX_PATTERN.test(hex) ? hex : "#6B6860";
      var hexInput = el("input", { type: "text", class: "pdh-field__custom pdh-color-hex", placeholder: "#000000" });
      hexInput.value = hex || "";
      swatchInput.addEventListener("input", function () {
        hexInput.value = swatchInput.value;
        options.onUpdate(index, swatchInput.value);
      });
      hexInput.addEventListener("input", function () {
        if (HEX_PATTERN.test(hexInput.value)) swatchInput.value = hexInput.value;
        options.onUpdate(index, hexInput.value);
      });
      var changeBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--small pdh-btn--reset", text: "Change" });
      changeBtn.addEventListener("click", function () { swatchInput.click(); });
      var removeBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--small pdh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      row.appendChild(el("div", { class: "pdh-color-swatch-item" }, [swatchInput, hexInput, changeBtn, removeBtn]));
    });
    wrap.appendChild(row);
    if (options.colors.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "pdh-btn pdh-btn--small pdh-btn--add",
        text: "+ Add a color (" + (options.colors.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "pdh-companion__controls" }, [addBtn]));
    }
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Font preview dropdown — each <option> rendered in its own typeface
  // via inline font-family, so you see what a font looks like before
  // picking it. Scoped to Branding Studio only, per instruction. Curated
  // Google Fonts (guaranteed to load for every visitor) plus standard
  // web-safe fonts, not the OS's full local font list — see
  // ProductHaus.FONT_OPTIONS in product-haus-branding.js.
  // ---------------------------------------------------------------------
  function renderFontPreviewField(entry, onChange) {
    var select = el("select", { class: "pdh-field__select pdh-font-select" });
    select.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    (entry.field.options || []).forEach(function (opt) {
      var optionNode = el("option", { value: opt, style: "font-family: '" + opt + "', sans-serif;" });
      optionNode.textContent = opt;
      if (opt === entry.field.value) optionNode.selected = true;
      select.appendChild(optionNode);
    });
    select.addEventListener("change", function () { onChange({ value: select.value }); });
    var selectId = "pdh-field-" + select.getAttribute("data-pdh-key");
    select.id = selectId;

    var preview = el("p", {
      class: "pdh-font-preview",
      style: entry.field.value ? "font-family: '" + entry.field.value + "', sans-serif;" : "",
      text: entry.field.value ? "The quick brown fox — " + entry.field.value : "Pick a font to preview it here.",
    });

    return el("div", { class: "pdh-field" }, [
      el("div", { class: "pdh-field__label-row" }, [el("label", { class: "pdh-field__label", for: selectId, text: entry.label })]),
      select,
      preview,
    ]);
  }

  function fieldRenderFn(entry) {
    if (entry.field.isFreeText) return renderFreeTextField;
    if (entry.isFontPicker) return renderFontPreviewField;
    return renderField;
  }

  function renderFieldGroup(title, entries, onChange, subtitle) {
    var fieldsContainer = el("div", { class: "pdh-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(renderFn(entry, function (changes) { onChange(entry, changes); }));
    });
    var titleIcon = TITLE_ICONS[title];
    var legend = titleIcon
      ? el("legend", { class: "pdh-field-group__title" }, [icon(titleIcon), el("span", { text: title })])
      : el("legend", { class: "pdh-field-group__title", text: title });
    var children = [legend];
    if (subtitle) children.push(el("p", { class: "pdh-field-group__subtitle", text: subtitle }));
    children.push(fieldsContainer);
    return el("fieldset", { class: "pdh-field-group" }, children);
  }

  function renderPlainFieldRow(entries, onChange) {
    var fieldsContainer = el("div", { class: "pdh-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(renderFn(entry, function (changes) { onChange(entry, changes); }));
    });
    return fieldsContainer;
  }

  // ---------------------------------------------------------------------
  // Business/Voice DNA bar
  // ---------------------------------------------------------------------
  var NEGATIVE_SUGGESTIONS = ["jargon", "buzzwords", "exclamation points", "emojis", "clickbait", "corporate speak"];

  // omitBroadFields drops Tone/Audience/Reading Level — meaningful for
  // broad modes (they shape wording/voice), but not for Quick Generators,
  // where the whole point is a small, curated field set specific to that
  // one generator. Holiday/Theme/Niche/Negative Prompt stay, since those
  // are still genuinely useful cross-cutting inputs for a quick generator.
  function renderBusinessVoiceDNA(root, omitBroadFields) {
    var state = ProductHaus.styleDNA.getState();

    var nameInput = el("input", { type: "text", class: "pdh-field__select", placeholder: "Your business name" });
    nameInput.value = state.businessName.value || "";
    nameInput.addEventListener("input", function () {
      ProductHaus.styleDNA.setBusinessName(nameInput.value);
    });
    var nameId = "pdh-field-" + nameInput.getAttribute("data-pdh-key");
    nameInput.id = nameId;

    var toneSelect = el("select", { class: "pdh-field__select" });
    appendSelectOptions(toneSelect, state.tone, state.tone.value);
    toneSelect.addEventListener("change", function () { ProductHaus.styleDNA.setTone(toneSelect.value); renderApp(); });
    var toneId = "pdh-field-" + toneSelect.getAttribute("data-pdh-key");
    toneSelect.id = toneId;

    var audienceInput = el("input", { type: "text", class: "pdh-field__select", placeholder: "e.g. busy homeschool moms" });
    audienceInput.value = state.audience.value || "";
    audienceInput.addEventListener("input", function () { ProductHaus.styleDNA.setAudience(audienceInput.value); });
    var audienceId = "pdh-field-" + audienceInput.getAttribute("data-pdh-key");
    audienceInput.id = audienceId;

    var readingSelect = el("select", { class: "pdh-field__select" });
    state.readingLevel.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt, text: opt });
      if (opt === state.readingLevel.value) optionNode.selected = true;
      readingSelect.appendChild(optionNode);
    });
    readingSelect.addEventListener("change", function () { ProductHaus.styleDNA.setReadingLevel(readingSelect.value); renderApp(); });
    var readingId = "pdh-field-" + readingSelect.getAttribute("data-pdh-key");
    readingSelect.id = readingId;

    var variationSelect = el("select", { class: "pdh-field__select" });
    state.variationCount.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt, text: opt + (opt === "1" ? " variation" : " variations") });
      if (opt === state.variationCount.value) optionNode.selected = true;
      variationSelect.appendChild(optionNode);
    });
    variationSelect.addEventListener("change", function () { ProductHaus.styleDNA.setVariationCount(variationSelect.value); renderApp(); });
    var variationId = "pdh-field-" + variationSelect.getAttribute("data-pdh-key");
    variationSelect.id = variationId;

    var platformSelect = el("select", { class: "pdh-field__select" });
    appendSelectOptions(platformSelect, state.targetPlatform, state.targetPlatform.value);
    platformSelect.addEventListener("change", function () { ProductHaus.styleDNA.setTargetPlatform(platformSelect.value); renderApp(); });
    var platformId = "pdh-field-" + platformSelect.getAttribute("data-pdh-key");
    platformSelect.id = platformId;

    var aspectSelect = el("select", { class: "pdh-field__select" });
    state.aspectRatio.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt, text: opt });
      if (opt === state.aspectRatio.value) optionNode.selected = true;
      aspectSelect.appendChild(optionNode);
    });
    aspectSelect.addEventListener("change", function () { ProductHaus.styleDNA.setAspectRatio(aspectSelect.value); renderApp(); });
    var aspectId = "pdh-field-" + aspectSelect.getAttribute("data-pdh-key");
    aspectSelect.id = aspectId;

    var bufferToggle = el("div", { class: "pdh-styledna__yesno" }, [
      yesNoButton("Yes", state.addBuffer === true, function () { ProductHaus.styleDNA.setAddBuffer(true); renderApp(); }),
      yesNoButton("No", state.addBuffer !== true, function () { ProductHaus.styleDNA.setAddBuffer(false); renderApp(); }),
    ]);
    var bufferLabel = labelWithIcon("bufferBox", "Image Buffer/Padding", null, null, "Asks the AI to leave empty space around the edges so nothing gets cropped at the borders.");
    bufferLabel.id = "pdh-label-buffer-padding";
    bufferToggle.setAttribute("role", "group");
    bufferToggle.setAttribute("aria-labelledby", bufferLabel.id);

    var outputFormatSelect = el("select", { class: "pdh-field__select" });
    appendSelectOptions(outputFormatSelect, state.outputFormat, state.outputFormat.value);
    outputFormatSelect.addEventListener("change", function () { ProductHaus.styleDNA.setOutputFormat(outputFormatSelect.value); renderApp(); });
    var outputFormatId = "pdh-field-" + outputFormatSelect.getAttribute("data-pdh-key");
    outputFormatSelect.id = outputFormatId;

    var negativeTextarea = el("textarea", { class: "pdh-field__custom pdh-field__freetext pdh-styledna__negative-input", rows: "2", placeholder: 'e.g. "jargon, buzzwords, emojis"' });
    negativeTextarea.value = state.negativePrompt.value || "";
    negativeTextarea.addEventListener("input", function () {
      ProductHaus.styleDNA.updateNegativePromptField({ value: negativeTextarea.value });
      renderApp();
    });
    var negativeId = "pdh-field-" + negativeTextarea.getAttribute("data-pdh-key");
    negativeTextarea.id = negativeId;
    var chips = el("div", { class: "pdh-styledna__negative-chips" });
    NEGATIVE_SUGGESTIONS.forEach(function (item) {
      var chip = el("button", { type: "button", class: "pdh-styledna__negative-chip", text: item });
      chip.title = 'Add "' + item + '" to the list above.';
      chip.addEventListener("click", function () {
        var current = (negativeTextarea.value || "").trim();
        var next = current ? current + ", " + item : item;
        ProductHaus.styleDNA.updateNegativePromptField({ value: next });
        renderApp();
      });
      chips.appendChild(chip);
    });

    var negativeFieldChildren = [
      labelWithIcon("shield", "Negative Prompt — What to Avoid", negativeId),
      el("p", { class: "pdh-styledna__negative-subtitle", text: "Applies to every studio, once, at the end of the prompt — comma-separated. Click a suggestion to add it." }),
      negativeTextarea,
      chips,
    ];
    // Scoped to just this field — the mode's own Reset wipes every
    // selection in that mode too, not just this list. Only shown once
    // there's something to clear.
    if ((state.negativePrompt.value || "").trim()) {
      var negativeClearBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--small pdh-btn--reset pdh-styledna__negative-clear" }, [el("span", { text: "Clear Negative Prompt" })]);
      negativeClearBtn.addEventListener("click", function () {
        ProductHaus.styleDNA.updateNegativePromptField({ value: "" });
        renderApp();
      });
      negativeFieldChildren.push(negativeClearBtn);
    }

    var children = [
      el("div", { class: "pdh-styledna__field" }, [labelWithIcon("shirt", "Business Name", nameId, null, "Set once here — carries into every studio automatically."), nameInput]),
    ];
    if (!omitBroadFields) {
      children.push(
        el("div", { class: "pdh-styledna__field" }, [labelWithIcon("sparkle", "Tone", toneId, null, "How your brand sounds — warm, bold, playful, professional, etc."), toneSelect]),
        el("div", { class: "pdh-styledna__field" }, [labelWithIcon("people", "Audience", audienceId, null, "Who you're talking to — the more specific, the better the copy."), audienceInput]),
        el("div", { class: "pdh-styledna__field" }, [labelWithIcon("monitor", "Reading Level", readingId), readingSelect])
      );
    }
    children.push(
      el("div", { class: "pdh-styledna__field" }, [labelWithIcon("sparkle", "Variations", variationId), variationSelect]),
      el("div", { class: "pdh-styledna__field" }, [labelWithIcon("monitor", "Target Platform", platformId, null, "Formats the copied prompt for this specific AI tool."), platformSelect]),
      el("div", { class: "pdh-styledna__field" }, [labelWithIcon("crop", "Aspect Ratio", aspectId, null, "Only appears in the copied text for Midjourney/Leonardo AI."), aspectSelect]),
      el("div", { class: "pdh-styledna__field" }, [bufferLabel, bufferToggle]),
      el("div", { class: "pdh-styledna__field" }, [
        labelWithIcon("bufferBox", "Output Format", outputFormatId, null, "A file-level export setting (transparency/format) — independent of any generator's own Background field, which is a scene/content choice, not a file setting. Leave on Default for a plain PNG."),
        outputFormatSelect,
      ]),
      el("div", { class: "pdh-styledna__field pdh-styledna__field--full" }, negativeFieldChildren)
    );
    root.appendChild(el("div", { class: "pdh-styledna" }, children));
  }

  // Holiday/Theme/Niche relocated out of the dark Business/Voice DNA bar
  // into their own boxed section — same "Concept / Creative Direction"
  // treatment Content Haus uses for its own equivalent fields. Purely a
  // rendering change: getVoiceEntries() still folds all three into every
  // assembled prompt exactly as before, unchanged.
  function renderConceptBox() {
    var state = ProductHaus.styleDNA.getState();
    return renderFieldGroup(
      "Concept / Creative Direction",
      [
        { label: "Holiday", field: state.holiday },
        { label: "Creative Theme", field: state.theme },
        { label: "Niche", field: state.niche },
      ],
      function (entry, changes) {
        var fieldName = entry.label === "Holiday" ? "holiday" : entry.label === "Creative Theme" ? "theme" : "niche";
        ProductHaus.util.updateField(ProductHaus.styleDNA, fieldName, changes);
        renderApp();
      },
      "Optional creative direction, shared across every studio."
    );
  }

  // ---------------------------------------------------------------------
  // Quality nudge, preview actions, export row, preview
  // ---------------------------------------------------------------------
  var QUALITY_NUDGE_THRESHOLD = 15;
  function renderQualityNudge(assembled) {
    var count = (assembled.fragments || []).length;
    if (count <= QUALITY_NUDGE_THRESHOLD) return null;
    return el("div", { class: "pdh-preview__nudge" }, [
      icon("warning", "pdh-preview__nudge-icon"),
      el("span", { text: "Heads up: you've got " + count + " details selected — results tend to look cleaner with a more focused set (aim for 5-10)." }),
    ]);
  }

  function renderPreviewActions(formatted, onRandomize, onReset, onSave, mode) {
    var copyBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--copy" }, [icon("copy"), el("span", { class: "pdh-btn__label", text: "Copy My Prompt" })]);
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn.querySelector(".pdh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy My Prompt"; }, 1500);
      });
      ProductHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
      refreshRecentLogPanel();
    });

    var randomizeBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--randomize" }, [icon("shuffle"), el("span", { text: "Randomize" })]);
    randomizeBtn.title = 'Picks a new random value for every field with "Include in prompt" checked, and clears any typed custom value for those fields.';
    randomizeBtn.addEventListener("click", onRandomize);

    var resetBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--reset" }, [icon("refresh"), el("span", { text: "Reset" })]);
    resetBtn.title = "Clears every field back to Select.../None.";
    resetBtn.addEventListener("click", onReset);

    var isFull = ProductHaus.favorites.isFull(mode);
    var saveBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--save" }, [icon("vault"), el("span", { text: "Save to Vault" })]);
    saveBtn.disabled = isFull;
    saveBtn.title = isFull
      ? "You have " + ProductHaus.favorites.MAX_PER_MODE + "/" + ProductHaus.favorites.MAX_PER_MODE + " saved here — delete one below to save another."
      : "Saves this exact prompt text below (up to " + ProductHaus.favorites.MAX_PER_MODE + " per studio).";
    saveBtn.addEventListener("click", function () {
      onSave();
      ProductHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
    });

    var actionsGrid = el("div", { class: "pdh-preview__actions" }, [randomizeBtn, copyBtn, saveBtn, resetBtn]);
    var exportRow = renderExportRow(formatted, mode);
    return el("div", {}, [actionsGrid, exportRow]);
  }

  function renderExportRow(formatted, mode) {
    var shareBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--export" }, [icon("share"), el("span", { class: "pdh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows this exact prompt to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(formatted), function (ok) {
        var label = shareBtn.querySelector(".pdh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn2 = el("button", { type: "button", class: "pdh-btn pdh-btn--export" }, [icon("copy"), el("span", { class: "pdh-btn__label", text: "Copy" })]);
    copyBtn2.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn2.querySelector(".pdh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--export" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads this prompt as a .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(formatted, "product-haus-" + mode + "-prompt.txt"); });
    var printBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--export" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of this prompt.";
    printBtn.addEventListener("click", function () { printPromptText(formatted); });
    return el("div", { class: "pdh-preview__export-row" }, [shareBtn, copyBtn2, downloadBtn, printBtn]);
  }

  var saveFeedback = null;

  function renderPreview(root, assembled, modeApi, mode) {
    var styleDNAState = ProductHaus.styleDNA.getState();
    var formatted = ProductHaus.engine.formatForPlatform(assembled, styleDNAState.targetPlatform.value, styleDNAState.aspectRatio.value, styleDNAState.negativePrompt.value, styleDNAState.addBuffer, styleDNAState.outputFormat.value);
    var textarea = el("textarea", { class: "pdh-preview__text", readonly: "readonly" });
    textarea.value = formatted;

    var actions = renderPreviewActions(
      formatted,
      function () { modeApi.randomize(); renderApp(); },
      function () { modeApi.reset(); ProductHaus.styleDNA.resetContent(); renderApp(); },
      function () {
        var result = ProductHaus.favorites.save(mode, {
          text: formatted,
          title: buildVaultTitle(mode),
          snapshot: buildVaultSnapshot(mode),
        });
        saveFeedback = result.ok ? { text: "Saved!", isError: false } : { text: result.reason, isError: true };
        renderApp();
        setTimeout(function () { saveFeedback = null; renderApp(); }, 2500);
      },
      mode
    );

    var previewChildren = [
      el("h3", { class: "pdh-preview__title" }, [icon("lightning"), el("span", { text: "Your Prompt, Built Live" })]),
      el("p", { class: "pdh-preview__subtitle", text: "Watch your creative direction turn into a ready-to-use AI prompt." }),
    ];
    var qualityNudge = renderQualityNudge(assembled);
    if (qualityNudge) previewChildren.push(qualityNudge);
    previewChildren.push(textarea, actions);
    if (saveFeedback) {
      previewChildren.push(el("p", { class: "pdh-preview__save-feedback" + (saveFeedback.isError ? " is-error" : " is-success"), text: saveFeedback.text }));
    }
    root.appendChild(el("div", { class: "pdh-preview" }, previewChildren));
  }

  // ---------------------------------------------------------------------
  // Your Vault
  // ---------------------------------------------------------------------
  var vaultExpanded = false;
  var renamingVaultId = null;

  function renderSavedPrompts(root, mode) {
    var saved = ProductHaus.favorites.getAll(mode).slice().reverse();
    var max = ProductHaus.favorites.MAX_PER_MODE;
    var list = el("div", { class: "pdh-saved__list" });
    if (!saved.length) {
      list.appendChild(el("p", { class: "pdh-saved__empty", text: "Your vault is empty — use \"Save to Vault\" above." }));
    } else {
      var visible = vaultExpanded ? saved : saved.slice(0, 1);
      visible.forEach(function (fav, index) {
        var currentVersion = ProductHaus.favorites.getCurrentVersion(fav);
        var versionCount = ProductHaus.favorites.getVersionCount(fav);
        var preview = currentVersion.text.length > 160 ? currentVersion.text.slice(0, 160) + "…" : currentVersion.text;

        var titleRow;
        if (renamingVaultId === fav.id) {
          var titleInput = el("input", { type: "text", class: "pdh-saved__item-title-input", value: fav.title || "" });
          var confirmRename = function () {
            ProductHaus.favorites.rename(mode, fav.id, titleInput.value.trim() || ("Untitled " + (index + 1)));
            renamingVaultId = null;
            renderApp();
          };
          titleInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") confirmRename();
            if (e.key === "Escape") { renamingVaultId = null; renderApp(); }
          });
          titleInput.addEventListener("blur", confirmRename);
          titleRow = el("div", { class: "pdh-saved__item-title-row" }, [titleInput]);
        } else {
          var renameBtn = el("button", { type: "button", class: "pdh-saved__rename-btn", "aria-label": "Rename this saved prompt", title: "Rename" }, [icon("edit")]);
          renameBtn.addEventListener("click", function () { renamingVaultId = fav.id; renderApp(); });
          titleRow = el("div", { class: "pdh-saved__item-title-row" }, [
            el("p", { class: "pdh-saved__item-title", text: fav.title || "Untitled " + (index + 1) }),
            renameBtn,
          ]);
        }

        var loadBtn = null;
        if (currentVersion.snapshot) {
          loadBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--load pdh-btn--small", text: "Load" });
          loadBtn.title = "Restores every field in the builder to exactly how it was when this version was saved.";
          loadBtn.addEventListener("click", function () { loadVaultSnapshot(mode, currentVersion.snapshot); renderApp(); });
        }

        var copyBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--copy pdh-btn--small", text: "Copy" });
        copyBtn.addEventListener("click", function () {
          copyTextToClipboard(currentVersion.text, function (ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
          });
        });

        var saveVersionBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--small", text: "Save as New Version" });
        saveVersionBtn.title = "Adds the prompt you're currently building as a new version of this item — doesn't use up another Vault slot.";
        saveVersionBtn.addEventListener("click", function () {
          var textarea = document.querySelector(".pdh-preview__text");
          if (!textarea || !textarea.value) return;
          ProductHaus.favorites.addVersion(mode, fav.id, { text: textarea.value, snapshot: buildVaultSnapshot(mode) });
          renderApp();
        });

        var deleteBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--delete pdh-btn--small", text: "Delete" });
        deleteBtn.title = versionCount > 1 ? "Deletes this item and all " + versionCount + " of its versions." : "Deletes this item.";
        deleteBtn.addEventListener("click", function () { ProductHaus.favorites.remove(mode, fav.id); renderApp(); });

        var actionBtns = [];
        if (loadBtn) actionBtns.push(loadBtn);
        actionBtns.push(copyBtn, saveVersionBtn, deleteBtn);

        var itemChildren = [titleRow];
        if (versionCount > 1) {
          var versionSelect = el("select", { class: "pdh-saved__version-select" });
          fav.versions.forEach(function (v, vi) {
            var isLatest = vi === fav.versions.length - 1;
            var optionNode = el("option", { value: String(vi) }, [document.createTextNode("Version " + (vi + 1) + (isLatest ? " (latest)" : ""))]);
            var activeIdx = typeof fav.activeVersionIndex === "number" ? fav.activeVersionIndex : fav.versions.length - 1;
            if (vi === activeIdx) optionNode.selected = true;
            versionSelect.appendChild(optionNode);
          });
          versionSelect.title = "Switch which saved version of this item you're viewing.";
          versionSelect.addEventListener("change", function () {
            ProductHaus.favorites.setActiveVersion(mode, fav.id, parseInt(versionSelect.value, 10));
            renderApp();
          });
          itemChildren.push(el("div", { class: "pdh-saved__version-row" }, [icon("layers"), versionSelect]));
        }
        itemChildren.push(
          el("p", { class: "pdh-saved__item-text", text: preview }),
          el("div", { class: "pdh-saved__item-meta" }, [
            el("span", { class: "pdh-saved__item-tag", text: new Date(currentVersion.createdAt).toLocaleDateString() }),
            el("div", { class: "pdh-saved__item-actions" }, actionBtns),
          ])
        );
        list.appendChild(el("div", { class: "pdh-saved__item" }, itemChildren));
      });
    }

    var headerChildren = [el("h3", { class: "pdh-saved__title" }, [icon("vault"), el("span", { text: "Your Vault (" + saved.length + "/" + max + ")" })])];
    if (saved.length > 1) {
      var vaultToggleBtn = el("button", { type: "button", class: "pdh-faq__toggle" }, [
        icon(vaultExpanded ? "eyeOff" : "eye"),
        el("span", { text: vaultExpanded ? "Hide" : "Show full list" }),
      ]);
      vaultToggleBtn.addEventListener("click", function () { vaultExpanded = !vaultExpanded; renderApp(); });
      headerChildren.push(vaultToggleBtn);
    }
    root.appendChild(el("div", { class: "pdh-saved" }, [el("div", { class: "pdh-faq__header" }, headerChildren), renderFullVaultExportRow(), list]));
  }

  // ---------------------------------------------------------------------
  // Recently Generated
  // ---------------------------------------------------------------------
  var recentLogExpanded = false;

  function refreshRecentLogPanel() {
    var existing = document.querySelector(".pdh-recent");
    if (!existing) return;
    var captured = null;
    renderRecentLog({ appendChild: function (node) { captured = node; } });
    if (captured) existing.replaceWith(captured);
  }

  function renderRecentLogItem(entry) {
    var preview = entry.text.length > 160 ? entry.text.slice(0, 160) + "…" : entry.text;
    var loadBtn = null;
    if (entry.snapshot) {
      loadBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--load pdh-btn--small", text: "Load" });
      loadBtn.title = "Restores every field in the builder to exactly how it was when this was generated.";
      loadBtn.addEventListener("click", function () {
        loadVaultSnapshot(entry.mode, entry.snapshot);
        if (entry.mode.indexOf("gen:") === 0) {
          activeMode = "generators";
          ProductHaus.generators.setActiveGenerator(entry.mode.slice(4));
        } else {
          activeMode = entry.mode;
        }
        renderApp();
      });
    }
    var copyBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--copy pdh-btn--small", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(entry.text, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });
    var deleteBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--delete pdh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { ProductHaus.favorites.removeRecent(entry.id); renderApp(); });

    var metaParts = [modeLabel(entry.mode), new Date(entry.loggedAt).toLocaleString()];
    var actionBtns = [];
    if (loadBtn) actionBtns.push(loadBtn);
    actionBtns.push(copyBtn, deleteBtn);
    return el("div", { class: "pdh-saved__item" }, [
      el("p", { class: "pdh-saved__item-text", text: preview }),
      el("div", { class: "pdh-saved__item-meta" }, [
        el("span", { class: "pdh-saved__item-tag", text: metaParts.join(" · ") }),
        el("div", { class: "pdh-saved__item-actions" }, actionBtns),
      ]),
    ]);
  }

  function renderRecentLog(root) {
    var recent = ProductHaus.favorites.getRecentLog();
    var list = el("div", { class: "pdh-saved__list" });
    if (!recent.length) {
      list.appendChild(el("p", { class: "pdh-saved__empty", text: "Nothing generated yet — this fills in automatically as you Copy or Save prompts." }));
    } else {
      var visible = recentLogExpanded ? recent : recent.slice(0, 1);
      visible.forEach(function (entry) { list.appendChild(renderRecentLogItem(entry)); });
    }
    var headerChildren = [el("h3", { class: "pdh-saved__title" }, [icon("refresh"), el("span", { text: "Recently Generated (" + recent.length + "/" + ProductHaus.favorites.RECENT_LOG_MAX + ")" })])];
    if (recent.length > 1) {
      var toggleBtn = el("button", { type: "button", class: "pdh-faq__toggle" }, [
        icon(recentLogExpanded ? "eyeOff" : "eye"),
        el("span", { text: recentLogExpanded ? "Hide" : "Show all" }),
      ]);
      toggleBtn.addEventListener("click", function () { recentLogExpanded = !recentLogExpanded; renderApp(); });
      headerChildren.push(toggleBtn);
    }
    var children = [el("div", { class: "pdh-faq__header" }, headerChildren)];
    if (recent.length) {
      var clearBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--delete pdh-btn--small", text: "Clear All" });
      clearBtn.title = "Clears this automatic log — doesn't touch anything in Your Vault.";
      clearBtn.addEventListener("click", function () { ProductHaus.favorites.clearRecentLog(); renderApp(); });
      children.push(el("div", { class: "pdh-recent__clear-row" }, [clearBtn]));
    }
    children.push(
      el("p", { class: "pdh-field-group__subtitle", text: "Auto-saved on Copy/Save, most recent first — Load restores every field, same as Your Vault." }),
      list
    );
    root.appendChild(el("div", { class: "pdh-saved pdh-recent" }, children));
  }

  function renderFullVaultExportRow() {
    var all = ProductHaus.favorites.getAllFlat();
    if (!all.length) return el("div", {});
    var fullText = buildFullVaultText();
    var shareBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--export pdh-btn--small" }, [icon("share"), el("span", { class: "pdh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows your entire saved vault to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(fullText), function (ok) {
        var label = shareBtn.querySelector(".pdh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--export pdh-btn--small" }, [icon("copy"), el("span", { class: "pdh-btn__label", text: "Copy" })]);
    copyBtn.title = "Copies every saved prompt across every studio as one block of text.";
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(fullText, function (ok) {
        var label = copyBtn.querySelector(".pdh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--export pdh-btn--small" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads every saved prompt across every studio as one .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(fullText, "product-haus-full-vault.txt"); });
    var printBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--export pdh-btn--small" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of your entire saved vault.";
    printBtn.addEventListener("click", function () { printPromptText(fullText); });
    return el("div", { class: "pdh-saved__vault-export" }, [shareBtn, copyBtn, downloadBtn, printBtn]);
  }

  // ---------------------------------------------------------------------
  // Your Selections — simplified from Prompt Haus's own Creative Brief:
  // just the toggleable full list of resolved fields, no per-mode
  // headline-facts row (that needs bespoke copy per studio, deferred).
  // ---------------------------------------------------------------------
  var selectionsExpanded = false;

  function renderSelectionsPanel(root, mode, groups) {
    var totalItemCount = groups.reduce(function (sum, g) { return sum + g.items.length; }, 0);
    var eyeBtn = el("button", { type: "button", class: "pdh-selections__eye-btn" }, [
      icon(selectionsExpanded ? "eyeOff" : "eye"),
      el("span", { text: selectionsExpanded ? "Hide full list" : "Show full list (" + totalItemCount + ")" }),
    ]);
    eyeBtn.addEventListener("click", function () { selectionsExpanded = !selectionsExpanded; renderApp(); });

    var children = [
      el("div", { class: "pdh-selections__header" }, [
        el("h3", { class: "pdh-selections__title" }, [icon("document"), el("span", { text: "Your Selections" })]),
        eyeBtn,
      ]),
    ];
    if (selectionsExpanded) {
      var body;
      if (!groups.length) {
        body = el("p", { class: "pdh-selections__empty", text: "Nothing selected yet — choices you make above will appear here." });
      } else {
        body = el("div", { class: "pdh-selections__scroll" });
        groups.forEach(function (group, idx) {
          if (idx > 0) body.appendChild(el("hr", { class: "pdh-selections__divider" }));
          body.appendChild(el("h4", { class: "pdh-selections__group-title", text: group.title }));
          group.items.forEach(function (item) {
            body.appendChild(el("div", { class: "pdh-selections__item" }, [
              el("span", { class: "pdh-selections__item-label", text: item.label + ":" }),
              el("span", { class: "pdh-selections__item-value", text: " " + item.value }),
            ]));
          });
        });
      }
      children.push(el("hr", { class: "pdh-selections__divider" }), body);
    }
    root.appendChild(el("div", { class: "pdh-selections" }, children));
  }

  // ---------------------------------------------------------------------
  // Categories + tabs + shell
  //
  // A category groups one or more "items" — each either a broad Studio
  // (type: "mode") or a narrow Quick Generator (type: "generator", by
  // id). A single-item category opens straight into that item's panel
  // (no grid step); a multi-item category shows a small grid of its own
  // items first (reusing the same .pdh-generator-grid/.pdh-generator-card
  // CSS the old flat Quick Generators grid used). activeMode stays the
  // one source of truth for "what's actually rendering" — categories are
  // a pure navigation/grouping layer on top, not a second state machine.
  // ---------------------------------------------------------------------
  var BROAD_MODE_LABELS = {
    invitations: "Cards & Invitations",
    stationery: "Stationery",
    devotional: "Devotional & Motivation Card Studio",
  };

  var CATEGORIES = [
    {
      id: "cardsInvitations", label: "Cards & Invitations", icon: "gift",
      items: [{ type: "mode", mode: "invitations", label: BROAD_MODE_LABELS.invitations, description: "Wedding, birthday, baby shower, and other invitations — wording plus visual style in one prompt.", icon: "gift" }],
    },
    {
      id: "stationeryDevotionals", label: "Stationery & Devotionals", icon: "document",
      items: [
        { type: "mode", mode: "stationery", label: BROAD_MODE_LABELS.stationery, description: "Business note cards and change-of-address cards — wording plus visual style in one prompt.", icon: "document" },
        { type: "generator", id: "devotional-pages" },
      ],
    },
    {
      id: "journals", label: "Journals", icon: "layers",
      items: [
        { type: "generator", id: "journal-pages" },
        { type: "generator", id: "junk-journal" },
        { type: "generator", id: "notebook-cover" },
      ],
    },
    {
      id: "plannersChecklists", label: "Planners & Checklists", icon: "monitor",
      items: [
        { type: "generator", id: "planner-pages" },
        { type: "generator", id: "event-checklist" },
        { type: "generator", id: "event-vendor-checklist" },
      ],
    },
    {
      id: "ebookPages", label: "eBook Pages", icon: "download",
      items: [{ type: "generator", id: "ebook-pages" }],
    },
    {
      id: "devotionalCards", label: "Devotional & Motivation Cards", icon: "heart",
      items: [
        { type: "mode", mode: "devotional", label: BROAD_MODE_LABELS.devotional, description: "Scripture, affirmation, prayer, and motivational quote cards — single cards or full decks.", icon: "heart" },
        { type: "generator", id: "prayer-cards" },
      ],
    },
    {
      id: "wallArt", label: "Wall Art", icon: "crop",
      items: [
        { type: "generator", id: "retro-wall-art" },
        { type: "generator", id: "quote-wall-art" },
      ],
    },
    {
      id: "activitiesLearning", label: "Activities & Learning Pages", icon: "shuffle",
      items: [
        { type: "generator", id: "coloring-page" },
        { type: "generator", id: "kids-worksheet" },
        { type: "generator", id: "coloring-book" },
        { type: "generator", id: "activity-book" },
        { type: "generator", id: "adult-coloring-page" },
        { type: "generator", id: "learning-cards" },
      ],
    },
    {
      id: "stickers", label: "Stickers", icon: "crop",
      items: [{ type: "generator", id: "sticker-sheet" }],
    },
  ];

  var activeMode = "invitations";
  // Set while a multi-item category's own mini-grid is showing (no item
  // picked yet this visit); cleared the moment an item is opened.
  var pendingCategoryId = null;

  function findCategoryForActiveMode() {
    for (var i = 0; i < CATEGORIES.length; i++) {
      var items = CATEGORIES[i].items;
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        if (item.type === "mode" && item.mode === activeMode) return CATEGORIES[i];
        if (item.type === "generator" && activeMode === "generators" && ProductHaus.generators.getActiveGeneratorId() === item.id) return CATEGORIES[i];
      }
    }
    return null;
  }

  function openItem(item) {
    pendingCategoryId = null;
    if (item.type === "mode") {
      activeMode = item.mode;
    } else {
      ProductHaus.generators.setActiveGenerator(item.id);
      activeMode = "generators";
    }
  }

  function getItemMeta(item) {
    if (item.type === "mode") return { label: item.label, description: item.description, icon: item.icon };
    var def = ProductHaus.generators.getGeneratorDef(item.id);
    return { label: def ? def.label : item.id, description: def ? def.description : "", icon: def ? def.icon : "sparkle" };
  }

  function renderTabs(root) {
    var row = el("div", { class: "pdh-tabs" });
    var activeCategory = pendingCategoryId ? null : findCategoryForActiveMode();
    CATEGORIES.forEach(function (cat) {
      var isActive = cat.id === pendingCategoryId || cat === activeCategory;
      var btn = el("button", { type: "button", class: "pdh-tabs__btn" + (isActive ? " is-active" : "") }, [icon(cat.icon), el("span", { text: cat.label })]);
      btn.addEventListener("click", function () {
        if (cat.items.length === 1) {
          openItem(cat.items[0]);
        } else {
          pendingCategoryId = cat.id;
        }
        renderApp();
      });
      row.appendChild(el("span", { class: "pdh-tabs__item" }, [btn]));
    });
    root.appendChild(el("div", { class: "pdh-tabs-box" }, [row]));
  }

  function renderCategoryMiniGrid(cat) {
    var wrap = el("div", { class: "pdh-panel" });
    wrap.appendChild(el("p", { class: "pdh-generator-grid__intro", text: "Pick one below — each works even if you leave everything at its default." }));
    var cards = cat.items.map(function (item) {
      var meta = getItemMeta(item);
      var card = el("button", { type: "button", class: "pdh-generator-card" }, [
        icon(meta.icon || "sparkle"),
        el("span", { class: "pdh-generator-card__name", text: meta.label }),
        el("span", { class: "pdh-generator-card__description", text: meta.description || "" }),
      ]);
      card.addEventListener("click", function () { openItem(item); renderApp(); });
      return card;
    });
    wrap.appendChild(el("div", { class: "pdh-generator-grid" }, cards));
    return wrap;
  }

  function renderBackButton(cat) {
    var backBtn = el("button", { type: "button", class: "pdh-btn pdh-btn--small pdh-btn--back", text: "← Back to " + cat.label });
    backBtn.addEventListener("click", function () { pendingCategoryId = cat.id; renderApp(); });
    return backBtn;
  }

  function renderApp() {
    var root = document.getElementById("product-haus-app");
    if (!root) return;

    var scrollX = window.scrollX;
    var scrollY = window.scrollY;
    var previewHeights = Array.prototype.map.call(root.querySelectorAll(".pdh-preview__text"), function (t) {
      return t.style.height || "";
    });
    var active = document.activeElement;
    var focusRestore = null;
    if (active && root.contains(active) && active.hasAttribute("data-pdh-key")) {
      focusRestore = {
        key: active.getAttribute("data-pdh-key"),
        selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
        selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
      };
    }

    try {
      renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights);
    } catch (e) {
      root.innerHTML = "";
      root.appendChild(el("div", { class: "pdh-render-error" }, [
        el("p", { text: "Something went wrong displaying the builder — this can happen when loading a prompt saved under an older version of the tool." }),
        el("p", { text: "Reload the page to get back to a working state. If it happened right after clicking Load on a saved prompt, that item may need to be deleted from Your Vault or Recently Generated and recreated." }),
      ]));
      if (window.console && window.console.error) window.console.error("Project Haus render error:", e);
    }
  }

  function renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights) {
    pdhKeyCounter = 0;
    root.innerHTML = "";

    var shell = el("div", { class: "pdh-shell" });
    shell.appendChild(el("p", { class: "pdh-mode-select-label", text: "Select a Category" }));
    renderTabs(shell);
    renderBusinessVoiceDNA(shell, activeMode === "generators");

    var body = el("div", { class: "pdh-body" });
    var left = el("div", { class: "pdh-body__fields" });
    var right = el("div", { class: "pdh-body__preview" });

    var pendingCategory = pendingCategoryId ? CATEGORIES.filter(function (c) { return c.id === pendingCategoryId; })[0] : null;

    if (pendingCategory) {
      left.appendChild(renderCategoryMiniGrid(pendingCategory));
    } else {
      var activeCategory = findCategoryForActiveMode();
      var modeApi = ProductHaus[activeMode];
      // Quick Generators is one mode holding many small generators — each
      // needs its own Vault/Recent Log bucket, not one shared "generators"
      // bucket, so the favorites key is the active generator's own id
      // rather than the literal mode name once one is selected.
      var vaultKey = (activeMode === "generators" && modeApi && typeof modeApi.getActiveGeneratorId === "function" && modeApi.getActiveGeneratorId())
        ? "gen:" + modeApi.getActiveGeneratorId()
        : activeMode;
      if (activeCategory && activeCategory.items.length > 1) left.appendChild(renderBackButton(activeCategory));
      if (modeApi && typeof modeApi.renderPanel === "function") {
        left.appendChild(renderConceptBox());
        left.appendChild(modeApi.renderPanel());
        renderSelectionsPanel(right, vaultKey, modeApi.getSelectionsByGroup());
        renderPreview(right, modeApi.assemblePrompt(), modeApi, vaultKey);
        renderSavedPrompts(right, vaultKey);
      } else {
        left.appendChild(el("p", { class: "pdh-coming-soon", text: "This is coming soon." }));
      }
      if (activeMode === "generators" && ProductHaus.lookLock) ProductHaus.lookLock.renderSection(right);
      if (ProductHaus.brandKit) ProductHaus.brandKit.renderSection(right);
      renderRecentLog(right);
    }

    body.appendChild(left);
    body.appendChild(right);
    shell.appendChild(body);
    root.appendChild(shell);

    if (focusRestore) {
      var restored = root.querySelector('[data-pdh-key="' + focusRestore.key + '"]');
      if (restored) {
        restored.focus({ preventScroll: true });
        if (focusRestore.selectionStart !== null && typeof restored.setSelectionRange === "function") {
          try {
            restored.setSelectionRange(focusRestore.selectionStart, focusRestore.selectionEnd);
          } catch (e) {
            // setSelectionRange throws on input types that don't support it.
          }
        }
      }
    }
    if (previewHeights && previewHeights.length) {
      var newTextareas = root.querySelectorAll(".pdh-preview__text");
      previewHeights.forEach(function (height, i) {
        if (height && newTextareas[i]) newTextareas[i].style.height = height;
      });
    }
    window.scrollTo(scrollX, scrollY);
  }

  ProductHaus.ui = {
    el: el,
    icon: icon,
    copyTextToClipboard: copyTextToClipboard,
    infoIcon: infoIcon,
    labelWithIcon: labelWithIcon,
    renderPillToggle: renderPillToggle,
    renderPresetRow: renderPresetRow,
    appendSelectOptions: appendSelectOptions,
    fieldHasValue: fieldHasValue,
    renderField: renderField,
    renderFreeTextField: renderFreeTextField,
    renderSubPanel: renderSubPanel,
    renderCappedChecklist: renderCappedChecklist,
    renderTextSlotList: renderTextSlotList,
    renderColorPickerList: renderColorPickerList,
    renderFontPreviewField: renderFontPreviewField,
    renderFieldGroup: renderFieldGroup,
    renderPlainFieldRow: renderPlainFieldRow,
    renderApp: renderApp,
    buildVaultSnapshot: buildVaultSnapshot,
    buildVaultTitle: buildVaultTitle,
  };

  document.addEventListener("click", function (e) {
    document.querySelectorAll(".pdh-info[open]").forEach(function (details) {
      if (!details.contains(e.target)) details.open = false;
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    ProductHaus.ui.renderApp();
  });
})();
