/**
 * The AI Creator's Graphics Haus — UI
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-favorites.js, graphics-haus-styledna.js. Loads BEFORE
 * the generator definition files in the section/dev-harness script
 * order, but its own generic render helpers (exposed on
 * GraphicsHaus.ui) are only ever CALLED from inside
 * GraphicsHaus.generators.renderPanel() — which doesn't run until a
 * user actually interacts with the grid, long after every script has
 * finished loading — so the load-order works fine even though the
 * generator files come before this one.
 *
 * Unlike Product Haus (broad studios like Invitations/Devotional
 * alongside Quick Generators, picked via a tab bar), Graphics Haus is
 * generator-grid-first with no broad studios and no tabs at all —
 * GraphicsHaus.generators IS the entire app, so this file skips the
 * MODES/tabs concept entirely rather than seeding it with one lonely
 * entry. If a broad mode is ever added later, that concept can come
 * back then — no need to carry unused flexibility for it now.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var ghKeyCounter = 0;
  var FOCUSABLE_TAGS = { input: true, select: true, textarea: true };

  // Tab bar's single source of truth for "what's showing" — a generator
  // id, or one of "combined"/"reference"/"collection". Defaulted to the
  // first registered generator the first time renderAppContent runs.
  var activeMode = null;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (FOCUSABLE_TAGS[tag]) {
      node.setAttribute("data-gh-key", String(ghKeyCounter++));
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
      "<html><head><title>Your Graphics Prompt — The AI Creator's Graphics Haus</title><style>" +
        "body{font-family:Georgia,serif;padding:48px;color:#1A1815;line-height:1.6;max-width:600px;margin:0 auto;}" +
        "h1{font-size:16px;letter-spacing:0.05em;text-transform:uppercase;color:#5B3C8C;margin-bottom:28px;}" +
        "p{font-size:15px;white-space:pre-wrap;}" +
        "</style></head><body>" +
        "<h1>Black Sheep Creations &amp; Inspirations — The AI Creator's Graphics Haus</h1>" +
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
    return base + "?gh_shared_prompt=" + encoded;
  }

  // ---------------------------------------------------------------------
  // Vault snapshot save/restore — same crash-safety pattern as Product
  // Haus (deep-merge onto current defaults, never wholesale-replace).
  // A vault key is either "gen:<generatorId>" (a Quick Generator) or a
  // plain mode name ("combined"/"reference"/"collection") — the latter
  // group each expose getState()/setState() directly on GraphicsHaus[mode]
  // the same way GraphicsHaus.styleDNA does, so no generator-store lookup
  // is needed for them.
  // ---------------------------------------------------------------------
  function getModeStore(mode) {
    if (mode.indexOf("gen:") === 0) return GraphicsHaus.generators.getGeneratorStore(mode.slice(4));
    return GraphicsHaus[mode];
  }

  function buildVaultSnapshot(mode) {
    var snapshot = { styleDNA: JSON.parse(JSON.stringify(GraphicsHaus.styleDNA.getState())) };
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
      result[key] = deepMergeSnapshot(current[key], saved[key]);
    });
    return result;
  }

  function loadVaultSnapshot(mode, snapshot) {
    if (!snapshot) return;
    if (snapshot.styleDNA) GraphicsHaus.styleDNA.setState(deepMergeSnapshot(GraphicsHaus.styleDNA.getState(), snapshot.styleDNA));
    var store = getModeStore(mode);
    if (snapshot[mode] && store) store.setState(deepMergeSnapshot(store.getState(), snapshot[mode]));
  }

  var SPECIAL_MODE_LABELS = { combined: "Combined", reference: "Image/Prompt Reference", collection: "Collection Builder" };

  function modeLabel(mode) {
    if (mode.indexOf("gen:") === 0) return GraphicsHaus.generators.getGeneratorLabel(mode.slice(4));
    return SPECIAL_MODE_LABELS[mode] || mode;
  }

  function buildVaultTitle(mode) {
    var styleDNA = GraphicsHaus.styleDNA.getState();
    var context =
      GraphicsHaus.engine.resolveFieldValue(styleDNA.niche) ||
      GraphicsHaus.engine.resolveFieldValue(styleDNA.theme) ||
      GraphicsHaus.engine.resolveFieldValue(styleDNA.holiday) ||
      GraphicsHaus.engine.resolveFieldValue(styleDNA.businessName);
    return context ? modeLabel(mode) + " — " + context : modeLabel(mode);
  }

  function buildFullVaultText() {
    var byMode = {};
    GraphicsHaus.favorites.getAllFlat().forEach(function (fav) {
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
  // Icon system — same hand-rolled inline SVG approach as Product Haus,
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
    var span = el("span", { class: "gh-icon" + (extraClass ? " " + extraClass : ""), "aria-hidden": "true" });
    span.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
    return span;
  }

  function infoIcon(text) {
    return el("details", { class: "gh-info" }, [
      el("summary", { class: "gh-info__icon", "aria-label": "More info" }, [el("span", { text: "i" })]),
      el("p", { class: "gh-info__body", text: text }),
    ]);
  }

  function labelWithIcon(iconName, text, forId, labelClass, helpText) {
    var attrs = { class: (labelClass || "gh-field__label") + " gh-label--icon" };
    if (forId) attrs.for = forId;
    var children = [icon(iconName), el("span", { text: text })];
    if (helpText) children.push(infoIcon(helpText));
    return el(forId ? "label" : "span", attrs, children);
  }

  function renderPillToggle(options) {
    function pillButton(opt) {
      var btn = el("button", { type: "button", class: "gh-pill-toggle__btn" + (opt.isActive ? " is-active" : "") }, [
        icon(opt.icon, "gh-pill-toggle__icon"),
        el("span", { class: "gh-pill-toggle__label", text: opt.title }),
      ]);
      btn.addEventListener("click", opt.onClick);
      return btn;
    }
    return el("div", { class: "gh-pill-toggle" }, options.map(pillButton));
  }

  // Shared Yes/No pill toggle — used by Image Buffer/Padding (Style DNA
  // bar), matching Content Haus's own yesNoButton exactly.
  function yesNoButton(label, isActive, onClick) {
    var btn = el("button", {
      type: "button",
      class: "gh-styledna__yesno-btn" + (isActive ? " is-active" : ""),
      "aria-pressed": isActive ? "true" : "false",
      text: label,
    });
    btn.addEventListener("click", onClick);
    return btn;
  }

  // Two big card-style options side by side (e.g. Image/Prompt Reference's
  // "Reference an Image" vs "Reference a Prompt" source-type toggle) —
  // heavier-weight than renderPillToggle, reusing the same
  // .gh-basetype-toggle CSS this file already ships (ported alongside
  // everything else but, until now, never wired to real markup).
  function renderTwoOptionToggle(options) {
    var buttons = options.map(function (opt) {
      var btn = el("button", { type: "button", class: "gh-basetype-toggle__btn" + (opt.isActive ? " is-active" : "") }, [
        icon(opt.icon, "gh-basetype-toggle__icon"),
        el("span", { class: "gh-basetype-toggle__text" }, [
          el("span", { class: "gh-basetype-toggle__title", text: opt.title }),
          el("span", { class: "gh-basetype-toggle__subtitle", text: opt.subtitle || "" }),
        ]),
      ]);
      btn.addEventListener("click", opt.onClick);
      return btn;
    });
    return el("div", { class: "gh-basetype-toggle" }, buttons);
  }

  function renderPresetRow(presets, onApply, labelText) {
    if (!presets || !presets.length) return null;
    var cards = presets.map(function (preset) {
      var card = el("button", { type: "button", class: "gh-preset-card" }, [
        el("span", { class: "gh-preset-card__name", text: preset.name }),
        el("span", { class: "gh-preset-card__description", text: preset.description }),
      ]);
      card.addEventListener("click", function () { onApply(preset); });
      return card;
    });
    return el("div", { class: "gh-preset-row" }, [
      el("p", { class: "gh-preset-row__label" }, [icon("sparkle"), el("span", { text: labelText || "Starter Presets — click one, then customize" })]),
      el("div", { class: "gh-preset-row__cards" }, cards),
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
    var select = el("select", { class: "gh-field__select" });
    appendSelectOptions(select, field, field.value);
    select.addEventListener("change", function () { onChange({ value: select.value, customValue: "" }); });
    var selectId = "gh-field-" + select.getAttribute("data-gh-key");
    select.id = selectId;

    var customInput = el("input", { type: "text", class: "gh-field__custom", placeholder: "Or type your own..." });
    customInput.value = field.customValue || "";
    customInput.addEventListener("input", function () { onChange({ customValue: customInput.value }); });

    var checkbox = el("input", { type: "checkbox", class: "gh-field__checkbox" });
    checkbox.checked = field.includeInPrompt !== false && fieldHasValue(field);
    checkbox.addEventListener("change", function () { onChange({ includeInPrompt: checkbox.checked }); });

    var labelRow = el("div", { class: "gh-field__label-row" }, [
      el("label", { class: "gh-field__label", for: selectId, text: entry.label }),
      el("label", { class: "gh-field__include" }, [checkbox, el("span", { text: "Include in prompt" })]),
    ]);
    return el("div", { class: "gh-field" }, [labelRow, select, customInput]);
  }

  function renderFreeTextField(entry, onChange) {
    var input = el("textarea", { class: "gh-field__custom gh-field__freetext", placeholder: entry.placeholder || "Type here...", rows: "2" });
    input.value = entry.field.value || "";
    input.addEventListener("input", function () { onChange({ value: input.value }); });
    var inputId = "gh-field-" + input.getAttribute("data-gh-key");
    input.id = inputId;
    return el("div", { class: "gh-field" }, [
      el("div", { class: "gh-field__label-row" }, [el("label", { class: "gh-field__label", for: inputId, text: entry.label })]),
      input,
    ]);
  }

  function renderSubPanel(headerText, isChecked, onToggle, renderContent, tooltip) {
    var toggle = el("input", { type: "checkbox", class: "gh-subpanel__toggle" });
    toggle.checked = isChecked;
    toggle.addEventListener("change", function () { onToggle(toggle.checked); });
    var header = el("label", { class: "gh-subpanel__header" }, [toggle, el("span", { text: headerText })]);
    if (tooltip) header.title = tooltip;
    var panel = el("div", { class: "gh-subpanel" }, [header]);
    if (isChecked) panel.appendChild(renderContent());
    return panel;
  }

  // ---------------------------------------------------------------------
  // Generic "checklist with a cap"
  // ---------------------------------------------------------------------
  function renderCappedChecklist(options) {
    var wrap = el("fieldset", { class: "gh-field-group" });
    wrap.appendChild(el("legend", { class: "gh-field-group__title" }, [icon(options.icon || "sparkle"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "gh-field-group__subtitle", text: options.subtitle }));
    var list = el("div", { class: "gh-checklist" });
    options.items.forEach(function (item) {
      var checkbox = el("input", { type: "checkbox", class: "gh-field__checkbox" });
      checkbox.checked = options.selected.indexOf(item) !== -1;
      checkbox.disabled = !checkbox.checked && options.selected.length >= options.cap;
      checkbox.addEventListener("change", function () {
        options.onToggle(item, checkbox.checked);
      });
      list.appendChild(el("label", { class: "gh-checklist__item" }, [checkbox, el("span", { text: item })]));
    });
    wrap.appendChild(list);
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Generic progressive text-slot list
  // ---------------------------------------------------------------------
  function renderTextSlotList(options) {
    var wrap = el("fieldset", { class: "gh-field-group" });
    wrap.appendChild(el("legend", { class: "gh-field-group__title" }, [icon(options.icon || "heart"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "gh-field-group__subtitle", text: options.subtitle }));
    var fieldsWrap = el("div", { class: "gh-field-group__fields" });
    options.values.forEach(function (value, index) {
      var input = el("input", { type: "text", class: "gh-field__custom", placeholder: options.placeholder || "" });
      input.value = value || "";
      input.addEventListener("input", function () { options.onUpdate(index, input.value); });
      var removeBtn = el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      fieldsWrap.appendChild(el("div", { class: "gh-text-slot-row" }, [input, removeBtn]));
    });
    wrap.appendChild(fieldsWrap);
    if (options.values.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "gh-btn gh-btn--small gh-btn--add",
        text: "+ Add " + options.singular + " (" + (options.values.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "gh-companion__controls" }, [addBtn]));
    }
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Color picker — native input[type=color] plus an editable hex text
  // field kept in sync both ways, and a Remove button. Up to `max`.
  // ---------------------------------------------------------------------
  var HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  function renderColorPickerList(options) {
    var wrap = el("fieldset", { class: "gh-field-group" });
    wrap.appendChild(el("legend", { class: "gh-field-group__title" }, [icon("palette"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "gh-field-group__subtitle", text: options.subtitle }));
    var row = el("div", { class: "gh-color-row" });
    options.colors.forEach(function (hex, index) {
      var swatchInput = el("input", { type: "color" });
      swatchInput.value = HEX_PATTERN.test(hex) ? hex : "#6B6860";
      var hexInput = el("input", { type: "text", class: "gh-field__custom gh-color-hex", placeholder: "#000000" });
      hexInput.value = hex || "";
      swatchInput.addEventListener("input", function () {
        hexInput.value = swatchInput.value;
        options.onUpdate(index, swatchInput.value);
      });
      hexInput.addEventListener("input", function () {
        if (HEX_PATTERN.test(hexInput.value)) swatchInput.value = hexInput.value;
        options.onUpdate(index, hexInput.value);
      });
      var changeBtn = el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--reset", text: "Change" });
      changeBtn.addEventListener("click", function () { swatchInput.click(); });
      var removeBtn = el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      row.appendChild(el("div", { class: "gh-color-swatch-item" }, [swatchInput, hexInput, changeBtn, removeBtn]));
    });
    wrap.appendChild(row);
    if (options.colors.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "gh-btn gh-btn--small gh-btn--add",
        text: "+ Add a color (" + (options.colors.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "gh-companion__controls" }, [addBtn]));
    }
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Font preview dropdown — each <option> rendered in its own typeface.
  // ---------------------------------------------------------------------
  function renderFontPreviewField(entry, onChange) {
    var select = el("select", { class: "gh-field__select gh-font-select" });
    select.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    (entry.field.options || []).forEach(function (opt) {
      var optionNode = el("option", { value: opt, style: "font-family: '" + opt + "', sans-serif;" });
      optionNode.textContent = opt;
      if (opt === entry.field.value) optionNode.selected = true;
      select.appendChild(optionNode);
    });
    select.addEventListener("change", function () { onChange({ value: select.value }); });
    var selectId = "gh-field-" + select.getAttribute("data-gh-key");
    select.id = selectId;

    var preview = el("p", {
      class: "gh-font-preview",
      style: entry.field.value ? "font-family: '" + entry.field.value + "', sans-serif;" : "",
      text: entry.field.value ? "The quick brown fox — " + entry.field.value : "Pick a font to preview it here.",
    });

    return el("div", { class: "gh-field" }, [
      el("div", { class: "gh-field__label-row" }, [el("label", { class: "gh-field__label", for: selectId, text: entry.label })]),
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
    var fieldsContainer = el("div", { class: "gh-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(renderFn(entry, function (changes) { onChange(entry, changes); }));
    });
    var titleIcon = TITLE_ICONS[title];
    var legend = titleIcon
      ? el("legend", { class: "gh-field-group__title" }, [icon(titleIcon), el("span", { text: title })])
      : el("legend", { class: "gh-field-group__title", text: title });
    var children = [legend];
    if (subtitle) children.push(el("p", { class: "gh-field-group__subtitle", text: subtitle }));
    children.push(fieldsContainer);
    return el("fieldset", { class: "gh-field-group" }, children);
  }

  function renderPlainFieldRow(entries, onChange) {
    var fieldsContainer = el("div", { class: "gh-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(renderFn(entry, function (changes) { onChange(entry, changes); }));
    });
    return fieldsContainer;
  }

  // ---------------------------------------------------------------------
  // Business/Voice DNA bar — Tone/Audience/Reading Level are deliberately
  // never included here (unlike Product Haus's version of this function):
  // every mode in Graphics Haus is a narrow generator with its own small
  // curated field set, and those three only ever made sense for broad
  // modes shaping general wording/voice, which don't exist here at all.
  // ---------------------------------------------------------------------
  var NEGATIVE_SUGGESTIONS = ["jargon", "buzzwords", "exclamation points", "emojis", "clickbait", "corporate speak"];

  function renderBusinessVoiceDNA(root) {
    var state = GraphicsHaus.styleDNA.getState();

    var nameInput = el("input", { type: "text", class: "gh-field__select", placeholder: "Your business name" });
    nameInput.value = state.businessName.value || "";
    nameInput.addEventListener("input", function () {
      GraphicsHaus.styleDNA.setBusinessName(nameInput.value);
    });
    var nameId = "gh-field-" + nameInput.getAttribute("data-gh-key");
    nameInput.id = nameId;

    var variationSelect = el("select", { class: "gh-field__select" });
    state.variationCount.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt, text: opt + (opt === "1" ? " variation" : " variations") });
      if (opt === state.variationCount.value) optionNode.selected = true;
      variationSelect.appendChild(optionNode);
    });
    variationSelect.addEventListener("change", function () { GraphicsHaus.styleDNA.setVariationCount(variationSelect.value); renderApp(); });
    var variationId = "gh-field-" + variationSelect.getAttribute("data-gh-key");
    variationSelect.id = variationId;

    var platformSelect = el("select", { class: "gh-field__select" });
    appendSelectOptions(platformSelect, state.targetPlatform, state.targetPlatform.value);
    platformSelect.addEventListener("change", function () { GraphicsHaus.styleDNA.setTargetPlatform(platformSelect.value); renderApp(); });
    var platformId = "gh-field-" + platformSelect.getAttribute("data-gh-key");
    platformSelect.id = platformId;

    var aspectSelect = el("select", { class: "gh-field__select" });
    state.aspectRatio.options.forEach(function (opt) {
      var optionNode = el("option", { value: opt, text: opt });
      if (opt === state.aspectRatio.value) optionNode.selected = true;
      aspectSelect.appendChild(optionNode);
    });
    aspectSelect.addEventListener("change", function () { GraphicsHaus.styleDNA.setAspectRatio(aspectSelect.value); renderApp(); });
    var aspectId = "gh-field-" + aspectSelect.getAttribute("data-gh-key");
    aspectSelect.id = aspectId;

    var bufferToggle = el("div", { class: "gh-styledna__yesno" }, [
      yesNoButton("Yes", state.addBuffer === true, function () { GraphicsHaus.styleDNA.setAddBuffer(true); renderApp(); }),
      yesNoButton("No", state.addBuffer !== true, function () { GraphicsHaus.styleDNA.setAddBuffer(false); renderApp(); }),
    ]);
    var bufferLabel = labelWithIcon("bufferBox", "Image Buffer/Padding", null, null, "Asks the AI to leave empty space around the edges so nothing gets cropped at the borders.");
    bufferLabel.id = "gh-label-buffer-padding";
    bufferToggle.setAttribute("role", "group");
    bufferToggle.setAttribute("aria-labelledby", bufferLabel.id);

    var outputFormatSelect = el("select", { class: "gh-field__select" });
    appendSelectOptions(outputFormatSelect, state.outputFormat, state.outputFormat.value);
    outputFormatSelect.addEventListener("change", function () { GraphicsHaus.styleDNA.setOutputFormat(outputFormatSelect.value); renderApp(); });
    var outputFormatId = "gh-field-" + outputFormatSelect.getAttribute("data-gh-key");
    outputFormatSelect.id = outputFormatId;

    var negativeTextarea = el("textarea", { class: "gh-field__custom gh-field__freetext gh-styledna__negative-input", rows: "2", placeholder: 'e.g. "jargon, buzzwords, emojis"' });
    negativeTextarea.value = state.negativePrompt.value || "";
    negativeTextarea.addEventListener("input", function () {
      GraphicsHaus.styleDNA.updateNegativePromptField({ value: negativeTextarea.value });
      renderApp();
    });
    var negativeId = "gh-field-" + negativeTextarea.getAttribute("data-gh-key");
    negativeTextarea.id = negativeId;
    var chips = el("div", { class: "gh-styledna__negative-chips" });
    NEGATIVE_SUGGESTIONS.forEach(function (item) {
      var chip = el("button", { type: "button", class: "gh-styledna__negative-chip", text: item });
      chip.title = 'Add "' + item + '" to the list above.';
      chip.addEventListener("click", function () {
        var current = (negativeTextarea.value || "").trim();
        var next = current ? current + ", " + item : item;
        GraphicsHaus.styleDNA.updateNegativePromptField({ value: next });
        renderApp();
      });
      chips.appendChild(chip);
    });

    var negativeFieldChildren = [
      labelWithIcon("shield", "Negative Prompt — What to Avoid", negativeId),
      el("p", { class: "gh-styledna__negative-subtitle", text: "Applies to every generator, once, at the end of the prompt — comma-separated. Click a suggestion to add it." }),
      negativeTextarea,
      chips,
    ];
    // Scoped to just this field — the mode's own Reset wipes every
    // selection in that mode too, not just this list. Only shown once
    // there's something to clear.
    if ((state.negativePrompt.value || "").trim()) {
      var negativeClearBtn = el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--reset gh-styledna__negative-clear" }, [el("span", { text: "Clear Negative Prompt" })]);
      negativeClearBtn.addEventListener("click", function () {
        GraphicsHaus.styleDNA.updateNegativePromptField({ value: "" });
        renderApp();
      });
      negativeFieldChildren.push(negativeClearBtn);
    }

    var children = [
      el("div", { class: "gh-styledna__field" }, [labelWithIcon("shirt", "Business Name", nameId, null, "Set once here — carries into every generator automatically."), nameInput]),
      el("div", { class: "gh-styledna__field" }, [labelWithIcon("sparkle", "Variations", variationId), variationSelect]),
      el("div", { class: "gh-styledna__field" }, [labelWithIcon("monitor", "Target Platform", platformId, null, "Formats the copied prompt for this specific AI tool."), platformSelect]),
      el("div", { class: "gh-styledna__field" }, [labelWithIcon("crop", "Aspect Ratio", aspectId, null, "Only appears in the copied text for Midjourney/Leonardo AI."), aspectSelect]),
      el("div", { class: "gh-styledna__field" }, [bufferLabel, bufferToggle]),
      el("div", { class: "gh-styledna__field" }, [
        labelWithIcon("bufferBox", "Output Format", outputFormatId, null, "A file-level export setting (transparency/format) — independent of any generator's own Background field, which is a scene/content choice, not a file setting. Leave on Default for a plain PNG."),
        outputFormatSelect,
      ]),
      el("div", { class: "gh-styledna__field gh-styledna__field--full" }, negativeFieldChildren),
    ];
    root.appendChild(el("div", { class: "gh-styledna" }, children));
  }

  // Holiday/Theme/Niche relocated out of the dark Business/Voice DNA bar
  // into their own boxed section — same "Concept / Creative Direction"
  // treatment Content Haus uses for its own equivalent fields. Purely a
  // rendering change: getVoiceEntries() still folds all three into every
  // assembled prompt exactly as before, unchanged.
  function renderConceptBox() {
    var state = GraphicsHaus.styleDNA.getState();
    return renderFieldGroup(
      "Concept / Creative Direction",
      [
        { label: "Holiday", field: state.holiday },
        { label: "Creative Theme", field: state.theme },
        { label: "Niche", field: state.niche },
      ],
      function (entry, changes) {
        var fieldName = entry.label === "Holiday" ? "holiday" : entry.label === "Creative Theme" ? "theme" : "niche";
        GraphicsHaus.util.updateField(GraphicsHaus.styleDNA, fieldName, changes);
        renderApp();
      },
      "Optional creative direction, shared across every generator."
    );
  }

  // ---------------------------------------------------------------------
  // Tab bar — Content Haus's own 2-row-with-divider pattern (renderTabs/
  // renderTabRow in prompt-builder-ui.js), ported here as this Haus's
  // replacement for the old grid-of-cards + per-panel back button: every
  // generator plus Combined/Image-Prompt-Reference/Collection Builder is
  // now one click away from any other, so there's nothing to "go back"
  // from. Row 1 is the 7 generators (in registration order); row 2 is the
  // 3 cross-generator modes.
  // ---------------------------------------------------------------------
  var TAB_INFO_TEXT = {
    combined: "Pick 2-3 of your own generators below and blend them into one cohesively-styled combined graphic — never pulls from the other Hauses.",
    reference: "Reference an image (upload + describe it) or a prompt you found elsewhere, and reimagine it in a new style.",
    collection: "View any of your generators' current prompts side by side, or combine up to 3 of them into one spliced-together prompt.",
  };

  function renderTabButton(tabId, label, iconName, isActive, onClick) {
    var btn = el("button", { type: "button", class: "gh-tabs__btn" + (isActive ? " is-active" : "") }, [
      icon(iconName),
      el("span", { text: label }),
    ]);
    btn.addEventListener("click", onClick);
    var item = el("span", { class: "gh-tabs__item" }, [btn]);
    if (TAB_INFO_TEXT[tabId]) item.appendChild(infoIcon(TAB_INFO_TEXT[tabId]));
    return item;
  }

  function goToMode(mode) {
    activeMode = mode;
    if (GraphicsHaus.generators.getGeneratorDef(mode)) GraphicsHaus.generators.setActiveGenerator(mode);
    renderApp();
  }

  function renderTabs(root) {
    var defs = GraphicsHaus.generators.getAllDefs();
    var row1 = el("div", { class: "gh-tabs" });
    defs.forEach(function (def) {
      row1.appendChild(renderTabButton(def.id, def.label, def.icon || "sparkle", activeMode === def.id, function () { goToMode(def.id); }));
    });
    var row2 = el("div", { class: "gh-tabs gh-tabs--row2" }, [
      renderTabButton("combined", "Combined", "layers", activeMode === "combined", function () { goToMode("combined"); }),
      renderTabButton("reference", "Image/Prompt Reference", "upload", activeMode === "reference", function () { goToMode("reference"); }),
      renderTabButton("collection", "Collection Builder", "document", activeMode === "collection", function () { goToMode("collection"); }),
    ]);
    root.appendChild(el("div", { class: "gh-tabs-box" }, [row1, row2]));
  }

  // ---------------------------------------------------------------------
  // Quality nudge, preview actions, export row, preview
  // ---------------------------------------------------------------------
  var QUALITY_NUDGE_THRESHOLD = 15;
  function renderQualityNudge(assembled) {
    var count = (assembled.fragments || []).length;
    if (count <= QUALITY_NUDGE_THRESHOLD) return null;
    return el("div", { class: "gh-preview__nudge" }, [
      icon("warning", "gh-preview__nudge-icon"),
      el("span", { text: "Heads up: you've got " + count + " details selected — results tend to look cleaner with a more focused set (aim for 5-10)." }),
    ]);
  }

  function renderPreviewActions(formatted, onRandomize, onReset, onSave, mode) {
    var copyBtn = el("button", { type: "button", class: "gh-btn gh-btn--copy" }, [icon("copy"), el("span", { class: "gh-btn__label", text: "Copy My Prompt" })]);
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn.querySelector(".gh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy My Prompt"; }, 1500);
      });
      GraphicsHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
      refreshRecentLogPanel();
    });

    var randomizeBtn = el("button", { type: "button", class: "gh-btn gh-btn--randomize" }, [icon("shuffle"), el("span", { text: "Randomize" })]);
    randomizeBtn.title = 'Picks a new random value for every field with "Include in prompt" checked, and clears any typed custom value for those fields.';
    randomizeBtn.addEventListener("click", onRandomize);

    var resetBtn = el("button", { type: "button", class: "gh-btn gh-btn--reset" }, [icon("refresh"), el("span", { text: "Reset" })]);
    resetBtn.title = "Clears every field back to Select.../None.";
    resetBtn.addEventListener("click", onReset);

    var isFull = GraphicsHaus.favorites.isFull(mode);
    var saveBtn = el("button", { type: "button", class: "gh-btn gh-btn--save" }, [icon("vault"), el("span", { text: "Save to Vault" })]);
    saveBtn.disabled = isFull;
    saveBtn.title = isFull
      ? "You have " + GraphicsHaus.favorites.MAX_PER_MODE + "/" + GraphicsHaus.favorites.MAX_PER_MODE + " saved here — delete one below to save another."
      : "Saves this exact prompt text below (up to " + GraphicsHaus.favorites.MAX_PER_MODE + " per generator).";
    saveBtn.addEventListener("click", function () {
      onSave();
      GraphicsHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
    });

    var actionsGrid = el("div", { class: "gh-preview__actions" }, [randomizeBtn, copyBtn, saveBtn, resetBtn]);
    var exportRow = renderExportRow(formatted, mode);
    return el("div", {}, [actionsGrid, exportRow]);
  }

  function renderExportRow(formatted, mode) {
    var shareBtn = el("button", { type: "button", class: "gh-btn gh-btn--export" }, [icon("share"), el("span", { class: "gh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows this exact prompt to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(formatted), function (ok) {
        var label = shareBtn.querySelector(".gh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn2 = el("button", { type: "button", class: "gh-btn gh-btn--export" }, [icon("copy"), el("span", { class: "gh-btn__label", text: "Copy" })]);
    copyBtn2.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn2.querySelector(".gh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "gh-btn gh-btn--export" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads this prompt as a .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(formatted, "graphics-haus-" + mode + "-prompt.txt"); });
    var printBtn = el("button", { type: "button", class: "gh-btn gh-btn--export" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of this prompt.";
    printBtn.addEventListener("click", function () { printPromptText(formatted); });
    return el("div", { class: "gh-preview__export-row" }, [shareBtn, copyBtn2, downloadBtn, printBtn]);
  }

  var saveFeedback = null;

  function renderPreview(root, assembled, modeApi, mode) {
    var styleDNAState = GraphicsHaus.styleDNA.getState();
    var formatted = GraphicsHaus.engine.formatForPlatform(assembled, styleDNAState.targetPlatform.value, styleDNAState.aspectRatio.value, styleDNAState.negativePrompt.value, styleDNAState.addBuffer, styleDNAState.outputFormat.value);
    var textarea = el("textarea", { class: "gh-preview__text", readonly: "readonly" });
    textarea.value = formatted;

    var actions = renderPreviewActions(
      formatted,
      function () { modeApi.randomize(); renderApp(); },
      function () { modeApi.reset(); GraphicsHaus.styleDNA.resetContent(); renderApp(); },
      function () {
        var result = GraphicsHaus.favorites.save(mode, {
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
      el("h3", { class: "gh-preview__title" }, [icon("lightning"), el("span", { text: "Your Prompt, Built Live" })]),
      el("p", { class: "gh-preview__subtitle", text: "Watch your creative direction turn into a ready-to-use AI prompt." }),
    ];
    var qualityNudge = renderQualityNudge(assembled);
    if (qualityNudge) previewChildren.push(qualityNudge);
    previewChildren.push(textarea, actions);
    if (saveFeedback) {
      previewChildren.push(el("p", { class: "gh-preview__save-feedback" + (saveFeedback.isError ? " is-error" : " is-success"), text: saveFeedback.text }));
    }
    root.appendChild(el("div", { class: "gh-preview" }, previewChildren));
  }

  // ---------------------------------------------------------------------
  // Your Vault
  // ---------------------------------------------------------------------
  var vaultExpanded = false;
  var renamingVaultId = null;

  function renderSavedPrompts(root, mode) {
    var saved = GraphicsHaus.favorites.getAll(mode).slice().reverse();
    var max = GraphicsHaus.favorites.MAX_PER_MODE;
    var list = el("div", { class: "gh-saved__list" });
    if (!saved.length) {
      list.appendChild(el("p", { class: "gh-saved__empty", text: "Your vault is empty — use \"Save to Vault\" above." }));
    } else {
      var visible = vaultExpanded ? saved : saved.slice(0, 1);
      visible.forEach(function (fav, index) {
        var currentVersion = GraphicsHaus.favorites.getCurrentVersion(fav);
        var versionCount = GraphicsHaus.favorites.getVersionCount(fav);
        var preview = currentVersion.text.length > 160 ? currentVersion.text.slice(0, 160) + "…" : currentVersion.text;

        var titleRow;
        if (renamingVaultId === fav.id) {
          var titleInput = el("input", { type: "text", class: "gh-saved__item-title-input", value: fav.title || "" });
          var confirmRename = function () {
            GraphicsHaus.favorites.rename(mode, fav.id, titleInput.value.trim() || ("Untitled " + (index + 1)));
            renamingVaultId = null;
            renderApp();
          };
          titleInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") confirmRename();
            if (e.key === "Escape") { renamingVaultId = null; renderApp(); }
          });
          titleInput.addEventListener("blur", confirmRename);
          titleRow = el("div", { class: "gh-saved__item-title-row" }, [titleInput]);
        } else {
          var renameBtn = el("button", { type: "button", class: "gh-saved__rename-btn", "aria-label": "Rename this saved prompt", title: "Rename" }, [icon("edit")]);
          renameBtn.addEventListener("click", function () { renamingVaultId = fav.id; renderApp(); });
          titleRow = el("div", { class: "gh-saved__item-title-row" }, [
            el("p", { class: "gh-saved__item-title", text: fav.title || "Untitled " + (index + 1) }),
            renameBtn,
          ]);
        }

        var loadBtn = null;
        if (currentVersion.snapshot) {
          loadBtn = el("button", { type: "button", class: "gh-btn gh-btn--load gh-btn--small", text: "Load" });
          loadBtn.title = "Restores every field in the builder to exactly how it was when this version was saved.";
          loadBtn.addEventListener("click", function () { loadVaultSnapshot(mode, currentVersion.snapshot); renderApp(); });
        }

        var copyBtn = el("button", { type: "button", class: "gh-btn gh-btn--copy gh-btn--small", text: "Copy" });
        copyBtn.addEventListener("click", function () {
          copyTextToClipboard(currentVersion.text, function (ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
          });
        });

        var saveVersionBtn = el("button", { type: "button", class: "gh-btn gh-btn--small", text: "Save as New Version" });
        saveVersionBtn.title = "Adds the prompt you're currently building as a new version of this item — doesn't use up another Vault slot.";
        saveVersionBtn.addEventListener("click", function () {
          var textarea = document.querySelector(".gh-preview__text");
          if (!textarea || !textarea.value) return;
          GraphicsHaus.favorites.addVersion(mode, fav.id, { text: textarea.value, snapshot: buildVaultSnapshot(mode) });
          renderApp();
        });

        var deleteBtn = el("button", { type: "button", class: "gh-btn gh-btn--delete gh-btn--small", text: "Delete" });
        deleteBtn.title = versionCount > 1 ? "Deletes this item and all " + versionCount + " of its versions." : "Deletes this item.";
        deleteBtn.addEventListener("click", function () { GraphicsHaus.favorites.remove(mode, fav.id); renderApp(); });

        var actionBtns = [];
        if (loadBtn) actionBtns.push(loadBtn);
        actionBtns.push(copyBtn, saveVersionBtn, deleteBtn);

        var itemChildren = [titleRow];
        if (versionCount > 1) {
          var versionSelect = el("select", { class: "gh-saved__version-select" });
          fav.versions.forEach(function (v, vi) {
            var isLatest = vi === fav.versions.length - 1;
            var optionNode = el("option", { value: String(vi) }, [document.createTextNode("Version " + (vi + 1) + (isLatest ? " (latest)" : ""))]);
            var activeIdx = typeof fav.activeVersionIndex === "number" ? fav.activeVersionIndex : fav.versions.length - 1;
            if (vi === activeIdx) optionNode.selected = true;
            versionSelect.appendChild(optionNode);
          });
          versionSelect.title = "Switch which saved version of this item you're viewing.";
          versionSelect.addEventListener("change", function () {
            GraphicsHaus.favorites.setActiveVersion(mode, fav.id, parseInt(versionSelect.value, 10));
            renderApp();
          });
          itemChildren.push(el("div", { class: "gh-saved__version-row" }, [icon("layers"), versionSelect]));
        }
        itemChildren.push(
          el("p", { class: "gh-saved__item-text", text: preview }),
          el("div", { class: "gh-saved__item-meta" }, [
            el("span", { class: "gh-saved__item-tag", text: new Date(currentVersion.createdAt).toLocaleDateString() }),
            el("div", { class: "gh-saved__item-actions" }, actionBtns),
          ])
        );
        list.appendChild(el("div", { class: "gh-saved__item" }, itemChildren));
      });
    }

    var headerChildren = [el("h3", { class: "gh-saved__title" }, [icon("vault"), el("span", { text: "Your Vault (" + saved.length + "/" + max + ")" })])];
    if (saved.length > 1) {
      var vaultToggleBtn = el("button", { type: "button", class: "gh-faq__toggle" }, [
        icon(vaultExpanded ? "eyeOff" : "eye"),
        el("span", { text: vaultExpanded ? "Hide" : "Show full list" }),
      ]);
      vaultToggleBtn.addEventListener("click", function () { vaultExpanded = !vaultExpanded; renderApp(); });
      headerChildren.push(vaultToggleBtn);
    }
    root.appendChild(el("div", { class: "gh-saved" }, [el("div", { class: "gh-faq__header" }, headerChildren), renderFullVaultExportRow(), list]));
  }

  // ---------------------------------------------------------------------
  // Recently Generated
  // ---------------------------------------------------------------------
  var recentLogExpanded = false;

  function refreshRecentLogPanel() {
    var existing = document.querySelector(".gh-recent");
    if (!existing) return;
    var captured = null;
    renderRecentLog({ appendChild: function (node) { captured = node; } });
    if (captured) existing.replaceWith(captured);
  }

  function renderRecentLogItem(entry) {
    var preview = entry.text.length > 160 ? entry.text.slice(0, 160) + "…" : entry.text;
    var loadBtn = null;
    if (entry.snapshot) {
      loadBtn = el("button", { type: "button", class: "gh-btn gh-btn--load gh-btn--small", text: "Load" });
      loadBtn.title = "Restores every field in the builder to exactly how it was when this was generated.";
      loadBtn.addEventListener("click", function () {
        loadVaultSnapshot(entry.mode, entry.snapshot);
        if (entry.mode.indexOf("gen:") === 0) {
          activeMode = entry.mode.slice(4);
          GraphicsHaus.generators.setActiveGenerator(activeMode);
        } else {
          activeMode = entry.mode;
        }
        renderApp();
      });
    }
    var copyBtn = el("button", { type: "button", class: "gh-btn gh-btn--copy gh-btn--small", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(entry.text, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });
    var deleteBtn = el("button", { type: "button", class: "gh-btn gh-btn--delete gh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { GraphicsHaus.favorites.removeRecent(entry.id); renderApp(); });

    var metaParts = [modeLabel(entry.mode), new Date(entry.loggedAt).toLocaleString()];
    var actionBtns = [];
    if (loadBtn) actionBtns.push(loadBtn);
    actionBtns.push(copyBtn, deleteBtn);
    return el("div", { class: "gh-saved__item" }, [
      el("p", { class: "gh-saved__item-text", text: preview }),
      el("div", { class: "gh-saved__item-meta" }, [
        el("span", { class: "gh-saved__item-tag", text: metaParts.join(" · ") }),
        el("div", { class: "gh-saved__item-actions" }, actionBtns),
      ]),
    ]);
  }

  function renderRecentLog(root) {
    var recent = GraphicsHaus.favorites.getRecentLog();
    var list = el("div", { class: "gh-saved__list" });
    if (!recent.length) {
      list.appendChild(el("p", { class: "gh-saved__empty", text: "Nothing generated yet — this fills in automatically as you Copy or Save prompts." }));
    } else {
      var visible = recentLogExpanded ? recent : recent.slice(0, 1);
      visible.forEach(function (entry) { list.appendChild(renderRecentLogItem(entry)); });
    }
    var headerChildren = [el("h3", { class: "gh-saved__title" }, [icon("refresh"), el("span", { text: "Recently Generated (" + recent.length + "/" + GraphicsHaus.favorites.RECENT_LOG_MAX + ")" })])];
    if (recent.length > 1) {
      var toggleBtn = el("button", { type: "button", class: "gh-faq__toggle" }, [
        icon(recentLogExpanded ? "eyeOff" : "eye"),
        el("span", { text: recentLogExpanded ? "Hide" : "Show all" }),
      ]);
      toggleBtn.addEventListener("click", function () { recentLogExpanded = !recentLogExpanded; renderApp(); });
      headerChildren.push(toggleBtn);
    }
    var children = [el("div", { class: "gh-faq__header" }, headerChildren)];
    if (recent.length) {
      var clearBtn = el("button", { type: "button", class: "gh-btn gh-btn--delete gh-btn--small", text: "Clear All" });
      clearBtn.title = "Clears this automatic log — doesn't touch anything in Your Vault.";
      clearBtn.addEventListener("click", function () { GraphicsHaus.favorites.clearRecentLog(); renderApp(); });
      children.push(el("div", { class: "gh-recent__clear-row" }, [clearBtn]));
    }
    children.push(
      el("p", { class: "gh-field-group__subtitle", text: "Auto-saved on Copy/Save, most recent first — Load restores every field, same as Your Vault." }),
      list
    );
    root.appendChild(el("div", { class: "gh-saved gh-recent" }, children));
  }

  function renderFullVaultExportRow() {
    var all = GraphicsHaus.favorites.getAllFlat();
    if (!all.length) return el("div", {});
    var fullText = buildFullVaultText();
    var shareBtn = el("button", { type: "button", class: "gh-btn gh-btn--export gh-btn--small" }, [icon("share"), el("span", { class: "gh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows your entire saved vault to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(fullText), function (ok) {
        var label = shareBtn.querySelector(".gh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn = el("button", { type: "button", class: "gh-btn gh-btn--export gh-btn--small" }, [icon("copy"), el("span", { class: "gh-btn__label", text: "Copy" })]);
    copyBtn.title = "Copies every saved prompt across every generator as one block of text.";
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(fullText, function (ok) {
        var label = copyBtn.querySelector(".gh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "gh-btn gh-btn--export gh-btn--small" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads every saved prompt across every generator as one .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(fullText, "graphics-haus-full-vault.txt"); });
    var printBtn = el("button", { type: "button", class: "gh-btn gh-btn--export gh-btn--small" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of your entire saved vault.";
    printBtn.addEventListener("click", function () { printPromptText(fullText); });
    return el("div", { class: "gh-saved__vault-export" }, [shareBtn, copyBtn, downloadBtn, printBtn]);
  }

  // ---------------------------------------------------------------------
  // Your Selections
  // ---------------------------------------------------------------------
  var selectionsExpanded = false;

  function renderSelectionsPanel(root, mode, groups) {
    var totalItemCount = groups.reduce(function (sum, g) { return sum + g.items.length; }, 0);
    var eyeBtn = el("button", { type: "button", class: "gh-selections__eye-btn" }, [
      icon(selectionsExpanded ? "eyeOff" : "eye"),
      el("span", { text: selectionsExpanded ? "Hide full list" : "Show full list (" + totalItemCount + ")" }),
    ]);
    eyeBtn.addEventListener("click", function () { selectionsExpanded = !selectionsExpanded; renderApp(); });

    var children = [
      el("div", { class: "gh-selections__header" }, [
        el("h3", { class: "gh-selections__title" }, [icon("document"), el("span", { text: "Your Selections" })]),
        eyeBtn,
      ]),
    ];
    if (selectionsExpanded) {
      var body;
      if (!groups.length) {
        body = el("p", { class: "gh-selections__empty", text: "Nothing selected yet — choices you make above will appear here." });
      } else {
        body = el("div", { class: "gh-selections__scroll" });
        groups.forEach(function (group, idx) {
          if (idx > 0) body.appendChild(el("hr", { class: "gh-selections__divider" }));
          body.appendChild(el("h4", { class: "gh-selections__group-title", text: group.title }));
          group.items.forEach(function (item) {
            body.appendChild(el("div", { class: "gh-selections__item" }, [
              el("span", { class: "gh-selections__item-label", text: item.label + ":" }),
              el("span", { class: "gh-selections__item-value", text: " " + item.value }),
            ]));
          });
        });
      }
      children.push(el("hr", { class: "gh-selections__divider" }), body);
    }
    root.appendChild(el("div", { class: "gh-selections" }, children));
  }

  // ---------------------------------------------------------------------
  // Shell — generator-grid-first, no tabs: GraphicsHaus.generators IS
  // the whole app, so renderAppContent goes straight from the Business/
  // Voice DNA bar to the generator grid/panel, with no "Select the
  // Studio" step in between.
  // ---------------------------------------------------------------------
  function renderApp() {
    var root = document.getElementById("graphics-haus-app");
    if (!root) return;

    var scrollX = window.scrollX;
    var scrollY = window.scrollY;
    var previewHeights = Array.prototype.map.call(root.querySelectorAll(".gh-preview__text"), function (t) {
      return t.style.height || "";
    });
    var active = document.activeElement;
    var focusRestore = null;
    if (active && root.contains(active) && active.hasAttribute("data-gh-key")) {
      focusRestore = {
        key: active.getAttribute("data-gh-key"),
        selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
        selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
      };
    }

    try {
      renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights);
    } catch (e) {
      root.innerHTML = "";
      root.appendChild(el("div", { class: "gh-render-error" }, [
        el("p", { text: "Something went wrong displaying the builder — this can happen when loading a prompt saved under an older version of the tool." }),
        el("p", { text: "Reload the page to get back to a working state. If it happened right after clicking Load on a saved prompt, that item may need to be deleted from Your Vault or Recently Generated and recreated." }),
      ]));
      if (window.console && window.console.error) window.console.error("Graphics Haus render error:", e);
    }
  }

  function renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights) {
    ghKeyCounter = 0;
    root.innerHTML = "";

    if (!activeMode) {
      var firstDef = GraphicsHaus.generators.getAllDefs()[0];
      activeMode = firstDef ? firstDef.id : "combined";
      if (firstDef) GraphicsHaus.generators.setActiveGenerator(activeMode);
    }

    var shell = el("div", { class: "gh-shell" });
    renderBusinessVoiceDNA(shell);
    renderTabs(shell);

    var body = el("div", { class: "gh-body" });
    var left = el("div", { class: "gh-body__fields" });
    var right = el("div", { class: "gh-body__preview" });

    if (activeMode === "collection") {
      left.appendChild(GraphicsHaus.collection.renderPanel());
      if (GraphicsHaus.lookLock) GraphicsHaus.lookLock.renderSection(right);
      if (GraphicsHaus.mascotLock) GraphicsHaus.mascotLock.renderSection(right);
      if (GraphicsHaus.brandKit) GraphicsHaus.brandKit.renderSection(right);
      renderRecentLog(right);
    } else {
      var modeApi = GraphicsHaus.generators.getGeneratorDef(activeMode) ? GraphicsHaus.generators : GraphicsHaus[activeMode];
      var vaultKey = GraphicsHaus.generators.getGeneratorDef(activeMode) ? "gen:" + activeMode : activeMode;
      left.appendChild(modeApi.renderPanel());
      left.appendChild(renderConceptBox());
      renderSelectionsPanel(right, vaultKey, modeApi.getSelectionsByGroup());
      renderPreview(right, modeApi.assemblePrompt(), modeApi, vaultKey);
      if (activeMode === "reference" && GraphicsHaus.reference.renderGenerateImageSection) GraphicsHaus.reference.renderGenerateImageSection(right);
      renderSavedPrompts(right, vaultKey);
      if (GraphicsHaus.lookLock) GraphicsHaus.lookLock.renderSection(right);
      if (GraphicsHaus.mascotLock) GraphicsHaus.mascotLock.renderSection(right);
      if (GraphicsHaus.brandKit) GraphicsHaus.brandKit.renderSection(right);
      renderRecentLog(right);
    }

    body.appendChild(left);
    body.appendChild(right);
    shell.appendChild(body);
    root.appendChild(shell);

    if (focusRestore) {
      var restored = root.querySelector('[data-gh-key="' + focusRestore.key + '"]');
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
      var newTextareas = root.querySelectorAll(".gh-preview__text");
      previewHeights.forEach(function (height, i) {
        if (height && newTextareas[i]) newTextareas[i].style.height = height;
      });
    }
    window.scrollTo(scrollX, scrollY);
  }

  GraphicsHaus.ui = {
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
    renderSavedPrompts: renderSavedPrompts,
    renderTwoOptionToggle: renderTwoOptionToggle,
  };

  document.addEventListener("click", function (e) {
    document.querySelectorAll(".gh-info[open]").forEach(function (details) {
      if (!details.contains(e.target)) details.open = false;
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    GraphicsHaus.ui.renderApp();
  });
})();
