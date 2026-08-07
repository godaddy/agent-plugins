# Node.js Hosting REST contract

This is the complete public operation and schema inventory reviewed on
2026-08-06. Use the live reference pages as authority when they change.

## Contents

- [Shared conventions](#shared-conventions)
- [Operation matrix](#operation-matrix)
- [App schemas and operations](#app-schemas-and-operations)
- [Source operations](#source-operations)
- [Secret operations](#secret-operations)
- [Deployment operations](#deployment-operations)
- [Log operation](#log-operation)
- [Error contract](#error-contract)
- [Unspecified behavior](#unspecified-behavior)
- [Public sources](#public-sources)

## Shared conventions

- API root: `https://api.godaddy.com/v1/hosting/nodejs`
- Auth: OAuth 2.0 client credentials from
  `https://oauth.api.godaddy.com/v2/oauth2/token`
- Variants: `preview` and `publish`
- Async writes: create returns `202`; upload, publish, and rollback return `200`
  with a job or deployment identifier that must be polled
- Secret values: never returned
- Rate limits: per minute per client IP; successful responses also expose
  `X-RateLimit-*` headers

## Operation matrix

| Operation | Method and path | Required scope | Limit/min | Success | Other documented errors |
|---|---|---|---:|---|---|
| List apps | `GET /apps` | `hosting.paas.apps:read` | 60 | `200` | `401`, `429` |
| Create app | `POST /apps` | `hosting.paas.apps:create` | 10 | `202` | `401`, `429` |
| Poll app creation | `GET /apps/jobs/{jobId}` | `hosting.paas.apps:create` | 120 | `200` | `401`, `404`, `429` |
| Get app | `GET /apps/{appId}` | `hosting.paas.apps:read` | 60 | `200` | `401`, `404`, `429` |
| Update app | `PATCH /apps/{appId}` | `hosting.paas.apps:update` | 10 | `200` | `401`, `404`, `429` |
| Delete app | `DELETE /apps/{appId}` | `hosting.paas.apps:delete` | 10 | `204` | `401`, `404`, `429` |
| Upload source | `POST /apps/{appId}/source` | `hosting.paas.code:write` | 10 | `200` | `401`, `404`, `429` |
| Poll source upload | `GET /apps/{appId}/source/status?jobId=...` | `hosting.paas.code:write` | 120 | `200` | `401`, `404`, `429` |
| List secret metadata | `GET /apps/{appId}/secrets` | `hosting.paas.secrets:write` | 60 | `200` | `401`, `404`, `429` |
| Mutate secrets | `POST /apps/{appId}/secrets` | `hosting.paas.secrets:write` | 10 | `200` | `401`, `404`, `429` |
| List deployments | `GET /apps/{appId}/deployments` | `hosting.paas.apps:read` | 60 | `200` | `401`, `404`, `429` |
| Publish | `POST /apps/{appId}/deployments` | `hosting.paas.deploy:execute` | 10 | `200` | `401`, `404`, `429` |
| Get app status | `GET /apps/{appId}/status` | `hosting.paas.apps:read` | 120 | `200` | `401`, `404`, `429` |
| Roll back | `POST /apps/{appId}/rollback` | `hosting.paas.deploy:execute` | 10 | `200` | `401`, `403`, `404`, `429` |
| Get logs | `GET /apps/{appId}/logs` | `hosting.paas.logs:read` | 60 | `200` | `401`, `404`, `429` |

## App schemas and operations

An app summary contains:

```text
id: string
name: string
status: string
createdAt: string
updatedAt: string
urls: { preview?: string, publish?: string }
variants?: Array<{ name: string, status: string }>
```

An app detail uses the same fields and may also include:

```text
variantsWithLifecycle?: Array<{
  variant: string
  status: string
  lifecycleState?: string
}>
```

### List apps

`GET /apps` returns `200 { apps: AppSummary[] }`. No pagination parameters are
documented.

### Create app

`POST /apps` accepts JSON:

```text
name: string                 required
datacenter: "p3" | "sxb1"    optional
```

It returns `202`:

```text
job: {
  id: string
  status: "pending" | "active" | "failed"
}
```

Do not choose a datacenter code without explicit direction; the public page
does not explain the codes or selection criteria.

### Poll app creation

`GET /apps/jobs/{jobId}` returns the same required `job` and an optional `app`
using the app-detail schema. The app is documented as present once the job is
`active`.

### Get app

`GET /apps/{appId}` returns `200 { app: AppDetail }`.

### Update app

`PATCH /apps/{appId}` accepts JSON containing at least one field:

```text
name?: string
rootPath?: string
```

It returns `200 { app: AppDetail }`. The public page does not define
`rootPath` normalization or archive-path constraints.

### Delete app

`DELETE /apps/{appId}` returns `204` with no response body.

## Source operations

### Upload ZIP source

`POST /apps/{appId}/source` requires `multipart/form-data` with one required
field named `zipFile`. Its public schema types the field as a string. It returns:

```text
200 { jobId: string }
```

### Poll source upload

`GET /apps/{appId}/source/status` requires the query parameter `jobId` and
returns:

```text
status: string              required
progressMessage?: string
errorMessage?: string
errorStage?: string
```

The public schema does not enumerate upload status values or define each error
stage.

## Secret operations

Secret metadata contains:

```text
name: string                required
systemManaged: boolean      required
createdAt?: string
updatedAt?: string
```

Both secret operations return:

```text
shared: { secrets: SecretMetadata[] }
variants: {
  preview?: { secrets: SecretMetadata[] }
  publish?: { secrets: SecretMetadata[] }
}
```

Values are never returned.

### List secret metadata

`GET /apps/{appId}/secrets` accepts an optional string query parameter named
`variant`. Use `preview` or `publish`, the two variants documented by the
overview. The operation requires `hosting.paas.secrets:write` despite being a
read.

### Add, update, or delete secrets

`POST /apps/{appId}/secrets` accepts:

```text
variant: "preview" | "publish"             required
operations: {
  additions: Array<{ name: string, value: string }>  required
  updates: Array<{ name: string, value: string }>    required
  deletions: Array<{ name: string }>                 required
}
```

Send all three arrays, using empty arrays for operation classes that are not
needed. The contract does not document a way to mutate shared or system-managed
secrets.

## Deployment operations

A deployment in list responses contains:

```text
id: string
status: "pending" | "deploying" | "deployed" | "failed"
gitHash: string
createdAt: string
updatedAt: string
errorMessage?: string
```

### List deployments

`GET /apps/{appId}/deployments` accepts optional integer `limit` and returns:

```text
deployments: Deployment[]
totalCount: integer
hasMore: boolean
```

No cursor, offset, or next-page token is documented even when `hasMore` is
true. Do not invent one.

### Publish latest source

`POST /apps/{appId}/deployments` has no documented request body and returns:

```text
deploymentId: string        required
status: string              required
commitHash?: string
```

### Get app status

`GET /apps/{appId}/status` returns:

```text
appStatus: string
variants: Array<{
  variant: string
  status: string
  lifecycleState?: string
}>
```

### Roll back

`POST /apps/{appId}/rollback` accepts required JSON
`{ deploymentId: string }` and returns:

```text
rollbackFrom: string
commitHash: string
deploymentId: string
status: string
```

`403` specifically means rollback is not enabled.

## Log operation

`GET /apps/{appId}/logs` requires:

- `target`: string; use the documented `preview` or `publish` target
- `source`: string; required, but allowed values are not enumerated
- `since`: string; required, but its format is not documented
- `lines`: optional integer; bounds are not documented

It returns:

```text
logs: Array<{
  timestamp: string
  source: string
  message: string
  level: string
}>
total: number
```

The page describes application and build logs but does not define the exact
`source` strings.

## Error contract

The documented `429` body is:

```text
error: string
code: "RATE_LIMITED"
detail: string
```

Every operation documents `401` for a missing session, invalid API key or
Bearer token, or insufficient OAuth scope. Resource-specific operations also
document `404`. Rollback additionally documents `403` when disabled. Other
validation and service error schemas are not shown on these pages.

## Unspecified behavior

Do not guess the following from the current public pages:

- how production OAuth clients are provisioned or which accounts are eligible
- token lifetime or refresh behavior
- generic app, variant, upload, publish-response, rollback, and lifecycle status
  enum values beyond the enums written above
- datacenter meanings or selection rules
- ZIP size, file-count, ignore, Node version, build, start, or archive-root rules
- `rootPath` syntax and normalization
- log `source`, `since`, or `lines` constraints
- deployment continuation when `hasMore` is true
- idempotency headers or keys for write operations

## Public sources

- [Overview](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting)
- [Apps](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/apps)
- [Source](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/source)
- [Secrets](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/secrets)
- [Deployments](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/deployments)
- [Logs](https://developer.godaddy.com/en/docs/references/rest/nodejs-hosting/logs)
