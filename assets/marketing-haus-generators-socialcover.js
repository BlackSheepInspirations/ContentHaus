/**
 * The AI Creator's Marketing Haus — Social Media Cover / Banner Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Distinct from Social Media Studio (marketing-haus-social.js), which is
 * a copywriter — this is an image-generation prompt for the actual cover/
 * banner graphic, same category as Infographic/Pinterest Pin/Quote
 * Graphic. Platform is dropdown-only (a structural choice, not a style
 * preference), same pattern Infographic's own Infographic Type field
 * established, mapping to a dimension/safe-area note via computeExtraTokens.
 *
 * Dimensions verified via web search against each platform's own help
 * docs (2026-07-18): Facebook's own Help Center recommends uploading at
 * 851x315px (loads fastest as sRGB JPG under 100KB), though it renders
 * at 820x312px on desktop — LinkedIn's Company Page cover upload spec
 * is 4200x700px (renders at 1128x191px on the page; 1584x396px is the
 * *personal profile* banner, a different surface). YouTube's 2560x1440
 * canvas / 1546x423px safe area and X's 1500x500px were already
 * correct. Pinterest's profile cover is 800x450px. Platforms do still
 * revise these over time, so a periodic re-check remains worthwhile.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var PLATFORM_OPTIONS = ["Facebook Page Cover", "YouTube Channel Banner", "LinkedIn Company Banner", "Twitter/X Header", "Pinterest Profile Cover"];
  var ART_STYLE_OPTIONS = ["Clean & Corporate", "Bold & Colorful", "Minimalist Modern", "Warm & Lifestyle Photography-Style"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];

  var PLATFORM_DIMENSION_INSTRUCTIONS = {
    "Facebook Page Cover": "Design at Facebook's recommended upload proportions (851x315px) — keep key content centered, since it displays smaller (820x312px on desktop, 640x360px on mobile) and the profile picture overlaps the bottom-left corner on mobile.",
    "YouTube Channel Banner": "Design at YouTube's channel banner proportions (2560x1440px) — keep all important content within the centered 1546x423px safe area, since different devices crop the outer edges differently.",
    "LinkedIn Company Banner": "Design at LinkedIn's company page cover upload proportions (4200x700px, rendering at 1128x191px on the page) — a wide, short horizontal format.",
    "Twitter/X Header": "Design at X's profile header proportions (1500x500px) — keep in mind the profile photo overlaps the bottom-left corner.",
    "Pinterest Profile Cover": "Design at Pinterest's profile cover proportions (800x450px) — keep key content centered since the crop varies by device.",
  };

  var LOCKED_SUFFIX = " Clean, professional composition, no watermarks, high resolution.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "social-cover-banner",
    label: "Social Media Cover / Banner Generator",
    icon: "crop",
    description: "A cover/banner graphic sized for Facebook, YouTube, LinkedIn, X, or Pinterest — the actual image, not caption copy.",
    fieldGroupTitle: "Customize Your Cover / Banner",

    fields: [
      { name: "platform", label: "Platform", options: PLATFORM_OPTIONS, defaultValue: PLATFORM_OPTIONS[0] },
      { name: "contentFocus", label: "What to Feature", isFreeText: true, defaultValue: "our brand and what we offer", placeholder: "e.g. our new product line, our team, our storefront" },
      { name: "textOverlay", label: "Text Overlay (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. a tagline, handle, or short CTA" },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        dimensionInstruction: PLATFORM_DIMENSION_INSTRUCTIONS[valueMap.platform] || PLATFORM_DIMENSION_INSTRUCTIONS[PLATFORM_OPTIONS[0]],
        textOverlayClause: valueMap.textOverlay ? " with the text \"" + valueMap.textOverlay + "\" incorporated into the design" : "",
      };
    },

    basePromptTemplate:
      "Design a {platform} featuring {contentFocus}{textOverlayClause}. {artStyle} art style, a {colorPalette} color palette{holidayClause}.\n\n" +
      "{dimensionInstruction}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Design an eye-catching {platform} featuring {contentFocus}{textOverlayClause}, in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "{dimensionInstruction} Include one small decorative accent for extra visual interest." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design a bold, standout {platform} featuring {contentFocus}{textOverlayClause}, in a {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "{dimensionInstruction} Use stronger visual contrast and a more dynamic composition." +
      LOCKED_SUFFIX,

    charmPool: [
      "a subtle decorative pattern in the background",
      "a small badge or icon accent",
      "a soft gradient overlay",
    ],
    dynamicPool: [
      "a bolder diagonal composition",
      "a stronger focal point with more visual weight",
      "brighter, higher-contrast lighting",
    ],
  });
})();
