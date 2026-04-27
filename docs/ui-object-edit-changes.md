# UI Team Hand-Off: Object Editing Lock System

> **Document purpose:** This guide is for the frontend/UI development team. It explains the breaking changes to the object editing API and what you need to adjust in the client implementation.
>
> **Effective date:** 2026-04-21
> **Backend version:** Includes migration `0007_object_edit_locks.sql`

---

## What Changed (Summary)

The backend has replaced the **optimistic concurrency (revision counter)** model with an **edit lock** model.

| Before (Revision) | After (Lock) |
|-------------------|--------------|
| Client tracks `revision` integer | Client tracks nothing — backend manages lock state |
| Every edit sends `revision: N` in body | No `revision` field in any edit request body |
| Stale revision → `409 REVISION_CONFLICT` | Another user editing → `423 LOCKED` |
| `GET /edit` returns `revision: number` | `GET /edit` returns `lock: { locked, locked_by, locked_until }` |
| `GET /edit` allowed for `viewer` | `GET /edit` now requires `archiver` or `admin` |

---

## New Flow

### 1. Open Editor

```
GET /api/objects/:object_id/edit
```

**What happens:**
- Backend **auto-acquires** a 1-hour edit lock for the current user
- If the same user already holds the lock, it **extends** by 1 hour
- If another user holds the lock, the response still returns `200` but:
  - `lock.locked = true`
  - `lock.locked_by = "other-user-id"`
  - `capabilities.can_edit_metadata = false`
  - `capabilities.can_curate_text = false`
  - `capabilities.can_submit_review = false`

**Your job:** Check `lock.locked`. If `locked_by !== currentUserId`, show a read-only UI with a message like:

> "This object is currently being edited by another user. It will be available after they finish."

### 2. Edit and Save

**Metadata save:**
```
PATCH /api/objects/:object_id/metadata
Body: { metadata: {...}, rights: {...} }
// NO revision field needed
```

**Curation save:**
```
PUT /api/objects/:object_id/curation/document
Body: { pages: [...] }
// NO revision field needed
```

**Curation submit:**
```
POST /api/objects/:object_id/curation/submit
Body: { review_note: "..." }
// NO revision field needed
```

**What happens:**
- Backend checks if the current user holds the lock
- If yes → edit proceeds normally
- If another user holds the lock → `423 LOCKED`
- If lock expired → backend auto-reacquires for current user, then proceeds

**Your job:** Handle `423 LOCKED` gracefully. Show a toast/alert:

> "Another user started editing this object. Your changes could not be saved."

Then refresh the page to get the latest state.

### 3. Close Editor

```
DELETE /api/objects/:object_id/edit-lock
```

**What happens:**
- Backend releases the lock immediately
- Other users can now edit

**Your job:** Call this endpoint when:
- User clicks "Close" or "Done"
- User navigates away from the editor
- Browser tab/window closes (use `navigator.sendBeacon` or `fetch` with `keepalive`)

**Example using sendBeacon:**

```javascript
window.addEventListener('beforeunload', () => {
  const url = `/api/objects/${objectId}/edit-lock`;
  const token = getAuthToken(); // however you store it
  navigator.sendBeacon(url, JSON.stringify({}));
  // Note: sendBeacon doesn't support custom headers easily
  // Alternative: use fetch with keepalive
});
```

**Better approach with fetch keepalive:**

```javascript
window.addEventListener('beforeunload', () => {
  fetch(`/api/objects/${objectId}/edit-lock`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
    keepalive: true,
  });
});
```

---

## Response Shape Changes

### `GET /api/objects/:id/edit`

**Before:**
```json
{
  "object_id": "OBJ-...",
  "media_type": "document",
  "revision": 3,
  "curation_state": "needs_review",
  ...
}
```

**After:**
```json
{
  "object_id": "OBJ-...",
  "media_type": "document",
  "curation_state": "needs_review",
  "lock": {
    "locked": true,
    "locked_by": "10000000-0000-0000-0000-000000000001",
    "locked_until": "2026-04-21T23:00:00.000Z"
  },
  ...
}
```

