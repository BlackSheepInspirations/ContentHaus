# The AI Creator's Prompt Haus

Private Shopify theme for Black Sheep Creations & Inspirations — a suite of AI prompt-builder apps embedded as theme sections, plus a Netlify serverless function for Gemini-powered image generation.

## Structure

Each "Haus" is an independent, self-contained app living in its own namespace (`assets/<haus>-*.js`, `sections/<haus>.liquid`, `dev/<haus>-preview.html`):

- **Content Haus** (`prompt-builder-*`) — the original app: Character, Couples, Friends & Family, Animals & Creatures, Text, Graphics, Combined, and Image/Prompt Reference modes.
- **Product Haus** (`product-haus-*`) — Invitations, Stationery, Devotional, Journals, Planners & Checklists, eBook Pages, Wall Art, Activities & Learning.
- **Graphics Haus** (`graphics-haus-*`) — Clipart, Seasonal Cute Animals, Faux Textile, Retro Object Icons, License Plates, Mascot Generator.
- **Marketing Haus** (`marketing-haus-*`) — Mockup, Social Media, Ad Copy, Email, Sales/Landing Page, Testimonial, plus Quick Generators and Customer Intelligence Studio.
- **Brand Haus** (`brand-haus-*`) — Founder Interview, Brand DNA scoring, Branding Studio, Your Blueprint, Quick Generators.

Every Haus shares the same conventions: a field-store engine, a Style DNA/Business DNA bar, a Vault (saved prompts), and a Recent Log — each ported independently per-Haus rather than shared, by design.

## Local development

Each Haus has a static dev harness under `dev/` (e.g. `dev/preview.html` for Content Haus). Serve the repo root with any static file server and open the relevant file:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173/dev/preview.html` (or the equivalent `-preview.html` for another Haus).

## Netlify function — Gemini image generation

Content Haus's Image/Prompt Reference mode includes an opt-in "Generate an Image" feature that calls Google's Gemini API server-side via `netlify/functions/generate-reference-image.js`. It never runs the AI call in the browser and never ships an API key to the client.

**Setup:**
1. Connect this repo to a Netlify site (Netlify dashboard → Add new site → Import an existing project).
2. In that site's **Site settings → Environment variables**, add:
   - `GEMINI_API_KEY` — a Gemini API key from [Google AI Studio](https://ai.google.dev).
   - `ALLOWED_ORIGIN` (optional but recommended) — your Shopify storefront's origin, to lock down CORS instead of allowing all origins.
3. Once deployed, set `NETLIFY_FUNCTION_BASE_URL` near the top of `assets/prompt-builder-reference.js` to the deployed site's URL (e.g. `https://your-site.netlify.app`).

The generated image sits alongside the existing text-prompt output, not in place of it — the assembled prompt still works standalone in any other AI image tool. A visible disclaimer links to Gemini's own terms whenever an image is generated.

## Deploying the theme itself

This repo is the source for the Shopify theme; it's pushed to the store via the Shopify CLI (`shopify theme push`), separately from anything here on GitHub/Netlify.
