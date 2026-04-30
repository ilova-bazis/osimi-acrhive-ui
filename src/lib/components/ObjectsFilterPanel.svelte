<script lang="ts">
	import { resolve } from '$app/paths';
	import BaseButton from '$lib/components/BaseButton.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';
	import type {
		AccessLevel,
		AvailabilityState,
		ObjectsFilters,
		ObjectsSort
	} from '$lib/services/objects';

	type ActiveFilterChip = {
		label: string;
		href: string;
	};

	let {
		filters,
		availabilityOptions,
		accessOptions,
		sortOptions,
		activeChips = []
	} = $props<{
		filters: ObjectsFilters;
		availabilityOptions: AvailabilityState[];
		accessOptions: AccessLevel[];
		sortOptions: ObjectsSort[];
		activeChips?: ActiveFilterChip[];
	}>();

	let isDrawerOpen = $state(false);
	let quickFiltersForm = $state<HTMLFormElement | null>(null);
	let drawerType = $state('');
	let drawerLanguage = $state('');
	let drawerBatchLabel = $state('');
	let drawerTag = $state('');
	let drawerFromDate = $state('');
	let drawerToDate = $state('');
	let drawerLimit = $state('25');
	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);

	const sortLabelMap = $derived<Record<ObjectsSort, string>>({
		created_at_desc: t('objects.sorts.created_at_desc'),
		created_at_asc: t('objects.sorts.created_at_asc'),
		updated_at_desc: t('objects.sorts.updated_at_desc'),
		updated_at_asc: t('objects.sorts.updated_at_asc'),
		title_asc: t('objects.sorts.title_asc'),
		title_desc: t('objects.sorts.title_desc')
	});

	const applyQuickFilters = () => {
		quickFiltersForm?.requestSubmit();
	};

	const languageOptions = $derived([
		{ value: 'en', label: t('objects.languages.en') },
		{ value: 'fa', label: t('objects.languages.fa') },
		{ value: 'tg', label: t('objects.languages.tg') },
		{ value: 'ru', label: t('objects.languages.ru') }
	]);

	const objectTypeOptions = ['GENERIC', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'] as const;
	const accessOptionLabel = (value: AccessLevel): string =>
		value === 'private'
			? t('ingestionSetup.batchIntent.accessLevels.private')
			: value === 'family'
				? t('ingestionSetup.batchIntent.accessLevels.family')
				: t('ingestionSetup.batchIntent.accessLevels.public');

	const dateInputValue = (value: string | undefined): string => {
		if (!value) return '';
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) {
			return value.slice(0, 10);
		}
		return parsed.toISOString().slice(0, 10);
	};

	const toIsoStart = (date: string): string => (date ? `${date}T00:00:00.000Z` : '');
	const toIsoEnd = (date: string): string => (date ? `${date}T23:59:59.999Z` : '');

	const syncDrawerState = () => {
		drawerType = filters.type ?? '';
		drawerLanguage = filters.language ?? '';
		drawerBatchLabel = filters.batchLabel ?? '';
		drawerTag = filters.tag ?? '';
		drawerFromDate = dateInputValue(filters.from);
		drawerToDate = dateInputValue(filters.to);
		drawerLimit = String(filters.limit ?? 25);
	};

	$effect(() => {
		if (!isDrawerOpen) {
			syncDrawerState();
		}
	});

	const openDrawer = () => {
		syncDrawerState();
		isDrawerOpen = true;
	};

	const clearDrawerFields = () => {
		drawerType = '';
		drawerLanguage = '';
		drawerBatchLabel = '';
		drawerTag = '';
		drawerFromDate = '';
		drawerToDate = '';
		drawerLimit = '25';
	};

	const isoDateFromMs = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
	const today = (): string => isoDateFromMs(Date.now());

	const setPresetRange = (days: number) => {
		const endMs = Date.now();
		drawerFromDate = isoDateFromMs(endMs - days * 24 * 60 * 60 * 1000);
		drawerToDate = isoDateFromMs(endMs);
	};

	const setThisMonth = () => {
		const [year, month] = today().split('-');
		drawerFromDate = `${year}-${month}-01`;
		drawerToDate = today();
	};

	const isDateRangeInvalid = () =>
		Boolean(drawerFromDate && drawerToDate && drawerFromDate > drawerToDate);

	const drawerActiveCount = () =>
		[
			drawerType,
			drawerLanguage,
			drawerBatchLabel,
			drawerTag,
			drawerFromDate,
			drawerToDate,
			drawerLimit !== '25' ? drawerLimit : ''
		].filter(Boolean).length;

	const hiddenChipCount = () => (activeChips.length > 2 ? activeChips.length - 2 : 0);

	const appliedDrawerCount = $derived(
		[
			filters.type,
			filters.language,
			filters.batchLabel,
			filters.tag,
			filters.from,
			filters.to,
			filters.limit !== 25 ? String(filters.limit) : ''
		].filter(Boolean).length
	);
