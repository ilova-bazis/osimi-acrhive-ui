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

### ObjectGroupRow

Purpose: Collapsible group card for the ingestion setup file list. Represents a set of files that will be ingested as a single archive object. Supports inline label editing, expand/collapse, drag-over highlight, and an ungroup action.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| groupId | string | yes | Local UUID for the group |
| label | string? | no | Editable human label; auto-set from first file name |
| fileCount | number | yes | Number of files in the group |
| collapsed | boolean | no | Defaults to false |
| dragOver | boolean | no | Highlights the card when a file is dragged over |
| onToggleCollapse | () => void | yes | |
| onUngroup | () => void | yes | Dissolves the group back to standalone files |
| onLabelChange | (label: string) => void | yes | Called when label is committed |
| onDragOver | (e: DragEvent) => void | yes | Forward to parent's group drag handler |
| onDragLeave | (e: DragEvent) => void | yes | |
| onDrop | (e: DragEvent) => void | yes | |
| children | snippet | no | File rows rendered inside the group when expanded |

```svelte
<ObjectGroupRow
  groupId={group.id}
  label={group.label}
  fileCount={group.fileIds.length}
  collapsed={collapsedGroups.has(group.id)}
  dragOver={listDragTargetGroupId === group.id}
  onToggleCollapse={() => toggleGroupCollapse(group.id)}
  onUngroup={() => ungroupFiles(group.id)}
  onLabelChange={(label) => renameGroup(group.id, label)}
  onDragOver={(e) => onGroupRowDragOver(e, group.id)}
  onDragLeave={onGroupRowDragLeave}
  onDrop={(e) => onGroupRowDrop(e, group.id)}
>
  {#each group.fileIds as fileId}
    {@render fileRow(files.find(f => f.id === fileId))}
  {/each}
</ObjectGroupRow>
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

## ObjectMetadataPanel

Per-object metadata editor shown in the right panel of the ingestion setup screen. Displays an empty state when nothing is selected, or a form with title, date, tags, description, and people fields when a file or group is active.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| objectKey | string \| null | yes | Key for the active object (`group.id` or `` `file:${localId}` ``); null = empty state |
| objectLabel | string | yes | Display name shown as context header |
| metadata | ObjectItemMetadata | yes | Current metadata values for the active object |
| batchTitle | string | yes | Placeholder for the title field |
| batchTags | string[] | yes | Batch tags shown as read-only hint chips |
| batchDate | `{ value: string \| null; approximate: boolean } \| null` | yes | Placeholder for the date field |
| batchDescription | string | yes | Placeholder for the description field |
| onMetadataChange | `(patch: Partial<ObjectItemMetadata>) => void` | yes | Called with a partial patch whenever a field changes |

```svelte
<ObjectMetadataPanel
  objectKey={activeObjectKey}
  objectLabel={activeObjectLabel}
  metadata={activeObjectMeta}
  batchTitle={batchDefaults.title}
  batchTags={summaryTags}
  batchDate={null}
  batchDescription={batchDefaults.summaryText}
  onMetadataChange={(patch) => setObjectMeta(activeObjectKey, patch)}
