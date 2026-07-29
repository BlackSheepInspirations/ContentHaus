/**
 * The AI Creator's Brand Haus — Thank You Card Insert Generator
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-brandkit.js, and brand-haus-generators.js (all must load
 * first — this file just registers itself with that engine).
 *
 * Same Printify packaging-insert spec as Marketing Haus's own copy of
 * this generator (6 x 4 in, single-sided, 1795 x 1193 px print area,
 * 0.16 in safe border, transparent/patterned background only). This
 * Brand Haus version carries no Art Style or Color Palette field of its
 * own — every aesthetic value comes live from the active Brand Kit via
 * computeExtraTokens, matching Business Card Kit/Media Kit's precedent,
 * with generic fallback phrasing when no kit is active.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var SALUTATION_OPTIONS = ["Thank You", "With Appreciation", "We're Grateful for You", "Thanks a Million", "Sincerely Grateful"];
  var LAYOUT_STYLE_OPTIONS = ["Centered Classic", "Left-Aligned Modern", "Bold Header Banner", "Minimalist Balanced"];
  var BACKGROUND_STYLE_OPTIONS = ["Transparent Background", "Subtle Floral Pattern", "Subtle Geometric Pattern", "Textured Paper / Linen Look", "Soft Gradient Wash"];

  var LOCKED_SUFFIX =
    " Design specs: single-sided card, 6 x 4 inches, exact print area 1795 x 1193 pixels, keep all text and reserved spaces at least 0.16 inches in from every edge so nothing is cut off when trimmed." +
    " Avoid a solid, flat single-color background — this design will be printed, and solid backgrounds risk color-saturation issues; use the background style requested below instead." +
    " Reserve one clearly defined blank rectangular space for the company's own logo (leave it empty — do not generate a logo yourself) and one separate clearly defined blank square space for a QR code (leave it empty — do not generate an actual QR code, since AI-generated QR codes do not scan)." +
    " Clean, professional, print-ready design, high resolution, no watermarks.";

  BrandHaus.generatorEngine.registerGenerator({
    id: "thank-you-card-insert",
    label: "Thank You Card Insert Generator",
    icon: "heart",
    description: "A packaging insert card to include with every order — built straight from your active Brand Kit's colors, fonts, and mood. This produces an AI image-generation prompt — paste it into an image tool (ChatGPT's image generator, Midjourney, Kittl, etc.), not into Frank.",
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
      { name: "backgroundStyle", label: "Background Style", options: BACKGROUND_STYLE_OPTIONS, defaultValue: BACKGROUND_STYLE_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var kit = BrandHaus.brandKit && BrandHaus.brandKit.getActiveKit();
      var resolve = BrandHaus.engine.resolveFieldValue;
      var colors = kit ? (kit.fields.colors || []).filter(Boolean) : [];
      var mood = kit ? resolve(kit.fields.mood) : "";
      var businessName = BrandHaus.identity ? resolve(BrandHaus.identity.getState().businessName) : "";

      return {
        forClause: businessName ? " from \"" + businessName + "\"" : " from the business",
        brandColorsClause: colors.length ? "Use this exact color palette: " + colors.join(", ") + "." : "Use a cohesive, professional color palette.",
        brandMoodClause: mood ? " with a " + mood + " overall feel" : "",
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
      "A {layoutStyle} thank-you card insert design{forClause} with the salutation \"{salutation}\" as the focal headline{brandMoodClause}. {brandColorsClause}\n\n" +
      "Include this personal message from the business: \"{customMessage}\".{discountClause}{websiteClause}{phoneClause}{emailClause}{socialClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "A warm, {layoutStyle} thank-you card insert{forClause} with the salutation \"{salutation}\" as the headline{brandMoodClause} and a small heartfelt decorative touch. {brandColorsClause}\n\n" +
      "Include this personal message from the business: \"{customMessage}\".{discountClause}{websiteClause}{phoneClause}{emailClause}{socialClause}\n\n" +
      "Background: {backgroundStyle}." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "A standout, {layoutStyle} thank-you card insert{forClause} with the salutation \"{salutation}\" as a bold headline{brandMoodClause} and a bolder visual presence. {brandColorsClause}\n\n" +
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
