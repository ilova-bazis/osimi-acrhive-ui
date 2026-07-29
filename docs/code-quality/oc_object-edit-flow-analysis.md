# Object Edit Flow Analysis

## Scope

Reviewed the production object edit flow and its service/API boundary.

Primary files reviewed:

- `src/routes/objects/[objectId]/edit/+page.svelte`
- `src/routes/objects/[objectId]/edit/+page.server.ts`
- `src/routes/objects/[objectId]/edit-lock/+server.ts`
- `src/lib/services/objectEdit.ts`
- `src/lib/services/apiObjectEditService.ts`
- `src/lib/api/schemas/objectEdit.ts`
- `src/lib/api/mappers/objectEditMapper.ts`
- Related object edit components, especially `SourceTextDiff.svelte`

Focus areas:

- Draft save and submit behavior.
- Edit lock handling and release behavior.
- Server action validation and permission boundaries.
- API schema and mapper reliability.
- Test coverage for edit-specific behavior.

## Executive Summary

The object edit flow is more contained than ingestion setup, and the API boundary is already structured well with Zod response schemas and DTO mappers. The main risks are around server actions trusting client-submitted JSON too much and relying on the UI to enforce edit/submit capabilities. The current route also has no direct tests for object edit load/actions or lock release, which makes lock and form behavior fragile.

The highest-priority improvement is to validate `saveDraft` form payloads on the server before passing them into `objectEditService`, and to ensure server actions enforce the same edit/submit capability assumptions that the UI presents.

## Findings

### High Severity

#### 1. `saveDraft` trusts client JSON without schema validation

Evidence:

- `src/routes/objects/[objectId]/edit/+page.server.ts` parses `metadata` and `rights` from `FormData` using `JSON.parse`.
- It only checks that parsed `metadata` and `rights` are truthy.
- Parsed values are passed directly to `objectEditService.saveObjectMetadata` as `ObjectEditMetadata` and rights note payloads.
- `pages` is parsed separately with `JSON.parse`, but that parse is not inside the existing try/catch. A malformed `pages` value can throw outside the intended `fail(400)` path.

Risk:

- Invalid or malicious form payloads can reach the service layer with missing fields, wrong types, unexpected arrays, invalid date precision, or non-string values.
- Malformed `pages` can produce a 500-style action failure instead of a controlled 400 response.
- This weakens the server boundary and makes backend errors harder to interpret.

Suggested fix:

- Add route-local Zod schemas for the `saveDraft` form payload:
  - metadata shape matching `ObjectEditMetadata`
  - rights note/sensitivity note shape
  - optional document pages array with `pageNumber` and `curatedText`
- Parse all three values inside one guarded validation path.
- Return `fail(400, { error: 'Invalid form payload.' })` for any malformed payload.
- Add server action tests for invalid `metadata`, invalid `rights`, and malformed `pages`.

#### 2. Server actions rely on UI/backend enforcement for edit and submit capabilities

Evidence:

- The page hides save controls unless `payload.capabilities.canEditMetadata || payload.capabilities.canCurateText`.
- The page hides submit unless `payload.capabilities.canSubmitReview`.
- `saveDraft` and `submitCuration` server actions do not load or verify the current edit payload/capabilities before calling service methods.
- This may be acceptable if the backend always enforces permissions, but the route itself does not enforce the same policy as the UI.

Risk:

- Any authenticated user can manually POST to the route actions. If backend enforcement changes or is incomplete, the UI-level capability checks are bypassable.
- Even with backend enforcement, route-level error behavior becomes less explicit and harder to test.

Suggested fix:

- Decide whether capability enforcement should happen only in the backend or also in SvelteKit actions.
- If route-level enforcement is desired, load the edit payload or a lightweight permission endpoint before save/submit and return `fail(403, ...)` when the operation is not allowed.
- Add tests proving save/submit are rejected when capabilities are false.

### Medium Severity

#### 3. Draft save can partially succeed across metadata and document curation

Evidence:

- `saveDraft` calls `objectEditService.saveObjectMetadata` first.
- If document pages are present, it then calls `objectEditService.saveDocumentCuration`.
- If metadata succeeds and curation fails, the action returns failure even though metadata has already been persisted.

Risk:

- The UI can report save failure while some changes were actually saved.
- Users may retry without understanding which part persisted.
- This is not necessarily wrong, but it needs explicit product behavior and messaging.

Suggested fix:

- Prefer a backend transaction or combined draft-save endpoint if available.
- If separate calls remain, return more specific partial failure messaging, e.g. “Metadata saved, but document curation failed.”
- Add tests for curation failure after metadata success.

