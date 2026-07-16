/**
 * The AI Creator's Brand Haus — Brand DNA Assessment (Founder Interview™)
 * Depends on brand-haus-branddna.js (the scoring engine — must load
 * first), brand-haus-identity.js, brand-haus-branding.js (the
 * Apply action writes into it), and brand-haus-ui.js's exposed
 * BrandHaus.ui helpers.
 *
 * Presentation layer only — every weight, profile, and fragment lives in
 * brand-haus-branddna.js per docs/brand-dna-framework.md. This file
 * just asks the 30 questions one at a time, shows the results, and
 * offers to apply them to Branding Studio. Question/option TEXT lives
 * here (not in the engine file) since the engine is pure data+scoring —
 * IDs and option keys below must stay in sync with that file's 30
 * entries or scoring will silently no-op for a question. Questions
 * 21-29 are the Customer Impression™ layer (Self-Image, Reflection,
 * Relationship, Differentiation) added to close the gap against
 * Kapferer's Relationship/Reflection/Self-Image facets — Q30 is the
 * original signature closing question (formerly Q21), moved rather
 * than rewritten so it stays the last thing a founder answers.
 *
 * Special-cased in brand-haus-ui.js's renderAppContent (renders full
 * width via renderFull(), not the standard field-panel/preview/vault
 * layout) since this produces a diagnosis, not a copy-paste prompt.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var QUESTION_TEXT = [
    { id: 1, text: "Pick the space that feels most like your brand.", options: { A: "Minimalist art gallery", B: "Cozy cabin", C: "Lively street market", D: "Sleek modern office" } },
    { id: 2, lead: "Imagine your business closed its doors forever, five years from now.", text: "What would hurt the most about seeing it disappear?", options: { A: "The people I helped would lose something meaningful", B: "The creativity and ideas would disappear", C: "The community we built would no longer exist", D: "The standard of quality we set would be gone", E: "I'd regret never reaching the impact I knew was possible" } },
    { id: 3, text: "If your brand were a color palette...", options: { A: "Deep jewel tones", B: "Warm earthy neutrals", C: "Bright, punchy colors", D: "Black, white, and one bold accent" } },
    { id: 4, lead: "You win the lottery tomorrow. You never have to work again.", text: "Do you still build this business?", options: { A: "Absolutely, this is my purpose", B: "Yes, but I'd slow down", C: "Maybe — I love creating more than running a business", D: "Probably not" } },
    { id: 5, text: "Pick the photography style that feels most \"you.\"", options: { A: "Bright, candid, energetic", B: "Soft, warm natural light", C: "Moody and dramatic", D: "Clean and minimal" } },
    { id: 6, text: "When your customers describe you to a friend, what do you secretly hope they say?", options: { A: "They changed my life", B: "They're unbelievably talented", C: "I've never trusted anyone more", D: "Everything they touch is beautiful", E: "They're just genuinely good people" } },
    { id: 7, text: "Which pace best describes your brand?", options: { A: "Calm and steady", B: "Fast-paced and exciting", C: "Deliberate and precise", D: "Playful and spontaneous" } },
    { id: 8, text: "Which failure would hurt you the most?", options: { A: "Creating something nobody remembers", B: "Letting down the people who trusted me", C: "Never reaching my full potential", D: "Becoming just another business", E: "Sacrificing my values for success" } },
    { id: 9, text: "What should your brand voice sound like?", options: { A: "Trusted friend", B: "Confident expert", C: "Witty best friend", D: "Luxury concierge" } },
    { id: 10, text: "Which compliment would stay with you forever?", options: { A: "You gave me hope", B: "You made me believe in myself", C: "You created something unforgettable", D: "You built something that will outlive you", E: "You never compromised who you were" } },
    { id: 11, text: "What's your relationship with tradition?", options: { A: "Respect craftsmanship", B: "Break the mold", C: "Use what works", D: "Follow my heart" } },
    { id: 12, lead: "Imagine your customers sitting around a campfire after you've gone home.", text: "What do you hope they're saying?", options: { A: "I've never felt more understood", B: "They're changing the game", C: "Everything they create is beautiful", D: "I wish every company cared this much", E: "I can't wait to see what they do next" } },
    { id: 13, text: "What matters most in how your brand looks?", options: { A: "Timeless", B: "Cutting edge", C: "Warm and approachable", D: "Polished and elevated" } },
    { id: 14, text: "Which sentence scares you the most?", options: { A: "I lived safely", B: "I blended in", C: "I never made a difference", D: "I disappointed people", E: "I never became who I was capable of becoming" } },
    { id: 15, text: "Which matters more?", options: { A: "Standing out", B: "Belonging", C: "Staying true to myself", D: "Being respected" } },
    { id: 16, text: "Finish this sentence. Success means...", options: { A: "Freedom", B: "Helping people", C: "Making my family proud", D: "Becoming known for excellence", E: "Leaving the world better than I found it" } },
    { id: 17, text: "If your brand had a soundtrack...", options: { A: "Acoustic", B: "Upbeat pop", C: "Cinematic", D: "Jazz/classical" } },
    { id: 18, lead: "A decision promises rapid growth, but it challenges one of your core values.", text: "Which response feels most natural?", options: { A: "My values come first", B: "I'd look for another path", C: "I'd weigh the long-term impact carefully", D: "It depends on what value is being challenged", E: "If it serves the greater mission, I'd consider it" } },
    { id: 19, text: "What energy should every customer interaction leave behind?", options: { A: "Calm", B: "Excited", C: "Efficient", D: "Personally connected" } },
    { id: 20, text: "Pick one word that describes the future of your brand.", options: { A: "Timeless", B: "Beloved", C: "Iconic", D: "Elevated" } },
    { id: 21, text: "When someone finishes using what you make, what do you most want them to feel about themselves?", options: { A: "Capable — like they can handle more than they thought", B: "Cared for — like someone finally gets them", C: "Bold — like they took a risk and it paid off", D: "Refined — like they have great taste", E: "Grounded — like they're exactly who they're supposed to be" } },
    { id: 22, text: "If your customer could only keep one feeling from working with you, what would you want it to be?", options: { A: "Confidence", B: "Relief", C: "Excitement", D: "Pride", E: "Peace" } },
    { id: 23, lead: "Picture your ideal customer a week after buying from you.", text: "What's different about how they see themselves?", options: { A: "They believe they're capable of more", B: "They feel understood for the first time", C: "They feel like they took a bold step forward", D: "They feel like they finally have something that matches their taste", E: "They feel more like themselves, not less" } },
    { id: 24, text: "When someone sees your customer using what you make, what do you want them to think?", options: { A: "\"They know something the rest of us don't\"", B: "\"They really have their life together\"", C: "\"They're not afraid to stand out\"", D: "\"They have impeccable taste\"", E: "\"They're part of something bigger than themselves\"" } },
    { id: 25, text: "What kind of person do you want to be visibly associated with your brand?", options: { A: "The quiet expert everyone trusts", B: "The one who has it together", C: "The trailblazer nobody expected", D: "The person with taste everyone envies", E: "The connector who brings people in" } },
    { id: 26, text: "If your brand were a person in your customer's life, who would it be?", options: { A: "The trusted mentor who's seen it all", B: "The best friend who always shows up", C: "The expert they hire because they don't do it themselves", D: "The indulgence they save up for", E: "The tool they reach for without thinking twice" } },
    { id: 27, text: "What do you want your customer to feel when they think of reaching out to you?", options: { A: "\"They'll guide me\"", B: "\"They'll get me\"", C: "\"They know more than I do about this\"", D: "\"This is my treat\"", E: "\"This just works, every time\"" } },
    { id: 28, text: "If a competitor copied your product or service exactly, what would still be different?", options: { A: "The way we treat people", B: "The story behind why we started", C: "The taste and point of view we bring", D: "The standard we hold ourselves to", E: "The community we've built" } },
    { id: 29, lead: "Imagine your closest competitor.", text: "What's the one thing you refuse to do the way they do it?", options: { A: "Cut corners to move faster", B: "Treat customers like transactions instead of people", C: "Follow trends instead of our own point of view", D: "Sacrifice our values for growth", E: "Build alone instead of building community" } },
    { id: 30, lead: "Imagine someone is telling the story of your business twenty years from now.", text: "What do you hope they remember most?", options: { A: "The lives we changed", B: "The courage to do things differently", C: "The community we built together", D: "The standard of excellence we refused to compromise", E: "That we stayed true to who we were from beginning to end" } },
  ];

  function buildInitialState() {
    return {
      step: "intro", // "intro" | "question" | "results"
      firstName: "",
      businessName: "",
      problemStatement: "",
      audienceDescription: "",
      currentIndex: 0,
      furthestIndex: 0, // highest currentIndex ever reached — lets Back+forward re-visit answered questions without forcing a re-click through everything
      answers: {}, // questionId -> optionKey
      results: null,
      // Gates whether "results" shows the one-time celebration screen or
      // the plain "already completed" revisit card — see renderFull().
      celebrationDismissed: false,
    };
  }

  var store = BrandHaus.util.createStore(buildInitialState());

  // Returns true when this answer just completed the assessment, so the
  // caller can explicitly navigate to the results step — this is a
  // one-time transition, not something the shell should re-check on
  // every render (that reactive-redirect approach is what caused
  // re-visiting "The Conversation" after finishing to bounce straight
  // back to old results instead of ever showing fresh questions).
  function selectAnswer(questionId, optionKey) {
    var state = store.getState();
    var answers = Object.assign({}, state.answers);
    answers[questionId] = optionKey;
    if (state.currentIndex < QUESTION_TEXT.length - 1) {
      var nextIndex = state.currentIndex + 1;
      store.setState({ answers: answers, currentIndex: nextIndex, furthestIndex: Math.max(state.furthestIndex, nextIndex) });
      return false;
    }
    store.setState({ answers: answers });
    finish();
    return true;
  }

  function goBack() {
    var state = store.getState();
    if (state.currentIndex > 0) store.setState({ currentIndex: state.currentIndex - 1 });
    else store.setState({ step: "intro" });
  }

  // Pure navigation, no new answer required — only valid when re-visiting
  // ground already covered (currentIndex < furthestIndex), since going
  // past furthestIndex without an answer would leave a gap in `answers`.
  function goForward() {
    var state = store.getState();
    if (state.currentIndex < state.furthestIndex) {
      store.setState({ currentIndex: state.currentIndex + 1 });
    }
  }

  function startInterview(firstName, businessName, problemStatement, audienceDescription) {
    store.setState({
      step: "question", currentIndex: 0, furthestIndex: 0, answers: {}, results: null,
      firstName: firstName, businessName: businessName,
      problemStatement: problemStatement, audienceDescription: audienceDescription,
    });
  }

  function finish() {
    var state = store.getState();
    var selections = Object.keys(state.answers).map(function (qid) {
      return { questionId: parseInt(qid, 10), optionKey: state.answers[qid] };
    });
    var engine = BrandHaus.brandDNA;
    var scored = engine.scoreAnswers(selections);
    var match = engine.matchProfile(scored.tensionFingerprint);
    // Personalize colors/typography using this founder's own Supporting
    // Influence, computed once here so every downstream reader of
    // results.match.best.profile (Blueprint, Playbook, Branding Studio,
    // Brand Kit, etc.) gets it automatically without each needing its own
    // edit. match.ranked (and secondBest) stay pointed at the true,
    // unblended profiles — only .best gets the personalized clone, so
    // Influences math (which needs real distances) stays accurate.
    var earlyConfidence = engine.computeConfidence(match.ranked);
    match = Object.assign({}, match, {
      best: { profile: engine.personalizeProfile(match.best.profile, earlyConfidence.influences), distance: match.best.distance },
    });
    var audience = (state.audienceDescription || "").trim() || "the people we serve";
    var founderOutput = engine.assembleFounderOutput(scored.founderDNAScores, audience, state.problemStatement || "this problem");
    var customerImpression = engine.topCustomerImpression(scored.customerImpressionScores);
    var results = {
      tensionFingerprint: scored.tensionFingerprint,
      founderDNAScores: scored.founderDNAScores,
      customerImpressionScores: scored.customerImpressionScores,
      customerImpression: customerImpression,
      expressionSuggestions: scored.expressionSuggestions,
      match: match,
      founderOutput: founderOutput,
      // Kept alongside the derived scores (not just used-and-discarded like
      // before) so the Brand Playbook's answer-tracing/quoting features
      // still work after a page reload or a Version History restore —
      // both of which only ever had `results`, never the live `answers`
      // that scoreAnswers() consumed. Snapshots saved before this existed
      // simply won't have it; every consumer must treat it as optional.
      answers: Object.assign({}, state.answers),
      problemStatement: state.problemStatement || "",
      audienceDescription: state.audienceDescription || "",
      firstName: (state.firstName || "").trim(),
      businessName: (state.businessName || "").trim(),
      completedAt: new Date().toISOString(),
    };
    store.setState({ step: "results", results: results });
    recordHistoryVersion(results);
  }

  // Every completed assessment gets saved as a timestamped version under
  // one canonical Vault item, reusing the same Version History mechanics
  // Branding/Logo Studio's own Vault already has — so retaking never
  // silently erases a founder's past match the way it used to before
  // this existed. Capped at BrandHaus.favorites.MAX_VERSIONS_PER_ITEM
  // (5) — oldest versions roll off automatically.
  var HISTORY_MODE = "assessment";
  function recordHistoryVersion(results) {
    if (!BrandHaus.favorites) return;
    var profile = results.match.best.profile;
    var existing = BrandHaus.favorites.getAll(HISTORY_MODE);
    if (!existing.length) {
      BrandHaus.favorites.save(HISTORY_MODE, { title: "My Brand DNA Assessment", text: profile.name, snapshot: results });
    } else {
      BrandHaus.favorites.addVersion(HISTORY_MODE, existing[0].id, { text: profile.name, snapshot: results });
    }
  }

  function retake() {
    store.setState(buildInitialState());
  }

  // Flattens the 6 labeled color roles (primary/secondary/neutral/accent/
  // support/standOut) into the plain ordered array Branding Studio's
  // colors field expects — the role labels are a Results/Blueprint
  // display concept only, Branding Studio just stores a list of hex
  // values.
  function flattenPaletteRoles(colors) {
    return ["primary", "secondary", "neutral", "accent", "support", "standOut"]
      .map(function (role) { return colors[role]; })
      .filter(Boolean);
  }

  function applyToBrandingStudio() {
    var state = store.getState();
    if (!state.results) return;
    var profile = state.results.match.best.profile;
    var founderOutput = state.results.founderOutput;
    BrandHaus.branding.applyBrandDNAResult({
      colors: flattenPaletteRoles(profile.output.colors),
      headingFont: profile.output.headingFont,
      bodyFont: profile.output.bodyFont,
      mood: profile.output.mood,
      brandVoice: profile.output.voice,
      mission: founderOutput.missionStatement,
      values: founderOutput.values,
    });
    // Overwrites the same way colors/fonts/mood above do — the founder
    // just answered a dedicated "do you have a business name?" question,
    // so that answer should win over whatever (if anything) was already
    // sitting in the Identity bar. Only skipped when the assessment's own
    // field was left blank (its intro explicitly allows "leave it blank"),
    // so an unanswered field never wipes out a name set elsewhere.
    if (state.results.businessName) {
      BrandHaus.identity.setBusinessName(state.results.businessName);
    }
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function renderIntro() {
    var ui = BrandHaus.ui;
    var firstNameInput = ui.el("input", { type: "text", class: "bh-field__custom", placeholder: "First Name" });
    var businessNameInput = ui.el("input", { type: "text", class: "bh-field__custom", placeholder: "If unknown, leave blank" });
    var problemTextarea = ui.el("textarea", { class: "bh-field__custom bh-field__freetext", rows: "2", placeholder: "Type your answer here..." });
    var audienceInput = ui.el("input", { type: "text", class: "bh-field__custom", placeholder: "Type your answer here..." });
    var startBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal" }, [ui.icon("lightning"), ui.el("span", { text: "Start the Assessment" })]);
    startBtn.addEventListener("click", function () {
      startInterview(firstNameInput.value.trim(), businessNameInput.value.trim(), problemTextarea.value.trim(), audienceInput.value.trim());
      BrandHaus.ui.renderApp();
    });

    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--intro" }, [
      ui.el("h2", { class: "bh-preview__title" }, [ui.icon("bulb"), ui.el("span", { text: "The Brand DNA Assessment™" })]),
      ui.el("p", { class: "bh-field-group__subtitle bh-text--black", text: "30 questions, about 17-25 minutes. This isn't about picking colors — it uncovers how you naturally think, what you value, and what should show up in your brand because of it. There are no right answers." }),
      ui.el("div", { class: "bh-field" }, [
        ui.el("label", { class: "bh-field__label", text: "What's your first name?" }),
        ui.el("div", { class: "bh-founder-interview__field-box" }, [firstNameInput]),
      ]),
      ui.el("div", { class: "bh-field" }, [
        ui.el("label", { class: "bh-field__label", text: "Do you already have a business name in mind? (if not, no worries — leave it blank)" }),
        ui.el("div", { class: "bh-founder-interview__field-box" }, [businessNameInput]),
      ]),
      ui.el("div", { class: "bh-field" }, [
        ui.el("label", { class: "bh-field__label", text: "In one sentence, what does your business do or solve? (optional — helps personalize your results, not scored)" }),
        ui.el("div", { class: "bh-founder-interview__field-box" }, [
          problemTextarea,
          ui.el("p", { class: "bh-founder-interview__examples", text: "e.g. \"handmade candles for a cozy home\" · \"a life coaching practice for new moms\" · \"a subscription box for hikers\"" }),
        ]),
      ]),
      ui.el("div", { class: "bh-field" }, [
        ui.el("label", { class: "bh-field__label", text: "Who do you serve? (optional, not scored)" }),
        ui.el("div", { class: "bh-founder-interview__field-box" }, [
          audienceInput,
          ui.el("p", { class: "bh-founder-interview__examples", text: "e.g. \"busy parents who want a moment of calm\" · \"new entrepreneurs building their first brand\" · \"outdoor enthusiasts who value quality gear\"" }),
        ]),
      ]),
      startBtn,
      ui.el("p", { class: "bh-chapter__reassurance", text: "Everything this assessment generates is a creative starting point built from your own answers — not a guarantee of business results, and not a substitute for your own judgment." }),
    ]);
  }

  function renderQuestion() {
    var ui = BrandHaus.ui;
    var state = store.getState();
    var q = QUESTION_TEXT[state.currentIndex];
    var optionKeys = Object.keys(q.options);
    var existingAnswer = state.answers[q.id];
    var isRevisiting = state.currentIndex < state.furthestIndex;

    var progressPct = Math.round((state.currentIndex / QUESTION_TEXT.length) * 100);
    var progressBar = ui.el("div", { class: "bh-founder-interview__progress-track" }, [
      ui.el("div", { class: "bh-founder-interview__progress-fill", style: "width: " + progressPct + "%;" }),
    ]);

    var optionButtons = optionKeys.map(function (key) {
      var isSelected = key === existingAnswer;
      var btn = ui.el("button", { type: "button", class: "bh-preset-card bh-founder-interview__option" + (isSelected ? " is-selected" : "") }, [
        ui.el("span", { class: "bh-preset-card__name", text: q.options[key] }),
      ]);
      btn.addEventListener("click", function () {
        // No longer jumps straight to "brandDNA" on the final question —
        // selectAnswer() sets step to "results", which renderFull() now
        // shows as the one-time celebration screen first (see
        // renderCelebration()), staying on the "conversation" wizard
        // step until its own Next button explicitly navigates onward.
        selectAnswer(q.id, key);
        BrandHaus.ui.renderApp();
      });
      return btn;
    });

    var backBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset bh-btn--small", text: "Back" });
    backBtn.addEventListener("click", function () { goBack(); BrandHaus.ui.renderApp(); });

    var navButtons = [backBtn];
    if (isRevisiting) {
      var nextBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset bh-btn--small", text: "Next" });
      nextBtn.title = "You already answered this one — Next keeps your answer as-is. Pick a different option above to change it.";
      nextBtn.addEventListener("click", function () { goForward(); BrandHaus.ui.renderApp(); });
      navButtons.push(nextBtn);
    }

    var questionChildren = [ui.el("p", { class: "bh-field-group__subtitle", text: "Question " + (state.currentIndex + 1) + " of " + QUESTION_TEXT.length + (isRevisiting ? " — reviewing a previous answer" : "") })];
    if (q.lead) {
      questionChildren.push(ui.el("p", { class: "bh-founder-interview__lead", text: q.lead }));
      questionChildren.push(ui.el("h3", { class: "bh-founder-interview__question bh-founder-interview__question--sub", text: q.text }));
    } else {
      questionChildren.push(ui.el("h3", { class: "bh-founder-interview__question", text: q.text }));
    }

    return ui.el("div", { class: "bh-founder-interview" }, [
      progressBar,
      ui.el("div", { class: "bh-founder-interview__question-wrap" }, questionChildren),
      ui.el("div", { class: "bh-founder-interview__options" }, optionButtons),
      ui.el("div", { class: "bh-founder-interview__nav-row" }, navButtons),
    ]);
  }

  // Results are rendered by brand-haus-results.js (BrandHaus.results.
  // renderStep3()), not here — finishing the last question navigates
  // straight there via an explicit one-time BrandHaus.ui.setActiveStep()
  // call. If someone comes back to "The Conversation" afterward (e.g.
  // via the sidebar) while a result still exists, show a plain "already
  // done" card instead of either flashing the stale last question or
  // silently redirecting — the redirect approach previously made
  // revisiting this step look like it had bounced you back to old
  // results without ever letting you re-answer.
  function renderAlreadyCompletedCard() {
    var ui = BrandHaus.ui;
    var viewBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal" }, [ui.icon("layers"), ui.el("span", { text: "View Your Brand DNA Results" })]);
    viewBtn.addEventListener("click", function () { BrandHaus.ui.setActiveStep("brandDNA"); });
    var retakeBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset" }, [ui.icon("refresh"), ui.el("span", { text: "Retake the Assessment" })]);
    retakeBtn.addEventListener("click", function () { retake(); BrandHaus.ui.renderApp(); });
    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--intro" }, [
      ui.el("h2", { class: "bh-preview__title" }, [ui.icon("sparkle"), ui.el("span", { text: "You've already completed this" })]),
      ui.el("p", { class: "bh-field-group__subtitle bh-text--black", text: "Your Brand DNA results are ready to view. You can look them over, or retake the assessment for a fresh read." }),
      ui.el("div", { class: "bh-preview__actions" }, [viewBtn, retakeBtn]),
    ]);
  }

  // The one-time "you're done" moment, shown once per completed
  // assessment before the founder ever sees the results dashboard —
  // so Your Brand DNA's own hero section can start directly with the
  // identity + dashboard instead of repeating "complete" copy the
  // founder just read here a second ago.
  function renderCelebration() {
    var ui = BrandHaus.ui;
    var results = store.getState().results;
    var profile = results.match.best.profile;
    var nextBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal bh-btn--large" }, [ui.icon("lightning"), ui.el("span", { text: "See Your Brand DNA" })]);
    nextBtn.addEventListener("click", function () {
      store.setState({ celebrationDismissed: true });
      BrandHaus.ui.setActiveStep("brandDNA");
    });
    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--celebration", style: BrandHaus.results.accentStyleFor(profile) }, [
      BrandHaus.results.renderCongratsBanner(ui, "Your Brand DNA is Complete", [
        "You didn't just complete a branding assessment—you completed a conversation about the business you're building and the legacy you hope to leave behind.",
        "What follows isn't meant to put you in a box. It's designed to give you direction, language, and clarity as you continue building a brand that's authentically yours.",
      ]),
      ui.el("div", { class: "bh-founder-interview__welcome-actions" }, [nextBtn]),
    ]);
  }

  function renderFull() {
    var state = store.getState();
    if (state.step === "intro") return renderIntro();
    if (state.step === "results") {
      return state.celebrationDismissed ? renderAlreadyCompletedCard() : renderCelebration();
    }
    return renderQuestion();
  }

  BrandHaus.founderInterview = Object.assign({}, store, {
    renderFull: renderFull,
    applyToBrandingStudio: applyToBrandingStudio,
    retake: retake,
    // The scoring engine (brand-haus-branddna.js) only knows option keys
    // and tension deltas; the human-readable question/option text lives
    // here. The Brand Playbook's answer-quoting feature needs both.
    QUESTION_TEXT: QUESTION_TEXT,
  });
})();
