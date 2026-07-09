/**
 * The AI Creator's Brand Haus — Prompt Assembly Engine
 * Depends on brand-haus-util.js (must load first).
 *
 * Direct port of Prompt Haus's own PromptHaus.engine — generic across
 * every mode: field resolution rule, the sentence assembler, and the
 * platform formatter layer. Brand Haus's own modes call into this
 * with their own field lists, same as Prompt Haus's modes do.
 */
(function () {
  "use strict";

  window.BrandHaus = window.BrandHaus || {};
  var BrandHaus = window.BrandHaus;

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
  // Brand Haus mode uses (no meta-instruction/"Maintain vs Vary" style
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
  // assembler above, not a rebuild of the field data. Brand Haus's
  // "platform" is the marketing channel (Instagram, Email, etc.) rather
  // than an AI image generator, but the shape is identical: reformat the
  // same assembled text differently depending on where it's headed.
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

  function formatForPlatform(assembled, negativePrompt) {
    var negativeItems = cleanNegativeItems(negativePrompt);
    var text = assembled.text;
    if (negativeItems.length) text += " Avoid: " + negativeItems.join(", ") + ".";
    return text;
  }

  BrandHaus.engine = {
    resolveFieldValue: resolveFieldValue,
    resolveFields: resolveFields,
    buildSentence: buildSentence,
    formatForPlatform: formatForPlatform,
  };
})();
