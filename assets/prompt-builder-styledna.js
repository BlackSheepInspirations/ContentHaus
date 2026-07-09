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
  var PROJECT_TYPE_OPTIONS = [
    "t-shirt design", "hoodie graphic", "varsity jacket design", "tote bag graphic",
    "beauty packaging", "candle label", "snack packaging", "skincare label",
    "cosmetic branding", "lock screen text", "pinterest pin", "tiktok cover",
    "sticker pack", "cricut design", "sublimation graphic", "planner stickers",
    "logotype", "album cover text", "movie poster", "clip art",
    // new — ad/marketing/product-photography formats, for Graphics Mode's
    // standalone-graphic and commercial use cases (not just POD products)
    "instagram ad", "facebook ad", "tiktok ad graphic", "pinterest ad",
    "product photography/mockup (etsy/shopify listing)", "flyer", "print banner",
    "email graphic", "billboard ad",
    // Renamed from "background/wallpaper (no character, no text)" — that
    // parenthetical was a promise the tool couldn't actually keep in
    // Character/Couples/Combined Mode, which exist specifically to
    // describe a character regardless of this field. Hidden from those
    // 3 modes' own dropdown entirely (see PROJECT_TYPE_HIDDEN_FOR_MODES
    // below) rather than left selectable with a broken result.
    "background/wallpaper",
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
    "varsity jacket design": "designed for a varsity jacket back print",
    "tote bag graphic": "designed for print on a tote bag",
    "beauty packaging": "designed as beauty product packaging",
    "candle label": "designed as a candle label",
    "snack packaging": "designed as snack packaging",
    "skincare label": "designed as a skincare product label",
    "cosmetic branding": "designed as cosmetic brand packaging",
    "lock screen text": "composed as a phone lock screen wallpaper",
    "pinterest pin": "composed as a Pinterest pin graphic",
    "tiktok cover": "composed as a TikTok video cover image",
    "sticker pack": "designed as a die-cut sticker",
    "cricut design": "designed as a cut-ready craft design",
    "sublimation graphic": "designed as an all-over sublimation print",
    "planner stickers": "designed as a planner sticker sheet",
    "logotype": "composed as a standalone logotype",
    "album cover text": "composed as album cover artwork",
    "movie poster": "composed as a movie poster with title space",
    "clip art": "designed as simple standalone clip art",
    "instagram ad": "composed as an Instagram ad graphic",
    "facebook ad": "composed as a Facebook ad graphic",
    "tiktok ad graphic": "composed as a TikTok ad graphic",
    "pinterest ad": "composed as a Pinterest ad graphic",
    "product photography/mockup (etsy/shopify listing)": "composed as product photography for an online listing",
    "flyer": "composed as a promotional flyer layout",
    "print banner": "composed as a wide print banner",
    "email graphic": "composed as an email marketing graphic",
    "billboard ad": "composed as a billboard ad layout",
    "background/wallpaper": "composed as a standalone background/wallpaper scene, with no character or text",
  };

  // background/wallpaper's whole point is "no character" — a promise
  // Character/Couples/Combined Mode can never keep, since describing a
  // character is the entire job of those modes. Hidden from their Project
  // Type dropdown rather than offered with a result that contradicts it.
  var PROJECT_TYPE_HIDDEN_FOR_MODES = {
    "background/wallpaper": { character: true, couples: true, combined: true, family: true },
  };

  var ASPECT_RATIO_OPTIONS = ["1:1", "4:5", "9:16", "16:9"];

  // "ChatGPT/DALL·E" renamed to "ChatGPT (GPT Image)" — DALL-E 2/3 were
  // retired by OpenAI in May 2026, replaced by GPT Image 2 as ChatGPT's
  // built-in image model, so the old label was actively wrong, not just
  // dated.
  var TARGET_PLATFORM_OPTIONS = [
    "Midjourney", "ChatGPT (GPT Image)", "Kittl", "Ideogram", "OpenArt",
    "Leonardo AI", "Adobe Firefly", "Flux",
  ];

  // Holiday / Theme — shared across every mode (a theme applies just as
  // much to Text lettering or a Couples scene as to a Character portrait),
  // so it lives here rather than duplicated per mode. Grouped like
  // Character Type: browses better by category than as one flat wall.
  // Spans US federal/civic + religious/cultural observances rather than
  // skewing toward any single one. Split into its own dedicated widget —
  // Theme (life events/moods) and Niche (hobby/interest communities) used
  // to be lumped in here as a "Lifestyle, Hobbies & Niches" group, but
  // they're a different kind of choice than an actual calendar date, so
  // they're their own fields below instead.
  var HOLIDAY_GROUPS = [
    { label: "General", options: ["none"] },
    {
      label: "US Federal & Civic",
      options: [
        "new year's day", "martin luther king jr. day", "presidents' day", "memorial day",
        "juneteenth", "independence day (4th of july)", "labor day",
        "columbus day / indigenous peoples' day", "veterans day", "thanksgiving",
      ],
    },
    { label: "Christian", options: ["christmas", "christmas eve", "easter"] },
    { label: "Jewish", options: ["hanukkah", "passover", "rosh hashanah", "yom kippur"] },
    { label: "Islamic", options: ["ramadan", "eid al-fitr", "eid al-adha"] },
    { label: "Hindu / Dharmic", options: ["diwali", "holi"] },
    { label: "Latin American", options: ["cinco de mayo", "dia de los muertos (day of the dead)"] },
    { label: "East Asian", options: ["lunar new year"] },
    {
      label: "International / Regional",
      options: ["canada day", "bastille day", "boxing day", "oktoberfest", "australia day", "nowruz (persian new year)"],
    },
    {
      label: "Secular / Cultural",
      options: [
        "new year's eve", "valentine's day", "st. patrick's day", "halloween", "mother's day",
        "father's day", "grandparents' day", "pride month", "earth day", "kwanzaa",
      ],
    },
  ];

  // Theme — life events and moods, split out of the old "Lifestyle,
  // Hobbies & Niches" group. Distinct from Niche below: a theme is more of
  // an emotional/life-stage moment, a niche is an ongoing hobby/interest
  // community.
  var THEME_OPTIONS = PromptHaus.util.sortAlpha([
    "back to school", "graduation", "marriage/wedding/engagement", "parenting",
    "mental health awareness", "self love", "motivational/inspirational",
    // new — rounding out the theme list now that it's a standalone widget
    "new beginnings", "gratitude", "faith journey", "recovery/sobriety",
    "grief/loss", "empowerment",
  ]);

  // Niche — ongoing hobby/interest communities, the other half of the old
  // "Lifestyle, Hobbies & Niches" group.
  var NICHE_OPTIONS = PromptHaus.util.sortAlpha([
    "coffee culture", "wine culture", "work life", "hustle culture", "animal lover",
    "travel/adventure", "aviation/transportation",
    // new — rounding out the niche list now that it's a standalone widget
    "gaming culture", "fitness/gym life", "bookworm/reading", "gardening",
    "cooking/foodie", "crafting/diy", "sneakerhead", "car enthusiast",
  ]);

  // Imagery — shared across every mode, same rationale as Holiday / Theme:
  // a cross worked into the background or a dragonfly perched on a sleeve
  // applies just as much to a Text lettering design as a Character
  // portrait. Grouped like Character Type/Holiday: browses better by
  // category than as one flat wall. Faith-Based stays deliberately
  // multi-tradition (not skewed to one religion); Holiday imagery is kept
  // distinct from Holiday / Theme above — Theme sets the overall mood/season,
  // this is a literal object/symbol integrated into the image, so e.g.
  // "menorah" only lives here, not duplicated in both.
  // Split into 4 independent categories (rather than one flat grouped list)
  // with 2 widgets each, so the choices read cleaner and more obvious per
  // category instead of one long optgroup wall.
  var IMAGERY_CATEGORIES = [
    {
      key: "faithBased",
      label: "Faith-Based",
      options: PromptHaus.util.sortAlpha([
        "cross", "dove", "praying hands", "jesus (good shepherd)", "angel wings", "halo",
        "open bible", "rosary", "star of david", "hamsa", "mosque silhouette",
        "crescent moon and star", "prayer beads (misbaha)", "om symbol", "buddha statue",
        "prayer wheel", "diya (oil lamp)", "guardian angel", "yin yang",
      ]),
    },
    {
      key: "holiday",
      label: "Holiday/Celebrations",
      options: PromptHaus.util.sortAlpha([
        "christmas tree", "nativity scene", "santa claus", "rudolph the reindeer", "candy cane",
        "stocking", "gingerbread man", "snowman", "holly and mistletoe", "wreath", "ornament",
        "menorah", "dreidel", "kwanzaa kinara (candles)", "easter bunny", "easter eggs",
        "empty tomb", "easter lily", "cupid", "rose bouquet", "heart", "leprechaun",
        "four-leaf clover", "pot of gold", "jack-o'-lantern", "witch hat", "bat", "ghost",
        "turkey", "cornucopia", "diwali rangoli pattern", "red lantern (lunar new year)",
        "dragon (lunar new year)", "sugar skull", "marigold flowers",
        // new
        "birthday cake", "pinata", "wedding cake", "divorce cake", "party decorations",
        "fireworks", "streamers", "snowflakes", "flower bouquet", "wedding flowers",
      ]),
    },
    {
      key: "nature",
      label: "Nature",
      options: PromptHaus.util.sortAlpha([
        "pine tree", "oak tree", "palm tree", "willow tree", "cherry blossom tree",
        "autumn maple tree", "rose", "sunflower", "daisy", "lotus flower", "tulip", "peony",
        "hibiscus flower", "wildflower bouquet", "dragonfly", "butterfly", "ladybug", "bee",
        "firefly", "sun", "full moon", "stars", "rainbow", "northern lights", "mountain range",
        "ocean wave", "waterfall", "snowflake",
        // new
        "dandelion", "beach", "desert", "cactus", "lotus flowers", "sunset", "sunrise",
        "mountains", "lake", "forest", "city", "skyline",
      ]),
    },
    {
      key: "sciFi",
      label: "Sci-Fi",
      options: PromptHaus.util.sortAlpha([
        "nebula", "aurora borealis", "spaceship", "ufo", "alien", "robot", "android",
        "satellite", "space station", "asteroid", "comet", "circuit board pattern",
        "hologram", "laser beam", "planet with rings", "starfield", "black hole", "drone",
        "rocket", "meteor shower",
      ]),
    },
    {
      key: "fantasy",
      label: "Fantasy",
      options: PromptHaus.util.sortAlpha([
        "dragon", "unicorn", "phoenix", "castle", "wizard staff", "magic wand", "crystal ball",
        "fairy wings", "mermaid tail", "griffin", "pegasus", "sword and shield", "spellbook",
        "potion bottle", "enchanted forest", "floating islands", "magic portal",
        "treasure chest", "mystical runes",
      ]),
    },
    {
      key: "sports",
      label: "Sports & Activities",
      options: PromptHaus.util.sortAlpha([
        "baseball", "football", "basketball hoop", "soccer ball", "tennis racket",
        "golf club and ball", "hockey stick and puck", "volleyball", "swimming goggles",
        "track and field baton", "boxing gloves", "wrestling singlet", "cheerleading pom-poms",
        "softball", "lacrosse stick", "rugby ball", "cricket bat and ball",
        "badminton racket and shuttlecock", "bowling pin and ball", "surfboard",
      ]),
    },
    {
      // Branch emblems specifically (not generic military gear — that
      // already lives in Character's Outfit/Occupation Niche) — an
      // integrated symbol the same way a cross or a dove is, so it works
      // across every mode, not just Character's uniform options.
      key: "militaryPatriotic",
      label: "Military & Patriotic",
      options: PromptHaus.util.sortAlpha([
        "usmc eagle, globe, and anchor", "navy anchor", "navy seal trident",
        "army star insignia", "air force wings", "space force delta", "coast guard emblem",
        "purple heart medal", "folded flag triangle", "dog tags", "american flag", "bald eagle",
        "combat boots and helmet memorial",
        // new — broader US patriotic symbols, not just military-specific
        "liberty bell", "statue of liberty", "uncle sam", "capitol building",
        "mount rushmore", "fireworks", "great seal of the united states",
        "red, white, and blue bunting",
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

  // Mockup View — shared across every mode for the same reason as Holiday/
  // Theme/Buffer: which product/surface the design is shown on applies
  // just as much to a Character portrait or Graphics design as it does to
  // Text lettering, where this originally lived alone.
  var MOCKUP_VIEW_OPTIONS = PromptHaus.util.sortAlpha([
    "none", "on a black t-shirt", "on a white t-shirt", "on a black sweatshirt",
    "on a white sweatshirt", "large", "poster mockup", "candle mockup", "tote bag mockup",
    "tumbler mockup", "laptop mockup", "decal mockup", "onesie mockup", "fitted cap mockup",
    "trucker hat mockup", "phone case mockup", "shopping bag mockup", "perfume mockup",
    "ebook cover mockup", "billboard mockup", "storefront mockup", "sticker sheet mockup",
    "coffee mug mockup", "hat patch mockup", "notebook cover mockup",
  ]);

  // Filter — shared across every mode for the same reason as Holiday/
  // Mockup View: a photo-style post-processing look applies just as much
  // to a Character portrait or Graphics design as it does to a Reference
  // image recreation.
  var FILTER_OPTIONS = PromptHaus.util.sortAlpha([
    "none", "black and white", "sepia", "vintage film", "faded/washed out",
    "high contrast", "warm tone", "cool tone", "cross-process film", "duotone",
    "vignette", "grainy film analog", "technicolor vibrant", "infrared",
    "polaroid instant film", "hdr high dynamic range",
  ]);

  // Negative Prompt — shared across every mode, same reasoning as Holiday/
  // Filter/Mockup View: what to exclude applies to the whole generation,
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
    "varsity jacket design": "1:1",
    "tote bag graphic": "1:1",
    "beauty packaging": "4:5",
    "candle label": "1:1",
    "snack packaging": "4:5",
    "skincare label": "4:5",
    "cosmetic branding": "4:5",
    "lock screen text": "9:16",
    "pinterest pin": "4:5",
    "tiktok cover": "9:16",
    "sticker pack": "1:1",
    "cricut design": "1:1",
    "sublimation graphic": "1:1",
    "planner stickers": "1:1",
    "logotype": "1:1",
    "album cover text": "1:1",
    "movie poster": "4:5",
    "clip art": "1:1",
    "instagram ad": "4:5",
    "facebook ad": "1:1",
    "tiktok ad graphic": "9:16",
    "pinterest ad": "4:5",
    "product photography/mockup (etsy/shopify listing)": "1:1",
    "flyer": "4:5",
    "print banner": "16:9",
    "email graphic": "16:9",
    "billboard ad": "16:9",
    "background/wallpaper (no character, no text)": "9:16",
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
    projectType: PromptHaus.util.makeField(
      "t-shirt design",
      PromptHaus.util.sortAlpha(PROJECT_TYPE_OPTIONS),
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
    targetPlatform: PromptHaus.util.makeField("", PromptHaus.util.sortAlpha(TARGET_PLATFORM_OPTIONS)),
    // Shared across every mode (Character/Text/Couples/Combined) — how many
    // AI-generated variations the assembled prompt asks for.
    variationCount: PromptHaus.util.makeField("2", ["1", "2", "3", "4"]),
    holiday: PromptHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
    theme: PromptHaus.util.makeField("", THEME_OPTIONS),
    niche: PromptHaus.util.makeField("", NICHE_OPTIONS),
    // Shared across every mode — a plain boolean, not a dropdown field,
    // since it's just a yes/no checkbox ("add a buffer/padding around the
    // image so nothing gets cropped at the edges").
    addBuffer: DEFAULT_ADD_BUFFER,
    // 8 independent slots (2 per category) rather than one multi-select
    // box — same "combine by filling more than one slot" pattern as
    // Graphics Mode's What Is It section, so someone can layer e.g. a
    // cross + a dove + the sun without a new checkbox-list UI paradigm.
    imagery: buildInitialImageryState(),
    mockupView: PromptHaus.util.makeField("none", MOCKUP_VIEW_OPTIONS),
    filter: PromptHaus.util.makeField("none", FILTER_OPTIONS),
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

  function setAddBuffer(enabled) {
    store.setState({ addBuffer: enabled });
  }

  function setMockupView(newValue) {
    PromptHaus.util.updateField(store, "mockupView", { value: newValue });
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

  // mode is required (not optional) — a project type can be hidden from
  // one mode's own Project Type dropdown (background/wallpaper isn't
  // offered in Character/Couples/Combined) while still sitting in shared
  // state from a different tab. Passing mode lets this skip the phrase
  // there too, instead of injecting a "no character" instruction into a
  // prompt that's about to describe one anyway.
  function getProjectTypeEntry(mode) {
    var projectType = store.getState().projectType.value;
    var hiddenModes = PROJECT_TYPE_HIDDEN_FOR_MODES[projectType];
    if (hiddenModes && hiddenModes[mode]) return null;
    var phrase = PROJECT_TYPE_CONTEXT_PHRASES[projectType];
    if (!phrase) return null;
    return { label: "Project Type", field: PromptHaus.util.makeField(phrase) };
  }

  function isProjectTypeHiddenForMode(projectType, mode) {
    var hiddenModes = PROJECT_TYPE_HIDDEN_FOR_MODES[projectType];
    return !!(hiddenModes && hiddenModes[mode]);
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
    return { label: "Imagery", field: PromptHaus.util.makeField(text) };
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
  // fields — Holiday/Theme, Mockup View, and Imagery live here in shared
  // Style DNA instead, so they silently never got randomized or reset at
  // all. Each mode's randomize()/reset() calls these too now, so the whole
  // prompt (not just that mode's own section) responds to both buttons.
  // addBuffer is deliberately left out of randomizeContent() — it's a
  // technical production setting, not a creative dimension worth
  // randomizing — but resetContent() does put it back to its default.
  function randomizeContent() {
    var state = store.getState();
    if (state.holiday.includeInPrompt !== false) {
      var holidayOptions = state.holiday.options || [];
      if (holidayOptions.length) {
        setHoliday(holidayOptions[Math.floor(Math.random() * holidayOptions.length)]);
      }
    }
    if (state.theme.includeInPrompt !== false) {
      var themeOptions = state.theme.options || [];
      if (themeOptions.length) {
        setTheme(themeOptions[Math.floor(Math.random() * themeOptions.length)]);
      }
    }
    if (state.niche.includeInPrompt !== false) {
      var nicheOptions = state.niche.options || [];
      if (nicheOptions.length) {
        setNiche(nicheOptions[Math.floor(Math.random() * nicheOptions.length)]);
      }
    }
    if (state.mockupView.includeInPrompt !== false) {
      var mockupOptions = state.mockupView.options || [];
      if (mockupOptions.length) {
        setMockupView(mockupOptions[Math.floor(Math.random() * mockupOptions.length)]);
      }
    }
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

  // Scoped to just Holiday, Theme, Niche, Filter, and Imagery — Mockup
  // View, Buffer/Padding, and the rest of the dark Style DNA bar (Project
  // Type, Aspect Ratio, Target Platform, Variations) are deliberately left
  // alone on Reset, since those read as "how this prompt gets formatted/
  // output" rather than "creative content" the shopper wants cleared out.
  function resetContent() {
    store.setState({
      holiday: PromptHaus.util.makeGroupedField("", HOLIDAY_GROUPS),
      theme: PromptHaus.util.makeField("", THEME_OPTIONS),
      niche: PromptHaus.util.makeField("", NICHE_OPTIONS),
      filter: PromptHaus.util.makeField("none", FILTER_OPTIONS),
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
    setAddBuffer: setAddBuffer,
    getBufferEntry: getBufferEntry,
    getProjectTypeEntry: getProjectTypeEntry,
    isProjectTypeHiddenForMode: isProjectTypeHiddenForMode,
    setMockupView: setMockupView,
    setFilter: setFilter,
    updateFilterField: updateFilterField,
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
