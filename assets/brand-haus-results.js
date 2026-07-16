/**
 * The AI Creator's Brand Haus — Your Brand DNA (wizard step 3)
 * Depends on brand-haus-branddna.js (scoring engine + profile content),
 * brand-haus-founderinterview.js (owns the `results` data this reads),
 * brand-haus-branding.js (Continue to Branding Studio applies into it),
 * and brand-haus-ui.js's exposed BrandHaus.ui helpers.
 *
 * Presentation only — reads BrandHaus.founderInterview.getState().results,
 * never mutates the assessment. Renders as a six-chapter narrative rather
 * than a flat dashboard of stat blocks, per design review: identity comes
 * first as a hero moment, data visualizations support it, and the page
 * closes with next actions rather than opening with them.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  // Primary Alignment's displayed % and description both come from
  // computeConfidence's alignmentPct (margin between #1 and #2 match, run
  // through a smooth curve — see brand-haus-branddna.js) — a real number
  // that varies founder to founder, not a fixed bucket.
  function alignmentDescription(pct) {
    if (pct >= 92) return "Exceptionally clear alignment with your responses";
    if (pct >= 82) return "Strong alignment with your responses";
    if (pct >= 74) return "Solid alignment, with some natural crossover";
    return "A blended alignment — your brand draws from more than one identity";
  }

  // badgeText is optional and only ever passed by the Playbook (its 18
  // chapters keep the original, gapped 1-20 numbering from the outline —
  // Chapters 12 and 15 were cut during scoping — so the badge shows that
  // real number rather than a fake sequential recount). Every other
  // caller (Your Brand DNA step 3, the Brand DNA Report) omits it and
  // gets the exact same heading as before.
  function chapterHeading(ui, iconName, text, infoText, extraClass, badgeText) {
    var children = [ui.icon(iconName), ui.el("span", { text: text })];
    if (infoText) children.push(ui.infoIcon(infoText));
    if (badgeText) children.push(ui.el("span", { class: "bh-chapter__number-badge", text: badgeText }));
    var className = "bh-field-group__title bh-chapter__heading" + (extraClass ? " " + extraClass : "");
    return ui.el("h4", { class: className }, children);
  }

  // "standOut" needs a hyphen a plain capitalize wouldn't produce.
  function paletteRoleLabel(role) {
    return role === "standOut" ? "Stand-Out" : role.charAt(0).toUpperCase() + role.slice(1);
  }

  // Shared celebratory banner — Your Brand DNA's Chapter 1 and Your
  // Blueprint's opening both use this same bold, icon-flanked treatment
  // rather than one being a plain italic paragraph and the other bold;
  // the two "you've reached a milestone" moments should read the same.
  // bodyParagraphs is an array so the celebratory copy reads as distinct
  // beats with real spacing between them, not one dense run-on block.
  function renderCongratsBanner(ui, title, bodyParagraphs) {
    var paragraphs = (Array.isArray(bodyParagraphs) ? bodyParagraphs : [bodyParagraphs]).map(function (text) {
      return ui.el("p", { class: "bh-chapter__congrats-body", text: text });
    });
    return ui.el("div", { class: "bh-chapter__congrats" }, [
      ui.el("p", { class: "bh-chapter__congrats-title" }, [
        ui.icon("sparkle"),
        ui.el("span", { text: title }),
        ui.icon("sparkle"),
      ]),
    ].concat(paragraphs));
  }

  // ---------------------------------------------------------------------
  // Chapter 1 — Identity (the hero)
  // ---------------------------------------------------------------------
  // "The Bold Pioneer" -> "bold-pioneer" — matches the filenames
  // sections/brand-haus.liquid's window.BrandHausHeroImages map and
  // dev/brand-haus-preview.html's own copy both expect.
  function profileSlug(profile) {
    return profile.name.toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // Optional per-profile hero art. Gracefully absent until each of the
  // 11 images is actually generated and uploaded — the <img> just hides
  // itself on a 404 rather than showing a broken-image icon, and the
  // text column fills the full width on its own when that happens.
  //
  // "Quiet Authority" specifically was generated with its isolated art
  // flattened onto a checkerboard "transparency indicator" canvas instead
  // of a solid one (a source-asset defect, not something CSS/JS caused) —
  // confirmed visible along the top/left/right/bottom margins in both the
  // live "Your Brand DNA" step and the exported Brand DNA Report, where
  // this box's aspect ratio matches the image's own aspect ratio exactly
  // (1536x1024, i.e. 3:2) so object-fit:cover has zero margin to crop.
  // TIGHT_CROP_SLUGS gets a modifier class that scales the image in just
  // enough to push that checkerboard border outside the visible frame —
  // scoped to this one profile only so the other 10, already-clean hero
  // photos don't get an unnecessary/over-aggressive crop.
  var TIGHT_CROP_SLUGS = ["quiet-authority"];

  function renderHeroImage(ui, profile) {
    var map = window.BrandHausHeroImages || {};
    var slug = profileSlug(profile);
    var src = map[slug];
    if (!src) return null;
    var wrapClass = "bh-chapter__hero-image" + (TIGHT_CROP_SLUGS.indexOf(slug) !== -1 ? " bh-chapter__hero-image--tight-crop" : "");
    var wrap = ui.el("div", { class: wrapClass });
    var img = ui.el("img", { src: src, alt: profile.name + " brand identity artwork" });
    img.addEventListener("error", function () { wrap.style.display = "none"; });
    wrap.appendChild(img);
    return wrap;
  }

  // Closest classic Jungian brand archetype(s) per profile — purely a
  // familiarity footnote for founders who've seen the 12-archetype wheel
  // before ("so am I a Sage or a Hero?"). Doesn't feed scoring or
  // anything else; a few profiles legitimately echo the same classic
  // archetype (11 profiles don't map 1:1 onto 12 archetypes) — that's
  // expected, not a gap.
  var PROFILE_ARCHETYPE_TRANSLATION = {
    "The Trusted Guide": "The Sage",
    "The Bold Pioneer": "The Explorer or The Hero",
    "The Cozy Craftsman": "The Caregiver or The Neighbour",
    "The Elevated Icon": "The Ruler or The Magician",
    "The Free Spirit": "The Rebel or The Explorer",
    "The Joyful Connector": "The Entertainer or The Neighbour",
    "The Quiet Authority": "The Sage or The Ruler",
    "The Modern Minimalist": "The Creator",
    "The Community Builder": "The Neighbour or The Hero",
    "The Luxe Rebel": "The Rebel or The Seducer",
    "The Trail Forger": "The Explorer",
  };

  function renderChapter1(ui, results) {
    var profile = results.match.best.profile;
    var second = results.match.secondBest.profile;
    var conf = BrandHaus.brandDNA.computeConfidence(results.match.ranked);
    var topMotivation = BrandHaus.brandDNA.topFounderDNA(results.founderDNAScores || {}, 1)[0];
    var archetypeTranslation = PROFILE_ARCHETYPE_TRANSLATION[profile.name];

    var identitySubtitle = "Not your company name or a personality label — the closest match to how your Brand DNA naturally expresses itself, based on your answers. With touches of " + second.name + " — no one fits a single mold perfectly, and that's fine.";
    if (profile._blendFactor && profile._blendFactor >= 0.2) {
      identitySubtitle += " Your palette and body typeface below carry a real, subtle shift toward that influence too — no two founders who match " + profile.name + " look quite the same.";
    }

    var textColumn = ui.el("div", { class: "bh-chapter__hero-text" }, [
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Meet Your Primary Brand Identity™" }),
      ui.el("h2", { class: "bh-founder-interview__profile-name", text: profile.name }),
      topMotivation ? ui.el("p", { class: "bh-chapter__profile-tag", text: "— " + founderDNALabel(topMotivation.key) }) : null,
      ui.el("p", { class: "bh-field-group__subtitle bh-text--black", text: identitySubtitle }),
      ui.el("p", { class: "bh-chapter__reassurance", text: "Think of it as a starting point, not a box you're locked into. Your Brand DNA Blueprint is designed to provide direction, not limitation. Every recommendation can be refined as your vision evolves." }),
      archetypeTranslation ? ui.el("p", { class: "bh-chapter__archetype-note", text: "If you're familiar with brand archetypes, " + profile.name + " most closely echoes " + archetypeTranslation + "." }) : null,
    ]);

    var heroTopChildren = [textColumn];
    var heroImage = renderHeroImage(ui, profile);
    if (heroImage) heroTopChildren.push(heroImage);
    var heroTop = ui.el("div", { class: "bh-chapter__hero-top" }, heroTopChildren);

    var scoreBlock = ui.el("div", { class: "bh-chapter__score" }, [
      ui.el("span", { class: "bh-chapter__score-caption-label" }, [
        ui.el("span", { text: "Primary Alignment" }),
        ui.infoIcon("Measures how clearly your responses pointed to your Primary Brand Identity over your next-closest match — not a share of 100%. A lower score doesn't mean your results are less accurate, it often reflects a founder whose brand combines characteristics from multiple identities."),
      ]),
      ui.el("span", { class: "bh-chapter__score-number", text: conf.alignmentPct + "%" }),
      ui.el("p", { class: "bh-chapter__score-description", text: alignmentDescription(conf.alignmentPct) }),
    ]);

    var scoreRow = ui.el("div", { class: "bh-chapter__score-row" }, [scoreBlock]);
    if (conf.influences.length) {
      var influenceCells = conf.influences.map(function (inf) {
        return ui.el("div", { class: "bh-chapter__influence-cell" }, [
          ui.el("div", { class: "bh-chapter__influence-text" }, [
            ui.el("span", { class: "bh-chapter__influence-name", text: inf.profile.name }),
            ui.el("span", { class: "bh-chapter__influence-desc", text: inf.profile.output.influenceBlurb || "" }),
          ]),
          renderMiniRing(ui, inf.sharePct, "bh-mini-ring--lg"),
        ]);
      });
      scoreRow.appendChild(ui.el("div", { class: "bh-chapter__influences" }, [
        ui.el("p", { class: "bh-chapter__score-caption-label" }, [
          ui.el("span", { text: "Supporting Influences" }),
          ui.infoIcon("Shows how much pull other identities have on your Brand DNA — measured independently from Primary Alignment above, so the numbers won't add up to 100% and aren't meant to."),
        ]),
        ui.el("div", { class: "bh-chapter__influence-cells" }, influenceCells),
      ]));
    }

    return ui.el("section", { class: "bh-chapter bh-chapter--hero" }, [heroTop, scoreRow]);
  }

  // ---------------------------------------------------------------------
  // Chapter 2 — What We Discovered (Brand Tensions + Founder DNA)
  // ---------------------------------------------------------------------
  function renderTensionSlider(ui, key, value) {
    var labels = BrandHaus.brandDNA.TENSION_LABELS[key];
    var pct = Math.max(4, Math.min(96, 50 + (value / 3) * 50));
    return ui.el("div", { class: "bh-tension-slider" }, [
      ui.el("div", { class: "bh-tension-slider__labels" }, [
        ui.el("span", { class: "bh-tension-slider__label", text: labels.negative }),
        ui.el("span", { class: "bh-tension-slider__label", text: labels.positive }),
      ]),
      ui.el("div", { class: "bh-tension-slider__track" }, [
        ui.el("span", { class: "bh-tension-slider__marker", style: "left: " + pct + "%;" }),
      ]),
    ]);
  }

  function renderDNABar(ui, label, pct) {
    return ui.el("div", { class: "bh-dna-bar" }, [
      ui.el("div", { class: "bh-dna-bar__label-row" }, [
        ui.el("span", { class: "bh-dna-bar__label", text: label }),
        ui.el("span", { class: "bh-dna-bar__pct", text: pct + "%" }),
      ]),
      ui.el("div", { class: "bh-dna-bar__track" }, [
        ui.el("div", { class: "bh-dna-bar__fill", style: "width: " + pct + "%;" }),
      ]),
    ]);
  }

  function founderDNALabel(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  // Founder Fingerprint™ — a radar/polygon built from the founder's own
  // 8 Brand Tensions positions, in the matched profile's own accent
  // color. Every axis maps a tension score (roughly -3..3, same range
  // renderTensionSlider already normalizes) to a 0..1 fraction of the
  // spoke's length using the identical formula as the slider's marker
  // position, so the shape agrees with what the sliders show elsewhere
  // in the document rather than inventing a second scale. Built as raw
  // SVG markup (same innerHTML pattern as icon()) rather than composed
  // DOM nodes, since coordinates are computed from angles/trig and a
  // node-by-node builder would add complexity without adding safety —
  // every value plugged into the string is either a computed number or
  // a static label from TENSION_LABELS, never founder-typed text.
  function renderFounderFingerprint(ui, results) {
    var brandDNA = BrandHaus.brandDNA;
    var profile = results.match.best.profile;
    var colors = profile.output.colors || {};
    var accentColor = colors.standOut || colors.accent || colors.primary || "#0D7377";
    var fingerprint = results.tensionFingerprint || {};
    var keys = brandDNA.TENSION_KEYS;
    var n = keys.length;
    // labelR leaves ~95px of margin to the viewBox edge — enough for the
    // longest label ("Sophistication") at this font size without its
    // text-anchor="start"/"end" extent getting clipped by the viewBox.
    var size = 460, cx = size / 2, cy = size / 2, maxR = 120, labelR = maxR + 35;

    function toRad(deg) { return ((deg - 90) * Math.PI) / 180; }
    function pt(angleDeg, r) {
      var rad = toRad(angleDeg);
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    var rings = [0.25, 0.5, 0.75, 1].map(function (f) {
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + (maxR * f).toFixed(1) + '" fill="none" stroke="rgba(46,42,38,0.12)" stroke-width="1"/>';
    }).join("");

    var spokes = "", labels = "", vertices = [];
    keys.forEach(function (key, i) {
      var angle = i * (360 / n);
      var edge = pt(angle, maxR);
      spokes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + edge.x.toFixed(1) + '" y2="' + edge.y.toFixed(1) + '" stroke="rgba(46,42,38,0.12)" stroke-width="1"/>';

      var labelPt = pt(angle, labelR);
      var cosA = Math.cos(toRad(angle));
      var anchor = Math.abs(cosA) < 0.2 ? "middle" : cosA > 0 ? "start" : "end";
      labels += '<text x="' + labelPt.x.toFixed(1) + '" y="' + labelPt.y.toFixed(1) + '" text-anchor="' + anchor + '" dominant-baseline="middle" font-size="12" font-weight="700" fill="#2E2A26">' + brandDNA.TENSION_LABELS[key].positive + "</text>";

      var score = fingerprint[key] || 0;
      var fraction = Math.max(0, Math.min(1, 0.5 + (score / 3) * 0.5));
      vertices.push(pt(angle, fraction * maxR));
    });

    var polygonPoints = vertices.map(function (p) { return p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ");
    var dots = vertices.map(function (p) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4.5" fill="' + accentColor + '" stroke="#fff" stroke-width="1.5"/>';
    }).join("");

    var svg = '<svg viewBox="0 0 ' + size + " " + size + '" width="100%" height="100%" overflow="visible">' +
      rings + spokes +
      '<polygon points="' + polygonPoints + '" fill="' + accentColor + '" fill-opacity="0.18" stroke="' + accentColor + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      dots + labels +
      "</svg>";

    var graphic = ui.el("div", { class: "bh-fingerprint" });
    graphic.innerHTML = svg;

    return ui.el("div", { class: "bh-fingerprint-wrap" }, [
      graphic,
      ui.el("p", { class: "bh-fingerprint-caption", text: "Your Founder Fingerprint™ — built from your specific answers across all 8 Brand Tensions. No two founders' shapes look exactly alike." }),
    ]);
  }

  // A small round icon accent for the right-hand side of a text row —
  // the words underneath still say everything that matters, this is
  // purely a faster-to-scan visual anchor next to them.
  function renderIconBadge(ui, iconName) {
    return ui.el("span", { class: "bh-icon-badge" }, [ui.icon(iconName)]);
  }

  // A quick-glance ring for the strongest dimension in a cluster — the
  // bars underneath still carry the exact numbers, this is just a
  // faster-to-scan companion to them, not a replacement. Also reused at
  // a larger size for each Supporting Influence's percentage.
  function renderMiniRing(ui, pct, extraClass) {
    var clamped = Math.max(0, Math.min(100, pct));
    return ui.el("div", {
      class: "bh-mini-ring" + (extraClass ? " " + extraClass : ""),
      style: "background: conic-gradient(var(--bh-results-standout, var(--bh-teal)) " + clamped + "%, var(--bh-border) 0);",
    }, [
      ui.el("div", { class: "bh-mini-ring__hole" }, [
        ui.el("span", { class: "bh-mini-ring__pct", text: clamped + "%" }),
      ]),
    ]);
  }

  function renderChapter2(ui, results) {
    var tensionSliders = BrandHaus.brandDNA.TENSION_KEYS.map(function (key) {
      return renderTensionSlider(ui, key, results.tensionFingerprint[key] || 0);
    });

    var scores = results.founderDNAScores || {};
    var maxScore = Math.max.apply(null, BrandHaus.brandDNA.FOUNDER_DNA_KEYS.map(function (k) { return scores[k] || 0; }).concat([0]));
    var clusterBlocks = BrandHaus.brandDNA.FOUNDER_DNA_CLUSTERS.map(function (cluster) {
      var pcts = cluster.keys.map(function (key) {
        return maxScore > 0 ? Math.round((100 * (scores[key] || 0)) / maxScore) : 0;
      });
      var bars = cluster.keys.map(function (key, i) {
        return renderDNABar(ui, founderDNALabel(key), pcts[i]);
      });
      var titleRow = ui.el("div", { class: "bh-dna-cluster__title-row" }, [
        ui.el("p", { class: "bh-dna-cluster__title", text: cluster.label }),
        renderMiniRing(ui, Math.max.apply(null, pcts.concat([0]))),
      ]);
      return ui.el("div", { class: "bh-dna-cluster" }, [titleRow].concat(bars));
    });

    return ui.el("section", { class: "bh-chapter" }, [
      chapterHeading(ui, "layers", "What We Discovered", "Your Brand Tensions show where you naturally land between two poles. Your Founder DNA shows what motivates you — grouped into four clusters so the pattern is easier to read at a glance."),
      ui.el("p", { class: "bh-chapter__section-title", text: "Your 8 Brand Tensions™" }),
      ui.el("div", { class: "bh-tension-grid" }, tensionSliders),
      ui.el("p", { class: "bh-chapter__section-title", text: "Your Founder DNA™" }),
      ui.el("div", { class: "bh-dna-cluster-grid" }, clusterBlocks),
    ]);
  }

  // ---------------------------------------------------------------------
  // Chapter 3 — How Your Brand Naturally Expresses Itself
  // ---------------------------------------------------------------------
  function aggregateExpression(expressionSuggestions, profile) {
    var categories = ["mood", "voice", "photography", "colorFamily"];
    var picked = {};
    categories.forEach(function (cat) {
      for (var i = expressionSuggestions.length - 1; i >= 0; i--) {
        if (expressionSuggestions[i][cat]) { picked[cat] = expressionSuggestions[i][cat]; break; }
      }
    });
    return {
      mood: picked.mood || profile.output.mood,
      voice: picked.voice || profile.output.voice,
      photography: picked.photography || "",
      colorFamily: picked.colorFamily || "",
    };
  }

  // A handful of generic, universally-solid pairings drawn only from
  // fonts BrandHaus.branding's own FONT_OPTIONS already offers — every
  // suggestion here has to be something "Use This Pairing" can actually
  // apply, not just something that looks good in isolation.
  var ALTERNATIVE_PAIRINGS = [
    { headingFont: "Playfair Display", bodyFont: "Poppins" },
    { headingFont: "Montserrat", bodyFont: "Open Sans" },
    { headingFont: "Oswald", bodyFont: "Inter" },
    { headingFont: "Merriweather", bodyFont: "Lora" },
    { headingFont: "Bebas Neue", bodyFont: "Montserrat" },
  ];

  function renderFontSample(ui, label, fontName) {
    return ui.el("div", { class: "bh-font-card" }, [
      ui.el("p", { class: "bh-font-card__label", text: label }),
      ui.el("p", { class: "bh-font-card__name", style: "font-family:'" + fontName + "';", text: fontName }),
      ui.el("p", { class: "bh-font-card__alphabet", style: "font-family:'" + fontName + "';", text: "AaBbCcDdEeFfGg 0123456789" }),
      ui.el("p", { class: "bh-font-card__glyph", style: "font-family:'" + fontName + "';", text: "Aa" }),
    ]);
  }

  // Split out from renderTypographyCards so the Playbook's Visual Identity
  // guide (which already shows Primary/Secondary fonts via its own, more
  // detailed renderFontSection cards) can include just this card instead
  // of duplicating simple font cards it already has richer versions of.
  function renderFontPairingsCard(ui, headingFont, bodyFont) {
    var pairings = ALTERNATIVE_PAIRINGS.filter(function (p) {
      return !(p.headingFont === headingFont && p.bodyFont === bodyFont);
    }).slice(0, 3);

    var pairingRows = pairings.map(function (p) {
      var row = ui.el("button", { type: "button", class: "bh-font-pairing-row" }, [
        ui.el("span", { class: "bh-font-pairing-row__names" }, [
          ui.el("span", { style: "font-family:'" + p.headingFont + "';", text: p.headingFont }),
          ui.el("span", { class: "bh-font-pairing-row__plus", text: " + " }),
          ui.el("span", { style: "font-family:'" + p.bodyFont + "';", text: p.bodyFont }),
        ]),
        ui.el("span", { class: "bh-font-pairing-row__chevron", text: "›" }),
      ]);
      row.title = "Apply " + p.headingFont + " + " + p.bodyFont + " to Branding Studio";
      row.addEventListener("click", function () {
        if (!BrandHaus.branding) return;
        var state = BrandHaus.branding.getState();
        BrandHaus.branding.setState({
          headingFont: Object.assign({}, state.headingFont, { value: p.headingFont, customValue: "" }),
          bodyFont: Object.assign({}, state.bodyFont, { value: p.bodyFont, customValue: "" }),
        });
        BrandHaus.ui.renderApp();
      });
      return row;
    });

    return ui.el("div", { class: "bh-font-card bh-font-card--pairings" }, [
      ui.el("p", { class: "bh-font-card__label", text: "Alternative Pairings" }),
      ui.el("div", { class: "bh-font-pairing-list" }, pairingRows),
    ]);
  }

  function renderTypographyCards(ui, headingFont, bodyFont) {
    return ui.el("div", { class: "bh-typography-cards" }, [
      renderFontSample(ui, "Primary Font (Headings)", headingFont),
      renderFontSample(ui, "Secondary Font (Body)", bodyFont),
      renderFontPairingsCard(ui, headingFont, bodyFont),
    ]);
  }

  function renderChapter3(ui, results) {
    var profile = results.match.best.profile;
    var expression = aggregateExpression(results.expressionSuggestions || [], profile);
    var colors = profile.output.colors;
    var roleOrder = ["primary", "secondary", "neutral", "accent", "support", "standOut"];
    var swatches = roleOrder.filter(function (role) { return colors[role]; }).map(function (role) {
      return ui.el("div", { class: "bh-palette-swatch" }, [
        ui.el("span", { class: "bh-palette-swatch__color", style: "background:" + colors[role] + ";" }),
        ui.el("span", { class: "bh-palette-swatch__role", text: paletteRoleLabel(role) }),
        ui.el("span", { class: "bh-palette-swatch__hex", text: colors[role] }),
      ]);
    });

    var typographyDemo = renderTypographyCards(ui, profile.output.headingFont, profile.output.bodyFont);

    var chipRows = [
      { label: "Voice", value: expression.voice },
      { label: "Mood", value: expression.mood },
    ];
    if (expression.photography) chipRows.push({ label: "Photography", value: expression.photography });
    if (expression.colorFamily) chipRows.push({ label: "Color Direction", value: expression.colorFamily });

    var chips = ui.el("div", { class: "bh-chapter__chip-groups" }, chipRows.map(function (row) {
      return ui.el("div", { class: "bh-chapter__chip-group" }, [
        ui.el("span", { class: "bh-chapter__chip-label", text: row.label }),
        ui.el("span", { class: "bh-chapter__chip-value", text: row.value }),
      ]);
    }));

    return ui.el("section", { class: "bh-chapter" }, [
      chapterHeading(ui, "sparkle", "How Your Brand Naturally Expresses Itself", "Pulled from the literal picks in your own answers where available, and your matched identity's defaults everywhere else."),
      chips,
      ui.el("p", { class: "bh-chapter__section-title", text: "Color Palette" }),
      ui.el("div", { class: "bh-palette-row" }, swatches),
      ui.el("p", { class: "bh-chapter__section-title", text: "Typography" }),
      typographyDemo,
    ]);
  }

  // ---------------------------------------------------------------------
  // Chapter 4 — Your Foundation
  // ---------------------------------------------------------------------
  function renderChapter4(ui, results) {
    var founderOutput = results.founderOutput;
    var profile = results.match.best.profile;

    var valueRows = ui.el("div", { class: "bh-chapter__value-list bh-chapter__highlight-line" }, founderOutput.valueReasons.map(function (vr) {
      return ui.el("div", { class: "bh-chapter__value-row" }, [
        renderIconBadge(ui, "heart"),
        ui.el("div", { class: "bh-chapter__value-row-text" }, [
          ui.el("span", { class: "bh-chapter__value-name", text: vr.value }),
          ui.el("span", { class: "bh-chapter__value-because", text: "Because you " + vr.because.replace(/^because you /, "") }),
        ]),
      ]);
    }));

    return ui.el("section", { class: "bh-chapter" }, [
      chapterHeading(ui, "heart", "Your Foundation", "Your mission statement, guiding star, and core values — all assembled from what your answers revealed about what drives you."),
      ui.el("p", { class: "bh-chapter__section-title", text: "Mission Statement" }),
      ui.el("p", { class: "bh-chapter__mission-intro", text: "Based on the motivations and values revealed throughout your Founder Interview™, we've drafted a mission statement to give you a strong starting point. Think of this as the first draft — not the final word. Edit it, refine it, and make it your own." }),
      ui.el("p", { class: "bh-founder-interview__mission", text: founderOutput.missionStatement }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Brand North Star" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: profile.output.northStar }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Brand Promise" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: profile.output.promise }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Core Values" }),
      valueRows,
    ]);
  }

  // ---------------------------------------------------------------------
  // Chapter 5 — Why This Fits You
  // ---------------------------------------------------------------------
  function renderBulletList(ui, className, items) {
    return ui.el("ul", { class: className }, items.map(function (text) {
      return ui.el("li", { text: text });
    }));
  }

  function renderChapter5(ui, results) {
    var profile = results.match.best.profile;
    var founderOutput = results.founderOutput;
    var dimensionLabels = founderOutput.topDimensions.map(founderDNALabel);
    var topLabels = dimensionLabels.length <= 2
      ? dimensionLabels.join(" and ")
      : dimensionLabels.slice(0, -1).join(", ") + ", and " + dimensionLabels[dimensionLabels.length - 1];
    var hallmarkWord = dimensionLabels.length <= 2 ? "both" : "all " + dimensionLabels.length;
    var whyMatched = "Your strongest motivations leaned toward " + topLabels + " — " + hallmarkWord + " hallmarks of " + profile.name + ".";

    return ui.el("section", { class: "bh-chapter" }, [
      chapterHeading(ui, "eye", "Why This Fits You", "The specific reasons your answers led here, plus what to lean into and what to watch for as you grow."),
      ui.el("p", { class: "bh-chapter__section-title", text: "Why You Matched" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: whyMatched }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Your Strengths" }),
      renderBulletList(ui, "bh-chapter__bullet-list", profile.output.strengths),
      ui.el("p", { class: "bh-chapter__section-title", text: "Potential Blind Spots" }),
      ui.el("p", { class: "bh-chapter__blindspot-intro", text: "These aren't weaknesses. They're common tendencies founders with a similar Brand DNA should remain mindful of as they grow." }),
      renderBulletList(ui, "bh-chapter__bullet-list", profile.output.blindSpots),
      ui.el("p", { class: "bh-chapter__section-title", text: "Ideal Customer" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: profile.output.idealCustomer }),
    ]);
  }

  // ---------------------------------------------------------------------
  // Chapter 6 — How Your Brand Lands With Customers (Customer Impression™)
  // Chapters 1-5 all describe the founder; this is the only chapter that
  // describes the customer's experience of the brand — Relationship,
  // Self-Image, Reflection, and Differentiation, closing the gap
  // identified against Kapferer's Brand Identity Prism. Falls back to a
  // plain notice if results predate this layer (e.g. a results object
  // saved before this chapter existed) rather than rendering blank rows.
  // ---------------------------------------------------------------------
  var CUSTOMER_IMPRESSION_ICONS = { relationship: "heart", selfImage: "eye", reflection: "layers", differentiation: "sparkle" };

  function renderChapter6(ui, results) {
    var brandDNA = BrandHaus.brandDNA;
    if (!results.customerImpression || !brandDNA.describeCustomerImpression) {
      return null;
    }
    var items = brandDNA.describeCustomerImpression(results.customerImpression);
    var rows = items.map(function (item) {
      return ui.el("div", { class: "bh-chapter__value-row" }, [
        renderIconBadge(ui, CUSTOMER_IMPRESSION_ICONS[item.dimension] || "sparkle"),
        ui.el("div", { class: "bh-chapter__impression-text" }, [
          ui.el("p", { class: "bh-chapter__section-title", text: item.chapterLabel }),
          ui.el("p", { class: "bh-chapter__foundation-line", text: item.description }),
        ]),
      ]);
    });
    return ui.el("section", { class: "bh-chapter" }, [
      chapterHeading(ui, "people", "How Your Brand Lands With Customers", "Everything above this point is about you. This one is about them — the relationship, self-image, and impression your brand creates for the people who buy from you."),
      ui.el("div", { class: "bh-chapter__impression-list" }, rows),
    ]);
  }

  // ---------------------------------------------------------------------
  // Chapter 7 — Your Next Steps
  // ---------------------------------------------------------------------
  function renderChapter7(ui, results) {
    var profile = results.match.best.profile;

    // Doesn't call applyToBrandingStudio() directly — Branding Studio's
    // own maybeAutoApplyAssessment() (brand-haus-ui.js) handles syncing
    // as soon as it renders, so there's exactly one place that decides
    // whether to sync rather than two that could disagree.
    var continueBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal" }, [ui.icon("palette"), ui.el("span", { text: "Continue to Branding Studio" })]);
    continueBtn.addEventListener("click", function () {
      BrandHaus.ui.setActiveStep("brandingStudio");
    });

    var retakeBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset" }, [ui.icon("refresh"), ui.el("span", { text: "Retake" })]);
    retakeBtn.addEventListener("click", function () {
      BrandHaus.founderInterview.retake();
      BrandHaus.ui.setActiveStep("welcome");
    });

    return ui.el("section", { class: "bh-chapter" }, [
      chapterHeading(ui, "lightning", "Your Next Steps", "A short, concrete list of what to do with everything above, tailored to your matched identity.", "bh-chapter__heading--complete"),
      renderBulletList(ui, "bh-chapter__bullet-list", profile.output.nextSteps),
      ui.el("div", { class: "bh-preview__actions bh-chapter__next-steps-actions" }, [continueBtn, retakeBtn]),
    ]);
  }

  // --bh-results-accent-2 (fed by "secondary" below) is used as TEXT
  // color for every section title across the app — fine for most
  // profiles, but The Modern Minimalist's secondary is pure white,
  // which rendered every one of its section titles invisible against
  // the white chapter cards. Steer away from any near-white pick here.
  function isNearWhite(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return false;
    var n = parseInt(m[1], 16);
    return ((n >> 16) & 255) > 235 && ((n >> 8) & 255) > 235 && (n & 255) > 235;
  }

  // Same idea as isNearWhite but for text-legibility purposes generally
  // (small 700-weight uppercase labels), not just literal near-white —
  // The Modern Minimalist's support color (#B4B2A9) isn't white enough
  // to trip isNearWhite but is still too washed-out to read as a label.
  function relativeLightness(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return 0;
    var n = parseInt(m[1], 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  // The Results/Blueprint pages should feel like the founder's own
  // brand, not Brand Haus's own teal/steel chrome — every accent color
  // in these two views is pulled from the matched profile itself, with
  // Brand Haus's own colors only as a fallback if a role is missing.
  function accentStyleFor(profile) {
    var colors = profile.output.colors;
    var primary = colors.primary || "";
    var accent = colors.accent || colors.primary || "";
    var secondary = colors.secondary || colors.support || "";
    if (isNearWhite(secondary)) secondary = colors.accent || colors.primary || secondary;
    var support = colors.support || colors.accent || "";
    var standOut = colors.standOut || colors.accent || "";
    // --bh-gold-on-light feeds every small uppercase label in the app
    // (.bh-chapter__eyebrow, Part titles, the TOC's Part labels) — it was
    // never overridden per-profile like --bh-results-accent-2 is, so
    // every founder saw the same flat neutral grey there regardless of
    // their matched brand's colors. Tying it to "support" (a naturally
    // muted role) keeps a visual tier below the bolder section titles
    // while still being on-brand; falls through to accent/primary for
    // the 3 profiles whose support color is itself too light to read.
    var labelColor = support;
    if (relativeLightness(labelColor) > 0.68) labelColor = accent || primary || labelColor;
    if (relativeLightness(labelColor) > 0.68) labelColor = primary || labelColor;
    var vars = [];
    if (primary) vars.push("--bh-results-primary: " + primary);
    if (accent) vars.push("--bh-results-accent: " + accent);
    if (secondary) vars.push("--bh-results-accent-2: " + secondary);
    if (support) vars.push("--bh-results-support: " + support);
    if (standOut) vars.push("--bh-results-standout: " + standOut);
    if (labelColor) vars.push("--bh-gold-on-light: " + labelColor);
    return vars.join("; ");
  }

  // ---------------------------------------------------------------------
  // "If You Remember Nothing Else" — a short, quotable brand-truth
  // callout reused at 4 points across the app (end of Your Brand DNA's
  // own Next Steps chapter, and once each in the Snapshot/Report/
  // Playbook) rather than re-authored per location.
  // ---------------------------------------------------------------------
  function renderRememberCallout(ui) {
    return ui.el("div", { class: "bh-chapter__remember" }, [
      ui.el("p", { class: "bh-chapter__remember-label" }, [ui.icon("shield"), ui.el("span", { text: "If You Remember Nothing Else" })]),
      ui.el("p", { class: "bh-chapter__remember-line", text: "Your brand isn't trying to impress people." }),
      ui.el("p", { class: "bh-chapter__remember-line", text: "It's trying to make the right people feel understood." }),
      ui.el("p", { class: "bh-chapter__remember-line bh-chapter__remember-line--emphasis", text: "Protect that at all costs." }),
    ]);
  }

  // ---------------------------------------------------------------------
  // "A Final Note From Your Brand Strategist" — the closing manifesto.
  // heroStyle=true reuses the same bh-chapter--hero treatment as "Your
  // Brand DNA Blueprint™ is Complete" for the page-level closing bookend;
  // false (default) renders as a normal chapter card for the Report's
  // own closing section.
  // ---------------------------------------------------------------------
  function renderStrategistNote(ui, heroStyle) {
    var stanzaOne = [
      "Brands don't become memorable because they're different.",
      "They become memorable because they're consistent.",
      "Every major brand you've admired did fewer things more consistently.",
      "Resist the urge to reinvent yourself every month.",
      "Depth beats novelty... Every. Single. Time.",
    ];
    var stanzaTwo = [
      "This isn't your brand. It's your permission.",
      "Permission to stop copying.",
      "Permission to stop forcing.",
      "Permission to stop sounding like everyone else.",
      "Your Brand DNA was never something we created. It was already there. We simply help uncover it.",
      "The rest...",
      "The rest is yours to build.",
    ];
    var lineEl = function (text) { return ui.el("p", { class: "bh-chapter__strategist-line", text: text }); };
    return ui.el("section", { class: "bh-chapter bh-chapter__strategist-note" + (heroStyle ? " bh-chapter--hero" : "") }, [
      ui.el("p", { class: "bh-chapter__strategist-label", text: "A Final Note From Your Brand Strategist" }),
      ui.el("div", { class: "bh-chapter__strategist-lines" }, stanzaOne.map(lineEl)),
      ui.el("div", { class: "bh-chapter__strategist-divider" }),
      ui.el("div", { class: "bh-chapter__strategist-lines" }, stanzaTwo.map(lineEl)),
    ]);
  }

  function renderStep3() {
    var ui = BrandHaus.ui;
    var state = BrandHaus.founderInterview.getState();
    var results = state.results;
    if (!results) {
      return ui.el("p", { class: "bh-coming-soon", text: "Your Brand DNA is coming soon — complete the Brand DNA Assessment first." });
    }
    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--results", style: accentStyleFor(results.match.best.profile) }, [
      renderChapter1(ui, results),
      renderChapter2(ui, results),
      renderChapter3(ui, results),
      renderChapter4(ui, results),
      renderChapter5(ui, results),
      renderChapter6(ui, results),
      renderRememberCallout(ui),
      renderChapter7(ui, results),
    ].filter(Boolean));
  }

  // Individual chapter renderers are exported too — Your Comprehensive
  // Brand DNA Blueprint (brand-haus-blueprint.js) reuses these directly
  // rather than re-implementing the same 7 chapters a second time, just
  // feeding them a results object with Branding Studio's current edits
  // merged in instead of the raw assessment match.
  BrandHaus.results = {
    renderStep3: renderStep3,
    accentStyleFor: accentStyleFor,
    paletteRoleLabel: paletteRoleLabel,
    renderCongratsBanner: renderCongratsBanner,
    renderRememberCallout: renderRememberCallout,
    renderStrategistNote: renderStrategistNote,
    renderFontSample: renderFontSample,
    renderTypographyCards: renderTypographyCards,
    renderFontPairingsCard: renderFontPairingsCard,
    renderTensionSlider: renderTensionSlider,
    renderDNABar: renderDNABar,
    renderFounderFingerprint: renderFounderFingerprint,
    renderBulletList: renderBulletList,
    chapterHeading: chapterHeading,
    aggregateExpression: aggregateExpression,
    renderChapter1: renderChapter1,
    renderChapter2: renderChapter2,
    renderChapter3: renderChapter3,
    renderChapter4: renderChapter4,
    renderChapter5: renderChapter5,
    renderChapter6: renderChapter6,
    renderChapter7: renderChapter7,
  };
})();
