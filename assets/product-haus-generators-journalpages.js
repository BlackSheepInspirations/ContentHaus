/**
 * The AI Creator's Product Haus — Journal Page Generator
 * Depends on product-haus-util.js, product-haus-engine.js, and
 * product-haus-generators.js (must load first — this file just
 * registers itself with that engine, and is the first generator to use
 * its category-conditional Page Types capability: which Page Types are
 * even offered, and each one's own functional elements, both change
 * with the chosen Journal Category rather than being one fixed list).
 *
 * A sibling to Junk Journal, not a replacement — Junk Journal's page
 * types (Cover/Ephemera/Themed Spread/Closing) are generic scrapbook
 * pages; this generator is for functional, category-specific journal
 * pages (a "Monthly Budget Review" page, a "Habit Tracker" page) that
 * don't fit that shape at all.
 *
 * Every page type's template is built from one shared boilerplate block
 * (COMMON_SHARED_BLOCK below) covering layout/writing space/visual
 * direction/typography/composition/print requirements/negative prompt —
 * the same "large locked base + a few visible fields" pattern every
 * other generator in this engine already uses — so authoring a new
 * page type only ever means writing its one-line opening + functional
 * elements list, never re-describing the whole design system.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var makeField = ProductHaus.util.makeField;
  var sortAlpha = ProductHaus.util.sortAlpha;

  // Order is deliberate (matches how these were scoped), not alphabetical.
  var JOURNAL_CATEGORY_OPTIONS = [
    "Financial / Wealth / Budget",
    "Health / Wellness / Self-Care",
    "Personal Growth / Identity / Mindset",
    "Relationships / Family / Memories",
    "Creativity / Hobbies / Expression",
  ];

  var PAGE_PURPOSE_OPTIONS = sortAlpha([
    "Daily Reflection", "Weekly Planning", "Monthly Review", "Goal Setting", "Habit Tracking",
    "Gratitude Practice", "Memory Keeping", "Creative Exploration", "Progress Tracking", "Emotional Processing",
  ]);

  // Rule Set 2 ("Purpose Translator") from the source conversation — a
  // plain lookup table, not a new capability. Falls back to a generic
  // phrase for a custom-typed override.
  var PAGE_PURPOSE_TRANSLATIONS = {
    "Daily Reflection": "help the user slow down and process their day with honesty and clarity",
    "Weekly Planning": "help the user organize the week ahead with a clear, realistic plan",
    "Monthly Review": "help the user step back, review progress, and reset intentions for the month ahead",
    "Goal Setting": "help the user break a bigger goal into clear, achievable steps",
    "Habit Tracking": "help the user build consistency and notice their own patterns over time",
    "Gratitude Practice": "help the user notice and savor the good already present in their life",
    "Memory Keeping": "help the user capture and preserve a meaningful moment before it fades",
    "Creative Exploration": "help the user explore an idea freely, without pressure for it to be perfect",
    "Progress Tracking": "help the user see measurable proof of how far they've come",
    "Emotional Processing": "help the user work through a feeling with structure and self-compassion",
  };

  var LAYOUT_STRUCTURE_OPTIONS = sortAlpha([
    "a structured grid of boxes", "a two-column layout", "a three-column layout", "an open flow layout",
    "a dashboard-style layout", "a timeline layout", "a calendar-style layout", "a card-based layout",
  ]);

  var WRITING_SPACE_OPTIONS = sortAlpha([
    "wide ruled lines", "narrow ruled lines", "dot grid space", "blank open space", "labeled prompt boxes", "reflection cards",
  ]);

  var ART_STYLE_OPTIONS = sortAlpha([
    "watercolor illustration", "hand-drawn sketch", "botanical line art", "ink illustration",
    "flat vector illustration", "minimal line drawing", "vintage engraving", "hand-painted look",
  ]);

  var MOOD_OPTIONS = sortAlpha([
    "motivating", "peaceful", "calming", "joyful", "nostalgic", "elegant", "cozy", "grounded", "reflective", "empowering",
  ]);

  var COLOR_PALETTE_OPTIONS = sortAlpha([
    "sage green and cream", "warm neutrals and taupe", "blush pink and dusty rose", "navy and cream",
    "black and gold", "terracotta and earth tones", "soft pastels", "charcoal and white", "olive and moss",
  ]);

  var BACKGROUND_OPTIONS = sortAlpha([
    "clean white paper", "cream paper", "soft handmade paper texture", "subtle watercolor wash",
    "dot grid paper", "linen texture", "kraft paper", "soft gradient wash",
  ]);

  var DECORATIVE_ELEMENTS_OPTIONS = sortAlpha([
    "small botanical leaves and florals", "delicate stars and celestial accents", "washi-tape-style accents",
    "minimal line borders", "subtle sparkles", "small hand-drawn icons", "soft ribbon accents", "none — keep it clean",
  ]);

  var TYPOGRAPHY_OPTIONS = sortAlpha([
    "elegant modern serif", "modern sans-serif", "classic book typography", "handwritten script",
    "bold minimal", "rustic hand-lettered",
  ]);

  // A deliberate scale, not alphabetical — mirrors Coloring Page's own
  // Page Complexity field.
  var DETAIL_LEVEL_OPTIONS = ["Simple & Clean", "Balanced Detail", "Richly Decorative"];

  var BLANK_PAGE_VARIATION_OPTIONS = ["1", "2", "3", "4", "5"];

  // Same "how many matching-but-distinct designs" mechanism the Ebook
  // Pages generator already proved out — one Blank Page slot in the
  // bundle picker can ask for 1-5 designs in a single sentence instead
  // of needing 5 separate always-shown page-type entries.
  function computeBlankPageTokens(valueMap) {
    var n = parseInt(valueMap.blankPageVariations, 10) || 1;
    return {
      blankPageCountPhrase: n === 1 ? "one BLANK page" : n + " different BLANK pages",
      blankPageVariationNote:
        n === 1
          ? ""
          : " Keep the same overall art style, color palette, and decorative border family across all " +
            n +
            " so they read as one matching set, but vary the border, corner ornament, or accent placement on each one so no two are identical — each is meant to be used as its own separate page, not a repeat of another.",
    };
  }

  var PRESETS = [
    {
      name: "Modern Minimal Budget Reset",
      description: "Financial category, sage + cream, botanical line art.",
      apply: {
        journalCategory: JOURNAL_CATEGORY_OPTIONS[0], pagePurpose: "Monthly Review", layoutStructure: "a structured grid of boxes",
        artStyle: "botanical line art", mood: "motivating", colorPalette: "sage green and cream", backgroundType: "soft handmade paper texture",
        decorativeElements: "small botanical leaves and florals", typography: "elegant modern serif", detailLevel: DETAIL_LEVEL_OPTIONS[1],
      },
    },
    {
      name: "Cozy Wellness Routine",
      description: "Health category, warm neutrals, hand-drawn sketch style.",
      apply: {
        journalCategory: JOURNAL_CATEGORY_OPTIONS[1], pagePurpose: "Habit Tracking", layoutStructure: "a dashboard-style layout",
        artStyle: "hand-drawn sketch", mood: "cozy", colorPalette: "warm neutrals and taupe", backgroundType: "cream paper",
        decorativeElements: "soft ribbon accents", typography: "modern sans-serif", detailLevel: DETAIL_LEVEL_OPTIONS[0],
      },
    },
    {
      name: "Reflective Growth Journal",
      description: "Personal Growth category, muted palette, minimal line art.",
      apply: {
        journalCategory: JOURNAL_CATEGORY_OPTIONS[2], pagePurpose: "Weekly Planning", layoutStructure: "an open flow layout",
        artStyle: "minimal line drawing", mood: "reflective", colorPalette: "charcoal and white", backgroundType: "clean white paper",
        decorativeElements: "minimal line borders", typography: "bold minimal", detailLevel: DETAIL_LEVEL_OPTIONS[0],
      },
    },
    {
      name: "Warm Memory Keeper",
      description: "Relationships category, blush tones, watercolor illustration.",
      apply: {
        journalCategory: JOURNAL_CATEGORY_OPTIONS[3], pagePurpose: "Memory Keeping", layoutStructure: "a card-based layout",
        artStyle: "watercolor illustration", mood: "nostalgic", colorPalette: "blush pink and dusty rose", backgroundType: "soft watercolor wash",
        decorativeElements: "delicate stars and celestial accents", typography: "handwritten script", detailLevel: DETAIL_LEVEL_OPTIONS[2],
      },
    },
    {
      name: "Creative Spark Journal",
      description: "Creativity category, bold color, flat vector illustration.",
      apply: {
        journalCategory: JOURNAL_CATEGORY_OPTIONS[4], pagePurpose: "Creative Exploration", layoutStructure: "an open flow layout",
        artStyle: "flat vector illustration", mood: "joyful", colorPalette: "soft pastels", backgroundType: "clean white paper",
        decorativeElements: "small hand-drawn icons", typography: "modern sans-serif", detailLevel: DETAIL_LEVEL_OPTIONS[1],
      },
    },
  ];

  // Rule Sets 5/6/7/8/9/10 from the source conversation — all fixed
  // boilerplate + token substitution, same LOCKED_SUFFIX-style pattern
  // every other generator in this engine already uses. Written once,
  // appended to every page type's own unique opening below.
  var COMMON_SHARED_BLOCK =
    "\n\nLayout: Create {layoutStructure} page. Writing Space: Provide generous, practical {writingSpace} with enough room for handwriting, and clearly labeled sections with intentional spacing." +
    "\n\nVisual Direction: Style: {artStyle}. Mood: {mood}. Color Palette: {colorPalette}. Background: {backgroundType}." +
    "\n\nDecorative Elements: Include {decorativeElements}, placed intentionally around the page without interfering with usability or reducing writing space." +
    "\n\nTypography: Use {typography} for headings — clear, elegant, and easy to read." +
    "\n\nComposition: Create a premium printable journal page ({detailLevel}) with strong visual hierarchy, balanced whitespace, and a cohesive design system." +
    "\n\nFormat: 8.5 x 11 inch letter-size printable page. High resolution. Clean edges. Professional digital product quality. No mockup. No watermark. No unnecessary text." +
    "\n\nAvoid: crowded layouts, illegible text, excessive decoration, tiny writing spaces, inconsistent typography, random unrelated objects, cluttered composition.";

  function pt(id, label, elements) {
    return {
      id: id,
      label: label,
      promptTemplate:
        "Create a printable {journalCategory} journal page: " + label + ". The purpose of this page is to {purposeTranslation}. Include these functional elements: " + elements + "." +
        COMMON_SHARED_BLOCK,
    };
  }

  // Shared across every category — a cover and a closing page look
  // structurally the same regardless of which journal category they
  // belong to, since {journalCategory} already carries that context.
  var COVER_PAGE_TYPE = pt("cover", "Cover Page", "a bold title area, a strong decorative focal point, and minimal supporting text");
  var CLOSING_PAGE_TYPE = pt(
    "closing", "Closing Reflection Page",
    "a short closing reflection prompt, a space to note one key takeaway, and a simple space to look ahead to what's next"
  );

  // Also shared across every category, but NOT built from pt() — a
  // blank/notes page has no "purpose" or functional elements of its own,
  // just the same decorative border/frame family as the rest of the set,
  // so the usual "Writing Space: {writingSpace}" line from
  // COMMON_SHARED_BLOCK doesn't apply here.
  var BORDER_ONLY_BLOCK =
    "\n\nVisual Direction: Style: {artStyle}. Mood: {mood}. Color Palette: {colorPalette}. Background: {backgroundType}." +
    "\n\nDecorative Elements: Include {decorativeElements} around the border/edges only, matching the rest of this journal's page set, without interfering with the open center of the page." +
    "\n\nTypography: Use {typography} for any heading text — clear, elegant, and easy to read." +
    "\n\nFormat: 8.5 x 11 inch letter-size printable page. High resolution. Clean edges. Professional digital product quality. No mockup. No watermark." +
    "\n\nAvoid: crowded layouts, illegible text, excessive decoration, random unrelated objects, cluttered composition.";

  var BLANK_PAGE_TYPE = {
    id: "blank",
    label: "Blank Page",
    promptTemplate:
      "Create {blankPageCountPhrase} for this {journalCategory} journal set — a page with the same decorative border/frame family as the rest of the set, but with the entire center of the page left completely open and empty for the user's own writing or content. Do not add any placeholder text, lines, or lorem ipsum.{blankPageVariationNote}" +
      BORDER_ONLY_BLOCK,
  };

  var NOTES_PAGE_TYPE = {
    id: "notes",
    label: "Notes Page",
    promptTemplate:
      "Create a NOTES page for this {journalCategory} journal set — matching the same decorative border/frame family as the rest of the set, with a small \"Notes\" heading at the top, and the rest of the page filled edge-to-edge with even, evenly-spaced horizontal ruled lines for handwriting. No other text, no placeholder content, no lorem ipsum." +
      BORDER_ONLY_BLOCK,
  };

  var PAGE_TYPES_LIBRARY = {
    "Financial / Wealth / Budget": {
      pageTypes: [
        COVER_PAGE_TYPE,
        pt("monthly-budget-review", "Monthly Budget Review", "a monthly income summary section, expense reflection boxes, a savings progress tracker, a financial wins section, and an action steps checklist"),
        pt("savings-goal-tracker", "Savings Goal Tracker", "a savings goal amount and target date, a visual progress tracker, a breakdown of contributions, and a motivation/reward notes section"),
        pt("debt-payoff-tracker", "Debt Payoff Tracker", "a list of debts with current balances, a payoff progress tracker, a payment log, and a section for celebrating milestones"),
        pt("money-mindset-reflection", "Money Mindset Reflection", "prompts about beliefs around money, a section on money habits to release, and a section on money habits to build"),
        pt("financial-wins-lessons", "Financial Wins & Lessons", "a section for financial wins this month, a section for lessons learned, and a section for upcoming financial goals"),
        BLANK_PAGE_TYPE,
        NOTES_PAGE_TYPE,
        CLOSING_PAGE_TYPE,
      ],
      defaultPageTypes: ["cover", "monthly-budget-review", "savings-goal-tracker", "closing"],
    },
    "Health / Wellness / Self-Care": {
      pageTypes: [
        COVER_PAGE_TYPE,
        pt("daily-wellness-checkin", "Daily Wellness Check-In", "a mood tracker, an energy level tracker, a water/movement/sleep tracker row, and a short daily reflection prompt"),
        pt("habit-tracker", "Habit Tracker", "a grid of habit rows and day columns, a streak counter, and a weekly reflection prompt"),
        pt("self-care-menu", "Self-Care Menu", "a list of self-care activities to choose from, a space to plan the week's self-care, and a reflection on what helped most"),
        pt("sleep-energy-log", "Sleep & Energy Log", "a nightly sleep tracker, an energy-level rating scale, and a notes section for patterns noticed"),
        pt("weekly-wellness-reflection", "Weekly Wellness Reflection", "a section on wins this week, a section on challenges faced, and a space for one small adjustment to try next week"),
        BLANK_PAGE_TYPE,
        NOTES_PAGE_TYPE,
        CLOSING_PAGE_TYPE,
      ],
      defaultPageTypes: ["cover", "daily-wellness-checkin", "habit-tracker", "closing"],
    },
    "Personal Growth / Identity / Mindset": {
      pageTypes: [
        COVER_PAGE_TYPE,
        pt("values-identity-reflection", "Values & Identity Reflection", "a list of core personal values, a prompt on living in alignment with them, and a prompt on where growth is still needed"),
        pt("confidence-affirmations", "Confidence & Affirmations Page", "a space for personal affirmations, a prompt on a recent moment of pride, and a space to write a note to your future self"),
        pt("future-self-vision", "Future Self Vision Page", "a prompt describing your future self, a section on habits that future self practices, and a section on the first small step toward that"),
        pt("weekly-growth-reflection", "Weekly Growth Reflection", "a prompt on a lesson learned this week, a prompt on a challenge overcome, and a space to set one growth intention for next week"),
        pt("overcoming-challenges", "Overcoming Challenges Page", "a space to describe a current challenge, a prompt on past challenges overcome, and an action-steps checklist for moving forward"),
        BLANK_PAGE_TYPE,
        NOTES_PAGE_TYPE,
        CLOSING_PAGE_TYPE,
      ],
      defaultPageTypes: ["cover", "values-identity-reflection", "weekly-growth-reflection", "closing"],
    },
    "Relationships / Family / Memories": {
      pageTypes: [
        COVER_PAGE_TYPE,
        pt("memory-capture", "Memory Capture Page", "a prompt to describe a specific memory in detail, a space for who was there, and a space for how it felt"),
        pt("gratitude-loved-ones", "Gratitude for Loved Ones", "a list of people to express gratitude for, a prompt on why each person matters, and a space to plan one small gesture of appreciation"),
        pt("family-traditions", "Family Traditions Page", "a prompt describing a family tradition, a space for its history/origin, and a space for how to keep it going"),
        pt("letter-to-loved-one", "Letter to a Loved One", "an open letter-writing space, a prompt on what to say, and a space for a closing thought"),
        pt("milestone-memory-tracker", "Milestone & Memory Tracker", "a timeline-style tracker for milestones, a space for photo/memento notes, and a reflection prompt on the year so far"),
        BLANK_PAGE_TYPE,
        NOTES_PAGE_TYPE,
        CLOSING_PAGE_TYPE,
      ],
      defaultPageTypes: ["cover", "memory-capture", "gratitude-loved-ones", "closing"],
    },
    "Creativity / Hobbies / Expression": {
      pageTypes: [
        COVER_PAGE_TYPE,
        pt("idea-inspiration", "Idea & Inspiration Page", "an open idea-capture space, a mood/inspiration board area, and a section for sources of inspiration"),
        pt("creative-goals-tracker", "Creative Goals Tracker", "a list of creative goals, a progress tracker for each, and a space for obstacles and next steps"),
        pt("project-log", "Project Log Page", "a project name and description section, a progress log, and a materials/resources checklist"),
        pt("mood-board-vision", "Mood Board / Vision Page", "an open visual collage area, a color/theme notes section, and a space for a guiding word or phrase"),
        pt("creative-reflection", "Creative Reflection Page", "a prompt on what was created this week, a prompt on what was learned, and a space for what to try next"),
        BLANK_PAGE_TYPE,
        NOTES_PAGE_TYPE,
        CLOSING_PAGE_TYPE,
      ],
      defaultPageTypes: ["cover", "idea-inspiration", "project-log", "closing"],
    },
  };

  ProductHaus.generatorEngine.registerGenerator({
    id: "journal-pages",
    label: "Journal Page Generator",
    icon: "document",
    description: "Pick a journal category and it offers the right page types for it — a Financial journal offers a Budget Review page, a Wellness journal offers a Habit Tracker, not one generic list for everything.",
    fieldGroupTitle: "Customize Your Journal Pages",

    fields: [
      { name: "journalCategory", label: "Journal Category", options: JOURNAL_CATEGORY_OPTIONS, defaultValue: JOURNAL_CATEGORY_OPTIONS[0] },
      { name: "pagePurpose", label: "Page Purpose", options: PAGE_PURPOSE_OPTIONS, defaultValue: PAGE_PURPOSE_OPTIONS[0] },
      { name: "layoutStructure", label: "Layout Structure", options: LAYOUT_STRUCTURE_OPTIONS, defaultValue: LAYOUT_STRUCTURE_OPTIONS[0] },
      { name: "writingSpace", label: "Writing Space Style", options: WRITING_SPACE_OPTIONS, defaultValue: WRITING_SPACE_OPTIONS[0] },
      { name: "artStyle", label: "Art Style", options: ART_STYLE_OPTIONS, defaultValue: ART_STYLE_OPTIONS[0], aesthetic: "artStyle" },
      { name: "mood", label: "Mood", options: MOOD_OPTIONS, defaultValue: MOOD_OPTIONS[0], aesthetic: "mood" },
      { name: "colorPalette", label: "Color Palette", options: COLOR_PALETTE_OPTIONS, defaultValue: COLOR_PALETTE_OPTIONS[0], aesthetic: "palette" },
      { name: "backgroundType", label: "Background Type", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0], aesthetic: "texture" },
      { name: "decorativeElements", label: "Decorative Elements", options: DECORATIVE_ELEMENTS_OPTIONS, defaultValue: DECORATIVE_ELEMENTS_OPTIONS[0], aesthetic: "motifs" },
      { name: "typography", label: "Typography Style", options: TYPOGRAPHY_OPTIONS, defaultValue: TYPOGRAPHY_OPTIONS[0] },
      { name: "detailLevel", label: "Detail Level", options: DETAIL_LEVEL_OPTIONS, defaultValue: DETAIL_LEVEL_OPTIONS[1] },
      { name: "blankPageVariations", label: "Blank Page Variations (only used if Blank Page is included below)", options: BLANK_PAGE_VARIATION_OPTIONS, defaultValue: BLANK_PAGE_VARIATION_OPTIONS[0] },
    ],

    presets: PRESETS,
    presetsLabel: "Starter Looks — one per category, click one then customize",

    computeExtraTokens: function (valueMap) {
      return Object.assign(
        { purposeTranslation: PAGE_PURPOSE_TRANSLATIONS[valueMap.pagePurpose] || "help the user engage with this part of their journal in a clear, structured way" },
        computeBlankPageTokens(valueMap)
      );
    },

    pageTypesSourceField: "journalCategory",
    pageTypesLibrary: PAGE_TYPES_LIBRARY,
    pageTypesCap: 9,
    pageTypesLabel: "Pages to Include (choices change with Journal Category)",
    bundleBlockTitle: "Your Journal Page Set",
  });
})();
