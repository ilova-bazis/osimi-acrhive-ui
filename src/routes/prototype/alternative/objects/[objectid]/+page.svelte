<script lang="ts">
	import AltObjectTopBar from '$lib/components/object-view-alt/AltObjectTopBar.svelte';
	import AltObjectInfoSheet from '$lib/components/object-view-alt/AltObjectInfoSheet.svelte';
	import AltDocumentViewer from '$lib/components/object-view-alt/AltDocumentViewer.svelte';
	import AltImageViewer from '$lib/components/object-view-alt/AltImageViewer.svelte';
	import AltAudioViewer from '$lib/components/object-view-alt/AltAudioViewer.svelte';
	import AltVideoViewer from '$lib/components/object-view-alt/AltVideoViewer.svelte';
	import type { ObjectViewRecord } from '$lib/objectView/types';

	type SheetState = 'hidden' | 'peek' | 'expanded';

	let {
		data
	} = $props<{
		data: {
			object: ObjectViewRecord;
			reviewItems: Array<{ id: string; title: string; mediaType: ObjectViewRecord['mediaType'] }>;
		};
	}>();

	let sheetState = $state<SheetState>('hidden');

	const object = $derived(data.object);

	const topBarVariant = $derived<'light' | 'dark'>(
		object.mediaType === 'document' ? 'light' : 'dark'
	);

	const bgClass = $derived.by(() => {
		switch (object.mediaType) {
			case 'document': return 'bg-[#f5f2eb]';
			case 'audio': return 'bg-[#1f2f38]';
			default: return 'bg-[#0a0f12]';
		}
	});

	const cycleSheet = (): void => {
		if (sheetState === 'hidden') sheetState = 'peek';
		else if (sheetState === 'peek') sheetState = 'expanded';
		else sheetState = 'hidden';
	};

	const handleKeydown = (event: KeyboardEvent): void => {
		if (event.key.toLowerCase() === 'i') {
			cycleSheet();
		}
		if (event.key === 'Escape') {
			sheetState = 'hidden';
		}
	};
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative flex h-screen w-screen flex-col {bgClass}">
	<AltObjectTopBar
		backHref="/prototype/objects"
		title={object.title}
		status={object.status}
		reviewLabel={object.reviewLabel}
		onInfoToggle={cycleSheet}
		variant={topBarVariant}
	/>

	<!-- Viewer area: fills remaining space below the top bar -->
	<div class="relative min-h-0 flex-1">
		{#if object.mediaType === 'document'}
			<AltDocumentViewer title={object.title} pages={object.pages} hasOcr={object.hasOcr} />
		{:else if object.mediaType === 'image'}
			<AltImageViewer imageUrl={object.imageUrl} imageAlt={object.imageAlt} hasZoom={object.hasZoom} />
		{:else if object.mediaType === 'audio'}
			<AltAudioViewer durationSeconds={object.durationSeconds} waveform={object.waveform} transcript={object.transcript} />
		{:else}
			<AltVideoViewer posterUrl={object.posterUrl} durationSeconds={object.durationSeconds} subtitles={object.subtitles} transcript={object.transcript} />
		{/if}
	</div>

	<!-- Floating nav pills — positioned above bottom sheet -->
	<nav class="fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border-soft/30 bg-black/30 p-1.5 backdrop-blur-md {sheetState !== 'hidden' ? 'pointer-events-none opacity-0' : 'opacity-100'} transition-opacity duration-200">
		{#each data.reviewItems as item (item.id)}
			<a
				href="/prototype/alternative/objects/{item.id}"
				class="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition {item.id === object.id
					? 'bg-surface-white text-text-ink shadow-sm'
					: 'text-white/60 hover:bg-white/10 hover:text-white'}"
			>
				{item.mediaType}
			</a>
		{/each}
	</nav>

	<AltObjectInfoSheet
		{sheetState}
		metadata={object.metadata}
		onStateChange={(state) => (sheetState = state)}
	/>
</div>
