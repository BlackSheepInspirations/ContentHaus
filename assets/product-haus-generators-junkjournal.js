/**
 * The AI Creator's Project Haus — Junk Journal Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * First generator built with both Look Lock and Page Bundles from day
 * one, fixing the two gaps a reference tool's version had: every field
 * there was free-text with zero starting point for a non-creative user
 * (fixed here with dropdown-or-type-your-own on every aesthetic field,
 * matching Coloring Page/Planner Pages), and its output was just one
 * flat image despite calling itself a "journal" (fixed here by making
 * this a genuine Page Bundle — Cover, Ephemera Spread, Themed Spread,
 * and Closing Page, all sharing one locked look, not a single page).
 *
 * basePromptTemplate/charmPool/dynamicPool are intentionally omitted —
 * `pageTypes` replaces the 3-variation system entirely for a bundle
 * generator, so those are never consulted.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var ART_STYLE_OPTIONS = ["Watercolor", "Vintage Collage", "Botanical Illustration", "Ink & Wash", "Mixed Media Scrapbook", "Photographic Ephemera"];
  var COLOR_PALETTE_OPTIONS = ["Muted Earth Tones", "Dusty Rose & Sage", "Dark Academia Neutrals", "Soft Pastels", "Jewel Tones", "Black & Gold Vintage"];
  var AESTHETIC_MOOD_OPTIONS = ["Dark Academia", "Cottagecore", "Romantic Vintage", "Whimsical Fairy Tale", "Moody Gothic", "Bright Bohemian", "Nostalgic Sepia"];
  var BACKGROUND_TYPE_OPTIONS = ["Aged Parchment Texture", "Distressed Kraft Paper", "Linen Fabric Texture", "Watercolor Wash", "Blank Cream Paper", "Weathered Canvas"];
  var BLANK_PAGE_VARIATION_OPTIONS = ["1", "2", "3", "4", "5"];

  var LOCKED_STYLE_SUFFIX = " Ultra-detailed, painterly rendering with soft blended edges and organic, hand-crafted texture — no harsh digital lines, no modern flat-design elements. Romantic, timeless, and richly layered.";

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
          : " Keep the same overall art style, color palette, and decorative border/texture family across all " +
            n +
            " so they read as one matching set, but vary the border, corner ornament, or accent placement on each one so no two are identical — each is meant to be used as its own separate page, not a repeat of another.",
    };
  }

  ProductHaus.generatorEngine.registerGenerator({
    id: "junk-journal",
    label: "Junk Journal Generator",
    icon: "document",
    description: "A themed junk journal page SET — cover, an ephemera spread, a themed spread, and a closing page — all sharing one locked aesthetic, not just a single image.",
    fieldGroupTitle: "Customize Your Journal",

    fields: [
      { name: "theme", label: "Theme / Focus", isFreeText: true, defaultValue: "florals and antique books", placeholder: "e.g. Florals, Travel memories, Coffee & books..." },
      { name: "elementsObjects", label: "Elements / Objects", isFreeText: true, defaultValue: "pressed flowers, vintage stamps, antique books", placeholder: "e.g. Antique books, pressed flowers, vintage stamps...", aesthetic: "motifs" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "aestheticMood", label: "Aesthetic Mood", options: AESTHETIC_MOOD_OPTIONS, defaultValue: AESTHETIC_MOOD_OPTIONS[0], aesthetic: "mood" },
      { name: "backgroundType", label: "Background Type", options: BACKGROUND_TYPE_OPTIONS, defaultValue: BACKGROUND_TYPE_OPTIONS[0], aesthetic: "texture" },
      { name: "blankPageVariations", label: "Blank Page Variations (only used if Blank Page is included below)", options: BLANK_PAGE_VARIATION_OPTIONS, defaultValue: BLANK_PAGE_VARIATION_OPTIONS[0] },
    ],

    computeExtraTokens: computeBlankPageTokens,

    pageTypesLabel: "Pages to Include (pick up to 6 — leave blank for the full set)",
    pageTypesCap: 6,
    defaultPageTypes: ["cover", "ephemera", "themed-spread", "closing"],
    bundleBlockTitle: "Your Journal Page Set",
    pageTypes: [
      {
        id: "cover",
        label: "Cover",
        promptTemplate:
          "Design a junk journal COVER PAGE centered on the theme \"{theme}\", featuring {elementsObjects} as the focal motif. {artStyle} art style, a {colorPalette} color palette, {backgroundType} as the base surface, evoking a {aestheticMood} mood{holidayClause}.\n\nLayout: a bold, centered title treatment with generous decorative framing — vintage-style ornamental borders, layered paper-collage textures, and enough open space around the title for it to read clearly at a glance. This is the piece that sets the tone for everything that follows." +
          LOCKED_STYLE_SUFFIX,
      },
      {
        id: "ephemera",
        label: "Ephemera Spread",
        promptTemplate:
          "Design a junk journal EPHEMERA SPREAD — a page of loose, layered decorative pieces (not a single focal image) themed around \"{theme}\", built from {elementsObjects} alongside vintage-style stamps, ticket stubs, ribbon scraps, and handwritten snippets. {artStyle} art style, a {colorPalette} color palette, {backgroundType} as the base surface, evoking a {aestheticMood} mood{holidayClause}.\n\nLayout: an organic scattered collage — overlapping torn-paper edges, tucked-in ephemera pieces, and visible layering, as if assembled by hand rather than perfectly aligned. Meant to be cut apart and used as loose journal embellishments, not read as one cohesive scene." +
          LOCKED_STYLE_SUFFIX,
      },
      {
        id: "themed-spread",
        label: "Themed Spread",
        promptTemplate:
          "Design a junk journal THEMED SPREAD centered around \"{theme}\", featuring {elementsObjects} as the main composition. {artStyle} art style, a {colorPalette} color palette, {backgroundType} as the base surface, evoking a {aestheticMood} mood{holidayClause}.\n\nLayout: one cohesive, richly detailed scene filling the page — the visual centerpiece of the set, meant to be read as a single complete illustration rather than scattered pieces." +
          LOCKED_STYLE_SUFFIX,
      },
      {
        id: "blankPage",
        label: "Blank Page",
        promptTemplate:
          "Design {blankPageCountPhrase} for the same junk journal set themed around \"{theme}\". {artStyle} art style, a {colorPalette} color palette, {backgroundType} as the base surface, evoking a {aestheticMood} mood{holidayClause}.\n\nLayout: the same decorative border/framing as the rest of the set, with the entire center of the page left completely open and empty — ready for the journal-keeper's own writing or added ephemera. Do not add any placeholder text, lines, or lorem ipsum.{blankPageVariationNote}" +
          LOCKED_STYLE_SUFFIX,
      },
      {
        id: "notesPage",
        label: "Notes Page",
        promptTemplate:
          "Design a NOTES page for the same junk journal set themed around \"{theme}\". {artStyle} art style, a {colorPalette} color palette, {backgroundType} as the base surface, evoking a {aestheticMood} mood{holidayClause}.\n\nLayout: the same decorative border/framing as the rest of the set, with a small \"Notes\" heading at the top and the rest of the page filled edge-to-edge with even, evenly-spaced horizontal ruled lines for handwriting. No other text, no placeholder content, no lorem ipsum." +
          LOCKED_STYLE_SUFFIX,
      },
      {
        id: "closing",
        label: "Closing Page",
        promptTemplate:
          "Design a junk journal CLOSING PAGE wrapping up the theme \"{theme}\", featuring {elementsObjects} rendered smaller and more quietly than the earlier pages. {artStyle} art style, a {colorPalette} color palette, {backgroundType} as the base surface, evoking a {aestheticMood} mood{holidayClause}.\n\nLayout: a quiet, reflective close — a small decorative motif, generous open space, and room for a short handwritten-style closing line or quote banner near the bottom." +
          LOCKED_STYLE_SUFFIX,
      },
    ],
  });
})();
