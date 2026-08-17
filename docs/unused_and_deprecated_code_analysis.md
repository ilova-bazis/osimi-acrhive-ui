# Unused and Deprecated Code Analysis

This document provides a comprehensive audit of the Osimi Archive UI codebase, identifying files, components, services, and specific code blocks that are no longer used, deprecated, or leftovers from prototyping phases.

---

## 1. 100% Dead Components (Completely Unused)
These components are present in `src/lib/components` but are never imported or referenced anywhere in the `src/` directory. They can be safely deleted immediately.

### [Segmented.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/Segmented.svelte)
- **Path**: `src/lib/components/Segmented.svelte`
- **Status**: 100% Dead
- **Comment/Rationale**: This component was defined during the initial mockup phase but has no import statements in any active Svelte files within the `src/` directory.
- [OpenCode fact-check] Confirmed for `src/`: no imports or references to `src/lib/components/Segmented.svelte` were found in active source. It is still referenced in `docs/components.md` and separately mirrored as a JSX primitive under `new-proto/`, so deletion should also update documentation if the documented component catalog is meant to stay accurate.

### [StripedPlaceholder.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/StripedPlaceholder.svelte)
- **Path**: `src/lib/components/StripedPlaceholder.svelte`
- **Status**: 100% Dead
- **Comment/Rationale**: A placeholder styling component defined early on that is never imported or utilized in the current Svelte application source.
- [OpenCode fact-check] Confirmed for `src/`: no imports or references to `src/lib/components/StripedPlaceholder.svelte` were found in active source. It is still documented in `docs/components.md` and has a separate JSX analogue in `new-proto/`.

---

## 2. Prototype-Only Components & Utilities
These files are only imported or used by files under `src/routes/prototype/` or in the component showcase pages under `src/routes/components/`. If the prototype routes are removed, all of these files can be deleted.
- [OpenCode fact-check] Mostly accurate, but the cleanup condition is incomplete: these files are also used by `/components/...` showcase routes. They are safe to delete only if both the prototype routes and the relevant component showcase routes/docs are removed or updated.

### Showcase & Prototype Component Leftovers
These components were created for design demos but are completely unused in the main ingestions and catalog pages.
- **`src/lib/components/DropzonePanel.svelte`**: Only imported in the `/components/dropzone-panel` showcase and `/prototype` dashboard.
- **`src/lib/components/FileListPanel.svelte`**: Only imported in the `/components/file-list-panel` showcase and `/prototype` dashboard.
- **`src/lib/components/FileOverridePanel.svelte`**: Only imported in the `/components/file-override-panel` showcase and `/prototype` dashboard.
- **`src/lib/components/FileRow.svelte`**: Only imported by `FileListPanel.svelte` (which itself is prototype-only).
- **`src/lib/components/StatusLegendPanel.svelte`**: Only imported in the `/components/status-legend-panel` showcase and `/prototype` dashboard.
- [OpenCode fact-check] Confirmed with one wording correction: `FileListPanel.svelte` is not strictly prototype-only because it is also imported by the `/components/file-list-panel` showcase. `FileRow.svelte` is only reachable through `FileListPanel.svelte`.

### [object-view-alt/](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-view-alt) Component Folder
This folder contains alternative viewing layouts developed for the UX prototypes.
- **`src/lib/components/object-view-alt/AltAudioViewer.svelte`**
- **`src/lib/components/object-view-alt/AltDocumentViewer.svelte`**
- **`src/lib/components/object-view-alt/AltImageViewer.svelte`**
- **`src/lib/components/object-view-alt/AltObjectInfoSheet.svelte`**
- **`src/lib/components/object-view-alt/AltObjectTopBar.svelte`**
- **`src/lib/components/object-view-alt/AltVideoViewer.svelte`**
- > **Exception**: [AltMediaRequestBanner.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-view-alt/AltMediaRequestBanner.svelte) in this folder **IS actively used** by the production [ObjectViewerCanvas.svelte](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-detail/ObjectViewerCanvas.svelte). If cleaning up this directory, keep `AltMediaRequestBanner.svelte` or relocate it.
- [OpenCode fact-check] Confirmed. The listed `Alt*Viewer` and sheet/top-bar components are imported by `src/routes/prototype/alternative/...` only. `AltMediaRequestBanner.svelte` is actively imported by `src/lib/components/object-detail/ObjectViewerCanvas.svelte`; it is also used internally by the alt viewers.

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
- [OpenCode fact-check] Mostly confirmed, with dependency nuance. `ObjectEditDetails.svelte` and `ObjectEditRights.svelte` are directly imported by a prototype alternative edit route. `ObjectEditLayout.svelte` is imported by the GLM prototype edit route and then imports `ObjectEditTopBar.svelte` and `ObjectEditPanel.svelte`; `ObjectEditPanel.svelte` imports `ObjectEditSourceText.svelte`, `ObjectEditTranscript.svelte`, `ObjectEditDetails.svelte`, and `ObjectEditRights.svelte`. `SourceTextDiff.svelte` is correctly identified as production-used by `src/routes/objects/[objectId]/edit/+page.svelte`.

