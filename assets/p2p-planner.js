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
  if (!data) data = {}; if (!data.done) data.done = []; if (!data.goals) data.goals = []; if (!data.lives) data.lives = []; if (!data.posts) data.posts = []; if (!data.snaps) data.snaps = []; if (!data.ideas) data.ideas = [];
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
      '<button class="osx-pl-navb' + (view === 'lives' ? ' on' : '') + '" data-view="lives">📡 Lives</button>' +
      '<button class="osx-pl-navb' + (view === 'posts' ? ' on' : '') + '" data-view="posts">📝 Posts</button>' +
      '<button class="osx-pl-navb' + (view === 'ideas' ? ' on' : '') + '" data-view="ideas">💡 Ideas</button>' +
      '<button class="osx-pl-navb' + (view === 'growth' ? ' on' : '') + '" data-view="growth">📈 Growth</button>' +
      '<button class="osx-pl-navb' + (view === 'lists' ? ' on' : '') + '" data-view="lists">✅ Lists</button></div>';
  }
  function dashHTML() {
    var upcoming = data.goals.filter(function (g) { return g.w && daysTo(g.w) !== null && daysTo(g.w) >= 0; }).sort(function (a, b) { return daysTo(a.w) - daysTo(b.w); })[0];
    var cd = upcoming ? '<button class="osx-dash-cd" data-open="' + esc(upcoming.id) + '"><div class="osx-dash-cd-n">' + Math.max(0, daysTo(upcoming.w)) + '</div><div class="osx-dash-cd-t"><b>days to launch</b><span>' + esc(upcoming.title || 'your goal') + '</span></div></button>' : '';
    var snaps = data.snaps.slice().sort(function (a, b) { return (a.week || '').localeCompare(b.week || ''); });
    var fNow = snaps.length ? num(snaps[snaps.length - 1].followers) : 0;
    var stats = '<div class="osx-lv-trend">' +
      '<div class="osx-lv-stat"><b>' + fNow + '</b><span>followers</span></div>' +
      '<div class="osx-lv-stat"><b>' + data.lives.filter(function (l) { return l.done; }).length + '</b><span>total lives</span></div>' +
      '<div class="osx-lv-stat"><b>' + data.posts.filter(function (p) { return p.done; }).length + '</b><span>total posts</span></div>' +
      '<div class="osx-lv-stat"><b>' + livesInWeek(weekKey()) + ' / ' + postsInWeek(weekKey()) + '</b><span>lives / posts this wk</span></div></div>';
    var rings = TFS.map(function (t) { return '<div class="osx-pl-dring">' + ring(periodPct(t[0]), '') + '<span class="osx-pl-drl">' + t[1] + '</span></div>'; }).join('');
    var goals = data.goals.length ? data.goals.map(function (g) {
      var st = STAGES.filter(function (s) { return s[0] === (g.stage || 'grows'); })[0];
      return '<button class="osx-pl-gsum" data-open="' + esc(g.id) + '">' + ring(roadPct(g), '') +
        '<span class="osx-pl-gsum-b"><b>' + esc(g.title || 'Untitled goal') + '</b>' +
        '<span class="osx-pl-gsum-m"><span class="osx-pl-stage-b">' + st[1] + ' ' + st[2] + '</span> · ' + esc(countdownText(g.w)) + '</span></span></button>';
    }).join('') : '<div class="osx-pl-empty">No goals yet — head to 🎯 Goals to build one with the GROWS formula.</div>';
    return cd + stats + '<div class="osx-pl-sech">📊 Progress by horizon</div><div class="osx-pl-strip">' + rings + '</div>' +
      '<div class="osx-pl-sech" style="margin-top:10px;">🎯 Your goals</div>' + goals;
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

  /* ---------- lives (going-live planner + post-live check-in + trends) ---------- */
  var LIVE_STATS = [['followers', 'New followers'], ['gifts', 'Gifts / diamonds'], ['hearts', 'Likes / hearts'], ['comments', 'Comments'], ['peak', 'Peak viewers'], ['duration', 'Duration (min)'], ['sales', 'Sales ($)']];
  var PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Other'];
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }
  function liveObj(id) { return data.lives.filter(function (l) { return l.id === id; })[0]; }
  function liveDateLabel(l) { if (!l.date) return 'Unscheduled'; var p = l.date.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function livesTrend() {
    var done = data.lives.filter(function (l) { return l.done; });
    var totalF = 0, withF = 0; done.forEach(function (l) { var f = num((l.s || {}).followers); totalF += f; if (f > 0) withF++; });
    var byTime = {}; done.forEach(function (l) { if (!l.time) return; (byTime[l.time] = byTime[l.time] || []).push(num((l.s || {}).followers)); });
    var best = '—', ba = -1; Object.keys(byTime).forEach(function (t) { var a = byTime[t], m = a.reduce(function (x, y) { return x + y; }, 0) / a.length; if (m > ba) { ba = m; best = t; } });
    return { count: done.length, totalF: totalF, avgF: withF ? Math.round(totalF / withF) : 0, best: best };
  }
  function sparkline() {
    var done = data.lives.filter(function (l) { return l.done; }).slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
    var vals = done.map(function (l) { return num((l.s || {}).followers); }); if (vals.length < 2) return '';
    var max = Math.max.apply(null, vals) || 1, w = 200, h = 40, step = w / (vals.length - 1);
    var pts = vals.map(function (v, i) { return (i * step).toFixed(1) + ',' + (h - (v / max) * (h - 4) - 2).toFixed(1); }).join(' ');
    return '<svg class="osx-lv-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="var(--gold-bright)" stroke-width="2" stroke-linejoin="round"/></svg>';
  }
  function liveCard(l) {
    var open = !!expanded['L' + l.id], ls = l.s || {};
    var kv = l.done ? ('+' + num(ls.followers) + ' followers') : (liveDateLabel(l) + (l.time ? ' · ' + esc(l.time) : ''));
    var head = '<div class="osx-lv-h" data-ltoggle="' + esc(l.id) + '"><span class="osx-lv-plat">' + esc(l.platform || 'Live') + '</span>' +
      '<span class="osx-lv-hb"><b>' + esc(l.topic || 'Untitled live') + '</b><span class="osx-lv-hm">' + (l.done ? '✓ Done · ' : '📡 ') + esc(kv) + '</span></span>' +
      '<span class="osx-lv-when">' + esc(liveDateLabel(l)) + '</span></div>';
    if (!open) return '<div class="osx-lv-card">' + head + '</div>';
    var plan = '<div class="osx-lv-grid">' +
      '<label class="osx-lv-f"><span>Date</span><input type="date" class="osx-pl-date" data-lf="' + esc(l.id) + '|date" value="' + esc(l.date || '') + '"></label>' +
      '<label class="osx-lv-f"><span>Time</span><input class="osx-pl-in" data-lf="' + esc(l.id) + '|time" value="' + esc(l.time || '') + '" placeholder="e.g. 7:00 PM" maxlength="24"></label>' +
      '<label class="osx-lv-f"><span>Platform</span><select class="osx-pl-date" data-lf="' + esc(l.id) + '|platform">' + PLATFORMS.map(function (p) { return '<option' + (p === l.platform ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="osx-pl-flabel">What I\'m pitching</div><input class="osx-pl-in" data-lf="' + esc(l.id) + '|topic" value="' + esc(l.topic || '') + '" placeholder="The product / topic of this live" maxlength="120">' +
      '<div class="osx-pl-flabel">My hook / opening script</div><textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|hook" placeholder="The first 10 seconds that stop the scroll…" maxlength="400">' + esc(l.hook || '') + '</textarea>' +
      '<div class="osx-pl-flabel">My goal for this live</div><input class="osx-pl-in" data-lf="' + esc(l.id) + '|goal" value="' + esc(l.goal || '') + '" placeholder="e.g. +100 followers, 5 sales" maxlength="120">' +
      '<a class="osx-lv-mkt" href="/pages/marketing-haus" target="_blank" rel="noopener">🎨 Build my hook &amp; promo in Marketing Haus →</a>';
    var stats = '<div class="osx-lv-check"><div class="osx-pl-flabel" style="margin-top:0;">Post-live check-in — how did it go?</div><div class="osx-lv-grid">' +
      LIVE_STATS.map(function (s) { return '<label class="osx-lv-f"><span>' + esc(s[1]) + '</span><input class="osx-pl-in" data-ls="' + esc(l.id) + '|' + s[0] + '" value="' + esc(ls[s[0]] || '') + '" inputmode="numeric" maxlength="12"></label>'; }).join('') + '</div>' +
      '<div class="osx-pl-flabel">What worked / what I\'d change</div><textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|notes" maxlength="400">' + esc(l.notes || '') + '</textarea>' +
      '<button class="osx-lv-donebtn' + (l.done ? ' on' : '') + '" data-ldone="' + esc(l.id) + '">' + (l.done ? '✓ Logged — tap to reopen' : 'Save results') + '</button></div>';
    return '<div class="osx-lv-card open">' + head + '<div class="osx-lv-body">' + plan + stats + '<div class="osx-lv-del"><button data-lvdel="' + esc(l.id) + '">Delete live</button></div></div></div>';
  }
  function livesHTML() {
    var t = livesTrend(), sp = sparkline();
    var trend = t.count ? '<div class="osx-lv-trend">' +
      '<div class="osx-lv-stat"><b>' + t.count + '</b><span>lives logged</span></div>' +
      '<div class="osx-lv-stat"><b>+' + t.totalF + '</b><span>new followers</span></div>' +
      '<div class="osx-lv-stat"><b>+' + t.avgF + '</b><span>avg / live</span></div>' +
      '<div class="osx-lv-stat"><b>' + esc(t.best) + '</b><span>best time</span></div>' +
      (sp ? '<div class="osx-lv-sparkwrap"><span>followers trend</span>' + sp + '</div>' : '') + '</div>' : '';
    var up = data.lives.filter(function (l) { return !l.done; }), past = data.lives.filter(function (l) { return l.done; });
    up.sort(function (a, b) { return (a.date || '~').localeCompare(b.date || '~'); });
    past.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var list = (up.length ? '<div class="osx-pl-sech">📡 Upcoming</div>' + up.map(liveCard).join('') : '') +
               (past.length ? '<div class="osx-pl-sech" style="margin-top:16px;">✓ Past lives</div>' + past.map(liveCard).join('') : '');
    if (!data.lives.length) list = '<div class="osx-pl-empty">Plan your first live — script the hook, set a goal, then log how it went. The trends build themselves.</div>';
    return trend + '<button class="osx-pl-newgoal" data-newlive>＋ Plan a live</button>' + list;
  }

  /* ---------- posts (daily social post log + weekly review) ---------- */
  var POST_TYPES = ['Video', 'Reel', 'Carousel', 'Photo', 'Story', 'Text'];
  var POST_STATS = [['views', 'Views'], ['likes', 'Likes'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves'], ['followers', 'New followers']];
  function postObj(id) { return data.posts.filter(function (p) { return p.id === id; })[0]; }
  function postsTrend() {
    var done = data.posts.filter(function (p) { return p.done; }); var tv = 0, tl = 0;
    done.forEach(function (p) { tv += num((p.s || {}).views); tl += num((p.s || {}).likes); });
    var byType = {}; done.forEach(function (p) { if (!p.type) return; (byType[p.type] = byType[p.type] || []).push(num((p.s || {}).likes)); });
    var best = '—', ba = -1; Object.keys(byType).forEach(function (t) { var a = byType[t], m = a.reduce(function (x, y) { return x + y; }, 0) / a.length; if (m > ba) { ba = m; best = t; } });
    return { count: done.length, tv: tv, tl: tl, best: best };
  }
  function postCard(p) {
    var open = !!expanded['P' + p.id], ps = p.s || {};
    var kv = p.done ? (num(ps.likes) + ' likes · ' + num(ps.views) + ' views') : (liveDateLabel(p) + (p.time ? ' · ' + esc(p.time) : ''));
    var head = '<div class="osx-lv-h" data-ptoggle="' + esc(p.id) + '"><span class="osx-lv-plat">' + esc(p.type || 'Post') + '</span>' +
      '<span class="osx-lv-hb"><b>' + esc(p.topic || 'Untitled post') + '</b><span class="osx-lv-hm">' + (p.done ? '✓ ' : '📝 ') + esc(kv) + '</span></span>' +
      '<span class="osx-lv-when">' + esc(liveDateLabel(p)) + '</span></div>';
    if (!open) return '<div class="osx-lv-card">' + head + '</div>';
    var plan = '<div class="osx-lv-grid">' +
      '<label class="osx-lv-f"><span>Date</span><input type="date" class="osx-pl-date" data-pf="' + esc(p.id) + '|date" value="' + esc(p.date || '') + '"></label>' +
      '<label class="osx-lv-f"><span>Time posted</span><input class="osx-pl-in" data-pf="' + esc(p.id) + '|time" value="' + esc(p.time || '') + '" placeholder="e.g. 6:30 PM" maxlength="24"></label>' +
      '<label class="osx-lv-f"><span>Platform</span><select class="osx-pl-date" data-pf="' + esc(p.id) + '|platform">' + PLATFORMS.map(function (x) { return '<option' + (x === p.platform ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label class="osx-lv-f"><span>Type</span><select class="osx-pl-date" data-pf="' + esc(p.id) + '|type">' + POST_TYPES.map(function (x) { return '<option' + (x === p.type ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label class="osx-lv-f"><span>Video length</span><input class="osx-pl-in" data-pf="' + esc(p.id) + '|length" value="' + esc(p.length || '') + '" placeholder="e.g. 0:45" maxlength="12"></label>' +
      '<label class="osx-lv-f"><span>Music?</span><select class="osx-pl-date" data-pf="' + esc(p.id) + '|music"><option' + (!p.music ? ' selected' : '') + ' value="">—</option><option' + (p.music === 'Yes' ? ' selected' : '') + '>Yes</option><option' + (p.music === 'No' ? ' selected' : '') + '>No</option></select></label></div>' +
      '<div class="osx-pl-flabel">What it\'s about</div><input class="osx-pl-in" data-pf="' + esc(p.id) + '|topic" value="' + esc(p.topic || '') + '" placeholder="Topic / theme" maxlength="120">' +
      '<div class="osx-pl-flabel">On-screen text / hook</div><textarea class="osx-pl-ta" rows="2" data-pf="' + esc(p.id) + '|hook" maxlength="300">' + esc(p.hook || '') + '</textarea>' +
      '<div class="osx-pl-flabel">Call to action (CTA)</div><input class="osx-pl-in" data-pf="' + esc(p.id) + '|cta" value="' + esc(p.cta || '') + '" placeholder="e.g. Comment WIN, Link in bio" maxlength="120">' +
      '<a class="osx-lv-mkt" href="/pages/marketing-haus" target="_blank" rel="noopener">🎨 Build this post in Marketing Haus →</a>';
    var stats = '<div class="osx-lv-check"><div class="osx-pl-flabel" style="margin-top:0;">How did it do?</div><div class="osx-lv-grid">' +
      POST_STATS.map(function (s) { return '<label class="osx-lv-f"><span>' + esc(s[1]) + '</span><input class="osx-pl-in" data-pps="' + esc(p.id) + '|' + s[0] + '" value="' + esc(ps[s[0]] || '') + '" inputmode="numeric" maxlength="12"></label>'; }).join('') + '</div>' +
      '<button class="osx-lv-donebtn' + (p.done ? ' on' : '') + '" data-pdone="' + esc(p.id) + '">' + (p.done ? '✓ Logged — tap to reopen' : 'Save results') + '</button></div>';
    return '<div class="osx-lv-card open">' + head + '<div class="osx-lv-body">' + plan + stats + '<div class="osx-lv-del"><button data-ppdel="' + esc(p.id) + '">Delete post</button></div></div></div>';
  }
  function postsHTML() {
    var t = postsTrend();
    var trend = t.count ? '<div class="osx-lv-trend"><div class="osx-lv-stat"><b>' + t.count + '</b><span>posts logged</span></div>' +
      '<div class="osx-lv-stat"><b>' + t.tv + '</b><span>total views</span></div>' +
      '<div class="osx-lv-stat"><b>' + t.tl + '</b><span>total likes</span></div>' +
      '<div class="osx-lv-stat"><b>' + esc(t.best) + '</b><span>best type</span></div></div>' : '';
    var up = data.posts.filter(function (p) { return !p.done; }), past = data.posts.filter(function (p) { return p.done; });
    up.sort(function (a, b) { return (a.date || '~').localeCompare(b.date || '~'); });
    past.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var list = (up.length ? '<div class="osx-pl-sech">📝 Planned / to log</div>' + up.map(postCard).join('') : '') +
               (past.length ? '<div class="osx-pl-sech" style="margin-top:16px;">✓ Logged posts</div>' + past.map(postCard).join('') : '');
    if (!data.posts.length) list = '<div class="osx-pl-empty">Log every post — platform, type, hook, CTA, music — then how it did. You\'ll see which posts actually move the needle.</div>';
    return trend + '<button class="osx-pl-newgoal" data-newpost>＋ Log a post</button>' + list;
  }

  /* ---------- growth (weekly snapshot of account totals + trend) ---------- */
  var SNAP_STATS = [['followers', 'Total followers'], ['likes', 'Total likes'], ['diamonds', 'Diamonds'], ['revenue', 'Revenue ($)']];
  function snapObj(id) { return data.snaps.filter(function (s) { return s.id === id; })[0]; }
  function livesInWeek(wk) { return data.lives.filter(function (l) { return l.date && periodKey('week', new Date(l.date.split('-')[0], l.date.split('-')[1] - 1, l.date.split('-')[2])) === wk; }).length; }
  function postsInWeek(wk) { return data.posts.filter(function (p) { return p.date && periodKey('week', new Date(p.date.split('-')[0], p.date.split('-')[1] - 1, p.date.split('-')[2])) === wk; }).length; }
  function growthHTML() {
    var snaps = data.snaps.slice().sort(function (a, b) { return (a.week || '').localeCompare(b.week || ''); });
    var last = snaps[snaps.length - 1], prev = snaps[snaps.length - 2];
    var delta = (last && prev) ? (num(last.followers) - num(prev.followers)) : 0;
    var head = '<div class="osx-lv-trend"><div class="osx-lv-stat"><b>' + (last ? num(last.followers) : 0) + '</b><span>followers now</span></div>' +
      '<div class="osx-lv-stat"><b>' + (delta >= 0 ? '+' : '') + delta + '</b><span>vs last week</span></div>' +
      '<div class="osx-lv-stat"><b>' + livesInWeek(weekKey()) + '</b><span>lives this week</span></div>' +
      '<div class="osx-lv-stat"><b>' + postsInWeek(weekKey()) + '</b><span>posts this week</span></div>';
    var vals = snaps.map(function (s) { return num(s.followers); });
    if (vals.length > 1) { var max = Math.max.apply(null, vals) || 1, w = 200, h = 40, step = w / (vals.length - 1); var pts = vals.map(function (v, i) { return (i * step).toFixed(1) + ',' + (h - (v / max) * (h - 4) - 2).toFixed(1); }).join(' '); head += '<div class="osx-lv-sparkwrap"><span>follower growth</span><svg class="osx-lv-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="var(--gold-bright)" stroke-width="2" stroke-linejoin="round"/></svg></div>'; }
    head += '</div>';
    var cur = data.snaps.filter(function (s) { return s.week === weekKey(); })[0];
    var form;
    if (cur) {
      form = '<div class="osx-pl-sech">This week — ' + weekKey() + '</div><div class="osx-lv-card open"><div class="osx-lv-body"><div class="osx-lv-grid" style="margin-top:14px;">' +
        SNAP_STATS.map(function (s) { return '<label class="osx-lv-f"><span>' + esc(s[1]) + '</span><input class="osx-pl-in" data-snf="' + esc(cur.id) + '|' + s[0] + '" value="' + esc(cur[s[0]] || '') + '" inputmode="numeric" maxlength="14"></label>'; }).join('') + '</div></div></div>';
    } else {
      form = '<button class="osx-pl-newgoal" data-newsnap>＋ Log this week\'s numbers</button>';
    }
    var history = snaps.length ? '<div class="osx-pl-sech" style="margin-top:16px;">History</div>' + snaps.slice().reverse().map(function (s) { return '<div class="osx-gr-row"><b>' + esc(s.week) + '</b><span>' + num(s.followers) + ' followers · ' + num(s.likes) + ' likes · ' + num(s.diamonds) + ' 💎</span><button class="osx-pl-del" data-sndel="' + esc(s.id) + '" aria-label="Remove">✕</button></div>'; }).join('') : '';
    return head + form + history;
  }

  /* ---------- ideas (content idea vault → plan into posts) ---------- */
  function ideasHTML() {
    var list = data.ideas.length ? data.ideas.map(function (i) {
      return '<div class="osx-idea"><span class="osx-idea-t' + (i.used ? ' used' : '') + '">' + esc(i.text) + '</span><div class="osx-idea-a">' +
        (i.used ? '<span class="osx-idea-badge">✓ planned</span>' : '<button class="osx-idea-plan" data-idea="' + esc(i.id) + '">→ Plan as post</button>') +
        '<button class="osx-pl-del" data-iddel="' + esc(i.id) + '" aria-label="Remove">✕</button></div></div>';
    }).join('') : '<div class="osx-pl-empty">Dump every content idea here — the shower thoughts, the trends, the "I should make a video about…". Plan them into posts when you\'re ready.</div>';
    return '<div class="osx-pl-add"><input class="osx-pl-in" data-newidea placeholder="Capture a content idea…" maxlength="160"><button class="osx-pl-addbtn" data-newideab>Add</button></div>' + list;
  }

  function render() {
    var body = view === 'dash' ? dashHTML() : view === 'goals' ? goalsHTML() : view === 'lives' ? livesHTML() : view === 'posts' ? postsHTML() : view === 'ideas' ? ideasHTML() : view === 'growth' ? growthHTML() : listsHTML();
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
    // lives
    var nl = host.querySelector('[data-newlive]'); if (nl) nl.addEventListener('click', function () { var l = { id: uid(), topic: 'New live', platform: 'TikTok', date: '', time: '', hook: '', goal: '', notes: '', done: false, s: {} }; data.lives.unshift(l); expanded['L' + l.id] = true; save(); render(); });
    host.querySelectorAll('[data-ltoggle]').forEach(function (b) { b.addEventListener('click', function (e) { if (e.target.closest('input,select,textarea,button,a')) return; var id = b.getAttribute('data-ltoggle'); expanded['L' + id] = !expanded['L' + id]; render(); }); });
    host.querySelectorAll('[data-lf]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-lf').split('|'), l = liveObj(p[0]); if (l) { l[p[1]] = el.value; save(); if (p[1] === 'date' || p[1] === 'platform') render(); } }); });
    host.querySelectorAll('[data-ls]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-ls').split('|'), l = liveObj(p[0]); if (l) { l.s = l.s || {}; l.s[p[1]] = el.value; save(); } }); });
    host.querySelectorAll('[data-ldone]').forEach(function (b) { b.addEventListener('click', function () { var l = liveObj(b.getAttribute('data-ldone')); if (l) { l.done = !l.done; save(); render(); } }); });
    host.querySelectorAll('[data-lvdel]').forEach(function (b) { b.addEventListener('click', function () { if (!window.confirm('Delete this live?')) return; data.lives = data.lives.filter(function (x) { return x.id !== b.getAttribute('data-lvdel'); }); save(); render(); }); });
    // posts
    var np = host.querySelector('[data-newpost]'); if (np) np.addEventListener('click', function () { var p = { id: uid(), topic: 'New post', platform: 'TikTok', type: 'Video', date: '', time: '', hook: '', cta: '', length: '', music: '', done: false, s: {} }; data.posts.unshift(p); expanded['P' + p.id] = true; save(); render(); });
    host.querySelectorAll('[data-ptoggle]').forEach(function (b) { b.addEventListener('click', function (e) { if (e.target.closest('input,select,textarea,button,a')) return; var id = b.getAttribute('data-ptoggle'); expanded['P' + id] = !expanded['P' + id]; render(); }); });
    host.querySelectorAll('[data-pf]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-pf').split('|'), o = postObj(p[0]); if (o) { o[p[1]] = el.value; save(); if (p[1] === 'date' || p[1] === 'platform' || p[1] === 'type') render(); } }); });
    host.querySelectorAll('[data-pps]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-pps').split('|'), o = postObj(p[0]); if (o) { o.s = o.s || {}; o.s[p[1]] = el.value; save(); } }); });
    host.querySelectorAll('[data-pdone]').forEach(function (b) { b.addEventListener('click', function () { var o = postObj(b.getAttribute('data-pdone')); if (o) { o.done = !o.done; save(); render(); } }); });
    host.querySelectorAll('[data-ppdel]').forEach(function (b) { b.addEventListener('click', function () { if (!window.confirm('Delete this post?')) return; data.posts = data.posts.filter(function (x) { return x.id !== b.getAttribute('data-ppdel'); }); save(); render(); }); });
    // growth (weekly snapshots)
    var ns = host.querySelector('[data-newsnap]'); if (ns) ns.addEventListener('click', function () { data.snaps.push({ id: uid(), week: weekKey(), followers: '', likes: '', diamonds: '', revenue: '' }); save(); render(); });
    host.querySelectorAll('[data-snf]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-snf').split('|'), o = snapObj(p[0]); if (o) { o[p[1]] = el.value; save(); } }); });
    host.querySelectorAll('[data-sndel]').forEach(function (b) { b.addEventListener('click', function () { data.snaps = data.snaps.filter(function (x) { return x.id !== b.getAttribute('data-sndel'); }); save(); render(); }); });
    // ideas
    function addIdea() { var inp = host.querySelector('[data-newidea]'); var v = (inp && inp.value || '').trim(); if (!v) return; data.ideas.unshift({ id: uid(), text: v.slice(0, 160), used: false }); save(); render(); }
    var nib = host.querySelector('[data-newideab]'); if (nib) nib.addEventListener('click', addIdea);
    var ni = host.querySelector('[data-newidea]'); if (ni) ni.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addIdea(); } });
    host.querySelectorAll('[data-idea]').forEach(function (b) { b.addEventListener('click', function () { var i = data.ideas.filter(function (x) { return x.id === b.getAttribute('data-idea'); })[0]; if (i) { i.used = true; data.posts.unshift({ id: uid(), topic: i.text, platform: 'TikTok', type: 'Video', date: '', time: '', hook: '', cta: '', length: '', music: '', done: false, s: {} }); save(); view = 'posts'; render(); } }); });
    host.querySelectorAll('[data-iddel]').forEach(function (b) { b.addEventListener('click', function () { data.ideas = data.ideas.filter(function (x) { return x.id !== b.getAttribute('data-iddel'); }); save(); render(); }); });
  }
  function addRoad(gid) { var inp = host.querySelector('[data-radd="' + gid + '"]'); var v = (inp && inp.value || '').trim(); if (!v) return; var g = goal(gid); if (g) { g.roadmap = g.roadmap || []; g.roadmap.push({ id: uid(), text: v.slice(0, 120), pct: 0 }); save(); render(); } }
  function addList(bucket) { var inp = host.querySelector('[data-ladd="' + bucket + '"]'); var v = (inp && inp.value || '').trim(); if (!v) return; if (bucket === 'top' && data[active].top.length >= 3) return; data[active][bucket].push({ id: uid(), text: v.slice(0, 120), pct: 0 }); save(); render(); }

  render();
})();
