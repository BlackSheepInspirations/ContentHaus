/**
 * The AI Creator's Brand Haus — Brand DNA Blueprint scoring engine
 * Depends on nothing else (pure data + scoring logic) — no renderPanel
 * yet, since the Founder Interview presentation UI is still undecided
 * (see docs/brand-dna-working-canon.md). This file is the numeric
 * implementation of docs/brand-dna-framework.md and
 * docs/brand-dna-assessment-questions.md — every weight below should
 * trace back to those docs; nothing here invents a new rule.
 *
 * Tension sign convention: for "A ↔ B", negative = A, positive = B.
 * Order: warmthAuthority, freedomPurpose, traditionInnovation,
 * communityRecognition, structureExpression, calmEnergy,
 * accessibilityLuxury, playfulnessSophistication.
 *
 * Founder DNA is non-bipolar (0..3 per dimension, independent axes).
 */
(function (root) {
  "use strict";

  var TENSION_KEYS = [
    "warmthAuthority", "freedomPurpose", "traditionInnovation", "communityRecognition",
    "structureExpression", "calmEnergy", "accessibilityLuxury", "playfulnessSophistication",
  ];

  var FOUNDER_DNA_KEYS = [
    "purpose", "legacy", "belonging", "freedom", "recognition", "creativity",
    "security", "excellence", "impact", "stewardship", "growth", "service",
  ];

  // Layer Four — Customer Impression™. Founder DNA and Brand Tensions
  // both measure the founder; this measures how the founder wants the
  // CUSTOMER to experience the brand (self-image, social reflection,
  // relationship role, and competitive differentiation) — the gap
  // identified against Kapferer's Relationship/Reflection/Self-Image
  // facets. Each dimension is a small closed set of categorical labels
  // (not a bipolar tension, not an open-ended magnitude) — every answer
  // casts a weighted vote for one label, and the highest-voted label per
  // dimension is the result, same "top pick" pattern as topFounderDNA.
  var CUSTOMER_IMPRESSION_DIMENSIONS = {
    selfImage: ["capable", "understood", "bold", "refined", "grounded"],
    reflection: ["insider", "accomplished", "bold", "tasteful", "connected"],
    relationship: ["mentor", "companion", "authority", "indulgence", "utility"],
    differentiation: ["people", "story", "pointOfView", "standard", "community"],
  };

  // Shared across every profile (unlike PROFILES/FOUNDER_DNA_LIBRARY,
  // which are per-archetype) — a founder's Customer Impression result is
  // 4 labels picked from small closed sets, so the same 20 descriptions
  // apply to any founder who lands on a given label, regardless of which
  // of the 11 profiles they matched. Order matters here: it's the fixed
  // presentation order for the Blueprint chapter.
  var CUSTOMER_IMPRESSION_LIBRARY = {
    relationship: {
      label: "Your Brand's Relationship Style",
      options: {
        mentor: "You're the trusted guide who's seen it all — customers come to you for direction, not just delivery.",
        companion: "You're the steady presence who always shows up — customers come to you the way they'd call a friend.",
        authority: "You're the expert customers hire because they don't want to do it themselves — they come to you for competence, not company.",
        indulgence: "You're the reward customers save up for — they come to you to treat themselves, not just solve a problem.",
        utility: "You're the tool customers reach for without a second thought — they come to you because it simply works, every time.",
      },
    },
    selfImage: {
      label: "How Customers Feel About Themselves With You",
      options: {
        capable: "Your customers walk away believing they can handle more than they thought — you make people feel equipped, not dependent.",
        understood: "Your customers feel like someone finally gets them — like they've been seen, not just sold to.",
        bold: "Your customers feel like they took a real risk, and it paid off — you make people feel braver than they were before.",
        refined: "Your customers feel like they have great taste — being associated with you says something good about their judgment.",
        grounded: "Your customers feel more like themselves, not less — you help people feel settled in who they already are.",
      },
    },
    reflection: {
      label: "Who Your Brand Makes Customers Look Like",
      options: {
        insider: "People assume your customers know something the rest of us don't — you make them look a step ahead.",
        accomplished: "People assume your customers have their life together — you make them look put-together and capable.",
        bold: "People assume your customers aren't afraid to stand out — you make them look like they lead, not follow.",
        tasteful: "People assume your customers have impeccable taste — you make them look like they know quality when they see it.",
        connected: "People assume your customers are part of something bigger than themselves — you make them look like they belong to a community worth joining.",
      },
    },
    differentiation: {
      label: "Your Differentiation Edge",
      options: {
        people: "What can't be copied is how you treat people — the way someone feels dealing with you is the actual product.",
        story: "What can't be copied is why you started — the belief behind the brand is yours alone.",
        pointOfView: "What can't be copied is your taste — the specific point of view you bring is what makes it recognizably yours.",
        standard: "What can't be copied is the bar you hold yourselves to — competitors can match the product, not the standard behind it.",
        community: "What can't be copied is the community you've built — relationships take time nobody can shortcut.",
      },
    },
  };

  // Resolves a founder's { selfImage, reflection, relationship,
  // differentiation } label picks into the display copy for the
  // Blueprint's Customer Impression chapter, in library-defined order.
  function describeCustomerImpression(customerImpression) {
    return Object.keys(CUSTOMER_IMPRESSION_LIBRARY).map(function (dim) {
      var entry = CUSTOMER_IMPRESSION_LIBRARY[dim];
      var label = customerImpression[dim];
      return { dimension: dim, chapterLabel: entry.label, resultLabel: label, description: entry.options[label] || "" };
    });
  }

  // Display labels for each tension's two poles — negative pole first,
  // matching the sign convention above (A = negative, B = positive).
  var TENSION_LABELS = {
    warmthAuthority: { negative: "Warmth", positive: "Authority" },
    freedomPurpose: { negative: "Freedom", positive: "Purpose" },
    traditionInnovation: { negative: "Tradition", positive: "Innovation" },
    communityRecognition: { negative: "Community", positive: "Recognition" },
    structureExpression: { negative: "Structure", positive: "Expression" },
    calmEnergy: { negative: "Calm", positive: "Energy" },
    accessibilityLuxury: { negative: "Accessibility", positive: "Luxury" },
    playfulnessSophistication: { negative: "Playfulness", positive: "Sophistication" },
  };

  // Groups the 12 independent Founder DNA dimensions into 4 human-
  // readable clusters for display — presentation only, doesn't change
  // scoring or normalization.
  var FOUNDER_DNA_CLUSTERS = [
    { label: "Purpose Cluster", keys: ["purpose", "impact", "legacy"] },
    { label: "People Cluster", keys: ["belonging", "service", "stewardship"] },
    { label: "Growth Cluster", keys: ["freedom", "creativity", "growth"] },
    { label: "Leadership Cluster", keys: ["excellence", "recognition", "security"] },
  ];

  // Brand Playbook™ Chapter 3 content — shared across every founder (a
  // tension pole means the same thing regardless of which archetype it
  // belongs to), so this is 8 tensions x 2 poles, not x11 profiles. The
  // "why you landed here" personalization comes from tensionContributors()
  // tracing actual answers, not from this table — this only covers what a
  // position on the spectrum generally means, once you know which side.
  var TENSION_PLAYBOOK = {
    warmthAuthority: {
      negative: {
        whatItMeans: "You lead with approachability — people feel like they can talk to you, not just buy from you.",
        strengths: "You build trust fast because people never feel talked down to.",
        blindSpots: "You can undersell your own expertise trying to stay relatable.",
        businessImplications: "Warmth-led brands often win on retention and referrals more than on premium pricing.",
        growthAdvice: "Let your expertise show through specifics, not credentials — the goal is trusted, not soft.",
      },
      positive: {
        whatItMeans: "You lead with confidence and expertise — people come to you because you clearly know what you're doing.",
        strengths: "You make decisions easy for people who don't want to think too hard.",
        blindSpots: "You can read as distant or unapproachable if warmth doesn't show up somewhere too.",
        businessImplications: "Authority-led brands can command premium pricing but need proof points to back the confidence.",
        growthAdvice: "Show your work occasionally — a founder who explains their thinking builds authority that lasts longer than one who just asserts it.",
      },
    },
    freedomPurpose: {
      negative: {
        whatItMeans: "You're driven by autonomy and creative independence more than a single fixed mission.",
        strengths: "You adapt fast and rarely get boxed in by \"that's not how we do things.\"",
        blindSpots: "Without a clear throughline, your brand can feel scattered to people watching from outside.",
        businessImplications: "Freedom-led founders often build multiple revenue streams before they build one deep moat.",
        growthAdvice: "Pick one thread that stays true across everything you make — it doesn't have to limit you, it just has to be findable.",
      },
      positive: {
        whatItMeans: "You're driven by a mission bigger than any single product or sale.",
        strengths: "You inspire loyalty because people feel like they're part of something, not just buying something.",
        blindSpots: "You can chase meaning over margin, saying yes to purpose-aligned work that doesn't actually pay.",
        businessImplications: "Purpose-led brands convert skeptics into advocates faster, but need discipline to stay financially sound.",
        growthAdvice: "Let your mission set the direction, but let real numbers set the pace.",
      },
    },
    traditionInnovation: {
      negative: {
        whatItMeans: "You value what's proven — craft, consistency, and doing things the way that's earned trust for years.",
        strengths: "People trust you because you don't chase every trend that walks by.",
        blindSpots: "You can hold onto \"the way we've always done it\" past the point it's still working.",
        businessImplications: "Tradition-led brands build long customer lifetimes but can miss early-mover advantages.",
        growthAdvice: "Protect what's timeless about your brand, but audit once a year for what's just habit.",
      },
      positive: {
        whatItMeans: "You're pulled toward what's next — new tools, new formats, new ways of solving the same old problem.",
        strengths: "You spot opportunities before your competitors even notice the shift happened.",
        blindSpots: "You can outrun your own consistency, changing direction before an idea's had time to prove itself.",
        businessImplications: "Innovation-led brands win early attention but need to protect their core identity as they experiment.",
        growthAdvice: "Give a new idea a real runway before judging it — momentum takes longer to build than it takes to notice.",
      },
    },
    communityRecognition: {
      negative: {
        whatItMeans: "You measure success by the relationships and belonging you create, not by standing out from the group.",
        strengths: "You build the kind of loyalty that doesn't need a discount code to stick around.",
        blindSpots: "You can avoid taking credit for what you've built, letting the community's story overshadow your own.",
        businessImplications: "Community-led brands grow through referral and shared identity more than through advertising.",
        growthAdvice: "Let yourself be visible as the person who built the room — the community doesn't shrink when you step forward.",
      },
      positive: {
        whatItMeans: "You're motivated by being seen and known for what you do — status and standing matter to you.",
        strengths: "You're a natural at building a personal brand people remember.",
        blindSpots: "You can chase visibility in ways that don't actually build the business underneath it.",
        businessImplications: "Recognition-led brands often monetize personal authority faster than product alone.",
        growthAdvice: "Make sure what you're known for is also what you're building — recognition without substance fades fast.",
      },
    },
    structureExpression: {
      negative: {
        whatItMeans: "You bring order, systems, and reliability — your brand feels considered, not chaotic.",
        strengths: "People trust you to deliver the same quality every single time.",
        blindSpots: "You can over-engineer things that would've worked fine loose and simple.",
        businessImplications: "Structure-led brands scale operations more easily but can feel rigid to more expressive customers.",
        growthAdvice: "Build in a little room for spontaneity — not every decision needs a system behind it.",
      },
      positive: {
        whatItMeans: "You lead with personality and creative freedom — your brand feels alive, not templated.",
        strengths: "You create work that's instantly recognizable as yours, not swappable with a competitor's.",
        blindSpots: "You can sacrifice consistency for the sake of a good idea in the moment.",
        businessImplications: "Expression-led brands stand out fast but need just enough structure to scale without losing themselves.",
        growthAdvice: "Write down the 2-3 things that never change, no matter how creative the execution gets.",
      },
    },
    calmEnergy: {
      negative: {
        whatItMeans: "You bring steadiness — your brand feels like a deep breath, not a rush.",
        strengths: "People come to you when they're overwhelmed, because you don't add to the noise.",
        blindSpots: "You can read as low-energy or passive if calm isn't paired with visible momentum.",
        businessImplications: "Calm-led brands earn trust slowly but retain it longer, since the promise rarely overpromises.",
        growthAdvice: "Show progress, even quietly — calm doesn't have to mean invisible.",
      },
      positive: {
        whatItMeans: "You bring momentum — your brand feels fast-moving, exciting, and hard to ignore.",
        strengths: "You create urgency and excitement that pulls people in without much convincing.",
        blindSpots: "You can burn out your own audience — or yourself — if the pace never lets up.",
        businessImplications: "Energy-led brands convert attention quickly but need consistency to convert that into loyalty.",
        growthAdvice: "Build in deliberate pauses — the contrast is what makes the energy land.",
      },
    },
    accessibilityLuxury: {
      negative: {
        whatItMeans: "You want your brand to feel reachable — no gatekeeping, no pretense, open to whoever needs it.",
        strengths: "You remove friction that keeps other brands from actually connecting with people.",
        blindSpots: "You can underprice yourself trying to stay \"for everyone.\"",
        businessImplications: "Accessibility-led brands build wide reach but need a real plan to protect margin.",
        growthAdvice: "Being accessible and being cheap aren't the same thing — price for the value, not just the welcome.",
      },
      positive: {
        whatItMeans: "You want your brand to feel elevated — considered, exclusive, worth the wait or the price.",
        strengths: "You create desire, not just demand — people want to be part of what you've built.",
        blindSpots: "You can drift into feeling unreachable or intimidating if you're not careful with tone.",
        businessImplications: "Luxury-led brands command higher margins but need fewer, deeper relationships to sustain them.",
        growthAdvice: "Elevated doesn't have to mean cold — warmth is what turns luxury into loyalty.",
      },
    },
    playfulnessSophistication: {
      negative: {
        whatItMeans: "You want your brand to feel fun and human — humor and lightness are a feature, not a distraction.",
        strengths: "You make people smile in categories that are usually pretty forgettable.",
        blindSpots: "You can undersell how seriously good your actual work is by leading with the jokes.",
        businessImplications: "Playful brands build fast emotional connection but need to prove substance behind the fun.",
        growthAdvice: "Let the playfulness be the delivery, not the whole message — say something real underneath it.",
      },
      positive: {
        whatItMeans: "You want your brand to feel polished and refined — every detail considered, nothing left casual.",
        strengths: "You create a sense of quality before anyone even reads your copy.",
        blindSpots: "You can feel unapproachable or overly serious if there's no warmth to balance the polish.",
        businessImplications: "Sophisticated brands justify premium pricing but need to work harder to feel human.",
        growthAdvice: "Find one place to let your guard down — a little imperfection makes polish feel earned, not performed.",
      },
    },
  };

  // Brand Playbook™ Chapter 4 content — one entry per cluster (not per
  // profile or per dimension); which cluster is "yours" is decided at
  // render time by ranking the founder's actual cluster totals, same
  // pattern as topFounderDNA.
  var CLUSTER_PLAYBOOK = {
    "Purpose Cluster": {
      interpretation: "This cluster measures how much you're driven by meaning — the difference you make, the impact that outlasts you, and the reason the work matters beyond the transaction.",
      decisionImpact: "When this cluster is strong, you'll instinctively choose the option that serves the mission over the one that's just easiest or most profitable in the short term.",
      customerImpact: "Customers drawn to purpose-led brands stay because they feel like they're contributing to something, not just consuming it.",
      leadershipImpact: "You lead best when your team understands the \"why,\" not just the task list — purpose is your management tool.",
      futureGrowth: "As you grow, protect the mission in writing — it's the thing new hires and new customers need to feel just as strongly as you do.",
    },
    "People Cluster": {
      interpretation: "This cluster measures how much you're driven by relationships — the people you serve, the community you build, and the responsibility you feel toward both.",
      decisionImpact: "When this cluster is strong, you'll weigh how a decision affects the people around you before you weigh how it affects the bottom line.",
      customerImpact: "Customers feel genuinely cared for, not managed — this is often what turns a customer into an advocate.",
      leadershipImpact: "You lead by example and by presence — your team trusts you because you show up for them the same way you show up for customers.",
      futureGrowth: "As you grow, build systems that protect this care at scale — the risk isn't losing the instinct, it's losing the bandwidth to act on it.",
    },
    "Growth Cluster": {
      interpretation: "This cluster measures how much you're driven by expansion — new ideas, new freedom, and the momentum of becoming something bigger than you are today.",
      decisionImpact: "When this cluster is strong, you'll choose the option that opens more doors over the one that just closes out the current task efficiently.",
      customerImpact: "Customers are drawn to the sense of momentum and possibility your brand carries — they want to grow alongside you.",
      leadershipImpact: "You lead by inspiring bigger thinking, but your team may need you to also provide the structure that turns big ideas into finished work.",
      futureGrowth: "As you grow, resist the urge to chase every new opportunity — the strongest growth comes from a few ideas done all the way through.",
    },
    "Leadership Cluster": {
      interpretation: "This cluster measures how much you're driven by standards — the quality bar you hold, the credibility you build, and the stability you protect.",
      decisionImpact: "When this cluster is strong, you'll choose the option that protects quality and reputation over the one that's just faster.",
      customerImpact: "Customers trust you because you clearly hold yourself to a standard — that trust is often what justifies your pricing.",
      leadershipImpact: "You lead by setting the bar high and expecting your team to meet it — just be sure the bar is communicated, not just assumed.",
      futureGrowth: "As you grow, document the standard so it survives beyond you — the goal is a reputation the business holds, not just the founder.",
    },
  };

  // ---------------------------------------------------------------------
  // The 21 Questions — one entry per option, weights per docs/brand-dna-
  // assessment-questions.md's per-question "Measures" tags.
  // ---------------------------------------------------------------------
  var QUESTIONS = [
    { id: 1, options: {
      A: { tensions: { accessibilityLuxury: 2, structureExpression: -2 }, expression: { mood: "minimalist and clean", colorFamily: "neutral/monochrome" } },
      B: { tensions: { warmthAuthority: -2, traditionInnovation: -2 }, expression: { mood: "warm and cozy", colorFamily: "warm earthy neutrals" } },
      C: { tensions: { playfulnessSophistication: -2, calmEnergy: 2 }, expression: { mood: "playful and fun", colorFamily: "bright, punchy" } },
      D: { tensions: { warmthAuthority: 2, structureExpression: -2 }, expression: { mood: "minimalist and clean", colorFamily: "black/white + bold accent" } },
    } },
    { id: 2, options: {
      A: { founderDNA: { purpose: 3, service: 2 }, tensions: { communityRecognition: -2 } },
      B: { founderDNA: { creativity: 3, legacy: 1 }, tensions: { traditionInnovation: 2 } },
      C: { founderDNA: { belonging: 3, service: 1 }, tensions: { communityRecognition: -3 } },
      D: { founderDNA: { excellence: 3, stewardship: 1 }, tensions: { accessibilityLuxury: 2 } },
      E: { founderDNA: { impact: 3, purpose: 2 } },
    } },
    { id: 3, options: {
      A: { expression: { colorFamily: "jewel tones", mood: "elegant and luxurious" }, tensions: { accessibilityLuxury: 2 } },
      B: { expression: { colorFamily: "warm earthy neutrals", mood: "warm and cozy" }, tensions: { traditionInnovation: -1 } },
      C: { expression: { colorFamily: "bright, punchy", mood: "playful and fun" }, tensions: { playfulnessSophistication: -2 } },
      D: { expression: { colorFamily: "black/white + bold accent", mood: "bold and vibrant" }, tensions: { warmthAuthority: 1 } },
    } },
    { id: 4, options: {
      A: { founderDNA: { purpose: 3 } },
      B: { founderDNA: { purpose: 1, security: 1 } },
      C: { founderDNA: { creativity: 3, freedom: 2 } },
      D: { founderDNA: { freedom: 3 } },
    } },
    { id: 5, options: {
      A: { expression: { photography: "bright, candid, energetic" }, tensions: { calmEnergy: 2, playfulnessSophistication: -1 } },
      B: { expression: { photography: "soft, warm natural light" }, tensions: { warmthAuthority: -2 } },
      C: { expression: { photography: "moody, high-contrast, dramatic" }, tensions: { warmthAuthority: 2, accessibilityLuxury: 1 } },
      D: { expression: { photography: "clean, symmetrical, minimal" }, tensions: { structureExpression: -2, accessibilityLuxury: 1 } },
    } },
    { id: 6, options: {
      A: { founderDNA: { purpose: 3, impact: 2 }, tensions: { communityRecognition: -1 } },
      B: { founderDNA: { excellence: 2, recognition: 2 }, tensions: { communityRecognition: 2 } },
      C: { founderDNA: { security: 2, service: 1 }, tensions: { warmthAuthority: -2 } },
      D: { founderDNA: { excellence: 2 }, tensions: { accessibilityLuxury: 2 } },
      E: { founderDNA: { service: 3, belonging: 1 }, tensions: { warmthAuthority: -2, communityRecognition: -1 } },
    } },
    { id: 7, options: {
      A: { tensions: { calmEnergy: -3, traditionInnovation: -1 } },
      B: { tensions: { calmEnergy: 3 } },
      C: { tensions: { structureExpression: -2 } },
      D: { tensions: { playfulnessSophistication: -2, calmEnergy: 1 } },
    } },
    { id: 8, options: {
      A: { founderDNA: { legacy: 3 } },
      B: { founderDNA: { service: 2, belonging: 2 }, tensions: { warmthAuthority: -1 } },
      C: { founderDNA: { growth: 3, purpose: 1 } },
      D: { founderDNA: { recognition: 2, creativity: 1 }, tensions: { traditionInnovation: 2 } },
      E: { founderDNA: { purpose: 2, security: 1 } },
    } },
    { id: 9, options: {
      A: { expression: { voice: "warm and approachable" }, tensions: { warmthAuthority: -2 } },
      B: { expression: { voice: "authoritative and expert" }, tensions: { warmthAuthority: 2 } },
      C: { expression: { voice: "playful and quirky" }, tensions: { playfulnessSophistication: -2 } },
      D: { expression: { voice: "sophisticated and refined" }, tensions: { accessibilityLuxury: 2, playfulnessSophistication: 2 } },
    } },
    { id: 10, options: {
      A: { founderDNA: { purpose: 2, service: 2 }, tensions: { warmthAuthority: -1 } },
      B: { founderDNA: { impact: 2, service: 1 } },
      C: { founderDNA: { creativity: 2, legacy: 1 }, tensions: { traditionInnovation: 2 } },
      D: { founderDNA: { legacy: 3 } },
      E: { founderDNA: { purpose: 1, security: 1 }, tensions: { traditionInnovation: -1 } },
    } },
    { id: 11, options: {
      A: { tensions: { traditionInnovation: -3 }, founderDNA: { stewardship: 1 } },
      B: { tensions: { traditionInnovation: 3 }, founderDNA: { creativity: 2 } },
      C: { tensions: { structureExpression: -2, traditionInnovation: -1 } },
      D: { tensions: { playfulnessSophistication: -1, structureExpression: 2 } },
    } },
    { id: 12, options: {
      A: { founderDNA: { belonging: 2, service: 1 }, tensions: { warmthAuthority: -2 } },
      B: { founderDNA: { creativity: 2, impact: 1 }, tensions: { traditionInnovation: 2 } },
      C: { founderDNA: { excellence: 2 }, tensions: { accessibilityLuxury: 2 } },
      D: { founderDNA: { service: 2, belonging: 1 }, tensions: { communityRecognition: -1 } },
      E: { founderDNA: { creativity: 1, growth: 1 }, tensions: { calmEnergy: 2 } },
    } },
    { id: 13, options: {
      A: { expression: { mood: "classic" }, tensions: { traditionInnovation: -2 } },
      B: { expression: { mood: "modern and edgy" }, tensions: { traditionInnovation: 2 } },
      C: { expression: { mood: "warm and cozy" }, tensions: { warmthAuthority: -2 } },
      D: { expression: { mood: "elegant and luxurious" }, tensions: { accessibilityLuxury: 2 } },
    } },
    { id: 14, options: {
      A: { founderDNA: { freedom: 2, growth: 1 } },
      B: { founderDNA: { recognition: 2, creativity: 1 }, tensions: { communityRecognition: 2 } },
      C: { founderDNA: { impact: 3, purpose: 1 } },
      D: { founderDNA: { service: 2, belonging: 1 }, tensions: { warmthAuthority: -1 } },
      E: { founderDNA: { growth: 3 } },
    } },
    { id: 15, options: {
      A: { tensions: { communityRecognition: 3 } },
      B: { tensions: { communityRecognition: -3 } },
      C: { founderDNA: { purpose: 2, freedom: 1 } },
      D: { tensions: { accessibilityLuxury: 1, communityRecognition: 1 } },
    } },
    { id: 16, options: {
      A: { founderDNA: { freedom: 3 } },
      B: { founderDNA: { service: 3, purpose: 1 } },
      C: { founderDNA: { legacy: 2, security: 1 } },
      D: { founderDNA: { excellence: 3, recognition: 2 } },
      E: { founderDNA: { impact: 3, purpose: 2 } },
    } },
    { id: 17, options: {
      A: { expression: { mood: "warm and cozy" }, tensions: { calmEnergy: -2, traditionInnovation: -1 } },
      B: { expression: { mood: "playful and fun" }, tensions: { calmEnergy: 2, playfulnessSophistication: -2 } },
      C: { expression: { mood: "bold and vibrant" }, tensions: { accessibilityLuxury: 2, warmthAuthority: 1 } },
      D: { expression: { mood: "elegant and luxurious" }, tensions: { accessibilityLuxury: 2, traditionInnovation: -1 } },
    } },
    { id: 18, options: {
      A: { founderDNA: { purpose: 3 }, tensions: { traditionInnovation: -1 } },
      B: { founderDNA: { creativity: 2, freedom: 1 } },
      C: { founderDNA: { impact: 2, security: 1 } },
      D: { founderDNA: { security: 2 } },
      E: { founderDNA: { purpose: 2, growth: 1 } },
    } },
    { id: 19, options: {
      A: { tensions: { calmEnergy: -2, structureExpression: -1 } },
      B: { tensions: { calmEnergy: 3 } },
      C: { tensions: { structureExpression: -2 } },
      D: { tensions: { warmthAuthority: -2 }, founderDNA: { belonging: 1 } },
    } },
    { id: 20, options: {
      A: { tensions: { traditionInnovation: -2 }, founderDNA: { legacy: 2 } },
      B: { tensions: { warmthAuthority: -2, communityRecognition: -1 }, founderDNA: { belonging: 2 } },
      C: { tensions: { communityRecognition: 2, warmthAuthority: 1 }, founderDNA: { legacy: 2, recognition: 1 } },
      D: { tensions: { accessibilityLuxury: 3 }, founderDNA: { excellence: 1 } },
    } },
    { id: 21, options: {
      A: { customerImpression: { selfImage: "capable" } },
      B: { customerImpression: { selfImage: "understood" } },
      C: { customerImpression: { selfImage: "bold" } },
      D: { customerImpression: { selfImage: "refined" } },
      E: { customerImpression: { selfImage: "grounded" } },
    } },
    { id: 22, options: {
      A: { customerImpression: { selfImage: "capable" } },
      B: { customerImpression: { selfImage: "grounded" } },
      C: { customerImpression: { selfImage: "bold" } },
      D: { customerImpression: { selfImage: "refined" } },
      E: { customerImpression: { selfImage: "understood" } },
    } },
    { id: 23, options: {
      A: { customerImpression: { selfImage: "capable" } },
      B: { customerImpression: { selfImage: "understood" } },
      C: { customerImpression: { selfImage: "bold" } },
      D: { customerImpression: { selfImage: "refined" } },
      E: { customerImpression: { selfImage: "grounded" } },
    } },
    { id: 24, options: {
      A: { customerImpression: { reflection: "insider" } },
      B: { customerImpression: { reflection: "accomplished" } },
      C: { customerImpression: { reflection: "bold" } },
      D: { customerImpression: { reflection: "tasteful" } },
      E: { customerImpression: { reflection: "connected" } },
    } },
    { id: 25, options: {
      A: { customerImpression: { reflection: "insider" } },
      B: { customerImpression: { reflection: "accomplished" } },
      C: { customerImpression: { reflection: "bold" } },
      D: { customerImpression: { reflection: "tasteful" } },
      E: { customerImpression: { reflection: "connected" } },
    } },
    { id: 26, options: {
      A: { customerImpression: { relationship: "mentor" } },
      B: { customerImpression: { relationship: "companion" } },
      C: { customerImpression: { relationship: "authority" } },
      D: { customerImpression: { relationship: "indulgence" } },
      E: { customerImpression: { relationship: "utility" } },
    } },
    { id: 27, options: {
      A: { customerImpression: { relationship: "mentor" } },
      B: { customerImpression: { relationship: "companion" } },
      C: { customerImpression: { relationship: "authority" } },
      D: { customerImpression: { relationship: "indulgence" } },
      E: { customerImpression: { relationship: "utility" } },
    } },
    { id: 28, options: {
      A: { customerImpression: { differentiation: "people" } },
      B: { customerImpression: { differentiation: "story" } },
      C: { customerImpression: { differentiation: "pointOfView" } },
      D: { customerImpression: { differentiation: "standard" } },
      E: { customerImpression: { differentiation: "community" } },
    } },
    { id: 29, options: {
      A: { customerImpression: { differentiation: "standard" } },
      B: { customerImpression: { differentiation: "people" } },
      C: { customerImpression: { differentiation: "pointOfView" } },
      D: { customerImpression: { differentiation: "story" } },
      E: { customerImpression: { differentiation: "community" } },
    } },
    // Q30 — the signature closing question (was Q21). Content and
    // weights unchanged; only its position moved, since this must stay
    // the last thing a founder answers, per docs/brand-dna-assessment-
    // questions.md's explicit "intentionally untouchable" note.
    { id: 30, options: {
      A: { founderDNA: { impact: 3, service: 2 }, tensions: { communityRecognition: -1 } },
      B: { founderDNA: { freedom: 2, creativity: 2 }, tensions: { traditionInnovation: 2 } },
      C: { founderDNA: { belonging: 3, service: 1 }, tensions: { communityRecognition: -3 } },
      D: { founderDNA: { excellence: 3, stewardship: 2 }, tensions: { accessibilityLuxury: 1 } },
      E: { founderDNA: { purpose: 2, legacy: 2, security: 1 }, tensions: { traditionInnovation: -1 } },
    } },
  ];

  // ---------------------------------------------------------------------
  // Founder DNA fragment library — docs/brand-dna-framework.md § Founder DNA
  // ---------------------------------------------------------------------
  // Each fragment completes: "We exist to help [audience] ___." — so
  // every entry must read naturally as a benefit, not a motivation
  // stated in the founder's own voice (that framing lives in `because`
  // instead, used on the Results page's Core Values chapter).
  //
  // `values` is an array of {name, because} pairs rather than a flat
  // string list — a founder whose top dimensions land 3 values from one
  // dimension and 2 from another used to see the same "because" line
  // repeated for every value pulled from that dimension, which read as
  // generic/copy-pasted once more than one value showed up per
  // dimension. Each value now has its own distinct reason.
  var FOUNDER_DNA_LIBRARY = {
    purpose: { fragment: "find a better answer to [problem]", values: [
      { name: "Purpose", because: "because you consistently prioritized meaning over the easy or expected choice" },
      { name: "Impact", because: "because you measure success by what actually changes for someone else" },
      { name: "Integrity", because: "because you stayed true to what you said mattered, even under pressure" },
    ] },
    legacy: { fragment: "build something that outlasts today", values: [
      { name: "Legacy", because: "because you keep building things meant to outlast this moment" },
      { name: "Excellence", because: "because you choose doing it right over doing it fast" },
      { name: "Craftsmanship", because: "because you still care about the details long after most people would stop noticing" },
    ] },
    belonging: { fragment: "feel like they truly belong", values: [
      { name: "Belonging", because: "because you keep choosing connection over standing apart" },
      { name: "Community", because: "because you build things that are better with other people in them" },
      { name: "Connection", because: "because you value being truly known over just being liked" },
    ] },
    freedom: { fragment: "build on their own terms", values: [
      { name: "Freedom", because: "because you protect your independence even when it would be easier not to" },
      { name: "Autonomy", because: "because you own the outcome instead of just following the plan" },
      { name: "Authenticity", because: "because you keep choosing what's true over what's expected" },
    ] },
    recognition: { fragment: "get the recognition they've rightfully earned", values: [
      { name: "Excellence", because: "because you hold yourself to a standard most people wouldn't notice" },
      { name: "Distinction", because: "because you choose standing apart over blending in" },
      { name: "Quality", because: "because you won't let something leave your hands unfinished" },
    ] },
    creativity: { fragment: "bring bolder ideas to life", values: [
      { name: "Creativity", because: "because you keep reaching for ideas nobody else was brave enough to try" },
      { name: "Originality", because: "because you keep reaching past the obvious answer when it would've been easier to settle" },
      { name: "Innovation", because: "because you keep chasing what hasn't been done yet instead of what's already safe" },
    ] },
    security: { fragment: "count on something steady and dependable", values: [
      { name: "Trust", because: "because you build things people can count on, every time" },
      { name: "Reliability", because: "because you show up the same way whether or not anyone's watching" },
      { name: "Consistency", because: "because you value being dependable over being impressive" },
    ] },
    excellence: { fragment: "experience uncompromising quality", values: [
      { name: "Excellence", because: "because you refuse to let \"good enough\" be the final answer" },
      { name: "Craftsmanship", because: "because you care about how something is made, not just that it's finished" },
      { name: "Standards", because: "because you hold the bar high even when no one would call you out for lowering it" },
    ] },
    impact: { fragment: "change what's possible for their world", values: [
      { name: "Impact", because: "because you measure success by what changes for other people" },
      { name: "Service", because: "because you serve the outcome instead of protecting your ego" },
      { name: "Purpose", because: "because you care more about mattering than performing" },
    ] },
    stewardship: { fragment: "protect what matters most for the future", values: [
      { name: "Stewardship", because: "because you think about who inherits what you're building" },
      { name: "Responsibility", because: "because you own the outcome even when you could pass it off" },
      { name: "Care", because: "because you treat what's been entrusted to you like it's actually yours to protect" },
    ] },
    growth: { fragment: "keep becoming more of who they already are", values: [
      { name: "Growth", because: "because you keep choosing to become more of who you already are" },
      { name: "Evolution", because: "because you keep outgrowing yesterday's version of yourself instead of defending it" },
      { name: "Curiosity", because: "because you keep asking what's next instead of settling for what's working" },
    ] },
    service: { fragment: "feel genuinely taken care of", values: [
      { name: "Service", because: "because you show up for people fully, not just when it's convenient" },
      { name: "Generosity", because: "because you give more than the situation technically requires" },
      { name: "Care", because: "because you treat people like they matter, not like they're transactions" },
    ] },
  };

  // ---------------------------------------------------------------------
  // Profile Library — numeric tension vectors converted from the
  // qualitative High/Mid/Low positions in docs/brand-dna-framework.md.
  // Unspecified axes are 0 (neutral).
  // ---------------------------------------------------------------------
  var PROFILES = [
    { name: "The Trusted Guide", vector: { warmthAuthority: -2.5, freedomPurpose: 2.5, traditionInnovation: 0, communityRecognition: -2.5, structureExpression: 0, calmEnergy: -1.5, accessibilityLuxury: -2.5, playfulnessSophistication: 0 },
      output: { mood: "warm and cozy", voice: "warm and approachable", colors: { primary: "#8B5E3C", secondary: "#6B8E7F", neutral: "#F5F0E6", accent: "#C97C5D", support: "#4A5D45", standOut: "#1B6E7A" }, headingFont: "Lora", bodyFont: "Georgia", values: ["Trust", "Service", "Integrity", "Community"], influenceBlurb: "Brings wisdom, warmth, and people-first energy.",
        northStar: "To be the steady hand people return to, again and again.",
        promise: "We help you feel supported, not sold to.",
        idealCustomer: "People who've been burned by hype before and are looking for someone who tells them the truth, even when it's not the easy answer.",
        strengths: ["You build trust faster than most brands earn it in years.", "You make people feel safe enough to ask for help.", "You keep showing up long after the sale is made."],
        blindSpots: ["You can undersell yourself to avoid seeming pushy.", "You may avoid bold moves that risk the relationships you've built."],
        nextSteps: ["You should write down the one promise you never break — it belongs on your About page.", "You can turn your best client story into a testimonial that leads with trust, not results.", "You'll want a simple way for people to reach you directly — accessibility is part of your brand."] } },
    { name: "The Bold Pioneer", vector: { warmthAuthority: 0, freedomPurpose: 2.5, traditionInnovation: 2.5, communityRecognition: 0, structureExpression: 2.5, calmEnergy: 2.5, accessibilityLuxury: 0, playfulnessSophistication: 0 },
      output: { mood: "bold and vibrant", voice: "confident and bold", colors: { primary: "#1A1815", secondary: "#D6336C", neutral: "#F2F0EB", accent: "#FFB703", support: "#6B6860", standOut: "#3A86FF" }, headingFont: "Bebas Neue", bodyFont: "Inter", values: ["Courage", "Innovation", "Impact"], influenceBlurb: "Adds courage, momentum, and a push toward what's next.",
        northStar: "To prove the old way wasn't the only way.",
        promise: "We help you build something the industry hasn't seen yet.",
        idealCustomer: "People who are tired of playing it safe and want a brand that moves as fast as their ambition.",
        strengths: ["You turn ideas into momentum faster than most people can plan.", "You're not afraid to be the first — or the only — one doing it this way.", "You inspire people to take risks alongside you."],
        blindSpots: ["You can move faster than the people around you can follow.", "You may skip the quiet groundwork that makes bold moves last."],
        nextSteps: ["You should name the status quo you're pushing against — it's the sharpest hook in your story.", "You can turn your boldest decision to date into your founding story.", "You'll want one steady, unglamorous system running in the background so your speed doesn't outpace your delivery."] } },
    { name: "The Cozy Craftsman", vector: { warmthAuthority: -2.5, freedomPurpose: 0, traditionInnovation: -2.5, communityRecognition: -2.5, structureExpression: 0, calmEnergy: -2.5, accessibilityLuxury: -2.5, playfulnessSophistication: 0 },
      output: { mood: "warm and cozy", voice: "warm and approachable", colors: { primary: "#8B5E3C", secondary: "#4A5D45", neutral: "#F5F0E6", accent: "#C9A84C", support: "#2E2A26", standOut: "#B33A2E" }, headingFont: "Playfair Display", bodyFont: "Georgia", values: ["Craftsmanship", "Family", "Comfort"], influenceBlurb: "Brings patience, care, and an eye for lasting quality.",
        northStar: "To make things worth keeping, the slow way.",
        promise: "We help you surround yourself with things made with care.",
        idealCustomer: "People who've stopped buying things that don't last and want to know the story behind what they own.",
        strengths: ["You put more care into the details than anyone asks you to.", "You make people feel like they're part of something handmade and honest.", "You build loyalty through consistency, not hype."],
        blindSpots: ["You can undercharge for the time your craft actually takes.", "You may resist growth that feels like it would compromise your process."],
        nextSteps: ["You should document your process — people buy the story as much as the object.", "You can name the tradition or technique you're rooted in and say so proudly.", "You'll want to protect your pricing as demand grows, not just your process."] } },
    { name: "The Elevated Icon", vector: { warmthAuthority: 2.5, freedomPurpose: 0, traditionInnovation: -2.5, communityRecognition: 2.5, structureExpression: -2.5, calmEnergy: 0, accessibilityLuxury: 2.5, playfulnessSophistication: 2.5 },
      output: { mood: "elegant and luxurious", voice: "sophisticated and refined", colors: { primary: "#1A1815", secondary: "#C9A84C", neutral: "#FAF6EF", accent: "#8B5E3C", support: "#6B6860", standOut: "#0E6E4E" }, headingFont: "Playfair Display", bodyFont: "Lora", values: ["Excellence", "Craftsmanship", "Legacy"], influenceBlurb: "Adds polish, standards, and a taste for the exceptional.",
        northStar: "To set the standard everyone else measures against.",
        promise: "We help you own something unmistakably refined.",
        idealCustomer: "People who've outgrown \"good enough\" and are willing to pay for the difference between that and exceptional.",
        strengths: ["You hold a standard of quality that's genuinely rare.", "You make refinement feel earned, not performed.", "You build a brand people aspire to, not just buy from."],
        blindSpots: ["You can come across as unreachable if warmth isn't deliberate.", "You may over-polish something that would land harder left a little rough."],
        nextSteps: ["You should define what \"excellence\" means in your own words — not the industry's.", "You can show the craftsmanship behind the polish, not just the finished result.", "You'll want at least one warm, human touchpoint so refined doesn't read as cold."] } },
    { name: "The Free Spirit", vector: { warmthAuthority: 0, freedomPurpose: -2.5, traditionInnovation: 0, communityRecognition: 0, structureExpression: 2.5, calmEnergy: 1.5, accessibilityLuxury: -2.5, playfulnessSophistication: -2.5 },
      output: { mood: "boho and eclectic", voice: "playful and quirky", colors: { primary: "#E07A5F", secondary: "#3D405B", neutral: "#F2CC8F", accent: "#6B8E7F", support: "#F5F0E6", standOut: "#2EC4B6" }, headingFont: "Pacifico", bodyFont: "Poppins", values: ["Freedom", "Creativity", "Authenticity"], influenceBlurb: "Adds creativity, freedom, and a sense of adventure.",
        northStar: "To build a life and brand that both feel like mine.",
        promise: "We help you make room for something more authentic.",
        idealCustomer: "People who are done performing for an algorithm and want permission to be exactly who they are.",
        strengths: ["You make authenticity feel like the whole point, not a marketing angle.", "You attract people who are relieved to finally feel understood.", "You turn constraints into creative fuel instead of obstacles."],
        blindSpots: ["You can lose structure that would actually help ideas land.", "You may resist the repetition that turns a good idea into a recognizable brand."],
        nextSteps: ["You should pick 2-3 visual anchors and repeat them on purpose — freedom still needs a signature.", "You can turn your most \"you\" moment into the story new customers hear first.", "You'll want one simple system for follow-through so your creativity has somewhere to land."] } },
    { name: "The Joyful Connector", vector: { warmthAuthority: -2.5, freedomPurpose: 0, traditionInnovation: 0, communityRecognition: -2.5, structureExpression: 1.5, calmEnergy: 2.5, accessibilityLuxury: -2.5, playfulnessSophistication: -2.5 },
      output: { mood: "playful and fun", voice: "playful and quirky", colors: { primary: "#FFB703", secondary: "#219EBC", neutral: "#F5F0E6", accent: "#FB8500", support: "#3D405B", standOut: "#FF3D7F" }, headingFont: "Pacifico", bodyFont: "Poppins", values: ["Joy", "Community", "Connection"], influenceBlurb: "Brings warmth, energy, and an instinct for belonging.",
        northStar: "To make people feel like they belong here.",
        promise: "We help you feel like part of something fun.",
        idealCustomer: "People looking for a brand that feels like a friend, not a transaction.",
        strengths: ["You make people feel instantly welcome.", "You turn customers into a community without even trying that hard.", "You bring energy that's genuinely hard to fake."],
        blindSpots: ["You can avoid the harder conversations that keep a community healthy.", "You may prioritize being liked over being clear."],
        nextSteps: ["You should name the feeling you want people to leave with, every time — build everything around it.", "You can create one recurring moment (a ritual, a shoutout, a tradition) that makes your community feel like a community.", "You'll want a plain-spoken way to say what you stand for, not just how you feel."] } },
    { name: "The Quiet Authority", vector: { warmthAuthority: 2.5, freedomPurpose: 2.5, traditionInnovation: -2.5, communityRecognition: 0, structureExpression: -2.5, calmEnergy: -2.5, accessibilityLuxury: 0, playfulnessSophistication: 2.5 },
      output: { mood: "professional and polished", voice: "authoritative and expert", colors: { primary: "#1A1815", secondary: "#2E3A46", neutral: "#F2F0EB", accent: "#C9A84C", support: "#6B6860", standOut: "#7A1230" }, headingFont: "Merriweather", bodyFont: "Inter", values: ["Trust", "Excellence", "Integrity"], influenceBlurb: "Adds calm, credibility, and quiet confidence.",
        northStar: "To be trusted because the results speak first.",
        promise: "We help you get it right, without the noise.",
        idealCustomer: "People who've had enough of flashy promises and want someone who simply delivers.",
        strengths: ["You let your work do the convincing.", "You bring calm to situations that would rattle most people.", "You earn trust through competence, not charisma."],
        blindSpots: ["You can be overlooked by people who equate quiet with unsure.", "You may under-share the expertise that would make your case for you."],
        nextSteps: ["You should say the quiet part out loud — your credentials and results belong somewhere visible.", "You can turn your calmest, most composed moment under pressure into a story that shows your authority.", "You'll want a simple way to show proof (before/after, testimonials, results) since you won't be the one shouting about it."] } },
    { name: "The Modern Minimalist", vector: { warmthAuthority: 0, freedomPurpose: 0, traditionInnovation: 2.5, communityRecognition: 0, structureExpression: -2.5, calmEnergy: -2.5, accessibilityLuxury: 0, playfulnessSophistication: 2.5 },
      output: { mood: "minimalist and clean", voice: "confident and bold", colors: { primary: "#1A1815", secondary: "#FFFFFF", neutral: "#6B6860", accent: "#0D7377", support: "#B4B2A9", standOut: "#FF5A36" }, headingFont: "Montserrat", bodyFont: "Inter", values: ["Clarity", "Quality", "Simplicity"], influenceBlurb: "Brings clarity, restraint, and an eye for what matters.",
        northStar: "To make room for what actually matters.",
        promise: "We help you cut through the clutter.",
        idealCustomer: "People overwhelmed by too many options who want one clear, well-made choice.",
        strengths: ["You make simplicity feel intentional, not empty.", "You build things that age well because you didn't chase trends.", "You give people permission to want less, better."],
        blindSpots: ["You can read as cold if warmth isn't built in on purpose.", "You may cut things that were actually adding meaning, not just noise."],
        nextSteps: ["You should decide what stays even when you're editing down — that's your real brand voice.", "You can add one unexpected warm detail so minimal doesn't read as impersonal.", "You'll want to explain your \"why\" since a clean look alone won't tell your whole story."] } },
    { name: "The Community Builder", vector: { warmthAuthority: -2.5, freedomPurpose: 2.5, traditionInnovation: 0, communityRecognition: -2.5, structureExpression: 0, calmEnergy: 0, accessibilityLuxury: -2.5, playfulnessSophistication: 0 },
      output: { mood: "warm and cozy", voice: "warm and approachable", colors: { primary: "#C97C5D", secondary: "#8B5E3C", neutral: "#F5F0E6", accent: "#6B8E7F", support: "#4A5D45", standOut: "#E8A33D" }, headingFont: "Lora", bodyFont: "Open Sans", values: ["Belonging", "Purpose", "Generosity"], influenceBlurb: "Adds generosity, connection, and a sense of togetherness.",
        northStar: "To make sure no one builds this alone.",
        promise: "We help you find your people.",
        idealCustomer: "People looking for belonging as much as a product or service.",
        strengths: ["You make people feel like they matter individually, not just as customers.", "You turn a customer base into an actual community.", "You lead with generosity people can feel."],
        blindSpots: ["You can say yes to everyone and dilute what makes your community special.", "You may avoid boundaries that would protect your time and energy."],
        nextSteps: ["You should name who this community is actually for — belonging still needs an edge.", "You can create a simple way for members to connect with each other, not just with you.", "You'll want one clear boundary you're willing to hold, even when it's uncomfortable."] } },
    { name: "The Luxe Rebel", vector: { warmthAuthority: 0, freedomPurpose: -2.5, traditionInnovation: 2.5, communityRecognition: 2.5, structureExpression: 2.5, calmEnergy: 2.5, accessibilityLuxury: 2.5, playfulnessSophistication: 0 },
      output: { mood: "bold and vibrant", voice: "confident and bold", colors: { primary: "#1A1815", secondary: "#D6336C", neutral: "#C9A84C", accent: "#6B6860", support: "#F2F0EB", standOut: "#7B2CBF" }, headingFont: "Oswald", bodyFont: "Montserrat", values: ["Individuality", "Boldness", "Excellence"], influenceBlurb: "Brings boldness, individuality, and unapologetic style.",
        northStar: "To prove you can break the rules and still be the standard.",
        promise: "We help you stand out, unapologetically.",
        idealCustomer: "People who want luxury on their own terms, not the industry's.",
        strengths: ["You make boldness look effortless.", "You turn \"too much\" into your signature instead of a liability.", "You attract people who want permission to want more."],
        blindSpots: ["You can alienate people who need more reassurance before they trust the bold.", "You may chase novelty at the expense of consistency."],
        nextSteps: ["You should decide which rules you're breaking on purpose, so it reads as intentional, not chaotic.", "You can build one consistent signature (a color, a phrase, a shape) that survives every reinvention.", "You'll want a moment of genuine substance behind the bold statement so it doesn't read as style alone."] } },
    // Added to cover Aaker's Ruggedness trait — none of the original 10
    // profiles read as tough/outdoorsy/self-reliant (see docs/brand-dna-
    // framework.md's framework-alignment note). Deliberately warm-
    // negative/structure-negative/tradition-negative with near-max
    // accessibility (the opposite of Elevated Icon/Luxe Rebel's luxury
    // lean) so it occupies genuinely open territory in the 8D space
    // rather than sitting near an existing profile.
    { name: "The Trail Forger", vector: { warmthAuthority: 1.5, freedomPurpose: -2, traditionInnovation: -2, communityRecognition: -1.5, structureExpression: -2.5, calmEnergy: -1.5, accessibilityLuxury: -2.5, playfulnessSophistication: 1 },
      output: { mood: "rugged and outdoorsy", voice: "calm and grounded", colors: { primary: "#3D3428", secondary: "#4A5D45", neutral: "#D9CBB5", accent: "#B0492E", support: "#2E2A26", standOut: "#E8611C" }, headingFont: "Abril Fatface", bodyFont: "Roboto Mono", values: ["Durability", "Self-Reliance", "Honesty"], influenceBlurb: "Adds grit, self-reliance, and a steady hand under pressure.",
        northStar: "To build things that outlast the wear of real use.",
        promise: "We help you gear up for whatever the world throws at you.",
        idealCustomer: "People who don't trust anything until it's been tested by the elements — and expect their gear, not their marketing, to do the talking.",
        strengths: ["You build trust through durability, not promises.", "You attract people who value substance over polish.", "You stay steady when trends come and go."],
        blindSpots: ["You can undersell the craftsmanship behind what you build.", "You may resist the marketing polish that would help the right people find you."],
        nextSteps: ["You should show the wear-testing, not just the finished product — proof matters more than promises here.", "You can turn your toughest field story into your founding story.", "You'll want at least one moment of warmth in your brand so rugged doesn't read as unapproachable."] } },
  ];

  // ---------------------------------------------------------------------
  // Scoring
  // ---------------------------------------------------------------------

  // selections: array of { questionId, optionKey }
  function scoreAnswers(selections) {
    var tensionSums = {}, tensionCounts = {};
    var founderDNASums = {};
    var expressionSuggestions = [];
    var customerImpressionSums = {};
    TENSION_KEYS.forEach(function (k) { tensionSums[k] = 0; tensionCounts[k] = 0; });
    FOUNDER_DNA_KEYS.forEach(function (k) { founderDNASums[k] = 0; });
    Object.keys(CUSTOMER_IMPRESSION_DIMENSIONS).forEach(function (dim) {
      customerImpressionSums[dim] = {};
      CUSTOMER_IMPRESSION_DIMENSIONS[dim].forEach(function (label) { customerImpressionSums[dim][label] = 0; });
    });

    selections.forEach(function (sel) {
      var q = QUESTIONS.filter(function (q) { return q.id === sel.questionId; })[0];
      if (!q) return;
      var opt = q.options[sel.optionKey];
      if (!opt) return;

      if (opt.tensions) {
        Object.keys(opt.tensions).forEach(function (k) {
          tensionSums[k] += opt.tensions[k];
          tensionCounts[k] += 1;
        });
      }
      if (opt.founderDNA) {
        Object.keys(opt.founderDNA).forEach(function (k) {
          founderDNASums[k] += opt.founderDNA[k];
        });
      }
      if (opt.customerImpression) {
        Object.keys(opt.customerImpression).forEach(function (dim) {
          var label = opt.customerImpression[dim];
          customerImpressionSums[dim][label] += 2;
        });
      }
      if (opt.expression) expressionSuggestions.push(opt.expression);
    });

    var tensionFingerprint = {};
    TENSION_KEYS.forEach(function (k) {
      tensionFingerprint[k] = tensionCounts[k] > 0 ? tensionSums[k] / tensionCounts[k] : 0;
    });

    return {
      tensionFingerprint: tensionFingerprint,
      founderDNAScores: founderDNASums,
      customerImpressionScores: customerImpressionSums,
      expressionSuggestions: expressionSuggestions,
    };
  }

  // Highest-voted label per Customer Impression dimension — same "top
  // pick" idea as topFounderDNA, but each dimension is a small closed
  // category set rather than an open magnitude, so this just returns
  // the winner (with a tie broken by key order) for each of the 4
  // dimensions, not a ranked top-N.
  function topCustomerImpression(customerImpressionScores) {
    var result = {};
    Object.keys(CUSTOMER_IMPRESSION_DIMENSIONS).forEach(function (dim) {
      var scores = customerImpressionScores[dim] || {};
      var best = CUSTOMER_IMPRESSION_DIMENSIONS[dim].reduce(function (top, label) {
        return !top || scores[label] > scores[top] ? label : top;
      }, null);
      result[dim] = best;
    });
    return result;
  }

  // The Brand Playbook's "why did I land here" and "story hidden in your
  // answers" chapters need to trace a tension score back to the specific
  // questions that drove it — every option's tensions delta is already
  // stored per-question, this just re-walks the founder's actual picks
  // (answers: {questionId: optionKey}) instead of re-deriving from scratch.
  // Returns the founder's contributing answers for ONE pole, strongest
  // first — call once per pole (direction: -1 or 1) to cover the tension.
  function tensionContributors(tensionKey, answers, direction) {
    answers = answers || {};
    return QUESTIONS.reduce(function (acc, q) {
      var optionKey = answers[q.id] || answers[String(q.id)];
      var opt = optionKey && q.options[optionKey];
      var value = opt && opt.tensions && opt.tensions[tensionKey];
      if (value && (value < 0 ? -1 : 1) === direction) {
        acc.push({ questionId: q.id, optionKey: optionKey, value: value });
      }
      return acc;
    }, []).sort(function (a, b) { return Math.abs(b.value) - Math.abs(a.value); });
  }

  function distance(vectorA, vectorB) {
    var sumSquares = 0;
    TENSION_KEYS.forEach(function (k) {
      var d = (vectorA[k] || 0) - (vectorB[k] || 0);
      sumSquares += d * d;
    });
    return Math.sqrt(sumSquares);
  }

  function matchProfile(tensionFingerprint) {
    var ranked = PROFILES.map(function (p) {
      return { profile: p, distance: distance(tensionFingerprint, p.vector) };
    }).sort(function (a, b) { return a.distance - b.distance; });
    return { best: ranked[0], secondBest: ranked[1], ranked: ranked };
  }

  // Alignment display: how much more clearly a founder matches #1 than
  // #2, mapped through a smooth (never-bucketed) curve. Replaces an
  // older 4-bucket mapDisplayScore that collapsed ~95% of real founders
  // to a flat 74% — empirically, the old "share of weight across all 11
  // profiles" metric almost never exceeds ~25% even for a perfectly
  // internally-consistent founder, since the other 10 profiles always
  // absorb most of the remaining weight. Margin between #1 and #2 varies
  // meaningfully founder-to-founder, so it's what actually drives the
  // number now. Curve constants tuned against simulated real answer
  // distributions: marginRatio 0 (tied) -> 68%, ~0.13 (typical real
  // founder) -> ~80%, ~0.28 (decisive) -> ~88%, asymptotes toward 97%.
  function marginToAlignmentPct(marginRatio) {
    var K = 0.2434;
    var pct = 68 + 29 * (1 - Math.exp(-marginRatio / K));
    return Math.round(Math.max(68, Math.min(97, pct)));
  }

  // Alignment Score + Influences — inverse-distance weighting across all
  // 10 ranked profiles, normalized to 100%. Epsilon guards the
  // divide-by-zero case of an exact vector match (distance === 0). This
  // share-based number stays available as confidencePct (Influences and
  // color/font personalization still key off it) but is no longer what's
  // shown as "Primary Alignment" — see alignmentPct/marginToAlignmentPct.
  function computeConfidence(ranked) {
    var EPS = 0.01;
    var weights = ranked.map(function (r) { return 1 / (r.distance + EPS); });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var shares = ranked.map(function (r, i) {
      return { profile: r.profile, sharePct: total > 0 ? Math.round((100 * weights[i]) / total) : 0 };
    });
    var influences = shares.slice(1).filter(function (s) { return s.sharePct >= 8; }).slice(0, 2);
    var dist1 = ranked[0].distance;
    var dist2 = ranked[1] ? ranked[1].distance : dist1;
    var marginRatio = dist2 > 0 ? Math.max(0, (dist2 - dist1) / dist2) : 0;
    return { confidencePct: shares[0].sharePct, influences: influences, alignmentPct: marginToAlignmentPct(marginRatio) };
  }

  // ---------------------------------------------------------------------
  // Per-founder personalization — colors/typography vary within a matched
  // profile based on the founder's own Supporting Influence, instead of
  // being identical for every founder who lands on the same primary
  // identity. Hue-only blending (base profile's saturation/lightness are
  // kept as-is) so the curated contrast/legibility work already done per
  // profile survives — only the hue nudges toward the influence, avoiding
  // the muddy grays a naive RGB blend across two arbitrary palettes can
  // produce. headingFont is deliberately never swapped — it carries the
  // most visual identity and mixing display faces across profiles is
  // exactly the "wonky typography" risk already avoided on the cover.
  // ---------------------------------------------------------------------
  var COLOR_ROLES = ["primary", "secondary", "neutral", "accent", "support", "standOut"];

  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
    var num = parseInt(h, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var hue2rgb = function (p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToHex(r, g, b) {
    function c(x) { var s = Math.max(0, Math.min(255, Math.round(x))).toString(16); return s.length === 1 ? "0" + s : s; }
    return "#" + c(r) + c(g) + c(b);
  }

  function blendColorHue(baseHex, influenceHex, factor) {
    var baseRgb = hexToRgb(baseHex), infRgb = hexToRgb(influenceHex);
    var base = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
    var inf = rgbToHsl(infRgb.r, infRgb.g, infRgb.b);
    var delta = inf.h - base.h;
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    var newHue = base.h + delta * factor;
    var rgb = hslToRgb(newHue, base.s, base.l);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  // sharePct typically runs ~8-30% (see computeConfidence) — amplified so
  // a real influence is actually visible rather than a barely-there 8-30%
  // linear blend, capped so the primary profile always still dominates.
  function personalizeProfile(profile, influences) {
    var top = influences && influences[0];
    if (!top || !top.profile || top.profile.name === profile.name) return profile;
    var blendFactor = Math.max(0.12, Math.min(0.42, (top.sharePct / 100) * 1.8));
    var baseColors = profile.output.colors || {};
    var infColors = top.profile.output.colors || {};
    // standOut is deliberately excluded from blending — it's the one
    // color role that has to stay fixed to match the fixed per-profile
    // hero photography (and it's the app's most prominent single accent:
    // profile name, score number, chapter headers). A naive hue blend
    // across two unrelated palettes can rotate straight through an
    // off-brand color (e.g. an orange standOut blended toward a teal one
    // passing through neon green on the way) — every other role still
    // blends fine since none of them anchor to a fixed image.
    var blendedColors = Object.assign({}, baseColors);
    COLOR_ROLES.forEach(function (role) {
      if (role === "standOut") return;
      var baseHex = baseColors[role], infHex = infColors[role];
      if (baseHex && infHex) blendedColors[role] = blendColorHue(baseHex, infHex, blendFactor);
    });
    var blendedOutput = Object.assign({}, profile.output, { colors: blendedColors });
    // Only swap the body face (never the heading face) and only once the
    // influence is substantial, not just barely over the 8% Influences
    // display threshold.
    if (blendFactor >= 0.2 && top.profile.output.bodyFont && top.profile.output.bodyFont !== profile.output.bodyFont) {
      blendedOutput.bodyFont = top.profile.output.bodyFont;
    }
    return Object.assign({}, profile, {
      output: blendedOutput,
      _personalizedFrom: profile.name,
      _influencedBy: top.profile.name,
      _blendFactor: blendFactor,
    });
  }

  // Top N founder DNA dimensions by score, ties broken by key order.
  function topFounderDNA(founderDNAScores, n) {
    return FOUNDER_DNA_KEYS
      .map(function (k) { return { key: k, score: founderDNAScores[k] || 0 }; })
      .filter(function (e) { return e.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, n);
  }

  function joinWithAnd(items) {
    if (items.length <= 1) return items.join("");
    if (items.length === 2) return items[0] + " and " + items[1];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }

  function assembleFounderOutput(founderDNAScores, audiencePlaceholder, problemPlaceholder) {
    var top = topFounderDNA(founderDNAScores, 3);
    var audience = audiencePlaceholder || "the people they serve";
    var fragments = top.map(function (e) {
      return FOUNDER_DNA_LIBRARY[e.key].fragment.replace("[problem]", problemPlaceholder || "this problem");
    });
    var values = [];
    var valueReasons = [];
    top.forEach(function (e) {
      FOUNDER_DNA_LIBRARY[e.key].values.forEach(function (v) {
        if (values.indexOf(v.name) === -1) {
          values.push(v.name);
          valueReasons.push({ value: v.name, because: v.because });
        }
      });
    });
    var missionStatement = fragments.length ? "We exist to help " + audience + " " + joinWithAnd(fragments) + "." : "";
    return {
      missionStatement: missionStatement,
      values: values.slice(0, 5),
      valueReasons: valueReasons.slice(0, 5),
      topDimensions: top.map(function (e) { return e.key; }),
    };
  }

  root.BrandHaus = root.BrandHaus || {};
  root.BrandHaus.brandDNA = {
    TENSION_KEYS: TENSION_KEYS,
    FOUNDER_DNA_KEYS: FOUNDER_DNA_KEYS,
    TENSION_LABELS: TENSION_LABELS,
    FOUNDER_DNA_CLUSTERS: FOUNDER_DNA_CLUSTERS,
    CUSTOMER_IMPRESSION_DIMENSIONS: CUSTOMER_IMPRESSION_DIMENSIONS,
    CUSTOMER_IMPRESSION_LIBRARY: CUSTOMER_IMPRESSION_LIBRARY,
    QUESTIONS: QUESTIONS,
    FOUNDER_DNA_LIBRARY: FOUNDER_DNA_LIBRARY,
    PROFILES: PROFILES,
    scoreAnswers: scoreAnswers,
    matchProfile: matchProfile,
    computeConfidence: computeConfidence,
    personalizeProfile: personalizeProfile,
    topFounderDNA: topFounderDNA,
    topCustomerImpression: topCustomerImpression,
    describeCustomerImpression: describeCustomerImpression,
    assembleFounderOutput: assembleFounderOutput,
    TENSION_PLAYBOOK: TENSION_PLAYBOOK,
    CLUSTER_PLAYBOOK: CLUSTER_PLAYBOOK,
    tensionContributors: tensionContributors,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = root.BrandHaus.brandDNA;
})(typeof window !== "undefined" ? window : global);
