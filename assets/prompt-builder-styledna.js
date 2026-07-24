/**
 * The AI Creator's Prompt Haus — Style DNA (shared state)
 * Loaded first. Establishes window.PromptHaus and the tiny store/field
 * utilities that every other prompt-builder-*.js module reuses.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;

  // ---------------------------------------------------------------------
  // Shared utilities (reused by character/text/couples modules)
  // ---------------------------------------------------------------------
  PromptHaus.util = PromptHaus.util || {};

  // Case-insensitive alphabetical sort, used to display every dropdown's
  // options A-Z regardless of the order they're declared in source (source
  // order stays whatever's easiest to diff against the build plan).
  PromptHaus.util.sortAlpha = function (options) {
    return (options || []).slice().sort(function (a, b) {
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  };

  // Every field in every mode has this shape. `includeInPrompt` defaults to
  // true so Randomize (which only touches included fields) works out of the
  // box; the assembler still skips a field with no resolved value.
  PromptHaus.util.makeField = function (value, options, extra) {
    return Object.assign(
      {
        value: value || "",
        customValue: "",
        includeInPrompt: true,
        options: options || [],
      },
      extra || {}
    );
  };

  // Same field shape, but for dropdowns long/varied enough that browsing
  // by category beats a flat alphabetical list (e.g. Character Type's 50+
  // options). `optionGroups` is [{ label, options }] in the curated display
  // order — the UI renders it as native <optgroup> sections. `options`
  // stays a flattened list so resolveFieldValue/randomize/etc. work
  // unchanged; they don't need to know a field is grouped.
  PromptHaus.util.makeGroupedField = function (value, optionGroups, extra) {
    var flatOptions = [];
    (optionGroups || []).forEach(function (group) {
      flatOptions = flatOptions.concat(group.options);
    });
    return Object.assign(
      {
        value: value || "",
        customValue: "",
        includeInPrompt: true,
        options: flatOptions,
        optionGroups: optionGroups || [],
      },
      extra || {}
    );
  };

  // Randomizes at most `cap` fields from a decorative/optional group
  // instead of every eligible one — used by Character/Couples/Animals &
  // Creatures Mode's own randomize() for groups like Styling/Extras,
  // where turning every single field on every time (outfit + shoes +
  // makeup + nails + jewelry + tattoos + ...) reads as "maxed out" rather
  // than a focused, usable pick. Fields with "Include in prompt"
  // unchecked are left completely alone either way, matching how every
  // other field already behaves; fields that ARE eligible but don't get
  // picked this round are cleared (not left with a stale value from a
  // previous Randomize click), so the group actually reads as "only a
  // few things on" rather than slowly accumulating every option over
  // several clicks.
  //
  // entries: [{ fieldName, field }] (groupName/label are ignored here).
  // applyFn(fieldName, changes) and clearFn(fieldName) are the mode's own
  // update functions for that group.
  PromptHaus.util.randomizeGroupWithCap = function (entries, cap, applyFn, clearFn) {
    var eligible = entries.filter(function (e) {
      return e.field.includeInPrompt !== false && (e.field.options || []).length > 0;
    });
    var shuffled = eligible.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    var chosenNames = shuffled.slice(0, cap).map(function (e) {
      return e.fieldName;
    });
    eligible.forEach(function (e) {
      if (chosenNames.indexOf(e.fieldName) !== -1) {
        var options = e.field.options;
        applyFn(e.fieldName, { value: options[Math.floor(Math.random() * options.length)], customValue: "" });
      } else {
        clearFn(e.fieldName);
      }
    });
  };

  // Minimal pub/sub store. State updates are shallow-merged at the top
  // level; nested field updates go through util.updateField below.
  PromptHaus.util.createStore = function (initialState) {
    var state = initialState;
    var listeners = [];

    return {
      getState: function () {
        return state;
      },
      setState: function (patch) {
        state = Object.assign(
          {},
          state,
          typeof patch === "function" ? patch(state) : patch
        );
        listeners.forEach(function (fn) {
          fn(state);
        });
      },
      subscribe: function (fn) {
        listeners.push(fn);
        return function unsubscribe() {
          listeners = listeners.filter(function (l) {
            return l !== fn;
          });
        };
      },
    };
  };

  // Replace one field on a store with a shallow-merged copy, e.g.
  // updateField(store, 'projectType', { value: 'hoodie graphic' })
  PromptHaus.util.updateField = function (store, fieldName, changes) {
    var current = store.getState()[fieldName];
    var patch = {};
    patch[fieldName] = Object.assign({}, current, changes);
    store.setState(patch);
  };

  // ---------------------------------------------------------------------
  // Style DNA — Project Type, Aspect Ratio (auto-suggested), Target Platform
  // ---------------------------------------------------------------------
  // Regrouped into 4 categories and trimmed to art/creative-content
  // formats only — marketing/packaging/ad formats (beauty packaging,
  // Instagram ad, flyer, etc.) moved out to Product Haus/Marketing Haus/
  // Graphics Haus, which now own that territory. Alphabetized within
  // each group, per the standing house rule for every grouped dropdown.
  var PROJECT_TYPE_GROUPS = [
    {
      label: "Apparel",
      options: PromptHaus.util.sortAlpha([
        "hoodie graphic", "sweatshirt graphic", "t-shirt design", "tote bag graphic", "varsity jacket design",
      ]),
    },
    {
      label: "POD & Craft",
      options: PromptHaus.util.sortAlpha([
        "clip art", "cricut design", "sticker pack", "sublimation graphic",
      ]),
    },
    {
      label: "Art & Illustration",
      options: PromptHaus.util.sortAlpha([
        "art print", "canvas print", "coloring page", "poster", "tattoo design", "wall art",
      ]),
    },
    {
      label: "Digital",
      options: PromptHaus.util.sortAlpha([
        "desktop wallpaper", "phone wallpaper", "profile picture / avatar", "social media graphic",
      ]),
    },
  ];

  // Every Project Type gets a short phrase woven into the assembled
  // prompt (see getProjectTypeEntry below) — previously this field only
  // ever influenced the invisible Aspect Ratio auto-suggestion, so
  // picking a different Project Type produced identical prompt text
  // unless Target Platform happened to be Midjourney/Leonardo (the only
  // platforms that surface aspect ratio at all, via --ar).
  var PROJECT_TYPE_CONTEXT_PHRASES = {
    "t-shirt design": "designed for print on a t-shirt",
    "hoodie graphic": "designed for print on a hoodie",
    "sweatshirt graphic": "designed for print on a sweatshirt",
    "varsity jacket design": "designed for a varsity jacket back print",
    "tote bag graphic": "designed for print on a tote bag",
    "clip art": "designed as simple standalone clip art",
    "cricut design": "designed as a cut-ready craft design",
    "sticker pack": "designed as a die-cut sticker",
    "sublimation graphic": "designed as an all-over sublimation print",
    "art print": "composed as a fine art print",
    "canvas print": "composed as gallery canvas art",
    "coloring page": "designed as black-and-white coloring page line art",
    "poster": "composed as a poster design",
    "tattoo design": "designed as a tattoo design",
    "wall art": "composed as decorative wall art",
    "desktop wallpaper": "composed as a desktop wallpaper background",
    "phone wallpaper": "composed as a phone wallpaper background",
    "profile picture / avatar": "composed as a profile picture/avatar, centered and cropped square",
    "social media graphic": "composed as a social media graphic",
  };

  var ASPECT_RATIO_OPTIONS = ["1:1", "4:5", "9:16", "16:9"];

  // File-level export setting — independent of any mode's own decorative
  // Background field (a scene/content choice). Default is a deliberate
  // no-op so every existing prompt reads exactly as before until someone
  // actually opens this dropdown.
  var OUTPUT_FORMAT_OPTIONS = ["Default (PNG)", "PNG — Transparent Background", "JPG — Solid Background"];

  // "ChatGPT/DALL·E" renamed to "ChatGPT (GPT Image)" — DALL-E 2/3 were
  // retired by OpenAI in May 2026, replaced by GPT Image 2 as ChatGPT's
  // built-in image model, so the old label was actively wrong, not just
  // dated.
  var TARGET_PLATFORM_OPTIONS = [
    "Midjourney", "ChatGPT (GPT Image)", "Kittl", "Ideogram", "OpenArt",
    "Leonardo AI", "Adobe Firefly", "Flux",
  ];

  // Holiday / Creative Theme / Niche / Target Audience / Mood — the
  // "Concept • Creative Direction" set. Shared across every mode (a theme
  // applies just as much to Text lettering or a Couples scene as to a
  // Character portrait), so it lives here rather than duplicated per mode.
  // Grouped like Character Type: browses better by category than as one
  // flat wall. Target Audience and Mood are new fields alongside the 3
  // that already existed — all 5 render together in their own box in each
  // mode's panel, not in the dark Project Setup bar.
  var HOLIDAY_GROUPS = [
    { label: "General", options: ["none"] },
    {
      label: "US Federal & Civic",
      options: PromptHaus.util.sortAlpha([
        "new year's day", "martin luther king jr. day", "presidents' day", "memorial day",
        "juneteenth", "independence day (4th of july)", "labor day",
        "indigenous peoples' day / columbus day", "veterans day", "thanksgiving",
      ]),
    },
    { label: "Christian", options: PromptHaus.util.sortAlpha(["christmas", "christmas eve", "easter", "palm sunday", "good friday"]) },
    { label: "Jewish", options: PromptHaus.util.sortAlpha(["hanukkah", "passover", "rosh hashanah", "yom kippur"]) },
    { label: "Islamic", options: PromptHaus.util.sortAlpha(["ramadan", "eid al-fitr", "eid al-adha"]) },
    { label: "Hindu / Dharmic", options: PromptHaus.util.sortAlpha(["diwali", "holi", "navratri"]) },
    { label: "East Asian", options: PromptHaus.util.sortAlpha(["lunar new year", "mid-autumn festival"]) },
    { label: "Latin American", options: PromptHaus.util.sortAlpha(["cinco de mayo", "dia de los muertos (day of the dead)"]) },
    {
      label: "International / Regional",
      options: PromptHaus.util.sortAlpha(["canada day", "bastille day", "boxing day", "oktoberfest", "australia day", "nowruz (persian new year)"]),
    },
    {
      label: "Secular / Cultural",
      options: PromptHaus.util.sortAlpha([
        "new year's eve", "valentine's day", "st. patrick's day", "halloween", "mother's day",
        "father's day", "grandparents' day", "pride month", "earth day", "kwanzaa",
        "back to school", "teacher appreciation week", "graduation season",
      ]),
    },
  ];

  // Creative Theme — life events and moods. Distinct from Niche below: a
  // theme is more of an emotional/life-stage moment, a niche is an ongoing
  // hobby/interest community. Field state key stays "theme" — only the
  // on-screen label changed to "Creative Theme".
  var THEME_OPTIONS = PromptHaus.util.sortAlpha([
    "achievement", "adventure", "baby announcement", "back to school", "birthday",
    "celebration", "empowerment", "encouragement", "faith journey", "family",
    "friendship", "graduation", "gratitude", "grief / loss", "healing", "hope",
    "kindness", "love", "marriage/wedding/engagement", "mental health awareness",
    "milestone celebration", "motivation / inspirational", "new beginnings",
    "parenting", "patriotism", "pet memorial", "recovery/sobriety", "retirement",
    "self love", "small business", "strength", "success", "sympathy",
    "team spirit", "volunteer appreciation",
  ]);

  // Niche — ongoing hobby/interest communities, now grouped by category
  // rather than one flat wall.
  var NICHE_GROUPS = [
    {
      label: "Lifestyle",
      options: PromptHaus.util.sortAlpha([
        "animal lover", "bookworm / reading", "coffee culture", "crafting / diy",
        "gardening", "travel / adventure", "wine culture",
      ]),
    },
    {
      label: "Hobbies",
      options: PromptHaus.util.sortAlpha([
        "baking", "camping", "fishing", "hiking", "knitting & crochet",
        "painting & art", "photography", "sewing & quilting", "woodworking",
      ]),
    },
    {
      label: "Entertainment",
      options: PromptHaus.util.sortAlpha(["gaming culture", "movie lover", "music lover", "pop culture"]),
    },
    {
      label: "Sports & Fitness",
      options: PromptHaus.util.sortAlpha(["fitness / gym life", "running", "yoga"]),
    },
    {
      label: "Professional",
      options: PromptHaus.util.sortAlpha([
        "aviation / transportation", "car enthusiast", "hustle culture", "small business", "work life",
      ]),
    },
    {
      label: "Technology",
      options: PromptHaus.util.sortAlpha(["coding / programming", "ai & technology"]),
    },
    {
      label: "Food",
      options: PromptHaus.util.sortAlpha(["cooking / foodie", "bbq & grilling"]),
    },
    {
      label: "Seasonal",
      options: PromptHaus.util.sortAlpha(["beach life", "farm life", "homesteading"]),
    },
  ];

  // Target Audience — new field. Who the piece is being made for/about.
  var TARGET_AUDIENCE_GROUPS = [
    {
      label: "General",
      options: PromptHaus.util.sortAlpha(["everyone", "adults", "children", "teens", "seniors"]),
    },
    {
      label: "Family",
      options: PromptHaus.util.sortAlpha(["moms", "dads", "grandmas", "grandpas", "parents", "newlyweds", "couples"]),
    },
    {
      label: "Women",
      options: PromptHaus.util.sortAlpha(["women", "brides", "wives", "girlfriends"]),
    },
    {
      label: "Men",
      options: PromptHaus.util.sortAlpha(["men", "husbands", "boyfriends"]),
    },
    {
      label: "Professions",
      options: PromptHaus.util.sortAlpha([
        "teachers", "nurses", "doctors", "dentists", "veterinarians", "first responders",
        "firefighters", "police officers", "military personnel", "small business owners", "creators & makers",
      ]),
    },
    {
      label: "Hobby Groups",
      options: PromptHaus.util.sortAlpha([
        "crafters", "gardeners", "readers", "coffee lovers", "pet lovers", "gamers", "travelers", "fitness enthusiasts",
      ]),
    },
    {
      label: "Faith Communities",
      options: PromptHaus.util.sortAlpha([
        "christians", "catholics", "jewish community", "muslim community", "hindu community", "spiritual community",
      ]),
    },
  ];

  // Mood — new field. The emotional tone of the piece, distinct from Brand
  // Kit's own "Color Mood" (a color-palette descriptor, not a content one).
  var MOOD_GROUPS = [
    {
      label: "Positive",
      options: PromptHaus.util.sortAlpha(["cheerful", "happy", "joyful", "playful", "whimsical"]),
    },
    {
      label: "Cozy",
      options: PromptHaus.util.sortAlpha(["cozy", "comforting", "peaceful", "relaxed"]),
    },
    {
      label: "Elegant",
      options: PromptHaus.util.sortAlpha(["elegant", "glamorous", "luxurious", "sophisticated"]),
    },
    {
      label: "Inspirational",
      options: PromptHaus.util.sortAlpha(["encouraging", "hopeful", "inspirational", "uplifting"]),
    },
    {
      label: "Powerful",
      options: PromptHaus.util.sortAlpha(["adventurous", "bold", "confident", "energetic", "fierce", "powerful"]),
    },
    {
      label: "Dreamlike",
      options: PromptHaus.util.sortAlpha(["dreamy", "ethereal", "magical", "mystical"]),
    },
    {
      label: "Romantic",
      options: PromptHaus.util.sortAlpha(["affectionate", "romantic", "sentimental"]),
    },
    {
      label: "Seasonal",
      options: PromptHaus.util.sortAlpha(["festive", "spooky"]),
    },
    {
      label: "Artistic",
      options: PromptHaus.util.sortAlpha(["minimalist", "modern", "retro", "vintage"]),
    },
    {
      label: "Dramatic",
      options: PromptHaus.util.sortAlpha(["dark", "epic", "mysterious", "serene"]),
    },
  ];

  // Imagery & Scene Elements — shared across every mode, same rationale
  // as Holiday/Theme: a cross worked into the background or a dragonfly
  // perched on a sleeve applies just as much to a Text lettering design
  // as a Character portrait. Grouped like Character Type/Holiday: browses
  // better by category than as one flat wall. Spiritual & Faith stays
  // deliberately multi-tradition (not skewed to one religion); Holiday
  // imagery is kept distinct from Holiday/Theme above — Theme sets the
  // overall mood/season, this is a literal object/symbol integrated into
  // the image, so e.g. "menorah" only lives here, not duplicated in both.
  // Each category is still one flat alphabetized list (not sub-grouped
  // optgroups) — the widget renders 2 independent dropdown slots per
  // category, so sub-headers some categories are conceptually organized
  // by (e.g. Military & Patriotic's Patriotic Symbols/Memorial & Service/
  // Generic Military) are a content-authoring aid, not a UI structure.
  var IMAGERY_CATEGORIES = [
    {
      key: "spiritualFaith",
      label: "Spiritual & Faith",
      options: PromptHaus.util.sortAlpha([
        "angel wings", "buddha statue", "church silhouette", "crescent moon and star", "cross",
        "diya (oil lamp)", "dove", "good shepherd figure", "guardian angel", "halo", "hamsa",
        "lotus mandala", "menorah", "mosque silhouette", "olive branch", "om symbol",
        "open bible", "prayer beads (misbaha)", "prayer wheel", "praying hands", "rosary",
        "sacred light rays", "star of david", "temple silhouette", "torah scroll", "yin-yang symbol",
      ]),
    },
    {
      key: "holiday",
      label: "Holiday/Celebrations",
      options: PromptHaus.util.sortAlpha([
        "anniversary hearts", "bat", "birthday balloons", "birthday cake", "candy cane",
        "champagne glasses", "christmas ornaments", "christmas tree", "cornucopia", "cupid",
        "diwali rangoli pattern", "divorce cake", "dreidel", "easter bunny", "easter eggs",
        "easter lily", "empty tomb", "fireworks", "flower bouquet", "four-leaf clover",
        "gingerbread man", "ghost", "graduation cap", "halloween pumpkin",
        "lunar new year dragon", "menorah", "party confetti", "shamrock", "snowman",
        "valentine hearts", "wedding cake", "wedding rings",
      ]),
    },
    {
      key: "nature",
      label: "Nature",
      options: PromptHaus.util.sortAlpha([
        "autumn maple tree", "beach", "bee", "birch tree", "butterfly", "canyon", "cardinal bird",
        "cherry blossom tree", "clouds", "daisy", "dandelion", "deer", "desert", "dragonfly",
        "ferns", "firefly", "fog", "forest", "full moon", "hibiscus flower", "hummingbird",
        "ivy vines", "ladybug", "lake", "lavender", "lightning", "lotus flowers", "meadow",
        "meadow of wildflowers", "mountain range", "mountains", "mushrooms", "northern lights",
        "oak tree", "ocean wave", "owl", "palm tree", "peony", "pine tree", "rain", "rainbow",
        "river", "rolling hills", "rose", "snowflakes", "stars", "sun", "sunflower", "sunrise",
        "sunset", "tulip", "waterfall", "wildflower bouquet", "wildflower meadow", "willow tree",
      ]),
    },
    {
      key: "sciFi",
      label: "Science Fiction",
      options: PromptHaus.util.sortAlpha([
        "alien", "android", "asteroid", "aurora borealis", "black hole", "circuit board pattern",
        "comet", "drone", "energy portal", "floating interface screens", "futuristic city",
        "galactic planet", "hologram", "laser beam", "meteor shower", "nebula",
        "planet with rings", "plasma orb", "robot", "robotic companion", "rocket", "satellite",
        "space station", "spaceship", "starfield", "ufo",
      ]),
    },
    {
      key: "fantasy",
      label: "Fantasy",
      options: PromptHaus.util.sortAlpha([
        "castle", "crystal ball", "crystal cluster", "dragon", "enchanted forest", "fairy dust",
        "fairy wings", "floating islands", "floating spell pages", "griffin", "magic circle",
        "magic portal", "magic wand", "mermaid tail", "moonlit castle", "mystical runes",
        "pegasus", "phoenix", "potion bottle", "potion cauldron", "spellbook",
        "sword and shield", "treasure chest", "unicorn", "wizard staff",
      ]),
    },
    {
      key: "militaryPatriotic",
      label: "Military & Patriotic",
      options: PromptHaus.util.sortAlpha([
        "american flag", "bald eagle", "camouflage pattern", "capitol building",
        "coastal rescue emblem", "combat boots and helmet memorial", "dog tags",
        "eagle-and-anchor military emblem", "fireworks", "folded flag triangle", "liberty bell",
        "memorial poppies", "military aviation wings", "military medals",
        "military star emblem", "mount rushmore", "naval anchor",
        "naval special operations symbol", "patriotic stars", "purple heart medal",
        "red, white & blue bunting", "service ribbon display", "soldier silhouette",
        "space command emblem", "statue of liberty", "uncle sam", "veteran tribute wreath",
      ]),
    },
    {
      key: "sports",
      label: "Sports & Activities",
      options: PromptHaus.util.sortAlpha([
        "badminton racket and shuttlecock", "ballet shoes", "baseball", "basketball hoop",
        "bicycle", "bowling pin and ball", "boxing gloves", "cheerleading pom-poms",
        "cricket bat and ball", "fishing rod", "football", "golf club and ball", "gym weights",
        "hockey stick and puck", "lacrosse stick", "pickleball paddle", "rugby ball",
        "running shoes", "skateboard", "soccer ball", "softball", "surfboard",
        "swimming goggles", "tennis racket", "track-and-field baton", "volleyball",
        "wrestling singlet", "yoga mat",
      ]),
    },
    {
      key: "urban",
      label: "Urban",
      options: PromptHaus.util.sortAlpha([
        "alleyway", "bicycle lane", "boardwalk", "bridge", "brick wall", "brownstone street",
        "city lights", "city plaza", "city skyline", "city street", "coffee shop", "crosswalk",
        "downtown at night", "downtown skyline", "farmers market", "glass office buildings",
        "graffiti wall", "historic architecture", "historic downtown", "industrial warehouse",
        "modern skyscrapers", "neon street", "night market", "outdoor café", "rainy city street",
        "restaurant patio", "rooftop view", "shopping district", "subway entrance",
        "train station", "urban park", "waterfront promenade",
      ]),
    },
  ];

  // 2 widgets per category (8 total) rather than 3 generic slots spanning
  // every category — clearer/more obvious than one long combined dropdown.
  var IMAGERY_SLOTS = [];
  IMAGERY_CATEGORIES.forEach(function (cat) {
    IMAGERY_SLOTS.push({ fieldName: cat.key + "1", label: cat.label + " 1", options: cat.options });
    IMAGERY_SLOTS.push({ fieldName: cat.key + "2", label: cat.label + " 2", options: cat.options });
  });
  // Randomize cap — every category's slots turning on at once reads as
  // "everything imaginable," not a focused pick.
  var IMAGERY_RANDOM_CAP = 2;

  // Filter — shared across every mode for the same reason as Holiday/
  // Theme/Niche: a photo-style post-processing look applies just as much
  // to a Character portrait or Graphics design as it does to a Reference
  // image recreation.
  var FILTER_OPTIONS = PromptHaus.util.sortAlpha([
    "black and white", "sepia", "vintage film", "faded/washed out",
    "high contrast", "warm tone", "cool tone", "cross-process film", "duotone",
    "vignette", "grainy film analog", "technicolor vibrant", "infrared",
    "polaroid instant film", "hdr high dynamic range",
  ]);

  // Negative Prompt — shared across every mode, same reasoning as Holiday/
  // Theme/Niche/Filter: what to exclude applies to the whole generation,
  // not to one section of it (real AI tools only support one exclusion
  // list per generation — Midjourney's --no, Stable Diffusion's negative
  // prompt box — there's no such thing as "negative prompt just for the
  // background"). Free text, not a picklist, since what someone wants to
  // avoid is personal/open-ended; these are just one-click starting points.
  var NEGATIVE_PROMPT_SUGGESTIONS = [
    "watermark", "text", "logo", "signature", "extra limbs", "blurry",
    "low quality", "cropped", "distorted proportions", "extra fingers",
  ];

  // Sensible default mapping used for the aspect-ratio auto-suggest.
  // Square-ish print goods -> 1:1, packaging/labels & portrait social -> 4:5,
  // phone-native vertical formats -> 9:16. Adjustable later; nothing in the
  // build plan mandates an exact table, this just has to be a reasonable
  // default that "auto" can fall back to.
  var PROJECT_TYPE_TO_ASPECT_RATIO = {
    "t-shirt design": "1:1",
    "hoodie graphic": "1:1",
    "sweatshirt graphic": "1:1",
    "varsity jacket design": "1:1",
    "tote bag graphic": "1:1",
    "clip art": "1:1",
    "cricut design": "1:1",
    "sticker pack": "1:1",
    "sublimation graphic": "1:1",
    "art print": "4:5",
    "canvas print": "4:5",
    "coloring page": "4:5",
    "poster": "4:5",
    "tattoo design": "1:1",
    "wall art": "4:5",
    "desktop wallpaper": "16:9",
    "phone wallpaper": "9:16",
    "profile picture / avatar": "1:1",
    "social media graphic": "1:1",
  };
  var DEFAULT_ASPECT_RATIO = "4:5";

  function suggestedAspectRatio(projectType) {
    return PROJECT_TYPE_TO_ASPECT_RATIO[projectType] || DEFAULT_ASPECT_RATIO;
  }

  // Extracted so resetContent() can rebuild a fresh imagery object the same
  // way the initial store state does, instead of duplicating the loop.
  function buildInitialImageryState() {
    var initial = {};
    IMAGERY_SLOTS.forEach(function (slot) {
      initial[slot.fieldName] = PromptHaus.util.makeField("", slot.options, { quantity: 1 });
    });
    return initial;
  }

  // Defaults to true — most designs want the safety margin, and it's a
  // technical/production setting rather than a creative choice, so
  // defaulting it "on" is friendlier than making every shopper discover
  // and flip it themselves.
  var DEFAULT_ADD_BUFFER = true;

  var store = PromptHaus.util.createStore({
    projectType: PromptHaus.util.makeGroupedField(
      "t-shirt design",
      PROJECT_TYPE_GROUPS,
      { affectsAspectRatio: true }
    ),
    // `auto: true` means aspectRatio.value follows projectType automatically.
    // It flips to false the moment the shopper picks a ratio manually, and
    // the UI can call resetAspectRatioToAuto() to re-link it. Left in its
    // declared 1:1 -> 16:9 order rather than alphabetized — these are
    // ratios, not words, and that order is the one that reads sensibly.
    aspectRatio: PromptHaus.util.makeField(
      suggestedAspectRatio("t-shirt design"),
      ASPECT_RATIO_OPTIONS,
      { auto: true }
    ),
    targetPlatform: PromptHaus.util.makeField("ChatGPT (GPT Image)", PromptHaus.util.sortAlpha(TARGET_PLATFORM_OPTIONS)),
    outputFormat: PromptHaus.util.makeField(OUTPUT_FORMAT_OPTIONS[0], OUTPUT_FORMAT_OPTIONS),
    // Shared across every mode (Character/Text/Couples/Combined) — how many
    // AI-generated variations the assembled prompt asks for.
    variationCount: PromptHaus.util.makeField("2", ["1", "2", "3", "4"]),
    holiday: PromptHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
    theme: PromptHaus.util.makeField("", THEME_OPTIONS),
    niche: PromptHaus.util.makeGroupedField("", NICHE_GROUPS),
    targetAudience: PromptHaus.util.makeGroupedField("", TARGET_AUDIENCE_GROUPS),
    mood: PromptHaus.util.makeGroupedField("", MOOD_GROUPS),
    // Shared across every mode — a plain boolean, not a dropdown field,
    // since it's just a yes/no checkbox ("add a buffer/padding around the
    // image so nothing gets cropped at the edges").
    addBuffer: DEFAULT_ADD_BUFFER,
    // 8 independent slots (2 per category) rather than one multi-select
    // box — same "combine by filling more than one slot" pattern as
    // Graphics Mode's What Is It section, so someone can layer e.g. a
    // cross + a dove + the sun without a new checkbox-list UI paradigm.
    imagery: buildInitialImageryState(),
    filter: PromptHaus.util.makeField("", FILTER_OPTIONS),
    negativePrompt: PromptHaus.util.makeField("", [], { isFreeText: true }),
  });

  function setProjectType(newValue) {
    var state = store.getState();
    var patch = {
      projectType: Object.assign({}, state.projectType, { value: newValue }),
    };
    if (state.aspectRatio.auto) {
      patch.aspectRatio = Object.assign({}, state.aspectRatio, {
        value: suggestedAspectRatio(newValue),
      });
    }
    store.setState(patch);
  }

  function setAspectRatioManually(newValue) {
    var state = store.getState();
    store.setState({
      aspectRatio: Object.assign({}, state.aspectRatio, {
        value: newValue,
        auto: false,
      }),
    });
  }

  function resetAspectRatioToAuto() {
    var state = store.getState();
    store.setState({
      aspectRatio: Object.assign({}, state.aspectRatio, {
        auto: true,
        value: suggestedAspectRatio(state.projectType.value),
      }),
    });
  }

  function setTargetPlatform(newValue) {
    PromptHaus.util.updateField(store, "targetPlatform", { value: newValue });
  }

  function setVariationCount(newValue) {
    PromptHaus.util.updateField(store, "variationCount", { value: newValue });
  }

  function setHoliday(newValue) {
    PromptHaus.util.updateField(store, "holiday", { value: newValue });
  }

  function setTheme(newValue) {
    PromptHaus.util.updateField(store, "theme", { value: newValue });
  }

  function setNiche(newValue) {
    PromptHaus.util.updateField(store, "niche", { value: newValue });
  }

  function setTargetAudience(newValue) {
    PromptHaus.util.updateField(store, "targetAudience", { value: newValue });
  }

  function setMood(newValue) {
    PromptHaus.util.updateField(store, "mood", { value: newValue });
  }

  function setAddBuffer(enabled) {
    store.setState({ addBuffer: enabled });
  }

  function setOutputFormat(newValue) {
    PromptHaus.util.updateField(store, "outputFormat", { value: newValue });
  }

  function setFilter(newValue) {
    PromptHaus.util.updateField(store, "filter", { value: newValue });
  }

  // Generic partial-update version — used when Filter is rendered as a
  // normal field (via renderField/renderFieldGroup) inside each mode's own
  // Style section rather than the dark Style DNA bar, so it also supports
  // customValue/includeInPrompt changes, not just picking a new value.
  function updateFilterField(changes) {
    PromptHaus.util.updateField(store, "filter", changes);
  }

  // Generic partial-update versions for the Concept • Creative Direction
  // box — Holiday/Creative Theme/Niche/Target Audience/Mood now render as
  // standard fields (dropdown + "type your own" + "include in prompt"),
  // same as everything in each mode's own field groups, so they need the
  // full changes-object update, not just setHoliday/setTheme/etc.'s
  // value-only shortcut (still used by randomizeContent()).
  function updateHolidayField(changes) {
    PromptHaus.util.updateField(store, "holiday", changes);
  }

  function updateThemeField(changes) {
    PromptHaus.util.updateField(store, "theme", changes);
  }

  function updateNicheField(changes) {
    PromptHaus.util.updateField(store, "niche", changes);
  }

  function updateTargetAudienceField(changes) {
    PromptHaus.util.updateField(store, "targetAudience", changes);
  }

  function updateMoodField(changes) {
    PromptHaus.util.updateField(store, "mood", changes);
  }

  function updateNegativePrompt(changes) {
    PromptHaus.util.updateField(store, "negativePrompt", changes);
  }

  // Appends rather than replaces, so clicking a suggestion chip adds to
  // whatever's already typed instead of overwriting it.
  function addNegativePromptSuggestion(item) {
    var current = (store.getState().negativePrompt.value || "").trim();
    var items = current ? current.split(/[,;\n]/).map(function (t) { return t.trim().toLowerCase(); }) : [];
    if (items.indexOf(item.toLowerCase()) !== -1) return;
    var next = current ? current + ", " + item : item;
    updateNegativePrompt({ value: next });
  }

  // Shared synthetic entry every mode's assembler mixes into its own field
  // list (same treatment as Holiday / Theme) — null when unchecked, so it
  // resolves to nothing rather than a literal "false" appearing anywhere.
  function getBufferEntry() {
    if (!store.getState().addBuffer) return null;
    return {
      label: "Image Buffer/Padding",
      field: PromptHaus.util.makeField("buffer of empty space around the edges so nothing gets cropped at the borders"),
    };
  }

  function getProjectTypeEntry() {
    var projectType = store.getState().projectType.value;
    var phrase = PROJECT_TYPE_CONTEXT_PHRASES[projectType];
    if (!phrase) return null;
    return { label: "Project Type", field: PromptHaus.util.makeField(phrase) };
  }

  // Raw project type value (e.g. "t-shirt design"), for content that
  // wants to name the product directly (e.g. "Create bubble typography
  // for a <product type>.") rather than the fuller context phrase above
  // ("designed for print on a t-shirt"). Falls back to a generic phrase
  // when nothing's selected yet so the sentence never reads with a blank.
  function getProjectTypeValue() {
    var projectType = (store.getState().projectType.value || "").trim();
    return projectType || "custom design";
  }

  function updateImagerySlot(slotName, changes) {
    var state = store.getState();
    var patch = {};
    patch[slotName] = Object.assign({}, state.imagery[slotName], changes);
    store.setState({ imagery: Object.assign({}, state.imagery, patch) });
  }

  function setImageryQuantity(slotName, quantity) {
    updateImagerySlot(slotName, { quantity: Math.max(1, quantity || 1) });
  }

  // [{ fieldName, label, field }] for each slot — used by the shared UI
  // renderer and by randomize().
  function getImagerySlotEntries() {
    var imagery = store.getState().imagery;
    return IMAGERY_SLOTS.map(function (slot) {
      return { fieldName: slot.fieldName, label: slot.label, field: imagery[slot.fieldName] };
    });
  }

  // [{ key, label }] — used by the UI to render each category's 2 slots
  // together under its own heading.
  function getImageryCategories() {
    return IMAGERY_CATEGORIES.map(function (cat) {
      return { key: cat.key, label: cat.label };
    });
  }

  // A quantity > 1 prefixes the resolved value ("3x dragonflies") rather
  // than attempting real pluralization, matching Graphics Mode's What Is
  // It fields — same mix of already-singular/plural option phrases.
  function composeImagerySlotEntry(entry) {
    var resolved = PromptHaus.engine.resolveFieldValue(entry.field);
    if (!resolved) return null;
    var qty = entry.field.quantity || 1;
    var text = qty > 1 ? qty + "x " + resolved : resolved;
    return { label: "Imagery & Scene Elements", field: PromptHaus.util.makeField(text) };
  }

  // Every mode's assembler mixes these in (same treatment as Holiday
  // Theme/Buffer) — empty slots simply don't contribute an entry.
  function getImageryEntries() {
    var entries = [];
    getImagerySlotEntries().forEach(function (entry) {
      var composed = composeImagerySlotEntry(entry);
      if (composed) entries.push(composed);
    });
    return entries;
  }

  // Every mode's own Randomize/Reset only ever touched that mode's own
  // fields — Holiday/Theme/Niche/Target Audience/Mood, and Imagery live
  // here in shared Style DNA instead, so they silently never got
  // randomized or reset at all. Each mode's randomize()/reset() calls
  // these too now, so the whole prompt (not just that mode's own section)
  // responds to both buttons. addBuffer is deliberately left out of
  // randomizeContent() — it's a technical production setting, not a
  // creative dimension worth randomizing — but resetContent() does put it
  // back to its default.
  function randomizeContent() {
    // Holiday/Creative Theme/Niche/Target Audience/Mood deliberately
    // excluded from randomize (owner's call) — same reasoning Filter
    // already had: these are deliberate creative-direction choices, not
    // something that should flip on at random alongside everything else.
    // Filter deliberately excluded from randomize — it's a post-processing
    // look (black and white, sepia, etc.) that reads as a deliberate
    // finishing choice, not something that should flip on at random
    // alongside everything else.
    PromptHaus.util.randomizeGroupWithCap(
      getImagerySlotEntries(),
      IMAGERY_RANDOM_CAP,
      function (fieldName, changes) { updateImagerySlot(fieldName, changes); },
      function (fieldName) { updateImagerySlot(fieldName, { value: "", customValue: "" }); }
    );
  }

  // Scoped to just Holiday, Theme, Niche, Target Audience, Mood, Filter,
  // and Imagery — Buffer/Padding and the rest of the dark Project Setup
  // bar (Project Type, Aspect Ratio, Target Platform, Variations) are
  // deliberately left alone on Reset, since those read as "how this
  // prompt gets formatted/output" rather than "creative content" the
  // shopper wants cleared out.
  function resetContent() {
    store.setState({
      holiday: PromptHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
      theme: PromptHaus.util.makeField("", THEME_OPTIONS),
      niche: PromptHaus.util.makeGroupedField("", NICHE_GROUPS),
      targetAudience: PromptHaus.util.makeGroupedField("", TARGET_AUDIENCE_GROUPS),
      mood: PromptHaus.util.makeGroupedField("", MOOD_GROUPS),
      filter: PromptHaus.util.makeField("", FILTER_OPTIONS),
      imagery: buildInitialImageryState(),
      negativePrompt: PromptHaus.util.makeField("", [], { isFreeText: true }),
    });
  }

  PromptHaus.styleDNA = Object.assign({}, store, {
    setProjectType: setProjectType,
    setAspectRatioManually: setAspectRatioManually,
    resetAspectRatioToAuto: resetAspectRatioToAuto,
    setTargetPlatform: setTargetPlatform,
    setVariationCount: setVariationCount,
    setHoliday: setHoliday,
    setTheme: setTheme,
    setNiche: setNiche,
    setTargetAudience: setTargetAudience,
    setMood: setMood,
    setAddBuffer: setAddBuffer,
    setOutputFormat: setOutputFormat,
    getBufferEntry: getBufferEntry,
    getProjectTypeEntry: getProjectTypeEntry,
    getProjectTypeValue: getProjectTypeValue,
    setFilter: setFilter,
    updateFilterField: updateFilterField,
    updateHolidayField: updateHolidayField,
    updateThemeField: updateThemeField,
    updateNicheField: updateNicheField,
    updateTargetAudienceField: updateTargetAudienceField,
    updateMoodField: updateMoodField,
    updateNegativePrompt: updateNegativePrompt,
    addNegativePromptSuggestion: addNegativePromptSuggestion,
    negativePromptSuggestions: NEGATIVE_PROMPT_SUGGESTIONS,
    updateImagerySlot: updateImagerySlot,
    setImageryQuantity: setImageryQuantity,
    getImagerySlotEntries: getImagerySlotEntries,
    getImageryCategories: getImageryCategories,
    getImageryEntries: getImageryEntries,
    randomizeContent: randomizeContent,
    resetContent: resetContent,
    suggestedAspectRatio: suggestedAspectRatio,
  });
})();
