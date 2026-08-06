/**
 * The AI Creator's Graphics Haus — Graphics Studio Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, and graphics-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Ports the option catalogs from Content Haus's own Graphics Mode
 * (prompt-builder-graphics.js — What Is It / Style It / Frame It /
 * Transportation) into a single Graphics Haus generator, so this Haus has
 * an equivalent broad "any subject, any style, any scene" option set
 * alongside its existing narrower themed generators.
 *
 * These option lists are curated subsets of Content Haus's much larger
 * catalogs (Character Type alone has ~60 entries across 8 buckets,
 * Background spans ~70 entries across 8 categories, etc.) rather than a
 * literal 1:1 dump — every other Graphics Haus generator uses 6-16 item
 * flat lists, and a 60+ item ungrouped dropdown would be a real UX
 * regression relative to that established pattern. Every field still has
 * "or type your own" for anything not listed, so the full catalog is
 * always reachable, just not all pre-loaded into one dropdown.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var MAIN_SUBJECT_OPTIONS = [
    "None — No Specific Subject",
  ].concat([
    // Animal/Pet
    "cat", "dog", "fox", "owl", "panda", "koala",
    // Character/Creature
    "fairy wings", "dragon wings", "mermaid", "superhero", "astronaut", "pirate",
    // Nature/Florals
    "rose", "sunflower", "cactus", "palm leaves", "wildflower bouquet",
    // Food/Drink
    "donut", "cupcake", "ice cream cone", "birthday cake", "champagne glass",
    // Object/Prop
    "coffee cup", "camera", "guitar", "basketball", "gift box",
  ].sort());

  var ART_STYLE_OPTIONS = [
    // Illustrated — one representative pick per Content Haus Character
    // Type bucket
    "cartoon style illustration", "glossy 3d chibi", "storybook gouache illustration",
    "flat vector illustration", "realistic human illustration", "retro comic pop art",
    "collectible figurine illustration", "coloring book illustration",
    // Realistic / commercial photography
    "photorealistic product shot", "studio product photography", "lifestyle photography",
    "bold graphic poster design", "clean vector flat design", "cinematic ad photography",
  ].sort();

  var COLOR_PALETTE_OPTIONS = [
    "Warm Autumn (rust, cream, forest green)", "Pastel Dreamscape (blush, lilac, sky blue)",
    "Bold Primary Pop (red, blue, yellow)", "Classic Black & Gold",
    "Soft Neutral (beige, cream, taupe)", "Vibrant Tropical (coral, teal, sunshine yellow)",
    "Moody Jewel Tones (emerald, sapphire, plum)", "Rainbow Multicolor",
  ];

  var BACKGROUND_OPTIONS = [
    "transparent background png", "solid white background", "soft pastel gradient",
    "sparkly confetti effect", "starry night sky", "urban graffiti wall", "sunset skyline",
    "enchanted forest", "crystal cave", "beach", "forest", "autumn forest", "snowy landscape",
    "space", "underwater scene", "seamless white studio backdrop",
  ].sort();

  var SCENE_EFFECT_OPTIONS = [
    "None — No Extra Effect", "floating in clouds", "surrounded by sparkles",
    "energy burst explosion", "falling autumn leaves", "falling snow",
    "floating flower petals", "butterflies", "fire embers", "magical mist", "lightning storm",
  ];

  var LIGHTING_OPTIONS = [
    "studio lighting", "golden hour glow", "soft diffused light", "dramatic shadows",
    "neon glow", "candlelight", "moonlight", "backlit silhouette", "warm amber tones",
    "cool blue tones", "aurora borealis glow", "sunset glow",
  ].sort();

  var FRAMING_OPTIONS = [
    "no frame", "simple frame border", "gold gilded frame", "vintage wooden frame",
    "modern minimalist frame", "abstract geometric frame", "floral wreath frame",
    "ornate decorative frame", "diamond-encrusted frame", "comic book panel frame",
    "polaroid style frame", "chalkboard frame",
  ];

  // Parity with Content Haus's Graphics Frame It — default "" (opt-in) so
  // existing prompts don't change.
  var TIME_ERA_OPTIONS = [
    "", "modern day", "retro 50s", "retro 70s", "retro 80s", "y2k / retro 90s",
    "vintage / antique", "victorian", "art deco", "medieval / fantasy", "futuristic", "ancient",
  ];
  var CAMERA_ANGLE_OPTIONS = [
    "", "front view", "3/4 angle", "side profile", "top-down / flat lay",
    "low angle", "high angle", "close-up", "wide establishing shot",
  ];

  // Content Haus's Air/Land/Rail/Water/Military transportation, now as a
  // GROUPED dropdown (optgroups) so vehicles browse by category — the engine
  // renders <optgroup>s from a field's optionGroups.
  var VEHICLE_GROUPS = [
    { label: "—", options: ["None — No Vehicle"] },
    { label: "Air", options: ["modern airplane", "helicopter", "hot air balloon", "private jet", "fighter jet"] },
    { label: "Land", options: ["sports car", "luxury car", "muscle car", "convertible", "modern truck", "jeep", "chopper style motorcycle", "dirt bike", "bicycle"] },
    { label: "Rail", options: ["train", "steam train", "freight train"] },
    { label: "Water", options: ["sail boat", "yacht", "speed boat", "jet ski", "canoe"] },
    { label: "Military", options: ["tank", "humvee", "military jet", "military helicopter", "submarine"] },
  ];

  var VEHICLE_COLOR_OPTIONS = [
    "black", "white", "red", "blue", "silver", "gray", "gold", "chrome", "matte black",
    "candy apple red", "racing green", "navy blue", "yellow", "orange", "camo/camouflage",
    "two-tone paint",
  ];

  var LOCKED_SUFFIX = " Clean commercial-quality graphic, crisp clean edges, no clutter, high resolution, no watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "graphics-studio",
    label: "Graphics Studio Generator",
    icon: "sparkle",
    description: "A flexible any-subject graphic — pick a subject, style, background, lighting, framing, and even an optional vehicle, or leave it all at default for a clean general-purpose graphic.",
    fieldGroupTitle: "Customize Your Graphic",

    fields: [
      { name: "mainSubject", label: "Main Subject", options: MAIN_SUBJECT_OPTIONS, defaultValue: MAIN_SUBJECT_OPTIONS[0] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
      { name: "sceneEffect", label: "Scene Effect (optional)", options: SCENE_EFFECT_OPTIONS, defaultValue: SCENE_EFFECT_OPTIONS[0] },
      { name: "lightingEffects", label: "Lighting", options: LIGHTING_OPTIONS, defaultValue: LIGHTING_OPTIONS[0], aesthetic: "mood" },
      { name: "framing", label: "Framing", options: FRAMING_OPTIONS, defaultValue: FRAMING_OPTIONS[0] },
      { name: "timeEra", label: "Time / Era (optional)", options: TIME_ERA_OPTIONS, defaultValue: "" },
      { name: "cameraAngle", label: "Camera Angle (optional)", options: CAMERA_ANGLE_OPTIONS, defaultValue: "" },
      { name: "vehicle", label: "Vehicle (optional)", optionGroups: VEHICLE_GROUPS, defaultValue: "None — No Vehicle" },
      { name: "vehicleColor", label: "Vehicle Color", options: VEHICLE_COLOR_OPTIONS, defaultValue: VEHICLE_COLOR_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var subjectClause = (valueMap.mainSubject && valueMap.mainSubject.indexOf("None") !== 0)
        ? ", featuring a " + valueMap.mainSubject
        : "";
      var sceneEffectClause = (valueMap.sceneEffect && valueMap.sceneEffect.indexOf("None") !== 0)
        ? ", " + valueMap.sceneEffect
        : "";
      var vehicleClause = (valueMap.vehicle && valueMap.vehicle.indexOf("None") !== 0)
        ? " Include a " + valueMap.vehicleColor + " " + valueMap.vehicle + " in the scene."
        : "";
      var eraClause = valueMap.timeEra ? ", " + valueMap.timeEra + " era" : "";
      var angleClause = valueMap.cameraAngle ? ", " + valueMap.cameraAngle : "";
      return { subjectClause: subjectClause, sceneEffectClause: sceneEffectClause, vehicleClause: vehicleClause, eraClause: eraClause, angleClause: angleClause };
    },

    basePromptTemplate:
      "Create a clean, professional graphic{subjectClause}, in a {artStyle} style with a {colorPalette} color palette. Background: {background}{sceneEffectClause}, {lightingEffects} lighting, {framing}{eraClause}{angleClause}{holidayClause}.{vehicleClause}\n\n" +
      "Layout: one well-composed, centered graphic filling most of the frame." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a charming, extra-polished graphic{subjectClause}, in a {artStyle} style with a {colorPalette} color palette. Background: {background}{sceneEffectClause}, {lightingEffects} lighting, {framing}{eraClause}{angleClause}{holidayClause}.{vehicleClause}\n\n" +
      "Layout: one well-composed, centered graphic filling most of the frame, with extra charm and personality." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Create a bold, eye-catching graphic{subjectClause}, in a {artStyle} style with a {colorPalette} color palette. Background: {background}{sceneEffectClause}, {lightingEffects} lighting, {framing}{eraClause}{angleClause}{holidayClause}.{vehicleClause}\n\n" +
      "Layout: one well-composed, centered graphic filling most of the frame, with bolder visual energy." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small extra decorative accent tucked in a corner",
      "a subtle glow or shine highlight",
      "one tiny extra sparkle or flourish detail",
    ],
    dynamicPool: [
      "bolder color contrast for extra visual pop",
      "a slight dynamic tilt to the main subject",
      "small motion or energy lines suggesting movement",
    ],

    presets: [
      { name: "Vector Icon", description: "Clean flat vector icon, transparent background, bold palette.", apply: { artStyle: "flat vector illustration", background: "transparent background png", colorPalette: "Bold Primary Pop (red, blue, yellow)" } },
      { name: "Dreamy Pastel Scene", description: "Storybook illustration, soft pastel gradient, sparkle effect.", apply: { artStyle: "storybook gouache illustration", background: "soft pastel gradient", sceneEffect: "surrounded by sparkles", colorPalette: "Pastel Dreamscape (blush, lilac, sky blue)" } },
      { name: "Retro Poster", description: "Bold graphic poster design, sunset skyline, warm palette.", apply: { artStyle: "bold graphic poster design", background: "sunset skyline", colorPalette: "Warm Autumn (rust, cream, forest green)" } },
    ],
  });
})();
