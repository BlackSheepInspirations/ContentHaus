/* Purpose 2 Profit — shared Notebook engine (Journal · Notes · Ideas · Wins).
 *
 * Single source for the Learning Journey's journal panel AND the OS notebook.
 * Each "pane" is a localStorage-backed notebook with titles, an optional prompt,
 * search, archive, and a 60-day trash. Kinds: reflection | win | note | idea
 * (reflection can earn points via the host's onSave hook). All stores are p2p_*
 * so they ride the cross-device sync.
 *
 * Markup a pane needs: `.jr-pane[data-store="<key>"][data-kind="<kind>"]` containing
 *   [data-jr-title] (optional) · [data-jr-prompt] (optional) · [data-jr-text] ·
 *   [data-jr-save] · [data-jr-search] · [data-jr-list] · `.jr-view[data-jr-view=active|archived|trash]`.
 * Tabs: `.jr-tab[data-jrmode]` toggle `.jr-pane[data-jrpane]`. Optional [data-jr-export].
 *
 * Mount:  P2PNotebook.mount(root, { confirmDialog, onSave, onChange })
 *   confirmDialog(title, msg, okLabel, cb) — defaults to window.confirm
 *   onSave(kind, entry)                    — after a new entry is saved (host does reflection points)
 *   onChange()                             — after any write (defaults to P2P.push for sync)
 */
