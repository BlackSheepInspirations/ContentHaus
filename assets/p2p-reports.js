/* Purpose 2 Profit — moderator report queue (frontend).
   GET /apps/p2p/reports returns flagged posts (403 for non-mods, so the button only
   appears for owner/admin/mod); POST {id} dismisses one. Scoped .p2prep-*. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var API = '/apps/p2p';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }
  function ago(ts) { var s = (Date.now() - ts) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago'; }
  var btn = null, reports = [];

  function ensureBtn() {
    if (btn) return;
    btn = document.createElement('button'); btn.className = 'p2prep-launch'; btn.type = 'button'; btn.setAttribute('aria-label', 'Reported posts');
    btn.innerHTML = '🚩<span class="p2prep-badge" hidden>0</span>';
    root.appendChild(btn);
    btn.addEventListener('click', function () { load(true); });
  }
  function setCount(n) { if (!btn) return; var b = btn.querySelector('.p2prep-badge'); if (n > 0) { b.textContent = n > 99 ? '99+' : n; b.hidden = false; } else b.hidden = true; }

  function load(openIt) {
    fetch(API + '/reports', { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      reports = (j && j.reports) || [];
      ensureBtn(); setCount(reports.length);
      if (openIt) renderModal();
    }).catch(function () { /* not a moderator (403) — no button, nothing shown */ });
  }

  function renderModal() {
    var ov = document.createElement('div'); ov.className = 'p2prep-overlay';
    ov.innerHTML = '<div class="p2prep-card"><div class="p2prep-head"><b>🚩 Reported posts</b><button class="p2prep-x" type="button" aria-label="Close">✕</button></div><div class="p2prep-list"></div></div>';
    root.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    ov.querySelector('.p2prep-x').addEventListener('click', function () { ov.remove(); });
    var list = ov.querySelector('.p2prep-list');
    function draw() {
      if (!reports.length) { list.innerHTML = '<div class="p2prep-empty">No open reports — the flock’s behaving. 🖤</div>'; return; }
      list.innerHTML = reports.map(function (r) {
        return '<div class="p2prep-item"><div class="p2prep-meta"><b>Reported by ' + esc(r.name || 'Member') + '</b><span>' + ago(r.ts) + '</span></div>' +
          '<div class="p2prep-text">' + esc(r.text || '').replace(/\n/g, '<br>') + '</div>' +
          '<button type="button" class="p2prep-dismiss" data-rid="' + esc(r.id) + '">Dismiss</button></div>';
      }).join('') + '<div class="p2prep-tip">Tip: to remove a reported post, find it in the feed and use ⋯ → 🗑️ Delete.</div>';
      list.querySelectorAll('.p2prep-dismiss').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-rid'); b.disabled = true; b.textContent = 'Dismissing…';
          fetch(API + '/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: id }) })
            .then(function (r) { return r.json(); }).then(function () { reports = reports.filter(function (x) { return x.id !== id; }); setCount(reports.length); draw(); })
            .catch(function () { b.disabled = false; b.textContent = 'Dismiss'; });
        });
      });
    }
    draw();
  }

  load(false);
})();
