# Create New Ingestion — User Flow & Screen Specification

This document describes the **end‑to‑end user flow and screen behavior** for creating a new ingestion batch in the Osimi Digital Library.

It is intended for **designers and frontend engineers** to implement a consistent, intentional experience aligned with the ingestion architecture.

---

## High‑Level Intent

The *Create New Ingestion* flow allows a user to:

* define a new ingestion batch
* upload files
* declare human intent (metadata)
* group files into archival objects
* explicitly start ingestion

**No automated processing occurs until the user confirms ingestion.**

---

## Entry Point

From the **Ingestion Overview** page:

* User clicks **➕ New Ingestion**

---

## Step 1 — Create Batch (Lightweight)

### Screen Title

**New Ingestion**

### User Input

Required:

* **Batch Name** (human‑readable label)

Optional:

* Description / notes

### System Behavior

* System generates a unique `batch_id`
* Batch state = **Draft**
* User is redirected to:

```
/ingestion/{batch_id}/setup
```

This step is intentionally minimal to reduce friction.

---

## Step 2 — Ingestion Setup (Main Working Screen)

This is the primary screen where the user prepares the batch for ingestion.

### Layout

* **Main Panel:** File upload and file list
* **Right Panel:** Batch defaults and intent
* **Footer / Primary Action:** Start Ingestion (initially disabled)

---

### 2.1 Upload Files

**User Actions**

* Drag & drop files
* Or click *Browse*

**UI Behavior**

* Files appear immediately in the file list
* Each file is assigned an internal `item_id`
* Initial file state: *Staged*

No pipelines are triggered.

---

### 2.2 Declare Batch Intent (Right Panel)

The user sets **batch‑level defaults** that apply to all files unless overridden.

**Fields**

* Default language
* Default document type
* Tags (people, places, themes)
* Optional pipeline preset

This answers:

> “What kind of material is this batch, in general?”

---

### 2.3 Per‑File Overrides (Optional)

**Interaction**

* Clicking a file selects it

**User may override**

* Language
* Document type
* Tags
* File‑specific notes

**Rule**
Per‑file values always override batch defaults.

---

### 2.4 Group Files into Objects

This step defines how files will become archival objects.

**Mental Model (communicated to user)**

> “Each group will become one archive object when ingestion starts.”

**Default Behavior**

* Each file = one object

**User Actions**

* Select multiple files → **Group as one object**
* Ungroup to revert to separate objects

Object IDs are **not** shown at this stage.

---

## Step 3 — Readiness & Validation

The system continuously checks:

* At least one file uploaded
* All files have required metadata (language, document type)
* No invalid or empty groups

When valid:

* **Start Ingestion** button becomes enabled

---

## Step 4 — Start Ingestion (Explicit Commitment)

User clicks **Start Ingestion**.

### Confirmation Step

A summary is shown:

* Batch name
* Number of files
* Number of objects that will be created
* Languages involved
* Pipelines that will run

User must explicitly confirm.

---

## Step 5 — Transition to Processing

### System Behavior

* Batch is locked (no further edits)
* `catalog.json` is finalized
* Batch state becomes **Queued / Ingesting**
* Ingestion worker will pick up the job

### Navigation

User is redirected to:

```
/ingestion/{batch_id}
```

(Batch Detail View)

---

## What the User Never Sees

* Object IDs (until ingestion starts)
* Storage locations
* Worker infrastructure
* File transfer mechanics

The user interacts only with **intent, grouping, and confirmation**.

---

## Design Principles

* Minimal friction up front
* Human intent before automation
* Clear point of no return
* Calm, predictable progression

---

## Non‑Goals of This Flow

* Editing extracted text
* Reviewing OCR output
* Publishing content
* Managing system errors

These belong to later screens.

---

## Success Criteria

This flow is successful if:

* Users understand what will happen before ingestion starts
* Grouping into objects feels natural
* Accidental ingestion is prevented
* Designers and developers can implement without ambiguity

---

This document defines the **canonical Create New Ingestion flow (v1)**.
Future iterations may extend but must not contradict these principles.
