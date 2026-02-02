<script lang="ts">
	import FileOverridePanel from '$lib/components/FileOverridePanel.svelte';

	const fields = [
		{ label: 'Language', value: 'Persian' },
		{ label: 'Document type', value: 'Newspaper scan' }
	];
	const badges = [
		{ label: 'Layout OCR', tone: 'system' },
		{ label: 'Image tagging', tone: 'system' },
		{ label: 'Needs human review', tone: 'attention' }
	] as const;
</script>

<section class="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">Component</p>
		<h1 class="font-display text-3xl text-[var(--burnt-peach)]">FileOverridePanel</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">Per-file override block.</p>
	</header>
	<FileOverridePanel
		title="Per-file Overrides"
		subtitle="Overrides for the selected file take precedence over batch defaults."
		{fields}
		{badges}
		note="Note: Page 1 has hand annotations. Preserve margins during OCR."
	/>
</section>
