/**
 * The AI Creator's Prompt Haus — Combined ("Social Post") Mode
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js,
 * prompt-builder-character.js, prompt-builder-text.js, and
 * prompt-builder-graphics.js.
 *
 * One woven prompt, not three side-by-side ones. Character's full
 * descriptors, Text's content/styling (composed into one clause, same
 * pattern as Text Mode's own Accent sub-panel), and Graphics's own
 * descriptors all feed a single buildSentence() call so the assembled
 * prompt reads as one cohesive scene — a real-world test confirmed
 * current image models render legible in-image text well enough that a
 * single merged prompt is worth using over three separate ones a shopper
 * would otherwise have to hand-composite.
 *
 * Reuses the SAME PromptHaus.character/PromptHaus.text/PromptHaus.graphics
 * singleton stores the standalone Character/Text/Graphics tabs edit —
 * building a character in the Character tab and switching to Combined
 * shows that same character, ready to pair with text and a graphic,
 * rather than starting over in a separate copy.
 *
 * Character Position: where the character sits relative to the text in
 * the one combined scene (left/right/above/below) — the only
 * combined-specific field left, since Character's own descriptors are
 * already included in full and no longer need a derived "mascot" stand-in
 * phrase the way the old 3-box version did.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;

  var CHARACTER_POSITION_OPTIONS = sortAlpha(["none", "left of text", "right of text", "above text", "below text"]);

  // Character's Presentation/Extras groups overlap with Graphics's Frame
  // It/What Is It groups (same option lists — Graphics reuses Character's
  // via PromptHaus.character.optionLists). In standalone Character Mode
  // that overlap doesn't matter since each mode is self-contained, but in
  // Combined Mode both groups now feed the SAME single scene — keeping
  // both active produced conflicting output ("no frame ... no frame", two
  // different backgrounds fighting each other in one sentence). Graphics's
  // Frame It/What Is It own the whole-scene framing/backdrop/fantasy-prop
  // choices for Combined; Character keeps only its own pose/time-era/
  // camera-angle, which Graphics has no equivalent for.
  var CHARACTER_SCENE_OVERLAP_FIELDS = ["background", "dynamicSceneEffect", "lightingEffects", "framing"];

  function getCharacterEntriesForUnified() {
    return PromptHaus.character.getActiveFieldEntries().filter(function (e) {
      if (e.groupName === "extras") return false;
      // Graphics's Style It (rendered once at the top of Combined) is the
      // one overall style choice now — Character's own Style group
      // (Character Type/Art Finish) would just contradict it.
      if (e.groupName === "style") return false;
      if (CHARACTER_SCENE_OVERLAP_FIELDS.indexOf(e.fieldName) > -1) return false;
      return true;
    });
  }

  function buildInitialState() {
    return {
      characterPosition: makeField("", CHARACTER_POSITION_OPTIONS),
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state[fieldName], changes);
    store.setState(patch);
  }

  // Text's content + styling composed into one descriptive clause — so
  // "Hello World" and its letter style/color/case/texture read as a single
  // unit in the combined sentence rather than the raw text floating loose
  // among unrelated comma-separated descriptors.
  function buildTextClause() {
    var text = PromptHaus.text;
    var yourText = (text.getState().yourText.value || "").trim();
    if (!yourText) return "";

    var styleEntries = text
      .getFixedEntries()
      .concat(text.getVariableEntries())
      .filter(function (e) {
        return e.fieldName !== "yourText";
      })
      .map(function (e) {
        return { label: e.label, field: e.field };
      });
    var descriptors = PromptHaus.engine.resolveFields(styleEntries).map(function (r) {
      return r.value;
    });

    var clause = 'the text "' + yourText + '"';
    if (descriptors.length) clause += " styled as " + descriptors.join(", ");

    var accentField = text.buildAccentField();
    if (accentField) {
      var accentText = PromptHaus.engine.resolveFieldValue(accentField);
      if (accentText) clause += ", with " + accentText;
    }
    return clause;
  }

  function assembleUnifiedPrompt() {
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var entries = [];

    entries = entries.concat(
      getCharacterEntriesForUnified().map(function (e) {
        return { label: e.label, field: e.field };
      })
    );

    var textClause = buildTextClause();
    if (textClause) entries.push({ label: "Text", field: makeField(textClause) });

    var position = PromptHaus.engine.resolveFieldValue(store.getState().characterPosition);
    if (position) entries.push({ label: "Character Position", field: makeField(position) });

    // Graphics's contribution is scoped to just Style It (the one overall
    // style choice — Character's own Style group is excluded above) +
    // Custom Vanity Plates + Transportation. What Is It and Frame It are
    // covered by Character's Identity/Companion and Presentation instead.
    entries = entries.concat(
      PromptHaus.graphics.buildEntriesForCombined().map(function (e) {
        return { label: e.label, field: e.field };
      })
    );

    // Shared Style DNA — added once here, not per-panel, since this is now
    // one prompt describing one scene.
    entries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    entries.push({ label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme });
    entries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    entries.push({ label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience });
    entries.push({ label: "Mood", field: PromptHaus.styleDNA.getState().mood });
    entries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("combined");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);

    var stickerSheetGuard = PromptHaus.engine.stickerSheetGuard(count);
    var intro = "Create " + count + (count === 1 ? " variation" : " variations") +
      " of one cohesive image combining a";
    var outro = (stickerSheetGuard ? stickerSheetGuard + " " : "") +
      "High quality digital illustration, immaculate composition, vibrant and polished finish with professional rendering.";
    return PromptHaus.engine.buildSentence({
      intro: intro,
      fieldEntries: entries,
      outro: outro,
    });
  }

  // Mirrors Character Mode's own getSelectionsByGroup(), but restricted to
  // the same fields the unified assembler actually uses — so the "Your
  // Selections" panel never shows a value that got silently dropped from
  // the prompt.
  function getCharacterSelectionsForUnified() {
    var titleFor = {
      humanIdentity: "Human Identity", animalIdentity: "Animal Identity",
      appearance: "Appearance", styling: "Styling", presentation: "Presentation", companion: "Companion",
    };
    var order = ["humanIdentity", "animalIdentity", "appearance", "styling", "presentation", "companion"];
    var entries = getCharacterEntriesForUnified();
    var groups = [];
    order.forEach(function (groupName) {
      var groupEntries = entries
        .filter(function (e) {
          return e.groupName === groupName;
        })
        .map(function (e) {
          return { label: e.label, field: e.field };
        });
      var resolved = PromptHaus.engine.resolveFields(groupEntries);
      if (resolved.length) groups.push({ title: titleFor[groupName], items: resolved });
    });
    return groups;
  }

  function getSelectionsByGroup() {
    var groups = [];
    groups = groups.concat(getCharacterSelectionsForUnified());

    var textClause = buildTextClause();
    if (textClause) groups.push({ title: "Text", items: [{ label: "Text", value: textClause }] });

    var position = PromptHaus.engine.resolveFieldValue(store.getState().characterPosition);
    if (position) groups.push({ title: "Character Position", items: [{ label: "Character Position", value: position }] });

    groups = groups.concat(PromptHaus.graphics.getSelectionsByGroupForCombined());
    return groups;
  }

  // Randomizes/resets all three underlying panels plus Combined's own
  // field — Combined Mode should be usable without first visiting the
  // Character/Text/Graphics tabs.
  function randomize() {
    PromptHaus.character.randomize();
    PromptHaus.text.randomize();
    PromptHaus.graphics.randomize();
    var state = store.getState();
    if (state.characterPosition.includeInPrompt) {
      var options = state.characterPosition.options || [];
      if (options.length) {
        updateField("characterPosition", {
          value: options[Math.floor(Math.random() * options.length)],
          customValue: "",
        });
      }
    }
  }

  function reset() {
    PromptHaus.character.reset();
    PromptHaus.text.reset();
    PromptHaus.graphics.reset();
    store.setState(buildInitialState());
  }

  // ---------------------------------------------------------------------
  // Collection Presets — Combined Mode is the only place Character, Text,
  // and Graphics are all visible together, so this is the one spot a
  // preset can span all three at once (each mode's own Starter Presets
  // row is intentionally hidden here — see renderCharacterPanel/
  // renderTextPanel/renderGraphicsPanel's combinedMode param — since a
  // single-mode preset doesn't make sense once you're mixing pieces from
  // three). Only sets fields Combined's unified prompt actually includes
  // (no Character Style/Extras, no Graphics What Is It/Frame It — see
  // getCharacterEntriesForUnified/buildEntriesForCombined above), so
  // nothing set here ever silently gets dropped from the assembled prompt.
  // ---------------------------------------------------------------------
  var COLLECTION_PRESETS = [
    {
      id: "coffeeLoverCollection",
      name: "Coffee Lover Collection",
      description: "Cozy hoodie, handwritten marker text, copper/bronze, cartoon style.",
      apply: function () {
        PromptHaus.styleDNA.setNiche("coffee culture");
        PromptHaus.character.updateNestedField("styling", "outfit", { value: "hoodie and sweatpants", customValue: "" });
        PromptHaus.text.updateField("letterStyle", { value: "marker lettering", customValue: "" });
        PromptHaus.text.updateField("colorScheme", { value: "copper / bronze", customValue: "" });
        PromptHaus.graphics.setStyleCategory("illustrated");
        PromptHaus.graphics.updateIllustratedField("characterType", { value: "cartoon style illustration", customValue: "" });
      },
    },
    {
      id: "faithBasedCollection",
      name: "Faith-Based Collection",
      description: "Praise pose, brush script, champagne gold, a cross worked into the imagery.",
      apply: function () {
        PromptHaus.styleDNA.setTheme("faith journey");
        PromptHaus.character.updateNestedField("presentation", "pose", { value: "lifting hands in praise", customValue: "" });
        PromptHaus.text.updateField("letterStyle", { value: "brush lettering script", customValue: "" });
        PromptHaus.text.updateField("colorScheme", { value: "champagne gold", customValue: "" });
        PromptHaus.graphics.setStyleCategory("illustrated");
        PromptHaus.graphics.updateIllustratedField("characterType", { value: "realistic human illustration", customValue: "" });
        PromptHaus.styleDNA.updateImagerySlot("faithBased1", { value: "cross", customValue: "" });
      },
    },
    {
      id: "streetwearCollection",
      name: "Streetwear Icon Collection",
      description: "Leather jacket, graffiti typography, neon mix, cyberpunk illustration.",
      apply: function () {
        PromptHaus.styleDNA.setNiche("hustle culture");
        PromptHaus.character.updateNestedField("styling", "outfit", { value: "leather jacket with ripped jeans", customValue: "" });
        PromptHaus.text.updateField("letterStyle", { value: "graffiti streetwear typography", customValue: "" });
        PromptHaus.text.updateField("colorScheme", { value: "neon mix", customValue: "" });
        PromptHaus.graphics.setStyleCategory("illustrated");
        PromptHaus.graphics.updateIllustratedField("characterType", { value: "cyberpunk neon illustration", customValue: "" });
      },
    },
    {
      id: "weddingCollection",
      name: "Wedding/Boho Collection",
      description: "Silk slip dress, calligraphy, pastel gradient, soft airbrushed finish.",
      apply: function () {
        PromptHaus.styleDNA.setTheme("marriage/wedding/engagement");
        PromptHaus.character.updateNestedField("styling", "outfit", { value: "silk slip dress with blazer", customValue: "" });
        PromptHaus.text.updateField("letterStyle", { value: "calligraphy", customValue: "" });
        PromptHaus.text.updateField("colorScheme", { value: "pastel gradient", customValue: "" });
        PromptHaus.graphics.setStyleCategory("illustrated");
        PromptHaus.graphics.updateIllustratedField("characterType", { value: "fine art oil portrait", customValue: "" });
        PromptHaus.graphics.updateIllustratedField("artFinish", { value: "soft airbrushed finish", customValue: "" });
        PromptHaus.styleDNA.updateImagerySlot("holiday1", { value: "wedding flowers", customValue: "" });
      },
    },
    {
      id: "patrioticCollection",
      name: "Patriotic/Military Collection",
      description: "Military dress uniform, bold metal-punk lettering, flag and eagle imagery.",
      apply: function () {
        PromptHaus.character.updateNestedField("humanIdentity", "occupationNiche", { value: "veteran", customValue: "" });
        PromptHaus.character.updateNestedField("styling", "outfit", { value: "military dress uniform", customValue: "" });
        PromptHaus.text.updateField("letterStyle", { value: "heavy metal punk", customValue: "" });
        PromptHaus.graphics.setStyleCategory("illustrated");
        PromptHaus.graphics.updateIllustratedField("characterType", { value: "realistic human illustration", customValue: "" });
        PromptHaus.styleDNA.updateImagerySlot("militaryPatriotic1", { value: "american flag", customValue: "" });
        PromptHaus.styleDNA.updateImagerySlot("militaryPatriotic2", { value: "bald eagle", customValue: "" });
      },
    },
  ];

  PromptHaus.combined = Object.assign({}, store, {
    collectionPresets: COLLECTION_PRESETS,
    SCENE_OVERLAP_FIELDS: CHARACTER_SCENE_OVERLAP_FIELDS,
    updateField: updateField,
    assembleUnifiedPrompt: assembleUnifiedPrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    randomize: randomize,
    reset: reset,
  });
})();
