# Authentication and production connection

Use this reference whenever code or automation calls the Node.js Hosting API.

## Fixed public endpoints

| Purpose | Endpoint |
|---|---|
| OAuth token | `https://oauth.api.godaddy.com/v2/oauth2/token` |
| Node.js Hosting API root | `https://api.godaddy.com/v1/hosting/nodejs` |

Do not add an environment selector or accept a caller-provided service origin.
Append the documented operation path to the fixed API root.

## OAuth flow

Use OAuth 2.0 client credentials from a trusted server, CI secret store, or
operator environment. Send a form-encoded token request with:

- `grant_type=client_credentials`
- the provisioned `client_id`
- the provisioned `client_secret`
- a space-delimited `scope` containing only the capabilities needed

Use the resulting token as `Authorization: Bearer <access-token>` on Hosting
requests. Do not place either credential or the token in query parameters,
browser code, logs, ZIP uploads, or tracked files.

The public Hosting overview documents this token flow and endpoint, but its
linked authentication guide currently returns `404`. The public documentation
does not explain client provisioning, eligibility, token lifetime, or refresh
behavior. Require credentials obtained through an approved GoDaddy production
onboarding path; do not invent registration steps or reuse the interactive
Commerce MCP OAuth client.

## Scope catalog

| Scope | Operations |
|---|---|
| `hosting.paas.apps:read` | List/get apps, list deployments, get app status |
| `hosting.paas.apps:create` | Create an app and poll its creation job |
| `hosting.paas.apps:update` | Update app name or `rootPath` |
| `hosting.paas.apps:delete` | Delete an app |
| `hosting.paas.code:write` | Upload ZIP source and poll the upload job |
| `hosting.paas.secrets:write` | List secret metadata and mutate secrets |
| `hosting.paas.deploy:execute` | Publish and roll back |
| `hosting.paas.logs:read` | Read application or build logs |

The secret metadata read currently requires the write scope; do not substitute
an invented read-only scope.

For a single workflow, request the union of only its required scopes. A
read-only inspection generally needs `hosting.paas.apps:read` and, only when
logs are requested, `hosting.paas.logs:read`. Deployment automation commonly
also needs code, secret, and deploy scopes; app creation, update, and deletion
remain separate capabilities.

## Request handling

- Use `application/json` for JSON bodies and `multipart/form-data` only for the
  ZIP source upload.
- Keep token acquisition and API calls server-side.
- On `401`, obtain a new token once, confirm the operation's exact scope and
  account eligibility, then stop if the failure persists.
- On `429`, honor `X-RateLimit-*` response headers when present, back off with
  jitter, and stay within the per-operation limit in
  [api-contract.md](api-contract.md).
- Do not log raw authorization headers, token responses, secret operations, or
  unredacted error bodies.

## Public documentation gap

The overview links to:

- `https://developer.godaddy.com/docs/hosting/authentication`
- `https://developer.godaddy.com/docs/hosting/concepts`

Both returned `404` when this skill was authored. Recheck them before claiming
that credential provisioning, status semantics, or additional operational
requirements are supported publicly.
