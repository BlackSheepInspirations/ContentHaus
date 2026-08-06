/**
 * The AI Creator's Marketing Haus — Social Post Template Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A general-purpose, reusable social post graphic — distinct from
 * Pinterest Pin (platform-specific proportions/branding) and Quote
 * Graphic (quote-text-specific) already in this Haus. Post Purpose and
 * Post Format are both dropdown-only (structural choices), each mapping
 * to its own compositional instruction via computeExtraTokens, same
 * *_INSTRUCTIONS lookup pattern Infographic's own Infographic Type
 * field established.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var POST_PURPOSE_OPTIONS = ["Announcement", "Tip / Educational", "Behind-the-Scenes", "Promotional / Sale", "Testimonial Highlight", "Question / Engagement"];
  var POST_FORMAT_OPTIONS = ["Square (1:1)", "Story / Reel (9:16)", "Landscape (16:9)"];
  var ART_STYLE_OPTIONS = ["Clean & Corporate", "Playful & Illustrated", "Minimal Line Icons", "Bold & Colorful", "Warm & Lifestyle Photography-Style"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];

  var POST_PURPOSE_INSTRUCTIONS = {
    "Announcement": "Make the headline the clear, dominant focal point of the composition.",
    "Tip / Educational": "Use a clean, numbered or bulleted layout so the tip reads at a glance.",
    "Behind-the-Scenes": "Favor a candid, in-the-moment feel over a polished studio look.",
    "Promotional / Sale": "Give the offer/discount strong visual emphasis, with room for a clear call-to-action.",
    "Testimonial Highlight": "Feature a quote-style callout with clear space for a customer name/title.",
    "Question / Engagement": "Leave visual breathing room around the question so it reads as an invitation, not clutter.",
  };
  var POST_FORMAT_INSTRUCTIONS = {
    "Square (1:1)": "Format: square 1:1 aspect ratio, optimized for feed posts.",
    "Story / Reel (9:16)": "Format: vertical 9:16 aspect ratio, optimized for Stories/Reels — keep key content clear of the very top and bottom (UI overlap zones).",
    "Landscape (16:9)": "Format: horizontal 16:9 aspect ratio, optimized for link previews and wider feed placements.",
  };

  var LOCKED_SUFFIX = " Clean, legible typography, no watermarks, high resolution.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "post-template",
    usesSizing: true,
    label: "Social Post Template Generator",
    icon: "layers",
    description: "A reusable, on-brand social post graphic — pick a purpose and format, works for any platform's feed.",
    fieldGroupTitle: "Customize Your Post Template",

    fields: [
      { name: "postPurpose", label: "Post Purpose", options: POST_PURPOSE_OPTIONS, defaultValue: POST_PURPOSE_OPTIONS[0] },
      { name: "postFormat", label: "Format", options: POST_FORMAT_OPTIONS, defaultValue: POST_FORMAT_OPTIONS[0] },
      { name: "headlineText", label: "Headline Text", isFreeText: true, defaultValue: "big news coming soon", placeholder: "e.g. big news coming soon, 3 tips for a better morning routine" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        purposeInstruction: POST_PURPOSE_INSTRUCTIONS[valueMap.postPurpose] || POST_PURPOSE_INSTRUCTIONS[POST_PURPOSE_OPTIONS[0]],
        formatInstruction: POST_FORMAT_INSTRUCTIONS[valueMap.postFormat] || POST_FORMAT_INSTRUCTIONS[POST_FORMAT_OPTIONS[0]],
        postPurposeArticle: /^[aeiou]/i.test(valueMap.postPurpose) ? "An" : "A",
      };
    },

    basePromptTemplate:
      "{postPurposeArticle} {postPurpose} social media post template, featuring the headline \"{headlineText}\". {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\n" +
      "{purposeInstruction} {formatInstruction}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "An engaging {postPurpose} social media post template, featuring the headline \"{headlineText}\", in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "{purposeInstruction} {formatInstruction} Include one small decorative accent for extra visual interest." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A bold, standout {postPurpose} social media post template, featuring the headline \"{headlineText}\", in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "{purposeInstruction} {formatInstruction} Use stronger visual contrast and a more dynamic composition." +
      LOCKED_SUFFIX,

    charmPool: [
      "a subtle decorative pattern in the background",
      "a small icon or badge accent",
      "a soft gradient overlay",
    ],
    dynamicPool: [
      "a bolder diagonal composition",
      "a stronger focal point with more visual weight",
      "brighter, higher-contrast lighting",
    ],
  });
})();
