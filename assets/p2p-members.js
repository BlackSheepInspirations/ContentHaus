/* Purpose 2 Profit — Members directory + Map + My Profile editor.
   Talks to the App Proxy: /apps/p2p/profile (my card) and /apps/p2p/members (all).
   Location is city-level (from Cloudflare edge geo, server-side) — never exact.
   Default shown (opt-out toggle in My Profile). Scoped to #p2pos. */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var view = root.querySelector('.osx-view[data-view="members"]'); if (!view) return;
  var mb = view.querySelector('[data-mb]'); if (!mb) return;
  var PROFILE = '/apps/p2p/profile', MEMBERS = '/apps/p2p/members';

  var tabs = mb.querySelectorAll('[data-mb-tab]'), panels = mb.querySelectorAll('[data-mb-panel]');
  var grid = mb.querySelector('[data-mb-grid]'), mapEl = root.querySelector('[data-mb-map]');
  var f = {
    photo: mb.querySelector('[data-mb-photo]'), quote: mb.querySelector('[data-mb-quote]'), about: mb.querySelector('[data-mb-about]'),
    hidden: mb.querySelector('[data-mb-hidden]'), save: mb.querySelector('[data-mb-save]'), status: mb.querySelector('[data-mb-status]')
  };
  var socialEls = {}; mb.querySelectorAll('[data-mb-social]').forEach(function (el) { socialEls[el.getAttribute('data-mb-social')] = el; });
  var toolbar = { search: mb.querySelector('[data-mb-search]'), sort: mb.querySelector('[data-mb-sort]'), count: mb.querySelector('[data-mb-count]') };
  var nameEl = mb.querySelector('[data-mb-name]'), avGrid = mb.querySelector('[data-mb-avatars]'), avVal = { v: '' };
  var emailEl = mb.querySelector('[data-mb-email]'), showEmailEl = mb.querySelector('[data-mb-showemail]');
  var members = [], myProfile = null, searchVal = '', sortVal = 'points';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initial(n) { n = String(n || '').trim(); return n ? n.charAt(0).toUpperCase() : '🐑'; }
  function since(iso) { if (!iso) return ''; try { return 'Member since ' + new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function loc(p) { return [p.city, p.region || p.country].filter(Boolean).join(', '); }
  /* ---- avatars: real photo, a chosen preset icon, or the name initial ---- */
  var PRESETS = ['🐑','🦊','🦉','🐺','🐻','🐼','🐨','🦁','🐯','🦄','🐸','🐵','🦋','🐝','🦚','🦜','🐬','🦖','🐙','🦩','🌟','⚡','🔥','🌈','🎨','🚀','🌸','🍀','🎯','💎'];
  window.P2P_PRESETS = PRESETS;
  function isPreset(v) { return /^preset:/.test(String(v || '')); }
  function avatarInner(p) {
    var ph = (p && p.photo) || '';
    if (isPreset(ph)) return '<span class="osx-mb-emoji">' + esc(ph.slice(7)) + '</span>';
    if (ph) return '<img src="' + esc(ph) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
    return '<span>' + esc(initial(p && p.name)) + '</span>';
  }
  /* ---- follow / favorite (local; server sync best-effort for cross-device + alerts) ---- */
  function follows() { try { return JSON.parse(localStorage.getItem('p2p_follows') || '[]') || []; } catch (e) { return []; } }
  function isFollowing(nm) { return follows().indexOf(String(nm || '').trim().toLowerCase()) > -1; }
  function toggleFollow(nm) {
    var k = String(nm || '').trim().toLowerCase(), s = follows(), i = s.indexOf(k), on = i === -1;
    if (on) s.push(k); else s.splice(i, 1);
    try { localStorage.setItem('p2p_follows', JSON.stringify(s)); } catch (e) {}
    fetch('/apps/p2p/follow', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ name: k, on: on }) }).catch(function () {});
    return on;
  }
  /* ---- name safety (client pre-check; the worker is authoritative) ---- */
  var NAME_BLOCK = /(f+u+c+k|sh[i1\*]t|b[i1]tch|c[u\*]nt|n[i1]gg|f[a4]gg|whore|\bslut\b|\brape\b|nazi|retard|\bcum\b|pussy|a[s\$]{2}hole|jizz|dumbass|bastard|\bhoe\b|loser|idiot|stupid|\bdumb\b|\bugly\b|moron|imbecile|worthless|\bhate\b|\bkill\b|\bdie\b|\bscum\b|\btrash\b|\bfat\b|\bp2p ?team\b|\badmin\b|moderator|official)/i;
  function nameProblem(nm, others) {
    nm = String(nm || '').trim();
    if (!nm) return 'Please enter a display name.';
    if (nm.length < 2) return 'That name is too short.';
    if (nm.length > 32) return 'Please keep it under 32 characters.';
    if (!/[a-z0-9]/i.test(nm)) return 'Please use some letters or numbers.';
    if (NAME_BLOCK.test(nm)) return 'That name isn’t allowed — please choose another.';
    var low = nm.toLowerCase();
    if ((others || []).some(function (o) { return String(o.name || '').trim().toLowerCase() === low; })) return 'That name is already taken — try another.';
    return '';
  }
  /* ---- external-link confirm popup ---- */
  function openExtConfirm(url) {
    var host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch (e) { host = url; }
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-extc"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<div class="osx-extc-h">Leaving Purpose 2 Profit</div>' +
      '<p class="osx-extc-b">This opens an external site:<br><b>' + esc(host) + '</b></p>' +
      '<div class="osx-extc-row"><button type="button" class="osx-extc-cancel">Stay here</button>' +
      '<a class="osx-extc-go" href="' + esc(url) + '" target="_blank" rel="noopener nofollow">Open ' + esc(host) + ' ↗</a></div></div>';
    root.appendChild(pop);
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-extc-cancel').addEventListener('click', close);
    pop.querySelector('.osx-extc-go').addEventListener('click', function () { setTimeout(close, 60); });
  }
  function badgeEmoji(name) {
    var n = String(name || '').toLowerCase();
    if (/streak|comeback/.test(n)) return '🔥';
    if (/master/.test(n)) return '🎓';
    if (/cleared/.test(n)) return '🏆';
    if (/freedom|reached/.test(n)) return '👑';
    if (/first|win/.test(n)) return '🥇';
    return '🏅';
  }
  function recentBadges() {
    var P = window.P2P || {};
    var e = (P.earnedSet ? P.earnedSet() : []) || [];
    return e.slice(-3).reverse().map(function (nm) { return { label: nm, emoji: badgeEmoji(nm) }; });
  }
  function stats() {
    var P = window.P2P || {};
    var t = (P.tier ? P.tier() : null);
    return {
      name: window.P2P_MEMBER_NAME || '',
      tier: (t ? (t.name || '') : ''),
      tierNum: (t ? (t.index || 0) : 0),
      points: (P.points ? P.points() : 0),
      badges: (P.earnedSet ? P.earnedSet().length : 0),
      recentBadges: recentBadges(),
      streak: (P.streak ? (P.streak().count || 0) : 0)
    };
  }
  var SICON = { website: '🌐', instagram: '📷', facebook: '📘', youtube: '▶️', x: '✖', linkedin: 'in', tiktok: '🎵' };
  function socialHTML(social) {
    if (!social) return '';
    var out = Object.keys(social).map(function (k) { return '<a href="' + esc(social[k]) + '" class="osx-mb-sociallink" data-extlink="' + esc(social[k]) + '" rel="noopener nofollow" title="' + esc(k) + '">' + (SICON[k] || '🔗') + '</a>'; }).join('');
    return out ? '<div class="osx-mb-social">' + out + '</div>' : '';
  }
  function cardHTML(p, compact) {
    var l = loc(p), nm = p.name || 'Member', following = isFollowing(nm);
    var bell = compact ? '' : '<button type="button" class="osx-mb-follow' + (following ? ' on' : '') + '" data-mb-follow="' + esc(nm) + '" title="' + (following ? 'Following — you’ll be alerted to their posts' : 'Follow to be alerted to their posts') + '">' + (following ? '🔔' : '🔕') + '</button>';
    return '<div class="osx-mb-card' + (compact ? ' compact' : '') + '"' + (compact ? '' : ' data-mb-open="' + esc(nm) + '"') + '>' + bell +
      '<div class="osx-mb-av">' + avatarInner(p) + '</div>' +
      '<div class="osx-mb-name">' + esc(nm) + '</div>' +
      (p.tier ? '<div class="osx-mb-tier">' + esc(p.tier) + '</div>' : '') +
      '<div class="osx-mb-stat">' + (p.points || 0) + ' pts · ' + (p.badges || 0) + ' badges</div>' +
      (l ? '<div class="osx-mb-loc">📍 ' + esc(l) + '</div>' : '') +
      (p.since ? '<div class="osx-mb-since">' + esc(since(p.since)) + '</div>' : '') +
      (p.quote ? '<p class="osx-mb-quote">“' + esc(p.quote) + '”</p>' : '') +
      (!compact && p.about ? '<p class="osx-mb-about">' + esc(p.about) + '</p>' : '') +
      (compact ? '' : socialHTML(p.social)) +
      '</div>';
  }

  /* ---- directory ---- */
  function sortedFiltered() {
    var q = searchVal.trim().toLowerCase(), out = members.slice();
    if (q) out = out.filter(function (p) { return (String(p.name || '') + ' ' + loc(p)).toLowerCase().indexOf(q) > -1; });
    out.sort(function (a, b) {
      if (sortVal === 'newest') return (Date.parse(b.since || 0) || 0) - (Date.parse(a.since || 0) || 0);
      if (sortVal === 'oldest') return (Date.parse(a.since || 0) || 0) - (Date.parse(b.since || 0) || 0);
      if (sortVal === 'az') return String(a.name || '').localeCompare(String(b.name || ''));
      if (sortVal === 'following') { var fa = isFollowing(a.name) ? 1 : 0, fb = isFollowing(b.name) ? 1 : 0; return (fb - fa) || ((b.points || 0) - (a.points || 0)); }
      if (sortVal === 'engaged') return (b.engaged || b.points || 0) - (a.engaged || a.points || 0);
      return (b.points || 0) - (a.points || 0);
    });
    return out;
  }
  function memberByName(nm) { var k = String(nm || '').trim().toLowerCase(); return members.filter(function (p) { return String(p.name || '').trim().toLowerCase() === k; })[0]; }
  function renderDirectory() {
    if (!grid) return;
    if (!members.length) { grid.innerHTML = '<div class="osx-cw-empty">No members on the board yet — you might be the first! 🐑</div>'; if (toolbar.count) toolbar.count.textContent = ''; return; }
    var list = sortedFiltered();
    if (toolbar.count) toolbar.count.textContent = members.length + (members.length === 1 ? ' member' : ' members');
    grid.innerHTML = list.length ? list.map(function (p) { return cardHTML(p, false); }).join('') : '<div class="osx-cw-empty">No one matches “' + esc(searchVal) + '.”</div>';
    wireCards();
  }
  function wireCards() {
    grid.querySelectorAll('[data-mb-follow]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); var on = toggleFollow(b.getAttribute('data-mb-follow')); b.classList.toggle('on', on); b.textContent = on ? '🔔' : '🔕'; b.title = on ? 'Following — you’ll be alerted to their posts' : 'Follow to be alerted to their posts'; if (sortVal === 'following') renderDirectory(); }); });
    grid.querySelectorAll('[data-extlink]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); openExtConfirm(a.getAttribute('data-extlink')); }); });
    grid.querySelectorAll('[data-mb-open]').forEach(function (c) { c.addEventListener('click', function (e) { if (e.target.closest('[data-mb-follow],[data-extlink]')) return; openMemberModal(memberByName(c.getAttribute('data-mb-open'))); }); });
  }
  function openMemberModal(p) {
    if (!p) return;
    var nm = p.name || 'Member', l = loc(p), following = isFollowing(nm);
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-mbm"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<div class="osx-mbm-top"><div class="osx-mb-av osx-mbm-av">' + avatarInner(p) + '</div>' +
        '<div class="osx-mbm-id"><div class="osx-mbm-name">' + esc(nm) + '</div>' + (p.tier ? '<div class="osx-mb-tier">' + esc(p.tier) + '</div>' : '') +
        (l ? '<div class="osx-mb-loc">📍 ' + esc(l) + '</div>' : '') + (p.since ? '<div class="osx-mb-since">' + esc(since(p.since)) + '</div>' : '') + '</div></div>' +
      '<div class="osx-mbm-stats"><div><b>' + (p.points || 0) + '</b><span>points</span></div><div><b>' + (p.badges || 0) + '</b><span>badges</span></div>' + (p.streak ? '<div><b>' + p.streak + '🔥</b><span>day streak</span></div>' : '') + '</div>' +
      (p.quote ? '<p class="osx-mb-quote">“' + esc(p.quote) + '”</p>' : '') +
      (p.about ? '<p class="osx-mb-about">' + esc(p.about) + '</p>' : '') +
      socialHTML(p.social) +
      (p.hasEmail ? '<button type="button" class="osx-mbm-email" data-mbm-email="' + esc(p.id || '') + '">✉️ Email me</button>' : '') +
      '<div class="osx-mbm-actions"><button type="button" class="osx-mb-follow big' + (following ? ' on' : '') + '" data-mbm-follow>' + (following ? '🔔 Following' : '🔕 Follow') + '</button>' +
      '<button type="button" class="osx-mbm-posts" data-mbm-posts>See their posts →</button></div></div>';
    root.appendChild(pop);
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelectorAll('[data-extlink]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openExtConfirm(a.getAttribute('data-extlink')); }); });
    var fb = pop.querySelector('[data-mbm-follow]'); if (fb) fb.addEventListener('click', function () { var on = toggleFollow(nm); fb.classList.toggle('on', on); fb.textContent = on ? '🔔 Following' : '🔕 Follow'; });
    var eb = pop.querySelector('[data-mbm-email]');
    if (eb) eb.addEventListener('click', function () {
      var id = eb.getAttribute('data-mbm-email'); if (!id) return;
      eb.disabled = true; eb.textContent = 'Revealing…';
      fetch('/apps/p2p/member-email?id=' + encodeURIComponent(id), { credentials: 'same-origin' }).then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.email) { var mail = esc(j.email); eb.outerHTML = '<a class="osx-mbm-email revealed" href="mailto:' + mail + '">✉️ ' + mail + '</a>'; } else { eb.textContent = 'No email shared'; } })
        .catch(function () { eb.disabled = false; eb.textContent = '✉️ Email me'; });
    });
    var pv = pop.querySelector('[data-mbm-posts]'); if (pv) pv.addEventListener('click', function () { close(); if (window.P2P_OSX_GO) window.P2P_OSX_GO('community'); if (window.P2P_COMMUNITY_SEARCH) setTimeout(function () { window.P2P_COMMUNITY_SEARCH(nm); }, 60); });
  }
  function renderAvatars(sel) {
    avVal.v = sel || '';
    if (!avGrid) return;
    avGrid.innerHTML = PRESETS.map(function (e) { return '<button type="button" class="osx-mb-avopt' + (e === avVal.v ? ' on' : '') + '" data-avopt="' + esc(e) + '">' + e + '</button>'; }).join('');
    avGrid.querySelectorAll('[data-avopt]').forEach(function (b) { b.addEventListener('click', function () {
      avVal.v = (avVal.v === b.getAttribute('data-avopt')) ? '' : b.getAttribute('data-avopt');
      avGrid.querySelectorAll('[data-avopt]').forEach(function (x) { x.classList.toggle('on', !!avVal.v && x.getAttribute('data-avopt') === avVal.v); });
      if (avVal.v && f.photo) f.photo.value = '';
    }); });
  }

  /* ---- map (Leaflet, lazy) ---- */
  function ensureLeaflet(cb) {
    if (window.L) { cb(); return; }
    if (!document.querySelector('link[data-leaflet]')) {
      var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = window.P2P_LEAFLET_CSS || 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; css.setAttribute('data-leaflet', '1'); document.head.appendChild(css);
    }
    var js = document.createElement('script'); js.src = window.P2P_LEAFLET_JS || 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = cb; js.onerror = function () { if (mapEl) mapEl.innerHTML = '<div class="osx-cw-empty">Map couldn\'t load right now.</div>'; };
    document.head.appendChild(js);
  }
  var mapReg = []; // one Leaflet instance per element: [{el, map}]
  function buildMapIn(el) {
    if (!window.L || !el) return null;
    var reg = null; for (var i = 0; i < mapReg.length; i++) { if (mapReg[i].el === el) { reg = mapReg[i]; break; } }
    if (!reg) {
      el.innerHTML = '';
      var lm = L.map(el, { scrollWheelZoom: false, attributionControl: true }).setView([39, -98], 3);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(lm);
      reg = { el: el, map: lm }; mapReg.push(reg);
    }
    var map = reg.map;
    map.eachLayer(function (ly) { if ((L.CircleMarker && ly instanceof L.CircleMarker) || ly instanceof L.Marker) map.removeLayer(ly); });
    members.filter(function (p) { return typeof p.lat === 'number' && typeof p.lng === 'number'; }).forEach(function (p) {
      L.circleMarker([p.lat, p.lng], { radius: 7, color: '#0b1620', weight: 2, fillColor: '#f4c534', fillOpacity: 1 })
        .addTo(map).bindPopup('<div class="osx-mb-pop">' + cardHTML(p, true) + '</div>');
    });
    setTimeout(function () { map.invalidateSize(); }, 60);
    setTimeout(function () { map.invalidateSize(); }, 320);
    return map;
  }
  function refreshAllMaps() { mapReg.forEach(function (r) { buildMapIn(r.el); }); }
  function showMap(el) { if (!el) return; ensureLeaflet(function () { buildMapIn(el); }); }
  // Community mini-map card: build/refresh the map it just moved into its expand modal.
  window.P2P_MAP_REFRESH = function () { showMap(mapEl); };

  /* ---- my profile ---- */
  function fillForm(p) {
    if (nameEl) nameEl.value = (p && p.name) || stats().name || '';
    if (f.photo) f.photo.value = (p && !isPreset(p.photo)) ? (p.photo || '') : '';
    if (f.quote) f.quote.value = (p && p.quote) || '';
    if (f.about) f.about.value = (p && p.about) || '';
    if (f.hidden) f.hidden.checked = !!(p && p.hidden);
    if (emailEl) emailEl.value = (p && p.email) || '';
    if (showEmailEl) showEmailEl.checked = !!(p && p.showEmail);
    Object.keys(socialEls).forEach(function (k) { socialEls[k].value = (p && p.social && p.social[k]) || ''; });
    renderAvatars(p && isPreset(p.photo) ? p.photo.slice(7) : '');
  }
  function myKey() { return String(stats().name || '').trim().toLowerCase(); }
  function collect(hidden) {
    var s = stats(), social = {};
    Object.keys(socialEls).forEach(function (k) { var v = (socialEls[k].value || '').trim(); if (v) social[k] = v; });
    var url = (f.photo ? f.photo.value.trim() : '');
    var photo = url ? url : (avVal.v ? ('preset:' + avVal.v) : '');
    var nm = (nameEl && nameEl.value.trim()) || s.name;
    return {
      name: nm, tier: s.tier, tierNum: s.tierNum, points: s.points, badges: s.badges, recentBadges: s.recentBadges, streak: s.streak,
      photo: photo, quote: (f.quote ? f.quote.value.trim() : ''), about: (f.about ? f.about.value.trim() : ''),
      social: social, hidden: hidden,
      email: (emailEl ? emailEl.value.trim() : ''), show_email: (showEmailEl ? !!showEmailEl.checked : false)
    };
  }
  function publish(body) {
    return fetch(PROFILE, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function showStatus(msg, err) { if (!f.status) return; f.status.textContent = msg; f.status.classList.toggle('err', !!err); if (msg) setTimeout(function () { if (f.status.textContent === msg) { f.status.textContent = ''; f.status.classList.remove('err'); } }, 4500); }
  if (f.photo) f.photo.addEventListener('input', function () { if (f.photo.value.trim() && avVal.v) renderAvatars(''); });
  if (f.save) f.save.addEventListener('click', function () {
    if (nameEl) {
      var others = members.filter(function (m) { return String(m.name || '').trim().toLowerCase() !== myKey(); });
      var prob = nameProblem(nameEl.value, others);
      if (prob) { showStatus(prob, true); nameEl.focus(); return; }
    }
    f.save.disabled = true; showStatus('Saving…', false);
    var payload = collect(f.hidden ? f.hidden.checked : false); payload.explicit = true;
    publish(payload).then(function (res) {
      f.save.disabled = false;
      if (res && res.error === 'name_taken') { showStatus('That name is already taken — try another.', true); return; }
      if (res && res.error === 'name_blocked') { showStatus('That name isn’t allowed — please choose another.', true); return; }
      if (res && res.ok) { try { localStorage.setItem('p2p_wc_profile', '1'); } catch (e) {} applyIdentity(res.name || payload.name, payload.photo); }
      showStatus((res && res.ok) ? 'Saved ✓' : 'Try again', !(res && res.ok));
      loadMembers();
    }).catch(function () { f.save.disabled = false; showStatus('Try again', true); });
  });
  if (toolbar.search) toolbar.search.addEventListener('input', function () { searchVal = toolbar.search.value; renderDirectory(); });
  if (toolbar.sort) toolbar.sort.addEventListener('change', function () { sortVal = toolbar.sort.value; renderDirectory(); });

  /* ---- data ---- */
  function loadMembers() {
    fetch(MEMBERS, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.guest) { if (grid) grid.innerHTML = '<div class="osx-cw-empty">Log in to see members.</div>'; return; }
      // merge the server's follow list so favorites persist across devices
      if (j && j.following && j.following.length) { try { var loc2 = follows(), merged = loc2.slice(); j.following.forEach(function (n) { if (merged.indexOf(n) < 0) merged.push(n); }); localStorage.setItem('p2p_follows', JSON.stringify(merged)); } catch (e) {} }
      members = (j && j.members) || []; renderDirectory();
      if (window.L) refreshAllMaps();   // re-pin any live maps (community modal + member board)
    }).catch(function () { if (grid) grid.innerHTML = '<div class="osx-cw-empty">Couldn\'t load members.</div>'; });
  }
  // Make the member's chosen name + avatar show everywhere (sidebar bubble, community "mine" checks, their own profile card), not just the directory.
  function applyIdentity(nm, photo) {
    nm = String(nm || '').trim(); if (!nm) return;
    try { window.P2P_MEMBER_NAME = nm; } catch (e) {}
    document.querySelectorAll('[data-userbar] .osx-username').forEach(function (el) { el.textContent = nm; el.setAttribute('data-profile', nm); });
    document.querySelectorAll('[data-userbar] .osx-userbubble').forEach(function (el) {
      el.setAttribute('data-profile', nm);
      if (isPreset(photo)) el.innerHTML = '<span class="osx-pa-emoji">' + esc(String(photo).slice(7)) + '</span>';
      else if (!photo) el.textContent = initial(nm);
    });
    if (window.P2P_COMMUNITY_RERENDER) { try { window.P2P_COMMUNITY_RERENDER(); } catch (e) {} }
  }
  function initProfile() {
    fetch(PROFILE, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.guest) return;
      myProfile = (j && j.profile) || null;
      if (myProfile && myProfile.name) applyIdentity(myProfile.name, myProfile.photo);
      fillForm(myProfile);
      // auto-publish a refreshed card (opt-out default = shown), preserving personalization + hidden
      publish(collect(myProfile ? !!myProfile.hidden : false)).then(loadMembers).catch(loadMembers);
    }).catch(function () { loadMembers(); });
  }

  /* ---- tabs ---- */
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var k = t.getAttribute('data-mb-tab');
      tabs.forEach(function (x) { x.classList.toggle('on', x === t); });
      panels.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-mb-panel') === k); });
    });
  });

  // The community map lives hidden in a holder and is built only when the mini-map card
  // moves it into its expand modal (window.P2P_MAP_REFRESH) — never while it's display:none.
  // The member-board map is inline; build it when the Members view becomes visible.
  var membersMapEl = root.querySelector('[data-members-map]');
  if (membersMapEl) {
    var mView = membersMapEl.closest('.osx-view');
    function tryMembersMap() { if (mView && mView.classList.contains('on')) showMap(membersMapEl); }
    if (mView) { new MutationObserver(tryMembersMap).observe(mView, { attributes: true, attributeFilter: ['class'] }); }
    tryMembersMap();
  }

  initProfile();
})();
