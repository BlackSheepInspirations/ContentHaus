/**
 * The Content Haus — Music Prompt Studio (Suno)
 * Self-contained module. Mounts into #ph-music-studio (a sibling of the main
 * #prompt-haus-app, so the app's innerHTML resets never touch it). Builds a
 * Suno-ready "Style of Music" string + lyrics-box content + title from a few
 * quick picks. No dependency on the main builder's engine/UI.
 */
(function () {
  "use strict";
  var root = document.getElementById("ph-music-studio");
  if (!root) return;

  // ---- option data ----
  var GENRES = ["lo-fi hip hop", "cinematic", "corporate uplifting", "ambient", "acoustic folk", "pop", "electronic / EDM", "trap / hip hop", "orchestral", "synthwave", "R&B / soul", "indie electronic", "rock", "country", "gospel / soul", "world / global"];
  var MOODS = ["uplifting", "inspirational", "calm / peaceful", "energetic / hype", "emotional / moving", "confident / bold", "playful / fun", "dramatic / epic", "warm / hopeful", "mysterious", "nostalgic", "dreamy"];
  var TEMPOS = ["slow / chill", "mid-tempo", "upbeat", "building", "fast / driving"];
  var INSTRUMENTS = ["soft piano", "warm keys", "acoustic guitar", "electric guitar", "orchestral strings", "synth pads", "plucky synth", "808 bass", "soft bass", "lo-fi drums", "punchy drums", "claps / snaps", "bells / chimes", "brass", "vinyl crackle", "risers / swells", "ukulele", "hand percussion"];
  var VOCALS = ["Instrumental (no vocals)", "Female vocal", "Male vocal", "Male & female duet", "Choir / group", "Vocal chops / hooks"];
  var PRODUCTION = ["clean / modern", "warm / analog", "cinematic / wide", "lo-fi / vinyl warmth", "punchy / radio-ready", "minimal", "epic / trailer"];

  var PURPOSES = [
    { id: "reel", label: "📱 Reel / Short bed", genre: "lo-fi hip hop", mood: "uplifting", tempo: "upbeat", instruments: ["warm keys", "soft bass", "lo-fi drums"], vocals: "Instrumental (no vocals)", production: "lo-fi / vinyl warmth", title: "Golden Hour Loop" },
    { id: "tutorial", label: "🎓 Tutorial background", genre: "ambient", mood: "calm / peaceful", tempo: "mid-tempo", instruments: ["soft piano", "synth pads", "claps / snaps"], vocals: "Instrumental (no vocals)", production: "clean / modern", title: "Quiet Focus" },
    { id: "trailer", label: "🚀 Launch trailer", genre: "cinematic", mood: "dramatic / epic", tempo: "building", instruments: ["orchestral strings", "soft piano", "punchy drums", "risers / swells"], vocals: "Instrumental (no vocals)", production: "cinematic / wide", title: "The Doors Open" },
    { id: "sting", label: "✨ Brand intro sting", genre: "corporate uplifting", mood: "confident / bold", tempo: "upbeat", instruments: ["plucky synth", "claps / snaps", "soft bass"], vocals: "Instrumental (no vocals)", production: "clean / modern", title: "Signature" },
    { id: "emotional", label: "💛 Inspirational / emotional", genre: "cinematic", mood: "inspirational", tempo: "building", instruments: ["soft piano", "orchestral strings", "lo-fi drums"], vocals: "Female vocal", production: "warm / analog", title: "Born An Original" },
    { id: "hype", label: "🔥 Hype / energetic", genre: "trap / hip hop", mood: "confident / bold", tempo: "fast / driving", instruments: ["808 bass", "punchy drums", "plucky synth"], vocals: "Vocal chops / hooks", production: "punchy / radio-ready", title: "Go Mode" },
    { id: "focus", label: "🧘 Calm focus", genre: "ambient", mood: "calm / peaceful", tempo: "slow / chill", instruments: ["warm keys", "vinyl crackle", "soft bass"], vocals: "Instrumental (no vocals)", production: "lo-fi / vinyl warmth", title: "Deep Work" },
    { id: "podcast", label: "🎙️ Podcast intro", genre: "indie electronic", mood: "playful / fun", tempo: "upbeat", instruments: ["plucky synth", "claps / snaps", "soft bass"], vocals: "Instrumental (no vocals)", production: "clean / modern", title: "On The Record" }
  ];

  // ---- state ----
  var state = { genre: "", mood: "", tempo: "", instruments: [], vocals: "Instrumental (no vocals)", production: "", bpm: "", theme: "", title: "" };

  // ---- scoped styles ----
  var css = ''
    + '#ph-music-studio{--mx-accent:var(--haus-accent,#e06a2b);--mx-deep:var(--haus-accent-deep,#c2551f);--mx-light:var(--haus-accent-light,#f4a259);max-width:1000px;margin:34px auto;background:#0e1420;border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:26px 24px;color:#eaf1f8;font-family:inherit;box-shadow:0 20px 50px rgba(0,0,0,.35)}'
    + '#ph-music-studio *{box-sizing:border-box}'
    + '#ph-music-studio .mx-eyebrow{color:var(--mx-light);font-size:11.5px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin:0 0 8px}'
    + '#ph-music-studio h2.mx-h{font-size:24px;font-weight:800;margin:0 0 6px;letter-spacing:-.01em}'
    + '#ph-music-studio h2.mx-h .mx-em{color:var(--mx-accent)}'
    + '#ph-music-studio .mx-sub{color:#9db3c2;font-size:14px;line-height:1.55;margin:0 0 20px;max-width:640px}'
    + '#ph-music-studio .mx-group{margin-bottom:18px}'
    + '#ph-music-studio .mx-lbl{display:block;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#c6d3e0;margin:0 0 9px}'
    + '#ph-music-studio .mx-lbl small{text-transform:none;letter-spacing:0;font-weight:600;color:#7f93a6}'
    + '#ph-music-studio .mx-chips{display:flex;flex-wrap:wrap;gap:7px}'
    + '#ph-music-studio .mx-chip{font-family:inherit;font-size:12.5px;font-weight:700;color:#c6d3e0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.13);border-radius:22px;padding:8px 14px;cursor:pointer;transition:all .14s}'
    + '#ph-music-studio .mx-chip:hover{border-color:var(--mx-light);color:#fff}'
    + '#ph-music-studio .mx-chip.on{color:#1b0f07;background:linear-gradient(135deg,var(--mx-light),var(--mx-accent));border-color:transparent}'
    + '#ph-music-studio .mx-purpose .mx-chip{background:rgba(224,106,43,.08);border-color:rgba(224,106,43,.3)}'
    + '#ph-music-studio .mx-purpose .mx-chip.on{background:linear-gradient(135deg,var(--mx-light),var(--mx-accent))}'
    + '#ph-music-studio .mx-row{display:flex;gap:16px;flex-wrap:wrap}'
    + '#ph-music-studio .mx-row .mx-group{flex:1;min-width:200px}'
    + '#ph-music-studio .mx-in{width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:11px 13px;color:#fff;font-family:inherit;font-size:14px}'
    + '#ph-music-studio .mx-in:focus{outline:none;border-color:var(--mx-accent)}'
    + '#ph-music-studio .mx-gen{font-family:inherit;font-size:15px;font-weight:800;color:#1b0f07;background:linear-gradient(135deg,var(--mx-light),var(--mx-accent));border:0;border-radius:26px;padding:13px 26px;cursor:pointer;box-shadow:0 12px 30px rgba(224,106,43,.3)}'
    + '#ph-music-studio .mx-gen:hover{filter:brightness(1.05)}'
    + '#ph-music-studio .mx-out-wrap{margin-top:22px;border-top:1px solid rgba(255,255,255,.09);padding-top:20px}'
    + '#ph-music-studio .mx-out-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap}'
    + '#ph-music-studio .mx-out-head b{font-size:14px;color:var(--mx-light)}'
    + '#ph-music-studio .mx-count{font-size:11.5px;font-weight:700;color:#7f93a6}'
    + '#ph-music-studio .mx-count.warn{color:#ffb4b4}'
    + '#ph-music-studio .mx-out{width:100%;min-height:210px;background:rgba(0,0,0,.34);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:15px;color:#dbe6f0;font-family:inherit;font-size:13.5px;line-height:1.55;white-space:pre-wrap;resize:vertical}'
    + '#ph-music-studio .mx-out:focus{outline:none;border-color:var(--mx-accent)}'
    + '#ph-music-studio .mx-btns{display:flex;gap:9px;margin-top:12px;flex-wrap:wrap}'
    + '#ph-music-studio .mx-cp{font-family:inherit;font-size:13px;font-weight:800;border-radius:22px;padding:10px 18px;cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#eaf1f8}'
    + '#ph-music-studio .mx-cp.primary{color:#1b0f07;background:linear-gradient(135deg,var(--mx-light),var(--mx-accent));border-color:transparent}'
    + '#ph-music-studio .mx-cp.done{background:#34e0a1;color:#06231a;border-color:transparent}'
    + '#ph-music-studio .mx-tips{margin-top:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:2px 16px}'
    + '#ph-music-studio .mx-tips summary{cursor:pointer;font-weight:800;font-size:13px;color:#c6d3e0;padding:12px 0;list-style:none}'
    + '#ph-music-studio .mx-tips summary::-webkit-details-marker{display:none}'
    + '#ph-music-studio .mx-tips summary::before{content:"▸ ";color:var(--mx-accent)}'
    + '#ph-music-studio .mx-tips[open] summary::before{content:"▾ "}'
    + '#ph-music-studio .mx-tips ul{margin:0 0 14px;padding-left:20px;color:#9db3c2;font-size:13px;line-height:1.6}'
    + '#ph-music-studio .mx-tips a{color:var(--mx-light);font-weight:700}';
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ---- helpers ----
  function chipRow(list, key, multi) {
    return '<div class="mx-chips" data-key="' + key + '" data-multi="' + (multi ? 1 : 0) + '">'
      + list.map(function (v) {
        var on = multi ? state[key].indexOf(v) > -1 : state[key] === v;
        return '<button type="button" class="mx-chip' + (on ? " on" : "") + '" data-v="' + v.replace(/"/g, "&quot;") + '">' + v + "</button>";
      }).join("") + "</div>";
  }

  function view() {
    root.className = "haus--content";
    root.innerHTML = ''
      + '<p class="mx-eyebrow">Content Haus · Music Prompt Studio</p>'
      + '<h2 class="mx-h">🎵 Score your <span class="mx-em">content</span></h2>'
      + '<p class="mx-sub">Pick a vibe and generate a <b>Suno-ready</b> music prompt — the perfect background track for your reels, tutorials, launches, and brand moments. Start with a preset, then fine-tune.</p>'
      + '<div class="mx-group mx-purpose"><span class="mx-lbl">Start with a purpose <small>— pre-fills everything below</small></span>'
      + '<div class="mx-chips" data-key="__purpose">' + PURPOSES.map(function (p) { return '<button type="button" class="mx-chip" data-p="' + p.id + '">' + p.label + "</button>"; }).join("") + "</div></div>"
      + '<div class="mx-group"><span class="mx-lbl">Genre</span>' + chipRow(GENRES, "genre", false) + "</div>"
      + '<div class="mx-group"><span class="mx-lbl">Mood / vibe</span>' + chipRow(MOODS, "mood", false) + "</div>"
      + '<div class="mx-row">'
      + '<div class="mx-group"><span class="mx-lbl">Energy / tempo</span>' + chipRow(TEMPOS, "tempo", false) + "</div>"
      + '<div class="mx-group" style="flex:0 0 130px"><span class="mx-lbl">BPM <small>opt.</small></span><input class="mx-in" id="mx-bpm" type="number" min="40" max="200" placeholder="e.g. 90" value="' + (state.bpm || "") + '"></div>'
      + "</div>"
      + '<div class="mx-group"><span class="mx-lbl">Instruments <small>— pick a few</small></span>' + chipRow(INSTRUMENTS, "instruments", true) + "</div>"
      + '<div class="mx-group"><span class="mx-lbl">Vocals</span>' + chipRow(VOCALS, "vocals", false) + "</div>"
      + '<div class="mx-group"><span class="mx-lbl">Production feel</span>' + chipRow(PRODUCTION, "production", false) + "</div>"
      + '<div class="mx-row">'
      + '<div class="mx-group" id="mx-theme-wrap"' + (state.vocals.indexOf("Instrumental") === 0 ? ' style="display:none"' : "") + '><span class="mx-lbl">Song theme <small>— what should the vocals be about?</small></span><input class="mx-in" id="mx-theme" type="text" placeholder="e.g. chasing a dream you almost gave up on" value="' + esc(state.theme) + '"></div>'
      + '<div class="mx-group"><span class="mx-lbl">Track title <small>opt.</small></span><input class="mx-in" id="mx-title" type="text" placeholder="Name your track" value="' + esc(state.title) + '"></div>'
      + "</div>"
      + '<button type="button" class="mx-gen" id="mx-gen">✨ Generate music prompt</button>'
      + '<div class="mx-out-wrap" id="mx-out-wrap" style="display:none">'
      + '<div class="mx-out-head"><b>Your Suno prompt</b><span class="mx-count" id="mx-count"></span></div>'
      + '<textarea class="mx-out" id="mx-out" spellcheck="false"></textarea>'
      + '<div class="mx-btns"><button type="button" class="mx-cp primary" id="mx-copy-all">⧉ Copy everything</button><button type="button" class="mx-cp" id="mx-copy-style">⧉ Copy style only</button></div>'
      + "</div>"
      + '<details class="mx-tips"><summary>How to use this in Suno</summary><ul>'
      + '<li>Go to <a href="https://suno.com" target="_blank" rel="noopener">suno.com</a> → <b>Create</b> → toggle <b>Custom</b>.</li>'
      + '<li>Paste the <b>STYLE</b> line into the <b>“Style of Music”</b> box. Keep it under ~200 characters (the counter turns red if you’re over).</li>'
      + '<li>Paste the <b>LYRICS</b> block into the lyrics box — <code>[Instrumental]</code> for no vocals, or the [Verse]/[Chorus] scaffold to write to.</li>'
      + '<li>Add the <b>TITLE</b>, hit Create, and generate 2 takes. Download the one that fits, then drop it under your reel/video.</li>'
      + '<li>Tip: for a short reel loop, use the intro of the track, or ask Suno to keep it simple and repetitive.</li>'
      + "</ul></details>";
    bind();
  }

  function esc(s) { return (s || "").replace(/"/g, "&quot;"); }

  function bind() {
    // preset chips
    root.querySelectorAll('[data-key="__purpose"] .mx-chip').forEach(function (b) {
      b.addEventListener("click", function () {
        var p = PURPOSES.filter(function (x) { return x.id === b.dataset.p; })[0];
        if (!p) return;
        state.genre = p.genre; state.mood = p.mood; state.tempo = p.tempo;
        state.instruments = p.instruments.slice(); state.vocals = p.vocals;
        state.production = p.production; if (!state.title) state.title = p.title;
        view(); generate();
        document.getElementById("mx-out-wrap").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
    // option chips
    root.querySelectorAll('.mx-chips[data-key]:not([data-key="__purpose"]) .mx-chip').forEach(function (b) {
      b.addEventListener("click", function () {
        var wrap = b.closest(".mx-chips"), key = wrap.dataset.key, v = b.dataset.v, multi = wrap.dataset.multi === "1";
        if (multi) {
          var i = state[key].indexOf(v);
          if (i > -1) state[key].splice(i, 1); else state[key].push(v);
        } else {
          state[key] = state[key] === v ? "" : v;
          if (key === "vocals") { var tw = document.getElementById("mx-theme-wrap"); if (tw) tw.style.display = state.vocals.indexOf("Instrumental") === 0 ? "none" : ""; }
        }
        // re-render just this row's on-states
        wrap.querySelectorAll(".mx-chip").forEach(function (c) {
          var cv = c.dataset.v, on = multi ? state[key].indexOf(cv) > -1 : state[key] === cv;
          c.classList.toggle("on", on);
        });
      });
    });
    var bpm = document.getElementById("mx-bpm"); if (bpm) bpm.addEventListener("input", function () { state.bpm = bpm.value; });
    var th = document.getElementById("mx-theme"); if (th) th.addEventListener("input", function () { state.theme = th.value; });
    var ti = document.getElementById("mx-title"); if (ti) ti.addEventListener("input", function () { state.title = ti.value; });
    document.getElementById("mx-gen").addEventListener("click", generate);
    var out = document.getElementById("mx-out"); if (out) out.addEventListener("input", updateCount);
  }

  function buildStyle() {
    var parts = [];
    if (state.mood) parts.push(state.mood.split(" / ")[0]);
    if (state.genre) parts.push(state.genre);
    state.instruments.forEach(function (i) { parts.push(i); });
    var t = [];
    if (state.tempo) t.push(state.tempo.split(" / ")[0]);
    if (state.bpm) t.push(state.bpm + " BPM");
    if (t.length) parts.push(t.join(" "));
    if (state.production) parts.push(state.production.split(" / ")[0]);
    var v = state.vocals;
    if (v.indexOf("Instrumental") === 0) parts.push("instrumental, no vocals");
    else if (v === "Female vocal") parts.push("female vocals");
    else if (v === "Male vocal") parts.push("male vocals");
    else if (v === "Male & female duet") parts.push("male & female duet");
    else if (v === "Choir / group") parts.push("choir vocals");
    else if (v === "Vocal chops / hooks") parts.push("vocal chops");
    // de-dupe, drop empties
    var seen = {}, clean = [];
    parts.forEach(function (p) { p = (p || "").trim(); if (p && !seen[p.toLowerCase()]) { seen[p.toLowerCase()] = 1; clean.push(p); } });
    return clean.join(", ");
  }

  function buildLyrics() {
    if (state.vocals.indexOf("Instrumental") === 0) return "[Instrumental]";
    var theme = state.theme.trim();
    var about = theme ? " about " + theme : "";
    return "[Verse]\n(4 lines" + about + ")\n\n[Chorus]\n(the one line you want them to remember" + (theme ? " — the heart of “" + theme + "”" : "") + ")\n\n[Verse]\n(build on it — a detail, a turn)\n\n[Chorus]\n\n[Bridge]\n(the emotional peak)\n\n[Chorus]\n\n[Outro]";
  }

  function generate() {
    var style = buildStyle();
    if (!style) { style = "warm uplifting lo-fi, soft keys, gentle beat, mid-tempo, instrumental"; }
    var title = state.title.trim() || "Untitled Track";
    var out = "🎧 STYLE OF MUSIC (paste in Suno’s “Style of Music” box):\n" + style
      + "\n\n📝 LYRICS (paste in Suno’s lyrics box):\n" + buildLyrics()
      + "\n\n🏷️ TITLE:\n" + title;
    document.getElementById("mx-out-wrap").style.display = "";
    document.getElementById("mx-out").value = out;
    updateCount();
  }

  function currentStyleLine() {
    var v = document.getElementById("mx-out").value;
    var m = v.match(/box\):\n([\s\S]*?)\n\n/);
    return m ? m[1].trim() : buildStyle();
  }

  function updateCount() {
    var el = document.getElementById("mx-count"); if (!el) return;
    var n = currentStyleLine().length;
    el.textContent = "Style: " + n + " / 200 chars";
    el.classList.toggle("warn", n > 200);
  }

  function copyBtn(btn, text) {
    navigator.clipboard.writeText(text).then(function () {
      var h = btn.innerHTML; btn.textContent = "✓ Copied!"; btn.classList.add("done");
      setTimeout(function () { btn.innerHTML = h; btn.classList.remove("done"); }, 1400);
    });
  }

  root.addEventListener("click", function (e) {
    var all = e.target.closest("#mx-copy-all"); if (all) { copyBtn(all, document.getElementById("mx-out").value); return; }
    var sty = e.target.closest("#mx-copy-style"); if (sty) { copyBtn(sty, currentStyleLine()); }
  });

  view();
})();
