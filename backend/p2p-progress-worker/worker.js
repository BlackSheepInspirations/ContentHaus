/* Purpose 2 Profit — community + progress backend (Cloudflare Worker), v2.
   ---------------------------------------------------------------------------
   Routed by the App Proxy path tail (/apps/p2p/<seg>):
     progress  GET/POST  -> per-customer metafield custom.p2p_progress (UNCHANGED)
     profile   GET/POST   -> this member's own PUBLIC card (KV), incl. opt-out + geo
     members   GET        -> all non-hidden public cards (directory + map)
     community GET/POST    -> GET the wall (with love counts); POST publishes IMMEDIATELY
     react     POST         -> toggle a love on a post {id} -> {likes, liked}
     suggest   POST         -> private question/suggestion -> emails hello@ (+ KV log)
     moderate  POST        -> ADMIN (optional): {id, action:'delete'} — spam safety valve

   Emails (community posts, messages, suggestions, questions) go to env.alert_email
   (set it to hello@blacksheepcreations.com) via Resend (env.resend_key).

   Every request is App-Proxy-signed (env.client_secret) so logged_in_customer_id
   is trustworthy. Admin = customerId listed in env.admin_ids (comma-separated).

   Cloudflare env:
     shop, client_id           plain vars
     client_secret             secret (also verifies the proxy signature)
     admin_token               optional secret (else client_credentials grant)
     admin_ids                 comma-separated customer ids allowed to moderate
     resend_key, alert_email   optional — email alerts on new posts (Resend free tier)
   Cloudflare binding:
     P2P_KV                    a KV namespace (shared store for cards + posts)
*/
const API_VERSION = '2026-07';
const NS = 'custom', KEY = 'p2p_progress';
let cachedToken = null, cachedAt = 0;

