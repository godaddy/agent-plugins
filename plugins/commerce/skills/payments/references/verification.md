# Payment verification checklist

## Contract and security

- Identify the exact provider, environment, API/event versions, and operation.
- Confirm server-only secrets, sanitized logs, scope, and order ownership checks.
- Confirm amount/currency come from server-owned state.
- Confirm redirect targets are server-owned and webhook signatures use raw bytes.
- Confirm stable idempotency and unknown-outcome reconciliation.

## Lifecycle tests

- Success with required authentication or customer action.
- Decline, validation failure, provider 5xx, timeout, and unavailable provider.
- Double click, repeated API request, repeated event, and out-of-order event.
- Cancel, expiry, delayed/pending completion, and direct navigation to return.
- Full and partial capture/refund where the approved contract supports them.
- Illegal transition and amount exceeding the remaining allowable amount.

## Evidence levels

1. Unit/contract tests prove mapping and state rules.
2. Local fixture tests prove UI and application orchestration only.
3. Provider sandbox tests prove an external integration in a non-production
   environment.
4. Production readiness additionally needs secrets, monitoring, alerting,
   reconciliation, support, compliance, and rollback review.

Report the level actually reached. Do not describe a fixture checkout as a
payment-provider test.
