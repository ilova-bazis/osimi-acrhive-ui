<script lang="ts">
	import ObjectsFilterPanel from '$lib/components/ObjectsFilterPanel.svelte';
	import ObjectsRecentStrip from '$lib/components/ObjectsRecentStrip.svelte';
	import ObjectsTable from '$lib/components/ObjectsTable.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';
	import type {
		AccessLevel,
		AvailabilityState,
		ObjectRow,
		ObjectsFilters,
		ObjectsSort
	} from '$lib/services/objects';

	type ActiveFilterChip = {
		label: string;
		href: string;
	};

	let {
		data
	} = $props<{ data: { recent: ObjectRow[]; list: { rows: ObjectRow[]; filteredCount: number; totalCount: number; nextCursor?: string | null }; filters: ObjectsFilters } }>();

	let selectedIds = $state<string[]>([]);
	let selectionCopied = $state(false);
	let showResyncConfirm = $state(false);
	let resyncRunning = $state(false);
	let resyncMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);

	const availabilityOptions: AvailabilityState[] = [
		'AVAILABLE',
		'ARCHIVED',
		'RESTORE_PENDING',
		'RESTORING',
		'UNAVAILABLE'
	];
	const accessOptions: AccessLevel[] = ['private', 'family', 'public'];
	const sortOptions: ObjectsSort[] = [
		'created_at_desc',
		'created_at_asc',
		'updated_at_desc',
		'updated_at_asc',
		'title_asc',
		'title_desc'
	];

	const toggleSelection = (id: string) => {
		const next = [...selectedIds];
		const index = next.indexOf(id);
		if (index >= 0) next.splice(index, 1);
		else next.push(id);
		selectedIds = next;
	};

	const clearSelection = () => {
		selectedIds = [];
	};

	const selectVisible = () => {
		selectedIds = data.list.rows.map((row: ObjectRow) => row.id);
	};

	const copySelectionIds = async () => {
		if (!navigator?.clipboard?.writeText || selectedIds.length === 0) {
			return;
		}

		const selectedObjectIds = data.list.rows
			.filter((row: ObjectRow) => selectedIds.includes(row.id))
			.map((row: ObjectRow) => row.objectId)
			.join('\n');

		if (!selectedObjectIds) {
			return;
		}

		await navigator.clipboard.writeText(selectedObjectIds);
		selectionCopied = true;
		setTimeout(() => {
			selectionCopied = false;
		}, 1200);
	};

	$effect(() => {
		const visibleIds = new Set(data.list.rows.map((row: ObjectRow) => row.id));
		const next = selectedIds.filter((id) => visibleIds.has(id));
		if (next.length !== selectedIds.length) {
			selectedIds = next;
		}
	});

	const requestBulkResync = async () => {
		showResyncConfirm = false;
		resyncRunning = true;
		resyncMessage = null;
		const objectIds = data.list.rows
			.filter((row: ObjectRow) => selectedIds.includes(row.id))
			.map((row: ObjectRow) => row.objectId);
		try {
			const response = await fetch('/objects/resync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ objectIds })
			});
			if (response.status === 401) {
				window.location.href = '/login';
				return;
			}
			const payload = await response.json().catch(() => null);
			if (!response.ok || !payload?.results) {
				resyncMessage = { type: 'error', text: t('objects.resync.failed') };
			} else {
				const succeeded = (payload.results as { ok: boolean }[]).filter((r) => r.ok).length;
				const total = objectIds.length;
				resyncMessage = {
					type: succeeded === total ? 'success' : 'error',
					text: formatTemplate(t('objects.resync.resyncDone'), { succeeded, total })
				};
				selectedIds = [];
			}
		} catch {
			resyncMessage = { type: 'error', text: t('objects.resync.failed') };
		} finally {
			resyncRunning = false;
		}
	};

	const availabilityLabel = (value: AvailabilityState): string => value.replace(/_/g, ' ');
	const accessLabel = (value: AccessLevel): string => value.charAt(0).toUpperCase() + value.slice(1);
	const compactDate = (value: string): string => {
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) {
			return value;
		}
		return parsed.toISOString().slice(0, 10);
	};

	const queryEntries = (filters: ObjectsFilters = data.filters): Array<[string, string]> => {
		const entries: Array<[string, string]> = [];
		if (filters.q) entries.push(['q', filters.q]);
		if (filters.availabilityState) entries.push(['availability_state', filters.availabilityState]);
		if (filters.accessLevel) entries.push(['access_level', filters.accessLevel]);
		if (filters.language) entries.push(['language', filters.language]);
		if (filters.batchLabel) entries.push(['batch_label', filters.batchLabel]);
		if (filters.type) entries.push(['type', filters.type]);
		if (filters.from) entries.push(['from', filters.from]);
		if (filters.to) entries.push(['to', filters.to]);
		if (filters.tag) entries.push(['tag', filters.tag]);
		if (filters.limit) entries.push(['limit', String(filters.limit)]);
		if (filters.sort) entries.push(['sort', filters.sort]);
		if (filters.cursor) entries.push(['cursor', filters.cursor]);
		return entries;
	};

	const toHref = (filters: ObjectsFilters): string => {
		const params = new URLSearchParams(queryEntries(filters));
		return params.toString().length > 0 ? `/objects?${params.toString()}` : '/objects';
	};

	const withoutCursor = (filters: ObjectsFilters): ObjectsFilters => ({ ...filters, cursor: undefined });

	const activeChips = (): ActiveFilterChip[] => {
		const chips: ActiveFilterChip[] = [];
		if (data.filters.q) {
			chips.push({
				label: `${t('objects.filters.search')}: ${data.filters.q}`,
				href: toHref(withoutCursor({ ...data.filters, q: undefined }))
			});
		}
		if (data.filters.availabilityState) {
			chips.push({
				label: `${t('objects.filters.availability')}: ${availabilityLabel(data.filters.availabilityState)}`,
				href: toHref(withoutCursor({ ...data.filters, availabilityState: undefined }))
			});
		}
		if (data.filters.accessLevel) {
			chips.push({
				label: `${t('objects.filters.access')}: ${accessLabel(data.filters.accessLevel)}`,
				href: toHref(withoutCursor({ ...data.filters, accessLevel: undefined }))
			});
		}
		if (data.filters.language) {
			chips.push({
				label: `${t('objects.filters.language')}: ${data.filters.language}`,
				href: toHref(withoutCursor({ ...data.filters, language: undefined }))
			});
		}
		if (data.filters.batchLabel) {
			chips.push({
				label: `${t('objects.filters.batchLabel')}: ${data.filters.batchLabel}`,
				href: toHref(withoutCursor({ ...data.filters, batchLabel: undefined }))
			});
		}
		if (data.filters.type) {
			chips.push({
				label: `${t('objects.filters.type')}: ${data.filters.type}`,
				href: toHref(withoutCursor({ ...data.filters, type: undefined }))
			});
		}
		if (data.filters.from) {
			chips.push({
				label: `${t('objects.filters.from')}: ${compactDate(data.filters.from)}`,
				href: toHref(withoutCursor({ ...data.filters, from: undefined }))
			});
		}
		if (data.filters.to) {
			chips.push({
				label: `${t('objects.filters.to')}: ${compactDate(data.filters.to)}`,
				href: toHref(withoutCursor({ ...data.filters, to: undefined }))
			});
		}
		if (data.filters.tag) {
			chips.push({
				label: `${t('objects.filters.tag')}: ${data.filters.tag}`,
				href: toHref(withoutCursor({ ...data.filters, tag: undefined }))
			});
		}
		if (data.filters.limit && data.filters.limit !== 25) {
			chips.push({
				label: `${t('objects.filters.limit')}: ${data.filters.limit}`,
				href: toHref(withoutCursor({ ...data.filters, limit: 25 }))
			});
		}
		return chips;
	};

	const hasActiveFilters = () => activeChips().length > 0;
