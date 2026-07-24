/**
 * The AI Creator's Brand Haus — Brand DNA Archetype Wheel
 * Depends on brand-haus-branddna.js (PROFILES/WHEEL_ORDER/WHEEL_WORDS/
 * computeConfidence — must load first) and brand-haus-ui.js's exposed
 * `el`/`icon` helpers (BrandHaus.ui).
 *
 * One shared render function, four consumers:
 *  - Marketing preview page (sections/brand-haus-preview.liquid): generic
 *    mode, no founder data, browse all 11 on equal footing — click any
 *    wedge and the hub reiterates that profile's name and one word.
 *  - In-app Archetype Guide step (brand-haus-ui.js
 *    renderArchetypeGuideStep): same generic/interactive mode, shown
 *    before the assessment starts.
 *  - In-app Your Brand DNA (brand-haus-results.js renderChapter1):
 *    personalized mode — the whole wheel rotates so the founder's real
 *    match always lands at the bottom, reiterated in the hub. Static, on
 *    purpose: reiterating your own real result isn't something you'd
 *    click away from.
 *  - Exported Blueprint/Playbook (same renderChapter1 call, cloned into a
 *    print window by printStyledSection): identical personalized render,
 *    which is already static by construction — no extra export-only code
 *    needed. Real per-profile alignment shares become visible via the
 *    existing print-only CSS override (.bh-wheel__score in
 *    brand-haus.css, revealed by printStyledSection's own stylesheet).
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var SVG_NS = "http://www.w3.org/2000/svg";

  var PROFILE_ICON = {
    "The Trusted Guide": "shield",
    "The Community Builder": "people",
    "The Joyful Connector": "heart",
    "The Free Spirit": "paperplane",
    "The Luxe Rebel": "gem",
    "The Trail Forger": "peak",
    "The Bold Pioneer": "target",
    "The Cozy Craftsman": "brush",
    "The Elevated Icon": "trophy",
    "The Quiet Authority": "crown",
    "The Modern Minimalist": "flame",
  };

  // ---------------------------------------------------------------------
  // Color: real hex in, darker-shade-of-the-same-hue hex out — used only
  // for the icon badge's own coin-style circle, so it reads as a richer
  // tone of its wedge rather than a flat overlay.
  // ---------------------------------------------------------------------
  function hexToRgb(hex) {
    var num = parseInt(hex.replace("#", ""), 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      var h = v.toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }
  function darken(hex, amount) {
    var c = hexToRgb(hex);
    return rgbToHex(c.r * (1 - amount), c.g * (1 - amount), c.b * (1 - amount));
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

  // Radii tuned and verified (icon/word/name clearances measured directly,
  // not eyeballed) against this exact 11-wedge, 2-line-stacked-name layout —
  // see the build history for why each buffer is sized the way it is:
  // icon badges need real clearance from the hub, word tags need real
  // clearance from both the icon above and the outer gold ring, and
  // stacked (non-curved) name labels need much more radial room than a
  // curved label would, since an unrotated text box's corners reach
  // further past/short of its nominal radius at diagonal wedge angles.
  var CX = 480, CY = 480;
  var R_OUTER_TRACK = 475, R_COLOR_OUTER = 335, R_COLOR_INNER = 138, R_HUB = 135;
  var R_NAME = 400, R_ICON = 177, R_WORD = 262;

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

    var personalized = !!(opts.personalized && opts.results);
    var matchName = personalized ? opts.results.match.best.profile.name : null;
    var shares = null;
    if (personalized) {
      var confidence = brandDNA.computeConfidence(opts.results.match.ranked);
      shares = {};
      confidence.shares.forEach(function (s) { shares[s.profile.name] = s.sharePct; });
    }

    var sliceAngle = 360 / order.length;

    // Rotate the whole wheel so the founder's real match always lands
    // dead-center at the bottom (180°). Generic mode has no real match to
    // rotate around, so it renders in its natural narrative order.
    var rotationOffset = 0;
    if (personalized) {
      var matchIndex = order.indexOf(matchName);
      var naturalMid = matchIndex * sliceAngle + sliceAngle / 2;
      rotationOffset = 180 - naturalMid;
    }
    function wedgeAngles(i) {
      var start = i * sliceAngle + rotationOffset;
      return { start: start, end: start + sliceAngle, mid: start + sliceAngle / 2 };
    }

    var root = ui.el("div", { class: "bh-wheel" + (personalized ? " bh-wheel--static" : " bh-wheel--interactive") });
    var masthead = ui.el("div", { class: "bh-wheel__masthead" }, [
      ui.el("p", { class: "bh-wheel__masthead-eyebrow", text: "Brand DNA" }),
      ui.el("h2", { class: "bh-wheel__masthead-title", text: "The Archetype Wheel" }),
    ]);
    root.appendChild(masthead);
    var stage = ui.el("div", { class: "bh-wheel__stage" });
    var svg = svgEl("svg", { class: "bh-wheel__svg", viewBox: "-40 -40 1040 1040" });
    stage.appendChild(svg);
    root.appendChild(stage);
    var hint = ui.el("p", { class: "bh-wheel__hint", text: personalized
      ? "Your wheel is oriented around your real Brand DNA match, reiterated at the bottom."
      : "Explore every Brand DNA profile — click any archetype to see its name and one word." });
    root.appendChild(hint);
    container.appendChild(root);

    var wedgeEls = {};

    // White name band with a light-gold outline on both edges.
    svg.appendChild(svgEl("circle", { cx: CX, cy: CY, r: R_OUTER_TRACK, class: "bh-wheel__track" }));
    svg.appendChild(svgEl("circle", { cx: CX, cy: CY, r: R_COLOR_OUTER, class: "bh-wheel__track-inner" }));

    order.forEach(function (name, i) {
      var profile = byName[name];
      var a = wedgeAngles(i);
      var wedge = svgEl("path", {
        d: wedgePath(CX, CY, R_COLOR_OUTER, R_COLOR_INNER, a.start, a.end),
        class: "bh-wheel__wedge", fill: profile.output.colors.standOut, "data-name": name,
      });
      if (!personalized) wedge.addEventListener("click", function () { select(name); });
      svg.appendChild(wedge);
      wedgeEls[name] = wedge;
    });

    // Radial dividers, pulled through from the hub edge to past the name band.
    order.forEach(function (name, i) {
      var boundary = wedgeAngles(i).start;
      var pIn = polar(CX, CY, R_HUB, boundary);
      var pOut = polar(CX, CY, R_OUTER_TRACK, boundary);
      svg.appendChild(svgEl("line", { x1: pIn.x, y1: pIn.y, x2: pOut.x, y2: pOut.y, class: "bh-wheel__divider" }));
    });

    order.forEach(function (name, i) {
      var profile = byName[name];
      var mid = wedgeAngles(i).mid;

      // Icon badge — solid coin-style circle in a darker shade of the
      // wedge's own color, pulled fully clear of the hub (no clipping).
      var iconPos = polar(CX, CY, R_ICON, mid);
      var fo = svgEl("foreignObject", { x: iconPos.x - 21, y: iconPos.y - 21, width: 42, height: 42 });
      var badge = ui.el("div", { class: "bh-wheel__icon-badge" }, [ui.icon(PROFILE_ICON[name] || "sparkle")]);
      badge.style.background = darken(profile.output.colors.standOut, 0.2);
      fo.appendChild(badge);
      svg.appendChild(fo);

      // Word tag, with real breathing room from the icon above it.
      var wordPos = polar(CX, CY, R_WORD, mid);
      var wordText = svgEl("text", { x: wordPos.x, y: wordPos.y, class: "bh-wheel__label-word", "text-anchor": "middle" });
      wordText.textContent = (words[name] || "").toUpperCase();
      svg.appendChild(wordText);
      // Hard safety clamp: force-fit the word to a safe width so it can
      // never cross into a neighboring wedge, regardless of which font
      // the browser actually substitutes at render time.
      var wordLen = wordText.getComputedTextLength();
      var SAFE_WORD_WIDTH = 108;
      if (wordLen > SAFE_WORD_WIDTH) {
        wordText.setAttribute("textLength", SAFE_WORD_WIDTH);
        wordText.setAttribute("lengthAdjust", "spacingAndGlyphs");
      }

      // Print-only per-profile alignment share — hidden on screen (see
      // .bh-wheel__score in brand-haus.css), revealed only in the exported
      // print window (printStyledSection's own stylesheet override),
      // since a percentage only means something next to one real
      // founder's real completed assessment.
      if (shares) {
        var scoreText = svgEl("text", { x: wordPos.x, y: wordPos.y + 15, class: "bh-wheel__label-score bh-wheel__score", "text-anchor": "middle" });
        scoreText.textContent = shares[name] + "%";
        svg.appendChild(scoreText);
      }

      // Archetype name on the white band — upright, stacked two lines,
      // centered, with real padding above/below (not curved).
      var namePos = polar(CX, CY, R_NAME, mid);
      var nameWords = name.replace("The ", "").split(" ");
      var line1 = svgEl("text", { x: namePos.x, y: namePos.y - 11, class: "bh-wheel__label-name", "text-anchor": "middle" });
      line1.textContent = nameWords[0].toUpperCase();
      var line2 = svgEl("text", { x: namePos.x, y: namePos.y + 13, class: "bh-wheel__label-name", "text-anchor": "middle" });
      line2.textContent = nameWords.slice(1).join(" ").toUpperCase();
      svg.appendChild(line1);
      svg.appendChild(line2);
      // Same hard safety clamp, sized to this wedge's own arc-length
      // budget at the name's radius, so a long name can never bleed into
      // the neighboring wedge's own name label.
      var arcBudget = R_NAME * (sliceAngle * Math.PI / 180);
      var safeLineWidth = arcBudget * 0.82;
      [line1, line2].forEach(function (lineEl) {
        var nameLen = lineEl.getComputedTextLength();
        if (nameLen > safeLineWidth) {
          lineEl.setAttribute("textLength", safeLineWidth);
          lineEl.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }
      });
    });

    // Hub — reiterates whichever profile is "selected": the founder's real
    // match in personalized mode (fixed), or whatever a founder last
    // clicked in generic/explore mode.
    svg.appendChild(svgEl("circle", { cx: CX, cy: CY, r: R_HUB, class: "bh-wheel__hub" }));
    var hubEyebrow = svgEl("text", { x: CX, y: CY - 34, class: "bh-wheel__hub-eyebrow", "text-anchor": "middle" });
    var hubTitle1 = svgEl("text", { x: CX, y: CY - 4, class: "bh-wheel__hub-title", "text-anchor": "middle" });
    var hubTitle2 = svgEl("text", { x: CX, y: CY + 26, class: "bh-wheel__hub-title", "text-anchor": "middle" });
    var hubWord = svgEl("text", { x: CX, y: CY + 60, class: "bh-wheel__hub-word", "text-anchor": "middle" });
    svg.appendChild(hubEyebrow);
    svg.appendChild(hubTitle1);
    svg.appendChild(hubTitle2);
    svg.appendChild(hubWord);
    var hubAlignment = null;
    if (shares) {
      hubAlignment = svgEl("text", { x: CX, y: CY + 84, class: "bh-wheel__hub-alignment bh-wheel__score", "text-anchor": "middle" });
      svg.appendChild(hubAlignment);
    }

    // Pointer arrow — only meaningful in personalized mode, where the real
    // match always sits at 180° after rotation.
    if (personalized) {
      var tip = polar(CX, CY, R_OUTER_TRACK + 4, 180);
      var baseL = polar(CX, CY, R_OUTER_TRACK + 32, 180 - 6.5);
      var baseR = polar(CX, CY, R_OUTER_TRACK + 32, 180 + 6.5);
      svg.appendChild(svgEl("path", {
        d: ["M", tip.x, tip.y, "L", baseL.x, baseL.y, "L", baseR.x, baseR.y, "Z"].join(" "),
        class: "bh-wheel__arrow", fill: byName[matchName].output.colors.standOut,
      }));
    }

    function markSelected(name) {
      order.forEach(function (n) { wedgeEls[n].classList.toggle("is-selected", n === name); });
    }

    function updateHub(name) {
      var profile = byName[name];
      hubEyebrow.textContent = personalized ? "YOUR BRAND DNA" : "BRAND DNA";
      var nameWords = name.replace("The ", "").split(" ");
      hubTitle1.textContent = nameWords.slice(0, 2).join(" ");
      hubTitle2.textContent = nameWords.slice(2).join(" ");
      hubWord.textContent = (words[name] || "").toUpperCase();
      hubWord.setAttribute("fill", profile.output.colors.standOut);
      if (hubAlignment && shares) hubAlignment.textContent = "Alignment: " + shares[name] + "%";
    }

    function select(name) {
      markSelected(name);
      updateHub(name);
      if (typeof opts.onSelect === "function") opts.onSelect(name);
    }

    if (personalized) {
      markSelected(matchName);
      updateHub(matchName);
    } else {
      hubEyebrow.textContent = "BRAND DNA";
      hubTitle1.textContent = "Click Any";
      hubTitle2.textContent = "Archetype";
      hubWord.textContent = "";
    }
  }

  // Short, scannable "what is this archetype" blurb for whichever profile
  // is currently selected on an interactive (generic) wheel — deliberately
  // NOT the full rich detail panel already ruled out for the wheel itself
  // (strengths/blind spots/next steps are assessment-result copy, not
  // generic-browse copy); just enough to explain the archetype a click
  // just landed on.
  function renderSelectedDetail(ui, name) {
    var brandDNA = BrandHaus.brandDNA;
    var byName = {};
    brandDNA.PROFILES.forEach(function (p) { byName[p.name] = p; });
    var profile = byName[name];
    if (!profile) return ui.el("div", {});
    var word = (brandDNA.WHEEL_WORDS[name] || "").toUpperCase();
    var eyebrow = ui.el("p", { class: "bh-wheel-detail__eyebrow", text: name + (word ? " — \"" + word + "\"" : "") });
    eyebrow.style.color = profile.output.colors.standOut;
    return ui.el("div", { class: "bh-wheel-detail" }, [
      eyebrow,
      ui.el("p", { class: "bh-wheel-detail__northstar", text: profile.output.northStar }),
      ui.el("p", { class: "bh-wheel-detail__promise", text: profile.output.promise }),
      ui.el("p", { class: "bh-wheel-detail__bestfor" }, [
        ui.el("span", { class: "bh-wheel-detail__bestfor-label", text: "Best for: " }),
        ui.el("span", { text: profile.output.bestFor.join(" · ") }),
      ]),
    ]);
  }

  BrandHaus.wheel = { render: render, renderSelectedDetail: renderSelectedDetail };
})();
