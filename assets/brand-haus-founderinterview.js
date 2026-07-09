/**
 * The AI Creator's Brand Haus — Brand DNA Assessment (Founder Interview™)
 * Depends on brand-haus-branddna.js (the scoring engine — must load
 * first), brand-haus-identity.js, brand-haus-branding.js (the
 * Apply action writes into it), and brand-haus-ui.js's exposed
 * BrandHaus.ui helpers.
 *
 * Presentation layer only — every weight, profile, and fragment lives in
 * brand-haus-branddna.js per docs/brand-dna-framework.md. This file
 * just asks the 21 questions one at a time, shows the results, and
 * offers to apply them to Branding Studio. Question/option TEXT lives
 * here (not in the engine file) since the engine is pure data+scoring —
 * IDs and option keys below must stay in sync with that file's 21
 * entries or scoring will silently no-op for a question.
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
    { id: 2, text: "Imagine your business closed its doors forever, five years from now. What would hurt the most about seeing it disappear?", options: { A: "The people I helped would lose something meaningful", B: "The creativity and ideas would disappear", C: "The community we built would no longer exist", D: "The standard of quality we set would be gone", E: "I'd regret never reaching the impact I knew was possible" } },
    { id: 3, text: "If your brand were a color palette...", options: { A: "Deep jewel tones", B: "Warm earthy neutrals", C: "Bright, punchy colors", D: "Black, white, and one bold accent" } },
    { id: 4, text: "You win the lottery tomorrow. You never have to work again. Do you still build this business?", options: { A: "Absolutely, this is my purpose", B: "Yes, but I'd slow down", C: "Maybe — I love creating more than running a business", D: "Probably not" } },
    { id: 5, text: "Pick the photography style that feels most \"you.\"", options: { A: "Bright, candid, energetic", B: "Soft, warm natural light", C: "Moody and dramatic", D: "Clean and minimal" } },
    { id: 6, text: "When your customers describe you to a friend, what do you secretly hope they say?", options: { A: "They changed my life", B: "They're unbelievably talented", C: "I've never trusted anyone more", D: "Everything they touch is beautiful", E: "They're just genuinely good people" } },
    { id: 7, text: "Which pace best describes your brand?", options: { A: "Calm and steady", B: "Fast-paced and exciting", C: "Deliberate and precise", D: "Playful and spontaneous" } },
    { id: 8, text: "Which failure would hurt you the most?", options: { A: "Creating something nobody remembers", B: "Letting down the people who trusted me", C: "Never reaching my full potential", D: "Becoming just another business", E: "Sacrificing my values for success" } },
    { id: 9, text: "What should your brand voice sound like?", options: { A: "Trusted friend", B: "Confident expert", C: "Witty best friend", D: "Luxury concierge" } },
    { id: 10, text: "Which compliment would stay with you forever?", options: { A: "You gave me hope", B: "You made me believe in myself", C: "You created something unforgettable", D: "You built something that will outlive you", E: "You never compromised who you were" } },
    { id: 11, text: "What's your relationship with tradition?", options: { A: "Respect craftsmanship", B: "Break the mold", C: "Use what works", D: "Follow my heart" } },
    { id: 12, text: "Imagine your customers sitting around a campfire after you've gone home. What do you hope they're saying?", options: { A: "I've never felt more understood", B: "They're changing the game", C: "Everything they create is beautiful", D: "I wish every company cared this much", E: "I can't wait to see what they do next" } },
    { id: 13, text: "What matters most in how your brand looks?", options: { A: "Timeless", B: "Cutting edge", C: "Warm and approachable", D: "Polished and elevated" } },
    { id: 14, text: "Which sentence scares you the most?", options: { A: "I lived safely", B: "I blended in", C: "I never made a difference", D: "I disappointed people", E: "I never became who I was capable of becoming" } },
    { id: 15, text: "Which matters more?", options: { A: "Standing out", B: "Belonging", C: "Both", D: "Being respected" } },
    { id: 16, text: "Finish this sentence. Success means...", options: { A: "Freedom", B: "Helping people", C: "Making my family proud", D: "Becoming known for excellence", E: "Leaving the world better than I found it" } },
    { id: 17, text: "If your brand had a soundtrack...", options: { A: "Acoustic", B: "Upbeat pop", C: "Cinematic", D: "Jazz/classical" } },
    { id: 18, text: "A client offers double your rate but wants work that doesn't feel authentic. What do you do?", options: { A: "Decline", B: "Adapt", C: "Depends", D: "Find a compromise", E: "Accept if it helps me grow" } },
    { id: 19, text: "What energy should every customer interaction leave behind?", options: { A: "Calm", B: "Excited", C: "Efficient", D: "Personally connected" } },
    { id: 20, text: "Pick one word that describes the future of your brand.", options: { A: "Timeless", B: "Beloved", C: "Iconic", D: "Elevated" } },
    { id: 21, text: "Imagine someone is telling the story of your business twenty years from now. What do you hope they remember most?", options: { A: "The lives we changed", B: "The courage to do things differently", C: "The community we built together", D: "The standard of excellence we refused to compromise", E: "That we stayed true to who we were from beginning to end" } },
  ];

  function buildInitialState() {
    return {
      step: "intro", // "intro" | "question" | "results"
      problemStatement: "",
      audienceDescription: "",
      currentIndex: 0,
      answers: {}, // questionId -> optionKey
      results: null,
    };
  }

  var store = BrandHaus.util.createStore(buildInitialState());

  function selectAnswer(questionId, optionKey) {
    var state = store.getState();
    var answers = Object.assign({}, state.answers);
    answers[questionId] = optionKey;
    if (state.currentIndex < QUESTION_TEXT.length - 1) {
      store.setState({ answers: answers, currentIndex: state.currentIndex + 1 });
    } else {
      store.setState({ answers: answers });
      finish();
    }
  }

  function goBack() {
    var state = store.getState();
    if (state.currentIndex > 0) store.setState({ currentIndex: state.currentIndex - 1 });
    else store.setState({ step: "intro" });
  }

  function startInterview(problemStatement, audienceDescription) {
    store.setState({ step: "question", currentIndex: 0, answers: {}, results: null, problemStatement: problemStatement, audienceDescription: audienceDescription });
  }

  function finish() {
    var state = store.getState();
    var selections = Object.keys(state.answers).map(function (qid) {
      return { questionId: parseInt(qid, 10), optionKey: state.answers[qid] };
    });
    var engine = BrandHaus.brandDNA;
    var scored = engine.scoreAnswers(selections);
    var match = engine.matchProfile(scored.tensionFingerprint);
    var audience = (state.audienceDescription || "").trim() || "the people we serve";
    var founderOutput = engine.assembleFounderOutput(scored.founderDNAScores, audience, state.problemStatement || "this problem");
    store.setState({
      step: "results",
      results: { tensionFingerprint: scored.tensionFingerprint, expressionSuggestions: scored.expressionSuggestions, match: match, founderOutput: founderOutput },
    });
  }

  function retake() {
    store.setState(buildInitialState());
  }

  function applyToBrandingStudio() {
    var state = store.getState();
    if (!state.results) return;
    var profile = state.results.match.best.profile;
    var founderOutput = state.results.founderOutput;
    BrandHaus.branding.applyBrandDNAResult({
      colors: profile.output.colors,
      headingFont: profile.output.headingFont,
      bodyFont: profile.output.bodyFont,
      mood: profile.output.mood,
      brandVoice: profile.output.voice,
      mission: founderOutput.missionStatement,
      values: founderOutput.values,
    });
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------
  function renderIntro() {
    var ui = BrandHaus.ui;
    var problemTextarea = ui.el("textarea", { class: "bh-field__custom bh-field__freetext", rows: "2", placeholder: "e.g. \"handmade candles for people who want their home to feel like a retreat\"" });
    var audienceInput = ui.el("input", { type: "text", class: "bh-field__select", placeholder: "e.g. \"busy parents who want a moment of calm\"" });
    var startBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--copy" }, [ui.icon("lightning"), ui.el("span", { text: "Start the Assessment" })]);
    startBtn.addEventListener("click", function () {
      startInterview(problemTextarea.value.trim(), audienceInput.value.trim());
      BrandHaus.ui.renderApp();
    });

    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--intro" }, [
      ui.el("h2", { class: "bh-preview__title" }, [ui.icon("bulb"), ui.el("span", { text: "The Brand DNA Assessment" })]),
      ui.el("p", { class: "bh-field-group__subtitle", text: "21 questions, about 12-18 minutes. This isn't about picking colors — it uncovers how you naturally think, what you value, and what should show up in your brand because of it. There are no right answers." }),
      ui.el("div", { class: "bh-field" }, [
        ui.el("label", { class: "bh-field__label", text: "In one sentence, what does your business do or solve? (optional — helps personalize your results, not scored)" }),
        problemTextarea,
      ]),
      ui.el("div", { class: "bh-field" }, [
        ui.el("label", { class: "bh-field__label", text: "Who do you serve? (optional, not scored)" }),
        audienceInput,
      ]),
      startBtn,
    ]);
  }

  function renderQuestion() {
    var ui = BrandHaus.ui;
    var state = store.getState();
    var q = QUESTION_TEXT[state.currentIndex];
    var optionKeys = Object.keys(q.options);

    var progressPct = Math.round((state.currentIndex / QUESTION_TEXT.length) * 100);
    var progressBar = ui.el("div", { class: "bh-founder-interview__progress-track" }, [
      ui.el("div", { class: "bh-founder-interview__progress-fill", style: "width: " + progressPct + "%;" }),
    ]);

    var optionButtons = optionKeys.map(function (key) {
      var btn = ui.el("button", { type: "button", class: "bh-preset-card bh-founder-interview__option" }, [
        ui.el("span", { class: "bh-preset-card__name", text: q.options[key] }),
      ]);
      btn.addEventListener("click", function () { selectAnswer(q.id, key); BrandHaus.ui.renderApp(); });
      return btn;
    });

    var backBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset bh-btn--small", text: "Back" });
    backBtn.addEventListener("click", function () { goBack(); BrandHaus.ui.renderApp(); });

    return ui.el("div", { class: "bh-founder-interview" }, [
      progressBar,
      ui.el("p", { class: "bh-field-group__subtitle", text: "Question " + (state.currentIndex + 1) + " of " + QUESTION_TEXT.length }),
      ui.el("h3", { class: "bh-founder-interview__question", text: q.text }),
      ui.el("div", { class: "bh-founder-interview__options" }, optionButtons),
      backBtn,
    ]);
  }

  function renderResults() {
    var ui = BrandHaus.ui;
    var state = store.getState();
    var results = state.results;
    var profile = results.match.best.profile;
    var second = results.match.secondBest.profile;
    var founderOutput = results.founderOutput;

    var colorSwatches = profile.output.colors.map(function (hex) {
      return ui.el("span", { style: "display:inline-block;width:28px;height:28px;border-radius:50%;background:" + hex + ";border:1px solid rgba(0,0,0,0.15);margin-right:6px;" });
    });

    var applyBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--copy" }, [ui.icon("palette"), ui.el("span", { text: "Apply to Branding Studio" })]);
    applyBtn.addEventListener("click", function () { applyToBrandingStudio(); BrandHaus.ui.renderApp(); });

    var retakeBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset" }, [ui.icon("refresh"), ui.el("span", { text: "Retake" })]);
    retakeBtn.addEventListener("click", function () { retake(); BrandHaus.ui.renderApp(); });

    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--results" }, [
      ui.el("h2", { class: "bh-preview__title" }, [ui.icon("sparkle"), ui.el("span", { text: "Your Brand DNA" })]),
      ui.el("h3", { class: "bh-founder-interview__profile-name", text: profile.name }),
      ui.el("p", { class: "bh-field-group__subtitle", text: "With touches of " + second.name + " — no one fits a single mold perfectly, and that's fine." }),
      ui.el("div", { class: "bh-founder-interview__result-row" }, colorSwatches),
      ui.el("p", { text: "Mood: " + profile.output.mood + " · Voice: " + profile.output.voice }),
      ui.el("p", { text: "Fonts: " + profile.output.headingFont + " (headings) + " + profile.output.bodyFont + " (body)" }),
      ui.el("h4", { class: "bh-field-group__title", text: "Mission Statement (draft — edit freely)" }),
      ui.el("p", { class: "bh-founder-interview__mission", text: founderOutput.missionStatement }),
      ui.el("h4", { class: "bh-field-group__title", text: "Suggested Core Values" }),
      ui.el("p", { text: founderOutput.values.join(", ") }),
      ui.el("div", { class: "bh-preview__actions" }, [applyBtn, retakeBtn]),
    ]);
  }

  function renderFull() {
    var state = store.getState();
    if (state.step === "intro") return renderIntro();
    if (state.step === "question") return renderQuestion();
    return renderResults();
  }

  BrandHaus.founderInterview = Object.assign({}, store, {
    renderFull: renderFull,
  });
})();
