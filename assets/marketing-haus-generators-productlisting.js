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
 *
 * Depth pass (2026-08-07): each marketplace has real structural rules
 * (Etsy 140-char title + 13 short tags + materials; Amazon keyword title +
 * 5 benefit bullets + backend terms; Shopify SEO title + meta summary), so
 * a per-marketplace rule clause is injected via computeExtraTokens, plus a
 * "who it's for / what makes it different" field so the copy has an angle
 * instead of listing features into a vacuum.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var MARKETPLACE_OPTIONS = ["Etsy", "Shopify", "Amazon", "General Marketplace"];
  var LISTING_FORMAT_OPTIONS = ["Title, Description, and Bullets", "SEO Title and Full Listing", "Conversion-Focused Listing"];

  // Each marketplace's real listing anatomy — the structural quality lever.
  var MARKETPLACE_RULES = {
    "Etsy": "Follow Etsy's structure: a title up to 140 characters that front-loads the phrases shoppers search, a materials/details line, a warm scannable description, and exactly 13 multi-word tags of 20 characters or fewer.",
    "Shopify": "Follow a Shopify DTC structure: an SEO-minded product title, a one-line meta-description-style summary, benefit-led bullet points, a full description that builds desire, and a short set of collection/SEO tags.",
    "Amazon": "Follow Amazon's structure: a keyword-rich title (brand + product + top features + size/quantity), five benefit-led bullet points each leading with a capitalized benefit phrase, a supporting description, and a line of backend search terms.",
    "General Marketplace": "Use a clean, universal structure: a clear keyword-forward title, benefit-led bullet points, a full description, and a short list of relevant tags.",
  };

  MarketingHaus.generatorEngine.registerGenerator({
    id: "product-listing",
    textOnly: true,
    label: "Product Listing Generator",
    icon: "monitor",
    description: "A complete marketplace-ready listing — title, bullets, description, and tags — built to Etsy, Shopify, or Amazon's real structure and rules.",
    fieldGroupTitle: "Customize Your Listing",

    fields: [
      { name: "productFocus", label: "Product & Key Details", isFreeText: true, defaultValue: "the product, its materials, and what makes it worth buying", placeholder: "e.g. our hand-poured soy candle, 8oz, lavender + cedarwood" },
      { name: "marketplace", label: "Marketplace", options: MARKETPLACE_OPTIONS, defaultValue: MARKETPLACE_OPTIONS[3] },
      { name: "listingFormat", label: "Listing Format", options: LISTING_FORMAT_OPTIONS, defaultValue: LISTING_FORMAT_OPTIONS[1] },
      { name: "targetBuyer", label: "Who It's For / What Makes It Different (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. for people who want a clean-burning candle — no synthetic fragrance" },
      { name: "keywordFocus", label: "Keyword Focus", isFreeText: true, defaultValue: "use natural buyer-search language", placeholder: "e.g. soy candle, handmade candle, non-toxic candle" },
    ],

    computeExtraTokens: function (v) {
      return {
        article: /^[aeiou]/i.test(v.marketplace || "") ? "an" : "a",
        marketplaceRule: MARKETPLACE_RULES[v.marketplace] || MARKETPLACE_RULES["General Marketplace"],
        buyerClause: v.targetBuyer ? " Write it for this buyer and lead with this difference: " + v.targetBuyer + "." : "",
      };
    },

    basePromptTemplate:
      "Write {article} {marketplace} listing ({listingFormat}) for {productFocus}{holidayClause}.{buyerClause} " +
      "{marketplaceRule} " +
      "Keyword focus: {keywordFocus}.",

    charmPromptTemplate:
      "Write an inviting {marketplace} listing ({listingFormat}) for {productFocus}, opening with a warm, personality-forward title{holidayClause}.{buyerClause} " +
      "{marketplaceRule} " +
      "Keyword focus: {keywordFocus}. Weave one small storytelling detail into the description.",

    dynamicPromptTemplate:
      "Write a bold, conversion-focused {marketplace} listing ({listingFormat}) for {productFocus}, leading with the single strongest benefit{holidayClause}.{buyerClause} " +
      "{marketplaceRule} " +
      "Keyword focus: {keywordFocus}. Give a clear reason to buy now.",

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
