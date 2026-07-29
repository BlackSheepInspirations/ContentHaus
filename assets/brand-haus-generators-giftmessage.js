/**
 * The AI Creator's Brand Haus — Gift Message Template Generator
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-brandkit.js, and brand-haus-generators.js (all must load
 * first — this file just registers itself with that engine).
 *
 * Same "just the base" scope as Marketing Haus's own copy of this
 * generator — the recipient's actual gift message is typed in later at
 * checkout (a Shopify "this is a gift" option), so this only designs the
 * card's background/branding and reserves clean space for that message
 * and for the logo. No Art Style or Color Palette field of its own —
 * every aesthetic value comes live from the active Brand Kit via
 * computeExtraTokens, matching Business Card Kit/Media Kit/Thank You
 * Card Insert's precedent, with generic fallback phrasing when no kit is
 * active.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var LAYOUT_STYLE_OPTIONS = ["Centered Classic", "Left-Aligned Modern", "Bold Header Banner", "Minimalist Balanced"];
  var BACKGROUND_STYLE_OPTIONS = ["Transparent Background", "Subtle Floral Pattern", "Subtle Geometric Pattern", "Textured Paper / Linen Look", "Soft Gradient Wash"];

  var LOCKED_SUFFIX =
    " Design specs: single-sided card, 6 x 4 inches, exact print area 1795 x 1193 pixels, keep all decorative elements and reserved spaces at least 0.16 inches in from every edge so nothing is cut off when trimmed." +
    " Avoid a solid, flat single-color background — this design will be printed, and solid backgrounds risk color-saturation issues; use the background style requested below instead." +
    " Reserve one large, clean, uncluttered blank rectangular space taking up most of the card's center — light-colored and free of any pattern or texture busy enough to compete with text — sized for a handwritten-length gift message that will be added later; do not add any placeholder text or lorem ipsum inside it." +
    " Reserve one separate clearly defined blank rectangular space for the company's own logo (leave it empty — do not generate a logo yourself)." +
    " Clean, professional, print-ready design, high resolution, no watermarks.";

  BrandHaus.generatorEngine.registerGenerator({
    id: "gift-message-template",
    label: "Gift Message Template Generator",
    icon: "gift",
    description: "The base design for a gift-message insert card, built straight from your active Brand Kit's colors, fonts, and mood — background and branding only. The recipient's actual message is typed in later at checkout, so this just needs a clean reserved space for it plus your logo.",
    fieldGroupTitle: "Customize Your Card Base",

    fields: [
      { name: "accentPhrase", label: "Small Accent Phrase (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. A Gift For You, With Love" },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_STYLE_OPTIONS, defaultValue: LAYOUT_STYLE_OPTIONS[0] },
      { name: "backgroundStyle", label: "Background Style", options: BACKGROUND_STYLE_OPTIONS, defaultValue: BACKGROUND_STYLE_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var kit = BrandHaus.brandKit && BrandHaus.brandKit.getActiveKit();
      var resolve = BrandHaus.engine.resolveFieldValue;
      var colors = kit ? (kit.fields.colors || []).filter(Boolean) : [];
      var mood = kit ? resolve(kit.fields.mood) : "";

      return {
        brandColorsClause: colors.length ? "Use this exact color palette: " + colors.join(", ") + "." : "Use a cohesive, professional color palette.",
        brandMoodClause: mood ? " with a " + mood + " overall feel" : "",
        accentClause: valueMap.accentPhrase ? " Include this small decorative phrase near the top, kept light and secondary to the reserved message space: \"" + valueMap.accentPhrase + "\"." : "",
      };
    },

    basePromptTemplate:
      "A {layoutStyle} gift-message insert card base design{brandMoodClause}. {brandColorsClause}{accentClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A warm, {layoutStyle} gift-message insert card base design{brandMoodClause} with a small delicate decorative touch. {brandColorsClause}{accentClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A standout, {layoutStyle} gift-message insert card base design{brandMoodClause} with a bolder decorative border treatment. {brandColorsClause}{accentClause}\n\n" +
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
