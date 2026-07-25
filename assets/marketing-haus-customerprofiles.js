/**
 * The AI Creator's Marketing Haus — Customer Profiles
 * Depends on marketing-haus-util.js, marketing-haus-engine.js, and
 * marketing-haus-ui.js's exposed MarketingHaus.ui helpers (all must load
 * first). Same named-profile pattern as Look Lock, Brand Kit, and Graphics
 * Haus's Mascot Lock — but for a recurring CUSTOMER TYPE instead of a
 * general aesthetic, a business's own branding, or a character. A
 * customer's basics, biggest problem, buying behavior, content habits,
 * preferred communication style, and what you sell them are authored once
 * per profile, so the Customer Intelligence Studio can generate from
 * whichever profile is active instead of re-asking for all of it every
 * time.
 *
 * Named "Customer Profiles" rather than "Customer Vault" deliberately —
 * marketing-haus-ui.js already has a "Your Vault" panel for saved
 * *generated prompts* (a completely different thing from a persistent
 * input profile). Reusing "Vault" here would make the two easy to
 * confuse in both the code and the UI, so this capability instead joins
 * the existing Look Lock / Brand Kit / Mascot Lock naming family.
 *
 * Deliberately independent of Look Lock's `aesthetic` bridge and of Brand
 * Kit — a customer profile isn't a visual style or a business's own
 * branding, it's who the message is FOR. marketing-haus-customerintel.js
 * reads the active profile directly via getActiveProfile(), the same way
 * Mascot Lock's active mascot gets pulled into the Mascot Generator.
 *
 * Persisted independently, like Look Lock/Brand Kit/Mascot Lock — not
 * part of a Vault/Recent Log snapshot.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;

  var STORAGE_KEY = "marketingHausCustomerProfiles";
  var MAX_PROFILES = 5;

  var CUSTOMER_TYPE_OPTIONS = ["Etsy Beginner", "AI Hobbyist", "Overwhelmed Creator", "Side Hustler", "Agency or Freelancer"];
  var EXPERIENCE_LEVEL_OPTIONS = ["Complete Beginner", "Some Experience", "Advanced"];
  var AGE_RANGE_OPTIONS = ["18-24", "25-34", "35-44", "45-54", "55+"];
  var DECISION_STYLE_OPTIONS = ["Impulsive / Quick Decision", "Researches Heavily First", "Needs Social Proof", "Very Price-Sensitive"];
  var CONTENT_FORMAT_OPTIONS = ["Short-Form Video", "Long-Form Video", "Written / Blog", "Live & Community"];
  var COMMUNICATION_STYLE_OPTIONS = ["Casual & Friendly", "Direct & No-Fluff", "Encouraging & Warm", "Expert & Authoritative"];

  function buildProfileFields() {
    return {
      customerType: makeField("", CUSTOMER_TYPE_OPTIONS),
      experienceLevel: makeField("", EXPERIENCE_LEVEL_OPTIONS),
      ageRange: makeField("", AGE_RANGE_OPTIONS),
      incomeSituation: makeField("", [], { isFreeText: true }),
      topFrustration: makeField("", [], { isFreeText: true }),
      whatKeepsThemStuck: makeField("", [], { isFreeText: true }),
      desiredOutcome: makeField("", [], { isFreeText: true }),
      objections: makeField("", [], { isFreeText: true }),
      buyingTriggers: makeField("", [], { isFreeText: true }),
      decisionStyle: makeField("", DECISION_STYLE_OPTIONS),
      whereTheySpendTime: makeField("", [], { isFreeText: true }),
      whatTheySearch: makeField("", [], { isFreeText: true }),
      contentFormatPreference: makeField("", CONTENT_FORMAT_OPTIONS),
      preferredCommunicationStyle: makeField("", COMMUNICATION_STYLE_OPTIONS),
      wordsTheyUse: makeField("", [], { isFreeText: true }),
      whatYouSellThem: makeField("", [], { isFreeText: true }),
      whyTheyChooseYou: makeField("", [], { isFreeText: true }),
    };
  }

  function readPersisted() {
    if (!window.localStorage) return { profiles: [], activeProfileId: null };
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (parsed && Array.isArray(parsed.profiles)) return { profiles: parsed.profiles, activeProfileId: parsed.activeProfileId || null };
    } catch (e) {
      // fall through to default
    }
    return { profiles: [], activeProfileId: null };
  }

  function writePersisted(state) {
    if (!window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profiles: state.profiles, activeProfileId: state.activeProfileId }));
  }

  var store = MarketingHaus.util.createStore(readPersisted());

  function commit(patch) {
    store.setState(patch);
    writePersisted(store.getState());
  }

  function getAllProfiles() {
    return store.getState().profiles;
  }
  function isFull() {
    return getAllProfiles().length >= MAX_PROFILES;
  }
  function getActiveProfileId() {
    return store.getState().activeProfileId;
  }
  function getActiveProfile() {
    var id = getActiveProfileId();
    if (!id) return null;
    return getAllProfiles().filter(function (p) { return p.id === id; })[0] || null;
  }

  function createProfile(name) {
    var state = store.getState();
    if (state.profiles.length >= MAX_PROFILES) {
      return { ok: false, reason: "You already have " + MAX_PROFILES + " customer profiles saved — delete one to create another." };
    }
    var profile = { id: "mhcust-" + Date.now() + "-" + Math.floor(Math.random() * 10000), name: (name || "").trim() || "Untitled Customer", createdAt: Date.now(), fields: buildProfileFields() };
    commit({ profiles: state.profiles.concat([profile]) });
    return { ok: true, id: profile.id };
  }

  function deleteProfile(id) {
    var state = store.getState();
    commit({ profiles: state.profiles.filter(function (p) { return p.id !== id; }), activeProfileId: state.activeProfileId === id ? null : state.activeProfileId });
  }

  function renameProfile(id, newName) {
    var state = store.getState();
    commit({ profiles: state.profiles.map(function (p) { return p.id === id ? Object.assign({}, p, { name: (newName || "").trim() || "Untitled Customer" }) : p; }) });
  }

  function setActiveProfile(id) {
    commit({ activeProfileId: id });
  }

  function updateProfileField(id, fieldName, changes) {
    var state = store.getState();
    commit({
      profiles: state.profiles.map(function (p) {
        if (p.id !== id) return p;
        var fields = Object.assign({}, p.fields);
        fields[fieldName] = Object.assign({}, fields[fieldName], changes);
        return Object.assign({}, p, { fields: fields });
      }),
    });
  }

  // ---------------------------------------------------------------------
  // UI — persistent right-sidebar section, shown only on the Customer
  // Intelligence Studio tab (that's the only mode with any use for it).
  // ---------------------------------------------------------------------
  var expandedProfileId = null;
  var renamingProfileId = null;
  var profilesExpanded = false;

  function fieldOnChange(profile) {
    return function (entry, changes) {
      updateProfileField(profile.id, entry.name, changes);
      MarketingHaus.ui.renderApp();
    };
  }

  function renderProfileFields(profile) {
    var ui = MarketingHaus.ui;
    var wrap = ui.el("div", { class: "mh-field-group__fields" });
    var onChange = fieldOnChange(profile);

    wrap.appendChild(ui.renderFieldGroup("Customer Basics", [
      { label: "Customer Type", field: profile.fields.customerType, name: "customerType", placeholder: "e.g. Etsy Beginner" },
      { label: "Experience Level", field: profile.fields.experienceLevel, name: "experienceLevel" },
      { label: "Age Range", field: profile.fields.ageRange, name: "ageRange" },
      { label: "Income Situation", field: profile.fields.incomeSituation, name: "incomeSituation", placeholder: "e.g. works a full-time job, building this on the side" },
    ], onChange));

    wrap.appendChild(ui.renderFieldGroup("Biggest Problem", [
      { label: "Top Frustration", field: profile.fields.topFrustration, name: "topFrustration", placeholder: "e.g. feels overwhelmed by all the tools and options" },
      { label: "What Keeps Them Stuck", field: profile.fields.whatKeepsThemStuck, name: "whatKeepsThemStuck", placeholder: "e.g. doesn't know where to start, afraid of wasting money" },
      { label: "Desired Outcome", field: profile.fields.desiredOutcome, name: "desiredOutcome", placeholder: "e.g. wants a simple, repeatable system that actually works" },
    ], onChange));

    wrap.appendChild(ui.renderFieldGroup("Buying Behavior", [
      { label: "Objections (what stops them buying)", field: profile.fields.objections, name: "objections", placeholder: "e.g. \"I've bought courses before and never finished them\"" },
      { label: "Buying Triggers (what convinces them)", field: profile.fields.buyingTriggers, name: "buyingTriggers", placeholder: "e.g. real examples, a clear step-by-step process, social proof" },
      { label: "Decision Style", field: profile.fields.decisionStyle, name: "decisionStyle" },
    ], onChange));

    wrap.appendChild(ui.renderFieldGroup("Content Habits", [
      { label: "Where They Spend Time", field: profile.fields.whereTheySpendTime, name: "whereTheySpendTime", placeholder: "e.g. TikTok, Facebook groups, Etsy seller forums" },
      { label: "What They Search", field: profile.fields.whatTheySearch, name: "whatTheySearch", placeholder: "e.g. \"how to sell printables on Etsy\"" },
      { label: "Content Format Preference", field: profile.fields.contentFormatPreference, name: "contentFormatPreference" },
    ], onChange));

    wrap.appendChild(ui.renderFieldGroup("How They Want to Be Spoken To", [
      { label: "Preferred Communication Style", field: profile.fields.preferredCommunicationStyle, name: "preferredCommunicationStyle" },
      { label: "Words They Use", field: profile.fields.wordsTheyUse, name: "wordsTheyUse", placeholder: "e.g. their own slang, phrases, or shorthand" },
    ], onChange));

    wrap.appendChild(ui.renderFieldGroup("What You Sell Them", [
      { label: "What You Sell Them", field: profile.fields.whatYouSellThem, name: "whatYouSellThem", placeholder: "e.g. done-for-you Etsy listing templates" },
      { label: "Why They Choose You", field: profile.fields.whyTheyChooseYou, name: "whyTheyChooseYou", placeholder: "e.g. it's simpler and faster than figuring it out alone" },
    ], onChange));

    return wrap;
  }

  function renderProfileCard(profile, isActive) {
    var ui = MarketingHaus.ui;
    var isExpanded = expandedProfileId === profile.id;

    var titleRow;
    if (renamingProfileId === profile.id) {
      var titleInput = ui.el("input", { type: "text", class: "mh-saved__item-title-input", value: profile.name });
      var confirmRename = function () { renameProfile(profile.id, titleInput.value.trim() || profile.name); renamingProfileId = null; MarketingHaus.ui.renderApp(); };
      titleInput.addEventListener("keydown", function (e) { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") { renamingProfileId = null; MarketingHaus.ui.renderApp(); } });
      titleInput.addEventListener("blur", confirmRename);
      titleRow = ui.el("div", { class: "mh-saved__item-title-row" }, [titleInput]);
    } else {
      var renameBtn = ui.el("button", { type: "button", class: "mh-saved__rename-btn", title: "Rename" }, [ui.icon("edit")]);
      renameBtn.addEventListener("click", function () { renamingProfileId = profile.id; MarketingHaus.ui.renderApp(); });
      titleRow = ui.el("div", { class: "mh-saved__item-title-row" }, [
        ui.el("p", { class: "mh-saved__item-title", text: profile.name + (isActive ? " (active)" : "") }),
        renameBtn,
      ]);
    }

    var activeBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small " + (isActive ? "mh-btn--reset" : "mh-btn--copy"), text: isActive ? "Turn Off" : "Set Active" });
    activeBtn.addEventListener("click", function () { setActiveProfile(isActive ? null : profile.id); MarketingHaus.ui.renderApp(); });

    var expandBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--small", text: isExpanded ? "Hide Fields" : "Edit Fields" });
    expandBtn.addEventListener("click", function () { expandedProfileId = isExpanded ? null : profile.id; MarketingHaus.ui.renderApp(); });

    var deleteBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--delete mh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { deleteProfile(profile.id); MarketingHaus.ui.renderApp(); });

    var children = [titleRow, ui.el("div", { class: "mh-saved__item-actions" }, [activeBtn, expandBtn, deleteBtn])];
    if (isExpanded) children.push(renderProfileFields(profile));

    return ui.el("div", { class: "mh-saved__item" + (isActive ? " mh-collection__item--combined" : ""), style: isActive ? "border-color: var(--mh-espresso);" : "" }, children);
  }

  function renderSection(root) {
    var ui = MarketingHaus.ui;
    var profiles = getAllProfiles();
    var activeProfile = getActiveProfile();

    var list = ui.el("div", { class: "mh-saved__list" });
    if (!profiles.length) {
      list.appendChild(ui.el("p", { class: "mh-saved__empty", text: "No customer profiles yet — create one below, then generate from it in the Customer Intelligence Studio." }));
    } else {
      // Collapsed by default to just the active profile (or the first one if none is active).
      var visible = profilesExpanded ? profiles : [profiles[activeProfile ? profiles.indexOf(activeProfile) : 0] || profiles[0]];
      visible.forEach(function (profile) { list.appendChild(renderProfileCard(profile, !!activeProfile && activeProfile.id === profile.id)); });
    }

    var createRow;
    if (!isFull()) {
      var nameInput = ui.el("input", { type: "text", class: "mh-field__custom", placeholder: "New profile name, e.g. \"The Etsy Beginner\"" });
      var createBtn = ui.el("button", { type: "button", class: "mh-btn mh-btn--add mh-btn--small", text: "+ Create Customer Profile" });
      createBtn.addEventListener("click", function () {
        var result = createProfile(nameInput.value);
        if (result.ok) MarketingHaus.ui.renderApp();
      });
      createRow = ui.el("div", { class: "mh-companion__controls" }, [nameInput, createBtn]);
    } else {
      createRow = ui.el("p", { class: "mh-field-group__subtitle", text: "You have " + MAX_PROFILES + "/" + MAX_PROFILES + " customer profiles — delete one to create another." });
    }

    var headerChildren = [ui.el("h3", { class: "mh-saved__title" }, [ui.icon("bulb"), ui.el("span", { text: "Customer Profiles (" + profiles.length + "/" + MAX_PROFILES + ")" })])];
    if (profiles.length > 1) {
      var toggleBtn = ui.el("button", { type: "button", class: "mh-faq__toggle" }, [
        ui.icon(profilesExpanded ? "eyeOff" : "eye"),
        ui.el("span", { text: profilesExpanded ? "Hide" : "Show full list" }),
      ]);
      toggleBtn.addEventListener("click", function () { profilesExpanded = !profilesExpanded; MarketingHaus.ui.renderApp(); });
      headerChildren.push(toggleBtn);
    }
    root.appendChild(ui.el("div", { class: "mh-saved" }, [
      ui.el("div", { class: "mh-faq__header" }, headerChildren),
      ui.el("p", { class: "mh-field-group__subtitle", text: "Define a customer type once — basics, biggest problem, buying behavior, content habits, and how they want to be spoken to — and the active profile carries into everything the Customer Intelligence Studio generates." }),
      list,
      createRow,
    ]));
  }

  MarketingHaus.customerProfiles = {
    MAX_PROFILES: MAX_PROFILES,
    getAllProfiles: getAllProfiles,
    isFull: isFull,
    getActiveProfile: getActiveProfile,
    getActiveProfileId: getActiveProfileId,
    createProfile: createProfile,
    deleteProfile: deleteProfile,
    renameProfile: renameProfile,
    setActiveProfile: setActiveProfile,
    updateProfileField: updateProfileField,
    renderSection: renderSection,
  };
})();
