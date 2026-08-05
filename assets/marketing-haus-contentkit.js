/**
 * The AI Creator's Marketing Haus — Social Content Kit (flagship).
 * Describe the post once -> get a prompt that yields EVERY piece a creator
 * needs, peeled out separately (Hook / Title / Caption / Keywords / CTA /
 * Hashtags / On-screen text), with a Peel-vs-Combine toggle. Inputs:
 * platform + size (MarketingHaus.sizing), topic, mood/tone (+ type your own),
 * optional smart drill-down questions. Prepends the shared Business/Voice DNA
 * + Brand Kit like every text studio. Depends on util, engine, styledna,
 * sizing, and MarketingHaus.ui (all load first).
 */
(function () {
  "use strict";
  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;
  var makeField = MarketingHaus.util.makeField;

  var TONE_OPTIONS = [
    "Warm", "Bold", "Playful", "Professional", "Inspiring", "Urgent",
    "Conversational", "Luxe", "Bright and fun", "Calm and grounded",
  ];

  // key = label shown + used in the prompt; desc = what the AI should produce.
  var DELIVERABLES = [
    { key: "Hook", desc: "a scroll-stopping first line (the opening 1-2 seconds)" },
    { key: "Title", desc: "a short, punchy title or headline" },
    { key: "Caption", desc: "the main caption / body copy in the chosen tone" },
    { key: "Keywords", desc: "6-10 SEO / discovery keywords, comma-separated" },
    { key: "CTA", desc: "one clear, specific call to action" },
    { key: "Hashtags", desc: "8-12 relevant hashtags on a single comma-separated line" },
    { key: "On-screen text", desc: "3-5 short on-screen text overlays for the video or graphic" },
  ];
  var DEFAULT_DELIVERABLES = ["Hook", "Caption", "CTA", "Hashtags"];

  var PRESETS = [
    { name: "Full IG launch post", description: "Instagram feed · warm · hook, caption, CTA, hashtags.",
      apply: { platform: "Instagram", format: "Feed post", tone: "Warm", deliverables: ["Hook", "Caption", "CTA", "Hashtags"], combine: false } },
    { name: "TikTok hook + on-screen", description: "TikTok · bold · hook, on-screen text, caption, hashtags.",
      apply: { platform: "TikTok", format: "Video / cover", tone: "Bold", deliverables: ["Hook", "On-screen text", "Caption", "Hashtags"], combine: false } },
    { name: "Pinterest discovery pin", description: "Pinterest · bright · title, keywords, caption, hashtags.",
      apply: { platform: "Pinterest", format: "Standard pin", tone: "Bright and fun", deliverables: ["Title", "Keywords", "Caption", "Hashtags"], combine: false } },
  ];

  function initialState() {
    var plats = MarketingHaus.sizing.platformLabels();
    var firstPlat = "Instagram";
    var fmts = MarketingHaus.sizing.formatLabels(firstPlat);
    return {
      platform: makeField(firstPlat, plats),
      format: makeField(fmts[0] || "", fmts),
      topic: makeField("", [], { isFreeText: true }),
      tone: makeField("", TONE_OPTIONS),
      audience: makeField("", [], { isFreeText: true }),
      action: makeField("", [], { isFreeText: true }),
      angle: makeField("", [], { isFreeText: true }),
      deliverables: DEFAULT_DELIVERABLES.slice(),
      combine: false,
      drillOpen: false,
    };
  }

  var store = MarketingHaus.util.createStore(initialState());
  function updateField(name, changes) { MarketingHaus.util.updateField(store, name, changes); }
  var rv = function (f) { return MarketingHaus.engine.resolveFieldValue(f); };

  function onPlatformChange(changes) {
    updateField("platform", changes);
    var plat = rv(store.getState().platform);
    var fmts = MarketingHaus.sizing.formatLabels(plat);
    store.setState({ format: makeField(fmts[0] || "", fmts) });
    MarketingHaus.ui.renderApp();
  }

  function toggleDeliverable(key, on) {
    var s = store.getState(), list = s.deliverables.slice();
    var i = list.indexOf(key);
    if (on && i === -1) list.push(key);
    else if (!on && i !== -1) list.splice(i, 1);
    store.setState({ deliverables: list });
    MarketingHaus.ui.renderApp();
  }

  function applyPreset(preset) {
    var a = preset.apply, s = store.getState();
    var fmts = MarketingHaus.sizing.formatLabels(a.platform);
    store.setState({
      platform: Object.assign({}, s.platform, { value: a.platform, customValue: "" }),
      format: makeField(a.format || fmts[0] || "", fmts),
      tone: Object.assign({}, s.tone, { value: a.tone, customValue: "" }),
      deliverables: (a.deliverables || DEFAULT_DELIVERABLES).slice(),
      combine: !!a.combine,
    });
  }

  function randomize() {
    var s = store.getState();
    if (s.tone.includeInPrompt !== false) updateField("tone", { value: TONE_OPTIONS[Math.floor(Math.random() * TONE_OPTIONS.length)], customValue: "" });
  }
  function reset() { store.setState(initialState()); }

  function assemblePrompt() {
    var s = store.getState();
    var voice = MarketingHaus.engine.resolveFields(
      MarketingHaus.styleDNA.getVoiceEntries().concat(MarketingHaus.brandKit.getActiveKitEntries())
    );
    var platform = rv(s.platform) || "social media";
    var format = rv(s.format) || "";
    var topic = rv(s.topic), tone = rv(s.tone);
    var audience = rv(s.audience), action = rv(s.action), angle = rv(s.angle);
    var sizing = MarketingHaus.sizing.promptClause(platform, format);
    var picked = DELIVERABLES.filter(function (d) { return s.deliverables.indexOf(d.key) !== -1; });

    var lines = [];
    var ctx = "Create " + platform + " content" + (topic ? " about " + topic : "") + ".";
    lines.push(ctx);
    if (tone) lines.push("Tone: " + tone + ".");
    var extra = [];
    if (audience) extra.push("It's for " + audience + ".");
    if (action) extra.push("The one action I want them to take: " + action + ".");
    if (angle) extra.push("The angle / promise: " + angle + ".");
    if (extra.length) lines.push(extra.join(" "));
    if (voice.length) lines.push("Brand voice: " + voice.map(function (r) { return r.value; }).join(", ") + ".");
    if (sizing) lines.push("If producing any graphic, design it " + sizing + ".");
    if (picked.length) {
      if (s.combine) {
        lines.push("Weave the following into ONE ready-to-post " + platform + " caption: " + picked.map(function (d) { return d.key.toLowerCase(); }).join(", ") + ".");
      } else {
        lines.push("Produce each of the following as its own clearly-labeled, ready-to-copy block:");
        picked.forEach(function (d) { lines.push("- " + d.key + ": " + d.desc); });
      }
    }
    var text = lines.join("\n");
    return { text: text, fragments: picked.map(function (d) { return d.key; }) };
  }

  function getSelectionsByGroup() {
    var s = store.getState();
    var items = MarketingHaus.engine.resolveFields([
      { label: "Platform", field: s.platform },
      { label: "Format", field: s.format },
      { label: "Topic", field: s.topic },
      { label: "Tone", field: s.tone },
      { label: "Audience", field: s.audience },
      { label: "Goal", field: s.action },
      { label: "Angle", field: s.angle },
    ]);
    if (s.deliverables.length) items.push({ label: "Deliverables", value: s.deliverables.join(", ") });
    items.push({ label: "Output", value: s.combine ? "Combined into one" : "Peeled out separately" });
    return items.length ? [{ title: "Social Content Kit", items: items }] : [];
  }

  function renderPanel() {
    var ui = MarketingHaus.ui;
    var s = store.getState();
    var wrap = ui.el("div", { class: "mh-panel" });

    var presetRow = ui.renderPresetRow(PRESETS, function (p) { applyPreset(p); ui.renderApp(); }, "Starter Presets — click one, then customize");
    if (presetRow) wrap.appendChild(presetRow);

    var sizeChip = MarketingHaus.sizing.chip(rv(s.platform), rv(s.format));
    wrap.appendChild(ui.renderFieldGroup("Platform & Size", [
      { label: "Platform", field: s.platform },
      { label: "Format", field: s.format },
    ], function (entry, changes) {
      if (entry.label === "Platform") onPlatformChange(changes);
      else { updateField("format", changes); ui.renderApp(); }
    }, sizeChip ? ("Optimal size: " + sizeChip + " — added to your prompt.") : "Pick where this is going; the right size rides along."));

    wrap.appendChild(ui.renderFieldGroup("Topic",
      [{ label: "What's this post about?", field: s.topic, placeholder: "e.g. \"launching my new focus planner for overwhelmed solopreneurs\"" }],
      function (entry, changes) { updateField("topic", changes); ui.renderApp(); },
      "The core idea — what you're posting about."
    ));

    wrap.appendChild(ui.renderFieldGroup("Mood / Tone", [{ label: "Tone", field: s.tone }],
      function (entry, changes) { updateField("tone", changes); ui.renderApp(); }, "Pick one — or type your own."));

    wrap.appendChild(ui.renderSubPanel(
      "Help me drill down (optional — sharper results)",
      s.drillOpen,
      function (checked) { store.setState({ drillOpen: checked }); ui.renderApp(); },
      function () {
        return ui.renderPlainFieldRow([
          { label: "Who is it for?", field: s.audience, placeholder: "e.g. busy solopreneurs" },
          { label: "One action you want?", field: s.action, placeholder: "e.g. tap the link to grab it" },
          { label: "Your angle / promise?", field: s.angle, placeholder: "e.g. one page, whole day sorted" },
        ], function (entry, changes) {
          if (entry.label === "Who is it for?") updateField("audience", changes);
          else if (entry.label === "One action you want?") updateField("action", changes);
          else updateField("angle", changes);
          ui.renderApp();
        });
      },
      "Answer a couple and the AI writes something far more specific."
    ));

    wrap.appendChild(ui.renderCappedChecklist({
      title: "What do you need?",
      subtitle: "Check every piece to generate — each comes back as its own copy-ready block.",
      icon: "sparkle",
      items: DELIVERABLES.map(function (d) { return d.key; }),
      selected: s.deliverables,
      cap: DELIVERABLES.length,
      onToggle: toggleDeliverable,
    }));

    wrap.appendChild(ui.renderFieldGroup ? ui.el("div", { class: "mh-ck-outmode" }, [
      ui.el("p", { class: "mh-field-group__subtitle", text: "How should they come out?" }),
      ui.renderPillToggle([
        { isActive: !s.combine, icon: "sparkle", title: "Peel out separately", onClick: function () { store.setState({ combine: false }); ui.renderApp(); } },
        { isActive: s.combine, icon: "document", title: "Combine into one", onClick: function () { store.setState({ combine: true }); ui.renderApp(); } },
      ]),
    ]) : ui.el("div"));

    return wrap;
  }

  MarketingHaus.contentkit = {
    renderPanel: renderPanel,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    randomize: randomize,
    reset: reset,
    applyPreset: applyPreset,
  };
})();
