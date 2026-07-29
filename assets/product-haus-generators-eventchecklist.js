/**
 * The AI Creator's Project Haus — Event Checklist Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-checklists-eventchecklist.js, and
 * product-haus-generators.js (all must load first — this file just
 * registers itself with that engine).
 *
 * Was explicitly on hold pending a reference image from the owner — now
 * shared. This is a content generator, not an image-generation prompt —
 * getting an image model to render an accurate multi-section checklist
 * with correct, legible text is exactly the kind of dense small-text
 * rendering these models are unreliable at. The main output
 * (basePromptTemplate) is ready-to-paste checklist content; a separate
 * secondaryBlockTemplate produces a frame-only AI image prompt for the
 * decorative background (colors, title lettering, section bars) that
 * explicitly tells the image model to leave every text area blank —
 * closest to how a real template like the reference image is actually
 * made (design the frame once, drop in real text after).
 *
 * checklistSourceField/checklistLibrary is the new generic Checklist
 * Items capability in product-haus-generators.js — eventType's resolved
 * value looks up which of the 17 authored checklists to show, with
 * every item checked by default (toggle any off). Wedding's own
 * sections/items are transcribed straight from the owner's reference
 * image; the other 16 were authored from their one-line hints.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var sortAlpha = ProductHaus.util.sortAlpha;
  var lib = window.ProductHausEventChecklists;

  var COLOR_SCHEME_OPTIONS = sortAlpha([
    "Soft Pastel Pink & Cream", "Bold Modern Black & Gold", "Sage Green & Earth Tones",
    "Classic Navy & Blush", "Warm Terracotta & Cream", "Dusty Blue & White",
    "Rustic Burgundy & Gold", "Bright & Cheerful Multicolor",
  ]);
  var DECORATIVE_MOTIF_OPTIONS = sortAlpha([
    "Florals", "Hearts", "Balloons & Confetti", "Geometric Shapes", "Minimalist Line Art", "Seasonal Icons",
  ]);
  var TITLE_FONT_STYLE_OPTIONS = ["Script / Handwritten", "Modern Sans-Serif", "Elegant Serif", "Playful Bold"];
  var LAYOUT_COLUMNS_OPTIONS = ["Single Column", "Two Column (Side-by-Side)"];

  ProductHaus.generatorEngine.registerGenerator({
    id: "event-checklist",
    label: "Event Checklist Generator",
    icon: "document",
    description: "A ready-to-use planning checklist for 17 event types — pick what to include, plus a separate background/frame prompt for the printable page design.",
    fieldGroupTitle: "Customize Your Checklist",

    fields: [
      { name: "eventType", label: "Event Type", options: lib.EVENT_TYPE_OPTIONS, defaultValue: lib.EVENT_TYPE_OPTIONS[0] },
      { name: "colorScheme", label: "Color Scheme", options: COLOR_SCHEME_OPTIONS, defaultValue: COLOR_SCHEME_OPTIONS[0] },
      { name: "decorativeMotif", label: "Decorative Accents", options: DECORATIVE_MOTIF_OPTIONS, defaultValue: DECORATIVE_MOTIF_OPTIONS[0] },
      { name: "titleFontStyle", label: "Title Lettering Style", options: TITLE_FONT_STYLE_OPTIONS, defaultValue: TITLE_FONT_STYLE_OPTIONS[0] },
      { name: "layoutColumns", label: "Layout", options: LAYOUT_COLUMNS_OPTIONS, defaultValue: LAYOUT_COLUMNS_OPTIONS[1] },
    ],

    checklistSourceField: "eventType",
    checklistLibrary: lib.EVENT_CHECKLIST_LIBRARY,
    checklistPickerLabel: "Checklist Items",

    computeExtraTokens: function (valueMap) {
      return {
        layoutColumnsLower: valueMap.layoutColumns === "Two Column (Side-by-Side)" ? "two-column, side-by-side" : "single-column",
      };
    },

    basePromptTemplate:
      "{eventType} PLANNING CHECKLIST\n\n" +
      "Style notes: {colorScheme} color scheme, {decorativeMotif} accents, {titleFontStyle} title lettering, {layoutColumns} layout.\n\n" +
      "{checklistBlock}",

    secondaryBlockTitle: "Design Frame Prompt",
    secondaryBlockLabel: "Background / Frame Prompt (AI Image Generator)",
    secondaryBlockTemplate:
      "Design a printable {layoutColumnsLower} planner page background for a \"{eventType} Planning Checklist,\" in a {titleFontStyle} title lettering style, " +
      "with a {colorScheme} color scheme and {decorativeMotif} decorative accents. Include colored section header bars and checkbox-style list placeholders " +
      "for the layout, but leave all text areas as clean blank space — do not render any words, letters, section titles, or checklist items as part of the " +
      "image itself. Background/template only, ready for real text to be added afterward.",

    charmPool: [
      "one small bonus 'nice-to-have' item at the end of the list",
      "a small celebratory sticker or seal graphic in a corner",
      "a subtle decorative border around the whole page",
    ],
    dynamicPool: [
      "a reminder note to delegate at least one task to a helper",
      "a progress-tracker element (e.g. a small percentage-complete bar)",
      "a bolder, higher-contrast section-header treatment",
    ],
  });
})();
