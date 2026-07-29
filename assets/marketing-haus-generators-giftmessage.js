/**
 * The AI Creator's Marketing Haus — Gift Message Template Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Same Printify packaging-insert spec as the Thank You Card Insert
 * generator (6 x 4 in, single-sided, 1795 x 1193 px print area, 0.16 in
 * safe border, transparent/patterned background only) — but deliberately
 * "less intense": this card's own gift message is typed by the customer
 * at checkout (a Shopify "this is a gift" option) and printed in later,
 * not written by the merchant here. This generator only designs the
 * card's base — background pattern/branding elements plus a reserved
 * blank area sized for that future message and a reserved logo space —
 * so it intentionally has none of the Thank You Card's contact/discount/
 * social fields.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var ART_STYLE_OPTIONS = ["Elegant & Minimal", "Warm & Handwritten", "Modern & Clean", "Whimsical & Illustrated"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var LAYOUT_STYLE_OPTIONS = ["Centered Classic", "Left-Aligned Modern", "Bold Header Banner", "Minimalist Balanced"];
  var BACKGROUND_STYLE_OPTIONS = ["Transparent Background", "Subtle Floral Pattern", "Subtle Geometric Pattern", "Textured Paper / Linen Look", "Soft Gradient Wash"];

  var LOCKED_SUFFIX =
    " Design specs: single-sided card, 6 x 4 inches, exact print area 1795 x 1193 pixels, keep all decorative elements and reserved spaces at least 0.16 inches in from every edge so nothing is cut off when trimmed." +
    " Avoid a solid, flat single-color background — this design will be printed, and solid backgrounds risk color-saturation issues; use the background style requested below instead." +
    " Reserve one large, clean, uncluttered blank rectangular space taking up most of the card's center — light-colored and free of any pattern or texture busy enough to compete with text — sized for a handwritten-length gift message that will be added later; do not add any placeholder text or lorem ipsum inside it." +
    " Reserve one separate clearly defined blank rectangular space for the company's own logo (leave it empty — do not generate a logo yourself)." +
    " Clean, professional, print-ready design, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "gift-message-template",
    label: "Gift Message Template Generator",
    icon: "gift",
    description: "The base design for a gift-message insert card — background and branding only. The recipient's actual message is typed in later at checkout, so this just needs a clean reserved space for it plus your logo.",
    fieldGroupTitle: "Customize Your Card Base",

    fields: [
      { name: "accentPhrase", label: "Small Accent Phrase (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. A Gift For You, With Love" },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_STYLE_OPTIONS, defaultValue: LAYOUT_STYLE_OPTIONS[0] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "backgroundStyle", label: "Background Style", options: BACKGROUND_STYLE_OPTIONS, defaultValue: BACKGROUND_STYLE_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        accentClause: valueMap.accentPhrase ? " Include this small decorative phrase near the top, kept light and secondary to the reserved message space: \"" + valueMap.accentPhrase + "\"." : "",
      };
    },

    basePromptTemplate:
      "A {layoutStyle} gift-message insert card base design, in {artStyle} style with a {colorPalette} color palette{holidayClause}.{accentClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A warm, {layoutStyle} gift-message insert card base design, in {artStyle} style with a {colorPalette} color palette{holidayClause} and a small delicate decorative touch.{accentClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A standout, {layoutStyle} gift-message insert card base design, in {artStyle} style with a {colorPalette} color palette{holidayClause} and a bolder decorative border treatment.{accentClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    charmPool: [
      "a delicate corner flourish",
      "a soft decorative border frame around the edge",
      "a subtle ribbon or bow motif tucked in one corner",
    ],
    dynamicPool: [
      "a bolder decorative border treatment",
      "richer color contrast in the background pattern",
      "a more ornate corner accent",
    ],
  });
})();
