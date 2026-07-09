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
  // Character Type — replaces the old "Cartoon Type" list wholesale.
  // Curated and organized by category rather than alphabetized: at 54
  // options, browsing by "type of look" beats a flat A-Z wall, and these
  // are shown as native <optgroup> sections in the UI. Deliberately spans
  // far beyond the original cute/chibi niche (full photorealism, line art,
  // flat vector icons, fine art) — this field now also has to cover
  // advertising/mockup use cases, not just cartoony character art.
  var CHARACTER_TYPE_GROUPS = [
    {
      label: "Chibi / Doll / Cute Stylized",
      options: [
        "signature exaggerated chibi", "glossy 3d chibi", "high gloss chibi", "luxury glam chibi",
        "chibi mixed with bratz", "bratz-inspired", "hyper realistic bratz doll",
        "semi realism 4k bratz style", "glossy 3d chibi illustration", "luxury crochet amigurumi",
        "cgi caricature", "hyper-real cartoon", "soft spiritual glow", "ultra airbrushed urban",
        "anime style illustration", "storybook princess illustration",
      ],
    },
    {
      // "pixar 3d render" renamed — naming a specific studio's brand is
      // the same trademark risk Logo Mode explicitly warns against
      // ("no real brand names or logos"); this describes the same visual
      // (glossy, rounded, big-eyed 3D animated film look) without it.
      label: "Cartoon / Illustration",
      options: ["cartoon style illustration", "hand-drawn cartoon", "comic book style", "retro vintage cartoon", "modern 3d animated film style"],
    },
    {
      // Merged with the old standalone "Digital / Mixed Media" group — the
      // two overlapped too much to justify separate groups (both are
      // "realistic rendering," just illustrated vs. photo-adjacent).
      label: "Realism / Photo-Adjacent",
      options: [
        "photorealistic portrait", "realistic human illustration", "cinematic photoreal",
        "studio headshot realism", "documentary-style realism", "fine art oil portrait",
        "18k digital illustration", "hyper realistic illustration",
      ],
    },
    {
      // Ink/pencil sketch moved to Art Finish — those are mediums that can
      // apply on top of any style family, not their own style family.
      label: "Stick Figure & Line Styles",
      options: [
        "stick figure minimalist", "stick figure doodle", "line art / continuous line drawing",
        "doodle art",
      ],
    },
    {
      label: "Minimalist / Modern Graphic",
      options: ["flat vector illustration", "geometric minimalist", "silhouette design", "modern flat icon style"],
    },
    {
      label: "Retro / Pop Culture",
      options: [
        "retro comic pop art", "90s cartoon nostalgia", "y2k graphic style", "grunge/punk zine art",
        "cyberpunk neon illustration", "retro pixel art / 8-bit", "claymation style", "anime 90s cel-shaded",
        "dither art",
      ],
    },
    {
      // Watercolor/charcoal/pastel/etching/linocut/gouache moved to Art
      // Finish (mediums, not style families) — impressionism and pop
      // surrealism stay here since they're broader aesthetic movements,
      // not a single technique.
      label: "Fine Art Inspired",
      options: ["impressionist painting style", "pop surrealism"],
    },
    {
      // Stained glass/origami/risograph/scrapbook moved to Art Finish —
      // same "medium, not style family" reasoning as Fine Art Inspired.
      label: "Novelty / Texture-Based",
      options: ["vaporwave aesthetic", "low-poly 3d"],
    },
    {
      // New — the existing groups skew illustration/painting; this covers
      // the dimensional/sculptural rendering styles (chrome, clay, marble,
      // plush) that are a genuinely different aesthetic family.
      label: "3D & Sculptural",
      options: ["3d render", "chrome / liquid metal style", "marble sculpture style", "plush toy style"],
    },
  ];
  var ART_FINISH_OPTIONS = sortAlpha([
    "high gloss illustration", "soft airbrushed shine", "cell-shaded gloss",
    "ultra polished digital paint", "candy-coated finish", "silky poster finish", "glossy",
    // new
    "matte velvet finish", "iridescent holographic sheen", "textured painterly finish",
    // moved from Character Type — these are mediums/techniques that can
    // layer on top of any style family, not their own style family.
    "pencil sketch finish", "monochrome ink sketch finish", "watercolor finish",
    "charcoal sketch finish", "pastel finish", "etched/engraved finish",
    "linocut print finish", "gouache and watercolor finish", "stained glass finish",
    "origami/paper-craft finish", "risograph print finish", "scrapbook collage finish",
  ]);

  // Reworked for accuracy — "latino" and "mexican" read as two answers to
  // the same question (nationality vs. broad ethnicity), so both fold into
  // one "latin american/hispanic descent" option; "mixed heritage" and
  // "mixed ethnicity" were the same duplicate pattern, folded into one
  // "mixed/multiracial." Afro-latina stays distinct — it names a specific
  // identity the broader Latin American option doesn't capture on its own.
  var ETHNICITY_OPTIONS = sortAlpha([
    "black/african descent", "east asian", "south asian", "southeast asian",
    "white/caucasian", "middle eastern/north african", "native american/indigenous",
    "pacific islander", "latin american/hispanic descent", "afro-latina", "mixed/multiracial",
  ]);
  var SKIN_TONE_OPTIONS = sortAlpha([
    "caramel", "porcelain", "fair", "warm ivory", "olive", "golden beige",
    "honey brown", "deep brown", "rich espresso",
    // new
    "tan", "medium brown",
  ]);
  var HUMAN_AGE_GROUP_OPTIONS = ["baby", "toddler", "child", "teen", "young adult", "middle aged", "mature"];
  var HUMAN_GENDER_OPTIONS = sortAlpha(["female", "male"]);
  var HEIGHT_OPTIONS = ["short", "average height", "tall", "super tall"];
  var HUMAN_BODY_TYPE_OPTIONS = sortAlpha([
    "slim", "athletic", "curvy", "plus-size", "muscular", "petite", "tall and lean",
    "toned", "chubby", "small and cute", "tiny", "short and stocky", "lanky", "round and soft",
  ]);
  var OCCUPATION_NICHE_OPTIONS = sortAlpha([
    "none", "nurse", "teacher", "firefighter", "police officer", "doctor", "military/veteran",
    "pastor/clergy", "first responder/EMT", "small business owner", "chef", "artist/creative",
    "realtor", "veterinarian", "coach",
    // new
    "engineer", "graphic designer", "student",
    "flight attendant", "pilot", "executive", "dentist", "it/tech", "team mascot",
  ]);

  var SPECIES_OPTIONS = sortAlpha([
    "sheep", "lion", "tiger", "bear", "wolf", "eagle", "hawk", "falcon", "panther",
    "jaguar", "bulldog", "husky", "fox", "owl", "raven", "ram", "bull", "shark",
    "dolphin", "dragon (mythical)", "phoenix (mythical)", "unicorn (mythical)",
    "panda", "koala", "rabbit/bunny",
    // new
    "elephant", "cheetah",
  ]);
  var FUR_FEATHER_SCALE_TEXTURE_OPTIONS = sortAlpha([
    "soft charcoal wool", "fluffy cream fur", "sleek short fur", "curly wool", "silky feathers",
    "glossy scales", "plush teddy texture", "shaggy fur", "velvet-soft fur",
  ]);
  var ANIMAL_AGE_GROUP_OPTIONS = ["baby", "young", "adult", "elder"];
  var ANIMAL_GENDER_OPTIONS = sortAlpha(["female", "male", "gender-neutral"]);
  var ANIMAL_BODY_TYPE_OPTIONS = sortAlpha([
    "small fluffy rounded body", "slim", "chubby", "petite", "sturdy", "round and soft",
  ]);

  var HAIR_COLOR_OPTIONS = sortAlpha([
    "light brown", "dark brown", "light blonde", "platinum blonde", "dark blonde", "black",
    "auburn", "red", "dark red", "grey", "silver", "blue", "teal", "mint green", "green",
    "peach ombre", "pink ombre", "pink/purple streaks", "rose pink", "silver lavender",
    "blonde on top, dark red on the bottom",
  ]);
  var HAIR_STYLE_OPTIONS = sortAlpha([
    "long straight", "curly", "loose wave", "body wave", "messy bun", "side ponytail",
    "cornrows", "knotless braids", "blunt bob", "bald", "space buns", "pixie cut",
    "half up half down", "voluminous curls", "high ponytail", "tight curls", "big afro",
    "side ponytail with baby hairs", "messy bun with baby hairs", "braided ponytail",
    "senegalese twists", "sleek high bun with baby hairs", "90s finger waves", "mohawk",
    "bantu knots", "short dramatic curls", "braided updo", "middle-part curly puff buns",
    "deep side-part flipped bob", "straight-back feed-in stitch braids", "rope twist bob locs",
    "long boho braids", "velcro roller blowout set", "caesar haircut", "buzzcut",
    "low cut with deep waves", "hightop fade", "360 waves", "man bun", "gumby high top",
    // new — generic locs entry (distinct from the "rope twist bob locs" sub-style already
    // above), plus rounding out European/Nordic braiding traditions that weren't represented
    "locs/dreadlocks", "viking braids", "french braid pigtails", "dutch braid crown", "fishtail braid",
  ]);
  var EYE_COLOR_OPTIONS = sortAlpha(["brown eyes", "blue eyes", "green eyes", "hazel eyes", "gray eyes", "amber eyes"]);
  var EXPRESSION_OPTIONS = sortAlpha([
    "none", "smiling", "confident", "curious", "playful", "serious", "surprised",
    "angry", "sad", "crying",
  ]);
  // No "full lips" — Lip Style already has its own full section, so this
  // and that would read as two conflicting answers about the same feature.
  var FACIAL_FEATURES_OPTIONS = sortAlpha([
    "none", "freckles", "dimples", "beauty mark", "glasses", "high cheekbones",
    "button nose", "sharp jawline", "vitiligo", "burn mark", "ultra defined brows",
  ]);
  var EYE_SIZE_SHAPE_OPTIONS = sortAlpha([
    "large expressive", "huge exaggerated", "almond shaped", "soft rounded",
    "narrow fierce", "natural proportion",
  ]);
  var LASH_INTENSITY_OPTIONS = sortAlpha([
    "natural lashes", "long defined", "dramatic volume", "extra-long glam",
    "ultra-dramatic doll lashes", "extra long fluffy lashes",
  ]);
  var LIP_STYLE_OPTIONS = sortAlpha([
    "natural matte", "soft gloss", "plump glossy", "overlined glam", "extra-full high-gloss",
    "bold red lip", "ombre lip",
  ]);
  var EXTRA_GLAM_DETAILS_OPTIONS = sortAlpha([
    "face gems", "under-eye sparkle", "metallic eyeliner", "rhinestone accents", "body glitter",
  ]);

  var OUTFIT_OPTIONS = sortAlpha([
    "glam streetwear", "hoodie and sweatpants", "designer top with denim jeans",
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
  ]);
  // Generic sneaker/boot terms instead of specific brand names, to steer
  // clear of trademark/copyright issues.
  var SHOES_OPTIONS = sortAlpha([
    "fuzzy slippers", "stiletto heels", "rain boots",
    "lace up sneakers", "high top sneakers",
    "dressy shoes", "open toe sandals", "blinged heels", "just socks",
    "barefoot", "light-up sneakers", "velcro strap shoes", "mary jane shoes",
    "cowboy boots", "platform sneakers",
    // new
    "flip flops", "sandals", "work boots", "hiking boots", "winter boots",
  ]);
  var MAKEUP_OPTIONS = sortAlpha([
    "natural", "glam bold lips", "smokey eye", "glittery eyeshadow", "winged eyeliner",
    "no makeup", "cut crease", "graphic liner", "glossy dewy skin", "matte full coverage",
    "soft pink blush", "contoured cheekbones", "dramatic cat eye", "nude lips with highlight",
    "bold colored eyeliner", "glitter lip gloss", "bronzed sun-kissed glow", "faux freckles",
    "tiny beauty mark near the mouth", "dramatic black eyeliner", "glowing highlighted cheeks",
    "sculpted nose highlight",
  ]);
  var NAILS_OPTIONS = sortAlpha([
    "short length natural", "long length coffin", "medium length french tip", "stiletto",
    "almond", "french tip", "chrome glam", "rhinestone luxury",
  ]);
  var BEARD_OPTIONS = sortAlpha(["clean-shaven", "stubble", "boxed beard", "full beard", "goatee", "long groomed"]);
  var ACCESSORIES_OPTIONS = sortAlpha([
    "oversized sunglasses", "gold hoop earrings", "designer handbag", "fitted cap",
    "chunky necklace", "headphones", "beanie", "smartwatch", "crossbody bag", "backpack",
    "bucket hat", "diamond grillz", "scarf", "belt bag", "tote bag", "clutch purse",
    "durag", "hair bow", "clear glasses", "laptop",
    // new — religious headwear, standalone from Outfit's bundled hijab look so it can pair
    // with any outfit choice rather than locking into one specific full-look option
    "hijab", "turban", "kufi cap", "kippah/yarmulke",
  ]);
  var SPECIAL_NEEDS_OPTIONS = sortAlpha([
    "none", "wheelchair", "crutches", "cane", "hearing aid", "cochlear implant", "bifocals",
    "prosthetic limb", "white cane for vision", "service dog", "mobility walker",
    "braces on teeth", "leg brace", "arm cast", "oxygen tank",
  ]);
  var JEWELRY_OPTIONS = sortAlpha([
    "chunky gold chains", "delicate necklaces", "statement earrings", "multiple rings",
    "anklets", "body chains", "diamond studs", "diamond chain", "thick cuban link chain",
    "layered bracelets", "choker necklace", "pendant necklace", "nose ring",
    // new
    "cross necklace",
  ]);
  var TATTOOS_OPTIONS = sortAlpha([
    "none", "face tattoos", "neck tattoos", "arm tattoos", "arm sleeve tattoos", "minimalist line tattoos",
    "chest tattoos", "hand tattoos", "leg tattoos", "back tattoos", "tribal tattoos",
    "floral tattoos", "geometric tattoos",
  ]);
  var CROWN_HEAD_EFFECTS_OPTIONS = sortAlpha([
    "none", "neon halo with drips", "angel halo", "flower crown", "golden crown",
    "diamond tiara", "pink tiara", "butterfly clips", "bandana headband", "jeweled headpiece",
    "bow headband", "star crown",
    // new — same religious headwear already in Accessories, duplicated here too since this
    // list is the more literally headwear-themed one (Accessories is a broader mixed bag)
    "hijab", "turban", "kufi cap", "kippah/yarmulke",
    // new — "wireless earbuds" instead of a specific brand name, same
    // trademark-avoidance reasoning as Shoes
    "headphones", "wireless earbuds",
  ]);

  var POSE_OPTIONS = sortAlpha([
    "standing pose", "action pose", "waving", "arms crossed", "sitting pose", "jumping",
    "blowing a kiss", "kneeling down", "taking a selfie", "throwing up the peace sign",
    "kneeling in prayer", "praying", "lifting hands in praise",
    // new
    "hands on hips", "leaning against wall",
  ]);
  // Grouped like Character Type/Holiday — browses better by category than
  // as one flat 50+ item wall. Shared across Character/Couples/Graphics/
  // Animals & Creatures (all reuse this same source of truth via
  // optionLists.backgroundGroups), so the categorization reaches every
  // mode that has a Background field.
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
      label: "Urban & Cityscape",
      options: sortAlpha(["sunset skyline", "urban graffiti wall"]),
    },
    {
      label: "Nature & Outdoors",
      options: sortAlpha([
        "underwater scene", "jungle", "desert", "beach", "river", "lake",
        // terrain/scene coverage for Animals & Creatures (shared list, so
        // these reach Character/Couples/Graphics too)
        "space", "ocean", "forest", "mountains", "farm", "fields",
        "autumn foliage outdoor setting", "outdoor park setting", "golden hour beach setting",
      ]),
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
      ]),
    },
  ];
  var BACKGROUND_OPTIONS = BACKGROUND_GROUPS.reduce(function (acc, group) {
    return acc.concat(group.options);
  }, []);
  var DYNAMIC_SCENE_EFFECT_OPTIONS = sortAlpha([
    "floating in clouds", "emerging from splash", "surrounded by sparkles",
    "hair blowing in wind", "money flying around", "neon glow aura", "soft angelic light",
    "energy burst explosion",
    // new
    "jumping out of a lake",
  ]);
  var TIME_ERA_OPTIONS = sortAlpha([
    "modern day", "90s hip-hop", "90s Y2K", "1920s art deco", "1970s groovy", "1980s neon",
    "futuristic cyberpunk", "medieval fantasy", "victorian steampunk", "retro 50s", "1960s glam",
    // new
    "2000s pop punk", "ancient egyptian", "1920s gatsby", "genx",
  ]);
  var CAMERA_ANGLE_OPTIONS = sortAlpha([
    "front view", "side profile", "three-quarter view", "low angle shot", "high angle shot",
    "bird's eye view", "worm's eye view", "over the shoulder", "close-up portrait",
    "full body shot", "dutch angle", "extreme close-up",
    // new
    "fisheye lens", "aerial drone shot",
  ]);
  var LIGHTING_EFFECTS_OPTIONS = sortAlpha([
    "studio lighting", "golden hour glow", "soft diffused light", "dramatic shadows",
    "rim lighting", "neon glow", "candlelight", "sunlight through window", "moonlight",
    "stage lighting", "holographic light", "bioluminescent glow", "underlit glow",
    "backlit silhouette", "cool blue tones", "warm amber tones",
    // new
    "lantern glow", "aurora borealis glow",
  ]);
  var FRAMING_OPTIONS = sortAlpha([
    "no frame", "simple frame border", "ornate decorative frame", "modern minimalist frame",
    "vintage wooden frame", "gold gilded frame", "rose gold frame", "polaroid style frame",
    "film strip border", "comic book panel frame", "glowing neon frame", "holographic frame",
    "diamond encrusted frame", "floral wreath frame", "abstract geometric frame",
    "shadow frame with depth",
    // new
    "torn paper edge frame", "chalkboard frame",
  ]);

  var FANTASY_ELEMENTS_OPTIONS = sortAlpha([
    "fairy wings", "angel wings", "phoenix wings", "bat wings", "dragon wings",
    "magical aura", "glowing energy", "floating sparkles", "mystical symbols", "elemental powers",
  ]);
  var PROPS_OPTIONS = sortAlpha([
    "magic wand", "sword", "staff", "microphone", "guitar", "skateboard", "basketball",
    "books", "pretty keychain", "phone", "shopping bags", "coffee cup", "balloon",
    "flowers", "gift box",
    // new
    "bible", "cross", "tumbler", "cocktail", "beer bottle", "canned beer in a koozie",
    "pencil", "clipboard", "calculator",
  ]);
  var COSPLAY_CHARACTER_OPTIONS = sortAlpha([
    "none", "anime character", "superhero", "video game character", "disney princess",
    "fantasy creature", "sci-fi character", "movie villain", "historical figure",
    "pop culture icon", "manga character", "cosplay inspired", "pirate", "mermaid",
    "cowboy", "cowgirl", "rapper", "singer", "astronaut", "chef", "pilot",
  ]);

  // "bird" instead of "bird on shoulder" — Companion Position already has
  // its own field for that ("on shoulder," "in arms," etc.), so the two
  // read as conflicting answers to the same question if a different
  // position is picked.
  var COMPANION_POSITION_OPTIONS = sortAlpha(["in purse", "on leash", "in arms", "on shoulder", "perched nearby", "sitting beside"]);
  var COMPANION_ACCESSORIES_OPTIONS = sortAlpha(["collar", "bandana", "tiny bow", "tiny purse", "none"]);

  // Shared creature taxonomy — single source of truth for "what animal/
  // creature is this," reused by both Companion (species field, upgraded
  // from its old flat 23-item list) and the standalone Animals & Creatures
  // Mode (full per-slot widget). Category picked first, which swaps in
  // that category's own curated breed/type list — same "pick a category,
  // reveal its sub-list" pattern Graphics Mode's Transportation already
  // uses for vehicles.
  var CREATURE_CATEGORY_OPTIONS = [
    "Dogs", "Cats", "Small Pets", "Farm Animals", "Wild Animals", "Birds",
    "Reptiles", "Fish", "Sea Creatures", "Insects", "Fantasy Creatures",
  ];
  var CREATURE_BREEDS_BY_CATEGORY = {
    Dogs: sortAlpha([
      "Labrador Retriever", "Golden Retriever", "French Bulldog", "German Shepherd", "Poodle",
      "Chihuahua", "Pomeranian", "Dachshund", "Husky", "Pit Bull", "Rottweiler", "Corgi",
      "Basset Hound", "Scottish Terrier", "Mixed Breed",
    ]),
    Cats: sortAlpha([
      "Domestic Shorthair", "Siamese", "Persian", "Maine Coon", "Ragdoll", "Bengal",
      "British Shorthair", "Sphynx", "Tabby", "Himalayan", "Calico", "Bobtail", "Mixed Breed",
    ]),
    "Small Pets": sortAlpha(["Rabbit", "Hamster", "Guinea Pig", "Ferret", "Mouse", "Rat"]),
    "Farm Animals": sortAlpha([
      "Horse", "Cow", "Pig", "Goat", "Sheep", "Chicken", "Rooster", "Donkey", "Llama", "Turkey",
    ]),
    "Wild Animals": sortAlpha([
      "Deer", "Moose", "Elk", "Bear", "Wolf", "Fox", "Raccoon", "Squirrel", "Hedgehog", "Otter",
      "Beaver", "Skunk", "Bison", "Mountain Lion", "Opossum",
    ]),
    Birds: sortAlpha([
      "Parrot", "Owl", "Eagle", "Peacock", "Flamingo", "Swan", "Hummingbird", "Cardinal",
      "Blue Jay", "Penguin",
    ]),
    Reptiles: sortAlpha([
      "Bearded Dragon", "Iguana", "Gecko", "Chameleon", "Snake", "Turtle", "Tortoise",
      "Monitor Lizard", "Axolotl", "Alligator", "Crocodile",
    ]),
    Fish: sortAlpha([
      "Goldfish", "Betta Fish", "Koi Fish", "Clownfish", "Angelfish", "Guppy", "Catfish",
      "Bass", "Trout", "Salmon", "Puffer Fish",
    ]),
    "Sea Creatures": sortAlpha([
      "Dolphin", "Whale", "Orca", "Octopus", "Shark", "Seahorse", "Jellyfish", "Sea Turtle",
      "Starfish", "Crab", "Lobster", "Seal", "Sea Lion", "Stingray", "Manatee",
    ]),
    Insects: sortAlpha(["Butterfly", "Dragonfly", "Moth", "Firefly", "Spider"]),
    "Fantasy Creatures": sortAlpha([
      "Unicorn", "Dragon", "Phoenix", "Griffin", "Pegasus", "Mermaid", "Fairy", "Kraken",
      "Werewolf", "Centaur", "Kitsune", "Sea Serpent", "Chimera", "Wyvern", "Celestial Wolf",
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
    "black", "white", "brown", "golden", "gray", "cream", "orange/ginger", "spotted",
    "striped/tabby pattern", "calico pattern", "brindle", "piebald", "albino white",
    "iridescent", "multicolor",
  ]);

  // Field-name -> display-label maps, used by both the UI renderer and the
  // flattened field-entry list so labels never drift from field names.
  var IDENTITY_LABELS = {
    humanIdentity: {
      ethnicity: "Ethnicity", skinTone: "Skin Tone", ageGroup: "Age Group", gender: "Gender",
      height: "Height", bodyType: "Body Type", occupationNiche: "Occupation",
    },
    animalIdentity: {
      species: "Species", furFeatherScaleTexture: "Fur / Feather / Scale Texture",
      ageGroup: "Age Group", gender: "Gender", height: "Height", bodyType: "Body Type",
      occupationNiche: "Occupation",
    },
  };
  var APPEARANCE_LABELS = {
    hairColor: "Hair Color", hairStyle: "Hair Style", eyeColor: "Eye Color",
    expression: "Expression", facialFeatures: "Facial Features", eyeSizeShape: "Eye Size/Shape",
    lashIntensity: "Lash Intensity", lipStyle: "Lip Style", extraGlamDetails: "Extra Glam Details",
  };
  var STYLING_LABELS = {
    outfit: "Outfit", shoes: "Shoes", makeup: "Makeup", nails: "Nails", beard: "Beard",
    accessories: "Accessories", specialNeeds: "Special Needs", jewelry: "Jewelry",
    tattoos: "Tattoos", crownHeadEffects: "Crown / Head Effects",
  };
  var PRESENTATION_LABELS = {
    pose: "Pose", background: "Background", dynamicSceneEffect: "Scene Effect",
    timeEra: "Time / Era", cameraAngle: "Camera Angle", lightingEffects: "Lighting Effects",
    framing: "Framing",
  };
  var EXTRAS_LABELS = {
    fantasyElements: "Fantasy Elements", props: "Props", cosplayCharacter: "Cosplay Character",
  };
  // Randomize caps/exclusions — even Identity/Appearance/Presentation read
  // as "everything maxed out" when every field lights up together, so each
  // group gets a focused subset instead of a full sweep. Occupation/Height/
  // Body Type are excluded outright (not just capped) — they're specific
  // enough that a random pick reads as noise more often than not.
  var IDENTITY_RANDOM_EXCLUDE = ["height", "bodyType", "occupationNiche"];
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
        artFinish: makeField("", ART_FINISH_OPTIONS),
      },
      humanIdentity: {
        ethnicity: makeField("", ETHNICITY_OPTIONS),
        skinTone: makeField("", SKIN_TONE_OPTIONS),
        ageGroup: makeField("", HUMAN_AGE_GROUP_OPTIONS),
        gender: makeField("", HUMAN_GENDER_OPTIONS),
        height: makeField("", HEIGHT_OPTIONS),
        bodyType: makeField("", HUMAN_BODY_TYPE_OPTIONS),
        occupationNiche: makeField("none", OCCUPATION_NICHE_OPTIONS),
      },
      animalIdentity: {
        species: makeField("sheep", SPECIES_OPTIONS),
        furFeatherScaleTexture: makeField("", FUR_FEATHER_SCALE_TEXTURE_OPTIONS),
        ageGroup: makeField("", ANIMAL_AGE_GROUP_OPTIONS),
        gender: makeField("", ANIMAL_GENDER_OPTIONS),
        height: makeField("", HEIGHT_OPTIONS),
        bodyType: makeField("", ANIMAL_BODY_TYPE_OPTIONS),
        occupationNiche: makeField("none", OCCUPATION_NICHE_OPTIONS),
      },
      appearance: {
        hairColor: makeField("", HAIR_COLOR_OPTIONS),
        hairStyle: makeField("", HAIR_STYLE_OPTIONS),
        eyeColor: makeField("", EYE_COLOR_OPTIONS),
        expression: makeField("none", EXPRESSION_OPTIONS),
        facialFeatures: makeField("none", FACIAL_FEATURES_OPTIONS),
        eyeSizeShape: makeField("", EYE_SIZE_SHAPE_OPTIONS),
        lashIntensity: makeField("", LASH_INTENSITY_OPTIONS),
        lipStyle: makeField("", LIP_STYLE_OPTIONS),
        extraGlamDetails: makeField("", EXTRA_GLAM_DETAILS_OPTIONS),
      },
      styling: {
        outfit: makeField("", OUTFIT_OPTIONS),
        shoes: makeField("", SHOES_OPTIONS),
        makeup: makeField("", MAKEUP_OPTIONS),
        nails: makeField("", NAILS_OPTIONS),
        beard: makeField("", BEARD_OPTIONS),
        accessories: makeField("", ACCESSORIES_OPTIONS),
        specialNeeds: makeField("none", SPECIAL_NEEDS_OPTIONS),
        jewelry: makeField("", JEWELRY_OPTIONS),
        tattoos: makeField("none", TATTOOS_OPTIONS),
        crownHeadEffects: makeField("none", CROWN_HEAD_EFFECTS_OPTIONS),
      },
      presentation: {
        // Defaulted rather than left on Select... — a sensible starting
        // point beats an empty field for the 3 choices almost every
        // portrait needs anyway; still fully editable/randomizable.
        pose: makeField("standing pose", POSE_OPTIONS),
        background: PromptHaus.util.makeGroupedField("", BACKGROUND_GROUPS),
        dynamicSceneEffect: makeField("", DYNAMIC_SCENE_EFFECT_OPTIONS),
        timeEra: makeField("", TIME_ERA_OPTIONS),
        cameraAngle: makeField("front view", CAMERA_ANGLE_OPTIONS),
        lightingEffects: makeField("studio lighting", LIGHTING_EFFECTS_OPTIONS),
        framing: makeField("no frame", FRAMING_OPTIONS),
      },
      extras: {
        fantasyElements: makeField("", FANTASY_ELEMENTS_OPTIONS),
        props: makeField("", PROPS_OPTIONS),
        cosplayCharacter: makeField("none", COSPLAY_CHARACTER_OPTIONS),
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
      eyeColor: makeField("", EYE_COLOR_OPTIONS),
      position: makeField("", COMPANION_POSITION_OPTIONS),
      accessories: makeField("none", COMPANION_ACCESSORIES_OPTIONS),
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
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "position", label: prefix + " Position", field: slot.position });
      entries.push({ groupName: "companion", slotIndex: i, fieldName: "accessories", label: prefix + " Accessories", field: slot.accessories });
    }

    return entries;
  }

  function assemblePrompt() {
    var entries = getActiveFieldEntries().map(function (e) {
      return { label: e.label, field: e.field };
    });
    // Holiday, Theme, Niche, Mockup View, Filter, Imagery, and Buffer/
    // Padding live in shared Style DNA, not Character's own state, since
    // they apply the same way across every mode.
    entries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    entries.push({ label: "Theme", field: PromptHaus.styleDNA.getState().theme });
    entries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    entries.push({ label: "Mockup View", field: PromptHaus.styleDNA.getState().mockupView });
    entries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("character");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var intro = "Create " + count + (count === 1 ? " variation" : " variations") +
      " of a clean, professional character portrait of a";
    return PromptHaus.engine.buildSentence({
      intro: intro,
      fieldEntries: entries,
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
      PromptHaus.util.randomizeGroupWithCap(
        getActiveFieldEntries().filter(function (e) { return e.groupName === groupName; }),
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
      animalIdentity: "Animal Identity",
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
      { label: "Theme", field: PromptHaus.styleDNA.getState().theme },
      { label: "Niche", field: PromptHaus.styleDNA.getState().niche },
      { label: "Mockup View", field: PromptHaus.styleDNA.getState().mockupView },
      { label: "Filter It", field: PromptHaus.styleDNA.getState().filter },
    ]);
    if (holidayResolved.length) groups.push({ title: "Holiday, Theme & Niche", items: holidayResolved });
    var imageryEntries = PromptHaus.styleDNA.getImageryEntries();
    if (imageryEntries.length) {
      groups.push({
        title: "Imagery",
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
      name: "Boy Mom Chibi",
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
      name: "Girl Mom Glam",
      description: "Luxury glam chibi, glam makeup, sparkly confetti backdrop.",
      apply: function () {
        setBaseType("human");
        updateNestedField("style", "characterType", { value: "luxury glam chibi", customValue: "" });
        updateNestedField("style", "artFinish", { value: "candy-coated finish", customValue: "" });
        updateNestedField("styling", "outfit", { value: "sparkly mini dress", customValue: "" });
        updateNestedField("appearance", "extraGlamDetails", { value: "under-eye sparkle", customValue: "" });
        updateNestedField("presentation", "background", { value: "sparkly confetti effect", customValue: "" });
        updateNestedField("presentation", "pose", { value: "blowing a kiss", customValue: "" });
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
      artFinish: ART_FINISH_OPTIONS,
      ethnicity: ETHNICITY_OPTIONS,
      skinTone: SKIN_TONE_OPTIONS,
      humanAgeGroup: HUMAN_AGE_GROUP_OPTIONS,
      humanGender: HUMAN_GENDER_OPTIONS,
      height: HEIGHT_OPTIONS,
      humanBodyType: HUMAN_BODY_TYPE_OPTIONS,
      occupationNiche: OCCUPATION_NICHE_OPTIONS,
      species: SPECIES_OPTIONS,
      furFeatherScaleTexture: FUR_FEATHER_SCALE_TEXTURE_OPTIONS,
      animalAgeGroup: ANIMAL_AGE_GROUP_OPTIONS,
      animalGender: ANIMAL_GENDER_OPTIONS,
      animalBodyType: ANIMAL_BODY_TYPE_OPTIONS,
      hairColor: HAIR_COLOR_OPTIONS,
      hairStyle: HAIR_STYLE_OPTIONS,
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
      specialNeeds: SPECIAL_NEEDS_OPTIONS,
      jewelry: JEWELRY_OPTIONS,
      tattoos: TATTOOS_OPTIONS,
      crownHeadEffects: CROWN_HEAD_EFFECTS_OPTIONS,
      pose: POSE_OPTIONS,
      background: BACKGROUND_OPTIONS,
      backgroundGroups: BACKGROUND_GROUPS,
      dynamicSceneEffect: DYNAMIC_SCENE_EFFECT_OPTIONS,
      timeEra: TIME_ERA_OPTIONS,
      cameraAngle: CAMERA_ANGLE_OPTIONS,
      lightingEffects: LIGHTING_EFFECTS_OPTIONS,
      framing: FRAMING_OPTIONS,
      fantasyElements: FANTASY_ELEMENTS_OPTIONS,
      props: PROPS_OPTIONS,
      cosplayCharacter: COSPLAY_CHARACTER_OPTIONS,
      creatureCategories: CREATURE_CATEGORY_OPTIONS,
      creatureBreedsByCategory: CREATURE_BREEDS_BY_CATEGORY,
      allCreatureBreeds: ALL_CREATURE_BREEDS,
      creatureColors: CREATURE_COLOR_OPTIONS,
      companionPosition: COMPANION_POSITION_OPTIONS,
      companionAccessories: COMPANION_ACCESSORIES_OPTIONS,
    },
  });
})();
