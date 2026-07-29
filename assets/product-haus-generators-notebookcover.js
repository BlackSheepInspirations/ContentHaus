/**
 * The AI Creator's Project Haus — Notebook Cover Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (notebook-cover) — composition/notebook cover designs, placed in the
 * Journals category alongside Journal Pages and Junk Journal since it's
 * the same "print-ready cover" job for a different bound product. A
 * single cover design, not a Page Bundle — a notebook cover is one
 * deliverable, not a multi-page product.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var COVER_STYLE_OPTIONS = ["Typography-Led", "Pattern-Based", "Illustrated", "Minimal", "Luxury"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var COVER_FORMAT_OPTIONS = ["Front Cover Only", "Full Wrap (Front + Back + Spine)", "Square Cover"];

  var LOCKED_SUFFIX = " Print-ready design, clean edges, no watermarks, high resolution.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "notebook-cover",
    label: "Notebook Cover Generator",
    icon: "document",
    description: "A print-ready cover design for a notebook or composition book — typography-led, patterned, illustrated, minimal, or luxury.",
    fieldGroupTitle: "Customize Your Notebook Cover",

    fields: [
      { name: "coverStyle", label: "Cover Style", options: COVER_STYLE_OPTIONS, defaultValue: COVER_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "coverFormat", label: "Cover Format", options: COVER_FORMAT_OPTIONS, defaultValue: COVER_FORMAT_OPTIONS[0] },
      { name: "coverText", label: "Exact Cover Text (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. My Composition Notebook, or a name/subject line" },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        coverTextClause: valueMap.coverText
          ? " Render the title text \"" + valueMap.coverText + "\" clearly on the cover."
          : " No title text — leave the cover clean and design-only.",
      };
    },

    basePromptTemplate:
      "A {coverStyle} notebook/composition-book cover design, as a {coverFormat}, in a {colorPalette} color palette{holidayClause}.{coverTextClause}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "An eye-catching {coverStyle} notebook/composition-book cover design, as a {coverFormat}, in a {colorPalette} color palette{holidayClause}, with one small decorative accent.{coverTextClause}" +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A bold, standout {coverStyle} notebook/composition-book cover design, as a {coverFormat}, in a {colorPalette} color palette{holidayClause}, with stronger visual contrast.{coverTextClause}" +
      LOCKED_SUFFIX,

    charmPool: [
      "a subtle texture across the background",
      "a thin decorative border",
      "a small corner motif",
    ],
    dynamicPool: [
      "a bold color-block band across part of the cover",
      "a more graphic, high-contrast layout",
      "an oversized typographic treatment",
    ],
  });
})();
