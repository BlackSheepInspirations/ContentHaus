/**
 * The AI Creator's Brand Haus — Business Card Kit Generator
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-brandkit.js, and brand-haus-generators.js (all must load
 * first — this file just registers itself with that engine).
 *
 * A Page Bundle (Front Design + Back Design) with no Art Style or Color
 * Palette field of its own — this generator's whole reason for living
 * inside Brand Haus rather than Marketing/Graphics Haus is that it
 * should stay maximally consistent with whatever the owner already
 * established as their brand identity, so every aesthetic value is
 * pulled live from the active Brand Kit (BrandHaus.brandKit) via
 * computeExtraTokens instead of exposed as its own field. Falls back to
 * generic, still-usable phrasing when no Brand Kit is active — same
 * "zero input still produces a usable result" rule every generator in
 * this codebase follows.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var sortAlpha = BrandHaus.util.sortAlpha;

  var CARD_STYLE_OPTIONS = sortAlpha(["Minimalist Modern", "Bold & Colorful", "Elegant Script", "Geometric Pattern"]);
  var QR_PLACEMENT_OPTIONS = ["Front", "Back", "Both Front & Back", "No QR Code"];
  var LOGO_SPACE_OPTIONS = ["Yes - Reserve Logo Space", "No Logo Space Needed"];
  var ORIENTATION_OPTIONS = ["Horizontal (Standard)", "Vertical"];

  BrandHaus.generatorEngine.registerGenerator({
    id: "business-card-kit",
    label: "Business Card Kit Generator",
    icon: "crop",
    description: "A matching front-and-back business card design, built straight from your active Brand Kit's colors, fonts, and mood. This produces an AI image-generation prompt for each side — paste it into an image tool (ChatGPT's image generator, Midjourney, Kittl, etc.), not into Frank. Frank's built for business/strategy conversations, not generating visuals.",
    fieldGroupTitle: "Customize Your Business Card",

    fields: [
      { name: "businessName", label: "Business Name", isFreeText: true, defaultValue: "Your Business Name", placeholder: "e.g. Wildroot Studio" },
      { name: "personName", label: "Your Name (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Jordan Smith" },
      { name: "personTitle", label: "Your Title (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Founder & Creative Director" },
      { name: "tagline", label: "Tagline (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Handmade goods, thoughtfully made" },
      { name: "phone", label: "Phone (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. (555) 123-4567" },
      { name: "email", label: "Email (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. hello@wildrootstudio.com" },
      { name: "website", label: "Website (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. www.wildrootstudio.com" },
      { name: "socialHandle", label: "Social Handle (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. @wildrootstudio" },
      { name: "cardStyle", label: "Card Style", options: CARD_STYLE_OPTIONS, defaultValue: CARD_STYLE_OPTIONS[0] },
      { name: "logoSpace", label: "Logo Space", options: LOGO_SPACE_OPTIONS, defaultValue: LOGO_SPACE_OPTIONS[0] },
      { name: "qrPlacement", label: "QR Code Placement", options: QR_PLACEMENT_OPTIONS, defaultValue: QR_PLACEMENT_OPTIONS[3] },
      { name: "cardOrientation", label: "Orientation", options: ORIENTATION_OPTIONS, defaultValue: ORIENTATION_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var kit = BrandHaus.brandKit && BrandHaus.brandKit.getActiveKit();
      var resolve = BrandHaus.engine.resolveFieldValue;
      var colors = kit ? (kit.fields.colors || []).filter(Boolean) : [];
      var headingFont = kit ? resolve(kit.fields.headingFont) : "";
      var bodyFont = kit ? resolve(kit.fields.bodyFont) : "";
      var mood = kit ? resolve(kit.fields.mood) : "";

      var personClause = "";
      if (valueMap.personName) {
        personClause = " Include the name \"" + valueMap.personName + "\"" + (valueMap.personTitle ? " and title \"" + valueMap.personTitle + "\"" : "") + ".";
      }

      var contactParts = [
        valueMap.phone ? "phone: " + valueMap.phone : null,
        valueMap.email ? "email: " + valueMap.email : null,
        valueMap.website ? "website: " + valueMap.website : null,
        valueMap.socialHandle ? "social: " + valueMap.socialHandle : null,
      ].filter(Boolean);
      var contactClause = contactParts.length
        ? "Include a clean layout for these exact contact details: " + contactParts.join(", ") + "."
        : "Include a clean layout for contact details (phone, email, website, social handle) using generic placeholder text.";

      var qrFront = valueMap.qrPlacement === "Front" || valueMap.qrPlacement === "Both Front & Back";
      var qrBack = valueMap.qrPlacement === "Back" || valueMap.qrPlacement === "Both Front & Back";

      return {
        personClause: personClause,
        taglineClause: valueMap.tagline ? " Tagline: \"" + valueMap.tagline + "\"." : "",
        contactClause: contactClause,
        logoClauseFront: valueMap.logoSpace === "Yes - Reserve Logo Space"
          ? "clean, balanced logo/wordmark placement"
          : "clean typographic treatment of the name (no separate logo mark needed)",
        logoClauseBack: valueMap.logoSpace === "Yes - Reserve Logo Space"
          ? " Include a small repeated logo mark."
          : "",
        qrClauseFront: qrFront
          ? " Leave a clean, clearly defined blank square area reserved for a QR code."
          : "",
        qrClauseBack: qrBack
          ? " Leave a clean, clearly defined blank square area reserved for a QR code."
          : "",
        brandColorsClause: colors.length ? "Use this exact color palette: " + colors.join(", ") + "." : "Use a cohesive, professional color palette.",
        brandFontClause: (headingFont || bodyFont)
          ? "Typography should reflect " + (headingFont || bodyFont) + " for headings and " + (bodyFont || headingFont) + " for supporting text."
          : "Use clean, professional typography.",
        brandMoodClause: mood ? " with a " + mood + " overall feel" : "",
        orientationClause: valueMap.cardOrientation === "Vertical"
          ? "Standard vertical business card proportions (2in x 3.5in, portrait orientation)."
          : "Standard horizontal business card proportions (3.5in x 2in, landscape orientation).",
      };
    },

    pageTypesCap: 2,
    pageTypesLabel: "Pages",
    defaultPageTypes: ["front", "back"],
    bundleBlockTitle: "Your Business Card Design",
    pageTypes: [
      {
        id: "front",
        label: "Front Design",
        promptTemplate:
          "BUSINESS CARD — FRONT\n\n" +
          "Design the front of a business card for \"{businessName}\"{taglineClause}{personClause} in a {cardStyle} style{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} Feature the business name prominently, with {logoClauseFront}.{qrClauseFront} " +
          "{orientationClause}",
      },
      {
        id: "back",
        label: "Back Design",
        promptTemplate:
          "BUSINESS CARD — BACK\n\n" +
          "Design the matching back of the same business card for \"{businessName}\", continuing the {cardStyle} style{brandMoodClause}. " +
          "{brandColorsClause} {brandFontClause} {contactClause}{logoClauseBack}{qrClauseBack} " +
          "{orientationClause}",
      },
    ],
  });
})();
