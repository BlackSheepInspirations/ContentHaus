/**
 * The AI Creator's Product Haus — Ebook Pages Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A simple ebook's interior PAGE TEMPLATES — cover, intro/table of
 * contents, a reusable content page layout, and a closing/CTA page —
 * built as a Page Bundle. These are visual page backgrounds/layouts for
 * an ebook, not the book's actual written content; distinct from
 * Marketing Haus's Lead Magnet Cover Generator, which is scoped to the
 * cover image alone, not the interior pages.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var EBOOK_GENRE_OPTIONS = ["Self-Help / Personal Growth", "Recipe / Cookbook", "Business / Productivity", "Wellness / Mindfulness", "Parenting Guide", "Creative / Hobby Guide"];
  var ART_STYLE_OPTIONS = ["Clean Minimalist", "Warm Editorial", "Bold Modern", "Soft Feminine"];
  var COLOR_PALETTE_OPTIONS = ["Soft Neutrals", "Bold Primary Colors", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var PAGE_FORMAT_OPTIONS = ["Standard 8.5x11 Portrait", "A4 Portrait", "Square Format"];

  var LOCKED_SUFFIX = " Clean editorial page layout, generous white space, print-and-screen ready, high resolution, no watermarks.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "ebook-pages",
    label: "Ebook Pages Generator",
    icon: "document",
    description: "An ebook's interior PAGE TEMPLATES — cover, intro/TOC, a reusable content page layout, and a closing page, all sharing one locked look.",
    fieldGroupTitle: "Customize Your Ebook Pages",

    fields: [
      { name: "ebookTopic", label: "Ebook Topic", isFreeText: true, defaultValue: "a guide to simple morning routines", placeholder: "e.g. a guide to morning routines, a recipe collection" },
      { name: "ebookGenre", label: "Ebook Genre", options: EBOOK_GENRE_OPTIONS, defaultValue: EBOOK_GENRE_OPTIONS[0] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "pageFormat", label: "Page Format", options: PAGE_FORMAT_OPTIONS, defaultValue: PAGE_FORMAT_OPTIONS[0] },
    ],

    pageTypesLabel: "Pages to Include (pick up to 4 — leave blank for the full set)",
    pageTypesCap: 4,
    defaultPageTypes: ["cover", "introToc", "contentTemplate", "closing"],
    bundleBlockTitle: "Your Ebook Page Set",
    pageTypes: [
      {
        id: "cover",
        label: "Cover Page",
        promptTemplate:
          "Design an ebook COVER for a {ebookGenre} ebook about \"{ebookTopic}\". {artStyle} art style, a {colorPalette} color palette, {pageFormat}{holidayClause}.\n\nLayout: a clean, professional composition with generous open space for a title and subtitle, the first impression a buyer sees." +
          LOCKED_SUFFIX,
      },
      {
        id: "introToc",
        label: "Intro / Table of Contents Page",
        promptTemplate:
          "Design an ebook INTRODUCTION / TABLE OF CONTENTS page for the same {ebookGenre} ebook about \"{ebookTopic}\". {artStyle} art style, a {colorPalette} color palette, {pageFormat}{holidayClause}.\n\nLayout: a simple decorative header with generous open space below for a welcome note or a numbered list of chapters/sections." +
          LOCKED_SUFFIX,
      },
      {
        id: "contentTemplate",
        label: "Content Page Template",
        promptTemplate:
          "Design a reusable interior CONTENT PAGE template for the same {ebookGenre} ebook about \"{ebookTopic}\". {artStyle} art style, a {colorPalette} color palette, {pageFormat}{holidayClause}.\n\nLayout: a light decorative header and footer with a large open area in the center for body text — meant to be reused across many interior pages, so it should read as a background/frame, not a full illustrated scene." +
          LOCKED_SUFFIX,
      },
      {
        id: "closing",
        label: "Closing / CTA Page",
        promptTemplate:
          "Design an ebook CLOSING page for the same {ebookGenre} ebook about \"{ebookTopic}\", ending on a thank-you or call-to-action note. {artStyle} art style, a {colorPalette} color palette, {pageFormat}{holidayClause}.\n\nLayout: a calm, closing composition with generous open space for a thank-you message and a call-to-action (e.g. a link, a next step, or a contact prompt)." +
          LOCKED_SUFFIX,
      },
    ],
  });
})();
