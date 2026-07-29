/**
 * The AI Creator's Prompt Haus — Graphics Mode (standalone graphics/ads/
 * product visuals — distinct from full Character portraits)
 * Depends on prompt-builder-styledna.js, prompt-builder-engine.js, and
 * prompt-builder-character.js (reuses its option lists per the "single
 * source of truth" principle — see PromptHaus.character.optionLists).
 *
 * Four sections: What Is It (pick one core element — animal/pet, fantasy
 * element, prop, or cosplay/character, each with a quantity), Style It
 * (Illustrated reuses Character Type/Art Finish, or Realistic for ads/
 * product photography that shouldn't look cartoony), Frame It (reuses
 * Presentation fields), and Haute Details (the vanity-plate system).
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;
  var makeField = PromptHaus.util.makeField;
  var sortAlpha = PromptHaus.util.sortAlpha;
  var lists = PromptHaus.character.optionLists;

  // ---------------------------------------------------------------------
  // New option lists (not reused from Character)
  // ---------------------------------------------------------------------
  var REALISTIC_STYLE_OPTIONS = sortAlpha([
    "photorealistic product shot", "studio product photography", "lifestyle photography",
    "flat lay photography", "minimalist commercial photography", "bold graphic poster design",
    "clean vector flat design", "editorial fashion photography", "cinematic ad photography",
    "high-end commercial render",
  ]);

  // Deliberately spans both glam/feminine and rugged/masculine styles
  // across all 7 vanity-plate lists below — a vanity plate feature reads
  // as one-note if it only covers one aesthetic.
  var VANITY_PLATE_TYPE_OPTIONS = sortAlpha([
    "none", "iced diamond bling", "glam rhinestone", "luxe crystal", "pearl elegance",
    "rose gold sparkle", "holographic shimmer", "deluxe pink bling", "sapphire glam",
    "emerald luxe", "onyx bling", "opal shimmer", "frosted platinum", "amethyst glam",
    "ruby red bling", "citrine gold sparkle", "turquoise glam",
    // new — masculine-leaning
    "blacked-out matte", "gunmetal bling", "carbon fiber bling", "chrome skull bling",
    "iced-out chain style",
  ]);

  var BASE_STYLE_OPTIONS = sortAlpha([
    "oem bling plate", "diamond-studded frame", "crystal-encrusted frame", "chrome luxe frame",
    "rose gold frame", "gold-plated frame", "pink glam frame", "black diamond frame",
    "platinum frame", "fully iced frame", "sapphire frame", "emerald frame", "onyx frame",
    "opal frame", "two-tone frame", "matte black frame", "engraved vintage frame",
    "brushed titanium frame",
    // new — masculine-leaning
    "skull-accented frame", "chain-link frame", "carbon fiber frame", "gunmetal frame",
  ]);

  // Shared list for both Top Accent and Bottom Accent.
  var ACCENT_OPTIONS = sortAlpha([
    "none", "gem crown", "princess tiara", "queen's crown", "rhinestone bow", "butterfly charm",
    "angel wings", "sparkling heart", "classic tiara", "starburst shimmer", "glowing halo",
    "flower crown", "laurel wreath", "lightning bolt", "faith cross", "paw print",
    "shooting star", "infinity charm",
    // new — masculine-leaning
    "skull accent", "chain link accent", "flame accent", "dagger accent", "wolf head accent",
  ]);

  var PLATE_FINISH_OPTIONS = sortAlpha([
    "ivory enamel", "white enamel", "pearl white sheen", "satin white", "glossy white",
    "metallic silver", "glossy black", "rose gold metallic", "matte black",
    "champagne gold metallic", "copper metallic", "deep red enamel", "navy enamel", "mirror chrome",
    "gunmetal gray", "champagne pearl",
    // new — masculine-leaning
    "carbon fiber finish", "brushed steel finish", "black chrome finish",
  ]);

  var LETTER_STYLE_OPTIONS = sortAlpha([
    "tall condensed embossed", "raised block embossed", "deep luxe embossed", "chrome embossed",
    "matte black embossed", "elegant script embossed", "retro block embossed", "bold sans embossed",
    "flowing cursive embossed", "stencil-cut embossed", "engraved serif", "3d raised lettering",
    // new — masculine-leaning
    "gothic blackletter embossed", "military stencil embossed", "biker script embossed",
  ]);

  // Reused for both Letter Color and Plate Text Color — same kind of
  // choice (color of embossed/printed lettering), no need for two lists.
  var LETTER_COLOR_OPTIONS = sortAlpha([
    "black gloss", "chrome", "silver", "gold", "rose gold", "chrome pink", "white", "matte black",
    "copper", "gold champagne", "holographic", "chrome red", "navy blue", "emerald green",
    // new — masculine-leaning
    "gunmetal gray", "blood red",
  ]);

  // Grouped like Character Type/Holiday / Theme — ~65 items browses better
  // by region than as one flat wall. No literal "Custom" entry: every
  // field already has an "Or type your own..." override, so a dedicated
  // sentinel option would just duplicate that.
  var STATE_REGION_GROUPS = [
    {
      label: "US States & DC",
      options: [
        "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
        "delaware", "district of columbia", "florida", "georgia", "hawaii", "idaho", "illinois",
        "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts",
        "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada",
        "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota",
        "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina",
        "south dakota", "tennessee", "texas", "utah", "vermont", "virginia", "washington",
        "west virginia", "wisconsin", "wyoming",
      ],
    },
    {
      label: "US Territories",
      options: ["puerto rico", "guam", "us virgin islands", "american samoa", "northern mariana islands"],
    },
    {
      label: "International",
      options: [
        "canada", "england", "scotland", "wales", "northern ireland", "mexico", "australia",
        "jamaica", "india",
      ],
    },
  ];

  // Transportation — a category pick first (Air/Land/Military/Rail/Water,
  // as an icon toggle rather than one giant 45-item dropdown), which swaps
  // in that category's own short options list for Vehicle. Same "pick a
  // thing, reveal a color detail" pattern as Vanity Plate Type/Details
  // once a vehicle is chosen.
  var TRANSPORTATION_CATEGORY_OPTIONS = sortAlpha(["air", "land", "military", "rail", "water"]);
  var TRANSPORTATION_TYPES_BY_CATEGORY = {
    air: sortAlpha(["modern airplane", "old school airplane", "fighter jet", "helicopter", "private jet", "hot air balloon"]),
    rail: sortAlpha(["train", "freight train", "steam train"]),
    water: sortAlpha([
      "speed boat", "bass boat", "sail boat", "yacht", "cruise ship", "canoe", "pontoon",
      "kayak", "jet ski", "fishing boat", "houseboat",
    ]),
    land: sortAlpha([
      "sports car", "luxury car", "suv", "jeep", "modern truck", "old school truck",
      "convertible", "muscle car", "minivan", "golf cart", "chopper style motorcycle",
      "street bike style motorcycle", "moped", "bicycle", "dirt bike", "scooter",
    ]),
    military: sortAlpha([
      "humvee", "aav (amphibious assault vehicle)", "military jet", "military helicopter",
      "military ship", "tank", "military truck", "submarine", "armored personnel carrier",
    ]),
  };
  var TRANSPORTATION_COLOR_OPTIONS = sortAlpha([
    "black", "white", "red", "blue", "silver", "gray", "gold", "chrome", "matte black",
    "candy apple red", "racing green", "navy blue", "yellow", "orange", "camo/camouflage",
    "two-tone paint",
  ]);

  // Merges the old separate Fantasy Element and Character Archetype
  // (formerly Cosplay Character) fields into one "Characters & Creatures"
  // pick — both answer the same underlying question ("what being is
  // this"), so splitting them into two lists just made someone choose
  // between two dropdowns that meant the same thing. "none" dropped from
  // the merged list — like the other 4 categories, an empty/unselected
  // default now covers "not this one."
  var CHARACTERS_CREATURES_OPTIONS = sortAlpha(
    lists.fantasyElements.concat(lists.characterArchetype.filter(function (opt) { return opt !== "none"; }))
  );
  var NATURE_FLORALS_OPTIONS = sortAlpha([
    "rose", "sunflower", "daisy", "tulip", "peony", "lavender sprig", "eucalyptus leaves",
    "palm leaves", "cactus", "succulent", "wildflower bouquet", "cherry blossom branch",
    "ivy vines", "fern leaves", "lotus flower", "orchid",
  ]);
  var FOOD_DRINK_OPTIONS = sortAlpha([
    "donut", "cupcake", "ice cream cone", "pizza slice", "taco", "birthday cake",
    "croissant", "avocado toast", "watermelon slice", "strawberry", "macarons",
    "hot cocoa mug", "champagne glass", "gingerbread cookie", "candy cane",
  ]);
  var WHAT_IS_IT_LABELS = {
    animalPet: "Animal/Pet",
    charactersCreatures: "Character/Creature",
    natureFlorals: "Nature/Florals",
    foodDrink: "Food/Drink",
    props: "Object/Prop",
  };
  var FRAME_IT_LABELS = {
    background: "Background",
    dynamicSceneEffect: "Scene Effect",
    lightingEffects: "Lighting Effects",
    framing: "Framing",
  };
  // No separate Letter Color here — Plate Text Color (paired with Plate
  // Text below) already covers "what color is the lettering," and having
  // both read as two conflicting answers to the same question. No Border
  // Finish either — Base Style's own frame options already cover border/
  // trim treatment, so the two read as duplicate/conflicting answers about
  // the same visible edge.
  var HAUTE_DETAILS_LABELS = {
    baseStyle: "Base Style",
    plateFinish: "Plate Finish",
    letterStyle: "Letter Style",
    topAccent: "Top Accent",
    bottomAccent: "Bottom Accent",
    stateTheme: "State/Region Theme",
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  function buildInitialState() {
    return {
      whatIsIt: {
        animalPet: makeField("", lists.species, { quantity: 1 }),
        charactersCreatures: makeField("", CHARACTERS_CREATURES_OPTIONS, { quantity: 1 }),
        natureFlorals: makeField("", NATURE_FLORALS_OPTIONS, { quantity: 1 }),
        foodDrink: makeField("", FOOD_DRINK_OPTIONS, { quantity: 1 }),
        props: PromptHaus.util.makeGroupedField("", lists.propsGroups, { quantity: 1 }),
      },
      styleCategory: "illustrated",
      illustrated: {
        characterType: PromptHaus.util.makeGroupedField("", lists.characterTypeGroups),
        artFinish: PromptHaus.util.makeGroupedField("", lists.artFinishGroups),
      },
      realisticStyle: makeField("", REALISTIC_STYLE_OPTIONS),
      frameIt: {
        background: PromptHaus.util.makeGroupedField("", lists.backgroundGroups),
        dynamicSceneEffect: makeField("", lists.dynamicSceneEffect),
        // Defaulted like Character/Couples' own Lighting Effects — no
        // Pose/Camera Angle field exists here to match, so just this one.
        lightingEffects: makeField("studio lighting", lists.lightingEffects),
        framing: PromptHaus.util.makeGroupedField("no frame", lists.framingGroups),
      },
      haute: {
        vanityPlateType: makeField("none", VANITY_PLATE_TYPE_OPTIONS),
        details: {
          baseStyle: makeField("", BASE_STYLE_OPTIONS),
          topAccent: makeField("none", ACCENT_OPTIONS),
          bottomAccent: makeField("none", ACCENT_OPTIONS),
          plateFinish: makeField("", PLATE_FINISH_OPTIONS),
          letterStyle: makeField("", LETTER_STYLE_OPTIONS),
          stateTheme: PromptHaus.util.makeGroupedField("", STATE_REGION_GROUPS),
        },
        plateText: makeField("", [], { isFreeText: true }),
        plateTextColor: makeField("", LETTER_COLOR_OPTIONS),
      },
      transportation: {
        category: makeField("", TRANSPORTATION_CATEGORY_OPTIONS),
        type: makeField("", []),
        color: makeField("", TRANSPORTATION_COLOR_OPTIONS),
      },
    };
  }

  var store = PromptHaus.util.createStore(buildInitialState());

  function updateWhatIsItField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.whatIsIt[fieldName], changes);
    store.setState({ whatIsIt: Object.assign({}, state.whatIsIt, patch) });
  }

  function setWhatIsItQuantity(fieldName, quantity) {
    updateWhatIsItField(fieldName, { quantity: Math.max(1, quantity || 1) });
  }

  function setStyleCategory(category) {
    store.setState({ styleCategory: category });
  }

  function updateIllustratedField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.illustrated[fieldName], changes);
    store.setState({ illustrated: Object.assign({}, state.illustrated, patch) });
  }

  function updateRealisticStyle(changes) {
    var state = store.getState();
    store.setState({ realisticStyle: Object.assign({}, state.realisticStyle, changes) });
  }

  function updateFrameItField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.frameIt[fieldName], changes);
    store.setState({ frameIt: Object.assign({}, state.frameIt, patch) });
  }

  function updateVanityPlateType(changes) {
    var state = store.getState();
    store.setState({ haute: Object.assign({}, state.haute, { vanityPlateType: Object.assign({}, state.haute.vanityPlateType, changes) }) });
  }

  function updateHauteDetailField(fieldName, changes) {
    var state = store.getState();
    var patch = {};
    patch[fieldName] = Object.assign({}, state.haute.details[fieldName], changes);
    store.setState({ haute: Object.assign({}, state.haute, { details: Object.assign({}, state.haute.details, patch) }) });
  }

  function updatePlateText(changes) {
    var state = store.getState();
    store.setState({ haute: Object.assign({}, state.haute, { plateText: Object.assign({}, state.haute.plateText, changes) }) });
  }

  function updatePlateTextColor(changes) {
    var state = store.getState();
    store.setState({ haute: Object.assign({}, state.haute, { plateTextColor: Object.assign({}, state.haute.plateTextColor, changes) }) });
  }

  // Switching category swaps in that category's own Vehicle options and
  // clears whatever Vehicle/Color was picked before, since a Water color
  // choice, say, shouldn't linger once you've moved to Air.
  function updateTransportationCategory(changes) {
    var state = store.getState();
    var nextCategory = Object.assign({}, state.transportation.category, changes);
    var typeOptions = TRANSPORTATION_TYPES_BY_CATEGORY[nextCategory.value] || [];
    store.setState({
      transportation: {
        category: nextCategory,
        type: makeField("", typeOptions),
        color: makeField("", TRANSPORTATION_COLOR_OPTIONS),
      },
    });
  }

  function updateTransportationType(changes) {
    var state = store.getState();
    store.setState({ transportation: Object.assign({}, state.transportation, { type: Object.assign({}, state.transportation.type, changes) }) });
  }

  function updateTransportationColor(changes) {
    var state = store.getState();
    store.setState({ transportation: Object.assign({}, state.transportation, { color: Object.assign({}, state.transportation.color, changes) }) });
  }

  function getWhatIsItEntries() {
    var state = store.getState();
    return Object.keys(WHAT_IS_IT_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: WHAT_IS_IT_LABELS[fieldName], field: state.whatIsIt[fieldName] };
    });
  }

  function getFrameItEntries() {
    var state = store.getState();
    return Object.keys(FRAME_IT_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: FRAME_IT_LABELS[fieldName], field: state.frameIt[fieldName] };
    });
  }

  function getHauteDetailEntries() {
    var state = store.getState();
    return Object.keys(HAUTE_DETAILS_LABELS).map(function (fieldName) {
      return { fieldName: fieldName, label: HAUTE_DETAILS_LABELS[fieldName], field: state.haute.details[fieldName] };
    });
  }

  // A quantity > 1 prefixes the resolved value ("3x sparkles") rather than
  // attempting real pluralization, since option phrases are a mix of
  // already-singular/plural nouns that don't pluralize consistently with
  // a simple "+s".
  function composeWhatIsItEntry(entry) {
    var resolved = PromptHaus.engine.resolveFieldValue(entry.field);
    if (!resolved) return null;
    var qty = entry.field.quantity || 1;
    var text = qty > 1 ? qty + "x " + resolved : resolved;
    return { label: entry.label, field: makeField(text) };
  }

  function buildPlateTextEntry() {
    var haute = store.getState().haute;
    var text = (haute.plateText.value || "").trim();
    if (!text || haute.plateText.includeInPrompt === false) return null;
    var color = PromptHaus.engine.resolveFieldValue(haute.plateTextColor);
    var phrase = color ? 'plate text "' + text + '" in ' + color + " lettering" : 'plate text "' + text + '"';
    return { label: "Plate Text", field: makeField(phrase) };
  }

  function buildWhatIsItComposedEntries() {
    var entries = [];
    getWhatIsItEntries().forEach(function (e) {
      var composed = composeWhatIsItEntry(e);
      if (composed) entries.push(composed);
    });
    return entries;
  }

  // Character Type/Art Finish carry a full descriptive paragraph rather
  // than a short label at assembly time — this function only feeds
  // buildOwnEntries()/buildEntriesForCombined() (both assembly-time), never
  // the UI renderer, which reads state.illustrated.characterType/artFinish
  // directly and needs the short label to match its <select> options.
  function buildStyleItEntries() {
    var state = store.getState();
    if (state.styleCategory === "realistic") {
      return [{ label: "Style", field: state.realisticStyle }];
    }
    return [
      { label: "Character Type", field: PromptHaus.engine.withPromptLookup(state.illustrated.characterType, lists.characterTypePrompts) },
      { label: "Art Finish", field: PromptHaus.engine.withPromptLookup(state.illustrated.artFinish, lists.artFinishPrompts) },
    ];
  }

  function buildVanityPlateEntries() {
    var state = store.getState();
    var entries = [{ label: "Vanity Plate Type", field: state.haute.vanityPlateType }];
    var vanityPlateOn = PromptHaus.engine.resolveFieldValue(state.haute.vanityPlateType);
    if (vanityPlateOn) {
      entries = entries.concat(getHauteDetailEntries().map(function (e) {
        return { label: e.label, field: e.field };
      }));
      var plateTextEntry = buildPlateTextEntry();
      if (plateTextEntry) entries.push(plateTextEntry);
    }
    return entries;
  }

  function buildTransportationEntries() {
    var state = store.getState();
    var entries = [{ label: "Transportation", field: state.transportation.type }];
    var transportationOn = PromptHaus.engine.resolveFieldValue(state.transportation.type);
    if (transportationOn) {
      entries.push({ label: "Transportation Color", field: state.transportation.color });
    }
    return entries;
  }

  // Graphics' own descriptors only — no shared Style DNA (Holiday/Mockup/
  // Imagery/Buffer). Split out from buildEntries() so Combined Mode's
  // unified assembler can pull just these without pulling in the shared DNA
  // fields a second (or third) time.
  function buildOwnEntries() {
    var entries = buildWhatIsItComposedEntries();
    entries = entries.concat(getFrameItEntries().map(function (e) {
      return { label: e.label, field: e.field };
    }));
    entries = entries.concat(buildVanityPlateEntries());
    entries = entries.concat(buildTransportationEntries());
    return entries;
  }

  // Combined Mode's Graphics contribution — just Style It (the one overall
  // style choice, rendered at the top of Combined) + Custom Vanity Plates +
  // Transportation. No What Is It (Character's own Identity/Companion
  // covers "who/what is depicted") and no Frame It (Character's own
  // Presentation covers background/lighting/framing for the whole scene).
  function buildEntriesForCombined() {
    return buildStyleItEntries().concat(buildVanityPlateEntries()).concat(buildTransportationEntries());
  }

  function buildEntries() {
    var entries = buildOwnEntries();
    entries.push({ label: "Holiday", field: PromptHaus.styleDNA.getState().holiday });
    entries.push({ label: "Creative Theme", field: PromptHaus.styleDNA.getState().theme });
    entries.push({ label: "Niche", field: PromptHaus.styleDNA.getState().niche });
    entries.push({ label: "Target Audience", field: PromptHaus.styleDNA.getState().targetAudience });
    entries.push({ label: "Mood", field: PromptHaus.styleDNA.getState().mood });
    entries.push({ label: "Filter It", field: PromptHaus.styleDNA.getState().filter });
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    entries = entries.concat(PromptHaus.brandKit.getActiveKitEntries());
    var projectTypeEntry = PromptHaus.styleDNA.getProjectTypeEntry("graphics");
    if (projectTypeEntry) entries.push(projectTypeEntry);
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);
    return entries;
  }

  // Character Type/Art Finish carry a full descriptive paragraph (chunk 3)
  // rather than a short word — previously buildOwnEntries() folded them
  // into the same flat comma list as What Is It/Frame It/shared Style DNA,
  // which reads as disconnected/wonky when a multi-sentence paragraph sits
  // in the middle of a list of short phrases. Pulled into their own intro
  // sentences instead, mirroring Character Mode's placement.
  function assemblePrompt() {
    var styleResolved = PromptHaus.engine.resolveFields(buildStyleItEntries());
    var introParts = ["Create a clean, professional graphic."];
    styleResolved.forEach(function (r) {
      var prefix = r.label === "Character Type" ? "Illustration style" : r.label === "Art Finish" ? "Art finish" : r.label;
      introParts.push(prefix + ": " + r.value + (/[.!?]$/.test(r.value) ? "" : "."));
    });
    var intro = introParts.join(" ") + " Featuring a";
    return PromptHaus.engine.buildSentence({ intro: intro, fieldEntries: buildEntries() });
  }

  function getSelectionsByGroup() {
    var groups = [];

    var whatIsItResolved = [];
    getWhatIsItEntries().forEach(function (e) {
      var composed = composeWhatIsItEntry(e);
      if (composed) whatIsItResolved.push({ label: composed.label, value: PromptHaus.engine.resolveFieldValue(composed.field) });
    });
    if (whatIsItResolved.length) groups.push({ title: "What Is It", items: whatIsItResolved });

    var state = store.getState();
    var styleEntries = state.styleCategory === "realistic"
      ? [{ label: "Style", field: state.realisticStyle }]
      : [{ label: "Character Type", field: state.illustrated.characterType }, { label: "Art Finish", field: state.illustrated.artFinish }];
    var styleResolved = PromptHaus.engine.resolveFields(styleEntries);
    if (styleResolved.length) groups.push({ title: "Style It", items: styleResolved });

    var frameResolved = PromptHaus.engine.resolveFields(getFrameItEntries().map(function (e) {
      return { label: e.label, field: e.field };
    }));
    if (frameResolved.length) groups.push({ title: "Frame It", items: frameResolved });

    var hauteEntries = [{ label: "Vanity Plate Type", field: state.haute.vanityPlateType }];
    if (PromptHaus.engine.resolveFieldValue(state.haute.vanityPlateType)) {
      hauteEntries = hauteEntries.concat(getHauteDetailEntries().map(function (e) {
        return { label: e.label, field: e.field };
      }));
    }
    var hauteResolved = PromptHaus.engine.resolveFields(hauteEntries);
    var plateTextEntry = buildPlateTextEntry();
    if (plateTextEntry) hauteResolved.push({ label: plateTextEntry.label, value: PromptHaus.engine.resolveFieldValue(plateTextEntry.field) });
    if (hauteResolved.length) groups.push({ title: "Custom Vanity Plates", items: hauteResolved });

    var transportEntries = [{ label: "Transportation", field: state.transportation.type }];
    if (PromptHaus.engine.resolveFieldValue(state.transportation.type)) {
      transportEntries.push({ label: "Transportation Color", field: state.transportation.color });
    }
    var transportResolved = PromptHaus.engine.resolveFields(transportEntries);
    if (transportResolved.length) groups.push({ title: "Transportation", items: transportResolved });

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

    return groups;
  }

  // Combined Mode's "Your Selections" panel mirrors buildEntriesForCombined
  // — drop What Is It/Frame It so the summary never shows a value that got
  // silently excluded from the assembled prompt.
  function getSelectionsByGroupForCombined() {
    return getSelectionsByGroup().filter(function (g) {
      return g.title !== "What Is It" && g.title !== "Frame It";
    });
  }

  function randomizeFieldList(entries, updateFn) {
    entries.forEach(function (e) {
      if (!e.field.includeInPrompt) return;
      var options = e.field.options || [];
      if (!options.length) return;
      var randomValue = options[Math.floor(Math.random() * options.length)];
      updateFn(e.fieldName, { value: randomValue, customValue: "" });
    });
  }

  function randomize() {
    randomizeFieldList(getWhatIsItEntries(), updateWhatIsItField);
    var state = store.getState();
    if (state.styleCategory === "realistic") {
      if (state.realisticStyle.includeInPrompt && state.realisticStyle.options.length) {
        updateRealisticStyle({
          value: state.realisticStyle.options[Math.floor(Math.random() * state.realisticStyle.options.length)],
          customValue: "",
        });
      }
    } else {
      randomizeFieldList(
        [
          { fieldName: "characterType", field: state.illustrated.characterType },
          { fieldName: "artFinish", field: state.illustrated.artFinish },
        ],
        updateIllustratedField
      );
    }
    randomizeFieldList(getFrameItEntries(), updateFrameItField);
    randomizeFieldList([{ fieldName: "vanityPlateType", field: state.haute.vanityPlateType }], function (_, changes) {
      updateVanityPlateType(changes);
    });
    if (PromptHaus.engine.resolveFieldValue(store.getState().haute.vanityPlateType)) {
      randomizeFieldList(getHauteDetailEntries(), updateHauteDetailField);
    }
    updateTransportationCategory({
      value: TRANSPORTATION_CATEGORY_OPTIONS[Math.floor(Math.random() * TRANSPORTATION_CATEGORY_OPTIONS.length)],
    });
    randomizeFieldList([{ fieldName: "type", field: store.getState().transportation.type }], function (_, changes) {
      updateTransportationType(changes);
    });
    if (PromptHaus.engine.resolveFieldValue(store.getState().transportation.type)) {
      randomizeFieldList([{ fieldName: "color", field: store.getState().transportation.color }], function (_, changes) {
        updateTransportationColor(changes);
      });
    }
    PromptHaus.styleDNA.randomizeContent();
  }

  function reset() {
    store.setState(buildInitialState());
    PromptHaus.styleDNA.resetContent();
  }

  // ---------------------------------------------------------------------
  // Starter Presets — two of these also set shared Style DNA (Holiday/
  // Theme, Imagery), which is intentional: a "Coffee Lover" or "Faith-
  // Based" starting point should carry that theme into whichever other
  // mode the shopper switches to next, same as picking it manually would.
  // ---------------------------------------------------------------------
  var PRESETS = [
    {
      id: "vanityPlateBling",
      name: "Vanity Plate Bling",
      description: "Diamond bling plate, diamond-studded frame, chrome lettering.",
      apply: function () {
        updateVanityPlateType({ value: "iced diamond bling", customValue: "" });
        updateHauteDetailField("baseStyle", { value: "diamond-studded frame", customValue: "" });
        updateHauteDetailField("plateFinish", { value: "pearl white sheen", customValue: "" });
        updatePlateTextColor({ value: "chrome", customValue: "" });
      },
    },
    {
      id: "faithBasedGraphic",
      name: "Faith-Based Graphic",
      description: "Illustrated style, dreamy cloud backdrop, cross worked into the imagery.",
      apply: function () {
        setStyleCategory("illustrated");
        updateFrameItField("background", { value: "dreamy cloud scene", customValue: "" });
        updateFrameItField("lightingEffects", { value: "soft diffused light", customValue: "" });
        PromptHaus.styleDNA.updateImagerySlot("faithBased1", { value: "cross", customValue: "" });
      },
    },
    {
      id: "coffeeLoverGraphic",
      name: "Coffee Lover Graphic",
      description: "Realistic clean vector design, coffee cup prop, Coffee Culture theme.",
      apply: function () {
        setStyleCategory("realistic");
        updateRealisticStyle({ value: "clean vector flat design", customValue: "" });
        updateWhatIsItField("props", { value: "coffee cup", customValue: "" });
        setWhatIsItQuantity("props", 1);
        PromptHaus.styleDNA.setHoliday("coffee culture");
      },
    },
    {
      id: "aviationTravelGraphic",
      name: "Aviation/Travel Graphic",
      description: "Air transportation category, Travel/Adventure theme.",
      apply: function () {
        updateTransportationCategory({ value: "air" });
        PromptHaus.styleDNA.setHoliday("travel/adventure");
      },
    },
  ];

  PromptHaus.graphics = Object.assign({}, store, {
    presets: PRESETS,
    updateWhatIsItField: updateWhatIsItField,
    setWhatIsItQuantity: setWhatIsItQuantity,
    setStyleCategory: setStyleCategory,
    updateIllustratedField: updateIllustratedField,
    updateRealisticStyle: updateRealisticStyle,
    updateFrameItField: updateFrameItField,
    updateVanityPlateType: updateVanityPlateType,
    updateHauteDetailField: updateHauteDetailField,
    updatePlateText: updatePlateText,
    updatePlateTextColor: updatePlateTextColor,
    updateTransportationCategory: updateTransportationCategory,
    updateTransportationType: updateTransportationType,
    updateTransportationColor: updateTransportationColor,
    getWhatIsItEntries: getWhatIsItEntries,
    getFrameItEntries: getFrameItEntries,
    getHauteDetailEntries: getHauteDetailEntries,
    buildOwnEntries: buildOwnEntries,
    buildEntriesForCombined: buildEntriesForCombined,
    buildStyleItEntries: buildStyleItEntries,
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    getSelectionsByGroupForCombined: getSelectionsByGroupForCombined,
    randomize: randomize,
    reset: reset,
    labels: {
      whatIsIt: WHAT_IS_IT_LABELS,
      frameIt: FRAME_IT_LABELS,
      hauteDetails: HAUTE_DETAILS_LABELS,
    },
  });
})();
