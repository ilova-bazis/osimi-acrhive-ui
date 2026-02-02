# UI Components (Prototype)

This document describes the component breakdown for the ingestion UI prototype. These components are
used on the `/prototype` route and serve as the reference layout for future UI work.

## Overview

- Components live in `src/lib/components`.
- The prototype assembly lives in `src/routes/prototype/+page.svelte`.
- UI strings are sourced from `src/lib/i18n/translations.ts`.

## Layout Components

### PageHeader

Purpose: Main header with title, subtitle, session label, language switcher, and text-size control.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| library | string | yes | Header kicker text |
| title | string | yes | Main page title |
| subtitle | string | yes | Supporting copy |
| sessionLabel | string | yes | Label for session pill |
| sessionValue | string | yes | Session display value |
| locales | { key: string; label: string }[] | yes | UI locale options |
| locale | string | yes | Active locale key |
| onLocaleChange | (value: string) => void | yes | Locale change handler |
| textSizes | { key: string; label: string }[] | yes | Text size options |
| textSize | string | yes | Active text size key |
| onTextSizeChange | (value: string) => void | yes | Text size handler |
| textSizeLabel | string | no | Defaults to “Text size” |
| localeLabel | string | no | Defaults to “UI” |

```svelte
<PageHeader
  library="Osimi Digital Library"
  title="Batch Ingestion"
  subtitle="Human intent first. Machines assist, people decide."
  sessionLabel="Session"
  sessionValue="NoorMags Issue 76-79"
  locales={[{ key: 'en', label: 'EN' }, { key: 'ru', label: 'RU' }]}
  locale={locale}
  textSizes={[{ key: 'small', label: 'A-' }, { key: 'default', label: 'A' }, { key: 'large', label: 'A+' }]}
  textSize={textSize}
  textSizeLabel="Text size"
  localeLabel="UI"
  onLocaleChange={(value) => (locale = value)}
  onTextSizeChange={(value) => (textSize = value)}
/>
```

### FooterActions

Purpose: Footer note with primary and secondary actions.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| note | string | yes | Footer supporting copy |
| primaryLabel | string | yes | Primary CTA label |
| secondaryLabel | string | yes | Secondary CTA label |

```svelte
<FooterActions
  note="Human intent confirmed. Review everything before ingestion starts."
  secondaryLabel="Download catalog.json"
  primaryLabel="Start ingestion"
/>
```

## UI Building Blocks

### BaseButton

Purpose: Primary/secondary CTA button styles aligned with the palette.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| variant | 'primary' \| 'secondary' | no | Defaults to 'primary' |
| type | 'button' \| 'submit' \| 'reset' | no | Defaults to 'button' |
| class | string | no | Additional classes |
| children | () => unknown | no | Button content |

```svelte
<BaseButton variant="primary">Start ingestion</BaseButton>
<BaseButton variant="secondary">Download catalog.json</BaseButton>
```

### Chip

Purpose: Pill for tags, quick metadata, and small badges.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| class | string | no | Additional classes |
| children | () => unknown | no | Chip content |

```svelte
<Chip class="border-[var(--border-soft)] bg-[var(--surface-white)]">Creates local staging batch</Chip>
```

### StatusBadge

Purpose: Status pill with dot indicator and palette-accurate semantics.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| status | FileStatus | yes | Uses palette rules |
| label | string | yes | Visible label |

```svelte
<StatusBadge status="needs-review" label="Needs Review" />
```

## Domain Panels

### DropzonePanel

Purpose: Upload staging area with archival emphasis.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| label | string | yes | Section label |
| headline | string | yes | Dropzone headline |
| support | string | yes | Supporting text |
| badges | string[] | no | Optional chip labels |

```svelte
<DropzonePanel
  label="Dropzone"
  headline="Drag files here or click to browse"
  support="Images, PDFs, audio, video, and archives. No upload until review."
  badges={['Creates local staging batch', 'Supports batch defaults']}
/>
```

### StatusLegendPanel

Purpose: Visual legend of file states using palette-approved badges.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Section title |
| subtitle | string | yes | Supporting text |
| countLabel | string | yes | Count label |
| statuses | { key: string; label: string }[] | yes | Status map |

```svelte
<StatusLegendPanel
  title="Status Legend"
  subtitle="Only one attention color. Text always explains state."
  countLabel="8 states"
  statuses={[{ key: 'queued', label: 'Queued' }, { key: 'needs-review', label: 'Needs Review' }]}
/>
```

### FileListPanel

Purpose: File list with selection behavior and per-row state badges.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Section title |
| subtitle | string | yes | Supporting text |
| files | FileItem[] | yes | List of files |
| selectedId | number \| undefined | yes | Active file id |
| statusLabels | Record<FileStatus, string> | yes | Label map |
| onSelect | (file: FileItem) => void | no | Selection handler |

```svelte
<FileListPanel
  title="Files"
  subtitle="Select a file to preview overrides and human context."
  files={files}
  selectedId={selectedId}
  statusLabels={statusLabels}
  onSelect={(file) => (selectedId = file.id)}
/>
```

### BatchIntentPanel

Purpose: Human intent block with structured defaults and tags.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Panel title |
| heading | string | no | Defaults to session heading |
| description | string | yes | Supporting text |
| fields | { label: string; value: string }[] | yes | Structured fields |
| tags | string[] | yes | Tag list |
| tagsLabel | string | no | Defaults to “Tags” |

```svelte
<BatchIntentPanel
  title="Batch Intent"
  description="Scanned newspaper issues from 1971. Human notes drive all pipelines."
  fields={[{ label: 'Primary language', value: 'Persian' }]}
  tags={['Tehran', 'Cultural review']}
  tagsLabel="Tags"
  heading="NoorMags Issue 76-79"
/>
```

### FileOverridePanel

Purpose: Per-file override block with pipeline badges and human notes.

Props:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| title | string | yes | Panel title |
| subtitle | string | yes | Supporting text |
| fields | { label: string; value: string }[] | yes | Override fields |
| badges | { label: string; tone: 'system' \| 'attention' }[] | yes | Tone-driven chips |
| note | string | yes | Human note |

```svelte
<FileOverridePanel
  title="Per-file Overrides"
  subtitle="Overrides for the selected file take precedence over batch defaults."
  fields={[{ label: 'Language', value: 'Persian' }]}
  badges={[
    { label: 'Layout OCR', tone: 'system' },
    { label: 'Image tagging', tone: 'system' },
    { label: 'Needs human review', tone: 'attention' }
  ]}
  note="Note: Page 1 has hand annotations. Preserve margins during OCR."
/>
```
