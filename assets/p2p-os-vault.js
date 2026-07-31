/* Purpose 2 Profit — OS Vault
 * A read-only, cross-Haus dashboard for the Operating System home. It surfaces
 * what the member has already made across the Hausen by reading each Haus's own
 * localStorage (never writes). Every shape is parsed defensively — a Haus that
 * has never been used simply contributes nothing.
 *
 * Keys read (written by the individual Hausen):
 *   <haus>RecentLog   [{ text, mode, loggedAt }]           — brand/prompt/graphics/product/marketing
 *   <haus>Favorites   { mode: [..] } or [..]               — saved items
 *   <haus>BrandKits   { kits:[..] } or [..]                — saved brand kits
 *   blackSheepBrandKitVault { brandHausKits:[{name,colors[],voice,...}] } — shared identity
 *   <haus>LookLocks   { looks:[{ name, fields:{artStyle,palette,mood,texture} }] }  — graphics/marketing/product
 *   graphicsHausMascotLocks { mascots:[{ name, fields:{...} }] }
 */
(function () {
  "use strict";

  // promptHaus == Content Haus; productHaus == Project Haus (handles renamed, storage keys unchanged).
  var HAUSEN = [
    { key: "brandHaus", label: "Brand Haus", url: "/pages/brand-haus" },
    { key: "promptHaus", label: "Content Haus", url: "/pages/content-haus" },
    { key: "graphicsHaus", label: "Graphics Haus", url: "/pages/graphics-haus" },
    { key: "productHaus", label: "Project Haus", url: "/pages/project-haus" },
    { key: "marketingHaus", label: "Marketing Haus", url: "/pages/marketing-haus" }
  ];
  var LOOK_HAUSEN = [
    { key: "graphicsHaus", label: "Graphics Haus", url: "/pages/graphics-haus" },
    { key: "marketingHaus", label: "Marketing Haus", url: "/pages/marketing-haus" },
    { key: "productHaus", label: "Project Haus", url: "/pages/project-haus" }
  ];

  function readJSON(k) {
    try { return JSON.parse(window.localStorage.getItem(k)); } catch (e) { return null; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function isHex(s) { return typeof s === "string" && /^#?[0-9a-fA-F]{3,8}$/.test(s.trim()); }
  function timeAgo(ts) {
    if (!ts) return "";
    var s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 60) return "just now";
    var m = Math.floor(s / 60); if (m < 60) return m + "m ago";
    var h = Math.floor(m / 60); if (h < 24) return h + "h ago";
    var d = Math.floor(h / 24); if (d < 7) return d + "d ago";
    var w = Math.floor(d / 7); if (w < 5) return w + "w ago";
    var mo = Math.floor(d / 30); if (mo < 12) return mo + "mo ago";
    return Math.floor(d / 365) + "y ago";
  }
  function flatCount(favs) {
    if (!favs) return 0;
    if (Array.isArray(favs)) return favs.length;
    if (typeof favs === "object") {
      var n = 0;
      Object.keys(favs).forEach(function (k) { if (Array.isArray(favs[k])) n += favs[k].length; });
      return n;
    }
    return 0;
  }
  function kitCount(kits) {
    if (!kits) return 0;
    if (Array.isArray(kits)) return kits.length;
    if (kits.kits && Array.isArray(kits.kits)) return kits.kits.length;
    return 0;
  }

  // ---- collectors ----
  function collectRecent() {
    var all = [];
    HAUSEN.forEach(function (h) {
      var log = readJSON(h.key + "RecentLog");
      if (Array.isArray(log)) log.forEach(function (e) {
        if (e && e.text) all.push({ text: e.text, mode: e.mode || "", ts: e.loggedAt || 0, haus: h });
      });
    });
    all.sort(function (a, b) { return b.ts - a.ts; });
    return all;
  }
  function collectBrandKit() {
    var v = readJSON("blackSheepBrandKitVault");
    var kits = v && Array.isArray(v.brandHausKits) ? v.brandHausKits : [];
    var activeId = v && v.activeKitId;
    var arch = readJSON("p2p_archetype");
    var active = null;
    // The LIVE archetype (p2p_archetype) drives the whole OS (hero + recolor), so the
    // Vault follows it too, for consistency.
    // 1) a saved kit whose name matches the live archetype (richest data: voice, saved colors)
    if (arch && arch.name) {
      var an = String(arch.name).toLowerCase();
      active = kits.filter(function (k) { return String(k.name || "").toLowerCase() === an; })[0] || null;
    }
    // 2) else the live archetype itself (name + its palette), so the Vault matches the rest of the OS
    if (!active && arch && (arch.name || (arch.colors && arch.colors.length))) {
      active = { name: arch.name || "Your Brand DNA", colors: arch.colors || [], voice: "", fromArchetype: true };
    }
    // 3) else the kit explicitly set active in Brand Haus
    if (!active && activeId) active = kits.filter(function (k) { return k.id === activeId; })[0] || null;
    // 4) else first saved kit
    if (!active && kits.length) active = kits[0];
    if (!active) return null;
    var others = kits.filter(function (k) { return active.id ? k.id !== active.id : k !== active; });
    return { active: active, others: others };
  }
  function collectLooks() {
    var out = [];
    LOOK_HAUSEN.forEach(function (h) {
      var d = readJSON(h.key + "LookLocks");
      if (d && Array.isArray(d.looks)) d.looks.forEach(function (l) {
        out.push({ name: l.name || "Untitled Look", fields: l.fields || {}, haus: h.label, url: h.url });
      });
    });
    return out;
  }
  function collectMascots() {
    var d = readJSON("graphicsHausMascotLocks");
    var out = [];
    if (d && Array.isArray(d.mascots)) d.mascots.forEach(function (m) {
      out.push({ name: m.name || "Untitled Mascot", fields: m.fields || {} });
    });
    return out;
  }
  function collectTotals() {
    var total = 0, per = [];
    HAUSEN.forEach(function (h) {
      var n = flatCount(readJSON(h.key + "Favorites")) + kitCount(readJSON(h.key + "BrandKits"));
      if (n > 0) per.push({ label: h.label, url: h.url, n: n });
      total += n;
    });
    return { total: total, per: per };
  }

  // ---- renderers (return HTML strings; only called when there's data) ----
  function fieldVal(f) {
    if (f == null) return "";
    if (typeof f === "string") return f;
    if (typeof f === "object") return f.value || f.text || "";
    return String(f);
  }

  function renderBrandKit(data) {
    var kit = data.active, others = data.others || [];
    var colors = (kit.colors || []).filter(isHex).slice(0, 8);
    var swatches = colors.map(function (c) {
      var hex = c.charAt(0) === "#" ? c : "#" + c;
      return '<span class="ov-swatch" style="background:' + esc(hex) + '" title="' + esc(hex) + '"></span>';
    }).join("");
    var voice = fieldVal(kit.voice);
    var name = kit.name || "Your brand kit";
    // name + swatches are separate grid cells so every column's swatches line up
    // on one vertical edge (the name track sizes to the longest name).
    function kitRow(o) {
      var sw = (o.colors || []).filter(isHex).slice(0, 5).map(function (c) {
        var hex = c.charAt(0) === "#" ? c : "#" + c;
        return '<span class="ov-swatch ov-swatch--sm" style="background:' + esc(hex) + '"></span>';
      }).join("");
      var nm = o.name || "Kit";
      return '<span class="ov-kit-other-name" title="' + esc(nm) + '">' + esc(nm) + '</span>' +
        '<span class="ov-kit-other-sw">' + sw + '</span>';
    }
    // Up to 4 others (5-kit vault: 1 active + 4), split into two columns divided by
    // a light vertical line — matching the vault's own 5-kit limit.
    var lim = others.slice(0, 4);
    var leftKits = lim.slice(0, 2), rightKits = lim.slice(2, 4);
    var othersHtml = lim.length ? (
      '<div class="ov-kit-others"><span class="ov-kit-others-lbl">Also in your vault</span>' +
      '<div class="ov-kit-cols' + (rightKits.length ? ' has-right' : '') + '">' +
        '<div class="ov-kit-col">' + leftKits.map(kitRow).join("") + '</div>' +
        (rightKits.length ? '<div class="ov-kit-col">' + rightKits.map(kitRow).join("") + '</div>' : '') +
      '</div></div>'
    ) : "";
    return '<div class="ov-card ov-card--kit">' +
      '<div class="ov-card-head"><span class="ov-ic">🎨</span><b>Brand Kit</b></div>' +
      '<div class="ov-kit-name">' + esc(name) + '<span class="ov-kit-live">Live</span></div>' +
      (swatches ? '<div class="ov-swatches">' + swatches + '</div>' : '') +
      (voice ? '<div class="ov-kit-voice">Voice: <i>' + esc(voice) + '</i></div>' : '') +
      othersHtml +
      '<a class="ov-link" href="/pages/brand-haus">Open in Brand Haus →</a>' +
      '</div>';
  }

  function renderRecent(recent) {
    var rows = recent.slice(0, 6).map(function (r) {
      return '<a class="ov-recent-row" href="' + esc(r.haus.url) + '">' +
        '<span class="ov-chip">' + esc(r.haus.label.replace(" Haus", "")) + '</span>' +
        '<span class="ov-recent-text">' + esc(r.text) + '</span>' +
        '<span class="ov-recent-time">' + esc(timeAgo(r.ts)) + '</span>' +
        '</a>';
    }).join("");
    return '<div class="ov-card ov-card--recent">' +
      '<div class="ov-card-head"><span class="ov-ic">✨</span><b>Recently generated</b></div>' +
      '<div class="ov-recent-list">' + rows + '</div>' +
      '</div>';
  }

  function renderLooks(looks) {
    var rows = looks.slice(0, 5).map(function (l) {
      var meta = [fieldVal(l.fields.artStyle), fieldVal(l.fields.palette), fieldVal(l.fields.mood)].filter(Boolean).slice(0, 2).join(" · ");
      return '<a class="ov-mini-row" href="' + esc(l.url) + '">' +
        '<b>' + esc(l.name) + '</b>' + (meta ? '<span>' + esc(meta) + '</span>' : '') +
        '</a>';
    }).join("");
    return '<div class="ov-card ov-card--half">' +
      '<div class="ov-card-head"><span class="ov-ic">🔒</span><b>Look Lock</b><span class="ov-count">' + looks.length + '</span></div>' +
      '<div class="ov-mini-list">' + rows + '</div>' +
      '</div>';
  }

  function renderMascots(mascots) {
    var rows = mascots.slice(0, 5).map(function (m) {
      var meta = [fieldVal(m.fields.species) || fieldVal(m.fields.type), fieldVal(m.fields.artStyle)].filter(Boolean).slice(0, 2).join(" · ");
      return '<a class="ov-mini-row" href="/pages/graphics-haus">' +
        '<b>' + esc(m.name) + '</b>' + (meta ? '<span>' + esc(meta) + '</span>' : '') +
        '</a>';
    }).join("");
    return '<div class="ov-card ov-card--half">' +
      '<div class="ov-card-head"><span class="ov-ic">🐑</span><b>Mascot Lock</b><span class="ov-count">' + mascots.length + '</span></div>' +
      '<div class="ov-mini-list">' + rows + '</div>' +
      '</div>';
  }

  function renderTotals(totals) {
    var chips = totals.per.map(function (p) {
      return '<a class="ov-total-chip" href="' + esc(p.url) + '"><b>' + p.n + '</b><span>' + esc(p.label.replace(" Haus", "")) + '</span></a>';
    }).join("");
    return '<div class="ov-totals"><span class="ov-totals-lead">' + totals.total +
      ' saved across your Hausen</span><div class="ov-total-chips">' + chips + '</div></div>';
  }

  function renderEmpty() {
    return '<div class="ov-empty">' +
      '<div class="ov-empty-ic">🗄️</div>' +
      '<b>Your vault fills up as you create</b>' +
      '<p>Brand kits, saved looks, mascots and everything you generate across the Hausen collects here — so your best work is always one click away.</p>' +
      '<div class="ov-empty-links"><a href="/pages/brand-haus">Start in Brand Haus →</a></div>' +
      '</div>';
  }

  function mount(root) {
    if (!root) return;
    var kit = collectBrandKit();
    var recent = collectRecent();
    var looks = collectLooks();
    var mascots = collectMascots();
    var totals = collectTotals();

    var hasAnything = kit || recent.length || looks.length || mascots.length || totals.total;
    var html = '<div class="ov-head"><div class="osx-kick">Your Vault</div>' +
      '<h2 class="osx-h2">Everything you’ve made, in one place</h2></div>';

    if (!hasAnything) {
      html += renderEmpty();
    } else {
      html += '<div class="ov-grid">';
      if (kit) html += renderBrandKit(kit);
      if (recent.length) html += renderRecent(recent);
      html += '</div>';
      if (looks.length || mascots.length) {
        html += '<div class="ov-grid ov-grid--two">';
        if (looks.length) html += renderLooks(looks);
        if (mascots.length) html += renderMascots(mascots);
        html += '</div>';
      }
      if (totals.total) html += renderTotals(totals);
    }

    root.innerHTML = html;
    root.hidden = false;
  }

  window.P2POSVault = { mount: mount };
})();
