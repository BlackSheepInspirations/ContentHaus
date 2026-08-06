/**
 * The AI Creator's Marketing Haus — Product Listing Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, and marketing-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Migrated from ROOTED Method's old flat generator catalog
 * (product-listing) — a full marketplace-ready listing (title, bullets,
 * description, tags), distinct from the Sales & Landing Page Studio's
 * broader Product Description content type, which is prose-only and not
 * marketplace-structured.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var MARKETPLACE_OPTIONS = ["Etsy", "Shopify", "Amazon", "General Marketplace"];
  var LISTING_FORMAT_OPTIONS = ["Title, Description, and Bullets", "SEO Title and Full Listing", "Conversion-Focused Listing"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "product-listing",
    textOnly: true,
    label: "Product Listing Generator",
    icon: "monitor",
    description: "A complete marketplace-ready listing — title, bullet points, description, and tags — for Etsy, Shopify, Amazon, or any marketplace.",
    fieldGroupTitle: "Customize Your Listing",

    fields: [
      { name: "productFocus", label: "Product & Key Details", isFreeText: true, defaultValue: "the product, its materials, and what makes it worth buying", placeholder: "e.g. our hand-poured soy candle, 8oz, lavender + cedarwood" },
      { name: "marketplace", label: "Marketplace", options: MARKETPLACE_OPTIONS, defaultValue: MARKETPLACE_OPTIONS[3] },
      { name: "listingFormat", label: "Listing Format", options: LISTING_FORMAT_OPTIONS, defaultValue: LISTING_FORMAT_OPTIONS[1] },
      { name: "keywordFocus", label: "Keyword Focus", isFreeText: true, defaultValue: "use natural buyer-search language", placeholder: "e.g. soy candle, handmade candle, non-toxic candle" },
    ],

    basePromptTemplate:
      "Write a {marketplace} listing ({listingFormat}) for {productFocus}{holidayClause}. " +
      "Keyword focus: {keywordFocus}. " +
      "Include a compelling title, well-organized bullet points covering the key features/benefits, a full description, and a short list of relevant tags at the end.",

    charmPromptTemplate:
      "Write an inviting {marketplace} listing ({listingFormat}) for {productFocus}, opening with a warm, personality-forward title{holidayClause}. " +
      "Keyword focus: {keywordFocus}. " +
      "Include the title, bullet points, full description, and tags — with one small storytelling detail woven into the description.",

    dynamicPromptTemplate:
      "Write a bold, conversion-focused {marketplace} listing ({listingFormat}) for {productFocus}, leading with the single strongest benefit{holidayClause}. " +
      "Keyword focus: {keywordFocus}. " +
      "Include the title, bullet points, full description, and tags — with a clear reason to buy now.",

    charmPool: [
      "a short line about who this product is perfect for",
      "one sensory or material detail that makes it feel tangible",
      "a small note on care/use instructions",
    ],
    dynamicPool: [
      "a direct comparison to a lower-quality alternative",
      "an urgency or limited-availability note (only if genuinely true)",
      "a strong guarantee or satisfaction line",
    ],
  });
})();