### Prototype Mock Data & Seed Files
- **`src/lib/data/seed.ts`**: Only imported by `src/routes/prototype/+page.svelte` to populate sample mock batches.
- **`src/lib/ui/mapBatch.ts`**: Only imported by `src/routes/prototype/+page.svelte` to map batch items to component props.
- **`src/lib/objectView/mockEditData.ts`**: Contains types and mock definitions only used in the GLM / alternative prototypes and prototype components.
- **`src/lib/objectView/mockObjects.ts`**: Populates mock items for objects page reviews in prototype environments.
- > **Exception**: [types.ts](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/objectView/types.ts) in the `src/lib/objectView/` directory **IS actively used** by the active production viewers under `src/lib/components/object-view/`.
- [OpenCode fact-check] Partially confirmed. `seed.ts` and `mapBatch.ts` are only used by `src/routes/prototype/+page.svelte`. `mockObjects.ts` is only used by prototype object routes. `mockEditData.ts` is used by prototype routes and also by `src/lib/components/object-edit/*`; those components are themselves prototype-only except `SourceTextDiff.svelte`, which does not import `mockEditData.ts`. The `types.ts` exception is correct and production-used by active object viewers.

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

- [OpenCode fact-check] Confirmed. `src/lib/services/index.ts` exports API-backed services only, and repo-wide search found no active imports of these mock services. `mockDashboardService.ts` is mentioned in `docs/components.md`; `mockObjectsService.ts` is mentioned in `AGENTS.md` and `CLAUDE.md`.

---

## 4. Legacy Prototyping Directories
These are root directories and old prototype routes that can be safely deprecated and archived/removed when UI design exercises are fully concluded.

### [`new-proto/`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/new-proto) (Root Directory)
- **Path**: `/home/bazis/coding/projects/osimi-archive/osimi-archive-ui/new-proto`
- **Comment/Rationale**: A legacy static directory containing 9 React-like JSX files, static HTML, and tokens. This was the initial design mockup created prior to building the SvelteKit application. It has no integration with SvelteKit.
- [OpenCode fact-check] Directionally confirmed, but the file count is inaccurate: current `new-proto/` contains 7 `.jsx` files plus `index.html` and `tokens.css`. No integration references from the SvelteKit app were found.

### [`proto.html`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/proto.html) (Root File)
- **Path**: `/home/bazis/coding/projects/osimi-archive/osimi-archive-ui/proto.html`
- **Comment/Rationale**: A single-file HTML prototype for initial visual previews. Completely isolated from the main app.
- [OpenCode fact-check] Confirmed. Repo search found no active references to `proto.html` outside this report.

### [`src/routes/prototype/`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/prototype) (Routes Directory)
- **Path**: `src/routes/prototype/`
- **Comment/Rationale**: Houses mockup routes (`alternative`, `glm`, `objects`, `+page.svelte`). These are bypassed in production and are excluded from auth/server hooks.
- [OpenCode fact-check] Mostly confirmed. The directory contains those prototype routes and `hooks.server.ts` marks `/prototype` and `/prototype/*` as public. Whether they are “bypassed in production” depends on deployment/routing policy; SvelteKit will still include routable files unless excluded by build/deploy config.

### [`src/routes/ingestion-proto/`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/ingestion-proto) (Routes Directory)
- **Path**: `src/routes/ingestion-proto/`
- **Comment/Rationale**: Old mockup route for multi-step file ingestion flow, now successfully implemented as the fully functional, API-backed production route `src/routes/ingestion/[batchId]/setup`.
- [OpenCode fact-check] Confirmed as a legacy route by code shape and lack of inbound references, but note an auth nuance: `src/routes/+layout.svelte` treats `/ingestion-proto` as public for sidebar display, while `src/hooks.server.ts` does not mark it public, so unauthenticated users are still redirected to `/login`.

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
- [OpenCode fact-check] Confirmed. Current lines are 161 and 168, and `npm run lint` reports both `activeObjectLabel` and `activeObjectMeta` as unused.

