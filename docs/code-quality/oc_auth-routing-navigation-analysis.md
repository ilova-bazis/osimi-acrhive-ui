# Auth, Routing, and Navigation Analysis

## Scope

Reviewed server hooks, auth helpers, layout/session wiring, login/logout, route guards, public-route handling, and route mutation endpoints.

Primary files reviewed:

- `src/hooks.server.ts`
- `src/app.d.ts`
- `src/lib/server/auth.ts`
- `src/lib/server/csrf.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/types.ts`
- `src/routes/+layout.server.ts`
- `src/routes/+layout.svelte`
- `src/routes/+page.server.ts`
- `src/routes/login/+page.server.ts`
- `src/routes/login/+page.svelte`
- `src/routes/auth/logout/+server.ts`
- Protected route loads under `src/routes/ingestion/**`, `src/routes/objects/**`
- Mutation endpoints under `src/routes/ingestion/**/+server.ts`, `src/routes/objects/**/+server.ts`
- Existing route tests under `src/routes/**/*.spec.ts`

Focus areas:

- Public route policy and layout behavior.
- Session/token synchronization.
- Login/logout failure modes.
- Route-level auth behavior and unauthorized handling.
- CSRF/origin checks for cookie-authenticated mutations.
- Navigation consistency after auth state changes.

## Executive Summary

The application has a central server hook that validates the session cookie on routed requests, stores `locals.session`, redirects unauthenticated users away from protected pages, and redirects authenticated users away from `/login`. Server route loads generally repeat a local `locals.session` plus cookie-token check before calling backend services, and most backend `401` responses clear the session cookie and redirect or return `401`.

The main risks are around consistency and mutation protection. The hook and layout disagree about whether `/ingestion-proto` is public. Most JSON mutation endpoints rely only on the session cookie and do not check request origin, while login/logout already use `isTrustedOrigin`. Logout also awaits backend logout before clearing the local cookie, so a backend outage can leave the browser authenticated locally. Finally, many routes duplicate auth checks and unauthorized cleanup, making behavior drift likely.

## Bugs/Risks

### High Severity

#### 1. Cookie-authenticated JSON mutation routes lack CSRF/origin checks

Evidence:

- `src/lib/server/csrf.ts` provides `isTrustedOrigin`.
- `src/routes/login/+page.server.ts:8-13` uses `isTrustedOrigin` before login.
- `src/routes/auth/logout/+server.ts:10-13` uses `isTrustedOrigin` before logout.
- The following cookie-authenticated mutation endpoints do not use `isTrustedOrigin`:
  - `src/routes/ingestion/[batchId]/setup/+server.ts:103-231`
  - `src/routes/ingestion/[batchId]/metadata/+server.ts:59-98`
  - `src/routes/ingestion/[batchId]/retry/+server.ts:15-47`
  - `src/routes/ingestion/[batchId]/cancel/+server.ts:15-47`
  - `src/routes/ingestion/[batchId]/restore/+server.ts:15-47`
  - `src/routes/ingestion/[batchId]/+server.ts:15-47`
  - `src/routes/ingestion/[batchId]/files/[fileId]/+server.ts:15-50`
  - `src/routes/objects/[objectId]/edit-lock/+server.ts:7-31`
  - `src/routes/objects/[objectId]/resync/+server.ts:17-51`
  - `src/routes/objects/resync/+server.ts:14-56`
- These endpoints authorize by reading the `osimi_session` cookie and then performing state-changing backend operations.

Risk:

- A cross-site page can submit simple form requests to POST endpoints and the browser may include cookies depending on browser/SameSite behavior and navigation context.
- Even where JSON content-type limits some attacks, several endpoints do not require or validate content type before reading JSON or invoking actions.
- Operational mutations such as retry, cancel, restore, delete, resync, metadata updates, and edit-lock release should have the same origin protection as login/logout.

Suggested fix:

- Add a shared route helper for mutation auth, for example `requireMutationSession(event)`, that checks:
  - trusted origin using `isTrustedOrigin(request, url.origin)`
  - `locals.session`
  - auth cookie token
- Return `403` for invalid origin and `401` for missing auth.
- Apply it to all protected `POST`, `PATCH`, and `DELETE` endpoints.
- Add focused tests for at least one representative JSON endpoint and one simple action endpoint, then cover the rest mechanically.

