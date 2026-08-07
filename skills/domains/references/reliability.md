# Authentication, reliability, and recovery

Public sources: [authentication](https://developer.godaddy.com/en/docs/api-users/auth),
[reliable integrations](https://developer.godaddy.com/en/docs/api-users/building-reliable-integrations),
[errors](https://developer.godaddy.com/en/docs/api-users/errors),
[rate limits](https://developer.godaddy.com/en/docs/api-users/rate-limits), and
[pagination](https://developer.godaddy.com/en/docs/api-users/pagination).

## Credentials

Use a Personal Access Token for REST. It is displayed once at creation; store it
in a password or secrets manager and inject it only into a trusted runtime.
Send `Authorization: Bearer <token>`. Never request that a user paste it into
chat, add it to client-side code, or commit it.

Request only the current operation scopes. Revoke a lost or exposed token and
replace it; do not log it to diagnose a `401`.

## Error handling

Parse the structured error envelope. Branch on stable `code`, then inspect
`fields[]` paths and codes. Human-readable messages can change.

| Status | Response |
|---|---|
| `400` | Correct malformed fields; do not retry unchanged |
| `401` | Replace missing, expired, or revoked authentication |
| `403` | Distinguish missing scope, role, billing, and account eligibility by code |
| `404` | Verify path, domain ownership, and visibility before retrying |
| `409` | Re-read state and resolve the conflicting operation |
| `422` | Handle the named business rule or field failure |
| `429` | Wait for the server-directed reset/retry interval |
| `5xx` | Back off with jitter; reconcile unsafe writes first |

## Retry matrix

- `GET`: safe to retry with bounded exponential backoff.
- Identical setting `PUT`/`PATCH`: generally idempotent, but re-read state after
  an ambiguous response.
- DNS append: non-idempotent in effect; read for the exact record before retry.
- DNS delete: verify current state and exact record ID.
- v3 registration: retry the identical intent only with its original stable
  `Idempotency-Key`.
- manual renewal and transfer: no equivalent v3 registration guarantee; verify
  expiration, order, action, or transfer state before retrying.
- cancellation: never retry without verifying whether the domain is already
  absent or cancelled.

Do not retry a semantic `4xx` unchanged. Do not swap a domain, contact, period,
price, or action merely to make an error disappear.

## Rate limits

Read `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and
`Retry-After` when present. Values can change, so do not encode a fixed request
count or window. Page sequentially, use bulk reads where the live API supports
them, cache appropriately, and add jitter after the server-specified wait.

## Async operations

Preserve the server's status URL, operation/resource ID, request ID, and
original intent. Poll with bounded backoff until a contract-defined terminal
state. Registration and v3 domain operations use `COMPLETED` and `FAILED` as
terminal values; do not assume every v1/v2 action uses the same enum.

If polling exceeds the application's time budget, persist the pending state and
resume later. Report pending honestly; do not convert a local timeout into a
failed or successful domain action.

## Pagination

For v1 domain inventory, use `limit` and `marker`. Set the next marker to the
last domain from the prior response, stop when the page is shorter than the
limit, and retry the same pair after a transient error. If a marker is rejected
because underlying state changed, restart the walk and deduplicate by domain.

## Sensitive data

Redact PATs, transfer authorization codes, quote tokens, contact data, billing
details, and raw consent artifacts from logs. Keep correlation IDs, domain,
operation ID, status, and sanitized error code for support. Show contact
summaries only to the authorized user at the confirmation boundary.
