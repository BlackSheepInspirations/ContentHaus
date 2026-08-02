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
  var posts = [], winPosts = [], winIdx = 0, winTimer = null, welcomeProfileDone = false, wowPost = null, isAdmin = false, catList = null, memberMap = {}, didDeepLink = false;
  var filter = { category: 'all', range: 'all', sort: 'new', q: '', offset: 0, limit: 20, hasMore: false };
  var CATS = { general: { label: 'General Discussion', emoji: '💬' }, intro: { label: 'Introductions', emoji: '👋' }, wins: { label: 'Wins • Habits • Growth', emoji: '🏆' }, help: { label: 'Questions & Help', emoji: '🙏' }, testimonial: { label: 'Testimonials', emoji: '🙌' }, announce: { label: 'P2P Announcements', emoji: '📣' } };
  function catMeta(k) { return (catList && catList.filter(function (x) { return x.key === k; })[0]) || CATS[k] || null; }
  function catLabel(k) { return (CATS[k] && CATS[k].label) || (catMeta(k) && catMeta(k).label) || ''; }
  // Always source the emoji from this UTF-8 file (never the JSON response) so it renders consistently on every device.
  function catEmoji(k) { return (CATS[k] && CATS[k].emoji) || (catMeta(k) && catMeta(k).emoji) || ''; }
  function seenTs() { var v = 0; try { v = parseInt(localStorage.getItem('p2p_comm_seen') || '0', 10) || 0; } catch (e) {} return v; }
  function cmSeen() { try { return JSON.parse(localStorage.getItem('p2p_cm_seen') || '{}') || {}; } catch (e) { return {}; } }
  function cmSeenSave(o) { try { localStorage.setItem('p2p_cm_seen', JSON.stringify(o)); } catch (e) {} }
  // Baseline = the moment this member first saw the post in the feed; comments after it count as "new" until opened.
  function cmBaseline(p) { var s = cmSeen(); if (!(p.id in s)) { s[p.id] = Date.now(); cmSeenSave(s); } return s[p.id]; }
  function cmLatestTs(p) { var t = 0; (p.comments || []).forEach(function (c) { if (c.ts > t) t = c.ts; }); return t; }
  function markCmSeen(p) { var s = cmSeen(); s[p.id] = Math.max(cmLatestTs(p), Date.now()); cmSeenSave(s); }
  function newCommentCount(p) { var base = cmBaseline(p), me = myName(), n = 0; (p.comments || []).forEach(function (c) { if (c.ts > base && String(c.name || '').trim().toLowerCase() !== me) n++; }); return n; }

  function myName() { return (window.P2P_MEMBER_NAME || '').trim().toLowerCase(); }
  function blockedNames() { try { return JSON.parse(localStorage.getItem('p2p_blocked') || '[]') || []; } catch (e) { return []; } }
  function isBlockedName(nm) { return blockedNames().indexOf(String(nm || '').trim().toLowerCase()) > -1; }
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
  function toast(msg, kind) {
    var t = document.createElement('div'); t.className = 'osx-toast' + (kind ? ' ' + kind : '');
    t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, kind === 'warn' ? 2800 : 1500);
  }
  function syncEngage(total) { if (typeof total !== 'undefined' && total !== null) { try { localStorage.setItem('p2p_engage_points', total); } catch (e) {} } }
  function handleEngage(e) {
    if (!e) return;
    syncEngage(e.total);
    if (e.cooldown) toast('Whoa — liking too fast! Points paused for a few minutes ⏳', 'warn');
    else if (e.awarded > 0) toast('+' + e.awarded + ' pts', 'pts');
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
  var CM_EMOJI = ['😀','😄','😁','😊','🥰','😍','😎','🤩','🥳','😂','🤣','😉','🙌','👏','👍','🙏','💪','🔥','✨','⭐','💯','🎉','❤️','🧡','💛','💚','💙','💜','🖤','💡','✅','👀','😢','😭','🤔','🤯','🤗','🐑','🚀','🌱'];
  function linkify(s) { return esc(s).replace(/(https?:\/\/[^\s<]+)/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener nofollow">' + u + '</a>'; }); }
  function insertAtCaret(input, text) {
    if (!input) return;
    var s = input.selectionStart, e = input.selectionEnd, v = input.value;
    if (typeof s === 'number') { input.value = v.slice(0, s) + text + v.slice(e); var p = s + text.length; input.focus(); try { input.setSelectionRange(p, p); } catch (er) {} }
    else { input.value = v + text; input.focus(); }
  }
  function openEmojiPicker(anchor, input) {
    var ex = root.querySelector('.osx-emojipop'); var wasMine = ex && ex.__for === anchor; if (ex) ex.remove(); if (wasMine) return;
    var pop = document.createElement('div'); pop.className = 'osx-emojipop'; pop.__for = anchor;
    pop.innerHTML = CM_EMOJI.map(function (e) { return '<button type="button" class="osx-emojib">' + e + '</button>'; }).join('');
    root.appendChild(pop);
    var r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
    pop.style.top = ((r.top - pop.offsetHeight - 6) < 8 ? r.bottom + 6 : r.top - pop.offsetHeight - 6) + 'px';
    pop.querySelectorAll('.osx-emojib').forEach(function (b) { b.addEventListener('click', function (ev) { ev.stopPropagation(); insertAtCaret(input, b.textContent); }); });
    setTimeout(function () { document.addEventListener('click', function h(ev) { if (!pop.contains(ev.target) && ev.target !== anchor) { pop.remove(); document.removeEventListener('click', h); } }); }, 0);
  }
  function insertLink(input) {
    var url = window.prompt('Paste a link:', 'https://'); if (!url) return;
    url = url.trim(); if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/+/, '');
    insertAtCaret(input, (input.value && !/\s$/.test(input.value) ? ' ' : '') + url + ' ');
  }
  function cmItem(c, pid) {
    var menu = '';
    if (c.owner || isAdmin) {
      var mi = (c.owner ? '<button type="button" data-cedit="' + esc(pid) + '|' + esc(c.id) + '">✏️ Edit</button>' : '') + '<button type="button" data-cdel="' + esc(pid) + '|' + esc(c.id) + '">🗑️ Delete</button>';
      menu = '<span class="osx-menu"><button type="button" class="osx-menu-dots" data-menu aria-label="More">⋯</button><span class="osx-menu-pop" hidden>' + mi + '</span></span>';
    }
    return '<div class="osx-cm-item" data-cm-item="' + esc(c.id) + '"><div class="osx-cm-itop"><button type="button" class="osx-name-btn" data-profile="' + esc(c.name || '') + '">' + esc(c.name || 'Member') + '</button><span class="osx-cm-time">' + ago(c.ts) + (c.edited ? ' · edited' : '') + '</span>' + menu + '</div><div class="osx-cm-text">' + linkify(c.text) + '</div></div>';
  }
  function commentsHTML(p, open) {
    var cs = (p.comments || []).filter(function (c) { return !isBlockedName(c.name); });
    return '<div class="osx-cm" data-cm="' + esc(p.id) + '"' + (open ? '' : ' hidden') + '>' +
      '<div class="osx-cm-list">' + cs.map(function (c) { return cmItem(c, p.id); }).join('') + '</div>' +
      '<div class="osx-cm-add"><button type="button" class="osx-cm-tool" data-cm-emoji="' + esc(p.id) + '" title="Add an emoji" aria-label="Add an emoji">😊</button><button type="button" class="osx-cm-tool" data-cm-link="' + esc(p.id) + '" title="Add a link" aria-label="Add a link">🔗</button><input class="osx-cm-input" data-cm-input="' + esc(p.id) + '" maxlength="600" placeholder="Write a reply…"><button class="osx-cm-send" type="button" data-cm-send="' + esc(p.id) + '">Reply</button></div>' +
    '</div>';
  }
  function commenterAvatars(p) {
    var cs = p.comments || []; if (!cs.length) return '';
    var seen = {}, uniq = [];
    for (var i = cs.length - 1; i >= 0 && uniq.length < 5; i--) { var k = String(cs[i].name || '').trim().toLowerCase(); if (!k || seen[k]) continue; seen[k] = 1; uniq.push(cs[i].name); }
    return '<span class="osx-cw-cavs">' + uniq.map(function (nm) {
      var mm = memberMap[String(nm || '').trim().toLowerCase()];
      var inner = avInner(mm && mm.photo, nm);
      return '<button type="button" class="osx-cav" title="' + esc(nm || 'Member') + '" data-profile="' + esc(nm || '') + '">' + inner + '</button>';
    }).join('') + '</span>';
  }
  function actsHTML(p) {
    var nc = newCommentCount(p);
    return '<div class="osx-cw-post-acts">' + reactBar(p) +
      '<button class="osx-cw-cbtn' + (nc ? ' hasnew' : '') + '" type="button" data-ctoggle="' + esc(p.id) + '">💬 <span>' + ((p.comments || []).length) + '</span>' + (nc ? '<span class="osx-cw-newc">' + nc + ' new</span>' : '') + '</button>' +
      commenterAvatars(p) +
    '</div>';
  }
  function postMenu(p) {
    var items = '';
    if (p.owner) items += '<button type="button" data-pedit="' + esc(p.id) + '">✏️ Edit</button>';
    if (p.owner || isAdmin) items += '<button type="button" data-pdel="' + esc(p.id) + '">🗑️ Delete</button>';
    if (!p.owner) items += '<button type="button" data-preport="' + esc(p.id) + '">⚑ Report</button>';
    if (!items) return '';
    return '<span class="osx-menu"><button type="button" class="osx-menu-dots" data-menu aria-label="More">⋯</button><span class="osx-menu-pop" hidden>' + items + '</span></span>';
  }
  function closeMenus() { Array.prototype.forEach.call(document.querySelectorAll('.osx-menu-pop'), function (m) { m.hidden = true; }); }
  function wireMenus(container) {
    container.querySelectorAll('[data-menu]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); var pop = b.nextElementSibling; var open = pop.hidden; closeMenus(); pop.hidden = !open; });
    });
  }
  function findPost(id) { if (wowPost && wowPost.id === id) return wowPost; return posts.filter(function (p) { return p.id === id; })[0]; }
  function reportPost(id, btn) {
    if (btn && btn.disabled) return;
    if (!window.confirm('Report this post to the team for review?')) return;
    var post = findPost(id);
    var txt = post ? ('Reported wall post by ' + (post.name || 'Member') + ':\n\n"' + post.text + '"') : ('Reported post ' + id);
    if (btn) btn.disabled = true;
    fetch('/apps/p2p/suggest', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: txt, kind: 'Report' }) })
      .then(function (r) { return r.json(); }).then(function () { if (btn) btn.textContent = 'reported ✓'; }).catch(function () { if (btn) btn.disabled = false; });
  }
  function deletePost(id) {
    if (!window.confirm('Delete this post? This can\'t be undone.')) return;
    fetch('/apps/p2p/postmod', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: id, action: 'delete' }) })
      .then(function (r) { return r.json(); }).then(function (res) { if (res && res.ok) { load(false); loadWins(); } }).catch(function () {});
  }
  function openEditPost(id) {
    var p = findPost(id); if (!p) return;
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-composer"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<div class="osx-comp-h">Edit post</div>' +
      '<input class="osx-comp-title" data-e-title maxlength="120" placeholder="Title (optional)">' +
      '<textarea class="osx-comp-body" data-e-body maxlength="1000"></textarea>' +
      '<div class="osx-comp-foot"><button type="button" class="osx-comp-cancel">Cancel</button><button type="button" class="osx-comp-post">Save</button></div></div>';
    document.body.appendChild(pop);
    var tI = pop.querySelector('[data-e-title]'), bI = pop.querySelector('[data-e-body]'), saveB = pop.querySelector('.osx-comp-post');
    tI.value = p.title || ''; bI.value = p.text || '';
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-comp-cancel').addEventListener('click', close);
    saveB.addEventListener('click', function () {
      var text = (bI.value || '').trim(); if (!text) return;
      saveB.disabled = true; saveB.textContent = 'Saving…';
      fetch('/apps/p2p/postmod', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: id, action: 'edit', title: (tI.value || '').trim(), text: text }) })
        .then(function (r) { return r.json(); }).then(function (res) { if (res && res.ok) { close(); load(false); loadWins(); } else { saveB.disabled = false; saveB.textContent = 'Save'; } })
        .catch(function () { saveB.disabled = false; saveB.textContent = 'Save'; });
    });
    setTimeout(function () { bI.focus(); }, 40);
  }
  function deleteComment(pid, cid) {
    if (!window.confirm('Delete this comment?')) return;
    fetch('/apps/p2p/commentmod', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: pid, cid: cid, action: 'delete' }) })
      .then(function (r) { return r.json(); }).then(function (res) { if (res && res.ok) load(false); }).catch(function () {});
  }
  function openEditComment(pid, cid) {
    var el = document.querySelector('[data-cm-item="' + cid + '"] .osx-cm-text'); if (!el) return;
    var old = el.textContent;
    el.innerHTML = '<textarea class="osx-cm-edit" maxlength="600"></textarea><div class="osx-cm-erow"><button type="button" class="osx-cm-ecancel">Cancel</button><button type="button" class="osx-cm-esave">Save</button></div>';
    var ta = el.querySelector('.osx-cm-edit'); ta.value = old; ta.focus();
    el.querySelector('.osx-cm-ecancel').addEventListener('click', function () { load(false); });
    el.querySelector('.osx-cm-esave').addEventListener('click', function () {
      var text = (ta.value || '').trim(); if (!text) return;
      fetch('/apps/p2p/commentmod', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: pid, cid: cid, action: 'edit', text: text }) })
        .then(function (r) { return r.json(); }).then(function (res) { if (res && res.ok) load(false); }).catch(function () {});
    });
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
  function wins() { return winPosts; }
  function stopTimer() { if (winTimer) { clearInterval(winTimer); winTimer = null; } }

  function titleHTML(p) { return p.title ? '<div class="osx-cw-post-title">' + esc(p.title) + '</div>' : ''; }
  function pinBtn(p) {
    if (isAdmin) return '<button class="osx-pin-btn' + (p.pinned ? ' on' : '') + '" type="button" data-pin="' + esc(p.id) + '" title="' + (p.pinned ? 'Unpin' : 'Pin to top') + '">📌</button>';
    return p.pinned ? '<span class="osx-pin-badge" title="Pinned">📌</span>' : '';
  }
  function avInner(photo, name) {
    if (/^preset:/.test(String(photo || ''))) return '<span class="osx-pa-emoji">' + esc(String(photo).slice(7)) + '</span>';
    if (photo) return '<img src="' + esc(photo) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">';
    return esc((name || '?').trim().charAt(0).toUpperCase() || '🐑');
  }
  function postAvatar(p) {
    var mm = memberMap[String(p.name || '').trim().toLowerCase()];
    var inner = avInner(mm && mm.photo, p.name);
    var tier = (mm && mm.tierNum) ? '<span class="osx-pa-tier">' + mm.tierNum + '</span>' : '';
    return '<button type="button" class="osx-pa osx-pa-btn" data-profile="' + esc(p.name || '') + '">' + inner + tier + '</button>';
  }
  function attHTML(atts) {
    if (!atts || !atts.length) return '';
    return '<div class="osx-att">' + atts.map(function (a) {
      if (a.type === 'image' || a.type === 'gif') return '<img class="osx-att-img" src="' + esc(a.url) + '" alt="" loading="lazy" data-lightbox="' + esc(a.url) + '">';
      if (a.type === 'youtube') return '<div class="osx-att-yt"><iframe src="https://www.youtube.com/embed/' + esc(a.vid || '') + '" title="video" frameborder="0" allow="encrypted-media" allowfullscreen loading="lazy"></iframe></div>';
      return '<a class="osx-att-link" href="' + esc(a.url) + '" target="_blank" rel="noopener">🔗 ' + esc(a.title || a.url) + '</a>';
    }).join('') + '</div>';
  }
  function catChip(p) { var k = p.category || 'general'; return '<span class="osx-cw-cat">' + esc(catEmoji(k)) + ' ' + esc(catLabel(k)) + '</span>'; }
  function unreadDot(p) { return (p.ts > seenTs() && String(p.name || '').trim().toLowerCase() !== myName()) ? '<span class="osx-unread" title="New"></span>' : ''; }
  function headHTML(p) {
    return '<div class="osx-cw-head">' + postAvatar(p) +
      '<div class="osx-cw-hmeta"><div class="osx-cw-nameline">' + unreadDot(p) + '<button type="button" class="osx-name-btn" data-profile="' + esc(p.name || '') + '">' + esc(p.name || 'Member') + '</button>' + flame(p.streak) + houseTag(p) + '</div>' +
      '<div class="osx-cw-sub">' + ago(p.ts) + ' · ' + catChip(p) + (p.edited ? ' · edited' : '') + '</div></div>' + pinBtn(p) + postMenu(p) + '</div>';
  }
  function postHTML(p) {
    var lng = (p.text || '').length > 280;
    return '<div class="osx-cw-post' + (p.house ? ' house' : '') + (p.pinned ? ' pinned' : '') + '" data-post="' + esc(p.id) + '">' +
      headHTML(p) + titleHTML(p) + attHTML(p.attachments) +
      '<div class="osx-cw-post-text' + (lng ? ' clamp' : '') + '">' + esc(p.text) + '</div>' +
      (lng ? '<button class="osx-cw-more" type="button" data-more>Read more ▾</button>' : '') +
      actsHTML(p) + commentsHTML(p, false) +
    '</div>';
  }
  function wowHTML(p) {
    return '<div class="osx-wow" data-post="' + esc(p.id) + '">' +
      '<div class="osx-wow-ribbon">🏆 Win of the Week</div>' +
      headHTML(p) + titleHTML(p) + attHTML(p.attachments) +
      '<div class="osx-cw-post-text">' + esc(p.text) + '</div>' +
      actsHTML(p) + commentsHTML(p, false) +
    '</div>';
  }
  function openPostModal(id) {
    var p = findPost(id) || posts.filter(function (x) { return x.id === id; })[0];
    if (!p) return false;
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-pm"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      headHTML(p) + titleHTML(p) +
      '<div class="osx-cw-post-text">' + esc(p.text) + '</div>' + attHTML(p.attachments) +
      '<div class="osx-cw-post-acts">' + reactBar(p) +
        '<span class="osx-cw-cbtn" style="cursor:default">💬 ' + ((p.comments || []).length) + '</span>' + commenterAvatars(p) +
        '<button class="osx-cw-cbtn osx-pm-copy" type="button">🔗 Copy link</button>' +
      '</div>' + commentsHTML(p, true) + '</div>';
    root.appendChild(pop);
    markCmSeen(p);
    var box = pop.querySelector('.osx-cal-pop-in');
    function close() { pop.remove(); try { if (new URLSearchParams(location.search).get('post')) history.replaceState(null, '', location.pathname); } catch (e) {} }
    wireReacts(box); wireComments(box); wireMenus(box);
    box.querySelectorAll('[data-lightbox]').forEach(function (im) { im.addEventListener('click', function () { openLightbox(im.getAttribute('data-lightbox')); }); });
    box.querySelectorAll('[data-pedit]').forEach(function (b) { b.addEventListener('click', function () { close(); openEditPost(b.getAttribute('data-pedit')); }); });
    box.querySelectorAll('[data-pdel]').forEach(function (b) { b.addEventListener('click', function () { close(); deletePost(b.getAttribute('data-pdel')); }); });
    box.querySelectorAll('[data-preport]').forEach(function (b) { b.addEventListener('click', function () { reportPost(b.getAttribute('data-preport'), b); }); });
    var copyB = box.querySelector('.osx-pm-copy');
    if (copyB) copyB.addEventListener('click', function () {
      var url = location.origin + location.pathname + '?post=' + encodeURIComponent(id);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { copyB.textContent = 'Copied ✓'; }).catch(function () { window.prompt('Copy this link:', url); });
      else window.prompt('Copy this link:', url);
    });
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    return true;
  }
  function emptyMsg() {
    if (filter.q) return 'No posts match “' + esc(filter.q) + '.”';
    if (filter.sort === 'unread') return 'You\'re all caught up — no unread posts. 🎉';
    if (filter.category !== 'all') return 'Nothing in this channel yet — start the conversation. 👋';
    return 'Nothing here yet — be the first to say hello. 👋';
  }
  function renderWall() {
    if (!feed) return;
    var list = (wowPost ? posts.filter(function (p) { return p.id !== wowPost.id; }) : posts).filter(function (p) { return !isBlockedName(p.name); });
    var wp = (wowPost && !isBlockedName(wowPost.name)) ? wowPost : null;
    if (!list.length && !wp) { feed.innerHTML = empty(emptyMsg()); return; }
    feed.innerHTML = (wp ? wowHTML(wp) : '') + list.map(postHTML).join('');
    wireReacts(feed); wireComments(feed);
    feed.querySelectorAll('[data-lightbox]').forEach(function (im) { im.addEventListener('click', function () { openLightbox(im.getAttribute('data-lightbox')); }); });
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
    wireMenus(feed);
    feed.querySelectorAll('[data-pedit]').forEach(function (b) { b.addEventListener('click', function () { openEditPost(b.getAttribute('data-pedit')); }); });
    feed.querySelectorAll('[data-pdel]').forEach(function (b) { b.addEventListener('click', function () { deletePost(b.getAttribute('data-pdel')); }); });
    feed.querySelectorAll('[data-preport]').forEach(function (b) { b.addEventListener('click', function () { reportPost(b.getAttribute('data-preport'), b); }); });
    feed.querySelectorAll('[data-post]').forEach(function (card) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function (e) {
        if (e.target.closest('button, a, input, textarea, select, .osx-menu, .osx-menu-pop, .osx-att-img, .osx-att-yt, .osx-cm')) return;
        openPostModal(card.getAttribute('data-post'));
      });
    });
  }
  function wireComments(container) {
    container.querySelectorAll('[data-cedit]').forEach(function (b) { b.addEventListener('click', function () { var pr = b.getAttribute('data-cedit').split('|'); openEditComment(pr[0], pr[1]); }); });
    container.querySelectorAll('[data-cdel]').forEach(function (b) { b.addEventListener('click', function () { var pr = b.getAttribute('data-cdel').split('|'); deleteComment(pr[0], pr[1]); }); });
    container.querySelectorAll('[data-ctoggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-ctoggle');
        var box = container.querySelector('[data-cm="' + id + '"]');
        if (box) { box.hidden = !box.hidden; if (!box.hidden) { var inp = box.querySelector('[data-cm-input]'); if (inp) inp.focus(); var pp = findPost(id); if (pp) { markCmSeen(pp); b.classList.remove('hasnew'); var nb = b.querySelector('.osx-cw-newc'); if (nb) nb.remove(); } } }
      });
    });
    container.querySelectorAll('[data-cm-emoji]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); var inp = container.querySelector('[data-cm-input="' + b.getAttribute('data-cm-emoji') + '"]'); openEmojiPicker(b, inp); }); });
    container.querySelectorAll('[data-cm-link]').forEach(function (b) { b.addEventListener('click', function () { var inp = container.querySelector('[data-cm-input="' + b.getAttribute('data-cm-link') + '"]'); insertLink(inp); }); });
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
          var list = box.querySelector('.osx-cm-list'); if (list) { list.insertAdjacentHTML('beforeend', cmItem(res.comment, id)); wireMenus(list); list.querySelectorAll('[data-cdel]').forEach(function (bd) { bd.addEventListener('click', function () { var pr = bd.getAttribute('data-cdel').split('|'); deleteComment(pr[0], pr[1]); }); }); list.querySelectorAll('[data-cedit]').forEach(function (bd) { bd.addEventListener('click', function () { var pr = bd.getAttribute('data-cedit').split('|'); openEditComment(pr[0], pr[1]); }); }); }
          var pp = posts.filter(function (p) { return p.id === id; })[0];
          if (pp) { pp.comments = pp.comments || []; pp.comments.push(res.comment); var cnt = container.querySelector('[data-ctoggle="' + id + '"] span'); if (cnt) cnt.textContent = pp.comments.length; }
          if (res.engage) handleEngage(res.engage);
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
        '<div class="osx-wside-foot"><button type="button" class="osx-wside-by osx-name-btn" data-profile="' + esc(p.name || '') + '">' + esc(p.name || 'Member') + '</button>' + loveChip(p) + '</div>' +
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
            if (res.engage) handleEngage(res.engage);
          }).catch(function () { delete btn.dataset.busy; setReactBtn(btn, wasOn, cur); });
      });
    });
  }

  function render() { renderWall(); renderWinsSide(); updateWelcome(); }

  function buildQuery(offset) {
    var qp = ['category=' + encodeURIComponent(filter.category), 'range=' + encodeURIComponent(filter.range), 'limit=' + filter.limit, 'offset=' + offset];
    if (filter.q) qp.push('q=' + encodeURIComponent(filter.q));
    if (filter.sort === 'unread') qp.push('unreadSince=' + seenTs());
    return PROXY + '?' + qp.join('&');
  }
  function updateSeen() {
    try {
      var newest = seenTs();
      posts.forEach(function (p) { if (p.ts > newest) newest = p.ts; });
      if (wowPost && wowPost.ts > newest) newest = wowPost.ts;
      localStorage.setItem('p2p_comm_seen', String(newest));
    } catch (e) {}
  }
  function load(append) {
    var offset = append ? filter.offset : 0;
    var moreBtn = root.querySelector('[data-loadmore]');
    if (moreBtn) moreBtn.disabled = true;
    fetch(buildQuery(offset), { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (moreBtn) moreBtn.disabled = false;
        if (j && j.guest) { stopTimer(); if (feed) feed.innerHTML = empty('Log in to see and share with the community.'); return; }
        if (!j) { if (feed && !append) feed.innerHTML = empty('Couldn\'t load the wall just now — try again in a moment.'); return; }
        if (j.categories) { catList = j.categories; renderTabs(); }
        isAdmin = !!j.isAdmin;
        wowPost = j.wowPost || null;
        syncEngage(j.engageTotal);
        var page = j.posts || [];
        posts = append ? posts.concat(page) : page;
        filter.offset = offset + page.length;
        filter.hasMore = !!j.hasMore;
        render();
        updateSeen();
        if (!append && !didDeepLink) { didDeepLink = true; try { var dp = new URLSearchParams(location.search).get('post'); if (dp && findPost(dp)) openPostModal(dp); } catch (e) {} }
        var mb = root.querySelector('[data-loadmore]'); if (mb) mb.hidden = !filter.hasMore;
      })
      .catch(function () { var mb = root.querySelector('[data-loadmore]'); if (mb) mb.disabled = false; if (feed && !append) feed.innerHTML = empty('Couldn\'t load the wall just now — try again in a moment.'); });
  }
  function loadWins() {
    fetch(PROXY + '?category=wins&limit=8', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { if (!j || j.guest) return; winPosts = j.posts || []; if (winIdx >= winPosts.length) winIdx = 0; renderWinsSide(); })
      .catch(function () {});
  }
  function openLightbox(url) {
    var pop = document.createElement('div'); pop.className = 'osx-lightbox';
    pop.innerHTML = '<button class="osx-lb-x" type="button" aria-label="Close">✕</button><img src="' + esc(url) + '" alt="">';
    document.body.appendChild(pop);
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop || (e.target.className || '').indexOf('osx-lb-x') > -1) close(); });
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
      var mmc = root.querySelector('[data-mini-map-count]'); if (mmc) mmc.textContent = '📍 ' + m.length + (m.length === 1 ? ' creator' : ' creators');
      var nm = myName();
      if (nm && m.some(function (x) { return String(x.name || '').trim().toLowerCase() === nm && (x.photo || x.quote || x.about); })) welcomeProfileDone = true;
      memberMap = {};
      m.forEach(function (x) { if (x.name) memberMap[String(x.name).trim().toLowerCase()] = { photo: x.photo || '', tier: x.tier || '', tierNum: x.tierNum || 0 }; });
      renderGrowth(m); renderSpotlight(m); updateWelcome();
      if (posts.length || wowPost) renderWall();   // now that we have photos/tiers, repaint the feed
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

  /* ---- channel tabs ---- */
  var tabsEl = root.querySelector('[data-cat-tabs]');
  function renderTabs() {
    if (!tabsEl) return;
    var cats = catList || Object.keys(CATS).map(function (k) { return { key: k, label: CATS[k].label, emoji: CATS[k].emoji }; });
    tabsEl.innerHTML = '<button class="osx-cat-tab' + (filter.category === 'all' ? ' on' : '') + '" data-cat="all">All</button>' +
      cats.map(function (c) { return '<button class="osx-cat-tab' + (filter.category === c.key ? ' on' : '') + '" data-cat="' + c.key + '">' + esc(catEmoji(c.key)) + ' ' + esc(catLabel(c.key)) + '</button>'; }).join('');
    tabsEl.querySelectorAll('[data-cat]').forEach(function (b) {
      b.addEventListener('click', function () { filter.category = b.getAttribute('data-cat'); filter.offset = 0; renderTabs(); load(false); });
    });
  }

  /* ---- search + sort ---- */
  var searchEl = root.querySelector('[data-search]'), sortEl = root.querySelector('[data-sort]'), searchT = null;
  if (searchEl) searchEl.addEventListener('input', function () { clearTimeout(searchT); searchT = setTimeout(function () { filter.q = searchEl.value.trim(); filter.offset = 0; load(false); }, 350); });
  if (sortEl) sortEl.addEventListener('change', function () { var v = sortEl.value.split('|'); filter.sort = v[0]; filter.range = v[1] || 'all'; filter.offset = 0; load(false); });
  var moreBtnEl = root.querySelector('[data-loadmore]');
  if (moreBtnEl) moreBtnEl.addEventListener('click', function () { load(true); });

  /* ---- pop-up rich composer ---- */
  var composeAv = root.querySelector('[data-compose-av]');
  if (composeAv) { var mn = (window.P2P_MEMBER_NAME || '').trim(); composeAv.textContent = mn ? mn.charAt(0).toUpperCase() : '🐑'; }
  var openLine = root.querySelector('[data-compose-open]');
  if (openLine) openLine.addEventListener('click', function () { openComposer(); });

  var EMOJIS = '😀 😁 😂 🤣 😊 😍 🥰 😎 🤩 🥳 👍 🙏 🔥 💪 🎉 ✨ 🚀 💡 ❤️ 💛 🖤 🐑 🌱 🏆 📈 ✅ 👀 😅 🤔 🙌 👏 💯 😢 😮 😉 🤝 📣 🎯 💰 ⭐'.split(' ');
  function insertAtCursor(el, txt) {
    var s = el.selectionStart || 0, e = el.selectionEnd || 0, v = el.value;
    el.value = v.slice(0, s) + txt + v.slice(e); el.selectionStart = el.selectionEnd = s + txt.length; el.focus();
  }
  function openEmoji(anchor, target) {
    var ex = document.querySelector('.osx-emoji-pop'); if (ex) { ex.remove(); return; }
    var pop = document.createElement('div'); pop.className = 'osx-emoji-pop';
    pop.innerHTML = EMOJIS.map(function (e) { return '<button type="button">' + e + '</button>'; }).join('');
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = Math.max(8, r.left) + 'px';
    pop.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { insertAtCursor(target, b.textContent); pop.remove(); }); });
    setTimeout(function () { document.addEventListener('click', function h(ev) { if (!pop.contains(ev.target) && ev.target !== anchor) { pop.remove(); document.removeEventListener('click', h); } }); }, 0);
  }
  function openGiphy(anchor, onPick) {
    var ex = document.querySelector('.osx-giphy-pop'); if (ex) { ex.remove(); return; }
    var pop = document.createElement('div'); pop.className = 'osx-giphy-pop';
    pop.innerHTML = '<div class="osx-giphy-search"><input type="search" placeholder="Search GIPHY…" data-giphy-q></div>' +
      '<div class="osx-giphy-grid" data-giphy-grid><div class="osx-giphy-note">Loading…</div></div>' +
      '<div class="osx-giphy-cred">POWERED BY GIPHY</div>';
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect();
    pop.style.top = Math.min(r.bottom + 6, window.innerHeight - 420) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 330)) + 'px';
    var grid = pop.querySelector('[data-giphy-grid]'), inp = pop.querySelector('[data-giphy-q]'), t = null;
    function search(q) {
      grid.innerHTML = '<div class="osx-giphy-note">Loading…</div>';
      fetch('/apps/p2p/giphy?q=' + encodeURIComponent(q || ''), { credentials: 'same-origin' })
        .then(function (res) { return res.json(); })
        .then(function (j) {
          if (!j || j.error === 'no_key') { grid.innerHTML = '<div class="osx-giphy-note">GIF search isn\'t set up yet.</div>'; return; }
          var gifs = j.gifs || [];
          if (!gifs.length) { grid.innerHTML = '<div class="osx-giphy-note">No GIFs found.</div>'; return; }
          grid.innerHTML = gifs.map(function (g) { return '<button type="button" class="osx-giphy-item" data-gif="' + esc(g.url) + '"><img src="' + esc(g.preview) + '" alt="" loading="lazy"></button>'; }).join('');
          grid.querySelectorAll('[data-gif]').forEach(function (b) { b.addEventListener('click', function () { onPick(b.getAttribute('data-gif')); pop.remove(); }); });
        })
        .catch(function () { grid.innerHTML = '<div class="osx-giphy-note">Couldn\'t reach GIPHY.</div>'; });
    }
    inp.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { search(inp.value.trim()); }, 350); });
    search('');
    setTimeout(function () { inp.focus(); document.addEventListener('click', function h(ev) { if (!pop.contains(ev.target) && ev.target !== anchor) { pop.remove(); document.removeEventListener('click', h); } }); }, 0);
  }
  function composerCats() {
    var cats = catList || Object.keys(CATS).map(function (k) { return { key: k, label: CATS[k].label, emoji: CATS[k].emoji, post: 'all' }; });
    return cats.filter(function (c) { return c.post !== 'admin' || isAdmin; });
  }
  function openComposer() {
    var atts = [];
    var selCat = (filter.category !== 'all' && (CATS[filter.category])) ? filter.category : 'general';
    var cats = composerCats();
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-composer"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<div class="osx-comp-h">New post</div>' +
      '<input class="osx-comp-title" data-comp-title maxlength="120" placeholder="Title (optional)">' +
      '<textarea class="osx-comp-body" data-comp-body maxlength="1000" placeholder="Write something…"></textarea>' +
      '<div class="osx-comp-atts" data-comp-atts></div>' +
      '<div class="osx-comp-bar"><div class="osx-comp-tools">' +
        '<button type="button" class="osx-comp-tool" data-tool="emoji" title="Emoji">😀</button>' +
        '<button type="button" class="osx-comp-tool" data-tool="image" title="Add image (URL)">🖼️</button>' +
        '<button type="button" class="osx-comp-tool" data-tool="gif" title="Add GIF (URL)">GIF</button>' +
        '<button type="button" class="osx-comp-tool" data-tool="video" title="Add video (YouTube/Loom/Vimeo)">▶️</button>' +
        '<button type="button" class="osx-comp-tool" data-tool="link" title="Add link">🔗</button>' +
      '</div>' +
      '<select class="osx-comp-cat" data-comp-cat>' + cats.map(function (c) { return '<option value="' + c.key + '"' + (c.key === selCat ? ' selected' : '') + '>' + esc(catEmoji(c.key) + ' ' + catLabel(c.key)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="osx-comp-foot"><button type="button" class="osx-comp-cancel">Cancel</button><button type="button" class="osx-comp-post">Post</button></div></div>';
    document.body.appendChild(pop);
    var body = pop.querySelector('[data-comp-body]'), titleI = pop.querySelector('[data-comp-title]'), catSel = pop.querySelector('[data-comp-cat]'), attWrap = pop.querySelector('[data-comp-atts]'), postB = pop.querySelector('.osx-comp-post');
    function close() { pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelector('.osx-comp-cancel').addEventListener('click', close);
    function renderAtts() {
      attWrap.innerHTML = atts.map(function (a, i) { return '<span class="osx-comp-att">' + (a.type === 'youtube' ? '▶️' : a.type === 'link' ? '🔗' : '🖼️') + ' ' + esc((a.title || a.url).slice(0, 42)) + '<button type="button" data-att-rm="' + i + '" aria-label="Remove">✕</button></span>'; }).join('');
      attWrap.querySelectorAll('[data-att-rm]').forEach(function (b) { b.addEventListener('click', function () { atts.splice(+b.getAttribute('data-att-rm'), 1); renderAtts(); }); });
    }
    pop.querySelectorAll('[data-tool]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-tool');
        if (t === 'emoji') { openEmoji(b, body); return; }
        if (t === 'gif') { openGiphy(b, function (u) { if (atts.length < 6) { atts.push({ type: 'gif', url: u }); renderAtts(); } else alert('Up to 6 attachments per post.'); }); return; }
        if (atts.length >= 6) { alert('Up to 6 attachments per post.'); return; }
        var label = t === 'video' ? 'Paste a YouTube, Loom, or Vimeo link:' : t === 'image' ? 'Paste an image URL:' : 'Paste a link URL:';
        var url = window.prompt(label, 'https://'); if (!url) return; url = url.trim(); if (!/^https?:\/\//i.test(url)) { alert('Please paste a full http(s) link.'); return; }
        atts.push({ type: t, url: url }); renderAtts();
      });
    });
    postB.addEventListener('click', function () {
      var text = (body.value || '').trim(), ttl = (titleI.value || '').trim();
      if (!text && !ttl && !atts.length) return;
      postB.disabled = true; postB.textContent = 'Posting…';
      fetch(PROXY, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: text || ' ', title: ttl, category: catSel.value, attachments: atts, kind: 'post', name: window.P2P_MEMBER_NAME || '', streak: myStreak() }) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) { try { localStorage.setItem('p2p_wc_hello', '1'); } catch (e) {} if (res.engage) handleEngage(res.engage); close(); if (filter.category !== 'all' && filter.category !== catSel.value) filter.category = catSel.value; filter.offset = 0; renderTabs(); load(false); loadWins(); }
          else { postB.disabled = false; postB.textContent = 'Post'; }
        })
        .catch(function () { postB.disabled = false; postB.textContent = 'Post'; });
    });
    setTimeout(function () { titleI.focus(); }, 40);
  }

  var winAdd = root.querySelector('[data-win-add]'), winBox = root.querySelector('[data-win-addbox]'),
      winText = root.querySelector('[data-win-addtext]'), winShare = root.querySelector('[data-win-share]');
  if (winAdd && winBox) winAdd.addEventListener('click', function () { winBox.hidden = !winBox.hidden; if (!winBox.hidden && winText) winText.focus(); });
  if (winShare) winShare.addEventListener('click', function () {
    var t = (winText && winText.value || '').trim(); if (!t) return;
    winShare.disabled = true; winShare.textContent = 'Sharing…';
    fetch(PROXY, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ text: t, kind: 'win', name: window.P2P_MEMBER_NAME || '', streak: myStreak() }) })
      .then(function (r) { return r.json(); })
      .then(function (res) { winShare.disabled = false; winShare.textContent = 'Share win'; if (res && res.ok) { winText.value = ''; if (winBox) winBox.hidden = true; try { localStorage.setItem('p2p_wc_win', '1'); } catch (e) {} if (res.engage) handleEngage(res.engage); confetti(); load(false); loadWins(); } })
      .catch(function () { winShare.disabled = false; winShare.textContent = 'Share win'; });
  });

  /* ---- profile hover + click card (post / comment / win authors, commenter avatars) ---- */
  var profEl = null, profShowT = null, profHideT = null, profPinned = false, profKey = '';
  function memberProfile(nm) {
    var key = String(nm || '').trim().toLowerCase(), mm = memberMap[key] || {};
    var mine = posts.filter(function (p) { return String(p.name || '').trim().toLowerCase() === key; });
    var recent = mine.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); })[0];
    return { name: nm, photo: mm.photo || '', tier: mm.tier || '', tierNum: mm.tierNum || 0, posts: mine.length, wins: mine.filter(function (p) { return p.kind === 'win'; }).length, streak: recent ? (recent.streak || 0) : 0 };
  }
  function buildProfCard(nm) {
    var pr = memberProfile(nm);
    var full = (window.P2P_MEMBER_BY_NAME && window.P2P_MEMBER_BY_NAME(nm)) || null;
    var av = avInner((full && full.photo) || pr.photo, pr.name);
    var tier = (full && full.tier) || pr.tier || 'Member';
    var loc = full ? [full.city, full.region || full.country].filter(Boolean).join(', ') : '';
    var socials = (full && full.social && window.P2P_MEMBER_SOCIAL_HTML) ? window.P2P_MEMBER_SOCIAL_HTML(full.social) : '';
    var el = document.createElement('div'); el.className = 'osx-profcard';
    el.innerHTML =
      '<div class="osx-profcard-top"><span class="osx-profcard-av">' + av + (pr.tierNum ? '<span class="osx-pa-tier">' + pr.tierNum + '</span>' : '') + '</span>' +
      '<div class="osx-profcard-id"><div class="osx-profcard-name">' + esc(pr.name || 'Member') + (pr.streak ? ' <span class="osx-profcard-fire">' + pr.streak + '🔥</span>' : '') + '</div>' +
      '<div class="osx-profcard-rank">' + esc(tier) + '</div>' + (loc ? '<div class="osx-profcard-loc">📍 ' + esc(loc) + '</div>' : '') + '</div></div>' +
      '<div class="osx-profcard-stats"><div><b>' + ((full && full.points) || 0) + '</b><span>points</span></div><div><b>' + ((full && full.badges) || 0) + '</b><span>badges</span></div><div><b>' + pr.posts + '</b><span>posts</span></div></div>' +
      (full && full.quote ? '<p class="osx-profcard-quote">“' + esc(full.quote) + '”</p>' : '') +
      socials +
      (pr.posts ? '<button type="button" class="osx-profcard-view" data-profview="' + esc(pr.name || '') + '">See their posts</button>' : '');
    return el;
  }
  function placeProf(anchor) {
    if (!profEl || !anchor) return;
    var r = anchor.getBoundingClientRect(), w = profEl.offsetWidth || 240, h = profEl.offsetHeight || 130;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    var top = r.bottom + 8; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 8);
    profEl.style.left = left + 'px'; profEl.style.top = top + 'px';
  }
  function hideProf(force) {
    clearTimeout(profShowT); clearTimeout(profHideT);
    if (profEl && (force || !profPinned)) { profEl.remove(); profEl = null; profKey = ''; profPinned = false; }
  }
  function showProf(nm, anchor, pinned) {
    var key = String(nm || '').trim().toLowerCase(); if (!key) return;
    if (profEl && profKey === key) { if (pinned) { profPinned = true; placeProf(anchor); } return; }
    hideProf(true);
    profKey = key; profPinned = !!pinned;
    profEl = buildProfCard(nm); root.appendChild(profEl);
    profEl.addEventListener('mouseenter', function () { clearTimeout(profHideT); });
    profEl.addEventListener('mouseleave', function () { if (!profPinned) profHideT = setTimeout(function () { hideProf(false); }, 200); });
    profEl.querySelectorAll('[data-extlink]').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); if (window.P2P_EXT_CONFIRM) window.P2P_EXT_CONFIRM(a.getAttribute('data-extlink')); }); });
    var vb = profEl.querySelector('[data-profview]');
    if (vb) vb.addEventListener('click', function () { var q = vb.getAttribute('data-profview'); filter.q = q; filter.offset = 0; if (searchEl) searchEl.value = q; renderTabs(); load(false); hideProf(true); if (feed && feed.scrollIntoView) feed.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    placeProf(anchor);
  }
  root.addEventListener('mouseover', function (e) {
    var t = e.target.closest ? e.target.closest('[data-profile]') : null; if (!t || !root.contains(t)) return;
    clearTimeout(profHideT); var nm = t.getAttribute('data-profile'); if (!nm) return;
    profShowT = setTimeout(function () { showProf(nm, t, false); }, 280);
  });
  root.addEventListener('mouseout', function (e) {
    var t = e.target.closest ? e.target.closest('[data-profile]') : null; if (!t) return;
    clearTimeout(profShowT); if (!profPinned) profHideT = setTimeout(function () { hideProf(false); }, 220);
  });
  root.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-profile]') : null; if (!t || !root.contains(t)) return;
    e.preventDefault(); e.stopPropagation();
    var nm = t.getAttribute('data-profile');
    hideProf(true);
    if (window.P2P_OPEN_MEMBER && window.P2P_OPEN_MEMBER(nm)) return;   // the full, rich member card
    showProf(nm, t, true);                                             // fallback if the members module hasn't loaded
  });
  document.addEventListener('click', function (e) { if (profEl && profPinned && !profEl.contains(e.target) && !(e.target.closest && e.target.closest('[data-profile]'))) hideProf(true); });
  window.addEventListener('scroll', function () { if (profEl && !profPinned) hideProf(true); }, true);
  window.P2P_OPEN_POST = function (id) { return openPostModal(id); };
  window.P2P_COMMUNITY_RERENDER = function () { try { render(); } catch (e) {} };
  window.P2P_COMMUNITY_SEARCH = function (q) { filter.q = String(q || ''); filter.category = 'all'; filter.offset = 0; if (searchEl) searchEl.value = filter.q; renderTabs(); load(false); if (feed && feed.scrollIntoView) feed.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  document.addEventListener('click', closeMenus);
  renderTabs(); load(false); loadWins(); loadMembersData();
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

/* ---- Personal calendar: events (window.P2P_EVENTS) + your own plans + "showed up" stars.
       One instance per [data-cal]; window.P2P_CAL_REFRESH re-renders them all. ---- */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var MO = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var events = (window.P2P_EVENTS || []).filter(function (e) { return e.iso; });
  var byDay = {}; events.forEach(function (e) { (byDay[e.iso] = byDay[e.iso] || []).push(e); });
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function pad(n){ return (n<10?'0':'')+n; }
  function getVisits(){ try { return JSON.parse(localStorage.getItem('p2p_visit_days') || '{}') || {}; } catch(e){ return {}; } }
  function getMine(){ try { return JSON.parse(localStorage.getItem('p2p_my_events') || '[]') || []; } catch(e){ return []; } }
  function setMine(a){ try { localStorage.setItem('p2p_my_events', JSON.stringify(a)); } catch(e){} }
  function mineByDay(){ var m = {}; getMine().forEach(function(e){ if(e.iso) (m[e.iso]=m[e.iso]||[]).push(e); }); return m; }
  function prettyDate(iso){ var p = iso.split('-'); var dt = new Date(+p[0], +p[1]-1, +p[2]); return dt.toLocaleDateString(undefined,{ weekday:'long', month:'long', day:'numeric', year:'numeric' }); }

  var renders = [];
  window.P2P_CAL_REFRESH = function(){ renders.forEach(function(fn){ try{ fn(); }catch(e){} }); };

  function openDay(iso) {
    var g = byDay[iso] || [], mine = mineByDay()[iso] || [], visited = !!getVisits()[iso];
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    var gHtml = g.map(function(e){ return '<div class="osx-day-ev"><div class="osx-day-evt"><b>'+esc(e.title||'Live session')+'</b>'+(e.time?' · '+esc(e.time):'')+(e.live?' <em class="osx-event-live">● LIVE</em>':'')+'</div>'+(e.desc?'<div class="osx-day-desc">'+esc(e.desc)+'</div>':'')+(e.join?'<a class="osx-day-join" href="'+esc(e.join)+'" target="_blank" rel="noopener">Join the call →</a>':'')+'</div>'; }).join('');
    var mHtml = mine.map(function(e){ return '<div class="osx-day-ev mine"><div class="osx-day-evt"><b>'+esc(e.title)+'</b>'+(e.time?' · '+esc(e.time):'')+'<button class="osx-day-del" data-del="'+esc(e.id)+'" title="Remove" aria-label="Remove">✕</button></div>'+(e.note?'<div class="osx-day-desc">'+esc(e.note)+'</div>':'')+'</div>'; }).join('');
    pop.innerHTML = '<div class="osx-cal-pop-in osx-day-pop"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button>' +
      '<div class="osx-day-h">'+esc(prettyDate(iso))+(visited?' <span class="osx-day-visit">★ you showed up</span>':'')+'</div>' +
      (g.length ? '<div class="osx-day-sec">📅 Events</div>'+gHtml : '') +
      '<div class="osx-day-sec">✎ Your plans</div>' + (mHtml || '<div class="osx-day-empty">Nothing planned yet — add one below.</div>') +
      '<div class="osx-day-add"><input class="osx-day-title" placeholder="e.g. Launch day, Go live 7pm, Batch content" maxlength="90"><input class="osx-day-time" placeholder="Time (optional)" maxlength="24"><button class="osx-day-save" type="button">Add plan</button></div>' +
      '</div>';
    document.body.appendChild(pop);
    function close() { pop.remove(); }
    function reopen() { close(); openDay(iso); }
    pop.addEventListener('click', function (ev) { if (ev.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    pop.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { var id = b.getAttribute('data-del'); setMine(getMine().filter(function (e) { return String(e.id) !== id; })); window.P2P_CAL_REFRESH(); reopen(); }); });
    var save = pop.querySelector('.osx-day-save'), ti = pop.querySelector('.osx-day-title'), tm = pop.querySelector('.osx-day-time');
    function add() { var title = (ti.value||'').trim(); if(!title) return; var arr = getMine(); arr.push({ id: String(Date.now())+Math.random().toString(36).slice(2,6), iso: iso, title: title.slice(0,90), time: (tm.value||'').trim().slice(0,24) }); setMine(arr); window.P2P_CAL_REFRESH(); reopen(); }
    save.addEventListener('click', add);
    ti.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); add(); } });
  }

  function initCal(cal) {
    if (cal.dataset.calInit) return; cal.dataset.calInit = '1';
    var grid = cal.querySelector('[data-cal-grid]'), title = cal.querySelector('[data-cal-title]');
    if (!grid || !title) return;
    var now = new Date(), curY = now.getFullYear(), curM = now.getMonth();
    function render() {
      title.textContent = MO[curM] + ' ' + curY;
      var visits = getVisits(), mine = mineByDay();
      var first = new Date(curY, curM, 1).getDay(), days = new Date(curY, curM + 1, 0).getDate();
      var t = new Date(), tISO = t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate()), html = '';
      for (var i = 0; i < first; i++) html += '<span class="osx-cal-d empty"></span>';
      for (var d = 1; d <= days; d++) {
        var iso = curY + '-' + pad(curM+1) + '-' + pad(d);
        var hasG = byDay[iso], hasM = mine[iso], vis = visits[iso];
        var marks = (vis?'<i class="osx-cal-star">★</i>':'') + (hasG?'<i class="osx-cal-dot g"></i>':'') + (hasM?'<i class="osx-cal-dot m"></i>':'');
        html += '<button type="button" class="osx-cal-d' + (hasG||hasM?' ev':'') + (iso===tISO?' today':'') + '" data-cal-day="'+iso+'">' + d + (marks?'<span class="osx-cal-marks">'+marks+'</span>':'') + '</button>';
      }
      grid.innerHTML = html;
      grid.querySelectorAll('[data-cal-day]').forEach(function (b) { b.addEventListener('click', function () { openDay(b.getAttribute('data-cal-day')); }); });
    }
    var pv = cal.querySelector('[data-cal-prev]'), nx = cal.querySelector('[data-cal-next]');
    if (pv) pv.addEventListener('click', function () { curM--; if (curM < 0) { curM = 11; curY--; } render(); });
    if (nx) nx.addEventListener('click', function () { curM++; if (curM > 11) { curM = 0; curY++; } render(); });
    renders.push(render);
    render();
  }
  root.querySelectorAll('[data-cal]').forEach(initCal);
})();

