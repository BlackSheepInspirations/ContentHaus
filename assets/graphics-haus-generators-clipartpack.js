/**
 * The AI Creator's Graphics Haus — Clipart Pack Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Consolidates the reference list's dozen-plus named clipart sets
 * (Holiday, Valentine Animals, Baby Clothesline, AfroLuxe, Whimsical
 * Easter, Y2K, Little Cowboy & Cowgirl, Cozy Bookish, Champagne & Gold,
 * Preppy Coastal, Blue Haven Coastal, Coastal Soul) into one Theme
 * dropdown-plus-freeform field rather than a dozen near-identical
 * generators — each is really the same mechanic (a themed set of
 * matching icons) with a different subject/palette. Six Starter Looks
 * give one-click named combos for the most requested themes; Theme's
 * own dropdown plus freeform covers the rest.
 *
 * Built as a genuine Page Bundle from day one (same fix as Junk
 * Journal's own "just one image" problem): a "pack" isn't one icon,
 * it's a hero piece, a set of smaller supporting icons, a seamless
 * pattern, and a blank decorative banner — all sharing one locked look.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var THEME_OPTIONS = [
    "Holiday", "Valentine Animals", "Baby Clothesline", "AfroLuxe",
    "Whimsical Easter", "Y2K", "Little Cowboy & Cowgirl", "Cozy Bookish",
    "Champagne & Gold", "Preppy Coastal", "Blue Haven Coastal", "Coastal Soul",
  ];
  var ART_STYLE_OPTIONS = ["Flat Vector Illustration", "Watercolor", "Hand-Drawn Doodle", "Retro Screen-Print", "Glossy 3D / Clay Render", "Clean Line Art"];
  var COLOR_PALETTE_OPTIONS = [
    "Warm Autumn (rust, cream, forest green)", "Pastel Chrome (baby pink, silver, lilac)",
    "Navy, White & Coral", "Gold, Terracotta & Emerald", "Classic Red & Green",
    "Warm Desert (tan, rust, cream)", "Soft Blush & Sage", "Sky Blue & Sand",
  ];
  var TEXTURE_FINISH_OPTIONS = ["Clean & Smooth Vector", "Sticker-Style with White Border", "Grainy / Textured Print", "Glossy 3D Finish"];
  var BACKGROUND_OPTIONS = ["Transparent (isolated for cutout)", "White Background", "Soft Pattern Background"];

  // Each piece is generated as its own prompt, so without an explicit
  // "match the rest" instruction the AI drifts (different line weight,
  // shading, proportions) between pieces run separately. This clause pins
  // the shared look so the whole pack reads as one cohesive collection.
  // {theme}/{artStyle}/{colorPalette} resolve per piece at assembly time.
  var COHESION_CLAUSE =
    " This is ONE piece of a coordinated matching \"{theme}\" clipart set — render it in the EXACT same {artStyle} art style, {colorPalette} color palette, line weight, outline thickness, shading, proportions, and level of detail as every other piece in the pack, so all the pieces look like one cohesive, professionally-designed matching collection (not separate unrelated images).";

  var LOCKED_SUFFIX = COHESION_CLAUSE + " Isolated clipart illustration, crisp clean edges, no background clutter, consistent line weight, commercial print-and-sticker ready, high resolution.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "clipart-pack",
    label: "Clipart Pack Generator",
    icon: "layers",
    description: "A themed clipart PACK — a hero icon, a supporting icon set, a seamless pattern, and a decorative banner, all sharing one locked look, not a single image.",
    fieldGroupTitle: "Customize Your Clipart Pack",
    presetsLabel: "Starter Looks — click a theme combo, then customize",

    presets: [
      { name: "Cozy Bookish", description: "Warm, hand-drawn autumn reading nook clipart.", apply: { theme: "Cozy Bookish", artStyle: "Hand-Drawn Doodle", colorPalette: "Warm Autumn (rust, cream, forest green)", textureFinish: "Grainy / Textured Print" } },
      { name: "Preppy Coastal", description: "Clean navy-and-coral coastal preppy clipart.", apply: { theme: "Preppy Coastal", artStyle: "Flat Vector Illustration", colorPalette: "Navy, White & Coral", textureFinish: "Clean & Smooth Vector" } },
      { name: "Y2K Chrome", description: "Glossy pastel-chrome Y2K clipart.", apply: { theme: "Y2K", artStyle: "Glossy 3D / Clay Render", colorPalette: "Pastel Chrome (baby pink, silver, lilac)", textureFinish: "Glossy 3D Finish" } },
      { name: "AfroLuxe", description: "Rich gold-and-emerald AfroLuxe clipart.", apply: { theme: "AfroLuxe", artStyle: "Flat Vector Illustration", colorPalette: "Gold, Terracotta & Emerald", textureFinish: "Clean & Smooth Vector" } },
      { name: "Holiday Classic", description: "Classic red-and-green retro holiday clipart.", apply: { theme: "Holiday", artStyle: "Retro Screen-Print", colorPalette: "Classic Red & Green", textureFinish: "Grainy / Textured Print" } },
      { name: "Little Cowboy & Cowgirl", description: "Warm desert-toned western kids' clipart.", apply: { theme: "Little Cowboy & Cowgirl", artStyle: "Hand-Drawn Doodle", colorPalette: "Warm Desert (tan, rust, cream)", textureFinish: "Sticker-Style with White Border" } },
    ],

    fields: [
      { name: "theme", label: "Theme", options: THEME_OPTIONS, defaultValue: THEME_OPTIONS[0] },
      { name: "mainSubjects", label: "Main Subjects / Objects", isFreeText: true, defaultValue: "seasonal icons and small decorative objects", placeholder: "e.g. sunflowers, mason jars, cowboy boots" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "textureFinish", label: "Texture / Finish", options: TEXTURE_FINISH_OPTIONS, defaultValue: TEXTURE_FINISH_OPTIONS[0], aesthetic: "texture" },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
    ],

    pageTypesLabel: "Pieces to Include (pick up to 4 — leave blank for the full pack)",
    pageTypesCap: 4,
    defaultPageTypes: ["hero", "supporting", "pattern", "banner"],
    bundleBlockTitle: "Your Clipart Pack",
    bundleTip: "Matching tip: generate the Hero Icon first, then paste that finished image in as a style reference when you generate the other pieces — or generate all pieces in one ChatGPT session so it holds the exact same look across the set.",
    pageTypes: [
      {
        id: "hero",
        label: "Hero Icon",
        promptTemplate:
          "Design a HERO CLIPART ICON for a \"{theme}\" clipart pack, centered on {mainSubjects} as the single, larger focal piece of the set. {artStyle} art style, a {colorPalette} color palette, {textureFinish} finish, {background}{holidayClause}.\n\nLayout: one bold, well-composed object or character filling most of the frame — the piece a buyer sees first in the pack's thumbnail." +
          LOCKED_SUFFIX,
      },
      {
        id: "supporting",
        label: "Supporting Icon Set",
        promptTemplate:
          "Design a SUPPORTING ICON SET for the same \"{theme}\" clipart pack — a small cluster of 4 to 6 smaller matching icons built from {mainSubjects}, each simple enough to stand alone once separated. {artStyle} art style, a {colorPalette} color palette, {textureFinish} finish, {background}{holidayClause}.\n\nLayout: icons arranged with clear spacing between each one (not touching or overlapping) so every piece can be individually cut out and used on its own." +
          LOCKED_SUFFIX,
      },
      {
        id: "pattern",
        label: "Seamless Pattern",
        promptTemplate:
          "Design a SEAMLESS REPEATING PATTERN for the same \"{theme}\" clipart pack, built from smaller, simplified versions of {mainSubjects} scattered in a tileable arrangement. {artStyle} art style, a {colorPalette} color palette, {textureFinish} finish, {background}{holidayClause}.\n\nLayout: an edge-to-edge repeating pattern with no visible seams when tiled, at a smaller scale than the hero icon so it reads as a background texture, not a focal image." +
          LOCKED_SUFFIX,
      },
      {
        id: "banner",
        label: "Decorative Banner / Frame",
        promptTemplate:
          "Design a DECORATIVE BANNER OR FRAME element for the same \"{theme}\" clipart pack — a blank ribbon banner, label shape, or ornamental frame bordered with small motifs from {mainSubjects}, with the center left empty. {artStyle} art style, a {colorPalette} color palette, {textureFinish} finish, {background}{holidayClause}.\n\nLayout: a clean, symmetrical decorative shape with generous open space in the middle — no text baked in, since this piece exists so the buyer can add their own." +
          LOCKED_SUFFIX,
      },
    ],
  });
})();
