# -*- coding: utf-8 -*-
"""Reference implementation of the Leadership Imprint visual elements.
Demonstrates the spec. Claude Code should reimplement in the target stack."""
import math, io, os

STYLE = {
    'TRACTOR': {'p': '#C87F0A', 'l': '#F2DCA8', 'd': '#8A5605'},
    'BUS':     {'p': '#2E8B45', 'l': '#B4DCBE', 'd': '#1B5E2C'},
    'JET':     {'p': '#1B3F8B', 'l': '#AFC0E4', 'd': '#0F2557'},
    'ROCKET':  {'p': '#C41E1E', 'l': '#F0B4B4', 'd': '#8A1212'},
}
INK, INK_SOFT, INK_FAINT = '#1A1F26', '#4A5560', '#8A939C'
PAPER, PAPER_WARM, RULE, GOLD = '#FBFAF7', '#F4F1EA', '#D8D3C8', '#B8860B'
SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

def grid_svg(pace, priority, p_pace, p_priority, style, pressure_style, show_pressure=True):
    W = H = 640
    M = 80
    PLOT = 480
    def X(v): return M + (v / 100) * PLOT
    def Y(v): return M + PLOT - (v / 100) * PLOT

    o = io.StringIO()
    o.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="{SANS}">')
    o.write(f'<rect width="{W}" height="{H}" fill="{PAPER}"/>')

    # quadrant fills at 6%
    quads = [('BUS', 0, 50, 50, 100), ('JET', 50, 100, 50, 100),
             ('TRACTOR', 0, 50, 0, 50), ('ROCKET', 50, 100, 0, 50)]
    for name, x0, x1, y0, y1 in quads:
        o.write(f'<rect x="{X(x0):.1f}" y="{Y(y1):.1f}" width="{X(x1)-X(x0):.1f}" '
                f'height="{Y(y0)-Y(y1):.1f}" fill="{STYLE[name]["p"]}" opacity="0.06"/>')

    # quadrant labels, outer corners
    labels = [('BUS', 12, 88, 'start'), ('JET', 88, 88, 'end'),
              ('TRACTOR', 12, 12, 'start'), ('ROCKET', 88, 12, 'end')]
    for name, lx, ly, anchor in labels:
        o.write(f'<text x="{X(lx):.1f}" y="{Y(ly):.1f}" text-anchor="{anchor}" '
                f'font-size="13" font-weight="600" fill="{STYLE[name]["d"]}">{name}</text>')

    # midlines
    o.write(f'<line x1="{X(50):.1f}" y1="{Y(0):.1f}" x2="{X(50):.1f}" y2="{Y(100):.1f}" '
            f'stroke="{INK_FAINT}" stroke-width="0.75" stroke-dasharray="4 2"/>')
    o.write(f'<line x1="{X(0):.1f}" y1="{Y(50):.1f}" x2="{X(100):.1f}" y2="{Y(50):.1f}" '
            f'stroke="{INK_FAINT}" stroke-width="0.75" stroke-dasharray="4 2"/>')

    # axes
    o.write(f'<line x1="{X(0):.1f}" y1="{Y(0):.1f}" x2="{X(100):.1f}" y2="{Y(0):.1f}" stroke="{INK_SOFT}" stroke-width="1.5"/>')
    o.write(f'<line x1="{X(0):.1f}" y1="{Y(0):.1f}" x2="{X(0):.1f}" y2="{Y(100):.1f}" stroke="{INK_SOFT}" stroke-width="1.5"/>')
    for t in (0, 25, 50, 75, 100):
        o.write(f'<line x1="{X(t):.1f}" y1="{Y(0):.1f}" x2="{X(t):.1f}" y2="{Y(0)+6:.1f}" stroke="{INK_FAINT}" stroke-width="0.75"/>')
        o.write(f'<line x1="{X(0)-6:.1f}" y1="{Y(t):.1f}" x2="{X(0):.1f}" y2="{Y(t):.1f}" stroke="{INK_FAINT}" stroke-width="0.75"/>')

    # pole labels
    o.write(f'<text x="{X(0):.1f}" y="{Y(0)+28:.1f}" font-size="11" font-weight="600" '
            f'letter-spacing="0.9" fill="{INK_SOFT}">MEASURED</text>')
    o.write(f'<text x="{X(100):.1f}" y="{Y(0)+28:.1f}" text-anchor="end" font-size="11" font-weight="600" '
            f'letter-spacing="0.9" fill="{INK_SOFT}">FAST</text>')
    o.write(f'<text transform="translate({X(0)-26:.1f},{Y(0):.1f}) rotate(-90)" font-size="11" font-weight="600" '
            f'letter-spacing="0.9" fill="{INK_SOFT}">TASK</text>')
    o.write(f'<text transform="translate({X(0)-26:.1f},{Y(100):.1f}) rotate(-90)" text-anchor="end" font-size="11" '
            f'font-weight="600" letter-spacing="0.9" fill="{INK_SOFT}">PEOPLE</text>')

    col = STYLE[style]['p']
    nx, ny = X(pace), Y(priority)

    if show_pressure:
        px, py = X(p_pace), Y(p_priority)
        dist = math.hypot(p_pace - pace, p_priority - priority)
        if dist >= 8:
            # range line with arrowhead
            ang = math.atan2(py - ny, px - nx)
            ex, ey = px - 13 * math.cos(ang), py - 13 * math.sin(ang)
            o.write(f'<line x1="{nx:.1f}" y1="{ny:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" '
                    f'stroke="{INK_SOFT}" stroke-width="2" stroke-dasharray="5 3"/>')
            a1 = ang + 2.6; a2 = ang - 2.6
            o.write(f'<path d="M {ex:.1f},{ey:.1f} L {ex+9*math.cos(a1):.1f},{ey+9*math.sin(a1):.1f} '
                    f'L {ex+9*math.cos(a2):.1f},{ey+9*math.sin(a2):.1f} Z" fill="{INK_SOFT}"/>')
            pcol = STYLE[pressure_style]['p']
            o.write(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="11" fill="none" stroke="{pcol}" '
                    f'stroke-width="2" stroke-dasharray="3 2"/>')
            o.write(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="2.5" fill="{pcol}"/>')

    # natural point
    o.write(f'<circle cx="{nx:.1f}" cy="{ny:.1f}" r="11" fill="{PAPER}" stroke="{col}" stroke-width="2"/>')
    o.write(f'<circle cx="{nx:.1f}" cy="{ny:.1f}" r="6" fill="{col}"/>')

    # legend
    if show_pressure:
        ly = H - 26
        o.write(f'<circle cx="{W/2-118:.0f}" cy="{ly}" r="7" fill="{PAPER}" stroke="{col}" stroke-width="2"/>')
        o.write(f'<circle cx="{W/2-118:.0f}" cy="{ly}" r="3.5" fill="{col}"/>')
        o.write(f'<text x="{W/2-104:.0f}" y="{ly+4}" font-size="11" fill="{INK_SOFT}">Everyday</text>')
        pcol = STYLE[pressure_style]['p']
        o.write(f'<circle cx="{W/2+20:.0f}" cy="{ly}" r="7" fill="none" stroke="{pcol}" stroke-width="2" stroke-dasharray="3 2"/>')
        o.write(f'<circle cx="{W/2+20:.0f}" cy="{ly}" r="1.8" fill="{pcol}"/>')
        o.write(f'<text x="{W/2+34:.0f}" y="{ly+4}" font-size="11" fill="{INK_SOFT}">Under pressure</text>')

    o.write('</svg>')
    return o.getvalue()


def blend_svg(blends):
    """blends: list of (style, pct) descending"""
    W, BH, GAP, LAB, TRK = 480, 24, 16, 110, 300
    H = len(blends) * (BH + GAP) + 10
    o = io.StringIO()
    o.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="{SANS}">')
    o.write(f'<rect width="{W}" height="{H}" fill="{PAPER}"/>')
    for i, (name, pct) in enumerate(blends):
        y = i * (BH + GAP) + 5
        col = STYLE[name]['p']
        faint = pct < 10
        op = '0.45' if faint else '1'
        lab_col = INK_FAINT if faint else STYLE[name]['d']
        weight = '700' if i == 0 else '600'
        o.write(f'<text x="{LAB-12}" y="{y+BH/2+5:.0f}" text-anchor="end" font-size="13" '
                f'font-weight="{weight}" fill="{lab_col}">{name}</text>')
        o.write(f'<rect x="{LAB}" y="{y}" width="{TRK}" height="{BH}" rx="2" fill="{PAPER_WARM}"/>')
        w = max(4, (pct / 100) * TRK) if pct > 0 else 0
        if w:
            o.write(f'<rect x="{LAB}" y="{y}" width="{w:.1f}" height="{BH}" rx="2" fill="{col}" opacity="{op}"/>')
        o.write(f'<text x="{LAB+TRK+12}" y="{y+BH/2+6:.0f}" font-size="15" font-weight="700" fill="{INK}">{pct}%</text>')
    o.write('</svg>')
    return o.getvalue()


def range_svg(distance):
    W, H, TRK, TH = 560, 110, 520, 20
    X0 = (W - TRK) / 2
    bands = [('Anchored', 0, 15, '#E8E4DA'), ('Steady', 16, 30, '#DAD5C8'),
             ('Adaptive', 31, 50, '#C8C2B2'), ('Wide', 51, 141, '#B6AF9C')]
    widths = [78, 78, 104, 260]
    o = io.StringIO()
    o.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="{SANS}">')
    o.write(f'<rect width="{W}" height="{H}" fill="{PAPER}"/>')
    x = X0; ty = 40
    positions = []
    for (name, lo, hi, fill), bw in zip(bands, widths):
        o.write(f'<rect x="{x:.1f}" y="{ty}" width="{bw}" height="{TH}" fill="{fill}"/>')
        o.write(f'<text x="{x+bw/2:.1f}" y="{ty+TH+16}" text-anchor="middle" font-size="11" fill="{INK_SOFT}">{name}</text>')
        positions.append((lo, hi, x, bw))
        x += bw
        o.write(f'<line x1="{x:.1f}" y1="{ty}" x2="{x:.1f}" y2="{ty+TH}" stroke="{PAPER}" stroke-width="0.75"/>')
    # marker
    mx = X0
    for lo, hi, bx, bw in positions:
        if lo <= distance <= hi:
            mx = bx + ((distance - lo) / (hi - lo)) * bw
            break
    o.write(f'<line x1="{mx:.1f}" y1="{ty-6}" x2="{mx:.1f}" y2="{ty+TH+6}" stroke="{INK}" stroke-width="2"/>')
    o.write(f'<circle cx="{mx:.1f}" cy="{ty-6}" r="4" fill="{INK}"/>')
    o.write(f'<text x="{mx:.1f}" y="{ty-16}" text-anchor="middle" font-size="13" font-weight="700" fill="{INK}">{distance}</text>')
    o.write(f'<text x="{W/2}" y="{H-8}" text-anchor="middle" font-size="10" fill="{INK_FAINT}">'
            f'No band is better than another. Each one costs something.</text>')
    o.write('</svg>')
    return o.getvalue()


def fleet_svg(counts, estimated=True):
    order = ['TRACTOR', 'BUS', 'JET', 'ROCKET']
    total = sum(counts.values()) or 1
    W, BH, GAP, LAB, TRK = 560, 36, 20, 110, 340
    top = 78 if estimated else 54
    H = top + 4 * (BH + GAP) + 10
    o = io.StringIO()
    o.write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="{SANS}">')
    o.write(f'<rect width="{W}" height="{H}" fill="{PAPER}"/>')
    y0 = 0
    if estimated:
        o.write(f'<rect x="0" y="0" width="{W}" height="24" fill="{PAPER_WARM}"/>')
        o.write(f'<rect x="0" y="0" width="3" height="24" fill="{GOLD}"/>')
        o.write(f'<text x="12" y="16" font-size="11" fill="{INK_SOFT}">'
                f'Based on your estimate of your team, not on their own results.</text>')
        y0 = 34
    # balance strip
    o.write(f'<text x="{LAB}" y="{y0+12}" font-size="11" fill="{INK_SOFT}">Your fleet at a glance</text>')
    sx = LAB
    for name in order:
        seg = (counts[name] / total) * TRK
        if seg > 0:
            o.write(f'<rect x="{sx:.1f}" y="{y0+20}" width="{seg:.1f}" height="12" fill="{STYLE[name]["p"]}"/>')
            sx += seg
    for i, name in enumerate(order):
        y = top + i * (BH + GAP)
        c = counts[name]
        pct = round(c / total * 100)
        col = STYLE[name]['p']
        dominant = pct >= 50
        missing = c == 0
        thin = 0 < pct <= 15
        suffix = ' — dominant' if dominant else (' — none' if missing else (' — thin' if thin else ''))
        lab_col = INK_FAINT if missing else STYLE[name]['d']
        o.write(f'<text x="{LAB-12}" y="{y+BH/2+5:.0f}" text-anchor="end" font-size="13" '
                f'font-weight="600" fill="{lab_col}">{name}</text>')
        if missing:
            o.write(f'<rect x="{LAB}" y="{y}" width="{TRK}" height="{BH}" rx="2" fill="none" '
                    f'stroke="{col}" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>')
        else:
            o.write(f'<rect x="{LAB}" y="{y}" width="{TRK}" height="{BH}" rx="2" fill="{PAPER_WARM}"/>')
            w = max(4, (c / total) * TRK)
            op = '0.6' if thin else '1'
            o.write(f'<rect x="{LAB}" y="{y}" width="{w:.1f}" height="{BH}" rx="2" fill="{col}" opacity="{op}"/>')
            if dominant:
                o.write(f'<rect x="{LAB}" y="{y}" width="{w:.1f}" height="{BH}" rx="2" fill="none" '
                        f'stroke="{STYLE[name]["d"]}" stroke-width="2"/>')
        o.write(f'<text x="{LAB+TRK+12}" y="{y+BH/2:.0f}" font-size="15" font-weight="700" fill="{INK}">{c}</text>')
        o.write(f'<text x="{LAB+TRK+12}" y="{y+BH/2+15:.0f}" font-size="11" fill="{INK_SOFT}">{pct}%</text>')
        if suffix:
            o.write(f'<text x="{LAB+TRK+48}" y="{y+BH/2+5:.0f}" font-size="11" fill="{lab_col}">{suffix.strip(" —")}</text>')
    o.write('</svg>')
    return o.getvalue()


OUT = '/mnt/user-data/outputs'
os.makedirs(OUT, exist_ok=True)

# Sample: a Tractor who moves toward Rocket under pressure
g = grid_svg(pace=32, priority=28, p_pace=68, p_priority=22,
             style='TRACTOR', pressure_style='ROCKET')
open(f'{OUT}/imprint_grid_sample.svg', 'w').write(g)

b = blend_svg([('TRACTOR', 61), ('ROCKET', 18), ('BUS', 15), ('JET', 6)])
open(f'{OUT}/imprint_blend_sample.svg', 'w').write(b)

r = range_svg(37)
open(f'{OUT}/imprint_range_sample.svg', 'w').write(r)

f = fleet_svg({'TRACTOR': 9, 'BUS': 5, 'JET': 3, 'ROCKET': 0}, estimated=True)
open(f'{OUT}/imprint_fleet_sample.svg', 'w').write(f)

print('4 sample SVGs written')
