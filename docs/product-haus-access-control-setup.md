# Access Control Setup — The AI Creator's Project Haus

Code side is done: the tool page checks `customer.tags contains "product-haus-access"`
and shows a locked state with a buy button when that tag is missing (see
`sections/product-haus.liquid`). This tag is completely separate from Prompt
Haus's/Content Haus's `prompt-haus-access` tag and Marketing Haus's
`marketing-haus-access` tag, so a customer can own any of the three
independently. The pieces below all happen in Shopify Admin, not in theme
code — this is the checklist to wire them up.

## 1. Create the access product

Admin → Products → Add product.

- **Title**: e.g. "The AI Creator's Project Haus — Access Pass"
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
  step 1]. This keeps the tag from being added when someone buys a
  different product (including the Prompt Haus/Content Haus or Marketing
  Haus access passes).
- **Action**: "Add customer tag" — tag value: `product-haus-access`
  (must exactly match the "Access tag" setting in the section — see step 4)
- Turn the workflow **on**

## 3. Create the two pages

Admin → Online Store → Pages → Add page, twice:

- **The tool page** (gated): assign template `page.product-haus` — this is
  the one customers use after buying access.
- **The marketing/preview page** (public): assign template
  `page.product-haus-preview` — this is what non-purchasers land on.

Since a duplicated page keeps the source page's template assignment unless
changed, double-check each new page's template is set correctly rather than
left on whichever page it was duplicated from.

## 4. Configure both sections in the Theme Editor

On the tool page, click into the "Project Haus Builder" section and set:

- **Access tag** — leave as `product-haus-access` unless you changed the
  Flow's tag in step 2
- **Access product** — pick the product from step 1
- **Learn more link** — point this at the Project Haus Preview page from step 3
- **Locked state heading/body** — edit the copy if you want

On the marketing page, click into the "Project Haus Preview" section and set:

- **Access product** — same product as above
- **Demo video embed URL** — optional, can leave blank for now ("Demo video
  coming soon" placeholder shows until set) — use the platform's *embed*
  URL, not the regular watch link
- **Feature blocks** — edit/add/remove the default feature callouts as new
  studios/generators are added

## 5. Test it

- **As you (in the editor)**: the theme editor bypasses the gate
  automatically (`request.design_mode`), so you'll always see the full tool
  while customizing — this does NOT affect real customers.
- **As a real customer**: place a test order for the access product, confirm
  the Flow adds the `product-haus-access` tag to that customer (Admin →
  Customers → search the test customer → check their tags), then view the
  tool page while logged in as that customer — it should unlock.
- **Without the tag**: view the tool page in a private/incognito window (or
  log in as a customer who hasn't purchased) — you should see the locked
  state with the buy button and "Learn more" link.
