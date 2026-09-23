# UM-110 and UM-111 Implementation Handoff

## Purpose

This document is the execution handoff for the final two ready Umati tasks:

1. UM-110: move the language switch to a better desktop location.
2. UM-111: clarify ingestion batch defaults, add object/default comparison cues, separate policies from metadata defaults, and streamline one-object batches.

The implementing agent should be able to execute both tasks without access to the planning conversation.

## Required Sequence

Execute the tasks strictly in this order:

1. Complete UM-110, including focused and full verification.
2. Claim and start UM-111 only after UM-110 passes all gates.
3. Complete UM-111, including focused and full verification.

UM-110 changes authenticated shell geometry, including the available height of the ingestion Setup page. UM-111 should be implemented against that final shell geometry rather than requiring a second Setup height adjustment.

## Task Lifecycle

Use the Umati CLI only. Never edit `.umati` task files directly.

Run Umati commands from:

`/home/bazis/coding/projects/osimi-archive`

For UM-110:

```bash
umati show UM-110
umati claim UM-110 --agent <executing-agent>
umati start UM-110 --agent <executing-agent>
```

After every UM-110 gate passes:

```bash
umati complete UM-110 --agent <executing-agent>
```

Then repeat for UM-111:

```bash
umati show UM-111
umati claim UM-111 --agent <executing-agent>
umati start UM-111 --agent <executing-agent>
```

After every UM-111 gate passes:

```bash
umati complete UM-111 --agent <executing-agent>
```

Use the actual Umati identity accepted by the workspace, such as `opencode`, `codex`, or `claude`.

Do not mark either task done if required tests, type checking, linting, build, route-boundary verification, or documentation remain incomplete.

## Repository and Worktree State

Frontend repository:

`/home/bazis/coding/projects/osimi-archive/osimi-archive-ui`

Current branch:

`redesign`

The frontend worktree is heavily modified by completed and concurrent work. Several files required by UM-110 and UM-111 already contain unrelated changes. The implementing agent must inspect current contents and diffs before patching and must preserve all unrelated work.

Known dirty target areas include:

- `src/routes/+layout.svelte`
- `src/routes/layout.svelte.spec.ts`
- `src/routes/layout.css`
- `src/routes/ingestion/[batchId]/setup/+page.svelte`
- `src/routes/ingestion/[batchId]/setup/page.svelte.spec.ts`
- `src/lib/i18n/translations.ts`
- `src/lib/i18n/translations.spec.ts`
- `docs/components.md`

Do not reset, revert, reformat wholesale, or overwrite those files.

Backend repository:

`/home/bazis/coding/projects/osimi-archive/osimi-backend`

Neither task requires backend changes.

Do not create a commit unless the user explicitly requests one.

## Current Verification Baseline

The frontend baseline immediately before this handoff passed:

- `npm run check`: 0 errors and 0 warnings.
- `npm run lint`: passed.
- `npm run test`: 936 passed and 4 skipped.
- `npm run build`: passed.
- Route-boundary verification: passed.
- `git diff --check`: passed.

Any regression from that baseline must be investigated. Do not hide unrelated failures by reverting other users' work.

---

# Part I: UM-110

## Task

Title: `Location of the Language button switch`

Intent: move the authenticated desktop language switch from the left sidebar to a better top-right location.

## Approved Product Decisions

- Authenticated desktop placement: shell-owned content-column top-right utility row.
- Desktop row behavior: normal flow, not sticky and not fixed.
- Mobile authenticated placement: unchanged in `AppMobileHeader`.
- Login placement: unchanged at the top-right of the login card.
- Ownership: the root authenticated shell owns desktop placement; individual pages do not.
- Exactly one language switch may be visible and accessibility-exposed at a time.
- Execute UM-110 before UM-111.

## Current Placement

### Desktop authenticated shell

`LocaleSwitcher` is currently imported and rendered in:

`src/lib/components/AppSidebar.svelte`

The control appears after navigation/active batches and before the user profile. Its vertical position changes with sidebar content, and it is on the left rather than the requested top-right.

### Mobile authenticated shell

`src/lib/components/AppMobileHeader.svelte` already renders:

- Brand at the left.
- Locale switch and logout at the right.
- Navigation in a second row.

This is already the desired mobile behavior and must remain unchanged.

### Login

`src/routes/login/+page.svelte` owns its own locale switch because public routes bypass the authenticated shell. It is already right-aligned at the top of the login card and must remain unchanged.

### Root shell

