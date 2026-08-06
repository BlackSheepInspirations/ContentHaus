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

  // Order matches the two-row tab layout: row 1 is the "build a subject"
  // modes, row 2 (after a divider) is the "work with an image/collection"
  // modes — see renderTabs' ROW_1_MODES split below.
  var MODES = ["character", "couples", "family", "animals", "text", "graphics", "combined", "reference", "collection"];
  var MODE_LABELS = { character: "Character", text: "Text", couples: "Couples", family: "Friends & Family", combined: "Combined", graphics: "Graphics", reference: "Image/Prompt Reference", animals: "Animals & Creatures", collection: "Collection Builder" };
  // Flips to true as each mode ships in later build steps.
  var BUILT_MODES = { character: true, text: true, couples: true, family: true, combined: true, graphics: true, reference: true, animals: true, collection: true };
  // Modes eligible to include in a Collection — every built mode except
  // Collection Builder itself.
  var COLLECTION_ELIGIBLE_MODES = ["character", "couples", "family", "animals", "text", "graphics", "combined", "reference"];
  // Ephemeral — which modes are currently checked in Collection Builder.
  // Not persisted; this is a "generate right now from whatever's already
  // set on each mode's own tab" tool, not a saved-state feature the way
  // Vault/Recent Log are.
  var collectionSelectedModes = {};
  // Ephemeral — separate from the view-all-side-by-side checklist above,
  // capped at 3 (splicing more than 3 prompts together reads as noise).
  var collectionCombineSelectedModes = {};
  var COLLECTION_COMBINE_MAX = 3;

  var activeMode = "character";
  // Transient banner shown after a Save Prompt click (success or "limit
  // reached"). Lives at module scope, not on a DOM node, so it survives
  // the full re-render that click triggers; cleared by its own timeout.
  var saveFeedback = null;
  // Which vault item (by id) currently has its title swapped out for a
  // rename input — at most one at a time, cleared on save/cancel/re-render
  // into a different mode.
  var renamingVaultId = null;
  // Brand Kit section — collapsed by default (it's a lot of fields), which
  // kit (if any) has its rename input open, and which kit (if any) has its
  // 5 category groups expanded for editing. All module-scope, same pattern
  // as briefExpanded/renamingVaultId above.
  var brandKitExpanded = false;
  var renamingKitId = null;
  var expandedKitId = null;
  // Recently Generated — collapsed by default, showing just the single
  // most recent entry so it doesn't compete for space with Your Vault
  // above it; "Show all" reveals the rest.
  var recentLogExpanded = false;
  // Your Vault — same collapsed-to-one-item pattern as Recently
  // Generated above.
  var vaultExpanded = false;

  // Every renderApp() call tears down and rebuilds the entire DOM (simplest
  // way to keep everything in sync with the store), which would normally
  // steal focus/cursor position/scroll out from under someone mid-keystroke
  // in any text field. Fix: auto-tag every focusable element with a
  // position-based key as it's created, reset right before each rebuild —
  // since a single keystroke never changes which fields are visible, the
  // same element ends up with the same key both times, so renderApp() can
  // find it again afterward and restore focus/selection/scroll to it.
  var phKeyCounter = 0;
  var FOCUSABLE_TAGS = { input: true, select: true, textarea: true };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (FOCUSABLE_TAGS[tag]) {
      node.setAttribute("data-ph-key", String(phKeyCounter++));
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  // navigator.clipboard.writeText can silently fail or reject inside the
  // Shopify theme editor's preview iframe (permissions-policy/focus
  // restrictions vary by embedding context) — falls back to the classic
  // hidden-textarea + execCommand("copy") technique, which doesn't depend
  // on that same permissions grant, so the button still works there.
  // onDone(success) always fires so the caller can show "Copied!" either
  // way or an error state if both methods genuinely failed.
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
        function () {
          onDone(true);
        },
        function () {
          fallbackCopy();
        }
      );
    } else {
      fallbackCopy();
    }
  }

  // Client-side .txt download — Blob + a throwaway anchor click, no
  // backend involved.
  function downloadTextAsFile(text, filename) {
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Opens a small popup with just the prompt text, cleanly formatted, and
  // triggers the browser's print dialog on it — separate window instead of
  // an in-page @media print rule, since the app page has a lot of other
  // visible content that would need suppressing.
  function printPromptText(text) {
    var win = window.open("", "_blank", "width=650,height=800");
    if (!win) return;
    var escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    win.document.write(
      "<html><head><title>Your AI Prompt — The AI Creator's Prompt Haus</title><style>" +
        "body{font-family:Georgia,serif;padding:48px;color:#1A1815;line-height:1.6;max-width:600px;margin:0 auto;}" +
        "h1{font-size:16px;letter-spacing:0.05em;text-transform:uppercase;color:#3C2A21;margin-bottom:28px;}" +
        "p{font-size:15px;white-space:pre-wrap;}" +
        "</style></head><body>" +
        "<h1>Black Sheep Creations &amp; Inspirations — The AI Creator's Prompt Haus</h1>" +
        "<p>" +
        escaped +
        "</p>" +
        "</body></html>"
    );
    win.document.close();
    win.focus();
    setTimeout(function () {
      win.print();
    }, 250);
  }

  // Shareable link — encodes the final prompt text itself (not the full
  // widget state) into the URL, since that's what every sibling action in
  // this cluster (Copy/Download/Print) already operates on, and avoids
  // needing to reconstruct complex nested form state on the receiving end.
  function buildShareUrl(text) {
    var encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(text))));
    var base = window.location.origin + window.location.pathname;
    return base + "?ph_shared_prompt=" + encoded;
  }

  function readSharedPromptFromUrl() {
    var match = window.location.search.match(/ph_shared_prompt=([^&]+)/);
    if (!match) return null;
    try {
      return decodeURIComponent(escape(atob(decodeURIComponent(match[1]))));
    } catch (e) {
      return null;
    }
  }

  // Vault items store a snapshot of the actual field state (not just the
  // rendered text) so "Load" can restore the builder to exactly how it
  // looked when saved. Combined mode draws on Character/Text/Graphics'
  // own stores in addition to its own, so its snapshot bundles all four
  // plus the shared Style DNA bar; every other mode only needs its own
  // store + Style DNA.
  var VAULT_CROSS_MODULES = {
    combined: ["character", "text", "graphics"],
    character: ["characterVideo"], couples: ["characterVideo"], family: ["characterVideo"],
    animals: ["characterVideo"], graphics: ["characterVideo"], reference: ["characterVideo"],
  };

  function buildVaultSnapshot(mode) {
    var snapshot = { styleDNA: JSON.parse(JSON.stringify(PromptHaus.styleDNA.getState())) };
    snapshot[mode] = JSON.parse(JSON.stringify(PromptHaus[mode].getState()));
    (VAULT_CROSS_MODULES[mode] || []).forEach(function (dep) {
      snapshot[dep] = JSON.parse(JSON.stringify(PromptHaus[dep].getState()));
    });
    // The raw reference image data URL can be several MB — keeping it out
    // of localStorage avoids blowing the per-origin quota after just a
    // couple of saves. imageName is kept so the snapshot still reads as
    // "this had an image attached," even though the pixels aren't restored.
    if (mode === "reference" && snapshot.reference && snapshot.reference.image) {
      snapshot.reference.image = "";
    }
    return snapshot;
  }

  // setState only shallow-merges at its top level (see createStore in
  // prompt-builder-styledna.js), so handing it an old snapshot's group
  // wholesale (e.g. `companion`) replaces that entire group — including
  // any field added to it since the snapshot was saved (like Eye Color).
  // Code downstream that assumes that field exists then throws on the
  // very next render. Deep-merging the snapshot onto the mode's current
  // state instead means a field missing from an older snapshot just
  // keeps its current default rather than going undefined.
  //
  // Field-shaped objects (anything with both `value` and `options`) are
  // handled specially: options/optionGroups come from the CURRENT state,
  // never the snapshot — option lists grow over time (new dropdown
  // choices added later), and a stale snapshot's copy of that list would
  // otherwise briefly resurrect an old, incomplete version of it.
  function isFieldShape(obj) {
    return !!obj && typeof obj === "object" && !Array.isArray(obj) &&
      Object.prototype.hasOwnProperty.call(obj, "value") &&
      Object.prototype.hasOwnProperty.call(obj, "options");
  }

  function deepMergeSnapshot(current, saved) {
    if (Array.isArray(saved)) {
      // e.g. Animals & Creatures' `creatures` slots — merge each saved
      // slot against the current slot at the same index, so a slot
      // structure change since the snapshot was saved still gets
      // defaults for whatever's missing, rather than swapping the whole
      // array in wholesale.
      var currentArr = Array.isArray(current) ? current : [];
      return saved.map(function (item, i) {
        return deepMergeSnapshot(currentArr[i], item);
      });
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
    if (snapshot.styleDNA) PromptHaus.styleDNA.setState(deepMergeSnapshot(PromptHaus.styleDNA.getState(), snapshot.styleDNA));
    if (snapshot[mode]) PromptHaus[mode].setState(deepMergeSnapshot(PromptHaus[mode].getState(), snapshot[mode]));
    (VAULT_CROSS_MODULES[mode] || []).forEach(function (dep) {
      if (snapshot[dep]) PromptHaus[dep].setState(deepMergeSnapshot(PromptHaus[dep].getState(), snapshot[dep]));
    });
  }

  // Auto-suggested title so a freshly-saved item isn't just "Untitled" —
  // built from whatever Style DNA context is actually set (Niche beats
  // Theme beats Holiday, since Niche is the most specific), falling back
  // to the mode name alone when nothing else is set. Still fully
  // renamable afterward via renameVaultItem.
  function buildVaultTitle(mode) {
    var styleDNA = PromptHaus.styleDNA.getState();
    var project = PromptHaus.engine.resolveFieldValue(styleDNA.projectType);
    var context =
      PromptHaus.engine.resolveFieldValue(styleDNA.niche) ||
      PromptHaus.engine.resolveFieldValue(styleDNA.theme) ||
      PromptHaus.engine.resolveFieldValue(styleDNA.holiday);
    var parts = [project, context].filter(Boolean);
    if (!parts.length) parts.push(MODE_LABELS[mode] || mode);
    return parts.join(" — ");
  }

  // Combines Style DNA's own typed Negative Prompt with the active Brand
  // Kit's "What the Brand is NOT" (if any, and if Personality isn't
  // overridden) — same exclusion-list job, just two different sources
  // feeding one output.
  function buildCombinedNegativePrompt() {
    var typed = PromptHaus.styleDNA.getState().negativePrompt.value;
    var fromKit = PromptHaus.brandKit.getActiveKitNegativeContribution();
    return [typed, fromKit].filter(Boolean).join(", ");
  }

  // All saved items across every mode, flattened into one printable/
  // shareable/downloadable block — grouped by mode, titled, in save order.
  function buildFullVaultText() {
    var byMode = {};
    PromptHaus.favorites.getAllFlat().forEach(function (fav) {
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
    upload: '<path d="M10 13V3M6 7l4-4 4 4"/><path d="M3 13v2.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V13"/>',
    download: '<path d="M10 3v10M6 9l4 4 4-4"/><path d="M3 13v2.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V13"/>',
    share: '<circle cx="15" cy="4.5" r="2"/><circle cx="5" cy="10" r="2"/><circle cx="15" cy="15.5" r="2"/><path d="M6.7 9 13.3 5.5M6.7 11 13.3 14.5"/>',
    print: '<rect x="5" y="2.5" width="10" height="6" rx="1"/><rect x="3" y="8" width="14" height="7" rx="1.2"/><rect x="6" y="12" width="8" height="5"/>',
    bufferBox: '<rect x="3" y="3" width="14" height="14" rx="2" stroke-dasharray="3 2.5"/>',
    document: '<rect x="4" y="2" width="12" height="16" rx="1.2"/><path d="M7 6.5h6M7 9.5h6M7 12.5h3.5"/>',
    lightning: '<path d="M11 2 4 11h5l-1 7 8-9h-5l1-7Z"/>',
    eye: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/>',
    eyeOff: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/><path d="M3 3l14 14"/>',
    copy: '<rect x="6.5" y="6.5" width="10" height="10" rx="1.2"/><path d="M4 12.5V4.8C4 4 4.7 3.3 5.5 3.3H13"/>',
    vault: '<rect x="4" y="9" width="12" height="8" rx="1.2"/><path d="M6 9V6.3C6 3.9 7.8 2 10 2s4 1.9 4 4.3V9"/>',
    edit: '<path d="M13.5 2.5 17 6l-9.5 9.5-4 1 1-4Z"/>',
    brandKit: '<path d="M10 2 3 7l7 11 7-11Z"/><path d="M3 7h14M7 7 10 2l3 5"/>',
    logoMark: '<circle cx="10" cy="10" r="7.5"/><path d="M7 10.5 9 12.5 13.5 8"/>',
    shuffle: '<path d="M3 6h4l7 8h3M3 14h4l2.2-2.5"/><path d="M14.5 4 17 6l-2.5 2M14.5 12 17 14l-2.5 2"/>',
    refresh: '<path d="M17 10a7 7 0 0 0-12.8-4M3 10a7 7 0 0 0 12.8 4"/><path d="M3 3v4.5h4.5M17 17v-4.5h-4.5"/>',
    step1: '<circle cx="10" cy="10" r="7.5"/><path d="M8 10l1.5 1.5L13 8"/>',
    step2: '<circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l3 2"/>',
    step3: '<circle cx="10" cy="10" r="7.5"/><path d="M4 10s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4Z"/>',
    step4: '<circle cx="10" cy="10" r="7.5"/><rect x="7.5" y="7" width="6" height="6.5" rx="1"/><path d="M6.5 8.5V5.5A1 1 0 0 1 7.5 4.5h4.3"/>',
    plane: '<path d="M2 10 17 3 10 18l-2-7-6-1Z"/>',
    train: '<rect x="4" y="4" width="12" height="9" rx="2"/><path d="M7 7.5h6M4 13h12"/><circle cx="7" cy="16" r="1.3"/><circle cx="13" cy="16" r="1.3"/>',
    boat: '<path d="M3 13h14l-2 4H5l-2-4Z"/><path d="M10 3v9M10 5l4 2-4 2"/>',
    car: '<path d="M4 13 5.5 8h9L16 13"/><rect x="3" y="13" width="14" height="3" rx="1"/><circle cx="6.5" cy="16.5" r="1.3"/><circle cx="13.5" cy="16.5" r="1.3"/>',
    shield: '<path d="M10 2 16 4.5V10c0 4-3 6.5-6 8-3-1.5-6-4-6-8V4.5Z"/><path d="M7 9l3 2 3-2"/>',
    bulb: '<path d="M7 15h6M8 17.5h4"/><path d="M10 2.5c-3 0-5 2.2-5 5 0 2 1.1 3.3 2 4.2.5.5.8 1 .9 1.8h4.2c.1-.8.4-1.3.9-1.8.9-.9 2-2.2 2-4.2 0-2.8-2-5-5-5Z"/>',
    warning: '<path d="M10 2.5 18 17H2Z"/><path d="M10 8v3.5"/><circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none"/>',
    people: '<circle cx="6.5" cy="6" r="2.2"/><path d="M2.5 17c0-2.7 1.8-4.8 4-4.8s4 2.1 4 4.8"/><circle cx="14" cy="7.3" r="1.8"/><path d="M10.7 17c.3-2.2 1.8-3.9 3.3-3.9s3 1.7 3.3 3.9"/>',
    sheep: '<ellipse cx="9" cy="10.5" rx="6.5" ry="5"/><circle cx="15.5" cy="8" r="2.3"/><path d="M6 14.5v2M9.5 15v2M13 14.5v2"/>',
    video: '<rect x="2" y="4" width="16" height="12" rx="2"/><path d="M8 7.5v5l5-2.5-5-2.5Z" fill="currentColor" stroke="none"/>',
  };

  // Fieldset legend title -> icon name, so each sub-section header reads
  // at a glance instead of as a wall of plain-text labels. Keyed by the
  // exact display title (not a groupName) since that's what every
  // renderFieldGroup call site already has on hand; a title with no entry
  // here just renders without an icon rather than erroring.
  var TITLE_ICONS = {
    "Character Style - Pick one core look": "sparkle", "Human Identity": "person", "Animal Identity": "paw",
    "Character Identity - Animal Mode": "paw",
    "Appearance": "sparkle", "Styling": "shirt", "Presentation": "monitor",
    "Extras": "sparkle", "Companion Details": "paw", "Couple Dynamic": "heart", "Friends & Family Dynamic": "people",
    "Companion Type": "sheep", "Companion 1 Type": "sheep", "Companion 2 Type": "sheep", "Companion 3 Type": "sheep",
    "Companion 1 Details": "paw", "Companion 2 Details": "paw", "Companion 3 Details": "paw",
    "Core Style": "text", "Variation Details": "layers",
    "Second Phrase Details": "sparkle", "Second Phrase": "sparkle",
    "Illustrated Style": "image", "Realistic Style": "image", "Frame It": "crop",
    "Makeup & Nails": "sparkle",
    "What Is It": "sparkle", "Custom Vanity Plates": "gift",
    "Imagery": "image", "Imagery & Scene Elements": "image", "Text": "text", "Character Position": "crop",
    "Style Adjustment": "sparkle", "Text Details": "text", "Reference Description": "upload",
    "Filter & Finish": "image",
    "Concept • Creative Direction": "sparkle",
    "Creature 1": "paw", "Creature 2": "paw", "Creature 3": "paw",
    "Creature 1 Details": "paw", "Creature 2 Details": "paw", "Creature 3 Details": "paw",
  };

  // Every icon is purely decorative — always paired with its own visible
  // text label right next to it — so it's hidden from screen readers
  // rather than announced as an unlabeled graphic.
  function icon(name, extraClass) {
    var span = el("span", { class: "ph-icon" + (extraClass ? " " + extraClass : ""), "aria-hidden": "true" });
    span.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
    return span;
  }

  // A field/section label with its category icon leading it — used
  // anywhere a plain text label previously stood alone (Style DNA bar,
  // fieldset legends, etc.). Renders a real <label for> when forId is
  // given (so screen readers announce "Project Type" etc. when its
  // select/toggle gets focus) — falls back to a plain <span> for legend-
  // style uses with no single associated control (e.g. Buffer/Padding's
  // Yes/No pair, which has no one input to point at).
  // A visible circled-"i" affordance, distinct from the many fields that
  // already carry a hover-only `title` attribute — that content is
  // invisible unless someone thinks to hover, which most people don't.
  // Built on native <details>/<summary> rather than a hand-rolled
  // click-to-toggle listener: every render tears down and rebuilds the
  // whole DOM, so a JS-managed "click elsewhere to close" listener
  // attached fresh on every render would pile up without ever being
  // removed. <details> gets open/close, keyboard support, and click
  // (for touch devices) for free, with zero listeners to manage.
  // No `title` on the summary — the browser's own native tooltip would
  // otherwise show alongside this custom one on hover (both listening to
  // the same hover), which renders as an unstyled, unwrapped second copy
  // of the text stacked on top of the styled popover in some browsers.
  // The custom .ph-info__body already covers hover (via CSS) and click
  // (via <details>), so the native one is pure redundancy, not a fallback.
  function infoIcon(text) {
    return el("details", { class: "ph-info" }, [
      el("summary", { class: "ph-info__icon", "aria-label": "More info" }, [el("span", { text: "i" })]),
      el("p", { class: "ph-info__body", text: text }),
    ]);
  }

  function labelWithIcon(iconName, text, forId, labelClass, helpText) {
    var attrs = { class: (labelClass || "ph-field__label") + " ph-label--icon" };
    if (forId) attrs.for = forId;
    var children = [icon(iconName), el("span", { text: text })];
    if (helpText) children.push(infoIcon(helpText));
    return el(forId ? "label" : "span", attrs, children);
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

  // Lighter-weight N-option pill toggle — same "click to pick" idea as the
  // two-option toggle above, but sized for a row of several choices (e.g.
  // Transportation's Air/Land/Military/Rail/Water) rather than 2 big cards.
  function renderPillToggle(options) {
    function pillButton(opt) {
      var btn = el("button", { type: "button", class: "ph-pill-toggle__btn" + (opt.isActive ? " is-active" : "") }, [
        icon(opt.icon, "ph-pill-toggle__icon"),
        el("span", { class: "ph-pill-toggle__label", text: opt.title }),
      ]);
      btn.addEventListener("click", opt.onClick);
      return btn;
    }
    return el("div", { class: "ph-pill-toggle" }, options.map(pillButton));
  }

  // Which category pill is currently expanded, per mode+field — purely a
  // "what's showing right now" UI concern (never saved, vaulted, or
  // randomized), so it lives as a plain in-memory map here rather than in
  // any mode's own state, same pattern as tipsExpanded elsewhere in this
  // file. Keyed by a caller-supplied string (e.g. "character.characterType")
  // so each mode's own copy of a shared field (Character Type/Art Finish
  // both appear in 6 modes) tracks its own bucket independently.
  var activeGroupedPillBucket = {};

  function bucketLabelForValue(groups, value) {
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].options.indexOf(value) !== -1) return groups[i].label;
    }
    return null;
  }

  // Renders a grouped field (Character Type's 8 buckets, Art Finish's 4)
  // as a horizontal row of category pills + a single dropdown scoped to
  // whichever pill is active — same "category toggle reveals one filtered
  // dropdown" idea as Transportation's category -> vehicle cascade, so a
  // large multi-bucket catalog doesn't have to live in one overwhelming
  // flat dropdown (missing the categories) or one native <optgroup> wall
  // (all 59 items visible at once, which is the overwhelming part).
  // iconMap: { [bucketLabel]: iconName }. onChange: (entry, changes) — same
  // signature every other field-group change handler already uses.
  function renderGroupedPillField(stateKey, entry, iconMap, onChange) {
    var field = entry.field;
    var groups = field.optionGroups || [];
    if (!groups.length) return renderField(entry, function (changes) { onChange(entry, changes); });

    var valueBucket = bucketLabelForValue(groups, field.value);
    if (valueBucket) {
      activeGroupedPillBucket[stateKey] = valueBucket;
    } else if (!activeGroupedPillBucket[stateKey]) {
      activeGroupedPillBucket[stateKey] = groups[0].label;
    }
    var active = activeGroupedPillBucket[stateKey];

    var pills = renderPillToggle(
      groups.map(function (group) {
        return {
          isActive: group.label === active,
          icon: iconMap[group.label] || "sparkle",
          title: group.label,
          onClick: function () {
            var switching = group.label !== active;
            activeGroupedPillBucket[stateKey] = group.label;
            // Picking a different overall style never gets locked out: if something
            // was already selected in the old bucket, clear it so the dropdown
            // resets to "Select…" for the new style instead of ignoring the click.
            if (switching && (field.value || field.customValue)) {
              onChange(entry, { value: "", customValue: "" });
            } else {
              renderApp();
            }
          },
        };
      })
    );

    var activeGroup = groups.filter(function (g) { return g.label === active; })[0] || groups[0];
    var scopedField = Object.assign({}, field, { options: activeGroup.options, optionGroups: undefined });

    var wrap = el("div", { class: "ph-grouped-pill-field" });
    wrap.appendChild(pills);
    wrap.appendChild(renderField({ label: entry.label, field: scopedField }, function (changes) {
      onChange(entry, changes);
    }));
    return wrap;
  }

  // Bucket -> icon, reusing icons already in the ICONS map rather than
  // adding new SVG paths.
  var CHARACTER_TYPE_BUCKET_ICONS = {
    "Cartoon & Animation": "video",
    "Character & Stylized": "person",
    "Illustrative Art Styles": "edit",
    "Minimal & Graphic": "crop",
    "Realism & Portraiture": "image",
    "Retro, Alternative & Digital": "monitor",
    "Character & Collectible": "gift",
    "Publishing & Editorial": "document",
  };
  var ART_FINISH_BUCKET_ICONS = {
    "Textile & Crafted": "shirt",
    "Specialty Finishes": "sparkle",
    "Digital Rendering": "monitor",
    "Traditional Mediums": "edit",
  };

  // Starter Presets — a row of clickable cards at the top of a mode's
  // panel. Applying one is just a fast way to fill in a bunch of fields
  // at once; every field it touches stays fully editable afterward, same
  // as anything a shopper picks by hand. Returns null when a mode has no
  // presets so callers can skip appending anything.
  function renderPresetRow(presets, onApply, labelText) {
    if (!presets || !presets.length) return null;
    var cards = presets.map(function (preset) {
      var card = el("button", { type: "button", class: "ph-preset-card" }, [
        el("span", { class: "ph-preset-card__name", text: preset.name }),
        el("span", { class: "ph-preset-card__description", text: preset.description }),
      ]);
      card.addEventListener("click", function () {
        onApply(preset);
      });
      return card;
    });
    return el("div", { class: "ph-preset-row" }, [
      el("p", { class: "ph-preset-row__label" }, [
        icon("sparkle"),
        el("span", { text: labelText || "Starter Presets — click one, then customize" }),
      ]),
      el("div", { class: "ph-preset-row__cards" }, cards),
    ]);
  }

  function renderBaseTypeToggle(currentBaseType, onSetHuman, onSetMascot) {
    // White-box "Type" encasing (docs/haus-design-system.md) — the Human /
    // Animal Mascot picker framed with its own eyebrow, distinct from a
    // primary build section.
    var toggle = renderTwoOptionToggle([
      { isActive: currentBaseType === "human", icon: "person", title: "Human", subtitle: "People characters", onClick: onSetHuman },
      { isActive: currentBaseType === "animalMascot", icon: "paw", title: "Animal Mascot", subtitle: "Mascots & animals", onClick: onSetMascot },
    ]);
    return el("div", { class: "hds-encase ph-encase--type" }, [
      el("p", { class: "hds-encase__eyebrow", text: "Type" }),
      toggle,
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

  // Whether a field currently has anything that would actually show up in
  // the prompt (mirrors engine.resolveFieldValue's value-resolution, minus
  // the includeInPrompt gate) — used to keep "Include in prompt" reading as
  // unchecked on an untouched field instead of looking pre-opted-in before
  // there's anything to include.
  function fieldHasValue(field) {
    var custom = (field.customValue || "").trim();
    if (custom) return true;
    var value = (field.value || "").trim();
    return value !== "" && value.toLowerCase() !== "none";
  }

  // One field row: label, "Include in prompt" checkbox, dropdown, custom
  // value override. Shared by every mode.
  function renderField(entry, onChange) {
    var field = entry.field;

    var select = el("select", { class: "ph-field__select" });
    appendSelectOptions(select, field, field.value);
    select.addEventListener("change", function () {
      // A previously-typed custom value otherwise silently keeps winning —
      // resolveFieldValue checks customValue first — so picking a new
      // dropdown option would appear to do nothing until the custom text
      // was manually cleared first. Picking from the dropdown should always
      // take immediate, visible effect.
      onChange({ value: select.value, customValue: "" });
    });
    var selectId = "ph-field-" + select.getAttribute("data-ph-key");
    select.id = selectId;

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
    checkbox.checked = field.includeInPrompt !== false && fieldHasValue(field);
    checkbox.addEventListener("change", function () {
      onChange({ includeInPrompt: checkbox.checked });
    });

    // A real <label for> (not just a styled <span>) so screen readers
    // announce "Color Scheme" etc. when the select itself gets focus.
    var labelRow = el("div", { class: "ph-field__label-row" }, [
      el("label", { class: "ph-field__label", for: selectId, text: entry.label }),
      el("label", { class: "ph-field__include" }, [checkbox, el("span", { text: "Include in prompt" })]),
    ]);

    return el("div", { class: "ph-field" }, [labelRow, select, customInput]);
  }

  // Color Scheme's own option strings -> a CSS background (solid color or
  // gradient) for a live preview swatch. Native <select> can't show a
  // swatch per-option cross-browser, so this shows one swatch that
  // updates to match whatever's currently selected — still a real visual
  // upgrade over plain text in a dropdown.
  var COLOR_SWATCH_MAP = {
    black: "#000000", white: "#ffffff", brown: "#8B4513", red: "#DC2626",
    yellow: "#FBBF24", blue: "#2563EB", green: "#16A34A", teal: "#0D9488",
    purple: "#7C3AED", pink: "#EC4899", orange: "#F97316",
    tan: "#D2B48C", gray: "#9CA3AF", "grayscale monochrome": "linear-gradient(90deg,#000,#fff)",
    "cream neutral": "#F5F0E6", "soft beige": "#E8DCC8",
    "red/fire": "linear-gradient(90deg,#DC2626,#F97316)", sunset: "linear-gradient(90deg,#F97316,#EC4899,#7C3AED)",
    "copper/bronze": "#B87333", "desert clay": "#C97B4A",
    forest: "#228B22", ocean: "#1E6091", "ice blue": "#A5F3FC", mint: "#6EE7B7",
    rainbow: "linear-gradient(90deg,#DC2626,#F97316,#FBBF24,#16A34A,#2563EB,#7C3AED)",
    "candy bright multicolor": "linear-gradient(90deg,#EC4899,#FBBF24,#6EE7B7)",
    "vibrant multicolor": "linear-gradient(90deg,#DC2626,#2563EB,#16A34A,#F97316)",
    "pastel multicolor": "linear-gradient(90deg,#FBCFE8,#BFDBFE,#FDE68A)",
    "tropical brights": "linear-gradient(90deg,#F97316,#16A34A,#EC4899)",
    "lime green": "#84CC16",
    gold: "#D4AF37", "champagne gold": "#E8D3A2", "silver/chrome": "linear-gradient(90deg,#e8e8e8,#a8a8a8,#e8e8e8)",
    "emerald jewel": "#046307", "rose gold": "#B76E79", "sapphire blue": "#0F52BA",
    opal: "linear-gradient(90deg,#F5F0E6,#D4C5E8,#C5E8DC)",
    "pastel gradient": "linear-gradient(90deg,#FBCFE8,#E8D3F5,#BFDBFE)",
    "purple mix": "linear-gradient(90deg,#7C3AED,#A78BFA,#4C1D95)",
    "bold gradient blend": "linear-gradient(90deg,#DC2626,#EC4899,#7C3AED,#2563EB)",
    "neon mix": "linear-gradient(90deg,#F0F,#0FF,#FF0)",
    "holographic rainbow": "linear-gradient(90deg,#F0F,#0FF,#FF0,#F97316,#EC4899)",
    // Brand Kit's own smaller color list — charcoal/cream/navy/etc. aren't
    // in Text Mode's Color Scheme groups above, so they need their own
    // entries here rather than reusing those.
    charcoal: "#36454F", "cream/ivory": "#FFFDD0", navy: "#1E3A5F",
    burgundy: "#6D2130", emerald: "#046307", "sage green": "#9CAF88",
    terracotta: "#C1622D", "blush pink": "#F4C2C2", "dusty rose": "#C08081",
    beige: "#E8DCC8", "warm gray": "#A39B8B", "cool gray": "#A9B2B8",
  };

  var HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  // Wraps renderField with a live color swatch inserted next to the
  // select — used for Color Scheme fields and Brand Kit's own color
  // fields (flagged via entry.isColorSwatch), not fields generally. Also
  // recognizes a typed hex code directly, so someone who types their
  // brand's exact hex still gets a real swatch instead of just plain text.
  function renderColorSwatchField(entry, onChange) {
    var fieldEl = renderField(entry, onChange);
    var select = fieldEl.querySelector("select");
    var resolvedValue = ((entry.field.customValue || "").trim() || entry.field.value || "").toLowerCase();
    var bg = HEX_COLOR_PATTERN.test(resolvedValue) ? resolvedValue : COLOR_SWATCH_MAP[resolvedValue];
    var swatch = el("span", { class: "ph-color-swatch" + (bg ? "" : " ph-color-swatch--empty"), "aria-hidden": "true" });
    if (bg) swatch.style.background = bg;
    var row = el("div", { class: "ph-color-swatch-row" }, [swatch, select]);
    fieldEl.insertBefore(row, fieldEl.querySelector(".ph-field__custom"));
    return fieldEl;
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
    var inputId = "ph-field-" + input.getAttribute("data-ph-key");
    input.id = inputId;
    return el("div", { class: "ph-field" }, [
      el("div", { class: "ph-field__label-row" }, [el("label", { class: "ph-field__label", for: inputId, text: entry.label })]),
      input,
    ]);
  }

  // Opt-in sub-panel: a checkbox that reveals a field group when checked.
  // Shared shape for Character's Companion and Text's Second Phrase.
  function renderSubPanel(headerText, isChecked, onToggle, renderContent, tooltip, eyebrow) {
    var toggle = el("input", { type: "checkbox", class: "ph-subpanel__toggle" });
    toggle.checked = isChecked;
    toggle.addEventListener("change", function () {
      onToggle(toggle.checked);
    });
    var header = el("label", { class: "ph-subpanel__header" }, [toggle, el("span", { text: headerText })]);
    if (tooltip) header.title = tooltip;
    // Optional design-system eyebrow label above the toggle (Companion /
    // Make it a Video) — the white-box encasing per docs/haus-design-system.md.
    var children = [];
    if (eyebrow) children.push(el("p", { class: "hds-encase__eyebrow", text: eyebrow }));
    children.push(header);
    var panel = el("div", { class: "ph-subpanel" }, children);
    if (isChecked) panel.appendChild(renderContent());
    return panel;
  }

  // Shared "up to 3 companions" section — used by both Character Mode
  // (a single character's own pet) and Couples Mode (a shared pool for
  // the couple). One checkbox turns the feature on/off (slot 1); once on,
  // a "+ Add another companion" button reveals slots 2/3 progressively
  // rather than always showing 3 empty slots for the common single-pet
  // case.
  function renderCompanionSection(options) {
    return renderSubPanel(
      "Add a Companion",
      options.count > 0,
      function (checked) {
        options.onToggleInclude(checked);
        renderApp();
      },
      function () {
        var wrap = el("div");
        for (var i = 0; i < options.count; i++) {
          (function (index) {
            var slot = options.slots[index];
            var prefix = options.count > 1 ? "Companion " + (index + 1) : "Companion";
            wrap.appendChild(
              renderFieldGroup(
                prefix + " Type",
                [{ fieldName: "category", label: prefix + " Category", field: slot.category }],
                function (entry, changes) {
                  options.onUpdateCategory(index, changes);
                  renderApp();
                },
                "Pick a category to reveal that category's own Breed/Type options."
              )
            );
            if (PromptHaus.engine.resolveFieldValue(slot.category)) {
              wrap.appendChild(
                renderFieldGroup(
                  prefix + " Details",
                  [
                    { fieldName: "breed", label: prefix + " Breed/Type", field: slot.breed },
                    { fieldName: "color", label: prefix + " Color", field: slot.color },
                    { fieldName: "eyeColor", label: prefix + " Eye Color", field: slot.eyeColor },
                    { fieldName: "size", label: prefix + " Size", field: slot.size },
                    { fieldName: "position", label: prefix + " Position", field: slot.position },
                    { fieldName: "accessories", label: prefix + " Accessories", field: slot.accessories },
                  ],
                  function (entry, changes) {
                    options.onUpdateField(index, entry.fieldName, changes);
                    renderApp();
                  },
                  "Breed/type, coloring, eye color, size, where it's positioned, and any accessories it's wearing."
                )
              );
            }
            // Removes this specific slot (not just whichever was added
            // last) — everything after it shifts down to fill the gap, so
            // removing Companion 1 out of 3 keeps 2 and 3's info intact
            // instead of forcing a full delete-and-redo.
            var removeSlotBtn = el("button", {
              type: "button",
              class: "ph-btn ph-btn--small ph-btn--delete ph-companion__slot-remove",
              text: "Remove " + prefix,
            });
            removeSlotBtn.addEventListener("click", function () {
              options.onRemoveSlot(index);
              renderApp();
            });
            wrap.appendChild(removeSlotBtn);
          })(i);
        }
        if (options.count < options.maxCount) {
          var addBtn = el("button", {
            type: "button",
            class: "ph-btn ph-btn--small ph-btn--add",
            text: "+ Add another companion (" + (options.count + 1) + " of " + options.maxCount + ")",
          });
          addBtn.addEventListener("click", function () {
            options.onSetCount(options.count + 1);
            renderApp();
          });
          wrap.appendChild(el("div", { class: "ph-companion__controls" }, [addBtn]));
        }
        return wrap;
      },
      options.helpText,
      "Companion"
    );
  }

  // Family Mode's Adults/Kids — same progressive add/remove pattern as
  // Companion (start at 0, "+ Add" pill up to the max, each slot with its
  // own Remove), just with a full Identity/Appearance/Styling field set
  // per slot instead of Companion's lighter 5 fields. One generic helper
  // parameterized by group so Adults and Kids don't duplicate the
  // add/remove wiring.
  function renderPersonSlotSection(options) {
    // Same fieldset/legend treatment as Extras/Style/etc (not a bare
    // heading outside any box) so Adults/Kids read as the same kind of
    // section as everything else on the page.
    var wrap = el("fieldset", { class: "ph-field-group ph-panel__person-slots" });
    wrap.appendChild(el("legend", { class: "ph-field-group__title" }, [icon(options.icon), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "ph-field-group__subtitle", text: options.subtitle }));

    for (var i = 0; i < options.count; i++) {
      (function (index) {
        var slot = options.slots[index];
        var prefix = options.count > 1 ? options.singular + " " + (index + 1) : options.singular;

        function entriesFor(labels) {
          return Object.keys(labels).map(function (fieldName) {
            return { fieldName: fieldName, label: labels[fieldName], field: slot[fieldName] };
          });
        }
        function handleChange(entry, changes) {
          options.onUpdateField(index, entry.fieldName, changes);
          renderApp();
        }

        var slotBox = el("div", { class: "ph-panel--person" });
        slotBox.appendChild(el("h5", { class: "ph-person__title", text: prefix }));
        slotBox.appendChild(renderPlainFieldRow(entriesFor(options.identityLabels), handleChange));
        slotBox.appendChild(renderPlainFieldRow(entriesFor(options.appearanceLabels), handleChange));
        slotBox.appendChild(renderPlainFieldRow(entriesFor(options.stylingLabels), handleChange));

        var removeBtn = el("button", {
          type: "button",
          class: "ph-btn ph-btn--small ph-btn--delete ph-companion__slot-remove",
          text: "Remove " + prefix,
        });
        removeBtn.addEventListener("click", function () {
          options.onRemoveSlot(index);
          renderApp();
        });
        slotBox.appendChild(removeBtn);
        wrap.appendChild(slotBox);
      })(i);
    }

    if (options.count < options.maxCount) {
      var addBtn = el("button", {
        type: "button",
        class: "ph-btn ph-btn--small ph-btn--add",
        text: "+ Add " + (options.count > 0 ? "another " : options.article + " ") + options.singular.toLowerCase() + " (" + (options.count + 1) + " of " + options.maxCount + ")",
      });
      addBtn.addEventListener("click", function () {
        options.onSetCount(options.count + 1);
        renderApp();
      });
      wrap.appendChild(el("div", { class: "ph-companion__controls" }, [addBtn]));
    }

    return wrap;
  }

  // Shared Yes/No pill toggle — used by Buffer/Padding (Style DNA bar).
  function yesNoButton(label, isActive, onClick) {
    var btn = el("button", {
      type: "button",
      class: "ph-styledna__yesno-btn" + (isActive ? " is-active" : ""),
      "aria-pressed": isActive ? "true" : "false",
      text: label,
    });
    btn.addEventListener("click", onClick);
    return btn;
  }

  function fieldRenderFn(entry) {
    if (entry.field.isFreeText) return renderFreeTextField;
    if (entry.fieldName === "colorScheme" || entry.isColorSwatch) return renderColorSwatchField;
    return renderField;
  }

  function renderFieldGroup(title, entries, onChange, subtitle) {
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(
        renderFn(entry, function (changes) {
          onChange(entry, changes);
        })
      );
    });
    var titleIcon = TITLE_ICONS[title];
    var legend = titleIcon
      ? el("legend", { class: "ph-field-group__title" }, [icon(titleIcon), el("span", { text: title })])
      : el("legend", { class: "ph-field-group__title", text: title });
    var children = [legend];
    if (subtitle) children.push(el("p", { class: "ph-field-group__subtitle", text: subtitle }));
    children.push(fieldsContainer);
    return el("fieldset", { class: "ph-field-group" }, children);
  }

  // Same field-row rendering as renderFieldGroup, minus the wrapping
  // <fieldset>/legend/border — for stitching several logical groups of
  // fields into one continuous section (e.g. Custom Vanity Plates) instead
  // of nesting a bordered box inside another bordered box, which reads as
  // separate, disconnected sections and makes it easy to miss fields.
  function renderPlainFieldRow(entries, onChange) {
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(
        renderFn(entry, function (changes) {
          onChange(entry, changes);
        })
      );
    });
    return fieldsContainer;
  }

  // Wraps exactly one grouped (optionGroups) field in a titled fieldset
  // using the pill-toggle + scoped-dropdown widget — Style's Character
  // Type is the only occupant of its section in every mode now that Art
  // Finish moved into Filter & Finish below.
  function renderPillFieldGroup(title, stateKey, entry, iconMap, onChange, subtitle) {
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    fieldsContainer.appendChild(renderGroupedPillField(stateKey, entry, iconMap, onChange));
    var titleIcon = TITLE_ICONS[title];
    var legend = titleIcon
      ? el("legend", { class: "ph-field-group__title" }, [icon(titleIcon), el("span", { text: title })])
      : el("legend", { class: "ph-field-group__title", text: title });
    var children = [legend];
    if (subtitle) children.push(el("p", { class: "ph-field-group__subtitle", text: subtitle }));
    children.push(fieldsContainer);
    return el("fieldset", { class: "ph-field-group" }, children);
  }

  // Filter lives in shared Style DNA (one value, same as Holiday/Theme/
  // Niche), but renders inside each mode's own panel instead of the dark
  // bar — it's a rendering/finish choice, not a production/output setting
  // like Aspect Ratio or Target Platform. Art Finish moved in here from
  // Style (owner's call) since both are "how should this actually look
  // once rendered" choices — artFinishEntry/onChange/stateKey are omitted
  // by any mode that has no Art Finish field of its own.
  function renderFilterAndFinishFieldGroup(artFinishEntry, artFinishStateKey, artFinishOnChange) {
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    fieldsContainer.appendChild(
      renderField({ label: "Filter", field: PromptHaus.styleDNA.getState().filter }, function (changes) {
        PromptHaus.styleDNA.updateFilterField(changes);
        renderApp();
      })
    );
    if (artFinishEntry) {
      fieldsContainer.appendChild(el("p", { class: "ph-art-finish__heading", text: "Art Finish" }));
      fieldsContainer.appendChild(el("p", { class: "ph-art-finish__subtitle", text: "The material/rendering finish — pick one core finish rather than stacking several." }));
      fieldsContainer.appendChild(
        renderGroupedPillField(artFinishStateKey, artFinishEntry, ART_FINISH_BUCKET_ICONS, artFinishOnChange)
      );
    }
    var titleIcon = TITLE_ICONS["Filter & Finish"];
    var legend = titleIcon
      ? el("legend", { class: "ph-field-group__title" }, [icon(titleIcon), el("span", { text: "Filter & Finish" })])
      : el("legend", { class: "ph-field-group__title", text: "Filter & Finish" });
    var subtitle = "A photo-style post-processing look (black and white, sepia, vintage, etc.), plus the material/rendering finish for the illustration.";
    return el("fieldset", { class: "ph-field-group" }, [legend, el("p", { class: "ph-field-group__subtitle", text: subtitle }), fieldsContainer]);
  }

  // Concept • Creative Direction — Holiday/Creative Theme/Niche/Target
  // Audience/Mood, relocated out of the dark Project Setup bar into a
  // normal field-group box (same look as Style) so each one gets the
  // standard dropdown + "type your own" + "include in prompt" treatment
  // every other field already has, instead of a bare plain-select. Shared
  // Style DNA state, same as Filter & Finish above — rendered identically in
  // every mode's own panel.
  var CONCEPT_FIELD_UPDATERS = {
    holiday: "updateHolidayField",
    theme: "updateThemeField",
    niche: "updateNicheField",
    targetAudience: "updateTargetAudienceField",
    mood: "updateMoodField",
  };
  function renderConceptBox() {
    var styleDNAState = PromptHaus.styleDNA.getState();
    return renderFieldGroup(
      "Concept • Creative Direction",
      [
        { fieldName: "holiday", label: "Holiday", field: styleDNAState.holiday },
        { fieldName: "theme", label: "Creative Theme", field: styleDNAState.theme },
        { fieldName: "niche", label: "Niche", field: styleDNAState.niche },
        { fieldName: "targetAudience", label: "Target Audience", field: styleDNAState.targetAudience },
        { fieldName: "mood", label: "Mood", field: styleDNAState.mood },
      ],
      function (entry, changes) {
        PromptHaus.styleDNA[CONCEPT_FIELD_UPDATERS[entry.fieldName]](changes);
        renderApp();
      },
      "Optional creative direction, shared across every mode — for best results, pick up to 2 of these rather than stacking all 5."
    );
  }

  // Like renderField, but adds a quantity number input ("3x sparkles") —
  // shared by Graphics Mode's What Is It fields and the Imagery section
  // below, both of which let a single slot mean "3 of this."
  function renderWhatIsItField(entry, onChange) {
    var field = entry.field;

    var select = el("select", { class: "ph-field__select" });
    appendSelectOptions(select, field, field.value);
    select.addEventListener("change", function () {
      onChange({ value: select.value, customValue: "" });
    });
    var selectId = "ph-field-" + select.getAttribute("data-ph-key");
    select.id = selectId;

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
    checkbox.checked = field.includeInPrompt !== false && fieldHasValue(field);
    checkbox.addEventListener("change", function () {
      onChange({ includeInPrompt: checkbox.checked });
    });

    var labelRow = el("div", { class: "ph-field__label-row" }, [
      el("label", { class: "ph-field__label", for: selectId, text: entry.label }),
      el("label", { class: "ph-field__include" }, [checkbox, el("span", { text: "Include in prompt" })]),
    ]);

    return el("div", { class: "ph-field" }, [
      labelRow,
      select,
      customInput,
      el("label", { class: "ph-field__quantity-label" }, [el("span", { text: "Quantity" }), quantityInput]),
    ]);
  }

  // Imagery & Scene Elements — shared across every mode (Style DNA, same
  // as Holiday/Theme/Niche/Buffer), so it's rendered once here and dropped into
  // each mode's panel rather than reimplemented per mode. 2 widgets per
  // category (12 total) rather than one generic set of slots spanning
  // every category — each category's own options are more obvious grouped
  // under its own heading than mixed into one long combined dropdown.
  function renderImagerySection() {
    var styleDNA = PromptHaus.styleDNA;
    var allEntries = styleDNA.getImagerySlotEntries();
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    styleDNA.getImageryCategories().forEach(function (cat) {
      fieldsContainer.appendChild(el("p", { class: "ph-imagery__category-label", text: cat.label }));
      allEntries
        .filter(function (entry) {
          return entry.fieldName === cat.key + "1" || entry.fieldName === cat.key + "2";
        })
        .forEach(function (entry) {
          fieldsContainer.appendChild(
            renderWhatIsItField(entry, function (changes) {
              styleDNA.updateImagerySlot(entry.fieldName, changes);
              renderApp();
            })
          );
        });
    });
    return el("fieldset", { class: "ph-field-group" }, [
      el("legend", { class: "ph-field-group__title" }, [icon("image"), el("span", { text: "Imagery & Scene Elements" })]),
      el("p", {
        class: "ph-field-group__subtitle",
        text: "Spiritual, holiday, nature, sci-fi, fantasy, military/patriotic, sports, or urban elements integrated into the image — select up to 4 total.",
      }),
      fieldsContainer,
    ]);
  }

  // ---------------------------------------------------------------------
  // Character Mode panel
  // ---------------------------------------------------------------------
  // combinedMode: Combined Mode passes true, since several of Character's
  // own sections either duplicate fields Graphics already covers for the
  // one combined scene, or don't make sense once you're mixing three
  // modes into one prompt:
  //  - Starter Presets are a standalone-mode jumping-off point, not
  //    something that fits picking pieces from 3 modes at once.
  //  - Style (Character Type/Art Finish) is dropped entirely — Graphics's
  //    Style It (moved to the top of Combined) is the one overall style
  //    choice now, so the two can't contradict each other.
  //  - Presentation's Background/Dynamic Scene Effect/Lighting Effects/
  //    Framing and all of Extras duplicate Graphics's Frame It/What Is It.
  // Showing any of these would let a shopper fill in a value that then
  // silently gets dropped from the assembled prompt.

  // Character Mode's Video Motion Prompt companion — a collapsible
  // opt-in section (renderSubPanel, same pattern as "Add a Companion"),
  // with its own small field set and its own independent Copy button.
  // Deliberately does not re-describe the character/scene — image-to-
  // video tools take the already-rendered image as their visual
  // reference, so this only ever covers motion/camera/duration/audio.
  function renderCharacterVideoSection() {
    var video = PromptHaus.characterVideo;
    if (!video) return null;
    var state = video.getState();

    function handleChange(entry, changes) {
      video.updateField(entry.name, changes);
      renderApp();
    }

    return renderSubPanel(
      "Turn This Into a Video Prompt",
      state.enabled,
      function (checked) {
        video.setEnabled(checked);
        renderApp();
      },
      function () {
        var wrap = el("div", { class: "ph-character-video" });
        wrap.appendChild(el("p", { class: "ph-field-group__subtitle", text: "Builds a second, separate prompt for animating the image once it's rendered — for pasting into an image-to-video tool, not for the image prompt itself." }));

        // renderFreeTextField's placeholder is hard-coded to Text Mode's
        // own wording in this file (it doesn't read entry.placeholder) —
        // override it directly on the returned element rather than
        // showing Text Mode's placeholder here.
        var motionField = renderFreeTextField(
          { name: "motionDescription", label: "Motion / Action", field: state.motionDescription },
          function (changes) { handleChange({ name: "motionDescription" }, changes); }
        );
        motionField.querySelector("textarea").placeholder = "e.g. she takes a sip of her coffee and smiles";
        wrap.appendChild(motionField);

        wrap.appendChild(renderFieldGroup(
          "Video Settings",
          [
            { name: "targetTool", label: "Target Tool", field: state.targetTool },
            { name: "cameraMovement", label: "Camera Movement", field: state.cameraMovement },
            { name: "duration", label: "Duration", field: state.duration },
            { name: "audioType", label: "Audio", field: state.audioType },
            { name: "qualityDescriptor", label: "Quality", field: state.qualityDescriptor },
          ],
          handleChange
        ));

        if (PromptHaus.engine.resolveFieldValue(state.audioType) === "Dialogue / Voiceover") {
          var dialogueField = renderFreeTextField(
            { name: "dialogueText", label: "What's Said", field: state.dialogueText },
            function (changes) { handleChange({ name: "dialogueText" }, changes); }
          );
          dialogueField.querySelector("textarea").placeholder = "e.g. \"This is my favorite part of the morning.\"";
          wrap.appendChild(dialogueField);
        }

        var formatted = video.assemblePrompt().text;
        var textarea = el("textarea", { class: "ph-preview__text ph-character-video__text", readonly: "readonly" });
        textarea.value = formatted;
        wrap.appendChild(textarea);

        var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small" }, [icon("copy"), el("span", { class: "ph-btn__label", text: "Copy Video Prompt" })]);
        copyBtn.addEventListener("click", function () {
          copyTextToClipboard(formatted, function (ok) {
            var label = copyBtn.querySelector(".ph-btn__label");
            label.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { label.textContent = "Copy Video Prompt"; }, 1500);
          });
        });
        wrap.appendChild(copyBtn);

        return wrap;
      },
      "Generates a separate motion/camera/audio prompt for animating the rendered image in a tool like MidJourney, Kling, or Runway.",
      "Make it a Video"
    );
  }

  function renderCharacterPanel(combinedMode) {
    var character = PromptHaus.character;
    var state = character.getState();

    function handleFieldChange(entry, changes) {
      character.updateNestedField(entry.groupName, entry.fieldName, changes);
      renderApp();
    }

    var panel = el("div", { class: "ph-panel ph-panel--character" });

    if (!combinedMode) {
      var characterPresetRow = renderPresetRow(character.presets, function (preset) {
        preset.apply();
        renderApp();
      });
      if (characterPresetRow) panel.appendChild(characterPresetRow);
      panel.appendChild(renderConceptBox());
    }

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

    if (!combinedMode) {
      panel.appendChild(
        renderPillFieldGroup(
          "Character Style - Pick one core look",
          "character.characterType",
          { label: "Character Type", field: state.style.characterType },
          CHARACTER_TYPE_BUCKET_ICONS,
          function (entry, changes) { character.updateNestedField("style", "characterType", changes); renderApp(); },
          "The overall art style for this character."
        )
      );
      panel.appendChild(
        renderFilterAndFinishFieldGroup(
          { label: "Art Finish", field: state.style.artFinish },
          "character.artFinish",
          function (entry, changes) { character.updateNestedField("style", "artFinish", changes); renderApp(); }
        )
      );
    }

    // Character Archetype (renamed from Cosplay Character) rendered
    // alongside Identity (right next to Occupation/Niche) rather than off
    // in its own Extras fieldset — it's still stored under
    // `extras.characterArchetype`, just positioned closer to the other
    // "who is this character" fields. Skipped in Combined Mode along with
    // the rest of Extras, same reasoning as Presentation's overlap fields
    // — Graphics's own What Is It > Character/Creature is what actually
    // feeds the unified prompt there.
    var identityEntries = entriesFor(identityGroup, identityLabels);
    if (!combinedMode) {
      identityEntries = identityEntries.concat([
        { groupName: "extras", fieldName: "characterArchetype", label: "Character Archetype", field: state.extras.characterArchetype },
      ]);
    }
    panel.appendChild(
      renderFieldGroup(
        state.baseType === "animalMascot" ? "Character Identity - Animal Mode" : "Human Identity",
        identityEntries,
        handleFieldChange,
        "Who this character is — ethnicity/species, age, gender, body type, and occupation."
      )
    );
    panel.appendChild(
      renderFieldGroup(
        "Appearance",
        entriesFor("appearance", character.labels.appearance),
        handleFieldChange,
        "Hair, eyes, and facial features."
      )
    );
    panel.appendChild(
      renderFieldGroup(
        "Styling",
        entriesFor("styling", character.labels.styling),
        handleFieldChange,
        "Outfit, shoes, and accessories."
      )
    );

    // In Combined, Character's Presentation owns the whole-scene background/
    // scene-effect/lighting/framing (Graphics's Frame It is hidden + excluded
    // from the combined assembler), so these render here rather than vanishing
    // between the two panels.
    var presentationEntries = entriesFor("presentation", character.labels.presentation);
    var presentationSubtitle = "Pose, background, lighting, and framing for the scene.";
    panel.appendChild(renderFieldGroup("Presentation", presentationEntries, handleFieldChange, presentationSubtitle));

    panel.appendChild(
      renderCompanionSection({
        count: state.companions.count,
        slots: state.companions.slots,
        maxCount: character.MAX_COMPANIONS,
        onToggleInclude: function (checked) { character.toggleCompanionInclude(checked); },
        onSetCount: function (count) { character.setCompanionCount(count); },
        onUpdateCategory: function (index, changes) { character.updateCompanionSlotCategory(index, changes); },
        onUpdateField: function (index, fieldName, changes) { character.updateCompanionSlotField(index, fieldName, changes); },
        onRemoveSlot: function (index) { character.removeCompanionSlot(index); },
        helpText: "Adds up to 3 small pets/animals alongside the main character (e.g. a puppy in a purse) — separate from the Animal Mascot base type above, which replaces the character itself.",
      })
    );

    // Extras (fantasy elements + props) render in Combined too now, so they
    // carry into the combined scene instead of silently dropping. Archetype
    // stays out of this group (it lives in Identity above).
    var extrasLabelsMinusArchetype = Object.assign({}, character.labels.extras);
    delete extrasLabelsMinusArchetype.characterArchetype;
    panel.appendChild(
      renderFieldGroup(
        "Extras",
        entriesFor("extras", extrasLabelsMinusArchetype),
        handleFieldChange,
        "Optional fantasy elements or props to add to the scene."
      )
    );

    if (!combinedMode) {
      var videoSection = renderCharacterVideoSection();
      if (videoSection) panel.appendChild(videoSection);
    }

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
        handleFieldChange,
        "Who this person is — ethnicity/species, age, gender, body type, and occupation."
      )
    );
    // Makeup lives under `appearance` in state (moved up from Styling), but
    // Couples still shows it inside the gated "Makeup & Nails" subpanel
    // below rather than the main Appearance group — same optional-details
    // pattern as Nails.
    var appearanceLabelsMinusMakeup = Object.assign({}, PromptHaus.character.labels.appearance);
    delete appearanceLabelsMinusMakeup.makeup;
    panel.appendChild(
      renderFieldGroup(
        "Appearance",
        entriesFor("appearance", appearanceLabelsMinusMakeup, personState.appearance),
        handleFieldChange,
        "Hair, eyes, and facial features."
      )
    );

    var stylingLabelsMinusOptional = Object.assign({}, PromptHaus.character.labels.styling);
    delete stylingLabelsMinusOptional.nails;
    panel.appendChild(
      renderFieldGroup(
        "Styling",
        entriesFor("styling", stylingLabelsMinusOptional, personState.styling),
        handleFieldChange,
        "Outfit, shoes, and accessories."
      )
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
              { groupName: "appearance", fieldName: "makeup", label: "Makeup", field: personState.appearance.makeup },
              { groupName: "styling", fieldName: "nails", label: "Nails", field: personState.styling.nails },
            ],
            handleFieldChange,
            "Optional extra detail for this person's look."
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

    var couplesPresetRow = renderPresetRow(couples.presets, function (preset) {
      preset.apply();
      renderApp();
    });
    if (couplesPresetRow) panel.appendChild(couplesPresetRow);
    panel.appendChild(renderConceptBox());

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

    // Style + Filter & Finish first (the one overall look, shared by both
    // people), then Couple Dynamic (the shared scene/relationship), then
    // who's actually in the photo, then an optional shared Companion,
    // then Extras last.
    var allDynamicEntries = couples.getSceneFieldEntries().map(function (e) {
      return { fieldName: e.fieldName, label: e.label, field: e.field };
    });
    function dynamicEntriesFor(fieldNames) {
      return allDynamicEntries.filter(function (e) { return fieldNames.indexOf(e.fieldName) !== -1; });
    }

    panel.appendChild(
      renderPillFieldGroup(
        "Character Style - Pick one core look",
        "couples.characterType",
        { label: "Character Type", field: state.coupleDynamic.characterType },
        CHARACTER_TYPE_BUCKET_ICONS,
        function (changesEntry, changes) { handleDynamicChange({ fieldName: "characterType" }, changes); },
        "The overall art style — shared by both people."
      )
    );
    panel.appendChild(
      renderFilterAndFinishFieldGroup(
        { label: "Art Finish", field: state.coupleDynamic.artFinish },
        "couples.artFinish",
        function (changesEntry, changes) { handleDynamicChange({ fieldName: "artFinish" }, changes); }
      )
    );

    var scenePlusRelationshipFields = couples.PRESENTATION_FIELDS.concat(["relationshipVibe", "poseInteraction", "coordinationStyle"]);
    panel.appendChild(
      renderFieldGroup(
        "Couple Dynamic",
        dynamicEntriesFor(scenePlusRelationshipFields),
        handleDynamicChange,
        "Shared scene and relationship dynamic for both people — kept in one place so they can't contradict each other."
      )
    );

    panel.appendChild(
      el("div", { class: "ph-couples__people" }, [renderPersonPanel("A", "Character A"), renderPersonPanel("B", "Character B")])
    );

    panel.appendChild(
      renderCompanionSection({
        count: state.companions.count,
        slots: state.companions.slots,
        maxCount: couples.MAX_COMPANIONS,
        onToggleInclude: function (checked) { couples.toggleCompanionInclude(checked); },
        onSetCount: function (count) { couples.setCompanionCount(count); },
        onUpdateCategory: function (index, changes) { couples.updateCompanionSlotCategory(index, changes); },
        onUpdateField: function (index, fieldName, changes) { couples.updateCompanionSlotField(index, fieldName, changes); },
        onRemoveSlot: function (index) { couples.removeCompanionSlot(index); },
        helpText: "Adds up to 3 pets/animals shared by the couple (e.g. their 2 dogs) — not tied to either person individually.",
      })
    );

    panel.appendChild(
      renderFieldGroup(
        "Extras",
        dynamicEntriesFor(couples.EXTRAS_FIELDS),
        handleDynamicChange,
        "Optional fantasy elements or props to add to the scene."
      )
    );

    panel.appendChild(
      renderSubPanel(
        "Add Text",
        couples.getState().addText.include,
        function (checked) { couples.toggleAddTextInclude(checked); renderApp(); },
        function () {
          return renderFieldGroup(
            "Text Details",
            [{ fieldName: "text", label: "Text Content", field: couples.getState().addText.text }].concat(couples.getAddTextStyleEntries()),
            function (entry, changes) { couples.updateAddTextField(entry.fieldName, changes); renderApp(); },
            "What the text says, and how it's styled."
          );
        },
        "Layer lettering on top of the couple portrait."
      )
    );

    var couplesVideo = renderCharacterVideoSection();
    if (couplesVideo) panel.appendChild(couplesVideo);

    return panel;
  }

  // ---------------------------------------------------------------------
  // Friends & Family Mode panel
  // ---------------------------------------------------------------------
  // Style + Filter & Finish first (shared, one overall look), then who's
  // actually in the photo (Adults, then Kids — both progressive, up to
  // 2/4), then the shared Family Dynamic (scene + relationship framing),
  // then an optional shared Companion pool, then Add Text last — same
  // subject-before-scene flow Couples now follows, same section order
  // philosophy as every mode refined today.
  function renderFamilyPanel() {
    var family = PromptHaus.family;
    var state = family.getState();

    function handleDynamicChange(entry, changes) {
      family.updateFamilyDynamicField(entry.fieldName, changes);
      renderApp();
    }

    var panel = el("div", { class: "ph-panel ph-panel--family" });

    var familyPresetRow = renderPresetRow(family.presets, function (preset) {
      preset.apply();
      renderApp();
    });
    if (familyPresetRow) panel.appendChild(familyPresetRow);
    panel.appendChild(renderConceptBox());

    var allDynamicEntries = family.getFamilyDynamicFieldEntries();
    function dynamicEntriesFor(fieldNames) {
      return allDynamicEntries.filter(function (e) { return fieldNames.indexOf(e.fieldName) !== -1; });
    }

    panel.appendChild(
      renderPillFieldGroup(
        "Character Style - Pick one core look",
        "family.characterType",
        { label: "Character Type", field: state.familyDynamic.characterType },
        CHARACTER_TYPE_BUCKET_ICONS,
        function (changesEntry, changes) { handleDynamicChange({ fieldName: "characterType" }, changes); },
        "The overall art style — shared by the whole group."
      )
    );
    panel.appendChild(
      renderFilterAndFinishFieldGroup(
        { label: "Art Finish", field: state.familyDynamic.artFinish },
        "family.artFinish",
        function (changesEntry, changes) { handleDynamicChange({ fieldName: "artFinish" }, changes); }
      )
    );

    panel.appendChild(
      renderFieldGroup(
        "Friends & Family Dynamic",
        dynamicEntriesFor(["background", "dynamicSceneEffect", "timeEra", "cameraAngle", "lightingEffects", "framing", "relationshipVibe", "groupPose", "coordinationStyle"]),
        handleDynamicChange,
        "Shared scene and relationship framing for the whole group — kept in one place so everyone can't end up in contradictory scenes."
      )
    );

    panel.appendChild(
      renderPersonSlotSection({
        title: "Adults",
        icon: "people",
        subtitle: "Up to 5 — covers a single adult with kids, a two-parent household, a friend group with no kids at all, or any mix in between.",
        count: state.adults.count,
        slots: state.adults.slots,
        maxCount: family.MAX_ADULTS,
        singular: "Adult",
        article: "an",
        identityLabels: family.labels.identity,
        appearanceLabels: family.labels.appearance,
        stylingLabels: family.labels.styling,
        onUpdateField: function (index, fieldName, changes) { family.updatePersonField("adults", index, fieldName, changes); },
        onRemoveSlot: function (index) { family.removePersonSlot("adults", index); },
        onSetCount: function (count) { family.setPersonCount("adults", count); },
      })
    );

    panel.appendChild(
      renderPersonSlotSection({
        title: "Kids",
        icon: "people",
        subtitle: "Up to 5 — covers a couple's kids, a friend's kid tagging along, or a whole group of cousins. Each with its own Remove, so taking one out doesn't mean redoing the others.",
        count: state.kids.count,
        slots: state.kids.slots,
        maxCount: family.MAX_KIDS,
        singular: "Kid",
        article: "a",
        identityLabels: family.labels.identity,
        appearanceLabels: family.labels.appearance,
        stylingLabels: family.labels.styling,
        onUpdateField: function (index, fieldName, changes) { family.updatePersonField("kids", index, fieldName, changes); },
        onRemoveSlot: function (index) { family.removePersonSlot("kids", index); },
        onSetCount: function (count) { family.setPersonCount("kids", count); },
      })
    );

    panel.appendChild(
      renderCompanionSection({
        count: state.companions.count,
        slots: state.companions.slots,
        maxCount: family.MAX_COMPANIONS,
        onToggleInclude: function (checked) { family.toggleCompanionInclude(checked); },
        onSetCount: function (count) { family.setCompanionCount(count); },
        onUpdateCategory: function (index, changes) { family.updateCompanionSlotCategory(index, changes); },
        onUpdateField: function (index, fieldName, changes) { family.updateCompanionSlotField(index, fieldName, changes); },
        onRemoveSlot: function (index) { family.removeCompanionSlot(index); },
        helpText: "Adds up to 3 pets/animals shared by the group (e.g. the family dog) — not tied to any one person.",
      })
    );

    panel.appendChild(
      renderSubPanel(
        "Add Text",
        state.addText.include,
        function (checked) {
          family.toggleAddTextInclude(checked);
          renderApp();
        },
        function () {
          return renderFieldGroup(
            "Text Details",
            [{ fieldName: "text", label: "Text Content", field: state.addText.text }].concat(family.getAddTextStyleEntries()),
            function (entry, changes) {
              family.updateAddTextField(entry.fieldName, changes);
              renderApp();
            },
            "What the text says, and how it's styled."
          );
        },
        "Layer lettering on top of the group portrait."
      )
    );

    panel.appendChild(
      renderFieldGroup(
        "Extras",
        dynamicEntriesFor(["fantasyElements", "props", "characterArchetype"]),
        handleDynamicChange,
        "Optional fantasy elements or props to add to the scene."
      )
    );

    var familyVideo = renderCharacterVideoSection();
    if (familyVideo) panel.appendChild(familyVideo);

    return panel;
  }

  // ---------------------------------------------------------------------
  // Text Mode panel
  // ---------------------------------------------------------------------
  // combinedMode: Combined Mode passes true to hide Starter Presets — a
  // standalone-mode jumping-off point that doesn't fit picking pieces from
  // 3 modes at once.
  function renderTextPanel(combinedMode) {
    var text = PromptHaus.text;

    function handleFieldChange(entry, changes) {
      text.updateField(entry.fieldName, changes);
      renderApp();
    }

    var count = PromptHaus.styleDNA.getState().variationCount.value;
    var countLabel = count + (count === "1" ? " variation" : " variations");

    var panel = el("div", { class: "ph-panel ph-panel--text" });

    if (!combinedMode) {
      var textPresetRow = renderPresetRow(text.presets, function (preset) {
        preset.apply();
        renderApp();
      });
      if (textPresetRow) panel.appendChild(textPresetRow);
      panel.appendChild(renderConceptBox());
    }

    panel.appendChild(
      renderFieldGroup(
        "Core Style",
        text.getFixedEntries(),
        handleFieldChange,
        "Stays consistent across all " + countLabel + "."
      )
    );
    if (!combinedMode) panel.appendChild(renderFilterAndFinishFieldGroup(null, null, null));

    var state = text.getState();
    panel.appendChild(
      renderSubPanel(
        "Add a Second Phrase",
        state.accent.include,
        function (checked) {
          text.toggleAccentInclude(checked);
          renderApp();
        },
        function () {
          return renderFieldGroup(
            "Second Phrase Details",
            [
              { fieldName: "phrase", label: "Second Phrase Text", field: state.accent.phrase },
              { fieldName: "position", label: "Position", field: state.accent.position },
              { fieldName: "letterStyle", label: "Letter Style", field: state.accent.letterStyle },
              { fieldName: "colorScheme", label: "Color Scheme", field: state.accent.colorScheme },
              { fieldName: "textCase", label: "Text Case", field: state.accent.textCase },
              { fieldName: "textEffects", label: "Text Effects", field: state.accent.textEffects },
            ],
            function (entry, changes) {
              text.updateAccentField(entry.fieldName, changes);
              renderApp();
            },
            "Give this its own distinct look, with the same level of control as the main text. Leave Position as \"inline accent\" for calling out one word within your main text (e.g. \"Blessed\" in cursive gold inside \"Blessed Mama\") — pick Below/Above/Beside for a fully separate second line or phrase (e.g. \"Do You Trust Me\" / \"Well, Do Ya?\")."
          );
        },
        "Call out one word inline, or add a fully separate second line/phrase with its own typography — e.g. a call-and-response design."
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

    var positionSection = renderFieldGroup(
      "Character Position",
      [{ fieldName: "characterPosition", label: "Character Position", field: state.characterPosition }],
      function (entry, changes) {
        combined.updateField(entry.fieldName, changes);
        renderApp();
      },
      "Where the character sits relative to the text in the combined scene."
    );

    var panel = el("div", { class: "ph-panel ph-panel--combined" });

    var collectionPresetRow = renderPresetRow(
      combined.collectionPresets,
      function (preset) {
        preset.apply();
        renderApp();
      },
      "Collection Presets — sets Character, Text, and Graphics together"
    );
    if (collectionPresetRow) panel.appendChild(collectionPresetRow);
    panel.appendChild(renderConceptBox());

    // Style It (Illustrated/Realistic + Character Type/Art Finish or
    // Realistic Style) sits at the very top, above the Human/Animal
    // Mascot toggle — the one overall style choice for the whole combined
    // piece, so Character's own Style group (removed below) can't pick a
    // contradicting one.
    panel.appendChild(el("h4", { class: "ph-person__title", text: "Overall Style" }));
    panel.appendChild(renderGraphicsStyleItSection());
    panel.appendChild(el("h4", { class: "ph-person__title", text: "Character" }));
    panel.appendChild(renderCharacterPanel(true));
    panel.appendChild(positionSection);
    panel.appendChild(el("h4", { class: "ph-person__title", text: "Text" }));
    panel.appendChild(renderTextPanel(true));
    panel.appendChild(el("h4", { class: "ph-person__title", text: "Graphics" }));
    panel.appendChild(renderGraphicsPanel(true));
    return panel;
  }

  // One woven prompt: Character's full descriptors, Text's content/styling,
  // and Graphics's own descriptors all feed a single buildSentence() call,
  // so the result reads as one cohesive scene rather than three
  // disconnected ones a shopper would have to hand-composite.
  function renderCombinedPreview(root) {
    var combined = PromptHaus.combined;
    var styleDNAState = PromptHaus.styleDNA.getState();
    var platform = styleDNAState.targetPlatform.value;

    var assembled = combined.assembleUnifiedPrompt();
    var formatted = PromptHaus.engine.formatForPlatform(
      assembled,
      platform,
      styleDNAState.aspectRatio.value,
      buildCombinedNegativePrompt(),
      styleDNAState.outputFormat.value
    );

    var textarea = el("textarea", { class: "ph-preview__text", readonly: "readonly" });
    textarea.value = formatted;

    var actions = renderPreviewActions(
      formatted,
      function () {
        combined.randomize();
        renderApp();
      },
      function () {
        combined.reset();
        renderApp();
      },
      function () {
        var result = PromptHaus.favorites.save("combined", {
          text: formatted,
          platform: platform,
          title: buildVaultTitle("combined"),
          snapshot: buildVaultSnapshot("combined"),
        });
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
    ];
    var qualityNudge = renderQualityNudge(assembled);
    if (qualityNudge) previewChildren.push(qualityNudge);
    previewChildren.push(textarea, actions);
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

  // Style It — extracted so Combined Mode can render this once at the top
  // (above the Human/Animal Mascot toggle) as the one overall style choice
  // for the whole combined piece, instead of in its normal spot inside the
  // standalone Graphics panel.
  function renderGraphicsStyleItSection() {
    var graphics = PromptHaus.graphics;
    var state = graphics.getState();
    var fragment = el("div", { class: "ph-graphics-styleit" });

    fragment.appendChild(el("h4", { class: "ph-person__title", text: "Style It" }));
    fragment.appendChild(
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
      fragment.appendChild(
        renderFieldGroup(
          "Realistic Style",
          [{ fieldName: "realisticStyle", label: "Style", field: state.realisticStyle }],
          function (entry, changes) {
            graphics.updateRealisticStyle(changes);
            renderApp();
          },
          "The specific photography/rendering look for this graphic."
        )
      );
      fragment.appendChild(renderFilterAndFinishFieldGroup(null, null, null));
    } else {
      fragment.appendChild(
        renderPillFieldGroup(
          "Illustrated Style",
          "graphics.characterType",
          { label: "Character Type", field: state.illustrated.characterType },
          CHARACTER_TYPE_BUCKET_ICONS,
          function (entry, changes) { graphics.updateIllustratedField("characterType", changes); renderApp(); },
          "The overall art style — pick one core look rather than stacking several."
        )
      );
      fragment.appendChild(
        renderFilterAndFinishFieldGroup(
          { label: "Art Finish", field: state.illustrated.artFinish },
          "graphics.artFinish",
          function (entry, changes) { graphics.updateIllustratedField("artFinish", changes); renderApp(); }
        )
      );
    }

    return fragment;
  }

  // ---------------------------------------------------------------------
  // Graphics Mode panel
  // ---------------------------------------------------------------------
  // combinedMode: Combined Mode passes true to hide Starter Presets, What
  // Is It (Character's own Identity/Companion covers "who/what is
  // depicted"), and Style It (rendered once at the top of Combined
  // instead, as the one overall style choice) — leaving just Custom
  // Vanity Plates and Transportation here.
  // Transportation's category -> vehicle -> color cascade, as its own
  // helper so it can be dropped into the What Is It fieldset as a 5th
  // subject choice instead of living in its own separate section — a
  // category pill toggle first (keeps the 45-item catalog from becoming
  // one muddy dropdown), which reveals just that category's own Vehicle
  // dropdown, which in turn reveals Color once a vehicle is picked.
  // Clicking the active pill again clears the category (and Vehicle/
  // Color with it) so it's easy to back out entirely.
  function renderTransportationFields(graphics, state) {
    var fragment = [];
    var transportCategory = state.transportation.category.value;
    // A dropdown (not icon pills) — the 5 pills squished together and read
    // poorly; the category feeds the same "reveal that category's Vehicle
    // list" logic either way.
    fragment.push(
      renderFieldGroup(
        "Transportation",
        [{ fieldName: "category", label: "Category", field: state.transportation.category }],
        function (entry, changes) {
          graphics.updateTransportationCategory(changes);
          renderApp();
        },
        "Pick a category, then choose the specific vehicle below."
      )
    );
    if (transportCategory) {
      fragment.push(
        renderFieldGroup(
          "Vehicle",
          [{ fieldName: "type", label: "Vehicle", field: state.transportation.type }],
          function (entry, changes) {
            graphics.updateTransportationType(changes);
            renderApp();
          },
          "The specific vehicle within that category."
        )
      );
    }
    var transportationOn = PromptHaus.engine.resolveFieldValue(state.transportation.type);
    if (transportationOn) {
      fragment.push(
        renderFieldGroup(
          "Transportation Color",
          [{ fieldName: "color", label: "Color", field: state.transportation.color }],
          function (entry, changes) {
            graphics.updateTransportationColor(changes);
            renderApp();
          },
          "The vehicle's paint/finish color."
        )
      );
    }
    return fragment;
  }

  function renderGraphicsPanel(combinedMode) {
    var graphics = PromptHaus.graphics;
    var state = graphics.getState();

    var panel = el("div", { class: "ph-panel ph-panel--graphics" });

    if (!combinedMode) {
      var graphicsPresetRow = renderPresetRow(graphics.presets, function (preset) {
        preset.apply();
        renderApp();
      });
      if (graphicsPresetRow) panel.appendChild(graphicsPresetRow);
      panel.appendChild(renderConceptBox());

      panel.appendChild(renderGraphicsStyleItSection());
    }

    if (!combinedMode) panel.appendChild(
      renderFieldGroup(
        "Frame It",
        graphics.getFrameItEntries(),
        function (entry, changes) {
          graphics.updateFrameItField(entry.fieldName, changes);
          renderApp();
        },
        "Background, lighting, and framing for the whole graphic."
      )
    );

    // What Is It — 5 simple category+quantity fields (hidden in Combined
    // Mode, same reasoning as Style It: Character's own Identity/Companion
    // covers "who/what is depicted" there), plus Transportation folded in
    // as a 6th subject choice. Transportation always renders regardless of
    // combinedMode — Combined has no equivalent "vehicle" field anywhere
    // else, so it stays available even with the other 5 hidden.
    var whatIsItFields = el("div", { class: "ph-field-group__fields" });
    if (!combinedMode) {
      graphics.getWhatIsItEntries().forEach(function (entry) {
        whatIsItFields.appendChild(
          renderWhatIsItField(entry, function (changes) {
            graphics.updateWhatIsItField(entry.fieldName, changes);
            renderApp();
          })
        );
      });
    }
    renderTransportationFields(graphics, state).forEach(function (node) {
      whatIsItFields.appendChild(node);
    });
    var whatIsItChildren = [el("legend", { class: "ph-field-group__title" }, [icon("sparkle"), el("span", { text: "What Is It" })])];
    if (!combinedMode) {
      whatIsItChildren.push(
        el("p", { class: "ph-field-group__subtitle", text: "Pro tip: pick ONE category for best results — mix two only if they genuinely combine (e.g. florals + an animal)." })
      );
    }
    whatIsItChildren.push(whatIsItFields);
    panel.appendChild(el("fieldset", { class: "ph-field-group" }, whatIsItChildren));

    // Custom Vanity Plates — one continuous section rather than nested
    // boxes-within-a-box (Plate Text used to get its own bordered
    // sub-section, then Vanity Plate Details another one below it), which
    // read as separate/disconnected and made it easy to miss fields that
    // were actually part of the same feature. Grouped into 3 rows: Vanity
    // Plate Type/Base Style/Plate Finish (the plate's own frame+finish),
    // Plate Text/Plate Text Color/Letter Style (what it says + how the
    // lettering looks), Top Accent/Bottom Accent/State-Region Theme (the
    // decorative extras).
    var hauteSection = el("fieldset", { class: "ph-field-group" });
    hauteSection.appendChild(el("legend", { class: "ph-field-group__title" }, [icon("gift"), el("span", { text: "Custom Vanity Plates" })]));
    hauteSection.appendChild(
      el("p", { class: "ph-field-group__subtitle", text: "Pick a Vanity Plate Type to unlock the frame, finish, text, and accent details." })
    );

    function handleHauteChange(entry, changes) {
      if (entry.fieldName === "vanityPlateType") graphics.updateVanityPlateType(changes);
      else if (entry.fieldName === "plateText") graphics.updatePlateText(changes);
      else if (entry.fieldName === "plateTextColor") graphics.updatePlateTextColor(changes);
      else graphics.updateHauteDetailField(entry.fieldName, changes);
      renderApp();
    }

    var vanityPlateOn = PromptHaus.engine.resolveFieldValue(state.haute.vanityPlateType);

    var row1 = [{ fieldName: "vanityPlateType", label: "Vanity Plate Type", field: state.haute.vanityPlateType }];
    if (vanityPlateOn) {
      row1.push({ fieldName: "baseStyle", label: "Base Style", field: state.haute.details.baseStyle });
      row1.push({ fieldName: "plateFinish", label: "Plate Finish", field: state.haute.details.plateFinish });
    }
    var row1El = renderPlainFieldRow(row1, handleHauteChange);
    row1El.children[0].title = "Picking any type here unlocks the plate text/frame/finish fields below.";
    hauteSection.appendChild(row1El);

    if (vanityPlateOn) {
      hauteSection.appendChild(
        renderPlainFieldRow(
          [
            { fieldName: "plateText", label: "Plate Text", field: state.haute.plateText },
            { fieldName: "plateTextColor", label: "Plate Text Color", field: state.haute.plateTextColor },
            { fieldName: "letterStyle", label: "Letter Style", field: state.haute.details.letterStyle },
          ],
          handleHauteChange
        )
      );
      hauteSection.appendChild(
        renderPlainFieldRow(
          [
            { fieldName: "topAccent", label: "Top Accent", field: state.haute.details.topAccent },
            { fieldName: "bottomAccent", label: "Bottom Accent", field: state.haute.details.bottomAccent },
            { fieldName: "stateTheme", label: "State/Region Theme", field: state.haute.details.stateTheme },
          ],
          handleHauteChange
        )
      );
    }
    panel.appendChild(hauteSection);

    // Video Motion companion — not in Combined (Combined suppresses the
    // per-mode motion prompt, same as it does for Character).
    if (!combinedMode) {
      var graphicsVideo = renderCharacterVideoSection();
      if (graphicsVideo) panel.appendChild(graphicsVideo);
    }

    return panel;
  }

  // ---------------------------------------------------------------------
  // Reference Mode panel
  // ---------------------------------------------------------------------
  // Two source types share this one section: "image" (upload + describe
  // it — the original behavior) or "prompt" (paste a prompt found
  // elsewhere as loose inspiration, not a copy). Both feed the exact same
  // downstream Style Adjustment/Presentation/Add Text fields; only the
  // seed content and assemblePrompt()'s intro sentence differ by branch.
  function renderSourceTypeToggle(currentSourceType, onSetImage, onSetPrompt) {
    return renderTwoOptionToggle([
      { isActive: currentSourceType === "image", icon: "upload", title: "Reference an Image", subtitle: "Upload + describe a photo", onClick: onSetImage },
      { isActive: currentSourceType === "prompt", icon: "document", title: "Reference a Prompt", subtitle: "Paste someone else's prompt", onClick: onSetPrompt },
    ]);
  }

  function renderReferenceSourceSection() {
    var reference = PromptHaus.reference;
    var state = reference.getState();

    var box = el("div", { class: "ph-reference-upload" });
    box.appendChild(
      el("p", { class: "ph-field-group__title" }, [icon("upload"), el("span", { text: "Reference Source" })])
    );
    box.appendChild(
      renderSourceTypeToggle(
        state.sourceType,
        function () { reference.setSourceType("image"); renderApp(); },
        function () { reference.setSourceType("prompt"); renderApp(); }
      )
    );
    box.appendChild(
      state.sourceType === "prompt" ? renderPromptReferenceSection(state) : renderImageReferenceColumns(state)
    );
    return box;
  }

  // Styled like the old Live-Link Mascot box (dashed outline, disclosure
  // text up top) — split into an image half and a description half. The
  // image never leaves the browser and is never analyzed; it's a visual
  // reminder for the shopper while they type their own description, which
  // is what actually feeds the prompt.
  function renderImageReferenceColumns(state) {
    var reference = PromptHaus.reference;
    var columns = el("div", { class: "ph-reference-upload__columns" });

    // Left half — image upload/preview. The disclaimer lives here (not
    // spanning the full width above both columns) so the description
    // column on the right starts higher, right under the title.
    var imageCol = el("div", { class: "ph-reference-upload__image" });
    imageCol.appendChild(
      el("p", {
        class: "ph-reference-upload__disclaimer",
        text: "Your reference image stays in your browser only — it's never uploaded, stored, or analyzed anywhere. It's just a visual reminder of what you're describing on the right.",
      })
    );
    var fileInput = el("input", { type: "file", accept: "image/*", class: "ph-reference-upload__file-input" });

    function handleFile(file) {
      if (!file || file.type.indexOf("image/") !== 0) return;
      var reader = new FileReader();
      reader.onload = function () {
        reference.setImage(reader.result, file.name);
        renderApp();
      };
      reader.readAsDataURL(file);
    }

    fileInput.addEventListener("change", function () {
      handleFile(fileInput.files[0]);
    });

    var removeBtn = null;
    if (state.image) {
      var img = el("img", { class: "ph-reference-upload__preview-img" });
      img.src = state.image;
      img.alt = state.imageName || "Reference image";
      imageCol.appendChild(el("div", { class: "ph-reference-upload__preview" }, [img]));
      // Rendered into the description column below, not here — sits to
      // the right of the image, under the description box.
      removeBtn = el("button", { type: "button", class: "ph-btn ph-btn--delete ph-btn--small", text: "Remove Image" });
      removeBtn.addEventListener("click", function () {
        reference.clearImage();
        renderApp();
      });
    } else {
      // role/tabindex + keydown so this is reachable and operable by
      // keyboard, not just drag-and-drop or mouse click.
      var dropZone = el("div", {
        class: "ph-reference-upload__dropzone",
        role: "button",
        tabindex: "0",
        "aria-label": "Upload a reference image",
      }, [
        icon("upload"),
        el("span", { text: "Drag & drop an image, or click to upload" }),
      ]);
      dropZone.addEventListener("click", function () {
        fileInput.click();
      });
      dropZone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });
      dropZone.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropZone.classList.add("is-dragover");
      });
      dropZone.addEventListener("dragleave", function () {
        dropZone.classList.remove("is-dragover");
      });
      dropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropZone.classList.remove("is-dragover");
        handleFile(e.dataTransfer.files[0]);
      });
      imageCol.appendChild(dropZone);
    }
    imageCol.appendChild(fileInput);

    // Right half — description (this is what actually feeds the prompt)
    var descCol = el("div", { class: "ph-reference-upload__description" });
    var descField = renderFreeTextField(
      { label: "Describe what's in your reference image", field: state.description },
      function (changes) {
        reference.updateDescription(changes);
        renderApp();
      }
    );
    var descTextarea = descField.querySelector("textarea");
    if (descTextarea) {
      descTextarea.rows = 5;
      descTextarea.placeholder = 'e.g. "A golden retriever sitting in a sunlit field, warm afternoon light, shallow depth of field"';
      descField.insertBefore(
        el("p", {
          class: "ph-reference-upload__hint",
          text: "Type your own description of the image, or copy and paste one from another source (like ChatGPT or another AI tool).",
        }),
        descTextarea
      );
    }
    if (state.image) {
      var readBtn = el("button", { type: "button", class: "ph-btn ph-btn--small ph-btn--add" }, [
        icon("sparkle"),
        el("span", { text: state.isReading ? "Reading image…" : "Read Image → Reverse Prompt" }),
      ]);
      readBtn.disabled = !!state.isReading;
      readBtn.title = "Reads your image with AI and writes a text prompt into the box below. No image is generated.";
      readBtn.addEventListener("click", function () { reference.readImageToReversePrompt(); renderApp(); });
      descCol.appendChild(readBtn);
      if (state.readError) descCol.appendChild(el("p", { class: "ph-generate-image__error", text: state.readError }));
    }
    descCol.appendChild(descField);
    if (removeBtn) descCol.appendChild(removeBtn);

    columns.appendChild(imageCol);
    columns.appendChild(descCol);

    return columns;
  }

  // Prompt branch — a single full-width free-text field for pasting a
  // prompt found elsewhere. No image upload here; the pasted text is the
  // entire seed. The anti-plagiarism instruction itself lives in
  // assemblePrompt()'s intro sentence (addressed to the receiving AI) —
  // this hint just reinforces that framing for the shopper up front.
  function renderPromptReferenceSection(state) {
    var reference = PromptHaus.reference;
    var box = el("div", { class: "ph-reference-upload__prompt" });
    var promptField = renderFreeTextField(
      { label: "Paste the Original Prompt", field: state.promptReference },
      function (changes) {
        reference.updatePromptReference(changes);
        renderApp();
      }
    );
    var promptTextarea = promptField.querySelector("textarea");
    if (promptTextarea) {
      promptTextarea.rows = 5;
      promptTextarea.placeholder = "e.g. a prompt you found in a Facebook group, an Etsy listing, or a paid prompt pack";
      promptField.insertBefore(
        el("p", {
          class: "ph-reference-upload__hint",
          text: "We'll use this only as loose creative direction — the assembled prompt explicitly tells the AI to produce an original result, not a copy of the wording below.",
        }),
        promptTextarea
      );
    }
    box.appendChild(promptField);
    return box;
  }

  // ---------------------------------------------------------------------
  // Collection Builder — not a field-building mode like the other 8;
  // it's a pure aggregation view. Holiday/Theme/Niche/Filter/Imagery/
  // Mockup/Buffer already live in shared Style DNA and apply to every
  // mode uniformly, so "lock a theme once, use it everywhere" is already
  // true the moment you set it in the bar above — what this adds is
  // generating several modes' prompts side by side in one place instead
  // of clicking through tabs one at a time to collect them yourself.
  // Each mode uses whatever's already set on its own tab; this doesn't
  // introduce a second copy of any mode's fields.
  // ---------------------------------------------------------------------

  // Mirrors the formatting renderPreview/renderCombinedPreview already
  // does for its own mode — duplicated here rather than factored out of
  // those two, since they're each already tested and working; a shared
  // refactor would touch both for a single new caller's benefit.
  function getFormattedPromptForMode(mode) {
    var styleDNAState = PromptHaus.styleDNA.getState();
    var platform = styleDNAState.targetPlatform.value;
    if (mode === "combined") {
      var combinedAssembled = PromptHaus.combined.assembleUnifiedPrompt();
      return PromptHaus.engine.formatForPlatform(combinedAssembled, platform, styleDNAState.aspectRatio.value, buildCombinedNegativePrompt(), styleDNAState.outputFormat.value);
    }
    var assembled = PromptHaus[mode].assemblePrompt();
    return PromptHaus.engine.formatForPlatform(assembled, platform, styleDNAState.aspectRatio.value, buildCombinedNegativePrompt(), styleDNAState.outputFormat.value);
  }

  function renderCollectionPanel() {
    var panel = el("div", { class: "ph-panel ph-panel--collection" });
    panel.appendChild(
      el("p", {
        class: "ph-field-group__subtitle",
        text: "This is where you can see all of your current prompts, or combine up to 3 of them into one. Each mode uses whatever's already set on its own tab, so build those out first. Holiday/Creative Theme/Niche/Target Audience/Mood are already shared across every mode, so setting those once below carries into every prompt automatically.",
      })
    );
    panel.appendChild(renderConceptBox());

    var allSelected = COLLECTION_ELIGIBLE_MODES.every(function (mode) { return !!collectionSelectedModes[mode]; });
    var selectAllBtn = el("button", {
      type: "button",
      class: "ph-btn ph-btn--small " + (allSelected ? "ph-btn--delete" : "ph-btn--add"),
      text: allSelected ? "Deselect All" : "Select All",
    });
    selectAllBtn.addEventListener("click", function () {
      COLLECTION_ELIGIBLE_MODES.forEach(function (mode) { collectionSelectedModes[mode] = !allSelected; });
      renderApp();
    });
    panel.appendChild(
      el("div", { class: "ph-faq__header" }, [el("h4", { class: "ph-faq__title", text: "View All" }), selectAllBtn])
    );
    var checklist = el("div", { class: "ph-collection__checklist" });
    COLLECTION_ELIGIBLE_MODES.forEach(function (mode) {
      var checkbox = el("input", { type: "checkbox", class: "ph-field__checkbox" });
      checkbox.checked = !!collectionSelectedModes[mode];
      checkbox.addEventListener("change", function () {
        collectionSelectedModes[mode] = checkbox.checked;
        renderApp();
      });
      checklist.appendChild(
        el("label", { class: "ph-collection__checklist-item" }, [
          checkbox,
          icon(MODE_ICONS[mode]),
          el("span", { text: MODE_LABELS[mode] }),
        ])
      );
    });
    panel.appendChild(checklist);

    var combineCount = COLLECTION_ELIGIBLE_MODES.filter(function (mode) { return collectionCombineSelectedModes[mode]; }).length;
    panel.appendChild(
      el("h4", { class: "ph-person__title", text: "Combine Prompts (choose up to " + COLLECTION_COMBINE_MAX + ")" })
    );
    var combineChecklist = el("div", { class: "ph-collection__checklist" });
    COLLECTION_ELIGIBLE_MODES.forEach(function (mode) {
      var checkbox = el("input", { type: "checkbox", class: "ph-field__checkbox" });
      checkbox.checked = !!collectionCombineSelectedModes[mode];
      checkbox.disabled = !checkbox.checked && combineCount >= COLLECTION_COMBINE_MAX;
      checkbox.addEventListener("change", function () {
        collectionCombineSelectedModes[mode] = checkbox.checked;
        renderApp();
      });
      combineChecklist.appendChild(
        el("label", { class: "ph-collection__checklist-item" }, [
          checkbox,
          icon(MODE_ICONS[mode]),
          el("span", { text: MODE_LABELS[mode] }),
        ])
      );
    });
    panel.appendChild(combineChecklist);

    return panel;
  }

  function renderCollectionPreview(root) {
    var selected = COLLECTION_ELIGIBLE_MODES.filter(function (mode) {
      return collectionSelectedModes[mode];
    });
    var combineSelected = COLLECTION_ELIGIBLE_MODES.filter(function (mode) {
      return collectionCombineSelectedModes[mode];
    });

    var container = el("div", { class: "ph-preview ph-collection" });
    container.appendChild(el("h3", { class: "ph-preview__title" }, [icon("document"), el("span", { text: "Your Collection" })]));

    if (combineSelected.length) {
      var combinedText = combineSelected
        .map(function (mode) { return MODE_LABELS[mode] + ": " + getFormattedPromptForMode(mode); })
        .join("\n\n");
      var combinedTextarea = el("textarea", { class: "ph-preview__text", readonly: "readonly" });
      combinedTextarea.value = combinedText;
      var combinedCopyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small", text: "Copy" });
      combinedCopyBtn.addEventListener("click", function () {
        copyTextToClipboard(combinedText, function (ok) {
          combinedCopyBtn.textContent = ok ? "Copied!" : "Copy failed";
          setTimeout(function () {
            combinedCopyBtn.textContent = "Copy";
          }, 1500);
        });
      });
      // Saved under its own "collection" bucket — a combined splice
      // doesn't belong to any single mode, so it can't land in that
      // mode's own Vault the way each individual card's Save button does.
      var combinedIsFull = PromptHaus.favorites.isFull("collection");
      var combinedSaveBtn = el("button", { type: "button", class: "ph-btn ph-btn--save ph-btn--small", text: "Save to Vault" });
      combinedSaveBtn.disabled = combinedIsFull;
      combinedSaveBtn.title = combinedIsFull
        ? "You have " + PromptHaus.favorites.MAX_PER_MODE + "/" + PromptHaus.favorites.MAX_PER_MODE + " combined prompts saved — delete one below to save another."
        : "Saves this combined splice into its own Vault, below.";
      combinedSaveBtn.addEventListener("click", function () {
        PromptHaus.favorites.save("collection", {
          text: combinedText,
          platform: PromptHaus.styleDNA.getState().targetPlatform.value,
          title: combineSelected.map(function (mode) { return MODE_LABELS[mode]; }).join(" + "),
        });
        renderApp();
      });
      container.appendChild(
        el("div", { class: "ph-collection__item ph-collection__item--combined" }, [
          el("h4", { class: "ph-collection__item-title" }, [icon("layers"), el("span", { text: "Combined Prompt (" + combineSelected.length + ")" })]),
          combinedTextarea,
          el("div", { class: "ph-collection__item-actions" }, [combinedCopyBtn, combinedSaveBtn]),
        ])
      );
    }

    if (!selected.length) {
      if (!combineSelected.length) {
        container.appendChild(el("p", { class: "ph-preview__subtitle", text: "Check one or more modes on the left to see their prompts here, together." }));
      }
      root.appendChild(container);
      return;
    }

    selected.forEach(function (mode) {
      var formatted = getFormattedPromptForMode(mode);
      var textarea = el("textarea", { class: "ph-preview__text", readonly: "readonly" });
      textarea.value = formatted;

      var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small", text: "Copy" });
      copyBtn.addEventListener("click", function () {
        copyTextToClipboard(formatted, function (ok) {
          copyBtn.textContent = ok ? "Copied!" : "Copy failed";
          setTimeout(function () {
            copyBtn.textContent = "Copy";
          }, 1500);
        });
      });

      var isFull = PromptHaus.favorites.isFull(mode);
      var saveBtn = el("button", { type: "button", class: "ph-btn ph-btn--save ph-btn--small", text: "Save to Vault" });
      saveBtn.disabled = isFull;
      saveBtn.title = isFull
        ? "You have " + PromptHaus.favorites.MAX_PER_MODE + "/" + PromptHaus.favorites.MAX_PER_MODE + " saved for " + MODE_LABELS[mode] + " — delete one there to save another."
        : "Saves this into " + MODE_LABELS[mode] + "'s own Vault, same as saving from that tab directly.";
      saveBtn.addEventListener("click", function () {
        PromptHaus.favorites.save(mode, {
          text: formatted,
          platform: PromptHaus.styleDNA.getState().targetPlatform.value,
          title: buildVaultTitle(mode),
          snapshot: buildVaultSnapshot(mode),
        });
        renderApp();
      });

      container.appendChild(
        el("div", { class: "ph-collection__item" }, [
          el("h4", { class: "ph-collection__item-title" }, [icon(MODE_ICONS[mode]), el("span", { text: MODE_LABELS[mode] })]),
          textarea,
          el("div", { class: "ph-collection__item-actions" }, [copyBtn, saveBtn]),
        ])
      );
    });

    root.appendChild(container);
  }

  // Each of the 3 creature slots renders as its own Category picker
  // (a select, not a pill toggle — 11 categories is too many to browse as
  // pills the way Transportation's 5 do), which reveals that category's
  // own Breed/Type options plus Gender/Colors/Outfit/Props/Accessories/
  // Attitude/Pose once picked — same "pick a thing, reveal the rest"
  // cascade as Companion's own upgraded Category -> Breed field.
  function renderCreatureSlot(index) {
    var animals = PromptHaus.animals;
    var creature = animals.getState().creatures[index];
    var wrap = el("div");

    wrap.appendChild(
      renderFieldGroup(
        "Creature " + (index + 1),
        [{ groupName: "creature", fieldName: "category", label: "Category", field: creature.category }],
        function (entry, changes) {
          animals.updateCreatureCategory(index, changes);
          renderApp();
        },
        "Pick a category to reveal that category's own Breed/Type and detail options."
      )
    );

    if (PromptHaus.engine.resolveFieldValue(creature.category)) {
      wrap.appendChild(
        renderFieldGroup(
          "Creature " + (index + 1) + " Details",
          animals.getCreatureFieldEntries(index),
          function (entry, changes) {
            animals.updateCreatureField(index, entry.fieldName, changes);
            renderApp();
          },
          "Breed/type, gender, up to 3 colors, outfit, props, accessories, attitude, and pose."
        )
      );
    }

    return wrap;
  }

  function renderAnimalsPanel() {
    var animals = PromptHaus.animals;
    var state = animals.getState();

    var panel = el("div", { class: "ph-panel ph-panel--animals" });
    panel.appendChild(renderConceptBox());

    for (var i = 0; i < animals.CREATURE_SLOT_COUNT; i++) {
      panel.appendChild(renderCreatureSlot(i));
    }

    panel.appendChild(
      renderPillFieldGroup(
        "Character Style - Pick one core look",
        "animals.characterType",
        { label: "Character Type", field: state.style.characterType },
        CHARACTER_TYPE_BUCKET_ICONS,
        function (entry, changes) { animals.updateStyleField("characterType", changes); renderApp(); },
        "The overall illustration style for this animal."
      )
    );
    panel.appendChild(
      renderFilterAndFinishFieldGroup(
        { label: "Art Finish", field: state.style.artFinish },
        "animals.artFinish",
        function (entry, changes) { animals.updateStyleField("artFinish", changes); renderApp(); }
      )
    );
    panel.appendChild(
      renderFieldGroup(
        "Frame It",
        animals.getFrameItEntries(),
        function (entry, changes) {
          animals.updateFrameItField(entry.fieldName, changes);
          renderApp();
        },
        "Background, scene effect, lighting, and framing for the whole portrait."
      )
    );

    panel.appendChild(
      renderSubPanel(
        "Add Text",
        state.addText.include,
        function (checked) {
          animals.toggleAddTextInclude(checked);
          renderApp();
        },
        function () {
          return renderFieldGroup(
            "Text Details",
            [{ fieldName: "text", label: "Text Content", field: state.addText.text }].concat(
              animals.getAddTextStyleEntries()
            ),
            function (entry, changes) {
              animals.updateAddTextField(entry.fieldName, changes);
              renderApp();
            },
            "What the text says, and how it's styled."
          );
        },
        "Layer lettering on top of the portrait."
      )
    );

    var animalsVideo = renderCharacterVideoSection();
    if (animalsVideo) panel.appendChild(animalsVideo);

    return panel;
  }

  function renderReferencePanel() {
    var reference = PromptHaus.reference;
    var state = reference.getState();

    var panel = el("div", { class: "ph-panel ph-panel--reference" });
    panel.appendChild(renderConceptBox());
    panel.appendChild(renderReferenceSourceSection());

    var activeSourceText = state.sourceType === "prompt" ? state.promptReference.value : state.description.value;
    if ((activeSourceText || "").trim()) {
      var regenerateBtn = el("button", { type: "button", class: "ph-btn ph-btn--regenerate ph-btn--small" }, [icon("sparkle"), el("span", { text: "Regenerate" })]);
      regenerateBtn.title = "Rerolls just a couple of key details (like Reimagined Style or Pose) — keeps your source text and everything else untouched.";
      regenerateBtn.addEventListener("click", function () {
        reference.regenerate();
        renderApp();
      });
      panel.appendChild(regenerateBtn);
    }

    panel.appendChild(
      renderPillFieldGroup(
        "Style Adjustment",
        "reference.characterType",
        { label: "Reimagined Style", field: state.styleAdjustment.characterType },
        CHARACTER_TYPE_BUCKET_ICONS,
        function (entry, changes) { reference.updateStyleAdjustmentField("characterType", changes); renderApp(); },
        "Reimagine your reference in a different style — e.g. turn a real photo into a watercolor illustration."
      )
    );
    panel.appendChild(
      renderFilterAndFinishFieldGroup(
        { label: "Art Finish", field: state.styleAdjustment.artFinish },
        "reference.artFinish",
        function (entry, changes) { reference.updateStyleAdjustmentField("artFinish", changes); renderApp(); }
      )
    );

    panel.appendChild(
      renderFieldGroup(
        "Presentation",
        reference.getPresentationEntries(),
        function (entry, changes) {
          reference.updatePresentationField(entry.fieldName, changes);
          renderApp();
        },
        "Pose, background, lighting, and framing for the recreated image."
      )
    );

    panel.appendChild(
      renderSubPanel(
        "Add Text",
        state.addText.include,
        function (checked) {
          reference.toggleAddTextInclude(checked);
          renderApp();
        },
        function () {
          return renderFieldGroup(
            "Text Details",
            [{ fieldName: "text", label: "Text Content", field: state.addText.text }].concat(
              reference.getAddTextStyleEntries()
            ),
            function (entry, changes) {
              reference.updateAddTextField(entry.fieldName, changes);
              renderApp();
            },
            "What the text says, and how it's styled."
          );
        },
        "Layer lettering on top of the recreated image."
      )
    );

    var referenceVideo = renderCharacterVideoSection();
    if (referenceVideo) panel.appendChild(referenceVideo);

    return panel;
  }

  // ---------------------------------------------------------------------
  // Shell: tabs, live preview, action buttons
  // ---------------------------------------------------------------------
  var MODE_ICONS = { character: "person", text: "text", couples: "heart", family: "people", combined: "layers", graphics: "image", reference: "upload", animals: "paw", collection: "document" };

  // Row 1 is the "build a subject" modes; row 2, after a light divider,
  // is the "work with an image or an existing prompt" modes — keeps the
  // tab bar from reading as one long undifferentiated strip now that
  // Collection Builder/Image/Prompt Reference sit alongside the subject modes.
  var TAB_ROW_1_MODES = ["character", "couples", "family", "animals", "text", "graphics", "combined"];
  var TAB_ROW_2_MODES = ["reference", "collection"];
  var TAB_INFO_TEXT = {
    reference: "Reference an image (upload + describe it) or a prompt you found elsewhere (paste it as loose inspiration, not a copy) and describe how you want it reimagined — a different art style, added text, or both.",
    collection: "See every mode's current prompt side by side, or combine up to 3 of them into one spliced-together prompt.",
  };

  function renderTabRow(modes, extraClass) {
    var row = el("div", { class: "ph-tabs" + (extraClass ? " " + extraClass : "") });
    modes.forEach(function (mode) {
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
      var item = el("span", { class: "ph-tabs__item" }, [btn]);
      if (TAB_INFO_TEXT[mode]) item.appendChild(infoIcon(TAB_INFO_TEXT[mode]));
      row.appendChild(item);
    });
    return row;
  }

  function renderTabs(root) {
    // One bordered box holding both rows — reads as a single cohesive
    // component instead of the divider rule between them, which looked
    // like a stray line once it was actually on the page.
    var box = el("div", { class: "ph-tabs-box" }, [
      renderTabRow(TAB_ROW_1_MODES),
      renderTabRow(TAB_ROW_2_MODES, "ph-tabs--row2"),
    ]);
    root.appendChild(box);
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
        { icon: "text", label: "Character Position", value: resolve(combo.characterPosition) || "Not set" },
      ];
    }
    if (mode === "graphics") {
      var gs = PromptHaus.graphics.getState();
      return [
        { icon: "image", label: "Style", value: gs.styleCategory === "realistic" ? "Realistic" : "Illustrated" },
        { icon: "gift", label: "Vanity Plate", value: resolve(gs.haute.vanityPlateType) || "None" },
      ];
    }
    if (mode === "reference") {
      var rs = PromptHaus.reference.getState();
      return [
        rs.sourceType === "prompt"
          ? { icon: "document", label: "Reference Prompt", value: (rs.promptReference.value || "").trim() ? "Pasted" : "Not pasted" }
          : { icon: "upload", label: "Reference Image", value: rs.image ? "Uploaded" : "Not uploaded" },
        { icon: "sparkle", label: "Reimagined Style", value: resolve(rs.styleAdjustment.characterType) || "Not set" },
      ];
    }
    if (mode === "animals") {
      var as = PromptHaus.animals.getState();
      var creatureCount = as.creatures.filter(function (c) {
        return resolve(c.category);
      }).length;
      return [
        { icon: "paw", label: "Creatures", value: creatureCount ? String(creatureCount) : "None set" },
        { icon: "image", label: "Style", value: resolve(as.style.characterType) || "Not set" },
      ];
    }
    return [];
  }

  // Read once — window.location.search doesn't change during the session
  // unless the page navigates.
  var sharedPromptText = readSharedPromptFromUrl();
  var sharedPromptDismissed = false;

  function renderSharedPromptBanner(root) {
    if (!sharedPromptText || sharedPromptDismissed) return;

    var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small" }, [icon("copy"), el("span", { class: "ph-btn__label", text: "Copy" })]);
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(sharedPromptText, function (ok) {
        var label = copyBtn.querySelector(".ph-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Copy";
        }, 1500);
      });
    });

    var dismissBtn = el("button", { type: "button", class: "ph-shared-banner__dismiss", "aria-label": "Dismiss", text: "×" });
    dismissBtn.title = "Dismiss";
    dismissBtn.addEventListener("click", function () {
      sharedPromptDismissed = true;
      renderApp();
    });

    root.appendChild(
      el("div", { class: "ph-shared-banner" }, [
        el("div", { class: "ph-shared-banner__header" }, [
          el("p", { class: "ph-shared-banner__title" }, [icon("share"), el("span", { text: "Someone shared this prompt with you" })]),
          dismissBtn,
        ]),
        el("p", { class: "ph-shared-banner__text", text: sharedPromptText }),
        copyBtn,
      ])
    );
  }

  // Persists across re-renders (module scope, not component state) so
  // toggling it and clicking a field don't fight each other. Defaults to
  // collapsed — expanded pushes the actual prompt preview too far down the
  // page once a build has more than a few selections. The toggle button
  // carries its own text label (not just an icon) so it reads as an
  // obvious "there's more here" affordance rather than a hidden control.
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

    var totalItemCount = groups.reduce(function (sum, g) {
      return sum + g.items.length;
    }, 0);
    var showLabel = totalItemCount > 0 ? "Show full list (" + totalItemCount + ")" : "Show full list";
    var eyeBtn = el("button", { type: "button", class: "ph-selections__eye-btn" }, [
      icon(briefExpanded ? "eyeOff" : "eye"),
      el("span", { text: briefExpanded ? "Hide full list" : showLabel }),
    ]);
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

  // "Less is more" nudge — the Tips panel already advises against maxing
  // out every field, but as passive text it's easy to skim past. This
  // turns that into a live, personalized nudge right above the prompt
  // someone's about to copy. assembled.fragments is exactly what ends up
  // in the final prompt for every mode (Character/Graphics/Combined/etc.
  // via buildSentence, Couples/Animals via their own manual
  // assembly — see each mode's own assemblePrompt()), so one threshold
  // works everywhere without needing a per-mode field count.
  var QUALITY_NUDGE_THRESHOLD = 15;
  function renderQualityNudge(assembled) {
    var count = (assembled.fragments || []).length;
    if (count <= QUALITY_NUDGE_THRESHOLD) return null;
    return el("div", { class: "ph-preview__nudge" }, [
      icon("warning", "ph-preview__nudge-icon"),
      el("span", { text: "Heads up: you've got " + count + " details selected — results tend to look cleaner with a more focused set (aim for 5-10)." }),
    ]);
  }

  // Shared button builder for the 2x2 action grid (Randomize/Copy/Save/
  // Reset) — same 4 actions everywhere, only the callbacks differ per mode.
  function renderPreviewActions(formatted, onRandomize, onReset, onSave, mode) {
    var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy" }, [icon("copy"), el("span", { class: "ph-btn__label", text: "Copy My Prompt" })]);
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn.querySelector(".ph-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Copy My Prompt";
        }, 1500);
      });
      PromptHaus.favorites.logRecent(mode, { text: formatted, platform: PromptHaus.styleDNA.getState().targetPlatform.value, snapshot: buildVaultSnapshot(mode) });
      refreshRecentLogPanel();
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
    saveBtn.addEventListener("click", function () {
      onSave();
      PromptHaus.favorites.logRecent(mode, { text: formatted, platform: PromptHaus.styleDNA.getState().targetPlatform.value, snapshot: buildVaultSnapshot(mode) });
    });

    var actionsGrid = el("div", { class: "ph-preview__actions" }, [randomizeBtn, copyBtn, saveBtn, resetBtn]);
    var exportRow = renderExportRow(formatted, mode);

    return el("div", {}, [actionsGrid, exportRow]);
  }

  // Share/Copy/Download/Print — a second cluster distinct from the 2x2
  // action grid above, since these are all "get this prompt out of the
  // tool" actions rather than "change what's in the tool" actions. Copy
  // duplicates the one in the grid above on purpose — convenient to have
  // right alongside Share/Download/Print without scrolling back up.
  function renderExportRow(formatted, mode) {
    var shareBtn = el("button", { type: "button", class: "ph-btn ph-btn--export" }, [icon("share"), el("span", { class: "ph-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows this exact prompt to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(formatted), function (ok) {
        var label = shareBtn.querySelector(".ph-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Share";
        }, 1500);
      });
    });

    var copyBtn2 = el("button", { type: "button", class: "ph-btn ph-btn--export" }, [icon("copy"), el("span", { class: "ph-btn__label", text: "Copy" })]);
    copyBtn2.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn2.querySelector(".ph-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Copy";
        }, 1500);
      });
    });

    var downloadBtn = el("button", { type: "button", class: "ph-btn ph-btn--export" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads this prompt as a .txt file.";
    downloadBtn.addEventListener("click", function () {
      downloadTextAsFile(formatted, "prompt-haus-" + mode + "-prompt.txt");
    });

    var printBtn = el("button", { type: "button", class: "ph-btn ph-btn--export" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of this prompt.";
    printBtn.addEventListener("click", function () {
      printPromptText(formatted);
    });

    return el("div", { class: "ph-preview__export-row" }, [shareBtn, copyBtn2, downloadBtn, printBtn]);
  }

  function renderPreview(root, assembled, modeApi, mode) {
    var styleDNAState = PromptHaus.styleDNA.getState();
    var platform = styleDNAState.targetPlatform.value;
    var formatted = PromptHaus.engine.formatForPlatform(
      assembled,
      platform,
      styleDNAState.aspectRatio.value,
      buildCombinedNegativePrompt(),
      styleDNAState.outputFormat.value
    );

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
        var result = PromptHaus.favorites.save(mode, {
          text: formatted,
          platform: platform,
          title: buildVaultTitle(mode),
          snapshot: buildVaultSnapshot(mode),
        });
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
    ];
    var qualityNudge = renderQualityNudge(assembled);
    if (qualityNudge) previewChildren.push(qualityNudge);
    previewChildren.push(textarea, actions);
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

  // Image generation was intentionally removed — Reference Mode is TEXT ONLY.
  // It reads an uploaded image into a reverse prompt (see
  // reference.readImageToReversePrompt, wired into the Description column) and
  // never generates or renders an image, so it can't incur any image-generation
  // cost. Kept as a no-op so the mode dispatch below needs no change.
  function renderGenerateImageSection() { /* intentionally empty — no image generation */ }

  // "Saved Prompts" — below the Live Prompt Preview, per mode (5 slots
  // each). Each entry keeps its own Copy/Delete so a saved prompt is
  // useful without needing to regenerate the fields that made it.
  function renderSavedPrompts(root, mode) {
    // Newest first (favorites.save() appends, so the raw list is
    // oldest-first) — matches Recently Generated's ordering, and means
    // the single item shown while collapsed is actually the most recent
    // one, not the oldest.
    var saved = PromptHaus.favorites.getAll(mode).slice().reverse();
    var max = PromptHaus.favorites.MAX_PER_MODE;

    var list = el("div", { class: "ph-saved__list" });
    if (!saved.length) {
      list.appendChild(el("p", { class: "ph-saved__empty", text: "Your vault is empty — use \"Save to Vault\" above." }));
    } else {
      var visible = vaultExpanded ? saved : saved.slice(0, 1);
      visible.forEach(function (fav, index) {
        // getCurrentVersion returns the item's own top-level fields
        // unchanged for anything saved before Version History existed —
        // no migration needed, old items just read as "one version."
        var currentVersion = PromptHaus.favorites.getCurrentVersion(fav);
        var versionCount = PromptHaus.favorites.getVersionCount(fav);
        var preview = currentVersion.text.length > 160 ? currentVersion.text.slice(0, 160) + "…" : currentVersion.text;

        var titleRow;
        if (renamingVaultId === fav.id) {
          var titleInput = el("input", { type: "text", class: "ph-saved__item-title-input", value: fav.title || "" });
          var confirmRename = function () {
            PromptHaus.favorites.rename(mode, fav.id, titleInput.value.trim() || ("Untitled " + (index + 1)));
            renamingVaultId = null;
            renderApp();
          };
          titleInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") confirmRename();
            if (e.key === "Escape") {
              renamingVaultId = null;
              renderApp();
            }
          });
          titleInput.addEventListener("blur", confirmRename);
          titleRow = el("div", { class: "ph-saved__item-title-row" }, [titleInput]);
        } else {
          var renameBtn = el("button", {
            type: "button",
            class: "ph-saved__rename-btn",
            "aria-label": "Rename this saved prompt",
            title: "Rename",
          }, [icon("edit")]);
          renameBtn.addEventListener("click", function () {
            renamingVaultId = fav.id;
            renderApp();
          });
          titleRow = el("div", { class: "ph-saved__item-title-row" }, [
            el("p", { class: "ph-saved__item-title", text: fav.title || "Untitled " + (index + 1) }),
            renameBtn,
          ]);
        }

        var loadBtn = null;
        if (currentVersion.snapshot) {
          loadBtn = el("button", { type: "button", class: "ph-btn ph-btn--load ph-btn--small", text: "Load" });
          loadBtn.title = "Restores every field in the builder to exactly how it was when this version was saved.";
          loadBtn.addEventListener("click", function () {
            loadVaultSnapshot(mode, currentVersion.snapshot);
            renderApp();
          });
        }

        var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small", text: "Copy" });
        copyBtn.addEventListener("click", function () {
          copyTextToClipboard(currentVersion.text, function (ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () {
              copyBtn.textContent = "Copy";
            }, 1500);
          });
        });

        // Adds whatever's CURRENTLY in the builder as a new version of
        // this item, instead of needing a separate Vault slot for every
        // tweak — reads the already-rendered preview textarea rather
        // than recomputing per-mode formatting logic a second time here
        // (Combined has its own extra formatting steps that
        // renderPreview/renderCombinedPreview already handled once, just
        // above this in the render order).
        var saveVersionBtn = el("button", { type: "button", class: "ph-btn ph-btn--small", text: "Save as New Version" });
        saveVersionBtn.title = "Adds the prompt you're currently building as a new version of this item — doesn't use up another Vault slot.";
        saveVersionBtn.addEventListener("click", function () {
          var textarea = document.querySelector(".ph-preview__text");
          if (!textarea || !textarea.value) return;
          PromptHaus.favorites.addVersion(mode, fav.id, {
            text: textarea.value,
            platform: PromptHaus.styleDNA.getState().targetPlatform.value,
            snapshot: buildVaultSnapshot(mode),
          });
          renderApp();
        });

        var deleteBtn = el("button", { type: "button", class: "ph-btn ph-btn--delete ph-btn--small", text: "Delete" });
        deleteBtn.title = versionCount > 1 ? "Deletes this item and all " + versionCount + " of its versions." : "Deletes this item.";
        deleteBtn.addEventListener("click", function () {
          PromptHaus.favorites.remove(mode, fav.id);
          renderApp();
        });

        var metaParts = [];
        if (currentVersion.platform) metaParts.push(currentVersion.platform);
        metaParts.push(new Date(currentVersion.createdAt).toLocaleDateString());

        var actionBtns = [];
        if (loadBtn) actionBtns.push(loadBtn);
        actionBtns.push(copyBtn, saveVersionBtn, deleteBtn);

        var itemChildren = [titleRow];

        if (versionCount > 1) {
          var versionSelect = el("select", { class: "ph-saved__version-select" });
          fav.versions.forEach(function (v, vi) {
            var isLatest = vi === fav.versions.length - 1;
            var optionNode = el("option", { value: String(vi) }, [document.createTextNode("Version " + (vi + 1) + (isLatest ? " (latest)" : ""))]);
            var activeIdx = typeof fav.activeVersionIndex === "number" ? fav.activeVersionIndex : fav.versions.length - 1;
            if (vi === activeIdx) optionNode.selected = true;
            versionSelect.appendChild(optionNode);
          });
          versionSelect.title = "Switch which saved version of this item you're viewing.";
          versionSelect.addEventListener("change", function () {
            PromptHaus.favorites.setActiveVersion(mode, fav.id, parseInt(versionSelect.value, 10));
            renderApp();
          });
          itemChildren.push(el("div", { class: "ph-saved__version-row" }, [icon("layers"), versionSelect]));
        }

        itemChildren.push(
          el("p", { class: "ph-saved__item-text", text: preview }),
          el("div", { class: "ph-saved__item-meta" }, [
            el("span", { class: "ph-saved__item-tag", text: metaParts.join(" · ") }),
            el("div", { class: "ph-saved__item-actions" }, actionBtns),
          ])
        );

        list.appendChild(el("div", { class: "ph-saved__item" }, itemChildren));
      });
    }

    var headerChildren = [el("h3", { class: "ph-saved__title" }, [icon("vault"), el("span", { text: "Your Vault (" + saved.length + "/" + max + ")" })])];
    if (saved.length > 1) {
      var vaultToggleBtn = el("button", { type: "button", class: "ph-faq__toggle" }, [
        icon(vaultExpanded ? "eyeOff" : "eye"),
        el("span", { text: vaultExpanded ? "Hide" : "Show full list" }),
      ]);
      vaultToggleBtn.addEventListener("click", function () {
        vaultExpanded = !vaultExpanded;
        renderApp();
      });
      headerChildren.push(vaultToggleBtn);
    }

    root.appendChild(
      el("div", { class: "ph-saved" }, [
        el("div", { class: "ph-faq__header" }, headerChildren),
        renderFullVaultExportRow(),
        list,
      ])
    );
  }

  // "Recently Generated" — an automatic safety net distinct from Your
  // Vault above: logged on Copy/Save clicks (see renderPreviewActions),
  // flat text only (no field snapshot — that's what Vault's deliberate
  // Save already covers), global across every mode rather than per-mode
  // slots, since it's just "what did I just do" not "what did I choose to
  // keep." Renders once, same place regardless of active mode.
  // Copy deliberately avoids a full renderApp() so its own "Copied!"
  // label swap survives (a full rebuild would replace copyBtn's DOM node
  // out from under that setTimeout callback). This does a narrow in-place
  // swap of just the Recently Generated panel instead, so it still
  // reflects the just-logged entry immediately without disturbing
  // anything else on the page — including Copy's own button.
  function refreshRecentLogPanel() {
    var existing = document.querySelector(".ph-recent");
    if (!existing) return;
    var captured = null;
    renderRecentLog({
      appendChild: function (node) {
        captured = node;
      },
    });
    if (captured) existing.replaceWith(captured);
  }

  function renderRecentLogItem(entry) {
    var preview = entry.text.length > 160 ? entry.text.slice(0, 160) + "…" : entry.text;

    var loadBtn = null;
    if (entry.snapshot) {
      loadBtn = el("button", { type: "button", class: "ph-btn ph-btn--load ph-btn--small", text: "Load" });
      loadBtn.title = "Restores every field in the builder to exactly how it was when this was generated.";
      loadBtn.addEventListener("click", function () {
        loadVaultSnapshot(entry.mode, entry.snapshot);
        activeMode = entry.mode;
        renderApp();
      });
    }

    var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(entry.text, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () {
          copyBtn.textContent = "Copy";
        }, 1500);
      });
    });

    var deleteBtn = el("button", { type: "button", class: "ph-btn ph-btn--delete ph-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () {
      PromptHaus.favorites.removeRecent(entry.id);
      renderApp();
    });

    var metaParts = [MODE_LABELS[entry.mode] || entry.mode];
    if (entry.platform) metaParts.push(entry.platform);
    metaParts.push(new Date(entry.loggedAt).toLocaleString());

    var actionBtns = [];
    if (loadBtn) actionBtns.push(loadBtn);
    actionBtns.push(copyBtn, deleteBtn);

    return el("div", { class: "ph-saved__item" }, [
      el("p", { class: "ph-saved__item-text", text: preview }),
      el("div", { class: "ph-saved__item-meta" }, [
        el("span", { class: "ph-saved__item-tag", text: metaParts.join(" · ") }),
        el("div", { class: "ph-saved__item-actions" }, actionBtns),
      ]),
    ]);
  }

  // Collapsed by default to just the single most recent entry (plus the
  // header/Clear All/description) so this doesn't compete for space with
  // Your Vault right above it — "Show all" reveals the rest, up to
  // RECENT_LOG_MAX.
  function renderRecentLog(root) {
    var recent = PromptHaus.favorites.getRecentLog();
    var list = el("div", { class: "ph-saved__list" });

    if (!recent.length) {
      list.appendChild(el("p", { class: "ph-saved__empty", text: "Nothing generated yet — this fills in automatically as you Copy or Save prompts." }));
    } else {
      var visible = recentLogExpanded ? recent : recent.slice(0, 1);
      visible.forEach(function (entry) {
        list.appendChild(renderRecentLogItem(entry));
      });
    }

    var headerChildren = [el("h3", { class: "ph-saved__title" }, [icon("refresh"), el("span", { text: "Recently Generated (" + recent.length + "/" + PromptHaus.favorites.RECENT_LOG_MAX + ")" })])];
    if (recent.length > 1) {
      var toggleBtn = el("button", { type: "button", class: "ph-faq__toggle" }, [
        icon(recentLogExpanded ? "eyeOff" : "eye"),
        el("span", { text: recentLogExpanded ? "Hide" : "Show all" }),
      ]);
      toggleBtn.addEventListener("click", function () {
        recentLogExpanded = !recentLogExpanded;
        renderApp();
      });
      headerChildren.push(toggleBtn);
    }

    var children = [el("div", { class: "ph-faq__header" }, headerChildren)];
    if (recent.length) {
      var clearBtn = el("button", { type: "button", class: "ph-btn ph-btn--delete ph-btn--small", text: "Clear All" });
      clearBtn.title = "Clears this automatic log — doesn't touch anything in Your Vault.";
      clearBtn.addEventListener("click", function () {
        PromptHaus.favorites.clearRecentLog();
        renderApp();
      });
      children.push(el("div", { class: "ph-recent__clear-row" }, [clearBtn]));
    }
    children.push(
      el("p", { class: "ph-field-group__subtitle", text: "Auto-saved on Copy/Save, most recent first — Load restores every field, same as Your Vault." }),
      list
    );

    root.appendChild(el("div", { class: "ph-saved ph-recent" }, children));
  }

  // Export/Share/Copy/Print for every saved item across every mode at
  // once — sits above the per-mode list since it isn't scoped to just
  // this tab's 5 slots. Hidden entirely when the vault has nothing in it
  // anywhere, since there'd be nothing to act on.
  function renderFullVaultExportRow() {
    var all = PromptHaus.favorites.getAllFlat();
    if (!all.length) return el("div", {});

    var fullText = buildFullVaultText();

    var shareBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("share"), el("span", { class: "ph-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows your entire saved vault to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(fullText), function (ok) {
        var label = shareBtn.querySelector(".ph-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Share";
        }, 1500);
      });
    });

    var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("copy"), el("span", { class: "ph-btn__label", text: "Copy" })]);
    copyBtn.title = "Copies every saved prompt across every mode as one block of text.";
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(fullText, function (ok) {
        var label = copyBtn.querySelector(".ph-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Copy";
        }, 1500);
      });
    });

    var downloadBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads every saved prompt across every mode as one .txt file.";
    downloadBtn.addEventListener("click", function () {
      downloadTextAsFile(fullText, "prompt-haus-full-vault.txt");
    });

    var printBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of your entire saved vault.";
    printBtn.addEventListener("click", function () {
      printPromptText(fullText);
    });

    return el("div", { class: "ph-saved__vault-export" }, [
      el("span", { class: "ph-saved__vault-export-label", text: "Export your whole vault (" + all.length + " saved):" }),
      el("div", { class: "ph-preview__export-row" }, [shareBtn, copyBtn, downloadBtn, printBtn]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Brand Kit ("My HAUS Style") — sits right under Your Vault, same on
  // every mode. Collapsed by default since it's a lot of fields; a kit's
  // own 5 category groups are a second, independent collapse inside it.
  // ---------------------------------------------------------------------
  function renderBrandKitSection(root) {
    var kits = PromptHaus.brandKit.getAllKits();
    var activeKit = PromptHaus.brandKit.getActiveKit();

    var titleText = "My HAUS Style — Brand Kit (" + kits.length + "/" + PromptHaus.brandKit.MAX_KITS + ")" + (activeKit ? " — " + activeKit.name + " active" : "");
    var headerChildren = [el("h3", { class: "ph-saved__title" }, [icon("brandKit"), el("span", { text: titleText })])];
    if (kits.length > 1) {
      var toggleBtn = el("button", { type: "button", class: "ph-faq__toggle" }, [
        icon(brandKitExpanded ? "eyeOff" : "eye"),
        el("span", { text: brandKitExpanded ? "Hide" : "Show full list" }),
      ]);
      toggleBtn.addEventListener("click", function () {
        brandKitExpanded = !brandKitExpanded;
        renderApp();
      });
      headerChildren.push(toggleBtn);
    }
    var section = el("div", { class: "ph-brandkit" }, [
      el("div", { class: "ph-faq__header" }, headerChildren),
    ]);

    section.appendChild(
      el("p", {
        class: "ph-brandkit__intro",
        text:
          "Save a signature look — colors, fonts, voice, style, and personality — and reuse it across every mode instead of re-picking your brand every time. Only one kit can be active at a time.",
      })
    );

    if (!kits.length) {
      section.appendChild(el("p", { class: "ph-saved__empty", text: 'Your Brand Kit vault is empty — create one below.' }));
    } else {
      // Collapsed by default to just the active kit (or the first one if none is active).
      var visibleKits = brandKitExpanded ? kits : [kits[activeKit ? kits.indexOf(activeKit) : 0] || kits[0]];
      visibleKits.forEach(function (kit) {
        section.appendChild(renderBrandKitCard(kit, !!activeKit && activeKit.id === kit.id));
      });
    }

    if (kits.length < PromptHaus.brandKit.MAX_KITS) {
      var nameInput = el("input", { type: "text", class: "ph-brandkit__new-input", placeholder: "New Brand Kit name…" });
      var createBtn = el("button", { type: "button", class: "ph-btn ph-btn--save ph-btn--small", text: "Create Brand Kit" });
      createBtn.addEventListener("click", function () {
        PromptHaus.brandKit.createKit(nameInput.value);
        renderApp();
      });
      section.appendChild(el("div", { class: "ph-brandkit__new-row" }, [nameInput, createBtn]));
    } else {
      section.appendChild(
        el("p", {
          class: "ph-saved__empty",
          text: "You have " + PromptHaus.brandKit.MAX_KITS + "/" + PromptHaus.brandKit.MAX_KITS + " Brand Kits saved — delete one to create another.",
        })
      );
    }

    if (kits.length) {
      section.appendChild(renderBrandKitExportRow());
    }

    root.appendChild(section);
  }

  function renderBrandKitExportRow() {
    var summaryText = PromptHaus.brandKit.buildAllKitsSummaryText();

    var shareBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("share"), el("span", { class: "ph-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows your saved Brand Kits to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(summaryText), function (ok) {
        var label = shareBtn.querySelector(".ph-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Share";
        }, 1500);
      });
    });

    var copyBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("copy"), el("span", { class: "ph-btn__label", text: "Copy" })]);
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(summaryText, function (ok) {
        var label = copyBtn.querySelector(".ph-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () {
          label.textContent = "Copy";
        }, 1500);
      });
    });

    var downloadBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads your saved Brand Kits as one .txt file.";
    downloadBtn.addEventListener("click", function () {
      downloadTextAsFile(summaryText, "prompt-haus-brand-kits.txt");
    });

    var printBtn = el("button", { type: "button", class: "ph-btn ph-btn--export ph-btn--small" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of your saved Brand Kits.";
    printBtn.addEventListener("click", function () {
      printPromptText(summaryText);
    });

    return el("div", { class: "ph-saved__vault-export" }, [
      el("span", { class: "ph-saved__vault-export-label", text: "Export your Brand Kits:" }),
      el("div", { class: "ph-preview__export-row" }, [shareBtn, copyBtn, downloadBtn, printBtn]),
    ]);
  }

  function renderBrandKitCard(kit, isActive) {
    var card = el("div", { class: "ph-brandkit__card" + (isActive ? " is-active" : "") });

    var titleRow;
    if (renamingKitId === kit.id) {
      var titleInput = el("input", { type: "text", class: "ph-saved__item-title-input", value: kit.name });
      var confirmRename = function () {
        PromptHaus.brandKit.renameKit(kit.id, titleInput.value);
        renamingKitId = null;
        renderApp();
      };
      titleInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") confirmRename();
        if (e.key === "Escape") {
          renamingKitId = null;
          renderApp();
        }
      });
      titleInput.addEventListener("blur", confirmRename);
      titleRow = el("div", { class: "ph-saved__item-title-row" }, [titleInput]);
    } else {
      var renameBtn = el("button", {
        type: "button",
        class: "ph-saved__rename-btn",
        "aria-label": "Rename this Brand Kit",
        title: "Rename",
      }, [icon("edit")]);
      renameBtn.addEventListener("click", function () {
        renamingKitId = kit.id;
        renderApp();
      });
      titleRow = el("div", { class: "ph-saved__item-title-row" }, [
        el("p", { class: "ph-saved__item-title", text: kit.name + (isActive ? " — Active" : "") }),
        renameBtn,
      ]);
    }
    card.appendChild(titleRow);

    var activeBtn = el("button", {
      type: "button",
      class: "ph-btn ph-btn--small " + (isActive ? "ph-btn--delete" : "ph-btn--load"),
      text: isActive ? "Turn Off" : "Make Active",
    });
    activeBtn.addEventListener("click", function () {
      PromptHaus.brandKit.setActiveKit(isActive ? null : kit.id);
      renderApp();
    });

    var isEditing = expandedKitId === kit.id;
    var editBtn = el("button", { type: "button", class: "ph-btn ph-btn--copy ph-btn--small", text: isEditing ? "Hide Fields" : "Edit Fields" });
    editBtn.addEventListener("click", function () {
      expandedKitId = isEditing ? null : kit.id;
      renderApp();
    });

    var deleteBtn = el("button", { type: "button", class: "ph-btn ph-btn--delete ph-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () {
      PromptHaus.brandKit.deleteKit(kit.id);
      renderApp();
    });

    card.appendChild(el("div", { class: "ph-brandkit__card-actions" }, [activeBtn, editBtn, deleteBtn]));

    if (isActive) {
      card.appendChild(
        el("p", {
          class: "ph-brandkit__disclaimer",
          text:
            "Active — every mode auto-inherits this kit's Color, Typography, Visual Style, and Personality. Flip a category's override to \"Yes\" below to leave your own picks alone for that category on this specific project — overriding adjusts creative direction, it doesn't erase the rest of your brand identity.",
        })
      );
    }

    if (isEditing) {
      card.appendChild(renderBrandKitColorCategory(kit));
      card.appendChild(renderBrandKitTypographyCategory(kit));
      card.appendChild(renderBrandKitVisualStyleCategory(kit));
      card.appendChild(renderBrandKitPersonalityCategory(kit));
    }

    return card;
  }

  // Shared shell for all 5 category groups — legend + override toggle +
  // subtitle + fields, same fieldset/legend visual language as every
  // other field group in the tool.
  function renderBrandKitCategoryShell(kit, categoryKey, iconName, title, subtitle, fieldsContainer) {
    var overrideOn = kit.overrides[categoryKey] === true;
    var toggle = el("div", { class: "ph-styledna__yesno ph-field-group__toggle" }, [
      yesNoButton("Yes", overrideOn, function () {
        PromptHaus.brandKit.updateKitOverride(kit.id, categoryKey, true);
        renderApp();
      }),
      yesNoButton("No", !overrideOn, function () {
        PromptHaus.brandKit.updateKitOverride(kit.id, categoryKey, false);
        renderApp();
      }),
    ]);
    var legendId = "ph-brandkit-" + kit.id + "-" + categoryKey;
    var legend = el("legend", { class: "ph-field-group__title", id: legendId }, [icon(iconName), el("span", { text: title })]);
    toggle.setAttribute("role", "group");
    toggle.setAttribute("aria-labelledby", legendId);

    return el("fieldset", { class: "ph-field-group ph-brandkit__category" }, [
      legend,
      el("p", { class: "ph-field-group__subtitle", text: subtitle }),
      el("p", { class: "ph-brandkit__override-label", text: "Override for this project (keep my own picks instead of this kit's):" }),
      toggle,
      fieldsContainer,
    ]);
  }

  function renderBrandKitFields(kit, categoryKey, fieldDefs) {
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    fieldDefs.forEach(function (def) {
      var entry = {
        fieldName: def.fieldName,
        label: def.label,
        field: kit.fields[categoryKey][def.fieldName],
        isColorSwatch: !!def.isColorSwatch,
      };
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(
        renderFn(entry, function (changes) {
          PromptHaus.brandKit.updateKitField(kit.id, categoryKey, def.fieldName, changes);
          renderApp();
        })
      );
    });
    return fieldsContainer;
  }

  function renderBrandKitColorCategory(kit) {
    var fields = renderBrandKitFields(kit, "color", [
      { fieldName: "primary", label: "Primary Color(s)", isColorSwatch: true },
      { fieldName: "secondary", label: "Secondary Color(s)", isColorSwatch: true },
      { fieldName: "accent", label: "Accent Color(s)", isColorSwatch: true },
      { fieldName: "neutral", label: "Neutral/Base Colors", isColorSwatch: true },
      { fieldName: "gradient", label: "Gradient Style" },
      { fieldName: "mood", label: "Color Mood" },
    ]);
    return renderBrandKitCategoryShell(
      kit,
      "color",
      "sparkle",
      "Color System",
      "Type your own or a hex code (e.g. \"#B76E79\") for an exact match — reaches Text Mode's Color Scheme + Second Phrase, and Image/Prompt Reference's Add Text.",
      fields
    );
  }

  function renderBrandKitTypographyCategory(kit) {
    var fields = renderBrandKitFields(kit, "typography", [
      { fieldName: "primaryFont", label: "Primary Font (headlines)" },
      { fieldName: "secondaryFont", label: "Secondary Font (body text)" },
      { fieldName: "accentFont", label: "Accent/Display Font" },
    ]);
    return renderBrandKitCategoryShell(
      kit,
      "typography",
      "text",
      "Typography System",
      "Primary reaches Text Mode's Letter Style, Graphics' Vanity Plate lettering, and Image/Prompt Reference's Add Text. Accent reaches Text Mode's Second Phrase. Secondary Font is recorded here but has no matching field yet — this tool doesn't have a body-text concept outside single phrases.",
      fields
    );
  }

  function renderBrandKitVisualStyleCategory(kit) {
    var fields = renderBrandKitFields(kit, "visualStyle", [
      { fieldName: "aesthetic1", label: "Aesthetic Style 1" },
      { fieldName: "aesthetic2", label: "Aesthetic Style 2" },
      { fieldName: "texture", label: "Texture Style" },
      { fieldName: "lighting", label: "Lighting Style" },
      { fieldName: "composition", label: "Composition Style" },
    ]);
    return renderBrandKitCategoryShell(
      kit,
      "visualStyle",
      "image",
      "Visual Style Direction",
      "Aesthetic reaches Character/Couples/Graphics/Image/Prompt Reference's art style + finish. Texture reaches Text Mode + Image/Prompt Reference's Text Effects. Lighting reaches Character/Couples/Graphics' Lighting Effects. Composition Style has no field to write into, so it's added as its own descriptor in the assembled prompt instead.",
      fields
    );
  }

  function renderBrandKitPersonalityCategory(kit) {
    var fieldsContainer = el("div", { class: "ph-field-group__fields" });
    ["trait1", "trait2", "trait3"].forEach(function (fieldName, index) {
      var entry = { fieldName: fieldName, label: "Core Trait " + (index + 1), field: kit.fields.personality[fieldName] };
      fieldsContainer.appendChild(
        renderField(entry, function (changes) {
          PromptHaus.brandKit.updateKitField(kit.id, "personality", fieldName, changes);
          renderApp();
        })
      );
    });
    var notThisEntry = { fieldName: "notThis", label: "What the Brand is NOT", field: kit.fields.personality.notThis };
    fieldsContainer.appendChild(
      renderFreeTextField(notThisEntry, function (changes) {
        PromptHaus.brandKit.updateKitField(kit.id, "personality", "notThis", changes);
        renderApp();
      })
    );
    return renderBrandKitCategoryShell(
      kit,
      "personality",
      "shield",
      "Brand Personality",
      "Core Traits have no field to write into, so they're added as their own descriptors in the assembled prompt instead. What the Brand is NOT feeds into the Negative Prompt at the top of the tool, alongside whatever you've typed there yourself.",
      fieldsContainer
    );
  }

  function renderStyleDNA(root) {
    var styleDNAState = PromptHaus.styleDNA.getState();

    var projectSelect = el("select", { class: "ph-field__select" });
    projectSelect.id = "ph-field-" + projectSelect.getAttribute("data-ph-key");
    (styleDNAState.projectType.optionGroups || []).forEach(function (group) {
      var optgroup = el("optgroup", { label: group.label });
      group.options.forEach(function (opt) {
        var optionNode = el("option", { value: opt });
        optionNode.textContent = opt;
        if (opt === styleDNAState.projectType.value) optionNode.selected = true;
        optgroup.appendChild(optionNode);
      });
      projectSelect.appendChild(optgroup);
    });
    projectSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setProjectType(projectSelect.value);
      renderApp();
    });

    var aspectSelect = el("select", { class: "ph-field__select" });
    aspectSelect.id = "ph-field-" + aspectSelect.getAttribute("data-ph-key");
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
    platformSelect.id = "ph-field-" + platformSelect.getAttribute("data-ph-key");
    appendSelectOptions(platformSelect, styleDNAState.targetPlatform, styleDNAState.targetPlatform.value);
    platformSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setTargetPlatform(platformSelect.value);
      renderApp();
    });

    var variationSelect = el("select", { class: "ph-field__select" });
    variationSelect.id = "ph-field-" + variationSelect.getAttribute("data-ph-key");
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

    var outputFormatSelect = el("select", { class: "ph-field__select" });
    outputFormatSelect.id = "ph-field-" + outputFormatSelect.getAttribute("data-ph-key");
    appendSelectOptions(outputFormatSelect, styleDNAState.outputFormat, styleDNAState.outputFormat.value);
    outputFormatSelect.addEventListener("change", function () {
      PromptHaus.styleDNA.setOutputFormat(outputFormatSelect.value);
      renderApp();
    });

    var bufferToggle = el("div", { class: "ph-styledna__yesno" }, [
      yesNoButton("Yes", styleDNAState.addBuffer === true, function () {
        PromptHaus.styleDNA.setAddBuffer(true);
        renderApp();
      }),
      yesNoButton("No", styleDNAState.addBuffer !== true, function () {
        PromptHaus.styleDNA.setAddBuffer(false);
        renderApp();
      }),
    ]);
    var bufferHelp = "Asks the AI to leave empty space around the edges so nothing gets cropped at the borders.";
    var bufferLabel = labelWithIcon("bufferBox", "Image Buffer/Padding", null, null, bufferHelp);
    bufferLabel.id = "ph-label-buffer-padding";
    bufferToggle.setAttribute("role", "group");
    bufferToggle.setAttribute("aria-labelledby", bufferLabel.id);
    var bufferField = el("div", { class: "ph-styledna__field" }, [bufferLabel, bufferToggle]);
    bufferField.title = bufferHelp;

    var outputFormatHelp = "A file-level export setting (transparency/format) — independent of this mode's own Background field, which is a scene/content choice, not a file setting. Leave on Default for a plain PNG.";
    var outputFormatField = el("div", { class: "ph-styledna__field" }, [labelWithIcon("crop", "Output Format", outputFormatSelect.id, null, outputFormatHelp), outputFormatSelect]);
    outputFormatField.title = outputFormatHelp;

    var projectHelp = "What you're making — also auto-suggests a matching Aspect Ratio below.";
    var projectField = el("div", { class: "ph-styledna__field" }, [labelWithIcon("shirt", "Project Type", projectSelect.id, null, projectHelp), projectSelect]);
    projectField.title = projectHelp;

    var platformHelp = "Formats the copied prompt for that AI tool specifically (tags-only for Midjourney, plain sentences for ChatGPT (GPT Image), etc.). Leave on Select... for a general-purpose prompt.";
    var platformField = el("div", { class: "ph-styledna__field" }, [labelWithIcon("monitor", "Target Platform", platformSelect.id, null, platformHelp), platformSelect]);
    platformField.title = platformHelp;

    var variationHelp = "How many separate images you plan to make. The copied prompt always describes just one image — asking an AI tool for several at once often gets rendered as one combined collage instead. Copy and generate it once per image (Randomize, or hand-adjust a field, between runs for variety).";
    var variationField = el("div", { class: "ph-styledna__field" }, [labelWithIcon("sparkle", "Variations", variationSelect.id, null, variationHelp), variationSelect]);
    variationField.title = variationHelp;

    var aspectHelp = "Auto-follows Project Type until you set it manually. Only appears in the copied prompt for Midjourney/Leonardo AI (as --ar) — other platforms don't have an equivalent tag, so it won't show up in the text there.";
    var aspectField = el("div", { class: "ph-styledna__field" }, [labelWithIcon("crop", "Aspect Ratio", aspectSelect.id, null, aspectHelp), aspectSelect, autoBadge]);

    var title = el("div", { class: "ph-styledna__title" }, [icon("shirt"), el("span", { text: "Project Setup" })]);

    // Collection Builder's Project Type/Aspect Ratio/Variations/Buffer are
    // single shared VALUES, not "this collection's" own setting — editing
    // them here would silently overwrite the one value every individual
    // mode's own tab also reads, including modes not even checked here.
    // Target Platform (how the whole collection gets formatted on copy) is
    // the only one of this set that makes sense to touch from this tab.
    var children;
    if (activeMode === "collection") {
      children = [title, platformField, renderNegativePromptField()];
    } else {
      children = [
        title,
        projectField,
        aspectField,
        platformField,
        variationField,
        bufferField,
        outputFormatField,
        renderNegativePromptField(),
      ];
    }

    root.appendChild(el("div", { class: "ph-styledna" }, children));
  }

  // One shared exclusion list, not one per section — real AI tools only
  // support a single negative prompt per generation (Midjourney's --no,
  // Stable Diffusion's negative box), so this lives here alongside Holiday/
  // Theme/Niche/Filter rather than duplicated into every mode's own Style
  // group. Full-width row (ph-styledna__field--full) since a textarea +
  // chip row doesn't fit the compact 3-per-row dropdown grid above it.
  function renderNegativePromptField() {
    var negativeState = PromptHaus.styleDNA.getState().negativePrompt;
    var textarea = el("textarea", {
      class: "ph-field__custom ph-field__freetext ph-styledna__negative-input",
      rows: "2",
      placeholder: 'e.g. "watermark, extra limbs, blurry, low quality"',
    });
    textarea.value = negativeState.value || "";
    textarea.addEventListener("input", function () {
      PromptHaus.styleDNA.updateNegativePrompt({ value: textarea.value });
      renderApp();
    });
    var textareaId = "ph-field-" + textarea.getAttribute("data-ph-key");
    textarea.id = textareaId;

    var chips = el("div", { class: "ph-styledna__negative-chips" });
    PromptHaus.styleDNA.negativePromptSuggestions.forEach(function (item) {
      var chip = el("button", { type: "button", class: "ph-styledna__negative-chip", text: item });
      chip.title = 'Add "' + item + '" to the list above.';
      chip.addEventListener("click", function () {
        PromptHaus.styleDNA.addNegativePromptSuggestion(item);
        renderApp();
      });
      chips.appendChild(chip);
    });

    var fieldChildren = [
      labelWithIcon("shield", "Negative Prompt — What to Avoid", textareaId),
      el("p", {
        class: "ph-styledna__negative-subtitle",
        text: "Applies to every mode, once, at the end of the prompt — comma-separated. Click a suggestion to add it.",
      }),
      textarea,
      chips,
    ];
    // Scoped to just this field — clicking the mode's own Reset wipes every
    // selection in that mode too, which isn't what someone reaching for "get
    // rid of what I typed here" wants. Only shown once there's something to
    // clear.
    if ((negativeState.value || "").trim()) {
      var clearBtn = el("button", { type: "button", class: "ph-btn ph-btn--small ph-btn--reset ph-styledna__negative-clear" }, [el("span", { text: "Clear Negative Prompt" })]);
      clearBtn.addEventListener("click", function () {
        PromptHaus.styleDNA.updateNegativePrompt({ value: "" });
        renderApp();
      });
      fieldChildren.push(clearBtn);
    }

    var field = el("div", { class: "ph-styledna__field ph-styledna__field--full" }, fieldChildren);
    return field;
  }

  // Decorative-only progress narration — doesn't gate anything, every
  // field stays visible/editable at once same as always. Purely a visual
  // anchor for the "build a prompt in 4 moves" story.
  var STEPS = [
    { icon: "step1", title: "Choose", subtitle: "Set the foundation" },
    { icon: "step2", title: "Customize", subtitle: "Dial in the details" },
    { icon: "step3", title: "Preview", subtitle: "See your prompt come to life" },
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

  // Same idea as Graphics Mode's own inline "Pro tip" paragraph, just
  // scoped to the whole tool instead of one field group — general
  // guidance for getting good results out of any mode.
  var TIPS = [
    "Pick ONE core style rather than stacking several — mixing chibi with photorealistic, for example, gives the AI conflicting instructions instead of a clearer one.",
    "Less is more. A focused handful of specific choices reads better to the AI than maxing out every single field.",
    "\"Or type your own...\" always overrides the dropdown — use it for anything hyper-specific the options don't cover.",
    "Set Target Platform before you copy — it reformats the prompt to match how that AI tool reads best (tags for Midjourney, plain sentences for ChatGPT, etc.).",
    "Stuck? Hit Randomize, then swap out just the 1-2 things you don't love instead of starting over from scratch.",
    "Save combinations you like to Your Vault so you can revisit and tweak them later instead of rebuilding from memory.",
    "Set up a Brand Kit once — colors, fonts, and style — and every mode inherits it automatically instead of you re-picking your brand every time.",
    "Use Negative Prompt to head off known AI mistakes (extra fingers, watermarks, blurry text) before they happen, not after you've already generated something.",
    "Building a group in Friends & Family? Add everyone first, then dial in the Dynamic — that way the vibe/pose you pick actually fits who's in the shot.",
  ];

  // Persists across re-renders same as briefExpanded — defaults collapsed
  // so the tool leads with the builder; members expand Tips when they want them.
  var tipsExpanded = false;

  function renderTipsPanel(root) {
    var toggleBtn = el("button", { type: "button", class: "ph-tips__toggle" }, [
      icon(tipsExpanded ? "eyeOff" : "eye"),
      el("span", { text: tipsExpanded ? "Hide" : "Show" }),
    ]);
    toggleBtn.addEventListener("click", function () {
      tipsExpanded = !tipsExpanded;
      renderApp();
    });

    var children = [
      el("div", { class: "ph-tips__header" }, [
        el("h3", { class: "ph-tips__title" }, [icon("bulb"), el("span", { text: "Tips for Better Prompts" })]),
        toggleBtn,
      ]),
    ];

    if (tipsExpanded) {
      var list = el("ul", { class: "ph-tips__list" });
      TIPS.forEach(function (tip) {
        list.appendChild(el("li", { text: tip }));
      });
      children.push(list);
    }

    root.appendChild(el("div", { class: "ph-tips" }, children));
  }

  // ---------------------------------------------------------------------
  // FAQ — sits under Your Vault, same for every mode. Collapsed by
  // default (it's long); the toggle carries a text label same as the
  // Creative Brief and Tips toggles.
  // ---------------------------------------------------------------------
  var FAQ_ITEMS = [
    {
      q: "What does the \"Include in prompt\" checkbox do?",
      a: "It controls whether that field's value actually lands in your final prompt. Uncheck it to exclude a selection without clearing the dropdown.",
    },
    {
      q: "Why did some of my selections change when I clicked Randomize?",
      a: "Randomize only touches fields with \"Include in prompt\" checked — anything you've unchecked is left alone.",
    },
    {
      q: "What does Reset actually clear?",
      a: "That mode's own fields, plus Holiday/Creative Theme/Niche/Target Audience/Mood, Filter, Imagery, and Negative Prompt. Buffer/Padding and the format settings (Project Type, Aspect Ratio, Target Platform, Variations) are left as you set them.",
    },
    {
      q: "What's the difference between Core Style and Variation Details in Text Mode?",
      a: "Core Style stays the same across every variation the AI generates. Variation Details are what the AI is free to change between them.",
    },
    {
      q: "Why does my copied prompt look different depending on Target Platform?",
      a: "Different AI tools read prompts differently — Midjourney wants tag-style keywords, ChatGPT (GPT Image) reads better as full sentences. Target Platform reformats your prompt automatically for whichever you pick.",
    },
    {
      q: "How many prompts can I save?",
      a: "Up to 5 saved prompts per mode in Your Vault.",
    },
    {
      q: "Does my uploaded reference photo get saved or sent anywhere?",
      a: "No. It stays in your browser as a visual reference for you and is never uploaded, stored, or analyzed anywhere.",
    },
    {
      q: "What if a dropdown doesn't have the exact option I want?",
      a: "Use the \"Or type your own...\" field under any dropdown — it always overrides the dropdown selection.",
    },
    {
      q: "What does Buffer/Padding do?",
      a: "Asks the AI to leave empty space around the edges of the image so nothing important gets cropped off during printing or cropping.",
    },
    {
      q: "Can I combine Character, Text, and Graphics into one image?",
      a: "Yes — that's what Combined Mode is for. It builds one cohesive prompt from all three instead of three separate ones.",
    },
    {
      q: "How do I make one word or phrase look different from the rest of my text?",
      a: "Use Second Phrase in Text Mode (or Add Text in other modes) to give a word or phrase its own separate styling and position.",
    },
    {
      q: "Why does Aspect Ratio change when I change Project Type?",
      a: "It auto-suggests a sensible ratio for that product. You can still override it manually any time — it'll stop following Project Type once you do.",
    },
    {
      q: "What's the Imagery section for?",
      a: "Small symbolic elements — a cross, a holiday icon, a military emblem, a nature/sci-fi/fantasy element — woven into the image. Pick up to 4 total across the categories. Every mode has it.",
    },
    {
      q: "Will my saved prompts still be there if I close my browser?",
      a: "Yes, on the same device and browser — Your Vault is saved locally. It won't carry over to a different device or browser.",
    },
    {
      q: "Can I turn a real photo into an illustration style?",
      a: "Yes — in Image/Prompt Reference Mode, upload or describe your photo, then use Style Adjustment (Reimagined Style + Art Finish) to recreate it in a different style, like watercolor or chibi.",
    },
    {
      q: "I found a prompt someone else wrote — will it just get copied if I paste it in?",
      a: "No. Switch Image/Prompt Reference Mode to \"Reference a Prompt\" and paste it there — the assembled prompt explicitly tells the AI to use it only as loose creative direction and produce an original result, not reuse the wording. Pick your own Reimagined Style/Art Finish on top for an even more distinct result.",
    },
    {
      q: "Why is Filter now inside each mode's Style section instead of the top bar?",
      a: "It's a rendering/finish choice, like Art Finish — grouping it with the rest of the mode's style controls makes it easier to find.",
    },
    {
      q: "My Image/Prompt Reference description fights with the style I picked — why, and what fixes it?",
      a: "If your description was reverse-engineered from a real photo (through ChatGPT or a similar tool), it's usually full of photographic/camera language. Once you pick a Reimagined Style, the prompt automatically tells the AI to replace any photographic qualities in the description with that style — you don't need to edit the description yourself.",
    },
    {
      q: "What is Brand Kit (\"My HAUS Style\")?",
      a: "A saved set of your brand's colors, fonts, visual style, and personality — collapsible under Your Vault. Activate one and every mode auto-inherits it instead of you re-picking your brand each time. Up to 3 kits, only one active at a time, and each has a per-category override so you can keep your own picks for just one category on a specific project without turning the whole kit off.",
    },
    {
      q: "Does Brand Kit work the same as Your Vault?",
      a: "Same persistence (saved locally in your browser) and the same Share/Copy/Download/Print export, but a different job — Vault saves finished prompts, Brand Kit saves a reusable identity that feeds into prompts you haven't built yet.",
    },
    {
      q: "What does Negative Prompt do?",
      a: "One shared \"what to avoid\" field at the top of the tool, applied to every mode — formatted as --no tags for Midjourney/Leonardo, or an \"Avoid:\" sentence for everything else. Brand Kit's \"What the Brand is NOT\" merges into this same list automatically.",
    },
    {
      q: "Can I get a saved prompt back into the builder to keep editing it?",
      a: "Yes — click Load on any item in Your Vault. It restores every field to exactly how it was when you saved it, across every mode that prompt used (including Character/Text/Graphics all at once for a saved Combined prompt).",
    },
    {
      q: "How many people can I add in Friends & Family?",
      a: "Up to 5 adults and up to 5 kids, in any mix — a single adult with kids, a full household, a friend group with no kids at all, whatever fits. Each person has their own Remove button, so taking one out doesn't mean redoing the others.",
    },
    {
      q: "Can I add more than one companion/pet?",
      a: "Yes — Character, Couples, and Friends & Family all support up to 3 companions in a shared pool (e.g. 2 dogs and a cat), not just one. Each has its own Remove button too.",
    },
    {
      q: "What's the difference between Collection Builder's \"Combine Prompts\" and Combined Mode?",
      a: "Combined Mode builds one unified image brief where Character/Text/Graphics share a single scene from scratch. Collection Builder's Combine Prompts instead takes prompts you've already built separately on other tabs and splices their finished text together — useful when you want each piece's own independent output stitched into one block, not one shared composition.",
    },
  ];

  var faqExpanded = false;

  function renderFAQSection(root) {
    var toggleBtn = el("button", { type: "button", class: "ph-faq__toggle" }, [
      icon(faqExpanded ? "eyeOff" : "eye"),
      el("span", { text: faqExpanded ? "Hide" : "Show FAQ (" + FAQ_ITEMS.length + ")" }),
    ]);
    toggleBtn.addEventListener("click", function () {
      faqExpanded = !faqExpanded;
      renderApp();
    });

    var children = [
      el("div", { class: "ph-faq__header" }, [
        el("h3", { class: "ph-faq__title" }, [icon("bulb"), el("span", { text: "Frequently Asked Questions" })]),
        toggleBtn,
      ]),
    ];

    if (faqExpanded) {
      var list = el("div", { class: "ph-faq__list" });
      FAQ_ITEMS.forEach(function (item) {
        list.appendChild(
          el("div", { class: "ph-faq__item" }, [
            el("p", { class: "ph-faq__question", text: item.q }),
            el("p", { class: "ph-faq__answer", text: item.a }),
          ])
        );
      });
      children.push(list);
    }

    root.appendChild(el("div", { class: "ph-faq" }, children));
  }

  function renderApp() {
    var root = document.getElementById("prompt-haus-app");
    if (!root) return;

    // Captured unconditionally, not just alongside data-ph-key focus
    // restoration below — a plain button click (a collapse toggle, Load,
    // Delete, etc.) has no focused text input to restore, but the page
    // still needs to land back where it was after the full rebuild.
    // Previously this only ever ran inside the data-ph-key branch, so
    // clicking any button that wasn't a text field lost scroll position
    // outright — surfaced as "expanding upward," since the browser's
    // own post-rebuild scroll landing point doesn't reliably match where
    // the click happened.
    var scrollX = window.scrollX;
    var scrollY = window.scrollY;

    // The preview textarea is a fresh DOM node on every rebuild, so a
    // manual drag-resize (which the browser applies as an inline height
    // style on that specific element) was getting silently discarded on
    // the very next field change — surfaced as "it shrinks back down
    // every time I touch a widget." Captured in DOM order here and
    // reapplied by index after the rebuild below.
    var previewHeights = Array.prototype.map.call(root.querySelectorAll(".ph-preview__text"), function (t) {
      return t.style.height || "";
    });

    var active = document.activeElement;
    var focusRestore = null;
    if (active && root.contains(active) && active.hasAttribute("data-ph-key")) {
      focusRestore = {
        key: active.getAttribute("data-ph-key"),
        selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
        selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
      };
    }

    // Wraps the whole rebuild — a Vault/Recent Log item saved under an
    // older version of the tool can carry a snapshot shaped differently
    // than the current code expects (a field added since it was saved,
    // say), and loadVaultSnapshot's defensive merge can't catch every
    // possible mismatch. Without this, an exception here would leave
    // root cleared (by the innerHTML="" below) with nothing rebuilt in
    // its place — the "entire site disappears except the static header
    // outside #prompt-haus-app" failure. Falls back to a plain message
    // instead, and logs the real error for debugging.
    try {
      renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights);
    } catch (e) {
      root.innerHTML = "";
      root.appendChild(
        el("div", { class: "ph-render-error" }, [
          el("p", { text: "Something went wrong displaying the builder — this can happen when loading a prompt saved under an older version of the tool." }),
          el("p", { text: "Reload the page to get back to a working state. If it happened right after clicking Load on a saved prompt, that item may need to be deleted from Your Vault or Recently Generated and recreated, since it was saved under an older version of the tool." }),
        ])
      );
      if (window.console && window.console.error) window.console.error("Prompt Haus render error:", e);
    }
  }

  function renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights) {
    phKeyCounter = 0;
    root.innerHTML = "";

    var shell = el("div", { class: "ph-shell" });
    renderSharedPromptBanner(shell);
    renderStepper(shell);
    shell.appendChild(el("hr", { class: "ph-section-divider" }));
    renderTipsPanel(shell);
    shell.appendChild(el("hr", { class: "ph-section-divider" }));
    shell.appendChild(el("p", { class: "ph-mode-select-label", text: "Select the Prompt Generator" }));
    renderTabs(shell);
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
    } else if (activeMode === "family") {
      left.appendChild(renderFamilyPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.family.getSelectionsByGroup());
      renderPreview(right, PromptHaus.family.assemblePrompt(), PromptHaus.family, activeMode);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "combined") {
      left.appendChild(renderCombinedPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.combined.getSelectionsByGroup());
      renderCombinedPreview(right);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "collection") {
      left.appendChild(renderCollectionPanel());
      renderCollectionPreview(right);
      // Only ever holds combined-splice saves (see the Save to Vault
      // button on the Combined Prompt block above) — individual per-mode
      // cards' own Save buttons already save into that mode's own Vault.
      renderSavedPrompts(right, "collection");
    } else if (activeMode === "graphics") {
      left.appendChild(renderGraphicsPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.graphics.getSelectionsByGroup());
      renderPreview(right, PromptHaus.graphics.assemblePrompt(), PromptHaus.graphics, activeMode);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "reference") {
      left.appendChild(renderReferencePanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.reference.getSelectionsByGroup());
      renderPreview(right, PromptHaus.reference.assemblePrompt(), PromptHaus.reference, activeMode);
      renderGenerateImageSection(right);
      renderSavedPrompts(right, activeMode);
    } else if (activeMode === "animals") {
      left.appendChild(renderAnimalsPanel());
      renderSelectionsPanel(right, activeMode, PromptHaus.animals.getSelectionsByGroup());
      renderPreview(right, PromptHaus.animals.assemblePrompt(), PromptHaus.animals, activeMode);
      renderSavedPrompts(right, activeMode);
    } else {
      left.appendChild(el("p", { class: "ph-coming-soon", text: MODE_LABELS[activeMode] + " Mode is coming soon." }));
    }
    // Global across every mode (not per-mode like Your Vault above it),
    // so it renders once here regardless of which tab is active.
    renderRecentLog(right);
    // Same on every mode, right under Your Vault.
    renderBrandKitSection(right);
    // Same FAQ regardless of mode, right under Your Vault / Brand Kit.
    renderFAQSection(right);

    // Imagery & Scene Elements lives in shared Style DNA (like Holiday/
    // Theme/Niche/Buffer), so it renders once here rather than being
    // duplicated into all panels. Collection Builder has no prompt of its
    // own — it only ever displays/combines other modes' already-assembled
    // output — so picking Imagery there would be a dead-end widget, same
    // "invisible field" bug Project Type had before it was fixed.
    if (activeMode !== "collection") {
      left.appendChild(renderImagerySection());
    }

    body.appendChild(left);
    body.appendChild(right);
    shell.appendChild(body);
    root.appendChild(shell);

    if (focusRestore) {
      var restored = root.querySelector('[data-ph-key="' + focusRestore.key + '"]');
      if (restored) {
        restored.focus({ preventScroll: true });
        if (focusRestore.selectionStart !== null && typeof restored.setSelectionRange === "function") {
          try {
            restored.setSelectionRange(focusRestore.selectionStart, focusRestore.selectionEnd);
          } catch (e) {
            // setSelectionRange throws on input types that don't support it
            // (e.g. type=number) — fine to just skip restoring the range.
          }
        }
      }
    }

    if (previewHeights && previewHeights.length) {
      var newTextareas = root.querySelectorAll(".ph-preview__text");
      previewHeights.forEach(function (height, i) {
        if (height && newTextareas[i]) newTextareas[i].style.height = height;
      });
    }

    window.scrollTo(scrollX, scrollY);
  }

  PromptHaus.ui = { renderApp: renderApp };

  // Closes any open info-icon popover when clicking anywhere else on the
  // page (another field's dropdown, a different info icon, blank space)
  // — native <details> only toggles on clicking its own summary again,
  // which read as "stuck open" since nothing else would close it.
  // Attached once here, at module load, rather than inside infoIcon()
  // itself — renderApp() tears down and rebuilds the whole DOM on every
  // change, so a listener added fresh on every render would pile up
  // without ever being removed; document itself is never replaced, so
  // one listener attached here covers every info icon for the life of
  // the page.
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".ph-info[open]").forEach(function (details) {
      if (!details.contains(e.target)) details.open = false;
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    renderApp();
  });
})();
