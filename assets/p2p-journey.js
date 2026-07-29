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

  /* ---- access gate (access code / tag) ---- */
  var code = (root.getAttribute('data-code') || '').trim().toLowerCase();
  var storeKey = 'p2p_access_' + (root.getAttribute('data-slug') || 'p2p-learning');

  function unlock(persist){
    if(persist){ try{ localStorage.setItem(storeKey,'1'); }catch(e){} }
    root.setAttribute('data-locked','false');
  }
  // server said locked, but this browser may have already redeemed the code
  if(root.getAttribute('data-locked') === 'true'){
    try{ if(localStorage.getItem(storeKey) === '1') unlock(false); }catch(e){}
  }
  var form = document.getElementById('p2pj-codeform');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var input = document.getElementById('p2pj-code');
      var err = document.getElementById('p2pj-gerr');
      var val = (input.value || '').trim().toLowerCase();
      if(val && code && val === code){ err.textContent=''; unlock(true); window.scrollTo(0,0); }
      else { err.textContent = 'That code isn’t right. Check it and try again.'; }
    });
  }

  /* ---- welcome pop-up ---- */
  var welcome = document.getElementById('p2pj-welcome');
  if(welcome){
    var wkey = 'p2p_welcome_dismissed';
    var seen = false; try{ seen = localStorage.getItem(wkey) === '1'; }catch(e){}
    // only greet once the board is actually visible
    if(!seen && root.getAttribute('data-locked') !== 'true') welcome.classList.add('show');
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

  /* ---- info modal (hotspots) ---- */
  var modal = document.getElementById('p2pj-modal');
  var kick = {course:'Course', framework:'Framework', sidequest:'Bonus · Side Quest', info:'Getting Started'};
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
  function closeModal(){ modal.classList.remove('show'); }
  /* ---- Journey Begins onboarding ---- */
  var begin = document.getElementById('p2pj-begin');
  function beginStep(name){ if(!begin) return; begin.querySelectorAll('.step').forEach(function(s){ s.classList.toggle('on', s.getAttribute('data-step') === name); }); var bc = begin.querySelector('.bc'); if(bc) bc.scrollTop = 0; }
  if(begin){
    begin.querySelectorAll('[data-go]').forEach(function(b){ b.addEventListener('click', function(){
      // "Yes, I've completed my Brand DNA Blueprint" self-attests the Founder Fingerprint badge.
      // (At launch this is superseded by reading the shared Brand DNA metafield directly.)
      if(b.hasAttribute('data-dna-done') && window.P2P) window.P2P.earnBadge('Founder Fingerprint');
      beginStep(b.getAttribute('data-go'));
    }); });
    var bbx = begin.querySelector('.bx'); if(bbx) bbx.addEventListener('click', function(){ begin.classList.remove('show'); });
    begin.addEventListener('click', function(e){ if(e.target === begin) begin.classList.remove('show'); });
  }

  root.querySelectorAll('.hs').forEach(function(h){
    h.addEventListener('click', function(){
      if(h.hasAttribute('data-begin') && begin){ beginStep('welcome1'); begin.classList.add('show'); return; }
      // opening a framework sign counts toward the Trail Explorer badge
      if(h.getAttribute('data-type') === 'framework' && window.P2P){
        var t = (h.getAttribute('data-title') || '').toUpperCase();
        var key = t.indexOf('RAFT') > -1 ? 'raft' : t.indexOf('GROWS') > -1 ? 'grows' : t.indexOf('ROOTED') > -1 ? 'rooted' : '';
        if(key) window.P2P.markSign(key);
      }
      openModal(h);
    });
  });
  if(modal){
    document.getElementById('p2pj-mx').addEventListener('click', closeModal);
    modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });
    var mc = document.getElementById('p2pj-mc');
    mc.addEventListener('click', function(e){ if(!mc.getAttribute('href')) closeModal(); });
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

  /* ---- bonus cards open the side-quest modal ---- */
  root.querySelectorAll('.bqcard').forEach(function(c){ c.addEventListener('click', function(){ openModal(c); }); });

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
      if(!shown()){ if(fixed) unstick(); return; }      // never measure while the board is locked/hidden
      var off = headerOffset();
      var refTop = fixed ? spacer.getBoundingClientRect().top : bar.getBoundingClientRect().top;
      if(!fixed && refTop <= off){ spacer.style.height = bar.offsetHeight + 'px'; bar.classList.add('p2pj-fixed'); fixed = true; place(off); }
      else if(fixed){ if(spacer.getBoundingClientRect().top >= off) unstick(); else place(off); }
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    window.addEventListener('load', sync);
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-locked'] }); // re-run when unlocked
    sync();
  }
})();
