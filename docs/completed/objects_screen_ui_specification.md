# Objects Screen UI Specification (/objects)

## Purpose
The **Objects** screen is the primary library view of the archive. It presents *object-centric* records (not raw files) and enables discovery, review, and curation of ingested materials.

An **Object** may contain multiple files (images, PDFs, audio, video) and derived artifacts (OCR text, transcripts, embeddings).

---

## Design Principles
- **Object-first, not file-first**
- **Fast scanning** for archivists and curators
- **Safe bulk actions** (no destructive defaults)
- **Clear processing state visibility**
- **Scales to tens of thousands of objects**

---

## Route
- `/objects`

Query params (persisted in URL):
- `q` – search query
- `type[]` – object type
- `status[]` – processing status
- `lang[]` – language
- `batch_id` – source ingestion batch
- `page`, `page_size`
- `sort`

---

## Page Layout

### Top Navigation
- Global navigation: Dashboard · Ingest · **Objects** · Review · Collections · Jobs · Admin
- Optional global search (future)

---

### Page Header
**Title:** Objects  
**Subtitle:** All archived items

**Right actions:**
- Bulk Actions (disabled until selection)
- Export (future)

---

### Recently Ingested Strip (Keep)
A horizontal strip showing the last N ingested objects.

Purpose:
- Immediate feedback after ingestion
- Quick access to recent work

Behavior:
- Click opens object detail page
- Scrollable, limited to recent items only

---

### Filter Row (Sticky)

**Left:**
- Search input: `Search title, people, places, OCR, transcript…`

**Right:**
- Filter chips:
  - Type
  - Status
  - Language
- Button: **More filters** (opens drawer)

Active filters appear as removable chips below the row.

---

## Filters Drawer

### Core Filters (MVP)
- Object Type (multi-select)
- Status (multi-select)
- Language (multi-select)
- Ingest Date Range
- Batch ID (searchable select)
- Tags (searchable)

### Advanced (Later)
- Has OCR
- Has Transcript
- Has Embeddings
- Page count range
- Duration range

---

## Objects Table (Primary View)

### Row = One Object

### Columns (Left → Right)
1. Selection checkbox
2. Preview (icon or thumbnail)
3. Title
4. Object Type
5. Processing State
6. Language
7. Content Indicators
8. Updated
9. Source (Batch)
10. Actions menu

---

### Column Details

#### Title
- Primary clickable field
- Fallback: `Untitled – <short object_id>`

#### Object ID
- Not shown as a full column
- Available via:
  - Hover tooltip
  - Row actions → Copy Object ID

#### Content Indicators
Small icons:
- OCR text available
- Transcript available
- Embeddings available

---

### Processing Status System

Statuses:
- `QUEUED`
- `PROCESSING`
- `READY`
- `NEEDS_REVIEW`
- `FAILED`
- `ARCHIVED`

UI rules:
- Status shown as colored badge
- Consistent across system

Semantic meaning:
- **READY** = processed, usable
- **NEEDS_REVIEW** = human action required
- **ARCHIVED** = intentionally frozen

---

### Sorting
- Default: Updated DESC
- Sortable columns:
  - Title
  - Status
  - Type
  - Updated
  - Created

---

### Pagination
- Server-side
- Default page size: 25
- Options: 25 / 50 / 100

---

## Bulk Actions (MVP)

Enabled when ≥1 object selected:
- Add tags
- Move to collection
- Export metadata (JSON / CSV)

Rules:
- No delete in MVP
- Clear selection indicator (e.g., `3 objects selected`)

---

## Row Actions Menu

- Open object details
- Copy object ID
- View source batch
- Download originals (if allowed)
- View processing logs (future)

---

## States

### Empty (No objects)
Message:
> No objects yet

CTA:
- Go to Ingestion

---

### Empty (Filtered)
Message:
> No results for these filters

CTA:
- Clear filters

---

### Loading
- Skeleton rows
- Disabled bulk actions

---

### Error
- Inline alert
- Retry action

---

## Accessibility & UX Notes
- Keyboard navigable table
- Clear focus states
- Tooltips for icons
- Non-color status indicators

---

## MVP Scope Summary

**Included:**
- Object-centric list view
- Search + filters
- Bulk actions
- Status visibility
- Pagination + sorting

**Excluded (for later):**
- Grid view
- Public sharing
- Destructive actions
- AI-assisted curation

---

## Next Screen Dependency

- `/objects/:object_id` — Object Detail Page
  - Overview
  - Files
  - Text / Transcript
  - Metadata
  - Activity log

