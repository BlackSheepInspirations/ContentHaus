/**
 * The AI Creator's Project Haus — Sticker Generator (premium)
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Handles the whole sticker range from a single standalone die-cut
 * sticker up to a full 12-up sheet. Premium controls a real print-on-
 * demand shop expects:
 *   - Cut Type: Die-Cut (each sticker cut to its own outline) vs
 *     Kiss-Cut (cut through the vinyl only, on a shared backing).
 *   - Finish: matte / glossy / holographic / glitter / clear vinyl.
 *   - Standalone single mode: at count = 1 the output is framed as one
 *     centered die-cut sticker, NOT a "sheet" with grid spacing.
 *   - Matching set: Variety and Single-Subject modes enforce a cohesive
 *     coordinated set (shared style/palette) so a multi-sticker sheet
 *     reads as one collection.
 * The count=1 vs count>1 arrangement/size language is computed (not baked
 * into the locked suffix) so a single sticker never inherits sheet-grid
 * spacing instructions.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var sortAlpha = ProductHaus.util.sortAlpha;

  var STICKER_COUNT_OPTIONS = ["1", "2", "3", "4", "6", "8", "9", "12"];
  var CUT_TYPE_OPTIONS = [
    "Die-Cut (each sticker cut to its own outline)",
    "Kiss-Cut (cut through the vinyl only, on a shared backing)",
  ];
  var SHEET_TYPE_OPTIONS = ["Single Subject (Same Character, Different Poses)", "Variety Pack (Different Designs, One Theme)"];
  var SHAPE_OPTIONS = ["Contour / Silhouette (follows the artwork)", "Uniform Circle", "Uniform Square", "Uniform Rounded Square"];
  var FINISH_OPTIONS = ["Matte", "Glossy", "Holographic", "Glitter", "Clear / Transparent Vinyl", "Standard (unspecified)"];
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

  var FINISH_PHRASES = {
    "Matte": "a smooth matte finish (no shine or glare)",
    "Glossy": "a glossy finish with a bright reflective sheen",
    "Holographic": "a holographic finish with a rainbow iridescent shimmer catching the light",
    "Glitter": "a sparkling glitter finish",
    "Clear / Transparent Vinyl": "printed on clear transparent vinyl so only the inked artwork shows",
  };

  // Universal print requirements only — NO arrangement/spacing language
  // here (that is count-dependent and injected via {arrangementClause}).
  var LOCKED_SUFFIX =
    " High resolution, 300 DPI, crisp clean edges, a small even bleed with a safe cut margin so nothing important sits on the cut line, commercial print-and-cut ready.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "sticker-sheet",
    label: "Sticker Generator",
    icon: "crop",
    description: "One standalone die-cut sticker or a full sheet of up to 12 — pick a cut type (die-cut / kiss-cut), a finish, a shape, and a theme. 300 DPI print-and-cut ready.",
    fieldGroupTitle: "Customize Your Stickers",

    presets: [
      { name: "Single Die-Cut", description: "One contour die-cut sticker, glossy, transparent.",
        apply: { stickerCount: "1", cutType: CUT_TYPE_OPTIONS[0], stickerShape: SHAPE_OPTIONS[0], finish: "Glossy", background: "Transparent Background" } },
      { name: "Kiss-Cut Variety Sheet", description: "6-up variety kiss-cut sheet, matte, one theme.",
        apply: { stickerCount: "6", cutType: CUT_TYPE_OPTIONS[1], sheetType: SHEET_TYPE_OPTIONS[1], finish: "Matte", background: "White Background" } },
      { name: "Holographic Set", description: "4 die-cut, same subject, holographic shimmer.",
        apply: { stickerCount: "4", cutType: CUT_TYPE_OPTIONS[0], sheetType: SHEET_TYPE_OPTIONS[0], finish: "Holographic", background: "Transparent Background" } },
    ],

    fields: [
      { name: "stickerCount", label: "Number of Stickers", options: STICKER_COUNT_OPTIONS, defaultValue: "1" },
      { name: "cutType", label: "Cut Type", options: CUT_TYPE_OPTIONS, defaultValue: CUT_TYPE_OPTIONS[0] },
      { name: "sheetType", label: "Set Type (for 2+ stickers)", options: SHEET_TYPE_OPTIONS, defaultValue: SHEET_TYPE_OPTIONS[1] },
      { name: "stickerShape", label: "Sticker Shape", options: SHAPE_OPTIONS, defaultValue: SHAPE_OPTIONS[0] },
      { name: "finish", label: "Finish", options: FINISH_OPTIONS, defaultValue: FINISH_OPTIONS[0], aesthetic: "texture" },
      { name: "stickerType", label: "Sticker Type / Genre", options: STICKER_TYPE_OPTIONS, defaultValue: STICKER_TYPE_OPTIONS[0] },
      { name: "subjectDescription", label: "What Should It Show?", isFreeText: true, defaultValue: "", placeholder: "e.g. a cute golden retriever puppy in different poses" },
      { name: "stickerText", label: "Add Text (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Back to School, Good Vibes, a name..." },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "sheetSize", label: "Sheet Size (for 2+ stickers)", options: SHEET_SIZE_OPTIONS, defaultValue: SHEET_SIZE_OPTIONS[0] },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var count = parseInt(valueMap.stickerCount, 10) || 1;
      var countLabel = count === 1 ? "1 sticker" : count + " stickers";
      var isVariety = /Variety Pack/i.test(valueMap.sheetType);
      var isDieCut = /Die-Cut/i.test(valueMap.cutType);
      var hasSubject = !!valueMap.subjectDescription;
      var genreClause = " within the " + valueMap.stickerType + " genre";

      // Product noun adapts so a single sticker is never called a "sheet".
      var productLabel;
      if (count === 1) {
        productLabel = isDieCut ? "die-cut sticker" : "single kiss-cut sticker";
      } else {
        productLabel = isDieCut ? "die-cut sticker sheet" : "kiss-cut sticker sheet";
      }

      var contentClause;
      if (count === 1) {
        contentClause = hasSubject
          ? "a single sticker showing " + valueMap.subjectDescription + genreClause + "."
          : "a single sticker" + genreClause + ".";
      } else if (isVariety) {
        contentClause = hasSubject
          ? "a coordinated set of " + countLabel + ", each a DIFFERENT design showing " + valueMap.subjectDescription + genreClause + " — every sticker a distinct design, not a repeat, while sharing the same art style, color palette, line weight, and overall look so the set reads as one cohesive collection."
          : "a coordinated set of " + countLabel + ", each a DIFFERENT design" + genreClause + " — every sticker a distinct design, not a repeat, while sharing the same art style, color palette, line weight, and overall look so the set reads as one cohesive collection.";
      } else {
        contentClause = hasSubject
          ? "a matching set of " + countLabel + " all showing the SAME subject — " + valueMap.subjectDescription + genreClause + " — in different poses, angles, or expressions, so it reads as one consistent character or object across every sticker."
          : "a matching set of " + countLabel + " all showing the SAME subject" + genreClause + ", in different poses, angles, or expressions, so it reads as one consistent character or object across every sticker.";
      }

      // Cut Type = production method; Sticker Shape = outline of each piece.
      var cutTypeClause;
      if (isDieCut) {
        cutTypeClause = count === 1
          ? " Produce it as a die-cut sticker: fully cut out to its outline with a thin, even white border hugging the artwork."
          : " Produce these as die-cut stickers: each one fully cut out to its own outline with a thin, even white border, presented as separate individual stickers.";
      } else {
        cutTypeClause = count === 1
          ? " Produce it as a kiss-cut sticker: the artwork cut through the top vinyl only, centered on its own square backing with a small even border."
          : " Produce these as kiss-cut stickers on a single shared rectangular backing sheet: the artwork of each is cut through the top vinyl only while the backing stays intact behind them all, each design surrounded by a small even border.";
      }

      var shapeClause;
      if (/Contour|Silhouette/i.test(valueMap.stickerShape)) {
        shapeClause = "Each sticker's border follows the contour/silhouette of its own artwork (an irregular shape hugging the design), not a uniform geometric shape.";
      } else {
        var shapeName = valueMap.stickerShape.replace(/^Uniform /i, "").toLowerCase();
        shapeClause = "Each sticker uses the same uniform " + shapeName + " shape, with the artwork centered inside and a thin clean border.";
      }

      var finishPhrase = FINISH_PHRASES[valueMap.finish];
      var finishClause = finishPhrase ? " Give the sticker" + (count === 1 ? "" : "s") + " " + finishPhrase + "." : "";

      // Deliberately no separate font/color fields — the text picks up
      // whatever art style and color palette the design already resolved
      // to, rather than introducing a second, independent style choice.
      var textClause = "";
      if (valueMap.stickerText) {
        textClause = count === 1
          ? " Include the text \"" + valueMap.stickerText + "\" as part of the sticker's design, styled to match its own art style and color palette."
          : " Include the text \"" + valueMap.stickerText + "\" somewhere in the set — worked into one design or as its own simple text-based sticker — styled to match the set's overall art style and color palette.";
      }

      var sizeClause = count === 1 ? "" : " Sheet size: " + valueMap.sheetSize + ".";

      var arrangementClause;
      if (count === 1) {
        arrangementClause = " Center the single sticker in the frame with clean, even empty space around it — nothing cropped or bleeding off the edge.";
      } else {
        arrangementClause =
          " Arrange every sticker in a clean, evenly balanced grid on the sheet — leave generous, consistent padding of at least 0.25 inch between each sticker and at least 0.25 inch from the sheet's outer edge on all sides." +
          " No sticker may touch, overlap, crowd another, or bleed off or crop against the sheet edge.";
      }

      return {
        productLabel: productLabel,
        contentClause: contentClause,
        cutTypeClause: cutTypeClause,
        shapeClause: shapeClause,
        finishClause: finishClause,
        textClause: textClause,
        sizeClause: sizeClause,
        arrangementClause: arrangementClause,
      };
    },

    basePromptTemplate:
      "A print-ready {productLabel}: {contentClause} {shapeClause}{cutTypeClause}{finishClause}{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}.{sizeClause}{arrangementClause}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A print-ready {productLabel} with extra charm: {contentClause} {shapeClause}{cutTypeClause}{finishClause}{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}.{sizeClause}{arrangementClause}" +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A print-ready, standout {productLabel}: {contentClause} {shapeClause}{cutTypeClause}{finishClause}{textClause} {artStyle} art style, a {colorPalette} color palette{holidayClause}. Background: {background}.{sizeClause}{arrangementClause}" +
      LOCKED_SUFFIX,

    charmPool: [
      "a small sparkle or star accent tucked near the artwork",
      "a soft drop shadow beneath each sticker for a little dimension",
      "a subtle glossy highlight on each sticker",
    ],
    dynamicPool: [
      "bolder, higher-contrast outlines throughout",
      "a slightly larger, more eye-catching scale for each design",
      "richer, more saturated colors throughout",
    ],
  });
})();