/* ---- content banks (house voices + welcomes) ---- */
const WELCOME_LINES = [
  'The flock just grew — welcome, {name}! 🐑 What win are you chasing first?',
  'Welcome home, {name}. You were born an original — glad you didn\'t die a copy. 🖤',
  'A new face in the Haus! Everybody say hey to {name}. 👋',
  '{name} just joined the flock. Drop a 👋 and make \'em feel at home.',
  'Welcome, {name}! Every expert started as a beginner who kept showing up.',
  'So glad you\'re here, {name}. Your purpose has a place at this table. 🌱',
  'The Haus doors just opened for {name} — welcome to the build. 🔨',
  'New member alert: {name} is in! What are you creating right now?',
  'Welcome, {name}. Small steps, shared out loud, become big stories here.',
  'Hey {name} — you found your people. Pull up a chair. ☕',
  'The flock says welcome, {name}! Tell us one thing you\'re working on.',
  'Welcome aboard, {name}. Progress over perfection — always. 💪',
  '{name} just walked in. This is your sign to introduce yourself back. 😊',
  'Glad you\'re here, {name}! Purpose first, profit follows.',
  'Welcome to the Haus, {name}. Your originality is exactly what we needed.',
  'A warm Black Sheep welcome to {name}! 🐑 What brought you here?',
  'New in the flock: {name}. Say hi and share your first goal!',
  '{name}, welcome! The best time to start was yesterday — the second best is now.',
  'Welcome, {name}. You bring something no one else can. Let\'s build it.',
  'The Haus just got better — welcome, {name}! ✨',
  'Hey {name}, welcome in! What\'s the dream you\'re turning into a plan?',
  'Welcome, {name}! Every win in here started as a nervous first post.',
  '{name} joined the journey. From thought to thrive — let\'s go. 🚀',
  'So happy to have you, {name}. This flock roots for each other, hard.',
  'Welcome, {name}! Consistency beats intensity. Glad you\'re here for the long game.',
  'New member {name} is in the building! 🎉 Give \'em a warm hello.',
  'Welcome home, {name}. Your seat was waiting. 🪑',
  'Hey {name} — the flock is stronger with you in it. Welcome!',
  'Welcome, {name}! Post your first win the moment you get one. We\'ll celebrate loud.',
  '{name}, you made it. Take a breath, look around, and say hello. 🐑🖤'
];
// Display-name safety: reserved words + a compact profanity/slur blocklist (client pre-checks; this is authoritative).
const NAME_BLOCK = /(f+u+c+k|sh[i1\*]t|b[i1]tch|c[u\*]nt|n[i1]gg|f[a4]gg|whore|\bslut\b|\brape\b|nazi|retard|\bcum\b|pussy|a[s\$]{2}hole|jizz|dumbass|bastard|\bhoe\b|loser|idiot|stupid|\bdumb\b|\bugly\b|moron|imbecile|worthless|\bhate\b|\bkill\b|\bdie\b|\bscum\b|\btrash\b|\bfat\b|\bp2p ?team\b|\badmin\b|moderator|official)/i;
const FRANK_POSTS = [
  'Did you know? Your first offer only needs ONE buyer to prove it works. Aim for one, not a hundred.',
  'Did you know? Most people quit right before the compounding kicks in. Post 30 times before you judge the results.',
  'Did you know? Price is a message. Too cheap and people assume it\'s low value. Charge what the transformation is worth.',
  'Did you know? You don\'t need a bigger audience — you need a clearer offer. Clarity outsells reach.',
  'Did you know? The riches are in the follow-up. 80% of sales happen after the 5th touch, yet most stop at one.',
  'Did you know? A confused mind says no. If your pitch needs a paragraph, it needs another rewrite.',
  'Did you know? Testimonials sell better than you do. Ask every happy customer for one sentence.',
  'Did you know? Done and shared beats perfect and hidden. Ship it, then improve it in public.',
  'Did you know? Your email list is the only audience you actually own. Start it today, even at zero.',
  'Did you know? People buy outcomes, not features. Sell the after, not the tool.',
  'Did you know? The best marketing is a product people can\'t stop talking about. Make the first version remarkable.',
  'Did you know? Consistency is a business strategy. The algorithm rewards the person who shows up on the boring days.'
];
const RUTH_POSTS = [
  'A gentle reminder: comparison is a thief. The only fair race is against who you were yesterday. 🌱',
  'Something to sit with: rest is not the reward for finished work — it\'s part of the work. Protect it.',
  'Your worth isn\'t measured in output. You are already enough; the building is just the overflow. 🖤',
  'A thought for today: the dream that scares you a little is usually the one worth chasing.',
  'Remember: every no is redirecting you toward the right yes. Keep your heart soft and your aim steady.',
  'A gentle nudge: progress you can\'t see is still progress. Roots grow in the dark before anything blooms.',
  'Something true: courage isn\'t the absence of fear — it\'s showing up shaky and doing it anyway.',
  'Today\'s reminder: you don\'t have to have it all figured out to take the next faithful step.',
  'A soft word: be as kind to yourself as you\'d be to a friend starting exactly where you are.',
  'Remember why you started. On the hard days, purpose is the thing that carries the plan. ✨',
  'A thought: the flock grows stronger when we celebrate each other loudly. Whose win can you cheer today?',
  'Gentle truth: you were made original on purpose, for a purpose. Don\'t shrink to fit someone else\'s box.'
];
const ERIC_POSTS = [
  'Why did the entrepreneur bring a ladder to the sales meeting? He heard the projections were through the roof. 😂',
  'I told my email list a joke about a broken pencil… it was pointless. But hey, at least I showed up. 📧✏️',
  'Why don\'t marketers ever get locked out? They always know the best entry points. 🚪',
  'I tried to come up with a joke about passive income… but it just made money while I wasn\'t working on it. 💰',
  'What do you call a sheep that can sell anything? Baaa-rilliant. 🐑',
  'My accountant said I needed to be more careful with puns. I said I\'d weigh the pros and cons — turns out there\'s no accounting for taste.',
  'Why did the scarecrow start a business? He was outstanding in his field. 🌾',
  'I bought a boat with my first sale. It was a sales-boat. I\'m so sorry. ⛵',
  'What\'s a copywriter\'s favorite exercise? The word count. 💪',
  'Why did the coffee file a complaint at the coworking space? It got mugged every single morning. ☕',
  'I told my wife I\'d finally automated everything. She said, "Great, now automate taking out the trash." Fair. 🗑️',
  'Why did the website go to therapy? Too many unresolved issues in its tabs. 🧠',
  'What do you call a fake noodle running an ad agency? An impasta with great pasta-tential. 🍝',
  'My startup idea? A gym for dad jokes. It\'s all about the puns and reps. 🏋️',
  'Why don\'t we ever tell secrets in the community? Because too many people are… followers. 👀',
  'I entered the annual pun contest and submitted ten. I figured no pun in ten did — but I showed up anyway. That\'s the whole lesson, kid. 😉'
];
const DREA_POSTS = [
  'Hey friend. I know this week might have felt heavier than you let on. I just want you to hear this: you are not behind. You are not too late. The very fact that you\'re here, still building, still believing — that is the win. Take a breath with me. You\'re doing better than you think. 🤍',
  'Mid-week check-in from my heart to yours. Somewhere along the way we got convinced that our worth is tied to our output. It isn\'t. You were loved before you produced a single thing, and you\'ll be loved long after. Build from that place — not to earn it, but because you already have it. 🌱',
  'Can I be honest with you for a second? Some of you are one small step away from a breakthrough and you\'re thinking about quitting. Please don\'t. The seed doesn\'t look like much the day before it breaks the soil. Water it one more day. I\'m in your corner. 💛',
  'I was thinking about you today. Yes, you — the one reading this wondering if anyone notices the quiet effort. God does. This flock does. And that thing you\'re working on in the dark? It\'s going to bless people you haven\'t even met yet. Keep going, gently. ✨',
  'Wednesday reminder: comparison will rob you blind if you let it. Someone else\'s chapter twenty is not a rebuke of your chapter two. Run YOUR race, at your pace, with your heart wide open. That\'s where the magic — and the peace — actually lives. 🏃‍♀️🤍',
  'A soft word for the tired ones: rest is not quitting. Sometimes the most productive, faithful thing you can do is close the laptop, hug someone you love, and remember why you started. The work will be there tomorrow. Refill your cup first. ☕🤍',
  'Here\'s what I know for sure this week: you were made original, on purpose, for a purpose. The world doesn\'t need a watered-down copy of someone else. It needs the real, brave, imperfect you. Show up as her. She\'s the whole point. 🖤🐑',
  'Checking in on your heart, not just your hustle. How ARE you — really? If today all you did was keep going, that counts. If today you rested, that counts too. Grace over grind, always. I\'m so proud of you. 💛'
];
// Community channels. `post` = who may post: 'all' or 'admin' (admin/house only).
const CATEGORIES = {
  general:     { label: 'General Discussion', emoji: '💬', post: 'all' },
  intro:       { label: 'Introductions', emoji: '👋', post: 'all' },
  wins:        { label: 'Wins • Habits • Growth', emoji: '🏆', post: 'all' },
  help:        { label: 'Questions & Help', emoji: '🙏', post: 'all' },
  testimonial: { label: 'Testimonials', emoji: '🙌', post: 'all' },
  announce:    { label: 'P2P Announcements', emoji: '📣', post: 'admin' }
};
const CAT_ORDER = ['general', 'intro', 'wins', 'help', 'testimonial', 'announce'];
const CAT_LIST = CAT_ORDER.map(k => ({ key: k, label: CATEGORIES[k].label, emoji: CATEGORIES[k].emoji, post: CATEGORIES[k].post }));
const RANGES = { day: 864e5, week: 7 * 864e5, month: 30 * 864e5, year: 365 * 864e5 };

