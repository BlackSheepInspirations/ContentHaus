/**
 * The AI Creator's Prompt Haus — Couples Mode
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js, and
 * prompt-builder-character.js (reuses its option lists and labels — see
 * PromptHaus.character.optionLists/labels — rather than duplicating them).
 *
 * Same-type pairing only (Human+Human or Mascot+Mascot) — one shared Base
 * Type toggle for the couple, per the build plan; Human+mascot pairing is
 * handled via Character Mode's existing Companion field, not here.
 *
 * Scene-level fields (Character Type, Art Finish, Background, Dynamic
 * Scene Effect, Time/Era, Camera Angle, Lighting Effects, Framing, Extras)
 * live once in Couple Dynamic rather than duplicated per person — the two
 * people are in ONE scene together, so letting them pick contradictory
 * scenes (e.g. different time eras) wouldn't make sense. This extends the
 * build plan's explicit reasoning for why Cartoon Type/Background/Pose
 * were moved into Couple Dynamic to every other scene-level field, not
 * just those three.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;
  var lists = PromptHaus.character.optionLists;
  var charLabels = PromptHaus.character.labels;

  // ---------------------------------------------------------------------
  // Couple Dynamic — new option lists (Section 3 of the build plan)
  // ---------------------------------------------------------------------
  var RELATIONSHIP_VIBE_OPTIONS = sortAlpha([
    "none", "best friends", "rivals", "in love", "siblings", "parent and child",
    "guardian and child", "older sibling and younger sibling", "mentor and student",
    "caretaker and child",
  ]);
  var POSE_INTERACTION_OPTIONS = sortAlpha([
    "holding hands", "back-to-back", "playful shove", "gazing at each other", "facing away",
    "side by side", "kissing on the lips", "kiss on cheek", "forehead kiss", "hugging",
    "wedding proposal", "dancing",
  ]);
  var COORDINATION_STYLE_OPTIONS = sortAlpha([
    "coordinated colors", "complementary outfits", "matching accessories",
    "contrasting styles", "one glam one casual", "one soft one edgy",
  ]);

  var COUPLE_DYNAMIC_LABELS = {
    characterType: "Character Type",
    artFinish: "Art Finish",
    background: "Background",
    dynamicSceneEffect: "Dynamic Scene Effect",
    timeEra: "Time / Era",
    cameraAngle: "Camera Angle",
    lightingEffects: "Lighting Effects",
    framing: "Framing",
    fantasyElements: "Fantasy Elements",
    props: "Props",
    cosplayCharacter: "Cosplay Character",
    relationshipVibe: "Relationship Vibe",
    poseInteraction: "Pose / Interaction",
    coordinationStyle: "Coordination Style",
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  function buildCoupleDynamic() {
    return {
      characterType: PromptHaus.util.makeGroupedField("", lists.characterTypeGroups),
      artFinish: makeField("", lists.artFinish),
      background: makeField("", lists.background),
      dynamicSceneEffect: makeField("", lists.dynamicSceneEffect),
      timeEra: makeField("", lists.timeEra),
      cameraAngle: makeField("", lists.cameraAngle),
      lightingEffects: makeField("", lists.lightingEffects),
      framing: makeField("no frame", lists.framing),
      fantasyElements: makeField("", lists.fantasyElements),
      props: makeField("", lists.props),
      cosplayCharacter: makeField("none", lists.cosplayCharacter),
      relationshipVibe: makeField("none", RELATIONSHIP_VIBE_OPTIONS),
      poseInteraction: makeField("", POSE_INTERACTION_OPTIONS),
      coordinationStyle: makeField("", COORDINATION_STYLE_OPTIONS),
    };
  }

  function buildPerson() {
    return {
      showOptionalDetails: false, // collapses Makeup/Nails behind one checkbox
      humanIdentity: {
        ethnicity: makeField("", lists.ethnicity),
        skinTone: makeField("", lists.skinTone),
        ageGroup: makeField("", lists.humanAgeGroup),
        gender: makeField("", lists.humanGender),
        height: makeField("", lists.height),
        bodyType: makeField("", lists.humanBodyType),
        occupationNiche: makeField("none", lists.occupationNiche),
      },
      animalIdentity: {
        species: makeField("sheep", lists.species),
        furFeatherScaleTexture: makeField("", lists.furFeatherScaleTexture),
        ageGroup: makeField("", lists.animalAgeGroup),
        gender: makeField("", lists.animalGender),
        height: makeField("", lists.height),
        bodyType: makeField("", lists.animalBodyType),
        occupationNiche: makeField("none", lists.occupationNiche),
      },
      appearance: {
        hairColor: makeField("", lists.hairColor),
        hairStyle: makeField("", lists.hairStyle),
        eyeColor: makeField("", lists.eyeColor),
        expression: makeField("none", lists.expression),
        facialFeatures: makeField("none", lists.facialFeatures),
        eyeSizeShape: makeField("", lists.eyeSizeShape),
        lashIntensity: makeField("", lists.lashIntensity),
        lipStyle: makeField("", lists.lipStyle),
        extraGlamDetails: makeField("", lists.extraGlamDetails),
      },
      styling: {
        outfit: makeField("", lists.outfit),
        shoes: makeField("", lists.shoes),
        makeup: makeField("", lists.makeup),
        nails: makeField("", lists.nails),
        beard: makeField("", lists.beard),
        accessories: makeField("", lists.accessories),
        specialNeeds: makeField("none", lists.specialNeeds),
        jewelry: makeField("", lists.jewelry),
        tattoos: makeField("none", lists.tattoos),
        crownHeadEffects: makeField("none", lists.crownHeadEffects),
      },
    };
  }

  function buildInitialState(baseType) {
    return {
      baseType: baseType || "human",
      coupleDynamic: buildCoupleDynamic(),
      characterA: buildPerson(),
      characterB: buildPerson(),
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function setBaseType(newBaseType) {
    store.setState({ baseType: newBaseType });
  }

  function updateCoupleDynamicField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.coupleDynamic[fieldName], changes);
    store.setState({ coupleDynamic: Object.assign({}, state.coupleDynamic, patch) });
  }

  function personKey(person) {
    return person === "B" ? "characterB" : "characterA";
  }

  function updatePersonField(person, groupName, fieldName, changes) {
    var key = personKey(person);
    var state = store.getState();
    var personState = state[key];
    var group = personState[groupName];
    var newGroup = Object.assign({}, group);
    newGroup[fieldName] = Object.assign({}, group[fieldName], changes);
    var patch = {};
    patch[groupName] = newGroup;
    var newPersonState = Object.assign({}, personState, patch);
    var statePatch = {};
    statePatch[key] = newPersonState;
    store.setState(statePatch);
  }

  function toggleOptionalDetails(person, show) {
    var key = personKey(person);
    var state = store.getState();
    var statePatch = {};
    statePatch[key] = Object.assign({}, state[key], { showOptionalDetails: show });
    store.setState(statePatch);
  }

  function swapCharacters() {
    var state = store.getState();
    store.setState({ characterA: state.characterB, characterB: state.characterA });
  }

  // Flattened, active-baseType-aware field list for one person — mirrors
  // Character Mode's getActiveFieldEntries so the UI renderer and the
  // assembler read from exactly the same source.
  function getPersonFieldEntries(person) {
    var key = personKey(person);
    var state = store.getState();
    var personState = state[key];
    var identityGroup = state.baseType === "animalMascot" ? "animalIdentity" : "humanIdentity";
    var entries = [];

    function pushGroup(groupName, labels) {
      var group = personState[groupName];
      Object.keys(labels).forEach(function (fieldName) {
        // Makeup/Nails collapse behind the optional-details toggle.
        if ((fieldName === "makeup" || fieldName === "nails") && !personState.showOptionalDetails) return;
        entries.push({
          groupName: groupName,
          fieldName: fieldName,
          label: labels[fieldName],
          field: group[fieldName],
        });
      });
    }

    pushGroup(identityGroup, charLabels.identity[identityGroup]);
    pushGroup("appearance", charLabels.appearance);
    pushGroup("styling", charLabels.styling);

    return entries;
  }

  // Used both by the UI (to render the editable Couple Dynamic fieldset)
  // and by the assembler below — does NOT include Holiday / Theme, since
  // that lives in Style DNA and has its own editor in the Style DNA bar;
  // injecting it here would duplicate that editor with a handler that
  // doesn't know how to write back to Style DNA.
  function getSceneFieldEntries() {
    var state = store.getState();
    return Object.keys(COUPLE_DYNAMIC_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: COUPLE_DYNAMIC_LABELS[fieldName], field: state.coupleDynamic[fieldName] };
    });
  }

  // Holiday / Theme and Buffer/Padding resolved as their own entries —
  // folded into the assembler's scene-level output (not the UI-facing
  // getSceneFieldEntries above) since they're exactly the kind of "the
  // couple can't contradict each other" field Couple Dynamic exists for.
  function getSharedStyleDNAEntries() {
    var entries = [
      { label: "Holiday / Theme", field: PromptHaus.styleDNA.getState().holiday },
      { label: "Mockup View", field: PromptHaus.styleDNA.getState().mockupView },
    ];
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);
    return entries;
  }

  function toEntry(e) {
    return { label: e.label, field: e.field };
  }

  function assemblePrompt() {
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var sceneEntries = getSceneFieldEntries().map(toEntry);
    sceneEntries = sceneEntries.concat(getSharedStyleDNAEntries());
    var sceneResolved = PromptHaus.engine.resolveFields(sceneEntries);
    var aResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("A").map(toEntry));
    var bResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("B").map(toEntry));

    var parts = [];
    parts.push(
      "Create " + count + (count === 1 ? " variation" : " variations") + " of a clean, professional couple portrait."
    );
    if (aResolved.length) parts.push("Character A: a " + aResolved.map(function (r) { return r.value; }).join(", ") + ".");
    if (bResolved.length) parts.push("Character B: a " + bResolved.map(function (r) { return r.value; }).join(", ") + ".");
    if (sceneResolved.length) parts.push(sceneResolved.map(function (r) { return r.value; }).join(", ") + ".");

    var text = parts.filter(Boolean).join(" ");
    var fragments = aResolved.concat(bResolved).concat(sceneResolved).map(function (r) {
      return r.value;
    });
    var resolved = aResolved
      .map(function (r) { return { label: "A — " + r.label, value: r.value }; })
      .concat(bResolved.map(function (r) { return { label: "B — " + r.label, value: r.value }; }))
      .concat(sceneResolved);

    return { text: text, fragments: fragments, resolved: resolved };
  }

  function randomizeEntries(entries, updateFn) {
    entries.forEach(function (e) {
      if (!e.field.includeInPrompt) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      updateFn(e, { value: randomValue, customValue: "" });
    });
  }

  function randomize() {
    randomizeEntries(getSceneFieldEntries(), function (e, changes) {
      updateCoupleDynamicField(e.fieldName, changes);
    });
    randomizeEntries(getPersonFieldEntries("A"), function (e, changes) {
      updatePersonField("A", e.groupName, e.fieldName, changes);
    });
    randomizeEntries(getPersonFieldEntries("B"), function (e, changes) {
      updatePersonField("B", e.groupName, e.fieldName, changes);
    });
  }

  function reset() {
    store.setState(buildInitialState(store.getState().baseType));
  }

  function getSelectionsByGroup() {
    var sceneEntries = getSceneFieldEntries().map(toEntry);
    sceneEntries = sceneEntries.concat(getSharedStyleDNAEntries());
    var sceneResolved = PromptHaus.engine.resolveFields(sceneEntries);
    var aResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("A").map(toEntry));
    var bResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("B").map(toEntry));
    var groups = [];
    if (sceneResolved.length) groups.push({ title: "Couple Dynamic", items: sceneResolved });
    if (aResolved.length) groups.push({ title: "Character A", items: aResolved });
    if (bResolved.length) groups.push({ title: "Character B", items: bResolved });
    return groups;
  }

  // ---------------------------------------------------------------------
  // Starter Presets — Couple Dynamic (scene-level) fields only, same
  // reasoning as Character Mode: identity fields for either person stay
  // untouched, presets are a vibe/scene starting point, not a cast choice.
  // ---------------------------------------------------------------------
  var PRESETS = [
    {
      id: "anniversaryPortrait",
      name: "Anniversary Portrait",
      description: "In love, gazing at each other, golden hour glow, ornate frame.",
      apply: function () {
        updateCoupleDynamicField("relationshipVibe", { value: "in love", customValue: "" });
        updateCoupleDynamicField("poseInteraction", { value: "gazing at each other", customValue: "" });
        updateCoupleDynamicField("background", { value: "soft pastel gradient", customValue: "" });
        updateCoupleDynamicField("lightingEffects", { value: "golden hour glow", customValue: "" });
        updateCoupleDynamicField("coordinationStyle", { value: "coordinated colors", customValue: "" });
        updateCoupleDynamicField("framing", { value: "ornate decorative frame", customValue: "" });
      },
    },
    {
      id: "matchingBesties",
      name: "Matching Besties",
      description: "Best friends, side by side, matching accessories, playful backdrop.",
      apply: function () {
        updateCoupleDynamicField("relationshipVibe", { value: "best friends", customValue: "" });
        updateCoupleDynamicField("poseInteraction", { value: "side by side", customValue: "" });
        updateCoupleDynamicField("coordinationStyle", { value: "matching accessories", customValue: "" });
        updateCoupleDynamicField("background", { value: "candy-colored polka dots", customValue: "" });
        updateCoupleDynamicField("framing", { value: "no frame", customValue: "" });
      },
    },
  ];

  PromptHaus.couples = Object.assign({}, store, {
    presets: PRESETS,
    setBaseType: setBaseType,
    updateCoupleDynamicField: updateCoupleDynamicField,
    updatePersonField: updatePersonField,
    toggleOptionalDetails: toggleOptionalDetails,
    swapCharacters: swapCharacters,
    getPersonFieldEntries: getPersonFieldEntries,
    getSceneFieldEntries: getSceneFieldEntries,
    getSelectionsByGroup: getSelectionsByGroup,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    labels: { coupleDynamic: COUPLE_DYNAMIC_LABELS },
  });
})();
