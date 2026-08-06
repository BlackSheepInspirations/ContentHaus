/**
 * The AI Creator's Marketing Haus — Product Advertisement Graphic Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Distinct from Ad Copy & Creative Studio, which only ever writes ad
 * headline/body copy text — this generator produces the actual visual
 * ad graphic (product, benefit, and offer composed into one image),
 * the same locked-template-plus-aesthetic-fields shape as every other
 * Quick Generators entry, not a copywriting tool.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var AD_FORMAT_OPTIONS = ["Square Social Ad", "Story / Vertical Ad", "Banner / Wide Ad"];
  var ART_STYLE_OPTIONS = ["Clean Product-Focused", "Lifestyle Context Scene", "Bold Sale Graphic", "Premium / Luxury"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];

  var LOCKED_SUFFIX = " Commercial advertising graphic, clear focal product, balanced composition, platform-ready, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "product-ad-graphic",
    usesSizing: true,
    label: "Product Advertisement Graphic Generator",
    icon: "lightning",
    description: "A visual product ad — your product, its key benefit, and any offer, composed into one platform-ready graphic.",
    fieldGroupTitle: "Customize Your Ad Graphic",

    fields: [
      { name: "productDescription", label: "Product Description", isFreeText: true, defaultValue: "handmade soy candles", placeholder: "e.g. handmade candles, a fitness app, a skincare serum" },
      { name: "keyBenefit", label: "Key Benefit / Hook", isFreeText: true, defaultValue: "burns cleaner for 40+ hours", placeholder: "e.g. burns cleaner for 40+ hours, no ads no tracking" },
      { name: "offerDetails", label: "Offer Details (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. 20% off, free shipping over $50" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "adFormat", label: "Ad Format", options: AD_FORMAT_OPTIONS, defaultValue: AD_FORMAT_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        offerClause: valueMap.offerDetails ? ", featuring the offer: " + valueMap.offerDetails : "",
      };
    },

    basePromptTemplate:
      "A {adFormat} advertisement graphic for {productDescription}, highlighting \"{keyBenefit}\"{offerClause}. {artStyle} style, a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: the product and key benefit as the clear focal point, with the offer (if any) as a secondary supporting element." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create an inviting {adFormat} ad for {productDescription}, showcasing \"{keyBenefit}\"{offerClause}, in a {artStyle} style, a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: the product and key benefit as the clear focal point, with a warm decorative touch." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design a bold {adFormat} ad for {productDescription}, spotlighting \"{keyBenefit}\"{offerClause}, in a {artStyle} style, a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: the product and key benefit as the clear focal point, with bolder visual energy to stop the scroll." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small decorative accent framing the product",
      "a subtle soft glow or highlight behind the product",
      "a small badge-style icon reinforcing the benefit",
    ],
    dynamicPool: [
      "bolder color contrast between the product and background",
      "a more dynamic angled product placement",
      "larger, more confident benefit typography",
    ],
  });
})();
