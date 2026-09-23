# New Ingestion Creation Reliability Plan

Status: reviewed implementation plan  
Scope: `/ingestion/new` creation, duplicate-submit prevention, and setup navigation diagnosis  
Repositories: `osimi-archive-ui` and `osimi-backend`

## 1. Problem Statement

Submitting the New Ingestion form can create an ingestion without advancing the user to the setup screen. Repeated clicks on Continue can then create additional ingestions.

The observed behavior contains two related but distinct problems:

1. The UI does not send an idempotency key when it calls `POST /api/ingestions`, so every request that reaches the backend is treated as a new create operation.
2. A successful backend create is not always followed by visible navigation to `/ingestion/{id}/setup`. The failing boundary has not yet been established.

The duplicate protection must be implemented even if the navigation failure is separately corrected. Client-side button disabling alone cannot protect against concurrent requests, retries after an uncertain response, or non-browser callers.

## 2. Verified Current Behavior

### UI submission path

1. `src/routes/ingestion/new/+page.svelte` submits an enhanced SvelteKit form.
2. `src/routes/ingestion/new/+page.server.ts` validates the form and calls `ingestionNewService.createDraft`.
3. `src/lib/services/apiIngestionNewService.ts` sends `POST /api/ingestions`.
4. On success, the page action throws a `303` redirect to `/ingestion/{batchId}/setup`.

The installed SvelteKit `enhance` implementation applies redirect results when the custom result callback calls `update()`. The current page does call `update()`, so replacing it with an explicit `goto()` is not justified without first reproducing a redirect-application failure.

### Backend idempotency support

The backend already supports optional request idempotency for ingestion creation:

- Header: `x-idempotency-key`
- Valid format: `^[A-Za-z0-9:_-]{8,128}$`
- Scope: tenant, actor, and endpoint
- Matching retry: replays the original successful status and response body
- Different payload with the same key: returns `409 CONFLICT`
- Retention: seven days
- Failed mutation: does not remain as a completed replay

Relevant backend files:

- `osimi-backend/src/http/idempotency.ts`
- `osimi-backend/src/http/context.ts`
- `osimi-backend/src/routes/ingestions.ts`
- `osimi-backend/src/services/ingestion-idempotency-service.ts`
- `osimi-backend/src/repos/ingestion-idempotency-repo.ts`
- `osimi-backend/src/db/migrations/0010_ingestion_request_idempotency.sql`

Existing backend integration tests already cover completed replay, concurrent matching requests, mismatched key reuse, and retry after a failed mutation. No backend idempotency redesign or migration is required for this fix.

### Create response contract

The backend create endpoint returns a canonical `ingestion.id`. The UI currently validates create responses with the shared, permissive `ingestionDtoSchema`, which also accepts `ingestion_id`, `batch_id`, and `batch_label`. The create mapper may consequently use a human-readable batch label as a route identifier.

The shared aliases may still be needed by list and detail integrations. They must not be removed globally as part of this fix. Creation needs a dedicated response contract requiring `ingestion.id`.

## 3. Delivery Decisions

### 3.1 One page-scoped key per create attempt

The first delivery will generate one UUID when the New Ingestion page is loaded and reuse it for every submission from that rendered attempt.

Expected lifecycle:

- Rapid clicks and repeated submissions from the same rendered form use the same key.
- An enhanced action failure retains the same page data and key.
- A separately loaded New Ingestion page receives a different key.
- Separate tabs opened independently receive different keys.
- A duplicated tab may share the rendered key. Identical payloads replay one result; different payloads correctly conflict.
- A full reload or fresh visit starts a new attempt and receives a new key.

The final limitation is deliberate for the urgent fix: a page-scoped key does not protect an ambiguous successful create followed by a full browser reload. If reload-safe recovery becomes a requirement, the follow-up design should put an opaque attempt ID in tab/history state, preferably an `attempt` query parameter. A server action-generated key is not acceptable because it would change on every submission.

