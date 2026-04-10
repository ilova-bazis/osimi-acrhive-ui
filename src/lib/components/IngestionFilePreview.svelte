<script lang="ts">
	import type { IngestionMediaKind } from '$lib/services/ingestionCapabilities';
	import { onDestroy } from 'svelte';

	export type FilePreviewItem = {
		id: string;
		name: string;
		mediaType: IngestionMediaKind;
		size: string;
		previewUrl?: string | null;
	};

	let {
		files,
		maxVisible = 4
	} = $props<{
		files: FilePreviewItem[];
		maxVisible?: number;
	}>();

	let expanded = $state(false);

	const fileKindEmoji = (mediaType: IngestionMediaKind): string => {
		if (mediaType === 'audio') return '🎵';
		if (mediaType === 'video') return '🎬';
		if (mediaType === 'document') return '📄';
		return '🖼';
	};

	const visibleFiles = $derived(expanded ? files : files.slice(0, maxVisible));
	const hiddenCount = $derived(files.length - maxVisible);

	for (const file of files) {
		if (file.previewUrl) {
			onDestroy(() => {
				if (file.previewUrl?.startsWith('blob:')) {
					URL.revokeObjectURL(file.previewUrl);
				}
			});
		}
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center gap-2">
		<div class="flex items-center gap-2 overflow-x-auto py-1">
			{#each visibleFiles as file (file.id)}
				<div class="flex shrink-0 flex-col items-center gap-1">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg border border-border-soft bg-alabaster-grey/50">
						{#if file.previewUrl && file.mediaType === 'image'}
							<img
								src={file.previewUrl}
								alt={file.name}
								class="h-full w-full rounded-lg object-cover"
							/>
						{:else}
							<span class="text-xl" role="img" aria-label={file.mediaType}>
								{fileKindEmoji(file.mediaType)}
							</span>
						{/if}
					</div>
					<span class="max-w-16 truncate text-[10px] text-text-muted" title={file.name}>
						{file.name}
					</span>
				</div>
			{/each}
			{#if !expanded && hiddenCount > 0}
				<button
					type="button"
					onclick={() => (expanded = true)}
					class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-border-soft bg-alabaster-grey/30 text-[10px] text-text-muted transition hover:border-blue-slate/40 hover:text-blue-slate"
				>
					+{hiddenCount}
				</button>
			{/if}
		</div>
		{#if files.length > 1}
			<button
				type="button"
				onclick={() => (expanded = !expanded)}
				class="shrink-0 text-[10px] text-blue-slate underline-offset-2 hover:underline"
			>
				{expanded ? 'Show less' : `+${files.length - 1} more`}
			</button>
		{/if}
	</div>
</div>
