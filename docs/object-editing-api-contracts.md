# Object Editing UI Contract (V1)

Status: Ready for UI implementation  
Date: 2026-04-14

This document is the UI/backend handoff contract for the current object editing implementation.

It covers only the backend editing foundation that exists today:

- loading object edit state
- editing object metadata and rights notes
- editing OCR page curation for document objects
- submitting object changes (metadata, rights/access policy, and curated OCR) as one immutable archive revision
- querying archive synchronization status and retrying failed submissions
- revision conflicts
- validation failures
- edit history read

This document does not define transcript or caption editing payloads yet.

## Endpoints

- `GET /api/objects/:object_id/edit`
- `PATCH /api/objects/:object_id/metadata`
- `PUT /api/objects/:object_id/curation/document`
- `POST /api/objects/:object_id/changes/submit`
- `GET /api/objects/:object_id/changes/status`
- `POST /api/objects/:object_id/change-submissions/:request_id/retry`
- `DELETE /api/objects/:object_id/edit-lock`
- `GET /api/objects/:object_id/curation/history`

## Source of Truth

- UI reads editing state from backend only.
- UI writes metadata edits, OCR page edits, and object change submissions to backend only.
- Backend owns edit revisioning and conflict detection.
- Archive apply is asynchronous: the UI observes submission status through the backend and never talks to the archive worker directly.
- `src/lib/api/objectEdit.contract.json` is a vendored copy of the backend-owned `osimi-backend/docs/object-edit-contract-fixtures.json`; update both files in the same change and run their contract tests.

## GET `/api/objects/:object_id/edit`

### Purpose

Load the current editing state for one object. Calling this endpoint auto-acquires a 60-minute lock for the current user, or extends their active lock. Another user's active lock still returns `200`, but all edit capabilities are `false`.

### Roles

- `archiver`
- `admin`

### Response

```json
{
  "object_id": "OBJ-20260213-ABC123",
  "media_type": "document",
  "revision": 1,
  "curation_state": "needs_review",
  "lock": {
    "locked": true,
    "locked_by": "10000000-0000-0000-0000-000000000001",
    "locked_until": "2026-08-04T12:00:00.000Z"
  },
  "draft": {
    "updated_at": "2026-04-14T10:32:44.000Z",
    "updated_by": "10000000-0000-0000-0000-000000000001"
  },
  "metadata": {
    "title": "Edited Metadata Title",
    "publication_date": "1987-06-14",
    "date_precision": "day",
    "date_approximate": true,
    "language": "Tajik",
    "tags": ["migration", "oral history"],
    "people": ["Zarina T.", "M. Davlatov"],
    "description": "Updated description"
  },
  "rights": {
    "access_level": "private",
    "rights_note": "Updated rights note",
    "sensitivity_note": "Updated sensitivity note"
  },
  "capabilities": {
    "can_edit_metadata": true,
    "can_curate_text": true,
    "can_submit_review": true,
    "can_submit_changes": true
  },
  "curation_payload": {
    "kind": "document",
    "machine_ocr_artifact_id": "60000000-0000-4000-8000-000000000881",
    "page_count": 2,
    "pages": [
      {
        "page_number": 1,
        "label": "1",
        "machine_text": "Machine OCR page 1...",
        "curated_text": null,
        "status": "machine"
      },
      {
        "page_number": 2,
        "label": "2",
        "machine_text": "Machine OCR page 2...",
        "curated_text": "Curated OCR page 2...",
        "status": "edited"
      }
    ]
  }
}
```

### Field Notes

- `revision`
  - required on every metadata write, OCR page save, and submit
- `draft`
  - `null` until the first successful metadata write in the current backend edit model
  - `updated_by` is a user id or `null`, not a display name
- `lock`
  - contains the active owner and expiry when a lock is held
  - when owned by another user, every edit capability is `false`
- `media_type`
  - one of `document|image|audio|video|other`
- `rights.access_level`
  - read-only in this contract
  - provided so the editor can display current access context alongside editable notes
- `capabilities.can_edit_metadata`
  - `true` for authorized archiver and admin roles when no other user owns the active lock
- `capabilities.can_curate_text`
  - `true` for document objects when the caller is authorized and no other user owns the active lock
  - `false` for non-document objects or a foreign active lock
