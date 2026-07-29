/**
 * The AI Creator's Project Haus — Coloring Book Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A themed Page Bundle (Cover + 3 interior coloring pages) — distinct
 * from the existing single-page Cute Animals Coloring Page Generator,
 * which is scoped to one animal character and never expanded into a
 * bundle. This one covers any theme (not just animals) and produces a
 * genuine multi-page coloring BOOK, all sharing one locked line-art
 * look via the same aesthetic-field/Look Lock bridge every bundle
 * generator uses.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var BOOK_THEME_OPTIONS = ["Cute Animals", "Under the Sea", "Dinosaurs", "Fairy Tale & Fantasy", "Vehicles & Transportation", "Nature & Garden", "Holiday & Seasonal", "Space & Sci-Fi"];
  var LINE_STYLE_OPTIONS = ["Simple Bold Outlines (toddler-friendly)", "Medium Detail Line Art", "Intricate Detailed Line Art (advanced colorists)"];
  var PAGE_COMPLEXITY_OPTIONS = ["Simple (ages 2-5)", "Moderate (ages 6-10)", "Detailed (adult coloring)"];

  // Curated so Recurring Motifs isn't a blank text box with zero starting
  // point — dropdown-or-type-your-own, same as every other themed field.
  var MOTIF_OPTIONS = [
    "Small Stars and Hearts", "Mandala Patterns", "Botanical & Leafy Accents", "Polka Dots",
    "Ribbons and Bows", "Cloud and Rainbow Accents", "Geometric Shapes", "None — Keep It Clean",
  ];
  var BORDER_FRAME_OPTIONS = ["No Border Frame", "Full Decorative Border Frame"];

  // The closed-region requirement is a baseline quality bar, not a style
  // choice — an AI-generated "coloring page" doesn't reliably close every
  // shape on its own, and an open gap makes a region uncolorable. Always
  // on, not gated behind Line Style/Page Complexity above.
  var LOCKED_SUFFIX =
    " Black and white coloring book page, clean smooth vector line art, uniform line weight, bold clear outlines, no shading, no grayscale, no color, white background, crisp digital ink lines, printable outline art, high resolution." +
    " All shapes must have fully enclosed, closed outlines with no open line gaps, so every region is cleanly colorable.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "coloring-book",
    label: "Coloring Book Generator",
    icon: "image",
    description: "A themed coloring BOOK — a cover plus 3 interior pages, all sharing one locked look, not a single page.",
    fieldGroupTitle: "Customize Your Coloring Book",

    fields: [
      { name: "bookTheme", label: "Book Theme", options: BOOK_THEME_OPTIONS, defaultValue: BOOK_THEME_OPTIONS[0] },
      { name: "mainSubjects", label: "Main Subjects", isFreeText: true, defaultValue: "bunnies and woodland friends", placeholder: "e.g. bunnies, dinosaurs, mermaids" },
      { name: "lineStyle", label: "Line Style", options: LINE_STYLE_OPTIONS, defaultValue: LINE_STYLE_OPTIONS[1], aesthetic: "artStyle" },
      { name: "motifs", label: "Recurring Motifs", options: MOTIF_OPTIONS, defaultValue: MOTIF_OPTIONS[0], aesthetic: "motifs" },
      { name: "pageComplexity", label: "Page Complexity", options: PAGE_COMPLEXITY_OPTIONS, defaultValue: PAGE_COMPLEXITY_OPTIONS[1] },
      { name: "borderFrame", label: "Border Frame", options: BORDER_FRAME_OPTIONS, defaultValue: BORDER_FRAME_OPTIONS[0] },
    ],

    // Off by default (matches every page's existing behavior) — when on,
    // adds one shared clause to every page type so the whole book gets a
    // consistent framed-border look, built from the same Recurring Motifs
    // rather than a second, independent decorative element.
    computeExtraTokens: function (valueMap) {
      return {
        borderFrameClause: valueMap.borderFrame === "Full Decorative Border Frame"
          ? " Frame the entire page with a continuous decorative border built from " + (valueMap.motifs || "small stars and hearts") + ", running around all four edges."
          : "",
      };
    },

    pageTypesLabel: "Pages to Include (pick up to 4 — leave blank for the full book)",
    pageTypesCap: 4,
    defaultPageTypes: ["cover", "page1", "page2", "page3"],
    bundleBlockTitle: "Your Coloring Book",
    pageTypes: [
      {
        id: "cover",
        label: "Cover Page",
        promptTemplate:
          "Design a coloring BOOK COVER for a \"{bookTheme}\" themed book featuring {mainSubjects} as the main focal illustration, decorated with {motifs}. {lineStyle}, {pageComplexity}{holidayClause}.\n\nLayout: one bold centered illustration with generous open space at the top for a title, symmetrical and inviting — the piece that sells the book at a glance.{borderFrameClause}" +
          LOCKED_SUFFIX,
      },
      {
        id: "page1",
        label: "Coloring Page 1",
        promptTemplate:
          "Design an interior coloring page for a \"{bookTheme}\" themed book, featuring {mainSubjects} in a simple everyday scene, decorated with {motifs}. {lineStyle}, {pageComplexity}{holidayClause}.\n\nLayout: one clear centered scene filling most of the page, easy to color within the lines.{borderFrameClause}" +
          LOCKED_SUFFIX,
      },
      {
        id: "page2",
        label: "Coloring Page 2",
        promptTemplate:
          "Design a second interior coloring page for the same \"{bookTheme}\" themed book, featuring {mainSubjects} in a different pose or setting than the previous page, decorated with {motifs}. {lineStyle}, {pageComplexity}{holidayClause}.\n\nLayout: one clear centered scene filling most of the page, varied from the other pages in the set so the book doesn't repeat itself.{borderFrameClause}" +
          LOCKED_SUFFIX,
      },
      {
        id: "page3",
        label: "Coloring Page 3",
        promptTemplate:
          "Design a third interior coloring page for the same \"{bookTheme}\" themed book, featuring {mainSubjects} in yet another distinct pose or setting, decorated with {motifs}. {lineStyle}, {pageComplexity}{holidayClause}.\n\nLayout: one clear centered scene filling most of the page, rounding out the set with a fresh composition.{borderFrameClause}" +
          LOCKED_SUFFIX,
      },
    ],
  });
})();