`src/routes/+layout.svelte` currently renders:

- Desktop sidebar in the first grid column.
- Mobile header in the content column, hidden at `lg`.
- Route content inside `.app-route-scrollport`.

`src/routes/layout.css` currently gives mobile a dynamic-viewport frame and route scrollport, while desktop uses document scrolling.

## Required Desktop Layout

Inside the authenticated `.app-content-column`, render this order:

1. Desktop-only utility row containing `LocaleSwitcher`, right aligned.
2. Existing mobile header, hidden at `lg` and above.
3. Existing route-content wrapper.

Conceptually:

```svelte
<div class="app-content-column">
    <div class="app-desktop-utility-row hidden lg:flex">
        <LocaleSwitcher />
    </div>
    <AppMobileHeader ... />
    <div class="app-route-scrollport" ...>
        {@render children()}
    </div>
</div>
```

Follow the repository's established formatting rather than copying the indentation above blindly.

## Why Shell-Owned Placement Is Required

Do not add the switch separately to page headers. Production pages have different and often crowded top-right controls, including:

- Dashboard actions.
- Ingestion creation actions.
- Object-list counts and filters.
- Object-detail actions.
- Object-edit status/actions.
- Ingestion Review actions.

Page-level placement would duplicate behavior, crowd headers, and create route drift.

Do not restore the obsolete `AppHeader` component.

Do not use `position: fixed` or `position: absolute`; those approaches risk covering page actions under zoom, larger text, or additional locales.

## Desktop Utility Row Styling

Add one scalable shell token in `src/routes/layout.css`:

```css
--app-desktop-utility-height: 3.75rem;
```

Use the same token as the row's rendered block height and as the route-height subtraction. A `rem` value is required so the row scales with the application's root font scale instead of clipping enlarged text.

The utility row should:

- Be hidden below `lg` using actual `display: none` behavior.
- Use an explicit shell-edge inset of `1.5rem` on desktop; `.app-content-column` currently has no inherited horizontal inset.
- Align the switch to the right.
- Have a predictable fixed block height on desktop.
- Avoid introducing another banner landmark; use a neutral `div`.
- Remain in normal document flow.
- Remain non-sticky and non-fixed. It scrolls away on document-scrolling routes; it remains visible above route-owned internal scroll panes such as Object Edit and Review, which is acceptable and does not require redesigning those workspaces.

Suggested visual treatment:

- Transparent or existing shell background.
- Subtle bottom border only if needed for separation.
- No new card, shadow, or unrelated shell redesign.

## Full-Height Route Accounting

The utility row consumes desktop vertical space. Several route roots currently assume a full viewport through `lg:h-screen` or `lg:min-h-screen`.

Adjust the routes that own exact-height or internally scrolling workspaces:

- `src/routes/objects/[objectId]/edit/+page.svelte`
- `src/routes/ingestion/new/+page.svelte`
- `src/routes/ingestion/[batchId]/setup/+page.svelte`
- `src/routes/ingestion/[batchId]/review/+page.svelte`

Object Detail currently renders a top bar before a `min-h-screen` main element and already permits document overflow. Preserve that baseline unless testing demonstrates actual clipping or overlap; do not restructure Object Detail merely to make the entire route fit one viewport.

Use one shell-aware CSS class or named calculation rather than scattering unrelated numeric `calc()` values.

Recommended design:

- Add a reusable global shell utility class in `layout.css` for desktop available height.
- At desktop, calculate route height as `100vh - var(--app-desktop-utility-height)`.
- Preserve current mobile `100dvh`/scrollport behavior.
- Use a min-height variant for routes that currently use `min-h-screen`.
- Use an exact-height variant for object edit if its current workspace requires fixed viewport height.

Do not change desktop to an internal scrollport merely to support the row. Desktop currently intentionally uses document scrolling.

After changing heights, verify that:

- Object-edit footer and lower panels remain reachable.
- Ingestion Setup footer and confirmation actions remain reachable.
- Review and New route roots do not create an unnecessary utility-row-height document overflow.
- Route-owned sticky headers remain correct in their existing scrolling context. Do not require the utility row to disappear while scrolling an internal route pane.

## UM-110 File Changes

### Required

#### `src/lib/components/AppSidebar.svelte`

- Remove the `LocaleSwitcher` import.
- Remove the sidebar locale-switch block.
- Preserve sidebar navigation, active batches, profile, logout, and spacing.

#### `src/routes/+layout.svelte`

