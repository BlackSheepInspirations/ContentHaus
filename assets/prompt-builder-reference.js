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
      // "image" (upload + describe) or "prompt" (paste someone else's
      // prompt as loose inspiration) — flat key like image/imageName/
      // description above, not nested, matching this file's convention.
      // Switching branches never clears the other one's data; harmless to
      // leave stale since assemblePrompt only reads the active branch and
      // both are already excluded from Randomize.
      sourceType: "image",
      promptReference: makeField("", [], { isFreeText: true }),
      styleAdjustment: {
        characterType: PromptHaus.util.makeGroupedField("", characterLists.characterTypeGroups),
        artFinish: PromptHaus.util.makeGroupedField("", characterLists.artFinishGroups),
      },
      presentation: {
        pose: PromptHaus.util.makeGroupedField("standing pose", characterLists.poseGroups),
        background: PromptHaus.util.makeGroupedField("", characterLists.backgroundGroups),
        dynamicSceneEffect: makeField("", characterLists.dynamicSceneEffect),
        timeEra: makeField("", characterLists.timeEra),
        cameraAngle: makeField("front view", characterLists.cameraAngle),
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

  function setSourceType(type) {
    store.setState({ sourceType: type === "prompt" ? "prompt" : "image" });
  }

  function updatePromptReference(changes) {
    var state = store.getState();
    store.setState({ promptReference: Object.assign({}, state.promptReference, changes) });
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
  // same pattern as Text Mode's own Second Phrase.
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

  function assemblePrompt() {
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var entries = [];

    // Image branch: the shopper's own typed description of an uploaded
    // reference photo (see file header — the image itself never leaves the
    // browser). Prompt branch: a prompt pasted from elsewhere, used only
    // as loose creative direction — see the intro construction below for
    // the anti-plagiarism framing that makes this distinct from just
    // reusing someone else's wording verbatim.
    var sourceType = store.getState().sourceType;
    var sourceText = sourceType === "prompt"
      ? (store.getState().promptReference.value || "").trim()
      : (store.getState().description.value || "").trim();
    var sourceLabel = sourceType === "prompt" ? "Reference Prompt" : "Reference Description";
    if (sourceText) entries.push({ label: sourceLabel, field: makeField(sourceText) });

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
    var reimaginedStyle = PromptHaus.engine.resolveFieldValue(
      PromptHaus.engine.withPromptLookup(reimaginedStyleEntry.field, characterLists.characterTypePrompts)
    );

    // Art Finish also carries a full instruction clause ("render the
    // illustration as handcrafted crochet amigurumi with...") rather than
    // a short word — pulled out of the flat comma list into its own
    // sentence ahead of the quality outro instead, matching the placement
    // fix applied to every other multi-subject mode, so it doesn't read as
    // just another equal-weight tag next to Pose/Background/short fields.
    var artFinishEntry = getStyleAdjustmentEntries().filter(function (e) {
      return e.fieldName === "artFinish";
    })[0];
    var artFinishText = artFinishEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(artFinishEntry.field, characterLists.artFinishPrompts))
      : "";

    entries = entries.concat(
      getStyleAdjustmentEntries()
        .filter(function (e) {
          return e.fieldName !== "characterType" && e.fieldName !== "artFinish";
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
    entries.push({ label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme });
    entries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    entries.push({ label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience });
    entries.push({ label: "Mood", field: PromptHaus.styleDNA.getState().mood });
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
    // Reimagined Style carries a full descriptive paragraph (chunk 3), not
    // a short word — embedding it mid-sentence as "in a {paragraph}
    // style —" reads as broken once the paragraph's own closing sentence
    // collides with what follows. Given its own "Style: ..." sentence
    // instead, matching the same fix already applied to every other
    // mode's Illustration Style/Art Finish placement.
    var introParts = [];
    if (sourceType === "prompt") {
      // The anti-plagiarism instruction lives here, in the assembled
      // prompt's own intro sentence addressed to the receiving AI — not
      // just UI copy — mirroring exactly how the image branch already
      // resolves its own "description vs. chosen style" conflict below.
      introParts.push(countPhrase + (sourceText ? " inspired by the following prompt, reimagined as an original composition." : " of an original composition"));
      if (reimaginedStyle) introParts.push("Style: " + reimaginedStyle);
      if (sourceText) introParts.push("Use the prompt only as loose creative direction for subject and composition; do not reuse its exact wording, and produce an original result, not a copy:");
    } else {
      introParts.push(countPhrase + (sourceText ? " reinterpreting the following description as an original illustration." : " of an image described as"));
      if (reimaginedStyle) introParts.push("Style: " + reimaginedStyle);
      if (sourceText) introParts.push("Replace any photographic, camera, or realistic-photo qualities in the description with that style, keeping only the subject, pose, and composition it describes:");
    }
    var intro = introParts.join(" ");
    var stickerSheetGuard = PromptHaus.engine.stickerSheetGuard(count);
    var outro = (stickerSheetGuard ? stickerSheetGuard + " " : "") +
      (artFinishText ? "Art finish: " + artFinishText + " " : "") +
      "High quality digital illustration, immaculate composition, vibrant and polished finish with professional rendering.";
    return PromptHaus.engine.buildSentence({
      intro: intro,
      fieldEntries: entries,
      outro: outro,
    });
  }

  function getSelectionsByGroup() {
    var groups = [];

    var sourceType = store.getState().sourceType;
    var sourceText = sourceType === "prompt"
      ? (store.getState().promptReference.value || "").trim()
      : (store.getState().description.value || "").trim();
    var sourceGroupTitle = sourceType === "prompt" ? "Reference Prompt" : "Reference Description";
    if (sourceText) groups.push({ title: sourceGroupTitle, items: [{ label: sourceType === "prompt" ? "Prompt" : "Description", value: sourceText }] });

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
      { label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience },
      { label: "Mood", field: PromptHaus.styleDNA.getState().mood },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ]);
    if (holidayResolved.length) groups.push({ title: "Concept & Filter", items: holidayResolved });

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

  // "Regenerate" — distinct from the full Randomize above: reroll just a
  // couple of "key callout" fields (pooled so it's not always the exact
  // same pair) while leaving the pasted/typed source text, Art Finish, and
  // everything else untouched. Works for both source types — the "reroll
  // a little, keep my text" need doesn't depend on which branch produced
  // that text. Plain tunable pool/cap, same convention as
  // PRESENTATION_RANDOM_CAP above.
  var REGENERATE_CAP = 2;
  function getRegenerateEntries() {
    var presentation = getPresentationEntries().filter(function (e) {
      return e.fieldName === "background" || e.fieldName === "pose";
    });
    return getStyleAdjustmentEntries().concat(presentation);
  }
  function regenerate() {
    PromptHaus.util.randomizeGroupWithCap(
      getRegenerateEntries(),
      REGENERATE_CAP,
      function (fieldName, changes) {
        if (fieldName === "characterType" || fieldName === "artFinish") updateStyleAdjustmentField(fieldName, changes);
        else updatePresentationField(fieldName, changes);
      },
      function (fieldName) {
        if (fieldName === "characterType" || fieldName === "artFinish") updateStyleAdjustmentField(fieldName, { value: "", customValue: "" });
        else updatePresentationField(fieldName, { value: "", customValue: "" });
      }
    );
  }

  PromptHaus.reference = Object.assign({}, store, {
    setImage: setImage,
    clearImage: clearImage,
    updateDescription: updateDescription,
    setSourceType: setSourceType,
    updatePromptReference: updatePromptReference,
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
    regenerate: regenerate,
    reset: reset,
  });
})();
