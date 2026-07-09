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
      C: { tensions: {} },
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
      A: { founderDNA: { purpose: 2 }, tensions: { traditionInnovation: -1 } },
      B: { founderDNA: { freedom: 1, growth: 1 } },
      C: { founderDNA: { security: 2, freedom: 1 } },
      D: { founderDNA: { security: 1, service: 1 }, tensions: { warmthAuthority: -1 } },
      E: { founderDNA: { growth: 2, freedom: 1 } },
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
  var FOUNDER_DNA_LIBRARY = {
    purpose: { fragment: "a better answer to [problem]", values: ["Purpose", "Impact", "Integrity"] },
    legacy: { fragment: "something that outlasts me", values: ["Legacy", "Excellence", "Craftsmanship"] },
    belonging: { fragment: "a sense of belonging for [audience]", values: ["Belonging", "Community", "Connection"] },
    freedom: { fragment: "the freedom to build this on my own terms", values: ["Freedom", "Autonomy", "Authenticity"] },
    recognition: { fragment: "the recognition that comes from doing it right", values: ["Excellence", "Distinction", "Quality"] },
    creativity: { fragment: "ideas nobody else was brave enough to try", values: ["Creativity", "Originality", "Innovation"] },
    security: { fragment: "something steady people can count on", values: ["Trust", "Reliability", "Consistency"] },
    excellence: { fragment: "refusing to compromise on quality", values: ["Excellence", "Craftsmanship", "Standards"] },
    impact: { fragment: "changing what's possible for [audience]", values: ["Impact", "Service", "Purpose"] },
    stewardship: { fragment: "protecting what matters for those who come next", values: ["Stewardship", "Responsibility", "Care"] },
    growth: { fragment: "always becoming more of who we are", values: ["Growth", "Evolution", "Curiosity"] },
    service: { fragment: "showing up for people, fully", values: ["Service", "Generosity", "Care"] },
  };

  // ---------------------------------------------------------------------
  // Profile Library — numeric tension vectors converted from the
  // qualitative High/Mid/Low positions in docs/brand-dna-framework.md.
  // Unspecified axes are 0 (neutral).
  // ---------------------------------------------------------------------
  var PROFILES = [
    { name: "The Trusted Guide", vector: { warmthAuthority: -2.5, freedomPurpose: 2.5, traditionInnovation: 0, communityRecognition: -2.5, structureExpression: 0, calmEnergy: -1.5, accessibilityLuxury: -2.5, playfulnessSophistication: 0 },
      output: { mood: "warm and cozy", voice: "warm and approachable", colors: ["#8B5E3C", "#F5F0E6", "#6B8E7F"], headingFont: "Lora", bodyFont: "Georgia", values: ["Trust", "Service", "Integrity", "Community"] } },
    { name: "The Bold Pioneer", vector: { warmthAuthority: 0, freedomPurpose: 2.5, traditionInnovation: 2.5, communityRecognition: 0, structureExpression: 2.5, calmEnergy: 2.5, accessibilityLuxury: 0, playfulnessSophistication: 0 },
      output: { mood: "bold and vibrant", voice: "confident and bold", colors: ["#1A1815", "#D6336C", "#F2F0EB"], headingFont: "Bebas Neue", bodyFont: "Inter", values: ["Courage", "Innovation", "Impact"] } },
    { name: "The Cozy Craftsman", vector: { warmthAuthority: -2.5, freedomPurpose: 0, traditionInnovation: -2.5, communityRecognition: -2.5, structureExpression: 0, calmEnergy: -2.5, accessibilityLuxury: -2.5, playfulnessSophistication: 0 },
      output: { mood: "warm and cozy", voice: "warm and approachable", colors: ["#8B5E3C", "#F5F0E6", "#4A5D45"], headingFont: "Playfair Display", bodyFont: "Georgia", values: ["Craftsmanship", "Family", "Comfort"] } },
    { name: "The Elevated Icon", vector: { warmthAuthority: 2.5, freedomPurpose: 0, traditionInnovation: -2.5, communityRecognition: 2.5, structureExpression: -2.5, calmEnergy: 0, accessibilityLuxury: 2.5, playfulnessSophistication: 2.5 },
      output: { mood: "elegant and luxurious", voice: "sophisticated and refined", colors: ["#1A1815", "#C9A84C", "#FAF6EF"], headingFont: "Playfair Display", bodyFont: "Lora", values: ["Excellence", "Craftsmanship", "Legacy"] } },
    { name: "The Free Spirit", vector: { warmthAuthority: 0, freedomPurpose: -2.5, traditionInnovation: 0, communityRecognition: 0, structureExpression: 2.5, calmEnergy: 1.5, accessibilityLuxury: -2.5, playfulnessSophistication: -2.5 },
      output: { mood: "boho and eclectic", voice: "playful and quirky", colors: ["#E07A5F", "#F2CC8F", "#3D405B"], headingFont: "Pacifico", bodyFont: "Poppins", values: ["Freedom", "Creativity", "Authenticity"] } },
    { name: "The Joyful Connector", vector: { warmthAuthority: -2.5, freedomPurpose: 0, traditionInnovation: 0, communityRecognition: -2.5, structureExpression: 1.5, calmEnergy: 2.5, accessibilityLuxury: -2.5, playfulnessSophistication: -2.5 },
      output: { mood: "playful and fun", voice: "playful and quirky", colors: ["#FFB703", "#FB8500", "#219EBC"], headingFont: "Pacifico", bodyFont: "Poppins", values: ["Joy", "Community", "Connection"] } },
    { name: "The Quiet Authority", vector: { warmthAuthority: 2.5, freedomPurpose: 2.5, traditionInnovation: -2.5, communityRecognition: 0, structureExpression: -2.5, calmEnergy: -2.5, accessibilityLuxury: 0, playfulnessSophistication: 2.5 },
      output: { mood: "professional and polished", voice: "authoritative and expert", colors: ["#1A1815", "#2E3A46", "#F2F0EB"], headingFont: "Merriweather", bodyFont: "Inter", values: ["Trust", "Excellence", "Integrity"] } },
    { name: "The Modern Minimalist", vector: { warmthAuthority: 0, freedomPurpose: 0, traditionInnovation: 2.5, communityRecognition: 0, structureExpression: -2.5, calmEnergy: -2.5, accessibilityLuxury: 0, playfulnessSophistication: 2.5 },
      output: { mood: "minimalist and clean", voice: "confident and bold", colors: ["#1A1815", "#FFFFFF", "#6B6860"], headingFont: "Montserrat", bodyFont: "Inter", values: ["Clarity", "Quality", "Simplicity"] } },
    { name: "The Community Builder", vector: { warmthAuthority: -2.5, freedomPurpose: 2.5, traditionInnovation: 0, communityRecognition: -2.5, structureExpression: 0, calmEnergy: 0, accessibilityLuxury: -2.5, playfulnessSophistication: 0 },
      output: { mood: "warm and cozy", voice: "warm and approachable", colors: ["#C97C5D", "#F5F0E6", "#8B5E3C"], headingFont: "Lora", bodyFont: "Open Sans", values: ["Belonging", "Purpose", "Generosity"] } },
    { name: "The Luxe Rebel", vector: { warmthAuthority: 0, freedomPurpose: -2.5, traditionInnovation: 2.5, communityRecognition: 2.5, structureExpression: 2.5, calmEnergy: 2.5, accessibilityLuxury: 2.5, playfulnessSophistication: 0 },
      output: { mood: "bold and vibrant", voice: "confident and bold", colors: ["#1A1815", "#D6336C", "#C9A84C"], headingFont: "Oswald", bodyFont: "Montserrat", values: ["Individuality", "Boldness", "Excellence"] } },
  ];

  // ---------------------------------------------------------------------
  // Scoring
  // ---------------------------------------------------------------------

  // selections: array of { questionId, optionKey }
  function scoreAnswers(selections) {
    var tensionSums = {}, tensionCounts = {};
    var founderDNASums = {};
    var expressionSuggestions = [];
    TENSION_KEYS.forEach(function (k) { tensionSums[k] = 0; tensionCounts[k] = 0; });
    FOUNDER_DNA_KEYS.forEach(function (k) { founderDNASums[k] = 0; });

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
      if (opt.expression) expressionSuggestions.push(opt.expression);
    });

    var tensionFingerprint = {};
    TENSION_KEYS.forEach(function (k) {
      tensionFingerprint[k] = tensionCounts[k] > 0 ? tensionSums[k] / tensionCounts[k] : 0;
    });

    return {
      tensionFingerprint: tensionFingerprint,
      founderDNAScores: founderDNASums,
      expressionSuggestions: expressionSuggestions,
    };
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

  // Top N founder DNA dimensions by score, ties broken by key order.
  function topFounderDNA(founderDNAScores, n) {
    return FOUNDER_DNA_KEYS
      .map(function (k) { return { key: k, score: founderDNAScores[k] || 0 }; })
      .filter(function (e) { return e.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, n);
  }

  function assembleFounderOutput(founderDNAScores, audiencePlaceholder, problemPlaceholder) {
    var top = topFounderDNA(founderDNAScores, 3);
    var fragments = top.map(function (e) {
      var frag = FOUNDER_DNA_LIBRARY[e.key].fragment;
      return frag.replace("[audience]", audiencePlaceholder || "the people we serve").replace("[problem]", problemPlaceholder || "this problem");
    });
    var values = [];
    top.forEach(function (e) {
      FOUNDER_DNA_LIBRARY[e.key].values.forEach(function (v) {
        if (values.indexOf(v) === -1) values.push(v);
      });
    });
    var missionStatement = fragments.length ? "We exist for " + fragments.join(", and ") + "." : "";
    return { missionStatement: missionStatement, values: values.slice(0, 5), topDimensions: top.map(function (e) { return e.key; }) };
  }

  root.BrandHaus = root.BrandHaus || {};
  root.BrandHaus.brandDNA = {
    TENSION_KEYS: TENSION_KEYS,
    FOUNDER_DNA_KEYS: FOUNDER_DNA_KEYS,
    QUESTIONS: QUESTIONS,
    FOUNDER_DNA_LIBRARY: FOUNDER_DNA_LIBRARY,
    PROFILES: PROFILES,
    scoreAnswers: scoreAnswers,
    matchProfile: matchProfile,
    topFounderDNA: topFounderDNA,
    assembleFounderOutput: assembleFounderOutput,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = root.BrandHaus.brandDNA;
})(typeof window !== "undefined" ? window : global);