- Import `LocaleSwitcher`.
- Render the desktop-only utility row inside the authenticated content column.
- Do not render it for public routes.
- Keep `AppMobileHeader` behavior unchanged.

#### `src/routes/layout.css`

- Add utility-row styling and desktop height token.
- Add shell-aware route-height utilities.
- Preserve mobile route-scrollport behavior and desktop document scrolling.

#### Full-height route roots

- Apply the exact-height class to Object Edit.
- Apply the available-min-height class to New Ingestion, Setup, and Review.
- Preserve Object Detail's existing top-bar-plus-main document-flow behavior unless a focused test demonstrates a new overlap/clipping regression.
- Change root geometry only; do not redesign route internals.

#### `src/lib/components/AppSidebar.svelte.spec.ts`

- Remove assertions that the sidebar contains the language group.
- Assert the sidebar no longer owns a locale switch.
- Keep testing that sidebar text reacts when the locale store changes directly.
- Preserve navigation and logout coverage.

#### `src/routes/layout.svelte.spec.ts`

- Add desktop placement, mobile placement, uniqueness, breakpoint, public-route, locale behavior, and geometry coverage.

#### `src/routes/login/page.svelte.spec.ts`

- Enter values before switching locale and assert those exact values remain afterward.
- Preserve existing login locale and submission coverage.

#### `scripts/smoke-auth.mjs`

- Extend authenticated smoke with route-specific desktop geometry checks for Object Edit, New Ingestion, Setup, and Review.
- Assert the utility row does not overlap route actions.
- Assert the relevant lower action/footer region is reachable for each affected route.
- Keep existing horizontal-overflow and locale persistence assertions.

#### Affected route browser specs

Add focused reachability/height assertions where practical in:

- `src/routes/objects/[objectId]/edit/page.svelte.spec.ts`
- `src/routes/ingestion/new/page.svelte.spec.ts`
- `src/routes/ingestion/[batchId]/setup/page.svelte.spec.ts`
- `src/routes/ingestion/[batchId]/review/page.svelte.spec.ts`

Component tests should cover deterministic class/height ownership; authenticated smoke should cover the assembled shell and real route geometry.

#### Documentation

Update:

- `docs/components.md`
- `docs/localization.md`

Document that:

- Authenticated desktop placement is shell-owned in the content-column utility row.
- Mobile placement remains in `AppMobileHeader`.
- Login placement remains page-owned.
- The sidebar no longer owns language selection.

### Expected Unchanged

- `src/lib/components/LocaleSwitcher.svelte`
- `src/lib/components/AppMobileHeader.svelte`
- `src/routes/login/+page.svelte`
- `src/lib/i18n/locale.ts`
- Locale dictionaries

Only modify those files if a test exposes an actual regression; do not broaden UM-110.

## UM-110 Accessibility Requirements

The existing `LocaleSwitcher` already provides:

- A localized named `role="group"`.
- Native buttons.
- `aria-pressed` selected state.
- Keyboard behavior through native button semantics.

Preserve those semantics.

Additional requirements:

- Exactly one visible locale group at each responsive breakpoint.
- Inactive responsive variants must use `display: none`, not opacity or off-screen positioning.
- No duplicate authenticated desktop groups.
- No extra shell locale group on Login.
- No unlabeled icon-only replacement.
- No added banner landmark for the utility-only row.
- No horizontal overflow at narrow widths.

## UM-110 Test Matrix

### Desktop authenticated

At a viewport such as `1280 x 720`:

- Exactly one visible `Interface language` group exists.
- It is inside `.app-content-column`.
- It is not inside `aside`.
- Its row appears before route content.
- It is aligned 1.5rem from the content-column right edge.
- Clicking `RU` exercises shell integration and leaves the desktop group selected. The focused `LocaleSwitcher` suite remains authoritative for the complete locale-store, `<html lang>`, and storage contract.

### Mobile authenticated

At `375 x 667`:

- Exactly one visible language group exists.
- It remains inside the mobile header.
- Desktop utility row is hidden with zero rendered dimensions.
- Logout remains beside it.
- Navigation remains below it.
- Header remains outside `.app-route-scrollport`.

### Breakpoint boundary

- At 1023px: mobile header/switch visible, desktop row hidden.
- At 1024px: desktop row/switch visible, mobile header hidden.

### Public Login

- Root authenticated shell contributes no switch.
- Login still contains exactly one switch.
- Changing locale does not reset entered login form state.

### Geometry

