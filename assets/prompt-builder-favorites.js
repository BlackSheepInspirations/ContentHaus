/**
 * The AI Creator's Prompt Haus — Saved Prompts (Favorites)
 * No dependencies on the other modules; pure localStorage wrapper.
 *
 * Client-side only, by design: a database-backed favorites system would
 * bring the same ongoing-cost problem the build plan already ruled out
 * for saves in general. localStorage is zero server cost, at the trade-off
 * that favorites live per-browser rather than syncing across a customer's
 * devices — worth disclosing, not worth solving for a capped 5-per-mode
 * feature.
 *
 * Capped at 5 per mode (Character/Text/Couples/Combined each get their own
 * 5 slots) rather than one shared pool, per explicit instruction.
 */
(function () {
  "use strict";

  window.PromptHaus = window.PromptHaus || {};
  var PromptHaus = window.PromptHaus;

  var STORAGE_KEY = "promptHausFavorites";
  var MAX_PER_MODE = 5;

  function safeParse(json) {
    try {
      var parsed = JSON.parse(json);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function readStore() {
    if (!window.localStorage) return {};
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  }

  function writeStore(store) {
    if (!window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function getAll(mode) {
    return readStore()[mode] || [];
  }

  function isFull(mode) {
    return getAll(mode).length >= MAX_PER_MODE;
  }

  // Returns { ok: true } or { ok: false, reason: '...' }. Deliberately
  // refuses rather than silently evicting the oldest favorite when full —
  // losing a saved prompt without the shopper choosing that feels worse
  // than making them delete one first.
  function save(mode, promptObj) {
    var store = readStore();
    var list = store[mode] || [];
    if (list.length >= MAX_PER_MODE) {
      return {
        ok: false,
        reason: "You already have " + MAX_PER_MODE + " saved prompts here — delete one below to save another.",
      };
    }
    list.push({
      id: "fav-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      text: promptObj.text,
      platform: promptObj.platform || "",
      createdAt: Date.now(),
    });
    store[mode] = list;
    writeStore(store);
    return { ok: true };
  }

  function remove(mode, id) {
    var store = readStore();
    store[mode] = (store[mode] || []).filter(function (f) {
      return f.id !== id;
    });
    writeStore(store);
  }

  PromptHaus.favorites = {
    MAX_PER_MODE: MAX_PER_MODE,
    getAll: getAll,
    isFull: isFull,
    save: save,
    remove: remove,
  };
})();
