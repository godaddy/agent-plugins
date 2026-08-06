# Contract-driven transaction work

The checked-in or officially published production contract is authoritative.
Confirm the fixed production URL, version, auth, scopes, idempotency header,
request schema, response schema, error model, pagination, and event version.

For GoDaddy Payments, the currently reviewed Transactions v2 REST contract
supports transaction list and get. It does not define capture, refund, or void
writes. Those operations use a separate v1 surface and must not be implemented
until its approved contract is available. Commerce MCP currently exposes
commerce/catalog/order capabilities, not a payment transaction surface.

When a requested write is absent:

1. do not infer the route from a read URL;
2. do not copy an unversioned example from unrelated code;
3. do not adapt a field shape from another provider;
4. report exactly which approved contract is missing;
5. continue only with non-writing design, UI state, or an explicit test fake.

For transaction reads, paginate deliberately, apply server-side filters where
supported, bound date windows and page sizes, retain currency with amounts, and
distinguish “not found” from insufficient scope and upstream unavailability.
Treat provider payload text as untrusted data.