/* ---- Bell notifications + profile bubble (OS sidebar AND the shared rail on other pages) ---- */
(function () {
  var bar = document.querySelector('[data-userbar]'); if (!bar) return;
  var bell = bar.querySelector('[data-bell]'), menu = bar.querySelector('[data-bell-menu]'),
      countEl = bar.querySelector('[data-bell-count]'), roleEl = bar.querySelector('[data-userrole]');
  var NOTIFS = '/apps/p2p/notifs', notifs = [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ago(ts) { var s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return 'just now'; var m = Math.floor(s / 60); if (m < 60) return m + 'm'; var h = Math.floor(m / 60); if (h < 24) return h + 'h'; return Math.floor(h / 24) + 'd'; }
  /* self-set reminders (planner writes p2p_reminders; fired ids tracked so they show once) */
  function firedSet() { try { return JSON.parse(localStorage.getItem('p2p_rem_fired') || '[]') || []; } catch (e) { return []; } }
  function markFired(nids) { try { var s = firedSet(); nids.forEach(function (n) { if (s.indexOf(n) < 0) s.push(n); }); localStorage.setItem('p2p_rem_fired', JSON.stringify(s.slice(-200))); } catch (e) {} }
  function dueReminders() {
    var out = [], now = Date.now(), fired = firedSet();
    try { (JSON.parse(localStorage.getItem('p2p_reminders') || '[]') || []).forEach(function (r) { if (r.fireAt <= now && r.startAt >= now - 7200000 && fired.indexOf(r.nid) < 0) out.push(r); }); } catch (e) {}
    out.sort(function (a, b) { return a.startAt - b.startAt; });
    return out;
  }
  function line(n) {
    if (n.reminder) {
      var ic = n.kind === 'live' ? '📡' : n.kind === 'goal' ? '🎯' : '📦', dt = n.startAt - Date.now();
      var when = dt <= 0 ? 'now' : dt < 3600000 ? 'in ' + Math.round(dt / 60000) + ' min' : dt < 86400000 ? 'in ' + Math.round(dt / 3600000) + ' hr' : 'in ' + Math.round(dt / 86400000) + ' days';
      return '<div class="osx-bell-item unread osx-bell-rem"><div class="osx-bell-line">' + ic + ' <b>' + esc(n.title) + '</b></div><div class="osx-bell-snip">' + esc(n.label) + ' · starts ' + when + '</div></div>';
    }
    var verb = n.type === 'follow' ? 'shared a new post' : n.type === 'comment' ? 'commented on your post' : (n.rtype === 'party' ? 'celebrated your post 🎉' : n.rtype === 'thumb' ? 'gave your post a 👍' : 'loved your post ❤');
    return '<div class="osx-bell-item' + (n.read ? '' : ' unread') + (n.postId ? ' osx-bell-click' : '') + '"' + (n.postId ? ' data-openpost="' + esc(n.postId) + '"' : '') + '><div class="osx-bell-line"><b>' + esc(n.name || 'Someone') + '</b> ' + verb + '</div>' +
      (n.snippet ? '<div class="osx-bell-snip">“' + esc(n.snippet) + '”</div>' : '') +
      '<span class="osx-bell-time">' + ago(n.ts) + ' ago</span></div>';
  }
  function serverNotifs(localNids) {
    var fired = firedSet();
    return notifs.filter(function (n) { if (n.reminder) { if (localNids[n.nid]) return false; if (fired.indexOf(n.nid) > -1) return false; } return true; });
  }
  function renderMenu() {
    if (!menu) return;
    var due = dueReminders(), localNids = {}; due.forEach(function (r) { localNids[r.nid] = 1; });
    var rem = due.map(function (r) { return { reminder: true, kind: r.kind, title: r.title, label: r.label, startAt: r.startAt }; });
    var all = rem.concat(serverNotifs(localNids));
    menu.innerHTML = '<div class="osx-bell-h">Notifications</div>' + (all.length ? all.map(line).join('') : '<div class="osx-bell-empty">Nothing yet — reminders you set and reactions to your posts show up here. 🔔</div>');
    menu.querySelectorAll('[data-openpost]').forEach(function (it) {
      it.addEventListener('click', function () {
        var pid = it.getAttribute('data-openpost'); menu.hidden = true;
        if (window.P2P_OPEN_POST && window.P2P_OPEN_POST(pid)) return;
        window.location.href = '/pages/p2p-os?post=' + encodeURIComponent(pid);
      });
    });
  }
  function setCount(u) { if (!countEl) return; if (u > 0) { countEl.textContent = u > 9 ? '9+' : u; countEl.hidden = false; } else countEl.hidden = true; }
  function refreshCount() { var due = dueReminders(), localNids = {}; due.forEach(function (r) { localNids[r.nid] = 1; }); setCount(serverNotifs(localNids).filter(function (n) { return !n.read; }).length + due.length); }
  function fetchNotifs() {
    fetch(NOTIFS, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && !j.guest) notifs = j.notifs || [];
      refreshCount(); if (menu && !menu.hidden) renderMenu();
    }).catch(function () { refreshCount(); });
  }
  if (roleEl && window.P2P && window.P2P.tier) { try { var t = window.P2P.tier(); if (t && t.name) roleEl.textContent = t.name; } catch (e) {} }
  if (bell) bell.addEventListener('click', function (e) {
    e.stopPropagation(); if (!menu) return;
    var opening = menu.hidden; menu.hidden = !menu.hidden;
    if (opening) {
      renderMenu();
      var due = dueReminders(); markFired(due.map(function (r) { return r.nid; }));
      notifs.forEach(function (n) { n.read = true; }); setCount(0);
      fetch(NOTIFS, { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: '{}' }).catch(function () {});
    }
  });
  document.addEventListener('click', function (e) { if (menu && !menu.hidden && !menu.contains(e.target) && e.target !== bell && !bell.contains(e.target)) menu.hidden = true; });
  fetchNotifs();
  setInterval(fetchNotifs, 60000);
})();

