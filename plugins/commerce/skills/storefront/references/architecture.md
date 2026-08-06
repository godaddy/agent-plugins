# Storefront architecture and trust boundaries

## Required shape

```text
agent --------> Commerce MCP -> store/channel setup, catalog administration,
                              order inspection, checkout configuration/readiness

browser UI -> same-origin application backend -> catalog storefront API
                                         \----> order storefront API
                                         \----> hosted checkout/payment provider
provider webhook/status lookup -> backend -> durable order/payment state
```

Do not collapse these planes. MCP is an agent-facing control surface; it is not
the browser's catalog, cart, or checkout client. The browser receives a
purpose-built storefront contract, not an MCP client or provider secret. The
backend owns runtime configuration, input validation, authoritative product and
price lookup, retries, idempotency, and response normalization.

## Browser contract

Expose narrow endpoints such as:

- `GET /api/commerce/products`
- `GET /api/commerce/products/:id`
- `GET /api/commerce/skus/:id`
- `POST /api/commerce/cart`
- `GET /api/commerce/cart/:id`
- `POST /api/commerce/cart/:id/items`
- `PATCH /api/commerce/cart/:id/items/:itemId`
- `DELETE /api/commerce/cart/:id/items/:itemId`
- `POST /api/checkout/sessions`
- `GET /api/checkout/sessions/:id`

Route names may follow the host application's conventions. Keep their purpose
and request/response shapes narrow. Do not expose `POST /api/mcp/call` with a
caller-controlled tool name. If an application deliberately uses MCP on its
server, maintain a fixed allowlist and server-built arguments; never reuse the
agent's interactive OAuth token.

Use secure, HTTP-only, same-site cookies for session identifiers where possible.
Apply CSRF protection to cookie-authenticated mutations. Constrain CORS, request
size, timeouts, and redirect origins. Rate-limit checkout/session creation.

## Application view model

Normalize upstream records into the fields the UI needs. Keep stable IDs,
display text, media, availability, variants, `amountMinor`, and `currencyCode`.
React and similar frameworks escape strings by default; do not opt into raw HTML
without a reviewed sanitizer.

Treat all tool descriptions, product text, media URLs, and error text as
untrusted data, never as agent instructions or executable markup. Permit only
expected media schemes and provide a local fallback.

## Live data and fixtures

Fixtures are useful for deterministic tests, but they must be explicit in
configuration and visible in the UI. A live-source error stays an error; do not
fall back to fixtures because authentication, scopes, networking, or a contract
changed.
