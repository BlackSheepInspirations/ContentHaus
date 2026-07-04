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
        "anime style illustration",
      ],
    },
    {
      label: "Cartoon / Illustration",
      options: ["cartoon style illustration", "hand-drawn cartoon", "comic book style", "retro vintage cartoon", "pixar 3d render"],
    },
    {
      label: "Digital / Mixed Media",
      options: ["18k digital illustration", "gouache mixed with watercolor", "hyper realistic illustration"],
    },
    {
      label: "Realism / Photo-Adjacent",
      options: [
        "photorealistic portrait", "realistic human illustration", "cinematic photoreal",
        "studio headshot realism", "documentary-style realism", "fine art oil portrait",
      ],
    },
    {
      label: "Stick Figure & Line Styles",
      options: ["stick figure minimalist", "stick figure doodle", "line art / continuous line drawing", "monochrome ink sketch"],
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
      ],
    },
    {
      label: "Fine Art Inspired",
      options: ["impressionist painting style", "pop surrealism", "watercolor portrait", "charcoal sketch", "pastel illustration"],
    },
    {
      label: "Novelty / Texture-Based",
      options: ["vaporwave aesthetic", "low-poly 3d", "stained glass art style", "origami/paper-craft style"],
    },
  ];
  var ART_FINISH_OPTIONS = sortAlpha([
    "high gloss illustration", "soft airbrushed shine", "cell-shaded gloss",
    "ultra polished digital paint", "candy-coated finish", "silky poster finish", "glossy",
    // new
    "matte velvet finish", "iridescent holographic sheen", "textured painterly finish",
  ]);

  var ETHNICITY_OPTIONS = sortAlpha([
    "black", "east asian", "south asian", "southeast asian", "latino", "middle eastern",
    "white", "mixed heritage", "afro-latina", "mexican", "mixed ethnicity",
    // new — genuine catalog gaps, not just filler
    "native american/indigenous", "pacific islander",
  ]);
  var SKIN_TONE_OPTIONS = sortAlpha([
    "caramel", "porcelain", "fair", "warm ivory", "olive", "golden beige",
    "honey brown", "deep brown", "rich espresso",
    // new
    "tan", "medium brown",
  ]);
  var HUMAN_AGE_GROUP_OPTIONS = ["baby", "child", "teen", "young adult", "middle aged", "mature"];
  var HUMAN_GENDER_OPTIONS = sortAlpha(["female", "male", "non-binary"]); // non-binary added — genuine gap vs. reference tool
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
    "glossy jet black", "dark brown", "brunette", "honey blonde", "platinum blonde",
    "ginger", "red", "silver", "rich auburn", "pink/purple streaks", "pink ombre",
    "rose pink", "silver lavender", "peach ombre", "icy blue", "mint teal",
    // new
    "chestnut brown", "champagne blonde",
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
  var EXPRESSION_OPTIONS = sortAlpha(["none", "smiling", "confident", "curious", "playful", "serious", "surprised"]);
  var FACIAL_FEATURES_OPTIONS = sortAlpha([
    "none", "freckles", "dimples", "beauty mark", "glasses", "full lips", "high cheekbones",
    "button nose", "sharp jawline", "vitiligo", "burn mark", "ultra defined brows",
  ]);
  var EYE_SIZE_SHAPE_OPTIONS = sortAlpha([
    "large expressive", "huge exaggerated", "signature", "almond shaped", "soft rounded",
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
    "sequined cocktail dress", "velvet bodycon dress", "silk slip dress with blazer",
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
  var SHOES_OPTIONS = sortAlpha([
    "nike sneakers", "fuzzy slippers", "stiletto heels", "timberland boots", "rain boots",
    "lace up sneakers", "high top sneakers", "air max sneakers", "jordan sneakers",
    "dressy shoes", "open toe sandals", "blinged heels", "ugg boots", "just socks",
    "barefoot", "light-up sneakers", "velcro strap shoes", "mary jane shoes",
    "cowboy boots", "platform sneakers",
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
    "none", "face tattoos", "neck tattoos", "arm sleeve tattoos", "minimalist line tattoos",
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
  ]);

  var POSE_OPTIONS = sortAlpha([
    "standing pose", "action pose", "waving", "arms crossed", "sitting pose", "jumping",
    "blowing a kiss", "kneeling down", "taking a selfie", "throwing up the peace sign",
    "kneeling in prayer", "praying", "lifting hands in praise",
    // new
    "hands on hips", "leaning against wall",
  ]);
  var BACKGROUND_OPTIONS = sortAlpha([
    "solid white background", "transparent background png", "soft pastel gradient",
    "dreamy cloud scene", "sparkly confetti effect", "heart-filled backdrop", "rainbow gradient",
    "marble texture", "floral garden scene", "starry night sky", "candy-colored polka dots",
    "soft glitter fade",
    // new
    "sunset skyline", "urban graffiti wall", "underwater scene",
  ]);
  var DYNAMIC_SCENE_EFFECT_OPTIONS = sortAlpha([
    "floating in clouds", "emerging from splash", "surrounded by sparkles",
    "hair blowing in wind", "money flying around", "neon glow aura", "soft angelic light",
    "energy burst explosion",
  ]);
  var TIME_ERA_OPTIONS = sortAlpha([
    "modern day", "90s hip-hop", "90s Y2K", "1920s art deco", "1970s groovy", "1980s neon",
    "futuristic cyberpunk", "medieval fantasy", "victorian steampunk", "retro 50s", "1960s glam",
    // new
    "2000s pop punk", "ancient egyptian",
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
  ]);
  var COSPLAY_CHARACTER_OPTIONS = sortAlpha([
    "none", "anime character", "superhero", "video game character", "disney princess",
    "fantasy creature", "sci-fi character", "movie villain", "historical figure",
    "pop culture icon", "manga character", "cosplay inspired", "pirate", "mermaid",
    "cowboy", "cowgirl", "rapper", "singer", "astronaut", "chef", "pilot",
  ]);

  var COMPANION_SPECIES_OPTIONS = sortAlpha([
    "fluffy puppy", "big dog", "playful kitten", "bunny rabbit", "hamster", "bird on shoulder",
    "tiny dragon", "magical unicorn", "baby panda", "teddy bear", "guinea pig", "ferret",
    "baby fox", "baby raccoon", "hedgehog", "parrot",
    // new
    "baby goat", "chameleon",
  ]);
  var COMPANION_POSITION_OPTIONS = sortAlpha(["in purse", "on leash", "in arms", "on shoulder", "perched nearby", "sitting beside"]);
  var COMPANION_ACCESSORIES_OPTIONS = sortAlpha(["collar", "bandana", "tiny bow", "tiny purse", "none"]);

  // Field-name -> display-label maps, used by both the UI renderer and the
  // flattened field-entry list so labels never drift from field names.
  var IDENTITY_LABELS = {
    humanIdentity: {
      ethnicity: "Ethnicity", skinTone: "Skin Tone", ageGroup: "Age Group", gender: "Gender",
      height: "Height", bodyType: "Body Type", occupationNiche: "Occupation / Niche",
    },
    animalIdentity: {
      species: "Species", furFeatherScaleTexture: "Fur / Feather / Scale Texture",
      ageGroup: "Age Group", gender: "Gender", height: "Height", bodyType: "Body Type",
      occupationNiche: "Occupation / Niche",
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
    pose: "Pose", background: "Background", dynamicSceneEffect: "Dynamic Scene Effect",
    timeEra: "Time / Era", cameraAngle: "Camera Angle", lightingEffects: "Lighting Effects",
    framing: "Framing",
  };
  var EXTRAS_LABELS = {
    fantasyElements: "Fantasy Elements", props: "Props", cosplayCharacter: "Cosplay Character",
  };

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
        pose: makeField("", POSE_OPTIONS),
        background: makeField("", BACKGROUND_OPTIONS),
        dynamicSceneEffect: makeField("", DYNAMIC_SCENE_EFFECT_OPTIONS),
        timeEra: makeField("", TIME_ERA_OPTIONS),
        cameraAngle: makeField("", CAMERA_ANGLE_OPTIONS),
        lightingEffects: makeField("", LIGHTING_EFFECTS_OPTIONS),
        framing: makeField("no frame", FRAMING_OPTIONS),
      },
      extras: {
        fantasyElements: makeField("", FANTASY_ELEMENTS_OPTIONS),
        props: makeField("", PROPS_OPTIONS),
        cosplayCharacter: makeField("none", COSPLAY_CHARACTER_OPTIONS),
      },
      companion: {
        include: false,
        species: makeField("", COMPANION_SPECIES_OPTIONS),
        position: makeField("", COMPANION_POSITION_OPTIONS),
        accessories: makeField("none", COMPANION_ACCESSORIES_OPTIONS),
      },
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

  function toggleCompanionInclude(include) {
    var state = store.getState();
    store.setState({ companion: Object.assign({}, state.companion, { include: include }) });
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

    if (state.companion.include) {
      entries.push({ groupName: "companion", fieldName: "species", label: "Companion", field: state.companion.species });
      entries.push({ groupName: "companion", fieldName: "position", label: "Companion Position", field: state.companion.position });
      entries.push({ groupName: "companion", fieldName: "accessories", label: "Companion Accessories", field: state.companion.accessories });
    }

    return entries;
  }

  function assemblePrompt() {
    var entries = getActiveFieldEntries().map(function (e) {
      return { label: e.label, field: e.field };
    });
    // Holiday Theme lives in shared Style DNA, not Character's own state,
    // since it applies the same way across every mode.
    entries.push({ label: "Holiday Theme", field: PromptHaus.styleDNA.getState().holiday });
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var intro = "Create " + count + (count === 1 ? " variation" : " variations") +
      " of a clean, professional character portrait of a";
    return PromptHaus.engine.buildSentence({
      intro: intro,
      fieldEntries: entries,
    });
  }

  function randomize() {
    getActiveFieldEntries().forEach(function (e) {
      if (!e.field.includeInPrompt) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      if (e.groupName === "companion") {
        var companionState = store.getState().companion;
        var patch = {};
        patch[e.fieldName] = Object.assign({}, companionState[e.fieldName], {
          value: randomValue,
          customValue: "",
        });
        store.setState({ companion: Object.assign({}, companionState, patch) });
      } else {
        updateNestedField(e.groupName, e.fieldName, { value: randomValue, customValue: "" });
      }
    });
  }

  function reset() {
    store.setState(buildInitialState(store.getState().baseType));
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
    var order = ["style", identityGroup, "appearance", "styling", "presentation", "extras", "companion"];
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
      { label: "Holiday Theme", field: PromptHaus.styleDNA.getState().holiday },
    ]);
    if (holidayResolved.length) groups.push({ title: "Holiday Theme", items: holidayResolved });
    return groups;
  }

  PromptHaus.character = Object.assign({}, store, {
    setBaseType: setBaseType,
    updateNestedField: updateNestedField,
    toggleCompanionInclude: toggleCompanionInclude,
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
      background: BACKGROUND_OPTIONS,
      dynamicSceneEffect: DYNAMIC_SCENE_EFFECT_OPTIONS,
      timeEra: TIME_ERA_OPTIONS,
      cameraAngle: CAMERA_ANGLE_OPTIONS,
      lightingEffects: LIGHTING_EFFECTS_OPTIONS,
      framing: FRAMING_OPTIONS,
      fantasyElements: FANTASY_ELEMENTS_OPTIONS,
      props: PROPS_OPTIONS,
      cosplayCharacter: COSPLAY_CHARACTER_OPTIONS,
    },
  });
})();
