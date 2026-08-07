/**
 * The AI Creator's Marketing Haus — Story / Reel Cover Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Net-new (2026-08-07) coverage add: the 9:16 vertical cover/thumbnail that
 * fronts an Instagram/Facebook Story, a Reel, or a TikTok — the still frame
 * a viewer sees on the profile grid or highlight before tapping. usesSizing
 * so the shared Output Size picker can pin the exact 9:16 target, but the
 * locked suffix already enforces vertical + the platform-UI safe zones.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var COVER_TYPE_OPTIONS = ["Reel Cover (grid thumbnail)", "Story Cover", "Highlight Cover", "TikTok Cover"];
  var ART_STYLE_OPTIONS = ["Clean & Minimal", "Bold & Graphic", "Warm Lifestyle Photography-Style", "Bright Illustration", "Elegant & Editorial"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var TYPOGRAPHY_STYLE_OPTIONS = ["Bold Sans-Serif Overlay", "Elegant Serif Overlay", "Handwritten Script Overlay", "No Text (image only)"];

  var LOCKED_SUFFIX =
    " Vertical 9:16 format (1080x1920px). Keep the title and all key elements centered within the middle safe zone — clear of the top ~250px and bottom ~350px where the platform overlays the profile icon, caption, and action buttons. High resolution, legible as a small grid thumbnail, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "story-reel-cover",
    usesSizing: true,
    label: "Story / Reel Cover Generator",
    icon: "crop",
    description: "A vertical 9:16 cover for a Reel, Story, Highlight, or TikTok — the eye-catching still frame viewers see before they tap, with the title inside the safe zone.",
    fieldGroupTitle: "Design Your Cover",

    fields: [
      { name: "coverType", label: "Cover Type", options: COVER_TYPE_OPTIONS, defaultValue: COVER_TYPE_OPTIONS[0] },
      { name: "titleText", label: "Cover Title Text", isFreeText: true, defaultValue: "3 Candle Care Secrets", placeholder: "e.g. 3 Candle Care Secrets" },
      { name: "topic", label: "What It's About", isFreeText: true, defaultValue: "the video's topic", placeholder: "e.g. making a candle burn evenly every time" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[1], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "typographyStyle", label: "Title Typography", options: TYPOGRAPHY_STYLE_OPTIONS, defaultValue: TYPOGRAPHY_STYLE_OPTIONS[0] },
    ],

    basePromptTemplate:
      "A {coverType} about \"{topic}\", with the bold title \"{titleText}\". {artStyle} art style, a {colorPalette} color palette, {typographyStyle}{holidayClause}.\n\n" +
      "Layout: the title anchored in the vertical center, large and instantly readable, over supporting imagery that fills the frame." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Design an inviting {coverType} about \"{topic}\", featuring the title \"{titleText}\", in a {artStyle} style, a {colorPalette} palette, {typographyStyle}{holidayClause}.\n\n" +
      "Layout: a warm, scroll-stopping center title over imagery with charm and a clear focal point." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design a bold, thumb-stopping {coverType} about \"{topic}\", featuring the title \"{titleText}\", in a {artStyle} style, a {colorPalette} palette, {typographyStyle}{holidayClause}.\n\n" +
      "Layout: dramatic center title with strong contrast and visual energy that still reads clearly at grid-thumbnail size." +
      LOCKED_SUFFIX,

    charmPool: [
      "a soft highlight or glow behind the title for separation from the background",
      "a small decorative accent that matches the brand mood",
      "a subtle vignette to focus the eye on the title",
    ],
    dynamicPool: [
      "a high-contrast color block behind the title for maximum legibility",
      "a bold expressive facial expression or gesture if a person is featured",
      "a dynamic diagonal composition for energy",
    ],
  });
})();
