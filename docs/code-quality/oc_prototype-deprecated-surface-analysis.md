# Prototype / Deprecated Surface Analysis

> Historical analysis: the routed prototype, ingestion prototype, gallery routes, mock object-view data, and prototype-only component stacks described below were removed from production source. See `docs/prototype-production-boundary.md` for current policy.

Scope inspected:

- `src/routes/prototype/**`
- `src/routes/ingestion-proto/+page.svelte`
- `new-proto` paths by filename search
- mock object/edit data and prototype-only object/view/edit components under `src/lib/**`
- tests that currently mention prototype route policy

## Bug / Risk Findings

### High: Prototype routes are unauthenticated production routes

Evidence:

- `src/hooks.server.ts:7-10` explicitly treats `/prototype/**` and `/ingestion-proto/**` as public paths.
- `src/hooks.server.spec.ts:6-12` verifies those routes are public.
- `src/routes/prototype/**` includes multiple navigable object view/edit prototypes backed by mock data.
- `src/routes/ingestion-proto/+page.svelte` is a complete 713-line visual workflow prototype.

Risk:

- The prototype pages are available to unauthenticated users in the same SvelteKit app as production routes. They do not appear to call backend APIs, but they are still a shipped, indexable, unauthenticated product surface unless deployment routing blocks them elsewhere.
- This is a product/security decision, not just cleanup. If public prototypes are intentional, they should be explicitly isolated or documented as intentional preview/demo routes.

Suggested direction:

- Decide whether these routes should be kept public, require auth, be development-only, or be removed.
- If retained for internal reference, prefer a single guarded preview area rather than broad public route exceptions.

### Medium: Prototype-only code is mixed into shared production library directories

Evidence:

- `src/lib/objectView/mockObjects.ts` and `src/lib/objectView/mockEditData.ts` are used by prototype routes.
- Several prototype-oriented components live under shared component directories:
  - `src/lib/components/object-view/*` is used by `src/routes/prototype/objects/**`.
  - `src/lib/components/object-view-alt/*` is mostly used by `src/routes/prototype/alternative/**`.
  - `src/lib/components/object-edit/ObjectEditLayout.svelte`, `ObjectEditPanel.svelte`, and `ObjectEditSourceText.svelte` depend on `$lib/objectView/mockEditData` and are used by `src/routes/prototype/glm/**`.
- Production `src/lib/components/object-detail/ObjectViewerCanvas.svelte:2` imports `AltMediaRequestBanner` from `src/lib/components/object-view-alt/AltMediaRequestBanner.svelte`, so the `object-view-alt` directory is not wholly prototype-only.
- Production `src/routes/objects/[objectId]/edit/+page.svelte` imports `SourceTextDiff`, so `src/lib/components/object-edit/SourceTextDiff.svelte` is not prototype-only.

Risk:

- Cleanup is error-prone because prototype-only and production-used files are interleaved by directory name.
- Future work could accidentally import mock-shaped types into production code, especially from `$lib/objectView/mockEditData`.
- Deleting a whole prototype-looking directory would break production because at least `AltMediaRequestBanner` and `SourceTextDiff` are production-used.

Suggested direction:

- Before deleting or moving files, classify each component as `production`, `prototype-only`, or `shared`.
- Move retained prototype-only components/data under a clearly named prototype namespace, or remove them with their routes.
- Keep `SourceTextDiff` and `AltMediaRequestBanner` out of any bulk prototype deletion.

### Medium: Prototype pages still add type-check/build/lint surface without regression tests

Evidence:

- Prototype files are normal SvelteKit routes under `src/routes`, so they participate in app compilation and type checking.
- Current test coverage only asserts public route policy for `/prototype` and `/ingestion-proto` in `src/hooks.server.spec.ts`.
- No tests were found for prototype route loading, prototype UI behavior, or mock data shape compatibility.

Risk:

