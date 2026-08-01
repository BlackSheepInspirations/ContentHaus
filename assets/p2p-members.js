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
  var members = [], myProfile = null, mapReady = false, leafMap = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function initial(n) { n = String(n || '').trim(); return n ? n.charAt(0).toUpperCase() : '🐑'; }
  function since(iso) { if (!iso) return ''; try { return 'Member since ' + new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); } catch (e) { return ''; } }
  function loc(p) { return [p.city, p.region || p.country].filter(Boolean).join(', '); }
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
    return {
      name: window.P2P_MEMBER_NAME || '',
      tier: (P.tier ? (P.tier().name || '') : ''),
      points: (P.points ? P.points() : 0),
      badges: (P.earnedSet ? P.earnedSet().length : 0),
      recentBadges: recentBadges(),
      streak: (P.streak ? (P.streak().count || 0) : 0)
    };
  }
  var SICON = { website: '🌐', instagram: '📷', facebook: '📘', youtube: '▶️', x: '✖', linkedin: 'in', tiktok: '🎵' };
  function socialHTML(social) {
    if (!social) return '';
    var out = Object.keys(social).map(function (k) { return '<a href="' + esc(social[k]) + '" target="_blank" rel="noopener" title="' + k + '">' + (SICON[k] || '🔗') + '</a>'; }).join('');
    return out ? '<div class="osx-mb-social">' + out + '</div>' : '';
  }
  function cardHTML(p, compact) {
    var av = p.photo
      ? '<img src="' + esc(p.photo) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
      : '<span>' + esc(initial(p.name)) + '</span>';
    var l = loc(p);
    return '<div class="osx-mb-card' + (compact ? ' compact' : '') + '">' +
      '<div class="osx-mb-av">' + av + '</div>' +
      '<div class="osx-mb-name">' + esc(p.name || 'Member') + '</div>' +
      (p.tier ? '<div class="osx-mb-tier">' + esc(p.tier) + '</div>' : '') +
      '<div class="osx-mb-stat">' + (p.points || 0) + ' pts · ' + (p.badges || 0) + ' badges</div>' +
      (l ? '<div class="osx-mb-loc">📍 ' + esc(l) + '</div>' : '') +
      (p.since ? '<div class="osx-mb-since">' + esc(since(p.since)) + '</div>' : '') +
      (p.quote ? '<p class="osx-mb-quote">“' + esc(p.quote) + '”</p>' : '') +
      (!compact && p.about ? '<p class="osx-mb-about">' + esc(p.about) + '</p>' : '') +
      socialHTML(p.social) +
      '</div>';
  }

  /* ---- directory ---- */
  function renderDirectory() {
    if (!grid) return;
    if (!members.length) { grid.innerHTML = '<div class="osx-cw-empty">No members on the board yet — you might be the first! 🐑</div>'; return; }
    var sorted = members.slice().sort(function (a, b) { return (b.points || 0) - (a.points || 0); });
    grid.innerHTML = sorted.map(function (p) { return cardHTML(p, false); }).join('');
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
  function buildMap() {
    if (!window.L || !mapEl) return;
    if (!leafMap) {
      leafMap = L.map(mapEl, { scrollWheelZoom: false, attributionControl: true }).setView([39, -98], 3);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(leafMap);
    }
    var pts = members.filter(function (p) { return typeof p.lat === 'number' && typeof p.lng === 'number'; });
    pts.forEach(function (p) {
      L.circleMarker([p.lat, p.lng], { radius: 7, color: '#0b1620', weight: 2, fillColor: '#f4c534', fillOpacity: 1 })
        .addTo(leafMap).bindPopup('<div class="osx-mb-pop">' + cardHTML(p, true) + '</div>');
    });
    setTimeout(function () { if (leafMap) leafMap.invalidateSize(); }, 60);
    setTimeout(function () { if (leafMap) leafMap.invalidateSize(); }, 350);
  }
  function openMap() {
    if (mapReady) { if (leafMap) setTimeout(function () { leafMap.invalidateSize(); }, 60); return; }
    mapReady = true;
    if (mapEl) mapEl.innerHTML = '<div class="osx-cw-empty">Loading the map…</div>';
    ensureLeaflet(function () { if (mapEl) mapEl.innerHTML = ''; buildMap(); });
  }

  /* ---- my profile ---- */
  function fillForm(p) {
    if (!p) return;
    if (f.photo) f.photo.value = p.photo || '';
    if (f.quote) f.quote.value = p.quote || '';
    if (f.about) f.about.value = p.about || '';
    if (f.hidden) f.hidden.checked = !!p.hidden;
    Object.keys(socialEls).forEach(function (k) { socialEls[k].value = (p.social && p.social[k]) || ''; });
  }
  function collect(hidden) {
    var s = stats(), social = {};
    Object.keys(socialEls).forEach(function (k) { var v = (socialEls[k].value || '').trim(); if (v) social[k] = v; });
    return {
      name: s.name, tier: s.tier, points: s.points, badges: s.badges, recentBadges: s.recentBadges, streak: s.streak,
      photo: (f.photo ? f.photo.value.trim() : ''), quote: (f.quote ? f.quote.value.trim() : ''), about: (f.about ? f.about.value.trim() : ''),
      social: social, hidden: hidden
    };
  }
  function publish(body) {
    return fetch(PROFILE, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  if (f.save) f.save.addEventListener('click', function () {
    f.save.disabled = true; if (f.status) f.status.textContent = 'Saving…';
    publish(collect(f.hidden ? f.hidden.checked : false)).then(function (res) {
      f.save.disabled = false;
      if (res && res.ok) { try { localStorage.setItem('p2p_wc_profile', '1'); } catch (e) {} }
      if (f.status) { f.status.textContent = (res && res.ok) ? 'Saved ✓' : 'Try again'; setTimeout(function () { f.status.textContent = ''; }, 3000); }
      loadMembers();
    }).catch(function () { f.save.disabled = false; if (f.status) f.status.textContent = 'Try again'; });
  });

  /* ---- data ---- */
  function loadMembers() {
    fetch(MEMBERS, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.guest) { if (grid) grid.innerHTML = '<div class="osx-cw-empty">Log in to see members.</div>'; return; }
      members = (j && j.members) || []; renderDirectory();
      if (mapReady && leafMap) { leafMap.eachLayer(function (ly) { if (ly instanceof L.CircleMarker || ly instanceof L.Marker) leafMap.removeLayer(ly); }); buildMap(); }
    }).catch(function () { if (grid) grid.innerHTML = '<div class="osx-cw-empty">Couldn\'t load members.</div>'; });
  }
  function initProfile() {
    fetch(PROFILE, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.guest) return;
      myProfile = (j && j.profile) || null;
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

  // the map now lives on the Community view — build it when that view opens or scrolls in
  if (mapEl) {
    var commView = mapEl.closest('.osx-view');
    if (commView) {
      var mo = new MutationObserver(function () { if (commView.classList.contains('on')) setTimeout(openMap, 120); });
      mo.observe(commView, { attributes: true, attributeFilter: ['class'] });
      if (commView.classList.contains('on')) setTimeout(openMap, 120);
    }
    if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { openMap(); mio.disconnect(); } });
      }, { threshold: 0.02 });
      mio.observe(mapEl);
    } else { setTimeout(openMap, 200); }
  }

  initProfile();
})();
