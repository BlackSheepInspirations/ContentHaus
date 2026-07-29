/**
 * The AI Creator's Project Haus — Quote Wall Art Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * First generator to use the new Starter Looks (presets) capability.
 * The reference tool's version has 5 independent style dropdowns (14
 * Design Style options alone) with no way to see how they'd combine —
 * genuinely hard to picture even with clear individual labels, since
 * the real difficulty is predicting the COMBINED result across 5 axes
 * at once. Four named, pre-combined Starter Looks fix that directly:
 * one click gives a complete, describable result, still fully editable
 * after — same "click one, then customize" philosophy Invitations/
 * Devotional's broad-mode presets already use, just reused here for a
 * narrow generator for the first time.
 *
 * Design Style option labels are also reworded to describe what they
 * look like rather than using abstract marketing names alone (e.g.
 * "Heart-Shaped Text Arrangement" instead of just "Heart Shape
 * Typography") — a smaller, complementary fix to the same problem.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var DESIGN_STYLE_OPTIONS = [
    "Minimal Typewriter Quote",
    "Bold Color Blocks Behind Text",
    "Sticky-Note Grid Layout",
    "Handwritten Text in the Corner",
    "Heart-Shaped Text Arrangement",
    "Retro Office-Humor Poster",
    "Minimal Scandinavian Serif",
    "Clean Corporate Typography",
    "Pastel Floral Border Frame",
    "Single-Color Minimal Block",
    "Abstract Line-Art Accents",
    "Striped Background with Bold Text",
    "Muted Geometric Shapes",
    "Layered Affirmation Card Collage",
  ];
  var BACKGROUND_COLOR_OPTIONS = ["Pure White", "Soft Off-White", "Warm Beige", "Pale Blush", "Neutral Taupe", "Charcoal Gray", "Deep Sage", "Matte Black", "Warm Espresso Brown"];
  var TYPOGRAPHY_DIRECTION_OPTIONS = ["Elegant Serif", "Typewriter Serif", "Bold Sans-Serif", "Rounded Playful Sans", "Handwritten Script", "Serif + Script Mix"];
  var TEXT_COLOR_MODE_OPTIONS = ["Single Solid Color", "Two-Tone Emphasis", "Three-Color Palette", "Each Line Different Color", "Each Letter Different Color", "Neutral Monochrome", "High Contrast Auto"];

  // The reference tool's own locked output branches its technical
  // instruction based on which Text Color Mode is picked — worth
  // keeping, since it's the difference between a generic instruction and
  // one that actually tells the image model what to do with that mode.
  var COLOR_MODE_INSTRUCTIONS = {
    "Single Solid Color": "Keep all text in one solid color.",
    "Two-Tone Emphasis": "Highlight key words in a second color.",
    "Three-Color Palette": "Distribute the text across three palette colors for visual variety.",
    "Each Line Different Color": "Render each line of text in a different color from the palette.",
    "Each Letter Different Color": "Render each letter in a different color from the palette for a playful effect.",
    "Neutral Monochrome": "Keep all text in a single neutral tone, with no color variation.",
    "High Contrast Auto": "Automatically choose the highest-contrast color against the background for maximum readability.",
  };

  var LOCKED_SUFFIX = " Strict flat design. No shadows, no gradients, no 3D effects. Clean edges, balanced spacing, high resolution. Commercial, Pinterest-ready aesthetic.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "quote-wall-art",
    label: "Quote Wall Art Generator",
    icon: "type",
    description: "A minimalist typography wall art piece built around your own quote — pick a Starter Look to see a complete combo instantly, then customize any part of it.",
    fieldGroupTitle: "Customize Your Quote Art",
    presetsLabel: "Starter Looks — click one to see a full combo, then customize",

    presets: [
      {
        name: "Clean & Minimal",
        description: "Simple solid-color text on white — timeless and versatile.",
        apply: { designStyle: "Minimal Typewriter Quote", backgroundColor: "Pure White", typographyDirection: "Elegant Serif", textColorMode: "Single Solid Color" },
      },
      {
        name: "Bold & Colorful",
        description: "Punchy color blocks and bold type — made to stand out.",
        apply: { designStyle: "Bold Color Blocks Behind Text", backgroundColor: "Charcoal Gray", typographyDirection: "Bold Sans-Serif", textColorMode: "Three-Color Palette" },
      },
      {
        name: "Soft & Pastel",
        description: "Delicate florals and soft color — gentle and romantic.",
        apply: { designStyle: "Pastel Floral Border Frame", backgroundColor: "Pale Blush", typographyDirection: "Serif + Script Mix", textColorMode: "Two-Tone Emphasis" },
      },
      {
        name: "Handwritten & Warm",
        description: "A cozy, personal handwritten feel.",
        apply: { designStyle: "Handwritten Text in the Corner", backgroundColor: "Warm Beige", typographyDirection: "Handwritten Script", textColorMode: "Neutral Monochrome" },
      },
    ],

    fields: [
      { name: "quoteText", label: "Main Quote / Text", isFreeText: true, defaultValue: "Be the reason someone smiles today", placeholder: "Enter your quote or affirmation here..." },
      { name: "designStyle", label: "Design Style", options: DESIGN_STYLE_OPTIONS, defaultValue: DESIGN_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "backgroundColor", label: "Background Color", options: BACKGROUND_COLOR_OPTIONS, defaultValue: BACKGROUND_COLOR_OPTIONS[0], aesthetic: "texture" },
      { name: "typographyDirection", label: "Typography Direction", options: TYPOGRAPHY_DIRECTION_OPTIONS, defaultValue: TYPOGRAPHY_DIRECTION_OPTIONS[0] },
      { name: "textColorMode", label: "Text Color Mode", options: TEXT_COLOR_MODE_OPTIONS, defaultValue: TEXT_COLOR_MODE_OPTIONS[0] },
      { name: "colorPalette", label: "Accent Color / Palette (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. pop of teal, blush and gold, sage green", aesthetic: "palette" },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        colorModeInstruction: COLOR_MODE_INSTRUCTIONS[valueMap.textColorMode] || COLOR_MODE_INSTRUCTIONS["Single Solid Color"],
        paletteClause: valueMap.colorPalette ? " Use only these colors: " + valueMap.colorPalette + "." : "",
      };
    },

    basePromptTemplate:
      "Minimalist typography wall art in {designStyle} style on a {backgroundColor} background. Display the quote: \"{quoteText}\". Typography direction: {typographyDirection}.\n\n" +
      "Text color mode: {textColorMode}. {colorModeInstruction}{paletteClause}{holidayClause}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a {designStyle} quote print on a {backgroundColor} background, featuring the quote: \"{quoteText}\", set in a {typographyDirection} typeface for a warm, inviting feel.\n\n" +
      "Text color mode: {textColorMode}. {colorModeInstruction}{paletteClause}{holidayClause}" +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an eye-catching {designStyle} quote piece on a {backgroundColor} background, showcasing the quote: \"{quoteText}\" in bold {typographyDirection} lettering with extra visual energy.\n\n" +
      "Text color mode: {textColorMode}. {colorModeInstruction}{paletteClause}{holidayClause}" +
      LOCKED_SUFFIX,

    charmPool: [
      "a small decorative divider (like a dash-heart-dash) beneath the quote",
      "a subtle corner flourish",
      "a tiny accent icon matching the quote's theme",
      "delicate small dots or stars scattered lightly around the text",
    ],
    dynamicPool: [
      "bolder scale contrast between words for visual rhythm",
      "a slightly asymmetric, dynamic text arrangement",
      "extra emphasis on the most important word or phrase",
    ],
  });
})();
