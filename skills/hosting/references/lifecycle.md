# Application lifecycle

Use these sequences for state-changing Hosting workflows. Read
[api-contract.md](api-contract.md) for exact schemas, scopes, and rate limits.

## Contents

- [Discover or create the app](#discover-or-create-the-app)
- [Prepare and upload source](#prepare-and-upload-source)
- [Validate preview](#validate-preview)
- [Publish](#publish)
- [Roll back](#roll-back)
- [Update app metadata](#update-app-metadata)
- [Delete an app](#delete-an-app)
- [Ambiguous writes](#ambiguous-writes)

## Discover or create the app

1. Call `GET /apps` and match an exact known ID or an unambiguous name. Do not
   silently select the first app.
2. If creation is required, confirm the intended name. Omit `datacenter` unless
   the user or current public guidance selects a documented code.
3. Call `POST /apps` once and retain `job.id`.
4. Poll `GET /apps/jobs/{jobId}` within its 120-per-minute limit. Use bounded
   backoff rather than the maximum rate.
5. Continue only when the job is `active` and the response contains the app.
   Report `failed` and preserve the job ID for diagnosis.

## Prepare and upload source

1. Inspect the project before packaging. Determine which directory contains the
   deployable Node.js application and whether `rootPath` is already configured.
2. Run the project's existing tests and production build when practical.
3. Create a deterministic ZIP from the intended source tree. Exclude at least
   VCS metadata, dependency caches, editor state, local logs, `.env` files,
   credentials, and unrelated monorepo packages. Do not assume dependencies or
   build artifacts belong in the archive without current platform guidance.
4. Call `POST /apps/{appId}/source` as multipart form data with field
   `zipFile`. Retain `jobId`.
5. Poll `GET /apps/{appId}/source/status?jobId=...`. Preserve
   `progressMessage`, `errorStage`, and a redacted `errorMessage` for diagnosis.
6. Do not publish until the service reports a terminal successful upload state.
   The public page does not enumerate those state strings, so follow the live
   response and current public contract instead of hardcoding guessed values.

Uploading source and publishing are separate actions. A successful upload does
not prove that either runtime variant is healthy.

## Validate preview

1. Call `GET /apps/{appId}/status` and select the `preview` variant.
2. Use the app's returned preview URL rather than constructing one.
3. Exercise the app's existing health or smoke path. Do not add a public debug
   route merely for deployment validation.
4. If unhealthy, request narrowly bounded preview logs with an accepted source,
   recent `since`, and conservative line count. Redact before reporting.
5. Reconcile preview secret names when configuration is missing. Values cannot
   be read back; update only values supplied through an approved secret source.

## Publish

1. Confirm the exact app and latest accepted source job.
2. Ensure publish-variant secrets are present independently of preview secrets.
3. Call `POST /apps/{appId}/deployments` once and retain `deploymentId`.
4. Poll `GET /apps/{appId}/deployments` until that exact deployment reaches
   `deployed` or `failed`. Also inspect `GET /apps/{appId}/status` for the
   `publish` variant.
5. Exercise the returned publish URL. Treat a redirect or HTTP response alone
   according to the application's own health contract; do not call a deployment
   healthy solely because the URL exists.

## Roll back

Rollback changes production state and may be disabled.

1. List deployments and identify an exact previously successful deployment.
2. Present the app ID/name, current deployment when known, target deployment ID,
   and target `gitHash`; obtain confirmation unless those exact details were
   already authorized.
3. Call `POST /apps/{appId}/rollback` once.
4. Retain the returned `deploymentId`, `rollbackFrom`, `commitHash`, and status.
5. Poll the new deployment and publish variant. If the API returns `403`, report
   that rollback is not enabled instead of attempting another route.

## Update app metadata

Read the app first. Send only fields that must change. At least one of `name` or
`rootPath` is required. Changing `rootPath` can change what source is built or
run, so require an exact intended path and verify preview afterward.

## Delete an app

Deletion is destructive.

1. Fetch the exact app and show its ID, name, preview URL, and publish URL.
2. Confirm deletion of that exact app unless already authorized.
3. Call `DELETE /apps/{appId}` once and expect `204`.
4. Verify with `GET /apps/{appId}` or `GET /apps`. A `404` or absence is the
   expected final state; do not recreate the app as a test.

## Ambiguous writes

After a timeout or connection loss, never blindly repeat a write:

| Write | Reconcile before retry |
|---|---|
| Create | Poll the retained job; otherwise list apps for the exact intended app. |
| Upload | Poll the retained source job and inspect the current app state. |
| Secret mutation | List secret metadata and compare names/timestamps; values remain unknowable. |
| Publish | List deployments and match the retained deployment ID or recent commit hash. |
| Rollback | List deployments and inspect publish status before another rollback. |
| Update | Get the app and compare `name` and `rootPath` state. |
| Delete | Get/list the app; absence already represents success. |

The public pages do not document idempotency keys. Preserve every returned job
and deployment identifier and design automation to resume polling them.
