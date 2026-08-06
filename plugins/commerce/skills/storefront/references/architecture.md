# Storefront architecture and trust boundaries

## Required shape

```text
browser UI -> same-origin application backend -> Commerce MCP/API
                                         \----> checkout/payment provider
provider webhook/verification -> backend -> durable order/payment state
```

The browser receives a purpose-built storefront contract, not an MCP client or
provider secret. The backend owns authentication, capability discovery, input
validation, price calculation, retries, idempotency, and response normalization.

## Browser contract

Expose narrow endpoints such as:

- `GET /api/catalog`
- `GET /api/products/:id`
- `POST /api/checkout/sessions`
- `GET /api/checkout/sessions/:id`

Do not expose `POST /api/mcp/call` with a caller-controlled tool name. Maintain
an allowlist on the server and build MCP arguments from validated application
input.

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
