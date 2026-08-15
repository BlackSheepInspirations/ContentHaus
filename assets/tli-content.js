/* THE LEADERSHIP IMPRINT — report copy
   Black Sheep Leadership Group.

   Verbatim content from Leadership_Imprint_Report_Template_v1.md and Part Five of
   the specification. Voice rules preserved: grade 7-8, second person, NO em dashes,
   British spelling as authored. Keys are UPPERCASE style names to match the engine.

   Where the template leaves a variable that has no verbatim table (e.g. the
   cross-style "where you go" paragraph, the fleet summary line), the renderer
   composes it from provided copy + computed values — it never invents new prose.
*/
(function (root) {
  'use strict';

  var COPY = {
    styleTagline: {
      TRACTOR: 'Steady. Thorough. Built to Last.',
      BUS: 'Moving forward without leaving people behind.',
      JET: 'Change the Route. Keep the Destination.',
      ROCKET: 'Commit. Accelerate. Breakthrough.'
    },

    // Page 1
    oneLineSummary: {
      TRACTOR: 'You want the whole picture before you move, and when you move, nothing falls through.',
      BUS: 'You move at the pace of the people with you, and nobody on your team feels unseen.',
      JET: 'You move fast and you bring people with you, adjusting as the situation changes.',
      ROCKET: 'You decide and you go, and in a crisis that is exactly what everyone needs.'
    },
    supportingInfluence: {
      TRACTOR: 'It shows up as a pull toward getting it right before getting it moving.',
      BUS: 'It shows up as an instinct to check on people before you push.',
      JET: 'It shows up as a willingness to change your approach when the first one is not landing.',
      ROCKET: 'It shows up as impatience when things sit still too long.'
    },

    // Page 2 - pressure one-liners, keyed [natural][pressure]. Same-style rows
    // double as the short intensification line.
    pressureOneliner: {
      TRACTOR: {
        TRACTOR: 'You go further into detail, and further into silence.',
        ROCKET: 'You stop consulting and start deciding alone.',
        BUS: 'You stop pushing and start absorbing.',
        JET: 'You start improvising in a way people do not expect from you.'
      },
      BUS: {
        BUS: 'You absorb more, and say less.',
        ROCKET: 'You go from protecting people to deciding over them, fast.',
        TRACTOR: 'You go quiet and start working it alone.',
        JET: 'You start promising things to make the discomfort stop.'
      },
      JET: {
        JET: 'You move faster and commit to more than can be delivered.',
        ROCKET: 'You stop bringing people with you and just go.',
        TRACTOR: 'You stop adapting and start over-analysing, which is not like you.',
        BUS: 'You slow down and start protecting people from what is happening.'
      },
      ROCKET: {
        ROCKET: 'You go faster and consult less.',
        TRACTOR: 'You stop and start checking, which surprises everyone.',
        BUS: 'You soften, and stop saying the thing that needs saying.',
        JET: 'You start flexing to keep people with you, at the cost of the line.'
      }
    },

    // Page 2 / Page 15 range
    rangeLineShort: {
      Anchored: 'People always know what they are getting from you. The cost is that when a situation needs something different, you may not have it.',
      Steady: 'You shift a little without becoming somebody else. That is a comfortable place to lead from.',
      Adaptive: 'You genuinely change when the pressure comes on. Useful, as long as your team knows it is coming.',
      Wide: 'You become a noticeably different leader under pressure. That is a real capability and it is also disorienting for people who were not expecting it.'
    },
    rangeFull: {
      Anchored: ['You are almost the same person under pressure as you are on an ordinary day. There is real value in that. People always know what they are getting from you, and in a difficult moment that predictability is worth a lot.',
        'The cost is on the other side. When a situation calls for something that is not your natural approach, you may not have it available. Consistency and rigidity look identical from the outside. The difference is whether you could move if you chose to.'],
      Steady: ['You shift a little under pressure without becoming somebody else. Your team would notice a change in you but would still recognise you, which is a comfortable place to lead from.',
        'This is the range most leaders would choose if they could. There is not much to fix here. The thing worth watching is whether the shift is deliberate or automatic.'],
      Adaptive: ['You genuinely change when the pressure comes on. That is a real capability, and it means you have more than one way to lead available to you.',
        'The cost is predictability. Your team may be managing two versions of you without knowing which one they are getting. The fix is not to change less. It is to say it out loud: "when this gets tight, I go quiet, and that is not about you."'],
      Wide: ['You become a noticeably different leader under pressure. Not slightly. Noticeably.',
        'The capability is real. You have access to responses that a more anchored leader simply does not, and in a genuinely varied environment that is an advantage.',
        'The cost is that people cannot anticipate you, and under pressure they most need to. A team that does not know which version is coming spends energy watching you instead of doing the work.',
        'This is worth naming to your team directly. Not apologising for. Naming.']
    },

    // Page 2 THE ONE THING / Page 21 item 1 short
    oneAdjustment: {
      TRACTOR: 'Say what you are thinking before you have finished thinking it. Silence reads as absence.',
      BUS: 'Have the conversation at week two, not week ten. The early version is the kind one.',
      JET: 'Write down what you committed to. Not for anyone else. For you.',
      ROCKET: 'Ask one question of one person before you decide. Ninety seconds, and you stop being alone in it.'
    },

    // Page 12 supporting blend lines, keyed [primary][supporting]
    supportingBlend: {
      TRACTOR: {
        BUS: 'Your thoroughness has care in it. You check the work and you check the person.',
        ROCKET: 'You are methodical until you are not. When you have decided, you move properly fast.',
        JET: 'You prepare thoroughly and then adapt more readily than people expect.'
      },
      BUS: {
        TRACTOR: 'Your care is organised. You remember the details about people, not just the feeling.',
        JET: 'You read people quickly and you also stay with them. That combination is rare.',
        ROCKET: 'You protect people until something has to happen, and then you surprise them.'
      },
      JET: {
        BUS: 'You move fast and you check who is still with you.',
        ROCKET: 'You adapt quickly and you are willing to be blunt about it.',
        TRACTOR: 'You improvise well because you understood the plan properly first.'
      },
      ROCKET: {
        JET: 'You decide fast and you can bring people with you when you choose to.',
        TRACTOR: 'You move fast on things you have already thought hard about.',
        BUS: 'You are direct, and you notice afterwards who took it badly.'
      }
    },

    // Pages 13-14 (keyed by the reader's natural style)
    intensificationPara: {
      TRACTOR: 'You go further into detail and further into silence. The need for the full picture becomes a reason not to move, and your team cannot tell the difference between you thinking and you being stuck.',
      BUS: 'You absorb more and say less. The conversation you did not have because the timing was wrong becomes the standard you set, and the person you protected never got the chance to fix it.',
      JET: 'You move faster and promise more. You say yes to things that cannot all happen, and you mean every one of them at the moment you say it.',
      ROCKET: 'You go faster and consult less. Things get done, people leave, and those two facts do not always connect in your head.'
    },
    pressureLiability: {
      TRACTOR: 'The thoroughness that makes you trustworthy becomes a place to hide from a decision. Nothing moves, and nobody knows why.',
      BUS: 'The care that makes people stay becomes avoidance that costs them. It looks like kindness from the inside and lands as neglect from the outside.',
      JET: 'The agility that makes you effective becomes improvisation nobody can follow. Everything you said was true when you said it, which is not much comfort to somebody holding the third version of the plan.',
      ROCKET: 'The decisiveness everybody wants in a crisis becomes running people over. You will get it done. You may not have anyone left.'
    },
    teamExperience: {
      TRACTOR: 'Silence. They do not know if you are working on it or stuck on it, and most people assume the worse one.',
      BUS: 'Someone who has gone quiet about a problem everyone can see. They start wondering whether you noticed.',
      JET: 'Change. More of it than they can absorb, and no clear sense of what is fixed.',
      ROCKET: 'Someone who has stopped asking. They stop offering, which is the part that costs you later.'
    },
    pressureAction: {
      TRACTOR: 'When you notice yourself gathering rather than deciding, say so out loud. "I am not there yet, here is what I am weighing, I will have it Thursday." One sentence, and your team stops guessing.',
      BUS: 'When you catch yourself waiting for a better moment, name the deadline. "I will have that conversation by Friday." Tell somebody you said it.',
      JET: 'Before you say yes to the second thing, look at the first. Out loud if you have to. "I have already committed to X, so this would mean Y moves."',
      ROCKET: 'Before the decision, one question, one person. "What am I missing?" Ninety seconds. Then decide anyway if you want to.'
    },

    // Page 21 item 2
    pressureShare: {
      TRACTOR: '"When it gets hard I go quiet. That is not about you and I am not stuck."',
      BUS: '"When it gets hard I take too much on myself. Tell me when you see it."',
      JET: '"When it gets hard I say yes to too much. Push back on me."',
      ROCKET: '"When it gets hard I stop asking. Interrupt me anyway."'
    },

    // Pages 19-20 fleet consequences (dominant/heavy)
    fleetConsequence: {
      TRACTOR: 'Nothing ships. Everything gets studied. Your team is permanently nearly ready and the plan is always one revision from finished. Watch for decisions that keep coming back to the table.',
      BUS: 'Lovely to be on, going nowhere. Meetings run long. Hard decisions get deferred to protect the atmosphere. Underperformance gets absorbed rather than addressed, and everybody knows about it except, officially, you.',
      JET: 'Constant motion and no depth. Direction changes weekly. Everybody is flexing and nobody is holding a line, and commitments outnumber capacity by a margin nobody has counted.',
      ROCKET: 'Speed and casualties. Things get done and people leave. Nobody says the risky thing because there is no room in which to say it. Check your turnover before you decide this is not you.'
    },
    missingConsequence: {
      TRACTOR: 'Nobody checks. The flaw in the plan gets found by a customer, and by then it is expensive.',
      BUS: 'Nobody knows how people actually are. You find out at the exit interview, and by then there is nothing to do about it.',
      JET: 'Nothing adapts. The plan meets reality, and the plan wins. Everyone keeps executing something that stopped working three weeks ago.',
      ROCKET: 'Nothing ships on time and nobody says the hard thing. There is always a good reason and the reasons are always true.'
    },
    frictionCopy: {
      rocket_tractor: 'The sharpest pair you have. One thinks the other is reckless. One thinks the other is slow. Both are right about the risk they can see and neither can see the other’s. This is the friction most likely to be read as a personality problem when it is a style problem.',
      bus_rocket: 'The Rocket reads the Bus as soft. The Bus reads the Rocket as careless with people. This is the pairing most likely to end up as a formal complaint, and it usually starts with something small.',
      jet_tractor: 'The Tractor sees improvising where the Jet sees adapting. The Tractor cannot build on a plan that keeps moving. The Jet cannot understand defending a plan that has stopped working.',
      bus_jet: 'The quietest friction and the easiest to miss. Both are people-first, so it looks like alignment. It stays looking like alignment until the Bus discovers the Jet promised something on their behalf.'
    },
    frictionLabel: {
      rocket_tractor: 'Rocket and Tractor', bus_rocket: 'Bus and Rocket',
      jet_tractor: 'Jet and Tractor', bus_jet: 'Bus and Jet'
    },

    // The Mirror
    mirrorBand: {
      Aligned: 'You see yourself roughly as you think they do.',
      Slight: 'A small difference, worth noticing.',
      Real: 'A genuine gap between how you see yourself and how you think you land.',
      Wide: 'You believe your team experiences a considerably different leader from the one you experience being.'
    },
    mirrorDirection: {
      faster: 'You suspect you come across as more impatient than you feel.',
      more_measured: 'You suspect you come across as slower or more hesitant than you feel.',
      more_task: 'You suspect you come across as harder than you feel. That is the most common gap of all.',
      more_people: 'You suspect you come across as softer than you feel.',
      none: 'You suspect your team sees you much as you see yourself.'
    },
    mirrorReflection: {
      Aligned: 'You think you land the way you feel. The only way to know is to ask somebody. Pick one person this week.',
      Slight: 'Small gap, and it is probably real. What is the one thing you do that they read differently from how you mean it?',
      Real: 'There is a genuine difference here. Which version is closer to the truth, and how would you find out?',
      Wide: 'Which version is closer to the truth, and how would you find out? Pick one person this week and ask them.'
    }
  };

  /* ----------------------------------------------------------------- *
   * PART FIVE — the four full profiles. Sections carry an optional bold
   * `lead` and a `body` array of paragraphs.
   * ----------------------------------------------------------------- */
  var PROFILES = {
    TRACTOR: {
      position: 'Measured pace · Task priority',
      howYouMove: { lead: 'Slowly, deliberately, and in a straight line.', body: [
        'You want the whole story before you start. Not because you are cautious by temperament, but because you have learned that starting without it costs more later. Getting from A to B takes you longer than it takes most people around you.',
        'And when it is done, it is done properly. Fly over the field afterwards and the rows are perfectly straight.'] },
      whatPeopleNotice: { lead: null, body: [
        'You ask the question everyone else skipped. Usually about halfway through a meeting, usually the one that changes the answer.',
        'You want context before you want the ask. Somebody who comes to you with "can you just do this quickly" gets a series of questions back, and they sometimes read that as resistance. It is not resistance. You are trying to do it properly and you cannot until you understand it.',
        'Your desk and your inbox may be chaos while your actual work is immaculate. That surprises people who assume order shows up everywhere. Your order is in the output.'] },
      gift: { lead: 'Nothing falls through.', body: [
        'When you say something is done, it is done. Checked, complete, and it will hold. Your team learns they do not have to go behind you.',
        'You find the flaw in the plan while it is still cheap to fix. Everyone else finds it in week six. That is not pessimism, though it gets read that way. It is you running the whole thing through before committing to it.',
        'And there is a kind of trust that only you build. Not warmth. Reliability, the knowledge that what you said would happen is what will happen.'] },
      underPressure: { lead: 'You stop.', body: [
        'Detail becomes somewhere to hide from a decision. The need for the whole story becomes a reason not to move, and the more pressure there is, the more information you want before you commit.',
        'Meanwhile the team is waiting. And here is the part that is hard to see from inside it: they often cannot tell the difference between you thinking and you being stuck. From the outside both look like silence.',
        'Your other pressure move is going quiet. You work the problem alone rather than out loud, because talking about it before you have an answer feels premature. Your team experiences that as being shut out at exactly the moment they most needed to know what you were thinking.'] },
      needFromOthers: { lead: 'Context, and lead time.', body: [
        'Ambush a Tractor with a decision and you will get one of two things. Either a freeze, or a yes that quietly does not happen.',
        'Give the same Tractor the background on Monday and the decision on Wednesday and you get a better answer than anyone else in the building would have given you.'] },
      drivesYouMad: { lead: null, body: [
        'Being rushed. Being told to just make it work. Discovering that a decision was made without the information you would have provided, and then being asked to fix the consequences.',
        'Meetings that reach a conclusion nobody has thought through.'] },
      workOn: { lead: 'Say what you are thinking before you have finished thinking it.', body: [
        'Not the answer. The process. "I am not there yet, here is what I am weighing, I will have it by Thursday."',
        'That one sentence costs you nothing and it changes everything for the people waiting on you. Silence reads as absence. Narration reads as leadership.'] }
    },

    BUS: {
      position: 'Measured pace · People priority',
      howYouMove: { lead: 'Steadily, and with everybody on board.', body: [
        'Point A to point B through the middle of the city, stopping for passengers, taking a detour when somebody needs one, then getting back on route. You arrive later than the direct route would. You arrive with everyone.'] },
      whatPeopleNotice: { lead: null, body: [
        'The bowl of something on your desk. Photos up. Your door open because you want it open, not because policy says so.',
        'People stop by without an agenda, and you let them. You invite the distraction. That is not a failure of focus. That is the job as you understand it, and you are right more often than the people who think otherwise.',
        'Warmth in how you write. You soften things. You ask how somebody is before you ask what you called about.'] },
      gift: { lead: 'Nobody leaves a Bus.', body: [
        'That is the plainest way to say it. Retention on your team is better than it should be given everything else, and it is because people feel known.',
        'You know what is going on with people long before it becomes anybody’s formal problem. The resignation that surprises everyone else does not surprise you, because you saw it three weeks ago and had a conversation about it.',
        'You build the trust that everything else stands on. A team that trusts its leader will do hard things. A team that does not will do only what it is told, exactly.'] },
      underPressure: { lead: 'You absorb.', body: [
        'You take the hit rather than pass it down. You protect your team from information they may actually have needed. And you go quiet when something needs saying.',
        'Here is the difficult truth about your pressure pattern: it looks like kindness and it functions like avoidance.',
        'The conversation you did not have because the timing was not right is a standard you have now set. The underperformance you carried yourself is a message the rest of the team received clearly. And the person you were protecting from a hard conversation is the person who did not get the chance to fix it.',
        'Nobody experiences you as a coward. Everybody experiences the consequence.'] },
      needFromOthers: { lead: 'Relationship first, task second.', body: [
        'A Bus who does not know where they stand with you will read every neutral message as a problem. Two minutes of human contact before the ask is not a courtesy with you. It is the thing that makes the ask land.'] },
      drivesYouMad: { lead: null, body: [
        'Being treated as a resource. Decisions made without regard for what they will cost the people who have to absorb them. Somebody being written off before anyone tried.',
        'Speed for its own sake.'] },
      workOn: { lead: 'Say the thing.', body: [
        'Not harder. Not colder. Earlier.',
        'The version of the conversation you have at week two is kind. The version you have at week ten, after it has become a problem, is not, however gently you phrase it.',
        'Your instinct to protect people is right. Aim it at the person who needs to hear the truth while there is still time to act on it.'] }
    },

    JET: {
      position: 'Fast pace · People priority',
      howYouMove: { lead: 'Fast, and around things.', body: [
        'Same A to B as everybody else, but you will divert around weather, re-route mid-flight, and arrive on time by a path nobody planned. The obstacle does not stop you and it barely slows you.'] },
      whatPeopleNotice: { lead: null, body: [
        'You read the room before you speak. You change register depending on who is in front of you, and it is not performance. It is calibration. The message stays the same and the delivery changes.',
        'You are usually the first to notice a meeting has gone wrong, often before anybody says so.',
        'You move quickly and people come with you, which is a rarer combination than it sounds. Most fast leaders leave people behind. You do not.'] },
      gift: { lead: 'Agility with people.', body: [
        'You get a difficult message across because you worked out how that specific person needed to hear it. Somebody else delivers the same message and it lands as an attack. You deliver it and it lands as help.',
        'You are often the bridge. Between a Rocket and everyone else. Between the plan and the reality. Between what leadership said and what the team can actually hear.',
        'And when things change suddenly, you are already moving. No grieving the old plan, no needing it explained twice.'] },
      underPressure: { lead: 'You over-promise.', body: [
        'Speed plus wanting people to be alright produces commitments that cannot all be kept. You say yes to two incompatible things and you believe both at the time you say them. That is the specific trap: you are not being dishonest, you are being optimistic at speed.',
        'Your other pressure move is abandoning the plan. You flex naturally, so under pressure you flex more, and at some point adapting becomes improvising. Your team stops being able to predict what happens next.',
        'And this is what people mean when they say a Jet is hard to pin down. Everything you said was true when you said it. That is not much comfort to somebody holding the third version of the plan.'] },
      needFromOthers: { lead: 'Room to move, and a straight answer about what actually matters.', body: [
        'Give a Jet three equal priorities and they will optimise for whoever asked most recently. Tell a Jet which one is genuinely first and they will protect it while flexing everything around it.'] },
      drivesYouMad: { lead: null, body: [
        'Rigidity for its own sake. Being made to follow a route that is plainly worse than the alternative because the route was agreed in advance.',
        'People who cannot move.'] },
      workOn: { lead: 'Write down what you committed to.', body: [
        'Not for anyone else. For you.',
        'Your problem is not that you break promises. It is that you make more of them than any person could keep, at speed, in good faith, and you lose track of the total.',
        'A list turns that from a character question into an arithmetic one.'] }
    },

    ROCKET: {
      position: 'Fast pace · Task priority',
      howYouMove: { lead: 'Straight up, at speed.', body: [
        'Buckle in, we are not stopping. Show me the baby, I do not need the labour pains. From the ground to where you are going with nothing in between and no interest in the scenery.'] },
      whatPeopleNotice: { lead: null, body: [
        'A stark office. Minimalist, or just empty. You communicate in bullets.',
        'You read the first line of an email, jump to the last, and only go back to the middle if the two do not add up. That is not carelessness. It is triage, and you are usually right about what matters.',
        'Time is the resource you protect most fiercely, and you can tell within about ninety seconds whether a meeting is going to be worth its length.'] },
      gift: { lead: 'In a genuine crisis, everybody wants a Rocket in charge.', body: [
        'That is not a small thing. When it is going badly wrong, decisions get made, the team gets clarity, and nobody stands around waiting to be told what to do. Everyone else is still working out who should decide. You have decided.',
        'And you will say the uncomfortable thing out loud while everyone else is deciding whether to. Teams without a Rocket have problems that everybody knows about and nobody names. Teams with one do not.',
        'You also protect your team’s time, which they may never thank you for and which matters more than they know.'] },
      underPressure: { lead: 'You run people over.', body: [
        'Speed becomes the only value. Consultation gets cut because it is slow, and you decide alone because deciding alone is faster. Things get done, and people leave.',
        'Here is the part that is hard: you often do not connect those two facts. The delivery was excellent. The attrition looks like a separate problem, or a people problem, or somebody else’s problem.',
        'Your other pressure move is expecting the same intensity from everyone. You can run at that speed. You have built a career on being able to. It does not follow that the person in front of you can, and under pressure you stop checking.'] },
      needFromOthers: { lead: 'The headline first.', body: [
        'A Rocket given a three-minute preamble stopped listening at minute one. Lead with the ask, follow with the reasoning, and you will get a better answer faster than anybody else could have given you.'] },
      drivesYouMad: { lead: null, body: [
        'Meetings that could have been decisions. Being asked to explain something twice. Waiting for a consensus that was never going to arrive.',
        'People who confuse discussing a thing with doing it.'] },
      workOn: { lead: 'Ask one question before you decide.', body: [
        'Not a consultation. Not a workshop. One question, to one person who will be affected.',
        'It costs you about ninety seconds and it buys you two things: information you did not have, and a person who now believes they were part of it rather than subject to it.',
        'You will not be slower. You will be less alone.'] }
    }
  };

  /* ----------------------------------------------------------------- *
   * PART SIX — the twelve pairings, keyed [you][other].
   * ----------------------------------------------------------------- */
  var PAIRINGS = {
    ROCKET: {
      TRACTOR: { needs: 'Context, and time between the context and the decision. They are not being difficult when they ask questions. They are trying to do it properly.', wrong: 'You bring them a decision that needs making now. They freeze, or they agree and quietly do not do it. You read that as resistance. It was ambush.', adjustment: 'Give them the context Monday and the decision Wednesday.' },
      BUS: { needs: 'Two minutes of human contact before the ask. Not a courtesy with them. It is the thing that makes the ask land.', wrong: 'You lead with the task every time. They read your neutrality as displeasure and start managing a relationship problem that does not exist.', adjustment: 'Ask how they are before you ask what you called about. Mean it.' },
      JET: { needs: 'To know which priority is genuinely first.', wrong: 'You give them three things and assume they will work out the order. They optimise for whoever asked last, and you find out later.', adjustment: 'Say which one is first. Out loud, in those words.' }
    },
    TRACTOR: {
      ROCKET: { needs: 'The answer first, reasoning underneath.', wrong: 'You build to the conclusion. They stopped listening in the first thirty seconds and made their own decision about what you wanted.', adjustment: 'Lead with the ask. Put your working below it, where they can find it if they want it.' },
      BUS: { needs: 'To know what you are thinking while you are thinking it.', wrong: 'You go quiet while you work something through. They fill the silence with a worse story than the truth.', adjustment: 'Narrate the middle. "Still working on it, nothing is wrong, I will have it Thursday."' },
      JET: { needs: 'The destination, not the route.', wrong: 'You specify the method as well as the outcome. They experience that as being tied down for no reason, and they will go around it.', adjustment: 'Tell them where you need to get to and let them find the way.' }
    },
    BUS: {
      ROCKET: { needs: 'The ask in the first sentence.', wrong: 'You warm up first. They are waiting for the point and getting impatient, which is not about you.', adjustment: 'Ask first. You can be warm in sentence two.' },
      TRACTOR: { needs: 'Detail, written down.', wrong: 'You give them the gist in a conversation and think it landed. They cannot start without specifics and will not always tell you that.', adjustment: 'Follow the conversation with something written.' },
      JET: { needs: 'To be pinned down on what they actually committed to.', wrong: 'You take their enthusiasm as agreement. They meant it. They also meant three other things.', adjustment: 'End with "so what are you actually taking?" and write down what they say.' }
    },
    JET: {
      ROCKET: { needs: 'You to say it plainly.', wrong: 'You adapt your delivery to make it land softly. They hear hedging and assume you are not sure.', adjustment: 'Do not reframe it. Say the thing.' },
      TRACTOR: { needs: 'One version of the plan, held still.', wrong: 'You adjust as you go, which is your strength. They cannot build on something that keeps moving and they stop investing in any version.', adjustment: 'Lock one part and tell them explicitly which part is locked.' },
      BUS: { needs: 'To be asked before you commit them.', wrong: 'You say yes on their behalf because you could see it working. They find out afterwards and it costs you more trust than the favour was worth.', adjustment: 'Check first. Every time.' }
    }
  };

  var content = { COPY: COPY, PROFILES: PROFILES, PAIRINGS: PAIRINGS };
  if (typeof module !== 'undefined' && module.exports) module.exports = content;
  root.TLI = root.TLI || {};
  root.TLI.content = content;
})(typeof window !== 'undefined' ? window : this);
