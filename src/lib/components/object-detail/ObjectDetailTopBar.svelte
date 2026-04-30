<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { FileStatus } from '$lib/types';

	let {
		backHref,
		title,
		objectId,
		processingLabel,
		processingTone,
		availabilityLabel,
		accessLevelLabel,
		reviewLabel,
		onInfoToggle,
		onResync,
		resyncRunning = false,
		resyncMessage = null
	} = $props<{
		backHref: string;
		title: string;
		objectId: string;
		processingLabel: string;
		processingTone: FileStatus;
		availabilityLabel: string;
		accessLevelLabel: string;
		reviewLabel: string;
		onInfoToggle: () => void;
		onResync: () => void;
		resyncRunning?: boolean;
		resyncMessage?: { type: 'success' | 'error'; text: string } | null;
	}>();
</script>

<header class="sticky top-0 z-20 border-b border-border-soft bg-surface-white/92 backdrop-blur">
	<div class="mx-auto max-w-[96rem] px-4 py-3 sm:px-6 lg:px-8">
		<div class="flex items-start justify-between gap-4">
			<div class="flex min-w-0 items-start gap-3 sm:gap-4">
				<button
					type="button"
					onclick={() => {
						window.location.href = backHref;
					}}
					class="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface-white text-blue-slate transition hover:bg-pale-sky/25"
					aria-label="Back"
				>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true">
						<path d="M11.5 4.5L6 10l5.5 5.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
				<div class="min-w-0">
					<div class="flex flex-wrap items-center gap-2">
						<h1 class="truncate font-display text-xl text-text-ink sm:text-2xl">{title}</h1>
						<Chip class="hidden sm:inline-flex border-border-soft bg-alabaster-grey/50 text-xs uppercase tracking-[0.2em] text-text-muted">{objectId}</Chip>
					</div>
					<p class="mt-1 truncate text-xs text-text-muted sm:text-sm">{reviewLabel}</p>
					<div class="mt-3 flex flex-wrap items-center gap-2">
						<StatusBadge status={processingTone} label={processingLabel} />
						<Chip class="border-blue-slate/30 bg-pale-sky/25 text-xs uppercase tracking-[0.2em] text-blue-slate">{availabilityLabel}</Chip>
						<Chip class="border-border-soft bg-alabaster-grey/60 text-xs uppercase tracking-[0.2em] text-text-muted">{accessLevelLabel}</Chip>
					</div>
				</div>
			</div>

			<div class="flex shrink-0 items-center gap-1.5 sm:gap-2">
				<button
					type="button"
					onclick={onInfoToggle}
					class="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-white px-2 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/25 sm:px-3"
				>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" class="h-4 w-4 shrink-0" aria-hidden="true">
						<circle cx="10" cy="10" r="7" />
						<path d="M10 8v4" stroke-linecap="round" />
						<circle cx="10" cy="6" r="0.8" fill="currentColor" stroke="none" />
					</svg>
					<span class="hidden sm:inline">Info</span>
				</button>
				<button
					type="button"
					onclick={onResync}
					disabled={resyncRunning}
					class="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-white px-2 py-2 text-xs uppercase tracking-[0.2em] text-text-muted transition hover:bg-pale-sky/25 hover:text-blue-slate disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
				>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4 shrink-0" aria-hidden="true">
						<path d="M3.5 12A7 7 0 1 0 5 7" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M3.5 4v3.5H7" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span class="hidden sm:inline">{resyncRunning ? 'Resyncing' : 'Resync'}</span>
				</button>
			</div>
		</div>

		{#if resyncMessage}
			<p class={`mt-3 text-xs ${resyncMessage.type === 'success' ? 'text-blue-slate' : 'text-burnt-peach'}`}>
				{resyncMessage.text}
			</p>
		{/if}
	</div>
</header>