### 3.2 Stable request payload per attempt

The backend fingerprints the request body. The same idempotency key must therefore always produce the same backend payload.

The current unnamed-batch fallback uses the action execution time. A retry after the minute changes can produce a different `batch_label` and return `409` instead of replaying the original result.

The page load will generate both:

- `idempotencyKey`
- `attemptCreatedAt`

Both values will be submitted as hidden form fields and retained together after action failures. When the user-entered name is blank, the action will derive the localized fallback label from the submitted locale and the stable `attemptCreatedAt` value instead of the action execution time.

The attempt timestamp is not a security boundary because it only contributes to the user-controlled batch label. It must still be validated as a finite RFC3339 timestamp before use.

### 3.3 Backend idempotency remains authoritative

The browser submission guard improves responsiveness and avoids unnecessary traffic. It is not the correctness boundary. The backend key must protect the create operation if multiple requests still arrive.

### 3.4 Do not rotate keys after ambiguous failures

Network failures, invalid create responses, and temporary upstream failures may occur after the backend has committed the ingestion. Retrying those failures must use the same key so the backend can replay the original result.

The UI must not silently generate a new key after an error. A key should change only when the user starts a fresh New Ingestion attempt.

### 3.5 Bind the key to the first submitted payload

Once a request may have reached the backend, its key is bound to that exact payload. Editing the name, locale, classification, item kind, tags, notes, or another request field and resubmitting the same key will correctly produce `409 CONFLICT`.

The failure UI must therefore distinguish two user intentions:

- **Retry this creation:** preserve the form values and reuse the same key.
- **Start a different creation:** follow a full-document navigation to `/ingestion/new`, which receives a new key.

Do not add a client-only button that silently rotates the hidden key in place. Render the fresh-attempt link with `data-sveltekit-reload` so a same-route click cannot reuse the current page data. A fresh page load makes the boundary explicit and resets all attempt-scoped values together. Validation failures that occur before `createDraft` is called may continue to allow editing because no backend create request was made.

## 4. Implementation Plan

### 4.1 Confirm the failing navigation boundary

Before changing navigation code, reproduce one submission and capture these stages separately:

1. The browser request to the SvelteKit action at `POST /ingestion/new`.
2. The nested UI-server request to backend `POST /api/ingestions`.
3. Backend status, request ID, and whether the response contains canonical `ingestion.id`.
4. The SvelteKit action result type: `redirect`, `failure`, or `error`.
5. Whether the browser requests `/ingestion/{id}/setup`.
6. Whether the setup loader renders successfully, throws, or redirects elsewhere.

Do not log authorization headers, session cookies, notes, or full ingestion metadata.

Classify the result as one of the following:

- Backend creation succeeds, but response validation, ID extraction, cookie writing, or action handling fails before redirect.
- The action produces a redirect result, but the enhanced form does not apply it.
- The browser reaches the setup route, but `src/routes/ingestion/[batchId]/setup/+page.server.ts` fails or redirects.

Navigation code should be changed only after this evidence identifies the failing boundary.

### 4.2 Add page load data

File: `src/routes/ingestion/new/+page.server.ts`

Add a `PageServerLoad` alongside the existing actions. It should return:

```ts
{
  idempotencyKey: crypto.randomUUID(),
  attemptCreatedAt: new Date().toISOString()
}
```

The locale store is browser-local and is not available to `PageServerLoad`. The loader should therefore return the stable timestamp, not a localized label. The action can use the existing submitted `locale` field to translate the fallback while using `attemptCreatedAt` for its stable stamp.

The generated UUID satisfies the backend key format. The action must still validate submitted values because hidden fields are user-controlled input.

### 4.3 Submit and preserve attempt data

File: `src/routes/ingestion/new/+page.svelte`

Accept both page and action data:

```ts
let { data, form } = $props<{
  data: PageData;
  form: ActionData;
}>();
```