- No horizontal overflow.
- No route action overlaps.
- Object edit remains fully usable.
- New, Setup, and Review lower content remains reachable.
- Sticky page headers continue functioning.
- At an enlarged root font scale, the utility row and route-height subtraction still agree and do not clip the selector.

## UM-110 Verification

Run focused tests:

```bash
npx vitest run --project=client \
  src/routes/layout.svelte.spec.ts \
  src/lib/components/AppSidebar.svelte.spec.ts \
  src/lib/components/AppMobileHeader.svelte.spec.ts \
  src/lib/components/LocaleSwitcher.svelte.spec.ts \
  src/routes/login/page.svelte.spec.ts
```

Then run:

```bash
npm run check
npm run lint
npm run test
npm run build
git diff --check
```

Run authenticated smoke after focused tests. The script starts its own deterministic fixture and adapter process:

```bash
npm run smoke:auth
```

Do not complete UM-110 until desktop/mobile uniqueness and the affected route geometry are verified. If Chromium, ports, or another local prerequisite blocks smoke, report the concrete blocker; do not treat an external backend fixture as required.

---

# Part II: UM-111

## Task

Title: `Clarify Batch Intent as default metadata and add inheritance cues in ingestion setup`

The task has four requirements:

1. Clarify that applicable batch values are defaults for objects.
2. Add visual cues showing whether object values match or differ from defaults.
3. Separate metadata defaults from ingestion-wide processing/access policies.
4. Reduce perceived duplication for a one-object batch.

## Approved Product Decisions

- Badge labels: `Matches defaults`, `Some customized`, and `Customized`, as approved by product.
- These labels are explicitly value-relative shorthand: `Customized` means that current editor values differ from current defaults, not that the frontend knows who authored them.
- Do not use `Inherited` or otherwise claim durable provenance.
- Object date default: batch publication date.
- One-object behavior: collapse item metadata defaults initially, auto-expand the sole object, and keep processing/access policies visible.
- Keep the Organize step even for one object.
- Keep the existing shared batch-label/default-item-title value in this task.
- Do not add backend provenance.
- Do not add per-item language, classification, item-kind, or pipeline editing.

## Critical Semantic Constraint

The current implementation does not have durable inheritance provenance.

Batch title, tags, description, and date are copied into an object's local metadata only when the corresponding property is `undefined`. Once copied or reloaded, the UI cannot know whether a value was:

- Copied from defaults.
- Entered manually.
- Entered manually but equal to the current default.

Therefore the frontend must use value-relative language:

- `Matches defaults`
- `Some customized`
- `Customized`

Do not display `Inherited` as an authorship/provenance claim.

Do not claim that object values stay synchronized with defaults. Existing behavior is one-time copy, not live inheritance.

## Current Data Model

### Batch state

`src/routes/ingestion/[batchId]/setup/+page.svelte` keeps batch state in `batchDefaults`, including:

- Title
- Language
- Classification type
- Item kind
- Summary text
- Pipeline preset
- Access level
- Embargo
- Rights note
- Sensitivity note

Batch tags live separately in `summaryTags`.

Batch dates live in `summaryDateEditors`.

Batch metadata is saved through the existing serialized metadata autosave introduced by UM-159. Preserve its generation serialization, 401 closure, server-authoritative hydration, and its existing narrow rollback baseline for classification type and item kind. Do not broaden rollback to every optimistic metadata field in this task.

### Object metadata

`ObjectItemMetadata` supports:

- Title
- One date
- Tags
- Description
- People

It does not support editable object language, classification type, item kind, or pipeline preset.

Do not expand item request schemas for UM-111.

### Current default propagation

The existing propagation effect copies values only when object properties are undefined:

| Batch value | Object field |
|---|---|
| Batch title | Object title |
| Summary tags | Object tags |
| Summary text | Object description |
| Batch creation date | Object date |

UM-111 must correct the last row to use batch publication date because object hydration and persistence use `dates.published`.

## Required UI Separation

Split the existing Batch Intent area into three visually and semantically distinct cards: object defaults, batch record context, and ingestion-wide policies.

## Card A: Item Metadata Defaults

Contains:

- Default item title, currently shared with the batch label.
- Default language. This is an effective ingestion-wide default used when an item has no externally persisted language override; the current UI does not edit per-object language.
- Default tags.
- Default description.
- Default publication date.

Helper text must distinguish the two current behaviors:

> Language applies as a batch default. Title, tags, description, and publication date prefill object editors that do not already have their own values.

The exact translated copy may be refined, but it must not imply continuous synchronization or durable provenance.