### Medium Severity

#### 2. `/ingestion-proto` is treated as public by layout but protected by the server hook

Evidence:

- `src/routes/+layout.svelte:19-22` treats `/ingestion-proto` and descendants as public for sidebar hiding.
- `src/hooks.server.ts:4-10` public paths include `/login`, `/prototype`, and `/auth/logout`, but not `/ingestion-proto`.
- `src/routes/ingestion-proto/+page.svelte` exists and has no server load/action of its own.

Risk:

- Unauthenticated requests to `/ingestion-proto` are redirected to `/login` by the hook, despite layout treating it as a public route.
- Authenticated visits to `/ingestion-proto` hide the sidebar because layout considers it public, creating inconsistent navigation behavior.
- This is exactly the kind of prototype/public-route nuance that can become confusing during cleanup or demos.

Suggested fix:

- Decide whether `/ingestion-proto` is public or protected.
- If public, add it to `isPublicPath` in `src/hooks.server.ts`.
- If protected, remove it from `isPublicRoute` in `src/routes/+layout.svelte` so authenticated users get normal app navigation.
- Add a hook/layout test or a small exported route-policy helper test to keep the two lists synchronized.

#### 3. Logout can leave the local session cookie intact when backend logout fails

Evidence:

- `src/routes/auth/logout/+server.ts:17-21` awaits `logoutWithBackend(fetch, token)` before calling `clearSessionCookie(cookies)`.
- `src/lib/server/auth.ts:91-106` swallows only unauthorized backend logout errors and rethrows other backend/network failures.
- `src/routes/+layout.svelte:32-36` calls `/auth/logout`, ignores response status, sets the client store to null, and navigates to `/login`.

Risk:

- If backend logout fails with a network error or `5xx`, the route can return an error before deleting the local `osimi_session` cookie.
- The client still navigates to `/login`; the next server request with the still-valid cookie can redirect authenticated users back to `/`, making logout appear flaky.
- Local logout should be best-effort and should clear the local cookie even when remote invalidation fails.

Suggested fix:

- Clear the local session cookie in a `finally` block, or clear it before attempting backend logout.
- Return `{ status: 'ok' }` for local logout even if backend invalidation fails, optionally with a non-fatal warning logged server-side if logging exists.
- Add logout route tests for backend logout rejection and cookie deletion.

#### 4. Auth policy and unauthorized cleanup are duplicated across many route files

Evidence:

- Most protected route loads and endpoints manually read `AUTH_COOKIE_NAME`, check `locals.session`, and call `clearSessionCookie` on backend unauthorized errors.
- Examples include `src/routes/+page.server.ts:7-27`, `src/routes/ingestion/+page.server.ts:7-27`, `src/routes/objects/+page.server.ts:94-121`, `src/routes/ingestion/[batchId]/+page.server.ts:8-54`, and multiple `+server.ts` endpoints.
- Several endpoints return JSON `401`, while page loads redirect to `/login`; each file implements that distinction locally.

Risk:

- Future routes can easily miss cookie cleanup, return the wrong status, skip origin checks, or redirect inconsistently.
- Fixes to auth behavior need to be applied across many files.
- Repetition makes route-specific logic harder to review because boilerplate obscures the actual action.

Suggested fix:

- Add small server-only helpers with explicit variants:
  - page load helper that redirects on missing auth
  - JSON endpoint helper that returns/throws consistent `401`
  - mutation helper that also checks CSRF/origin
- Keep helpers minimal and avoid hiding route-specific authorization such as resync role checks.
- Add tests for helper behavior, then migrate high-risk endpoints first.

### Low Severity

#### 5. There are no direct tests for the server hook or public-route policy

Evidence:

- No `src/hooks.server.spec.ts` file exists.
- Existing route tests cover many route-local unauthenticated cases but not hook behavior, authenticated `/login` redirects, invalid cookie cleanup, or public route allow-list behavior.

Risk:

- Regressions in global auth behavior may only be noticed through manual navigation.
- Public/protected route list drift is easy to miss, as seen with `/ingestion-proto`.

Suggested fix:

