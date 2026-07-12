/**
 * The AI Creator's Marketing Haus — Infographic Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Infographic Type is a dropdown-only field (no freeform) since it's a
 * structural choice, not a style preference — each type maps to its own
 * layout instruction via computeExtraTokens, same *_INSTRUCTIONS lookup
 * pattern Product Haus's Quote Wall Art Generator established for its
 * own Text Color Mode field.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var INFOGRAPHIC_TYPE_OPTIONS = ["Timeline", "Comparison", "Process / Step-by-Step", "Statistics / Data", "Checklist", "Educational Guide"];
  var ART_STYLE_OPTIONS = ["Clean & Corporate", "Playful & Illustrated", "Minimal Line Icons", "Bold & Colorful"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];

  var INFOGRAPHIC_TYPE_INSTRUCTIONS = {
    "Timeline": "Arrange the points in a clear chronological flow, left-to-right or top-to-bottom, connected with lines or arrows.",
    "Comparison": "Use a side-by-side column or table layout so the compared items are easy to scan against each other.",
    "Process / Step-by-Step": "Number each step clearly and connect them in a linear flow showing progression from start to finish.",
    "Statistics / Data": "Feature the numbers prominently with simple charts, icons, or large bold figures for each stat.",
    "Checklist": "Use a clean vertical list with checkbox or checkmark icons beside each item.",
    "Educational Guide": "Organize the content into clearly separated, labeled sections with supporting icons.",
  };

  var LOCKED_SUFFIX = " Clean, legible typography, well-organized visual hierarchy, print-and-web ready, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "infographic",
    label: "Infographic Generator",
    icon: "monitor",
    description: "An educational or data infographic — timeline, comparison, process, statistics, checklist, or guide.",
    fieldGroupTitle: "Customize Your Infographic",

    fields: [
      { name: "infographicType", label: "Infographic Type", options: INFOGRAPHIC_TYPE_OPTIONS, defaultValue: INFOGRAPHIC_TYPE_OPTIONS[0] },
      { name: "topic", label: "Topic", isFreeText: true, defaultValue: "5 benefits of meal prepping", placeholder: "e.g. 5 benefits of meal prepping, how our shipping process works" },
      { name: "keyPoints", label: "Key Points", isFreeText: true, defaultValue: "the 3-5 main points to cover", placeholder: "e.g. the 3-5 main points, steps, or stats to include" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        layoutInstruction: INFOGRAPHIC_TYPE_INSTRUCTIONS[valueMap.infographicType] || INFOGRAPHIC_TYPE_INSTRUCTIONS["Educational Guide"],
        infographicTypeArticle: /^[aeiou]/i.test(valueMap.infographicType) ? "An" : "A",
      };
    },

    basePromptTemplate:
      "{infographicTypeArticle} {infographicType} infographic about \"{topic}\", covering {keyPoints}. {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: {layoutInstruction}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create an engaging {infographicType} infographic about \"{topic}\", covering {keyPoints}, in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: {layoutInstruction} Include a small decorative accent to add visual interest." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an eye-catching {infographicType} infographic about \"{topic}\", covering {keyPoints}, in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "Layout: {layoutInstruction} Use bolder visual contrast between sections." +
      LOCKED_SUFFIX,

    charmPool: [
      "small supporting icons next to each point",
      "a subtle background texture behind the content",
      "a decorative header banner",
    ],
    dynamicPool: [
      "bolder section-dividing color blocks",
      "larger, more dramatic numerals or stat callouts",
      "a more dynamic diagonal section layout",
    ],
  });
})();
