# UI Components

This document describes reusable UI components used by production routes.

## Overview

- Components live in `src/lib/components`.
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

### AppHeader (Legacy)

Purpose: Former global authenticated top header used before the v2 sidebar layout. It is no longer rendered by any production route. It has been superseded by `AppSidebar` (desktop) and `AppMobileHeader` (mobile), which own the current navigation, user profile, logout, and language selection. Kept for reference only; do not wire it back into the route graph.

## UI Building Blocks

### BaseButton

Purpose: Primary/secondary CTA button styles aligned with the palette.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| variant | 'default' \| 'primary' \| 'secondary' \| 'ghost' \| 'peach' | no | Defaults to 'default' |
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

## ObjectMetadataPanel

Per-object metadata editor shown inside the expanded per-object metadata cards of the ingestion setup screen. Displays an empty state when nothing is selected, or the object file rail followed by a form with title, date, tags, description, and people fields when a file or group is active.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| objectKey | string \| null | yes | Key for the active object (`group.id` or `` `file:${localId}` ``); null = empty state |
| objectLabel | string | yes | Display name shown as context header |
| files | IngestionPreviewItem[] | no | Presentation model for every file of the active object; drives the object file rail |
| metadata | ObjectItemMetadata | yes | Current metadata values for the active object |
| batchTitle | string | yes | Placeholder for the title field |
| batchTags | string[] | yes | Batch tags shown as read-only hint chips |
| batchDate | `{ value: string \| null; approximate: boolean } \| null` | yes | Placeholder for the date field |
| batchDescription | string | yes | Placeholder for the description field |
| peopleEditable | boolean | no | Enables people editing; defaults to false |
| onMetadataChange | `(patch: Partial<ObjectItemMetadata>) => void` | yes | Called with a partial patch whenever a field changes |
| onFilePreview | `(fileId: string) => void` | yes | Opens the object-scoped preview gallery at the given file |
| onCheckPreviewAgain | `(fileId: string) => void` | no | Re-checks preview readiness after a client-side check timeout |

```svelte
<ObjectMetadataPanel
  objectKey={activeObjectKey}
  objectLabel={activeObjectLabel}
  files={panelFiles}
  metadata={activeObjectMeta}
  batchTitle={batchDefaults.title}
  batchTags={summaryTags}
  batchDate={null}
  batchDescription={batchDefaults.summaryText}
  onMetadataChange={(patch) => setObjectMeta(activeObjectKey, patch)}
  onFilePreview={(fileId) => openPreviewGallery(group.fileIds, Number(fileId))}
  onCheckPreviewAgain={(fileId) => checkPreviewAgain(Number(fileId))}
/>
```

**Localization contract:**

- All stable panel copy (required hints, placeholder text, removal controls, people-edit tooltip) comes from the `ingestionSetup.objectMetadata.fields.*` dictionary and retranslates when the locale changes.
- Value-bearing removal controls use localized templates with the removed value interpolated: `ingestionSetup.objectMetadata.fields.removeTag` (`Remove tag {tag}`) and `removePerson` (`Remove person {person}`). The visible chip text itself is user content and stays raw.
- Placeholders fall back to the batch values first (user content) and to localized dictionary placeholders otherwise.
- `YYYY` is a technical date token, not UI copy; it is only ever used as an input placeholder when no batch date exists.

## IngestionFilePreview

Horizontal, always-visible rail of every file belonging to one ingestion object. Replaces the former truncated thumbnail strip. Every tile is actionable and opens the preview gallery; no `+more` or expand/collapse controls exist. Files keep their source order and carry a sequence number, filename, size, and an explicit textual preview state. State is never communicated by color alone.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| files | IngestionPreviewItem[] | yes | Ordered presentation model for all files of the object |
| onPreview | `(fileId: string) => void` | yes | Opens the gallery for the clicked file |
| onCheckAgain | `(fileId: string) => void` | no | Offered only for `check-timeout` previews; absent for terminal backend failures |

**Preview states rendered:**

| State | Tile treatment | Secondary action |
| --- | --- | --- |
| `ready` | Image thumbnail; load failure falls back to an accessible unavailable state | None |
| `pending` | Pale Sky system state with reduced-motion-safe spinner | None |
| `check-timeout` | Burnt Peach attention treatment | Check again |
| `failed` | Burnt Peach attention treatment, terminal | None |
| `purged` | Neutral unavailable state | None |
| `unsupported` | File-kind icon and "No visual preview" | None |

## IngestionPreviewOverlay

Modal object-scoped gallery for previewing ingestion files. Built on a native `<dialog>` with `showModal()`, so modality, background inertness, and focus containment come from the browser. Focus enters on Close, Escape flows through the native `cancel` path, and focus returns to the invoking tile after closing.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| open | boolean | yes | Controlled open state |
| items | IngestionPreviewItem[] | yes | Object-scoped presentation model; single-item lists render in one-file mode without navigation or filmstrip |
| activeIndex | number | yes | Currently selected file index |
| onSelect | `(index: number) => void` | yes | Selection changes from buttons, filmstrip, or keyboard |
| onCheckAgain | `(fileId: string) => void` | no | Re-checks readiness for `check-timeout` previews |
| onClose | `() => void` | yes | Close request from button, Escape/cancel, or backdrop |

**Keyboard behavior:** `ArrowLeft`/`ArrowRight` move between files, `Home`/`End` jump to the first/last file, `Escape` closes through the dialog cancel path, and `Tab`/`Shift+Tab` stay within the modal. Navigation is clamped at the object boundaries.

