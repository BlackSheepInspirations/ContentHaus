#!/usr/bin/env node
/* ============================================================
   Prompt to Profit Haus — port pipeline.
   Regenerates the three GENERATED files from the standalone app:
     assets/p2p-haus.css   <- css/style.css   (selector-scoped)
     assets/p2p-haus.js    <- js/script.js    (embed-adapted)
     sections/p2p-haus.liquid <- index.html   (assembled + gated)
   Hand-maintained files (p2p-haus-preview.liquid, haus-links.liquid,
   templates/*, this script) are NOT touched.

   Run:  node tools/port.js
   Standalone source dir is resolved below; override with $P2P_STANDALONE.
   ============================================================ */
const fs = require("fs");
const path = require("path");

const STD = process.env.P2P_STANDALONE
  || "/Users/blacksheepcreations/Desktop/prompt-to-profit-generator";
const REPO = path.resolve(__dirname, "..");

const SRC_CSS = path.join(STD, "css/style.css");
const SRC_JS = path.join(STD, "js/script.js");
const SRC_HTML = path.join(STD, "index.html");
const OUT_CSS = path.join(REPO, "assets/p2p-haus.css");
const OUT_JS = path.join(REPO, "assets/p2p-haus.js");
const OUT_LIQUID = path.join(REPO, "sections/p2p-haus.liquid");

const SCOPE = "#p2p-haus-app";
const HOSTS = "#p2p-haus-app,\n.p2p-locked,\n.p2p-preview";
const KEYFRAMES = ["opalDrift", "opalText", "ticker-scroll"];