- Export a small pure route-policy helper from `hooks.server.ts` or move it to `$lib/server/routePolicy.ts`.
- Add tests for public paths, protected paths, invalid session cookie cleanup, and authenticated login redirect.

#### 6. Login submit state is not reset after server-side validation failures

Evidence:

- `src/routes/login/+page.svelte:35` sets `isSubmitting = true` on form submit.
- `src/routes/login/+page.svelte:69-75` disables the submit button when `isSubmitting` is true.
- No `$effect` resets `isSubmitting` when the `form` prop updates after `fail(...)` from `src/routes/login/+page.server.ts`.

Risk:

- If SvelteKit enhances or preserves the component after an action failure, the submit button can remain disabled while showing an error.
- This may be masked during full-page reload submissions, but it is fragile if progressive enhancement is added later.

Suggested fix:

- Reset `isSubmitting` when `form?.error` changes, or use SvelteKit form enhancement state if the page adopts `use:enhance`.
- Add a lightweight component test if login form behavior is covered in browser tests.

## Refactor/Cleanup

### 1. Public route policy should have one source of truth

Evidence:

- `src/hooks.server.ts` has `isPublicPath`.
- `src/routes/+layout.svelte` has `isPublicRoute`.
- The lists already differ for `/ingestion-proto` and `/auth/logout`.

Cleanup candidate:

- Move public route definitions into a shared module usable by server and client, or export a serializable `isPublicAppShellPath` helper for layout while keeping server-only auth policy explicit.
- If route policies intentionally differ, rename them to reflect that distinction, for example `isAuthPublicPath` versus `hidesAppShellPath`.

### 2. Mutation endpoint error mapping is repeated

Evidence:

- `mapApiErrorStatus` appears in several route endpoints with identical logic.
- Unauthorized backend errors repeatedly clear the cookie and return JSON `401`.

Cleanup candidate:

- Extract a small `mapApiErrorStatus` and `toApiErrorJson` helper under `src/lib/server`.
- Keep route-specific messages where needed.

### 3. Logout interaction should handle non-OK responses intentionally

Evidence:

- `src/routes/+layout.svelte:32-36` ignores `/auth/logout` response status.

Cleanup candidate:

- After making server logout locally reliable, client-side ignoring becomes acceptable.
- Otherwise, handle non-OK by still clearing local store and navigating, but optionally surface a non-blocking message if the app has global notifications.

## Testing Gaps

Missing or thin coverage:

- `hooks.server.ts` public/protected path behavior.
- Authenticated user redirected away from `/login`.
- Invalid/expired auth cookie clears `osimi_session`.
- `/ingestion-proto` expected public/protected behavior.
- Logout clears local cookie even if backend logout rejects.
- CSRF/origin rejection for protected mutation endpoints beyond login/logout.
- Shared mutation auth helper behavior if introduced.
- Login form submit state after action failure.

## Recommended Fix Plan

1. Add CSRF/origin checks to protected mutation routes.
   - Create a small helper for trusted-origin plus session/token checks.
   - Apply to JSON endpoints and edit-lock/logout-style endpoints.
   - Add representative tests for invalid origin.

2. Resolve `/ingestion-proto` route policy drift.
   - Decide public vs protected.
   - Update hook or layout accordingly.
   - Add a route-policy test.

3. Make logout locally reliable.
   - Always clear `osimi_session` even if backend logout fails.
   - Add route tests for backend failure and invalid origin.

4. Introduce minimal auth/error helper extraction.
   - Consolidate repeated `AUTH_COOKIE_NAME` reads, missing-auth behavior, unauthorized cookie cleanup, and API status mapping.
   - Migrate incrementally to avoid broad churn.

5. Add hook/policy tests.
   - Cover public routes, protected routes, authenticated `/login`, and expired cookie cleanup.

6. Reset login submit state on action errors.
   - Add a small reactive reset or adopt enhanced form state when enhancement is introduced.

## Open Questions

- Should `/ingestion-proto` be publicly accessible like `/prototype`, or should it be protected and show the normal authenticated app shell?
- Should JSON endpoints return `401` for missing auth and `403` for invalid origin consistently, or should some browser-facing endpoints redirect to `/login`?
- Is remote backend logout required to succeed before the UI considers the user logged out, or is local cookie clearing the authoritative logout behavior?
