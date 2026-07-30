# Purpose 2 Profit — Operating System (OS) Build Plan

> Living doc. Captures Andrea's vision for reworking the P2P Operating System into a
> sidebar-shell "home base" that embeds the Hausen, with a luxe/premium look and
> gamification throughout. Status: **discussion / direction — not yet building.**

## Naming — LOCKED (2026-07-30)

- Brand keeps the stylized aurora **"2" — "Purpose 2 Profit"** (open-trademark route). P2P = Purpose 2 Profit.
- **"PROFIT" is retired everywhere** → replaced by **ROOTED**, the launch framework we teach
  (PLF-adjacent, à la Jeff Walker), emphasized in Realm 5. The Growth Haus holds the generators
  that execute the ROOTED launch. Capstone-ROOTED and Realm-5-ROOTED are the same framework.
- **The crown-jewel generator (`p2p-haus`, `#p2p-haus-app`) becomes "Growth Haus"** — prompt
  generators to execute the ROOTED launch.
- Hero: Andrea will supply a **premium PNG emblem/hero** (no cheesy default) — build the hero to accept an uploaded image.

### Haus map (title → page handle → section/template → access tag)

| Title | Page handle | Section (template) | Access tag |
|---|---|---|---|
| Brand Haus | /pages/brand-haus | brand-haus | brand-haus-access |
| Content Haus | /pages/content-haus | prompt-builder | prompt-haus-access |
| Graphics Haus | /pages/graphics-haus | graphics-haus | graphics-haus-access |
| Project Haus | /pages/product-haus → **project-haus** | product-haus | product-haus-access |
| Marketing Haus | /pages/marketing-haus | marketing-haus | marketing-haus-access |
| Growth Haus | /pages/p2p-haus → **growth-haus** | p2p-haus | P2P-haus-access |

Handle renames wanted: `product-haus → project-haus`, `p2p-haus → growth-haus`. Safe — Shopify auto-creates
a 301 on handle change; we then sweep hardcoded `/pages/...` links (esp. `snippets/haus-links.liquid`,
rendered in all 6 Haus pages + previews) to the new handles. Template/section filenames stay (internal).

## Architecture — LOCKED

- **Rebuild each Haus's standalone page to the luxe look + gamification FIRST**, then the OS embeds
  it. One source per Haus (no duplicate). Embed = iframe of the standalone in an **"embedded mode"**:
  the page detects it's in a frame (`window.self !== window.top`) and hides its own theme chrome +
  `haus-links`, so it renders seamlessly inside the OS content pane. Same-origin, robust.
- **CLAUDE.md** to be updated with the full OS + all six Hausen once P1 lands.

## The shape (sidebar shell)

Persistent left sidebar, main content pane on the right. Clicking a sidebar item
loads that view **inside the OS** (embed). Sidebar top, always visible:

- **Purpose 2 Profit** · "powered by Black Sheep Creations & Inspirations"

### Sidebar order of operations (each = a "view" in the pane)

1. **Your Journey Starts Here** (landing / WOW factor)
   - Hero: full OS title + welcome; theme of individuality — "your fingerprint, you're the spark." Must WOW.
   - Gamified journey map of the steps ahead; **step 1 pre-completed** ("you made it to the site!").
   - **Need Help**: FAQs, tips for better prompts, common mistakes.
   - A reassuring "you've got this" moment — raft → float → sail → thrive.
2. **Checkpoint** (before you leave today)
   - Checklist of things to do in the OS today, ending "ready for next steps."
   - Introduce the Hauses + GPT Companions and where each helps on the journey.
3. **Founders Assessment** (peel OUT of Brand Haus)
   - Include takeaway items + a new **"Find your Direction."**
   - Links into all Hauses; results saveable to the brand vault.
4. **Brand Haus** — brand identity card, logo, brand kit.
   - Upload the brand identity card as a visual reference while working in the OS; keep **version history**.
5. **Transition** — "blueprint + direction done → let's build." Ideas + motivation.
6. **Content Haus**
7. **Graphics Haus**
8. **Project Haus** (rename of Product Haus)
9. **Transition** — "you've built something → let's market it." Include the **ROOTED** launch entry. (needs content direction)
10. **Marketing Haus**
11. **Growth / mindset transition** — continued growth, "mindset matters."
12. **Growth Haus**
13. **ROOTED — Light the Path** (own page; formerly "PROFIT Path")
    - Product readiness checklist, product listing items, launch plan components.
    - **Certificate of Achievement** after all gamified steps: branded, personalizable
      (brand name etc.), download/print, **confetti celebration on first open + a
      "re-celebrate" button.** (Andrea attached example screenshots — NOT yet received.)
14. **Tools & Resources** (separate *tools* from *resources*)
    - Resources: publishing checklists, guides, FAQ reiteration.
    - Tools by type, with optional affiliate links: Canva, Flow, iLoveIMG, OpenART.ai,
      Suno; storefronts: Shopify, Beacons, Stan Store, Gumroad.
15. **Notebook** — titled notes, saveable, with a search bar.
16. **Bonus Resources** — mindset vault (videos + digital downloads); reinforce Purpose
    & Belonging, brand identity rooted in the individual. (open to ideas)

### Below the fold (all collapsed; open on eye-icon; share / copy / download / print like the other Hauses)

