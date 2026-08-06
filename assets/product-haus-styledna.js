/**
 * The AI Creator's Project Haus — Business/Voice DNA (shared state)
 * Depends on product-haus-util.js (must load first).
 *
 * The marketing equivalent of Prompt Haus's own Style DNA — set once in
 * the dark bar at the top, every mode inherits it automatically. Where
 * Style DNA carries visual consistency (Project Type, Aspect Ratio,
 * Mockup View), Business/Voice DNA carries how things SOUND: Business
 * Name, Tone, Audience, Reading Level — so a Social Post caption and a
 * Sales Page headline built minutes apart still sound like the same
 * business talking to the same person.
 *
 * Holiday/Theme/Niche and Negative Prompt are duplicated from Prompt
 * Haus's own option lists rather than shared, since the two products are
 * genuinely separate purchases — a customer could own only one — and
 * this keeps each fully standalone with no cross-file dependency.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;
  var makeField = ProductHaus.util.makeField;
  var sortAlpha = ProductHaus.util.sortAlpha;

  var TONE_OPTIONS = sortAlpha([
    "warm and encouraging", "bold and confident", "playful and fun",
    "professional and polished", "urgent and direct", "luxurious and elegant",
    "witty and clever", "calm and reassuring", "authoritative and expert",
    "casual and relatable",
  ]);

  var READING_LEVEL_OPTIONS = ["5th grade (very simple)", "general audience", "professional/expert"];

  var VARIATION_COUNT_OPTIONS = ["1", "2", "3", "4"];

  var HOLIDAY_GROUPS = [
    { label: "General", options: ["none"] },
    {
      label: "US Federal & Civic",
      options: [
        "new year's day", "martin luther king jr. day", "presidents' day", "memorial day",
        "juneteenth", "independence day (4th of july)", "labor day",
        "columbus day / indigenous peoples' day", "veterans day", "thanksgiving",
      ],
    },
    { label: "Christian", options: ["christmas", "christmas eve", "easter"] },
    { label: "Jewish", options: ["hanukkah", "passover", "rosh hashanah", "yom kippur"] },
    { label: "Islamic", options: ["ramadan", "eid al-fitr", "eid al-adha"] },
    { label: "Hindu / Dharmic", options: ["diwali", "holi"] },
    { label: "Latin American", options: ["cinco de mayo", "dia de los muertos (day of the dead)"] },
    { label: "East Asian", options: ["lunar new year"] },
    {
      label: "International / Regional",
      options: ["canada day", "bastille day", "boxing day", "oktoberfest", "australia day", "nowruz (persian new year)"],
    },
    {
      label: "Secular / Cultural",
      options: [
        "new year's eve", "valentine's day", "st. patrick's day", "halloween", "mother's day",
        "father's day", "grandparents' day", "pride month", "earth day", "kwanzaa",
      ],
    },
  ];

  var THEME_OPTIONS = sortAlpha([
    "back to school", "graduation", "marriage/wedding/engagement", "parenting",
    "mental health awareness", "self love", "motivational/inspirational",
    "new beginnings", "gratitude", "faith journey", "recovery/sobriety",
    "grief/loss", "empowerment",
  ]);

  var NICHE_OPTIONS = sortAlpha([
    "coffee culture", "wine culture", "work life", "hustle culture", "animal lover",
    "travel/adventure", "aviation/transportation", "gaming culture", "fitness/gym life",
    "bookworm/reading", "gardening", "cooking/foodie", "crafting/diy", "sneakerhead", "car enthusiast",
  ]);

  // "How this gets output" settings, same category as Variations — not
  // tied to any one project-type driver the way Prompt Haus's Aspect
  // Ratio auto-follows Project Type, since Project Haus generators
  // already have their own local size/format fields (Sheet Size, Page
  // Format, etc.) instead of one shared Project Type concept.
  var TARGET_PLATFORM_OPTIONS = sortAlpha([
    "Midjourney", "ChatGPT (GPT Image)", "Kittl", "Ideogram", "OpenArt", "Leonardo AI", "Adobe Firefly", "Flux",
  ]);
  var ASPECT_RATIO_OPTIONS = ["1:1", "4:5", "9:16", "16:9"];

  // Product / Size — a shared field (like Content/Graphics Haus's Project
  // Type). Picking one auto-suggests an aspect ratio and injects a print-
  // readiness clause (DPI / bleed / transparency / seamless) into every
  // generator, since this is a print-product Haus.
  var PROJECT_PRODUCT_OPTIONS = [
    "general / no specific product",
    "greeting card", "invitation", "postcard", "wall art print", "flash card / learning card",
    "journal / notebook page", "planner page", "coloring page (KDP book)",
    "activity / worksheet page", "eBook page",
    "sticker", "sticker sheet", "digital paper / seamless pattern", "tumbler wrap",
  ];
  var PROJECT_PRODUCT_ASPECT = {
    "greeting card": "4:5", "invitation": "4:5", "postcard": "4:5", "wall art print": "4:5",
    "flash card / learning card": "1:1", "journal / notebook page": "4:5", "planner page": "4:5",
    "coloring page (KDP book)": "4:5", "activity / worksheet page": "4:5", "eBook page": "4:5",
    "sticker": "1:1", "sticker sheet": "4:5", "digital paper / seamless pattern": "1:1", "tumbler wrap": "16:9",
  };
  var CUTOUT_PRODUCTS = ["sticker", "sticker sheet"];
  var WRAP_PRODUCTS = ["digital paper / seamless pattern", "tumbler wrap"];
  var KDP_PRODUCTS = ["coloring page (KDP book)", "activity / worksheet page", "eBook page", "journal / notebook page", "planner page"];

  // File-level export setting — independent of any generator's own
  // decorative Background field (a scene/content choice). Default is a
  // deliberate no-op so every existing prompt reads exactly as before
  // until someone actually opens this dropdown.
  var OUTPUT_FORMAT_OPTIONS = ["Default (PNG)", "PNG — Transparent Background", "JPG — Solid Background"];

  var store = ProductHaus.util.createStore({
    businessName: makeField("", [], { isFreeText: true }),
    tone: makeField("", TONE_OPTIONS),
    audience: makeField("", [], { isFreeText: true }),
    readingLevel: makeField("general audience", READING_LEVEL_OPTIONS),
    variationCount: makeField("2", VARIATION_COUNT_OPTIONS),
    projectType: makeField(PROJECT_PRODUCT_OPTIONS[0], PROJECT_PRODUCT_OPTIONS),
    holiday: ProductHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
    theme: makeField("", THEME_OPTIONS),
    niche: makeField("", NICHE_OPTIONS),
    negativePrompt: makeField("", [], { isFreeText: true }),
    targetPlatform: makeField("ChatGPT (GPT Image)", TARGET_PLATFORM_OPTIONS),
    aspectRatio: makeField("1:1", ASPECT_RATIO_OPTIONS),
    outputFormat: makeField(OUTPUT_FORMAT_OPTIONS[0], OUTPUT_FORMAT_OPTIONS),
    addBuffer: true,
  });

  function setBusinessName(value) {
    ProductHaus.util.updateField(store, "businessName", { value: value });
  }
  function setTone(value) {
    ProductHaus.util.updateField(store, "tone", { value: value, customValue: "" });
  }
  function setAudience(value) {
    ProductHaus.util.updateField(store, "audience", { value: value });
  }
  function setReadingLevel(value) {
    ProductHaus.util.updateField(store, "readingLevel", { value: value, customValue: "" });
  }
  function setVariationCount(value) {
    ProductHaus.util.updateField(store, "variationCount", { value: value, customValue: "" });
  }
  // Picking a product auto-suggests its aspect ratio (user can still change it).
  function setProjectType(value) {
    ProductHaus.util.updateField(store, "projectType", { value: value, customValue: "" });
    var suggested = PROJECT_PRODUCT_ASPECT[value];
    if (suggested) ProductHaus.util.updateField(store, "aspectRatio", { value: suggested, customValue: "" });
  }
  // Print-readiness clause injected into every generator's prompt, tailored to
  // the product: cutout -> transparent/die-cut; wrap -> seamless; KDP book ->
  // single-sided + bind margin; other print -> 300 DPI + bleed/safe margin.
  function getProjectTypeClause() {
    var pt = ProductHaus.engine.resolveFieldValue(store.getState().projectType);
    if (!pt || pt.indexOf("general") === 0) return "";
    var readiness;
    if (CUTOUT_PRODUCTS.indexOf(pt) !== -1) {
      readiness = "isolated on a transparent background with a clean die-cut-ready silhouette (no background, no drop shadow), at 300 DPI";
    } else if (WRAP_PRODUCTS.indexOf(pt) !== -1) {
      readiness = "as a seamless, edge-to-edge tileable design with no visible seam where the edges meet, at 300 DPI";
    } else if (KDP_PRODUCTS.indexOf(pt) !== -1) {
      readiness = "single-sided with no bleed-through, a clean inner margin left for binding, at 300 DPI print resolution";
    } else {
      readiness = "at 300 DPI print resolution with a small bleed and safe margin so nothing important sits near the trim edge";
    }
    return " Design this as a " + pt + " — sized and composed appropriately for that product, " + readiness + ".";
  }
  function setHoliday(value) {
    ProductHaus.util.updateField(store, "holiday", { value: value, customValue: "" });
  }
  function setTheme(value) {
    ProductHaus.util.updateField(store, "theme", { value: value, customValue: "" });
  }
  function setNiche(value) {
    ProductHaus.util.updateField(store, "niche", { value: value, customValue: "" });
  }
  function updateNegativePromptField(changes) {
    var state = store.getState();
    store.setState({ negativePrompt: Object.assign({}, state.negativePrompt, changes) });
  }
  function setTargetPlatform(value) {
    ProductHaus.util.updateField(store, "targetPlatform", { value: value, customValue: "" });
  }
  function setAspectRatio(value) {
    ProductHaus.util.updateField(store, "aspectRatio", { value: value, customValue: "" });
  }
  function setAddBuffer(enabled) {
    store.setState({ addBuffer: enabled });
  }

  function setOutputFormat(newValue) {
    ProductHaus.util.updateField(store, "outputFormat", { value: newValue, customValue: "" });
  }

  // Business/Voice entries — folded into every mode's assembler the same
  // way Prompt Haus's Holiday/Theme/Niche/Buffer get folded in, just
  // carrying tone/audience/reading-level instead of visual finishing.
  function getVoiceEntries() {
    var state = store.getState();
    var entries = [];
    if (ProductHaus.engine.resolveFieldValue(state.businessName)) {
      entries.push({ label: "Business", field: state.businessName });
    }
    entries.push({ label: "Tone", field: state.tone });
    if (ProductHaus.engine.resolveFieldValue(state.audience)) {
      entries.push({ label: "Audience", field: state.audience });
    }
    entries.push({ label: "Reading Level", field: state.readingLevel });
    entries.push({ label: "Holiday", field: state.holiday });
    entries.push({ label: "Theme", field: state.theme });
    entries.push({ label: "Niche", field: state.niche });
    return entries;
  }

  // Randomize (Tone/Holiday/Theme/Niche only — Business Name/Audience are
  // free text and never randomized, Reading Level and Variations are
  // output-format settings left alone on Randomize, same treatment as
  // Prompt Haus leaves Target Platform/Variations alone).
  function randomizeContent() {
    var state = store.getState();
    if (state.tone.includeInPrompt !== false) {
      setTone(TONE_OPTIONS[Math.floor(Math.random() * TONE_OPTIONS.length)]);
    }
    if (state.holiday.includeInPrompt !== false) {
      var holidayOptions = state.holiday.options || [];
      if (holidayOptions.length) setHoliday(holidayOptions[Math.floor(Math.random() * holidayOptions.length)]);
    }
    if (state.theme.includeInPrompt !== false) {
      setTheme(THEME_OPTIONS[Math.floor(Math.random() * THEME_OPTIONS.length)]);
    }
    if (state.niche.includeInPrompt !== false) {
      setNiche(NICHE_OPTIONS[Math.floor(Math.random() * NICHE_OPTIONS.length)]);
    }
  }

  // Scoped to Tone/Holiday/Theme/Niche — Business Name/Audience/Reading
  // Level/Variations read as "how this gets output," not "creative
  // content" someone wants cleared out, same reasoning Prompt Haus uses.
  function resetContent() {
    store.setState({
      businessName: makeField("", [], { isFreeText: true }),
      tone: makeField("", TONE_OPTIONS),
      holiday: ProductHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
      theme: makeField("", THEME_OPTIONS),
      niche: makeField("", NICHE_OPTIONS),
      negativePrompt: makeField("", [], { isFreeText: true }),
    });
  }

  ProductHaus.styleDNA = Object.assign({}, store, {
    setBusinessName: setBusinessName,
    setTone: setTone,
    setAudience: setAudience,
    setReadingLevel: setReadingLevel,
    setVariationCount: setVariationCount,
    setProjectType: setProjectType,
    getProjectTypeClause: getProjectTypeClause,
    PROJECT_PRODUCT_OPTIONS: PROJECT_PRODUCT_OPTIONS,
    setHoliday: setHoliday,
    setTheme: setTheme,
    setNiche: setNiche,
    updateNegativePromptField: updateNegativePromptField,
    setTargetPlatform: setTargetPlatform,
    setAspectRatio: setAspectRatio,
    setAddBuffer: setAddBuffer,
    setOutputFormat: setOutputFormat,
    getVoiceEntries: getVoiceEntries,
    randomizeContent: randomizeContent,
    resetContent: resetContent,
  });
})();
