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

Purpose: Former global authenticated top header used before the v2 sidebar layout. It is no longer rendered by any production route. It has been superseded by `AppSidebar` (desktop), `AppMobileHeader` (mobile), and the authenticated desktop utility row, which together own navigation, user profile, logout, and language selection. Kept for reference only; do not wire it back into the route graph.

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
| batchTitle | string | yes | Effective item-title default used as the title placeholder |
| batchTags | string[] | yes | Batch tags shown as read-only hint chips |
| batchDate | `{ value: string \| null; approximate: boolean } \| null` | yes | Publication-date default cue and fallback when the user selects "No date" |
| batchDescription | string | yes | Default used as the description placeholder |
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
  batchTitle={batchDefaults.title.trim() || batchId}
  batchTags={summaryTags}
  batchDate={effectivePublicationDate}
  batchDescription={batchDefaults.summaryText}
  onMetadataChange={(patch) => setObjectMeta(activeObjectKey, patch)}
  onFilePreview={(fileId) => openPreviewGallery(group.fileIds, Number(fileId))}
  onCheckPreviewAgain={(fileId) => checkPreviewAgain(Number(fileId))}
/>
```

**Localization contract:**

- All stable panel copy (required hints, placeholder text, removal controls, people-edit tooltip) comes from the `ingestionSetup.objectMetadata.fields.*` dictionary and retranslates when the locale changes.
- Value-bearing removal controls use localized templates with the removed value interpolated: `ingestionSetup.objectMetadata.fields.removeTag` (`Remove tag {tag}`) and `removePerson` (`Remove person {person}`). The visible chip text itself is user content and stays raw.
- Placeholders fall back to the batch values first (user content) and to localized dictionary placeholders otherwise (`ingestionSetup.objectMetadata.titlePlaceholder`, `summaryPlaceholder`).
- Parent `metadata.date` prop updates dynamically sync to internal date state so prefilled publication date defaults reflect immediately.
- `batchDate` is a publication-date default cue, not live inheritance. Selecting "No date" restores that concrete default when one exists; otherwise the panel emits an explicit null date.
- `YYYY` is a technical date token, not UI copy; it is only ever used as an input placeholder when no batch date exists.

## Ingestion Setup Cards (Step 2: Metadata)

In Step 2 of ingestion setup, the former unified Batch Intent panel is split into three separate semantic cards:

1. **Card A (Item Metadata Defaults)**: Contains fields that act as defaults for items in the batch:
   - Identification (`coreMetadata`): Title and Language batch defaults.
   - Description and tags (`summaryContext`): Batch-level tags and summary description defaults.
   - Publication date: Precision-aware publication date prefill (`summaryDateEditors.published`).
   - Single-object UX: When the batch contains exactly one object, Card A starts collapsed with an "Edit defaults" / "Hide defaults" toggle and helper hint.
2. **Card B (Batch Record Context)**: Contains metadata describing the batch record itself rather than individual items:
   - Creation date (`summaryDateEditors.created`): Always visible across single- and multi-object batches.
3. **Card C (Processing and Access Policies)**: Contains ingestion processing and visibility policies:
   - Processing policies: Item Kind, Classification Type, and Pipeline Preset selector with capability and compatibility validation.
   - Access policies: Access level (`private`, `family`, `public`), embargo datetime, rights note, and sensitivity note. Open initially and always visible.

## Item Defaults Badges

Object cards in Step 2 render inheritance state pills evaluated against the 4 default-applicable fields (Title, Description, Tags, Publication Date):

- `Matches defaults` (`matches-defaults`): All present default fields match the object metadata.
- `Some customized` (`mixed`): Some fields match the batch defaults while others have been customized.
- `Customized` (`customized`): None of the default-applicable fields match the batch defaults.
- Hidden (`null`): When no applicable batch defaults are set.

These labels are value-relative snapshots, not provenance. They compare the current editor values with the current effective defaults and do not indicate whether a user authored a value or whether it remains synchronized with later default changes.

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
| `deferred` | Static video icon and "Video preview unavailable"; no spinner | None |
| `check-timeout` | Burnt Peach attention treatment | Check again |
| `failed` | Burnt Peach attention treatment, terminal | None |
| `purged` | Neutral unavailable state | None |
| `unsupported` | File-kind icon and "No visual preview" | None |

## IngestionPreviewOverlay

Modal object-scoped gallery for previewing ingestion files. Built on `BaseDialog` with a full-viewport container and a dark blurred backdrop, so modality, background inertness, scroll locking, and focus containment come from the shared primitive. Focus enters on Close, Escape flows through `onClose`, and focus returns to the invoking tile after closing.

**Props:**

| Prop | Type | Required | Description |
| --- | --- | --- | --- |
| open | boolean | yes | Controlled open state |
| items | IngestionPreviewItem[] | yes | Object-scoped presentation model; single-item lists render in one-file mode without navigation or filmstrip |
| activeIndex | number | yes | Currently selected file index |
| onSelect | `(index: number) => void` | yes | Selection changes from buttons, filmstrip, or keyboard |
| onCheckAgain | `(fileId: string) => void` | no | Re-checks readiness for `check-timeout` previews |
| onClose | `() => void` | yes | Close request from button, Escape/cancel, or backdrop |

**Keyboard behavior:** `ArrowLeft`/`ArrowRight` move between files, `Home`/`End` jump to the first/last file, `Escape` closes through the shared dialog cancel path, and `Tab`/`Shift+Tab` stay within the modal. Navigation is clamped at the object boundaries.

**States:** the viewer renders explicit panels for `pending`, `deferred`, `check-timeout`, `failed`, `purged`, and `unsupported` previews, and a large image for `ready` files with a deterministic load-failure fallback. Retry is only ever presented as "Check again" and only for client-side readiness timeouts; backend-terminal `failed` previews are non-actionable until the backend offers preview regeneration. `deferred` is a frontend-only presentation state for pending videos: while no preview worker is deployed, setup does not poll video previews and instead shows a static video icon with "Video preview unavailable" copy, stating the uploaded video is unaffected. Ready video previews still render when the server reports them.

## Shell & Layout Components (v2 Sidebar Layout)

These components support the full-width persistent sidebar layout introduced in the UI/UX overhaul.

### AppSidebar

Purpose: Persistent 232px desktop sidebar (visible at `lg` and above) replacing the old top-bar. Renders brand mark, primary navigation, active batch progress, and user profile. Desktop language selection belongs to the shell-owned utility row, not the sidebar.

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

Placement:
- Authenticated desktop: Shell-owned top-right utility row (`.app-desktop-utility-row` in `src/routes/+layout.svelte`).
- Authenticated mobile: Header row in `src/lib/components/AppMobileHeader.svelte`.
- Public login: Top-right corner of the login card in `src/routes/login/+page.svelte`.

Behavior:

- Renders one native `button type="button"` per top-level translation dictionary locale; option labels are the uppercase locale codes. Adding a new dictionary locale automatically adds a selector option.
- Exposes selection through `aria-pressed` and a localized group name (`header.localeSelector`).
- Changing the locale updates the interface immediately and persists the preference under `localStorage['osimi-locale']`; see `docs/localization.md` for details.
- Selected/unselected treatment uses background and border contrast, never color alone, and preserves visible keyboard focus.

---

## Primitive Components (v2)

### BaseDialog

Purpose: Shared accessible modal primitive and the only production surface that calls `showModal()`. Owns a single-active modal coordinator, native background isolation, scroll locking, initial focus policy, focus containment via `focus-trap`, Escape handling, backdrop policy, and focus restoration. Every production modal or modal-like drawer is built on it: object resync and bulk-resync confirmations, the publication dialog, the object info drawer, the expanded support sheet, the ingestion preview overlay, the advanced filter drawer, the ingestion action confirmation, and the ingestion setup confirm/mismatch/abandon dialogs.

Implementation decision (UM-103): native `HTMLDialogElement.showModal()`. The `<dialog>` element stays mounted even when closed; content renders only while open. When a second dialog requests activation while one is modal, it is queued and activated when the first releases or unmounts. Native `close` events are reconciled so programmatic or form-driven closures cannot desynchronize the coordinator, scroll locks, or focus restoration. Sequential focus containment is delegated to the `focus-trap` package (runtime dependency) because native modal dialogs do not wrap Tab at dialog boundaries in Chromium; a custom tabbability model was evaluated and rejected after it misclassified contenteditable, embedded-content, image-map, media, positive-tabindex, and radio-group navigation. The trap is created on successful activation and deactivated on every release path (controlled close, unexpected native close, unmount), mirroring the coordinator lifecycle exactly.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| open | boolean | yes | Requested modal state |
| labelledBy | string? | one of `labelledBy`/`label` | IDs of the visible heading element(s) used as the accessible name |
| label | string? | one of `labelledBy`/`label` | Direct accessible label when no visible heading is appropriate |
| describedBy | string? | no | Optional descriptive text relationship |
| role | `'dialog' \| 'alertdialog'` | no | Defaults to `'dialog'` |
| closeOnBackdrop | boolean | no | Defaults to `true`; explicit outside-click policy |
| containerClass | string? | no | Position of the panel inside the full-viewport dialog (center, bottom sheet, right drawer, fullscreen) |
| panelClass | string? | no | Visible panel styling |
| backdropClass | string? | no | `::backdrop` styling |
| restoreFocus | `() => HTMLElement \| null` | no | Overrides the automatically captured opener; returning `null` skips BaseDialog focus entirely (the native close algorithm may still restore its own previously-focused element); required when the trigger is recreated by a state transition |
| onClose | `() => void` | yes | Requests closure from Escape, backdrop, and `requestClose()` before closing, so consumers may guard them; `dialog.close()` and `<form method="dialog">` closures are notifications after the fact |
| children | Snippet | yes | Modal content |

Behavior contract:

- Native modality makes background content inert for assistive technology and keyboard focus; tests assert background elements cannot receive focus while any modal is open.
- Scrolling is locked on `documentElement`, `body`, and the route scrollport (`data-modal-scroll-root` in `src/routes/+layout.svelte`); prior inline overflow values are restored exactly when the final modal closes.
- Initial focus: `showModal()` applies the browser's native focusing steps first; the `focus-trap` activation then honors a `data-dialog-initial-focus` marker when present and focusable, otherwise it preserves the native target (including native `autofocus`). A marker may carry `tabindex="-1"` to receive programmatic initial focus without becoming a sequential Tab stop. An invalid (hidden, disabled, or unfocusable) marker falls back to focus-trap's default policy: the current in-dialog focus — usually the native focusing result, including a later native `autofocus` target — is preserved, otherwise the first tabbable control receives focus. A dialog without tabbable content falls back to the dialog container, which therefore carries `tabindex="-1"` as the trap's required `fallbackFocus` (a deliberate deviation from the "no tabindex on dialog" guidance — `-1` keeps it out of sequential navigation).
- Focus containment: `focus-trap` owns Tab/Shift+Tab wrapping and ordering, including positive-tabindex ordering, checked radio groups, disabled fieldsets with the first-legend exception, closed-details content, inert/hidden candidates, and browser-inconsistent controls (`contenteditable`, media hosts). Bare `iframe`/`object`/`embed` hosts are not tabbable candidates; give embedded hosts an explicit `tabindex="0"` when they must be a deterministic trap stop. Iframe documents remain a known boundary: keyboard events inside a child document do not reach the parent trap, though native modal inertness still prevents background elements from taking focus. Media UA-shadow controls inside an `audio[controls]`/`video[controls]` host are treated as one stop. Image-map areas participate only where the browser and `tabbable` recognize a rendered map relationship.
- Consumer errors cannot corrupt coordinator progress: exceptions thrown by `restoreFocus()` or by `onClose()` during activation-failure notification are isolated, reported through `console.error`, and never prevent the queue from advancing or scroll/focus state from reconciling.
- Consumers needing deterministic initial focus should mark an ordinary button/input with `data-dialog-initial-focus`. Positive `tabindex` values work correctly but remain prohibited by project convention.
- Escape, backdrop interaction, and `requestClose()` only call `onClose()`; the dialog closes when the consumer actually flips `open` to `false`, so close guards (for example the publication dialog while submitting) cannot be bypassed.
- Unsolicited native closures (`dialog.close()` or submitting a `<form method="dialog">`) fire `close` only after the element has already closed, so they cannot be guarded. `BaseDialog` treats them as authoritative: it releases the coordinator slot, restores scroll locks and focus, activates any queued dialog, and calls `onClose()` exactly once — including when the consumer sets `open` to `false` before the queued `close` event is delivered. Reopening is deferred until that outstanding event has been consumed; a consumer that ignores the notification must cycle `open` through `false` before the instance can open again.
- If activation fails (`showModal()` throws or returns without opening, for example via a canceled `beforetoggle`), the failed dialog rolls back its temporary scroll lock and captured invoker, frees the coordinator slot, lets the next queued dialog activate, and then calls `onClose()` once. The consumer must set `open` to `false` before that instance can request another lifecycle.
- The backdrop uses pointer-down/pointer-up tracking: a drag that starts inside the panel never closes.
- Focus restores to the captured opener only when it is still connected; an unmounted opener is skipped without error.
- Unmounting while open releases the coordinator, restores overflow values, and lets a queued dialog activate.

```svelte
<BaseDialog open={showConfirm} labelledBy="confirm-title" onClose={() => (showConfirm = false)}>
	<h2 id="confirm-title">Confirm resync</h2>
	<button data-dialog-initial-focus type="button" onclick={() => (showConfirm = false)}>Close</button>
