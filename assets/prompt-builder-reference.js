/**
 * The AI Creator's Prompt Haus — Reference Mode
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js,
 * prompt-builder-character.js (reuses its Character Type/Art Finish
 * lists), and prompt-builder-text.js (reuses its Letter Style/Color
 * Scheme/Text Case/Text Effects lists).
 *
 * Not automatic image analysis — that requires a vision-capable AI model
 * and a backend to call it, neither of which this static, client-side
 * theme has. The uploaded image is a pure visual reference for the
 * shopper: it's read into the browser for preview only, never uploaded or
 * analyzed anywhere. What actually builds the prompt is the shopper's own
 * typed description of that reference, which this mode then layers the
 * same production-specific finishing details onto that every other mode
 * already gets (Style Adjustment, optional Text, plus the shared Style
 * DNA bar) — the details a generic "describe this image" answer from a
 * general AI tool wouldn't think to include.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var characterLists = PromptHaus.character.optionLists;
  var textLists = PromptHaus.text.optionLists;

  var STYLE_ADJUSTMENT_LABELS = {
    characterType: "Reimagined Style",
    artFinish: "Art Finish",
  };
  // Same 7 fields as Character Mode's own Presentation group — lets
  // someone override the scene/composition of the recreated image, not
  // just its overall style (Style Adjustment) or add-on text.
  var PRESENTATION_LABELS = {
    pose: "Pose", background: "Background", dynamicSceneEffect: "Scene Effect",
    timeEra: "Time / Era", cameraAngle: "Camera Angle", lightingEffects: "Lighting Effects", framing: "Framing",
  };
  var ADD_TEXT_LABELS = {
    text: "Text Content",
    letterStyle: "Letter Style",
    colorScheme: "Color Scheme",
    textCase: "Text Case",
    textEffects: "Text Effects",
  };

  function buildInitialState() {
    return {
      // Data URL string or null — lives only in the browser, never sent
      // anywhere, never part of the assembled prompt.
      image: null,
      imageName: "",
      description: makeField("", [], { isFreeText: true }),
      styleAdjustment: {
        characterType: PromptHaus.util.makeGroupedField("", characterLists.characterTypeGroups),
        artFinish: makeField("", characterLists.artFinish),
      },
      presentation: {
        pose: makeField("standing pose", characterLists.pose),
        background: PromptHaus.util.makeGroupedField("", characterLists.backgroundGroups),
        dynamicSceneEffect: makeField("", characterLists.dynamicSceneEffect),
        timeEra: makeField("", characterLists.timeEra),
        cameraAngle: makeField("front view", characterLists.cameraAngle),
        lightingEffects: makeField("studio lighting", characterLists.lightingEffects),
        framing: makeField("no frame", characterLists.framing),
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

  function setImage(dataUrl, name) {
    store.setState({ image: dataUrl, imageName: name || "" });
  }

  function clearImage() {
    store.setState({ image: null, imageName: "" });
  }

  function updateDescription(changes) {
    var state = store.getState();
    store.setState({ description: Object.assign({}, state.description, changes) });
  }

  function updateStyleAdjustmentField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.styleAdjustment[fieldName], changes);
    store.setState({ styleAdjustment: Object.assign({}, state.styleAdjustment, patch) });
  }

  function updatePresentationField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.presentation[fieldName], changes);
    store.setState({ presentation: Object.assign({}, state.presentation, patch) });
  }

  function getPresentationEntries() {
    var presentation = store.getState().presentation;
    return Object.keys(PRESENTATION_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: PRESENTATION_LABELS[fieldName], field: presentation[fieldName] };
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

  function getStyleAdjustmentEntries() {
    var styleAdjustment = store.getState().styleAdjustment;
    return Object.keys(STYLE_ADJUSTMENT_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: STYLE_ADJUSTMENT_LABELS[fieldName], field: styleAdjustment[fieldName] };
    });
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

  // Composes the typed text + its own styling into one descriptive clause,
  // same pattern as Text Mode's own Second Phrase.
  function buildTextClause() {
    var addText = store.getState().addText;
    if (!addText.include) return "";
    var text = (addText.text.value || "").trim();
    if (!text) return "";
    var descriptors = PromptHaus.engine.resolveFields(
      getAddTextStyleEntries().map(function (e) {
        return { label: e.label, field: e.field };
      })
    ).map(function (r) {
      return r.value;
    });
    var clause = 'the text "' + text + '"';
    if (descriptors.length) clause += " styled as " + descriptors.join(", ");
    return clause;
  }

  function assemblePrompt() {
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var entries = [];

    var description = (store.getState().description.value || "").trim();
    if (description) entries.push({ label: "Reference Description", field: makeField(description) });

    // Reimagined Style (characterType) gets folded into the intro instead
    // of riding along as just another comma-separated descriptor — a
    // typed description is often generated by reverse-engineering a real
    // photo (e.g. through an external vision-capable AI), so it's usually
    // full of photographic/camera language. Sitting that next to "watercolor
    // illustration style" as two equal-weight tags gives the receiving AI
    // no signal about which one should win, and it frequently either
    // blends them badly or refuses to stylize at all. Explicitly saying
    // "replace the photographic qualities with this style" resolves that
    // conflict in the instruction itself, rather than trying to scrub
    // arbitrary free text for photo-related words (which would be both
    // unreliable — infinite ways to phrase "photorealistic" — and
    // surprising, silently editing what someone typed). Art Finish still
    // rides as a normal trailing descriptor; it's a finish detail, not the
    // core style, so it doesn't compete with the description the same way.
    var reimaginedStyleEntry = getStyleAdjustmentEntries().filter(function (e) {
      return e.fieldName === "characterType";
    })[0];
    var reimaginedStyle = PromptHaus.engine.resolveFieldValue(reimaginedStyleEntry.field);

    entries = entries.concat(
      getStyleAdjustmentEntries()
        .filter(function (e) {
          return e.fieldName !== "characterType";
        })
        .map(function (e) {
          return { label: e.label, field: e.field };
        })
    );

    entries = entries.concat(
      getPresentationEntries().map(function (e) { return { label: e.label, field: e.field }; })
    );

    var textClause = buildTextClause();
    if (textClause) entries.push({ label: "Text", field: makeField(textClause) });

    entries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    entries.push({ label: "Theme", field: PromptHaus.styleDNA.getState().theme });
    entries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    entries.push({ label: "Mockup View", field: PromptHaus.styleDNA.getState().mockupView });
    entries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("reference");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);

    // "Recreating the reference image" was always misleading — the actual
    // uploaded image never leaves the browser (by design; see the note at
    // the top of this file), so whatever AI tool the assembled text gets
    // pasted into never receives it. The prompt only ever has the typed
    // description to work with, so it should say that plainly.
    var countPhrase = "Create " + count + (count === 1 ? " variation" : " variations");
    var intro = reimaginedStyle
      ? countPhrase +
        " reinterpreting the following description entirely in a " + reimaginedStyle +
        " style — replace any photographic, camera, or realistic-photo qualities in the description with that style, keeping only the subject, pose, and composition it describes:"
      : countPhrase + " of an image described as";
    return PromptHaus.engine.buildSentence({
      intro: intro,
      fieldEntries: entries,
      outro: "High quality digital illustration, immaculate composition, vibrant and polished finish with professional rendering.",
    });
  }

  function getSelectionsByGroup() {
    var groups = [];

    var description = (store.getState().description.value || "").trim();
    if (description) groups.push({ title: "Reference Description", items: [{ label: "Description", value: description }] });

    var styleResolved = PromptHaus.engine.resolveFields(
      getStyleAdjustmentEntries().map(function (e) {
        return { label: e.label, field: e.field };
      })
    );
    if (styleResolved.length) groups.push({ title: "Style Adjustment", items: styleResolved });

    var presentationResolved = PromptHaus.engine.resolveFields(
      getPresentationEntries().map(function (e) { return { label: e.label, field: e.field }; })
    );
    if (presentationResolved.length) groups.push({ title: "Presentation", items: presentationResolved });

    var textClause = buildTextClause();
    if (textClause) groups.push({ title: "Text", items: [{ label: "Text", value: textClause }] });

    var holidayResolved = PromptHaus.engine.resolveFields([
      { label: "Holiday", field: PromptHaus.styleDNA.getState().holiday },
      { label: "Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Mockup View", field: PromptHaus.styleDNA.getState().mockupView },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ]);
    if (holidayResolved.length) groups.push({ title: "Holiday, Theme & Niche", items: holidayResolved });

    var imageryEntries = PromptHaus.styleDNA.getImageryEntries();
    if (imageryEntries.length) {
      groups.push({
        title: "Imagery",
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

  // Image and Description are never randomized — same treatment as
  // Character/Text's own free-text fields. Presentation capped to 3 of 7,
  // same rationale/number as Character Mode's own Presentation group.
  var PRESENTATION_RANDOM_CAP = 3;

  function randomize() {
    randomizeFieldList(getStyleAdjustmentEntries(), updateStyleAdjustmentField);
    PromptHaus.util.randomizeGroupWithCap(
      getPresentationEntries(),
      PRESENTATION_RANDOM_CAP,
      function (fieldName, changes) { updatePresentationField(fieldName, changes); },
      function (fieldName) { updatePresentationField(fieldName, { value: "", customValue: "" }); }
    );
    if (store.getState().addText.include) {
      randomizeFieldList(getAddTextStyleEntries(), updateAddTextField);
    }
    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState());
    PromptHaus.styleDNA.resetContent();
  }

  PromptHaus.reference = Object.assign({}, store, {
    setImage: setImage,
    clearImage: clearImage,
    updateDescription: updateDescription,
    updateStyleAdjustmentField: updateStyleAdjustmentField,
    updatePresentationField: updatePresentationField,
    getPresentationEntries: getPresentationEntries,
    toggleAddTextInclude: toggleAddTextInclude,
    updateAddTextField: updateAddTextField,
    getStyleAdjustmentEntries: getStyleAdjustmentEntries,
    getAddTextStyleEntries: getAddTextStyleEntries,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    randomize: randomize,
    reset: reset,
  });
})();
