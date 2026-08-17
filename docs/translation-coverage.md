# Production Translation Coverage

Inventory and verification status for user-facing strings in production surfaces. Maintained by the UM-71 workstream, its remediation dastan UM-87, and the post-UM-87 audit task UM-106.

## Route scope

The authoritative route scope is the authenticated production smoke manifest in
`scripts/smoke-auth.mjs` (`MANIFEST`). Every route below is exercised at
`375x667`, `768x1024`, and `1440x900` in both `en` and `ru`.

| Manifest route | Concrete smoke route |
| --- | --- |
| `/` | `/` |
| `/ingestion` | `/ingestion` |
| `/ingestion/new` | `/ingestion/new` |
| `/ingestion/[batchId]` | `/ingestion/BATCH-20260814-SMOKE` |
| `/ingestion/[batchId]/setup` | `/ingestion/BATCH-20260814-SMOKE/setup` |
| `/ingestion/[batchId]/review` | `/ingestion/BATCH-20260814-SMOKE/review` |
| `/objects` | `/objects` |
| `/objects/[objectId]` | `/objects/OBJ-20260814-DOC001` |
| `/objects/[objectId]/edit` | `/objects/OBJ-20260814-DOC001/edit` |

Object detail additionally renders the image, audio, and video fixture variants
(`OBJ-20260814-IMG001`, `OBJ-20260814-AUD001`, `OBJ-20260814-VID001`).

## Disposition classes

- **STATIC** — becomes a translation key in both `en` and `ru`.
- **FORMAT** — structured data formatting (dates, numbers, bytes, plurals) that must follow the active locale.
- **DYNAMIC** — backend- or data-provided labels with no stable code contract; rendered raw only when genuinely open (see exceptions below).

## Status

| Surface | Status | Tests |
| --- | --- | --- |
| Authenticated shell (`+layout.svelte`, `AppSidebar`, `AppMobileHeader`, `LocaleSwitcher`, `FootnoteBar`, `Stepper`) | Migrated (UM-71, UM-87, UM-100) | `layout.svelte.spec.ts`, `AppSidebar.svelte.spec.ts`, `LocaleSwitcher.svelte.spec.ts`, `Stepper.svelte.spec.ts` |
| Dashboard (`src/routes/+page.svelte`) | Migrated incl. role/activity generated copy (UM-85, UM-91, UM-100) | `page.svelte.spec.ts`, `dashboardMapper.spec.ts` |
| Ingestion overview (`src/routes/ingestion/+page.svelte`) | Migrated | `page.svelte.spec.ts` |
| Ingestion detail (`src/routes/ingestion/[batchId]/+page.svelte`) | Migrated | `page.svelte.spec.ts` |
| New ingestion (`src/routes/ingestion/new/+page.svelte`, `+page.server.ts`) | Migrated incl. localized default batch label via hidden form locale (UM-82, UM-93, UM-106) | `page.svelte.spec.ts` |
| Ingestion setup (`src/routes/ingestion/[batchId]/setup/+page.svelte`, `ObjectGroupRow`, `ObjectMetadataPanel`) | Migrated incl. header/step/footer copy, mutation labels, abandon dialog, oversized-group warning, organize controls, and formatted confirmation counts (UM-87, UM-106) | `page.svelte.spec.ts` (29 tests incl. RU header/footer, mutation toast retranslation, abandon dialog, organize plurals), `ObjectMetadataPanel.svelte.spec.ts` |
| Ingestion review (`src/routes/ingestion/[batchId]/review/+page.svelte`) | Migrated (UM-83, UM-90) | preset matrix, title resolution, plural categories, statuses, languages |
| Objects list (`src/routes/objects/+page.svelte`, `ObjectsFilterPanel`, `ObjectsTable`, `ObjectsRecentStrip`) | Migrated incl. filter chips, type labels, availability/access labels, materialized indicator tooltips, and formatted bulk-resync counts (UM-106) | `ObjectsTable.svelte.spec.ts`, `ObjectsRecentStrip.svelte.spec.ts`, `ObjectsFilterPanel.svelte.spec.ts`, `domainLabels.spec.ts` |
| Object detail (`src/routes/objects/[objectId]/+page.svelte`, `+page.server.ts`) | Migrated incl. structured load/action error codes and download messages (UM-85, UM-91, UM-106) | `page.svelte.spec.ts`, `page.server.spec.ts` |
| Object editing (`src/routes/objects/[objectId]/edit/+page.svelte`, `+page.server.ts`, `SourceTextDiff`) | Migrated incl. stable form/field error codes (UM-84, UM-92, UM-100) | `page.svelte.spec.ts`, `page.server.spec.ts`, `objectEditErrors.spec.ts` |
| Object detail children (`ObjectDetailInfoDrawer`, `ObjectSupportSheet`, `MediaRequestBanner`, `ArtifactTextPreview`, `ObjectViewerCanvas`) | Migrated (UM-91) | viewer states per media kind, request banners, zoom controls |

`AppHeader.svelte` is legacy/prototype-only and not reachable from the production route graph; it is excluded from this inventory on that basis (see `docs/prototype-reference.md`).

## Dictionary contract

- `en` and `ru` expose identical nested leaf paths (**1125** leaves each, enforced by `src/lib/i18n/translations.spec.ts` as a growth alarm).
- Every leaf is a string; intermediate nodes are plain objects; keys may not contain `.`; empty values are rejected.
- Placeholder names and counts match across locales (enforced by `src/lib/i18n/translationValidation.ts`).
- Static lookups are typed with `TranslationKey` (derived from the English dictionary), so unknown paths, object paths, and typos fail `npm run check`.
- Stable client-known values use exhaustive typed mappings (see `src/lib/i18n/domainLabels.ts`); known subsets of open backend values use typed `knownXKey()` guards that return a `TranslationKey | null`, with the original raw value as the visible fallback.
- `translateDynamic()` has **zero** production callers; it is retained only as a generic helper (see `docs/translate-dynamic-inventory.md`).

