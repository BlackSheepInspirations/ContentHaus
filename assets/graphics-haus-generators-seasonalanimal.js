/**
 * The AI Creator's Graphics Haus — Seasonal Cute Animal Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Consolidates the reference list's several near-identical cute-animal
 * generators (Highland Cow, Silly Goose, Festive Dogs, Valentine
 * Animals) into one Animal Type field plus one Seasonal Theme field —
 * same underlying mechanic (one charming animal character, seasonally
 * dressed), just a different animal/season pairing each time. A single
 * illustration, not a bundle — unlike Clipart Pack, there's no natural
 * multi-piece "set" here (a sticker/card character IS the deliverable).
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var ANIMAL_TYPE_OPTIONS = ["Highland Cow", "Goose", "Dog", "Cat", "Bunny", "Fox", "Bear", "Sheep", "Owl", "Frog"];
  var SEASONAL_THEME_OPTIONS = ["Valentine's Day", "Christmas / Holiday", "Easter", "Fall / Autumn", "Summer", "Halloween", "Spring", "Birthday"];
  var ART_STYLE_OPTIONS = ["Chibi / Kawaii", "Flat Vector Illustration", "Watercolor", "Hand-Drawn Doodle", "Soft 3D / Clay Render"];
  var COLOR_PALETTE_OPTIONS = ["Soft Pastels", "Warm Autumn Tones", "Classic Red & Green", "Pink & Red Valentine", "Spring Meadow Greens", "Muted Earth Tones", "Bright & Playful"];

  var LOCKED_SUFFIX = " A cute, family-friendly animal character design, isolated on a plain or transparent background, clean and print-ready, high resolution, no text or watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "seasonal-cute-animal",
    label: "Seasonal Cute Animal Generator",
    icon: "sparkle",
    description: "One charming, seasonally-dressed animal character — ready for stickers, cards, or a themed collection.",
    fieldGroupTitle: "Customize Your Animal Character",

    fields: [
      { name: "animalType", label: "Animal Type", options: ANIMAL_TYPE_OPTIONS, defaultValue: ANIMAL_TYPE_OPTIONS[0] },
      { name: "seasonalTheme", label: "Seasonal Theme", options: SEASONAL_THEME_OPTIONS, defaultValue: SEASONAL_THEME_OPTIONS[0] },
      { name: "poseExpression", label: "Pose / Expression", isFreeText: true, defaultValue: "smiling and standing", placeholder: "e.g. winking, holding a heart balloon, mid-hop" },
      { name: "accessoryProps", label: "Accessories / Props", isFreeText: true, defaultValue: "a small matching accessory", placeholder: "e.g. bandana, flower crown, tiny sunglasses", aesthetic: "motifs" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
    ],

    basePromptTemplate:
      "A cute {animalType} character illustrated for a {seasonalTheme} theme, {poseExpression}, featuring {accessoryProps}. {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: one single character centered in frame, full body visible, expressive and charming." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create an adorable {animalType} character for a {seasonalTheme} collection, {poseExpression}, dressed up with {accessoryProps}, rendered in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: one single character centered in frame, full body visible, with extra personality and charm in the expression." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an energetic {animalType} character for a {seasonalTheme} theme, {poseExpression}, featuring {accessoryProps}, in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: one single character centered in frame, full body visible, with a lively, animated pose." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small heart-shaped blush on the cheeks",
      "a tiny matching accessory tucked to the side",
      "a subtle sparkle or twinkle near the eyes",
    ],
    dynamicPool: [
      "a playful mid-jump or mid-bounce pose",
      "a big open-mouthed happy expression",
      "extra motion lines suggesting movement",
    ],
  });
})();
