/**
 * The AI Creator's Prompt Haus — Prompt Assembly Engine
 * Depends on prompt-builder-styledna.js (must load first).
 *
 * Generic across every mode: field resolution rule, the two assembler
 * styles (sentence vs. meta-instruction), and the platform formatter layer
 * that sits on top of both. Character/Text/Couples modes call into this
 * with their own field lists — no per-mode duplication of this logic.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;

  // Field logic (Section 4): if includeInPrompt, use customValue when
  // non-empty, else the dropdown value; otherwise exclude entirely.
  // "none" is a sentinel several option lists use as their neutral default
  // (Section 7: defaults are "Select..." / "None," never pre-picked values)
  // so it resolves to empty exactly like an unselected field — it should
  // never appear as a literal word in the assembled prompt.
  function resolveFieldValue(field) {
    if (!field || field.includeInPrompt === false) return "";
    var custom = (field.customValue || "").trim();
    if (custom) return custom;
    var value = (field.value || "").trim();
    if (value.toLowerCase() === "none") return "";
    return value;
  }

  // Some fields (Character Type, Art Finish, Letter Style, Color Scheme,
  // Text Effects) show a short label in the dropdown but need to contribute
  // a full descriptive paragraph to the assembled prompt instead of the
  // label itself. Swaps `.value` for its looked-up paragraph before the
  // field reaches resolveFieldValue — customValue overrides (typed by the
  // user) are untouched since resolveFieldValue checks customValue first,
  // and an unmatched/"none" value falls back to the raw value unchanged.
  function withPromptLookup(field, lookup) {
    if (!field) return field;
    var key = (field.value || "").trim().toLowerCase();
    var resolved = lookup[key];
    if (!resolved) return field;
    return Object.assign({}, field, { value: resolved });
  }

  // entries: [{ label, field }] -> [{ label, value }], empties dropped
  function resolveFields(entries) {
    return (entries || [])
      .map(function (entry) {
        return { label: entry.label, value: resolveFieldValue(entry.field) };
      })
      .filter(function (entry) {
        return entry.value;
      });
  }

  // Character Mode style: single polished sentence-style prompt.
  function buildSentence(config) {
    var resolved = resolveFields(config.fieldEntries);
    var descriptors = resolved.map(function (r) {
      return r.value;
    });
    var parts = [];
    if (config.intro) parts.push(config.intro);
    if (descriptors.length) parts.push(descriptors.join(", ") + ".");
    if (config.outro) parts.push(config.outro);
    return {
      text: parts.filter(Boolean).join(" "),
      fragments: descriptors,
      resolved: resolved,
    };
  }

  // Text Mode style: meta-instruction prompt — what to hold fixed vs. vary
  // between the N variations. With variationCount <= 1 there's nothing to
  // vary between, so fixed and variable fields collapse into one plain list
  // instead of a "Maintain / Vary" split that wouldn't make sense for a
  // single output.
  function buildMetaInstruction(config) {
    var count = config.variationCount || 4;
    var fixed = resolveFields(config.fixedFieldEntries).map(function (r) {
      return r.value;
    });
    var variable = resolveFields(config.variableFieldEntries).map(function (r) {
      return r.value;
    });
    var parts = [];
    if (config.intro) parts.push(config.intro);
    if (count <= 1) {
      var all = fixed.concat(variable);
      if (all.length) parts.push(all.join(", ") + ".");
    } else {
      if (fixed.length) parts.push("Maintain: " + fixed.join(", ") + ".");
      if (variable.length) {
        parts.push("Vary between the " + count + " variations: " + variable.join(", ") + ".");
      }
    }
    if (config.outro) parts.push(config.outro);
    return {
      text: parts.filter(Boolean).join(" "),
      fragments: fixed.concat(variable),
    };
  }

  // ---------------------------------------------------------------------
  // Platform formatter layer (Section 4) — one extra function on top of
  // the assemblers above, not a rebuild of the field data.
  // ---------------------------------------------------------------------
  var PLATFORM_GROUP = {
    "Midjourney": "tag",
    "Leonardo AI": "tag",
    "ChatGPT (GPT Image)": "sentence",
    "Adobe Firefly": "sentence",
    "OpenArt": "sentence",
    "Kittl": "simplified",
    "Ideogram": "simplified",
    "Flux": "simplified",
  };

  // Splits a freeform "no watermark, no extra limbs, blurry" string into
  // clean individual items — comma, semicolon, or newline separated, since
  // it's typed free text rather than a picklist.
  function cleanNegativeItems(negativePrompt) {
    return (negativePrompt || "")
      .split(/[,;\n]/)
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
  }

  // Independent of any mode's own decorative "Background" field (a scene
  // choice, e.g. "sparkly confetti effect") — this is a file-level export
  // setting, so a shopper can ask for a splatter-paint decorative
  // background AND a transparent PNG file at the same time. Default is a
  // deliberate no-op (nothing appended) so every existing prompt is
  // unaffected until someone actually opens this dropdown.
  var OUTPUT_FORMAT_CLAUSES = {
    "PNG — Transparent Background": "Export as a PNG file with a fully transparent background (alpha channel) — isolate the subject cleanly with no background fill, ready for print-on-demand use like t-shirts or stickers.",
    "JPG — Solid Background": "Export as a JPG file with a solid, fully opaque background — no transparency.",
  };

  function toTagStyle(assembled, aspectRatio, negativeItems, outputFormatClause) {
    var tags = assembled.fragments
      .join(", ")
      .split(",")
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
    if (outputFormatClause) tags.push(outputFormatClause);
    var param = aspectRatio ? "--ar " + aspectRatio : "";
    // Midjourney's own native negative-prompt flag — reused as-is for the
    // other tag-style platform (Leonardo AI) too, since neither has a
    // separate negative-prompt box the way sentence-style tools do.
    var negative = negativeItems.length ? "--no " + negativeItems.join(", ") : "";
    return [tags.join(", "), param, negative].filter(Boolean).join(" ");
  }

  function toSimplifiedStyle(assembled, negativeItems, outputFormatClause) {
    var base = assembled.text.replace(/\s*Aspect ratio:.*$/i, "").trim();
    if (outputFormatClause) base += " " + outputFormatClause;
    if (negativeItems.length) base += " Avoid: " + negativeItems.join(", ") + ".";
    return base;
  }

  // group defaults to "sentence" (current default natural-language style)
  // when no platform is selected yet. negativePrompt is shared Style DNA
  // (same field, same platform-aware formatting, on every mode) — kept
  // out of assembled.fragments entirely so it never gets swept into
  // Combined's cross-module weaving or randomized like a normal descriptor.
  // outputFormat is handled the same way, at this same formatting layer,
  // rather than threaded through every mode's own assemblePrompt (unlike
  // Buffer/Padding, which predates this layer and is baked in per-mode).
  function formatForPlatform(assembled, platform, aspectRatio, negativePrompt, outputFormat) {
    var group = PLATFORM_GROUP[platform] || "sentence";
    var negativeItems = cleanNegativeItems(negativePrompt);
    var outputFormatClause = OUTPUT_FORMAT_CLAUSES[outputFormat] || "";
    if (group === "tag") return toTagStyle(assembled, aspectRatio, negativeItems, outputFormatClause);
    if (group === "simplified") return toSimplifiedStyle(assembled, negativeItems, outputFormatClause);
    var text = assembled.text;
    if (outputFormatClause) text += " " + outputFormatClause;
    if (negativeItems.length) text += " Avoid: " + negativeItems.join(", ") + ".";
    return text;
  }

  PromptHaus.engine = {
    resolveFieldValue: resolveFieldValue,
    resolveFields: resolveFields,
    withPromptLookup: withPromptLookup,
    buildSentence: buildSentence,
    buildMetaInstruction: buildMetaInstruction,
    formatForPlatform: formatForPlatform,
    PLATFORM_GROUP: PLATFORM_GROUP,
  };
})();
