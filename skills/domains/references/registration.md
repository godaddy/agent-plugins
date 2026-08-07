# Registration

Use the v3 quote-execute workflow for new registrations. Registration creates a
real charge and cannot be reversed through an ordinary rollback.

Public sources: [registration guide](https://developer.godaddy.com/en/docs/api-users/purchase-domains/register),
[workflow](https://developer.godaddy.com/en/docs/api-users/workflows/domain-lifecycle),
and [v3 OpenAPI](https://developer.godaddy.com/openapi/domains-v3.json).

## Preconditions

- Confirm the account has a billing method and accurate registrant contact.
  The API does not accept card data in the registration request.
- Use a server-held PAT with `domains.domain:read` for preparation and
  `domains.domain:create` for execution.
- Use punycode A-label form for an internationalized domain in API requests, but
  show both Unicode and punycode forms before purchase.
- Check the current live schema for TLD- and profile-specific fields. The public
  guide defaults to account identity while the v3 contract can advertise saved
  or inline registration profiles; only send fields the current contract
  supports and show the quote's resolved settings.

## Discovery and quote

1. Check the exact domain immediately before quote. Public MCP results and v3
   discovery prices are indicative and do not reserve the name.
2. `POST /v3/domains/registration-quotes` with the domain and intended period.
   Add a profile or current pricing context only when the live contract and use
   case require it.
3. Treat `available: false` as a valid outcome with no `quoteToken`.
4. Treat the token as an opaque, short-lived capability. The current contract
   documents a 10-minute lifetime; obey the returned `expiresAt` rather than a
   local timer and never log or persist it beyond the intent.
5. Present:

   - exact domain and registration period
   - locked total and currency, preserving the response's monetary unit
   - indicative renewal price when returned
   - quote expiry
   - every required agreement title and URL
   - resolved registrant summary/source, privacy, auto-renew, and nameservers

Obtain explicit approval for those exact values. If anything changes, quote
again and confirm again.

## Execute

1. Capture the real consent time after the user agrees.
2. Copy every `agreementType` from that quote into consent. Do not hardcode
   `API_DPA` or assume the same agreements across TLDs.
3. Copy the quote's domain and period. Re-supply the same `profile`, `profileId`,
   or pricing context if one was part of the quote.
4. Generate a UUID for `Idempotency-Key` and store it with the registration
   intent before making the request.
5. `POST /v3/domains/registrations` once. Retrying the same intent after a lost
   response must reuse the same key and identical body.

Common semantic failures include `QUOTE_EXPIRED`, `QUOTE_MISMATCH`,
`INVALID_AGREEMENT_KEYS`, `MISSING_CONTACT`, missing billing, account or TLD
ineligibility, and the domain becoming unavailable. Fix the named condition;
never silently change the domain, period, registrant, or price.

## Poll and reconcile

The execute response is asynchronous. Preserve `registrationId`, `operationId`,
and HATEOAS links. Poll the returned registration resource or
`GET /v3/domains/operations/{operationId}` until:

- `COMPLETED`: verify the domain resource, expiration, and order identifier.
- `FAILED`: report the structured error and do not submit a new registration
  without a new user decision.
- `CONFIRMED` or `EXECUTING`: continue polling with bounded backoff.

Always poll at least once. On a timeout or lost response, first retry with the
same idempotency key or reconcile account/operation state; never create a fresh
intent reflexively.

## Billing readiness

Billing is configured in the account UI, not by sending payment details through
the Domains API. `$gddy` may open the official payment-method workflow. Treat
payment-profile, funded-balance, and contact errors as setup blockers, then
obtain a fresh quote after they are corrected.
