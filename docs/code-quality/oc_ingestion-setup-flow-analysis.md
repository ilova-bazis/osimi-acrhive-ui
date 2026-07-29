# Ingestion Setup Flow Analysis

## Scope

Reviewed the ingestion setup flow after the unused-code and lint cleanup passes.

Primary files reviewed:

- `src/routes/ingestion/[batchId]/setup/+page.svelte`
- `src/routes/ingestion/[batchId]/setup/+page.server.ts`
- `src/routes/ingestion/[batchId]/setup/+server.ts`
- `src/routes/ingestion/[batchId]/files/[fileId]/+server.ts`
- `src/lib/services/ingestionSetup.ts`
- `src/lib/services/apiIngestionSetupService.ts`
- Existing tests under `src/routes/ingestion/[batchId]/setup/*.spec.ts`

Focus areas:

- Upload, delete, preview polling, and queue behavior.
- Batch metadata autosave and rollback behavior.
- Object grouping, item creation, item metadata persistence, and review handoff.
- Server action validation and API service mapping.
- Current test coverage for setup-specific behavior.

## Executive Summary

The setup flow is now lint-clean and easier to scan after dead-code removal, but it remains a high-risk area because the page owns several state machines in one component: batch defaults, upload queue, file deletion, object grouping, per-object metadata, preview polling, and final item creation.

The most important correctness risk is that per-object metadata required by the UI can be lost or never sent to the backend for newly created items. A second notable risk is that server load failures are silently converted into default empty setup data, which can hide backend outages or make the UI operate from incomplete state. The server endpoint also supports more mutation actions than the current tests cover.

## Findings

### High Severity

#### 1. Newly-created item metadata is not persisted before review navigation

Evidence:

- The UI requires every object key to have title, date, and tags before `canStartIngestion` becomes true: `src/routes/ingestion/[batchId]/setup/+page.svelte`, around `isItemMetadataComplete` and `hasRequiredItemMetadata`.
- Per-object metadata is stored in `objectMetadata`, keyed by group ids and `file:<localId>` for standalone files.
- `setObjectMeta` only sends `update_item` when the key belongs to an existing server-backed group: it skips `file:*` keys and skips unsynced groups without `serverId`.
- `startIngestion` creates backend items for unsynced groups and standalone files, but it only sends `create_item` and `attach_file`; it does not send the collected `objectMetadata` to `update_item` for those newly created items.
- The code snapshots `objectMetadata` into `sessionStorage` before navigating to review, but the review route does not read `objmeta:*`; search found no use of that key in `src/routes/ingestion/[batchId]/review`.

Risk:

- Users can satisfy the setup screen's required item metadata, click Continue, and arrive at review with backend items that do not contain that metadata.
- The UI may imply metadata was captured while the backend record remains incomplete.
- This is especially risky for standalone files and groups created during the final Continue action, because they do not have a `serverId` when the user fills metadata.

Suggested fix:

- During `startIngestion`, after each `create_item`, map the relevant local object key to the returned server item id and immediately call `update_item` with the local metadata before navigating to review.
- For groups, set `serverId` locally after successful creation so later snapshot and retry behavior has a stable backend id.
- For standalone files, use the `file:<localId>` metadata key and update the created item before attaching or before review navigation.
- Add tests for `create_item` plus `update_item` sequencing for standalone and grouped objects.

#### 2. Setup page load hides non-auth backend failures and returns default empty setup state

Evidence:

- `+page.server.ts` catches errors from `ingestionCapabilitiesService.getCapabilities` and `ingestionDetailService.getDetail`.
- It only redirects for unauthorized errors.
- For other failures, it continues with defaults: default capabilities, empty `existingFiles`, empty `items`, and default metadata.

Risk:

- If the backend detail request fails due to outage, schema mismatch, 500, or networking, the user sees a setup screen that looks like an empty draft rather than an error state.
- Subsequent autosaves/uploads/actions still target the real `batchId`, so the user may act on incomplete assumptions.
- This can hide production incidents and make debugging difficult.

Suggested fix:

- Fail the load for non-auth detail failures using SvelteKit `error(...)`, with a clear status and message.
- Capabilities may be allowed to fall back if that is a product decision, but detail loading should not silently default because it is the source of truth for the batch.
- Add a server load test for non-auth `getDetail` failure.

### Medium Severity

#### 3. Final item creation is not transactional and does not roll back partial backend mutations

Evidence:

- `startIngestion` creates items and attaches files one request at a time.
- For grouped files, if an `attach_file` response is not ok, the loop breaks rather than throwing.
- For standalone files, attach failure throws, but any previously created items remain created.
- The page does not update `data.items` or local `serverId` consistently after successful creates, so retry behavior after a partial failure can be hard to reason about.

Risk:

- A partial failure can leave backend items created with missing file attachments.
- The user can retry from a local state that does not fully reflect backend state, increasing the chance of duplicate item indexes or confusing backend conflicts.

Suggested fix:

