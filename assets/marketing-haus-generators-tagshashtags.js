/**
 * The AI Creator's Marketing Haus — Tags & Hashtags Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (tags-hashtags). Pure written copy, no aesthetic fields.
 *
 * Depth pass (2026-08-07): tag/hashtag best practice is almost entirely
 * platform-dictated (Etsy multi-word tags ≠ Instagram # ladders ≠ Pinterest
 * search keywords ≠ Amazon backend terms), so the generic "Tag Type" was
 * replaced by a real **Platform** field that carries each platform's true
 * conventions (format, character rules, optimal count, # vs no-#) via
 * computeExtraTokens, plus a platform-aware format line.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var PLATFORM_OPTIONS = ["Etsy", "Instagram", "TikTok", "Pinterest", "YouTube", "Amazon", "General Marketplace"];
  var TAG_COUNT_OPTIONS = ["Recommended for the platform", "10", "13", "20", "30"];
  var SPECIFICITY_OPTIONS = ["Broad", "Balanced", "Long-tail"];

  // Each platform's real discovery conventions — the actual quality lever here.
  var PLATFORM_RULES = {
    "Etsy": {
      noun: "Etsy tags",
      hashtag: false,
      recommendedCount: "13",
      rule: "Etsy allows up to 13 tags, each a multi-word buyer-search phrase of 20 characters or fewer — the exact phrases shoppers type into Etsy search (e.g. \"personalized dog mom mug\"), never single generic words.",
    },
    "Instagram": {
      noun: "Instagram hashtags",
      hashtag: true,
      recommendedCount: "20",
      rule: "Instagram hashtags, each starting with # and no spaces, built as a ladder: a few large-reach tags, several mid-size niche tags, and a couple of small, highly-specific tags so the post can rank in the smaller pools first.",
    },
    "TikTok": {
      noun: "TikTok hashtags",
      hashtag: true,
      recommendedCount: "10",
      rule: "TikTok hashtags, each starting with #, kept to a tight focused set that pairs one or two broad or genuinely-trending tags with specific niche ones — TikTok favors relevance over volume.",
    },
    "Pinterest": {
      noun: "Pinterest keywords",
      hashtag: false,
      recommendedCount: "20",
      rule: "Pinterest search keywords (NOT hashtags) — natural search phrases that match how people actually search Pinterest, with the most important words front-loaded.",
    },
    "YouTube": {
      noun: "YouTube tags",
      hashtag: false,
      recommendedCount: "20",
      rule: "YouTube video tags (no hashtags) — mix the exact video topic, close keyword variations, and a few broader category terms; lead with the most important, most specific tag.",
    },
    "Amazon": {
      noun: "Amazon backend search terms",
      hashtag: false,
      recommendedCount: "30",
      rule: "Amazon backend search terms — lowercase, no repeated words, no commas needed between concepts, no competitor brand names; pure discovery keywords a shopper might search, including spelling/word-order variants.",
    },
    "General Marketplace": {
      noun: "marketplace tags",
      hashtag: false,
      recommendedCount: "20",
      rule: "plain marketplace tags in natural buyer-search language a real shopper would type, not generic filler words.",
    },
  };

  MarketingHaus.generatorEngine.registerGenerator({
    id: "tags-hashtags",
    textOnly: true,
    label: "Tags & Hashtags Generator",
    icon: "layers",
    description: "A ready-to-paste set of tags or hashtags built to each platform's real rules — Etsy tags, Instagram/TikTok hashtag ladders, Pinterest keywords, YouTube tags, or Amazon backend terms.",
    fieldGroupTitle: "Customize Your Tags",

    fields: [
      { name: "topic", label: "What This Is For", isFreeText: true, defaultValue: "the product or post this needs tags for", placeholder: "e.g. our hand-poured soy candles" },
      { name: "platform", label: "Platform", options: PLATFORM_OPTIONS, defaultValue: PLATFORM_OPTIONS[0] },
      { name: "tagCount", label: "Number of Tags", options: TAG_COUNT_OPTIONS, defaultValue: TAG_COUNT_OPTIONS[0] },
      { name: "specificity", label: "Keyword Specificity", options: SPECIFICITY_OPTIONS, defaultValue: SPECIFICITY_OPTIONS[1] },
    ],

    computeExtraTokens: function (v) {
      var rules = PLATFORM_RULES[v.platform] || PLATFORM_RULES["General Marketplace"];
      var count = (!v.tagCount || v.tagCount === TAG_COUNT_OPTIONS[0]) ? rules.recommendedCount : v.tagCount;
      var formatLine = rules.hashtag
        ? "List them as a single line, each hashtag starting with # and separated by a space, ready to copy and paste."
        : "List them as a single comma-separated line, ready to copy and paste.";
      return {
        tagNoun: rules.noun,
        tagCount: count,
        platformRule: rules.rule,
        formatLine: formatLine,
      };
    },

    basePromptTemplate:
      "Generate {tagCount} {specificity} {tagNoun} for {topic}{holidayClause}. " +
      "{platformRule} " +
      "Use natural buyer-search language a real person would actually type, not generic filler terms. " +
      "{formatLine}",

    charmPromptTemplate:
      "Generate {tagCount} {specificity} {tagNoun} for {topic}{holidayClause}, mixing a few broader discovery terms in with the specific ones so the set covers multiple search angles. " +
      "{platformRule} " +
      "{formatLine}",

    dynamicPromptTemplate:
      "Generate {tagCount} sharp, {specificity} {tagNoun} for {topic}{holidayClause}, favoring terms with real buyer intent over vague descriptive words. " +
      "{platformRule} " +
      "{formatLine}",

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
