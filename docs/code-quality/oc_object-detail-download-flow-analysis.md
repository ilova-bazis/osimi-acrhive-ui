# Object Detail, Download, and Resync Flow Analysis

## Scope

Reviewed the object detail and object access surfaces adjacent to the edit flow.

Primary files reviewed:

- `src/routes/objects/[objectId]/+page.server.ts`
- `src/routes/objects/[objectId]/+page.svelte`
- `src/routes/objects/[objectId]/page.server.spec.ts`
- `src/routes/objects/[objectId]/artifacts/[artifactId]/view/+server.ts`
- `src/routes/objects/[objectId]/artifacts/[artifactId]/download/+server.ts`
- `src/routes/objects/[objectId]/resync/+server.ts`
- `src/routes/objects/resync/+server.ts`
- `src/routes/objects/+page.server.ts`
- `src/routes/objects/+page.svelte`
- `src/lib/components/object-detail/ObjectViewerCanvas.svelte`
- `src/lib/components/object-detail/ObjectDetailTopBar.svelte`
- `src/lib/services/objects.ts`
- `src/lib/services/apiObjectsService.ts`
- `src/lib/api/schemas/objects.ts`
- `src/lib/api/mappers/objectsMapper.ts`
- `src/lib/api/mappers/objectsMapper.spec.ts`
- `src/lib/services/archiveRequests.ts`
- `src/lib/services/apiArchiveRequestsService.ts`

Focus areas:

- Object detail load and non-blocking side panel data.
- Download request action.
- Artifact inline view/download proxy endpoints.
- Single-object and bulk resync endpoints.
- Object service schema/mapper coverage.
- Existing test coverage.

## Executive Summary

The object detail load is generally structured well: the primary object detail fetch is fail-fast, while artifacts, available files, and pending archive requests are non-blocking with explicit error messages. Existing route tests cover the basic happy path, auth redirect, object not found, one non-blocking artifact failure, and a successful download request.

The most important risks are outside the main load path. The artifact `view` endpoint streams backend content under the app origin without response hardening, which can become a same-origin content execution risk if unsafe content types are ever returned. Resync routes expose operational actions to any authenticated user at the UI and route layer, relying entirely on backend authorization. Bulk resync accepts arbitrary array values and silently truncates to 50, which makes bad client payloads hard to detect.

## Findings

### High Severity

#### 1. Artifact `view` proxies arbitrary backend content under the app origin without hardening

Evidence:

- `src/routes/objects/[objectId]/artifacts/[artifactId]/view/+server.ts` fetches `/api/objects/:objectId/artifacts/:artifactId/view` and returns `new Response(response.body, ...)`.
- It forwards `content-type`, `content-length`, and `content-disposition` from the backend.
- It does not add `X-Content-Type-Options: nosniff`.
- It does not restrict inline rendering to known-safe media types.
- `ObjectViewerCanvas.svelte` uses this endpoint directly in `img`, `iframe`, audio/video, and text preview contexts.

Risk:

- If the backend ever returns `text/html`, active SVG, or another script-capable content type from this endpoint, the browser may render it under the UI origin.
- Because this is a same-origin route, any executable content may have a stronger trust boundary than intended.
- Even if the backend is expected to sanitize content types, this route currently has no defense-in-depth.

Suggested fix:

- Add response hardening to the `view` endpoint:
  - always set `X-Content-Type-Options: nosniff`
  - consider a restrictive `Content-Security-Policy` for streamed artifact responses, such as `default-src 'none'; img-src 'self' data: blob:; media-src 'self' data: blob:; style-src 'unsafe-inline'` if compatible
  - only allow inline passthrough for known viewer-safe content types, e.g. image, audio, video, PDF, plain text
  - force `Content-Disposition: attachment` or reject unsupported inline content types
- Add tests proving unsafe content types are blocked or forced to attachment.

#### 2. Resync actions rely entirely on backend authorization while UI exposes them broadly

Evidence:

- `ObjectDetailTopBar.svelte` renders the `Resync` button unconditionally for anyone who can load the object detail page.
- `src/routes/objects/[objectId]/resync/+server.ts` only checks that a session and auth token exist before calling `objectsService.requestResync`.
- `src/routes/objects/+page.svelte` exposes selection and bulk resync controls without checking role/capability.
- `src/routes/objects/resync/+server.ts` only checks session/token before calling `objectsService.requestResync` for each submitted object ID.

Risk:

- Any authenticated user can attempt object resync by direct POST or through visible UI controls.
- If backend authorization is incomplete or changes later, route-level and UI-level behavior will be too permissive.
- Even when the backend rejects unauthorized users, the UI currently advertises an operation users may not be allowed to perform.

Suggested fix:

- Decide whether resync is an admin/archiver-only operation or backend-only authorized operation.
- If route-level enforcement is desired, gate single and bulk resync by `locals.session.role` or by an explicit capability from backend-loaded data.
- Hide resync controls in `ObjectDetailTopBar` and object list selection tools for users without that capability.
- Add tests for unauthorized role rejection and allowed role success.

### Medium Severity

#### 3. Bulk resync accepts arbitrary array values and silently truncates input

Evidence:

- `src/routes/objects/resync/+server.ts` parses JSON and checks only `Array.isArray(body?.objectIds)` and `body.objectIds.length > 0`.
- It assigns `objectIds = body.objectIds.slice(0, 50)` without checking each value is a non-empty string.
- It silently ignores anything after the first 50 values.
- Each value is passed to `objectsService.requestResync({ objectId })`.

Risk:

- Malformed values such as numbers, empty strings, objects, or `null` can reach the service layer at runtime.
- Silent truncation can make client errors difficult to diagnose because the response implies only submitted results for the first 50 values.
- Duplicate IDs can queue repeated work unless the backend dedupes consistently.

