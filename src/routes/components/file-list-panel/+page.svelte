<script lang="ts">
	import FileListPanel from '$lib/components/FileListPanel.svelte';
	import type { FileItem, FileStatus } from '$lib/types';

	const files: FileItem[] = [
		{ id: 1, name: 'noormags_076_page1.tiff', type: 'Image', size: '12.4 MB', status: 'needs-review' },
		{ id: 2, name: 'noormags_076_page2.tiff', type: 'Image', size: '11.7 MB', status: 'queued' },
		{ id: 3, name: 'photo_event_2012.jpg', type: 'Photo', size: '4.5 MB', status: 'skipped' }
	];

	const statusLabels: Record<FileStatus, string> = {
		queued: 'Queued',
		processing: 'Processing',
		extracted: 'Extracted',
		'needs-review': 'Needs Review',
		approved: 'Approved',
		blocked: 'Blocked',
		skipped: 'Skipped',
		failed: 'Failed'
	};

	let selectedId = files[0]?.id;
</script>

<section class="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">Component</p>
		<h1 class="font-display text-3xl text-[var(--burnt-peach)]">FileListPanel</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">Selectable file list with status badges.</p>
	</header>
	<FileListPanel
		title="Files"
		subtitle="Select a file to preview overrides and human context."
		{files}
		{selectedId}
		{statusLabels}
		onSelect={(file) => (selectedId = file.id)}
	/>
</section>
