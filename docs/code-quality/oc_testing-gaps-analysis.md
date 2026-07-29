# Testing Gaps Analysis

Scope inspected:

- existing `src/**/*.{spec,test}.{ts,js}` files
- browser component tests under `src/**/*.svelte.spec.ts`
- high-risk server loads/actions and proxy routes touched or discussed in previous segments
- API service, mapper, and schema coverage
- current test execution health for a suspected stale test file

## Bug / Risk Findings

### High: Existing `/ingestion` page-server tests are stale and currently fail

Evidence:

- `src/routes/ingestion/+page.server.ts:7` destructures `url` and reads `url.searchParams` at lines 13-14.
- `src/routes/ingestion/page.server.spec.ts:49-53` and `67-72` call `load` without `url`.
- Targeted verification failed:
  - Command: `npx vitest run --project=server src/routes/ingestion/page.server.spec.ts`
  - Result: 1 file failed, 2 tests failed.
  - Failure: `TypeError: Cannot read properties of undefined (reading 'searchParams')`.
- The authenticated-success expectation is also stale: the implementation returns `{ summary, activePage, draftPage }`, but the test expects only `{ summary }`.

Risk:

- Full server test runs are currently not green if this file is included.
- This reduces confidence in later changes because an already-broken test masks new failures.

Suggested direction:

- Update the helper/event shape in `src/routes/ingestion/page.server.spec.ts` to include a URL.
- Assert default and query-derived `activePage`/`draftPage` values.

### High: Login action has no direct action tests despite CSRF, credential validation, cookie, and backend-error branches

Evidence:

- `src/routes/login/+page.server.ts` validates request origin, trims credentials, preserves username on failures, calls `loginWithBackend`, sets session cookie, maps API errors, and redirects on success.
- Search found only hook-level login public-route tests in `src/hooks.server.spec.ts`; no `src/routes/login/page.server.spec.ts` exists.

Risk:

- CSRF rejection, blank-credential handling, tenant ID normalization, backend error status mapping, session-cookie write, and success redirect can regress without narrow coverage.
- This is an auth boundary and should be covered similarly to `src/routes/auth/logout/server.spec.ts`.

Suggested direction:

- Add `src/routes/login/page.server.spec.ts` with mocked `loginWithBackend` and `setSessionCookie`.
- Cover invalid origin, missing credentials, successful login, API 400/401 mapping, and non-API error fallback.

### Medium: Ingestion file preview proxy has no route tests

Evidence:

- `src/routes/ingestion/[batchId]/files/[fileId]/preview/+server.ts` proxies authenticated backend preview bytes.
- Search found no preview-route test file.
- The route has branches for missing auth, backend fetch rejection, backend non-OK propagation, body forwarding, content-type forwarding, and private caching.

Risk:

- Proxy behavior can regress quietly, especially auth status, backend status propagation, and cache/content-type headers.
- This is less security-sensitive than artifact view/download because it is authenticated, but it still serves backend bytes directly.

Suggested direction:

- Add `src/routes/ingestion/[batchId]/files/[fileId]/preview/server.spec.ts` covering auth missing, fetch rejection `502`, backend status propagation, encoded backend URL, content-type, and cache header.

### Medium: Several API service implementations have no direct service tests

Evidence:

- Existing service tests cover `apiIngestionDetailService`, `apiIngestionSetupService`, `apiObjectEditService`, and `apiObjectsService`.
- No direct tests were found for:
  - `src/lib/services/apiIngestionNewService.ts`
  - `src/lib/services/apiIngestionCapabilitiesService.ts`
  - `src/lib/services/apiDashboardService.ts`
  - `src/lib/services/apiArchiveRequestsService.ts`
- These services build backend paths or normalize backend DTOs before returning domain data.

Risk:

- Backend path/query mapping can drift without detection.
- Capability normalization is particularly important because it normalizes media kinds, extensions, MIME types, aliases, and fallbacks.
- `apiIngestionNewService` throws a custom invalid-response error when the created ingestion lacks an identifier; this branch is currently not directly pinned at service level.

Suggested direction:

