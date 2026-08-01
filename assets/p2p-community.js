/* Purpose 2 Profit — Community: Wall feed + sidebar Wins spotlight + counts + invite.
   /apps/p2p/community (wall), /apps/p2p/react (loves), /apps/p2p/members (counts).
   Wall = a growing vertical feed. Wins = a small rotating spotlight in the sidebar.
   Also wires the "Help us be better" box (now on the Members view). Scoped to #p2pos. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var wrap = root.querySelector('[data-cw]');
  var PROXY = '/apps/p2p/community', REACT = '/apps/p2p/react', MEMBERS = '/apps/p2p/members';
  var feed = root.querySelector('[data-cw-feed]');
  var winsFeed = root.querySelector('[data-wins-feed]');
  var ta = wrap ? wrap.querySelector('[data-cw-text]') : null;
  var postBtn = wrap ? wrap.querySelector('[data-cw-post]') : null;
  var posts = [], winIdx = 0, winTimer = null, welcomeProfileDone = false, wowId = null, isAdmin = false;

  function myName() { return (window.P2P_MEMBER_NAME || '').trim().toLowerCase(); }
  function setWc(k, on) { var el = root.querySelector('[data-wc="' + k + '"]'); if (el) el.classList.toggle('done', !!on); }
  function updateWelcome() {
    if (!root.querySelector('[data-welcome]')) return;
    var nm = myName();
    var mineIs = function (kindWin) { return nm && posts.some(function (p) { return (kindWin ? p.kind === 'win' : p.kind !== 'win') && String(p.name || '').trim().toLowerCase() === nm; }); };
    setWc('tour', localStorage.getItem('p2p_wc_tour') === '1');
    setWc('profile', localStorage.getItem('p2p_wc_profile') === '1' || welcomeProfileDone);
    setWc('hello', localStorage.getItem('p2p_wc_hello') === '1' || mineIs(false));
    setWc('win', localStorage.getItem('p2p_wc_win') === '1' || mineIs(true));
  }
  var TOUR = [
    { emoji: '🐑', title: 'Welcome to the Community', body: 'This is the Haus — where the flock builds together. Here\'s the 30-second tour.' },
    { emoji: '💬', title: 'The Wall', body: 'Share a win, ask a question, or drop some encouragement. React with ❤ 👍 🎉 and reply to anyone.' },
    { emoji: '🏆', title: 'Wins & Win of the Week', body: 'Post wins here or from your Notebook. The most-loved win each week gets pinned to the top in gold.' },
    { emoji: '🌱', title: 'The Growth Board', body: 'Earn points and badges, climb the ranks, and keep your 🔥 streak alive by showing up.' },
    { emoji: '📍', title: 'Where\'s the Flock', body: 'See creators all over the map. Tap any pin to meet the maker behind it.' },
    { emoji: '📅', title: 'Events', body: 'Upcoming live classes show in the sidebar and on the calendar — never miss one.' },
    { emoji: '🎉', title: 'You\'re ready!', body: 'Say hello on the wall to finish your welcome. We\'re so glad you\'re here.' }
  ];
  function openTour() {
    var i = 0, pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    document.body.appendChild(pop);
    function finish() { try { localStorage.setItem('p2p_wc_tour', '1'); } catch (e) {} updateWelcome(); pop.remove(); }
    function draw() {
      var s = TOUR[i];
      pop.innerHTML = '<div class="osx-cal-pop-in osx-tour-in"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
        '<div class="osx-tour-emoji">' + s.emoji + '</div>' +
        '<div class="osx-tour-title">' + esc(s.title) + '</div>' +
        '<div class="osx-tour-body">' + esc(s.body) + '</div>' +
        '<div class="osx-tour-dots">' + TOUR.map(function (_, k) { return '<span class="' + (k === i ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
        '<div class="osx-tour-nav">' + (i > 0 ? '<button class="osx-tour-back" type="button">Back</button>' : '<span></span>') +
        '<button class="osx-tour-next" type="button">' + (i === TOUR.length - 1 ? 'Let\'s go 🎉' : 'Next →') + '</button></div></div>';
      pop.querySelector('.osx-cal-pop-x').addEventListener('click', finish);
      var back = pop.querySelector('.osx-tour-back'); if (back) back.addEventListener('click', function () { i--; draw(); });
      pop.querySelector('.osx-tour-next').addEventListener('click', function () { if (i === TOUR.length - 1) finish(); else { i++; draw(); } });
    }
    pop.addEventListener('click', function (e) { if (e.target === pop) finish(); });
    draw();
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function empty(m) { return '<div class="osx-cw-empty">' + m + '</div>'; }
  function ago(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24); if (d < 7) return d + 'd ago';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  var RTYPES = [['love', '❤'], ['thumb', '👍'], ['party', '🎉']];
  function rcount(p, t) { return (p.reactions && p.reactions[t] != null) ? p.reactions[t] : (t === 'love' ? (p.likes || 0) : 0); }
  function ron(p, t) { return p.mine ? !!p.mine[t] : (t === 'love' && !!p.liked); }
  function rbtn(p, t, emoji) { return '<button class="osx-react-b' + (ron(p, t) ? ' on' : '') + '" data-react="' + esc(p.id) + '" data-rtype="' + t + '" type="button" aria-label="React ' + t + '">' + emoji + ' <span>' + rcount(p, t) + '</span></button>'; }
  function reactBar(p) { return '<div class="osx-react">' + RTYPES.map(function (r) { return rbtn(p, r[0], r[1]); }).join('') + '</div>'; }
  function loveChip(p) { return rbtn(p, 'love', '❤'); }
  function myStreak() { var P = window.P2P || {}; return (P.streak ? (P.streak().count || 0) : 0); }
  function flame(n) { n = +n || 0; return n >= 2 ? '<span class="osx-flame" title="' + n + '-day streak">🔥' + n + '</span>' : ''; }
  function houseTag(p) { return p.house ? '<span class="osx-house-tag">✦ Haus</span>' : ''; }
  function cmItem(c) { return '<div class="osx-cm-item"><b>' + esc(c.name || 'Member') + '</b><span class="osx-cm-time">' + ago(c.ts) + '</span><div class="osx-cm-text">' + esc(c.text) + '</div></div>'; }
  function commentsHTML(p) {
    var cs = p.comments || [];
    return '<div class="osx-cm" data-cm="' + esc(p.id) + '" hidden>' +
      '<div class="osx-cm-list">' + cs.map(cmItem).join('') + '</div>' +
      '<div class="osx-cm-add"><input class="osx-cm-input" data-cm-input="' + esc(p.id) + '" maxlength="600" placeholder="Write a reply…"><button class="osx-cm-send" type="button" data-cm-send="' + esc(p.id) + '">Reply</button></div>' +
    '</div>';
  }
  function actsHTML(p, withReport) {
    return '<div class="osx-cw-post-acts">' + reactBar(p) +
      '<button class="osx-cw-cbtn" type="button" data-ctoggle="' + esc(p.id) + '">💬 <span>' + ((p.comments || []).length) + '</span></button>' +
      (withReport ? '<button class="osx-cw-report" type="button" data-report="' + esc(p.id) + '" title="Report this post" aria-label="Report post">⚑</button>' : '') +
    '</div>';
  }
  function confetti() {
    var c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3000;';
    document.body.appendChild(c);
    var ctx = c.getContext('2d'), W = c.width = window.innerWidth, H = c.height = window.innerHeight;
    var cols = ['#f4c534', '#e0457b', '#39c5c0', '#8f6fd6', '#f4e2a6'], parts = [];
    for (var i = 0; i < 130; i++) parts.push({ x: W / 2 + (Math.random() - .5) * 160, y: H / 3, vx: (Math.random() - .5) * 9, vy: Math.random() * -10 - 4, r: Math.random() * 6 + 3, c: cols[i % cols.length], a: 1, rot: Math.random() * 6 });
    var t0 = Date.now();
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) { p.vy += .3; p.x += p.vx; p.y += p.vy; p.rot += .16; p.a -= .008; ctx.save(); ctx.globalAlpha = Math.max(0, p.a); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); ctx.restore(); });
      if (Date.now() - t0 < 2300) requestAnimationFrame(frame); else c.remove();
    })();
  }
  function wins() { return posts.filter(function (p) { return p.kind === 'win'; }); }
  function general() { return posts.filter(function (p) { return p.kind !== 'win'; }); }
  function stopTimer() { if (winTimer) { clearInterval(winTimer); winTimer = null; } }

  function titleHTML(p) { return p.title ? '<div class="osx-cw-post-title">' + esc(p.title) + '</div>' : ''; }
  function pinBtn(p) {
    if (isAdmin) return '<button class="osx-pin-btn' + (p.pinned ? ' on' : '') + '" type="button" data-pin="' + esc(p.id) + '" title="' + (p.pinned ? 'Unpin' : 'Pin to top') + '">📌</button>';
    return p.pinned ? '<span class="osx-pin-badge" title="Pinned">📌</span>' : '';
  }
  function postHTML(p) {
    var lng = (p.text || '').length > 280;
    return '<div class="osx-cw-post' + (p.house ? ' house' : '') + (p.pinned ? ' pinned' : '') + '">' +
      '<div class="osx-cw-post-top"><b>' + esc(p.name || 'Member') + '</b>' + flame(p.streak) + houseTag(p) + pinBtn(p) + '<span class="osx-cw-time">' + ago(p.ts) + '</span></div>' +
      titleHTML(p) +
      '<div class="osx-cw-post-text' + (lng ? ' clamp' : '') + '">' + esc(p.text) + '</div>' +
      (lng ? '<button class="osx-cw-more" type="button" data-more>Read more ▾</button>' : '') +
      actsHTML(p, true) + commentsHTML(p) +
    '</div>';
  }
  function wowHTML(p) {
    return '<div class="osx-wow">' +
      '<div class="osx-wow-ribbon">🏆 Win of the Week</div>' +
      '<div class="osx-cw-post-top"><b>' + esc(p.name || 'Member') + '</b>' + flame(p.streak) + '<span class="osx-cw-time">' + ago(p.ts) + '</span></div>' +
      titleHTML(p) +
      '<div class="osx-cw-post-text">' + esc(p.text) + '</div>' +
      actsHTML(p, false) + commentsHTML(p) +
    '</div>';
  }
  function renderWall() {
    if (!feed) return;
    var items = general();
    var wow = wowId ? posts.filter(function (p) { return p.id === wowId; })[0] : null;
    if (!items.length && !wow) { feed.innerHTML = empty('Nothing here yet — be the first to say hello. 👋'); return; }
    feed.innerHTML = (wow ? wowHTML(wow) : '') + items.map(postHTML).join('');
    wireReacts(feed); wireComments(feed);
    feed.querySelectorAll('[data-pin]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-pin');
        var post = posts.filter(function (p) { return p.id === id; })[0];
        b.disabled = true;
        fetch('/apps/p2p/moderate', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: id, action: (post && post.pinned) ? 'unpin' : 'pin' }) })
          .then(function (r) { return r.json(); }).then(function (res) { if (res && res.ok) load(); else b.disabled = false; })
          .catch(function () { b.disabled = false; });
      });
    });
    feed.querySelectorAll('[data-more]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.previousElementSibling; if (!t) return;
        t.classList.toggle('clamp');
        b.textContent = t.classList.contains('clamp') ? 'Read more ▾' : 'Show less ▴';
      });
    });
    feed.querySelectorAll('[data-report]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        if (!window.confirm('Report this post to the team for review?')) return;
        var id = b.getAttribute('data-report');
        var post = posts.filter(function (p) { return p.id === id; })[0];
        var txt = post ? ('Reported wall post by ' + (post.name || 'Member') + ':\n\n"' + post.text + '"') : ('Reported post ' + id);
        b.disabled = true;
        fetch('/apps/p2p/suggest', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: txt, kind: 'Report' }) })
          .then(function (r) { return r.json(); }).then(function () { b.textContent = 'reported ✓'; })
          .catch(function () { b.disabled = false; });
      });
    });
  }
  function wireComments(container) {
    container.querySelectorAll('[data-ctoggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-ctoggle');
        var box = container.querySelector('[data-cm="' + id + '"]');
        if (box) { box.hidden = !box.hidden; if (!box.hidden) { var inp = box.querySelector('[data-cm-input]'); if (inp) inp.focus(); } }
      });
    });
    container.querySelectorAll('[data-cm-send]').forEach(function (b) {
      b.addEventListener('click', function () { submitComment(container, b.getAttribute('data-cm-send'), b); });
    });
    container.querySelectorAll('[data-cm-input]').forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submitComment(container, inp.getAttribute('data-cm-input'), null); } });
    });
  }
  function submitComment(container, id, btn) {
    var box = container.querySelector('[data-cm="' + id + '"]'); if (!box) return;
    var inp = box.querySelector('[data-cm-input]'); var text = (inp && inp.value || '').trim(); if (!text) return;
    if (btn) btn.disabled = true;
    fetch('/apps/p2p/comment', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: id, text: text, name: window.P2P_MEMBER_NAME || '' }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (btn) btn.disabled = false;
        if (res && res.ok && res.comment) {
          if (inp) inp.value = '';
          var list = box.querySelector('.osx-cm-list'); if (list) list.insertAdjacentHTML('beforeend', cmItem(res.comment));
          var pp = posts.filter(function (p) { return p.id === id; })[0];
          if (pp) { pp.comments = pp.comments || []; pp.comments.push(res.comment); var cnt = container.querySelector('[data-ctoggle="' + id + '"] span'); if (cnt) cnt.textContent = pp.comments.length; }
        }
      }).catch(function () { if (btn) btn.disabled = false; });
  }

  function renderWinsSide() {
    if (!winsFeed) return;
    var w = wins();
    if (!w.length) { stopTimer(); winsFeed.innerHTML = empty('No wins yet — share one from your Notebook → Wins. 🏆'); return; }
    if (winIdx >= w.length) winIdx = 0;
    var p = w[winIdx];
    winsFeed.innerHTML =
      '<div class="osx-wside">' +
        '<p class="osx-wside-text">' + esc(p.text) + '</p>' +
        '<div class="osx-wside-foot"><span class="osx-wside-by">' + esc(p.name || 'Member') + '</span>' + loveChip(p) + '</div>' +
      '</div>' +
      (w.length > 1 ? '<div class="osx-win-dots">' + w.map(function (_, i) { return '<span class="' + (i === winIdx ? 'on' : '') + '" data-win-dot="' + i + '"></span>'; }).join('') + '</div>' : '');
    wireReacts(winsFeed);
    winsFeed.querySelectorAll('[data-win-dot]').forEach(function (d) { d.addEventListener('click', function () { winIdx = +d.getAttribute('data-win-dot'); renderWinsSide(); }); });
    stopTimer();
    if (w.length > 1) winTimer = setInterval(function () { winIdx = (winIdx + 1) % wins().length; renderWinsSide(); }, 8000);
  }

  function setReactBtn(btn, on, count) {
    btn.classList.toggle('on', !!on);
    var c = btn.querySelector('span'); if (c) c.textContent = count;
  }
  function wireReacts(container) {
    container.querySelectorAll('[data-react]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.dataset.busy) return;
        var id = btn.getAttribute('data-react'), type = btn.getAttribute('data-rtype');
        var span = btn.querySelector('span');
        var wasOn = btn.classList.contains('on');
        var cur = parseInt(span ? span.textContent : '0', 10) || 0;
        // optimistic: flip immediately so it always feels responsive
        setReactBtn(btn, !wasOn, Math.max(0, cur + (wasOn ? -1 : 1)));
        btn.dataset.busy = '1';
        fetch(REACT, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: id, type: type }) })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            delete btn.dataset.busy;
            if (!res || !res.ok) { setReactBtn(btn, wasOn, cur); return; } // revert on failure
            // reconcile with server truth when it provides it; else keep the optimistic value
            var on = (res.mine && typeof res.mine[type] !== 'undefined') ? !!res.mine[type]
                   : (type === 'love' && typeof res.liked !== 'undefined') ? !!res.liked
                   : !wasOn;
            var cnt = (res.reactions && typeof res.reactions[type] !== 'undefined') ? res.reactions[type]
                    : (type === 'love' && typeof res.likes !== 'undefined') ? res.likes
                    : Math.max(0, cur + (wasOn ? -1 : 1));
            setReactBtn(btn, on, cnt);
            posts.forEach(function (p) {
              if (p.id !== id) return;
              if (res.reactions) p.reactions = res.reactions; else { p.reactions = p.reactions || {}; p.reactions[type] = cnt; }
              if (res.mine) p.mine = res.mine; else { p.mine = p.mine || {}; p.mine[type] = on; }
              if (typeof res.likes !== 'undefined') p.likes = res.likes;
              if (typeof res.liked !== 'undefined') p.liked = res.liked;
            });
          }).catch(function () { delete btn.dataset.busy; setReactBtn(btn, wasOn, cur); });
      });
    });
  }

  function render() { renderWall(); renderWinsSide(); updateWelcome(); }

  function load() {
    fetch(PROXY, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.guest) { stopTimer(); if (feed) feed.innerHTML = empty('Log in to see and share with the community.'); return; }
        posts = (j && j.posts) || []; wowId = (j && j.winOfWeek) || null; isAdmin = !!(j && j.isAdmin); render();
      })
      .catch(function () { if (feed) feed.innerHTML = empty('Couldn\'t load the wall just now — try again in a moment.'); });
  }

  function avatar(p) { return p.photo ? '<img src="' + esc(p.photo) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : esc((p.name || '?').trim().charAt(0).toUpperCase() || '🐑'); }

  function popup(inner) {
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' + inner + '</div>';
    document.body.appendChild(pop);
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
  }
  function badgePopup(label, emoji) {
    popup('<div class="osx-cal-pop-ban" style="font-size:40px;">' + esc(emoji || '🏅') + '</div>' +
      '<div class="osx-cal-pop-b"><div class="osx-cal-pop-t">' + esc(label) + '</div>' +
      '<div class="osx-cal-pop-meta">🏅 Badge earned</div>' +
      '<div class="osx-cal-pop-desc">Earn your own by showing up daily, finishing courses, and keeping your streak alive. See them all under Checkpoint → Badges.</div></div>');
  }
  function badgeChips(p) {
    var b = (p.recentBadges || []).slice(0, 3);
    if (!b.length) return '';
    return '<span class="osx-gb-badges">' + b.map(function (bd) {
      return '<button class="osx-gb-badge" type="button" data-badge="' + esc(bd.label) + '" data-bemoji="' + esc(bd.emoji || '🏅') + '" title="' + esc(bd.label) + '">' + esc(bd.emoji || '🏅') + '</button>';
    }).join('') + '</span>';
  }

  function renderGrowth(m) {
    var el = root.querySelector('[data-gb]'); if (!el) return;
    if (!m.length) { el.innerHTML = empty('No members yet.'); return; }
    var top = m.slice().sort(function (a, b) { return (b.points || 0) - (a.points || 0); }).slice(0, 10);
    el.innerHTML = top.map(function (p, i) {
      return '<div class="osx-gb-row"><span class="osx-gb-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span>' +
        '<span class="osx-gb-av">' + avatar(p) + '</span>' +
        '<span class="osx-gb-who"><span class="osx-gb-name">' + esc(p.name || 'Member') + '</span>' + (p.tier ? '<span class="osx-gb-tier">' + esc(p.tier) + '</span>' : '') + '</span>' +
        badgeChips(p) +
        '<span class="osx-gb-pts">' + (p.points || 0).toLocaleString() + '</span></div>';
    }).join('');
    el.querySelectorAll('[data-badge]').forEach(function (b) {
      b.addEventListener('click', function () { badgePopup(b.getAttribute('data-badge'), b.getAttribute('data-bemoji')); });
    });
  }

  function renderSpotlight(m) {
    var card = root.querySelector('[data-spotlight]'), body = root.querySelector('[data-spot-body]'); if (!card || !body) return;
    var pool = m.filter(function (x) { return x.quote || x.about || x.photo; });
    if (!pool.length) { card.hidden = true; return; }
    var p = pool[Math.floor(Math.random() * pool.length)];
    body.innerHTML = '<span class="osx-gb-av" style="width:44px;height:44px;font-size:16px;">' + avatar(p) + '</span>' +
      '<span><span class="osx-gb-name" style="font-size:14px;">' + esc(p.name || 'Member') + '</span>' +
      (p.tier ? '<span class="osx-gb-tier">' + esc(p.tier) + '</span>' : '') +
      (p.quote ? '<span class="osx-gb-tier" style="font-style:italic;margin-top:5px;color:#c9e6da;">“' + esc(p.quote) + '”</span>' : '') + '</span>';
    card.hidden = false;
  }

  function loadMembersData() {
    fetch(MEMBERS, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || j.guest) return;
      var m = j.members || [], now = Date.now();
      var mEl = root.querySelector('[data-count-members]'), aEl = root.querySelector('[data-count-active]');
      if (mEl) mEl.textContent = m.length;
      if (aEl) aEl.textContent = m.filter(function (x) { return x.ts && (now - x.ts) < 5 * 60 * 1000; }).length;
      var nm = myName();
      if (nm && m.some(function (x) { return String(x.name || '').trim().toLowerCase() === nm && (x.photo || x.quote || x.about); })) welcomeProfileDone = true;
      renderGrowth(m); renderSpotlight(m); updateWelcome();
    }).catch(function () {});
  }

  var tourItem = root.querySelector('[data-wc="tour"]');
  if (tourItem) { tourItem.style.cursor = 'pointer'; tourItem.addEventListener('click', openTour); }

  var inviteBtn = root.querySelector('[data-comm-invite]');
  if (inviteBtn) inviteBtn.addEventListener('click', function () {
    var url = location.origin + '/pages/p2p-os-preview';
    function done() { var t = inviteBtn.textContent; inviteBtn.textContent = 'Link copied ✓'; setTimeout(function () { inviteBtn.textContent = t; }, 2000); }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(done).catch(function () { window.prompt('Copy this invite link:', url); }); }
    else { window.prompt('Copy this invite link:', url); }
  });

  root.querySelectorAll('[data-go-members]').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = Array.prototype.slice.call(root.querySelectorAll('.osx-item')).filter(function (x) { return /^\s*Members\s*$/i.test((x.textContent || '').trim()); })[0]
        || Array.prototype.slice.call(root.querySelectorAll('.osx-item')).filter(function (x) { return /Members/i.test(x.textContent || ''); })[0];
      if (item) item.click();
    });
  });

  if (postBtn) postBtn.addEventListener('click', function () {
    var text = (ta && ta.value || '').trim(); if (!text) return;
    postBtn.disabled = true; postBtn.textContent = 'Posting…';
    fetch(PROXY, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: text, kind: 'post', name: window.P2P_MEMBER_NAME || '', streak: myStreak() }) })
      .then(function (r) { return r.json(); })
      .then(function (res) { postBtn.disabled = false; postBtn.textContent = 'Post'; if (res && res.ok) { ta.value = ''; try { localStorage.setItem('p2p_wc_hello', '1'); } catch (e) {} load(); } })
      .catch(function () { postBtn.disabled = false; postBtn.textContent = 'Post'; });
  });

  var winAdd = root.querySelector('[data-win-add]'), winBox = root.querySelector('[data-win-addbox]'),
      winText = root.querySelector('[data-win-addtext]'), winShare = root.querySelector('[data-win-share]');
  if (winAdd && winBox) winAdd.addEventListener('click', function () { winBox.hidden = !winBox.hidden; if (!winBox.hidden && winText) winText.focus(); });
  if (winShare) winShare.addEventListener('click', function () {
    var t = (winText && winText.value || '').trim(); if (!t) return;
    winShare.disabled = true; winShare.textContent = 'Sharing…';
    fetch(PROXY, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: t, kind: 'win', name: window.P2P_MEMBER_NAME || '', streak: myStreak() }) })
      .then(function (r) { return r.json(); })
      .then(function (res) { winShare.disabled = false; winShare.textContent = 'Share win'; if (res && res.ok) { winText.value = ''; if (winBox) winBox.hidden = true; try { localStorage.setItem('p2p_wc_win', '1'); } catch (e) {} confetti(); load(); } })
      .catch(function () { winShare.disabled = false; winShare.textContent = 'Share win'; });
  });

  load(); loadMembersData();
})();

/* ---- Help us be better — private suggestions/questions/kudos (emails the team) ---- */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var box = root.querySelector('[data-suggest]'); if (!box) return;
  var text = box.querySelector('[data-suggest-text]'),
      kind = box.querySelector('[data-suggest-kind]'),
      send = box.querySelector('[data-suggest-send]'),
      status = box.querySelector('[data-suggest-status]');
  if (!send) return;
  send.addEventListener('click', function () {
    var t = (text && text.value || '').trim(); if (!t) return;
    send.disabled = true; if (status) status.textContent = 'Sending…';
    fetch('/apps/p2p/suggest', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: t, kind: (kind ? kind.value : 'Suggestion') }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        send.disabled = false;
        if (res && res.ok) { text.value = ''; if (status) { status.textContent = 'Thanks — sent to the team ✓'; setTimeout(function () { status.textContent = ''; }, 4000); } }
        else if (status) { status.textContent = 'Try again'; }
      })
      .catch(function () { send.disabled = false; if (status) status.textContent = 'Try again'; });
  });
})();

