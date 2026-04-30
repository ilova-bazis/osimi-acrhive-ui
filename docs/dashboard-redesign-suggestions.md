# Dashboard Redesign Suggestions

## The Core Problem

Dashboard and Ingestion Overview currently answer the same question: *"what is the ingestion
pipeline doing right now?"* Both show stat tiles about batches, both surface ingestion-centric
numbers, and both present a recent-activity log. A user who has visited Overview gets nothing
new from Dashboard.

The fix is not cosmetic — it requires a **conceptual reframe** of what each page owns.

---

## Proposed Split of Concerns

| Dashboard | Ingestion Overview |
|---|---|
| The **archive** — what exists in the collection | The **pipeline** — what is being ingested right now |
| Collection size, health, and composition | Batch processing status and progress |
| Objects by type, language, access level | Batches by status (running, queued, failed) |
| Catalog completeness and curation gaps | Upload progress and pipeline metrics |
| Recently **catalogued** objects (with thumbnails) | Recently **submitted** batches |
| Items needing human curation | Items needing ingestion action |

In short: **Dashboard = the archive itself. Overview = the pipeline.**

This gives users a clear reason to visit each page separately. Right now they don't.

---

## Suggested Dashboard Sections

### 1. Archive Collection Headline (replaces the current 3-tile row)

Three tiles, but archive-scoped — not ingestion-scoped:

- **Total objects in catalog** — the headline number for the collection. This is the single
  most meaningful count for a digital archive. Currently it appears nowhere on Dashboard.
- **Objects available** — how many are currently accessible (not archived to cold storage,
  not unavailable). Gives a quick sense of archive health.
- **Awaiting curation** — objects that have machine-generated metadata only, no human-written
  title or description yet. This is an action signal that belongs on Dashboard, not Overview.

Replacing: `Active batches`, `Needs review`, `Pending uploads` — these three are ingestion
concerns and already duplicated on Overview.

---

### 2. Collection Composition (new section)

A visual breakdown of what the archive actually contains. This is something Overview will
never show. Options for format:

**Option A — Type distribution bar**
A horizontal proportional bar with labeled segments:
`Documents 58% · Photographs 27% · Audio 9% · Video 6%`
with counts underneath each label.

**Option B — Count tiles per type**
Small tiles for each content type (Document, Photo, Audio, Video, Manuscript, Other) each
showing a count. More scannable, no visual complexity.

**Option C — Language breakdown**
Same idea but by primary language (Persian, Tajik, English, etc.). Especially meaningful for
this archive's domain — the collection's linguistic composition matters to researchers.

Recommendation: Option B (type tiles) + a secondary row for top 3 languages below it. Keeps
it dense and informative without requiring a chart library.

---

### 3. Recently Catalogued Objects (replaces "Recent activity")

Instead of a generic event log (batch submitted, ingestion completed, user action), show the
actual **objects** recently added to the catalog — with thumbnail, title, type badge, and a
link to the object detail page.

The current "Recent activity" section shows system events. That is pipeline information — it
belongs on Overview, not here. What belongs on Dashboard is the collection itself: what new
material has joined the archive.

Format: a horizontal strip of 4–6 object cards (thumbnail + title + type + date), or a
vertical list with small thumbnails if horizontal strips are already used on the Objects page.
Clicking any item goes directly to the object's detail view.

This also makes Dashboard feel alive — it shows the archive growing, not just the machinery
churning.

---

### 4. Curation Attention Queue (replaces the static "Human intent checkpoint" card)

The current bottom card quotes the archival philosophy ("Every ingestion begins with declared
intent…"). This reads as a placeholder — static text that never changes and gives the user
nothing to act on.

Replace it with a small **action queue** for curation gaps:

- Objects with no human-written title (machine title only)
- Objects with no description
- Objects with no tags
- Objects flagged by a pipeline as needing human review

Each item in the queue links directly to the relevant object or a filtered Objects view.
If the queue is empty, show a positive state: "All catalogued objects have human-reviewed
metadata."

This turns Dashboard into an archivist's **to-do inbox** for the collection, not just a
status monitor for the pipeline.

---

### 5. Archive Health Indicators (optional, lower priority)

A small section or secondary row of simple indicators:

- **Storage tier distribution** — how many objects are in hot/warm/cold storage (visible vs.
  archived vs. restore-pending)
- **Access level breakdown** — Private / Team / Public counts, useful for understanding
  what's been made accessible
- **Oldest unreviewed object** — a nudge toward objects that have been in the system a long
  time without curation

These are lower priority than sections 1–4 but add genuine archive-management value.

---

## What to Remove from Dashboard

- **Active batches tile** — ingestion concern, already on Overview
- **Needs review tile** — too vague; the curation attention queue (section 4 above) does this
  better with specifics
- **Pending uploads tile** — pure ingestion pipeline concern, belongs on Overview only
- **Recent activity section** — generic event log belongs on Overview; Dashboard gets
  "recently catalogued objects" instead
- **Static "Human intent checkpoint" card** — replace with the actionable curation queue

---

## Summary

The redesigned Dashboard becomes the **collection window** — the first thing an archivist
sees when they want to understand the health and composition of the archive itself. Overview
remains the **operational control panel** for ingestion work.

A user should be able to answer these questions from Dashboard without navigating anywhere:
1. How big is this archive?
2. What kinds of material does it hold?
3. What needs my attention as a curator?
4. What's been added recently?

And these questions from Overview:
1. What batches are currently in the pipeline?
2. Which ones are stuck or failed?
3. What has been ingested recently?
4. How do I start a new batch?
