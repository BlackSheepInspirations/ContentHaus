/**
 * Marketing Haus — Custom GPT Builder (cloned from Growth Haus's "Custom GPT Builder"
 * bonus module). Outputs a ready-to-paste config for a custom GPT / AI assistant.
 * Declarative Quick Generator; registers with the engine.
 *
 * Depth pass (2026-08-07): added a **knowledge/context** field so the
 * generated System Instructions actually ground the assistant in the
 * creator's real products, policies, and facts instead of a generic role.
 */
(function () {
  "use strict";
  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var PERSONALITY = ["Friendly", "Expert", "Playful", "No-nonsense", "Encouraging", "Witty"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "custom-gpt-builder",
    textOnly: true,
    label: "Custom GPT Builder",
    icon: "sparkle",
    description: "A ready-to-paste configuration for a custom GPT or AI assistant — name, description, system instructions grounded in your real business, and conversation starters.",
    fieldGroupTitle: "Design Your Assistant",
    fields: [
      { name: "purpose", label: "What should it help with?", isFreeText: true, defaultValue: "help my customers pick the right product", placeholder: "e.g. help shoppers choose the right candle scent" },
      { name: "forWho", label: "Who's it for?", isFreeText: true, defaultValue: "my customers", placeholder: "e.g. first-time candle buyers" },
      { name: "personality", label: "Personality", options: PERSONALITY, defaultValue: PERSONALITY[0] },
      { name: "knowledge", label: "What should it know? (your products, policies, facts) (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. our 12 scents, 50-hr burn time, 30-day returns, ships in 2 days" },
      { name: "scope", label: "Anything it should or shouldn't do? (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. never give medical advice; always suggest a product" },
    ],
    computeExtraTokens: function (v) {
      return {
        knowledgeClause: v.knowledge ? " Ground its answers in this specific knowledge, and tell it to rely on these facts rather than making things up: " + v.knowledge + "." : "",
        scopeClause: v.scope ? " Guardrails: " + v.scope + "." : "",
      };
    },
    basePromptTemplate:
      "Write a complete custom-GPT configuration for an assistant that will {purpose}{holidayClause}, for {forWho}, with a {personality} personality. " +
      "Return, clearly labeled: a Name, a one-line Description, full System Instructions (its role, how it should respond, what it knows{knowledgeClause}, and its limits{scopeClause}), and 4 Conversation Starters.",
    charmPromptTemplate:
      "Write an engaging custom-GPT configuration for an assistant that will {purpose}{holidayClause}, for {forWho}, with a {personality} personality. " +
      "Give it a memorable Name, a warm one-line Description, thorough System Instructions (role, response style, what it knows{knowledgeClause}, limits{scopeClause}), and 4 inviting Conversation Starters.",
    dynamicPromptTemplate:
      "Write a sharp, results-focused custom-GPT configuration for an assistant that will {purpose}{holidayClause}, for {forWho}, with a {personality} personality. " +
      "Give it a strong Name, a punchy Description, precise System Instructions (role, response rules, what it knows{knowledgeClause}, limits{scopeClause}), and 4 high-intent Conversation Starters.",
    charmPool: [
      "a signature greeting line for the assistant",
      "one example of an ideal answer",
      "a friendly way to handle an off-topic question",
    ],
    dynamicPool: [
      "a rule that always moves the user toward a next step",
      "a concise format the assistant should answer in",
      "a fallback that captures a lead when it can't help",
    ],
  });
})();
