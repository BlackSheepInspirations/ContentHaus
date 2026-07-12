/**
 * The AI Creator's Content Haus — Character Mode's Video Motion Prompt
 * companion. Depends on prompt-builder-styledna.js (shared util/store
 * primitives) and must load before prompt-builder-ui.js, which renders
 * it as a collapsible section inside renderCharacterPanel().
 *
 * State/logic only — rendering lives entirely in prompt-builder-ui.js,
 * matching this codebase's own convention (PromptHaus.ui exports only
 * renderApp(); every other prompt-builder-*.js file holds state/assembly
 * logic, never DOM-building).
 *
 * Fixes a real two-step workflow: today, after generating a character
 * image prompt here and rendering it elsewhere, getting that image
 * animated means going back to write a second, separate motion prompt
 * by hand. This assembles that second prompt right alongside the first,
 * scoped to motion/camera/duration/audio only — it does not re-describe
 * the character or scene, since image-to-video tools take the rendered
 * image as their visual reference already.
 *
 * Per-tool phrasing differences (see TARGET_TOOL_STYLES) are reasonable
 * natural-language nudges, not verified exact prompt syntax for any of
 * these tools — they change fast and aren't something to guess at with
 * confidence. Treat them as a starting point, not a guarantee.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;

  var TARGET_TOOL_OPTIONS = ["MidJourney (video/animate)", "Kling AI", "Runway (Gen-3/Gen-4)", "Generic / Any Tool"];
  var CAMERA_MOVEMENT_OPTIONS = ["Static / Locked", "Slow Pan", "Slow Zoom In", "Zoom Out", "Tracking Shot", "Handheld / Subtle Shake", "Dolly / Push-In"];
  var DURATION_OPTIONS = ["3 seconds", "5 seconds", "8 seconds", "10 seconds", "15 seconds"];
  var AUDIO_TYPE_OPTIONS = ["No Audio", "Ambient / Environmental Sound", "Background Music", "Dialogue / Voiceover"];
  var QUALITY_DESCRIPTOR_OPTIONS = ["Cinematic Quality", "Crisp & Clean / Commercial Quality", "Natural & Realistic Motion"];

  // Natural-language phrasing nudges per tool — not verified exact syntax
  // for any of these (see file header). Each returns how to open the
  // motion sentence given the resolved field values.
  var TARGET_TOOL_STYLES = {
    "MidJourney (video/animate)": function (v) {
      return "Animate this image: " + v.motionDescription + ". Camera: " + v.cameraMovement + ".";
    },
    "Kling AI": function (v) {
      return "Camera: " + v.cameraMovement + ". " + v.motionDescription + ".";
    },
    "Runway (Gen-3/Gen-4)": function (v) {
      return "A cinematic shot where " + v.motionDescription + ", with a " + v.cameraMovement.toLowerCase() + " camera movement.";
    },
    "Generic / Any Tool": function (v) {
      return v.motionDescription + ". Camera movement: " + v.cameraMovement + ".";
    },
  };

  function buildInitialState() {
    return {
      targetTool: makeField(TARGET_TOOL_OPTIONS[0], TARGET_TOOL_OPTIONS),
      motionDescription: makeField("", [], { isFreeText: true }),
      cameraMovement: makeField(CAMERA_MOVEMENT_OPTIONS[0], CAMERA_MOVEMENT_OPTIONS),
      duration: makeField(DURATION_OPTIONS[1], DURATION_OPTIONS),
      audioType: makeField(AUDIO_TYPE_OPTIONS[0], AUDIO_TYPE_OPTIONS),
      dialogueText: makeField("", [], { isFreeText: true }),
      qualityDescriptor: makeField(QUALITY_DESCRIPTOR_OPTIONS[0], QUALITY_DESCRIPTOR_OPTIONS),
      enabled: false,
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function updateField(fieldName, changes) {
    PromptHaus.util.updateField(store, fieldName, changes);
  }

  function setEnabled(enabled) {
    store.setState({ enabled: enabled });
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function resolved(field) {
    return PromptHaus.engine.resolveFieldValue(field);
  }

  function assemblePrompt() {
    var state = store.getState();
    var tool = resolved(state.targetTool) || TARGET_TOOL_OPTIONS[0];
    var motion = resolved(state.motionDescription) || "the subject moves naturally";
    var camera = resolved(state.cameraMovement) || CAMERA_MOVEMENT_OPTIONS[0];
    var duration = resolved(state.duration) || DURATION_OPTIONS[1];
    var audio = resolved(state.audioType) || AUDIO_TYPE_OPTIONS[0];
    var quality = resolved(state.qualityDescriptor) || QUALITY_DESCRIPTOR_OPTIONS[0];

    var buildOpening = TARGET_TOOL_STYLES[tool] || TARGET_TOOL_STYLES["Generic / Any Tool"];
    var sentence = buildOpening({ motionDescription: motion, cameraMovement: camera });

    var audioClause;
    if (audio === "Dialogue / Voiceover") {
      var dialogue = resolved(state.dialogueText);
      audioClause = dialogue ? "Dialogue: \"" + dialogue + "\"." : "Include spoken dialogue.";
    } else if (audio === "No Audio") {
      audioClause = "No audio.";
    } else {
      audioClause = audio + ".";
    }

    var text = [sentence, "Duration: " + duration + ".", audioClause, quality + "."].join(" ");
    return { text: text };
  }

  PromptHaus.characterVideo = {
    TARGET_TOOL_OPTIONS: TARGET_TOOL_OPTIONS,
    CAMERA_MOVEMENT_OPTIONS: CAMERA_MOVEMENT_OPTIONS,
    DURATION_OPTIONS: DURATION_OPTIONS,
    AUDIO_TYPE_OPTIONS: AUDIO_TYPE_OPTIONS,
    QUALITY_DESCRIPTOR_OPTIONS: QUALITY_DESCRIPTOR_OPTIONS,
    getState: store.getState,
    setState: store.setState,
    updateField: updateField,
    setEnabled: setEnabled,
    reset: reset,
    assemblePrompt: assemblePrompt,
  };
})();