- `capabilities.can_submit_review`
  - legacy wire name for the OCR-publication capability
  - `true` for document objects when the caller is authorized and no other user owns the active lock
  - `false` for non-document objects or a foreign active lock
- `capabilities.can_submit_changes`
  - `true` for authorized archiver and admin users when no other user owns the active lock and object change submission is enabled for the environment
  - `false` for a foreign active lock or a disabled submission feature
  - applies to every media type; metadata-only submissions do not require a document OCR page projection
- `curation_payload.kind`
  - currently mirrors `media_type`
  - for `document`, `curation_payload.pages[]` contains OCR editing data
- `curation_payload.machine_ocr_artifact_id`
  - reference to an OCR artifact known to backend
  - `null` when no OCR artifact exists for this object
  - UI may use it for diagnostics or raw artifact access if needed
- `curation_payload.page_count`
  - total page count from document metadata
  - `null` when no valid page count is available in metadata
- `curation_payload.pages[]`
  - page-by-page OCR editor payload for document objects
  - `machine_text` is immutable machine OCR
  - `curated_text` is the saved backend draft for that page, or `null` when no curated value exists yet
  - `label` is the page label, or `null` when no label is available
  - `status` is `machine` when the page has no curated draft, otherwise `edited`

## PATCH `/api/objects/:object_id/metadata`

### Purpose

Update editable metadata and rights notes for one object.

### Roles

- `archiver`
- `admin`

### Request

```json
{
  "revision": 1,
  "metadata": {
    "title": "Edited Metadata Title",
    "publication_date": "1987-06-14",
    "date_precision": "day",
    "date_approximate": true,
    "language": "Tajik",
    "tags": ["Oral History", "Migration"],
    "people": ["Zarina T.", "M. Davlatov"],
    "description": "Updated description"
  },
  "rights": {
    "rights_note": "Updated rights note",
    "sensitivity_note": "Updated sensitivity note"
  }
}
```

### Normalization Rules

- `metadata.title`
  - trimmed, must be non-empty
- `metadata.publication_date`
  - must match `date_precision`
  - `year` -> `YYYY`
  - `month` -> `YYYY-MM`
  - `day` -> `YYYY-MM-DD`
  - `none` -> backend normalizes to `""`
- `metadata.date_approximate`
  - backend normalizes to `false` when `date_precision = none`
- `metadata.language`
  - empty string becomes `null`
- `metadata.tags`
  - required array
  - each item must be non-empty after trim
  - backend lowercases values
  - duplicates are removed after normalization
- `metadata.people`
  - required array
  - each item must be non-empty after trim
  - duplicates are removed after trimming
- `metadata.description`
  - empty string becomes `null`
- `rights.rights_note`
  - empty string becomes `null`
- `rights.sensitivity_note`
  - empty string becomes `null`

### Success Response

```json
{
  "object_id": "OBJ-20260213-ABC123",
  "revision": 2,
  "curation_state": "needs_review",
  "updated_at": "2026-04-14T10:38:52.000Z"
}
```

### Revision Conflict Response

HTTP `409`

```json
{
  "request_id": "uuid",
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Object metadata revision is stale.",
    "details": {
      "latest_revision": 2
    }
  }
}
```

### Validation Failure Response

HTTP `422`

```json
{
  "request_id": "uuid",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed.",
    "details": [
      {
        "path": "metadata.publication_date",
        "code": "INVALID"
      }
    ]
  }
}
```

### UI Handling Requirements

- On `409 REVISION_CONFLICT`
  - UI should refetch `GET /edit`
  - UI should preserve local unsaved form state if possible
  - UI should prompt user to review the latest backend state before resubmitting with the new revision
- On `422 VALIDATION_FAILED`
  - UI should map `error.details[].path` to field-level validation errors
- On `403 FORBIDDEN`
  - UI should treat the editor as read-only or inaccessible depending on route context

## Object Change Submission

### Purpose

Submit the currently saved object revision — metadata, rights/access policy, and curated document OCR — to the archive as one immutable revision. Submission is asynchronous: the backend packages the revision, records an immutable submission, and enqueues the `object_revision_apply` worker action.

### Feature Gate

- `OBJECT_REVISION_APPLY_ENABLED` environment flag gates submission in the backend.
- Default is disabled; while disabled the submit endpoint responds as unavailable.

