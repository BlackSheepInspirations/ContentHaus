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

  var VANITY_PLATE_TYPE_OPTIONS = sortAlpha([
    "none", "iced diamond bling", "glam rhinestone", "luxe crystal", "pearl elegance",
    "rose gold sparkle", "holographic shimmer", "deluxe pink bling", "sapphire glam",
    "emerald luxe", "onyx bling", "opal shimmer", "frosted platinum", "amethyst glam",
    // new
    "ruby red bling", "citrine gold sparkle", "turquoise glam",
  ]);

  var BASE_STYLE_OPTIONS = sortAlpha([
    "oem bling plate", "diamond-studded frame", "crystal-encrusted frame", "chrome luxe frame",
    "rose gold frame", "gold-plated frame", "pink glam frame", "black diamond frame",
    "platinum frame", "fully iced frame", "sapphire frame", "emerald frame", "onyx frame",
    "opal frame", "two-tone frame", "matte black frame",
    // new
    "engraved vintage frame", "brushed titanium frame",
  ]);

  var BORDER_FINISH_OPTIONS = sortAlpha([
    "silver crystal trim", "pink crystal trim", "rose gold crystal", "gold crystal trim",
    "champagne crystal", "black diamond trim", "iridescent crystal", "aurora crystal (ab)",
    "mixed jewel trim", "diamond dust shimmer", "emerald crystal", "sapphire crystal",
    "ruby crystal", "amethyst crystal", "opal shimmer trim", "frosted crystal",
    // new
    "smoky quartz trim", "moonstone shimmer",
  ]);

  // Shared list for both Top Accent and Bottom Accent.
  var ACCENT_OPTIONS = sortAlpha([
    "none", "gem crown", "princess tiara", "queen's crown", "rhinestone bow", "butterfly charm",
    "angel wings", "sparkling heart", "classic tiara", "starburst shimmer", "glowing halo",
    "flower crown", "laurel wreath", "lightning bolt", "faith cross", "paw print",
    // new
    "shooting star", "infinity charm",
  ]);

  var PLATE_FINISH_OPTIONS = sortAlpha([
    "ivory enamel", "white enamel", "pearl white sheen", "satin white", "glossy white",
    "metallic silver", "glossy black", "rose gold metallic", "matte black",
    "champagne gold metallic", "copper metallic", "deep red enamel", "navy enamel", "mirror chrome",
    // new
    "gunmetal gray", "champagne pearl",
  ]);

  var LETTER_STYLE_OPTIONS = sortAlpha([
    "tall condensed embossed", "raised block embossed", "deep luxe embossed", "chrome embossed",
    "matte black embossed", "elegant script embossed", "retro block embossed", "bold sans embossed",
    "flowing cursive embossed", "stencil-cut embossed",
    // new
    "engraved serif", "3d raised lettering",
  ]);

  // Reused for both Letter Color and Plate Text Color — same kind of
  // choice (color of embossed/printed lettering), no need for two lists.
  var LETTER_COLOR_OPTIONS = sortAlpha([
    "black gloss", "chrome", "silver", "gold", "rose gold", "chrome pink", "white", "matte black",
    "copper", "gold champagne", "holographic", "chrome red",
    // new
    "navy blue", "emerald green",
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

  var WHAT_IS_IT_LABELS = {
    animalPet: "Animal/Pet",
    fantasyElements: "Fantasy Element",
    props: "Prop",
    cosplayCharacter: "Cosplay/Character",
  };
  var FRAME_IT_LABELS = {
    background: "Background",
    dynamicSceneEffect: "Dynamic Scene Effect",
    lightingEffects: "Lighting Effects",
    framing: "Framing",
  };
  var HAUTE_DETAILS_LABELS = {
    baseStyle: "Base Style",
    borderFinish: "Border Finish",
    topAccent: "Top Accent",
    bottomAccent: "Bottom Accent",
    plateFinish: "Plate Finish",
    letterStyle: "Letter Style",
    letterColor: "Letter Color",
    stateTheme: "State/Region Theme",
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  function buildInitialState() {
    return {
      whatIsIt: {
        animalPet: makeField("", lists.species, { quantity: 1 }),
        fantasyElements: makeField("", lists.fantasyElements, { quantity: 1 }),
        props: makeField("", lists.props, { quantity: 1 }),
        cosplayCharacter: makeField("none", lists.cosplayCharacter, { quantity: 1 }),
      },
      styleCategory: "illustrated",
      illustrated: {
        characterType: PromptHaus.util.makeGroupedField("", lists.characterTypeGroups),
        artFinish: makeField("", lists.artFinish),
      },
      realisticStyle: makeField("", REALISTIC_STYLE_OPTIONS),
      frameIt: {
        background: makeField("", lists.background),
        dynamicSceneEffect: makeField("", lists.dynamicSceneEffect),
        lightingEffects: makeField("", lists.lightingEffects),
        framing: makeField("no frame", lists.framing),
      },
      haute: {
        vanityPlateType: makeField("none", VANITY_PLATE_TYPE_OPTIONS),
        details: {
          baseStyle: makeField("", BASE_STYLE_OPTIONS),
          borderFinish: makeField("", BORDER_FINISH_OPTIONS),
          topAccent: makeField("none", ACCENT_OPTIONS),
          bottomAccent: makeField("none", ACCENT_OPTIONS),
          plateFinish: makeField("", PLATE_FINISH_OPTIONS),
          letterStyle: makeField("", LETTER_STYLE_OPTIONS),
          letterColor: makeField("", LETTER_COLOR_OPTIONS),
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

  function buildEntries() {
    var state = store.getState();
    var entries = [];

    getWhatIsItEntries().forEach(function (e) {
      var composed = composeWhatIsItEntry(e);
      if (composed) entries.push(composed);
    });

    if (state.styleCategory === "realistic") {
      entries.push({ label: "Style", field: state.realisticStyle });
    } else {
      entries.push({ label: "Character Type", field: state.illustrated.characterType });
      entries.push({ label: "Art Finish", field: state.illustrated.artFinish });
    }

    entries = entries.concat(getFrameItEntries().map(function (e) {
      return { label: e.label, field: e.field };
    }));

    entries.push({ label: "Vanity Plate Type", field: state.haute.vanityPlateType });
    var vanityPlateOn = PromptHaus.engine.resolveFieldValue(state.haute.vanityPlateType);
    if (vanityPlateOn) {
      entries = entries.concat(getHauteDetailEntries().map(function (e) {
        return { label: e.label, field: e.field };
      }));
      var plateTextEntry = buildPlateTextEntry();
      if (plateTextEntry) entries.push(plateTextEntry);
    }

    entries.push({ label: "Transportation", field: state.transportation.type });
    var transportationOn = PromptHaus.engine.resolveFieldValue(state.transportation.type);
    if (transportationOn) {
      entries.push({ label: "Transportation Color", field: state.transportation.color });
    }

    entries.push({ label: "Holiday / Theme", field: PromptHaus.styleDNA.getState().holiday });
    entries = entries.concat(PromptHaus.styleDNA.getImageryEntries());
    var bufferEntry = PromptHaus.styleDNA.getBufferEntry();
    if (bufferEntry) entries.push(bufferEntry);

    return entries;
  }

  function assemblePrompt() {
    var count = parseInt(PromptHaus.styleDNA.getState().variationCount.value, 10) || 4;
    var intro = "Create " + count + (count === 1 ? " variation" : " variations") +
      " of a clean, professional graphic featuring a";
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
    if (hauteResolved.length) groups.push({ title: "Haute Details", items: hauteResolved });

    var transportEntries = [{ label: "Transportation", field: state.transportation.type }];
    if (PromptHaus.engine.resolveFieldValue(state.transportation.type)) {
      transportEntries.push({ label: "Transportation Color", field: state.transportation.color });
    }
    var transportResolved = PromptHaus.engine.resolveFields(transportEntries);
    if (transportResolved.length) groups.push({ title: "Transportation", items: transportResolved });

    var holidayResolved = PromptHaus.engine.resolveFields([
      { label: "Holiday / Theme", field: PromptHaus.styleDNA.getState().holiday },
    ]);
    if (holidayResolved.length) groups.push({ title: "Holiday / Theme", items: holidayResolved });

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
    if (bufferEntry) groups.push({ title: "Buffer/Padding", items: [{ label: bufferEntry.label, value: bufferEntry.field.value }] });

    return groups;
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
  }

  function reset() {
    store.setState(buildInitialState());
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
      description: "Diamond bling plate, luxury diamond frame, chrome lettering.",
      apply: function () {
        updateVanityPlateType({ value: "diamond bling", customValue: "" });
        updateHauteDetailField("baseStyle", { value: "luxury diamond frame", customValue: "" });
        updateHauteDetailField("plateFinish", { value: "pearl white", customValue: "" });
        updateHauteDetailField("letterColor", { value: "chrome", customValue: "" });
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
        PromptHaus.styleDNA.updateImagerySlot("slot1", { value: "cross", customValue: "" });
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
    assemblePrompt: assemblePrompt,
    getSelectionsByGroup: getSelectionsByGroup,
    randomize: randomize,
    reset: reset,
    labels: {
      whatIsIt: WHAT_IS_IT_LABELS,
      frameIt: FRAME_IT_LABELS,
      hauteDetails: HAUTE_DETAILS_LABELS,
    },
  });
})();
