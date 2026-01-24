
# Osimi Digital Library — Ingestion UI Design

This document describes the **user-facing ingestion UI** for the Osimi Digital Library.
Its purpose is to define how users upload assets, provide human intent, and initiate
controlled ingestion pipelines while preserving archival integrity.

---

## 1. Design Principles

- **Human intent comes first**: users explicitly describe what they upload.
- **AI assists, humans decide**: pipelines extract data but never overwrite human input.
- **Selective pipelines**: no OCR, transcription, or enrichment runs unless explicitly enabled.
- **Batch-oriented ingestion**: uploads are grouped into reviewable batches.
- **Clear separation** between machine-generated artifacts and human-curated content.

---

## 2. Core Concept: Ingestion Batch

An ingestion session always creates a **Batch**.

A batch represents:
- A logical group of uploaded files
- Shared defaults (language, content type, pipelines)
- A single `catalog.json` describing intent and structure

Batches are reviewable before ingestion starts and traceable afterward.

---

## 3. Main UI: Batch Ingestion Screen

### 3.1 Layout Overview

The ingestion screen is divided into three primary areas:

1. **Dropzone & File List (Main Panel)**
2. **Batch Intent & Defaults (Right Sidebar)**
3. **Actions & Status Bar**

---

## 4. Dropzone & File List

### 4.1 Dropzone Behavior

- Supports drag-and-drop and file browser selection
- Accepts images, PDFs, audio, video, and archives
- Creates a **local staging batch** immediately (no upload yet)

### 4.2 File List Display

Each file row shows:
- Filename
- File type badge (Image / PDF / Audio / Video)
- File size
- Remove / preview action
- Optional grouping label (e.g. “Newspaper Issue”, “Photo Set”)

---

## 5. Batch Intent Panel (Human Truth Layer)

The right sidebar captures **human-provided intent**, which drives all pipelines.

### 5.1 Batch-Level Fields

- **Batch title**
- **Batch description**
- **Primary language**
  - Persian
  - Tajik
  - English
  - Mixed / Unknown
- **Content category**
  - Newspaper
  - Book / Manuscript
  - Photo
  - Interview / Audio
  - Video
  - Other
- **Pipeline preset (optional)**
  - Auto (recommended)
  - Photos only (no OCR)
  - Newspapers (layout OCR + review)
  - Audio/Video (speech-to-text)
- **Visibility**
  - Private
  - Team
  - Public (future)
- **Tags**
  - People, places, themes

Batch-level values act as defaults for all files.

---

## 6. Per-File Overrides

Selecting a file opens a detail panel allowing overrides:

- Language
- Document type
- Enabled pipelines:
  - OCR
  - Layout-aware OCR
  - Speech-to-text
  - Image tagging
- Notes (free text, human context)

Overrides always take precedence over batch defaults.

---

## 7. Intent Wizard (Optional Assist)

For mixed uploads, an optional wizard helps pre-fill intent:

1. **What did you upload?**
   - Mostly photos
   - Mostly scanned documents
   - Mostly audio/video
   - Mixed

2. **Do these need OCR?**
   - Yes
   - No
   - Ask per file

3. **Primary language**
   - Persian
   - Tajik
   - Mixed
   - Unknown

The wizard never starts ingestion automatically; it only sets defaults.

---

## 8. Review Before Ingestion (Critical Checkpoint)

Before ingestion begins, the user must review a summary:

- Number of files
- Languages detected/declared
- Pipelines that will run per file
- Warnings or ambiguities

Actions:
- Download `catalog.json` (optional)
- Confirm and start ingestion

No pipelines run before this confirmation.

---

## 9. Upload & Pipeline Status View

After ingestion starts, a batch status page shows:

- Upload progress per file
- Pipeline stages:
  - Queued
  - Running
  - Completed
- Generated artifacts:
  - `ocr.raw.txt`
  - `ocr.blocks.json`
  - Thumbnails
  - Transcripts
- Clear indicators for **Needs Human Review**

---

## 10. Data Model (UI Perspective)

### 10.1 Batch Structure (Conceptual)

- batchId
- title
- description
- defaults:
  - language
  - contentCategory
  - pipelinePreset
- items[]:
  - fileId
  - originalFilename
  - mimeType
  - overrides:
    - language
    - documentType
    - pipelines
  - notes
  - tags

This structure maps directly to the generated `catalog.json`.

---

## 11. Initial Implementation Scope (V1)

To ship quickly and safely:

1. Dropzone + file list
2. Batch title, language, and OCR toggle
3. Per-file OCR on/off override
4. Review modal with catalog preview
5. Upload and basic pipeline status

This V1 fully supports:
- Photo-only batches (no OCR)
- Newspaper scans (OCR + review)
- Single-article uploads with explicit language

---

## 12. Future Extensions

- Folder-level ingestion
- Saved pipeline presets
- Collaborative review workflows
- Public publishing pipeline
- Academic citation support

---

**This UI is a gatekeeper, not a shortcut.  
Every ingestion begins with human intent and ends with human review.**