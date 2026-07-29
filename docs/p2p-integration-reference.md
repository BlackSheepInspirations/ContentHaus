# P2P Launch System — Integration Reference

Standing reference for whoever (or whichever Claude Code session) is building
the Prompt 2 Profit (P2P) Launch System and needs to know how it plugs into
the existing 5 Hausen (Content/Prompt Haus, Project Haus, Graphics Haus,
Marketing Haus, Brand Haus). Written so it can be handed to a *different*
Claude Code session that doesn't share this conversation's context — point it
at this file (or paste it in) instead of re-deriving these facts from scratch.

## 1. Repo & deploy mechanism — read this before assuming a CI/CD pipeline

- This repo's GitHub remote is `https://github.com/BlackSheepInspirations/ContentHaus.git`
  (confirmed via `git remote -v`). All 5 Hausen's source code lives and is
  developed here. **P2P's code belongs in this repo too.**
- **There is no GitHub → Shopify continuous deployment.** Confirmed directly:
  no `.github/workflows` in this repo, and the local folder the live theme
  actually deploys from (`/Users/blacksheepcreations/BSC-BSI-Store-theme`) has
  **no `.git` directory at all** — it's a plain folder, not a repo.
- The real, current deploy path (used for every live push this whole build):
  1. Edit/build in this repo (`ContentHaus`).
  2. Copy the changed files into `/Users/blacksheepcreations/BSC-BSI-Store-theme`
     (a plain synced copy of the theme, same relative paths — `assets/`,
     `sections/`, etc.).
  3. From that folder, run:
     ```bash
     shopify theme push --theme 186593542462 --allow-live
     ```
     (Shopify CLI 4.5.2, store `blacksheepcreationsllc.myshopify.com`, theme
     `BSC+BSI Store — Prompt Haus`, theme ID `186593542462`.)
- Anything P2P needs to go live has to follow this same two-hop path — sync
  the built files into the theme-copy folder, then `shopify theme push` from
  there. There's no merge-to-main-and-it-deploys shortcut today.

## 2. Shopify embed method

Every Haus is a **native Shopify section** (`sections/*.liquid`), not an
iframe:

- The section renders a plain mount div, e.g. `<div id="brand-haus-app" data-section-id="{{ section.id }}"></div>`.
- Access is gated in Liquid: `{% if customer and customer.tags contains section.settings.access_tag %}` with a `{% if request.design_mode %}` bypass so the theme editor always shows the unlocked tool.
- Below the gate, a chain of plain `<script src="{{ 'file.js' | asset_url }}" defer="defer"></script>` tags loads a **vanilla JS app — no bundler, no build step, no React**. Load order matters (later files depend on earlier ones being on `window.HausNamespace` already).
- The JS app does `root.innerHTML = ""` and rebuilds the whole panel from scratch into that div on every state change (simple re-render-the-world pattern, not a vdom diff).
- Each Haus's CSS is a single stylesheet loaded via `{{ 'haus-name.css' | asset_url | stylesheet_tag }}` above the gate (so the locked/marketing state is styled too).

P2P should follow this identical shape: one `sections/p2p-haus.liquid` (or
similar), one mount div, its own access tag, its own script chain, its own
CSS file — same pattern as `sections/brand-haus.liquid` (good reference file
to open directly).

## 3. Brand Kit cross-Haus sharing — the actual mechanism, use it, don't reinvent it

**Brand Haus is the authoritative source.** Every other Haus reads from it
read-only via one shared `localStorage` key. Confirmed directly from source:

| Haus | Own private key | Participates in shared vault? |
|---|---|---|
| Brand Haus | `brandHausBrandKits` | **Writes** the shared vault on every save |
| Marketing Haus | `marketingHausBrandKits` | Reads shared vault (read-only) |
| Graphics Haus | `graphicsHausBrandKits` | Reads shared vault (read-only) |
| Project Haus | `productHausBrandKits` | Reads shared vault (read-only) |
| Content/Prompt Haus | `promptHausBrandKits` | Does **not** participate |