Render hidden fields for the attempt key and timestamp. For progressive enhancement, use values returned in action failure data when present, otherwise use page-load data. This prevents a non-enhanced failed POST from accidentally rendering a new attempt key while preserving the submitted form attempt.

Conceptually:

```ts
const idempotencyKey = $derived(form?.idempotencyKey ?? data.idempotencyKey);
const attemptCreatedAt = $derived(
  form?.attemptCreatedAt ?? data.attemptCreatedAt
);
```

Every `fail(...)` result after both attempt fields validate should include those validated attempt values. A small local failure helper may be used to avoid omitting them from one validation branch.

Invalid attempt values must not be echoed into action data. Otherwise they would continue to override valid page-load values and make every retry fail. An invalid-attempt response should omit them so the component falls back to `data.idempotencyKey` and `data.attemptCreatedAt`.

Do not return the attempt values from authentication redirects.

### 4.4 Validate attempt data in the action

File: `src/routes/ingestion/new/+page.server.ts`

After authentication and form parsing:

1. Require `idempotencyKey` to be a valid UUID.
2. Require `attemptCreatedAt` to be a valid finite RFC3339 timestamp.
3. Return `fail(400, ...)` without calling `createDraft` when either value is invalid.
4. Use the typed name when non-empty; otherwise derive the fallback label from the submitted locale and stable attempt timestamp.
5. Include the attempt values in subsequent validation and upstream failure results.

Use a UUID-specific validation rule rather than accepting the backend's entire key grammar. The UI owns generated keys and only generates UUIDs.

### 4.5 Forward the key through the service boundary

File: `src/lib/services/ingestionNew.ts`

Extend `IngestionNewRequestContext`:

```ts
export type IngestionNewRequestContext = {
  fetchFn: typeof fetch;
  token: string;
  idempotencyKey: string;
};
```

File: `src/routes/ingestion/new/+page.server.ts`

Pass the validated key in `createDraft.context`.

File: `src/lib/services/apiIngestionNewService.ts`

Use the existing `backendRequest.headers` option:

```ts
headers: {
  'x-idempotency-key': context.idempotencyKey
}
```

The key must remain transport metadata and must not be added to the JSON request body.

### 4.6 Add a synchronous submission guard

File: `src/routes/ingestion/new/+page.svelte`

Update the `enhance` callback so duplicate submit events are synchronously cancelled:

```ts
use:enhance={({ cancel }) => {
  if (submitting) {
    cancel();
    return;
  }

  submitting = true;

  return async ({ update }) => {
    try {
      await update();
    } finally {
      submitting = false;
    }
  };
}}
```

Requirements:

- `cancel()` must be called in the submit callback before a duplicate request is dispatched.
- The disabled Continue button remains visible feedback but is not relied on for correctness.
- `update()` remains responsible for applying SvelteKit failure and redirect results.
- `finally` prevents an exception from leaving the form permanently disabled.
- Remove the two existing `console.log` calls from the component.

If reproduction proves that redirect results reach this callback but `update()` does not navigate, first verify native form POST/303 behavior. Prefer falling back to native form behavior over introducing an unverified manual `goto()` path.

### 4.7 Require the canonical create response ID

File: `src/lib/api/schemas/ingestions.ts`

Change only `createIngestionResponseSchema` so it requires a non-empty `ingestion.id`. Keep `ingestionDtoSchema` unchanged for list/detail compatibility.

The create schema may accept the additional ingestion fields returned by the backend, but aliases alone must not satisfy the create contract.

File: `src/lib/services/apiIngestionNewService.ts`

Read the canonical ID directly:

```ts
const batchId = response.ingestion.id;
```

Do not call `mapCreatedIngestionBatchId` from the create service. The general mapper can remain unchanged for consumers that still need alias compatibility.

This ensures a backend/API deployment mismatch fails explicitly instead of constructing a setup route from `batch_label`.

### 4.8 Preserve conflict status accurately

