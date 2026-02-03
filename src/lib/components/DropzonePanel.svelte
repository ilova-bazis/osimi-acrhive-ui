<script lang="ts">
	import Chip from './Chip.svelte';

	let { label, headline, support, badges = [] } = $props<{
		label: string;
		headline: string;
		support: string;
		badges?: string[];
	}>();
</script>

<div class="rounded-2xl border border-border-soft bg-pearl-beige/75 px-6 py-8 text-center">
	<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{label}</p>
	<p class="mt-3 font-display text-xl text-text-ink">{headline}</p>
	<p class="mt-2 text-sm text-text-muted">{support}</p>
	{#if badges.length}
		<div class="mt-6 flex flex-wrap justify-center gap-2 text-xs text-blue-slate">
			{#each badges as badge (badge)}
				<Chip class="border-border-soft bg-surface-white">{badge}</Chip>
			{/each}
		</div>
	{/if}
</div>
