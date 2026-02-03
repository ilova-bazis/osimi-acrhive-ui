<script lang="ts">
	import FooterActions from '$lib/components/FooterActions.svelte';
</script>

<section class="min-h-[60vh]">
	<div class="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-12">
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Component</p>
		<h1 class="font-display text-3xl text-burnt-peach">FooterActions</h1>
		<p class="text-sm text-text-muted">Footer with call-to-action buttons.</p>
	</div>
	<FooterActions
		note="Human intent confirmed. Review everything before ingestion starts."
		secondaryLabel="Download catalog.json"
		primaryLabel="Start ingestion"
	/>
</section>
