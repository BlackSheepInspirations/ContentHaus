/**
 * The AI Creator's Project Haus — Devotional Pages Generator
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
  var BLANK_PAGE_VARIATION_OPTIONS = ["1", "2", "3", "4", "5"];

  var LOCKED_SUFFIX = " Standard devotional booklet page proportions, print-ready, clean composition, high resolution, no watermarks.";

  // Same "how many matching-but-distinct designs" mechanism the Ebook
  // Pages generator already proved out — one Blank Page slot in the
  // bundle picker can ask for 1-5 designs in a single sentence instead
  // of needing 5 separate always-shown page-type entries.
  function computeBlankPageTokens(valueMap) {
    var n = parseInt(valueMap.blankPageVariations, 10) || 1;
    return {
      blankPageCountPhrase: n === 1 ? "one BLANK page" : n + " different BLANK pages",
      blankPageVariationNote:
        n === 1
          ? ""
          : " Keep the same overall art style, color palette, and decorative border family across all " +
            n +
            " so they read as one matching set, but vary the border, corner ornament, or accent placement on each one so no two are identical — each is meant to be used as its own separate page, not a repeat of another.",
    };
  }

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
      { name: "blankPageVariations", label: "Blank Page Variations (only used if Blank Page is included below)", options: BLANK_PAGE_VARIATION_OPTIONS, defaultValue: BLANK_PAGE_VARIATION_OPTIONS[0] },
    ],

    computeExtraTokens: computeBlankPageTokens,

    pageTypesLabel: "Pages to Include (pick up to 6 — leave blank for the full set)",
    pageTypesCap: 6,
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
        id: "blankPage",
        label: "Blank Page",
        promptTemplate:
          "Design {blankPageCountPhrase} for the same \"{devotionalTheme}\" devotional booklet. {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\nLayout: the same decorative border/frame as the rest of the booklet, with the entire center of the page left completely open and empty — ready for the reader to write their own notes. Do not add any placeholder text, lines, or lorem ipsum.{blankPageVariationNote}" +
          LOCKED_SUFFIX,
      },
      {
        id: "notesPage",
        label: "Notes Page",
        promptTemplate:
          "Design a NOTES page for the same \"{devotionalTheme}\" devotional booklet. {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\nLayout: the same decorative border/frame as the rest of the booklet, with a small \"Notes\" heading at the top and the rest of the page filled edge-to-edge with even, evenly-spaced horizontal ruled lines for handwriting. No other text, no placeholder content, no lorem ipsum." +
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
