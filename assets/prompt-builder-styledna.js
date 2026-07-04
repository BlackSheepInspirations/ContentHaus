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
  ];

  var ASPECT_RATIO_OPTIONS = ["1:1", "4:5", "9:16", "16:9"];

  var TARGET_PLATFORM_OPTIONS = [
    "Midjourney", "ChatGPT/DALL·E", "Kittl", "Ideogram", "OpenArt",
    "Leonardo AI", "Adobe Firefly", "Flux",
  ];

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

  PromptHaus.styleDNA = Object.assign({}, store, {
    setProjectType: setProjectType,
    setAspectRatioManually: setAspectRatioManually,
    resetAspectRatioToAuto: resetAspectRatioToAuto,
    setTargetPlatform: setTargetPlatform,
    setVariationCount: setVariationCount,
    suggestedAspectRatio: suggestedAspectRatio,
  });
})();
