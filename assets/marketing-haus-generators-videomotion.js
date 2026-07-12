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

  var TARGET_TOOL_OPTIONS = ["MidJourney (video/animate)", "Kling AI", "Runway (Gen-3/Gen-4)", "Generic / Any Tool"];
  var CAMERA_MOVEMENT_OPTIONS = ["Static / Locked", "Slow Pan", "Slow Zoom In", "Zoom Out", "Tracking Shot", "Handheld / Subtle Shake", "Dolly / Push-In"];
  var DURATION_OPTIONS = ["3 seconds", "5 seconds", "8 seconds", "10 seconds", "15 seconds"];
  var AUDIO_TYPE_OPTIONS = ["No Audio", "Ambient / Environmental Sound", "Background Music", "Dialogue / Voiceover"];
  var QUALITY_DESCRIPTOR_OPTIONS = ["Cinematic Quality", "Crisp & Clean / Commercial Quality", "Natural & Realistic Motion"];

  // Natural-language phrasing nudges per tool — not verified exact syntax
  // for any of these (see file header).
  var TARGET_TOOL_OPENERS = {
    "MidJourney (video/animate)": function (v) {
      return "Animate this image: " + v.motion + ". Camera: " + v.camera + ".";
    },
    "Kling AI": function (v) {
      return "Camera: " + v.camera + ". " + v.motion + ".";
    },
    "Runway (Gen-3/Gen-4)": function (v) {
      return "A cinematic commercial shot where " + v.motion + ", with a " + v.camera.toLowerCase() + " camera movement.";
    },
    "Generic / Any Tool": function (v) {
      return v.motion + ". Camera movement: " + v.camera + ".";
    },
  };

  var LOCKED_SUFFIX = " Photo-realistic commercial motion — no illustrated, animated, or stylized rendering.";

  MarketingHaus.generatorEngine.registerGenerator({
    id: "video-motion-prompt",
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
      var opener = TARGET_TOOL_OPENERS[valueMap.targetTool] || TARGET_TOOL_OPENERS["Generic / Any Tool"];
      var motionSentence = opener({ motion: valueMap.motionDescription, camera: valueMap.cameraMovement });

      var audioClause;
      if (valueMap.audioType === "Dialogue / Voiceover") {
        audioClause = "Include natural spoken dialogue matching the scene.";
      } else if (valueMap.audioType === "No Audio") {
        audioClause = "No audio.";
      } else {
        audioClause = valueMap.audioType + ".";
      }

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
