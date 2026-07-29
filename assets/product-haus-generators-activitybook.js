/**
 * The AI Creator's Project Haus — Activity Book Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A themed Page Bundle where each page is a genuinely different
 * ACTIVITY TYPE (maze, word search, connect-the-dots, matching) rather
 * than the same page type repeated — a real page bundle use case Junk
 * Journal's Cover/Spread pattern doesn't cover, since each page type
 * here needs its own distinct instruction (a maze needs a maze, a word
 * search needs a letter grid), not a variation on one theme.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var BOOK_THEME_OPTIONS = ["Farm Animals", "Ocean Adventure", "Space Explorers", "Dinosaur Discovery", "Princess & Castles", "Cars & Trucks", "Bugs & Garden"];
  var ART_STYLE_OPTIONS = ["Playful Cartoon", "Simple Flat Illustration", "Hand-Drawn Doodle"];
  var COLOR_PALETTE_OPTIONS = ["Bright & Playful", "Soft Pastels", "Primary Colors", "Warm Earth Tones"];
  var AGE_RANGE_OPTIONS = ["Toddler (ages 2-4)", "Early Elementary (ages 5-7)", "Elementary (ages 8-10)"];

  // Most of this book's pages (maze, word search) aren't "coloring
  // regions" at all, so this is worded to only ever constrain areas that
  // actually exist (the cover illustration, the dot-to-dot outline, the
  // matching groups) rather than claim every page needs one.
  var LOCKED_SUFFIX = " Clean, print-ready page layout, clear black outlines where applicable, high resolution, no watermarks. Any illustrated or outlined areas must use fully enclosed, closed lines with no open gaps.";

  ProductHaus.generatorEngine.registerGenerator({
    id: "activity-book",
    label: "Activity Book Generator",
    icon: "shuffle",
    description: "A themed kids' activity BOOK — a colorful cover plus a maze, word search, and connect-the-dots page, all sharing one theme.",
    fieldGroupTitle: "Customize Your Activity Book",

    fields: [
      { name: "bookTheme", label: "Book Theme", options: BOOK_THEME_OPTIONS, defaultValue: BOOK_THEME_OPTIONS[0] },
      { name: "mainSubjects", label: "Main Subjects", isFreeText: true, defaultValue: "farm animals like cows, pigs, and chickens", placeholder: "e.g. cows and pigs, rockets and planets" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Cover Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "ageRange", label: "Age Range", options: AGE_RANGE_OPTIONS, defaultValue: AGE_RANGE_OPTIONS[1] },
    ],

    pageTypesLabel: "Pages to Include (pick up to 5 — leave blank for the full book)",
    pageTypesCap: 5,
    defaultPageTypes: ["cover", "maze", "wordsearch", "dottodot", "matching"],
    bundleBlockTitle: "Your Activity Book",
    pageTypes: [
      {
        id: "cover",
        label: "Cover Page",
        promptTemplate:
          "Design an activity BOOK COVER for a \"{bookTheme}\" themed activity book featuring {mainSubjects} as the main illustration, for {ageRange}. {artStyle} style, a {colorPalette} color palette{holidayClause}.\n\nLayout: one bold, colorful centered illustration with generous open space at the top for a title." +
          LOCKED_SUFFIX,
      },
      {
        id: "maze",
        label: "Maze Page",
        promptTemplate:
          "Design a printable MAZE PUZZLE page themed around \"{bookTheme}\", where {mainSubjects} appear as small decorative illustrations at the start and end points of the maze, sized for {ageRange}. {artStyle} style accents{holidayClause}.\n\nLayout: a clean black-and-white maze filling most of the page, one clear path from start to finish, simple enough to solve at the target age range." +
          LOCKED_SUFFIX,
      },
      {
        id: "wordsearch",
        label: "Word Search Page",
        promptTemplate:
          "Design a printable WORD SEARCH page themed around \"{bookTheme}\", with a letter grid and a themed decorative border featuring {mainSubjects}, sized for {ageRange}. {artStyle} style accents{holidayClause}.\n\nLayout: a clean black-and-white letter grid centered on the page with a simple word list beneath it and decorative theme illustrations only around the border, never overlapping the grid." +
          LOCKED_SUFFIX,
      },
      {
        id: "dottodot",
        label: "Connect-the-Dots Page",
        promptTemplate:
          "Design a printable CONNECT-THE-DOTS page themed around \"{bookTheme}\", where the numbered dots trace the outline of {mainSubjects}, sized for {ageRange}. {artStyle} style accents{holidayClause}.\n\nLayout: a clean black-and-white numbered dot-to-dot outline centered on the page, dots large and clearly numbered in sequence." +
          LOCKED_SUFFIX,
      },
      {
        id: "matching",
        label: "Matching / Count & Match Page",
        promptTemplate:
          "Design a printable MATCHING / COUNT-AND-MATCH activity page themed around \"{bookTheme}\", featuring small illustrated groups of {mainSubjects} to count or match, sized for {ageRange}. {artStyle} style, a {colorPalette} color palette{holidayClause}.\n\nLayout: simple, clearly separated rows or groups of small illustrations, easy to visually count or pair at the target age range." +
          LOCKED_SUFFIX,
      },
    ],
  });
})();
