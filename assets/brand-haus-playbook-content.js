/**
 * The AI Creator's Brand Haus — Your Brand Playbook™ content library
 * Depends on brand-haus-branddna.js (PROFILES, TENSION_PLAYBOOK,
 * CLUSTER_PLAYBOOK live there since they're engine-adjacent and small;
 * this file holds the much larger bulk of per-profile/per-font/per-
 * expression-value prose so brand-haus-branddna.js doesn't balloon
 * further). Pure data, no rendering — brand-haus-playbook.js consumes
 * this the same way brand-haus-results.js consumes PROFILES.
 *
 * FONT_PLAYBOOK is keyed by the exact font name strings already used in
 * PROFILES[i].output.headingFont/bodyFont — one entry per unique font
 * actually in use (13 today), reused across every profile that shares
 * a font rather than repeated per profile.
 *
 * EXPRESSION_PLAYBOOK is keyed by category (mood/voice/photography/
 * colorFamily) then by the exact value strings used in both
 * PROFILES[i].output and brand-haus-branddna.js QUESTIONS[].options[].
 * expression — covers the union of both sources, since Chapter 6 reads
 * whichever value is present (live answer-derived first, profile's
 * static value as fallback) and must never hit an unmapped value.
 *
 * PROFILE_PLAYBOOK is keyed by profile name (must match PROFILES[i].name
 * exactly) — the one genuinely-per-archetype bucket, covering Chapter 7's
 * styleNotes (9 aesthetic categories), Chapter 9's trait styles,
 * Chapter 10's expanded Ideal Customer, Chapter 11's Customer Experience
 * extras, Chapter 13's Brand In Action, Chapter 16's Decision Guide, and
 * Chapter 19's Constitution principles. Filled in progressively phase by
 * phase — every render call site must tolerate a missing key gracefully
 * (a profile not yet authored for a given chapter) rather than throwing.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

  var FONT_PLAYBOOK = {
    "Lora": { personality: "Lora is a warm, literary serif — it reads as thoughtful and a little old-soul without feeling formal.", bestUses: "Best for body copy and headlines in brands built on trust, story, or craftsmanship.", pairings: "Pairs well with a clean sans-serif like Inter or Open Sans for contrast.", commonMistakes: "Avoid setting it too small — Lora's character shows up best at readable sizes, not in fine print." },
    "Bebas Neue": { personality: "Bebas Neue is bold, condensed, and all-caps by nature — it reads as confident and a little rebellious.", bestUses: "Best for short, punchy headlines and display type, not body copy.", pairings: "Pairs well with a neutral sans-serif like Inter to balance its intensity.", commonMistakes: "Avoid using it for long lines of text — it's built for impact, not readability at length." },
    "Playfair Display": { personality: "Playfair Display is a high-contrast serif with real elegance — it reads as premium and considered.", bestUses: "Best for headlines and titles in luxury, editorial, or heritage-driven brands.", pairings: "Pairs well with a simple, quiet serif or sans-serif like Lora or Poppins for body text.", commonMistakes: "Avoid using it for body copy — its dramatic contrast is built for large sizes, not paragraphs." },
    "Pacifico": { personality: "Pacifico is a casual, handwritten script — it reads as playful, personal, and unpolished on purpose.", bestUses: "Best for logos, accents, and short phrases in playful or boho-leaning brands.", pairings: "Pairs well with a clean sans-serif like Poppins to keep the overall look legible.", commonMistakes: "Avoid using it for anything longer than a phrase — scripts get hard to read fast at length." },
    "Merriweather": { personality: "Merriweather is a sturdy, readable serif — it reads as credible and substantial without feeling stiff.", bestUses: "Best for body copy in editorial, educational, or trust-driven brands.", pairings: "Pairs well with a confident sans-serif like Montserrat or Oswald for headlines.", commonMistakes: "Avoid pairing it with another ornate serif — Merriweather already carries enough visual weight on its own." },
    "Montserrat": { personality: "Montserrat is a geometric, modern sans-serif — it reads as clean, confident, and versatile.", bestUses: "Best for headlines and body copy alike in modern, minimalist, or professional brands.", pairings: "Pairs well with a serif like Lora or Merriweather for warmth and contrast.", commonMistakes: "Avoid using too many weights at once — Montserrat's clarity depends on restraint." },
    "Oswald": { personality: "Oswald is a tall, condensed sans-serif — it reads as bold and a little industrial.", bestUses: "Best for headlines and labels in bold, modern, or edgy brands.", pairings: "Pairs well with a rounder, more open sans-serif like Open Sans for body text.", commonMistakes: "Avoid using it for body copy — its condensed width gets hard to read in long paragraphs." },
    "Abril Fatface": { personality: "Abril Fatface is an extra-bold display serif — it reads as dramatic, rugged, and impossible to ignore.", bestUses: "Best for large, short headlines in bold or rustic-leaning brands.", pairings: "Pairs well with a simple monospace or sans-serif like Roboto Mono for contrast.", commonMistakes: "Avoid using it below display size — its weight and detail only work at large scale." },
    "Georgia": { personality: "Georgia is a classic, screen-friendly serif — it reads as dependable and easy to trust.", bestUses: "Best for body copy in warm, traditional, or trust-first brands.", pairings: "Pairs well with a bold display serif like Playfair Display for headlines.", commonMistakes: "Avoid using it for display headlines — Georgia is built for readability, not drama." },
    "Inter": { personality: "Inter is a highly legible, neutral sans-serif — it reads as clean and professional without much personality of its own.", bestUses: "Best for body copy and UI text in modern, minimalist, or bold brands that want the content to carry the voice.", pairings: "Pairs well with almost anything — that neutrality is exactly what makes it a reliable body-text partner.", commonMistakes: "Avoid relying on it for personality — Inter is a workhorse, not a signature." },
    "Poppins": { personality: "Poppins is a rounded, friendly geometric sans-serif — it reads as approachable and modern.", bestUses: "Best for headlines and body copy in playful, warm, or boho-leaning brands.", pairings: "Pairs well with a script like Pacifico for accents, or stands fine on its own.", commonMistakes: "Avoid pairing it with another rounded typeface — the softness can start to feel repetitive." },
    "Open Sans": { personality: "Open Sans is a humanist sans-serif — it reads as warm, clear, and easy to trust.", bestUses: "Best for body copy in warm or community-driven brands that still need strong readability.", pairings: "Pairs well with a warm serif like Lora for headlines.", commonMistakes: "Avoid using it as your only display font — Open Sans is built for reading, not standing out." },
    "Roboto Mono": { personality: "Roboto Mono is a fixed-width monospace — it reads as technical, honest, and unpolished on purpose.", bestUses: "Best for accents, labels, or body copy in rugged, technical, or no-frills brands.", pairings: "Pairs well with a bold display serif like Abril Fatface for contrast.", commonMistakes: "Avoid using it for long-form body copy in most contexts — its fixed width can feel dense at length." },
  };

  var EXPRESSION_PLAYBOOK = {
    mood: {
      "minimalist and clean": { why: "Minimalist and clean reads as confident rather than empty — it says you trust your work to speak without decoration.", examples: "Generous white space, one focal point per frame, and typography that carries the whole message.", application: "Use it in product photography, website layouts, and packaging — anywhere a customer needs to focus on one thing at a time.", avoid: "Don't let 'minimal' become 'boring' — one bold color or texture is what keeps clean from reading cold.", writingStyle: "Your writing should be short, declarative, and unafraid of white space on the page — let sentences breathe the way your visuals do." },
      "warm and cozy": { why: "Warm and cozy signals safety before anything else — it tells people they can slow down and trust what they're looking at.", examples: "Soft natural light, textured materials, muted earthy tones, and imagery that feels lived-in rather than staged.", application: "Use it in lifestyle photography, packaging texture, and any moment where you want someone to feel invited in, not sold to.", avoid: "Don't let warmth slide into cluttered — cozy still needs a clear focal point, or it reads as messy instead of comforting.", writingStyle: "Write like you're talking to one person, not a crowd — conversational, generous with reassurance, light on jargon." },
      "playful and fun": { why: "Playful and fun gives people permission to enjoy the interaction, not just complete a transaction.", examples: "Bright punchy color, unexpected angles, movement, and imagery that captures a genuine reaction, not a posed one.", application: "Use it in social content, packaging, and any first-touch moment — playful is a strong hook, even for a serious purchase.", avoid: "Don't let playful undercut trust — for anything high-stakes, pair the fun with visible proof you know what you're doing.", writingStyle: "Write with rhythm and personality — contractions, the occasional joke, short punchy sentences mixed with longer ones." },
      "elegant and luxurious": { why: "Elegant and luxurious signals that quality was considered at every step, not just the parts customers can see.", examples: "Negative space, rich jewel tones or deep neutrals, refined typography, and photography with deliberate, unhurried composition.", application: "Use it in packaging, product photography, and any unboxing or first-impression moment — luxury is felt in the details.", avoid: "Don't let elegant become inaccessible — the tone should feel earned, not cold or unapproachable.", writingStyle: "Write with restraint — fewer words, carefully chosen, no exclamation points doing the work adjectives should be doing." },
      "bold and vibrant": { why: "Bold and vibrant refuses to be scrolled past — it's a brand that wants to be noticed, not blend in.", examples: "High-contrast color, strong typography, dynamic compositions, and imagery with clear energy and motion.", application: "Use it in social content, advertising, and anywhere you're competing for a first glance in a crowded feed.", avoid: "Don't let bold become chaotic — one strong color and one strong idea per piece, not five competing for attention.", writingStyle: "Write with confidence and momentum — active verbs, short sentences, and a willingness to make a clear claim." },
      "classic": { why: "Classic borrows credibility from everything that's already stood the test of time — it reads as dependable, not trendy.", examples: "Balanced symmetrical composition, traditional serif type, and a restrained, timeless color palette.", application: "Use it anywhere you want longevity over novelty — packaging, signage, and anything meant to still look right in ten years.", avoid: "Don't let classic become dated — timeless still needs at least one modern touch to avoid feeling like a rerun.", writingStyle: "Write with clarity and correctness — complete sentences, minimal slang, a tone that would read the same in any decade." },
      "modern and edgy": { why: "Modern and edgy signals that you're building for what's next, not preserving what already exists.", examples: "Asymmetric layouts, unexpected type pairings, high-contrast color, and imagery that breaks a few conventional rules on purpose.", application: "Use it in digital-first content, branding for new categories, and anywhere you want to signal you're not the incumbent.", avoid: "Don't let edgy become confusing — the rule you break should be obvious, not accidental.", writingStyle: "Write with directness and a little friction — short, opinionated sentences, comfortable naming what you're against." },
      "boho and eclectic": { why: "Boho and eclectic tells people your brand values individuality over uniformity — nothing here came off an assembly line.", examples: "Layered textures, mixed patterns, warm natural tones, and imagery that feels curated rather than manufactured.", application: "Use it in product styling, packaging, and lifestyle photography — anywhere you want to show range, not repetition.", avoid: "Don't let eclectic become disorganized — mix intentionally, with one consistent thread tying every piece together.", writingStyle: "Write with warmth and a little whimsy — descriptive, sensory language, comfortable wandering before landing the point." },
      "professional and polished": { why: "Professional and polished builds trust fast with people who don't have time to verify credibility themselves.", examples: "Clean grids, consistent color use, sharp product photography, and typography that reads as considered, not default.", application: "Use it in client-facing materials, proposals, and any moment where competence needs to be obvious immediately.", avoid: "Don't let polished become sterile — one point of warmth or personality keeps professional from reading as robotic.", writingStyle: "Write clearly and get to the point — structured, well-organized, confident without needing to oversell." },
      "rugged and outdoorsy": { why: "Rugged and outdoorsy signals durability and honesty — built for real use, not just for looking good in a photo.", examples: "Earthy, weathered tones, textured materials, and imagery shot in real conditions rather than a studio.", application: "Use it in product photography, packaging, and anywhere durability or capability is the actual selling point.", avoid: "Don't let rugged become rough — the craftsmanship should still be visible, or it reads as unfinished instead of tough.", writingStyle: "Write plainly and directly — short, sturdy sentences, no unnecessary flourish, credibility over cleverness." },
    },
    voice: {
      "warm and approachable": { why: "Warm and approachable makes people feel like they're talking to a person, not a brand.", examples: "Conversational phrasing, first names, genuine reassurance, and a willingness to admit imperfection.", application: "Use it in customer service, onboarding, and anywhere someone might feel intimidated to ask a question.", avoid: "Don't let warm slide into vague — approachable still needs to give a real, useful answer.", communicationStyle: "You communicate best in dialogue, not broadcast — one-on-one conversation, replies, and comments over polished announcements." },
      "authoritative and expert": { why: "Authoritative and expert removes the guesswork — people come to you because they don't want to have to double-check.", examples: "Confident, direct claims backed by specifics, and a tone that explains rather than hedges.", application: "Use it in educational content, product descriptions, and anywhere a decision needs a confident recommendation.", avoid: "Don't let expert become condescending — confidence should invite questions, not shut them down.", communicationStyle: "You communicate best through teaching — explaining the why behind a recommendation, not just issuing it." },
      "playful and quirky": { why: "Playful and quirky signals that your brand doesn't take itself too seriously, even if the work behind it is serious.", examples: "Unexpected wordplay, a distinct sense of humor, and a willingness to break format when it's funnier that way.", application: "Use it in social content and anywhere a lighter touch will make your message more memorable, not less credible.", avoid: "Don't let quirky undercut the actual value — the joke should be the delivery, not the whole message.", communicationStyle: "You communicate best with personality up front — a strong opening line, humor, and a voice people would recognize blind." },
      "sophisticated and refined": { why: "Sophisticated and refined signals that every word was chosen on purpose, not just typed and sent.", examples: "Precise language, restrained tone, and a preference for understatement over exclamation.", application: "Use it in premium product copy, client communication, and anywhere overselling would undercut credibility.", avoid: "Don't let refined become distant — sophistication should still feel warm underneath the polish.", communicationStyle: "You communicate best in writing, not off-the-cuff — considered, edited, and never rushed." },
      "confident and bold": { why: "Confident and bold makes a clear claim instead of hedging — people trust a brand that knows what it's for.", examples: "Direct statements, strong opinions, and a willingness to name what you're against, not just what you're for.", application: "Use it in positioning, launch messaging, and anywhere you need to cut through noise fast.", avoid: "Don't let confident become arrogant — back every bold claim with something real underneath it.", communicationStyle: "You communicate best in short, declarative bursts — headlines and hooks, not long explanations." },
      "calm and grounded": { why: "Calm and grounded signals stability — people trust a brand that doesn't need to raise its voice to be heard.", examples: "Steady pacing, measured claims, and a tone that reassures without ever sounding urgent or pushy.", application: "Use it in customer support, long-term relationship communication, and anywhere trust matters more than excitement.", avoid: "Don't let calm become passive — grounded still needs to say something, not just avoid saying the wrong thing.", communicationStyle: "You communicate best over time, not in one big moment — consistency and follow-through say more than any single message." },
    },
    photography: {
      "bright, candid, energetic": { why: "Bright, candid, energetic photography captures a real reaction instead of a posed one — it feels alive, not staged.", examples: "Natural light, motion, genuine expressions, and moments caught mid-action rather than arranged.", application: "Use it for social content, events, and anywhere you want to show your brand in real use, not in a studio.", avoid: "Don't over-direct the shot — the energy comes from letting the moment happen, not from forcing a smile." },
      "soft, warm natural light": { why: "Soft, warm natural light photography feels inviting and honest — nothing about it feels manufactured.", examples: "Golden-hour lighting, muted tones, and compositions that feel unhurried rather than urgent.", application: "Use it for lifestyle photography, product-in-use shots, and anywhere warmth matters more than sharpness.", avoid: "Don't let soft become underexposed — warmth should still be clear and well-lit, not dim." },
      "moody, high-contrast, dramatic": { why: "Moody, high-contrast, dramatic photography signals seriousness and craft — it says this was considered, not casual.", examples: "Deep shadows, a single strong light source, and compositions with clear focal hierarchy.", application: "Use it for premium product photography, portraits, and anywhere gravity matters more than approachability.", avoid: "Don't let dramatic become dark for its own sake — the shadow should still serve the subject, not hide it." },
      "clean, symmetrical, minimal": { why: "Clean, symmetrical, minimal photography puts the product or subject front and center with nothing competing for attention.", examples: "Centered composition, negative space, and a limited, deliberate color palette.", application: "Use it for product photography, catalog imagery, and anywhere clarity matters more than mood.", avoid: "Don't let minimal become sterile — one considered detail keeps clean from reading as empty." },
    },
    colorFamily: {
      "neutral/monochrome": { why: "A neutral/monochrome palette signals restraint and confidence — the brand doesn't need color to make its point.", examples: "Black, white, and shades of gray, occasionally warmed with a single muted tone.", application: "Use it as a foundation for a brand that wants typography, photography, and product to carry the visual weight.", avoid: "Don't let monochrome go flat — vary texture, contrast, and scale so the palette still has visual depth." },
      "warm earthy neutrals": { why: "Warm earthy neutrals feel grounded and natural — the palette itself reads as honest, unforced.", examples: "Terracotta, sand, moss, and warm browns, paired with soft off-whites.", application: "Use it anywhere you want the palette itself to feel calming and organic, especially in packaging and interiors.", avoid: "Don't let earthy become muddy — keep at least one clear, clean tone in the mix so the palette stays legible." },
      "bright, punchy": { why: "A bright, punchy palette demands attention immediately — it's built to be noticed in a crowded feed or shelf.", examples: "Saturated primary or secondary colors used boldly, with minimal muting or blending.", application: "Use it for anything competing for a first glance — packaging, social content, and advertising.", avoid: "Don't use too many punchy colors at once — pick one hero color and let the rest support it." },
      "black/white + bold accent": { why: "Black and white with one bold accent gives a brand total clarity with a single, unmistakable signature color.", examples: "A strict black-and-white base, broken only by one saturated accent used consistently across every touchpoint.", application: "Use it anywhere you want instant recognizability — the accent color becomes shorthand for the whole brand.", avoid: "Don't let the accent color drift — using a slightly different shade each time weakens the signature it's meant to build." },
      "jewel tones": { why: "Jewel tones feel rich and considered — the palette itself communicates quality before anyone reads a word.", examples: "Deep emerald, sapphire, amethyst, and garnet, often paired with gold or cream.", application: "Use it anywhere you want to signal premium quality — packaging, product photography, and brand environments.", avoid: "Don't let jewel tones compete with each other — pick one dominant tone and use the rest as accents." },
    },
  };

  // Emotional Experience (Chapter 6) is derived from the founder's
  // Customer Impression™ self-image result rather than tracked as its
  // own independent dimension — reusing data already collected instead
  // of adding a new assessment axis just for this one field.
  var EMOTIONAL_EXPERIENCE_BY_SELF_IMAGE = {
    capable: "Your customers want to feel capable after interacting with your brand — like they can handle more than they thought. Every touchpoint should leave them more confident, not more dependent on you.",
    understood: "Your customers want to feel understood — like you get their specific situation, not a generic version of it. Every touchpoint should reflect that you're actually listening, not just responding.",
    bold: "Your customers want to feel bold after interacting with your brand — like they've made a brave choice, not a safe one. Every touchpoint should reinforce that courage, not water it down.",
    refined: "Your customers want to feel refined — like their taste and standards were recognized, not overlooked. Every touchpoint should match the level of consideration they expect.",
    grounded: "Your customers want to feel grounded — like they can trust this decision won't blow up in their face. Every touchpoint should reinforce stability, not introduce doubt.",
  };

  // Chapter 7 Colors — rather than hand-author 6 roles x 11 profiles
  // (330 entries that would drift from the actual hex values shown),
  // classify each profile's real hex by hue family and combine that with
  // role-based usage guidance. Pairings are computed at render time from
  // the profile's own other roles, not authored at all.
  function hexToHsl(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return null;
    var n = parseInt(m[1], 16);
    var r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var d = max - min;
    var s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    var h = 0;
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: h, s: s, l: l };
  }

  function classifyHue(hex) {
    var hsl = hexToHsl(hex);
    if (!hsl) return "charcoal";
    if (hsl.l < 0.18) return "charcoal";
    if (hsl.s < 0.12) return hsl.l > 0.5 ? "cream" : "charcoal";
    if (hsl.l > 0.88) return "cream";
    // A dark, muted brown and a bright saturated orange can share the
    // same hue angle while reading completely differently — a hue-angle
    // lookup alone would call a rugged, earthy #3D3428 "orange" just
    // because they're on the same side of the color wheel. Gate on
    // saturation/lightness first so genuinely muted tones read as
    // earthy regardless of which hue they're closest to.
    if (hsl.s < 0.35 && hsl.l < 0.55) return "earth";
    var h = hsl.h;
    if (h < 20 || h >= 340) return "redPink";
    if (h < 45) return "orange";
    if (h < 70) return "gold";
    if (h < 160) return "green";
    if (h < 195) return "teal";
    if (h < 255) return "blue";
    return "purple";
  }

  var HUE_FAMILY_CONTENT = {
    charcoal: { emotion: "grounded, serious, authoritative", why: "Dark, near-black tones read as confident and permanent — they don't need to compete for attention because they signal weight on their own.", avoid: "Don't use it as the only tone in a large area without any contrast — too much of it without relief can feel heavy or closed-off." },
    earth: { emotion: "grounded, natural, unpretentious", why: "Muted, dusty tones read as honest and unpolished — they feel like they came from the land, not a lab.", avoid: "Don't pair too many muted tones together without any contrast — earthy can start to feel flat without at least one clearer accent." },
    cream: { emotion: "calm, open, approachable", why: "Light, near-white tones read as spacious and honest — they give everything else room to breathe and feel less staged.", avoid: "Don't let it go stark white in large areas — a warm undertone keeps it feeling inviting rather than clinical." },
    redPink: { emotion: "energetic, bold, urgent", why: "Reds and pinks read as immediate and emotional — they're the fastest color family for grabbing attention or signaling passion.", avoid: "Don't overuse it in large areas for calm or trust-driven moments — it raises energy fast, which isn't always what you want." },
    orange: { emotion: "friendly, energetic, approachable", why: "Orange reads as warm and enthusiastic without the intensity of red — it's confident but still feels welcoming.", avoid: "Don't pair it with too many other saturated tones — it needs a quieter neutral around it to stay legible." },
    gold: { emotion: "optimistic, valuable, warm", why: "Gold and warm yellows read as optimistic and, in the right context, genuinely premium — think sunlight, not caution tape.", avoid: "Don't use a flat, cool yellow if premium is the goal — it can drift toward cheap or cautionary instead of rich." },
    green: { emotion: "natural, stable, growth-oriented", why: "Green reads as grounded and organic — it's the color most associated with growth, health, and sustainability.", avoid: "Don't use a very bright, synthetic green for anything meant to feel natural — it can read as artificial instead of organic." },
    teal: { emotion: "calm, trustworthy, clear-headed", why: "Teal blends the trust of blue with the freshness of green — it reads as clear, calm, and modern.", avoid: "Don't use it alongside too many other cool tones — it needs a warm accent nearby or the palette can feel cold." },
    blue: { emotion: "trustworthy, calm, dependable", why: "Blue is the most universally trusted color in branding — it reads as stable, credible, and safe.", avoid: "Don't rely on it alone to feel distinctive — it's trusted precisely because it's common, so it needs a strong accent to stand out." },
    purple: { emotion: "creative, distinctive, a little unconventional", why: "Purple reads as imaginative and a little rare — it's rarely anyone's default, so it signals a deliberate, considered choice.", avoid: "Don't use a very dark purple in low light contexts — it can read as black and lose its distinct character." },
  };

  var ROLE_BEST_USES = {
    primary: "Use this as the color people most associate with your brand — logo, headers, and the dominant tone across your biggest touchpoints.",
    secondary: "Use this to support your Primary without competing with it — secondary text treatments, section backgrounds, and complementary moments.",
    neutral: "Use this as your resting color — backgrounds, whitespace, and anywhere you need the eye to rest between bolder elements.",
    accent: "Use this deliberately and sparingly — calls to action, highlights, and the specific moments you want someone to notice first.",
    support: "Use this for secondary information — captions, muted text, and details that matter but shouldn't compete with your main message.",
    standOut: "Use this as your rarest, most attention-grabbing color — the one true highlight reserved for the single most important thing on the page.",
  };

  // Chapter 8 Foundation — generic, written once per foundation piece
  // (not per profile). Decision Filter and "How Customers Experience It"
  // are template/dynamic at render time, not authored content.
  var FOUNDATION_PLAYBOOK = {
    missionStatement: {
      label: "Mission Statement",
      whyItExists: "A mission statement exists to answer one question before any other: why does this business get to exist at all, beyond making money? It's the filter every other decision should pass through.",
      howToImprove: "Read it out loud. If it sounds like something any competitor could say word-for-word, it's not specific enough yet — it should only sound true coming from you.",
      realWorldExamples: "Brands like Patagonia and TOMS built entire customer bases around a mission stated so clearly it became inseparable from the product itself.",
    },
    northStar: {
      label: "Brand North Star",
      whyItExists: "A Brand North Star exists to give you one fixed point to navigate by when a decision doesn't have an obvious right answer.",
      howToImprove: "Make sure it describes a destination, not a task — a North Star built around \"being the steady hand people return to\" works because it never gets fully finished.",
      realWorldExamples: "Companies that stay recognizable for decades, like Nike or LEGO, tend to have a North Star that never changed even as their products did.",
    },
    promise: {
      label: "Brand Promise",
      whyItExists: "A Brand Promise exists to tell customers exactly what they can count on you for, every single time, no exceptions.",
      howToImprove: "Make sure you could actually deliver on it on your worst day, not just your best one — a promise you sometimes break is worse than no promise at all.",
      realWorldExamples: "Domino's rebuilt an entire brand around a specific, measurable promise about delivery time — narrow and concrete, which is exactly why it worked.",
    },
    coreValues: {
      label: "Core Values",
      whyItExists: "Core Values exist to make decisions faster, not to sound good on a wall — they should actively rule things out.",
      howToImprove: "For each value, write down one decision it would have changed if you'd used it as a filter — if you can't think of one, the value may be aspirational rather than actually operating.",
      realWorldExamples: "Zappos famously let \"deliver WOW through service\" override standard customer service scripts — a value that changed real decisions, not just described intentions.",
    },
  };

  // Chapter 7's 9 aesthetic style categories (Graphic Style, Texture,
  // Icons, Illustration, Motion, Layout, Whitespace, Packaging, Website
  // Feel) — genuinely per-profile, since these are about overall
  // aesthetic direction tied to mood/voice rather than a shared value
  // pool like EXPRESSION_PLAYBOOK's mood/voice/photography/colorFamily.
  // Chapter 14 (Creative Direction) — deliberately generic and written
  // once, not per-profile. The physical-execution categories here
  // (logo files, icon sets, animation, decks) are general design
  // craft, not something the assessment can personalize per archetype
  // without assuming what the founder's business actually needs — the
  // chapter routes founders to Branding Studio, Logo Studio, and Frank
  // (The Idea Haus's Creative Director) for the parts that genuinely
  // benefit from a real creative back-and-forth instead.
  var CREATIVE_DIRECTION_PLAYBOOK = {
    logoPrinciples: "A strong logo works in three colors or fewer, holds up in black and white, and is still recognizable shrunk down to the size of a favicon. If it only works large, in full color, on a white background, it's not finished yet.",
    symbols: "A symbol earns its place by meaning something specific to your brand, not just looking good in isolation. If you could swap it for a generic shape from a stock icon library and lose nothing, it's decoration, not a symbol.",
    composition: "Good composition gives the eye one clear place to land first, then a logical path to everything else. If everything is competing for attention at once, nothing actually gets it.",
    iconStyle: "Icons should share one consistent stroke weight, corner radius, and level of detail across your entire set — a mismatched icon is as noticeable as a misspelled word.",
    illustration: "Illustration should reinforce your brand's mood, not just fill empty space. If it could belong to any brand, it's not doing its job.",
    photography: "Photography should be shot with a consistent lighting style, color treatment, and level of polish across every piece — inconsistency here is one of the fastest ways a brand starts to feel unplanned.",
    animation: "Motion should feel like an extension of your brand's pace — quick and sharp for energetic brands, slow and deliberate for calm ones. The wrong pace of motion can undercut an otherwise perfect visual identity.",
    presentationDecks: "A presentation deck should follow the same color, type, and spacing rules as everything else you make — treat it as a real brand touchpoint, not a separate, disposable document.",
  };

  // Chapter 17 (Brand Evolution) — generic, written once, deliberately
  // without literal Year One/Years Two-Three predictions (a founder's
  // actual growth timeline isn't something a brand-identity assessment
  // can forecast). "How Supporting Identities Can Grow" is the one
  // dynamic piece, built at render time from the founder's own runner-up
  // profile match rather than authored here.
  var BRAND_EVOLUTION_PLAYBOOK = {
    lookPastToday: "It's tempting to treat this Blueprint as a finished answer. Treat it instead as where you're starting from. The founder who revisits their Brand DNA in a year will almost always find it's sharpened, not changed completely — but sharpened enough to matter.",
    buildTowardVision: "Let your Brand North Star set the direction, and let this Blueprint set today's starting point. The gap between the two isn't a problem to solve immediately — it's the work ahead of you.",
    expectItToEvolve: "Your business will teach you things about your brand that a 30-question assessment never could. When it does, that's not a contradiction of this Blueprint — it's the next layer of it.",
    whenWeCanHelp: "If your brand ever feels like it's outgrown this Blueprint — because you're launching something new, entering a new market, or building a genuinely different offering — that's usually a sign it's time to revisit the Founder Interview™, or even explore whether a tailored sub-brand makes more sense than stretching one identity across two different things. We're here to help you work through either.",
  };

  var PROFILE_PLAYBOOK = {
    "The Trusted Guide": {
      styleNotes: {
        graphicStyle: "Soft-edged shapes and rounded corners — nothing sharp or severe, everything approachable.",
        texture: "Subtle, tactile textures like linen or paper — nothing glossy or slick.",
        icons: "Simple, friendly line icons with rounded terminals, not sharp geometric ones.",
        illustration: "Warm, hand-drawn touches over polished vector art — it should feel human-made.",
        motion: "Slow, gentle transitions — nothing jarring or fast-paced.",
        layout: "Generous margins and a clear visual hierarchy that never feels crowded or rushed.",
        whitespace: "Use whitespace to signal patience — give every message room to be read slowly.",
        packaging: "If you have physical packaging, favor natural materials and a tactile unboxing moment over flashy presentation.",
        websiteFeel: "A website that feels like a welcoming front porch — easy to navigate, nothing hidden behind clever design.",
      },
      traits: {
        superpower: "You can make a total stranger feel like they've known you for years within the first few minutes.",
        leadershipStyle: "You lead by earning trust first and asking for buy-in second — people follow you because they believe you have their back.",
        innovationStyle: "You innovate slowly and carefully, testing new ideas on the people who trust you most before rolling them out further.",
        decisionStyle: "You decide by asking who this helps, and who it might hurt, before anything else.",
        workingStyle: "You work best with real relationships in the room — cold outreach and transactional partnerships drain you faster than they should.",
        stressStyle: "Under stress, you can overextend yourself trying to personally reassure everyone instead of setting a boundary.",
      },
      idealCustomer: {
        whoTheyAre: "Someone who's been sold to too many times and has learned to be skeptical of anyone with a pitch.",
        whoTheyWantToBecome: "Someone who trusts their own judgment again, with a guide they don't have to double-check.",
        dreams: "To find someone who tells them the truth even when it costs the sale.",
        frustrations: "Being talked down to, oversold, or given the runaround when something goes wrong.",
        buyingTriggers: "A genuine recommendation from someone they already trust, or a track record of following through.",
        emotionalNeeds: "To feel like they're being helped, not handled.",
        transformation: "From guarded and skeptical to genuinely at ease, because someone finally gave it to them straight.",
        whatTheyNeedToHear: "“Here's the honest answer, even if it's not the one you were hoping for.”",
      },
      customerExperience: {
        trustSignals: "Consistency over time, transparency about tradeoffs, and a track record of following through on promises.",
        whyTheyStay: "Because you've never once made them feel foolish for asking a question.",
        whyTheyRefer: "Because recommending you feels like doing a friend a favor, not endorsing a product.",
        whatTheyllRemember: "The moment you told them something honest instead of something easy.",
        customerJourney: "They arrive skeptical, stay because you keep your word, and become loyal because trust compounds over time.",
      },
      brandInAction: {
        dress: "Simple, well-made basics — nothing flashy, everything built to last.",
        speak: "Slowly and warmly, choosing words that reassure rather than impress.",
        lead: "By listening first and only offering direction once they've actually understood the problem.",
        solveProblems: "By asking what's actually needed before offering a fix, even if it takes longer.",
        celebrate: "Quietly, by thanking the people who helped get there.",
        handleCriticism: "By taking it seriously and following up personally, not defensively.",
        website: "Clear navigation, warm photography, and an easy way to actually reach a real person.",
        email: "Personal, direct, and written like it's from one person to one person.",
        ads: "Testimonial-driven, understated, built on trust rather than urgency.",
        social: "Helpful tips and behind-the-scenes honesty over polished promotion.",
        support: "Patient, thorough, and willing to explain the same thing twice without judgment.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you have time to build a real relationship before being asked to close a sale.",
        watchOutFor: "Watch out for undercharging or over-delivering just to avoid feeling like you're asking for too much.",
        slowDownWhen: "Slow down when a decision could damage someone's trust in you — that's worth the extra time.",
        trustYourselfWhen: "Trust yourself when your gut says someone needs the honest answer, not the easy one.",
        whereYoullNeedHelp: "You'll need help with anything that requires being pushy, fast-moving, or comfortable with conflict.",
        whatToDelegate: "Delegate negotiation and hard sales conversations to someone who doesn't feel guilty asking for what it's worth.",
        growthHabits: "Build a habit of reviewing your pricing every quarter — your instinct to be generous can quietly undercut your margins over time.",
      },
      constitution: [
        "Tell the truth, even when the easy answer would sell better.",
        "Never make someone feel foolish for asking a question.",
        "Follow through on every promise, especially the small ones.",
        "Choose the relationship over the transaction, every time.",
        "If you wouldn't recommend it to a friend, don't sell it.",
        "Slow down before every decision that could break someone's trust.",
        "Explain the reasoning, not just the recommendation.",
        "Never let being liked replace being honest.",
        "Show up after the sale the same way you showed up before it.",
        "When in doubt, choose the answer that helps them, not the one that helps you.",
      ],
    },
    "The Bold Pioneer": {
      styleNotes: {
        graphicStyle: "Sharp, geometric shapes with strong angles — visuals that feel like they're in motion.",
        texture: "High-contrast, glossy finishes — nothing muted or soft.",
        icons: "Bold, thick-stroke icons that read clearly even at a glance.",
        illustration: "Dynamic, energetic illustration with strong diagonal lines over static, symmetrical compositions.",
        motion: "Fast, confident transitions — motion that feels like momentum, not decoration.",
        layout: "Asymmetric layouts that break the grid on purpose — predictable is the enemy here.",
        whitespace: "Use whitespace sparingly and deliberately — let bold color and type do most of the work.",
        packaging: "If you have physical packaging, make the unboxing feel like an event, not just a delivery.",
        websiteFeel: "A website that feels like a launchpad — fast, confident, always pointing toward what's next.",
      },
      traits: {
        superpower: "You can make people believe in something that doesn't exist yet, just by describing it with total conviction.",
        leadershipStyle: "You lead from the front — people follow because you're already moving, not because you asked them to.",
        innovationStyle: "You innovate by acting first and refining later — you'd rather ship something imperfect than wait for permission.",
        decisionStyle: "You decide fast, trusting momentum over exhaustive analysis.",
        workingStyle: "You work best with real autonomy and a clear target — micromanagement kills your best ideas before they can prove themselves.",
        stressStyle: "Under stress, you can move even faster instead of slowing down, which sometimes turns momentum into chaos.",
      },
      idealCustomer: {
        whoTheyAre: "Someone who's outgrown the safe, conventional path and is ready to bet on something new.",
        whoTheyWantToBecome: "Someone remembered as an early believer in what everyone else caught onto later.",
        dreams: "To be part of building something before it's obvious to everyone else.",
        frustrations: "Slow-moving, risk-averse options that make them feel like they're settling.",
        buyingTriggers: "A bold claim backed by real proof, or seeing someone like them already moving.",
        emotionalNeeds: "To feel like they're ahead of the curve, not behind it.",
        transformation: "From restless and unsatisfied to genuinely energized about what's next.",
        whatTheyNeedToHear: "“This is what's coming next — and you can be part of it now, not later.”",
      },
      customerExperience: {
        trustSignals: "Visible momentum, bold claims that turn out to be true, and a willingness to show the work in progress.",
        whyTheyStay: "Because being early feels good, and you keep giving them reasons to have stayed early.",
        whyTheyRefer: "Because sharing you makes them look like they saw it coming.",
        whatTheyllRemember: "The moment they realized you were actually going to pull it off.",
        customerJourney: "They arrive curious, stay because the momentum is real, and become advocates because being right about you feels good.",
      },
      brandInAction: {
        dress: "Sharp, modern, slightly ahead of the trend — never last season.",
        speak: "Fast and directly, with conviction, rarely hedging a claim.",
        lead: "By setting an ambitious target and trusting the team to figure out how.",
        solveProblems: "By trying something new immediately rather than analyzing every option first.",
        celebrate: "Loudly and publicly — a win is a chance to build more momentum.",
        handleCriticism: "By moving forward anyway, sometimes too quickly to fully absorb the feedback.",
        website: "Bold visuals, big claims, and clear forward motion in every section.",
        email: "Punchy subject lines and a strong point of view, never buried in caveats.",
        ads: "High-energy, benefit-forward, built to stop the scroll.",
        social: "Announcements, behind-the-scenes momentum, and a strong point of view on the industry.",
        support: "Fast and efficient — quick resolution matters more than a long conversation.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you have a clear, ambitious target and the freedom to move toward it fast.",
        watchOutFor: "Watch out for moving so fast that the people around you can't keep up or buy in.",
        slowDownWhen: "Slow down when a decision is hard to reverse — momentum is your strength, but not every choice should be made at speed.",
        trustYourselfWhen: "Trust yourself when everyone else is playing it safe and your gut says the bold move is the right one.",
        whereYoullNeedHelp: "You'll need help with the slow, detailed follow-through that keeps a bold idea from falling apart.",
        whatToDelegate: "Delegate operations and process to someone who finds structure energizing instead of draining.",
        growthHabits: "Build a habit of pausing before a big irreversible decision to get one outside perspective, even briefly.",
      },
      constitution: [
        "Move first, even when it's uncomfortable.",
        "Never let fear of being wrong slow down being early.",
        "Say the bold thing out loud, not just internally.",
        "Bet on momentum over certainty.",
        "If it's already been done, do something else.",
        "Protect the team's ability to move fast — remove blockers before they ask.",
        "Celebrate the attempt, not just the win.",
        "When everyone else zigs, ask why you'd zig too.",
        "Ship the imperfect version rather than wait for the perfect one.",
        "Stay hungry for what's next, even after a win.",
      ],
    },
    "The Cozy Craftsman": {
      styleNotes: {
        graphicStyle: "Textured, handmade-feeling shapes — nothing that looks mass-produced.",
        texture: "Wood grain, fabric, and worn materials — texture that shows the hand behind the work.",
        icons: "Simple, slightly imperfect line icons — hand-drawn over perfectly vectorized.",
        illustration: "Detailed, craft-inspired illustration that rewards a closer look.",
        motion: "Minimal, understated motion — let the craftsmanship be still enough to notice.",
        layout: "Layouts with a slower rhythm — more breathing room between sections than a typical grid.",
        whitespace: "Use whitespace the way a craftsman uses negative space in a piece — intentional, not empty.",
        packaging: "If you have physical packaging, prioritize materials that feel as good as the product looks.",
        websiteFeel: "A website that feels like a workshop you're welcome to wander through, not a storefront rushing you to check out.",
      },
      traits: {
        superpower: "You can spot the one flaw that would bother a customer years later, before it ever leaves your hands.",
        leadershipStyle: "You lead by example, through the quality of your own work, more than through direction-giving.",
        innovationStyle: "You innovate slowly, refining what already works rather than chasing what's new for its own sake.",
        decisionStyle: "You decide by asking whether it would still feel right in ten years, not just today.",
        workingStyle: "You work best with enough time to do things properly — rushed deadlines are where your work suffers most.",
        stressStyle: "Under stress, you can slow down too much trying to perfect something that was already good enough to ship.",
      },
      idealCustomer: {
        whoTheyAre: "Someone tired of replacing things that were never built to last in the first place.",
        whoTheyWantToBecome: "Someone who owns fewer, better things — and knows the story behind each one.",
        dreams: "To surround themselves with things made with real care, not mass-produced convenience.",
        frustrations: "Planned obsolescence and products that look good in photos but fall apart in use.",
        buyingTriggers: "Visible craftsmanship, a real story behind the maker, or a recommendation from someone who already owns one.",
        emotionalNeeds: "To feel like their purchase was a considered choice, not an impulse.",
        transformation: "From frustrated by disposable options to genuinely proud of what they own.",
        whatTheyNeedToHear: "“This was made to actually last — and here's exactly how.”",
      },
      customerExperience: {
        trustSignals: "Visible craftsmanship, consistent quality over time, and materials that hold up under real use.",
        whyTheyStay: "Because everything they've bought from you has actually lasted.",
        whyTheyRefer: "Because they want someone else to experience the same quality they found.",
        whatTheyllRemember: "The specific detail that told them this was made with real care.",
        customerJourney: "They arrive cautious after past disappointments, stay because the quality proves itself, and become loyal because trust in craft is hard to find twice.",
      },
      brandInAction: {
        dress: "Timeless, well-made pieces they'll still be wearing in ten years.",
        speak: "Warmly and specifically, often about the details behind the work.",
        lead: "By modeling the standard of care they expect from everyone else.",
        solveProblems: "By slowing down and doing it right, even if that means missing a faster deadline.",
        celebrate: "By pointing to the craftsmanship itself as the real win.",
        handleCriticism: "By examining it closely — if it's about quality, they take it personally in the best way.",
        website: "Rich imagery of the making process, texture, and materials front and center.",
        email: "Story-driven, unhurried, focused on the craft behind the product.",
        ads: "Close-up shots of detail and materials, not lifestyle staging.",
        social: "Behind-the-scenes process content — the making is as interesting as the made.",
        support: "Thorough and hands-on, happy to explain exactly how something was made.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you have the time to do something properly, without a rushed deadline hanging over it.",
        watchOutFor: "Watch out for perfectionism that quietly turns into missed deadlines.",
        slowDownWhen: "Slow down when you're about to cut a corner on quality just to hit a date.",
        trustYourselfWhen: "Trust yourself when something feels rushed or unfinished, even if everyone else says it's fine.",
        whereYoullNeedHelp: "You'll need help with anything that requires speed over craft, like fast-turnaround marketing or trend-driven content.",
        whatToDelegate: "Delegate time-sensitive, high-volume work to someone who thrives under deadline pressure.",
        growthHabits: "Build a habit of setting a hard stop time for refinement — \"good enough to ship\" is a skill worth practicing.",
      },
      constitution: [
        "Never ship something you wouldn't be proud to have your name on.",
        "Take the extra day if it means getting it right.",
        "Materials and details matter as much as the big idea.",
        "Tell the story behind the work — it's part of the product.",
        "Choose fewer, better things over more, average things.",
        "If a shortcut compromises quality, it's not actually a shortcut.",
        "Respect the craft enough to keep learning it.",
        "Let the work speak before the marketing does.",
        "Build things meant to outlast the trend that inspired them.",
        "When rushed, protect quality first and negotiate the deadline second.",
      ],
    },
    "The Elevated Icon": {
      styleNotes: {
        graphicStyle: "Clean, refined shapes with generous negative space — nothing loud or busy.",
        texture: "Subtle sheens, matte finishes, and high-quality materials — texture that whispers rather than shouts.",
        icons: "Thin, precise line icons — restraint is the signal of quality here.",
        illustration: "Minimal, editorial-style illustration used sparingly, if at all.",
        motion: "Slow, deliberate motion — every transition should feel considered, never rushed.",
        layout: "Symmetrical, gallery-style layouts with significant breathing room around every element.",
        whitespace: "Use generous whitespace as a luxury signal — the room around the product is part of the product.",
        packaging: "If you have physical packaging, treat the unboxing as the first product experience, not an afterthought.",
        websiteFeel: "A website that feels like a private showroom — quiet, spacious, and never rushing the visitor.",
      },
      traits: {
        superpower: "You can spot the one detail that separates good from exceptional, faster than almost anyone else in the room.",
        leadershipStyle: "You lead by setting an uncompromising standard and trusting your team to rise to meet it.",
        innovationStyle: "You innovate through refinement — taking something already respected and making it undeniably better.",
        decisionStyle: "You decide by asking whether this protects or dilutes the standard you've built.",
        workingStyle: "You work best with fewer, higher-stakes projects rather than a high volume of smaller ones.",
        stressStyle: "Under stress, you can become overly critical of work that's actually fine, chasing a standard that keeps moving.",
      },
      idealCustomer: {
        whoTheyAre: "Someone who's outgrown \"good enough\" and can tell the difference between polished and truly excellent.",
        whoTheyWantToBecome: "Someone whose taste is visibly reflected in everything they choose to buy.",
        dreams: "To own the version of something that very few people ever get right.",
        frustrations: "Being sold hype dressed up as quality, or paying a premium for something that doesn't hold up.",
        buyingTriggers: "Visible, undeniable craftsmanship, or the sense that very few people could have made this.",
        emotionalNeeds: "To feel like their standards were finally met, not just tolerated.",
        transformation: "From settling for adequate to confidently owning the exceptional.",
        whatTheyNeedToHear: "“This was made to the standard you've been looking for all along.”",
      },
      customerExperience: {
        trustSignals: "Uncompromising attention to detail and a consistent standard across every single touchpoint.",
        whyTheyStay: "Because you've never once let the standard slip.",
        whyTheyRefer: "Because recommending you signals their own taste, not just yours.",
        whatTheyllRemember: "The single detail that made them realize no one else was doing it at this level.",
        customerJourney: "They arrive with high expectations, stay because you consistently exceed them, and become advocates because being associated with excellence reflects well on them too.",
      },
      brandInAction: {
        dress: "Understated, expensive-looking, never a single detail out of place.",
        speak: "Precisely, with restraint — every word chosen on purpose.",
        lead: "By setting an uncompromising bar and expecting excellence without repeating themselves.",
        solveProblems: "By quietly raising the standard until the problem stops recurring.",
        celebrate: "Privately and elegantly — a quiet acknowledgment, not a big announcement.",
        handleCriticism: "By evaluating it against their own standard, not the critic's opinion.",
        website: "Minimal, spacious, editorial — every element earning its place.",
        email: "Rare, considered, and worth opening every time.",
        ads: "Understated and visual-first, letting quality speak without hard selling.",
        social: "Polished, infrequent, and consistently excellent rather than high-volume.",
        support: "White-glove and proactive — issues are resolved before the customer has to ask.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you're given the time and resources to do something at the standard you actually hold yourself to.",
        watchOutFor: "Watch out for chasing a standard of perfection that keeps moving further away the closer you get.",
        slowDownWhen: "Slow down when you're about to reject work that's actually fine, just not exactly how you'd have done it.",
        trustYourselfWhen: "Trust yourself when your gut says something isn't ready, even if a deadline says otherwise.",
        whereYoullNeedHelp: "You'll need help with anything high-volume or fast-turnaround — that's not where your strength lives.",
        whatToDelegate: "Delegate repetitive or high-frequency tasks to someone who can maintain consistency without needing every detail perfected.",
        growthHabits: "Build a habit of defining \"done\" explicitly before starting a project, so perfect doesn't quietly become the enemy of finished.",
      },
      constitution: [
        "Never let \"good enough\" become the standard.",
        "Every detail is either raising the bar or lowering it — there's no neutral.",
        "Say no to volume that would compromise the standard.",
        "Let the quality speak before the price does.",
        "If very few people could do this, that's the point, not a problem.",
        "Refine rather than reinvent — excellence is usually earned slowly.",
        "Never explain away a flaw — fix it or don't ship it.",
        "Protect exclusivity; it's not the same as being unwelcoming.",
        "Hold the team to the standard you hold yourself to.",
        "When in doubt, choose the option that respects the legacy you're building.",
      ],
    },
    "The Free Spirit": {
      styleNotes: {
        graphicStyle: "Organic, hand-drawn shapes — nothing that feels engineered or overly precise.",
        texture: "Layered, mixed textures — fabric, paint, paper, all coexisting without matching perfectly.",
        icons: "Loose, sketch-style icons over clean geometric ones.",
        illustration: "Expressive, painterly illustration that leaves room for imperfection.",
        motion: "Playful, slightly unpredictable motion — nothing that feels mechanical.",
        layout: "Layered, collage-style layouts over rigid grids.",
        whitespace: "Use whitespace loosely — it's fine for things to feel a little full, as long as it feels alive.",
        packaging: "If you have physical packaging, let it feel handmade and a little different every time.",
        websiteFeel: "A website that feels like a creative studio, not a template — a little unexpected at every scroll.",
      },
      traits: {
        superpower: "You can turn a constraint everyone else sees as a limitation into the most interesting part of the project.",
        leadershipStyle: "You lead by inspiring people to think differently, not by directing their every move.",
        innovationStyle: "You innovate constantly and instinctively — new ideas are less a strategy and more your default state.",
        decisionStyle: "You decide by asking whether it still feels true to you, even if it's not the safest option.",
        workingStyle: "You work best with real creative freedom — rigid processes and constant oversight shut you down fast.",
        stressStyle: "Under stress, you can scatter across too many new ideas instead of finishing the one already in progress.",
      },
      idealCustomer: {
        whoTheyAre: "Someone who feels boxed in by conventional expectations and is looking for permission to be different.",
        whoTheyWantToBecome: "Someone who fully expresses their own point of view without editing it down.",
        dreams: "To build a life and a brand that actually looks like them, not a template.",
        frustrations: "Rigid, one-size-fits-all options that ask them to conform to fit in.",
        buyingTriggers: "Something that feels handmade, individual, and unmistakably not mass-produced.",
        emotionalNeeds: "To feel seen as an individual, not a market segment.",
        transformation: "From constrained and generic to genuinely, visibly themselves.",
        whatTheyNeedToHear: "“There's no one right way to do this — here's a version that's actually you.”",
      },
      customerExperience: {
        trustSignals: "Authenticity that doesn't waver depending on the audience, and a willingness to be genuinely different.",
        whyTheyStay: "Because you've never asked them to be anyone other than who they are.",
        whyTheyRefer: "Because sharing you feels like sharing a discovery, not a product.",
        whatTheyllRemember: "The moment you did something unexpected that felt completely, unmistakably you.",
        customerJourney: "They arrive looking for something different, stay because it never becomes generic, and become advocates because your authenticity gives them permission to be authentic too.",
      },
      brandInAction: {
        dress: "Eclectic and personal — nothing off a mannequin, everything a little unexpected.",
        speak: "Expressively and openly, often wandering before landing the point.",
        lead: "By inviting people to bring their own ideas, not just execute someone else's.",
        solveProblems: "By trying an unconventional angle first, since the obvious one rarely appeals.",
        celebrate: "Playfully and publicly, making room for everyone's individual contribution.",
        handleCriticism: "By weighing it against their own gut feeling before deciding whether it applies.",
        website: "Colorful, textured, a little unconventional in layout — nothing template-feeling.",
        email: "Conversational and personal, more like a letter from a friend than a newsletter.",
        ads: "Visually distinctive, story-driven, unlike anything else in the category.",
        social: "Authentic, unpolished moments over produced content.",
        support: "Warm and flexible, happy to bend a rule if it genuinely helps.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you have creative freedom and no one's looking over your shoulder.",
        watchOutFor: "Watch out for starting more than you finish — new ideas are exciting, but follow-through is where the value actually lands.",
        slowDownWhen: "Slow down when you're about to abandon something promising just because a newer idea showed up.",
        trustYourselfWhen: "Trust yourself when your gut says the unconventional choice is actually the right one, even if it's not the popular one.",
        whereYoullNeedHelp: "You'll need help with structure, systems, and the kind of repetitive follow-through that keeps a business running.",
        whatToDelegate: "Delegate operations, scheduling, and anything that needs to happen the same way every time.",
        growthHabits: "Build a habit of finishing one thing completely before starting the next — even just once a week.",
      },
      constitution: [
        "Protect the freedom to make things your own way.",
        "If it feels like everyone else's version, start over.",
        "Let curiosity lead before strategy takes the wheel.",
        "Individuality is the product, not a marketing angle.",
        "Never edit out the part that makes it distinctly you.",
        "Finish what you start, even when a new idea is more exciting.",
        "Give people permission to be themselves the way you give yourself that permission.",
        "Choose authenticity over polish when they conflict.",
        "Let mistakes be part of the story, not something to hide.",
        "When in doubt, choose the option that feels most like you, not the safest one.",
      ],
    },
    "The Joyful Connector": {
      styleNotes: {
        graphicStyle: "Rounded, friendly shapes in bright, saturated color.",
        texture: "Playful, tactile textures — nothing too serious or corporate.",
        icons: "Bright, rounded icons with personality — icons that could almost smile.",
        illustration: "Fun, character-driven illustration over stock-feeling photography.",
        motion: "Bouncy, energetic motion — transitions that feel like a little celebration.",
        layout: "Layouts with clear visual rhythm and lots of color-blocked sections.",
        whitespace: "Use whitespace to give bright colors room to pop, not to feel sparse.",
        packaging: "If you have physical packaging, make it feel like a small gift every time.",
        websiteFeel: "A website that feels like a party you're invited to, not a transaction you're completing.",
      },
      traits: {
        superpower: "You can turn a room of strangers into a group that feels like they already belong together.",
        leadershipStyle: "You lead by making people feel genuinely seen, not just managed.",
        innovationStyle: "You innovate by listening closely to what would make people feel more included, then building it.",
        decisionStyle: "You decide by asking whether this brings people closer together or pushes them apart.",
        workingStyle: "You work best in collaboration — isolated, heads-down work drains your energy faster than almost anything else.",
        stressStyle: "Under stress, you can overcommit to keeping everyone happy, at the cost of your own bandwidth.",
      },
      idealCustomer: {
        whoTheyAre: "Someone looking for more than a transaction — they want to feel like they belong somewhere.",
        whoTheyWantToBecome: "Someone with a real community around them, not just a following.",
        dreams: "To find their people — a place where they're genuinely known, not just a customer number.",
        frustrations: "Cold, impersonal brands that treat every interaction like a transaction.",
        buyingTriggers: "A warm first impression, social proof from people who feel like real people, and a sense of shared identity.",
        emotionalNeeds: "To feel like they're part of something, not just buying from something.",
        transformation: "From isolated or overlooked to genuinely connected and included.",
        whatTheyNeedToHear: "“You're not just a customer here — you're one of us.”",
      },
      customerExperience: {
        trustSignals: "Genuine warmth in every interaction and visible proof of a real, active community.",
        whyTheyStay: "Because they feel like a person here, not an account number.",
        whyTheyRefer: "Because they want their friends to feel the same belonging they found.",
        whatTheyllRemember: "The moment they felt truly included, not just served.",
        customerJourney: "They arrive a little unsure if they'll fit in, stay because they're welcomed immediately, and become advocates because belonging is worth sharing.",
      },
      brandInAction: {
        dress: "Bright, fun, and a little playful — an outfit that starts conversations.",
        speak: "Warmly and enthusiastically, often with humor woven in.",
        lead: "By making sure everyone feels included in the win, not just credited for it.",
        solveProblems: "By pulling people together to solve it as a group, not alone.",
        celebrate: "Big and inclusive — everyone gets to be part of the celebration.",
        handleCriticism: "By genuinely listening and thanking the person for caring enough to say it.",
        website: "Bright, warm, community-forward — real people featured throughout.",
        email: "Friendly and personal, written like a note to a friend, not a brand.",
        ads: "Joyful and inclusive, built around real people and real moments.",
        social: "Highly interactive — comments, replies, and user-generated content front and center.",
        support: "Warm and personal, treating every interaction like a chance to build the relationship.",
      },
      decisionGuide: {
        atYourBest: "You're at your best surrounded by people, building something collaboratively rather than alone.",
        watchOutFor: "Watch out for saying yes to too much because you don't want to let anyone down.",
        slowDownWhen: "Slow down when you're about to overcommit your own time trying to make everyone happy at once.",
        trustYourselfWhen: "Trust yourself when your gut says a decision will bring people closer together, even if it's not the most efficient option.",
        whereYoullNeedHelp: "You'll need help with tasks that require solitude, hard boundaries, or saying no.",
        whatToDelegate: "Delegate scheduling and boundary-setting to someone who can protect your time better than you protect it yourself.",
        growthHabits: "Build a habit of checking your calendar for overcommitment weekly, before it becomes a crisis.",
      },
      constitution: [
        "No one should feel like a stranger here, including on day one.",
        "Celebrate wins loudly and include everyone in them.",
        "Choose warmth over efficiency when they're in tension.",
        "Remember names, details, and the small things people mention.",
        "If a decision makes someone feel excluded, reconsider it.",
        "Make room for other people's voices, not just your own.",
        "Turn every first-time customer into someone who feels like they belong.",
        "Never let scale replace personal connection.",
        "Say thank you more than feels necessary.",
        "When in doubt, choose the option that brings people closer together.",
      ],
    },
    "The Quiet Authority": {
      styleNotes: {
        graphicStyle: "Structured, grid-based shapes — visuals that feel engineered and precise.",
        texture: "Matte, understated finishes — nothing flashy or attention-seeking.",
        icons: "Precise, technical line icons — consistency matters more than personality here.",
        illustration: "Data-driven or diagrammatic illustration over decorative art.",
        motion: "Minimal, purposeful motion — only moving when it clarifies something.",
        layout: "Clean, well-organized grid layouts with clear information hierarchy.",
        whitespace: "Use whitespace to organize information, not just to look clean.",
        packaging: "If you have physical packaging, prioritize clarity of information over decoration.",
        websiteFeel: "A website that feels like a well-run briefing — everything findable, nothing overstated.",
      },
      traits: {
        superpower: "You can make a complicated, high-stakes decision feel simple and safe just by explaining it clearly.",
        leadershipStyle: "You lead by demonstrating competence consistently, not by asserting authority loudly.",
        innovationStyle: "You innovate methodically, testing an idea thoroughly before ever presenting it as a recommendation.",
        decisionStyle: "You decide based on evidence and track record, not instinct or trend.",
        workingStyle: "You work best with clear expectations and the space to do rigorous, uninterrupted work.",
        stressStyle: "Under stress, you can over-explain and over-caveat, which can read as uncertainty even when you're sure.",
      },
      idealCustomer: {
        whoTheyAre: "Someone making a high-stakes decision who doesn't have time to sort credible expertise from noise.",
        whoTheyWantToBecome: "Someone confident they made the right call, backed by real expertise.",
        dreams: "To hand a hard problem to someone who will actually solve it correctly the first time.",
        frustrations: "Overconfident amateurs and vague reassurances that don't hold up under scrutiny.",
        buyingTriggers: "Demonstrated expertise, credentials, or a track record that removes the guesswork.",
        emotionalNeeds: "To feel like the decision is finally off their plate and in capable hands.",
        transformation: "From anxious and uncertain to genuinely confident in the outcome.",
        whatTheyNeedToHear: "“Here's exactly why this is the right call, and here's the track record behind it.”",
      },
      customerExperience: {
        trustSignals: "Demonstrated expertise, consistent follow-through, and a track record that speaks for itself.",
        whyTheyStay: "Because you've never once been wrong when it counted.",
        whyTheyRefer: "Because recommending an expert reflects well on their own judgment.",
        whatTheyllRemember: "The moment your recommendation turned out to be exactly right.",
        customerJourney: "They arrive needing a confident answer, stay because your track record holds up, and become advocates because expertise this reliable is rare.",
      },
      brandInAction: {
        dress: "Professional and understated — competence, not flash, is the message.",
        speak: "Measured and precise, backing claims with specifics rather than enthusiasm.",
        lead: "By demonstrating expertise consistently rather than asserting it.",
        solveProblems: "By researching thoroughly before recommending a single path forward.",
        celebrate: "Quietly, letting the result and the data speak for themselves.",
        handleCriticism: "By evaluating it against evidence, not taking it personally.",
        website: "Clear, credential-forward, and easy to verify expertise at a glance.",
        email: "Informative and substantive, respecting the reader's time and intelligence.",
        ads: "Fact-driven and credible, avoiding hype in favor of proof.",
        social: "Educational content that builds authority over time.",
        support: "Thorough, accurate, and unafraid to say \"I need to look into that\" rather than guess.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you have the space to do rigorous work before being asked to present conclusions.",
        watchOutFor: "Watch out for over-explaining or over-caveating in a way that can read as uncertainty.",
        slowDownWhen: "Slow down when you're tempted to skip the research step because you already have a hunch.",
        trustYourselfWhen: "Trust yourself when the evidence supports a call, even if it's not the popular one.",
        whereYoullNeedHelp: "You'll need help with fast, instinct-driven decisions where there isn't time for full analysis.",
        whatToDelegate: "Delegate quick, low-stakes decisions to someone who's comfortable moving on gut feel.",
        growthHabits: "Build a habit of setting a research time limit before a decision, so thoroughness doesn't quietly become stalling.",
      },
      constitution: [
        "Never recommend something you haven't verified yourself.",
        "Let evidence, not confidence alone, drive every claim.",
        "Say \"I need to check\" rather than guess.",
        "Consistency of expertise matters more than speed of delivery.",
        "Explain your reasoning so trust is earned, not just assumed.",
        "Protect your credibility — it's the actual product.",
        "Admit when you're wrong, immediately and clearly.",
        "Choose being right over being popular.",
        "Keep learning; expertise that stops updating becomes a liability.",
        "When in doubt, choose the option the evidence actually supports.",
      ],
    },
    "The Modern Minimalist": {
      styleNotes: {
        graphicStyle: "Simple geometric shapes with a single accent color — restraint is the whole point.",
        texture: "Flat, matte surfaces — texture should never distract from form.",
        icons: "Ultra-simple, single-weight line icons — nothing decorative.",
        illustration: "Minimal or no illustration — let photography and typography carry the visual weight.",
        motion: "Sharp, quick, purposeful motion — no unnecessary flourish.",
        layout: "Strict grid layouts with a lot of negative space around every element.",
        whitespace: "Whitespace isn't empty space here — it's the primary design element.",
        packaging: "If you have physical packaging, strip it down to only what's functionally necessary.",
        websiteFeel: "A website that feels like an empty gallery wall with one perfect piece on it.",
      },
      traits: {
        superpower: "You can look at something cluttered and instantly see the two or three things actually worth keeping.",
        leadershipStyle: "You lead by removing obstacles and noise, not by adding more direction than necessary.",
        innovationStyle: "You innovate by subtraction — improving something by taking parts away, not adding features.",
        decisionStyle: "You decide by asking what the simplest version of this would look like, and starting there.",
        workingStyle: "You work best with a short, clear list of priorities — too many open threads at once genuinely slows you down.",
        stressStyle: "Under stress, you can strip things down so far that something genuinely necessary gets cut along with the noise.",
      },
      idealCustomer: {
        whoTheyAre: "Someone overwhelmed by too many choices, too much clutter, and too much noise.",
        whoTheyWantToBecome: "Someone whose life and belongings feel calm, intentional, and easy to manage.",
        dreams: "To own less, but have everything they own actually matter.",
        frustrations: "Overcomplicated products, cluttered experiences, and unnecessary decisions.",
        buyingTriggers: "Obvious simplicity, clarity of purpose, and the absence of unnecessary extras.",
        emotionalNeeds: "To feel relief, not more decision fatigue.",
        transformation: "From overwhelmed and cluttered to calm and clear.",
        whatTheyNeedToHear: "“This does exactly what you need, and nothing you don't.”",
      },
      customerExperience: {
        trustSignals: "A consistently uncluttered experience with no hidden fees, extra steps, or unnecessary friction.",
        whyTheyStay: "Because nothing about working with you ever feels more complicated than it needs to be.",
        whyTheyRefer: "Because recommending something genuinely simple is an easy, low-risk favor to give.",
        whatTheyllRemember: "How easy the whole thing was, start to finish.",
        customerJourney: "They arrive tired of complexity, stay because everything just works, and become advocates because simplicity this consistent is worth telling people about.",
      },
      brandInAction: {
        dress: "A tight, considered wardrobe — quality basics, nothing excessive.",
        speak: "Briefly and clearly, cutting anything that doesn't add real value.",
        lead: "By removing distractions so the team can focus on what actually matters.",
        solveProblems: "By stripping the problem down to its simplest form before acting.",
        celebrate: "Briefly and genuinely — a clear acknowledgment, then back to work.",
        handleCriticism: "By taking only the part that's actually actionable and discarding the noise.",
        website: "Clean, fast, and frictionless — nothing between the visitor and what they came for.",
        email: "Short and to the point, respecting the reader's inbox.",
        ads: "Simple, clear, one message per piece — no competing calls to action.",
        social: "Minimal but intentional — quality of posts over frequency.",
        support: "Efficient and clear, solving the issue in as few steps as possible.",
      },
      decisionGuide: {
        atYourBest: "You're at your best with a short, clear list of priorities and permission to ignore everything else.",
        watchOutFor: "Watch out for cutting something that was actually necessary in the name of simplicity.",
        slowDownWhen: "Slow down when you're about to remove something without checking whether it's actually load-bearing.",
        trustYourselfWhen: "Trust yourself when your gut says a decision is more complicated than it needs to be.",
        whereYoullNeedHelp: "You'll need help with anything that benefits from more options, more detail, or more nuance than your instinct wants to give it.",
        whatToDelegate: "Delegate detailed research and exhaustive option-comparisons to someone who enjoys that depth.",
        growthHabits: "Build a habit of asking what this would look like with one thing added back, before finalizing a simplification.",
      },
      constitution: [
        "If it doesn't add real value, cut it.",
        "Simplicity is a discipline, not a default — defend it.",
        "One clear message beats three competing ones.",
        "Never confuse \"more\" with \"better.\"",
        "Protect whitespace, literally and figuratively.",
        "Say no to features and additions that complicate more than they help.",
        "Make the simplest version first, then justify anything added.",
        "Respect people's time and attention as scarce resources.",
        "Choose clarity over cleverness.",
        "When in doubt, choose the option that removes something, not adds it.",
      ],
    },
    "The Community Builder": {
      styleNotes: {
        graphicStyle: "Warm, rounded shapes that feel like they're inviting people in, not showing off.",
        texture: "Soft, natural textures — nothing that feels cold or corporate.",
        icons: "Friendly, rounded icons that feel like they belong in a shared space.",
        illustration: "Illustration featuring real people and real moments over abstract concepts.",
        motion: "Warm, welcoming motion — nothing that feels rushed or transactional.",
        layout: "Layouts that make room for multiple voices, not just one hero message.",
        whitespace: "Use whitespace to make every visitor feel like there's room for them too.",
        packaging: "If you have physical packaging, make it feel like it was made with the community in mind, not just for a single customer.",
        websiteFeel: "A website that feels like a community hub — easy to find your place in, not just to browse.",
      },
      traits: {
        superpower: "You can make a first-time customer feel like a founding member of something bigger than a transaction.",
        leadershipStyle: "You lead by building the table, then making sure everyone actually has a seat at it.",
        innovationStyle: "You innovate by asking your community what they need, then building exactly that instead of guessing.",
        decisionStyle: "You decide by asking who gets left out if you move forward this way.",
        workingStyle: "You work best with regular touchpoints with real people — too much time removed from the community leaves you unmoored.",
        stressStyle: "Under stress, you can say yes to too many requests trying to keep everyone included, until your own priorities disappear.",
      },
      idealCustomer: {
        whoTheyAre: "Someone looking to build or join something bigger than themselves, not just make a purchase.",
        whoTheyWantToBecome: "Someone with a genuine sense of belonging and shared purpose.",
        dreams: "To feel like their presence in a community actually matters, not just their spending.",
        frustrations: "Brands that talk about community but treat customers like an audience, not participants.",
        buyingTriggers: "Visible proof of real community, generosity, and shared purpose in action.",
        emotionalNeeds: "To feel welcomed, not marketed to.",
        transformation: "From on the outside looking in to genuinely part of something.",
        whatTheyNeedToHear: "“There's a place for you here, and we mean that literally.”",
      },
      customerExperience: {
        trustSignals: "Visible generosity, consistent follow-through on community commitments, and genuine responsiveness.",
        whyTheyStay: "Because they've never felt like just a transaction here.",
        whyTheyRefer: "Because bringing someone else in means growing the community they already love.",
        whatTheyllRemember: "The specific moment they felt like they belonged, not just purchased.",
        customerJourney: "They arrive looking for connection, stay because the community delivers on it, and become advocates because growing the group benefits everyone in it, including them.",
      },
      brandInAction: {
        dress: "Approachable and warm — clothing that says \"come talk to me,\" not \"stay away.\"",
        speak: "Inclusively, using \"we\" more often than \"I.\"",
        lead: "By building consensus and making sure every voice actually gets heard.",
        solveProblems: "By asking the community what they need before deciding for them.",
        celebrate: "Together, making sure the whole community feels like it shared in the win.",
        handleCriticism: "By treating it as valuable input from someone who cares enough to speak up.",
        website: "Warm, people-forward, with an obvious way to get involved, not just buy.",
        email: "Personal and community-focused, often featuring real members.",
        ads: "Testimonial and community-driven, letting real voices do the talking.",
        social: "Highly engaged — replies, shoutouts, and genuine two-way conversation.",
        support: "Personal and generous, treating every customer like a member, not a ticket number.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you're building something with and for a real group of people, not in isolation.",
        watchOutFor: "Watch out for prioritizing the community's requests over your own business's actual sustainability.",
        slowDownWhen: "Slow down when you're about to say yes to something the community wants that doesn't actually serve the business.",
        trustYourselfWhen: "Trust yourself when your gut says a decision will make people feel excluded, even if it's more efficient.",
        whereYoullNeedHelp: "You'll need help with hard, unpopular business decisions that put sustainability ahead of consensus.",
        whatToDelegate: "Delegate financial and operational decision-making to someone who can prioritize the business's health even when it's not the most popular call.",
        growthHabits: "Build a habit of reviewing whether community requests are actually aligned with your business goals each quarter.",
      },
      constitution: [
        "The community's wellbeing comes before any single sale.",
        "Ask before assuming what people need.",
        "Give credit generously and often.",
        "Make room at the table for people who aren't already sitting there.",
        "Never treat a customer like a number — they're a member.",
        "Protect the health of the business so you can keep serving the community.",
        "Say yes to generosity when you can actually afford it.",
        "Choose collaboration over competition inside your own walls.",
        "Celebrate the community's wins as if they were your own.",
        "When in doubt, choose the option that makes more people feel like they belong.",
      ],
    },
    "The Luxe Rebel": {
      styleNotes: {
        graphicStyle: "Sharp, high-contrast shapes with unexpected color combinations.",
        texture: "Glossy, metallic, or unexpected material finishes — nothing predictable.",
        icons: "Bold, angular icons that stand out rather than blend in.",
        illustration: "Edgy, statement-making illustration — safe is the one thing to avoid.",
        motion: "Sharp, dramatic motion — transitions that feel like a statement, not a default.",
        layout: "Layouts that break convention on purpose — asymmetry as a feature.",
        whitespace: "Use whitespace to isolate a bold statement, not to soften it.",
        packaging: "If you have physical packaging, make it look like nothing else on the shelf.",
        websiteFeel: "A website that feels like a strong opinion — impossible to mistake for anyone else's.",
      },
      traits: {
        superpower: "You can make a bold, unconventional choice look inevitable in hindsight, even when everyone doubted it at first.",
        leadershipStyle: "You lead by refusing to blend in, giving your team permission to do the same.",
        innovationStyle: "You innovate by deliberately breaking whatever rule everyone else treats as fixed.",
        decisionStyle: "You decide by asking whether the safe option is actually just the boring one in disguise.",
        workingStyle: "You work best without a rulebook — heavy process and legacy conventions slow you down more than they help.",
        stressStyle: "Under stress, you can push boldness past the point it's actually serving the brand, just to avoid looking predictable.",
      },
      idealCustomer: {
        whoTheyAre: "Someone who refuses to blend in and is tired of options that all look the same.",
        whoTheyWantToBecome: "Someone whose choices are instantly recognizable as theirs, and no one else's.",
        dreams: "To own something that makes a statement no one can mistake for anyone else's.",
        frustrations: "Safe, conventional options that play it too safe to actually stand out.",
        buyingTriggers: "Something unapologetically bold, distinctive, and slightly against the grain.",
        emotionalNeeds: "To feel like their individuality is being celebrated, not smoothed over.",
        transformation: "From blending in by default to standing out on purpose.",
        whatTheyNeedToHear: "“This isn't for everyone — and that's exactly the point.”",
      },
      customerExperience: {
        trustSignals: "Unapologetic consistency in point of view, even when it's not the safe or popular choice.",
        whyTheyStay: "Because you've never once softened your edge to please everyone.",
        whyTheyRefer: "Because recommending you signals their own boldness, not just yours.",
        whatTheyllRemember: "The moment you did the thing everyone else was too afraid to do.",
        customerJourney: "They arrive looking for something different, stay because you never compromise that difference, and become advocates because being associated with boldness feels good.",
      },
      brandInAction: {
        dress: "Statement pieces — bold, a little dangerous, impossible to ignore.",
        speak: "Directly and provocatively, unafraid to say the thing others won't.",
        lead: "By modeling fearlessness and expecting the team to bring their edge, not just their effort.",
        solveProblems: "By breaking the expected approach entirely rather than tweaking it.",
        celebrate: "Boldly and visibly — a win is a chance to be even louder.",
        handleCriticism: "By filtering it through whether it actually threatens the brand or just the status quo.",
        website: "Striking, high-contrast, unmistakably distinct from anything nearby.",
        email: "Bold subject lines and a strong point of view — no apologizing for it.",
        ads: "Provocative and visually loud, built to be impossible to scroll past.",
        social: "Opinionated and unfiltered — a strong point of view, consistently.",
        support: "Confident and direct, matching the same energy as the brand itself.",
      },
      decisionGuide: {
        atYourBest: "You're at your best when you're given full creative control and permission to ignore convention.",
        watchOutFor: "Watch out for being bold for its own sake, past the point it's actually serving the brand.",
        slowDownWhen: "Slow down when you're about to break a rule just to prove you can, not because it actually helps.",
        trustYourselfWhen: "Trust yourself when the safe option is genuinely just the boring one in disguise.",
        whereYoullNeedHelp: "You'll need help with anything that requires broad consensus-building or working within established systems.",
        whatToDelegate: "Delegate compliance, process, and legacy-system work to someone who doesn't find it stifling.",
        growthHabits: "Build a habit of asking whether a bold choice is serving the brand's actual goals, not just its reputation for being bold.",
      },
      constitution: [
        "Never round the edges off just to be more palatable.",
        "If it's safe, it's probably not bold enough yet.",
        "Say the thing everyone else is too careful to say.",
        "Protect the point of view, even when it costs you some customers.",
        "Choose distinctive over agreeable.",
        "Break the convention on purpose, not by accident.",
        "Never apologize for being polarizing when it's genuinely who you are.",
        "Make sure boldness is always serving the brand, not just the ego.",
        "Reward the team for taking real creative risks.",
        "When in doubt, choose the option no one else would have the nerve to choose.",
      ],
    },
    "The Trail Forger": {
      styleNotes: {
        graphicStyle: "Rugged, weathered shapes with visible texture — nothing that looks factory-perfect.",
        texture: "Raw materials — leather, canvas, worn metal — texture that shows real use.",
        icons: "Simple, sturdy icons with thick strokes — built to be legible from a distance.",
        illustration: "Topographic or field-sketch-style illustration over polished vector art.",
        motion: "Minimal, grounded motion — nothing flashy, everything purposeful.",
        layout: "Layouts with clear structure but a rugged, unpolished edge — nothing overly refined.",
        whitespace: "Use whitespace practically, the way you'd pack a bag — nothing wasted, nothing missing.",
        packaging: "If you have physical packaging, prioritize durability and function over decoration.",
        websiteFeel: "A website that feels like a well-worn field guide — reliable, direct, built for real use.",
      },
      traits: {
        superpower: "You can keep moving steadily through conditions that would stop most people from starting at all.",
        leadershipStyle: "You lead by being the most reliable person in the room, not the loudest.",
        innovationStyle: "You innovate through real-world testing — you trust what's been proven in the field over what sounds good in theory.",
        decisionStyle: "You decide based on what will actually hold up under real use, not what looks best on paper.",
        workingStyle: "You work best with clear, tangible goals and the independence to get there your own way.",
        stressStyle: "Under stress, you can go quiet and push through alone instead of asking for the help you'd give anyone else.",
      },
      idealCustomer: {
        whoTheyAre: "Someone who values what actually works in real conditions over what just looks good.",
        whoTheyWantToBecome: "Someone equipped and confident enough to handle whatever comes up.",
        dreams: "To rely on gear and partners that won't let them down when it actually matters.",
        frustrations: "Products that perform well in a showroom but fail in real use.",
        buyingTriggers: "Visible durability, honest specs, and proof it's been tested in real conditions.",
        emotionalNeeds: "To feel genuinely prepared, not just sold a promise.",
        transformation: "From uncertain and under-equipped to confident and self-reliant.",
        whatTheyNeedToHear: "“This was built for real conditions, not just the photo shoot.”",
      },
      customerExperience: {
        trustSignals: "Durability proven over time, honest specs, and a track record in real conditions, not just marketing claims.",
        whyTheyStay: "Because everything you've told them would hold up actually has.",
        whyTheyRefer: "Because recommending gear that works is a genuine favor to someone heading into real conditions.",
        whatTheyllRemember: "The moment your product performed exactly as promised when it actually mattered.",
        customerJourney: "They arrive needing something reliable, stay because it performs under real pressure, and become advocates because word-of-mouth about durability is the only kind that matters in this space.",
      },
      brandInAction: {
        dress: "Practical, durable gear — built for use, not for looking good standing still.",
        speak: "Plainly and honestly, without unnecessary flourish.",
        lead: "By being the most dependable person on the team, day in and day out.",
        solveProblems: "By testing it in real conditions before trusting it on paper.",
        celebrate: "Simply, often by getting straight back to the next challenge.",
        handleCriticism: "By checking it against real-world results before deciding if it holds up.",
        website: "Straightforward, spec-forward, with real proof of durability and use.",
        email: "Direct and useful, respecting the reader's time and intelligence.",
        ads: "Real conditions, real proof — no staged perfection.",
        social: "Field footage and real use over polished studio content.",
        support: "Straightforward and reliable, giving a real answer instead of a script.",
      },
      decisionGuide: {
        atYourBest: "You're at your best with a clear, tangible goal and the independence to get there your own way.",
        watchOutFor: "Watch out for pushing through alone when asking for help would genuinely be faster.",
        slowDownWhen: "Slow down when you're about to handle something solo that would actually benefit from a second set of hands.",
        trustYourselfWhen: "Trust yourself when your gut, tested by real experience, disagrees with what looks good on paper.",
        whereYoullNeedHelp: "You'll need help with fast-paced, high-visibility promotion — that's not where your instincts naturally live.",
        whatToDelegate: "Delegate marketing and visibility-building to someone energized by attention, not drained by it.",
        growthHabits: "Build a habit of checking in with your team or partners weekly, even when everything feels under control.",
      },
      constitution: [
        "Never claim durability you haven't actually tested.",
        "Choose what works in the field over what looks good on paper.",
        "Be the most reliable option in the room, every time.",
        "Say it plainly — there's no need to dress up the truth.",
        "Protect the trust that comes from things actually holding up.",
        "Ask for help before pushing through alone when it matters.",
        "Respect real-world conditions more than ideal ones.",
        "Never sacrifice function for a better photo.",
        "Build things meant to be used hard, not just displayed.",
        "When in doubt, choose the option that would hold up under real pressure.",
      ],
    },
  };

  BrandHaus.playbookContent = {
    FONT_PLAYBOOK: FONT_PLAYBOOK,
    EXPRESSION_PLAYBOOK: EXPRESSION_PLAYBOOK,
    EMOTIONAL_EXPERIENCE_BY_SELF_IMAGE: EMOTIONAL_EXPERIENCE_BY_SELF_IMAGE,
    HUE_FAMILY_CONTENT: HUE_FAMILY_CONTENT,
    ROLE_BEST_USES: ROLE_BEST_USES,
    FOUNDATION_PLAYBOOK: FOUNDATION_PLAYBOOK,
    CREATIVE_DIRECTION_PLAYBOOK: CREATIVE_DIRECTION_PLAYBOOK,
    BRAND_EVOLUTION_PLAYBOOK: BRAND_EVOLUTION_PLAYBOOK,
    PROFILE_PLAYBOOK: PROFILE_PLAYBOOK,
    classifyHue: classifyHue,
  };
})();
