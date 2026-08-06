/**
 * The AI Creator's Marketing Haus — Hero Banner Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (hero-banner). Website Hero Banners were previously cut from Marketing
 * Haus's own scope entirely (grouped with Brochures and Direct Mail as a
 * deliberate cut, not an oversight) — un-scratched specifically for this
 * one, since ROOTED already had a working version worth keeping rather
 * than discarding; Brochures and Direct Mail remain cut.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var BANNER_LAYOUT_OPTIONS = ["Product Left, Text Right", "Text Left, Product Right", "Centered Composition", "Full-Bleed Image"];
  var BANNER_OBJECTIVE_OPTIONS = ["Introduce Product", "Promote Offer", "Announce Launch", "Capture Leads"];
  var ART_STYLE_OPTIONS = ["Clean & Corporate", "Playful & Illustrated", "Minimal Line Icons", "Bold & Colorful", "Photo-Realistic"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];

  var LOCKED_SUFFIX = " Clean visual hierarchy with clear space reserved for a headline and a button, no watermarks, high resolution.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "hero-banner",
    usesSizing: true,
    label: "Hero Banner Generator",
    icon: "monitor",
    description: "A website hero-banner image prompt, plus a matching headline and button direction — for introducing a product, promoting an offer, or announcing a launch.",
    fieldGroupTitle: "Customize Your Hero Banner",

    fields: [
      { name: "productFocus", label: "Product / Offer", isFreeText: true, defaultValue: "the product or offer this banner introduces", placeholder: "e.g. our new fall candle collection" },
      { name: "bannerLayout", label: "Banner Layout", options: BANNER_LAYOUT_OPTIONS, defaultValue: BANNER_LAYOUT_OPTIONS[1] },
      { name: "bannerObjective", label: "Banner Objective", options: BANNER_OBJECTIVE_OPTIONS, defaultValue: BANNER_OBJECTIVE_OPTIONS[0] },
      { name: "ctaDirection", label: "Button Text Direction", isFreeText: true, defaultValue: "use one clear action button", placeholder: "e.g. Shop the Collection" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[4], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
    ],

    basePromptTemplate:
      "A website hero banner for {productFocus}, laid out as \"{bannerLayout}\", built to {bannerObjective}. {artStyle} art style, a {colorPalette} color palette{holidayClause}. {ctaDirection}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "An inviting website hero banner for {productFocus}, laid out as \"{bannerLayout}\", built to {bannerObjective}, in a {artStyle} style with a {colorPalette} color palette{holidayClause}. {ctaDirection}. Add one small decorative accent to draw the eye." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A bold, high-impact website hero banner for {productFocus}, laid out as \"{bannerLayout}\", built to {bannerObjective}, in a {artStyle} style with a {colorPalette} color palette{holidayClause}. {ctaDirection}. Use stronger visual contrast to demand attention." +
      LOCKED_SUFFIX,

    charmPool: [
      "a soft background gradient behind the composition",
      "a subtle lifestyle detail supporting the product",
      "gentle depth-of-field on the background",
    ],
    dynamicPool: [
      "a bold color block behind the headline area",
      "dramatic lighting on the product",
      "a diagonal or asymmetric composition for more energy",
    ],
  });
})();
