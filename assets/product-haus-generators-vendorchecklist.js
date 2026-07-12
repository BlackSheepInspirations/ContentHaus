/**
 * The AI Creator's Product Haus — Event Vendor Checklist Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-checklists-vendorchecklist.js, and
 * product-haus-generators.js (all must load first — this file just
 * registers itself with that engine).
 *
 * Built as its own separate generator rather than folded into Event
 * Checklist's eventType field — this is structurally a vendor-tracking
 * sheet (category/name/contact/quote/deposit/balance-due), not a
 * phased action-item list, and it works the same way across any event
 * rather than being tied to one. Uses staticChecklistSections (the
 * static half of the same Checklist Items capability Event Checklist
 * uses the dynamic half of) — a single fixed vendor-category list, no
 * event-type field at all.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var sortAlpha = ProductHaus.util.sortAlpha;
  var lib = window.ProductHausVendorChecklist;

  var COLOR_SCHEME_OPTIONS = sortAlpha([
    "Soft Pastel Pink & Cream", "Bold Modern Black & Gold", "Sage Green & Earth Tones",
    "Classic Navy & Blush", "Warm Terracotta & Cream", "Dusty Blue & White",
    "Rustic Burgundy & Gold", "Bright & Cheerful Multicolor",
  ]);
  var TITLE_FONT_STYLE_OPTIONS = ["Script / Handwritten", "Modern Sans-Serif", "Elegant Serif", "Playful Bold"];
  var LAYOUT_COLUMNS_OPTIONS = ["Single Column", "Two Column (Side-by-Side)"];

  ProductHaus.generatorEngine.registerGenerator({
    id: "event-vendor-checklist",
    label: "Event Vendor Checklist Generator",
    icon: "document",
    description: "A vendor-tracking sheet — name, contact, quote, and deposit/balance blanks per category — for any event, plus a separate background/frame prompt for the printable page design.",
    fieldGroupTitle: "Customize Your Vendor Checklist",

    fields: [
      { name: "eventName", label: "Event Name (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Sarah & Mike's Wedding" },
      { name: "colorScheme", label: "Color Scheme", options: COLOR_SCHEME_OPTIONS, defaultValue: COLOR_SCHEME_OPTIONS[0] },
      { name: "titleFontStyle", label: "Title Lettering Style", options: TITLE_FONT_STYLE_OPTIONS, defaultValue: TITLE_FONT_STYLE_OPTIONS[0] },
      { name: "layoutColumns", label: "Layout", options: LAYOUT_COLUMNS_OPTIONS, defaultValue: LAYOUT_COLUMNS_OPTIONS[0] },
    ],

    staticChecklistSections: lib.VENDOR_CHECKLIST_SECTIONS,
    checklistPickerLabel: "Vendor Categories",

    computeExtraTokens: function (valueMap) {
      return {
        eventNameClause: valueMap.eventName ? " — " + valueMap.eventName : "",
        layoutColumnsLower: valueMap.layoutColumns === "Two Column (Side-by-Side)" ? "two-column, side-by-side" : "single-column",
      };
    },

    basePromptTemplate:
      "EVENT VENDOR CHECKLIST{eventNameClause}\n\n" +
      "Style notes: {colorScheme} color scheme, {titleFontStyle} title lettering, {layoutColumns} layout.\n\n" +
      "{checklistBlock}",

    secondaryBlockTitle: "Design Frame Prompt",
    secondaryBlockLabel: "Background / Frame Prompt (AI Image Generator)",
    secondaryBlockTemplate:
      "Design a printable {layoutColumnsLower} planner page background for a vendor tracking checklist{eventNameClause}, in a {titleFontStyle} title lettering style, " +
      "with a {colorScheme} color scheme. Include colored section header bars and simple line/table placeholders for the layout, but leave all text areas as clean " +
      "blank space — do not render any words, letters, section titles, vendor names, or tracking fields as part of the image itself. Background/template only, " +
      "ready for real text to be added afterward.",

    charmPool: [
      "one small extra row for a miscellaneous/backup vendor",
      "a small celebratory sticker or seal graphic in a corner",
      "a subtle decorative border around the whole page",
    ],
    dynamicPool: [
      "a running total row for deposits paid vs. balances due",
      "a color-coded priority marker for each vendor category",
      "a bolder, higher-contrast section-header treatment",
    ],
  });
})();
