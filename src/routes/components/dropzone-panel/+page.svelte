<script lang="ts">
	import DropzonePanel from '$lib/components/DropzonePanel.svelte';
</script>

<section class="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Component</p>
		<h1 class="font-display text-3xl text-burnt-peach">DropzonePanel</h1>
		<p class="mt-2 text-sm text-text-muted">Archival emphasis zone for uploads.</p>
	</header>
	<DropzonePanel
		label="Dropzone"
		headline="Drag files here or click to browse"
		support="Images, PDFs, audio, video, and archives. No upload until review."
		badges={["Creates local staging batch", "Supports batch defaults"]}
	/>
</section>
