/**
 * The AI Creator's Project Haus — Sticker Pack Generator (page bundle)
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * The complement to the Sticker Generator: where that makes ONE product
 * (a single sticker OR one multi-sticker sheet, with 4 variations), this is
 * a genuine multi-PRODUCT bundle — it emits a separate, standalone die-cut
 * sticker prompt PER design (up to 8), each individually listable/sellable,
 * all sharing one locked look via the same pageTypes bundle mechanism the
 * Coloring Book / Journal bundles use. (The engine is either-4-variations OR
 * page-bundle; a bundle can't also carry the 4 variations, so cohesion is
 * enforced in-prompt via the shared style/palette/finish across every block.)
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var sortAlpha = ProductHaus.util.sortAlpha;

  var STICKER_TYPE_OPTIONS = sortAlpha([
    "Cute / Kawaii Animals", "Motivational Quotes & Affirmations", "Holiday & Seasonal",
    "Food & Drink", "Nature & Plants", "Aesthetic Vibes (Y2K, Cottagecore, Coquette, etc.)",
    "Planner & Functional Icons", "Kids & Cartoon Characters", "Pets (Dogs, Cats, Small Animals)",
    "Faith & Inspirational", "Funny & Sarcastic", "Retro & Vintage", "Space & Sci-Fi",
    "Travel & Adventure", "Beauty & Self-Care", "Sports & Hobbies", "Witchy / Celestial / Mystical",
    "Gaming & Internet Culture",
  ]);
  var ART_STYLE_OPTIONS = ["Bold Outline Cartoon", "Kawaii / Chibi", "Watercolor", "Hand-Drawn Doodle", "Retro / Vintage", "Minimalist Line Art", "Realistic / Painterly"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var FINISH_OPTIONS = ["Matte", "Glossy", "Holographic", "Glitter", "Clear / Transparent Vinyl", "Standard (unspecified)"];
  var BACKGROUND_OPTIONS = ["Transparent Background", "White Background"];

  var FINISH_PHRASES = {
    "Matte": "a smooth matte finish (no shine or glare)",
    "Glossy": "a glossy finish with a bright reflective sheen",
    "Holographic": "a holographic finish with a rainbow iridescent shimmer catching the light",
    "Glitter": "a sparkling glitter finish",
    "Clear / Transparent Vinyl": "printed on clear transparent vinyl so only the inked artwork shows",
  };

  var LOCKED_SUFFIX =
    " Contour die-cut: fully cut to its own outline with a thin, even white border hugging the artwork. Center the single sticker in the frame with clean, even empty space around it — nothing cropped or bleeding off the edge." +
    " High resolution, 300 DPI, crisp clean edges, a small even bleed with a safe cut margin, commercial print-and-cut ready.";

  // Each block is one standalone sticker in the coordinated pack. They only
  // differ by the ordinal (1st, 2nd, …) + a "different from the others" nudge;
  // shared style/palette/finish tokens keep the pack cohesive.
  function stickerBlock(n, ordinal) {
    return {
      id: "s" + n,
      label: "Sticker " + n,
      promptTemplate:
        "A print-ready single die-cut sticker — the " + ordinal + " design in a coordinated {packTheme} sticker pack — showing one distinct concept drawn from these ideas: {designIdeas}. " +
        "Make this sticker clearly DIFFERENT from the other designs in the pack (its own subject/composition), while sharing the pack's {artStyle} art style and {colorPalette} color palette{holidayClause}.{finishClause} " +
        "Background: {background}." +
        LOCKED_SUFFIX,
    };
  }

  ProductHaus.generatorEngine.registerGenerator({
    id: "sticker-pack",
    label: "Sticker Pack Generator",
    icon: "layers",
    description: "A coordinated pack of individual die-cut stickers — each its own separate, listable design, all sharing one look. Generates a distinct prompt per sticker (up to 8).",
    fieldGroupTitle: "Design Your Pack",

    presets: [
      { name: "Kawaii Animal Pack", description: "6 cute die-cut animals, kawaii, pastel, transparent.",
        apply: { packTheme: "Cute / Kawaii Animals", artStyle: "Kawaii / Chibi", colorPalette: "Soft Pastels", finish: "Glossy", background: "Transparent Background" } },
      { name: "Holographic Celestial", description: "Witchy/celestial designs with holographic shimmer.",
        apply: { packTheme: "Witchy / Celestial / Mystical", artStyle: "Minimalist Line Art", colorPalette: "Black, White & Gold", finish: "Holographic", background: "Transparent Background" } },
    ],

    fields: [
      { name: "packTheme", label: "Pack Theme / Genre", options: STICKER_TYPE_OPTIONS, defaultValue: STICKER_TYPE_OPTIONS[0] },
      { name: "designIdeas", label: "Design Ideas", isFreeText: true, defaultValue: "a few different designs on this theme", placeholder: "e.g. a sleepy cat, a coffee cup, a stack of books, a crescent moon" },
      { name: "finish", label: "Finish", options: FINISH_OPTIONS, defaultValue: FINISH_OPTIONS[1], aesthetic: "texture" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var finishPhrase = FINISH_PHRASES[valueMap.finish];
      return { finishClause: finishPhrase ? " Give the sticker " + finishPhrase + "." : "" };
    },

    pageTypesLabel: "Stickers to Include (pick up to 8 — leave blank for a 6-sticker pack)",
    pageTypesCap: 8,
    defaultPageTypes: ["s1", "s2", "s3", "s4", "s5", "s6"],
    bundleBlockTitle: "Your Sticker Pack",
    pageTypes: [
      stickerBlock(1, "1st"),
      stickerBlock(2, "2nd"),
      stickerBlock(3, "3rd"),
      stickerBlock(4, "4th"),
      stickerBlock(5, "5th"),
      stickerBlock(6, "6th"),
      stickerBlock(7, "7th"),
      stickerBlock(8, "8th"),
    ],
  });
})();
