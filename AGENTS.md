# AGENTS.md

Guidelines for AI agents working on the Osimi Archive UI codebase.

## Project Overview

- **Type**: SvelteKit 2.x + TypeScript web application (Osimi Digital Library)
- **Framework**: Svelte 5 with runes (`$props`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS 4 with custom archival color palette
- **Test**: Vitest with Playwright (browser) and Node (server) projects

## Build/Lint/Test Commands

```bash
# Development
npm run dev              # Start dev server

# Build
npm run build            # Production build
npm run preview          # Preview production build

# Type checking
npm run check            # Svelte + TypeScript check
npm run check:watch      # Watch mode

# Linting
npm run lint             # ESLint all files

# Testing
npm run test             # Run all tests (CI mode)
npm run test:unit        # Run tests in watch mode

# Run single test file
npx vitest run src/path/to/file.spec.ts
npx vitest run src/path/to/file.svelte.spec.ts

# Run tests for specific project
npx vitest run --project=client   # Browser tests only
npx vitest run --project=server   # Node tests only
```

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - no implicit any
- Use `type` (not `interface`) for data models
- Export types from `src/lib/types.ts` and `src/lib/models.ts`
- Prefer explicit return types on exported functions
- Use discriminated unions for status/state types
- Single quotes for strings

### Svelte 5 Components
```svelte
<script lang="ts">
  let { prop1, prop2, children, ...rest } = $props<{
    prop1: string;
    prop2?: number;
    children?: () => unknown;
  }>();

  const derived = $derived(computedValue);

  $effect(() => {
    // side effects
  });
</script>
```

- Destructure props with `$props()` rune
- Use `children` as render prop: `children?: () => unknown`
- Use `...rest` for spreading additional attributes
- Optional props have `?` marker

### Naming Conventions
- **Components**: PascalCase (`BaseButton.svelte`, `FileListPanel.svelte`)
- **Routes**: kebab-case directories (`ingestion/new/+page.svelte`)
- **Utilities/Stores**: camelCase (`session.ts`, `mockObjectsService.ts`)
- **Types**: PascalCase (`FileStatus`, `BatchDefaults`)

### Imports
- Use `$lib/` alias for lib imports
- Use SvelteKit `$app/stores`, `$app/navigation` for framework features
- Group: external libs → $lib/* → relative

### Styling (Tailwind)
Design system colors (archival warmth):
- `burnt-peach` (#dd6e42) - Attention/warnings
- `pearl-beige` (#e8dab2) - Archival warmth
- `blue-slate` (#4f6d7a) - Structure/primary
- `pale-sky` (#c0d6df) - Selection/hover
- `alabaster-grey` (#eaeaea) - Neutral background

Button patterns: `rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]`
Custom utilities: `font-display` (Fraunces), `font-body` (Manrope)

### Testing

**Browser tests** (`.svelte.spec.ts`):
```typescript
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import { render } from 'vitest-browser-svelte';

const heading = page.getByRole('heading', { level: 1 });
await expect.element(heading).toBeInTheDocument();
```

**Server tests** (`.spec.ts`):
```typescript
import { describe, it, expect } from 'vitest';
```

### Service Architecture
- Interface in `service.ts` (e.g., `dashboard.ts`)
- Mock in `mockService.ts` (e.g., `mockDashboardService.ts`)
- Barrel export from `index.ts` to switch real/mock

### Error Handling
- Return `null` or `undefined` for missing data
- Use discriminated unions for error states
- Prefer early returns over nested conditionals

## Project Structure

```
src/
├── routes/           # SvelteKit file-based routing
│   ├── +layout.svelte
│   ├── +page.svelte
│   └── [route]/+page.svelte
├── lib/
│   ├── components/   # Reusable Svelte components
│   ├── services/     # Data services (interface + mock)
│   ├── api/          # API client functions
│   ├── auth/         # Authentication logic
│   ├── models.ts     # Domain models
│   └── types.ts      # Shared types
└── app.html
```

## Documentation

Project specs in `/docs/`:
- `project.md` - Design principles, data model
- `ui-design-colors.md` - Color palette
- `components.md` - Component API docs
- `*-screen*.md` - Screen specifications
