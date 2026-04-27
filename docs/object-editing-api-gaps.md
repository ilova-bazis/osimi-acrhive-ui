# Object Editing — API Gap Analysis

_Last updated: 2026-04-14_

This document compares the backend API (`docs/api-reference.md`) against the frontend editing contract (`docs/object-editing-api-contracts.md`) and identifies what is missing, incomplete, or misaligned. It is a backend request list, not a frontend task list.

---

## Summary

| Endpoint | Status | Action needed |
|---|---|---|
| `GET /api/objects/:id/edit` | Partial | Expand `curation_payload` for all media types |
| `PATCH /api/objects/:id/metadata` | ✅ Complete | None |
| `PUT /api/objects/:id/curation/document` | ❌ Missing | Create |
| `PUT /api/objects/:id/curation/transcript` | ❌ Missing | Create |
| `PUT /api/objects/:id/curation/captions` | ❌ Missing | Create |
| `POST /api/objects/:id/curation/submit` | ❌ Missing | Create |
| `GET /api/objects/:id/curation/history` | Partial | Add curation event types |

---

## Gap 1 — `GET /api/objects/:object_id/edit` — curation_payload is a stub

**Current state:**
The API reference explicitly states _"current implementation exposes metadata editing foundation only; text curation projections are not yet included."_ The example response confirms this:

```json
"curation_payload": {
  "kind": "document"
}
```

**What the frontend needs:**
The edit surface populates the center pane from `curation_payload`. Without structured curation data, there is nothing to display or edit. The full payload shapes required are:

**Document:**
```json
{
  "kind": "document",
  "pages": [
    {
      "page_number": 1,
      "label": "1",
      "image_artifact_id": "uuid-or-null",
      "machine_text": "Raw OCR text for page 1",
      "curated_text": "Curated version",
      "confidence": 82,
      "status": "unedited"
    }
  ]
}
```

**Image:**
```json
{
  "kind": "image"
}
```
_(No curation payload beyond metadata — this is intentional.)_

**Audio:**
```json
{
  "kind": "audio",
  "transcript_segments": [
    {
      "id": "seg-uuid",
      "start_seconds": 0.0,
      "end_seconds": 4.2,
      "speaker": "Speaker 1",
      "machine_text": "Raw transcript",
      "curated_text": "Curated transcript",
      "confidence": 91,
      "status": "unedited"
    }
  ]
}
```

**Video:**
```json
{
  "kind": "video",
  "transcript_segments": [
    {
      "id": "seg-uuid",
      "start_seconds": 0.0,
      "end_seconds": 4.2,
      "machine_text": "Raw transcript",
      "curated_text": "Curated transcript",
      "confidence": 88,
      "status": "unedited"
    }
  ],
  "caption_segments": [
    {
      "id": "cap-uuid",
      "start_seconds": 0.0,
      "end_seconds": 4.2,
      "machine_text": "Raw caption cue",
      "curated_text": "Curated caption cue",
      "status": "unedited"
    }
  ]
}
```

**Field notes:**

- `status` is per-segment state: `unedited | edited | accepted`
- `machine_text` is read-only — it is the raw OCR / ASR output and must never be overwritten by write endpoints
- `image_artifact_id` on document pages is used to load the scanned page image in the left panel via `GET /api/objects/:id/artifacts/:artifact_id/view`; it is `null` if no page-level scan image exists
- Video has two separate segment lists: `transcript_segments` (speaker-labeled, timed) and `caption_segments` (display-timed, no speaker field, no confidence)
- Audio has `speaker` on each segment; video transcript does not (speaker tagging on video transcript is out of scope for the current prototype)

---

## Gap 2 — `PUT /api/objects/:object_id/curation/document` — Missing

**Purpose:** Save curated text edits for document pages. Called when the user saves in the document editor (per-page mode or whole-document mode).

**Request body:**
```json
{
  "revision": 3,
  "pages": [
    { "page_number": 1, "curated_text": "Corrected text for page 1" },
    { "page_number": 3, "curated_text": "Corrected text for page 3" }
  ]
}
```

