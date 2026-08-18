# UM-122 Post-Review Authoritative Smoke Gate Evidence

- Date: 2026-08-18
- Branch: `redesign`
- Base commit: `0723de0` ("harden release smoke checks and verification"; implementation committed before this authoritative run)
- Working directory: `osimi-archive-ui`
- Worktree state: dirty by design (pre-existing user-owned changes plus the remediation workstream); this gate validates the working-tree state as-is. `git diff --check` and `git diff --cached --check` were both clean.

## Environment

- Node: v25.2.1 (project requirement is >= 20.19; host has no active-LTS install — accepted residual limitation)
- npm: 11.6.2
- Playwright: 1.62.1, Chromium present under `~/.cache/ms-playwright`
- Ports 4600/4601 verified free before the run and rebindable after
- No external backend, database, credentials, or object store needed
- No `npm install`/`npm ci` run; the user-owned `package-lock.json` modification was left untouched and excluded from all remediation commits

## Prerequisite status (verified via `umati list all` immediately before claiming)

| Task | Status |
| --- | --- |
| UM-115 | done (observable interaction outcomes) |
| UM-116 | done (errors gated through interactions; idempotent shutdown) |
| UM-117 | done (strengthened localization assertions) |
| UM-118 | done (exact route identity) |
| UM-119 | done (deployed route-boundary verification) |
| UM-120 | done (fixture contract alignment + 23 contract tests) |
| UM-121 | done (UM-107/UM-95/UM-86 chronology corrected) |

## Automated gates (run sequentially from osimi-archive-ui, all exit 0)

| Command | Result |
| --- | --- |
| `npm run check` | 0 errors, 0 warnings |
| `npm run lint` | clean |
| `npm run test` | 87 test files passed, 679 tests passed, 1 skipped (the opt-in `scripts/smoke-negative.spec.mjs`, run separately below) |
| `npm run build` | clean generated output, sync, vite build, then `verify:route-boundary`: **133 deployed files** (build/) and **134 intermediate files** (.svelte-kit/output), no prototype routes or loaders |
| `git diff --check` | clean |
| `git diff --cached --check` | clean |

## Authenticated production smoke

`SMOKE_ARTIFACT_DIR="$PWD/test-artifacts/um122" npm run smoke:auth` — **785/785 checks passed**, exit 0.

Smoke-owned services:

- Adapter-node production build on `http://127.0.0.1:4600` (`APP_BUILD_ID=um98-smoke`, build-id header verified)
- Fixture backend on `http://127.0.0.1:4601` (test-only credentials `smoke-archiver` / `um98-smoke-password`; no real secrets)

### Route x viewport x locale matrix

9 manifest routes x 3 viewports (375x667, 768x1024, 1440x900) x 2 locales (en, ru) = 54 tuples, all visited and asserted (`missing=[] unexpected=[] unasserted=[]`). Object-detail media variants (image, audio, video) run the same full per-tuple assertion set as the document route: exact route identity, no SvelteKit error page, `html lang`, no horizontal overflow, no raw translation keys, no unresolved placeholders, no raw enum codes, locale copy, route UI copy, and sentinel.

### Per-tuple assertions

1. Exact pathname identity (trailing-slash normalized; unexpected query strings fail; hash ignored)
2. No SvelteKit error page
3. `html lang` matches the active locale
4. No horizontal overflow
5. No raw translation keys (allowlist: `notes.txt`, `e.g`) — scanned on visible text only
6. No unresolved `{placeholder}` tokens
7. No raw stable enum codes (59-token forbidden list with identifier-safe boundaries)
8. Localized copy renders: RU requires Cyrillic in visible text; EN requires the route's RU UI sentinel to be absent (locale-leak check)
9. Route UI copy renders: route-specific EN UI copy for en; route-specific RU UI copy plus a second route-specific RU phrase for ru (e.g. `/ingestion/new`: «Добавить новый материал в архив» + «Какой это тип элемента?»)
10. Route-specific sentinel present

Hidden and inert content cannot satisfy or fail these checks (`checkVisibility`-based collection, direct mixed text nodes included).

### Desktop interactions (outcome-asserted, none skipped)

| Interaction | Asserted outcome |
| --- | --- |
| new-ingestion tag removal | tag created after Enter, then absent after removal click |
| object-detail info drawer | drawer content visible after trigger, hidden after close |
| object-detail support sheet | sheet aside opened; every tab click succeeded (5 tabs of 7 sheet buttons); sheet closed |
| object-detail resync confirmation | confirmation dialog opened; POST `/resync` returned ok; localized success message visible |
| object-edit publish dialog | dialog opened; cancel required; dialog closed |

Page errors, failed requests, HTTP >=400 responses, and browser `console.error` entries are asserted **after** desktop interactions complete for the desktop viewport, so interaction-triggered failures fail the run.

### Negative gating proof

`RUN_SMOKE_NEGATIVE=1 npx vitest run --project=server scripts/smoke-negative.spec.mjs` — passed. The test runs the full smoke with `SMOKE_SABOTAGE=negative-test` injected, asserts the sabotage failure appears in output and the full manifest was still visited, and requires a nonzero exit code. Cleanup is verified in the spec (ports rebindable after each run).

### Process cleanup (verified after the runs)

- Ports 4600 and 4601 immediately rebindable.
- No smoke fixture, adapter, or coordinator process remained.
- No failure diagnostics generated: the authoritative run is a clean pass and the artifact directory was not created. If a future run fails, diagnostics land in `test-artifacts/um122/<viewport>-<locale>-<route>.png|.txt`.

## Accepted residual limitations

- Host runs Node v25.2.1 (>= 20.19 requirement satisfied; active LTS not installed on this host).
- The worktree is intentionally dirty; pre-existing user-owned changes (including `package-lock.json`) were preserved and excluded from the remediation commits. Clean-checkout dependency reproducibility through the lockfile is **not claimed** by this gate (tracked independently in the UM-123 draft).
- The fixture emulates a documented subset of the backend API (contract inventory recorded in UM-120); it does not prove backend contract conformance end to end.
- Localization checks are strong sentinel-based assertions, not a full semantic translation proof; unknown backend/user content remains allowed.
- The object-detail support-sheet "raw manifest" tab intentionally exposes raw backend payloads as a diagnostics surface; the enum-leak detector applies to the default route state by design.
- Product-behavior defects owned by UM-102, UM-103, UM-104, UM-108, UM-109 are outside this gate's authority.
- UM-72 remains `draft`; server-aware locale initialization remains a product decision.

## Authority

- This record supersedes UM-107 for **authenticated production-smoke authority** only. UM-107's historical command results are retained as such.
- UM-95 and UM-86 retain their historical focused-test records; their prior supersession wording is superseded by this record.
- This gate does not claim release authority beyond what is mechanically asserted above.
