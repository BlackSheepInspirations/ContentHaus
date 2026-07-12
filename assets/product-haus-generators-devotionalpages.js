/**
 * The AI Creator's Product Haus — Devotional Pages Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A genuine multi-page devotional BOOKLET (Cover, Daily Reading Spread,
 * Reflection Spread, Closing Page) built as a Page Bundle — distinct
 * from Devotional & Motivation Card Studio, which writes the content
 * for and describes one card's visual design at a time, not a
 * coordinated multi-page set sharing one locked look.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var DEVOTIONAL_THEME_OPTIONS = ["Morning Gratitude", "Overcoming Anxiety", "Faith & Trust", "Strength Through Trials", "New Beginnings", "Parenting with Grace", "Grief & Healing"];
  var ART_STYLE_OPTIONS = ["Soft Watercolor", "Botanical Line Art", "Warm Minimalist", "Vintage Devotional"];
  var COLOR_PALETTE_OPTIONS = ["Soft Pastels", "Warm Neutrals", "Muted Sage & Cream", "Gold & Ivory", "Dusty Rose & Sage"];
  var LAYOUT_STYLE_OPTIONS = ["Text-Focused with Small Accent", "Illustration-Forward with Text Overlay", "Balanced Split Layout"];

  var LOCKED_SUFFIX = " Standard devotional booklet page proportions, print-ready, clean composition, high resolution, no watermarks.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "devotional-pages",
    label: "Devotional Pages Generator",
    icon: "sparkle",
    description: "A devotional booklet PAGE SET — cover, a daily reading spread, a reflection spread, and a closing page, all sharing one locked look, not a single card.",
    fieldGroupTitle: "Customize Your Devotional Pages",

    fields: [
      { name: "devotionalTheme", label: "Devotional Theme", options: DEVOTIONAL_THEME_OPTIONS, defaultValue: DEVOTIONAL_THEME_OPTIONS[0] },
      { name: "focusMessage", label: "Focus Message", isFreeText: true, defaultValue: "finding peace in busy seasons", placeholder: "e.g. finding peace in busy seasons, trusting the process" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_STYLE_OPTIONS, defaultValue: LAYOUT_STYLE_OPTIONS[0] },
    ],

    pageTypesLabel: "Pages to Include (pick up to 4 — leave blank for the full set)",
    pageTypesCap: 4,
    defaultPageTypes: ["cover", "dailyReading", "reflection", "closing"],
    bundleBlockTitle: "Your Devotional Page Set",
    pageTypes: [
      {
        id: "cover",
        label: "Cover Page",
        promptTemplate:
          "Design a devotional booklet COVER centered on \"{devotionalTheme}\", built around the message of {focusMessage}. {artStyle} art style, a {colorPalette} color palette, {layoutStyle}{holidayClause}.\n\nLayout: a calm, inviting centered composition with generous open space for a title, setting the tone for the pages that follow." +
          LOCKED_SUFFIX,
      },
      {
        id: "dailyReading",
        label: "Daily Reading Spread",
        promptTemplate:
          "Design a devotional DAILY READING page for the same \"{devotionalTheme}\" booklet, built around {focusMessage}. {artStyle} art style, a {colorPalette} color palette, {layoutStyle}{holidayClause}.\n\nLayout: a decorative border or background frame with generous open space in the center for a daily reading passage, calm and easy to read." +
          LOCKED_SUFFIX,
      },
      {
        id: "reflection",
        label: "Reflection / Journal Prompt Spread",
        promptTemplate:
          "Design a devotional REFLECTION page for the same \"{devotionalTheme}\" booklet, built around {focusMessage}. {artStyle} art style, a {colorPalette} color palette, {layoutStyle}{holidayClause}.\n\nLayout: a soft decorative accent along one edge with generous lined or open space for the reader's own handwritten reflection, quiet and uncluttered." +
          LOCKED_SUFFIX,
      },
      {
        id: "closing",
        label: "Closing Page",
        promptTemplate:
          "Design a devotional CLOSING page for the same \"{devotionalTheme}\" booklet, wrapping up the message of {focusMessage}. {artStyle} art style, a {colorPalette} color palette, {layoutStyle}{holidayClause}.\n\nLayout: a quiet, reflective close with a small decorative motif and generous open space for a short closing blessing or quote." +
          LOCKED_SUFFIX,
      },
    ],
  });
})();
