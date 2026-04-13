<script lang="ts">
	import { mockObjectViews } from '$lib/objectView/mockObjects';

	const mediaTypeIcons: Record<string, string> = {
		document: '📄',
		image: '🖼️',
		audio: '🎙️',
		video: '🎬'
	};

	const mediaTypeLabels: Record<string, string> = {
		document: 'Document',
		image: 'Image',
		audio: 'Audio',
		video: 'Video'
	};
</script>

<svelte:head>
	<title>Edit Objects — Prototype</title>
</svelte:head>

<div class="min-h-screen bg-[linear-gradient(180deg,#f5f2eb_0%,#eef3f4_100%)]">
	<div class="mx-auto max-w-5xl px-6 py-12">
		<div class="mb-8">
			<p class="text-[10px] uppercase tracking-[0.25em] text-burnt-peach">Prototype</p>
			<h1 class="mt-1 font-display text-2xl text-text-ink">Object Editing</h1>
			<p class="mt-2 text-sm text-text-muted">Select an object to explore the editing experience for each media type.</p>
		</div>

		<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
			{#each mockObjectViews as object (object.id)}
				<a
					href="/prototype/glm/objects/{object.id}/edit"
					class="group rounded-2xl border border-border-soft bg-surface-white/80 p-5 shadow-sm backdrop-blur transition hover:border-pearl-beige/60 hover:shadow-md"
				>
					<div class="mb-3 flex items-center justify-between">
						<span class="text-2xl">{mediaTypeIcons[object.mediaType] ?? '📁'}</span>
						<span class="rounded-full border border-blue-slate/20 bg-pale-sky/20 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-blue-slate">
							{mediaTypeLabels[object.mediaType] ?? object.mediaType}
						</span>
					</div>
					<h3 class="font-display text-sm text-text-ink group-hover:text-blue-slate">{object.title}</h3>
					<p class="mt-1 text-xs text-text-muted line-clamp-2">{object.subtitle}</p>
					<div class="mt-3 flex items-center gap-1.5">
						<span class="inline-block h-1.5 w-1.5 rounded-full {object.status === 'READY' ? 'bg-blue-slate' : object.status === 'NEEDS_REVIEW' ? 'bg-burnt-peach' : 'bg-pearl-beige'}"></span>
						<span class="text-[9px] uppercase tracking-[0.12em] text-text-muted">{object.status.replace('_', ' ')}</span>
					</div>
				</a>
			{/each}
		</div>

		<div class="mt-12 rounded-xl border border-border-soft bg-surface-white/60 px-5 py-4">
			<p class="text-xs text-text-muted">
				This prototype demonstrates the editing experience for each media type. Documents have per-page OCR vs curated text editing. 
				Audio and video have auto-transcription vs curated transcript editing. Images have metadata-only editing.
			</p>
		</div>
	</div>
</div>