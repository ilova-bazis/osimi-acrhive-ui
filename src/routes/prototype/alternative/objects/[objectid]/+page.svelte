<script lang="ts">
	import AltObjectTopBar from '$lib/components/object-view-alt/AltObjectTopBar.svelte';
	import AltObjectInfoSheet from '$lib/components/object-view-alt/AltObjectInfoSheet.svelte';
	import AltDocumentViewer from '$lib/components/object-view-alt/AltDocumentViewer.svelte';
	import AltImageViewer from '$lib/components/object-view-alt/AltImageViewer.svelte';
	import AltAudioViewer from '$lib/components/object-view-alt/AltAudioViewer.svelte';
	import AltVideoViewer from '$lib/components/object-view-alt/AltVideoViewer.svelte';
	import type { ObjectViewRecord } from '$lib/objectView/types';

	type SheetState = 'hidden' | 'peek' | 'expanded';
	type MediaAvailability = 'AVAILABLE' | 'ARCHIVED' | 'RESTORE_PENDING' | 'RESTORING' | 'UNAVAILABLE';

	const AVAILABILITY_STATES: MediaAvailability[] = ['AVAILABLE', 'ARCHIVED', 'RESTORING', 'UNAVAILABLE'];

	const DEFAULT_AVAILABILITY: Record<string, MediaAvailability> = {
		'samarkand-ledger-1928': 'AVAILABLE',
		'studio-portrait-1931': 'ARCHIVED',
		'oral-history-reel-07': 'RESTORING',
		'khorog-visit-1974': 'AVAILABLE'
	};

	let {
		data
	} = $props<{
		data: {
			object: ObjectViewRecord;
			reviewItems: Array<{ id: string; title: string; mediaType: ObjectViewRecord['mediaType'] }>;
		};
	}>();

	let sheetState = $state<SheetState>('hidden');
	let availabilityMap = $state<Record<string, MediaAvailability>>({ ...DEFAULT_AVAILABILITY });
	let restoreTimers = $state<Record<string, number>>({});

	const object = $derived(data.object);
	const currentAvailability = $derived(availabilityMap[object.id] ?? 'AVAILABLE');

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

	const setAvailability = (state: MediaAvailability): void => {
		// Clear any pending restore timer for this object
		if (restoreTimers[object.id]) {
			window.clearTimeout(restoreTimers[object.id]);
			delete restoreTimers[object.id];
		}
		availabilityMap[object.id] = state;
	};

	const handleRequestAccess = (): void => {
		// Simulate: ARCHIVED → RESTORING → AVAILABLE (after 3s)
		availabilityMap[object.id] = 'RESTORING';
		restoreTimers[object.id] = window.setTimeout(() => {
			availabilityMap[object.id] = 'AVAILABLE';
			delete restoreTimers[object.id];
		}, 3000);
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

	<!-- Viewer area -->
	<div class="relative min-h-0 flex-1">
		{#if object.mediaType === 'document'}
			<AltDocumentViewer
				title={object.title}
				pages={object.pages}
				hasOcr={object.hasOcr}
				availability={currentAvailability}
				onRequestAccess={handleRequestAccess}
			/>
		{:else if object.mediaType === 'image'}
			<AltImageViewer
				imageUrl={object.imageUrl}
				imageAlt={object.imageAlt}
				hasZoom={object.hasZoom}
				availability={currentAvailability}
				onRequestAccess={handleRequestAccess}
			/>
		{:else if object.mediaType === 'audio'}
			<AltAudioViewer
				durationSeconds={object.durationSeconds}
				waveform={object.waveform}
				transcript={object.transcript}
				availability={currentAvailability}
				onRequestAccess={handleRequestAccess}
			/>
		{:else}
			<AltVideoViewer
				posterUrl={object.posterUrl}
				durationSeconds={object.durationSeconds}
				subtitles={object.subtitles}
				transcript={object.transcript}
				availability={currentAvailability}
				onRequestAccess={handleRequestAccess}
			/>
		{/if}
	</div>

	<!-- Bottom bar: nav pills + availability toggle -->
	<div class="fixed bottom-0 inset-x-0 z-20 flex items-end justify-between gap-3 px-4 pb-4 pointer-events-none {sheetState !== 'hidden' ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200">
		<!-- Nav pills -->
		<nav class="pointer-events-auto flex items-center gap-2 rounded-full border border-border-soft/30 bg-black/30 p-1.5 backdrop-blur-md">
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

		<!-- Prototype availability toggle -->
		<div class="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border-soft/30 bg-black/30 p-1.5 backdrop-blur-md">
			<span class="pl-2 pr-1 text-[9px] uppercase tracking-[0.15em] text-white/35">File state</span>
			{#each AVAILABILITY_STATES as state (state)}
				<button
					type="button"
					onclick={() => setAvailability(state)}
					class="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] transition {currentAvailability === state
						? 'bg-surface-white text-text-ink shadow-sm'
						: 'text-white/50 hover:bg-white/10 hover:text-white/70'}"
				>
					{state === 'AVAILABLE' ? 'Avail' : state === 'ARCHIVED' ? 'Arch' : state === 'RESTORING' ? 'Rest' : 'N/A'}
				</button>
			{/each}
		</div>
	</div>

	<AltObjectInfoSheet
		{sheetState}
		metadata={object.metadata}
		onStateChange={(state) => (sheetState = state)}
	/>
</div>