Shared key: **`blackSheepBrandKitVault`**, shape:

```json
{
  "brandHausKits": [
    {
      "id": "...",
      "source": "brandHaus",
      "name": "...",
      "savedAt": "...",
      "colors": ["#hex", "..."],
      "headingFont": "Font Name",
      "bodyFont": "Font Name",
      "mood": "string",
      "voice": "string",
      "coreValues": ["...", "..."],
      "mission": "string"
    }
  ]
}
```

Brand Haus writes this (flattened plain values, no internal field-object
shape) every time its own `brandHausBrandKits` is saved — see
`writeSharedVault()` in `assets/brand-haus-brandkit.js`. Every consumer Haus
reads it read-only and maps it into its own local field shape — see
`readSyncedKits()` in `assets/marketing-haus-brandkit.js` (or the Graphics/
Project Haus equivalents — same pattern, verbatim-ported).

**For P2P**: read `blackSheepBrandKitVault` the same read-only way. Don't
write to it (that would make Brand Haus not the single source of truth
anymore), and don't invent a second sharing channel — this one already
exists and every other Haus already trusts it.

## 4. Palette & fonts — corrected against actual source (not assumed)

There is **no terracotta, sage, or amber** anywhere in this codebase — checked
every Haus's CSS directly. The real shared base palette (same 5 values,
repeated per-Haus as `--[prefix]-*` custom properties):

| Token | Value |
|---|---|
| Cream | `#F2F0EB` (Content/Prompt Haus uses `#FAF6EF` instead) |
| Black | `#1A1815` |
| Gold | `#C9A84C` |
| Teal | `#0D7377` |
| Charcoal | `#2E2A26` |

Each Haus then has one unique accent color, oddly still all named
`--[prefix]-espresso` regardless of the actual hue:

| Haus | CSS prefix | Accent (`--*-espresso`) |
|---|---|---|
| Content/Prompt Haus | `ph-` | `#3C2A21` (brown) |
| Project Haus | `pdh-` | `#2563EB` (blue) |
| Graphics Haus | `gh-` | `#5B3C8C` (purple) |
| Marketing Haus | `mh-` | `#D6336C` (pink/magenta) |
| Brand Haus | `bh-` | `#0D7377` (teal — same as its own base teal; overridden dynamically per matched brand-archetype profile elsewhere in Brand Haus) |

**Known flaw, not a spec**: Marketing Haus's own `--mh-gold` is actually
`#6B6860` (grayish) — a mislabeled leftover from an earlier port, not real
gold. Don't copy that value on purpose.

