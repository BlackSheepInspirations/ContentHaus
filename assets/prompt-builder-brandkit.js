/**
 * The AI Creator's Prompt Haus — Brand Kit ("My HAUS Style")
 * Depends on prompt-builder-styledna.js (util.makeField) and every mode
 * module (character/couples/text/graphics/reference) being loaded first,
 * since applying a kit writes straight into their fields.
 *
 * Persisted to localStorage (like Favorites) rather than a database — same
 * zero-server-cost reasoning as the rest of the tool. Up to 3 kits, only
 * one active at a time.
 *
 * Two different mechanisms feed a kit's values into the actual prompt,
 * chosen per category based on what's real:
 *
 * 1. Preset-style writes (Color, Typography, most of Visual Style):
 *    activating a kit (or editing its fields, or flipping an override)
 *    writes values directly into each mode's own fields via their existing
 *    updateField-style functions — the same mechanism Collection Presets
 *    use. Turning a kit off does NOT restore whatever was there before
 *    (same trade-off Collection Presets already have).
 *
 * 2. Synthetic entries (Composition Style, Core Traits): these have no
 *    existing field to write into, so instead they're read fresh at
 *    assembly time via getActiveKitEntries() and appended as their own
 *    descriptor entries — same pattern Holiday/Theme/Buffer already use.
 *
 * Brand Voice was cut entirely (Tone/Energy/Writing Style/Perspective) —
 * none of it has a real visual translation, same reasoning that got
 * Audience Profile cut during scoping. "What the Brand is NOT" isn't its
 * own field either; it's merged into the existing Negative Prompt output
 * via getActiveKitNegativeContribution(), since it's functionally the same
 * job (an exclusion list) just scoped to identity instead of visuals.
 *
 * Per-category override: each kit has 4 override flags (color/typography/
 * visualStyle/personality). false = inherit (the kit's values get
 * applied/injected); true = "override for this project" (the kit skips
 * that category entirely — both its writes AND its synthetic
 * contributions). This is the ONLY granularity — no per-individual-field
 * toggle.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;

  var STORAGE_KEY = "promptHausBrandKits";
  var MAX_KITS = 3;

  // ---------------------------------------------------------------------
  // Category 1: Color System
  // ---------------------------------------------------------------------
  var BRAND_COLOR_OPTIONS = [
    "black", "white", "cream/ivory", "charcoal", "gold", "champagne gold",
    "copper/bronze", "navy", "burgundy", "emerald", "sage green",
    "terracotta", "blush pink", "dusty rose", "teal",
  ];
  var BRAND_NEUTRAL_OPTIONS = [
    "black", "white", "cream/ivory", "beige", "warm gray", "cool gray", "charcoal",
  ];
  var GRADIENT_STYLE_OPTIONS = ["sunset", "ocean", "neon glow", "monochrome fade", "none"];
  var COLOR_MOOD_OPTIONS = ["muted", "bold", "earthy", "luxury", "pastel", "high-contrast"];

  // ---------------------------------------------------------------------
  // Category 2: Typography System — three distinct lists, matched to role
  // ---------------------------------------------------------------------
  var PRIMARY_FONT_OPTIONS = [
    "bold geometric sans-serif", "luxury editorial serif", "condensed impact",
    "elegant serif display", "modern minimalist sans", "decorative display",
    "bold handwritten script",
  ];
  var SECONDARY_FONT_OPTIONS = [
    "clean sans-serif", "classic book serif", "minimalist sans",
    "rounded friendly sans", "condensed practical",
  ];
  var ACCENT_FONT_OPTIONS = [
    "script/cursive elegant", "handwritten casual", "calligraphy",
    "graffiti/street lettering", "retro vintage lettering",
    "playful bubble lettering", "luxury monogram script",
  ];

  // ---------------------------------------------------------------------
  // Category 3: Visual Style Direction — own lists, distinct from Text
  // Effects / Character Type, per explicit "smaller brand-identity
  // specific lists" decision.
  // ---------------------------------------------------------------------
  var AESTHETIC_STYLE_OPTIONS = [
    "minimal", "luxury", "streetwear", "grunge", "editorial", "pop-art",
    "vintage", "futuristic", "playful/cartoon", "cinematic",
  ];
  var TEXTURE_STYLE_OPTIONS = [
    "glossy", "matte", "grainy/film grain", "paper texture", "metallic",
    "watercolor soft", "neon glow",
  ];
  var LIGHTING_STYLE_OPTIONS = [
    "soft natural light", "studio lighting", "dramatic shadows",
    "golden hour", "neon lighting",
  ];
  var COMPOSITION_STYLE_OPTIONS = [
    "centered", "symmetrical", "collage", "layered", "poster-style", "asymmetrical",
  ];

  // ---------------------------------------------------------------------
  // Category 4: Brand Personality — Archetype lives in Logo Mode instead;
  // this is just Core Traits + the constraint field.
  // ---------------------------------------------------------------------
  var CORE_TRAIT_OPTIONS = [
    "confident", "grounded", "rebellious", "faith-driven", "premium",
    "minimal", "expressive",
  ];

  var OVERRIDE_CATEGORIES = ["color", "typography", "visualStyle", "personality"];
  var CATEGORY_LABELS = {
    color: "Color System",
    typography: "Typography System",
    visualStyle: "Visual Style Direction",
    personality: "Brand Personality",
  };

  function buildKitFields() {
    return {
      color: {
        primary: makeField("", BRAND_COLOR_OPTIONS),
        secondary: makeField("", BRAND_COLOR_OPTIONS),
        accent: makeField("", BRAND_COLOR_OPTIONS),
        neutral: makeField("", BRAND_NEUTRAL_OPTIONS),
        gradient: makeField("", GRADIENT_STYLE_OPTIONS),
        mood: makeField("", COLOR_MOOD_OPTIONS),
      },
      typography: {
        primaryFont: makeField("", PRIMARY_FONT_OPTIONS),
        secondaryFont: makeField("", SECONDARY_FONT_OPTIONS),
        accentFont: makeField("", ACCENT_FONT_OPTIONS),
      },
      visualStyle: {
        aesthetic1: makeField("", AESTHETIC_STYLE_OPTIONS),
        aesthetic2: makeField("", AESTHETIC_STYLE_OPTIONS),
        texture: makeField("", TEXTURE_STYLE_OPTIONS),
        lighting: makeField("", LIGHTING_STYLE_OPTIONS),
        composition: makeField("", COMPOSITION_STYLE_OPTIONS),
      },
      personality: {
        trait1: makeField("", CORE_TRAIT_OPTIONS),
        trait2: makeField("", CORE_TRAIT_OPTIONS),
        trait3: makeField("", CORE_TRAIT_OPTIONS),
        notThis: makeField("", [], { isFreeText: true }),
      },
    };
  }

  function buildOverrides() {
    var overrides = {};
    OVERRIDE_CATEGORIES.forEach(function (c) {
      overrides[c] = false;
    });
    return overrides;
  }

  // ---------------------------------------------------------------------
  // Persistence — same shape/reasoning as prompt-builder-favorites.js.
  // ---------------------------------------------------------------------
  function readPersisted() {
    if (!window.localStorage) return { kits: [], activeKitId: null };
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (parsed && Array.isArray(parsed.kits)) {
        return { kits: parsed.kits, activeKitId: parsed.activeKitId || null };
      }
    } catch (e) {
      // fall through to default
    }
    return { kits: [], activeKitId: null };
  }

  function writePersisted(state) {
    if (!window.localStorage) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ kits: state.kits, activeKitId: state.activeKitId })
    );
  }

  var store = PromptHaus.util.createStore(readPersisted());

  // Every mutation writes straight through to localStorage — no separate
  // "save" step, same as Favorites.
  function commit(patch) {
    store.setState(patch);
    writePersisted(store.getState());
  }

  function getAllKits() {
    return store.getState().kits;
  }

  function isFull() {
    return store.getState().kits.length >= MAX_KITS;
  }

  function getActiveKit() {
    var state = store.getState();
    if (!state.activeKitId) return null;
    return (
      state.kits.filter(function (k) {
        return k.id === state.activeKitId;
      })[0] || null
    );
  }

  // Returns { ok:true, id } or { ok:false, reason }. Same "refuse rather
  // than silently evict" philosophy as Favorites.
  function createKit(name) {
    var state = store.getState();
    if (state.kits.length >= MAX_KITS) {
      return {
        ok: false,
        reason: "You already have " + MAX_KITS + " Brand Kits saved — delete one to create another.",
      };
    }
    var kit = {
      id: "bk-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      name: (name || "").trim() || "Untitled Brand Kit",
      createdAt: Date.now(),
      overrides: buildOverrides(),
      fields: buildKitFields(),
    };
    commit({ kits: state.kits.concat([kit]) });
    return { ok: true, id: kit.id };
  }

  function deleteKit(id) {
    var state = store.getState();
    var activeKitId = state.activeKitId === id ? null : state.activeKitId;
    commit({
      kits: state.kits.filter(function (k) {
        return k.id !== id;
      }),
      activeKitId: activeKitId,
    });
    applyActiveKitToAllModes();
  }

  function renameKit(id, newName) {
    var state = store.getState();
    commit({
      kits: state.kits.map(function (k) {
        return k.id === id ? Object.assign({}, k, { name: (newName || "").trim() || "Untitled Brand Kit" }) : k;
      }),
    });
  }

  // id === null turns Brand Kit off entirely (no kit active).
  function setActiveKit(id) {
    commit({ activeKitId: id });
    applyActiveKitToAllModes();
  }

  function updateKitField(id, category, fieldName, changes) {
    var state = store.getState();
    commit({
      kits: state.kits.map(function (k) {
        if (k.id !== id) return k;
        var categoryFields = Object.assign({}, k.fields[category]);
        categoryFields[fieldName] = Object.assign({}, categoryFields[fieldName], changes);
        var fields = Object.assign({}, k.fields);
        fields[category] = categoryFields;
        return Object.assign({}, k, { fields: fields });
      }),
    });
    if (state.activeKitId === id) applyActiveKitToAllModes();
  }

  function updateKitOverride(id, category, overrideEnabled) {
    var state = store.getState();
    commit({
      kits: state.kits.map(function (k) {
        if (k.id !== id) return k;
        var overrides = Object.assign({}, k.overrides, {});
        overrides[category] = overrideEnabled;
        return Object.assign({}, k, { overrides: overrides });
      }),
    });
    if (state.activeKitId === id) applyActiveKitToAllModes();
  }

  function resolved(field) {
    return PromptHaus.engine.resolveFieldValue(field);
  }

  // ---------------------------------------------------------------------
  // Mechanism 1: preset-style writes into existing fields. Every write
  // uses { value: "", customValue: X } rather than { value: X,
  // customValue: "" } — Brand Kit's option lists are deliberately smaller/
  // distinct from each target field's own curated list, so there's no
  // guarantee X is one of that field's real dropdown options. customValue
  // always wins in resolveFieldValue regardless of value, same rule as
  // every "Or type your own..." box elsewhere in the tool.
  //
  // Character/Couples/Graphics have no color or typography field at all
  // (confirmed by reading every mode file directly) — those two categories
  // only ever reach Text, Reference, Animals (via its own Add Text), and
  // Logo (which has real slots for all six color roles and all three
  // typography roles).
  // ---------------------------------------------------------------------
  function applyActiveKitToAllModes() {
    var kit = getActiveKit();
    if (!kit) return; // nothing to apply; fields are left exactly as they are
    if (!kit.overrides.color) applyColorCategory(kit);
    if (!kit.overrides.typography) applyTypographyCategory(kit);
    if (!kit.overrides.visualStyle) applyVisualStyleCategory(kit);
  }

  // Logo Mode loads AFTER Brand Kit in script order (Logo's own initial
  // state reads PromptHaus.brandKit.optionLists, so Brand Kit has to exist
  // first) — which means the very first applyActiveKitToAllModes() call at
  // the bottom of this file runs before PromptHaus.logo exists yet. Guard
  // every logo.* call here; Logo re-triggers its own catch-up apply once
  // it finishes defining itself (see the bottom of prompt-builder-logo.js).
  function applyColorCategory(kit) {
    var primary = resolved(kit.fields.color.primary);
    var secondary = resolved(kit.fields.color.secondary);
    var accent = resolved(kit.fields.color.accent);
    var neutral = resolved(kit.fields.color.neutral);
    var gradient = resolved(kit.fields.color.gradient);
    var mood = resolved(kit.fields.color.mood);
    if (primary) {
      PromptHaus.text.updateField("colorScheme", { value: "", customValue: primary });
      PromptHaus.reference.updateAddTextField("colorScheme", { value: "", customValue: primary });
      PromptHaus.animals.updateAddTextField("colorScheme", { value: "", customValue: primary });
      if (PromptHaus.logo) PromptHaus.logo.updateColorField("primary", { value: "", customValue: primary });
    }
    if (accent) {
      PromptHaus.text.updateAccentField("colorScheme", { value: "", customValue: accent });
      if (PromptHaus.logo) PromptHaus.logo.updateColorField("accent", { value: "", customValue: accent });
    }
    // Text/Reference only have two color-bearing slots (main + Second
    // Phrase), already claimed by Primary/Accent above — Secondary/
    // Neutral/Gradient/Mood have nowhere to go there, so they still ride
    // getActiveKitEntries()'s synthetic-entry mechanism for those modes.
    // Logo has real slots for all six, so it gets them written directly.
    if (PromptHaus.logo) {
      if (secondary) PromptHaus.logo.updateColorField("secondary", { value: "", customValue: secondary });
      if (neutral) PromptHaus.logo.updateColorField("neutral", { value: "", customValue: neutral });
      if (gradient && gradient.toLowerCase() !== "none") PromptHaus.logo.updateColorField("gradient", { value: "", customValue: gradient });
      if (mood) PromptHaus.logo.updateColorField("mood", { value: "", customValue: mood });
    }
  }

  function applyTypographyCategory(kit) {
    var primaryFont = resolved(kit.fields.typography.primaryFont);
    var secondaryFont = resolved(kit.fields.typography.secondaryFont);
    var accentFont = resolved(kit.fields.typography.accentFont);
    if (primaryFont) {
      PromptHaus.text.updateField("letterStyle", { value: "", customValue: primaryFont });
      PromptHaus.graphics.updateHauteDetailField("letterStyle", { value: "", customValue: primaryFont });
      PromptHaus.reference.updateAddTextField("letterStyle", { value: "", customValue: primaryFont });
      PromptHaus.animals.updateAddTextField("letterStyle", { value: "", customValue: primaryFont });
      if (PromptHaus.logo) PromptHaus.logo.updateTypographyField("primaryFont", { value: "", customValue: primaryFont });
    }
    if (accentFont) {
      PromptHaus.text.updateAccentField("letterStyle", { value: "", customValue: accentFont });
      if (PromptHaus.logo) PromptHaus.logo.updateTypographyField("accentFont", { value: "", customValue: accentFont });
    }
    // Text/Reference/Graphics have no "body text" slot at all — Secondary
    // Font only ever reaches Logo, which has a real place for it.
    if (secondaryFont && PromptHaus.logo) PromptHaus.logo.updateTypographyField("secondaryFont", { value: "", customValue: secondaryFont });
  }

  // Aesthetic/Texture/Lighting write into existing fields (mechanism 1);
  // Composition Style has no matching field anywhere — Framing is a
  // border/frame decoration concept, not a layout one — so it's handled
  // separately via getActiveKitEntries() (mechanism 2) instead.
  function applyVisualStyleCategory(kit) {
    var aesthetic1 = resolved(kit.fields.visualStyle.aesthetic1);
    var aesthetic2 = resolved(kit.fields.visualStyle.aesthetic2);
    var texture = resolved(kit.fields.visualStyle.texture);
    var lighting = resolved(kit.fields.visualStyle.lighting);

    if (aesthetic1) {
      PromptHaus.character.updateNestedField("style", "characterType", { value: "", customValue: aesthetic1 });
      PromptHaus.couples.updateCoupleDynamicField("characterType", { value: "", customValue: aesthetic1 });
      PromptHaus.reference.updateStyleAdjustmentField("characterType", { value: "", customValue: aesthetic1 });
      PromptHaus.animals.updateStyleField("characterType", { value: "", customValue: aesthetic1 });
      if (PromptHaus.graphics.getState().styleCategory === "realistic") {
        PromptHaus.graphics.updateRealisticStyle({ value: "", customValue: aesthetic1 });
      } else {
        PromptHaus.graphics.updateIllustratedField("characterType", { value: "", customValue: aesthetic1 });
      }
    }
    if (aesthetic2) {
      PromptHaus.character.updateNestedField("style", "artFinish", { value: "", customValue: aesthetic2 });
      PromptHaus.couples.updateCoupleDynamicField("artFinish", { value: "", customValue: aesthetic2 });
      PromptHaus.reference.updateStyleAdjustmentField("artFinish", { value: "", customValue: aesthetic2 });
      PromptHaus.animals.updateStyleField("artFinish", { value: "", customValue: aesthetic2 });
      if (PromptHaus.graphics.getState().styleCategory !== "realistic") {
        PromptHaus.graphics.updateIllustratedField("artFinish", { value: "", customValue: aesthetic2 });
      }
    }
    if (texture) {
      PromptHaus.text.updateField("textEffects", { value: "", customValue: texture });
      PromptHaus.reference.updateAddTextField("textEffects", { value: "", customValue: texture });
      PromptHaus.animals.updateAddTextField("textEffects", { value: "", customValue: texture });
    }
    if (lighting) {
      PromptHaus.character.updateNestedField("presentation", "lightingEffects", { value: "", customValue: lighting });
      PromptHaus.couples.updateCoupleDynamicField("lightingEffects", { value: "", customValue: lighting });
      PromptHaus.graphics.updateFrameItField("lightingEffects", { value: "", customValue: lighting });
      PromptHaus.animals.updateFrameItField("lightingEffects", { value: "", customValue: lighting });
    }
  }

  // ---------------------------------------------------------------------
  // Mechanism 2: synthetic entries, read fresh at assembly time rather
  // than pushed into any other module's stored state — same pattern
  // Holiday/Theme/Buffer/Imagery already use. Every mode's assemblePrompt
  // calls this and concats the result into its own fixed entries.
  // ---------------------------------------------------------------------
  function getActiveKitEntries() {
    var kit = getActiveKit();
    if (!kit) return [];
    var entries = [];
    // Primary/Accent already get written straight into Text/Reference's
    // actual color fields (mechanism 1) — Text only has two color-bearing
    // slots (main + Second Phrase) and both are already claimed. Secondary/
    // Neutral/Gradient/Mood have nowhere to write into, so they ride the
    // same synthetic-entry mechanism as Composition Style below, reaching
    // every mode uniformly instead of being Logo-Mode-only.
    if (!kit.overrides.color) {
      var secondary = resolved(kit.fields.color.secondary);
      if (secondary) entries.push({ label: "Brand Kit Color", field: makeField("secondary color " + secondary) });
      var neutral = resolved(kit.fields.color.neutral);
      if (neutral) entries.push({ label: "Brand Kit Color", field: makeField("neutral/base color " + neutral) });
      var gradient = resolved(kit.fields.color.gradient);
      if (gradient && gradient.toLowerCase() !== "none") entries.push({ label: "Brand Kit Color", field: makeField(gradient + " gradient style") });
      var mood = resolved(kit.fields.color.mood);
      if (mood) entries.push({ label: "Brand Kit Color", field: makeField(mood + " color mood") });
    }
    if (!kit.overrides.visualStyle) {
      var composition = resolved(kit.fields.visualStyle.composition);
      if (composition) entries.push({ label: "Composition Style", field: makeField(composition) });
    }
    if (!kit.overrides.personality) {
      [kit.fields.personality.trait1, kit.fields.personality.trait2, kit.fields.personality.trait3].forEach(function (traitField) {
        var trait = resolved(traitField);
        if (trait) entries.push({ label: "Brand Personality", field: makeField(trait) });
      });
    }
    return entries;
  }

  // "What the Brand is NOT" folds into the existing Negative Prompt output
  // rather than being its own field — same exclusion-list job, just scoped
  // to identity instead of visuals. Called from ui.js right where Style
  // DNA's own negativePrompt value is read, and combined before formatting.
  function getActiveKitNegativeContribution() {
    var kit = getActiveKit();
    if (!kit || kit.overrides.personality) return "";
    return resolved(kit.fields.personality.notThis);
  }

  // ---------------------------------------------------------------------
  // Export — same Share/Copy/Download/Print shape as the Prompt Vault,
  // just summarizing a kit's field values instead of a generated prompt.
  // ---------------------------------------------------------------------
  function buildKitSummaryText(kit) {
    var lines = ["BRAND KIT: " + kit.name];
    function addLine(label, field) {
      var value = resolved(field);
      if (value) lines.push(label + ": " + value);
    }
    lines.push("");
    lines.push("Color System");
    addLine("Primary Color", kit.fields.color.primary);
    addLine("Secondary Color", kit.fields.color.secondary);
    addLine("Accent Color", kit.fields.color.accent);
    addLine("Neutral/Base Color", kit.fields.color.neutral);
    addLine("Gradient Style", kit.fields.color.gradient);
    addLine("Color Mood", kit.fields.color.mood);
    lines.push("");
    lines.push("Typography System");
    addLine("Primary Font", kit.fields.typography.primaryFont);
    addLine("Secondary Font", kit.fields.typography.secondaryFont);
    addLine("Accent/Display Font", kit.fields.typography.accentFont);
    lines.push("");
    lines.push("Visual Style Direction");
    addLine("Aesthetic Style 1", kit.fields.visualStyle.aesthetic1);
    addLine("Aesthetic Style 2", kit.fields.visualStyle.aesthetic2);
    addLine("Texture Style", kit.fields.visualStyle.texture);
    addLine("Lighting Style", kit.fields.visualStyle.lighting);
    addLine("Composition Style", kit.fields.visualStyle.composition);
    lines.push("");
    lines.push("Brand Personality");
    addLine("Core Trait 1", kit.fields.personality.trait1);
    addLine("Core Trait 2", kit.fields.personality.trait2);
    addLine("Core Trait 3", kit.fields.personality.trait3);
    addLine("What the Brand is NOT", kit.fields.personality.notThis);
    return lines.join("\n");
  }

  function buildAllKitsSummaryText() {
    return getAllKits()
      .map(buildKitSummaryText)
      .join("\n\n" + "—".repeat(24) + "\n\n");
  }

  PromptHaus.brandKit = Object.assign({}, store, {
    MAX_KITS: MAX_KITS,
    overrideCategories: OVERRIDE_CATEGORIES,
    categoryLabels: CATEGORY_LABELS,
    optionLists: {
      brandColor: BRAND_COLOR_OPTIONS,
      brandNeutral: BRAND_NEUTRAL_OPTIONS,
      gradientStyle: GRADIENT_STYLE_OPTIONS,
      colorMood: COLOR_MOOD_OPTIONS,
      primaryFont: PRIMARY_FONT_OPTIONS,
      secondaryFont: SECONDARY_FONT_OPTIONS,
      accentFont: ACCENT_FONT_OPTIONS,
      aestheticStyle: AESTHETIC_STYLE_OPTIONS,
      textureStyle: TEXTURE_STYLE_OPTIONS,
      lightingStyle: LIGHTING_STYLE_OPTIONS,
      compositionStyle: COMPOSITION_STYLE_OPTIONS,
      coreTrait: CORE_TRAIT_OPTIONS,
    },
    getAllKits: getAllKits,
    isFull: isFull,
    getActiveKit: getActiveKit,
    createKit: createKit,
    deleteKit: deleteKit,
    renameKit: renameKit,
    setActiveKit: setActiveKit,
    updateKitField: updateKitField,
    updateKitOverride: updateKitOverride,
    getActiveKitEntries: getActiveKitEntries,
    getActiveKitNegativeContribution: getActiveKitNegativeContribution,
    buildKitSummaryText: buildKitSummaryText,
    buildAllKitsSummaryText: buildAllKitsSummaryText,
    // Exported so Logo Mode can trigger a catch-up apply once it finishes
    // defining itself — see the note above applyColorCategory.
    applyActiveKitToAllModes: applyActiveKitToAllModes,
  });

  // Re-apply whatever kit was already active on a fresh page load, before
  // ui.js's first render — every other mode module has already run its
  // own IIFE by the time this script tag executes (script order), so
  // their updateField-style functions all exist and are safe to call here.
  applyActiveKitToAllModes();
})();
