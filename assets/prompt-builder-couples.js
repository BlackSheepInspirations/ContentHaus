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
  var textLists = PromptHaus.text.optionLists;
  var charLabels = PromptHaus.character.labels;
  // Randomize caps/exclusions — same rationale/numbers as Character Mode's
  // own groups: Occupation/Height/Body Type excluded outright, Appearance
  // and Styling capped to a focused subset rather than a full sweep.
  var IDENTITY_RANDOM_EXCLUDE = ["height", "size", "bodyType", "occupationNiche"];
  var APPEARANCE_RANDOM_CAP = 5;
  var STYLING_RANDOM_CAP = 3;
  // Couple Dynamic bundles several layers into one flat field set — these
  // two lists split out which fields are Presentation-equivalent (the
  // shared scene) vs. Extras-equivalent (optional fantasy/props/cosplay),
  // each capped the same as Character Mode's own groups. Relationship
  // Vibe/Pose Interaction/Coordination Style, and Character Type/Art
  // Finish, stay uncapped — they're either core to what makes this
  // "Couples" or a single either/or style pick.
  var COUPLE_STYLE_FIELDS = ["characterType", "artFinish"];
  var COUPLE_PRESENTATION_FIELDS = ["background", "dynamicSceneEffect", "timeEra", "cameraAngle", "lightingEffects", "framing"];
  var COUPLE_EXTRAS_FIELDS = ["fantasyElements", "props", "characterArchetype"];
  var COUPLE_PRESENTATION_RANDOM_CAP = 3;
  var COUPLE_EXTRAS_RANDOM_CAP = 1;

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
    dynamicSceneEffect: "Scene Effect",
    timeEra: "Time / Era",
    cameraAngle: "Camera Angle",
    lightingEffects: "Lighting Effects",
    framing: "Framing",
    fantasyElements: "Fantasy Elements",
    props: "Props",
    characterArchetype: "Character Archetype",
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
      artFinish: PromptHaus.util.makeGroupedField("", lists.artFinishGroups),
      background: PromptHaus.util.makeGroupedField("", lists.backgroundGroups),
      dynamicSceneEffect: makeField("", lists.dynamicSceneEffect),
      timeEra: makeField("", lists.timeEra),
      // Defaulted like Character Mode's own Camera Angle/Lighting Effects
      // — Couples has no direct "standing pose" equivalent (poseInteraction
      // is inherently a 2-person interaction, e.g. "holding hands," with
      // nothing that maps to a single default), so that one's left as-is.
      cameraAngle: makeField("front view", lists.cameraAngle),
      lightingEffects: makeField("studio lighting", lists.lightingEffects),
      framing: PromptHaus.util.makeGroupedField("no frame", lists.framingGroups),
      fantasyElements: makeField("", lists.fantasyElements),
      props: PromptHaus.util.makeGroupedField("", lists.propsGroups),
      characterArchetype: makeField("", lists.characterArchetype),
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
        occupationNiche: makeField("", lists.occupationNiche),
      },
      animalIdentity: {
        species: makeField("sheep", lists.species),
        surfaceTexture: makeField("", lists.surfaceTexture),
        ageGroup: makeField("", lists.animalAgeGroup),
        gender: makeField("", lists.animalGender),
        size: makeField("", lists.animalSize),
        bodyType: makeField("", lists.animalBodyType),
        occupationNiche: makeField("", lists.occupationNiche),
      },
      appearance: {
        hairColor: PromptHaus.util.makeGroupedField("", lists.hairColorGroups),
        hairStyle: PromptHaus.util.makeGroupedField("", lists.hairStyleGroups),
        eyeColor: makeField("", lists.eyeColor),
        expression: makeField("", lists.expression),
        facialFeatures: makeField("", lists.facialFeatures),
        eyeSizeShape: makeField("", lists.eyeSizeShape),
        lashIntensity: makeField("", lists.lashIntensity),
        lipStyle: makeField("", lists.lipStyle),
        extraGlamDetails: makeField("", lists.extraGlamDetails),
        makeup: makeField("", lists.makeup),
        beard: makeField("", lists.beard),
      },
      styling: {
        outfit: makeField("", lists.outfit),
        shoes: makeField("", lists.shoes),
        nails: makeField("", lists.nails),
        accessories: makeField("", lists.accessories),
        accessories2: makeField("", lists.accessories),
        mobilityAccessibility: makeField("none", lists.mobilityAccessibility),
        jewelry: makeField("", lists.jewelry),
        tattoos: makeField("", lists.tattoos),
        headwearHeadEffects: PromptHaus.util.makeGroupedField("none", lists.headwearHeadEffectsGroups),
      },
    };
  }

  // Shared pool for the couple (e.g. their 2 dogs + 1 cat together), not
  // per-person — a couple photo with pets doesn't usually split "belongs
  // to A vs B." Same shape/cap as Character Mode's own Companion feature.
  function buildCompanionSlot() {
    return {
      category: makeField("", lists.creatureCategories),
      breed: makeField("", []),
      color: makeField("", lists.creatureColors),
      eyeColor: makeField("", lists.companionEyeColor),
      size: makeField("", lists.animalSize),
      position: makeField("", lists.companionPosition),
      accessories: makeField("", lists.companionAccessories),
    };
  }

  function buildInitialState(baseType) {
    return {
      baseType: baseType || "human",
      coupleDynamic: buildCoupleDynamic(),
      characterA: buildPerson(),
      characterB: buildPerson(),
      companions: {
        count: 0,
        slots: [buildCompanionSlot(), buildCompanionSlot(), buildCompanionSlot()],
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

  var MAX_COMPANIONS = 3;

  // ---------------------------------------------------------------------
  // Add Text — same pattern as Friends & Family / Animals Modes, so a
  // couple portrait can layer lettering (a name, date, quote) without
  // switching to Combined Mode.
  // ---------------------------------------------------------------------
  var ADD_TEXT_LABELS = { text: "Text Content", letterStyle: "Letter Style", colorScheme: "Color Scheme", textCase: "Text Case", textEffects: "Text Effects" };

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
      .filter(function (fieldName) { return fieldName !== "text"; })
      .map(function (fieldName) { return { fieldName: fieldName, label: ADD_TEXT_LABELS[fieldName], field: addText[fieldName] }; });
  }

  var TEXT_PARAGRAPH_LOOKUP_BY_FIELD = {
    letterStyle: textLists.letterStylePrompts,
    colorScheme: textLists.colorSchemePrompts,
    textEffects: textLists.textEffectsPrompts,
  };
  function withTextParagraphLookup(e) {
    var lookup = TEXT_PARAGRAPH_LOOKUP_BY_FIELD[e.fieldName];
    if (!lookup) return { label: e.label, field: e.field };
    var field = PromptHaus.engine.withPromptLookup(e.field, lookup);
    if (e.fieldName === "letterStyle" && field.value && field.value.indexOf("<product type>") !== -1) {
      field = Object.assign({}, field, { value: field.value.split("<product type>").join(PromptHaus.styleDNA.getProjectTypeValue()) });
    }
    return { label: e.label, field: field };
  }

  function buildTextClause() {
    var addText = store.getState().addText;
    if (!addText.include) return "";
    var text = (addText.text.value || "").trim();
    if (!text) return "";
    var descriptors = PromptHaus.engine.resolveFields(
      getAddTextStyleEntries().map(withTextParagraphLookup)
    ).map(function (r) { return r.value; });
    var clause = 'the text "' + text + '"';
    if (descriptors.length) clause += " styled as " + descriptors.join(", ");
    return clause;
  }

  function setCompanionCount(count) {
    var state = store.getState();
    var clamped = Math.max(0, Math.min(MAX_COMPANIONS, count));
    store.setState({ companions: Object.assign({}, state.companions, { count: clamped }) });
  }

  function toggleCompanionInclude(include) {
    setCompanionCount(include ? 1 : 0);
  }

  function updateCompanionSlotCategory(index, changes) {
    var state = store.getState();
    var slot = state.companions.slots[index];
    var nextCategory = Object.assign({}, slot.category, changes);
    var breedOptions = lists.creatureBreedsByCategory[nextCategory.value] || [];
    var newSlot = Object.assign({}, slot, { category: nextCategory, breed: makeField("", breedOptions) });
    var newSlots = state.companions.slots.slice();
    newSlots[index] = newSlot;
    store.setState({ companions: Object.assign({}, state.companions, { slots: newSlots }) });
  }

  function updateCompanionSlotField(index, fieldName, changes) {
    var state = store.getState();
    var slot = state.companions.slots[index];
    var newSlot = Object.assign({}, slot);
    newSlot[fieldName] = Object.assign({}, slot[fieldName], changes);
    var newSlots = state.companions.slots.slice();
    newSlots[index] = newSlot;
    store.setState({ companions: Object.assign({}, state.companions, { slots: newSlots }) });
  }

  // Removes whichever slot is picked (not just the last one) — shifts any
  // slots after it down by one so there's no gap, and appends a fresh
  // empty slot at the end to keep the array at its fixed length of 3.
  function removeCompanionSlot(index) {
    var state = store.getState();
    var newSlots = state.companions.slots.slice();
    newSlots.splice(index, 1);
    newSlots.push(buildCompanionSlot());
    store.setState({
      companions: Object.assign({}, state.companions, {
        slots: newSlots,
        count: Math.max(0, state.companions.count - 1),
      }),
    });
  }

  // Flattened companion entries, numbered once a second slot is active —
  // mirrors Character Mode's own getActiveFieldEntries companion block.
  function getCompanionFieldEntries() {
    var state = store.getState();
    var entries = [];
    for (var i = 0; i < state.companions.count; i++) {
      var slot = state.companions.slots[i];
      var prefix = state.companions.count > 1 ? "Companion " + (i + 1) : "Companion";
      entries.push({ fieldName: "breed", slotIndex: i, label: prefix, field: slot.breed });
      entries.push({ fieldName: "color", slotIndex: i, label: prefix + " Color", field: slot.color });
      entries.push({ fieldName: "eyeColor", slotIndex: i, label: prefix + " Eye Color", field: slot.eyeColor });
      entries.push({ fieldName: "size", slotIndex: i, label: prefix + " Size", field: slot.size });
      entries.push({ fieldName: "position", slotIndex: i, label: prefix + " Position", field: slot.position });
      entries.push({ fieldName: "accessories", slotIndex: i, label: prefix + " Accessories", field: slot.accessories });
    }
    return entries;
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
      { label: "Holiday", field: PromptHaus.styleDNA.getState().holiday },
      { label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience },
      { label: "Mood", field: PromptHaus.styleDNA.getState().mood },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ];
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("couples");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);
    return entries;
  }

  function toEntry(e) {
    return { label: e.label, field: e.field };
  }

  // Animal Mascot fix (mirrors Character Mode's own fix): Hair Style is
  // redundant once Surface Texture is chosen — Surface Texture's own
  // options already bake curliness/density into the noun itself ("curly
  // wool", "shaggy fur"). Hair Color also used to float as a disconnected
  // comma item with no noun attached, which produced "black curly hair"
  // instead of "black wool." Composed into Surface Texture's own value
  // instead (assembly time only; the UI still shows both as separate
  // editable fields).
  function composeAnimalMascotAppearance(entries, baseType) {
    if (baseType !== "animalMascot") return entries;
    entries = entries.filter(function (e) { return e.fieldName !== "hairStyle"; });
    var hairColorIndex = -1;
    var hairColorEntry = null;
    entries.forEach(function (e, i) {
      if (e.fieldName === "hairColor") { hairColorEntry = e; hairColorIndex = i; }
    });
    if (hairColorEntry) {
      var hairColorText = PromptHaus.engine.resolveFieldValue(hairColorEntry.field);
      if (hairColorText) {
        var surfaceTextureEntry = entries.filter(function (e) { return e.fieldName === "surfaceTexture"; })[0];
        if (surfaceTextureEntry) {
          var surfaceTextureText = PromptHaus.engine.resolveFieldValue(surfaceTextureEntry.field);
          surfaceTextureEntry.field = makeField(surfaceTextureText ? hairColorText + " " + surfaceTextureText : hairColorText);
        }
      }
      entries.splice(hairColorIndex, 1);
    }
    return entries;
  }

  // Character Type/Art Finish carry a full descriptive paragraph (chunk 3)
  // rather than a short word — previously they rode inside sceneResolved,
  // which gets appended as one trailing sentence AFTER both Character A
  // and Character B are already fully described. A paragraph-length style
  // instruction landing after the fact reads as disconnected from either
  // person, which is exactly the reported bug ("the art style doesn't
  // always translate to the characters — one it was only the background").
  // Pulled into their own intro sentences instead, mirroring Character
  // Mode's Illustration Style/Art Finish placement, so the style is
  // established before either person is described.
  function assemblePrompt() {
    var baseType = store.getState().baseType;
    var sceneEntries = getSceneFieldEntries();
    var styleEntries = sceneEntries.filter(function (e) { return e.fieldName === "characterType" || e.fieldName === "artFinish"; });
    var otherSceneEntries = sceneEntries
      .filter(function (e) { return e.fieldName !== "characterType" && e.fieldName !== "artFinish"; })
      .map(toEntry)
      .concat(getSharedStyleDNAEntries());
    var sceneResolved = PromptHaus.engine.resolveFields(otherSceneEntries);

    var characterTypeEntry = styleEntries.filter(function (e) { return e.fieldName === "characterType"; })[0];
    var artFinishEntry = styleEntries.filter(function (e) { return e.fieldName === "artFinish"; })[0];
    var illustrationStyleText = characterTypeEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(characterTypeEntry.field, lists.characterTypePrompts))
      : "";
    var artFinishText = artFinishEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(artFinishEntry.field, lists.artFinishPrompts))
      : "";

    var aResolved = PromptHaus.engine.resolveFields(composeAnimalMascotAppearance(getPersonFieldEntries("A"), baseType).map(toEntry));
    var bResolved = PromptHaus.engine.resolveFields(composeAnimalMascotAppearance(getPersonFieldEntries("B"), baseType).map(toEntry));
    var companionResolved = PromptHaus.engine.resolveFields(getCompanionFieldEntries().map(toEntry));

    var parts = [];
    parts.push("Create a clean, professional couple portrait.");
    if (illustrationStyleText) parts.push("Illustration style: " + illustrationStyleText);
    if (artFinishText) parts.push("Art finish: " + artFinishText);
    if (aResolved.length) parts.push("Character A: a " + aResolved.map(function (r) { return r.value; }).join(", ") + ".");
    if (bResolved.length) parts.push("Character B: a " + bResolved.map(function (r) { return r.value; }).join(", ") + ".");
    if (companionResolved.length) parts.push("Also include " + companionResolved.map(function (r) { return r.value; }).join(", ") + ".");
    if (sceneResolved.length) parts.push(sceneResolved.map(function (r) { return r.value; }).join(", ") + ".");
    var textClause = buildTextClause();
    if (textClause) parts.push("Include " + textClause + ".");

    var text = parts.filter(Boolean).join(" ");
    var styleResolved = [];
    if (illustrationStyleText) styleResolved.push({ label: "Illustration Style", value: illustrationStyleText });
    if (artFinishText) styleResolved.push({ label: "Art Finish", value: artFinishText });
    var fragments = styleResolved.concat(aResolved).concat(bResolved).concat(companionResolved).concat(sceneResolved).map(function (r) {
      return r.value;
    });
    var resolved = styleResolved
      .concat(aResolved.map(function (r) { return { label: "A — " + r.label, value: r.value }; }))
      .concat(bResolved.map(function (r) { return { label: "B — " + r.label, value: r.value }; }))
      .concat(companionResolved)
      .concat(sceneResolved);
    if (textClause) { fragments.push(textClause); resolved.push({ label: "Text", value: textClause }); }

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
    var sceneEntries = getSceneFieldEntries();
    var cappedSceneFields = COUPLE_PRESENTATION_FIELDS.concat(COUPLE_EXTRAS_FIELDS);
    randomizeEntries(
      sceneEntries.filter(function (e) { return cappedSceneFields.indexOf(e.fieldName) === -1; }),
      function (e, changes) { updateCoupleDynamicField(e.fieldName, changes); }
    );
    PromptHaus.util.randomizeGroupWithCap(
      sceneEntries.filter(function (e) { return COUPLE_PRESENTATION_FIELDS.indexOf(e.fieldName) !== -1; }),
      COUPLE_PRESENTATION_RANDOM_CAP,
      function (fieldName, changes) { updateCoupleDynamicField(fieldName, changes); },
      function (fieldName) { updateCoupleDynamicField(fieldName, { value: "", customValue: "" }); }
    );
    PromptHaus.util.randomizeGroupWithCap(
      sceneEntries.filter(function (e) { return COUPLE_EXTRAS_FIELDS.indexOf(e.fieldName) !== -1; }),
      COUPLE_EXTRAS_RANDOM_CAP,
      function (fieldName, changes) { updateCoupleDynamicField(fieldName, changes); },
      function (fieldName) { updateCoupleDynamicField(fieldName, { value: "", customValue: "" }); }
    );

    ["A", "B"].forEach(function (person) {
      var entries = getPersonFieldEntries(person);
      randomizeEntries(
        entries.filter(function (e) {
          return e.groupName !== "styling" && e.groupName !== "appearance" && IDENTITY_RANDOM_EXCLUDE.indexOf(e.fieldName) === -1;
        }),
        function (e, changes) {
          updatePersonField(person, e.groupName, e.fieldName, changes);
        }
      );
      PromptHaus.util.randomizeGroupWithCap(
        entries.filter(function (e) { return e.groupName === "appearance" && e.fieldName !== "beard"; }),
        APPEARANCE_RANDOM_CAP,
        function (fieldName, changes) { updatePersonField(person, "appearance", fieldName, changes); },
        function (fieldName) { updatePersonField(person, "appearance", fieldName, { value: "", customValue: "" }); }
      );
      PromptHaus.util.randomizeGroupWithCap(
        entries.filter(function (e) { return e.groupName === "styling" && e.fieldName !== "accessories2"; }),
        STYLING_RANDOM_CAP,
        function (fieldName, changes) { updatePersonField(person, "styling", fieldName, changes); },
        function (fieldName) { updatePersonField(person, "styling", fieldName, { value: "", customValue: "" }); }
      );
    });
    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState(store.getState().baseType));
    PromptHaus.styleDNA.resetContent();
  }

  function getSelectionsByGroup() {
    var sceneEntries = getSceneFieldEntries().map(toEntry);
    sceneEntries = sceneEntries.concat(getSharedStyleDNAEntries());
    var sceneResolved = PromptHaus.engine.resolveFields(sceneEntries);
    var aResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("A").map(toEntry));
    var bResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("B").map(toEntry));
    var companionResolved = PromptHaus.engine.resolveFields(getCompanionFieldEntries().map(toEntry));
    var groups = [];
    if (sceneResolved.length) groups.push({ title: "Couple Dynamic", items: sceneResolved });
    if (aResolved.length) groups.push({ title: "Character A", items: aResolved });
    if (bResolved.length) groups.push({ title: "Character B", items: bResolved });
    if (companionResolved.length) groups.push({ title: "Companion", items: companionResolved });
    var textClause = buildTextClause();
    if (textClause) groups.push({ title: "Text", items: [{ label: "Text", value: textClause }] });
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
    getCompanionFieldEntries: getCompanionFieldEntries,
    toggleCompanionInclude: toggleCompanionInclude,
    setCompanionCount: setCompanionCount,
    updateCompanionSlotCategory: updateCompanionSlotCategory,
    updateCompanionSlotField: updateCompanionSlotField,
    removeCompanionSlot: removeCompanionSlot,
    MAX_COMPANIONS: MAX_COMPANIONS,
    toggleAddTextInclude: toggleAddTextInclude,
    updateAddTextField: updateAddTextField,
    getAddTextStyleEntries: getAddTextStyleEntries,
    getSelectionsByGroup: getSelectionsByGroup,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    labels: { coupleDynamic: COUPLE_DYNAMIC_LABELS },
    STYLE_FIELDS: COUPLE_STYLE_FIELDS,
    PRESENTATION_FIELDS: COUPLE_PRESENTATION_FIELDS,
    EXTRAS_FIELDS: COUPLE_EXTRAS_FIELDS,
  });
})();
