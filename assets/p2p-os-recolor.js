/* Purpose 2 Profit — brand recolor for the shared rail on the Haus pages.
   Mirrors the OS page's inline recolor so the rail (#p2posnav) accents match the
   member's Stand Out color instead of the default gold. Self-contained; targets
   any #p2pos / #p2posnav root present on the page. */
(function () {
  function J(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function toHsl(hex) {
    var h = String(hex == null ? '' : hex).trim().replace('#', '');
    if (h.length === 3) { h = h.replace(/(.)/g, '$1$1'); }
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    var r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s, hue;
    if (mx === mn) { hue = 0; s = 0; }
    else { var d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hue = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hue *= 60; }
    return [hue, s * 100, l * 100];
  }
  function hsl(h, s, l) { return 'hsl(' + (((Math.round(h) % 360) + 360) % 360) + ',' + Math.round(s) + '%,' + Math.round(l) + '%)'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function computeVars() {
    var arch = J('p2p_archetype'), vault = J('blackSheepBrandKitVault');
    var pick = arch && arch.standOut ? toHsl(arch.standOut) : null;
    if (!pick) {
      var kit = vault && vault.brandHausKits && vault.brandHausKits.length ? vault.brandHausKits[vault.brandHausKits.length - 1] : null;
      var kc = (kit && kit.colors ? kit.colors : []).map(toHsl).filter(Boolean).sort(function (a, b) { return b[1] - a[1]; });
      pick = kc[0] || null;
    }
    if (!pick) return null;
    var v = {};
    if (pick[1] < 12) { v['--gold'] = hsl(0, 0, 80); v['--gold-bright'] = hsl(0, 0, 90); v['--gstroke'] = 'hsla(0,0%,82%,.30)'; return v; }
    var h = pick[0], sat = clamp(pick[1], 45, 90);
    v['--gold'] = hsl(h, sat, 62);
    v['--gold-bright'] = hsl(h, clamp(sat + 6, 50, 94), 70);
    v['--gstroke'] = 'hsla(' + Math.round(h) + ',' + Math.round(sat) + '%,60%,.38)';
    var offs = [-28, -12, 0, 16, 30];
    var stops = offs.map(function (o, i) { return hsl(h + o, clamp(sat - Math.abs(o) * 0.4, 40, 90), 58 + (i % 2 ? 8 : 0)); });
    v['--aurora'] = 'linear-gradient(100deg,' + stops.concat(stops[0]).join(',') + ')';
    return v;
  }
  function apply() {
    var vars = computeVars(); if (!vars) return;
    document.querySelectorAll('#p2pos, #p2posnav').forEach(function (root) {
      Object.keys(vars).forEach(function (k) { root.style.setProperty(k, vars[k]); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
