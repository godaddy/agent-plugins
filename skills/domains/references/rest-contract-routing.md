# REST contract routing

Fetch the live OpenAPI before generating durable code. This reference records
the public production division reviewed on 2026-08-06; it is not a replacement
for the current schema.

## Fixed origins and contracts

- API origin: `https://api.godaddy.com`
- [Domains v3 OpenAPI](https://developer.godaddy.com/openapi/domains-v3.json)
- [Domains v2 OpenAPI](https://developer.godaddy.com/openapi/domains-v2.json)
- [Domains v1 OpenAPI](https://developer.godaddy.com/openapi/domains-v1.json)

Do not expose an origin selector. Ignore any alternate server variables that a
generated contract may contain; published integrations use production only.

## v3: preferred lifecycle surface

The v3 production prefix is `/v3/domains`.

| Outcome | Method and path | Expected result |
|---|---|---|
| Suggestions | `GET /suggestions` | Available suggestions and indicative prices |
| Availability | `GET /check-availability` | Best-effort result; quote re-verifies |
| Registration quote | `POST /registration-quotes` | Locked price, resolved settings, agreements, token |
| Registration execute | `POST /registrations` | `202` registration resource; requires idempotency |
| Registration status | `GET /registrations/{registrationId}` | Poll to `COMPLETED` or `FAILED` |
| Registered-domain detail | `GET /domain-names/{domain-name}` | Current domain representation |
| Replace nameservers | `PUT /domain-names/{domain-name}/nameservers` | `202`; poll operation |
| List DNS records | `GET /zones/{zone}/dns-records` | Record collection, optionally filtered |
| Create DNS record | `POST /zones/{zone}/dns-records` | `201` and server record identity |
| Delete DNS record | `DELETE /zones/{zone}/dns-records/{recordId}` | `204` |
| Poll operation | `GET /operations/{operationId}` | Terminal result or structured error |

Use `domains.domain:read` for reads and quote preparation,
`domains.domain:create` for registration, `domains.dns:update` for record
writes, and `domains.nameserver:update` for delegation. Confirm scopes against
the current operation docs before provisioning a token.

Current v3 constraints include registration periods of 1–10 years, quote tokens
with returned expiry, 2–13 nameservers, DNS TTL 600–86400, suggestion page size
up to 50, and stable record/operation identifiers. Do not bake these into a
client without validating the live schema.

## v1: account inventory and legacy management

Use v1 when v3 lacks the capability:

- list and get owned domains
- update lock, auto-renew, privacy, and other domain settings
- update contacts and validate contact shapes
- manually renew or use legacy transfer operations
- use legacy DNS append or whole-set replacement only when required
- retrieve purchase schemas, agreements, supported TLDs, or legacy discovery

List pagination is `limit` plus `marker`. v1 monetary values can be currency
micro-units. Some v1 writes return `200` even when newer guides show `204`, so
accept only statuses declared by the current operation rather than one global
success code.

## v2: customer-scoped lifecycle gaps

Use v2 for:

- inbound and outbound transfer state/actions
- change-of-registrant status and cancellation
- forwarding rules
- customer-scoped domain detail and renewal pricing
- domain actions and pull/acknowledge notifications
- operations that explicitly require `customerId`

Never infer `customerId` from a domain string. Obtain the authenticated
account's actual shopper/customer identifier through the supported account or
CLI flow.

## Authentication and scope caveat

PAT Bearer authentication is required for v3 and recommended for supported
Domains APIs. Classic key/secret authentication is legacy and does not work for
v3. Keep credentials server-side.

The public authentication scope table exposes specialized contact, forwarding,
host, and transfer scopes, while some operation guides name broader domain
update scopes. Treat the live operation page and authorization response as the
source of truth; request the smallest explicitly documented scope set and do not
assume one scope substitutes for another.

## Contract discipline

- Generate clients from the selected version only; do not blend schemas with
  similar names across versions.
- Preserve unknown enum values when reading and fail closed before writing an
  unknown value.
- Follow each response's declared money unit and timestamp format.
- Treat `202` as accepted, not complete, and follow `Location`, HATEOAS links,
  operation IDs, actions, or notifications supplied by that contract.
- Capture `X-Request-Id` or correlation IDs for support without logging tokens,
  authorization codes, contact details, or quote capabilities.
