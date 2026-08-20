# UM-133 Replacement Authenticated-Smoke Gate Evidence

- Date: 2026-08-20
- Branch: `redesign`
- Implementation commit: `c06bdc4` (`complete authenticated smoke recovery`)
- Working directory: `osimi-archive-ui`
- Acceptance matrix: `test-artifacts/um124/acceptance-matrix.md`
- Worktree state: dirty only for protected pre-existing files after the implementation commit; those files were not staged or modified for this evidence commit

## Environment

- Node: v25.2.1 (project requirement `>=20.19` satisfied; active LTS is not installed on this host)
- npm: 11.6.2
- Playwright: 1.62.1
- Adapter and fixture ports: 4600 and 4601, verified rebindable after the final run
- No external backend, database, credentials, or object store used
- No `npm install` or `npm ci` run

## Sequencing

The implementation and acceptance matrix were committed before this gate as `c06bdc4`. UM-125, UM-126, UM-127, UM-128, UM-129, UM-130, UM-131, and UM-132 were complete before UM-133 started. This evidence file is committed separately from implementation.

## Authoritative Commands

All commands below ran sequentially from `osimi-archive-ui` after `c06bdc4` and exited 0.

| Command | Result |
| --- | --- |
| `npx vitest run --project=server scripts/smoke-checks.spec.mjs scripts/verify-route-boundary.spec.mjs scripts/smoke-fixture-routes.spec.mjs` | 3 files, 69/69 tests passed |
| `npx vitest run --project=client scripts/smoke-dom.browser.spec.mjs` | 1 file, 7/7 tests passed |
| `RUN_SMOKE_NEGATIVE=1 npx vitest run --project=server scripts/smoke-negative.spec.mjs` | 1 file, 4/4 tests passed in 303.85 s |
| `npm run check` | 0 errors, 0 warnings |
| `npm run lint` | clean |
| `npm run test` | 87 files passed, 1 opt-in file skipped; 707 tests passed, 4 skipped |
| `npm run build` | production build passed; route boundary verified 23 routes, 133 deployed files, and 134 intermediate files |
| `git diff --check` | clean |
| `git diff --cached --check` | clean |
| `SMOKE_ARTIFACT_DIR="$PWD/test-artifacts/um133" npm run smoke:auth` | 865/865 checks passed, exit 0 |

## Defect-Specific Negative Proof

The opt-in negative suite runs real production-smoke subprocesses and requires the named diagnostic plus a nonzero or exact exit code. It no longer uses generic `SMOKE_SABOTAGE`.

| Fault | Required rejection |
| --- | --- |
| `route-origin` | Exact route identity rejects a matching path on another origin |
| `visible-localization` | Visible RU copy in EN fails localization while hidden/inert content remains excluded |
| `tag-removal-stuck` | Tag remains present and the interaction fails |
| `info-drawer-absent` | Drawer does not open and the interaction fails |
| `info-drawer-close-stuck` | Drawer remains visible and the interaction fails |
| `support-sheet-stale` | A clicked tab does not render its expected scoped panel content |
| `resync-http` | The observed POST returns 503 and reports the explicit status |
| `publish-close-stuck` | Publish dialog remains visible after cancel |
| `console-error` | Post-interaction console error appears in the settled error drain |
| `page-error` | Post-interaction page error appears in the settled error drain |
| `request-abort` | Aborted request appears in the settled error drain |
| `http-error` | HTTP 503 response appears in the settled error drain |
| `child-exit` | Unexpected fixture exit reports its process diagnostic and exits nonzero |
| `shutdown-race` | Repeated shutdown requests preserve the highest requested exit code, 7 |

The combined interaction/error run still visits the full route/viewport/locale manifest. Subsequent negative subprocesses and the final explicit check prove cleanup by rebinding ports 4600 and 4601.

## Positive Production Smoke

- Adapter-node production build served `APP_BUILD_ID=um98-smoke` and the build ID header matched.
- Nine manifest routes across mobile, tablet, and desktop in EN and RU were all visited and asserted; `missing=[]`, `unexpected=[]`, `unasserted=[]`.
- Document, image, audio, and video object-detail variants received the full assertion set.
- Route identity checks verify origin, exact normalized pathname, and query policy; unauthenticated navigation redirects exactly to same-origin `/login`.
- Localization, raw-key, placeholder, enum, UI-copy, and route sentinels use visible, non-inert text with ancestor opacity/visibility handling.
- Error drains pass after every route, after every desktop interaction, and before each browser context closes.
- Tag removal, scoped info drawer, four scoped support-sheet panels, resync POST/success state, and publish cancellation all pass with observable outcomes.

## Boundary And Fixture Proof

- Route-boundary policy is centralized across ESLint and generated verification.
- Verification fails closed for missing/empty build entry, missing/empty/invalid route manifest, empty artifact scans, forbidden source roots/files/imports/routes, and forbidden generated tokens.
- The production build contains 23 valid route IDs and no forbidden prototype route/source/loader material across 133 deployed and 134 intermediate files.
- The fixture tests an explicit presign-upload-commit-delete lifecycle over HTTP with unique IDs/tokens, expiry, CORS, checksums, sizes, ownership, filters, enum values, range/If-Range/416 behavior, and endpoint-appropriate range support.
- The supported fixture subset and exclusions are documented in `docs/smoke-fixture-contract.md`.

## Exclusions And Residuals

- `package-lock.json`, clean-install reproducibility, and UM-123 are independent and non-blocking; no lockfile authority is claimed.
- The fixture is not a full backend and does not prove end-to-end backend conformance.
- Sentinel checks do not constitute complete semantic translation review.
- Independent product behavior owned by UM-102, UM-103, UM-104, UM-108, and UM-109 remains outside this gate.
- Protected dirty files preserved outside both commits: `.umati/events/events.jsonl`, `CLAUDE.md`, `package-lock.json`, `execution_plan_tmp.md`, and `segments.txt`.

## Authority

This replacement gate supplies authenticated production-smoke authority for the mechanical scope above. It supersedes the suspended authenticated-smoke authority claims in UM-122 and the earlier UM-107, UM-95, and UM-86 records while preserving their historical results. It does not claim release authority outside the tested scope or any excluded area above.
