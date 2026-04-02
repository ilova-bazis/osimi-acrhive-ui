# CLAUDE.md

Guidance for coding agents working in the Osimi Archive UI repository.

## Project Snapshot

- App type: SvelteKit 2.x web app with TypeScript.
- Framework: Svelte 5 with runes such as `$props`, `$derived`, and `$effect`.
- Styling: Tailwind CSS 4 with an archival palette and custom utility tokens.
- Tests: Vitest with separate browser and server projects.
- Domain: Osimi Digital Library ingestion, catalog, and archive operations.

## Rule Files

- Existing repo guidance: `AGENTS.md` and this `CLAUDE.md` file.
- Cursor rules: none found in `.cursor/rules/`.
- `.cursorrules`: not present.
- Copilot instructions: `.github/copilot-instructions.md` not present.
- If any of those files are added later, treat them as higher-priority repo guidance and merge them into your workflow.

## Working Norms

- Prefer reading the existing implementation before introducing new abstractions.
- Reuse existing components, services, schemas, and mappers before creating new ones.
- Keep route files focused on page data wiring and state orchestration.
- Preserve user changes in a dirty worktree; do not revert unrelated edits.

## Commands

```bash
# install deps
npm install

# local development
npm run dev

# production build and preview
npm run build
npm run preview

# type checking
npm run check
npm run check:watch

# linting
npm run lint

# full test run
npm run test

# watch-mode unit/browser tests
npm run test:unit

# run a single server test file
npx vitest run --project=server src/lib/services/apiIngestionDetailService.spec.ts

# run a single browser test file
npx vitest run --project=client src/routes/some-component.svelte.spec.ts

# run tests matching a name
npx vitest run --project=server -t "maps objects response"

# run one file with verbose isolation while debugging
npx vitest run --project=server --reporter=verbose src/lib/api/mappers/objectsMapper.spec.ts
```

## Test Project Boundaries

- `client` project runs browser tests for `src/**/*.svelte.{test,spec}.{js,ts}`.
- `server` project runs non-Svelte tests for `src/**/*.{test,spec}.{js,ts}`.
- Browser tests use Playwright Chromium in headless mode.
- Files under `src/lib/server/**` are excluded from browser tests.
- When a test file is ambiguous, pass `--project=client` or `--project=server` explicitly.

## Repo Layout

- `src/routes`: route loads, form actions, and page UI.
- `src/lib/components`: reusable presentational Svelte components.
- `src/lib/services`, `src/lib/api/schemas`, `src/lib/api/mappers`: contracts, transport validation, and DTO mapping.
- `src/lib/server`: server-only helpers; `docs/`: architecture and UI reference material.

## TypeScript Guidelines

- `strict` mode is enabled; avoid implicit `any` and loose casts.
- Prefer `type` aliases over `interface` for domain models and request/response shapes.
- Add explicit return types on exported functions and public helpers.
- Use discriminated unions or literal unions for statuses and state machines.
- Prefer narrow helper functions for normalization and DTO mapping.
- Validate transport payloads with Zod at the API boundary instead of trusting raw JSON.

## Svelte 5 Guidelines

- Use rune-style component APIs: destructure props from `$props()`.
- Type props inline with `let { ... } = $props<...>()`.
- Use `$derived` for computed values that depend on reactive inputs.
- Use `$effect` only for real side effects, not basic derivation.
- Forward extra HTML attributes via `...rest` where a base component is meant to be reusable.

## Imports and Module Boundaries

- Use `$lib/...` aliases for library imports instead of deep relative paths.
- Use SvelteKit-provided modules such as `$app/paths`, `$app/navigation`, and `$app/stores` when appropriate.
- Group imports in this order: external packages, `$app/*`, `$lib/*`, then relative imports.
- Use `import type` for type-only imports.
- Do not import server-only modules into browser-executed components.

## Naming Conventions

- Components: PascalCase, e.g. `BaseButton.svelte`, `ObjectMetadataPanel.svelte`.
- Routes: kebab-case directories with SvelteKit file names such as `+page.svelte`.
- Utilities, stores, and services: camelCase file names.
- Mock services use a `mock` prefix; API-backed services use an `api` prefix.
- Types and unions use PascalCase.
- Mapper functions commonly use `toX` and exported map functions use `mapX`.

## Service Architecture

- Define service contracts in focused files such as `src/lib/services/objects.ts`.
- Keep API implementations separate from contracts, e.g. `apiObjectsService.ts`.
- Keep mock implementations separate, e.g. `mockObjectsService.ts`.
- Export the active implementation from `src/lib/services/index.ts`.
- Keep transport concerns out of components; components should consume domain-shaped data.

## Formatting and Style

- Follow the existing file style in the area you touch; this repo currently mixes tabs and spaces in some older files.
- Prefer single quotes in TypeScript and Svelte unless the file clearly uses a different established style.
- Keep functions small and front-load guards for invalid states.
- Prefer early returns over nested `if` trees.
- Keep object literals and unions vertically formatted when they improve scanability.

## Error Handling

- Fail at boundaries, especially when validating backend responses or request payloads.
- Use typed error classes for backend/API failures when operating in shared infrastructure code.
- Preserve useful context strings for requests, e.g. `objects.detail` or `ingestions.update`.
- In domain services, return `null`/`undefined` for absent optional data and throw for actual failure states.
- In UI code, prefer explicit empty states over silent crashes.

## UI and Styling Guidance

- Keep the established archival visual language: `burnt-peach`, `pearl-beige`, `blue-slate`, `pale-sky`, and `alabaster-grey`.
- Reuse established button styling patterns such as `rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]`.
- Use existing typography utilities like `font-display` and `font-body`.
- Prefer composition of documented building blocks such as `BaseButton`, `Chip`, `StatusBadge`, and `PageHeader`.
- When adding a new reusable component, update `docs/components.md` in the same change.

## Testing Expectations

- Add or update tests when changing mapper logic, service behavior, or reusable component behavior.
- Mapper and service tests generally belong next to the implementation under `src/lib/**`.
- Browser-facing component tests should use `.svelte.spec.ts` naming.
- Non-browser logic should use `.spec.ts` or `.test.ts` naming without `.svelte`.
- Use `npm run check`, `npm run lint`, and the smallest relevant Vitest command before finishing meaningful work.

## Documentation References

- Read `docs/project.md` for product intent and domain framing.
- Read `docs/architecture.md` for backend/worker/archive system interactions.
- Read `docs/components.md` and `docs/ui-design-colors.md` when adjusting UI.

## Agent Checklist

- Confirm whether the task touches route orchestration, a reusable component, a service contract, or a transport schema.
- Make the smallest change that fits existing architecture.
- Keep browser/server boundaries intact.
- Run the narrowest useful verification command, then broaden if needed.
- Update docs when adding reusable components or changing important conventions.