### Worker Contract

- The archive worker consumes a versioned `object_revision_apply` contract. The request payload is staged as an immutable package (metadata, rights, access/embargo policy, curated document text) and downloaded by the worker through the existing archive request source endpoints.
- UI and backend treat the worker as external: the UI only observes the recorded submission status; it never assumes synchronous archive apply.

### POST `/api/objects/:object_id/changes/submit`

#### Roles

- `archiver`
- `admin`

#### Request

```json
{
  "revision": 5,
  "submission_note": "Ready for archive apply."
}
```

#### Rules

- revision-guarded like all other object edit writes; the submitted revision must equal the current object revision
- `submission_note` is a nullable transport field; send `null` when no note is needed
- one active (`PENDING`/`PROCESSING`) submission is allowed per object; a second submit while one is active returns a conflict with the existing request id and status
- a submission for the same revision already recorded is replayed idempotently

#### Success Response

HTTP `202`

```json
{
  "object_id": "OBJ-20260213-ABC123",
  "current_revision": 5,
  "submitted_revision": 5,
  "submission": {
    "id": "22222222-2222-4222-8222-222222222222",
    "request_id": "request-um98-changes-1",
    "action_type": "object_revision_apply",
    "status": "PENDING",
    "submitted_at": "2026-04-14T11:15:00.000Z",
    "submitted_by": "10000000-0000-0000-0000-000000000001"
  }
}
```

#### Conflict Responses

- HTTP `409` with `code: CHANGES_ALREADY_ACTIVE` and `details.existing_request_id` / `details.existing_request_status` when another submission is active
- HTTP `409 REVISION_CONFLICT` when the submitted revision is stale

### GET `/api/objects/:object_id/changes/status`

#### Purpose

Poll the authoritative archive synchronization state for one object.

#### Roles

- `archiver`
- `admin`

#### Success Response

HTTP `200`

```json
{
  "object_id": "OBJ-20260213-ABC123",
  "current_revision": 5,
  "latest_submitted_revision": 5,
  "latest_applied_revision": 5,
  "archive_out_of_sync": false,
  "active_submission": null,
  "latest_submission": {
    "id": "22222222-2222-4222-8222-222222222222",
    "request_id": "request-um98-changes-1",
    "submitted_revision": 5,
    "status": "COMPLETED",
    "submitted_at": "2026-04-14T11:15:00.000Z",
    "submitted_by": "10000000-0000-0000-0000-000000000001",
    "completed_at": "2026-04-14T11:16:00.000Z",
    "failure_reason": null
  }
}
```

#### Field Notes

- `status` is one of `PENDING|PROCESSING|COMPLETED|FAILED|CANCELED`
- `archive_out_of_sync` is `true` while saved changes are not yet applied to the archive
- `active_submission` is non-null while a submission is `PENDING` or `PROCESSING`

### POST `/api/objects/:object_id/change-submissions/:request_id/retry`

#### Purpose

Requeue a `FAILED` or `CANCELED` submission for archive apply.

#### Roles

- `archiver`
- `admin`

#### Request

```json
{
  "retry_reason": "Archive worker was unreachable."
}
```

#### Rules

- `retry_reason` is a nullable transport field
- only terminal submissions can be retried
- success returns the same submission shape as the submit endpoint with the requeued status

### UI Handling Requirements

- Distinguish **Save draft** (local object edit writes) from **Submit changes** (asynchronous archive synchronization); submitting does not change the object revision.
- On success, seed the queued state from the returned submission, close the submission dialog, and poll `GET /changes/status` while a submission is `PENDING`/`PROCESSING`.
- If the action response is lost, reconcile from `GET /changes/status` before accepting the state as unknown.
- On `409 CONFLICT` with `code: CHANGES_ALREADY_ACTIVE`, adopt the existing request id and status instead of resubmitting.
- Surface `FAILED` submissions with the retry action; never allow a second active submit.
- UI should not assume archive apply completed synchronously.

## PUT `/api/objects/:object_id/curation/document`

### Purpose

Save curated OCR text page-by-page for one document object.

### Roles

- `archiver`
- `admin`

### Request

