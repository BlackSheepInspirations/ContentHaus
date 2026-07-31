/* Purpose 2 Profit — Mini Brand DNA Assessment (lead magnet for the OS preview page).
   Runs 10 of the real 30 assessment questions through the SAME scoring engine
   (BrandHaus.brandDNA) so the result is a genuine — if surface-level — archetype
   read. Ends with a caveat + CTA to unlock the full assessment / OS Access Pass.
   Scoped to #p2pmini. Needs assets/brand-haus-branddna.js loaded first. */
(function () {
  var root = document.getElementById("p2pmini");
  if (!root) return;
  var DNA = (window.BrandHaus && window.BrandHaus.brandDNA) || null;
  var IMG = window.P2P_MINI_IMG || {};
  var CTA = window.P2P_MINI_CTA || { url: "/products/p2p-os-access", label: "Unlock the full assessment" };

  // 10 balanced questions (display text mirrors the full assessment; ids map to the
  // engine's own QUESTIONS so scoreAnswers can read the tension deltas).
  var QS = [
    { id: 1, text: "Pick the space that feels most like your brand.", options: { A: "Minimalist art gallery", B: "Cozy cabin", C: "Lively street market", D: "Sleek modern office" } },
    { id: 3, text: "If your brand were a color palette…", options: { A: "Deep jewel tones", B: "Warm earthy neutrals", C: "Bright, punchy colors", D: "Black, white, and one bold accent" } },
    { id: 7, text: "Which pace best describes your brand?", options: { A: "Calm and steady", B: "Fast-paced and exciting", C: "Deliberate and precise", D: "Playful and spontaneous" } },
    { id: 9, text: "What should your brand voice sound like?", options: { A: "Trusted friend", B: "Confident expert", C: "Witty best friend", D: "Luxury concierge" } },
    { id: 11, text: "What's your relationship with tradition?", options: { A: "Respect craftsmanship", B: "Break the mold", C: "Use what works", D: "Follow my heart" } },
    { id: 13, text: "What matters most in how your brand looks?", options: { A: "Timeless", B: "Cutting edge", C: "Warm and approachable", D: "Polished and elevated" } },
    { id: 15, text: "Which matters more?", options: { A: "Standing out", B: "Belonging", C: "Staying true to myself", D: "Being respected" } },
    { id: 16, text: "Finish this sentence. Success means…", options: { A: "Freedom", B: "Helping people", C: "Making my family proud", D: "Becoming known for excellence", E: "Leaving the world better than I found it" } },
    { id: 18, lead: "A decision promises rapid growth, but it challenges one of your core values.", text: "Which response feels most natural?", options: { A: "My values come first", B: "I'd look for another path", C: "I'd weigh the long-term impact carefully", D: "It depends on what value is being challenged", E: "If it serves the greater mission, I'd consider it" } },
    { id: 20, text: "Pick one word that describes the future of your brand.", options: { A: "Timeless", B: "Beloved", C: "Iconic", D: "Elevated" } }
  ];

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function slugOf(name) { return String(name).toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

  var answers = {}; // id -> optionKey
  var i = 0;

  function renderIntro() {
    root.innerHTML =
      '<div class="pm-card pm-intro">' +
      '<span class="pm-kick">Free · 60-second Brand DNA</span>' +
      '<h3 class="pm-h">Get a first read on your Brand DNA</h3>' +
      '<p class="pm-sub">Ten quick questions from our real assessment reveal the archetype your brand is leaning toward — a taste of what the full Purpose 2 Profit assessment unlocks.</p>' +
      '<button class="pm-btn" type="button" data-pm-start>Start the mini quiz →</button>' +
      '</div>';
    root.querySelector("[data-pm-start]").addEventListener("click", function () { i = 0; renderQ(); });
  }

  function renderQ() {
    var q = QS[i];
    var opts = Object.keys(q.options).map(function (k) {
      var on = answers[q.id] === k ? " is-on" : "";
      return '<button class="pm-opt' + on + '" type="button" data-k="' + k + '">' + esc(q.options[k]) + '</button>';
    }).join("");
    root.innerHTML =
      '<div class="pm-card pm-quiz">' +
      '<div class="pm-prog"><div class="pm-prog-bar" style="width:' + Math.round(((i) / QS.length) * 100) + '%"></div></div>' +
      '<div class="pm-count">Question ' + (i + 1) + ' of ' + QS.length + '</div>' +
      (q.lead ? '<p class="pm-lead">' + esc(q.lead) + '</p>' : "") +
      '<h3 class="pm-q">' + esc(q.text) + '</h3>' +
      '<div class="pm-opts">' + opts + '</div>' +
      '<div class="pm-navrow">' + (i > 0 ? '<button class="pm-back" type="button" data-pm-back>← Back</button>' : "<span></span>") + '</div>' +
      '</div>';
    root.querySelectorAll(".pm-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        answers[q.id] = b.getAttribute("data-k");
        if (i < QS.length - 1) { i++; renderQ(); } else { renderResult(); }
      });
    });
    var back = root.querySelector("[data-pm-back]");
    if (back) back.addEventListener("click", function () { if (i > 0) { i--; renderQ(); } });
  }

  function renderResult() {
    if (!DNA || !DNA.scoreAnswers) { renderFallback(); return; }
    var selections = QS.map(function (q) { return { questionId: q.id, optionKey: answers[q.id] }; }).filter(function (s) { return s.optionKey; });
    var scored, profile;
    try {
      scored = DNA.scoreAnswers(selections);
      var match = DNA.matchProfile(scored.tensionFingerprint || scored);
      profile = (match && (match.best ? match.best.profile : (match.profile || (match[0] && match[0].profile)))) || (DNA.PROFILES && DNA.PROFILES[0]);
    } catch (e) { renderFallback(); return; }
    if (!profile) { renderFallback(); return; }
    var word = (DNA.WHEEL_WORDS && DNA.WHEEL_WORDS[profile.name]) || "";
    var slug = slugOf(profile.name);
    var img = IMG[slug] || "";
    var out = profile.output || {};
    var blurb = out.northStar || out.influenceBlurb || (out.strengths && out.strengths[0]) || "";
    var tags = (out.strengthTags || []).slice(0, 3).map(function (t) { return '<span class="pm-tag">' + esc(t) + '</span>'; }).join("");
    root.innerHTML =
      '<div class="pm-card pm-result">' +
      '<span class="pm-kick">Your surface read</span>' +
      (img ? '<div class="pm-img"><img src="' + esc(img) + '" alt="' + esc(profile.name) + '" loading="lazy"></div>' : "") +
      '<div class="pm-leaning">You\'re leaning toward</div>' +
      '<h3 class="pm-name">' + esc(profile.name) + '</h3>' +
      (word ? '<div class="pm-word">' + esc(word) + '</div>' : "") +
      (tags ? '<div class="pm-tags">' + tags + '</div>' : "") +
      (blurb ? '<p class="pm-blurb">' + esc(blurb) + '</p>' : "") +
      '<div class="pm-caveat">This is just the surface. The full 30-question assessment reveals your exact match percentage, the profiles quietly influencing you, and a complete Brand DNA Blueprint— colors, fonts, voice and mission— to build from.</div>' +
      '<a class="pm-cta" href="' + esc(CTA.url) + '">' + esc(CTA.label) + ' →</a>' +
      '<button class="pm-restart" type="button" data-pm-restart>Retake the mini quiz</button>' +
      '</div>';
    root.querySelector("[data-pm-restart]").addEventListener("click", function () { answers = {}; i = 0; renderIntro(); });
  }

  function renderFallback() {
    root.innerHTML =
      '<div class="pm-card pm-result">' +
      '<span class="pm-kick">Your Brand DNA awaits</span>' +
      '<h3 class="pm-name">Ready to go deeper?</h3>' +
      '<p class="pm-blurb">The full assessment reveals your exact archetype and a complete Brand DNA Blueprint to build from.</p>' +
      '<a class="pm-cta" href="' + esc(CTA.url) + '">' + esc(CTA.label) + ' →</a>' +
      '</div>';
  }

  renderIntro();
})();
