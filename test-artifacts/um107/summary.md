# UM-107 Authoritative Release Gate Evidence

- Date: 2026-08-18
- Branch: `redesign`
- Base commit: `538dca7` ("add release verification scripts"; release scripts committed there because `package.json` at `f2bb6d5` referenced them)
- Working directory: `osimi-archive-ui`
- Worktree state: dirty by design (the UM-97 remediation workstream plus pre-existing user-owned changes); existing staged/unstaged changes were preserved. This gate validates the working-tree state as-is. `git diff --check` and `git diff --cached --check` were both clean.

## Environment

- Node: v25.2.1 (project requirement is >= 20.19; the host has no active-LTS install — recorded as an accepted residual limitation)
- npm: 11.6.2
- Playwright: 1.62.1, Chromium present under `~/.cache/ms-playwright`
- Ports 4600/4601 verified free before the run; smoke owns both and cleans up process groups
- No external backend, database, credentials, or object store needed: the smoke serves its own dependency-free fixture (`scripts/smoke-auth-fixture.mjs`) and the adapter-node production build
- No `npm install`/`npm ci` was run; the existing user-owned `package-lock.json` modification was left untouched and excluded from the release commits

## Prerequisite status (verified via `umati list all` immediately before this gate)

| Task | Status |
| --- | --- |
| UM-98 | done |
| UM-99 | done |
| UM-100 | done |
| UM-101 | done |
| UM-105 | done |
| UM-106 | done (completed 2026-08-17 with the localization remediation recorded in its description) |

## Automated gates (run sequentially from osimi-archive-ui, all exit 0)

| Command | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings |
| `npm run lint` | clean |
| `npm run test` | 83 test files, 631 tests, all passed |
| `npm run build` | clean generated output, sync, vite build, then `verify:route-boundary`: **134 generated files**, no prototype routes or loaders |
| `git diff --check` | clean |
| `git diff --cached --check` | clean |

## Authenticated production smoke

`SMOKE_ARTIFACT_DIR="$PWD/test-artifacts/um107" npm run smoke:auth` — **533/533 checks passed**, exit 0.

Smoke-owned services:

- Adapter-node production build on `http://127.0.0.1:4600` (`APP_BUILD_ID=um98-smoke`, build-id header verified)
- Fixture backend on `http://127.0.0.1:4601` (test-only credentials `smoke-archiver` / `um98-smoke-password`; no real secrets)

### Route x viewport x locale matrix

9 routes x 3 viewports (375x667, 768x1024, 1440x900) x 2 locales (en, ru) = 54 base tuples, all visited and asserted:

```
en  /                          -> mobile:ok tablet:ok desktop:ok
ru  /                          -> mobile:ok tablet:ok desktop:ok
en  /ingestion                 -> mobile:ok tablet:ok desktop:ok
ru  /ingestion                 -> mobile:ok tablet:ok desktop:ok
en  /ingestion/new             -> mobile:ok tablet:ok desktop:ok
ru  /ingestion/new             -> mobile:ok tablet:ok desktop:ok
en  /ingestion/[batchId]       -> mobile:ok tablet:ok desktop:ok
ru  /ingestion/[batchId]       -> mobile:ok tablet:ok desktop:ok
en  /ingestion/[batchId]/setup -> mobile:ok tablet:ok desktop:ok
ru  /ingestion/[batchId]/setup -> mobile:ok tablet:ok desktop:ok
en  /ingestion/[batchId]/review-> mobile:ok tablet:ok desktop:ok
ru  /ingestion/[batchId]/review-> mobile:ok tablet:ok desktop:ok
en  /objects                   -> mobile:ok tablet:ok desktop:ok
ru  /objects                   -> mobile:ok tablet:ok desktop:ok
en  /objects/[objectId]        -> mobile:ok tablet:ok desktop:ok
ru  /objects/[objectId]        -> mobile:ok tablet:ok desktop:ok
en  /objects/[objectId]/edit   -> mobile:ok tablet:ok desktop:ok
ru  /objects/[objectId]/edit   -> mobile:ok tablet:ok desktop:ok
```

