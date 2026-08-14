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
     prefs     GET/POST     -> this member's email/SMS notification opt-ins (KV pref:<id>)

   Bell notifications (pushNotif) also fan out to each member's chosen off-site
   channels via Klaviyo: a real member event (DM / comment / follow / react /
   reminder) logs a "P2P Alert Email" and/or "P2P Alert Text" metric on their
   Klaviyo profile (email/phone pulled from Shopify, cached ~1h). Two matching
   Klaviyo flows own the actual copy. Email defaults on for high-signal events;
   SMS is opt-in and only DMs + reminders are ever eligible. House-voice bot
   engagement stays bell-only (never emails/texts).

   Emails (community posts, messages, suggestions, questions) go to env.alert_email
   (set it to hello@blacksheepcreations.com) via Resend (env.resend_key).

   Every request is App-Proxy-signed (env.client_secret) so logged_in_customer_id
   is trustworthy. Roles (owner/admin/mod) come from Shopify customer tags
   (p2p-owner / p2p-admin / p2p-mod) or the env.admin_ids owner list — resolved
   server-side + KV-cached ~5 min. See roleFor() / canModerate / canManageMembers.

   Cloudflare env:
     shop, client_id           plain vars
     client_secret             secret (also verifies the proxy signature)
     admin_token               optional secret (else client_credentials grant)
     admin_ids                 comma-separated customer ids allowed to moderate
     resend_key, alert_email   optional — email alerts on new posts (Resend free tier)
     klaviyo_key               optional secret (pk_...) — member email/SMS notifications
     klaviyo_email_metric      optional — event name for email flow (default "P2P Alert Email")
     klaviyo_sms_metric        optional — event name for SMS flow (default "P2P Alert Text")
     os_url                    optional — base link in notifications (default /pages/p2p-os)
   Cloudflare binding:
     P2P_KV                    a KV namespace (shared store for cards + posts)
