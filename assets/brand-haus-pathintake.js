/**
 * The AI Creator's Brand Haus — Find Your Direction (Path Intake)
 * Depends on brand-haus-ui.js's exposed BrandHaus.ui helpers. Loads
 * after brand-haus-founderinterview.js (mirrors its exact question-at-
 * a-time UI pattern — progress bar, click-to-select option cards,
 * revisit-without-erasing Back/Next) but is a much shorter, un-scored
 * intake: 8 questions max, no archetype matching, just a direct
 * assembly into a brief for Frank (the Idea Haus GPT).
 *
 * Two mutually-exclusive paths, chosen once via a fork screen:
 *   - "creator": for someone who IS the brand (an influencer/creator)
 *   - "niche": for someone building a niche product line
 * Only one path's answers exist per session — retaking clears both.
 *
 * Path B's productType question gates two mutually-exclusive follow-up
 * questions (physicalType/digitalType) — the one real branch point in
 * either question set. Changing that answer after the fact drops
 * whichever gated answer no longer applies and resets furthestIndex, so
 * revisiting never leaves a stale answer to a question that's no
 * longer being asked.
 *
 * Not part of Vault/Recent Log/Version History — this is a one-time
 * directional intake feeding a one-time brief, not a saved creative
 * asset like a generator's prompt.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var GATING_QUESTION_ID = "productType";
  var GATED_QUESTION_IDS = ["physicalType", "digitalType"];

  var PATH_A_QUESTIONS = [
    { id: "platform", brief: "Primary platform", text: "Which platform do you spend the most time on, or want to grow first?",
      options: { tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", pinterest: "Pinterest", x: "X (Twitter)", other: "Other / not sure yet" } },
    { id: "genre", brief: "Content genre", text: "What genre or topic do you already talk about, or want to?",
      options: {
        comedy: "Comedy & entertainment", beauty: "Beauty & style", fitness: "Fitness & wellness", parenting: "Parenting & family",
        faith: "Faith & spirituality", finance: "Finance & business", food: "Food & cooking", travel: "Travel",
        gaming: "Gaming", education: "Education / how-to", other: "Other",
      } },
    { id: "faceOnCamera", brief: "Face on camera", text: "Are you comfortable showing your face on camera, or do you want to stay faceless?",
      options: { yes: "Yes, I'm comfortable showing my face", no: "No, I want to stay faceless", unsure: "Not sure yet" } },
    { id: "format", brief: "Preferred format", text: "What format do you enjoy making most?",
      options: { shortForm: "Short-form video", photo: "Photo / carousel posts", live: "Live streaming or live-selling", longForm: "Long-form video", writing: "Writing / captions" } },
    { id: "audienceStage", brief: "Current audience size", text: "Where are you right now with an audience?",
      options: { none: "Haven't started yet", small: "Under 1,000 followers", growing: "1,000-10,000", established: "10,000-100,000", large: "100,000+" } },
    { id: "contentGoal", brief: "What the content should do", text: "What do you want your content to actually do for people?",
      options: { entertain: "Entertain", teach: "Teach", inspire: "Inspire", sell: "Sell a product", community: "Build community" } },
    { id: "offerType", brief: "Offer type that feels natural", text: "What kind of offers feel most natural to you as the face of it?",
      options: { merch: "Merch tied to my persona", digital: "Digital products / courses", affiliate: "Affiliate recommendations", coaching: "Coaching / services", deals: "Brand deals" } },
    { id: "blocker", brief: "Biggest blocker right now", text: "What's holding you back most right now?",
      options: { whatToPost: "I don't know what to post", howToSell: "I don't know how to sell", fear: "Fear of showing my face", consistency: "Inconsistency", other: "Something else" } },
  ];

  var PATH_B_QUESTIONS = [
    { id: "spark", brief: "What's pulling at their attention", text: "What's already pulling at your attention — a hobby, interest, or problem you deal with personally?", isFreeText: true },
    { id: "buyer", brief: "Who they picture buying it", text: "Who do you picture buying this? Describe them in a sentence.", isFreeText: true },
    { id: "productType", brief: "Product type", text: "What type of product feels right to start with?",
      options: { physical: "Physical / print-on-demand item", digital: "A digital download", service: "A service", unsure: "Not sure yet" } },
    { id: "physicalType", brief: "Physical product instinct", text: "Any early instinct on what kind?",
      options: { apparel: "Apparel (e.g., T-shirts)", decor: "Home decor / wall art", stationery: "Stationery / planners", drinkware: "Drinkware", stickers: "Stickers", none: "No strong instinct yet" },
      showIf: function (answers) { return answers.productType === "physical"; } },
    { id: "digitalType", brief: "Digital product instinct", text: "Any early instinct on what kind?",
      options: { printable: "Printable / planner", ebook: "Ebook / guide", template: "Template", coloring: "Coloring / activity pages", none: "No strong instinct yet" },
      showIf: function (answers) { return answers.productType === "digital"; } },
    { id: "platform", brief: "Where they picture selling", text: "Where do you picture selling this?",
      options: { etsy: "Etsy", shopify: "Shopify", amazon: "Amazon", tiktokShop: "TikTok Shop", stanStore: "Stan Store", unsure: "Not sure yet" } },
    { id: "gap", brief: "What's missing in this space", text: "Is there something in this space right now that annoys you or feels like it's missing?", isFreeText: true },
    { id: "blocker", brief: "Biggest blocker right now", text: "What's holding you back most right now?",
      options: { whatToMake: "I don't know what to make", howToSell: "I don't know how to sell it", worried: "Worried no one will buy it", tools: "I don't have the tools/skills", other: "Something else" } },
  ];

  function buildInitialState() {
    return {
      step: "welcome", // "welcome" | "fork" | "question" | "done"
      path: null, // "creator" | "niche"
      currentIndex: 0,
      furthestIndex: 0,
      answers: {}, // id -> option key or free-text string
    };
  }

  var store = BrandHaus.util.createStore(buildInitialState());

  function getQuestionList(path) {
    return path === "creator" ? PATH_A_QUESTIONS : PATH_B_QUESTIONS;
  }

  function getVisibleQuestions(path, answers) {
    return getQuestionList(path).filter(function (q) {
      return !q.showIf || q.showIf(answers);
    });
  }

  function choosePath(path) {
    store.setState({ path: path, step: "question", currentIndex: 0, furthestIndex: 0, answers: {} });
  }

  function selectAnswer(questionId, value) {
    var state = store.getState();
    var answers = Object.assign({}, state.answers);
    var changedGate = questionId === GATING_QUESTION_ID && answers[questionId] !== value;
    answers[questionId] = value;
    if (changedGate) {
      GATED_QUESTION_IDS.forEach(function (id) { delete answers[id]; });
    }
    var visible = getVisibleQuestions(state.path, answers);
    var ids = visible.map(function (q) { return q.id; });
    var position = ids.indexOf(questionId);
    if (position < visible.length - 1) {
      var nextIndex = position + 1;
      var furthestIndex = changedGate ? nextIndex : Math.max(state.furthestIndex, nextIndex);
      store.setState({ answers: answers, currentIndex: nextIndex, furthestIndex: furthestIndex });
      return;
    }
    store.setState({ answers: answers, step: "done" });
  }

  function goBack() {
    var state = store.getState();
    if (state.currentIndex > 0) store.setState({ currentIndex: state.currentIndex - 1 });
    else store.setState({ step: "fork" });
  }

  // Pure navigation, no new answer required — mirrors the Founder
  // Interview's own revisit-without-erasing mechanism exactly.
  function goForward() {
    var state = store.getState();
    if (state.currentIndex < state.furthestIndex) {
      store.setState({ currentIndex: state.currentIndex + 1 });
    }
  }

  function retake() {
    store.setState(buildInitialState());
  }

  function resolveAnswerLabel(question, value) {
    if (!value) return "";
    if (question.options) return question.options[value] || value;
    return value;
  }

  function buildFrankBrief(state) {
    var visible = getVisibleQuestions(state.path, state.answers);
    var lines = visible.map(function (q) {
      var label = resolveAnswerLabel(q, state.answers[q.id]);
      return label ? q.brief + ": " + label : null;
    }).filter(Boolean);

    var intro = state.path === "creator"
      ? "I just finished my Brand DNA Assessment on Black Sheep Creations & Inspirations' Brand Haus, and I'm exploring building my brand as a creator/influencer. Here's what I shared:"
      : "I just finished my Brand DNA Assessment on Black Sheep Creations & Inspirations' Brand Haus, and I'm exploring a niche product idea. Here's what I shared:";

    var outro = "Before you give me any recommendations, ask me 2-3 clarifying questions about what I've shared above — I'd like this to be a real back-and-forth, not just a list of ideas.";

    return intro + "\n\n" + lines.join("\n") + "\n\n" + outro;
  }

  // ---------------------------------------------------------------------
  // Rendering — mirrors brand-haus-founderinterview.js's exact pattern
  // (progress bar, click-to-select option cards) rather than the
  // dropdown/checkbox field-group look used by every generator engine.
  // ---------------------------------------------------------------------
  function renderWelcome() {
    var ui = BrandHaus.ui;
    var startBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal" }, [ui.icon("lightning"), ui.el("span", { text: "Get Started" })]);
    startBtn.addEventListener("click", function () { store.setState({ step: "fork" }); BrandHaus.ui.renderApp(); });

    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--intro" }, [
      ui.el("h2", { class: "bh-preview__title" }, [ui.icon("peak"), ui.el("span", { text: "Find Your Direction" })]),
      ui.el("p", { class: "bh-field-group__subtitle bh-text--black", text: "A short, 7-8 question check-in — just enough to point you toward a real direction before you dive into Branding Studio." }),
      ui.el("p", { class: "bh-field-group__subtitle bh-text--black", text: "At the end, your answers get turned into a starting brief you can bring straight to Frank — your AI Business Partner in the Idea Haus — to start a real back-and-forth about what to build." }),
      startBtn,
      ui.el("p", { class: "bh-chapter__reassurance", text: "This is a creative starting point built from your own answers — not a guarantee of what will sell, and not a substitute for your own research and judgment." }),
    ]);
  }

  function renderFork() {
    var ui = BrandHaus.ui;
    var creatorBtn = ui.el("button", { type: "button", class: "bh-preset-card bh-founder-interview__option" }, [
      ui.el("span", { class: "bh-preset-card__name", text: "I Am the Brand" }),
      ui.el("span", { class: "bh-preset-card__description", text: "You're a creator or influencer — your content and personality are the draw, and any products grow out of that." }),
    ]);
    creatorBtn.addEventListener("click", function () { choosePath("creator"); BrandHaus.ui.renderApp(); });

    var nicheBtn = ui.el("button", { type: "button", class: "bh-preset-card bh-founder-interview__option" }, [
      ui.el("span", { class: "bh-preset-card__name", text: "I'm Building a Niche Product" }),
      ui.el("span", { class: "bh-preset-card__description", text: "You're building a shop or product line around a niche, whether or not you're the face of it." }),
    ]);
    nicheBtn.addEventListener("click", function () { choosePath("niche"); BrandHaus.ui.renderApp(); });

    var backBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset bh-btn--small", text: "Back" });
    backBtn.addEventListener("click", function () { store.setState({ step: "welcome" }); BrandHaus.ui.renderApp(); });

    return ui.el("div", { class: "bh-founder-interview" }, [
      ui.el("div", { class: "bh-founder-interview__question-wrap" }, [
        ui.el("h3", { class: "bh-founder-interview__question", text: "Which sounds more like you right now?" }),
      ]),
      ui.el("div", { class: "bh-founder-interview__options" }, [creatorBtn, nicheBtn]),
      ui.el("div", { class: "bh-founder-interview__nav-row" }, [backBtn]),
    ]);
  }

  function renderQuestion() {
    var ui = BrandHaus.ui;
    var state = store.getState();
    var visible = getVisibleQuestions(state.path, state.answers);
    var q = visible[state.currentIndex];
    var existingAnswer = state.answers[q.id];
    var isRevisiting = state.currentIndex < state.furthestIndex;

    var progressPct = Math.round((state.currentIndex / visible.length) * 100);
    var progressBar = ui.el("div", { class: "bh-founder-interview__progress-track" }, [
      ui.el("div", { class: "bh-founder-interview__progress-fill", style: "width: " + progressPct + "%;" }),
    ]);

    var answerArea;
    if (q.isFreeText) {
      var textarea = ui.el("textarea", { class: "bh-field__custom bh-field__freetext", rows: "3", placeholder: "Type your answer here..." });
      textarea.value = existingAnswer || "";
      var continueBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal bh-btn--small", text: "Continue" });
      continueBtn.addEventListener("click", function () { selectAnswer(q.id, textarea.value.trim()); BrandHaus.ui.renderApp(); });
      answerArea = ui.el("div", { class: "bh-founder-interview__field-box" }, [textarea, ui.el("div", { class: "bh-companion__controls" }, [continueBtn])]);
    } else {
      var optionKeys = Object.keys(q.options);
      var optionButtons = optionKeys.map(function (key) {
        var isSelected = key === existingAnswer;
        var btn = ui.el("button", { type: "button", class: "bh-preset-card bh-founder-interview__option" + (isSelected ? " is-selected" : "") }, [
          ui.el("span", { class: "bh-preset-card__name", text: q.options[key] }),
        ]);
        btn.addEventListener("click", function () { selectAnswer(q.id, key); BrandHaus.ui.renderApp(); });
        return btn;
      });
      answerArea = ui.el("div", { class: "bh-founder-interview__options" }, optionButtons);
    }

    var backBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset bh-btn--small", text: "Back" });
    backBtn.addEventListener("click", function () { goBack(); BrandHaus.ui.renderApp(); });

    var navButtons = [backBtn];
    if (isRevisiting) {
      var nextBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset bh-btn--small", text: "Next" });
      nextBtn.title = "You already answered this one — Next keeps your answer as-is.";
      nextBtn.addEventListener("click", function () { goForward(); BrandHaus.ui.renderApp(); });
      navButtons.push(nextBtn);
    }

    return ui.el("div", { class: "bh-founder-interview" }, [
      progressBar,
      ui.el("div", { class: "bh-founder-interview__question-wrap" }, [
        ui.el("p", { class: "bh-field-group__subtitle", text: "Question " + (state.currentIndex + 1) + " of " + visible.length + (isRevisiting ? " — reviewing a previous answer" : "") }),
        ui.el("h3", { class: "bh-founder-interview__question", text: q.text }),
      ]),
      answerArea,
      ui.el("div", { class: "bh-founder-interview__nav-row" }, navButtons),
    ]);
  }

  function renderDone() {
    var ui = BrandHaus.ui;
    var state = store.getState();
    var brief = buildFrankBrief(state);

    var textarea = ui.el("textarea", { class: "bh-preview__text", readonly: "readonly", rows: "10" });
    textarea.value = brief;

    var copyBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal" }, [ui.icon("copy"), ui.el("span", { class: "bh-btn__label", text: "Copy for Frank" })]);
    copyBtn.addEventListener("click", function () {
      ui.copyTextToClipboard(brief, function (ok) {
        var label = copyBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy for Frank"; }, 1500);
      });
    });

    var frankLink = ui.el("a", { href: "https://chatgpt.com/g/g-6a489ad05ac48191a7692939b09fc6f1-the-idea-haus", target: "_blank", rel: "noopener", class: "bh-btn bh-btn--reset" }, [ui.icon("lightning"), ui.el("span", { text: "Open the Idea Haus (Frank)" })]);

    var studioBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--teal" }, [ui.icon("palette"), ui.el("span", { text: "Continue to Branding Studio" })]);
    studioBtn.addEventListener("click", function () { BrandHaus.ui.setActiveStep("brandingStudio"); });

    var retakeBtn = ui.el("button", { type: "button", class: "bh-btn bh-btn--reset bh-btn--small", text: "Start Over" });
    retakeBtn.addEventListener("click", function () { retake(); BrandHaus.ui.renderApp(); });

    return ui.el("div", { class: "bh-founder-interview bh-founder-interview--intro" }, [
      ui.el("h2", { class: "bh-preview__title" }, [ui.icon("sparkle"), ui.el("span", { text: "Nice work — you've got real direction now." })]),
      ui.el("p", { class: "bh-field-group__subtitle bh-text--black", text: "Copy the brief below and paste it into Frank to start a real conversation — he'll ask you a few follow-up questions before he gives you anything back." }),
      textarea,
      ui.el("div", { class: "bh-preview__actions" }, [copyBtn, frankLink]),
      ui.el("p", { class: "bh-founder-interview__examples", text: "Your Brand Haus purchase includes access to Frank, your AI Business Partner, in the Idea Haus." }),
      ui.el("p", { class: "bh-chapter__reassurance", text: "Nothing here is sent anywhere automatically — copy the brief and paste it in yourself, whenever you're ready." }),
      ui.el("hr", { class: "bh-selections__divider" }),
      ui.el("p", { class: "bh-field-group__subtitle bh-text--black", text: "When you're ready, come back here to build out the rest of your identity — your Brand Identity Card, Logo, and Brand Kit." }),
      ui.el("div", { class: "bh-preview__actions" }, [studioBtn, retakeBtn]),
    ]);
  }

  function renderFull() {
    var state = store.getState();
    if (state.step === "welcome") return renderWelcome();
    if (state.step === "fork") return renderFork();
    if (state.step === "done") return renderDone();
    return renderQuestion();
  }

  BrandHaus.pathIntake = {
    renderFull: renderFull,
    retake: retake,
  };
})();
