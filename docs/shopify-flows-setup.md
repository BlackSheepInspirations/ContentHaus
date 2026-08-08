# Shopify Flows — access grant/revoke setup (copy-ready)

Every gated P2P surface checks `customer.tags contains <access_tag>` (or the master `all-access`).
A **Shopify Flow** is what puts that tag on the customer when they buy. Build these in
**Admin → Apps → Flow → Create workflow**. Tags don't need pre-creating — adding one creates it.
Tags are case-sensitive — match these exactly. Source of truth: `docs/p2p-access-mapping.md`.

Built 2026-08-07. Nothing here depends on final pricing.

---

## A. One-time Haus passes — 6 identical Flows

Same shape for each; only the product + tag change. For **each** row below:

- **Name:** `Grant — <Haus>`
- **Trigger:** **Order paid**
- **Condition:** **Order line items** → *Product* → **is** → *(the product)*
  - (This ensures the tag is added only when THIS pass is in the order, not any other purchase.)
- **Action:** **Add customer tag** → *(the tag)*
- Turn the workflow **On**.

| Flow name | Product (handle) | Tag to add |
|---|---|---|
| Grant — Content Haus | `content-haus-access-pass` | `prompt-haus-access` |
| Grant — Marketing Haus | `marketing-haus-access-pass` | `marketing-haus-access` |
| Grant — Graphics Haus | `graphic-haus-access-pass` | `graphics-haus-access` |
| Grant — Project Haus | `project-haus-access-pass` | `product-haus-access` |
| Grant — Growth Haus | `growth-haus-access-pass` | `growth-haus-access` |
| Grant — Brand Haus | `brand-haus-access-pass` | `brand-haus-access` |

> When **Curriculum Haus** goes live, add: `curriculum-haus-access-pass` → `curriculum-haus-access`.

---

## B. The OS subscription — `all-access` (grant + revoke)

`all-access` is the **master** tag: it unlocks *every* Haus + the OS shell + the Journey. Because
the OS is a **subscription**, you need one Flow to grant it and one to take it away — a plain
"Order paid" Flow can't revoke on cancel. (The exact subscription trigger names depend on the
Shopify Subscriptions app; pick the closest match to each described trigger.)

### B1 — Grant on subscription start
- **Name:** `Grant — OS all-access (subscription)`
- **Trigger:** **Subscription contract created**  *(fires when someone subscribes)*
- **Condition:** the contract's line items → *Product* → **is** → `p2p-os-access`
- **Action:** **Add customer tag** → `all-access`
- **On.**

### B2 — Revoke on cancel / expiry
- **Name:** `Revoke — OS all-access`
- **Trigger:** **Subscription contract cancelled** (and, if available as separate triggers,
  duplicate this Flow for **expired** and **failed/ended**). If your app only exposes
  **"Subscription contract updated,"** use that and add a **Condition:** contract *status* → **is**
  → `CANCELLED` (also `EXPIRED`).
- **Condition:** the contract's product → **is** → `p2p-os-access`
- **Action:** **Remove customer tag** → `all-access`
- **On.**
- **Paused subscriptions (your call):** if you want a paused member to keep access, do nothing on
  pause. If pause = no access, add a third Flow: trigger paused → remove `all-access`; and on
  resume → add it back.

> Because `all-access` already unlocks everything, do **not** also add the individual Haus tags to
> OS subscribers — the master tag covers them. Keep the two systems separate: one-time passes add
> their own Haus tag; the subscription adds `all-access`.

---

## C. The two Custom GPTs — deliver the link (no tag)

Frank (`idea-haus-gpt`) and Ruth (`build-haus-access-pass`) don't gate a page — the purchase just
needs to hand the buyer their private ChatGPT link. Two identical Flows:

- **Name:** `Deliver — Frank GPT` / `Deliver — Ruth GPT`
- **Trigger:** **Order paid**
- **Condition:** **Order line items** → *Product* → **is** → `idea-haus-gpt` (or `build-haus-access-pass`)
- **Action:** **Send email** (to the customer) → subject e.g. *"Your Frank GPT access"*, body with the
  **ChatGPT link** + a one-line how-to. *(You supply the two GPT URLs.)*
- **On.**

> Alternative if you'd rather not email from Flow: put the link in the product's post-purchase /
> order-status page or a digital-delivery app. Flow is the simplest.

---

## D. Test each one
1. In the theme editor the gate is bypassed, so test as a **real (non-staff) customer** or a test order.
2. Place a test order for a pass → confirm the tag lands on that customer (Customers → the customer → Tags).
3. Log in as them → confirm the gated page/tool unlocks.
4. For the subscription: subscribe → confirm `all-access` added; cancel → confirm it's removed.

## E. Notes
- **Order of ops:** build these **before** flipping the password off, so the very first real buyer is gated correctly.
- **Refunds/chargebacks:** optional hardening later — a Flow on "Refund created" that removes the
  matching tag. Not required for launch.
- If a member should have access but the tool shows locked, 99% of the time it's a **tag typo** —
  compare their customer tag to the table above character-for-character.
