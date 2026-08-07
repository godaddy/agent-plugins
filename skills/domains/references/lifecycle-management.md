# Domain lifecycle management

Use current state and the live contract for every action. TLD registry policy
can override generic timing and eligibility rules.

## Inventory and detail

Use v1 list/detail or the current CLI to inspect ownership, status, expiration,
auto-renew, lock, privacy, and nameservers. v1 lists use `limit` and `marker`;
advance sequentially with the last domain from the page and retry the same
marker after a transient failure.

Do not collapse every registry status into active/inactive. Preserve unknown
values and use the current contract's status groups when filtering.

## Lock and privacy

Registry lock blocks outbound transfer and does not affect web, mail, or DNS.
Keep it enabled by default. Disable only when a specific transfer or TLD contact
change requires it, then restore and verify immediately.

WHOIS privacy and contact accuracy are different concerns. Never invent contact
data. Read the current domain before changing privacy or registrant identity.

## Contacts

The registrant is the legal holder. Admin, billing, and technical roles can
default from it but remain separate update targets. Use the current v1 contact
shape and TLD validation rules; phone, address, state, and organization
requirements vary.

Changing registrant first name, last name, email, or organization while privacy
is disabled can trigger ICANN change-of-registrant approval. Explain the pending
old-registrant approval and possible delay. v2 exposes read/cancel operations
for a pending change. Some ccTLDs require a brief unlock; relock afterward.

## Renewals and expiration

Auto-renew is a setting change; manual renewal is a charge. For manual renewal:

1. Read domain status, `expires`, and current renewal price.
2. Show the exact domain, years, total, currency, and resulting intent.
3. Obtain explicit confirmation.
4. Execute once and preserve the order identifier.
5. Verify the new expiration before any retry.

Legacy renewal prices and purchase responses use currency micro-units; follow
the schema and divide by 1,000,000 only when that response declares micro-units.
Do not automate against a universal grace-period assumption. Generic domains
often have standard-renewal then redemption windows, while ccTLDs can differ
materially or expire without the same grace period.

## Forwarding

v2 forwarding addresses an account customer ID and FQDN. `GET` reads one rule;
`PUT` creates or replaces it; `DELETE` removes it. Use 301 for a permanent move,
302 for a temporary move, and avoid masked forwarding unless explicitly
required because it uses a frame and can harm accessibility and SEO.

Validate the `http` or `https` target, show the before/after rule, and verify
with `GET`. A forwarding rule is not the same as a DNS record.

## Transfers

The current v2 contract covers inbound initiation, accept, cancel, restart,
retry with a new authorization code, and outbound initiation/accept/reject.
Some v1 transfer operations remain available. Discover CLI support first for an
interactive task; otherwise use the live v2 or v1 schema.

- Treat authorization codes as secrets.
- Verify domain lock, recent-registration/contact-change restrictions, contact
  access, billing, and transfer status before initiating.
- Show price and exact direction before a chargeable inbound transfer.
- Transfer and renewal endpoints do not share registration's v3 idempotency
  guarantee. Re-read domain/action state after an ambiguous response.
- Treat every `202` as pending and follow operation, action, or notification
  state until terminal.

## Notifications and actions

v2 provides domain actions and a pull/acknowledge notification model. Opt in
only to required types, validate the current notification schema, process one
notification idempotently, persist the event identifier, and acknowledge only
after durable handling succeeds.

## Cancellation

Domain cancellation can stop resolution and mail and may allow another party to
obtain the name. Never use it for testing or cleanup. Require explicit
authorization for the exact domain, capture current services and recovery
expectations, execute once, and verify the resulting account state.
