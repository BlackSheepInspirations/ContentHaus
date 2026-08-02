/* Purpose 2 Profit — Learning Journey (journey map page) */
(function(){
  var root = document.getElementById('p2pj');
  if(!root) return;

  /* ---- live stats (from the shared progress engine) ---- */
  // Totals across EVERY realm (the Progress panel is journey-wide, not per-board).
  function mapTotals(){
    var total = 0, done = 0, P = window.P2P;
    if(window.P2P_MAP){
      window.P2P_MAP.forEach(function(realm){
        (realm.courses || []).forEach(function(c){ total++; if(P && P.isCourseDone(c.h)) done++; });
      });
    }
    return { total: total, done: done };
  }
  function badgeCount(){
    if(!window.P2P) return 0;
    var bstat = window.P2P.badgesStat();
    return bstat ? bstat.earned : window.P2P.earnedSet().length;
  }
  function renderStats(){
    if(!window.P2P) return;
    var streak = window.P2P.streak().count;
    root.querySelectorAll('.p2pj-streak').forEach(function(el){ el.textContent = streak; });
    root.querySelectorAll('.p2pj-points').forEach(function(el){ el.textContent = window.P2P.points(); });
    root.querySelectorAll('.p2pj-level').forEach(function(el){ el.textContent = window.P2P.merits ? window.P2P.merits() : window.P2P.level(); });
    var tn = window.P2P.tier ? window.P2P.tier().name : '';
    root.querySelectorAll('.p2pj-tiername').forEach(function(el){ el.textContent = tn; });
    root.querySelectorAll('.p2pj-badges').forEach(function(el){ el.textContent = badgeCount(); });

    // Hero mini-ring stays per-board; the Progress panel shows journey-wide totals.
    var boardCourses = parseInt(root.getAttribute('data-board-courses'), 10) || 5;
    var boardDone = Math.min(window.P2P.coursesDone(), boardCourses);
    var boardPct = boardCourses ? Math.round(boardDone / boardCourses * 100) : 0;
    root.querySelectorAll('.ring-mini.p2pj-ring').forEach(function(el){ el.style.setProperty('--p', boardPct); var p = el.querySelector('.p2pj-ringpct'); if(p) p.textContent = boardPct + '%'; });

    var g = mapTotals();
    var gpct = g.total ? Math.round(g.done / g.total * 100) : 0;
    root.querySelectorAll('.p2pj-courses').forEach(function(el){ el.textContent = g.done; });
    root.querySelectorAll('.p2pj-courses-total').forEach(function(el){ el.textContent = '/' + g.total; });
    root.querySelectorAll('.prog-ring.p2pj-ring').forEach(function(el){ el.style.setProperty('--p', gpct); var p = el.querySelector('.p2pj-ringpct'); if(p) p.textContent = gpct + '%'; });
    renderNudges();
  }

  /* ---- "Up next" goal line + weekly-goal card (Progress panel) ---- */
  function renderNudges(){
    if(!window.P2P) return;
    // points-to-next-tier nudge under the Up-next card
    var goalEl = root.querySelector('[data-nextgoal]');
    if(goalEl && window.P2P.tier){
      var t = window.P2P.tier(), toNext = t.next - t.points;
      if(toNext > 0){ goalEl.textContent = "You're " + toNext + ' point' + (toNext === 1 ? '' : 's') + ' from ' + t.nextName + '.'; goalEl.hidden = false; }
      else goalEl.hidden = true;
    }
    // weekly goal card
    var wc = root.querySelector('[data-weekgoal]');
    if(wc && window.P2P.weekGoal){
      var w = window.P2P.weekGoal();
      var pct = w.goal ? Math.min(100, Math.round(w.done / w.goal * 100)) : 0;
      var cEl = wc.querySelector('[data-week-count]'), bEl = wc.querySelector('[data-week-bar]'), nEl = wc.querySelector('[data-week-note]');
      if(cEl) cEl.textContent = Math.min(w.done, w.goal) + '/' + w.goal;
      if(bEl) bEl.style.width = pct + '%';
      if(nEl) nEl.textContent = w.paid ? ('Done! +' + w.bonus + ' bonus earned this week 🎉')
        : ('Finish ' + w.goal + ' course' + (w.goal === 1 ? '' : 's') + ' this week for +' + w.bonus + ' points.');
      wc.classList.toggle('is-done', !!w.paid);
      wc.hidden = false;
    }
  }
  renderStats();

  /* ---- Daily Boosters — one item per pillar per day; rotate Heart/Purpose/Mindset (matches the OS) ---- */
  (function(){
    var mm = document.getElementById('p2pj-moment'); if(!mm) return;
    var day = Math.floor(Date.now() / 864e5);
    var pillars = [
      { label:'Mindset', pool: window.P2P_MOMENTS },
      { label:'Purpose', pool: window.P2P_PURPOSE },
      { label:'Heart', pool: window.P2P_HEART }
    ].filter(function(p){ return p.pool && p.pool.length; });
    if(!pillars.length) return;
    var titleEl = mm.querySelector('[data-mm-title]'), textEl = mm.querySelector('.mm-text'), srcEl = mm.querySelector('.mm-source');
    var dotsWrap = mm.querySelector('[data-mm-dots]');
    if(dotsWrap) dotsWrap.innerHTML = pillars.map(function(_, di){ return '<button class="mm-dot' + (di === 0 ? ' on' : '') + '" type="button" aria-label="Booster ' + (di + 1) + '"></button>'; }).join('');
    var dots = dotsWrap ? dotsWrap.querySelectorAll('.mm-dot') : [];
    var i = 0, timer = null;
    function render(){
      var p = pillars[i], it = p.pool[day % p.pool.length] || {};
      if(titleEl) titleEl.innerHTML = '<span class="mm-star">✦</span> <span class="mm-grad">' + p.label + '</span> Booster';
      if(textEl) textEl.textContent = it.t ? ('“' + it.t + '”') : '';
      if(srcEl) srcEl.textContent = it.s || '';
      dots.forEach(function(d, di){ d.classList.toggle('on', di === i); });
    }
    function go(n){ i = ((n % pillars.length) + pillars.length) % pillars.length; render(); }
    function next(){ go(i + 1); }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } }
    function start(){ stop(); timer = setInterval(next, 9000); }
    var nb = mm.querySelector('[data-mm-next]'); if(nb) nb.addEventListener('click', function(){ next(); start(); });
    dots.forEach(function(d, di){ d.addEventListener('click', function(){ go(di); start(); }); });
    mm.addEventListener('mouseenter', stop); mm.addEventListener('mouseleave', start);
    render(); mm.hidden = false; start();
  })();

  /* ---- welcome pop-up ---- */
  var welcome = document.getElementById('p2pj-welcome');
  if(welcome){
    var wkey = 'p2p_welcome_dismissed';
    var seen = false; try{ seen = localStorage.getItem(wkey) === '1'; }catch(e){}
    // this script only ever loads for an already-gated visitor (see the
    // section's {% if has_access %}), so there's no lock state to check here
    if(!seen) welcome.classList.add('show');
    function closeWelcome(){
      var dont = document.getElementById('p2pj-wdont');
      if(dont && dont.checked){ try{ localStorage.setItem(wkey,'1'); }catch(e){} }
      welcome.classList.remove('show');
    }
    var wx = document.getElementById('p2pj-wx'), ws = document.getElementById('p2pj-wstart');
    if(wx) wx.addEventListener('click', closeWelcome);
    if(ws) ws.addEventListener('click', closeWelcome);
    welcome.addEventListener('click', function(e){ if(e.target === welcome) closeWelcome(); });
  }

  /* ---- lock engine — Main courses gate on the intro flow, Offshoots gate on
     their hub course, Checks never gate. Real per-course completion comes
     from window.P2P.isCourseDone(handle); nothing here is hardcoded. ---- */
  var INTRO_KEY = 'p2p_intro_done';
  function onboardingDone(){ try{ return localStorage.getItem(INTRO_KEY) === '1'; }catch(e){ return false; } }
  function markOnboardingDone(){
    try{ localStorage.setItem(INTRO_KEY, '1'); }catch(e){}
    if(window.P2P){ window.P2P.earnBadge('Set Sail'); if(window.P2P_celebrate) window.P2P_celebrate(); } // earned for completing "Your Journey Starts Here"
  }
  var introRequired = root.getAttribute('data-intro-required') !== 'false';
  // Realm anchor: the one course that unlocks the rest of this realm (section setting).
  var REALM_GATE = (root.getAttribute('data-unlock-after') || '').trim();
  function courseDone(hh){ return !!(window.P2P && hh && window.P2P.isCourseDone(hh)); }

  function nodeState(h){
    if(h.hasAttribute('data-begin')) return onboardingDone() ? 'done' : 'available'; // entry point — never locked
    var handle = h.getAttribute('data-handle');
    if(courseDone(handle)) return 'done';
    var after = (h.getAttribute('data-unlock-after') || '').trim();
    if(after) return courseDone(after) ? 'available' : 'locked';           // explicit hub (e.g. Selling-on → Storefront Essentials)
    if(REALM_GATE && handle && handle === REALM_GATE)                       // the realm's own anchor course
      return (introRequired && !onboardingDone()) ? 'locked' : 'available';
    if(REALM_GATE) return courseDone(REALM_GATE) ? 'available' : 'locked';  // rest of a gated realm — courses AND checks wait for the anchor
    if(h.getAttribute('data-type') === 'check') return 'available';         // ungated realm: checks never lock
    return (introRequired && !onboardingDone()) ? 'locked' : 'available';   // ungated realm main course
  }
  function nodeType(h){ return h.hasAttribute('data-begin') ? 'start' : (h.getAttribute('data-type') || 'course'); }
  /* one icon per node type — shown on every "available" marker so the map
     reads as a real trail (start=flag, course=book, offshoot=star, check=sparkle) */
  var TYPE_ICON = {
    start: '<svg viewBox="0 0 24 24"><path d="M6 3v18"/><path d="M6 4h11l-3 4 3 4H6z"/></svg>',
    course: '<svg viewBox="0 0 24 24"><path d="M4 5c3-1.5 6-1.5 8 0v14c-2-1.5-5-1.5-8 0z"/><path d="M20 5c-3-1.5-6-1.5-8 0v14c2-1.5 5-1.5 8 0z"/></svg>',
    offshoot: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/></svg>'
  };
  function handleTitle(hh){ if(!hh) return ''; var n = root.querySelector('[data-handle="' + hh + '"]'); return (n && n.getAttribute('data-title')) || hh.replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }); }
  function lockReason(h){
    var after = (h.getAttribute('data-unlock-after') || '').trim();
    if(after) return 'Complete "' + handleTitle(after) + '" to unlock this.';
    if(REALM_GATE && h.getAttribute('data-handle') !== REALM_GATE) return 'Complete "' + handleTitle(REALM_GATE) + '" to unlock the rest of this realm.';
    return 'Finish "Your Journey Begins Here" to unlock this.';
  }

  /* ---- progress overlays — one .cs dot per course/offshoot node, positioned
     from the SAME inline left/top the button already has, so they can never
     drift out of sync with it (the old hardcoded overlays could). ---- */
  function renderOverlays(){
    root.querySelectorAll('.board .cs').forEach(function(el){ el.remove(); });
    var board = root.querySelector('.board');
    if(!board) return;
    root.querySelectorAll('.hs').forEach(function(h){
      if(h.classList.contains('hs--plain')) return; // decorative-info hotspot (e.g. RAFT scroll) — no state marker
      var type = nodeType(h);
      var state = nodeState(h);
      var cs = document.createElement('div');
      cs.className = 'cs';
      if(type === 'start'){
        // Begin: centered where placed (sits below the sign wording)
        cs.style.left = h.style.left;
        cs.style.top = h.style.top;
      } else {
        var L = parseFloat(h.style.left) || 0, T = parseFloat(h.style.top) || 0,
            W = parseFloat(h.style.width) || 0, Hh = parseFloat(h.style.height) || 0;
        if(type === 'check'){
          // check: badge at the bottom, horizontally centered
          cs.style.left = L + '%';
          cs.style.top = (T + Hh / 2) + '%';
        } else {
          // course/offshoot: badge at the far-right edge, vertically centered
          cs.style.left = (L + W / 2) + '%';
          cs.style.top = T + '%';
        }
      }
      if(state === 'done'){
        cs.innerHTML = '<span class="done"><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span>';
        h.classList.remove('is-locked');
      } else if(state === 'locked'){
        cs.innerHTML = '<span class="lock"><svg viewBox="0 0 24 24"><path d="M6 10V8a6 6 0 0 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h8V8a4 4 0 0 0-8 0v2z"/></svg></span>';
        h.classList.add('is-locked');
      } else {
        h.classList.remove('is-locked');
        cs.innerHTML = '<span class="avail avail--' + type + '">' + (TYPE_ICON[type] || TYPE_ICON.course) + '</span>';
      }
      h._marker = cs; // lets the hover wiring below light up the right marker
      board.appendChild(cs);
      // NEW (21-day window from data-new-since) / SOON stickers — a separate overlay so it never fights the state marker
      var soon = /^(true|1)$/i.test(h.getAttribute('data-coming-soon') || '');
      var ns = h.getAttribute('data-new-since'), isNew = false;
      if(ns){ var t0 = Date.parse(ns); if(!isNaN(t0)){ var days = (Date.now() - t0) / 86400000; isNew = days >= -1 && days <= 21; } }
      if(soon || isNew){
        var tag = document.createElement('div');
        tag.className = 'cs cs-tag';
        tag.style.left = cs.style.left; tag.style.top = cs.style.top;
        tag.innerHTML = '<span class="cs-sticker ' + (soon ? 'cs-soon' : 'cs-new') + '">' + (soon ? 'Soon' : 'New') + '</span>';
        board.appendChild(tag);
      }
    });
  }

  /* ---- info modal (Main/Offshoot hotspots) ---- */
  var modal = document.getElementById('p2pj-modal');
  var kick = {course:'Course', offshoot:'Bonus · Offshoot', info:'Getting Started'};
  function openModal(h){
    document.getElementById('p2pj-mk').textContent = kick[h.getAttribute('data-type')] || '';
    document.getElementById('p2pj-mt').textContent = h.getAttribute('data-title') || '';
    document.getElementById('p2pj-mb').textContent = h.getAttribute('data-body') || '';
    var cta = document.getElementById('p2pj-mc');
    cta.textContent = h.getAttribute('data-cta') || 'Continue';
    var url = h.getAttribute('data-url');
    if(url){ cta.setAttribute('href', url); cta.style.display='inline-block'; } else { cta.removeAttribute('href'); }
    modal.classList.add('show');
  }
  function openLockedModal(h){
    document.getElementById('p2pj-mk').textContent = 'Locked';
    document.getElementById('p2pj-mt').textContent = h.getAttribute('data-title') || '';
    document.getElementById('p2pj-mb').textContent = lockReason(h);
    var cta = document.getElementById('p2pj-mc');
    cta.removeAttribute('href');
    modal.classList.add('show');
  }
  function closeModal(){ modal.classList.remove('show'); }

  /* ---- Check popup (Mindset/Purpose/Heart — pulse items, never gated) ---- */
  var checkModal = document.getElementById('p2pj-check');
  function openCheck(h){
    if(!checkModal) return;
    var ctitle = h.getAttribute('data-title') || '';
    // engaging a pulse Check is its side-quest completion — +points once per distinct check.
    // data-check-id is category-encoded + realm-unique (check:<cat>:<blockid>) so the
    // per-category badges (Mindset/Purpose/Heart I·II·all) can count across realms.
    var cid = h.getAttribute('data-check-id') || ('check:' + ctitle);
    if(ctitle && window.P2P && window.P2P.completeCheck){ window.P2P.completeCheck(cid); if(window.P2P.push) window.P2P.push(); renderStats(); checkRankUp(); }
    document.getElementById('p2pj-ct').textContent = ctitle;
    var items = (h.getAttribute('data-pulse-items') || '').split('\n').map(function(s){ return s.trim(); }).filter(Boolean);
    var list = document.getElementById('p2pj-cb');
    list.innerHTML = items.map(function(i){ return '<li>' + i.replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }) + '</li>'; }).join('');
    var cta = document.getElementById('p2pj-cc');
    var url = h.getAttribute('data-link-url');
    if(url){ cta.textContent = h.getAttribute('data-link-label') || 'Open'; cta.setAttribute('href', url); cta.style.display = 'inline-block'; }
    else { cta.removeAttribute('href'); cta.style.display = 'none'; }
    checkModal.classList.add('show');
  }
  function closeCheck(){ checkModal.classList.remove('show'); }
  /* ---- Journey Begins onboarding ---- */
  var begin = document.getElementById('p2pj-begin');
  function beginStep(name){ if(!begin) return; begin.querySelectorAll('.step').forEach(function(s){ s.classList.toggle('on', s.getAttribute('data-step') === name); }); var bc = begin.querySelector('.bc'); if(bc) bc.scrollTop = 0; }
  if(begin){
    begin.querySelectorAll('[data-go]').forEach(function(b){ b.addEventListener('click', function(){
      // "Yes, I've completed my Brand DNA Blueprint" self-attests the Founder Fingerprint badge.
      // (At launch this is superseded by reading the shared Brand DNA metafield directly.)
      if(b.hasAttribute('data-dna-done') && window.P2P) window.P2P.earnBadge('Founder Fingerprint');
      var goTo = b.getAttribute('data-go');
      // reaching "Welcome Aboard" (the final onboarding step) is the intro
      // gate every Main course on this Realm checks — flip it once, here.
      if(goTo === 'main'){ markOnboardingDone(); renderOverlays(); }
      beginStep(goTo);
    }); });
    var bbx = begin.querySelector('.bx'); if(bbx) bbx.addEventListener('click', function(){ begin.classList.remove('show'); });
    begin.addEventListener('click', function(e){ if(e.target === begin) begin.classList.remove('show'); });
  }

  root.querySelectorAll('.hs').forEach(function(h){
    h.addEventListener('mouseenter', function(){ if(h._marker) h._marker.classList.add('hovered'); });
    h.addEventListener('mouseleave', function(){ if(h._marker) h._marker.classList.remove('hovered'); });
    h.addEventListener('click', function(){
      if(h.hasAttribute('data-begin') && begin){ beginStep('welcome1'); begin.classList.add('show'); return; }
      if(h.classList.contains('hs--plain')){ openModal(h); return; } // RAFT scroll info — never gated
      var type = h.getAttribute('data-type');
      if(type === 'check'){ openCheck(h); return; }
      if(nodeState(h) === 'locked'){ openLockedModal(h); return; }
      openModal(h);
    });
  });
  renderOverlays();
  if(modal){
    document.getElementById('p2pj-mx').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
    var mc = document.getElementById('p2pj-mc');
    mc.addEventListener('click', function(e){ if(!mc.getAttribute('href')) closeModal(); });
  }
  if(checkModal){
    document.getElementById('p2pj-cx').addEventListener('click', closeCheck);
    checkModal.addEventListener('click', function(e){ if(e.target === checkModal) closeCheck(); });
  }

  /* ---- nav tabs → inline panels ---- */
  var board = root.querySelector('.board');
  var stickyOff = 8; // sticky-bar top offset, kept current by the sticky sync() below
  function showPanel(name){
    root.querySelectorAll('.panel').forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-panel') === name); });
    if(board) board.style.display = (name === 'journey') ? '' : 'none';
    root.querySelectorAll('.nav a[data-panel]').forEach(function(x){ x.classList.toggle('on', x.getAttribute('data-panel') === name); });
    // Scroll so the toolbar pins to the top with the panel title just beneath it. A single
    // scroll to a stable target (panelDocY is constant — the bar/spacer always occupies barH
    // before the panel) never bounces. Panels carry a CSS min-height so even short ones have
    // room to pin the bar; the panel's own top padding shows the title clear of the bar.
    var target = (name === 'journey') ? board : root.querySelector('.panel[data-panel="' + name + '"]');
    if(target && bar){
      var barH = bar.offsetHeight;
      var panelDocY = target.getBoundingClientRect().top + window.pageYOffset;
      var y = panelDocY - stickyOff - barH + 2;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }
  root.querySelectorAll('.nav a').forEach(function(a){
    a.addEventListener('click', function(e){
      if(a.hasAttribute('data-panel')){ e.preventDefault(); if(a.getAttribute('data-panel') === 'directory') buildDirectory(); showPanel(a.getAttribute('data-panel')); }
      // Milestones is a real link (navigates); info is handled separately
    });
  });

  /* ---- course directory (cross-realm jump-to-course index) ---- */
  var dir = root.querySelector('.p2pj-dir');
  function courseState(c, realm){
    var P = window.P2P;
    if(P && P.isCourseDone(c.h)) return 'done';
    var locked = realm.gate && c.h !== realm.gate && !(P && P.isCourseDone(realm.gate));
    if(!locked && c.after) locked = !(P && P.isCourseDone(c.after));
    if(locked) return 'locked';
    try{ var a = JSON.parse(localStorage.getItem('p2p_course_' + c.h + '_done') || '[]'); if(a && a.length) return 'progress'; }catch(e){}
    return 'available';
  }
  var STATE_LABEL = { done:'Completed', progress:'In progress', locked:'Locked', available:'Not started' };
  function buildDirectory(){
    if(!dir || !window.P2P_MAP) return;
    var curN = parseInt(dir.getAttribute('data-current-realm'), 10) || 1;
    var html = '';
    window.P2P_MAP.forEach(function(realm){
      var doneN = 0;
      var rows = '';
      realm.courses.forEach(function(c){
        var st = courseState(c, realm);
        if(st === 'done') doneN++;
        var href = (st === 'locked') ? realm.url : '/pages/courses-' + c.h;
        var tip = (st === 'locked' && realm.gate) ? (' data-tip="Finish ' + realm.gate.toUpperCase() + ' first to unlock"') : '';
        rows += '<a class="dir-course is-' + st + '" href="' + href + '"' + tip + '>' +
                  '<span class="dir-ico" aria-label="' + STATE_LABEL[st] + '"></span>' +
                  '<span class="dir-ct">' + c.t + (c.o ? '<i class="dir-off">offshoot</i>' : '') + '</span>' +
                  '<span class="dir-go">' + (st === 'locked' ? 'View realm' : 'Open') + ' →</span>' +
                '</a>';
      });
      var open = (realm.n === curN) ? ' open' : '';
      var total = realm.courses.length;
      var pct = total ? Math.round(doneN / total * 100) : 0;
      html += '<div class="dir-realm' + open + '" data-realm="' + realm.n + '">' +
                '<button class="dir-rhead" type="button">' +
                  '<span class="dir-rnum">' + realm.n + '</span>' +
                  '<span class="dir-rtitle"><span class="dir-rname">' + realm.name + '</span>' +
                    '<span class="dir-rmeta">' + doneN + ' of ' + total + ' complete</span></span>' +
                  '<span class="dir-rpct">' + pct + '%</span>' +
                  '<svg class="dir-chev" viewBox="0 0 24 24"><path d="M8 10l4 4 4-4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                '</button>' +
                '<span class="dir-bar"><i style="width:' + pct + '%"></i></span>' +
                '<div class="dir-courses">' + rows + '</div>' +
              '</div>';
    });
    dir.innerHTML = html;
    dir.querySelectorAll('.dir-rhead').forEach(function(h){
      h.addEventListener('click', function(){ h.parentNode.classList.toggle('open'); });
    });
  }
  buildDirectory();

  /* ---- bonus cards (Checks) open the pulse-check popup ---- */
  root.querySelectorAll('.bqcard').forEach(function(c){ c.addEventListener('click', function(){ openCheck(c); }); });

  /* ---- confirm dialog (shared) ---- */
  var cfEl = document.getElementById('p2pj-confirm'), cfCb = null;
  function confirmDialog(title, msg, okLabel, onOk){
    if(!cfEl){ if(window.confirm(msg)) onOk(); return; }
    cfEl.querySelector('.cf-title').textContent = title;
    cfEl.querySelector('.cf-msg').textContent = msg;
    cfEl.querySelector('.cf-ok').textContent = okLabel || 'Delete';
    cfCb = onOk; cfEl.classList.add('show');
  }
  if(cfEl){
    cfEl.querySelector('.cf-ok').addEventListener('click', function(){ cfEl.classList.remove('show'); var cb = cfCb; cfCb = null; if(cb) cb(); });
    cfEl.querySelector('.cf-cancel').addEventListener('click', function(){ cfEl.classList.remove('show'); cfCb = null; });
    cfEl.addEventListener('click', function(e){ if(e.target === cfEl){ cfEl.classList.remove('show'); cfCb = null; } });
  }

  /* ---- notebook: Journal (Reflections) & Wins — shared engine (assets/p2p-notebook.js) ---- */
  if(window.P2PNotebook){
    window.P2PNotebook.mount(root, {
      confirmDialog: confirmDialog,
      onSave: function(kind){
        if(kind === 'reflection' && window.P2P){
          window.P2P.checkJournal(); window.P2P.addJournalPoint();
          renderStats(); checkRankUp();
          if(window.P2P_celebrate) window.P2P_celebrate();
        }
      }
    });
  }

  /* ---- badge-earned celebration (fires on any journey screen) ---- */
  var bpop = document.getElementById('p2pj-badgepop');
  if(bpop && window.P2P && window.P2P.earnedSet){
    var BP_SEEN = 'p2p_badges_seen', bpNameEl = bpop.querySelector('.bp-name'), bpCanvas = bpop.querySelector('.bp-canvas'), bpQ = [];
    function bpLoad(){ try{ return JSON.parse(localStorage.getItem(BP_SEEN) || '[]') || []; }catch(e){ return []; } }
    function bpSave(a){ try{ localStorage.setItem(BP_SEEN, JSON.stringify(a)); }catch(e){} }
    function bpConfetti(){
      var cv = bpCanvas; if(!cv || !cv.getContext) return;
      var ctx = cv.getContext('2d'), DPR = Math.min(window.devicePixelRatio || 1, 2);
      var W = cv.width = cv.clientWidth * DPR, H = cv.height = cv.clientHeight * DPR; if(!W || !H) return;
      var colors = ['#f4e2a6','#d8b45a','#39c5c0','#8f6fd6','#27ae6e'], P = [];
      for(var i=0;i<90;i++){ P.push({ x:W/2 + (Math.random()-.5)*W*0.3, y:H*0.34, vx:(Math.random()-.5)*11*DPR, vy:(Math.random()*-10-3)*DPR, s:(Math.random()*5+3)*DPR, c:colors[(Math.random()*colors.length)|0], r:Math.random()*6, vr:(Math.random()-.5)*0.4 }); }
      var t0 = performance.now();
      (function frame(t){
        var el = t - t0, a = Math.max(0, 1 - el/2600); ctx.clearRect(0,0,W,H);
        P.forEach(function(p){ p.vy += 0.25*DPR; p.x += p.vx; p.y += p.vy; p.r += p.vr;
          ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s*0.62); ctx.restore(); });
        if(el < 2600 && bpop.classList.contains('show')) requestAnimationFrame(frame); else ctx.clearRect(0,0,W,H);
      })(t0);
    }
    function bpNext(){ if(!bpQ.length){ bpop.classList.remove('show'); return; } bpNameEl.textContent = bpQ.shift(); bpop.classList.add('show'); requestAnimationFrame(bpConfetti); }
    var bpc = bpop.querySelector('.bp-close'); if(bpc) bpc.addEventListener('click', bpNext);
    bpop.addEventListener('click', function(e){ if(e.target === bpop) bpNext(); });
    function bpCelebrate(){
      var earned = window.P2P.earnedSet() || [], seen = bpLoad(), fresh = [], all = seen.slice();
      earned.forEach(function(n){ if(all.indexOf(n) === -1){ fresh.push(n); all.push(n); } });
      if(fresh.length){ bpSave(all); bpQ = bpQ.concat(fresh); if(!bpop.classList.contains('show')) setTimeout(bpNext, 700); }
    }
    window.P2P_celebrate = bpCelebrate;
    // don't collide with the first-visit welcome pop-up; wait until it's dismissed
    var wpop = document.getElementById('p2pj-welcome');
    if(wpop && wpop.classList.contains('show')){
      [document.getElementById('p2pj-wstart'), document.getElementById('p2pj-wx')].forEach(function(el){ if(el) el.addEventListener('click', function(){ setTimeout(bpCelebrate, 400); }); });
    } else { bpCelebrate(); }
  }

  /* ---- info modal ---- */
  var infoModal = document.getElementById('p2pj-info');
  if(infoModal){
    root.querySelectorAll('[data-info]').forEach(function(t){ t.addEventListener('click', function(e){ e.preventDefault(); infoModal.classList.add('show'); }); });
    var ix = infoModal.querySelector('.ix'); if(ix) ix.addEventListener('click', function(){ infoModal.classList.remove('show'); });
    infoModal.addEventListener('click', function(e){ if(e.target === infoModal) infoModal.classList.remove('show'); });
  }

  /* ---- points breakdown modal ---- */
  var ptsModal = document.getElementById('p2pj-points');
  if(ptsModal){
    root.querySelectorAll('[data-points]').forEach(function(t){ t.addEventListener('click', function(e){ e.preventDefault(); ptsModal.classList.add('show'); }); });
    var px = ptsModal.querySelector('.px'); if(px) px.addEventListener('click', function(){ ptsModal.classList.remove('show'); });
    ptsModal.addEventListener('click', function(e){ if(e.target === ptsModal) ptsModal.classList.remove('show'); });
  }

  /* ---- Progress detail pop-ups (Courses / Points / Badges / Streak / Merit) ---- */
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
  var MEDAL = '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>';
  function dNum(s){ var p = String(s).split('-'); return Math.floor(Date.UTC(+p[0], +p[1]-1, +p[2]) / 86400000); }

  function viewCourses(){
    var P = window.P2P, html = '', anyCourses = false;
    (window.P2P_MAP || []).forEach(function(realm){
      var cs = realm.courses || []; if(!cs.length) return;
      anyCourses = true;
      var doneN = 0;
      var rows = cs.map(function(c){
        var d = P && P.isCourseDone(c.h); if(d) doneN++;
        return '<div class="pb-crow' + (d ? ' is-done' : '') + '"><span class="pb-dot"></span><span>' + esc(c.t) + (c.o ? ' · offshoot' : '') + '</span></div>';
      }).join('');
      html += '<div class="pb-realm"><div class="pb-rhead"><span class="pb-rname">' + esc(realm.name) + '</span><span class="pb-rcount">' + doneN + '/' + cs.length + '</span></div><div class="pb-clist">' + rows + '</div></div>';
    });
    if(!anyCourses) return { title:'Courses done', body:'<p class="pb-empty">Your course list is loading — check back in a moment.</p>' };
    var g = mapTotals();
    return { title:'Courses done', sub: g.done + ' of ' + g.total + ' courses complete across every realm.', body: html };
  }

  function viewPoints(){
    var P = window.P2P;
    if(!P.pointsBreakdown) return { title:'Points', body:'<p class="pb-empty">No points yet — finish a course to get started.</p>' };
    var b = P.pointsBreakdown();
    var rows = [
      ['Courses finished', b.courses], ['Brand DNA Blueprint', b.dna], ['Certificates', b.certs],
      ['Side quests (Checks)', b.side], ['Badges earned', b.badges], ['Weekly goals', b.weekly || 0],
      ['Daily streak', b.streak], ['Journal', b.journal]
    ];
    var max = rows.reduce(function(m, r){ return Math.max(m, r[1]); }, 1);
    var total = P.points();
    var chart = rows.map(function(r){
      var zero = r[1] <= 0, w = Math.max(2, Math.round(r[1] / max * 100));
      return '<div class="pt-row' + (zero ? ' is-zero' : '') + '"><span class="pt-label">' + r[0] + '</span><span class="pt-bar"><i style="width:' + w + '%"></i></span><b class="pt-val">' + (zero ? '—' : '+' + r[1]) + '</b></div>';
    }).join('');
    return { title:'Where your points came from', sub:'Every point is proof you showed up.', body:'<div class="pt-chart">' + chart + '</div><div class="pt-total"><span>Your total</span><b>' + total + '</b></div>' };
  }

  function viewBadges(){
    var names = (window.P2P && window.P2P.earnedSet) ? window.P2P.earnedSet() : [];
    var n = badgeCount();
    if(!names.length) return { title:'Badges', sub: n + ' earned', body:'<p class="pb-empty">No badges yet — they unlock as you finish courses, keep a streak, and reflect. Your first is closer than you think.</p>' };
    var grid = names.map(function(nm){ return '<div class="pb-badge"><span class="pb-bmedal">' + MEDAL + '</span><span class="pb-bname">' + esc(nm) + '</span></div>'; }).join('');
    return { title:'Badges earned', sub: n + ' unlocked so far.', body:'<div class="pb-badges">' + grid + '</div>' };
  }

  function viewStreak(){
    var s = (window.P2P && window.P2P.streak) ? window.P2P.streak() : { count:0, last:'', longest:0 };
    var count = s.count || 0, longest = s.longest || count;
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    var monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][m];
    var firstDow = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate(), todayDom = now.getDate();
    var endNum = s.last ? dNum(s.last) : Math.floor(Date.now()/864e5), startNum = endNum - (count - 1);
    var dows = ['S','M','T','W','T','F','S'].map(function(d){ return '<span class="cell dow">' + d + '</span>'; }).join('');
    var cells = '';
    for(var i = 0; i < firstDow; i++) cells += '<span class="cell" style="background:none"></span>';
    for(var dom = 1; dom <= dim; dom++){
      var cn = Math.floor(Date.UTC(y, m, dom) / 86400000);
      var on = count > 0 && cn >= startNum && cn <= endNum;
      cells += '<span class="cell' + (on ? ' on' : '') + (dom === todayDom ? ' today' : '') + '">' + dom + '</span>';
    }
    var sub = longest > count ? ('Longest run: ' + longest + ' days.') : 'Keep it lit — every day counts.';
    return { title:'Your streak', body:'<div class="pb-streaktop"><span class="pb-flame">🔥</span><span class="pb-streaknum">' + count + '<small>day' + (count === 1 ? '' : 's') + ' in a row · ' + monthName + '</small></span></div><div class="pb-cal">' + dows + cells + '</div><p class="pb-sub" style="margin-top:14px">' + sub + '</p>' };
  }

  function viewMerit(){
    var P = window.P2P; if(!P.tier) return { title:'Merit', body:'<p class="pb-empty">Keep going to earn your first Merit.</p>' };
    var t = P.tier(), pts = t.points, span = (t.next - t.start) || 1, into = Math.max(0, Math.min(span, pts - t.start));
    var pct = Math.round(into / span * 100), toNext = t.next - pts;
    var names = t.tiers || [];
    var ladder = names.map(function(nm, i){
      var idx = i + 1, start = i * span, cls = idx === t.index ? 'here' : (t.index > idx ? 'done' : 'locked');
      return '<div class="pb-rung ' + cls + '"><span class="pb-rnum">' + idx + '</span><span class="pb-rtname">' + esc(nm) + (idx === t.index && t.name !== nm ? ' ' + esc(t.name.replace(nm, '').trim()) : '') + '</span><span class="pb-rtpts">' + start + '+</span></div>';
    }).join('');
    var head = '<div class="pb-merittop"><div class="pb-tiernow">' + esc(t.name) + '</div><div class="pb-tiermeta">' + t.merits + ' Merits · ' + pts + ' points</div><div class="pb-nextbar"><i style="width:' + pct + '%"></i></div><div class="pb-nexttxt">' + toNext + ' points to ' + esc(t.nextName) + '</div></div>';
    return { title:'Merit &amp; Tiers', sub:'Earn a Merit every ' + (window.P2P_POINTS && window.P2P_POINTS.level || 250) + ' points; a new Tier every two Merits.', body: head + '<div class="pb-ladder">' + ladder + '</div>' };
  }

  var VIEWS = { courses: viewCourses, points: viewPoints, badges: viewBadges, streak: viewStreak, merit: viewMerit };
  var progModal = document.getElementById('p2pj-prog');
  function openProg(name){
    if(!progModal || !VIEWS[name]) return;
    var v = VIEWS[name]();
    progModal.querySelector('[data-prog-title]').innerHTML = v.title;
    var body = progModal.querySelector('[data-prog-body]');
    body.innerHTML = (v.sub ? '<p class="pb-sub">' + v.sub + '</p>' : '') + v.body;
    progModal.classList.add('show');
  }
  function closeProg(){ if(progModal) progModal.classList.remove('show'); }
  root.querySelectorAll('[data-prog]').forEach(function(t){ t.addEventListener('click', function(){ openProg(t.getAttribute('data-prog')); }); });
  if(progModal){
    var pcx = progModal.querySelector('[data-prog-close]'); if(pcx) pcx.addEventListener('click', closeProg);
    progModal.addEventListener('click', function(e){ if(e.target === progModal) closeProg(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeProg(); });
  }

  /* ---- Rank-up celebration (new Merit tier since last visit) ---- */
  var rankModal = document.getElementById('p2pj-rankup');
  function showRankUp(t){
    if(!rankModal) return;
    rankModal.querySelector('.ru-tier').textContent = t.name;
    rankModal.querySelector('.ru-sub').textContent = 'You reached ' + t.name + ' — ' + t.merits + ' Merits and climbing.';
    rankModal.classList.add('show');
    ruConfetti(rankModal.querySelector('.ru-canvas'));
  }
  function checkRankUp(){
    if(!window.P2P || !window.P2P.tier) return;
    var cur = window.P2P.tier().index, seen = null;
    try{ seen = parseInt(localStorage.getItem('p2p_seen_tier'), 10); }catch(e){}
    if(isNaN(seen) || seen == null){ try{ localStorage.setItem('p2p_seen_tier', String(cur)); }catch(e){} return; }
    if(cur > seen){ showRankUp(window.P2P.tier()); }
    if(cur !== seen){ try{ localStorage.setItem('p2p_seen_tier', String(cur)); }catch(e){} }
  }
  if(rankModal){
    var ruc = rankModal.querySelector('.ru-close'); if(ruc) ruc.addEventListener('click', function(){ rankModal.classList.remove('show'); });
    rankModal.addEventListener('click', function(e){ if(e.target === rankModal) rankModal.classList.remove('show'); });
  }
  function ruConfetti(cv){
    if(!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), W = cv.width = cv.offsetWidth, H = cv.height = cv.offsetHeight;
    var cols = ['#f4c534','#8f6fd6','#39c5c0','#d6336c','#f4e2a6'], bits = [];
    for(var i = 0; i < 90; i++) bits.push({ x:Math.random()*W, y:-20-Math.random()*H*0.4, r:3+Math.random()*4, vy:2+Math.random()*3, vx:-1.5+Math.random()*3, c:cols[i%cols.length], a:1 });
    var t0 = Date.now();
    (function frame(){
      ctx.clearRect(0,0,W,H); var el = Date.now()-t0;
      bits.forEach(function(b){ b.x+=b.vx; b.y+=b.vy; b.vy+=0.03; if(el>1600) b.a=Math.max(0,b.a-0.03); ctx.globalAlpha=b.a; ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,7); ctx.fill(); });
      if(el < 2400 && rankModal.classList.contains('show')) requestAnimationFrame(frame); else ctx.clearRect(0,0,W,H);
    })();
  }
  checkRankUp();

  /* ---- Journey Recap (shareable stats snapshot) ---- */
  var recapModal = document.getElementById('p2pj-recap');
  function openRecap(){
    if(!recapModal || !window.P2P) return;
    var P = window.P2P, s = P.streak ? P.streak() : { longest:0 }, t = P.tier ? P.tier() : { name:'Dreamer' };
    var set = function(sel, val){ var el = recapModal.querySelector(sel); if(el) el.textContent = val; };
    set('[data-rc-tier]', t.name);
    set('[data-rc-points]', P.points());
    set('[data-rc-courses]', P.coursesDone());
    set('[data-rc-badges]', badgeCount());
    set('[data-rc-streak]', (s.longest || s.count || 0));
    set('[data-rc-active]', P.daysActive ? P.daysActive() : (s.longest || 0));
    recapModal.classList.add('show');
  }
  root.querySelectorAll('[data-recap]').forEach(function(b){ b.addEventListener('click', openRecap); });
  if(recapModal){
    var rx = recapModal.querySelector('[data-recap-close]'); if(rx) rx.addEventListener('click', function(){ recapModal.classList.remove('show'); });
    recapModal.addEventListener('click', function(e){ if(e.target === recapModal) recapModal.classList.remove('show'); });
    var shareBtn = recapModal.querySelector('[data-recap-share]');
    if(shareBtn) shareBtn.addEventListener('click', function(){
      var P = window.P2P; if(!P) return;
      var s = P.streak ? P.streak() : { longest:0, count:0 }, t = P.tier ? P.tier() : { name:'Dreamer' };
      var text = "I'm a " + t.name + " on my Purpose 2 Profit journey — " + P.points() + " points, " + P.coursesDone() + " courses done, " + badgeCount() + " badges, and a " + (s.longest || s.count || 0) + "-day best streak. ✦";
      var url = window.location.origin;
      function flash(msg){ var o = shareBtn.innerHTML; shareBtn.innerHTML = msg; shareBtn.disabled = true; setTimeout(function(){ shareBtn.innerHTML = o; shareBtn.disabled = false; }, 1800); }
      if(navigator.share){
        navigator.share({ title:'My Purpose 2 Profit Journey', text:text, url:url }).catch(function(){});
      } else if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text + ' ' + url).then(function(){ flash('Copied to clipboard ✓'); }).catch(function(){ flash('Copy failed'); });
      } else {
        var ta = document.createElement('textarea'); ta.value = text + ' ' + url; document.body.appendChild(ta); ta.select();
        try{ document.execCommand('copy'); flash('Copied to clipboard ✓'); }catch(e){ flash('Copy failed'); } document.body.removeChild(ta);
      }
    });
  }

  /* ---- Guided tour (spotlight walkthrough of the live page) ---- */
  (function(){
    var tour = document.getElementById('p2pj-tour'); if(!tour) return;
    var spot = tour.querySelector('[data-tour-spot]'), pop = tour.querySelector('[data-tour-pop]');
    var elCount = tour.querySelector('[data-tour-count]'), elTitle = tour.querySelector('[data-tour-title]'), elBody = tour.querySelector('[data-tour-body]');
    var btnBack = tour.querySelector('[data-tour-back]'), btnNext = tour.querySelector('[data-tour-next]'), btnSkip = tour.querySelector('[data-tour-skip]');
    var STEPS = [
      { center:true, title:'Welcome aboard!', body:"Here's a quick tour of your Learning Journey — about a minute. Tap Next, or Skip anytime." },
      { sel:'.stats', scroll:'top', title:'Your live stats', body:'Points, badges, streak and your Merit rank — always in view, updating as you go.' },
      { sel:'.board', scroll:'center', title:'Your map', body:'This is your trail. Every glowing marker is a course, and finishing one lights the path to the next.' },
      { sel:'.hs[data-type="course"]', scroll:'center', title:'Starting a course', body:'Tap a glowing marker to open that course. Inside, check off each lesson as you finish it — that is what lights up the trail to the next one.' },
      { sel:'.hs.is-locked', scroll:'center', title:'Locked courses', body:'A lock means it is not open yet. Tap it and it tells you exactly which course to finish first to unlock it — so you always know your next step.' },
      { sel:'.hs--plain', scroll:'center', title:'Hidden gems', body:'Watch for wooden signs like this along the trail — they reveal your frameworks (RAFT, GROWS, ROOTED). Little gems that tie the whole journey together.' },
      { sel:'.mindset-moment', scroll:'center', title:'Daily Boosters', body:'A fresh Heart, Purpose or Mindset booster every day to start you off right.' },
      { sel:'.nav', scroll:'top', title:'Getting around', body:'These tabs move you between your map, all courses, progress, status checks and journal.' },
      { sel:'.nav a[data-panel="directory"]', scroll:'top', title:'All Courses', body:'Jump straight to any course across every realm — no hunting on the map.' },
      { sel:'.nav a[data-panel="progress"]', scroll:'top', title:'Your Progress', body:'Points, badges, streak and Merit rank. Tap any tile there for the full breakdown.' },
      { sel:'.nav a[data-panel="bonuses"]', scroll:'top', title:'Status Checks', body:'Quick Mindset, Purpose & Heart check-ins to keep you steady between courses.' },
      { sel:'.nav a[href*="badges"]', scroll:'top', title:'Milestones', body:'Every badge you earn lives here — realms cleared, streaks, reflections and more.' },
      { sel:'.nav a[data-panel="journal"]', scroll:'top', title:'Journal', body:'Jot notes and reflections as you go. Your first entry each day earns points too.' },
      { sel:'.p2pj-nextrealm', scroll:'center', title:'On to the next realm', body:'Clear a realm and this doorway opens — tap it to sail on to the next realm and keep your momentum going.' },
      { sel:'#p2phelp .p2ph-launch', doc:true, scroll:'center', title:'Need a hand?', body:'Stuck at any point? Tap the Need help? button and the Haus Helper answers the most common questions in a click.' },
      { sel:'.p2pj-totop', doc:true, scroll:'center', title:'Back to the top', body:'And this arrow whisks you straight back to the top of your map — handy on a long scroll.' },
      { center:true, title:"You're all set!", body:'Tap any glowing marker to begin. Replay this tour anytime from the ⓘ Help menu. Enjoy the journey!' }
    ];
    var i = 0, active = STEPS, curTarget = null;
    // some steps point at fixed widgets outside #p2pj (the Help launcher, back-to-top)
    function q(s){ return s.doc ? document.querySelector(s.sel) : root.querySelector(s.sel); }
    function vis(el){ if(!el || el.hidden) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
    function chrome(){
      var s = active[i];
      elCount.textContent = (i+1) + ' of ' + active.length;
      elTitle.textContent = s.title; elBody.textContent = s.body;
      btnBack.style.visibility = i === 0 ? 'hidden' : 'visible';
      btnNext.textContent = (i === active.length - 1) ? 'Done' : 'Next';
    }
    function reposition(){
      var s = active[i];
      if(!curTarget){ tour.classList.add('center'); spot.style.display = 'none'; pop.classList.add('at-center'); pop.style.left = ''; pop.style.top = ''; return; }
      tour.classList.remove('center'); spot.style.display = 'block'; pop.classList.remove('at-center');
      var r = curTarget.getBoundingClientRect(), pad = 8;
      spot.style.left = (r.left - pad) + 'px'; spot.style.top = (r.top - pad) + 'px';
      spot.style.width = (r.width + pad*2) + 'px'; spot.style.height = (r.height + pad*2) + 'px';
      var pw = pop.offsetWidth, ph = pop.offsetHeight, m = 14, vw = window.innerWidth, vh = window.innerHeight;
      var top = (r.bottom + m + ph <= vh) ? (r.bottom + m) : Math.max(m, r.top - m - ph);
      var left = Math.max(m, Math.min(r.left + r.width/2 - pw/2, vw - pw - m));
      pop.style.left = left + 'px'; pop.style.top = top + 'px';
    }
    function place(){
      chrome();
      var s = active[i];
      curTarget = s.center ? null : q(s);
      if(!curTarget){ reposition(); return; }
      try{ curTarget.scrollIntoView({ behavior:'auto', block: s.scroll === 'top' ? 'start' : 'center', inline:'center' }); }catch(e){ curTarget.scrollIntoView(); }
      setTimeout(reposition, 300);
    }
    function start(){
      ['p2pj-welcome','p2pj-info'].forEach(function(id){ var m = document.getElementById(id); if(m) m.classList.remove('show'); });
      // force the back-to-top button visible so its step isn't filtered out when at the top
      var tt = root.querySelector('[data-totop]'); if(tt){ tt.hidden = false; tt.classList.add('show'); }
      active = STEPS.filter(function(s){ return s.center || vis(q(s)); });
      i = 0; tour.hidden = false; requestAnimationFrame(place);
    }
    function stop(){ tour.hidden = true; tour.classList.remove('center'); }
    function go(d){ var n = i + d; if(n < 0) return; if(n >= active.length){ stop(); return; } i = n; place(); }
    btnNext.addEventListener('click', function(){ go(1); });
    btnBack.addEventListener('click', function(){ go(-1); });
    btnSkip.addEventListener('click', stop);
    document.addEventListener('keydown', function(e){ if(tour.hidden) return; if(e.key === 'Escape') stop(); else if(e.key === 'ArrowRight') go(1); else if(e.key === 'ArrowLeft') go(-1); });
    window.addEventListener('resize', function(){ if(!tour.hidden) reposition(); });
    window.addEventListener('scroll', function(){ if(!tour.hidden && curTarget) reposition(); }, { passive:true });
    // Delegated so it fires no matter where the button lives (welcome pop-up, Help
    // menu, or markup rendered outside #p2pj) or when it renders.
    document.addEventListener('click', function(e){
      var b = e.target && e.target.closest ? e.target.closest('[data-tour-start]') : null;
      if(b){ e.preventDefault(); start(); }
    });
    // Deep-link: /pages/p2p-learning#tour (or ?tour=1) auto-opens the tour, so the
    // tutorial page's "guided tour" button can launch it directly.
    try{
      var _h = (location.hash || '').toLowerCase(), _q = (location.search || '').toLowerCase();
      if(_h === '#tour' || _q.indexOf('tour=1') > -1){ requestAnimationFrame(start); }
    }catch(e){}
  })();

  /* ---- back-to-top button (shows after scrolling; the tour points at it) ---- */
  (function(){
    var btn = root.querySelector('[data-totop]'); if(!btn) return;
    function upd(){ if(window.pageYOffset > 380){ btn.hidden = false; btn.classList.add('show'); } else { btn.classList.remove('show'); } }
    window.addEventListener('scroll', upd, { passive:true });
    btn.addEventListener('click', function(){ try{ window.scrollTo({ top:0, behavior:'smooth' }); }catch(e){ window.scrollTo(0,0); } });
    upd();
  })();

  /* ---- JS sticky bar (sits below the theme's own sticky header; ignores lock state) ---- */
  var bar = root.querySelector('.bar'), wrap = root.querySelector('.wrap');
  if(bar && wrap){
    var spacer = document.createElement('div'); spacer.className = 'p2pj-barspacer';
    bar.parentNode.insertBefore(spacer, bar);
    var fixed = false, MARGIN = 14;
    function headerOffset(){
      var set = parseInt(getComputedStyle(root).getPropertyValue('--p2pj-sticky') || '0', 10) || 0;
      if(set > 10) return set; // author set an explicit offset — respect it
      var h = 0;
      document.querySelectorAll('.shopify-section-group-header-group,[class*="header-sticky"],sticky-header,header').forEach(function(c){
        var cs = getComputedStyle(c);
        if(cs.position === 'sticky' || cs.position === 'fixed'){ var r = c.getBoundingClientRect(); if(r.top <= 2 && r.height > h && r.height < 320) h = r.height; }
      });
      return h ? Math.round(h) + 6 : (set || 6);
    }
    function shown(){ return bar.offsetParent !== null || fixed; }
    function place(off){ var wr = wrap.getBoundingClientRect(); bar.style.left = (wr.left + MARGIN) + 'px'; bar.style.width = (wr.width - MARGIN * 2) + 'px'; bar.style.top = off + 'px'; }
    function unstick(){ bar.classList.remove('p2pj-fixed'); fixed = false; spacer.style.height = '0'; bar.style.left = bar.style.width = bar.style.top = ''; }
    function sync(){
      if(!shown()){ if(fixed) unstick(); return; }      // never measure while the bar is hidden (e.g. mid-panel-swap)
      var off = headerOffset(); stickyOff = off;
      var refTop = fixed ? spacer.getBoundingClientRect().top : bar.getBoundingClientRect().top;
      if(!fixed && refTop <= off){ spacer.style.height = bar.offsetHeight + 'px'; bar.classList.add('p2pj-fixed'); fixed = true; place(off); }
      else if(fixed){ if(spacer.getBoundingClientRect().top >= off) unstick(); else place(off); }
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    window.addEventListener('load', sync);
    sync();
  }
})();
