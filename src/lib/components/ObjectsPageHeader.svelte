<script lang="ts">
	import BaseButton from '$lib/components/BaseButton.svelte';

	let { selectionCount = 0, filteredCount = 0, totalCount = 0 } = $props<{
		selectionCount?: number;
		filteredCount?: number;
		totalCount?: number;
	}>();
</script>

<header class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Objects</p>
		<h2 class="mt-2 font-display text-2xl text-text-ink">Objects</h2>
		<p class="mt-2 text-sm text-text-muted">Archive object catalog with access and availability states.</p>
		<p class="mt-2 text-xs text-text-muted">{filteredCount} matching objects · {totalCount} total</p>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<BaseButton variant="secondary" disabled={selectionCount === 0} class="disabled:opacity-50">
			Bulk actions
		</BaseButton>
	</div>
</header>