- Even if not product-critical, these routes can fail `npm run check`, `npm run lint`, or production build.
- Because there are no targeted tests, prototype breakage will surface late through broad verification rather than narrow regression checks.

Suggested direction:

- If prototypes are kept, either accept them as unsupported demos and isolate them from production builds, or add minimal route/load smoke coverage for retained routes.
- If they are no longer needed, removal gives the highest maintenance-cost reduction.

### Low: `SourceTextDiff` has a user-visible empty-state rendering bug in a production-used component

Evidence:

- `src/lib/components/object-edit/SourceTextDiff.svelte:42` renders `{sourceText || '<span class="italic text-text-muted">No source text available</span>'}`.
- Svelte escapes text interpolation, so the fallback will display the literal string `<span class="italic text-text-muted">No source text available</span>` instead of styled fallback text.
- `SourceTextDiff` is used by production object edit at `src/routes/objects/[objectId]/edit/+page.svelte:383`.

Risk:

- Users can see raw markup when source text is empty.
- This is not prototype-only, but it was discovered while classifying prototype/shared object-edit components.

Suggested direction:

- Fix with an `{#if sourceText}` branch in the reusable component.

## Refactor / Cleanup Findings

### Medium: There are multiple overlapping object prototype variants

Evidence:

- `src/routes/prototype/objects/**` implements one object view/edit prototype.
- `src/routes/prototype/alternative/objects/**` implements a second object view/edit prototype.
- `src/routes/prototype/glm/objects/**` implements another editing prototype.
- All three variants rely on the same mock object records, with partially different component stacks.

Cleanup opportunity:

- Pick one retained reference prototype, archive it outside routed production code, or remove all variants if product direction has moved to production object pages.
- Removing duplicate variants will reduce maintenance and ambiguity around which prototype represents current direction.

### Low: `src/routes/prototype/+page.svelte` uses legacy Svelte reactive syntax while the app standard is Svelte 5 runes

Evidence:

- The file uses `$:` reactive declarations at `src/routes/prototype/+page.svelte:40`, `42`, `53`, `71`, `75`, `77`, `84`, `85`, `90`, `99`, and `109`.
- Repo guidance prefers Svelte 5 runes for new/current code.

Cleanup opportunity:

- If retained, convert to runes or move it out of normal production route compilation.
- If removed, no refactor is needed.

### Low: `/ingestion-proto` is too large to maintain as a normal route component

Evidence:

- `src/routes/ingestion-proto/+page.svelte` is 713 lines and contains data, state mutation helpers, drag/drop behavior, and full markup in one file.

Cleanup opportunity:

- If retained, either mark as an unsupported visual sandbox or split into local prototype-only subcomponents.
- If product no longer needs it, remove the route instead of refactoring it.

### Low: No `new-proto` route or file was found

Evidence:

- Filename search for `**/*new-proto*` returned no files.

Cleanup opportunity:

- No action needed for `new-proto` unless it exists outside the repository or under a different name.

## Verification Performed

- Enumerated prototype routes with glob search.
- Searched source references for `prototype`, `ingestion-proto`, `new-proto`, mock object data, and object-view/edit prototype components.
- Read representative route, load, component, and mock data files.
- Checked current tests for prototype route policy coverage.

No implementation changes were made in this pass beyond this analysis document.

## Proposed Remediation Plan

1. Confirm product decision for prototype routes: remove, require auth, dev-only, or keep public.
2. If removing prototypes, delete the selected route trees and only prototype-only support files after classifying shared files.
3. If retaining prototypes, move or group prototype-only data/components under an explicit prototype namespace and document route intent.
4. Keep production-used `SourceTextDiff` and `AltMediaRequestBanner` intact during any cleanup.
5. Fix the `SourceTextDiff` empty-state rendering bug because it affects production object edit.
6. Update `hooks.server.spec.ts` if prototype auth/public behavior changes.
7. Run targeted route-policy tests, then `npm run check`, `npm run lint`, and `git diff --check`.
