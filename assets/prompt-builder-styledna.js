/**
 * The AI Creator's Prompt Haus — Style DNA (shared state)
 * Loaded first. Establishes window.PromptHaus and the tiny store/field
 * utilities that every other prompt-builder-*.js module reuses.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;

  // ---------------------------------------------------------------------
  // Shared utilities (reused by character/text/couples modules)
  // ---------------------------------------------------------------------
  PromptHaus.util = PromptHaus.util || {};

  // Case-insensitive alphabetical sort, used to display every dropdown's
  // options A-Z regardless of the order they're declared in source (source
  // order stays whatever's easiest to diff against the build plan).
  PromptHaus.util.sortAlpha = function (options) {
    return (options || []).slice().sort(function (a, b) {
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  };

  // Every field in every mode has this shape. `includeInPrompt` defaults to
  // true so Randomize (which only touches included fields) works out of the
  // box; the assembler still skips a field with no resolved value.
  PromptHaus.util.makeField = function (value, options, extra) {
    return Object.assign(
      {
        value: value || "",
        customValue: "",
        includeInPrompt: true,
        options: options || [],
      },
      extra || {}
    );
  };

  // Same field shape, but for dropdowns long/varied enough that browsing
  // by category beats a flat alphabetical list (e.g. Character Type's 50+
  // options). `optionGroups` is [{ label, options }] in the curated display
  // order — the UI renders it as native <optgroup> sections. `options`
  // stays a flattened list so resolveFieldValue/randomize/etc. work
  // unchanged; they don't need to know a field is grouped.
  PromptHaus.util.makeGroupedField = function (value, optionGroups, extra) {
    var flatOptions = [];
    (optionGroups || []).forEach(function (group) {
      flatOptions = flatOptions.concat(group.options);
    });
    return Object.assign(
      {
        value: value || "",
        customValue: "",
        includeInPrompt: true,
        options: flatOptions,
        optionGroups: optionGroups || [],
      },
      extra || {}
    );
  };

  // Minimal pub/sub store. State updates are shallow-merged at the top
  // level; nested field updates go through util.updateField below.
  PromptHaus.util.createStore = function (initialState) {
    var state = initialState;
    var listeners = [];

    return {
      getState: function () {
        return state;
      },
      setState: function (patch) {
        state = Object.assign(
          {},
          state,
          typeof patch === "function" ? patch(state) : patch
        );
        listeners.forEach(function (fn) {
          fn(state);
        });
      },
      subscribe: function (fn) {
        listeners.push(fn);
        return function unsubscribe() {
          listeners = listeners.filter(function (l) {
            return l !== fn;
          });
        };
      },
    };
  };

  // Replace one field on a store with a shallow-merged copy, e.g.
  // updateField(store, 'projectType', { value: 'hoodie graphic' })
  PromptHaus.util.updateField = function (store, fieldName, changes) {
    var current = store.getState()[fieldName];
    var patch = {};
    patch[fieldName] = Object.assign({}, current, changes);
    store.setState(patch);
  };

  // ---------------------------------------------------------------------
  // Style DNA — Project Type, Aspect Ratio (auto-suggested), Target Platform
  // ---------------------------------------------------------------------
  var PROJECT_TYPE_OPTIONS = [
    "t-shirt design", "hoodie graphic", "varsity jacket design", "tote bag graphic",
    "beauty packaging", "candle label", "snack packaging", "skincare label",
    "cosmetic branding", "lock screen text", "pinterest pin", "tiktok cover",
    "sticker pack", "cricut design", "sublimation graphic", "planner stickers",
    "logotype", "album cover text", "movie poster", "clip art",
    // new — ad/marketing/product-photography formats, for Graphics Mode's
    // standalone-graphic and commercial use cases (not just POD products)
    "instagram ad", "facebook ad", "tiktok ad graphic", "pinterest ad",
    "product photography/mockup (etsy/shopify listing)", "flyer", "print banner",
    "email graphic", "billboard ad", "background/wallpaper (no character, no text)",
  ];

  var ASPECT_RATIO_OPTIONS = ["1:1", "4:5", "9:16", "16:9"];

  var TARGET_PLATFORM_OPTIONS = [
    "Midjourney", "ChatGPT/DALL·E", "Kittl", "Ideogram", "OpenArt",
    "Leonardo AI", "Adobe Firefly", "Flux",
  ];

  // Holiday Theme — shared across every mode (a holiday theme applies just
  // as much to Text lettering or a Couples scene as to a Character
  // portrait), so it lives here rather than duplicated per mode. Grouped
  // like Character Type: 40 items browses better by category than as one
  // flat wall. Spans US federal/civic + religious/cultural observances
  // rather than skewing toward any single one.
  var HOLIDAY_GROUPS = [
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
        "father's day", "pride month", "earth day", "kwanzaa",
      ],
    },
  ];

  // Imagery — shared across every mode, same rationale as Holiday Theme:
  // a cross worked into the background or a dragonfly perched on a sleeve
  // applies just as much to a Text lettering design as a Character
  // portrait. Grouped like Character Type/Holiday: browses better by
  // category than as one flat wall. Faith-Based stays deliberately
  // multi-tradition (not skewed to one religion); Holiday imagery is kept
  // distinct from Holiday Theme above — Theme sets the overall mood/season,
  // this is a literal object/symbol integrated into the image, so e.g.
  // "menorah" only lives here, not duplicated in both.
  var IMAGERY_GROUPS = [
    {
      label: "Faith-Based",
      options: PromptHaus.util.sortAlpha([
        "cross", "dove", "praying hands", "jesus (good shepherd)", "angel wings", "halo",
        "open bible", "rosary", "star of david", "hamsa", "mosque silhouette",
        "crescent moon and star", "prayer beads (misbaha)", "om symbol", "buddha statue",
        "prayer wheel", "diya (oil lamp)", "guardian angel", "yin yang",
      ]),
    },
    {
      label: "Holiday",
      options: PromptHaus.util.sortAlpha([
        "christmas tree", "nativity scene", "santa claus", "rudolph the reindeer", "candy cane",
        "stocking", "gingerbread man", "snowman", "holly and mistletoe", "wreath", "ornament",
        "menorah", "dreidel", "kwanzaa kinara (candles)", "easter bunny", "easter eggs",
        "empty tomb", "easter lily", "cupid", "rose bouquet", "heart", "leprechaun",
        "four-leaf clover", "pot of gold", "jack-o'-lantern", "witch hat", "bat", "ghost",
        "turkey", "cornucopia", "diwali rangoli pattern", "red lantern (lunar new year)",
        "dragon (lunar new year)", "sugar skull", "marigold flowers",
      ]),
    },
    {
      label: "Nature",
      options: PromptHaus.util.sortAlpha([
        "pine tree", "oak tree", "palm tree", "willow tree", "cherry blossom tree",
        "autumn maple tree", "rose", "sunflower", "daisy", "lotus flower", "tulip", "peony",
        "hibiscus flower", "wildflower bouquet", "dragonfly", "butterfly", "ladybug", "bee",
        "firefly", "sun", "full moon", "stars", "rainbow", "northern lights", "mountain range",
        "ocean wave", "waterfall", "snowflake",
      ]),
    },
  ];
  var IMAGERY_SLOT_NAMES = ["slot1", "slot2", "slot3"];
  var IMAGERY_SLOT_LABELS = { slot1: "Imagery 1", slot2: "Imagery 2", slot3: "Imagery 3" };

  // Sensible default mapping used for the aspect-ratio auto-suggest.
  // Square-ish print goods -> 1:1, packaging/labels & portrait social -> 4:5,
  // phone-native vertical formats -> 9:16. Adjustable later; nothing in the
  // build plan mandates an exact table, this just has to be a reasonable
  // default that "auto" can fall back to.
  var PROJECT_TYPE_TO_ASPECT_RATIO = {
    "t-shirt design": "1:1",
    "hoodie graphic": "1:1",
    "varsity jacket design": "1:1",
    "tote bag graphic": "1:1",
    "beauty packaging": "4:5",
    "candle label": "1:1",
    "snack packaging": "4:5",
    "skincare label": "4:5",
    "cosmetic branding": "4:5",
    "lock screen text": "9:16",
    "pinterest pin": "4:5",
    "tiktok cover": "9:16",
    "sticker pack": "1:1",
    "cricut design": "1:1",
    "sublimation graphic": "1:1",
    "planner stickers": "1:1",
    "logotype": "1:1",
    "album cover text": "1:1",
    "movie poster": "4:5",
    "clip art": "1:1",
    "instagram ad": "4:5",
    "facebook ad": "1:1",
    "tiktok ad graphic": "9:16",
    "pinterest ad": "4:5",
    "product photography/mockup (etsy/shopify listing)": "1:1",
    "flyer": "4:5",
    "print banner": "16:9",
    "email graphic": "16:9",
    "billboard ad": "16:9",
    "background/wallpaper (no character, no text)": "9:16",
  };
  var DEFAULT_ASPECT_RATIO = "4:5";

  function suggestedAspectRatio(projectType) {
    return PROJECT_TYPE_TO_ASPECT_RATIO[projectType] || DEFAULT_ASPECT_RATIO;
  }

  var store = PromptHaus.util.createStore({
    projectType: PromptHaus.util.makeField(
      "t-shirt design",
      PromptHaus.util.sortAlpha(PROJECT_TYPE_OPTIONS),
      { affectsAspectRatio: true }
    ),
    // `auto: true` means aspectRatio.value follows projectType automatically.
    // It flips to false the moment the shopper picks a ratio manually, and
    // the UI can call resetAspectRatioToAuto() to re-link it. Left in its
    // declared 1:1 -> 16:9 order rather than alphabetized — these are
    // ratios, not words, and that order is the one that reads sensibly.
    aspectRatio: PromptHaus.util.makeField(
      suggestedAspectRatio("t-shirt design"),
      ASPECT_RATIO_OPTIONS,
      { auto: true }
    ),
    targetPlatform: PromptHaus.util.makeField("", PromptHaus.util.sortAlpha(TARGET_PLATFORM_OPTIONS)),
    // Shared across every mode (Character/Text/Couples/Combined) — how many
    // AI-generated variations the assembled prompt asks for.
    variationCount: PromptHaus.util.makeField("4", ["1", "2", "3", "4"]),
    holiday: PromptHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
    // Shared across every mode — a plain boolean, not a dropdown field,
    // since it's just a yes/no checkbox ("add a buffer/padding around the
    // image so nothing gets cropped at the edges").
    addBuffer: false,
    // 3 independent slots rather than one multi-select box — same "combine
    // by filling more than one slot" pattern as Graphics Mode's What Is It
    // section, so someone can layer e.g. a cross + a dove + the sun without
    // a new checkbox-list UI paradigm.
    imagery: {
      slot1: PromptHaus.util.makeGroupedField("", IMAGERY_GROUPS, { quantity: 1 }),
      slot2: PromptHaus.util.makeGroupedField("", IMAGERY_GROUPS, { quantity: 1 }),
      slot3: PromptHaus.util.makeGroupedField("", IMAGERY_GROUPS, { quantity: 1 }),
    },
  });

  function setProjectType(newValue) {
    var state = store.getState();
    var patch = {
      projectType: Object.assign({}, state.projectType, { value: newValue }),
    };
    if (state.aspectRatio.auto) {
      patch.aspectRatio = Object.assign({}, state.aspectRatio, {
        value: suggestedAspectRatio(newValue),
      });
    }
    store.setState(patch);
  }

  function setAspectRatioManually(newValue) {
    var state = store.getState();
    store.setState({
      aspectRatio: Object.assign({}, state.aspectRatio, {
        value: newValue,
        auto: false,
      }),
    });
  }

  function resetAspectRatioToAuto() {
    var state = store.getState();
    store.setState({
      aspectRatio: Object.assign({}, state.aspectRatio, {
        auto: true,
        value: suggestedAspectRatio(state.projectType.value),
      }),
    });
  }

  function setTargetPlatform(newValue) {
    PromptHaus.util.updateField(store, "targetPlatform", { value: newValue });
  }

  function setVariationCount(newValue) {
    PromptHaus.util.updateField(store, "variationCount", { value: newValue });
  }

  function setHoliday(newValue) {
    PromptHaus.util.updateField(store, "holiday", { value: newValue });
  }

  function setAddBuffer(enabled) {
    store.setState({ addBuffer: enabled });
  }

  // Shared synthetic entry every mode's assembler mixes into its own field
  // list (same treatment as Holiday Theme) — null when unchecked, so it
  // resolves to nothing rather than a literal "false" appearing anywhere.
  function getBufferEntry() {
    if (!store.getState().addBuffer) return null;
    return {
      label: "Buffer/Padding",
      field: PromptHaus.util.makeField("buffer of empty space around the edges so nothing gets cropped at the borders"),
    };
  }

  function updateImagerySlot(slotName, changes) {
    var state = store.getState();
    var patch = {};
    patch[slotName] = Object.assign({}, state.imagery[slotName], changes);
    store.setState({ imagery: Object.assign({}, state.imagery, patch) });
  }

  function setImageryQuantity(slotName, quantity) {
    updateImagerySlot(slotName, { quantity: Math.max(1, quantity || 1) });
  }

  // [{ fieldName, label, field }] for each slot — used by the shared UI
  // renderer and by randomize().
  function getImagerySlotEntries() {
    var imagery = store.getState().imagery;
    return IMAGERY_SLOT_NAMES.map(function (slotName) {
      return { fieldName: slotName, label: IMAGERY_SLOT_LABELS[slotName], field: imagery[slotName] };
    });
  }

  // A quantity > 1 prefixes the resolved value ("3x dragonflies") rather
  // than attempting real pluralization, matching Graphics Mode's What Is
  // It fields — same mix of already-singular/plural option phrases.
  function composeImagerySlotEntry(entry) {
    var resolved = PromptHaus.engine.resolveFieldValue(entry.field);
    if (!resolved) return null;
    var qty = entry.field.quantity || 1;
    var text = qty > 1 ? qty + "x " + resolved : resolved;
    return { label: "Imagery", field: PromptHaus.util.makeField(text) };
  }

  // Every mode's assembler mixes these in (same treatment as Holiday
  // Theme/Buffer) — empty slots simply don't contribute an entry.
  function getImageryEntries() {
    var entries = [];
    getImagerySlotEntries().forEach(function (entry) {
      var composed = composeImagerySlotEntry(entry);
      if (composed) entries.push(composed);
    });
    return entries;
  }

  PromptHaus.styleDNA = Object.assign({}, store, {
    setProjectType: setProjectType,
    setAspectRatioManually: setAspectRatioManually,
    resetAspectRatioToAuto: resetAspectRatioToAuto,
    setTargetPlatform: setTargetPlatform,
    setVariationCount: setVariationCount,
    setHoliday: setHoliday,
    setAddBuffer: setAddBuffer,
    getBufferEntry: getBufferEntry,
    updateImagerySlot: updateImagerySlot,
    setImageryQuantity: setImageryQuantity,
    getImagerySlotEntries: getImagerySlotEntries,
    getImageryEntries: getImageryEntries,
    suggestedAspectRatio: suggestedAspectRatio,
  });
})();
