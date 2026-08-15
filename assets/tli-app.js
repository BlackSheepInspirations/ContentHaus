/* THE LEADERSHIP IMPRINT — assessment flow controller.
   Black Sheep Leadership Group. Drives the whole take-it experience per the
   Instructions doc: intro screens, 40 primary items (Blocks A-E) with transitions,
   the Mirror (12), a Fleet estimate, kudos + completion, then renders the report.

   window.TLI.app.mount(rootEl, opts)  opts: { mode:'self'|'org', withhold:false,
     onComplete(result), images }  (images passed through to the report renderer).

   Copy rules honoured: no em dashes, second person, never "test", no "score",
   progress as "X of N" not a bar, options randomised, no partial save/resume.
*/
(function (root) {
  'use strict';
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  var FREQ = ['Almost never', 'Rarely', 'Sometimes', 'Often', 'Almost always'];

  // ---- intro + transition + completion copy (Instructions doc) --------
  var INTRO = [
    { eyebrow: 'The Leadership Imprint', h: 'Before you start',
      body: [
        'This takes about fifteen minutes, and it comes in two parts. First, how you lead. Then a shorter set answered as you think your team would answer about you.',
        '<b>Do this in one sitting.</b> There is no way to save halfway through, so if you close the tab you start again from the beginning.',
        'Find somewhere quiet and give it your full attention. Not in a meeting, not between two other things. Several questions will make you stop and think, and the thinking is where the accuracy comes from.',
        '<b>Answer as you actually are</b>, not as the leader you are working on becoming. This looks at what you do on an ordinary Tuesday, including the parts you are not proud of.',
        'There is no right answer in here and no style that comes out ahead. You are not being ranked. You are being described.'
      ], btn: 'Continue' },
    { eyebrow: 'The Leadership Imprint', h: 'How to answer',
      body: [
        '<b>Go with your first instinct.</b> Read the question, notice what comes to you, and answer that. If you catch yourself building a case, go back to the instinct.',
        '<b>You will have to pick one.</b> Most questions give you two statements and ask which is more true of you. There is no middle option, on purpose. Both will often be true. Pick the one that is more true, more often.',
        '"It depends" is not a problem. Answer for what you do most of the time, when nothing is forcing you either way. That default is what this measures. Pressure comes later, separately.',
        '<b>Some questions will be uncomfortable.</b> Part of this asks how you behave when things are going badly. The honest answer there is worth more than the whole of the rest.'
      ], btn: 'Continue' },
    { eyebrow: 'The Leadership Imprint', h: 'Who sees this',
      body: [
        '<b>You do.</b> Your answers and your report are yours. Nobody else receives a copy, and nobody is notified that you took it.',
        'We keep your responses so we can improve the instrument over time. That is looked at in aggregate, alongside everybody else’s, and never attributed to you individually.',
        'We do not sell your data, we do not share it with employers, and we do not use it for anything other than making the assessment better.'
      ], btn: 'Continue' },
    { eyebrow: 'The Leadership Imprint', h: 'Ready',
      body: [
        'Fifteen minutes. Somewhere quiet. First instinct.',
        '<b>Answer as the leader you actually are, not the one you are working on becoming.</b> That leader is the one who gets something useful out of this.'
      ], btn: 'Begin the assessment' }
  ];

  var TRANSITIONS = {
    A: { h: 'First, how you move', body: ['Two statements each time. Pick the one more true of you.'] },
    B: { h: 'Now, what you protect', body: ['Same format. Both will often be true. Pick the stronger lean.'] },
    C: { h: 'Now the harder part', body: ['These are situations rather than statements, and they ask what you do when things are going badly.', '<b>Answer honestly rather than well.</b> This section is where the useful part of your report comes from.'] },
    D: { h: 'Nearly done', body: ['A few questions about how consistent you are. Rate how often each one is true.'] },
    E: { h: 'Last three', body: ['These are about disagreement. Your answers here are held back from your report and released separately, because they land better with somebody to talk them through.'] }
  };

  root.TLI = root.TLI || {};
  root.TLI.app = {
    mount: function (rootEl, opts) {
      opts = opts || {};
      var E = root.TLI.engine, report = root.TLI.report;
      var state = { intake: { firstName: '', lastName: '', title: '', company: '' }, A: {}, B: {}, C: {}, D: {}, E: {}, M: {}, fleet: { rocket: '', jet: '', tractor: '', bus: '' } };

      // Build the ordered step list.
      var steps = [];
      steps.push({ t: 'intake' });
      INTRO.forEach(function (s) { steps.push({ t: 'screen', s: s }); });
      var PRIMARY = [
        { key: 'A', block: E.BLOCK_A, fmt: 'forced' }, { key: 'B', block: E.BLOCK_B, fmt: 'forced' },
        { key: 'C', block: E.BLOCK_C, fmt: 'scenario' }, { key: 'D', block: E.BLOCK_D, fmt: 'freq' },
        { key: 'E', block: E.BLOCK_E, fmt: 'forced' }
      ];
      var pnum = 0;
      PRIMARY.forEach(function (blk) {
        steps.push({ t: 'screen', s: { eyebrow: 'Part one of two', h: TRANSITIONS[blk.key].h, body: TRANSITIONS[blk.key].body, btn: 'Continue' } });
        blk.block.forEach(function (q) { pnum++; steps.push({ t: 'q', key: blk.key, q: q, fmt: blk.fmt, prog: 'Question ' + pnum + ' of 40' }); });
      });
      steps.push({ t: 'screen', s: {
        eyebrow: 'Part one complete', h: 'Well done', body: [
          'That is how you lead. Now the shorter, harder part.',
          '<b>Twelve more, answered as your team would answer them about you.</b> Not how you see yourself. How you think the people who work for you would describe you if nobody was watching and there were no consequences for saying it.',
          '<b>Be honest rather than generous.</b> If you answer these the way you would like to be seen, you get two identical results and learn nothing. The gap between them is the entire point.'
        ], btn: 'Continue' } });
      var mnum = 0;
      E.BLOCK_M.forEach(function (q) { mnum++; steps.push({ t: 'q', key: 'M', q: q, fmt: 'forced', prog: 'Question ' + mnum + ' of 12' }); });
      steps.push({ t: 'screen', s: { eyebrow: 'Part two complete', h: 'Nicely done', body: ['One last thing, and it is quick. A rough read of your team helps the report show what the group is missing.'], btn: 'Continue' } });
      steps.push({ t: 'fleet' });
      steps.push({ t: 'screen', s: { eyebrow: 'That is it', h: 'That is it', body: [
        'Your report is being put together now.',
        '<b>A suggestion before you read it.</b> Give it the same fifteen minutes you gave the questions. The first two pages tell you your style. The rest tells you what to do about it, and that is the part worth having.'
      ], btn: 'See my report' } });
      steps.push({ t: 'report' });

      var i = 0;
      function go(n) { i = Math.max(0, Math.min(steps.length - 1, n)); render(); }

      function progressBar(label) {
        return el('div', { class: 'tliapp-prog' }, [el('span', { text: label })]);
      }

      function render() {
        var step = steps[i];
        rootEl.innerHTML = '';
        var wrap = el('div', { class: 'tliapp' });
        rootEl.appendChild(wrap);
        window.scrollTo(0, 0);
        if (step.t === 'intake') return renderIntake(wrap);
        if (step.t === 'screen') return renderScreen(wrap, step.s);
        if (step.t === 'q') return renderQ(wrap, step);
        if (step.t === 'fleet') return renderFleet(wrap);
        if (step.t === 'report') return renderReport(wrap);
      }

      function renderScreen(wrap, s) {
        var card = el('div', { class: 'tliapp-card tliapp-screen' }, [
          s.eyebrow ? el('div', { class: 'tliapp-eyebrow', text: s.eyebrow }) : null,
          el('h2', { class: 'tliapp-h', text: s.h })
        ]);
        s.body.forEach(function (p) { card.appendChild(el('p', { html: p })); });
        var btn = el('button', { class: 'tliapp-btn', type: 'button', text: s.btn });
        btn.addEventListener('click', function () { go(i + 1); });
        card.appendChild(btn);
        wrap.appendChild(card);
      }

      function renderIntake(wrap) {
        var card = el('div', { class: 'tliapp-card tliapp-screen' }, [
          el('div', { class: 'tliapp-eyebrow', text: 'The Leadership Imprint' }),
          el('h2', { class: 'tliapp-h', text: 'Let us start with you' }),
          el('p', { text: 'This report is yours. We put your name on it and nothing else.' })
        ]);
        function field(label, key, ph) {
          var inp = el('input', { class: 'tliapp-input', type: 'text', placeholder: ph || '', value: state.intake[key] || '' });
          inp.addEventListener('input', function () { state.intake[key] = inp.value; });
          return el('label', { class: 'tliapp-field' }, [el('span', { text: label }), inp]);
        }
        var row = el('div', { class: 'tliapp-row' }, [field('First name', 'firstName'), field('Last name', 'lastName')]);
        card.appendChild(row);
        card.appendChild(field('Position or title', 'title', 'e.g. Operations Manager'));
        card.appendChild(field('Company or organisation', 'company'));
        var btn = el('button', { class: 'tliapp-btn', type: 'button', text: 'Continue' });
        var note = el('div', { class: 'tliapp-note', text: '' });
        btn.addEventListener('click', function () {
          if (!state.intake.firstName.trim()) { note.textContent = 'Please add your first name so we can put it on your report.'; return; }
          go(i + 1);
        });
        card.appendChild(btn); card.appendChild(note);
        wrap.appendChild(card);
      }

      function pick(key, qid, letter) {
        state[key][qid] = letter;
        go(i + 1);
      }

      function renderQ(wrap, step) {
        var q = step.q, key = step.key, fmt = step.fmt;
        var card = el('div', { class: 'tliapp-card tliapp-q' }, [progressBar(step.prog)]);
        if (fmt === 'freq') {
          card.appendChild(el('h3', { class: 'tliapp-qtext', text: q.text }));
          var scale = el('div', { class: 'tliapp-scale' });
          FREQ.forEach(function (lab, n) {
            var b = el('button', { class: 'tliapp-scalebtn', type: 'button' }, [el('span', { class: 'tliapp-scalenum', text: String(n + 1) }), el('span', { text: lab })]);
            b.addEventListener('click', function () { pick(key, q.id, n + 1); });
            scale.appendChild(b);
          });
          card.appendChild(scale);
        } else if (fmt === 'scenario') {
          card.appendChild(el('h3', { class: 'tliapp-qtext', text: q.prompt }));
          var opts = el('div', { class: 'tliapp-opts' });
          shuffle(['a', 'b', 'c', 'd']).forEach(function (l) {
            var b = el('button', { class: 'tliapp-opt', type: 'button', text: q[l].text });
            b.addEventListener('click', function () { pick(key, q.id, l); });
            opts.appendChild(b);
          });
          card.appendChild(opts);
        } else { // forced choice
          if (q.prompt) card.appendChild(el('h3', { class: 'tliapp-qtext', text: q.prompt }));
          var fo = el('div', { class: 'tliapp-opts tliapp-opts--two' });
          shuffle(['a', 'b']).forEach(function (l) {
            var b = el('button', { class: 'tliapp-opt', type: 'button', text: q[l].text });
            b.addEventListener('click', function () { pick(key, q.id, l); });
            fo.appendChild(b);
          });
          card.appendChild(fo);
        }
        // back link (allowed; no partial save, but within-session back is fine)
        if (i > 0) {
          var back = el('button', { class: 'tliapp-back', type: 'button', text: '‹ Back' });
          back.addEventListener('click', function () { go(i - 1); });
          card.appendChild(back);
        }
        wrap.appendChild(card);
      }

      function renderFleet(wrap) {
        var card = el('div', { class: 'tliapp-card tliapp-screen' }, [
          el('div', { class: 'tliapp-eyebrow', text: 'Your team' }),
          el('h2', { class: 'tliapp-h', text: 'Your team at a glance' }),
          el('p', { text: 'Think about the people who report to you. Roughly how many of them lead each way? A best guess is fine. Leave it blank if you do not manage a team.' })
        ]);
        var defs = [
          { k: 'rocket', t: 'Fast-moving and task-first' }, { k: 'jet', t: 'Fast-moving and people-first' },
          { k: 'tractor', t: 'Measured and task-first' }, { k: 'bus', t: 'Measured and people-first' }
        ];
        defs.forEach(function (d) {
          var inp = el('input', { class: 'tliapp-input tliapp-num', type: 'number', min: '0', value: state.fleet[d.k] });
          inp.addEventListener('input', function () { state.fleet[d.k] = inp.value; });
          card.appendChild(el('label', { class: 'tliapp-field tliapp-field--row' }, [el('span', { text: d.t }), inp]));
        });
        var btn = el('button', { class: 'tliapp-btn', type: 'button', text: 'Continue' });
        btn.addEventListener('click', function () { go(i + 1); });
        card.appendChild(btn);
        wrap.appendChild(card);
      }

      function buildResponses() {
        var fleet = null, f = state.fleet;
        var total = ['rocket', 'jet', 'tractor', 'bus'].reduce(function (s, k) { return s + (Number(f[k]) || 0); }, 0);
        if (total > 0) fleet = { rocket: Number(f.rocket) || 0, jet: Number(f.jet) || 0, tractor: Number(f.tractor) || 0, bus: Number(f.bus) || 0 };
        return { A: state.A, B: state.B, C: state.C, D: state.D, E: state.E, M: state.M, fleet: fleet };
      }

      function renderReport(wrap) {
        var responses = buildResponses();
        var score = E.score(responses);
        var meta = { firstName: state.intake.firstName, lastName: state.intake.lastName, company: state.intake.company };
        if (typeof opts.onComplete === 'function') opts.onComplete({ score: score, responses: responses, meta: meta });
        // Render the report + a link to the Mirror, inside a #tli surface so styles apply.
        var host = el('div', { id: 'tli' });
        host.innerHTML = report.render(score, meta) + (score.mirror ? report.renderMirror(score, meta) : '');
        wrap.appendChild(host);
      }

      render();
    }
  };
})(typeof window !== 'undefined' ? window : this);
