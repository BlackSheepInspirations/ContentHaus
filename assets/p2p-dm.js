/* Purpose 2 Profit — member-to-member Direct Messages (frontend).
   Talks to the App Proxy: /apps/p2p/dm-inbox, /dm-thread?with=<id>, /dm-send.
   Self-mounts a floating launcher into #p2pos; window.P2PDM.open(id,name,photo)
   starts a thread from anywhere (e.g. a member card). Scoped .p2pdm-*. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var API = '/apps/p2p';
  var DM_EMOJI = ['😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤗', '🤔', '😅', '😉', '🙂', '🙃', '😇', '🥳', '😌', '😴', '🤩', '😢', '😭', '😤', '😱', '🙄', '😬', '🤯', '👍', '👎', '👏', '🙌', '🙏', '💪', '🤝', '✌️', '👋', '💛', '🖤', '❤️', '🔥', '✨', '⭐', '🎉', '💯', '🌱', '🐑', '☕', '💡', '🚀'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }
  var badgeTimer = null, threadTimer = null;

  /* ---- floating launcher ---- */
  var launch = document.createElement('button');
  launch.className = 'p2pdm-launch'; launch.type = 'button'; launch.setAttribute('aria-label', 'Messages');
  launch.innerHTML = '<span class="p2pdm-launch-ic">💬</span><span class="p2pdm-badge" hidden>0</span>';
  root.appendChild(launch);
  launch.addEventListener('click', openInbox);
  var badgeEl = launch.querySelector('.p2pdm-badge');
  function setBadge(n) { n = n || 0; if (n > 0) { badgeEl.textContent = n > 99 ? '99+' : n; badgeEl.hidden = false; } else { badgeEl.hidden = true; } }
  function refreshBadge() { fetch(API + '/dm-inbox', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) { setBadge(j && j.unread); }).catch(function () {}); }

  function overlay() {
    var ov = document.createElement('div'); ov.className = 'p2pdm-overlay';
    ov.innerHTML = '<div class="p2pdm-card"></div>';
    root.appendChild(ov);
    return ov;
  }

  /* ---- inbox ---- */
  function openInbox() {
    var ov = overlay(), card = ov.querySelector('.p2pdm-card');
    card.innerHTML = '<div class="p2pdm-head"><b>Messages</b><button class="p2pdm-x" type="button" aria-label="Close">✕</button></div><div class="p2pdm-list">Loading…</div>';
    card.querySelector('.p2pdm-x').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    fetch(API + '/dm-inbox', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
      var list = card.querySelector('.p2pdm-list'), convos = (j && j.conversations) || [];
      setBadge(j && j.unread);
      if (!convos.length) { list.innerHTML = '<div class="p2pdm-empty">No messages yet.<br>Open a member’s card and tap <b>💬 Message</b> to start one.</div>'; return; }
      list.innerHTML = convos.map(function (c) {
        var av = c.photo ? '<img src="' + esc(c.photo) + '" alt="">' : esc((c.name || '?').charAt(0).toUpperCase());
        return '<button class="p2pdm-convo' + (c.unread ? ' unread' : '') + '" type="button" data-with="' + esc(c.with) + '" data-name="' + esc(c.name) + '">' +
          '<span class="p2pdm-av">' + av + '</span>' +
          '<span class="p2pdm-convo-txt"><span class="p2pdm-convo-top"><b>' + esc(c.name) + '</b>' + (c.unread ? '<span class="p2pdm-dot">' + c.unread + '</span>' : '') + '</span>' +
          '<span class="p2pdm-convo-last">' + (c.lastFromMe ? 'You: ' : '') + esc(c.lastText) + '</span></span></button>';
      }).join('');
      list.querySelectorAll('.p2pdm-convo').forEach(function (b) {
        b.addEventListener('click', function () { ov.remove(); openThread(b.getAttribute('data-with'), b.getAttribute('data-name'), ''); });
      });
    }).catch(function () { card.querySelector('.p2pdm-list').innerHTML = '<div class="p2pdm-empty">Couldn’t load messages.</div>'; });
  }

  /* ---- thread ---- */
  function openThread(withId, name, photo) {
    if (!withId) return;
    var ov = overlay(), card = ov.querySelector('.p2pdm-card');
    card.classList.add('p2pdm-card--thread');
    card.innerHTML = '<div class="p2pdm-head"><button class="p2pdm-back" type="button" aria-label="Back">‹</button><b class="p2pdm-th-name">' + esc(name || 'Member') + '</b><button class="p2pdm-x" type="button" aria-label="Close">✕</button></div>' +
      '<div class="p2pdm-msgs">Loading…</div>' +
      '<form class="p2pdm-compose"><button type="button" class="p2pdm-emoji" aria-label="Emoji">😊</button><input class="p2pdm-input" type="text" placeholder="Message ' + esc(name || 'them') + '…" maxlength="2000" autocomplete="off"><button class="p2pdm-send" type="submit" aria-label="Send">➤</button></form>';
    var msgs = card.querySelector('.p2pdm-msgs'), form = card.querySelector('.p2pdm-compose'), input = card.querySelector('.p2pdm-input');
    function done() { if (threadTimer) { clearInterval(threadTimer); threadTimer = null; } ov.remove(); refreshBadge(); }
    card.querySelector('.p2pdm-x').addEventListener('click', done);
    card.querySelector('.p2pdm-back').addEventListener('click', function () { done(); openInbox(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) done(); });
    function load() {
      fetch(API + '/dm-thread?with=' + encodeURIComponent(withId), { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
        render(msgs, (j && j.messages) || []); setBadge(j && j.unread);
      }).catch(function () {});
    }
    load();
    if (threadTimer) clearInterval(threadTimer);
    threadTimer = setInterval(function () { if (root.contains(ov)) load(); else { clearInterval(threadTimer); threadTimer = null; } }, 6000);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim(); if (!text) return;
      input.value = ''; append(msgs, { text: text, mine: true });
      fetch(API + '/dm-send', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ to: withId, text: text }) })
        .then(function (r) { return r.json(); }).then(function (j) { if (!(j && j.ok)) alert('Message didn’t send — ' + ((j && j.error) || 'please try again') + '.'); })
        .catch(function () { alert('Message didn’t send — please try again.'); });
    });
    var emojiBtn = card.querySelector('.p2pdm-emoji'), epop = null;
    function closeEpop() { if (epop) { epop.remove(); epop = null; } }
    emojiBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (epop) { closeEpop(); return; }
      epop = document.createElement('div'); epop.className = 'p2pdm-emojipop';
      epop.innerHTML = DM_EMOJI.map(function (em) { return '<button type="button">' + em + '</button>'; }).join('');
      card.appendChild(epop);
      epop.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          var s = input.selectionStart, en = input.selectionEnd;
          if (typeof s === 'number') { input.value = input.value.slice(0, s) + b.textContent + input.value.slice(en); input.selectionStart = input.selectionEnd = s + b.textContent.length; }
          else { input.value += b.textContent; }
          input.focus(); closeEpop();
        });
      });
    });
    card.addEventListener('click', function (e) { if (epop && !epop.contains(e.target) && e.target !== emojiBtn) closeEpop(); });
    setTimeout(function () { input.focus(); }, 60);
  }
  function render(box, arr) {
    if (!arr.length) { box.innerHTML = '<div class="p2pdm-empty">Say hi 👋</div>'; return; }
    box.innerHTML = arr.map(function (m) { return '<div class="p2pdm-msg' + (m.mine ? ' mine' : '') + '"><span class="p2pdm-bub">' + esc(m.text) + '</span></div>'; }).join('');
    box.scrollTop = box.scrollHeight;
  }
  function append(box, m) {
    var e = box.querySelector('.p2pdm-empty'); if (e) box.innerHTML = '';
    var d = document.createElement('div'); d.className = 'p2pdm-msg' + (m.mine ? ' mine' : ''); d.innerHTML = '<span class="p2pdm-bub">' + esc(m.text) + '</span>';
    box.appendChild(d); box.scrollTop = box.scrollHeight;
  }

  refreshBadge();
  badgeTimer = setInterval(refreshBadge, 20000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshBadge(); });
  window.addEventListener('focus', refreshBadge);
  window.P2PDM = { open: openThread, inbox: openInbox, refresh: refreshBadge };
})();
