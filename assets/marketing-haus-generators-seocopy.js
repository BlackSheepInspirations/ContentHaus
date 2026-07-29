/**
 * The AI Creator's Marketing Haus — SEO Copy Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog (seo-copy).
 * Pure written copy, no aesthetic fields — nothing here is an image.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var SEO_ASSET_OPTIONS = ["Product Page", "Blog Post", "Marketplace Listing", "Landing Page"];
  var SEARCH_INTENT_OPTIONS = ["Commercial", "Transactional", "Informational"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "seo-copy",
    label: "SEO Copy Generator",
    icon: "monitor",
    description: "Search-optimized copy for a product page, blog post, listing, or landing page — written for the human reader first.",
    fieldGroupTitle: "Customize Your SEO Copy",

    fields: [
      { name: "topic", label: "What This Is For", isFreeText: true, defaultValue: "the product or page this copy is for", placeholder: "e.g. our hand-poured soy candles product page" },
      { name: "seoAsset", label: "SEO Asset", options: SEO_ASSET_OPTIONS, defaultValue: SEO_ASSET_OPTIONS[0] },
      { name: "searchIntent", label: "Search Intent", options: SEARCH_INTENT_OPTIONS, defaultValue: SEARCH_INTENT_OPTIONS[0] },
      { name: "targetKeywords", label: "Target Keywords (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. soy candles, handmade candles, non-toxic candles" },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        seoAssetArticle: /^[aeiou]/i.test(valueMap.seoAsset) ? "an" : "a",
        keywordsClause: valueMap.targetKeywords ? ", weaving in the keywords: " + valueMap.targetKeywords : "",
      };
    },

    basePromptTemplate:
      "Write search-optimized copy for {seoAssetArticle} {seoAsset} about {topic}, targeting a {searchIntent} search intent{keywordsClause}{holidayClause}. " +
      "Write for the human reader first and search visibility second — natural language, no keyword-stuffing. " +
      "Include a clear headline, well-structured body copy, and one obvious next action.",

    charmPromptTemplate:
      "Write engaging, search-optimized copy for {seoAssetArticle} {seoAsset} about {topic}, with a {searchIntent} search intent{keywordsClause}{holidayClause}. " +
      "Open with a hook that earns the click, then deliver on it. Natural keyword use throughout — never stuffed.",

    dynamicPromptTemplate:
      "Write bold, conversion-minded, search-optimized copy for {seoAssetArticle} {seoAsset} about {topic}, with a {searchIntent} search intent{keywordsClause}{holidayClause}. " +
      "Lead with the strongest benefit, back it with specifics, and close with urgency. Natural keyword use throughout — never stuffed.",

    charmPool: [
      "a short, curiosity-driven subheading",
      "one relevant statistic or specific detail to build credibility",
      "a brief social-proof line",
    ],
    dynamicPool: [
      "a bolder, benefit-first opening line",
      "a comparison against the alternative (or doing nothing)",
      "a stronger, more direct closing call to action",
    ],
  });
})();
