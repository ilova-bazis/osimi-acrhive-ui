<script lang="ts">
	import SourceTextDiff from './SourceTextDiff.svelte';
	import type { DocumentEditData } from '$lib/objectView/mockEditData';

	let {
		editData,
		onEditDataChange
	}: {
		editData: DocumentEditData;
		onEditDataChange: (patch: Partial<DocumentEditData>) => void;
	} = $props();

	let localEditMode = $state(editData.editMode);
	let selectedPageIndex = $state(0);

	const currentPage = $derived(editData.pages[selectedPageIndex] ?? editData.pages[0]);

	const handlePageCuratedChange = (text: string): void => {
		const updatedPages = editData.pages.map((p, i) =>
			i === selectedPageIndex ? { ...p, curatedText: text } : p
		);
		onEditDataChange({ pages: updatedPages });
	};

	const handleWholeDocCuratedChange = (text: string): void => {
		onEditDataChange({ wholeDocumentCuratedText: text });
	};
</script>

<div class="space-y-4">
	<!-- Edit mode toggle -->
	<div class="flex items-center gap-2">
		<button
			type="button"
			onclick={() => {
				localEditMode = 'per-page';
				onEditDataChange({ editMode: 'per-page' });
			}}
			class="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {localEditMode === 'per-page'
				? 'bg-blue-slate text-surface-white'
				: 'border border-border-soft text-text-muted hover:bg-pale-sky/30'}"
		>
			Per-page
		</button>
		<button
			type="button"
			onclick={() => {
				localEditMode = 'whole-document';
				onEditDataChange({ editMode: 'whole-document' });
			}}
			class="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {localEditMode === 'whole-document'
				? 'bg-blue-slate text-surface-white'
				: 'border border-border-soft text-text-muted hover:bg-pale-sky/30'}"
		>
			Whole document
		</button>
	</div>

	{#if localEditMode === 'per-page'}
		<!-- Page selector strip -->
		<div class="flex gap-1.5 overflow-x-auto pb-2">
			{#each editData.pages as page, i (page.id)}
				<button
					type="button"
					onclick={() => (selectedPageIndex = i)}
					class="shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] transition {selectedPageIndex === i
						? 'border-blue-slate bg-blue-slate text-surface-white'
						: page.curatedText
							? 'border-pearl-beige/60 bg-pearl-beige/20 text-blue-slate'
							: 'border-border-soft bg-surface-white text-text-muted hover:bg-pale-sky/20'}"
				>
					{page.label}
					{#if page.curatedText}
						<span class="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-pearl-beige"></span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Per-page diff editor -->
		{#if currentPage}
			<SourceTextDiff
				sourceLabel="OCR text"
				curatedLabel="Curated text"
				sourceText={currentPage.ocrText}
				curatedText={currentPage.curatedText}
				confidence={currentPage.confidence}
				onCuratedChange={handlePageCuratedChange}
			/>
		{/if}
	{:else}
		<!-- Whole-document mode -->
		<div class="rounded-xl border border-blue-slate/10 bg-pale-sky/10 px-4 py-3 text-xs text-text-muted">
			Editing curated text for the entire document. Individual page edits will be merged.
		</div>
		<SourceTextDiff
			sourceLabel="Combined OCR text"
			curatedLabel="Curated document text"
			sourceText={editData.pages.map((p) => p.ocrText).join('\n\n---\n\n')}
			curatedText={editData.wholeDocumentCuratedText}
			onCuratedChange={handleWholeDocCuratedChange}
		/>
	{/if}
</div>