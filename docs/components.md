# UI Components (Prototype)

This document describes the component breakdown for the ingestion UI prototype. These components are
used on the `/prototype` route and serve as the reference layout for future UI work.

## Overview

- Components live in `src/lib/components`.
- The prototype assembly lives in `src/routes/prototype/+page.svelte`.
- UI strings are sourced from `src/lib/i18n/translations.ts`.

## Services (Data Sources)

This UI uses service adapters to keep data fetching separate from presentation.

### DashboardService

Purpose: Provide role-aware dashboard summary data. Swappable for API-backed implementation.

Location:
- Interface: `src/lib/services/dashboard.ts`
- Mock implementation: `src/lib/services/mockDashboardService.ts`
- Adapter export: `src/lib/services/index.ts`

## Layout Components

### PageHeader

Purpose: Main header with title, subtitle, session label, language switcher, and text-size control.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| library | string | yes | Header kicker text |
| title | string | yes | Main page title |
| subtitle | string | yes | Supporting copy |
| sessionLabel | string | yes | Label for session pill |
| sessionValue | string | yes | Session display value |
| locales | { key: string; label: string }[] | yes | UI locale options |
| locale | string | yes | Active locale key |
| onLocaleChange | (value: string) => void | yes | Locale change handler |
| textSizes | { key: string; label: string }[] | yes | Text size options |
| textSize | string | yes | Active text size key |
| onTextSizeChange | (value: string) => void | yes | Text size handler |
| textSizeLabel | string | no | Defaults to “Text size” |
| localeLabel | string | no | Defaults to “UI” |

```svelte
<PageHeader
  library="Osimi Digital Library"
  title="Batch Ingestion"
  subtitle="Human intent first. Machines assist, people decide."
  sessionLabel="Session"
  sessionValue="NoorMags Issue 76-79"
  locales={[{ key: 'en', label: 'EN' }, { key: 'ru', label: 'RU' }]}
  locale={locale}
  textSizes={[{ key: 'small', label: 'A-' }, { key: 'default', label: 'A' }, { key: 'large', label: 'A+' }]}
  textSize={textSize}
  textSizeLabel="Text size"
  localeLabel="UI"
  onLocaleChange={(value) => (locale = value)}
  onTextSizeChange={(value) => (textSize = value)}
/>
```

### AppHeader

Purpose: Global authenticated header with user role and logout action.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| library | string | yes | Header kicker text |
| title | string | yes | Main title (e.g., “Dashboard”) |
| username | string | yes | Signed-in username |
| role | string | yes | User role label |
| logoutLabel | string | no | Defaults to “Sign out” |
| onLogout | () => Promise<void> \| void | no | Logout callback handler |

```svelte
<AppHeader
  library="Osimi Digital Library"
  title="Dashboard"
  username="admin"
  role="admin"
  logoutLabel="Sign out"
/>
```

### FooterActions

Purpose: Footer note with primary and secondary actions.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| note | string | yes | Footer supporting copy |
| primaryLabel | string | yes | Primary CTA label |
| secondaryLabel | string | yes | Secondary CTA label |

```svelte
<FooterActions
  note="Human intent confirmed. Review everything before ingestion starts."
  secondaryLabel="Download catalog.json"
  primaryLabel="Start ingestion"
/>
```

## UI Building Blocks

### BaseButton

Purpose: Primary/secondary CTA button styles aligned with the palette.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| variant | 'primary' \| 'secondary' | no | Defaults to 'primary' |
| type | 'button' \| 'submit' \| 'reset' | no | Defaults to 'button' |
| class | string | no | Additional classes |
| children | () => unknown | no | Button content |

```svelte
<BaseButton variant="primary">Start ingestion</BaseButton>
<BaseButton variant="secondary">Download catalog.json</BaseButton>
```

### Chip

Purpose: Pill for tags, quick metadata, and small badges.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| class | string | no | Additional classes |
| children | () => unknown | no | Chip content |

```svelte
<Chip class="border-[var(--border-soft)] bg-[var(--surface-white)]">Creates local staging batch</Chip>
```

### StatusBadge

Purpose: Status pill with dot indicator and palette-accurate semantics.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| status | FileStatus | yes | Uses palette rules |
| label | string | yes | Visible label |

```svelte
<StatusBadge status="needs-review" label="Needs Review" />
```

### ObjectThumbnail

Purpose: Reusable object preview tile that renders backend thumbnail artifacts when present and falls back to a file placeholder when preview is unavailable.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| objectId | string | yes | Object identifier used in download proxy route |
| thumbnailArtifactId | string \| null | yes | Thumbnail artifact id from backend projection |
| objectType | string | yes | Used for compact placeholder label (`DOC`, `IMG`, `AUD`, `VID`, `FILE`) |
| class | string | no | Additional size/layout classes |

```svelte
<ObjectThumbnail
  objectId={row.objectId}
  thumbnailArtifactId={row.thumbnailArtifactId}
  objectType={row.type}
  class="h-12 w-12"
/>
```

## Domain Panels

### ObjectsPageHeader

Purpose: Objects route page header with title/subtitle and selection-aware bulk action button.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| selectionCount | number | no | Defaults to `0`; controls selection action visibility |
| filteredCount | number | no | Filtered row count label |
| totalCount | number | no | Tenant total count label |
| visibleCount | number | no | Count of rows visible on current page |
| onSelectVisible | () => void | no | Select all currently visible rows |
| onClearSelection | () => void | no | Clear current selection |
| onCopySelection | () => void | no | Copy selected object IDs |
| selectionCopied | boolean | no | Temporary copied feedback state |

