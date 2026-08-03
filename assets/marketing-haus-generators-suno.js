/**
 * The AI Creator's Marketing Haus — Suno Music Prompt generator.
 * Cloned from Growth Haus's ROOTED "Suno Music" bonus module so this asset also lives in
 * its home Haus. Declarative Quick Generator — registers with marketing-haus-generators.js
 * (which must load first). No marketing-haus-ui.js edits needed.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var GENRE = ["Cinematic", "Pop", "Lo-fi", "Corporate / Upbeat", "Acoustic", "Electronic", "Hip-hop", "Ambient", "Folk", "Rock"];
  var MOOD = ["Uplifting", "Energetic", "Warm", "Epic", "Chill", "Playful", "Emotional", "Confident"];
  var TEMPO = ["Slow", "Mid-tempo", "Upbeat", "Fast"];
  var VOCALS = ["Instrumental", "Female vocals", "Male vocals", "Gang / choir vocals"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "suno-music",
    label: "Suno Music Prompt",
    icon: "sparkle",
    description: "A Suno music-generator prompt to score your promo, reel, or ad — genre, mood, tempo, and a clear structure.",
    fieldGroupTitle: "Score Your Promo",

    fields: [
      { name: "subject", label: "What's the music for?", isFreeText: true, defaultValue: "a short promo video for my launch", placeholder: "e.g. a 30-second reel for my candle launch" },
      { name: "genre", label: "Genre", options: GENRE, defaultValue: GENRE[0] },
      { name: "mood", label: "Mood", options: MOOD, defaultValue: MOOD[0] },
      { name: "tempo", label: "Tempo", options: TEMPO, defaultValue: TEMPO[1] },
      { name: "vocals", label: "Vocals", options: VOCALS, defaultValue: VOCALS[0] },
    ],

    computeExtraTokens: function (v) {
      return {
        vocalsClause: v.vocals === "Instrumental" ? "instrumental (no vocals)" : String(v.vocals || "").toLowerCase(),
      };
    },

    basePromptTemplate:
      "Write a Suno music prompt for {subject}{holidayClause}. Genre: {genre}. Mood: {mood}. Tempo: {tempo}. Vocals: {vocalsClause}. " +
      "Describe the instrumentation and give a clear structure (intro, build, hook/drop, outro) so the track fits a short promotional video. " +
      "Lead with the genre and mood, and keep it within Suno's style-prompt length.",

    charmPromptTemplate:
      "Write an evocative Suno music prompt for {subject}{holidayClause}. Genre: {genre}, mood: {mood}, tempo: {tempo}, vocals: {vocalsClause}. " +
      "Paint the feeling in the first line, then name the instruments and a simple intro-build-hook-outro structure.",

    dynamicPromptTemplate:
      "Write a bold, high-energy Suno music prompt for {subject}{holidayClause}. Genre: {genre}, mood: {mood}, tempo: {tempo}, vocals: {vocalsClause}. " +
      "Open on the hook's energy, specify punchy instrumentation, and structure it to peak fast for a scroll-stopping promo.",

    charmPool: [
      "a memorable motif or riff that could become the brand's sonic signature",
      "a dynamic swell into the hook",
      "a clean, resolved outro that could loop",
    ],
    dynamicPool: [
      "a harder-hitting drop on the hook",
      "a tempo lift in the final section",
      "a punchy, quotable one-line vibe descriptor for the track",
    ],
  });
})();
