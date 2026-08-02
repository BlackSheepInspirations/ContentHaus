/* Purpose 2 Profit — shared Progress detail pop-ups.
 * Points / Badges / Streak / Merit (+ Courses) detail modals, reading the shared
 * progress engine (window.P2P). Mirrors the Learning Journey's progress modal so
 * the OS home has the same clickable stats. Self-contained; the Journey keeps its
 * own inline copy untouched.
 *
 * Usage: add data-prog="points|badges|streak|merit|courses" to any clickable stat
 * inside a container, then: window.P2PProgressPopups.mount(container)
 */
(function () {
  "use strict";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  var MEDAL = '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.9 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>';
  function dNum(s) { var p = String(s).split("-"); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function mapTotals() {
    var total = 0, done = 0, P = window.P2P;
    if (window.P2P_MAP) window.P2P_MAP.forEach(function (r) { (r.courses || []).forEach(function (c) { total++; if (P && P.isCourseDone(c.h)) done++; }); });
    return { total: total, done: done };
  }
  function badgeCount() { if (!window.P2P) return 0; var b = window.P2P.badgesStat(); return b ? b.earned : window.P2P.earnedSet().length; }

  function viewCourses() {
    var P = window.P2P, html = "", anyCourses = false;
    (window.P2P_MAP || []).forEach(function (realm) {
      var cs = realm.courses || []; if (!cs.length) return;
      anyCourses = true;
      var doneN = 0;
      var rows = cs.map(function (c) {
        var d = P && P.isCourseDone(c.h); if (d) doneN++;
        return '<div class="pb-crow' + (d ? " is-done" : "") + '"><span class="pb-dot"></span><span>' + esc(c.t) + (c.o ? " · offshoot" : "") + "</span></div>";
      }).join("");
      html += '<div class="pb-realm"><div class="pb-rhead"><span class="pb-rname">' + esc(realm.name) + '</span><span class="pb-rcount">' + doneN + "/" + cs.length + '</span></div><div class="pb-clist">' + rows + "</div></div>";
    });
    if (!anyCourses) return { title: "Courses done", body: '<p class="pb-empty">Your course list is loading — check back in a moment.</p>' };
    var g = mapTotals();
    return { title: "Courses done", sub: g.done + " of " + g.total + " courses complete across every realm.", body: html };
  }

  function viewPoints() {
    var P = window.P2P;
    if (!P || !P.pointsBreakdown) return { title: "Points", body: '<p class="pb-empty">No points yet — finish a course to get started.</p>' };
    var b = P.pointsBreakdown();
    var rows = [
      ["Courses finished", b.courses], ["Brand DNA Blueprint", b.dna], ["Certificates", b.certs],
      ["Side quests (Checks)", b.side], ["Badges earned", b.badges], ["Weekly goals", b.weekly || 0],
      ["Daily streak", b.streak], ["Journal", b.journal]
    ];
    var max = rows.reduce(function (m, r) { return Math.max(m, r[1]); }, 1);
    var total = P.points();
    var chart = rows.map(function (r) {
      var zero = r[1] <= 0, w = Math.max(2, Math.round(r[1] / max * 100));
      return '<div class="pt-row' + (zero ? " is-zero" : "") + '"><span class="pt-label">' + r[0] + '</span><span class="pt-bar"><i style="width:' + w + '%"></i></span><b class="pt-val">' + (zero ? "—" : "+" + r[1]) + "</b></div>";
    }).join("");
    return { title: "Where your points came from", sub: "Every point is proof you showed up.", body: '<div class="pt-chart">' + chart + '</div><div class="pt-total"><span>Your total</span><b>' + total + "</b></div>" };
  }

  var BADGE_PAGE = (window.P2P_BADGES_URL || '/pages/p2p-learning-badges');
  function badgeLink() { return '<a class="pb-badgelink" href="' + BADGE_PAGE + '">See the full Badges &amp; Milestones page →</a>'; }
  function viewBadges() {
    var names = (window.P2P && window.P2P.earnedSet) ? window.P2P.earnedSet() : [];
    var n = badgeCount();
    var days = (window.P2P && window.P2P.daysActive) ? window.P2P.daysActive() : 0;
    var daysLine = days ? '<p class="pb-sub" style="margin-top:2px">🗓️ ' + days + ' day' + (days === 1 ? '' : 's') + ' shown up in the Haus.</p>' : '';
    if (!names.length) return { title: "Badges", sub: n + " earned", body: daysLine + '<p class="pb-empty">No badges yet — they unlock as you finish courses, keep a streak, and reflect. Your first is closer than you think.</p>' + badgeLink() };
    var grid = names.map(function (nm) { return '<div class="pb-badge"><span class="pb-bmedal">' + MEDAL + '</span><span class="pb-bname">' + esc(nm) + "</span></div>"; }).join("");
    return { title: "Badges earned", sub: n + " unlocked so far.", body: daysLine + '<div class="pb-badges">' + grid + "</div>" + badgeLink() };
  }

  var streakMO = 0;   // month offset for the streak calendar (0 = current month)
  function visitDays() { try { return JSON.parse(localStorage.getItem("p2p_visit_days") || "{}") || {}; } catch (e) { return {}; } }
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function viewStreak() {
    var s = (window.P2P && window.P2P.streak) ? window.P2P.streak() : { count: 0, last: "", longest: 0 };
    var count = s.count || 0, longest = s.longest || count;
    var base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + streakMO);
    var y = base.getFullYear(), m = base.getMonth();
    var now = new Date(), isThisMonth = (y === now.getFullYear() && m === now.getMonth()), todayDom = now.getDate();
    var firstDow = new Date(y, m, 1).getDay(), dim = new Date(y, m + 1, 0).getDate();
    var vd = visitDays();
    function iso(d) { return y + "-" + (m + 1 < 10 ? "0" : "") + (m + 1) + "-" + (d < 10 ? "0" : "") + d; }
    var dows = ["S", "M", "T", "W", "T", "F", "S"].map(function (d) { return '<span class="cell dow">' + d + "</span>"; }).join("");
    var cells = "";
    for (var i = 0; i < firstDow; i++) cells += '<span class="cell" style="background:none"></span>';
    for (var dom = 1; dom <= dim; dom++) {
      cells += '<span class="cell' + (vd[iso(dom)] ? " on" : "") + (isThisMonth && dom === todayDom ? " today" : "") + '">' + dom + "</span>";
    }
    var nav = '<div class="pb-calnav"><button type="button" class="pb-calb" data-streak-prev aria-label="Previous month">‹</button><b>' + MONTHS[m] + " " + y + '</b><button type="button" class="pb-calb" data-streak-next aria-label="Next month"' + (streakMO >= 0 ? " disabled" : "") + ">›</button></div>";
    var sub = longest > count ? ("Longest run: " + longest + " days · showed up on the lit days.") : "Keep it lit — every day you show up glows.";
    var totalDays = (window.P2P && window.P2P.daysActive) ? window.P2P.daysActive() : 0;
    var daysLine = totalDays ? '<p class="pb-sub" style="margin-top:4px">🗓️ <b>' + totalDays + ' day' + (totalDays === 1 ? '' : 's') + ' shown up</b> in total — cumulative, so a missed day never sets it back.</p>' : '';
    return { title: "Your streak", body: '<div class="pb-streaktop"><span class="pb-flame">🔥</span><span class="pb-streaknum">' + count + "<small>day" + (count === 1 ? "" : "s") + ' in a row</small></span></div>' + daysLine + nav + '<div class="pb-cal">' + dows + cells + '</div><p class="pb-sub" style="margin-top:14px">' + sub + "</p>" };
  }

  function viewMerit() {
    var P = window.P2P; if (!P || !P.tier) return { title: "Merit", body: '<p class="pb-empty">Keep going to earn your first Merit.</p>' };
    var t = P.tier(), pts = t.points, span = (t.next - t.start) || 1, into = Math.max(0, Math.min(span, pts - t.start));
    var pct = Math.round(into / span * 100), toNext = t.next - pts;
    var names = t.tiers || [];
    var ladder = names.map(function (nm, i) {
      var idx = i + 1, start = i * span, cls = idx === t.index ? "here" : (t.index > idx ? "done" : "locked");
      return '<div class="pb-rung ' + cls + '"><span class="pb-rnum">' + idx + '</span><span class="pb-rtname">' + esc(nm) + (idx === t.index && t.name !== nm ? " " + esc(t.name.replace(nm, "").trim()) : "") + '</span><span class="pb-rtpts">' + start + "+</span></div>";
    }).join("");
    var head = '<div class="pb-merittop"><div class="pb-tiernow">' + esc(t.name) + '</div><div class="pb-tiermeta">' + t.merits + " Merits · " + pts + ' points</div><div class="pb-nextbar"><i style="width:' + pct + '%"></i></div><div class="pb-nexttxt">' + toNext + " points to " + esc(t.nextName) + "</div></div>";
    return { title: "Merit &amp; Tiers", sub: "Earn a Merit every " + (window.P2P_POINTS && window.P2P_POINTS.level || 250) + " points; a new Tier every two Merits.", body: head + '<div class="pb-ladder">' + ladder + "</div>" };
  }

  var VIEWS = { courses: viewCourses, points: viewPoints, badges: viewBadges, streak: viewStreak, merit: viewMerit };

  function mount(root) {
    if (!root || root.__p2ppopMounted) return; root.__p2ppopMounted = true;
    var modal = document.createElement("div");
    modal.className = "p2ppop";
    modal.innerHTML = '<div class="p2ppop-card"><button class="p2ppop-x" type="button" data-close aria-label="Close">✕</button><div class="p2ppop-k">Your Progress</div><h3 class="p2ppop-title">Details</h3><div class="prog-body"></div></div>';
    root.appendChild(modal);
    var titleEl = modal.querySelector(".p2ppop-title"), bodyEl = modal.querySelector(".prog-body");
    function open(name, keepMonth) {
      var f = VIEWS[name]; if (!f) return;
      if (name === "streak" && !keepMonth) streakMO = 0;
      var v = f(); titleEl.innerHTML = v.title; bodyEl.innerHTML = (v.sub ? '<p class="pb-sub">' + v.sub + "</p>" : "") + v.body; modal.classList.add("show");
      var sp = bodyEl.querySelector("[data-streak-prev]"), sn = bodyEl.querySelector("[data-streak-next]");
      if (sp) sp.addEventListener("click", function () { streakMO--; open("streak", true); });
      if (sn) sn.addEventListener("click", function () { if (streakMO < 0) { streakMO++; open("streak", true); } });
    }
    function close() { modal.classList.remove("show"); }
    root.querySelectorAll("[data-prog]").forEach(function (t) { t.addEventListener("click", function () { open(t.getAttribute("data-prog")); }); });
    modal.querySelector("[data-close]").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("show")) close(); });
  }

  window.P2PProgressPopups = { mount: mount };
})();
