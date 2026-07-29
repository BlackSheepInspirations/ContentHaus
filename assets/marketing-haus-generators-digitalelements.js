/**
 * The AI Creator's Marketing Haus — Digital Elements Pack Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A Page Bundle of small, reusable branded graphic elements (icons/
 * badges, a decorative divider, a quote-bubble callout, a border/frame)
 * rather than one finished graphic — each sharing one theme/aesthetic so
 * they drop into other posts/templates as a consistent set. Same Page
 * Bundle mechanism Project Haus's page-family generators already use
 * (ported into this Haus's own generators.js earlier this session).
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var ART_STYLE_OPTIONS = ["Clean & Corporate", "Playful & Illustrated", "Minimal Line Icons", "Bold & Colorful", "Hand-Drawn Doodle"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];

  var ISOLATION_SUFFIX = " Isolated on a transparent or clean white background, clean edges, no watermarks, high resolution — ready to drop into other social graphics.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "digital-elements-pack",
    label: "Digital Elements Pack Generator",
    icon: "sparkle",
    description: "A themed SET of small reusable graphic elements — icons, a divider, a quote callout, and a border — all sharing one look, not a single finished graphic.",
    fieldGroupTitle: "Customize Your Elements Pack",

    fields: [
      { name: "themeFocus", label: "Theme / Vibe", isFreeText: true, defaultValue: "cozy fall coffee shop vibes", placeholder: "e.g. cozy fall coffee shop vibes, bright summer citrus, minimalist wellness" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
    ],

    pageTypesCap: 4,
    pageTypesLabel: "Elements",
    defaultPageTypes: ["icons", "divider", "quotebubble", "frame"],
    bundleBlockTitle: "Your Digital Elements Pack",
    pageTypes: [
      {
        id: "icons",
        label: "Icon / Badge Set",
        promptTemplate:
          "A set of 6 small matching icons/badges themed around {themeFocus}, in {artStyle} style with a {colorPalette} color palette{holidayClause}. " +
          "Each icon simple, recognizable at small sizes, and visually consistent with the others as one cohesive set." +
          ISOLATION_SUFFIX,
      },
      {
        id: "divider",
        label: "Decorative Divider",
        promptTemplate:
          "A horizontal decorative divider/section-break graphic themed around {themeFocus}, in {artStyle} style with a {colorPalette} color palette{holidayClause}. " +
          "Simple and thin enough to sit between two blocks of text without overwhelming them." +
          ISOLATION_SUFFIX,
      },
      {
        id: "quotebubble",
        label: "Quote Bubble / Callout",
        promptTemplate:
          "A quote-bubble or callout-box graphic frame themed around {themeFocus}, in {artStyle} style with a {colorPalette} color palette{holidayClause}. " +
          "Leaves clear open space in the center for text to be added afterward — do not render any words or lettering inside it." +
          ISOLATION_SUFFIX,
      },
      {
        id: "frame",
        label: "Border / Frame Element",
        promptTemplate:
          "A decorative border/frame graphic themed around {themeFocus}, in {artStyle} style with a {colorPalette} color palette{holidayClause}. " +
          "An open frame with a clear, empty center — do not render any photo, text, or content inside it, just the decorative border itself." +
          ISOLATION_SUFFIX,
      },
    ],
  });
})();
