/* THE LEADERSHIP IMPRINT — constructed visuals (inline SVG).
   Black Sheep Leadership Group. Built to Leadership_Imprint_Visual_Spec_v1.

   Design tokens (spec §1):
     Style colours  TRACTOR amber · BUS green · JET navy · ROCKET red
     Grid           X = PACE (Measured 0 -> Fast 100), Y = PRIORITY (Task 0 -> People 100)
     Filled marker = everyday, open dashed = under pressure. Never reversed.
   Colours are literal so the SVGs render anywhere (they may mount outside #tli).
*/
(function (root) {
  'use strict';
  var LABEL = { TRACTOR: 'Tractor', BUS: 'Bus', JET: 'Jet', ROCKET: 'Rocket' };
  var COLORS = {
    TRACTOR: { p: '#C87F0A', l: '#F2DCA8', d: '#8A5605' },
    BUS: { p: '#2E8B45', l: '#B4DCBE', d: '#1B5E2C' },
    JET: { p: '#1B3F8B', l: '#AFC0E4', d: '#0F2557' },
    ROCKET: { p: '#C41E1E', l: '#F0B4B4', d: '#8A1212' }
  };
  var INK = '#1A1F26', INK_SOFT = '#4A5560', INK_FAINT = '#8A939C',
      PAPER = '#FBFAF7', PAPER_WARM = '#F4F1EA', RULE = '#D8D3C8', GOLD = '#B8860B';
  var SANS = "'Montserrat','Inter',system-ui,sans-serif";

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]); }); }
  function col(style) { return (COLORS[style] || COLORS.TRACTOR); }

  // ---- The Grid (spec §2) -------------------------------------------
  // opts: { style, showNatural, showPressure, framework, images }
  function grid(natural, pressure, opts) {
    opts = opts || {};
    var W = 420, M = 52, P = W - M * 2;               // plot square
    var H = W + 34;                                    // room for legend
    var sc = col(opts.style || (natural && natural.style) || 'TRACTOR');
    function X(pace) { return M + (pace / 100) * P; }
    function Y(priority) { return M + P - (priority / 100) * P; }
    // Clamp plotted markers so an extreme (0 or 100) sits fully inside the plot, not on/over the edge.
    function PX(pace) { return Math.max(M + 12, Math.min(M + P - 12, X(pace))); }
    function PY(priority) { return Math.max(M + 12, Math.min(M + P - 12, Y(priority))); }
    var cx = M + P / 2, cy = M + P / 2;
    var g = '<svg class="tli-grid" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(gridAlt(natural, pressure, opts)) + '" font-family="' + SANS + '">';
    // quadrant tints (6%). SVG y grows downward, so PEOPLE (high) is the TOP half.
    var half = P / 2;
    g += quad(M, M, half, half, COLORS.BUS.p);         // top-left  measured+people
    g += quad(cx, M, half, half, COLORS.JET.p);        // top-right fast+people
    g += quad(M, cy, half, half, COLORS.TRACTOR.p);    // bottom-left measured+task
    g += quad(cx, cy, half, half, COLORS.ROCKET.p);    // bottom-right fast+task
    g += '<rect x="' + M + '" y="' + M + '" width="' + P + '" height="' + P + '" fill="none" stroke="' + INK_SOFT + '" stroke-width="1.5"/>';
    // midlines
    g += '<line x1="' + cx + '" y1="' + M + '" x2="' + cx + '" y2="' + (M + P) + '" stroke="' + INK_FAINT + '" stroke-width="0.75" stroke-dasharray="4 2"/>';
    g += '<line x1="' + M + '" y1="' + cy + '" x2="' + (M + P) + '" y2="' + cy + '" stroke="' + INK_FAINT + '" stroke-width="0.75" stroke-dasharray="4 2"/>';
    // quadrant labels (outer corners), style dark
    g += qlabel(M + 10, M + 18, 'start', 'BUS');
    g += qlabel(M + P - 10, M + 18, 'end', 'JET');
    g += qlabel(M + 10, M + P - 10, 'start', 'TRACTOR');
    g += qlabel(M + P - 10, M + P - 10, 'end', 'ROCKET');
    // pole labels
    g += tlabel(M, M + P + 20, 'start', 'MEASURED');
    g += tlabel(M + P, M + P + 20, 'end', 'FAST');
    // Horizontal Y-pole labels (left margin) so the text layer stays LTR and searchable.
    g += '<text x="' + (M - 6) + '" y="' + (M + 9) + '" text-anchor="end" fill="' + INK_SOFT + '" font-size="9">PEOPLE</text>';
    g += '<text x="' + (M - 6) + '" y="' + (M + P) + '" text-anchor="end" fill="' + INK_SOFT + '" font-size="9">TASK</text>';

    if (opts.framework && opts.images) {
      ['BUS', 'JET', 'TRACTOR', 'ROCKET'].forEach(function (s) {
        var pos = { BUS: [M + half / 2, cy - half / 2], JET: [cx + half / 2, cy - half / 2], TRACTOR: [M + half / 2, cy + half / 2], ROCKET: [cx + half / 2, cy + half / 2] }[s];
        var tw = 96, th = 62, cid = 'tliqc' + s;
        if (opts.images[s]) {
          g += '<clipPath id="' + cid + '"><rect x="' + (pos[0] - tw / 2) + '" y="' + (pos[1] - th / 2 - 6) + '" width="' + tw + '" height="' + th + '" rx="2"/></clipPath>';
          g += '<image href="' + opts.images[s] + '" x="' + (pos[0] - tw / 2) + '" y="' + (pos[1] - th / 2 - 6) + '" width="' + tw + '" height="' + th + '" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + cid + ')"/>';
        }
        // caption dropped — the quadrant corner label already names the style (review #7)
      });
      return g + '</svg>';
    }

    var showN = opts.showNatural !== false, showP = !!(opts.showPressure && pressure);
    var range = (showN && showP) ? Math.round(Math.sqrt(Math.pow(X(natural.pace) - X(pressure.pace), 2) + Math.pow(Y(natural.priority) - Y(pressure.priority), 2)) / P * 100) : 0;
    var overlap = showP && Math.abs(natural.pace - pressure.pace) + Math.abs(natural.priority - pressure.priority) < 8;

    if (showN && showP && !overlap) {
      g += arrowLine(PX(natural.pace), PY(natural.priority), PX(pressure.pace), PY(pressure.priority));
    }
    if (showP && !overlap) {
      g += '<circle cx="' + PX(pressure.pace) + '" cy="' + PY(pressure.priority) + '" r="11" fill="none" stroke="' + sc.p + '" stroke-width="2" stroke-dasharray="3 2"/>';
      g += '<circle cx="' + PX(pressure.pace) + '" cy="' + PY(pressure.priority) + '" r="2.5" fill="' + sc.p + '"/>';
    }
    if (showN) {
      if (overlap) {
        g += '<circle cx="' + PX(natural.pace) + '" cy="' + PY(natural.priority) + '" r="15" fill="none" stroke="' + sc.p + '" stroke-width="2"/>';
        g += '<circle cx="' + PX(natural.pace) + '" cy="' + PY(natural.priority) + '" r="11" fill="none" stroke="' + sc.p + '" stroke-width="1.5" stroke-dasharray="3 2"/>';
      } else {
        g += '<circle cx="' + PX(natural.pace) + '" cy="' + PY(natural.priority) + '" r="11" fill="' + PAPER + '" stroke="' + sc.p + '" stroke-width="2"/>';
      }
      g += '<circle cx="' + PX(natural.pace) + '" cy="' + PY(natural.priority) + '" r="6" fill="' + sc.p + '"/>';
    }
    // "as seen" third marker (The Mirror): dotted ring + cross, neutral
    if (opts.asSeen) {
      var ax = PX(opts.asSeen.pace), ay = PY(opts.asSeen.priority);
      g += '<circle cx="' + ax + '" cy="' + ay + '" r="11" fill="none" stroke="' + INK_SOFT + '" stroke-width="2" stroke-dasharray="1 3"/>';
      g += '<line x1="' + (ax - 5) + '" y1="' + ay + '" x2="' + (ax + 5) + '" y2="' + ay + '" stroke="' + INK_SOFT + '" stroke-width="1.5"/>';
      g += '<line x1="' + ax + '" y1="' + (ay - 5) + '" x2="' + ax + '" y2="' + (ay + 5) + '" stroke="' + INK_SOFT + '" stroke-width="1.5"/>';
    }
    // legend (dynamic: everyday / under pressure / as seen)
    var leg = [];
    if (showN) leg.push('filled');
    if (showP) leg.push('open');
    if (opts.asSeen) leg.push('dotted');
    if (leg.length >= 2) {
      var ly = H - 8, gap = 134, startX = cx - ((leg.length - 1) * gap) / 2 - 24;
      leg.forEach(function (t, i) {
        var ix = startX + i * gap, lbl = t === 'filled' ? 'Everyday' : t === 'open' ? 'Under pressure' : 'As seen';
        if (t === 'filled') g += '<circle cx="' + ix + '" cy="' + (ly - 3) + '" r="6" fill="' + PAPER + '" stroke="' + sc.p + '" stroke-width="2"/><circle cx="' + ix + '" cy="' + (ly - 3) + '" r="3" fill="' + sc.p + '"/>';
        else if (t === 'open') g += '<circle cx="' + ix + '" cy="' + (ly - 3) + '" r="6" fill="none" stroke="' + sc.p + '" stroke-width="2" stroke-dasharray="3 2"/>';
        else g += '<circle cx="' + ix + '" cy="' + (ly - 3) + '" r="6" fill="none" stroke="' + INK_SOFT + '" stroke-width="1.5" stroke-dasharray="1 2"/><line x1="' + (ix - 3.5) + '" y1="' + (ly - 3) + '" x2="' + (ix + 3.5) + '" y2="' + (ly - 3) + '" stroke="' + INK_SOFT + '" stroke-width="1.3"/><line x1="' + ix + '" y1="' + (ly - 6.5) + '" x2="' + ix + '" y2="' + (ly + 0.5) + '" stroke="' + INK_SOFT + '" stroke-width="1.3"/>';
        g += '<text x="' + (ix + 11) + '" y="' + ly + '" fill="' + INK_SOFT + '" font-size="11">' + lbl + '</text>';
      });
    }
    return g + '</svg>';
  }
  function quad(x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '" fill-opacity="0.06"/>'; }
  function qlabel(x, y, anchor, s) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" fill="' + col(s).d + '" font-size="12.5" font-weight="600">' + LABEL[s] + '</text>'; }
  function tlabel(x, y, anchor, t) { return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" fill="' + INK_SOFT + '" font-size="10" letter-spacing="0.08em">' + t + '</text>'; }
  function arrowLine(x1, y1, x2, y2) {
    var ang = Math.atan2(y2 - y1, x2 - x1), L = 8;
    var ax = x2 - 6 * Math.cos(ang), ay = y2 - 6 * Math.sin(ang);
    var p1x = ax - L * Math.cos(ang - 0.5), p1y = ay - L * Math.sin(ang - 0.5);
    var p2x = ax - L * Math.cos(ang + 0.5), p2y = ay - L * Math.sin(ang + 0.5);
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + INK_SOFT + '" stroke-width="2" stroke-dasharray="5 3"/>' +
      '<polygon points="' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' ' + p1x.toFixed(1) + ',' + p1y.toFixed(1) + ' ' + p2x.toFixed(1) + ',' + p2y.toFixed(1) + '" fill="' + INK_SOFT + '"/>';
  }
  function gridAlt(natural, pressure, opts) {
    if (opts.framework) return 'The grid: four leadership styles across pace and priority.';
    var a = 'Your everyday position is in the ' + LABEL[natural.style] + ' quadrant.';
    if (opts.showPressure && pressure) a += ' Under pressure you move toward ' + LABEL[pressure.style] + '.';
    return a;
  }

  // ---- Continuum bars (spec §3) -------------------------------------
  function continuum(axis, left, right) {
    var W = 480, H = 78, pad = 20, trackY = 40, x0 = pad, x1 = W - pad;
    var gid = 'tlicg' + axis.replace(/\W/g, '');
    var stops = axis === 'Pace' ? ['#4A5560', '#C8922A'] : ['#4A5560', '#2E6B8A'];
    var s = '<svg class="tli-continuum" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="' + esc(axis + ' runs from ' + left + ' to ' + right) + '" font-family="' + SANS + '">';
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + stops[0] + '"/><stop offset="1" stop-color="' + stops[1] + '"/></linearGradient></defs>';
    s += '<text x="' + (W / 2) + '" y="18" text-anchor="middle" fill="' + INK_SOFT + '" font-size="11" font-weight="600" letter-spacing="0.08em">' + esc(axis.toUpperCase()) + '</text>';
    s += '<rect x="' + x0 + '" y="' + (trackY - 7) + '" width="' + (x1 - x0) + '" height="14" rx="7" fill="url(#' + gid + ')" stroke="' + RULE + '" stroke-width="0.75"/>';
    s += '<text x="' + x0 + '" y="' + (H - 8) + '" text-anchor="start" fill="' + INK_SOFT + '" font-size="11">' + esc(left) + '</text>';
    s += '<text x="' + x1 + '" y="' + (H - 8) + '" text-anchor="end" fill="' + INK_SOFT + '" font-size="11">' + esc(right) + '</text>';
    return s + '</svg>';
  }

  // ---- Blend bars (spec §4) — each bar in its own style colour ------
  function blendBars(blendArr, primaryStyle) {
    var rowH = 40, W = 480, barX = 118, barW = 300, valX = barX + barW + 12, top = 8;
    var H = top + blendArr.length * rowH;
    var s = '<svg class="tli-blend" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Your blend across the four styles." font-family="' + SANS + '">';
    blendArr.forEach(function (o, i) {
      var y = top + i * rowH, cy = y + rowH / 2, c = col(o.style);
      var isP = o.style === primaryStyle, low = o.pct < 10;
      var opacity = low ? 0.45 : 1;
      s += '<text x="' + (barX - 12) + '" y="' + (cy + 4) + '" text-anchor="end" fill="' + (low ? INK_FAINT : c.d) + '" font-size="13" font-weight="' + (isP ? '700' : '600') + '">' + LABEL[o.style] + '</text>';
      s += '<rect x="' + barX + '" y="' + (cy - 12) + '" width="' + barW + '" height="24" rx="2" fill="' + PAPER_WARM + '"/>';
      var w = Math.max(4, (o.pct / 100) * barW);
      s += '<rect x="' + barX + '" y="' + (cy - 12) + '" width="' + w + '" height="24" rx="2" fill="' + c.p + '" fill-opacity="' + opacity + '"/>';
      s += '<text x="' + valX + '" y="' + (cy + 5) + '" fill="' + INK + '" font-size="15" font-weight="700">' + o.pct + '%</text>';
    });
    return s + '</svg>';
  }

  // ---- Range bar (spec §5) — neutral greys, proportional widths -----
  var RANGE_BANDS = [
    { name: 'Anchored', lo: 0, hi: 15, fill: '#E8E4DA' },
    { name: 'Steady', lo: 16, hi: 30, fill: '#DAD5C8' },
    { name: 'Adaptive', lo: 31, hi: 50, fill: '#C8C2B2' },
    { name: 'Wide', lo: 51, hi: 141, fill: '#B6AF9C' }
  ];
  function rangeBar(band, distance) {
    var W = 480, H = 116, pad = 16, track = W - pad * 2, trackY = 34, hTrack = 20;
    // proportional widths from point spans (0-15,16-30,31-50,51-141 -> 78/78/104/260 on 520)
    var spans = [15, 15, 20, 90], totalSpan = 140;
    var widths = spans.map(function (sp) { return (sp / totalSpan) * track; });
    var s = '<svg class="tli-range" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Your range is ' + esc(band) + ', ' + distance + ' points." font-family="' + SANS + '">';
    var x = pad, bounds = [];
    RANGE_BANDS.forEach(function (b, i) {
      bounds.push({ x0: x, w: widths[i], lo: (i === 0 ? 0 : RANGE_BANDS[i].lo), hi: RANGE_BANDS[i].hi });
      s += '<rect x="' + x + '" y="' + trackY + '" width="' + widths[i] + '" height="' + hTrack + '" fill="' + b.fill + '"/>';
      if (i > 0) s += '<line x1="' + x + '" y1="' + trackY + '" x2="' + x + '" y2="' + (trackY + hTrack) + '" stroke="' + PAPER + '" stroke-width="0.75"/>';
      // stagger onto two rows so the two narrow bands (Anchored/Steady) never collide
      var lyOff = (i % 2 === 0) ? 16 : 30;
      if (i % 2 === 1) s += '<line x1="' + (x + widths[i] / 2) + '" y1="' + (trackY + hTrack) + '" x2="' + (x + widths[i] / 2) + '" y2="' + (trackY + hTrack + 22) + '" stroke="' + RULE + '" stroke-width="0.75"/>';
      s += '<text x="' + (x + widths[i] / 2) + '" y="' + (trackY + hTrack + lyOff) + '" text-anchor="middle" fill="' + (b.name === band ? INK : INK_SOFT) + '" font-size="10.5" font-weight="' + (b.name === band ? '700' : '400') + '">' + b.name + '</text>';
      x += widths[i];
    });
    // marker at proportional position within its band
    var d = Math.max(0, Math.min(141, distance));
    var bIdx = d <= 15 ? 0 : d <= 30 ? 1 : d <= 50 ? 2 : 3;
    var bd = bounds[bIdx];
    var loP = bIdx === 0 ? 0 : RANGE_BANDS[bIdx].lo, hiP = RANGE_BANDS[bIdx].hi;
    var frac = (d - loP) / Math.max(1, (hiP - loP));
    var mx = bd.x0 + Math.max(4, Math.min(bd.w - 4, frac * bd.w));
    s += '<line x1="' + mx + '" y1="' + (trackY - 6) + '" x2="' + mx + '" y2="' + (trackY + hTrack + 6) + '" stroke="' + INK + '" stroke-width="2"/>';
    s += '<circle cx="' + mx + '" cy="' + (trackY - 6) + '" r="4" fill="' + INK + '"/>';
    s += '<text x="' + mx + '" y="' + (trackY - 12) + '" text-anchor="middle" fill="' + INK + '" font-size="13" font-weight="700">' + distance + '</text>';
    s += '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" fill="' + INK_FAINT + '" font-size="10">No band is better than another. Each one costs something.</text>';
    return s + '</svg>';
  }

  // ---- Fleet chart (spec §6) — fixed order + balance strip ----------
  function fleetChart(fleet) {
    var order = ['TRACTOR', 'BUS', 'JET', 'ROCKET'];
    var W = 480, barX = 118, barW = 300, valX = barX + barW + 12, rowH = 40;
    var stripY = 20, top = 58, H = top + order.length * rowH;
    var s = '<svg class="tli-fleet" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Your fleet across the four styles." font-family="' + SANS + '">';
    // balance strip
    s += '<text x="' + barX + '" y="12" fill="' + INK_SOFT + '" font-size="11">Your fleet at a glance</text>';
    var sx = barX;
    order.forEach(function (st) {
      var w = (fleet.counts[st] / fleet.total) * barW;
      if (w > 0) { s += '<rect x="' + sx + '" y="' + stripY + '" width="' + w + '" height="12" fill="' + col(st).p + '"/>'; sx += w; }
    });
    s += '<rect x="' + barX + '" y="' + stripY + '" width="' + barW + '" height="12" fill="none" stroke="' + RULE + '" stroke-width="0.75"/>';
    // bars
    order.forEach(function (st, i) {
      var y = top + i * rowH, cy = y + rowH / 2, c = col(st);
      var count = fleet.counts[st] || 0, share = fleet.shares[st] || 0;
      var dominant = share >= 50, missing = count === 0, thin = !missing && share <= 15;
      var suffix = dominant ? ' · dominant' : missing ? ' · none' : thin ? ' · thin' : '';
      s += '<text x="' + (barX - 12) + '" y="' + (cy + 4) + '" text-anchor="end" fill="' + (missing ? INK_FAINT : c.d) + '" font-size="13" font-weight="600">' + LABEL[st] + '<tspan fill="' + (missing ? INK_FAINT : INK_SOFT) + '" font-weight="400" font-size="10">' + suffix + '</tspan></text>';
      s += '<rect x="' + barX + '" y="' + (cy - 12) + '" width="' + barW + '" height="24" rx="2" fill="' + PAPER_WARM + '"' + (missing ? ' stroke="' + c.p + '" stroke-opacity="0.4" stroke-dasharray="3 3"' : '') + '/>';
      if (!missing) { var w = Math.max(4, share / 100 * barW); s += '<rect x="' + barX + '" y="' + (cy - 12) + '" width="' + w + '" height="24" rx="2" fill="' + c.p + '" fill-opacity="' + (thin ? 0.6 : 1) + '"' + (dominant ? ' stroke="' + c.d + '" stroke-width="2"' : '') + '/>'; }
      s += '<text x="' + valX + '" y="' + (cy) + '" fill="' + INK + '" font-size="15" font-weight="700">' + count + '</text>';
      s += '<text x="' + valX + '" y="' + (cy + 13) + '" fill="' + INK_SOFT + '" font-size="10">' + Math.round(share) + '%</text>';
    });
    return s + '</svg>';
  }

  var visuals = { grid: grid, continuum: continuum, blendBars: blendBars, rangeBar: rangeBar, fleetChart: fleetChart, COLORS: COLORS };
  if (typeof module !== 'undefined' && module.exports) module.exports = visuals;
  root.TLI = root.TLI || {};
  root.TLI.visuals = visuals;
})(typeof window !== 'undefined' ? window : this);