**Removed:** `revision` field  
**Added:** `lock` object

### `PATCH /metadata`, `PUT /curation`, `POST /submit` Responses

**Before:**
```json
{
  "object_id": "OBJ-...",
  "revision": 4,
  "updated_at": "2026-04-21T10:00:00.000Z"
}
```

**After:**
```json
{
  "object_id": "OBJ-...",
  "updated_at": "2026-04-21T10:00:00.000Z"
}
```

**Removed:** `revision` field from all three responses

---

## Request Body Changes

### `PATCH /metadata`

**Before:**
```json
{
  "revision": 2,
  "metadata": { ... },
  "rights": { ... }
}
```

**After:**
```json
{
  "metadata": { ... },
  "rights": { ... }
}
```

### `PUT /curation/document`

**Before:**
```json
{
  "revision": 2,
  "pages": [ ... ]
}
```

**After:**
```json
{
  "pages": [ ... ]
}
```

### `POST /curation/submit`

**Before:**
```json
{
  "revision": 2,
  "review_note": "Ready"
}
```

**After:**
```json
{
  "review_note": "Ready"
}
```

---

## Error Handling

### New Error: `423 LOCKED`

```json
{
  "request_id": "uuid",
  "error": {
    "code": "LOCKED",
    "message": "Object is currently being edited by another user.",
    "details": {
      "locked_by": "10000000-0000-0000-0000-000000000002",
      "locked_until": "2026-04-21T23:00:00.000Z"
    }
  }
}
```

**When it happens:**
- `GET /edit` — response is `200`, not `423`. Check `lock.locked` in the body.
- `PATCH /metadata`, `PUT /curation`, `POST /submit` — actual HTTP `423` status.

**What to do:**
1. Show a non-dismissible modal/toast explaining the conflict
2. Offer "Refresh" button to reload the editor
3. Do NOT retry automatically — the other user may still be editing

### Removed Error: `409 REVISION_CONFLICT`

This error no longer occurs for edit endpoints. You can remove all `REVISION_CONFLICT` handling from the editing UI code.

---

## Role Changes

| Endpoint | Before | After |
|----------|--------|-------|
| `GET /api/objects/:id/edit` | `viewer`, `archiver`, `admin` | `archiver`, `admin` only |

**Impact:** Viewer users can no longer access the edit screen at all. They will get `403 FORBIDDEN`.

---

## Implementation Checklist

- [ ] Remove `revision` tracking from all edit-related state (Redux, Vuex, etc.)
- [ ] Remove `revision` from request bodies for `PATCH /metadata`, `PUT /curation`, `POST /submit`
- [ ] Update `GET /edit` response parsing: read `lock` object instead of `revision`
- [ ] Add `lock.locked` check after `GET /edit`: show read-only UI if locked by another user
- [ ] Implement `DELETE /edit-lock` call on editor close/navigation
- [ ] Add `beforeunload` handler to release lock when tab closes
- [ ] Replace `409 REVISION_CONFLICT` handling with `423 LOCKED` handling
- [ ] Ensure viewer users cannot navigate to the editor (or handle `403` gracefully)
- [ ] Remove `revision` display from UI if you were showing it

---

## Edge Cases

### Same user, multiple tabs
If the same user opens the editor in two tabs:
- Tab 1 acquires lock
- Tab 2 calls `GET /edit` → extends the lock (same user)
- Both tabs can edit
- Last save wins (no conflict detection)

**Recommendation:** Warn users about unsaved changes when opening a second tab.

### Lock expires while editing
If the user is inactive for >1 hour:
- Lock expires automatically
- Next save attempt → backend auto-reacquires lock for same user → succeeds
- User doesn't see any error

### Browser crash / no lock release
If the browser crashes and `DELETE /edit-lock` is never called:
- Lock expires after 1 hour automatically
- Other users can edit after that

---

## Questions?

Contact the backend team if you need clarification on:
- Lock timing / heartbeat behavior
- Error response shapes
- Migration timing (when this goes live)
