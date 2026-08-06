/**
 * The AI Creator's Marketing Haus — Product Listing & Ad Photo Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (listing-image), per the owner's direction: "this is to create a photo
 * for a marketing ad." Distinct from the broad Mockup Studio (which
 * covers general product photography/settings) in being purpose-built
 * for marketplace listing slots and ad creative — Image Type controls
 * which specific listing slot this fills, and Text Overlay controls
 * whether/how the image itself should leave room for callout text.
 * Photo-realistic only, no art-style field — a listing/ad photo needs to
 * read as a real product photo, same reasoning Video Motion Prompt and
 * the Mascot Generator's pose fields already apply to their own locked
 * styles.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var IMAGE_TYPE_OPTIONS = ["Main Listing Image", "Feature Callout Image", "Size / Scale Image", "What's Included Image", "How-To Image"];
  var BACKGROUND_OPTIONS = ["Clean White", "Soft Neutral", "Lifestyle Scene", "Branded Color", "Subtle Gradient"];
  var TEXT_OVERLAY_OPTIONS = ["No Text", "Minimal Label", "Feature Callouts", "Full Information"];

  var TEXT_OVERLAY_INSTRUCTIONS = {
    "No Text": "Leave the photo completely clean — do not render any text, labels, or callouts.",
    "Minimal Label": "Leave clear open space for one short text label to be added afterward — do not render any actual text yourself.",
    "Feature Callouts": "Leave clear open space near 2-3 product details for short callout labels to be added afterward — do not render any actual text yourself.",
    "Full Information": "Leave generous open space around the product for a full block of information text to be added afterward — do not render any actual text yourself.",
  };

  var LOCKED_SUFFIX = " Photo-realistic product photography, sharp focus, commercial quality, no watermarks, high resolution.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "listing-image",
    usesSizing: true,
    label: "Product Listing & Ad Photo Generator",
    icon: "monitor",
    description: "A marketplace-listing or ad photo prompt, purpose-built for a specific listing slot — main image, feature callout, size/scale, what's-included, or how-to.",
    fieldGroupTitle: "Customize Your Listing Photo",

    fields: [
      { name: "productFocus", label: "Product", isFreeText: true, defaultValue: "the product this photo is for", placeholder: "e.g. our hand-poured soy candle, 8oz amber jar" },
      { name: "imageType", label: "Image Type", options: IMAGE_TYPE_OPTIONS, defaultValue: IMAGE_TYPE_OPTIONS[0] },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
      { name: "textOverlay", label: "Text Overlay", options: TEXT_OVERLAY_OPTIONS, defaultValue: TEXT_OVERLAY_OPTIONS[1] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        textOverlayInstruction: TEXT_OVERLAY_INSTRUCTIONS[valueMap.textOverlay] || TEXT_OVERLAY_INSTRUCTIONS["No Text"],
      };
    },

    basePromptTemplate:
      "A {imageType} for {productFocus}, against a {background} background{holidayClause}. " +
      "{textOverlayInstruction}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "An inviting {imageType} for {productFocus}, against a {background} background{holidayClause}, with soft, flattering lighting. " +
      "{textOverlayInstruction}" +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A striking, ad-ready {imageType} for {productFocus}, against a {background} background{holidayClause}, composed to stop the scroll. " +
      "{textOverlayInstruction}" +
      LOCKED_SUFFIX,

    charmPool: [
      "a soft shadow beneath the product for grounding",
      "a subtle prop that hints at how it's used",
      "gentle natural-light warmth",
    ],
    dynamicPool: [
      "a slightly dramatic angle for more presence",
      "a hint of motion or steam/texture if relevant to the product",
      "tighter cropping for a bolder, closer feel",
    ],
  });
})();
