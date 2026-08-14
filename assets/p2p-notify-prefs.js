/* Purpose 2 Profit — notification preferences (frontend).
   A small settings panel where a member chooses which community events ALSO
   reach them off-site (email / text) — the in-app bell always shows everything.
   Talks to the App Proxy: GET/POST /apps/p2p/prefs. The Worker fans matching
   events out to Klaviyo. Opened from the bell menu footer via
   window.P2PNotifyPrefs.open(). Scoped .p2pnp-*. */
(function () {
  // Mount wherever the bell lives — the OS shell (#p2pos) or, on the Haus tools
  // that carry the shared rail, the page body.
  var root = document.getElementById('p2pos') || document.body; if (!root) return;
  var API = '/apps/p2p';

  // Self-contained styles (literal colors — the panel can mount on <body>, where
  // the OS CSS custom properties aren't in scope). Injected once.
  if (!document.getElementById('p2pnp-css')) {
    var st = document.createElement('style'); st.id = 'p2pnp-css';
    st.textContent =
      '.p2pnp-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(6,14,18,.6);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);}' +
      '.p2pnp-card{width:480px;max-width:100%;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;border-radius:18px;border:1px solid rgba(216,180,90,.34);background:radial-gradient(120% 80% at 100% 0%,#0e1c28,#070f16);box-shadow:0 30px 70px rgba(0,0,0,.6);color:#eef6f3;font-family:system-ui,-apple-system,sans-serif;}' +
      '.p2pnp-head{display:flex;align-items:center;gap:8px;padding:15px 18px;border-bottom:1px solid rgba(255,255,255,.08);font-family:Georgia,serif;}' +
      '.p2pnp-head b{font-size:16px;flex:1;font-weight:700;}' +
      '.p2pnp-x{background:none;border:0;color:#9fb3ad;font-size:20px;line-height:1;cursor:pointer;padding:2px 6px;}' +
      '.p2pnp-x:hover{color:#fff;}' +
      '.p2pnp-body{padding:16px 18px 18px;overflow-y:auto;}' +
      '.p2pnp-intro{margin:0 0 14px;font-size:13px;line-height:1.55;color:#9fb3ad;}' +
      '.p2pnp-intro b{color:#eef6f3;}' +
      '.p2pnp-grid{border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;}' +
      '.p2pnp-colhead,.p2pnp-row{display:grid;grid-template-columns:1fr 58px 58px;align-items:center;gap:6px;}' +
      '.p2pnp-colhead{padding:8px 12px;background:rgba(255,255,255,.03);font:700 10px/1 system-ui;letter-spacing:.05em;text-transform:uppercase;color:#c79a3e;}' +
      '.p2pnp-colhead span:nth-child(2),.p2pnp-colhead span:nth-child(3){text-align:center;}' +
      '.p2pnp-row{padding:11px 12px;border-top:1px solid rgba(255,255,255,.06);}' +
      '.p2pnp-ev{display:flex;align-items:flex-start;gap:9px;min-width:0;}' +
      '.p2pnp-ev-ic{font-size:16px;line-height:1.2;flex:none;}' +
      '.p2pnp-ev-txt{display:flex;flex-direction:column;gap:2px;min-width:0;}' +
      '.p2pnp-ev-txt b{font-size:13.5px;font-weight:600;color:#eef6f3;}' +
      '.p2pnp-ev-txt span{font-size:11.5px;line-height:1.4;color:#8fa39d;}' +
      '.p2pnp-ch{display:flex;justify-content:center;}' +
      '.p2pnp-na{color:#4d5f6a;font-size:15px;}' +
      '.p2pnp-switch{position:relative;display:inline-block;width:42px;height:24px;flex:none;}' +
      '.p2pnp-switch input{opacity:0;width:0;height:0;position:absolute;}' +
      '.p2pnp-slider{position:absolute;inset:0;cursor:pointer;background:#2a3b47;border-radius:24px;transition:.2s;}' +
      '.p2pnp-slider:before{content:"";position:absolute;height:18px;width:18px;left:3px;top:3px;background:#eef6f3;border-radius:50%;transition:.2s;}' +
      '.p2pnp-switch input:checked + .p2pnp-slider{background:linear-gradient(100deg,#d8b45a,#c79a3e);}' +
      '.p2pnp-switch input:checked + .p2pnp-slider:before{transform:translateX(18px);}' +
      '.p2pnp-switch input:focus-visible + .p2pnp-slider{outline:2px solid #d8b45a;outline-offset:2px;}' +
      '.p2pnp-note{margin:14px 2px 0;font-size:11.5px;line-height:1.5;color:#7d9089;}' +
      '.p2pnp-note b{color:#9fb3ad;}' +
      '.p2pnp-foot{display:flex;justify-content:flex-end;min-height:20px;margin-top:10px;}' +
      '.p2pnp-saved{font-size:12px;color:#6fcf97;font-weight:600;}' +
      '.p2pnp-err{padding:24px 8px;text-align:center;color:#9fb3ad;font-size:13px;}' +
      '@media(max-width:520px){.p2pnp-card{width:100%;height:100%;max-height:100vh;border-radius:0;}.p2pnp-overlay{padding:0;}}';
    document.head.appendChild(st);
  }

  // Which events can reach off-site, and whether a TEXT is ever eligible.
  // Keep in lockstep with PREF_EMAIL_KEYS / PREF_SMS_KEYS in the Worker.
  var EVENTS = [
    { key: 'dm', ic: '💬', label: 'Direct messages', desc: 'When another member sends you a message', sms: true },
    { key: 'reminder', ic: '⏰', label: 'My reminders', desc: 'Before a live, goal, or launch you scheduled', sms: true },
    { key: 'comment', ic: '💭', label: 'Replies to my posts', desc: 'When someone comments on something you posted', sms: false },
    { key: 'react', ic: '❤️', label: 'Reactions to my posts', desc: 'When someone reacts to your post', sms: false },
    { key: 'follow', ic: '👋', label: 'New followers', desc: 'When someone starts following you', sms: false }
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]); }); }

  function overlay() {
    var ov = document.createElement('div'); ov.className = 'p2pnp-overlay';
    ov.innerHTML = '<div class="p2pnp-card"></div>';
    root.appendChild(ov);
    return ov;
  }

  function sw(channel, key, on) {
    return '<label class="p2pnp-switch"><input type="checkbox" data-ch="' + channel + '" data-key="' + key + '"' + (on ? ' checked' : '') + '><span class="p2pnp-slider"></span></label>';
  }

  function open() {
    var ov = overlay(), card = ov.querySelector('.p2pnp-card');
    card.innerHTML = '<div class="p2pnp-head"><b>🔔 Notification settings</b><button class="p2pnp-x" type="button" aria-label="Close">✕</button></div>' +
      '<div class="p2pnp-body">Loading…</div>';
    card.querySelector('.p2pnp-x').addEventListener('click', function () { ov.remove(); });
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });

    fetch(API + '/prefs', { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var body = card.querySelector('.p2pnp-body');
      var prefs = (j && j.prefs) || { email: {}, sms: {} };
      var state = { email: Object.assign({}, prefs.email), sms: Object.assign({}, prefs.sms) };

      var rows = EVENTS.map(function (ev) {
        return '<div class="p2pnp-row">' +
          '<div class="p2pnp-ev"><span class="p2pnp-ev-ic">' + ev.ic + '</span><span class="p2pnp-ev-txt"><b>' + esc(ev.label) + '</b><span>' + esc(ev.desc) + '</span></span></div>' +
          '<div class="p2pnp-ch">' + sw('email', ev.key, !!state.email[ev.key]) + '</div>' +
          '<div class="p2pnp-ch">' + (ev.sms ? sw('sms', ev.key, !!state.sms[ev.key]) : '<span class="p2pnp-na">—</span>') + '</div>' +
          '</div>';
      }).join('');

      body.innerHTML =
        '<p class="p2pnp-intro">Your bell always shows everything. Pick what should <b>also</b> reach you when you’re away from the Haus.</p>' +
        '<div class="p2pnp-grid">' +
          '<div class="p2pnp-colhead"><span></span><span>Email</span><span>Text</span></div>' +
          rows +
        '</div>' +
        '<p class="p2pnp-note">Text alerts are opt-in and only for the most time-sensitive things. They need a mobile number on your account — add or update it in <b>Account</b>. Standard message rates may apply.</p>' +
        '<div class="p2pnp-foot"><span class="p2pnp-saved" hidden>Saved ✓</span></div>';

      var savedEl = body.querySelector('.p2pnp-saved'), savedTimer = null;
      function flashSaved() { if (!savedEl) return; savedEl.hidden = false; if (savedTimer) clearTimeout(savedTimer); savedTimer = setTimeout(function () { savedEl.hidden = true; }, 1600); }

      body.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var ch = cb.getAttribute('data-ch'), key = cb.getAttribute('data-key');
          state[ch][key] = cb.checked;
          fetch(API + '/prefs', {
            method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin',
            body: JSON.stringify(state)
          }).then(function (r) { return r.ok ? r.json() : null; }).then(function (res) {
            if (res && res.prefs) { state.email = Object.assign({}, res.prefs.email); state.sms = Object.assign({}, res.prefs.sms); }
            flashSaved();
          }).catch(function () {});
        });
      });
    }).catch(function () {
      card.querySelector('.p2pnp-body').innerHTML = '<div class="p2pnp-err">Couldn’t load your settings. Try again in a moment.</div>';
    });
  }

  window.P2PNotifyPrefs = { open: open };
})();
