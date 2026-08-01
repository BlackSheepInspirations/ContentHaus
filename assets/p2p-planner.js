/* Purpose 2 Profit — Planner command center. Three sub-views on the Members hub:
     Dashboard  — roll-up rings (Today/Week/Month/Qtr/Year) + goals at a glance
     Goals      — GROWS goals: (G+R)×O×W=S with a live momentum gauge, roadmap gauges,
                  a Window-of-Time countdown, and a 🌱 GROWS → 🚀 Rooted → 🌲 Evergreen stage
     Lists      — Top 3 + To-dos per timeframe, progress gauges, auto carry-over + archive
   All private per member; localStorage holds it and the existing p2p_ metafield sync mirrors
   it across devices. Scoped to #p2pos. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var host = root.querySelector('[data-planner]'); if (!host) return;
  var KEY = 'p2p_planner';
  var TFS = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year']];
  var STAGES = [['grows', '🌱', 'GROWS'], ['rooted', '🚀', 'Rooted'], ['evergreen', '🌲', 'Evergreen']];
  var GROWS = [['g', 'G', 'Ground Zero', 'Where you actually stand right now — not where you wish you stood.'],
               ['r', 'R', 'Roadmap', 'The specific, ordered steps between here and your Success Vision.'],
               ['o', 'O', 'Ownership', 'What will you personally ship this week — not once it feels ready?'],
               ['w', 'W', 'Window of Time', 'A real deadline on the calendar. Skip it and the plan drifts forever.'],
               ['s', 'S', 'Success Vision', 'What "done" looks like — specific enough to know when you\'ve arrived.']];
  var ROOTED_STEPS = ['R · Reach — warm up the right people', 'O · Open — build anticipation', 'O · Offer — make the offer', 'T · Trigger — proof + urgency', 'E · Escalate — the close', 'D · Deepen — keep it going after'];

  var view = 'dash', active = 'week', expanded = {};

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function uid() { return String(Date.now()) + Math.random().toString(36).slice(2, 6); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
  function isoWeek(d) { var dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); var day = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - day); var ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1)); return { y: dt.getUTCFullYear(), w: Math.ceil((((dt - ys) / 86400000) + 1) / 7) }; }
  function periodKey(tf, d) { d = d || new Date(); var y = d.getFullYear(); if (tf === 'day') return y + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); if (tf === 'week') { var wk = isoWeek(d); return wk.y + '-W' + p2(wk.w); } if (tf === 'month') return y + '-' + p2(d.getMonth() + 1); if (tf === 'quarter') return y + '-Q' + (Math.floor(d.getMonth() / 3) + 1); return '' + y; }
  function weekKey() { return periodKey('week'); }

  var data; try { data = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { data = null; }
  if (!data) data = {}; if (!data.done) data.done = []; if (!data.goals) data.goals = [];
  TFS.forEach(function (t) {
    var tf = t[0]; if (!data[tf]) data[tf] = { period: periodKey(tf), top: [], todo: [] };
    if (!data[tf].top) data[tf].top = []; if (!data[tf].todo) data[tf].todo = [];
    var cur = periodKey(tf);
    if (data[tf].period !== cur) { ['top', 'todo'].forEach(function (b) { var keep = []; data[tf][b].forEach(function (it) { if ((it.pct || 0) >= 100) data.done.push({ text: it.text, tf: tf, period: data[tf].period, at: Date.now() }); else keep.push(it); }); data[tf][b] = keep; }); data[tf].period = cur; }
  });
  if (data.done.length > 500) data.done = data.done.slice(-500);
  save();

  function periodPct(tf) { var seg = data[tf], all = seg.top.concat(seg.todo); if (!all.length) return 0; var s = 0; all.forEach(function (i) { s += (i.pct || 0); }); return Math.round(s / all.length); }
  function findItem(id) { for (var i = 0; i < TFS.length; i++) { var seg = data[TFS[i][0]], a = seg.top.concat(seg.todo); for (var j = 0; j < a.length; j++) if (a[j].id === id) return a[j]; } return null; }
  function goal(id) { return data.goals.filter(function (g) { return g.id === id; })[0]; }
  function roadPct(g) { var r = g.roadmap || []; if (!r.length) return 0; var s = 0; r.forEach(function (x) { s += (x.pct || 0); }); return Math.round(s / r.length); }
  function ownedThisWeek(g) { return !!(g.o && g.oDone && g.oWeek === weekKey()); }
  function momentum(g) { // (G+R)/2 × O × W  — multiplicative: no O or no W ⇒ 0
    var g01 = g.g ? 1 : 0, r01 = (g.roadmap && g.roadmap.length) ? roadPct(g) / 100 : 0;
    var o01 = g.o ? (ownedThisWeek(g) ? 1 : 0.5) : 0, w01 = g.w ? 1 : 0;
    return Math.round(((g01 + r01) / 2) * o01 * w01 * 100);
  }
  function daysTo(iso) { if (!iso) return null; var p = iso.split('-'); var t = new Date(); t.setHours(0, 0, 0, 0); var d = new Date(+p[0], +p[1] - 1, +p[2]); return Math.round((d - t) / 86400000); }
  function countdownText(iso) { var d = daysTo(iso); if (d === null) return 'No date set'; if (d > 1) return d + ' days to go'; if (d === 1) return 'Tomorrow'; if (d === 0) return 'Today!'; return Math.abs(d) + ' day' + (d === -1 ? '' : 's') + ' past'; }

  function ring(pct, sub) { return '<div class="osx-pl-ring" style="--p:' + Math.max(0, Math.min(100, pct)) + '"><b>' + pct + '%</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>'; }
  function gauge(pct, id) { var f = Math.round((pct || 0) / 25), s = ''; for (var i = 0; i < 4; i++) s += '<span class="osx-pl-seg' + (i < f ? ' on' : '') + '" data-seg="' + i + '"></span>'; return '<span class="osx-pl-gauge" data-gid="' + esc(id) + '" title="' + (pct || 0) + '%">' + s + '</span>'; }

  /* ---------- views ---------- */
  function navHTML() {
    return '<div class="osx-pl-nav">' +
      '<button class="osx-pl-navb' + (view === 'dash' ? ' on' : '') + '" data-view="dash">📊 Dashboard</button>' +
      '<button class="osx-pl-navb' + (view === 'goals' ? ' on' : '') + '" data-view="goals">🎯 Goals</button>' +
      '<button class="osx-pl-navb' + (view === 'lists' ? ' on' : '') + '" data-view="lists">✅ Lists</button></div>';
  }
  function dashHTML() {
    var rings = TFS.map(function (t) { return '<div class="osx-pl-dring">' + ring(periodPct(t[0]), '') + '<span class="osx-pl-drl">' + t[1] + '</span></div>'; }).join('');
    var goals = data.goals.length ? data.goals.map(function (g) {
      var st = STAGES.filter(function (s) { return s[0] === (g.stage || 'grows'); })[0];
      return '<button class="osx-pl-gsum" data-open="' + esc(g.id) + '">' + ring(roadPct(g), '') +
        '<span class="osx-pl-gsum-b"><b>' + esc(g.title || 'Untitled goal') + '</b>' +
        '<span class="osx-pl-gsum-m"><span class="osx-pl-stage-b">' + st[1] + ' ' + st[2] + '</span> · ' + esc(countdownText(g.w)) + '</span></span></button>';
    }).join('') : '<div class="osx-pl-empty">No goals yet — head to 🎯 Goals to build one with the GROWS formula.</div>';
    return '<div class="osx-pl-strip">' + rings + '</div>' +
      '<div class="osx-pl-sech" style="margin-top:6px;">🎯 Your goals</div>' + goals;
  }
  function growsRow(g) {
    return '<div class="osx-pl-grows">' + GROWS.map(function (r) {
      var lit = r[0] === 'g' ? !!g.g : r[0] === 'r' ? (g.roadmap && g.roadmap.length) : r[0] === 'o' ? !!g.o : r[0] === 'w' ? !!g.w : !!g.s;
      return '<span class="osx-pl-grt' + (lit ? ' on' : '') + '" title="' + esc(r[2]) + '">' + r[1] + '</span>';
    }).join('<i>·</i>') + '</div>';
  }
  function goalCard(g) {
    var open = !!expanded[g.id], mo = momentum(g), st = STAGES.filter(function (s) { return s[0] === (g.stage || 'grows'); })[0];
    var head = '<div class="osx-pl-gh" data-toggle="' + esc(g.id) + '">' + ring(roadPct(g), '') +
      '<span class="osx-pl-gh-b"><b>' + esc(g.title || 'Untitled goal') + '</b>' +
      '<span class="osx-pl-gh-m">' + growsRow(g) + '<span class="osx-pl-mom' + (mo === 0 ? ' zero' : '') + '">momentum ' + mo + '%</span></span></span>' +
      '<span class="osx-pl-cd">' + esc(countdownText(g.w)) + '</span></div>';
    if (!open) return '<div class="osx-pl-goal">' + head + '</div>';
    var stageBtns = STAGES.map(function (s) { return '<button class="osx-pl-stbtn' + (s[0] === (g.stage || 'grows') ? ' on' : '') + '" data-stage="' + esc(g.id) + '|' + s[0] + '">' + s[1] + ' ' + s[2] + '</button>'; }).join('');
    var road = (g.roadmap || []).map(function (x) { return '<div class="osx-pl-item">' + gauge(x.pct, g.id + '|' + x.id) + '<span class="osx-pl-text">' + esc(x.text) + '</span><span class="osx-pl-pct">' + (x.pct || 0) + '%</span><button class="osx-pl-del" data-rdel="' + esc(g.id + '|' + x.id) + '" aria-label="Remove">✕</button></div>'; }).join('');
    var warn = (mo === 0 && g.s) ? '<div class="osx-pl-warn">⚠ The formula multiplies to zero — set an <b>Ownership</b> action and a <b>Window</b> date to get momentum.</div>' : '';
    var body = '<div class="osx-pl-gbody">' +
      '<div class="osx-pl-stages">' + stageBtns + '<button class="osx-pl-gdel" data-gdel="' + esc(g.id) + '">Delete goal</button></div>' + warn +
      field(g, 'g') + field(g, 's') +
      '<div class="osx-pl-flabel">R · Roadmap <span>the ordered steps — each tracks its own progress</span></div>' + road +
      '<div class="osx-pl-add"><input class="osx-pl-in" data-radd="' + esc(g.id) + '" placeholder="Add a roadmap step…" maxlength="120"><button class="osx-pl-addbtn" data-raddb="' + esc(g.id) + '">Add</button> <button class="osx-pl-tmpl" data-rtmpl="' + esc(g.id) + '">＋ ROOTED launch</button></div>' +
      '<div class="osx-pl-own"><div class="osx-pl-flabel">O · Ownership <span>your committed action this week</span></div>' +
        '<div class="osx-pl-ownrow"><input class="osx-pl-in" data-of="' + esc(g.id) + '" value="' + esc(g.o || '') + '" placeholder="e.g. Publish one product listing this week" maxlength="160">' +
        '<button class="osx-pl-owntog' + (ownedThisWeek(g) ? ' on' : '') + '" data-otog="' + esc(g.id) + '">' + (ownedThisWeek(g) ? '✓ Done this week' : 'Mark done') + '</button></div></div>' +
      '<div class="osx-pl-flabel">W · Window of Time <span>a real deadline</span></div>' +
        '<input class="osx-pl-date" type="date" data-wf="' + esc(g.id) + '" value="' + esc(g.w || '') + '">' +
      '</div>';
    return '<div class="osx-pl-goal open">' + head + body + '</div>';
  }
  function field(g, k) {
    var meta = GROWS.filter(function (r) { return r[0] === k; })[0];
    return '<div class="osx-pl-field"><div class="osx-pl-flabel">' + meta[1] + ' · ' + esc(meta[2]) + ' <span>' + esc(meta[3]) + '</span></div>' +
      '<textarea class="osx-pl-ta" data-gf="' + esc(g.id) + '|' + k + '" rows="2" maxlength="400" placeholder="' + esc(meta[3]) + '">' + esc(g[k] || '') + '</textarea></div>';
  }
  function goalsHTML() {
    return '<button class="osx-pl-newgoal" data-newgoal>＋ New GROWS goal</button>' +
      (data.goals.length ? data.goals.map(goalCard).join('') : '<div class="osx-pl-empty">Build your first goal with the GROWS formula: (G+R)×O×W=S.</div>');
  }
  function listsHTML() {
    var seg = data[active], tfBtns = TFS.map(function (t) { return '<button class="osx-pl-tf' + (t[0] === active ? ' on' : '') + '" data-tf="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    function item(it, bucket) { return '<div class="osx-pl-item' + (it.pct >= 100 ? ' done' : '') + '">' + gauge(it.pct, 'L|' + it.id) + '<span class="osx-pl-text">' + esc(it.text) + '</span><span class="osx-pl-pct">' + (it.pct || 0) + '%</span><button class="osx-pl-del" data-ldel="' + esc(bucket + '|' + it.id) + '" aria-label="Remove">✕</button></div>'; }
    return '<div class="osx-pl-head"><div class="osx-pl-tfs">' + tfBtns + '</div><div class="osx-pl-rollup"><b>' + periodPct(active) + '%</b><span>this ' + active + '</span></div></div>' +
      '<div class="osx-pl-sec"><div class="osx-pl-sech">⭐ Top 3 — your must-wins</div>' + (seg.top.map(function (it) { return item(it, 'top'); }).join('') || '<div class="osx-pl-empty">Name your 3 must-wins for this ' + active + '.</div>') + (seg.top.length >= 3 ? '' : '<div class="osx-pl-add"><input class="osx-pl-in" data-ladd="top" placeholder="Add a top priority…" maxlength="120"><button class="osx-pl-addbtn" data-laddb="top">Add</button></div>') + '</div>' +
      '<div class="osx-pl-sec"><div class="osx-pl-sech">✎ To-dos <button class="osx-pl-tmpl" data-ltmpl>＋ ROOTED launch</button></div>' + (seg.todo.map(function (it) { return item(it, 'todo'); }).join('') || '<div class="osx-pl-empty">Everything else you want to move on.</div>') + '<div class="osx-pl-add"><input class="osx-pl-in" data-ladd="todo" placeholder="Add a to-do…" maxlength="120"><button class="osx-pl-addbtn" data-laddb="todo">Add</button></div></div>' +
      '<button class="osx-pl-archbtn" data-arch>✓ Completed archive (' + data.done.length + ')</button>';
  }

  function render() {
    var body = view === 'dash' ? dashHTML() : view === 'goals' ? goalsHTML() : listsHTML();
    host.innerHTML = '<div class="osx-pl">' + navHTML() + '<div class="osx-pl-view">' + body + '</div></div>';
    wire();
  }
  function renderArchive() {
    var by = {}; data.done.slice().reverse().forEach(function (d) { var k = d.tf + ' · ' + d.period; (by[k] = by[k] || []).push(d); });
    var keys = Object.keys(by), h = '<div class="osx-pl">' + navHTML() + '<div class="osx-pl-view"><button class="osx-pl-archbtn" data-back>← Back</button><div class="osx-pl-sech" style="margin-top:16px;">✓ Completed</div>';
    if (!keys.length) h += '<div class="osx-pl-empty">Finish something and it lands here when the period turns over. 🎉</div>';
    keys.forEach(function (k) { h += '<div class="osx-pl-arch-grp"><div class="osx-pl-arch-k">' + esc(k) + '</div>' + by[k].map(function (d) { return '<div class="osx-pl-arch-i">✓ ' + esc(d.text) + '</div>'; }).join('') + '</div>'; });
    host.innerHTML = h + '</div></div>';
    host.querySelector('[data-back]').addEventListener('click', render);
    host.querySelectorAll('[data-view]').forEach(function (b) { b.addEventListener('click', function () { view = b.getAttribute('data-view'); render(); }); });
  }

  /* ---------- mutations ---------- */
  function setSeg(kind, ref, seg) {
    var target = (seg + 1) * 25;
    if (kind === 'L') { var it = findItem(ref); if (it) it.pct = (it.pct === target) ? seg * 25 : target; }
    else { var p = ref.split('|'), g = goal(p[0]); if (g) { var st = (g.roadmap || []).filter(function (x) { return x.id === p[1]; })[0]; if (st) st.pct = (st.pct === target) ? seg * 25 : target; } }
    save(); render();
  }
  function wire() {
    host.querySelectorAll('[data-view]').forEach(function (b) { b.addEventListener('click', function () { view = b.getAttribute('data-view'); render(); }); });
    // gauges (lists + roadmap)
    host.querySelectorAll('.osx-pl-gauge').forEach(function (gEl) { gEl.querySelectorAll('[data-seg]').forEach(function (s) { s.addEventListener('click', function () { var gid = gEl.getAttribute('data-gid'); var pfx = gid.slice(0, 1); setSeg(pfx === 'L' ? 'L' : 'R', pfx === 'L' ? gid.slice(2) : gid, +s.getAttribute('data-seg')); }); }); });
    // dashboard goal open
    host.querySelectorAll('[data-open]').forEach(function (b) { b.addEventListener('click', function () { view = 'goals'; expanded[b.getAttribute('data-open')] = true; render(); }); });
    // goals
    var ng = host.querySelector('[data-newgoal]'); if (ng) ng.addEventListener('click', function () { var g = { id: uid(), title: 'New goal', stage: 'grows', g: '', r: '', o: '', s: '', w: '', roadmap: [], oDone: false, oWeek: '' }; data.goals.unshift(g); expanded[g.id] = true; save(); render(); });
    host.querySelectorAll('[data-toggle]').forEach(function (b) { b.addEventListener('click', function (e) { if (e.target.closest('.osx-pl-gauge,button,input,textarea,a')) return; var id = b.getAttribute('data-toggle'); expanded[id] = !expanded[id]; render(); }); });
    host.querySelectorAll('[data-gf]').forEach(function (ta) { ta.addEventListener('change', function () { var p = ta.getAttribute('data-gf').split('|'), g = goal(p[0]); if (g) { if (p[1] === 'title') g.title = ta.value; else g[p[1]] = ta.value; save(); render(); } }); });
    host.querySelectorAll('[data-wf]').forEach(function (inp) { inp.addEventListener('change', function () { var g = goal(inp.getAttribute('data-wf')); if (g) { g.w = inp.value; save(); render(); } }); });
    host.querySelectorAll('[data-of]').forEach(function (inp) { inp.addEventListener('change', function () { var g = goal(inp.getAttribute('data-of')); if (g) { g.o = inp.value; save(); render(); } }); });
    host.querySelectorAll('[data-otog]').forEach(function (b) { b.addEventListener('click', function () { var g = goal(b.getAttribute('data-otog')); if (g) { var on = ownedThisWeek(g); g.oDone = !on; g.oWeek = weekKey(); save(); render(); } }); });
    host.querySelectorAll('[data-stage]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-stage').split('|'), g = goal(p[0]); if (g) { g.stage = p[1]; save(); render(); } }); });
    host.querySelectorAll('[data-gdel]').forEach(function (b) { b.addEventListener('click', function () { if (!window.confirm('Delete this goal?')) return; data.goals = data.goals.filter(function (x) { return x.id !== b.getAttribute('data-gdel'); }); save(); render(); }); });
    host.querySelectorAll('[data-raddb]').forEach(function (b) { b.addEventListener('click', function () { addRoad(b.getAttribute('data-raddb')); }); });
    host.querySelectorAll('[data-radd]').forEach(function (inp) { inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addRoad(inp.getAttribute('data-radd')); } }); });
    host.querySelectorAll('[data-rdel]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-rdel').split('|'), g = goal(p[0]); if (g) { g.roadmap = (g.roadmap || []).filter(function (x) { return x.id !== p[1]; }); save(); render(); } }); });
    host.querySelectorAll('[data-rtmpl]').forEach(function (b) { b.addEventListener('click', function () { var g = goal(b.getAttribute('data-rtmpl')); if (g) { g.roadmap = g.roadmap || []; ROOTED_STEPS.forEach(function (t) { g.roadmap.push({ id: uid(), text: t, pct: 0 }); }); save(); render(); } }); });
    // lists
    host.querySelectorAll('[data-tf]').forEach(function (b) { b.addEventListener('click', function () { active = b.getAttribute('data-tf'); render(); }); });
    host.querySelectorAll('[data-laddb]').forEach(function (b) { b.addEventListener('click', function () { addList(b.getAttribute('data-laddb')); }); });
    host.querySelectorAll('[data-ladd]').forEach(function (inp) { inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addList(inp.getAttribute('data-ladd')); } }); });
    host.querySelectorAll('[data-ldel]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-ldel').split('|'); data[active][p[0]] = data[active][p[0]].filter(function (i) { return i.id !== p[1]; }); save(); render(); }); });
    var lt = host.querySelector('[data-ltmpl]'); if (lt) lt.addEventListener('click', function () { if (!window.confirm('Add the ROOTED launch roadmap (6 steps) to your To-dos for this ' + active + '?')) return; ROOTED_STEPS.forEach(function (t) { data[active].todo.push({ id: uid(), text: t, pct: 0 }); }); save(); render(); });
    var arch = host.querySelector('[data-arch]'); if (arch) arch.addEventListener('click', renderArchive);
  }
  function addRoad(gid) { var inp = host.querySelector('[data-radd="' + gid + '"]'); var v = (inp && inp.value || '').trim(); if (!v) return; var g = goal(gid); if (g) { g.roadmap = g.roadmap || []; g.roadmap.push({ id: uid(), text: v.slice(0, 120), pct: 0 }); save(); render(); } }
  function addList(bucket) { var inp = host.querySelector('[data-ladd="' + bucket + '"]'); var v = (inp && inp.value || '').trim(); if (!v) return; if (bucket === 'top' && data[active].top.length >= 3) return; data[active][bucket].push({ id: uid(), text: v.slice(0, 120), pct: 0 }); save(); render(); }

  render();
})();
