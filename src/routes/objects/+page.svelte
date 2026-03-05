<script lang="ts">
	import ObjectsFilterPanel from '$lib/components/ObjectsFilterPanel.svelte';
	import ObjectsPageHeader from '$lib/components/ObjectsPageHeader.svelte';
	import ObjectsRecentStrip from '$lib/components/ObjectsRecentStrip.svelte';
	import ObjectsTable from '$lib/components/ObjectsTable.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { translate } from '$lib/i18n/translate';
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

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<div class="rounded-3xl bg-gradient-to-b from-pearl-beige/35 to-transparent p-4 sm:p-6">
		<ObjectsPageHeader
			selectionCount={selectedIds.length}
			filteredCount={data.list.filteredCount}
			totalCount={data.list.totalCount}
			visibleCount={data.list.rows.length}
			onSelectVisible={selectVisible}
			onClearSelection={clearSelection}
			onCopySelection={copySelectionIds}
			selectionCopied={selectionCopied}
		/>
	</div>

	<ObjectsFilterPanel
		filters={data.filters}
		availabilityOptions={availabilityOptions}
		accessOptions={accessOptions}
		sortOptions={sortOptions}
		activeChips={activeChips()}
	/>

	<ObjectsRecentStrip recent={data.recent} />

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
</main>
