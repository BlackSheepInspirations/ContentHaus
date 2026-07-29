/**
 * The AI Creator's Project Haus — Sticker Sheet Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A single sheet of 1-12 stickers. This is one of the deliberate
 * exceptions to the "never combine multiple things into one image" rule
 * fixed elsewhere this session — a sticker sheet is SUPPOSED to have
 * multiple stickers on one image, same as Graphics Haus's Clipart Pack.
 * The locked suffix leans hard on explicit spacing/padding language
 * (rather than exact pixel math, which would need to vary per sheet size
 * and count) so the receiving AI keeps every sticker clearly separated
 * and nothing bleeding off the sheet edge.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var sortAlpha = ProductHaus.util.sortAlpha;

  var STICKER_COUNT_OPTIONS = ["1", "2", "3", "4", "6", "8", "9", "12"];
  var SHEET_TYPE_OPTIONS = ["Single Subject (Same Character, Different Poses)", "Variety Pack (Different Designs, One Theme)"];
  var SHAPE_OPTIONS = ["Die-Cut to Subject Silhouette", "Uniform Circle", "Uniform Square", "Uniform Rounded Square"];
  var SHEET_SIZE_OPTIONS = ["4 x 6 in", "5 x 7 in", "5.5 x 8.5 in (Half Letter)", "8.5 x 11 in (Letter)"];
  var BACKGROUND_OPTIONS = ["Transparent Background", "White Background"];

  // A genre/type catalog, same "curated dropdown + freeform override"
  // convention as every other Haus generator's option lists — gives a
  // non-creative user a real starting point instead of a blank box.
  var STICKER_TYPE_OPTIONS = sortAlpha([
    "Cute / Kawaii Animals",
    "Motivational Quotes & Affirmations",
    "Holiday & Seasonal",
    "Food & Drink",
    "Nature & Plants",
    "Aesthetic Vibes (Y2K, Cottagecore, Coquette, etc.)",
    "Planner & Functional Icons",
    "Kids & Cartoon Characters",
    "Pets (Dogs, Cats, Small Animals)",
    "Faith & Inspirational",
    "Funny & Sarcastic",
    "Retro & Vintage",
    "Space & Sci-Fi",
    "Travel & Adventure",
    "Beauty & Self-Care",
    "Sports & Hobbies",
    "Witchy / Celestial / Mystical",
    "Gaming & Internet Culture",
  ]);

  var ART_STYLE_OPTIONS = ["Bold Outline Cartoon", "Kawaii / Chibi", "Watercolor", "Hand-Drawn Doodle", "Retro / Vintage", "Minimalist Line Art", "Realistic / Painterly"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];

  var LOCKED_SUFFIX =
    " Arrange every sticker in a clean, evenly balanced grid layout on the sheet — leave generous, consistent padding of at least 0.25 inch between each individual sticker and at least 0.25 inch from the sheet's outer edge on all sides." +
    " No sticker may touch, overlap, or crowd another, and no sticker may bleed off or crop against the sheet edge." +
    " High resolution, clean crisp edges, commercial print-and-cut ready.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "sticker-sheet",
    label: "Sticker Sheet Generator",
    icon: "crop",
    description: "A full sheet of 1 to 12 stickers, sized and spaced correctly for print-and-cut — pick a count, a shape, and a theme.",
    fieldGroupTitle: "Customize Your Sticker Sheet",

    fields: [
      { name: "stickerCount", label: "Number of Stickers", options: STICKER_COUNT_OPTIONS, defaultValue: "4" },
      { name: "sheetType", label: "Sheet Type", options: SHEET_TYPE_OPTIONS, defaultValue: SHEET_TYPE_OPTIONS[1] },
      { name: "stickerShape", label: "Sticker Shape", options: SHAPE_OPTIONS, defaultValue: SHAPE_OPTIONS[0] },
      { name: "stickerType", label: "Sticker Type / Genre", options: STICKER_TYPE_OPTIONS, defaultValue: STICKER_TYPE_OPTIONS[0] },
      { name: "subjectDescription", label: "What Should It Show?", isFreeText: true, defaultValue: "", placeholder: "e.g. a cute golden retriever puppy in different poses" },
      { name: "stickerText", label: "Add Text (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Back to School, Good Vibes, a name..." },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "sheetSize", label: "Sheet Size", options: SHEET_SIZE_OPTIONS, defaultValue: SHEET_SIZE_OPTIONS[0] },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var count = parseInt(valueMap.stickerCount, 10) || 1;
      var countLabel = count === 1 ? "1 sticker" : count + " stickers";
      var isVariety = /Variety Pack/i.test(valueMap.sheetType);
      var hasSubject = !!valueMap.subjectDescription;
      var genreClause = " within the " + valueMap.stickerType + " genre";

      var contentClause;
      if (count === 1) {
        contentClause = hasSubject
          ? "a single sticker showing " + valueMap.subjectDescription + genreClause + "."
          : "a single sticker" + genreClause + ".";
      } else if (isVariety) {
        contentClause = hasSubject
          ? "a sheet of " + countLabel + ", each a DIFFERENT design showing " + valueMap.subjectDescription + genreClause + " — every sticker should be a distinct design, not a repeat, while sharing the same art style, color palette, and overall look for a cohesive set."
          : "a sheet of " + countLabel + ", each a DIFFERENT design" + genreClause + " — every sticker should be a distinct design, not a repeat, while sharing the same art style, color palette, and overall look for a cohesive set.";
      } else {
        contentClause = hasSubject
          ? "a sheet of " + countLabel + " all showing the SAME subject — " + valueMap.subjectDescription + genreClause + " — in different poses, angles, or expressions, so it reads as one consistent character or object across every sticker."
          : "a sheet of " + countLabel + " all showing the SAME subject" + genreClause + ", in different poses, angles, or expressions, so it reads as one consistent character or object across every sticker.";
      }

      var shapeClause;
      if (/Die-Cut/i.test(valueMap.stickerShape)) {
        shapeClause = "Each sticker should be die-cut to follow the outline of its own subject (an irregular shape hugging the artwork), not a uniform geometric shape, with a thin white or light-colored border edge as is standard for die-cut stickers.";
      } else {
        var shapeName = valueMap.stickerShape.replace(/^Uniform /i, "").toLowerCase();
        shapeClause = "Every sticker should be the same uniform " + shapeName + " shape, with the artwork centered inside and a thin white or light-colored border edge.";
      }

      // Deliberately no separate font/color fields for this — the text is
      // meant to just pick up whatever art style and color palette the
      // sheet's own fields already resolved to, not introduce a second,
      // independent style choice.
      var textClause = "";
      if (valueMap.stickerText) {
        textClause = count === 1
          ? " Include the text \"" + valueMap.stickerText + "\" as part of the sticker's design, styled to match its own art style and color palette rather than a separate font or color choice."
          : " Include the text \"" + valueMap.stickerText + "\" somewhere on the sheet — either worked into one of the sticker designs or as its own simple text-based sticker — styled to match the sheet's overall art style and color palette rather than a separate font or color choice.";
      }

      return {
        contentClause: contentClause,
        shapeClause: shapeClause,
        textClause: textClause,
      };
    },

    basePromptTemplate:
      "A print-ready sticker sheet: {contentClause} {shapeClause}{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}. Sheet size: {sheetSize}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A print-ready sticker sheet with extra charm: {contentClause} {shapeClause}{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}. Sheet size: {sheetSize}." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A print-ready, standout sticker sheet: {contentClause} {shapeClause}{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}. Sheet size: {sheetSize}." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small sparkle or star accent tucked near a couple of the stickers",
      "a soft drop shadow beneath each sticker for a little dimension",
      "a subtle glossy highlight on each sticker",
    ],
    dynamicPool: [
      "bolder, higher-contrast outlines on every sticker",
      "a slightly larger, more eye-catching scale for each design",
      "richer, more saturated colors throughout",
    ],
  });
})();
