# Access Control Setup — The AI Creator's Marketing Haus

Code side is done: the tool page checks `customer.tags contains "marketing-haus-access"`
and shows a locked state with a buy button when that tag is missing (see
`sections/marketing-haus.liquid`). This tag is completely separate from
Prompt Haus's/Content Haus's own `prompt-haus-access` tag, so a customer
can own either product independently. The pieces below all happen in
Shopify Admin, not in theme code — this is the checklist to wire them up.

## 1. Create the access product

Admin → Products → Add product.

- **Title**: e.g. "The AI Creator's Marketing Haus — Access Pass"
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
  different product (including the Prompt Haus/Content Haus access pass).
- **Action**: "Add customer tag" — tag value: `marketing-haus-access`
  (must exactly match the "Access tag" setting in the section — see step 4)
- Turn the workflow **on**

## 3. Pages — already done

- **Marketing Haus** (gated tool page): https://blacksheepcreations.com/pages/marketing-haus
- **Marketing Haus Preview** (public marketing page): https://blacksheepcreations.com/pages/marketing-haus-preview

Confirm each page's **Theme template** (in the page editor, right-hand
sidebar) is assigned correctly:

- Marketing Haus → template `page.marketing-haus`
- Marketing Haus Preview → template `page.marketing-haus-preview`

Since the preview page was duplicated from the Content Haus preview page,
double-check its template got set to `page.marketing-haus-preview` and not
left on the Content Haus one — a duplicated page keeps the source page's
template assignment unless it's changed.

## 4. Configure both sections in the Theme Editor

On the **Marketing Haus** page, click into the "Marketing Haus Builder"
section and set:

- **Access tag** — leave as `marketing-haus-access` unless you changed the
  Flow's tag in step 2
- **Access product** — pick the product from step 1
- **Learn more link** — paste `https://blacksheepcreations.com/pages/marketing-haus-preview`
- **Locked state heading/body** — edit the copy if you want (defaults
  already mention all four launch studios)

On the **Marketing Haus Preview** page, click into the "Marketing Haus
Preview" section and set:

- **Access product** — same product as above
- **Demo video embed URL** — optional, can leave blank for now ("Demo video
  coming soon" placeholder shows until set) — use the platform's *embed*
  URL, not the regular watch link
- **Feature blocks** — since this page was duplicated from the Content
  Haus preview, the four feature blocks are almost certainly still
  Content-Haus-specific copy. Replace them with Marketing Haus's own (the
  defaults baked into `page.marketing-haus-preview.json` are a ready-made
  starting point: Branding Studio, Product Mockup Studio, Social Media &
  Logo Studios, Save your favorites) — Shopify duplicate-page doesn't
  reset blocks to a new template's defaults, so this needs a manual pass.

## 5. Test it

- **As you (in the editor)**: the theme editor bypasses the gate
  automatically (`request.design_mode`), so you'll always see the full
  tool while customizing — this does NOT affect real customers.
- **As a real customer**: place a test order for the access product,
  confirm the Flow adds the `marketing-haus-access` tag to that customer
  (Admin → Customers → search the test customer → check their tags), then
  view the tool page while logged in as that customer — it should unlock.
- **Without the tag**: view the tool page in a private/incognito window
  (or log in as a customer who hasn't purchased) — you should see the
  locked state with the buy button and "Learn more" link pointing at the
  preview page.
