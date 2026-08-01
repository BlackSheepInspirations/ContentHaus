/* Purpose 2 Profit — Planner: Day/Week/Month/Quarter/Year goals with a progress gauge
   (0/25/50/75/100%), automatic carry-over of unfinished items + a Completed archive, and
   framework templates (ROOTED). Private per member; localStorage keeps the data, and the
   existing p2p_ metafield sync mirrors it across devices. Scoped to #p2pos. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var host = root.querySelector('[data-planner]'); if (!host) return;
  var KEY = 'p2p_planner';
  var TFS = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year']];
  var TEMPLATES = {
    rooted: {
      label: 'Launch with ROOTED', items: [
        'R · Reach — warm up the right people before you sell a thing',
        'O · Open — build anticipation with pre-launch content',
        'O · Offer — make the offer; the doors open',
        'T · Trigger — proof + gentle urgency to decide now',
        'E · Escalate — the close; last call as the window narrows',
        'D · Deepen — keep the relationship going after launch day'
      ]
    }
  };
  var active = 'week';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  function uid() { return String(Date.now()) + Math.random().toString(36).slice(2, 6); }
  function isoWeek(d) { var dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); var day = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - day); var ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1)); var w = Math.ceil((((dt - ys) / 86400000) + 1) / 7); return { y: dt.getUTCFullYear(), w: w }; }
  function periodKey(tf, d) {
    d = d || new Date(); var y = d.getFullYear();
    if (tf === 'day') return y + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    if (tf === 'week') { var wk = isoWeek(d); return wk.y + '-W' + p2(wk.w); }
    if (tf === 'month') return y + '-' + p2(d.getMonth() + 1);
    if (tf === 'quarter') return y + '-Q' + (Math.floor(d.getMonth() / 3) + 1);
    return '' + y;
  }

  var data = load() || { done: [] };
  if (!data.done) data.done = [];
  TFS.forEach(function (t) {
    var tf = t[0];
    if (!data[tf]) data[tf] = { period: periodKey(tf), top: [], todo: [] };
    if (!data[tf].top) data[tf].top = []; if (!data[tf].todo) data[tf].todo = [];
    var cur = periodKey(tf);
    if (data[tf].period !== cur) {   // period rolled over → archive finished, carry the rest
      ['top', 'todo'].forEach(function (b) {
        var keep = [];
        data[tf][b].forEach(function (it) { if ((it.pct || 0) >= 100) data.done.push({ text: it.text, tf: tf, period: data[tf].period, at: Date.now() }); else keep.push(it); });
        data[tf][b] = keep;
      });
      data[tf].period = cur;
    }
  });
  if (data.done.length > 500) data.done = data.done.slice(-500);
  save();

  function periodPct(tf) { var seg = data[tf], all = seg.top.concat(seg.todo); if (!all.length) return 0; var s = 0; all.forEach(function (i) { s += (i.pct || 0); }); return Math.round(s / all.length); }
  function find(id) { for (var i = 0; i < TFS.length; i++) { var seg = data[TFS[i][0]], a = seg.top.concat(seg.todo); for (var j = 0; j < a.length; j++) if (a[j].id === id) return a[j]; } return null; }

  function gauge(it) { var f = Math.round((it.pct || 0) / 25), segs = ''; for (var i = 0; i < 4; i++) segs += '<span class="osx-pl-seg' + (i < f ? ' on' : '') + '" data-seg="' + i + '"></span>'; return '<span class="osx-pl-gauge" data-id="' + esc(it.id) + '" title="' + (it.pct || 0) + '% — click a bar to set">' + segs + '</span>'; }
  function itemHTML(it, bucket) { return '<div class="osx-pl-item' + ((it.pct >= 100) ? ' done' : '') + '">' + gauge(it) + '<span class="osx-pl-text">' + esc(it.text) + '</span><span class="osx-pl-pct">' + (it.pct || 0) + '%</span><button class="osx-pl-del" data-del="' + esc(it.id) + '" data-bucket="' + bucket + '" aria-label="Remove">✕</button></div>'; }

  function render() {
    var seg = data[active];
    var tfBtns = TFS.map(function (t) { return '<button class="osx-pl-tf' + (t[0] === active ? ' on' : '') + '" data-tf="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    var topCap = seg.top.length >= 3;
    host.innerHTML =
      '<div class="osx-pl">' +
        '<div class="osx-pl-head"><div class="osx-pl-tfs">' + tfBtns + '</div>' +
          '<div class="osx-pl-rollup"><b>' + periodPct(active) + '%</b><span>this ' + active + '</span></div></div>' +
        '<div class="osx-pl-sec"><div class="osx-pl-sech">⭐ Top 3 — your must-wins</div>' +
          (seg.top.map(function (it) { return itemHTML(it, 'top'); }).join('') || '<div class="osx-pl-empty">Name your 3 most important wins for this ' + active + '.</div>') +
          (topCap ? '' : '<div class="osx-pl-add"><input class="osx-pl-in" data-add="top" placeholder="Add a top priority…" maxlength="120"><button class="osx-pl-addbtn" data-addbtn="top">Add</button></div>') +
        '</div>' +
        '<div class="osx-pl-sec"><div class="osx-pl-sech">✎ To-dos <button class="osx-pl-tmpl" data-tmpl>＋ From a framework</button></div>' +
          (seg.todo.map(function (it) { return itemHTML(it, 'todo'); }).join('') || '<div class="osx-pl-empty">Everything else you want to move on this ' + active + '.</div>') +
          '<div class="osx-pl-add"><input class="osx-pl-in" data-add="todo" placeholder="Add a to-do…" maxlength="120"><button class="osx-pl-addbtn" data-addbtn="todo">Add</button></div>' +
        '</div>' +
        '<button class="osx-pl-archbtn" data-arch>✓ Completed archive (' + data.done.length + ')</button>' +
      '</div>';
    wire();
  }

  function renderArchive() {
    var byPeriod = {};
    data.done.slice().reverse().forEach(function (d) { var k = d.tf + ' · ' + d.period; (byPeriod[k] = byPeriod[k] || []).push(d); });
    var keys = Object.keys(byPeriod), html = '<div class="osx-pl"><button class="osx-pl-archbtn" data-back>← Back to planner</button><div class="osx-pl-sech" style="margin-top:16px;">✓ Completed</div>';
    if (!keys.length) html += '<div class="osx-pl-empty">Finish something and it lands here when the period turns over. 🎉</div>';
    keys.forEach(function (k) { html += '<div class="osx-pl-arch-grp"><div class="osx-pl-arch-k">' + esc(k) + '</div>' + byPeriod[k].map(function (d) { return '<div class="osx-pl-arch-i">✓ ' + esc(d.text) + '</div>'; }).join('') + '</div>'; });
    host.innerHTML = html + '</div>';
    host.querySelector('[data-back]').addEventListener('click', render);
  }

  function addItem(bucket) { var inp = host.querySelector('[data-add="' + bucket + '"]'); var v = (inp && inp.value || '').trim(); if (!v) return; if (bucket === 'top' && data[active].top.length >= 3) return; data[active][bucket].push({ id: uid(), text: v.slice(0, 120), pct: 0 }); save(); render(); }
  function delItem(bucket, id) { data[active][bucket] = data[active][bucket].filter(function (i) { return i.id !== id; }); save(); render(); }
  function setPct(id, seg) { var it = find(id); if (!it) return; var target = (seg + 1) * 25; it.pct = (it.pct === target) ? seg * 25 : target; save(); render(); }
  function openTemplates() { var t = TEMPLATES.rooted; if (!window.confirm('Add the “' + t.label + '” roadmap (' + t.items.length + ' steps) to your To-dos for this ' + active + '?')) return; t.items.forEach(function (txt) { data[active].todo.push({ id: uid(), text: txt, pct: 0 }); }); save(); render(); }

  function wire() {
    host.querySelectorAll('[data-tf]').forEach(function (b) { b.addEventListener('click', function () { active = b.getAttribute('data-tf'); render(); }); });
    host.querySelectorAll('[data-addbtn]').forEach(function (b) { b.addEventListener('click', function () { addItem(b.getAttribute('data-addbtn')); }); });
    host.querySelectorAll('[data-add]').forEach(function (inp) { inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addItem(inp.getAttribute('data-add')); } }); });
    host.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { delItem(b.getAttribute('data-bucket'), b.getAttribute('data-del')); }); });
    host.querySelectorAll('.osx-pl-gauge').forEach(function (g) { g.querySelectorAll('[data-seg]').forEach(function (s) { s.addEventListener('click', function () { setPct(g.getAttribute('data-id'), +s.getAttribute('data-seg')); }); }); });
    var arch = host.querySelector('[data-arch]'); if (arch) arch.addEventListener('click', renderArchive);
    var tmpl = host.querySelector('[data-tmpl]'); if (tmpl) tmpl.addEventListener('click', openTemplates);
  }

  render();
})();
