/**
 * The AI Creator's Prompt Haus — Character Mode
 * Depends on prompt-builder-styledna.js and prompt-builder-engine.js.
 *
 * Base Type toggle (Human / Animal-Mascot) swaps which Identity field set
 * is active; Appearance/Styling/Presentation/Extras are shared regardless
 * of base type. Companion is a separate opt-in sub-panel.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;

  // ---------------------------------------------------------------------
  // Option lists — build plan Section 3 as the base, alphabetized for
  // browsability, plus a handful of new options per field (marked below)
  // so this isn't a 1:1 clone of the reference tool's catalog. Age Group
  // and Height stay in their natural progression rather than alphabetical
  // — those are ordinal scales, not categories, and A-Z would scramble
  // "baby -> mature" into something unreadable.
  // ---------------------------------------------------------------------
  // Character Type — full content rebuild from the owner's workbook:
  // each option now carries a full descriptive paragraph (see
  // CHARACTER_TYPE_PROMPTS below), not just a short label. The dropdown
  // still shows the short label; getActiveFieldEntries()/assemblePrompt()
  // swaps in the paragraph via PromptHaus.engine.withPromptLookup. Full
  // replacement of the prior list (dropped several placeholder/bratz-style
  // entries that weren't part of the owner's rebuilt catalog) — 59 items
  // across 8 buckets, exactly as the workbook grouped them. Two items with
  // no bucket/paragraph in the source (Modern 3D Animated Film Style,
  // Modern Flat Icon Style) and one duplicate paragraph (Vaporwave
  // Aesthetic, which had Retro Vintage Cartoon's text) got new paragraphs
  // authored to match the surrounding entries' voice — flagged for review.
  var CHARACTER_TYPE_GROUPS = [
    {
      label: "Cartoon & Animation",
      options: [
        "anime 90s cel-shaded",
        "anime style illustration",
        "cartoon style illustration",
        "cgi caricature",
        "comic book style",
        "expressive cinematic 3d animation style",
        "hand-drawn cartoon",
        "hyper-real cartoon",
        "modern 3d animated film style",
        "whimsical storybook princess illustration",
      ],
    },
    {
      label: "Character & Stylized",
      options: [
        "balloon animal character",
        "ceramic figurine illustration",
        "glam fashion-doll chibi",
        "glossy 3d chibi",
        "interlocking brick character",
        "luxury glam chibi",
        "origami animal character",
        "semi-realistic y2k fashion-doll illustration",
        "signature exaggerated chibi",
      ],
    },
    {
      label: "Illustrative Art Styles",
      options: [
        "clay relief illustration",
        "editorial mixed-media collage",
        "layered paper-cut illustration",
        "linocut / block-print illustration",
        "naïve folk art illustration",
        "pop surrealism",
        "soft felt stop-motion style",
        "stained glass mosaic",
        "storybook gouache illustration",
        "surreal editorial illustration",
        "tactile handmade illustration",
        "woodblock print illustration",
      ],
    },
    {
      label: "Minimal & Graphic",
      options: [
        "doodle art",
        "flat vector illustration",
        "geometric minimalist",
        "line art / continuous line drawing",
        "modern flat icon style",
        "silhouette design",
        "stick figure doodle",
        "stick figure minimalist",
      ],
    },
    {
      label: "Realism & Portraiture",
      options: [
        "cinematic photoreal",
        "documentary-style realism",
        "fine art oil portrait",
        "photorealistic portrait",
        "realistic human illustration",
        "studio headshot realism",
      ],
    },
    {
      label: "Retro, Alternative & Digital",
      options: [
        "90s cartoon nostalgia",
        "cyberpunk neon illustration",
        "dither art",
        "grunge/punk zine art",
        "low-poly 3d",
        "retro comic pop art",
        "retro pixel art / 8-bit",
        "retro vintage cartoon",
        "vaporwave aesthetic",
        "y2k graphic style",
      ],
    },
    {
      label: "Character & Collectible",
      options: [
        "collectible figurine illustration",
      ],
    },
    {
      label: "Publishing & Editorial",
      options: [
        "coloring book illustration",
        "editorial lifestyle illustration",
        "vintage children's illustration",
      ],
    },
  ];
  var CHARACTER_TYPE_PROMPTS = {
    "anime 90s cel-shaded": "authentic 1990s cel-shaded anime with confident ink outlines, simplified shadow shapes, expressive facial design, dramatic proportions, and the nostalgic hand-painted energy of classic television animation. Preserve the subject’s defining features and personality within the stylized anime treatment.",
    "anime style illustration": "polished anime illustration with expressive features, clean linework, stylized proportions, dynamic visual energy, and refined character-focused rendering. Preserve the subject’s identity and personality while adapting it into a cohesive contemporary anime aesthetic.",
    "cartoon style illustration": "clean, expressive cartoon illustration with simplified forms, bold readable shapes, playful proportions, smooth linework, and appealing character personality. Preserve the subject’s most recognizable traits while translating them into a polished, timeless cartoon style.",
    "cgi caricature": "stylized CGI caricature with exaggerated yet recognizable features, playful proportions, expressive personality, and polished three-dimensional character design. Maintain the subject’s identity while emphasizing their most distinctive characteristics through confident visual exaggeration.",
    "comic book style": "dynamic comic-book illustration with bold ink contours, dramatic anatomy, expressive poses, graphic shadow shapes, and energetic sequential-art character. Preserve the subject’s recognizable features while giving the portrait a powerful illustrated comic presence.",
    "expressive cinematic 3d animation style": "expressive cinematic 3D animation with appealing stylized proportions, emotionally readable features, polished character modeling, and story-driven visual charm. Preserve the subject’s identity and personality while adapting them into a premium family-friendly animated character.",
    "hand-drawn cartoon": "hand-drawn cartoon illustration with organic line variation, lively imperfect contours, expressive shapes, and warm artist-made character. Preserve the subject’s defining traits while allowing the drawing to feel spontaneous, personable, and genuinely illustrated by hand.",
    "hyper-real cartoon": "hyper-real cartoon illustration combining exaggerated animated proportions with convincing anatomy, refined facial detail, and highly polished dimensional rendering. Keep the subject clearly recognizable while balancing playful stylization with realistic visual depth.",
    "modern 3d animated film style": "modern 3D animated film style with polished character modeling, appealing stylized proportions, soft cinematic lighting, and premium feature-film production quality. Preserve the subject's identity and personality while adapting them into a contemporary big-screen animated character.",
    "whimsical storybook princess illustration": "whimsical storybook princess illustration with graceful stylized features, elegant fairytale character design, soft expressive charm, and richly imagined narrative personality. Preserve the subject’s defining identity while adapting them into an original enchanted storybook heroine.",
    "balloon animal character": "balloon animal character formed from smooth inflated segments, rounded sculptural proportions, playful twists, and charming toy-like personality. Preserve the subject’s essential features while adapting it into a recognizable balloon-sculpture figure.",
    "ceramic figurine illustration": "ceramic figurine illustration with sculpted proportions, refined decorative character, smooth molded forms, and premium collectible presence. Preserve the subject’s identity while adapting it into an elegant display figurine.",
    "glam fashion-doll chibi": "glam fashion-doll chibi with an oversized head, petite stylized body, expressive features, polished beauty styling, and confident fashion-forward attitude. Preserve the subject’s defining identity while translating it into a playful luxury doll-inspired character.",
    "glossy 3d chibi": "glossy 3D chibi with exaggerated cute proportions, a large expressive head, compact body, smooth sculpted forms, and polished dimensional character rendering. Preserve the subject’s recognizable features and personality within the highly stylized chibi treatment.",
    "interlocking brick character": "interlocking brick character with block-built anatomy, modular toy-like construction, simplified geometric features, and playful collectible appeal. Preserve the subject’s defining identity while adapting it into an original snap-together brick figure.",
    "luxury glam chibi": "luxury glam chibi with refined exaggerated proportions, elegant facial styling, polished character design, and an upscale fashion-forward presence. Maintain the subject’s identity while adapting it into a sophisticated, high-end chibi aesthetic.",
    "origami animal character": "origami animal character constructed from crisp folded planes, angular geometry, precise creases, and elegant paper-sculpture proportions. Preserve the subject’s defining features while adapting it into a clear, recognizable folded-paper figure.",
    "semi-realistic y2k fashion-doll illustration": "semi-realistic Y2K fashion-doll illustration with elongated stylized proportions, expressive eyes, sleek beauty detailing, and bold early-2000s glamour. Preserve the subject’s defining features while giving the character a polished retro fashion-doll presence.",
    "signature exaggerated chibi": "signature exaggerated chibi with an oversized expressive head, extremely compact body, playful facial proportions, and strong character-driven personality. Preserve the subject’s most recognizable traits while pushing the proportions into a bold, unmistakably cute chibi style.",
    "clay relief illustration": "clay relief illustration with raised sculpted forms, shallow dimensional carving, handcrafted contours, and tactile bas-relief character. Preserve the subject’s recognizable traits while translating the portrait into a decorative molded-clay composition.",
    "editorial mixed-media collage": "editorial mixed-media collage combining illustrated portrait elements, layered paper shapes, photographic fragments, expressive marks, and deliberate visual contrast. Preserve the subject’s identity while translating the portrait into a bold, contemporary magazine-inspired composition.",
    "layered paper-cut illustration": "layered paper-cut illustration built from clean overlapping shapes, crisp cut edges, dimensional depth, and carefully arranged handcrafted forms. Preserve the subject’s defining features while adapting the portrait into a polished sculptural paper-art style.",
    "linocut / block-print illustration": "linocut and block-print illustration with bold carved marks, strong contrast, simplified shapes, rough ink edges, and handcrafted printmaking character. Preserve the subject’s recognizable traits while translating them into a striking traditional relief-print style.",
    "naïve folk art illustration": "naïve folk art illustration with simplified proportions, flattened perspective, decorative shapes, imperfect hand-drawn charm, and warm expressive personality. Preserve the subject’s defining identity while embracing an intentionally unpolished, heartfelt folk-art aesthetic.",
    "pop surrealism": "pop surrealist illustration with dreamlike proportions, polished character detail, unexpected visual symbolism, and a playful blend of beauty, strangeness, and imagination. Preserve the subject’s recognizable identity while transforming the portrait into an eccentric surreal character.",
    "soft felt stop-motion style": "soft felt stop-motion style with simplified handcrafted forms, visible fiber texture, stitched character details, and charming miniature-animation personality. Preserve the subject’s defining traits while adapting them into a warm, tactile felt character.",
    "stained glass mosaic": "stained-glass mosaic illustration with segmented shapes, bold leading lines, jewel-like panels, and decorative handcrafted structure. Preserve the subject’s recognizable features while translating the portrait into an ornate glass-art composition.",
    "storybook gouache illustration": "storybook gouache illustration with painterly shapes, soft opaque brushwork, gentle texture, warm character expression, and timeless narrative charm. Preserve the subject’s identity while translating the portrait into a richly illustrated children’s-book aesthetic.",
    "surreal editorial illustration": "surreal editorial illustration with unexpected scale, symbolic imagery, imaginative visual combinations, and a polished contemporary magazine aesthetic. Preserve the subject’s defining features while adapting the portrait into a sophisticated, concept-driven composition.",
    "tactile handmade illustration": "tactile handmade illustration with visible crafted details, dimensional material character, soft irregularities, and an unmistakably artisan-made appearance. Preserve the subject’s identity while adapting the portrait into a warm, handcrafted visual style.",
    "woodblock print illustration": "woodblock print illustration with carved linework, simplified shapes, bold contrast, textured ink impressions, and traditional handcrafted print character. Preserve the subject’s defining identity while translating the portrait into a striking relief-print style.",
    "doodle art": "playful doodle art with loose hand-drawn lines, spontaneous shapes, simple expressive details, and charming visual imperfections. Preserve the subject’s defining features while translating the portrait into a lively, casual sketchbook-style illustration.",
    "flat vector illustration": "clean flat vector illustration with simplified shapes, crisp edges, bold readable forms, and minimal dimensional detail. Preserve the subject’s recognizable identity while adapting the portrait into a polished, modern vector style.",
    "geometric minimalist": "geometric minimalist illustration built from simplified angular forms, restrained detail, balanced negative space, and precise visual structure. Preserve the subject’s essential features while reducing the portrait to a clean, contemporary geometric design.",
    "line art / continuous line drawing": "elegant continuous-line illustration with fluid uninterrupted contours, minimal detail, and expressive economy of form. Preserve the subject’s most recognizable features while translating the portrait into a refined single-line drawing.",
    "modern flat icon style": "modern flat icon illustration with simplified geometric shapes, bold solid color fills, minimal linework, and clean contemporary app-icon styling. Preserve the subject's most recognizable features while reducing the portrait to a crisp, scalable flat-icon design.",
    "silhouette design": "bold silhouette design with a strong recognizable profile, simplified contour shapes, clean negative space, and striking visual clarity. Preserve the subject’s identity through distinctive outline, posture, and defining features.",
    "stick figure doodle": "loose stick-figure doodle with playful gestures, simple expressive features, casual hand-drawn lines, and humorous personality. Preserve the subject’s defining traits through posture, accessories, and recognizable visual cues.",
    "stick figure minimalist": "minimalist stick-figure illustration with clean economical lines, balanced proportions, restrained detail, and clear visual communication. Preserve the subject’s identity using only essential gestures, features, and defining characteristics.",
    "cinematic photoreal": "cinematic photorealism with lifelike anatomy, believable skin and material detail, dramatic visual depth, and polished movie-still realism. Preserve the subject’s exact identity, proportions, and personality while giving the portrait a premium cinematic presence.",
    "documentary-style realism": "documentary-style realism with natural features, honest visual detail, authentic human expression, and an observational photographic quality. Preserve the subject’s true identity and personality without idealizing or over-stylizing their appearance.",
    "fine art oil portrait": "fine art oil portraiture with classical composition, painterly modeling, rich tonal depth, expressive brushwork, and refined gallery-quality character. Preserve the subject’s likeness and personality while adapting the portrait into an elegant traditional painting.",
    "photorealistic portrait": "photorealistic portraiture with accurate anatomy, lifelike facial detail, natural proportions, and convincing visual realism. Preserve the subject’s identity precisely while presenting them with polished professional portrait quality.",
    "realistic human illustration": "realistic human illustration with believable anatomy, natural facial structure, refined detail, and a polished hand-rendered appearance. Preserve the subject’s defining features and personality while maintaining an illustrated rather than purely photographic finish.",
    "studio headshot realism": "studio headshot realism with accurate facial structure, clean professional presentation, refined portrait detail, and a polished commercial photography aesthetic. Preserve the subject’s true likeness and personality with clear, natural realism.",
    "90s cartoon nostalgia": "nostalgic 1990s cartoon illustration with bold outlines, exaggerated expressions, playful proportions, graphic shapes, and energetic hand-drawn character. Preserve the subject’s defining features while adapting the portrait into a lively retro television-cartoon aesthetic.",
    "cyberpunk neon illustration": "cyberpunk neon illustration with futuristic character styling, sharp graphic detail, luminous technological accents, and a sleek dystopian atmosphere. Preserve the subject’s identity while translating the portrait into a bold, high-tech science-fiction aesthetic.",
    "dither art": "dither art with deliberately limited tonal transitions, patterned pixel shading, crisp digital texture, and retro computer-graphics character. Preserve the subject’s recognizable features while adapting the portrait into a detailed, intentionally pixelated illustration.",
    "grunge/punk zine art": "grunge punk-zine illustration with rough photocopied textures, distressed linework, torn-paper energy, rebellious marks, and raw underground character. Preserve the subject’s identity while translating the portrait into an unapologetically handmade alternative aesthetic.",
    "low-poly 3d": "low-poly 3D illustration built from simplified faceted geometry, angular planes, clean dimensional structure, and stylized polygonal character design. Preserve the subject’s defining features while reducing the portrait into a cohesive sculpted geometric form.",
    "retro comic pop art": "retro comic pop-art illustration with bold ink contours, halftone shading, dramatic expressions, graphic color blocking, and energetic mid-century print character. Preserve the subject’s recognizable identity while adapting the portrait into a striking vintage comic aesthetic.",
    "retro pixel art / 8-bit": "retro 8-bit pixel-art illustration with block-based forms, crisp stepped edges, limited-detail character design, and authentic classic-game visual language. Preserve the subject’s essential features while translating the portrait into a clear, recognizable pixel character.",
    "retro vintage cartoon": "retro vintage cartoon illustration with rubber-hose-inspired movement, simplified rounded forms, expressive poses, and charming old-animation character. Preserve the subject’s defining identity while adapting the portrait into a playful, timeworn cartoon aesthetic.",
    "vaporwave aesthetic": "nostalgic vaporwave aesthetic illustration with dreamy pastel gradients, retro-futuristic grid lines, soft glitch accents, and surreal 80s/90s digital nostalgia. Preserve the subject's defining features while adapting the portrait into a hazy, neon-tinted retro-digital dreamscape.",
    "y2k graphic style": "Y2K graphic illustration with sleek early-2000s styling, playful futuristic proportions, bold digital character, and polished pop-tech energy. Preserve the subject’s defining traits while adapting the portrait into a nostalgic yet forward-looking millennium aesthetic.",
    "collectible figurine illustration": "premium collectible figurine illustration with toy-inspired proportions, sculpted character forms, expressive features, and the presence of a professionally designed display collectible. Preserve the subject’s identity while adapting it into a distinctive, highly desirable character figure.",
    "coloring book illustration": "coloring book illustration with bold clean outlines, simplified shapes, open coloring areas, smooth linework, and balanced printable composition. Preserve the subject’s defining features while adapting it into a clear black-and-white design with no shading, gradients, or filled color.",
    "editorial lifestyle illustration": "editorial lifestyle illustration with polished contemporary character, natural everyday storytelling, expressive posture, and refined magazine-ready composition. Preserve the subject’s identity while presenting them in a stylish, relatable, and commercially polished visual narrative.",
    "vintage children's illustration": "vintage children’s illustration with gentle hand-drawn character, softened proportions, delicate linework, nostalgic storybook charm, and a timeless printed-book aesthetic. Preserve the subject’s defining features while adapting them into a warm, classic children’s publishing style.",
  };
  // Art Finish — full content rebuild from the owner's workbook, same
  // paragraph-lookup pattern as Character Type above. The workbook's own
  // Prompt column was shifted relative to its Item column (verified against
  // the raw file); PROMPTS below use the corrected item<->paragraph pairing
  // reconstructed by matching each paragraph's actual content back to the
  // item it describes. Full replacement of the prior list (dropped several
  // "medium" entries like pencil/charcoal/pastel sketch finishes that
  // weren't part of the owner's rebuilt 19-item catalog).
  var ART_FINISH_GROUPS = [
    {
      label: "Textile & Crafted",
      options: [
        "braided polymer clay",
        "crochet amigurumi",
        "handcrafted claymation",
        "soft plush toy rendering",
      ],
    },
    {
      label: "Specialty Finishes",
      options: [
        "candy-coated finish",
        "carved marble sculpture",
        "liquid chrome rendering",
        "premium poster finish",
        "soft spiritual glow",
        "urban airbrush",
      ],
    },
    {
      label: "Digital Rendering",
      options: [
        "cell-shaded gloss",
        "glossy illustration",
        "high gloss digital finish",
        "polished 3d rendering",
        "soft airbrushed finish",
        "ultra polished digital painting",
      ],
    },
    {
      label: "Traditional Mediums",
      options: [
        "gouache paint",
        "paper craft",
        "watercolor wash",
      ],
    },
  ];
  var ART_FINISH_PROMPTS = {
    "braided polymer clay": "render the illustration as braided polymer clay using thick twisted clay strands, sculpted handcrafted detailing, tactile matte surfaces, and dimensional artisan craftsmanship throughout.",
    "crochet amigurumi": "render the illustration as handcrafted crochet amigurumi with soft stitched construction, visible yarn texture, rounded dimensional forms, and charming artisan craftsmanship throughout.",
    "handcrafted claymation": "render the illustration as handcrafted claymation with sculpted clay forms, soft organic shaping, subtle fingerprints, and charming stop-motion character.",
    "soft plush toy rendering": "render the illustration as a soft plush toy with velvety fabric, gently stuffed proportions, subtle stitched detailing, and an irresistibly cuddly handcrafted appearance.",
    "candy-coated finish": "render the illustration with a thick candy-coated finish featuring vibrant glossy surfaces, rich shine, smooth reflections, and playful confection-inspired polish.",
    "carved marble sculpture": "render the illustration as a hand-carved marble sculpture with refined stone detailing, smooth sculpted surfaces, and timeless gallery-quality craftsmanship.",
    "liquid chrome rendering": "render the illustration with flowing liquid chrome surfaces, mirror-like reflections, fluid metallic contours, and striking futuristic dimensionality.",
    "premium poster finish": "render the illustration with premium poster-quality finishing, crisp detail, vibrant color fidelity, smooth gradients, and clean professional print-ready presentation.",
    "soft spiritual glow": "render the illustration with a gentle ethereal glow, soft luminous highlights, delicate atmospheric light, and a peaceful radiant presence.",
    "urban airbrush": "render the illustration with authentic urban airbrush styling featuring smooth sprayed blends, vibrant color transitions, and custom street-art energy.",
    "cell-shaded gloss": "render the illustration using clean cel-shaded rendering with bold shadow shapes, crisp highlights, and polished animated character styling.",
    "glossy illustration": "render the illustration with smooth glossy surfaces, soft reflections, polished highlights, and vibrant dimensional richness throughout.",
    "high gloss digital finish": "render the illustration with luxurious high-gloss digital surfaces, crisp reflections, polished highlights, and vibrant dimensional depth.",
    "polished 3d rendering": "render the illustration with premium three-dimensional modeling, clean sculpted forms, polished digital realism, and refined production-quality rendering.",
    "soft airbrushed finish": "render the illustration with soft airbrushed blending, smooth tonal transitions, subtle gradients, and a polished painted appearance.",
    "ultra polished digital painting": "render the illustration as an ultra-polished digital painting with refined brushwork, rich depth, clean detailing, and premium contemporary illustration quality.",
    "gouache paint": "render the illustration in rich gouache with opaque painterly brushwork, soft layered texture, vibrant color application, and timeless illustrated charm.",
    "paper craft": "render the illustration as handcrafted paper craft with layered paper construction, crisp cut edges, dimensional assembly, and artisan paper texture throughout.",
    "watercolor wash": "render the illustration with soft watercolor washes, naturally blended pigments, delicate brush transitions, and a refined hand-painted artistic finish.",
  };

  // Reworked for accuracy — "latino" and "mexican" read as two answers to
  // the same question (nationality vs. broad ethnicity), so both fold into
  // one "latin american/hispanic descent" option; "mixed heritage" and
  // "mixed ethnicity" were the same duplicate pattern, folded into one
  // "mixed/multiracial." Afro-latina stays distinct — it names a specific
  // identity the broader Latin American option doesn't capture on its own.
  var ETHNICITY_OPTIONS = sortAlpha([
    "black/african descent", "east asian", "south asian", "southeast asian",
    "white/european descent", "middle eastern/north african", "native american/indigenous",
    "indigenous pacific islander", "latino/latina/hispanic descent", "afro-latina/afro-latino",
    "mixed/multiracial",
    // new
    "central asian", "mediterranean", "caribbean",
  ]);
  var SKIN_TONE_OPTIONS = sortAlpha([
    "caramel", "porcelain", "fair", "warm ivory", "olive", "golden beige",
    "honey brown", "deep brown", "rich espresso",
    // new
    "tan", "medium brown",
  ]);
  var HUMAN_AGE_GROUP_OPTIONS = ["infant", "baby", "toddler", "child", "teen", "young adult", "middle aged", "mature adult", "elderly"];
  var HUMAN_GENDER_OPTIONS = sortAlpha(["female", "male"]);
  var HEIGHT_OPTIONS = ["short", "average height", "tall", "super tall"];
  var HUMAN_BODY_TYPE_OPTIONS = sortAlpha([
    "petite", "slim", "toned", "athletic", "muscular", "curvy", "plus-size",
    "round and soft", "lanky", "short and stocky", "tall and lean", "broad-shouldered",
  ]);
  // "military/veteran", "first responder/EMT", and "it/tech" replaced with
  // their split/formal versions below (owner's call) rather than kept
  // alongside the new entries as near-duplicates.
  var OCCUPATION_NICHE_OPTIONS = sortAlpha([
    "nurse", "teacher", "firefighter", "police officer", "doctor",
    "pastor/clergy", "small business owner", "chef", "artist/creative",
    "realtor", "veterinarian", "coach",
    // new
    "engineer", "graphic designer", "student",
    "flight attendant", "pilot", "executive", "dentist", "team mascot",
    "active-duty military", "veteran", "emt/paramedic", "first responder",
    "it/technology professional", "lawyer", "scientist", "hairstylist", "musician",
    "photographer", "construction worker",
  ]);

  // Grouped like Character Type/Holiday — browses better by category than
  // as one flat wall now that the list has grown this much. species/
  // surfaceTexture stay available as flattened lists too (see optionLists
  // below) for Couples/Graphics Mode's own simpler flat dropdowns.
  var SPECIES_GROUPS = [
    {
      label: "Mammals",
      options: sortAlpha([
        "bear", "beaver", "bull", "bunny", "cat", "cheetah", "cow", "deer", "dog", "dolphin",
        "elephant", "fox", "giraffe", "goat", "gorilla", "hamster", "hedgehog", "hippo", "horse",
        "husky", "jaguar", "koala", "lion", "llama", "monkey", "mouse", "otter", "panda", "panther",
        "pig", "polar bear", "ram", "raccoon", "red panda", "rhino", "sheep", "sloth", "squirrel",
        "tiger", "wolf", "zebra",
      ]),
    },
    {
      label: "Birds",
      options: sortAlpha(["eagle", "falcon", "hawk", "owl", "parrot", "penguin", "raven", "swan"]),
    },
    {
      label: "Aquatic",
      options: sortAlpha(["dolphin", "octopus", "sea turtle", "shark", "whale", "orca", "koi fish"]),
    },
    {
      label: "Fantasy",
      options: sortAlpha([
        "baby dragon", "dragon", "griffin", "kitsune", "pegasus", "phoenix", "cherub", "angel", "unicorn",
      ]),
    },
  ];
  var SURFACE_TEXTURE_GROUPS = [
    {
      label: "Fur & Wool",
      options: sortAlpha([
        "curly wool", "dense plush fur", "fine short fur", "fluffy cream fur", "long flowing fur",
        "rough shaggy fur", "shaggy fur", "sleek short fur", "soft charcoal wool", "spotted fur",
        "striped fur", "velvet-soft fur", "wet fur", "plush teddy texture",
      ]),
    },
    {
      label: "Feathers",
      options: sortAlpha([
        "silky feathers", "soft down feathers", "sleek flight feathers", "fluffy plumage",
        "iridescent feathers", "ruffled feathers",
      ]),
    },
    {
      label: "Scales & Reptilian Surfaces",
      options: sortAlpha([
        "glossy scales", "matte scales", "fine reptile scales", "armored scales",
        "pebbled reptile skin", "ridged dragon scales",
      ]),
    },
    {
      label: "Smooth & Marine Skin",
      options: sortAlpha([
        "smooth shark skin", "sleek dolphin skin", "rubbery marine skin", "smooth amphibian skin",
        "moist frog skin", "soft blubbery skin", "glossy fish skin", "fine fish scales",
        "metallic fish scales", "translucent jelly skin",
      ]),
    },
    {
      label: "Hide & Tough Skin",
      options: sortAlpha([
        "leathery hide", "thick elephant skin", "wrinkled hide", "tough rhinoceros skin",
        "smooth horse coat", "bristly pig skin", "soft suede-like hide",
      ]),
    },
    {
      label: "Fantasy & Stylized",
      options: sortAlpha([
        "crystal scales", "molten lava skin", "metallic armor skin", "stone-like skin",
        "bark-textured skin", "celestial glow skin", "plush toy surface", "braided clay surface",
      ]),
    },
  ];
  var ANIMAL_AGE_GROUP_OPTIONS = ["baby", "young", "adult", "elder"];
  var ANIMAL_GENDER_OPTIONS = sortAlpha(["female", "male", "gender-neutral"]);
  var ANIMAL_BODY_TYPE_OPTIONS = sortAlpha([
    "athletic", "chubby", "compact", "fluffy", "long & lean", "petite", "round & soft",
    "slim", "small fluffy rounded body", "stocky", "sturdy",
  ]);
  // Separate from Human Identity's own Height field (short/average/tall/
  // super tall doesn't fit a mascot scale from a mouse to a dragon) —
  // small-to-large order, not alphabetized, since this is an ordinal
  // scale, not a wall of independent words (same reasoning Aspect Ratio's
  // own declared order already uses).
  var ANIMAL_SIZE_OPTIONS = ["tiny", "small", "medium", "large", "giant"];
  function flattenGroups(groups) {
    var flat = [];
    groups.forEach(function (group) { flat = flat.concat(group.options); });
    return flat;
  }
  var SPECIES_OPTIONS = flattenGroups(SPECIES_GROUPS);
  var SURFACE_TEXTURE_OPTIONS = flattenGroups(SURFACE_TEXTURE_GROUPS);

  var HAIR_COLOR_GROUPS = [
    {
      label: "Natural",
      options: sortAlpha([
        "black", "dark brown", "light brown", "dark blonde", "blonde", "platinum blonde",
        "auburn", "red", "grey", "silver", "salt and pepper", "white",
      ]),
    },
    {
      label: "Fantasy",
      options: sortAlpha(["blue", "green", "teal", "mint green", "rose pink"]),
    },
    {
      label: "Multi-Tone",
      options: sortAlpha([
        "peach ombre", "pink ombre", "silver lavender", "pink/purple streaks",
        "blonde on top, dark red on the bottom",
      ]),
    },
  ];
  var HAIR_STYLE_GROUPS = [
    {
      label: "No Hair",
      options: sortAlpha(["bald", "ultra short", "buzz cut", "caesar haircut", "pixie cut", "mohawk"]),
    },
    {
      label: "Short Hair",
      options: sortAlpha([
        "blunt bob", "deep side-part flipped bob", "short rope twist bob locs", "short dramatic curls",
      ]),
    },
    {
      label: "Medium & Long Hair",
      options: sortAlpha(["mid-length straight", "long straight", "body wave", "curly", "tight curls", "voluminous curls"]),
    },
    {
      label: "Ponytails",
      options: sortAlpha(["braided ponytail", "side ponytail", "side ponytail with baby hairs"]),
    },
    {
      label: "Buns & Updos",
      options: sortAlpha([
        "messy bun", "messy bun with baby hairs", "half up half down", "sleek high bun with baby hairs",
        "braided updo", "space buns", "middle-part curly puff buns",
      ]),
    },
    {
      label: "Braids",
      options: sortAlpha(["dutch braid crown", "french braid pigtails", "fishtail braid", "viking braids"]),
    },
    {
      label: "Natural & Cultural Styles",
      options: sortAlpha([
        "cornrows", "straight-back feed-in stitch braids", "bantu knots", "senegalese twists",
        "360 waves", "90s finger waves", "big afro",
      ]),
    },
  ];
  var HAIR_COLOR_OPTIONS = flattenGroups(HAIR_COLOR_GROUPS);
  var HAIR_STYLE_OPTIONS = flattenGroups(HAIR_STYLE_GROUPS);
  var EYE_COLOR_OPTIONS = sortAlpha([
    "brown eyes", "blue eyes", "green eyes", "hazel eyes", "gray eyes", "amber eyes",
    // new
    "violet eyes", "heterochromia",
  ]);
  var EXPRESSION_OPTIONS = sortAlpha([
    "happy", "smiling", "laughing", "smirking", "playful", "curious", "confident",
    "determined", "thoughtful", "stoic", "serious", "angry", "sad", "crying", "surprised",
    "shocked", "mischievous",
  ]);
  var FACIAL_FEATURES_OPTIONS = sortAlpha([
    "beauty mark", "burn mark", "button nose", "cleft chin", "dimples", "facial scar",
    "freckles", "gap teeth", "glasses", "high cheekbones", "rosy cheeks", "sharp jawline",
    "ultra-defined brows", "vitiligo",
  ]);
  var EYE_SIZE_SHAPE_OPTIONS = sortAlpha([
    "large expressive", "huge exaggerated", "almond shaped", "soft rounded",
    "narrow fierce", "natural proportion",
    // new
    "round eyes", "monolid", "hooded eyes", "cat eyes",
  ]);
  var LASH_INTENSITY_OPTIONS = sortAlpha([
    "natural lashes", "long defined", "dramatic volume", "extra-long glam",
    "ultra-dramatic doll lashes",
    // renamed from "extra long fluffy lashes" (owner's call)
    "extra-long wispy",
  ]);
  var LIP_STYLE_OPTIONS = sortAlpha([
    "natural", "matte", "soft gloss", "high gloss", "full lips", "plump glossy",
    "defined cupid's bow", "ombre lip", "overlined glam", "bold lip color",
  ]);
  var EXTRA_GLAM_DETAILS_OPTIONS = sortAlpha([
    "face gems", "under-eye sparkle", "metallic eyeliner", "rhinestone accents", "body glitter",
  ]);

  var OUTFIT_OPTIONS = sortAlpha([
    "glam streetwear", "hoodie and sweatpants", "statement top with denim jeans",
    "sparkly mini dress", "tracksuit", "business attire", "oversized cozy sweater with leggings",
    "leather jacket with ripped jeans", "t-shirt with dark jeans", "crop top with cargo pants",
    "satin pajama set", "bomber jacket with joggers", "tuxedo", "baseball jersey",
    "basketball jersey", "puffer coat with jeans", "tank top with baggy jeans", "cute onesie",
    "colorful romper", "overalls with t-shirt", "tutu dress", "superhero costume",
    "princess dress", "denim jacket with shorts", "striped shirt with leggings",
    "dinosaur pajamas", "rainbow hoodie", "animal print dress", "dungarees",
    "sequined cocktail dress", "silk slip dress with blazer",
    "distressed boyfriend jeans with graphic tee", "linen button-up with chino shorts",
    "oversized denim jacket with sundress",
    // new — general differentiators
    "cargo shorts with graphic tee",
    // new — occupation/uniform garments, so Nurse/Teacher/Firefighter/Military presets and
    // the Occupation/Niche field have an actual matching outfit instead of relying on generic
    // streetwear terms to imply a uniform
    "military dress uniform", "military fatigues (cammies)", "nurse scrubs", "police uniform",
    "firefighter turnout gear", "doctor's white coat", "EMT/paramedic uniform", "clergy robe with collar",
    // new — religious/cultural garments, a genuine representation gap the outfit list didn't cover at all
    "hijab with modest fashion outfit", "sari", "kimono", "dashiki-inspired outfit", "cheongsam/qipao",
    // new
    "wedding dress", "bridal pantsuit", "formal evening gown", "tailored pantsuit",
    "casual sundress", "cozy knit set", "western outfit", "athletic workout set", "lab coat",
    "chef uniform", "graduation cap and gown", "school uniform",
  ]);
  // Generic sneaker/boot terms instead of specific brand names, to steer
  // clear of trademark/copyright issues. "sandals" removed (owner's call) —
  // "open toe sandals" stays, it's a distinct option.
  var SHOES_OPTIONS = sortAlpha([
    "fuzzy slippers", "stiletto heels", "rain boots",
    "lace up sneakers", "high top sneakers",
    "dressy shoes", "open toe sandals", "blinged heels", "just socks",
    "barefoot", "light-up sneakers", "velcro strap shoes", "mary jane shoes",
    "cowboy boots", "platform sneakers",
    // new
    "flip flops", "work boots", "hiking boots", "winter boots",
    "ballet flats", "combat boots", "loafers", "running shoes", "ankle boots", "knee-high boots",
  ]);
  // Eye-makeup-style descriptors (smokey eye, winged eyeliner, cut crease, etc.) stay folded
  // into this one field alongside overall-look presets — there's no separate eye-makeup field.
  var MAKEUP_OPTIONS = sortAlpha([
    "natural", "glam bold lips", "smokey eye", "glitter eyeshadow", "winged eyeliner",
    "no makeup", "cut crease", "graphic liner", "glossy dewy skin", "matte full coverage",
    "soft pink blush", "contoured cheekbones", "dramatic cat eye", "nude lips with highlight",
    "bold colored eyeliner", "glitter lip gloss", "bronzed sun-kissed glow", "faux freckles",
    "tiny beauty mark near the mouth", "dramatic black eyeliner", "glowing highlighted cheeks",
    "sculpted nose highlight",
    // new
    "natural makeup", "soft glam", "full glam", "bridal makeup", "editorial makeup",
  ]);
  var NAILS_OPTIONS = sortAlpha([
    "short natural nails", "medium-length french tips", "long coffin nails", "almond nails",
    "stiletto nails", "square nails", "chrome glam nails", "rhinestone luxury nails",
    "classic french tips", "glossy nude nails", "bold colored nails",
  ]);
  var BEARD_OPTIONS = sortAlpha([
    "clean-shaven", "stubble", "goatee", "boxed beard", "full beard",
    "long groomed beard", "short trimmed beard", "mustache",
  ]);
  // Headwear/jewelry consolidated: hats moved to Headwear & Head Effects'
  // "Everyday headwear" group, earrings/necklaces moved to Jewelry — this
  // list is now bags/tech/carry items only.
  var ACCESSORIES_OPTIONS = sortAlpha([
    "backpack", "belt bag", "clutch purse", "crossbody bag", "designer handbag", "laptop",
    "smartwatch", "tote bag", "headphones", "clear glasses", "oversized sunglasses", "scarf",
    "camera", "book", "coffee cup", "umbrella", "briefcase", "phone", "art supplies", "sports bag",
  ]);
  // Renamed from "Special Needs" to "Mobility & Accessibility".
  var MOBILITY_ACCESSIBILITY_OPTIONS = sortAlpha([
    "none", "arm cast", "bifocals", "braces on teeth", "cane", "cochlear implant", "crutches",
    "hearing aid", "leg brace", "mobility walker", "oxygen tank", "prosthetic limb",
    "service dog", "wheelchair", "white cane for vision",
    // new
    "forearm crutches", "powered wheelchair", "mobility scooter",
  ]);
  var JEWELRY_OPTIONS = sortAlpha([
    "anklets", "body chains", "choker necklace", "chunky gold chains", "cross necklace",
    "delicate necklace", "diamond chain", "diamond studs", "gold hoop earrings",
    "layered bracelets", "multiple rings", "nose ring", "pendant necklace", "statement earrings",
    "thick cuban-link chain", "diamond grillz", "pearl necklace", "charm bracelet", "brooch",
    "wedding ring",
  ]);
  var TATTOOS_OPTIONS = sortAlpha([
    "arm tattoos", "arm sleeve tattoos", "back tattoos", "chest tattoos", "face tattoos",
    "floral tattoos", "geometric tattoos", "hand tattoos", "leg tattoos",
    "minimalist line tattoos", "neck tattoos", "tribal tattoos",
    // new
    "watercolor tattoos", "blackwork tattoos", "small symbol tattoo", "full-body tattoos",
  ]);
  // Renamed from "Crown / Head Effects" to "Headwear & Head Effects" and
  // rebuilt as grouped (was flat) — 6 categories, browses much better than
  // one long wall once it covers everyday hats through fantasy crowns.
  var HEADWEAR_HEAD_EFFECTS_GROUPS = [
    {
      label: "Everyday Headwear",
      options: sortAlpha([
        "baseball cap", "beanie", "bucket hat", "cowboy hat", "fitted cap", "sun hat",
        "fedora", "top hat", "beret", "visor",
      ]),
    },
    {
      label: "Cultural & Religious Headwear",
      options: sortAlpha([
        "hijab", "kippah/yarmulke", "kufi cap", "turban", "bandana headband",
        "floral headwrap", "traditional headwrap",
      ]),
    },
    {
      label: "Bridal & Formal",
      options: sortAlpha([
        "wedding veil", "bridal tiara", "jeweled headpiece", "diamond tiara", "pink tiara",
        "flower crown", "golden crown", "star crown",
      ]),
    },
    {
      label: "Hair Accessories",
      options: sortAlpha(["bow headband", "butterfly clips", "hair bow", "floral hair clips", "pearl headband"]),
    },
    {
      label: "Fantasy & Supernatural Effects",
      options: sortAlpha([
        "angel halo", "neon halo with drips", "flame crown", "crystal crown",
        "celestial halo", "glowing rune crown", "fairy crown", "horned headpiece",
      ]),
    },
    {
      label: "Technology & Audio",
      options: sortAlpha(["headphones", "wireless earbuds", "futuristic visor"]),
    },
  ];

  // Grouped (was flat) — items intentionally repeat across groups where
  // they have dual relevance (e.g. "dancing"/"pointing" fit both Gestures
  // and Worship/Emotion), matching the owner's own categorization.
  var POSE_GROUPS = [
    {
      label: "Standing",
      options: sortAlpha(["standing pose", "arms crossed", "hands on hips", "leaning against wall", "looking over shoulder", "waving"]),
    },
    {
      label: "Sitting / Grounded",
      options: sortAlpha(["sitting pose", "kneeling", "kneeling in prayer"]),
    },
    {
      label: "Movement",
      options: sortAlpha(["walking", "running", "jumping", "dancing", "action pose"]),
    },
    {
      label: "Gestures",
      options: sortAlpha(["blowing a kiss", "peace sign", "taking a selfie", "pointing", "holding hands together"]),
    },
    {
      label: "Worship / Emotion",
      options: sortAlpha(["lifting hands in praise", "praying", "dancing", "holding hands together", "pointing"]),
    },
  ];
  var POSE_OPTIONS = POSE_GROUPS.reduce(function (acc, group) { return acc.concat(group.options); }, []);
  // Grouped like Character Type/Holiday — browses better by category than
  // as one flat 50+ item wall. Shared across Character/Couples/Graphics/
  // Animals & Creatures (all reuse this same source of truth via
  // optionLists.backgroundGroups), so the categorization reaches every
  // mode that has a Background field. "City" replaces "Urban & Cityscape"
  // (renamed, same group, expanded); "space"/"underwater scene" moved out
  // of Nature & Outdoors into the new Adventure group.
  var BACKGROUND_GROUPS = [
    {
      label: "Decorative & Graphic",
      options: sortAlpha([
        "solid white background", "transparent background png", "soft pastel gradient",
        "dreamy cloud scene", "sparkly confetti effect", "heart-filled backdrop", "rainbow gradient",
        "marble texture", "floral garden scene", "starry night sky", "candy-colored polka dots",
        "soft glitter fade", "paint splatter",
      ]),
    },
    {
      label: "City",
      options: sortAlpha([
        "sunset skyline", "urban graffiti wall",
        // new
        "downtown city", "city street", "rooftop", "alleyway", "cafe", "shopping district",
      ]),
    },
    {
      label: "Nature & Outdoors",
      options: sortAlpha([
        "jungle", "desert", "beach", "river", "lake",
        // terrain/scene coverage for Animals & Creatures (shared list, so
        // these reach Character/Couples/Graphics too)
        "ocean", "forest", "mountains", "farm", "fields",
        "autumn foliage outdoor setting", "outdoor park setting", "golden hour beach setting",
      ]),
    },
    {
      label: "Seasonal",
      options: sortAlpha(["autumn forest", "snowy landscape", "spring garden", "summer meadow"]),
    },
    {
      label: "Fantasy",
      options: sortAlpha(["enchanted forest", "castle courtyard", "crystal cave", "floating islands", "ancient temple"]),
    },
    {
      label: "Sports & Venues",
      options: sortAlpha([
        "baseball stadium", "football stadium", "soccer stadium", "ice skating rink",
        "softball field", "volleyball court", "swimming pool arena", "water polo pool",
        "polo field", "golf course", "cricket stadium", "basketball arena", "tennis court",
        "bowling alley", "hockey rink",
      ]),
    },
    {
      label: "Photo Studio & Family",
      options: sortAlpha([
        "solid gray studio backdrop", "neutral linen studio backdrop",
        "seamless white studio backdrop", "cozy living room setting", "rustic barn setting",
        "botanical greenhouse setting", "holiday-themed studio backdrop",
        // new
        "modern kitchen", "luxury office", "library", "classroom", "cozy bedroom",
      ]),
    },
    {
      label: "Adventure",
      options: sortAlpha(["space", "underwater scene"]),
    },
  ];
  var BACKGROUND_OPTIONS = BACKGROUND_GROUPS.reduce(function (acc, group) {
    return acc.concat(group.options);
  }, []);
  var DYNAMIC_SCENE_EFFECT_OPTIONS = sortAlpha([
    "floating in clouds", "emerging from splash", "surrounded by sparkles",
    "hair blowing in wind", "money flying around", "neon glow aura", "soft angelic light",
    "energy burst explosion", "jumping out of a lake",
    // new
    "falling autumn leaves", "falling snow", "floating flower petals", "floating feathers",
    "butterflies", "fire embers", "smoke effects", "morning fog", "dust particles",
    "rain shower", "lightning storm", "magical mist",
  ]);
  var TIME_ERA_OPTIONS = sortAlpha([
    "1920s art deco", "1960s glam", "1970s groovy", "1980s neon", "1990s hip-hop",
    "y2k (early 2000s)", "modern day", "futuristic cyberpunk", "medieval fantasy",
    "ancient egyptian", "victorian", "victorian steampunk", "retro 1950s",
    // new
    "roaring 20s", "ancient greece", "renaissance", "wild west",
  ]);
  var CAMERA_ANGLE_OPTIONS = sortAlpha([
    "front view", "side profile", "three-quarter view", "low angle", "high angle",
    "bird's eye view", "worm's eye view", "over the shoulder", "close-up portrait",
    "full body shot", "dutch angle", "extreme close-up", "fisheye lens", "aerial drone shot",
    // new
    "eye-level",
  ]);
  var LIGHTING_EFFECTS_OPTIONS = sortAlpha([
    "studio lighting", "golden hour glow", "soft diffused light", "dramatic shadows",
    "rim lighting", "neon glow", "candlelight", "sunlight through window", "moonlight",
    "stage lighting", "holographic light", "bioluminescent glow", "underlit glow",
    "backlit silhouette", "cool blue tones", "warm amber tones", "lantern glow", "aurora borealis glow",
    // new
    "soft window portrait", "sunset glow", "sunrise light", "overcast day",
  ]);
  // Grouped (was flat) — "Add" items placed into the Paper/Decorative
  // groups by theme (owner's raw list only gave a flat "Add" sub-list,
  // this placement is a judgment call, flagged here).
  var FRAMING_GROUPS = [
    {
      label: "Classic",
      options: sortAlpha(["no frame", "simple frame border", "gold gilded frame", "rose gold frame", "vintage wooden frame"]),
    },
    {
      label: "Modern",
      options: sortAlpha(["modern minimalist frame", "abstract geometric frame"]),
    },
    {
      label: "Decorative",
      options: sortAlpha(["floral wreath frame", "ornate decorative frame", "diamond-encrusted frame", "floral vine border"]),
    },
    {
      label: "Fun",
      options: sortAlpha(["comic book panel frame", "polaroid style frame", "chalkboard frame"]),
    },
    {
      label: "Fantasy",
      options: sortAlpha(["holographic frame", "glowing neon frame"]),
    },
    {
      label: "Paper",
      options: sortAlpha(["torn paper edge", "shadow frame with depth", "film negative border", "scrapbook border", "watercolor border"]),
    },
  ];
  var FRAMING_OPTIONS = FRAMING_GROUPS.reduce(function (acc, group) { return acc.concat(group.options); }, []);

  var FANTASY_ELEMENTS_OPTIONS = sortAlpha([
    "fairy wings", "angel wings", "phoenix wings", "bat wings", "dragon wings",
    "magical aura", "glowing energy", "floating sparkles", "mystical symbols", "elemental powers",
    // new
    "fairy dust", "floating magic runes", "magic circle", "crystal magic", "unicorn horn", "celestial halo",
  ]);
  var PROPS_GROUPS = [
    {
      label: "Lifestyle",
      options: sortAlpha(["phone", "shopping bags", "coffee cup", "tumbler", "cocktail", "gift box", "pretty keychain"]),
    },
    {
      label: "Creative",
      options: sortAlpha(["books", "pencil", "calculator", "clipboard", "camera", "paintbrush", "laptop"]),
    },
    {
      label: "Music",
      options: sortAlpha(["guitar", "microphone"]),
    },
    {
      label: "Sports",
      options: sortAlpha(["basketball", "skateboard"]),
    },
    {
      label: "Magic & Fantasy",
      options: sortAlpha(["magic wand", "staff", "sword"]),
    },
    {
      label: "Faith",
      options: sortAlpha(["bible", "cross"]),
    },
    {
      label: "Celebration",
      options: sortAlpha(["flowers", "bouquet", "balloon"]),
    },
    {
      label: "Outdoor",
      options: sortAlpha(["umbrella", "lantern", "compass", "suitcase"]),
    },
  ];
  var PROPS_OPTIONS = PROPS_GROUPS.reduce(function (acc, group) { return acc.concat(group.options); }, []);
  // Renamed from "Cosplay Character" to "Character Archetype". "disney
  // princess"/"pop culture icon"/"cosplay inspired"/"chef"/"pilot" dropped
  // (owner's full-rebuild list) — "fairytale princess" below covers the
  // princess concept without the trademark risk a specific studio name
  // carries; chef/pilot already live in Occupation.
  var CHARACTER_ARCHETYPE_OPTIONS = sortAlpha([
    "anime character", "astronaut", "cowboy", "cowgirl", "fantasy creature",
    "historical figure", "manga character", "mermaid", "movie villain", "pirate", "pop star",
    "rapper", "sci-fi character", "singer", "superhero", "video game character",
    "royal character", "fairytale princess", "space explorer", "warrior",
    "renaissance character", "cinematic villain", "retro pop idol", "enchanted heroine",
    "storybook royal",
  ]);

  // "bird" instead of "bird on shoulder" — Companion Position already has
  // its own field for that ("on shoulder," "in arms," etc.), so the two
  // read as conflicting answers to the same question if a different
  // position is picked.
  var COMPANION_POSITION_OPTIONS = sortAlpha([
    "around neck", "curled up sleeping", "flying overhead", "floating nearby", "in arms",
    "in lap", "in purse", "looking up", "on leash", "on shoulder", "perched nearby",
    "riding on head", "sitting at feet", "sitting beside", "standing beside", "wrapped around arm",
  ]);
  var COMPANION_ACCESSORIES_OPTIONS = sortAlpha(["collar", "bandana", "tiny bow", "tiny purse"]);
  // Distinct from human Appearance's own Eye Color — Heterochromia doesn't
  // fit that field's "___ eyes" phrasing convention, so this stays its
  // own list rather than extending the shared one.
  var COMPANION_EYE_COLOR_OPTIONS = sortAlpha([
    "amber eyes", "blue eyes", "brown eyes", "gray eyes", "green eyes", "hazel eyes",
    "heterochromia", "violet eyes",
  ]);
  // Same small-to-large scale as Character's own Animal Mode Size field —
  // reused rather than duplicated (see ANIMAL_SIZE_OPTIONS above).

  // Shared creature taxonomy — single source of truth for "what animal/
  // creature is this," reused by both Companion (species field, upgraded
  // from its old flat 23-item list) and the standalone Animals & Creatures
  // Mode (full per-slot widget). Category picked first, which swaps in
  // that category's own curated breed/type list — same "pick a category,
  // reveal its sub-list" pattern Graphics Mode's Transportation already
  // uses for vehicles.
  var CREATURE_CATEGORY_OPTIONS = [
    "Dogs", "Cats", "Small Pets", "Farm Animals", "Wild Animals", "Birds",
    "Reptiles & Amphibians", "Fish", "Sea Creatures", "Insects", "Fantasy Creatures",
  ];
  var CREATURE_BREEDS_BY_CATEGORY = {
    Dogs: sortAlpha([
      "Australian Shepherd", "Basset Hound", "Bernese Mountain Dog", "Border Collie", "Boxer",
      "Cane Corso", "Cavalier King Charles Spaniel", "Chihuahua", "Corgi", "Dachshund",
      "Doberman", "French Bulldog", "German Shepherd", "Golden Retriever", "Great Dane",
      "Great Pyrenees", "Husky", "Labrador Retriever", "Maltese", "Mixed Breed", "Newfoundland",
      "Pit Bull", "Pomeranian", "Poodle", "Rottweiler", "Scottish Terrier", "Shiba Inu",
      "Shih Tzu", "Weimaraner", "Yorkshire Terrier",
    ]),
    Cats: sortAlpha([
      "American Shorthair", "Bengal", "Bobtail", "British Shorthair", "Calico",
      "Domestic Shorthair", "Himalayan", "Maine Coon", "Mixed Breed", "Norwegian Forest Cat",
      "Oriental Shorthair", "Persian", "Ragdoll", "Russian Blue", "Scottish Fold", "Siamese",
      "Sphynx", "Tabby", "Turkish Angora",
    ]),
    "Small Pets": sortAlpha([
      "Chinchilla", "Ferret", "Guinea Pig", "Hamster", "Hedgehog", "Mouse", "Rabbit", "Rat",
      "Sugar Glider",
    ]),
    "Farm Animals": sortAlpha([
      "Alpaca", "Chicken", "Cow", "Donkey", "Duck", "Goat", "Goose", "Highland Cow", "Horse",
      "Llama", "Miniature Donkey", "Pig", "Rooster", "Sheep", "Turkey",
    ]),
    "Wild Animals": sortAlpha([
      "Deer", "Moose", "Elk", "Bear", "Wolf", "Fox", "Raccoon", "Squirrel", "Hedgehog", "Otter",
      "Beaver", "Skunk", "Bison", "Mountain Lion", "Opossum",
    ]),
    Birds: sortAlpha([
      "Blue Jay", "Bluebird", "Cardinal", "Crow", "Dove", "Duck", "Eagle", "Finch", "Flamingo",
      "Hawk", "Hummingbird", "Owl", "Parrot", "Peacock", "Penguin", "Raven", "Robin", "Sparrow",
      "Swan",
    ]),
    "Reptiles & Amphibians": sortAlpha([
      "Bearded Dragon", "Iguana", "Gecko", "Chameleon", "Snake", "Turtle", "Tortoise",
      "Monitor Lizard", "Axolotl", "Alligator", "Crocodile",
    ]),
    Fish: sortAlpha([
      "Angelfish", "Bass", "Betta Fish", "Catfish", "Clownfish", "Discus", "Goldfish", "Guppy",
      "Koi Fish", "Oscar", "Puffer Fish", "Salmon", "Trout",
    ]),
    "Sea Creatures": sortAlpha([
      "Dolphin", "Whale", "Orca", "Octopus", "Shark", "Seahorse", "Jellyfish", "Sea Turtle",
      "Starfish", "Crab", "Lobster", "Seal", "Sea Lion", "Stingray", "Manatee",
    ]),
    Insects: sortAlpha(["Bee", "Butterfly", "Dragonfly", "Firefly", "Ladybug", "Moth", "Praying Mantis", "Spider"]),
    "Fantasy Creatures": sortAlpha([
      "Baby Dragon", "Celestial Wolf", "Centaur", "Cerberus", "Chimera", "Dragon", "Fairy",
      "Fairy Dragon", "Forest Sprite", "Ghost Companion", "Gnome", "Griffin", "Jackalope",
      "Kitsune", "Kraken", "Mermaid", "Moon Rabbit", "Pegasus", "Phoenix", "Sea Serpent",
      "Slime Creature", "Tiny Griffin", "Unicorn", "Werewolf", "Wyvern",
    ]),
  };
  // Flattened for randomize()/validation — every breed across every
  // category, since a couple of call sites just need "any valid breed"
  // without caring which category it came from.
  var ALL_CREATURE_BREEDS = Object.keys(CREATURE_BREEDS_BY_CATEGORY).reduce(function (acc, cat) {
    return acc.concat(CREATURE_BREEDS_BY_CATEGORY[cat]);
  }, []);
  // Shared fur/feather/scale coloring list — one color for Companion,
  // up to 3 for the standalone Animals & Creatures Mode's own creatures.
  var CREATURE_COLOR_OPTIONS = sortAlpha([
    "albino white", "black", "brindle", "brown", "calico pattern", "chocolate brown", "copper",
    "cream", "cream and white", "cream tabby", "golden", "gray", "iridescent", "merle",
    "multicolor", "orange/ginger", "piebald", "smoke gray", "snow white", "spotted",
    "striped/tabby pattern", "tortoiseshell", "tuxedo", "white",
  ]);

  // Field-name -> display-label maps, used by both the UI renderer and the
  // flattened field-entry list so labels never drift from field names.
  var IDENTITY_LABELS = {
    humanIdentity: {
      ethnicity: "Ethnicity", skinTone: "Skin Tone", ageGroup: "Age Group", gender: "Gender",
      height: "Height", bodyType: "Body Type", occupationNiche: "Occupation",
    },
    animalIdentity: {
      species: "Species", surfaceTexture: "Surface Texture",
      ageGroup: "Age Group", gender: "Gender", size: "Size", bodyType: "Body Type",
      occupationNiche: "Occupation",
    },
  };
  var APPEARANCE_LABELS = {
    hairColor: "Hair Color", hairStyle: "Hair Style", eyeColor: "Eye Color",
    expression: "Expression", facialFeatures: "Facial Features", eyeSizeShape: "Eye Size/Shape",
    lashIntensity: "Lash Intensity", lipStyle: "Lip Style", extraGlamDetails: "Extra Glam Details",
    // moved up from Styling (owner's call)
    makeup: "Makeup",
    // moved up from Styling (owner's call) — excluded from randomize
    // (APPEARANCE_RANDOM_EXCLUDE below), same treatment as Occupation.
    beard: "Beard",
  };
  var STYLING_LABELS = {
    outfit: "Outfit", shoes: "Shoes", nails: "Nails",
    // Second Accessories widget (owner's call) so a person can have more
    // than one accessory chosen at once — same option list, own field,
    // excluded from randomize (STYLING_RANDOM_EXCLUDE below) so it never
    // silently populates on its own.
    accessories: "Accessories", accessories2: "Accessories 2",
    mobilityAccessibility: "Mobility & Accessibility", jewelry: "Jewelry",
    tattoos: "Tattoos", headwearHeadEffects: "Headwear & Head Effects",
  };
  var PRESENTATION_LABELS = {
    pose: "Pose", background: "Background", dynamicSceneEffect: "Scene Effect",
    timeEra: "Time / Era", cameraAngle: "Camera Angle", lightingEffects: "Lighting Effects",
    framing: "Framing",
  };
  var EXTRAS_LABELS = {
    fantasyElements: "Fantasy Elements", props: "Props", characterArchetype: "Character Archetype",
  };
  // Randomize caps/exclusions — even Identity/Appearance/Presentation read
  // as "everything maxed out" when every field lights up together, so each
  // group gets a focused subset instead of a full sweep. Occupation/Height/
  // Body Type are excluded outright (not just capped) — they're specific
  // enough that a random pick reads as noise more often than not.
  var IDENTITY_RANDOM_EXCLUDE = ["height", "size", "bodyType", "occupationNiche"];
  // Beard excluded outright (owner's call, moved up from Styling) — same
  // treatment as Occupation/Height/Body Type above.
  var APPEARANCE_RANDOM_EXCLUDE = ["beard"];
  // Accessories 2 excluded outright — a second accessory slot should stay
  // deliberate, not something Randomize silently fills in.
  var STYLING_RANDOM_EXCLUDE = ["accessories2"];
  var APPEARANCE_RANDOM_CAP = 5;
  var STYLING_RANDOM_CAP = 3;
  var PRESENTATION_RANDOM_CAP = 3;
  var EXTRAS_RANDOM_CAP = 1;

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  function buildInitialState(baseType) {
    return {
      baseType: baseType || "human",
      style: {
        characterType: PromptHaus.util.makeGroupedField("", CHARACTER_TYPE_GROUPS),
        artFinish: PromptHaus.util.makeGroupedField("", ART_FINISH_GROUPS),
      },
      humanIdentity: {
        ethnicity: makeField("", ETHNICITY_OPTIONS),
        skinTone: makeField("", SKIN_TONE_OPTIONS),
        ageGroup: makeField("", HUMAN_AGE_GROUP_OPTIONS),
        gender: makeField("", HUMAN_GENDER_OPTIONS),
        height: makeField("", HEIGHT_OPTIONS),
        bodyType: makeField("", HUMAN_BODY_TYPE_OPTIONS),
        occupationNiche: makeField("", OCCUPATION_NICHE_OPTIONS),
      },
      animalIdentity: {
        species: PromptHaus.util.makeGroupedField("sheep", SPECIES_GROUPS),
        surfaceTexture: PromptHaus.util.makeGroupedField("", SURFACE_TEXTURE_GROUPS),
        ageGroup: makeField("", ANIMAL_AGE_GROUP_OPTIONS),
        gender: makeField("", ANIMAL_GENDER_OPTIONS),
        size: makeField("", ANIMAL_SIZE_OPTIONS),
        bodyType: makeField("", ANIMAL_BODY_TYPE_OPTIONS),
        occupationNiche: makeField("", OCCUPATION_NICHE_OPTIONS),
      },
      appearance: {
        hairColor: PromptHaus.util.makeGroupedField("", HAIR_COLOR_GROUPS),
        hairStyle: PromptHaus.util.makeGroupedField("", HAIR_STYLE_GROUPS),
        eyeColor: makeField("", EYE_COLOR_OPTIONS),
        expression: makeField("", EXPRESSION_OPTIONS),
        facialFeatures: makeField("", FACIAL_FEATURES_OPTIONS),
        eyeSizeShape: makeField("", EYE_SIZE_SHAPE_OPTIONS),
        lashIntensity: makeField("", LASH_INTENSITY_OPTIONS),
        lipStyle: makeField("", LIP_STYLE_OPTIONS),
        extraGlamDetails: makeField("", EXTRA_GLAM_DETAILS_OPTIONS),
        makeup: makeField("", MAKEUP_OPTIONS),
        beard: makeField("", BEARD_OPTIONS),
      },
      styling: {
        outfit: makeField("", OUTFIT_OPTIONS),
        shoes: makeField("", SHOES_OPTIONS),
        nails: makeField("", NAILS_OPTIONS),
        accessories: makeField("", ACCESSORIES_OPTIONS),
        accessories2: makeField("", ACCESSORIES_OPTIONS),
        mobilityAccessibility: makeField("none", MOBILITY_ACCESSIBILITY_OPTIONS),
        jewelry: makeField("", JEWELRY_OPTIONS),
        tattoos: makeField("", TATTOOS_OPTIONS),
        headwearHeadEffects: PromptHaus.util.makeGroupedField("none", HEADWEAR_HEAD_EFFECTS_GROUPS),
      },
      presentation: {
        // Defaulted rather than left on Select... — a sensible starting
        // point beats an empty field for the 3 choices almost every
        // portrait needs anyway; still fully editable/randomizable.
        pose: PromptHaus.util.makeGroupedField("standing pose", POSE_GROUPS),
        background: PromptHaus.util.makeGroupedField("", BACKGROUND_GROUPS),
        dynamicSceneEffect: makeField("", DYNAMIC_SCENE_EFFECT_OPTIONS),
        timeEra: makeField("", TIME_ERA_OPTIONS),
        cameraAngle: makeField("front view", CAMERA_ANGLE_OPTIONS),
        lightingEffects: makeField("studio lighting", LIGHTING_EFFECTS_OPTIONS),
        framing: PromptHaus.util.makeGroupedField("no frame", FRAMING_GROUPS),
      },
      extras: {
        fantasyElements: makeField("", FANTASY_ELEMENTS_OPTIONS),
        props: PromptHaus.util.makeGroupedField("", PROPS_GROUPS),
        characterArchetype: makeField("", CHARACTER_ARCHETYPE_OPTIONS),
      },
      // Category -> Breed replaces the old flat 23-item species list —
      // same shared taxonomy the standalone Animals & Creatures Mode uses,
      // so there's one consistent "what animal is this" system instead of
      // two that could drift apart. Position stays unique to Companion
      // (there's no "main character" to be positioned relative to in the
      // standalone mode); Color and Eye Color are light additions — kept
      // deliberately short of the standalone mode's full outfit/props/
      // attitude/pose depth, since Companion is meant to stay a quick
      // supporting detail, not a second fully-configured character.
      // Up to 3 companion slots — count is how many are currently active
      // (0 means the feature is off); slots stays a fixed array of 3 so
      // toggling a slot on/off never has to build/tear down field objects.
      companions: {
        count: 0,
        slots: [buildCompanionSlot(), buildCompanionSlot(), buildCompanionSlot()],
      },
    };
  }

  function buildCompanionSlot() {
    return {
      category: makeField("", CREATURE_CATEGORY_OPTIONS),
      breed: makeField("", []),
      color: makeField("", CREATURE_COLOR_OPTIONS),
      eyeColor: makeField("", COMPANION_EYE_COLOR_OPTIONS),
      size: makeField("", ANIMAL_SIZE_OPTIONS),
      position: makeField("", COMPANION_POSITION_OPTIONS),
      accessories: makeField("", COMPANION_ACCESSORIES_OPTIONS),
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function setBaseType(newBaseType) {
    store.setState({ baseType: newBaseType });
  }

  function updateNestedField(groupName, fieldName, changes) {
    var state = store.getState();
    var group = state[groupName];
    var newGroup = Object.assign({}, group);
    newGroup[fieldName] = Object.assign({}, group[fieldName], changes);
    var patch = {};
    patch[groupName] = newGroup;
    store.setState(patch);
  }

  var MAX_COMPANIONS = 3;

  // Toggling the checkbox off, or removing the last active slot, resets
  // count to 0 (feature off) rather than 3 empty slots sitting around.
  function setCompanionCount(count) {
    var state = store.getState();
    var clamped = Math.max(0, Math.min(MAX_COMPANIONS, count));
    store.setState({ companions: Object.assign({}, state.companions, { count: clamped }) });
  }

  function toggleCompanionInclude(include) {
    setCompanionCount(include ? 1 : 0);
  }

  // Same cascade pattern as Graphics Mode's Transportation category ->
  // vehicle type: changing the category swaps in that category's own
  // breed list and clears whatever breed was previously picked, since it
  // almost certainly doesn't belong to the new category.
  function updateCompanionSlotCategory(index, changes) {
    var state = store.getState();
    var slot = state.companions.slots[index];
    var nextCategory = Object.assign({}, slot.category, changes);
    var breedOptions = CREATURE_BREEDS_BY_CATEGORY[nextCategory.value] || [];
    var newSlot = Object.assign({}, slot, { category: nextCategory, breed: makeField("", breedOptions) });
    var newSlots = state.companions.slots.slice();
    newSlots[index] = newSlot;
    store.setState({ companions: Object.assign({}, state.companions, { slots: newSlots }) });
  }

  function updateCompanionSlotField(index, fieldName, changes) {
    var state = store.getState();
    var slot = state.companions.slots[index];
    var newSlot = Object.assign({}, slot);
    newSlot[fieldName] = Object.assign({}, slot[fieldName], changes);
    var newSlots = state.companions.slots.slice();
    newSlots[index] = newSlot;
    store.setState({ companions: Object.assign({}, state.companions, { slots: newSlots }) });
  }

  // Removes whichever slot is picked (not just the last one) — shifts any
  // slots after it down by one so there's no gap, and appends a fresh
  // empty slot at the end to keep the array at its fixed length of 3.
  function removeCompanionSlot(index) {
    var state = store.getState();
    var newSlots = state.companions.slots.slice();
    newSlots.splice(index, 1);
    newSlots.push(buildCompanionSlot());
    store.setState({
      companions: Object.assign({}, state.companions, {
        slots: newSlots,
        count: Math.max(0, state.companions.count - 1),
      }),
    });
  }

  // Flattened, active-baseType-aware field list. Both the UI renderer and
  // the prompt assembler read from this so they can never drift apart.
  function getActiveFieldEntries() {
    var state = store.getState();
    var identityGroup = state.baseType === "animalMascot" ? "animalIdentity" : "humanIdentity";
    var entries = [];

    function pushGroup(groupName, labels) {
      var group = state[groupName];
      Object.keys(labels).forEach(function (fieldName) {
        entries.push({
          groupName: groupName,
          fieldName: fieldName,
          label: labels[fieldName],
          field: group[fieldName],
        });
      });
    }

    pushGroup("style", { characterType: "Character Type", artFinish: "Art Finish" });
    pushGroup(identityGroup, IDENTITY_LABELS[identityGroup]);
    pushGroup("appearance", APPEARANCE_LABELS);
    pushGroup("styling", STYLING_LABELS);
    pushGroup("presentation", PRESENTATION_LABELS);
    pushGroup("extras", EXTRAS_LABELS);

    // Only numbered ("Companion 1", "Companion 2"...) once a second slot
    // is actually active — the common single-companion case keeps the
    // original unnumbered label instead of always saying "Companion 1."
    for (var i = 0; i < state.companions.count; i++) {
      var slot = state.companions.slots[i];
      var prefix = state.companions.count > 1 ? "Companion " + (i + 1) : "Companion";
      // Category is just the UI selector that narrows Breed's dropdown —
      // same treatment as Transportation, which only ever pushes "type,"
      // never "category," as an actual prompt descriptor.
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "breed", label: prefix, field: slot.breed });
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "color", label: prefix + " Color", field: slot.color });
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "eyeColor", label: prefix + " Eye Color", field: slot.eyeColor });
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "size", label: prefix + " Size", field: slot.size });
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "position", label: prefix + " Position", field: slot.position });
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "accessories", label: prefix + " Accessories", field: slot.accessories });
    }

    return entries;
  }

  // Character Type/Art Finish carry a full descriptive paragraph rather
  // than a short label — per the owner's prompt-order spec, those two
  // paragraphs open the prompt directly ("Illustration style: ...",
  // "Art finish: ...") instead of getting folded into the comma-joined
  // descriptor list like every other field.
  function assemblePrompt() {
    var state = store.getState();
    var allEntries = getActiveFieldEntries();
    var styleEntries = allEntries.filter(function (e) { return e.groupName === "style"; });
    var otherEntries = allEntries.filter(function (e) { return e.groupName !== "style"; });

    // Animal Mascot fix: Hair Style (curly/straight/wavy, meant for human
    // hair) is redundant once Surface Texture is chosen — Surface Texture's
    // own options already bake curliness/density into the noun itself
    // ("curly wool", "shaggy fur"), so a second independent styling field
    // either duplicates or contradicts it. Hair Color also used to float
    // as a disconnected comma item with no noun attached ("black" sitting
    // next to "curly wool"), which is exactly why a reported bug rendered
    // "black curly hair" instead of "black wool" — composed into Surface
    // Texture's own value instead (assembly time only; the UI still shows
    // Hair Color and Surface Texture as two separate editable fields).
    if (state.baseType === "animalMascot") {
      otherEntries = otherEntries.filter(function (e) { return e.fieldName !== "hairStyle"; });
      var hairColorIndex = -1;
      var hairColorEntry = null;
      otherEntries.forEach(function (e, i) {
        if (e.fieldName === "hairColor") { hairColorEntry = e; hairColorIndex = i; }
      });
      if (hairColorEntry) {
        var hairColorText = PromptHaus.engine.resolveFieldValue(hairColorEntry.field);
        if (hairColorText) {
          var surfaceTextureEntry = otherEntries.filter(function (e) { return e.fieldName === "surfaceTexture"; })[0];
          if (surfaceTextureEntry) {
            var surfaceTextureText = PromptHaus.engine.resolveFieldValue(surfaceTextureEntry.field);
            surfaceTextureEntry.field = makeField(surfaceTextureText ? hairColorText + " " + surfaceTextureText : hairColorText);
          }
        }
        otherEntries.splice(hairColorIndex, 1);
      }
    }

    var entries = otherEntries.map(function (e) { return { label: e.label, field: e.field }; });

    var characterTypeEntry = styleEntries.filter(function (e) { return e.fieldName === "characterType"; })[0];
    var artFinishEntry = styleEntries.filter(function (e) { return e.fieldName === "artFinish"; })[0];
    var illustrationStyleText = characterTypeEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(characterTypeEntry.field, CHARACTER_TYPE_PROMPTS))
      : "";
    var artFinishText = artFinishEntry
      ? PromptHaus.engine.resolveFieldValue(PromptHaus.engine.withPromptLookup(artFinishEntry.field, ART_FINISH_PROMPTS))
      : "";
    var introParts = ["Create an elite character portrait illustration."];
    if (illustrationStyleText) introParts.push("Illustration style: " + illustrationStyleText);
    if (artFinishText) introParts.push("Art finish: " + artFinishText);

    // Holiday, Creative Theme, Niche, Target Audience, Mood, Filter,
    // Imagery, and Buffer/Padding live in shared Style DNA, not
    // Character's own state, since they apply the same way across every
    // mode.
    entries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    entries.push({ label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme });
    entries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    entries.push({ label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience });
    entries.push({ label: "Mood", field: PromptHaus.styleDNA.getState().mood });
    entries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("character");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var stickerSheetGuard = PromptHaus.engine.stickerSheetGuard(count);
    var outro = "Generate " + count + (count === 1 ? " variation." : " variations.") +
      (stickerSheetGuard ? " " + stickerSheetGuard : "") +
      " Elite quality illustration with professional rendering and premium styling.";
    return PromptHaus.engine.buildSentence({
      intro: introParts.join(" "),
      fieldEntries: entries,
      outro: outro,
    });
  }

  function randomize() {
    // Companion is excluded from randomize entirely — it's an optional
    // add-on the user deliberately opted into, not something that should
    // get re-rolled (or, if not included, silently populated) alongside
    // everything else.
    getActiveFieldEntries().forEach(function (e) {
      // Appearance/Styling/Presentation/Extras get a capped random subset
      // instead — handled separately below, once per group, rather than
      // every eligible field getting turned on every time. Companion
      // entries only appear here when included, and are always skipped.
      if (e.groupName === "appearance" || e.groupName === "styling" || e.groupName === "presentation" || e.groupName === "extras") return;
      if (e.groupName === "companion") return;
      if (!e.field.includeInPrompt) return;
      if ((e.groupName === "humanIdentity" || e.groupName === "animalIdentity") && IDENTITY_RANDOM_EXCLUDE.indexOf(e.fieldName) !== -1) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      updateNestedField(e.groupName, e.fieldName, { value: randomValue, customValue: "" });
    });

    ["appearance", "styling", "presentation", "extras"].forEach(function (groupName) {
      var cap = { appearance: APPEARANCE_RANDOM_CAP, styling: STYLING_RANDOM_CAP, presentation: PRESENTATION_RANDOM_CAP, extras: EXTRAS_RANDOM_CAP }[groupName];
      var groupEntries = getActiveFieldEntries().filter(function (e) {
        if (e.groupName !== groupName) return false;
        if (groupName === "appearance" && APPEARANCE_RANDOM_EXCLUDE.indexOf(e.fieldName) !== -1) return false;
        if (groupName === "styling" && STYLING_RANDOM_EXCLUDE.indexOf(e.fieldName) !== -1) return false;
        return true;
      });
      PromptHaus.util.randomizeGroupWithCap(
        groupEntries,
        cap,
        function (fieldName, changes) { updateNestedField(groupName, fieldName, changes); },
        function (fieldName) { updateNestedField(groupName, fieldName, { value: "", customValue: "" }); }
      );
    });

    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState(store.getState().baseType));
    PromptHaus.styleDNA.resetContent();
    if (PromptHaus.characterVideo) PromptHaus.characterVideo.reset();
  }

  // Same active field list as the assembler, grouped by category with
  // empty/excluded fields dropped — feeds the "Your Selections" panel so it
  // can never drift out of sync with what actually lands in the prompt.
  function getSelectionsByGroup() {
    var state = store.getState();
    var identityGroup = state.baseType === "animalMascot" ? "animalIdentity" : "humanIdentity";
    var titleFor = {
      style: "Style",
      humanIdentity: "Human Identity",
      animalIdentity: "Character Identity - Animal Mode",
      appearance: "Appearance",
      styling: "Styling",
      presentation: "Presentation",
      extras: "Extras",
      companion: "Companion",
    };
    var order = ["style", identityGroup, "appearance", "styling", "presentation", "companion", "extras"];
    var entries = getActiveFieldEntries();
    var groups = [];
    order.forEach(function (groupName) {
      var groupEntries = entries
        .filter(function (e) {
          return e.groupName === groupName;
        })
        .map(function (e) {
          return { label: e.label, field: e.field };
        });
      var resolved = PromptHaus.engine.resolveFields(groupEntries);
      if (resolved.length) groups.push({ title: titleFor[groupName], items: resolved });
    });
    var holidayResolved = PromptHaus.engine.resolveFields([
      { label: "Holiday", field: PromptHaus.styleDNA.getState().holiday },
      { label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience },
      { label: "Mood", field: PromptHaus.styleDNA.getState().mood },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ]);
    if (holidayResolved.length) groups.push({ title: "Concept & Filter", items: holidayResolved });
    var imageryEntries = PromptHaus.styleDNA.getImageryEntries();
    if (imageryEntries.length) {
      groups.push({
        title: "Imagery & Scene Elements",
        items: imageryEntries.map(function (e) {
          return { label: e.label, value: e.field.value };
        }),
      });
    }
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) groups.push({ title: "Image Buffer/Padding", items: [{ label: bufferEntry.label, value: bufferEntry.field.value }] });
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("character");
    if (projectTypeEntry) groups.push({ title: "Project Type", items: [{ label: projectTypeEntry.label, value: projectTypeEntry.field.value }] });
    return groups;
  }

  // ---------------------------------------------------------------------
  // Starter Presets — a curated jumping-off point, not a final answer.
  // Deliberately only touch style/scene fields (Character Type, Art
  // Finish, Outfit, Background, Pose, Lighting, Framing) and never
  // Ethnicity/Skin Tone/Gender/Age/Body Type/Occupation — those are who
  // the shopper is depicting, not a stylistic choice a preset should be
  // making for them. Every field a preset sets stays fully editable
  // afterward, same as anything else in the panel.
  // ---------------------------------------------------------------------
  var PRESETS = [
    {
      id: "boyMomChibi",
      name: "Mom Chibi",
      description: "Exaggerated chibi style, hoodie & sweatpants, graffiti wall backdrop.",
      apply: function () {
        setBaseType("human");
        updateNestedField("style", "characterType", { value: "signature exaggerated chibi", customValue: "" });
        updateNestedField("style", "artFinish", { value: "high gloss illustration", customValue: "" });
        updateNestedField("styling", "outfit", { value: "hoodie and sweatpants", customValue: "" });
        updateNestedField("presentation", "background", { value: "urban graffiti wall", customValue: "" });
        updateNestedField("presentation", "pose", { value: "hands on hips", customValue: "" });
        updateNestedField("presentation", "framing", { value: "no frame", customValue: "" });
      },
    },
    {
      id: "girlMomGlam",
      name: "Mom Glam Coloring Page",
      description: "Black-and-white glam coloring page — sparkly makeup accents, confetti backdrop, ready to print and color.",
      apply: function () {
        setBaseType("human");
        // A coloring page needs Character Type set to the dedicated
        // "coloring book illustration" style (bold clean outlines, open
        // coloring areas, no shading) and Project Type set to "coloring
        // page" — that's what actually injects the black-and-white
        // line-art instruction and switches the suggested aspect ratio.
        // Art Finish is left empty on purpose: every option in that list
        // (glossy/candy-coated/airbrushed, etc.) implies color and shading,
        // which fights a black-and-white coloring page instead of helping it.
        updateNestedField("style", "characterType", { value: "coloring book illustration", customValue: "" });
        updateNestedField("style", "artFinish", { value: "", customValue: "" });
        updateNestedField("styling", "outfit", { value: "sparkly mini dress", customValue: "" });
        updateNestedField("appearance", "extraGlamDetails", { value: "under-eye sparkle", customValue: "" });
        updateNestedField("presentation", "background", { value: "sparkly confetti effect", customValue: "" });
        updateNestedField("presentation", "pose", { value: "blowing a kiss", customValue: "" });
        PromptHaus.styleDNA.setProjectType("coloring page");
        updateNestedField("presentation", "framing", { value: "no frame", customValue: "" });
      },
    },
    {
      id: "faithBasedBlessed",
      name: "Faith-Based Blessed",
      description: "Realistic illustration, soft angelic light, gold gilded frame.",
      apply: function () {
        setBaseType("human");
        updateNestedField("style", "characterType", { value: "realistic human illustration", customValue: "" });
        updateNestedField("style", "artFinish", { value: "soft airbrushed shine", customValue: "" });
        updateNestedField("presentation", "pose", { value: "lifting hands in praise", customValue: "" });
        updateNestedField("presentation", "dynamicSceneEffect", { value: "soft angelic light", customValue: "" });
        updateNestedField("presentation", "background", { value: "dreamy cloud scene", customValue: "" });
        updateNestedField("presentation", "framing", { value: "gold gilded frame", customValue: "" });
      },
    },
    {
      id: "vintageVarsity",
      name: "Vintage Varsity",
      description: "90s cartoon nostalgia, baseball jersey, retro film-strip frame.",
      apply: function () {
        setBaseType("human");
        updateNestedField("style", "characterType", { value: "90s cartoon nostalgia", customValue: "" });
        updateNestedField("style", "artFinish", { value: "textured painterly finish", customValue: "" });
        updateNestedField("styling", "outfit", { value: "baseball jersey", customValue: "" });
        updateNestedField("presentation", "background", { value: "solid white background", customValue: "" });
        updateNestedField("presentation", "timeEra", { value: "retro 50s", customValue: "" });
        updateNestedField("presentation", "framing", { value: "film strip border", customValue: "" });
      },
    },
    {
      id: "petLoverMascot",
      name: "Pet Lover Mascot",
      description: "Animal Mascot base, cartoon illustration, floral garden backdrop.",
      apply: function () {
        setBaseType("animalMascot");
        updateNestedField("style", "characterType", { value: "cartoon style illustration", customValue: "" });
        updateNestedField("style", "artFinish", { value: "glossy", customValue: "" });
        updateNestedField("presentation", "pose", { value: "standing pose", customValue: "" });
        updateNestedField("presentation", "background", { value: "floral garden scene", customValue: "" });
        updateNestedField("presentation", "framing", { value: "no frame", customValue: "" });
      },
    },
    {
      id: "streetwearIcon",
      name: "Streetwear Icon",
      description: "Cyberpunk neon illustration, leather jacket, neon glow frame.",
      apply: function () {
        setBaseType("human");
        updateNestedField("style", "characterType", { value: "cyberpunk neon illustration", customValue: "" });
        updateNestedField("style", "artFinish", { value: "ultra polished digital paint", customValue: "" });
        updateNestedField("styling", "outfit", { value: "leather jacket with ripped jeans", customValue: "" });
        updateNestedField("presentation", "background", { value: "sunset skyline", customValue: "" });
        updateNestedField("presentation", "lightingEffects", { value: "neon glow", customValue: "" });
        updateNestedField("presentation", "framing", { value: "glowing neon frame", customValue: "" });
      },
    },
  ];

  PromptHaus.character = Object.assign({}, store, {
    presets: PRESETS,
    setBaseType: setBaseType,
    updateNestedField: updateNestedField,
    toggleCompanionInclude: toggleCompanionInclude,
    setCompanionCount: setCompanionCount,
    updateCompanionSlotCategory: updateCompanionSlotCategory,
    updateCompanionSlotField: updateCompanionSlotField,
    removeCompanionSlot: removeCompanionSlot,
    MAX_COMPANIONS: MAX_COMPANIONS,
    getActiveFieldEntries: getActiveFieldEntries,
    getSelectionsByGroup: getSelectionsByGroup,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    labels: {
      identity: IDENTITY_LABELS,
      appearance: APPEARANCE_LABELS,
      styling: STYLING_LABELS,
      presentation: PRESENTATION_LABELS,
      extras: EXTRAS_LABELS,
      style: { characterType: "Character Type", artFinish: "Art Finish" },
    },
    // Single source of truth for option lists other modes need to reuse
    // (Couples Mode now, Graphics/Motif Mode later) rather than duplicating
    // them — per the same principle the build spec calls out explicitly.
    optionLists: {
      characterTypeGroups: CHARACTER_TYPE_GROUPS,
      characterTypePrompts: CHARACTER_TYPE_PROMPTS,
      artFinishGroups: ART_FINISH_GROUPS,
      artFinishPrompts: ART_FINISH_PROMPTS,
      ethnicity: ETHNICITY_OPTIONS,
      skinTone: SKIN_TONE_OPTIONS,
      humanAgeGroup: HUMAN_AGE_GROUP_OPTIONS,
      humanGender: HUMAN_GENDER_OPTIONS,
      height: HEIGHT_OPTIONS,
      humanBodyType: HUMAN_BODY_TYPE_OPTIONS,
      occupationNiche: OCCUPATION_NICHE_OPTIONS,
      species: SPECIES_OPTIONS,
      speciesGroups: SPECIES_GROUPS,
      surfaceTexture: SURFACE_TEXTURE_OPTIONS,
      surfaceTextureGroups: SURFACE_TEXTURE_GROUPS,
      animalAgeGroup: ANIMAL_AGE_GROUP_OPTIONS,
      animalGender: ANIMAL_GENDER_OPTIONS,
      animalSize: ANIMAL_SIZE_OPTIONS,
      animalBodyType: ANIMAL_BODY_TYPE_OPTIONS,
      hairColor: HAIR_COLOR_OPTIONS,
      hairColorGroups: HAIR_COLOR_GROUPS,
      hairStyle: HAIR_STYLE_OPTIONS,
      hairStyleGroups: HAIR_STYLE_GROUPS,
      eyeColor: EYE_COLOR_OPTIONS,
      expression: EXPRESSION_OPTIONS,
      facialFeatures: FACIAL_FEATURES_OPTIONS,
      eyeSizeShape: EYE_SIZE_SHAPE_OPTIONS,
      lashIntensity: LASH_INTENSITY_OPTIONS,
      lipStyle: LIP_STYLE_OPTIONS,
      extraGlamDetails: EXTRA_GLAM_DETAILS_OPTIONS,
      outfit: OUTFIT_OPTIONS,
      shoes: SHOES_OPTIONS,
      makeup: MAKEUP_OPTIONS,
      nails: NAILS_OPTIONS,
      beard: BEARD_OPTIONS,
      accessories: ACCESSORIES_OPTIONS,
      mobilityAccessibility: MOBILITY_ACCESSIBILITY_OPTIONS,
      jewelry: JEWELRY_OPTIONS,
      tattoos: TATTOOS_OPTIONS,
      headwearHeadEffectsGroups: HEADWEAR_HEAD_EFFECTS_GROUPS,
      pose: POSE_OPTIONS,
      poseGroups: POSE_GROUPS,
      background: BACKGROUND_OPTIONS,
      backgroundGroups: BACKGROUND_GROUPS,
      dynamicSceneEffect: DYNAMIC_SCENE_EFFECT_OPTIONS,
      timeEra: TIME_ERA_OPTIONS,
      cameraAngle: CAMERA_ANGLE_OPTIONS,
      lightingEffects: LIGHTING_EFFECTS_OPTIONS,
      framing: FRAMING_OPTIONS,
      framingGroups: FRAMING_GROUPS,
      fantasyElements: FANTASY_ELEMENTS_OPTIONS,
      props: PROPS_OPTIONS,
      propsGroups: PROPS_GROUPS,
      characterArchetype: CHARACTER_ARCHETYPE_OPTIONS,
      creatureCategories: CREATURE_CATEGORY_OPTIONS,
      creatureBreedsByCategory: CREATURE_BREEDS_BY_CATEGORY,
      allCreatureBreeds: ALL_CREATURE_BREEDS,
      creatureColors: CREATURE_COLOR_OPTIONS,
      companionPosition: COMPANION_POSITION_OPTIONS,
      companionAccessories: COMPANION_ACCESSORIES_OPTIONS,
      companionEyeColor: COMPANION_EYE_COLOR_OPTIONS,
    },
  });
})();
