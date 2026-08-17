# translateDynamic Inventory

Final repository-wide audit for `UM-105`, re-audited by `UM-106`. Every production semantic `translateDynamic`
lookup (including wrapper-mediated calls) is listed with its classification and
disposition. After the conversions below, no production `translateDynamic` caller
remains.

The helper `translateDynamic()` itself remains exported from
`src/lib/i18n/translate.ts` for potential future genuinely-open-key use and keeps its
focused lookup tests in `src/lib/i18n/translate.spec.ts`.

## Former semantic call sites

| Surface | Call site (before) | Input type | Classification | Replacement |
|---|---|---|---|---|
| Object detail access reason | `src/routes/objects/[objectId]/+page.svelte:490` | `ObjectDetail['accessReasonCode']` (closed union) | Closed union | Typed template key `reasonLabel()` -> `t(\`objects.table.reasons.${value}\`)`; existing wording preserved |
| Object edit access level | `src/routes/objects/[objectId]/edit/+page.svelte:893` | `ObjectEditPayload['rights']['accessLevel']` (closed union) | Closed union | Typed template key `accessLevelLabel()` -> `t(\`ingestionSetup.batchIntent.accessLevels.${level}\`)` |
| Review item kind | `src/routes/ingestion/[batchId]/review/+page.svelte:73` | `ItemKind` (closed union) | Closed union | Typed template key `t(\`ingestionReview.kind.${kind}\`)` |
| Review preset | `src/routes/ingestion/[batchId]/review/+page.svelte:86-87` | Open backend string (`IngestionDetail.pipelinePreset`) | Known subset of open value | `knownReviewPipelinePresetKey(value): TranslationKey \| null` + raw fallback |
| Review visibility | `src/routes/ingestion/[batchId]/review/+page.svelte:89-90` | `IngestionDetail['accessLevel']` (closed union) | Closed union | Typed template key `t(\`ingestionReview.visibility.${level}\`)` |
| Review plural key | `src/routes/ingestion/[batchId]/review/+page.svelte:102-107` | `PluralCategory` (closed union) | Closed union | `formatPlural(dictionary, 'ingestionReview.table.moreFiles', count, locale)` |
| Setup language | `src/routes/ingestion/[batchId]/setup/+page.svelte:1661-1662` | Open backend string | Known subset of open value | `knownSetupLanguageKey(value): TranslationKey \| null` + raw fallback |
| Setup preset | `src/routes/ingestion/[batchId]/setup/+page.svelte:1663-1664` | Open backend string | Known subset of open value | `knownSetupPipelinePresetKey(value): TranslationKey \| null` + raw fallback |

## Typed guard maps

Added to `src/lib/i18n/domainLabels.ts`:

- `reviewPipelinePresetKeys: Record<IngestionPipelinePreset, TranslationKey>` — exhaustive over the seven-value preset union (`ingestionReview.preset.*`).
- `setupPipelinePresetKeys: Record<IngestionPipelinePreset, TranslationKey>` — exhaustive (`ingestionSetup.pipelinePresets.*`).
- `knownReviewPipelinePresetKey(value)` / `knownSetupPipelinePresetKey(value)` — return the typed key or `null`; callers render the original raw value for unknown external presets.
- `knownSetupLanguageKey(value)` — known setup language codes (`en`, `ru`, `fa`, `tg`, `mixed`, `english`, `persian`, `tajik`) after trim/lowercase; unknown codes fall back to the original raw value.
- `knownLanguageKey(value)` / `knownReviewLanguageKey(value)` — known language codes for objects list/detail surfaces; unknown codes fall back raw.
- `knownMediaTypeKey(value)` — known media types (`document`, `image`, `audio`, `video`) after lowercase; unknown values fall back raw.
- `knownObjectTypeKey(value)` — known object type codes (`GENERIC`, `IMAGE`, `AUDIO`, `VIDEO`, `DOCUMENT`) after uppercase; used by the objects list chips, table rows, and recent strip. Unknown types render raw.
- `accessLevelKeys: Record<AccessLevel, TranslationKey>` — exhaustive over the three-value access-level union (`ingestionSetup.batchIntent.accessLevels.*`); consumed by the objects list chips and table.
- `knownRequestActionKey(value)` — known archive-request actions; unknown values fall back raw.

`IngestionPipelinePreset` is derived from the closed update-request contract
(`UpdateIngestionRequest['payload']['pipelinePreset']`) so every mapping is
compile-time exhaustive.

## Raw fallback policy

- Closed unions: no fallback path exists; the compiler guarantees a key for every member.
- Known subsets of open backend values: known members translate via typed guards;
  unknown external values stay visible as the original raw string and are never
  interpolated into arbitrary dictionary paths.
- Truly open user content (names, notes, arbitrary payload messages) continues to
  render raw and never reaches the dictionary.

## Test evidence

- `src/lib/i18n/domainLabels.spec.ts`: every preset/language/type/access-level map member resolves in EN
  and RU; unknown values return `null`.
- `src/routes/objects/[objectId]/page.svelte.spec.ts`: typed access reason renders
  localized in EN and RU without raw codes.
- `src/routes/objects/[objectId]/edit/page.svelte.spec.ts`: typed access level renders
  `Семейный` in RU without `family`.
- `src/routes/ingestion/[batchId]/review/page.svelte.spec.ts`: typed item-kind and
  visibility labels in RU; unknown backend preset `future_pipeline` stays visible raw;
  Russian plural matrix unchanged.
- `src/routes/ingestion/[batchId]/setup/page.svelte.spec.ts`: known/unknown language
  and preset guard coverage is held by `domainLabels.spec.ts`; the setup route keeps its
  existing status/localization suites plus UM-106 additions (RU header/footer, mutation
  toast retranslation, abandon dialog, organize plurals).
- `src/lib/components/ObjectsTable.svelte.spec.ts`: known object types localize and
  unknown types stay raw.

## UM-106 re-audit result

The post-UM-87 transitive audit (UM-106) re-verified every production `translateDynamic`
import and confirmed the count remains **0**. New closed unions and known-open subsets
introduced by the object list and detail work (object types, access levels, load/action
error codes) were converted through the typed maps above rather than dynamic keys.
Server-originated stable sentences (object detail load/download errors, new-ingestion
default batch label) were converted to structured codes or locale-aware generation; only
genuinely open backend values render raw.

## Final disposition

- Production `translateDynamic` call sites: **0**
- Closed unions still using dynamic paths: **0**
- Known open subsets using arbitrary dynamic paths: **0**
- `translateDynamic` imports in route files: **0**
