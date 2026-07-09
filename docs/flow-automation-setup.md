# Flow & Email Automation Setup — All Haus Products

Covers the purchase → access automation for all four tools: Content Haus
(formerly Prompt Haus), Marketing Haus, Curriculum Haus, and Idea Haus.
Each gets its own Shopify Flow with two actions on the same trigger: tag
the customer (unlocks the page) and email them the direct link (backup in
case they don't bookmark the page). None of this exists yet — build all
four the same way, one Flow per tool.

If a tool actually has more than one purchasable SKU (e.g. a bundle plus
a standalone access pass), add every relevant product to that tool's
condition step so the tag/email fires no matter which one someone buys.

## Where each tool stands

| Tool | Access product | Page | Access tag |
|---|---|---|---|
| Content Haus | done | done (you renamed it — confirm final URL) | `prompt-haus-access` |
| Marketing Haus | done | done — `/pages/marketing-haus` | `marketing-haus-access` |
| Curriculum Haus | done | **not created yet** | `curriculum-haus-access` |
| Idea Haus | done | **not created yet** | `idea-haus-access` |

## Step A — Create the Curriculum Haus and Idea Haus pages

Code side is ready: `sections/gpt-access.liquid` (a generic gated
link-reveal page, reused by both) plus two templates already pre-filled
with each tool's copy — `page.idea-haus-gpt.json` and
`page.curriculum-haus-gpt.json`. Named with a `-gpt` suffix deliberately,
so they're never confused with a future Shopify-hosted Curriculum Haus
prompt-builder tool if one gets built later.

Admin → Online Store → Pages → Add page, twice:

- **Idea Haus** page → Theme template: `page.idea-haus-gpt`
- **Curriculum Haus** page → Theme template: `page.curriculum-haus-gpt`

Then in the Theme Editor, on each page's "GPT Access Page" section, set:

- **Access product** — the matching Access Pass product
- **Custom GPT link** — the shareable ChatGPT link for that GPT
- **Learn more link** — optional, if you build a public marketing page for
  either later (not required to launch)

The heading, subheading, locked-state copy, and unlocked-state
instructions all already have sensible defaults baked into the template —
edit any of it freely in the Theme Editor.

## Step B — Build the four Flows

Admin → Apps → Flow → Create workflow, four times (one per tool):

- **Trigger**: "Order paid"
- **Condition**: "Order line items" — Product is [that tool's access
  product]
- **Action 1**: "Add customer tag" — the tag from the table above
- **Action 2**: "Send email" — to the customer, using the subject/body
  drafted in Step C below (edit the wording however you like — these are
  starting points, not final copy)
- Turn each workflow **on**

## Step C — Email copy drafts

Swap in the real URL before using each one. Keep the tone as-is or adjust
to match your voice — these are just starting points.

**Content Haus**
- Subject: `Your AI Creator's Content Haus access is ready`
- Body:
  > Hi {{customer.first_name}},
  >
  > You're in! Your Content Haus access is unlocked — head here to start building:
  > [Paste your Content Haus page URL here]
  >
  > Bookmark that link so it's easy to find next time.
  >
  > — Black Sheep Creations & Inspirations

**Marketing Haus**
- Subject: `Your AI Creator's Marketing Haus access is ready`
- Body:
  > Hi {{customer.first_name}},
  >
  > You're in! Your Marketing Haus access is unlocked — head here to start building your brand and marketing content:
  > https://blacksheepcreations.com/pages/marketing-haus
  >
  > Bookmark that link so it's easy to find next time.
  >
  > — Black Sheep Creations & Inspirations

**Curriculum Haus**
- Subject: `Your AI Creator's Curriculum Haus access is ready`
- Body:
  > Hi {{customer.first_name}},
  >
  > You're in! Head here to unlock your Curriculum Haus GPT link:
  > [Paste your Curriculum Haus page URL here, once created in Step A]
  >
  > Bookmark that page — you can always come back to relaunch the GPT from there.
  >
  > — Black Sheep Creations & Inspirations

**Idea Haus**
- Subject: `Your AI Creator's Idea Haus access is ready`
- Body:
  > Hi {{customer.first_name}},
  >
  > You're in! Head here to unlock your Idea Haus GPT link:
  > [Paste your Idea Haus page URL here, once created in Step A]
  >
  > Bookmark that page — you can always come back to relaunch the GPT from there.
  >
  > — Black Sheep Creations & Inspirations

## Step D — Test each one

For each of the four tools:

- Place a test order for that tool's access product
- Confirm the Flow added the right tag (Admin → Customers → search the
  test customer → check tags)
- Confirm the email arrived with a working link
- View that tool's page while logged in as the test customer — it should
  be unlocked
- Log out (or use a private window) and confirm the page shows the locked
  state with a working "Get Access" button
