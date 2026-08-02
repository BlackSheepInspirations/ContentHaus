/* Purpose 2 Profit — shared progress engine (streak, signs, auto-earned badges).
   ---------------------------------------------------------------------------
   HOW STREAKS WORK
   A "show up" is any visit to a P2P page (journey or badges). On each load we
   stamp today's calendar date and compare it to the last date we saw:
     • same day            → nothing changes (one visit per day counts once)
     • exactly yesterday   → streak + 1
     • a gap of 2+ days    → the streak broke; it resets to 1 today
   We keep the current run (count), the best run ever (longest), and the last
   active date. Missed days are detected on the NEXT visit — that's when the gap
   shows up. Streak-milestone badges (5,10,…150) are permanent high-water marks:
   once reached they stay earned even after a break. "Comeback" fires when a run
   of COMEBACK_MIN+ days breaks and the person returns.

   FOR NOW this lives in localStorage, so it is per-browser, based on the
   device clock. Before public launch this same shape (last/count/longest)
   moves to customer metafields via an App Proxy, stamped with a SERVER date —
   that makes it sync across devices and immune to clock changes. Nothing in the
   UI has to change; only the read/write swaps out. */
window.P2P = (function(){
  var COMEBACK_MIN = 7; // a run this long or longer, once broken, earns "Comeback"
  var STREAK_BADGES = { 5:'5-Day Streak', 10:'10-Day Streak', 15:'15-Day Streak',
    20:'20-Day Streak', 25:'25-Day Streak', 50:'50-Day Streak', 75:'75-Day Streak',
    100:'100-Day Streak', 125:'125-Day Streak', 150:'150-Day Streak' };
  // Cumulative days shown up (total access days) — never lost to a missed day.
  var DAYS_BADGES = { 1:'Day One', 5:'5 Days Strong', 10:'10 Days Strong', 25:'25 Days Strong',
    50:'50 Days Strong', 75:'75 Days Strong', 100:'100 Days Strong' };
  var K = { streak:'p2p_streak', signs:'p2p_signs', earned:'p2p_badges_earned',
    journal:'p2p_journal', courses:'p2p_courses_done',
    rates:'p2p_rates', ptsStreak:'p2p_pts_streak', ptsJournal:'p2p_pts_journal', journalDay:'p2p_journal_day',
    certsAwarded:'p2p_certs_awarded', checksDone:'p2p_checks_done',
    weekGoal:'p2p_weekgoal', ptsWeekBonus:'p2p_pts_weekbonus', daysActive:'p2p_days_active' };

  function get(k, def){ try{ var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }catch(e){ return def; } }
  function set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  /* POINT RATES — the journey section passes its editable values via
     window.P2P_POINTS; we cache them so the player & badges pages (which don't
     carry those settings) award the same amounts. Falls back to these defaults. */
  var DEFAULT_RATES = { course:100, dna:250, side:40, cert:25, journal:5, streak:5, badge:25, masterclass:250, weekbonus:50, weekgoal:1, level:250 };
  var POINT_INELIGIBLE = []; // badge names that must NOT award points (future points-milestone badges), to prevent reward loops
  var R = (function(){
    var cfg = window.P2P_POINTS;
    if(cfg && typeof cfg === 'object'){
      var m = {}; for(var k in DEFAULT_RATES){ m[k] = (typeof cfg[k] === 'number' && cfg[k] >= 0) ? cfg[k] : DEFAULT_RATES[k]; }
      set(K.rates, m); return m;
    }
    var cached = get(K.rates, null);
    // merge under defaults so a stale cache (missing newer keys) still resolves every rate
    var m = {}; for(var d in DEFAULT_RATES) m[d] = DEFAULT_RATES[d];
    if(cached && typeof cached === 'object'){ for(var c in cached){ if(typeof cached[c] === 'number' && cached[c] >= 0) m[c] = cached[c]; } }
    return m;
  })();
  var WEEK_GOAL = (R.weekgoal > 0) ? R.weekgoal : 1; // courses/week for the soft goal (cached with rates)
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
  function dayNum(s){ var p = String(s).split('-'); return Math.floor(Date.UTC(+p[0], +p[1]-1, +p[2]) / 86400000); }

  function earnBadge(name){ if(!name) return false; var e = get(K.earned, []); if(e.indexOf(name) === -1){ e.push(name); set(K.earned, e); return true; } return false; }
  function earnedSet(){ return get(K.earned, []); }

  function awardStreakBadges(count){
    Object.keys(STREAK_BADGES).forEach(function(n){ if(count >= +n) earnBadge(STREAK_BADGES[n]); });
  }
  function awardDaysBadges(days){
    Object.keys(DAYS_BADGES).forEach(function(n){ if(days >= +n) earnBadge(DAYS_BADGES[n]); });
  }

  /* One "grace day" forgives a single missed day so a long run doesn't die from one
     slip. It regenerates a clean week (7 days) after it was last spent. New/reset
     streaks start with grace available. */
  function tick(){
    var s = get(K.streak, null), t = today(), tn = dayNum(t), gained = false, graced = false;
    if(!s || typeof s.count !== 'number'){ s = { last:t, count:1, longest:1, grace:true, graceAt:0 }; gained = true; }
    else {
      if(typeof s.grace !== 'boolean') s.grace = true; // migrate older records
      var diff = tn - dayNum(s.last);
      if(diff <= 0){ /* same day or clock moved back — leave the run as-is */ }
      else if(diff === 1){
        s.count += 1; s.last = t; gained = true;
        if(!s.grace && (tn - (s.graceAt || 0)) >= 7) s.grace = true; // earned it back after a clean week
      }
      else if(diff === 2 && s.grace){ // missed exactly one day — forgive it, once
        s.count += 1; s.last = t; s.grace = false; s.graceAt = tn; gained = true; graced = true;
      }
      else { if(s.count >= COMEBACK_MIN) earnBadge('Comeback'); s.count = 1; s.last = t; s.grace = true; s.graceAt = 0; gained = true; }
    }
    if(s.count > (s.longest || 0)) s.longest = s.count;
    set(K.streak, s);
    if(gained){
      set(K.ptsStreak, (get(K.ptsStreak, 0) || 0) + R.streak); // once per new day
      var da = get(K.daysActive, null);
      if(da == null) da = Math.max(0, (s.longest || 0) - 1); // seed existing members from their record
      set(K.daysActive, da + 1);                              // one more distinct active day
    }
    // Two tracks: consecutive "streak" badges (the on-a-roll flame) + cumulative
    // "days shown up" badges (total access days, never lost — busy creators still earn them).
    awardStreakBadges(s.count);
    awardDaysBadges(get(K.daysActive, 0) || 0);
    // log every day the member shows up — powers the personal calendar's "showed up" stars
    var vd = get('p2p_visit_days', {}); if (!vd[t]) { vd[t] = 1; set('p2p_visit_days', vd); }
    s.graced = graced; // transient flag for this load (not persisted meaningfully)
    return s;
  }

  /* +points for the FIRST journal entry each day only (more entries are welcome —
     just not point-farmable). Call on each save. */
  function addJournalPoint(){
    var t = today();
    if(get(K.journalDay, '') !== t){ set(K.ptsJournal, (get(K.ptsJournal, 0) || 0) + R.journal); set(K.journalDay, t); }
  }

  /* live points total — milestones recomputed from state, streak/journal from
     their running ledgers. Level climbs one step per R.level points. */
  function eligibleBadgeCount(){ return get(K.earned, []).filter(function(n){ return POINT_INELIGIBLE.indexOf(n) === -1; }).length; }
  function points(){
    var e = get(K.earned, []);
    var p = get(K.courses, []).length * R.course;                  // finished courses
    if(e.indexOf('Founder Fingerprint') !== -1) p += R.dna;        // Brand DNA Blueprint (one-time)
    p += get(K.certsAwarded, []).length * R.cert;                  // certificates — once per course
    p += get(K.checksDone, []).length * R.side;                    // side quests (checks)
    p += eligibleBadgeCount() * R.badge;                           // eligible badges (+25 each)
    p += (get(K.ptsStreak, 0) || 0) + (get(K.ptsJournal, 0) || 0); // streak + journal ledgers
    p += (get(K.ptsWeekBonus, 0) || 0);                            // weekly-goal bonuses
    p += (get('p2p_engage_points', 0) || 0);                       // community engagement (server-awarded)
    return p;
  }
  function pointsBreakdown(){
    var e = get(K.earned, []);
    return {
      courses: get(K.courses, []).length * R.course,
      dna:     (e.indexOf('Founder Fingerprint') !== -1) ? R.dna : 0,
      certs:   get(K.certsAwarded, []).length * R.cert,
      side:    get(K.checksDone, []).length * R.side,
      badges:  eligibleBadgeCount() * R.badge,
      streak:  get(K.ptsStreak, 0) || 0,
      journal: get(K.ptsJournal, 0) || 0,
      weekly:  get(K.ptsWeekBonus, 0) || 0,
      engage:  get('p2p_engage_points', 0) || 0
    };
  }

  /* Merits: one per R.level (250) points. Tiers: named ranks, one every 2 Merits (500 pts). */
  var TIERS = ['Dreamer','Seeker','Starter','Apprentice','Builder','Maker','Crafter','Creator','Artisan','Designer',
    'Explorer','Navigator','Pathfinder','Pioneer','Trailblazer','Innovator','Architect','Visionary','Luminary','Unbound'];
  function roman(n){ var m = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']; return m[n] || String(n); }
  function merits(){ return Math.floor(points() / (R.level || 250)); }
  function tier(){
    var p = points(), step = 2 * (R.level || 250), idx = Math.floor(p / step) + 1, start = (idx - 1) * step, name, nextName;
    if(idx <= TIERS.length){ name = TIERS[idx - 1]; nextName = (idx < TIERS.length) ? TIERS[idx] : 'Unbound ' + roman(2); }
    else { var ub = idx - (TIERS.length - 1); name = 'Unbound ' + roman(ub); nextName = 'Unbound ' + roman(ub + 1); }
    return { index: idx, name: name, start: start, next: start + step, nextName: nextName, points: p, merits: merits(), tiers: TIERS.slice() };
  }
  function level(){ return merits(); } // legacy alias

  /* side-quest completion (checks) — +R.side once per distinct check id */
  function completeCheck(id){ id = String(id || ''); var d = get(K.checksDone, []); if(id && d.indexOf(id) === -1){ d.push(id); set(K.checksDone, d); } reconcileCheckBadges(); return d.length; }
  /* Status-Check badges — Mindset/Purpose/Heart each have one check per realm (×5).
     Check ids are category-encoded (check:<cat>:<blockid>) so we count distinct
     completions per category: 1st → "I", 2nd → "II", all → the gold "all" badge.
     CHECK_TOTAL = realms with a check of each category (5). Legacy constant ids
     (check:Mindset Check) still match by keyword and count as one. */
  var CHECK_TOTAL = 5;
  function reconcileCheckBadges(){
    var done = get(K.checksDone, []);
    function n(kw){ var c = 0; done.forEach(function(id){ if(String(id).toLowerCase().indexOf(kw) !== -1) c++; }); return c; }
    var m = n('mindset'), p = n('purpose'), h = n('heart');
    if(m >= 1) earnBadge('Mindset I'); if(m >= 2) earnBadge('Mindset II'); if(m >= CHECK_TOTAL) earnBadge('Clear Mind');
    if(p >= 1) earnBadge('Purpose I'); if(p >= 2) earnBadge('Purpose II'); if(p >= CHECK_TOTAL) earnBadge('True Purpose');
    if(h >= 1) earnBadge('Heart I');   if(h >= 2) earnBadge('Heart II');   if(h >= CHECK_TOTAL) earnBadge('Open Heart');
  }
  /* certificate award — +R.cert once per course handle */
  function awardCert(handle){ handle = String(handle || ''); var a = get(K.certsAwarded, []); if(handle && a.indexOf(handle) === -1){ a.push(handle); set(K.certsAwarded, a); } return a.length; }

  function markSign(key){
    key = String(key || '').toLowerCase();
    if(['raft','grows','rooted'].indexOf(key) === -1) return;
    var seen = get(K.signs, []);
    if(seen.indexOf(key) === -1){ seen.push(key); set(K.signs, seen); }
    if(['raft','grows','rooted'].every(function(k){ return seen.indexOf(k) !== -1; })) earnBadge('Trail Explorer');
  }

  /* journal badges — driven by the entry count in localStorage */
  function checkJournal(){
    var n = get(K.journal, []).length;
    if(n >= 1)  earnBadge('First Reflection');
    if(n >= 10) earnBadge('Journal Keeper');
    if(n >= 15) earnBadge('Journal Devotee');
    return n;
  }

  /* course-completion badges — count of distinct finished courses. ("First Win"
     and the framework/realm badges stay manual until their required-course sets
     are mapped; "Reached Freedom" is the capstone for clearing all five realms,
     awarded on the badges page when every realm badge is earned.) */
  function completeCourse(slug){
    slug = String(slug || ''); if(!slug) return 0;
    var done = get(K.courses, []);
    var isNew = done.indexOf(slug) === -1;
    if(isNew){ done.push(slug); set(K.courses, done); if(bumpWeek()) {} }
    if(done.length >= 1) earnBadge('First Steps');
    if(done.length >= 3) earnBadge('Finding Your Current');
    return done.length;
  }

  /* ---- weekly goal: finish WEEK_GOAL course(s) in a rolling 7-day window for a bonus ---- */
  function weekKey(){ return Math.floor(dayNum(today()) / 7); } // epoch-aligned 7-day bucket
  function bumpWeek(){
    var w = get(K.weekGoal, null), k = weekKey();
    if(!w || w.k !== k) w = { k:k, done:0, paid:false };
    w.done += 1;
    var justHit = false;
    if(w.done >= WEEK_GOAL && !w.paid){ w.paid = true; justHit = true; set(K.ptsWeekBonus, (get(K.ptsWeekBonus, 0) || 0) + R.weekbonus); }
    set(K.weekGoal, w);
    return justHit;
  }
  function weekGoal(){
    var w = get(K.weekGoal, null), k = weekKey();
    if(!w || w.k !== k) w = { k:k, done:0, paid:false };
    return { done:w.done, goal:WEEK_GOAL, paid:!!w.paid, bonus:R.weekbonus };
  }

  /* per-course lookup — the join key the lock engine (journey map) checks
     against a Main course's handle or an Offshoot's unlock_after_handle. */
  function isCourseDone(slug){
    slug = String(slug || ''); if(!slug) return false;
    return get(K.courses, []).indexOf(slug) !== -1;
  }

  /* ---- auto-award realm / framework / capstone badges from the canonical map ----
     Runs wherever window.P2P_MAP is present (the journey page). A realm is "cleared"
     when its Main (non-offshoot) courses are all done; Framework Masters map to the
     anchor course handle; "Reached Freedom" once all five realm badges are earned;
     "Every Path Walked" once every course (offshoots included) is done. Idempotent. */
  var REALM_BADGES = { 1:'Open Water Cleared', 2:'Element Forest Cleared', 3:'Desert Blooms Cleared', 4:'Golden Harvest Cleared', 5:'Evergreen Cleared' };
  var FRAMEWORK_BADGES = { raft:'RAFT Master', grows:'GROWS Master', rooted:'ROOTED Master' };
  function reconcileMapBadges(){
    var map = window.P2P_MAP; if(!map || !map.length) return;
    var realmsCleared = 0, allCoursesDone = true;
    map.forEach(function(realm){
      var main = (realm.courses || []).filter(function(c){ return !c.o; });
      var cleared = main.length > 0 && main.every(function(c){ return isCourseDone(c.h); });
      if(cleared && REALM_BADGES[realm.n]) earnBadge(REALM_BADGES[realm.n]);
      if(cleared) realmsCleared++;
      (realm.courses || []).forEach(function(c){ if(!isCourseDone(c.h)) allCoursesDone = false; });
    });
    Object.keys(FRAMEWORK_BADGES).forEach(function(h){ if(isCourseDone(h)) earnBadge(FRAMEWORK_BADGES[h]); });
    if(realmsCleared >= 5) earnBadge('Reached Freedom');   // capstone
    if(allCoursesDone) earnBadge('Every Path Walked');     // completionist (incl. offshoots)
  }

  var current = tick();     // any P2P page load counts as showing up today
  checkJournal();           // reconcile journal badges on every load
  reconcileCheckBadges();   // reconcile Mindset/Purpose/Heart check badges from checksDone
  reconcileMapBadges();     // reconcile realm/framework/capstone badges (where the map is loaded)

  return {
    streak: function(){ return get(K.streak, { last:today(), count:1, longest:1 }); },
    current: current,
    markSign: markSign,
    earnBadge: earnBadge,
    earnedSet: earnedSet,
    checkJournal: checkJournal,
    reconcileMapBadges: reconcileMapBadges,
    reconcileCheckBadges: reconcileCheckBadges,
    addJournalPoint: addJournalPoint,
    completeCourse: completeCourse,
    isCourseDone: isCourseDone,
    completeCheck: completeCheck,
    awardCert: awardCert,
    weekGoal: weekGoal,
    points: points,
    pointsBreakdown: pointsBreakdown,
    level: level,
    merits: merits,
    tier: tier,
    coursesDone: function(){ return get(K.courses, []).length; },
    daysActive: function(){ return get(K.daysActive, 0) || 0; },
    badgesStat: function(){ return get('p2p_badges_stat', null); }, // {earned,total} published by the badges page
    rates: R,
    STREAK_BADGES: STREAK_BADGES,
    DAYS_BADGES: DAYS_BADGES
  };
})();

/* ---- cross-device sync: App Proxy <-> customer metafield (logged-in members only) ----
   All P2P state lives in localStorage. For a logged-in customer we mirror it to a
   `custom.p2p_progress` metafield via /apps/p2p/progress (a signed App Proxy call to our
   Cloudflare Worker). Guests are untouched — they keep using localStorage only. */
(function(){
  var PROXY = '/apps/p2p/progress', TS_KEY = 'p2p_sync_ts', OWNER_KEY = 'p2p_owner';
  function collect(){ var o = {}; for(var i=0;i<localStorage.length;i++){ var k = localStorage.key(i); if(k && k.indexOf('p2p_') === 0 && k !== TS_KEY && k !== OWNER_KEY) o[k] = localStorage.getItem(k); } return o; }
  function snap(){ return JSON.stringify(collect()); }
  var lastPushed = snap();

  function applyBlob(blob){
    var changed = false;
    Object.keys(blob).forEach(function(k){
      if(k === '_ts' || k === OWNER_KEY) return;
      if(typeof blob[k] === 'string' && localStorage.getItem(k) !== blob[k]){ try{ localStorage.setItem(k, blob[k]); changed = true; }catch(e){} }
    });
    return changed;
  }
  // Wipe this browser's P2P state — used when a DIFFERENT customer logs in, so nobody
  // inherits the previous account's badges/courses/brand kits/journal, etc.
  function clearLocal(){ var keys = []; for(var i=0;i<localStorage.length;i++){ var k = localStorage.key(i); if(k && k.indexOf('p2p_') === 0) keys.push(k); } keys.forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} }); }
  function push(){
    if(snap() === lastPushed) return;
    var blob = collect(); blob._ts = Date.now();
    try{ localStorage.setItem(TS_KEY, String(blob._ts)); }catch(e){}
    lastPushed = snap();
    fetch(PROXY, { method:'POST', headers:{ 'content-type':'application/json' }, credentials:'same-origin', body: JSON.stringify(blob), keepalive:true }).catch(function(){});
  }
  var t = null;
  function schedulePush(){ if(t) clearTimeout(t); t = setTimeout(push, 1500); }
  // reload once per account per tab-session so the page re-renders with the right data (no loops)
  function reloadForAccount(cid){ try{ if(sessionStorage.getItem('p2p_acct_loaded') === cid) return; sessionStorage.setItem('p2p_acct_loaded', cid); }catch(e){} location.reload(); }

  // pull the server's copy on load
  fetch(PROXY, { method:'GET', credentials:'same-origin' })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      if(!j || j.guest) return;                                   // not logged in -> localStorage only
      var cid = String(j.customerId || ''); if(!cid) return;
      var owner = localStorage.getItem(OWNER_KEY) || '';
      if(owner !== cid){
        // This browser's data isn't confirmed to belong to the logged-in customer
        // (different account, or a fresh load). Load THIS customer's own server copy —
        // never inherit whatever happens to be in localStorage.
        clearLocal();
        if(j.progress) applyBlob(j.progress);
        try{ localStorage.setItem(OWNER_KEY, cid); localStorage.setItem(TS_KEY, String((j.progress && j.progress._ts) || Date.now())); }catch(e){}
        lastPushed = snap();
        reloadForAccount(cid);
        return;
      }
      // Same account, confirmed on this browser -> normal cross-device newest-wins sync.
      var serverTs = (j.progress && j.progress._ts) || 0;
      var localTs = parseInt(localStorage.getItem(TS_KEY) || '0', 10) || 0;
      if(j.progress && serverTs > localTs){
        var changed = applyBlob(j.progress);
        try{ localStorage.setItem(TS_KEY, String(serverTs)); }catch(e){}
        lastPushed = snap();
        if(changed) reloadForAccount(cid);
      } else {
        push();                                                   // server empty/older -> upload our progress
      }
    })
    .catch(function(){});

  // keep it synced during the visit, and flush when leaving/hiding the tab
  setInterval(function(){ if(snap() !== lastPushed) schedulePush(); }, 4000);
  document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'hidden') push(); });
  window.addEventListener('pagehide', push);
  if(window.P2P) window.P2P.push = push;
})();
