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
  var OUTPUT_STYLE_OPTIONS = ["Standard copy", "Answer-ready copy", "FAQ Q&A pairs", "Citation-friendly fact sheet", "Structured-data / schema notes"];

  // GEO best practice genuinely differs by engine — each gets its own nudge.
  var AI_ENGINE_OPTIONS = ["All AI answer engines", "ChatGPT / GPT Search", "Perplexity", "Google AI Overviews", "Gemini"];
  var AI_ENGINE_INSTRUCTIONS = {
    "ChatGPT / GPT Search": "Lead with a clear, authoritative, self-contained answer ChatGPT can quote directly, then the supporting detail beneath it.",
    "Perplexity": "Make every claim specific and citable — favor verifiable facts, numbers, and named sources over adjectives, since Perplexity surfaces and links the sources it cites.",
    "Google AI Overviews": "Use clear headings and concise factual statements, and work in trust / E-E-A-T signals (who says it, credentials, specifics) that Google's AI Overviews reward.",
    "Gemini": "Write comprehensive, well-structured, factual copy that answers the question and its likely follow-ups, the way Gemini synthesizes multi-part answers.",
  };

  var OUTPUT_STYLE_INSTRUCTIONS = {
    "Answer-ready copy": "Write it as a direct, self-contained answer an AI could quote verbatim in response to a buyer's question.",
    "FAQ Q&A pairs": "Structure it as clear Question: / Answer: pairs, each answer short, direct, and complete on its own.",
    "Citation-friendly fact sheet": "Structure it as short, specific, factual statements (not marketing fluff) an AI can cite confidently and attribute correctly.",
    "Structured-data / schema notes": "Output a plain list of the key facts and attributes an AI (and schema/structured-data markup) needs to describe this accurately — one fact per line, no prose.",
  };

  MarketingHaus.generatorEngine.registerGenerator({
    id: "search-visibility-copy",
    textOnly: true,
    label: "Search Visibility Copy Generator",
    icon: "monitor",
    description: "Copy that gets found — for classic Google/keyword SEO, or for AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) that recommend and cite sources. Flip the Optimize-for toggle.",
    fieldGroupTitle: "Customize Your Copy",

    fields: [
      { name: "mode", label: "Optimize For", options: MODE_OPTIONS, defaultValue: MODE_OPTIONS[0] },
      { name: "aiEngine", label: "Target AI Engine (GEO mode)", options: AI_ENGINE_OPTIONS, defaultValue: AI_ENGINE_OPTIONS[0] },
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
        var engine = valueMap.aiEngine || AI_ENGINE_OPTIONS[0];
        var isAllEngines = engine === AI_ENGINE_OPTIONS[0];
        var engineTarget = isAllEngines
          ? "AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini)"
          : engine;
        var engineInstruction = AI_ENGINE_INSTRUCTIONS[engine] || "";
        body = "Write " + (valueMap.outputStyle === "Standard copy" ? "answer-ready copy" : valueMap.outputStyle.toLowerCase()) +
          " for " + article + " " + valueMap.contentType + " about " + valueMap.topic + ", optimized so " + engineTarget + " recommend" + (isAllEngines ? "" : "s") + " and cite" + (isAllEngines ? "" : "s") + " it — not classic keyword-density SEO" + valueMap.holidayClause + ".\n\n" +
          "Directly answer these buyer questions somewhere in the copy: " + questions + ".\n\n" +
          "Use plain, specific, factual language an AI can quote confidently — no vague marketing adjectives with nothing behind them." +
          (engineInstruction ? " " + engineInstruction : "") +
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
