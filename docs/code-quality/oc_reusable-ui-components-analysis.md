# Reusable UI Components Analysis

Scope inspected:

- reusable primitives in `src/lib/components/*.svelte`
- shell/layout components such as `AppHeader`, `AppSidebar`, `FootnoteBar`, `Stepper`
- component gallery under `src/routes/components/**`
- `docs/components.md`
- existing component test coverage

Excluded from primary review except where they touch shared primitives:

- domain-heavy object flows under `src/lib/components/object-detail/**`
- domain-heavy object edit/view prototype stacks under `src/lib/components/object-edit/**`, `object-view/**`, and `object-view-alt/**`
- ingestion setup internals beyond primitive usage

## Bug / Risk Findings

### Medium: `Stepper` completed-step buttons are accessible as actions even when no jump handler exists

Evidence:

- `src/lib/components/Stepper.svelte:26-27` disables only non-completed steps: `disabled={state !== 'done'}`.
- When `onJump` is omitted, completed steps remain enabled buttons but `onclick={() => state === 'done' && onJump?.(i)}` has no effect.
- `Stepper` is used without `onJump` in at least `src/routes/ingestion/new/+page.svelte:519`.

Risk:

- Keyboard and assistive-technology users encounter an enabled control that appears actionable but does nothing.
- The control also lacks an accessible label for completed checkmark-only buttons and does not mark the current step with `aria-current="step"`.

Suggested direction:

- Disable completed step buttons when `onJump` is not provided.
- Add `aria-label` for each step button and `aria-current="step"` for the active step.

### Medium: `ThinProgress` can render invalid/incorrect progress and exposes no progress semantics

Evidence:

- `src/lib/components/ThinProgress.svelte:12` computes `Math.min(100, (value / total) * 100)` but does not clamp the lower bound.
- Negative `value` can produce a negative CSS width.
- The component renders a visual progress bar without `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, or `aria-valuenow`.
- `ThinProgress` is used in `src/lib/components/AppSidebar.svelte:99` for active batch progress data.

Risk:

- If backend or service data drifts below zero, the visual width becomes invalid or misleading.
- Screen readers receive no progress information for sidebar batch state.

Suggested direction:

- Clamp progress to `0..100`.
- Add progressbar ARIA attributes with a bounded current value.

### Low: Reusable interactive primitives have no direct component tests

Evidence:

- File search for `src/lib/components/**/*.svelte.spec.ts` found no reusable component browser tests.
- Interactive primitives inspected include `ChoiceCard`, `Stepper`, `Segmented`, `IngestionFilePreview`, `BaseButton`, and `ThinProgress`.

Risk:

- Small primitive regressions can affect multiple route flows and are currently caught only through broad page tests or manual verification.
- Accessibility behavior for `Stepper`, disabled `ChoiceCard`, and progress semantics has no narrow regression coverage.

Suggested direction:

- Add focused browser tests for the primitives changed by this segment rather than broadly testing every component.

## Refactor / Cleanup Findings

### Medium: Component docs are stale and still frame current components as prototype-only

Evidence:

- `docs/components.md:1-4` is titled `UI Components (Prototype)` and says components are used on `/prototype` as reference layout.
- The same document now includes production components such as `AppHeader`, `AppSidebar`, `ObjectsFilterPanel`, `ObjectsTable`, `ObjectThumbnail`, and ingestion setup components.
- `docs/components.md:559` says `AppSidebar` nav uses `base` from `$app/paths`, but `src/lib/components/AppSidebar.svelte:2` imports `resolve` and links use `resolve(item.href)` at line 67.
- `docs/components.md:122` documents `BaseButton` variants as only `'primary' | 'secondary'`, while `src/lib/components/BaseButton.svelte:11` supports `'default' | 'primary' | 'secondary' | 'ghost' | 'peach'` and defaults to `'default'`.

Cleanup opportunity:

- Rename/reframe the docs as production component reference rather than prototype-only.
- Update stale props/implementation notes for the primitives touched by this segment.

### Low: Component gallery covers only older/prototype-era components

Evidence:

- `src/routes/components/+page.svelte:4-15` links only ten components: `PageHeader`, `FooterActions`, `BaseButton`, `Chip`, `StatusBadge`, `DropzonePanel`, `StatusLegendPanel`, `FileListPanel`, `BatchIntentPanel`, and `FileOverridePanel`.
- Newer primitives and shell components such as `Stepper`, `ChoiceCard`, `Segmented`, `ThinProgress`, `AppSidebar`, `AppHeader`, `ObjectThumbnail`, `Stamp`, and `StripedPlaceholder` are not represented.

Cleanup opportunity:

- Either expand the gallery for retained reusable primitives or explicitly treat `/components` as an old reference surface.
- Since prototypes are dev-only for now, this route can remain protected/internal, but docs should not imply it is comprehensive if it is not.

### Low: Primitive prop surfaces are inconsistent about forwarding HTML attributes

Evidence:

- `BaseButton` forwards `...rest` and uses `HTMLButtonAttributes`.
- `Chip` supports `class` but does not forward additional span attributes.
- `Stamp`, `StripedPlaceholder`, `ThinProgress`, `Segmented`, and `ChoiceCard` expose fixed prop shapes and do not forward extra attributes.

Cleanup opportunity:

- Do not retrofit every component at once.
- Prefer adding forwarding only where callers need accessibility labels, test IDs, form attributes, or ARIA controls.
- `Stepper` and `ThinProgress` have concrete accessibility reasons to change first.

## Verification Performed

- Enumerated reusable component files and component gallery routes.
- Checked for existing `src/lib/components/**/*.svelte.spec.ts` browser tests.
- Read representative primitive, shell, docs, and gallery files.
- Cross-checked docs claims against implementation for `AppSidebar` and `BaseButton`.

No implementation changes were made in this pass beyond this analysis document.

## Proposed Remediation Plan

1. Fix `Stepper` accessibility/action semantics: disable completed steps without `onJump`, add step labels, and mark current step.
2. Fix `ThinProgress` semantics: clamp lower bound and add progressbar ARIA attributes.
3. Add focused browser tests for `Stepper` and `ThinProgress` behavior.
4. Update `docs/components.md` to remove prototype-only framing and correct the stale `AppSidebar`/`BaseButton` entries.
5. Optionally add component-gallery entries for the primitives changed in this segment.
6. Run targeted browser tests, then `npm run check`, `npm run lint`, and `git diff --check`.
