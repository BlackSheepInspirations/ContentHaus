/**
 * The AI Creator's Brand Haus — UI
 * Depends on brand-haus-util.js, brand-haus-engine.js,
 * brand-haus-favorites.js, brand-haus-styledna.js. Loads BEFORE
 * the mode modules in the section/dev-harness script order, but its own
 * generic render helpers (exposed on BrandHaus.ui) are only ever
 * CALLED from inside each mode's own renderPanel function — which
 * doesn't run until a user actually visits that tab, long after every
 * script has finished loading — so the load-order works fine even
 * though the mode files come before this one.
 *
 * Architecture note vs. Prompt Haus's own prompt-builder-ui.js: that
 * file owns every mode's renderXPanel function directly. Here, each
 * mode file owns its own renderPanel (as BrandHaus.<mode>.renderPanel)
 * and this file only holds the generic shell + reusable field/section
 * helpers — keeps each Studio self-contained in its own file instead of
 * one file needing to know every mode's internal field structure.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var mhKeyCounter = 0;
  var FOCUSABLE_TAGS = { input: true, select: true, textarea: true };

  // Only needed where HTML gets built as a raw string (the print/export
  // covers below, via win.document.write) — every other render in this
  // app goes through el()'s textContent assignment, which is already
  // injection-safe on its own.
  function escapeHtml(text) {
    return String(text || "").replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (FOCUSABLE_TAGS[tag]) {
      node.setAttribute("data-bh-key", String(mhKeyCounter++));
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function copyTextToClipboard(text, onDone) {
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(textarea);
      onDone(ok);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { onDone(true); },
        function () { fallbackCopy(); }
      );
    } else {
      fallbackCopy();
    }
  }

  function downloadTextAsFile(text, filename) {
    var blob = new Blob([text], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printPromptText(text, title, heading) {
    var win = window.open("", "_blank", "width=650,height=800");
    if (!win) return;
    var escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    win.document.write(
      "<html><head><title>" + (title || "Your Marketing Prompt — The AI Creator's Brand Haus") + "</title><style>" +
        "body{font-family:Georgia,serif;padding:48px;color:#1A1815;line-height:1.6;max-width:600px;margin:0 auto;}" +
        "h1{font-size:16px;letter-spacing:0.05em;text-transform:uppercase;color:#0D7377;margin-bottom:28px;}" +
        "p{font-size:15px;white-space:pre-wrap;}" +
        "</style></head><body>" +
        "<h1>" + (heading || "Black Sheep Creations &amp; Inspirations — The AI Creator's Brand Haus") + "</h1>" +
        "<p>" + escaped + "</p>" +
        "</body></html>"
    );
    win.document.close();
    win.focus();
    setTimeout(function () { win.print(); }, 250);
  }

  // Same slug results.js's own (unexported) profileSlug() produces — kept
  // in sync by convention rather than a shared export, since it's a
  // one-line pure string transform and this is the only other place that
  // needs it (to read window.BrandHausHeroImages, the per-profile hero
  // photo map already injected by brand-haus.liquid for Chapter 2).
  function profileSlugForCover(profile) {
    return profile.name.toLowerCase().replace(/^the /, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // The Brand Playbook's "epic cover" — a dramatic, magazine-style
  // opening page reserved for that one document (Snapshot and Report
  // keep the plain cover — a founder said the dramatic treatment reads
  // better as "the master reference" than on the shorter documents).
  // Built entirely from assets already in the theme: the matched
  // profile's own hero photo (same 11 images Chapter 2 already uses, via
  // window.BrandHausHeroImages) and its own real palette for the glow/
  // blob colors and seal — no new artwork, no per-profile authored copy.
  // Typography is deliberately FIXED (Bebas Neue / Montserrat / Inter)
  // rather than swapped to the matched profile's own headingFont/
  // bodyFont — some profile fonts (script faces, ultra-wide serifs) read
  // "wonky" at poster scale on a cover this bold, and a fixed system is
  // how a real print series keeps its covers consistent across volumes
  // regardless of which book (profile) you're holding. Personalization
  // on this cover still comes through via the hero photo, accent/blob
  // colors, and profile name — the typeface doesn't need to also vary
  // for it to feel personal. Height is sized to roughly one US Letter
  // page at print resolution (11in page − 0.3in top/bottom margins ≈
  // 998px usable, trimmed further for safety margin against real Chrome
  // print rendering slightly taller than headless verification did) so
  // page-break-after:always reliably lands it alone on page 1.
  function buildEpicCoverCss(profile) {
    var colors = (profile && profile.output && profile.output.colors) || {};
    var accent = colors.standOut || colors.accent || "#0D7377";
    var accent2 = colors.secondary || colors.accent || "#6B6860";
    var accent3 = colors.support || colors.primary || "#2E2A26";
    return (
      // A flex column with a FIXED (not min-) height — combined with
      // flex-shrink:0 on every text block and flex:1 on the hero-zone,
      // this structurally guarantees the whole cover always fits inside
      // one printed page's usable height rather than hoping font-metric
      // estimates land right: whatever's left after the fixed-size text
      // blocks take their space is exactly what the hero-zone gets,
      // every time, on any profile's copy. 880px, not the ~998px a
      // naive "11in page minus 0.3in margins" calculation suggests —
      // empirically confirmed via real headless-Chrome print-to-pdf
      // that usable height lands closer to ~910-920px, meaning Chrome's
      // own default print margins stack on top of the body's own 0.3in
      // CSS padding rather than being replaced by it. 880px leaves a
      // real safety margin under that.
      ".bh-epic-cover{position:relative;overflow:hidden;background:#0D0D0D;color:#F2F0EB;height:880px;padding:40px 60px 24px;box-sizing:border-box;display:flex;flex-direction:column;page-break-after:always;break-after:page;font-family:'Inter',-apple-system,sans-serif;}" +
      ".bh-epic-cover__blob{position:absolute;border-radius:50%;filter:blur(70px);opacity:0.5;}" +
      ".bh-epic-cover__blob--1{width:340px;height:340px;top:-80px;right:-60px;background:" + accent + ";}" +
      ".bh-epic-cover__blob--2{width:280px;height:280px;bottom:60px;left:-80px;background:" + accent2 + ";}" +
      ".bh-epic-cover__blob--3{width:220px;height:220px;bottom:-60px;right:120px;background:" + accent3 + ";}" +
      ".bh-epic-cover__brandbar{position:relative;flex-shrink:0;font-family:'Montserrat',sans-serif;font-weight:500;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(242,240,235,0.6);margin:0 0 20px;}" +
      ".bh-epic-cover__title-block{position:relative;flex-shrink:0;max-width:560px;}" +
      // Bebas Neue is a condensed display face — noticeably shorter and
      // narrower per letter than a serif like Playfair Display at the
      // same visual weight, which is what makes room for a much larger
      // hero image below without the title losing any visual punch.
      ".bh-epic-cover__title{font-family:'Bebas Neue',sans-serif;font-size:56px;line-height:0.96;font-weight:400;letter-spacing:0.01em;margin:0 0 10px;color:#F2F0EB;}" +
      ".bh-epic-cover__title-accent{color:" + accent + ";}" +
      ".bh-epic-cover__identity{font-family:'Montserrat',sans-serif;font-weight:600;font-size:19px;color:" + accent + ";margin:0 0 5px;}" +
      ".bh-epic-cover__rule{height:3px;width:56px;border-radius:2px;background:" + accent + ";margin:0 0 10px;}" +
      ".bh-epic-cover__tagline{font-family:'Inter',sans-serif;font-weight:400;font-style:italic;font-size:13px;line-height:1.4;color:rgba(242,240,235,0.72);max-width:400px;margin:0;}" +
      // flex:1 fills whatever vertical space is left — with a fixed
      // cover height and every sibling flex-shrink:0, that's now a large
      // majority of the page. The zone also breaks out of the cover's
      // own left/right padding via negative margins so the photo can run
      // full-bleed, edge to edge, instead of sitting in a small inset
      // box. object-fit:cover (not contain) is what actually makes the
      // photo read as "almost the background image" — these hero photos
      // are roughly square, so "contain" inside a wide-but-short zone
      // left most of the width empty; "cover" fills the entire zone and
      // crops instead, the standard technique for a dominant hero image.
      ".bh-epic-cover__hero-zone{position:relative;flex:1;min-height:160px;margin:8px -60px;overflow:hidden;background:#0D0D0D;}" +
      ".bh-epic-cover__glow{position:absolute;left:50%;top:50%;width:60%;height:60%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle, rgba(242,240,235,0.18), transparent 70%);}" +
      // object-fit:cover (not contain) — see note above the zone. These
      // hero images aren't true alpha-transparent PNGs — they're flat
      // JPEGs where the "isolated art" was flattened onto a solid canvas
      // (white on most profiles, an actual checkerboard pattern on at
      // least one) instead of preserving real transparency or a color
      // that matches this dark cover. object-fit:cover's default framing
      // only reliably crops that margin out top/bottom (via the fade
      // below); left/right, whether it's hidden at all came down to
      // luck — how wide that particular photo's own margin happened to
      // be relative to this zone's aspect ratio (confirmed by comparing
      // several hero photos directly: some already crop clean, one
      // showed a visible checkerboard patch on both sides in a real
      // exported PDF). scale(1.25) crops in evenly from all four sides
      // regardless of any single photo's own margin width, at the cost
      // of losing a bit of each photo's outermost splatter/torn-edge
      // detail — never the actual subject, which every one of these
      // compositions keeps centered with real room to spare.
      ".bh-epic-cover__hero{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;object-fit:cover;object-position:center center;transform:scale(1.25);filter:grayscale(0.25) contrast(1.05);opacity:0.94;}" +
      ".bh-epic-cover__hero-fade{position:absolute;left:0;right:0;height:14%;pointer-events:none;}" +
      ".bh-epic-cover__hero-fade--top{top:0;background:linear-gradient(to bottom, #0D0D0D, rgba(13,13,13,0));}" +
      ".bh-epic-cover__hero-fade--bottom{bottom:0;background:linear-gradient(to top, #0D0D0D, rgba(13,13,13,0));}" +
      ".bh-epic-cover__seal{position:relative;flex-shrink:0;display:flex;align-items:center;gap:12px;margin:0 0 16px;}" +
      ".bh-epic-cover__seal-label{font-family:'Montserrat',sans-serif;font-weight:600;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(242,240,235,0.55);line-height:1.7;margin:0;}" +
      ".bh-epic-cover__icon-row{position:relative;flex-shrink:0;display:flex;gap:20px;padding-top:14px;border-top:1px solid rgba(242,240,235,0.15);}" +
      // flex:1 1 0 (not a fixed px flex-basis) so the 4 items always
      // divide the row evenly and never wrap to a 5th line, regardless
      // of exactly how much horizontal padding the surrounding page ends
      // up with.
      ".bh-epic-cover__icon-item{flex:1 1 0;min-width:0;}" +
      ".bh-epic-cover__icon-item .bh-icon{color:" + accent + ";width:18px;height:18px;margin-bottom:6px;}" +
      ".bh-epic-cover__icon-label{font-family:'Montserrat',sans-serif;font-weight:600;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#F2F0EB;margin:0 0 3px;}" +
      ".bh-epic-cover__icon-desc{font-family:'Inter',sans-serif;font-weight:400;font-size:11px;line-height:1.35;color:rgba(242,240,235,0.6);margin:0;}" +
      ".bh-epic-cover__footer{position:relative;flex-shrink:0;text-align:center;font-family:'Montserrat',sans-serif;font-weight:500;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(242,240,235,0.45);margin-top:10px;}"
    );
  }

  function buildEpicCoverHtml(profile, businessName) {
    var heroMap = window.BrandHausHeroImages || {};
    var heroSrc = profile ? heroMap[profileSlugForCover(profile)] : null;
    var sealSvg =
      '<svg viewBox="0 0 100 100" width="72" height="72" style="flex-shrink:0;">' +
        '<circle cx="50" cy="50" r="46" fill="none" stroke="#F2F0EB" stroke-width="1.2" opacity="0.7"/>' +
        '<circle cx="50" cy="50" r="38" fill="none" stroke="#F2F0EB" stroke-width="0.8" opacity="0.5"/>' +
        '<path d="M50 26 L55 46 L75 50 L55 54 L50 74 L45 54 L25 50 L45 46 Z" fill="#F2F0EB" opacity="0.85"/>' +
      "</svg>";
    function iconSvg(name) {
      return '<span class="bh-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg></span>";
    }
    function iconItem(iconName, label, desc) {
      return '<div class="bh-epic-cover__icon-item">' + iconSvg(iconName) + '<p class="bh-epic-cover__icon-label">' + label + '</p><p class="bh-epic-cover__icon-desc">' + desc + "</p></div>";
    }

    return (
      '<div class="bh-epic-cover">' +
        '<div class="bh-epic-cover__blob bh-epic-cover__blob--1"></div>' +
        '<div class="bh-epic-cover__blob bh-epic-cover__blob--2"></div>' +
        '<div class="bh-epic-cover__blob bh-epic-cover__blob--3"></div>' +
        '<p class="bh-epic-cover__brandbar">Black Sheep Creations &amp; Inspirations</p>' +
        '<div class="bh-epic-cover__title-block">' +
          '<h1 class="bh-epic-cover__title">Your<br><span class="bh-epic-cover__title-accent">Brand</span><br>Playbook&trade;</h1>' +
          (profile ? '<p class="bh-epic-cover__identity">' + profile.name + "</p>" : "") +
          '<div class="bh-epic-cover__rule"></div>' +
          '<p class="bh-epic-cover__tagline">Your guide to building, communicating, and growing ' + escapeHtml(businessName || "your brand") + ' with intention — crafted entirely from your answers.</p>' +
        "</div>" +
        '<div class="bh-epic-cover__hero-zone">' +
          '<div class="bh-epic-cover__glow"></div>' +
          (heroSrc ? '<img class="bh-epic-cover__hero" src="' + heroSrc + '" alt="">' +
          '<div class="bh-epic-cover__hero-fade bh-epic-cover__hero-fade--top"></div>' +
          '<div class="bh-epic-cover__hero-fade bh-epic-cover__hero-fade--bottom"></div>' : "") +
        "</div>" +
        '<div class="bh-epic-cover__seal">' + sealSvg + '<p class="bh-epic-cover__seal-label">Discovered From Within<br>Built For Impact</p></div>' +
        '<div class="bh-epic-cover__icon-row">' +
          iconItem("heart", "Understand", "The psychology behind your brand.") +
          iconItem("sparkle", "Clarify", "The strategy that sets you apart.") +
          iconItem("logoMark", "Align", "Your message, visuals, and decisions.") +
          iconItem("lightning", "Elevate", "Build a brand that outlasts today.") +
        "</div>" +
        '<p class="bh-epic-cover__footer">This isn\'t a label. It\'s a blueprint.</p>' +
      "</div>"
    );
  }

  // Prints the founder's actual on-screen chapters — full color, real
  // layout, matched-profile accent — instead of a plain-text recap.
  // "Save as PDF" in the browser's own print dialog then produces the
  // color piece a founder would actually expect to keep, with zero new
  // PDF-generation dependency. sectionEl is cloned rather than moved, so
  // the live page is untouched; accentStyle is the same string
  // accentStyleFor(profile) already produces for the on-screen version,
  // reapplied here since the print window doesn't inherit anything from
  // the page that opened it.
  // profile is optional — when passed, the export gets a branded cover
  // block (wordmark, document title, profile name, accent rule) and every
  // heading/body element is forced into the founder's own chosen fonts,
  // so the exported piece reads like a finished deliverable rather than a
  // recap of the on-screen app (which never applies those fonts itself,
  // outside the one live typography sample in Chapter 3).
  // coverVariant "epic" (Playbook only, for now) swaps in the dramatic
  // magazine-style cover above instead of the plain branded one.
  // businessName is optional — when set, the plain cover gets a "Prepared
  // for" line and the epic cover's own tagline personalizes; blank simply
  // omits the line / falls back to "your brand" rather than erroring.
  function printStyledSection(sectionEl, accentStyle, title, profile, coverVariant, businessName) {
    var win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;
    var cssLink = document.getElementById("bh-css-link") || document.querySelector('link[href*="brand-haus.css"]');
    var cssHref = cssLink ? cssLink.href : "";
    var fontsLink = document.getElementById("bh-branding-fonts-link");
    var fontsHref = fontsLink ? fontsLink.href : "";
    var headingFont = (profile && profile.output && profile.output.headingFont) || "Playfair Display";
    var bodyFont = (profile && profile.output && profile.output.bodyFont) || "Inter";
    var accentColor = (profile && profile.output && profile.output.colors && profile.output.colors.standOut) || "#0D7377";
    var primaryColor = (profile && profile.output && profile.output.colors && profile.output.colors.primary) || "#1A1815";
    var docTitle = title || "Your Brand DNA — Curated by Black Sheep Creations";
    var isEpicCover = coverVariant === "epic" && !!profile;
    // The app-wide Google Fonts link (fontsHref) only requests weights
    // 400/600/700 for its 15 fonts — enough for the profile-driven fonts
    // used everywhere else, but not the Montserrat 500/600 or Inter
    // italic the epic cover's fixed typography needs. A second small
    // link scoped to just this popup covers the gap without bloating
    // the shared app-wide stylesheet with weights nothing else uses.
    var epicFontsHref = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@500;600&family=Inter:ital,wght@0,400;1,400&display=swap";

    win.document.write(
      "<html><head><title>" + docTitle + "</title>" +
      (cssHref ? '<link rel="stylesheet" href="' + cssHref + '">' : "") +
      (fontsHref ? '<link rel="stylesheet" href="' + fontsHref + '">' : "") +
      (isEpicCover ? '<link rel="stylesheet" href="' + epicFontsHref + '">' : "") +
      "<style>" +
        // Chrome/Firefox drop background colors on print by default unless
        // told otherwise — without this, every color swatch and progress
        // ring prints blank even though borders/text come through fine.
        "*{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact;}" +
        "body{background:#fff;margin:0;padding:32px 40px;font-family:'" + bodyFont + "',-apple-system,sans-serif;color:#1A1815;}" +
        ".bh-founder-interview--results{max-width:100%;}" +
        // brand-haus.css only defines --bh-border/--bh-teal/etc. scoped to
        // #brand-haus-app and a few other selectors that don't exist in
        // this popup's own document — every var(--bh-border) etc. cloned
        // classes reference (card borders, slider tracks, neutral swatch)
        // silently resolved to nothing without this, which is why only the
        // colors set inline via accentStyle survived. Redefining the same
        // tokens here, scoped to .bh-print-wrap, restores all of them.
        ".bh-print-wrap{--bh-cream:#F2F0EB;--bh-black:#1A1815;--bh-gold:#6B6860;--bh-teal:#0D7377;--bh-steel:#2E5A8C;--bh-charcoal:#2E2A26;--bh-espresso:#0D7377;--bh-border:rgba(46,42,38,0.15);--bh-gold-on-light:#6B6860;}" +
        // Deliberately NOT page-break-inside:avoid on .bh-chapter itself — a
        // chapter can run well past one printed page (Chapter 3's 8 tension
        // sections especially), and "avoid" on a block taller than a page
        // forces an extra blank page before it rather than preventing a
        // split. Avoid is reserved below for genuinely small, atomic pieces
        // instead. page-break-before IS forced here though (both properties
        // for older/newer engine support) so every chapter and every Part
        // divider starts its own fresh page — deliberate, requested
        // behavior, not a bug: it costs extra pages but reads like a real
        // printed reference document instead of one continuous scroll with
        // chapters bleeding into each other mid-page.
        ".bh-chapter,.bh-playbook__part-divider{page-break-inside:auto;page-break-before:always;break-before:page;box-shadow:none;margin-bottom:16px;}" +
        // The rule above is right for every chapter AFTER the first one —
        // that's what makes each chapter start its own fresh page. But
        // applied to the very FIRST chapter too, it forces a break right
        // after the print masthead, leaving page 1 almost blank before
        // real content starts on page 2 (seen in a real exported PDF on
        // the Snapshot and Brand DNA Report, both of which open straight
        // into a .bh-chapter with no table of contents in between —
        // unlike the Playbook, which already has one). Only these two
        // specific structural positions are un-forced; the Playbook's own
        // TOC-then-Part-divider opening is untouched and unaffected.
        ".bh-print-wrap>.bh-chapter:first-child,.bh-print-wrap>.bh-blueprint__print-chapters>.bh-chapter:first-child{page-break-before:auto;break-before:auto;}" +
        ".bh-chapter__section-title{page-break-after:avoid;break-after:avoid;}" +
        // Everything in this list is a small, self-contained box that reads
        // as broken if the browser slices it mid-border — the take-action/
        // why-this-matters/quickref cards and the mission-statement pull-
        // quote all learned this the hard way (seen split across two pages
        // in a real exported PDF) before being added here.
        ".bh-palette-swatch,.bh-font-card,.bh-chapter__bullet-list li,.bh-tension-slider,.bh-dna-cluster,.bh-chapter__take-action,.bh-chapter__why-this-matters,.bh-founder-interview__mission,.bh-chapter__highlight-line,.bh-chapter__slider-box,.bh-quickref,.bh-fingerprint-wrap,.bh-chapter__evolution{page-break-inside:avoid;break-inside:avoid;}" +
        // The hero image relies on flex "stretch" against its text sibling
        // for height on screen; if the print page is narrow enough that
        // flex-wrap drops it to its own row, it has no sibling to stretch
        // against and blows up to fill the row instead. Print never needs
        // the side-by-side layout to be that wide, so cap it directly.
        ".bh-chapter__hero-image{flex:0 0 200px;max-width:200px;}" +
        ".bh-chapter__hero-image img{height:auto;min-height:0;aspect-ratio:1/1;}" +
        ".bh-print-cover{text-align:center;padding-bottom:24px;margin-bottom:28px;border-bottom:1px solid rgba(0,0,0,0.1);}" +
        ".bh-print-cover__eyebrow{font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(26,24,21,0.5);margin:0 0 14px;font-family:'" + bodyFont + "',-apple-system,sans-serif;}" +
        ".bh-print-cover__title{font-size:32px;line-height:1.15;margin:0 0 8px;color:#1A1815;font-family:'" + headingFont + "',serif;}" +
        ".bh-print-cover__profile{font-size:18px;margin:0 0 16px;color:" + primaryColor + ";font-family:'" + headingFont + "',serif;}" +
        ".bh-print-cover__prepared-for{font-size:12px;letter-spacing:0.04em;margin:0 0 16px;color:rgba(26,24,21,0.55);font-family:'" + bodyFont + "',-apple-system,sans-serif;}" +
        ".bh-print-cover__rule{height:4px;width:72px;margin:0 auto;border-radius:2px;background:" + accentColor + ";}" +
        ".bh-print-footer{margin-top:32px;padding-top:16px;border-top:1px solid rgba(0,0,0,0.1);text-align:center;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(26,24,21,0.45);font-family:'" + bodyFont + "',-apple-system,sans-serif;page-break-inside:avoid;}" +
        ".bh-print-footer__disclaimer{margin-top:6px;font-size:11px;letter-spacing:normal;text-transform:none;font-style:italic;color:rgba(26,24,21,0.4);}" +
        ".bh-print-wrap h1,.bh-print-wrap h2,.bh-print-wrap h3,.bh-print-wrap .bh-chapter__eyebrow,.bh-print-wrap .bh-chapter__section-title,.bh-print-wrap .bh-founder-interview__profile-name,.bh-print-wrap .bh-blueprint__section-header h3{font-family:'" + headingFont + "',serif!important;}" +
        ".bh-print-wrap p,.bh-print-wrap li,.bh-print-wrap span,.bh-print-wrap div{font-family:'" + bodyFont + "',-apple-system,sans-serif;}" +
        ".bh-print-wrap .bh-btn,.bh-print-wrap button:not(.bh-font-pairing-row){display:none!important;}" +
        ".bh-print-wrap .bh-font-pairing-row{cursor:default;}" +
        ".bh-print-wrap .bh-font-pairing-row__chevron{display:none;}" +
        // The Archetype Wheel's percentages only mean something next to a
        // real founder's real completed assessment — never in the generic
        // in-app/marketing browse-all-11 view. `.bh-wheel__score` elements
        // are always in the DOM (computed from real data) but hidden by
        // default; this is the one place they surface. display:unset (not
        // a hardcoded value) since these hide/reveal both SVG text (wants
        // inline) and HTML elements (wants block) with one rule.
        ".bh-print-wrap .bh-wheel__score{display:unset;}" +
        "@media print{body{padding:0.3in;}}" +
        (isEpicCover ? buildEpicCoverCss(profile) : "") +
      "</style></head><body>" +
      (isEpicCover ? buildEpicCoverHtml(profile, businessName) :
      '<div class="bh-print-cover">' +
        '<p class="bh-print-cover__eyebrow">Black Sheep Creations &amp; Inspirations</p>' +
        '<h1 class="bh-print-cover__title">' + docTitle.split(" — ")[0] + "</h1>" +
        (profile ? '<p class="bh-print-cover__profile">' + profile.name + "</p>" : "") +
        (businessName ? '<p class="bh-print-cover__prepared-for">Prepared for ' + escapeHtml(businessName) + "</p>" : "") +
        '<div class="bh-print-cover__rule"></div>' +
      "</div>") +
      '<div class="bh-founder-interview bh-founder-interview--results bh-print-wrap" style="' + (accentStyle || "") + '"></div>' +
      '<p class="bh-print-footer">Black Sheep Creations &amp; Inspirations &middot; Brand DNA Blueprint&trade;<br><span class="bh-print-footer__disclaimer">This document offers creative direction, not a guarantee of results — every recommendation is meant to be refined as your brand grows.</span></p>' +
      "</body></html>"
    );
    win.document.close();
    win.document.querySelector(".bh-print-wrap").appendChild(sectionEl.cloneNode(true));
    win.focus();
    setTimeout(function () { win.print(); }, 400);
  }

  function buildShareUrl(text) {
    var encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(text))));
    var base = window.location.origin + window.location.pathname;
    return base + "?mh_shared_prompt=" + encoded;
  }

  // ---------------------------------------------------------------------
  // Vault snapshot save/restore — same crash-safety pattern as Prompt
  // Haus (deep-merge onto current defaults, never wholesale-replace).
  // ---------------------------------------------------------------------
  // Vault "mode" is normally a top-level BrandHaus.<mode> namespace
  // ("branding"/"logo"), but Quick Generators has no such namespace per
  // generator — its vault key is "gen:<id>" instead, routed through
  // BrandHaus.generators' own per-generator store lookup. Same "gen:"
  // prefix convention Project Haus/Marketing Haus/Graphics Haus already
  // use for their own Quick Generators tabs.
  function getModeStore(mode) {
    if (mode.indexOf("gen:") === 0) return BrandHaus.generators.getGeneratorStore(mode.slice(4));
    return BrandHaus[mode];
  }

  function modeLabel(mode) {
    if (mode.indexOf("gen:") === 0) return BrandHaus.generators.getGeneratorLabel(mode.slice(4));
    return MODE_LABELS[mode] || mode;
  }

  function buildVaultSnapshot(mode) {
    var snapshot = { identity: JSON.parse(JSON.stringify(BrandHaus.identity.getState())) };
    snapshot[mode] = JSON.parse(JSON.stringify(getModeStore(mode).getState()));
    return snapshot;
  }

  function isFieldShape(obj) {
    return !!obj && typeof obj === "object" && !Array.isArray(obj) &&
      Object.prototype.hasOwnProperty.call(obj, "value") &&
      Object.prototype.hasOwnProperty.call(obj, "options");
  }

  function deepMergeSnapshot(current, saved) {
    if (Array.isArray(saved)) {
      var currentArr = Array.isArray(current) ? current : [];
      return saved.map(function (item, i) { return deepMergeSnapshot(currentArr[i], item); });
    }
    if (!saved || typeof saved !== "object") return saved === undefined ? current : saved;
    if (!current || typeof current !== "object") return saved;
    if (isFieldShape(saved) && isFieldShape(current)) {
      return Object.assign({}, current, {
        value: saved.value,
        customValue: saved.customValue,
        includeInPrompt: saved.includeInPrompt,
      });
    }
    var result = Object.assign({}, current);
    Object.keys(saved).forEach(function (key) {
      result[key] = deepMergeSnapshot(current[key], saved[key]);
    });
    return result;
  }

  function loadVaultSnapshot(mode, snapshot) {
    if (!snapshot) return;
    if (snapshot.identity) BrandHaus.identity.setState(deepMergeSnapshot(BrandHaus.identity.getState(), snapshot.identity));
    if (snapshot[mode]) getModeStore(mode).setState(deepMergeSnapshot(getModeStore(mode).getState(), snapshot[mode]));
  }

  function buildVaultTitle(mode) {
    var context = BrandHaus.engine.resolveFieldValue(BrandHaus.identity.getState().businessName);
    return context ? modeLabel(mode) + " — " + context : modeLabel(mode);
  }

  function buildFullVaultText() {
    var byMode = {};
    BrandHaus.favorites.getAllFlat().forEach(function (fav) {
      byMode[fav.mode] = byMode[fav.mode] || [];
      byMode[fav.mode].push(fav);
    });
    var sections = [];
    Object.keys(byMode).forEach(function (mode) {
      var label = modeLabel(mode).toUpperCase();
      var lines = byMode[mode].map(function (fav, index) {
        return (fav.title || "Untitled " + (index + 1)) + "\n" + fav.text;
      });
      sections.push(label + "\n\n" + lines.join("\n\n"));
    });
    return sections.join("\n\n" + "—".repeat(24) + "\n\n");
  }

  // ---------------------------------------------------------------------
  // Icon system — same hand-rolled inline SVG approach as Prompt Haus,
  // no external dependency.
  // ---------------------------------------------------------------------
  var ICONS = {
    person: '<circle cx="10" cy="6.5" r="3"/><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>',
    people: '<circle cx="6.5" cy="6" r="2.2"/><path d="M2.5 17c0-2.7 1.8-4.8 4-4.8s4 2.1 4 4.8"/><circle cx="14" cy="7.3" r="1.8"/><path d="M10.7 17c.3-2.2 1.8-3.9 3.3-3.9s3 1.7 3.3 3.9"/>',
    text: '<path d="M4 4h12M10 4v12"/>',
    heart: '<path d="M10 17S3 12.5 3 7.5C3 5 5 3.5 7.2 3.5c1.5 0 2.5.8 2.8 1.8.3-1 1.3-1.8 2.8-1.8C15 3.5 17 5 17 7.5 17 12.5 10 17 10 17Z"/>',
    layers: '<path d="M10 2 18 6l-8 4-8-4Z"/><path d="M2 10l8 4 8-4M2 14l8 4 8-4"/>',
    image: '<rect x="2" y="3" width="16" height="14" rx="1.5"/><circle cx="7" cy="8" r="1.3"/><path d="M2.5 15 7 10.5l4 3.5 3.5-3.5 3 3"/>',
    shirt: '<path d="M7 3 3 6l2 3 2-1.5V17h6V7.5L15 9l2-3-4-3c0 1.4-1.3 2.5-3 2.5S7 4.4 7 3Z"/>',
    crop: '<path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"/>',
    monitor: '<rect x="2" y="4" width="16" height="11" rx="1.2"/><path d="M7 18h6M10 15v3"/>',
    sparkle: '<path d="M10 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/>',
    gift: '<rect x="3" y="8" width="14" height="9" rx="1"/><path d="M3 8h14M10 8v9"/><path d="M10 8c0-2-1.5-4.5-3.5-4.5C5 3.5 4.3 5.6 6 6.8 7.3 7.7 8.8 8 10 8Zm0 0c0-2 1.5-4.5 3.5-4.5C15 3.5 15.7 5.6 14 6.8 12.7 7.7 11.2 8 10 8Z"/>',
    upload: '<path d="M10 13V3M6 7l4-4 4 4"/><path d="M3 13v2.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V13"/>',
    download: '<path d="M10 3v10M6 9l4 4 4-4"/><path d="M3 13v2.5c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5V13"/>',
    share: '<circle cx="15" cy="4.5" r="2"/><circle cx="5" cy="10" r="2"/><circle cx="15" cy="15.5" r="2"/><path d="M6.7 9 13.3 5.5M6.7 11 13.3 14.5"/>',
    print: '<rect x="5" y="2.5" width="10" height="6" rx="1"/><rect x="3" y="8" width="14" height="7" rx="1.2"/><rect x="6" y="12" width="8" height="5"/>',
    document: '<rect x="4" y="2" width="12" height="16" rx="1.2"/><path d="M7 6.5h6M7 9.5h6M7 12.5h3.5"/>',
    lightning: '<path d="M11 2 4 11h5l-1 7 8-9h-5l1-7Z"/>',
    eye: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/>',
    eyeOff: '<path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/><circle cx="10" cy="10" r="2.3"/><path d="M3 3l14 14"/>',
    copy: '<rect x="6.5" y="6.5" width="10" height="10" rx="1.2"/><path d="M4 12.5V4.8C4 4 4.7 3.3 5.5 3.3H13"/>',
    vault: '<rect x="4" y="9" width="12" height="8" rx="1.2"/><path d="M6 9V6.3C6 3.9 7.8 2 10 2s4 1.9 4 4.3V9"/>',
    edit: '<path d="M13.5 2.5 17 6l-9.5 9.5-4 1 1-4Z"/>',
    logoMark: '<circle cx="10" cy="10" r="7.5"/><path d="M7 10.5 9 12.5 13.5 8"/>',
    shuffle: '<path d="M3 6h4l7 8h3M3 14h4l2.2-2.5"/><path d="M14.5 4 17 6l-2.5 2M14.5 12 17 14l-2.5 2"/>',
    refresh: '<path d="M17 10a7 7 0 0 0-12.8-4M3 10a7 7 0 0 0 12.8 4"/><path d="M3 3v4.5h4.5M17 17v-4.5h-4.5"/>',
    shield: '<path d="M10 2 16 4.5V10c0 4-3 6.5-6 8-3-1.5-6-4-6-8V4.5Z"/><path d="M7 9l3 2 3-2"/>',
    warning: '<path d="M10 2.5 18 17H2Z"/><path d="M10 8v3.5"/><circle cx="10" cy="14" r="0.75" fill="currentColor" stroke="none"/>',
    palette: '<circle cx="10" cy="10" r="7.5"/><circle cx="7" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="1" fill="currentColor" stroke="none"/><path d="M10 17.5c-4.1 0-7.5-3.4-7.5-7.5 0-1 3-1 3-2.5 0-1 4.5-1 4.5 1 0 1.5 3 1 3 2.5 0 3.7-1.5 6.5-3 6.5Z"/>',
    type: '<path d="M4 5h12M10 5v11M7 16h6"/>',
    hanger: '<path d="M10 3a1.5 1.5 0 1 1 1.5 1.5H10"/><path d="M10 4.5 3 10.5c-.5.4-.2 1.2.4 1.2H16.6c.6 0 .9-.8.4-1.2L10 4.5Z"/><path d="M4 15.5h12"/>',
    droplet: '<path d="M10 2.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10Z"/>',
    car: '<path d="M4 13 5.5 8h9L16 13"/><rect x="3" y="13" width="14" height="3" rx="1"/><circle cx="6.5" cy="16.5" r="1.3"/><circle cx="13.5" cy="16.5" r="1.3"/>',
    bulb: '<path d="M7 15h6M8 17.5h4"/><path d="M10 2.5c-3 0-5 2.2-5 5 0 2 1.1 3.3 2 4.2.5.5.8 1 .9 1.8h4.2c.1-.8.4-1.3.9-1.8.9-.9 2-2.2 2-4.2 0-2.8-2-5-5-5Z"/>',
    mail: '<rect x="2.5" y="4.5" width="15" height="11" rx="1.3"/><path d="M3 5.5 10 11l7-5.5"/>',
    chevron: '<path d="M5 7.5 10 12.5 15 7.5"/>',
    // Added for the Brand DNA Archetype Wheel — one glyph per profile,
    // reusing heart/people/droplet above where they already fit rather
    // than adding near-duplicates.
    lantern: '<path d="M10 2v2M7.5 4h5l1 3H6.5l1-3Z"/><rect x="6.5" y="7" width="7" height="8" rx="1.5"/><path d="M8.5 18h3M10 10.5v4"/>',
    compass: '<circle cx="10" cy="10" r="7.5"/><path d="M13 7 8.5 8.5 7 13l4.5-1.5L13 7Z"/>',
    anvil: '<path d="M4 14h12M5.5 14v2.5h9V14"/><path d="M6.5 14l1-3.5h5l1 3.5"/><rect x="9" y="4" width="2" height="6.5" rx=".8"/>',
    trophy: '<path d="M7 3h6v5a3 3 0 0 1-6 0V3Z"/><path d="M7 4H4.5v1.5A2.5 2.5 0 0 0 7 8M13 4h2.5v1.5A2.5 2.5 0 0 1 13 8"/><path d="M10 11v3M7.5 17h5M8 14h4l.5 3h-5l.5-3Z"/>',
    feather: '<path d="M14 3 5 12a4 4 0 0 0 0 5.5 4 4 0 0 0 5.5 0L19 8"/><path d="M8 15l2-2M6.5 13.5l2-2"/>',
    crown: '<path d="M3.5 15.5 3 7l4 3 3-5 3 5 4-3-.5 8.5Z"/><path d="M3.5 15.5h13"/>',
    gem: '<path d="M5 8 10 3l5 5-5 9-5-9Z"/><path d="M5 8h10M7.5 8 10 3l2.5 5M7.5 8 10 17M12.5 8 10 17"/>',
    peak: '<path d="M2 16 8 6l3 4 2-3 5 9H2Z"/><path d="M13 3v4l2.5-1L13 5"/>',
    // Added for the Archetype Wheel's coin-style icon badges.
    target: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3.5"/><circle cx="10" cy="10" r=".6" fill="currentColor" stroke="none"/>',
    brush: '<path d="M13 3 8.5 7.5M6 15.5c-1.4 1.4-3.4.6-3.4.6s-.8-2 .6-3.4L11 5l3 3-7.7 7.5Z"/><path d="M13 3l4 4"/>',
    paperplane: '<path d="M17 3 3 9.5l5.5 2L11 17l2-5.5L17 3Z"/><path d="M8.5 11.5 13 8"/>',
    flame: '<path d="M10 2s4 3.2 4 7.2A4 4 0 0 1 6 9.2C6 7 7.5 5.8 7.5 5.8c-.2 1.2.5 2 .5 2C8 5.5 10 4.5 10 2Z"/><path d="M10 18a4.5 4.5 0 0 0 4.5-4.5c0-1.6-1-2.6-1-2.6.1 1-.5 1.6-.5 1.6C13.2 10.8 12 9.8 12 9.8c.3 3.4-2 4.2-2 4.2s-2.3-.8-2-4.2c0 0-1.2 1-.9 2.7 0 0-.6-.6-.5-1.6 0 0-1 1-1 2.6A4.5 4.5 0 0 0 10 18Z"/>',
    // Added for the sidebar FAQ & Help link.
    help: '<circle cx="10" cy="10" r="7.5"/><path d="M7.7 7.7a2.3 2.3 0 1 1 3.3 2c-.7.4-1 .9-1 1.7"/><circle cx="10" cy="14" r=".7" fill="currentColor" stroke="none"/>',
  };

  var TITLE_ICONS = {
    "Style": "sparkle", "Extras": "sparkle", "Filter It": "image",
    "Hero Product": "shirt", "Presentation Style": "person", "Surrounding Props": "hanger",
    "Setting": "image", "Foundation": "logoMark", "Color & Format": "palette",
    "Typography Direction": "type", "Composition & Lockup": "crop", "Brand Story": "heart",
    "Negative Constraints": "shield", "Pro Mode": "sparkle", "Colors": "palette",
    "Typography": "type", "Core Values": "heart", "Brand Voice": "sparkle",
    "Mission Statement": "bulb",
  };

  function icon(name, extraClass) {
    var span = el("span", { class: "bh-icon" + (extraClass ? " " + extraClass : ""), "aria-hidden": "true" });
    span.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || "") + "</svg>";
    return span;
  }

  function infoIcon(text) {
    return el("details", { class: "bh-info" }, [
      el("summary", { class: "bh-info__icon", "aria-label": "More info" }, [el("span", { text: "i" })]),
      el("p", { class: "bh-info__body", text: text }),
    ]);
  }

  function labelWithIcon(iconName, text, forId, labelClass, helpText) {
    var attrs = { class: (labelClass || "bh-field__label") + " bh-label--icon" };
    if (forId) attrs.for = forId;
    var children = [icon(iconName), el("span", { text: text })];
    if (helpText) children.push(infoIcon(helpText));
    return el(forId ? "label" : "span", attrs, children);
  }

  function renderPillToggle(options) {
    function pillButton(opt) {
      var btn = el("button", { type: "button", class: "bh-pill-toggle__btn" + (opt.isActive ? " is-active" : "") }, [
        icon(opt.icon, "bh-pill-toggle__icon"),
        el("span", { class: "bh-pill-toggle__label", text: opt.title }),
      ]);
      btn.addEventListener("click", opt.onClick);
      return btn;
    }
    return el("div", { class: "bh-pill-toggle" }, options.map(pillButton));
  }

  // Shared Yes/No pill toggle — matching the same yesNoButton pattern
  // already used for Image Buffer/Padding and Output Format in the other
  // 4 Hauses, for any Brand Haus feature that needs a visible on/off
  // toggle rather than a plain checkbox (e.g. Logo Studio's Logo Board).
  function yesNoButton(label, isActive, onClick) {
    var btn = el("button", {
      type: "button",
      class: "bh-styledna__yesno-btn" + (isActive ? " is-active" : ""),
      "aria-pressed": isActive ? "true" : "false",
      text: label,
    });
    btn.addEventListener("click", onClick);
    return btn;
  }

  function renderPresetRow(presets, onApply, labelText) {
    if (!presets || !presets.length) return null;
    var cards = presets.map(function (preset) {
      var card = el("button", { type: "button", class: "bh-preset-card" }, [
        el("span", { class: "bh-preset-card__name", text: preset.name }),
        el("span", { class: "bh-preset-card__description", text: preset.description }),
      ]);
      card.addEventListener("click", function () { onApply(preset); });
      return card;
    });
    return el("div", { class: "bh-preset-row" }, [
      el("p", { class: "bh-preset-row__label" }, [icon("sparkle"), el("span", { text: labelText || "Starter Presets — click one, then customize" })]),
      el("div", { class: "bh-preset-row__cards" }, cards),
    ]);
  }

  function appendSelectOptions(select, field, currentValue) {
    select.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    if (field.optionGroups) {
      field.optionGroups.forEach(function (group) {
        var optgroup = el("optgroup", { label: group.label });
        group.options.forEach(function (opt) {
          var optionNode = el("option", { value: opt });
          optionNode.textContent = opt;
          if (opt === currentValue) optionNode.selected = true;
          optgroup.appendChild(optionNode);
        });
        select.appendChild(optgroup);
      });
    } else {
      (field.options || []).forEach(function (opt) {
        var optionNode = el("option", { value: opt });
        optionNode.textContent = opt;
        if (opt === currentValue) optionNode.selected = true;
        select.appendChild(optionNode);
      });
    }
  }

  function fieldHasValue(field) {
    var custom = (field.customValue || "").trim();
    if (custom) return true;
    var value = (field.value || "").trim();
    return value !== "" && value.toLowerCase() !== "none";
  }

  function renderField(entry, onChange) {
    var field = entry.field;
    var select = el("select", { class: "bh-field__select" });
    appendSelectOptions(select, field, field.value);
    select.addEventListener("change", function () { onChange({ value: select.value, customValue: "" }); });
    var selectId = "bh-field-" + select.getAttribute("data-bh-key");
    select.id = selectId;

    var customInput = el("input", { type: "text", class: "bh-field__custom", placeholder: "Or type your own..." });
    customInput.value = field.customValue || "";
    customInput.addEventListener("input", function () { onChange({ customValue: customInput.value }); });

    var checkbox = el("input", { type: "checkbox", class: "bh-field__checkbox" });
    checkbox.checked = field.includeInPrompt !== false && fieldHasValue(field);
    checkbox.addEventListener("change", function () { onChange({ includeInPrompt: checkbox.checked }); });

    var labelRow = el("div", { class: "bh-field__label-row" }, [
      el("label", { class: "bh-field__label", for: selectId, text: entry.label }),
      el("label", { class: "bh-field__include" }, [checkbox, el("span", { text: "Include in prompt" })]),
    ]);
    return el("div", { class: "bh-field" }, [labelRow, select, customInput]);
  }

  function renderFreeTextField(entry, onChange) {
    var input = el("textarea", { class: "bh-field__custom bh-field__freetext", placeholder: entry.placeholder || "Type here...", rows: "2" });
    input.value = entry.field.value || "";
    input.addEventListener("input", function () { onChange({ value: input.value }); });
    var inputId = "bh-field-" + input.getAttribute("data-bh-key");
    input.id = inputId;
    return el("div", { class: "bh-field" }, [
      el("div", { class: "bh-field__label-row" }, [el("label", { class: "bh-field__label", for: inputId, text: entry.label })]),
      input,
    ]);
  }

  function renderSubPanel(headerText, isChecked, onToggle, renderContent, tooltip) {
    var toggle = el("input", { type: "checkbox", class: "bh-subpanel__toggle" });
    toggle.checked = isChecked;
    toggle.addEventListener("change", function () { onToggle(toggle.checked); });
    var header = el("label", { class: "bh-subpanel__header" }, [toggle, el("span", { text: headerText })]);
    if (tooltip) header.title = tooltip;
    var panel = el("div", { class: "bh-subpanel" }, [header]);
    if (isChecked) panel.appendChild(renderContent());
    return panel;
  }

  // ---------------------------------------------------------------------
  // Generic "checklist with a cap" — Mockup Studio's Surrounding Props
  // (pick up to 5 from a list). Same disable-once-full pattern as Prompt
  // Haus's Collection Builder combine checklist.
  // ---------------------------------------------------------------------
  function renderCappedChecklist(options) {
    var wrap = el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(el("legend", { class: "bh-field-group__title" }, [icon(options.icon || "sparkle"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "bh-field-group__subtitle", text: options.subtitle }));
    var list = el("div", { class: "bh-checklist" });
    options.items.forEach(function (item) {
      var checkbox = el("input", { type: "checkbox", class: "bh-field__checkbox" });
      checkbox.checked = options.selected.indexOf(item) !== -1;
      checkbox.disabled = !checkbox.checked && options.selected.length >= options.cap;
      checkbox.addEventListener("change", function () {
        options.onToggle(item, checkbox.checked);
      });
      list.appendChild(el("label", { class: "bh-checklist__item" }, [checkbox, el("span", { text: item })]));
    });
    wrap.appendChild(list);
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Generic progressive text-slot list — Branding Studio's Core Values
  // (up to N short free-text items, "+ Add" / individual Remove), same
  // progressive pattern as Prompt Haus's Companion/Adults/Kids slots but
  // with one plain text field per slot instead of several.
  // ---------------------------------------------------------------------
  function renderTextSlotList(options) {
    var wrap = el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(el("legend", { class: "bh-field-group__title" }, [icon(options.icon || "heart"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "bh-field-group__subtitle", text: options.subtitle }));
    var fieldsWrap = el("div", { class: "bh-field-group__fields" });
    options.values.forEach(function (value, index) {
      var input = el("input", { type: "text", class: "bh-field__custom", placeholder: options.placeholder || "" });
      input.value = value || "";
      input.addEventListener("input", function () { options.onUpdate(index, input.value); });
      var removeBtn = el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      fieldsWrap.appendChild(el("div", { class: "bh-text-slot-row" }, [input, removeBtn]));
    });
    wrap.appendChild(fieldsWrap);
    if (options.values.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "bh-btn bh-btn--small bh-btn--add",
        text: "+ Add " + options.singular + " (" + (options.values.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "bh-companion__controls" }, [addBtn]));
    }
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Color picker — native input[type=color] (which on most desktop
  // browsers opens the OS's own color picker/spectrum) plus an editable
  // hex text field kept in sync both ways, and a Remove button. Scoped to
  // Branding Studio only, per instruction. Up to `max` swatches.
  // ---------------------------------------------------------------------
  var HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  // A single swatch+hex pair for one named color role (Logo Studio's
  // Primary/Secondary/Accent/Neutral) — the one-item cousin of
  // renderColorPickerList's array (that one's Add/Remove semantics don't
  // fit a fixed named role; there's exactly one primary color, not a
  // variable-length list of them). Reuses the exact same swatch/hex/
  // Change markup and CSS classes so both read as one consistent picker
  // pattern app-wide rather than two different-looking color controls.
  // `value` only ever holds a CONFIRMED complete hex (what the prompt and
  // the swatch preview both read); `draftText` holds whatever's literally
  // typed in the textbox right now, including mid-edit/incomplete strings.
  // Splitting these two was the fix for a real bug: rendering the swatch
  // straight off the in-progress raw text meant it reset to a flat gray
  // placeholder on every keystroke until the exact instant a complete hex
  // was typed — reading as "manually typing a color doesn't work" even
  // though it eventually did. Now the swatch simply holds its last
  // confirmed color until a new one validates, and the textbox is free to
  // show whatever's being typed without fighting the render.
  function renderSingleColorField(entry, onChange) {
    var value = entry.field.value || "";
    var draftText = entry.field.draftText !== undefined ? entry.field.draftText : value;
    var swatchInput = el("input", { type: "color" });
    swatchInput.value = HEX_PATTERN.test(value) ? value : "#6B6860";
    var hexInput = el("input", { type: "text", class: "bh-field__custom bh-color-hex", placeholder: "#000000" });
    hexInput.value = draftText;
    swatchInput.addEventListener("input", function () {
      hexInput.value = swatchInput.value;
      onChange({ value: swatchInput.value, draftText: swatchInput.value });
    });
    hexInput.addEventListener("input", function () {
      var raw = hexInput.value;
      var changes = { draftText: raw };
      if (HEX_PATTERN.test(raw)) changes.value = raw;
      onChange(changes);
    });
    var changeBtn = el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--reset", text: "Change" });
    changeBtn.addEventListener("click", function () { swatchInput.click(); });

    // Include-in-prompt checkbox, same pattern as free-text fields — lets
    // a founder set a color (e.g. from an applied Brand Kit) without it
    // automatically counting toward "too many colors" in the assembled
    // prompt unless they actually want it there.
    var labelRowChildren = [el("label", { class: "bh-field__label", text: entry.label })];
    var includeCheckbox = el("input", { type: "checkbox", class: "bh-field__checkbox" });
    includeCheckbox.checked = entry.field.includeInPrompt !== false;
    includeCheckbox.addEventListener("change", function () { onChange({ includeInPrompt: includeCheckbox.checked }); });
    labelRowChildren.push(el("label", { class: "bh-field__include" }, [includeCheckbox, el("span", { text: "Include in prompt" })]));

    return el("div", { class: "bh-field" }, [
      el("div", { class: "bh-field__label-row" }, labelRowChildren),
      el("div", { class: "bh-color-swatch-item" }, [swatchInput, hexInput, changeBtn]),
      el("p", { class: "bh-field__hint", text: 'Click "Change" to pick visually, or type a complete 6-digit hex code (e.g. #2188BC) to preview it directly.' }),
    ]);
  }

  function renderColorPickerList(options) {
    var wrap = el("fieldset", { class: "bh-field-group" });
    wrap.appendChild(el("legend", { class: "bh-field-group__title" }, [icon("palette"), el("span", { text: options.title })]));
    if (options.subtitle) wrap.appendChild(el("p", { class: "bh-field-group__subtitle", text: options.subtitle }));
    var row = el("div", { class: "bh-color-row" });
    var drafts = options.drafts || [];
    options.colors.forEach(function (hex, index) {
      // Same value/draftText split as renderSingleColorField's fix, applied
      // here too: the swatch only ever reads the last CONFIRMED hex
      // (`hex`), while the textbox shows whatever's currently typed
      // (`draftText`) — without this split, an in-progress incomplete hex
      // flips the swatch to a flat gray placeholder on every keystroke.
      var draftText = drafts[index] !== undefined ? drafts[index] : (hex || "");
      var swatchInput = el("input", { type: "color" });
      swatchInput.value = HEX_PATTERN.test(hex) ? hex : "#6B6860";
      var hexInput = el("input", { type: "text", class: "bh-field__custom bh-color-hex", placeholder: "#000000" });
      hexInput.value = draftText;
      swatchInput.addEventListener("input", function () {
        hexInput.value = swatchInput.value;
        if (options.onDraftChange) options.onDraftChange(index, swatchInput.value);
        options.onUpdate(index, swatchInput.value);
      });
      hexInput.addEventListener("input", function () {
        var raw = hexInput.value;
        if (options.onDraftChange) options.onDraftChange(index, raw);
        if (HEX_PATTERN.test(raw)) options.onUpdate(index, raw);
      });
      // The swatch itself IS the color-wheel trigger (clicking it opens
      // the native picker), but nothing about a small native color input
      // signals that — this button makes "click here to change it" an
      // explicit, obvious action instead of something to discover.
      var changeBtn = el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--reset", text: "Change" });
      changeBtn.addEventListener("click", function () { swatchInput.click(); });
      var removeBtn = el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--delete", text: "Remove" });
      removeBtn.addEventListener("click", function () { options.onRemove(index); });
      row.appendChild(el("div", { class: "bh-color-swatch-item" }, [swatchInput, hexInput, changeBtn, removeBtn]));
    });
    wrap.appendChild(row);
    if (options.colors.length < options.max) {
      var addBtn = el("button", {
        type: "button",
        class: "bh-btn bh-btn--small bh-btn--add",
        text: "+ Add a color (" + (options.colors.length + 1) + " of " + options.max + ")",
      });
      addBtn.addEventListener("click", options.onAdd);
      wrap.appendChild(el("div", { class: "bh-companion__controls" }, [addBtn]));
    }
    return wrap;
  }

  // ---------------------------------------------------------------------
  // Font preview dropdown — each <option> rendered in its own typeface
  // via inline font-family, so you see what a font looks like before
  // picking it. Scoped to Branding Studio only, per instruction. Curated
  // Google Fonts (guaranteed to load for every visitor) plus standard
  // web-safe fonts, not the OS's full local font list — see
  // BrandHaus.FONT_OPTIONS in brand-haus-branding.js.
  // ---------------------------------------------------------------------
  function renderFontPreviewField(entry, onChange) {
    var select = el("select", { class: "bh-field__select bh-font-select" });
    select.appendChild(el("option", { value: "" }, [document.createTextNode("Select...")]));
    (entry.field.options || []).forEach(function (opt) {
      var optionNode = el("option", { value: opt, style: "font-family: '" + opt + "', sans-serif;" });
      optionNode.textContent = opt;
      if (opt === entry.field.value) optionNode.selected = true;
      select.appendChild(optionNode);
    });
    select.addEventListener("change", function () { onChange({ value: select.value }); });
    var selectId = "bh-field-" + select.getAttribute("data-bh-key");
    select.id = selectId;

    var preview = el("p", {
      class: "bh-font-preview",
      style: entry.field.value ? "font-family: '" + entry.field.value + "', sans-serif;" : "",
      text: entry.field.value ? "The quick brown fox — " + entry.field.value : "Pick a font to preview it here.",
    });

    return el("div", { class: "bh-field" }, [
      el("div", { class: "bh-field__label-row" }, [el("label", { class: "bh-field__label", for: selectId, text: entry.label })]),
      select,
      preview,
    ]);
  }

  function fieldRenderFn(entry) {
    if (entry.field.isFreeText) return renderFreeTextField;
    if (entry.isFontPicker) return renderFontPreviewField;
    if (entry.field.isColorPicker) return renderSingleColorField;
    return renderField;
  }

  function renderFieldGroup(title, entries, onChange, subtitle) {
    var fieldsContainer = el("div", { class: "bh-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(renderFn(entry, function (changes) { onChange(entry, changes); }));
    });
    var titleIcon = TITLE_ICONS[title];
    var legend = titleIcon
      ? el("legend", { class: "bh-field-group__title" }, [icon(titleIcon), el("span", { text: title })])
      : el("legend", { class: "bh-field-group__title", text: title });
    var children = [legend];
    if (subtitle) children.push(el("p", { class: "bh-field-group__subtitle", text: subtitle }));
    children.push(fieldsContainer);
    return el("fieldset", { class: "bh-field-group" }, children);
  }

  function renderPlainFieldRow(entries, onChange) {
    var fieldsContainer = el("div", { class: "bh-field-group__fields" });
    entries.forEach(function (entry) {
      var renderFn = fieldRenderFn(entry);
      fieldsContainer.appendChild(renderFn(entry, function (changes) { onChange(entry, changes); }));
    });
    return fieldsContainer;
  }

  // ---------------------------------------------------------------------
  // Business/Voice DNA bar
  // ---------------------------------------------------------------------
  var NEGATIVE_SUGGESTIONS = ["jargon", "buzzwords", "exclamation points", "emojis", "clickbait", "corporate speak"];

  function renderIdentityBar(root) {
    var state = BrandHaus.identity.getState();

    var nameInput = el("input", { type: "text", class: "bh-field__select", placeholder: "Your business name" });
    nameInput.value = state.businessName.value || "";
    nameInput.addEventListener("input", function () {
      BrandHaus.identity.setBusinessName(nameInput.value);
    });
    var nameId = "bh-field-" + nameInput.getAttribute("data-bh-key");
    nameInput.id = nameId;

    var negativeTextarea = el("textarea", { class: "bh-field__custom bh-field__freetext bh-styledna__negative-input", rows: "2", placeholder: 'e.g. "jargon, buzzwords, emojis"' });
    negativeTextarea.value = state.negativePrompt.value || "";
    negativeTextarea.addEventListener("input", function () {
      BrandHaus.identity.updateNegativePromptField({ value: negativeTextarea.value });
      renderApp();
    });
    var negativeId = "bh-field-" + negativeTextarea.getAttribute("data-bh-key");
    negativeTextarea.id = negativeId;
    var chips = el("div", { class: "bh-styledna__negative-chips" });
    NEGATIVE_SUGGESTIONS.forEach(function (item) {
      var chip = el("button", { type: "button", class: "bh-styledna__negative-chip", text: item });
      chip.title = 'Add "' + item + '" to the list above.';
      chip.addEventListener("click", function () {
        var current = (negativeTextarea.value || "").trim();
        var next = current ? current + ", " + item : item;
        BrandHaus.identity.updateNegativePromptField({ value: next });
        renderApp();
      });
      chips.appendChild(chip);
    });

    var negativeFieldChildren = [
      labelWithIcon("shield", "Negative Prompt — What to Avoid", negativeId),
      el("p", { class: "bh-styledna__negative-subtitle", text: "Applies to every studio, once, at the end of the prompt — comma-separated. Click a suggestion to add it." }),
      negativeTextarea,
      chips,
    ];
    // Scoped to just this field — the mode's own Reset wipes every
    // selection in that mode too, not just this list. Only shown once
    // there's something to clear.
    if ((state.negativePrompt.value || "").trim()) {
      var negativeClearBtn = el("button", { type: "button", class: "bh-btn bh-btn--small bh-btn--reset bh-styledna__negative-clear" }, [el("span", { text: "Clear Negative Prompt" })]);
      negativeClearBtn.addEventListener("click", function () {
        BrandHaus.identity.updateNegativePromptField({ value: "" });
        renderApp();
      });
      negativeFieldChildren.push(negativeClearBtn);
    }

    var children = [
      el("div", { class: "bh-styledna__field" }, [labelWithIcon("shirt", "Business Name", nameId, null, "Set once here — carries into Branding Studio and Logo Studio automatically."), nameInput]),
      el("div", { class: "bh-styledna__field bh-styledna__field--full" }, negativeFieldChildren),
    ];
    root.appendChild(el("div", { class: "bh-styledna" }, children));
  }

  // ---------------------------------------------------------------------
  // Quality nudge, preview actions, export row, preview
  // ---------------------------------------------------------------------
  var QUALITY_NUDGE_THRESHOLD = 15;
  function renderQualityNudge(assembled) {
    var count = (assembled.fragments || []).length;
    if (count <= QUALITY_NUDGE_THRESHOLD) return null;
    return el("div", { class: "bh-preview__nudge" }, [
      icon("warning", "bh-preview__nudge-icon"),
      el("span", { text: "Heads up: you've got " + count + " details selected — results tend to look cleaner with a more focused set (aim for 5-10)." }),
    ]);
  }

  function renderPreviewActions(formatted, onRandomize, onReset, onSave, mode) {
    var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--copy" }, [icon("copy"), el("span", { class: "bh-btn__label", text: "Copy My Prompt" })]);
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy My Prompt"; }, 1500);
      });
      BrandHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
      refreshRecentLogPanel();
    });

    var randomizeBtn = el("button", { type: "button", class: "bh-btn bh-btn--randomize" }, [icon("shuffle"), el("span", { text: "Randomize" })]);
    randomizeBtn.title = 'Picks a new random value for every field with "Include in prompt" checked, and clears any typed custom value for those fields.';
    randomizeBtn.addEventListener("click", onRandomize);

    var resetBtn = el("button", { type: "button", class: "bh-btn bh-btn--reset" }, [icon("refresh"), el("span", { text: "Reset" })]);
    resetBtn.title = "Clears every field back to Select.../None.";
    resetBtn.addEventListener("click", onReset);

    var isFull = BrandHaus.favorites.isFull(mode);
    var saveBtn = el("button", { type: "button", class: "bh-btn bh-btn--save" }, [icon("vault"), el("span", { text: "Save to Vault" })]);
    saveBtn.disabled = isFull;
    saveBtn.title = isFull
      ? "You have " + BrandHaus.favorites.MAX_PER_MODE + "/" + BrandHaus.favorites.MAX_PER_MODE + " saved here — delete one below to save another."
      : "Saves this exact prompt text below (up to " + BrandHaus.favorites.MAX_PER_MODE + " per studio).";
    saveBtn.addEventListener("click", function () {
      onSave();
      BrandHaus.favorites.logRecent(mode, { text: formatted, snapshot: buildVaultSnapshot(mode) });
    });

    var actionsGrid = el("div", { class: "bh-preview__actions" }, [randomizeBtn, copyBtn, saveBtn, resetBtn]);
    var exportRow = renderExportRow(formatted, mode);
    return el("div", {}, [actionsGrid, exportRow]);
  }

  function renderExportRow(formatted, mode) {
    var shareBtn = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("share"), el("span", { class: "bh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows this exact prompt to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(formatted), function (ok) {
        var label = shareBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn2 = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("copy"), el("span", { class: "bh-btn__label", text: "Copy" })]);
    copyBtn2.addEventListener("click", function () {
      copyTextToClipboard(formatted, function (ok) {
        var label = copyBtn2.querySelector(".bh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads this prompt as a .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(formatted, "brand-haus-" + mode + "-prompt.txt"); });
    var printBtn = el("button", { type: "button", class: "bh-btn bh-btn--export" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of this prompt.";
    printBtn.addEventListener("click", function () { printPromptText(formatted); });
    return el("div", { class: "bh-preview__export-row" }, [shareBtn, copyBtn2, downloadBtn, printBtn]);
  }

  var saveFeedback = null;

  function renderPreview(root, assembled, modeApi, mode) {
    var formatted = BrandHaus.engine.formatForPlatform(assembled, BrandHaus.identity.getState().negativePrompt.value);
    var textarea = el("textarea", { class: "bh-preview__text", readonly: "readonly" });
    textarea.value = formatted;

    var actions = renderPreviewActions(
      formatted,
      function () { modeApi.randomize(); renderApp(); },
      function () { modeApi.reset(); BrandHaus.identity.reset(); renderApp(); },
      function () {
        var result = BrandHaus.favorites.save(mode, {
          text: formatted,
          title: buildVaultTitle(mode),
          snapshot: buildVaultSnapshot(mode),
        });
        saveFeedback = result.ok ? { text: "Saved!", isError: false } : { text: result.reason, isError: true };
        renderApp();
        setTimeout(function () { saveFeedback = null; renderApp(); }, 2500);
      },
      mode
    );

    var previewChildren = [
      el("h3", { class: "bh-preview__title" }, [icon("lightning"), el("span", { text: "Your Prompt, Built Live" })]),
      el("p", { class: "bh-preview__subtitle", text: "Watch your creative direction turn into a ready-to-use AI prompt." }),
    ];
    var qualityNudge = renderQualityNudge(assembled);
    if (qualityNudge) previewChildren.push(qualityNudge);
    previewChildren.push(textarea, actions);
    if (saveFeedback) {
      previewChildren.push(el("p", { class: "bh-preview__save-feedback" + (saveFeedback.isError ? " is-error" : " is-success"), text: saveFeedback.text }));
    }
    root.appendChild(el("div", { class: "bh-preview" }, previewChildren));
  }

  // ---------------------------------------------------------------------
  // Your Vault
  // ---------------------------------------------------------------------
  var vaultExpanded = false;
  var renamingVaultId = null;

  function renderSavedPrompts(root, mode) {
    var saved = BrandHaus.favorites.getAll(mode).slice().reverse();
    var max = BrandHaus.favorites.MAX_PER_MODE;
    var list = el("div", { class: "bh-saved__list" });
    if (!saved.length) {
      list.appendChild(el("p", { class: "bh-saved__empty", text: "Your vault is empty — use \"Save to Vault\" above." }));
    } else {
      var visible = vaultExpanded ? saved : saved.slice(0, 1);
      visible.forEach(function (fav, index) {
        var currentVersion = BrandHaus.favorites.getCurrentVersion(fav);
        var versionCount = BrandHaus.favorites.getVersionCount(fav);
        var preview = currentVersion.text.length > 160 ? currentVersion.text.slice(0, 160) + "…" : currentVersion.text;

        var titleRow;
        if (renamingVaultId === fav.id) {
          var titleInput = el("input", { type: "text", class: "bh-saved__item-title-input", value: fav.title || "" });
          var confirmRename = function () {
            BrandHaus.favorites.rename(mode, fav.id, titleInput.value.trim() || ("Untitled " + (index + 1)));
            renamingVaultId = null;
            renderApp();
          };
          titleInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") confirmRename();
            if (e.key === "Escape") { renamingVaultId = null; renderApp(); }
          });
          titleInput.addEventListener("blur", confirmRename);
          titleRow = el("div", { class: "bh-saved__item-title-row" }, [titleInput]);
        } else {
          var renameBtn = el("button", { type: "button", class: "bh-saved__rename-btn", "aria-label": "Rename this saved prompt", title: "Rename" }, [icon("edit")]);
          renameBtn.addEventListener("click", function () { renamingVaultId = fav.id; renderApp(); });
          titleRow = el("div", { class: "bh-saved__item-title-row" }, [
            el("p", { class: "bh-saved__item-title", text: fav.title || "Untitled " + (index + 1) }),
            renameBtn,
          ]);
        }

        var loadBtn = null;
        if (currentVersion.snapshot) {
          loadBtn = el("button", { type: "button", class: "bh-btn bh-btn--load bh-btn--small", text: "Load" });
          loadBtn.title = "Restores every field in the builder to exactly how it was when this version was saved.";
          loadBtn.addEventListener("click", function () { loadVaultSnapshot(mode, currentVersion.snapshot); renderApp(); });
        }

        var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--copy bh-btn--small", text: "Copy" });
        copyBtn.addEventListener("click", function () {
          copyTextToClipboard(currentVersion.text, function (ok) {
            copyBtn.textContent = ok ? "Copied!" : "Copy failed";
            setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
          });
        });

        var saveVersionBtn = el("button", { type: "button", class: "bh-btn bh-btn--small", text: "Save as New Version" });
        saveVersionBtn.title = "Adds the prompt you're currently building as a new version of this item — doesn't use up another Vault slot.";
        saveVersionBtn.addEventListener("click", function () {
          var textarea = document.querySelector(".bh-preview__text");
          if (!textarea || !textarea.value) return;
          BrandHaus.favorites.addVersion(mode, fav.id, { text: textarea.value, snapshot: buildVaultSnapshot(mode) });
          renderApp();
        });

        var deleteBtn = el("button", { type: "button", class: "bh-btn bh-btn--delete bh-btn--small", text: "Delete" });
        deleteBtn.title = versionCount > 1 ? "Deletes this item and all " + versionCount + " of its versions." : "Deletes this item.";
        deleteBtn.addEventListener("click", function () { BrandHaus.favorites.remove(mode, fav.id); renderApp(); });

        var actionBtns = [];
        if (loadBtn) actionBtns.push(loadBtn);
        actionBtns.push(copyBtn, saveVersionBtn, deleteBtn);

        var itemChildren = [titleRow];
        if (versionCount > 1) {
          var versionSelect = el("select", { class: "bh-saved__version-select" });
          fav.versions.forEach(function (v, vi) {
            var isLatest = vi === fav.versions.length - 1;
            var optionNode = el("option", { value: String(vi) }, [document.createTextNode("Version " + (vi + 1) + (isLatest ? " (latest)" : ""))]);
            var activeIdx = typeof fav.activeVersionIndex === "number" ? fav.activeVersionIndex : fav.versions.length - 1;
            if (vi === activeIdx) optionNode.selected = true;
            versionSelect.appendChild(optionNode);
          });
          versionSelect.title = "Switch which saved version of this item you're viewing.";
          versionSelect.addEventListener("change", function () {
            BrandHaus.favorites.setActiveVersion(mode, fav.id, parseInt(versionSelect.value, 10));
            renderApp();
          });
          itemChildren.push(el("div", { class: "bh-saved__version-row" }, [icon("layers"), versionSelect]));
        }
        itemChildren.push(
          el("p", { class: "bh-saved__item-text", text: preview }),
          el("div", { class: "bh-saved__item-meta" }, [
            el("span", { class: "bh-saved__item-tag", text: new Date(currentVersion.createdAt).toLocaleDateString() }),
            el("div", { class: "bh-saved__item-actions" }, actionBtns),
          ])
        );
        list.appendChild(el("div", { class: "bh-saved__item" }, itemChildren));
      });
    }

    var headerChildren = [el("h3", { class: "bh-saved__title" }, [icon("vault"), el("span", { text: "Your Vault (" + saved.length + "/" + max + ")" })])];
    if (saved.length > 1) {
      var vaultToggleBtn = el("button", { type: "button", class: "bh-faq__toggle" }, [
        icon(vaultExpanded ? "eyeOff" : "eye"),
        el("span", { text: vaultExpanded ? "Hide" : "Show full list" }),
      ]);
      vaultToggleBtn.addEventListener("click", function () { vaultExpanded = !vaultExpanded; renderApp(); });
      headerChildren.push(vaultToggleBtn);
    }
    root.appendChild(el("div", { class: "bh-saved" }, [el("div", { class: "bh-faq__header" }, headerChildren), renderFullVaultExportRow(), list]));
  }

  // ---------------------------------------------------------------------
  // Recently Generated
  // ---------------------------------------------------------------------
  var recentLogExpanded = false;

  function refreshRecentLogPanel() {
    var existing = document.querySelector(".bh-recent");
    if (!existing) return;
    var captured = null;
    renderRecentLog({ appendChild: function (node) { captured = node; } });
    if (captured) existing.replaceWith(captured);
  }

  function renderRecentLogItem(entry) {
    var preview = entry.text.length > 160 ? entry.text.slice(0, 160) + "…" : entry.text;
    var loadBtn = null;
    if (entry.snapshot) {
      loadBtn = el("button", { type: "button", class: "bh-btn bh-btn--load bh-btn--small", text: "Load" });
      loadBtn.title = "Restores every field in the builder to exactly how it was when this was generated.";
      loadBtn.addEventListener("click", function () {
        loadVaultSnapshot(entry.mode, entry.snapshot);
        if (entry.mode === "branding" || entry.mode === "logo") {
          activeStep = "brandingStudio";
          brandingSubMode = entry.mode;
        } else if (entry.mode.indexOf("gen:") === 0) {
          activeStep = "brandingStudio";
          brandingSubMode = "quickGenerators";
          BrandHaus.generators.setActiveGenerator(entry.mode.slice(4));
        }
        renderApp();
        scrollShellToTop();
      });
    }
    var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--copy bh-btn--small", text: "Copy" });
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(entry.text, function (ok) {
        copyBtn.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
      });
    });
    var deleteBtn = el("button", { type: "button", class: "bh-btn bh-btn--delete bh-btn--small", text: "Delete" });
    deleteBtn.addEventListener("click", function () { BrandHaus.favorites.removeRecent(entry.id); renderApp(); });

    var metaParts = [modeLabel(entry.mode), new Date(entry.loggedAt).toLocaleString()];
    var actionBtns = [];
    if (loadBtn) actionBtns.push(loadBtn);
    actionBtns.push(copyBtn, deleteBtn);
    return el("div", { class: "bh-saved__item" }, [
      el("p", { class: "bh-saved__item-text", text: preview }),
      el("div", { class: "bh-saved__item-meta" }, [
        el("span", { class: "bh-saved__item-tag", text: metaParts.join(" · ") }),
        el("div", { class: "bh-saved__item-actions" }, actionBtns),
      ]),
    ]);
  }

  function renderRecentLog(root) {
    var recent = BrandHaus.favorites.getRecentLog();
    var list = el("div", { class: "bh-saved__list" });
    if (!recent.length) {
      list.appendChild(el("p", { class: "bh-saved__empty", text: "Nothing generated yet — this fills in automatically as you Copy or Save prompts." }));
    } else {
      var visible = recentLogExpanded ? recent : recent.slice(0, 1);
      visible.forEach(function (entry) { list.appendChild(renderRecentLogItem(entry)); });
    }
    var headerChildren = [el("h3", { class: "bh-saved__title" }, [icon("refresh"), el("span", { text: "Recently Generated (" + recent.length + "/" + BrandHaus.favorites.RECENT_LOG_MAX + ")" })])];
    if (recent.length > 1) {
      var toggleBtn = el("button", { type: "button", class: "bh-faq__toggle" }, [
        icon(recentLogExpanded ? "eyeOff" : "eye"),
        el("span", { text: recentLogExpanded ? "Hide" : "Show all" }),
      ]);
      toggleBtn.addEventListener("click", function () { recentLogExpanded = !recentLogExpanded; renderApp(); });
      headerChildren.push(toggleBtn);
    }
    var children = [el("div", { class: "bh-faq__header" }, headerChildren)];
    if (recent.length) {
      var clearBtn = el("button", { type: "button", class: "bh-btn bh-btn--delete bh-btn--small", text: "Clear All" });
      clearBtn.title = "Clears this automatic log — doesn't touch anything in Your Vault.";
      clearBtn.addEventListener("click", function () { BrandHaus.favorites.clearRecentLog(); renderApp(); });
      children.push(el("div", { class: "bh-recent__clear-row" }, [clearBtn]));
    }
    children.push(
      el("p", { class: "bh-field-group__subtitle", text: "Auto-saved on Copy/Save, most recent first — Load restores every field, same as Your Vault." }),
      list
    );
    root.appendChild(el("div", { class: "bh-saved bh-recent" }, children));
  }

  function renderFullVaultExportRow() {
    var all = BrandHaus.favorites.getAllFlat();
    if (!all.length) return el("div", {});
    var fullText = buildFullVaultText();
    var shareBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("share"), el("span", { class: "bh-btn__label", text: "Share" })]);
    shareBtn.title = "Copies a link that shows your entire saved vault to whoever opens it.";
    shareBtn.addEventListener("click", function () {
      copyTextToClipboard(buildShareUrl(fullText), function (ok) {
        var label = shareBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Link Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Share"; }, 1500);
      });
    });
    var copyBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("copy"), el("span", { class: "bh-btn__label", text: "Copy" })]);
    copyBtn.title = "Copies every saved prompt across every studio as one block of text.";
    copyBtn.addEventListener("click", function () {
      copyTextToClipboard(fullText, function (ok) {
        var label = copyBtn.querySelector(".bh-btn__label");
        label.textContent = ok ? "Copied!" : "Copy failed";
        setTimeout(function () { label.textContent = "Copy"; }, 1500);
      });
    });
    var downloadBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("download"), el("span", { text: "Download" })]);
    downloadBtn.title = "Downloads every saved prompt across every studio as one .txt file.";
    downloadBtn.addEventListener("click", function () { downloadTextAsFile(fullText, "brand-haus-full-vault.txt"); });
    var printBtn = el("button", { type: "button", class: "bh-btn bh-btn--export bh-btn--small" }, [icon("print"), el("span", { text: "Print" })]);
    printBtn.title = "Opens a clean, print-friendly view of your entire saved vault.";
    printBtn.addEventListener("click", function () { printPromptText(fullText); });
    return el("div", { class: "bh-saved__vault-export" }, [shareBtn, copyBtn, downloadBtn, printBtn]);
  }

  // ---------------------------------------------------------------------
  // Your Selections — simplified from Prompt Haus's own Creative Brief:
  // just the toggleable full list of resolved fields, no per-mode
  // headline-facts row (that needs bespoke copy per studio, deferred).
  // ---------------------------------------------------------------------
  var selectionsExpanded = false;

  function renderSelectionsPanel(root, mode, groups) {
    var totalItemCount = groups.reduce(function (sum, g) { return sum + g.items.length; }, 0);
    var eyeBtn = el("button", { type: "button", class: "bh-selections__eye-btn" }, [
      icon(selectionsExpanded ? "eyeOff" : "eye"),
      el("span", { text: selectionsExpanded ? "Hide full list" : "Show full list (" + totalItemCount + ")" }),
    ]);
    eyeBtn.addEventListener("click", function () { selectionsExpanded = !selectionsExpanded; renderApp(); });

    var children = [
      el("div", { class: "bh-selections__header" }, [
        el("h3", { class: "bh-selections__title" }, [icon("document"), el("span", { text: "Your Selections" })]),
        eyeBtn,
      ]),
    ];
    if (selectionsExpanded) {
      var body;
      if (!groups.length) {
        body = el("p", { class: "bh-selections__empty", text: "Nothing selected yet — choices you make above will appear here." });
      } else {
        body = el("div", { class: "bh-selections__scroll" });
        groups.forEach(function (group, idx) {
          if (idx > 0) body.appendChild(el("hr", { class: "bh-selections__divider" }));
          body.appendChild(el("h4", { class: "bh-selections__group-title", text: group.title }));
          group.items.forEach(function (item) {
            body.appendChild(el("div", { class: "bh-selections__item" }, [
              el("span", { class: "bh-selections__item-label", text: item.label + ":" }),
              el("span", { class: "bh-selections__item-value", text: " " + item.value }),
            ]));
          });
        });
      }
      children.push(el("hr", { class: "bh-selections__divider" }), body);
    }
    root.appendChild(el("div", { class: "bh-selections" }, children));
  }

  // ---------------------------------------------------------------------
  // Vault/recent-log labels — keyed by originating studio ("branding" /
  // "logo"), not by wizard step. Founder Interview never uses the vault
  // system (it has its own Apply/Retake flow), so it's not in this map.
  // ---------------------------------------------------------------------
  var MODE_LABELS = {
    branding: "Branding Studio",
    logo: "Logo Studio",
  };

  // ---------------------------------------------------------------------
  // Sidebar wizard + step router
  // ---------------------------------------------------------------------
  var STEPS = ["archetypeGuide", "welcome", "conversation", "brandDNA", "blueprint", "pathIntake", "brandingStudio"];
  // Focus mode (?bh_focus=1) — used when the P2P Operating System embeds this as the
  // "Founders Assessment": hide the Branding Studio step so it's assessment-only.
  var BH_FOCUS = false;
  try { BH_FOCUS = new URLSearchParams(window.location.search).get("bh_focus") === "1"; } catch (e) {}
  function visibleSteps() { return BH_FOCUS ? STEPS.filter(function (s) { return s !== "brandingStudio"; }) : STEPS; }
  var STEP_LABELS = {
    archetypeGuide: "The Archetype Guide",
    welcome: "Welcome",
    conversation: "Brand DNA Assessment",
    brandDNA: "Your Brand DNA",
    pathIntake: "Find Your Direction",
    brandingStudio: "Branding Studio",
    blueprint: "Your Blueprint",
  };
  var STEP_ICONS = {
    archetypeGuide: "compass",
    welcome: "sparkle",
    conversation: "bulb",
    brandDNA: "layers",
    pathIntake: "peak",
    brandingStudio: "palette",
    blueprint: "document",
  };

  var activeStep = "archetypeGuide";
  // A standalone overlay view, not a numbered step — set true by the
  // sidebar's "FAQ & Help" link, set false by its own back button. Checked
  // at the top of renderStepContent so it can interrupt any step without
  // disturbing activeStep (closing it returns you exactly where you were).
  var showFaq = false;
  var brandingSubMode = "branding"; // "branding" | "logo" | "quickGenerators" — sub-nav within the Branding Studio step
  var lastAutoAppliedResults = null;
  var historyPanelOpen = false;
  var historyExpandedIndex = -1;
  var HISTORY_MODE = "assessment";

  // Quick Generators lives as a third sub-tab alongside Branding/Logo
  // Studio (not its own top-level step) — it's a sibling capability that
  // belongs grouped with the rest of "building the brand," not a separate
  // destination in the main wizard flow.
  var BRANDING_SUBSTEPS = ["branding", "logo", "quickGenerators"];
  var BRANDING_SUBSTEP_LABELS = { logo: "Logo Studio", branding: "Branding Studio", quickGenerators: "Quick Generators" };
  var BRANDING_SUBSTEP_ICONS = { logo: "logoMark", branding: "palette", quickGenerators: "crop" };

  // Every step (Branding Studio, Logo Studio, Your Blueprint, etc.) reads
  // top-to-bottom, so a founder landing mid-scroll on a new step feels
  // broken rather than guided. Called on every step/sub-step switch, never
  // on in-place re-renders (e.g. editing a field), so normal interaction
  // never yanks the page around.
  function scrollShellToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  // Lets other mode files (e.g. brand-haus-results.js's chapter-6 CTAs)
  // navigate the wizard without reaching into this file's closure state.
  function setActiveStep(step) {
    if (STEPS.indexOf(step) === -1) return;
    activeStep = step;
    renderApp();
    scrollShellToTop();
  }

  function renderSidebar(root) {
    var list = el("div", { class: "bh-sidebar__steps" });
    visibleSteps().forEach(function (step, index) {
      var isActive = step === activeStep;
      var btn = el("button", {
        type: "button",
        class: "bh-sidebar__step" + (isActive ? " is-active" : ""),
      }, [
        el("span", { class: "bh-sidebar__step-number", text: String(index + 1) }),
        icon(STEP_ICONS[step], "bh-sidebar__step-icon"),
        el("span", { class: "bh-sidebar__step-label", text: STEP_LABELS[step] }),
      ]);
      btn.addEventListener("click", function () { activeStep = step; renderApp(); scrollShellToTop(); });
      list.appendChild(btn);

      if (step === "brandingStudio" && isActive) {
        var subList = el("div", { class: "bh-sidebar__substeps" });
        BRANDING_SUBSTEPS.forEach(function (sub) {
          var subBtn = el("button", {
            type: "button",
            class: "bh-sidebar__substep" + (brandingSubMode === sub ? " is-active" : ""),
          }, [icon(BRANDING_SUBSTEP_ICONS[sub], "bh-sidebar__substep-icon"), el("span", { text: BRANDING_SUBSTEP_LABELS[sub] })]);
          subBtn.addEventListener("click", function () { brandingSubMode = sub; renderApp(); scrollShellToTop(); });
          subList.appendChild(subBtn);
        });
        list.appendChild(subList);
      }
    });
    var innerChildren = [
      el("p", { class: "bh-sidebar__brand", text: "Brand Strategy Steps" }),
      list,
    ];
    var historyBlock = renderHistoryBlock();
    if (historyBlock) innerChildren.push(historyBlock);
    var savedResultsBlock = renderSavedResultsBlock();
    if (savedResultsBlock) innerChildren.push(savedResultsBlock);
    innerChildren.push(renderFaqSidebarLink());

    root.appendChild(el("nav", { class: "bh-sidebar", "aria-label": "Brand Haus steps" }, [
      el("div", { class: "bh-sidebar__inner" }, innerChildren),
    ]));
  }

  // Newest first — addVersion always appends, so the plain array order
  // is oldest-first; a founder checking history cares about the most
  // recent completion first.
  function listAssessmentVersions(fav) {
    var versions = fav.versions && fav.versions.length
      ? fav.versions
      : [{ text: fav.text, snapshot: fav.snapshot, createdAt: fav.createdAt }];
    return versions.slice().reverse();
  }

  function formatHistoryDate(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  // Every completed assessment run — timestamped, viewable without
  // touching the live wizard state, per the founder's request for
  // something like Content Haus's prompt vault but for results instead
  // of prompts. Lives in the sidebar (visible from any step) rather than
  // a page-specific panel, reusing BrandHaus.favorites' existing Version
  // History mechanics under a dedicated "assessment" mode instead of a
  // second storage system.
  function renderHistoryBlock() {
    if (!BrandHaus.favorites) return null;
    var items = BrandHaus.favorites.getAll(HISTORY_MODE);
    if (!items.length) return null;
    var fav = items[0];
    var versions = listAssessmentVersions(fav);

    var toggle = el("button", { type: "button", class: "bh-sidebar__history-toggle" }, [
      icon("layers", "bh-sidebar__substep-icon"),
      el("span", { text: "Version History (" + versions.length + ")" }),
    ]);
    toggle.addEventListener("click", function () {
      historyPanelOpen = !historyPanelOpen;
      historyExpandedIndex = -1;
      renderApp();
    });

    // versions is newest-first (see listAssessmentVersions), but
    // BrandHaus.favorites.setActiveVersion expects an index into the
    // underlying oldest-first fav.versions array — this converts between
    // the two so "Restore" marks the right version as active in the vault.
    var totalVersions = versions.length;
    var children = [toggle];
    if (historyPanelOpen) {
      var listEl = el("div", { class: "bh-sidebar__history-list" });
      versions.forEach(function (v, i) {
        var row = el("button", { type: "button", class: "bh-sidebar__history-row" }, [
          el("span", { class: "bh-sidebar__history-date", text: formatHistoryDate(v.createdAt) }),
          el("span", { class: "bh-sidebar__history-name", text: v.text || "" }),
        ]);
        row.addEventListener("click", function () {
          historyExpandedIndex = historyExpandedIndex === i ? -1 : i;
          renderApp();
        });
        listEl.appendChild(row);
        if (historyExpandedIndex === i && v.snapshot) {
          var originalIndex = totalVersions - 1 - i;
          listEl.appendChild(renderHistorySnapshotPreview(v.snapshot, fav.id, originalIndex));
        }
      });
      var clearBtn = el("button", { type: "button", class: "bh-sidebar__history-clear", text: "Clear History" });
      clearBtn.addEventListener("click", function () {
        BrandHaus.favorites.remove(HISTORY_MODE, fav.id);
        historyPanelOpen = false;
        historyExpandedIndex = -1;
        renderApp();
      });
      listEl.appendChild(clearBtn);
      children.push(listEl);
    }
    return el("div", { class: "bh-sidebar__history" }, children);
  }

  // Read-only summary by default, but "Restore This Version" is a real
  // action — it swaps the live results to this past snapshot, marks it
  // active in the vault (so history stays consistent with what's live),
  // and jumps to Your Brand DNA. A confirm guards it since it silently
  // overwrites whatever the founder is currently looking at.
  function renderHistorySnapshotPreview(snapshot, favId, versionIndex) {
    var profile = snapshot.match.best.profile;
    var founderOutput = snapshot.founderOutput;
    var roleOrder = ["primary", "secondary", "neutral", "accent", "support", "standOut"];
    var swatches = roleOrder.filter(function (role) { return profile.output.colors[role]; }).map(function (role) {
      return el("span", { class: "bh-sidebar__history-swatch", style: "background:" + profile.output.colors[role] + ";" });
    });
    var restoreBtn = el("button", { type: "button", class: "bh-sidebar__history-restore" }, [icon("refresh", "bh-sidebar__substep-icon"), el("span", { text: "Restore This Version" })]);
    restoreBtn.title = "Makes this the version shown on Your Brand DNA — your current results stay saved in this same history, just no longer the active one.";
    restoreBtn.addEventListener("click", function () {
      if (favId != null && versionIndex != null) BrandHaus.favorites.setActiveVersion(HISTORY_MODE, favId, versionIndex);
      BrandHaus.founderInterview.setState({ results: snapshot, step: "results", celebrationDismissed: true });
      historyPanelOpen = false;
      historyExpandedIndex = -1;
      setActiveStep("brandDNA");
    });
    return el("div", { class: "bh-sidebar__history-preview" }, [
      el("p", { class: "bh-sidebar__history-preview-name", text: profile.name }),
      el("p", { class: "bh-sidebar__history-preview-mission", text: founderOutput.missionStatement }),
      el("p", { class: "bh-sidebar__history-preview-values", text: founderOutput.values.join(" · ") }),
      el("div", { class: "bh-sidebar__history-swatches" }, swatches),
      restoreBtn,
    ]);
  }

  // ---------------------------------------------------------------------
  // Saved Results — a small, founder-curated vault sitting right below
  // Version History, and deliberately separate from it. History is
  // automatic (a new entry every retake, capped at 5, no naming); this is
  // opt-in (an explicit "Save Current Results" click, capped at 3,
  // renamable) so a founder can deliberately keep a couple of favorite
  // runs to compare or return to, independent of whatever their most
  // recent retake happens to be. Modeled on the standard Vault's
  // rename/load/delete pattern (renderSavedPrompts above) rather than
  // History's read-only-with-restore pattern, since these are curated
  // choices, not an audit trail.
  // ---------------------------------------------------------------------
  var SAVED_RESULTS_MODE = "assessmentSaved";
  var SAVED_RESULTS_MAX = 3;
  var savedResultsPanelOpen = false;
  var savedResultsExpandedIndex = -1;
  var renamingSavedResultId = null;

  function renderSavedResultsBlock() {
    if (!BrandHaus.favorites) return null;
    var results = BrandHaus.founderInterview.getState().results;
    var saved = BrandHaus.favorites.getAll(SAVED_RESULTS_MODE).slice().reverse();
    if (!saved.length && !results) return null;
    var full = BrandHaus.favorites.isFull(SAVED_RESULTS_MODE, SAVED_RESULTS_MAX);

    var toggle = el("button", { type: "button", class: "bh-sidebar__history-toggle" }, [
      icon("vault", "bh-sidebar__substep-icon"),
      el("span", { text: "Saved Results (" + saved.length + "/" + SAVED_RESULTS_MAX + ")" }),
    ]);
    toggle.addEventListener("click", function () {
      savedResultsPanelOpen = !savedResultsPanelOpen;
      savedResultsExpandedIndex = -1;
      renderApp();
    });

    var children = [toggle];
    if (savedResultsPanelOpen) {
      var listEl = el("div", { class: "bh-sidebar__history-list" });

      if (results) {
        var saveBtn = el("button", { type: "button", class: "bh-sidebar__history-restore", text: full ? "Vault Full — Delete One to Save Another" : "+ Save Current Results" });
        saveBtn.disabled = full;
        if (!full) {
          saveBtn.addEventListener("click", function () {
            var profile = results.match.best.profile;
            BrandHaus.favorites.save(SAVED_RESULTS_MODE, { title: profile.name, text: profile.name, snapshot: results }, SAVED_RESULTS_MAX);
            renderApp();
          });
        }
        listEl.appendChild(saveBtn);
      }

      if (!saved.length) {
        listEl.appendChild(el("p", { class: "bh-saved__empty", text: "No saved results yet — use \"Save Current Results\" above to keep one here for later." }));
      } else {
        saved.forEach(function (fav, index) {
          var titleRow;
          if (renamingSavedResultId === fav.id) {
            var titleInput = el("input", { type: "text", class: "bh-saved__item-title-input", value: fav.title || "" });
            var confirmRename = function () {
              BrandHaus.favorites.rename(SAVED_RESULTS_MODE, fav.id, titleInput.value.trim() || fav.text);
              renamingSavedResultId = null;
              renderApp();
            };
            titleInput.addEventListener("keydown", function (e) {
              if (e.key === "Enter") confirmRename();
              if (e.key === "Escape") { renamingSavedResultId = null; renderApp(); }
            });
            titleInput.addEventListener("blur", confirmRename);
            titleRow = el("div", { class: "bh-saved__item-title-row" }, [titleInput]);
          } else {
            var renameBtn = el("button", { type: "button", class: "bh-saved__rename-btn", "aria-label": "Rename this saved result", title: "Rename" }, [icon("edit")]);
            renameBtn.addEventListener("click", function (e) { e.stopPropagation(); renamingSavedResultId = fav.id; renderApp(); });
            titleRow = el("div", { class: "bh-saved__item-title-row" }, [
              el("p", { class: "bh-saved__item-title", text: fav.title || fav.text }),
              renameBtn,
            ]);
          }

          var row = el("button", { type: "button", class: "bh-sidebar__history-row" }, [
            el("span", { class: "bh-sidebar__history-date", text: formatHistoryDate(fav.createdAt) }),
            el("span", { class: "bh-sidebar__history-name", text: fav.title || fav.text }),
          ]);
          row.addEventListener("click", function () {
            savedResultsExpandedIndex = savedResultsExpandedIndex === index ? -1 : index;
            renderApp();
          });

          listEl.appendChild(titleRow);
          listEl.appendChild(row);
          if (savedResultsExpandedIndex === index && fav.snapshot) {
            listEl.appendChild(renderSavedResultPreview(fav));
          }
        });
      }
      children.push(listEl);
    }
    return el("div", { class: "bh-sidebar__history" }, children);
  }

  function renderSavedResultPreview(fav) {
    var snapshot = fav.snapshot;
    var profile = snapshot.match.best.profile;
    var founderOutput = snapshot.founderOutput;
    var roleOrder = ["primary", "secondary", "neutral", "accent", "support", "standOut"];
    var swatches = roleOrder.filter(function (role) { return profile.output.colors[role]; }).map(function (role) {
      return el("span", { class: "bh-sidebar__history-swatch", style: "background:" + profile.output.colors[role] + ";" });
    });
    var loadBtn = el("button", { type: "button", class: "bh-sidebar__history-restore" }, [icon("refresh", "bh-sidebar__substep-icon"), el("span", { text: "Load This Result" })]);
    loadBtn.title = "Makes this the version shown on Your Brand DNA and synced into Branding Studio — this saved copy stays right here either way.";
    loadBtn.addEventListener("click", function () {
      BrandHaus.founderInterview.setState({ results: snapshot, step: "results", celebrationDismissed: true });
      savedResultsPanelOpen = false;
      savedResultsExpandedIndex = -1;
      setActiveStep("brandDNA");
    });
    var deleteBtn = el("button", { type: "button", class: "bh-sidebar__history-clear", text: "Delete This Saved Result" });
    deleteBtn.addEventListener("click", function () {
      BrandHaus.favorites.remove(SAVED_RESULTS_MODE, fav.id);
      savedResultsExpandedIndex = -1;
      renderApp();
    });
    return el("div", { class: "bh-sidebar__history-preview" }, [
      el("p", { class: "bh-sidebar__history-preview-name", text: profile.name }),
      el("p", { class: "bh-sidebar__history-preview-mission", text: founderOutput.missionStatement }),
      el("p", { class: "bh-sidebar__history-preview-values", text: founderOutput.values.join(" · ") }),
      el("div", { class: "bh-sidebar__history-swatches" }, swatches),
      loadBtn,
      deleteBtn,
    ]);
  }

  var FAQ_ITEMS = [
    {
      q: "What is The Archetype Guide, and do I have to start there?",
      a: "The Archetype Guide is the very first thing you'll see — a chance to click through all 11 Brand DNA Archetypes and get a feel for each one before you answer a single question, so you know what you're working toward. It's just a preview, not a quiz — nothing you click there affects your actual result, and you can always revisit it later from the sidebar.",
    },
    {
      q: "Why should I take the Brand DNA Assessment?",
      a: "Most brand quizzes hand you a generic label and call it done. The Brand DNA Assessment is built on our own framework — 8 Brand Tensions, not borrowed archetype tropes — so what comes back is a real reflection of how you already think, what you value, and what's already showing up in your work whether you've named it or not. It's the foundation everything else in the Brand Haus builds on: your colors, fonts, mission, and voice all trace back to this one result.",
    },
    {
      q: "What kind of questions does it ask?",
      a: "A guided, 30-question conversation — not multiple-choice trivia. You'll be asked how you naturally make decisions, what you value in how you work, and what you want people to feel when they experience your brand. There are no right answers; every answer just sharpens the picture.",
    },
    {
      q: "How is this different from a typical brand archetype quiz?",
      a: "Two things. First, our 11 Brand DNA profiles aren't the standard 12 Jungian archetypes recycled again — they're built from real founder patterns, including ones (like The Trail Forger) added specifically because the standard set didn't cover them. Second, you don't just get a label: you get a real percentage showing how strongly you match, which other profiles are quietly influencing you, and a personalized blend — not a one-size-fits-all page.",
    },
    {
      q: "What do I actually get with the Brand Haus?",
      a: "Your match unlocks a one-page Blueprint Snapshot, a Comprehensive Report, and a 19-guide Brand Playbook covering your tensions, your ideal customer's experience, your visual identity, and your next steps. From there, Find Your Direction helps you turn that result into a real next move; Branding Studio turns it into real colors, fonts, and mission language; Logo Studio builds your mark; and Quick Generators produce ready-to-use assets like a Business Card Kit and Media Kit — all pulling from the same real result, nothing re-typed from scratch.",
    },
    {
      q: "What is Find Your Direction, and is it required?",
      a: "Find Your Direction is a short, optional intake that sits right before Branding Studio. It asks a handful of questions tailored to one of two paths — building your own personal brand as a creator/influencer, or building a brand around a specific niche product idea — and turns your answers into a ready-to-paste brief for Frank, your AI Business Partner in the Idea Haus, so you can start a real back-and-forth about what to actually build. It doesn't change your Blueprint or gate anything else in the Brand Haus — skip it any time and come back to it later from the sidebar.",
    },
    {
      q: "Who is Frank, and how do I talk to him?",
      a: "Frank is your AI Business Partner, living in a custom GPT called the Idea Haus. Your Brand Haus purchase includes access to him. Find Your Direction's brief is built specifically to hand to Frank — copy it, open the Idea Haus link on the completion screen, and paste it in to start the conversation.",
    },
    {
      q: "Do I have to pay again to keep using this?",
      a: "No — once you've purchased access to The Brand Haus, you have unlimited access to everything: the Brand DNA Assessment, Find Your Direction, Branding Studio, Logo Studio, and Quick Generators, with no extra fees.",
    },
    {
      q: "What should I do after I get my result?",
      a: "Start with your Blueprint Snapshot for the quick version. If you're still figuring out what to actually create, Find Your Direction can turn your result into a starting brief for Frank. From there, move into Branding Studio to lock in your colors, fonts, and mission — Logo Studio and Quick Generators turn that identity into things you can actually use.",
    },
    {
      q: "Can I retake it?",
      a: "Yes. Brands evolve, and your Brand DNA can shift as your business does. Retaking the assessment saves a new version automatically, and you can keep up to 3 full results side by side in your Saved Results vault — so you're never stuck choosing between starting over and losing what you had.",
    },
  ];

  function renderFaqView() {
    var backBtn = el("button", { type: "button", class: "bh-faq__back" }, [icon("chevron"), el("span", { text: "Back" })]);
    backBtn.addEventListener("click", function () { showFaq = false; renderApp(); scrollShellToTop(); });
    var items = FAQ_ITEMS.map(function (item) {
      return el("details", { class: "bh-faq__item" }, [
        el("summary", { class: "bh-faq__question", text: item.q }),
        el("p", { class: "bh-faq__answer", text: item.a }),
      ]);
    });
    return el("div", { class: "bh-founder-interview bh-founder-interview--welcome bh-faq" }, [
      backBtn,
      el("h2", { class: "bh-founder-interview__welcome-title" }, [
        icon("help"),
        el("span", { text: "FAQ & " }),
        el("span", { class: "bh-heading-accent", text: "Help" }),
      ]),
      el("div", { class: "bh-faq__list" }, items),
    ]);
  }

  function renderFaqSidebarLink() {
    var toggle = el("button", { type: "button", class: "bh-sidebar__history-toggle" + (showFaq ? " is-active" : "") }, [
      icon("help", "bh-sidebar__substep-icon"),
      el("span", { text: "FAQ & Help" }),
    ]);
    toggle.addEventListener("click", function () { showFaq = true; renderApp(); scrollShellToTop(); });
    return el("div", { class: "bh-sidebar__history" }, [toggle]);
  }

  function renderArchetypeGuideStep() {
    var continueBtn = el("button", { type: "button", class: "bh-btn bh-btn--teal bh-btn--large" }, [icon("lightning"), el("span", { text: "Continue" })]);
    continueBtn.addEventListener("click", function () { activeStep = "welcome"; renderApp(); scrollShellToTop(); });
    var wheelMount = el("div", {});
    var detailMount = el("div", { class: "bh-wheel-detail-wrap" });
    if (BrandHaus.wheel) {
      BrandHaus.wheel.render(BrandHaus.ui, wheelMount, {
        personalized: false,
        onSelect: function (name) {
          detailMount.innerHTML = "";
          detailMount.appendChild(BrandHaus.wheel.renderSelectedDetail(BrandHaus.ui, name));
        },
      });
    }
    function bhDeliverable(label, desc) {
      return el("p", { class: "bh-founder-interview__welcome-body" }, [
        el("strong", { class: "bh-heading-accent", text: label + " — " }),
        el("span", { text: desc }),
      ]);
    }
    return el("div", { class: "bh-founder-interview bh-founder-interview--welcome" }, [
      el("h2", { class: "bh-founder-interview__welcome-title" }, [
        icon("compass"),
        el("span", { text: "Every strong brand starts with a " }),
        el("span", { class: "bh-heading-accent", text: "Brand DNA" }),
      ]),
      el("p", { class: "bh-founder-interview__welcome-body", text: "It's tempting to start with the colors, the logo, the name — and hope it all adds up to something. It rarely does. The brands you trust worked the other way around: they got clear on who they are first, and let every choice follow from that. That clarity is quiet, but you feel it in everything they make. That's what we'll find here — before you create a single thing." }),
      el("p", { class: "bh-founder-interview__welcome-body", text: "When you finish, you'll land on one of 11 Brand DNA archetypes — identities, drawn from decades of brand research, that describe how your brand naturally shows up. Less a box, more a compass. Explore all 11 below — tap any to see its name and its one word." }),
      wheelMount,
      detailMount,
      el("p", { class: "bh-founder-interview__welcome-body" }, [el("strong", { text: "What you'll leave with:" })]),
      bhDeliverable("Blueprint Snapshot", "who you are, at a glance — the version you keep close and check your choices against."),
      bhDeliverable("Brand DNA Report", "the reasoning underneath it, so it makes sense, and so you can hold to it when you're unsure."),
      bhDeliverable("Brand Playbook™", "your colors, voice, mission and values, laid out — the reference for every logo, product, message and campaign you build from here."),
      el("p", { class: "bh-founder-interview__welcome-body", text: "Getting clear now means you're not re-deciding who you are every time you sit down to create — and it doesn't stay here: it saves to your Brand Vault and carries into every other Haus, so your graphics, content, marketing and growth work already sound and look like you." }),
      el("div", { class: "bh-founder-interview__welcome-actions" }, [continueBtn]),
    ]);
  }

  function renderWelcomeStep() {
    var beginBtn = el("button", { type: "button", class: "bh-btn bh-btn--teal bh-btn--large" }, [icon("lightning"), el("span", { text: "Begin" })]);
    beginBtn.addEventListener("click", function () { activeStep = "conversation"; renderApp(); scrollShellToTop(); });
    return el("div", { class: "bh-founder-interview bh-founder-interview--welcome" }, [
      el("h2", { class: "bh-founder-interview__welcome-title" }, [
        icon("sparkle"),
        el("span", { text: "Let's find your " }),
        el("span", { class: "bh-heading-accent", text: "Brand DNA Blueprint™" }),
      ]),
      el("p", { class: "bh-founder-interview__welcome-body", text: "Over the next few minutes, you'll answer some questions about how you think, what you value, and what you're building. There are no right answers, and it isn't a test — it's a conversation. The more honest it is, the more it's worth to you." }),
      el("p", { class: "bh-founder-interview__welcome-body", text: "It takes about 10–15 minutes, and you can stop anytime — your place is saved. You'll come away with a clear picture of your brand's natural identity: your colors, your voice, your mission, and your values. It saves to your Brand Vault and carries into every Haus, so this is the one time you'll need to define it." }),
      el("p", { class: "bh-founder-interview__welcome-body", text: "You don't need to have this figured out already. Finding it is what we're here to do." }),
      el("div", { class: "bh-founder-interview__welcome-actions" }, [beginBtn]),
    ]);
  }

  // Auto-syncs Branding Studio to whichever assessment `results` object
  // is currently live, once per DISTINCT completed assessment — tracked
  // by object identity rather than a permanent one-shot flag. A plain
  // boolean here previously meant: apply once ever, then never again —
  // so retaking the assessment (a brand new `results` object, a
  // different matched profile) silently stopped syncing into Branding
  // Studio after the very first completion, since the flag was already
  // "used up." Comparing against the specific object we last applied
  // means a retake (new object) always re-syncs once, while simply
  // revisiting this step with the SAME completed assessment still
  // leaves any manual edits alone.
  function maybeAutoApplyAssessment() {
    var results = BrandHaus.founderInterview.getState().results;
    if (!results || results === lastAutoAppliedResults) return;
    lastAutoAppliedResults = results;
    BrandHaus.founderInterview.applyToBrandingStudio();
  }

  function resolvedValue(field) {
    return BrandHaus.engine.resolveFieldValue(field);
  }

  function renderBrandingStudioStep() {
    // Runs regardless of which sub-tab (Logo/Branding) is active — the
    // identity check inside is what actually decides whether anything
    // happens, so calling it unconditionally here is cheap and means
    // there's exactly one code path that syncs the assessment into
    // Branding Studio, not two that can drift out of sync with each
    // other (see the removed explicit call in Chapter 7's "Continue to
    // Branding Studio" button).
    maybeAutoApplyAssessment();

    if (brandingSubMode === "quickGenerators") return renderQuickGeneratorsStep();

    var modeApi = BrandHaus[brandingSubMode];
    var body = el("div", { class: "bh-body" });
    var left = el("div", { class: "bh-body__fields" });
    var right = el("div", { class: "bh-body__preview" });
    left.appendChild(modeApi.renderPanel());
    renderSelectionsPanel(right, brandingSubMode, modeApi.getSelectionsByGroup());
    renderPreview(right, modeApi.assemblePrompt(), modeApi, brandingSubMode);
    // Brand Kit is a generic save/view/set-active gallery (renderSection
    // doesn't touch mode-specific state) — Logo Studio was missing it
    // purely because this gate only checked for "branding", not because
    // it needs anything different.
    if ((brandingSubMode === "branding" || brandingSubMode === "logo") && BrandHaus.brandKit) BrandHaus.brandKit.renderSection(right, brandingSubMode);
    renderSavedPrompts(right, brandingSubMode);
    renderRecentLog(right);
    body.appendChild(left);
    body.appendChild(right);
    return body;
  }

  // Quick Generators — a grid of small, locked-template generators (see
  // brand-haus-generators.js), a sibling capability to Branding Studio's
  // broad Studios rather than another sub-step of it. Selections/preview/
  // Vault only render once a generator is actually open (currentId set);
  // Recently Generated is global across every mode so it always shows.
  function renderQuickGeneratorsStep() {
    var modeApi = BrandHaus.generators;
    var body = el("div", { class: "bh-body" });
    var left = el("div", { class: "bh-body__fields" });
    var right = el("div", { class: "bh-body__preview" });
    left.appendChild(modeApi.renderPanel());
    var activeId = modeApi.getActiveGeneratorId();
    if (activeId) {
      var vaultKey = "gen:" + activeId;
      renderSelectionsPanel(right, vaultKey, modeApi.getSelectionsByGroup());
      renderPreview(right, modeApi.assemblePrompt(), modeApi, vaultKey);
      renderSavedPrompts(right, vaultKey);
    }
    // Business Card Kit/Media Kit both read the active Brand Kit live via
    // their own computeExtraTokens — without this, there's no visible way
    // to see/switch which kit (if any) is currently feeding them.
    if (BrandHaus.brandKit) BrandHaus.brandKit.renderSection(right, "quickGenerators");
    renderRecentLog(right);
    body.appendChild(left);
    body.appendChild(right);
    return body;
  }

  function renderApp() {
    var root = document.getElementById("brand-haus-app");
    if (!root) return;

    var scrollX = window.scrollX;
    var scrollY = window.scrollY;
    var previewHeights = Array.prototype.map.call(root.querySelectorAll(".bh-preview__text"), function (t) {
      return t.style.height || "";
    });
    var active = document.activeElement;
    var focusRestore = null;
    if (active && root.contains(active) && active.hasAttribute("data-bh-key")) {
      focusRestore = {
        key: active.getAttribute("data-bh-key"),
        selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
        selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
      };
    }

    try {
      renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights);
    } catch (e) {
      root.innerHTML = "";
      root.appendChild(el("div", { class: "bh-render-error" }, [
        el("p", { text: "Something went wrong displaying the builder — this can happen when loading a prompt saved under an older version of the tool." }),
        el("p", { text: "Reload the page to get back to a working state. If it happened right after clicking Load on a saved prompt, that item may need to be deleted from Your Vault or Recently Generated and recreated." }),
      ]));
      if (window.console && window.console.error) window.console.error("Brand Haus render error:", e);
    }
  }

  function renderStepContent(root) {
    if (showFaq) {
      root.appendChild(renderFaqView());
      return;
    }
    if (activeStep === "archetypeGuide") {
      root.appendChild(renderArchetypeGuideStep());
      return;
    }
    if (activeStep === "welcome") {
      root.appendChild(renderWelcomeStep());
      return;
    }
    if (activeStep === "conversation") {
      root.appendChild(BrandHaus.founderInterview.renderFull());
      return;
    }
    if (activeStep === "brandDNA") {
      if (BrandHaus.results && typeof BrandHaus.results.renderStep3 === "function") {
        root.appendChild(BrandHaus.results.renderStep3());
      } else {
        root.appendChild(el("p", { class: "bh-coming-soon", text: "Your Brand DNA is coming soon — complete the Brand DNA Assessment first." }));
      }
      return;
    }
    if (activeStep === "pathIntake") {
      if (BrandHaus.pathIntake && typeof BrandHaus.pathIntake.renderFull === "function") {
        root.appendChild(BrandHaus.pathIntake.renderFull());
      } else {
        root.appendChild(el("p", { class: "bh-coming-soon", text: "Find Your Direction is coming soon." }));
      }
      return;
    }
    if (activeStep === "brandingStudio") {
      renderIdentityBar(root);
      root.appendChild(renderBrandingStudioStep());
      return;
    }
    if (activeStep === "blueprint") {
      if (BrandHaus.blueprint && typeof BrandHaus.blueprint.renderFull === "function") {
        root.appendChild(BrandHaus.blueprint.renderFull());
      } else {
        root.appendChild(el("p", { class: "bh-coming-soon", text: "Your Blueprint is coming soon." }));
      }
      return;
    }
  }

  function renderAppContent(root, focusRestore, scrollX, scrollY, previewHeights) {
    mhKeyCounter = 0;
    root.innerHTML = "";

    var shell = el("div", { class: "bh-shell" });
    var main = el("div", { class: "bh-main" });
    renderStepContent(main); // may mutate activeStep (auto-advance) — must run before the sidebar reads it
    renderSidebar(shell);
    shell.appendChild(main);
    root.appendChild(shell);

    if (focusRestore) {
      var restored = root.querySelector('[data-bh-key="' + focusRestore.key + '"]');
      if (restored) {
        restored.focus({ preventScroll: true });
        if (focusRestore.selectionStart !== null && typeof restored.setSelectionRange === "function") {
          try {
            restored.setSelectionRange(focusRestore.selectionStart, focusRestore.selectionEnd);
          } catch (e) {
            // setSelectionRange throws on input types that don't support it.
          }
        }
      }
    }
    if (previewHeights && previewHeights.length) {
      var newTextareas = root.querySelectorAll(".bh-preview__text");
      previewHeights.forEach(function (height, i) {
        if (height && newTextareas[i]) newTextareas[i].style.height = height;
      });
    }
    window.scrollTo(scrollX, scrollY);
  }

  BrandHaus.ui = {
    el: el,
    icon: icon,
    infoIcon: infoIcon,
    labelWithIcon: labelWithIcon,
    renderPillToggle: renderPillToggle,
    yesNoButton: yesNoButton,
    renderPresetRow: renderPresetRow,
    appendSelectOptions: appendSelectOptions,
    fieldHasValue: fieldHasValue,
    renderField: renderField,
    renderFreeTextField: renderFreeTextField,
    renderSubPanel: renderSubPanel,
    renderCappedChecklist: renderCappedChecklist,
    renderTextSlotList: renderTextSlotList,
    renderColorPickerList: renderColorPickerList,
    renderFontPreviewField: renderFontPreviewField,
    renderFieldGroup: renderFieldGroup,
    renderPlainFieldRow: renderPlainFieldRow,
    renderApp: renderApp,
    setActiveStep: setActiveStep,
    printPromptText: printPromptText,
    printStyledSection: printStyledSection,
    copyTextToClipboard: copyTextToClipboard,
    buildVaultSnapshot: buildVaultSnapshot,
    buildVaultTitle: buildVaultTitle,
  };

  document.addEventListener("click", function (e) {
    document.querySelectorAll(".bh-info[open]").forEach(function (details) {
      if (!details.contains(e.target)) details.open = false;
    });
  });

  document.addEventListener("DOMContentLoaded", function () {
    BrandHaus.ui.renderApp();
  });
})();
