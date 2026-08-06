# Product, variant, money, and cart contract

## Identity

- Product or SKU group: the merchandise story shown in grids and product pages.
- Variant or SKU: the purchasable selection with its own code, price, and
  availability.
- Cart line: `variantId`, `quantity`, and optional display snapshot. The backend
  ignores the snapshot when calculating checkout.

If a product has one variant, select it explicitly. If it has several, prevent
add-to-cart until a valid available combination is selected. Do not infer a
variant from its display label when a stable ID exists.

## Money

Carry `{ amountMinor, currencyCode }` or the upstream equivalent. Format with an
internationalization API and the stated currency. Do not hardcode a symbol,
assume two decimal places, parse formatted strings, or add different currencies.
Compare-at prices must share the selling currency and exceed the active price.

## Availability

Availability is a server-owned decision that may combine product status, SKU
status, channel association, inventory policy, and current inventory. Re-check
at checkout. Disable unavailable selections without erasing their labels, and
explain what the shopper can do next.

## Durable cart

Version persisted client cart data and discard malformed entries. Merge the same
variant deterministically, clamp quantities to a documented limit, and keep the
cart usable after refresh. On load, reconcile snapshots against current product
data and call out price or availability changes.

Recommended drawer content: product, selected option, current price, quantity
controls, remove action, subtotal, source/currency note, and checkout action.
Provide an empty state and restore focus when the drawer closes.

The cart is not an order or a payment. If the commerce platform models a cart as
a draft order, keep its durable ID server-side or in a protected session and
make retries idempotent.