File: `src/lib/server/apiClient.ts`

Add a generic `CONFLICT` member to `ApiClientErrorCode`. Map ordinary backend code `CONFLICT` or HTTP status `409` to it after checking the existing specific conflict codes.

File: `src/routes/ingestion/new/+page.server.ts`

Map API failures as follows:

- `BAD_REQUEST` to action status `400`
- `CONFLICT` to action status `409`
- Network errors, malformed responses, and unexpected upstream failures to `502`

Do not automatically rotate the key on `409`. The backend uses conflicts for both a still-processing key and a key reused with different payload. Retrying a still-processing request must retain the key, while a payload mismatch requires the user to begin a fresh attempt.

The conflict state should provide a clear `data-sveltekit-reload` fresh-attempt link to `/ingestion/new`. It should not mutate the current hidden key. If the backend message does not distinguish still-processing from payload mismatch, retain the current values for Retry and also offer the explicit fresh-attempt path.

## 5. Test Plan

### 5.1 Create response schema tests

File: `src/lib/api/schemas/ingestions.spec.ts`

Add create-specific assertions:

- Accept a response containing non-empty `ingestion.id`.
- Reject responses containing only `ingestion_id`.
- Reject responses containing only `batch_id`.
- Reject responses containing only `batch_label`.
- Leave existing shared `ingestionDtoSchema` alias tests unchanged.

### 5.2 API service tests

File: `src/lib/services/apiIngestionNewService.spec.ts`

Verify:

- `createDraft` forwards the exact `x-idempotency-key` value.
- The idempotency key is not included in the JSON body.
- The service returns canonical `ingestion.id`.
- Missing or alias-only IDs fail create-response validation.
- Existing create payload mapping remains unchanged.

### 5.3 API client tests

File: `src/lib/server/apiClient.spec.ts`

Verify:

- Generic backend `409` maps to `CONFLICT`.
- Existing specific conflict codes continue to take precedence.
- Caller-provided headers coexist with the authorization and content-type headers.

### 5.4 Page server tests

File: `src/routes/ingestion/new/page.server.spec.ts`

Verify:

- The loader returns a valid UUID and RFC3339 attempt timestamp.
- Separate loader calls produce different UUIDs.
- Missing or invalid attempt data fails before `createDraft` is called.
- Invalid attempt values are not echoed back in action data.
- A blank typed name uses the submitted attempt timestamp when constructing the localized fallback label.
- Repeated actions with the same attempt values construct identical create payloads, including across a clock-minute boundary.
- The exact key reaches `createDraft.context.idempotencyKey`.
- Validation and upstream failures return the same attempt values.
- A successful create sets the item-kind cookie and redirects to `/ingestion/{id}/setup`.
- A backend conflict remains action status `409`.
- Unauthorized behavior still clears the session and redirects to login.

### 5.5 Component browser tests

File: `src/routes/ingestion/new/page.svelte.spec.ts`

The current `$app/forms` mock is a no-op and cannot verify submission behavior. Replace or augment it using the fuller enhancement mock pattern in `src/routes/objects/[objectId]/edit/page.svelte.spec.ts`.

Verify:

- Hidden fields contain the current attempt key and timestamp.
- The first submission immediately enters the creating state.
- A second synchronous submission calls `cancel()` and does not dispatch another request.
- Button and Enter-key submissions use the same attempt values.
- A failure result calls `update()` and re-enables Continue.
- A rejected `update()` still re-enables Continue through `finally`.
- A redirect result is passed to the standard `update()` path.
- Failure action data takes precedence over newly loaded attempt data for progressive enhancement.
- A conflict preserves the current attempt and renders a `data-sveltekit-reload` link that starts a fresh attempt.
- Existing localization and capability-selection tests continue to pass.

### 5.6 Backend regression tests

Run the existing focused integration tests in `osimi-backend/tests/integration/http/ingestion-routes.test.ts` covering:

