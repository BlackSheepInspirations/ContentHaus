/**
 * The AI Creator's Graphics Haus — Business/Voice DNA (shared state)
 * Depends on graphics-haus-util.js (must load first).
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

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;
  var makeField = GraphicsHaus.util.makeField;
  var sortAlpha = GraphicsHaus.util.sortAlpha;

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
  // Ratio auto-follows Project Type, since Graphics Haus generators
  // already have their own local size/format fields instead of one
  // shared Project Type concept.
  var TARGET_PLATFORM_OPTIONS = sortAlpha([
    "Midjourney", "ChatGPT (GPT Image)", "Kittl", "Ideogram", "OpenArt", "Leonardo AI", "Adobe Firefly", "Flux",
  ]);
  var ASPECT_RATIO_OPTIONS = ["1:1", "4:5", "9:16", "16:9"];

  // File-level export setting — independent of any generator's own
  // decorative Background field (a scene/content choice). Default is a
  // deliberate no-op so every existing prompt reads exactly as before
  // until someone actually opens this dropdown.
  var OUTPUT_FORMAT_OPTIONS = ["Default (PNG)", "PNG — Transparent Background", "JPG — Solid Background"];

  var store = GraphicsHaus.util.createStore({
    businessName: makeField("", [], { isFreeText: true }),
    tone: makeField("", TONE_OPTIONS),
    audience: makeField("", [], { isFreeText: true }),
    readingLevel: makeField("general audience", READING_LEVEL_OPTIONS),
    variationCount: makeField("2", VARIATION_COUNT_OPTIONS),
    holiday: GraphicsHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
    theme: makeField("", THEME_OPTIONS),
    niche: makeField("", NICHE_OPTIONS),
    negativePrompt: makeField("", [], { isFreeText: true }),
    targetPlatform: makeField("ChatGPT (GPT Image)", TARGET_PLATFORM_OPTIONS),
    aspectRatio: makeField("1:1", ASPECT_RATIO_OPTIONS),
    outputFormat: makeField(OUTPUT_FORMAT_OPTIONS[0], OUTPUT_FORMAT_OPTIONS),
    addBuffer: true,
  });

  function setBusinessName(value) {
    GraphicsHaus.util.updateField(store, "businessName", { value: value });
  }
  function setTone(value) {
    GraphicsHaus.util.updateField(store, "tone", { value: value, customValue: "" });
  }
  function setAudience(value) {
    GraphicsHaus.util.updateField(store, "audience", { value: value });
  }
  function setReadingLevel(value) {
    GraphicsHaus.util.updateField(store, "readingLevel", { value: value, customValue: "" });
  }
  function setVariationCount(value) {
    GraphicsHaus.util.updateField(store, "variationCount", { value: value, customValue: "" });
  }
  function setHoliday(value) {
    GraphicsHaus.util.updateField(store, "holiday", { value: value, customValue: "" });
  }
  function setTheme(value) {
    GraphicsHaus.util.updateField(store, "theme", { value: value, customValue: "" });
  }
  function setNiche(value) {
    GraphicsHaus.util.updateField(store, "niche", { value: value, customValue: "" });
  }
  function updateNegativePromptField(changes) {
    var state = store.getState();
    store.setState({ negativePrompt: Object.assign({}, state.negativePrompt, changes) });
  }
  function setTargetPlatform(value) {
    GraphicsHaus.util.updateField(store, "targetPlatform", { value: value, customValue: "" });
  }
  function setAspectRatio(value) {
    GraphicsHaus.util.updateField(store, "aspectRatio", { value: value, customValue: "" });
  }
  function setAddBuffer(enabled) {
    store.setState({ addBuffer: enabled });
  }

  function setOutputFormat(newValue) {
    GraphicsHaus.util.updateField(store, "outputFormat", { value: newValue, customValue: "" });
  }

  // Business/Voice entries — folded into every mode's assembler the same
  // way Prompt Haus's Holiday/Theme/Niche/Buffer get folded in, just
  // carrying tone/audience/reading-level instead of visual finishing.
  function getVoiceEntries() {
    var state = store.getState();
    var entries = [];
    if (GraphicsHaus.engine.resolveFieldValue(state.businessName)) {
      entries.push({ label: "Business", field: state.businessName });
    }
    entries.push({ label: "Tone", field: state.tone });
    if (GraphicsHaus.engine.resolveFieldValue(state.audience)) {
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
      holiday: GraphicsHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
      theme: makeField("", THEME_OPTIONS),
      niche: makeField("", NICHE_OPTIONS),
      negativePrompt: makeField("", [], { isFreeText: true }),
    });
  }

  GraphicsHaus.styleDNA = Object.assign({}, store, {
    setBusinessName: setBusinessName,
    setTone: setTone,
    setAudience: setAudience,
    setReadingLevel: setReadingLevel,
    setVariationCount: setVariationCount,
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
