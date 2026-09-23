# Ingestion Preset and Item-Kind Capability Contract

## 1. Overview and Ownership

This document defines the authoritative capability contract between **Pipeline Presets** and **Item Kinds** within the Osimi Archive web application.

The frontend application and its SvelteKit Backend-for-Frontend (BFF) endpoints are the **authoritative owners** of the ingestion capability contract and validation rules. The Bun/TypeScript backend (`osimi-backend`) acts as a generic transport/storage layer and does not enforce presentation or UI-tier capability constraints.

Because the backend does not enforce this matrix transactionally, BFF validation applies to the capability snapshot read immediately before a mutation or submission. Direct backend clients and concurrent mutations outside the normal UI flow remain outside this frontend-owned invariant.

The authoritative TypeScript implementation and shared validation helpers reside in [`src/lib/ingestion/pipelineCapabilities.ts`](../src/lib/ingestion/pipelineCapabilities.ts).

---

## 2. Canonical Capability Matrix

There are **7 pipeline presets** and **6 item kinds**, defining exactly **42 combinations** (21 allowed, 21 rejected).

| Preset ID | Preset Label | Allowed Item Kinds | Incompatible / Rejected Item Kinds | Presentation Mode | Presentation Stages |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auto` | Auto | `scanned_document`, `photo`, `audio`, `video`, `document`, `other` (6/6) | *(None)* | `detection` | `[]` |
| `none` | Store only | `scanned_document`, `photo`, `audio`, `video`, `document`, `other` (6/6) | *(None)* | `store_only` | `[]` |
| `ocr_text` | OCR + Index | `scanned_document`, `other` (2/6) | `photo`, `audio`, `video`, `document` | `fixed` | `['ocr', 'index']` |
| `audio_transcript` | Transcribe Audio | `audio`, `other` (2/6) | `scanned_document`, `photo`, `video`, `document` | `fixed` | `['transcribe']` |
| `video_transcript` | Transcribe Video | `video`, `other` (2/6) | `scanned_document`, `photo`, `audio`, `document` | `fixed` | `['transcribe']` |
| `ocr_and_audio_transcript` | OCR + Audio | `other` (1/6) | `scanned_document`, `photo`, `audio`, `video`, `document` | `fixed` | `['ocr', 'index', 'transcribe']` |
| `ocr_and_video_transcript` | OCR + Video | `video`, `other` (2/6) | `scanned_document`, `photo`, `audio`, `document` | `fixed` | `['ocr', 'index', 'transcribe']` |

### Pair Count Verification

- Allowed pairs: $6 + 6 + 2 + 2 + 2 + 1 + 2 = 21$
- Rejected pairs: $0 + 0 + 4 + 4 + 4 + 5 + 4 = 21$
- Total: $21 + 21 = 42$

### Allowed Preset Counts per Item Kind

| Item Kind | Allowed Presets Count | Allowed Presets | Suggested Preset |
| :--- | :--- | :--- | :--- |
| `scanned_document` | 3 | `auto`, `none`, `ocr_text` | `ocr_text` |
| `photo` | 2 | `auto`, `none` | `none` |
| `audio` | 3 | `auto`, `none`, `audio_transcript` | `audio_transcript` |
| `video` | 4 | `auto`, `none`, `video_transcript`, `ocr_and_video_transcript` | `video_transcript` |
| `document` | 2 | `auto`, `none` | `none` |
| `other` | 7 | `auto`, `none`, `ocr_text`, `audio_transcript`, `video_transcript`, `ocr_and_audio_transcript`, `ocr_and_video_transcript` | `auto` |

---

## 3. Resolution and Reconciliation Rules

### 3.1. Default Item Kind Resolution
When evaluating batch capabilities or metadata updates where `itemKind` is omitted or `null`:
1. If `classificationType` is provided, look up the canonical `defaultItemKindForClassification(classificationType)` mapping:
   - `newspaper_article`, `magazine_article`, `book_chapter`, `book`, `letter`, `report`, `manuscript`, `document` $\rightarrow$ `scanned_document`
   - `speech`, `interview` $\rightarrow$ `audio`
   - `image`, `other` $\rightarrow$ `photo`
2. If `classificationType` is absent or unmapped, fall back to `'document'`.

### 3.2. Effective Item Kinds in Multi-Item Batches
When a batch contains multiple items:
1. Each item's effective kind is `item.itemKind` if explicitly set on the item; otherwise it inherits the resolved batch-level item kind.
   - Only `null` and `undefined` mean inheritance.
   - Empty strings and every other value outside the six known item kinds are invalid unknown overrides.
2. The batch-level allowed presets are computed as the **strict mathematical intersection** of allowed presets across all effective item kinds:
   $$\text{AllowedPresets}(\text{Batch}) = \bigcap_{i=1}^{N} \text{AllowedPresets}(\text{EffectiveKind}_i)$$
3. If any item has an unrecognized or unknown item kind override:
   - Allowed presets become empty ($\emptyset$).
   - Submission and Continue actions are blocked.
   - Dedicated error banner `ingestionSetup.errors.unknownItemKind` / `ingestionReview.errors.unknownItemKind` is displayed.

### 3.3. Synchronous Preset Reconciliation on Kind Change
When a user changes classification or batch item kind in UI forms (New Ingestion or Setup):
1. If the current preset remains in the new allowed presets set, **retain the user's manual choice**.
2. If the current preset is invalidated, automatically switch to `getSuggestedPipelinePreset(newItemKind)`.
3. If the suggested preset is not valid for all effective item kinds (in mixed batches), fall back to `'auto'`.

---

## 4. Consumer Routes and Enforcement

### 4.1. New Ingestion Route (`/ingestion/new`)
- **UI (`+page.svelte`)**:
  - Renders all preset cards and disables incompatible cards based on `getAllowedPipelinePresets(selectedItemKind)`.
  - Automatically updates the selected preset to `getSuggestedPipelinePreset(selectedItemKind)` when switching item kinds if the current selection is invalidated.
  - Hidden input serializes literal `'auto'` when auto preset is selected.
- **Server Action (`+page.server.ts`)**:
  - Validates `classificationType`, `itemKind`, `pipelinePreset`, and `accessLevel` at runtime.
  - Rejects unknown values or incompatible pairs with HTTP 400 and code `INVALID_PIPELINE_CAPABILITY` before calling `createDraft`.

### 4.2. Setup Route (`/ingestion/[batchId]/setup`)
- **UI (`+page.svelte`)**:
  - Computes `effectiveItemKinds` and `allowedPresets` via intersection across all items.
  - Disables incompatible options in the pipeline preset `<select>`.
  - Displays localized warning banner (`incompatiblePreset`, `unknownPreset`, or `unknownItemKind`) when the persisted preset or overrides are invalid.
  - Disables the Continue/Start button when preset is incompatible, unknown overrides exist, or metadata save is in-flight.
  - Treats page-server metadata as authoritative during hydration; `sessionStorage` never overrides a present backend value.
  - Mirrors server-authoritative hydration and successfully saved item kinds to `sessionStorage`.
- **Submit Action (`POST /ingestion/[batchId]/setup`)**:
  - Loads capability context (`getPipelineCapabilityContext`) making only 2 lightweight GET requests (`/api/ingestions/:id` and `/api/ingestions/:id/items`), avoiding N+1 item-file queries.
  - Validates compatibility using `validatePipelinePresetCompatibility()`.
  - Rejects incompatible or unknown states with HTTP 409 and code `INVALID_PIPELINE_CAPABILITY`.

### 4.3. Metadata BFF Endpoint (`PATCH /ingestion/[batchId]/metadata`)
- Validates inbound fields against `metadataUpdateSchema`.
- If `pipelinePreset`, `itemKind`, or `classificationType` are being mutated, retrieves batch context and validates compatibility across all effective items.
- Rejects incompatible mutations with HTTP 400 and `{ code: 'INVALID_PIPELINE_CAPABILITY', details: validation }`.

### 4.4. Review Route (`/ingestion/[batchId]/review`)
- **Server (`+page.server.ts`)**:
  - Resolves `itemKind` fallback from classification default if missing on detail.
  - Passes detail and items array to page.
- **UI (`+page.svelte`)**:
  - Uses `getPipelinePresentation(data.pipelinePreset)` to render pipeline stages:
    - `auto`: Automatic detection chip.
    - `none`: Store-only text.
    - `ocr_text`: OCR + Index chips.
    - `audio_transcript`: Transcribe chip.
    - `video_transcript`: Transcribe chip.
    - `ocr_and_audio_transcript`: OCR + Index + Transcribe footprint chips.
    - `ocr_and_video_transcript`: OCR + Index + Transcribe footprint chips.
  - Validates batch compatibility; displays warning banner with link to Setup and disables the "Begin processing" button if invalid.

---

## 5. Unknown & Legacy State Compatibility

1. **Unknown Preset on Backend Ingestion DTO**:
   - Inbound DTO parser accepts arbitrary strings.
   - Rendered in UI as disabled raw option.
   - Cannot be re-selected once changed.
   - Blocks submission until changed to a valid allowed preset.
2. **Unknown Item Kind Override on Staged Items**:
   - Inbound item parser accepts arbitrary strings.
   - Disables all presets and blocks submission.
    - Displays dedicated translation banner: `Batch contains items with unrecognized item kind overrides.`
    - Cannot be corrected through the current item metadata UI and requires external/admin correction.
3. **Absence of Batch Item Kind**:
   - Resolved deterministically using the classification type's default item kind.
