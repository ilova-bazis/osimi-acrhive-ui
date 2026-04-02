<script lang="ts">
	import AudioViewer from '$lib/components/object-view/AudioViewer.svelte';
	import DocumentViewer from '$lib/components/object-view/DocumentViewer.svelte';
	import ImageViewer from '$lib/components/object-view/ImageViewer.svelte';
	import ObjectInfoDrawer from '$lib/components/object-view/ObjectInfoDrawer.svelte';
	import ObjectTopBar from '$lib/components/object-view/ObjectTopBar.svelte';
	import VideoViewer from '$lib/components/object-view/VideoViewer.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import type { ObjectViewRecord } from '$lib/objectView/types';

	let {
		data
	} = $props<{
		data: {
			object: ObjectViewRecord;
			reviewItems: Array<{ id: string; title: string; mediaType: ObjectViewRecord['mediaType'] }>;
		};
	}>();

	let infoOpen = $state(false);

	const object = $derived(data.object);

	const toggleInfo = (): void => {
		infoOpen = !infoOpen;
	};

	const handleKeydown = (event: KeyboardEvent): void => {
		if (event.key.toLowerCase() === 'i') {
			infoOpen = !infoOpen;
		}
		if (event.key === 'Escape') {
			infoOpen = false;
		}
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<ObjectTopBar
	backHref="/prototype/objects"
	title={object.title}
	status={object.status}
	reviewLabel={object.reviewLabel}
	onInfoToggle={toggleInfo}
/>

<main class="min-h-screen bg-[linear-gradient(180deg,#f5f2eb_0%,#edf1f2_100%)]">
	<section class="border-b border-border-soft bg-surface-white/70 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-[96rem] flex-wrap items-center gap-2">
			<p class="mr-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">Review mocked objects</p>
			{#each data.reviewItems as item (item.id)}
				<button
					type="button"
					onclick={() => {
						window.location.href = `/prototype/objects/${item.id}`;
					}}
					class={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${item.id === object.id ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`}
				>
					{item.mediaType}
				</button>
			{/each}
			<Chip class="ml-auto border-border-soft bg-surface-white text-[10px] uppercase tracking-[0.2em] text-text-muted">Press I for info</Chip>
		</div>
	</section>

	<div class="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
		<div class="mb-5 max-w-2xl">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{object.mediaType} object</p>
			<p class="mt-2 text-sm leading-relaxed text-text-muted">{object.subtitle} The page stays intentionally calm and read-only so the object itself remains the primary focus.</p>
		</div>

		{#if object.mediaType === 'document'}
			<DocumentViewer title={object.title} pages={object.pages} hasOcr={object.hasOcr} />
		{:else if object.mediaType === 'image'}
			<ImageViewer imageUrl={object.imageUrl} imageAlt={object.imageAlt} hasZoom={object.hasZoom} />
		{:else if object.mediaType === 'audio'}
			<AudioViewer durationSeconds={object.durationSeconds} waveform={object.waveform} transcript={object.transcript} />
		{:else}
			<VideoViewer posterUrl={object.posterUrl} durationSeconds={object.durationSeconds} subtitles={object.subtitles} transcript={object.transcript} />
		{/if}
	</div>
</main>

<ObjectInfoDrawer open={infoOpen} metadata={object.metadata} onClose={() => (infoOpen = false)} />
