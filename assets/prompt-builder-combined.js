/**
 * The AI Creator's Prompt Haus — Combined ("Social Post") Mode
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js,
 * prompt-builder-character.js, and prompt-builder-text.js.
 *
 * Not a merged prompt — per Section 1 of the build plan, this runs
 * Character's sentence-style assembler and Text's meta-instruction
 * assembler side by side so the two separate AI generations share one
 * style language and actually match when composited in Canva.
 *
 * Reuses the SAME PromptHaus.character/PromptHaus.text singleton stores
 * the standalone Character/Text tabs edit — building a character in the
 * Character tab and switching to Combined shows that same character,
 * ready to pair with text, rather than starting over in a separate copy.
 *
 * Mascot Live Link: when on, Text's assembled prompt gets an extra fixed
 * entry describing the mascot, generated FROM Character's current Style/
 * Identity/Appearance/Styling selections (not Presentation/Extras/
 * Companion — those are scene-level, not "what does the mascot look
 * like") rather than typed manually.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;

  var MASCOT_ALIGNMENT_OPTIONS = sortAlpha(["none", "left of text", "right of text", "above text", "below text"]);
  var MASCOT_ARCHETYPE_OPTIONS = sortAlpha([
    "none", "esports basketball mascot", "esports football mascot", "esports baseball mascot",
    "esports gaming mascot", "cute mascot", "vintage mascot", "chibi mascot", "street mascot",
    "luxury mascot", "nurse mascot", "teacher mascot", "firefighter mascot",
    "realtor/small-business mascot", "military/veteran mascot", "faith-based mascot",
  ]);

  // Groups that describe "what the mascot looks like" — excludes
  // Presentation/Extras/Companion, which are scene-level rather than part
  // of the character's own appearance.
  var MASCOT_DESCRIPTOR_GROUPS = ["style", "humanIdentity", "animalIdentity", "appearance", "styling"];

  function buildInitialState() {
    return {
      mascotLiveLink: true,
      mascotAlignment: makeField("", MASCOT_ALIGNMENT_OPTIONS),
      mascotArchetype: makeField("none", MASCOT_ARCHETYPE_OPTIONS),
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function toggleMascotLiveLink(enabled) {
    store.setState({ mascotLiveLink: enabled });
  }

  function updateField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state[fieldName], changes);
    store.setState(patch);
  }

  // Character's current descriptors, composed into one mascot phrase.
  // Archetype (if chosen) anchors the phrase since its own option text
  // already ends in "mascot" (e.g. "nurse mascot") — appending the word
  // again would be redundant, so it only gets added when no archetype
  // is selected.
  function buildMascotPhrase() {
    var entries = PromptHaus.character
      .getActiveFieldEntries()
      .filter(function (e) {
        return MASCOT_DESCRIPTOR_GROUPS.indexOf(e.groupName) > -1;
      })
      .map(function (e) {
        return { label: e.label, field: e.field };
      });
    var descriptors = PromptHaus.engine.resolveFields(entries).map(function (r) {
      return r.value;
    });
    var archetype = PromptHaus.engine.resolveFieldValue(store.getState().mascotArchetype);

    if (!descriptors.length && !archetype) return "";
    if (archetype) {
      return "paired with a " + archetype + (descriptors.length ? ", " + descriptors.join(", ") : "");
    }
    return "paired with a " + descriptors.join(", ") + " mascot";
  }

  function getMascotExtraEntries() {
    var state = store.getState();
    if (!state.mascotLiveLink) return [];
    var entries = [];
    var phrase = buildMascotPhrase();
    if (phrase) entries.push({ label: "Mascot", field: makeField(phrase) });
    var alignment = PromptHaus.engine.resolveFieldValue(state.mascotAlignment);
    if (alignment) entries.push({ label: "Mascot Position", field: makeField(alignment) });
    return entries;
  }

  function assembleCharacterPrompt() {
    return PromptHaus.character.assemblePrompt();
  }

  function assembleTextPrompt() {
    return PromptHaus.text.assemblePrompt(getMascotExtraEntries());
  }

  function getSelectionsByGroup() {
    var groups = [];
    groups = groups.concat(PromptHaus.character.getSelectionsByGroup());

    var state = store.getState();
    if (state.mascotLiveLink) {
      var mascotItems = [];
      var phrase = buildMascotPhrase();
      if (phrase) mascotItems.push({ label: "Mascot", value: phrase });
      var alignment = PromptHaus.engine.resolveFieldValue(state.mascotAlignment);
      if (alignment) mascotItems.push({ label: "Mascot Position", value: alignment });
      if (mascotItems.length) groups.push({ title: "Mascot Link (Text)", items: mascotItems });
    }

    groups = groups.concat(PromptHaus.text.getSelectionsByGroup());
    return groups;
  }

  // Randomizes/resets both underlying panels plus Combined's own fields —
  // Combined Mode should be usable without first visiting the Character/
  // Text tabs.
  function randomize() {
    PromptHaus.character.randomize();
    PromptHaus.text.randomize();
    var state = store.getState();
    if (state.mascotAlignment.includeInPrompt) {
      var alignOptions = state.mascotAlignment.options || [];
      if (alignOptions.length) {
        updateField("mascotAlignment", {
          value: alignOptions[Math.floor(Math.random() * alignOptions.length)],
          customValue: "",
        });
      }
    }
    if (state.mascotArchetype.includeInPrompt) {
      var archetypeOptions = state.mascotArchetype.options || [];
      if (archetypeOptions.length) {
        updateField("mascotArchetype", {
          value: archetypeOptions[Math.floor(Math.random() * archetypeOptions.length)],
          customValue: "",
        });
      }
    }
  }

  function reset() {
    PromptHaus.character.reset();
    PromptHaus.text.reset();
    store.setState(buildInitialState());
  }

  PromptHaus.combined = Object.assign({}, store, {
    toggleMascotLiveLink: toggleMascotLiveLink,
    updateField: updateField,
    assembleCharacterPrompt: assembleCharacterPrompt,
    assembleTextPrompt: assembleTextPrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    randomize: randomize,
    reset: reset,
  });
})();