</BaseDialog>
```

### ObjectSupportSheet

Purpose: Bottom sheet for the object-detail route (Files / Access / Requests / Raw ingest). Three states:

- `hidden`: nothing rendered.
- `peek`: non-modal `<aside>`; does not lock scrolling or isolate the background.
- `expanded`: modal bottom sheet built on `BaseDialog` with the localized Support accessible name; Escape and backdrop close to `hidden`, the top handle collapses to `peek` and restores focus to the peek handle, and closing to `hidden` restores focus through `launcherFocus`.

Tabs contract: `role="tablist"` with `aria-orientation`, each tab has `role="tab"`, a stable `${idPrefix}-tab-<id>`, `aria-controls`, `aria-selected`, and roving `tabindex` (0 on the focused tab, -1 elsewhere). Every tab owns a persistent `role="tabpanel"` whose ID matches its `aria-controls` and whose `aria-labelledby` points back to the tab; inactive panels carry the `hidden` attribute and only the selected panel renders the consumer snippet, so every relationship resolves. A missing or invalid `activeTab` falls back to the first tab; an empty `tabs` array renders ordinary content without tab semantics and focuses the close button. Tab IDs must be unique. Roving focus is reset on every sheet-state transition (`hidden`/`peek`/`expanded`), so each expanded lifecycle initially focuses the selected tab; removing the focused or selected tab dynamically falls back to a remaining valid tab. Activation is manual: arrow keys, `Home`, and `End` move focus only; `Enter`, `Space`, or click activate. Arrow directions are orientation-sensitive and wrap. The active tab receives initial focus in the expanded state.

### ObjectDetailInfoDrawer

Purpose: Right-side modal information drawer for object detail. Built on `BaseDialog` with a right-aligned full-height container. The accessible name combines the localized kicker and the object title (`aria-labelledby`). The close button receives initial focus; Escape, backdrop, and the close button call `onClose`; the top-bar Info trigger receives focus back on close.

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

## SourceTextDiff

Purpose: Split-pane OCR curation editor (source vs. curated text) used by the production object-edit route.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| sourceLabel | string | no | Accessible name of the source region; default `'Auto-extracted'` (static English) |
| curatedLabel | string | no | Visible label of the curated textarea; default `'Curated'` (static English) |
| sourceText | string | yes | Machine-extracted source text (read-only) |
| curatedText | string | yes | Controlled curated value |
| onCuratedChange | (text: string) => void | yes | Reports input, copy, and reset outcomes |

Semantics contract:

- Source text renders as a named `role="region"` (`aria-labelledby` referencing the source label); it is static content, so it is deliberately not a read-only textbox.
- The curated field is a controlled `<textarea>` with a real visible `<label>`; the placeholder is guidance only, not the accessible name.
- All `id`/`for` relationships are generated per instance through `$props.id()`, so multiple mounted instances cannot collide.
- Default `sourceLabel`/`curatedLabel` values are static English and do not retranslate; production callers must pass reactive localized labels (the object-edit route supplies `t('objectEdit.diff.*')`).
- Internal controls (`Copy from source`, `Reset`) and the empty-source state follow the locale store and retranslate live.
- Copy reports the exact source text (including `''` for an empty source); Reset is rendered only while `curatedText` is non-empty and reports `''`.
- The optional confidence display was removed: no production contract or caller supplies it, so no percentage convention is defined.

### Object-edit precision controls

The publication-date precision selector on the object-edit route (`objects/[objectId]/edit/+page.svelte`) is a `role="group"` labelled by the visible "Date precision" text, containing native buttons with `aria-pressed` selected state. Keyboard behavior is native button behavior (Tab between options, Enter/Space to activate); arrow-key radiogroup navigation is intentionally not implemented. The publication-date input has a visible localized `<label>`, and validation errors are linked through `aria-invalid` plus `aria-describedby` targeting the `role="alert"` message. Selecting "No date" clears the date value and the approximate flag, removes the input and checkbox, and dismisses any now-inapplicable publication-date error — including the page-level "Check the highlighted fields" banner when no other field error remains. Dismissed errors return on the next action result.
