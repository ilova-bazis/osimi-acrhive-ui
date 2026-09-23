# UM-108 Implementation Plan

## Purpose

Implement UM-108 so ingestion preset/item-kind compatibility has one authoritative frontend/BFF policy shared by New, Setup, Review, and server mutation boundaries.

This plan is intended to be executable by an agent with no prior conversation context.

## Approved Decisions

- Policy owner: frontend/BFF.
- Backend compatibility behavior remains unchanged.
- Preserve the current New-ingestion matrix exactly: 21 allowed and 21 rejected pairs.
- Validate a batch-wide preset against every effective item kind.
- Effective item kind is `item.item_kind ?? ingestion.item_kind`.
- Preserve and validate persisted item-kind overrides.
- Do not add item-override editing controls or mutation support.
- `auto` means automatic detection. It must not claim OCR, indexing, or transcription stages that may not run.
- Unknown persisted backend values remain visible, but mutable or submission paths must not treat them as valid policy values.

## Task Lifecycle

Run Umati only from:

`/home/bazis/coding/projects/osimi-archive`

Do not edit `.umati` files directly.

Before editing:

```bash
umati show UM-108
umati claim UM-108 --agent <executing-agent>
umati start UM-108 --agent <executing-agent>
```

Use the actual executor identity accepted by Umati: `opencode`, `codex`, or `claude`.

After all implementation and verification gates pass:

```bash
umati complete UM-108 --agent <executing-agent>
```

Do not complete UM-108 if any required test, type-check, lint, build, or documentation gate remains unresolved.

## Repository State

Frontend repository:

`/home/bazis/coding/projects/osimi-archive/osimi-archive-ui`

Branch:

`redesign`

The worktree is already dirty. Several relevant files, including Setup, its tests, translations, and API documentation, contain existing changes. Inspect diffs before editing and preserve all unrelated work.

Do not replace or modify the existing untracked `execution_plan_tmp.md`; it contains an older UM-101 through UM-107 plan.

Backend repository:

`/home/bazis/coding/projects/osimi-archive/osimi-backend`

Branch:

`thumbnail`

The backend worktree is also dirty. UM-108 should not modify it.

No commit should be created unless the user explicitly requests one.

## Authoritative Matrix

Use these seven presets:

| Preset |
|---|
| `auto` |
| `none` |
| `ocr_text` |
| `audio_transcript` |
| `video_transcript` |
| `ocr_and_audio_transcript` |
| `ocr_and_video_transcript` |

Use these six item kinds:

| Item kind |
|---|
| `photo` |
| `audio` |
| `video` |
| `scanned_document` |
| `document` |
| `other` |

Preserve this exact matrix:

| Preset | photo | audio | video | scanned_document | document | other |
|---|---:|---:|---:|---:|---:|---:|
| `auto` | allow | allow | allow | allow | allow | allow |
| `none` | allow | allow | allow | allow | allow | allow |
| `ocr_text` | reject | reject | reject | allow | reject | allow |
| `audio_transcript` | reject | allow | reject | reject | reject | allow |
| `video_transcript` | reject | reject | allow | reject | reject | allow |
| `ocr_and_audio_transcript` | reject | reject | reject | reject | reject | allow |
| `ocr_and_video_transcript` | reject | reject | allow | reject | reject | allow |

Allowed-pair count by item kind:

| Item kind | Allowed count | Allowed presets |
|---|---:|---|
| `photo` | 2 | `auto`, `none` |
| `audio` | 3 | `auto`, `none`, `audio_transcript` |
| `video` | 4 | `auto`, `none`, `video_transcript`, `ocr_and_video_transcript` |
| `scanned_document` | 3 | `auto`, `none`, `ocr_text` |
| `document` | 2 | `auto`, `none` |
| `other` | 7 | all presets |

Preserve these suggestions:

| Item kind | Suggested preset |
|---|---|
| `photo` | `none` |
| `audio` | `audio_transcript` |
| `video` | `video_transcript` |
| `scanned_document` | `ocr_text` |
| `document` | `none` |
| `other` | `auto` |

Preserve Review presentation behavior:

| Preset | Mode | Declared stages |
|---|---|---|
| `auto` | detection | none |
| `none` | store only | none |
| `ocr_text` | fixed | OCR, index |
| `audio_transcript` | fixed | transcribe |
| `video_transcript` | fixed | transcribe |
| `ocr_and_audio_transcript` | fixed | OCR, index, transcribe |
| `ocr_and_video_transcript` | fixed | OCR, index, transcribe |

