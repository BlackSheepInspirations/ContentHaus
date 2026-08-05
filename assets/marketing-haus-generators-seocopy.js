/**
 * The AI Creator's Marketing Haus — Search Visibility Copy Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Consolidates the old SEO Copy + GEO/AI Search generators behind one
 * "Optimize for" toggle: Traditional search (Google/keyword SEO) vs AI
 * answer engines (ChatGPT/Perplexity/Google AI Overviews/Gemini). They
 * shared the same input shape (a topic + a page type + terms to target),
 * so one generator with a mode switch replaces two.
 *
 * Deliberate simplification (flagged, not silent): the old per-mode
 * granularity — SEO's Commercial/Transactional/Informational intent and
 * GEO's specific target engine — is folded away to keep this to a few
 * fields, matching this Haus's beginner-first ethos. The single "Keywords
 * or buyer questions" field serves both modes (keywords for SEO, questions
 * for GEO), and Output Style carries the GEO structural choice. Any of the
 * dropped granularity can be added back as a field if wanted.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var MODE_OPTIONS = ["Traditional search (Google / SEO)", "AI answer engines (GEO)"];
  var AI_MODE = "AI answer engines (GEO)";
  var CONTENT_OPTIONS = ["Product Page", "Blog Post", "Marketplace Listing", "Landing Page", "FAQ / Q&A Block", "Comparison / Best-Of", "About / Brand Page"];
  var OUTPUT_STYLE_OPTIONS = ["Standard copy", "Answer-ready copy", "FAQ Q&A pairs", "Citation-friendly fact sheet"];

  var OUTPUT_STYLE_INSTRUCTIONS = {
    "Answer-ready copy": "Write it as a direct, self-contained answer an AI could quote verbatim in response to a buyer's question.",
    "FAQ Q&A pairs": "Structure it as clear Question: / Answer: pairs, each answer short, direct, and complete on its own.",
    "Citation-friendly fact sheet": "Structure it as short, specific, factual statements (not marketing fluff) an AI can cite confidently and attribute correctly.",
  };

  MarketingHaus.generatorEngine.registerGenerator({
    id: "search-visibility-copy",
    label: "Search Visibility Copy Generator",
    icon: "monitor",
    description: "Copy that gets found — for classic Google/keyword SEO, or for AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) that recommend and cite sources. Flip the Optimize-for toggle.",
    fieldGroupTitle: "Customize Your Copy",

    fields: [
      { name: "mode", label: "Optimize For", options: MODE_OPTIONS, defaultValue: MODE_OPTIONS[0] },
      { name: "topic", label: "What This Is For", isFreeText: true, defaultValue: "the product or page this copy is for", placeholder: "e.g. our hand-poured soy candles product page" },
      { name: "contentType", label: "Page / Content Type", options: CONTENT_OPTIONS, defaultValue: CONTENT_OPTIONS[0] },
      { name: "targetTerms", label: "Keywords or Buyer Questions (optional)", isFreeText: true, defaultValue: "", placeholder: "SEO: soy candles, non-toxic candles · GEO: are soy candles pet-safe, how long do they burn" },
      { name: "outputStyle", label: "Output Style", options: OUTPUT_STYLE_OPTIONS, defaultValue: OUTPUT_STYLE_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var isAI = valueMap.mode === AI_MODE;
      var article = /^[aeiou]/i.test(valueMap.contentType) ? "an" : "a";
      var styleInstruction = OUTPUT_STYLE_INSTRUCTIONS[valueMap.outputStyle] || "";
      var body;
      if (isAI) {
        var questions = valueMap.targetTerms || "the questions buyers ask an AI before choosing";
        body = "Write " + (valueMap.outputStyle === "Standard copy" ? "answer-ready copy" : valueMap.outputStyle.toLowerCase()) +
          " for " + article + " " + valueMap.contentType + " about " + valueMap.topic + ", optimized so AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) recommend and cite it — not classic keyword-density SEO" + valueMap.holidayClause + ".\n\n" +
          "Directly answer these buyer questions somewhere in the copy: " + questions + ".\n\n" +
          "Use plain, specific, factual language an AI can quote confidently — no vague marketing adjectives with nothing behind them." +
          (styleInstruction ? " " + styleInstruction : "");
      } else {
        var keywordsClause = valueMap.targetTerms ? ", weaving in the keywords: " + valueMap.targetTerms : "";
        body = "Write search-optimized copy for " + article + " " + valueMap.contentType + " about " + valueMap.topic + keywordsClause + valueMap.holidayClause + ". " +
          "Write for the human reader first and search visibility second — natural language, no keyword-stuffing. " +
          "Include a clear headline, well-structured body copy, and one obvious next action." +
          (styleInstruction ? " " + styleInstruction : "");
      }
      return { body: body };
    },

    basePromptTemplate: "{body}",

    charmPool: [
      "a short, curiosity-driven subheading",
      "one relevant statistic or specific detail to build credibility",
      "a brief social-proof or trust line",
    ],
    dynamicPool: [
      "a bolder, benefit-first opening line",
      "a comparison against the alternative (or doing nothing)",
      "a stronger, more direct closing call to action",
    ],
  });
})();
