/**
 * The AI Creator's Marketing Haus — Creative Direction Brief Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, marketing-haus-brandkit.js, and
 * marketing-haus-generators.js (all must load first — this file just
 * registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (creative-direction) — a written brief (mood, color, type, visual
 * direction) for keeping a whole batch of assets visually consistent,
 * not an image prompt itself. Pulls the active Brand Kit's colors/mood
 * in as a starting point, same pattern Video Motion Prompt Generator
 * already uses for its own brand-consistency clause.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var CAMPAIGN_TYPE_OPTIONS = ["Product Launch", "Brand Campaign", "Seasonal Campaign", "Content Series", "Evergreen Promotion"];
  var BRIEF_DETAIL_OPTIONS = ["Concise", "Standard", "Comprehensive"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "creative-direction",
    label: "Creative Direction Brief Generator",
    icon: "layers",
    description: "A written creative brief — mood, color, type, and visual direction — for keeping a whole batch of assets looking like one cohesive campaign.",
    fieldGroupTitle: "Customize Your Brief",

    fields: [
      { name: "projectFocus", label: "What This Brief Is For", isFreeText: true, defaultValue: "the campaign or project this direction covers", placeholder: "e.g. our fall candle collection launch" },
      { name: "campaignType", label: "Creative Project", options: CAMPAIGN_TYPE_OPTIONS, defaultValue: CAMPAIGN_TYPE_OPTIONS[0] },
      { name: "briefDetail", label: "Brief Detail", options: BRIEF_DETAIL_OPTIONS, defaultValue: BRIEF_DETAIL_OPTIONS[1] },
      { name: "deliverableFocus", label: "Deliverable Focus", isFreeText: true, defaultValue: "create one cohesive direction across all assets", placeholder: "e.g. needs to work across social posts, packaging, and a hero banner" },
    ],

    computeExtraTokens: function () {
      var kit = MarketingHaus.brandKit && MarketingHaus.brandKit.getActiveKit();
      if (!kit) {
        return { brandContextClause: "" };
      }
      var colors = (kit.fields.colors || []).filter(Boolean).join(", ");
      var mood = MarketingHaus.engine.resolveFieldValue(kit.fields.mood);
      var pieces = [];
      if (colors) pieces.push("the brand's existing color palette (" + colors + ")");
      if (mood) pieces.push("its " + mood + " mood");
      return {
        brandContextClause: pieces.length ? " Build on " + pieces.join(" and ") + " rather than starting from a blank slate." : "",
      };
    },

    basePromptTemplate:
      "Write a {briefDetail} creative direction brief for a {campaignType}: {projectFocus}{holidayClause}.{brandContextClause}\n\n" +
      "{deliverableFocus}\n\n" +
      "Cover: overall mood/tone, a color direction, a typography direction (headline + body pairing style), and a visual/photography or illustration direction — specific enough that a different designer could pick it up and stay on-brand.",

    charmPromptTemplate:
      "Write an inspiring, {briefDetail} creative direction brief for a {campaignType}: {projectFocus}{holidayClause}.{brandContextClause}\n\n" +
      "{deliverableFocus}\n\n" +
      "Cover mood/tone, color, typography, and visual direction — and open with one short line capturing the feeling the campaign should give someone at first glance.",

    dynamicPromptTemplate:
      "Write a bold, {briefDetail} creative direction brief for a {campaignType}: {projectFocus}{holidayClause}.{brandContextClause}\n\n" +
      "{deliverableFocus}\n\n" +
      "Cover mood/tone, color, typography, and visual direction — and call out the one element that should feel the most distinctive/ownable across every asset.",

    charmPool: [
      "a short 'do' and 'don't' pair to guard the direction",
      "a one-line description of the ideal reference/inspiration image",
      "a note on how this direction should flex across different formats",
    ],
    dynamicPool: [
      "a specific texture or material reference to anchor the visual direction",
      "a contrast note — what this should NOT look like",
      "a suggested hero visual concept for the lead asset",
    ],
  });
})();