- `revision` (required integer) — optimistic concurrency token; must match current object revision
- `pages` (required, non-empty array) — partial updates are allowed; only send pages that changed
- `page_number` — must be a valid page number from the object's document structure
- `curated_text` — string; may be empty

**Success response (200):**
```json
{
  "object_id": "OBJ-20260213-ABC123",
  "revision": 4,
  "curation_state": "needs_review",
  "updated_at": "2026-04-14T11:00:00.000Z"
}
```

**Error behavior:**
- `400` — invalid path or body
- `401` — missing/expired session
- `403` — role not allowed (only `archiver`, `admin`)
- `404` — object not found
- `409 REVISION_CONFLICT` — stale revision (same shape as PATCH /metadata 409)
- `422 VALIDATION_FAILED` — invalid body content
- `422 INVALID_SEGMENT_ID` — `page_number` does not exist in the object's document structure
- `422 INVALID_MEDIA_TYPE_FOR_CURATION` — object is not a document

---

## Gap 3 — `PUT /api/objects/:object_id/curation/transcript` — Missing

**Purpose:** Save curated transcript segment edits for audio and video objects.

**Request body:**
```json
{
  "revision": 3,
  "segments": [
    { "id": "seg-uuid-1", "curated_text": "Corrected segment text", "speaker": "Speaker 2" },
    { "id": "seg-uuid-3", "curated_text": "Another correction" }
  ]
}
```

- `revision` (required integer)
- `segments` (required, non-empty array) — partial updates allowed
- `id` — segment ID as returned from `GET /edit`
- `curated_text` — string
- `speaker` — optional string; if omitted the existing speaker value is preserved; only applicable to audio objects (frontend will not send for video)

**Success response (200):** Same shape as document curation write result.

**Error behavior:** Same pattern as Gap 2, with `422 INVALID_SEGMENT_ID` when a segment ID does not exist.

---

## Gap 4 — `PUT /api/objects/:object_id/curation/captions` — Missing

**Purpose:** Save curated caption cue edits for video objects.

**Request body:**
```json
{
  "revision": 4,
  "segments": [
    { "id": "cap-uuid-1", "curated_text": "Corrected caption text" }
  ]
}
```

- Same field semantics as transcript, without `speaker`

**Success response (200):** Same shape as other curation write results.

**Error behavior:** Same pattern. Add `422 INVALID_MEDIA_TYPE_FOR_CAPTIONS` for non-video objects.

---

## Gap 5 — `POST /api/objects/:object_id/curation/submit` — Missing

**Purpose:** Mark the object's curation as complete and submit it for archivist/admin review. Transitions `curation_state` from `needs_review` or `review_in_progress` to a submitted state, and enqueues an async processing request.

**Request body:**
```json
{
  "revision": 5,
  "review_note": "All pages reviewed. Pages 4-6 have significant OCR errors manually corrected."
}
```

- `revision` (required integer)
- `review_note` (required string; may be empty)

**Success response (200):**
```json
{
  "object_id": "OBJ-20260213-ABC123",
  "revision": 5,
  "curation_state": "review_in_progress",
  "submitted_at": "2026-04-14T11:15:00.000Z",
  "submitted_by": "10000000-0000-0000-0000-000000000001",
  "request": {
    "id": "async-request-uuid",
    "action_type": "curation_submit",
    "status": "PENDING"
  }
}
```

**Error behavior:**
- `400` — invalid path or body
- `401` — missing/expired session
- `403` — role not allowed (`archiver`, `admin`)
- `404` — object not found
- `409 REVISION_CONFLICT` — stale revision
- `409 CONFLICT` — object not in a submittable curation state (e.g. already `reviewed`)

**Frontend note:** The UI disables "Submit for review" unless `capabilities.can_submit_review` is `true`. The backend should ensure this capability is accurate.

---

## Gap 6 — `GET /api/objects/:object_id/curation/history` — Incomplete event types

