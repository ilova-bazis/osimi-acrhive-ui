<script lang="ts">
	import StatusLegendPanel from '$lib/components/StatusLegendPanel.svelte';

	const statuses = [
		{ key: 'queued', label: 'Queued' },
		{ key: 'processing', label: 'Processing' },
		{ key: 'extracted', label: 'Extracted' },
		{ key: 'needs-review', label: 'Needs Review' },
		{ key: 'approved', label: 'Approved' },
		{ key: 'blocked', label: 'Blocked' },
		{ key: 'skipped', label: 'Skipped' },
		{ key: 'failed', label: 'Failed' }
	];
</script>

<section class="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Component</p>
		<h1 class="font-display text-3xl text-burnt-peach">StatusLegendPanel</h1>
		<p class="mt-2 text-sm text-text-muted">Legend for file state semantics.</p>
	</header>
	<StatusLegendPanel
		title="Status Legend"
		subtitle="Only one attention color. Text always explains state."
		countLabel="8 states"
		{statuses}
	/>
</section>
