/**
 * The AI Creator's Product Haus — Planner Pages Generator
 * Depends on product-haus-util.js, product-haus-engine.js,
 * product-haus-styledna.js, and product-haus-generators.js (all must
 * load first — this file just registers itself with that engine).
 *
 * Second generator built against the pattern, and the first to use the
 * engine's grouped/capped Sections picker: pick up to sectionsCap
 * section names (grouped by category for browsability), transparently
 * capped in the UI itself rather than silently truncated at assembly
 * time — leaving it blank falls back to a solid default set (Top 3
 * Focus, Brain Dump, Time Blocking, Daily Schedule) so the template
 * still produces a complete page with zero input.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var PAGE_TYPE_OPTIONS = ["Daily", "Weekly", "Tracker", "Reflection", "Habits", "Goals"];
  var VIBE_OPTIONS = ["Calm", "Motivating", "Fun", "Minimal", "Cozy", "Luxury"];
  var COMPLEXITY_OPTIONS = ["Simple", "Moderate", "Detailed"];

  var VIBE_DECOR = {
    "Calm": "soft abstract shapes, small botanical accents, and gentle banners",
    "Motivating": "bold banners, upward arrows, and energetic accent shapes",
    "Fun": "playful stickers, bright confetti dots, and whimsical doodles",
    "Minimal": "a few clean geometric accents, kept deliberately sparse",
    "Cozy": "soft textures, small floral touches, and warm ribbon banners",
    "Luxury": "gold-foil-style lines, elegant borders, and refined flourishes",
  };
  var DEFAULT_DECOR = "soft abstract shapes and simple banners";

  // Decorative Motif answers "flowers, bows, animals, garden, etc." —
  // Vibe alone (Calm/Motivating/Fun/...) never named an actual subject
  // for the decoration, just a mood. When Decorative Motif is set, it
  // replaces the Vibe-driven decorClause below rather than combining
  // with it, so the two don't fight over what's actually drawn.
  var DECOR_MOTIF_OPTIONS = [
    "Florals", "Bows & Ribbons", "Garden & Botanical", "Cute Animals & Critters", "Celestial & Stars",
    "Geometric Shapes", "Polka Dots & Stripes", "Hearts & Love", "Tropical & Palm Leaves", "None — Keep It Clean",
  ];
  var DECOR_MOTIF_PHRASES = {
    "Florals": "delicate floral illustrations and soft botanical accents",
    "Bows & Ribbons": "elegant bow and ribbon accents",
    "Garden & Botanical": "leafy garden greenery and botanical line art",
    "Cute Animals & Critters": "small, cute animal illustrations and critter accents",
    "Celestial & Stars": "stars, moons, and soft celestial accents",
    "Geometric Shapes": "clean geometric shapes and modern line accents",
    "Polka Dots & Stripes": "playful polka dots and stripe accents",
    "Hearts & Love": "small heart accents and soft romantic touches",
    "Tropical & Palm Leaves": "tropical palm leaves and breezy botanical accents",
    "None — Keep It Clean": "minimal decoration, kept deliberately clean",
  };

  // Aesthetic Lean answers "lean more masculine or feminine" directly —
  // a separate axis from Decorative Motif (a garden motif can still read
  // masculine or feminine depending on execution) and from Vibe (a Calm
  // vibe says nothing about gendered styling either).
  var AESTHETIC_LEAN_OPTIONS = ["Feminine & Soft", "Masculine & Bold", "Neutral / Unisex", "Playful & Kids-Friendly"];
  var AESTHETIC_LEAN_PHRASES = {
    "Feminine & Soft": "feminine and soft",
    "Masculine & Bold": "masculine and bold",
    "Neutral / Unisex": "neutral, unisex-friendly",
    "Playful & Kids-Friendly": "playful and kid-friendly",
  };

  var SECTION_GROUPS = [
    { label: "Productivity", options: ["Priority Tasks", "Top 3 Focus", "Time Blocking", "Daily Schedule", "To-Do List", "Brain Dump"] },
    { label: "Goals", options: ["Goal Breakdown", "Action Steps", "Progress Tracker", "Habit Tracker", "Milestone Tracker"] },
    { label: "Mindset", options: ["Daily Reflection", "Journaling Space", "Gratitude List", "Affirmations", "Self Check-In"] },
    { label: "Wellness", options: ["Mood Tracker", "Energy Tracker", "Self-Care Ideas", "Sleep Tracker"] },
    { label: "Creative", options: ["Creative Prompt", "Doodle Space", "Vision Box", "Idea Generator"] },
    { label: "Finance", options: ["Expense Tracker", "Income Log", "Spending Log", "Savings Tracker", "Budget Breakdown", "Bills Tracker", "Debt Tracker", "Financial Goals"] },
  ];

  ProductHaus.generatorEngine.registerGenerator({
    id: "planner-pages",
    label: "Planner Pages That Sell",
    icon: "document",
    description: "A printable planner page built around a theme and up to 10 sections you pick — works even if you don't touch a single field below.",
    fieldGroupTitle: "Customize Your Planner Page",

    fields: [
      { name: "goalOrTheme", label: "Title / Goal or Theme", isFreeText: true, defaultValue: "daily planning", placeholder: "e.g. Morning routine, Budget planning, Self-care..." },
      { name: "targetUser", label: "Target User (optional)", isFreeText: true, defaultValue: "everyday planners", placeholder: "e.g. busy moms, students, entrepreneurs..." },
      { name: "pageType", label: "Page Type", options: PAGE_TYPE_OPTIONS, defaultValue: PAGE_TYPE_OPTIONS[0] },
      { name: "vibe", label: "Vibe", options: VIBE_OPTIONS, defaultValue: VIBE_OPTIONS[0], aesthetic: "mood" },
      { name: "style", label: "Style", isFreeText: true, defaultValue: "modern", placeholder: "e.g. Doodle, Modern, Pastel...", aesthetic: "artStyle" },
      { name: "complexity", label: "Complexity", options: COMPLEXITY_OPTIONS, defaultValue: COMPLEXITY_OPTIONS[0] },
      { name: "decorativeMotif", label: "Decorative Motif (optional)", options: DECOR_MOTIF_OPTIONS, defaultValue: "", aesthetic: "motifs" },
      { name: "aestheticLean", label: "Aesthetic Lean (optional)", options: AESTHETIC_LEAN_OPTIONS, defaultValue: "" },
    ],

    sectionGroups: SECTION_GROUPS,
    sectionsCap: 10,
    sectionsLabel: "Sections (pick up to 10 — leave blank for a default set)",
    sectionsNote: "The more sections you add, the more condensed each one gets to fit the page.",
    defaultSections: ["Top 3 Focus", "Brain Dump", "Time Blocking", "Daily Schedule"],

    computeExtraTokens: function (valueMap) {
      var motif = valueMap.decorativeMotif;
      var decorClause = motif
        ? (DECOR_MOTIF_PHRASES[motif] || ("decorative " + motif.toLowerCase() + "-themed accents"))
        : (VIBE_DECOR[valueMap.vibe] || DEFAULT_DECOR);
      var lean = valueMap.aestheticLean;
      var leanClause = lean ? ", with an overall " + (AESTHETIC_LEAN_PHRASES[lean] || lean.toLowerCase()) + " feel" : "";
      return { decorClause: decorClause, leanClause: leanClause };
    },

    basePromptTemplate:
      "Design a {vibe} {pageType} planner page for {targetUser}, titled \"{goalOrTheme}\"\n\nSECTIONS TO INCLUDE ({sectionsCount}):\n{sectionsBlock}\n\nFor every section: give it a short, bold heading; make clear what the reader is meant to write, check off, or track there; and choose a layout that actually fits that purpose (a grid for a tracker, ruled lines for reflection, a checklist for tasks, and so on).\n\nOverall layout: display \"{goalOrTheme}\" prominently as the page title at the top, then an easy-to-scan flow down the page, splitting into two columns where it helps the sections breathe.\n\nDecorative touches: {decorClause}{leanClause}, kept light enough that the sections stay the star of the page.\n\nStyle: {style}. Mood: {vibe}. Detail level: {complexity}.{holidayClause}\n\nThe finished page should feel premium and intentional — something someone would actually want to print and use every day.",

    charmPromptTemplate:
      "Design a {vibe} {pageType} planner page for {targetUser}, titled \"{goalOrTheme}\"\n\nSECTIONS TO INCLUDE ({sectionsCount}):\n{sectionsBlock}\n\nGive each section a warm, inviting heading, a clear sense of what to write or track inside it, and a layout suited to that purpose. Display \"{goalOrTheme}\" prominently as the page title at the top, then let the page breathe with a flowing two-column layout where useful.\n\nDecorative touches: {decorClause}{leanClause}, plus one small charming detail worked in somewhere it won't crowd the content.\n\nStyle: {style}. Mood: {vibe}. Detail level: {complexity}.{holidayClause}\n\nThe finished page should feel like a small treat to open every day — premium, intentional, and genuinely inviting.",

    dynamicPromptTemplate:
      "Design an energetic take on a {vibe} {pageType} planner page for {targetUser}, titled \"{goalOrTheme}\"\n\nSECTIONS TO INCLUDE ({sectionsCount}):\n{sectionsBlock}\n\nGive each section a bold, confident heading, a clear sense of what goes inside it, and a layout with a bit more visual movement — angled dividers, varied box shapes, or a mix of grids and open space.\n\nDisplay \"{goalOrTheme}\" prominently as the page title at the top.\n\nDecorative touches: {decorClause}{leanClause}, with a bit of extra energy layered in.\n\nStyle: {style}. Mood: {vibe}. Detail level: {complexity}.{holidayClause}\n\nThe finished page should feel premium, purposeful, and a little more alive than a standard template.",

    charmPool: [
      "a small washi-tape accent in one corner",
      "a tiny ribbon banner tucked above the title",
      "a single hand-drawn heart near the footer",
      "a subtle sticker-style icon by one section heading",
    ],
    dynamicPool: [
      "a slightly bolder color block behind the title",
      "a diagonal accent line running behind one section",
      "a scattering of small geometric shapes for visual energy",
    ],
  });
})();
