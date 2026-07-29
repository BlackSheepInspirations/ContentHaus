/**
 * The AI Creator's Prompt Haus — Friends & Family Mode
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js,
 * prompt-builder-character.js (reuses its option lists — see
 * PromptHaus.character.optionLists — and its Companion taxonomy), and
 * prompt-builder-text.js (reuses its Add Text option lists).
 *
 * Up to 2 adults + up to 4 kids, both progressive slot groups (start at 0,
 * "+ Add" up to the max, each with its own Remove) — covers a single
 * adult with kids, a full 2-parent household, or a friend group with no
 * kids at all, not just a fixed nuclear-family shape. Per-person fields
 * are deliberately trimmed from Character Mode's full depth (Identity
 * drops Height/Body Type/Occupation, Appearance drops the more glam-
 * specific fields, Styling keeps just Outfit/Shoes/Accessories/Special
 * Needs) — a 6-person scene at full Character depth would dwarf every
 * other mode's field count.
 *
 * Family Dynamic is the group-level shared scene, same role as Couples'
 * Couple Dynamic — Style/Presentation/Extras fields plus Relationship
 * Vibe/Group Pose/Coordination Style, so the whole group can't end up in
 * contradictory scenes/eras.
 *
 * Companions reuse the exact shared-pool 3-slot pattern Character/Couples
 * already have — same functions, same shape, same "excluded from
 * randomize" rule.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;
  var lists = PromptHaus.character.optionLists;
  var textLists = PromptHaus.text.optionLists;

  var MAX_ADULTS = 5;
  var MAX_KIDS = 5;
  var MAX_COMPANIONS = 3;

  // Split rather than reusing Character's one combined list — an adult
  // slot offering "toddler" (or a kid slot offering "mature") would read
  // as a mismatch against the slot's own name.
  var ADULT_AGE_GROUP_OPTIONS = ["young adult", "middle aged", "mature"];
  var KID_AGE_GROUP_OPTIONS = ["baby", "toddler", "child", "teen"];

  var PERSON_IDENTITY_LABELS = { ethnicity: "Ethnicity", skinTone: "Skin Tone", ageGroup: "Age Group", gender: "Gender" };
  var PERSON_APPEARANCE_LABELS = { hairColor: "Hair Color", hairStyle: "Hair Style", eyeColor: "Eye Color", expression: "Expression", facialFeatures: "Facial Features" };
  var PERSON_STYLING_LABELS = { outfit: "Outfit", shoes: "Shoes", accessories: "Accessories", accessories2: "Accessories 2", mobilityAccessibility: "Mobility & Accessibility" };

  var FAMILY_DYNAMIC_LABELS = {
    characterType: "Character Type", artFinish: "Art Finish",
    background: "Background", dynamicSceneEffect: "Scene Effect", timeEra: "Time / Era",
    cameraAngle: "Camera Angle", lightingEffects: "Lighting Effects", framing: "Framing",
    fantasyElements: "Fantasy Elements", props: "Props", characterArchetype: "Character Archetype",
    relationshipVibe: "Relationship Vibe", groupPose: "Group Pose", coordinationStyle: "Coordination Style",
  };
  // Same split/cap pattern as Couples' Couple Dynamic — Presentation-
  // equivalent and Extras-equivalent get a focused random subset;
  // Style and the 3 group-specific fields stay uncapped (core to what
  // makes this "Friends & Family").
  var FAMILY_PRESENTATION_FIELDS = ["background", "dynamicSceneEffect", "timeEra", "cameraAngle", "lightingEffects", "framing"];
  var FAMILY_EXTRAS_FIELDS = ["fantasyElements", "props", "characterArchetype"];
  var FAMILY_PRESENTATION_RANDOM_CAP = 3;
  var FAMILY_EXTRAS_RANDOM_CAP = 1;
  // Same Appearance/Styling randomize caps Character and Couples both use
  // per person — Family's own per-person Randomize previously had no caps
  // at all, dumping every one of the 13 identity/appearance/styling fields
  // per person instead of a curated subset like its two sibling modes.
  var PERSON_APPEARANCE_RANDOM_CAP = 5;
  var PERSON_STYLING_RANDOM_CAP = 3;

  var RELATIONSHIP_VIBE_OPTIONS = sortAlpha([
    "none", "immediate family", "extended family", "multigenerational family", "friend group",
    "holiday gathering", "found family", "class reunion", "team/squad", "the quintessential awkward family photo",
  ]);
  var GROUP_POSE_OPTIONS = sortAlpha([
    "arms around each other", "group hug", "sitting in a row", "candid laughing", "goofy faces",
    "piggyback rides", "jumping in the air", "stiff, forced studio smiles", "hands on each other's shoulders",
  ]);
  var COORDINATION_STYLE_OPTIONS = sortAlpha([
    "coordinated colors", "matching outfits", "complementary patterns", "contrasting styles",
    "matching ugly holiday sweaters", "denim-on-denim head to toe",
  ]);

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  function buildPersonSlot(kind) {
    return {
      ethnicity: makeField("", lists.ethnicity),
      skinTone: makeField("", lists.skinTone),
      ageGroup: makeField("", kind === "adult" ? ADULT_AGE_GROUP_OPTIONS : KID_AGE_GROUP_OPTIONS),
      gender: makeField("", lists.humanGender),
      hairColor: PromptHaus.util.makeGroupedField("", lists.hairColorGroups),
      hairStyle: PromptHaus.util.makeGroupedField("", lists.hairStyleGroups),
      eyeColor: makeField("", lists.eyeColor),
      expression: makeField("", lists.expression),
      facialFeatures: makeField("", lists.facialFeatures),
      outfit: makeField("", lists.outfit),
      shoes: makeField("", lists.shoes),
      accessories: makeField("", lists.accessories),
      accessories2: makeField("", lists.accessories),
      mobilityAccessibility: makeField("none", lists.mobilityAccessibility),
    };
  }

  // Same shape as Character/Couples Mode's own Companion slot — single
  // source of truth for "what does a companion look like."
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

  function buildPersonSlots(kind, count) {
    var slots = [];
    for (var i = 0; i < count; i++) slots.push(buildPersonSlot(kind));
    return slots;
  }

  function buildInitialState() {
    return {
      adults: {
        count: 0,
        slots: buildPersonSlots("adult", MAX_ADULTS),
      },
      kids: {
        count: 0,
        slots: buildPersonSlots("kid", MAX_KIDS),
      },
      familyDynamic: {
        characterType: PromptHaus.util.makeGroupedField("", lists.characterTypeGroups),
        artFinish: PromptHaus.util.makeGroupedField("", lists.artFinishGroups),
        background: PromptHaus.util.makeGroupedField("", lists.backgroundGroups),
        dynamicSceneEffect: makeField("", lists.dynamicSceneEffect),
        timeEra: makeField("", lists.timeEra),
        cameraAngle: makeField("front view", lists.cameraAngle),
        lightingEffects: makeField("studio lighting", lists.lightingEffects),
        framing: PromptHaus.util.makeGroupedField("no frame", lists.framingGroups),
        fantasyElements: makeField("", lists.fantasyElements),
        props: PromptHaus.util.makeGroupedField("", lists.propsGroups),
        characterArchetype: makeField("", lists.characterArchetype),
        relationshipVibe: makeField("none", RELATIONSHIP_VIBE_OPTIONS),
        groupPose: makeField("", GROUP_POSE_OPTIONS),
        coordinationStyle: makeField("", COORDINATION_STYLE_OPTIONS),
      },
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

  var store = PromptHaus.util.createStore(buildInitialState());

  // ---------------------------------------------------------------------
  // Adults / Kids — generic person-slot functions, parameterized by
  // group ("adults" or "kids") rather than duplicated per group.
  // ---------------------------------------------------------------------
  function personMax(group) {
    return group === "adults" ? MAX_ADULTS : MAX_KIDS;
  }

  function setPersonCount(group, count) {
    var state = store.getState();
    var clamped = Math.max(0, Math.min(personMax(group), count));
    var patch = {};
    patch[group] = Object.assign({}, state[group], { count: clamped });
    store.setState(patch);
  }

  function updatePersonField(group, index, fieldName, changes) {
    var state = store.getState();
    var slots = state[group].slots;
    var newSlot = Object.assign({}, slots[index]);
    newSlot[fieldName] = Object.assign({}, slots[index][fieldName], changes);
    var newSlots = slots.slice();
    newSlots[index] = newSlot;
    var patch = {};
    patch[group] = Object.assign({}, state[group], { slots: newSlots });
    store.setState(patch);
  }

  // Removes whichever slot is picked, shifts anything after it down, and
  // appends a fresh empty slot at the end — same reasoning as Companion's
  // own removeCompanionSlot.
  function removePersonSlot(group, index) {
    var state = store.getState();
    var newSlots = state[group].slots.slice();
    newSlots.splice(index, 1);
    newSlots.push(buildPersonSlot(group === "adults" ? "adult" : "kid"));
    var patch = {};
    patch[group] = Object.assign({}, state[group], {
      slots: newSlots,
      count: Math.max(0, state[group].count - 1),
    });
    store.setState(patch);
  }

  function getPersonFieldEntries(group, index) {
    var slot = store.getState()[group].slots[index];
    var entries = [];
    function pushLabels(labels) {
      Object.keys(labels).forEach(function (fieldName) {
        entries.push({ groupName: group, slotIndex: index, fieldName: fieldName, label: labels[fieldName], field: slot[fieldName] });
      });
    }
    pushLabels(PERSON_IDENTITY_LABELS);
    pushLabels(PERSON_APPEARANCE_LABELS);
    pushLabels(PERSON_STYLING_LABELS);
    return entries;
  }

  // ---------------------------------------------------------------------
  // Family Dynamic
  // ---------------------------------------------------------------------
  function updateFamilyDynamicField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.familyDynamic[fieldName], changes);
    store.setState({ familyDynamic: Object.assign({}, state.familyDynamic, patch) });
  }

  function getFamilyDynamicFieldEntries() {
    var familyDynamic = store.getState().familyDynamic;
    return Object.keys(FAMILY_DYNAMIC_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: FAMILY_DYNAMIC_LABELS[fieldName], field: familyDynamic[fieldName] };
    });
  }

  // ---------------------------------------------------------------------
  // Companions — identical shape/functions to Character/Couples Mode.
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Add Text — identical pattern to Animals & Creatures Mode's own.
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

  function toEntry(e) {
    return { label: e.label, field: e.field };
  }

  // Holiday/Creative Theme/Niche/Target Audience/Mood/Filter It/Imagery/
  // Brand Kit/Project Type/Buffer — folded into one flat list here (rather
  // than each its own mini-sentence) so they resolve into a single
  // flowing clause, same pattern as Couples' own getSharedStyleDNAEntries.
  function getSharedStyleDNAEntries() {
    var styleDNAState = PromptHaus.styleDNA.getState();
    var entries = [
      { label: "Holiday", field: styleDNAState.holiday },
      { label: "Creative Theme", field: styleDNAState.theme },
      { label: "Niche", field: styleDNAState.niche },
      { label: "Target Audience", field: styleDNAState.targetAudience },
      { label: "Mood", field: styleDNAState.mood },
      { label: "Filter It", field: styleDNAState.filter },
    ];
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("family");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);
    return entries;
  }

  // ---------------------------------------------------------------------
  // Assembler
  // ---------------------------------------------------------------------
  // Character Type/Art Finish carry a full descriptive paragraph (chunk 3)
  // rather than a short word — previously they rode inside sceneResolved,
  // appended as one trailing sentence AFTER every Adult/Kid is already
  // fully described. A paragraph-length style instruction landing after
  // the fact reads as disconnected from the group, matching the reported
  // bug ("the art style doesn't always translate to the characters").
  // Pulled into their own intro sentences instead, mirroring Character
  // Mode's Illustration Style/Art Finish placement.
  function assemblePrompt() {
    var state = store.getState();

    var dynamicEntries = getFamilyDynamicFieldEntries();
    var styleEntries = dynamicEntries.filter(function (e) { return e.fieldName === "characterType" || e.fieldName === "artFinish"; });
    var characterTypeEntry = styleEntries.filter(function (e) { return e.fieldName === "characterType"; })[0];
    var artFinishEntry = styleEntries.filter(function (e) { return e.fieldName === "artFinish"; })[0];
    var illustrationStyleText = characterTypeEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(characterTypeEntry.field, lists.characterTypePrompts))
      : "";
    var artFinishText = artFinishEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(artFinishEntry.field, lists.artFinishPrompts))
      : "";

    var parts = [];
    parts.push("Create a clean, professional group portrait.");
    if (illustrationStyleText) parts.push("Illustration style: " + illustrationStyleText);
    if (artFinishText) parts.push("Art finish: " + artFinishText);

    var allResolved = [];
    var fragments = [];
    if (illustrationStyleText) { allResolved.push({ label: "Illustration Style", value: illustrationStyleText }); fragments.push(illustrationStyleText); }
    if (artFinishText) { allResolved.push({ label: "Art Finish", value: artFinishText }); fragments.push(artFinishText); }

    function describePerson(group, label, index) {
      var resolved = PromptHaus.engine.resolveFields(getPersonFieldEntries(group, index).map(toEntry));
      if (!resolved.length) return;
      parts.push(label + ": a " + resolved.map(function (r) { return r.value; }).join(", ") + ".");
      resolved.forEach(function (r) {
        allResolved.push({ label: label + " — " + r.label, value: r.value });
        fragments.push(r.value);
      });
    }

    for (var a = 0; a < state.adults.count; a++) {
      describePerson("adults", state.adults.count > 1 ? "Adult " + (a + 1) : "Adult", a);
    }
    for (var k = 0; k < state.kids.count; k++) {
      describePerson("kids", state.kids.count > 1 ? "Kid " + (k + 1) : "Kid", k);
    }

    var companionResolved = PromptHaus.engine.resolveFields(getCompanionFieldEntries().map(toEntry));
    if (companionResolved.length) {
      parts.push("Also include " + companionResolved.map(function (r) { return r.value; }).join(", ") + ".");
      companionResolved.forEach(function (r) {
        allResolved.push(r);
        fragments.push(r.value);
      });
    }

    var textClause = buildTextClause();
    if (textClause) {
      parts.push("Include " + textClause + ".");
      allResolved.push({ label: "Text", value: textClause });
      fragments.push(textClause);
    }

    var sceneEntries = dynamicEntries
      .filter(function (e) { return e.fieldName !== "characterType" && e.fieldName !== "artFinish"; })
      .map(toEntry)
      .concat(getSharedStyleDNAEntries());
    var sceneResolved = PromptHaus.engine.resolveFields(sceneEntries);
    if (sceneResolved.length) {
      parts.push(sceneResolved.map(function (r) { return r.value; }).join(", ") + ".");
      allResolved = allResolved.concat(sceneResolved);
      fragments = fragments.concat(sceneResolved.map(function (r) { return r.value; }));
    }

    return { text: parts.filter(Boolean).join(" "), fragments: fragments, resolved: allResolved };
  }

  // ---------------------------------------------------------------------
  // Randomize / Reset
  // ---------------------------------------------------------------------
  function randomizeEntries(entries, updateFn) {
    entries.forEach(function (e) {
      if (!e.field.includeInPrompt) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      updateFn(e, { value: randomValue, customValue: "" });
    });
  }

  // Identity fields randomize directly/uncapped (mirroring Character's own
  // treatment of its own identity group); Appearance and Styling each get
  // a capped random subset instead of every field turning on every time.
  var PERSON_APPEARANCE_FIELDS = Object.keys(PERSON_APPEARANCE_LABELS);
  var PERSON_STYLING_FIELDS = Object.keys(PERSON_STYLING_LABELS);
  var PERSON_CAPPED_FIELDS = PERSON_APPEARANCE_FIELDS.concat(PERSON_STYLING_FIELDS);

  function randomizePerson(group, index) {
    var entries = getPersonFieldEntries(group, index);
    function apply(fieldName, changes) { updatePersonField(group, index, fieldName, changes); }
    function clear(fieldName) { updatePersonField(group, index, fieldName, { value: "", customValue: "" }); }
    randomizeEntries(
      entries.filter(function (e) { return PERSON_CAPPED_FIELDS.indexOf(e.fieldName) === -1; }),
      function (e, changes) { apply(e.fieldName, changes); }
    );
    PromptHaus.util.randomizeGroupWithCap(
      entries.filter(function (e) { return PERSON_APPEARANCE_FIELDS.indexOf(e.fieldName) !== -1; }),
      PERSON_APPEARANCE_RANDOM_CAP, apply, clear
    );
    PromptHaus.util.randomizeGroupWithCap(
      entries.filter(function (e) { return PERSON_STYLING_FIELDS.indexOf(e.fieldName) !== -1 && e.fieldName !== "accessories2"; }),
      PERSON_STYLING_RANDOM_CAP, apply, clear
    );
  }

  function randomize() {
    var state = store.getState();

    for (var a = 0; a < state.adults.count; a++) { randomizePerson("adults", a); }
    for (var k = 0; k < state.kids.count; k++) { randomizePerson("kids", k); }

    // Companion excluded entirely from randomize — an opted-into add-on,
    // not something that should get re-rolled alongside everything else.
    var dynamicEntries = getFamilyDynamicFieldEntries();
    var cappedDynamicFields = FAMILY_PRESENTATION_FIELDS.concat(FAMILY_EXTRAS_FIELDS);
    randomizeEntries(
      dynamicEntries.filter(function (e) { return cappedDynamicFields.indexOf(e.fieldName) === -1; }),
      function (e, changes) { updateFamilyDynamicField(e.fieldName, changes); }
    );
    PromptHaus.util.randomizeGroupWithCap(
      dynamicEntries.filter(function (e) { return FAMILY_PRESENTATION_FIELDS.indexOf(e.fieldName) !== -1; }),
      FAMILY_PRESENTATION_RANDOM_CAP,
      function (fieldName, changes) { updateFamilyDynamicField(fieldName, changes); },
      function (fieldName) { updateFamilyDynamicField(fieldName, { value: "", customValue: "" }); }
    );
    PromptHaus.util.randomizeGroupWithCap(
      dynamicEntries.filter(function (e) { return FAMILY_EXTRAS_FIELDS.indexOf(e.fieldName) !== -1; }),
      FAMILY_EXTRAS_RANDOM_CAP,
      function (fieldName, changes) { updateFamilyDynamicField(fieldName, changes); },
      function (fieldName) { updateFamilyDynamicField(fieldName, { value: "", customValue: "" }); }
    );

    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState());
    PromptHaus.styleDNA.resetContent();
  }

  // ---------------------------------------------------------------------
  // Your Selections
  // ---------------------------------------------------------------------
  function getSelectionsByGroup() {
    var state = store.getState();
    var groups = [];

    var dynamicResolved = PromptHaus.engine.resolveFields(getFamilyDynamicFieldEntries());
    if (dynamicResolved.length) groups.push({ title: "Friends & Family Dynamic", items: dynamicResolved });

    for (var a = 0; a < state.adults.count; a++) {
      var adultResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("adults", a).map(toEntry));
      if (adultResolved.length) groups.push({ title: state.adults.count > 1 ? "Adult " + (a + 1) : "Adult", items: adultResolved });
    }
    for (var k = 0; k < state.kids.count; k++) {
      var kidResolved = PromptHaus.engine.resolveFields(getPersonFieldEntries("kids", k).map(toEntry));
      if (kidResolved.length) groups.push({ title: state.kids.count > 1 ? "Kid " + (k + 1) : "Kid", items: kidResolved });
    }
    var companionResolved = PromptHaus.engine.resolveFields(getCompanionFieldEntries().map(toEntry));
    if (companionResolved.length) groups.push({ title: "Companion", items: companionResolved });

    return groups;
  }

  // Starter Presets — Family Dynamic (vibe/scene) fields only, same
  // reasoning as Couples Mode's own presets: who's actually in the shot
  // stays untouched, a preset is a starting vibe, not a cast choice.
  var PRESETS = [
    {
      id: "awkwardFamilyPhoto",
      name: "The Awkward Family Photo",
      description: "The quintessential cringe studio portrait — stiff smiles, matching ugly sweaters, mottled backdrop.",
      apply: function () {
        updateFamilyDynamicField("relationshipVibe", { value: "the quintessential awkward family photo", customValue: "" });
        updateFamilyDynamicField("groupPose", { value: "stiff, forced studio smiles", customValue: "" });
        updateFamilyDynamicField("coordinationStyle", { value: "matching ugly holiday sweaters", customValue: "" });
        updateFamilyDynamicField("background", { value: "seamless white studio backdrop", customValue: "" });
        updateFamilyDynamicField("timeEra", { value: "90s Y2K", customValue: "" });
        updateFamilyDynamicField("lightingEffects", { value: "studio lighting", customValue: "" });
        updateFamilyDynamicField("framing", { value: "simple frame border", customValue: "" });
      },
    },
    {
      id: "holidayCardClassic",
      name: "Holiday Card Classic",
      description: "Arms around each other, coordinated colors, festive backdrop, gilded frame.",
      apply: function () {
        updateFamilyDynamicField("relationshipVibe", { value: "holiday gathering", customValue: "" });
        updateFamilyDynamicField("groupPose", { value: "arms around each other", customValue: "" });
        updateFamilyDynamicField("coordinationStyle", { value: "coordinated colors", customValue: "" });
        updateFamilyDynamicField("background", { value: "holiday-themed studio backdrop", customValue: "" });
        updateFamilyDynamicField("lightingEffects", { value: "golden hour glow", customValue: "" });
        updateFamilyDynamicField("framing", { value: "gold gilded frame", customValue: "" });
      },
    },
    {
      id: "friendGroupHangout",
      name: "Friend Group Hangout",
      description: "Candid laughing, contrasting styles, cozy living room, no frame.",
      apply: function () {
        updateFamilyDynamicField("relationshipVibe", { value: "friend group", customValue: "" });
        updateFamilyDynamicField("groupPose", { value: "candid laughing", customValue: "" });
        updateFamilyDynamicField("coordinationStyle", { value: "contrasting styles", customValue: "" });
        updateFamilyDynamicField("background", { value: "cozy living room setting", customValue: "" });
        updateFamilyDynamicField("lightingEffects", { value: "soft diffused light", customValue: "" });
        updateFamilyDynamicField("framing", { value: "no frame", customValue: "" });
      },
    },
  ];

  PromptHaus.family = Object.assign({}, store, {
    presets: PRESETS,
    MAX_ADULTS: MAX_ADULTS,
    MAX_KIDS: MAX_KIDS,
    MAX_COMPANIONS: MAX_COMPANIONS,
    setPersonCount: setPersonCount,
    updatePersonField: updatePersonField,
    removePersonSlot: removePersonSlot,
    getPersonFieldEntries: getPersonFieldEntries,
    updateFamilyDynamicField: updateFamilyDynamicField,
    getFamilyDynamicFieldEntries: getFamilyDynamicFieldEntries,
    toggleCompanionInclude: toggleCompanionInclude,
    setCompanionCount: setCompanionCount,
    updateCompanionSlotCategory: updateCompanionSlotCategory,
    updateCompanionSlotField: updateCompanionSlotField,
    removeCompanionSlot: removeCompanionSlot,
    getCompanionFieldEntries: getCompanionFieldEntries,
    toggleAddTextInclude: toggleAddTextInclude,
    updateAddTextField: updateAddTextField,
    getAddTextStyleEntries: getAddTextStyleEntries,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    getSelectionsByGroup: getSelectionsByGroup,
    labels: {
      identity: PERSON_IDENTITY_LABELS,
      appearance: PERSON_APPEARANCE_LABELS,
      styling: PERSON_STYLING_LABELS,
      familyDynamic: FAMILY_DYNAMIC_LABELS,
    },
  });
})();
