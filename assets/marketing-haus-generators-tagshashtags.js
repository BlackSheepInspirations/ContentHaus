/**
 * The AI Creator's Marketing Haus — Tags & Hashtags Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (tags-hashtags). Pure written copy, no aesthetic fields.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var TAG_TYPE_OPTIONS = ["Marketplace Tags", "Social Hashtags", "Search Keyword Phrases", "Mixed Discovery Terms"];
  var TAG_COUNT_OPTIONS = ["10", "13", "20", "30"];
  var SPECIFICITY_OPTIONS = ["Broad", "Balanced", "Long-tail"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "tags-hashtags",
    label: "Tags & Hashtags Generator",
    icon: "layers",
    description: "A ready list of marketplace tags or social hashtags in natural buyer-search language — not generic filler terms.",
    fieldGroupTitle: "Customize Your Tags",

    fields: [
      { name: "topic", label: "What This Is For", isFreeText: true, defaultValue: "the product or post this needs tags for", placeholder: "e.g. our hand-poured soy candles" },
      { name: "tagType", label: "Tag Type", options: TAG_TYPE_OPTIONS, defaultValue: TAG_TYPE_OPTIONS[3] },
      { name: "tagCount", label: "Number of Tags", options: TAG_COUNT_OPTIONS, defaultValue: TAG_COUNT_OPTIONS[1] },
      { name: "specificity", label: "Keyword Specificity", options: SPECIFICITY_OPTIONS, defaultValue: SPECIFICITY_OPTIONS[1] },
    ],

    basePromptTemplate:
      "Generate {tagCount} {specificity} {tagType} for {topic}{holidayClause}. " +
      "Use natural buyer-search language a real shopper would actually type or search, not generic filler terms. " +
      "List them as a single comma-separated line, ready to copy and paste.",

    charmPromptTemplate:
      "Generate {tagCount} {specificity} {tagType} for {topic}{holidayClause}, mixing a few broader discovery terms in with the specific ones so the set covers multiple search angles. " +
      "List them as a single comma-separated line, ready to copy and paste.",

    dynamicPromptTemplate:
      "Generate {tagCount} sharp, {specificity} {tagType} for {topic}{holidayClause}, favoring terms with real buyer intent over vague descriptive words. " +
      "List them as a single comma-separated line, ready to copy and paste.",

    charmPool: [
      "a couple of seasonal or trending terms if genuinely relevant",
      "one or two terms aimed at a related, adjacent audience",
      "a mix of single-word and short-phrase tags",
    ],
    dynamicPool: [
      "terms weighted toward high buyer-intent phrases",
      "a couple of terms that address a specific use-case or occasion",
      "terms that differentiate from the most obvious/competitive tags",
    ],
  });
})();
