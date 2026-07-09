/**
 * The AI Creator's Prompt Haus — Logo Mode
 * Built from the user's "Prompt Haus — Logo Maker Tab: Build & Prompt
 * Reference (v2)" spec, then revised after hands-on feedback. Three
 * layers kept deliberately separate, same naming as that doc:
 *   Layer 1 — user inputs (this module's fields)
 *   Layer 2 — auto-appended rules (fixed strings below, never user-edited)
 *   Layer 3 — UI callouts (rendered in ui.js, never enter the prompt text)
 *
 * Conflict Resolution Hierarchy (governs assembly order + the dominant-
 * descriptor cap): exact-text lock > user selections > hard structural
 * constraints (Logo Type/Color count/Canvas) > style systems (Personality
 * > Industry > Style-Era > Archetype) > negative constraints > auto-append.
 * The "no more than ~3 dominant style descriptors, merge don't stack" rule
 * is implemented here as priority-truncation (take the first 3 in that
 * priority order) rather than true semantic merging — a defensible
 * simplification given these are single-value fields, not free text.
 *
 * Tier ladder (revised from two independent toggles to one 3-way control):
 * "lite" biases the output toward fewer elements (old Simplify behavior,
 * no fields hidden), "standard" (default) is the normal field set, "pro"
 * additionally reveals Section C's strategist fields.
 *
 * Color/Typography — Logo now has its own real fields (Primary/Secondary/
 * Accent/Neutral/Gradient/Mood color, Primary/Secondary/Accent Font),
 * mirroring Brand Kit's own shape exactly. An active Brand Kit writes into
 * these the same way it writes into Text/Character/Graphics/Reference's
 * fields (see prompt-builder-brandkit.js's applyColorCategory/
 * applyTypographyCategory) — but Logo works standalone with no kit at all,
 * since requiring one first was the actual complaint that reversed the
 * original "read-only from Brand Kit" design.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;

  // ---------------------------------------------------------------------
  // Option lists — Section B of the spec
  // ---------------------------------------------------------------------
  var USE_MODE_OPTIONS = ["for my own brand", "to sell to others / client work"];

  var LOGO_TYPE_OPTIONS = [
    "wordmark (text only)", "lettermark (initials only)", "brandmark (icon only)",
    "combination mark (icon + text)", "emblem / badge (text inside a shape)", "abstract symbol",
  ];

  var INDUSTRY_OPTIONS = [
    "fashion/streetwear", "tech/SaaS", "faith-based", "luxury/high-end",
    "fitness/wellness", "education/coaching", "food/beverage", "beauty/cosmetics",
    "creative/POD/handmade", "professional/consulting",
  ];

  var PERSONALITY_OPTIONS = [
    "minimal/clean", "bold/aggressive", "elegant/luxury", "playful/fun",
    "spiritual/calm", "futuristic/digital", "vintage/retro",
  ];

  var ICONOGRAPHY_OPTIONS = [
    "no icon (text only)", "abstract symbol", "literal symbol (crown, cross, leaf, bolt, etc.)",
    "monogram integration", "geometric shapes", "nature-based forms", "minimal line icon",
  ];

  var LAYOUT_OPTIONS = ["centered", "horizontal lockup", "stacked", "badge", "circular seal", "negative-space"];
  var LOCKUP_RELATIONSHIP_OPTIONS = ["icon above text", "icon left of text", "text only", "icon only", "tagline below name"];
  var CONTAINER_OPTIONS = [
    "contained in a circle badge", "contained in a shield badge",
    "contained in a square badge", "free-standing (no container)",
  ];

  var BACKGROUND_OPTIONS = ["transparent", "white", "dark/black"];
  var CANVAS_FORMAT_OPTIONS = ["square (1:1)", "landscape / horizontal", "portrait / vertical"];

  var COLOR_CONSTRAINT_OPTIONS = [
    "full color allowed", "2-color limit", "1-color only (stamp-ready)",
    "black & white first priority", "invertible design required (works on light and dark)",
  ];

  var DIMENSIONAL_OPTIONS = ["flat", "dimensional / 3d"];

  var OUTPUT_VARIATIONS_OPTIONS = ["1 concept", "3 concepts", "5 concepts", "logo system set (primary + simplified icon/submark)"];

  // Pro Mode (Section C)
  var ARCHETYPE_OPTIONS = [
    "the hero", "the creator", "the rebel", "the sage", "the caregiver",
    "the explorer", "the ruler", "the innocent", "the jester", "the lover",
    "the everyman", "the magician",
  ];
  var STYLE_ERA_OPTIONS = ["modern-minimal", "70s-retro", "hand-crafted artisanal", "techy-geometric", "timeless-classic"];

  // Smart canvas-format default (#9a) — checked against Layout first, then
  // Lockup relationship, falling back to square. Only applies while
  // canvasFormat.auto is true, same auto/override pattern as Style DNA's
  // own aspectRatio field.
  var CANVAS_FORMAT_SUGGESTIONS = {
    "horizontal lockup": "landscape / horizontal",
    "icon left of text": "landscape / horizontal",
    stacked: "portrait / vertical",
    badge: "square (1:1)",
    "circular seal": "square (1:1)",
    centered: "square (1:1)",
    "icon only": "square (1:1)",
  };
  function suggestedCanvasFormat(layout, lockupRelationship) {
    return CANVAS_FORMAT_SUGGESTIONS[layout] || CANVAS_FORMAT_SUGGESTIONS[lockupRelationship] || "square (1:1)";
  }

  // Section D's industry cliché-avoidance nudge, keyed to Industry (#2).
  var INDUSTRY_CLICHE_MAP = {
    "tech/SaaS": "the obvious tech cliché (generic swoosh or globe icon)",
    "food/beverage": "the obvious food/beverage cliché (literal coffee cup or fork/spoon icon)",
    "faith-based": "the obvious faith cliché (plain cross silhouette)",
    "fitness/wellness": "the obvious fitness cliché (flexing arm or dumbbell icon)",
    "fashion/streetwear": "the obvious streetwear cliché (generic bold logo-mark ripoffs)",
    "luxury/high-end": "the obvious luxury cliché (generic interlocking-letters monogram)",
    "education/coaching": "the obvious education cliché (literal graduation cap or open book)",
    "beauty/cosmetics": "the obvious beauty cliché (generic flower or lipstick icon)",
    "creative/POD/handmade": "the obvious handmade cliché (literal paintbrush or sewing needle)",
    "professional/consulting": "the obvious consulting cliché (generic upward arrow or handshake icon)",
  };

  // Section E — fixed, always-on, appended as one block per-explicit
  // instruction ("avoid prompt bloat" — not split into separate lines).
  var QUALITY_CONSTRAINTS_BLOCK =
    "no watermark; avoid generic glyph shapes (circle-arrow, globe, plain crown/lion/shield/eagle silhouettes); " +
    "avoid symmetrical clip-art icons and default UI/emoji-like shapes; original, distinctive mark.";

  // Section F — trademark deterrent, always appended; louder wording when
  // Use Mode indicates resale per the doc's "resale-aware behavior."
  var TRADEMARK_LINE =
    "Reduce the likelihood of obvious similarity to existing brand marks: avoid generic or protected symbols " +
    "(plain crowns, lions, globes, shields, eagles, checkmarks) unless heavily stylized into something original; " +
    "no real brand names or logos; original, distinctive mark.";
  var TRADEMARK_DISCLAIMER =
    "This is not legal advice. This tool does not check trademarks. Verify trademark and copyright independently before commercial use.";
  var RESALE_TRADEMARK_NOTE =
    " Selling a logo that infringes an existing mark is a liability, and Etsy's original-design policy applies to design/logo resale — a commercial license alone is not sufficient; the design must be your own original work.";

  var TEXT_FAILURE_FALLBACK =
    "If the text cannot be rendered cleanly and correctly spelled, prioritize the visual concept and omit all text entirely rather than produce misspelled, dropped, reordered, or distorted lettering.";

  var LITE_TIER_PHRASE = "keep the design extremely simple — minimal elements, clean lines, generous negative space";

  var TIERS = ["lite", "standard", "pro"];

  function buildInitialState() {
    var brandKitLists = PromptHaus.brandKit.optionLists;
    return {
      tier: "standard",
      useMode: makeField(USE_MODE_OPTIONS[0], USE_MODE_OPTIONS),
      logoType: makeField("", LOGO_TYPE_OPTIONS),
      industry: makeField("", INDUSTRY_OPTIONS),
      personality: makeField("", PERSONALITY_OPTIONS),
      color: {
        primary: makeField("", brandKitLists.brandColor),
        secondary: makeField("", brandKitLists.brandColor),
        accent: makeField("", brandKitLists.brandColor),
        neutral: makeField("", brandKitLists.brandNeutral),
        gradient: makeField("", brandKitLists.gradientStyle),
        mood: makeField("", brandKitLists.colorMood),
      },
      typography: {
        primaryFont: makeField("", brandKitLists.primaryFont),
        secondaryFont: makeField("", brandKitLists.secondaryFont),
        accentFont: makeField("", brandKitLists.accentFont),
      },
      iconography: makeField("", ICONOGRAPHY_OPTIONS),
      composition: {
        layout: makeField("", LAYOUT_OPTIONS),
        lockup: makeField("", LOCKUP_RELATIONSHIP_OPTIONS),
        container: makeField("", CONTAINER_OPTIONS),
      },
      noTextSymbolOnly: false,
      brandName: makeField("", [], { isFreeText: true }),
      initials: makeField("", [], { isFreeText: true }),
      tagline: makeField("", [], { isFreeText: true }),
      brandStory: makeField("", [], { isFreeText: true }),
      background: makeField("transparent", BACKGROUND_OPTIONS),
      canvasFormat: makeField("square (1:1)", CANVAS_FORMAT_OPTIONS, { auto: true }),
      colorConstraint: makeField("", COLOR_CONSTRAINT_OPTIONS),
      dimensional: makeField("flat", DIMENSIONAL_OPTIONS),
      outputVariations: makeField("1 concept", OUTPUT_VARIATIONS_OPTIONS),
      negativeConstraints: {
        noMockups: true,
        noGradients: true,
        noShadows: true,
        no3d: true,
        avoidComplexity: true,
      },
      // Pro Mode (Section C) — only read from when tier === "pro".
      archetype: makeField("", ARCHETYPE_OPTIONS),
      symbolMeaning: makeField("", [], { isFreeText: true }),
      styleEra: makeField("", STYLE_ERA_OPTIONS),
      competitorAvoidance: makeField("", [], { isFreeText: true }),
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function resolved(field) {
    return PromptHaus.engine.resolveFieldValue(field);
  }

  function updateField(fieldName, changes) {
    PromptHaus.util.updateField(store, fieldName, changes);
  }

  function updateColorField(fieldName, changes) {
    var state = store.getState();
    var color = Object.assign({}, state.color);
    color[fieldName] = Object.assign({}, color[fieldName], changes);
    store.setState({ color: color });
  }

  function updateTypographyField(fieldName, changes) {
    var state = store.getState();
    var typography = Object.assign({}, state.typography);
    typography[fieldName] = Object.assign({}, typography[fieldName], changes);
    store.setState({ typography: typography });
  }

  // Layout/lockup changes cascade into canvasFormat the same way
  // projectType cascades into Style DNA's aspectRatio.
  function updateCompositionField(fieldName, changes) {
    var state = store.getState();
    var composition = Object.assign({}, state.composition);
    composition[fieldName] = Object.assign({}, composition[fieldName], changes);
    var patch = { composition: composition };
    if (state.canvasFormat.auto && (fieldName === "layout" || fieldName === "lockup")) {
      patch.canvasFormat = Object.assign({}, state.canvasFormat, {
        value: suggestedCanvasFormat(
          fieldName === "layout" ? changes.value : composition.layout.value,
          fieldName === "lockup" ? changes.value : composition.lockup.value
        ),
      });
    }
    store.setState(patch);
  }

  function setCanvasFormatManually(newValue) {
    var state = store.getState();
    store.setState({ canvasFormat: Object.assign({}, state.canvasFormat, { value: newValue, auto: false }) });
  }

  function resetCanvasFormatToAuto() {
    var state = store.getState();
    store.setState({
      canvasFormat: Object.assign({}, state.canvasFormat, {
        auto: true,
        value: suggestedCanvasFormat(state.composition.layout.value, state.composition.lockup.value),
      }),
    });
  }

  function setTier(tier) {
    if (TIERS.indexOf(tier) === -1) return;
    store.setState({ tier: tier });
  }

  function toggleNoTextSymbolOnly(enabled) {
    store.setState({ noTextSymbolOnly: enabled });
  }

  function updateNegativeConstraint(key, enabled) {
    var state = store.getState();
    var negativeConstraints = Object.assign({}, state.negativeConstraints);
    negativeConstraints[key] = enabled;
    store.setState({ negativeConstraints: negativeConstraints });
  }

  // ---------------------------------------------------------------------
  // Negative constraints (#13) — user-toggleable, auto-clear when the
  // corresponding thing was explicitly selected elsewhere (gradient via
  // Logo's own Color fields, 3D via Dimensional Treatment). Merged into
  // the shared Negative Prompt output by ui.js, not appended as its own
  // block — this is genuinely an exclusion list, unlike Section E/F below.
  // ---------------------------------------------------------------------
  function getNegativeConstraintItems() {
    var state = store.getState();
    var nc = state.negativeConstraints;
    var items = [];
    if (nc.noMockups) items.push("mockups");
    var hasGradient = !!resolved(state.color.gradient) && resolved(state.color.gradient).toLowerCase() !== "none";
    if (nc.noGradients && !hasGradient) items.push("gradients");
    if (nc.noShadows) items.push("shadows");
    var is3d = resolved(state.dimensional) === "dimensional / 3d";
    if (nc.no3d && !is3d) items.push("3d rendering");
    if (nc.avoidComplexity) items.push("unnecessary complexity");
    var cliche = INDUSTRY_CLICHE_MAP[resolved(state.industry)];
    if (cliche) items.push(cliche);
    return items;
  }

  function getNegativeContribution() {
    return getNegativeConstraintItems().join(", ");
  }

  // ---------------------------------------------------------------------
  // Assembly (Section D) — core creative descriptors only. The Section
  // E/F fixed legal/quality blocks are NOT included here; ui.js appends
  // them after platform formatting, since a trademark disclaimer sentence
  // has no sensible "tag" form for Midjourney-style output.
  // ---------------------------------------------------------------------
  function assemblePrompt() {
    var state = store.getState();
    var parts = [];
    var fragments = [];

    function add(text) {
      if (!text) return;
      parts.push(text);
      fragments.push(text);
    }

    // Output Variations opens the prompt as an instruction, same role as
    // every other mode's "Generate N variations" intro.
    var outputVariations = resolved(state.outputVariations);
    var intro = outputVariations ? "Generate " + outputVariations + ":" : "";

    // Brand Story (#14) — the "soul" field, weighted ahead of generic
    // aesthetic filler but behind hard constraints, so it opens the
    // sentence as scene-setting intent. Respects its own include toggle
    // like Brand Name/Initials/Tagline below.
    var story = resolved(state.brandStory);
    if (story) add(story);

    // 1. Logo type + composition/lockup + container
    add(
      [resolved(state.logoType), resolved(state.composition.layout), resolved(state.composition.lockup), resolved(state.composition.container)]
        .filter(Boolean)
        .join(", ")
    );

    // 2. Icon/symbol direction (+ symbol meaning if Pro)
    var iconBits = [resolved(state.iconography)];
    if (state.tier === "pro") {
      var meaning = resolved(state.symbolMeaning);
      if (meaning) iconBits.push("symbolizing " + meaning);
    }
    add(iconBits.filter(Boolean).join(", "));

    // 3. Text — Brand Name and/or Initials, each independently includable
    // so both can stay filled in without forcing either into every prompt.
    var brandName = resolved(state.brandName);
    var initials = resolved(state.initials);
    var tagline = resolved(state.tagline);
    var hasText = !state.noTextSymbolOnly && !!(brandName || initials);

    // Typography — only matters once there's actually text to style.
    if (hasText) {
      add(
        [resolved(state.typography.primaryFont), resolved(state.typography.secondaryFont), resolved(state.typography.accentFont)]
          .filter(Boolean)
          .join(", ")
      );
    }

    // 4. Personality + Industry + Style-Era (+ Archetype) — capped at 3
    // dominant descriptors, priority order per the Conflict Resolution
    // Hierarchy: Personality > Industry > Style-Era > Archetype.
    var dominant = [];
    if (resolved(state.personality)) dominant.push(resolved(state.personality));
    if (resolved(state.industry)) dominant.push(resolved(state.industry) + " industry");
    if (state.tier === "pro" && resolved(state.styleEra)) dominant.push(resolved(state.styleEra));
    if (state.tier === "pro" && resolved(state.archetype)) dominant.push(resolved(state.archetype) + " archetype");
    dominant = dominant.slice(0, 3);
    if (dominant.length) add(dominant.join(", ") + " aesthetic");

    // 5. Color — Logo's own fields now, no Brand Kit reach-through needed
    // (an active kit already writes straight into these, same mechanism
    // Text/Character/Graphics/Reference already use).
    add(
      [
        resolved(state.colorConstraint),
        resolved(state.color.primary) && "primary color " + resolved(state.color.primary),
        resolved(state.color.secondary) && "secondary color " + resolved(state.color.secondary),
        resolved(state.color.accent) && "accent color " + resolved(state.color.accent),
        resolved(state.color.neutral) && "neutral/base color " + resolved(state.color.neutral),
        resolved(state.color.gradient) && resolved(state.color.gradient).toLowerCase() !== "none" && resolved(state.color.gradient) + " gradient style",
        resolved(state.color.mood) && resolved(state.color.mood) + " color mood",
      ]
        .filter(Boolean)
        .join(", ")
    );

    // 6. Dimensional treatment
    var dimensional = resolved(state.dimensional);
    if (dimensional) add(dimensional === "flat" ? "flat design" : "dimensional 3d treatment");

    if (state.tier === "lite") add(LITE_TIER_PHRASE);

    // 7. Exact-text lock — its own sentence(s), not comma-joined with the
    // rest, per the doc's literal required phrasing. Brand Name and
    // Initials each get locked independently when both are present.
    //
    // These sentences only ever reach .text, never fragments — and tag-
    // style platforms (Midjourney/Leonardo) format from fragments only,
    // dropping .text's prose entirely (same rule every other mode's outro
    // already lives with). Without something in fragments too, the brand
    // name would silently vanish from the prompt on those platforms —
    // exactly the one thing that can't be allowed to happen for a logo's
    // actual text. Pushed to fragments directly (not through add(), which
    // would also drop a redundant second mention into the sentence-style
    // .text output, on top of the full lock sentence below) — sentence-
    // style platforms keep just the one explicit instruction.
    var textLockSentences = [];
    if (hasText) {
      if (brandName) {
        textLockSentences.push('The exact text must read: "' + brandName + '" in full, with no changes or paraphrasing.');
        fragments.push('the text "' + brandName + '"');
      }
      if (initials) {
        textLockSentences.push('The exact initials must read: "' + initials + '" in full, with no changes or paraphrasing.');
        fragments.push('the initials "' + initials + '"');
      }
      if (tagline) {
        textLockSentences.push('The exact tagline must read: "' + tagline + '" in full.');
        fragments.push('the tagline "' + tagline + '"');
      }
      textLockSentences.push(TEXT_FAILURE_FALLBACK);
    }

    // Buffer/Padding lives in shared Style DNA, same treatment as every
    // other mode.
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) add(resolved(bufferEntry.field));

    // 8. Background
    var background = resolved(state.background) || "transparent";
    var backgroundSentence = "Background: " + background + ".";

    var mainSentence = parts.filter(Boolean).join(", ") + ".";
    var text = [intro, mainSentence].concat(textLockSentences).concat([backgroundSentence]).filter(Boolean).join(" ");

    return { text: text, fragments: fragments };
  }

  // Section E + F — always plain text, appended after platform formatting
  // regardless of tag/sentence style, since legal/quality boilerplate
  // doesn't have a sensible tag form.
  function buildAutoAppendBlock() {
    var state = store.getState();
    var trademark = TRADEMARK_LINE;
    if (resolved(state.useMode) === USE_MODE_OPTIONS[1]) trademark += RESALE_TRADEMARK_NOTE;
    return [QUALITY_CONSTRAINTS_BLOCK, trademark, TRADEMARK_DISCLAIMER].join(" ");
  }

  function randomize() {
    function randomPick(field) {
      var options = field.options || [];
      return options.length ? options[Math.floor(Math.random() * options.length)] : "";
    }
    var state = store.getState();
    updateField("logoType", { value: randomPick(state.logoType), customValue: "" });
    updateField("industry", { value: randomPick(state.industry), customValue: "" });
    updateField("personality", { value: randomPick(state.personality), customValue: "" });
    updateField("iconography", { value: randomPick(state.iconography), customValue: "" });
    updateCompositionField("layout", { value: randomPick(state.composition.layout), customValue: "" });
    updateCompositionField("lockup", { value: randomPick(state.composition.lockup), customValue: "" });
    updateCompositionField("container", { value: randomPick(state.composition.container), customValue: "" });
    updateField("colorConstraint", { value: randomPick(state.colorConstraint), customValue: "" });
    updateColorField("primary", { value: randomPick(state.color.primary), customValue: "" });
    updateColorField("accent", { value: randomPick(state.color.accent), customValue: "" });
    if (!state.noTextSymbolOnly && (resolved(state.brandName) || resolved(state.initials))) {
      updateTypographyField("primaryFont", { value: randomPick(state.typography.primaryFont), customValue: "" });
      updateTypographyField("accentFont", { value: randomPick(state.typography.accentFont), customValue: "" });
    }
    if (state.tier === "pro") {
      updateField("archetype", { value: randomPick(state.archetype), customValue: "" });
      updateField("styleEra", { value: randomPick(state.styleEra), customValue: "" });
    }
  }

  function reset() {
    store.setState(buildInitialState());
  }

  // Groups shown in the Creative Brief / selections summary panel.
  function getSelectionsByGroup() {
    var state = store.getState();
    var resolveFields = PromptHaus.engine.resolveFields;
    var groups = [];

    var foundation = resolveFields([
      { label: "Logo Type", field: state.logoType },
      { label: "Industry", field: state.industry },
      { label: "Personality", field: state.personality },
    ]);
    if (foundation.length) groups.push({ title: "Foundation", items: foundation });

    var composition = resolveFields([
      { label: "Iconography", field: state.iconography },
      { label: "Layout", field: state.composition.layout },
      { label: "Lockup", field: state.composition.lockup },
      { label: "Container", field: state.composition.container },
    ]);
    if (composition.length) groups.push({ title: "Composition", items: composition });

    var color = resolveFields([
      { label: "Primary Color", field: state.color.primary },
      { label: "Secondary Color", field: state.color.secondary },
      { label: "Accent Color", field: state.color.accent },
      { label: "Neutral/Base Color", field: state.color.neutral },
      { label: "Gradient Style", field: state.color.gradient },
      { label: "Color Mood", field: state.color.mood },
    ]);
    if (color.length) groups.push({ title: "Color", items: color });

    var typography = resolveFields([
      { label: "Primary Font", field: state.typography.primaryFont },
      { label: "Secondary Font", field: state.typography.secondaryFont },
      { label: "Accent Font", field: state.typography.accentFont },
    ]);
    if (typography.length) groups.push({ title: "Typography", items: typography });

    var colorFormat = resolveFields([
      { label: "Color Constraint", field: state.colorConstraint },
      { label: "Dimensional Treatment", field: state.dimensional },
      { label: "Background", field: state.background },
      { label: "Canvas Format", field: state.canvasFormat },
      { label: "Output", field: state.outputVariations },
    ]);
    if (colorFormat.length) groups.push({ title: "Color & Format", items: colorFormat });

    if (state.tier === "pro") {
      var proMode = resolveFields([
        { label: "Archetype", field: state.archetype },
        { label: "Style Era", field: state.styleEra },
      ]);
      if (proMode.length) groups.push({ title: "Pro Mode", items: proMode });
    }
    return groups;
  }

  PromptHaus.logo = Object.assign({}, store, {
    tiers: TIERS,
    optionLists: {
      useMode: USE_MODE_OPTIONS,
      logoType: LOGO_TYPE_OPTIONS,
      industry: INDUSTRY_OPTIONS,
      personality: PERSONALITY_OPTIONS,
      iconography: ICONOGRAPHY_OPTIONS,
      layout: LAYOUT_OPTIONS,
      lockup: LOCKUP_RELATIONSHIP_OPTIONS,
      container: CONTAINER_OPTIONS,
      background: BACKGROUND_OPTIONS,
      canvasFormat: CANVAS_FORMAT_OPTIONS,
      colorConstraint: COLOR_CONSTRAINT_OPTIONS,
      dimensional: DIMENSIONAL_OPTIONS,
      outputVariations: OUTPUT_VARIATIONS_OPTIONS,
      archetype: ARCHETYPE_OPTIONS,
      styleEra: STYLE_ERA_OPTIONS,
    },
    updateField: updateField,
    updateColorField: updateColorField,
    updateTypographyField: updateTypographyField,
    updateCompositionField: updateCompositionField,
    setCanvasFormatManually: setCanvasFormatManually,
    resetCanvasFormatToAuto: resetCanvasFormatToAuto,
    setTier: setTier,
    toggleNoTextSymbolOnly: toggleNoTextSymbolOnly,
    updateNegativeConstraint: updateNegativeConstraint,
    getNegativeContribution: getNegativeContribution,
    buildAutoAppendBlock: buildAutoAppendBlock,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    getSelectionsByGroup: getSelectionsByGroup,
  });

  // Brand Kit's own initial-load apply ran before this module existed
  // (script order: Brand Kit has to load first, since buildInitialState
  // above reads its optionLists) — so if a kit was already active from a
  // previous session, Logo's color/typography fields would otherwise
  // start blank until the user touched something. Catch up now.
  PromptHaus.brandKit.applyActiveKitToAllModes();
})();
