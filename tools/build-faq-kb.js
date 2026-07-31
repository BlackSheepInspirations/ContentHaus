/* Harvest the FAQ/TIPS content scattered across the Hausen into one keyword-
   searchable KB asset for the Haus Helper. Faithful extraction (no rewriting):
   evals the source array literals + reads the template FAQ blocks. */
const fs = require("fs");
const A = "/Users/blacksheepcreations/AI Creators Prompt Haus/assets";
const T = "/Users/blacksheepcreations/AI Creators Prompt Haus/templates";

// string-aware bracket matcher: given source + index of an opening '[',
// return the full array-literal text through its matching ']'.
function readArray(src, open) {
  let depth = 0, i = open, q = null;
  for (; i < src.length; i++) {
    const c = src[i], p = src[i - 1];
    if (q) { if (c === q && p !== "\\") q = null; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  throw new Error("unbalanced array from " + open);
}
function evalArrayVar(file, varName) {
  const src = fs.readFileSync(file, "utf8");
  const m = src.indexOf("var " + varName + " =");
  if (m < 0) throw new Error(varName + " not found in " + file);
  const open = src.indexOf("[", m);
  // eslint-disable-next-line no-eval
  return eval("(" + readArray(src, open) + ")");
}
const strip = (s) => String(s == null ? "" : s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const KB = [];
const seen = new Set();
const add = (q, a, haus, url) => {
  q = strip(q); a = strip(a);
  if (!q || !a) return;
  const key = q.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (seen.has(key)) return; // dedupe by normalized question (UI FAQ vs template FAQ overlap)
  seen.add(key);
  KB.push({ q, a, haus, url: url || null });
};

// --- Content Haus: FAQ_ITEMS ({q,a}) + TIPS (strings) ---
evalArrayVar(`${A}/prompt-builder-ui.js`, "FAQ_ITEMS").forEach((it) => add(it.q, it.a, "Content Haus", "/pages/content-haus"));
evalArrayVar(`${A}/prompt-builder-ui.js`, "TIPS").forEach((tip, i) =>
  add("Tip for better prompts (" + (i + 1) + ")", tip, "Content Haus", "/pages/content-haus"));

// --- Brand Haus: FAQ_ITEMS ---
evalArrayVar(`${A}/brand-haus-ui.js`, "FAQ_ITEMS").forEach((it) => add(it.q, it.a, "Brand Haus", "/pages/brand-haus"));

// --- Template FAQ blocks (OS + Brand preview) ---
function templateFaqs(file, haus, url) {
  let j;
  try { j = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error("skip " + file + ": " + e.message); return; }
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    if (o.type === "faq" && o.settings) add(o.settings.question || o.settings.q, o.settings.answer || o.settings.a, haus, url);
    Object.values(o).forEach(walk);
  };
  walk(j);
}
templateFaqs(`${T}/page.p2p-os.json`, "Operating System", "/pages/p2p-os");
templateFaqs(`${T}/page.brand-haus-preview.json`, "Brand Haus", "/pages/brand-haus");

// --- Curated common cross-Haus answers (mirror the Helper's guided nodes so
//     free-typed "how do I start / what's rooted / billing" also resolve) ---
const COMMON = [
  ["How do I get started?", "Work top-to-bottom down your sidebar: take the Founders Assessment, lock your Brand DNA, then Content, Graphics, Project, Marketing, and launch with ROOTED. One step at a time.", "Operating System", "/pages/p2p-os"],
  ["Which Haus should I use?", "Brand Haus for your identity, Content Haus for words and prompts, Graphics Haus for visuals, Project Haus to build a product, Marketing Haus to promote it, Growth Haus to launch and scale.", "Operating System", "/pages/p2p-os"],
  ["What is ROOTED?", "ROOTED is your 6-stage launch method: Reach, Open, Offer, Trigger, Escalate, Deepen. It carries you from ready to launched, and the full course lives in the Evergreens realm.", "Growth Haus", "/pages/p2p-os?v=rooted"],
  ["Is this for me? Am I too non-technical?", "Purpose 2 Profit is built for creators and sellers who want to go from idea to income, especially if you are not techy. Everything is plain language, one step at a time. If you can follow a recipe, you can do this.", "Operating System", "/pages/p2p-os"],
  ["Who are Frank and Ruth (the Haus Mates)?", "Frank (Idea Haus) sparks and sharpens ideas; Ruth (Build Haus) makes them sellable. They are your AI partners, open either any time you are stuck.", "Haus Mates", "/pages/p2p-os?v=mates"],
  ["What is included in my plan / pricing?", "Each Haus is its own tool you can unlock, and the Learning Journey is the full step-by-step course path. For exactly what is in your plan and current pricing, the clearest answer is on that Haus's page, or just ask us.", "Billing", null],
  ["I can't log in / lost access", "A login or access hiccup is almost always a billing blip; updating your payment info usually restores access right away. If not, email us and we will sort it fast.", "Billing", null],
  ["Something isn't working (a bug or glitch)", "Quick fixes that solve most things: refresh the page, try a different browser, or sign out and back in; your progress is saved to your account, not the browser. Still stuck? Tell us what you were doing.", "Billing", null],
  ["How do I cancel or change my plan?", "You are always in control, no hoops. To cancel or change a plan, sign in to your account, or email us and we will take care of it for you.", "Billing", null],
  ["Where is the Learning Journey / courses?", "Your Learning Journey is the gamified course map: realms, courses and badges that teach the whole thing one step at a time.", "Learning Journey", "/pages/p2p-learning"],
];
COMMON.forEach(([q, a, h, u]) => add(q, a, h, u));

// --- Graphics / Project / Marketing Haus have no FAQ_ITEMS arrays of their own,
//     so their answers are curated here so the Helper can field questions about them. ---
const HAUSEN = [
  ["What does Graphics Haus do?", "Graphics Haus builds on-brand visuals and design prompts — clipart, characters, seasonal art, product graphics and more — so you can create a consistent look without a design degree.", "Graphics Haus", "/pages/graphics-haus"],
  ["Do I need design skills to use Graphics Haus?", "No. You make a few plain-language choices and Graphics Haus writes a detailed prompt you paste into any AI image tool. It handles the design language so you don't have to.", "Graphics Haus", "/pages/graphics-haus"],
  ["Will my graphics match my brand?", "Yes — set up your Brand Kit once (colors, fonts, style) and Graphics Haus pulls it in, so every visual comes out on-brand. Save a Look Lock to keep a set consistent.", "Graphics Haus", "/pages/graphics-haus"],
  ["What can I make in Graphics Haus?", "Clipart packs, cute seasonal animals, characters, retro object icons and other on-brand graphics you can sell or use in your products and marketing.", "Graphics Haus", "/pages/graphics-haus"],
  ["What is a Look Lock?", "A Look Lock saves a visual style so everything in a set stays consistent — same palette, mood and art direction — instead of drifting from image to image.", "Graphics Haus", "/pages/graphics-haus"],
  ["What does Project Haus do?", "Project Haus helps you turn an idea into a real, sellable digital product — invitations, devotional and motivation cards, journals, planners and more — step by step.", "Project Haus", "/pages/project-haus"],
  ["What can I build in Project Haus?", "Digital products people actually buy: invitations and stationery, devotional and motivational cards, and other printable or downloadable pieces built around your brand.", "Project Haus", "/pages/project-haus"],
  ["Do I need a finished product idea first?", "Not a finished one. Project Haus walks you from a rough concept to a defined, sellable product, so you can start even if you only have a direction.", "Project Haus", "/pages/project-haus"],
  ["How is Project Haus different from Graphics Haus?", "Graphics Haus makes the visuals; Project Haus assembles them into a finished, sellable product with the copy, structure and details a buyer expects.", "Project Haus", "/pages/project-haus"],
  ["What does Marketing Haus do?", "Marketing Haus creates the pieces that get you seen and sell your work: product mockups, social posts, ads, emails, and sales and listing copy — all tuned to your brand.", "Marketing Haus", "/pages/marketing-haus"],
  ["What can I make in Marketing Haus?", "Product mockups, social graphics and captions, ad copy, email campaigns, sales and listing copy, plus a testimonial formatter for polishing customer quotes.", "Marketing Haus", "/pages/marketing-haus"],
  ["Will my marketing match my brand voice?", "Yes — Marketing Haus pulls in your Brand Kit and Look Lock, so your posts, ads and emails sound and look like you across every channel.", "Marketing Haus", "/pages/marketing-haus"],
  ["Can Marketing Haus write my product listings?", "Yes — it generates SEO-minded listing and sales copy for your storefront, tuned to your product and audience.", "Marketing Haus", "/pages/marketing-haus"],
  ["What is the Testimonial Formatter?", "It turns raw customer feedback into clean, on-brand testimonial quotes and graphics you can drop straight into your marketing.", "Marketing Haus", "/pages/marketing-haus"],
];
HAUSEN.forEach(([q, a, h, u]) => add(q, a, h, u));

const banner = "/* AUTO-GENERATED by tools/build-faq-kb.js — do not hand-edit; run: node tools/build-faq-kb.js\n" +
  "   Haus Helper knowledge base: harvested FAQs/TIPS from the Hausen +\n" +
  "   template FAQ blocks + curated common answers. Regenerate to refresh. */\n";
fs.writeFileSync(`${A}/p2p-faq-kb.js`,
  banner + "window.P2P_FAQ_KB = " + JSON.stringify(KB, null, 0) + ";\n");
console.log("KB entries: " + KB.length);
const byHaus = {}; KB.forEach((k) => byHaus[k.haus] = (byHaus[k.haus] || 0) + 1);
console.log(byHaus);