</script>

<section class="sticky top-0 z-10 rounded-2xl border border-blue-slate/30 bg-pearl-beige/55 px-4 py-3 shadow-[0_0_0_2px_rgba(79,109,122,0.08)] backdrop-blur-sm">
	<form bind:this={quickFiltersForm} method="GET" action={resolve('/objects')} class="space-y-3">
		<input type="hidden" name="type" value={filters.type ?? ''} />
		<input type="hidden" name="language" value={filters.language ?? ''} />
		<input type="hidden" name="batch_label" value={filters.batchLabel ?? ''} />
		<input type="hidden" name="tag" value={filters.tag ?? ''} />
		<input type="hidden" name="from" value={filters.from ?? ''} />
		<input type="hidden" name="to" value={filters.to ?? ''} />
		<input type="hidden" name="limit" value={String(filters.limit ?? 25)} />
		<div class="flex flex-wrap items-center gap-2">
			<input
				type="search"
				name="q"
				value={filters.q ?? ''}
				placeholder={t('objects.filters.searchPlaceholder')}
				class="h-11 min-w-[220px] flex-1 rounded-full border border-border-soft bg-surface-white px-4 text-sm text-text-ink"
			/>
			<BaseButton type="submit" class="h-11">{t('objects.filters.search')}</BaseButton>
		</div>
		<p class="text-[11px] text-text-muted">{t('objects.filters.hint')}</p>
		<div class="flex flex-wrap items-center gap-2">
			<label class="hidden sm:inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2">
				<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('objects.filters.availability')}</span>
				<select
					name="availability_state"
					class="bg-transparent text-xs text-text-ink focus:outline-none"
					onchange={applyQuickFilters}
				>
					<option value="">{t('objects.filters.all')}</option>
					{#each availabilityOptions as option (option)}
						<option value={option} selected={filters.availabilityState === option}>{option}</option>
					{/each}
				</select>
			</label>
			<label class="hidden sm:inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2">
				<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('objects.filters.access')}</span>
				<select
					name="access_level"
					class="bg-transparent text-xs text-text-ink focus:outline-none"
					onchange={applyQuickFilters}
				>
					<option value="">{t('objects.filters.all')}</option>
					{#each accessOptions as option (option)}
						<option value={option} selected={filters.accessLevel === option}>{accessOptionLabel(option)}</option>
					{/each}
				</select>
			</label>
			<label class="hidden sm:inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2">
				<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('objects.filters.sort')}</span>
				<select
					name="sort"
					class="bg-transparent text-xs text-text-ink focus:outline-none"
					onchange={applyQuickFilters}
				>
					{#each sortOptions as option (option)}
						<option value={option} selected={(filters.sort ?? 'created_at_desc') === option}>
							{sortLabelMap[option as ObjectsSort]}
						</option>
					{/each}
				</select>
			</label>
			<BaseButton variant="secondary" type="button" class="h-10 gap-1.5" onclick={openDrawer}>
				{t('objects.filters.moreFilters')}
				{#if appliedDrawerCount > 0}
					<span class="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-slate px-1 text-[9px] font-semibold text-surface-white">
						{appliedDrawerCount}
					</span>
				{/if}
			</BaseButton>
			{#if activeChips.length > 0}
				<a href={resolve('/objects')} class="ml-auto text-xs text-text-muted hover:text-blue-slate">
					{t('objects.filters.clearFilters')}
				</a>
			{/if}
		</div>
	</form>

	<div class="mt-2 flex flex-wrap items-center gap-2">
		{#if activeChips.length === 0}
			<span class="text-xs text-text-muted">{t('objects.filters.noActiveFilters')}</span>
		{:else}
			{#each activeChips as chip, index (chip.label)}
				<a href={resolve(chip.href)} class={index > 1 ? 'hidden sm:inline-flex' : ''}>
					<Chip class="border-blue-slate/30 bg-pale-sky/20 text-blue-slate">{chip.label} ×</Chip>
				</a>
			{/each}
			{#if hiddenChipCount() > 0}
				<span class="text-xs text-text-muted sm:hidden">+{hiddenChipCount()} {t('objects.filters.moreSelected')}</span>
			{/if}
		{/if}
	</div>
</section>

{#if isDrawerOpen}
	<button
		type="button"
		aria-label={t('objects.filters.closeFilters')}
		class="fixed inset-0 z-40 bg-dark-grey/60"
		onclick={() => (isDrawerOpen = false)}
	></button>
	<aside class="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
		<div class="flex items-start justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.drawerTitle')}</p>
				<h3 class="mt-2 font-display text-xl text-text-ink">{formatTemplate(t('objects.filters.drawerSubtitle'), { count: drawerActiveCount() })}</h3>
			</div>
			<button class="text-sm text-text-muted" onclick={() => (isDrawerOpen = false)}>{t('common.close')}</button>
		</div>

		<form method="GET" action={resolve('/objects')} class="mt-6 space-y-4 text-sm text-text-muted">
			<input type="hidden" name="q" value={filters.q ?? ''} />
			<input type="hidden" name="availability_state" value={filters.availabilityState ?? ''} />
			<input type="hidden" name="access_level" value={filters.accessLevel ?? ''} />
			<input type="hidden" name="sort" value={filters.sort ?? 'created_at_desc'} />
			<input type="hidden" name="type" value={drawerType} />
			<input type="hidden" name="language" value={drawerLanguage} />
			<input type="hidden" name="batch_label" value={drawerBatchLabel} />
			<input type="hidden" name="tag" value={drawerTag} />
			<input type="hidden" name="from" value={toIsoStart(drawerFromDate)} />
			<input type="hidden" name="to" value={toIsoEnd(drawerToDate)} />
			<input type="hidden" name="limit" value={drawerLimit} />

			<div class="rounded-xl border border-border-soft bg-alabaster-grey/40 p-3 text-xs text-text-muted">{t('objects.filters.drawerHint')}</div>

			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.type')}</span>
				<select bind:value={drawerType} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2">
					<option value="">{t('objects.filters.anyType')}</option>
					{#each objectTypeOptions as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<p class="mt-1 text-[11px] text-text-muted">{t('objects.filters.typeHint')}</p>
			</label>
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.language')}</span>
				<select bind:value={drawerLanguage} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2">
					<option value="">{t('objects.filters.anyLanguage')}</option>
					{#each languageOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				<p class="mt-1 text-[11px] text-text-muted">{t('objects.filters.languageHint')}</p>
			</label>
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.batchLabel')}</span>
				<input bind:value={drawerBatchLabel} placeholder={t('objects.filters.batchPlaceholder')} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" />
			</label>
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.tag')}</span>
				<input bind:value={drawerTag} placeholder={t('objects.filters.tagPlaceholder')} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" />
			</label>

			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.datePresets')}</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={() => setPresetRange(1)}>{t('objects.filters.last24h')}</button>
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={() => setPresetRange(7)}>{t('objects.filters.last7d')}</button>
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={() => setPresetRange(30)}>{t('objects.filters.last30d')}</button>
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={setThisMonth}>{t('objects.filters.thisMonth')}</button>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<label class="block">
					<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.from')}</span>
					<input
						type="date"
						bind:value={drawerFromDate}
						class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2"
					/>
				</label>
				<label class="block">
					<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.to')}</span>
					<input
						type="date"
						bind:value={drawerToDate}
						class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2"
					/>
				</label>
			</div>
			{#if isDateRangeInvalid()}
				<p class="text-xs text-burnt-peach">{t('objects.filters.invalidRange')}</p>
			{/if}
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.filters.limit')}</span>
				<select bind:value={drawerLimit} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2">
					<option value="25">25</option>
					<option value="50">50</option>
					<option value="100">100</option>
				</select>
			</label>

			<div class="sticky bottom-0 mt-6 flex items-center justify-end gap-3 border-t border-border-soft bg-surface-white pt-4">
				<BaseButton variant="secondary" type="button" onclick={clearDrawerFields}>
					{t('objects.filters.reset')}
				</BaseButton>
				<BaseButton variant="secondary" type="button" onclick={() => (isDrawerOpen = false)}>
					{t('common.cancel')}
				</BaseButton>
				<BaseButton type="submit" disabled={isDateRangeInvalid()}>
					{t('objects.filters.applyFilters')}
				</BaseButton>
			</div>
		</form>
	</aside>
{/if}
