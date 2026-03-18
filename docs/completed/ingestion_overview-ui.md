## `/ingestion` — Ingestion Overview

### Page intent

> “Show me what’s going on with ingestion, and let me start a new one.”

---

### Top of the page

**Header**

* Title: **Ingestion**
* Primary button (top-right): **➕ New Ingestion**

---

### Section 1: Quick Stats (compact, glanceable)

A horizontal row of cards:

* **Total Batches**
* **Objects Created**
* **In Progress**
* **Failed / Needs Attention**

(No deep interaction here — just situational awareness.)

---

### Section 2: Active & Recent Batches (main focus)

A table or list (this is the heart of the page):

Each row shows:

* **Batch Name** (user-defined label)
* **Batch ID** (small, secondary text)
* **Created At**
* **Status**

  * Draft
  * Ingesting
  * Completed
  * Failed
* **Progress**

  * e.g. `3 / 12 objects`
* **Action**

  * View
  * Resume (if draft)
  * Retry (if failed)

Rows are clickable → go to **Batch Detail View**.

---

### Section 3: Draft Batches (if any)

Optional, but useful.

* Clearly labeled **Drafts**
* These are batches where:

  * files uploaded
  * ingestion not started yet
* CTA per row: **Continue setup**

This gently reminds users of unfinished work.

---

### Empty State (important)

If no batches exist:

* Friendly message:

  > “No ingestions yet”
* One clear CTA:
  **Start your first ingestion**

---

### What this page does NOT do

* No file uploads
* No metadata editing
* No pipeline configuration

It’s a **control & navigation screen**, not a working screen.

---

### Mental model this page enforces

* “Ingestion happens in batches”
* “Batches have a lifecycle”
* “I can always see where things stand”

---
