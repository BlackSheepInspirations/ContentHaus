/**
 * The AI Creator's Marketing Haus — shared platform sizing.
 * One source of truth for platform -> format -> exact pixel spec + aspect
 * ratio. Used to (a) SHOW the member the right size to design at, and
 * (b) INJECT that spec into the assembled prompt. Reused by the Content
 * Kit and (later) the graphic quick generators + Graphics/Project Haus.
 * Load before any studio/generator that references MarketingHaus.sizing.
 */
(function () {
  "use strict";
  window.MarketingHaus = window.MarketingHaus || {};

  // Each format: { label, w, h, ar } — w/h in px, ar = human aspect note.
  var PLATFORMS = [
    { id: "instagram", label: "Instagram", formats: [
      { label: "Feed post", w: 1080, h: 1350, ar: "4:5 portrait" },
      { label: "Square post", w: 1080, h: 1080, ar: "1:1 square" },
      { label: "Story / Reel", w: 1080, h: 1920, ar: "9:16 vertical" },
      { label: "Reel cover", w: 1080, h: 1920, ar: "9:16 vertical" },
    ] },
    { id: "facebook", label: "Facebook", formats: [
      { label: "Feed post", w: 1200, h: 1500, ar: "4:5 portrait" },
      { label: "Landscape post", w: 1200, h: 630, ar: "1.91:1 landscape" },
      { label: "Cover photo", w: 820, h: 312, ar: "2.63:1 banner" },
      { label: "Story", w: 1080, h: 1920, ar: "9:16 vertical" },
    ] },
    { id: "pinterest", label: "Pinterest", formats: [
      { label: "Standard pin", w: 1000, h: 1500, ar: "2:3 tall" },
      { label: "Long pin", w: 1000, h: 2100, ar: "1:2.1 extra tall" },
    ] },
    { id: "tiktok", label: "TikTok", formats: [
      { label: "Video / cover", w: 1080, h: 1920, ar: "9:16 vertical" },
    ] },
    { id: "youtube", label: "YouTube", formats: [
      { label: "Thumbnail", w: 1280, h: 720, ar: "16:9 landscape" },
      { label: "Shorts cover", w: 1080, h: 1920, ar: "9:16 vertical" },
      { label: "Channel banner", w: 2560, h: 1440, ar: "16:9 landscape" },
    ] },
    { id: "linkedin", label: "LinkedIn", formats: [
      { label: "Feed post", w: 1200, h: 1500, ar: "4:5 portrait" },
      { label: "Square post", w: 1200, h: 1200, ar: "1:1 square" },
      { label: "Cover banner", w: 1584, h: 396, ar: "4:1 banner" },
    ] },
    { id: "x", label: "X / Twitter", formats: [
      { label: "Post image", w: 1600, h: 900, ar: "16:9 landscape" },
      { label: "Header", w: 1500, h: 500, ar: "3:1 banner" },
    ] },
    { id: "etsy", label: "Etsy / Shop", formats: [
      { label: "Listing image", w: 2000, h: 2000, ar: "1:1 square" },
      { label: "Thumbnail", w: 1200, h: 900, ar: "4:3" },
    ] },
    { id: "print", label: "Print / POD", formats: [
      { label: "Postcard 6x4", w: 1875, h: 1275, ar: "6x4 in @ 300dpi" },
      { label: "Greeting card 5x7", w: 1500, h: 2100, ar: "5x7 in @ 300dpi" },
      { label: "Flyer A4", w: 2480, h: 3508, ar: "A4 @ 300dpi" },
    ] },
  ];

  // Flattened "Platform — Format (W×H)" combos, so a single-select
  // generator field can offer the whole size catalog without a dependent
  // two-dropdown cascade. Built once at load; a map lets us resolve a
  // chosen combo label straight back to its platform/format pair.
  var SIZE_NONE = "Any / no specific size";
  var COMBO_OPTIONS = [SIZE_NONE];
  var COMBO_MAP = {};
  PLATFORMS.forEach(function (p) {
    p.formats.forEach(function (f) {
      var label = p.label + " — " + f.label + " (" + f.w + "×" + f.h + ")";
      COMBO_OPTIONS.push(label);
      COMBO_MAP[label] = { platform: p.label, format: f.label };
    });
  });

  function platformByLabel(label) {
    for (var i = 0; i < PLATFORMS.length; i++) if (PLATFORMS[i].label === label) return PLATFORMS[i];
    return null;
  }
  function formatByLabel(platform, label) {
    var p = typeof platform === "string" ? platformByLabel(platform) : platform;
    if (!p) return null;
    for (var i = 0; i < p.formats.length; i++) if (p.formats[i].label === label) return p.formats[i];
    return null;
  }

  MarketingHaus.sizing = {
    PLATFORMS: PLATFORMS,
    platformLabels: function () { return PLATFORMS.map(function (p) { return p.label; }); },
    formatLabels: function (platformLabel) { var p = platformByLabel(platformLabel); return p ? p.formats.map(function (f) { return f.label; }) : []; },
    platformByLabel: platformByLabel,
    formatByLabel: formatByLabel,
    // Human chip like "1080 x 1350 px - 4:5 portrait"
    chip: function (platformLabel, formatLabel) {
      var f = formatByLabel(platformLabel, formatLabel);
      return f ? (f.w + " x " + f.h + " px - " + f.ar) : "";
    },
    // Prompt clause like: "sized 1080x1350px (4:5 portrait), optimized for the Instagram feed"
    promptClause: function (platformLabel, formatLabel) {
      var f = formatByLabel(platformLabel, formatLabel);
      if (!f) return "";
      return "sized " + f.w + "x" + f.h + "px (" + f.ar + "), optimized for " + platformLabel + " " + formatLabel.toLowerCase();
    },

    // --- single-select combo helpers, for the graphic Quick Generators ---
    SIZE_NONE: SIZE_NONE,
    comboOptions: function () { return COMBO_OPTIONS.slice(); },
    // Shared generator field: one flat "Output Size" dropdown, opt-in
    // (defaults to no specific size so nothing is forced).
    sizeField: function () {
      return { name: "outputSize", label: "Output Size", options: COMBO_OPTIONS.slice(), defaultValue: SIZE_NONE };
    },
    // Prompt clause for a chosen combo label; "" for the none option.
    clauseFromCombo: function (comboLabel) {
      var m = COMBO_MAP[comboLabel];
      if (!m) return "";
      return this.promptClause(m.platform, m.format);
    },
  };
})();
