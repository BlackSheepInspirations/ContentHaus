/* Purpose 2 Profit — Learning Journey (journey map page) */
(function(){
  var root = document.getElementById('p2pj');
  if(!root) return;

  /* ---- live stats (from the shared progress engine) ---- */
  if(window.P2P){
    var streak = window.P2P.streak().count;
    root.querySelectorAll('.p2pj-streak').forEach(function(el){ el.textContent = streak; });
    root.querySelectorAll('.p2pj-points').forEach(function(el){ el.textContent = window.P2P.points(); });
    root.querySelectorAll('.p2pj-level').forEach(function(el){ el.textContent = window.P2P.level(); });

    // Badges — use the accurate count the badges page published; fall back to auto-earned
    var bstat = window.P2P.badgesStat();
    var badges = bstat ? bstat.earned : window.P2P.earnedSet().length;
    root.querySelectorAll('.p2pj-badges').forEach(function(el){ el.textContent = badges; });

    // Courses done + % complete ring, against this board's course count
    var boardCourses = parseInt(root.getAttribute('data-board-courses'), 10) || 5;
    var done = Math.min(window.P2P.coursesDone(), boardCourses);
    var pct = boardCourses ? Math.round(done / boardCourses * 100) : 0;
    root.querySelectorAll('.p2pj-courses').forEach(function(el){ el.textContent = done; });
    root.querySelectorAll('.p2pj-ring').forEach(function(el){ el.style.setProperty('--p', pct); });
    root.querySelectorAll('.p2pj-ringpct').forEach(function(el){ el.textContent = pct + '%'; });
  }

  /* ---- Mindset Moment (one item per day, rotating through the whole library) ---- */
  var mm = document.getElementById('p2pj-moment');
  if(mm && window.P2P_MOMENTS && window.P2P_MOMENTS.length){
    var day = Math.floor(Date.now() / 864e5);              // days since epoch
    var item = window.P2P_MOMENTS[day % window.P2P_MOMENTS.length];
    if(item && item.t){
      var mt = mm.querySelector('.mm-text'), ms = mm.querySelector('.mm-source');
      if(mt) mt.textContent = '“' + item.t + '”';
      if(ms) ms.textContent = item.s || '';
      mm.hidden = false;
    }
  }

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

  function nodeState(h){
    if(h.hasAttribute('data-begin')) return onboardingDone() ? 'done' : 'available'; // entry point — never locked
    var type = h.getAttribute('data-type');
    if(type === 'check') return 'available'; // never locked
    var handle = h.getAttribute('data-handle');
    if(window.P2P && handle && window.P2P.isCourseDone(handle)) return 'done';
    if(type === 'offshoot'){
      var hub = h.getAttribute('data-unlock-after');
      var hubDone = !hub || (window.P2P && window.P2P.isCourseDone(hub));
      return hubDone ? 'available' : 'locked';
    }
    // Main course
    return (introRequired && !onboardingDone()) ? 'locked' : 'available';
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
  function lockReason(h){
    if(h.getAttribute('data-type') === 'offshoot'){
      var hub = h.getAttribute('data-unlock-after');
      return hub ? ('Complete "' + hub.replace(/-/g, ' ') + '" to unlock this.') : 'Locked for now.';
    }
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
    document.getElementById('p2pj-ct').textContent = h.getAttribute('data-title') || '';
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
  function showPanel(name){
    root.querySelectorAll('.panel').forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-panel') === name); });
    if(board) board.style.display = (name === 'journey') ? '' : 'none';
    root.querySelectorAll('.nav a[data-panel]').forEach(function(x){ x.classList.toggle('on', x.getAttribute('data-panel') === name); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  /* ---- journal tabs (Reflections / Wins) ---- */
  root.querySelectorAll('.jr-tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      var mode = tab.getAttribute('data-jrmode');
      root.querySelectorAll('.jr-tab').forEach(function(t){ t.classList.toggle('on', t === tab); });
      root.querySelectorAll('.jr-pane').forEach(function(p){ p.hidden = (p.getAttribute('data-jrpane') !== mode); });
    });
  });

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

  /* ---- notebooks (Reflections & Wins): titles, search, archive, 60-day trash ---- */
  var SIXTY = 60 * 864e5;
  function jrEsc(s){ return (s || '').replace(/[&<>]/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;' }[c]; }); }
  function initNotebook(pane){
    var key = pane.getAttribute('data-store'), kind = pane.getAttribute('data-kind');
    var listEl = pane.querySelector('[data-jr-list]'), titleIn = pane.querySelector('[data-jr-title]');
    var textIn = pane.querySelector('[data-jr-text]'), promptIn = pane.querySelector('[data-jr-prompt]');
    var searchIn = pane.querySelector('[data-jr-search]'), saveBtn = pane.querySelector('[data-jr-save]');
    var view = 'active', query = '';
    function load(){ try{ return JSON.parse(localStorage.getItem(key) || '[]') || []; }catch(e){ return []; } }
    function save(a){ try{ localStorage.setItem(key, JSON.stringify(a)); }catch(e){} }
    function normalize(){
      var a = load(), ch = false, now = Date.now();
      a.forEach(function(e){
        if(!e.id){ e.id = String(e.ts || Date.now()) + '-' + Math.random().toString(36).slice(2,7); ch = true; }
        if(e.title === undefined){ e.title = ''; ch = true; }
        if(e.archived === undefined){ e.archived = false; ch = true; }
        if(e.deletedAt === undefined){ e.deletedAt = null; ch = true; }
      });
      var b = a.filter(function(e){ return !(e.deletedAt && (now - e.deletedAt) > SIXTY); });
      if(b.length !== a.length) ch = true;
      if(ch) save(b);
      return b;
    }
    function fmt(ts){ return new Date(ts).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }); }
    function daysLeft(t){ return Math.max(0, Math.ceil((SIXTY - (Date.now() - t)) / 864e5)); }
    function setField(id, f, v){ var a = load(), e = a.filter(function(x){ return x.id === id; })[0]; if(e){ e[f] = v; save(a); render(); } }
    function removeEntry(id){ save(load().filter(function(x){ return x.id !== id; })); render(); }
    function switchView(v){ view = v; pane.querySelectorAll('.jr-view').forEach(function(x){ x.classList.toggle('on', x.getAttribute('data-jr-view') === v); }); render(); }
    function render(){
      var a = normalize(), q = query.trim().toLowerCase();
      var rows = a.filter(function(e){
        if(view === 'trash') return !!e.deletedAt;
        if(e.deletedAt) return false;
        return view === 'archived' ? !!e.archived : !e.archived;
      }).filter(function(e){
        if(!q) return true;
        return ((e.title || '') + ' ' + (e.text || '') + ' ' + (e.prompt || '')).toLowerCase().indexOf(q) !== -1;
      });
      if(!rows.length){
        var msg = view === 'trash' ? 'Trash is empty.' : view === 'archived' ? 'Nothing archived.'
          : q ? 'No matches.' : (kind === 'win' ? 'No wins logged yet. Every accomplishment counts — start with one.' : 'No entries yet. Your reflections will appear here.');
        listEl.innerHTML = '<div class="jr-empty">' + msg + '</div>'; return;
      }
      listEl.innerHTML = rows.map(function(e){
        var meta = (kind === 'win' ? '🏆 ' : '') + fmt(e.ts) + (view === 'trash' ? ' · ' + daysLeft(e.deletedAt) + ' days left' : '');
        return '<div class="jr-entry' + (kind === 'win' ? ' jr-win' : '') + '"><div class="je-top"><span class="je-date">' + meta + '</span><span class="je-acts" data-id="' + e.id + '"></span></div>'
          + (e.title ? '<div class="je-title">' + jrEsc(e.title) + '</div>' : '')
          + (e.prompt ? '<div class="je-prompt">' + jrEsc(e.prompt) + '</div>' : '')
          + '<div class="je-text">' + jrEsc(e.text) + '</div></div>';
      }).join('');
      rows.forEach(function(e){
        var host = listEl.querySelector('.je-acts[data-id="' + e.id + '"]'); if(!host) return;
        function btn(cls, label){ var b = document.createElement('button'); b.className = 'je-btn ' + cls; b.textContent = label; host.appendChild(b); return b; }
        if(view === 'trash'){
          btn('je-restore', 'Restore').addEventListener('click', function(){ setField(e.id, 'deletedAt', null); switchView(e.archived ? 'archived' : 'active'); });
          btn('je-del', 'Delete forever').addEventListener('click', function(){ confirmDialog('Delete forever?', 'This permanently removes it — it can’t be undone.', 'Delete forever', function(){ removeEntry(e.id); }); });
        } else {
          btn('je-arch', e.archived ? 'Unarchive' : 'Archive').addEventListener('click', function(){ var na = !e.archived; setField(e.id, 'archived', na); if(!na) switchView('active'); });
          btn('je-del', 'Delete').addEventListener('click', function(){ confirmDialog('Move to Trash?', 'It’ll stay in Trash for 60 days — you can restore it any time before then.', 'Move to Trash', function(){ setField(e.id, 'deletedAt', Date.now()); }); });
        }
      });
    }
    if(saveBtn) saveBtn.addEventListener('click', function(){
      var text = (textIn.value || '').trim(); if(!text) return;
      var a = load();
      a.unshift({ id: String(Date.now()) + '-' + Math.random().toString(36).slice(2,7), ts: Date.now(), title: (titleIn ? titleIn.value : '').trim(), prompt: promptIn ? (promptIn.value || '') : '', text: text, archived: false, deletedAt: null });
      save(a); textIn.value = ''; if(titleIn) titleIn.value = ''; if(promptIn) promptIn.value = '';
      view = 'active'; pane.querySelectorAll('.jr-view').forEach(function(v){ v.classList.toggle('on', v.getAttribute('data-jr-view') === 'active'); });
      render();
      if(kind === 'reflection' && window.P2P){
        window.P2P.checkJournal(); window.P2P.addJournalPoint();
        root.querySelectorAll('.p2pj-points').forEach(function(el){ el.textContent = window.P2P.points(); });
        root.querySelectorAll('.p2pj-level').forEach(function(el){ el.textContent = window.P2P.level(); });
        if(window.P2P_celebrate) window.P2P_celebrate();
      }
    });
    if(searchIn) searchIn.addEventListener('input', function(){ query = searchIn.value; render(); });
    pane.querySelectorAll('.jr-view').forEach(function(v){ v.addEventListener('click', function(){ view = v.getAttribute('data-jr-view'); pane.querySelectorAll('.jr-view').forEach(function(x){ x.classList.toggle('on', x === v); }); render(); }); });
    render();
  }
  root.querySelectorAll('.jr-pane[data-store]').forEach(initNotebook);

  /* ---- export everything (both notebooks, active + archived) ---- */
  var exportAll = document.getElementById('p2pj-export-all');
  if(exportAll) exportAll.addEventListener('click', function(){
    function dump(key, label){
      var a = []; try{ a = JSON.parse(localStorage.getItem(key) || '[]') || []; }catch(e){}
      a = a.filter(function(e){ return !e.deletedAt; });
      if(!a.length) return '';
      return '\n=== ' + label + ' ===\n\n' + a.map(function(e){
        return new Date(e.ts).toLocaleString() + (e.title ? '\n' + e.title : '') + (e.prompt ? '\n[' + e.prompt + ']' : '') + '\n' + e.text + '\n\n----------\n';
      }).join('\n');
    }
    var body = dump('p2p_journal', 'Reflections') + dump('p2p_wins', 'Wins & Accomplishments');
    if(!body.trim()) return;
    var blob = new Blob(['Purpose 2 Profit — Journal Export\n' + body], { type: 'text/plain' });
    var url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'P2P-Journal-Export.txt'; link.click(); URL.revokeObjectURL(url);
  });

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
      var off = headerOffset();
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
