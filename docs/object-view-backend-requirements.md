# Object View Backend Requirements

This document describes the backend changes needed to support the next stage of the object view experience in the Osimi Digital Library.

It builds on the current access and availability model in `docs/objects-access-availability-model.md` and focuses on what the backend must provide so the frontend can render a true media-first object page without relying on heuristics.

## Why This Change Is Needed

The current object detail API is good enough to show:

- object metadata
- access status at a high level
- a list of available files
- a list of archive requests

That is enough for a file-oriented detail page, but not enough for the object-view experience we want.

The frontend currently has to guess too much:

- which file is the primary file for viewing
- which preview artifacts are intentionally available now
- whether a request should unlock reading, viewing, listening, or watching
- which active request is relevant to the media currently shown
- what viewer payload is available for a given media type

This creates several problems:

1. The UI becomes heuristic-driven instead of contract-driven.
2. The object page feels like file management rather than media viewing.
3. Different media types cannot be rendered confidently from backend data.
4. Request flow and playback/viewing flow cannot be integrated cleanly.
5. The frontend cannot know when to show a real viewer versus a gated preview shell.

## Product Goal

The goal is to make the object page media-first, read-only, and access-aware.

That means the backend must let the frontend answer these questions directly:

- What is this object's media type?
- What can the user inspect immediately?
- What is the primary source needed to read/view/listen/watch the object?
- Is that primary source available now, requestable, pending, restricted, or unavailable?
- Is there an active request already in progress for the relevant media?
- If the media is available, what structured payload should power the viewer?

The desired frontend behavior is:

- show a real viewer when media is available
- show a request gate in the media canvas when access must be requested
- keep preview artifacts visible while the primary media is unavailable
- avoid presenting the object as a raw list of files

## What We Have Today

Current object detail responses expose useful primitives:

- `processing_state`
- `curation_state`
- `availability_state`
- `access_level`
- `can_download`
- `access_reason_code`
- `available_files[]`
- `pending_requests[]`

This is enough for phase 1, where the frontend derives a best-effort access summary.

It is not enough for phase 2 because the backend does not yet explicitly provide:

- canonical media type for the viewer
- canonical primary source for playback/viewing
- structured preview artifacts
- request state tied to the primary source
- media-specific viewer payload

## Backend Change Goals

The backend changes should achieve the following:

1. Remove frontend heuristics for primary media selection.
2. Expose a stable media-view contract designed for object viewing, not file inspection.
3. Keep access policy and media deliverability explicit and separate.
4. Support all current object media types:
   - document
   - image
   - audio
   - video
5. Support a read-only preview-first flow where thumbnails, OCR, transcripts, captions, or posters may be available before the primary media is available.

## Proposed API Direction

Recommended approach: add a dedicated object-view payload instead of overloading the existing detail contract.

Preferred endpoint:

- `GET /api/objects/:object_id/view`

Alternative:

- extend `GET /api/objects/:object_id`

Recommendation: use a dedicated `/view` endpoint because it gives us a clear contract for media rendering and lets the existing detail endpoint remain stable for broader object administration needs.

## Proposed Response Shape

```ts
type ObjectViewResponse = {
  object: {
    id: string;
    object_id: string;
    title: string | null;
    type: string;
    processing_state: string;
    curation_state: string;
    availability_state: string;
    access_level: 'private' | 'family' | 'public';
    access_reason_code: 'OK' | 'FORBIDDEN_POLICY' | 'EMBARGO_ACTIVE' | 'RESTORE_REQUIRED' | 'RESTORE_IN_PROGRESS' | 'TEMP_UNAVAILABLE';
    can_download: boolean;
    is_authorized: boolean;
    is_deliverable: boolean;
    embargo_until: string | null;
    rights_note: string | null;
    sensitivity_note: string | null;
    language: string | null;
    tags: string[];
    metadata: Record<string, unknown>;
    ingest_manifest: Record<string, unknown> | null;
  };
  media_view: {
    media_type: 'document' | 'image' | 'audio' | 'video';
    primary_source: {
      available_file_id: string | null;
      display_name: string;
      artifact_kind: string;
      variant: string | null;
      content_type: string | null;
      size_bytes: number | null;
      deliverability_state: 'available' | 'request_required' | 'request_pending' | 'restricted' | 'temporarily_unavailable';
      reason_code: 'OK' | 'FORBIDDEN_POLICY' | 'EMBARGO_ACTIVE' | 'RESTORE_REQUIRED' | 'RESTORE_IN_PROGRESS' | 'TEMP_UNAVAILABLE';
    } | null;
    preview_artifacts: Array<
      | {
          kind: 'thumbnail';
          available: boolean;
          image_url: string | null;
        }
      | {
          kind: 'poster';
          available: boolean;
          image_url: string | null;
        }
      | {
          kind: 'access_pdf';
          available: boolean;
          artifact_id: string | null;
        }
      | {
          kind: 'ocr';
          available: boolean;
          artifact_id: string | null;
          page_count: number | null;
        }
      | {
          kind: 'transcript';
          available: boolean;
          artifact_id: string | null;
        }
      | {
          kind: 'captions';
          available: boolean;
          artifact_id: string | null;
        }
    >;
    active_request: {
      id: string;
      action_type: string;
      status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
      created_at: string;
      updated_at: string;
      completed_at: string | null;
    } | null;
    viewer_payload: {
      document?: {
        page_count: number;
        pages: Array<{
          id: string;
          page_number: number;
          image_url: string;
          width: number | null;
          height: number | null;
          ocr_text: string | null;
        }>;
      };
      image?: {
        image_url: string;
        width: number | null;
        height: number | null;
      };
      audio?: {
        stream_url: string;
        duration_seconds: number | null;
        waveform: number[] | null;
        transcript: Array<{
          id: string;
          start_seconds: number;
          end_seconds: number;
          text: string;
          speaker: string | null;
        }> | null;
      };
      video?: {
        stream_url: string;
        poster_url: string | null;
        duration_seconds: number | null;
        transcript: Array<{
          id: string;
          start_seconds: number;
          end_seconds: number;
          text: string;
          speaker: string | null;
        }> | null;
        subtitles: Array<{
          id: string;
          start_seconds: number;
          end_seconds: number;
          text: string;
        }> | null;
      };
    };
  };
}
```

