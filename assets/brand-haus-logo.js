/**
 * The AI Creator's Brand Haus — Logo Studio
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-identity.js, and brand-haus-ui.js's exposed
 * BrandHaus.ui helpers (all must load first).
 *
 * Ported from Prompt Haus's own prompt-builder-logo.js (same tier ladder,
 * same Conflict Resolution Hierarchy, same trademark-awareness auto-append
 * block) — simplified in two ways since this is a standalone port, not a
 * shared module: (1) Color/Typography are curated standalone option lists
 * instead of reaching into a Brand Kit module Brand Haus doesn't have;
 * (2) no tag-style/Midjourney aspect-ratio formatting, since Marketing
 * Haus's formatForPlatform is sentence-only — Canvas Format still folds
 * into the prompt as a descriptive phrase.
 *
 * Brand Name defaults to the shared Business Name (Identity bar)
 * when left blank here, fulfilling that field's own "carries into every
 * studio automatically" promise — still fully overridable per logo project.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var makeField = BrandHaus.util.makeField;
  var sortAlpha = BrandHaus.util.sortAlpha;

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
    "hand-crafted artisanal", "timeless-classic",
  ];

  var ICONOGRAPHY_OPTIONS = [
    "no icon (text only)", "abstract symbol", "literal symbol (crown, cross, leaf, bolt, etc.)",
    "monogram integration", "geometric shapes", "nature-based forms", "minimal line icon",
  ];

  // Layout used to be a third, separately-pickable field alongside Lockup
  // Relationship and Container — but its own options ("horizontal lockup",
  // "stacked", "badge", "circular seal") just restated the other two in
  // different words, and could actively contradict them (e.g. Layout=
  // "circular seal" + Container="square badge"). Folded away: Lockup
  // Relationship covers icon/text arrangement, Container covers the
  // shape/frame treatment (including the one genuinely distinct Layout
  // option, negative-space, added below).
  var LOCKUP_RELATIONSHIP_OPTIONS = ["icon above text", "icon left of text", "text only", "icon only", "tagline below name"];
  var CONTAINER_OPTIONS = [
    "contained in a circle badge", "contained in a shield badge",
    "contained in a square badge", "free-standing (no container)", "negative-space design",
  ];

  var BACKGROUND_OPTIONS = ["transparent", "white", "dark/black"];
  var CANVAS_FORMAT_OPTIONS = ["square (1:1)", "landscape / horizontal", "portrait / vertical"];

  var COLOR_CONSTRAINT_OPTIONS = [
    "full color allowed", "2-color limit", "1-color only (stamp-ready)",
    "black & white first priority", "invertible design required (works on light and dark)",
  ];

  // Rendering / illustration style — the axis that decides whether a mark
  // comes out as a clean professional logo vs a cartoony mascot. Defaults to
  // "clean flat vector" so logos read as logos unless a livelier style is
  // chosen on purpose.
  var LOGO_STYLE_OPTIONS = [
    "clean flat vector",
    "minimalist line art",
    "geometric / abstract",
    "vintage / retro badge",
    "hand-drawn / organic",
    "mascot / character",
    "cartoon / playful",
    "realistic / detailed illustration",
  ];

  var DIMENSIONAL_OPTIONS = ["flat", "dimensional / 3d"];
  // "logo system set (primary + simplified icon/submark)" used to live
  // here as a 4th option — it only ever prepended a phrase to the same
  // single sentence, hoping the AI inferred a system from wording alone.
  // The Logo Board toggle below replaces it with the real thing: actual
  // separate labeled prompts, not a hint stapled onto one image.
  var OUTPUT_VARIATIONS_OPTIONS = ["1 concept", "3 concepts", "5 concepts"];

  // Real Brand DNA profile names (not the generic 12 Jungian archetypes
  // this list used to hardcode) — reuses the canonical WHEEL_ORDER list
  // from brand-haus-branddna.js (already loaded by this point in every
  // script-load order this file ships in) so it can never drift out of
  // sync with the actual 11 profiles.
  var ARCHETYPE_OPTIONS = BrandHaus.brandDNA.WHEEL_ORDER.slice();

  var GRADIENT_OPTIONS = sortAlpha(["none", "subtle two-tone gradient", "vibrant multi-color gradient", "metallic sheen", "duotone"]);
  var COLOR_MOOD_OPTIONS = sortAlpha(["warm", "cool", "monochrome", "high contrast", "pastel", "jewel-tone", "earthy and muted", "vibrant and saturated"]);
  var FONT_STYLE_OPTIONS = sortAlpha([
    "bold sans-serif", "elegant serif", "hand-lettered script", "modern geometric sans", "vintage display",
    "condensed athletic", "playful rounded", "elegant italic script", "minimalist thin sans", "classic serif",
  ]);

  var CANVAS_FORMAT_PHRASE = { "square (1:1)": "square format", "landscape / horizontal": "landscape format", "portrait / vertical": "portrait format" };

  // Container's badge shapes take precedence (a badge is almost always
  // square-canvas regardless of what's inside it); Lockup Relationship is
  // the fallback signal once there's no container shape driving it.
  var CANVAS_FORMAT_SUGGESTIONS_BY_CONTAINER = {
    "contained in a circle badge": "square (1:1)", "contained in a shield badge": "square (1:1)",
    "contained in a square badge": "square (1:1)",
  };
  var CANVAS_FORMAT_SUGGESTIONS_BY_LOCKUP = {
    "icon left of text": "landscape / horizontal", "text only": "landscape / horizontal",
    "tagline below name": "portrait / vertical", "icon above text": "square (1:1)", "icon only": "square (1:1)",
  };
  function suggestedCanvasFormat(lockupRelationship, container) {
    return CANVAS_FORMAT_SUGGESTIONS_BY_CONTAINER[container] || CANVAS_FORMAT_SUGGESTIONS_BY_LOCKUP[lockupRelationship] || "square (1:1)";
  }

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

  var QUALITY_CONSTRAINTS_BLOCK =
    "no watermark; avoid generic glyph shapes (circle-arrow, globe, plain crown/lion/shield/eagle silhouettes); " +
    "avoid symmetrical clip-art icons and default UI/emoji-like shapes; original, distinctive mark.";

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
    return {
      tier: "standard",
      useMode: makeField(USE_MODE_OPTIONS[0], USE_MODE_OPTIONS),
      logoType: makeField("", LOGO_TYPE_OPTIONS),
      logoStyle: makeField("clean flat vector", LOGO_STYLE_OPTIONS),
      industry: makeField("", INDUSTRY_OPTIONS),
      personality: makeField("", PERSONALITY_OPTIONS),
      // 6 named roles, matching the same Primary/Secondary/Accent/Neutral/
      // Support/Stand-Out vocabulary Brand DNA profiles and Brand Kit
      // already use elsewhere — not a Logo-Studio-specific set, so a
      // Brand Kit's saved palette maps onto this one-to-one (see
      // maybeAutoApplyBrandKit below).
      color: {
        primary: makeField("", [], { isColorPicker: true }),
        secondary: makeField("", [], { isColorPicker: true }),
        accent: makeField("", [], { isColorPicker: true }),
        neutral: makeField("", [], { isColorPicker: true }),
        support: makeField("", [], { isColorPicker: true }),
        standOut: makeField("", [], { isColorPicker: true }),
        gradient: makeField("", GRADIENT_OPTIONS),
        mood: makeField("", COLOR_MOOD_OPTIONS),
      },
      typography: {
        primaryFont: makeField("", FONT_STYLE_OPTIONS),
        secondaryFont: makeField("", FONT_STYLE_OPTIONS),
      },
      iconography: makeField("", ICONOGRAPHY_OPTIONS),
      composition: {
        lockup: makeField("", LOCKUP_RELATIONSHIP_OPTIONS),
        container: makeField("", CONTAINER_OPTIONS),
      },
      noTextSymbolOnly: false,
      // includeInPrompt starts false for both — text only reaches the
      // prompt once explicitly opted into via the checkbox, not just by
      // having something typed (or, for Brand Name, inherited from the
      // shared Business Name below).
      brandName: makeField("", [], { isFreeText: true, includeInPrompt: false }),
      initials: makeField("", [], { isFreeText: true, includeInPrompt: false }),
      background: makeField("transparent", BACKGROUND_OPTIONS),
      canvasFormat: makeField("square (1:1)", CANVAS_FORMAT_OPTIONS, { auto: true }),
      colorConstraint: makeField("", COLOR_CONSTRAINT_OPTIONS),
      dimensional: makeField("flat", DIMENSIONAL_OPTIONS),
      outputVariations: makeField("1 concept", OUTPUT_VARIATIONS_OPTIONS),
      negativeConstraints: { noMockups: true, noGradients: true, noShadows: true, no3d: true, avoidComplexity: true },
      archetype: makeField("", ARCHETYPE_OPTIONS),
      symbolMeaning: makeField("", [], { isFreeText: true }),
      competitorAvoidance: makeField("", [], { isFreeText: true }),
      // Off by default — single-logo mode (today's existing behavior) is
      // still the default; this only replaces Output Variations, it
      // doesn't add to it (5 pieces × 3 concepts would be 15 blocks).
      logoBoard: false,
      // "separate" = 5 individually-copyable prompts (existing behavior,
      // each piece gets the AI's full attention). "combined" = one prompt
      // asking the AI to compose all 5 onto a single presentation-board
      // image, closer to a real brand identity sheet — at the cost of
      // small labels/layout being up to the AI's own judgment, and quality
      // per piece typically dropping a bit since it's splitting attention
      // across everything in one generation instead of one focused pass.
      boardMode: "separate",
    };
  }

  // The 5 pieces a Logo Board generates, in order. Every piece shares the
  // same Foundation/Colors/Typography/Iconography fields already set in
  // the panel — only the icon/text arrangement, color constraint, and one
  // trailing instruction sentence change per piece. `opts` is read by
  // buildMainSentenceParts below.
  var LOGO_BOARD_PIECES = [
    { key: "primary", label: "Primary Logo", opts: {} },
    {
      key: "secondary", label: "Secondary / Simplified Icon",
      opts: { forceIconOnly: true, extraInstruction: "A simplified icon-only version of the same mark, with no text — suitable as a standalone submark or social avatar." },
    },
    {
      key: "wordmark", label: "Wordmark-Only Version",
      opts: { forceTextOnly: true, extraInstruction: "A clean wordmark-only version using just the brand name and/or initials in the chosen typography, with no icon or symbol." },
    },
    {
      key: "favicon", label: "Favicon / Small-Size Version",
      opts: { forceIconOnly: true, extraInstruction: "An extremely simplified, high-contrast icon version optimized for very small sizes (favicon, app icon, social avatar) — bold shapes only, no fine detail, must stay recognizable at 16x16px." },
    },
    {
      key: "singleColor", label: "Single-Color Version",
      opts: { forceSingleColor: true, extraInstruction: "A single-color (one ink) version suitable for stamps, embroidery, or one-color print — same composition, no gradients or multiple colors." },
    },
  ];

  function toggleLogoBoard(enabled) {
    store.setState({ logoBoard: enabled });
  }

  function setBoardMode(mode) {
    store.setState({ boardMode: mode });
  }

  // One-shot-per-completed-assessment auto-fill, same object-identity
  // guard used elsewhere in Brand Haus (see brand-haus-ui.js's
  // maybeAutoApplyAssessment): only overwrites Archetype when it's still
  // blank, so a manual override never gets silently clobbered, but a
  // retake (a genuinely new results object) gets one fresh chance to fill
  // it in again.
  var lastAutoAppliedArchetypeResults = null;
  function maybeAutoApplyArchetype() {
    var results = BrandHaus.founderInterview && BrandHaus.founderInterview.getState().results;
    if (!results || results === lastAutoAppliedArchetypeResults) return;
    lastAutoAppliedArchetypeResults = results;
    if (!resolved(store.getState().archetype)) {
      updateField("archetype", { value: results.match.best.profile.name, customValue: "" });
    }
  }

  // Same one-shot-per-change idea, keyed on the active Brand Kit's id
  // rather than a results object (Brand Kit has no completed/uncompleted
  // state the way an assessment does). Only actually applies anything if
  // Logo Studio's own Colors AND Typography are still completely blank —
  // checked via each field's raw .value, not resolved() (which would
  // treat an intentionally-unchecked "Include in prompt" color as "still
  // blank" and re-fill over a real choice). Manually clicking "Set
  // Active" in the Brand Kit panel still works exactly as before and can
  // always be used to re-apply later.
  var lastAutoAppliedKitId = null;
  function maybeAutoApplyBrandKit() {
    var brandKit = BrandHaus.brandKit;
    if (!brandKit) return;
    var kit = brandKit.getActiveKit();
    if (!kit || kit.id === lastAutoAppliedKitId) return;
    lastAutoAppliedKitId = kit.id;
    var state = store.getState();
    var colorRoles = ["primary", "secondary", "accent", "neutral", "support", "standOut"];
    var colorsBlank = colorRoles.every(function (role) { return !state.color[role].value; });
    var fontsBlank = !state.typography.primaryFont.value && !state.typography.secondaryFont.value;
    if (colorsBlank && fontsBlank) brandKit.applyKitToLogo(kit);
  }

  var store = BrandHaus.util.createStore(buildInitialState());

  function resolved(field) {
    return BrandHaus.engine.resolveFieldValue(field);
  }

  function updateField(fieldName, changes) {
    BrandHaus.util.updateField(store, fieldName, changes);
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

  function updateCompositionField(fieldName, changes) {
    var state = store.getState();
    var composition = Object.assign({}, state.composition);
    composition[fieldName] = Object.assign({}, composition[fieldName], changes);
    var patch = { composition: composition };
    if (state.canvasFormat.auto && (fieldName === "lockup" || fieldName === "container")) {
      patch.canvasFormat = Object.assign({}, state.canvasFormat, {
        value: suggestedCanvasFormat(
          fieldName === "lockup" ? changes.value : composition.lockup.value,
          fieldName === "container" ? changes.value : composition.container.value
        ),
      });
    }
    store.setState(patch);
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

  // The shared Business Name fallback only kicks in once Brand Name's own
  // "Include in prompt" checkbox is actually checked — otherwise leaving
  // this field untouched (the common case, since the name already lives
  // in the Identity bar) would silently pull it into the prompt anyway,
  // exactly the auto-include behavior this field is meant to avoid now.
  function effectiveBrandName(state) {
    if (state.brandName.includeInPrompt === false) return "";
    return resolved(state.brandName) || BrandHaus.engine.resolveFieldValue(BrandHaus.identity.getState().businessName);
  }

  // The shared core every prompt (single-logo mode, and every Logo Board
  // piece) builds from — same field reads either way, just optionally
  // overridden per `opts`:
  //  - forceIconOnly: suppress text entirely (Secondary/Favicon pieces)
  //  - forceTextOnly: suppress the icon entirely (Wordmark piece)
  //  - forceSingleColor: swap Color Constraint to 1-color and drop the
  //    named hex colors (a single-color version has nothing to do with
  //    the multi-color palette)
  //  - extraInstruction: one trailing sentence specific to that piece
  function buildMainSentenceParts(state, opts) {
    opts = opts || {};
    var parts = [];
    function add(text) { if (text) parts.push(text); }

    // Rendering style leads the descriptor list so it sets the overall look
    // (clean vector vs mascot vs realistic) before the structural details.
    var logoStyle = resolved(state.logoStyle);
    if (logoStyle) add(logoStyle + " logo style");

    var lockupVal = opts.forceTextOnly ? "text only" : (opts.forceIconOnly ? "icon only" : resolved(state.composition.lockup));
    add([resolved(state.logoType), lockupVal, resolved(state.composition.container)].filter(Boolean).join(", "));

    var iconBits = [];
    if (!opts.forceTextOnly) {
      iconBits.push(resolved(state.iconography));
      if (state.tier === "pro") {
        var meaning = resolved(state.symbolMeaning);
        if (meaning) iconBits.push("symbolizing " + meaning);
      }
    }
    add(iconBits.filter(Boolean).join(", "));

    var brandName = effectiveBrandName(state);
    var initials = resolved(state.initials);
    var hasText = opts.forceIconOnly ? false : (!state.noTextSymbolOnly && !!(brandName || initials));

    if (hasText) {
      add([resolved(state.typography.primaryFont), resolved(state.typography.secondaryFont)].filter(Boolean).join(", "));
    }

    var dominant = [];
    if (resolved(state.personality)) dominant.push(resolved(state.personality));
    if (resolved(state.industry)) dominant.push(resolved(state.industry) + " industry");
    if (state.tier === "pro" && resolved(state.archetype)) dominant.push(resolved(state.archetype) + " archetype");
    dominant = dominant.slice(0, 3);
    if (dominant.length) add(dominant.join(", ") + " aesthetic");

    var colorConstraintVal = opts.forceSingleColor ? "1-color only (stamp-ready)" : resolved(state.colorConstraint);
    var colorParts = [colorConstraintVal];
    if (!opts.forceSingleColor) {
      colorParts.push(
        resolved(state.color.primary) && "primary color " + resolved(state.color.primary),
        resolved(state.color.secondary) && "secondary color " + resolved(state.color.secondary),
        resolved(state.color.accent) && "accent color " + resolved(state.color.accent),
        resolved(state.color.neutral) && "neutral/base color " + resolved(state.color.neutral),
        resolved(state.color.support) && "support color " + resolved(state.color.support),
        resolved(state.color.standOut) && "stand-out color " + resolved(state.color.standOut),
        resolved(state.color.gradient) && resolved(state.color.gradient).toLowerCase() !== "none" && resolved(state.color.gradient) + " style",
        resolved(state.color.mood) && resolved(state.color.mood) + " color mood"
      );
    }
    add(colorParts.filter(Boolean).join(", "));

    var dimensional = resolved(state.dimensional);
    if (dimensional) add(dimensional === "flat" ? "flat design" : "dimensional 3d treatment");

    add(CANVAS_FORMAT_PHRASE[resolved(state.canvasFormat)] || "");

    if (state.tier === "lite") add(LITE_TIER_PHRASE);
    if (opts.extraInstruction) add(opts.extraInstruction);

    return { parts: parts, hasText: hasText, brandName: brandName, initials: initials };
  }

  function buildTrailingSentences(state, built) {
    var textLockSentences = [];
    if (built.hasText) {
      if (built.brandName) textLockSentences.push('The exact text must read: "' + built.brandName + '" in full, with no changes or paraphrasing.');
      if (built.initials) textLockSentences.push('The exact initials must read: "' + built.initials + '" in full, with no changes or paraphrasing.');
      textLockSentences.push(TEXT_FAILURE_FALLBACK);
    }

    var background = resolved(state.background) || "transparent";
    var backgroundSentence = "Background: " + background + ".";

    var negativeItems = getNegativeConstraintItems();
    var negativeSentence = negativeItems.length ? "Avoid: " + negativeItems.join(", ") + "." : "";

    // QUALITY_CONSTRAINTS_BLOCK and TRADEMARK_LINE are genuine image-
    // generation instructions (avoid these shapes, don't recreate that
    // mark), so they stay in the actual prompt. TRADEMARK_DISCLAIMER and
    // RESALE_TRADEMARK_NOTE are pure user-facing legal notices with
    // nothing for an image model to act on — those live only in the UI
    // callout at the bottom of the panel (see renderPanel), never copied
    // into the prompt itself.
    var autoAppend = [QUALITY_CONSTRAINTS_BLOCK, TRADEMARK_LINE].join(" ");

    return textLockSentences.concat([backgroundSentence, negativeSentence, autoAppend]);
  }

  function assemblePrompt() {
    var state = store.getState();
    if (state.logoBoard) {
      var board = assembleLogoBoard(state);
      var first = board.length ? board[0] : { text: "" };
      return { text: first.text, fragments: [] };
    }

    var built = buildMainSentenceParts(state, {});
    var fragments = built.parts.slice();
    if (built.brandName) fragments.push('the text "' + built.brandName + '"');
    if (built.initials) fragments.push('the initials "' + built.initials + '"');

    // outputVariations ("1/3/5 concepts") is intentionally not woven into
    // the copied prompt text as "Generate N concepts:" — a single text
    // prompt telling an AI tool to produce several concepts at once is
    // frequently rendered as one combined comparison sheet instead of
    // several separate images (the same bug fixed across every other
    // mode/generator in this app). The field is informational: it tells
    // you how many times to run this same prompt, not an instruction sent
    // to the AI.
    var mainSentence = built.parts.filter(Boolean).join(", ") + ".";
    var text = [mainSentence].concat(buildTrailingSentences(state, built)).filter(Boolean).join(" ");

    return { text: text, fragments: fragments };
  }

  // A Logo Board = the same field set, assembled 5 times with different
  // icon/text-arrangement and color-constraint overrides — see
  // LOGO_BOARD_PIECES. The Wordmark piece is skipped entirely when
  // there's no actual brand name/initials to build a wordmark from
  // (symbol-only mode, or both text fields left un-included).
  function assembleLogoBoard(state) {
    if (state.boardMode === "combined") return [assembleLogoBoardCombined(state, false)];
    if (state.boardMode === "combinedIdentity") return [assembleLogoBoardCombined(state, true)];
    return LOGO_BOARD_PIECES.map(function (piece) {
      var built = buildMainSentenceParts(state, piece.opts);
      if (piece.opts.forceTextOnly && !built.hasText) return null;
      var mainSentence = built.parts.filter(Boolean).join(", ") + ".";
      var text = [mainSentence].concat(buildTrailingSentences(state, built)).filter(Boolean).join(" ");
      return { key: piece.key, label: piece.label, text: text };
    }).filter(Boolean);
  }

  // Pulls a short written brand-identity summary from Branding Studio
  // (mission, core values, brand voice, mood) plus Logo Studio's own
  // Personality/Industry/Archetype fields — read defensively since
  // Branding Studio is a separate module Logo Studio doesn't otherwise
  // depend on. Used only by the "Combined + Brand Identity" board mode,
  // to give the AI explicit "who this brand is" context up front rather
  // than relying on style/color adjectives alone to imply it.
  function buildBrandIdentitySummary(state) {
    var lines = [];
    var name = effectiveBrandName(state);
    if (name) lines.push('Brand: "' + name + '"');
    var branding = BrandHaus.branding && BrandHaus.branding.getState ? BrandHaus.branding.getState() : null;
    if (branding) {
      var mission = resolved(branding.mission);
      if (mission) lines.push("Mission: " + mission);
      var values = (branding.coreValues || []).map(function (v) { return (v || "").trim(); }).filter(Boolean);
      if (values.length) lines.push("Core Values: " + values.join(", "));
      var voice = resolved(branding.brandVoice);
      if (voice) lines.push("Brand Voice: " + voice);
      var mood = resolved(branding.mood);
      if (mood) lines.push("Brand Mood: " + mood);
    }
    if (state.tier === "pro" && resolved(state.archetype)) lines.push("Brand Archetype: " + resolved(state.archetype));
    if (resolved(state.personality)) lines.push("Personality: " + resolved(state.personality));
    if (resolved(state.industry)) lines.push("Industry: " + resolved(state.industry));
    return lines;
  }

  // One prompt asking the AI to compose all 5 Logo Board pieces onto a
  // single presentation-board image, instead of 5 separate generations —
  // each piece's own descriptive line feeds into one numbered list, and
  // the shared trailing sentences (text lock, background, negative
  // constraints, quality/trademark) are stated once for the whole board
  // rather than repeated per piece. When includeIdentity is true, a short
  // written Brand Identity block (mission/values/voice/archetype) is
  // stated up front, blending the fuller brand context into the board
  // request rather than just the logo pieces alone.
  function assembleLogoBoardCombined(state, includeIdentity) {
    var pieceLines = LOGO_BOARD_PIECES.map(function (piece) {
      var built = buildMainSentenceParts(state, piece.opts);
      if (piece.opts.forceTextOnly && !built.hasText) return null;
      var sentence = built.parts.filter(Boolean).join(", ");
      return piece.label + " — " + sentence + ".";
    }).filter(Boolean).map(function (line, i) {
      return (i + 1) + ". " + line;
    });

    var sharedBuilt = buildMainSentenceParts(state, {});
    var trailing = buildTrailingSentences(state, sharedBuilt).filter(Boolean).join(" ");

    var identityBlock = "";
    if (includeIdentity) {
      var summaryLines = buildBrandIdentitySummary(state);
      if (summaryLines.length) identityBlock = "Brand Identity:\n" + summaryLines.join("\n") + "\n\n";
    }

    var boardIntro = includeIdentity
      ? "Using the brand identity above, design a single brand identity / logo showcase board on one canvas, presenting all of the following logo variations clearly separated and individually labeled in a clean grid layout, consistent with that identity:"
      : "Design a single brand identity / logo showcase board on one canvas, presenting all of the following logo variations clearly separated and individually labeled in a clean grid layout:";

    var text = identityBlock + boardIntro + "\n\n" +
      pieceLines.join("\n") +
      "\n\nArrange every piece on one organized presentation sheet with clear visual separation and a small label under each piece identifying it — not overlapping or crowded. " + trailing;

    return { key: includeIdentity ? "combinedIdentity" : "combined", label: includeIdentity ? "Combined Board + Brand Identity" : "Combined Identity Board", text: text };
  }

  function randomize() {
    function randomPick(field) {
      var options = field.options || [];
      return options.length ? options[Math.floor(Math.random() * options.length)] : "";
    }
    var state = store.getState();
    updateField("logoType", { value: randomPick(state.logoType), customValue: "" });
    updateField("logoStyle", { value: randomPick(state.logoStyle), customValue: "" });
    updateField("industry", { value: randomPick(state.industry), customValue: "" });
    updateField("personality", { value: randomPick(state.personality), customValue: "" });
    updateField("iconography", { value: randomPick(state.iconography), customValue: "" });
    updateCompositionField("lockup", { value: randomPick(state.composition.lockup), customValue: "" });
    updateCompositionField("container", { value: randomPick(state.composition.container), customValue: "" });
    updateField("colorConstraint", { value: randomPick(state.colorConstraint), customValue: "" });
    // Primary/Accent color are no longer picked from a curated word list
    // (see buildInitialState) — they're an exact hex pick, and there's no
    // sensible "random hex" to land Randomize on that wouldn't just be
    // arbitrary noise, so those two are deliberately left alone here.
    if (!state.noTextSymbolOnly && (effectiveBrandName(state) || resolved(state.initials))) {
      updateTypographyField("primaryFont", { value: randomPick(state.typography.primaryFont), customValue: "" });
    }
    if (state.tier === "pro") {
      updateField("archetype", { value: randomPick(state.archetype), customValue: "" });
    }
  }

  function reset() {
    store.setState(buildInitialState());
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var resolveFields = BrandHaus.engine.resolveFields;
    var groups = [];

    var foundation = resolveFields([
      { label: "Logo Type", field: state.logoType },
      { label: "Logo Style", field: state.logoStyle },
      { label: "Industry", field: state.industry },
      { label: "Personality", field: state.personality },
    ]);
    if (foundation.length) groups.push({ title: "Foundation", items: foundation });

    var composition = resolveFields([
      { label: "Iconography", field: state.iconography },
      { label: "Lockup", field: state.composition.lockup },
      { label: "Container", field: state.composition.container },
    ]);
    if (composition.length) groups.push({ title: "Composition & Lockup", items: composition });

    var color = resolveFields([
      { label: "Primary Color", field: state.color.primary },
      { label: "Secondary Color", field: state.color.secondary },
      { label: "Accent Color", field: state.color.accent },
      { label: "Neutral/Base Color", field: state.color.neutral },
      { label: "Support Color", field: state.color.support },
      { label: "Stand-Out Color", field: state.color.standOut },
      { label: "Gradient Style", field: state.color.gradient },
      { label: "Color Mood", field: state.color.mood },
    ]);
    if (color.length) groups.push({ title: "Colors", items: color });

    var typography = resolveFields([
      { label: "Primary Font", field: state.typography.primaryFont },
      { label: "Secondary Font", field: state.typography.secondaryFont },
    ]);
    if (typography.length) groups.push({ title: "Typography", items: typography });

    var colorFormatEntries = [
      { label: "Color Constraint", field: state.colorConstraint },
      { label: "Dimensional Treatment", field: state.dimensional },
      { label: "Background", field: state.background },
      { label: "Canvas Format", field: state.canvasFormat },
    ];
    if (!state.logoBoard) colorFormatEntries.push({ label: "Output", field: state.outputVariations });
    var colorFormat = resolveFields(colorFormatEntries);
    if (state.logoBoard) {
      var boardOutputLabel = state.boardMode === "combinedIdentity" ? "Logo Board (1 combined image + brand identity)"
        : state.boardMode === "combined" ? "Logo Board (1 combined image)"
        : "Logo Board (5 pieces)";
      colorFormat.push({ label: "Output", value: boardOutputLabel });
    }
    if (colorFormat.length) groups.push({ title: "Color & Format", items: colorFormat });

    if (state.tier === "pro") {
      var proMode = resolveFields([{ label: "Archetype", field: state.archetype }]);
      if (proMode.length) groups.push({ title: "Pro Mode", items: proMode });
    }
    return groups;
  }

  // -----------------------------------------------------------------------
  // Panel rendering
  // -----------------------------------------------------------------------
  function renderCallout(iconName, text) {
    var ui = BrandHaus.ui;
    return ui.el("p", { class: "bh-logo-callout" }, [ui.icon(iconName), ui.el("span", { text: text })]);
  }

  function renderTierToggle(state) {
    var ui = BrandHaus.ui;
    var labels = { lite: "Lite", standard: "Standard", pro: "Pro" };
    var toggle = ui.renderPillToggle(
      TIERS.map(function (tier) {
        return {
          title: labels[tier],
          icon: "sparkle",
          isActive: state.tier === tier,
          onClick: function () { setTier(tier); BrandHaus.ui.renderApp(); },
        };
      })
    );
    return ui.el("fieldset", { class: "bh-field-group" }, [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("sparkle"), ui.el("span", { text: "Mode" })]),
      ui.el("p", {
        class: "bh-field-group__subtitle",
        text: "Standard is the normal field set. Lite keeps every field but asks the AI for a simpler design. Pro reveals strategist-level controls (Archetype, Symbol Meaning, Competitor Avoidance) below.",
      }),
      toggle,
    ]);
  }

  function renderTextFieldWithInclude(entry, onChange) {
    var ui = BrandHaus.ui;
    var fieldEl = ui.renderFreeTextField(entry, onChange);
    var checkbox = ui.el("input", { type: "checkbox", class: "bh-field__checkbox" });
    checkbox.checked = entry.field.includeInPrompt !== false;
    checkbox.addEventListener("change", function () { onChange({ includeInPrompt: checkbox.checked }); });
    fieldEl.querySelector(".bh-field__label-row").appendChild(ui.el("label", { class: "bh-field__include" }, [checkbox, ui.el("span", { text: "Include in prompt" })]));
    return fieldEl;
  }

  function renderTextSection(state) {
    var ui = BrandHaus.ui;
    var noTextCheckbox = ui.el("input", { type: "checkbox", class: "bh-field__checkbox" });
    noTextCheckbox.checked = state.noTextSymbolOnly;
    noTextCheckbox.addEventListener("change", function () { toggleNoTextSymbolOnly(noTextCheckbox.checked); BrandHaus.ui.renderApp(); });

    var children = [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("text"), ui.el("span", { text: "Logo Text" })]),
      ui.el("label", { class: "bh-logo-symbol-only" }, [noTextCheckbox, ui.el("span", { text: "No text — generate symbol only (recommended for combination marks and wordmarks)" })]),
    ];

    if (!state.noTextSymbolOnly) {
      var businessName = BrandHaus.engine.resolveFieldValue(BrandHaus.identity.getState().businessName);
      children.push(
        renderCallout("text", "AI struggles with text — the more words in the image, the higher the chance of misspelling or garbling. For the cleanest result, consider the symbol-only toggle above, then add your brand name yourself in a design tool. If you do include text, keep it short."),
        renderTextFieldWithInclude(
          { fieldName: "brandName", label: "Brand Name" + (businessName ? " (defaults to \"" + businessName + "\" if left blank and included)" : ""), field: state.brandName, placeholder: businessName || "" },
          function (changes) { updateField("brandName", changes); BrandHaus.ui.renderApp(); }
        ),
        renderTextFieldWithInclude({ fieldName: "initials", label: "Initials (up to 3)", field: state.initials }, function (changes) { updateField("initials", changes); BrandHaus.ui.renderApp(); })
      );
    }

    return BrandHaus.ui.el("fieldset", { class: "bh-field-group" }, children);
  }

  function renderNegativeConstraints(state) {
    var ui = BrandHaus.ui;
    var items = [
      { key: "noMockups", label: "No mockups" },
      { key: "noGradients", label: "No gradients (auto-clears if Gradient Style above is set)" },
      { key: "noShadows", label: "No shadows" },
      { key: "no3d", label: "No 3D rendering (auto-clears if Dimensional Treatment is set to 3D)" },
      { key: "avoidComplexity", label: "Avoid unnecessary complexity" },
    ];
    var rows = items.map(function (item) {
      var checkbox = ui.el("input", { type: "checkbox", class: "bh-field__checkbox" });
      checkbox.checked = state.negativeConstraints[item.key];
      checkbox.addEventListener("change", function () { updateNegativeConstraint(item.key, checkbox.checked); BrandHaus.ui.renderApp(); });
      return ui.el("label", { class: "bh-logo-symbol-only" }, [checkbox, ui.el("span", { text: item.label })]);
    });
    return ui.el("fieldset", { class: "bh-field-group" }, [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("shield"), ui.el("span", { text: "Negative Constraints" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "On by default — these become the exclusion list for this logo. Anything typed into the shared Negative Prompt up top carries over too." }),
      ui.el("div", { class: "bh-logo-negconstraints" }, rows),
    ]);
  }

  function renderProModeSection(state) {
    var ui = BrandHaus.ui;
    maybeAutoApplyArchetype();
    state = store.getState();
    var entries = [{ label: "Brand Archetype", field: state.archetype }];
    var fieldsContainer = ui.renderPlainFieldRow(entries, function (entry, changes) {
      updateField("archetype", changes);
      BrandHaus.ui.renderApp();
    });

    var symbolMeaningField = ui.renderFreeTextField({ label: "Symbol Meaning — what should this logo represent emotionally?", field: state.symbolMeaning }, function (changes) { updateField("symbolMeaning", changes); BrandHaus.ui.renderApp(); });

    // Competitor field rendered with no label of its own (empty string) so
    // the section title below reads as one real heading instead of a
    // duplicate — the explanation and the field sit right beneath it.
    var competitorField = ui.renderFreeTextField({ label: "", field: state.competitorAvoidance }, function (changes) { updateField("competitorAvoidance", changes); BrandHaus.ui.renderApp(); });

    return ui.el("fieldset", { class: "bh-field-group" }, [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("sparkle"), ui.el("span", { text: "Pro Mode" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "Archetype auto-fills from your completed Brand DNA Assessment and drives emotional shape language (e.g. The Quiet Authority → strong symmetry; The Free Spirit → expressive/asymmetric). Change it here if you want a different archetype's shape language for this logo specifically." }),
      fieldsContainer,
      symbolMeaningField,
      ui.el("p", { class: "bh-field__label", text: "Competitor-Style Avoidance" }),
      ui.el("p", { class: "bh-field-group__subtitle", text: 'Describe the competitor style you want to avoid in your own words — e.g. "avoid a single swoosh" or "avoid bitten-fruit minimalism." Don\'t name an actual brand: naming one can pull the AI toward it instead of away.' }),
      competitorField,
      ui.el("p", { class: "bh-logo-inline-disclaimer", text: "Describing a style to avoid is not the same as clearing a trademark. Avoid recreating any specific company's protected logo, symbol, or likeness — even loosely — and verify trademark/copyright independently before commercial use." }),
    ]);
  }

  // Hand-rolled (not ui.renderFieldGroup) purely so the Output row can
  // disappear entirely once Logo Board is on (toggled from the Foundation
  // box now) — a board replaces "how many concepts," it doesn't combine
  // with it (5 pieces × 3 concepts would be 15 blocks).
  function renderColorFormatSection(state) {
    var ui = BrandHaus.ui;
    var entries = [
      { label: "Color Constraint", field: state.colorConstraint },
      { label: "Dimensional Treatment", field: state.dimensional },
      { label: "Background", field: state.background },
      { label: "Canvas Format", field: state.canvasFormat },
    ];
    if (!state.logoBoard) entries.push({ label: "Output", field: state.outputVariations });

    var fieldsContainer = ui.renderPlainFieldRow(entries, function (entry, changes) {
      if (entry.label === "Color Constraint") updateField("colorConstraint", changes);
      else if (entry.label === "Dimensional Treatment") updateField("dimensional", changes);
      else if (entry.label === "Background") updateField("background", changes);
      else if (entry.label === "Canvas Format") store.setState({ canvasFormat: Object.assign({}, state.canvasFormat, changes, { auto: false }) });
      else updateField("outputVariations", changes);
      BrandHaus.ui.renderApp();
    });

    return ui.el("fieldset", { class: "bh-field-group" }, [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("palette"), ui.el("span", { text: "Color & Format" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "How many colors the mark can use, flat vs. dimensional, background, and canvas shape." }),
      fieldsContainer,
    ]);
  }

  // Hand-rolled (not ui.renderFieldGroup) so the Logo Board toggle can live
  // in this same fieldset, right after the fields it actually affects —
  // moved here from Color & Format (where it was a small, easy-to-miss
  // checkbox at the very bottom of a long page) since Foundation is the
  // first substantive box in the panel, and this is a foundational
  // "what am I even generating" choice, not a color/format detail.
  function renderFoundationSection(state) {
    var ui = BrandHaus.ui;
    var entries = [
      { label: "Logo Type", field: state.logoType },
      { label: "Logo Style", field: state.logoStyle },
      { label: "Industry / Context", field: state.industry },
      { label: "Brand Personality", field: state.personality },
    ];
    var fieldsContainer = ui.renderPlainFieldRow(entries, function (entry, changes) {
      if (entry.label === "Logo Type") updateField("logoType", changes);
      else if (entry.label === "Logo Style") updateField("logoStyle", changes);
      else if (entry.label === "Industry / Context") updateField("industry", changes);
      else updateField("personality", changes);
      BrandHaus.ui.renderApp();
    });

    var boardToggle = ui.el("div", { class: "bh-styledna__yesno" }, [
      ui.yesNoButton("Yes", state.logoBoard === true, function () { toggleLogoBoard(true); BrandHaus.ui.renderApp(); }),
      ui.yesNoButton("No", state.logoBoard !== true, function () { toggleLogoBoard(false); BrandHaus.ui.renderApp(); }),
    ]);
    var boardLabel = ui.labelWithIcon(
      "layers",
      "Generate as a Logo Board",
      null,
      null,
      "5 separate pieces — Primary Logo, Secondary/Simplified Icon, Wordmark-Only, Favicon/Small-Size, Single-Color — instead of picking an Output count in Color & Format below."
    );
    boardLabel.id = "bh-label-logo-board";
    boardToggle.setAttribute("role", "group");
    boardToggle.setAttribute("aria-labelledby", boardLabel.id);
    var boardRow = ui.el("div", { class: "bh-logo-board-toggle-row" }, [boardLabel, boardToggle]);

    var children = [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("logoMark"), ui.el("span", { text: "Foundation" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "The foundation every other choice builds on." }),
      fieldsContainer,
      boardRow,
    ];

    // Only shown once the board itself is on — 3 ways to generate it:
    // 5 separate generations (each piece gets the AI's full attention),
    // 1 combined image (closer to a real presentation sheet, at the cost
    // of the AI splitting attention across every piece in one generation),
    // or 1 combined image that also states the brand's mission/values/
    // voice/archetype up front, so the AI has explicit "who this brand
    // is" context rather than relying on style/color words alone.
    if (state.logoBoard) {
      var modeToggle = ui.el("div", { class: "bh-styledna__yesno bh-board-format-toggle" }, [
        ui.yesNoButton("Separate Prompts", state.boardMode === "separate", function () { setBoardMode("separate"); BrandHaus.ui.renderApp(); }),
        ui.yesNoButton("One Combined Image", state.boardMode === "combined", function () { setBoardMode("combined"); BrandHaus.ui.renderApp(); }),
        ui.yesNoButton("Combined + Brand Identity", state.boardMode === "combinedIdentity", function () { setBoardMode("combinedIdentity"); BrandHaus.ui.renderApp(); }),
      ]);
      var modeLabel = ui.labelWithIcon(
        "layers",
        "Board Format",
        null,
        null,
        "Separate Prompts generates each of the 5 pieces on its own, with full quality per piece. One Combined Image asks the AI to lay out all 5 on a single presentation-board image in one generation. Combined + Brand Identity does the same, plus states your mission, core values, brand voice, and archetype up front from Branding Studio so the board reflects the fuller brand, not just the logo fields. Either combined option means the AI is splitting attention across every piece in one generation, so per-piece quality and label placement are less predictable than Separate Prompts — and none of these include physical mockups, sub-brand lockups, or a color/type specimen strip like a full designed brand board."
      );
      modeLabel.id = "bh-label-board-mode";
      modeToggle.setAttribute("role", "group");
      modeToggle.setAttribute("aria-labelledby", modeLabel.id);
      children.push(ui.el("div", { class: "bh-logo-board-toggle-row" }, [modeLabel, modeToggle]));
    }

    return ui.el("fieldset", { class: "bh-field-group" }, children);
  }

  var logoBoardSaveFeedback = null;

  // Same "one Vault slot for the whole set, per-piece Copy buttons handle
  // individual pieces" pattern Business Card Kit/Media Kit already use —
  // reuses the same BrandHaus.ui helpers (copyTextToClipboard,
  // buildVaultTitle/buildVaultSnapshot) rather than inventing a second
  // save mechanism for Logo Studio specifically.
  function renderLogoBoardBlock(state) {
    var ui = BrandHaus.ui;
    var blocks = assembleLogoBoard(state);
    var wrap = ui.el("div", { class: "bh-generator-variations" });
    wrap.appendChild(ui.el("h4", { class: "bh-generator-variations__title" }, [ui.icon("layers"), ui.el("span", { text: "Your Logo Board" })]));

    blocks.forEach(function (block) {
      var copyBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--copy", text: "Copy" });
      copyBtn.addEventListener("click", function () {
        ui.copyTextToClipboard(block.text, function (ok) {
          copyBtn.textContent = ok ? "Copied!" : "Copy failed";
          setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
        });
      });
      wrap.appendChild(ui.el("div", { class: "bh-generator-variation" }, [
        ui.el("div", { class: "bh-generator-variation__header" }, [
          ui.el("span", { class: "bh-generator-variation__label", text: block.label }),
          copyBtn,
        ]),
        ui.el("p", { class: "bh-generator-variation__text", text: block.text }),
      ]));
    });

    var saveBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--save", text: "Save Whole Board to Vault" });
    saveBtn.addEventListener("click", function () {
      var combined = blocks.map(function (b) { return b.label.toUpperCase() + "\n\n" + b.text; }).join("\n\n" + "—".repeat(24) + "\n\n");
      var title = ui.buildVaultTitle("logo") + " (" + blocks.length + "-piece Logo Board)";
      var result = BrandHaus.favorites.save("logo", { text: combined, title: title, snapshot: ui.buildVaultSnapshot("logo") });
      logoBoardSaveFeedback = result.ok ? "Saved!" : result.reason;
      BrandHaus.ui.renderApp();
      setTimeout(function () { logoBoardSaveFeedback = null; BrandHaus.ui.renderApp(); }, 2500);
    });
    var row = ui.el("div", { class: "bh-companion__controls" }, [saveBtn]);
    if (logoBoardSaveFeedback) row.appendChild(ui.el("span", { style: "color: var(--bh-teal); font-weight: 600; font-size: 13px;", text: logoBoardSaveFeedback }));
    wrap.appendChild(row);

    return wrap;
  }

  function renderPanel() {
    var ui = BrandHaus.ui;
    maybeAutoApplyBrandKit();
    var state = store.getState();
    var panel = ui.el("div", { class: "bh-panel bh-panel--logo" });

    function handleFieldChange(fieldName) {
      return function (entry, changes) { updateField(fieldName, changes); BrandHaus.ui.renderApp(); };
    }

    panel.appendChild(renderCallout("logoMark", "This creates a logo concept, not a production file. AI image generators output a flattened raster image — for a real, scalable logo (favicon, embroidery, one-color print), recreate the result as a vector in Kittl, Illustrator, or with a designer. Use this as your direction, not your final file."));

    panel.appendChild(renderTierToggle(state));

    panel.appendChild(ui.renderFieldGroup("Use Mode", [{ label: "Who is this logo for?", field: state.useMode }], function (entry, changes) { updateField("useMode", changes); BrandHaus.ui.renderApp(); }, "Doesn't change the visual output — only how strongly the trademark guidance below is worded."));

    panel.appendChild(renderFoundationSection(state));

    panel.appendChild(ui.renderFieldGroup("Composition & Lockup", [
      { label: "Icon/Text Relationship", field: state.composition.lockup },
      { label: "Container", field: state.composition.container },
    ], function (entry, changes) {
      if (entry.label === "Icon/Text Relationship") updateCompositionField("lockup", changes);
      else updateCompositionField("container", changes);
      BrandHaus.ui.renderApp();
    }, "Icon/Text Relationship is the #1 thing that makes a logo read as intentional instead of thrown-together. Both fields drive Canvas Format's auto-suggestion below."));

    panel.appendChild(renderTextSection(state));

    panel.appendChild(ui.renderFieldGroup("Iconography", [{ label: "Symbol System", field: state.iconography }], function (entry, changes) { updateField("iconography", changes); BrandHaus.ui.renderApp(); }, "No icon, an abstract mark, or a literal symbol — the foundation of the visual."));

    panel.appendChild(ui.renderFieldGroup("Colors", [
      { label: "Primary Color", field: state.color.primary },
      { label: "Secondary Color", field: state.color.secondary },
      { label: "Accent Color", field: state.color.accent },
      { label: "Neutral/Base Color", field: state.color.neutral },
      { label: "Support Color", field: state.color.support },
      { label: "Stand-Out Color", field: state.color.standOut },
      { label: "Gradient Style", field: state.color.gradient },
      { label: "Color Mood", field: state.color.mood },
    ], function (entry, changes) {
      var map = { "Primary Color": "primary", "Secondary Color": "secondary", "Accent Color": "accent", "Neutral/Base Color": "neutral", "Support Color": "support", "Stand-Out Color": "standOut", "Gradient Style": "gradient", "Color Mood": "mood" };
      updateColorField(map[entry.label], changes);
      BrandHaus.ui.renderApp();
    }, "All 6 auto-fill from your active Brand Kit the first time you open Logo Studio (still fully editable). Pick each from the wheel or paste an exact hex code, and use \"Include in prompt\" to leave any of the 6 out without clearing it."));

    panel.appendChild(renderColorFormatSection(state));

    panel.appendChild(ui.renderFieldGroup("Typography", [
      { label: "Primary Font", field: state.typography.primaryFont },
      { label: "Secondary Font", field: state.typography.secondaryFont },
    ], function (entry, changes) {
      var map = { "Primary Font": "primaryFont", "Secondary Font": "secondaryFont" };
      updateTypographyField(map[entry.label], changes);
      BrandHaus.ui.renderApp();
    }, "Only matters once there's actual text — Brand Name and/or Initials above."));

    panel.appendChild(renderNegativeConstraints(state));

    if (state.tier === "pro") panel.appendChild(renderProModeSection(state));

    if (state.logoBoard) panel.appendChild(renderLogoBoardBlock(state));

    var trademarkCalloutText = "This tool helps you avoid obvious risks, but it does not perform a trademark check. Before using a logo commercially — especially one you plan to sell to others — verify trademark and copyright independently. " + TRADEMARK_DISCLAIMER;
    if (resolved(state.useMode) === USE_MODE_OPTIONS[1]) trademarkCalloutText += RESALE_TRADEMARK_NOTE;
    panel.appendChild(renderCallout("shield", trademarkCalloutText));

    return panel;
  }

  BrandHaus.logo = Object.assign({}, store, {
    tiers: TIERS,
    updateField: updateField,
    updateColorField: updateColorField,
    updateTypographyField: updateTypographyField,
    updateCompositionField: updateCompositionField,
    setTier: setTier,
    toggleNoTextSymbolOnly: toggleNoTextSymbolOnly,
    toggleLogoBoard: toggleLogoBoard,
    updateNegativeConstraint: updateNegativeConstraint,
    assemblePrompt: assemblePrompt,
    assembleLogoBoard: assembleLogoBoard,
    randomize: randomize,
    reset: reset,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
