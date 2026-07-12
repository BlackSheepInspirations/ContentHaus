/**
 * The AI Creator's Product Haus — Kids Worksheet Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Reuses the Sections picker (built for Planner Pages) for the
 * worksheet's own numbered activity layout — a worksheet is one page
 * with several activity slots, not a multi-page set, so this stays on
 * the 3-variation system rather than Page Bundles. basePromptTemplate's
 * STYLE/TYPOGRAPHY/LAYOUT/DECORATIVE ELEMENTS/TECHNICAL/OUTPUT/NEGATIVE
 * PROMPT skeleton is modeled directly on a real prompt the owner
 * hand-tested and confirmed worked well.
 *
 * The one optional free-text field (Add Your Own Activity) carries an
 * explicit steer away from personal-identifying content, since testing
 * surfaced exactly that risk — an "About Me" custom section got flagged
 * as asking for a child's personal info before it shipped. Every other
 * field stays generic (theme/title only), so that's the one place a
 * customer could accidentally type something that shouldn't be there.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var WORKSHEET_TYPE_OPTIONS = ["All About", "Interview", "Activity Page", "Coloring Page"];
  var STYLE_OPTIONS = ["Minimal Line Art", "Playful Doodle", "Bold Outline"];
  var DECORATIVE_ELEMENTS_OPTIONS = ["Hearts", "Stars", "School Icons", "Mixed"];
  var LAYOUT_COMPLEXITY_OPTIONS = ["Simple", "Moderate", "Detailed"];
  var PAGE_SIZE_OPTIONS = ["Letter (8.5 x 11 in)", "A4"];
  var BACKGROUND_OPTIONS = ["White", "Transparent"];

  var ACTIVITY_GROUPS = [
    { label: "Word & Language", options: ["Word Scramble", "Word Search", "Fill in the Blank", "Rhyming Words", "Trace the Letters"] },
    { label: "Logic & Numbers", options: ["Connect the Dots", "Counting / Math", "Matching", "Maze", "True or False"] },
    { label: "Creative", options: ["Draw It / Draw Your Own", "Coloring Space", "Short Answer / Journal Prompt"] },
  ];

  var LOCKED_SUFFIX =
    "\n\nTECHNICAL REQUIREMENTS: Black and white only. No gradients, no color, no grayscale. 300 DPI resolution. Sized for {pageSize}. Clean vector-style line art. {background} background.\n\nOUTPUT: Flat printable worksheet layout. No mockups, no paper textures, no shadows, no perspective.\n\nNEGATIVE PROMPT: No color, no gradients, no realistic photographs, no blur, no messy layout, no watermark, no 3D effects, no grayscale shading.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "kids-worksheet",
    label: "Kids Worksheet Generator",
    icon: "document",
    description: "A printable black-and-white kids worksheet or activity page — pick up to 4 activities, add your own if you'd like (keep it general — avoid personal details like a child's full name, school, or address), and it works even if you leave everything at default.",
    fieldGroupTitle: "Customize Your Worksheet",

    fields: [
      { name: "worksheetTitle", label: "Worksheet Title", isFreeText: true, defaultValue: "My Activity Page", placeholder: "e.g. All About My Mom" },
      { name: "theme", label: "Theme", isFreeText: true, defaultValue: "dinosaurs", placeholder: "e.g. Mom, Dad, Teacher, Dinosaurs" },
      { name: "worksheetType", label: "Worksheet Type", options: WORKSHEET_TYPE_OPTIONS, defaultValue: WORKSHEET_TYPE_OPTIONS[0] },
      { name: "style", label: "Style", options: STYLE_OPTIONS, defaultValue: STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "decorativeElements", label: "Decorative Elements", options: DECORATIVE_ELEMENTS_OPTIONS, defaultValue: DECORATIVE_ELEMENTS_OPTIONS[0], aesthetic: "motifs" },
      { name: "layoutComplexity", label: "Layout Complexity", options: LAYOUT_COMPLEXITY_OPTIONS, defaultValue: LAYOUT_COMPLEXITY_OPTIONS[0] },
      { name: "pageSize", label: "Page Size", options: PAGE_SIZE_OPTIONS, defaultValue: PAGE_SIZE_OPTIONS[0] },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0], aesthetic: "texture" },
      { name: "customActivity", label: "Add Your Own Activity (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. \"What do you love most?\", \"Draw your dream house\" — keep it general, not a child's full name, school, or address." },
    ],

    sectionGroups: ACTIVITY_GROUPS,
    sectionsCap: 4,
    sectionsLabel: "Activities (pick up to 4 — leave blank for a default set)",
    defaultSections: ["Word Scramble", "Connect the Dots", "Fill in the Blank", "Draw It / Draw Your Own"],

    // Folds the optional free-text activity in as one more numbered layout
    // line, right after however many picked/default activities there are.
    computeExtraTokens: function (valueMap) {
      if (!valueMap.customActivity) return { customActivityClause: "" };
      var nextNum = parseInt(valueMap.sectionsCount || "0", 10) + 1;
      return { customActivityClause: "\n\nADDITIONAL CUSTOM SECTION:\n " + nextNum + ". " + valueMap.customActivity };
    },

    basePromptTemplate:
      "Create a black and white printable kids {worksheetType} worksheet titled \"{worksheetTitle}\" based on the theme \"{theme}\".\n\n" +
      "STYLE: {style} — hand-drawn, {style} style with clean, structured lines. Instructions are direct and precise. Black outlines only, no color fills, no grayscale shading.\n\n" +
      "TYPOGRAPHY: The main title should be in large, bold, uppercase, playful outlined font — thick outlines with hollow interiors. All supporting labels and prompt text should be in a rounded sans-serif or handwritten-style font, rendered as black outlines only.\n\n" +
      "LAYOUT ({layoutComplexity} complexity):\n{sectionsBlock}{customActivityClause}\n\n" +
      "DECORATIVE ELEMENTS: Scatter small outlined {decorativeElements} lightly around the borders and between sections. Keep decorations outlined only, not filled.{holidayClause}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a black and white printable kids {worksheetType} worksheet titled \"{worksheetTitle}\", built around the theme \"{theme}\" with an extra-charming, inviting feel.\n\n" +
      "STYLE: {style} — hand-drawn, {style} style with clean, structured lines and a warm, friendly touch. Instructions are direct and precise. Black outlines only, no color fills, no grayscale shading.\n\n" +
      "TYPOGRAPHY: The main title should be in large, bold, uppercase, playful outlined font — thick outlines with hollow interiors. All supporting labels and prompt text should be in a rounded sans-serif or handwritten-style font, rendered as black outlines only.\n\n" +
      "LAYOUT ({layoutComplexity} complexity):\n{sectionsBlock}{customActivityClause}\n\n" +
      "DECORATIVE ELEMENTS: Scatter small outlined {decorativeElements} generously around the borders and between sections for extra charm. Keep decorations outlined only, not filled.{holidayClause}" +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Create an energetic, playful take on a black and white printable kids {worksheetType} worksheet titled \"{worksheetTitle}\", built around the theme \"{theme}\".\n\n" +
      "STYLE: {style} — hand-drawn, {style} style with lively, slightly bouncy lines and dynamic composition. Instructions are direct and precise. Black outlines only, no color fills, no grayscale shading.\n\n" +
      "TYPOGRAPHY: The main title should be in large, bold, uppercase, playful outlined font — thick outlines with hollow interiors, angled slightly for extra energy. All supporting labels and prompt text should be in a rounded sans-serif or handwritten-style font, rendered as black outlines only.\n\n" +
      "LAYOUT ({layoutComplexity} complexity):\n{sectionsBlock}{customActivityClause}\n\n" +
      "DECORATIVE ELEMENTS: Scatter small outlined {decorativeElements} energetically around the borders and between sections. Keep decorations outlined only, not filled.{holidayClause}" +
      LOCKED_SUFFIX,

    charmPool: [
      "one small extra sticker-style icon tucked in a corner",
      "a tiny decorative banner above the title",
      "a subtle border flourish around the whole page",
      "one small character doodle peeking from an edge",
    ],
    dynamicPool: [
      "a bit more playful tilt to the title lettering",
      "extra motion lines around the decorative icons",
      "a more scattered, energetic icon placement",
    ],
  });
})();
