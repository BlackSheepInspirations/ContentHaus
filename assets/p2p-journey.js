/* Purpose 2 Profit — Learning Journey (journey map page) */
(function(){
  var root = document.getElementById('p2pj');
  if(!root) return;

  /* ---- live stats (from the shared progress engine) ---- */
  if(window.P2P){
    window.P2P.earnBadge('Set Sail'); // reaching the (gated) journey means you've set sail
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
  function markOnboardingDone(){ try{ localStorage.setItem(INTRO_KEY, '1'); }catch(e){} }
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
      var type = nodeType(h);
      var state = nodeState(h);
      var cs = document.createElement('div');
      cs.className = 'cs';
      cs.style.left = h.style.left;
      cs.style.top = h.style.top;
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
      if(a.hasAttribute('data-panel')){ e.preventDefault(); showPanel(a.getAttribute('data-panel')); }
      // Milestones is a real link (navigates); info is handled separately
    });
  });

  /* ---- bonus cards (Checks) open the pulse-check popup ---- */
  root.querySelectorAll('.bqcard').forEach(function(c){ c.addEventListener('click', function(){ openCheck(c); }); });

  /* ---- journal (localStorage; export to keep a copy) ---- */
  var jList = document.getElementById('p2pj-jr-list');
  if(jList){
    var jKey = 'p2p_journal';
    function jLoad(){ try{ return JSON.parse(localStorage.getItem(jKey) || '[]') || []; }catch(e){ return []; } }
    function jSaveAll(a){ try{ localStorage.setItem(jKey, JSON.stringify(a)); }catch(e){} }
    function esc(s){ return (s || '').replace(/[&<>]/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;' }[c]; }); }
    function jRender(){
      var a = jLoad();
      var cnt = document.getElementById('p2pj-jr-count'); if(cnt) cnt.textContent = a.length ? '(' + a.length + ')' : '';
      if(!a.length){ jList.innerHTML = '<div class="jr-empty">No entries yet. Your reflections will appear here.</div>'; return; }
      jList.innerHTML = a.map(function(e, i){
        var d = new Date(e.ts).toLocaleString(undefined, { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' });
        return '<div class="jr-entry"><div class="je-top"><span class="je-date">' + d + '</span><button class="je-del" data-i="' + i + '">Delete</button></div>'
          + (e.prompt ? '<div class="je-prompt">' + esc(e.prompt) + '</div>' : '')
          + '<div class="je-text">' + esc(e.text) + '</div></div>';
      }).join('');
      jList.querySelectorAll('.je-del').forEach(function(b){ b.addEventListener('click', function(){ var a2 = jLoad(); a2.splice(+b.getAttribute('data-i'), 1); jSaveAll(a2); jRender(); }); });
    }
    var jt = document.getElementById('p2pj-jr-text'), jp = document.getElementById('p2pj-jr-prompt');
    var jsave = document.getElementById('p2pj-jr-save'), jexp = document.getElementById('p2pj-jr-export');
    if(jsave) jsave.addEventListener('click', function(){
      var text = (jt.value || '').trim(); if(!text) return;
      var a = jLoad(); a.unshift({ ts: Date.now(), prompt: jp.value || '', text: text }); jSaveAll(a);
      jt.value = ''; jRender();
      if(window.P2P){
        window.P2P.checkJournal();     // First Reflection / Journal Keeper / Devotee
        window.P2P.addJournalPoint();  // +points (capped 5/day)
        root.querySelectorAll('.p2pj-points').forEach(function(el){ el.textContent = window.P2P.points(); });
        root.querySelectorAll('.p2pj-level').forEach(function(el){ el.textContent = window.P2P.level(); });
      }
    });
    if(jexp) jexp.addEventListener('click', function(){
      var a = jLoad(); if(!a.length) return;
      var body = a.map(function(e){ var d = new Date(e.ts).toLocaleString(); return d + (e.prompt ? '\n[' + e.prompt + ']' : '') + '\n' + e.text + '\n\n----------\n'; }).join('\n');
      var blob = new Blob(['Purpose 2 Profit — Journal\n\n' + body], { type: 'text/plain' });
      var url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = 'P2P-Journal.txt'; link.click(); URL.revokeObjectURL(url);
    });
    jRender();
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
