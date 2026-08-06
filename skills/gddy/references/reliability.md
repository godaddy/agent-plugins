# Reliability and recovery

Use the current CLI output and API error `code` as the stable failure signal.
Do not branch on message text alone. Validation failures can include a `fields`
array identifying the rejected path.

## Retry rules

| Operation | Recovery |
|---|---|
| Read | Retry transient failures with bounded backoff. |
| Registration | Preserve the logical attempt and idempotency key; inspect domain or operation state before retrying an ambiguous result. |
| DNS add | Read matching records before retrying because append can create a duplicate. |
| DNS set | Re-read the complete matching record set, then repeat only if replacement is still required. |
| DNS delete | Re-read matching records; a missing record can already represent the intended result. |

Treat `202 Accepted` and other pending results as asynchronous. Poll the
operation or resource identified by the current contract until it reaches a
documented terminal state, with a bounded interval and timeout.

## Common status handling

- `400`: fix request shape; do not retry unchanged.
- `401`: authenticate again; do not loop the request.
- `403`: inspect the error code for missing scope or account eligibility.
- `404`: verify the account, domain, and identifier.
- `409`: read current state and resolve the conflict.
- `422`: inspect the business-rule code and validation fields.
- `429`: honor `Retry-After` or rate-limit reset headers and add jitter.
- `5xx`: retry only operations known to be safe; inspect state first for writes.

## Registration failures

- If a domain is no longer available, re-run availability and offer alternatives.
- If a quote expired or no longer matches, obtain a new quote and ask the user
  to confirm its price and terms.
- If agreements differ, use the exact agreement keys returned by the current
  quote or agreement lookup.
- If billing is not ready, direct the user to `gddy payment-methods add`; never
  request card details in the terminal or chat.
- If contact data is incomplete, help the user initialize and complete the
  contact template without exposing personal data in logs or commits.

## Rate limits

Treat response headers as authoritative. Prefer bulk endpoints where supported,
paginate sequentially, cache slow-changing reads, and avoid parallel request
bursts. Never work around a service limit by rotating credentials.
