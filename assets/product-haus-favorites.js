/**
 * The AI Creator's Product Haus — Saved Prompts (Favorites)
 * No dependencies on the other modules; pure localStorage wrapper.
 *
 * Direct port of Prompt Haus's own PromptHaus.favorites — same client-
 * side-only rationale, same Version History and Recent Log mechanics —
 * under a separate namespace and separate storage keys so the two
 * products' saved data never mixes even if a customer has purchased both.
 */
(function () {
  "use strict";

  window.ProductHaus = window.ProductHaus || {};
  var ProductHaus = window.ProductHaus;

  var STORAGE_KEY = "productHausFavorites";
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
      title: promptObj.title || "",
      text: promptObj.text,
      platform: promptObj.platform || "",
      snapshot: promptObj.snapshot || null,
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

  function rename(mode, id, newTitle) {
    var store = readStore();
    var list = store[mode] || [];
    list.forEach(function (fav) {
      if (fav.id === id) fav.title = newTitle;
    });
    store[mode] = list;
    writeStore(store);
  }

  var MAX_VERSIONS_PER_ITEM = 5;

  function getCurrentVersion(fav) {
    if (fav.versions && fav.versions.length) {
      var idx = typeof fav.activeVersionIndex === "number" ? fav.activeVersionIndex : fav.versions.length - 1;
      return fav.versions[idx] || fav.versions[fav.versions.length - 1];
    }
    return { text: fav.text, platform: fav.platform, snapshot: fav.snapshot, createdAt: fav.createdAt };
  }

  function getVersionCount(fav) {
    return fav.versions && fav.versions.length ? fav.versions.length : 1;
  }

  function syncTopLevelToActiveVersion(fav) {
    var current = fav.versions[fav.activeVersionIndex];
    fav.text = current.text;
    fav.platform = current.platform;
    fav.snapshot = current.snapshot;
    fav.createdAt = current.createdAt;
  }

  function addVersion(mode, id, versionData) {
    var store = readStore();
    var list = store[mode] || [];
    list.forEach(function (fav) {
      if (fav.id !== id) return;
      if (!fav.versions || !fav.versions.length) {
        fav.versions = [{ text: fav.text, platform: fav.platform, snapshot: fav.snapshot, createdAt: fav.createdAt }];
      }
      fav.versions.push({
        text: versionData.text,
        platform: versionData.platform || "",
        snapshot: versionData.snapshot || null,
        createdAt: Date.now(),
      });
      if (fav.versions.length > MAX_VERSIONS_PER_ITEM) {
        fav.versions = fav.versions.slice(fav.versions.length - MAX_VERSIONS_PER_ITEM);
      }
      fav.activeVersionIndex = fav.versions.length - 1;
      syncTopLevelToActiveVersion(fav);
    });
    store[mode] = list;
    writeStore(store);
  }

  function setActiveVersion(mode, id, versionIndex) {
    var store = readStore();
    var list = store[mode] || [];
    list.forEach(function (fav) {
      if (fav.id !== id) return;
      if (!fav.versions || !fav.versions[versionIndex]) return;
      fav.activeVersionIndex = versionIndex;
      syncTopLevelToActiveVersion(fav);
    });
    store[mode] = list;
    writeStore(store);
  }

  function getAllFlat() {
    var store = readStore();
    var out = [];
    Object.keys(store).forEach(function (mode) {
      (store[mode] || []).forEach(function (fav) {
        out.push(Object.assign({ mode: mode }, fav));
      });
    });
    out.sort(function (a, b) {
      return a.createdAt - b.createdAt;
    });
    return out;
  }

  var RECENT_LOG_KEY = "productHausRecentLog";
  var RECENT_LOG_MAX = 10;

  function readRecentLog() {
    if (!window.localStorage) return [];
    try {
      var parsed = JSON.parse(window.localStorage.getItem(RECENT_LOG_KEY));
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeRecentLog(list) {
    if (!window.localStorage) return;
    window.localStorage.setItem(RECENT_LOG_KEY, JSON.stringify(list));
  }

  function logRecent(mode, entry) {
    var list = readRecentLog();
    if (list.length && list[0].text === entry.text && list[0].mode === mode) return;
    list.unshift({
      id: "rl-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      mode: mode,
      text: entry.text,
      platform: entry.platform || "",
      snapshot: entry.snapshot || null,
      loggedAt: Date.now(),
    });
    if (list.length > RECENT_LOG_MAX) list = list.slice(0, RECENT_LOG_MAX);
    writeRecentLog(list);
  }

  function getRecentLog() {
    return readRecentLog();
  }

  function removeRecent(id) {
    writeRecentLog(readRecentLog().filter(function (r) {
      return r.id !== id;
    }));
  }

  function clearRecentLog() {
    writeRecentLog([]);
  }

  ProductHaus.favorites = {
    MAX_PER_MODE: MAX_PER_MODE,
    RECENT_LOG_MAX: RECENT_LOG_MAX,
    MAX_VERSIONS_PER_ITEM: MAX_VERSIONS_PER_ITEM,
    getAll: getAll,
    getAllFlat: getAllFlat,
    isFull: isFull,
    save: save,
    remove: remove,
    rename: rename,
    logRecent: logRecent,
    getRecentLog: getRecentLog,
    removeRecent: removeRecent,
    clearRecentLog: clearRecentLog,
    getCurrentVersion: getCurrentVersion,
    getVersionCount: getVersionCount,
    addVersion: addVersion,
    setActiveVersion: setActiveVersion,
  };
})();
