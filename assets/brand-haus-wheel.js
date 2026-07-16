/**
 * The AI Creator's Brand Haus — Brand DNA Archetype Wheel
 * Depends on brand-haus-branddna.js (PROFILES/WHEEL_ORDER/WHEEL_WORDS/
 * profileCousins/computeConfidence — must load first) and brand-haus-
 * ui.js's exposed `el`/`icon` helpers (BrandHaus.ui).
 *
 * One shared render function, three consumers:
 *  - Marketing preview page (sections/brand-haus-preview.liquid): generic
 *    mode, no founder data, browse all 11 on equal footing.
 *  - In-app Your Brand DNA (brand-haus-results.js renderChapter1):
 *    personalized mode — opens with the founder's real match already
 *    selected and the other 10 dimmed/cousins-lit, matching what a real
 *    completed assessment produced.
 *  - Exported Blueprint/Playbook (same renderChapter1 call, cloned into a
 *    print window by printStyledSection): identical DOM to the in-app
 *    version — hover/click just never fire on paper — except real
 *    alignment percentages become visible via a print-only CSS override
 *    (see .bh-wheel__score / .bh-wheel__alignment-ring in brand-haus.css),
 *    since a % only means something next to one specific founder's real
 *    answers, never in the generic browse-all-11 view.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var SVG_NS = "http://www.w3.org/2000/svg";

  var PROFILE_ICON = {
    "The Trusted Guide": "lantern",
    "The Bold Pioneer": "compass",
    "The Cozy Craftsman": "anvil",
    "The Elevated Icon": "trophy",
    "The Free Spirit": "feather",
    "The Joyful Connector": "heart",
    "The Quiet Authority": "crown",
    "The Modern Minimalist": "droplet",
    "The Community Builder": "people",
    "The Luxe Rebel": "gem",
    "The Trail Forger": "peak",
  };

  // ---------------------------------------------------------------------
  // Color: real hex in, muted-but-same-hue hex out. Every wedge's large
  // fill area uses this; the icon badge inside it keeps the real,
  // unmuted Stand-Out hex — so the wheel still traces back to each
  // founder's actual future Brand Kit colors, it just doesn't look like
  // 11 unrelated brands stacked next to each other.
  // ---------------------------------------------------------------------
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function hexToHsl(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
    }
    function toHex(x) { var v = Math.round(x * 255).toString(16); return v.length === 1 ? "0" + v : v; }
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function mutedColor(hex) {
    var hsl = hexToHsl(hex);
    return hslToHex(hsl.h, clamp(hsl.s * 0.45, 18, 45), clamp(hsl.l * 0.62 + 14, 22, 34));
  }

  // ---------------------------------------------------------------------
  // Geometry
  // ---------------------------------------------------------------------
  function polar(cx, cy, r, angleDeg) {
    var rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function wedgePath(cx, cy, rOuter, rInner, startAngle, endAngle) {
    var p0 = polar(cx, cy, rOuter, startAngle);
    var p1 = polar(cx, cy, rOuter, endAngle);
    var p2 = polar(cx, cy, rInner, endAngle);
    var p3 = polar(cx, cy, rInner, startAngle);
    var largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
    return ["M", p0.x, p0.y, "A", rOuter, rOuter, 0, largeArc, 1, p1.x, p1.y,
      "L", p2.x, p2.y, "A", rInner, rInner, 0, largeArc, 0, p3.x, p3.y, "Z"].join(" ");
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    return node;
  }

  // Voice string ("warm and approachable") -> short tag pills (["Warm",
  // "Approachable"]) — mechanical parsing of already-shipped copy, not new
  // content, so this never drifts out of sync with a profile's real voice.
  function voiceTags(voice) {
    return (voice || "").split(/\s+and\s+|,\s*/i).map(function (w) {
      return w.trim();
    }).filter(Boolean).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    });
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  // opts:
  //   personalized: boolean — true for in-app/export (real founder result)
  //   results: the founder's completed assessment `results` object
  //     (required when personalized is true)
  function render(ui, container, opts) {
    opts = opts || {};
    var brandDNA = BrandHaus.brandDNA;
    var PROFILES = brandDNA.PROFILES;
    var order = brandDNA.WHEEL_ORDER;
    var words = brandDNA.WHEEL_WORDS;
    var byName = {};
    PROFILES.forEach(function (p) { byName[p.name] = p; });

    var personalized = !!opts.personalized;
    var matchName = personalized && opts.results ? opts.results.match.best.profile.name : null;
    var shares = null;
    if (personalized && opts.results) {
      var confidence = brandDNA.computeConfidence(opts.results.match.ranked);
      shares = {};
      confidence.shares.forEach(function (s) { shares[s.profile.name] = s.sharePct; });
    }

    var state = {
      selected: matchName || order[0],
      hasInteracted: personalized,
    };

    var CX = 300, CY = 300, R_OUTER = 268, R_INNER = 96, R_ICON = 182, R_BADGE = 268, R_LABEL = 302;

    var root = ui.el("div", { class: "bh-wheel" });
    var top = ui.el("div", { class: "bh-wheel__top" });
    var stage = ui.el("div", { class: "bh-wheel__stage" });
    var svg = svgEl("svg", { class: "bh-wheel__svg", viewBox: "0 0 600 600" });
    stage.appendChild(svg);
    var detail = ui.el("div", { class: "bh-wheel__detail" });
    top.appendChild(stage);
    top.appendChild(detail);
    root.appendChild(top);
    var hint = ui.el("p", { class: "bh-wheel__hint", text: "Explore every Brand DNA profile — select any archetype to compare its strengths, voice, and positioning." });
    root.appendChild(hint);
    var cardsWrap = ui.el("div", { class: "bh-wheel__cards" });
    root.appendChild(cardsWrap);
    container.appendChild(root);

    var sliceAngle = 360 / order.length;
    var wedgeEls = {}, cardEls = {}, labelEls = {};

    order.forEach(function (name, i) {
      var profile = byName[name];
      var start = i * sliceAngle, end = start + sliceAngle, mid = start + sliceAngle / 2;
      var muted = mutedColor(profile.output.colors.standOut);

      var wedge = svgEl("path", { d: wedgePath(CX, CY, R_OUTER, R_INNER, start, end), class: "bh-wheel__wedge", fill: muted, "data-name": name });
      wedge.addEventListener("click", function () { select(name); });
      svg.appendChild(wedge);
      wedgeEls[name] = wedge;

      // Icon badge, upright (never rotated), mid-wedge.
      var iconPos = polar(CX, CY, R_ICON, mid);
      var fo = svgEl("foreignObject", { x: iconPos.x - 22, y: iconPos.y - 22, width: 44, height: 44 });
      var badge = ui.el("div", { class: "bh-wheel__icon-badge" }, [ui.icon(PROFILE_ICON[name] || "sparkle")]);
      fo.appendChild(badge);
      svg.appendChild(fo);

      // Numbered pointer badge right at the outer edge.
      var badgePos = polar(CX, CY, R_BADGE, mid);
      var numCircle = svgEl("circle", { cx: badgePos.x, cy: badgePos.y, r: 12, class: "bh-wheel__num-circle" });
      var numText = svgEl("text", { x: badgePos.x, y: badgePos.y + 4, class: "bh-wheel__num-text", "text-anchor": "middle" });
      numText.textContent = i + 1;
      svg.appendChild(numCircle);
      svg.appendChild(numText);

      // External Name + Word labels, always horizontal — anchored by
      // which side of the circle they fall on so they read outward
      // instead of colliding with the wheel.
      var labelPos = polar(CX, CY, R_LABEL, mid);
      var dx = labelPos.x - CX;
      var anchor = Math.abs(dx) < 46 ? "middle" : (dx > 0 ? "start" : "end");
      var nameText = svgEl("text", { x: labelPos.x, y: labelPos.y - 2, class: "bh-wheel__label-name", "text-anchor": anchor });
      nameText.textContent = name.replace("The ", "");
      var wordText = svgEl("text", { x: labelPos.x, y: labelPos.y + 16, class: "bh-wheel__label-word", "text-anchor": anchor, fill: profile.output.colors.standOut });
      wordText.textContent = (words[name] || "").toUpperCase();
      svg.appendChild(nameText);
      svg.appendChild(wordText);
      var scoreText = null;
      if (shares) {
        scoreText = svgEl("text", { x: labelPos.x, y: labelPos.y + 32, class: "bh-wheel__label-score bh-wheel__score", "text-anchor": anchor });
        scoreText.textContent = shares[name] + "%";
        svg.appendChild(scoreText);
      }
      labelEls[name] = { nameText: nameText, wordText: wordText, scoreText: scoreText };
    });

    // Hub — stays static chrome ("navigation," not the dynamic hero); the
    // detail panel to the right is where the real content lives.
    svg.appendChild(svgEl("circle", { cx: CX, cy: CY, r: R_INNER - 6, class: "bh-wheel__hub" }));
    var hubSub = svgEl("text", { x: CX, y: CY - 20, class: "bh-wheel__hub-sub", "text-anchor": "middle" });
    hubSub.textContent = "BRAND DNA";
    var hubTitle1 = svgEl("text", { x: CX, y: CY + 2, class: "bh-wheel__hub-title", "text-anchor": "middle" });
    hubTitle1.textContent = "Your Stand-Out";
    var hubTitle2 = svgEl("text", { x: CX, y: CY + 24, class: "bh-wheel__hub-title", "text-anchor": "middle" });
    hubTitle2.textContent = "Archetype";
    var hubHint = svgEl("text", { x: CX, y: CY + 46, class: "bh-wheel__hub-hint", "text-anchor": "middle" });
    hubHint.textContent = "Click any wedge to explore";
    svg.appendChild(hubSub);
    svg.appendChild(hubTitle1);
    svg.appendChild(hubTitle2);
    svg.appendChild(hubHint);

    // ---------------------------------------------------------------------
    // Cards row (mirrors wedge selection both ways)
    // ---------------------------------------------------------------------
    order.forEach(function (name, i) {
      var profile = byName[name];
      var card = ui.el("button", { type: "button", class: "bh-wheel__card", "data-name": name });
      card.style.setProperty("--card-color", profile.output.colors.standOut);
      var iconWrap = ui.el("div", { class: "bh-wheel__card-icon" }, [ui.icon(PROFILE_ICON[name] || "sparkle")]);
      var nameEl = ui.el("p", { class: "bh-wheel__card-name", text: name });
      var wordEl = ui.el("p", { class: "bh-wheel__card-word", text: (words[name] || "").toUpperCase() });
      wordEl.style.color = profile.output.colors.standOut;
      card.appendChild(iconWrap);
      card.appendChild(nameEl);
      card.appendChild(wordEl);
      if (shares) {
        var scoreEl = ui.el("p", { class: "bh-wheel__card-score bh-wheel__score", text: shares[name] + "%" });
        card.appendChild(scoreEl);
      }
      card.addEventListener("click", function () { select(name); });
      cardsWrap.appendChild(card);
      cardEls[name] = card;
    });

    // ---------------------------------------------------------------------
    // Selection: drives wedge/card highlight state + the detail panel.
    // Cousins (nearest 2 by real vector distance) get a soft glow; every
    // other non-selected wedge dims — the same mechanism serves both
    // "explore how X relates to Y" (generic mode) and "here's your real
    // positioning against everyone else" (personalized mode).
    // ---------------------------------------------------------------------
    // isUserAction defaults true (a real click) — the one call at the
    // bottom of render() that seeds the initial detail panel passes
    // false so generic mode starts neutral (every wedge equal) and only
    // gains the dim/cousin treatment once someone actually clicks;
    // personalized mode still wants that treatment immediately, which is
    // why state.hasInteracted itself started `true` for personalized.
    function select(name, isUserAction) {
      state.selected = name;
      if (isUserAction !== false) state.hasInteracted = true;
      var cousins = brandDNA.profileCousins(name, 2).map(function (p) { return p.name; });

      order.forEach(function (n) {
        var w = wedgeEls[n], c = cardEls[n];
        var isSelected = n === name;
        var isCousin = cousins.indexOf(n) !== -1;
        [w, c].forEach(function (el2) {
          el2.classList.toggle("is-selected", isSelected);
          el2.classList.toggle("is-cousin", isCousin && !isSelected);
          el2.classList.toggle("is-dimmed", state.hasInteracted && !isSelected && !isCousin);
        });
      });

      renderDetail(name);
    }

    function renderDetail(name) {
      var profile = byName[name];
      var isRealMatch = personalized && name === matchName;
      var pill = isRealMatch
        ? ui.el("span", { class: "bh-wheel__pill bh-wheel__pill--match", text: "Your Top Match" })
        : ui.el("span", { class: "bh-wheel__pill", text: (words[name] || "").toUpperCase(), style: "color:" + profile.output.colors.standOut + ";border-color:" + profile.output.colors.standOut + ";" });

      var strengthsList = ui.el("ul", { class: "bh-wheel__strengths" }, (profile.output.strengths || []).map(function (s) {
        return ui.el("li", {}, [ui.icon("chevron", "bh-wheel__check"), ui.el("span", { text: s })]);
      }));

      var voicePills = ui.el("div", { class: "bh-wheel__voice-tags" }, voiceTags(profile.output.voice).map(function (t) {
        return ui.el("span", { class: "bh-wheel__voice-tag", text: t });
      }));

      var bestForList = ui.el("ul", { class: "bh-wheel__bestfor" }, (profile.output.bestFor || []).map(function (b) {
        return ui.el("li", {}, [ui.icon("chevron", "bh-wheel__check"), ui.el("span", { text: b })]);
      }));

      var infoRow = ui.el("div", { class: "bh-wheel__info-row" }, [
        ui.el("div", { class: "bh-wheel__info-col" }, [ui.el("p", { class: "bh-wheel__info-label", text: "Core Strengths" }), strengthsList]),
        ui.el("div", { class: "bh-wheel__info-col" }, [ui.el("p", { class: "bh-wheel__info-label", text: "Brand Voice" }), voicePills]),
        ui.el("div", { class: "bh-wheel__info-col" }, [ui.el("p", { class: "bh-wheel__info-label", text: "Best For" }), bestForList]),
      ]);

      var calloutRow = ui.el("div", { class: "bh-wheel__callout-row" }, [
        ui.el("div", { class: "bh-wheel__callout" }, [
          ui.el("p", { class: "bh-wheel__callout-label", text: "Potential Blind Spot" }),
          ui.el("p", { class: "bh-wheel__callout-body", text: (profile.output.blindSpots || [])[0] || "" }),
        ]),
        ui.el("div", { class: "bh-wheel__callout bh-wheel__callout--quote" }, [
          ui.el("p", { class: "bh-wheel__quote", text: "“" + ((profile.output.strengths || [])[0] || "") + "”" }),
        ]),
      ]);

      var headChildren = [
        pill,
        ui.el("h3", { class: "bh-wheel__name", text: name }),
        ui.el("p", { class: "bh-wheel__word", text: words[name], style: "color:" + profile.output.colors.standOut + ";" }),
        ui.el("p", { class: "bh-wheel__blurb", text: profile.output.influenceBlurb }),
      ];

      var head = ui.el("div", { class: "bh-wheel__detail-head" }, headChildren);
      if (shares) {
        head.appendChild(renderAlignmentRing(shares[name]));
        head.classList.add("bh-wheel__score");
      }

      detail.innerHTML = "";
      detail.appendChild(head);
      detail.appendChild(ui.el("hr", { class: "bh-wheel__rule" }));
      detail.appendChild(infoRow);
      detail.appendChild(calloutRow);
    }

    // Print-only alignment ring — an SVG progress circle, hidden on
    // screen (see .bh-wheel__score in brand-haus.css) and revealed only
    // inside the print window's own stylesheet, since a percentage next
    // to a generic profile card only means something once it's a real
    // founder's real completed assessment (the export context).
    function renderAlignmentRing(pct) {
      var size = 88, stroke = 7, r = (size - stroke) / 2, c = size / 2;
      var circumference = 2 * Math.PI * r;
      var offset = circumference * (1 - pct / 100);
      var wrap = ui.el("div", { class: "bh-wheel__ring-wrap" });
      var svgRing = svgEl("svg", { viewBox: "0 0 " + size + " " + size, width: size, height: size, class: "bh-wheel__ring" });
      svgRing.appendChild(svgEl("circle", { cx: c, cy: c, r: r, class: "bh-wheel__ring-track" }));
      var progress = svgEl("circle", {
        cx: c, cy: c, r: r, class: "bh-wheel__ring-progress",
        "stroke-dasharray": circumference, "stroke-dashoffset": offset,
        transform: "rotate(-90 " + c + " " + c + ")",
      });
      svgRing.appendChild(progress);
      wrap.appendChild(svgRing);
      wrap.appendChild(ui.el("div", { class: "bh-wheel__ring-label" }, [
        ui.el("span", { class: "bh-wheel__ring-pct", text: pct + "%" }),
        ui.el("span", { class: "bh-wheel__ring-caption", text: "Alignment" }),
      ]));
      return wrap;
    }

    select(state.selected, false);
  }

  BrandHaus.wheel = { render: render, mutedColor: mutedColor };
})();
