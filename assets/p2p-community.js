/* Purpose 2 Profit — Community wall + rotating Wins spotlight.
   Talks to the App Proxy: /apps/p2p/community (wall) and /apps/p2p/react (loves).
   Wall = feed of general posts. Wins = a rotating spotlight (one at a time, like
   Born an Original) with ❤ love reactions. Scoped to #p2pos. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var wrap = root.querySelector('[data-cw]'); if (!wrap) return;
  var PROXY = '/apps/p2p/community', REACT = '/apps/p2p/react';
  var feed = wrap.querySelector('[data-cw-feed]');
  var ta = wrap.querySelector('[data-cw-text]');
  var postBtn = wrap.querySelector('[data-cw-post]');
  var tabs = wrap.querySelectorAll('[data-cw-tab]');
  var posts = [], tab = 'wall', winIdx = 0, winTimer = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ago(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24); if (d < 7) return d + 'd ago';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  function wins() { return posts.filter(function (p) { return p.kind === 'win'; }); }
  function general() { return posts.filter(function (p) { return p.kind !== 'win'; }); }
  function stopTimer() { if (winTimer) { clearInterval(winTimer); winTimer = null; } }
  function loveBtn(p) { return '<button class="osx-love' + (p.liked ? ' on' : '') + '" data-love="' + esc(p.id) + '" type="button" aria-label="Love this">❤ <span>' + (p.likes || 0) + '</span></button>'; }

  function renderWall() {
    stopTimer();
    var items = general();
    if (!items.length) { feed.innerHTML = '<div class="osx-cw-empty">Nothing here yet — be the first to say hello. 👋</div>'; return; }
    feed.innerHTML = items.map(function (p) {
      return '<div class="osx-cw-post">' +
        '<div class="osx-cw-post-top"><b>' + esc(p.name || 'Member') + '</b><span class="osx-cw-time">' + ago(p.ts) + '</span></div>' +
        '<div class="osx-cw-post-text">' + esc(p.text) + '</div>' +
        '<div class="osx-cw-post-acts">' + loveBtn(p) + '</div></div>';
    }).join('');
    wireLoves();
  }

  function renderWins() {
    var w = wins();
    if (!w.length) { stopTimer(); feed.innerHTML = '<div class="osx-cw-empty">No wins shared yet. Share one from your Notebook → Wins. 🏆</div>'; return; }
    if (winIdx >= w.length) winIdx = 0;
    var p = w[winIdx];
    feed.innerHTML =
      '<div class="osx-win-widget">' +
        '<div class="osx-win-card">' +
          '<div class="osx-win-badge">🏆 Win</div>' +
          '<p class="osx-win-text">' + esc(p.text) + '</p>' +
          '<div class="osx-win-foot"><span class="osx-win-by">' + esc(p.name || 'Member') + ' · ' + ago(p.ts) + '</span>' + loveBtn(p) + '</div>' +
        '</div>' +
        (w.length > 1 ? '<div class="osx-win-dots">' + w.map(function (_, i) { return '<span class="' + (i === winIdx ? 'on' : '') + '" data-win-dot="' + i + '"></span>'; }).join('') + '</div>' : '') +
      '</div>';
    wireLoves();
    feed.querySelectorAll('[data-win-dot]').forEach(function (d) { d.addEventListener('click', function () { winIdx = +d.getAttribute('data-win-dot'); renderWins(); }); });
    stopTimer();
    if (w.length > 1) winTimer = setInterval(function () { winIdx = (winIdx + 1) % wins().length; renderWins(); }, 8000);
  }

  function wireLoves() {
    feed.querySelectorAll('[data-love]').forEach(function (btn) {
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

  function render() { if (tab === 'wins') renderWins(); else renderWall(); }

  function load() {
    fetch(PROXY, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.guest) { stopTimer(); feed.innerHTML = '<div class="osx-cw-empty">Log in to see and share with the community.</div>'; return; }
        posts = (j && j.posts) || []; render();
      })
      .catch(function () { feed.innerHTML = '<div class="osx-cw-empty">Couldn\'t load the wall just now — try again in a moment.</div>'; });
  }

  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      tab = b.getAttribute('data-cw-tab'); winIdx = 0;
      tabs.forEach(function (x) { x.classList.toggle('on', x === b); });
      render();
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

  load();
})();
