# Objects — UI & Flow (Draft)

## Purpose
The Objects screen is the **post‑ingestion view** of archived objects. It lets users:

- search and filter created objects
- review object metadata (catalog.json)
- trace provenance (which batch created it)
- open object detail for review or curation

This is **not** the ingestion flow. It is the archive view.

---

## Primary Routes

- `/objects` → Objects Index
- `/objects/{object_id}` → Object Detail

---

## Objects Index (Main Screen)

### Page intent

> “Show me the archive objects created so far, and let me find the one I need.”

### Header

- Title: **Objects**
- Primary action: **➕ New Ingestion** (links to `/ingestion/new`)
- Optional secondary: **Filters** (if filter panel is collapsible)

### Layout

1) **Search + Filters bar**

- Search by title, tags, people, places
- Filters:
  - Type (`classification.type`)
  - Language
  - Access level
  - Created date range
  - Source batch

2) **Summary row (optional)**

- Total objects
- Updated recently
- Needs review

3) **Object list/grid (main focus)**

Each row/card shows:

- **Title**
- **Type** (`classification.type`)
- **Language**
- **Updated at**
- **Access level**
- **Source batch** (batch_id)
- Status badge (e.g., Needs review)

Row is clickable → Object Detail.

### Empty state

- “No objects yet”
- CTA: **Start your first ingestion**

---

## Object Detail (Single Object)

### Header

- Title: object title
- Subtitle: object_id + access level
- Actions:
  - **Edit metadata** (if allowed)
  - **Download catalog.json**

### Sections

1) **Metadata (catalog.json)**

- `access`
- `title`
- `classification` (type, language, tags)
- `dates`

2) **Provenance**

- Ingestion batch
- Created by
- Updated at

3) **Artifacts (if any)**

- OCR outputs, transcripts, thumbnails
- “Needs review” indicators

4) **Human notes**

- Free‑text notes (optional)

---

## Non‑Goals

- No ingestion creation here
- No pipeline configuration
- No upload

---

## Design Principles

- Clear separation between **archive objects** and **ingestion batches**
- Calm, structured metadata view
- Search‑first interaction
