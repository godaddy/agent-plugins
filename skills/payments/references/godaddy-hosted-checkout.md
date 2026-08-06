# GoDaddy Commerce hosted checkout

Use this reference only after GoDaddy hosted checkout has been selected and the
merchant, store, currency, payment method, and region are eligible. Keep provider
selection separate: the existence of a Commerce store or channel does not prove
that GoDaddy Payments is available for the requested merchant or flow.

## Contents

1. Boundary and prerequisites
2. Authentication and endpoint
3. Session contract
4. Same-origin application route
5. Checkout configuration
6. Return and status verification
7. Runtime verification

## Boundary and prerequisites

Commerce MCP can resolve the store/channel, enabled checkout capabilities, and
application readiness. It does not create a shopper checkout session.

Before implementation, obtain approved application-runtime configuration:

- Commerce `storeId` and registered `channelId`;
- store `currencyCode`;
- runtime OAuth client ID and client secret;
- approved payment method/provider configuration;
- server-owned return and success origins.

Do not reuse the agent's interactive MCP OAuth token. A deployed application has
its own runtime identity and lifecycle. Keep its client secret in a server secret
store and never serialize it into browser JavaScript, HTML, logs, or error bodies.

## Authentication and endpoint

Mint a short-lived token server-side:

```http
POST https://api.godaddy.com/v2/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=...&client_secret=...&scope=...
```

Request only scopes approved for the runtime client and required by the current
checkout contract. Current GoDaddy checkout helpers request
`commerce.product:read`; confirm this against the installed helper or current API
schema rather than broadening it speculatively. Cache the token until shortly
before `expires_in`, then refresh it.

Create checkout sessions through the fixed production GraphQL origin:

```text
https://checkout.commerce.api.godaddy.com
```

Do not add an origin setting or derive another hostname. Send `Authorization:
Bearer <access-token>` and JSON GraphQL requests to that origin. Do not call the
checkout origin from the browser.

## Session contract

The schema type is `MutationCreateCheckoutSessionInput`, not the similarly named
local TypeScript interfaces applications often define:

```graphql
mutation CreateCheckoutSession($input: MutationCreateCheckoutSessionInput!) {
  createCheckoutSession(input: $input) {
    id
    url
    storeId
    channelId
    sourceApp
    returnUrl
    successUrl
    enableShipping
    enableShippingAddressCollection
    enableTaxCollection
    draftOrder {
      id
      statuses { status }
      totals { total { value currencyCode } }
    }
  }
}
```

Build exactly one source form per request.

Draft-order cart:

```ts
{
  storeId,
  channelId,
  draftOrderId,
  returnUrl,
  successUrl,
}
```

Buy Now from a catalog SKU:

```ts
{
  storeId,
  channelId,
  lineItems: [{ skuId, quantity }],
  returnUrl,
  successUrl,
}
```

Non-catalog one-time payment, only when the selected provider contract permits
it:

```ts
{
  storeId,
  channelId,
  lineItems: [{
    lineItemData: {
      name,
      priceData: { unitAmount, currencyCode },
    },
    quantity,
  }],
  returnUrl,
  successUrl,
}
```

Do not send both `draftOrderId` and `lineItems`. For catalog flows, re-read the
SKU or draft order server-side before creating the session. For non-catalog
flows, derive the permitted amount and currency from server-owned business data;
never forward a browser amount unchecked.

For a standard one-time GoDaddy card flow, the current baseline is:

```ts
{
  sourceApp: stableRegisteredApplicationId,
  paymentMethods: {
    card: { processor: 'godaddy', checkoutTypes: ['standard'] },
  },
  enablePaymentMethodCollection: true,
  enableBillingAddressCollection: true,
}
```

Use the calling application's own stable source identifier; never copy another
application's attribution value. Enable shipping, shipping-address collection,
tax, pickup, tips, or other collection only when the current store configuration
and selected flow require them. When shipping configuration supplies an origin,
pass it through the checkout schema's `shipping` input rather than inventing an
address.

Supply payment methods, shipping, tax, pickup, locale, appearance, and collection
flags only from the selected provider and current checkout configuration. Do not
guess defaults that materially change collection, fulfillment, or compliance.

Require the response to contain `id` and `url`. Confirm returned `storeId` and
`channelId` equal the configured binding. If configured tax or shipping flags
are required, confirm the created session preserved them. The redirect field is
`url`; do not invent or check `redirectUrl`.

## Same-origin application route

Expose a narrow server route such as `POST /api/checkout/sessions`. Accept only:

```ts
type CheckoutRequest =
  | { draftOrderId: string; returnPath: string; successPath: string }
  | { skuId: string; quantity: number; returnPath: string; successPath: string }
  | {
      paymentReference: string;
      quantity: number;
      returnPath: string;
      successPath: string;
    };
```

The third form is an application-owned reference, not browser-authored
`lineItemData`; resolve its name and amount on the server.

The handler must:

1. authenticate or rate-limit as appropriate;
2. validate exactly one source form and bounded quantity;
3. resolve server-owned store, channel, currency, provider flags, and source;
4. allowlist relative return/success paths and construct absolute URLs from a
   configured origin;
5. reload the SKU, draft order, or payment reference and validate sellability,
   ownership, amount, and currency;
6. create the checkout session server-side;
7. persist the application order/payment reference to session mapping when the
   provider does not do so;
8. return a minimal `{ id, url, draftOrderId? }` response.

Prevent duplicate browser submission. Use a provider-supported idempotency key
when the current contract defines one. If it does not, do not invent an input
field: deduplicate at the application boundary and reconcile ambiguous results
by the persisted reference.

## Checkout configuration

Before building a GoDaddy checkout session, inspect `tools/list`. When core
`commerce_checkout_configuration_get` is available, call it with the resolved
`storeId` and `channelId`. Apply its enabled tax/shipping capabilities and
shipping-origin result to server-owned checkout configuration. Resolve warnings
instead of silently disabling a requested capability. If the tool is unavailable,
do not manufacture flags; use only settings proved by another current approved
contract and report the configuration-verification gap.

Re-run configuration after relevant integration enablement or settings changes.
This MCP call prepares runtime configuration; it is not a shopper API and does
not return a checkout URL.

## Return and status verification

Redirect the browser only to the validated HTTPS `url` returned by checkout.
Treat arrival at `successUrl`, query parameters, and the existence of a draft
order as observations, not payment proof.

The return page should call a same-origin backend status route using an opaque
application reference. The backend must load authoritative provider transaction
or order state, validate its store/order/amount/currency binding, and map it to a
small internal state such as `checking`, `pending`, `paid`, `failed`, or
`cancelled`. A verified webhook applied idempotently to durable state is also an
authority. Clear the cart and fulfill only after the application's accepted
terminal state is verified server-side.

Do not expose `commerce_orders_get` directly to the browser. It is an agent-facing
MCP read, not a public status endpoint. Build the status route from the approved
runtime order/provider contract and enforce ownership.

## Runtime verification

After implementing the real routes:

1. Call core MCP `commerce_checkout_validate` with `action: "start"`, the exact
   `channelId`, `storeId`, capability `checkout`, and a stable idempotency key.
2. Execute the returned `runtimeVerification` plan against the mounted
   application exactly as specified.
3. Submit its typed result with `action: "submit_runtime_verification"`.
4. Poll with `action: "status"` when directed.
5. Treat only `status: "ready"` as checkout-readiness proof.

Readiness proves the implementation passed the configured runtime check. It does
not replace per-payment status verification, webhook processing, reconciliation,
or explicitly authorized production verification.