/* ---------- 1. CSS scoper ---------- */
function findStringEnd(css, i) {
  const q = css[i];
  let j = i + 1;
  while (j < css.length) {
    if (css[j] === "\\") { j += 2; continue; }
    if (css[j] === q) return j;
    j++;
  }
  return css.length - 1;
}
function parseNodes(css) {
  const nodes = [];
  let i = 0, buf = "";
  const n = css.length;
  while (i < n) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      if (buf.trim()) { nodes.push({ type: "text", text: buf }); buf = ""; }
      nodes.push({ type: "comment", text: css.slice(i, stop) });
      i = stop; continue;
    }
    if (ch === '"' || ch === "'") {
      const end = findStringEnd(css, i);
      buf += css.slice(i, end + 1); i = end + 1; continue;
    }
    if (ch === "{") {
      const prelude = buf.trim(); buf = "";
      let depth = 1, j = i + 1;
      while (j < n && depth > 0) {
        const c = css[j];
        if (c === "/" && css[j + 1] === "*") { const e = css.indexOf("*/", j + 2); j = e === -1 ? n : e + 2; continue; }
        if (c === '"' || c === "'") { j = findStringEnd(css, j) + 1; continue; }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
      nodes.push({ type: "block", prelude, body: css.slice(i + 1, j - 1) });
      i = j; continue;
    }
    if (ch === ";") {
      const stmt = (buf + ";").trim(); buf = "";
      if (stmt !== ";") nodes.push({ type: "statement", text: stmt });
      i++; continue;
    }
    buf += ch; i++;
  }
  if (buf.trim()) nodes.push({ type: "text", text: buf.trim() });
  return nodes;
}
function splitSelectors(sel) {
  const out = []; let depth = 0, cur = "";
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function scopeOne(sel) {
  let s = sel.trim();
  if (!s) return s;
  if (/^:root\b/.test(s)) return HOSTS;
  s = s.replace(/^html\b/, SCOPE).replace(/^body\b/, SCOPE);
  if (s.startsWith(SCOPE)) return s;
  if (s === "*") return SCOPE + ",\n" + SCOPE + " *";
  if (s.startsWith("*")) return SCOPE + " " + s;
  return SCOPE + " " + s;
}
function scopeSelectorList(prelude) {
  return splitSelectors(prelude).map(scopeOne).join(",\n");
}
function transformCss(nodes, indent) {
  const pad = "  ".repeat(indent);
  let out = "";
  for (const node of nodes) {
    if (node.type === "comment" || node.type === "statement" || node.type === "text") {
      out += pad + node.text + "\n"; continue;
    }
    if (node.type === "block") {
      const p = node.prelude;
      if (/^@(media|supports|container|layer)\b/i.test(p)) {
        out += pad + p + " {\n" + transformCss(parseNodes(node.body), indent + 1) + pad + "}\n";
      } else if (/^@(keyframes|-webkit-keyframes|font-face|page|counter-style|font-feature-values)\b/i.test(p)) {
        out += pad + p + " {" + node.body.replace(/\s+$/, "") + "\n" + pad + "}\n";
      } else {
        out += pad + scopeSelectorList(p) + " {" + node.body.replace(/\s+$/, "") + "\n" + pad + "}\n";
      }
      out += "\n";
    }
  }
  return out;
}
const CSS_FOOTER = `

/* =========================================================
   LOCKED STATE + PREVIEW PAGE  (Shopify-only, hand-authored)
   ========================================================= */

.p2p-locked,
.p2p-preview__hero {
  position: relative; overflow: hidden;
  max-width: var(--content-width); margin: 24px auto;
  padding: clamp(48px, 8vw, 104px) clamp(24px, 5vw, 72px);
  border-radius: var(--radius-large);
  background:
    radial-gradient(60% 90% at 12% -10%, rgba(39, 174, 110, 0.30), transparent 55%),
    radial-gradient(55% 85% at 88% 6%, rgba(37, 99, 235, 0.22), transparent 55%),
    radial-gradient(55% 80% at 62% 112%, rgba(214, 51, 108, 0.18), transparent 55%),
    radial-gradient(45% 70% at 34% 118%, rgba(91, 60, 140, 0.18), transparent 55%),
    linear-gradient(150deg, #0a0f0c 0%, #101613 46%, #0c1310 100%);
  color: #e8f3ee; text-align: center; font-family: var(--font-body);
}
.p2p-locked::after,
.p2p-preview__hero::after {
  content: ""; position: absolute; inset: -60%; z-index: 0;
  background: var(--opal-fire); background-size: 220% 220%;
  opacity: 0.14; mix-blend-mode: screen; filter: blur(48px);
  pointer-events: none; animation: p2p-opalDrift 16s ease-in-out infinite;
}
.p2p-locked > *,
.p2p-preview__hero > * { position: relative; z-index: 1; }
.p2p-locked__family,
.p2p-preview__eyebrow {
  display: block; margin: 0 0 14px; font-family: var(--font-mono);
  font-size: 0.66rem; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: #7fe3b8;
}
.p2p-locked__heading,
.p2p-preview__heading {
  margin: 0 auto; max-width: 20ch; font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; line-height: 1.05;
  letter-spacing: -0.02em; text-wrap: balance;
}
.p2p-locked__heading .accent,
.p2p-preview__heading .accent {
  background: var(--opal-fire); background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  animation: p2p-opalText 11s ease-in-out infinite;
}
.p2p-locked__body,
.p2p-preview__sub {
  max-width: 54ch; margin: 18px auto 0; color: #c9e6d8;
  font-size: 1.08rem; line-height: 1.6;
}
.p2p-locked__actions,
.p2p-preview__actions {
  margin-top: 32px; display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
}
.p2p-locked__btn,
.p2p-preview__btn {
  display: inline-flex; align-items: center; font-family: var(--font-body);
  font-weight: 700; font-size: 0.98rem; padding: 14px 26px;
  border-radius: var(--radius-pill); text-decoration: none;
  transition: transform 0.14s ease, filter 0.14s ease, border-color 0.14s ease, color 0.14s ease;
}
.p2p-locked__btn--get,
.p2p-preview__btn--get {
  background: linear-gradient(135deg, #27ae6e, #1e8e5a); color: #ffffff;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12), 0 14px 30px rgba(30, 142, 90, 0.35);
}
.p2p-locked__btn--get:hover,
.p2p-preview__btn--get:hover { transform: translateY(-1px); filter: brightness(1.05); }
.p2p-locked__btn--learn,
.p2p-preview__btn--learn {
  background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.28); color: #e8f3ee;
}
.p2p-locked__btn--learn:hover,
.p2p-preview__btn--learn:hover { border-color: var(--color-gold); color: #e3cd86; }
.p2p-preview {
  font-family: var(--font-body); color: var(--color-text);
  background:
    radial-gradient(circle at top left, rgba(30, 142, 90, 0.08), transparent 34%),
    var(--color-background);
  padding-bottom: clamp(48px, 8vw, 96px);
}
.p2p-preview__grid {
  width: min(100%, var(--content-width)); margin: clamp(32px, 5vw, 56px) auto 0;
  padding: 0 clamp(20px, 4vw, 40px); display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px;
}
.p2p-preview__card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: var(--radius-medium); padding: 24px; box-shadow: var(--shadow-small);
}
.p2p-preview__card h3 {
  margin: 0 0 8px; font-family: var(--font-display); font-size: 1.12rem;
  font-weight: 700; color: var(--color-text);
}
.p2p-preview__card p { margin: 0; color: var(--color-text-muted); font-size: 0.96rem; line-height: 1.55; }
.p2p-preview__card::before {
  content: ""; display: block; width: 34px; height: 3px; border-radius: 3px;
  margin-bottom: 14px; background: var(--opal-fire);
}
`;
function buildCss() {
  const src = fs.readFileSync(SRC_CSS, "utf8");
  let css = transformCss(parseNodes(src), 0);
  for (const name of KEYFRAMES) {
    css = css.replace(new RegExp("\\b" + name.replace(/[-]/g, "\\-") + "\\b", "g"), "p2p-" + name);
  }
  const header =
`/* ============================================================
   The Prompt to Profit Haus — scoped stylesheet.
   GENERATED by tools/port.js from the standalone css/style.css and
   scoped under #p2p-haus-app. Do not hand-edit — re-run the porter.
   ============================================================ */
`;
  fs.writeFileSync(OUT_CSS, header + css + CSS_FOOTER);
  const full = header + css + CSS_FOOTER;
  const bal = (full.match(/{/g) || []).length === (full.match(/}/g) || []).length;
  return { bytes: full.length, balanced: bal, leaks: (css.match(/\n(body|html)\s*[,{]/g) || []).length };
}

/* ---------- 2. JS embed-porter ---------- */
function buildJs() {
  let js = fs.readFileSync(SRC_JS, "utf8");
  const scrollBlock =
`// Always open at the top on load/refresh (don't let the browser restore scroll).
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

`;
  const hadScroll = js.includes(scrollBlock);
  js = js.replace(scrollBlock, "");
  const initOld = 'document.addEventListener("DOMContentLoaded", initializeApplication);';
  const initNew =
`if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApplication);
} else {
  // Deferred script runs at readyState "interactive"; a theme-editor AJAX
  // re-render arrives at "complete". Defer to a macrotask so this file finishes
  // evaluating its own top-level const/let before init touches them (TDZ).
  setTimeout(initializeApplication, 0);
}`;
  const hadInit = js.includes(initOld);
  js = js.replace(initOld, initNew);
  const banner =
`/* GENERATED by tools/port.js from the standalone js/script.js.
   Embed deltas: no history.scrollRestoration override; readyState-guarded
   init. Do not hand-edit — re-run the porter. */
`;
  js = js.replace('"use strict";', '"use strict";\n' + banner);
  fs.writeFileSync(OUT_JS, js);
  return { bytes: js.length, hadScroll, hadInit };
}

/* ---------- 3. Liquid assembler ---------- */
function buildLiquid() {
  const html = fs.readFileSync(SRC_HTML, "utf8");
  const bodyOpen = html.indexOf(">", html.indexOf("<body")) + 1;
  const scriptIdx = html.indexOf('<script src="js/script.js"');
  if (bodyOpen <= 0 || scriptIdx < 0) throw new Error("body/script boundaries not found");
  let markup = html.slice(bodyOpen, scriptIdx).trim()
    .replace('poster="assets/how-to-poster.jpg"', "poster=\"{{ 'how-to-poster.jpg' | asset_url }}\"")
    .replace('src="assets/how-to.mp4"', "src=\"{{ 'how-to.mp4' | asset_url }}\"");
  const indented = markup.split("\n").map(l => (l.length ? "    " + l : l)).join("\n");

  const out = `{% comment %}
  The Prompt to Profit Haus — main tool section (the "crown jewel").
  GENERATED by tools/port.js from the standalone index.html. The gate,
  asset loading, locked state, and schema are defined here; the tool markup
  is the standalone body. Hand-edit the standalone + re-run the porter.
  Gated on customer.tags contains section.settings.access_tag (case-insensitive),
  with a request.design_mode bypass for the theme editor.
{% endcomment %}

{% comment %} Case-insensitive tag match — Shopify doesn't reliably preserve
   tag case, and Liquid contains is case-sensitive. {% endcomment %}
{% assign p2p_access = false %}
{% assign p2p_wanted = section.settings.access_tag | strip | downcase %}
{% if customer %}
  {% for p2p_t in customer.tags %}
    {% assign p2p_t_norm = p2p_t | strip | downcase %}
    {% if p2p_t_norm == p2p_wanted %}
      {% assign p2p_access = true %}
      {% break %}
    {% endif %}
  {% endfor %}
{% endif %}
{% if request.design_mode %}
  {% assign p2p_access = true %}
{% endif %}

<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=general-sans@600,700,800&f[]=switzer@400,500,600,700&display=swap" rel="stylesheet">
{{ 'p2p-haus.css' | asset_url | stylesheet_tag }}

{% if p2p_access %}
  <div id="p2p-haus-app" class="p2p-app" data-section-id="{{ section.id }}" style="--rail-sticky-top: {{ section.settings.sticky_offset | default: 96 }}px;">
${indented}
  </div>

  <script src="{{ 'p2p-haus.js' | asset_url }}" defer="defer"></script>
{% else %}
  <div class="p2p-locked">
    <span class="p2p-locked__family">Black Sheep Creations &amp; Inspirations</span>
    <h2 class="p2p-locked__heading">{{ section.settings.locked_heading }}</h2>
    <div class="p2p-locked__body">{{ section.settings.locked_body }}</div>
    <div class="p2p-locked__actions">
      {% if section.settings.access_product %}
        <a href="{{ section.settings.access_product.url }}" class="p2p-locked__btn p2p-locked__btn--get">
          Get the Access Pass{% if section.settings.access_product.price %} — {{ section.settings.access_product.price | money }}{% endif %}
        </a>
      {% endif %}
      {% if section.settings.learn_more_url != blank %}
        <a href="{{ section.settings.learn_more_url }}" class="p2p-locked__btn p2p-locked__btn--learn">See what's inside</a>
      {% endif %}
    </div>
  </div>
{% endif %}

{% render 'haus-links', current: 'p2p-haus' %}

{% schema %}
{
  "name": "Prompt to Profit Haus",
  "settings": [
    { "type": "header", "content": "Access control" },
    {
      "type": "text",
      "id": "access_tag",
      "label": "Access tag",
      "default": "P2P-haus-access",
      "info": "Customer tag that unlocks the tool (matched case-insensitively). Must match the tag your Shopify Flow adds on purchase."
    },
    {
      "type": "product",
      "id": "access_product",
      "label": "Access Pass product",
      "info": "Shown as the Get Access button for visitors who don't have the tag yet."
    },
    {
      "type": "url",
      "id": "learn_more_url",
      "label": "Preview / learn-more URL",
      "info": "Where the locked-state secondary button points (e.g. /pages/p2p-haus-preview)."
    },
    { "type": "header", "content": "Layout" },
    {
      "type": "range",
      "id": "sticky_offset",
      "label": "Sticky rail top offset",
      "min": 0, "max": 200, "step": 4, "unit": "px", "default": 96,
      "info": "Space above the sticky \\"Your Pack\\" rail so it clears your sticky theme header. Increase if the rail hides under the header."
    },
    { "type": "header", "content": "Locked-state copy" },
    {
      "type": "text",
      "id": "locked_heading",
      "label": "Locked heading",
      "default": "Your launch to <span class=\\"accent\\">Profit</span> starts here."
    },
    {
      "type": "textarea",
      "id": "locked_body",
      "label": "Locked body",
      "default": "The Prompt to Profit Haus turns your product into a full, on-brand launch kit — copy, social, images, video, and a day-by-day PROFIT Path plan. Unlock it with the Access Pass."
    }
  ],
  "presets": [{ "name": "Prompt to Profit Haus" }]
}
{% endschema %}
`;
  fs.writeFileSync(OUT_LIQUID, out);
  const schema = out.match(/\{% schema %\}([\s\S]*?)\{% endschema %\}/)[1];
  let schemaOk = true;
  try { JSON.parse(schema); } catch (e) { schemaOk = e.message; }
  return { bytes: out.length, schemaOk, markupLines: markup.split("\n").length };
}

/* ---------- run ---------- */
const css = buildCss();
const js = buildJs();
const liquid = buildLiquid();
console.log("CSS   :", OUT_CSS.split("/assets/")[1], "|", css.bytes, "bytes | braces", css.balanced ? "OK" : "MISMATCH", "| leaks", css.leaks);
console.log("JS    :", OUT_JS.split("/assets/")[1], "|", js.bytes, "bytes | scrollBlock", js.hadScroll ? "removed" : "NOT FOUND", "| init", js.hadInit ? "guarded" : "NOT FOUND");
console.log("LIQUID:", OUT_LIQUID.split("/sections/")[1], "|", liquid.bytes, "bytes |", liquid.markupLines, "markup lines | schema", liquid.schemaOk === true ? "VALID" : "INVALID: " + liquid.schemaOk);
if (!css.balanced || css.leaks || !js.hadScroll || !js.hadInit || liquid.schemaOk !== true) {
  console.error("\n⚠️  One or more checks failed — inspect before deploying.");
  process.exit(1);
}
console.log("\n✓ Port complete. Sync assets/p2p-haus.{css,js} + sections/p2p-haus.liquid to the theme folder and shopify theme push.");
