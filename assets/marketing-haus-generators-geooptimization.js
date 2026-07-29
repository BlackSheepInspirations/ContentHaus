/**
 * The AI Creator's Marketing Haus — GEO / AI Search Optimization Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (geo-optimization) — genuinely new territory for Marketing Haus:
 * optimizing content so AI answer engines (ChatGPT, Perplexity, Google
 * AI Overviews, Gemini) recommend and cite it, not classic keyword SEO.
 * Output Format is a dropdown-only structural choice, same
 * *_INSTRUCTIONS lookup pattern the Infographic Generator established.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var AI_ENGINE_OPTIONS = ["ChatGPT / GPT Search", "Perplexity", "Google AI Overviews", "Gemini", "All AI Answer Engines"];
  var CONTENT_OPTIONS = ["Product Page", "Marketplace Listing", "FAQ / Q&A Block", "Comparison / Best-Of Content", "About / Brand Page"];
  var OUTPUT_FORMAT_OPTIONS = ["Answer-Ready Copy", "FAQ Q&A Pairs", "Citation-Friendly Fact Sheet", "Structured-Data Notes"];

  var OUTPUT_FORMAT_INSTRUCTIONS = {
    "Answer-Ready Copy": "Write it as a direct, self-contained answer an AI could quote verbatim in response to a buyer's question.",
    "FAQ Q&A Pairs": "Structure it as clear Question: / Answer: pairs, each answer short, direct, and complete on its own.",
    "Citation-Friendly Fact Sheet": "Structure it as short, specific, factual statements (not marketing fluff) that an AI can cite confidently and attribute correctly.",
    "Structured-Data Notes": "Write it as a plain list of the key facts/attributes an AI would need to describe this accurately, one fact per line.",
  };

  MarketingHaus.generatorEngine.registerGenerator({
    id: "geo-optimization",
    label: "GEO / AI Search Optimization Generator",
    icon: "monitor",
    description: "Optimize your content so AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) recommend and cite it — not classic keyword SEO.",
    fieldGroupTitle: "Customize Your GEO Copy",

    fields: [
      { name: "topic", label: "What This Is For", isFreeText: true, defaultValue: "the product or page this is optimizing", placeholder: "e.g. our hand-poured soy candles product page" },
      { name: "aiEngine", label: "AI Answer Engine", options: AI_ENGINE_OPTIONS, defaultValue: AI_ENGINE_OPTIONS[4] },
      { name: "contentToOptimize", label: "Content to Optimize", options: CONTENT_OPTIONS, defaultValue: CONTENT_OPTIONS[0] },
      { name: "outputFormat", label: "Output Format", options: OUTPUT_FORMAT_OPTIONS, defaultValue: OUTPUT_FORMAT_OPTIONS[0] },
      { name: "buyerQuestions", label: "Buyer Questions to Win", isFreeText: true, defaultValue: "the questions buyers ask an AI before choosing", placeholder: "e.g. are soy candles safe for pets, how long do they burn" },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        formatInstruction: OUTPUT_FORMAT_INSTRUCTIONS[valueMap.outputFormat] || OUTPUT_FORMAT_INSTRUCTIONS["Answer-Ready Copy"],
      };
    },

    basePromptTemplate:
      "Write {outputFormat} for a {contentToOptimize} about {topic}, optimized so {aiEngine} would recommend and cite it — not classic keyword-density SEO{holidayClause}.\n\n" +
      "Directly answer these buyer questions somewhere in the copy: {buyerQuestions}.\n\n" +
      "Format: {formatInstruction} Use plain, specific, factual language an AI can quote confidently — no vague marketing adjectives with nothing behind them.",

    charmPromptTemplate:
      "Write clear, trustworthy {outputFormat} for a {contentToOptimize} about {topic}, built to earn a recommendation and citation from {aiEngine}{holidayClause}.\n\n" +
      "Directly answer these buyer questions: {buyerQuestions}.\n\n" +
      "Format: {formatInstruction} Add one small specific detail that makes the answer feel authoritative, not generic.",

    dynamicPromptTemplate:
      "Write sharp, comprehensive {outputFormat} for a {contentToOptimize} about {topic}, engineered to be the source {aiEngine} pulls from and cites{holidayClause}.\n\n" +
      "Directly answer these buyer questions: {buyerQuestions}.\n\n" +
      "Format: {formatInstruction} Cover the obvious follow-up question a buyer would ask next, too.",

    charmPool: [
      "a short comparison point against the obvious alternative",
      "one specific number or detail that's easy to cite exactly",
      "a plain-language definition of any term a first-time buyer might not know",
    ],
    dynamicPool: [
      "an anticipated follow-up question, answered pre-emptively",
      "a short 'in short' summary line an AI could lift as a one-line answer",
      "explicit disambiguation from a commonly confused alternative product",
    ],
  });
})();