- Add narrow service tests in priority order:
  1. `apiIngestionCapabilitiesService.spec.ts` for normalization/fallbacks.
  2. `apiIngestionNewService.spec.ts` for request mapping and missing identifier error.
  3. `apiArchiveRequestsService.spec.ts` for query path mapping.
  4. `apiDashboardService.spec.ts` for summary/activity path behavior if not already sufficiently covered by mapper tests.

### Medium: Objects list page-server load behavior is mostly untested

Evidence:

- `src/routes/objects/+page.server.ts` includes auth enforcement, unauthorized redirect with cookie clearing, parallel recent/list service calls, API error-to-502 mapping, and `session` return.
- `src/routes/objects/page.server.spec.ts` currently tests only `_parseObjectsFilters`.

Risk:

- The route can regress around auth/session behavior or service call wiring while filter parser tests still pass.
- This route is a production read path and now has role-dependent UI controls in the page layer.

Suggested direction:

- Expand `src/routes/objects/page.server.spec.ts` to cover missing auth, successful load service calls, unauthorized backend redirect/clear cookie, and API error message with request ID.

### Medium: Dashboard root page-server load has no direct tests

Evidence:

- `src/routes/+page.server.ts` enforces auth, calls `dashboardService.getSummary`, clears session cookie on unauthorized backend responses, and maps API failures to `502`.
- No `src/routes/page.server.spec.ts` exists.

Risk:

- Dashboard auth/session behavior can regress without a narrow server test.
- The route is the authenticated landing page, so broken auth handling affects the first post-login user experience.

Suggested direction:

- Add `src/routes/page.server.spec.ts` covering missing auth, successful summary load, unauthorized backend redirect/cookie clearing, and request-ID error message.

## Refactor / Cleanup Findings

### Low: `src/demo.spec.ts` is placeholder coverage

Evidence:

- `src/demo.spec.ts` only asserts `1 + 2 === 3`.

Cleanup opportunity:

- Remove it once the real test suite is comfortably green, or replace it with a minimal real smoke test if a placeholder is still desired.

### Low: Browser component coverage is still sparse

Evidence:

- Browser component tests currently found:
  - `src/routes/page.svelte.spec.ts`
  - `src/lib/components/Stepper.svelte.spec.ts`
  - `src/lib/components/ThinProgress.svelte.spec.ts`
- Other reusable interactive components such as `ChoiceCard`, `Segmented`, `ObjectThumbnail`, and route-level Svelte pages remain mostly untested in browser mode.

Cleanup opportunity:

- Do not broaden browser coverage indiscriminately.
- Add browser tests when a reusable component has real state/interaction/accessibility behavior or when a route-level UI bug is found.

### Low: Mutation-auth helper has only indirect tests

Evidence:

- `src/lib/server/routeGuards.ts` is exercised indirectly by many route tests.
- No direct `routeGuards.spec.ts` exists for `requireMutationAuth`, `isAuthFailureResponse`, or `mapApiErrorStatus`.

Cleanup opportunity:

- Direct tests are optional because route-level coverage is strong.
- If future routes adopt the helper, a small helper-level spec could make error/status policy easier to maintain.

## Verification Performed

- Inventoried all test files with glob search.
- Compared high-risk routes/services against existing nearby test files.
- Read representative route, service, and test implementations.
- Ran targeted stale-test verification:
  - `npx vitest run --project=server src/routes/ingestion/page.server.spec.ts`
  - Confirmed 2 failing tests from missing `url` in the test event.

No implementation changes were made in this pass beyond this analysis document.

## Proposed Remediation Plan

1. Fix stale `/ingestion` page-server tests first so the current suite baseline is not broken.
2. Add login action tests for auth/CSRF/session-cookie behavior.
3. Add ingestion preview proxy route tests.
4. Expand objects list page-server load tests beyond filter parsing.
5. Add dashboard root page-server tests.
6. Add narrow service tests for capabilities and ingestion-new request/response mapping.
7. Remove or replace `src/demo.spec.ts` after the real test additions are in place.
8. Run the targeted new/changed tests, then `npm run test`, `npm run check`, `npm run lint`, and `git diff --check`.
