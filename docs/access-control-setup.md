# Access Control Setup — The AI Creator's Prompt Haus

Code side is done: the tool page checks `customer.tags contains "prompt-haus-access"`
and shows a locked state with a buy button when that tag is missing (see
`sections/prompt-builder.liquid`). The pieces below all happen in Shopify
Admin, not in theme code — this is the checklist to wire them up.

## 1. Create the access product

Admin → Products → Add product.

- **Title**: e.g. "The AI Creator's Prompt Haus — Access Pass"
- **Price**: your one-time-purchase price
- **Shipping**: uncheck "This is a physical product" — it's digital, no
  shipping needed
- **Inventory**: don't track inventory (or track with a very high count) —
  this isn't a physical SKU
- Publish it to your Online Store sales channel

## 2. Build the Shopify Flow (tag-on-purchase)

Admin → Apps → Flow → Create workflow.

- **Trigger**: "Order paid"
- **Condition**: "Order line items" — Product is [the access product from
  step 1]. This keeps the tag from being added when someone buys your other
  products and NOT the access pass.
- **Action**: "Add customer tag" — tag value: `prompt-haus-access`
  (must exactly match the "Access tag" setting in the section — see step 4)
- Turn the workflow **on**

## 3. Create the two pages

Admin → Online Store → Pages → Add page, twice:

- **The tool page** (gated): assign template `page.prompt-builder` —
  this is the one customers use after buying access.
- **The marketing/preview page** (public): assign template
  `page.prompt-builder-preview` — this is what non-purchasers land on.

## 4. Configure both sections in the Theme Editor

On the tool page, click into the "Prompt Haus Builder" section and set:

- **Access tag** — leave as `prompt-haus-access` unless you changed the
  Flow's tag in step 2
- **Access product** — pick the product from step 1
- **Learn more link** — point this at the marketing page from step 3
- **Locked state heading/body** — edit the copy if you want

On the marketing page, click into the "Prompt Haus Preview" section and set:

- **Access product** — same product as above
- **Demo video embed URL** — use the platform's *embed* URL, not the
  regular watch link (e.g. YouTube: Share → Embed → copy the `src` URL)
- **Feature blocks** — edit/add/remove the four default feature callouts

## 5. Test it

- **As you (in the editor)**: the theme editor bypasses the gate
  automatically (`request.design_mode`), so you'll always see the full tool
  while customizing — this does NOT affect real customers.
- **As a real customer**: place a test order for the access product, confirm
  the Flow adds the `prompt-haus-access` tag to that customer (Admin →
  Customers → search the test customer → check their tags), then view the
  tool page while logged in as that customer — it should unlock.
- **Without the tag**: view the tool page in a private/incognito window (or
  log in as a customer who hasn't purchased) — you should see the locked
  state with the buy button and "Learn more" link.
