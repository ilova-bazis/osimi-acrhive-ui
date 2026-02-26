<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import type { ObjectRow } from '$lib/services/objects';

	let { recent } = $props<{ recent: ObjectRow[] }>();

	const titleFallback = (row: ObjectRow) => `Untitled - ${row.objectId.slice(-6)}`;
	const availabilityLabel = (value: ObjectRow['availabilityState']) => value.replace(/_/g, ' ');
</script>

<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
	<div class="flex items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Recently ingested</p>
			<p class="mt-1 text-sm text-text-muted">Quick access to recent work</p>
		</div>
		<p class="text-xs text-text-muted">Last {recent.length} objects</p>
	</div>
	<div class="mt-4 flex gap-4 overflow-x-auto pb-2">
		{#each recent as item (item.id)}
			<div class="min-w-[220px] rounded-xl border border-border-soft bg-alabaster-grey/60 p-3 shadow-[0_10px_20px_rgba(79,109,122,0.08)]">
				<p class="text-sm font-medium text-text-ink">{item.title ?? titleFallback(item)}</p>
				<p class="mt-1 text-xs text-text-muted">{item.type}</p>
				<div class="mt-2 flex items-center gap-2">
					<Chip class="border-blue-slate/30 bg-pale-sky/20 text-[10px] text-blue-slate">
						{availabilityLabel(item.availabilityState)}
					</Chip>
					{#if !item.canDownload}
						<Chip class="border-burnt-peach/30 bg-pearl-beige text-[10px] text-burnt-peach">Restricted</Chip>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>
