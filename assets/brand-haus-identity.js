/**
 * The AI Creator's Brand Haus — Identity bar (shared state)
 * Depends on brand-haus-util.js (must load first).
 *
 * Deliberately minimal, unlike Marketing Haus's own rich Voice DNA bar
 * (Tone/Audience/Reading Level/Holiday/Theme/Niche) — those fields exist
 * to shape marketing CONTENT, which isn't what Brand Haus produces.
 * Brand Haus defines WHO the brand is; it only needs a name to attach
 * that identity to, plus the standard shared negative prompt.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;
  var makeField = BrandHaus.util.makeField;

  var store = BrandHaus.util.createStore({
    businessName: makeField("", [], { isFreeText: true }),
    negativePrompt: makeField("", [], { isFreeText: true }),
  });

  function setBusinessName(value) {
    BrandHaus.util.updateField(store, "businessName", { value: value });
  }
  function updateNegativePromptField(changes) {
    var state = store.getState();
    store.setState({ negativePrompt: Object.assign({}, state.negativePrompt, changes) });
  }

  BrandHaus.identity = Object.assign({}, store, {
    setBusinessName: setBusinessName,
    updateNegativePromptField: updateNegativePromptField,
  });
})();