## Card B: Batch Record Context

Contains the batch creation date. It remains batch metadata, is always persisted in the existing batch summary payload, and is not copied into object publication dates.

This card may be visually compact, but the creation-date editor must remain reachable and must not be mislabeled as an object default.

The following ingestion-wide policy values belong only in Card C and must not remain in Card A or Card B:

- Item kind
- Classification type
- Pipeline preset
- Access level
- Embargo
- Rights note
- Sensitivity note

## Card C: Processing and Access Policies

Always visible.

### Processing section

Contains:

- Item kind
- Classification type
- Pipeline preset

These controls are coupled by existing classification/item-kind and preset/item-kind policy. Move existing markup and handlers without rewriting their logic.

Preserve:

- `setClassificationType`
- `setItemKind`
- Pipeline reconciliation
- Allowed-preset intersection
- Unknown override behavior
- Metadata autosave queue
- Capability warnings

### Access section

Contains:

- Access level
- Embargo until
- Rights note
- Sensitivity note

These settings apply to the whole ingestion and are not per-object metadata.

The visual split does not create independent save domains. The existing batch autosave still sends one complete payload containing defaults, creation date, and policy fields, so all capability validation, unknown-preset rendering, allowed-preset intersection, 401 closure, and queued-generation suppression must remain intact.

## Effective Default Helpers

Define canonical effective values once and reuse them for propagation, panel props, badge comparison, and tests.

### Effective title

The effective title default is:

```ts
batchDefaults.title.trim() || batchId
```

This matches current hydration and save-time behavior. Do not treat an empty editable title as the absence of a default while persistence substitutes `batchId`.

### Effective publication date

Add one non-throwing precision-aware helper for `SummaryDateEditor`:

- `none` returns `null`.
- `year` returns `editor.year` when valid/present.
- `month` returns `editor.month` when valid/present.
- `day` returns `editor.day` when valid/present.

Do not use `editor.year || editor.month || editor.day`; hydrated month/day editors also contain a year and that expression truncates dates.

Use the helper for:

- Default propagation.
- Grouped and standalone `ObjectMetadataPanel` date props.
- Badge comparison.

Keep the existing validating/throwing save helper for batch payload construction if required; do not weaken batch date validation.

### Empty versus absent object values

Preserve current semantics:

- `undefined` means the object field is eligible for one-time default population.
- `''`, `[]`, and `{ value: null, approximate: false }` are defined object values and are compared as differences rather than automatically overwritten.
- Selecting `No date` currently emits `undefined`; when a publication-date default exists, this means resume/use the default rather than persist an explicit no-date tombstone.

Explicit durable opt-out from a default requires provenance/tombstone support and is out of scope.

## Object Defaults Badge Semantics

Add a pure helper in Setup, or a focused adjacent utility if extraction makes testing materially clearer.

Recommended type:

```ts
type ItemDefaultsBadgeState =
    | 'matches-defaults'
    | 'mixed'
    | 'customized'
    | null;
```

Evaluate only template-backed fields:

- Title
- Publication date
- Tags
- Description

Do not include:

- Language, because there is no per-object language editor.
- Classification type, because there is no per-object editor.
- Item kind, because persisted overrides are read-only in this UI.
- People, because there is no batch people default.
- Pipeline/access fields, because they are policies.

### Applicable Default

A field participates only when its effective batch default is meaningfully set.

- Title: the effective title (`trimmed title || batchId`) is non-empty.
- Description: non-empty after trimming.
- Tags: at least one normalized tag.
- Date: publication date has a non-null value.

### Comparison Rules

#### Title and description

Compare trimmed strings.

#### Publication date

Compare:

- `value`
- `approximate`

Do not compare confidence/note because the current object date model does not retain those fields.

#### Tags

Normalize by:

- Trimming.
- Removing empty values.
- Deduplicating.
- Comparing as sets, not by order.

### Aggregate State

`matches-defaults`:

- At least one applicable default exists.
- Every applicable object field equals its current default.

`mixed`:

- At least one applicable field matches.
- At least one applicable field differs or is absent.

`customized`:

- Applicable defaults exist.
- None of the applicable object fields match.

`null`:

- No applicable defaults exist.

Missing required object metadata remains represented by the existing `needs info` badge. The defaults badge and readiness badge are independent and may both appear.

## Badge Placement

Render the aggregate defaults badge in each metadata-card header:

- Grouped object card header.
- Standalone object card header.

Place it before the existing `needs info` badge.

