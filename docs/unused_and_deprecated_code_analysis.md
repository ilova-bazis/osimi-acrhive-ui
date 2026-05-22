# Unused and Deprecated Code Analysis

This document provides a comprehensive audit of the Osimi Archive UI codebase, identifying files, components, services, and specific code blocks that are no longer used, deprecated, or leftovers from prototyping phases.

---

## 1. 100% Dead Components (Completely Unused)
These components are present in `src/lib/components` but are never imported or referenced anywhere in the `src/` directory. They can be safely deleted immediately.

### [Segmented.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/Segmented.svelte)
- **Path**: `src/lib/components/Segmented.svelte`
- **Status**: 100% Dead
- **Comment/Rationale**: This component was defined during the initial mockup phase but has no import statements in any active Svelte files within the `src/` directory.

### [StripedPlaceholder.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/StripedPlaceholder.svelte)
- **Path**: `src/lib/components/StripedPlaceholder.svelte`
- **Status**: 100% Dead
- **Comment/Rationale**: A placeholder styling component defined early on that is never imported or utilized in the current Svelte application source.

---

## 2. Prototype-Only Components & Utilities
These files are only imported or used by files under `src/routes/prototype/` or in the component showcase pages under `src/routes/components/`. If the prototype routes are removed, all of these files can be deleted.

### Showcase & Prototype Component Leftovers
These components were created for design demos but are completely unused in the main ingestions and catalog pages.
- **`src/lib/components/DropzonePanel.svelte`**: Only imported in the `/components/dropzone-panel` showcase and `/prototype` dashboard.
- **`src/lib/components/FileListPanel.svelte`**: Only imported in the `/components/file-list-panel` showcase and `/prototype` dashboard.
- **`src/lib/components/FileOverridePanel.svelte`**: Only imported in the `/components/file-override-panel` showcase and `/prototype` dashboard.
- **`src/lib/components/FileRow.svelte`**: Only imported by `FileListPanel.svelte` (which itself is prototype-only).
- **`src/lib/components/StatusLegendPanel.svelte`**: Only imported in the `/components/status-legend-panel` showcase and `/prototype` dashboard.

### [object-view-alt/](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-view-alt) Component Folder
This folder contains alternative viewing layouts developed for the UX prototypes.
- **`src/lib/components/object-view-alt/AltAudioViewer.svelte`**
- **`src/lib/components/object-view-alt/AltDocumentViewer.svelte`**
- **`src/lib/components/object-view-alt/AltImageViewer.svelte`**
- **`src/lib/components/object-view-alt/AltObjectInfoSheet.svelte`**
- **`src/lib/components/object-view-alt/AltObjectTopBar.svelte`**
- **`src/lib/components/object-view-alt/AltVideoViewer.svelte`**
- > **Exception**: [AltMediaRequestBanner.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-view-alt/AltMediaRequestBanner.svelte) in this folder **IS actively used** by the production [ObjectViewerCanvas.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-detail/ObjectViewerCanvas.svelte). If cleaning up this directory, keep `AltMediaRequestBanner.svelte` or relocate it.

### [object-edit/](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-edit) Component Folder
This folder contains Svelte components for object metadata and curation editing.
- **`src/lib/components/object-edit/ObjectEditDetails.svelte`**
- **`src/lib/components/object-edit/ObjectEditLayout.svelte`**
- **`src/lib/components/object-edit/ObjectEditPanel.svelte`**
- **`src/lib/components/object-edit/ObjectEditRights.svelte`**
- **`src/lib/components/object-edit/ObjectEditSourceText.svelte`**
- **`src/lib/components/object-edit/ObjectEditTopBar.svelte`**
- **`src/lib/components/object-edit/ObjectEditTranscript.svelte`**
- > **Exception**: [SourceTextDiff.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-edit/SourceTextDiff.svelte) in this folder **IS actively used** by the production objects edit page at [routes/objects/[objectId]/edit/+page.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/objects/%5BobjectId%5D/edit/+page.svelte).