// House voices: which day (0 Sun..6 Sat), byline, title, and content bank.
const HOUSE = [
  { day: 1, id: 'house-frank', name: 'Frank', title: 'Let me be Frank with you…', bank: FRANK_POSTS, cursor: 'house-cursor:frank' },
  { day: 3, id: 'house-drea', name: 'Drea', title: 'Drea\'s Mid‑Week Heart Check', bank: DREA_POSTS, cursor: 'house-cursor:drea' },
  { day: 4, id: 'house-ruth', name: 'Ruth', title: 'A Word from Ruth', bank: RUTH_POSTS, cursor: 'house-cursor:ruth' },
  { day: 5, id: 'house-eric', name: 'Uncle Eric', title: 'Uncle Eric\'s Baaad Jokes', bank: ERIC_POSTS, cursor: 'house-cursor:eric' }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (!(await verifyProxySignature(url, env.client_secret))) return json({ error: 'bad signature' }, 401);

    const customerId = url.searchParams.get('logged_in_customer_id');
    const seg = url.pathname.replace(/\/+$/, '').split('/').pop() || 'progress';

    // Everything here is members-only. Anonymous visitors stay on localStorage.
    if (!customerId) return json({ ok: true, guest: true, progress: null });

    const kv = env.P2P_KV;
    try {
      /* ---------- progress (unchanged behaviour) ---------- */
      if (seg === 'progress' || seg === 'p2p' || seg === '') {
        if (request.method === 'GET') return json({ ok: true, customerId: customerId, progress: await readProgress(env, customerId) });
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);
          await writeProgress(env, customerId, body);
          return json({ ok: true });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- member public profile card ---------- */
      if (seg === 'profile') {
        if (!kv) return json({ error: 'no_store' }, 501);
        if (request.method === 'GET') return json({ ok: true, profile: await kv.get('member:' + customerId, 'json') });
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          if (!body || typeof body !== 'object') return json({ error: 'bad body' }, 400);
          const info = await customerInfo(env, customerId);
          const geo = geoFrom(request);
          const prev = await kv.get('member:' + customerId, 'json');
          const explicit = !!body.explicit;                 // true = pressed Save (strict); false = background auto-save
          const prevLow = prev && prev.name ? String(prev.name).trim().toLowerCase() : '';
          // resolve a safe, unique display name
          let name = (String(body.name || info.firstName || 'Member').slice(0, 40).trim()) || 'Member';
          if (NAME_BLOCK.test(name)) {
            if (explicit) return json({ error: 'name_blocked' }, 200);
            name = (String(info.firstName || 'Member').slice(0, 40).trim()) || 'Member';
            if (NAME_BLOCK.test(name)) name = 'Member';
          }
          let low = name.toLowerCase();
          if (low !== prevLow) {
            const holder = await kv.get('name:' + low, { type: 'text' });
            if (holder && holder !== customerId) {
              if (explicit) return json({ error: 'name_taken' }, 200);
              // background save: auto-disambiguate so onboarding never stalls
              let n = 2, base = name;
              for (;;) {
                const cand = (base + ' ' + n).slice(0, 40);
                const h = await kv.get('name:' + cand.toLowerCase(), { type: 'text' });
                if (!h || h === customerId) { name = cand; low = cand.toLowerCase(); break; }
                if (++n > 60) { name = (base + ' ' + customerId.slice(-4)).slice(0, 40); low = name.toLowerCase(); break; }
              }
            }
          }
          const rec = {
            id: customerId,
            name: name,
            tier: String(body.tier || '').slice(0, 40),
            tierNum: Number(body.tierNum) || 0,
            points: Number(body.points) || 0,
            badges: Number(body.badges) || 0,
            recentBadges: sanitizeBadges(body.recentBadges),
            streak: Number(body.streak) || 0,
            since: info.createdAt || (prev && prev.since) || null,
            photo: (String(body.photo || '').slice(0, 7) === 'preset:' ? String(body.photo).slice(0, 64) : sanitizeUrl(body.photo)),
            quote: String(body.quote || '').slice(0, 140),
            about: String(body.about || '').slice(0, 320),
            social: sanitizeSocial(body.social),
            hidden: !!body.hidden,                         // member opted out of map/directory
            adminHidden: !!(prev && prev.adminHidden),     // admin-hidden (light moderation), preserved
            city: geo.city, region: geo.region, country: geo.country, lat: geo.lat, lng: geo.lng,
            ts: Date.now()
          };
          await kv.put('member:' + customerId, JSON.stringify(rec));
          // maintain the name -> owner index that enforces uniqueness
          if (prevLow && prevLow !== low) await kv.delete('name:' + prevLow).catch(() => {});
          if (low) await kv.put('name:' + low, customerId).catch(() => {});
          // brand-new member (no prior card) → drop a one-time welcome post on the wall
          if (!prev && rec.name && rec.name !== 'Member') {
            const line = WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)].replace('{name}', rec.name);
            const wid = Date.now() + '-welcome-' + customerId;
            await kv.put('post:' + wid, JSON.stringify({ id: wid, author: 'house-welcome', name: 'P2P', text: line, kind: 'post', category: 'intro', house: true, ts: Date.now() })).catch(() => {});
          }
          return json({ ok: true, name: rec.name });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- members directory + map ---------- */
      if (seg === 'members') {
        if (!kv) return json({ ok: true, members: [] });
        const list = await kv.list({ prefix: 'member:' });
        const members = [];
        for (const k of list.keys) {
          const r = await kv.get(k.name, 'json');
          if (r && !r.hidden && !r.adminHidden) members.push(r);
        }
        const following = (await kv.get('following:' + customerId, 'json')) || [];
        return json({ ok: true, members, following });
      }

      /* ---------- follow / favorite a member (powers alerts on their new posts) ---------- */
      if (seg === 'follow') {
        if (!kv) return json({ ok: true });
        if (request.method !== 'POST') return json({ error: 'method' }, 405);
        const body = await request.json().catch(() => null);
        const target = String((body && body.name) || '').trim().toLowerCase();
        if (!target) return json({ error: 'no_name' }, 400);
        const on = !!(body && body.on);
        const fkey = 'followers:' + target;                  // who follows this member (for alerts)
        let arr = (await kv.get(fkey, 'json')) || [];
        const i = arr.indexOf(customerId);
        if (on && i === -1) arr.push(customerId); else if (!on && i > -1) arr.splice(i, 1);
        await kv.put(fkey, JSON.stringify(arr.slice(0, 5000)));
        const mkey = 'following:' + customerId;               // this member's own following list (cross-device sort)
        let mine = (await kv.get(mkey, 'json')) || [];
        const j = mine.indexOf(target);
        if (on && j === -1) mine.push(target); else if (!on && j > -1) mine.splice(j, 1);
        await kv.put(mkey, JSON.stringify(mine.slice(0, 2000)));
        return json({ ok: true });
      }

      /* ---------- community wall ---------- */
      if (seg === 'community') {
        if (!kv) return json({ ok: true, posts: [] });
        if (request.method === 'GET') {
          const list = await kv.list({ prefix: 'post:' });
          const all = [];
          for (const k of list.keys) {
            const p = await kv.get(k.name, 'json');
            if (!p) continue;
            const rs = reactState(p, customerId);
            all.push({ id: p.id, name: p.name, title: p.title || '', text: p.text, kind: p.kind, category: p.category || (p.kind === 'win' ? 'wins' : 'general'), attachments: p.attachments || [], ts: p.ts, streak: p.streak || 0, house: !!p.house, pinned: !!p.pinned, edited: !!p.edited, owner: p.author === customerId, comments: (p.comments || []).map(c => ({ id: c.id, name: c.name, text: c.text, ts: c.ts, edited: !!c.edited, owner: c.author === customerId })), reactions: rs.counts, mine: rs.mine, likes: rs.counts.love, liked: rs.mine.love });
          }
          all.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts);
          const cat = url.searchParams.get('category') || 'all';
          const q = (url.searchParams.get('q') || '').trim().toLowerCase();
          const range = url.searchParams.get('range') || 'all';
          const unreadSince = parseInt(url.searchParams.get('unreadSince') || '0', 10) || 0;
          const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));
          const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
          const isDefault = (cat === 'all' && !q && range === 'all' && !unreadSince && offset === 0);
          let rows = all;
          if (cat !== 'all') rows = rows.filter(p => p.category === cat);
          if (range !== 'all' && RANGES[range]) { const cut = Date.now() - RANGES[range]; rows = rows.filter(p => p.ts >= cut); }
          if (unreadSince) rows = rows.filter(p => p.ts > unreadSince);
          if (q) rows = rows.filter(p => (p.title + ' ' + p.text + ' ' + p.name).toLowerCase().indexOf(q) > -1);
          const total = rows.length;
          const page = rows.slice(offset, offset + limit);
          // Win of the Week (home view only): best-loved win in the last 7 days (tie → newest)
          let wow = null;
          if (isDefault) {
            const weekAgo = Date.now() - 7 * 864e5; let best = -1;
            for (const p of all) {
              if (p.kind !== 'win' || p.ts < weekAgo) continue;
              const s = p.reactions.love || 0;
              if (s > best || (s === best && (!wow || p.ts > wow.ts))) { best = s; wow = p; }
            }
          }
          return json({ ok: true, posts: page, total, hasMore: offset + limit < total, winOfWeek: wow ? wow.id : null, wowPost: wow || null, isAdmin: isAdmin(env, customerId), categories: CAT_LIST, engageTotal: await readEngageTotal(env, customerId) });
        }
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          const text = String((body && body.text) || '').trim();
          if (!text) return json({ error: 'empty' }, 400);
          const info = await customerInfo(env, customerId);
          const id = Date.now() + '-' + customerId;
          const kind = ((body && body.kind) === 'win') ? 'win' : 'post';   // wins get their own board
          const category = catFor((body && body.category) || 'general', kind, isAdmin(env, customerId));
          const meRec = await kv.get('member:' + customerId, 'json');
          const myName = (meRec && meRec.name) || String((body && body.name) || info.firstName || 'Member').slice(0, 40);
          const post = { id, author: customerId, name: myName, title: String((body && body.title) || '').slice(0, 120), text: text.slice(0, 1000), kind: kind, category: category, attachments: sanitizeAttachments(body && body.attachments), streak: Number(body && body.streak) || 0, ts: Date.now() };
          await kv.put('post:' + id, JSON.stringify(post));   // live immediately (unmoderated)
          await alertAdmin(env, post).catch(() => {});         // optional email ping to you
          // alert anyone following this member that they shared something new
          try {
            const followers = (await kv.get('followers:' + String(myName).trim().toLowerCase(), 'json')) || [];
            for (const fid of followers) {
              if (fid && fid !== customerId) await pushNotif(kv, fid, { type: 'follow', name: myName, postId: id, snippet: text.slice(0, 80), ts: Date.now() });
            }
          } catch (e) {}
          const engage = await awardEngage(env, customerId, 'post');
          return json({ ok: true, engage: engage });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- love/react on a post (toggle) ---------- */
      if (seg === 'react') {
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const pid = body && body.id;
        if (!pid) return json({ error: 'no_id' }, 400);
        const p = await kv.get('post:' + pid, 'json');
        if (!p) return json({ error: 'not_found' }, 404);
        const type = ['love', 'thumb', 'party'].indexOf(body && body.type) > -1 ? body.type : 'love';
        const r = normalizeReactions(p);
        const arr = r[type];
        const i = arr.indexOf(customerId);
        if (i > -1) arr.splice(i, 1); else arr.push(customerId);
        p.reactions = r; delete p.likedBy;
        await kv.put('post:' + pid, JSON.stringify(p));
        let engage = null;
        if (i === -1) {
          if (p.author && p.author !== customerId && String(p.author).indexOf('house-') !== 0) {
            const rinfo = await customerInfo(env, customerId);
            await pushNotif(kv, p.author, { type: 'react', rtype: type, name: rinfo.firstName || 'Someone', postId: pid, snippet: (p.text || '').slice(0, 80), ts: Date.now() });
          }
          engage = await awardEngage(env, customerId, 'like');
        }
        const rs = reactState(p, customerId);
        return json({ ok: true, reactions: rs.counts, mine: rs.mine, likes: rs.counts.love, liked: rs.mine.love, engage: engage });
      }

      /* ---------- comments on a post ---------- */
      if (seg === 'comment') {
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const pid = body && body.id;
        const text = String((body && body.text) || '').trim();
        if (!pid || !text) return json({ error: 'bad' }, 400);
        const p = await kv.get('post:' + pid, 'json');
        if (!p) return json({ error: 'not_found' }, 404);
        const info = await customerInfo(env, customerId);
        const c = { id: Date.now() + '-' + customerId, author: customerId, name: String((body && body.name) || info.firstName || 'Member').slice(0, 40), text: text.slice(0, 600), ts: Date.now() };
        p.comments = Array.isArray(p.comments) ? p.comments : [];
        p.comments.push(c);
        await kv.put('post:' + pid, JSON.stringify(p));
        if (p.author && p.author !== customerId && String(p.author).indexOf('house-') !== 0) {
          await pushNotif(kv, p.author, { type: 'comment', name: c.name, postId: pid, snippet: c.text.slice(0, 80), ts: Date.now() });
        }
        const engage = await awardEngage(env, customerId, 'comment');
        return json({ ok: true, comment: { id: c.id, name: c.name, text: c.text, ts: c.ts, edited: false, owner: true }, engage: engage });
      }

      /* ---------- notifications (bell) ---------- */
      if (seg === 'notifs') {
        if (!kv) return json({ ok: true, notifs: [], unread: 0 });
        if (request.method === 'GET') {
          const list = (await kv.get('notif:' + customerId, 'json')) || [];
          return json({ ok: true, notifs: list, unread: list.filter(n => !n.read).length });
        }
        if (request.method === 'POST') {
          const list = (await kv.get('notif:' + customerId, 'json')) || [];
          list.forEach(n => { n.read = true; });
          await kv.put('notif:' + customerId, JSON.stringify(list));
          return json({ ok: true });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- reminders (planner writes its schedule; cron fires them into the bell) ---------- */
      if (seg === 'reminders') {
        if (!kv) return json({ ok: true });
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          const items = (body && Array.isArray(body.items)) ? body.items.slice(0, 200).map(it => ({
            nid: String(it.nid || '').slice(0, 80), id: String(it.id || '').slice(0, 40), kind: String(it.kind || '').slice(0, 12),
            title: String(it.title || 'Reminder').slice(0, 120), label: String(it.label || '').slice(0, 40),
            fireAt: Number(it.fireAt) || 0, startAt: Number(it.startAt) || 0
          })).filter(it => it.nid && it.fireAt) : [];
          await kv.put('rem:' + customerId, JSON.stringify(items));
          return json({ ok: true, n: items.length });
        }
        return json({ error: 'method' }, 405);
      }

      /* ---------- GIF search (Giphy proxy — key stays server-side) ---------- */
      if (seg === 'giphy') {
        if (!env.giphy_key) return json({ ok: false, error: 'no_key', gifs: [] });
        const term = (url.searchParams.get('q') || '').trim();
        const api = term
          ? 'https://api.giphy.com/v1/gifs/search?api_key=' + env.giphy_key + '&q=' + encodeURIComponent(term) + '&limit=24&rating=pg-13'
          : 'https://api.giphy.com/v1/gifs/trending?api_key=' + env.giphy_key + '&limit=24&rating=pg-13';
        try {
          const r = await fetch(api);
          const j = await r.json();
          const gifs = (j.data || []).map(g => {
            const im = g.images || {};
            return {
              preview: (im.fixed_width && im.fixed_width.url) || (im.preview_gif && im.preview_gif.url) || '',
              url: (im.downsized_medium && im.downsized_medium.url) || (im.original && im.original.url) || ''
            };
          }).filter(g => g.url && g.preview);
          return json({ ok: true, gifs });
        } catch (e) { return json({ ok: false, error: 'giphy_fail', gifs: [] }); }
      }

      /* ---------- suggestions / questions (private → email you) ---------- */
      if (seg === 'suggest') {
        const body = await request.json().catch(() => null);
        const text = String((body && body.text) || '').trim();
        if (!text) return json({ error: 'empty' }, 400);
        const kind = String((body && body.kind) || 'Suggestion').slice(0, 40);
        const info = await customerInfo(env, customerId);
        const rec = { id: Date.now() + '-' + customerId, from: customerId, name: info.firstName || 'Member', kind: kind, text: text.slice(0, 2000), ts: Date.now() };
        if (kv) await kv.put('suggest:' + rec.id, JSON.stringify(rec)).catch(() => {});   // keep a log
        await sendEmail(env, kind + ' from ' + rec.name, rec.name + ' sent a ' + kind.toLowerCase() + ':\n\n' + rec.text).catch(() => {});
        return json({ ok: true });
      }

      /* ---------- admin (optional): delete a post — spam safety valve ---------- */
      if (seg === 'moderate') {
        if (!isAdmin(env, customerId)) return json({ error: 'forbidden' }, 403);
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const pid = body && body.id;
        if (!pid) return json({ error: 'no_id' }, 400);
        const action = body && body.action;
        if (action === 'delete') { await kv.delete('post:' + pid); return json({ ok: true }); }
        if (action === 'pin' || action === 'unpin') {
          const p = await kv.get('post:' + pid, 'json');
          if (!p) return json({ error: 'not_found' }, 404);
          p.pinned = (action === 'pin');
          await kv.put('post:' + pid, JSON.stringify(p));
          return json({ ok: true, pinned: p.pinned });
        }
        return json({ error: 'bad_action' }, 400);
      }

      /* ---------- author (or admin) edit/delete of a post ---------- */
      if (seg === 'postmod') {
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const pid = body && body.id, action = body && body.action;
        if (!pid) return json({ error: 'no_id' }, 400);
        const p = await kv.get('post:' + pid, 'json');
        if (!p) return json({ error: 'not_found' }, 404);
        const owner = p.author === customerId, admin = isAdmin(env, customerId);
        if (action === 'delete') {
          if (!owner && !admin) return json({ error: 'forbidden' }, 403);
          await kv.delete('post:' + pid);
          return json({ ok: true, deleted: true });
        }
        if (action === 'edit') {
          if (!owner) return json({ error: 'forbidden' }, 403);   // admins can remove, but not reword, a member's post
          const text = String((body && body.text) || '').trim();
          if (!text) return json({ error: 'empty' }, 400);
          p.title = String((body && body.title) || '').slice(0, 120);
          p.text = text.slice(0, 1000);
          p.edited = true; p.editedTs = Date.now();
          await kv.put('post:' + pid, JSON.stringify(p));
          return json({ ok: true });
        }
        return json({ error: 'bad_action' }, 400);
      }

      /* ---------- author (or admin / post-owner) edit/delete of a comment ---------- */
      if (seg === 'commentmod') {
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const pid = body && body.id, cid = body && body.cid, action = body && body.action;
        if (!pid || !cid) return json({ error: 'no_id' }, 400);
        const p = await kv.get('post:' + pid, 'json');
        if (!p || !Array.isArray(p.comments)) return json({ error: 'not_found' }, 404);
        const idx = p.comments.findIndex(c => c.id === cid);
        if (idx < 0) return json({ error: 'not_found' }, 404);
        const c = p.comments[idx];
        const owner = c.author === customerId, admin = isAdmin(env, customerId), postOwner = p.author === customerId;
        if (action === 'delete') {
          if (!owner && !admin && !postOwner) return json({ error: 'forbidden' }, 403);
          p.comments.splice(idx, 1);
          await kv.put('post:' + pid, JSON.stringify(p));
          return json({ ok: true, deleted: true });
        }
        if (action === 'edit') {
          if (!owner) return json({ error: 'forbidden' }, 403);
          const text = String((body && body.text) || '').trim();
          if (!text) return json({ error: 'empty' }, 400);
          c.text = text.slice(0, 600); c.edited = true; c.editedTs = Date.now();
          await kv.put('post:' + pid, JSON.stringify(p));
          return json({ ok: true });
        }
        return json({ error: 'bad_action' }, 400);
      }

      return json({ error: 'not_found' }, 404);
    } catch (e) { return json({ error: 'server', detail: String((e && e.message) || e) }, 500); }
  },

  // House voices (Frank/Drea/Ruth/Eric) — needs a Cron Trigger (e.g. daily "0 15 * * *").
  // Mon→Frank, Wed→Drea, Thu→Ruth, Fri→Eric. Advances through each bank; one post per voice per day max.
  async scheduled(event, env, ctx) {
    const kv = env.P2P_KV; if (!kv) return;
    const now = new Date();
    const dow = now.getUTCDay();                 // 0 Sun .. 6 Sat
    const today = now.toISOString().slice(0, 10);
    for (const h of HOUSE) {
      if (h.day !== dow || !h.bank.length) continue;
      if ((await kv.get('house-last:' + h.id)) === today) continue;   // already posted today
      const idx = parseInt((await kv.get(h.cursor)) || '0', 10) || 0;
      const id = Date.now() + '-' + h.id;
      await kv.put('post:' + id, JSON.stringify({ id, author: h.id, name: h.name, title: h.title, text: h.bank[idx % h.bank.length], kind: 'post', category: 'general', house: true, ts: Date.now() }));
      await kv.put(h.cursor, String(idx + 1));
      await kv.put('house-last:' + h.id, today);
    }

    /* Fire due reminders into each member's bell (works even when they're away). */
    try {
      const now = Date.now();
      const rl = await kv.list({ prefix: 'rem:' });
      for (const k of rl.keys) {
        const uid = k.name.slice(4);
        const items = (await kv.get(k.name, 'json')) || [];
        if (!items.length) continue;
        const firedKey = 'remfired:' + uid;
        const fired = (await kv.get(firedKey, 'json')) || [];
        let changed = false;
        for (const it of items) {
          if (it.fireAt <= now && it.startAt >= now - 7200000 && fired.indexOf(it.nid) < 0) {
            await pushNotif(kv, uid, { type: 'reminder', reminder: true, kind: it.kind, title: it.title, label: it.label, startAt: it.startAt, nid: it.nid, ts: now });
            fired.push(it.nid); changed = true;
          }
        }
        if (changed) await kv.put(firedKey, JSON.stringify(fired.slice(-300)));
      }
    } catch (e) {}

    /* House voices warm up recent member posts with a react (sometimes a comment) → lights the bell. */
    try {
      const HOUSE_REACTS = ['love', 'love', 'love', 'thumb', 'party'];
      const HOUSE_COMMENTS = {
        'house-frank': ['Now that’s the kind of honesty that moves the needle. Proud of you.', 'Straight talk: this is good work. Keep going.'],
        'house-drea': ['My heart — look at you showing up. 💛', 'This is exactly the kind of courage the Haus is about.'],
        'house-ruth': ['Beautifully said. You’re right where you need to be.', 'Steady steps, friend. This is how it gets built.'],
        'house-eric': ['Love this! (I’ll spare you a joke… this time. 😄)', 'Proof over promises — you did the thing!']
      };
      const HV = HOUSE.filter(h => HOUSE_COMMENTS[h.id]);
      const plist = await kv.list({ prefix: 'post:' });
      const recent = [];
      for (const k of plist.keys) {
        const p = await kv.get(k.name, 'json');
        if (!p || p.house || !p.author) continue;
        if (String(p.author).indexOf('house-') === 0) continue;
        if (Date.now() - (p.ts || 0) > 4 * 864e5) continue;
        recent.push(p);
      }
      recent.sort((a, b) => b.ts - a.ts);
      for (const p of recent.slice(0, 6)) {
        const r = normalizeReactions(p);
        const already = new Set([].concat(r.love, r.thumb, r.party));
        const avail = HV.filter(h => !already.has(h.id));
        if (!avail.length) continue;
        const h = avail[(p.ts + p.id.length) % avail.length];
        const type = HOUSE_REACTS[p.ts % HOUSE_REACTS.length];
        r[type].push(h.id); p.reactions = r; delete p.likedBy;
        let commented = false;
        if ((p.ts % 3) === 0) {
          p.comments = Array.isArray(p.comments) ? p.comments : [];
          if (!p.comments.some(c => c.author === h.id)) {
            const bank = HOUSE_COMMENTS[h.id];
            p.comments.push({ id: Date.now() + '-' + h.id, author: h.id, name: h.name, text: bank[p.ts % bank.length], ts: Date.now() });
            commented = true;
          }
        }
        await kv.put('post:' + p.id, JSON.stringify(p));
        await pushNotif(kv, p.author, commented
          ? { type: 'comment', name: h.name, postId: p.id, snippet: (p.text || '').slice(0, 80), ts: Date.now() }
          : { type: 'react', rtype: type, name: h.name, postId: p.id, snippet: (p.text || '').slice(0, 80), ts: Date.now() });
      }
    } catch (e) {}
  }
};

