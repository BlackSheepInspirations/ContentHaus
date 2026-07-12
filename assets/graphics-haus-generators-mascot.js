/**
 * The AI Creator's Graphics Haus — Mascot Generator
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js, graphics-haus-mascotlock.js, and
 * graphics-haus-generators.js (all must load first — this file just
 * registers itself with that engine).
 *
 * Unlike every other generator here, this one's own visible fields are
 * deliberately pose-only (what the mascot is doing in THIS image) — the
 * character's actual identity (species, signature traits, palette, art
 * style, personality) is never re-typed here. It's pulled live from
 * whichever profile is active in Mascot Lock (graphics-haus-mascotlock.js)
 * via computeExtraTokens, the same derived-token hook Quote Wall Art and
 * Faux Textile already use. Works with a generic placeholder mascot even
 * before any Mascot Lock profile exists, same "zero input still produces
 * a usable result" rule every generator here follows — but nudges toward
 * setting one up for real character consistency.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  var EXPRESSION_OPTIONS = ["Big Happy Smile", "Playful Wink", "Calm & Content", "Excited", "Surprised"];
  var BACKGROUND_OPTIONS = ["Transparent (isolated for cutout)", "White Background", "Simple Scene Background"];

  var LOCKED_SUFFIX = " Single isolated mascot character, crisp clean edges, consistent line weight, commercial print-and-sticker ready, high resolution, no text or watermarks.";

  GraphicsHaus.generatorEngine.registerGenerator({
    id: "mascot",
    label: "Mascot Generator",
    icon: "person",
    description: "Render your saved mascot in a brand-new pose — set its identity once in the Mascot Lock panel, then generate as many poses as you need without retyping a thing.",
    fieldGroupTitle: "Customize This Pose",

    fields: [
      { name: "poseAction", label: "Pose / Action", isFreeText: true, defaultValue: "waving hello", placeholder: "e.g. waving hello, sipping coffee, jumping for joy" },
      { name: "sceneContext", label: "Scene Context (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. holding a shopping bag, standing next to a coffee cup" },
      { name: "expression", label: "Expression", options: EXPRESSION_OPTIONS, defaultValue: EXPRESSION_OPTIONS[0] },
      { name: "background", label: "Background", options: BACKGROUND_OPTIONS, defaultValue: BACKGROUND_OPTIONS[0] },
    ],

    computeExtraTokens: function (valueMap) {
      var mascot = GraphicsHaus.mascotLock && GraphicsHaus.mascotLock.getActiveMascot();
      var resolve = GraphicsHaus.engine.resolveFieldValue;
      var tokens;
      if (mascot) {
        tokens = {
          mascotName: mascot.name,
          mascotType: resolve(mascot.fields.mascotType) || "custom",
          mascotTraits: resolve(mascot.fields.signatureTraits) || "a simple, friendly design",
          mascotPalette: resolve(mascot.fields.colorPalette) || "cohesive",
          mascotArtStyle: resolve(mascot.fields.artStyle) || "Flat Vector Illustration",
          mascotPersonality: resolve(mascot.fields.personality) || "Friendly & Warm",
          mascotSetupNote: "",
        };
      } else {
        tokens = {
          mascotName: "your mascot",
          mascotType: "custom",
          mascotTraits: "simple, friendly, and easy to recognize",
          mascotPalette: "cohesive",
          mascotArtStyle: "Flat Vector Illustration",
          mascotPersonality: "Friendly & Warm",
          mascotSetupNote: " (Tip: set up a Mascot Lock profile below to lock in a consistent look across every pose.)",
        };
      }
      tokens.sceneClause = valueMap.sceneContext ? ", " + valueMap.sceneContext : "";
      return tokens;
    },

    basePromptTemplate:
      "A {mascotType} mascot character named {mascotName}, featuring {mascotTraits}, in {mascotArtStyle} style with a {mascotPalette} color palette and a {mascotPersonality} personality. Shown {poseAction}{sceneClause}, with a {expression} expression. {background}{holidayClause}.{mascotSetupNote}\n\n" +
      "Layout: one single mascot character centered in frame, full body visible, consistent and recognizable as a recurring brand character." +
      LOCKED_SUFFIX,

    charmPromptTemplate:
      "Create a charming {mascotType} mascot named {mascotName}, with {mascotTraits}, {mascotArtStyle} style, a {mascotPalette} color palette, and a {mascotPersonality} personality. Shown {poseAction}{sceneClause}, with a {expression} expression. {background}{holidayClause}.{mascotSetupNote}\n\n" +
      "Layout: one single mascot character centered in frame, full body visible, with extra warmth and personality in the pose." +
      LOCKED_SUFFIX,

    dynamicPromptTemplate:
      "Design an energetic {mascotType} mascot named {mascotName}, featuring {mascotTraits}, {mascotArtStyle} style, a {mascotPalette} color palette, and a {mascotPersonality} personality. Shown {poseAction}{sceneClause}, with a {expression} expression. {background}{holidayClause}.{mascotSetupNote}\n\n" +
      "Layout: one single mascot character centered in frame, full body visible, with a lively, animated pose." +
      LOCKED_SUFFIX,

    charmPool: [
      "a small heart or sparkle accent near the character",
      "a subtle motion line suggesting friendly energy",
      "one tiny decorative detail matching the mascot's personality",
    ],
    dynamicPool: [
      "a bolder, more exaggerated pose",
      "extra motion lines suggesting movement",
      "a more dynamic camera angle, like a slight low-angle hero shot",
    ],
  });
})();
