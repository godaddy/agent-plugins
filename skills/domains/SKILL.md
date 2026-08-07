---
name: domains
description: Find, register, configure, transfer, troubleshoot, or manage GoDaddy domain names across the public Domains MCP, the `gddy` CLI, and the production Domains REST API. Use for domain suggestions and availability, registration quotes and purchases, account domain inventory, DNS records and nameservers, forwarding, contacts and privacy, lock state, renewals, transfers, notifications, or application automation. Do not use for GoDaddy Commerce, Hosting, another registrar, or unrelated DNS providers after nameserver delegation.
---

# GoDaddy Domains

Complete domain outcomes through the least-privileged supported surface. Treat
registration, renewal, and transfer as financial actions; treat DNS deletion or
replacement, nameserver replacement, contact changes, and domain cancellation
as high-impact actions.

## Choose the surface

1. Read [references/surface-routing.md](references/surface-routing.md).
2. Use the bundled `godaddy-domains` MCP for public suggestions and availability.
   It is unauthenticated, read-only, and safe to retry.
3. Invoke `$gddy` for interactive, account-aware work when the installed CLI
   supports the outcome. Let that skill discover the current command instead of
   duplicating or guessing CLI syntax here.
4. Use the fixed production REST API for application code, CI, automation, or a
   capability absent from the CLI. Read
   [references/rest-contract-routing.md](references/rest-contract-routing.md)
   before constructing a request.

Do not ask users to choose or configure a service origin. Do not route account
operations through the public MCP; its discovery result does not reserve a name
or authorize a purchase.

## Operating workflow

1. Identify the exact domain, account context, desired outcome, authoritative
   DNS provider, and whether the task is read-only, financial, destructive, or
   asynchronous.
2. Read current state before every write. Preserve stable identifiers, current
   records, lock state, expiration, transfer state, and relevant operation IDs.
3. Authenticate only on the chosen account-aware surface. For REST, use a
   server-held Personal Access Token with the smallest current scopes. Never
   put a token in source, browser code, logs, chat, or committed configuration.
4. Preview the exact effect. Obtain explicit confirmation for the quoted domain,
   term, total, currency, agreements, and resolved registrant before a purchase;
   for the exact before/after state before a destructive change.
5. Execute one narrowly scoped action. Preserve its idempotency key or request
   identifier and all returned resource or operation identifiers.
6. Reconcile ambiguous responses by reading state. Poll every accepted async
   operation to a documented terminal state before claiming completion.
7. Verify the resulting account state. For DNS, verify API state and then the
   authoritative answer; external resolver convergence may take the previous
   TTL duration.

## Registration

Read [references/registration.md](references/registration.md) before generating
or executing a registration workflow.

- Recheck availability immediately before quoting. Treat quote-time availability
  and price as authoritative over MCP or earlier availability results.
- Follow v3 quote then execute. Show the quote's domain, period, locked total and
  currency, renewal price when present, expiration, required agreements, and
  resolved contact and preferences before seeking confirmation.
- Use the agreement identifiers returned by that exact quote and record the real
  consent time. Do not hardcode agreement types or fabricate consent.
- Generate one stable UUID `Idempotency-Key` per registration intent. Reuse it
  after an ambiguous failure; never generate a new key merely because the
  response was lost.
- Keep the quote and execute inputs identical where the contract requires it.
  Re-quote after expiry or any intended change.
- Poll the returned registration or operation resource until `COMPLETED` or
  `FAILED`. A `202`, `CONFIRMED`, or `EXECUTING` response is not completion.

Registration charges the account and is not reversible. Never execute one only
to test an integration.

## DNS and delegation

Read [references/dns.md](references/dns.md) before changing records or
nameservers.

- Confirm GoDaddy nameservers are authoritative before using GoDaddy DNS record
  APIs. After delegation to another provider, manage records with that provider.
- Snapshot the affected record set and distinguish append, targeted delete, and
  whole-set replacement. Do not turn an append request into replacement.
- Do not mutate system-managed `NS` or `SOA` records through record endpoints.
  Nameserver replacement is a separate whole-set operation that changes DNS
  authority and must be polled.
- Use record-type-valid data and a documented TTL. Stage critical DNS changes;
  acceptance by the API is distinct from resolver propagation.
- Verify the record set after each write. After an ambiguous create, read before
  retrying because repeated appends can duplicate records.

## Lifecycle management

Read [references/lifecycle-management.md](references/lifecycle-management.md)
for inventory, settings, forwarding, contacts, renewals, transfers,
notifications, and cancellation.

- Keep registry lock enabled except for the shortest required transfer or
  registrant-change window; restore it and verify afterward.
- Treat the registrant as the legal contact. Explain any ICANN approval flow and
  pending state before changing identifying fields.
- Confirm price and period before manual renewal. If its response is ambiguous,
  re-read expiration and order state before retrying.
- Treat inbound and outbound transfers as state machines. Use the current v2 or
  v1 contract, preserve authorization codes as secrets, and do not retry a
  chargeable transfer without reconciling state.
- Never cancel a domain as a cleanup or verification step. Require explicit
  authorization for the exact domain and explain that service, mail, and future
  ownership can be lost.

## Reliability rules

Read [references/reliability.md](references/reliability.md) for authentication,
errors, retries, pagination, rate limits, and async recovery.

- Branch on the stable error `code` and field details, not only HTTP status or
  human-readable message.
- Respect live rate-limit headers and the server-directed wait. Do not hardcode
  a fixed quota or rotate credentials to evade it.
- Retry reads freely. Retry idempotent writes only with the identical body.
  Reconcile non-idempotent and financial writes before retrying.
- Preserve the monetary unit declared by each response. Do not assume v3 minor
  units and legacy micro-units use the same scale.
- Normalize internationalized domains to the contract's punycode A-label form
  while retaining the Unicode form for user confirmation when available.

## Completion report

State the surface used, exact domain and account context without secrets, action
and identifiers, confirmation obtained for high-impact work, terminal state
verified, DNS authority and propagation status when relevant, and any pending
approval, transfer, registry, billing, or resolver work.
