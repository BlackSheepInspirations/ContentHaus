/* THE LEADERSHIP IMPRINT — report renderer.
   Black Sheep Leadership Group.

   render(score, meta, opts) -> full report HTML string.
   score = TLI.engine.score(responses); meta = {firstName,lastName,date}.
   opts.tier = 'one' renders only the standing-alone summary (spec Tier One).
   Implements the Document Map + all conditional logic from the report template.
*/
(function (root) {
  'use strict';
  var LABEL = { TRACTOR: 'Tractor', BUS: 'Bus', JET: 'Jet', ROCKET: 'Rocket' };
  var STYLE_ORDER = ['TRACTOR', 'BUS', 'JET', 'ROCKET'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]); }); }
  function paras(arr) { return (arr || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }
  function page(cls, inner) { return '<section class="tli-page ' + (cls || '') + '">' + inner + '</section>'; }
  function h(kind, txt) { return '<h3 class="tli-h">' + esc(txt) + '</h3>'; }

  // Compose a plain "19% Bus and 13% Rocket" style list (no em dashes).
  function supportingSummary(supporting) {
    if (!supporting.length) return 'the other three styles some way behind';
    var parts = supporting.map(function (o) { return o.pct + '% ' + LABEL[o.style]; });
    if (parts.length === 1) return 'a thread of ' + parts[0];
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }

  function renderProfile(C, style, mine) {
    var p = C.PROFILES[style], V = root.TLI.content.COPY;
    function sect(title, s) {
      if (!s) return '';
      var lead = s.lead ? '<p class="tli-lead"><strong>' + esc(s.lead) + '</strong></p>' : '';
      return '<div class="tli-psect"><h4>' + esc(title) + '</h4>' + lead + paras(s.body) + '</div>';
    }
    var IMG = root.TLI_IMG || {};
    var hero = IMG[style] ? '<img class="tli-profile-img" src="' + IMG[style] + '" alt="">' : '';
    return '<article class="tli-profile' + (mine ? ' tli-mine' : '') + '">' +
      hero +
      '<header class="tli-profile-head"><span class="tli-profile-name">' + LABEL[style] + '</span>' +
      '<span class="tli-profile-pos">' + esc(p.position) + '</span>' +
      (mine ? '<span class="tli-yours">THIS IS YOURS</span>' : '') + '</header>' +
      sect('How you move', p.howYouMove) +
      sect('What people notice', p.whatPeopleNotice) +
      sect('Your gift', p.gift) +
      sect('Under pressure', p.underPressure) +
      sect('What you need from other people', p.needFromOthers) +
      sect('What drives you mad', p.drivesYouMad) +
      sect('The thing worth working on', p.workOn) +
      '</article>';
  }

  function render(score, meta, opts) {
    opts = opts || {};
    meta = meta || {};
    var C = root.TLI.content, V = C.COPY, viz = root.TLI.visuals;
    var primary = score.primaryStyle, nat = score.natural, pres = score.pressure, rng = score.range;
    var supporting = score.supporting; // [{style,pct}] >=10
    var topSupport = supporting[0] || null;
    var lowConf = score.confidence.lowConfidence;
    var out = [];

    var IMG = root.TLI_IMG || {};
    var fullName = esc((meta.firstName || '') + ' ' + (meta.lastName || '')).trim();
    var COL = viz.COLORS, sc = COL[primary] || COL.TRACTOR;
    var styleVars = '--tli-style:' + sc.p + ';--tli-style-dark:' + sc.d + ';--tli-style-light:' + sc.l + ';';
    function wrap(s) { return '<div class="tli-doc" style="' + styleVars + '">' + s + '</div>'; }

    /* ---------- PAGE 1 · ANONYMOUS DARK COVER ----------
       Same for every reader: no name, no date, no style. Desk-peek safe. */
    var coverArt = IMG.cover ? '<img class="tli-cover-img" src="' + IMG.cover + '" alt="">' : '';
    out.push(page('tli-cover tli-cover--hero',
      '<h1 class="tli-cover-title">THE <span>LEADERSHIP</span> IMPRINT</h1>' +
      '<p class="tli-cover-tagline">Leadership is more than style.<br>It’s the imprint you leave.</p>' +
      coverArt +
      '<div class="tli-cover-foot">Powered by Black Sheep Leadership Group</div>'));

    /* ---------- PAGE 2 · PERSONAL TITLE PAGE (the reveal) ---------- */
    var styleArt = IMG[primary] ? '<img class="tli-cover-img" src="' + IMG[primary] + '" alt="">' : '';
    out.push(page('tli-cover tli-cover--personal',
      '<div class="tli-cover-eyebrow">The Leadership Imprint</div>' +
      styleArt +
      '<div class="tli-cover-styleblock"><div class="tli-cover-styleeyebrow">You lead like a</div>' +
        '<div class="tli-cover-style">' + LABEL[primary].toUpperCase() + '</div>' +
        '<div class="tli-cover-styletag">' + esc(V.styleTagline[primary]) + '</div></div>' +
      '<div class="tli-personal"><span class="tli-personal-label">The Individual Imprint of</span>' +
        '<span class="tli-personal-name">' + fullName + '</span>' +
        (meta.company ? '<span class="tli-personal-co">' + esc(meta.company) + '</span>' : '') +
        (meta.date ? '<span class="tli-personal-date">' + esc(meta.date) + '</span>' : '') +
      '</div>' +
      '<div class="tli-cover-foot">Powered by Black Sheep Leadership Group</div>'));

    /* ---------- PAGE 1 · YOUR IMPRINT (Tier One) ---------- */
    var p1 = '<div class="tli-eyebrow">Your Imprint at a Glance</div>' + h('h', 'Your Imprint') +
      '<p class="tli-big">You lead like a <strong>' + LABEL[primary] + '</strong>.</p>' +
      '<p class="tli-summary">' + esc(V.oneLineSummary[primary]) + '</p>' +
      '<div class="tli-viz">' + viz.grid(nat, pres, { showNatural: true, showPressure: true, style: primary }) + '</div>' +
      '<div class="tli-viz">' + viz.blendBars(score.blend, primary) + '</div>';
    if (topSupport) p1 += '<blockquote class="tli-note">You are mostly ' + LABEL[primary] + ', with a real thread of ' + LABEL[topSupport.style] + ' running through it. ' + esc(V.supportingInfluence[topSupport.style]) + '</blockquote>';
    if (score.primaryPct >= 70) p1 += '<p class="tli-fine">This is a clear result. You will recognise yourself in the ' + LABEL[primary] + ' description quickly.</p>';
    else if (score.primaryPct < 45) p1 += '<p class="tli-fine">This is a close result. More than one style will feel true, and that is worth paying attention to rather than trying to resolve.</p>';
    out.push(page('tli-t1', p1));

    /* ---------- PAGE 2 · UNDER PRESSURE + RANGE + ONE THING (Tier One) ---------- */
    var p2 = h('h', 'Under pressure');
    if (rng.sameStyle) {
      p2 += '<p class="tli-big">When it gets hard, you become <strong>more of what you already are</strong>.</p>' +
        '<p class="tli-summary">' + esc(V.pressureOneliner[primary][primary]) + '</p>';
    } else {
      p2 += '<p class="tli-big">When it gets hard, you move toward <strong>' + LABEL[pres.style] + '</strong>.</p>' +
        '<p class="tli-summary">' + esc(V.pressureOneliner[primary][pres.style]) + '</p>';
    }
    p2 += '<div class="tli-subblock">' + h('h', 'Your range') +
      '<p class="tli-big2"><strong>' + rng.band + '</strong>, you travel ' + rng.distance + ' points between your everyday self and your pressure self.</p>' +
      '<p class="tli-summary">' + esc(V.rangeLineShort[rng.band]) + '</p>' +
      '<div class="tli-viz">' + viz.rangeBar(rng.band, rng.distance) + '</div></div>';
    p2 += '<div class="tli-subblock tli-onething">' + h('h', 'The one thing') +
      '<p class="tli-summary">' + esc(V.oneAdjustment[primary]) + '</p></div>';
    out.push(page('tli-t1', p2));

    if (opts.tier === 'one') return wrap(out.join(''));

    /* ---------- PAGE 3 · ABOUT THIS REPORT ---------- */
    var p3 = '<div class="tli-eyebrow">About this report</div>' + h('h', 'What this measures') +
      '<p>This report describes <strong>how you lead</strong>, not who you are.</p>' +
      '<p>It measures two things. How quickly you move from deciding to doing. And which one you protect first when the work and the people pull in different directions.</p>' +
      '<p>Then it measures what happens to both of those when the pressure comes on, because most leadership gets judged on hard days rather than easy ones.</p>' +
      h('h', 'What this does not measure') +
      '<p><strong>It does not measure how good you are.</strong> Every style produces excellent leaders and poor ones.</p>' +
      '<p><strong>It does not measure your values, your motivation or your emotional intelligence.</strong> Those are different things and other instruments measure them.</p>' +
      '<p><strong>It does not predict how you will perform.</strong> It describes how you behave.</p>' +
      '<p><strong>It is not a hiring tool.</strong> This is a self-report instrument. People can answer it the way they would like to be, and self-report instruments should never be used to make selection decisions about anybody.</p>' +
      h('h', 'How to read it') +
      '<p><strong>There is no right answer in here.</strong> No style is better. No position is better. No range is better. Each one has something it does well and something it costs.</p>' +
      '<p><strong>This is a starting point, not a box.</strong> You are more than four boxes and one of them will not contain you. What it will do is name a pattern you probably already half knew about, and give you something specific to do about it.</p>' +
      '<p><strong>You will recognise yourself in more than one.</strong> That is normal and it is why the report includes all four in full.</p>';
    if (lowConf) p3 += '<div class="tli-warn"><strong>A note on your results.</strong> Your answers were unusually consistent in a way that suggests you may have been answering quickly, or answering as you would like to be rather than as you are. The result below may not be an accurate picture. It is worth taking this again when you have twenty quiet minutes.</div>';
    out.push(page('', p3));

    /* ---------- PAGES 4-5 · THE FRAMEWORK ---------- */
    var p4 = '<div class="tli-eyebrow">The framework</div>' + h('h', 'Two things, measured') +
      '<h4>Pace: how quickly you move from deciding to doing</h4>' +
      '<p>This is not how fast you think. It is how fast you <strong>commit</strong>.</p>' +
      '<p>Some leaders want the whole picture before they move. Others move on the picture available and adjust as they go. Both get there. They get there differently, and they fail differently.</p>' +
      '<div class="tli-viz">' + viz.continuum('Pace', 'Measured', 'Fast') + '</div>' +
      '<h4>Priority: what you protect first when two things compete</h4>' +
      '<p>This is not whether you care about people. Everyone does.</p>' +
      '<p>This is which one you protect when you genuinely cannot protect both. When the deadline and the person are pulling against each other, which way do you lean before you have thought about it?</p>' +
      '<div class="tli-viz">' + viz.continuum('Priority', 'Task', 'People') + '</div>' +
      '<p class="tli-fixed">Task-first does not mean cold. People-first does not mean soft. Some of the most caring leaders you will ever meet are task-first, and some of the toughest are people-first.</p>' +
      h('h', 'Four styles') +
      '<div class="tli-viz">' + viz.grid(nat, pres, { framework: true, images: IMG, style: primary }) + '</div>' +
      h('h', 'Why a fleet needs all four') +
      '<p>Here is the part most assessments leave out.</p>' +
      '<p><strong>Nobody argues that a tractor should be a rocket.</strong> They do different jobs. A fleet with only one kind of vehicle in it is not a strong fleet, however good that vehicle is.</p>' +
      '<p>The same is true of a team. Too many of one style does not make a team stronger. It makes it fail in a specific, predictable way. And too few of another leaves a gap that somebody eventually pays for.</p>' +
      '<p>That is what the Fleet section of this report is for, and it is the part worth acting on.</p>';
    out.push(page('', p4));

    /* ---------- PAGES 6-9 · THE FOUR STYLES ---------- */
    var styles = '<div class="tli-eyebrow">The four styles</div>' +
      STYLE_ORDER.map(function (s) { return renderProfile(C, s, s === primary); }).join('');
    out.push(page('tli-styles', styles));

    /* ---------- PAGES 10-12 · YOUR IMPRINT ---------- */
    var p10 = '<div class="tli-eyebrow">Your Imprint</div>' +
      '<div class="tli-viz">' + viz.grid(nat, pres, { showNatural: true, showPressure: false, style: primary }) + '</div>' +
      h('h', 'Your position') +
      '<p class="tli-pos"><strong>Pace: ' + nat.pace + ' out of 100</strong>, ' + esc(nat.paceDescriptor) + '</p>' +
      '<div class="tli-viz">' + viz.continuum('Pace', 'Measured', 'Fast', nat.pace) + '</div>' +
      '<p class="tli-pos"><strong>Priority: ' + nat.priority + ' out of 100</strong>, ' + esc(nat.priorityDescriptor) + '</p>' +
      '<div class="tli-viz">' + viz.continuum('Priority', 'Task', 'People', nat.priority) + '</div>';
    if (score.centred) p10 += '<blockquote class="tli-note"><strong>You sit near the centre on both.</strong> That is a real result, not a failure of the instrument. It means you genuinely move between styles depending on what is in front of you. The advantage is obvious. The cost is less so: people may find you harder to predict, and you may find it harder to know what your own instinct is when you need it fast.</blockquote>';
    p10 += h('h', 'Your blend') + '<div class="tli-viz">' + viz.blendBars(score.blend, primary) + '</div>' +
      '<p>Nobody is one style. You are mostly ' + LABEL[primary] + ' at ' + score.primaryPct + '%, with ' + supportingSummary(supporting) + '.</p>';
    if (topSupport && topSupport.pct >= 15) p10 += '<p>That ' + LABEL[topSupport.style] + ' thread is strong enough to notice. ' + esc(V.supportingBlend[primary][topSupport.style]) + '</p>';
    p10 += '<p class="tli-note">Your full ' + LABEL[primary] + ' profile is in <strong>The Four Styles</strong> section, marked <strong>THIS IS YOURS</strong>. This page shows where you actually sit within it.</p>';
    if (topSupport && topSupport.pct >= 20) p10 += '<div class="tli-subblock">' + h('h', 'How your supporting style shows up') +
      '<p>You will recognise some of ' + LABEL[topSupport.style] + ' in yourself too. ' + esc(V.supportingBlend[primary][topSupport.style]) + '</p></div>';
    out.push(page('', p10));

    /* ---------- PAGES 13-14 · UNDER PRESSURE (full) ---------- */
    var p13 = '<div class="tli-eyebrow">Under pressure</div>' +
      '<div class="tli-viz">' + viz.grid(nat, pres, { showNatural: true, showPressure: true, style: primary }) + '</div>' +
      h('h', 'Where you go');
    if (rng.sameStyle) {
      p13 += '<p class="tli-big2"><strong>You do not change style under pressure. You intensify.</strong></p>' +
        '<p>' + esc(V.intensificationPara[primary]) + '</p>';
    } else {
      p13 += '<p class="tli-big2">Under pressure you move toward <strong>' + LABEL[pres.style] + '</strong>.</p>' +
        '<p>' + esc(V.pressureOneliner[primary][pres.style]) + '</p>';
    }
    p13 += h('h', 'What your strength becomes') +
      '<p>Every style has a version of itself under pressure that is a liability. Yours is this.</p>' +
      '<p>' + esc(V.pressureLiability[primary]) + '</p>' +
      h('h', 'What your team sees') + '<p>' + esc(V.teamExperience[primary]) + '</p>' +
      h('h', 'What to do about it') + '<p>' + esc(V.pressureAction[primary]) + '</p>';
    out.push(page('', p13));

    /* ---------- PAGE 15 · YOUR RANGE ---------- */
    var p15 = '<div class="tli-eyebrow">Your range</div>' +
      '<div class="tli-viz">' + viz.rangeBar(rng.band, rng.distance) + '</div>' +
      '<p class="tli-big2"><strong>' + rng.band + '. You travel ' + rng.distance + ' points.</strong></p>' +
      paras(V.rangeFull[rng.band]) +
      '<p class="tli-fixed"><strong>No range is better than another.</strong> A wide range is not more skilled and an anchored range is not more reliable. They are different, and each one costs something.</p>';
    out.push(page('', p15));

    /* ---------- PAGES 16-18 · WORKING WITH THE OTHER THREE ---------- */
    var others = STYLE_ORDER.filter(function (s) { return s !== primary; });
    var p16 = '<div class="tli-eyebrow">Working with the other three</div>' +
      '<p class="tli-intro">Knowing your own style is useful. Knowing how to lead somebody who does not share it is the part that changes your week.</p>' +
      '<p class="tli-intro">Here is what the other three need from you, what you are most likely to get wrong with each of them, and one thing to change.</p>';
    p16 += others.map(function (o) {
      var pr = C.PAIRINGS[primary][o];
      return '<div class="tli-pairing"><h4>Leading a ' + LABEL[o] + '</h4>' +
        '<p><span class="tli-plabel">What they need from you</span>' + esc(pr.needs) + '</p>' +
        '<p><span class="tli-plabel">What you are most likely to get wrong</span>' + esc(pr.wrong) + '</p>' +
        '<p class="tli-adjust"><span class="tli-plabel">One adjustment</span>' + esc(pr.adjustment) + '</p></div>';
    }).join('');
    out.push(page('', p16));

    /* ---------- PAGES 19-20 · YOUR FLEET ---------- */
    var fleet = score.fleet;
    var p19 = '<div class="tli-eyebrow">Your fleet</div>';
    if (!fleet) {
      p19 += '<p>You have not estimated your team yet. When you do, this section shows what your team is missing and what it costs.</p>';
    } else {
      p19 += '<blockquote class="tli-note"><strong>This is based on your estimate</strong>, not on your team taking the assessment. Treat it as a first read rather than a measurement. If it feels wrong, it may be wrong. If it feels right, it is worth acting on.</blockquote>' +
        '<div class="tli-viz">' + viz.fleetChart(fleet) + '</div>' + h('h', 'Your fleet');
      var f = fleet.findings;
      f.dominant.forEach(function (s) { p19 += '<p class="tli-big2"><strong>You are heavily ' + LABEL[s] + '.</strong> More than half your team leads the same way.</p><p>' + esc(V.fleetConsequence[s]) + '</p>'; });
      f.heavy.forEach(function (s) { p19 += '<p class="tli-big2"><strong>You lean ' + LABEL[s] + '.</strong> Not dominant, but enough to shape how the team behaves.</p><p>' + esc(V.fleetConsequence[s]) + '</p>'; });
      f.missing.forEach(function (s) { p19 += '<p class="tli-big2"><strong>You have no ' + LABEL[s] + ' on this team.</strong></p><p>' + esc(V.missingConsequence[s]) + '</p>'; });
      f.thin.forEach(function (s) { p19 += '<p class="tli-big2"><strong>You are thin on ' + LABEL[s] + '.</strong> One voice, and it is probably not being heard.</p><p>' + esc(V.missingConsequence[s]) + '</p>'; });
      if (fleet.balanced) p19 += '<p class="tli-big2"><strong>Your fleet is reasonably balanced.</strong> No style dominates and none is missing.</p><p>That is less common than you would think, and it is worth protecting. The risk with a balanced fleet is friction rather than blind spots.</p>';
      if (fleet.friction.length) {
        p19 += h('h', 'Where the friction will be');
        fleet.friction.forEach(function (key) { p19 += '<p><strong>' + esc(V.frictionLabel[key]) + '.</strong> ' + esc(V.frictionCopy[key]) + '</p>'; });
      }
      p19 += h('h', 'What to do about it');
      if (f.dominant.length || f.heavy.length) p19 += '<p>You are not going to rebuild your team. <strong>What you can do is know which voice is missing and go looking for it deliberately</strong> before decisions get made. Ask the question the missing style would have asked.</p>';
      else if (f.missing.length) p19 += '<p>The missing voice has to come from somewhere. Either you supply it yourself, deliberately and out loud, or you find somebody outside the team who will. <strong>What does not work is hoping it turns up.</strong></p>';
      else if (fleet.balanced) p19 += '<p>Name the styles out loud with your team. A balanced fleet’s problem is friction, and friction that gets named as style is workable. Friction that gets named as personality is not.</p>';
    }
    out.push(page('', p19));

    /* ---------- PAGE 21 · WHAT NOW ---------- */
    var p21 = '<div class="tli-eyebrow">What now</div>' + h('h', 'Three things') +
      '<div class="tli-todo"><span class="tli-num">1</span><div><p class="tli-lead"><strong>' + esc(V.oneAdjustment[primary]) + '</strong></p>' + paras(C.PROFILES[primary].workOn.body) + '</div></div>' +
      '<div class="tli-todo"><span class="tli-num">2</span><div><p class="tli-lead"><strong>Tell somebody your pressure move.</strong></p><p>' + esc(V.pressureShare[primary]) + '</p>' +
      '<p>Not an apology. Information. Your team is going to see it anyway, and knowing it is coming is very different from wondering what happened to you.</p></div></div>' +
      '<div class="tli-todo"><span class="tli-num">3</span><div><p class="tli-lead"><strong>Find your missing voice.</strong></p>' +
      '<p>' + (fleet && fleet.findings.missing.length ? 'You have no ' + LABEL[fleet.findings.missing[0]] + ' on your team. Supply that voice yourself, or find someone who will.' : 'Know which style your team is short on, and go looking for it before the next big decision.') + '</p></div></div>' +
      h('h', 'In ninety days') +
      '<p>Come back to this report. Not to see whether your style changed, because it will not have.</p>' +
      '<p>Come back to see whether <strong>your pressure move still costs you the same thing.</strong> That is the part that can change, and it is the only part worth measuring.</p>';
    out.push(page('', p21));

    /* ---------- PAGE 22 · LIMITS AND VALIDITY ---------- */
    var p22 = '<div class="tli-eyebrow">Limits and validity</div>' + h('h', 'What this instrument is') +
      '<p>The Leadership Imprint is a behavioural self-report instrument. It asks you to describe how you behave and it reports a pattern based on your answers.</p>' +
      h('h', 'What that means in practice') +
      '<p><strong>It is only as accurate as your answers were honest.</strong> Everyone has a version of themselves they would prefer to be. If some of your answers leaned that way, the report leans that way too.</p>' +
      '<p><strong>It describes tendency, not ceiling.</strong> Being a Tractor does not mean you cannot move fast. It means moving fast is not where you go first.</p>' +
      '<p><strong>It is a snapshot.</strong> Your style is reasonably stable. Your range and your pressure move can change, particularly with deliberate work.</p>' +
      '<p><strong>It should not be used to make decisions about anybody else.</strong> Not hiring, not promotion, not performance. Self-report instruments are unsuitable for that and using one that way is unfair to the person on the other end.</p>' +
      h('h', 'Validation status') +
      '<p>The Leadership Imprint is behaviourally grounded and its items are mapped to defined constructs. <strong>Statistical validation is in progress.</strong> As the response base grows we will publish internal consistency, distribution and stability data.</p>' +
      '<p>We would rather tell you that than imply a validation we have not yet completed.</p>' +
      '<div class="tli-colophon">Black Sheep Leadership Group · The Leadership Imprint · ' + esc(score.version) + (meta.date ? ' · ' + esc(meta.date) : '') + '</div>';
    out.push(page('', p22));

    return wrap(out.join(''));
  }

  /* ---------- THE MIRROR — separate one-page report ---------- */
  function renderMirror(score, meta) {
    meta = meta || {};
    var C = root.TLI.content, V = C.COPY, viz = root.TLI.visuals;
    var primary = score.primaryStyle, m = score.mirror;
    if (!m) return '';
    var COL = viz.COLORS, sc = COL[primary] || COL.TRACTOR, msc = COL[m.style] || COL.TRACTOR;
    var styleVars = '--tli-style:' + sc.p + ';--tli-style-dark:' + sc.d + ';--tli-style-light:' + sc.l + ';';
    var fullName = esc((meta.firstName || '') + ' ' + (meta.lastName || '')).trim();
    var gridSvg = viz.grid(score.natural, score.pressure, { style: primary, showNatural: true, showPressure: !!score.pressure, asSeen: { pace: m.pace, priority: m.priority } });

    var cards = '<div class="tli-mirror-cols">' +
      '<div class="tli-mirror-col"><span class="tli-mirror-lbl">You see</span><span class="tli-mirror-style" style="color:' + sc.p + '">' + LABEL[primary].toUpperCase() + '</span></div>' +
      '<div class="tli-mirror-col"><span class="tli-mirror-lbl">You suspect they see</span><span class="tli-mirror-style" style="color:' + msc.p + '">' + LABEL[m.style].toUpperCase() + '</span></div>' +
      '</div>';

    var body =
      '<div class="tli-eyebrow">A companion to your Leadership Imprint</div>' +
      h('h', 'The Mirror') +
      '<p class="tli-summary">' + fullName + (meta.company ? ' · ' + esc(meta.company) : '') + '</p>' +
      cards +
      '<p class="tli-intro">Not how you lead, but how you think your team would say you land. The gap between the two is the finding.</p>' +
      '<div class="tli-viz">' + gridSvg + '</div>' +
      '<div class="tli-keep">' + h('h', 'The gap') +
        '<p class="tli-big"><strong>' + m.gap.band + '</strong></p>' +
        '<p class="tli-summary">' + esc(V.mirrorBand[m.gap.band]) + ' ' + esc(V.mirrorDirection[m.gap.direction] || '') + '</p></div>' +
      '<div class="tli-keep">' + h('h', 'What this is') +
        '<p><strong>This is not feedback.</strong> Nobody on your team answered anything. This is your own guess about how you land, and it is worth having for exactly that reason.</p>' +
        '<p>You act on this assumption every day. A leader who believes they are approachable behaves differently from one who suspects they are not, whether or not either is correct.</p>' +
        '<p><strong>The gap is the finding, not the second position.</strong></p></div>' +
      (m.flags && m.flags.indexOf('identical') > -1 ? '<div class="tli-warn">Your two sets of answers came out the same. That can mean you are unusually self-aware. It can also mean the second set was answered the way you would like to be seen rather than the way you suspect you land. Only you know which.</div>' : '') +
      '<div class="tli-keep">' + h('h', 'One question') +
        '<p class="tli-big2">' + esc(V.mirrorReflection[m.gap.band]) + '</p></div>' +
      '<div class="tli-colophon">Black Sheep Leadership Group · The Mirror · ' + esc(score.version) + (meta.date ? ' · ' + esc(meta.date) : '') + '</div>';

    return '<div class="tli-doc" style="' + styleVars + '">' + page('tli-mirror', body) + '</div>';
  }

  var report = { render: render, renderMirror: renderMirror };
  if (typeof module !== 'undefined' && module.exports) module.exports = report;
  root.TLI = root.TLI || {};
  root.TLI.report = report;
})(typeof window !== 'undefined' ? window : this);
