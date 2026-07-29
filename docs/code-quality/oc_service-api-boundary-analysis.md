# Service/API Boundary Analysis

## Scope

Reviewed backend-facing service, schema, mapper, and server helper code.

Primary files reviewed:

- `src/lib/server/apiClient.ts`
- `src/lib/server/auth.ts`
- `src/lib/api/auth.ts`
- `src/lib/api/schemas/auth.ts`
- `src/lib/api/schemas/errors.ts`
- `src/lib/api/schemas/ingestions.ts`
- `src/lib/api/schemas/objects.ts`
- `src/lib/api/schemas/dashboard.ts`
- `src/lib/api/schemas/archiveRequests.ts`
- `src/lib/api/mappers/ingestionsMapper.ts`
- `src/lib/api/mappers/objectsMapper.ts`
- `src/lib/api/mappers/objectEditMapper.ts`
- `src/lib/api/mappers/dashboardMapper.ts`
- `src/lib/api/mappers/archiveRequestsMapper.ts`
- `src/lib/services/apiIngestionSetupService.ts`
- `src/lib/services/apiIngestionDetailService.ts`
- `src/lib/services/apiIngestionOverviewService.ts`
- `src/lib/services/apiObjectEditService.ts`
- `src/lib/services/apiObjectsService.ts`
- `src/lib/services/apiArchiveRequestsService.ts`
- `src/lib/services/apiIngestionNewService.ts`
- `src/lib/services/apiDashboardService.ts`
- `src/lib/services/apiIngestionCapabilitiesService.ts`
- Existing service and mapper specs under `src/lib/**`.

Focus areas:

- Zod validation at backend request and response boundaries.
- Request body mapping from domain service contracts to transport payloads.
- Backend response normalization and fallback behavior.
- API error context preservation.
- Mapper and service regression coverage.

## Executive Summary

The core `backendRequest` helper gives the app a good boundary pattern: it validates successful backend responses, validates request bodies when a `requestSchema` is supplied, converts backend errors into typed `ApiClientError`, and preserves `request_id` when the backend error shape matches `backendErrorSchema`.

The main boundary gaps are consistency issues around that helper. Most successful responses are validated, but many mutating service methods build JSON bodies without passing a `requestSchema`. Several mappers and schemas still tolerate missing identifiers or access fields and then invent permissive defaults. The ingestion detail service also suppresses item/file fetch failures and converts them to empty arrays, which can make backend-contract or permission failures look like valid empty data.

## Bugs/Risks

### High Severity

#### 1. Ingestion detail load silently converts item and item-file backend failures into empty data

Evidence:

- `src/lib/services/apiIngestionDetailService.ts:221-240` fetches item files with `Promise.allSettled` and maps any rejected item-file request to `[]`.
- `src/lib/services/apiIngestionDetailService.ts:246-256` fetches ingestion detail and `fetchItemsWithFiles(...)` concurrently, then catches any item-list failure and returns `[] as IngestionDetailItem[]`.
- The caller receives a successful `IngestionDetail` with `items: []` even if `/api/ingestions/:batchId/items` failed with a network error, `403`, `500`, or invalid response.

Risk:

- A backend failure can be rendered as “this batch has no items,” which is materially different from “we failed to load items.”
- Setup, review, and batch detail routes can make decisions from incomplete domain state.
- Invalid backend response shapes for item list/files are hidden instead of surfacing `INVALID_RESPONSE`, weakening the schema boundary.

Suggested fix:

- Make `getDetail` fail when `fetchItemsWithFiles` fails, or return an explicit partial-data structure with an `itemsError` field if partial detail is intended.
- Avoid swallowing individual item-file failures unless the domain model can represent per-item file load errors.
- Add service tests for item-list rejection and item-file rejection.

#### 2. Missing authorization fields in object detail default to permissive values

Evidence:

- `src/lib/api/schemas/objects.ts:82-86` makes `is_authorized` and `is_deliverable` optional on `objectDetailItemSchema`.
- `src/lib/api/mappers/objectsMapper.ts:73-78` maps missing `is_authorized` to `true` and missing `is_deliverable` to `item.can_download`.
- `src/lib/objectDetail/accessState.ts:123-131` treats `isDeliverable && canDownload && primaryFile?.isAvailable` as `available`.
- `src/routes/objects/[objectId]/+page.svelte:472-473` displays the mapped authorization/deliverability values directly.

Risk:

- If the backend omits `is_authorized`, the UI presents the object as authorized by default.
- If the backend omits `is_deliverable`, the UI can infer deliverability from `can_download`, which may not be equivalent to backend deliverability policy.
- This is especially risky because these fields sit near access/download behavior and should fail closed, not open.