Do not add it to `ObjectGroupRow` in the Organize step; the cue concerns metadata, not file grouping.

Use the existing badge/chip visual language. Do not introduce a new design system component unless existing components cannot express the three states.

Suggested visual distinction:

- Matches defaults: neutral/sky.
- Some customized: pearl/peach-neutral.
- Customized: stronger but non-error ink/peach treatment.

These are informational states, not validation failures.

Badges describe current editor state only. Existing propagation does not automatically PATCH hydrated server items, so do not claim that a badge is durable provenance or guaranteed persisted state. On reload, badges are recalculated from values returned by the server. Do not add propagation-triggered item autosaves in UM-111; doing so would require a separate mutation/error design.

## Publication Date Correction

Current object default propagation uses batch creation date but persists the object date as publication date.

Correct all default comparisons and propagation to use batch publication date:

```text
batch summary.dates.published
    -> objectMetadata.date
    -> item dates.published
```

Update:

- The propagation effect.
- `ObjectMetadataPanel` batch/default date prop at grouped and standalone call sites.
- Badge comparison helper.
- Tests.

Do not alter batch creation date persistence. It remains valid batch metadata but is not the object's default date.

When default propagation changes `metadata.date` for the currently open object, `ObjectMetadataPanel` must update its local precision/value/approximate editor state for that same object key. Extend its synchronization logic carefully so parent-driven date changes are reflected without resetting unrelated in-progress edits.

## ObjectMetadataPanel Copy

`src/lib/components/ObjectMetadataPanel.svelte` currently uses wording that can imply live inheritance.

Update copy to value/default language, such as:

- Title placeholder: `Use the item title default`
- Batch tag hint: `Batch metadata default`
- Description placeholder: `Use the default description`

Do not change the component's request payload or supported fields.

## Single-Object UX

Derive:

```ts
const isSingleObjectBatch = $derived(objectCount === 1);
```

The existing frontend object count is:

```ts
objectGroups.length + standaloneFiles.length
```

That is the correct condition for this UI behavior.

### Initial behavior for exactly one object

- Item Metadata Defaults card starts collapsed.
- Summary row explains that one object exists and metadata can be edited below.
- Provide an `Edit defaults` control/affordance.
- The sole object metadata card starts expanded when entering the Metadata step.
- Processing and Access Policies remains expanded and visible.
- Organize step remains available.

### Minimal disclosure state machine

- Track `defaultsDisclosureTouched` separately from the current open state.
- Before the user toggles it, defaults are closed when `objectCount === 1` and open otherwise.
- After the user toggles it, preserve that explicit choice for the rest of the page session.
- Track sole-object auto-expansion by the actual object metadata key, not only by object count.
- Auto-expand each sole object key at most once; allow the user to collapse it afterward.
- Remove stale expanded keys when grouping/replacement changes object identity.

### Count transitions

If count changes and the user has not manually toggled defaults, derive open/closed state from the new count. If the user has toggled it, preserve their choice.

Do not add capability/save-error-driven force-open behavior to the defaults card. Policy warnings, save status, and Processing/Access controls must remain visible outside the collapsed defaults body, so users can diagnose those states without a complex safety-expansion state machine.

### Required controls that must remain reachable

- Language.
- Classification type.
- Item kind.
- Pipeline preset.
- Access settings.
- Object title/date/tags/description.

Do not hide controls from the DOM solely because there is one object.

The disclosure control must be a native button with `aria-expanded`, `aria-controls`, and a stable controlled-panel ID. Collapsed content must not remain accessibility-exposed as though open.

## UM-111 Copy

Update existing English and Russian values.

### Existing keys to revise

| Key | English | Russian |
|---|---|---|
| `ingestionSetup.batchIntent.title` | `Item metadata defaults` | `Метаданные объектов по умолчанию` |
| `ingestionSetup.batchIntent.description` | `Language applies as a batch default. Title, tags, description, and publication date prefill empty object metadata.` | `Язык применяется по умолчанию ко всей партии. Название, теги, описание и дата публикации заполняют пустые метаданные объектов.` |
| `ingestionSetup.batchIntent.sections.coreMetadata` | `Identification` | `Идентификация` |
| `ingestionSetup.batchIntent.sections.summaryContext` | `Description and tags` | `Описание и теги` |
| `ingestionSetup.flow.perObjectMetadata` | `Object metadata` | `Метаданные объектов` |
| `ingestionSetup.objectMetadata.fields.titlePlaceholder` | `Use the item title default` | `Использовать название по умолчанию` |
| `ingestionSetup.objectMetadata.fields.batchTagHint` | `Batch metadata default` | `Значение метаданных партии по умолчанию` |
| `ingestionSetup.objectMetadata.fields.descriptionPlaceholder` | `Use the default description` | `Использовать описание по умолчанию` |

