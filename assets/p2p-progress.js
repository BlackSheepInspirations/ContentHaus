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
  var K = { streak:'p2p_streak', signs:'p2p_signs', earned:'p2p_badges_earned',
    journal:'p2p_journal', courses:'p2p_courses_done',
    rates:'p2p_rates', ptsStreak:'p2p_pts_streak', ptsJournal:'p2p_pts_journal', journalDay:'p2p_journal_day' };

  function get(k, def){ try{ var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }catch(e){ return def; } }
  function set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  /* POINT RATES — the journey section passes its editable values via
     window.P2P_POINTS; we cache them so the player & badges pages (which don't
     carry those settings) award the same amounts. Falls back to these defaults. */
  var DEFAULT_RATES = { course:100, dna:75, side:40, cert:25, journal:5, streak:5, level:250 };
  var R = (function(){
    var cfg = window.P2P_POINTS;
    if(cfg && typeof cfg === 'object'){
      var m = {}; for(var k in DEFAULT_RATES){ m[k] = (typeof cfg[k] === 'number' && cfg[k] >= 0) ? cfg[k] : DEFAULT_RATES[k]; }
      set(K.rates, m); return m;
    }
    return get(K.rates, null) || DEFAULT_RATES;
  })();
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); }
  function dayNum(s){ var p = String(s).split('-'); return Math.floor(Date.UTC(+p[0], +p[1]-1, +p[2]) / 86400000); }

  function earnBadge(name){ if(!name) return false; var e = get(K.earned, []); if(e.indexOf(name) === -1){ e.push(name); set(K.earned, e); return true; } return false; }
  function earnedSet(){ return get(K.earned, []); }

  function awardStreakBadges(count){
    Object.keys(STREAK_BADGES).forEach(function(n){ if(count >= +n) earnBadge(STREAK_BADGES[n]); });
  }

  function tick(){
    var s = get(K.streak, null), t = today(), tn = dayNum(t), gained = false;
    if(!s || typeof s.count !== 'number'){ s = { last:t, count:1, longest:1 }; gained = true; }
    else {
      var diff = tn - dayNum(s.last);
      if(diff <= 0){ /* same day or clock moved back — leave the run as-is */ }
      else if(diff === 1){ s.count += 1; s.last = t; gained = true; }
      else { if(s.count >= COMEBACK_MIN) earnBadge('Comeback'); s.count = 1; s.last = t; gained = true; }
    }
    if(s.count > (s.longest || 0)) s.longest = s.count;
    set(K.streak, s);
    awardStreakBadges(s.count);
    if(gained) set(K.ptsStreak, (get(K.ptsStreak, 0) || 0) + R.streak); // once per new day
    return s;
  }

  /* +points for a journal entry, capped at 5 entries/day. Call on each save. */
  function addJournalPoint(){
    var t = today(), jd = get(K.journalDay, { d:'', c:0 });
    if(jd.d !== t) jd = { d:t, c:0 };
    if(jd.c < 5){ set(K.ptsJournal, (get(K.ptsJournal, 0) || 0) + R.journal); jd.c += 1; set(K.journalDay, jd); }
  }

  /* live points total — milestones recomputed from state, streak/journal from
     their running ledgers. Level climbs one step per R.level points. */
  function points(){
    var e = get(K.earned, []), courses = get(K.courses, []).length;
    var p = courses * R.course;
    if(e.indexOf('Founder Fingerprint') !== -1) p += R.dna;  // Brand DNA Blueprint done
    if(e.indexOf('Certified') !== -1) p += R.cert;           // certificate downloaded
    p += (get(K.ptsStreak, 0) || 0) + (get(K.ptsJournal, 0) || 0);
    return p;
  }
  function level(){ return 1 + Math.floor(points() / (R.level || 250)); }

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
    if(done.indexOf(slug) === -1){ done.push(slug); set(K.courses, done); }
    if(done.length >= 1) earnBadge('First Steps');
    if(done.length >= 3) earnBadge('Finding Your Current');
    return done.length;
  }

  var current = tick(); // any P2P page load counts as showing up today
  checkJournal();       // reconcile journal badges on every load

  return {
    streak: function(){ return get(K.streak, { last:today(), count:1, longest:1 }); },
    current: current,
    markSign: markSign,
    earnBadge: earnBadge,
    earnedSet: earnedSet,
    checkJournal: checkJournal,
    addJournalPoint: addJournalPoint,
    completeCourse: completeCourse,
    points: points,
    level: level,
    coursesDone: function(){ return get(K.courses, []).length; },
    badgesStat: function(){ return get('p2p_badges_stat', null); }, // {earned,total} published by the badges page
    rates: R,
    STREAK_BADGES: STREAK_BADGES
  };
})();