/* ---------- helpers ---------- */
function geoFrom(request) {
  const c = request.cf || {};
  return {
    city: c.city || '', region: c.region || '', country: c.country || '',
    lat: c.latitude ? Number(c.latitude) : null, lng: c.longitude ? Number(c.longitude) : null
  };
}
function isAdmin(env, customerId) {
  return String(env.admin_ids || '').split(',').map(s => s.trim()).filter(Boolean).indexOf(String(customerId)) !== -1;
}
function sanitizeUrl(u) {
  u = String(u || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(u) ? u.slice(0, 400) : '';
}
function sanitizeSocial(s) {
  const out = {}; if (!s || typeof s !== 'object') return out;
  ['website', 'instagram', 'facebook', 'youtube', 'x', 'linkedin', 'tiktok'].forEach(function (k) {
    const v = sanitizeUrl(s[k]); if (v) out[k] = v;
  });
  return out;
}
// A member's most-recent earned badges (for the Growth Board): [{label, emoji}], max 3.
function sanitizeBadges(a) {
  if (!Array.isArray(a)) return [];
  return a.slice(0, 3).map(function (b) {
    b = b || {};
    return { label: String(b.label || '').slice(0, 60), emoji: String(b.emoji || '🏅').slice(0, 8) };
  }).filter(function (b) { return b.label; });
}
// Post attachments: [{type:'image'|'gif'|'youtube'|'link', url, ...}], max 6, http(s) only.
function sanitizeAttachments(a) {
  if (!Array.isArray(a)) return [];
  const out = [];
  for (const raw of a.slice(0, 6)) {
    if (!raw || typeof raw !== 'object') continue;
    const type = ['image', 'gif', 'youtube', 'link'].indexOf(raw.type) > -1 ? raw.type : 'link';
    const url = sanitizeUrl(raw.url);
    if (!url) continue;
    const att = { type, url };
    if (type === 'youtube') { const vid = youTubeId(url); if (!vid) continue; att.vid = vid; }
    if (type === 'link' && raw.title) att.title = String(raw.title).slice(0, 160);
    out.push(att);
  }
  return out;
}
function youTubeId(u) {
  const m = String(u).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : '';
}
function catFor(cat, kind, isAdminPoster) {
  if (kind === 'win') return 'wins';                          // wins always land in the Wins channel
  if (!CATEGORIES[cat]) return 'general';
  if (CATEGORIES[cat].post === 'admin' && !isAdminPoster) return 'general';  // announce is admin-only
  return cat;
}
// Reactions: {love:[ids], thumb:[ids], party:[ids]}. Migrates legacy p.likedBy → love.
function normalizeReactions(p) {
  const r = (p && p.reactions) || {};
  return {
    love: Array.isArray(r.love) ? r.love : ((p && p.likedBy) || []),
    thumb: Array.isArray(r.thumb) ? r.thumb : [],
    party: Array.isArray(r.party) ? r.party : []
  };
}
function reactState(p, customerId) {
  const r = normalizeReactions(p);
  return {
    counts: { love: r.love.length, thumb: r.thumb.length, party: r.party.length },
    mine: { love: r.love.indexOf(customerId) > -1, thumb: r.thumb.indexOf(customerId) > -1, party: r.party.indexOf(customerId) > -1 }
  };
}
async function sendEmail(env, subject, text) {
  if (!env.resend_key || !env.alert_email) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.resend_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.alert_from || 'P2P Community <onboarding@resend.dev>',
      to: [env.alert_email],
      subject: subject,
      text: text
    })
  });
}
async function alertAdmin(env, post) {
  await sendEmail(env, 'New post on your community wall', post.name + ' just posted:\n\n' + post.text + '\n\nSee it in your OS → Community.');
}
// Engagement points — server-authoritative, with per-day caps + a like-farming cooldown.
const ENGAGE_CAPS = { like: 20, comment: 20, post: 15 };   // max awards per day, per kind
const ENGAGE_PTS = { like: 1, comment: 2, post: 3 };        // points per award
async function awardEngage(env, customerId, kind) {
  const kv = env.P2P_KV;
  if (!kv || !customerId) return { total: 0, awarded: 0, cooldown: false };
  const key = 'engage:' + customerId, now = Date.now(), today = new Date().toISOString().slice(0, 10);
  let e = (await kv.get(key, 'json')) || { total: 0, day: today, like: 0, comment: 0, post: 0, lastLikeTs: 0, rapid: 0, cooldownUntil: 0 };
  if (e.day !== today) { e.day = today; e.like = 0; e.comment = 0; e.post = 0; }   // daily reset (running total persists)
  let awarded = 0, cooldown = false;
  if (kind === 'like') {
    e.rapid = (e.lastLikeTs && (now - e.lastLikeTs) < 1500) ? (e.rapid || 0) + 1 : 0;
    e.lastLikeTs = now;
    if (e.cooldownUntil && now < e.cooldownUntil) cooldown = true;                 // in timeout
    else if (e.rapid >= 4) { e.cooldownUntil = now + 5 * 60 * 1000; e.rapid = 0; cooldown = true; }  // farming → 5-min timeout
    else if (e.like < ENGAGE_CAPS.like) { awarded = ENGAGE_PTS.like; e.like++; e.total += awarded; }
  } else if (kind === 'comment' && e.comment < ENGAGE_CAPS.comment) { awarded = ENGAGE_PTS.comment; e.comment++; e.total += awarded; }
  else if (kind === 'post' && e.post < ENGAGE_CAPS.post) { awarded = ENGAGE_PTS.post; e.post++; e.total += awarded; }
  await kv.put(key, JSON.stringify(e));
  return { total: e.total, awarded: awarded, cooldown: cooldown };
}
async function readEngageTotal(env, customerId) {
  const kv = env.P2P_KV; if (!kv || !customerId) return 0;
  const e = await kv.get('engage:' + customerId, 'json');
  return e ? (e.total || 0) : 0;
}
// Bell notifications — newest first, capped at 40 per member.
async function pushNotif(kv, uid, n) {
  if (!kv || !uid) return;
  const key = 'notif:' + uid;
  const list = (await kv.get(key, 'json')) || [];
  n.read = false;
  n.id = n.ts + '-' + Math.random().toString(36).slice(2, 7);
  list.unshift(n);
  await kv.put(key, JSON.stringify(list.slice(0, 40)));
}

