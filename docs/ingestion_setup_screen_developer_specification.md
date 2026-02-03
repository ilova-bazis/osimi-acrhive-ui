# Ingestion Setup Screen — Developer Specification

## Purpose

The **Ingestion Setup** screen allows users to prepare a batch of files for ingestion into the Osimi Digital Library by explicitly declaring **human intent** before any automated processing occurs. The UI facilitates this process by providing a structured interface for batch-level metadata declaration and file-level overrides.

This screen is a **Facilitator** and **Gatekeeper** between raw uploaded assets and backend ingestion pipelines.

No OCR, transcription, or other automated pipelines may run until the user explicitly confirms ingestion from this screen.

---

## Primary User Goal

> Upload a set of files, usually it is the files belonging to the same document or media, describe what they are (language, document type, tags), review the setup, and start ingestion and send the batch to ingestion process.

---

## Core Responsibilities

The screen must:

1. Allow users to upload one or more files
2. Capture batch-level metadata (human intent)
3. Apply batch defaults to files
4. Allow per-file overrides
5. Display clear, intuitive file states
6. Send files to ingestion process
---

## Screen Layout Overview

The screen is divided into three main regions:

1. **Header** — global context
2. **Right Panel** — batch intent and defaults
3. **Main Panel** — upload, file list, states, and actions

---

## 1. Header (Global Context)

**Purpose:** Provide orientation without distraction.

**Contents:**
- Screen title (e.g. "New Ingestion Batch")
- Optional batch identifier (after creation)

**Rules:**
- No destructive actions
- No ingestion triggers

---

## 2. Right Panel — Batch Context & Intent

**Role:** Structural context (not primary content)

This panel defines **batch-level defaults** that apply to all files unless overridden.

### Fields

- Batch title (required)
- Batch description / notes (optional)
- Default language
- Default document type
- Tags (people, places, themes)
- Optional pipeline preset (if applicable)

### Behavior

- Changes immediately apply to files that do not have overrides
- Clearly labeled as **Batch Defaults**
- Calm, non-attention-grabbing visual style

---

## 3. Main Panel — File Upload & List

### Upload Area

- Drag & drop zone
- Browse button
- Supported file types listed
- Clear empty-state guidance

### File List

Each file is displayed as a row containing:

- Filename
- File type indicator
- Current state badge
- Selection affordance

File states are visually encoded using the approved color and badge system.

---

## 4. File States

The following states may appear in the file list:

- Queued
- Processing
- Extracted
- Needs Review
- Approved
- Blocked
- Skipped
- Failed

A visible **status legend** must be present on the screen.

---

## 5. File Selection & Per-File Overrides

### Selection Behavior

- Clicking a file selects it
- Only one file is selected at a time (v1)
- Selected file is visually highlighted

### Per-File Overrides

When a file is selected, the user may:

- Override language
- Override document type
- Add or edit tags
- Add file-specific notes

**Rule:** Per-file values always override batch defaults.

Implementation options:
- Inline panel
- Side drawer
- Modal

(Exact UI choice is implementation-defined.)

---

## 6. Status Legend

The screen must include a visible legend explaining file states so that users can understand status meanings without prior training.

---

## 7. Action Area (Explicit Commitment)

Primary actions:

- **Download `catalog.json`** (secondary, optional)
- **Start Ingestion** (primary)

### Start Ingestion Behavior

- Runs validation
- Displays a final summary (file count, languages, pipelines)
- Requires explicit user confirmation

No background or automatic ingestion is allowed.

---

## Design Principles (Non-Negotiable)

- Human intent first
- Calm by default, attention only when required
- No silent automation
- Clear, at-a-glance understanding

---

## Non-Goals

This screen does **not**:

- Perform OCR review
- Edit extracted text
- Publish content
- Execute irreversible actions

---

## Success Criteria

The screen is successful if:

- Users feel confident starting ingestion
- File states are understandable at a glance
- Accidental ingestion is prevented
- Defaults and overrides are clearly understood

---

This document defines the **v1 canonical behavior** for the Ingestion Setup screen.
Future iterations must extend, not contradict, these principles.
