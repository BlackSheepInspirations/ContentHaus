/**
 * The AI Creator's Graphics Haus — Prompt Assembly Engine
 * Depends on graphics-haus-util.js (must load first).
 *
 * Direct port of Prompt Haus's own PromptHaus.engine — generic across
 * every mode: field resolution rule, the sentence assembler, and the
 * platform formatter layer. Graphics Haus's own modes call into this
 * with their own field lists, same as Prompt Haus's modes do.
 */
(function () {
  "use strict";

  window.GraphicsHaus = window.GraphicsHaus || {};
  var GraphicsHaus = window.GraphicsHaus;

  // If includeInPrompt, use customValue when non-empty, else the dropdown
  // value; otherwise exclude entirely. "none" is a sentinel several option
  // lists use as their neutral default, so it resolves to empty exactly
  // like an unselected field.
  function resolveFieldValue(field) {
    if (!field || field.includeInPrompt === false) return "";
    var custom = (field.customValue || "").trim();
    if (custom) return custom;
    var value = (field.value || "").trim();
    if (value.toLowerCase() === "none") return "";
    return value;
  }

  // True when a field resolves empty because the user explicitly chose
  // the "none" sentinel option, as opposed to resolving empty because
  // it's untouched/blank. getFieldValueMap uses this to tell "deliberately
  // omit this facet" apart from "nothing typed yet, fall back to default."
  function isNoneSelection(field) {
    if (!field || field.includeInPrompt === false) return false;
    var custom = (field.customValue || "").trim();
    if (custom) return false;
    var value = (field.value || "").trim();
    return value.toLowerCase() === "none";
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

  // Single polished sentence-style prompt — the assembler style every
  // Graphics Haus mode uses (no meta-instruction/"Maintain vs Vary" style
  // needed here the way Prompt Haus's Text Mode has one).
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

  // ---------------------------------------------------------------------
  // Platform formatter layer — one extra function on top of the
  // assembler above, not a rebuild of the field data. Verbatim port of
  // Content Haus's own formatForPlatform (prompt-builder-engine.js):
  // tag-style for Midjourney/Leonardo AI (comma tags + --ar/--no),
  // simplified for Kittl/Ideogram/Flux, plain sentence + "Avoid: ..."
  // suffix for everything else (including no platform selected).
  // ---------------------------------------------------------------------

  // Splits a freeform "no jargon, no exclamation points" string into
  // clean individual items — comma, semicolon, or newline separated.
  function cleanNegativeItems(negativePrompt) {
    return (negativePrompt || "")
      .split(/[,;\n]/)
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
  }

  var PLATFORM_GROUP = {
    "Midjourney": "tag", "Leonardo AI": "tag",
    "Kittl": "simplified", "Ideogram": "simplified", "Flux": "simplified",
  };

  // File-level export setting — independent of any generator's own
  // decorative Background field (a scene/content choice). Folded in at
  // this same generic layer as Buffer, for the same reason: it needs to
  // reach every broad Studio and every narrow generator uniformly.
  var OUTPUT_FORMAT_PHRASES = {
    "PNG — Transparent Background": "PNG file format with a fully transparent background (alpha channel), isolating the subject cleanly with no background fill",
    "JPG — Solid Background": "JPG file format with a solid, fully opaque background and no transparency",
  };

  function toTagStyle(assembled, aspectRatio, negativeItems, bufferClause, outputFormatPhrase) {
    var tags = assembled.fragments.join(", ").split(",").map(function (t) { return t.trim(); }).filter(Boolean);
    if (bufferClause) tags.push(bufferClause);
    if (outputFormatPhrase) tags.push(outputFormatPhrase);
    var param = aspectRatio ? "--ar " + aspectRatio : "";
    var negative = negativeItems.length ? "--no " + negativeItems.join(", ") : "";
    return [tags.join(", "), param, negative].filter(Boolean).join(" ");
  }

  function toSimplifiedStyle(assembled, negativeItems, bufferClause, outputFormatPhrase) {
    var text = assembled.text;
    if (bufferClause) text += " Include a " + bufferClause + ".";
    if (outputFormatPhrase) text += " Export as a " + outputFormatPhrase + ".";
    if (negativeItems.length) text += " Avoid: " + negativeItems.join(", ") + ".";
    return text;
  }

  // (assembled, platform, aspectRatio, negativePrompt, addBuffer,
  // outputFormat) — both Buffer and Output Format are folded in
  // generically here (rather than woven into each mode/generator's own
  // assembled sentence, the way Content Haus does it) so they reach every
  // broad Studio *and* every narrow generator uniformly, without editing
  // dozens of individual generator template files.
  function formatForPlatform(assembled, platform, aspectRatio, negativePrompt, addBuffer, outputFormat) {
    var group = PLATFORM_GROUP[platform] || "sentence";
    var negativeItems = cleanNegativeItems(negativePrompt);
    var bufferClause = addBuffer ? "buffer of empty space around the edges so nothing gets cropped at the borders" : "";
    var outputFormatPhrase = OUTPUT_FORMAT_PHRASES[outputFormat] || "";
    if (group === "tag") return toTagStyle(assembled, aspectRatio, negativeItems, bufferClause, outputFormatPhrase);
    if (group === "simplified") return toSimplifiedStyle(assembled, negativeItems, bufferClause, outputFormatPhrase);
    var text = assembled.text;
    if (bufferClause) text += " Include a " + bufferClause + ".";
    if (outputFormatPhrase) text += " Export as a " + outputFormatPhrase + ".";
    if (negativeItems.length) text += " Avoid: " + negativeItems.join(", ") + ".";
    return text;
  }

  GraphicsHaus.engine = {
    resolveFieldValue: resolveFieldValue,
    isNoneSelection: isNoneSelection,
    resolveFields: resolveFields,
    buildSentence: buildSentence,
    formatForPlatform: formatForPlatform,
  };
})();
