/**
 * The AI Creator's Prompt Haus — Animals & Creatures Mode
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js,
 * prompt-builder-character.js (reuses its shared creature taxonomy —
 * category/breed/color — plus Character Type/Art Finish/Frame It option
 * lists), and prompt-builder-text.js (reuses its Letter Style/Color
 * Scheme/Text Case/Text Effects lists for Add Text).
 *
 * Distinct from Character Mode's own lightweight Companion field: Companion
 * is always a supporting creature attached to a human/animal character;
 * this mode makes the creature(s) themselves the whole portrait — up to 3
 * independently detailed slots (e.g. "2 dogs and a cat"), no human
 * involved. Category/breed/color are shared state with Companion (single
 * source of truth — see PromptHaus.character.optionLists); everything else
 * here (Gender, up to 3 Colors, Eye Color, Outfit, Props, Accessories,
 * Attitude/Expression, Pose) is this mode's own, deliberately deeper than
 * Companion's lightweight shape.
 *
 * Project Setup bar (Project Type/Aspect Ratio/Target Platform/
 * Variations/Buffer/Negative Prompt) plus its own Concept • Creative
 * Direction box (Holiday/Creative Theme/Niche/Target Audience/Mood) are
 * shared across every mode, same as everywhere else. Imagery gets the
 * full, unfiltered set of all categories, same as every other mode —
 * Faith-Based (a halo/cross for a pet that's passed) and Military &
 * Patriotic (a branch mascot like the Marines' bulldog or a unit's animal
 * emblem) both have genuine standing here, not just Nature/Sci-Fi/Fantasy.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;
  var characterLists = PromptHaus.character.optionLists;
  var textLists = PromptHaus.text.optionLists;

  var CREATURE_SLOT_COUNT = 3;

  // ---------------------------------------------------------------------
  // New option lists (not reused from Character/Companion)
  // ---------------------------------------------------------------------
  var CREATURE_OUTFIT_OPTIONS = sortAlpha([
    "skirt", "sweater", "hoodie", "t-shirt", "raincoat", "tutu dress", "superhero cape",
    "tuxedo", "holiday sweater", "flannel shirt", "denim vest", "party dress", "pajamas",
    "poncho", "life jacket",
  ]);
  var CREATURE_PROPS_OPTIONS = sortAlpha([
    "collar", "crown", "necklace", "bow", "leash", "saddle", "backpack", "flower crown",
    "bandana", "medal", "tiara", "harness",
  ]);
  var CREATURE_ACCESSORIES_OPTIONS = sortAlpha([
    "glasses", "sunglasses", "bracelets", "wristwatch", "headphones", "hat", "ribbon",
    "anklet", "earrings",
  ]);
  var CREATURE_ATTITUDE_OPTIONS = sortAlpha([
    "alert", "calm", "confident", "curious", "fierce", "goofy", "happy", "majestic",
    "mischievous", "playful", "proud", "regal", "shy", "sleepy",
  ]);
  var CREATURE_POSE_OPTIONS = sortAlpha([
    "crouching", "curled up", "flying", "jumping", "lying down", "perched", "playing",
    "pouncing", "running", "sitting", "standing", "stretching", "swimming", "walking",
  ]);

  var CREATURE_FIELD_LABELS = {
    breed: "Breed/Type",
    gender: "Gender",
    color1: "Color 1",
    color2: "Color 2",
    color3: "Color 3",
    eyeColor: "Eye Color",
    outfit: "Outfit",
    props: "Props",
    accessories: "Accessories",
    attitude: "Attitude/Expression",
    pose: "Pose",
  };
  // Randomize cap — Breed/Gender/Color 1/Eye Color/Attitude/Pose stay
  // uncapped (they define what the creature fundamentally is), but
  // Color 2/3, Outfit, Props, and Accessories all turning on together
  // for every one of the 3 slots reads as "maxed out" rather than a
  // focused pick.
  var CREATURE_CAPPED_FIELDS = ["color2", "color3", "outfit", "props", "accessories"];
  var CREATURE_STYLING_RANDOM_CAP = 3;
  var FRAME_IT_LABELS = {
    background: "Background",
    dynamicSceneEffect: "Scene Effect",
    timeEra: "Time / Era",
    cameraAngle: "Camera Angle",
    lightingEffects: "Lighting Effects",
    framing: "Framing",
  };
  var ADD_TEXT_LABELS = {
    text: "Text Content",
    letterStyle: "Letter Style",
    colorScheme: "Color Scheme",
    textCase: "Text Case",
    textEffects: "Text Effects",
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  function buildCreatureSlot() {
    return {
      category: makeField("", characterLists.creatureCategories),
      breed: makeField("", []),
      gender: makeField("", characterLists.animalGender),
      color1: makeField("", characterLists.creatureColors),
      color2: makeField("", characterLists.creatureColors),
      color3: makeField("", characterLists.creatureColors),
      eyeColor: makeField("", characterLists.eyeColor),
      outfit: makeField("", CREATURE_OUTFIT_OPTIONS),
      props: makeField("", CREATURE_PROPS_OPTIONS),
      accessories: makeField("", CREATURE_ACCESSORIES_OPTIONS),
      attitude: makeField("", CREATURE_ATTITUDE_OPTIONS),
      pose: makeField("", CREATURE_POSE_OPTIONS),
    };
  }

  function buildInitialState() {
    var creatures = [];
    for (var i = 0; i < CREATURE_SLOT_COUNT; i++) creatures.push(buildCreatureSlot());
    return {
      creatures: creatures,
      style: {
        characterType: PromptHaus.util.makeGroupedField("", characterLists.characterTypeGroups),
        artFinish: PromptHaus.util.makeGroupedField("", characterLists.artFinishGroups),
      },
      frameIt: {
        background: PromptHaus.util.makeGroupedField("", characterLists.backgroundGroups),
        dynamicSceneEffect: makeField("", characterLists.dynamicSceneEffect),
        // Time/Era + Camera Angle default empty (opt-in) so existing prompts
        // don't change — matches the other presentation modes' field set.
        timeEra: makeField("", characterLists.timeEra),
        cameraAngle: makeField("", characterLists.cameraAngle),
        lightingEffects: makeField("studio lighting", characterLists.lightingEffects),
        framing: PromptHaus.util.makeGroupedField("no frame", characterLists.framingGroups),
      },
      addText: {
        include: false,
        text: makeField("", [], { isFreeText: true }),
        letterStyle: makeField("", textLists.letterStyle),
        colorScheme: PromptHaus.util.makeGroupedField("", textLists.colorSchemeGroups),
        textCase: makeField("", textLists.textCase),
        textEffects: PromptHaus.util.makeGroupedField("", textLists.textEffectsGroups),
      },
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  // Switching a creature's category swaps in that category's own Breed
  // options and clears the rest of the slot — same reasoning as
  // Transportation's category cascade in Graphics Mode: a color/outfit/
  // attitude combination chosen for "Fish" shouldn't linger once the slot
  // becomes "Dragon."
  function updateCreatureCategory(index, changes) {
    var state = store.getState();
    var creature = state.creatures[index];
    var nextCategory = Object.assign({}, creature.category, changes);
    var breedOptions = characterLists.creatureBreedsByCategory[nextCategory.value] || [];
    var nextCreatures = state.creatures.slice();
    var nextSlot = buildCreatureSlot();
    nextSlot.category = nextCategory;
    nextSlot.breed = makeField("", breedOptions);
    nextCreatures[index] = nextSlot;
    store.setState({ creatures: nextCreatures });
  }

  function updateCreatureField(index, fieldName, changes) {
    var state = store.getState();
    var creature = state.creatures[index];
    var patch = {};
    patch[fieldName] = Object.assign({}, creature[fieldName], changes);
    var nextCreatures = state.creatures.slice();
    nextCreatures[index] = Object.assign({}, creature, patch);
    store.setState({ creatures: nextCreatures });
  }

  function getCreatureFieldEntries(index) {
    var creature = store.getState().creatures[index];
    return Object.keys(CREATURE_FIELD_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: CREATURE_FIELD_LABELS[fieldName], field: creature[fieldName] };
    });
  }

  function updateStyleField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.style[fieldName], changes);
    store.setState({ style: Object.assign({}, state.style, patch) });
  }

  function getStyleEntries() {
    var style = store.getState().style;
    return [
      { fieldName: "characterType", label: "Character Type", field: style.characterType },
      { fieldName: "artFinish", label: "Art Finish", field: style.artFinish },
    ];
  }

  function updateFrameItField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.frameIt[fieldName], changes);
    store.setState({ frameIt: Object.assign({}, state.frameIt, patch) });
  }

  function getFrameItEntries() {
    var frameIt = store.getState().frameIt;
    return Object.keys(FRAME_IT_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: FRAME_IT_LABELS[fieldName], field: frameIt[fieldName] };
    });
  }

  function toggleAddTextInclude(include) {
    var state = store.getState();
    store.setState({ addText: Object.assign({}, state.addText, { include: include }) });
  }

  function updateAddTextField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.addText[fieldName], changes);
    store.setState({ addText: Object.assign({}, state.addText, patch) });
  }

  function getAddTextStyleEntries() {
    var addText = store.getState().addText;
    return Object.keys(ADD_TEXT_LABELS)
      .filter(function (fieldName) {
        return fieldName !== "text";
      })
      .map(function (fieldName) {
        return { fieldName: fieldName, label: ADD_TEXT_LABELS[fieldName], field: addText[fieldName] };
      });
  }

  // Letter Style/Color Scheme/Text Effects contribute a full descriptive
  // paragraph to the assembled prompt, not their short dropdown label —
  // used only here at assembly time, never by the UI renderer (which
  // reads getAddTextStyleEntries() directly and needs the short label).
  var TEXT_PARAGRAPH_LOOKUP_BY_FIELD = {
    letterStyle: textLists.letterStylePrompts,
    colorScheme: textLists.colorSchemePrompts,
    textEffects: textLists.textEffectsPrompts,
  };
  function withTextParagraphLookup(e) {
    var lookup = TEXT_PARAGRAPH_LOOKUP_BY_FIELD[e.fieldName];
    if (!lookup) return { label: e.label, field: e.field };
    var field = PromptHaus.engine.withPromptLookup(e.field, lookup);
    // Letter Style's paragraphs carry a literal "<product type>" token
    // meant to be filled in dynamically, not shipped verbatim.
    if (e.fieldName === "letterStyle" && field.value && field.value.indexOf("<product type>") !== -1) {
      field = Object.assign({}, field, { value: field.value.split("<product type>").join(PromptHaus.styleDNA.getProjectTypeValue()) });
    }
    return { label: e.label, field: field };
  }

  // Composes the typed text + its own styling into one descriptive clause,
  // same pattern as Reference/Text Mode's own Add Text.
  function buildTextClause() {
    var addText = store.getState().addText;
    if (!addText.include) return "";
    var text = (addText.text.value || "").trim();
    if (!text) return "";
    var descriptors = PromptHaus.engine.resolveFields(
      getAddTextStyleEntries().map(withTextParagraphLookup)
    ).map(function (r) {
      return r.value;
    });
    var clause = 'the text "' + text + '"';
    if (descriptors.length) clause += " styled as " + descriptors.join(", ");
    return clause;
  }

  function toEntry(e) {
    return { label: e.label, field: e.field };
  }

  // Shared, non-creature-specific descriptors — everything every mode
  // mixes in, including the Concept • Creative Direction set (Holiday/
  // Creative Theme/Niche/Target Audience/Mood), same as everywhere else.
  function getSharedEntries() {
    var entries = getStyleEntries()
      .filter(function (e) { return e.fieldName !== "characterType" && e.fieldName !== "artFinish"; })
      .map(toEntry)
      .concat(getFrameItEntries().map(toEntry));
    entries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    entries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    entries.push({ label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme });
    entries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    entries.push({ label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience });
    entries.push({ label: "Mood", field: PromptHaus.styleDNA.getState().mood });
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("animals");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);
    return entries;
  }

  // Same multi-subject shape as Couples Mode's Character A/B — each
  // creature is a full independent subject in the same scene, not a
  // trailing descriptor, so it gets its own "Creature N: a ..." sentence.
  //
  // Character Type/Art Finish carry a full descriptive paragraph (chunk 3)
  // rather than a short word — previously they rode inside getSharedEntries
  // and landed as one trailing sentence AFTER every creature is already
  // described. Pulled into their own intro sentences instead, mirroring
  // Character Mode's Illustration Style/Art Finish placement, so the style
  // is established before any creature is described.
  function assemblePrompt() {
    var creatures = store.getState().creatures;

    var styleEntries = getStyleEntries().filter(function (e) { return e.fieldName === "characterType" || e.fieldName === "artFinish"; });
    var characterTypeEntry = styleEntries.filter(function (e) { return e.fieldName === "characterType"; })[0];
    var artFinishEntry = styleEntries.filter(function (e) { return e.fieldName === "artFinish"; })[0];
    var illustrationStyleText = characterTypeEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(characterTypeEntry.field, characterLists.characterTypePrompts))
      : "";
    var artFinishText = artFinishEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(artFinishEntry.field, characterLists.artFinishPrompts))
      : "";

    var parts = [];
    parts.push("Create a clean, professional portrait featuring the following animal(s)/creature(s).");
    if (illustrationStyleText) parts.push("Illustration style: " + illustrationStyleText);
    if (artFinishText) parts.push("Art finish: " + artFinishText);

    var allResolved = [];
    var fragments = [];
    if (illustrationStyleText) { allResolved.push({ label: "Illustration Style", value: illustrationStyleText }); fragments.push(illustrationStyleText); }
    if (artFinishText) { allResolved.push({ label: "Art Finish", value: artFinishText }); fragments.push(artFinishText); }
    creatures.forEach(function (creature, i) {
      var resolved = PromptHaus.engine.resolveFields(getCreatureFieldEntries(i).map(toEntry));
      if (!resolved.length) return;
      parts.push("Creature " + (i + 1) + ": a " + resolved.map(function (r) { return r.value; }).join(", ") + ".");
      resolved.forEach(function (r) {
        allResolved.push({ label: "Creature " + (i + 1) + " — " + r.label, value: r.value });
        fragments.push(r.value);
      });
    });

    var textClause = buildTextClause();
    if (textClause) {
      parts.push("Include " + textClause + ".");
      allResolved.push({ label: "Text", value: textClause });
      fragments.push(textClause);
    }

    var sharedResolved = PromptHaus.engine.resolveFields(getSharedEntries());
    if (sharedResolved.length) {
      parts.push(sharedResolved.map(function (r) { return r.value; }).join(", ") + ".");
      allResolved = allResolved.concat(sharedResolved);
      fragments = fragments.concat(sharedResolved.map(function (r) { return r.value; }));
    }

    var text = parts.filter(Boolean).join(" ");
    return { text: text, fragments: fragments, resolved: allResolved };
  }

  function getSelectionsByGroup() {
    var groups = [];

    store.getState().creatures.forEach(function (creature, i) {
      var resolved = PromptHaus.engine.resolveFields(getCreatureFieldEntries(i).map(toEntry));
      if (resolved.length) groups.push({ title: "Creature " + (i + 1), items: resolved });
    });

    var styleResolved = PromptHaus.engine.resolveFields(getStyleEntries().map(toEntry));
    if (styleResolved.length) groups.push({ title: "Style", items: styleResolved });

    var frameResolved = PromptHaus.engine.resolveFields(getFrameItEntries().map(toEntry));
    if (frameResolved.length) groups.push({ title: "Frame It", items: frameResolved });

    var textClause = buildTextClause();
    if (textClause) groups.push({ title: "Text", items: [{ label: "Text", value: textClause }] });

    var conceptFilterResolved = PromptHaus.engine.resolveFields([
      { label: "Holiday", field: PromptHaus.styleDNA.getState().holiday },
      { label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience },
      { label: "Mood", field: PromptHaus.styleDNA.getState().mood },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ]);
    if (conceptFilterResolved.length) groups.push({ title: "Concept & Filter", items: conceptFilterResolved });

    var imageryEntries = PromptHaus.styleDNA.getImageryEntries();
    if (imageryEntries.length) {
      groups.push({
        title: "Imagery & Scene Elements",
        items: imageryEntries.map(function (e) {
          return { label: e.label, value: e.field.value };
        }),
      });
    }

    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) groups.push({ title: "Image Buffer/Padding", items: [{ label: bufferEntry.label, value: bufferEntry.field.value }] });

    return groups;
  }

  function randomizeFieldList(entries, updateFn) {
    entries.forEach(function (e) {
      if (!e.field.includeInPrompt) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      updateFn(e.fieldName, { value: randomValue, customValue: "" });
    });
  }

  // Category is re-rolled first (like Transportation's own randomize),
  // then the rest of that slot's fields are read fresh — options for
  // Breed only exist once Category has actually been set, so re-reading
  // AFTER the category update (rather than snapshotting entries up front)
  // is what makes Breed actually get a matching random value.
  function randomizeCreatureSlot(index) {
    var categories = characterLists.creatureCategories;
    updateCreatureCategory(index, {
      value: categories[Math.floor(Math.random() * categories.length)],
      customValue: "",
    });
    var entries = getCreatureFieldEntries(index);
    randomizeFieldList(
      entries.filter(function (e) { return CREATURE_CAPPED_FIELDS.indexOf(e.fieldName) === -1; }),
      function (fieldName, changes) { updateCreatureField(index, fieldName, changes); }
    );
    PromptHaus.util.randomizeGroupWithCap(
      entries.filter(function (e) { return CREATURE_CAPPED_FIELDS.indexOf(e.fieldName) !== -1; }),
      CREATURE_STYLING_RANDOM_CAP,
      function (fieldName, changes) { updateCreatureField(index, fieldName, changes); },
      function (fieldName) { updateCreatureField(index, fieldName, { value: "", customValue: "" }); }
    );
  }

  function randomize() {
    store.getState().creatures.forEach(function (_, i) {
      randomizeCreatureSlot(i);
    });
    randomizeFieldList(getStyleEntries(), updateStyleField);
    randomizeFieldList(getFrameItEntries(), updateFrameItField);
    if (store.getState().addText.include) {
      randomizeFieldList(getAddTextStyleEntries(), updateAddTextField);
    }
    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState());
    PromptHaus.styleDNA.resetContent();
  }

  PromptHaus.animals = Object.assign({}, store, {
    CREATURE_SLOT_COUNT: CREATURE_SLOT_COUNT,
    updateCreatureCategory: updateCreatureCategory,
    updateCreatureField: updateCreatureField,
    getCreatureFieldEntries: getCreatureFieldEntries,
    updateStyleField: updateStyleField,
    getStyleEntries: getStyleEntries,
    updateFrameItField: updateFrameItField,
    getFrameItEntries: getFrameItEntries,
    toggleAddTextInclude: toggleAddTextInclude,
    updateAddTextField: updateAddTextField,
    getAddTextStyleEntries: getAddTextStyleEntries,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    randomize: randomize,
    reset: reset,
    labels: {
      creature: CREATURE_FIELD_LABELS,
      frameIt: FRAME_IT_LABELS,
      addText: ADD_TEXT_LABELS,
    },
    optionLists: {
      creatureOutfit: CREATURE_OUTFIT_OPTIONS,
      creatureProps: CREATURE_PROPS_OPTIONS,
      creatureAccessories: CREATURE_ACCESSORIES_OPTIONS,
      creatureAttitude: CREATURE_ATTITUDE_OPTIONS,
      creaturePose: CREATURE_POSE_OPTIONS,
    },
  });
})();