## Architecture

### Shared Capability Module

Add:

`src/lib/ingestion/pipelineCapabilities.ts`

This must be browser-safe and must not import server-only modules.

It should be the dependency root for preset policy. It must not import:

- `src/lib/api/schemas/ingestions.ts`
- `src/lib/services/ingestionDetail.ts`
- `src/lib/i18n/domainLabels.ts`

Export:

- `pipelinePresets`
- `PipelinePreset`
- `PipelinePresentationStage`
- `pipelinePresetCapabilities`
- `suggestedPipelinePresetByItemKind`
- `isPipelinePreset`
- `getPipelinePresetCapability`
- `getAllowedPipelinePresets`
- `getSuggestedPipelinePreset`
- `isPipelinePresetAllowedForItemKind`
- A helper that validates one preset against every effective item kind

The capability mapping should contain:

- Allowed item kinds
- Presentation mode
- Presentation stages

Do not place translated labels in this module.

The all-effective-kind helper must:

- Accept the selected preset as an open string.
- Accept the proposed batch item kind.
- Accept zero or more nullable/open item-kind overrides.
- Resolve `override ?? proposedBatchItemKind` for each item.
- Validate the proposed batch kind itself when there are no items.
- Deduplicate effective kinds only as an optimization.
- Report unknown preset values.
- Report unknown item-kind override values.
- Report known incompatible effective kinds.
- Never reinterpret an unknown non-null override as inheritance.

A suitable result shape is a discriminated union containing:

- `valid`
- Known effective kinds
- Unknown raw item kinds
- Incompatible known item kinds

The exact names may follow local conventions, but callers must not need to reproduce compatibility logic.

### Dependency Safety

`kindMappings.ts` currently derives `ItemKind` from `ingestions.ts`. Avoid introducing a runtime cycle.

The capability module may use a type-only `ItemKind` import and its own literal item-kind tuple for exhaustive policy checking. Type-only imports must remain erased at runtime.

Keep the unrelated display-oriented `PipelinePreset` in `src/lib/models.ts` unchanged.

## Transport and Domain Types

### Ingestion Schemas

Modify:

`src/lib/api/schemas/ingestions.ts`

Changes:

- Replace duplicated create/update preset enums with `z.enum(pipelinePresets)`.
- Keep `ingestionDtoSchema.pipeline_preset` open as a non-empty string.
- Do not narrow backend detail responses to known presets.
- Keep item response `item_kind` open and nullable so an unknown persisted override can remain visible and invalid instead of being silently treated as inheritance.

Do not expand item create/update request schemas. Override editing is not part of UM-108.

### Service Request Types

Modify:

- `src/lib/services/ingestionNew.ts`
- `src/lib/services/ingestionDetail.ts`
- `src/lib/i18n/domainLabels.ts`

Changes:

- Use the shared `PipelinePreset` type for create/update request payloads.
- Keep `IngestionDetail.pipelinePreset` as `string`.
- Import `PipelinePreset` directly in `domainLabels.ts` instead of deriving it indirectly from `UpdateIngestionRequest`.

### Persisted Item Overrides

Modify:

- `src/lib/services/ingestionDetail.ts`
- `src/lib/services/apiIngestionDetailService.ts`

Add the persisted item-kind override to `IngestionDetailItem`.

The domain representation must preserve:

- `null` as explicit inheritance.
- Known item-kind strings.
- Unknown non-null raw strings.

Do not normalize an unknown override to `null` or `undefined`.

Update `mapItem()` accordingly.

Do not add classification/language override editing or persistence work.

## Lightweight Capability Context

Add a focused method to `IngestionDetailService`, such as `getPipelineCapabilityContext`.

The exact name may vary, but its contract should expose:

- Current batch classification type.
- Current batch item kind.
- Current open-string pipeline preset.
- Persisted nullable/open item-kind overrides.

Implement it in:

`src/lib/services/apiIngestionDetailService.ts`

It must perform only:

1. `GET /api/ingestions/:id`
2. `GET /api/ingestions/:id/items`

Run the reads in parallel where practical.

Do not call `getDetail()` from metadata autosave or submit validation. `getDetail()` performs one additional item-file request per item and would turn every debounced metadata save into an N+1 request sequence.