**States:** the viewer renders explicit panels for `pending`, `check-timeout`, `failed`, `purged`, and `unsupported` previews, and a large image for `ready` files with a deterministic load-failure fallback. Retry is only ever presented as "Check again" and only for client-side readiness timeouts; backend-terminal `failed` previews are non-actionable until the backend offers preview regeneration.

## Shell & Layout Components (v2 Sidebar Layout)

These components support the full-width persistent sidebar layout introduced in the UI/UX overhaul.

### AppSidebar

Purpose: Persistent 232px desktop sidebar (visible at `lg` and above) replacing the old top-bar. Renders brand mark, primary navigation, active batch progress, language selection, and user profile.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| currentPath | string | yes | Used to compute active nav state |
| username | string | yes | Displayed in the user strip |
| role | string | yes | Shown beneath username |
| activeBatches | `{id, name, done, total, status}[]` | no | Drives the mini progress list; defaults to `[]` |
| onLogout | () => void | yes | Logout callback |

Behavior:

- Nav links use `resolve` from `$app/paths` with the shared destinations and route matching from `src/lib/navigation/appShell.ts`.
- The active link exposes `aria-current="page"` and primary navigation has a localized `aria-label` (`header.nav.primaryLabel`).
- All shell strings come from the translation dictionaries (`header.*` and `ingestionOverview.statuses.*`); unknown batch statuses fall back to the raw backend value.
- The icon-only logout button carries a localized `aria-label` and `title` (`header.signOut`); the adjacent brand logo is decorative (`alt=""`).
- Renders `LocaleSwitcher` so the whole shell follows the active locale without reload.

### AppMobileHeader

Purpose: Compact authenticated mobile header shown below the `lg` breakpoint, where the desktop sidebar is hidden. Closes the responsive-shell gap by providing brand identity, language selection, logout, and primary navigation.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| currentPath | string | yes | Used to compute active nav state |
| onLogout | () => void | yes | Logout callback |

Behavior:

- Uses the same shared destinations, route matching, and translation keys as `AppSidebar`.
- Primary navigation is a horizontally scrollable row; links remain keyboard reachable and the active link exposes `aria-current="page"`.
- Renders `LocaleSwitcher` and a localized icon-only logout button (`header.signOut`).
- Below `lg` it is a `shrink-0` row outside the authenticated route scrollport (see `docs/localization.md`); it must not cover page content or create page-level horizontal overflow. It is hidden at `lg` and above.

### LocaleSwitcher

Purpose: Reusable interface-language selector backed by the locale store.

Props: none. The component subscribes to `src/lib/i18n/locale.ts` directly and calls `locale.setLocale()` on selection.

Behavior:

- Renders one native `button type="button"` per top-level translation dictionary locale; option labels are the uppercase locale codes. Adding a new dictionary locale automatically adds a selector option.
- Exposes selection through `aria-pressed` and a localized group name (`header.localeSelector`).
- Changing the locale updates the interface immediately and persists the preference under `localStorage['osimi-locale']`; see `docs/localization.md` for details.
- Selected/unselected treatment uses background and border contrast, never color alone, and preserves visible keyboard focus.

---

## Primitive Components (v2)

### BaseDialog

Purpose: Shared accessible modal dialog. Provides `role="dialog"`, `aria-modal`, `aria-labelledby`, initial focus on the first focusable element (or the dialog itself), Escape close, Tab focus containment, click-outside close, and focus restoration to the trigger. Reused by the object-detail resync confirmation and the object-edit publish dialog.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| open | boolean | yes | Renders the dialog when true |
| labelledBy | string | yes | ID of the visible heading used as the accessible name |
| onClose | () => void | yes | Called on Escape, backdrop click, and should be wired to explicit close buttons |
| children | () => unknown | yes | Dialog content |

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

Purpose: Horizontal step indicator for multi-step flows. Completed steps are clickable only when an `onJump` handler is provided.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| steps | `{id: string, label: string}[]` | yes | Step definitions |
| current | number | yes | Zero-based index of the active step |
| onJump | (index: number) => void | no | Called when a completed step bubble is clicked |

States: `done` (filled `bg-text-ink`, checkmark, clickable only with `onJump`), `current` (`bg-burnt-peach`, `aria-current="step"`), `todo` (outline, opacity-45, non-interactive).

Localization contract:

- `steps[].label` is **consumer-supplied and must already be localized**. Production callers pass translated labels (`t(...)`) and the component does not translate them itself.
- Labels and the accessible name are fully reactive: when the active locale changes, the rendered step labels and the `aria-label` retranslate through the consumer's `$derived` dictionary.
- The accessible name is built from the localized `stepper.ariaLabel` template (`{label}, step {current} of {total}` in EN, localized in RU), so screen readers announce the localized step name, position, and total.
- The current step is exposed with `aria-current="step"`.

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

Track: `bg-alabaster-grey`. Fill colors: `ink` → `bg-blue-slate-deep`, `peach` → `bg-burnt-peach`, `sky` → `bg-blue-slate`. Width transitions at 400ms. Values are clamped into `0..total` and the track exposes `role="progressbar"` with bounded ARIA values.

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
| top | snippet | no | Centered status row above the main bar — long status messages |
| left | snippet | no | Left slot — typically step counter + `Stepper` |
| right | snippet | no | Right slot — typically navigation buttons |

```svelte
<FootnoteBar>
  {#snippet top()}
    <span>Title, date, and at least one tag are required for each object.</span>
  {/snippet}
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
