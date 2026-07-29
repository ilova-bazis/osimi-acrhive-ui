# Object Edit Flow Analysis

## Scope

Reviewed the object edit flow, locking mechanism, form actions, dirty state tracking, and DTO boundaries.

Primary files reviewed:

- `src/routes/objects/[objectId]/edit/+page.svelte` (Main edit interface orchestrator)
- `src/routes/objects/[objectId]/edit/+page.server.ts` (Server actions for draft saving and curation submission)
- `src/routes/objects/[objectId]/edit-lock/+server.ts` (Backend lock release endpoint gateway)
- `src/lib/components/object-edit/SourceTextDiff.svelte` (Curated text difference subcomponent)
- `src/lib/services/objectEdit.ts` (Service contracts and domain models)
- `src/lib/services/apiObjectEditService.ts` (API backend service adapter)
- `src/lib/api/schemas/objectEdit.ts` (Zod verification transport schemas)
- `src/lib/api/mappers/objectEditMapper.ts` (DTO mapping layer)

Focus areas:

- Edit lock acquisition, retention, and release safety (specifically `beforeNavigate` and `beforeunload`).
- Reactive input binding, synchronization, and state reset triggers in Svelte 5.
- Curation payload structures and server-side request body validation.
- Client-side `$derived(isDirty)` tracking robustness and navigation guards.
- Current test coverage and mapping boundaries.

---

## Executive Summary

The object edit flow is structured correctly using Svelte 5 reactive runes (`$state`, `$derived`, `$effect`) to manage changes and deep state arrays cleanly. Data transport is separated via services and mappers that parse server data via Zod validation schemas at the boundary.

However, the analysis revealed a few severe security and correctness issues:
1. **Silent and incomplete edit lock release** causes stale locks on objects when users navigate away or close tabs, blocking other curators.
2. **Missing dirty-state navigation confirmation** allows curators to lose heavy transcription progress instantly if they click any button or navigation link by accident.
3. **Foreign Lock Bypass on UI:** Inputs remain fully interactive even when locked by someone else, allowing curators to type extensive metadata or OCR text only to lose all progress upon clicking "Save draft" and receiving a server error.
4. **Missing early type-safety checks:** Raw client JSON curation payloads are passed directly to API services without validation at the server boundary.

---

## Findings

### High Severity

#### 1. Silent Lock Release Failures & Stale Backend Locks