## Required Backend Responsibilities

### 1. Expose `media_type` for viewing

The backend should map archive object classification into one of:

- `document`
- `image`
- `audio`
- `video`

This should be authoritative. The frontend should not infer media type from MIME guesses, tags, or available file patterns.

### 2. Expose `primary_source`

The backend must choose the canonical file used for actual consumption.

Examples:

- document: access PDF or canonical document renderable
- image: canonical viewable image derivative or original image
- audio: canonical listening derivative or stream source
- video: canonical streaming derivative or stream source

The frontend should no longer guess this from `artifact_kind`, `variant`, or `content_type`.

### 3. Expose `preview_artifacts`

Preview artifacts should be explicit and typed.

Examples:

- document: thumbnail, OCR, access PDF
- image: thumbnail
- audio: transcript, thumbnail
- video: poster, transcript, captions

This allows the frontend to say “available now” in a contract-driven way.

### 4. Expose a media-specific `deliverability_state`

Object-level access is useful, but the media viewer needs the state of the primary source.

Required values:

- `available`
- `request_required`
- `request_pending`
- `restricted`
- `temporarily_unavailable`

This should align with, but not duplicate blindly, object-level access state.

### 5. Expose the relevant active request

The frontend needs a single request object relevant to the primary media source.

Today the UI gets a general list of pending requests. For the media viewer, it needs:

- whether the primary source already has an active request
- the current request status
- timestamps for user messaging and refresh behavior

If there are multiple requests, the backend should choose the most relevant active request for the primary source.

### 6. Expose `viewer_payload`

The frontend needs a structured, ready-to-render payload per media type.

#### Document

Needed for a continuous reader:

- page count
- page image URLs
- page order
- optional per-page OCR text
- optional page dimensions

#### Image

Needed for a zoomable viewer:

- canonical image URL
- optional dimensions

#### Audio

Needed for a playable reader:

- stream URL
- duration
- optional waveform data
- optional transcript segments

#### Video

Needed for a playable viewer:

- stream URL
- poster URL
- duration
- optional transcript segments
- optional subtitle/caption segments

## Request Behavior Changes

The current request flow can remain, but the backend should support a cleaner media-view contract.

### Current behavior

- frontend submits `available_file_id` to request delivery

### Needed behavior

At minimum:

- keep `available_file_id` request support
- ensure `primary_source.available_file_id` is always the correct target for media access

Nice to have later:

- support a dedicated request endpoint for media view, for example:
  - `POST /api/objects/:object_id/view/request`

That endpoint could remove the need for frontend knowledge of low-level file identifiers.

## Transition and Refresh Behavior

To support a responsive UI, the backend should ensure:

1. After request submission, the object-view payload reflects `request_pending` quickly.
2. Once the source is ready, the payload transitions to `available`.
3. `active_request` remains populated while request is in progress.
4. `viewer_payload` becomes available only when the source is actually consumable.

This will let the frontend poll or invalidate data safely without inventing state on the client.

## Implementation Notes

### Keep object detail and object view contracts separate

Do not try to overload every object detail field with viewer-specific meaning.

The object detail endpoint should remain useful for:

- metadata inspection
- file inspection
- requests/history
- operational/admin views

The object-view endpoint should be optimized for:

- media rendering
- request gating
- preview-first read-only viewing

### Preserve explicit access semantics

The backend should continue to expose separate dimensions:

- processing state
- curation state
- availability state
- policy/access decision
- media deliverability state for the viewer

Do not collapse these into a single status field.

## Minimum Backend Work Needed For Frontend Phase 2

If we want to start phase 2 with the document viewer first, the minimum required backend additions are:

1. Add `GET /api/objects/:object_id/view`
2. Return `media_type`
3. Return `primary_source`
4. Return `preview_artifacts`
5. Return `active_request`
6. Return `viewer_payload.document.pages[]`

That is enough to build a real document reader with access gating while keeping the same design direction for image/audio/video later.

## Suggested Delivery Order

### Milestone 1: contract foundation

- add new endpoint
- add `media_type`
- add `primary_source`
- add `preview_artifacts`
- add `active_request`

### Milestone 2: document support

- add `viewer_payload.document`
- verify request transitions from pending to available

### Milestone 3: image support

- add `viewer_payload.image`

### Milestone 4: audio/video support

- add `viewer_payload.audio`
- add `viewer_payload.video`

## Open Questions For Backend Design

1. Should `primary_source` always be a derivative/streaming asset when available, even if an original exists?
2. Should `viewer_payload` include signed URLs directly, or opaque resource IDs resolved by a second endpoint?
3. Should transcripts and OCR be embedded in `viewer_payload`, or referenced as artifact resources?
4. Should `active_request` include progress metadata in the future, or remain a coarse status object?

## Recommendation

The backend should introduce a dedicated object-view contract and make the primary viewing source explicit.

That is the key change that unlocks the next frontend step.

Without it, the frontend can approximate access state, but it cannot deliver a reliable, polished, media-first object experience across document, image, audio, and video objects.
