<script lang="ts">
	import ObjectEditDetails from './ObjectEditDetails.svelte';
	import ObjectEditSourceText from './ObjectEditSourceText.svelte';
	import ObjectEditTranscript from './ObjectEditTranscript.svelte';
	import ObjectEditRights from './ObjectEditRights.svelte';
	import type { ObjectViewRecord } from '$lib/objectView/types';
	import type {
		ObjectEditData,
		EditableMetadata,
		EditableRights,
		DocumentEditData
	} from '$lib/objectView/mockEditData';
	import { isDocumentEditData, isAudioEditData, isVideoEditData } from '$lib/objectView/mockEditData';

	type TabId = 'details' | 'source-text' | 'rights';

	let {
		object,
		editData,
		dirtyTabs,
		onMetadataChange,
		onRightsChange,
		onDocumentEditDataChange,
		onCuratedTranscriptChange,
		onCuratedCaptionsChange
	}: {
		object: ObjectViewRecord;
		editData: ObjectEditData;
		dirtyTabs: Set<TabId>;
		onMetadataChange: (patch: Partial<EditableMetadata>) => void;
		onRightsChange: (patch: Partial<EditableRights>) => void;
		onDocumentEditDataChange: (patch: Partial<DocumentEditData>) => void;
		onCuratedTranscriptChange: (segments: Array<{ id: string; startSeconds: number; endSeconds: number; curatedText: string; speaker?: string }>) => void;
		onCuratedCaptionsChange: (captions: Array<{ id: string; startSeconds: number; endSeconds: number; curatedText: string }>) => void;
	} = $props();

	const showSourceTextTab = $derived(object.mediaType !== 'image');

	const tabs = $derived.by(() => {
		const result: Array<{ id: TabId; label: string }> = [
			{ id: 'details', label: 'Details' }
		];
		if (showSourceTextTab) {
			result.push({ id: 'source-text', label: 'Source Text' });
		}
		result.push({ id: 'rights', label: 'Rights & Access' });
		return result;
	});

	let activeTab = $state<TabId>('details');
</script>

<div class="flex h-full flex-col">
	<!-- Tab strip -->
	<div class="flex items-center gap-1 border-b border-border-soft px-1">
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				onclick={() => (activeTab = tab.id)}
				class="relative px-4 py-3 text-[10px] uppercase tracking-[0.2em] transition {activeTab === tab.id
					? 'text-blue-slate'
					: 'text-text-muted hover:text-blue-slate'}"
			>
				{tab.label}
				{#if dirtyTabs.has(tab.id)}
					<span class="absolute right-1 top-2 h-1.5 w-1.5 rounded-full bg-burnt-peach"></span>
				{/if}
				{#if activeTab === tab.id}
					<span class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-slate"></span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	<div class="flex-1 overflow-y-auto p-5">
		{#if activeTab === 'details'}
			<ObjectEditDetails
				metadata={editData.metadata}
				onMetadataChange={onMetadataChange}
			/>
		{:else if activeTab === 'source-text' && isDocumentEditData(editData)}
			<ObjectEditSourceText
				editData={editData}
				onEditDataChange={onDocumentEditDataChange}
			/>
		{:else if activeTab === 'source-text' && (isAudioEditData(editData) || isVideoEditData(editData))}
			{@const sourceSegments = object.mediaType === 'audio' || object.mediaType === 'video' ? object.transcript : []}
			{@const mappedTranscript = isAudioEditData(editData)
				? editData.curatedTranscript.map((s) => ({
					id: s.id,
					startSeconds: s.startSeconds,
					endSeconds: s.endSeconds,
					text: sourceSegments.find((t) => t.id === s.id)?.text ?? '',
					curatedText: s.curatedText,
					speaker: s.speaker
				}))
				: isVideoEditData(editData)
					? editData.curatedTranscript.map((s) => ({
						id: s.id,
						startSeconds: s.startSeconds,
						endSeconds: s.endSeconds,
						text: sourceSegments.find((t) => t.id === s.id)?.text ?? '',
						curatedText: s.curatedText
					}))
					: []}
			<ObjectEditTranscript
				{object}
				curatedTranscript={mappedTranscript}
				curatedCaptions={isVideoEditData(editData) ? editData.curatedCaptions : undefined}
				onCuratedTranscriptChange={onCuratedTranscriptChange}
				onCuratedCaptionsChange={isVideoEditData(editData) ? onCuratedCaptionsChange : undefined}
			/>
		{:else if activeTab === 'rights'}
			<ObjectEditRights
				rights={editData.rights}
				onRightsChange={onRightsChange}
			/>
		{/if}
	</div>
</div>