```json
{
  "revision": 1,
  "pages": [
    {
      "page_number": 1,
      "curated_text": "Curated page 1 text..."
    },
    {
      "page_number": 2,
      "curated_text": "Curated page 2 text..."
    }
  ]
}
```

### Rules

- only valid for document objects
- each `page_number` must exist in the current document page projection
- duplicate `page_number` values in one request are rejected
- `curated_text` may be an empty string if the user intentionally clears a page
- this endpoint updates only the submitted pages

### Success Response

```json
{
  "object_id": "OBJ-20260213-ABC123",
  "revision": 2,
  "updated_count": 2,
  "updated_at": "2026-04-14T11:00:00.000Z"
}
```

### Revision Conflict Response

HTTP `409`

```json
{
  "request_id": "uuid",
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Document curation revision is stale.",
    "details": {
      "latest_revision": 2
    }
  }
}
```

### Validation Failure Response

HTTP `422`

```json
{
  "request_id": "uuid",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed.",
    "details": [
      {
        "path": "pages",
        "code": "INVALID_PAGE_NUMBER",
        "page_number": 999
      }
    ]
  }
}
```

### UI Handling Requirements

- On `409 REVISION_CONFLICT`
  - UI should refetch `GET /edit`
  - UI should preserve local unsaved page edits if possible
  - UI should prompt user to review the latest backend state before resubmitting with the new revision
- On `409 CONFLICT` with `code: INVALID_MEDIA_TYPE_FOR_DOCUMENT_CURATION`
  - Object is not a document type; UI should not allow OCR curation for this object
- On `422 VALIDATION_FAILED`
  - UI should surface invalid page mapping or duplicate page errors

## GET `/api/objects/:object_id/curation/history`

### Purpose

Read immutable backend edit history for metadata, rights, and OCR page changes.

### Roles

- `viewer`
- `archiver`
- `admin`

### Query Params

- `limit` optional, default `50`, max `200`
- `cursor` optional opaque cursor

### Response

```json
{
  "object_id": "OBJ-20260213-ABC123",
  "events": [
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "type": "RIGHTS_UPDATED",
      "actor_user_id": "10000000-0000-0000-0000-000000000001",
      "at": "2026-04-14T10:38:52.000Z",
      "revision_before": 1,
      "revision_after": 2,
      "payload": {
        "fields": ["rights_note", "sensitivity_note"]
      }
    },
    {
      "id": "33333333-3333-4333-8333-333333333333",
      "type": "DOCUMENT_PAGE_UPDATED",
      "actor_user_id": "10000000-0000-0000-0000-000000000001",
      "at": "2026-04-14T10:39:30.000Z",
      "revision_before": 2,
      "revision_after": 3,
      "payload": {
        "page_numbers": [1, 2]
      }
    },
    {
      "id": "22222222-2222-4222-8222-222222222222",
      "type": "METADATA_UPDATED",
      "actor_user_id": "10000000-0000-0000-0000-000000000001",
      "at": "2026-04-14T10:38:52.000Z",
      "revision_before": 1,
      "revision_after": 2,
      "payload": {
        "fields": [
          "title",
          "publication_date",
          "date_precision",
          "date_approximate",
          "language",
          "tags",
          "people",
          "description"
        ]
      }
    }
  ],
  "next_cursor": null
}
```

### Event Types In V1

- `METADATA_UPDATED`
- `RIGHTS_UPDATED`
- `DOCUMENT_PAGE_UPDATED`
- `CURATION_SUBMITTED`

## UI Integration Checklist

UI can start implementation when it assumes the following:

1. Metadata editing is revision-based.
2. Title-only legacy patch endpoint is not the editing endpoint.
3. `GET /edit` is the canonical load endpoint for the editor shell.
4. `PATCH /metadata` is the canonical save endpoint for metadata edits.
5. `PUT /curation/document` is the canonical save endpoint for OCR page edits.
6. `POST /curation/submit` is the canonical submit endpoint for current OCR curation state.
7. History is backend edit history, not archive-side artifact history.
8. `access_level` is read-only in this editing contract.
9. OCR editing is page-by-page for document objects.
10. Transcript/caption editing payloads are not part of this V1 contract yet.

## Deferred In This Contract

- transcript segment editing payloads
- caption editing payloads
- archive apply progress surfaced to UI
- stale-against-machine UI flags