async function verifyProxySignature(url, secret) {
  const params = []; let signature = '';
  for (const [k, v] of url.searchParams) { if (k === 'signature') { signature = v; continue; } params.push([k, v]); }
  params.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const message = params.map(([k, v]) => `${k}=${v}`).join('');
  const expected = await hmacHex(secret, message);
  return !!signature && signature.length === expected.length && timingSafeEqual(signature, expected);
}
async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function timingSafeEqual(a, b) { let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
function enc(s) { return new TextEncoder().encode(s); }

async function getToken(env) {
  if (env.admin_token) return env.admin_token;
  const now = Date.now();
  if (cachedToken && now - cachedAt < 50 * 60 * 1000) return cachedToken;
  const res = await fetch(`https://${env.shop}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: env.client_id, client_secret: env.client_secret, grant_type: 'client_credentials' })
  });
  if (!res.ok) throw new Error('token ' + res.status + ' ' + (await res.text()));
  const j = await res.json(); cachedToken = j.access_token; cachedAt = now; return cachedToken;
}
async function adminGraphQL(env, query, variables) {
  const token = await getToken(env);
  const res = await fetch(`https://${env.shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables })
  });
  const j = await res.json();
  if (j.errors) throw new Error('gql ' + JSON.stringify(j.errors));
  return j.data;
}
async function customerInfo(env, customerId) {
  try {
    const data = await adminGraphQL(env, `query($id: ID!){ customer(id:$id){ firstName createdAt } }`, { id: `gid://shopify/Customer/${customerId}` });
    const c = (data && data.customer) || {};
    return { firstName: c.firstName || '', createdAt: c.createdAt || null };
  } catch (e) { return { firstName: '', createdAt: null }; }
}
async function readProgress(env, customerId) {
  const data = await adminGraphQL(env, `query($id: ID!){ customer(id:$id){ metafield(namespace:"${NS}", key:"${KEY}"){ value } } }`, { id: `gid://shopify/Customer/${customerId}` });
  const raw = data && data.customer && data.customer.metafield && data.customer.metafield.value;
  if (!raw) return null; try { return JSON.parse(raw); } catch (e) { return null; }
}
async function writeProgress(env, customerId, progress) {
  const data = await adminGraphQL(env, `mutation($mf:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$mf){ userErrors{ field message } } }`, { mf: [{ ownerId: `gid://shopify/Customer/${customerId}`, namespace: NS, key: KEY, type: 'json', value: JSON.stringify(progress) }] });
  const errs = data && data.metafieldsSet && data.metafieldsSet.userErrors;
  if (errs && errs.length) throw new Error('set ' + JSON.stringify(errs));
}
// Serialize ASCII-only: escape every non-ASCII char (incl. emoji surrogate pairs) to \uXXXX.
// The App Proxy can re-interpret raw UTF-8 bytes on some devices and garble emojis in user
// text; pure-ASCII JSON is charset-immune and JSON.parse rebuilds the exact characters.
function json(obj, status = 200) {
  const body = JSON.stringify(obj).replace(/[\u0080-\uffff]/g, function (c) { return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4); });
  return new Response(body, { status, headers: { 'content-type': 'application/json; charset=utf-8', ...cors() } });
}
function cors() { return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' }; }
