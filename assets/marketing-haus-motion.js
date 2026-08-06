/**
 * The AI Creator's Marketing Haus — shared Video Motion vocabulary.
 * One source of truth for the image->video "motion prompt" building
 * blocks (target-tool openers, camera/duration/audio/quality options,
 * the locked photo-real suffix, and the full assembler). Consumed by BOTH
 * the standalone Video Motion Prompt quick-gen
 * (marketing-haus-generators-videomotion.js) AND the Mockup Studio's
 * embedded companion (marketing-haus-mockup.js), which previously each
 * carried their own copy of this vocabulary. Both entry points stay —
 * only the duplicated definitions are removed.
 *
 * Per-tool phrasing is a reasonable natural-language nudge, NOT verified
 * exact prompt syntax for any of these tools.
 * Load before mockup.js and before the generators.
 */
(function () {
  "use strict";
  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var TOOL_OPTIONS = ["MidJourney (video/animate)", "Kling AI", "Runway (Gen-3/Gen-4)", "Generic / Any Tool"];
  var CAMERA_OPTIONS = ["Static / Locked", "Slow Pan", "Slow Zoom In", "Zoom Out", "Tracking Shot", "Handheld / Subtle Shake", "Dolly / Push-In"];
  var DURATION_OPTIONS = ["3 seconds", "5 seconds", "8 seconds", "10 seconds", "15 seconds"];
  var AUDIO_OPTIONS = ["No Audio", "Ambient / Environmental Sound", "Background Music", "Dialogue / Voiceover"];
  var QUALITY_OPTIONS = ["Cinematic Quality", "Crisp & Clean / Commercial Quality", "Natural & Realistic Motion"];
  var LOCKED_SUFFIX = " Photo-realistic commercial motion — no illustrated, animated, or stylized rendering.";

  var OPENERS = {
    "MidJourney (video/animate)": function (v) { return "Animate this image: " + v.motion + ". Camera: " + v.camera + "."; },
    "Kling AI": function (v) { return "Camera: " + v.camera + ". " + v.motion + "."; },
    "Runway (Gen-3/Gen-4)": function (v) { return "A cinematic commercial shot where " + v.motion + ", with a " + v.camera.toLowerCase() + " camera movement."; },
    "Generic / Any Tool": function (v) { return v.motion + ". Camera movement: " + v.camera + "."; },
  };

  function opener(tool, motion, camera) {
    var fn = OPENERS[tool] || OPENERS["Generic / Any Tool"];
    return fn({ motion: motion, camera: camera });
  }

  function audioClause(audioType) {
    if (audioType === "Dialogue / Voiceover") return "Include natural spoken dialogue matching the scene.";
    if (audioType === "No Audio") return "No audio.";
    return audioType + ".";
  }

  MarketingHaus.motion = {
    TOOL_OPTIONS: TOOL_OPTIONS,
    CAMERA_OPTIONS: CAMERA_OPTIONS,
    DURATION_OPTIONS: DURATION_OPTIONS,
    AUDIO_OPTIONS: AUDIO_OPTIONS,
    QUALITY_OPTIONS: QUALITY_OPTIONS,
    LOCKED_SUFFIX: LOCKED_SUFFIX,
    opener: opener,
    audioClause: audioClause,
    // Full assembled motion prompt.
    // opts: { tool, motion, camera, duration, audioType, quality, flavor, brandMood }
    assemble: function (opts) {
      opts = opts || {};
      var motionSentence = opener(opts.tool, opts.motion, opts.camera);
      var audio = audioClause(opts.audioType);
      var quality = opts.quality || QUALITY_OPTIONS[0];
      var flavor = opts.flavor ? ", " + opts.flavor : "";
      var brand = opts.brandMood ? " Matches the brand's " + opts.brandMood + " aesthetic." : "";
      return motionSentence + " Duration: " + (opts.duration || DURATION_OPTIONS[1]) + ". " + audio + " " + quality + flavor + "." + brand + LOCKED_SUFFIX;
    },
  };
})();
