# DNS records and nameservers

Public sources: [DNS guide](https://developer.godaddy.com/en/docs/api-users/manage-domains/dns),
[DNS troubleshooting](https://developer.godaddy.com/en/docs/api-users/troubleshoot-dns),
and [v3 OpenAPI](https://developer.godaddy.com/openapi/domains-v3.json).

## Establish authority

Read the domain's current nameservers before touching records. GoDaddy record
APIs apply only while GoDaddy hosts the authoritative zone. Replacing
nameservers delegates authority; afterward, create and verify records at the new
provider instead.

Never edit `NS` or `SOA` through ordinary record endpoints. Use the dedicated
whole-set nameserver operation for delegation. Preserve the previous set for
recovery.

## v3 record operations

The production v3 base is `https://api.godaddy.com/v3/domains`.

| Need | Operation | Safety |
|---|---|---|
| List or filter records | `GET /zones/{zone}/dns-records` | Read-only, retry-safe |
| Append one record | `POST /zones/{zone}/dns-records` | Non-idempotent until state is reconciled |
| Delete one known record | `DELETE /zones/{zone}/dns-records/{recordId}` | Destructive; verify exact ID |
| Replace all nameservers | `PUT /domain-names/{domain-name}/nameservers` | High impact and async |
| Poll nameserver work | `GET /operations/{operationId}` | Continue to terminal state |

The legacy v1 API also supports append and replacement by entire zone, type, or
type-and-name. Use those only when the requested whole-set semantics are
intentional. A `PUT` to a replacement route removes records omitted from the
request. Snapshot the affected set and preview a diff first.

## Record construction

The current v3 contract supports `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SRV`,
`SOA`, `CAA`, and `ALIAS`, but ordinary writes can restrict system-managed
types. Use `@` for the apex and do not create an apex `CNAME`. Follow the live
schema for type-specific data:

- `A` and `AAAA`: valid IP address
- `CNAME` and `MX`: hostname form required by the live contract; MX also needs
  priority
- `SRV`: underscore-prefixed service and protocol plus priority, weight, port,
  and target data
- `CAA`: flag, tag, and issuer data

v3 TTL is currently documented from 600 through 86400 seconds. Preserve a
higher existing TTL unless the user intends to change it. For a planned cutover,
lower TTL before the change, wait out the old TTL, make the cutover, then restore
the intended TTL.

## Safe mutation workflow

1. List records narrowly by zone, type, and name.
2. Confirm the desired operation is append, targeted delete/recreate, or
   whole-set replacement.
3. Show existing and proposed records, including TTL and type-specific fields.
4. Obtain explicit confirmation before deleting or replacing records that can
   affect web, mail, certificate validation, or ownership verification.
5. Execute once and preserve the `recordId` or operation ID returned by the
   service. Do not construct IDs.
6. Re-read the affected set. After ambiguous append, search for the exact value
   before retrying to avoid duplicates.

## Verification and recovery

API acceptance and DNS propagation are separate:

1. Verify the record through the API.
2. Query an authoritative nameserver directly.
3. Optionally check public resolvers, expecting mixed results for up to the
   previous TTL.

For an incorrect nameserver replacement, send the known-good complete set as a
corrective operation and poll it. For a deleted record, recreate from the saved
snapshot. Never claim global propagation from one resolver response.