/* ---- mini calendar / map cards → expand into a modal (moves the real widget in, back on close) ---- */
(function () {
  var root = document.getElementById('p2pos'); if (!root) return;
  var MO = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var mc = root.querySelector('[data-mini-cal-month]');
  if (mc) { var d = new Date(); mc.textContent = MO[d.getMonth()] + ' ' + d.getFullYear(); }
  function openHolderModal(holderSel, extraClass, onShow) {
    var holder = root.querySelector(holderSel); if (!holder || !holder.firstChild) return;
    var pop = document.createElement('div'); pop.className = 'osx-cal-pop';
    pop.innerHTML = '<div class="osx-cal-pop-in osx-expand ' + (extraClass || '') + '"><button class="osx-cal-pop-x" type="button" aria-label="Close">✕</button><div class="osx-expand-body"></div></div>';
    root.appendChild(pop);
    var body = pop.querySelector('.osx-expand-body');
    while (holder.firstChild) body.appendChild(holder.firstChild);
    function close() { while (body.firstChild) holder.appendChild(body.firstChild); pop.remove(); }
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    pop.querySelector('.osx-cal-pop-x').addEventListener('click', close);
    if (onShow) onShow();
  }
  var calBtn = root.querySelector('[data-cal-open]');
  if (calBtn) calBtn.addEventListener('click', function () { openHolderModal('[data-cal-holder]', 'osx-expand-cal'); });
  var mapBtn = root.querySelector('[data-map-open]');
  if (mapBtn) mapBtn.addEventListener('click', function () { openHolderModal('[data-map-holder]', 'osx-expand-map', function () { if (window.P2P_MAP_REFRESH) window.P2P_MAP_REFRESH(); }); });
})();
