/**
 * The AI Creator's Marketing Haus — Short-Form Video Script Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * The one generator in this Haus's Quick Generators tab that is NOT an
 * image-generation prompt — it's a structured script (Hook/Body/On-
 * Screen Text/CTA), a genuinely different shape from the other 7
 * generators here, deferred out of the original 6-generator batch for
 * exactly that reason. The underlying engine is content-agnostic (just
 * token substitution into a template), so no engine changes were
 * needed — only a script-shaped template instead of an image-prompt-
 * shaped one, and no aesthetic/Look Lock fields (a script has no art
 * style or palette to lock, same reasoning already applied to the
 * Video Motion Prompt Generator's pose fields).
 *
 * Hook Style and CTA reuse Social Media Studio's own existing
 * vocabulary (question hook, bold statement, shop now, link in bio,
 * etc.) rather than inventing a second, slightly-different list.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var sortAlpha = MarketingHaus.util.sortAlpha;

  var PLATFORM_OPTIONS = ["TikTok", "Instagram Reels", "YouTube Shorts"];
  var VIDEO_LENGTH_OPTIONS = ["15 seconds", "30 seconds", "60 seconds", "90 seconds"];
  var SCRIPT_STRUCTURE_OPTIONS = ["Talking-Head Educational", "Product Demo", "Before / After", "Storytime", "Quick-Tip Listicle"];
  var HOOK_STYLE_OPTIONS = sortAlpha([
    "question hook", "bold statement", "relatable pain point", "curiosity gap",
    "before / after", "\"you need this\"", "myth-busting", "quick tip / how-to",
  ]);
  // "no explicit CTA" rather than a literal "none" — resolveFieldValue
  // treats the exact string "none" as an empty-value sentinel, which
  // would silently collapse to this field's defaultValue instead
  // (getFieldValueMap's resolved-value fallback), masking a deliberate
  // "skip the CTA" choice as whatever the default option happened to
  // be. Spelling it out avoids relying on that sentinel entirely.
  var CTA_OPTIONS = sortAlpha([
    "shop now", "link in bio", "save this post", "comment below", "tag a friend",
    "DM us", "swipe up", "follow for more", "share with someone who needs this", "no explicit CTA",
  ]);

  var SCRIPT_STRUCTURE_INSTRUCTIONS = {
    "Talking-Head Educational": "Deliver the main point directly to camera, breaking it into 2-3 quick, clear teaching beats.",
    "Product Demo": "Show the product in use step-by-step, narrating what it does and why it matters as you go.",
    "Before / After": "Open on the \"before\" problem or state, then transition into the \"after\" result or transformation.",
    "Storytime": "Tell it like a short personal story with a clear beginning, middle, and payoff.",
    "Quick-Tip Listicle": "Number and quickly run through each tip in rapid succession, one per beat.",
  };

  MarketingHaus.generatorEngine.registerGenerator({
    id: "short-form-video-script",
    textOnly: true,
    label: "Short-Form Video Script Generator",
    icon: "text",
    description: "A structured Hook / Body / On-Screen Text / CTA script for TikTok, Reels, or Shorts — a written script, not an image-generation prompt.",
    fieldGroupTitle: "Customize Your Script",

    fields: [
      { name: "videoTopic", label: "Video Topic", isFreeText: true, defaultValue: "our new fall candle collection just dropped", placeholder: "e.g. our new fall candle collection just dropped" },
      { name: "platform", label: "Platform", options: PLATFORM_OPTIONS, defaultValue: PLATFORM_OPTIONS[0] },
      { name: "videoLength", label: "Video Length", options: VIDEO_LENGTH_OPTIONS, defaultValue: VIDEO_LENGTH_OPTIONS[1] },
      { name: "scriptStructure", label: "Script Structure", options: SCRIPT_STRUCTURE_OPTIONS, defaultValue: SCRIPT_STRUCTURE_OPTIONS[0] },
      { name: "hookStyle", label: "Hook Style", options: HOOK_STYLE_OPTIONS, defaultValue: HOOK_STYLE_OPTIONS[0] },
      { name: "cta", label: "Call to Action", options: CTA_OPTIONS, defaultValue: CTA_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        structureInstruction: SCRIPT_STRUCTURE_INSTRUCTIONS[valueMap.scriptStructure] || SCRIPT_STRUCTURE_INSTRUCTIONS["Talking-Head Educational"],
        ctaClause: valueMap.cta === "no explicit CTA"
          ? "Close on a natural, low-pressure note with no explicit call to action."
          : "End by prompting viewers to " + valueMap.cta + ".",
      };
    },

    basePromptTemplate:
      "SHORT-FORM VIDEO SCRIPT — {platform}, {videoLength}\n\n" +
      "HOOK (first 3 seconds): Open with a hook (style: {hookStyle}) introducing {videoTopic}.\n\n" +
      "BODY: {structureInstruction}\n\n" +
      "ON-SCREEN TEXT: Reinforce the hook and key point in short text overlays throughout.\n\n" +
      "CTA (final beat): {ctaClause}",

    charmPool: [
      "a relatable joke or aside",
      "a warm, conversational tone throughout",
      "a callback to the hook in the final line",
    ],
    dynamicPool: [
      "a faster-paced, punchier delivery",
      "a bold on-screen text moment for emphasis",
      "a quick pattern-interrupt midway through",
    ],
  });
})();