(function () {
  "use strict";
  var NB = (window.P2PNotebook = window.P2PNotebook || {});
  var SIXTY = 60 * 864e5;
  NB.SIXTY = SIXTY;
  function esc(s) { return (s || "").replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  NB.esc = esc;

  var EMPTY = {
    reflection: "No entries yet. Your reflections will appear here.",
    win: "No wins logged yet. Every accomplishment counts — start with one.",
    note: "No notes yet. Jot your first one above. ✦",
    idea: "No ideas yet. Capture the spark above. ✦",
  };

  function initPane(pane, opts) {
    opts = opts || {};
    var confirmDialog = opts.confirmDialog || function (t, m, ok, cb) { if (window.confirm(m)) cb(); };
    var onSave = opts.onSave || function () {};
    var onChange = opts.onChange || function () { if (window.P2P && window.P2P.push) window.P2P.push(); };
    var key = pane.getAttribute("data-store"), kind = pane.getAttribute("data-kind");
    var emptyMsg = pane.getAttribute("data-empty") || EMPTY[kind] || "No entries yet.";
    var listEl = pane.querySelector("[data-jr-list]"), titleIn = pane.querySelector("[data-jr-title]");
    var textIn = pane.querySelector("[data-jr-text]"), promptIn = pane.querySelector("[data-jr-prompt]");
    var searchIn = pane.querySelector("[data-jr-search]"), saveBtn = pane.querySelector("[data-jr-save]");
    var view = "active", query = "";
    function load() { try { return JSON.parse(localStorage.getItem(key) || "[]") || []; } catch (e) { return []; } }
    function save(a) { try { localStorage.setItem(key, JSON.stringify(a)); } catch (e) {} onChange(); }
    function normalize() {
      var a = load(), ch = false, now = Date.now();
      a.forEach(function (e) {
        if (!e.id) { e.id = String(e.ts || Date.now()) + "-" + Math.random().toString(36).slice(2, 7); ch = true; }
        if (e.title === undefined) { e.title = ""; ch = true; }
        if (e.archived === undefined) { e.archived = false; ch = true; }
        if (e.deletedAt === undefined) { e.deletedAt = null; ch = true; }
      });
      var b = a.filter(function (e) { return !(e.deletedAt && now - e.deletedAt > SIXTY); });
      if (b.length !== a.length) ch = true;
      if (ch) save(b);
      return b;
    }
    function fmt(ts) { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    function daysLeft(t) { return Math.max(0, Math.ceil((SIXTY - (Date.now() - t)) / 864e5)); }
    function setField(id, f, v) { var a = load(), e = a.filter(function (x) { return x.id === id; })[0]; if (e) { e[f] = v; save(a); render(); } }
    function removeEntry(id) { save(load().filter(function (x) { return x.id !== id; })); render(); }
    function switchView(v) { view = v; pane.querySelectorAll(".jr-view").forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-jr-view") === v); }); render(); }
    function render() {
      var a = normalize(), q = query.trim().toLowerCase();
      var rows = a.filter(function (e) {
        if (view === "trash") return !!e.deletedAt;
        if (e.deletedAt) return false;
        return view === "archived" ? !!e.archived : !e.archived;
      }).filter(function (e) {
        if (!q) return true;
        return ((e.title || "") + " " + (e.text || "") + " " + (e.prompt || "")).toLowerCase().indexOf(q) !== -1;
      });
      if (!rows.length) {
        var msg = view === "trash" ? "Trash is empty." : view === "archived" ? "Nothing archived." : q ? "No matches." : emptyMsg;
        listEl.innerHTML = '<div class="jr-empty">' + msg + "</div>";
        return;
      }
      listEl.innerHTML = rows.map(function (e) {
        var meta = (kind === "win" ? "🏆 " : "") + fmt(e.ts) + (view === "trash" ? " · " + daysLeft(e.deletedAt) + " days left" : "");
        return '<div class="jr-entry' + (kind === "win" ? " jr-win" : "") + '"><div class="je-top"><span class="je-date">' + meta + '</span><span class="je-acts" data-id="' + e.id + '"></span></div>'
          + (e.title ? '<div class="je-title">' + esc(e.title) + "</div>" : "")
          + (e.prompt ? '<div class="je-prompt">' + esc(e.prompt) + "</div>" : "")
          + '<div class="je-text">' + esc(e.text) + "</div></div>";
      }).join("");
      rows.forEach(function (e) {
        var host = listEl.querySelector('.je-acts[data-id="' + e.id + '"]'); if (!host) return;
        function btn(cls, label) { var b = document.createElement("button"); b.className = "je-btn " + cls; b.textContent = label; host.appendChild(b); return b; }
        if (view === "trash") {
          btn("je-restore", "Restore").addEventListener("click", function () { setField(e.id, "deletedAt", null); switchView(e.archived ? "archived" : "active"); });
          btn("je-del", "Delete forever").addEventListener("click", function () { confirmDialog("Delete forever?", "This permanently removes it — it can’t be undone.", "Delete forever", function () { removeEntry(e.id); }); });
        } else {
          btn("je-arch", e.archived ? "Unarchive" : "Archive").addEventListener("click", function () { var na = !e.archived; setField(e.id, "archived", na); if (!na) switchView("active"); });
          btn("je-del", "Delete").addEventListener("click", function () { confirmDialog("Move to Trash?", "It’ll stay in Trash for 60 days — you can restore it any time before then.", "Move to Trash", function () { setField(e.id, "deletedAt", Date.now()); }); });
          if (kind === "win") {
            if (e.shared) {
              var sp = document.createElement("span"); sp.className = "je-shared"; sp.textContent = "Shared to community ✓"; host.appendChild(sp);
            } else {
              (function (entry, button) {
                button.addEventListener("click", function () {
                  button.disabled = true; button.textContent = "Sharing…";
                  var msg = (entry.title ? entry.title + " — " : "") + entry.text;
                  fetch("/apps/p2p/community", { method: "POST", headers: { "content-type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ text: msg, kind: "win", name: window.P2P_MEMBER_NAME || "" }) })
                    .then(function (r) { return r.json(); })
                    .then(function (res) { if (res && res.ok) { setField(entry.id, "shared", true); } else { button.disabled = false; button.textContent = "Share your win on the Community board"; } })
                    .catch(function () { button.disabled = false; button.textContent = "Share your win on the Community board"; });
                });
              })(e, btn("je-share", "Share your win on the Community board"));
            }
          }
        }
      });
    }
    if (saveBtn) saveBtn.addEventListener("click", function () {
      var text = (textIn.value || "").trim(); if (!text) return;
      var a = load();
      var entry = { id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7), ts: Date.now(), title: (titleIn ? titleIn.value : "").trim(), prompt: promptIn ? promptIn.value || "" : "", text: text, archived: false, deletedAt: null };
      a.unshift(entry);
      save(a); textIn.value = ""; if (titleIn) titleIn.value = ""; if (promptIn) promptIn.value = "";
      view = "active"; pane.querySelectorAll(".jr-view").forEach(function (v) { v.classList.toggle("on", v.getAttribute("data-jr-view") === "active"); });
      render();
      onSave(kind, entry);
    });
    if (searchIn) searchIn.addEventListener("input", function () { query = searchIn.value; render(); });
    pane.querySelectorAll(".jr-view").forEach(function (v) { v.addEventListener("click", function () { switchView(v.getAttribute("data-jr-view")); }); });
    render();
  }
  NB.initPane = initPane;

  NB.mount = function (root, opts) {
    if (!root) return;
    // tab switching
    root.querySelectorAll(".jr-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var mode = tab.getAttribute("data-jrmode");
        root.querySelectorAll(".jr-tab").forEach(function (t) { t.classList.toggle("on", t === tab); });
        root.querySelectorAll(".jr-pane").forEach(function (p) { p.hidden = p.getAttribute("data-jrpane") !== mode; });
      });
    });
    root.querySelectorAll(".jr-pane[data-store]").forEach(function (p) { initPane(p, opts); });
    // export all panes -> a single .txt
    var exp = root.querySelector("[data-jr-export]");
    if (exp) exp.addEventListener("click", function () {
      var out = "";
      root.querySelectorAll(".jr-pane[data-store]").forEach(function (p) {
        var key = p.getAttribute("data-store");
        var tab = root.querySelector('.jr-tab[data-jrmode="' + p.getAttribute("data-jrpane") + '"]');
        var label = (p.getAttribute("data-export-label") || (tab ? tab.textContent.trim() : p.getAttribute("data-kind")) || "Notes");
        var a = []; try { a = JSON.parse(localStorage.getItem(key) || "[]") || []; } catch (e) {}
        a = a.filter(function (e) { return !e.deletedAt; });
        if (!a.length) return;
        out += "\n=== " + label + " ===\n\n" + a.map(function (e) {
          return new Date(e.ts).toLocaleString() + (e.title ? "\n" + e.title : "") + (e.prompt ? "\n[" + e.prompt + "]" : "") + "\n" + e.text + "\n\n----------\n";
        }).join("\n");
      });
      if (!out.trim()) return;
      var blob = new Blob(["Purpose 2 Profit — Notebook Export\n" + out], { type: "text/plain" });
      var url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = "P2P-Notebook-Export.txt"; link.click(); URL.revokeObjectURL(url);
    });
  };
})();
