# Prototype and Production Boundary

## Policy

Visual prototypes are reference material only. They must not be SvelteKit routes, compile into the production route manifest, or be imported by production code. Production routes and their transitive component trees must use production service contracts and production-owned components.

## Inventory

The audited prototype surface contained 62 files:

- 13 routes under `src/routes/prototype/**`
- 1 route under `src/routes/ingestion-proto/**`
- 11 component-gallery routes under `src/routes/components/**`
- 9 original object-view prototype components
- 7 alternative object-view prototype components
- 8 object-edit components
- 3 mock object-view data/type modules
- 8 gallery-only ingestion components
- 2 prototype seed/mapping modules

Sixty files are prototype/gallery-only. Two files were shared with production and had to be promoted before prototype removal:

| Existing file | Production consumer | Decision |
| --- | --- | --- |
| `src/lib/components/object-view-alt/AltMediaRequestBanner.svelte` | `ObjectViewerCanvas.svelte` | Move to the production `object-detail` namespace and remove the `Alt` name. |
| `src/lib/components/object-edit/SourceTextDiff.svelte` | archived-object edit page | Retain as a production-owned object-edit component. |

## Prototype-Only Source

The following groups are not production dependencies and must remain outside application aliases after removal:

- `src/routes/prototype/**`
- `src/routes/ingestion-proto/**`
- `src/routes/components/**`
- `src/lib/components/object-view/**`
- all of `src/lib/components/object-view-alt/**` except the promoted media-request banner
- all of `src/lib/components/object-edit/**` except `SourceTextDiff.svelte`
- `src/lib/objectView/mockObjects.ts`
- `src/lib/objectView/mockEditData.ts`
- `src/lib/objectView/types.ts`
- gallery-only ingestion components such as `DropzonePanel.svelte` and `FileListPanel.svelte`
- `src/lib/data/seed.ts`
- `src/lib/ui/mapBatch.ts`

The component-gallery routes are prototype presentation surfaces. Their demonstrated production components, including `BaseButton`, `Chip`, and `StatusBadge`, remain production-owned.

## Enforcement

- Production source must not contain `/prototype` or `/ingestion-proto` navigation targets.
- Production source must not import mock object-view data, prototype component namespaces, or any exact removed file in the centralized policy.
- A clean production route manifest must contain a nonempty route inventory and must not contain the exact `prototype`, `ingestion-proto`, or `components` path segments.
- Generated deployed and intermediate output must not contain removed source/module traces, `Prototype object not found.`, or `mockObjectViews`.
- Prototype reference files, when retained, live outside `src` and are not compiled or resolved by `$lib` aliases.

`scripts/route-boundary-policy.mjs` is the authoritative route/source/file inventory. `scripts/verify-route-boundary.mjs` consumes it for source and generated-artifact checks, while `eslint.config.js` consumes its import patterns. The import restrictions deliberately preserve the production-owned `src/lib/components/object-edit/SourceTextDiff.svelte` and `src/lib/components/object-detail/MediaRequestBanner.svelte`.

`npm run build` runs verification automatically. `npm run verify:route-boundary` can rerun it against an existing build; see `deployment-route-integrity.md` for its fail-closed artifact and manifest checks.
