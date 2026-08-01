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
  var posts = [], winIdx = 0, winTimer = null;

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
  function loveBtn(p) { return '<button class="osx-love' + (p.liked ? ' on' : '') + '" data-love="' + esc(p.id) + '" type="button" aria-label="Love this">❤ <span>' + (p.likes || 0) + '</span></button>'; }
  function wins() { return posts.filter(function (p) { return p.kind === 'win'; }); }
  function general() { return posts.filter(function (p) { return p.kind !== 'win'; }); }
  function stopTimer() { if (winTimer) { clearInterval(winTimer); winTimer = null; } }

  function renderWall() {
    if (!feed) return;
    var items = general();
    if (!items.length) { feed.innerHTML = empty('Nothing here yet — be the first to say hello. 👋'); return; }
    feed.innerHTML = items.map(function (p) {
      var lng = (p.text || '').length > 280;
      return '<div class="osx-cw-post">' +
        '<div class="osx-cw-post-top"><b>' + esc(p.name || 'Member') + '</b><span class="osx-cw-time">' + ago(p.ts) + '</span></div>' +
        '<div class="osx-cw-post-text' + (lng ? ' clamp' : '') + '">' + esc(p.text) + '</div>' +
        (lng ? '<button class="osx-cw-more" type="button" data-more>Read more ▾</button>' : '') +
        '<div class="osx-cw-post-acts">' + loveBtn(p) + '</div></div>';
    }).join('');
    wireLoves(feed);
    feed.querySelectorAll('[data-more]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.previousElementSibling; if (!t) return;
        t.classList.toggle('clamp');
        b.textContent = t.classList.contains('clamp') ? 'Read more ▾' : 'Show less ▴';
      });
    });
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
        '<div class="osx-wside-foot"><span class="osx-wside-by">' + esc(p.name || 'Member') + '</span>' + loveBtn(p) + '</div>' +
      '</div>' +
      (w.length > 1 ? '<div class="osx-win-dots">' + w.map(function (_, i) { return '<span class="' + (i === winIdx ? 'on' : '') + '" data-win-dot="' + i + '"></span>'; }).join('') + '</div>' : '');
    wireLoves(winsFeed);
    winsFeed.querySelectorAll('[data-win-dot]').forEach(function (d) { d.addEventListener('click', function () { winIdx = +d.getAttribute('data-win-dot'); renderWinsSide(); }); });
    stopTimer();
    if (w.length > 1) winTimer = setInterval(function () { winIdx = (winIdx + 1) % wins().length; renderWinsSide(); }, 8000);
  }

  function wireLoves(container) {
    container.querySelectorAll('[data-love]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-love');
        fetch(REACT, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: id }) })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              posts.forEach(function (p) { if (p.id === id) { p.likes = res.likes; p.liked = res.liked; } });
              btn.classList.toggle('on', res.liked);
              var c = btn.querySelector('span'); if (c) c.textContent = res.likes;
            }
          }).catch(function () {});
      });
    });
  }

  function render() { renderWall(); renderWinsSide(); }

  function load() {
    fetch(PROXY, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.guest) { stopTimer(); if (feed) feed.innerHTML = empty('Log in to see and share with the community.'); return; }
        posts = (j && j.posts) || []; render();
      })
      .catch(function () { if (feed) feed.innerHTML = empty('Couldn\'t load the wall just now — try again in a moment.'); });
  }

  function avatar(p) { return p.photo ? '<img src="' + esc(p.photo) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : esc((p.name || '?').trim().charAt(0).toUpperCase() || '🐑'); }

  function renderGrowth(m) {
    var el = root.querySelector('[data-gb]'); if (!el) return;
    if (!m.length) { el.innerHTML = empty('No members yet.'); return; }
    var top = m.slice().sort(function (a, b) { return (b.points || 0) - (a.points || 0); }).slice(0, 10);
    el.innerHTML = top.map(function (p, i) {
      return '<div class="osx-gb-row"><span class="osx-gb-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span>' +
        '<span class="osx-gb-av">' + avatar(p) + '</span>' +
        '<span><span class="osx-gb-name">' + esc(p.name || 'Member') + '</span>' + (p.tier ? '<span class="osx-gb-tier">' + esc(p.tier) + '</span>' : '') + '</span>' +
        '<span class="osx-gb-pts">' + (p.points || 0).toLocaleString() + '</span></div>';
    }).join('');
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
      renderGrowth(m); renderSpotlight(m);
    }).catch(function () {});
  }

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
    fetch(PROXY, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: text, kind: 'post', name: window.P2P_MEMBER_NAME || '' }) })
      .then(function (r) { return r.json(); })
      .then(function (res) { postBtn.disabled = false; postBtn.textContent = 'Post'; if (res && res.ok) { ta.value = ''; load(); } })
      .catch(function () { postBtn.disabled = false; postBtn.textContent = 'Post'; });
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
