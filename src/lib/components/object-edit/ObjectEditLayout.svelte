<script lang="ts">
	import ObjectEditTopBar from './ObjectEditTopBar.svelte';
	import ObjectEditPanel from './ObjectEditPanel.svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ObjectViewRecord } from '$lib/objectView/types';
	import type {
		ObjectEditData,
		EditableMetadata,
		EditableRights,
		DocumentEditData,
		AudioEditData,
		VideoEditData
	} from '$lib/objectView/mockEditData';
	import { deepCloneEditData, isDocumentEditData, isAudioEditData, isVideoEditData } from '$lib/objectView/mockEditData';

	type TabId = 'details' | 'source-text' | 'rights';

	let {
		object,
		initialEditData
	}: {
		object: ObjectViewRecord;
		initialEditData: ObjectEditData;
	} = $props();

	let editData = $state<ObjectEditData>(deepCloneEditData(initialEditData));
	let dirtyTabs = new SvelteSet<TabId>();

	const initialSnapshot = $state(JSON.stringify(initialEditData));

	let isDirty = $derived(JSON.stringify(editData) !== initialSnapshot);

	const markDirty = (tab: TabId): void => {
		dirtyTabs.add(tab);
	};

	const handleMetadataChange = (patch: Partial<EditableMetadata>): void => {
		editData = { ...editData, metadata: { ...editData.metadata, ...patch } } as ObjectEditData;
		markDirty('details');
	};

	const handleRightsChange = (patch: Partial<EditableRights>): void => {
		editData = { ...editData, rights: { ...editData.rights, ...patch } } as ObjectEditData;
		markDirty('rights');
	};

	const handleDocumentEditDataChange = (patch: Partial<DocumentEditData>): void => {
		if (!isDocumentEditData(editData)) return;
		editData = { ...editData, ...patch } as ObjectEditData;
		markDirty('source-text');
	};

	const handleCuratedTranscriptChange = (segments: Array<{ id: string; startSeconds: number; endSeconds: number; curatedText: string; speaker?: string }>): void => {
		if (isAudioEditData(editData)) {
			editData = {
				...editData,
				curatedTranscript: segments.map((s) => ({
					id: s.id,
					startSeconds: s.startSeconds,
					endSeconds: s.endSeconds,
					speaker: s.speaker ?? '',
					curatedText: s.curatedText
				}))
			} as AudioEditData as ObjectEditData;
		} else if (isVideoEditData(editData)) {
			editData = {
				...editData,
				curatedTranscript: segments.map((s) => ({
					id: s.id,
					startSeconds: s.startSeconds,
					endSeconds: s.endSeconds,
					curatedText: s.curatedText
				}))
			} as VideoEditData as ObjectEditData;
		}
		markDirty('source-text');
	};

	const handleCuratedCaptionsChange = (captions: Array<{ id: string; startSeconds: number; endSeconds: number; curatedText: string }>): void => {
		if (!isVideoEditData(editData)) return;
		editData = { ...editData, curatedCaptions: captions } as VideoEditData as ObjectEditData;
		markDirty('source-text');
	};

	const bgClass = $derived.by(() => {
		switch (object.mediaType) {
			case 'document': return 'bg-[#f5f2eb]';
			case 'audio': return 'bg-[#1f2f38]';
			default: return 'bg-[#0a0f12]';
		}
	});

	const viewerLabel = $derived.by(() => {
		switch (object.mediaType) {
			case 'document': return 'pages';
			case 'image': return 'image';
			case 'audio': return 'audio';
			case 'video': return 'video';
		}
	});
</script>