2. **Unused Grouping & Selection Helpers (Lines 687 - 762)**
   ```typescript
   687:     const toggleSelection = (id: number) => { ... };
   702:     const setActiveGroup = (groupId: string) => { ... };
   724:     const groupSelectedFiles = () => { ... };
   750:     const splitSelectedFiles = () => { ... };
   ```
   * **Comment**: These functions represent an older local-only state machine. They are entirely duplicated by newer, used functions like `toggleFileSelection` (line 2507).
- [OpenCode fact-check] Confirmed. `npm run lint` reports `toggleSelection`, `setActiveGroup`, `groupSelectedFiles`, and `splitSelectedFiles` as unused. `setActiveFile` in the same area is still used by the upload/drop flow, so only the named helpers should be removed.

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
- [OpenCode fact-check] Confirmed for the listed handlers. `npm run lint` reports all listed `onFileRow*` and `onGroupRow*` handlers as unused. Some shared state/helpers from this area are still used by the Step 1 DnD implementation, such as `listDragTargetGroupId`, `addFileToGroup`, and `reorderWithinGroup`, so removal should be surgical.

4. **Unused Group Creation and Upload Helpers (Lines 2408 & 2545)**
   ```typescript
   2408:    const retryUpload = (fileId: number) => { ... };
   2545:    const createNewGroup = () => { ... };
   ```
   * **Comment**: These two state manipulation helpers are defined but never bound to any interactive buttons or event handlers.
- [OpenCode fact-check] Confirmed. Current lines are 2414 and 2543, and `npm run lint` reports both `retryUpload` and `createNewGroup` as unused.

5. **Lint-Triggering Patterns**
   - **Line 2230**: `const { [id]: _pf, ...restFailed } = previewFailed;`
     * *Comment*: Extracting `_pf` is a standard destructuring pattern to delete a key from an object, but it triggers the TypeScript unused variable warning.
   - **Line 3063**: `onDragLeave={(_e: DragEvent) => onStep1GroupDragLeave(group.id)}`
     * *Comment*: Receives an unused `_e` event parameter. Can be simplified to `onDragLeave={() => onStep1GroupDragLeave(group.id)}`.
- [OpenCode fact-check] First bullet is stale/inaccurate for current code. The current destructuring pattern is `const { [fileId]: _unused, ...rest } = previewUrls;` around line 2478 and it has an inline eslint disable; `npm run lint` does not report it. The second bullet is confirmed: current line 3061 reports `_e` as unused and can be simplified.

---

### [`src/routes/+layout.svelte`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/routes/+layout.svelte)
- **Line 6**: `import { session, setSession } from '$lib/auth/session';`
- **Comment/Rationale**: The `session` variable is imported but never referenced in the layout script or markup. Only `setSession` is used inside the `$effect` on line 25.
- [OpenCode fact-check] Confirmed. `npm run lint` reports `session` as unused in `src/routes/+layout.svelte`.

---

### [`src/lib/components/ObjectMetadataPanel.svelte`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/ObjectMetadataPanel.svelte)
- **Line 65**: `objectKey; // track objectKey changes`
- **Comment/Rationale**: This statement exists inside a Svelte `$effect` to register `objectKey` as a dependency since the rest of the effect is wrapped in Svelte's `untrack()`.
- **Recommendation**: Although functionally significant for dependency tracking in Svelte 5, writing a bare variable reference triggers TypeScript/ESLint's `no-unused-expressions`. This can be rewriten as `const _ = objectKey;` or similar to satisfy ESLint without altering behavior.
- [OpenCode fact-check] Confirmed. `npm run lint` reports `@typescript-eslint/no-unused-expressions` here. The recommended `const _ = objectKey;` may itself trigger `no-unused-vars`; a safer rewrite is to pass the key into a tiny helper or use a named void expression with an eslint-accepted pattern only after checking the active lint config.

---

### [`src/lib/components/object-view-alt/AltAudioViewer.svelte`](file:///home/bazis/coding/projects/osimi-archive/osimi-archive-ui/src/lib/components/object-view-alt/AltAudioViewer.svelte)
- **Line 111**: `{#each waveform as _, index (`bar-${index}`)}`
- **Comment/Rationale**: An unused `_` parameter inside the each block loop. Can be simplified/ignored depending on configuration, but triggers `@typescript-eslint/no-unused-vars` under strict setups.
- [OpenCode fact-check] Confirmed. `npm run lint` reports `_` as unused at this line.
> Historical analysis: prototype routes and the prototype-only object view/edit stacks discussed here have been removed. See `docs/prototype-production-boundary.md` for the current enforced boundary.
