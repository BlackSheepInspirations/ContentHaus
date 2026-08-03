/**
 * Marketing Haus — Video Ad Kit generator (cloned + renamed from Growth Haus's
 * "Full Ad Package"). A turnkey short-form video ad: concept + scene storyboard +
 * music bed + caption. Declarative Quick Generator; registers with the engine.
 */
(function () {
  "use strict";
  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var PLATFORM = ["TikTok", "Instagram Reels", "YouTube Shorts", "Facebook / Meta"];
  var LENGTH = ["15 seconds", "30 seconds", "45 seconds", "60 seconds"];
  var ANGLE = ["Problem → Solution", "Transformation", "Social Proof", "Founder Story", "Demo / How-it-works", "Bold Claim"];
  var GOAL = ["Awareness", "Clicks / Traffic", "Sales", "Followers"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "video-ad-kit",
    label: "Video Ad Kit",
    icon: "video",
    description: "A turnkey short-form video ad — concept, scene-by-scene storyboard with voiceover and shots, a music bed, and caption + hashtags.",
    fieldGroupTitle: "Build Your Video Ad",
    fields: [
      { name: "subject", label: "What's the ad for?", isFreeText: true, defaultValue: "my product", placeholder: "e.g. our hand-poured soy candle 3-pack" },
      { name: "platform", label: "Platform", options: PLATFORM, defaultValue: PLATFORM[0] },
      { name: "length", label: "Length", options: LENGTH, defaultValue: LENGTH[1] },
      { name: "angle", label: "Angle", options: ANGLE, defaultValue: ANGLE[0] },
      { name: "goal", label: "Goal", options: GOAL, defaultValue: GOAL[2] },
    ],
    basePromptTemplate:
      "Create a complete short-form video ad kit for {subject}{holidayClause}, for {platform}, about {length} long, using a {angle} angle with a goal of {goal}. Return, clearly labeled: " +
      "(1) a one-line concept; (2) a time-coded scene-by-scene storyboard — for each scene give the on-screen text, a voiceover line, and a shot direction; " +
      "(3) an instrumental music-bed style line I can paste into Suno; (4) a caption with 5–8 hashtags; (5) a short production checklist.",
    charmPromptTemplate:
      "Create an engaging short-form video ad kit for {subject}{holidayClause} on {platform}, about {length}, using a {angle} angle for {goal}. " +
      "Open with a scroll-stopping first 3 seconds. Include: a concept line, a time-coded storyboard (on-screen text + voiceover + shot per scene), a Suno music-bed line, a caption with hashtags, and a production checklist.",
    dynamicPromptTemplate:
      "Create a bold, conversion-minded video ad kit for {subject}{holidayClause} on {platform}, about {length}, using a {angle} angle to drive {goal}. " +
      "Lead with the strongest hook, keep energy high, and include: concept, time-coded storyboard (on-screen text + voiceover + shot per scene), a Suno music-bed line, a caption with hashtags, and a production checklist.",
    charmPool: [
      "a pattern-interrupt opening shot",
      "one line of social proof woven into a scene",
      "a satisfying visual payoff before the CTA",
    ],
    dynamicPool: [
      "a bolder on-screen hook in scene one",
      "a mid-ad tension beat that earns the CTA",
      "a stronger, more urgent closing card",
    ],
  });
})();