```svelte
<ObjectsPageHeader
  selectionCount={selectedIds.length}
  filteredCount={data.list.filteredCount}
  totalCount={data.list.totalCount}
  visibleCount={data.list.rows.length}
  onSelectVisible={selectVisible}
  onClearSelection={clearSelection}
  onCopySelection={copySelectionIds}
  selectionCopied={selectionCopied}
/>
```

### ObjectsFilterPanel

Purpose: Sticky objects filter bar with quick filters, active filter chips, and advanced filters drawer.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| filters | ObjectsFilters | yes | Current URL-backed filter state |
| availabilityOptions | AvailabilityState[] | yes | Availability filter options |
| accessOptions | AccessLevel[] | yes | Access-level options |
| sortOptions | ObjectsSort[] | yes | Sort options |
| activeChips | { label: string; href: string }[] | no | Active filter chips with remove links; defaults to `[]` |

```svelte
<ObjectsFilterPanel
  filters={data.filters}
  availabilityOptions={availabilityOptions}
  accessOptions={accessOptions}
  sortOptions={sortOptions}
  activeChips={activeChips()}
/>
```

### ObjectsRecentStrip

Purpose: Horizontal strip for recently ingested objects on the `/objects` route.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| recent | ObjectRow[] | yes | Recent object rows |

```svelte
<ObjectsRecentStrip recent={data.recent} />
```

### ObjectsTable

Purpose: Primary objects table with selection, compact row action menu, processing badge, access reason messaging, and cursor pagination controls.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| rows | ObjectRow[] | yes | Current list rows |
| selectedIds | string[] | yes | Selected row IDs |
| onToggleSelection | (id: string) => void | yes | Row checkbox toggle handler |
| hasActiveFilters | boolean | yes | Controls empty-state messaging |
| queryEntries | [string, string][] | yes | Current query params for pagination forms |
| nextCursor | string \| null | yes | `next_cursor` from backend |
| showFirstPage | boolean | yes | Shows reset-to-first-page action |
| filteredCount | number | yes | Count matching current filters |
| totalCount | number | yes | Tenant-wide total count |

```svelte
<ObjectsTable
  rows={data.list.rows}
  selectedIds={selectedIds}
  onToggleSelection={toggleSelection}
  hasActiveFilters={hasActiveFilters()}
  queryEntries={queryEntries()}
  nextCursor={data.list.nextCursor ?? null}
  showFirstPage={Boolean(data.filters.cursor)}
  filteredCount={data.list.filteredCount}
  totalCount={data.list.totalCount}
/>
```

### DropzonePanel

Purpose: Upload staging area with archival emphasis.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| label | string | yes | Section label |
| headline | string | yes | Dropzone headline |
| support | string | yes | Supporting text |
| badges | string[] | no | Optional chip labels |

```svelte
<DropzonePanel
  label="Dropzone"
  headline="Drag files here or click to browse"
  support="Images, PDFs, audio, video, and archives. No upload until review."
  badges={['Creates local staging batch', 'Supports batch defaults']}
/>
```

### StatusLegendPanel

Purpose: Visual legend of file states using palette-approved badges.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Section title |
| subtitle | string | yes | Supporting text |
| countLabel | string | yes | Count label |
| statuses | { key: string; label: string }[] | yes | Status map |

```svelte
<StatusLegendPanel
  title="Status Legend"
  subtitle="Only one attention color. Text always explains state."
  countLabel="8 states"
  statuses={[{ key: 'queued', label: 'Queued' }, { key: 'needs-review', label: 'Needs Review' }]}
/>
```

### FileListPanel

Purpose: File list with selection behavior and per-row state badges.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Section title |
| subtitle | string | yes | Supporting text |
| files | FileItem[] | yes | List of files |
| selectedId | number \| undefined | yes | Active file id |
| statusLabels | Record<FileStatus, string> | yes | Label map |
| onSelect | (file: FileItem) => void | no | Selection handler |

```svelte
<FileListPanel
  title="Files"
  subtitle="Select a file to preview overrides and human context."
  files={files}
  selectedId={selectedId}
  statusLabels={statusLabels}
  onSelect={(file) => (selectedId = file.id)}
/>
```

### BatchIntentPanel

Purpose: Human intent block with structured defaults and tags.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Panel title |
| heading | string | no | Defaults to session heading |
| description | string | yes | Supporting text |
| fields | { label: string; value: string }[] | yes | Structured fields |
| tags | string[] | yes | Tag list |
| tagsLabel | string | no | Defaults to “Tags” |

```svelte
<BatchIntentPanel
  title="Batch Intent"
  description="Scanned newspaper issues from 1971. Human notes drive all pipelines."
  fields={[{ label: 'Primary language', value: 'Persian' }]}
  tags={['Tehran', 'Cultural review']}
  tagsLabel="Tags"
  heading="NoorMags Issue 76-79"
/>
```

### FileOverridePanel

Purpose: Per-file override block with pipeline badges and human notes.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Panel title |
| subtitle | string | yes | Supporting text |
| fields | { label: string; value: string }[] | yes | Override fields |
| badges | { label: string; tone: 'system' \| 'attention' }[] | yes | Tone-driven chips |
| note | string | yes | Human note |

```svelte
<FileOverridePanel
  title="Per-file Overrides"
  subtitle="Overrides for the selected file take precedence over batch defaults."
  fields={[{ label: 'Language', value: 'Persian' }]}
  badges={[
    { label: 'Layout OCR', tone: 'system' },
    { label: 'Image tagging', tone: 'system' },
    { label: 'Needs human review', tone: 'attention' }
  ]}
  note="Note: Page 1 has hand annotations. Preserve margins during OCR."
/>
```
