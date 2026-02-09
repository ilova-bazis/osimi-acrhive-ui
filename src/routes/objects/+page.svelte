<script lang="ts">
	import type { ObjectRow, ObjectStatus } from '$lib/services/objects';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data } = $props<{ data: { recent: ObjectRow[]; list: { rows: ObjectRow[]; total: number } } }>();

	let selectedIds = $state<Set<string>>(new Set());
	let isFiltersOpen = $state(false);

	const toggleSelection = (id: string) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	};

	const statusLabels = {
		INGESTING: 'Ingesting',
		READY: 'Ready',
		NEEDS_REVIEW: 'Needs Review',
		FAILED: 'Failed',
		ARCHIVED: 'Archived'
	} as const;

	const statusToneMap = {
		INGESTING: 'processing',
		READY: 'approved',
		NEEDS_REVIEW: 'needs-review',
		FAILED: 'failed',
		ARCHIVED: 'skipped'
	} as const;

	const formatDate = (value: string) => new Date(value).toLocaleString();

	const titleFallback = (row: ObjectRow) => `Untitled – ${row.id.slice(-6)}`;
	const hasSelection = () => selectedIds.size > 0;
</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Objects</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">Objects</h2>
			<p class="mt-2 text-sm text-text-muted">All archived items</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<button
				disabled={!hasSelection()}
				class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
			>
				Bulk actions
			</button>
			<button
				disabled
				class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
			>
				Export
			</button>
		</div>
	</header>

	{#if hasSelection()}
		<section class="rounded-2xl border border-border-soft bg-pale-sky/20 px-6 py-3 text-sm text-text-ink">
			{selectedIds.size} objects selected
		</section>
	{/if}

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
		<div class="flex items-center justify-between gap-4">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Recently ingested</p>
				<p class="mt-1 text-sm text-text-muted">Quick access to recent work</p>
			</div>
			<p class="text-xs text-text-muted">Last {data.recent.length} objects</p>
		</div>
		<div class="mt-4 flex gap-4 overflow-x-auto pb-2">
			{#each data.recent as item (item.id)}
				<a
					href={`/objects/${item.id}`}
					class="min-w-[220px] rounded-xl border border-border-soft bg-alabaster-grey/60 p-3"
				>
					{#if item.thumbnailUrl}
						<img
							src={item.thumbnailUrl}
							alt=""
							class="h-28 w-full rounded-lg object-cover"
						/>
					{:else}
						<div class="flex h-28 items-center justify-center rounded-lg border border-border-soft bg-surface-white text-xs uppercase tracking-[0.2em] text-text-muted">
							No preview
						</div>
					{/if}
					<p class="mt-3 text-sm font-medium text-text-ink">{item.title ?? titleFallback(item)}</p>
					<p class="mt-1 text-xs text-text-muted">{item.type}</p>
				</a>
			{/each}
		</div>
	</section>

	<section class="sticky top-0 z-10 rounded-2xl border border-blue-slate/30 bg-pearl-beige/55 px-6 py-4 shadow-[0_0_0_2px_rgba(79,109,122,0.08)]">
		<div class="flex flex-wrap items-center gap-3">
			<div class="flex-1">
				<input
					type="search"
					placeholder="Search title, people, places, OCR, transcript…"
					class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink"
				/>
			</div>
			<div class="flex flex-wrap gap-2">
				<button class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">
					Type
				</button>
				<button class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">
					Status
				</button>
				<button class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">
					Language
				</button>
				<button
					onclick={() => (isFiltersOpen = true)}
					class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
				>
					More filters
				</button>
			</div>
		</div>
		<div class="mt-3 flex flex-wrap gap-2">
			<span class="rounded-full border border-blue-slate/30 bg-pale-sky/20 px-3 py-1 text-xs text-blue-slate">
				Language: Persian
			</span>
			<button class="text-xs text-text-muted">Clear filters</button>
		</div>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white">
		<div class="grid grid-cols-[36px_72px_2.2fr_1.2fr_1.1fr_0.9fr_1.1fr_1fr_1.2fr_40px] gap-3 border-b border-border-soft px-6 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
			<span></span>
			<span>Preview</span>
			<span>Title</span>
			<span>Object type</span>
			<span>Status</span>
			<span>Language</span>
			<span>Indicators</span>
			<span>Updated</span>
			<span>Source</span>
			<span></span>
		</div>
		{#if data.list.rows.length === 0}
			<div class="px-6 py-12 text-center text-sm text-text-muted">
				<p>No objects yet</p>
				<a href="/ingestion" class="mt-3 inline-flex rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate" role="button">
					Go to ingestion
				</a>
			</div>
		{:else}
			<div class="divide-y divide-border-soft">
				{#each data.list.rows as row (row.id)}
					{@const statusKey = row.status as keyof typeof statusLabels}
					<div class="grid grid-cols-[36px_72px_2.2fr_1.2fr_1.1fr_0.9fr_1.1fr_1fr_1.2fr_40px] items-center gap-3 px-6 py-4">
						<input
							type="checkbox"
							class="h-4 w-4 rounded border-border-soft text-blue-slate"
							checked={selectedIds.has(row.id)}
							onclick={(event) => event.stopPropagation()}
							onchange={() => toggleSelection(row.id)}
						/>
						<div class="h-14 w-14 overflow-hidden rounded-lg border border-border-soft bg-alabaster-grey/60">
							{#if row.thumbnailUrl}
								<img src={row.thumbnailUrl} alt="" class="h-full w-full object-cover" />
							{:else}
								<div class="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-text-muted">
									OBJ
								</div>
							{/if}
						</div>
						<a
							href={`/objects/${row.id}`}
							class="text-sm font-medium text-text-ink"
							title={`Object ID: ${row.id}`}
						>
							{row.title ?? titleFallback(row)}
						</a>
						<span class="text-xs text-text-muted">{row.type}</span>
						<StatusBadge status={statusToneMap[statusKey]} label={statusLabels[statusKey]} />
						<span class="text-xs text-text-muted">{row.language}</span>
						<div class="flex items-center gap-1">
							{#if row.indicators.ocr}
								<span class="rounded-full border border-border-soft bg-pale-sky/20 px-2 py-1 text-[10px] text-blue-slate" title="OCR text available">
									OCR
								</span>
							{/if}
							{#if row.indicators.transcript}
								<span class="rounded-full border border-border-soft bg-pale-sky/20 px-2 py-1 text-[10px] text-blue-slate" title="Transcript available">
									TR
								</span>
							{/if}
							{#if row.indicators.embeddings}
								<span class="rounded-full border border-border-soft bg-pale-sky/20 px-2 py-1 text-[10px] text-blue-slate" title="Embeddings available">
									EM
								</span>
							{/if}
						</div>
						<span class="text-xs text-text-muted">{formatDate(row.updatedAt)}</span>
						<a href={`/ingestion/${row.batchId}`} class="text-xs text-blue-slate">
							{row.batchId}
						</a>
						<button class="rounded-full border border-blue-slate px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate" title="Row actions">
							•••
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<footer class="flex flex-wrap items-center justify-between gap-4">
		<p class="text-xs text-text-muted">Showing {data.list.rows.length} of {data.list.total}</p>
		<div class="flex items-center gap-2">
			<button class="rounded-full border border-blue-slate px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-slate">Prev</button>
			<button class="rounded-full border border-blue-slate px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-slate">Next</button>
		</div>
	</footer>

	{#if isFiltersOpen}
		<div class="fixed inset-0 z-40 bg-dark-grey/60" onclick={() => (isFiltersOpen = false)}></div>
		<aside class="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Filters</p>
					<h3 class="mt-2 font-display text-xl text-text-ink">Refine objects</h3>
				</div>
				<button class="text-sm text-text-muted" onclick={() => (isFiltersOpen = false)}>Close</button>
			</div>
			<div class="mt-6 space-y-5 text-sm text-text-muted">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Object type</p>
					<div class="mt-2 flex flex-wrap gap-2">
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">Newspaper</span>
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">Photo</span>
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">Interview</span>
					</div>
				</div>
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Status</p>
					<div class="mt-2 flex flex-wrap gap-2">
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">Ready</span>
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">Needs review</span>
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">Failed</span>
					</div>
				</div>
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Language</p>
					<div class="mt-2 flex flex-wrap gap-2">
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">FA</span>
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">TG</span>
						<span class="rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs">EN</span>
					</div>
				</div>
				<div class="grid gap-3 sm:grid-cols-2">
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingested from</p>
						<input class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" placeholder="Start date" />
					</div>
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingested to</p>
						<input class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" placeholder="End date" />
					</div>
				</div>
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Batch ID</p>
					<input class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" placeholder="Search batch id" />
				</div>
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Tags</p>
					<input class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" placeholder="Search tags" />
				</div>
			</div>
			<div class="mt-6 flex items-center justify-end gap-3">
				<button class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate" onclick={() => (isFiltersOpen = false)}>
					Cancel
				</button>
				<button class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white" onclick={() => (isFiltersOpen = false)}>
					Apply filters
				</button>
			</div>
		</aside>
	{/if}
</main>
