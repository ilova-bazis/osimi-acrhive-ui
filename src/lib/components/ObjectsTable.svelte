<script lang="ts">
	import { resolve } from '$app/paths';
	import BaseButton from '$lib/components/BaseButton.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { FileStatus } from '$lib/types';
	import type { AccessReasonCode, ObjectRow } from '$lib/services/objects';

	let {
		rows,
		selectedIds,
		onToggleSelection,
		hasActiveFilters,
		queryEntries,
		nextCursor,
		showFirstPage,
		filteredCount,
		totalCount
	} = $props<{
		rows: ObjectRow[];
		selectedIds: string[];
		onToggleSelection: (id: string) => void;
		hasActiveFilters: boolean;
		queryEntries: Array<[string, string]>;
		nextCursor: string | null;
		showFirstPage: boolean;
		filteredCount: number;
		totalCount: number;
	}>();

	const formatDate = (value: string) => new Date(value).toLocaleString();
	const titleFallback = (row: ObjectRow) => `Untitled - ${row.objectId.slice(-6)}`;
	const processingLabel = (state: ObjectRow['processingState']) => state.replace(/_/g, ' ');
	const availabilityLabel = (value: ObjectRow['availabilityState']) => value.replace(/_/g, ' ');
	const previewLabel = (row: ObjectRow): string => row.type.slice(0, 3).toUpperCase();

	const reasonLabels: Record<AccessReasonCode, string> = {
		OK: 'Available to download',
		FORBIDDEN_POLICY: 'Access restricted by policy',
		EMBARGO_ACTIVE: 'Embargo currently active',
		RESTORE_REQUIRED: 'Restore required before download',
		RESTORE_IN_PROGRESS: 'Restore in progress',
		TEMP_UNAVAILABLE: 'Temporarily unavailable'
	};

	const reasonActionLabel = (reason: AccessReasonCode): string | null => {
		if (reason === 'RESTORE_REQUIRED') return 'Request restore';
		if (reason === 'FORBIDDEN_POLICY') return 'Request access';
		if (reason === 'RESTORE_IN_PROGRESS') return 'Restore pending';
		return null;
	};

	const toBadgeStatus = (row: ObjectRow): FileStatus => {
		if (row.processingState.endsWith('failed')) return 'failed';
		if (row.curationState === 'needs_review' || row.curationState === 'review_in_progress') return 'needs-review';
		if (row.processingState === 'queued') return 'queued';
		if (row.processingState === 'index_done' || row.processingState === 'processing_skipped') return 'approved';
		return 'processing';
	};
</script>

<section class="rounded-2xl border border-border-soft bg-surface-white">
	<div class="grid grid-cols-[36px_64px_2fr_1fr_1.2fr_0.9fr_1.1fr_1fr_1fr_42px] gap-3 border-b border-border-soft px-6 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
		<span></span>
		<span>Preview</span>
		<span>Title</span>
		<span>Type</span>
		<span>Processing</span>
		<span>Indicators</span>
		<span>Access</span>
		<span>Updated</span>
		<span>Batch</span>
		<span></span>
	</div>
	{#if rows.length === 0}
		<div class="px-6 py-12 text-center text-sm text-text-muted">
			{#if hasActiveFilters}
				<p>No objects match current filters.</p>
				<a href={resolve('/objects')} class="mt-3 inline-flex rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">Clear filters</a>
			{:else}
				<p>No objects available for this tenant yet.</p>
			{/if}
		</div>
	{:else}
		<div class="divide-y divide-border-soft">
			{#each rows as row (row.id)}
				{@const reasonCode = row.accessReasonCode as AccessReasonCode}
				<div class="grid grid-cols-[36px_64px_2fr_1fr_1.2fr_0.9fr_1.1fr_1fr_1fr_42px] items-center gap-3 px-6 py-4">
					<input
						type="checkbox"
						class="h-4 w-4 rounded border-border-soft text-blue-slate"
						checked={selectedIds.includes(row.id)}
						onchange={() => onToggleSelection(row.id)}
					/>
					<div class="h-12 w-12 rounded-lg border border-border-soft bg-alabaster-grey/70 text-[10px] uppercase tracking-[0.2em] text-text-muted grid place-items-center">
						{previewLabel(row)}
					</div>
					<div>
						<p class="text-sm font-medium text-text-ink">{row.title ?? titleFallback(row)}</p>
						<p class="text-[11px] text-text-muted">{row.objectId}</p>
						{#if !row.canDownload}
							<p class="mt-1 text-[11px] text-burnt-peach">{reasonLabels[reasonCode]}</p>
							{@const action = reasonActionLabel(reasonCode)}
							{#if action}
								<Chip class="mt-1 border-burnt-peach/30 bg-pearl-beige text-[10px] uppercase tracking-[0.18em] text-burnt-peach">
									{action}
								</Chip>
							{/if}
						{/if}
					</div>
					<span class="text-xs text-text-muted">{row.type}</span>
					<StatusBadge status={toBadgeStatus(row)} label={processingLabel(row.processingState)} />
					<div class="flex flex-wrap items-center gap-1">
						{#if row.indicators.accessPdf}
							<Chip class="border-blue-slate/30 bg-pale-sky/25 text-[10px] text-blue-slate">PDF</Chip>
						{/if}
						{#if row.indicators.ocr}
							<Chip class="border-blue-slate/30 bg-pale-sky/25 text-[10px] text-blue-slate">OCR</Chip>
						{/if}
						{#if row.indicators.index}
							<Chip class="border-blue-slate/30 bg-pale-sky/25 text-[10px] text-blue-slate">IDX</Chip>
						{/if}
						{#if !row.indicators.accessPdf && !row.indicators.ocr && !row.indicators.index}
							<span class="text-[11px] text-text-muted">-</span>
						{/if}
					</div>
					<span class="text-xs text-text-muted">{row.accessLevel}</span>
					<span class="text-xs text-text-muted">{formatDate(row.updatedAt)}</span>
					<span class="text-xs text-blue-slate" title={availabilityLabel(row.availabilityState)}>{row.sourceBatchLabel ?? '-'}</span>
					<BaseButton variant="secondary" class="px-2 py-1 text-[10px]" title="Row actions">
						...
					</BaseButton>
				</div>
			{/each}
		</div>
	{/if}
</section>

<footer class="flex flex-wrap items-center justify-between gap-4">
	<p class="text-xs text-text-muted">Showing {rows.length} of {filteredCount} (total {totalCount})</p>
	<div class="flex items-center gap-2">
		{#if showFirstPage}
			<form method="GET" action={resolve('/objects')}>
				{#each queryEntries as entry (entry[0])}
					{#if entry[0] !== 'cursor'}
						<input type="hidden" name={entry[0]} value={entry[1]} />
					{/if}
				{/each}
				<BaseButton variant="secondary" type="submit">First page</BaseButton>
			</form>
		{/if}
		{#if nextCursor}
			<form method="GET" action={resolve('/objects')}>
				{#each queryEntries as entry (entry[0])}
					{#if entry[0] !== 'cursor'}
						<input type="hidden" name={entry[0]} value={entry[1]} />
					{/if}
				{/each}
				<input type="hidden" name="cursor" value={nextCursor} />
				<BaseButton variant="secondary" type="submit">Next</BaseButton>
			</form>
		{:else}
			<span class="rounded-full border border-border-soft px-3 py-1 text-xs uppercase tracking-[0.2em] text-text-muted">No more</span>
		{/if}
	</div>
</footer>
