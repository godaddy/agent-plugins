# Checkout handoff

Checkout-session creation is a payments operation. Activate the payments skill
and use its selected provider contract. For GoDaddy hosted checkout, the payments
skill contains the exact GraphQL host, mutation, authentication, request, and
response contract. `commerce_checkout_configuration_get` configures the handoff
and `commerce_checkout_validate` verifies the completed application; neither tool
creates a shopper session.

## Request

The browser sends stable variant/SKU IDs and quantities to a same-origin
backend. The backend authenticates the shopper as needed, reloads sellable data,
checks currency and availability, computes totals, applies server-owned tax,
shipping, and discount rules, and creates an idempotent checkout session.

For a draft-order cart, pass the durable `draftOrderId`; do not rebuild line-item
prices in the browser. For Buy Now, pass a concrete `skuId` and quantity. Keep
provider-specific flags, store/channel identifiers, credentials, and source
attribution server-owned.

Allowlist return and cancel locations on the server. Do not accept arbitrary
absolute URLs from the browser. Expect a provider session response to contain a
`url`; do not silently rename or guess `redirectUrl`.

## Redirect and return

Disable duplicate submission while session creation is pending, but recover
after an error. Redirect only to a validated `https` provider URL or a known
same-origin test route.

The return route may say “We received your return; checking payment” while its
backend verifies the provider session or order. It must not say “paid,” fulfill,
send definitive confirmation, or clear the durable cart based only on URL query
parameters. A webhook and/or authenticated server-side status lookup is the
authority.

Design explicit states:

```text
cart -> creating_session -> at_provider
                         \-> retryable_failure
at_provider -> returned_processing -> verified_paid
                                \----> pending | failed | cancelled
```

Preserve the cart on cancel, failure, unknown status, and network errors. Clear
it only after the application receives its accepted server-verified success
state, and make that operation safe to repeat.