**Fonts**: Branding Studio's font list is `Georgia, Helvetica, Arial, Times
New Roman, Courier New` (web-safe) plus `Playfair Display, Merriweather,
Lora, Montserrat, Poppins, Inter, Open Sans, Caveat, Dancing Script, Pacifico,
Sacramento, Bebas Neue, Oswald, Abril Fatface, Roboto Mono` (Google Fonts,
loaded dynamically). Lora and Open Sans are real, valid options in that list
— but there's no single locked "Black Sheep" font pairing. Whatever pairing
gets used should come from reading the *actual active* Brand Kit's
`headingFont`/`bodyFont` off the shared vault (§3), not a hardcoded default.

## 5. Naming/branding convention (context for the "Black Sheep Way" framing decision)

Every existing Haus shares one consistent identity: the eyebrow
`BLACK SHEEP CREATIONS & INSPIRATIONS` above an `H1` reading "The AI
Creator's [X] Haus." This is a plain convention, not a strict rule — whether
P2P sits inside that same pattern or carries its own distinct launch-system
identity is a brand/positioning call, not a technical constraint. (One data
point, not a mandate: every existing product already carries its own visual
identity under that shared eyebrow, so a second full "Black Sheep Way"
narrative layered on top of P2P specifically would be new territory, not
existing precedent.)

## 6. Access control pattern

Each Haus gates on its own `customer.tags contains "<haus>-access"` tag,
added by a dedicated Shopify Flow ("Order paid" → tag customer) tied to its
own one-time-purchase access product — see
`docs/product-haus-access-control-setup.md` for the exact Shopify Admin
checklist (product → Flow → two pages → section settings → test). P2P should
get its own access tag (e.g. `p2p-haus-access`) and its own Flow/product,
completely independent of the other 4 — same reasoning as why Project Haus's
tag is separate from Marketing Haus's: a customer can own any subset
independently.

## 7. General architecture conventions worth knowing

- **"Verbatim port, never shared"**: every Haus has its own copy of shared
  logic (util/engine/brandkit/looklock/generators) under its own namespace
  and CSS prefix, rather than one shared script multiple Hausen import. This
  is deliberate — these are separate gated purchases, and cross-contamination
  risk between two live, independently-sold products is treated as worse than
  the code duplication. P2P should follow the same isolation, even where it
  reuses another Haus's pattern closely.
- No shared JS runtime state between Hausen at all — the *only* cross-Haus
  channel that exists is the one `localStorage` key in §3. Everything else
  (Vault/Recent Log, Style DNA, generator state) is fully namespaced per Haus.
- Plain `window.<HausName> = window.<HausName> || {}` namespacing (e.g.
  `window.BrandHaus`, `window.MarketingHaus`) — each Haus's own modules
  attach onto that one object as they load in order.

## 8. As-built (port completed 2026-07-26) — what actually shipped

The P2P port is done and committed to this repo on branch `p2p-haus-port`
(commit `8cb6643`). It was verified in a simulated theme page (booted on its
own, zero console errors, zero CSS leakage onto host theme chrome, the
pill→native-select contract intact). Files:

| File | Role |
|---|---|
| `assets/p2p-haus.css` | Full stylesheet, **scoped to `#p2p-haus-app`** |
| `assets/p2p-haus.js` | The complete app (single file), embed-safe |
| `sections/p2p-haus.liquid` | Gated tool section |
| `sections/p2p-haus-preview.liquid` | Ungated teaser page |
| `snippets/haus-links.liquid` | (modified) adds the P2P "crown jewel" pill |

**Intentional deviations from §2 / §6 above — P2P is NOT a verbatim clone of
the sibling pattern, and that's on purpose:**

- **Not the `root.innerHTML=""` re-render pattern.** P2P was a mature
  standalone app (static HTML + in-place incremental DOM updates). The port
  keeps that: the **full markup lives inside the mount** `#p2p-haus-app`
  (embedded in the `.liquid`), and `p2p-haus.js` enhances it in place. It
  does **not** wipe and rebuild the panel.
- **One JS file, not a script chain.** `p2p-haus.js` is self-contained (no
  `window.<Haus>` namespace object, no load-order dependency chain).
- **CSS is scoped by selector-prefixing, not just a `--prefix-` convention.**
  Every rule in `p2p-haus.css` is prefixed `#p2p-haus-app …`; `:root` tokens
  moved to `#p2p-haus-app, .p2p-locked, .p2p-preview`; keyframes namespaced
  `p2p-*`. This is what guarantees no leakage in either direction, since the
  standalone stylesheet had bare `body`/`button`/`*` selectors.
- **Init is `readyState`-guarded and deferred** (not a bare
  `DOMContentLoaded` listener, not a synchronous call). A synchronous call
  from the top of the file under `<script defer>` hit a temporal-dead-zone
  error (top-level `const`s not yet initialized); `setTimeout(init, 0)` on
  the already-parsed branch fixes it. Keep this if regenerating.

**Corrections to earlier assumptions:**

