# Implementation Steps (V1)

This document tracks the agreed sequence for building the Osimi ingestion UI.

## Step 1 — Data Models (Full Spec)

- Add `src/lib/models.ts` with typed interfaces/types for:
  - `Batch`
  - `BatchDefaults`
  - `BatchItem`
  - `ItemOverrides`
  - `PipelineFlags`
  - `Visibility`
  - `ContentCategory`
  - `Language`
  - `PipelinePreset`
  - `FileState`
  - `ReviewSummary`
  - `PipelineStage`
- Language and content category are string unions.
- Keep `catalog.json` aligned exactly with backend expectations.

## Step 2 — Seed Data

- Add `src/lib/data/seed.ts` exporting a sample `Batch` with:
  - `title`, `description`, `defaults`
  - `items[]` with `overrides`, `notes`, `tags`, `status`
- Include a range of file states (queued, processing, needs review, etc.).

## Step 3 — UI Mapping Layer

- Add `src/lib/ui/mapBatch.ts` to map `Batch` → component props.
- Map statuses to localized labels using i18n.
- Keep UI labels separate from domain data.

## Step 4 — Prototype Wiring

- Update `/prototype` to consume the model + mapping instead of hard-coded arrays.
- Preserve the current layout while swapping in real data structures.

## Step 5 — Sanity Check

- Verify the prototype renders correctly.
- Confirm i18n remains UI-only.
- Ensure the catalog model matches backend validation needs.