### Prototype Mock Data & Seed Files
- **`src/lib/data/seed.ts`**: Only imported by `src/routes/prototype/+page.svelte` to populate sample mock batches.
- **`src/lib/ui/mapBatch.ts`**: Only imported by `src/routes/prototype/+page.svelte` to map batch items to component props.
- **`src/lib/objectView/mockEditData.ts`**: Contains types and mock definitions only used in the GLM / alternative prototypes and prototype components.
- **`src/lib/objectView/mockObjects.ts`**: Populates mock items for objects page reviews in prototype environments.
- > **Exception**: [types.ts](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/objectView/types.ts) in the `src/lib/objectView/` directory **IS actively used** by the active production viewers under `src/lib/components/object-view/`.

---

## 3. Unused Mock Services
As part of the service architecture, mock services were created matching their corresponding API services. However, the system currently exports **only** API services from `src/lib/services/index.ts`. No unit, browser, or server tests use these mock files, making them completely dead code.

| Mock Service File | Status | Comment / Rationale |
| :--- | :--- | :--- |
| [`src/lib/services/mockArchiveRequestsService.ts`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/services/mockArchiveRequestsService.ts) | Unused | Only referenced internally within its own file. |
| [`src/lib/services/mockDashboardService.ts`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/services/mockDashboardService.ts) | Unused | Only referenced internally and in component documentation markdown. |
| [`src/lib/services/mockIngestionNewService.ts`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/services/mockIngestionNewService.ts) | Unused | Only referenced internally. |
| [`src/lib/services/mockIngestionOverviewService.ts`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/services/mockIngestionOverviewService.ts) | Unused | Only referenced internally. |
| [`src/lib/services/mockIngestionSetupService.ts`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/services/mockIngestionSetupService.ts) | Unused | Only referenced internally. |
| [`src/lib/services/mockObjectsService.ts`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/services/mockObjectsService.ts) | Unused | Referenced only in agent guidance files (`AGENTS.md` and `CLAUDE.md`) as code structure examples. |

---

## 4. Legacy Prototyping Directories
These are root directories and old prototype routes that can be safely deprecated and archived/removed when UI design exercises are fully concluded.

### [`new-proto/`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/new-proto) (Root Directory)
- **Path**: `/home/bazis/coding/projects/osimi-archive/osimi-archive-ui/new-proto`
- **Comment/Rationale**: A legacy static directory containing 9 React-like JSX files, static HTML, and tokens. This was the initial design mockup created prior to building the SvelteKit application. It has no integration with SvelteKit.

### [`proto.html`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/proto.html) (Root File)
- **Path**: `/home/bazis/coding/projects/osimi-archive/osimi-archive-ui/proto.html`
- **Comment/Rationale**: A single-file HTML prototype for initial visual previews. Completely isolated from the main app.

### [`src/routes/prototype/`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/prototype) (Routes Directory)
- **Path**: `src/routes/prototype/`
- **Comment/Rationale**: Houses mockup routes (`alternative`, `glm`, `objects`, `+page.svelte`). These are bypassed in production and are excluded from auth/server hooks.

### [`src/routes/ingestion-proto/`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/ingestion-proto) (Routes Directory)
- **Path**: `src/routes/ingestion-proto/`
- **Comment/Rationale**: Old mockup route for multi-step file ingestion flow, now successfully implemented as the fully functional, API-backed production route `src/routes/ingestion/[batchId]/setup`.

---

## 5. Unused Code Blocks in Active Files

### [`src/routes/ingestion/[batchId]/setup/+page.svelte`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/ingestion/%5BbatchId%5D/setup/+page.svelte)
This is a large file (4,542 lines) containing significant chunks of dead or duplicate mockup code that was bypassed during implementation.