- completed create replay;
- concurrent create serialization;
- mismatched key conflict;
- retry after failed mutation.

Do not duplicate these tests in the UI repository. Add backend coverage only if reproduction reveals a backend defect.

### 5.7 Integrated smoke verification

The repository does not currently have a dedicated Playwright E2E project with web-server and authentication fixtures. Do not expand this urgent fix into a new E2E framework.

The existing authenticated smoke harness uses a static fixture create route. It does not currently delay creation, record idempotency keys, or count logical creations. Extend it only if the fixture can gain small, isolated request instrumentation. With that instrumentation, the smoke should:

1. Visit `/ingestion/new`.
2. Submit a uniquely named batch.
3. Trigger repeated Continue interactions while the first request is pending.
4. Confirm all observed backend create requests use the same key.
5. Have the fixture replay one logical create result for that key and assert its logical create count is one.
6. Confirm the final URL is `/ingestion/{returned-id}/setup`.
7. Confirm a setup-page sentinel renders.
8. Fail on browser console errors or a SvelteKit error page.

If adding delay, header capture, replay, and counting would materially expand the fixture, limit the automated smoke to submission and navigation and verify logical deduplication manually against the real backend for the urgent release. Record a separate task for integrated browser-test infrastructure.

## 6. Verification Commands

From `osimi-archive-ui`:

```bash
npx vitest run --project=server src/lib/api/schemas/ingestions.spec.ts
npx vitest run --project=server src/lib/services/apiIngestionNewService.spec.ts
npx vitest run --project=server src/lib/server/apiClient.spec.ts
npx vitest run --project=server src/routes/ingestion/new/page.server.spec.ts
npx vitest run --project=client src/routes/ingestion/new/page.svelte.spec.ts
npm run check
npm run lint
npm run test
npm run build
```

From `osimi-backend`, with a disposable test database configured:

```bash
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/osimi_test \
bun test tests/integration/http/ingestion-routes.test.ts \
--test-name-pattern "completed ingestion create|concurrent ingestion create|failed ingestion mutation"
```

## 7. Acceptance Criteria

The change is complete when all of the following are true:

1. Repeated Continue submissions from one rendered attempt create one ingestion.
2. Every request from that attempt sends the same valid `x-idempotency-key`.
3. Independently loaded New Ingestion pages receive different keys.
4. A retry with the same key and payload returns the original ingestion ID.
5. Failed actions preserve the key and stable attempt timestamp.
6. Blank-name retries do not change the backend request fingerprint.
7. Create responses without canonical `ingestion.id` are rejected and never produce a setup URL.
8. Successful creation navigates to `/ingestion/{id}/setup` and renders the setup page.
9. Backend conflicts are not misreported as `502` gateway failures.
10. Existing authentication, item-kind cookie, localization, classification, item-kind, and pipeline validation behavior remains intact.
11. Focused tests, type checking, linting, the full UI test suite, and the production build pass.

## 8. Non-Goals

The urgent fix does not include:

- Reimplementing backend idempotency.
- Adding a new database migration.
- Removing legacy identifier aliases from shared list/detail ingestion schemas.
- Automatically creating a new key after an ambiguous failure.
- Building a new end-to-end testing framework.
- Guaranteeing deduplication after a full browser reload.
- Replacing SvelteKit redirect handling without evidence that `update()` is the failing boundary.

## 9. Follow-Up Option: Reload-Safe Attempts

If product requirements expand to cover full reload after an uncertain create result, introduce a stable attempt URL such as:

```text
/ingestion/new?attempt=<uuid>
```

The loader should create the parameter when absent, validate and reuse it when present, and bind the fallback timestamp to the same attempt. This gives reload-safe retries and independent keys for separately opened clean New Ingestion links. It also means copied or duplicated attempt URLs intentionally share one create intent.

This follow-up should be implemented only with explicit URL/history behavior tests and a decision about stale attempt expiration. It is not required to stop the currently reported spam-click duplication.
