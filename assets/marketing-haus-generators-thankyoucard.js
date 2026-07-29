/**
 * The AI Creator's Marketing Haus — Thank You Card Insert Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * A packaging insert card (Printify spec: 6 x 4 in, single-sided, 1795 x
 * 1193 px print area, 0.16 in safe border, background must be transparent
 * or patterned — Printify's own guidance is that solid flat backgrounds
 * risk color-saturation issues on this product). Design specs live in the
 * fixed LOCKED_SUFFIX below rather than as fields, since they never
 * change per-generation.
 *
 * "Find Us On" (social platforms) and the reserved logo/QR spaces are
 * deliberately plain freeform/fixed rather than a real multi-select
 * checkbox UI or optional toggles — this Haus's narrow-generator engine
 * has no generic multi-select field type today (only dropdown+freeform
 * and pure freeform), and building one is a bigger, shared-engine change
 * that isn't needed for this to work correctly: typing "Instagram,
 * TikTok, Facebook" produces the exact same finished prompt a checkbox
 * picker would. Flagged as a real simplification, not a silent one — a
 * proper checklist widget could be added later if wanted.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var SALUTATION_OPTIONS = ["Thank You", "With Appreciation", "We're Grateful for You", "Thanks a Million", "Sincerely Grateful"];
  var ART_STYLE_OPTIONS = ["Elegant & Minimal", "Warm & Handwritten", "Modern & Clean", "Whimsical & Illustrated"];
  var COLOR_PALETTE_OPTIONS = ["Bold Primary Colors", "Soft Pastels", "Monochrome with One Accent", "Warm Earth Tones", "Cool Blues & Teals", "Black, White & Gold"];
  var LAYOUT_STYLE_OPTIONS = ["Centered Classic", "Left-Aligned Modern", "Bold Header Banner", "Minimalist Balanced"];
  var BACKGROUND_STYLE_OPTIONS = ["Transparent Background", "Subtle Floral Pattern", "Subtle Geometric Pattern", "Textured Paper / Linen Look", "Soft Gradient Wash"];

  // Fixed, print-spec details that never change per-generation — kept out
  // of the templated body so no field choice can accidentally drop them.
  var LOCKED_SUFFIX =
    " Design specs: single-sided card, 6 x 4 inches, exact print area 1795 x 1193 pixels, keep all text and reserved spaces at least 0.16 inches in from every edge so nothing is cut off when trimmed." +
    " Avoid a solid, flat single-color background — this design will be printed, and solid backgrounds risk color-saturation issues; use the background style requested below instead." +
    " Reserve one clearly defined blank rectangular space for the company's own logo (leave it empty — do not generate a logo yourself) and one separate clearly defined blank square space for a QR code (leave it empty — do not generate an actual QR code, since AI-generated QR codes do not scan)." +
    " Clean, professional, print-ready design, high resolution, no watermarks.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "thank-you-card-insert",
    label: "Thank You Card Insert Generator",
    icon: "heart",
    description: "A packaging insert card to include with every order — salutation, your own message, a future-order incentive, and space reserved for your logo and QR code.",
    fieldGroupTitle: "Customize Your Card",

    fields: [
      { name: "salutation", label: "Salutation", options: SALUTATION_OPTIONS, defaultValue: SALUTATION_OPTIONS[0] },
      { name: "customMessage", label: "Your Message", isFreeText: true, defaultValue: "Thank you so much for your order! We're a small business and we truly appreciate your support.", placeholder: "e.g. Thank you so much for shopping small with us!" },
      { name: "futureDiscount", label: "Future Discount / Offer (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Enjoy 15% off your next order with code THANKYOU15" },
      { name: "companyWebsite", label: "Company Website", isFreeText: true, defaultValue: "", placeholder: "e.g. www.yourshop.com" },
      { name: "contactPhone", label: "Contact Phone (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. (555) 123-4567" },
      { name: "contactEmail", label: "Contact Email (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. hello@yourshop.com" },
      { name: "socialPlatforms", label: "Find Us On (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Instagram, TikTok, Facebook" },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_STYLE_OPTIONS, defaultValue: LAYOUT_STYLE_OPTIONS[0] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "backgroundStyle", label: "Background Style", options: BACKGROUND_STYLE_OPTIONS, defaultValue: BACKGROUND_STYLE_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      return {
        discountClause: valueMap.futureDiscount ? " Include this offer prominently: \"" + valueMap.futureDiscount + "\"." : "",
        websiteClause: valueMap.companyWebsite ? " Include the website: " + valueMap.companyWebsite + "." : "",
        phoneClause: valueMap.contactPhone ? " Include the phone number: " + valueMap.contactPhone + "." : "",
        emailClause: valueMap.contactEmail ? " Include the email address: " + valueMap.contactEmail + "." : "",
        socialClause: valueMap.socialPlatforms
          ? " Include a \"Follow Us on:\" line near the bottom with a simple, minimal icon for each of these platforms: " + valueMap.socialPlatforms + "."
          : "",
      };
    },

    basePromptTemplate:
      "A {layoutStyle} thank-you card insert design with the salutation \"{salutation}\" as the focal headline, in {artStyle} style with a {colorPalette} color palette{holidayClause}.\n\n" +
      "Include this personal message from the business: \"{customMessage}\".{discountClause}{websiteClause}{phoneClause}{emailClause}{socialClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A warm, {layoutStyle} thank-you card insert with the salutation \"{salutation}\" as the headline, in {artStyle} style with a {colorPalette} color palette{holidayClause} and a small heartfelt decorative touch.\n\n" +
      "Include this personal message from the business: \"{customMessage}\".{discountClause}{websiteClause}{phoneClause}{emailClause}{socialClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A standout, {layoutStyle} thank-you card insert with the salutation \"{salutation}\" as a bold headline, in {artStyle} style with a {colorPalette} color palette{holidayClause} and a bolder visual presence.\n\n" +
      "Include this personal message from the business: \"{customMessage}\".{discountClause}{websiteClause}{phoneClause}{emailClause}{socialClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small decorative flourish near the salutation",
      "a subtle corner accent",
      "a soft decorative underline beneath the headline",
    ],
    dynamicPool: [
      "bolder color contrast between the headline and background",
      "larger, more confident headline typography",
      "a more dynamic asymmetric composition",
    ],
  });
})();