Do not fetch item-file lists in the new context method.

Test exact request paths and verify that zero or multiple items do not cause item-file requests.

## New Ingestion

### Client UI

Modify:

`src/routes/ingestion/new/+page.svelte`

Changes:

- Remove the route-local compatibility matrix.
- Remove the route-local suggestion map.
- Type `selectedPreset` as `PipelinePreset`.
- Type preset definitions with `PipelinePreset`.
- Use shared helpers for enabled/disabled cards.
- Use the shared suggestion helper.
- Preserve the current behavior of retaining a compatible manual choice.
- When an item-kind change invalidates the selected preset, synchronously choose the suggested preset.
- Preserve all 21 enabled and 21 disabled outcomes.
- Preserve `auto` as the literal submitted value.
- Do not derive concrete processing stages from `auto`.

Do not redesign the page.

### Server Action

Modify:

`src/routes/ingestion/new/+page.server.ts`

Replace raw string-to-union casts with runtime parsing.

Requirements:

- Blank or missing fields use documented defaults.
- A non-empty unknown classification type returns `fail(400, ...)`.
- A non-empty unknown item kind returns `fail(400, ...)`.
- A non-empty unknown preset returns `fail(400, ...)`.
- A non-empty unknown access level returns `fail(400, ...)`.
- Known but incompatible classification/item-kind pairs return `fail(400, ...)`.
- Known but incompatible preset/item-kind pairs return `fail(400, ...)`.
- Rejected requests must not call `ingestionNewService.createDraft`.
- Preserve classification derivation when classification is omitted.
- Preserve existing defaults unless intentionally aligning them is separately approved.

Use existing schemas and `isItemKindAllowedForClassification` rather than manually reproducing enum unions.

Use a stable local error code such as:

`INVALID_PIPELINE_CAPABILITY`

Include the preset and item kind in local validation data where appropriate.

## Setup

Modify:

`src/routes/ingestion/[batchId]/setup/+page.svelte`

Changes:

- Remove the local `pipelinePresets` tuple.
- Use the shared preset tuple and capability helpers.
- Keep backend-provided preset state open enough to display unknown values.
- Derive effective item kinds from `data.items` and the displayed batch item kind.
- Derive allowed presets as the intersection across every known effective item kind.
- If any effective item kind is unknown, consider the compatibility state invalid.
- Show all known preset options.
- Disable known incompatible options.
- Add a disabled synthetic option for an unknown persisted preset so the select does not visually misrepresent it as `auto`.
- Keep a known-but-incompatible persisted preset visible until the user corrects it.
- Show a localized warning when the persisted selection is unknown or incompatible.
- Add compatibility validity to `canStartIngestion`.
- Add the same guard directly inside `startIngestion`; do not rely only on disabled buttons.
- Apply the guard to both desktop and mobile Continue controls.

### Synchronous Reconciliation

When classification or batch item kind changes:

1. Resolve the new batch intent.
2. Resolve every item's effective kind against the proposed batch kind.
3. Preserve the current preset if it remains valid for all effective kinds.
4. Otherwise choose the item-kind suggestion if it is valid for all effective kinds.
5. Otherwise choose `auto`, which is valid for all six known kinds.
6. Update the item kind and preset together.
7. Queue one metadata save after both fields are coherent.

Do not use a later reactive effect that can allow the metadata autosave to send an intermediate incompatible pair.

### Metadata Save Race

Prevent navigation to Review while capability-relevant metadata is pending, saving, or failed.

The implementation may include metadata-save readiness in `canStartIngestion` or explicitly flush and await the pending save. It must ensure Review reloads server-authoritative values matching the Setup state.

Do not broadly redesign the existing autosave mechanism.

### Session Storage

Setup currently lets stored browser item-kind state precede backend metadata.

Do not allow stale session state to produce a UI/BFF capability mismatch.

At minimum:

- Validate the proposed PATCH values rather than only the stored backend values.
- Update confirmed/session state only after a successful metadata save.
- Ensure Review cannot be entered before the proposed intent is persisted.

Avoid unrelated changes to the full batch-intent persistence design.

## Metadata BFF

Modify:

`src/routes/ingestion/[batchId]/metadata/+server.ts`

Changes:

