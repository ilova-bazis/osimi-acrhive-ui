<script lang="ts">
	import { resolve } from '$app/paths';
	import BaseButton from '$lib/components/BaseButton.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import ObjectThumbnail from '$lib/components/ObjectThumbnail.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { FileStatus } from '$lib/types';
	import type { AccessReasonCode, ObjectRow } from '$lib/services/objects';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';

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

	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);

	const formatDate = (value: string) => new Date(value).toLocaleString();
	const titleFallback = (row: ObjectRow) =>
		formatTemplate(t('objects.table.untitled'), { suffix: row.objectId.slice(-6) });
	const processingLabel = (state: ObjectRow['processingState']) => state.replace(/_/g, ' ');
	const availabilityLabel = (value: ObjectRow['availabilityState']) => value.replace(/_/g, ' ');
	const accessLevelLabel = (value: ObjectRow['accessLevel']): string =>
		value === 'private'
			? t('ingestionSetup.batchIntent.accessLevels.private')
			: value === 'family'
				? t('ingestionSetup.batchIntent.accessLevels.family')
				: t('ingestionSetup.batchIntent.accessLevels.public');

	const reasonLabel = (reason: AccessReasonCode): string => t(`objects.table.reasons.${reason}`);

	const reasonActionLabel = (reason: AccessReasonCode): string | null => {
		if (reason === 'RESTORE_REQUIRED') return t('objects.table.reasonActions.RESTORE_REQUIRED');
		if (reason === 'FORBIDDEN_POLICY') return t('objects.table.reasonActions.FORBIDDEN_POLICY');
		if (reason === 'RESTORE_IN_PROGRESS') return t('objects.table.reasonActions.RESTORE_IN_PROGRESS');
		return null;
	};

	const toBadgeStatus = (row: ObjectRow): FileStatus => {
		if (row.processingState.endsWith('failed')) return 'failed';
		if (row.curationState === 'needs_review' || row.curationState === 'review_in_progress') return 'needs-review';
		if (row.processingState === 'queued') return 'queued';
		if (row.processingState === 'index_done' || row.processingState === 'processing_skipped') return 'approved';
		return 'processing';
	};

	let copiedRowId = $state<string | null>(null);
	let openMenuRowId = $state<string | null>(null);

	const closeMenu = () => {
		openMenuRowId = null;
	};

	const toggleMenu = (rowId: string) => {
		openMenuRowId = openMenuRowId === rowId ? null : rowId;
	};

	const handleWindowClick = (event: MouseEvent) => {
		const target = event.target as Element | null;
		if (!target?.closest('[data-row-menu-root]')) {
			closeMenu();
		}
	};

	const handleWindowKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			closeMenu();
		}
	};

	const copyObjectId = async (row: ObjectRow): Promise<void> => {
		if (!navigator?.clipboard?.writeText) {
			return;
		}

		await navigator.clipboard.writeText(row.objectId);
		copiedRowId = row.id;
		setTimeout(() => {
			if (copiedRowId === row.id) {
				copiedRowId = null;
			}
		}, 1200);
	};

	const menuHintLabel = (reason: AccessReasonCode): string | null => {
		if (reason === 'RESTORE_REQUIRED') return t('objects.table.menuHints.RESTORE_REQUIRED');
		if (reason === 'FORBIDDEN_POLICY') return t('objects.table.menuHints.FORBIDDEN_POLICY');
		if (reason === 'RESTORE_IN_PROGRESS') return t('objects.table.menuHints.RESTORE_IN_PROGRESS');
		return null;
	};
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<section class="rounded-2xl border border-border-soft bg-surface-white">
	<div class="overflow-x-auto">
		<div class="min-w-[1120px]">
			<div class="grid grid-cols-[36px_64px_2fr_1fr_1.2fr_0.9fr_1fr_1fr_1fr_84px] gap-3 border-b border-border-soft px-6 py-3 text-xs uppercase tracking-[0.2em] text-text-muted">
				<span></span>
				<span>{t('objects.table.headers.preview')}</span>
				<span>{t('objects.table.headers.title')}</span>
				<span>{t('objects.table.headers.type')}</span>
				<span>{t('objects.table.headers.processing')}</span>
				<span>{t('objects.table.headers.indicators')}</span>
				<span>{t('objects.table.headers.access')}</span>
				<span>{t('objects.table.headers.updated')}</span>
				<span>{t('objects.table.headers.batch')}</span>
				<span>{t('objects.table.headers.actions')}</span>
			</div>
	{#if rows.length === 0}
		<div class="px-6 py-12 text-center text-sm text-text-muted">
			{#if hasActiveFilters}
				<p>{t('objects.table.emptyFiltered')}</p>
				<a href={resolve('/objects')} class="mt-3 inline-flex rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.clearFilters')}</a>
			{:else}
				<p>{t('objects.table.empty')}</p>
			{/if}
		</div>
	{:else}
			<div class="divide-y divide-border-soft">
			{#each rows as row (row.id)}
				{@const reasonCode = row.accessReasonCode as AccessReasonCode}
				{@const menuHint = menuHintLabel(reasonCode)}
				<div class="grid grid-cols-[36px_64px_2fr_1fr_1.2fr_0.9fr_1fr_1fr_1fr_84px] items-center gap-3 px-6 py-4">
					<input
						type="checkbox"
						class="h-4 w-4 rounded border-border-soft text-blue-slate"
						checked={selectedIds.includes(row.id)}
						onchange={() => onToggleSelection(row.id)}
					/>
					<a
						href={resolve('/objects/[objectId]', { objectId: row.objectId })}
						class="transition hover:opacity-90"
					>
						<ObjectThumbnail
							objectId={row.objectId}
							thumbnailArtifactId={row.thumbnailArtifactId}
							objectType={row.type}
							class="h-12 w-12"
						/>
					</a>
					<div>
						<a href={resolve('/objects/[objectId]', { objectId: row.objectId })} class="text-sm font-medium text-text-ink underline-offset-2 hover:text-blue-slate hover:underline">
							{row.title ?? titleFallback(row)}
						</a>
						<a href={resolve('/objects/[objectId]', { objectId: row.objectId })} class="block text-[11px] text-text-muted underline-offset-2 hover:text-blue-slate hover:underline">{row.objectId}</a>
						{#if !row.canDownload}
							<p class="mt-1 text-[11px] text-burnt-peach">{reasonLabel(reasonCode)}</p>
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
					<span class="text-xs text-text-muted">{accessLevelLabel(row.accessLevel)}</span>
					<span class="text-xs text-text-muted">{formatDate(row.updatedAt)}</span>
					<span class="text-xs text-blue-slate" title={availabilityLabel(row.availabilityState)}>{row.sourceBatchLabel ?? '-'}</span>
					<div class="flex justify-end" data-row-menu-root>
						<div class="relative">
							<button
								type="button"
								onclick={() => toggleMenu(row.id)}
								class="rounded-full border border-border-soft px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-text-muted hover:border-blue-slate/35 hover:text-blue-slate"
								aria-expanded={openMenuRowId === row.id}
								aria-controls={`row-actions-${row.id}`}
							>
								{t('objects.table.rowActions')}
							</button>
							{#if openMenuRowId === row.id}
								<div
									id={`row-actions-${row.id}`}
									class="absolute right-0 z-10 mt-2 w-44 rounded-xl border border-border-soft bg-surface-white p-2 shadow-[0_16px_36px_rgba(31,47,56,0.18)]"
								>
									<a href={resolve('/objects/[objectId]', { objectId: row.objectId })} onclick={closeMenu} class="block rounded-lg px-3 py-2 text-xs text-text-ink hover:bg-alabaster-grey/70">
									{t('objects.table.open')}
								</a>
								<button
									type="button"
									onclick={() => {
										closeMenu();
										void copyObjectId(row);
									}}
									class="block w-full rounded-lg px-3 py-2 text-left text-xs text-text-ink hover:bg-alabaster-grey/70"
								>
									{copiedRowId === row.id ? t('objects.table.copied') : t('objects.table.copyId')}
								</button>
								{#if row.sourceIngestionId}
									<a
										href={resolve('/ingestion/[batchId]', { batchId: row.sourceIngestionId })}
										onclick={closeMenu}
										class="block rounded-lg px-3 py-2 text-xs text-text-ink hover:bg-alabaster-grey/70"
									>
										{t('objects.table.batchLink')}
									</a>
								{/if}
								{#if menuHint}
									<p class="mt-1 border-t border-border-soft px-3 pt-2 text-[11px] text-burnt-peach">{menuHint}</p>
								{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
		</div>
	</div>
</section>

<footer class="flex flex-wrap items-center justify-between gap-4">
	<p class="text-xs text-text-muted">
		{formatTemplate(t('objects.table.showing'), { rows: rows.length, filtered: filteredCount, total: totalCount })}
	</p>
	<div class="flex items-center gap-2">
		{#if showFirstPage}
			<form method="GET" action={resolve('/objects')}>
				{#each queryEntries as entry (entry[0])}
					{#if entry[0] !== 'cursor'}
						<input type="hidden" name={entry[0]} value={entry[1]} />
					{/if}
				{/each}
				<BaseButton variant="secondary" type="submit">{t('objects.table.firstPage')}</BaseButton>
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
				<BaseButton variant="secondary" type="submit">{t('objects.table.next')}</BaseButton>
			</form>
		{:else}
			<span class="rounded-full border border-border-soft px-3 py-1 text-xs uppercase tracking-[0.2em] text-text-muted">{t('objects.table.noMore')}</span>
		{/if}
	</div>
</footer>
