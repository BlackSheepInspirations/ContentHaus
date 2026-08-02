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
  var STAGES = [['grows', '🌱', 'Planning'], ['rooted', '🚀', 'Launching'], ['evergreen', '🌲', 'Evergreen']];
  var GROWS = [['g', 'G', 'Ground Zero', 'Where you actually stand right now — not where you wish you stood.'],
               ['r', 'R', 'Roadmap', 'The specific, ordered steps between here and your Success Vision.'],
               ['o', 'O', 'Ownership', 'What will you personally ship this week — not once it feels ready?'],
               ['w', 'W', 'Window of Time', 'A real deadline on the calendar. Skip it and the plan drifts forever.'],
               ['s', 'S', 'Success Vision', 'What "done" looks like — specific enough to know when you\'ve arrived.']];
  var ROOTED_STEPS = ['R · Reach — warm up the right people', 'O · Open — build anticipation', 'O · Offer — make the offer', 'T · Trigger — proof + urgency', 'E · Escalate — the close', 'D · Deepen — keep it going after'];
  var ROADMAP_TEMPLATES = [
    ['rooted', '🚀 ROOTED launch', ROOTED_STEPS],
    ['raft', '🔁 RAFT sprint', ['R · Relieve — clear your biggest blocker', 'A · Act — one committed action this week', 'F · Fast Win — ship one thing that didn\'t exist before', 'T · Traction — measure it, then run it back']],
    ['content', '📱 Content week', ['Plan the week\'s hooks & topics', 'Batch-create the content', 'Schedule / queue the posts', 'Show up daily (post or go live)', 'Engage — reply to every comment', 'Review what worked, then double down']]
  ];
  function tmplDropdown(scope) {
    return '<span class="osx-tmpl-wrap"><button class="osx-pl-tmpl" type="button" data-tmpl-open="' + esc(scope) + '">＋ Template ▾</button>' +
      '<span class="osx-menu-pop osx-tmpl-pop" hidden>' + ROADMAP_TEMPLATES.map(function (t) { return '<button type="button" data-tmpl-add="' + esc(scope) + '|' + t[0] + '">' + t[1] + ' <i>· ' + t[2].length + '</i></button>'; }).join('') + '</span></span>';
  }

  var view = 'dash', active = 'week', expanded = {}, selected = {}, livesTab = 'lives', calMY = null, pendIdea = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function uid() { return String(Date.now()) + Math.random().toString(36).slice(2, 6); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} try { rebuildReminders(); } catch (e) {} }
  function isoWeek(d) { var dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); var day = dt.getUTCDay() || 7; dt.setUTCDate(dt.getUTCDate() + 4 - day); var ys = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1)); return { y: dt.getUTCFullYear(), w: Math.ceil((((dt - ys) / 86400000) + 1) / 7) }; }
  function periodKey(tf, d) { d = d || new Date(); var y = d.getFullYear(); if (tf === 'day') return y + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); if (tf === 'week') { var wk = isoWeek(d); return wk.y + '-W' + p2(wk.w); } if (tf === 'month') return y + '-' + p2(d.getMonth() + 1); if (tf === 'quarter') return y + '-Q' + (Math.floor(d.getMonth() / 3) + 1); return '' + y; }
  function weekKey() { return periodKey('week'); }

  var data; try { data = JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { data = null; }
  if (!data) data = {}; if (!data.done) data.done = []; if (!data.goals) data.goals = []; if (!data.lives) data.lives = []; if (!data.posts) data.posts = []; if (!data.snaps) data.snaps = []; if (!data.ideas) data.ideas = [];
  if (!data.products) data.products = []; if (!data.ctype) data.ctype = 'both'; if (!data.raft) data.raft = { cycles: [] }; if (!data.northstar) data.northstar = {}; if (!data.templates) data.templates = [];
  data.lives.forEach(function (l) { if (!l.archived && !l.deleted && l.date && daysTo(l.date) < 0) l.archived = true; });   // past-dated lives auto-archive
  var milestoneBaseline = (data.milestones === undefined); if (!data.milestones) data.milestones = {};
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
  /* ---------- RAFT weekly loop + artifacts (controllable-first) ---------- */
  function dfromiso(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function raftCycle() { var wk = weekKey(); var c = data.raft.cycles.filter(function (x) { return x.week === wk; })[0]; if (!c) { c = { week: wk, relieve: '', actText: '', act: 0, fastWin: '', corrected: false }; data.raft.cycles.unshift(c); save(); } return c; }
  function lastCycleWithWin() { var s = data.raft.cycles.slice().sort(function (a, b) { return (b.week || '').localeCompare(a.week || ''); }); for (var i = 0; i < s.length; i++) if (s[i].week !== weekKey() && s[i].fastWin) return s[i]; return null; }
  function tractionStreak() { var wins = data.raft.cycles.filter(function (c) { return c.fastWin; }).map(function (c) { return c.week; }); var n = 0, d = new Date(); for (var i = 0; i < 60; i++) { if (wins.indexOf(periodKey('week', d)) > -1) { n++; d.setDate(d.getDate() - 7); } else if (i === 0) { d.setDate(d.getDate() - 7); } else break; } return n; }
  function artifactCount() { var road = 0; data.goals.forEach(function (g) { (g.roadmap || []).forEach(function (x) { if (x.pct >= 100) road++; }); }); return data.lives.filter(function (l) { return l.done; }).length + data.posts.filter(function (p) { return p.done; }).length + data.products.filter(function (p) { return p.status === 'live'; }).length + road + data.raft.cycles.filter(function (c) { return c.fastWin; }).length; }
  function weekList(n) { var arr = [], d = new Date(); for (var i = 0; i < n; i++) { arr.unshift(periodKey('week', d)); d.setDate(d.getDate() - 7); } return arr; }
  function artifactsInWeek(wk) { var c = 0; data.lives.forEach(function (l) { if (l.done && l.date && periodKey('week', dfromiso(l.date)) === wk) c++; }); data.posts.forEach(function (p) { if (p.done && p.date && periodKey('week', dfromiso(p.date)) === wk) c++; }); if (data.raft.cycles.filter(function (x) { return x.week === wk && x.fastWin; })[0]) c++; return c; }
  function weekArtifacts(wk) {
    var out = [];
    data.lives.forEach(function (l) { if (l.done && l.date && periodKey('week', dfromiso(l.date)) === wk) out.push({ kind: 'live', id: l.id, ic: '📡', t: l.title || l.topic || 'Live' }); });
    data.posts.forEach(function (p) { if (p.done && p.date && periodKey('week', dfromiso(p.date)) === wk) out.push({ kind: 'post', id: p.id, ic: '📝', t: p.topic || 'Post' }); });
    var fw = data.raft.cycles.filter(function (x) { return x.week === wk && x.fastWin; })[0]; if (fw) out.push({ kind: 'fastwin', id: '', ic: '⚡', t: fw.fastWin });
    return out;
  }
  function barChart() {
    var wks = weekList(8), vals = wks.map(artifactsInWeek), max = Math.max.apply(null, vals.concat([1]));
    return '<div class="osx-barchart">' + vals.map(function (v, i) { return '<button type="button" class="osx-bar-col' + (v ? '' : ' empty') + '" data-shipweek="' + esc(wks[i]) + '" title="' + v + ' shipped — click to see"><div class="osx-bar" style="height:' + Math.max(5, Math.round((v / max) * 100)) + '%"></div><span>' + esc(wks[i].slice(-3)) + '</span></button>'; }).join('') + '</div>';
  }
  function openItemDetail(kind, id) {
    if (kind === 'live') { view = 'lives'; livesTab = 'lives'; expanded['L' + id] = true; }
    else if (kind === 'post') { view = 'posts'; expanded['P' + id] = true; }
    else if (kind === 'product') { view = 'products'; expanded['PR' + id] = true; }
    else if (kind === 'goal') { view = 'goals'; expanded[id] = true; }
    else { view = 'dash'; }
    render();
    setTimeout(function () { var el = host.querySelector('[data-ltoggle="' + id + '"],[data-ptoggle="' + id + '"],[data-prtoggle="' + id + '"],[data-toggle="' + id + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 40);
  }
  function openShipWeek(wk) {
    var arts = weekArtifacts(wk);
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop'; root.appendChild(pop);
    var rows = arts.length ? arts.map(function (a) { return '<div class="osx-dcp-i">' + a.ic + ' <b>' + esc(a.t) + '</b>' + (a.kind !== 'fastwin' ? '<button class="osx-ship-open" type="button" data-shipopen="' + a.kind + '|' + esc(a.id) + '">open & update details →</button>' : '') + '</div>'; }).join('') : '<div class="osx-pl-empty">Nothing logged this week.</div>';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-ns"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button><div class="osx-ns-h">Shipped · week of ' + esc(wk) + '</div>' + rows + '<button class="osx-cele-x" type="button" style="margin-top:12px;">Close</button></div>';
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-cele-x').addEventListener('click', close);
    pop.querySelectorAll('[data-shipopen]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-shipopen').split('|'); close(); openItemDetail(p[0], p[1]); }); });
  }
  function raftHTML() {
    var c = raftCycle(), last = lastCycleWithWin(), ct = data.ctype || 'both';
    var actL = ['Not chosen', '① Chosen', '② Started', '③ Done'], trac = ct === 'product' ? 'products w/ repeat' : 'weeks unbroken';
    return '<div class="osx-raft"><div class="osx-raft-h">🧭 This week\'s loop · RAFT <span>Relieve → Act → Fast Win → Traction</span></div><div class="osx-raft-grid">' +
      '<div class="osx-raft-b"><div class="osx-raft-l">R · Relieve</div><div class="osx-raft-hint">Where am I? What did last week prove?' + (last ? ' <em>Last win: ' + esc(last.fastWin) + '</em>' : '') + '</div><textarea class="osx-pl-ta" rows="2" data-raft="relieve" maxlength="300">' + esc(c.relieve) + '</textarea></div>' +
      '<div class="osx-raft-b"><div class="osx-raft-l">A · Act <span class="osx-raft-act-s">' + actL[c.act || 0] + '</span></div><input class="osx-pl-in" data-raft="actText" value="' + esc(c.actText) + '" placeholder="The one committed move this week" maxlength="160"><div class="osx-raft-acts"><button class="osx-raft-ab' + ((c.act || 0) >= 1 ? ' on' : '') + '" data-act="1">Chosen</button><button class="osx-raft-ab' + ((c.act || 0) >= 2 ? ' on' : '') + '" data-act="2">Started</button><button class="osx-raft-ab' + ((c.act || 0) >= 3 ? ' on' : '') + '" data-act="3">Done</button></div></div>' +
      '<div class="osx-raft-b"><div class="osx-raft-l">F · Fast Win</div><div class="osx-raft-hint">What shipped that didn\'t exist before?</div><input class="osx-pl-in" data-raft="fastWin" value="' + esc(c.fastWin) + '" placeholder="The thing you made — proof, not promise" maxlength="160"></div>' +
      '<div class="osx-raft-b"><div class="osx-raft-l">T · Traction</div><div class="osx-raft-hint"><b>' + tractionStreak() + '</b> ' + trac + ' · did you correct something?</div><label class="osx-raft-corr"><input type="checkbox" data-raft="corrected"' + (c.corrected ? ' checked' : '') + '> I made a correction from last week</label></div>' +
      '</div></div>';
  }
  function laggingHTML() {
    var snaps = data.snaps.slice().sort(function (a, b) { return (a.week || '').localeCompare(b.week || ''); }), last = snaps[snaps.length - 1] || {}, vals = snaps.map(function (s) { return num(s.followers); });
    var line = ''; if (vals.length > 1) { var max = Math.max.apply(null, vals) || 1, w = 160, h = 30, step = w / (vals.length - 1); line = '<svg class="osx-lag-line" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline points="' + vals.map(function (v, i) { return (i * step).toFixed(1) + ',' + (h - (v / max) * (h - 2) - 1).toFixed(1); }).join(' ') + '" fill="none" stroke="#6b7d84" stroke-width="1.5"/></svg>'; }
    return '<div class="osx-lag"><div class="osx-lag-h">Lagging indicators <span>— not fully in your hands; the work above is what moves them</span></div><div class="osx-lag-row"><div class="osx-lag-s"><b>' + num(last.followers) + '</b><span>followers</span></div><div class="osx-lag-s"><b>' + num(last.likes) + '</b><span>likes</span></div><div class="osx-lag-s"><b>$' + num(last.revenue) + '</b><span>revenue</span></div>' + (line ? '<div class="osx-lag-linewrap">' + line + '</div>' : '') + '</div></div>';
  }
  var TABS = [['dash', '📊 Dashboard', 'all'], ['goals', '🎯 Goals', 'all'], ['products', '📦 Products', 'product'], ['lives', '📡 Lives', 'content'], ['posts', '📝 Posts', 'content'], ['growth', '📈 Growth', 'all'], ['journal', '📓 Journal', 'all'], ['lists', '✅ Lists', 'all']];
  function tabShown(cat) { var ct = data.ctype || 'both'; if (cat === 'all') return true; if (cat === 'product') return ct !== 'content'; return ct !== 'product'; }
  function navHTML() {
    var vis = TABS.filter(function (t) { return tabShown(t[2]); });
    if (!vis.some(function (t) { return t[0] === view; })) view = 'dash';
    return '<div class="osx-pl-nav">' + vis.map(function (t) { return '<button class="osx-pl-navb' + (view === t[0] ? ' on' : '') + '" data-view="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
  }
  var CAL_MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function calP2(n) { return (n < 10 ? '0' : '') + n; }
  function calMarks() { var mk = {}; function add(iso, k) { if (!iso) return; (mk[iso] = mk[iso] || {})[k] = true; } data.lives.forEach(function (l) { if (!l.deleted && l.date) add(l.date, 'live'); }); data.posts.forEach(function (p) { if (!p.deleted && p.date) add(p.date, 'post'); }); data.goals.forEach(function (g) { if (g.w) add(g.w, 'goal'); }); data.products.forEach(function (p) { if (p.launch) add(p.launch, 'prod'); }); (window.P2P_EVENTS || []).forEach(function (e) { if (e.iso) add(e.iso, 'event'); }); try { (JSON.parse(localStorage.getItem('p2p_my_events') || '[]') || []).forEach(function (e) { if (e.iso) add(e.iso, 'plan'); }); } catch (e) {} return mk; }
  function calVisits() { try { return JSON.parse(localStorage.getItem('p2p_visit_days') || '{}') || {}; } catch (e) { return {}; } }
  function ideaTrayHTML() {
    var un = data.ideas.filter(function (i) { return !i.used; });
    if (pendIdea && !un.some(function (i) { return i.id === pendIdea; })) pendIdea = null;
    var chips = un.length
      ? un.slice(0, 12).map(function (i) { return '<button type="button" class="osx-idchip' + (pendIdea === i.id ? ' picking' : '') + '" draggable="true" data-ideachip="' + esc(i.id) + '" title="Drag onto a calendar day — or tap, then tap a day">💡 ' + esc(i.text) + '</button>'; }).join('')
      : '<div class="osx-pl-empty" style="padding:6px 0;">No loose ideas yet — capture some in Journal → Ideas and they\'ll show here to drag onto a day.</div>';
    var pend = pendIdea ? (function () { var it = un.filter(function (i) { return i.id === pendIdea; })[0]; return it ? '<div class="osx-idtray-pick">Tap a day to schedule <b>💡 ' + esc(it.text) + '</b> <button type="button" data-idcancel>Cancel</button></div>' : ''; })() : '';
    return '<div class="osx-idtray"><div class="osx-pl-sech" style="margin-top:14px;">✨ Ideas to schedule <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:600;">· drag one onto a day</span></div>' + pend + '<div class="osx-idtray-row">' + chips + '</div></div>';
  }
  function dashCalHTML() {
    if (!calMY) { var n = new Date(); calMY = { y: n.getFullYear(), m: n.getMonth() }; }
    var mk = calMarks(), visits = calVisits();
    var first = new Date(calMY.y, calMY.m, 1).getDay(), days = new Date(calMY.y, calMY.m + 1, 0).getDate();
    var td = new Date(), tISO = td.getFullYear() + '-' + calP2(td.getMonth() + 1) + '-' + calP2(td.getDate()), cells = '';
    for (var i = 0; i < first; i++) cells += '<span class="osx-dc-d empty"></span>';
    for (var d = 1; d <= days; d++) {
      var iso = calMY.y + '-' + calP2(calMY.m + 1) + '-' + calP2(d), m = mk[iso] || {};
      var marks = (visits[iso] ? '<i class="osx-dc-star">★</i>' : '') + (m.live ? '<i class="osx-dc-dot live"></i>' : '') + (m.post ? '<i class="osx-dc-dot post"></i>' : '') + (m.goal ? '<i class="osx-dc-dot goal"></i>' : '') + (m.prod ? '<i class="osx-dc-dot prod"></i>' : '') + (m.event ? '<i class="osx-dc-dot event"></i>' : '') + (m.plan ? '<i class="osx-dc-dot plan"></i>' : '');
      cells += '<button type="button" class="osx-dc-d' + (iso === tISO ? ' today' : '') + (pendIdea ? ' picking' : '') + '" data-dcday="' + iso + '">' + d + (marks ? '<span class="osx-dc-marks">' + marks + '</span>' : '') + '</button>';
    }
    return '<div class="osx-dc"><div class="osx-dc-head"><button type="button" data-dcprev aria-label="Previous month">‹</button><b>' + CAL_MO[calMY.m] + ' ' + calMY.y + '</b><button type="button" data-dcnext aria-label="Next month">›</button></div>' +
      '<div class="osx-dc-dows"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div><div class="osx-dc-grid">' + cells + '</div>' +
      '<div class="osx-dc-legend"><span class="l-live">live</span><span class="l-post">posted</span><span class="l-goal">goal</span><span class="l-prod">launch</span><span class="l-event">event</span><span class="l-plan">plan</span><span class="l-star">★ showed up</span></div></div>';
  }
  function radarHTML() {
    var items = [];
    data.lives.forEach(function (l) { if (!l.deleted && !l.done && l.date) { var dd = daysTo(l.date); if (dd !== null && dd >= 0 && dd <= 14) items.push({ d: dd, kind: 'live', id: l.id, ic: '📡', t: l.title || l.topic || 'Live' }); } });
    data.goals.forEach(function (g) { if (g.w) { var dd = daysTo(g.w); if (dd !== null && dd >= 0 && dd <= 14) items.push({ d: dd, kind: 'goal', id: g.id, ic: '🎯', t: g.title || 'Goal launch' }); } });
    data.products.forEach(function (p) { if (p.launch) { var dd = daysTo(p.launch); if (dd !== null && dd >= 0 && dd <= 14) items.push({ d: dd, kind: 'product', id: p.id, ic: '📦', t: p.name || 'Product launch' }); } });
    items.sort(function (a, b) { return a.d - b.d; });
    var body = items.length ? '<div class="osx-radar-scroll' + (items.length > 5 ? ' more' : '') + '">' + items.map(function (it) { return '<button type="button" class="osx-radar-i" data-openitem="' + it.kind + '|' + esc(it.id) + '"><span class="osx-radar-ic">' + it.ic + '</span><span class="osx-radar-t">' + esc(it.t) + '</span><span class="osx-radar-d' + (it.d <= 1 ? ' soon' : '') + '">' + (it.d === 0 ? 'Today' : it.d === 1 ? '1 day' : it.d + ' days') + '</span></button>'; }).join('') + '</div>' : '<div class="osx-pl-empty" style="padding:6px 0;">Nothing in the next 2 weeks — plan a live or set a launch date.</div>';
    return '<div class="osx-pl-sech" style="margin-top:0;">🔔 Coming up · next 14 days' + (items.length > 5 ? ' <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:600;">· scroll for ' + (items.length - 5) + ' more</span>' : '') + '</div>' + body;
  }
  function openDcDay(iso) {
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop'; root.appendChild(pop);
    var p = iso.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2]);
    var rows = data.lives.filter(function (l) { return !l.deleted && l.date === iso; }).map(function (l) { return '<div class="osx-dcp-i">📡 <b>' + esc(l.title || l.topic || 'Live') + '</b>' + (liveTimeStr(l) ? ' · ' + esc(liveTimeStr(l)) : '') + '</div>'; })
      .concat(data.posts.filter(function (pp) { return !pp.deleted && pp.date === iso; }).map(function (pp) { return '<div class="osx-dcp-i">📝 <b>' + esc(pp.topic || pp.platform || 'Post') + '</b>' + (pp.done ? ' · ✓ posted' : '') + '</div>'; }))
      .concat(data.goals.filter(function (g) { return g.w === iso; }).map(function (g) { return '<div class="osx-dcp-i">🎯 <b>' + esc(g.title || 'Goal window') + '</b> — launch target</div>'; }))
      .concat(data.products.filter(function (x) { return x.launch === iso; }).map(function (x) { return '<div class="osx-dcp-i">📦 <b>' + esc(x.name || 'Product') + '</b> — launch</div>'; }))
      .concat((window.P2P_EVENTS || []).filter(function (e) { return e.iso === iso; }).map(function (e) { return '<div class="osx-dcp-i">📅 <b>' + esc(e.title || 'Event') + '</b>' + (e.time ? ' · ' + esc(e.time) : '') + '</div>'; }));
    try { rows = rows.concat((JSON.parse(localStorage.getItem('p2p_my_events') || '[]') || []).filter(function (e) { return e.iso === iso; }).map(function (e) { return '<div class="osx-dcp-i">✎ <b>' + esc(e.title || 'Plan') + '</b>' + (e.time ? ' · ' + esc(e.time) : '') + '</div>'; })); } catch (e) {}
    pop.innerHTML = '<div class="osx-cal-pop-in osx-ns"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button><div class="osx-ns-h">' + esc(dt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })) + '</div>' + (rows.join('') || '<div class="osx-pl-empty">Nothing scheduled this day.</div>') + '<button class="osx-dclog" type="button" data-dclog>＋ Log a post I made this day</button><button class="osx-cele-x" type="button" style="margin-top:8px;">Close</button></div>';
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-cele-x').addEventListener('click', close);
    var lb = pop.querySelector('[data-dclog]');
    if (lb) lb.addEventListener('click', function () { data.posts.unshift({ id: uid(), topic: 'Posted', platform: 'TikTok', type: 'Video', date: iso, time: '', hook: '', cta: '', length: '', music: '', done: true, s: {} }); save(); close(); render(); });
  }
  function scheduleIdea(ideaId, iso) {
    var i = data.ideas.filter(function (x) { return x.id === ideaId; })[0];
    if (!i || !iso) return;
    i.used = true;
    data.posts.unshift({ id: uid(), topic: i.text, platform: 'TikTok', type: 'Video', date: iso, time: '', hook: '', cta: '', length: '', music: '', done: false, s: {} });
    save(); render();
  }
  /* ---------- social snapshot widgets (creator side) ---------- */
  function liveStat(l, key) { var r = l.results || {}, s = 0; Object.keys(r).forEach(function (p) { s += num((r[p] || {})[key]); }); return s; }
  function liveStatAvg(l, key) { var r = l.results || {}, s = 0, n = 0; Object.keys(r).forEach(function (p) { var v = num((r[p] || {})[key]); if (v > 0) { s += v; n++; } }); return n ? Math.round(s / n) : 0; }
  function lastLive() { return data.lives.filter(function (l) { return l.done && l.date; }).sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); })[0]; }
  function liveMet(l) { var met = 0, total = 0, g = l.goals || {}, r = l.results || {}; Object.keys(g).forEach(function (p) { var gp = g[p] || {}, rp = r[p] || {}; Object.keys(gp).forEach(function (k) { if (gp[k] !== '' && gp[k] != null) { total++; if (num(rp[k]) >= num(gp[k])) met++; } }); }); return { met: met, total: total }; }
  function topPlatform() { var by = {}; data.lives.filter(function (l) { return l.done; }).forEach(function (l) { var r = l.results || {}; Object.keys(r).forEach(function (p) { var nm = p === 'Other' ? (l.otherPlat || 'Other') : p; by[nm] = (by[nm] || 0) + liveStatKeyForPlat(r[p]); }); }); var best = '', bv = -1; Object.keys(by).forEach(function (p) { if (by[p] > bv) { bv = by[p]; best = p; } }); return bv > 0 ? best : ''; }
  function liveStatKeyForPlat(rp) { rp = rp || {}; return num(rp.viewers) + num(rp.followers); }
  function weekActivity(wk) { var c = 0; data.lives.forEach(function (l) { if (!l.deleted && l.date && periodKey('week', dfromiso(l.date)) === wk) c++; }); data.posts.forEach(function (p) { if (p.date && periodKey('week', dfromiso(p.date)) === wk) c++; }); return c; }
  function snapSparkSVG(vals) {
    if (vals.length < 2) return '';
    var max = Math.max.apply(null, vals) || 1, min = Math.min.apply(null, vals), w = 240, h = 46, step = w / (vals.length - 1), rng = (max - min) || 1;
    var pts = vals.map(function (v, i) { return (i * step).toFixed(1) + ',' + (h - ((v - min) / rng) * (h - 6) - 3).toFixed(1); }).join(' ');
    return '<svg class="osx-sw-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="var(--gold-bright)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  function socialWidgetsHTML() {
    if ((data.ctype || 'both') === 'product') return '';
    var ll = lastLive();
    // 1 · last-live recap
    var recap;
    if (ll) { var mm = liveMet(ll), fol = liveFollowers(ll), vw = liveStat(ll, 'viewers'), wt = liveStatAvg(ll, 'watch'); recap = '<button type="button" class="osx-sw-card osx-sw-recap" data-openitem="live|' + esc(ll.id) + '"><div class="osx-sw-t">📡 Last live<span>' + esc(liveDateLabel ? liveDateLabel(ll) : (ll.date || '')) + '</span></div><div class="osx-sw-recap-g"><div><b>' + num(vw) + '</b><span>viewers</span></div><div><b>+' + fol + '</b><span>followers</span></div><div><b>' + wt + '<i>m</i></b><span>avg watch</span></div></div>' + (mm.total ? '<div class="osx-sw-met"><span class="osx-sw-metp' + (mm.met >= mm.total ? ' all' : mm.met ? ' some' : '') + '">' + mm.met + ' / ' + mm.total + ' goals met</span></div>' : '') + '</button>'; }
    else { recap = '<div class="osx-sw-card"><div class="osx-sw-t">📡 Last live</div><div class="osx-sw-empty">Log a live to see your recap here.</div></div>'; }
    // 2 · follower-growth sparkline (weekly snapshots)
    var snaps = data.snaps.slice().sort(function (a, b) { return (a.week || '').localeCompare(b.week || ''); });
    var fvals = snaps.map(function (s) { return num(s.followers); }).filter(function (v, i) { return true; });
    var grow;
    if (snaps.length >= 2 && fvals.some(function (v) { return v > 0; })) {
      var cur = fvals[fvals.length - 1], prev = fvals[fvals.length - 2], delta = cur - prev;
      grow = '<div class="osx-sw-card"><div class="osx-sw-t">📈 Follower growth<span>' + snaps.length + ' weeks</span></div><div class="osx-sw-big">' + num(cur) + ' <em class="' + (delta >= 0 ? 'up' : 'dn') + '">' + (delta >= 0 ? '▲ +' : '▼ ') + num(delta) + '</em></div>' + snapSparkSVG(fvals) + '</div>';
    } else { grow = '<div class="osx-sw-card"><div class="osx-sw-t">📈 Follower growth</div><div class="osx-sw-empty">Log weekly numbers in <b>Growth</b> to see your trend.</div></div>'; }
    // 3 · consistency heatmap (lives + posts / week, last 12)
    var wks = weekList(12), acts = wks.map(weekActivity), amax = Math.max.apply(null, acts.concat([1]));
    var showed = acts.filter(function (v) { return v > 0; }).length;
    var heat = '<div class="osx-sw-card"><div class="osx-sw-t">🔥 Consistency<span>' + showed + ' / 12 wks active</span></div><div class="osx-sw-heat">' + acts.map(function (v, i) { var lv = v === 0 ? 0 : v >= amax ? 4 : Math.ceil(v / amax * 3); return '<span class="osx-sw-hc l' + lv + '" title="' + esc(wks[i].slice(-3)) + ': ' + v + ' shipped"></span>'; }).join('') + '</div><div class="osx-sw-heatlbl"><span>12 wks ago</span><span>now</span></div></div>';
    // 4 · top platform / best time
    var tp = topPlatform(), bt = livesTrend().best;
    var tops = '<div class="osx-sw-card"><div class="osx-sw-t">🏆 What\'s working</div><div class="osx-sw-kv"><span>Top platform</span><b>' + (tp ? esc(tp) : '—') + '</b></div><div class="osx-sw-kv"><span>Best time to go live</span><b>' + (bt && bt !== '—' ? esc(bt) : '—') + '</b></div>' + (!tp ? '<div class="osx-sw-empty" style="margin-top:6px;">Log a couple of lives with results to unlock this.</div>' : '') + '</div>';
    return '<div class="osx-pl-sech">📣 Your social snapshot</div><div class="osx-sw-grid">' + recap + grow + heat + tops + '</div>';
  }
  function dashHTML() {
    var ct = data.ctype || 'both';
    var sel = '<div class="osx-ct-sel"><span class="osx-ct-l">I create:</span>' + [['content', '📱 Content'], ['product', '📦 Products'], ['both', '✨ Both']].map(function (c) { return '<button class="osx-ct-b' + (ct === c[0] ? ' on' : '') + '" data-ctype="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>';
    var upcoming = data.goals.filter(function (g) { return g.w && daysTo(g.w) !== null && daysTo(g.w) >= 0; }).sort(function (a, b) { return daysTo(a.w) - daysTo(b.w); })[0];
    var cd = upcoming ? '<button class="osx-dash-cd" data-open="' + esc(upcoming.id) + '"><div class="osx-dash-cd-n">' + Math.max(0, daysTo(upcoming.w)) + '</div><div class="osx-dash-cd-t"><b>days to launch</b><span>' + esc(upcoming.title || 'your goal') + '</span></div></button>' : '';
    var c = raftCycle();
    var stats = '<div class="osx-lv-trend">' +
      '<div class="osx-lv-stat"><b>' + artifactCount() + '</b><span>things shipped</span></div>' +
      '<div class="osx-lv-stat"><b>' + ['—', 'Chosen', 'Started', 'Done'][c.act || 0] + '</b><span>this week\'s Act</span></div>' +
      '<div class="osx-lv-stat"><b>' + tractionStreak() + '</b><span>traction streak</span></div>' +
      '<div class="osx-lv-stat"><b>' + livesInWeek(weekKey()) + ' / ' + postsInWeek(weekKey()) + '</b><span>lives / posts this wk</span></div></div>';
    var rings = TFS.map(function (t) { return '<div class="osx-pl-dring">' + ring(periodPct(t[0]), '') + '<span class="osx-pl-drl">' + t[1] + '</span></div>'; }).join('');
    var goals = data.goals.length ? data.goals.map(function (g) {
      var st = STAGES.filter(function (s) { return s[0] === (g.stage || 'grows'); })[0];
      return '<button class="osx-pl-gsum" data-open="' + esc(g.id) + '">' + ring(roadPct(g), '') +
        '<span class="osx-pl-gsum-b"><b>' + esc(g.title || 'Untitled goal') + '</b>' +
        '<span class="osx-pl-gsum-m"><span class="osx-pl-stage-b">' + st[1] + ' ' + st[2] + '</span> · ' + esc(countdownText(g.w)) + '</span></span></button>';
    }).join('') : '<div class="osx-pl-empty">No goals yet — head to 🎯 Goals to build one with the GROWS formula.</div>';
    return sel + '<div class="osx-dash-grid"><div class="osx-dash-left">' + cd + raftHTML() + stats + socialWidgetsHTML() +
      '<div class="osx-pl-sech">📊 What you shipped — last 8 weeks</div>' + barChart() +
      '<div class="osx-pl-sech">🎚️ Progress by horizon</div><div class="osx-pl-strip">' + rings + '</div>' +
      '<div class="osx-pl-sech" style="margin-top:10px;">🎯 Your goals</div>' + goals + milestonesStrip() + '</div>' +
      '<div class="osx-dash-right">' + radarHTML() + dashCalHTML() + ideaTrayHTML() + '</div></div>' + laggingHTML();
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
      '<div class="osx-pl-flabel" style="margin-top:14px;">Name this goal</div><input class="osx-pl-in" data-gf="' + esc(g.id) + '|title" value="' + esc(g.title === 'New goal' ? '' : (g.title || '')) + '" placeholder="e.g. Launch my digital planner" maxlength="90">' +
      '<div class="osx-pl-stages"><span class="osx-pl-stagelbl">Stage:</span>' + stageBtns + '<button class="osx-pl-gdel" data-gdel="' + esc(g.id) + '">Delete goal</button></div>' + warn +
      field(g, 'g') +
      '<div class="osx-pl-flabel">R · Roadmap <span>the ordered steps — each tracks its own progress</span></div>' + road +
      '<div class="osx-pl-add"><input class="osx-pl-in" data-radd="' + esc(g.id) + '" placeholder="Add a roadmap step…" maxlength="120"><button class="osx-pl-addbtn" data-raddb="' + esc(g.id) + '">Add</button> ' + tmplDropdown('goal:' + g.id) + '</div>' +
      '<div class="osx-pl-own"><div class="osx-pl-flabel">O · Ownership <span>your committed action this week</span></div>' +
        '<div class="osx-pl-ownrow"><input class="osx-pl-in" data-of="' + esc(g.id) + '" value="' + esc(g.o || '') + '" placeholder="e.g. Publish one product listing this week" maxlength="160">' +
        '<button class="osx-pl-owntog' + (ownedThisWeek(g) ? ' on' : '') + '" data-otog="' + esc(g.id) + '">' + (ownedThisWeek(g) ? '✓ Done this week' : 'Mark done') + '</button></div></div>' +
      '<div class="osx-pl-flabel">W · Window of Time <span>a real deadline</span></div>' +
        '<input class="osx-pl-date" type="date" data-wf="' + esc(g.id) + '" value="' + esc(g.w || '') + '">' +
      remindRow('goal', g.id, g) +
      field(g, 's') +
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
      '<div class="osx-pl-sec"><div class="osx-pl-sech">✎ To-dos ' + tmplDropdown('list') + '</div>' + (seg.todo.map(function (it) { return item(it, 'todo'); }).join('') || '<div class="osx-pl-empty">Everything else you want to move on.</div>') + '<div class="osx-pl-add"><input class="osx-pl-in" data-ladd="todo" placeholder="Add a to-do…" maxlength="120"><button class="osx-pl-addbtn" data-laddb="todo">Add</button></div></div>' +
      '<button class="osx-pl-archbtn" data-arch>✓ Completed archive (' + data.done.length + ')</button>';
  }

  /* ---------- lives (going-live planner + post-live check-in + trends) ---------- */
  var LIVE_STATS = [['followers', 'New followers'], ['gifts', 'Gifts / diamonds'], ['hearts', 'Likes / hearts'], ['comments', 'Comments'], ['shares', 'Shares'], ['viewers', 'Total viewers'], ['peak', 'Peak viewers'], ['watch', 'Avg watch (min)'], ['duration', 'Duration (min)'], ['sales', 'Sales ($)']];
  var PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Other'];
  var PLAT_META = { TikTok: '🎵', Instagram: '📷', YouTube: '▶️', Facebook: '📘', Other: '🔗' };
  var PITCH_ITEMS = ['Grow Room', 'Product demo / showcase', 'Live sale / flash deal', 'Q&A / Ask Me Anything', 'Tutorial / How-to', 'Behind the scenes', 'Storytime / testimony', 'Get Ready With Me', 'Unboxing / haul', 'Challenge / game', 'Community hangout'];
  var TZS = ['ET', 'CT', 'MT', 'PT', 'AKT', 'HT', 'GMT', 'CET', 'AEST'];
  var HRS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], MINS = ['00', '15', '30', '45'];
  var MOODS = ['🔥', '😄', '😊', '😌', '😅', '😐', '😬', '😢', '😤', '🙏'];
  var MOOD_LABELS = ['On fire!', 'Buzzing', 'Good vibes', 'Calm & centered', 'Survived it', 'Meh', 'A bit rocky', 'Tender today', 'Determined', 'Grateful'];
  var HOOK_IDEAS = ['"Stop scrolling — in the next 10 minutes I\'ll show you [outcome]."', '"If you\'ve ever struggled with [pain], this LIVE is for you."', '"I wasn\'t going to share this, but…"', '"Comment [word] and I\'ll [give/show] you [thing]."', '"Here\'s the mistake almost everyone makes with [topic]…"', '"By the end of this LIVE you\'ll know exactly how to [result]."', '"New here? Drop where you\'re watching from and I\'ll say hi."', '"I\'m doing something I\'ve never done on LIVE before…"', '"Would you rather [A] or [B]? Comment now."', '"Stick around — I\'m dropping [surprise] at the end."'];
  var SCRIPT_TIPS = ['Open with your hook in the first 10 seconds — energy + eye contact.', 'Say your name + today\'s ONE promise (your Room Promise).', 'Invite new viewers to comment where they\'re watching from.', 'Tie every segment back to your hook — one clear thread.', 'Drop an engagement prompt every few minutes ("Drop a 1", "A or B?").', 'Re-introduce yourself + the promise as new people join.', 'Signpost the payoff: "stick around, at the end I\'ll…"', 'Close with one clear call-to-action — a single next step.'];
  function listPop(title, items) {
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop'; root.appendChild(pop);
    pop.innerHTML = '<div class="osx-cal-pop-in osx-ns"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button><div class="osx-ns-h">' + esc(title) + '</div>' + items.map(function (t) { return '<div class="osx-tip-item">' + esc(t) + '</div>'; }).join('') + '<button class="osx-cele-x" type="button" style="margin-top:12px;">Got it 🔥</button></div>';
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-cele-x').addEventListener('click', close);
  }
  function openHookIdeas(liveId) {
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop'; root.appendChild(pop);
    pop.innerHTML = '<div class="osx-cal-pop-in osx-ns"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button><div class="osx-ns-h">💡 Hook ideas</div><div class="osx-ns-sub">Tap one to drop it into your hook — then make it yours.</div>' + HOOK_IDEAS.map(function (t, i) { return '<button type="button" class="osx-tip-item osx-tip-pick" data-pick="' + i + '">' + esc(t) + '</button>'; }).join('') + '<button class="osx-cele-x" type="button" style="margin-top:12px;">Close</button></div>';
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-cele-x').addEventListener('click', close);
    pop.querySelectorAll('[data-pick]').forEach(function (b) { b.addEventListener('click', function () { var l = liveObj(liveId); if (l) { l.hook = HOOK_IDEAS[+b.getAttribute('data-pick')]; save(); render(); } close(); }); });
  }
  function openScriptTips() { listPop('💡 Opening-script tips', SCRIPT_TIPS); }
  function applyStatColor(l, plat, stat) {
    var g = ((l.goals || {})[plat] || {})[stat], r = ((l.results || {})[plat] || {})[stat];
    var el = host.querySelector('[data-lr="' + l.id + '|' + plat + '|' + stat + '"]'); if (!el) return;
    var lab = el.closest('.osx-lv-f'); if (!lab) return;
    lab.classList.remove('met', 'miss');
    if (g !== undefined && g !== '' && r !== undefined && r !== '') lab.classList.add(num(r) >= num(g) ? 'met' : 'miss');
  }
  function selectedIds() { return Object.keys(selected).filter(function (id) { return selected[id]; }); }
  function dupeOf(l) { var c = JSON.parse(JSON.stringify(l)); c.id = uid(); c.date = ''; c.hour = ''; c.platforms = []; c.done = false; c.results = {}; c.win = ''; c.blocker = ''; c.action = ''; c.mood = ''; c.moodNote = ''; c.reflect = {}; c.archived = false; c.deleted = false; c._dupe = true; return c; }
  function makeTemplate(l) { var c = JSON.parse(JSON.stringify(l)); c.id = uid(); c.date = ''; c.hour = ''; c.results = {}; c.done = false; c.win = ''; c.blocker = ''; c.action = ''; c.mood = ''; c.moodNote = ''; c.reflect = {}; c.archived = false; c.deleted = false; delete c._dupe; return c; }
  function liveCountdown(l) {
    var d = daysTo(l.date), t = liveTimeStr(l), soon = (d !== null && d >= 0 && d <= 1);
    var big = (d === null) ? 'Set a date' : (d > 1 ? d + ' days' : d === 1 ? 'Tomorrow' : d === 0 ? 'Today!' : liveDateLabel(l));
    return '<div class="osx-lv-cd' + (soon ? ' soon' : '') + '"><span class="osx-lv-cd-l">Countdown to LIVE</span><b>' + esc(big) + '</b><span class="osx-lv-cd-d">' + (l.date ? esc(liveDateLabel(l)) + (t ? ' · ' + esc(t) : '') : 'no date yet') + '</span></div>';
  }
  function livePlats(l) { var p = l.platforms || (l.platform ? [l.platform] : []); return p.length ? p : ['TikTok']; }
  function platPill(name, other) { var lbl = (name === 'Other' && other) ? other : name; return '<span class="osx-plat-pill">' + (PLAT_META[name] || '🔗') + ' ' + esc(lbl) + '</span>'; }
  function liveTimeStr(l) { return (l.hour ? l.hour + ':' + (l.min || '00') + ' ' + (l.ampm || '') + ' ' + (l.tz || '') : (l.time || '')).trim(); }
  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n; }
  function liveObj(id) { return data.lives.filter(function (l) { return l.id === id; })[0]; }
  function liveDateLabel(l) { if (!l.date) return 'Unscheduled'; var p = l.date.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function liveFollowers(l) { var r = l.results || {}; var ks = Object.keys(r); if (ks.length) { var s = 0; ks.forEach(function (p) { s += num((r[p] || {}).followers); }); return s; } return num((l.s || {}).followers); }
  function livesTrend() {
    var done = data.lives.filter(function (l) { return l.done; });
    var totalF = 0, withF = 0; done.forEach(function (l) { var f = liveFollowers(l); totalF += f; if (f > 0) withF++; });
    var byTime = {}; done.forEach(function (l) { var t = liveTimeStr(l); if (!t) return; (byTime[t] = byTime[t] || []).push(liveFollowers(l)); });
    var best = '—', ba = -1; Object.keys(byTime).forEach(function (t) { var a = byTime[t], m = a.reduce(function (x, y) { return x + y; }, 0) / a.length; if (m > ba) { ba = m; best = t; } });
    return { count: done.length, totalF: totalF, avgF: withF ? Math.round(totalF / withF) : 0, best: best };
  }
  function sparkline() {
    var done = data.lives.filter(function (l) { return l.done; }).slice().sort(function (a, b) { return (a.date || '').localeCompare(b.date || ''); });
    var vals = done.map(liveFollowers); if (vals.length < 2) return '';
    var max = Math.max.apply(null, vals) || 1, w = 200, h = 40, step = w / (vals.length - 1);
    var pts = vals.map(function (v, i) { return (i * step).toFixed(1) + ',' + (h - (v / max) * (h - 4) - 2).toFixed(1); }).join(' ');
    return '<svg class="osx-lv-spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="var(--gold-bright)" stroke-width="2" stroke-linejoin="round"/></svg>';
  }
  function dupeReady(l) { return l.date && l.hour && (l.platforms || []).length; }
  function statGrid(l, plat, kind) {
    var goals = (l.goals || {})[plat] || {}, res = (l.results || {})[plat] || {}, map = kind === 'goal' ? goals : res, attr = kind === 'goal' ? 'data-lg' : 'data-lr';
    return '<div class="osx-lv-grid">' + LIVE_STATS.map(function (s) {
      var cls = '';
      if (kind === 'result') { var gv = goals[s[0]], rv = map[s[0]]; if (gv !== undefined && gv !== '' && rv !== undefined && rv !== '') cls = (num(rv) >= num(gv)) ? ' met' : ' miss'; }
      return '<label class="osx-lv-f' + cls + '"><span>' + esc(s[1]) + '</span><input class="osx-pl-in" ' + attr + '="' + esc(l.id) + '|' + plat + '|' + s[0] + '" value="' + esc(map[s[0]] || '') + '" inputmode="numeric" maxlength="12"></label>';
    }).join('') + '</div>';
  }
  var REMIND_OFFS = [['start', 'At start', 0], ['15m', '15 min before', 900], ['1h', '1 hr before', 3600], ['3h', '3 hrs before', 10800], ['1d', '1 day before', 86400], ['3d', '3 days before', 259200], ['1w', '1 week before', 604800]];
  function remItem(kind, id) { var a = kind === 'live' ? data.lives : kind === 'goal' ? data.goals : data.products; return a.filter(function (x) { return x.id === id; })[0]; }
  function itemStart(kind, item) {
    var iso = kind === 'live' ? item.date : kind === 'goal' ? item.w : item.launch;
    if (!iso) return null;
    var p = iso.split('-'), h = 9, mi = 0;
    if (kind === 'live' && item.hour) { h = (+item.hour) % 12; if ((item.ampm || 'PM') === 'PM') h += 12; mi = +(item.min || 0); }
    return new Date(+p[0], +p[1] - 1, +p[2], h, mi, 0, 0);
  }
  var _remSync;
  function rebuildReminders() {
    var out = [];
    function push(kind, item) {
      var base = itemStart(kind, item); if (!base) return;
      (item.reminders || []).forEach(function (k) { var o = REMIND_OFFS.filter(function (x) { return x[0] === k; })[0]; if (!o) return; out.push({ nid: 'rem-' + kind + '-' + item.id + '-' + k, id: item.id, kind: kind, title: item.title || item.name || item.topic || ('Your ' + kind), label: o[1], fireAt: base.getTime() - o[2] * 1000, startAt: base.getTime() }); });
    }
    data.lives.forEach(function (l) { if (!l.deleted && !l.done) push('live', l); });
    data.goals.forEach(function (g) { push('goal', g); });
    data.products.forEach(function (p) { if (p.status !== 'live') push('product', p); });
    try { localStorage.setItem('p2p_reminders', JSON.stringify(out)); } catch (e) {}
    clearTimeout(_remSync); _remSync = setTimeout(function () { try { fetch('/apps/p2p/reminders', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ items: out }) }).catch(function () {}); } catch (e) {} }, 1500);
  }
  function remindRow(kind, id, item) {
    var set = item.reminders || [];
    return '<div class="osx-rem"><div class="osx-pl-flabel">🔔 Remind me <span>ring my bell before this — pick any</span></div><div class="osx-rem-chips">' +
      REMIND_OFFS.map(function (o) { var on = set.indexOf(o[0]) > -1; return '<button type="button" class="osx-rem-chip' + (on ? ' on' : '') + '" data-remind="' + kind + '|' + esc(id) + '|' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
  }
  function liveCard(l) {
    var open = !!expanded['L' + l.id], plats = livePlats(l);
    var head = '<div class="osx-lv-h" data-ltoggle="' + esc(l.id) + '"><input type="checkbox" class="osx-lv-selbox" data-lvsel="' + esc(l.id) + '"' + (selected[l.id] ? ' checked' : '') + ' aria-label="Select"><span class="osx-lv-plats">' + plats.map(function (p) { return platPill(p, l.otherPlat); }).join('') + '</span>' +
      '<span class="osx-lv-hb"><b class="osx-lv-title">' + esc(l.title || l.topic || 'Untitled live') + '</b>' + (l.done ? '<span class="osx-lv-hm">✓ Logged · +' + liveFollowers(l) + ' followers</span>' : '') + '</span>' +
      liveCountdown(l) + '</div>';
    if (!open) return '<div class="osx-lv-card' + (l._dupe ? ' osx-dupe' : '') + '">' + head + (l._dupe ? '<div class="osx-lv-dupebadge">⚠ Duplicate — update date, time &amp; platform to save</div>' : '') + '</div>';
    var req = l._dupe ? ' osx-req' : '';
    function selOpts(arr, cur) { return arr.map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + o + '</option>'; }).join(''); }
    var platChips = PLATFORMS.map(function (p) { var on = (l.platforms || []).indexOf(p) > -1; return '<button type="button" class="osx-plat-chip' + (on ? ' on' : '') + '" data-lplat="' + esc(l.id) + '|' + p + '">' + (PLAT_META[p] || '') + ' ' + p + '</button>'; }).join('');
    var otherIn = (l.platforms || []).indexOf('Other') > -1 ? '<input class="osx-pl-in" data-lf="' + esc(l.id) + '|otherPlat" value="' + esc(l.otherPlat || '') + '" placeholder="Name the platform" maxlength="30" style="margin-top:8px;">' : '';
    var timeRow = '<div class="osx-lv-grid">' +
      '<label class="osx-lv-f"><span>Date</span><input type="date" class="osx-pl-date' + req + '" data-lf="' + esc(l.id) + '|date" value="' + esc(l.date || '') + '"></label>' +
      '<label class="osx-lv-f"><span>Hour</span><select class="osx-pl-date' + req + '" data-lf="' + esc(l.id) + '|hour"><option value="">—</option>' + selOpts(HRS, l.hour) + '</select></label>' +
      '<label class="osx-lv-f"><span>Min</span><select class="osx-pl-date" data-lf="' + esc(l.id) + '|min">' + selOpts(MINS, l.min || '00') + '</select></label>' +
      '<label class="osx-lv-f"><span>AM/PM</span><select class="osx-pl-date" data-lf="' + esc(l.id) + '|ampm">' + selOpts(['AM', 'PM'], l.ampm || 'PM') + '</select></label>' +
      '<label class="osx-lv-f"><span>Zone</span><select class="osx-pl-date" data-lf="' + esc(l.id) + '|tz">' + selOpts(TZS, l.tz || 'ET') + '</select></label></div>';
    var pitchRow = '<div class="osx-lv-grid"><label class="osx-lv-f"><span>What I\'m pitching</span><select class="osx-pl-date" data-lf="' + esc(l.id) + '|pitch"><option value="">Choose…</option>' + PITCH_ITEMS.map(function (p) { return '<option' + (p === l.pitch ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '<option value="Other"' + (l.pitch === 'Other' ? ' selected' : '') + '>Other…</option></select>' + (l.pitch === 'Other' ? '<input class="osx-pl-in" data-lf="' + esc(l.id) + '|pitchOther" value="' + esc(l.pitchOther || '') + '" placeholder="Type your pitch" maxlength="80" style="margin-top:6px;">' : '') + '</label>' +
      '<label class="osx-lv-f"><span>Room Promise</span><textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|roomPromise" placeholder="When someone enters this LIVE, what will they feel, learn, or get to be part of?" maxlength="240">' + esc(l.roomPromise || '') + '</textarea></label></div>';
    var hook = '<div class="osx-pl-flabel">My hook <button type="button" class="osx-idea-link" data-hookideas="' + esc(l.id) + '">💡 ideas</button></div><textarea class="osx-pl-ta osx-lv-hookbox" rows="2" data-lf="' + esc(l.id) + '|hook" placeholder="Your first 10 seconds that stop the scroll — the line that makes someone stay. Tip: promise a payoff, tease a surprise, or ask a question." maxlength="240">' + esc(l.hook || '') + '</textarea>';
    var mktBtn = '<a class="osx-lv-mkt" href="/pages/marketing-haus" target="_blank" rel="noopener">🎨 Build my hook, script &amp; promo in Marketing Haus →</a><div class="osx-lv-mktnote">Heads up: this opens Marketing Haus in a new tab — everything you\'ve entered here is saved. 💾</div>';
    var script = '<div class="osx-pl-flabel">Opening script <button type="button" class="osx-idea-link" data-scripttips>💡 tips</button></div><textarea class="osx-pl-ta" rows="3" data-lf="' + esc(l.id) + '|script" placeholder="Hi everyone, welcome in. I\'m [name], and today we\'re talking about [topic]. If you\'re new, comment where you\'re watching from so I can say hello." maxlength="400">' + esc(l.script || '') + '</textarea>';
    var prompts = l.prompts || ['', '', '', '', ''];
    var promptBox = '<div class="osx-pl-flabel">Engagement prompts <span>up to 5 — "Drop a 1 if you agree", "A or B?"</span></div>' + [0, 1, 2, 3, 4].map(function (i) { return '<input class="osx-pl-in osx-lv-prompt" data-lprompt="' + esc(l.id) + '|' + i + '" value="' + esc(prompts[i] || '') + '" placeholder="Prompt ' + (i + 1) + '" maxlength="120">'; }).join('');
    var goalsBlock = '<div class="osx-pl-flabel" style="margin-top:16px;">🎯 My goals for this live</div><textarea class="osx-pl-ta osx-lv-hookbox" rows="2" data-lf="' + esc(l.id) + '|goalNote" placeholder="What would make this a win? (connection, momentum, sales — not just the numbers). Update this every live." maxlength="240">' + esc(l.goalNote || '') + '</textarea>' +
      plats.map(function (p) { return '<div class="osx-lv-platblk"><div class="osx-lv-platlbl">' + platPill(p, l.otherPlat) + ' goals</div>' + statGrid(l, p, 'goal') + '</div>'; }).join('');
    var postBlock = '<div class="osx-lv-post"><div class="osx-lv-posth">✅ Post-live check-in — how did it go?</div><div class="osx-lv-hint2">Boxes turn <b class="g">green</b> when you hit a goal, <b class="y">yellow</b> when there\'s room to grow (no goal set = no color).</div>' +
      plats.map(function (p) { return '<div class="osx-lv-platblk"><div class="osx-lv-platlbl">' + platPill(p, l.otherPlat) + ' results</div>' + statGrid(l, p, 'result') + '<textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|reflect_' + p + '" placeholder="Where did I fall short of a goal — and what can I learn, grow, or thrive from?" maxlength="300">' + esc((l.reflect || {})[p] || '') + '</textarea></div>'; }).join('') +
      '<div class="osx-lv-grid3"><label class="osx-lv-f"><span>🏆 Win — what improved?</span><textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|win" placeholder="e.g. My opening was smoother and I hit my follower goal" maxlength="240">' + esc(l.win || '') + '</textarea></label>' +
        '<label class="osx-lv-f"><span>🧱 Blocker — biggest constraint</span><textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|blocker" placeholder="e.g. Viewers dropped off in the first 5 minutes" maxlength="240">' + esc(l.blocker || '') + '</textarea></label>' +
        '<label class="osx-lv-f"><span>⚡ Action — one thing next live</span><textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|action" placeholder="e.g. Go live 15 min earlier to build the room first" maxlength="240">' + esc(l.action || '') + '</textarea></label></div>' +
      '<div class="osx-lv-heart"><div class="osx-lv-posth" style="color:var(--gold-bright);">💛 Purpose — Mindset &amp; Heart Check</div><div class="osx-lv-hint2">How did you feel? Your worth isn\'t the numbers — it\'s that you showed up. 🐑</div><div class="osx-lv-moods">' + MOODS.map(function (m, mi) { return '<button type="button" class="osx-lv-mood' + (l.mood === m ? ' on' : '') + '" data-lmood="' + esc(l.id) + '|' + m + '" title="' + esc(MOOD_LABELS[mi]) + '">' + m + '</button>'; }).join('') + '</div><textarea class="osx-pl-ta" rows="2" data-lf="' + esc(l.id) + '|moodNote" placeholder="A word to your future self…" maxlength="240">' + esc(l.moodNote || '') + '</textarea></div>' +
      '<button class="osx-lv-donebtn' + (l.done ? ' on' : '') + '" data-ldone="' + esc(l.id) + '">' + (l.done ? '✓ Logged — tap to reopen' : 'Save results') + '</button></div>';
    var dupWarn = l._dupe ? '<div class="osx-pl-warn">⚠ Duplicated live — change the highlighted <b>Date</b>, <b>Time</b> and <b>Platform</b> before it saves.</div>' : '';
    return '<div class="osx-lv-card open">' + head + '<div class="osx-lv-body">' +
      '<div class="osx-lv-top"><button class="osx-lv-duppill" data-ldupe="' + esc(l.id) + '">⧉ Duplicate</button></div>' +
      '<div class="osx-pl-flabel">Name this live</div><input class="osx-pl-in osx-lv-titlein" data-lf="' + esc(l.id) + '|title" value="' + esc(l.title || '') + '" placeholder="e.g. Tuesday Planner Party" maxlength="80">' + dupWarn +
      '<div class="osx-pl-flabel">Platforms <span>pick one or more — going live on YT + TikTok at once? both show up</span></div><div class="osx-plat-chips' + req + '">' + platChips + '</div>' + otherIn +
      timeRow + remindRow('live', l.id, l) + pitchRow + hook + mktBtn + script + promptBox + goalsBlock + postBlock +
      '<div class="osx-lv-del"><button data-lvdel="' + esc(l.id) + '">Delete live</button></div></div></div>';
  }
  function vaultCard(l, kind) {
    var acts = kind === 'archive' ? '<button data-lvrestore="' + esc(l.id) + '">↩ Restore</button><button data-lvtrash="' + esc(l.id) + '">🗑️ Delete</button>'
      : kind === 'trash' ? '<button data-lvrestore="' + esc(l.id) + '">↩ Restore</button><button data-lvpurge="' + esc(l.id) + '">Delete forever</button>' : '';
    return '<div class="osx-lv-card"><div class="osx-lv-h"><span class="osx-lv-plats">' + livePlats(l).map(function (p) { return platPill(p, l.otherPlat); }).join('') + '</span>' +
      '<span class="osx-lv-hb"><b class="osx-lv-title">' + esc(l.title || l.topic || 'Untitled live') + '</b><span class="osx-lv-hm">' + esc(liveDateLabel(l)) + (l.done ? ' · +' + liveFollowers(l) + ' followers' : '') + '</span></span>' +
      '<span class="osx-lv-vaultacts">' + acts + '</span></div></div>';
  }
  function vaultListHTML(kind) {
    var rows = data.lives.filter(function (l) { return kind === 'archive' ? (l.archived && !l.deleted) : l.deleted; });
    rows.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    if (!rows.length) return '<div class="osx-pl-empty">' + (kind === 'archive' ? 'Nothing archived yet — past lives land here automatically.' : 'Trash is empty.') + '</div>';
    return rows.map(function (l) { return vaultCard(l, kind); }).join('');
  }
  function templatesHTML() {
    if (!data.templates.length) return '<div class="osx-pl-empty">No templates yet — select a live and choose "Make template" to save its setup for reuse.</div>';
    return data.templates.map(function (tp) {
      return '<div class="osx-lv-card"><div class="osx-lv-h"><span class="osx-lv-plats">' + livePlats(tp).map(function (p) { return platPill(p, tp.otherPlat); }).join('') + '</span>' +
        '<span class="osx-lv-hb"><b class="osx-lv-title">' + esc(tp.title || tp.topic || 'Template') + '</b><span class="osx-lv-hm">' + esc(tp.pitch || 'Live template') + '</span></span>' +
        '<span class="osx-lv-vaultacts"><button data-tpuse="' + esc(tp.id) + '">＋ Use</button><button data-tpdel="' + esc(tp.id) + '">Delete</button></span></div></div>';
    }).join('');
  }
  function livesHTML() {
    var counts = { lives: data.lives.filter(function (l) { return !l.archived && !l.deleted; }).length, templates: data.templates.length, archive: data.lives.filter(function (l) { return l.archived && !l.deleted; }).length, trash: data.lives.filter(function (l) { return l.deleted; }).length };
    var nav = '<div class="osx-lv-vaultnav">' + [['lives', '📡 Lives'], ['templates', '📋 Templates'], ['archive', '🗄️ Archive'], ['trash', '🗑️ Trash']].map(function (t) { return '<button class="osx-lv-vaultb' + (livesTab === t[0] ? ' on' : '') + '" data-livestab="' + t[0] + '">' + t[1] + ' <b>' + counts[t[0]] + '</b></button>'; }).join('') + '</div>';
    if (livesTab === 'templates') return nav + templatesHTML();
    if (livesTab === 'archive') return nav + vaultListHTML('archive');
    if (livesTab === 'trash') return nav + vaultListHTML('trash');
    var t = livesTrend(), sp = sparkline();
    var trend = t.count ? '<div class="osx-lv-trend">' +
      '<div class="osx-lv-stat"><b>' + t.count + '</b><span>lives logged</span></div>' +
      '<div class="osx-lv-stat"><b>+' + t.totalF + '</b><span>new followers</span></div>' +
      '<div class="osx-lv-stat"><b>+' + t.avgF + '</b><span>avg / live</span></div>' +
      '<div class="osx-lv-stat"><b>' + esc(t.best) + '</b><span>best time</span></div>' +
      (sp ? '<div class="osx-lv-sparkwrap"><span>followers trend</span>' + sp + '</div>' : '') + '</div>' : '';
    var active2 = data.lives.filter(function (l) { return !l.archived && !l.deleted; });
    var up = active2.filter(function (l) { return !l.done; }), past = active2.filter(function (l) { return l.done; });
    up.sort(function (a, b) { return (a.date || '~').localeCompare(b.date || '~'); });
    past.sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var sel = Object.keys(selected).filter(function (id) { return selected[id]; }).length;
    var bulk = '<div class="osx-lv-uprow"><span class="osx-pl-sech" style="margin:0;">📡 Upcoming</span>' + (sel ? '<span class="osx-lv-selcount">' + sel + ' selected</span>' : '') +
      '<span class="osx-lv-bulkmenu"><button class="osx-menu-dots" data-lvbulk' + (sel ? '' : ' disabled') + '>⋯</button><span class="osx-menu-pop" hidden><button type="button" data-bulk="duplicate">⧉ Duplicate</button><button type="button" data-bulk="template">📋 Make template</button><button type="button" data-bulk="archive">🗄️ Archive</button><button type="button" data-bulk="delete">🗑️ Delete</button></span></span></div>';
    var list = (up.length ? bulk + up.map(liveCard).join('') : bulk) +
               (past.length ? '<div class="osx-pl-sech" style="margin-top:16px;">✓ Recent lives</div>' + past.map(liveCard).join('') : '');
    if (!active2.length) list = bulk + '<div class="osx-pl-empty">Plan your first live — script the hook, set a goal, then log how it went. The trends build themselves.</div>';
    var tools = '<div class="osx-lv-tools"><button class="osx-lv-tool" data-northstar>⭐ North Star</button><button class="osx-lv-tool anchor" data-beanchored>⚓ Be Anchored</button></div>';
    return nav + tools + trend + '<button class="osx-pl-newgoal" data-newlive>＋ Plan a live</button>' + list;
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
  var SNAP_STATS = [['followers', 'Total followers'], ['email', 'Email subscribers'], ['likes', 'Total likes'], ['diamonds', 'Diamonds'], ['visits', 'Site / shop visits'], ['engagement', 'Engagement %'], ['sold', 'Products sold'], ['testimonials', 'Testimonials'], ['revenue', 'Revenue ($)']];
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

  /* ---------- products (asset tracker for product creators) ---------- */
  var PROD_STATUS = [['idea', '💭 Idea'], ['building', '🔨 Building'], ['live', '🟢 Live'], ['retired', '· Retired']];
  var ROOTED_STEPS_P = ['R · Reach — warm up the right people', 'O · Open — build anticipation', 'O · Offer — open the doors', 'T · Trigger — proof + urgency', 'E · Escalate — the close', 'D · Deepen — after-launch care'];
  function prodObj(id) { return data.products.filter(function (p) { return p.id === id; })[0]; }
  function prodTrend() { var live = 0, rev = 0, sold = 0, best = '—', bs = -1; data.products.forEach(function (p) { if (p.status === 'live') live++; rev += num(p.revenue); sold += num(p.sold); if (num(p.revenue) > bs) { bs = num(p.revenue); best = p.name || '—'; } }); return { total: data.products.length, live: live, rev: rev, sold: sold, best: best }; }
  function productCard(p) {
    var open = !!expanded['PR' + p.id], st = PROD_STATUS.filter(function (s) { return s[0] === (p.status || 'idea'); })[0];
    var head = '<div class="osx-lv-h" data-prtoggle="' + esc(p.id) + '"><span class="osx-pr-status s-' + (p.status || 'idea') + '">' + st[1] + '</span><span class="osx-lv-hb"><b>' + esc(p.name || 'Untitled product') + '</b><span class="osx-lv-hm">' + (p.price ? '$' + esc(p.price) + ' · ' : '') + num(p.sold) + ' sold · $' + num(p.revenue) + '</span></span></div>';
    if (!open) return '<div class="osx-lv-card">' + head + '</div>';
    var body = '<div class="osx-lv-grid">' +
      '<label class="osx-lv-f"><span>Product name</span><input class="osx-pl-in" data-prf="' + esc(p.id) + '|name" value="' + esc(p.name || '') + '" maxlength="80"></label>' +
      '<label class="osx-lv-f"><span>Type</span><input class="osx-pl-in" data-prf="' + esc(p.id) + '|type" value="' + esc(p.type || '') + '" placeholder="e.g. Digital planner, Course" maxlength="60"></label>' +
      '<label class="osx-lv-f"><span>Price ($)</span><input class="osx-pl-in" data-prf="' + esc(p.id) + '|price" value="' + esc(p.price || '') + '" inputmode="numeric" maxlength="10"></label>' +
      '<label class="osx-lv-f"><span>Status</span><select class="osx-pl-date" data-prf="' + esc(p.id) + '|status">' + PROD_STATUS.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === (p.status || 'idea') ? ' selected' : '') + '>' + s[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="osx-lv-f"><span>Launch date</span><input type="date" class="osx-pl-date" data-prf="' + esc(p.id) + '|launch" value="' + esc(p.launch || '') + '"></label>' +
      '<label class="osx-lv-f"><span>Units sold</span><input class="osx-pl-in" data-prf="' + esc(p.id) + '|sold" value="' + esc(p.sold || '') + '" inputmode="numeric" maxlength="10"></label>' +
      '<label class="osx-lv-f"><span>Revenue ($)</span><input class="osx-pl-in" data-prf="' + esc(p.id) + '|revenue" value="' + esc(p.revenue || '') + '" inputmode="numeric" maxlength="12"></label></div>' +
      remindRow('product', p.id, p) +
      '<button class="osx-lv-mkt" data-prlaunch="' + esc(p.id) + '" style="background:none;cursor:pointer;">🚀 Plan this launch with ROOTED →</button>' +
      '<div class="osx-lv-del"><button data-prdel="' + esc(p.id) + '">Delete product</button></div>';
    return '<div class="osx-lv-card open">' + head + '<div class="osx-lv-body">' + body + '</div></div>';
  }
  function productsHTML() {
    var t = prodTrend();
    var trend = t.total ? '<div class="osx-lv-trend"><div class="osx-lv-stat"><b>' + t.total + '</b><span>products</span></div><div class="osx-lv-stat"><b>' + t.live + '</b><span>live</span></div><div class="osx-lv-stat"><b>$' + t.rev + '</b><span>revenue</span></div><div class="osx-lv-stat"><b>' + t.sold + '</b><span>units sold</span></div></div>' : '';
    var list = data.products.length ? data.products.map(productCard).join('') : '<div class="osx-pl-empty">Add your products/offers — track them 💭 idea → 🔨 building → 🟢 live, log sales, and plan each launch with ROOTED.</div>';
    return trend + '<button class="osx-pl-newgoal" data-newprod>＋ Add a product</button>' + list;
  }

  /* ---------- gamification: milestones + celebrations ---------- */
  var MILESTONES = [
    ['first_goal', 'First goal set', '🎯', function () { return data.goals.some(function (g) { return (g.roadmap && g.roadmap.length) || g.w; }); }],
    ['first_road', 'First step complete', '🧭', function () { return data.goals.some(function (g) { return (g.roadmap || []).some(function (x) { return x.pct >= 100; }); }); }],
    ['goal_done', 'A goal fully reached!', '🏆', function () { return data.goals.some(function (g) { var r = g.roadmap || []; return r.length && r.every(function (x) { return x.pct >= 100; }); }); }],
    ['launched', 'Launched — you hit 🚀 Rooted', '🚀', function () { return data.goals.some(function (g) { return g.stage === 'rooted' || g.stage === 'evergreen'; }); }],
    ['evergreen', 'Evergreen — sustaining a launch', '🌲', function () { return data.goals.some(function (g) { return g.stage === 'evergreen'; }); }],
    ['first_live', 'First live logged', '📡', function () { return data.lives.some(function (l) { return l.done; }); }],
    ['ten_lives', '10 lives — you show up!', '🎙️', function () { return data.lives.filter(function (l) { return l.done; }).length >= 10; }],
    ['first_post', 'First post logged', '📝', function () { return data.posts.some(function (p) { return p.done; }); }],
    ['fifty_posts', '50 posts — consistency!', '✍️', function () { return data.posts.filter(function (p) { return p.done; }).length >= 50; }],
    ['first_idea', 'First idea captured', '💡', function () { return data.ideas.length >= 1; }],
    ['product_live', 'A product went LIVE! 🟢', '🛍️', function () { return data.products.some(function (p) { return p.status === 'live'; }); }],
    ['first_sale', 'First sale 💰', '💰', function () { return data.snaps.some(function (s) { return num(s.revenue) > 0 || num(s.sold) > 0; }) || data.lives.concat(data.posts).some(function (x) { return num((x.s || {}).sales) > 0; }); }],
    ['hundred', '100 followers', '⭐', function () { return data.snaps.some(function (s) { return num(s.followers) >= 100; }); }],
    ['k_followers', '1,000 followers 🌟', '🌟', function () { return data.snaps.some(function (s) { return num(s.followers) >= 1000; }); }],
    ['ten_k', '10,000 followers!', '👑', function () { return data.snaps.some(function (s) { return num(s.followers) >= 10000; }); }],
    ['week_perfect', 'A perfect week — 100%', '📅', function () { return (data.week.top.length + data.week.todo.length) > 0 && periodPct('week') >= 100; }]
  ];
  function confetti() {
    var c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3400;'; document.body.appendChild(c);
    var ctx = c.getContext('2d'), W = c.width = window.innerWidth, H = c.height = window.innerHeight, cols = ['#f4c534', '#e0457b', '#39c5c0', '#8f6fd6', '#f4e2a6'], P = [];
    for (var i = 0; i < 150; i++) P.push({ x: W / 2 + (Math.random() - .5) * 200, y: H / 3, vx: (Math.random() - .5) * 11, vy: Math.random() * -12 - 4, r: Math.random() * 7 + 3, c: cols[i % cols.length], a: 1, rot: Math.random() * 6 });
    var t0 = Date.now(); (function fr() { ctx.clearRect(0, 0, W, H); P.forEach(function (p) { p.vy += .3; p.x += p.vx; p.y += p.vy; p.rot += .16; p.a -= .008; ctx.save(); ctx.globalAlpha = Math.max(0, p.a); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); ctx.restore(); }); if (Date.now() - t0 < 2600) requestAnimationFrame(fr); else c.remove(); })();
  }
  var celebrateQueue = [];
  function celebrateNext() {
    if (!celebrateQueue.length) return; var m = celebrateQueue.shift();
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    var kicker = (typeof m[3] === 'string') ? m[3] : 'Milestone unlocked!';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-cele"><div class="osx-cele-emoji">' + m[2] + '</div><div class="osx-cele-k">' + esc(kicker) + '</div><div class="osx-cele-l">' + esc(m[1]) + '</div><button class="osx-cele-x" type="button">Keep going 🔥</button></div>';
    root.appendChild(pop); confetti();
    function close() { pop.remove(); setTimeout(celebrateNext, 200); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cele-x').addEventListener('click', close);
  }
  function checkMilestones() {
    var fresh = [];
    MILESTONES.forEach(function (m) { if (!data.milestones[m[0]]) { var ok = false; try { ok = m[3](); } catch (e) {} if (ok) { data.milestones[m[0]] = Date.now(); if (!milestoneBaseline) fresh.push(m); } } });
    if (fresh.length || milestoneBaseline) save();
    if (fresh.length) { var wasEmpty = !celebrateQueue.length; celebrateQueue = celebrateQueue.concat(fresh); if (wasEmpty) celebrateNext(); }
    milestoneBaseline = false;
  }
  var ENCOURAGE = [
    'You showed up — that\'s the whole game. 🔥', 'Reps build rooms. Keep going.', 'Consistency is your superpower.',
    'Every live makes the next one easier.', 'The flock is watching you rise. 🐑', 'Proof, not promises — look at you go.',
    'You\'re not dabbling, you\'re building.', 'Momentum loves the ones who return.', 'Born an original — and it shows.',
    'Small reps, massive compounding.', 'You did the hard part: you came back.', 'This is what "rooted" looks like. 🌱',
    'Your future self is cheering right now.', 'Showing up scared still counts. 💪', 'One more live than yesterday. That\'s growth.',
    'You\'re coaching your own confidence.', 'The algorithm rewards the relentless.', 'Keep watering it — the bloom is coming.',
    'You\'re turning nervous into natural.', 'Purpose over perfection, always. 🖤'
  ];
  function checkLiveCele() {
    var n = data.lives.filter(function (l) { return l.done; }).length;
    if (data.liveCele === undefined) { data.liveCele = n; save(); return; }   // silent baseline
    if (n <= data.liveCele) return;
    var t = -1; for (var k = data.liveCele + 1; k <= n; k++) { if (k === 1 || k === 5 || k === 10 || (k > 10 && k % 10 === 0)) t = k; }
    data.liveCele = n; save();
    if (t > -1) { var wasEmpty = !celebrateQueue.length; celebrateQueue.push(['live' + t, ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)], '📡', (t === 1 ? 'First live logged!' : t + ' lives logged!')]); if (wasEmpty) celebrateNext(); }
  }
  function openInfo() {
    var earned = MILESTONES.filter(function (m) { return data.milestones[m[0]]; }).length;
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-info"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<div class="osx-info-h">🏅 How the wins work</div>' +
      '<p class="osx-info-p"><b>Milestones</b> unlock automatically when you actually <b>do the work</b> — set a real goal, complete a roadmap step, log a live or a post <em>with results</em>, take a product live, hit follower marks. You\'ve earned <b>' + earned + ' of ' + MILESTONES.length + '</b> so far. Each one throws confetti. 🎉</p>' +
      '<p class="osx-info-p"><b>Live celebrations</b> fire when you come back and <b>log your results</b> — your 1st, 5th, 10th, then every 10 — each with a little encouragement.</p>' +
      '<p class="osx-info-p"><b>Goal stages</b> (not the GROWS formula — that\'s how you <em>build</em> the goal): <b>🌱 Planning</b> → you\'re shaping it · <b>🚀 Launching</b> → doors open, run ROOTED · <b>🌲 Evergreen</b> → it\'s live and you\'re sustaining it. Just a status you set as the goal grows up.</p>' +
      '<button class="osx-cele-x" type="button">Got it 🔥</button></div>';
    root.appendChild(pop);
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-cele-x').addEventListener('click', close);
  }
  var NORTHSTAR = ['Fixed LIVE days & start times', 'No long gaps between sessions', 'Lighting, camera angle, background & sound ready', 'Clear content positioning & audience promise', 'A simple incentive goal for the first 15 days', 'A repeatable opening script ready to go', 'Engagement prompts prepped ("Drop a 1", "A or B?")', 'A clear call-to-action for the room', 'Promo posted within 30 min of going live', 'A plan to reset & re-engage new joiners'];
  function openNorthStar() {
    data.northstar = data.northstar || {};
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop'; root.appendChild(pop);
    function close() { pop.remove(); }
    function draw() {
      var done = NORTHSTAR.filter(function (_, i) { return data.northstar[i]; }).length;
      pop.innerHTML = '<div class="osx-cal-pop-in osx-ns"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
        '<div class="osx-ns-h">⭐ The North Star</div><div class="osx-ns-sub">LIVE set-up checklist — a repeatable starting point for every live. <b>' + done + ' / ' + NORTHSTAR.length + '</b></div>' +
        NORTHSTAR.map(function (t, i) { return '<label class="osx-ns-item' + (data.northstar[i] ? ' on' : '') + '"><input type="checkbox" data-ns="' + i + '"' + (data.northstar[i] ? ' checked' : '') + '><span>' + esc(t) + '</span></label>'; }).join('') +
        '<button class="osx-cele-x" type="button" style="margin-top:14px;">Done</button></div>';
      pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
      pop.querySelector('.osx-cele-x').addEventListener('click', close);
      pop.querySelectorAll('[data-ns]').forEach(function (c) { c.addEventListener('change', function () { data.northstar[+c.getAttribute('data-ns')] = c.checked; save(); draw(); }); });
    }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    draw();
  }
  var GHM_URL = 'https://www.tiktok.com/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7631032554648371213';
  function openBeAnchored() {
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop'; root.appendChild(pop);
    pop.innerHTML = '<div class="osx-cal-pop-in osx-ba"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<img class="osx-ba-img" src="' + (window.P2P_BEANCHORED || '') + '" alt="The BE ANCHORED Live Method">' +
      '<div class="osx-ba-ghm"><img class="osx-ba-ghmlogo" src="' + (window.P2P_GHM || '') + '" alt="Grace Harbor Media">' +
      '<div class="osx-ba-ghmt"><b>Grace Harbor Media — Creator Network</b><span>Protect what you\'re growing. A Creator Network agency gives you support, structure and reach as you scale your LIVEs.</span>' +
      '<button class="osx-ba-apply" data-ghmapply>Apply to Grace Harbor Media →</button></div></div></div>';
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('[data-ghmapply]').addEventListener('click', openGhmDisclaimer);
  }
  function openGhmDisclaimer() {
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop'; root.appendChild(pop);
    pop.innerHTML = '<div class="osx-cal-pop-in osx-info"><div class="osx-info-h">Heads up — you\'re leaving the Haus</div>' +
      '<p class="osx-info-p">This opens an external site (TikTok\'s Creator Network form for <b>Grace Harbor Media</b>). Black Sheep Creations &amp; Inspirations is <b>not directly affiliated</b> with Grace Harbor Media — we\'re sharing it as a helpful resource.</p>' +
      '<div class="osx-info-btns"><button class="osx-info-cancel" type="button">Cancel</button><button class="osx-info-go" type="button">Continue →</button></div></div>';
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-info-cancel').addEventListener('click', close);
    pop.querySelector('.osx-info-go').addEventListener('click', function () { window.open(GHM_URL, '_blank', 'noopener'); close(); });
  }
  function milestonesStrip() {
    var earned = MILESTONES.filter(function (m) { return data.milestones[m[0]]; });
    var badges = MILESTONES.map(function (m) { return '<span class="osx-ms' + (data.milestones[m[0]] ? ' on' : '') + '" title="' + esc(m[1]) + '">' + m[2] + '</span>'; }).join('');
    return '<div class="osx-pl-sech" style="margin-top:14px;">🏅 Milestones <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:600;">' + earned.length + ' / ' + MILESTONES.length + '</span> <button class="osx-ms-info" data-msinfo>ⓘ How this works</button></div><div class="osx-ms-row">' + badges + '</div>';
  }

  /* ---------- Journal (the shared 4-tab notebook, mounted here too) ---------- */
  function jrPane(mode, store, kind, on, saveLabel, ph, titlePh) {
    return '<div class="jr-pane"' + (on ? '' : ' hidden') + ' data-jrpane="' + mode + '" data-store="' + store + '" data-kind="' + kind + '">' +
      '<div class="jr-compose"><input class="jr-title" type="text" maxlength="80" placeholder="' + esc(titlePh) + '" data-jr-title>' +
      '<textarea data-jr-text rows="4" placeholder="' + esc(ph) + '"></textarea>' +
      '<div class="jr-actions"><button class="jr-save" type="button" data-jr-save>' + saveLabel + '</button></div></div>' +
      '<div class="jr-toolbar"><input class="jr-search" type="search" placeholder="Search titles &amp; text…" data-jr-search>' +
      '<div class="jr-views"><button class="jr-view on" type="button" data-jr-view="active">Active</button><button class="jr-view" type="button" data-jr-view="archived">Archived</button><button class="jr-view" type="button" data-jr-view="trash">Trash</button></div></div>' +
      '<div class="jr-list" data-jr-list></div></div>';
  }
  function journalHTML() {
    return '<div data-planner-journal>' +
      '<div class="osx-pl-sech">📓 Journal <span style="text-transform:none;letter-spacing:0;color:var(--muted);font-weight:600;">— reflections, notes, ideas &amp; wins, shared with your Learning Journey</span></div>' +
      '<div class="jr-head" style="justify-content:flex-end;margin-bottom:6px;"><button class="jr-export-all" type="button" data-jr-export>Export everything</button></div>' +
      '<div class="jr-tabs"><button class="jr-tab on" type="button" data-jrmode="journal">Journal</button><button class="jr-tab" type="button" data-jrmode="notes">Notes</button><button class="jr-tab" type="button" data-jrmode="ideas">Ideas</button><button class="jr-tab" type="button" data-jrmode="wins">Wins</button></div>' +
      jrPane('journal', 'p2p_journal', 'reflection', true, 'Save entry', 'Reflect on what you\'re learning and building…', 'Title (optional)') +
      jrPane('notes', 'p2p_notes', 'note', false, 'Save note', 'Jot a note…', 'Title — e.g. "Spring launch campaign"') +
      jrPane('ideas', 'p2p_ideas', 'idea', false, 'Save idea', 'Capture the idea…', 'Title — e.g. "Devotional journal for new moms"') +
      jrPane('wins', 'p2p_wins', 'win', false, 'Save win', 'Big or small — a first sale, a finished course, showing up when it was hard…', 'Title (optional)') +
      '</div>';
  }
  function mountJournal() {
    if (view !== 'journal' || !window.P2PNotebook) return;
    var jr = host.querySelector('[data-planner-journal]'); if (!jr) return;
    window.P2PNotebook.mount(jr, { onSave: function (kind) { if (kind === 'reflection' && window.P2P) { if (window.P2P.checkJournal) window.P2P.checkJournal(); if (window.P2P.addJournalPoint) window.P2P.addJournalPoint(); } } });
  }
  function render() {
    var body = view === 'dash' ? dashHTML() : view === 'goals' ? goalsHTML() : view === 'products' ? productsHTML() : view === 'lives' ? livesHTML() : view === 'posts' ? postsHTML() : view === 'ideas' ? ideasHTML() : view === 'growth' ? growthHTML() : view === 'journal' ? journalHTML() : listsHTML();
    host.innerHTML = '<div class="osx-pl">' + navHTML() + '<div class="osx-pl-view">' + body + '</div></div>';
    wire();
    mountJournal();
    checkMilestones();
    checkLiveCele();
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
    host.querySelectorAll('[data-tmpl-open]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); var pop = b.nextElementSibling; if (pop) pop.hidden = !pop.hidden; }); });
    host.querySelectorAll('[data-tmpl-add]').forEach(function (b) { b.addEventListener('click', function () {
      var p = b.getAttribute('data-tmpl-add').split('|'), scope = p[0], tid = p[1];
      var tpl = ROADMAP_TEMPLATES.filter(function (x) { return x[0] === tid; })[0]; if (!tpl) return;
      if (scope === 'list') { tpl[2].forEach(function (t) { data[active].todo.push({ id: uid(), text: t, pct: 0 }); }); }
      else { var g = goal(scope.slice(5)); if (g) { g.roadmap = g.roadmap || []; tpl[2].forEach(function (t) { g.roadmap.push({ id: uid(), text: t, pct: 0 }); }); } }
      save(); render();
    }); });
    // lists
    host.querySelectorAll('[data-tf]').forEach(function (b) { b.addEventListener('click', function () { active = b.getAttribute('data-tf'); render(); }); });
    host.querySelectorAll('[data-laddb]').forEach(function (b) { b.addEventListener('click', function () { addList(b.getAttribute('data-laddb')); }); });
    host.querySelectorAll('[data-ladd]').forEach(function (inp) { inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addList(inp.getAttribute('data-ladd')); } }); });
    host.querySelectorAll('[data-ldel]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-ldel').split('|'); data[active][p[0]] = data[active][p[0]].filter(function (i) { return i.id !== p[1]; }); save(); render(); }); });
    var arch = host.querySelector('[data-arch]'); if (arch) arch.addEventListener('click', renderArchive);
    // lives
    var nsb = host.querySelector('[data-northstar]'); if (nsb) nsb.addEventListener('click', openNorthStar);
    var bab = host.querySelector('[data-beanchored]'); if (bab) bab.addEventListener('click', openBeAnchored);
    host.querySelectorAll('[data-hookideas]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); openHookIdeas(b.getAttribute('data-hookideas')); }); });
    host.querySelectorAll('[data-scripttips]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); openScriptTips(); }); });
    var nl = host.querySelector('[data-newlive]'); if (nl) nl.addEventListener('click', function () { var l = { id: uid(), title: '', platforms: ['TikTok'], otherPlat: '', date: '', hour: '', min: '00', ampm: 'PM', tz: 'ET', pitch: '', pitchOther: '', roomPromise: '', hook: '', script: '', prompts: ['', '', '', '', ''], goals: {}, results: {}, reflect: {}, win: '', blocker: '', action: '', mood: '', moodNote: '', done: false }; data.lives.unshift(l); expanded['L' + l.id] = true; save(); render(); });
    host.querySelectorAll('[data-ltoggle]').forEach(function (b) { b.addEventListener('click', function (e) { if (e.target.closest('input,select,textarea,button,a')) return; var id = b.getAttribute('data-ltoggle'); expanded['L' + id] = !expanded['L' + id]; render(); }); });
    host.querySelectorAll('[data-lf]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-lf').split('|'), l = liveObj(p[0]); if (!l) return; if (p[1].indexOf('reflect_') === 0) { l.reflect = l.reflect || {}; l.reflect[p[1].slice(8)] = el.value; } else l[p[1]] = el.value; if (l._dupe && dupeReady(l)) l._dupe = false; save(); if (/^(date|hour|pitch)$/.test(p[1])) render(); }); });
    host.querySelectorAll('[data-lg]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-lg').split('|'), l = liveObj(p[0]); if (l) { l.goals = l.goals || {}; l.goals[p[1]] = l.goals[p[1]] || {}; l.goals[p[1]][p[2]] = el.value; save(); applyStatColor(l, p[1], p[2]); } }); });
    host.querySelectorAll('[data-lr]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-lr').split('|'), l = liveObj(p[0]); if (l) { l.results = l.results || {}; l.results[p[1]] = l.results[p[1]] || {}; l.results[p[1]][p[2]] = el.value; save(); applyStatColor(l, p[1], p[2]); } }); });
    host.querySelectorAll('[data-lplat]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-lplat').split('|'), l = liveObj(p[0]); if (!l) return; l.platforms = l.platforms || []; var i = l.platforms.indexOf(p[1]); if (i > -1) l.platforms.splice(i, 1); else l.platforms.push(p[1]); if (l._dupe && dupeReady(l)) l._dupe = false; save(); render(); }); });
    host.querySelectorAll('[data-lprompt]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-lprompt').split('|'), l = liveObj(p[0]); if (l) { l.prompts = l.prompts || ['', '', '', '', '']; l.prompts[+p[1]] = el.value; save(); } }); });
    host.querySelectorAll('[data-lmood]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-lmood').split('|'), l = liveObj(p[0]); if (!l) return; l.mood = (l.mood === p[1]) ? '' : p[1]; save(); b.parentNode.querySelectorAll('.osx-lv-mood').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-lmood').split('|')[1] === l.mood); }); }); });
    host.querySelectorAll('[data-ldupe]').forEach(function (b) { b.addEventListener('click', function () { var src = liveObj(b.getAttribute('data-ldupe')); if (!src) return; var c = dupeOf(src); data.lives.unshift(c); expanded['L' + c.id] = true; save(); render(); }); });
    host.querySelectorAll('[data-ldone]').forEach(function (b) { b.addEventListener('click', function () { var l = liveObj(b.getAttribute('data-ldone')); if (!l) return; if (l._dupe) { alert('Change the highlighted Date, Time and Platform first — this is a duplicate.'); return; } l.done = !l.done; save(); render(); }); });
    host.querySelectorAll('[data-lvdel]').forEach(function (b) { b.addEventListener('click', function () { var l = liveObj(b.getAttribute('data-lvdel')); if (l) { l.deleted = true; save(); render(); } }); });
    // vault sub-tabs + bulk actions + template/archive/trash ops
    host.querySelectorAll('[data-livestab]').forEach(function (b) { b.addEventListener('click', function () { livesTab = b.getAttribute('data-livestab'); render(); }); });
    host.querySelectorAll('[data-lvsel]').forEach(function (c) { c.addEventListener('change', function () { selected[c.getAttribute('data-lvsel')] = c.checked; render(); }); });
    var lvb = host.querySelector('[data-lvbulk]'); if (lvb) lvb.addEventListener('click', function (e) { e.stopPropagation(); var pop = lvb.nextElementSibling; if (pop) pop.hidden = !pop.hidden; });
    host.querySelectorAll('[data-bulk]').forEach(function (b) { b.addEventListener('click', function () { var act = b.getAttribute('data-bulk'), ids = selectedIds(); if (!ids.length) return; ids.forEach(function (id) { var l = liveObj(id); if (!l) return; if (act === 'archive') l.archived = true; else if (act === 'delete') l.deleted = true; else if (act === 'template') data.templates.unshift(makeTemplate(l)); else if (act === 'duplicate') data.lives.unshift(dupeOf(l)); }); selected = {}; save(); render(); }); });
    host.querySelectorAll('[data-tpuse]').forEach(function (b) { b.addEventListener('click', function () { var tp = data.templates.filter(function (x) { return x.id === b.getAttribute('data-tpuse'); })[0]; if (!tp) return; var c = JSON.parse(JSON.stringify(tp)); c.id = uid(); c.date = ''; c.done = false; c.results = {}; c.archived = false; c.deleted = false; data.lives.unshift(c); livesTab = 'lives'; expanded['L' + c.id] = true; save(); render(); }); });
    host.querySelectorAll('[data-tpdel]').forEach(function (b) { b.addEventListener('click', function () { data.templates = data.templates.filter(function (x) { return x.id !== b.getAttribute('data-tpdel'); }); save(); render(); }); });
    host.querySelectorAll('[data-lvrestore]').forEach(function (b) { b.addEventListener('click', function () { var l = liveObj(b.getAttribute('data-lvrestore')); if (l) { l.archived = false; l.deleted = false; save(); render(); } }); });
    host.querySelectorAll('[data-lvtrash]').forEach(function (b) { b.addEventListener('click', function () { var l = liveObj(b.getAttribute('data-lvtrash')); if (l) { l.deleted = true; l.archived = false; save(); render(); } }); });
    host.querySelectorAll('[data-lvpurge]').forEach(function (b) { b.addEventListener('click', function () { if (!window.confirm('Delete this live forever? This cannot be undone.')) return; data.lives = data.lives.filter(function (x) { return x.id !== b.getAttribute('data-lvpurge'); }); save(); render(); }); });
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
    // creator mode + info
    host.querySelectorAll('[data-ctype]').forEach(function (b) { b.addEventListener('click', function () { data.ctype = b.getAttribute('data-ctype'); save(); render(); }); });
    var msi = host.querySelector('[data-msinfo]'); if (msi) msi.addEventListener('click', openInfo);
    // dashboard calendar
    var dcp = host.querySelector('[data-dcprev]'); if (dcp) dcp.addEventListener('click', function () { calMY.m--; if (calMY.m < 0) { calMY.m = 11; calMY.y--; } render(); });
    var dcn = host.querySelector('[data-dcnext]'); if (dcn) dcn.addEventListener('click', function () { calMY.m++; if (calMY.m > 11) { calMY.m = 0; calMY.y++; } render(); });
    host.querySelectorAll('[data-dcday]').forEach(function (b) { b.addEventListener('click', function () { var iso = b.getAttribute('data-dcday'); if (pendIdea) { var id = pendIdea; pendIdea = null; scheduleIdea(id, iso); } else { openDcDay(iso); } }); });
    var dragId = null;
    host.querySelectorAll('[data-ideachip]').forEach(function (c) {
      c.addEventListener('click', function () { var id = c.getAttribute('data-ideachip'); pendIdea = pendIdea === id ? null : id; render(); });
      c.addEventListener('dragstart', function (e) { dragId = c.getAttribute('data-ideachip'); pendIdea = null; c.classList.add('dragging'); if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (er) {} } });
      c.addEventListener('dragend', function () { dragId = null; c.classList.remove('dragging'); host.querySelectorAll('.osx-dc-d.drop-hot').forEach(function (x) { x.classList.remove('drop-hot'); }); });
    });
    var idc = host.querySelector('[data-idcancel]'); if (idc) idc.addEventListener('click', function () { pendIdea = null; render(); });
    host.querySelectorAll('[data-dcday]').forEach(function (b) {
      b.addEventListener('dragover', function (e) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; b.classList.add('drop-hot'); });
      b.addEventListener('dragleave', function () { b.classList.remove('drop-hot'); });
      b.addEventListener('drop', function (e) { e.preventDefault(); b.classList.remove('drop-hot'); var id = dragId || (e.dataTransfer && e.dataTransfer.getData('text/plain')); if (id) scheduleIdea(id, b.getAttribute('data-dcday')); });
    });
    host.querySelectorAll('[data-shipweek]').forEach(function (b) { b.addEventListener('click', function () { openShipWeek(b.getAttribute('data-shipweek')); }); });
    host.querySelectorAll('[data-openitem]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-openitem').split('|'); openItemDetail(p[0], p[1]); }); });
    host.querySelectorAll('[data-remind]').forEach(function (b) { b.addEventListener('click', function () { var p = b.getAttribute('data-remind').split('|'), it = remItem(p[0], p[1]); if (!it) return; it.reminders = it.reminders || []; var i = it.reminders.indexOf(p[2]); if (i > -1) it.reminders.splice(i, 1); else it.reminders.push(p[2]); b.classList.toggle('on'); save(); }); });
    // RAFT weekly loop
    host.querySelectorAll('[data-raft]').forEach(function (el) { var k = el.getAttribute('data-raft'); var ev = (el.type === 'checkbox') ? 'change' : 'change'; el.addEventListener(ev, function () { var c = raftCycle(); if (el.type === 'checkbox') c[k] = el.checked; else c[k] = el.value; save(); if (k === 'fastWin' || k === 'corrected') render(); }); });
    host.querySelectorAll('[data-act]').forEach(function (b) { b.addEventListener('click', function () { var c = raftCycle(), n = +b.getAttribute('data-act'); c.act = (c.act === n) ? n - 1 : n; save(); render(); }); });
    // products
    var npr = host.querySelector('[data-newprod]'); if (npr) npr.addEventListener('click', function () { var p = { id: uid(), name: 'New product', type: '', price: '', status: 'idea', launch: '', sold: '', revenue: '' }; data.products.unshift(p); expanded['PR' + p.id] = true; save(); render(); });
    host.querySelectorAll('[data-prtoggle]').forEach(function (b) { b.addEventListener('click', function (e) { if (e.target.closest('input,select,textarea,button,a')) return; var id = b.getAttribute('data-prtoggle'); expanded['PR' + id] = !expanded['PR' + id]; render(); }); });
    host.querySelectorAll('[data-prf]').forEach(function (el) { el.addEventListener('change', function () { var p = el.getAttribute('data-prf').split('|'), o = prodObj(p[0]); if (o) { o[p[1]] = el.value; save(); if (p[1] === 'status' || p[1] === 'name' || p[1] === 'price') render(); } }); });
    host.querySelectorAll('[data-prdel]').forEach(function (b) { b.addEventListener('click', function () { if (!window.confirm('Delete this product?')) return; data.products = data.products.filter(function (x) { return x.id !== b.getAttribute('data-prdel'); }); save(); render(); }); });
    host.querySelectorAll('[data-prlaunch]').forEach(function (b) { b.addEventListener('click', function () { var o = prodObj(b.getAttribute('data-prlaunch')); if (!o) return; var g = { id: uid(), title: 'Launch: ' + (o.name || 'product'), stage: 'grows', g: '', r: '', o: '', s: '', w: o.launch || '', roadmap: ROOTED_STEPS_P.map(function (t) { return { id: uid(), text: t, pct: 0 }; }) }; data.goals.unshift(g); expanded[g.id] = true; view = 'goals'; save(); render(); }); });
  }
  function addRoad(gid) { var inp = host.querySelector('[data-radd="' + gid + '"]'); var v = (inp && inp.value || '').trim(); if (!v) return; var g = goal(gid); if (g) { g.roadmap = g.roadmap || []; g.roadmap.push({ id: uid(), text: v.slice(0, 120), pct: 0 }); save(); render(); } }
  function addList(bucket) { var inp = host.querySelector('[data-ladd="' + bucket + '"]'); var v = (inp && inp.value || '').trim(); if (!v) return; if (bucket === 'top' && data[active].top.length >= 3) return; data[active][bucket].push({ id: uid(), text: v.slice(0, 120), pct: 0 }); save(); render(); }

  // close any open template dropdown on an outside click (registered once)
  document.addEventListener('click', function (e) { if (!e.target.closest('.osx-tmpl-wrap')) { host.querySelectorAll('.osx-tmpl-pop').forEach(function (p) { p.hidden = true; }); } });

  render();
  try { rebuildReminders(); } catch (e) {}
})();