### New keys

Use names consistent with the current dictionary structure. Recommended values:

| Purpose | English | Russian |
|---|---|---|
| Policy card title | `Processing and access policies` | `Обработка и правила доступа` |
| Policy helper | `These settings apply to the whole ingestion and are not per-object metadata.` | `Эти настройки применяются ко всей загрузке и не являются метаданными отдельных объектов.` |
| Batch context title | `Batch record context` | `Контекст записи партии` |
| Batch context helper | `Creation date describes the batch record and is not copied to object metadata.` | `Дата создания описывает запись партии и не копируется в метаданные объектов.` |
| Processing heading | `Processing settings` | `Настройки обработки` |
| Access heading | `Access policy` | `Правила доступа` |
| Matches badge | `Matches defaults` | `Совпадает с настройками по умолчанию` |
| Mixed badge | `Some customized` | `Частично изменено` |
| Customized badge | `Customized` | `Изменено` |
| Single-object hint | `One object in this batch. Edit its metadata below, or expand these defaults if needed.` | `В этой партии один объект. Измените его метаданные ниже или при необходимости разверните настройки по умолчанию.` |
| Expand defaults | `Edit defaults` | `Изменить значения по умолчанию` |
| Collapse defaults | `Hide defaults` | `Скрыть значения по умолчанию` |

Update translation leaf-count/snapshot alarms based on the actual final number of added keys. Do not blindly use a stale count from this document.

Run translation parity and validation tests.

## UM-111 Files

### Required

#### `src/routes/ingestion/[batchId]/setup/+page.svelte`

- Add badge comparison logic.
- Split defaults from policies.
- Correct publication-date default propagation.
- Add single-object collapse state.
- Add one-time sole-object auto-expansion.
- Render grouped and standalone badges.
- Preserve existing autosave, capability, upload, grouping, preview, and mutation logic.

#### `src/lib/components/ObjectMetadataPanel.svelte`

- Correct placeholder/helper copy to avoid false inheritance claims.
- Synchronize local date editor state when the parent changes the current object's date without changing its object key.
- Do not change payload shape or field support.

#### `src/lib/i18n/translations.ts`

- Add/update EN/RU copy.

#### `src/lib/i18n/translations.spec.ts`

- Update the dictionary leaf-count alarm to the actual resulting count.

#### `src/routes/ingestion/[batchId]/setup/page.svelte.spec.ts`

- Add structure, badge, single-object, date, translation, and regression coverage.

#### Additional required regression files

- `src/lib/components/ObjectMetadataPanel.svelte.spec.ts`: copy and same-object date synchronization.
- `src/lib/ingestion/setupItemHydration.spec.ts`: preserve defined empty/null values and publication-date hydration semantics.
- `src/lib/services/apiIngestionSetupService.spec.ts`: item date remains mapped to `dates.published`.
- `src/routes/ingestion/[batchId]/setup/server.spec.ts`: item action payload shape remains unchanged.
- `src/routes/ingestion/[batchId]/metadata/server.spec.ts`: full batch PATCH remains capability-validated as before.
- `docs/components.md`: document `batchDate` as a publication-date default cue and document value-relative badge semantics.

### Optional extraction

If badge comparison becomes difficult to test inside the component, extract a small pure utility under:

`src/lib/ingestion/`

If extracted:

- Keep it narrowly focused on default comparison.
- Add a colocated server/unit test.
- Do not create a general metadata framework.

### Explicitly Out of Scope

- Backend changes.
- New item PATCH fields.
- Editable item language.
- Editable item classification type.
- Editable item kind overrides.
- Editable item pipeline overrides.
- Durable inheritance/provenance storage.
- Splitting batch operational name from default item title.
- Live synchronization of customized items with changing defaults.
- Redesigning the Organize step.

## UM-111 Test Matrix

### Multi-object structure

- Item Metadata Defaults appears as a distinct card.
- Processing and Access Policies appears as a distinct card.
- Item kind, classification, pipeline, access, embargo, rights, and sensitivity controls retain current values and handlers.
- No unsupported per-object controls appear.

### Badge states