/* ---- Month calendar (from window.P2P_EVENTS) — click an event day for a pop-up ---- */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var cal = root.querySelector('[data-cal]'); if (!cal) return;
  var grid = cal.querySelector('[data-cal-grid]'), title = cal.querySelector('[data-cal-title]');
  var events = (window.P2P_EVENTS || []).filter(function (e) { return e.iso; });
  var byDay = {}; events.forEach(function (e) { (byDay[e.iso] = byDay[e.iso] || []).push(e); });
  var now = new Date(), curY = now.getFullYear(), curM = now.getMonth();
  var MO = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pad(n){ return (n<10?'0':'')+n; }
  function render() {
    title.textContent = MO[curM] + ' ' + curY;
    var first = new Date(curY, curM, 1).getDay(), days = new Date(curY, curM + 1, 0).getDate();
    var t = new Date(), tISO = t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate()), html = '';
    for (var i = 0; i < first; i++) html += '<span class="osx-cal-d empty"></span>';
    for (var d = 1; d <= days; d++) {
      var iso = curY + '-' + pad(curM+1) + '-' + pad(d), evs = byDay[iso];
      html += '<button type="button" class="osx-cal-d' + (evs?' ev':'') + (iso===tISO?' today':'') + '"' + (evs?' data-cal-day="'+iso+'"':' disabled') + '>' + d + '</button>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll('[data-cal-day]').forEach(function (b) { b.addEventListener('click', function () { openEvent(byDay[b.getAttribute('data-cal-day')]); }); });
  }
  function openEvent(evs) {
    if (!evs || !evs.length) return;
    var e = evs[0];
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<div class="osx-cal-pop-ban">' + esc(e.title || 'Live session') + '</div>' +
      '<div class="osx-cal-pop-b"><div class="osx-cal-pop-t">' + esc(e.title || 'Live session') + '</div>' +
      '<div class="osx-cal-pop-meta">📅 ' + esc(e.date || '') + (e.time ? ' · ' + esc(e.time) : '') + '</div>' +
      (e.desc ? '<div class="osx-cal-pop-desc">' + esc(e.desc) + '</div>' : '') +
      (e.join ? '<a class="osx-cal-pop-join" href="' + esc(e.join) + '" target="_blank" rel="noopener">Join the call →</a>' : '') +
      '</div></div>';
    document.body.appendChild(pop);
    function close() { pop.remove(); }
    pop.addEventListener('click', function (ev) { if (ev.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
  }
  var pv = cal.querySelector('[data-cal-prev]'), nx = cal.querySelector('[data-cal-next]');
  if (pv) pv.addEventListener('click', function () { curM--; if (curM < 0) { curM = 11; curY--; } render(); });
  if (nx) nx.addEventListener('click', function () { curM++; if (curM > 11) { curM = 0; curY++; } render(); });
  render();
})();

/* ---- Bell notifications + profile bubble (sidebar, on every OS page) ---- */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var bar = root.querySelector('[data-userbar]'); if (!bar) return;
  var bell = bar.querySelector('[data-bell]'), menu = bar.querySelector('[data-bell-menu]'),
      countEl = bar.querySelector('[data-bell-count]'), roleEl = bar.querySelector('[data-userrole]');
  var NOTIFS = '/apps/p2p/notifs', notifs = [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ago(ts) { var s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return 'just now'; var m = Math.floor(s / 60); if (m < 60) return m + 'm'; var h = Math.floor(m / 60); if (h < 24) return h + 'h'; return Math.floor(h / 24) + 'd'; }
  function line(n) {
    var verb = n.type === 'comment' ? 'commented on your post' : (n.rtype === 'party' ? 'celebrated your post 🎉' : n.rtype === 'thumb' ? 'gave your post a 👍' : 'loved your post ❤');
    return '<div class="osx-bell-item' + (n.read ? '' : ' unread') + '"><div class="osx-bell-line"><b>' + esc(n.name || 'Someone') + '</b> ' + verb + '</div>' +
      (n.snippet ? '<div class="osx-bell-snip">“' + esc(n.snippet) + '”</div>' : '') +
      '<span class="osx-bell-time">' + ago(n.ts) + ' ago</span></div>';
  }
  function renderMenu() {
    if (!menu) return;
    menu.innerHTML = '<div class="osx-bell-h">Notifications</div>' + (notifs.length ? notifs.map(line).join('') : '<div class="osx-bell-empty">Nothing yet — reactions & replies to your posts show up here. 🔔</div>');
  }
  function setCount(u) { if (!countEl) return; if (u > 0) { countEl.textContent = u > 9 ? '9+' : u; countEl.hidden = false; } else countEl.hidden = true; }
  function fetchNotifs() {
    fetch(NOTIFS, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || j.guest) return;
      notifs = j.notifs || []; setCount(j.unread || 0); if (menu && !menu.hidden) renderMenu();
    }).catch(function () {});
  }
  if (roleEl && window.P2P && window.P2P.tier) { try { var t = window.P2P.tier(); if (t && t.name) roleEl.textContent = t.name; } catch (e) {} }
  if (bell) bell.addEventListener('click', function (e) {
    e.stopPropagation(); if (!menu) return;
    var opening = menu.hidden; menu.hidden = !menu.hidden;
    if (opening) {
      renderMenu();
      fetch(NOTIFS, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: '{}' })
        .then(function () { setCount(0); notifs.forEach(function (n) { n.read = true; }); }).catch(function () {});
    }
  });
  document.addEventListener('click', function (e) { if (menu && !menu.hidden && !menu.contains(e.target) && e.target !== bell && !bell.contains(e.target)) menu.hidden = true; });
  fetchNotifs();
  setInterval(fetchNotifs, 60000);
})();