Suggested fix:

- Add a route-local Zod schema for the bulk resync body:
  - `objectIds: z.array(z.string().trim().min(1)).min(1).max(50)`
  - optionally dedupe IDs before processing
- Return `400` when more than 50 IDs are submitted instead of truncating silently.
- Add tests for invalid values, empty values, too many IDs, duplicates, and partial backend failures.

#### 4. Single-object resync does not validate route object ID before service call

Evidence:

- `src/routes/objects/[objectId]/resync/+server.ts` passes `params.objectId` directly to `objectsService.requestResync`.
- The route does not explicitly check for a missing or empty `objectId`.

Risk:

- SvelteKit normally supplies the dynamic route parameter, but tests and malformed routing states can still exercise this path.
- It creates inconsistent behavior with other routes, which return 404 for missing object IDs.

Suggested fix:

- Add an explicit guard:
  - missing object ID returns `404` or `400` with `{ error: 'Object not found.' }`
- Add a route test for the missing parameter path.

#### 5. Artifact proxy endpoints do not handle backend network failures explicitly

Evidence:

- Both artifact proxy endpoints call `fetch(...)` directly.
- If the backend request rejects, the route lets the exception escape.
- Other service-backed routes usually map API/client failures into controlled redirects or error responses.

Risk:

- Backend network failures can become generic unhandled server errors instead of a controlled `502` with a useful message.
- The two endpoints duplicate the same behavior, increasing the chance of inconsistent fixes.

Suggested fix:

- Wrap backend `fetch` in try/catch and throw `error(502, { message: 'Failed to view artifact.' })` or download equivalent.
- Consider extracting a shared small helper for artifact proxying only if both endpoints are fixed together.
- Add tests for fetch rejection.

#### 6. Download request action only validates presence of `availableFileId`

Evidence:

- `src/routes/objects/[objectId]/+page.server.ts` reads `availableFileId` from form data and checks only that the trimmed string is non-empty.
- `objectAvailableFileSchema` and `objectDownloadRequestSchema` use `z.uuid()` for available file IDs at the API boundary.

Risk:

- Bad form payloads can reach the backend and come back as API errors instead of being rejected locally as malformed input.
- The behavior is inconsistent with the stricter object edit action validation added in the previous segment.

Suggested fix:

- Validate `availableFileId` with `z.uuid()` in the action.
- Return `fail(400, { error: 'Invalid available file id.' })` for malformed IDs.
- Add tests for missing and malformed IDs.

### Low Severity

#### 7. Download and view artifact proxy implementations are duplicated

Evidence:

- `view/+server.ts` and `download/+server.ts` duplicate:
  - API base resolution
  - passthrough status mapping
  - backend error message parsing
  - auth handling
  - response header copying

Risk:

- Security hardening or error behavior can drift between inline view and download routes.
- Fixes need to be applied twice.

Suggested fix:

- Extract a small shared server-only helper for artifact proxying if the hardening work touches both routes.
- Keep behavior configurable by mode: `view` versus `download`.

#### 8. Object detail route has partial tests, but adjacent endpoints are mostly untested

Evidence:

- Existing `src/routes/objects/[objectId]/page.server.spec.ts` covers load auth, detail success, 404, artifacts non-blocking failure, and one download request success.
- No tests were found for:
  - artifact `view` route
  - artifact `download` route
  - single-object resync route
  - bulk resync route
  - available files non-blocking failure
  - pending requests non-blocking failure
  - download request validation and API error paths

Risk:

- Permission, response-header, and failure-mode regressions can land without test coverage.

Suggested fix:

- Add focused server tests for these route endpoints before or alongside fixes.

## Testing Gaps

Missing coverage:

- `requestDownload` missing ID, malformed ID, unauthorized backend, generic API error, and unauthenticated redirect.
- `listObjectAvailableFiles` non-blocking error path in object detail load.
- `archiveRequestsService.listArchiveRequests` non-blocking error path in object detail load.
- Artifact `view` success header forwarding and unsafe content-type behavior.
- Artifact `download` success header forwarding and backend error behavior.
- Artifact proxy fetch rejection.
- Single-object resync auth, role/capability rejection if added, missing object ID, success, unauthorized backend, API error status mapping.
- Bulk resync auth, invalid JSON, invalid `objectIds`, too many IDs, success, partial failure, unauthorized backend mid-loop.
- `apiObjectsService` request body mapping for `createObjectDownloadRequest` and `requestResync`.

## Recommended Fix Plan

1. Harden artifact `view` responses.
   - Add `nosniff`, restrict or force-attachment unsafe content types, and add tests.

2. Add route-level resync authorization.
   - Gate single and bulk resync by role or explicit backend capability.
   - Hide resync UI when unavailable.
   - Add route and UI-facing tests where practical.

3. Validate bulk resync payloads.
   - Use a route-local Zod schema, reject malformed IDs and too many IDs, optionally dedupe.
   - Add tests.

4. Validate download request form payloads.
   - Use `z.uuid()` for `availableFileId`.
   - Add action tests for missing/malformed/API error paths.

5. Add controlled network-failure handling for artifact proxy routes.
   - Add tests for rejected backend fetches.

6. Expand object detail load tests.
   - Cover available files and pending request non-blocking failures.

7. Add `apiObjectsService` tests for request mapping.
   - Cover download request and resync paths.

## Open Questions

- Which roles should be allowed to resync objects: `admin` only, `admin` plus `archiver`, or a backend-provided capability?
- Should artifact `view` support PDFs and text inline, or should non-image/audio/video content always download?
- Should bulk resync reject more than 50 IDs, or return an explicit partial response saying only the first 50 were processed?
- Should duplicate object IDs in bulk resync be rejected, deduped silently, or reported per duplicate?
