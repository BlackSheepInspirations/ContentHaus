/**
 * The AI Creator's Marketing Haus — Content Studio (flagship, unified).
 * The one place to make any post or ad: describe it once, choose a Purpose
 * (organic post OR a paid ad), and get a prompt that yields every piece a
 * creator needs — peeled out separately (Hook / Title / Caption / Keywords
 * / CTA / Hashtags / On-screen text, plus Headline / Primary text /
 * Description for ads) with a Peel-vs-Combine toggle. Optionally also emits
 * a matching image prompt (Subject / Background / Lighting / Art Style).
 *
 * Consolidates what used to be three separate studios — Social Media, Ad
 * Copy, and the old Content Kit — into one. Owns its own Tone + Audience
 * (peeled out of the shared DNA bar). Depends on util, engine, styledna,
 * brandkit, sizing, and MarketingHaus.ui (all load first).
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

  var PURPOSE_OPTIONS = [
    "Sell a product or service", "Promote a live or event",
    "Launch / announce something new", "Grow followers / reach",
    "Educate / give value", "Build trust / authority",
    "Drive traffic (link in bio)", "Entertain / relate", "Run a paid ad",
  ];
  var PAID_AD = "Run a paid ad";

  // Ad-specific fields (folded in from the old Ad Copy studio) — only shown
  // when Purpose = Run a paid ad.
  var OBJECTIVE_OPTIONS = [
    "brand awareness", "drive traffic", "generate leads",
    "drive sales / conversions", "app installs", "retarget past visitors",
  ];
  var URGENCY_OPTIONS = ["none", "limited time", "limited quantity", "countdown / deadline"];
  var HEADLINE_STYLE_OPTIONS = [
    "benefit-driven", "curiosity / question", "urgency / scarcity",
    "social proof", "direct offer", "problem / solution",
  ];

  // Fine-tune refinements (folded in from the old Social Media studio).
  var HOOK_STYLE_OPTIONS = [
    "question hook", "bold statement", "relatable pain point", "curiosity gap",
    "before / after", "myth-busting", "quick tip / how-to",
  ];
  var HASHTAG_STYLE_OPTIONS = ["none", "minimal (3-5 niche tags)", "broad reach mix", "branded hashtag included"];
  var EMOJI_USAGE_OPTIONS = ["none", "light touch", "expressive"];
  var SLIDE_COUNT_OPTIONS = ["not a carousel", "3 slides", "4 slides", "5 slides", "6 slides", "7 slides", "8 slides", "9 slides", "10 slides"];

  // Image-prompt sub-panel — a trimmed set (not a full character build).
  var BACKGROUND_OPTIONS = [
    "clean studio / solid color", "lifestyle / in-context", "outdoor / natural light",
    "flat lay", "gradient / abstract", "bokeh / blurred", "textured surface", "on-brand color block",
  ];
  var LIGHTING_OPTIONS = [
    "soft natural", "bright and airy", "studio softbox", "golden hour",
    "dramatic / moody", "high-key", "neon",
  ];
  var ART_STYLE_OPTIONS = [
    "photorealistic", "3D render", "flat illustration", "cartoon",
    "comic book", "watercolor", "line art", "cinematic",
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
  // Extra deliverables that only make sense for a paid ad.
  var AD_DELIVERABLES = [
    { key: "Headline", desc: "a short ad headline (under ~40 characters)" },
    { key: "Primary text", desc: "the main ad body / primary text" },
    { key: "Description", desc: "a one-line ad description / link description" },
  ];
  var ALL_DELIVERABLES = DELIVERABLES.concat(AD_DELIVERABLES);
  var DEFAULT_DELIVERABLES = ["Hook", "Caption", "CTA", "Hashtags"];
  var DEFAULT_AD_DELIVERABLES = ["Headline", "Primary text", "CTA", "Description"];

  var PRESETS = [
    { name: "Full IG launch post", description: "Instagram feed · warm · hook, caption, CTA, hashtags.",
      apply: { platform: "Instagram", format: "Feed post", purpose: "Launch / announce something new", tone: "Warm", deliverables: ["Hook", "Caption", "CTA", "Hashtags"], combine: false } },
    { name: "TikTok hook + on-screen", description: "TikTok · bold · hook, on-screen text, caption, hashtags.",
      apply: { platform: "TikTok", format: "Video / cover", purpose: "Grow followers / reach", tone: "Bold", deliverables: ["Hook", "On-screen text", "Caption", "Hashtags"], combine: false } },
    { name: "Pinterest discovery pin", description: "Pinterest · bright · title, keywords, caption, hashtags.",
      apply: { platform: "Pinterest", format: "Standard pin", purpose: "Drive traffic (link in bio)", tone: "Bright and fun", deliverables: ["Title", "Keywords", "Caption", "Hashtags"], combine: false } },
    { name: "Product launch carousel", description: "Carousel · warm · hook, caption, CTA, hashtags.",
      apply: { platform: "Instagram", format: "Feed post", purpose: "Launch / announce something new", tone: "Warm", slideCount: "5 slides", hookStyle: "curiosity gap", deliverables: ["Hook", "Caption", "CTA", "Hashtags"], combine: false } },
    { name: "Flash sale paid ad", description: "Paid ad · urgent · headline, primary text, CTA.",
      apply: { platform: "Instagram", format: "Feed post", purpose: PAID_AD, tone: "Urgent", objective: "drive sales / conversions", urgency: "limited time", headlineStyle: "urgency / scarcity", deliverables: ["Headline", "Primary text", "CTA", "Description"], combine: false } },
  ];

  function initialState() {
    var plats = MarketingHaus.sizing.platformLabels();
    var firstPlat = "Instagram";
    var fmts = MarketingHaus.sizing.formatLabels(firstPlat);
    return {
      platform: makeField(firstPlat, plats),
      format: makeField(fmts[0] || "", fmts),
      topic: makeField("", [], { isFreeText: true }),
      purpose: makeField("", PURPOSE_OPTIONS),
      tone: makeField("", TONE_OPTIONS),
      audience: makeField("", [], { isFreeText: true }),
      // Ad fields
      objective: makeField("", OBJECTIVE_OPTIONS),
      urgency: makeField("none", URGENCY_OPTIONS),
      offer: makeField("", [], { isFreeText: true }),
      headlineStyle: makeField("", HEADLINE_STYLE_OPTIONS),
      // Drill-down
      action: makeField("", [], { isFreeText: true }),
      angle: makeField("", [], { isFreeText: true }),
      drillOpen: false,
      // Fine-tune
      hookStyle: makeField("", HOOK_STYLE_OPTIONS),
      hashtagStyle: makeField("none", HASHTAG_STYLE_OPTIONS),
      emojiUsage: makeField("none", EMOJI_USAGE_OPTIONS),
      slideCount: makeField("not a carousel", SLIDE_COUNT_OPTIONS),
      fineOpen: false,
      // Deliverables + output
      deliverables: DEFAULT_DELIVERABLES.slice(),
      combine: false,
      // Image prompt
      imageOn: false,
      imgSubject: makeField("", [], { isFreeText: true }),
      imgBackground: makeField("", BACKGROUND_OPTIONS),
      imgLighting: makeField("", LIGHTING_OPTIONS),
      imgArtStyle: makeField("", ART_STYLE_OPTIONS),
    };
  }

  var store = MarketingHaus.util.createStore(initialState());
  function updateField(name, changes) { MarketingHaus.util.updateField(store, name, changes); }
  var rv = function (f) { return MarketingHaus.engine.resolveFieldValue(f); };

  function isPaidAd() { return rv(store.getState().purpose) === PAID_AD; }
  function availableDeliverables() { return isPaidAd() ? ALL_DELIVERABLES : DELIVERABLES; }

  function onPlatformChange(changes) {
    updateField("platform", changes);
    var plat = rv(store.getState().platform);
    var fmts = MarketingHaus.sizing.formatLabels(plat);
    store.setState({ format: makeField(fmts[0] || "", fmts) });
    MarketingHaus.ui.renderApp();
  }

  function onPurposeChange(changes) {
    updateField("purpose", changes);
    // When someone flips into (or out of) paid-ad mode and they're still on
    // the untouched defaults, swap the deliverables to the sensible set for
    // that mode so it's a no-brainer. If they've customized, leave it alone.
    var s = store.getState();
    var cur = s.deliverables.slice().sort().join("|");
    if (rv(s.purpose) === PAID_AD && cur === DEFAULT_DELIVERABLES.slice().sort().join("|")) {
      store.setState({ deliverables: DEFAULT_AD_DELIVERABLES.slice() });
    } else if (rv(s.purpose) !== PAID_AD && cur === DEFAULT_AD_DELIVERABLES.slice().sort().join("|")) {
      store.setState({ deliverables: DEFAULT_DELIVERABLES.slice() });
    }
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
    var fmts = MarketingHaus.sizing.formatLabels(a.platform || rv(s.platform));
    var next = {
      platform: Object.assign({}, s.platform, { value: a.platform || rv(s.platform), customValue: "" }),
      format: makeField(a.format || fmts[0] || "", fmts),
      deliverables: (a.deliverables || DEFAULT_DELIVERABLES).slice(),
      combine: !!a.combine,
    };
    ["purpose", "tone", "objective", "urgency", "headlineStyle", "hookStyle", "hashtagStyle", "emojiUsage", "slideCount"].forEach(function (k) {
      if (a[k] != null) next[k] = Object.assign({}, s[k], { value: a[k], customValue: "" });
    });
    store.setState(next);
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
    var topic = rv(s.topic), purpose = rv(s.purpose), tone = rv(s.tone);
    var audience = rv(s.audience), action = rv(s.action), angle = rv(s.angle);
    var paidAd = purpose === PAID_AD;
    var sizing = MarketingHaus.sizing.promptClause(platform, format);
    var picked = availableDeliverables().filter(function (d) { return s.deliverables.indexOf(d.key) !== -1; });

    var lines = [];
    lines.push("Create " + (paidAd ? "a paid " : "") + platform + (paidAd ? " ad" : " content") + (topic ? " about " + topic : "") + ".");
    if (purpose && !paidAd) lines.push("Purpose: " + purpose + ".");
    if (tone) lines.push("Tone: " + tone + ".");

    var extra = [];
    if (audience) extra.push("It's for " + audience + ".");
    if (action) extra.push("The one action I want them to take: " + action + ".");
    if (angle) extra.push("The angle / promise: " + angle + ".");
    if (extra.length) lines.push(extra.join(" "));

    // Paid-ad specifics
    if (paidAd) {
      var adBits = [];
      var objective = rv(s.objective), urgency = rv(s.urgency), offer = rv(s.offer), headlineStyle = rv(s.headlineStyle);
      if (objective) adBits.push("Objective: " + objective + ".");
      if (offer) adBits.push("What's being sold: " + offer + ".");
      if (urgency && urgency.toLowerCase() !== "none") adBits.push("Urgency: " + urgency + ".");
      if (headlineStyle) adBits.push("Headline style: " + headlineStyle + ".");
      if (adBits.length) lines.push(adBits.join(" "));
    }

    // Fine-tune
    var fine = [];
    var hookStyle = rv(s.hookStyle), slideCount = rv(s.slideCount), hashtagStyle = rv(s.hashtagStyle), emojiUsage = rv(s.emojiUsage);
    if (hookStyle) fine.push("Open with a " + hookStyle + ".");
    if (slideCount && slideCount !== "not a carousel") fine.push("Structure it as a " + slideCount + " carousel.");
    if (hashtagStyle && hashtagStyle.toLowerCase() !== "none") fine.push("Hashtags: " + hashtagStyle + ".");
    if (emojiUsage && emojiUsage.toLowerCase() !== "none") fine.push("Emoji usage: " + emojiUsage + ".");
    if (fine.length) lines.push(fine.join(" "));

    if (voice.length) lines.push("Brand voice: " + voice.map(function (r) { return r.value; }).join(", ") + ".");
    if (sizing) lines.push("If producing any graphic, design it " + sizing + ".");

    if (picked.length) {
      if (s.combine) {
        lines.push("Weave the following into ONE ready-to-post " + platform + (paidAd ? " ad" : "") + ": " + picked.map(function (d) { return d.key.toLowerCase(); }).join(", ") + ".");
      } else {
        lines.push("Produce each of the following as its own clearly-labeled, ready-to-copy block:");
        picked.forEach(function (d) { lines.push("- " + d.key + ": " + d.desc); });
      }
    }

    // Optional matching image prompt
    if (s.imageOn) {
      var chip = MarketingHaus.sizing.chip(platform, format);
      var subj = rv(s.imgSubject) || "the subject of this post";
      var artStyle = rv(s.imgArtStyle), bg = rv(s.imgBackground), light = rv(s.imgLighting);
      var imgDesc = [];
      imgDesc.push((artStyle ? artStyle + " " : "") + "image of " + subj);
      if (bg) imgDesc.push(bg + " background");
      if (light) imgDesc.push(light + " lighting");
      if (chip) imgDesc.push("sized " + chip);
      lines.push("");
      lines.push("IMAGE PROMPT — also give me a separate, ready-to-paste image-generation prompt: " + imgDesc.join(", ") + ".");
    }

    var text = lines.join("\n");
    // Copy/content output (its own IMAGE PROMPT sub-section already carries
    // the size spec) — skip the image-only platform tag formatting so a
    // caption never gets --ar/--no appended.
    return { text: text, fragments: picked.map(function (d) { return d.key; }), skipPlatformFormat: true };
  }

  function getSelectionsByGroup() {
    var s = store.getState();
    var fields = [
      { label: "Platform", field: s.platform },
      { label: "Format", field: s.format },
      { label: "Topic", field: s.topic },
      { label: "Purpose", field: s.purpose },
      { label: "Tone", field: s.tone },
      { label: "Audience", field: s.audience },
    ];
    if (isPaidAd()) {
      fields.push(
        { label: "Objective", field: s.objective },
        { label: "Offer", field: s.offer },
        { label: "Urgency", field: s.urgency },
        { label: "Headline Style", field: s.headlineStyle }
      );
    }
    fields.push(
      { label: "Goal", field: s.action },
      { label: "Angle", field: s.angle },
      { label: "Hook Style", field: s.hookStyle },
      { label: "Carousel", field: s.slideCount },
      { label: "Hashtag Style", field: s.hashtagStyle },
      { label: "Emoji Usage", field: s.emojiUsage }
    );
    if (s.imageOn) {
      fields.push(
        { label: "Image Subject", field: s.imgSubject },
        { label: "Background", field: s.imgBackground },
        { label: "Lighting", field: s.imgLighting },
        { label: "Art Style", field: s.imgArtStyle }
      );
    }
    var items = MarketingHaus.engine.resolveFields(fields);
    // Carousel default ("not a carousel") shouldn't show as a selection.
    items = items.filter(function (i) { return !(i.label === "Carousel" && i.value === "not a carousel"); });
    if (s.deliverables.length) items.push({ label: "Deliverables", value: s.deliverables.join(", ") });
    items.push({ label: "Output", value: s.combine ? "Combined into one" : "Peeled out separately" });
    return items.length ? [{ title: "Content Studio", items: items }] : [];
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

    wrap.appendChild(ui.renderFieldGroup("Purpose", [{ label: "What's this post for?", field: s.purpose }],
      function (entry, changes) { onPurposeChange(changes); }, "What you want this to do — steers the whole prompt. Pick \"Run a paid ad\" for ad-specific options."));

    wrap.appendChild(ui.renderFieldGroup("Voice", [
      { label: "Tone", field: s.tone },
      { label: "Audience", field: s.audience, placeholder: "e.g. busy solopreneurs" },
    ], function (entry, changes) {
      if (entry.label === "Tone") updateField("tone", changes);
      else updateField("audience", changes);
      ui.renderApp();
    }, "How it sounds and who it's for — pick a tone or type your own."));

    // Ad-specific fields (only for paid ads)
    if (isPaidAd()) {
      wrap.appendChild(ui.renderFieldGroup("Ad Details", [
        { label: "Objective", field: s.objective },
        { label: "Urgency", field: s.urgency },
        { label: "Headline Style", field: s.headlineStyle },
      ], function (entry, changes) {
        if (entry.label === "Objective") updateField("objective", changes);
        else if (entry.label === "Urgency") updateField("urgency", changes);
        else updateField("headlineStyle", changes);
        ui.renderApp();
      }, "The paid-ad framing — what the campaign is going for."));

      wrap.appendChild(ui.renderFieldGroup("Offer",
        [{ label: "What's being sold / the offer", field: s.offer, placeholder: "e.g. \"our best-selling candle 3-pack, 20% off this week\"" }],
        function (entry, changes) { updateField("offer", changes); ui.renderApp(); },
        "The specific product, deal, or offer this ad is driving."
      ));
    }

    // Drill-down (optional)
    wrap.appendChild(ui.renderSubPanel(
      "Help me drill down (optional — sharper results)",
      s.drillOpen,
      function (checked) { store.setState({ drillOpen: checked }); ui.renderApp(); },
      function () {
        return ui.renderPlainFieldRow([
          { label: "One action you want?", field: s.action, placeholder: "e.g. tap the link to grab it" },
          { label: "Your angle / promise?", field: s.angle, placeholder: "e.g. one page, whole day sorted" },
        ], function (entry, changes) {
          if (entry.label === "One action you want?") updateField("action", changes);
          else updateField("angle", changes);
          ui.renderApp();
        });
      },
      "Answer a couple and the AI writes something far more specific."
    ));

    // Fine-tune (optional — the old Social Media refinements)
    wrap.appendChild(ui.renderSubPanel(
      "Fine-tune the style (optional)",
      s.fineOpen,
      function (checked) { store.setState({ fineOpen: checked }); ui.renderApp(); },
      function () {
        var box = ui.el("div");
        box.appendChild(ui.renderFieldGroup("Style", [
          { label: "Hook Style", field: s.hookStyle },
          { label: "Carousel Slides", field: s.slideCount },
          { label: "Hashtag Style", field: s.hashtagStyle },
          { label: "Emoji Usage", field: s.emojiUsage },
        ], function (entry, changes) {
          if (entry.label === "Hook Style") updateField("hookStyle", changes);
          else if (entry.label === "Carousel Slides") updateField("slideCount", changes);
          else if (entry.label === "Hashtag Style") updateField("hashtagStyle", changes);
          else updateField("emojiUsage", changes);
          ui.renderApp();
        }));
        return box;
      },
      "Opening hook, carousel length, hashtag mix, emoji level."
    ));

    wrap.appendChild(ui.renderCappedChecklist({
      title: "What do you need?",
      subtitle: "Check every piece to generate — each comes back as its own copy-ready block.",
      icon: "sparkle",
      items: availableDeliverables().map(function (d) { return d.key; }),
      selected: s.deliverables,
      cap: availableDeliverables().length,
      onToggle: toggleDeliverable,
    }));

    // Output mode + optional image prompt
    var outMode = ui.el("div", { class: "mh-ck-outmode" }, [
      ui.el("p", { class: "mh-field-group__subtitle", text: "How should they come out?" }),
      ui.renderPillToggle([
        { isActive: !s.combine, icon: "sparkle", title: "Peel out separately", onClick: function () { store.setState({ combine: false }); ui.renderApp(); } },
        { isActive: s.combine, icon: "document", title: "Combine into one", onClick: function () { store.setState({ combine: true }); ui.renderApp(); } },
      ]),
    ]);
    wrap.appendChild(outMode);

    wrap.appendChild(ui.renderSubPanel(
      "Also make a matching image prompt",
      s.imageOn,
      function (checked) { store.setState({ imageOn: checked }); ui.renderApp(); },
      function () {
        var box = ui.el("div");
        box.appendChild(ui.renderFieldGroup("Image",
          [{ label: "Subject", field: s.imgSubject, placeholder: "e.g. \"a flat-lay of the planner on a linen desk\"" }],
          function (entry, changes) { updateField("imgSubject", changes); ui.renderApp(); }
        ));
        box.appendChild(ui.renderFieldGroup("Look", [
          { label: "Background", field: s.imgBackground },
          { label: "Lighting", field: s.imgLighting },
          { label: "Art Style", field: s.imgArtStyle },
        ], function (entry, changes) {
          if (entry.label === "Background") updateField("imgBackground", changes);
          else if (entry.label === "Lighting") updateField("imgLighting", changes);
          else updateField("imgArtStyle", changes);
          ui.renderApp();
        }, "Reuses your selected size. Leave any blank to let the AI decide."));
        return box;
      },
      "Get a ready-to-paste image-generation prompt alongside your copy."
    ));

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
