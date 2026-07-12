/**
 * The AI Creator's Brand Haus — Your Blueprint (wizard step 5)
 * Depends on brand-haus-founderinterview.js (results), brand-haus-
 * branding.js (post-Apply state), brand-haus-results.js (reuses its
 * exported chapter renderers rather than duplicating them), and
 * brand-haus-ui.js's exposed BrandHaus.ui helpers (printPromptText
 * specifically — reused rather than duplicated, per the print-not-a-
 * PDF-library decision).
 *
 * Three documents, all read-only aggregations with no store of their own:
 * - Your Blueprint Snapshot — condensed one-pager (profile, North Star,
 *   Promise, Mission, Values, Palette, Typography).
 * - Your Brand DNA Report — every chapter from Your Brand DNA (step 3),
 *   re-rendered here so this page is a genuine superset, not a thinner
 *   duplicate.
 * - Your Brand Playbook™ — the 20-chapter, 5-part expansion built in
 *   brand-haus-playbook.js/brand-haus-playbook-content.js, wired in below
 *   as this step's third section.
 *
 * All three read from Branding Studio's CURRENT state where it's been
 * customized, falling back to the raw assessment match otherwise — so
 * the Blueprint always reflects what the founder actually kept, not just
 * what they were first shown.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  // Collapsed by default — three full documents stacked open at once is
  // what made this page feel endless. Not mutually exclusive (opening one
  // doesn't close another) since a founder comparing the Snapshot against
  // the Report at the same time is a reasonable thing to want.
  var docOpenState = { snapshot: false, report: false, playbook: false };

  function toggleDoc(key) {
    docOpenState[key] = !docOpenState[key];
    BrandHaus.ui.renderApp();
  }

  // Every one of the 3 documents shares the same header shape (title +
  // export button), so the collapse chrome is built once here rather than
  // three times — each renderX() function below just hands back its own
  // {title, exportBtn, exportHint, content} instead of assembling a div.
  function renderCollapsibleDoc(ui, key, parts) {
    var isOpen = docOpenState[key];
    var titleBtn = ui.el("button", { type: "button", class: "bh-blueprint__doc-title-btn", "aria-expanded": isOpen ? "true" : "false" }, [
      ui.el("div", { class: "bh-blueprint__doc-title-row" }, [
        ui.el("span", { class: "bh-blueprint__doc-chevron" }, [ui.icon("chevron")]),
        ui.el("h3", { class: "bh-founder-interview__profile-name", style: "margin-bottom: 0;", text: parts.title }),
      ]),
      parts.subtitle ? ui.el("p", { class: "bh-blueprint__doc-subtitle", text: parts.subtitle }) : null,
      parts.description ? ui.el("p", { class: "bh-blueprint__doc-description", text: parts.description }) : null,
    ].filter(Boolean));
    titleBtn.addEventListener("click", function () { toggleDoc(key); });

    var header = ui.el("div", { class: "bh-blueprint__section-header" }, [titleBtn, parts.exportBtn]);
    var children = [header];
    if (isOpen) children.push(parts.exportHint, parts.content);

    return ui.el("div", { class: "bh-blueprint__doc" + (isOpen ? " is-open" : " is-collapsed"), id: "bh-doc-" + key }, children);
  }

  function resolved(field) {
    return BrandHaus.engine.resolveFieldValue(field);
  }

  // Merges Branding Studio's current edits into a results-shaped object
  // so it can be fed straight into brand-haus-results.js's existing
  // chapter renderers — one content pipeline, not two. valueReasons
  // stays tied to the original top-3 Founder DNA dimensions even if
  // Core Values were hand-edited afterward; a full re-derivation isn't
  // possible from edited text alone, and this only shows up if someone
  // replaces values with wording unrelated to their own results.
  function buildEffectiveResults(results, brandingState) {
    var profile = results.match.best.profile;
    var founderOutput = results.founderOutput;

    var editedColors = brandingState.colors.filter(Boolean);
    var colors = editedColors.length >= 5
      ? { primary: editedColors[0], secondary: editedColors[1], neutral: editedColors[2], accent: editedColors[3], support: editedColors[4], standOut: editedColors[5] }
      : profile.output.colors;

    var effectiveProfile = Object.assign({}, profile, {
      output: Object.assign({}, profile.output, {
        colors: colors,
        headingFont: resolved(brandingState.headingFont) || profile.output.headingFont,
        bodyFont: resolved(brandingState.bodyFont) || profile.output.bodyFont,
        mood: resolved(brandingState.mood) || profile.output.mood,
        voice: resolved(brandingState.brandVoice) || profile.output.voice,
      }),
    });

    var editedValues = brandingState.coreValues.filter(Boolean);
    var effectiveFounderOutput = Object.assign({}, founderOutput, {
      missionStatement: resolved(brandingState.mission) || founderOutput.missionStatement,
      values: editedValues.length ? editedValues : founderOutput.values,
    });

    var effectiveMatch = Object.assign({}, results.match, {
      best: Object.assign({}, results.match.best, { profile: effectiveProfile }),
    });

    return Object.assign({}, results, { match: effectiveMatch, founderOutput: effectiveFounderOutput });
  }

  // Both exports get printed/saved independently of each other and of the
  // page they live on, so this reminder has to live inside each one's own
  // content rather than only in the shared hero above them — otherwise it
  // never makes it into a Snapshot or Comprehensive Report exported alone.
  function renderBrandEvolutionNote(ui) {
    return ui.el("div", { class: "bh-chapter__evolution" }, [
      ui.el("p", { class: "bh-chapter__section-title", text: "Brand Evolution" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Remember... Brands evolve. This Blueprint captures where your brand is today. As your business grows, your identity may become clearer, your priorities may shift, and your recommendations may evolve. We encourage founders to revisit the Founder Interview™ every 12–18 months to see how their Brand DNA has matured." }),
    ]);
  }

  // The Snapshot has no chapter of its own that already carries the "this
  // isn't a label" reassurance (unlike the Comprehensive Report, where
  // Chapter 1 already says it) — so the Snapshot gets that line too,
  // ahead of the shared Brand Evolution note.
  function renderStartingPointNote(ui) {
    return ui.el("div", {}, [
      ui.el("p", { class: "bh-chapter__reassurance", text: "This isn't a label. It's a starting point. Your Brand DNA Blueprint is designed to provide direction, not limitation. Every recommendation can be refined as your vision evolves." }),
      renderBrandEvolutionNote(ui),
    ]);
  }

  // ---------------------------------------------------------------------
  // Your Blueprint Snapshot — condensed one-pager
  // ---------------------------------------------------------------------
  function renderSnapshot(ui, effectiveResults) {
    var profile = effectiveResults.match.best.profile;
    var founderOutput = effectiveResults.founderOutput;
    var roleOrder = ["primary", "secondary", "neutral", "accent", "support", "standOut"];
    var roleLabel = BrandHaus.results.paletteRoleLabel;
    var swatches = roleOrder.filter(function (role) { return profile.output.colors[role]; }).map(function (role) {
      return ui.el("div", { class: "bh-palette-swatch" }, [
        ui.el("span", { class: "bh-palette-swatch__color", style: "background:" + profile.output.colors[role] + ";" }),
        ui.el("span", { class: "bh-palette-swatch__role", text: roleLabel(role) }),
        ui.el("span", { class: "bh-palette-swatch__hex", text: profile.output.colors[role] }),
      ]);
    });

    var content = ui.el("section", { class: "bh-chapter" }, [
      ui.el("p", { class: "bh-chapter__eyebrow", text: profile.name }),
      BrandHaus.results.renderFounderFingerprint(ui, effectiveResults),
      renderStartingPointNote(ui),
      ui.el("p", { class: "bh-chapter__section-title", text: "Brand North Star" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: profile.output.northStar }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Brand Promise" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: profile.output.promise }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Mission Statement" }),
      ui.el("p", { class: "bh-founder-interview__mission", text: founderOutput.missionStatement }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Core Values" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: founderOutput.values.join(", ") }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Color Palette" }),
      ui.el("div", { class: "bh-palette-row" }, swatches),
      ui.el("p", { class: "bh-chapter__section-title", text: "Typography" }),
      ui.el("div", { class: "bh-typography-cards" }, [
        BrandHaus.results.renderFontSample(ui, "Primary Font (Headings)", profile.output.headingFont),
        BrandHaus.results.renderFontSample(ui, "Secondary Font (Body)", profile.output.bodyFont),
      ]),
      BrandHaus.results.renderRememberCallout(ui),
    ]);

    // Prints the real styled chapter (colors, layout, matched accent)
    // rather than a plain-text recap — "Save as PDF" in the print dialog
    // then gives back the actual full-color piece.
    var exportBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal bh-btn--small" }, [ui.icon("document"), ui.el("span", { text: "Export Snapshot" })]);
    exportBtn.addEventListener("click", function () {
      BrandHaus.ui.printStyledSection(content, BrandHaus.results.accentStyleFor(profile), "Your Blueprint Snapshot — Black Sheep Creations", profile);
    });

    var exportHint = ui.el("p", { class: "bh-blueprint__export-hint", text: 'This opens your browser\'s print dialog — choose "Save as PDF" as the destination to download a PDF instead of printing.' });

    return {
      title: "Your Blueprint Snapshot",
      subtitle: "Discover Your Brand",
      description: "This is who you are at a glance.",
      exportBtn: exportBtn,
      exportHint: exportHint,
      content: content,
    };
  }

  // ---------------------------------------------------------------------
  // Your Brand DNA Report — every chapter from Your Brand DNA, re-rendered
  // here reading the effective (edit-aware) data.
  // ---------------------------------------------------------------------
  function renderComprehensiveReport(ui, effectiveResults) {
    var r = BrandHaus.results;
    var profile = effectiveResults.match.best.profile;

    // Chapter 7 ("Your Next Steps") is deliberately excluded here — it
    // already appears once at the end of Your Brand DNA, and repeating
    // its Continue-to-Branding-Studio/Retake buttons inside what's meant
    // to read as a finished deliverable felt redundant rather than useful.
    var content = ui.el("div", { class: "bh-blueprint__print-chapters" }, [
      ui.el("section", { class: "bh-chapter" }, [renderBrandEvolutionNote(ui)]),
      r.renderChapter1(ui, effectiveResults),
      r.renderChapter2(ui, effectiveResults),
      r.renderChapter3(ui, effectiveResults),
      r.renderChapter4(ui, effectiveResults),
      r.renderChapter5(ui, effectiveResults),
      r.renderChapter6(ui, effectiveResults),
      ui.el("section", { class: "bh-chapter" }, [r.renderRememberCallout(ui)]),
      r.renderStrategistNote(ui, false),
    ].filter(Boolean));

    var exportBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal bh-btn--small" }, [ui.icon("document"), ui.el("span", { text: "Export Brand DNA Report" })]);
    exportBtn.addEventListener("click", function () {
      BrandHaus.ui.printStyledSection(content, r.accentStyleFor(profile), "Your Brand DNA Report — Black Sheep Creations", profile);
    });

    var exportHint = ui.el("p", { class: "bh-blueprint__export-hint", text: 'This opens your browser\'s print dialog — choose "Save as PDF" as the destination to download a PDF instead of printing.' });

    return {
      title: "Your Brand DNA Report",
      subtitle: "Decode Your Brand",
      description: "Understand the psychology behind your results and the patterns that shape your brand.",
      exportBtn: exportBtn,
      exportHint: exportHint,
      content: content,
    };
  }

  // ---------------------------------------------------------------------
  function renderFull() {
    var ui = BrandHaus.ui;
    var state = BrandHaus.founderInterview.getState();
    var results = state.results;
    if (!results) {
      return ui.el("p", { class: "bh-coming-soon", text: "Your Blueprint is coming soon — complete the Brand DNA Assessment first." });
    }
    var brandingState = BrandHaus.branding.getState();
    var effectiveResults = buildEffectiveResults(results, brandingState);
    var profile = effectiveResults.match.best.profile;
    var accentStyle = BrandHaus.results && BrandHaus.results.accentStyleFor ? BrandHaus.results.accentStyleFor(profile) : "";

    // A jump-nav link to a collapsed section would otherwise just scroll to
    // a one-line sliver with nothing to read — opening the target doc first
    // (if it isn't already) so the click actually lands somewhere useful.
    function jumpLink(key, href, text) {
      var a = ui.el("a", { href: href, text: text });
      a.addEventListener("click", function () {
        if (!docOpenState[key]) { docOpenState[key] = true; BrandHaus.ui.renderApp(); }
      });
      return a;
    }
    var jumpNav = ui.el("nav", { class: "bh-playbook__jump-nav", "aria-label": "Jump to a Blueprint document" }, [
      jumpLink("snapshot", "#bh-doc-snapshot", "Blueprint Snapshot"),
      jumpLink("report", "#bh-doc-report", "Brand DNA Report"),
      jumpLink("playbook", "#bh-doc-playbook", "Your Brand Playbook™"),
    ]);

    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--results", style: accentStyle }, [
      ui.el("section", { class: "bh-chapter bh-chapter--hero" }, [
        BrandHaus.results.renderCongratsBanner(ui, "Your Brand DNA Blueprint™ is Complete", [
          "This isn't the end of the process—it's the beginning.",
          "The Blueprint you've created today is designed to become the decision-making compass for every logo, product, message, website, campaign, and customer experience you build from this point forward.",
        ]),
      ]),
      jumpNav,
      renderCollapsibleDoc(ui, "snapshot", renderSnapshot(ui, effectiveResults)),
      renderCollapsibleDoc(ui, "report", renderComprehensiveReport(ui, effectiveResults)),
      renderCollapsibleDoc(ui, "playbook", BrandHaus.playbook.renderFull(ui, effectiveResults)),
      BrandHaus.results.renderStrategistNote(ui, true),
    ]);
  }

  BrandHaus.blueprint = { renderFull: renderFull };
})();
