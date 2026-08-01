/* Purpose 2 Profit — Community wall + Wins board.
   Talks to the App Proxy /apps/p2p/community (see the Cloudflare Worker).
   Unmoderated: posts appear instantly for everyone. Wins (kind:'win') — shared from
   the Notebook or the "Share as a win" toggle — get their own tab. Scoped to #p2pos. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var wrap = root.querySelector('[data-cw]'); if (!wrap) return;
  var PROXY = '/apps/p2p/community';
  var feed = wrap.querySelector('[data-cw-feed]');
  var ta = wrap.querySelector('[data-cw-text]');
  var winChk = wrap.querySelector('[data-cw-win]');
  var postBtn = wrap.querySelector('[data-cw-post]');
  var tabs = wrap.querySelectorAll('[data-cw-tab]');
  var posts = [], tab = 'wall', loaded = false;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ago(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24); if (d < 7) return d + 'd ago';
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function render() {
    var items = posts.filter(function (p) { return tab === 'wins' ? p.kind === 'win' : p.kind !== 'win'; });
    if (!items.length) {
      feed.innerHTML = '<div class="osx-cw-empty">' + (tab === 'wins'
        ? 'No wins shared yet. Share one from your Notebook → Wins. 🏆'
        : 'Nothing here yet — be the first to say hello. 👋') + '</div>';
      return;
    }
    feed.innerHTML = items.map(function (p) {
      return '<div class="osx-cw-post' + (p.kind === 'win' ? ' is-win' : '') + '">' +
        '<div class="osx-cw-post-top"><b>' + esc(p.name || 'Member') + '</b>' +
        (p.kind === 'win' ? ' <span class="osx-cw-winbadge">🏆 Win</span>' : '') +
        '<span class="osx-cw-time">' + ago(p.ts) + '</span></div>' +
        '<div class="osx-cw-post-text">' + esc(p.text) + '</div>' +
        '</div>';
    }).join('');
  }

  function load() {
    fetch(PROXY, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        loaded = true;
        if (j && j.guest) { feed.innerHTML = '<div class="osx-cw-empty">Log in to see and share with the community.</div>'; return; }
        posts = (j && j.posts) || []; render();
      })
      .catch(function () { feed.innerHTML = '<div class="osx-cw-empty">Couldn\'t load the wall just now — try again in a moment.</div>'; });
  }

  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      tab = b.getAttribute('data-cw-tab');
      tabs.forEach(function (x) { x.classList.toggle('on', x === b); });
      render();
    });
  });

  if (postBtn) postBtn.addEventListener('click', function () {
    var text = (ta && ta.value || '').trim(); if (!text) return;
    var kind = (winChk && winChk.checked) ? 'win' : 'post';
    postBtn.disabled = true; postBtn.textContent = 'Posting…';
    fetch(PROXY, {
      method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ text: text, kind: kind, name: window.P2P_MEMBER_NAME || '' })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        postBtn.disabled = false; postBtn.textContent = 'Post';
        if (res && res.ok) { ta.value = ''; if (winChk) winChk.checked = false; load(); }
      })
      .catch(function () { postBtn.disabled = false; postBtn.textContent = 'Post'; });
  });

  load();
})();
