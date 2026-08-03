/* p2p-launch-prefill.js — consumes the Growth Haus "Launch Profile" handoff.
 *
 * Growth Haus writes localStorage['p2p_launch_prefill'] and sends the member to a Haus
 * generator with ?prefill=1. This pushes the shared fields they already entered — brand
 * name + audience — into whichever Haus tool lives on this page, once, then cleans up the
 * flag + the stored blob. Only the two FREE-TEXT DNA fields are injected (zero risk of a
 * constrained dropdown snapping back); offer/product/problem/outcome are per-studio and
 * stay for the member to type per asset.
 *
 * The target Haus UIs are not per-field reactive (handlers call ui.renderApp() to reflect
 * state), so after setting the store values we call renderApp() to make them visible. */
(function () {
  "use strict";

  if (!/[?&]prefill=1(?:&|$)/.test(window.location.search)) return;

  var data = null;
  try {
    data = JSON.parse(localStorage.getItem("p2p_launch_prefill") || "null");
  } catch (e) {
    data = null;
  }

  function cleanUrl() {
    try {
      var u = new URL(window.location.href);
      u.searchParams.delete("prefill");
      window.history.replaceState(
        {},
        document.title,
        u.pathname + (u.search ? u.search : "") + u.hash
      );
    } catch (e) {}
  }
  function clearBlob() {
    try {
      localStorage.removeItem("p2p_launch_prefill");
    } catch (e) {}
  }

  if (!data) {
    cleanUrl();
    return;
  }

  // Identify whichever Haus generator is on this page.
  function target() {
    if (window.MarketingHaus && window.MarketingHaus.styleDNA) {
      return {
        dna: window.MarketingHaus.styleDNA,
        ui: window.MarketingHaus.ui,
        name: "Marketing Haus"
      };
    }
    if (window.GraphicsHaus && window.GraphicsHaus.styleDNA) {
      return {
        dna: window.GraphicsHaus.styleDNA,
        ui: window.GraphicsHaus.ui,
        name: "Graphics Haus"
      };
    }
    if (window.PromptHaus && window.PromptHaus.styleDNA) {
      return {
        dna: window.PromptHaus.styleDNA,
        ui: window.PromptHaus.ui,
        name: "Content Haus"
      };
    }
    return null;
  }

  var done = false;
  var tries = 0;

  function apply() {
    if (done) return;
    var t = target();
    if (!t) {
      // The Haus app initializes on its own DOMContentLoaded; poll briefly for its namespace.
      if (tries++ < 50) {
        setTimeout(apply, 150);
        return;
      }
      cleanUrl();
      return;
    }
    done = true;

    var dna = t.dna;
    var filled = [];

    if (data.brand && typeof dna.setBusinessName === "function") {
      try {
        dna.setBusinessName(data.brand);
        filled.push("brand name");
      } catch (e) {}
    }
    if (data.audience) {
      if (typeof dna.setAudience === "function") {
        try {
          dna.setAudience(data.audience);
          filled.push("audience");
        } catch (e) {}
      } else if (typeof dna.setTargetAudience === "function") {
        try {
          dna.setTargetAudience(data.audience);
          filled.push("audience");
        } catch (e) {}
      }
    }

    clearBlob();
    cleanUrl();

    // Reflect the new store values in the inputs.
    if (t.ui && typeof t.ui.renderApp === "function") {
      try {
        t.ui.renderApp();
      } catch (e) {}
    }

    if (filled.length) banner(filled);
  }

  function banner(filled) {
    try {
      var wrap = document.createElement("div");
      wrap.setAttribute("role", "status");
      wrap.style.cssText =
        "position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;" +
        "max-width:92vw;display:flex;align-items:center;gap:12px;padding:13px 16px;" +
        "border-radius:12px;background:#12151c;color:#eaf2f0;border:1px solid rgba(120,220,210,.42);" +
        "box-shadow:0 10px 34px rgba(0,0,0,.45);font:600 14px/1.35 system-ui,-apple-system," +
        "'Segoe UI',Roboto,sans-serif;";
      var msg = document.createElement("span");
      msg.innerHTML =
        "✨ Prefilled from your Launch Profile — <b>" +
        filled.join("</b> + <b>") +
        "</b>. Tweak anything before you generate.";
      var x = document.createElement("button");
      x.type = "button";
      x.textContent = "✕";
      x.setAttribute("aria-label", "Dismiss");
      x.style.cssText =
        "flex:none;background:transparent;border:0;color:#9fb4b0;font-size:16px;" +
        "cursor:pointer;line-height:1;padding:2px 4px;";
      x.addEventListener("click", function () {
        wrap.remove();
      });
      wrap.appendChild(msg);
      wrap.appendChild(x);
      document.body.appendChild(wrap);
      setTimeout(function () {
        if (wrap && wrap.parentNode) wrap.remove();
      }, 8000);
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