## Formatting contract

- Timestamps: `formatDateTime` with `dateStyle: 'medium'`, `timeStyle: 'short'`, and an explicit `timeZone: 'UTC'` so server and client render identical output. Invalid or missing values render `values.unknown`.
- Byte sizes: `formatFileSize` (B/KB/MB/GB/TB/PB, one decimal above B) with `Intl.NumberFormat` for the active locale, including values below 1024.
- Counts: `formatCount` through `Intl.NumberFormat` for the active locale, also when interpolated into templates.
- Plurals: `Intl.PluralRules($locale)`; English supplies `one`/`other`, Russian supplies `one`/`few`/`many`/`other`. Plural families exist across dashboard, ingestion overview/detail, setup (`organize.*` incl. `oversizedGroup*`), review, objects list/detail, viewer page counts, and object editing — not just `ingestionReview.table.moreFiles*`.
- `formatPlural` takes the plural base as a string and casts the resolved path to `TranslationKey`; it is therefore less compile-time-safe than static `translate()` calls. Plural bases are asserted by the focused suites (`format.spec.ts`, route specs) and the smoke unresolved-placeholder checks.

## Status and enum normalization

- Ingestion batch/file/item statuses are normalized per domain (`statusLabels.ts`) with localized labels; unknown status values render raw.
- Stable object enums (availability, processing, curation, access reasons, request statuses/actions, media types) are localized through exhaustive typed maps; unknown external values render raw.
- Known language codes, pipeline presets, and object type codes (case-insensitive `GENERIC`/`IMAGE`/`AUDIO`/`VIDEO`/`DOCUMENT`) use typed guards with raw fallback.
- Dashboard role copy and known activity events are converted through typed mapper codes (`dashboardMapper.ts`, `domainLabels.ts`) — they are **not** dynamic exceptions.
- Object-edit and login form/field validation errors return stable codes (`objectEditErrors.ts`, `loginErrors.ts`) and translate in the page — they are **not** dynamic exceptions.

## Server-originated copy

- Object detail load/action errors return structured codes (`{ code: 'loadFailed', requestId }`, `errorCode`, `messageCode`) and are translated client-side (`objects.detail.errors.*`, `objects.detail.downloadMessages.*`).
- The new-ingestion default batch label is generated in the submitting client's locale via a hidden `locale` form field (`ingestionNew.untitledBatch`). User-typed labels are user content and stay verbatim.
- SvelteKit `throw error(...)` pages are developer-facing error surfaces outside the localized route scope.

## Dynamic labels documented as out of scope

Only genuinely open values render raw:

- User content: titles, filenames, tags, people, notes, descriptions, user-typed batch labels, summary text.
- Unknown backend values after a typed guard fails: enum/status/type/action/preset/language codes, dashboard event types, arbitrary payload messages (`{ code: 'raw', text }`).
- Backend-provided error text where no stable contract exists: setup/review action `error` payloads, publication `failureReason`.
- Content MIME types and archival text/OCR/transcript content.
- Language endonyms and native-script labels (فارسی, Тоҷикӣ) are displayed verbatim by design.
- Technical tokens: `YYYY` date placeholder, IDs, request IDs.

## Accessibility contract

- Mobile-only icon controls carry localized `aria-label` names (top-bar Info/Resync, new-ingestion Discard, object-list Close).
- Dialogs use the shared `BaseDialog` component (`src/lib/components/BaseDialog.svelte`): `role="dialog"`, `aria-modal`, `aria-labelledby`, initial focus, Escape close, Tab containment, click-outside close, and focus restoration. Used by the resync confirmation and the publish dialog. Modal behavior itself is owned by UM-103.
- Tag/person removal buttons include the removed value in their localized accessible name (`ingestionSetup.objectMetadata.fields.removeTag` / `removePerson`).
- `Stepper` exposes localized step names via the `stepper.ariaLabel` template and marks the current step with `aria-current="step"`.

## Verification

- Focused suites: `src/lib/i18n/*.spec.ts`, `domainLabels.spec.ts`, `statusLabels.spec.ts`, `dashboardMapper.spec.ts`, plus every manifest route's `page.svelte.spec.ts`.
- The authenticated production smoke (`scripts/smoke-auth.mjs`) checks every manifest route for: staying on route, no SvelteKit error page, `html lang` matching the active locale, no horizontal overflow, no raw translation keys, no unresolved placeholders, and route-specific localized copy in EN and RU. It does not, by itself, prove that no English remains on RU pages — the focused route suites and this inventory carry that claim.
- The authoritative release gate and evidence record are owned by UM-107 (`test-artifacts/um107/`).

## Known limitations (UM-72)

- Persistence is client-only. SSR emits English, `app.html` starts with `lang="en"`, and a saved Russian locale is applied after hydration.
- The preference is per browser/device on the current origin, not per user account, and does not synchronize between devices.
- Changing the locale does not reload the page or trigger a backend request.
- `en` and `ru` are left-to-right, so no `dir` handling is implemented.

Explicitly out of scope:

- Locale cookies and server-negotiated locale (`Accept-Language`, locale-prefixed URLs, account-level preferences).
- Server-rendering the persisted client locale.
- A third-party localization framework; the custom dictionary and helpers are intentionally minimal.
