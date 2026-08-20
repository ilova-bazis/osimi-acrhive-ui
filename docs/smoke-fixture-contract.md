# Smoke Fixture Contract

`scripts/smoke-auth-fixture.mjs` is a deterministic backend fixture for authenticated UI smoke tests. It implements only the endpoints and behaviors exercised by those tests; it is not a general backend emulator.

## Server Lifecycle

- Importing `smoke-auth-fixture.mjs` has no network or process-handler side effects.
- `createFixtureListener(options)` returns an HTTP request listener.
- `createFixtureServer(options)` returns an unbound `node:http` server. Tests bind it to port `0`.
- Running the module directly binds `SMOKE_FIXTURE_PORT` (default `4601`) on `127.0.0.1` and installs shutdown handlers.

## Upload Lifecycle

`POST /api/ingestions/:id/files/presign` accepts `filename`, `content_type`, and positive integer `size_bytes`. Every call creates a unique UUID-shaped file ID and upload token. Its response contains:

- an upload URL scoped by the opaque token;
- a one-hour `expires_at` value;
- exact `content-type` and `content-length` upload headers.

`PUT /smoke-upload/:token` reads and retains the actual request bytes. The content type and byte length must match the presign. Successful responses include the configured UI CORS origin and a SHA-256 ETag. Unknown, expired, mismatched, deleted, and already committed uploads are rejected.

`POST /api/ingestions/:id/files/commit` requires the presigned file to have a successful PUT. A commit before PUT returns `409`. The supplied SHA-256 checksum must match the retained bytes. The response reports the actual byte length and checksum. A file can be committed once.

`DELETE /api/ingestions/:id/files/:fileId` removes the file, upload token, retained bytes, and committed state. Upload preflight supports `PUT, OPTIONS`, the required content headers, a five-minute max age, and the configured UI CORS origin.

## Binary Responses

Artifact IDs are UUID-shaped and unique across fixture objects. Artifact metadata `size_bytes` equals the bytes returned by its view endpoint, and object thumbnail references identify artifacts belonging to that object.

`GET /api/objects/:objectId/artifacts/:artifactId/view` supports one byte range, strong ETag and HTTP-date `If-Range`, suffix ranges, and complete `206`/`416` response headers. Stale `If-Range` validators and malformed or multiple ranges produce the full `200` response.

Ranges are intentionally not applied to artifact downloads or ingestion previews. Downloads are full `200` attachment responses; previews are full `200` responses.

## Validated Values

Ingestion capabilities use the backend media-kind enum: `image`, `audio`, `video`, and `document`. Resync responses use archive action type `object_resync`.

`GET /api/archive-requests` accepts the documented `limit`, `cursor`, `sort`, `target_type`, `target_id`, `action_type`, `status`, `active_only`, and `include_payload` filters. Enum values, booleans, limits, object target IDs, target dependencies, and unknown filter names are validated. `active_only=true` takes precedence over explicit status filters.

## Deliberate Exclusions

- Persistent storage, concurrent upload locking, multipart uploads, and re-presigning existing files.
- Multiple byte ranges and multipart range responses.
- Full backend authorization, ingestion-state, media-compatibility, pagination-cursor, and archive-worker behavior.
- Production download range support, which the backend API currently does not provide.