- **Brand Kits**
- **Your Vault** (up to 10 items)
- **Recently Generated** (up to 10)
- **Look Lock** (up to 5)
- **Mascot Lock** (up to 3)

## Cross-cutting principles

- **Luxe / premium** look, feel & architecture across ALL Hauses (this is a full rework).
- **Gamification + motivation** woven throughout (reuse the existing P2P points / badges /
  Merit-tier engine as the unified progress track — TBD).
- **Embed** tool views inside the OS shell (Andrea chose embed over navigate).

## Name changes (UI changed; URLs unchanged) — NEEDS MAPPING

New sidebar names: Brand Haus · Content Haus · Graphics Haus · Project Haus ·
Marketing Haus · Growth Haus. Must map each to the existing section/URL. Open: what
"Content Haus" and "Growth Haus" map to today (Prompt Haus? Prompt-to-Profit Haus? new?).

## Open questions (see chat)

1. Embed architecture: iframe existing pages (chrome-strip) vs **rebuild each Haus to
   render natively inside the OS shell** (cleaner, matches the luxe rework).
2. New-name → existing-section/URL map (esp. Content Haus, Growth Haus).
3. Gamification: one unified engine across the OS (recommended) vs per-area.
4. Storage for Vault / Look Lock / Mascot Lock / brand-card version history (localStorage +
   cross-device metafield? size limits).
5. Certificate: separate OS capstone cert vs the existing course certs; re-share the example screenshots.
6. Phase 1 scope + priority order.

## Proposed phasing (draft)

- **P1 — Shell & landing:** ✅ DONE (2026-07-30). Sidebar shell + routing (view/embed/link) +
  "Your Journey Starts Here" landing (hero w/ image slot, live stat strip, gamified step-map w/
  step 1 pre-done, reassurance, FAQ). `sections/p2p-os.liquid` + `templates/page.p2p-os.json`.
  Other views show placeholders until built. Verified in `dev/os-check.html`.
- **P2 — Assessment & Brand:** Checkpoint ✅ DONE. Founders Assessment peel-out plan below.
  Brand Haus embed + brand-card upload/version history (later).
- **P3 — Build Hauses:** Content, Graphics, Project (luxe rework + embed).
- **P4 — Market & Grow:** Marketing Haus, Growth Haus, transitions.
- **P5 — PROFIT Path + Certificate** (confetti, branded, personalizable).
- **P6 — Tools & Resources, Notebook, Bonus Resources.**
- **P7 — Below-the-fold vault modules** (Brand Kits, Vault, Recently Generated, Look/Mascot Lock).
- Luxe restyle applied progressively as each Haus is touched.

## Phase 2b — Founders Assessment peel-out (PLAN, not yet built)

**Key discovery — no extraction needed, and "Find Your Direction" already exists.**
The Brand Haus app (`#brand-haus-app`, orchestrated by `assets/brand-haus-ui.js`) routes by an
internal `activeStep`, and exposes a public navigator **`BrandHaus.ui.setActiveStep(step)`**
(ui.js:2069). `STEPS = ["archetypeGuide","welcome","conversation","brandDNA","blueprint","pathIntake","brandingStudio"]`:

- **`conversation`** → the 30-question **Founders Assessment** (`BrandHaus.founderInterview.renderFull()`)
- **`brandDNA`** → the results / diagnosis (the **takeaways**), `BrandHaus.results.renderStep3()`
- **`pathIntake`** → **"Find Your Direction" ALREADY EXISTS** (`BrandHaus.pathIntake.renderFull()`) — no need to build it new
- `brandingStudio` → Branding Studio (where the assessment "Apply" writes)

So the flagship engine stays the single source; we surface it, we don't rip it out.

**Build steps (execute next session, with visual verification):**
1. New focused page `p2p-assessment` (template + a thin section, or reuse `brand-haus` template with a
   focus flag). It loads the SAME brand-haus JS chain (brand-haus.liquid lines 65–85) + `#brand-haus-app` root.
2. **Boot-into-step hook:** add a minimal, additive check in `brand-haus-ui.js` init — if
   `window.BrandHausInitialStep` (or `#step=conversation` hash) is set, call `setActiveStep(that)` after first
   render. ~3 lines, no behavior change to Brand Haus otherwise. The focused page sets
   `window.BrandHausInitialStep = "conversation"`.
3. **Focused mode (optional):** a body/root class the focused page adds to hide the Brand Haus marketing
   header + sidebar so it reads as a standalone assessment (CSS overrides only). Or rely on OS embedded-mode chrome-hide.
4. OS sidebar **"Founders Assessment"** item → `mode:"embed"`, `target:"/pages/p2p-assessment"` (swap the
   current placeholder). Gate with `brand-haus-access` (or all-access).
5. **Additive OS layers** (build around, not inside the engine): a short "Find your Direction" intro linking to
   `#step=pathIntake`, takeaway cards pulled from the brandDNA results, cross-Haus CTAs, and save-to-vault
   (Brand Haus already has a vault; reuse or mirror into the OS vault modules in P7).

**Risk:** LOW. Only additive changes (a focused page + ~3-line ui.js init hook). Zero deletion/refactor of the
flagship. Must verify visually (the assessment is heavy + stateful) before shipping — do it when the preview works.