- **Access tag is `P2P-haus-access` — exact case** (owner-specified), not the
  lowercase `p2p-haus-access` guessed in §6. Liquid `contains` is
  case-sensitive; the Shopify Flow must add this exact string.
- **P2P storage keys:** namespaced under `promptToProfit.*`
  (`promptToProfit.currentProject`, `.productProfiles`, `.brandProfiles`,
  `.savedPackages`, `.recentGenerations`) and it reads
  `blackSheepBrandKitVault` **read-only** per §3. P2P does **not** use
  `promptHausBrandKits` — that key belongs to Content/Prompt Haus (§3);
  reusing it would collide. (An earlier note suggesting `promptHausBrandKits`
  for P2P was wrong.)
- **Palette:** P2P is the deliberate exception to §4's one-accent rule — the
  approved "crown jewel." Base stays family cream `#F2F0EB` / black `#1A1815`
  / gold `#C9A84C`, but its signature is **"Black Opal"**: emerald `#1E8E5A`
  / bright `#27AE6E` as the working accent, plus `--opal-fire`, a gradient
  that sequences every sibling accent (emerald→teal→blue→violet→magenta→gold)
  across a dark opal-black stone, used on the hero, wordmark accent, and key
  moments.

**Handles / product (owner-confirmed):** tool page `/pages/p2p-haus`,
preview `/pages/p2p-haus-preview`, product `/products/p2p-access-pass`.

**Files that go live (7 + 2 templates):** `assets/p2p-haus.css`,
`assets/p2p-haus.js`, `assets/how-to.mp4`, `assets/how-to-poster.jpg`,
`sections/p2p-haus.liquid`, `sections/p2p-haus-preview.liquid`,
`snippets/haus-links.liquid`, **and — required, easy to forget —**
`templates/page.p2p-haus.json` + `templates/page.p2p-haus-preview.json`.
Each is `{ "sections": { "main": { "type": "<section>" } }, "order": ["main"] }`.
Without the page templates, the section never appears in a page's "Theme
template" dropdown in Admin, so there's nothing to assign. Every sibling has
its own `page.<haus>.json` pair — match that.

Shopify gotcha hit during this port: **section schema `name` max is 25 chars.**
Preview is `"P2P Haus Preview"` (main is `"Prompt to Profit Haus"`, 21).

**Deploy (follows §1's two-hop exactly):**

1. Sync all of the above (same relative paths) into
   `/Users/blacksheepcreations/BSC-BSI-Store-theme`. The video box shows the
   `how-to.mp4` poster until the owner swaps in their real clip.
2. From that folder:
   `shopify theme push --store blacksheepcreationsllc.myshopify.com --theme 186593542462 --allow-live --only <each file>`
   (`--only` scopes the push so the stale/partial theme copy can't clobber
   other live files).

**Then in Shopify Admin (owner-only, UI):**

- Page `/pages/p2p-haus` → **Theme template** dropdown → select **`p2p-haus`**
  → Save. Then *Customize* → set the section's Access product =
  `p2p-access-pass`, learn-more URL = `/pages/p2p-haus-preview`.
- Page `/pages/p2p-haus-preview` → **Theme template** → **`p2p-haus-preview`**
  → Save. Then *Customize* → Access product + tool URL = `/pages/p2p-haus`.
- Shopify Flow: *Order paid* on the Access Pass → add customer tag
  `P2P-haus-access` (exact case). Model on
  `docs/product-haus-access-control-setup.md`.

**Regenerating after standalone changes:** `p2p-haus.css` and
`sections/p2p-haus.liquid` were machine-generated from the standalone
(`~/Desktop/prompt-to-profit-generator`) by two transform scripts (CSS
selector-scoper + liquid assembler). If the standalone changes materially,
re-run that transform rather than hand-editing the generated files. (Scripts
were run from a scratch dir this session; ask to have them committed to
`docs/` or a `tools/` dir if you want them kept.)
