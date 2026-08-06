/**
 * The AI Creator's Marketing Haus — Video Motion Prompt Generator
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-styledna.js, marketing-haus-brandkit.js, and
 * marketing-haus-generators.js (all must load first — this file just
 * registers itself with that engine).
 *
 * The Marketing Haus counterpart to Content Haus's Character Mode video
 * companion (assets/prompt-builder-character-video.js) — same idea
 * (a second, separate motion prompt for animating an already-rendered
 * image), but stripped down for this Haus's own use case: restricted to
 * photo-realistic commercial content only (no art-style field at all —
 * baked into the locked template, same trick Retro Wall Art used to
 * fix its own style without exposing a field for it), and folding in
 * the active Brand Kit's mood so the motion description stays
 * consistent with the business's established aesthetic rather than
 * generic.
 *
 * Per-tool phrasing differences (see TARGET_TOOL_INSTRUCTIONS) are
 * reasonable natural-language nudges, not verified exact prompt syntax
 * for any of these tools — flagged the same way to the owner as
 * Content Haus's own version.
 *
 * Not wired into the Look Lock `aesthetic` bridge — motion/camera
 * framing isn't an aesthetic to lock the way art style/palette are,
 * same reasoning already applied to Graphics Haus's Mascot Generator.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  // Vocabulary + openers + locked suffix now live in the shared module
  // marketing-haus-motion.js (also used by the Mockup Studio companion).
  var motion = MarketingHaus.motion;
  var TARGET_TOOL_OPTIONS = motion.TOOL_OPTIONS;
  var CAMERA_MOVEMENT_OPTIONS = motion.CAMERA_OPTIONS;
  var DURATION_OPTIONS = motion.DURATION_OPTIONS;
  var AUDIO_TYPE_OPTIONS = motion.AUDIO_OPTIONS;
  var QUALITY_DESCRIPTOR_OPTIONS = motion.QUALITY_OPTIONS;
  var LOCKED_SUFFIX = motion.LOCKED_SUFFIX;

  MarketingHaus.generatorEngine.registerGenerator({
    id: "video-motion-prompt",
    textOnly: true,
    label: "Video Motion Prompt Generator",
    icon: "video",
    description: "A second, separate prompt for animating an already-rendered photo-realistic image — for pasting into an image-to-video tool once the image exists.",
    fieldGroupTitle: "Customize Your Motion Prompt",

    fields: [
      { name: "motionDescription", label: "Motion / Action", isFreeText: true, defaultValue: "the subject moves naturally", placeholder: "e.g. she takes a sip of her coffee and smiles" },
      { name: "targetTool", label: "Target Tool", options: TARGET_TOOL_OPTIONS, defaultValue: TARGET_TOOL_OPTIONS[0] },
      { name: "cameraMovement", label: "Camera Movement", options: CAMERA_MOVEMENT_OPTIONS, defaultValue: CAMERA_MOVEMENT_OPTIONS[0] },
      { name: "duration", label: "Duration", options: DURATION_OPTIONS, defaultValue: DURATION_OPTIONS[1] },
      { name: "audioType", label: "Audio", options: AUDIO_TYPE_OPTIONS, defaultValue: AUDIO_TYPE_OPTIONS[0] },
      { name: "qualityDescriptor", label: "Quality", options: QUALITY_DESCRIPTOR_OPTIONS, defaultValue: QUALITY_DESCRIPTOR_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var motionSentence = motion.opener(valueMap.targetTool, valueMap.motionDescription, valueMap.cameraMovement);
      var audioClause = motion.audioClause(valueMap.audioType);

      var kit = MarketingHaus.brandKit && MarketingHaus.brandKit.getActiveKit();
      var mood = kit ? MarketingHaus.engine.resolveFieldValue(kit.fields.mood) : "";
      var brandClause = mood ? " Matches the brand's " + mood + " aesthetic." : "";

      return {
        motionSentence: motionSentence,
        audioClause: audioClause,
        brandClause: brandClause,
      };
    },

    basePromptTemplate:
      "{motionSentence} Duration: {duration}. {audioClause} {qualityDescriptor}.{brandClause}" +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "{motionSentence} Duration: {duration}. {audioClause} {qualityDescriptor}, with a touch of extra warmth in the motion.{brandClause}" +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "{motionSentence} Duration: {duration}. {audioClause} {qualityDescriptor}, with bolder, more energetic movement.{brandClause}" +
      LOCKED_SUFFIX,

    charmPool: [
      "a subtle, natural pause before the action completes",
      "a soft, warm lighting shift during the motion",
      "gentle, lifelike micro-movements throughout",
    ],
    dynamicPool: [
      "a quicker pace to the action",
      "a more dynamic camera movement paired with the motion",
      "extra energy in the subject's movement",
    ],
  });
})();
