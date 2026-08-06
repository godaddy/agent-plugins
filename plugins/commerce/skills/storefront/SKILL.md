---
name: storefront
description: Build, repair, or review commerce storefronts and non-monetary commerce workflows, including catalog browsing, product detail and variant selection, inventory presentation, carts, checkout handoff, order confirmation, store integrations, and responsive commerce UI. Use for implementation or design work where products are sold online. Do not use for provider credentials, transaction history, authorization, capture, refund, void, settlement, or webhook implementation; those are payments tasks.
---

# Storefront

Build a trustworthy buying experience from the current commerce contract, not
from remembered request shapes. Treat checkout as a boundary with payments, not
as a client-side cart feature.

## Operating workflow

1. Inspect the existing app before adding routes, components, state stores, or
   dependencies. Identify the framework, server boundary, auth path, design
   system, product model, cart, checkout path, tests, and deployment runtime.
2. Write down the shopper journey and its backing states: discovery, product
   detail, variant choice, cart, checkout handoff, return, and order status.
   Preserve existing working paths instead of creating a second cart or checkout.
3. Separate the agent control plane from the shopper runtime plane. Use Commerce
   MCP to resolve stores and channels, manage catalog data, inspect orders, and
   validate readiness. Use the Commerce storefront APIs through narrow
   application-owned server routes for live catalog and cart traffic. Read
   [references/architecture.md](references/architecture.md).
4. For Commerce MCP, list core tools, call `search_tools` with the business task,
   read the returned parameter schema, then call the discovered tool directly or
   through `execute_tool`. Confirm the environment and `storeId`; do not guess
   either. Read [references/mcp-workflow.md](references/mcp-workflow.md).
5. For a dynamic storefront, implement the catalog, product, SKU, and draft-order
   cart routes from
   [references/runtime-api-map.md](references/runtime-api-map.md). Adapt the
   handlers to the existing framework; preserve the upstream operations and
   browser contracts instead of inventing endpoints or GraphQL inputs.
6. Map remote data into a small application-owned view model. A product/SKU
   group describes merchandise; only a concrete active variant/SKU is added to
   cart. Preserve currency codes and minor-unit amounts. Read
   [references/product-cart.md](references/product-cart.md).
7. Implement the complete UI state model: loading, empty, error with retry,
   unavailable, product, invalid/unavailable variant, cart, checkout processing,
   return processing, verified success, and recoverable failure. Never silently
   replace a live API failure with fixture data.
8. At checkout, activate the payments skill. Send only stable item identifiers
   and quantities to a same-origin backend. The backend re-reads or validates
   merchandise, calculates the authoritative amount, and creates the provider
   session. Follow
   [references/checkout-handoff.md](references/checkout-handoff.md), even when a
   separate payments skill is unavailable.
9. Verify behavior rather than file presence. Exercise at least one purchasable
   variant from browse to a server-verified terminal payment/order state, plus
   empty, unavailable, retry, cancel, duplicate-submit, and narrow-screen paths.
   Use [references/verification.md](references/verification.md).

## Non-negotiable rules

- Never put a SKU-group/product ID into a cart when checkout requires a SKU or
  variant ID.
- Never render remote HTML without sanitizing it; ordinary framework text
  escaping is preferred.
- Never hardcode USD, divide money heuristically, or combine unlike currencies.
- Never trust browser-supplied names, descriptions, prices, totals, discounts,
  inventory, return URLs, or payment status.
- Never expose a generic browser endpoint that accepts an MCP tool name and
  arbitrary arguments.
- Never ship the agent's MCP OAuth token as application runtime configuration or
  treat MCP order reads as a shopper cart/session API.
- Never invent draft-order or checkout mutations from the read-only
  `commerce_orders_*` MCP tools.
- Never claim checkout is complete because templates load, a provider URL was
  returned, or the browser reached a success-looking route.
- Never clear durable cart state or fulfill an order until server-side payment or
  order verification reaches the application's accepted terminal state.

## Completion report

State which data source and environment were used, the store and currency, the
paths exercised, the server-side verification authority, and any unverified or
provider-owned behavior. If only fixtures were used, say so prominently.