Suggested fix:

- Prefer requiring `is_authorized` and `is_deliverable` in `objectDetailItemSchema` if the backend contract guarantees them.
- If the backend cannot guarantee them yet, change mapper defaults to fail closed: `isAuthorized: item.is_authorized ?? false` and `isDeliverable: item.is_deliverable ?? false`, then adjust tests and UI copy if needed.
- Add mapper tests for missing `is_authorized` and `is_deliverable`.

### Medium Severity

#### 3. Many mutating service request bodies are not Zod-validated before transport

Evidence:

- `src/lib/server/apiClient.ts:150-170` validates request payloads only when `requestSchema` is provided.
- `src/lib/services/apiIngestionSetupService.ts` supplies request schemas for presign and commit, but not for create item, update item, reorder items, attach file to item, or reorder item files.
- `src/lib/services/apiObjectEditService.ts:70-143` builds metadata, document curation, and submit bodies without `requestSchema`.
- `src/lib/services/apiObjectsService.ts:178-196` builds `available_file_id` without `requestSchema`.
- `src/lib/api/schemas/ingestions.ts:265-269` defines `submitIngestionRequestSchema`, but `apiIngestionSetupService.submit` does not send a body or use that schema.

Risk:

- Runtime callers can pass malformed data despite TypeScript types, especially from form actions, tests, or future route code.
- Backend contract drift is detected for responses, but not consistently for outbound payloads.
- Service tests mock `backendRequest`, so missing `requestSchema` coverage can go unnoticed.

Suggested fix:

- Add request schemas for mutating service calls that send bodies:
  - create/update/reorder/attach ingestion item requests
  - object edit metadata/document/submit requests
  - object download request body
- Pass those schemas into `backendRequest`.
- Add service tests asserting the expected `requestSchema` is supplied for high-risk mutating calls.

#### 4. Backend error parsing preserves request IDs only for one narrow error envelope

Evidence:

- `src/lib/api/schemas/errors.ts:3-13` accepts `{ request_id, error: { code, message, details } }` only.
- `src/lib/server/apiClient.ts:98-122` falls back to `message: fallbackMessage` and `details: payload` whenever that schema does not parse.
- Several routes display request IDs from `ApiClientError.requestId`, for example `src/routes/objects/[objectId]/+page.server.ts:142-143` and `src/routes/objects/+page.server.ts:125-126`.

Risk:

- If the backend returns a common alternate shape such as `{ message, request_id }`, `{ detail, request_id }`, or `{ error: '...' }`, the UI loses the backend message and request ID.
- Operators get generic messages like `Request failed for objects.detail` even when the backend sent useful context.
- Error diagnostics become inconsistent across endpoints.

Suggested fix:

- Broaden error normalization to extract `request_id` and a message from known alternate shapes while still preserving raw payload in `details`.
- Add focused `apiClient` unit tests for canonical backend errors, alternate error envelopes, non-JSON responses, invalid JSON, and network failures.

#### 5. Ingestion schemas allow missing identifiers, then mappers invent fallback IDs and timestamps

Evidence:

- `src/lib/api/schemas/ingestions.ts:121-146` makes `id`, `ingestion_id`, `batch_id`, `batch_label`, `created_at`, and `updated_at` optional.
- `src/lib/api/mappers/ingestionsMapper.ts:9-15` falls back to `ingestion-${index + 1}` and `new Date(0).toISOString()`.
- `src/lib/services/apiIngestionDetailService.ts:175-196` falls back to `unknown` for detail ID and epoch timestamps for missing dates.
- `src/lib/api/mappers/ingestionsMapper.ts:107-108` returns an empty string if no create-ingestion ID field exists; `apiIngestionNewService` then throws a separate `INVALID_RESPONSE`.

Risk:

- Invalid backend responses can pass Zod validation and only become synthetic domain data later.
- Synthetic IDs can produce broken links or route parameters instead of failing at the API boundary.
- Epoch timestamps can make missing backend data look intentionally old rather than invalid.

Suggested fix:

- Add schema-level refinements requiring at least one stable ingestion identifier where the UI needs navigation.
- Require timestamps for list/detail responses if the backend contract guarantees them.
- Keep legacy alias support where needed, but fail before mapping when all aliases are absent.
- Add mapper/schema tests for missing IDs and timestamps.

### Low Severity

#### 6. Browser-side `src/lib/api/auth.ts` bypasses the shared API boundary and appears unused

