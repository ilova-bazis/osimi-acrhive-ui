<script lang="ts">
	import type { FileItem, FileStatus } from '$lib/types';
	import FileRow from './FileRow.svelte';

	let { title, subtitle, files, selectedId, statusLabels, onSelect } = $props<{
		title: string;
		subtitle: string;
		files: FileItem[];
		selectedId: number | undefined;
		statusLabels: Record<FileStatus, string>;
		onSelect?: (file: FileItem) => void;
	}>();
</script>

<div class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-white)]">
	<div class="border-b border-[var(--border-soft)] px-6 py-4">
		<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">{title}</p>
		<p class="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
	</div>
	<div class="divide-y divide-[var(--border-soft)]">
		{#each files as file}
			<FileRow
				{file}
				selected={selectedId === file.id}
				statusLabel={statusLabels[file.status] ?? file.status}
				onSelect={onSelect}
			/>
		{/each}
	</div>
</div>