<div class="flex h-screen w-screen flex-col bg-alabaster-grey">
	<ObjectEditTopBar
		title={object.title}
		mediaType={object.mediaType}
		{isDirty}
		backHref="/prototype/glm/objects"
	/>

	<div class="flex min-h-0 flex-1">
		<!-- Left pane: compressed media preview -->
		<div class="flex w-[45%] flex-col {bgClass} border-r border-border-soft">
			<div class="flex items-center justify-between border-b {object.mediaType === 'document' ? 'border-blue-slate/10' : 'border-white/10'} px-4 py-2">
				<span class="text-[9px] uppercase tracking-[0.15em] {object.mediaType === 'document' ? 'text-blue-slate/60' : 'text-white/40'}">Preview — {viewerLabel}</span>
				<span class="text-[9px] uppercase tracking-[0.12em] {object.mediaType === 'document' ? 'text-blue-slate/40' : 'text-white/25'}">Read-only</span>
			</div>
			<div class="flex-1 overflow-y-auto p-4">
				{#if object.mediaType === 'document'}
					<div class="space-y-3">
						{#each object.pages.slice(0, 6) as page (page.id)}
							<div class="rounded-lg border border-blue-slate/10 bg-surface-white/90 shadow-sm">
								<img src={page.imageUrl} alt={page.label} class="w-full rounded-t-lg" />
								<div class="px-3 py-2">
									<p class="text-[10px] uppercase tracking-[0.12em] text-blue-slate/70">{page.label}</p>
									<p class="mt-1 line-clamp-2 text-xs text-text-muted">{page.ocrText}</p>
								</div>
							</div>
						{/each}
						{#if object.pages.length > 6}
							<p class="text-center text-[10px] text-text-muted">+ {object.pages.length - 6} more pages</p>
						{/if}
					</div>
				{:else if object.mediaType === 'image'}
					<div class="flex h-full items-center justify-center rounded-lg bg-black/60 p-2">
						<img src={object.imageUrl} alt={object.imageAlt} class="max-h-[60vh] rounded object-contain" />
					</div>
				{:else if object.mediaType === 'audio'}
					<div class="rounded-xl bg-white/5 p-6 backdrop-blur">
						<div class="mb-4 flex items-center gap-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-pearl-beige/20">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5 text-pearl-beige">
									<path d="M11 5L6 9H3v6h3l5 4V5z" stroke-linecap="round" stroke-linejoin="round" />
									<path d="M15.54 8.46a5 5 0 010 7.07" stroke-linecap="round" />
								</svg>
							</div>
							<div>
								<p class="text-sm font-medium text-white/90">{object.title}</p>
								<p class="text-[10px] uppercase tracking-[0.12em] text-white/40">Duration: {Math.floor(object.durationSeconds / 60)}:{(object.durationSeconds % 60).toString().padStart(2, '0')}</p>
							</div>
						</div>
						<div class="flex h-16 items-end gap-0.5">
							{#each object.waveform as bar, i (i)}
								<div class="w-1.5 rounded-t bg-pearl-beige/40" style="height: {bar}%"></div>
							{/each}
						</div>
						<div class="mt-4">
							<p class="text-[10px] uppercase tracking-[0.12em] text-white/30">Transcript preview</p>
							<div class="mt-2 space-y-2">
								{#each object.transcript.slice(0, 3) as segment (segment.id)}
									<div class="rounded-lg bg-white/5 px-3 py-2">
										<p class="text-[10px] text-pearl-beige/60">{segment.speaker} · {Math.floor(segment.startSeconds / 60)}:{(segment.startSeconds % 60).toString().padStart(2, '0')}</p>
										<p class="mt-0.5 text-xs text-white/70">{segment.text}</p>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else if object.mediaType === 'video'}
					<div class="rounded-xl bg-white/5 backdrop-blur">
						<img src={object.posterUrl} alt="Video poster" class="w-full rounded-t-xl" />
						<div class="p-4">
							<p class="text-sm font-medium text-white/90">{object.title}</p>
							<p class="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/40">Duration: {Math.floor(object.durationSeconds / 60)}:{(object.durationSeconds % 60).toString().padStart(2, '0')}</p>
							<div class="mt-3 space-y-1.5">
								{#each object.transcript.slice(0, 2) as segment (segment.id)}
									<p class="text-xs text-white/50">{segment.text}</p>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right pane: edit panel -->
		<div class="min-w-0 flex-1 bg-alabaster-grey">
			<ObjectEditPanel
				{object}
				editData={editData}
				{dirtyTabs}
				onMetadataChange={handleMetadataChange}
				onRightsChange={handleRightsChange}
				onDocumentEditDataChange={handleDocumentEditDataChange}
				onCuratedTranscriptChange={handleCuratedTranscriptChange}
				onCuratedCaptionsChange={handleCuratedCaptionsChange}
			/>
		</div>
	</div>
</div>