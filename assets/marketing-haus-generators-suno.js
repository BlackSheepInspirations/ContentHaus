/**
 * The AI Creator's Marketing Haus — Suno Music Prompt generator.
 * Cloned from Growth Haus's ROOTED "Suno Music" bonus module so this asset also lives in
 * its home Haus. Declarative Quick Generator — registers with marketing-haus-generators.js
 * (which must load first). No marketing-haus-ui.js edits needed.
 *
 * textOnly: a music prompt is text, so it opts out of the image-only
 * platform formatting (--ar/--no, transparent PNG, buffer).
 *
 * Vocals are a clear WITH-VOICE-OR-NOT toggle: "Instrumental" means the
 * Vocal Style / Lyrics fields simply don't apply, while "With vocals"
 * pulls the vocal style and an optional lyrics theme into the prompt so
 * Suno actually gets words to sing.
 */
(function () {
  "use strict";

  window.MarketingHaus = window.MarketingHaus || {};
  var MarketingHaus = window.MarketingHaus;

  var GENRE = [
    "Cinematic", "Pop", "Lo-fi", "Corporate / Upbeat", "Acoustic", "Electronic", "Hip-hop",
    "Ambient", "Folk", "Rock", "R&B", "Country", "Synthwave", "Orchestral", "Trap", "Jazz", "Reggae",
  ];
  var MOOD = ["Uplifting", "Energetic", "Warm", "Epic", "Chill", "Playful", "Emotional", "Confident"];
  var TEMPO = ["Slow", "Mid-tempo", "Upbeat", "Fast"];
  var VOCALS = ["Instrumental (no vocals)", "With vocals"];
  var VOCAL_STYLE = ["Female", "Male", "Duet", "Gang / choir"];

  MarketingHaus.generatorEngine.registerGenerator({
    id: "suno-music",
    textOnly: true,
    label: "Suno Music Prompt",
    icon: "sparkle",
    description: "A Suno music-generator prompt to score your promo, reel, or ad — genre, mood, tempo, and either instrumental or a full vocal track with lyrics.",
    fieldGroupTitle: "Score Your Promo",

    fields: [
      { name: "subject", label: "What's the music for?", isFreeText: true, defaultValue: "a short promo video for my launch", placeholder: "e.g. a 30-second reel for my candle launch" },
      { name: "genre", label: "Genre", options: GENRE, defaultValue: GENRE[0] },
      { name: "mood", label: "Mood", options: MOOD, defaultValue: MOOD[0] },
      { name: "tempo", label: "Tempo", options: TEMPO, defaultValue: TEMPO[1] },
      { name: "vocals", label: "Vocals — with voice or not?", options: VOCALS, defaultValue: VOCALS[0] },
      { name: "vocalStyle", label: "Vocal Style (if vocals)", options: VOCAL_STYLE, defaultValue: VOCAL_STYLE[0] },
      { name: "lyricsTheme", label: "Lyrics — theme or the actual words (if vocals)", isFreeText: true, defaultValue: "", placeholder: "e.g. chasing a dream / cozy autumn mornings — or paste your own lyrics" },
    ],

    computeExtraTokens: function (v) {
      var isVocal = /with vocals/i.test(v.vocals || "");
      var vocalsClause = isVocal
        ? String(v.vocalStyle || "").toLowerCase() + " vocals"
        : "instrumental (no vocals)";

      var lyricsClause = "";
      if (isVocal) {
        lyricsClause = v.lyricsTheme
          ? " Also write a short set of lyrics based on \"" + v.lyricsTheme + "\" (use those exact words if they already read as lyrics), formatted with [Verse] and [Chorus] section tags that Suno understands."
          : " Also write a short set of original lyrics that fit the subject and mood, formatted with [Verse] and [Chorus] section tags that Suno understands.";
      }
      return { vocalsClause: vocalsClause, lyricsClause: lyricsClause };
    },

    basePromptTemplate:
      "Write a Suno music prompt for {subject}{holidayClause}. Genre: {genre}. Mood: {mood}. Tempo: {tempo}. Vocals: {vocalsClause}. " +
      "Describe the instrumentation and give a clear structure (intro, build, hook/drop, outro) so the track fits a short promotional video.{lyricsClause} " +
      "Lead with the genre and mood, and keep the style prompt within Suno's length.",

    charmPromptTemplate:
      "Write an evocative Suno music prompt for {subject}{holidayClause}. Genre: {genre}, mood: {mood}, tempo: {tempo}, vocals: {vocalsClause}. " +
      "Paint the feeling in the first line, then name the instruments and a simple intro-build-hook-outro structure.{lyricsClause}",

    dynamicPromptTemplate:
      "Write a bold, high-energy Suno music prompt for {subject}{holidayClause}. Genre: {genre}, mood: {mood}, tempo: {tempo}, vocals: {vocalsClause}. " +
      "Open on the hook's energy, specify punchy instrumentation, and structure it to peak fast for a scroll-stopping promo.{lyricsClause}",

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
