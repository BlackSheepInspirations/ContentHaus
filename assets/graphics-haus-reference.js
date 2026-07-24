/**
 * The AI Creator's Graphics Haus — Image/Prompt Reference
 * Depends on graphics-haus-util.js, graphics-haus-engine.js,
 * graphics-haus-styledna.js — all must load first.
 *
 * Verbatim port (adapted to a graphic instead of a character) of Content
 * Haus's own Image/Prompt Reference mode (prompt-builder-reference.js):
 * reference either an uploaded image (+ a typed description) or a pasted
 * prompt found elsewhere, then reimagine it in a new style — same
 * anti-plagiarism-worded intro, same "Regenerate a couple of things,
 * keep my source text" mechanic, distinct from a full Randomize.
 *
 * Reimagined Style reuses the Graphics Studio Generator's own Art Style
 * catalog (graphics-haus-generators-graphicsstudio.js) rather than a new
 * one being authored — per the owner's own call, duplicated here as a
 * flat constant (not imported) so this file has no load-order dependency
 * on that specific generator file.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;
  var makeField = GraphicsHaus.util.makeField;
  var createStore = GraphicsHaus.util.createStore;
  var resolveFieldValue = GraphicsHaus.engine.resolveFieldValue;

  var REIMAGINED_STYLE_OPTIONS = [
    "cartoon style illustration", "glossy 3d chibi", "storybook gouache illustration",
    "flat vector illustration", "realistic human illustration", "retro comic pop art",
    "collectible figurine illustration", "coloring book illustration",
    "photorealistic product shot", "studio product photography", "lifestyle photography",
    "bold graphic poster design", "clean vector flat design", "cinematic ad photography",
  ].sort();

  var BACKGROUND_OPTIONS = [
    "transparent background png", "solid white background", "soft pastel gradient",
    "sparkly confetti effect", "starry night sky", "sunset skyline", "seamless white studio backdrop",
  ].sort();

  var SCENE_EFFECT_OPTIONS = [
    "None — No Extra Effect", "floating in clouds", "surrounded by sparkles",
    "falling autumn leaves", "falling snow", "magical mist",
  ];

  var REGENERATE_POOL = ["reimaginedStyle", "background", "sceneEffect"];
  var REGENERATE_CAP = 2;

  function buildInitialState() {
    return {
      sourceType: "image",
      image: null,
      imageName: "",
      description: makeField("", [], { isFreeText: true }),
      promptReference: makeField("", [], { isFreeText: true }),
      reimaginedStyle: makeField("", REIMAGINED_STYLE_OPTIONS),
      background: makeField(BACKGROUND_OPTIONS[0], BACKGROUND_OPTIONS),
      sceneEffect: makeField(SCENE_EFFECT_OPTIONS[0], SCENE_EFFECT_OPTIONS),
    };
  }

  var store = createStore(buildInitialState());

  function setSourceType(type) {
    store.setState({ sourceType: type === "prompt" ? "prompt" : "image" });
  }
  function updateDescription(changes) {
    store.setState({ description: Object.assign({}, store.getState().description, changes) });
  }
  function updatePromptReference(changes) {
    store.setState({ promptReference: Object.assign({}, store.getState().promptReference, changes) });
  }
  function updateField(fieldName, changes) {
    var patch = {};
    patch[fieldName] = Object.assign({}, store.getState()[fieldName], changes);
    store.setState(patch);
  }
  function setImage(dataUrl, name) {
    store.setState({ image: dataUrl, imageName: name || "" });
  }
  function clearImage() {
    store.setState({ image: null, imageName: "" });
  }

  function activeSourceText() {
    var state = store.getState();
    return (state.sourceType === "prompt" ? state.promptReference.value : state.description.value || "").trim();
  }

  function assemblePrompt() {
    var state = store.getState();
    var sourceType = state.sourceType;
    var sourceText = activeSourceText();
    var reimaginedStyle = resolveFieldValue(state.reimaginedStyle);

    var introParts = [];
    if (sourceType === "prompt") {
      introParts.push(sourceText ? "Create a graphic inspired by the following prompt, reimagined as an original composition." : "Create a graphic of an original composition.");
      if (reimaginedStyle) introParts.push("Style: " + reimaginedStyle + ".");
      if (sourceText) introParts.push("Use the prompt only as loose creative direction for subject and composition; do not reuse its exact wording, and produce an original result, not a copy:");
    } else {
      introParts.push(sourceText ? "Create a graphic reinterpreting the following description as an original illustration." : "Create a graphic of an original subject.");
      if (reimaginedStyle) introParts.push("Style: " + reimaginedStyle + ".");
      if (sourceText) introParts.push("Replace any photographic, camera, or realistic-photo qualities in the description with that style, keeping only the subject and composition it describes:");
    }
    var intro = introParts.join(" ");

    var entries = [];
    if (sourceText) entries.push({ label: sourceType === "prompt" ? "Reference Prompt" : "Reference Description", field: makeField(sourceText) });
    entries.push({ label: "Background", field: state.background });
    var sceneEffectValue = resolveFieldValue(state.sceneEffect);
    if (sceneEffectValue && sceneEffectValue.indexOf("None") !== 0) entries.push({ label: "Scene Effect", field: makeField(sceneEffectValue) });
    var holidayValue = resolveFieldValue(GraphicsHaus.styleDNA.getState().holiday);
    if (holidayValue) entries.push({ label: "Holiday", field: makeField("with a festive " + holidayValue + " theme") });

    var outro = "Clean commercial-quality graphic, crisp clean edges, high resolution, no watermarks.";
    return GraphicsHaus.engine.buildSentence({ intro: intro, fieldEntries: entries, outro: outro });
  }

  function getSelectionsByGroup() {
    var state = store.getState();
    var sourceText = activeSourceText();
    var items = [];
    if (sourceText) items.push({ label: state.sourceType === "prompt" ? "Reference Prompt" : "Reference Description", value: sourceText });
    if (state.sourceType === "image" && state.imageName) items.push({ label: "Uploaded Image", value: state.imageName });
    var style = resolveFieldValue(state.reimaginedStyle);
    if (style) items.push({ label: "Reimagined Style", value: style });
    var background = resolveFieldValue(state.background);
    if (background) items.push({ label: "Background", value: background });
    var sceneEffect = resolveFieldValue(state.sceneEffect);
    if (sceneEffect) items.push({ label: "Scene Effect", value: sceneEffect });
    return items.length ? [{ title: "Image/Prompt Reference", items: items }] : [];
  }

  // Rerolls up to REGENERATE_CAP of the 3 pooled fields to a fresh random
  // option, clears the rest — a quick "give me another take" that never
  // touches the source text/image, distinct from a full Randomize.
  function regenerate() {
    var state = store.getState();
    var eligible = REGENERATE_POOL.filter(function (name) { return (state[name].options || []).length > 0; });
    var shuffled = eligible.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
    }
    var chosen = shuffled.slice(0, REGENERATE_CAP);
    var patch = {};
    eligible.forEach(function (name) {
      var field = state[name];
      if (chosen.indexOf(name) !== -1) {
        var options = field.options;
        patch[name] = Object.assign({}, field, { value: options[Math.floor(Math.random() * options.length)], customValue: "" });
      } else {
        patch[name] = Object.assign({}, field, { value: "", customValue: "" });
      }
    });
    store.setState(patch);
  }

  function randomize() {
    var state = store.getState();
    var patch = {};
    ["reimaginedStyle", "background", "sceneEffect"].forEach(function (name) {
      var field = state[name];
      if (field.includeInPrompt === false || !(field.options || []).length) return;
      patch[name] = Object.assign({}, field, { value: field.options[Math.floor(Math.random() * field.options.length)], customValue: "" });
    });
    store.setState(patch);
  }

  function reset() {
    store.setState(buildInitialState());
  }

  // ---------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------
  function renderImageColumn(state) {
    var ui = GraphicsHaus.ui;
    var fileInput = ui.el("input", { type: "file", accept: "image/*", class: "gh-reference-upload__file-input" });
    var column = ui.el("div", { class: "gh-reference-upload__image" });

    function handleFile(file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        setImage(reader.result, file.name);
        GraphicsHaus.ui.renderApp();
      };
      reader.readAsDataURL(file);
    }
    fileInput.addEventListener("change", function () { handleFile(fileInput.files[0]); });

    if (state.image) {
      var img = ui.el("img", { class: "gh-reference-upload__preview-img", src: state.image, alt: state.imageName || "Reference image" });
      var removeBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--delete", text: "Remove Image" });
      removeBtn.addEventListener("click", function () { clearImage(); GraphicsHaus.ui.renderApp(); });
      column.appendChild(ui.el("div", { class: "gh-reference-upload__preview" }, [img, ui.el("p", { text: state.imageName || "" }), removeBtn]));
    } else {
      var dropzone = ui.el("div", { class: "gh-reference-upload__dropzone", tabindex: "0" }, [
        ui.icon("upload"),
        ui.el("span", { text: "Click to upload an image, or drag one here" }),
      ]);
      dropzone.addEventListener("click", function () { fileInput.click(); });
      dropzone.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") fileInput.click(); });
      dropzone.addEventListener("dragover", function (e) { e.preventDefault(); dropzone.classList.add("is-dragover"); });
      dropzone.addEventListener("dragleave", function () { dropzone.classList.remove("is-dragover"); });
      dropzone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropzone.classList.remove("is-dragover");
        handleFile(e.dataTransfer.files[0]);
      });
      column.appendChild(dropzone);
    }
    column.appendChild(fileInput);
    return column;
  }

  function renderDescriptionColumn(state) {
    var ui = GraphicsHaus.ui;
    var column = ui.el("div", { class: "gh-reference-upload__description" });
    column.appendChild(ui.el("p", { class: "gh-reference-upload__hint", text: "Describe what's in the image (subject, pose, composition) — this is what actually gets reimagined." }));
    column.appendChild(ui.renderFreeTextField(
      { label: "Description", field: state.description, placeholder: "e.g. a golden retriever sitting in a field of sunflowers" },
      function (changes) { updateDescription(changes); GraphicsHaus.ui.renderApp(); }
    ));
    return column;
  }

  function renderPromptReferenceSection(state) {
    var ui = GraphicsHaus.ui;
    var wrap = ui.el("div", {});
    wrap.appendChild(ui.el("p", { class: "gh-reference-upload__hint", text: "Paste a prompt you found elsewhere — we'll use it only as loose creative direction, not copy it verbatim." }));
    wrap.appendChild(ui.renderFreeTextField(
      { label: "Reference Prompt", field: state.promptReference, placeholder: "Paste the prompt here..." },
      function (changes) { updatePromptReference(changes); GraphicsHaus.ui.renderApp(); }
    ));
    return wrap;
  }

  function renderReferenceSourceSection(state) {
    var ui = GraphicsHaus.ui;
    var box = ui.el("div", { class: "gh-reference-upload" });
    box.appendChild(ui.el("p", { class: "gh-field-group__title" }, [ui.icon("upload"), ui.el("span", { text: "Reference Source" })]));
    box.appendChild(ui.renderTwoOptionToggle([
      { isActive: state.sourceType === "image", icon: "upload", title: "Reference an Image", subtitle: "Upload + describe a photo", onClick: function () { setSourceType("image"); GraphicsHaus.ui.renderApp(); } },
      { isActive: state.sourceType === "prompt", icon: "document", title: "Reference a Prompt", subtitle: "Paste someone else's prompt", onClick: function () { setSourceType("prompt"); GraphicsHaus.ui.renderApp(); } },
    ]));
    if (state.sourceType === "prompt") {
      box.appendChild(renderPromptReferenceSection(state));
    } else {
      box.appendChild(ui.el("div", { class: "gh-reference-upload__columns" }, [renderImageColumn(state), renderDescriptionColumn(state)]));
    }
    return box;
  }

  function renderPanel() {
    var ui = GraphicsHaus.ui;
    var state = store.getState();
    var wrap = ui.el("div", { class: "gh-panel gh-generator-panel" });
    wrap.appendChild(ui.el("h3", { class: "gh-generator-panel__title" }, [ui.icon("upload"), ui.el("span", { text: "Image/Prompt Reference" })]));
    wrap.appendChild(ui.el("p", { class: "gh-generator-panel__description", text: "Reference an image you have, or a prompt you found elsewhere, and reimagine it in a new style." }));
    wrap.appendChild(renderReferenceSourceSection(state));
    wrap.appendChild(ui.renderFieldGroup(
      "Reimagine It",
      [
        { label: "Reimagined Style", field: state.reimaginedStyle, name: "reimaginedStyle" },
        { label: "Background", field: state.background, name: "background" },
        { label: "Scene Effect (optional)", field: state.sceneEffect, name: "sceneEffect" },
      ],
      function (entry, changes) { updateField(entry.name, changes); GraphicsHaus.ui.renderApp(); }
    ));
    if (activeSourceText()) {
      var regenBtn = ui.el("button", { type: "button", class: "gh-btn gh-btn--small gh-btn--add", text: "Regenerate" });
      regenBtn.title = "Rerolls a couple of the reimagine fields above, keeping your reference text/image exactly as-is.";
      regenBtn.addEventListener("click", function () { regenerate(); GraphicsHaus.ui.renderApp(); });
      wrap.appendChild(ui.el("div", { class: "gh-companion__controls" }, [regenBtn]));
    }
    return wrap;
  }

  GraphicsHaus.reference = {
    getState: store.getState,
    setState: store.setState,
    renderPanel: renderPanel,
    getSelectionsByGroup: getSelectionsByGroup,
    assemblePrompt: assemblePrompt,
    randomize: randomize,
    reset: reset,
    regenerate: regenerate,
  };
})();