#### 4. Lock release is best-effort but untested and invisible

Evidence:

- The page calls `fetch(releaseLockUrl, { method: 'DELETE' })` in `beforeNavigate` and `beforeunload` without inspecting the result.
- `src/routes/objects/[objectId]/edit-lock/+server.ts` intentionally returns `{ released: false }` for non-auth API failures.
- There are no tests for the edit-lock route.

Risk:

- Best-effort release is reasonable for unload/navigation, but failures are currently unobservable in tests and logs.
- A regression in the lock release route could leave locks stuck without obvious test failure.

Suggested fix:

- Add tests for edit-lock DELETE behavior:
  - missing auth returns 401
  - successful release returns `{ released: true }`
  - unauthorized backend response returns 401
  - generic backend failure returns `{ released: false }`
- Consider logging backend release failures server-side if logging infrastructure exists.

#### 5. Submit action does not guard against unsaved draft state on the server

Evidence:

- The submit button is disabled when `isDirty` is true.
- `submitCuration` server action accepts only `reviewNote`; it does not receive or validate the current draft snapshot.
- A manual POST can submit even if the browser currently has unsaved local edits.

Risk:

- UI behavior prevents normal users from submitting dirty local state, but direct form/action posts can bypass this.
- Depending on backend behavior, users may submit an older draft than the one visible in their browser.

Suggested fix:

- If this matters for workflow integrity, include a draft revision or `updatedAt` token in the submit form and have the backend or route reject stale submissions.
- Alternatively, document that dirty-state submit prevention is UI-only and backend submission always uses the latest saved draft.

### Low Severity

#### 6. Client-side date fields are free text and not validated before save

Evidence:

- Publication date is a text input controlled by `datePrecision`.
- `buildMetadata` sends `publicationDate` directly.
- Server action currently lacks schema validation, so invalid values are passed through to the service.

Risk:

- Users can submit date strings that do not match the selected precision.
- Backend may reject them, but the UI does not provide immediate feedback.

Suggested fix:

- Add server schema validation first.
- Optionally add client-side validation based on precision: `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`.

#### 7. Object edit service and mapper have no dedicated tests

Evidence:

- Search found no `apiObjectEditService.spec.ts`, `objectEditMapper.spec.ts`, or route action specs for object edit.
- The service maps several backend DTOs and translates 423 API errors into `ObjectEditLockedError`.

Risk:

- Contract drift in edit payloads, lock errors, submit responses, or document page mapping may not be caught until runtime.

Suggested fix:

- Add focused tests for:
  - `mapObjectEditPayload`, especially nullable `curated_text` mapping to empty string.
  - `apiObjectEditService.saveObjectMetadata` request body mapping.
  - `apiObjectEditService` 423-to-`ObjectEditLockedError` behavior.

## Testing Gaps

Missing coverage:

- `src/routes/objects/[objectId]/edit/+page.server.ts` load behavior.
- `saveDraft` valid and invalid payloads.
- `saveDraft` locked object behavior.
- `saveDraft` metadata success followed by curation failure.
- `submitCuration` success, locked behavior, and API error mapping.
- `src/routes/objects/[objectId]/edit-lock/+server.ts` DELETE behavior.
- `apiObjectEditService` request body mapping and lock error conversion.
- `objectEditMapper` response mapping.

## Recommended Fix Plan

1. Add Zod validation to `saveDraft` form payload parsing.
   - Include `metadata`, `rights`, and optional `pages` validation.
   - Return controlled 400 failures for malformed payloads.
   - Add route action tests.

2. Add object edit route tests.
   - Cover load auth, successful load, 403/404/502 mapping.
   - Cover save and submit success/error paths.

3. Add edit-lock route tests.
   - Cover auth, success, unauthorized backend, and generic release failure.

4. Decide route-level capability enforcement.
   - If approved, enforce capability checks in actions and test them.
   - If deferred, document that backend is the source of permission enforcement.

5. Add service/mapper tests for object edit.
   - Request mapping for metadata/rights/document curation/submit.
   - Response mapping for payload and submit result.
   - 423 lock translation.

6. Consider improving partial save messaging.
   - Especially when metadata save succeeds but document curation save fails.

7. Add client-side date validation only after server validation is in place.

## Open Questions

- Should the SvelteKit action enforce `canEditMetadata`, `canCurateText`, and `canSubmitReview`, or is the backend the only authorization boundary?
- Does the backend expose a draft revision or `updatedAt` token that can be used to reject stale submit actions?
- Should metadata and document curation be saved through one transactional backend endpoint?
- Should lock release failures be logged server-side, or is silent best-effort behavior intentional?
