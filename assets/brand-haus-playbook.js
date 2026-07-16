/**
 * The AI Creator's Brand Haus — Your Brand Playbook™ (Your Blueprint step,
 * third of three exportable documents alongside the Snapshot and the
 * Brand DNA Report in brand-haus-blueprint.js).
 *
 * Depends on brand-haus-branddna.js (TENSION_PLAYBOOK, CLUSTER_PLAYBOOK,
 * tensionContributors — the answer-tracing engine), brand-haus-playbook-
 * content.js (the bulk per-profile/per-font/per-expression-value prose),
 * brand-haus-founderinterview.js (QUESTION_TEXT, for quoting a founder's
 * literal answers back to them), and brand-haus-results.js/brand-haus-
 * blueprint.js's existing helpers (accentStyleFor, renderFontSample,
 * BrandHaus.ui.printStyledSection) — reused rather than duplicated.
 *
 * 21 chapters across 5 Parts. Every chapter ends with two shared closers,
 * renderWhyThisMatters() and renderTakeAction() — built once here so
 * every chapter looks and behaves identically rather than each chapter
 * rolling its own callout box.
 *
 * Filled in phase by phase (see the approved plan) rather than all at
 * once — chapters not yet authored render a short "coming soon" line so
 * the shape of the whole document is verifiable before content lands.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  // ---------------------------------------------------------------------
  // Shared per-chapter closers
  // ---------------------------------------------------------------------
  function renderWhyThisMatters(ui, text) {
    if (!text) return null;
    return ui.el("div", { class: "bh-chapter__why-this-matters" }, [
      ui.el("p", { class: "bh-chapter__why-this-matters-label", text: "Why This Matters" }),
      ui.el("p", { class: "bh-chapter__why-this-matters-body", text: text }),
    ]);
  }

  function renderTakeAction(ui, items) {
    var list = (items || []).filter(Boolean);
    if (!list.length) return null;
    return ui.el("div", { class: "bh-chapter__take-action" }, [
      ui.el("p", { class: "bh-chapter__take-action-label" }, [ui.icon("sparkle"), ui.el("span", { text: "Take Action" })]),
      ui.el("ul", { class: "bh-chapter__take-action-list" }, list.map(function (item) {
        return ui.el("li", { text: item });
      })),
    ]);
  }

  // ---------------------------------------------------------------------
  // Personalization helpers — one fallback discipline, reused everywhere
  // a chapter would otherwise reference something a founder may not have
  // typed in, or an older Version History snapshot may not have stored.
  // ---------------------------------------------------------------------
  function resolveAudienceOrGeneric(results) {
    var typed = (results.audienceDescription || "").trim();
    return typed || "the people you serve";
  }

  function resolveProblemOrGeneric(results) {
    var typed = (results.problemStatement || "").trim();
    return typed || "the problem you set out to solve";
  }

  // ---------------------------------------------------------------------
  // Part dividers
  // ---------------------------------------------------------------------
  function renderPartDivider(ui, partNumber, title, subtitle) {
    return ui.el("div", { class: "bh-playbook__part-divider" }, [
      ui.el("p", { class: "bh-playbook__part-number", text: "Part " + partNumber }),
      ui.el("h3", { class: "bh-playbook__part-title", text: title }),
      subtitle ? ui.el("p", { class: "bh-playbook__part-subtitle", text: subtitle }) : null,
    ].filter(Boolean));
  }

  // Cross-references a founder's literal answer (results.answers, keyed by
  // questionId) against the human-readable question/option text that only
  // exists in brand-haus-founderinterview.js's QUESTION_TEXT — returns
  // null (never throws) if the answer, the question, or QUESTION_TEXT
  // itself isn't available, so every call site gets one clean fallback
  // branch instead of needing its own defensive checks.
  function quoteAnswer(questionId, results) {
    var questionText = BrandHaus.founderInterview && BrandHaus.founderInterview.QUESTION_TEXT;
    if (!questionText || !results.answers) return null;
    var q = questionText.filter(function (entry) { return entry.id === questionId; })[0];
    var optionKey = results.answers[questionId] || results.answers[String(questionId)];
    if (!q || !optionKey || !q.options[optionKey]) return null;
    return { question: q.text, answer: q.options[optionKey] };
  }

  function dnaLabel(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  // ---------------------------------------------------------------------
  // Part I, Chapter 1 — Welcome
  // ---------------------------------------------------------------------
  function renderChapter1(ui, results) {
    var r = BrandHaus.results;
    var firstName = (results.firstName || "").trim();
    var businessName = (results.businessName || "").trim();
    // "your business becomes... a brand" reads redundant with the fallback
    // used everywhere else ("your brand") — this one opening line needs
    // its own, since "your brand becomes... a brand" would repeat itself.
    var becomesSubject = businessName || "your business";
    var opener = firstName ? "Welcome, " + firstName + "." : "Welcome to Your Brand Playbook™.";
    var welcomeLine = opener + " Today, " + becomesSubject + " becomes more than just an idea — it becomes a brand with direction, purpose, and a clear identity. What you're holding is the full expansion of your Brand DNA Blueprint — not just who your brand is, but how to build, communicate, and grow it with intention. Everything in here traces back to one thing: the Founder Interview™ you completed, question by question, choice by choice.";
    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "bulb", "Welcome", null, null, "Guide 1 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: welcomeLine }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "How To Use This Playbook" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "This isn't meant to be read once and filed away. The first time through, read it start to finish — it's built to build on itself, part by part. After that, treat it like a reference: come back to a specific guide whenever you're making a real decision, and let it settle the question." }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Your Brand Will Evolve" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Nothing in this Playbook is permanent. It's a snapshot of who you are as a founder and what that means for your brand today. As your business grows, some of this will sharpen, some of it will shift — that's not a failure of the process, it's the process working." }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "This Is A Compass, Not A Label" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "None of this is meant to put you in a box. Every recommendation here is a starting direction, not a rule. If something in this Playbook doesn't feel like you, trust that instinct over the page — you know your business in ways no assessment can measure." }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "How Every Recommendation Was Generated" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Every recommendation in this Playbook traces back to your actual answers in the Founder Interview™ — not a template applied to your name. Your answers were scored across 8 Brand Tensions™ and 12 Founder DNA™ dimensions, matched against 11 brand archetypes, and used to generate the specific language, color, and guidance in the guides ahead." }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "How The Layers Connect" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "This Playbook isn't a sequence of interesting insights — it's an operating system, and each part builds on the one before it. Your Core Motivations™ explain why you build. Your Brand Tensions™ explain how you decide. Your Brand Identity explains how that naturally shows up. Read in order, each guide answers the question the last one raised." }),
      renderWhyThisMatters(ui, "This Playbook only works if you actually use it. The founders who get the most out of their Brand DNA Blueprint are the ones who treat it as a living reference, not a one-time report."),
      renderTakeAction(ui, [
        "Read through Part I in one sitting before jumping to any single guide.",
        "Save this document somewhere you'll actually revisit.",
        "Come back to this Playbook every time you're about to make a real brand decision.",
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part I, Chapter 2 — Meet Your Brand DNA™
  // Reuses Your Brand DNA's own Chapter 1 (Identity, Alignment Score,
  // Influences) wholesale rather than re-deriving the same content —
  // adds only the "Why This Became Your Brand" section, which lives in
  // results.js's Chapter 5 bundled with Strengths/Blind Spots that
  // belong to this Playbook's own Chapter 9 instead, so it's rebuilt
  // here standalone. Tells the story of why the result happened (these
  // motivations kept recurring across dozens of answers) rather than
  // just stating what the result is — and it's no longer the first time
  // a reader has seen these motivations by name, since Guide 3 (Your
  // Core Motivations™) now introduces and explains each one first.
  // ---------------------------------------------------------------------
  function renderChapter2(ui, results) {
    var r = BrandHaus.results;
    var founderOutput = results.founderOutput;
    var dimensionLabels = founderOutput.topDimensions.map(dnaLabel);
    var topLabels = dimensionLabels.length <= 2
      ? dimensionLabels.join(" and ")
      : dimensionLabels.slice(0, -1).join(", ") + ", and " + dimensionLabels[dimensionLabels.length - 1];
    var isSingle = dimensionLabels.length === 1;
    var profile = results.match.best.profile;
    var surfacedLine = "Throughout your Founder Interview™, " + (isSingle ? "one motivation surfaced" : dimensionLabels.length + " motivations surfaced") + " again and again: " + topLabels + ".";
    var becauseLine = "Together, " + (isSingle ? "it created" : "they created") + " the foundation for " + profile.name + " — not because of one answer, but because " + (isSingle ? "it" : "they") + " consistently shaped dozens of choices across your interview.";

    return ui.el("div", {}, [
      r.renderChapter1(ui, results),
      ui.el("section", { class: "bh-chapter" }, [
        ui.el("p", { class: "bh-chapter__section-title bh-chapter__section-title--with-badge" }, [
          ui.el("span", { text: "Why This Became Your Brand" }),
          ui.el("span", { class: "bh-chapter__number-badge", text: "Guide 2 of 21" }),
        ]),
        ui.el("p", { class: "bh-chapter__foundation-line", text: surfacedLine }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: becauseLine }),
        renderWhyThisMatters(ui, "Think of your Primary Brand Identity as a match, not a verdict — the closest read of the patterns already in your actual answers. The Alignment Score tells you how confidently, and the Supporting Influences show you what else is shaping your brand alongside it."),
        renderTakeAction(ui, [
          "Read your Primary Brand Identity's description again — underline anything that feels exactly right.",
          "If a Supporting Influence surprised you, sit with why it might be true.",
        ]),
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part I, new Guide 3 — Your Core Motivations™
  // The missing bridge Guide 2's "Why This Became Your Brand" line
  // references but never used to explain: by the time a founder reads
  // that line, they've now already seen what each motivation means.
  // Ranks all 12 raw Founder DNA scores (not yet grouped into the 4
  // clusters the renumbered Founder DNA guide covers next) into three
  // fixed-size tiers — Primary (top 2) / Supporting (next 3) / Emerging
  // (the rest) — fixed bucket counts rather than a percentage cutoff so
  // the tiers never come out empty or lopsided on a flatter score
  // profile. Same renderDNABar component and relative-to-own-max
  // percentage math the Founder DNA guide already uses, so the bars read
  // as one consistent visual language across both guides.
  // ---------------------------------------------------------------------
  function renderCoreMotivationsChapter(ui, results) {
    var r = BrandHaus.results;
    var brandDNA = BrandHaus.brandDNA;
    var scores = results.founderDNAScores || {};
    var maxScore = Math.max.apply(null, brandDNA.FOUNDER_DNA_KEYS.map(function (k) { return scores[k] || 0; }).concat([0]));
    var ranked = brandDNA.FOUNDER_DNA_KEYS.map(function (k) { return { key: k, score: scores[k] || 0 }; }).sort(function (a, b) { return b.score - a.score; });

    var tiers = [
      { label: "Primary", items: ranked.slice(0, 2) },
      { label: "Supporting", items: ranked.slice(2, 5) },
      { label: "Emerging", items: ranked.slice(5) },
    ].filter(function (t) { return t.items.length; });

    var sections = tiers.map(function (tier) {
      var bars = tier.items.map(function (e) {
        var pct = maxScore > 0 ? Math.round((100 * e.score) / maxScore) : 0;
        return r.renderDNABar(ui, dnaLabel(e.key), pct);
      });
      var explainLines = tier.label === "Primary"
        ? tier.items.map(function (e) { return brandDNA.CORE_MOTIVATION_EXPLAINS[e.key]; }).filter(Boolean).map(function (line) {
            return ui.el("p", { class: "bh-chapter__foundation-line", text: line });
          })
        : [];
      return ui.el("div", { class: "bh-chapter__tension-section" }, [
        ui.el("p", { class: "bh-chapter__section-title", text: tier.label }),
        ui.el("div", { class: "bh-dna-cluster-grid" }, [ui.el("div", { class: "bh-dna-cluster" }, bars)]),
      ].concat(explainLines));
    });

    var body = sections.length ? sections : [ui.el("p", { class: "bh-chapter__foundation-line", text: "Not enough signal came through in your answers to rank individual motivations yet — retaking the assessment gives this guide a fuller picture." })];

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "sparkle", "Your Core Motivations™", null, null, "Guide 3 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Every founder is driven by a different mix of motivations. Some build for freedom. Some for recognition. Some for belonging. Some for legacy. These motivations quietly shape every decision you make — even when you don't realize it." }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Your Brand DNA wasn't determined by one answer. It emerged from the motivations that appeared again and again throughout your Founder Interview™." }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Your Strongest Motivations" }),
    ].concat(body).concat([
      renderWhyThisMatters(ui, "You'll keep making decisions through these motivations whether or not you ever notice you're doing it — that's exactly what makes them worth naming now. The next guide shows how they group into 4 bigger patterns."),
      renderTakeAction(ui, [
        "Read your Primary motivations' explanations and think of a recent decision they explain.",
        "Keep them in mind heading into the next guide — you'll see exactly how they group together.",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part I, Guide 5 (renumbered) — Understanding Your Brand Psychology™
  // The answer-tracing engine (tensionContributors, in brand-haus-
  // branddna.js) is what makes "Why You Landed Here" genuinely
  // personalized rather than a generic pole description — falls back to
  // a generic line when a founder's raw answers aren't available (older
  // Version History snapshots saved before that was persisted).
  // ---------------------------------------------------------------------
  function renderTensionSection(ui, results, tensionKey) {
    var brandDNA = BrandHaus.brandDNA;
    var labels = brandDNA.TENSION_LABELS[tensionKey];
    var score = results.tensionFingerprint[tensionKey] || 0;
    var direction = score < 0 ? -1 : 1;
    var poleKey = direction < 0 ? "negative" : "positive";
    var poleLabel = labels[poleKey];
    var poleContent = brandDNA.TENSION_PLAYBOOK[tensionKey][poleKey];

    var contributors = brandDNA.tensionContributors(tensionKey, results.answers, direction).slice(0, 2);
    var quotes = contributors.map(function (c) { return quoteAnswer(c.questionId, results); }).filter(Boolean);
    var whyLandedHere = quotes.length
      ? quotes.map(function (q) { return "When asked “" + q.question + "” you chose: “" + q.answer + ".”"; }).join(" ")
      : "Your position here reflects the overall pattern across your answers, not any single choice.";

    return ui.el("div", { class: "bh-chapter__tension-section" }, [
      ui.el("p", { class: "bh-chapter__section-title", text: labels.negative + " ↔ " + labels.positive }),
      ui.el("div", { class: "bh-chapter__slider-box" }, [
        BrandHaus.results.renderTensionSlider(ui, tensionKey, score),
        ui.el("p", { class: "bh-chapter__slider-box-position", text: "Your Position: " + poleLabel }),
      ]),
      ui.el("p", { class: "bh-chapter__foundation-line", text: poleContent.whatItMeans }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Why You Landed Here" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: whyLandedHere }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Natural Strengths" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: poleContent.strengths }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Blind Spots" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: poleContent.blindSpots }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Business Implications" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: poleContent.businessImplications }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Growth Advice" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: poleContent.growthAdvice }),
    ]);
  }

  function renderChapter3(ui, results) {
    var r = BrandHaus.results;
    var brandDNA = BrandHaus.brandDNA;
    var sections = brandDNA.TENSION_KEYS.map(function (key) { return renderTensionSection(ui, results, key); });

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "layers", "Understanding Your Brand Psychology™", null, null, "Guide 5 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Your 8 Brand Tensions™ measure where you naturally land between two poles — not right or wrong, just true to how you think. Here's what your specific answers reveal about each one." }),
      r.renderFounderFingerprint(ui, results),
    ].concat(sections).concat([
      renderWhyThisMatters(ui, "These 8 tensions aren't personality quirks — they're the actual decision-making patterns that will keep showing up as your brand grows. Naming them now means you'll recognize them instead of being surprised by them."),
      renderTakeAction(ui, [
        "Read through each tension and mark the ones that surprised you — those are worth sitting with.",
        "For the tension where you scored strongest, write down one way it already shows up in your business today.",
        "Revisit this guide whenever you feel torn on a brand decision — chances are it maps to one of these 8 tensions.",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part I, Chapter 4 — Your Founder DNA™
  // Same cluster-strength ranking already used in Your Brand DNA's
  // Chapter 2 (max score within the cluster, normalized against the
  // founder's overall max) — reused here to decide which cluster gets
  // called out as the strongest driver, not re-derived.
  // ---------------------------------------------------------------------
  function renderChapter4(ui, results) {
    var r = BrandHaus.results;
    var brandDNA = BrandHaus.brandDNA;
    var scores = results.founderDNAScores || {};
    var maxScore = Math.max.apply(null, brandDNA.FOUNDER_DNA_KEYS.map(function (k) { return scores[k] || 0; }).concat([0]));

    var ranked = brandDNA.FOUNDER_DNA_CLUSTERS.map(function (cluster) {
      var pcts = cluster.keys.map(function (key) { return maxScore > 0 ? Math.round((100 * (scores[key] || 0)) / maxScore) : 0; });
      return { cluster: cluster, pcts: pcts, strength: Math.max.apply(null, pcts.concat([0])) };
    }).sort(function (a, b) { return b.strength - a.strength; });

    var sections = ranked.map(function (r2, i) {
      var content = brandDNA.CLUSTER_PLAYBOOK[r2.cluster.label];
      var bars = r2.cluster.keys.map(function (key, j) { return r.renderDNABar(ui, dnaLabel(key), r2.pcts[j]); });
      return ui.el("div", { class: "bh-chapter__tension-section" }, [
        ui.el("p", { class: "bh-chapter__section-title", text: r2.cluster.label + (i === 0 ? " — Your Strongest Driver" : "") }),
        ui.el("div", { class: "bh-dna-cluster-grid" }, [ui.el("div", { class: "bh-dna-cluster" }, bars)]),
        ui.el("p", { class: "bh-chapter__foundation-line", text: content.interpretation }),
        ui.el("p", { class: "bh-chapter__eyebrow", text: "Decision Impact" }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: content.decisionImpact }),
        ui.el("p", { class: "bh-chapter__eyebrow", text: "Customer Impact" }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: content.customerImpact }),
        ui.el("p", { class: "bh-chapter__eyebrow", text: "Leadership Impact" }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: content.leadershipImpact }),
        ui.el("p", { class: "bh-chapter__eyebrow", text: "Future Growth" }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: content.futureGrowth }),
      ]);
    });

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "layers", "Your Founder DNA™", null, null, "Guide 4 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "In the last guide, you saw your 12 core motivations ranked individually. Here's how those group into 4 human-readable clusters — and what each one means for how you decide, lead, serve customers, and grow." }),
    ].concat(sections).concat([
      renderWhyThisMatters(ui, "Naming your strongest cluster turns a background pattern into something you can actually use — the same lens you've been making decisions through, now on purpose instead of by accident."),
      renderTakeAction(ui, [
        "Read your strongest cluster's Decision Impact line and think of a recent choice it explains.",
        "Share this page with a co-founder or key hire — it's the fastest way to explain how you think.",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part I, Chapter 5 — The Story Hidden In Your Answers™
  // Fully dynamic — no authored content at all. Ranks the founder's 8
  // tensions by how decisively they leaned one way, turns the top ones
  // into a "you chose X over Y" narrative, and grounds the strongest one
  // in the founder's own literal answer when it's available.
  // ---------------------------------------------------------------------
  function renderChapter5(ui, results) {
    var r = BrandHaus.results;
    var brandDNA = BrandHaus.brandDNA;
    var fingerprint = results.tensionFingerprint || {};
    var ranked = brandDNA.TENSION_KEYS.map(function (key) {
      var score = fingerprint[key] || 0;
      return { key: key, score: score };
    }).filter(function (t) { return t.score !== 0; }).sort(function (a, b) { return Math.abs(b.score) - Math.abs(a.score); }).slice(0, 4);

    var bullets = ranked.map(function (t) {
      var labels = brandDNA.TENSION_LABELS[t.key];
      var direction = t.score < 0 ? -1 : 1;
      var chosen = direction < 0 ? labels.negative : labels.positive;
      var opposite = direction < 0 ? labels.positive : labels.negative;
      return chosen + " over " + opposite;
    });

    var children = [
      r.chapterHeading(ui, "sparkle", "The Story Hidden In Your Answers™", null, null, "Guide 6 of 21"),
    ];

    if (bullets.length) {
      children.push(ui.el("p", { class: "bh-chapter__foundation-line", text: "Throughout your Founder Interview™, you repeatedly chose:" }));
      children.push(r.renderBulletList(ui, "bh-chapter__bullet-list", bullets));
      children.push(ui.el("p", { class: "bh-chapter__foundation-line", text: "These recurring decisions are what produced your Brand DNA — not luck, not a coin flip, a pattern." }));

      var top = ranked[0];
      var direction = top.score < 0 ? -1 : 1;
      var contributors = brandDNA.tensionContributors(top.key, results.answers, direction);
      var quote = contributors.length ? quoteAnswer(contributors[0].questionId, results) : null;
      if (quote) {
        children.push(ui.el("p", { class: "bh-chapter__eyebrow", text: "In Your Own Words" }));
        children.push(ui.el("p", { class: "bh-chapter__foundation-line", text: "When asked “" + quote.question + "” you chose: “" + quote.answer + ".”" }));
      }
    } else {
      children.push(ui.el("p", { class: "bh-chapter__foundation-line", text: "Your answers landed close to the center across every tension — a genuinely balanced pattern, rather than a strong lean in any one direction." }));
    }

    children.push(renderWhyThisMatters(ui, "Your Brand DNA didn't come from a label someone picked for you — it came from the specific, repeated choices you made when no one was watching for a pattern."));
    children.push(renderTakeAction(ui, [
      "Notice which pattern surprised you the most, and ask yourself why it's true.",
      "Share this story with your team — it's a faster way to explain your brand than any mission statement.",
    ]));

    return ui.el("section", { class: "bh-chapter" }, children.filter(Boolean));
  }

  // ---------------------------------------------------------------------
  // Part II, Chapter 6 — How Your Brand Naturally Expresses Itself
  // Voice/Mood/Photography/Color Direction reuse the same aggregation
  // already built for Your Brand DNA's own Chapter 3 (live answer-derived
  // value, falling back to the matched profile's static field) — reused
  // via BrandHaus.results.aggregateExpression rather than re-derived.
  // Communication Style and Writing Style are folded into the voice/mood
  // entries themselves rather than tracked as separate dimensions;
  // Emotional Experience reuses the Customer Impression™ self-image
  // result the assessment already collects.
  // ---------------------------------------------------------------------
  function renderExpressionField(ui, label, valueText, entry) {
    if (!entry) return null;
    var titleChildren = [ui.el("span", { text: label + ": " })];
    if (valueText) {
      var displayValue = valueText.charAt(0).toUpperCase() + valueText.slice(1);
      titleChildren.push(ui.el("span", { class: "bh-chapter__dna-value", text: displayValue }));
    }
    return ui.el("div", { class: "bh-chapter__tension-section" }, [
      ui.el("p", { class: "bh-chapter__section-title" }, titleChildren),
      ui.el("p", { class: "bh-chapter__eyebrow bh-chapter__eyebrow--first", text: "Why" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.why }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Examples" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.examples }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Application" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.application }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Avoid" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.avoid }),
    ]);
  }

  function renderChapter6(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var expression = r.aggregateExpression(results.expressionSuggestions || [], profile);
    var moodEntry = content.EXPRESSION_PLAYBOOK.mood[expression.mood];
    var voiceEntry = content.EXPRESSION_PLAYBOOK.voice[expression.voice];
    var photoEntry = expression.photography ? content.EXPRESSION_PLAYBOOK.photography[expression.photography] : null;
    var colorEntry = expression.colorFamily ? content.EXPRESSION_PLAYBOOK.colorFamily[expression.colorFamily] : null;
    var selfImage = results.customerImpression && results.customerImpression.selfImage;
    var emotionalExperience = content.EMOTIONAL_EXPERIENCE_BY_SELF_IMAGE[selfImage] || "Your customers want to feel like the experience was built specifically with them in mind, not just processed like any other transaction.";

    var sections = [
      renderExpressionField(ui, "Voice", expression.voice, voiceEntry),
      renderExpressionField(ui, "Mood", expression.mood, moodEntry),
      renderExpressionField(ui, "Photography", expression.photography, photoEntry),
      renderExpressionField(ui, "Color Direction", expression.colorFamily, colorEntry),
    ].filter(Boolean);

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "sparkle", "How Your Brand Naturally Expresses Itself", null, null, "Guide 7 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "These aren't arbitrary style choices — each one traces back to the same answers that shaped your Brand DNA." }),
    ].concat(sections).concat([
      ui.el("div", { class: "bh-chapter__tension-section" }, [
        ui.el("p", { class: "bh-chapter__section-title", text: "Communication Style" }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: (voiceEntry && voiceEntry.communicationStyle) || "You communicate best when the format matches the moment — don't force every message into the same channel." }),
        ui.el("p", { class: "bh-chapter__section-title", text: "Writing Style" }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: (moodEntry && moodEntry.writingStyle) || "Let your writing match the mood you've already established visually — consistency there is what makes a brand feel whole." }),
        ui.el("p", { class: "bh-chapter__section-title", text: "Emotional Experience" }),
        ui.el("p", { class: "bh-chapter__foundation-line", text: emotionalExperience }),
      ]),
      renderWhyThisMatters(ui, "None of this is decoration. Voice, mood, photography, and color are the actual mechanism by which your Brand DNA reaches a customer who's never taken this assessment — they just experience the result."),
      renderTakeAction(ui, [
        "Compare this guide's Voice and Mood to what's currently live on your website — note anywhere they've drifted apart.",
        "Pick one Application idea per category and put it on your content calendar for this month.",
        "Share the Avoid list with anyone else creating content for your brand.",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part II, Chapter 7 — Your Visual Identity System™
  // Colors classify each profile's real hex by hue family (computed, not
  // authored) rather than hand-writing 6 roles x 11 profiles of Why/
  // Emotion text that would drift from the actual color shown — Pairings
  // references the profile's own other roles by name, also computed.
  // Typography and the 9 aesthetic style categories are genuinely
  // per-profile content living in brand-haus-playbook-content.js.
  // ---------------------------------------------------------------------
  function renderColorRole(ui, role, hex, roleLabel, allColors) {
    var content = BrandHaus.playbookContent;
    var family = content.classifyHue(hex);
    var familyContent = content.HUE_FAMILY_CONTENT[family];
    var otherRoles = ["primary", "secondary", "neutral", "accent", "support", "standOut"]
      .filter(function (r) { return r !== role && allColors[r]; }).slice(0, 2);
    var pairingText = otherRoles.length
      ? "Pairs naturally with your " + otherRoles.map(function (r) { return BrandHaus.results.paletteRoleLabel(r) + " (" + allColors[r] + ")"; }).join(" and ") + "."
      : "This is your only defined color role — it's carrying the full weight of your palette on its own.";

    return ui.el("div", { class: "bh-chapter__tension-section" }, [
      ui.el("div", { class: "bh-palette-swatch" }, [
        ui.el("span", { class: "bh-palette-swatch__color", style: "background:" + hex + ";" }),
        ui.el("span", { class: "bh-palette-swatch__role", text: roleLabel }),
        ui.el("span", { class: "bh-palette-swatch__hex", text: hex }),
      ]),
      ui.el("p", { class: "bh-chapter__eyebrow bh-chapter__eyebrow--first", text: "Why" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: familyContent.why }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Emotion" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: familyContent.emotion }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Best Uses" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: content.ROLE_BEST_USES[role] }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Pairings" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: pairingText }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Things To Avoid" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: familyContent.avoid }),
    ]);
  }

  function renderFontSection(ui, label, fontName) {
    var content = BrandHaus.playbookContent;
    var entry = content.FONT_PLAYBOOK[fontName];
    if (!entry) return null;
    return ui.el("div", { class: "bh-chapter__tension-section" }, [
      BrandHaus.results.renderFontSample(ui, label, fontName),
      ui.el("p", { class: "bh-chapter__eyebrow bh-chapter__eyebrow--first", text: "Personality" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.personality }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Best Uses" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.bestUses }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Pairings" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.pairings }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Common Mistakes" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.commonMistakes }),
    ]);
  }

  // A condensed, hand-it-to-a-designer card — deliberately separate from
  // the full color-role/font walkthrough above it rather than replacing
  // any of it. "Do" and "Don't" reuse the same computed hue-classification
  // data as the full walkthrough (ROLE_BEST_USES, HUE_FAMILY_CONTENT) so
  // this stays in sync with it automatically rather than drifting as its
  // own hand-authored aside.
  function renderVisualQuickReference(ui, results) {
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var colors = profile.output.colors;
    var roleOrder = ["primary", "secondary", "neutral", "accent", "support", "standOut"];
    var swatches = roleOrder.filter(function (role) { return colors[role]; }).map(function (role) {
      return ui.el("div", { class: "bh-quickref__swatch" }, [
        ui.el("span", { class: "bh-quickref__swatch-color", style: "background:" + colors[role] + ";" }),
        ui.el("span", { class: "bh-quickref__swatch-hex", text: colors[role] }),
      ]);
    });
    var primaryFamily = content.classifyHue(colors.primary);
    var familyContent = content.HUE_FAMILY_CONTENT[primaryFamily];

    return ui.el("div", { class: "bh-quickref" }, [
      ui.el("p", { class: "bh-quickref__label" }, [ui.icon("copy"), ui.el("span", { text: "Quick Reference — Hand This To Any Designer" })]),
      ui.el("div", { class: "bh-quickref__swatches" }, swatches),
      ui.el("p", { class: "bh-quickref__fonts", text: "Heading: " + profile.output.headingFont + "  ·  Body: " + profile.output.bodyFont }),
      ui.el("p", { class: "bh-quickref__rule" }, [ui.el("strong", { text: "Do: " }), ui.el("span", { text: content.ROLE_BEST_USES.primary })]),
      ui.el("p", { class: "bh-quickref__rule" }, [ui.el("strong", { text: "Don't: " }), ui.el("span", { text: familyContent.avoid })]),
    ]);
  }

  function renderChapter7(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var colors = profile.output.colors;
    var roleOrder = ["primary", "secondary", "neutral", "accent", "support", "standOut"];
    var colorSections = roleOrder.filter(function (role) { return colors[role]; }).map(function (role) {
      return renderColorRole(ui, role, colors[role], r.paletteRoleLabel(role), colors);
    });

    var fontSections = [
      renderFontSection(ui, "Heading Font", profile.output.headingFont),
      renderFontSection(ui, "Body Font", profile.output.bodyFont),
      r.renderFontPairingsCard(ui, profile.output.headingFont, profile.output.bodyFont),
    ].filter(Boolean);

    var styleNotes = (content.PROFILE_PLAYBOOK[profile.name] || {}).styleNotes;
    var styleLabels = { graphicStyle: "Graphic Style", texture: "Texture", icons: "Icons", illustration: "Illustration", motion: "Motion", layout: "Layout", whitespace: "Whitespace", packaging: "Packaging", websiteFeel: "Website Feel" };
    var styleSection = styleNotes
      ? ui.el("div", { class: "bh-chapter__tension-section" }, Object.keys(styleLabels).reduce(function (acc, key) {
          acc.push(ui.el("p", { class: "bh-chapter__eyebrow", text: styleLabels[key] }));
          acc.push(ui.el("p", { class: "bh-chapter__foundation-line", text: styleNotes[key] }));
          return acc;
        }, []))
      : null;

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "palette", "Your Visual Identity System™", null, null, "Guide 8 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Your Color Palette" }),
    ].concat(colorSections).concat([
      ui.el("p", { class: "bh-chapter__section-title", text: "Your Typography" }),
    ]).concat(fontSections).concat([
      ui.el("p", { class: "bh-chapter__section-title", text: "Your Overall Aesthetic" }),
      styleSection,
      renderVisualQuickReference(ui, results),
      renderWhyThisMatters(ui, "A mood board is inspiration. A visual identity system is a set of rules — rules that let anyone (you, a designer, an AI tool) make something new that still looks unmistakably like your brand."),
      renderTakeAction(ui, [
        "Check your last 5 pieces of content against this palette and typography — flag anything that's drifted.",
        "Save this guide as a reference sheet for Branding Studio and Logo Studio.",
        "If you work with a designer or contractor, send them this guide before the next project starts.",
      ]),
    ].filter(Boolean)));
  }

  // ---------------------------------------------------------------------
  // Part II, Chapter 8 — Your Brand Foundation™
  // Why It Exists / How To Improve / Real-World Examples are generic,
  // authored once per foundation piece (brand-haus-playbook-content.js's
  // FOUNDATION_PLAYBOOK) since these explain what a mission/North Star/
  // promise/values ARE, not something personalized per profile. Decision
  // Filter is a template built from the founder's own actual text; How
  // Customers Experience It reuses Customer Impression™ data already
  // collected rather than repeating one paragraph four times.
  // ---------------------------------------------------------------------
  function renderFoundationPiece(ui, label, valueText, contentKey, decisionFilterText) {
    var entry = BrandHaus.playbookContent.FOUNDATION_PLAYBOOK[contentKey];
    return ui.el("div", { class: "bh-chapter__tension-section" }, [
      ui.el("p", { class: "bh-chapter__section-title", text: label }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: valueText }),
      ui.el("p", { class: "bh-chapter__eyebrow bh-chapter__eyebrow--first", text: "Why It Exists" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.whyItExists }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "How To Improve It" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.howToImprove }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Real-World Examples" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: entry.realWorldExamples }),
      ui.el("p", { class: "bh-chapter__eyebrow", text: "Decision Filter" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: decisionFilterText }),
    ]);
  }

  function renderChapter8(ui, results) {
    var r = BrandHaus.results;
    var profile = results.match.best.profile;
    var founderOutput = results.founderOutput;
    var values = founderOutput.values || [];
    var valuesJoined = values.join(", ");
    var valuesFilterList = values.length <= 2 ? values.join(" or ") : values.slice(0, -1).join(", ") + ", or " + values[values.length - 1];

    var pieces = [
      renderFoundationPiece(ui, "Mission Statement", founderOutput.missionStatement, "missionStatement", "Before finalizing a decision, ask: does this help you actually deliver on your mission? If not, it's probably not yours to say yes to."),
      renderFoundationPiece(ui, "Brand North Star", profile.output.northStar, "northStar", "Before finalizing a decision, ask: does this move you closer to “" + profile.output.northStar + "”? If it doesn't, it can probably wait."),
      renderFoundationPiece(ui, "Brand Promise", profile.output.promise, "promise", "Before finalizing a decision, ask: does this still let you deliver on “" + profile.output.promise + "”? If it puts that at risk, it's not worth it."),
      renderFoundationPiece(ui, "Core Values", valuesJoined, "coreValues", values.length ? "Before finalizing a decision, ask: would " + valuesFilterList + " tell you to say yes? If none of them would, that's your answer." : "Before finalizing a decision, ask whether it's consistent with the values you actually operate by, not just the ones that sound good."),
    ];

    var impressionItems = BrandHaus.brandDNA.describeCustomerImpression ? BrandHaus.brandDNA.describeCustomerImpression(results.customerImpression || {}) : [];
    var relationshipItem = impressionItems.filter(function (i) { return i.dimension === "relationship"; })[0];
    var howCustomersExperience = relationshipItem
      ? "Here's how this foundation actually lands with the people you serve: " + relationshipItem.description
      : "Your foundation is what customers feel even when they can't name it — it's the reason they trust you before you've said a word.";

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "logoMark", "Your Brand Foundation™", null, null, "Guide 9 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "These four pieces are the ones that should barely change, even as everything else about your brand evolves." }),
    ].concat(pieces).concat([
      ui.el("p", { class: "bh-chapter__section-title", text: "How Customers Experience It" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: howCustomersExperience }),
      renderWhyThisMatters(ui, "Long after you've forgotten the exact wording, your Mission, North Star, Promise, and Values are still doing their real job: filtering every decision so your brand stays consistent without you having to think about it."),
      renderTakeAction(ui, [
        "Put your Brand Promise somewhere you'll see it before every major decision.",
        "Test each Core Value against a real decision from this month — did it actually hold?",
        "Revisit this guide any time a decision feels genuinely hard to make.",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part III, Chapter 9 — Understanding Yourself
  // Natural Strengths and Blind Spots reuse the profile's own existing
  // output.strengths/blindSpots (already authored, already used in Your
  // Brand DNA's Chapter 5) rather than duplicating them. Communication
  // Style reuses Chapter 6's voice-derived entry instead of re-authoring
  // the same idea a second time under a different heading.
  // ---------------------------------------------------------------------
  function renderFieldPair(ui, label, text) {
    return ui.el("div", {}, [
      ui.el("p", { class: "bh-chapter__eyebrow", text: label }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: text }),
    ]);
  }

  function renderChapter9(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var traits = (content.PROFILE_PLAYBOOK[profile.name] || {}).traits;
    var expression = r.aggregateExpression(results.expressionSuggestions || [], profile);
    var voiceEntry = content.EXPRESSION_PLAYBOOK.voice[expression.voice];

    var fields = traits ? [
      ui.el("p", { class: "bh-chapter__section-title", text: "Superpowers" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: traits.superpower }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Leadership Style" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: traits.leadershipStyle }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Innovation Style" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: traits.innovationStyle }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Communication Style" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: (voiceEntry && voiceEntry.communicationStyle) || "You communicate best when the format matches the moment." }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Decision Style" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: traits.decisionStyle }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Working Style" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: traits.workingStyle }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Stress Style" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: traits.stressStyle }),
    ] : [];

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "person", "Understanding Yourself", null, null, "Guide 10 of 21"),
      ui.el("p", { class: "bh-chapter__highlight-line", text: "Your brand runs through you — how you naturally lead, decide, and work under pressure shows up in the business whether you plan for it or not." }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Natural Strengths" }),
      r.renderBulletList(ui, "bh-chapter__bullet-list", profile.output.strengths),
      ui.el("p", { class: "bh-chapter__section-title", text: "Potential Blind Spots" }),
      r.renderBulletList(ui, "bh-chapter__bullet-list", profile.output.blindSpots),
    ].concat(fields).concat([
      renderWhyThisMatters(ui, "At this stage, there's no meaningful line between you and your brand — they're the same thing. Knowing your own patterns is how you scale the business without losing what made it work in the first place."),
      renderTakeAction(ui, [
        "Pick one Blind Spot and name a specific safeguard for it — a checklist, a second opinion, a rule you follow every time.",
        "Share your Working Style with anyone you collaborate with regularly.",
        "Notice your Stress Style the next time you're under pressure — naming it in the moment helps.",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part III, Chapter 10 — Your Ideal Customer™
  // Weaves the founder's own typed audience description in when they
  // provided one, falling back to the profile's authored idealCustomer
  // sentence otherwise — same personalization-with-fallback discipline
  // as everything else in this document.
  // ---------------------------------------------------------------------
  function renderChapter10(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var ic = (content.PROFILE_PLAYBOOK[profile.name] || {}).idealCustomer;
    var audience = resolveAudienceOrGeneric(results);
    var typedAudience = (results.audienceDescription || "").trim();
    var intro = typedAudience
      ? "You told us you're building for " + audience + ". Here's how that shows up for someone with your Brand DNA."
      : "You didn't specify an audience when you took the Founder Interview™, so this guide reflects the customer your Brand DNA naturally attracts.";

    var fields = ic ? [
      renderFieldPair(ui, "Who They Are", ic.whoTheyAre),
      renderFieldPair(ui, "Who They Want To Become", ic.whoTheyWantToBecome),
      renderFieldPair(ui, "Dreams", ic.dreams),
      renderFieldPair(ui, "Frustrations", ic.frustrations),
      renderFieldPair(ui, "Buying Triggers", ic.buyingTriggers),
      renderFieldPair(ui, "Emotional Needs", ic.emotionalNeeds),
      renderFieldPair(ui, "Transformation", ic.transformation),
      renderFieldPair(ui, "What They Need To Hear", ic.whatTheyNeedToHear),
    ] : [ui.el("p", { class: "bh-chapter__foundation-line", text: profile.output.idealCustomer })];

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "people", "Your Ideal Customer™", null, null, "Guide 11 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: intro }),
    ].concat(fields).concat([
      renderWhyThisMatters(ui, "Every message you write gets sharper when you're writing to someone specific instead of everyone in general. This is who that someone is."),
      renderTakeAction(ui, [
        "Rewrite your homepage headline speaking directly to \"Who They Want To Become,\" not just what you sell.",
        "Use \"What They Need To Hear\" as the opening line of your next piece of content.",
        "Revisit this guide any time a campaign feels like it's falling flat — check whether it's actually speaking to this person.",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part III, Chapter 11 — How Customers Experience Your Brand™
  // Relationship Style and Emotional Experience reuse Customer
  // Impression™ data already collected (surfaced in Your Brand DNA's own
  // Chapter 6 and this Playbook's Chapter 6) rather than repeating the
  // same lookup under new field names — the other five fields are new.
  // ---------------------------------------------------------------------
  function renderChapter11(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var ce = (content.PROFILE_PLAYBOOK[profile.name] || {}).customerExperience;
    var impressionItems = BrandHaus.brandDNA.describeCustomerImpression ? BrandHaus.brandDNA.describeCustomerImpression(results.customerImpression || {}) : [];
    var relationshipItem = impressionItems.filter(function (i) { return i.dimension === "relationship"; })[0];
    var selfImage = results.customerImpression && results.customerImpression.selfImage;
    var emotionalExperience = content.EMOTIONAL_EXPERIENCE_BY_SELF_IMAGE[selfImage] || "Your customers want to feel like the experience was built specifically with them in mind.";

    var fields = ce ? [
      renderFieldPair(ui, "Trust Signals", ce.trustSignals),
      renderFieldPair(ui, "Why They Stay", ce.whyTheyStay),
      renderFieldPair(ui, "Why They Refer", ce.whyTheyRefer),
      renderFieldPair(ui, "What They'll Remember", ce.whatTheyllRemember),
      renderFieldPair(ui, "Customer Journey", ce.customerJourney),
    ] : [];

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "heart", "How Customers Experience Your Brand™", null, null, "Guide 12 of 21"),
      ui.el("p", { class: "bh-chapter__section-title", text: "Relationship Style" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: relationshipItem ? relationshipItem.description : "Your customers experience a relationship that's still taking shape as your brand matures." }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Emotional Experience" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: emotionalExperience }),
    ].concat(fields).concat([
      renderWhyThisMatters(ui, "Customers rarely remember what you said — they remember how being your customer made them feel. This guide is a map of that feeling, so you can build toward it on purpose."),
      renderTakeAction(ui, [
        "Ask 3 real customers what they'd say if a friend asked why they chose you — compare it to \"Why They Refer.\"",
        "Design one moment in your customer journey specifically around \"What They'll Remember.\"",
        "Audit your last week of customer touchpoints against \"Trust Signals\" — are they actually showing up?",
      ]),
    ]));
  }

  // ---------------------------------------------------------------------
  // Part IV, Chapter 13 — Your Brand In Action™
  // Deliberately excludes Packaging and Events from the original 20-
  // chapter outline — both assume a physical-product or in-person
  // business, which the assessment never asks about. Website/Email/Ads/
  // Social/Support apply to any business model, so those stay.
  // ---------------------------------------------------------------------
  function renderChapter13(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var bia = (content.PROFILE_PLAYBOOK[profile.name] || {}).brandInAction;
    if (!bia) {
      return ui.el("section", { class: "bh-chapter" }, [r.chapterHeading(ui, "person", "Your Brand In Action™", null, null, "Guide 14 of 21"), ui.el("p", { class: "bh-chapter__foundation-line", text: "Coming soon." })]);
    }

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "person", "Your Brand In Action™", null, null, "Guide 14 of 21"),
      ui.el("p", { class: "bh-chapter__highlight-line", text: "If your brand were a person, here's how they'd move through the world." }),
      ui.el("p", { class: "bh-chapter__section-title", text: "As A Person" }),
      renderFieldPair(ui, "How They Dress", bia.dress),
      renderFieldPair(ui, "How They Speak", bia.speak),
      renderFieldPair(ui, "How They Lead", bia.lead),
      renderFieldPair(ui, "How They Solve Problems", bia.solveProblems),
      renderFieldPair(ui, "How They Celebrate", bia.celebrate),
      renderFieldPair(ui, "How They Handle Criticism", bia.handleCriticism),
      ui.el("p", { class: "bh-chapter__section-title", text: "Everywhere That Shows Up" }),
      renderFieldPair(ui, "Website", bia.website),
      renderFieldPair(ui, "Email", bia.email),
      renderFieldPair(ui, "Ads", bia.ads),
      renderFieldPair(ui, "Social", bia.social),
      renderFieldPair(ui, "Support", bia.support),
      renderWhyThisMatters(ui, "Every one of these is a small, repeated decision. Made consistently, they're what makes a brand instantly recognizable — even with the logo covered up."),
      renderTakeAction(ui, [
        "Pick the channel where you're least consistent with this description and fix one thing about it this week.",
        "Read \"How They Handle Criticism\" before your next hard conversation with a customer.",
        "Share this guide with anyone who writes or designs on your behalf.",
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part IV, Chapter 14 — Creative Direction™
  // Deliberately shallow and generic on execution — routes founders to
  // Branding Studio, Logo Studio, and Frank (The Idea Haus's Creative
  // Director) for the parts that benefit from real creative back-and-
  // forth, rather than pretending to hand-author a logo direction this
  // assessment has no way to actually judge.
  // ---------------------------------------------------------------------
  function renderChapter14(ui) {
    var r = BrandHaus.results;
    var cd = BrandHaus.playbookContent.CREATIVE_DIRECTION_PLAYBOOK;

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "logoMark", "Creative Direction™", null, null, "Guide 15 of 21"),
      ui.el("p", { class: "bh-chapter__highlight-line", text: "These are general principles of good creative execution — true regardless of your specific Brand DNA, and worth knowing before you brief anyone (including yourself) on real design work." }),
      renderFieldPair(ui, "Logo Principles", cd.logoPrinciples),
      renderFieldPair(ui, "Symbols", cd.symbols),
      renderFieldPair(ui, "Composition", cd.composition),
      renderFieldPair(ui, "Icon Style", cd.iconStyle),
      renderFieldPair(ui, "Illustration", cd.illustration),
      renderFieldPair(ui, "Photography", cd.photography),
      renderFieldPair(ui, "Animation", cd.animation),
      renderFieldPair(ui, "Presentation Decks", cd.presentationDecks),
      ui.el("p", { class: "bh-chapter__section-title", text: "Everywhere Else Your Brand Shows Up" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Presentation decks, merch, trade show booths, retail displays — wherever your brand physically shows up, the same rule applies: make it unmistakably, undeniably yours. If someone saw it out of context, with no logo in sight, could they still tell it was you? If not, it needs more of your brand in it, not less." }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Bring In Real Creative Help" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "You don't have to execute any of this alone. Branding Studio and Logo Studio turn everything in this Playbook into real, usable assets — palettes, typography, and logo concepts generated directly from your Brand DNA. If you want a second creative opinion or help pushing a logo direction further, Frank — The Idea Haus's Creative Director — is built exactly for that kind of back-and-forth." }),
      ui.el("p", { class: "bh-chapter__eyebrow bh-chapter__eyebrow--first", text: "One Thing To Know" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Logo files generated through AI tools (including Frank) often need to be upscaled or vectorized with separate software before they're ready for real-world use like print or signage — build that step into your process, not as an afterthought." }),
      renderWhyThisMatters(ui, "Consistency beats talent here. A founder who applies these principles patiently will out-brand a more \"talented\" one who applies them randomly."),
      renderTakeAction(ui, [
        "Open Logo Studio and generate a first logo concept using this Playbook's palette and typography.",
        "If you want a second opinion, take your logo direction to Frank for feedback before finalizing it.",
        "Audit one existing piece of creative — a deck, a display, a mockup — against \"Everywhere Else Your Brand Shows Up.\"",
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part IV, Chapter 16 — Decision Guide™
  // ---------------------------------------------------------------------
  function renderChapter16(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var dg = (content.PROFILE_PLAYBOOK[profile.name] || {}).decisionGuide;
    if (!dg) {
      return ui.el("section", { class: "bh-chapter" }, [r.chapterHeading(ui, "shield", "Decision Guide™", null, null, "Guide 17 of 21"), ui.el("p", { class: "bh-chapter__foundation-line", text: "Coming soon." })]);
    }

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "shield", "Decision Guide™", null, null, "Guide 17 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "A quick-reference for the moments that don't have an obvious answer." }),
      renderFieldPair(ui, "You're At Your Best When...", dg.atYourBest),
      renderFieldPair(ui, "Watch Out For...", dg.watchOutFor),
      renderFieldPair(ui, "Slow Down When...", dg.slowDownWhen),
      renderFieldPair(ui, "Trust Yourself When...", dg.trustYourselfWhen),
      renderFieldPair(ui, "Where You'll Need Help", dg.whereYoullNeedHelp),
      renderFieldPair(ui, "What To Delegate", dg.whatToDelegate),
      renderFieldPair(ui, "Growth Habits", dg.growthHabits),
      renderWhyThisMatters(ui, "You can't outsource judgment, but you can build a system around your own patterns — this guide is that system, so you're not re-deriving it under pressure every single time."),
      renderTakeAction(ui, [
        "Pick one thing from \"What To Delegate\" and actually hand it off this month.",
        "Print or save \"Watch Out For\" somewhere you'll see it before a high-stakes decision.",
        "Pick one Growth Habit and commit to it for the next 30 days.",
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part V, Chapter 17 — Brand Evolution™
  // The 4 fields are generic/philosophical by design (no literal Year One
  // / Year Two-Three predictions — a 30-question assessment can't forecast
  // a founder's actual timeline). "How Supporting Identities Can Grow" is
  // the one dynamic piece, built from the same computeConfidence() data
  // already used in Chapter 2, not authored separately.
  // ---------------------------------------------------------------------
  function renderChapter17(ui, results) {
    var r = BrandHaus.results;
    var brandDNA = BrandHaus.brandDNA;
    var content = BrandHaus.playbookContent.BRAND_EVOLUTION_PLAYBOOK;
    var confidence = brandDNA.computeConfidence(results.match.ranked);
    var influence = confidence.influences[0];
    var supportingText = influence
      ? influence.profile.name + " currently shows up as a supporting influence in your Brand DNA (" + influence.sharePct + "%). " + influence.profile.output.influenceBlurb + " As your business grows, don't be surprised if this identity grows louder — many founders find a supporting identity becomes more prominent as they expand into new offers, audiences, or seasons of the business."
      : "Right now, your Brand DNA points clearly and consistently in one direction, without a strong secondary influence pulling at it. That clarity is a strength today — and if a second identity ever does emerge as you grow, revisiting the Founder Interview™ is exactly how you'd find it.";

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "refresh", "Brand Evolution™", null, null, "Guide 18 of 21"),
      ui.el("p", { class: "bh-chapter__highlight-line", text: "This Playbook is a snapshot of where your brand is today — not a ceiling on where it can go." }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Look Past Today" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: content.lookPastToday }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Build Toward Your Vision" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: content.buildTowardVision }),
      ui.el("p", { class: "bh-chapter__section-title", text: "Expect It To Evolve" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: content.expectItToEvolve }),
      ui.el("p", { class: "bh-chapter__section-title", text: "How Supporting Identities Can Grow" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: supportingText }),
      ui.el("p", { class: "bh-chapter__section-title", text: "When We Can Help" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: content.whenWeCanHelp }),
      renderWhyThisMatters(ui, "A brand that never evolves isn't stable — it's stuck. The goal isn't to lock in who you are today, it's to keep growing in a way that still feels unmistakably like you."),
      renderTakeAction(ui, [
        "Put a reminder on your calendar to revisit this Blueprint in 6-12 months.",
        "If your business changes direction, retake the Founder Interview™ and compare the results.",
        "Notice if a Supporting Influence starts showing up more in how you run things — it might be time to let it in on purpose.",
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part V, Chapter 18 — Your Brand Decision Filter™
  // A template, not authored content — built entirely from the founder's
  // own Mission, North Star, Promise, Values, and audience, same fields
  // already surfaced in Chapter 8 and Chapter 10, assembled here into one
  // fast pre-decision checklist.
  // ---------------------------------------------------------------------
  function renderChapter18(ui, results) {
    var r = BrandHaus.results;
    var profile = results.match.best.profile;
    var founderOutput = results.founderOutput;
    var values = founderOutput.values || [];
    var valuesJoined = values.length <= 2 ? values.join(" or ") : values.slice(0, -1).join(", ") + ", or " + values[values.length - 1];
    var audience = resolveAudienceOrGeneric(results);

    var questions = [
      'Does this align with your mission: "' + founderOutput.missionStatement + '"?',
      'Does this move you toward your Brand North Star: "' + profile.output.northStar + '"?',
      'Does this protect your Brand Promise: "' + profile.output.promise + '"?',
      values.length ? "Would " + valuesJoined + " say yes to this?" : "Is this consistent with the values you actually operate by, not just the ones that sound good?",
      "Does this genuinely serve " + audience + "?",
    ];

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "eye", "Your Brand Decision Filter™", null, null, "Guide 19 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Not every decision needs a strategy session. Most just need five honest questions, asked in order, built from your own words." }),
      r.renderBulletList(ui, "bh-chapter__bullet-list", questions),
      ui.el("p", { class: "bh-chapter__eyebrow bh-chapter__eyebrow--first", text: "How To Use It" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "If you can answer yes to all five, move forward with confidence. If you can't, that's not automatically a no — but it's worth slowing down until you know why." }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Simple. Powerful." }),
      renderWhyThisMatters(ui, "Founders don't usually make bad decisions because they lack judgment — they make them because they're deciding fast, alone, with nothing to check against. This filter is that check."),
      renderTakeAction(ui, [
        "Save this page somewhere you can open it in under 10 seconds.",
        "Run your next hard decision through all five questions before you commit.",
        "Teach this filter to anyone else who makes decisions on your brand's behalf.",
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part V, Chapter 19 — Your Brand Constitution™
  // 10 per-profile imperative principles (brand-haus-playbook-content.js's
  // PROFILE_PLAYBOOK[profile.name].constitution) — the closest thing in
  // this Playbook to a literal, quotable "rules we operate by" document.
  // ---------------------------------------------------------------------
  function renderChapter19(ui, results) {
    var r = BrandHaus.results;
    var content = BrandHaus.playbookContent;
    var profile = results.match.best.profile;
    var principles = (content.PROFILE_PLAYBOOK[profile.name] || {}).constitution || [];

    return ui.el("section", { class: "bh-chapter" }, [
      r.chapterHeading(ui, "document", "Your Brand Constitution™", null, null, "Guide 20 of 21"),
      ui.el("p", { class: "bh-chapter__highlight-line", text: "Ten principles, built for how you actually operate. These aren't aspirational — they're the rules worth holding yourself to on your hardest day, not just your best one." }),
      r.renderBulletList(ui, "bh-chapter__bullet-list", principles),
      renderWhyThisMatters(ui, "A mission statement tells people what you're for. A constitution tells you — specifically, personally — how to act when it's inconvenient to."),
      renderTakeAction(ui, [
        "Pick the one principle you're most likely to break under pressure, and name why in advance.",
        "Post this list somewhere your team (even a team of one) will actually see it.",
        "Revisit this guide any time a decision tests what you actually stand for.",
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Part V, Chapter 20 — Next Steps
  // Closes the Playbook by pointing back into the app itself (Branding
  // Studio / Logo Studio, same setActiveStep("brandingStudio") pattern
  // already used by Your Brand DNA's own Chapter 6 CTA) plus the same
  // cross-Haus destinations already used in snippets/haus-links.liquid —
  // no new URLs invented here.
  // ---------------------------------------------------------------------
  function renderChapter20(ui, results) {
    var r = BrandHaus.results;
    var profile = results.match.best.profile;
    var firstName = (results.firstName || "").trim();
    var businessName = (results.businessName || "").trim();
    var businessSubject = businessName || "your brand";

    var continueBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal" }, [ui.icon("palette"), ui.el("span", { text: "Go to Branding Studio & Logo Studio" })]);
    continueBtn.addEventListener("click", function () {
      BrandHaus.ui.setActiveStep("brandingStudio");
    });

    var children = [
      r.chapterHeading(ui, "lightning", "Next Steps", null, null, "Guide 21 of 21"),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "You've made it through your " + profile.name + " Playbook™. Here's where to take it from here." }),
      r.renderRememberCallout(ui),
      ui.el("p", { class: "bh-chapter__section-title", text: "Put It Into Action" }),
      ui.el("p", { class: "bh-chapter__highlight-line", text: "Every color, font, and creative imprint crafted for " + businessSubject + " is already waiting inside the Brand Studio and Logo Studio. This is where strategy becomes something people can actually see." }),
      continueBtn,
      ui.el("p", { class: "bh-chapter__section-title", text: "Explore The Rest Of Black Sheep" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Because " + businessSubject + " now has a defined Brand DNA, every other Haus tool starts from the same foundation. No starting over. No guessing. Just one consistent identity across everything you create." }),
      ui.el("ul", { class: "bh-chapter__bullet-list" }, [
        ui.el("li", {}, [ui.el("a", { href: "/pages/marketing-haus", target: "_blank", rel: "noopener", text: "Marketing Haus" }), ui.el("span", { text: " — turn your Brand DNA into ads, emails, and social content." })]),
        ui.el("li", {}, [ui.el("a", { href: "/pages/content-haus", target: "_blank", rel: "noopener", text: "Content Haus" }), ui.el("span", { text: " — build out prompts and creative content on-brand." })]),
        ui.el("li", {}, [ui.el("a", { href: "https://chatgpt.com/g/g-6a489ad05ac48191a7692939b09fc6f1-the-idea-haus", target: "_blank", rel: "noopener", text: "The Idea Haus" }), ui.el("span", { text: " — brainstorm with Frank, your Creative Director, on logo direction and beyond." })]),
      ]),
      ui.el("p", { class: "bh-chapter__section-title", text: "Save This, Come Back Often" }),
      ui.el("p", { class: "bh-chapter__foundation-line", text: "Brands aren't built and perfected in a weekend. Keep this Playbook close. Come back before your next logo change, website redesign, product launch, or marketing campaign. The best founders revisit their strategy far more often than they reinvent it." }),
      renderWhyThisMatters(ui, "A Brand Playbook that sits unread does nothing. The strongest brands aren't the ones with the best ideas. They're the ones disciplined enough to stay true to them."),
      renderTakeAction(ui, [
        "Export this Playbook and save it somewhere you'll actually find it again.",
        "Open Branding Studio this week and generate at least one real asset.",
        "Share this Playbook with anyone who represents your brand — a co-founder, a contractor, a new hire.",
      ]),
    ];

    var builtForBlock = renderBuiltForBlock(ui, results);
    if (builtForBlock) children.push(builtForBlock);

    return ui.el("section", { class: "bh-chapter" }, children);
  }

  // A small closing credit block, not a full page of its own — only shows
  // whatever the founder actually gave (name/business name are both
  // optional; a founder who left both blank still gets the completion
  // date alone rather than the block vanishing entirely). "Founder of X"
  // specifically gets dropped rather than falling back to generic filler
  // text when businessName is blank — a credit line reads worse with a
  // placeholder in it than it does without that line at all.
  function renderBuiltForBlock(ui, results) {
    var firstName = (results.firstName || "").trim();
    var businessName = (results.businessName || "").trim();
    var completedDate = null;
    if (results.completedAt) {
      var parsed = new Date(results.completedAt);
      if (!isNaN(parsed.getTime())) {
        completedDate = parsed.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
      }
    }
    if (!firstName && !businessName && !completedDate) return null;

    var lines = [ui.el("p", { class: "bh-chapter__built-for-label", text: "Built For" })];
    if (firstName) lines.push(ui.el("p", { class: "bh-chapter__built-for-name", text: firstName }));
    if (businessName) lines.push(ui.el("p", { class: "bh-chapter__built-for-role", text: "Founder of " + businessName }));
    if (completedDate) lines.push(ui.el("p", { class: "bh-chapter__built-for-date", text: "Completed on " + completedDate }));
    return ui.el("div", { class: "bh-chapter__built-for" }, lines);
  }

  // ---------------------------------------------------------------------
  // renderFull — assembles all 5 Parts / 21 chapters into one document
  // ---------------------------------------------------------------------
  // Single source of truth for both the rendered chapter order AND the
  // table of contents below — the numbers deliberately skip 13 and 16
  // (Competitive Edge and Business Strategy, cut during scoping since
  // both would require assuming what the founder's business sells; these
  // two slots shifted from their original 12/15 once Core Motivations
  // was inserted as a real new guide ahead of them).
  //
  // Order below is deliberately NOT "insert Core Motivations and leave
  // everything else in its original relative order" — Founder DNA moved
  // up to sit directly after Core Motivations (same underlying data, one
  // raw/ranked, one grouped into clusters — they belong back to back),
  // and Brand Psychology/Tensions moved down to sit directly before The
  // Story Hidden In Your Answers (which is itself built entirely from
  // the tension data, so it reads better immediately following it). The
  // result: Part I now reads as two clean pairs — "why you build"
  // (Identity, Core Motivations, Founder DNA) then "how you decide"
  // (Brand Psychology, The Story) — rather than interleaving the two.
  //
  // renderChapterN function names intentionally still match each
  // chapter's ORIGINAL number, not its current displayed position below
  // (e.g. renderChapter3 is Brand Psychology, now displayed as Guide 5) —
  // renaming ~18 functions and every call site to stay in lockstep with
  // the displayed number would be pure churn with no functional benefit,
  // since num/order here (not the function name) is what actually
  // controls both the TOC and the render sequence.
  function playbookParts(ui, effectiveResults) {
    return [
      { roman: "I", title: "Understanding Your Brand", subtitle: "What the assessment discovered", chapters: [
        { id: "ch1", num: 1, title: "Welcome", render: function () { return renderChapter1(ui, effectiveResults); } },
        { id: "ch2", num: 2, title: "Meet Your Brand DNA™", render: function () { return renderChapter2(ui, effectiveResults); } },
        { id: "ch-motivations", num: 3, title: "Your Core Motivations™", render: function () { return renderCoreMotivationsChapter(ui, effectiveResults); } },
        { id: "ch4", num: 4, title: "Your Founder DNA™", render: function () { return renderChapter4(ui, effectiveResults); } },
        { id: "ch3", num: 5, title: "Understanding Your Brand Psychology™", render: function () { return renderChapter3(ui, effectiveResults); } },
        { id: "ch5", num: 6, title: "The Story Hidden In Your Answers™", render: function () { return renderChapter5(ui, effectiveResults); } },
      ] },
      { roman: "II", title: "Building Your Brand", subtitle: "Turning identity into design", chapters: [
        { id: "ch6", num: 7, title: "How Your Brand Naturally Expresses Itself", render: function () { return renderChapter6(ui, effectiveResults); } },
        { id: "ch7", num: 8, title: "Your Visual Identity System™", render: function () { return renderChapter7(ui, effectiveResults); } },
        { id: "ch8", num: 9, title: "Your Brand Foundation™", render: function () { return renderChapter8(ui, effectiveResults); } },
      ] },
      { roman: "III", title: "Bringing Your Brand To Life", subtitle: "This is where it becomes a Playbook", chapters: [
        { id: "ch9", num: 10, title: "Understanding Yourself", render: function () { return renderChapter9(ui, effectiveResults); } },
        { id: "ch10", num: 11, title: "Your Ideal Customer™", render: function () { return renderChapter10(ui, effectiveResults); } },
        { id: "ch11", num: 12, title: "How Customers Experience Your Brand™", render: function () { return renderChapter11(ui, effectiveResults); } },
      ] },
      { roman: "IV", title: "Operating Your Brand", subtitle: "The business manual", chapters: [
        { id: "ch13", num: 14, title: "Your Brand In Action™", render: function () { return renderChapter13(ui, effectiveResults); } },
        { id: "ch14", num: 15, title: "Creative Direction™", render: function () { return renderChapter14(ui); } },
        { id: "ch16", num: 17, title: "Decision Guide™", render: function () { return renderChapter16(ui, effectiveResults); } },
      ] },
      { roman: "V", title: "Long-Term Growth", subtitle: null, chapters: [
        { id: "ch17", num: 18, title: "Brand Evolution™", render: function () { return renderChapter17(ui, effectiveResults); } },
        { id: "ch18", num: 19, title: "Your Brand Decision Filter™", render: function () { return renderChapter18(ui, effectiveResults); } },
        { id: "ch19", num: 20, title: "Your Brand Constitution™", render: function () { return renderChapter19(ui, effectiveResults); } },
        { id: "ch20", num: 21, title: "Next Steps", render: function () { return renderChapter20(ui, effectiveResults); } },
      ] },
    ];
  }

  function renderTableOfContents(ui, parts) {
    var partEls = parts.map(function (part) {
      var items = part.chapters.map(function (ch) {
        return ui.el("li", {}, [ui.el("a", { href: "#bh-playbook-" + ch.id, text: "Guide " + ch.num + " — " + ch.title })]);
      });
      return ui.el("div", { class: "bh-playbook__toc-part" }, [
        ui.el("p", { class: "bh-playbook__toc-part-title", text: "Part " + part.roman + " — " + part.title }),
        ui.el("ul", { class: "bh-playbook__toc-list" }, items),
      ]);
    });
    return ui.el("nav", { class: "bh-playbook__toc", "aria-label": "Playbook table of contents" }, [
      ui.el("p", { class: "bh-playbook__toc-heading" }, [ui.icon("layers"), ui.el("span", { text: "Table Of Contents" })]),
      ui.el("div", { class: "bh-playbook__toc-grid" }, partEls),
    ]);
  }

  function renderFull(ui, effectiveResults) {
    var profile = effectiveResults.match.best.profile;
    var parts = playbookParts(ui, effectiveResults);

    var chapters = [renderTableOfContents(ui, parts)];
    parts.forEach(function (part) {
      chapters.push(renderPartDivider(ui, part.roman, part.title, part.subtitle));
      part.chapters.forEach(function (ch) {
        chapters.push(ui.el("div", { id: "bh-playbook-" + ch.id }, [ch.render()]));
      });
    });

    var content = ui.el("div", { class: "bh-blueprint__print-chapters" }, chapters);

    // Deliberately "Your Brand Playbook™", not "Your [Profile] Playbook™" —
    // the matched profile name already appears one line below on the print
    // cover (and throughout the document itself), so folding it into the
    // title too just reads as a stutter rather than added personalization.
    var exportBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal bh-btn--small" }, [ui.icon("document"), ui.el("span", { text: "Export Playbook" })]);
    exportBtn.addEventListener("click", function () {
      BrandHaus.ui.printStyledSection(content, BrandHaus.results.accentStyleFor(profile), "Your Brand Playbook™ — Curated by Black Sheep Creations", profile, "epic", effectiveResults.businessName);
    });

    var exportHint = ui.el("p", { class: "bh-blueprint__export-hint", text: 'This opens your browser\'s print dialog — choose "Save as PDF" as the destination to download a PDF instead of printing.' });

    return {
      title: "Your Brand Playbook™",
      subtitle: "Build With Confidence",
      description: "Use your Brand DNA as the foundation for every future decision.",
      exportBtn: exportBtn,
      exportHint: exportHint,
      content: content,
    };
  }

  BrandHaus.playbook = {
    renderFull: renderFull,
    renderWhyThisMatters: renderWhyThisMatters,
    renderTakeAction: renderTakeAction,
    resolveAudienceOrGeneric: resolveAudienceOrGeneric,
    resolveProblemOrGeneric: resolveProblemOrGeneric,
  };
})();
