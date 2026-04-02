<script lang="ts">
	import { fly } from 'svelte/transition';
	import Chip from '$lib/components/Chip.svelte';
	import type { ObjectViewMetadata } from '$lib/objectView/types';

	type SheetState = 'hidden' | 'peek' | 'expanded';

	let {
		sheetState,
		metadata,
		onStateChange
	} = $props<{
		sheetState: SheetState;
		metadata: ObjectViewMetadata;
		onStateChange: (state: SheetState) => void;
	}>();

	const details = $derived([
		{ label: 'Date', value: metadata.publicationDate },
		{ label: 'Language', value: metadata.language },
		{ label: 'Access', value: metadata.accessLevel },
		{ label: 'Collection', value: metadata.collection }
	]);

	const handleHandleClick = (): void => {
		if (sheetState === 'peek') onStateChange('expanded');
		else if (sheetState === 'expanded') onStateChange('peek');
	};
</script>

<!-- Scrim -->
{#if sheetState === 'expanded'}
	<div
		class="fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px]"
		role="button"
		tabindex="-1"
		aria-label="Close details"
		onclick={() => onStateChange('hidden')}
		onkeydown={(e) => { if (e.key === 'Escape') onStateChange('hidden'); }}
		transition:fly={{ duration: 180 }}
	></div>
{/if}

<!-- Sheet -->
{#if sheetState !== 'hidden'}
	<aside
		class="fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border-soft bg-surface-white shadow-[0_-8px_30px_rgba(31,47,56,0.15)]"
		in:fly={{ y: 200, duration: 300, easing: (t) => 1 - Math.pow(1 - t, 3) }}
		out:fly={{ y: 200, duration: 220 }}
	>
		<!-- Drag handle -->
		<button
			type="button"
			class="flex w-full cursor-pointer flex-col items-center px-5 pb-2 pt-3"
			onclick={handleHandleClick}
			aria-label={sheetState === 'peek' ? 'Expand details' : 'Collapse details'}
		>
			<div class="h-1 w-9 rounded-full bg-text-muted/25"></div>
		</button>

		<!-- Peek header — always visible -->
		<div class="flex items-center justify-between gap-4 px-5 pb-3">
			<div class="min-w-0">
				<h2 class="truncate font-display text-lg text-text-ink">{metadata.title}</h2>
				<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
					<span>{metadata.publicationDate}</span>
					<span class="h-3 w-px bg-border-soft"></span>
					<span>{metadata.accessLevel}</span>
					<span class="h-3 w-px bg-border-soft"></span>
					<span>{metadata.language}</span>
				</div>
			</div>
			<button
				type="button"
				class="shrink-0 rounded-full border border-border-soft p-1.5 text-text-muted transition hover:text-blue-slate"
				aria-label="Close info"
				onclick={() => onStateChange('hidden')}
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4" aria-hidden="true">
					<path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
				</svg>
			</button>
		</div>

		<!-- Expanded content -->
		{#if sheetState === 'expanded'}
			<div class="flex-1 space-y-5 overflow-y-auto border-t border-border-soft px-5 py-5">
				<section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					{#each details as detail (detail.label)}
						<div class="rounded-xl border border-border-soft bg-alabaster-grey/40 px-3 py-2.5">
							<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">{detail.label}</p>
							<p class="mt-1.5 text-sm text-text-ink">{detail.value}</p>
						</div>
					{/each}
				</section>

				<section>
					<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Tags</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each metadata.tags as tag (tag.label)}
							<Chip class="border-blue-slate/20 bg-pale-sky/25 text-[10px] uppercase tracking-[0.16em] text-blue-slate">{tag.label}</Chip>
						{/each}
					</div>
				</section>

				<section>
					<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Description</p>
					<p class="mt-2 text-sm leading-relaxed text-text-ink">{metadata.description}</p>
				</section>

				<section>
					<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Rights note</p>
					<p class="mt-2 rounded-xl border border-pearl-beige bg-pearl-beige/35 px-4 py-3 text-sm leading-relaxed text-text-ink">
						{metadata.rightsNote}
					</p>
				</section>
			</div>
		{/if}
	</aside>
{/if}