- Reuse `classificationTypeSchema`, `itemKindSchema`, and the shared preset tuple.
- Preserve strict request validation.
- Unknown request enum values return HTTP 400.
- If `itemKind` or `pipelinePreset` is being changed, load the lightweight capability context.
- Apply partial payload values over the current stored batch context.
- Resolve missing batch kind with the same documented fallback used by the route/domain.
- Validate the resulting preset against every persisted effective item kind.
- Reject incompatible or unknown capability states before calling `ingestionDetailService.update`.
- Return a stable JSON error code and useful pair details.
- Preserve existing authentication, CSRF/origin, unauthorized, and backend error behavior.

For an incompatible mutation, use HTTP 400.

An unrelated partial metadata update need not be blocked solely because a historical capability pair is invalid, unless that request also supplies or changes capability fields.

## Final Submit BFF

Modify:

`src/routes/ingestion/[batchId]/setup/+server.ts`

Before handling `action: 'submit'`:

1. Load the lightweight capability context.
2. Resolve every effective item kind.
3. Reject unknown presets.
4. Reject unknown non-null item-kind overrides.
5. Reject any known incompatible pair.
6. Do not call `ingestionSetupService.submit` when invalid.

Use the same stable capability error code.

A current persisted-state conflict should return HTTP 409, because the submitted JSON payload itself is syntactically valid but the resource state is incompatible.

Do not add these reads to unrelated setup actions such as presign, commit, reorder, or delete.

## Review

### Server Load

Modify:

`src/routes/ingestion/[batchId]/review/+page.server.ts`

The existing detail load already includes persisted items.

Compute and return a serializable capability-validation result using:

- Stored open-string preset.
- Resolved batch item kind.
- Persisted item-kind overrides.

Do not redirect an incompatible draft away from Review. Return enough state for Review to explain the issue and direct the user back to Setup.

Preserve the existing missing-batch-kind legacy fallback unless a separate contract change is approved.

### Review UI

Modify:

`src/routes/ingestion/[batchId]/review/+page.svelte`

Changes:

- Remove `PIPELINE_CAPABILITIES`.
- Use the shared capability mapping for mode and stages.
- Preserve raw labels for unknown backend presets.
- Unknown presets must show no invented stages.
- `auto` must show detection and no OCR/index/transcription promises.
- `none` must show store-only behavior.
- Explicit presets must preserve current stage presentation.
- Show a localized warning for incompatible or unknown capability state.
- Disable confirmation/submission when invalid.
- Guard `beginProcessing()` directly as well as disabling the button.
- Keep the final submit BFF validation as the authoritative browser-bypass guard.

Do not add item-override editing controls to Review.

## Localization

Modify carefully because the file is already dirty:

`src/lib/i18n/translations.ts`

Add English and Russian keys for:

- Incompatible preset/effective-kind warning.
- Unknown persisted preset warning, if separate copy is useful.
- Unknown persisted item-kind override warning, if separate copy is useful.
- A correction instruction directing the user back to Setup.

Update translation validation tests if required by repository conventions.

Keep local error codes stable and translate user-visible text in the component rather than using backend prose as a translation key.

## Documentation

### Capability Contract

Create:

`docs/ingestion-capability-matrix.md`

It must document:

- Frontend/BFF ownership.
- All seven presets.
- All six item kinds.
- The complete 42-pair matrix.
- The six suggestions.
- Effective-kind resolution: item override first, batch kind otherwise.
- No-item behavior: validate the batch kind itself.
- Unknown-value behavior.
- Historical invalid-state behavior.
- New/Metadata/Submit BFF rejection behavior.
- `auto` as detection only.
- Review presentation stages for explicit presets.
- Every consuming route/module.
- Explicit backend non-goals.

Add a concise source comment in `pipelineCapabilities.ts` pointing to this document. The documentation itself should list New, Setup, Review, metadata BFF, and submit BFF as consumers.

### Handoff Plan

This plan is stored at:

`docs/UM-108-implementation-plan.md`

Do not overwrite `execution_plan_tmp.md`.

## Backend Non-Goals

Do not modify `osimi-backend`.

Specifically, UM-108 must not add:

- Backend preset/item-kind validation.
- Database migrations.
- Enum changes.
- Submit-time backend matrix checks.
- Lease-time backend matrix checks.
- `pipeline_preset` in worker leases.
- Derivation of `summary.processing` from `pipeline_preset`.
- Processing-override precedence rules.
- A backend capabilities endpoint for this matrix.
- Backend API documentation claiming this is a service invariant.