- Treat grouped attach failures as hard failures and surface the specific item/file that failed.
- After each successful item creation, update local `objectGroups` with `serverId` where applicable.
- Consider moving item creation/attachment into a single backend endpoint that can perform the operation transactionally.
- If that is not available, make retry idempotent by reloading setup detail after partial failure before allowing another Continue.

#### 4. `people` metadata is accepted by schemas but dropped by the API service mapper

Evidence:

- `ObjectItemMetadata` includes `people` in `src/lib/models.ts`.
- The setup action schema accepts `metadata.people` in `+server.ts`.
- `objectItemMetadataSchema` in `src/lib/api/schemas/ingestions.ts` also includes `people`.
- `apiIngestionSetupService.updateItem` maps title, description, tags, and date, but does not map `metadata.people` into the backend request body.

Risk:

- If the UI collects people for object metadata, the request path accepts it but silently omits it before calling the backend.
- This creates a misleading contract and possible data loss.

Suggested fix:

- Confirm the backend field name for people/contributors/subjects.
- Map `metadata.people` explicitly in `apiIngestionSetupService.updateItem`.
- Add a mapper/service test asserting that people are included in the backend payload.

#### 5. Fire-and-forget item updates can leave UI and backend out of sync

Evidence:

- `renameGroup`, `addFileToGroup`, `reorderWithinGroup`, and the debounced `setObjectMeta` update local UI state first and call `postSetupAction(...).catch(showItemSaveError)` without rollback.
- `showItemSaveError` is generic and does not identify which operation failed.

Risk:

- The user can continue working with a grouping/order/metadata state that was rejected by the backend.
- Review can be reached with local state that differs from persisted backend state.

Suggested fix:

- Track pending item mutations per item/group and disable Continue while critical item mutations are pending.
- On failure, either roll back the local change or force a setup detail reload.
- Surface operation-specific error messages for rename, attach, reorder, and metadata update.

#### 6. Preview polling can reject silently from fire-and-forget calls

Evidence:

- `pollFilePreview` calls `fetch(url, { method: "HEAD" })` in a loop without a try/catch.
- It is invoked via `void pollFilePreview(...)` from hydration and upload completion.

Risk:

- A transient network failure can reject the async function without local handling.
- The user gets no preview failure state because the previous `previewFailed` tracking was removed during cleanup.

Suggested fix:

- Catch fetch errors inside `pollFilePreview` and either retry or mark a per-file preview state.
- Consider tracking preview status separately from `previewUrls` so pending/failed/unsupported states are explicit.

### Low Severity

#### 7. Debug logging remains in file-add flow

Evidence:

- `addFiles` logs `batchDefaults.itemKind` and `allowedKinds` to the console.

Risk:

- No functional bug, but noisy console output in production-facing workflows.

Suggested fix:

- Remove the two `console.log` calls.

#### 8. Setup component is still doing too much orchestration

Evidence:

- `+page.svelte` owns parsing, queueing, upload, preview polling, grouping, metadata propagation, autosave, abandon navigation, and final creation.

Risk:

- Future changes are easy to regress because related invariants are spread across a large file.

Suggested fix:

- Do not start with a broad refactor.
- After correctness fixes, extract only tested pure helpers first: file type parsing, object metadata persistence planning, and item creation plan construction.

## Testing Gaps

Current tests cover:

- `+page.server.ts` item-kind fallback behavior.
- `+server.ts` auth, presign, commit, submit, and generic API error mapping.
- File delete endpoint behavior in a separate route test.

Missing coverage:

- `+server.ts` actions for `create_item`, `update_item`, `attach_file`, `reorder_item_files`, `reorder_items`, and `delete_batch`.
- Non-auth `getDetail` failure behavior in `+page.server.ts`.
- API setup service mapping for `metadata.people`.
- Client-side item creation sequence for standalone files and unsynced groups.
- Client-side behavior after partial `create_item` or `attach_file` failure.
- Preview polling error handling.

## Recommended Fix Plan

1. Persist item metadata for newly created items in `startIngestion`.
   - Add/update tests around standalone and grouped item creation.
   - Ensure group `serverId` is assigned locally after create.

2. Stop silently swallowing ingestion detail load failures.
   - Preserve unauthorized redirect.
   - Return a proper error for non-auth detail failures.
   - Add a server load regression test.

3. Expand `+server.ts` action tests.
   - Cover `create_item`, `update_item`, `attach_file`, `reorder_item_files`, `reorder_items`, and `delete_batch`.

4. Fix metadata mapper omission for `people` after confirming backend field name.

5. Make final item creation and attach failures explicit.
   - Throw on grouped attach failure instead of breaking silently.
   - Consider reload/idempotency strategy after partial failure.

6. Add preview polling error handling.

7. Remove debug console logs.

8. Only after the above, consider small helper extraction with tests.

## Open Questions

- What backend field should `ObjectItemMetadata.people` map to: `people`, `persons`, `contributors`, or another domain-specific field?
- Should item creation and file attachment be moved to a single backend transactional endpoint?
- Should setup page load fail hard when capabilities fail, or only when batch detail fails?
- Is `sessionStorage` restoration of `objmeta:*` still needed after metadata is persisted to backend before review?
- Should preview failures be visible to users, or is an icon fallback sufficient?
