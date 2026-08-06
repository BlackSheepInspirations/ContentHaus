/**
 * The AI Creator's Marketing Haus — Customer Intelligence Studio
 * Depends on marketing-haus-util.js, marketing-haus-engine.js,
 * marketing-haus-customerprofiles.js, and marketing-haus-generators.js
 * (all must load first). Two things in one file:
 *
 * 1. Registers a single Page Bundle generator, "customer-intelligence",
 *    on the existing narrow-generator engine — no new engine capability
 *    needed. Its `computeExtraTokens` reads the active Customer Profile
 *    (marketing-haus-customerprofiles.js) the same way
 *    marketing-haus-generators-mediakit.js reads the active Brand Kit:
 *    live, at assembly time, with sensible generic fallback text (plus a
 *    setup nudge) when no profile is active.
 *
 * 2. A thin `modeApi` adapter, MarketingHaus.customerintel, giving this
 *    one generator its own top-level Studio tab instead of living inside
 *    the shared Quick Generators grid. It calls the "...ById" functions
 *    marketing-haus-generators.js exposes for exactly this purpose —
 *    NOT the plain currentId-based ones (MarketingHaus.generators.render
 *    Panel/assemblePrompt/etc.), which share one module-level `currentId`
 *    with the Quick Generators grid. Using those here would mean opening
 *    this tab silently hijacks whatever generator the Quick Generators
 *    tab had open, and vice versa on the way back.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var GENERATOR_ID = "customer-intelligence";

  MarketingHaus.generatorEngine.registerGenerator({
    id: GENERATOR_ID,
    textOnly: true,
    label: "Customer Intelligence Studio",
    icon: "person",
    // Has its own top-level Studio tab (see the adapter below) — must not
    // also appear as a duplicate card in the Quick Generators grid.
    hideFromGrid: true,
    description: "Generate a real customer-intelligence report — persona, psychology, voice, content ideas, an AI persona prompt, and a Customer Voice Vault — from the active Customer Profile in the sidebar.",
    fieldGroupTitle: "Customize This Generation",

    fields: [
      { name: "generationFocus", label: "What Is This For? (optional)", isFreeText: true, defaultValue: "", placeholder: "e.g. an email campaign, a new product launch, a batch of social posts" },
    ],

    computeExtraTokens: function (valueMap) {
      var profile = MarketingHaus.customerProfiles && MarketingHaus.customerProfiles.getActiveProfile();
      var resolve = MarketingHaus.engine.resolveFieldValue;
      var f = profile ? profile.fields : null;
      var get = function (key, fallback) { return (f && resolve(f[key])) || fallback; };

      var customerType = get("customerType", "small business owner or creator building their brand");
      var experienceLevel = get("experienceLevel", "somewhere between beginner and experienced");
      var ageRange = get("ageRange", "a mixed age range");
      var incomeSituation = get("incomeSituation", "juggling this alongside other financial responsibilities");
      var topFrustration = get("topFrustration", "feeling overwhelmed by too many options and not enough clear direction");
      var whatKeepsThemStuck = get("whatKeepsThemStuck", "not knowing which step to take first");
      var desiredOutcome = get("desiredOutcome", "a simple, working system they can trust");
      var objections = get("objections", "worry that this won't actually work for them, or that they'll waste money");
      var buyingTriggers = get("buyingTriggers", "clear proof it works, real examples, and an easy next step");
      var decisionStyle = get("decisionStyle", "researches a bit before deciding");
      var whereTheySpendTime = get("whereTheySpendTime", "social media and online communities related to their interests");
      var whatTheySearch = get("whatTheySearch", "practical how-to answers to their specific problem");
      var contentFormatPreference = get("contentFormatPreference", "Short-Form Video");
      var preferredCommunicationStyle = get("preferredCommunicationStyle", "Casual & Friendly");
      var wordsTheyUse = get("wordsTheyUse", "plain, everyday language rather than jargon");
      var whatYouSellThem = get("whatYouSellThem", "your product or service");
      var whyTheyChooseYou = get("whyTheyChooseYou", "it makes this easier and faster than figuring it out alone");

      return {
        profileName: profile ? profile.name : "your ideal customer",
        customerArticle: /^[aeiou]/i.test(customerType) ? "an" : "a",
        customerBasicsClause: customerType + ", " + experienceLevel.toLowerCase() + ", typically " + ageRange + ", " + incomeSituation,
        frustrationClause: "Their biggest frustration is " + topFrustration + ". What keeps them stuck is " + whatKeepsThemStuck + ". What they actually want is " + desiredOutcome + ".",
        objectionsClause: "What stops them from buying: " + objections + ". What convinces them: " + buyingTriggers + ". Decision style: " + decisionStyle + ".",
        contentHabitsClause: "They spend time in/on " + whereTheySpendTime + ", searching for things like \"" + whatTheySearch + "\", and prefer " + contentFormatPreference + " content.",
        communicationStyleClause: "Speak to them in a " + preferredCommunicationStyle + " way, using language like: " + wordsTheyUse + ".",
        whatYouSellClause: "You sell them " + whatYouSellThem + ". They choose you because " + whyTheyChooseYou + ".",
        generationFocusClause: valueMap.generationFocus ? " This is specifically for: " + valueMap.generationFocus + "." : "",
        profileSetupNote: profile ? "" : " (Tip: set up a Customer Profile in the sidebar to generate this from a real customer type instead of generic placeholders.)",
      };
    },

    pageTypesCap: 6,
    pageTypesLabel: "Report Sections",
    defaultPageTypes: ["persona-overview", "psychology", "voice-messaging"],
    bundleBlockTitle: "Your Customer Intelligence Report",
    pageTypes: [
      {
        id: "persona-overview",
        label: "Persona Overview",
        promptTemplate:
          "CUSTOMER INTELLIGENCE — PERSONA OVERVIEW\n\n" +
          "Write a persona overview for {profileName}, {customerArticle} {customerBasicsClause}.{generationFocusClause}\n\n" +
          "Cover: who they are day-to-day, their current situation, and how they think about their goals. Write in a natural, human voice — no generic demographic filler, focus on what actually makes this customer recognizable and real.{profileSetupNote}",
      },
      {
        id: "psychology",
        label: "Emotional & Buying Psychology",
        promptTemplate:
          "CUSTOMER INTELLIGENCE — EMOTIONAL & BUYING PSYCHOLOGY\n\n" +
          "For {profileName}: {frustrationClause} {objectionsClause}{generationFocusClause}\n\n" +
          "Expand this into a clear psychology profile — their emotional drivers, what they're afraid of, what they're hoping for, and exactly what needs to be true for them to say yes. Prioritize emotional truth over generic marketing language.",
      },
      {
        id: "voice-messaging",
        label: "Voice & Messaging Guide",
        promptTemplate:
          "CUSTOMER INTELLIGENCE — VOICE & MESSAGING GUIDE\n\n" +
          "For {profileName}: {communicationStyleClause}{generationFocusClause}\n\n" +
          "Write a voice and messaging guide: how to talk to this customer, words/phrases to use and avoid, and 3-5 messaging angles that would resonate with them specifically, matched to their communication style and their own words.",
      },
      {
        id: "content-product-ideas",
        label: "Content & Product Ideas",
        promptTemplate:
          "CUSTOMER INTELLIGENCE — CONTENT & PRODUCT IDEAS\n\n" +
          "For {profileName}: {contentHabitsClause} {whatYouSellClause}{generationFocusClause}\n\n" +
          "Generate content and product ideas this customer would actually engage with: a few content hook ideas, a few email subject line angles, and a few product or offer angle ideas — all grounded in where they spend time and what they're searching for.",
      },
      {
        id: "ai-persona-prompt",
        label: "AI Persona Prompt",
        promptTemplate:
          "CUSTOMER INTELLIGENCE — AI PERSONA PROMPT\n\n" +
          "Write a portable system-style prompt for {profileName}: {customerArticle} {customerBasicsClause}. {frustrationClause} {communicationStyleClause}{generationFocusClause}\n\n" +
          "The prompt should instruct any AI assistant to write every future piece of marketing, content, or copy as though speaking directly to this exact customer — their frustrations, their language, and their communication style — so it can be pasted at the start of any other conversation to keep tone consistent.",
      },
      {
        id: "customer-voice-vault",
        label: "Customer Voice Vault",
        promptTemplate:
          "CUSTOMER INTELLIGENCE — CUSTOMER VOICE VAULT\n\n" +
          "For {profileName}: {communicationStyleClause} {objectionsClause}{generationFocusClause}\n\n" +
          "Generate a categorized list of authentic language this customer would actually use — phrases they'd say about their problem, words they'd use to describe what they want, questions they'd ask before buying, and objections they'd raise. Prioritize a small number of sharp, realistic, non-repetitive items over hitting any exact count — fewer authentic phrases are more useful than a long list of filler that starts repeating itself.",
      },
    ],
  });

  // ---------------------------------------------------------------------
  // Thin modeApi adapter — see file header for why this uses the "...ById"
  // functions instead of the plain currentId-based ones. Property name
  // must be all-lowercase "customerintel" to match the mode key in
  // marketing-haus-ui.js's MODES array — renderAppContent looks this up
  // via MarketingHaus[activeMode], which is case-sensitive.
  // ---------------------------------------------------------------------
  MarketingHaus.customerintel = {
    renderPanel: function () { return MarketingHaus.generators.renderGeneratorPanelById(GENERATOR_ID); },
    assemblePrompt: function () { return MarketingHaus.generators.assemblePromptForId(GENERATOR_ID); },
    getSelectionsByGroup: function () { return MarketingHaus.generators.getSelectionsByGroupForId(GENERATOR_ID); },
    randomize: function () { MarketingHaus.generators.randomizeGeneratorById(GENERATOR_ID); },
    reset: function () { MarketingHaus.generators.resetGeneratorById(GENERATOR_ID); },
    getState: function () { return MarketingHaus.generators.getGeneratorStore(GENERATOR_ID).getState(); },
    setState: function (s) { MarketingHaus.generators.getGeneratorStore(GENERATOR_ID).setState(s); },
  };
})();
