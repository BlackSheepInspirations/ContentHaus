/**
 * The AI Creator's Project Haus — Adult Coloring Page Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Sibling to the Cute Animals Coloring Page Generator, not a shared
 * generator with an age toggle — the two audiences want genuinely
 * different subject matter (mandalas/botanicals/geometric pattern work
 * vs. a single cute character), so this gets its own field set rather
 * than bolting an "adult mode" onto the kids generator. Same locked-base
 * pattern: a large fixed rendering directive, plus a handful of small
 * visible fields, most defaulted, so leaving everything untouched still
 * produces a usable page.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var THEME_OPTIONS = [
    "Mandala Pattern", "Botanical & Floral", "Geometric Abstract", "Zen Garden & Nature Scene",
    "Paisley & Ornamental", "Celestial & Cosmic", "Ocean & Sea Life", "Detailed Animal Portrait",
  ];

  var SYMMETRY_OPTIONS = ["Radial Symmetry (Mandala-Style)", "Organic Flowing Pattern", "Repeating Tile Pattern", "Single Centered Illustration"];

  var LINE_STYLE_OPTIONS = ["Fine Detailed Line Art", "Bold Stylized Line Art"];
  var PATTERN_DENSITY_OPTIONS = ["Highly Intricate (advanced colorists)", "Moderately Detailed", "Ultra-Detailed Fine Line"];
  var BORDER_STYLE_OPTIONS = ["Decorative Framed Border", "Full-Bleed (edge to edge)", "Corner Accents Only"];
  var PAGE_FORMAT_OPTIONS = ["Standard vertical 8.5x11", "Centered square layout"];

  // Same baseline quality bar the Cute Animals/Coloring Book generators
  // use — an AI-generated coloring page doesn't reliably close every
  // shape on its own, and an open gap makes a region uncolorable.
  var CLOSED_REGION_NOTE = " All shapes must have fully enclosed, closed outlines with no open line gaps, so every region is cleanly colorable.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "adult-coloring-page",
    label: "Adult Coloring Page Generator",
    icon: "palette",
    description: "A printable black-and-white intricate coloring page — mandalas, botanicals, geometric pattern work, and more — works even if you don't touch a single field below.",
    fieldGroupTitle: "Customize Your Adult Coloring Page",

    fields: [
      { name: "theme", label: "Theme", options: THEME_OPTIONS, defaultValue: THEME_OPTIONS[0] },
      { name: "mainMotif", label: "Main Motif", isFreeText: true, defaultValue: "lotus flowers and flowing vines", placeholder: "e.g. lotus flowers, feathers, seashells, ferns" },
      { name: "symmetryStyle", label: "Composition Style", options: SYMMETRY_OPTIONS, defaultValue: SYMMETRY_OPTIONS[0] },
      { name: "lineStyle", label: "Line Style", options: LINE_STYLE_OPTIONS, defaultValue: LINE_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "patternDensity", label: "Pattern Density", options: PATTERN_DENSITY_OPTIONS, defaultValue: PATTERN_DENSITY_OPTIONS[0] },
      { name: "borderStyle", label: "Border Style", options: BORDER_STYLE_OPTIONS, defaultValue: BORDER_STYLE_OPTIONS[0], aesthetic: "motifs" },
      { name: "pageFormat", label: "Page Format", options: PAGE_FORMAT_OPTIONS, defaultValue: PAGE_FORMAT_OPTIONS[0] },
    ],

    basePromptTemplate:
      "A {theme} adult coloring page featuring {mainMotif}, arranged in a {symmetryStyle} composition. {borderStyle}{holidayClause}. Style: black and white coloring book page for adults, {lineStyle}, {patternDensity}, no shading, no grayscale, no color, white background, crisp clean ink lines, printable outline art, high resolution, {pageFormat}." +
      CLOSED_REGION_NOTE,

    charmPromptTemplate:
      "An elegant {theme} adult coloring page centered on {mainMotif}, laid out in a {symmetryStyle} composition with extra decorative flourish. {borderStyle}{holidayClause}. Style: black and white coloring book page for adults, {lineStyle}, {patternDensity}, no shading, no grayscale, no color, white background, crisp clean ink lines, printable outline art, high resolution, {pageFormat}." +
      CLOSED_REGION_NOTE,

    dynamicPromptTemplate:
      "A striking, high-contrast {theme} adult coloring page built around {mainMotif}, in a {symmetryStyle} composition with bolder visual rhythm. {borderStyle}{holidayClause}. Style: black and white coloring book page for adults, {lineStyle}, {patternDensity}, no shading, no grayscale, no color, white background, crisp clean ink lines, printable outline art, high resolution, {pageFormat}." +
      CLOSED_REGION_NOTE,

    charmPool: [
      "a few extra fine-line filler details in the open spaces",
      "a subtle secondary pattern layered behind the main motif",
      "delicate dot-work accents along the pattern's edges",
      "a small decorative flourish at each corner",
    ],
    dynamicPool: [
      "sharper geometric transitions between pattern sections",
      "a more layered, multi-tiered pattern structure",
      "stronger contrast between fine detail areas and open space",
    ],
  });
})();