*/
const API_VERSION = '2026-07';
const NS = 'custom', KEY = 'p2p_progress';
let cachedToken = null, cachedAt = 0;
let cachedRpModel = null; // discovered Gemini text model for reverse-prompt (auto-refreshes if it goes stale)

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
  '{name}, you made it. Take a breath, look around, and say hello. 🐑🖤',
  'Welcome, {name}! The flock\'s a little brighter with you in it. What are you building? 🐑',
  '{name} just joined — everybody wave! 👋 What\'s the one thing you want to make happen this month?',
  'Pull up a chair, {name}. This is the room where quiet dreams get loud enough to chase. ☕',
  'Welcome home, {name}. You don\'t have to have it figured out — you just have to show up. And you did. 🖤',
  'New in the Haus: {name}! Tell us one win you\'re after and we\'ll help you chase it.',
  'So glad you\'re here, {name}. Originals only — copies get bored and leave. 😉',
  'Welcome, {name}! Every big story in here started with a nervous first hello. Yours can be right now.',
  'The doors just opened for {name}. 🌱 What seed are you planting this season?',
  'Hey {name} — welcome to your people. We root for each other, loudly. 📣',
  '{name}\'s in the building! 🎉 Drop a hello and let\'s get to know you.',
  'Welcome, {name}. Purpose first, profit follows — and you\'re in the right Haus for both.',
  'A brand-new face! Welcome, {name}. What brought you to the flock?',
  'Glad you found us, {name}. The best time to start was yesterday; second best is this post. 🚀',
  'Welcome aboard, {name}! Small steps, shared out loud, become big stories here.',
  'Welcome to the Haus, {name}! What are you creating that the world hasn\'t seen yet?',
  'New member alert: {name}! 🐑 Say hey and tell us what you\'re working on today.',
  'So happy you\'re here, {name}. You bring something no algorithm can copy — you.',
  'Welcome, {name}! Consistency over intensity. Glad you\'re here for the long, good game.',
  'The flock grew today — welcome, {name}! Your originality is exactly what we ordered. ✨',
  'Hey {name}! Welcome in. What\'s the dream you\'re finally ready to turn into a plan?',
  'Welcome home, {name}. Come as you are; leave a little braver. 🖤',
  '{name} joined the journey — from thought to thrive, let\'s go! 🌱',
  'Warmest Black Sheep welcome to {name}! What\'s your first move going to be?',
  'Welcome, {name}! Done and shared beats perfect and hidden. Can\'t wait to see what you ship.',
  'New here, {name}? You\'re not behind. You\'re right on time. Welcome. 💛',
  'Everybody meet {name}! 👋 One fun fact and one goal — go.',
  'Welcome, {name}. Your quiet effort has a loud future. Let\'s build it together. 🔨',
  '{name}\'s here! The Haus is better with you in it. Introduce yourself when you\'re ready. 😊',
  'Welcome, {name}! We believe in the version of you that hasn\'t happened yet.',
  'So glad you walked in, {name}. This flock celebrates first sales like championships. 🏆',
  'Welcome to the flock, {name}! What would make this week a win for you?',
  'Hey {name} — you belong here. No résumé required, just a willingness to begin. 🌱',
  '{name} just arrived! Give \'em a warm welcome and a nudge to post their first goal.',
  'Welcome, {name}. The middle is where most quit — good thing you\'ve got a flock now.',
  'New face, big welcome — hi {name}! What\'s the thing you keep almost starting? Start it here.',
  'Welcome home, {name}. Your purpose was never too small or too late. Let\'s get to work. 🖤',
  '{name} is in! 🎉 The best intros are honest ones — tell us where you\'re really at today.',
  'Welcome, {name}! You were made original on purpose, for a purpose. Glad you found the flock.',
  'Hey {name}, welcome! Post the messy middle, not just the highlight reel. We\'re here for all of it.',
  'The Haus says hi to {name}! 🐑 What\'s one thing you want to learn while you\'re here?',
  'Welcome, {name}. Roots grow in the dark before anything blooms — you\'re right on schedule. 🌱',
  'So glad you\'re here, {name}! Bring your questions; this flock loves a good "how do I…"',
  'New in the flock: {name}! What are you most excited to build this year?',
  'Welcome, {name}. You don\'t need a bigger audience — you need to begin. Perfect place for it.',
  'Hey {name}! Welcome in. Your first post can be one sentence. We\'ll take it from there. 💛',
  '{name} joined us today! 🐑 Everyone drop a welcome and a little encouragement.',
  'Welcome, {name}! Progress over perfection — that\'s the whole religion around here. 💪',
  'So happy to have you, {name}. The dream that scares you a little? That\'s the one. Let\'s chase it.',
  'Welcome home, {name}. You\'ve got a flock now, and we don\'t let each other quit on the hard days.',
  'New member {name} is here! ✨ What\'s the win you\'d love to be celebrating a month from now?',
  'Welcome, {name}! You bring the courage, we\'ll bring the cheering section. 📣',
  'Hey {name} — glad you made the leap. Introduce yourself; we can\'t wait to meet you. 😊',
  'Welcome to the Haus, {name}! Every master was once a beginner who refused to stop showing up.',
  '{name}\'s in the flock! 🐑🖤 What\'s the first thing you want to make real?',
  'Welcome, {name}. Faithful in the small, unseen things — that\'s how the big things get built here.',
  'So glad you\'re here, {name}! Tell us your dream in one sentence and watch this flock rally.',
  'Welcome, {name}! You\'re allowed to want more — and you\'re in the right place to build it.',
  'New face in the Haus — welcome, {name}! What would "thriving" look like for you?',
  'Hey {name}! The flock just got stronger. Say hello and let\'s get you rooted. 🌱',
  'Welcome, {name}. Your people are here, and they\'ve been hoping you\'d walk in. 🪑',
  '{name} joined today! 🎉 Give a warm welcome and ask them what they\'re building.',
  'Welcome home, {name}. Bring the real, brave, imperfect you — she\'s the whole point. 🖤',
  'So glad you found the flock, {name}! What\'s one small step you can take this week?',
  'Welcome, {name}! We measure progress by "did you show up," not "was it perfect." You already qualify.',
  'Hey {name} — welcome in! Drop a 🐑 if you\'re ready to build something that\'s actually yours.',
  'Welcome to the Haus, {name}. The quiet work you do now compounds into something loud. Let\'s start. 🌱',
  'New in the flock: {name}! What\'s the offer, product, or idea you\'ve been sitting on? Let it out.',
  'Welcome, {name}! You didn\'t come this far to only come this far. Glad you\'re here for the whole climb. 🏔️',
  'So happy you joined, {name}! Post your first win the second you get it — we celebrate loud. 🎉'
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
  'Did you know? Consistency is a business strategy. The algorithm rewards the person who shows up on the boring days.',
  'Did you know? A niche isn\'t a cage — it\'s a magnet. The narrower your "who," the louder your "yes."',
  'Did you know? Your first draft\'s only job is to exist. You can\'t edit a blank page, but you can always sharpen a rough one.',
  'Did you know? A guarantee doesn\'t cost you sales — it removes the reason to say no. Take the risk off their plate.',
  'Did you know? One good piece of content is five. Chop the video into clips, the clips into captions, the captions into an email. Create once, publish everywhere.',
  'Did you know? Objections are a map. Every "but what about…" is telling you exactly what to put on your sales page.',
  'Did you know? Give people three prices and most pick the middle. You\'re not selling one thing — you\'re framing a choice.',
  'Did you know? A deadline is a feature. "Whenever you\'re ready" is the slowest-selling offer on earth.',
  'Did you know? Facts tell, stories sell. Wrap your proof in a before-and-after and watch it land.',
  'Did you know? If you\'re tracking ten numbers, you\'re tracking none. Pick the one that pays the bills and guard it.',
  'Did you know? Every shiny new tactic is a tax on the one that\'s already working. Finish before you chase.',
  'Did you know? Sell it before you build it. A pre-sale is the only market research that pays you.',
  'Did you know? The middle is where most quit — not the start, not the finish. Boring consistency IS the strategy.',
  'Did you know? A referral is a warm lead someone else already closed for you. Make asking part of every delivery.',
  'Did you know? A "maybe" is a slow no. Ask for the decision — it frees you both to move on or move forward.',
  'Did you know? People don\'t buy the drill, they buy the hole. Sell the result, and let the features ride along.',
  'Did you know? Your best marketing asset is a customer who got a result. Deliver so well they can\'t stay quiet.',
  'Did you know? Free content builds trust; paid offers build businesses. Give generously, then invite clearly.',
  'Did you know? The fortune\'s in the niche. "Everyone" is nobody. Speak to one person so clearly they think you\'re psychic.',
  'Did you know? A landing page has one job. Two calls-to-action is zero calls-to-action. Cut until only the ask remains.',
  'Did you know? Cash flow beats profit on paper. A sale you can\'t collect is a compliment, not income.',
  'Did you know? Your price trains your customer. Discount too often and you teach them to wait for the sale.',
  'Did you know? The best time to ask for a testimonial is the moment they say "this is amazing." Catch it in the wild.',
  'Did you know? Speed is a feature. The business that answers first usually wins the sale — not the best one, the fastest.',
  'Did you know? You can\'t scale chaos. Write the process down once, and future-you stops reinventing the wheel weekly.',
  'Did you know? An audience you don\'t email is a garden you never water. Send the message. Someone\'s waiting for it.',
  'Did you know? Features are what it does; benefits are what they get. Sell the benefit; only nerds buy features.',
  'Did you know? Your offer isn\'t too expensive — it\'s under-explained. Value gets cheap when the transformation stays vague.',
  'Did you know? The riches are in the reorder. It\'s 5x cheaper to sell again than to find someone new. Serve the ones you have.',
  'Did you know? "Let me think about it" usually means "I don\'t see the value yet." That\'s your cue to clarify, not chase.',
  'Did you know? One clear headline outsells ten clever ones. Confused people don\'t buy — they leave.',
  'Did you know? Your competition isn\'t other sellers — it\'s the customer\'s inertia. You\'re not fighting them, you\'re fighting "not yet."',
  'Did you know? Batch the boring. Record five videos in one sitting and you buy back four future mornings.',
  'Did you know? A refund policy isn\'t a weakness — it\'s a sales tool. Remove the risk and you remove the reason to hesitate.',
  'Did you know? You don\'t rise to your goals, you fall to your systems. Build the boring machine that makes wins automatic.',
  'Did you know? Momentum is a real asset. One shipped thing makes the next one easier. Start ugly, but start today.',
  'Did you know? The customer\'s own words are your best copy. Read your reviews and steal the exact phrases they use.',
  'Did you know? Simple scales, fancy fails. If your funnel needs a diagram to explain, your buyer already left.',
  'Did you know? A bonus can close a sale a discount can\'t. Add value instead of subtracting price — you keep your margin AND your dignity.',
  'Did you know? You\'re one email away from your next sale and one excuse away from never sending it. Hit send.',
  'Did you know? Track leads, sales, and one profit number. Everything else is a hobby dressed up as "analytics."',
  'Did you know? Your first hundred customers should feel handmade. Delight them personally now; automate the love later.',
  'Did you know? The offer is the business. You can fix bad copy and ugly design — you can\'t out-market an offer nobody wants.',
  'Did you know? Urgency without a reason feels like a trick. Give a real "why now" and the deadline does the closing for you.',
  'Did you know? Selling isn\'t convincing — it\'s showing the right person the thing they already wanted. Find the right person first.',
  'Did you know? Your "boring" behind-the-scenes is someone\'s favorite content. Show the work; people root for the builder.',
  'Did you know? Every abandoned cart is a raised hand. One follow-up email recovers sales you already earned.',
  'Did you know? Position, don\'t compete. You don\'t have to be better than everyone — just clearly different to the right someone.',
  'Did you know? The second sale is where trust is built. Over-deliver on the small offer and the big one sells itself.'
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
  'Gentle truth: you were made original on purpose, for a purpose. Don\'t shrink to fit someone else\'s box.',
  'A gentle reminder: you\'re not late. Flowers don\'t bloom in the same month, and neither do callings.',
  'Something to hold onto: faithfulness in the small, unseen things is still faithfulness. Heaven keeps different books than the algorithm.',
  'A soft truth: you can\'t pour from an empty cup, and you were never meant to. Fill up first, then overflow.',
  'Today\'s word: the good things being grown in you can\'t be rushed. Trust the timing you can\'t see yet.',
  'A gentle nudge: tend your work like a garden, not a machine. Some days you plant, some you water, some you just wait.',
  'Remember: it\'s okay to be a beginner. Every master you admire once fumbled through the exact page you\'re on today.',
  'Something to sit with: the harvest comes for the one who keeps planting, not the one who keeps measuring the soil.',
  'A soft reminder: your quiet, behind-the-scenes obedience is building something loud. Keep showing up when no one\'s clapping.',
  'A thought for today: gratitude turns what you have into enough. Name one good thing before you chase the next.',
  'Gentle truth: your pace is not a problem to fix. Slow and rooted outlasts fast and shallow every time.',
  'Remember: rest is an act of trust — a way of saying the world keeps turning even when you set the work down.',
  'A kind word: don\'t let a hard season convince you the whole story is hard. Chapters change. Keep turning the page.',
  'Something true: you were planted, not buried. What feels like the dark is just the soil doing its quiet work. 🌱',
  'A gentle reminder: you are not behind. Seeds and stars keep different clocks, and so does your calling. 🌱',
  'Something to sit with: the work will still be there tomorrow. Your peace might not be. Guard the peace first.',
  'A soft word: you were planted, not buried. What feels like burial is just the soil doing quiet, holy work. 🌱',
  'Remember: a slow yes is still a yes. Don\'t despise the small, faithful beginning — it\'s where every harvest hides.',
  'Gentle truth: you can\'t rush a root. The things being grown in you have their own good timing. Trust it. 🤍',
  'A thought for today: tend, don\'t strain. Some days you plant, some you water, some you simply wait in faith.',
  'Something true: your quiet obedience isn\'t invisible. Heaven keeps a different ledger than the engagement graph.',
  'A gentle nudge: rest is not the reward for the work — it\'s part of the work. Lay it down and trust it holds.',
  'Remember: comparison is a thief that only takes when you open the door. Keep your eyes on your own row. 🌱',
  'A soft reminder: you don\'t have to feel ready to be faithful. Show up shaky. Faith moves before feelings catch up.',
  'Something to hold onto: the same sun that hardens clay softens wax. It\'s not the season — it\'s what you\'re made of.',
  'Gentle truth: your worth was settled before you produced a thing. Build from "already loved," not "trying to earn." 🖤',
  'A thought: gratitude waters everything it touches. Name one good thing before you reach for the next hard one.',
  'Remember: the harvest belongs to the one who keeps sowing, not the one who keeps measuring the soil. Keep sowing.',
  'A gentle word: be as tender with yourself as you\'d be with a friend on her very first day. She\'d get grace. So do you.',
  'Something to sit with: a hard season isn\'t the whole story — it\'s a chapter. Keep turning the page. 🤍',
  'A soft truth: you were made original, on purpose, for a purpose. Don\'t file down your edges to fit a smaller box.',
  'Remember: still counts as growing. Roots deepen most in the seasons that look, from the outside, like nothing.',
  'Gentle reminder: courage isn\'t the absence of shaking — it\'s the decision to keep going while you shake. ✨',
  'A thought for today: you\'re allowed to bloom late and bloom beautifully. Nothing about your pace is a problem to fix.',
  'Something true: what you water grows. Fear or faith, worry or work — feed the one you want to see. 🌱',
  'A gentle nudge: don\'t quit on a Tuesday you\'re tired. Rest, then decide. Weary and faithful can be the same person.',
  'Remember: the flock grows stronger when we cheer each other loudly. Whose small win can you celebrate today?',
  'A soft reminder: you can\'t pour from an empty cup, and you were never asked to. Fill first. Then let it overflow. ☕',
  'Something to hold: the small, unseen faithful thing is still the thing. It\'s quietly building something loud. 🤍',
  'Gentle truth: your calling isn\'t a competition. There\'s room at this table for your gift and hers. Both can flourish.',
  'A thought: perfectionism is fear in a nice outfit. Ship the honest, imperfect thing — it blesses more than the polished ghost.',
  'Remember: you were given this exact voice for a reason. Don\'t hush the very thing you were sent to say. 🖤',
  'A gentle word: on the days you can\'t see progress, remember roots. They grow in the dark long before the bloom. 🌱',
  'Something to sit with: rest is a way of trusting the world keeps turning even when you set the work down.',
  'A soft truth: you don\'t have to earn your place at this table. Grace put your chair here. Sit down and stay. 🪑',
  'Remember: the dream that keeps tapping your shoulder isn\'t going away — because it was never meant to. Answer it gently.',
  'Gentle reminder: don\'t measure your behind-the-scenes against someone else\'s highlight reel. You\'re comparing a rough draft to a finished one.',
  'A thought for today: faithfulness in the little you have now is how the more gets entrusted later. Steward this. 🌱',
  'Something true: you are loved on the days you produce nothing. Let that steady you, then build from the overflow. 🤍'
];
// Shared "Tuesday's Terrible Joke of the Day" bank — a rotating cast member (see JOKE_CAST) delivers one each Tuesday.
const JOKE_POSTS = [
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
  'I entered the annual pun contest and submitted ten. I figured no pun in ten did — but I showed up anyway. That\'s the whole lesson, kid. 😉',
  'Why did the marketer break up with the calendar? Too many dates that never converted. 📅',
  'I asked my funnel why it was so tired. It said it\'d been running on leads all day. Same, buddy. Same. 😅',
  'Why don\'t sales pages ever get cold? They\'ve always got great conversion. 🔥',
  'I tried to write a joke about SEO, but nobody\'s going to find it anyway. 🔍',
  'What did the invoice say to the client? "You complete me… please." 💸',
  'My business coach told me to find my "why." I found it under the couch with three of my other unfinished ideas. 🛋️',
  'Why did the entrepreneur plant seeds in his spreadsheet? He wanted his numbers to grow organically. 🌱',
  'I named my newsletter "The Procrastinator." First issue coming… eventually. 📬',
  'Why did the logo go to therapy? It had too many unresolved design issues. 🎨',
  'I told my to-do list I\'d get to it later. It\'s now my to-do legacy. 📜',
  'What do you call a sheep that closes every sale? An ewephoric closer. 🐑',
  'My printer and I have the same business model: we both jam right before something important. 🖨️',
  'Why did the startup bring a broom to the pitch? They heard it was time to clean up in the market. 🧹',
  'I finally monetized my hobby. Now I have an expensive hobby AND a stressful job. Progress! 🎉',
  'Why don\'t budgets ever win arguments? They always get overruled. 💰',
  'I asked my analytics what my bounce rate meant. It left before answering. 📉',
  'What\'s an entrepreneur\'s favorite kind of music? Anything with a strong hook. 🎣',
  'My password is the last four digits of my revenue goal. Very secure — nobody\'s ever guessing it. 🔒',
  'Why did the coffee start a business? It was tired of being grounds for complaints. ☕',
  'I put "self-starter" on my résumé, then hit snooze nine times. We contain multitudes. ⏰',
  'Why did the email campaign go to the gym? It wanted a better open rate. 💪',
  'My accountant said my books were a work of fiction. I said thank you — I\'ve always wanted to be an author. 📚',
  'What do you call a mattress that runs a subscription business? Recurring rest-venue. 🛏️',
  'I built a passive income stream. It\'s so passive it hasn\'t done anything yet. But we\'re patient. 🌊'
];
// Tuesday's rotating cast — each week a different voice tells the shared groaner above, in-character.
const JOKE_CAST = [
  { name: 'Frank',      intro: 'Against my better judgment… here\'s your Tuesday groaner:' },
  { name: 'Ruth',       intro: 'They say laughter\'s good medicine — so here\'s your dose: 😊' },
  { name: 'Drea',       intro: 'Okay friend, you\'ve earned a good groan today. Ready? 💛' },
  { name: 'Uncle Eric', intro: 'Buckle up, buttercup — you knew this was coming: 🖤🐑' }
];
// Uncle Eric's Friday memes (image posts). Hosted as theme assets on the live theme; cursor-rotates like the text banks.
const ERIC_MEMES = [
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-01.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-02.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-03.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-04.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-05.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-06.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-07.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-08.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-09.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-10.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-11.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-12.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-13.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-14.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-15.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-16.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-17.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-18.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-19.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-20.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-21.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-22.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-23.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-24.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-25.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-26.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-27.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-28.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-29.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-30.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-31.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-32.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-33.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-34.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-35.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-36.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-37.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-38.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-39.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-40.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-41.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-42.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-43.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-44.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-45.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-46.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-47.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-48.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-49.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-50.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-51.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-52.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-53.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-54.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-55.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-56.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-57.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-58.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-59.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-60.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-61.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-62.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-63.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-64.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-65.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-66.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-67.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-68.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-69.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-70.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-71.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-72.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-73.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-74.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-75.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-76.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-77.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-78.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-79.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-80.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-81.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-82.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-83.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-84.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-85.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-86.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-87.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-88.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-89.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-90.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-91.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-92.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-93.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-94.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-95.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-96.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-97.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-98.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-99.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-100.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-101.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-102.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-103.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-104.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-105.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-106.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-107.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-108.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-109.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-110.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-111.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-112.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-113.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-114.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-115.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-116.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-117.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-118.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-119.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-120.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-121.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-122.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-123.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-124.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-125.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-126.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-127.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-128.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-129.jpg',
  'https://blacksheepcreations.com/cdn/shop/t/8/assets/eric-meme-130.jpg'
];
const DREA_POSTS = [
  'Hey friend. I know this week might have felt heavier than you let on. I just want you to hear this: you are not behind. You are not too late. The very fact that you\'re here, still building, still believing — that is the win. Take a breath with me. You\'re doing better than you think. 🤍',
  'Mid-week check-in from my heart to yours. Somewhere along the way we got convinced that our worth is tied to our output. It isn\'t. You were loved before you produced a single thing, and you\'ll be loved long after. Build from that place — not to earn it, but because you already have it. 🌱',
  'Can I be honest with you for a second? Some of you are one small step away from a breakthrough and you\'re thinking about quitting. Please don\'t. The seed doesn\'t look like much the day before it breaks the soil. Water it one more day. I\'m in your corner. 💛',
  'I was thinking about you today. Yes, you — the one reading this wondering if anyone notices the quiet effort. God does. This flock does. And that thing you\'re working on in the dark? It\'s going to bless people you haven\'t even met yet. Keep going, gently. ✨',
  'Wednesday reminder: comparison will rob you blind if you let it. Someone else\'s chapter twenty is not a rebuke of your chapter two. Run YOUR race, at your pace, with your heart wide open. That\'s where the magic — and the peace — actually lives. 🏃‍♀️🤍',
  'A soft word for the tired ones: rest is not quitting. Sometimes the most productive, faithful thing you can do is close the laptop, hug someone you love, and remember why you started. The work will be there tomorrow. Refill your cup first. ☕🤍',
  'Here\'s what I know for sure this week: you were made original, on purpose, for a purpose. The world doesn\'t need a watered-down copy of someone else. It needs the real, brave, imperfect you. Show up as her. She\'s the whole point. 🖤🐑',
  'Checking in on your heart, not just your hustle. How ARE you — really? If today all you did was keep going, that counts. If today you rested, that counts too. Grace over grind, always. I\'m so proud of you. 💛',
  'Hey friend. If today felt like carrying something heavy and smiling anyway — I see you. You don\'t have to have it all together to belong here. Come as you are. 🤍',
  'Mid-week heart check: the thing you keep almost-quitting, the one that scares you? That\'s usually the exact thing you were made for. Fear and calling live really close together. Stay one more day. 💛',
  'Can I tell you something? The message you almost didn\'t send — someone out there needed it. Your courage is somebody else\'s answered prayer. Send it. Post it. Show up. ✨',
  'I know some of you are tired in a way sleep doesn\'t fix. You\'re allowed to slow down without stopping. Faithful and weary can be the same person. Be gentle with her today. 🌱',
  'Little reminder: celebrate the small wins out loud. The first sale, the first yes, the first brave post. Joy you skip past is joy you lose. Let yourself be proud. 🎉',
  'That dream that keeps tapping you on the shoulder isn\'t going away, because it\'s not supposed to. Stop asking if you\'re qualified and start asking who you can help first. 🖤',
  'Your story — the messy middle, not just the highlight reel — is the thing that connects with people. Don\'t polish away the parts that make you relatable. 🤍',
  'It\'s okay to want more. Wanting to grow, to earn, to be seen for your work isn\'t greed — it\'s stewardship of the gift you were given. Chase it without apologizing. 💛',
  'To the one in the lonely middle — past the excitement, not yet at the finish — this is where it counts. The view changes for the ones who don\'t turn around. 🏔️',
  'Gentle truth for the compare-and-scroll days: social media is everyone\'s trailer, not their movie. Stop measuring your behind-the-scenes against their highlight reel. 🏃‍♀️',
  'Hear this: the quiet work you do when no one\'s watching is not invisible. God sees it, the flock feels it, and it\'s compounding into something you can\'t see yet. 🌱',
  'You are not "too much." Not too loud, too big, too ambitious, too tender. The people meant for you are looking for exactly the amount of you that you are. 💛',
  'When you want to quit — and you will, we all do — don\'t decide on your worst day. Rest, breathe, come back tomorrow. Quitting is a call for a rested mind, not a tired one. 🤍',
  'Your people are coming — the ones who\'ll say "this changed everything for me." Keep showing up for the empty room now, so it\'s full and ready when they arrive. 🪑',
  'Imperfect action beats perfect intentions every time. The half-finished thing you shipped is worth more than the masterpiece still hiding in your head. 💪',
  'Talk to yourself like you\'d talk to a friend just starting out. You\'d never call her behind, or dumb, or too late. Extend that same grace to the woman in the mirror. 🖤',
  'Never underestimate the ripple. One thing you make, one person you help — it reaches people you\'ll never meet. You\'re planting shade trees for strangers. Keep planting. 🌳',
  'Hey friend. If this week asked more of you than it gave back — I see you. You\'re not failing; you\'re carrying a lot with grace. Set something down today. You\'re allowed. 🤍',
  'Can I be honest? Some of you are measuring your worth by a number on a screen. Please stop. You were loved before the metrics and you\'ll be loved long after them. Build from that. 🖤',
  'I was thinking about you today — the one doing the quiet work no one\'s clapping for yet. It\'s not invisible. It\'s compounding. Keep going, gently. 🌱',
  'Hey friend. Rest isn\'t the opposite of ambition; it\'s the fuel for it. Close the laptop tonight without guilt. The dream will keep. So should you. ☕🤍',
  'Wednesday truth: you don\'t have to be everywhere to be enough somewhere. Show up fully in one place today. Depth beats scattered every single time. 💛',
  'Friend, that comparison spiral you\'re in? Someone\'s chapter twenty isn\'t a verdict on your chapter two. Run your race, your pace. That\'s where the peace lives. 🏃‍♀️',
  'Little reminder from my heart: your story — the messy middle, not the highlight reel — is the part that heals people. Don\'t polish away what makes you human. 🖤',
  'Hey you. The message you almost didn\'t send is the one somebody\'s been praying for. Your courage is their answered prayer. Post it. Send it. Show up. ✨',
  'Mid-week check-in: you\'re allowed to want more without feeling greedy. Wanting to grow and be seen for your work is stewardship, not vanity. Chase it, unapologetic. 💛',
  'Can I tell you something true? You\'re not too much. Not too loud, too big, too tender, too ambitious. The right people are looking for exactly your amount of you. 🤍',
  'Hey friend. If today was "keep going while smiling through something heavy," I see it, and it counts. You don\'t have to have it together to belong here. Come as you are. 🤍',
  'Heart check: celebrate the small wins OUT LOUD. The first yes, the first sale, the first brave post. Joy you rush past is joy you lose. Let yourself be proud today. 🎉',
  'Friend, the dream tapping your shoulder isn\'t leaving because it\'s not supposed to. Stop asking if you\'re qualified. Start asking who you can help first. 🖤',
  'Gentle nudge for the tired ones: faithful and weary can be the same person. You\'re allowed to slow down without stopping. Be soft with her today. 🌱',
  'Hey you. Imperfect action beats perfect intentions every time. The half-finished thing you shipped is worth more than the masterpiece hiding in your head. 💪',
  'Mid-week reminder: talk to yourself like you\'d talk to a friend just starting out. You\'d never call her behind, or dumb, or too late. Give the mirror that same grace. 🖤',
  'Can I be real with you? Your people are coming — the ones who\'ll say "this changed everything." Keep showing up for the empty room so it\'s ready when they arrive. 🪑',
  'Friend, never underestimate the ripple. One thing you make, one person you help — it reaches people you\'ll never meet. You\'re planting shade for strangers. Keep planting. 🌳',
  'Heart check from me to you: when you want to quit — and you will, we all do — don\'t decide it on your worst day. Rest first. Quitting is a call for a rested mind. 🤍',
  'Hey friend. Somewhere you got told your value depends on your productivity. It\'s a lie. You are the point, not your output. Breathe. You\'re already enough. 💛',
  'Mid-week truth: the courage it took to even start this is more than most people ever find. Don\'t let a slow week erase a brave decision. Keep going. ✨',
  'Checking in: you\'re allowed to have a day where the win is simply that you didn\'t give up. Some seasons, staying is the whole victory. I\'m cheering for you. 🖤',
  'Friend, stop waiting to feel ready. Ready is a feeling that shows up after you begin, not before. Take the first small, imperfect step today. I\'ll be right here. 🌱',
  'Hey you. Your pace is not a character flaw. Slow and rooted outlasts fast and shallow every time. Trust the timing you can\'t see yet. 🤍',
  'Mid-week heart check: don\'t shrink your dream to make other people comfortable. The world doesn\'t need a smaller you. It needs the real, brave, whole you. 🖤',
  'Can I remind you of something? God doesn\'t waste a single season — not even the hard, quiet, nothing-seems-to-be-working ones. It\'s all being used. Keep the faith. ✨',
  'Friend, the fact that you\'re still here — still building, still believing after everything — that IS the win. Take a breath with me. You\'re doing better than you think. 💛'
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
  { day: 2, id: 'house-joke', kind: 'joke', title: 'Tuesday\'s Terrible Joke of the Day', bank: JOKE_POSTS, cursor: 'house-cursor:joke', castCursor: 'house-cursor:jokecast' },
  { day: 3, id: 'house-drea', name: 'Drea', title: 'Drea\'s Mid‑Week Heart Check', bank: DREA_POSTS, cursor: 'house-cursor:drea' },
  { day: 0, id: 'house-ruth', name: 'Ruth', title: 'A Word from Ruth', bank: RUTH_POSTS, cursor: 'house-cursor:ruth' },
  { day: 5, id: 'house-eric', name: 'Uncle Eric', kind: 'meme', title: 'A lil\' Snark Before the Weekend', bank: ERIC_MEMES, cursor: 'house-cursor:eric' }
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

      /* ---------- reverse image prompt (TEXT ONLY — never generates an image) ----------
         Reads an uploaded reference image and returns a detailed, reusable
         text-to-image prompt that recreates it. It AUTO-DISCOVERS a currently-
         available Gemini TEXT model from the key (image IN, text OUT) rather than
         hardcoding a model name that Google can deprecate — and it explicitly
         excludes any image/imagen model, so it is physically incapable of
         generating an image and can NEVER incur an image-generation charge.
         Members-only (guests are already rejected above). Needs secret gemini_key. */
      if (seg === 'reverse-prompt') {
        if (request.method !== 'POST') return json({ error: 'method' }, 405);
        if (!env.gemini_key) return json({ error: 'not_configured' }, 501);
        const rbody = await request.json().catch(() => null);
        const m = /^data:([^;]+);base64,(.*)$/.exec((rbody && rbody.image) || '');
        if (!m) return json({ error: 'bad_image' }, 400);
        if (m[2].length > 7 * 1024 * 1024) return json({ error: 'too_large' }, 413);
        const instruction =
          'Look at this image and write ONE detailed, reusable text-to-image generation prompt that would let an AI recreate it. ' +
          'Describe the subject, composition, art style, colors, lighting, mood, and background in vivid, specific language. ' +
          'Output ONLY the prompt text — no preamble, no headings, no explanation.';
        const rpParts = [{ text: instruction }, { inline_data: { mime_type: m[1], data: m[2] } }];
        const rpBase = 'https://generativelanguage.googleapis.com/v1beta/';

        function rpCall(modelName, parts) {
          return fetch(rpBase + modelName + ':generateContent?key=' + env.gemini_key, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: parts }], generationConfig: { temperature: 0.4 } }),
          });
        }
        // Usable TEXT models for this key, cheapest/most-current first, never an
        // image model. ListModels can list a model the key isn't actually allowed
        // to CALL (e.g. "no longer available to new users"), so we PROBE each with
        // a tiny request and use the first that truly works.
        async function rpModels() {
          const lr = await fetch(rpBase + 'models?key=' + env.gemini_key);
          const lj = await lr.json().catch(() => null);
          const usable = ((lj && lj.models) || []).filter(function (mm) {
            return (mm.supportedGenerationMethods || []).indexOf('generateContent') !== -1 &&
                   !/image|imagen|embedding|aqa|tts|veo/i.test(mm.name || '');
          }).map(function (mm) { return mm.name; });
          function rank(n) { n = n.toLowerCase(); var s = 0; if (/flash/.test(n)) s -= 2; if (/lite/.test(n)) s -= 1; if (/latest/.test(n)) s -= 1; if (/pro/.test(n)) s += 2; return s; }
          return usable.sort(function (a, b) { return rank(a) - rank(b); });
        }
        async function rpProbe(name) { try { return (await rpCall(name, [{ text: 'ping' }])).ok; } catch (e) { return false; } }

        let gres, gj;
        try {
          if (!cachedRpModel) {
            const models = await rpModels();
            for (let i = 0; i < models.length; i++) { if (await rpProbe(models[i])) { cachedRpModel = models[i]; break; } }
          }
          if (!cachedRpModel) return json({ error: 'No usable Gemini text model is available for this API key.' }, 502);
          gres = await rpCall(cachedRpModel, rpParts);
          gj = await gres.json().catch(() => null);
          if (!gres.ok) { // cached model went stale — find another that actually works
            const bad = cachedRpModel; cachedRpModel = null;
            const models = await rpModels();
            for (let i = 0; i < models.length; i++) {
              if (models[i] !== bad && await rpProbe(models[i])) { cachedRpModel = models[i]; gres = await rpCall(cachedRpModel, rpParts); gj = await gres.json().catch(() => null); break; }
            }
          }
        } catch (e) { return json({ error: 'Could not reach the prompt reader. Please try again.' }, 502); }
        if (!gres || !gres.ok) return json({ error: (gj && gj.error && gj.error.message) || 'Prompt reading failed.' }, (gres && gres.status >= 400 && gres.status < 500) ? 400 : 502);
        const gparts = (gj && gj.candidates && gj.candidates[0] && gj.candidates[0].content && gj.candidates[0].content.parts) || [];
        // Defensive: only ever surface TEXT — any non-text part is ignored.
        const promptText = gparts.map(function (p) { return p.text || ''; }).join('').trim();
        if (!promptText) return json({ error: 'The reader didn\'t return a prompt — try a different image.' }, 422);
        return json({ ok: true, prompt: promptText });
      }

      /* ---------- member public profile card ---------- */
      if (seg === 'profile') {
        if (!kv) return json({ error: 'no_store' }, 501);
        if (request.method === 'GET') {
          const rec = await kv.get('member:' + customerId, 'json');
          const myLow = rec && rec.name ? String(rec.name).trim().toLowerCase() : '';
          async function chips(cids) { const out = []; for (const cid of (cids || []).slice(0, 200)) { const r = await kv.get('member:' + cid, 'json'); out.push({ id: cid, name: (r && r.name) || 'Member', photo: (r && r.photo) || '' }); } return out; }
          const followerCids = myLow ? ((await kv.get('followers:' + myLow, 'json')) || []) : [];
          const followers = await chips(followerCids);
          const blocked = await chips((await kv.get('blocked:' + customerId, 'json')) || []);
          return json({ ok: true, profile: rec, followers: followers, blocked: blocked });
        }
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
          // Location: a member-set city (typeahead) wins over the auto edge-geo. body.location is
          //   { label, lat, lng } to set a custom pin, null to revert to auto, or absent to keep as-is.
          let loc;
          if (body.location === null) loc = null;
          else if (body.location) loc = sanitizeLoc(body.location);
          else if (prev && prev.customLoc) loc = { label: prev.city, lat: prev.lat, lng: prev.lng };
          else loc = null;
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
            photo: (function () { const ph = String(body.photo || ''); if (ph.slice(0, 7) === 'preset:') return ph.slice(0, 64); if (ph.slice(0, 17) === '/apps/p2p/imgget?') return ph.slice(0, 200); return sanitizeUrl(ph); })(),
            quote: String(body.quote || '').slice(0, 140),
            about: String(body.about || '').slice(0, 320),
            social: sanitizeSocial(body.social),
            email: (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(body.email || '').trim()) ? String(body.email).trim().slice(0, 120) : ''),
            showEmail: !!body.show_email,                  // opted in to a click-to-reveal "Email me" button (never in the bulk list)
            hidden: !!body.hidden,                         // member opted out of map/directory
            adminHidden: !!(prev && prev.adminHidden),     // admin-hidden (light moderation), preserved
            city: loc ? loc.label : geo.city, region: loc ? '' : geo.region, country: loc ? '' : geo.country,
            lat: loc ? loc.lat : geo.lat, lng: loc ? loc.lng : geo.lng, customLoc: !!loc,
            ts: Date.now()
          };
          await kv.put('member:' + customerId, JSON.stringify(rec));
          // maintain the name -> owner index that enforces uniqueness
          if (prevLow && prevLow !== low) await kv.delete('name:' + prevLow).catch(() => {});
          if (low) await kv.put('name:' + low, customerId).catch(() => {});
          // daily points snapshot → powers the Growth Board's 7d/30d windows (fills in going forward)
          try {
            const todayNum = Math.floor(Date.now() / 86400000);
            let snaps = (await kv.get('snap:' + customerId, 'json')) || [];
            if (snaps.length && snaps[snaps.length - 1].d === todayNum) snaps[snaps.length - 1].p = rec.points;
            else snaps.push({ d: todayNum, p: rec.points });
            if (snaps.length > 40) snaps = snaps.slice(-40);
            await kv.put('snap:' + customerId, JSON.stringify(snaps));
          } catch (e) {}
          // Name changed → refresh it on this member's existing posts + comments so old content shows the new identity (avatars are looked up by name, so this fixes those too).
          if (prevLow && prevLow !== low) {
            try {
              const pl = await kv.list({ prefix: 'post:' });
              for (const pk of pl.keys) {
                const pp = await kv.get(pk.name, 'json'); if (!pp) continue;
                let changed = false;
                if (pp.author === customerId && pp.name !== name) { pp.name = name; changed = true; }
                if (Array.isArray(pp.comments)) { for (const c of pp.comments) { if (c.author === customerId && c.name !== name) { c.name = name; changed = true; } } }
                if (changed) await kv.put(pk.name, JSON.stringify(pp));
              }
            } catch (e) {}
          }
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
        const viewerRole = await roleFor(env, customerId, kv);
        const canManage = canManageMembers(viewerRole);
        const list = await kv.list({ prefix: 'member:' });
        const members = [];
        const todayNum = Math.floor(Date.now() / 86400000);
        function windowGain(snaps, cur, w) {
          if (!snaps || !snaps.length) return 0;
          const cutoff = todayNum - w; let base = null;
          for (const s of snaps) { if (s.d <= cutoff) base = s; }   // most recent snapshot at/older than the window edge
          if (!base) base = snaps[0];                                 // newer than the window → count gains since first seen
          return Math.max(0, (cur || 0) - (base.p || 0));
        }
        for (const k of list.keys) {
          const r = await kv.get(k.name, 'json');
          if (r && !r.hidden && !r.adminHidden && (!r.banned || canManage)) {
            const hasEmail = !!(r.showEmail && r.email);
            delete r.email;            // never expose the raw address in the bulk list — revealed only on-demand, one at a time
            r.hasEmail = hasEmail;
            const snaps = await kv.get('snap:' + r.id, 'json');
            r.d7 = windowGain(snaps, r.points, 7);
            r.d30 = windowGain(snaps, r.points, 30);
            members.push(r);
          }
        }
        const following = (await kv.get('following:' + customerId, 'json')) || [];
        return json({ ok: true, members, following, viewerRole: viewerRole, canManageMembers: canManage });
      }

      /* ---------- image upload → R2 (avatars now; post media later) ---------- */
      if (seg === 'upload') {
        if (request.method !== 'POST') return json({ error: 'method' }, 405);
        if (!customerId) return json({ error: 'guest' }, 401);
        if (!env.MEDIA) return json({ error: 'no_store' }, 501);   // R2 bucket not bound yet
        const body = await request.json().catch(() => null);
        const m = /^data:(image\/(png|jpe?g|webp|gif));base64,(.+)$/i.exec(String((body && body.data) || ''));
        if (!m) return json({ error: 'bad_image' }, 400);
        const ct = m[1].toLowerCase();
        const ext = ct.indexOf('png') > -1 ? 'png' : ct.indexOf('webp') > -1 ? 'webp' : ct.indexOf('gif') > -1 ? 'gif' : 'jpg';
        let bytes;
        try { bytes = Uint8Array.from(atob(m[3]), c => c.charCodeAt(0)); } catch (e) { return json({ error: 'bad_image' }, 400); }
        if (bytes.length > 3 * 1024 * 1024) return json({ error: 'too_large' }, 413);   // 3MB after client-side resize
        const kind = (body.kind === 'avatar' || body.kind === 'post') ? body.kind : 'misc';
        const key = kind + '_' + customerId + '_' + Date.now() + '.' + ext;
        await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: ct } });
        const base = (env.r2_public_base || '').replace(/\/+$/, '');
        return json({ ok: true, url: base ? (base + '/' + key) : ('/apps/p2p/imgget?key=' + encodeURIComponent(key)) });
      }
      /* ---------- serve an R2 image (fallback when no public bucket URL is set) ---------- */
      if (seg === 'imgget') {
        if (!env.MEDIA) return new Response('not found', { status: 404 });
        const key = url.searchParams.get('key') || '';
        const obj = key ? await env.MEDIA.get(key) : null;
        if (!obj) return new Response('not found', { status: 404 });
        const h = new Headers(); obj.writeHttpMetadata(h); h.set('Cache-Control', 'public, max-age=31536000, immutable');
        return new Response(obj.body, { headers: h });
      }

      /* ---------- reveal one member's shared email (click-to-reveal; logged-in only) ---------- */
      if (seg === 'member-email') {
        if (!kv || !customerId) return json({ ok: true, email: '' });
        const id = url.searchParams.get('id') || '';
        if (!id) return json({ error: 'no_id' }, 400);
        const r = await kv.get('member:' + id, 'json');
        return json({ ok: true, email: (r && r.showEmail && r.email) ? r.email : '' });
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

      /* ---------- block a member (one-way: their posts/comments vanish from my feed) ---------- */
      if (seg === 'block') {
        if (!kv || !customerId) return json({ ok: true });
        if (request.method !== 'POST') return json({ error: 'method' }, 405);
        const body = await request.json().catch(() => null);
        const targetId = String((body && body.id) || '').trim();
        if (!targetId || targetId === customerId) return json({ error: 'bad' }, 400);
        const on = !!(body && body.on);
        const bkey = 'blocked:' + customerId;
        let arr = (await kv.get(bkey, 'json')) || [];
        const i = arr.indexOf(targetId);
        if (on && i === -1) arr.push(targetId); else if (!on && i > -1) arr.splice(i, 1);
        await kv.put(bkey, JSON.stringify(arr.slice(0, 2000)));
        if (on) {
          // sever any follow between us, both directions
          const meRec = await kv.get('member:' + customerId, 'json');
          const themRec = await kv.get('member:' + targetId, 'json');
          const myLow = meRec && meRec.name ? String(meRec.name).trim().toLowerCase() : '';
          const themLow = themRec && themRec.name ? String(themRec.name).trim().toLowerCase() : '';
          async function unfollow(followerCid, followeeLow) {
            if (!followeeLow) return;
            let fa = (await kv.get('followers:' + followeeLow, 'json')) || []; const a = fa.indexOf(followerCid); if (a > -1) { fa.splice(a, 1); await kv.put('followers:' + followeeLow, JSON.stringify(fa)); }
            let ga = (await kv.get('following:' + followerCid, 'json')) || []; const b = ga.indexOf(followeeLow); if (b > -1) { ga.splice(b, 1); await kv.put('following:' + followerCid, JSON.stringify(ga)); }
          }
          await unfollow(customerId, themLow);   // me → them
          await unfollow(targetId, myLow);        // them → me
        }
        return json({ ok: true });
      }

      /* ---------- community wall ---------- */
      if (seg === 'community') {
        if (!kv) return json({ ok: true, posts: [] });
        const myRole = await roleFor(env, customerId, kv);
        if (request.method === 'GET') {
          const list = await kv.list({ prefix: 'post:' });
          const bset = new Set((await kv.get('blocked:' + customerId, 'json')) || []);   // hide blocked members' content from me
          const all = [];
          for (const k of list.keys) {
            const p = await kv.get(k.name, 'json');
            if (!p) continue;
            if (bset.size && bset.has(p.author)) continue;   // skip blocked authors' posts
            const rs = reactState(p, customerId);
            all.push({ id: p.id, name: p.name, title: p.title || '', text: p.text, kind: p.kind, category: p.category || (p.kind === 'win' ? 'wins' : 'general'), attachments: p.attachments || [], ts: p.ts, streak: p.streak || 0, house: !!p.house, authorRole: p.authorRole || (p.house ? 'owner' : null), pinned: !!p.pinned, edited: !!p.edited, owner: p.author === customerId, comments: (p.comments || []).filter(c => !(bset.size && bset.has(c.author))).map(c => ({ id: c.id, name: c.name, text: c.text, attachments: c.attachments || [], ts: c.ts, edited: !!c.edited, owner: c.author === customerId, authorRole: c.authorRole || null })), reactions: rs.counts, mine: rs.mine, likes: rs.counts.love, liked: rs.mine.love });
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
          return json({ ok: true, posts: page, total, hasMore: offset + limit < total, winOfWeek: wow ? wow.id : null, wowPost: wow || null, role: myRole, isAdmin: canModerate(myRole), canModerate: canModerate(myRole), canManageMembers: canManageMembers(myRole), canAnnounce: canAnnounce(myRole), categories: CAT_LIST, engageTotal: await readEngageTotal(env, customerId) });
        }
        if (request.method === 'POST') {
          const body = await request.json().catch(() => null);
          const text = String((body && body.text) || '').trim();
          if (!text) return json({ error: 'empty' }, 400);
          const info = await customerInfo(env, customerId);
          const id = Date.now() + '-' + customerId;
          const kind = ((body && body.kind) === 'win') ? 'win' : 'post';   // wins get their own board
          const category = catFor((body && body.category) || 'general', kind, canAnnounce(myRole));
          const meRec = await kv.get('member:' + customerId, 'json');
          if (meRec && meRec.banned) return json({ error: 'banned' }, 403);
          const myName = (meRec && meRec.name) || String((body && body.name) || info.firstName || 'Member').slice(0, 40);
          const post = { id, author: customerId, name: myName, authorRole: myRole || null, title: String((body && body.title) || '').slice(0, 120), text: text.slice(0, 1000), kind: kind, category: category, attachments: sanitizeAttachments(body && body.attachments), streak: Number(body && body.streak) || 0, ts: Date.now() };
          await kv.put('post:' + id, JSON.stringify(post));   // live immediately (unmoderated)
          await alertAdmin(env, post).catch(() => {});         // optional email ping to you
          // alert anyone following this member that they shared something new
          try {
            const followers = (await kv.get('followers:' + String(myName).trim().toLowerCase(), 'json')) || [];
            for (const fid of followers) {
              if (fid && fid !== customerId) await pushNotif(kv, fid, { type: 'follow', name: myName, postId: id, snippet: text.slice(0, 80), ts: Date.now() }, env);
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
            await pushNotif(kv, p.author, { type: 'react', rtype: type, name: rinfo.firstName || 'Someone', postId: pid, snippet: (p.text || '').slice(0, 80), ts: Date.now() }, env);
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
        const cAtts = sanitizeAttachments(body && body.attachments, 2);
        if (!pid || (!text && !cAtts.length)) return json({ error: 'bad' }, 400);
        const p = await kv.get('post:' + pid, 'json');
        if (!p) return json({ error: 'not_found' }, 404);
        const info = await customerInfo(env, customerId);
        if (await isBanned(kv, customerId)) return json({ error: 'banned' }, 403);
        const cRole = await roleFor(env, customerId, kv);
        const c = { id: Date.now() + '-' + customerId, author: customerId, name: String((body && body.name) || info.firstName || 'Member').slice(0, 40), authorRole: cRole || null, text: text.slice(0, 600), attachments: cAtts, ts: Date.now() };
        p.comments = Array.isArray(p.comments) ? p.comments : [];
        p.comments.push(c);
        await kv.put('post:' + pid, JSON.stringify(p));
        if (p.author && p.author !== customerId && String(p.author).indexOf('house-') !== 0) {
          await pushNotif(kv, p.author, { type: 'comment', name: c.name, postId: pid, snippet: c.text.slice(0, 80), ts: Date.now() }, env);
        }
        const engage = await awardEngage(env, customerId, 'comment');
        return json({ ok: true, comment: { id: c.id, name: c.name, text: c.text, attachments: c.attachments, ts: c.ts, edited: false, owner: true }, engage: engage });
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

      /* ---------- notification preferences (per-member email/SMS opt-ins) ---------- */
      if (seg === 'prefs') {
        if (!kv || !customerId) return json({ ok: true, prefs: PREF_DEFAULTS });
        if (request.method === 'GET') return json({ ok: true, prefs: await getPrefs(kv, customerId) });
        if (request.method === 'POST') {
          const body = (await request.json().catch(() => null)) || {};
          const clean = { email: {}, sms: {} };
          PREF_EMAIL_KEYS.forEach(k => { clean.email[k] = !!(body.email && body.email[k]); });
          PREF_SMS_KEYS.forEach(k => { clean.sms[k] = !!(body.sms && body.sms[k]); });
          await kv.put('pref:' + customerId, JSON.stringify(clean));
          return json({ ok: true, prefs: await getPrefs(kv, customerId) });
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

      /* ---------- admin console: assign roles (owner/admin) ---------- */
      if (seg === 'setrole') {
        const role = await roleFor(env, customerId, kv);
        if (!canManageMembers(role)) return json({ error: 'forbidden' }, 403);
        const body = await request.json().catch(() => null);
        const targetId = String((body && body.target) || '').trim();
        const newRole = String((body && body.role) || '').trim().toLowerCase();   // 'admin' | 'mod' | '' (remove)
        if (!targetId || targetId === customerId) return json({ error: 'bad' }, 400);
        if (newRole && newRole !== 'admin' && newRole !== 'mod') return json({ error: 'bad_role' }, 400);
        const targetRole = await roleFor(env, targetId, kv);
        if (targetRole === 'owner') return json({ error: 'forbidden' }, 403);                                   // owners managed via admin_ids only
        if (role === 'admin' && (targetRole === 'admin' || newRole === 'admin')) return json({ error: 'forbidden' }, 403); // admins can't mint or touch admins
        try {
          await tagsRemove(env, targetId, ['p2p-admin', 'p2p-mod']);
          if (newRole === 'admin') await tagsAdd(env, targetId, ['p2p-admin']);
          else if (newRole === 'mod') await tagsAdd(env, targetId, ['p2p-mod']);
        } catch (e) { return json({ error: 'tag_failed', detail: String(e).slice(0, 140) }, 500); }
        try { await kv.delete('role:' + targetId); } catch (e) {}                                              // bust the role cache
        const m = await kv.get('member:' + targetId, 'json');
        if (m) { m.role = newRole || null; await kv.put('member:' + targetId, JSON.stringify(m)); }
        return json({ ok: true, target: targetId, role: newRole || null });
      }

      /* ---------- admin console: ban / unban a member (owner/admin) ---------- */
      if (seg === 'ban') {
        const role = await roleFor(env, customerId, kv);
        if (!canManageMembers(role)) return json({ error: 'forbidden' }, 403);
        const body = await request.json().catch(() => null);
        const targetId = String((body && body.target) || '').trim();
        const on = !!(body && body.on);
        if (!targetId || targetId === customerId) return json({ error: 'bad' }, 400);
        const targetRole = await roleFor(env, targetId, kv);
        if (targetRole === 'owner') return json({ error: 'forbidden' }, 403);
        if (role === 'admin' && targetRole === 'admin') return json({ error: 'forbidden' }, 403);
        const m = await kv.get('member:' + targetId, 'json');
        if (m) { m.banned = on; await kv.put('member:' + targetId, JSON.stringify(m)); }
        try { if (on) await tagsAdd(env, targetId, ['p2p-banned']); else await tagsRemove(env, targetId, ['p2p-banned']); } catch (e) {}
        return json({ ok: true, target: targetId, banned: on });
      }

      /* ---------- admin console: report queue (owner/admin/mod) ---------- */
      if (seg === 'reports') {
        const role = await roleFor(env, customerId, kv);
        if (!canModerate(role)) return json({ error: 'forbidden' }, 403);
        if (request.method === 'GET') {
          const list = await kv.list({ prefix: 'suggest:' });
          const reports = [];
          for (const k of list.keys) { const r = await kv.get(k.name, 'json'); if (r && r.kind === 'Report') reports.push(r); }
          reports.sort((a, b) => b.ts - a.ts);
          return json({ ok: true, reports: reports.slice(0, 100) });
        }
        const body = await request.json().catch(() => null);
        const id = String((body && body.id) || '').trim().replace(/^suggest:/, '');
        if (!id) return json({ error: 'bad' }, 400);
        try { await kv.delete('suggest:' + id); } catch (e) {}
        return json({ ok: true });
      }

      /* ---------- DMs: send a message ---------- */
      if (seg === 'dm-send') {
        if (!kv) return json({ error: 'no_store' }, 501);
        const body = await request.json().catch(() => null);
        const to = String((body && body.to) || '').trim();
        const text = String((body && body.text) || '').trim().slice(0, 2000);
        if (!to || to === customerId || !text) return json({ error: 'bad' }, 400);
        if (await isBanned(kv, customerId)) return json({ error: 'banned' }, 403);
        const toRec = await kv.get('member:' + to, 'json');
        if (!toRec) return json({ error: 'no_member' }, 404);
        const myBlocked = (await kv.get('blocked:' + customerId, 'json')) || [];
        const theirBlocked = (await kv.get('blocked:' + to, 'json')) || [];
        if (myBlocked.indexOf(to) !== -1 || theirBlocked.indexOf(customerId) !== -1) return json({ error: 'blocked' }, 403);
        const pk = dmPair(customerId, to);
        const conv = (await kv.get('dm:' + pk, 'json')) || { messages: [] };
        const msg = { id: Date.now() + '-' + customerId, from: customerId, text: text, ts: Date.now() };
        conv.messages = Array.isArray(conv.messages) ? conv.messages : [];
        conv.messages.push(msg);
        if (conv.messages.length > 300) conv.messages = conv.messages.slice(-300);
        await kv.put('dm:' + pk, JSON.stringify(conv));
        const meRec = await kv.get('member:' + customerId, 'json');
        const myName = (meRec && meRec.name) || 'Member';
        await dmUpsertInbox(kv, customerId, to, text, msg.ts, customerId, false);
        await dmUpsertInbox(kv, to, customerId, text, msg.ts, customerId, true);
        await pushNotif(kv, to, { type: 'dm', from: customerId, name: myName, snippet: text.slice(0, 80), ts: msg.ts }, env);
        return json({ ok: true, message: { id: msg.id, from: msg.from, text: msg.text, ts: msg.ts, mine: true } });
      }

      /* ---------- DMs: a conversation thread (marks it read) ---------- */
      if (seg === 'dm-thread') {
        if (!kv) return json({ ok: true, messages: [] });
        const other = String(url.searchParams.get('with') || '').trim();
        if (!other) return json({ error: 'bad' }, 400);
        const conv = (await kv.get('dm:' + dmPair(customerId, other), 'json')) || { messages: [] };
        await dmMarkRead(kv, customerId, other);
        const otherRec = await kv.get('member:' + other, 'json');
        return json({ ok: true, with: other, name: (otherRec && otherRec.name) || 'Member', photo: (otherRec && otherRec.photo) || '',
          messages: (conv.messages || []).map((m) => ({ id: m.id, from: m.from, text: m.text, ts: m.ts, mine: m.from === customerId })) });
      }

      /* ---------- DMs: my inbox (conversations + unread) ---------- */
      if (seg === 'dm-inbox') {
        if (!kv) return json({ ok: true, conversations: [], unread: 0 });
        const inbox = (await kv.get('dm-inbox:' + customerId, 'json')) || [];
        let total = 0; const conversations = [];
        for (const c of inbox) {
          const r = await kv.get('member:' + c.with, 'json');
          const unread = c.unread || 0; total += unread;
          conversations.push({ with: c.with, name: (r && r.name) || 'Member', photo: (r && r.photo) || '', lastText: c.lastText || '', lastTs: c.lastTs || 0, lastFromMe: c.lastFrom === customerId, unread: unread });
        }
        conversations.sort((a, b) => b.lastTs - a.lastTs);
        return json({ ok: true, conversations: conversations, unread: total });
      }

      /* ---------- admin (optional): delete a post — spam safety valve ---------- */
      if (seg === 'moderate') {
        if (!canModerate(await roleFor(env, customerId, kv))) return json({ error: 'forbidden' }, 403);
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
        const owner = p.author === customerId, admin = canModerate(await roleFor(env, customerId, kv));
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
        const owner = c.author === customerId, admin = canModerate(await roleFor(env, customerId, kv)), postOwner = p.author === customerId;
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
  // Sun→Ruth, Mon→Frank, Tue→rotating joke, Wed→Drea, Fri→Eric meme. Advances through each bank; one post per voice per day max.
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
      let post;
      if (h.kind === 'joke') {
        // Rotating cast: pick this week's voice, prepend their in-character intro to the shared groaner.
        const ci = parseInt((await kv.get(h.castCursor)) || '0', 10) || 0;
        const cast = JOKE_CAST[ci % JOKE_CAST.length];
        post = { id, author: h.id, name: cast.name, title: h.title, text: cast.intro + '\n\n' + h.bank[idx % h.bank.length], kind: 'post', category: 'general', house: true, ts: Date.now() };
        await kv.put(h.castCursor, String(ci + 1));
      } else if (h.kind === 'meme') {
        // Image post: the meme IS the content; carry it as an attachment, no body text.
        post = { id, author: h.id, name: h.name, title: h.title, text: '', kind: 'post', category: 'general', house: true, attachments: [{ type: 'image', url: h.bank[idx % h.bank.length] }], ts: Date.now() };
      } else {
        post = { id, author: h.id, name: h.name, title: h.title, text: h.bank[idx % h.bank.length], kind: 'post', category: 'general', house: true, ts: Date.now() };
      }
      await kv.put('post:' + id, JSON.stringify(post));
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
            await pushNotif(kv, uid, { type: 'reminder', reminder: true, kind: it.kind, title: it.title, label: it.label, startAt: it.startAt, nid: it.nid, ts: now }, env);
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
        'house-frank': {
          heavy: [
            'Rough patch. Not a verdict. Keep it small today and just don’t quit.',
            'Overwhelmed usually means you care and you’re carrying too much at once. Put something down.',
            'You don’t have to win today. You just have to not quit. That’s the job right now.',
            'Honest take: hard weeks are part of the deal, not proof you’re failing.',
            'Rest isn’t quitting. Reset and come back — the work will wait.',
            'One small thing. That’s how you get unstuck, not with a grand plan.',
            'You’re allowed to have a bad day and still be exactly on track.',
            'Feeling behind is a feeling, not a fact. You’re further than you think.',
            'Take the pressure off the number. Just take the next step. That’s enough.',
            'The flock’s got you. Lean on that today, no ego about it.',
            'Stuck is temporary. Showing up while stuck is character — you just showed it.',
            'Be as patient with yourself as you’d be with a friend saying this.',
            'Hard is where it gets built. You’re in the build. Hang on.',
            'The dip is real. So is your grit. Use one to get through the other.',
            'You’re not stuck, you’re between reps. Load the next one.',
            'Tired is data, not failure. Rest, then get back in.',
            'Nobody builds anything great on a straight line. Zigzag counts.',
            'Lower the bar to “just start,” then clear it. That’s today’s move.',
            'Overwhelm shrinks when you name the next single task. Name it.',
            'Showing up on a hard day tells me everything I need to know.',
          ],
          win: [
            'Straight talk: that’s a real win. Bank it.',
            'Proof you did the work. Now go do the next hard thing.',
            'That’s the needle moving. Feels good, doesn’t it? Keep it.',
            'No notes. You shipped it. Respect.',
            'That’s what “finished” looks like. Most people never get here.',
            'Big. Don’t rush past it — let it land, then stack another.',
            'You called your shot and hit it. That’s a habit worth keeping.',
            'Momentum, earned. This is the good kind of pressure now.',
            'Result over intention, every time. You brought a result.',
            'That’s a decision that paid off. More of those.',
            'You made “someday” a “done.” Rare skill. Keep it sharp.',
            'Clean execution. I like watching people do the thing.',
            'Frank’s verdict: excellent. Now back to work, champ. 😏',
            'That’s a receipt, not a rumor. Well earned.',
            'You did the unglamorous work and it paid. That’s the whole game.',
            'Ship, learn, repeat — you just ran the loop. Run it again.',
            'Quiet execution, loud result. My favorite kind.',
            'Proof beats potential every time, and you brought proof.',
            'That’s a milestone. Mark it, then aim higher.',
            'You closed the gap between “want to” and “did.” Respect.',
          ],
          question: [
            'Good question — ask it out loud like this and the flock will answer.',
            'Smart to ask before guessing. That’s how the fast ones move.',
            'No dumb questions here, only expensive assumptions. You avoided one.',
            'Ask, adjust, act. You’re already on step one.',
            'Fair thing to wrestle with. Drop the specifics and we’ll get concrete.',
            'That’s the right question for your stage. Keep asking them.',
            'Asking beats stalling every time. Someone here’s got the answer.',
            'You’re thinking like a builder. Builders ask, then test.',
            'Good instinct to check first. Now go test the smallest version.',
            'This is exactly what the room is for. Ask boldly.',
            'Curiosity is a competitive advantage. You’ve got it.',
            'The people who ask early save themselves months. Well done.',
            'Solid question. Whoever answers — then you actually go do it. 😄',
            'Right question, right room. Someone’s got the answer.',
            'Ask sharp, get sharp. This is sharp.',
            'Better to ask now than rebuild later. Smart.',
            'The move: ask, then test the cheapest version of the answer.',
            'Good problem to have — means you’re actually building.',
            'Don’t guess when you can ask. You didn’t. Good.',
            'That’s a builder’s question. Keep bringing them.',
          ],
          general: [
            'Straight talk: this is good work. Keep going.',
            'No fluff needed — you’re onto something. Push it further.',
            'This is the part most people skip. You didn’t. Respect.',
            'Good. Now do it again tomorrow. That’s the whole secret.',
            'Momentum looks exactly like this. Don’t stop now.',
            'You just did the hard part — showing up on paper. Build from here.',
            'Progress over polish, every time. This is progress.',
            'This is the kind of thing that compounds. Stack another.',
            'You’re not behind. You’re building. Not the same thing.',
            'That’s a decision, not a wish. I like decisions.',
            'Simple and done beats fancy and someday. Well played.',
            'You shipped a thought into the world. Rarer than you think.',
            'Frank’s verdict: keep going. No notes.',
            'This is the good, boring work that wins. Keep at it.',
            'You’re compounding. Doesn’t look like much until it’s everything.',
            'Clear thinking on display here. Do more of it.',
            'Consistency beats intensity. This is consistency.',
            'You’re building a track record, one post like this at a time.',
            'Solid. Now protect the streak.',
            'That’s a brick in the wall. Lay another tomorrow.',
          ],
          chitchat: [
            'Doing the work and still saying hi? That’s balance. Good to see you.',
            'Here and present — half the battle. What are you building today?',
            'Good to see your name pop up. Now go make something.',
            'Checking in counts too. The consistent ones stick around. You’re here.',
            'Present and accounted for. That’s how momentum starts.',
            'Appreciate you showing up to the room. What’s on your plate?',
            'Good to have you around. What’s one thing you’re moving on today?',
            'Hey — glad you’re here. Tell us what you’re working toward.',
            'Showing up to say hi is underrated. Real ones do it.',
            'The room’s better with you in it. What’s the goal this week?',
            'Nice to see you. Say the word if you need a push on anything.',
            'Community first, then the work. Both matter. Carry on.',
            'Good to see ya. Now — what are we getting done today?',
            'Good to see you in the room. What’s the one thing today?',
            'Present beats perfect. You’re present. Now let’s work.',
            'Hey — glad you’re here. What are we shipping?',
            'Checking in is a habit of the consistent. Noted and respected.',
            'Say the word if you want a push on anything today.',
            'Good to have you around. Onward.',
            'Nice to see ya. What’s the goal?',
          ]
        },
        'house-drea': {
          heavy: [
            'Oh friend. Overwhelmed is allowed. You don’t have to carry it all today. 💛',
            'Come here. You’re doing so much more than you’re giving yourself credit for. 🖤',
            'Heavy days don’t cancel your progress. They’re part of the story. I’m with you.',
            'You’re not behind, love. You’re human. Breathe with me for a sec. 💛',
            'Whatever you’re feeling is welcome here. You don’t have to be okay to belong.',
            'Be as gentle with yourself as you are with everyone else. Please. 🖤',
            'This season is hard, but it isn’t forever. We’re holding on with you.',
            'Showing up on a hard day? That’s the bravest kind of showing up. 💛',
            'Rest, sweet friend. The dream will still be here when you have more to give.',
            'You are so deeply not alone in this. The whole flock just pulled in close. 🖤',
            'One breath, one small thing, one soft step. That’s all today has to be.',
            'That heart of yours is a gift, even when it aches. 💛',
            'I’m proud of you for saying it out loud. That takes real courage. 🖤',
            'Big hug incoming. You’re carrying a lot and still here. 💛',
            'Your worth isn’t on the line today, love. It never was. 🖤',
            'Let today be soft. You’ve earned gentleness. 💛',
            'The heavy seasons grow the deepest roots. Hang on with us. 🌱',
            'You don’t have to earn rest. Take it, friend. 🖤',
            'One kind thing for yourself today. Just one. 💛',
            'We’ve got you. Truly. Lean on the flock. 🖤',
          ],
          win: [
            'MY HEART. Look at you!! I’m so proud I could cry. 💛',
            'YES. Yes yes yes. You did the thing. Celebrate this all the way. 🎉',
            'This is exactly the kind of courage the Haus is about. So proud of you! 🖤',
            'Ohhh this made my whole day. Look at you shine. 💛',
            'You earned this one. Soak it in — you deserve to feel it. 🖤',
            'The flock is cheering SO loud right now. Can you hear us? 🎉',
            'Brave, consistent, and now victorious. That’s you. 💛',
            'I always knew you had this in you. Now you know it too. 🖤',
            'This is what becoming yourself looks like. Beautiful. 💛',
            'Happy dance initiated on your behalf. So proud! 💃',
            'You turned a dream into a done. That’s magic, love. ✨',
            'Look how far you’ve come. Don’t rush past this. Celebrate. 🖤',
            'My favorite thing: watching you win. Thank you for sharing it. 💛',
            'I am beaming for you right now. 💛',
            'This is your moment — please let yourself feel it. 🖤',
            'You brave, brilliant thing. Look what you did! 🎉',
            'Proof that showing up works. So proud. 💛',
            'The flock is throwing confetti in your honor. 🎊',
            'You turned courage into a result. That’s everything. 🖤',
            'Screenshot this feeling. You earned every bit. 💛',
          ],
          question: [
            'Great question, love. Ask away — this flock loves to help. 💛',
            'So glad you asked instead of struggling alone. That’s what we’re here for. 🖤',
            'No such thing as a silly question here. Someone’s got you. 💛',
            'Asking is brave too. Proud of you for reaching out.',
            'The right people are about to swoop in with answers. Hang tight. 💛',
            'This is exactly the kind of thing to bring to the table. 🖤',
            'You’re not supposed to know everything yet. That’s why we have each other. 💛',
            'Love a good question. It means you’re growing. 🌱',
            'Ask boldly, friend. We’ve all been exactly where you are. 🖤',
            'The flock’s got wisdom for days. Let it pour in. 💛',
            'Reaching out is a strength, never a weakness. 🖤',
            'Good on you for asking early. That’s how the dream keeps moving. 💛',
            'Someone here has walked this exact road. You’re in good company. 🖤',
            'Ask away, love — we’ve all been here. 💛',
            'Brave of you to ask. The right hearts will answer. 🖤',
            'This is exactly what the table is for. Pull up a chair. 💛',
            'No question too small when you’re growing. 🌱',
            'You reaching out makes the whole room safer. Thank you. 🖤',
            'Let’s figure it out together, okay? 💛',
            'Curiosity looks so good on you. 🖤',
          ],
          general: [
            'My heart — look at you showing up. 💛',
            'You belong here, and posts like this prove it.',
            'There’s so much heart in this. Don’t ever dim it.',
            'This made me smile. Thank you for trusting us with it. 💛',
            'Rooting for you so hard right now. Keep going, friend.',
            'The flock sees you — and we’re so glad you’re here.',
            'You showing up like this? That’s the whole point. 🖤',
            'This is your reminder that you’re not doing it alone. 💛',
            'Whatever brought you here today, I’m grateful it did.',
            'Your voice matters here. Thank you for using it.',
            'The way you’re showing up is quietly powerful. I see it.',
            'Come back tomorrow too, okay? We’re better with you here. 💛',
            'This is what “born original” looks like in real time. 🖤',
            'There’s heart all over this. Keep it. 💛',
            'You’re becoming, right in front of us. It’s beautiful. 🖤',
            'The flock is lucky to have you. 💛',
            'This is the kind of honest that builds real community. 🖤',
            'Keep showing up as YOU. That’s the whole magic. 💛',
            'Proud of you today, no reason required. 🖤',
            'You matter here. Don’t forget it. 💛',
          ],
          chitchat: [
            'Hi you! So happy you popped in. How are you, really? 💛',
            'Love seeing your face in the room. Tell us how you’re doing! 🖤',
            'Good to see you, friend. Consider this your warm welcome hug. 💛',
            'Aw, hi! The Haus feels cozier when you’re here. 🖤',
            'Checking in on us? You’re the sweetest. How’s YOUR heart today? 💛',
            'So glad you stopped by. What’s making you smile lately? 🖤',
            'Hi hi hi! Grab a seat, we saved you one. 💛',
            'You showing up just to say hey? That’s the good stuff. 🖤',
            'Happy to see you here today. How can we cheer you on? 💛',
            'Hey friend! The flock’s glad you’re around. 🖤',
            'Ohh hello! Tell us one small good thing from your day. 💛',
            'Waving back at you! So glad you’re part of this. 🖤',
            'Love a good check-in. You matter here, in the quiet moments too. 💛',
            'Hi friend! So glad you swung by. 💛',
            'The Haus is cozier with you here. 🖤',
            'Waving big at you! How’s your heart? 💛',
            'Hello you! Tell us something good. 🖤',
            'Grab a seat, we saved you one. 💛',
            'Just happy you’re here today. 🖤',
            'Hey hey! You’re a bright spot. 💛',
          ]
        },
        'house-ruth': {
          heavy: [
            'Gentle truth: you can be weary and still be exactly on the path.',
            'You can’t rush a root, and you can’t rush a hard season. Be patient with it.',
            'Rest is not falling behind. It’s part of how things grow. 🤍',
            'Overwhelm often means you’re carrying tomorrow’s weight today. Set it down.',
            'A soft reminder: your worth isn’t measured by a hard week.',
            'You don’t have to see the whole staircase. Just the next gentle step.',
            'Be kind to yourself here. You’d offer that kindness to anyone else.',
            'The valley is part of the landscape, not the end of the road. Stay with it.',
            'What feels like falling apart is sometimes old things making room. 🌱',
            'Slow down, breathe, and let today be enough. It is enough.',
            'Your pace is not the problem. Grace goes at the speed of you.',
            'Even the quietest seeds are still growing underground. So are you.',
            'You showed up honestly on a hard day. That is not small. 🤍',
            'Gentle truth: a hard week is weather, not climate. It passes.',
            'You’re allowed to grow slowly. Most real things do. 🌱',
            'Set down what isn’t yours to carry today. Just for today. 🤍',
            'Weariness is a sign to rest, not proof you’re failing.',
            'The seed underground looks like nothing. It isn’t. Neither are you.',
            'Be patient with the process. It’s patient with you.',
            'Quietly showing up on a hard day is its own kind of strong. 🤍',
          ],
          win: [
            'Beautifully done. This is what faithful, steady work grows into.',
            'What you tended has bloomed. Let yourself enjoy it. 🌱',
            'Rooted work, real fruit. Well done, friend.',
            'This is the harvest of a hundred quiet steps. Savor it. 🤍',
            'You stayed with it, and look — it grew. That’s the whole secret.',
            'A gentle well done. You earned this, root and branch.',
            'Patience and persistence, made visible. Beautiful to see.',
            'The timing was right because you kept tending. Trust that again.',
            'This is a milestone worth resting in. Breathe it in. 🌱',
            'Slow and rooted just outlasted fast and shallow. As it does.',
            'You honored the process, and the process honored you back.',
            'What a good and grounded win. So happy for you. 🤍',
            'Proof that steady wins. Keep this close for the next hard day.',
            'The harvest of faithful days. Well done, friend. 🌱',
            'You tended it, and it grew. That’s the whole of it.',
            'Steady hands, real fruit. Beautiful to witness. 🤍',
            'This bloomed in its right time. Trust that rhythm again.',
            'A grounded, honest win. Rest in it a moment. 🌱',
            'What you watered in the dark came to light. Lovely.',
            'Proof that rooted growth outlasts the rush. 🤍',
          ],
          question: [
            'A good question, gently asked. The flock will meet you here.',
            'Wisdom often starts with a question. You’re right on time.',
            'No need to know it all. Asking is its own kind of faithfulness.',
            'Bring it to the table, friend. We grow better together.',
            'The right voices will answer. Rest while they do. 🤍',
            'Curiosity is a gentle strength. You have it.',
            'You’re not behind for asking. You’re wise for it.',
            'Someone here has tended this same question. Let them help. 🌱',
            'Ask, and stay open. The answer often grows slowly.',
            'A thoughtful question — that’s the soil good decisions grow in.',
            'Reaching out is a quiet act of courage. Well done.',
            'This is what community is for. You belong in the asking, too.',
            'Gentle truth: the ones who ask early save themselves much heartache.',
            'A thoughtful question. The flock will tend it with you. 🌱',
            'Wisdom begins right here, in the asking.',
            'No need to know the whole path to take the next gentle step.',
            'Ask, and let the answer come in its own good time. 🤍',
            'You’re wise to seek counsel. That’s roots, not weakness.',
            'Bring it here, friend. We grow better together.',
            'A gentle question in good soil grows good fruit. 🌱',
          ],
          general: [
            'Beautifully said. You’re right where you need to be.',
            'Steady steps, friend. This is how it gets built.',
            'Gentle truth: showing up is the win. The rest follows.',
            'This is quietly important work. Don’t underestimate it.',
            'One faithful step at a time. That’s the whole path.',
            'You were made original, on purpose. This proves it.',
            'What you tend to, grows. Keep tending.',
            'Trust your pace. It’s not a problem to fix.',
            'Small and steady is still moving. And moving is enough.',
            'The quiet work is the real work. I see you doing it. 🤍',
            'You don’t have to have it all figured out to be on the right path.',
            'This is steady, rooted, real — exactly the good kind.',
            'Keep watering it. Roots you can’t see are still roots. 🌱',
            'Faithful, steady, real. Exactly right. 🤍',
            'Small and rooted still counts. It counts most, actually.',
            'You’re tending something good here. Keep watering it. 🌱',
            'The quiet work is the lasting work. I see it.',
            'One gentle step, then another. That’s the whole way.',
            'You were made original, on purpose. This shows it. 🤍',
            'Trust the pace you’re on. It’s yours for a reason.',
          ],
          chitchat: [
            'Hello, friend. It’s good to simply be here together. 🤍',
            'A gentle hello back to you. How is your heart today?',
            'Nice to see you resting in the room for a moment. Welcome. 🤍',
            'Good to have your company. No agenda needed — just glad you’re here.',
            'Hello there. Sometimes showing up quietly is enough. 🌱',
            'A soft hello. Take a breath with us — you’re among friends.',
            'It’s a good day when you stop in. Thank you for being here. 🤍',
            'Warm hello, friend. How are things in your world?',
            'Glad you’re here today, no reason required. That’s community. 🌱',
            'Hello, and welcome to a gentle moment in your day.',
            'Simply good to see you. Stay as long as you like. 🤍',
            'A quiet hi from me. The flock is glad for your company.',
            'Hello, friend. Even a small check-in keeps the roots connected. 🌱',
            'Hello, friend. Simply glad you’re here. 🤍',
            'A gentle wave to you today. How’s your world?',
            'Good to share a quiet moment together. Welcome. 🌱',
            'No agenda needed — your company is enough.',
            'Warm hello. Stay as long as you like. 🤍',
            'It’s a good day when you stop in. Thank you.',
            'Hi there. The roots stay connected when you check in. 🌱',
          ]
        },
        'house-eric': {
          heavy: [
            'Hey now. Rough days happen to the best of us — and you’re the best of us. 🖤',
            'No joke this time, promise. Just: I’m proud of you for still being here.',
            'Overwhelmed? Put the cape down for a sec, superhero. You’ve earned a breather.',
            'Bad day ≠ bad you. Trust me, I’ve had Tuesdays. 😅 You’ve got this.',
            'Go easy on yourself, kid. Even sheep need a nap in the shade. 🐑',
            'The hard part means you’re actually in the arena. That counts for a lot.',
            'One small step today. That’s it. No hero moves required.',
            'Feeling behind? Nah. You’re just on the scenic route. Keep rolling.',
            'Deep breath. Snack. Water. Then one tiny thing. Doctor Eric’s orders.',
            'Showing up on empty is braver than showing up full. Respect. 🖤',
            'The flock’s right here. Lean on us — that’s what a flock is for.',
            'Storms pass. Sheep stay. You’re gonna be just fine, friend.',
            'Hang in there. And I mean that with zero punchline. 🖤',
            'Rough day? Been there. Grab a snack, we’ll wait. 🖤',
            'You’re not behind, you’re marinating. Trust the process. 😄',
            'Even the black sheep needs a lie-down sometimes. 🐑',
            'No punchline today — just: I’m proud you’re still swinging.',
            'Hard stretch, tough sheep. You’ll get through it. 🖤',
            'One tiny step counts as a step. Doctor Eric says so.',
            'Lean on the flock today. That’s literally what we’re for. 🐑',
          ],
          win: [
            'Proof over promises — you did the thing! 🎉',
            'WOULD YOU LOOK AT THAT. A certified doer! 🐑',
            'You showed up AND showed out. No notes, no jokes, just: heck yes.',
            'Receipts beat resolutions — and you just brought the receipts. 🧾',
            'Gold star, victory lap, the whole parade. You earned it. ⭐',
            'That’s a win, and we celebrate every single one around here.',
            'Doing beats dreaming. You DID. I’m so proud, kid.',
            'You turned “someday” into “today.” That’s the real magic trick. ✨',
            'A+ and I’m a tough grader. (I’m not. But still — A+.)',
            'Take the victory lap. Go on. I’ll hold your coffee. ☕',
            'This is what progress smells like. Like success. And snacks.',
            'Look at you go! Keep it up and I’ll run out of proud faces.',
            'Big win energy. Wear it out tomorrow too. 🖤',
            'DING DING DING — we’ve got a winner! 🎉',
            'Proof over promises, baby. You brought the proof. 🧾',
            'That’s a whole vibe. A winning one. ⭐',
            'You did the thing! I’m getting emotional. Don’t tell anyone. 🖤',
            'Somebody get this legend a victory snack. 🍪',
            'Called it. You’re a doer. Certified. 🐑',
            'Big day! Wear the win proudly tomorrow. 😄',
          ],
          question: [
            'Great question! Ask away — the flock loves this stuff. 🐑',
            'Smart to ask. Way better than my method of “guess and panic.” 😄',
            'No silly questions here. Only me, and I ask silly things daily.',
            'Ask boldly, friend. Someone here’s got the map you need.',
            'Good on ya for asking. That’s how the pros do it (and me, occasionally).',
            'The right answer is one brave question away. You just asked it.',
            'Love the curiosity. It looks great on you. 🖤',
            'Asking early saves future-you a giant headache. Well played.',
            'This is what the room’s for. Fire away!',
            'Somebody here has done this exact thing. Watch ’em swoop in.',
            'You’re thinking ahead. That’s a superpower, cape optional.',
            'Questions are just answers in disguise. Unmask it! 🕵️',
            'Ask, learn, do. You nailed step one already. 🖤',
            'Great question! Way smarter than my “wing it” approach. 😄',
            'Ask and ye shall receive… probably from someone smarter than me. 🖤',
            'Good on ya for asking. That’s a pro move. 🐑',
            'The flock loves a good question. Fire away!',
            'Curiosity: the cheat code nobody mentions. You’ve got it.',
            'No silly questions here — I’ve cornered that market. 😄',
            'Ask now, thank yourself later. Well played.',
          ],
          general: [
            'Love this! (I’ll spare you a joke… this time. 😄)',
            'Well would you look at that — a doer in the wild! 🐑',
            'This is the good stuff. Also, I’m proud of ya, kid.',
            'Big “keep going” energy right here. I’m into it.',
            'This made my day, and my days are pretty good already.',
            'Consistency looks good on you. Wear it again tomorrow.',
            'Not bad, not bad at all. Actually — really good.',
            'You’re building something. I can tell. Keep stacking bricks.',
            'Every time someone shows up here, the Haus gets a little brighter.',
            'I came for the memes, I stayed for people like you. 🖤',
            'Real ones show up on the regular. You’re a real one.',
            'Keep this up and I’ll run out of ways to say “proud of you.”',
            'You’re proof the flock is exactly the right kind of trouble.',
            'This right here? Good stuff. Keep it coming. 🖤',
            'You’re building something real. I can smell it. (Good way.) 😄',
            'Consistency king/queen behavior. Respect. 🐑',
            'Every post like this makes the barn a little brighter.',
            'Solid work. Now go treat yourself. Orders. 🍪',
            'I like your style, friend. Keep on keepin’ on. 🖤',
            'That’s a real one right there. 🐑',
          ],
          chitchat: [
            'Well hey there! Pull up a chair, the coffee’s on. ☕',
            'Look who wandered in! Good to see ya. 🐑',
            'Howdy! My day’s better now that you said hi. 🖤',
            'Hey hey! What’s the good word today?',
            'Just here to say hi? That’s a whole vibe. Respect. 😄',
            'Well would you look who it is! How’s tricks?',
            'Hi friend! Consider this your official flock high-five. ✋',
            'You checking in? Cute. How’s the world treating ya? 🖤',
            'Heyo! Good to have you in the barn today. 🐑',
            'Hello hello! Tell me something good.',
            'Waving at ya from across the room. How ya doing? 👋',
            'Hi! Stick around — the good conversations happen here. 😄',
            'Good to see your name light up. What’s new, friend?',
            'Hey hey! Good to see your name in lights. 🖤',
            'Well howdy! Pull up a chair. ☕',
            'Look who it is! The barn’s better with ya. 🐑',
            'Hi friend! What’s the good news today?',
            'Waving from across the room. 👋 How ya been?',
            'You checking in? Love that. 🖤',
            'Heyo! Stick around, good stuff happens here. 😄',
          ]
        }
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
      for (const p of recent.slice(0, 10)) {
        const r = normalizeReactions(p);
        const already = new Set([].concat(r.love, r.thumb, r.party));
        const avail = HV.filter(h => !already.has(h.id));
        if (!avail.length) continue;
        const h = avail[(p.ts + p.id.length) % avail.length];
        const type = HOUSE_REACTS[p.ts % HOUSE_REACTS.length];
        r[type].push(h.id); p.reactions = r; delete p.likedBy;
        // House comments: guarantee 1–3 per post, NEVER all four. One voice per pass;
        // the per-post target (1/2/3) is deterministic, so a post fills up to it and stops.
        let commented = false, commenterName = '';
        const houseC = (p.comments || []).filter(c => String(c.author || '').indexOf('house-') === 0);
        const commentedIds = new Set(houseC.map(c => c.author));
        const wantC = 1 + ((p.ts + p.id.length) % 3);                 // 1, 2, or 3
        if (houseC.length < wantC) {
          const commenter = commentedIds.has(h.id) ? HV.filter(x => !commentedIds.has(x.id))[0] : h;
          if (commenter) {
            const buckets = HOUSE_COMMENTS[commenter.id];
            const bank = (buckets && (buckets[classifyTone(p)] || buckets.general)) || [];
            const ci = (p.ts + houseC.length * 7 + commenter.id.length) % bank.length;
            p.comments = Array.isArray(p.comments) ? p.comments : [];
            p.comments.push({ id: Date.now() + '-' + commenter.id, author: commenter.id, name: commenter.name, text: bank[ci], ts: Date.now() });
            commented = true; commenterName = commenter.name;
          }
        }
        await kv.put('post:' + p.id, JSON.stringify(p));
        await pushNotif(kv, p.author, commented
          ? { type: 'comment', name: commenterName || h.name, postId: p.id, snippet: (p.text || '').slice(0, 80), ts: Date.now() }
          : { type: 'react', rtype: type, name: h.name, postId: p.id, snippet: (p.text || '').slice(0, 80), ts: Date.now() });
      }
    } catch (e) {}
  }
};

/* ---------- helpers ---------- */
// A member-chosen city pin: label + lat/lng, rounded to ~city precision (2 decimals ≈ 1.1 km).
function sanitizeLoc(v) {
  if (!v || typeof v !== 'object') return null;
  const lat = Number(v.lat), lng = Number(v.lng);
  if (!isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  const label = String(v.label || '').trim().slice(0, 80);
  if (!label) return null;
  return { label: label, lat: Math.round(lat * 100) / 100, lng: Math.round(lng * 100) / 100 };
}
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
/* ---- Roles: owner / admin / mod / null ----
   Assigned via Shopify customer tags (p2p-owner / p2p-admin / p2p-mod) or the
   env.admin_ids owner list (backward-compat; those ids can never be locked out).
   Resolved server-side from the App-Proxy-signed customer id (tamper-proof) and
   KV-cached ~5 min. Powers: canModerate = all three (delete/hide/pin);
   canManageMembers / canAnnounce = owner + admin; appointing owners = owner only. */
const ROLE_TAGS = { 'p2p-owner': 'owner', 'p2p-admin': 'admin', 'p2p-mod': 'mod' };
const ROLE_RANK = { owner: 3, admin: 2, mod: 1 };
async function roleFor(env, customerId, kv) {
  if (!customerId) return null;
  const cid = String(customerId);
  if (isAdmin(env, cid)) return 'owner';                       // env owner list always wins
  if (kv) { try { const c = await kv.get('role:' + cid); if (c !== null) return c || null; } catch (e) {} }
  let role = null;
  try {
    const data = await adminGraphQL(env, `query($id: ID!){ customer(id:$id){ tags } }`, { id: `gid://shopify/Customer/${cid}` });
    const tags = (data && data.customer && data.customer.tags) || [];
    for (const t of tags) { const r = ROLE_TAGS[String(t).trim().toLowerCase()]; if (r && (!role || ROLE_RANK[r] > ROLE_RANK[role])) role = r; }
  } catch (e) { role = null; }
  if (kv) { try { await kv.put('role:' + cid, role || '', { expirationTtl: 300 }); } catch (e) {} }
  return role;
}
function canModerate(role) { return role === 'owner' || role === 'admin' || role === 'mod'; }
function canManageMembers(role) { return role === 'owner' || role === 'admin'; }
function canAnnounce(role) { return role === 'owner' || role === 'admin'; }
function sanitizeUrl(u) {
  u = String(u || '').trim();
  return /^https?:\/\/[^\s]+$/i.test(u) ? u.slice(0, 400) : '';
}
// Like sanitizeUrl, but also accepts our own R2-backed upload path (returned by /upload when no
// public bucket base is configured) so device-uploaded post/comment images survive sanitation.
function sanitizeMediaUrl(u) {
  u = String(u || '').trim();
  if (/^https?:\/\/[^\s]+$/i.test(u)) return u.slice(0, 400);
  if (/^\/apps\/p2p\/imgget\?key=[\w.%\-]+$/i.test(u)) return u.slice(0, 400);
  return '';
}
// Accept a handle (@drea), a bare domain (yoursite.com), or a full link — always store a full https URL.
function socialUrlKey(key, raw) {
  raw = String(raw || '').trim(); if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw.slice(0, 300);
  raw = raw.replace(/^@+/, '').replace(/^\/+/, '');
  if (!raw || /\s/.test(raw)) return '';
  if (raw.indexOf('.') > -1) return ('https://' + raw).slice(0, 300);   // looks like a domain
  const base = { website: 'https://', instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', youtube: 'https://youtube.com/@', tiktok: 'https://tiktok.com/@', linkedin: 'https://linkedin.com/', x: 'https://x.com/' };
  return ((base[key] || 'https://') + raw).slice(0, 300);
}
function sanitizeSocial(s) {
  const out = {}; if (!s || typeof s !== 'object') return out;
  ['website', 'instagram', 'facebook', 'youtube', 'x', 'linkedin', 'tiktok'].forEach(function (k) {
    const v = socialUrlKey(k, s[k]); if (v) out[k] = v;
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
// Post attachments: [{type:'image'|'gif'|'youtube'|'link', url, ...}], http(s) only.
// Posts allow up to 6; comments pass a smaller max (keeps replies compact).
function sanitizeAttachments(a, max) {
  if (!Array.isArray(a)) return [];
  const lim = max || 6;
  const out = [];
  for (const raw of a.slice(0, lim)) {
    if (!raw || typeof raw !== 'object') continue;
    const type = ['image', 'gif', 'youtube', 'link'].indexOf(raw.type) > -1 ? raw.type : 'link';
    const url = (type === 'image' || type === 'gif') ? sanitizeMediaUrl(raw.url) : sanitizeUrl(raw.url);
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
// When `env` is passed (real member-generated events, not house-voice), also
// fan the event out to the member's chosen off-site channels (email / SMS via
// Klaviyo) if they opted in. Bell delivery never depends on that succeeding.
async function pushNotif(kv, uid, n, env) {
  if (!kv || !uid) return;
  const key = 'notif:' + uid;
  const list = (await kv.get(key, 'json')) || [];
  n.read = false;
  n.id = n.ts + '-' + Math.random().toString(36).slice(2, 7);
  list.unshift(n);
  await kv.put(key, JSON.stringify(list.slice(0, 40)));
  if (env && env.klaviyo_key) await deliverExternal(env, kv, uid, n).catch(() => {});
}

/* ---------- notification preferences (per-member email/SMS opt-ins) ---------- */
// Email defaults ON for the high-signal events; SMS is always opt-in (all off),
// and only the two worth a text (DMs, reminders) are ever eligible.
const PREF_EMAIL_KEYS = ['dm', 'comment', 'follow', 'react', 'reminder'];
const PREF_SMS_KEYS = ['dm', 'reminder'];
const PREF_DEFAULTS = {
  email: { dm: true, comment: true, follow: false, react: false, reminder: true },
  sms: { dm: false, reminder: false }
};
async function getPrefs(kv, uid) {
  let saved = null;
  if (kv && uid) saved = await kv.get('pref:' + uid, 'json').catch(() => null);
  return {
    email: Object.assign({}, PREF_DEFAULTS.email, (saved && saved.email) || {}),
    sms: Object.assign({}, PREF_DEFAULTS.sms, (saved && saved.sms) || {})
  };
}

// Member email + phone, pulled once from Shopify and cached ~1h. Phone is only
// present/usable for SMS if the customer stored one (E.164) and consented in Klaviyo.
async function contactFor(env, kv, uid) {
  if (kv) { const c = await kv.get('contact:' + uid, 'json').catch(() => null); if (c) return c; }
  try {
    const data = await adminGraphQL(env, `query($id: ID!){ customer(id:$id){ email phone } }`, { id: `gid://shopify/Customer/${uid}` });
    const c = (data && data.customer) || {};
    const out = { email: c.email || '', phone: c.phone || '' };
    if (kv) await kv.put('contact:' + uid, JSON.stringify(out), { expirationTtl: 3600 }).catch(() => {});
    return out;
  } catch (e) { return null; }
}

// Friendly one-liner + deep link for each event type, used as Klaviyo event
// properties so the flow templates can render "{{ event.title }}" etc.
function notifCopy(n) {
  const who = n.name || 'Someone';
  const snip = n.snippet ? '“' + n.snippet + '”' : '';
  switch (n.type) {
    case 'dm': return { title: 'New message from ' + who, body: snip || 'You have a new direct message.' };
    case 'comment': return { title: who + ' replied to your post', body: snip };
    case 'follow': return { title: who + ' started following you', body: '' };
    case 'react': return { title: who + ' reacted to your post', body: snip };
    case 'reminder': return { title: 'Reminder: ' + (n.title || 'something on your plan'), body: n.label || '' };
    default: return { title: 'New activity in your community', body: snip };
  }
}
function notifUrl(env, n) {
  const base = (env && env.os_url) || 'https://blacksheepcreations.com/pages/p2p-os';
  if (n.type === 'dm') return base + '#dm';
  if (n.type === 'follow') return base + '#members';
  if (n.type === 'reminder') return base + '#mysuccess';
  if (n.postId) return base + '#post-' + n.postId;
  return base;
}

// Fan a bell event out to email/SMS via Klaviyo, honoring the member's prefs.
async function deliverExternal(env, kv, uid, n) {
  const type = n.type;
  if (PREF_EMAIL_KEYS.indexOf(type) === -1 && PREF_SMS_KEYS.indexOf(type) === -1) return;
  const prefs = await getPrefs(kv, uid);
  const wantEmail = !!(prefs.email && prefs.email[type]);
  const wantSms = PREF_SMS_KEYS.indexOf(type) !== -1 && !!(prefs.sms && prefs.sms[type]);
  if (!wantEmail && !wantSms) return;
  const contact = await contactFor(env, kv, uid);
  if (!contact) return;
  const copy = notifCopy(n);
  const props = { title: copy.title, body: copy.body, url: notifUrl(env, n), type: type, actor: n.name || '', snippet: n.snippet || '' };
  if (wantEmail && contact.email) {
    await klaviyoEvent(env, { email: contact.email }, env.klaviyo_email_metric || 'P2P Alert Email', props).catch(() => {});
  }
  if (wantSms && contact.phone) {
    await klaviyoEvent(env, { phone_number: contact.phone }, env.klaviyo_sms_metric || 'P2P Alert Text', props).catch(() => {});
  }
}

// Log an event onto a Klaviyo profile (identified by email or phone). The event
// metric triggers the matching Klaviyo flow, which owns the actual email/SMS copy.
async function klaviyoEvent(env, profileAttrs, metricName, properties) {
  if (!env.klaviyo_key) return;
  const payload = { data: { type: 'event', attributes: {
    properties: properties,
    metric: { data: { type: 'metric', attributes: { name: metricName } } },
    profile: { data: { type: 'profile', attributes: profileAttrs } }
  } } };
  await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      'Authorization': 'Klaviyo-API-Key ' + env.klaviyo_key,
      'revision': '2024-10-15',
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });
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
// Admin-console tag writes (need write_customers). Additive/subtractive so other tags survive.
async function tagsAdd(env, id, tags) {
  if (!tags || !tags.length) return;
  await adminGraphQL(env, `mutation($id:ID!,$tags:[String!]!){ tagsAdd(id:$id, tags:$tags){ userErrors{ message } } }`, { id: `gid://shopify/Customer/${id}`, tags });
}
async function tagsRemove(env, id, tags) {
  if (!tags || !tags.length) return;
  await adminGraphQL(env, `mutation($id:ID!,$tags:[String!]!){ tagsRemove(id:$id, tags:$tags){ userErrors{ message } } }`, { id: `gid://shopify/Customer/${id}`, tags });
}
async function isBanned(kv, cid) {
  if (!kv || !cid) return false;
  const m = await kv.get('member:' + cid, 'json');
  return !!(m && m.banned);
}
// Read a member post's vibe so house voices reply in a fitting tone (no AI, keyword-based).
// Order matters: a win beats a heavy phrase ("was overwhelmed but I finished!" → win).
function classifyTone(p) {
  const t = (((p && p.title) || '') + ' ' + ((p && p.text) || '')).toLowerCase();
  const has = (arr) => arr.some((w) => t.indexOf(w) !== -1);
  const WIN = ['launched', 'launch', 'shipped', ' sold', ' sale', 'first sale', 'finished', 'finally did', 'completed', 'hit my', 'reached', 'milestone', 'proud', 'celebrat', 'did it', 'i won', 'success', 'breakthrough', 'signed', 'booked', 'published', 'went live', 'live now', 'made my first', 'accomplished', 'nailed', 'crushed it', 'so excited', 'big news', 'wahoo', 'first client'];
  const HEAVY = ['overwhelm', 'exhaust', 'burnt out', 'burned out', 'burnout', 'so tired', 'stuck', 'lost', 'doubt', 'scared', 'afraid', 'anxious', 'anxiety', 'struggl', 'defeated', 'discouraged', 'giving up', 'give up', 'wanna quit', 'want to quit', 'failing', 'failed', "can't", 'behind', 'not enough', 'impostor', 'imposter', 'drained', 'worn out', 'falling apart', 'hopeless', 'stressed', 'frustrat', 'comparing', 'so alone', 'lonely', 'rough week', 'hard week', 'hard day', 'breaking down', 'crying'];
  const Q = ['how do i', 'how do you', 'how can i', 'how would', 'any advice', ' advice', 'anyone', 'should i', 'does anyone', 'can someone', 'what would you', 'recommend', 'any tips', 'not sure how', 'which one', 'help me', 'wondering if'];
  // Casual greetings / check-ins — apostrophe-agnostic so "How's" and "Hows" both match.
  const tn = t.replace(/['’]/g, '');
  const CHAT = ['hows your day', 'how is your day', 'hows your week', 'how is your week', 'hows everyone', 'how is everyone', 'hows it going', 'how are you', 'how are ya', 'how yall', 'how ya doing', 'hows everybody', 'good morning', 'good evening', 'good day everyone', 'happy friday', 'happy monday', 'hi everyone', 'hey everyone', 'hey all', 'hello everyone', 'checking in', 'how was your weekend', 'hows the weekend', 'hows your weekend', 'talk to me', 'whats up', 'weekend vibes'];
  if (has(WIN)) return 'win';
  if (has(HEAVY)) return 'heavy';
  if (CHAT.some((w) => tn.indexOf(w) !== -1)) return 'chitchat';
  if (has(Q) || /\?\s*$/.test(t.trim())) return 'question';
  return 'general';
}
// ---- Direct messages (1:1). Thread stored at dm:<sortedPair>; each member keeps a
//      dm-inbox:<cid> summary list with per-conversation unread counts. ----
function dmPair(a, b) { return [String(a), String(b)].sort().join('_'); }
async function dmUpsertInbox(kv, owner, other, lastText, lastTs, lastFrom, incUnread) {
  const key = 'dm-inbox:' + owner;
  let inbox = (await kv.get(key, 'json')) || [];
  let it = inbox.filter((x) => x.with === other)[0];
  if (!it) { it = { with: other, unread: 0 }; inbox.push(it); }
  it.lastText = String(lastText || '').slice(0, 140);
  it.lastTs = lastTs; it.lastFrom = lastFrom;
  if (incUnread) it.unread = (it.unread || 0) + 1;
  inbox.sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
  await kv.put(key, JSON.stringify(inbox.slice(0, 400)));
}
async function dmMarkRead(kv, owner, other) {
  const key = 'dm-inbox:' + owner;
  const inbox = (await kv.get(key, 'json')) || [];
  const it = inbox.filter((x) => x.with === other)[0];
  if (it && it.unread) { it.unread = 0; await kv.put(key, JSON.stringify(inbox)); }
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
