/**
 * The AI Creator's Product Haus — Learning Cards Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A themed boxed SET of educational flashcards (3 fronts + one shared
 * back design), built as a Page Bundle the exact same way Prayer Cards
 * is — distinct from a worksheet or coloring page, this is a coordinated
 * card SET meant to be printed, cut, and used as real flashcards.
 *
 * Card Focus is deliberately a free-text steer (e.g. "the letters A, B,
 * and C") rather than a fixed per-category content list, since the same
 * mechanism needs to cover wildly different subjects (letters, numbers,
 * shapes, sight words, animals) without a separate field set for each.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var CARD_CATEGORY_OPTIONS = ["Alphabet (ABC)", "Numbers & Counting", "Shapes", "Colors", "Sight Words", "Animals & Habitats", "Days of the Week & Months"];
  var ART_STYLE_OPTIONS = ["Bright Flat Illustration", "Hand-Drawn Doodle", "Soft Watercolor", "Bold Cartoon Style"];
  var COLOR_PALETTE_OPTIONS = ["Bright Primary Colors", "Soft Pastels", "Rainbow Mixed", "Earthy Nature Tones"];
  var CARD_FINISH_OPTIONS = ["Standard Flashcard Front", "Flashcard with Rounded Border", "Flashcard with Playful Frame"];

  var LOCKED_SUFFIX = " Standard flashcard proportions, print-ready, clean composition, high resolution, no watermarks, no small or hard-to-read text.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "learning-cards",
    label: "Learning Cards Generator",
    icon: "bulb",
    description: "A themed boxed SET of educational flashcards — 3 card fronts plus a matching back design, all sharing one locked look, not a single card.",
    fieldGroupTitle: "Customize Your Learning Card Set",

    fields: [
      { name: "cardCategory", label: "Card Category", options: CARD_CATEGORY_OPTIONS, defaultValue: CARD_CATEGORY_OPTIONS[0] },
      { name: "cardFocus", label: "Card Focus", isFreeText: true, defaultValue: "the letters A, B, and C", placeholder: "e.g. \"the letters A, B, C\", \"numbers 1-5\", \"farm animals\"" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "cardFinish", label: "Card Finish", options: CARD_FINISH_OPTIONS, defaultValue: CARD_FINISH_OPTIONS[0] },
    ],

    pageTypesLabel: "Cards to Include (pick up to 4 — leave blank for the full set)",
    pageTypesCap: 4,
    defaultPageTypes: ["card1", "card2", "card3", "cardBack"],
    bundleBlockTitle: "Your Learning Card Set",
    pageTypes: [
      {
        id: "card1",
        label: "Card Design 1",
        promptTemplate:
          "Design a printable {cardCategory} flashcard front, the FIRST card in a set of 3, featuring {cardFocus} — showing one clear, single example, appropriate for a young learner. {artStyle} art style, a {colorPalette} color palette, {cardFinish}{holidayClause}.\n\nLayout: one large, bold, centered image or symbol with a large clear label if applicable, simple and easy to recognize at a glance." +
          LOCKED_SUFFIX,
      },
      {
        id: "card2",
        label: "Card Design 2",
        promptTemplate:
          "Design a second printable {cardCategory} flashcard front for the same set, featuring {cardFocus} — showing a different specific example than the first card, so the set doesn't repeat itself. {artStyle} art style, a {colorPalette} color palette, {cardFinish}{holidayClause}.\n\nLayout: one large, bold, centered image or symbol with a large clear label if applicable, simple and easy to recognize at a glance." +
          LOCKED_SUFFIX,
      },
      {
        id: "card3",
        label: "Card Design 3",
        promptTemplate:
          "Design a third printable {cardCategory} flashcard front for the same set, featuring {cardFocus} — showing yet another distinct example, rounding out the set. {artStyle} art style, a {colorPalette} color palette, {cardFinish}{holidayClause}.\n\nLayout: one large, bold, centered image or symbol with a large clear label if applicable, simple and easy to recognize at a glance." +
          LOCKED_SUFFIX,
      },
      {
        id: "cardBack",
        label: "Card Back Design",
        promptTemplate:
          "Design a single shared CARD BACK for the {cardCategory} learning card set — a simple, bright decorative pattern or small repeated icon (not a full scene) that works behind every card front in the set. {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\nLayout: an even, repeatable decorative pattern or a small centered emblem, with enough open space at the bottom for a small logo or credit line." +
          LOCKED_SUFFIX,
      },
    ],
  });
})();
