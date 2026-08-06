/**
 * The AI Creator's Project Haus — shared KDP print-framing helper
 * Loads after product-haus-generators.js and before the coloring
 * generators (coloringpage / adultcoloring / coloringbook), which all
 * consume it. Keeps the KDP trim-size / binding-gutter / single-sided
 * language in ONE place instead of triplicated across those files.
 *
 * Usage inside a generator:
 *   fields: [ ...creative fields..., ProductHaus.kdp.trimField(),
 *             ProductHaus.kdp.bindingField("Single printable (even margins)") ]
 *   computeExtraTokens: function (valueMap) {
 *     return { ...otherTokens,
 *       kdpTrimClause: ProductHaus.kdp.clause(valueMap.trimSize, valueMap.bookBinding) };
 *   }
 *   template: "...existing prompt...{kdpTrimClause}"
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var TRIM_SIZE_OPTIONS = [
    "8.5 x 11 in (US Letter)",
    "8 x 10 in",
    "6 x 9 in",
    "7 x 10 in",
    "8.5 x 8.5 in (Square)",
  ];

  var BINDING_OPTIONS = [
    "Single printable (even margins)",
    "Bound book — add binding gutter",
  ];

  ProductHaus.kdp = {
    TRIM_SIZE_OPTIONS: TRIM_SIZE_OPTIONS,
    BINDING_OPTIONS: BINDING_OPTIONS,

    // Field factories so every generator declares them identically.
    trimField: function (defaultValue) {
      return { name: "trimSize", label: "Trim Size (KDP)", options: TRIM_SIZE_OPTIONS, defaultValue: defaultValue || TRIM_SIZE_OPTIONS[0] };
    },
    bindingField: function (defaultValue) {
      return { name: "bookBinding", label: "Print Setup", options: BINDING_OPTIONS, defaultValue: defaultValue || BINDING_OPTIONS[0] };
    },

    // The one clause appended to every coloring prompt: trim + orientation
    // + 300 DPI, gutter vs even margins, and single-sided / no-bleed-through.
    clause: function (trimSize, binding) {
      var trim = trimSize || TRIM_SIZE_OPTIONS[0];
      var orient = /Square/i.test(trim) ? "square" : "portrait";
      var s = " KDP print-ready: " + trim + " " + orient + " page at 300 DPI.";
      if (/gutter|bound/i.test(binding || "")) {
        s += " Leave a wider inner binding-edge margin (a gutter of about 0.5 inch) plus an even safe margin on the other three sides, so no line art is lost in the spine or trimmed at the edge.";
      } else {
        s += " Keep an even safe margin on all four sides so no line art is trimmed at the edge.";
      }
      s += " Designed for single-sided printing: pure white background with clean black line art only, and no heavy solid-black fills or dense shading that would bleed through to the other side of the page.";
      return s;
    },
  };
})();
