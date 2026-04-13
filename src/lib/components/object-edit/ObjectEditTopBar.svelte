<script lang="ts">
	import type { ObjectViewRecord } from '$lib/objectView/types';

	let {
		title,
		mediaType,
		isDirty,
		backHref
	}: {
		title: string;
		mediaType: ObjectViewRecord['mediaType'];
		isDirty: boolean;
		backHref: string;
	} = $props();

	const mediaTypeLabels: Record<string, string> = {
		document: 'Document',
		image: 'Image',
		audio: 'Audio',
		video: 'Video'
	};

	let onSave = $state(false);
</script>

<header class="flex items-center justify-between gap-4 border-b border-border-soft bg-surface-white/95 px-5 py-3 backdrop-blur-sm">
	<!-- Left: back + title -->
	<div class="flex items-center gap-3 min-w-0">
		<a
			href={backHref}
			class="flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-text-muted transition hover:bg-pale-sky/30 hover:text-blue-slate"
			aria-label="Back to objects"
		>
			<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
				<path d="M12 4l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</a>
		<div class="min-w-0">
			<h1 class="truncate font-display text-base text-text-ink">{title}</h1>
			<div class="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-text-muted">
				<span>{mediaTypeLabels[mediaType] ?? mediaType}</span>
				<span class="h-3 w-px bg-border-soft"></span>
				<span>Edit mode</span>
				{#if isDirty}
					<span class="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-burnt-peach"></span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Right: actions -->
	<div class="flex items-center gap-2">
		{#if isDirty}
			<button
				type="button"
				class="rounded-full border border-border-soft px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-text-muted transition hover:bg-pale-sky/20"
				onclick={() => {
					if (confirm('Discard all unsaved changes?')) {
						window.location.reload();
					}
				}}
			>
				Discard
			</button>
			<button
				type="button"
				class="rounded-full bg-blue-slate px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate-mid-dark"
				onclick={() => {
					onSave = true;
					setTimeout(() => (onSave = false), 2000);
				}}
			>
				{onSave ? 'Saved' : 'Save changes'}
			</button>
		{:else}
			<span class="text-[10px] uppercase tracking-[0.15em] text-text-muted/60">No changes</span>
		{/if}
	</div>
</header>