- All applicable fields match: `Matches defaults`.
- Some fields match and some differ: `Some customized`.
- No applicable field matches: `Customized`.
- No applicable defaults: no defaults badge.
- Missing required metadata still shows `needs info` independently.
- Tag order and duplicate input do not affect equality.
- Trimming does not create false customization.
- Date compares value and approximate flag.
- Changing a default reactively updates badge state.
- Grouped and standalone cards use identical rules.
- English and Russian labels are covered.

### Publication date

- Batch publication date populates an undefined object date.
- Batch creation date is not copied into object date.
- Hydrated item publication date compares correctly.
- Persisted item payload remains `dates.published`.
- Year, month, and day precision are preserved without truncation.
- Defined empty/null hydrated values are not silently treated as `undefined`.
- Clearing object date resumes the publication-date default when one exists; explicit durable no-date override is not claimed.

### One-object behavior

- One grouped object collapses Item Metadata Defaults initially.
- One standalone object behaves identically.
- Sole object metadata card starts expanded once.
- User can collapse that card afterward.
- User can expand/collapse defaults.
- Processing/access policies remain visible.
- Adding a second object restores normal multi-object defaults presentation.
- Returning between Organize and Metadata does not repeatedly overwrite manual toggle state.
- Replacing/regrouping the sole object under a new metadata key auto-expands the new key once and removes stale expansion state.
- Disclosure button exposes correct `aria-expanded`/`aria-controls` state.
- Migrate existing one-object tests that currently click a collapsed object header before editing; after auto-expansion, the same click would collapse it. Each test must explicitly assert or normalize expansion state before interacting with fields.

### Regression coverage

- Batch metadata PATCH payload remains entirely unchanged; publication-date correction affects local object default propagation/comparison, not batch serialization.
- Item update payload remains unchanged.
- Default propagation does not introduce new item PATCH requests.
- UM-159 autosave serialization tests remain green.
- 401 handling remains green.
- Unknown item-kind override behavior remains green.
- Preset compatibility behavior remains green.
- Preview and item mutation tests remain green.

## UM-111 Verification

Run focused tests:

```bash
npx vitest run --project=client \
  'src/routes/ingestion/[batchId]/setup/page.svelte.spec.ts' \
  src/lib/components/ObjectMetadataPanel.svelte.spec.ts
```

Run focused hydration, service, and route-boundary regressions:

```bash
npx vitest run --project=server \
  src/lib/ingestion/setupItemHydration.spec.ts \
  src/lib/services/apiIngestionSetupService.spec.ts \
  'src/routes/ingestion/[batchId]/setup/server.spec.ts' \
  'src/routes/ingestion/[batchId]/metadata/server.spec.ts'
```

If a pure comparison utility is extracted, run its test explicitly.

Run translation tests:

```bash
npx vitest run --project=server \
  src/lib/i18n/translations.spec.ts \
  src/lib/i18n/translationValidation.spec.ts
```

Then run all gates:

```bash
npm run check
npm run lint
npm run test
npm run build
git diff --check
```

Do not complete UM-111 until single-object behavior has been tested for both grouped and standalone objects and all recent UM-108/UM-159 tests still pass.

---

# Final Cross-Task Review

After both tasks are complete, review the combined result for:

- Exactly one locale switch at each viewport/public-shell mode.
- No desktop utility-row overlap or clipped full-height route.
- No mobile shell regression.
- Setup's new cards fitting correctly within the shell-adjusted route height.
- Item-default copy avoiding unsupported inheritance claims.
- Policy controls remaining visible and functional.
- Badge semantics remaining explicitly value-relative and recalculated from current editor/server-loaded values rather than claiming provenance.
- Publication-date consistency.
- Single-object controls remaining reachable.
- No regression to UM-108/UM-159 capability validation.
- No regression to metadata autosave serialization or 401 closure.
- EN/RU translation parity.
- Documentation matching actual placement and behavior.

## Final Completion Checklist

- UM-110 was claimed, started, and completed through Umati.
- UM-111 was not started before UM-110 verification passed.
- UM-111 was claimed, started, and completed through Umati.
- No `.umati` files were manually edited.
- No backend files were changed.
- Unrelated dirty-worktree changes were preserved.
- No commit was created without explicit approval.
- Focused browser tests passed.
- Translation tests passed.
- `npm run check` passed.
- `npm run lint` passed.
- Full `npm run test` passed.
- `npm run build` and route-boundary verification passed.
- `git diff --check` passed.
- Any unavailable smoke environment was reported explicitly rather than silently skipped.