Evidence:
- Lock release triggers are registered in [+page.svelte:L170-L185](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/[objectId]/edit/+page.svelte#L170-L185):
  ```ts
  // Release lock when navigating away within the app
  beforeNavigate(() => {
      if (!data.isLockedByOtherUser) {
          fetch(releaseLockUrl, { method: 'DELETE' });
      }
  });

  // Release lock when tab/browser closes
  $effect(() => {
      if (data.isLockedByOtherUser) return;
      const handler = () => {
          fetch(releaseLockUrl, { method: 'DELETE', keepalive: true });
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
  });
  ```
- Any fetch errors or 500/401/404 server failures are silently discarded (no `.catch()` or `.then()` telemetry).
- **No `keepalive` on `beforeNavigate`:** During normal SvelteKit page transition, if the browser unloads the layout or performs redirect operations before the asynchronous fetch completes, the browser will instantly cancel the request.
- **Unreliable `beforeunload`:** Mobile devices (e.g. iOS Safari, Chrome on Android) frequently sleep or terminate background processes without executing `beforeunload` handlers.
- **Silent swallowing on Server side:** In [edit-lock/+server.ts:L24-L30](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/[objectId]/edit-lock/+server.ts#L24-L30), if the `DELETE` backend call fails, the catch block logs nothing and returns `200 OK` with `{ released: false }`.

Risk:
- Curators navigating away or closing tabs will leave stale locks active on the server.
- Other curators attempting to refine the same object will see a "Locked by other user" screen and be blocked from curating until the lock naturally expires.
- Zero server logs or alerts exist to notify developers when lock releases fail.

Suggested fix:
- Always use `keepalive: true` inside all client-side lock release `fetch` requests.
- Migrate the browser tab exit handler to use modern `visibilitychange` alongside `navigator.sendBeacon` or fetch-keepalive, which are guaranteed to execute on mobile browsers.
- Properly throw or log exceptions inside `/edit-lock/+server.ts` so telemetry captures failing lock releases.

#### 2. Complete Lack of Unsaved Changes Warning (Accidental Navigation Data Loss)

Evidence:
- `+page.svelte` correctly computes deep changes via `$derived(isDirty)` by comparing current states against `initialSnapshot` [+page.svelte:L95-L97](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/[objectId]/edit/+page.svelte#L95-L97).
- However, `beforeNavigate` in [+page.svelte:L171-L175](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/[objectId]/edit/+page.svelte#L171-L175) does **not** inspect `isDirty` or attempt to warn the user.
- There is no native `window.onbeforeunload` check to block tab closure if `isDirty` is true.

Risk:
- If a curator has modified complex metadata, added tags, or typed a long, detailed page transcription in `SourceTextDiff` and accidentally clicks "← Object", "Home", a sidebar link, or closes the tab, SvelteKit will immediately redirect them.
- The edit lock is released and **all unsaved changes are permanently lost with no warning.** This creates high curator frustration and severe data loss.

Suggested fix:
- Intercept SvelteKit navigation in `beforeNavigate` if `isDirty` is true, and trigger a confirmation dialog:
  ```ts
  beforeNavigate((navigation) => {
      if (isDirty) {
          if (!confirm('You have unsaved changes. Are you sure you want to leave and discard your changes?')) {
              navigation.cancel();
              return;
          }
      }
      // Release lock...
  });
  ```
- Add a listener for native `beforeunload` when `isDirty` is true:
  ```ts
  $effect(() => {
      const preventUnload = (e: BeforeUnloadEvent) => {
          if (isDirty) {
              e.preventDefault();
              e.returnValue = ''; // Required for modern browser prompts
          }
      };
      window.addEventListener('beforeunload', preventUnload);
      return () => window.removeEventListener('beforeunload', preventUnload);
  });
  ```

---

### Medium Severity

#### 3. Fully Interactive Form Inputs Allowed Under Foreign Locks

Evidence:
- If `data.isLockedByOtherUser` is true, a notice banner is displayed [+page.svelte:L281-L287](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/[objectId]/edit/+page.svelte#L281-L287).
- However, the form fields rendered in `@render metadataFields()` and `@render rightsFields()` do not check `isLockedByOtherUser`.
- The OCR pages and `SourceTextDiff` curate textareas are also fully interactive.
- The "Save draft" submit button is not disabled when `isLockedByOtherUser` is true.

Risk:
- A user can enter the edit screen, miss the top notice banner, and spend 10 minutes typing edits.
- Upon clicking "Save draft", SvelteKit will submit, the backend will return `423 Locked` (caught by `ObjectEditLockedError`), SvelteKit's progressive enhancement will display a "locked" error message, and the user is forced to refresh the page, deleting all of their hard work.

Suggested fix:
- Disable all inputs, textareas, buttons, and custom controls on the edit page when `data.isLockedByOtherUser` is true. Let them view the curation data but not mutate it:
  ```svelte
  <input ... disabled={data.isLockedByOtherUser} />
  ```
- Explicitly disable the "Save draft" and "Submit for review" form buttons.

#### 4. No Request Body Zod Validation at SvelteKit Boundary

Evidence:
- In SvelteKit action `saveDraft` ([+page.server.ts:L67-L77](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/[objectId]/edit/+page.server.ts#L67-L77)), the server parses the raw metadata JSON and pages JSON using standard `JSON.parse` and casts it:
  ```ts
  metadata = JSON.parse(String(formData.get('metadata') ?? 'null'));
  pages = JSON.parse(String(pagesRaw));
  ```
- No validation is performed on the internal fields. The objects are immediately passed down to `objectEditService.saveObjectMetadata(...)`.
- `apiObjectEditService.ts` similarly maps fields to a request body and sends them to the backend API without checking types or constraints.

Risk:
- A malicious agent or malformed payload can inject bad types or corrupt formats, causing SvelteKit or backend gateways to fail with unhandled exceptions.
- Violates the TypeScript and Boundary guidelines in `AGENTS.md` (*"Validate transport payloads with Zod at the API boundary instead of trusting raw JSON"*).

Suggested fix:
- Define request-body Zod validation schemas for saving metadata and page curation.
- Verify the form inputs in SvelteKit actions before executing downstream service functions.

---

### B. Refactoring & Cleanup Suggestions

#### 1. Input Whitespace Trimming Glitch

Evidence:
- Form fields are trimmed when constructing the submit object: `language.trim() || null`, `description.trim() || null` [+page.svelte:L131-L144](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/[objectId]/edit/+page.svelte#L131-L144).
- If the user types a trailing space in a description or title, the `$derived(isDirty)` evaluates as true.
- Upon save, SvelteKit submits, the server trims the space, and the database stores the trimmed string.
- SvelteKit reloads the data, triggering the `$effect` to run `resetEditState()`. This resets the reactive input binding to the server's trimmed string, instantly deleting the user's trailing space in the middle of their typing flow.

Recommendation:
- Handle whitespace stripping at input-blur events, or trim strings inside the `isDirty` calculation rather than silently modifying inputs during post-save hydration resets.

---

## Testing Gaps

Current test coverage:
- `src/routes/objects/[objectId]/page.server.spec.ts` covers the object detail route loads.
- **Zero test coverage** exists for `src/routes/objects/[objectId]/edit/` or the edit service implementations:
  - No server-action tests for `saveDraft` or `submitCuration`.
  - No contract tests for `apiObjectEditService.ts`.
  - No client-side unit/component tests for `+page.svelte` or `SourceTextDiff.svelte`.
  - No unit tests for `objectEditMapper.ts`.

Recommended testing:
- Create `src/lib/api/mappers/objectEditMapper.spec.ts` and test mapping of complex union payloads.
- Write Svelte component tests using Vitest (client-project) verifying `isDirty` correctly triggers on tagging and transcribing changes.
- Add mock service action tests in `+page.server.spec.ts` verifying `saveDraft` fails cleanly with a `423` on lock collision.

---

## Open Questions

1. Should we move the edit lock acquisition logic to an explicit handoff endpoint, or is implicit acquisition on GET edit payload safe for all scenarios?
2. If SvelteKit's `invalidateAll` resets input states on successful save, should we track local dirty state with a backup buffer to prevent cursor-jumping and trailing whitespace resets during active typing?
3. Should the "Save draft" action automatically acquire/refresh locks to prevent them from expiring while a curator is actively writing long transcriptions?