**Current state:** The API reference shows only two event types:

```
METADATA_UPDATED | RIGHTS_UPDATED
```

**What the frontend needs:** The history panel should also show curation activity. Required additional event types:

| Event type | Triggered by |
|---|---|
| `DOCUMENT_PAGE_UPDATED` | `PUT /curation/document` |
| `TRANSCRIPT_SEGMENT_UPDATED` | `PUT /curation/transcript` |
| `CAPTION_SEGMENT_UPDATED` | `PUT /curation/captions` |
| `CURATION_SUBMITTED` | `POST /curation/submit` |

The `payload` structure for these events is not prescribed here — use whatever is most useful for audit trail purposes. The frontend only displays `type`, `actor_user_id`, `at`, `revision_before`, and `revision_after`; `payload` is treated as opaque JSON.

---

## Gap 7 — `access_level` is not editable through the edit surface

**Current state:**
- `GET /edit` returns `rights.access_level` but explicitly marks it as **read-only** in this contract
- `PATCH /metadata` does not accept `access_level`
- Changing access level requires `PATCH /api/objects/:object_id/access-policy`, which is **admin-only**

**Frontend expectation:**
The prototype's Details pane includes an `accessLevel` dropdown (private / family / public). The edit surface is used by `archiver` role users who cannot call `PATCH /access-policy`.

**Resolution required — pick one:**

**Option A (recommended):** Add `access_level` to `PATCH /api/objects/:object_id/metadata` for `archiver` and `admin` roles. The access-policy endpoint can continue to handle embargo config (admin-only). This gives archivers the ability to set basic access level during curation without granting them full embargo control.

**Option B:** Restrict the access level field in the edit UI to `admin` role only, based on `capabilities`. Add a capability flag like `can_edit_access_level` to `GET /edit` response.

**Option C:** Keep `access_level` read-only in the edit surface for now and only allow changes via the existing access-policy flow. The UI would show the current value as informational only.

The frontend will implement whichever option the backend confirms. Until resolved, the `accessLevel` field in the edit UI will be rendered as read-only.

---

## Confirmed Aligned — No Changes Needed

These match the frontend contract as-is:

**`PATCH /api/objects/:object_id/metadata`**
- Request body shape, field names, validation rules: ✅ match
- 200 response shape (`object_id`, `revision`, `curation_state`, `updated_at`): ✅ match
- `409 REVISION_CONFLICT` with `details.latest_revision`: ✅ match
- `422 VALIDATION_FAILED` with `details[].path` + `details[].code` array: ✅ match

**`GET /api/objects/:object_id/edit`** — metadata + rights block
- All `metadata` fields (`title`, `publication_date`, `date_precision`, `date_approximate`, `language`, `tags`, `people`, `description`): ✅ match
- `rights` fields (`access_level`, `rights_note`, `sensitivity_note`): ✅ match
- `capabilities` block (`can_edit_metadata`, `can_curate_text`, `can_submit_review`): ✅ match
- `draft` block (`updated_at`, `updated_by`): ✅ match
- `revision` as integer: ✅ match

**`GET /api/objects/:object_id/curation/history`** — structure
- Response envelope (`object_id`, `events[]`, `next_cursor`): ✅ match
- Event fields (`id`, `type`, `actor_user_id`, `at`, `revision_before`, `revision_after`, `payload`): ✅ match

---

## Minor Frontend Defensive Items

These do not block backend work but the frontend should handle them:

1. **`media_type: "other"`** — The API can return `other` as a `media_type` in `GET /edit`. Our Zod schema currently only handles `document|image|audio|video`. The frontend should add a fallback case to avoid a parse error on unexpected object types.

2. **`can_curate_text: false` during the gap period** — Until the curation write endpoints exist, the backend will correctly return `can_curate_text: false`. The frontend prototype mock forces it `true`; the production page should gate the curation surface on this capability flag.

3. **`image_artifact_id` on document pages may be null** — The frontend should not attempt to load a page image when this field is null; it should show a placeholder instead.