1. **Unused Derived Values (Lines 162 & 169)**
   ```typescript
   162:     const activeObjectLabel = $derived<string>(...);
   169:     const activeObjectMeta = $derived<ObjectItemMetadata>(...);
   ```
   * **Comment**: Both variables are calculated reactively but never read or rendered.

2. **Unused Grouping & Selection Helpers (Lines 687 - 762)**
   ```typescript
   687:     const toggleSelection = (id: number) => { ... };
   702:     const setActiveGroup = (groupId: string) => { ... };
   724:     const groupSelectedFiles = () => { ... };
   750:     const splitSelectedFiles = () => { ... };
   ```
   * **Comment**: These functions represent an older local-only state machine. They are entirely duplicated by newer, used functions like `toggleFileSelection` (line 2507).

3. **Unused List Drag-and-Drop Handlers (Lines 968 - 1107)**
   ```typescript
   968:     const onFileRowDragStart = (event: DragEvent, fileId: number) => { ... };
   1018:    const onFileRowDragEnd = () => { ... };
   1024:    const onFileRowDragOver = (event: DragEvent, fileId: number) => { ... };
   1039:    const onFileRowDragLeave = (event: DragEvent) => { ... };
   1050:    const onFileRowDrop = (event: DragEvent, targetFileId: number) => { ... };
   1072:    const onGroupRowDragOver = (event: DragEvent, groupId: string) => { ... };
   1087:    const onGroupRowDragLeave = (event: DragEvent) => { ... };
   1097:    const onGroupRowDrop = (event: DragEvent, groupId: string) => { ... };
   ```
   * **Comment**: These list drag-and-drop event handlers are completely dead. They were superseded by the `onStep1File...` and `onStep1Group...` drag-and-drop handlers (line 2577 onward), which are the ones bound to active markup.

4. **Unused Group Creation and Upload Helpers (Lines 2408 & 2545)**
   ```typescript
   2408:    const retryUpload = (fileId: number) => { ... };
   2545:    const createNewGroup = () => { ... };
   ```
   * **Comment**: These two state manipulation helpers are defined but never bound to any interactive buttons or event handlers.

5. **Lint-Triggering Patterns**
   - **Line 2230**: `const { [id]: _pf, ...restFailed } = previewFailed;`
     * *Comment*: Extracting `_pf` is a standard destructuring pattern to delete a key from an object, but it triggers the TypeScript unused variable warning.
   - **Line 3063**: `onDragLeave={(_e: DragEvent) => onStep1GroupDragLeave(group.id)}`
     * *Comment*: Receives an unused `_e` event parameter. Can be simplified to `onDragLeave={() => onStep1GroupDragLeave(group.id)}`.

---

### [`src/routes/+layout.svelte`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/+layout.svelte)
- **Line 6**: `import { session, setSession } from '$lib/auth/session';`
- **Comment/Rationale**: The `session` variable is imported but never referenced in the layout script or markup. Only `setSession` is used inside the `$effect` on line 25.

---

### [`src/lib/components/ObjectMetadataPanel.svelte`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/ObjectMetadataPanel.svelte)
- **Line 65**: `objectKey; // track objectKey changes`
- **Comment/Rationale**: This statement exists inside a Svelte `$effect` to register `objectKey` as a dependency since the rest of the effect is wrapped in Svelte's `untrack()`.
- **Recommendation**: Although functionally significant for dependency tracking in Svelte 5, writing a bare variable reference triggers TypeScript/ESLint's `no-unused-expressions`. This can be rewriten as `const _ = objectKey;` or similar to satisfy ESLint without altering behavior.

---

### [`src/lib/components/object-view-alt/AltAudioViewer.svelte`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-view-alt/AltAudioViewer.svelte)
- **Line 111**: `{#each waveform as _, index (`bar-${index}`)}`
- **Comment/Rationale**: An unused `_` parameter inside the each block loop. Can be simplified/ignored depending on configuration, but triggers `@typescript-eslint/no-unused-vars` under strict setups.
