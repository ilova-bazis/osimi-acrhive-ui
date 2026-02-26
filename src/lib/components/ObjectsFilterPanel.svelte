<script lang="ts">
	import { resolve } from '$app/paths';
	import BaseButton from '$lib/components/BaseButton.svelte';
	import Chip from '$lib/components/Chip.svelte';
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
	let drawerType = $state(filters.type ?? '');
	let drawerLanguage = $state(filters.language ?? '');
	let drawerBatchLabel = $state(filters.batchLabel ?? '');
	let drawerTag = $state(filters.tag ?? '');
	let drawerFromDate = $state('');
	let drawerToDate = $state('');
	let drawerLimit = $state(String(filters.limit ?? 25));

	const sortLabelMap: Record<ObjectsSort, string> = {
		created_at_desc: 'Created (Newest)',
		created_at_asc: 'Created (Oldest)',
		updated_at_desc: 'Updated (Newest)',
		updated_at_asc: 'Updated (Oldest)',
		title_asc: 'Title (A-Z)',
		title_desc: 'Title (Z-A)'
	};

	const applyQuickFilters = () => {
		quickFiltersForm?.requestSubmit();
	};

	const languageOptions = [
		{ value: 'en', label: 'English (en)' },
		{ value: 'fa', label: 'Persian (fa)' },
		{ value: 'tg', label: 'Tajik (tg)' },
		{ value: 'ru', label: 'Russian (ru)' }
	];

	const objectTypeOptions = ['GENERIC', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'] as const;

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
				placeholder="Search title, object id, OCR..."
				class="h-11 min-w-[220px] flex-1 rounded-full border border-border-soft bg-surface-white px-4 text-sm text-text-ink"
			/>
			<BaseButton type="submit" class="h-11">Search</BaseButton>
		</div>
		<p class="text-[11px] text-text-muted">Press Enter to search. Availability, access, and sort apply immediately.</p>
		<div class="flex flex-wrap items-center gap-2">
			<label class="hidden sm:inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2">
				<span class="text-[10px] uppercase tracking-[0.18em] text-text-muted">Availability</span>
				<select
					name="availability_state"
					class="bg-transparent text-xs text-text-ink focus:outline-none"
					onchange={applyQuickFilters}
				>
					<option value="">All</option>
					{#each availabilityOptions as option (option)}
						<option value={option} selected={filters.availabilityState === option}>{option}</option>
					{/each}
				</select>
			</label>
			<label class="hidden sm:inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2">
				<span class="text-[10px] uppercase tracking-[0.18em] text-text-muted">Access</span>
				<select
					name="access_level"
					class="bg-transparent text-xs text-text-ink focus:outline-none"
					onchange={applyQuickFilters}
				>
					<option value="">All</option>
					{#each accessOptions as option (option)}
						<option value={option} selected={filters.accessLevel === option}>{option}</option>
					{/each}
				</select>
			</label>
			<label class="hidden sm:inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2">
				<span class="text-[10px] uppercase tracking-[0.18em] text-text-muted">Sort</span>
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
			<BaseButton variant="secondary" type="button" class="h-10" onclick={openDrawer}>
				More filters
			</BaseButton>
			{#if activeChips.length > 0}
				<a href={resolve('/objects')} class="ml-auto text-xs text-text-muted hover:text-blue-slate">
					Clear filters
				</a>
			{/if}
		</div>
	</form>

	<div class="mt-2 flex flex-wrap items-center gap-2">
		{#if activeChips.length === 0}
			<span class="text-xs text-text-muted">No active filters</span>
		{:else}
			{#each activeChips as chip, index (chip.label)}
				<a href={resolve(chip.href)} class={index > 1 ? 'hidden sm:inline-flex' : ''}>
					<Chip class="border-blue-slate/30 bg-pale-sky/20 text-blue-slate">{chip.label} ×</Chip>
				</a>
			{/each}
		{/if}
	</div>
</section>

{#if isDrawerOpen}
	<button
		type="button"
		aria-label="Close filters"
		class="fixed inset-0 z-40 bg-dark-grey/60"
		onclick={() => (isDrawerOpen = false)}
	></button>
	<aside class="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
		<div class="flex items-start justify-between">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Filters</p>
				<h3 class="mt-2 font-display text-xl text-text-ink">Refine objects ({drawerActiveCount()} active)</h3>
			</div>
			<button class="text-sm text-text-muted" onclick={() => (isDrawerOpen = false)}>Close</button>
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

			<div class="rounded-xl border border-border-soft bg-alabaster-grey/40 p-3 text-xs text-text-muted">
				Use this panel for detailed filters. Quick filters above apply instantly; this form applies as a batch.
			</div>

			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Type</span>
				<select bind:value={drawerType} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2">
					<option value="">Any type</option>
					{#each objectTypeOptions as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</select>
				<p class="mt-1 text-[11px] text-text-muted">Uses backend enum values.</p>
			</label>
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Language</span>
				<select bind:value={drawerLanguage} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2">
					<option value="">Any language</option>
					{#each languageOptions as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				<p class="mt-1 text-[11px] text-text-muted">Choose a common language code used in object metadata.</p>
			</label>
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Batch label</span>
				<input bind:value={drawerBatchLabel} placeholder="batch-2026" class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" />
			</label>
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Tag</span>
				<input bind:value={drawerTag} placeholder="tag" class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2" />
			</label>

			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Date presets</p>
				<div class="mt-2 flex flex-wrap gap-2">
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={() => setPresetRange(1)}>Last 24h</button>
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={() => setPresetRange(7)}>Last 7d</button>
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={() => setPresetRange(30)}>Last 30d</button>
					<button type="button" class="rounded-full border border-border-soft px-3 py-1 text-[11px]" onclick={setThisMonth}>This month</button>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<label class="block">
					<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">From</span>
					<input
						type="date"
						bind:value={drawerFromDate}
						class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2"
					/>
				</label>
				<label class="block">
					<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">To</span>
					<input
						type="date"
						bind:value={drawerToDate}
						class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2"
					/>
				</label>
			</div>
			{#if isDateRangeInvalid()}
				<p class="text-xs text-burnt-peach">Invalid range: start date must be earlier than end date.</p>
			{/if}
			<label class="block">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Limit</span>
				<select bind:value={drawerLimit} class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-4 py-2">
					<option value="25">25</option>
					<option value="50">50</option>
					<option value="100">100</option>
				</select>
			</label>

			<div class="sticky bottom-0 mt-6 flex items-center justify-end gap-3 border-t border-border-soft bg-surface-white pt-4">
				<BaseButton variant="secondary" type="button" onclick={clearDrawerFields}>
					Reset
				</BaseButton>
				<BaseButton variant="secondary" type="button" onclick={() => (isDrawerOpen = false)}>
					Cancel
				</BaseButton>
				<BaseButton type="submit" disabled={isDateRangeInvalid()}>
					Apply filters
				</BaseButton>
			</div>
		</form>
	</aside>
{/if}