/>
```

## Object View Prototype Components

These read-only components power the object-view prototype at `src/routes/prototype/objects/[id]/+page.svelte`. They keep media presentation separate from metadata so a later edit mode can swap in editing workbenches without disturbing the viewing shell.

### ObjectTopBar

Minimal sticky header for object viewing with back navigation, status, info toggle, and view/edit mode affordance.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| backHref | string | yes | Back-link target for the prototype flow |
| title | string | yes | Truncated object title |
| status | `ObjectViewStatus` | yes | `READY`, `PROCESSING`, or `NEEDS_REVIEW` |
| reviewLabel | string | yes | Secondary read-only context line |
| onInfoToggle | () => void | yes | Opens the metadata drawer |

### ObjectInfoDrawer

Right-side metadata drawer that stays hidden by default and reveals read-only object information on demand.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| open | boolean | yes | Controls drawer visibility |
| metadata | `ObjectViewMetadata` | yes | Read-only title, dates, tags, rights, and descriptive fields |
| onClose | () => void | yes | Close handler for overlay and close button |

### DocumentViewer

Continuous page viewer for document objects with zoom controls, floating page indicator, lazy-loaded page images, and an optional read-only OCR overlay.

### ImageViewer

Media-first image canvas with dark presentation backdrop, zoom controls, and drag-to-pan inspection when zoomed.

### AudioViewer

Prototype audio player with waveform-style playback UI, progress indicator, and optional read-only transcript panel.

### VideoViewer

Prototype video player with poster canvas, playback timeline, captions toggle, and optional transcript reveal.

### ObjectMediaGate

Read-only access gate for object media that appears when the source file is not yet deliverable. It keeps preview artifacts visible while presenting request-required, request-pending, or unavailable states directly inside the media canvas.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| mediaType | `document` \\| `image` \\| `audio` \\| `video` | yes | Tunes the visual treatment to the media being requested |
| access | object | yes | Current request state, helper text, preview artifacts, and optional pending request metadata |
| onRequest | () => void | yes | Prototype callback used to simulate requesting source media |

---

## Shell & Layout Components (v2 Sidebar Layout)

These components support the full-width persistent sidebar layout introduced in the UI/UX overhaul.

### AppSidebar

Purpose: Persistent 232px sidebar replacing the old top-bar. Renders brand mark, primary navigation, active batch progress, and user profile.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| currentPath | string | yes | Used to compute active nav state |
| username | string | yes | Displayed in the user strip |
| role | string | yes | Shown beneath username |
| activeBatches | `{id, name, done, total, status}[]` | no | Drives the mini progress list; defaults to `[]` |
| onLogout | () => void | yes | Logout callback |

Nav uses `base` from `$app/paths` (not `resolve`) so dynamic string paths are safe.

---

## Primitive Components (v2)

### Icon

Purpose: Inline SVG icon set rendered via `{#if}` blocks. All icons share the same `stroke`, `fill: none` SVG defaults.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| name | string | yes | Icon identifier (see list below) |
| size | number | no | Width and height in px; default `16` |
| stroke | number | no | `stroke-width`; default `1.4` |

Available names: `archive`, `plus`, `search`, `arrow-r`, `arrow-l`, `check`, `x`, `upload`, `file`, `image`, `audio`, `video`, `book`, `manuscript`, `eye`, `pencil`, `trash`, `cog`, `chevron-r`, `chevron-d`, `info`, `warn`, `sparkle`, `lock`, `users`, `pages`, `clock`, `globe`, `folder`, `grip`.

**Note:** `Icon` does not forward extra props such as `class`. Wrap in a `<span>` to apply color utilities.

### Stepper

Purpose: Horizontal step indicator for multi-step flows. Completed steps are clickable to jump back.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| steps | `{id: string, label: string}[]` | yes | Step definitions |
| current | number | yes | Zero-based index of the active step |
| onJump | (index: number) => void | no | Called when a completed step bubble is clicked |

States: `done` (filled `bg-text-ink`, checkmark, clickable), `current` (`bg-burnt-peach`), `todo` (outline, opacity-45, non-interactive).

### ChoiceCard

Purpose: Toggle-style card button for pickers (kind, language, preset, visibility).

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Card label |
| selected | boolean | yes | Drives selected ring style |
| onclick | () => void | yes | Toggle handler |
| icon | string | no | Icon name (uses `Icon` component) |
| sub | string | no | Subtitle / description text |
| native | string | no | Native-script label (RTL-friendly) |
| badge | string | no | Optional badge text rendered via `Chip` |
| compact | boolean | no | Reduces padding for dense grids |
| disabled | boolean | no | Disables interaction; card dims via global `disabled:opacity-60` |

Uses `aria-pressed={selected}` and `type="button"`.

### Segmented

Purpose: Pill-style segmented control for switching between mutually exclusive options.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| options | `{id: string, label: string}[]` | yes | Option list |
| value | string | yes | Active option id |
| onchange | (id: string) => void | yes | Change handler |

### ThinProgress

Purpose: 2px progress bar for sidebar batch list and other compact contexts.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| value | number | yes | Completed count |
| total | number | yes | Total count |
| tone | `'ink' \| 'peach' \| 'sky'` | no | Fill color; default `'ink'` |

Track: `bg-alabaster-grey`. Fill colors: `ink` → `bg-blue-slate-deep`, `peach` → `bg-burnt-peach`, `sky` → `bg-blue-slate`. Width transitions at 400ms.

### StripedPlaceholder

Purpose: Dashed striped placeholder area for unloaded media previews.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| width | string | no | CSS width; default `'100%'` |
| height | number | no | Height in px; default `80` |
| label | string | no | Centered mono label text |

### Stamp

Purpose: Small inline status badge in burnt-peach mono style. Accepts a `children` snippet.

```svelte
<Stamp>Draft · not yet submitted</Stamp>
<Stamp>Ready to submit</Stamp>
```

### FootnoteBar

Purpose: Sticky bottom bar for multi-step flows. Holds back/forward navigation and step progress.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| left | snippet | no | Left slot — typically step counter + `Stepper` |
| right | snippet | no | Right slot — typically navigation buttons |

```svelte
<FootnoteBar>
  {#snippet left()}
    <span>Step 1 of 3</span>
    <Stepper steps={STEPS} current={0} />
  {/snippet}
  {#snippet right()}
    <a href="…">Cancel</a>
    <button type="submit" form="form-id">Continue</button>
  {/snippet}
</FootnoteBar>
```

**Note:** Submit buttons inside `FootnoteBar` that target a `<form>` elsewhere in the DOM must use the `form="form-id"` attribute pattern.
