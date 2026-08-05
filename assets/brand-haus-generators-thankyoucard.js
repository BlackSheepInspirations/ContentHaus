/**
 * The AI Creator's Brand Haus — Insert Card Generator
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-brandkit.js, and brand-haus-generators.js (all must load
 * first — this file just registers itself with that engine).
 *
 * Same Printify packaging-insert spec as before (6 x 4 in, single-sided,
 * 1795 x 1193 px, 0.16 in safe border, transparent/patterned background).
 * Consolidates the old Thank You Card + Gift Message generators behind one
 * Card Type toggle — they shared the identical print spec and Brand-Kit-
 * driven aesthetic and differed only in body copy + reserved spaces:
 *   - Thank-you card    → salutation + message + contact/offer/social,
 *     reserved logo & QR spaces.
 *   - Gift message card → a clean reserved center space for a note the
 *     buyer adds at checkout, plus a reserved logo space.
 * All aesthetic values come live from the active Brand Kit (colors/mood),
 * with generic fallback phrasing when no kit is active.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var CARD_TYPE_OPTIONS = ["Thank-you card", "Gift message card"];
  var GIFT = "Gift message card";
  var SALUTATION_OPTIONS = ["Thank You", "With Appreciation", "We're Grateful for You", "Thanks a Million", "Sincerely Grateful"];
  var LAYOUT_STYLE_OPTIONS = ["Centered Classic", "Left-Aligned Modern", "Bold Header Banner", "Minimalist Balanced"];
  var BACKGROUND_STYLE_OPTIONS = ["Transparent Background", "Subtle Floral Pattern", "Subtle Geometric Pattern", "Textured Paper / Linen Look", "Soft Gradient Wash"];

  var SPEC_HEAD =
    " Design specs: single-sided card, 6 x 4 inches, exact print area 1795 x 1193 pixels, keep all text and reserved spaces at least 0.16 inches in from every edge so nothing is cut off when trimmed." +
    " Avoid a solid, flat single-color background — this design will be printed, and solid backgrounds risk color-saturation issues; use the background style requested instead.";
  var SPEC_TAIL = " Clean, professional, print-ready design, high resolution, no watermarks.";
  var THANKYOU_RESERVE =
    " Reserve one clearly defined blank rectangular space for the company's own logo (leave it empty — do not generate a logo yourself) and one separate clearly defined blank square space for a QR code (leave it empty — do not generate an actual QR code, since AI-generated QR codes do not scan).";
  var GIFT_RESERVE =
    " Reserve one large, clean, uncluttered blank rectangular space taking up most of the card's center — light-colored and free of any busy pattern — sized for a handwritten-length gift message added later; do not add placeholder text inside it." +
    " Reserve one separate clearly defined blank rectangular space for the company's own logo (leave it empty — do not generate a logo yourself).";

  BrandHaus.generatorEngine.registerGenerator({
    id: "insert-card",
    label: "Insert Card Generator",
    icon: "heart",
    description: "A packaging insert card built from your active Brand Kit. Pick Thank-you (your message, offer, contact + logo/QR spaces) or Gift message (a clean reserved space for a note the buyer adds at checkout). Produces an AI image-generation prompt — paste it into an image tool, not into Frank.",
    fieldGroupTitle: "Customize Your Card",

    fields: [
      { name: "cardType", label: "Card Type", options: CARD_TYPE_OPTIONS, defaultValue: CARD_TYPE_OPTIONS[0] },
      { name: "layoutStyle", label: "Layout Style", options: LAYOUT_STYLE_OPTIONS, defaultValue: LAYOUT_STYLE_OPTIONS[0] },
      { name: "backgroundStyle", label: "Background Style", options: BACKGROUND_STYLE_OPTIONS, defaultValue: BACKGROUND_STYLE_OPTIONS[0] },
      { name: "salutation", label: "Salutation (thank-you)", options: SALUTATION_OPTIONS, defaultValue: SALUTATION_OPTIONS[0] },
      { name: "customMessage", label: "Your Message (thank-you)", isFreeText: true, defaultValue: "Thank you so much for your order! We're a small business and we truly appreciate your support.", placeholder: "e.g. Thank you so much for shopping small with us!" },
      { name: "futureDiscount", label: "Future Discount / Offer (thank-you, optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Enjoy 15% off your next order with code THANKYOU15" },
      { name: "companyWebsite", label: "Company Website (thank-you, optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. www.yourshop.com" },
      { name: "contactPhone", label: "Contact Phone (thank-you, optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. (555) 123-4567" },
      { name: "contactEmail", label: "Contact Email (thank-you, optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. hello@yourshop.com" },
      { name: "socialPlatforms", label: "Find Us On (thank-you, optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. Instagram, TikTok, Facebook" },
      { name: "accentPhrase", label: "Accent Phrase (gift, optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. A Gift For You, With Love" },
    ],

    computeExtraTokens: function (valueMap) {
      var kit = BrandHaus.brandKit && BrandHaus.brandKit.getActiveKit();
      var resolve = BrandHaus.engine.resolveFieldValue;
      var colors = kit ? (kit.fields.colors || []).filter(Boolean) : [];
      var mood = kit ? resolve(kit.fields.mood) : "";
      var businessName = BrandHaus.identity ? resolve(BrandHaus.identity.getState().businessName) : "";
      var colorsClause = colors.length ? "Use this exact color palette: " + colors.join(", ") + "." : "Use a cohesive, professional color palette.";
      var moodClause = mood ? " with a " + mood + " overall feel" : "";
      var forClause = businessName ? " from \"" + businessName + "\"" : " from the business";

      var isGift = valueMap.cardType === GIFT;
      var body, reserve;
      if (isGift) {
        var accentClause = valueMap.accentPhrase ? " Include this small decorative phrase near the top, kept light and secondary to the reserved message space: \"" + valueMap.accentPhrase + "\"." : "";
        body = "A " + valueMap.layoutStyle + " gift-message insert card base design" + moodClause + ". " + colorsClause + accentClause +
          "\n\nBackground: " + valueMap.backgroundStyle + ".";
        reserve = GIFT_RESERVE;
      } else {
        var discountClause = valueMap.futureDiscount ? " Include this offer prominently: \"" + valueMap.futureDiscount + "\"." : "";
        var websiteClause = valueMap.companyWebsite ? " Include the website: " + valueMap.companyWebsite + "." : "";
        var phoneClause = valueMap.contactPhone ? " Include the phone number: " + valueMap.contactPhone + "." : "";
        var emailClause = valueMap.contactEmail ? " Include the email address: " + valueMap.contactEmail + "." : "";
        var socialClause = valueMap.socialPlatforms ? " Include a \"Follow Us on:\" line near the bottom with a simple, minimal icon for each of these platforms: " + valueMap.socialPlatforms + "." : "";
        body = "A " + valueMap.layoutStyle + " thank-you card insert design" + forClause + " with the salutation \"" + valueMap.salutation + "\" as the focal headline" + moodClause + ". " + colorsClause +
          "\n\nInclude this personal message from the business: \"" + valueMap.customMessage + "\"." + discountClause + websiteClause + phoneClause + emailClause + socialClause +
          "\n\nBackground: " + valueMap.backgroundStyle + ".";
        reserve = THANKYOU_RESERVE;
      }
      return { cardBody: body, lockedSuffix: SPEC_HEAD + reserve + SPEC_TAIL };
    },

    basePromptTemplate: "{cardBody}{lockedSuffix}",

    charmPool: [
      "a small decorative flourish near the top",
      "a subtle corner accent",
      "a soft decorative underline or border detail",
    ],
    dynamicPool: [
      "bolder color contrast between the elements and background",
      "larger, more confident typography where text appears",
      "a more dynamic, asymmetric composition",
    ],
  });
})();
