/**
 * The AI Creator's Brand Haus — UI
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-favorites.js, brand-haus-styledna.js. Loads BEFORE
 * the mode modules in the section/dev-harness script order, but its own
 * generic render helpers (exposed on BrandHaus.ui) are only ever
 * CALLED from inside each mode's own renderPanel function — which
 * doesn't run until a user actually visits that tab, long after every
 * script has finished loading — so the load-order works fine even
 * though the mode files come before this one.
 *
 * Architecture note vs. Prompt Haus's own prompt-builder-ui.js: that
 * file owns every mode's renderXPanel function directly. Here, each
 * mode file owns its own renderPanel (as BrandHaus.<mode>.renderPanel)
 * and this file only holds the generic shell + reusable field/section
 * helpers — keeps each Studio self-contained in its own file instead of
 * one file needing to know every mode's internal field structure.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var mhKeyCounter = 0;
  var FOCUSABLE_TAGS = { input: true, select: true, textarea: true };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (FOCUSABLE_TAGS[tag]) {
      node.setAttribute("data-bh-key", String(mhKeyCounter++));
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
      "<html><head><title>Your Marketing Prompt — The AI Creator's Brand Haus</title><style>" +
        "body{font-family:Georgia,serif;padding:48px;color:#1A1815;line-height:1.6;max-width:600px;margin:0 auto;}" +
        "h1{font-size:16px;letter-spacing:0.05em;text-transform:uppercase;color:#D6336C;margin-bottom:28px;}" +
        "p{font-size:15px;white-space:pre-wrap;}" +
        "</style></head><body>" +
        "<h1>Black Sheep Creations &amp; Inspirations — The AI Creator's Brand Haus</h1>" +
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
    return base + "?mh_shared_prompt=" + encoded;
  }

  // ---------------------------------------------------------------------
  // Vault snapshot save/restore — same crash-safety pattern as Prompt
  // Haus (deep-merge onto current defaults, never wholesale-replace).
  // ---------------------------------------------------------------------
  function buildVaultSnapshot(mode) {
    var snapshot = { identity: JSON.parse(JSON.stringify(BrandHaus.identity.getState())) };
    snapshot[mode] = JSON.parse(JSON.stringify(BrandHaus[mode].getState()));
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
      result[key] = deepMergeSnapshot(current[key], saved[key]);
    });
    return result;
  }

  function loadVaultSnapshot(mode, snapshot) {
    if (!snapshot) return;
    if (snapshot.identity) BrandHaus.identity.setState(deepMergeSnapshot(BrandHaus.identity.getState(), snapshot.identity));
    if (snapshot[mode]) BrandHaus[mode].setState(deepMergeSnapshot(BrandHaus[mode].getState(), snapshot[mode]));
  }

  function buildVaultTitle(mode) {
    var context = BrandHaus.engine.resolveFieldValue(BrandHaus.identity.getState().businessName);
    return context ? (MODE_LABELS[mode] || mode) + " — " + context : (MODE_LABELS[mode] || mode);
  }

  function buildFullVaultText() {
    var byMode = {};
    BrandHaus.favorites.getAllFlat().forEach(function (fav) {
      byMode[fav.mode] = byMode[fav.mode] || [];
      byMode[fav.mode].push(fav);
    });
    var sections = [];
    Object.keys(byMode).forEach(function (mode) {
      var label = (MODE_LABELS[mode] || mode).toUpperCase();
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
    var span = el("span", { class: "bh-icon" + (extraClass ? " " + extraClass : ""), "aria-hidden": "true" });
    span.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
    return span;
  }

  function infoIcon(text) {
    return el("details", { class: "bh-info" }, [
      el("summary", { class: "bh-info__icon", "aria-label": "More info" }, [el("span", { text: "i" })]),
      el("p", { class: "bh-info__body", text: text }),
    ]);
  }

  function labelWithIcon(iconName, text, forId, labelClass, helpText) {
    var attrs = { class: (labelClass || "bh-field__label") + " bh-label--icon" };
    if (forId) attrs.for = forId;
    var children = [icon(iconName), el("span", { text: text })];
    if (helpText) children.push(infoIcon(helpText));
    return el(forId ? "label" : "span", attrs, children);
  }

  function renderPillToggle(options) {
    function pillButton(opt) {
      var btn = el("button", { type: "button", class: "bh-pill-toggle__btn" + (opt.isActive ? " is-active" : "") }, [
        icon(opt.icon, "bh-pill-toggle__icon"),
        el("span", { class: "bh-pill-toggle__label", text: opt.title }),
      ]);
      btn.addEventListener("click", opt.onClick);
      return btn;
    }
    return el("div", { class: "bh-pill-toggle" }, options.map(pillButton));
  }

  function renderPresetRow(presets, onApply, labelText) {
    if (!presets || !presets.length) return null;
    var cards = presets.map(function (preset) {
      var card = el("button", { type: "button", class: "bh-preset-card" }, [
        el("span", { class: "bh-preset-card__name", text: preset.name }),
        el("span", { class: "bh-preset-card__description", text: preset.description }),
      ]);
      card.addEventListener("click", function () { onApply(preset); });
      return card;
    });
    return el("div", { class: "bh-preset-row" }, [
      el("p", { class: "bh-preset-row__label" }, [icon("sparkle"), el("span", { text: labelText || "Starter Presets — click one, then customize" })]),
      el("div", { class: "bh-preset-row__cards" }, cards),
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
    var select = el("select", { class: "bh-field__select" });
    appendSelectOptions(select, field, field.value);
    select.addEventListener("change", function () { onChange({ value: select.value }); });
    var selectId = "bh-field-" + select.getAttribute("data-bh-key");
    select.id = selectId;

    var customInput = el("input", { type: "text", class: "bh-field__custom", placeholder: "Or type your own..." });
    customInput.value = field.customValue || "";
    customInput.addEventListener("input", function () { onChange({ customValue: customInput.value }); });

    var checkbox = el("input", { type: "checkbox", class: "bh-field__checkbox" });
    checkbox.checked = field.includeInPrompt !== false && fieldHasValue(field);
    checkbox.addEventListener("change", function () { onChange({ includeInPrompt: checkbox.checked }); });

    var labelRow = el("div", { class: "bh-field__label-row" }, [
      el("label", { class: "bh-field__label", for: selectId, text: entry.label }),
      el("label", { class: "bh-field__include" }, [checkbox, el("span", { text: "Include in prompt" })]),
    ]);
    return el("div", { class: "bh-field" }, [labelRow, select, customInput]);
  }

  function renderFreeTextField(entry, onChange) {
    var input = el("textarea", { class: "bh-field__custom bh-field__freetext", placeholder: entry.placeholder || "Type here...", rows: "2" });
    input.value = entry.field.value || "";
    input.addEventListener("input", function () { onChange({ value: input.value }); });
    var inputId = "bh-field-" + input.getAttribute("data-bh-key");
    input.id = inputId;
    return el("div", { class: "bh-field" }, [
      el("div", { class: "bh-field__label-row" }, [el("label", { class: "bh-field__label", for: inputId, text: entry.label })]),
      input,
    ]);
  }

  function renderSubPanel(headerText, isChecked, onToggle, renderContent, tooltip) {
    var toggle = el("input", { type: "checkbox", class: "bh-subpanel__toggle" });
    toggle.checked = isChecked;
    toggle.addEventListener("change", function () { onToggle(toggle.checked); });
    var header = el("label", { class: "bh-subpanel__header" }, [toggle, el("span", { text: headerText })]);
    if (tooltip) header.title = tooltip;
    var panel = el("div", { class: "bh-subpanel" }, [header]);
    if (isChecked) panel.appendChild(renderContent());
    return panel;
  }

  // ---------------------------------------------------------------------
  // Generic "checklist with a cap" — Mockup Studio's Surrounding Props
  // (pick up to 5 from a list). Same disable-once-full pattern as Prompt
  // Haus's Collection Builder combine checklist.
  // ---------------------------------------------------------------------
  function renderCappedChecklist(options) {
    var wrap = el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(el("legend", { class: "bh-field-group__title" }, [icon(options.icon || "sparkle"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "bh-field-group__subtitle", text: options.subtitle }));
    var list = el("div", { class: "bh-checklist" });
    options.items.forEach(function (item) {
      var checkbox = el("input", { type: "checkbox", class: "bh-field__checkbox" });
      checkbox.checked = options.selected.indexOf(item) !== -1;
      checkbox.disabled = !checkbox.checked && options.selected.length >= options.cap;
      checkbox.addEventListener("change", function () {
        options.onToggle(item, checkbox.checked);
      });
      list.appendChild(el("label", { class: "bh-checklist__item" }, [checkbox, el("span", { text: item })]));
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
    var wrap = el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(el("legend", { class: "bh-field-group__title" }, [icon(options.icon || "heart"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "bh-field-group__subtitle", text: options.subtitle }));
    var fieldsWrap = el("div", { class: "bh-field-group__fields" });
    options.values.forEach(function (value, index) {
      var input = el("input", { type: "text", class: "bh-field__custom", placeholder: options.placeholder || "" });
      input.value = value || "";
      input.addEventListener("input", function () { options.onUpdate(index, input.value); });
      var removeBtn = el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      fieldsWrap.appendChild(el("div", { class: "bh-text-slot-row" }, [input, removeBtn]));
    });
    wrap.appendChild(fieldsWrap);
    if (options.values.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "bh-btn bh-btn--small bh-btn--add",
        text: "+ Add " + options.singular + " (" + (options.values.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "bh-companion__controls" }, [addBtn]));
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
    var wrap = el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(el("legend", { class: "bh-field-group__title" }, [icon("palette"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "bh-field-group__subtitle", text: options.subtitle }));
    var row = el("div", { class: "bh-color-row" });
    options.colors.forEach(function (hex, index) {
      var swatchInput = el("input", { type: "color" });
      swatchInput.value = HEX_PATTERN.test(hex) ? hex : "#6B6860";
      var hexInput = el("input", { type: "text", class: "bh-field__custom bh-color-hex", placeholder: "#000000" });
      hexInput.value = hex || "";
      swatchInput.addEventListener("input", function () {
        hexInput.value = swatchInput.value;
        options.onUpdate(index, swatchInput.value);
      });
      hexInput.addEventListener("input", function () {
        if (HEX_PATTERN.test(hexInput.value)) swatchInput.value = hexInput.value;
        options.onUpdate(index, hexInput.value);
      });
      var removeBtn = el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      row.appendChild(el("div", { class: "bh-color-swatch-item" }, [swatchInput, hexInput, removeBtn]));
    });
    wrap.appendChild(row);
    if (options.colors.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "bh-btn bh-btn--small bh-btn--add",
        text: "+ Add a color (" + (options.colors.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "bh-companion__controls" }, [addBtn]));
    }
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Font preview dropdown — each <option> rendered in its own typeface
  // via inline font-family, so you see what a font looks like before
  // picking it. Scoped to Branding Studio only, per instruction. Curated
  // Google Fonts (guaranteed to load for every visitor) plus standard
  // web-safe fonts, not the OS's full local font list — see
  // BrandHaus.FONT_OPTIONS in brand-haus-branding.js.
  // ---------------------------------------------------------------------
  function renderFontPreviewField(entry, onChange) {
    var select = el("select", { class: "bh-field__select bh-font-select" });
    select.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    (entry.field.options || []).forEach(function (opt) {
      var optionNode = el("option", { value: opt, style: "font-family: '" + opt + "', sans-serif;" });
      optionNode.textContent = opt;
      if (opt === entry.field.value) optionNode.selected = true;
      select.appendChild(optionNode);
    });
    select.addEventListener("change", function () { onChange({ value: select.value }); });
    var selectId = "bh-field-" + select.getAttribute("data-bh-key");
    select.id = selectId;

    var preview = el("p", {
      class: "bh-font-preview",
      style: entry.field.value ? "font-family: '" + entry.field.value + "', sans-serif;" : "",
      text: entry.field.value ? "The quick brown fox — " + entry.field.value : "Pick a font to preview it here.",
    });

    return el("div", { class: "bh-field" }, [
      el("div", { class: "bh-field__label-row" }, [el("label", { class: "bh-field__label", for: selectId, text: entry.label })]),
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
    var fieldsContainer = el("div", { class: "bh-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(renderFn(entry, function (changes) { onChange(entry, changes); }));
    });
    var titleIcon = TITLE_ICONS[title];
    var legend = titleIcon
      ? el("legend", { class: "bh-field-group__title" }, [icon(titleIcon), el("span", { text: title })])
      : el("legend", { class: "bh-field-group__title", text: title });
    var children = [legend];
    if (subtitle) children.push(el("p", { class: "bh-field-group__subtitle", text: subtitle }));
    children.push(fieldsContainer);
    return el("fieldset", { class: "bh-field-group" }, children);
  }

  function renderPlainFieldRow(entries, onChange) {
    var fieldsContainer = el("div", { class: "bh-field-group__fields" });
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

  function renderIdentityBar(root) {
    var state = BrandHaus.identity.getState();

    var nameInput = el("input", { type: "text", class: "bh-field__select", placeholder: "Your business name" });
    nameInput.value = state.businessName.value || "";
    nameInput.addEventListener("input", function () {
      BrandHaus.identity.setBusinessName(nameInput.value);
    });
    var nameId = "bh-field-" + nameInput.getAttribute("data-bh-key");
    nameInput.id = nameId;

    var negativeTextarea = el("textarea", { class: "bh-field__custom bh-field__freetext bh-styledna__negative-input", rows: "2", placeholder: 'e.g. "jargon, buzzwords, emojis"' });
    negativeTextarea.value = state.negativePrompt.value || "";
    negativeTextarea.addEventListener("input", function () {
      BrandHaus.identity.updateNegativePromptField({ value: negativeTextarea.value });
    });
    var negativeId = "bh-field-" + negativeTextarea.getAttribute("data-bh-key");
    negativeTextarea.id = negativeId;
    var chips = el("div", { class: "bh-styledna__negative-chips" });
    NEGATIVE_SUGGESTIONS.forEach(function (item) {
      var chip = el("button", { type: "button", class: "bh-styledna__negative-chip", text: item });
      chip.title = 'Add "' + item + '" to the list above.';
      chip.addEventListener("click", function () {
        var current = (negativeTextarea.value || "").trim();
        var next = current ? current + ", " + item : item;
        BrandHaus.identity.updateNegativePromptField({ value: next });
        renderApp();
      });
      chips.appendChild(chip);
    });

    var children = [
      el("div", { class: "bh-styledna__field" }, [labelWithIcon("shirt", "Business Name", nameId, null, "Set once here — carries into Branding Studio and Logo Studio automatically."), nameInput]),
      el("div", { class: "bh-styledna__field bh-styledna__field--full" }, [
        labelWithIcon("shield", "Negative Prompt — What to Avoid", negativeId),
        el("p", { class: "bh-styledna__negative-subtitle", text: "Applies to every studio, once, at the end of the prompt — comma-separated. Click a suggestion to add it." }),
        negativeTextarea,
        chips,
      ]),
    ];
    root.appendChild(el("div", { class: "bh-styledna" }, children));
  }

  // ---------------------------------------------------------------------
  // Quality nudge, preview actions, export row, preview
  // ---------------------------------------------------------------------
  var QUALITY_NUDGE_THRESHOLD = 15;
  function renderQualityNudge(assembled) {
    var count = (assembled.fragments || []).length;
    if (count <= QUALITY_NUDGE_THRESHOLD) return null;
    return el("div", { class: "bh-preview__nudge" }, [
      icon("warning", "bh-preview__nudge-icon"),
      el("span", { text: "Heads up: you've got " + count + " details selected — results tend to look cleaner with a more focused set (aim for 5-10)." }),
    ]);
  }

  function renderPreviewActions(formatted, onRandomize, onReset, onSave, mode) {
    var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--copy" }, [icon("copy"), el("span", { class: "bh-btn__label", text: "Copy My Prompt" })]);
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy My Prompt"; }, 1500);
      });
      BrandHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
      refreshRecentLogPanel();
    });

    var randomizeBtn = el("button", { type: "button", class: "bh-btn bh-btn--randomize" }, [icon("shuffle"), el("span", { text: "Randomize" })]);
    randomizeBtn.title = 'Picks a new random value for every field with "Include in prompt" checked, and clears any typed custom value for those fields.';
    randomizeBtn.addEventListener("click", onRandomize);

    var resetBtn = el("button", { type: "button", class: "bh-btn bh-btn--reset" }, [icon("refresh"), el("span", { text: "Reset" })]);
    resetBtn.title = "Clears every field back to Select.../None.";
    resetBtn.addEventListener("click", onReset);

    var isFull = BrandHaus.favorites.isFull(mode);
    var saveBtn = el("button", { type: "button", class: "bh-btn bh-btn--save" }, [icon("vault"), el("span", { text: "Save to Vault" })]);
    saveBtn.disabled = isFull;
    saveBtn.title = isFull
      ? "You have " + BrandHaus.favorites.MAX_PER_MODE + "/" + BrandHaus.favorites.MAX_PER_MODE + " saved here — delete one below to save another."
      : "Saves this exact prompt text below (up to " + BrandHaus.favorites.MAX_PER_MODE + " per studio).";
    saveBtn.addEventListener("click", function () {
      onSave();
      BrandHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
    });

    var actionsGrid = el("div", { class: "bh-preview__actions" }, [randomizeBtn, copyBtn, saveBtn, resetBtn]);
    var exportRow = renderExportRow(formatted, mode);
    return el("div", {}, [actionsGrid, exportRow]);
  }

  function renderExportRow(formatted, mode) {
    var shareBtn = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("share"), el("span", { class: "bh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows this exact prompt to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(formatted), function (ok) {
        var label = shareBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn2 = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("copy"), el("span", { class: "bh-btn__label", text: "Copy" })]);
    copyBtn2.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn2.querySelector(".bh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads this prompt as a .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(formatted, "brand-haus-" + mode + "-prompt.txt"); });
    var printBtn = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of this prompt.";
    printBtn.addEventListener("click", function () { printPromptText(formatted); });
    return el("div", { class: "bh-preview__export-row" }, [shareBtn, copyBtn2, downloadBtn, printBtn]);
  }

  var saveFeedback = null;

  function renderPreview(root, assembled, modeApi, mode) {
    var formatted = BrandHaus.engine.formatForPlatform(assembled, BrandHaus.identity.getState().negativePrompt.value);
    var textarea = el("textarea", { class: "bh-preview__text", readonly: "readonly" });
    textarea.value = formatted;

    var actions = renderPreviewActions(
      formatted,
      function () { modeApi.randomize(); renderApp(); },
      function () { modeApi.reset(); renderApp(); },
      function () {
        var result = BrandHaus.favorites.save(mode, {
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
      el("h3", { class: "bh-preview__title" }, [icon("lightning"), el("span", { text: "Your Prompt, Built Live" })]),
      el("p", { class: "bh-preview__subtitle", text: "Watch your creative direction turn into a ready-to-use AI prompt." }),
    ];
    var qualityNudge = renderQualityNudge(assembled);
    if (qualityNudge) previewChildren.push(qualityNudge);
    previewChildren.push(textarea, actions);
    if (saveFeedback) {
      previewChildren.push(el("p", { class: "bh-preview__save-feedback" + (saveFeedback.isError ? " is-error" : " is-success"), text: saveFeedback.text }));
    }
    root.appendChild(el("div", { class: "bh-preview" }, previewChildren));
  }

  // ---------------------------------------------------------------------
  // Your Vault
  // ---------------------------------------------------------------------
  var vaultExpanded = false;
  var renamingVaultId = null;

  function renderSavedPrompts(root, mode) {
    var saved = BrandHaus.favorites.getAll(mode).slice().reverse();
    var max = BrandHaus.favorites.MAX_PER_MODE;
    var list = el("div", { class: "bh-saved__list" });
    if (!saved.length) {
      list.appendChild(el("p", { class: "bh-saved__empty", text: "Your vault is empty — use \"Save to Vault\" above." }));
    } else {
      var visible = vaultExpanded ? saved : saved.slice(0, 1);
      visible.forEach(function (fav, index) {
        var currentVersion = BrandHaus.favorites.getCurrentVersion(fav);
        var versionCount = BrandHaus.favorites.getVersionCount(fav);
        var preview = currentVersion.text.length > 160 ? currentVersion.text.slice(0, 160) + "…" : currentVersion.text;

        var titleRow;
        if (renamingVaultId === fav.id) {
          var titleInput = el("input", { type: "text", class: "bh-saved__item-title-input", value: fav.title || "" });
          var confirmRename = function () {
            BrandHaus.favorites.rename(mode, fav.id, titleInput.value.trim() || ("Untitled " + (index + 1)));
            renamingVaultId = null;
            renderApp();
          };
          titleInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") confirmRename();
            if (e.key === "Escape") { renamingVaultId = null; renderApp(); }
          });
          titleInput.addEventListener("blur", confirmRename);
          titleRow = el("div", { class: "bh-saved__item-title-row" }, [titleInput]);
        } else {
          var renameBtn = el("button", { type: "button", class: "bh-saved__rename-btn", "aria-label": "Rename this saved prompt", title: "Rename" }, [icon("edit")]);
          renameBtn.addEventListener("click", function () { renamingVaultId = fav.id; renderApp(); });
          titleRow = el("div", { class: "bh-saved__item-title-row" }, [
            el("p", { class: "bh-saved__item-title", text: fav.title || "Untitled " + (index + 1) }),
            renameBtn,
          ]);
        }

        var loadBtn = null;
        if (currentVersion.snapshot) {
          loadBtn = el("button", { type: "button", class: "bh-btn bh-btn--load bh-btn--small", text: "Load" });
          loadBtn.title = "Restores every field in the builder to exactly how it was when this version was saved.";
          loadBtn.addEventListener("click", function () { loadVaultSnapshot(mode, currentVersion.snapshot); renderApp(); });
        }

        var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--copy bh-btn--small", text: "Copy" });
        copyBtn.addEventListener("click", function () {
          copyTextToClipboard(currentVersion.text, function (ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
          });
        });

        var saveVersionBtn = el("button", { type: "button", class: "bh-btn bh-btn--small", text: "Save as New Version" });
        saveVersionBtn.title = "Adds the prompt you're currently building as a new version of this item — doesn't use up another Vault slot.";
        saveVersionBtn.addEventListener("click", function () {
          var textarea = document.querySelector(".bh-preview__text");
          if (!textarea || !textarea.value) return;
          BrandHaus.favorites.addVersion(mode, fav.id, { text: textarea.value, snapshot: buildVaultSnapshot(mode) });
          renderApp();
        });

        var deleteBtn = el("button", { type: "button", class: "bh-btn bh-btn--delete bh-btn--small", text: "Delete" });
        deleteBtn.title = versionCount > 1 ? "Deletes this item and all " + versionCount + " of its versions." : "Deletes this item.";
        deleteBtn.addEventListener("click", function () { BrandHaus.favorites.remove(mode, fav.id); renderApp(); });

        var actionBtns = [];
        if (loadBtn) actionBtns.push(loadBtn);
        actionBtns.push(copyBtn, saveVersionBtn, deleteBtn);

        var itemChildren = [titleRow];
        if (versionCount > 1) {
          var versionSelect = el("select", { class: "bh-saved__version-select" });
          fav.versions.forEach(function (v, vi) {
            var isLatest = vi === fav.versions.length - 1;
            var optionNode = el("option", { value: String(vi) }, [document.createTextNode("Version " + (vi + 1) + (isLatest ? " (latest)" : ""))]);
            var activeIdx = typeof fav.activeVersionIndex === "number" ? fav.activeVersionIndex : fav.versions.length - 1;
            if (vi === activeIdx) optionNode.selected = true;
            versionSelect.appendChild(optionNode);
          });
          versionSelect.title = "Switch which saved version of this item you're viewing.";
          versionSelect.addEventListener("change", function () {
            BrandHaus.favorites.setActiveVersion(mode, fav.id, parseInt(versionSelect.value, 10));
            renderApp();
          });
          itemChildren.push(el("div", { class: "bh-saved__version-row" }, [icon("layers"), versionSelect]));
        }
        itemChildren.push(
          el("p", { class: "bh-saved__item-text", text: preview }),
          el("div", { class: "bh-saved__item-meta" }, [
            el("span", { class: "bh-saved__item-tag", text: new Date(currentVersion.createdAt).toLocaleDateString() }),
            el("div", { class: "bh-saved__item-actions" }, actionBtns),
          ])
        );
        list.appendChild(el("div", { class: "bh-saved__item" }, itemChildren));
      });
    }

    var headerChildren = [el("h3", { class: "bh-saved__title" }, [icon("vault"), el("span", { text: "Your Vault (" + saved.length + "/" + max + ")" })])];
    if (saved.length > 1) {
      var vaultToggleBtn = el("button", { type: "button", class: "bh-faq__toggle" }, [
        icon(vaultExpanded ? "eyeOff" : "eye"),
        el("span", { text: vaultExpanded ? "Hide" : "Show full list" }),
      ]);
      vaultToggleBtn.addEventListener("click", function () { vaultExpanded = !vaultExpanded; renderApp(); });
      headerChildren.push(vaultToggleBtn);
    }
    root.appendChild(el("div", { class: "bh-saved" }, [el("div", { class: "bh-faq__header" }, headerChildren), renderFullVaultExportRow(), list]));
  }

  // ---------------------------------------------------------------------
  // Recently Generated
  // ---------------------------------------------------------------------
  var recentLogExpanded = false;

  function refreshRecentLogPanel() {
    var existing = document.querySelector(".bh-recent");
    if (!existing) return;
    var captured = null;
    renderRecentLog({ appendChild: function (node) { captured = node; } });
    if (captured) existing.replaceWith(captured);
  }

  function renderRecentLogItem(entry) {
    var preview = entry.text.length > 160 ? entry.text.slice(0, 160) + "…" : entry.text;
    var loadBtn = null;
    if (entry.snapshot) {
      loadBtn = el("button", { type: "button", class: "bh-btn bh-btn--load bh-btn--small", text: "Load" });
      loadBtn.title = "Restores every field in the builder to exactly how it was when this was generated.";
      loadBtn.addEventListener("click", function () {
        loadVaultSnapshot(entry.mode, entry.snapshot);
        activeMode = entry.mode;
        renderApp();
      });
    }
    var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--copy bh-btn--small", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(entry.text, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });
    var deleteBtn = el("button", { type: "button", class: "bh-btn bh-btn--delete bh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { BrandHaus.favorites.removeRecent(entry.id); renderApp(); });

    var metaParts = [MODE_LABELS[entry.mode] || entry.mode, new Date(entry.loggedAt).toLocaleString()];
    var actionBtns = [];
    if (loadBtn) actionBtns.push(loadBtn);
    actionBtns.push(copyBtn, deleteBtn);
    return el("div", { class: "bh-saved__item" }, [
      el("p", { class: "bh-saved__item-text", text: preview }),
      el("div", { class: "bh-saved__item-meta" }, [
        el("span", { class: "bh-saved__item-tag", text: metaParts.join(" · ") }),
        el("div", { class: "bh-saved__item-actions" }, actionBtns),
      ]),
    ]);
  }

  function renderRecentLog(root) {
    var recent = BrandHaus.favorites.getRecentLog();
    var list = el("div", { class: "bh-saved__list" });
    if (!recent.length) {
      list.appendChild(el("p", { class: "bh-saved__empty", text: "Nothing generated yet — this fills in automatically as you Copy or Save prompts." }));
    } else {
      var visible = recentLogExpanded ? recent : recent.slice(0, 1);
      visible.forEach(function (entry) { list.appendChild(renderRecentLogItem(entry)); });
    }
    var headerChildren = [el("h3", { class: "bh-saved__title" }, [icon("refresh"), el("span", { text: "Recently Generated (" + recent.length + "/" + BrandHaus.favorites.RECENT_LOG_MAX + ")" })])];
    if (recent.length > 1) {
      var toggleBtn = el("button", { type: "button", class: "bh-faq__toggle" }, [
        icon(recentLogExpanded ? "eyeOff" : "eye"),
        el("span", { text: recentLogExpanded ? "Hide" : "Show all" }),
      ]);
      toggleBtn.addEventListener("click", function () { recentLogExpanded = !recentLogExpanded; renderApp(); });
      headerChildren.push(toggleBtn);
    }
    var children = [el("div", { class: "bh-faq__header" }, headerChildren)];
    if (recent.length) {
      var clearBtn = el("button", { type: "button", class: "bh-btn bh-btn--delete bh-btn--small", text: "Clear All" });
      clearBtn.title = "Clears this automatic log — doesn't touch anything in Your Vault.";
      clearBtn.addEventListener("click", function () { BrandHaus.favorites.clearRecentLog(); renderApp(); });
      children.push(el("div", { class: "bh-recent__clear-row" }, [clearBtn]));
    }
    children.push(
      el("p", { class: "bh-field-group__subtitle", text: "Auto-saved on Copy/Save, most recent first — Load restores every field, same as Your Vault." }),
      list
    );
    root.appendChild(el("div", { class: "bh-saved bh-recent" }, children));
  }

  function renderFullVaultExportRow() {
    var all = BrandHaus.favorites.getAllFlat();
    if (!all.length) return el("div", {});
    var fullText = buildFullVaultText();
    var shareBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("share"), el("span", { class: "bh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows your entire saved vault to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(fullText), function (ok) {
        var label = shareBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("copy"), el("span", { class: "bh-btn__label", text: "Copy" })]);
    copyBtn.title = "Copies every saved prompt across every studio as one block of text.";
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(fullText, function (ok) {
        var label = copyBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads every saved prompt across every studio as one .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(fullText, "brand-haus-full-vault.txt"); });
    var printBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of your entire saved vault.";
    printBtn.addEventListener("click", function () { printPromptText(fullText); });
    return el("div", { class: "bh-saved__vault-export" }, [shareBtn, copyBtn, downloadBtn, printBtn]);
  }

  // ---------------------------------------------------------------------
  // Your Selections — simplified from Prompt Haus's own Creative Brief:
  // just the toggleable full list of resolved fields, no per-mode
  // headline-facts row (that needs bespoke copy per studio, deferred).
  // ---------------------------------------------------------------------
  var selectionsExpanded = false;

  function renderSelectionsPanel(root, mode, groups) {
    var totalItemCount = groups.reduce(function (sum, g) { return sum + g.items.length; }, 0);
    var eyeBtn = el("button", { type: "button", class: "bh-selections__eye-btn" }, [
      icon(selectionsExpanded ? "eyeOff" : "eye"),
      el("span", { text: selectionsExpanded ? "Hide full list" : "Show full list (" + totalItemCount + ")" }),
    ]);
    eyeBtn.addEventListener("click", function () { selectionsExpanded = !selectionsExpanded; renderApp(); });

    var children = [
      el("div", { class: "bh-selections__header" }, [
        el("h3", { class: "bh-selections__title" }, [icon("document"), el("span", { text: "Your Selections" })]),
        eyeBtn,
      ]),
    ];
    if (selectionsExpanded) {
      var body;
      if (!groups.length) {
        body = el("p", { class: "bh-selections__empty", text: "Nothing selected yet — choices you make above will appear here." });
      } else {
        body = el("div", { class: "bh-selections__scroll" });
        groups.forEach(function (group, idx) {
          if (idx > 0) body.appendChild(el("hr", { class: "bh-selections__divider" }));
          body.appendChild(el("h4", { class: "bh-selections__group-title", text: group.title }));
          group.items.forEach(function (item) {
            body.appendChild(el("div", { class: "bh-selections__item" }, [
              el("span", { class: "bh-selections__item-label", text: item.label + ":" }),
              el("span", { class: "bh-selections__item-value", text: " " + item.value }),
            ]));
          });
        });
      }
      children.push(el("hr", { class: "bh-selections__divider" }), body);
    }
    root.appendChild(el("div", { class: "bh-selections" }, children));
  }

  // ---------------------------------------------------------------------
  // Tabs + shell
  // ---------------------------------------------------------------------
  var MODES = ["founderInterview", "branding", "logo"];
  var MODE_LABELS = {
    founderInterview: "Brand DNA Assessment",
    branding: "Branding Studio",
    logo: "Logo Studio",
  };
  var MODE_ICONS = {
    founderInterview: "bulb",
    branding: "palette",
    logo: "logoMark",
  };
  var BUILT_MODES = {
    founderInterview: true,
    branding: true,
    logo: true,
  };

  var activeMode = "founderInterview";

  function renderTabs(root) {
    var row = el("div", { class: "bh-tabs" });
    MODES.forEach(function (mode) {
      var isBuilt = BUILT_MODES[mode];
      var btn = el("button", {
        type: "button",
        class: "bh-tabs__btn" + (mode === activeMode ? " is-active" : "") + (!isBuilt ? " is-disabled" : ""),
      }, [icon(MODE_ICONS[mode]), el("span", { text: MODE_LABELS[mode] + (!isBuilt ? " (coming soon)" : "") })]);
      if (isBuilt) {
        btn.addEventListener("click", function () { activeMode = mode; renderApp(); });
      } else {
        btn.disabled = true;
      }
      row.appendChild(el("span", { class: "bh-tabs__item" }, [btn]));
    });
    root.appendChild(el("div", { class: "bh-tabs-box" }, [row]));
  }

  function renderApp() {
    var root = document.getElementById("brand-haus-app");
    if (!root) return;

    var scrollX = window.scrollX;
    var scrollY = window.scrollY;
    var previewHeights = Array.prototype.map.call(root.querySelectorAll(".bh-preview__text"), function (t) {
      return t.style.height || "";
    });
    var active = document.activeElement;
    var focusRestore = null;
    if (active && root.contains(active) && active.hasAttribute("data-bh-key")) {
      focusRestore = {
        key: active.getAttribute("data-bh-key"),
        selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
        selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
      };
    }

    try {
      renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights);
    } catch (e) {
      root.innerHTML = "";
      root.appendChild(el("div", { class: "bh-render-error" }, [
        el("p", { text: "Something went wrong displaying the builder — this can happen when loading a prompt saved under an older version of the tool." }),
        el("p", { text: "Reload the page to get back to a working state. If it happened right after clicking Load on a saved prompt, that item may need to be deleted from Your Vault or Recently Generated and recreated." }),
      ]));
      if (window.console && window.console.error) window.console.error("Brand Haus render error:", e);
    }
  }

  function renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights) {
    mhKeyCounter = 0;
    root.innerHTML = "";

    var shell = el("div", { class: "bh-shell" });
    shell.appendChild(el("p", { class: "bh-mode-select-label", text: "Select the Studio" }));
    renderTabs(shell);
    renderIdentityBar(shell);

    var body = el("div", { class: "bh-body" });
    var left = el("div", { class: "bh-body__fields" });
    var right = el("div", { class: "bh-body__preview" });

    var modeApi = BrandHaus[activeMode];
    var isFullWidthMode = activeMode === "founderInterview" && modeApi && typeof modeApi.renderFull === "function";

    if (isFullWidthMode) {
      var fullWidthWrap = el("div", { style: "grid-column: 1 / -1;" }, [modeApi.renderFull()]);
      body.appendChild(fullWidthWrap);
    } else if (modeApi && typeof modeApi.renderPanel === "function") {
      left.appendChild(modeApi.renderPanel());
      renderSelectionsPanel(right, activeMode, modeApi.getSelectionsByGroup());
      renderPreview(right, modeApi.assemblePrompt(), modeApi, activeMode);
      renderSavedPrompts(right, activeMode);
      renderRecentLog(right);
      body.appendChild(left);
      body.appendChild(right);
    } else {
      left.appendChild(el("p", { class: "bh-coming-soon", text: (MODE_LABELS[activeMode] || activeMode) + " is coming soon." }));
      body.appendChild(left);
      body.appendChild(right);
    }
    shell.appendChild(body);
    root.appendChild(shell);

    if (focusRestore) {
      var restored = root.querySelector('[data-bh-key="' + focusRestore.key + '"]');
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
      var newTextareas = root.querySelectorAll(".bh-preview__text");
      previewHeights.forEach(function (height, i) {
        if (height && newTextareas[i]) newTextareas[i].style.height = height;
      });
    }
    window.scrollTo(scrollX, scrollY);
  }

  BrandHaus.ui = {
    el: el,
    icon: icon,
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
  };

  document.addEventListener("click", function (e) {
    document.querySelectorAll(".bh-info[open]").forEach(function (details) {
      if (!details.contains(e.target)) details.open = false;
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    BrandHaus.ui.renderApp();
  });
})();
