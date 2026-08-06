---
name: payments
description: "Build, repair, or review commerce payment integrations: provider selection, hosted or embedded checkout, payment session creation, authorization and capture, refunds, voids, transaction lookup, webhooks, settlement events, reconciliation, and payment-status UI. Use whenever code moves money or interprets provider payment state. Do not use for ordinary catalog, product, variant, inventory, cart presentation, store, or non-monetary order work."
---

# Payments

Implement money movement from an approved, current provider contract. Optimize
for correct lifecycle handling and recoverability before the happy-path demo.

## Operating workflow

1. Classify the task: session/payment creation, transaction read, capture,
   refund, void, webhook/event handling, reconciliation, or payment-state UI.
   A projected `paymentStatus` on an order is storefront/order data; underlying
   monetary transactions belong here.
2. Inspect the existing provider integration, server framework, auth and secret
   management, data model, idempotency strategy, webhook route, logs, tests, and
   deployment environment before creating replacements.
3. Confirm merchant country, presentment/settlement currency, payment method,
   capture timing, refund policy, and provider/environment. Use
   [references/provider-and-flow.md](references/provider-and-flow.md).
4. Locate the exact approved SDK, OpenAPI, AsyncAPI, or provider documentation
   for the operation and version. Derive request and response types from it. If a
   write contract is absent, stop and report the operation as unsupported rather
   than inventing fields. Read
   [references/transaction-contracts.md](references/transaction-contracts.md).
5. For GoDaddy Commerce hosted checkout, follow the exact server-side API,
   authentication, session-input, redirect, and verification contract in
   [references/godaddy-hosted-checkout.md](references/godaddy-hosted-checkout.md).
   Do not mistake MCP checkout configuration or readiness tools for session
   creation.
6. Build the integration behind a same-origin backend. Recalculate amount and
   currency from server-owned product/order data, validate ownership and bounds,
   use idempotency, keep secrets out of logs and browser bundles, and constrain
   redirect origins. Read
   [references/security.md](references/security.md).
7. Model authorization, capture, failure, cancellation, expiry, refund, void,
   dispute, and asynchronous transitions explicitly. The browser return is an
   observation, never payment proof. Follow
   [references/lifecycle.md](references/lifecycle.md).
8. Make webhooks authentic, replay-safe, order-independent where possible, and
   auditable. Fetch server-side status when a return needs immediate resolution;
   keep uncertain states pending.
9. Verify contract tests, duplicate requests/events, retries, timeouts, partial
   refunds, out-of-order events, and a real provider sandbox path. Use
   [references/verification.md](references/verification.md).

## Non-negotiable rules

- Never expose provider keys, OAuth tokens, webhook secrets, or raw privileged
  error payloads to browser code.
- Never trust browser-supplied amount, currency, order ownership, line-item text,
  capture amount, refund amount, or redirect URL.
- Never log secrets, full account numbers, CVV, raw payment method data, or
  sensitive personal data.
- Never claim success from a redirect, client callback, HTTP 2xx alone, or an
  event whose signature and applicability were not verified.
- Never retry a money-moving request without a stable idempotency key and a
  reconciliation plan.
- Never use the interactive Commerce MCP OAuth token as a generated
  application's runtime checkout credential.
- Never call hosted checkout GraphQL from browser code or trust browser-supplied
  store, channel, price, currency, provider flags, or absolute return URLs.
- Never implement capture, refund, or void from a read-only transaction schema.
- Never conflate authorization with capture, void with refund, or payment success
  with order fulfillment.

## Completion report

State the provider, environment, contract and version, idempotency scope,
verification authority, states tested, and remaining operational gaps. Clearly
distinguish a fixture simulation from provider sandbox or production evidence.