Reason:

- The backend stores `pipeline_preset` as an enum but does not interpret it.
- Worker leases do not include `pipeline_preset`.
- Worker processing intent currently comes from `summary.processing` and file `processing_overrides`.
- Adding backend rejection would silently create a new invariant for direct API clients without defining worker semantics or migration behavior.

Direct backend API clients can therefore continue sending any enum-valid pair. That bypass is accepted under the approved frontend/BFF ownership decision.

## Test Plan

### Exhaustive Policy Tests

Add:

`src/lib/ingestion/pipelineCapabilities.spec.ts`

Cover all 42 pairs explicitly.

Assertions:

- Exactly seven presets exist.
- Exactly six item kinds are represented.
- Exactly 42 unique pairs are tested.
- Exactly 21 are allowed.
- Exactly 21 are rejected.
- Allowed counts are `2/3/4/3/2/7` for photo/audio/video/scanned-document/document/other.
- Every helper agrees with the authoritative mapping.
- All six suggestions are exact.
- `auto` is valid for all six kinds.
- `auto` has detection mode and no concrete stages.
- `none` has no concrete stages.
- Unknown preset is invalid.
- Unknown non-null item override is invalid.
- Null item override inherits the batch kind.
- Empty item lists validate the batch kind.
- Mixed inherited and overridden items validate every effective kind.

Required mixed-item examples:

- Batch `scanned_document` + `ocr_text`, null override: allow.
- Batch `scanned_document` + `ocr_text`, `photo` override: reject.
- Batch `scanned_document` + `auto`, `photo` override: allow.
- Batch `other` + `audio_transcript`, `audio` override: allow.
- Batch `other` + `audio_transcript`, `video` override: reject.

### New Browser Tests

Extend:

`src/routes/ingestion/new/page.svelte.spec.ts`

Cover:

- All seven preset card states for each reachable item kind.
- Exact enabled counts per kind.
- All six suggestions.
- Compatible manual selection remains selected.
- Incompatible selection is reconciled after a kind change.
- Hidden form value remains `auto` when auto is selected.
- Existing localization and accessibility behavior remains intact.

### New Server Tests

Extend:

`src/routes/ingestion/new/page.server.spec.ts`

Cover:

- Known allowed pair reaches `createDraft`.
- Known incompatible pair returns 400 and does not call `createDraft`.
- Unknown item kind returns 400.
- Unknown preset returns 400.
- Unknown classification returns 400.
- Unknown access level returns 400.
- Known incompatible classification/item pair returns 400.
- Blank fields retain defaults.
- Omitted classification still derives from item kind.
- Stable local capability error code is returned.

### Schema and Mapping Tests

Extend:

- `src/lib/api/schemas/ingestions.spec.ts`
- `src/lib/services/apiIngestionDetailService.spec.ts`

Cover:

- Shared preset tuple drives create/update request schemas.
- Unknown outbound preset is rejected.
- Unknown inbound detail preset remains accepted.
- Null item override is preserved.
- Known item override is preserved.
- Unknown item override remains distinguishable from null inheritance.
- Lightweight capability context performs only detail and item-list requests.
- No item-file requests occur.
- Zero and multiple item responses map correctly.

Do not add item create/update override contract tests because override mutation support is out of scope.

### Metadata BFF Tests

Extend:

`src/routes/ingestion/[batchId]/metadata/server.spec.ts`

Cover:

- Allowed proposed pair updates metadata.
- Incompatible proposed pair returns 400.
- Rejected requests do not call `update`.
- Unknown request preset and item kind return 400.
- Partial preset-only update uses stored batch kind.
- Partial item-kind-only update uses stored preset.
- Null overrides inherit the proposed batch kind.
- Explicit overrides retain their own kind.
- A single incompatible effective override rejects the whole update.
- Unknown non-null persisted override rejects capability-changing updates.
- Unrelated metadata-only partial updates preserve existing behavior.
- Authentication and backend-error mapping remain unchanged.

### Setup Browser Tests

Extend:

`src/routes/ingestion/[batchId]/setup/page.svelte.spec.ts`

First correct capability-related fixtures that currently pair `classificationType: 'document'` with `itemKind: 'photo'`.

