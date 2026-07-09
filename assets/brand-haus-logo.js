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

  var ARCHETYPE_OPTIONS = [
    "the hero", "the creator", "the rebel", "the sage", "the caregiver",
    "the explorer", "the ruler", "the innocent", "the jester", "the lover",
    "the everyman", "the magician",
  ];
  var STYLE_ERA_OPTIONS = ["modern-minimal", "70s-retro", "hand-crafted artisanal", "techy-geometric", "timeless-classic"];

  var LOGO_COLOR_OPTIONS = sortAlpha([
    "black", "white", "charcoal grey", "hot pink", "teal", "gold", "navy blue", "forest green",
    "burgundy", "cream / ivory", "sky blue", "coral", "lavender", "mustard yellow", "terracotta",
    "sage green", "dusty rose", "copper / rust",
  ]);
  var LOGO_NEUTRAL_OPTIONS = sortAlpha(["white", "black", "light grey", "charcoal", "cream / ivory", "tan / beige", "warm grey"]);
  var GRADIENT_OPTIONS = sortAlpha(["none", "subtle two-tone gradient", "vibrant multi-color gradient", "metallic sheen", "duotone"]);
  var COLOR_MOOD_OPTIONS = sortAlpha(["warm", "cool", "monochrome", "high contrast", "pastel", "jewel-tone", "earthy and muted", "vibrant and saturated"]);
  var FONT_STYLE_OPTIONS = sortAlpha([
    "bold sans-serif", "elegant serif", "hand-lettered script", "modern geometric sans", "vintage display",
    "condensed athletic", "playful rounded", "elegant italic script", "minimalist thin sans", "classic serif",
  ]);

  var CANVAS_FORMAT_PHRASE = { "square (1:1)": "square format", "landscape / horizontal": "landscape format", "portrait / vertical": "portrait format" };

  var CANVAS_FORMAT_SUGGESTIONS = {
    "horizontal lockup": "landscape / horizontal", "icon left of text": "landscape / horizontal",
    stacked: "portrait / vertical", badge: "square (1:1)", "circular seal": "square (1:1)",
    centered: "square (1:1)", "icon only": "square (1:1)",
  };
  function suggestedCanvasFormat(layout, lockupRelationship) {
    return CANVAS_FORMAT_SUGGESTIONS[layout] || CANVAS_FORMAT_SUGGESTIONS[lockupRelationship] || "square (1:1)";
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
      industry: makeField("", INDUSTRY_OPTIONS),
      personality: makeField("", PERSONALITY_OPTIONS),
      color: {
        primary: makeField("", LOGO_COLOR_OPTIONS),
        secondary: makeField("", LOGO_COLOR_OPTIONS),
        accent: makeField("", LOGO_COLOR_OPTIONS),
        neutral: makeField("", LOGO_NEUTRAL_OPTIONS),
        gradient: makeField("", GRADIENT_OPTIONS),
        mood: makeField("", COLOR_MOOD_OPTIONS),
      },
      typography: {
        primaryFont: makeField("", FONT_STYLE_OPTIONS),
        secondaryFont: makeField("", FONT_STYLE_OPTIONS),
        accentFont: makeField("", FONT_STYLE_OPTIONS),
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
      negativeConstraints: { noMockups: true, noGradients: true, noShadows: true, no3d: true, avoidComplexity: true },
      archetype: makeField("", ARCHETYPE_OPTIONS),
      symbolMeaning: makeField("", [], { isFreeText: true }),
      styleEra: makeField("", STYLE_ERA_OPTIONS),
      competitorAvoidance: makeField("", [], { isFreeText: true }),
    };
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

  function effectiveBrandName(state) {
    return resolved(state.brandName) || BrandHaus.engine.resolveFieldValue(BrandHaus.identity.getState().businessName);
  }

  function assemblePrompt() {
    var state = store.getState();
    var parts = [];
    var fragments = [];

    function add(text) {
      if (!text) return;
      parts.push(text);
      fragments.push(text);
    }

    var outputVariations = resolved(state.outputVariations);
    var intro = outputVariations ? "Generate " + outputVariations + ":" : "";

    var story = resolved(state.brandStory);
    if (story) add(story);

    add(
      [resolved(state.logoType), resolved(state.composition.layout), resolved(state.composition.lockup), resolved(state.composition.container)]
        .filter(Boolean)
        .join(", ")
    );

    var iconBits = [resolved(state.iconography)];
    if (state.tier === "pro") {
      var meaning = resolved(state.symbolMeaning);
      if (meaning) iconBits.push("symbolizing " + meaning);
    }
    add(iconBits.filter(Boolean).join(", "));

    var brandName = effectiveBrandName(state);
    var initials = resolved(state.initials);
    var tagline = resolved(state.tagline);
    var hasText = !state.noTextSymbolOnly && !!(brandName || initials);

    if (hasText) {
      add(
        [resolved(state.typography.primaryFont), resolved(state.typography.secondaryFont), resolved(state.typography.accentFont)]
          .filter(Boolean)
          .join(", ")
      );
    }

    var dominant = [];
    if (resolved(state.personality)) dominant.push(resolved(state.personality));
    if (resolved(state.industry)) dominant.push(resolved(state.industry) + " industry");
    if (state.tier === "pro" && resolved(state.styleEra)) dominant.push(resolved(state.styleEra));
    if (state.tier === "pro" && resolved(state.archetype)) dominant.push(resolved(state.archetype) + " archetype");
    dominant = dominant.slice(0, 3);
    if (dominant.length) add(dominant.join(", ") + " aesthetic");

    add(
      [
        resolved(state.colorConstraint),
        resolved(state.color.primary) && "primary color " + resolved(state.color.primary),
        resolved(state.color.secondary) && "secondary color " + resolved(state.color.secondary),
        resolved(state.color.accent) && "accent color " + resolved(state.color.accent),
        resolved(state.color.neutral) && "neutral/base color " + resolved(state.color.neutral),
        resolved(state.color.gradient) && resolved(state.color.gradient).toLowerCase() !== "none" && resolved(state.color.gradient) + " style",
        resolved(state.color.mood) && resolved(state.color.mood) + " color mood",
      ]
        .filter(Boolean)
        .join(", ")
    );

    var dimensional = resolved(state.dimensional);
    if (dimensional) add(dimensional === "flat" ? "flat design" : "dimensional 3d treatment");

    add(CANVAS_FORMAT_PHRASE[resolved(state.canvasFormat)] || "");

    if (state.tier === "lite") add(LITE_TIER_PHRASE);

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

    var background = resolved(state.background) || "transparent";
    var backgroundSentence = "Background: " + background + ".";

    var negativeItems = getNegativeConstraintItems();
    var negativeSentence = negativeItems.length ? "Avoid: " + negativeItems.join(", ") + "." : "";

    var trademark = TRADEMARK_LINE;
    if (resolved(state.useMode) === USE_MODE_OPTIONS[1]) trademark += RESALE_TRADEMARK_NOTE;
    var autoAppend = [QUALITY_CONSTRAINTS_BLOCK, trademark, TRADEMARK_DISCLAIMER].join(" ");

    var mainSentence = parts.filter(Boolean).join(", ") + ".";
    var text = [intro, mainSentence]
      .concat(textLockSentences)
      .concat([backgroundSentence, negativeSentence, autoAppend])
      .filter(Boolean)
      .join(" ");

    return { text: text, fragments: fragments };
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

  function getSelectionsByGroup() {
    var state = store.getState();
    var resolveFields = BrandHaus.engine.resolveFields;
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
    if (composition.length) groups.push({ title: "Composition & Lockup", items: composition });

    var color = resolveFields([
      { label: "Primary Color", field: state.color.primary },
      { label: "Secondary Color", field: state.color.secondary },
      { label: "Accent Color", field: state.color.accent },
      { label: "Neutral/Base Color", field: state.color.neutral },
      { label: "Gradient Style", field: state.color.gradient },
      { label: "Color Mood", field: state.color.mood },
    ]);
    if (color.length) groups.push({ title: "Colors", items: color });

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
        text: "Standard is the normal field set. Lite keeps every field but asks the AI for a simpler design. Pro reveals strategist-level controls (Archetype, Style Era, Symbol Meaning, Competitor Avoidance) below.",
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
          { fieldName: "brandName", label: "Brand Name" + (businessName ? " (defaults to \"" + businessName + "\" if left blank)" : ""), field: state.brandName, placeholder: businessName || "" },
          function (changes) { updateField("brandName", changes); BrandHaus.ui.renderApp(); }
        ),
        renderTextFieldWithInclude({ fieldName: "initials", label: "Initials (up to 3)", field: state.initials }, function (changes) { updateField("initials", changes); BrandHaus.ui.renderApp(); }),
        renderTextFieldWithInclude({ fieldName: "tagline", label: "Tagline (optional)", field: state.tagline }, function (changes) { updateField("tagline", changes); BrandHaus.ui.renderApp(); })
      );
    }

    children.push(
      renderTextFieldWithInclude(
        { fieldName: "brandStory", label: "Brand Story — in your own words, what does this brand do and how should it feel?", field: state.brandStory },
        function (changes) { updateField("brandStory", changes); BrandHaus.ui.renderApp(); }
      )
    );

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
    var entries = [
      { label: "Brand Archetype", field: state.archetype },
      { label: "Style Era", field: state.styleEra },
    ];
    var fieldsContainer = ui.renderPlainFieldRow(entries, function (entry, changes) {
      if (entry.label === "Brand Archetype") updateField("archetype", changes);
      else updateField("styleEra", changes);
      BrandHaus.ui.renderApp();
    });

    var symbolMeaningField = ui.renderFreeTextField({ label: "Symbol Meaning — what should this logo represent emotionally?", field: state.symbolMeaning }, function (changes) { updateField("symbolMeaning", changes); BrandHaus.ui.renderApp(); });
    var competitorField = ui.renderFreeTextField({ label: "Competitor-Style Avoidance", field: state.competitorAvoidance }, function (changes) { updateField("competitorAvoidance", changes); BrandHaus.ui.renderApp(); });

    return ui.el("fieldset", { class: "bh-field-group" }, [
      ui.el("legend", { class: "bh-field-group__title" }, [ui.icon("sparkle"), ui.el("span", { text: "Pro Mode" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "Archetype drives emotional shape language (e.g. The Ruler → strong symmetry; The Creator → expressive/asymmetric)." }),
      fieldsContainer,
      symbolMeaningField,
      ui.el("p", { class: "bh-field-group__subtitle", text: 'Describe the competitor style you want to avoid in your own words — e.g. "avoid a single swoosh" or "avoid bitten-fruit minimalism." Don\'t name an actual brand: naming one can pull the AI toward it instead of away.' }),
      competitorField,
      ui.el("p", { class: "bh-logo-inline-disclaimer", text: "Describing a style to avoid is not the same as clearing a trademark. Avoid recreating any specific company's protected logo, symbol, or likeness — even loosely — and verify trademark/copyright independently before commercial use." }),
    ]);
  }

  function renderPanel() {
    var ui = BrandHaus.ui;
    var state = store.getState();
    var panel = ui.el("div", { class: "bh-panel bh-panel--logo" });

    function handleFieldChange(fieldName) {
      return function (entry, changes) { updateField(fieldName, changes); BrandHaus.ui.renderApp(); };
    }

    panel.appendChild(renderCallout("logoMark", "This creates a logo concept, not a production file. AI image generators output a flattened raster image — for a real, scalable logo (favicon, embroidery, one-color print), recreate the result as a vector in Kittl, Illustrator, or with a designer. Use this as your direction, not your final file."));

    panel.appendChild(renderTierToggle(state));

    panel.appendChild(ui.renderFieldGroup("Use Mode", [{ label: "Who is this logo for?", field: state.useMode }], function (entry, changes) { updateField("useMode", changes); BrandHaus.ui.renderApp(); }, "Doesn't change the visual output — only how strongly the trademark guidance below is worded."));

    panel.appendChild(ui.renderFieldGroup("Foundation", [
      { label: "Logo Type", field: state.logoType },
      { label: "Industry / Context", field: state.industry },
      { label: "Brand Personality", field: state.personality },
    ], function (entry, changes) {
      if (entry.label === "Logo Type") updateField("logoType", changes);
      else if (entry.label === "Industry / Context") updateField("industry", changes);
      else updateField("personality", changes);
      BrandHaus.ui.renderApp();
    }, "The foundation every other choice builds on."));

    panel.appendChild(ui.renderFieldGroup("Composition & Lockup", [
      { label: "Layout", field: state.composition.layout },
      { label: "Icon/Text Relationship", field: state.composition.lockup },
      { label: "Container", field: state.composition.container },
    ], function (entry, changes) {
      if (entry.label === "Layout") updateCompositionField("layout", changes);
      else if (entry.label === "Icon/Text Relationship") updateCompositionField("lockup", changes);
      else updateCompositionField("container", changes);
      BrandHaus.ui.renderApp();
    }, "Lockup relationship is the #1 thing that makes a logo read as intentional instead of thrown-together. Also drives Canvas Format's auto-suggestion below."));

    panel.appendChild(renderTextSection(state));

    panel.appendChild(ui.renderFieldGroup("Iconography", [{ label: "Symbol System", field: state.iconography }], function (entry, changes) { updateField("iconography", changes); BrandHaus.ui.renderApp(); }, "No icon, an abstract mark, or a literal symbol — the foundation of the visual."));

    panel.appendChild(ui.renderFieldGroup("Colors", [
      { label: "Primary Color(s)", field: state.color.primary },
      { label: "Secondary Color(s)", field: state.color.secondary },
      { label: "Accent Color(s)", field: state.color.accent },
      { label: "Neutral/Base Colors", field: state.color.neutral },
      { label: "Gradient Style", field: state.color.gradient },
      { label: "Color Mood", field: state.color.mood },
    ], function (entry, changes) {
      var map = { "Primary Color(s)": "primary", "Secondary Color(s)": "secondary", "Accent Color(s)": "accent", "Neutral/Base Colors": "neutral", "Gradient Style": "gradient", "Color Mood": "mood" };
      updateColorField(map[entry.label], changes);
      BrandHaus.ui.renderApp();
    }, "Works standalone — type your own or a hex code (e.g. \"#B76E79\") for an exact match."));

    panel.appendChild(ui.renderFieldGroup("Typography", [
      { label: "Primary Font", field: state.typography.primaryFont },
      { label: "Secondary Font", field: state.typography.secondaryFont },
      { label: "Accent Font", field: state.typography.accentFont },
    ], function (entry, changes) {
      var map = { "Primary Font": "primaryFont", "Secondary Font": "secondaryFont", "Accent Font": "accentFont" };
      updateTypographyField(map[entry.label], changes);
      BrandHaus.ui.renderApp();
    }, "Only matters once there's actual text — Brand Name and/or Initials above."));

    panel.appendChild(ui.renderFieldGroup("Color & Format", [
      { label: "Color Constraint", field: state.colorConstraint },
      { label: "Dimensional Treatment", field: state.dimensional },
      { label: "Background", field: state.background },
      { label: "Canvas Format", field: state.canvasFormat },
      { label: "Output", field: state.outputVariations },
    ], function (entry, changes) {
      if (entry.label === "Color Constraint") updateField("colorConstraint", changes);
      else if (entry.label === "Dimensional Treatment") updateField("dimensional", changes);
      else if (entry.label === "Background") updateField("background", changes);
      else if (entry.label === "Canvas Format") store.setState({ canvasFormat: Object.assign({}, state.canvasFormat, changes, { auto: false }) });
      else updateField("outputVariations", changes);
      BrandHaus.ui.renderApp();
    }, "How many colors the mark can use, flat vs. dimensional, background, canvas shape, and how many concepts to generate."));

    panel.appendChild(renderNegativeConstraints(state));

    if (state.tier === "pro") panel.appendChild(renderProModeSection(state));

    panel.appendChild(renderCallout("shield", "This tool helps you avoid obvious risks, but it does not perform a trademark check. Before using a logo commercially — especially one you plan to sell to others — verify trademark and copyright independently. This is not legal advice."));

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
    updateNegativeConstraint: updateNegativeConstraint,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    getSelectionsByGroup: getSelectionsByGroup,
    renderPanel: renderPanel,
  });
})();
