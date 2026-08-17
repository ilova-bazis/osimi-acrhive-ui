# Object Editing Lock and Revision Contract

> **Status:** Current runtime contract
>
> **Effective date:** 2026-08-04
>
> **Authoritative implementation:** `osimi-backend/src/validation/object.ts` and `osimi-backend/src/services/object-edit-service.ts`

The editor uses both an edit lock and optimistic revision checks. The lock prevents writes by another user while the revision prevents stale writes by the same user or across tabs.

## Editor Flow

### Open editor

```text
GET /api/objects/:object_id/edit
```

The endpoint requires `archiver` or `admin` and auto-acquires a 60-minute lock for the requesting user, or extends their existing active lock.

- The response always includes `revision` and `lock`.
- When another user holds an active lock, the request still returns `200`.
- In that response, `lock.locked` is `true`, `lock.locked_by` identifies the other user, and every edit capability is `false`.
- The UI must present the editor as read-only when `lock.locked_by !== currentUserId`.

### Save metadata and rights

```text
PATCH /api/objects/:object_id/metadata
```

```json
{
  "revision": 4,
  "metadata": {
    "title": "Edited Metadata Title",
    "publication_date": "1987-06-14",
    "date_precision": "day",
    "date_approximate": false,
    "language": "Tajik",
    "tags": ["oral history"],
    "people": ["Zarina T."],
    "description": null
  },
  "rights": {
    "rights_note": null,
    "sensitivity_note": null
  }
}
```

This is a complete replacement of the editor-managed metadata and rights fields, despite using `PATCH`:

- `revision`, every listed `metadata` field, and both `rights` fields are required.
- Unknown fields are rejected.
- `title` and every tag/person value must be non-empty after trimming.
- Empty nullable strings normalize to `null`.
- A successful request increments the revision and returns it.

### Save document page curation

```text
PUT /api/objects/:object_id/curation/document
```

```json
{
  "revision": 5,
  "pages": [
    { "page_number": 1, "curated_text": "Corrected OCR text" }
  ]
}
```

This is a partial upsert of submitted document pages, despite using `PUT`:

- `revision` and a non-empty `pages` array are required.
- Only supplied pages change; omitted curated pages remain unchanged.
- Page numbers must be unique and exist in the current projection.
- `curated_text` may be empty when the user deliberately clears a page.
- A successful request increments the revision once and returns it.

### Publish curated OCR

```text
POST /api/objects/:object_id/curation/submit
```

```json
{
  "revision": 6,
  "review_note": "Corrected names and page order."
}
```

The UI labels this action **Publish curated OCR**. The legacy endpoint and `review_note` field names remain unchanged for transport compatibility. There is no human reviewer queue: the optional publication note is audit context stored in edit history.

Publication is available only for document objects with a non-empty OCR page projection. Documents without projected pages may still save metadata, but the editor displays an OCR-unavailable explanation and disables publication. The action is revision-guarded, creates or returns an asynchronous `curation_apply` request, and returns the resulting revision.

The editor queries the latest object-scoped `curation_apply` request to display `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, or `CANCELED`. It polls through the same-origin publication-status gateway instead of invalidating the editor load, because reloading `GET /edit` would renew the edit lock.

### Close editor

```text
DELETE /api/objects/:object_id/edit-lock
```

Call the UI's same-origin edit-lock gateway on navigation and before unload. A successful response is always `200` with `{ object_id, released }`; `released: false` means the current user did not own the lock.

## Error Handling

### Foreign lock

Mutation requests return `423 LOCKED` when another user owns the active lock:

```json
{
  "request_id": "uuid",
  "error": {
    "code": "LOCKED",
    "message": "Object is currently being edited by another user.",
    "details": {
      "locked_by": "10000000-0000-0000-0000-000000000002",
      "locked_until": "2026-08-04T12:00:00.000Z"
    }
  }
}
```

Do not retry automatically. Preserve unsaved local values and offer a refresh/recovery path.

### Stale revision

Mutation requests return `409 REVISION_CONFLICT` when the supplied revision is no longer current:

```json
{
  "request_id": "uuid",
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Object metadata revision is stale.",
    "details": {
      "latest_revision": 7
    }
  }
}
```

The message varies by operation; `error.code` and `error.details.latest_revision` are the stable contract. Refetch `GET /edit`, preserve local changes where possible, and ask the user to review before retrying.

### Validation failure

Invalid metadata or page payloads return `422 VALIDATION_FAILED` with field paths in `error.details[]`:

```json
{
  "request_id": "uuid",
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed.",
    "details": [
      { "path": "metadata.title", "code": "TOO_SMALL" }
    ]
  }
}
```

Map supported paths to inline form errors. Preserve the request ID for generic failures.

## Multi-Tab Behavior

The same user can hold the lock in multiple tabs. Revision checks still apply: the first successful write increments the revision and a tab using the prior revision receives `409 REVISION_CONFLICT`.

## References

- Backend API reference: `osimi-backend/docs/api-reference.md`
- Backend UI contract: `osimi-backend/docs/object-editing-ui-contract.md`
- Frontend API reference: `docs/api-reference.md`