</script>

<main class="page-container">
<div class="page-inner">
	<div class="flex items-start justify-between gap-6">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Catalog</p>
			<h1 class="mt-1 font-display text-2xl text-text-ink leading-tight">Objects</h1>
			{#if hasActiveFilters()}
				<p class="mt-1 text-sm text-text-muted">{data.list.filteredCount.toLocaleString()} matching · {data.list.totalCount.toLocaleString()} total</p>
			{/if}
		</div>
		<p class="shrink-0 pt-1 font-mono text-xs text-text-muted">{data.list.totalCount.toLocaleString()} total</p>
	</div>
	<ObjectsFilterPanel
		filters={data.filters}
		availabilityOptions={availabilityOptions}
		accessOptions={accessOptions}
		sortOptions={sortOptions}
		activeChips={activeChips()}
	/>

	<ObjectsRecentStrip recent={data.recent} />

	<div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-soft bg-surface-white px-4 py-2.5">
		<div class="flex items-center gap-3">
			{#if selectedIds.length > 0}
				<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-slate text-[10px] font-semibold text-surface-white">
					{selectedIds.length}
				</span>
				<p class="text-xs text-blue-slate">
					{formatTemplate(t('objects.header.selectionState'), { selected: selectedIds.length, visible: data.list.rows.length })}
				</p>
			{:else}
				<p class="text-xs text-text-muted">{t('objects.header.subtitle')}</p>
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onclick={selectVisible}
				disabled={data.list.rows.length === 0 || selectedIds.length === data.list.rows.length}
				class="rounded-full border border-blue-slate px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-blue-slate transition-colors hover:bg-pale-sky/20 disabled:cursor-not-allowed disabled:opacity-40"
			>
				{t('objects.header.selectVisible')}
			</button>
			{#if selectedIds.length > 0}
				<button
					type="button"
					onclick={clearSelection}
					class="rounded-full border border-border-soft px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-text-muted transition-colors hover:border-blue-slate/35 hover:text-blue-slate"
				>
					{t('objects.header.clearSelection')}
				</button>
				<button
					type="button"
					onclick={copySelectionIds}
					class="rounded-full border border-border-soft px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-text-muted transition-colors hover:border-blue-slate/35 hover:text-blue-slate"
				>
					{selectionCopied ? t('objects.header.copiedSelection') : t('objects.header.copySelectionIds')}
				</button>
				<button
					type="button"
					onclick={() => (showResyncConfirm = true)}
					disabled={resyncRunning}
					class="rounded-full bg-blue-slate px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-surface-white transition-colors hover:bg-blue-slate-mid-dark disabled:cursor-not-allowed disabled:opacity-50"
				>
					{resyncRunning ? '…' : t('objects.resync.resyncSelected')}
				</button>
			{/if}
		</div>
	</div>

	{#if resyncMessage}
		<p class={`-mt-3 text-xs ${resyncMessage.type === 'success' ? 'text-blue-slate' : 'text-burnt-peach'}`}>
			{resyncMessage.text}
		</p>
	{/if}

	<ObjectsTable
		rows={data.list.rows}
		selectedIds={selectedIds}
		onToggleSelection={toggleSelection}
		hasActiveFilters={hasActiveFilters()}
		queryEntries={queryEntries()}
		nextCursor={data.list.nextCursor ?? null}
		showFirstPage={Boolean(data.filters.cursor)}
		filteredCount={data.list.filteredCount}
		totalCount={data.list.totalCount}
	/>
</div>
</main>

{#if showResyncConfirm}
	<button
		type="button"
		aria-label="Close"
		class="fixed inset-0 z-40 bg-blue-slate/35"
		onclick={() => (showResyncConfirm = false)}
	></button>
	<div class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.resync.confirmTitle')}</p>
		<p class="mt-3 text-sm text-text-muted">
			{formatTemplate(t('objects.resync.confirmBodyBulk'), { count: selectedIds.length })}
		</p>
		<div class="mt-5 flex justify-end gap-3">
			<button
				type="button"
				onclick={() => (showResyncConfirm = false)}
				class="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-blue-slate/35 hover:text-blue-slate"
			>
				{t('common.cancel')}
			</button>
			<button
				type="button"
				onclick={requestBulkResync}
				class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white hover:bg-blue-slate-mid-dark"
			>
				{t('common.confirm')}
			</button>
		</div>
	</div>
{/if}
