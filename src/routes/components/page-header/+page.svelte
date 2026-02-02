<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';

	const locales = [
		{ key: 'en', label: 'EN' },
		{ key: 'ru', label: 'RU' }
	];
	const textSizes = [
		{ key: 'small', label: 'A-' },
		{ key: 'default', label: 'A' },
		{ key: 'large', label: 'A+' }
	];

	let locale = 'en';
	let textSize = 'default';
</script>

<section class="min-h-[60vh]">
	<PageHeader
		library="Osimi Digital Library"
		title="Batch Ingestion"
		subtitle="Human intent first. Machines assist, people decide."
		sessionLabel="Session"
		sessionValue="NoorMags Issue 76-79"
		{locales}
		{locale}
		{textSizes}
		{textSize}
		onLocaleChange={(value) => (locale = value)}
		onTextSizeChange={(value) => (textSize = value)}
	/>
	<div class="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-10">
		<h2 class="font-display text-2xl text-[var(--burnt-peach)]">PageHeader</h2>
		<p class="text-sm text-[var(--text-muted)]">Interactive header with locale + text size controls.</p>
	</div>
</section>