Evidence:

- `src/lib/api/auth.ts:54-86` calls `fetch` directly, casts `await res.json()` to `LoginResponse`, and does not use Zod schemas.
- `src/lib/server/auth.ts:42-107` now implements server-side auth with `backendRequest`, `loginRequestSchema`, `loginResponseSchema`, `meResponseSchema`, and `logoutResponseSchema`.
- Search found no imports of `$lib/api/auth` under `src`.

Risk:

- If this module is reused later, it reintroduces unvalidated auth responses and localStorage token handling outside the server-cookie auth model.
- Dead or legacy auth code makes it less clear which boundary is authoritative.

Suggested fix:

- Delete `src/lib/api/auth.ts` if confirmed unused and not part of a planned client-auth path.
- If retained, convert it to use shared schemas and document why it exists separately from server auth.

## Refactor/Cleanup

### 1. Duplicate ingestion status normalization exists in two boundary layers

Evidence:

- `src/lib/api/mappers/ingestionsMapper.ts:17-41` defines `toIngestionStatus`.
- `src/lib/services/apiIngestionDetailService.ts:34-58` defines a near-identical `toIngestionStatus`.

Cleanup candidate:

- Extract a small shared mapper helper under `src/lib/api/mappers` or keep one canonical function in `ingestionsMapper.ts` if detail mapping is moved there.
- Add tests for representative raw backend status strings before deduplicating.

### 2. API client behavior has no direct unit tests

Evidence:

- No `src/lib/server/**/*.spec.ts` files exist.
- Existing route and service tests exercise some `ApiClientError` handling indirectly, but most service tests mock `backendRequest`.

Cleanup candidate:

- Add direct tests for `backendRequest` covering request validation, response validation, backend error envelopes, non-JSON responses, `204`, and network rejection.

### 3. Service tests mostly verify mapping shape, not schema enforcement

Evidence:

- `src/lib/services/apiObjectsService.spec.ts`, `apiObjectEditService.spec.ts`, and `apiIngestionSetupService.spec.ts` mock `backendRequest` and assert path/body shape.
- Because `backendRequest` is mocked, those tests cannot catch missing `requestSchema` or response schema drift.

Cleanup candidate:

- Keep existing body-shape tests, but add assertions for `requestSchema`/`responseSchema` on mutating calls.
- Add mapper/schema tests for edge cases that should fail closed.

## Testing Gaps

Missing or thin coverage:

- `backendRequest` request validation failures and invalid backend response failures.
- Backend error envelope variants and request ID preservation.
- `apiIngestionDetailService.getDetail` behavior when item list or item-file fetches fail.
- `objectsMapper` behavior when object detail access fields are missing.
- Request schema enforcement for object edit mutations.
- Request schema enforcement for ingestion setup item mutations.
- Request schema enforcement for object download requests.
- Ingestion schema behavior when all identifier aliases are absent.

## Recommended Fix Plan

1. Stop silent ingestion detail partial failures.
   - Decide whether item/file failures should fail the load or be represented explicitly as partial data.
   - Implement the chosen behavior in `apiIngestionDetailService`.
   - Add service and route tests for failure behavior.

2. Make object detail access mapping fail closed.
   - Require or fail-closed default `is_authorized` and `is_deliverable`.
   - Update mapper tests and any UI expectations.

3. Add missing request schemas for mutating service calls.
   - Start with object edit and object download request bodies.
   - Then cover ingestion item create/update/reorder/attach bodies.
   - Add service tests asserting schemas are wired into `backendRequest`.

4. Harden API error normalization.
   - Broaden error parsing without losing raw payload details.
   - Add `apiClient` unit tests.

5. Tighten ingestion DTO identifier validation.
   - Add schema refinements for required identifier aliases on list/detail/create responses.
   - Remove synthetic navigation IDs where invalid backend data should fail.

6. Clean up unused browser auth boundary.
   - Confirm no external imports exist.
   - Delete or convert `src/lib/api/auth.ts`.

7. Deduplicate ingestion status normalization.
   - Extract or consolidate after behavioral tests exist.

## Open Questions

- Should ingestion detail tolerate partial item/file failures, or should all item-related backend failures fail the page load?
- Does the backend guarantee `is_authorized` and `is_deliverable` on object detail responses, or should the UI treat absence as false during a compatibility window?
- Are legacy ingestion identifier aliases still needed for all endpoints, or can schemas now require canonical IDs per response type?
- Is `src/lib/api/auth.ts` intentionally retained for a future browser-auth mode, or can it be deleted?
