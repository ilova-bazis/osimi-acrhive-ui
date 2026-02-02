<script lang="ts">
	import type { FileItem } from '$lib/types';
	import StatusBadge from './StatusBadge.svelte';

	let { file, selected = false, statusLabel, onSelect } = $props<{
		file: FileItem;
		selected?: boolean;
		statusLabel: string;
		onSelect?: (file: FileItem) => void;
	}>();
</script>

<button
	onclick={() => onSelect?.(file)}
	class={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-[rgba(192,214,223,0.35)] ${
		selected ? 'border-l-4 border-l-[var(--blue-slate)] bg-[rgba(192,214,223,0.45)]' : ''
	}`}
>
	<div>
		<p class="text-sm font-medium text-[var(--text-ink)]">{file.name}</p>
		<p class="mt-1 text-xs text-[var(--text-muted)]">{file.type} · {file.size}</p>
	</div>
	<StatusBadge status={file.status} label={statusLabel} />
</button>
