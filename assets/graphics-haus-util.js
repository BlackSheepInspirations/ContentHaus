/**
 * The AI Creator's Graphics Haus — shared store/field utilities
 * Loaded first. Establishes window.GraphicsHaus and the tiny store/field
 * utilities that every other graphics-haus-*.js module reuses.
 *
 * Direct port of Prompt Haus's own PromptHaus.util — this logic is
 * completely generic (no Prompt-Haus-specific content), so it's ported
 * verbatim under a separate namespace rather than shared, since the two
 * products are genuinely separate gated purchases and shouldn't risk any
 * cross-contamination if both scripts ever loaded on the same page.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  GraphicsHaus.util = GraphicsHaus.util || {};

  // Case-insensitive alphabetical sort, used to display every dropdown's
  // options A-Z regardless of the order they're declared in source.
  GraphicsHaus.util.sortAlpha = function (options) {
    return (options || []).slice().sort(function (a, b) {
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  };

  // Every field in every mode has this shape. `includeInPrompt` defaults to
  // true so Randomize (which only touches included fields) works out of the
  // box; the assembler still skips a field with no resolved value.
  GraphicsHaus.util.makeField = function (value, options, extra) {
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
  // by category beats a flat alphabetical list. `optionGroups` is
  // [{ label, options }] in the curated display order — the UI renders it
  // as native <optgroup> sections. `options` stays a flattened list so
  // resolveFieldValue/randomize/etc. work unchanged.
  GraphicsHaus.util.makeGroupedField = function (value, optionGroups, extra) {
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

  // Randomizes at most `cap` fields from a decorative/optional group
  // instead of every eligible one. Fields with "Include in prompt"
  // unchecked are left completely alone either way; fields that ARE
  // eligible but don't get picked this round are cleared, so the group
  // reads as "only a few things on" rather than accumulating every option
  // over several clicks.
  GraphicsHaus.util.randomizeGroupWithCap = function (entries, cap, applyFn, clearFn) {
    var eligible = entries.filter(function (e) {
      return e.field.includeInPrompt !== false && (e.field.options || []).length > 0;
    });
    var shuffled = eligible.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    var chosenNames = shuffled.slice(0, cap).map(function (e) {
      return e.fieldName;
    });
    eligible.forEach(function (e) {
      if (chosenNames.indexOf(e.fieldName) !== -1) {
        var options = e.field.options;
        applyFn(e.fieldName, { value: options[Math.floor(Math.random() * options.length)], customValue: "" });
      } else {
        clearFn(e.fieldName);
      }
    });
  };

  // Minimal pub/sub store. State updates are shallow-merged at the top
  // level; nested field updates go through util.updateField below.
  GraphicsHaus.util.createStore = function (initialState) {
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

  // Replace one field on a store with a shallow-merged copy.
  GraphicsHaus.util.updateField = function (store, fieldName, changes) {
    var current = store.getState()[fieldName];
    var patch = {};
    patch[fieldName] = Object.assign({}, current, changes);
    store.setState(patch);
  };
})();