Object-detail media variants exercised per tuple: document (`OBJ-20260814-DOC001`, the manifest concrete path), image (`OBJ-20260814-IMG001`), audio (`OBJ-20260814-AUD001`), video (`OBJ-20260814-VID001`).

### Per-tuple assertions

For every tuple the smoke asserts:

1. Stays on route (no post-auth redirect)
2. No SvelteKit error page
3. `html lang` matches the active locale
4. No horizontal overflow
5. No raw translation keys (allowlist: `notes.txt`, `e.g`)
6. No unresolved `{placeholder}` tokens
7. No raw stable enum codes (59-token forbidden list: availability/access/processing/curation/request statuses, object types, dashboard events, ingestion statuses; identifiers like `BATCH-20260814-DRAFT` do not false-positive — boundary excludes `[A-Za-z0-9_-]` neighbors; allowlist: PDF, OCR, EN, RU, UTC, YYYY, OK, size units)
8. Localized copy renders (Cyrillic presence for `ru`)
9. Route-specific sentinel present: EN fixture-content sentinels and RU localized UI-copy sentinels (`Панель`, `Обзор партий`, `Добавить новый материал в архив`, `Детали загрузки`, `1 · Организация`, `Шаг 03 — Проверка перед запуском`, `Каталог`, `Поддержка`, `Сохранить черновик`)

### Cross-cutting assertions

- Unauthenticated visit redirects to `/login` (3 viewports)
- Real form login succeeds (3 viewports)
- Reload preserves the `ru` locale (3 viewports)
- No page errors or failed requests (non-favicon) per viewport
- No browser `console.error` entries (hydration warnings included) per viewport

### Desktop interactions (all required, none skipped)

| Interaction | Result |
| --- | --- |
| new-ingestion tag removal | exercised |
| object-detail info drawer | exercised |
| object-detail support sheet | exercised (7 tabs clicked of 10 sheet buttons) |
| object-detail resync confirmation | exercised |
| object-edit publish dialog | exercised |

Each exercised interaction additionally passes the unresolved-placeholder check. Absence of a required trigger is a smoke failure, not a skip.

### Process cleanup (verified after the run)

- Ports 4600 and 4601 were immediately rebindable after the run.
- No smoke fixture, adapter, or coordinator process remained.
- No failure screenshots or diagnostic `.txt` files were generated: the authoritative run is a clean pass, and the artifact directory contains only this summary. If a future run fails, diagnostics land in `test-artifacts/um107/<viewport>-<locale>-<route>.png|.txt`.

### Accepted residual limitations

- Host runs Node v25.2.1 (>= 20.19 requirement satisfied; active LTS not installed on this host).
- The worktree is intentionally dirty (UM-97 remediation workstream plus pre-existing user-owned changes); this evidence validates the working-tree state. The required evidence commit is path-limited to this summary.
- The pre-existing user-owned `package-lock.json` modification was deliberately excluded from the release commits and left untouched; clean-checkout dependency reproducibility through the lockfile is therefore not asserted by this gate.
- The object-detail support-sheet "raw manifest" tab intentionally exposes raw backend payloads (including enum codes) as a diagnostics surface. The enum-leak detector applies to the default route state, not to interaction-opened diagnostic surfaces; that exclusion is by design.
- Behavior-only defects observed or previously recorded belong to UM-102, UM-103, UM-104, UM-108, UM-109 and do not block localization/release authority. No new blocking behavioral defects were observed.

## Supersession

- This record supersedes UM-95 for **production-route smoke authority** and **overall release authority** only. UM-95's focused-test evidence remains a historical record.
- UM-86's completion record receives the same authority limitation; its focused evidence remains historical.
- UM-72 remains `draft`; its limitation notes were corrected by UM-106 and server-aware locale initialization remains a product decision.
