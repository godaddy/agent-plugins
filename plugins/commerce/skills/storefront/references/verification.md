# Storefront verification checklist

## Data and contracts

- Confirm source mode, endpoint, environment, authenticated store, and currency.
- Confirm MCP discovery returned the called tools and current schemas.
- Confirm application catalog/cart requests use the runtime storefront APIs, not
  the agent's MCP session or OAuth token.
- Confirm the UI adds SKU/variant IDs, while product IDs remain presentation IDs.
- Confirm the first cart write creates a draft order, adds SKUs through the
  server-priced line-item operation, and re-reads the cart totals.
- Confirm server checkout ignores browser-supplied prices and display text.
- Confirm live failures do not switch to fixtures.

## Shopper behavior

- Exercise loading, populated, empty, error/retry, and unavailable catalog states.
- Exercise a single-variant and multi-variant product.
- Add twice, increment, decrement, remove, refresh, and reopen the cart.
- Exercise checkout double-click prevention, creation failure, cancel, return,
  processing, verified success, and terminal failure.
- Confirm cart clearing occurs only after server verification.

## UI quality

- Use keyboard-only navigation; verify visible focus and dialog focus behavior.
- Check meaningful labels, alt text, status announcements, touch target size, and
  sufficient contrast.
- Check narrow phone, tablet, laptop, and large desktop layouts.
- Check long names, missing media, large prices, unavailable variants, and
  reduced-motion preferences.

## Engineering evidence

Run type checking, linting, unit/integration tests, production build, and a
browser smoke test. Record what was actually exercised. A source review or a
loaded template is not runtime proof.
