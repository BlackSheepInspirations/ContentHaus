/**
 * The AI Creator's Product Haus — Prayer Cards Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A themed boxed SET of prayer/blessing cards (3 fronts + one shared
 * back design), built as a Page Bundle the same way Junk Journal is —
 * distinct from Devotional & Motivation Card Studio, which designs one
 * card's content/visual at a time rather than a coordinated set.
 *
 * Scripture / Prayer Focus is deliberately a THEME direction (e.g. "a
 * prayer for peace"), not a field for pasting in actual scripture text —
 * keeps this a visual-design tool rather than a text-reproduction one.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var SET_THEME_OPTIONS = ["Daily Blessings", "Comfort & Healing", "Strength & Courage", "Gratitude", "New Beginnings", "Grief & Loss Comfort", "Children's Prayers"];
  var ART_STYLE_OPTIONS = ["Soft Watercolor", "Elegant Botanical Line Art", "Vintage Ornamental", "Minimalist Modern"];
  var COLOR_PALETTE_OPTIONS = ["Soft Pastels", "Warm Neutrals", "Muted Sage & Cream", "Gold & Ivory", "Dusty Rose & Sage"];
  var CARD_FINISH_OPTIONS = ["Standard Card Front", "Card Front with Ornamental Border", "Card Front with Ribbon / Bookmark Style"];

  var LOCKED_SUFFIX = " Standard prayer card proportions, print-ready, clean composition, high resolution, no watermarks.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "prayer-cards",
    label: "Prayer Cards Generator",
    icon: "shield",
    description: "A themed boxed SET of prayer cards — 3 card fronts plus a matching back design, all sharing one locked look, not a single card.",
    fieldGroupTitle: "Customize Your Prayer Card Set",

    fields: [
      { name: "setTheme", label: "Set Theme", options: SET_THEME_OPTIONS, defaultValue: SET_THEME_OPTIONS[0] },
      { name: "prayerFocus", label: "Scripture / Prayer Focus", isFreeText: true, defaultValue: "a prayer for peace and calm", placeholder: "e.g. Psalm 23, a prayer for peace, a blessing for new parents" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "cardFinish", label: "Card Finish", options: CARD_FINISH_OPTIONS, defaultValue: CARD_FINISH_OPTIONS[0] },
    ],

    pageTypesLabel: "Cards to Include (pick up to 4 — leave blank for the full set)",
    pageTypesCap: 4,
    defaultPageTypes: ["card1", "card2", "card3", "cardBack"],
    bundleBlockTitle: "Your Prayer Card Set",
    pageTypes: [
      {
        id: "card1",
        label: "Card Design 1 — Main Blessing",
        promptTemplate:
          "Design a prayer card front centered on \"{setTheme}\", built around {prayerFocus}, as the main blessing card in the set. {artStyle} art style, a {colorPalette} color palette, {cardFinish}{holidayClause}.\n\nLayout: a calm, centered composition with generous open space for a short blessing text, decorative but not cluttered." +
          LOCKED_SUFFIX,
      },
      {
        id: "card2",
        label: "Card Design 2 — Scripture / Verse Focus",
        promptTemplate:
          "Design a second prayer card front for the same \"{setTheme}\" set, built around {prayerFocus}, styled as the scripture/verse-focused card. {artStyle} art style, a {colorPalette} color palette, {cardFinish}{holidayClause}.\n\nLayout: a calm, centered composition with generous open space for a verse or passage, a different decorative arrangement than the first card so the set doesn't repeat itself." +
          LOCKED_SUFFIX,
      },
      {
        id: "card3",
        label: "Card Design 3 — Closing Prayer",
        promptTemplate:
          "Design a third prayer card front for the same \"{setTheme}\" set, built around {prayerFocus}, styled as a quiet closing prayer card. {artStyle} art style, a {colorPalette} color palette, {cardFinish}{holidayClause}.\n\nLayout: a soft, reflective composition with generous open space for a short closing prayer, rounding out the set with a fresh decorative arrangement." +
          LOCKED_SUFFIX,
      },
      {
        id: "cardBack",
        label: "Card Back Design",
        promptTemplate:
          "Design a single shared CARD BACK for the \"{setTheme}\" prayer card set — a simple decorative pattern or motif (not a full scene) that works behind every card front in the set. {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\nLayout: an even, repeatable decorative pattern or a small centered emblem, with enough open space at the bottom for a small logo or credit line." +
          LOCKED_SUFFIX,
      },
    ],
  });
})();
