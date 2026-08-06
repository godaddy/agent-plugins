# Payment security boundary

```text
browser -> narrow application endpoint -> payment provider
provider -> signed webhook endpoint -> event inbox/state machine
browser return -> application status endpoint -> provider/order verification
```

The server authenticates the shopper or merchant, authorizes access to the
order, loads the authoritative amount and currency, validates any allowed
partial amount, and makes the provider call. The browser supplies intent and
stable IDs, not financial truth.

Use a random, stable idempotency key scoped to the business operation. Persist
its association with the local order/payment attempt. A network timeout is an
unknown outcome: query or reconcile before retrying. Use separate keys for
distinct operations such as create, capture, and refund.

Store secrets in the deployment secret manager. Redact request headers and
provider payloads from logs. Do not persist restricted cardholder data. Validate
content type and size, apply rate limits, authenticate internal callbacks, and
allowlist return origins server-side.

Verify webhook signatures from the raw request bytes using the provider's
documented algorithm and tolerance. Record a provider event ID before applying
it, make repeats no-ops, and retain enough non-sensitive audit data to explain a
transition. Do not acknowledge an event as applied when durable processing
failed; use the provider's documented retry semantics.