Cover:

- Known presets are all visible.
- Incompatible options are disabled.
- Allowed options reflect all effective kinds, not only the batch default.
- Compatible manual preset survives a kind change.
- Incompatible preset changes synchronously with the kind before one metadata save.
- Suggestion is used when globally compatible.
- `auto` is used when the batch suggestion conflicts with an override.
- Known persisted invalid preset remains visible and blocks Continue.
- Unknown persisted preset uses a synthetic visible option and blocks Continue.
- Unknown item override blocks Continue.
- Both desktop and mobile Continue controls are disabled.
- Direct `startIngestion()` behavior cannot navigate when invalid.
- Pending capability metadata persistence prevents navigation.

Preserve all unrelated setup tests and dirty-file changes.

### Submit BFF Tests

Extend:

`src/routes/ingestion/[batchId]/setup/server.spec.ts`

Add a capability-context service mock.

Cover:

- Valid persisted state calls `submit`.
- Incompatible batch pair returns 409 and does not call `submit`.
- One incompatible item override returns 409.
- Null override inherits the batch kind.
- Unknown preset returns 409.
- Unknown non-null item-kind override returns 409.
- Capability context is not loaded for presign, commit, item mutation, reorder, attach, or deletion actions.
- Existing auth, origin, backend-error, and deletion behavior remains intact.

### Review Server Tests

Extend:

`src/routes/ingestion/[batchId]/review/page.server.spec.ts`

Cover:

- Successful load returns compatibility state.
- Null item override inherits the batch kind.
- Explicit override participates in validation.
- Unknown override is reported.
- Unknown preset is reported.
- Existing redirect behavior for non-resumable ingestion remains unchanged.

### Review Browser Tests

Extend:

`src/routes/ingestion/[batchId]/review/page.svelte.spec.ts`

Correct the default fixture's incompatible `document`/`photo` pairing.

Cover:

- All seven known presets retain localized labels.
- Explicit preset stages match shared capability data.
- Both flow and footprint are asserted.
- `auto` shows detection and no concrete stages.
- Unknown preset remains visible as raw text.
- Invalid compatibility warning appears.
- Confirmation and Begin Processing are blocked when invalid.
- `beginProcessing()` does not issue a request when invalid.
- Valid state preserves existing submission behavior.
- English and Russian warnings are translated.

## Focused Verification

Run focused tests first:

```bash
npx vitest run --project=server src/lib/ingestion/pipelineCapabilities.spec.ts
npx vitest run --project=server src/lib/api/schemas/ingestions.spec.ts
npx vitest run --project=server src/lib/services/apiIngestionDetailService.spec.ts
npx vitest run --project=server src/routes/ingestion/new/page.server.spec.ts
npx vitest run --project=server 'src/routes/ingestion/[batchId]/metadata/server.spec.ts'
npx vitest run --project=server 'src/routes/ingestion/[batchId]/setup/server.spec.ts'
npx vitest run --project=server 'src/routes/ingestion/[batchId]/review/page.server.spec.ts'
npx vitest run --project=client src/routes/ingestion/new/page.svelte.spec.ts
npx vitest run --project=client 'src/routes/ingestion/[batchId]/setup/page.svelte.spec.ts'
npx vitest run --project=client 'src/routes/ingestion/[batchId]/review/page.svelte.spec.ts'
```

Then run all frontend release gates:

```bash
npm run check
npm run lint
npm run test
npm run build
git diff --check
```

Run commands from:

`/home/bazis/coding/projects/osimi-archive/osimi-archive-ui`

No PostgreSQL or backend integration environment should be required because the backend is unchanged.

## Final Review Checklist

Before completing UM-108, verify:

- One shared capability mapping exists.
- New no longer contains a local matrix.
- Setup no longer exposes every preset as enabled.
- Review no longer contains its own stage map.
- New form action has no raw enum casts.
- Metadata BFF blocks crafted incompatible changes.
- Submit BFF revalidates current persisted state.
- Every effective item kind is checked.
- Unknown item overrides are not mistaken for inheritance.
- Unknown backend presets remain visible.
- `auto` never claims concrete stages.
- All 42 pairs are tested.
- Matrix documentation exists.
- Backend code and docs are untouched.
- Existing dirty changes were preserved.
- Full frontend verification passes.
- UM-108 is completed through the Umati CLI only.
