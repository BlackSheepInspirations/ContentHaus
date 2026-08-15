/* THE LEADERSHIP IMPRINT — scoring engine
   Black Sheep Leadership Group.

   Implements Part Four of Leadership_Imprint_Full_Specification_v1.md exactly.
   Pure logic + question data. No DOM. Requireable in Node for testing and
   exposed as window.TLI.engine in the browser.

   Axes:  PACE 0..100  (0 = fully MEASURED, 100 = fully FAST)
          PRIORITY 0..100 (0 = fully TASK, 100 = fully PEOPLE)
   Styles: TRACTOR (measured+task) BUS (measured+people)
           ROCKET (fast+task)      JET (fast+people)
*/
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * PART THREE — THE 40 QUESTIONS
   * Each forced-choice option carries the pole it scores. Reverse-scored
   * items (spec ⟲) simply have their poles swapped in the data; the
   * counter never needs to know which were reversed.
   * ------------------------------------------------------------------ */

  // BLOCK A · NATURAL PACE · 10 forced-choice · MEASURED <-> FAST
  var BLOCK_A = [
    { id: 'A1', prompt: 'Which is more true of you?',
      a: { text: 'I would rather decide now with most of the information', pole: 'FAST' },
      b: { text: 'I would rather wait until I have all of it', pole: 'MEASURED' } },
    { id: 'A2', prompt: 'When a plan changes at short notice:',
      a: { text: 'I start moving and work out the details as I go', pole: 'FAST' },
      b: { text: 'I want to understand what changed before I move', pole: 'MEASURED' } },
    { id: 'A3', reverse: true, prompt: 'Which is more true?',
      a: { text: 'I am often the last one in the room to commit to a direction', pole: 'MEASURED' },
      b: { text: 'I am often the first one in the room to commit to a direction', pole: 'FAST' } },
    { id: 'A4', prompt: 'In a meeting where a decision needs making:',
      a: { text: 'I am usually pushing for us to land it today', pole: 'FAST' },
      b: { text: 'I am usually the one asking what we have not considered', pole: 'MEASURED' } },
    { id: 'A5', prompt: 'When somebody brings me a problem:',
      a: { text: 'My first instinct is to ask questions', pole: 'MEASURED' },
      b: { text: 'My first instinct is to suggest a next step', pole: 'FAST' } },
    { id: 'A6', reverse: true, prompt: 'I would rather:',
      a: { text: 'Have to redo something because I moved too early', pole: 'FAST' },
      b: { text: 'Have to explain why we have not started yet', pole: 'MEASURED' } },
    { id: 'A7', prompt: 'Given a new project with an unclear brief:',
      a: { text: 'I would start something and let it clarify as we go', pole: 'FAST' },
      b: { text: 'I would get the brief clarified before we start', pole: 'MEASURED' } },
    { id: 'A8', prompt: 'People who work with me would more likely say:',
      a: { text: 'Things move quickly around me', pole: 'FAST' },
      b: { text: 'Things are thought through around me', pole: 'MEASURED' } },
    { id: 'A9', reverse: true, prompt: 'When I look back at decisions I regret, they are more often:',
      a: { text: 'Ones I made too quickly', pole: 'FAST' },
      b: { text: 'Ones I sat on too long', pole: 'MEASURED' } },
    { id: 'A10', prompt: 'My inbox and my task list:',
      a: { text: 'I work through them in order and finish what I start', pole: 'MEASURED' },
      b: { text: 'I move to whatever matters most right now', pole: 'FAST' } }
  ];

  // BLOCK B · NATURAL PRIORITY · 10 forced-choice · TASK <-> PEOPLE
  var BLOCK_B = [
    { id: 'B1', prompt: 'When the two conflict, I protect:',
      a: { text: 'The deadline', pole: 'TASK' },
      b: { text: 'The person', pole: 'PEOPLE' } },
    { id: 'B2', prompt: 'Someone on my team is underperforming during a busy period. My first move:',
      a: { text: 'Find out what is going on with them', pole: 'PEOPLE' },
      b: { text: 'Work out how to cover the gap', pole: 'TASK' } },
    { id: 'B3', reverse: true, prompt: 'I would rather be described as:',
      a: { text: 'Someone you can count on to deliver', pole: 'TASK' },
      b: { text: 'Someone you can count on to understand', pole: 'PEOPLE' } },
    { id: 'B4', prompt: 'In a meeting that is running over:',
      a: { text: 'I am watching the clock', pole: 'TASK' },
      b: { text: 'I am watching who has not spoken', pole: 'PEOPLE' } },
    { id: 'B5', prompt: 'When I take on a new team, the first thing I want to know is:',
      a: { text: 'What is not working', pole: 'TASK' },
      b: { text: 'Who is who', pole: 'PEOPLE' } },
    { id: 'B6', reverse: true, prompt: 'A project finished on time but the team is exhausted. My honest first reaction:',
      a: { text: 'Relief that we made it', pole: 'TASK' },
      b: { text: 'Concern about what that cost them', pole: 'PEOPLE' } },
    { id: 'B7', prompt: 'My office or workspace:',
      a: { text: 'Is set up for me to work', pole: 'TASK' },
      b: { text: 'Is set up for people to come in', pole: 'PEOPLE' } },
    { id: 'B8', prompt: 'When I give feedback, I am more focused on:',
      a: { text: 'Being clear about what needs to change', pole: 'TASK' },
      b: { text: 'Making sure it lands without damage', pole: 'PEOPLE' } },
    { id: 'B9', reverse: true, prompt: 'I find it harder to:',
      a: { text: 'Have a difficult conversation with someone I like', pole: 'PEOPLE' },
      b: { text: 'Slow down for a conversation when the work is behind', pole: 'TASK' } },
    { id: 'B10', prompt: 'If I could only get one right this week:',
      a: { text: 'Every commitment met', pole: 'TASK' },
      b: { text: 'Every person on my team feeling supported', pole: 'PEOPLE' } }
  ];

  // BLOCK C · UNDER PRESSURE · 12 scenarios · one option per style
  // Option -> style is fixed: a=ROCKET b=JET c=TRACTOR d=BUS
  var BLOCK_C = [
    { id: 'C1', prompt: 'Two of your team are off unexpectedly and the work still has to get done today. You:',
      a: { text: 'Reassign it yourself within the hour and tell people what changed', style: 'ROCKET' },
      b: { text: 'Pull the team together fast, work out who can take what', style: 'JET' },
      c: { text: 'Work out exactly what will and will not get done, then communicate it', style: 'TRACTOR' },
      d: { text: 'Check in with the people who are left before you ask more of them', style: 'BUS' } },
    { id: 'C2', prompt: 'Something has gone wrong and you do not yet know why. You:',
      a: { text: 'Contain it first, understand it later', style: 'ROCKET' },
      b: { text: 'Get the people closest to it talking, quickly', style: 'JET' },
      c: { text: 'Stop and find out what actually happened before doing anything', style: 'TRACTOR' },
      d: { text: 'Make sure nobody is being blamed while you work it out', style: 'BUS' } },
    { id: 'C3', prompt: 'Your manager changes a priority with no explanation. You:',
      a: { text: 'Change direction and move', style: 'ROCKET' },
      b: { text: 'Reframe it for the team so it makes sense to them', style: 'JET' },
      c: { text: 'Ask for the reasoning before you pass it on', style: 'TRACTOR' },
      d: { text: 'Absorb the frustration yourself rather than pass it down', style: 'BUS' } },
    { id: 'C4', prompt: 'A deadline has moved up and it is now very tight. You:',
      a: { text: 'Cut scope, decide what goes, announce it', style: 'ROCKET' },
      b: { text: 'Rally the team, find a way round', style: 'JET' },
      c: { text: 'Map exactly what is achievable and commit only to that', style: 'TRACTOR' },
      d: { text: 'Ask the team what is realistic before committing to anything', style: 'BUS' } },
    { id: 'C5', prompt: 'Someone on your team makes a significant mistake. Your first move:',
      a: { text: 'Fix the consequence, address the person after', style: 'ROCKET' },
      b: { text: 'Talk to them straight away, keep it moving', style: 'JET' },
      c: { text: 'Understand how it happened before responding to it', style: 'TRACTOR' },
      d: { text: 'Check how they are before anything else', style: 'BUS' } },
    { id: 'C6', prompt: 'You are in a meeting where the mood has turned. You:',
      a: { text: 'Name the problem and push for a decision', style: 'ROCKET' },
      b: { text: 'Change your approach in the moment to shift the room', style: 'JET' },
      c: { text: 'Let it play out, then follow up individually afterwards', style: 'TRACTOR' },
      d: { text: 'Slow it down, make space for people to say what is wrong', style: 'BUS' } },
    { id: 'C7', prompt: 'You have been given a target you do not think is achievable. You:',
      a: { text: 'Take it on and work out how afterwards', style: 'ROCKET' },
      b: { text: 'Negotiate it, but keep everyone positive while you do', style: 'JET' },
      c: { text: 'Build the case for why it is not achievable, with evidence', style: 'TRACTOR' },
      d: { text: 'Worry first about what it will do to the team', style: 'BUS' } },
    { id: 'C8', prompt: 'Two people on your team are in open conflict. You:',
      a: { text: 'Make a decision about the issue and move everyone on', style: 'ROCKET' },
      b: { text: 'Get them talking quickly, before it hardens', style: 'JET' },
      c: { text: 'Speak to each of them separately and get the full picture', style: 'TRACTOR' },
      d: { text: 'Give it a little time and stay close to both of them', style: 'BUS' } },
    { id: 'C9', prompt: 'Under real pressure, the thing you are most likely to stop doing is:',
      a: { text: 'Consulting people before deciding', style: 'ROCKET' },
      b: { text: 'Following the plan you agreed', style: 'JET' },
      c: { text: 'Communicating what you are thinking', style: 'TRACTOR' },
      d: { text: 'Saying the difficult thing that needs saying', style: 'BUS' } },
    { id: 'C10', prompt: 'When you are stretched too thin, you are most likely to:',
      a: { text: 'Push harder and expect the same from everyone', style: 'ROCKET' },
      b: { text: 'Take on more than you can deliver', style: 'JET' },
      c: { text: 'Go quiet and work through it alone', style: 'TRACTOR' },
      d: { text: "Carry other people's load as well as your own", style: 'BUS' } },
    { id: 'C11', prompt: 'A decision has to be made now and the information is incomplete. You:',
      a: { text: 'Decide', style: 'ROCKET' },
      b: { text: 'Decide, and get people behind it fast', style: 'JET' },
      c: { text: 'Decide the smallest thing you can, and hold the rest', style: 'TRACTOR' },
      d: { text: 'Check who this affects before deciding', style: 'BUS' } },
    { id: 'C12', prompt: 'Looking back at the last time things got genuinely difficult, the feedback you would most likely have got is:',
      a: { text: 'You moved too fast for people to keep up', style: 'ROCKET' },
      b: { text: 'You promised more than could be delivered', style: 'JET' },
      c: { text: 'Nobody knew what you were thinking', style: 'TRACTOR' },
      d: { text: 'You did not say the thing that needed saying', style: 'BUS' } }
  ];

  // BLOCK D · VALIDITY · 5 frequency items (1..5). Not scored for style.
  var BLOCK_D = [
    { id: 'D1', text: 'I change how I work depending on who I am working with.' },
    { id: 'D2', text: 'People who work with me know what to expect from me.' },
    { id: 'D3', text: 'I behave differently when things are going badly than when they are going well.' },
    { id: 'D4', text: 'I answered these questions about how I actually behave, not how I would like to.' },
    { id: 'D5', text: 'I found some of these questions hard to answer because it depends on the situation.' }
  ];

  // BLOCK E · CONFLICT DEFAULT · 3 forced-choice · SCORED SEPARATELY, WITHHELD
  var BLOCK_E = [
    { id: 'E1', prompt: 'When a disagreement gets uncomfortable, I am more likely to:',
      a: { text: 'Push for my position', code: 'ASSERT' },
      b: { text: 'Look for something we can both live with', code: 'ACCOMMODATE' } },
    { id: 'E2', prompt: 'When somebody is underperforming and I have noticed but not said anything, it is usually because:',
      a: { text: 'I am waiting for the right moment', code: 'DELAY' },
      b: { text: 'I am hoping it resolves itself', code: 'AVOID' } },
    { id: 'E3', prompt: 'After a difficult conversation, I am more likely to think:',
      a: { text: 'I should have been clearer', code: 'UNDER-ASSERT' },
      b: { text: 'I should have been softer', code: 'OVER-ASSERT' } }
  ];

  // THE MIRROR · 12 forced-choice · "My team would say I..." (perception).
  // M1-M6 pace, M7-M12 priority. Same poles/maths as Blocks A/B, third person.
  var BLOCK_M = [
    { id: 'M1', prompt: 'My team would say I…',
      a: { text: 'Decide quickly, sometimes before they are ready', pole: 'FAST' },
      b: { text: 'Take my time, sometimes longer than they would like', pole: 'MEASURED' } },
    { id: 'M2', prompt: 'My team would say that when something changes, I…',
      a: { text: 'Move straight away and sort the detail later', pole: 'FAST' },
      b: { text: 'Want to understand it properly first', pole: 'MEASURED' } },
    { id: 'M3', reverse: true, prompt: 'My team would say I am…',
      a: { text: 'Usually the one holding things up while I think', pole: 'MEASURED' },
      b: { text: 'Usually the one pushing us to get on with it', pole: 'FAST' } },
    { id: 'M4', prompt: 'My team would say that when they bring me a problem, I…',
      a: { text: 'Ask them questions about it', pole: 'MEASURED' },
      b: { text: 'Tell them what to do about it', pole: 'FAST' } },
    { id: 'M5', prompt: 'My team would say things around me…',
      a: { text: 'Move fast', pole: 'FAST' },
      b: { text: 'Get thought through', pole: 'MEASURED' } },
    { id: 'M6', reverse: true, prompt: 'My team would say my most frustrating habit is…',
      a: { text: 'Changing direction before they have finished the last thing', pole: 'FAST' },
      b: { text: 'Sitting on decisions they are waiting for', pole: 'MEASURED' } },
    { id: 'M7', prompt: 'My team would say that when the work and the people pull against each other, I protect…',
      a: { text: 'The work', pole: 'TASK' },
      b: { text: 'The person', pole: 'PEOPLE' } },
    { id: 'M8', prompt: 'My team would say I notice…',
      a: { text: 'When something is slipping', pole: 'TASK' },
      b: { text: 'When somebody is struggling', pole: 'PEOPLE' } },
    { id: 'M9', reverse: true, prompt: 'My team would say they come to me…',
      a: { text: 'When they need a decision', pole: 'TASK' },
      b: { text: 'When they need to talk', pole: 'PEOPLE' } },
    { id: 'M10', prompt: 'My team would say I am…',
      a: { text: 'Someone who gets things done', pole: 'TASK' },
      b: { text: 'Someone who looks out for them', pole: 'PEOPLE' } },
    { id: 'M11', prompt: 'My team would say that in a meeting I am watching…',
      a: { text: 'The clock', pole: 'TASK' },
      b: { text: 'The room', pole: 'PEOPLE' } },
    { id: 'M12', reverse: true, prompt: 'My team would say the thing I ask about first is…',
      a: { text: 'How they are', pole: 'PEOPLE' },
      b: { text: 'Where we are', pole: 'TASK' } }
  ];

  // FLEET · self-estimated (Path A). Four counts the leader estimates.
  var FLEET_QUESTIONS = [
    { id: 'rocket', style: 'ROCKET', text: 'Fast-moving and task-first' },
    { id: 'jet', style: 'JET', text: 'Fast-moving and people-first' },
    { id: 'tractor', style: 'TRACTOR', text: 'Measured and task-first' },
    { id: 'bus', style: 'BUS', text: 'Measured and people-first' }
  ];

  var STYLES = ['TRACTOR', 'BUS', 'JET', 'ROCKET'];
  var STYLE_LABEL = { TRACTOR: 'Tractor', BUS: 'Bus', JET: 'Jet', ROCKET: 'Rocket' };

  // Quadrant centres in (PACE, PRIORITY) space (spec 4.2)
  var CENTRES = {
    TRACTOR: [25, 25], // measured, task
    BUS: [25, 75],     // measured, people
    ROCKET: [75, 25],  // fast, task
    JET: [75, 75]      // fast, people
  };

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  function styleFor(pace, priority) {
    if (pace >= 50) return priority >= 50 ? 'JET' : 'ROCKET';
    return priority >= 50 ? 'BUS' : 'TRACTOR';
  }
  function dist(ax, ay, bx, by) { return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by)); }
  function round(n) { return Math.round(n); }

  // Count how many chosen forced-choice options carry a given pole.
  function countPole(block, answers, pole) {
    var n = 0;
    block.forEach(function (q) {
      var pick = answers[q.id];
      if (pick && q[pick] && q[pick].pole === pole) n++;
    });
    return n;
  }

  /* ------------------------------------------------------------------ *
   * 4.1 Natural position
   * ------------------------------------------------------------------ */
  function naturalPosition(answersA, answersB) {
    var fast = countPole(BLOCK_A, answersA, 'FAST');
    var people = countPole(BLOCK_B, answersB, 'PEOPLE');
    var pace = (fast / BLOCK_A.length) * 100;
    var priority = (people / BLOCK_B.length) * 100;
    return { pace: pace, priority: priority, style: styleFor(pace, priority) };
  }

  /* ------------------------------------------------------------------ *
   * 4.2 Blend percentages (affinity = 1 / (distance + 10))
   * ------------------------------------------------------------------ */
  function blend(pace, priority) {
    var affinities = {}, sum = 0;
    STYLES.forEach(function (s) {
      var c = CENTRES[s];
      var d = dist(pace, priority, c[0], c[1]);
      var a = 1 / (d + 10);
      affinities[s] = a; sum += a;
    });
    var out = {};
    STYLES.forEach(function (s) { out[s] = (affinities[s] / sum) * 100; });
    return out;
  }

  // Ranked blend with rounded percentages that still sum to 100.
  function rankedBlend(pace, priority) {
    var raw = blend(pace, priority);
    var arr = STYLES.map(function (s) { return { style: s, pct: raw[s] }; });
    arr.sort(function (x, y) { return y.pct - x.pct; });
    // largest-remainder rounding so displayed integers total 100
    var floors = arr.map(function (o) { return Math.floor(o.pct); });
    var remainder = 100 - floors.reduce(function (a, b) { return a + b; }, 0);
    var order = arr.map(function (o, i) { return { i: i, frac: o.pct - floors[i] }; })
      .sort(function (a, b) { return b.frac - a.frac; });
    for (var k = 0; k < remainder; k++) floors[order[k].i]++;
    return arr.map(function (o, i) { return { style: o.style, pct: floors[i] }; });
  }

  /* ------------------------------------------------------------------ *
   * 4.3 Pressure position (Block C)
   * ------------------------------------------------------------------ */
  function pressurePosition(answersC) {
    var counts = { ROCKET: 0, JET: 0, TRACTOR: 0, BUS: 0 };
    BLOCK_C.forEach(function (q) {
      var pick = answersC[q.id];
      if (pick && q[pick]) counts[q[pick].style]++;
    });
    var n = BLOCK_C.length;
    var fastCount = counts.ROCKET + counts.JET;
    var peopleCount = counts.JET + counts.BUS;
    var pace = (fastCount / n) * 100;
    var priority = (peopleCount / n) * 100;
    return { pace: pace, priority: priority, style: styleFor(pace, priority), counts: counts };
  }

  /* ------------------------------------------------------------------ *
   * 4.4 Range
   * ------------------------------------------------------------------ */
  function rangeBand(distance) {
    if (distance <= 15) return 'Anchored';
    if (distance <= 30) return 'Steady';
    if (distance <= 50) return 'Adaptive';
    return 'Wide';
  }
  function rangeOf(natural, pressure) {
    var d = dist(natural.pace, natural.priority, pressure.pace, pressure.priority);
    return { distance: round(d), band: rangeBand(d), sameStyle: natural.style === pressure.style };
  }

  /* ------------------------------------------------------------------ *
   * Descriptors (report template pages 10-12)
   * ------------------------------------------------------------------ */
  function paceDescriptor(pace) {
    if (pace <= 20) return 'strongly measured';
    if (pace <= 40) return 'measured';
    if (pace < 60) return 'balanced, leaning ' + (pace < 50 ? 'measured' : 'fast');
    if (pace <= 79) return 'fast';
    return 'strongly fast';
  }
  function priorityDescriptor(priority) {
    if (priority <= 20) return 'strongly task';
    if (priority <= 40) return 'task';
    if (priority < 60) return 'balanced, leaning ' + (priority < 50 ? 'task' : 'people');
    if (priority <= 79) return 'people';
    return 'strongly people';
  }

  /* ------------------------------------------------------------------ *
   * 4.5 Confidence flags
   * ------------------------------------------------------------------ */
  function confidence(responses) {
    var A = responses.A || {}, B = responses.B || {}, C = responses.C || {}, D = responses.D || {};
    var flags = [];

    // All Block A on one side AND all Block B on one side -> response set
    var aFast = countPole(BLOCK_A, A, 'FAST');
    var bPeople = countPole(BLOCK_B, B, 'PEOPLE');
    var aOneSided = (aFast === 0 || aFast === BLOCK_A.length);
    var bOneSided = (bPeople === 0 || bPeople === BLOCK_B.length);
    if (aOneSided && bOneSided) flags.push('response_set');

    // Block D straight-lined (identical value on all five)
    var dVals = BLOCK_D.map(function (q) { return D[q.id]; });
    if (dVals.every(function (v) { return v != null; }) &&
        dVals.every(function (v) { return v === dVals[0]; })) flags.push('d_straightline');

    // D4 <= 2 (self-reported dishonesty)
    if (D.D4 != null && D.D4 <= 2) flags.push('d4_low');

    // Block C dominated by one option letter (>= 10 of 12)
    var letterCounts = {};
    BLOCK_C.forEach(function (q) { var p = C[q.id]; if (p) letterCounts[p] = (letterCounts[p] || 0) + 1; });
    var maxLetter = 0;
    Object.keys(letterCounts).forEach(function (k) { if (letterCounts[k] > maxLetter) maxLetter = letterCounts[k]; });
    if (maxLetter >= 10) flags.push('c_patterned');

    var lowConfidence = flags.length > 0;
    return { lowConfidence: lowConfidence, flags: flags };
  }

  // Genuinely centred is NOT low confidence — reported as "balanced".
  function isCentred(natural) {
    return natural.pace >= 45 && natural.pace <= 55 && natural.priority >= 45 && natural.priority <= 55;
  }

  /* ------------------------------------------------------------------ *
   * Block E — scored separately, withheld from the standard report
   * ------------------------------------------------------------------ */
  function scoreBlockE(answersE) {
    var out = {};
    BLOCK_E.forEach(function (q) {
      var pick = answersE[q.id];
      out[q.id] = (pick && q[pick]) ? q[pick].code : null;
    });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * 4.6 Fleet (self-estimated Path A logic — identical math to Path B)
   * ------------------------------------------------------------------ */
  var FRICTION_PAIRS = [
    { pair: ['ROCKET', 'TRACTOR'], key: 'rocket_tractor' },
    { pair: ['BUS', 'ROCKET'], key: 'bus_rocket' },
    { pair: ['JET', 'TRACTOR'], key: 'jet_tractor' },
    { pair: ['BUS', 'JET'], key: 'bus_jet' }
  ];
  function fleet(counts) {
    counts = counts || {};
    var c = {
      ROCKET: Number(counts.rocket || counts.ROCKET || 0),
      JET: Number(counts.jet || counts.JET || 0),
      TRACTOR: Number(counts.tractor || counts.TRACTOR || 0),
      BUS: Number(counts.bus || counts.BUS || 0)
    };
    var total = c.ROCKET + c.JET + c.TRACTOR + c.BUS;
    if (total <= 0) return null;
    var shares = {}, findings = { dominant: [], heavy: [], missing: [], thin: [] };
    STYLES.forEach(function (s) {
      var share = (c[s] / total) * 100;
      shares[s] = share;
      if (share >= 50) findings.dominant.push(s);
      else if (share >= 35) findings.heavy.push(s);
      if (c[s] === 0) findings.missing.push(s);
      else if (share <= 15) findings.thin.push(s);
    });
    var balanced = STYLES.every(function (s) { return shares[s] < 35 && c[s] > 0; });
    var friction = FRICTION_PAIRS.filter(function (fp) {
      return shares[fp.pair[0]] >= 20 && shares[fp.pair[1]] >= 20;
    }).map(function (fp) { return fp.key; });
    return { counts: c, total: total, shares: shares, findings: findings, balanced: balanced, friction: friction };
  }

  /* ------------------------------------------------------------------ *
   * The Mirror — perception vs self. Scored separately, never merged.
   * ------------------------------------------------------------------ */
  function scoreMirror(answersM, natural) {
    var paceItems = BLOCK_M.slice(0, 6), prioItems = BLOCK_M.slice(6);
    var fast = countPole(paceItems, answersM, 'FAST');
    var people = countPole(prioItems, answersM, 'PEOPLE');
    var pace = (fast / 6) * 100, priority = (people / 6) * 100;
    var gd = dist(natural.pace, natural.priority, pace, priority);
    var band = gd <= 15 ? 'Aligned' : gd <= 30 ? 'Slight' : gd <= 50 ? 'Real' : 'Wide';
    var dp = pace - natural.pace, dq = priority - natural.priority, dir;
    if (Math.abs(dq) >= Math.abs(dp)) dir = dq < 0 ? 'more_task' : dq > 0 ? 'more_people' : (dp > 0 ? 'faster' : dp < 0 ? 'more_measured' : 'none');
    else dir = dp > 0 ? 'faster' : 'more_measured';
    var flags = [];
    if (Math.round(gd) === 0) flags.push('identical');
    if ((fast === 0 || fast === 6) && (people === 0 || people === 6)) flags.push('mirror_oneside');
    return {
      pace: round(pace), priority: round(priority), style: styleFor(pace, priority),
      gap: { distance: round(gd), band: band, direction: dir }, flags: flags
    };
  }

  /* ------------------------------------------------------------------ *
   * Top-level scorer
   * ------------------------------------------------------------------ */
  function score(responses) {
    responses = responses || {};
    var natural = naturalPosition(responses.A || {}, responses.B || {});
    var pressure = pressurePosition(responses.C || {});
    var range = rangeOf(natural, pressure);
    var blendArr = rankedBlend(natural.pace, natural.priority);
    var conf = confidence(responses);

    var primary = blendArr[0];
    var supporting = blendArr.slice(1).filter(function (o) { return o.pct >= 10; });

    return {
      natural: {
        pace: round(natural.pace), priority: round(natural.priority), style: natural.style,
        paceDescriptor: paceDescriptor(natural.pace), priorityDescriptor: priorityDescriptor(natural.priority)
      },
      pressure: {
        pace: round(pressure.pace), priority: round(pressure.priority),
        style: pressure.style, counts: pressure.counts
      },
      range: range,
      blend: blendArr,                 // [{style, pct}] sorted desc, sums to 100
      primaryStyle: primary.style,
      primaryPct: primary.pct,
      supporting: supporting,          // styles >= 10%, excluding primary
      centred: isCentred(natural),
      confidence: conf,
      conflict: scoreBlockE(responses.E || {}),   // withheld
      fleet: responses.fleet ? fleet(responses.fleet) : null,
      mirror: responses.M ? scoreMirror(responses.M, natural) : null,  // separate report
      version: '1.0'
    };
  }

  var engine = {
    BLOCK_A: BLOCK_A, BLOCK_B: BLOCK_B, BLOCK_C: BLOCK_C, BLOCK_D: BLOCK_D, BLOCK_E: BLOCK_E,
    BLOCK_M: BLOCK_M, scoreMirror: scoreMirror,
    FLEET_QUESTIONS: FLEET_QUESTIONS, STYLES: STYLES, STYLE_LABEL: STYLE_LABEL, CENTRES: CENTRES,
    styleFor: styleFor, naturalPosition: naturalPosition, blend: blend, rankedBlend: rankedBlend,
    pressurePosition: pressurePosition, rangeOf: rangeOf, rangeBand: rangeBand,
    paceDescriptor: paceDescriptor, priorityDescriptor: priorityDescriptor,
    confidence: confidence, isCentred: isCentred, scoreBlockE: scoreBlockE, fleet: fleet, score: score
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  root.TLI = root.TLI || {};
  root.TLI.engine = engine;
})(typeof window !== 'undefined' ? window : this);
