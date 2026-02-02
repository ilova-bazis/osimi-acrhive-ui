<script lang="ts">
	import BatchIntentPanel from '$lib/components/BatchIntentPanel.svelte';

	const fields = [
		{ label: 'Primary language', value: 'Persian' },
		{ label: 'Content category', value: 'Newspaper' },
		{ label: 'Pipeline preset', value: 'Layout OCR + review' },
		{ label: 'Visibility', value: 'Team' }
	];
</script>

<section class="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">Component</p>
		<h1 class="font-display text-3xl text-[var(--burnt-peach)]">BatchIntentPanel</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">Human intent sidebar block.</p>
	</header>
	<BatchIntentPanel
		title="Batch Intent"
		heading="NoorMags Issue 76-79"
		description="Scanned newspaper issues from 1971. Human notes drive all pipelines."
		{fields}
		tags={['Tehran', 'Cultural review', '1970s']}
		tagsLabel="Tags"
	/>
</section>
