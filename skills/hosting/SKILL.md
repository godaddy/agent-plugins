---
name: hosting
description: Deploy, operate, troubleshoot, or remove Node.js applications on GoDaddy Hosting through the public production REST API. Use when an agent needs to list, create, inspect, or update hosting apps; package and upload ZIP source; configure preview or publish secrets; publish, inspect deployments or runtime status, read build or application logs, roll back, delete an app, or implement CI/server automation for these operations. Do not use for domains, Commerce storefront or payment work, non-Node.js hosting products, or undocumented hosting control-plane operations.
---

# GoDaddy Hosting

Operate Node.js applications against the fixed public production API at
`https://api.godaddy.com/v1/hosting/nodejs`. Keep credentials and calls in a
trusted operator, CI, or server environment. Treat create, upload, publish, and
rollback responses as operation starts rather than proof of completion.

## Operating workflow

1. Inspect the application and existing deployment automation. Identify the
   project root, build and start behavior, ignored files, secret sources,
   intended app, and whether the task targets `preview`, `publish`, or both.
2. Read [references/authentication.md](references/authentication.md) before
   making a call. Use OAuth 2.0 client credentials, request only the scopes the
   operations require, and never put the client secret or access token in source
   code, browser code, command history, logs, or committed configuration.
3. Read current state before writing. List or get apps and preserve the exact
   `appId`. When creating an app, poll the returned creation job until `active`
   or `failed`; do not assume `202 Accepted` means the app exists.
4. Prepare source as a ZIP without dependency caches, VCS data, local secrets,
   or unrelated workspace files. Set `rootPath` only when the app lives below
   the archive root. Upload and poll the returned source job. Uploading source
   does not publish it.
5. Reconcile secret names for the intended variant. Secret values are write-only
   and can never be read back. Preserve system-managed secrets and avoid deleting
   an existing name merely because its value cannot be verified.
6. Validate the preview variant using runtime status and narrowly scoped logs.
   Redact credentials and personal data from all reported log excerpts.
7. Publish the latest accepted source only after preview checks pass. Poll the
   deployment and app status to a documented terminal result; an HTTP `200`
   from the publish request only means the operation started.
8. Roll back only to an exact deployment selected from history and after
   confirming the app and target. Poll the rollback's returned deployment.
   Delete only with explicit authorization for the exact app and verify absence.
9. Respect operation-specific rate limits and recover ambiguous writes by
   reading current jobs, deployments, or app state before retrying.

Use [references/lifecycle.md](references/lifecycle.md) for create, upload,
publish, rollback, and deletion sequences. Use
[references/secrets-logs-recovery.md](references/secrets-logs-recovery.md) for
variant isolation, observability, and failure recovery. Read
[references/api-contract.md](references/api-contract.md) whenever constructing
or reviewing a request, response type, scope, or rate-limit policy.

## Contract discipline

- Fetch the relevant live public reference page before implementing a durable
  client when network access is available. The bundled reference records the
  complete public contract reviewed on 2026-08-06; the current public page wins
  if it changes.
- Keep the production API root and OAuth token endpoint fixed. Do not expose an
  environment or service-origin selector to users.
- Do not invent undocumented enum values, pagination tokens, archive limits,
  log-source values, timestamp formats, app status values, or credential
  provisioning steps.
- The public overview links to Hosting concepts and authentication guides that
  currently return `404`. Treat credential acquisition and the unspecified
  fields called out in the contract reference as documentation gaps.

## Non-negotiable rules

- Never send OAuth client credentials or access tokens to a browser bundle.
- Never commit `.env` files, credential-bearing archives, or rendered secret
  values. Secret list responses contain metadata only.
- Never choose the optional datacenter code without an explicit requirement or
  current public guidance.
- Never retry create, upload, publish, rollback, secret mutation, or deletion
  after an ambiguous response without first reconciling server state.
- Never treat source upload as deployment, deployment start as success, preview
  health as published health, or rollback start as recovery.
- Never overwrite or delete secrets, change `rootPath`, roll back, or delete an
  app merely to test the integration.
- Never exceed `X-RateLimit-*` guidance or work around limits by rotating
  credentials or client IPs.

## Completion report

State the app ID and name, target variant, source and secret actions without
secret values, deployment or job IDs, terminal states verified, scopes used,
tests or health checks performed, and any behavior that remains pending or
blocked by missing public documentation.
