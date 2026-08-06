/**
 * The AI Creator's Marketing Haus — Pinterest Pin Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Distinct from Social Media Studio's own "Pinterest pin + description"
 * format option — that mode only ever writes the pin's caption/search
 * text (assemblePrompt's intro is literally "Write social media content
 * for:"), never an image-generation prompt for the pin graphic itself.
 * This generator is the actual visual pin.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var PIN_PURPOSE_OPTIONS = ["Blog Post Promotion", "Product Pin", "Recipe Pin", "Tutorial / How-To Pin", "Quote / Inspiration Pin", "Lead Magnet Pin"];
  var ART_STYLE_OPTIONS = ["Clean & Minimal", "Warm Lifestyle Photography-Style", "Bright & Colorful Illustration", "Elegant & Editorial"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var TYPOGRAPHY_STYLE_OPTIONS = ["Bold Sans-Serif Overlay", "Elegant Serif Overlay", "Handwritten Script Overlay"];

  var LOCKED_SUFFIX = " Standard Pinterest pin proportions, tall vertical 2:3 format (1000x1500px), text overlay legible at thumbnail size, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "pinterest-pin",
    usesSizing: true,
    label: "Pinterest Pin Generator",
    icon: "crop",
    description: "A tall-format Pinterest pin graphic — for blog posts, products, recipes, tutorials, and more.",
    fieldGroupTitle: "Customize Your Pin",

    fields: [
      { name: "pinPurpose", label: "Pin Purpose", options: PIN_PURPOSE_OPTIONS, defaultValue: PIN_PURPOSE_OPTIONS[0] },
      { name: "titleText", label: "Overlay Title Text", isFreeText: true, defaultValue: "5 Easy Weeknight Dinners", placeholder: "e.g. 5 Easy Weeknight Dinners" },
      { name: "topic", label: "Topic", isFreeText: true, defaultValue: "quick, family-friendly dinner recipes", placeholder: "e.g. quick family-friendly dinner recipes" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "typographyStyle", label: "Typography Style", options: TYPOGRAPHY_STYLE_OPTIONS, defaultValue: TYPOGRAPHY_STYLE_OPTIONS[0] },
    ],

    basePromptTemplate:
      "A {pinPurpose} Pinterest pin about \"{topic}\", with the overlay text \"{titleText}\". {artStyle} art style, a {colorPalette} color palette, {typographyStyle}{holidayClause}.\n\n" +
      "Layout: title text placed in the upper or lower third for easy readability, with the supporting imagery filling the rest of the frame." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create an inviting {pinPurpose} pin about \"{topic}\", featuring the text \"{titleText}\", in a {artStyle} style, a {colorPalette} color palette, {typographyStyle}{holidayClause}.\n\n" +
      "Layout: title text placed in the upper or lower third, with a warm, scroll-stopping charm to the imagery." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an eye-catching {pinPurpose} pin about \"{topic}\", featuring the text \"{titleText}\", in a {artStyle} style, a {colorPalette} color palette, {typographyStyle}{holidayClause}.\n\n" +
      "Layout: title text placed in the upper or lower third, with bolder visual energy to stop the scroll." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small decorative frame or border accent",
      "a subtle arrow or pointer directing the eye to the title",
      "a soft drop shadow behind the title text for extra pop",
    ],
    dynamicPool: [
      "bolder color contrast between the title and background",
      "a diagonal or layered composition for visual energy",
      "larger, more dramatic title typography",
    ],
  });
})();
