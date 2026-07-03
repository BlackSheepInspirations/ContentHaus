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
  // between the 4 variations.
  function buildMetaInstruction(config) {
    var fixed = resolveFields(config.fixedFieldEntries).map(function (r) {
      return r.value;
    });
    var variable = resolveFields(config.variableFieldEntries).map(function (r) {
      return r.value;
    });
    var parts = [];
    if (config.intro) parts.push(config.intro);
    if (fixed.length) parts.push("Maintain: " + fixed.join(", ") + ".");
    if (variable.length) {
      parts.push("Vary between variations: " + variable.join(", ") + ".");
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
    "ChatGPT/DALL·E": "sentence",
    "Adobe Firefly": "sentence",
    "OpenArt": "sentence",
    "Kittl": "simplified",
    "Ideogram": "simplified",
    "Flux": "simplified",
  };

  function toTagStyle(assembled, aspectRatio) {
    var tags = assembled.fragments
      .join(", ")
      .split(",")
      .map(function (t) {
        return t.trim();
      })
      .filter(Boolean);
    var param = aspectRatio ? "--ar " + aspectRatio : "";
    return [tags.join(", "), param].filter(Boolean).join(" ");
  }

  function toSimplifiedStyle(assembled) {
    return assembled.text.replace(/\s*Aspect ratio:.*$/i, "").trim();
  }

  // group defaults to "sentence" (current default natural-language style)
  // when no platform is selected yet.
  function formatForPlatform(assembled, platform, aspectRatio) {
    var group = PLATFORM_GROUP[platform] || "sentence";
    if (group === "tag") return toTagStyle(assembled, aspectRatio);
    if (group === "simplified") return toSimplifiedStyle(assembled);
    return assembled.text;
  }

  PromptHaus.engine = {
    resolveFieldValue: resolveFieldValue,
    resolveFields: resolveFields,
    buildSentence: buildSentence,
    buildMetaInstruction: buildMetaInstruction,
    formatForPlatform: formatForPlatform,
    PLATFORM_GROUP: PLATFORM_GROUP,
  };
})();
