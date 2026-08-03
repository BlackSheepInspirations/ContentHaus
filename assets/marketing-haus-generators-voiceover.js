/**
 * Marketing Haus — Voiceover Script (cloned from Growth Haus's "Voiceover Script"
 * bonus module). A natural, record-ready VO script. Declarative Quick Generator.
 */
(function () {
  "use strict";
  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var LENGTH = ["15 seconds", "30 seconds", "45 seconds", "60 seconds"];
  var TONE = ["Warm", "Energetic", "Confident", "Calm", "Playful", "Authoritative"];
  var USE = ["Ad", "Explainer", "Reel / TikTok", "Product demo", "Brand story"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "voiceover-script",
    label: "Voiceover Script",
    icon: "text",
    description: "A natural, record-ready voiceover script — timed and paced for an AI voice or your own, with light pause cues.",
    fieldGroupTitle: "Write Your Voiceover",
    fields: [
      { name: "subject", label: "What's it for?", isFreeText: true, defaultValue: "my product", placeholder: "e.g. a 30-second ad for our candle launch" },
      { name: "length", label: "Length", options: LENGTH, defaultValue: LENGTH[1] },
      { name: "tone", label: "Tone", options: TONE, defaultValue: TONE[0] },
      { name: "useCase", label: "Use", options: USE, defaultValue: USE[0] },
    ],
    basePromptTemplate:
      "Write a natural, record-ready voiceover script for {subject}{holidayClause}, about {length}, in a {tone} tone, for a {useCase}. " +
      "Write for the ear — short sentences that are easy to say aloud, with light pacing and pause cues in [brackets]. Keep it within the time budget and end on a clear line.",
    charmPromptTemplate:
      "Write a warm, natural voiceover script for {subject}{holidayClause}, about {length}, in a {tone} tone, for a {useCase}. " +
      "Open with a line that draws the listener in, keep sentences short and speakable with [pause] cues, and land a memorable closing line within the time budget.",
    dynamicPromptTemplate:
      "Write a punchy, high-energy voiceover script for {subject}{holidayClause}, about {length}, in a {tone} tone, for a {useCase}. " +
      "Hook in the first line, keep the momentum with short speakable sentences and [pause] cues, and close on a strong call to action within the time budget.",
    charmPool: [
      "a conversational aside that builds warmth",
      "a single vivid detail the listener can picture",
      "a soft, inviting closing line",
    ],
    dynamicPool: [
      "a bolder opening line",
      "a rhythm shift that lands the key benefit",
      "a direct closing call to action",
    ],
  });
})();
