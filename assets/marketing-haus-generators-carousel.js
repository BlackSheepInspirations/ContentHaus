/**
 * The AI Creator's Marketing Haus — Carousel Set Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Net-new (2026-08-07) coverage add: a multi-slide carousel. Unlike the
 * single-graphic gens, this asks for ONE cohesive prompt that lays out every
 * slide in a numbered, consistent set (cover → value slides → CTA), so the
 * whole carousel reads as one designed piece. usesSizing so the shared
 * Output Size picker can target Instagram/LinkedIn/TikTok square or portrait.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var PURPOSE_OPTIONS = ["Educational / How-To", "Listicle / Tips", "Storytelling", "Product Showcase", "Myth-Busting", "Before & After"];
  var SLIDE_COUNT_OPTIONS = ["5 slides", "6 slides", "7 slides", "8 slides", "10 slides"];
  var ART_STYLE_OPTIONS = ["Clean & Minimal", "Bold & Graphic", "Warm Lifestyle Photography-Style", "Bright Illustration", "Elegant & Editorial"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var TYPOGRAPHY_STYLE_OPTIONS = ["Bold Sans-Serif Overlay", "Elegant Serif Overlay", "Handwritten Script Overlay"];

  var LOCKED_SUFFIX =
    " Design every slide as one cohesive set: the same color palette, type treatment, margins, and visual motif carry across all slides so they read as one piece when swiped. " +
    "Keep all text well inside the safe area (away from edges), high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "carousel-set",
    usesSizing: true,
    label: "Carousel Set Generator",
    icon: "layers",
    description: "A full multi-slide carousel — cover, value slides, and a closing CTA — designed as one cohesive, swipeable set for Instagram, LinkedIn, or TikTok.",
    fieldGroupTitle: "Design Your Carousel",

    fields: [
      { name: "purpose", label: "Carousel Purpose", options: PURPOSE_OPTIONS, defaultValue: PURPOSE_OPTIONS[0] },
      { name: "topic", label: "Topic / Big Idea", isFreeText: true, defaultValue: "the one idea this carousel teaches", placeholder: "e.g. how to pick a candle scent for every room" },
      { name: "coverHook", label: "Cover Slide Hook", isFreeText: true, defaultValue: "the scroll-stopping promise on slide 1", placeholder: "e.g. Stop buying candles that fade in a week" },
      { name: "slideCount", label: "Number of Slides", options: SLIDE_COUNT_OPTIONS, defaultValue: SLIDE_COUNT_OPTIONS[1] },
      { name: "cta", label: "Closing CTA", isFreeText: true, defaultValue: "follow for more", placeholder: "e.g. Save this + shop the collection" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "typographyStyle", label: "Typography Style", options: TYPOGRAPHY_STYLE_OPTIONS, defaultValue: TYPOGRAPHY_STYLE_OPTIONS[0] },
    ],

    basePromptTemplate:
      "Design a {slideCount} {purpose} carousel about \"{topic}\" in a {artStyle} style, a {colorPalette} palette, {typographyStyle}{holidayClause}.\n\n" +
      "Lay out each slide in order, numbered, with the on-slide text for each:\n" +
      "• Slide 1 (cover): the hook \"{coverHook}\" as the headline.\n" +
      "• Middle slides: one clear point per slide that builds the idea step by step.\n" +
      "• Final slide: the call to action \"{cta}\"." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Design an inviting {slideCount} {purpose} carousel about \"{topic}\" in a {artStyle} style, a {colorPalette} palette, {typographyStyle}{holidayClause}.\n\n" +
      "Number each slide with its on-slide text: Slide 1 opens with the warm hook \"{coverHook}\", the middle slides each make one friendly point, and the final slide closes with \"{cta}\" — with one small recurring decorative motif tying the set together." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design a bold, scroll-stopping {slideCount} {purpose} carousel about \"{topic}\" in a {artStyle} style, a {colorPalette} palette, {typographyStyle}{holidayClause}.\n\n" +
      "Number each slide with its on-slide text: Slide 1 leads with the punchy hook \"{coverHook}\", each middle slide drives one sharp point with strong visual hierarchy, and the final slide ends on the CTA \"{cta}\" — use a visual cue that pulls the eye toward the next slide." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small slide-number indicator in a consistent corner of each slide",
      "a subtle 'swipe' arrow on the cover to invite the first swipe",
      "one recurring illustrated motif that appears on every slide",
    ],
    dynamicPool: [
      "a progress bar or dot indicator across the top of every slide",
      "a bolder cover slide that visually contrasts with the value slides",
      "an arrow or peeking element at the slide edge hinting at the next slide",
    ],
  });
})();
