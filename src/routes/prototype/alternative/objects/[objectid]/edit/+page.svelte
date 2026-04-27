<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import ObjectEditDetails from '$lib/components/object-edit/ObjectEditDetails.svelte';
	import ObjectEditRights from '$lib/components/object-edit/ObjectEditRights.svelte';
	import SourceTextDiff from '$lib/components/object-edit/SourceTextDiff.svelte';
	import type {
		ObjectViewRecord,
		ObjectViewTranscriptSegment,
		ObjectViewSubtitleCue
	} from '$lib/objectView/types';
	import type {
		ObjectEditData,
		EditableMetadata,
		EditableRights,
		AudioEditData,
		VideoEditData
	} from '$lib/objectView/mockEditData';
	import {
		deepCloneEditData,
		isDocumentEditData,
		isAudioEditData,
		isVideoEditData,
		formatTimestamp
	} from '$lib/objectView/mockEditData';

	let { data } = $props<{
		data: {
			object: ObjectViewRecord;
			editData: ObjectEditData;
			reviewItems: Array<{ id: string; title: string; mediaType: ObjectViewRecord['mediaType'] }>;
		};
	}>();

	const object = $derived(data.object);

	let currentObjectId = $state('');
	let initialSnapshot = $state(JSON.stringify(data.editData));
	let editData = $state<ObjectEditData>(deepCloneEditData(data.editData));
	let activeDocPage = $state(0);
	let docEditMode = $state<'per-page' | 'whole-document'>(
		isDocumentEditData(data.editData) ? data.editData.editMode : 'per-page'
	);
	let activeVideoTab = $state<'transcript' | 'captions'>('transcript');
	let metadataOpen = $state(false);
	let rightsOpen = $state(false);
	let detailsPaneOpen = $state(false);

	const isDirty = $derived(JSON.stringify(editData) !== initialSnapshot);
	const docPageCount = $derived(isDocumentEditData(editData) ? editData.pages.length : 0);

	// Helper lookups — explicit cast needed since $derived prevents narrowing of find callbacks
	const getAudioSourceSeg = (segId: string): ObjectViewTranscriptSegment | undefined => {
		if (object.mediaType !== 'audio') return undefined;
		return (object.transcript as ObjectViewTranscriptSegment[]).find((t) => t.id === segId);
	};
	const getVideoSourceSeg = (segId: string): ObjectViewTranscriptSegment | undefined => {
		if (object.mediaType !== 'video') return undefined;
		return (object.transcript as ObjectViewTranscriptSegment[]).find((t) => t.id === segId);
	};
	const getVideoSourceCap = (capId: string): ObjectViewSubtitleCue | undefined => {
		if (object.mediaType !== 'video') return undefined;
		return (object.subtitles as ObjectViewSubtitleCue[]).find((s) => s.id === capId);
	};
	const draftChipClass = $derived(
		isDirty
			? 'border-pearl-beige bg-pearl-beige/65 text-burnt-peach'
			: 'border-blue-slate/20 bg-pale-sky/20 text-blue-slate'
	);

	$effect(() => {
		const newId = data.object.id;
		if (newId === currentObjectId) return;
		currentObjectId = newId;
		initialSnapshot = JSON.stringify(data.editData);
		editData = deepCloneEditData(data.editData);
		activeDocPage = 0;
		docEditMode = isDocumentEditData(data.editData) ? data.editData.editMode : 'per-page';
		activeVideoTab = 'transcript';
		metadataOpen = false;
		rightsOpen = false;
		detailsPaneOpen = false;
	});

	const handleDiscard = (): void => {
		editData = deepCloneEditData(data.editData);
	};

	const handleMetadataChange = (patch: Partial<EditableMetadata>): void => {
		editData = { ...editData, metadata: { ...editData.metadata, ...patch } } as ObjectEditData;
	};

	const handleRightsChange = (patch: Partial<EditableRights>): void => {
		editData = { ...editData, rights: { ...editData.rights, ...patch } } as ObjectEditData;
	};

	// Document handlers
	const handleDocPageCuratedChange = (text: string): void => {
		if (!isDocumentEditData(editData)) return;
		const updatedPages = editData.pages.map((p, i) =>
			i === activeDocPage ? { ...p, curatedText: text } : p
		);
		editData = { ...editData, pages: updatedPages } as ObjectEditData;
	};

	const handleWholeDocCuratedChange = (text: string): void => {
		if (!isDocumentEditData(editData)) return;
		editData = { ...editData, wholeDocumentCuratedText: text } as ObjectEditData;
	};

	// Audio handlers
	const handleAudioSegmentField = (
		segId: string,
		field: 'curatedText' | 'speaker',
		value: string
	): void => {
		if (!isAudioEditData(editData)) return;
		editData = {
			...editData,
			curatedTranscript: editData.curatedTranscript.map((s) =>
				s.id === segId ? { ...s, [field]: value } : s
			)
		} as AudioEditData as ObjectEditData;
	};

	const handleCopyAudioSegment = (segId: string): void => {
		if (!isAudioEditData(editData)) return;
		const src = getAudioSourceSeg(segId);
		if (src) handleAudioSegmentField(segId, 'curatedText', src.text);
	};

	const handleCopyAllAudio = (): void => {
		if (!isAudioEditData(editData)) return;
		editData = {
			...editData,
			curatedTranscript: editData.curatedTranscript.map((s) => {
				const src = getAudioSourceSeg(s.id);
				return src ? { ...s, curatedText: src.text } : s;
			})
		} as AudioEditData as ObjectEditData;
	};

	// Video transcript handlers
	const handleVideoTranscriptChange = (segId: string, value: string): void => {
		if (!isVideoEditData(editData)) return;
		editData = {
			...editData,
			curatedTranscript: editData.curatedTranscript.map((s) =>
				s.id === segId ? { ...s, curatedText: value } : s
			)
		} as VideoEditData as ObjectEditData;
	};

	const handleCopyVideoSegment = (segId: string): void => {
		if (!isVideoEditData(editData)) return;
		const src = getVideoSourceSeg(segId);
		if (src) handleVideoTranscriptChange(segId, src.text);
	};

	const handleCopyAllVideoTranscript = (): void => {
		if (!isVideoEditData(editData)) return;
		editData = {
			...editData,
			curatedTranscript: editData.curatedTranscript.map((s) => {
				const src = getVideoSourceSeg(s.id);
				return src ? { ...s, curatedText: src.text } : s;
			})
		} as VideoEditData as ObjectEditData;
	};

	// Video caption handlers
	const handleVideoCaptionChange = (capId: string, value: string): void => {
		if (!isVideoEditData(editData)) return;
		editData = {
			...editData,
			curatedCaptions: editData.curatedCaptions.map((c) =>
				c.id === capId ? { ...c, curatedText: value } : c
			)
		} as VideoEditData as ObjectEditData;
	};

	const handleCopyVideoCaption = (capId: string): void => {
		if (!isVideoEditData(editData)) return;
		const src = getVideoSourceCap(capId);
		if (src) handleVideoCaptionChange(capId, src.text);
	};

	const handleCopyAllVideoCaptions = (): void => {
		if (!isVideoEditData(editData)) return;
		editData = {
			...editData,
			curatedCaptions: editData.curatedCaptions.map((c) => {
				const src = getVideoSourceCap(c.id);
				return src ? { ...c, curatedText: src.text } : c;
			})
		} as VideoEditData as ObjectEditData;
	};
</script>

<svelte:head>
	<title>Edit: {object.title} — Prototype</title>
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden bg-alabaster-grey">

	<!-- ── Top bar ─────────────────────────────────────────────────── -->
	<header class="flex shrink-0 items-center gap-3 border-b border-border-soft bg-surface-white/95 px-4 py-2.5 backdrop-blur sm:px-6">
		<a
			href="/prototype/alternative/objects/{object.id}"
			class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-surface-white px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
		>
			← View
		</a>
		<h1 class="min-w-0 flex-1 truncate font-display text-lg text-text-ink">{object.title}</h1>
		<Chip class="shrink-0 border-blue-slate/20 bg-pale-sky/20 text-[10px] uppercase tracking-[0.18em] text-blue-slate">
			{object.mediaType}
		</Chip>
		<Chip class="shrink-0 text-[10px] uppercase tracking-[0.18em] {draftChipClass}">
			{isDirty ? 'Unsaved changes' : 'No changes'}
		</Chip>
		<div class="ml-1 flex shrink-0 items-center gap-2">
			{#if isDirty}
				<button
					type="button"
					onclick={handleDiscard}
					class="rounded-full border border-border-soft bg-surface-white px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
				>
					Discard
				</button>
			{/if}
			<button
				type="button"
				class="rounded-full border border-border-soft bg-surface-white px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
			>
				Save draft
			</button>
			<button
				type="button"
				class="rounded-full bg-blue-slate px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate-mid-dark"
			>
				Submit for review
			</button>
		</div>
	</header>

	<!-- ── Object switcher ─────────────────────────────────────────── -->
	<div class="shrink-0 border-b border-border-soft bg-surface-white/70 px-4 py-2 backdrop-blur sm:px-6">
		<div class="flex flex-wrap items-center gap-2">
			<span class="mr-1 text-[10px] uppercase tracking-[0.2em] text-text-muted">Switch object</span>
			{#each data.reviewItems as item (item.id)}
				<a
					href="/prototype/alternative/objects/{item.id}/edit"
					class="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition {item.id === object.id
						? 'border-blue-slate bg-blue-slate text-surface-white'
						: 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}"
				>
					{item.mediaType}
				</a>
			{/each}
		</div>
	</div>

	<!-- ── Main editing area ───────────────────────────────────────── -->
	<div class="flex min-h-0 flex-1 overflow-hidden">

		<!-- ════════════════ DOCUMENT: three-column layout ════════════════ -->
		{#if object.mediaType === 'document' && isDocumentEditData(editData)}

			<!-- Left: scanned page image + page navigator strip -->
			<div class="flex w-[32%] shrink-0 flex-col border-r border-blue-slate/10 bg-[#f5f2eb]">
				<!-- Mode toggle -->
				<div class="shrink-0 border-b border-blue-slate/10 px-3 py-2 flex items-center justify-between gap-3">
					<p class="text-[9px] uppercase tracking-[0.15em] text-blue-slate/45">Curation mode</p>
					<div class="flex gap-1.5">
						<button
							type="button"
							onclick={() => (docEditMode = 'per-page')}
							class="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] transition {docEditMode === 'per-page'
								? 'bg-blue-slate text-surface-white'
								: 'border border-blue-slate/20 bg-surface-white/70 text-text-muted hover:bg-pale-sky/25'}"
						>
							Per-page
						</button>
						<button
							type="button"
							onclick={() => (docEditMode = 'whole-document')}
							class="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] transition {docEditMode === 'whole-document'
								? 'bg-blue-slate text-surface-white'
								: 'border border-blue-slate/20 bg-surface-white/70 text-text-muted hover:bg-pale-sky/25'}"
						>
							Whole doc
						</button>
					</div>
				</div>

				<!-- Scanned page image (active page) -->
				{#if docEditMode === 'per-page'}
					{@const viewPage = object.pages[activeDocPage]}
					<div class="min-h-0 flex-1 overflow-y-auto bg-[#e8e2d5] p-3">
						{#if viewPage?.imageUrl}
							<img
								src={viewPage.imageUrl}
								alt={viewPage.label}
								class="w-full rounded-lg shadow-[0_4px_18px_rgba(31,47,56,0.18)]"
							/>
						{:else}
							<div class="flex h-40 items-center justify-center rounded-lg border border-blue-slate/10 bg-surface-white/60">
								<p class="text-[10px] uppercase tracking-[0.15em] text-text-muted">No scan available</p>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Whole-doc mode: show small page grid for reference -->
					<div class="min-h-0 flex-1 overflow-y-auto p-3">
						<p class="mb-2 text-[9px] uppercase tracking-[0.15em] text-blue-slate/40">All pages</p>
						<div class="grid grid-cols-3 gap-2">
							{#each object.pages as viewPage, i (viewPage.id)}
								{@const editPage = editData.pages[i]}
								<button
									type="button"
									onclick={() => { activeDocPage = i; docEditMode = 'per-page'; }}
									class="group relative rounded-lg overflow-hidden border border-blue-slate/10 bg-surface-white/50 transition hover:border-blue-slate/30"
								>
									{#if viewPage.imageUrl}
										<img src={viewPage.imageUrl} alt={viewPage.label} class="w-full object-cover" />
									{:else}
										<div class="h-16 bg-alabaster-grey"></div>
									{/if}
									<div class="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/30 px-1.5 py-1 backdrop-blur-sm">
										<span class="text-[8px] text-white/80">{viewPage.label}</span>
										{#if editPage?.curatedText}
											<span class="h-1.5 w-1.5 rounded-full bg-pearl-beige"></span>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Horizontal page strip -->
				{#if docEditMode === 'per-page'}
					<div class="shrink-0 border-t border-blue-slate/10 bg-[#e8e2d5]/60 px-2 py-2">
						<div class="flex gap-1.5 overflow-x-auto pb-1">
							{#each editData.pages as page, i (page.id)}
								{@const viewPage = object.pages[i]}
								<button
									type="button"
									onclick={() => { activeDocPage = i; }}
									class="relative shrink-0 rounded overflow-hidden transition {i === activeDocPage
										? 'ring-2 ring-blue-slate ring-offset-1'
										: 'opacity-60 hover:opacity-90'}"
									title="{page.label} · {page.confidence}%"
								>
									{#if viewPage?.imageUrl}
										<img src={viewPage.imageUrl} alt={page.label} class="h-14 w-10 object-cover object-top" />
									{:else}
										<div class="h-14 w-10 bg-alabaster-grey"></div>
									{/if}
									{#if page.curatedText}
										<span class="absolute bottom-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-pearl-beige shadow-sm"></span>
									{/if}
								</button>
							{/each}
						</div>
						<p class="mt-1 text-[9px] text-blue-slate/50">
							{editData.pages[activeDocPage]?.label ?? ''} · {editData.pages[activeDocPage]?.confidence ?? ''}% OCR confidence
						</p>
					</div>
				{/if}
			</div>

			<!-- Center: source text diff editor -->
			<div class="flex min-w-0 flex-1 flex-col {detailsPaneOpen ? '' : 'border-r border-border-soft'} bg-surface-white">
				<!-- Editor header -->
				<div class="shrink-0 border-b border-border-soft px-5 py-3">
					{#if docEditMode === 'per-page'}
						{@const page = editData.pages[activeDocPage]}
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">
									{page?.label ?? 'Page'} · OCR confidence {page?.confidence ?? '—'}%
								</p>
								<p class="mt-0.5 text-[10px] text-text-muted">
									{page?.curatedText
										? 'Curation in progress — compare source and refine below'
										: 'No curated text yet — copy from source or write from scratch'}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1">
									<button
										type="button"
										onclick={() => (activeDocPage = Math.max(0, activeDocPage - 1))}
										disabled={activeDocPage === 0}
										class="rounded-full border border-border-soft px-3 py-1.5 text-[10px] text-blue-slate transition hover:bg-pale-sky/20 disabled:pointer-events-none disabled:opacity-30"
									>←</button>
									<span class="text-[9px] text-text-muted">{activeDocPage + 1}/{editData.pages.length}</span>
									<button
										type="button"
										onclick={() => (activeDocPage = Math.min(docPageCount - 1, activeDocPage + 1))}
										disabled={activeDocPage === docPageCount - 1}
										class="rounded-full border border-border-soft px-3 py-1.5 text-[10px] text-blue-slate transition hover:bg-pale-sky/20 disabled:pointer-events-none disabled:opacity-30"
									>→</button>
								</div>
								<button
									type="button"
									onclick={() => (detailsPaneOpen = !detailsPaneOpen)}
									class="rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {detailsPaneOpen
										? 'border-blue-slate bg-blue-slate text-surface-white'
										: 'border-border-soft text-blue-slate hover:bg-pale-sky/20'}"
									title="Toggle details panel"
								>
									Details
								</button>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Whole document curation</p>
								<p class="mt-0.5 text-[10px] text-text-muted">Editing the full combined text. Per-page edits are preserved separately and merged on save.</p>
							</div>
							<button
								type="button"
								onclick={() => (detailsPaneOpen = !detailsPaneOpen)}
								class="shrink-0 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {detailsPaneOpen
									? 'border-blue-slate bg-blue-slate text-surface-white'
									: 'border-border-soft text-blue-slate hover:bg-pale-sky/20'}"
								title="Toggle details panel"
							>
								Details
							</button>
						</div>
					{/if}
				</div>
				<!-- Diff editor -->
				<div class="min-h-0 flex-1 overflow-y-auto p-5">
					{#if docEditMode === 'per-page'}
						{@const page = editData.pages[activeDocPage]}
						{#if page}
							<SourceTextDiff
								sourceLabel="OCR text"
								curatedLabel="Curated text"
								sourceText={page.ocrText}
								curatedText={page.curatedText}
								confidence={page.confidence}
								onCuratedChange={handleDocPageCuratedChange}
							/>
						{/if}
					{:else}
						<SourceTextDiff
							sourceLabel="Combined OCR text"
							curatedLabel="Curated document text"
							sourceText={editData.pages.map((p) => p.ocrText).join('\n\n---\n\n')}
							curatedText={editData.wholeDocumentCuratedText}
							onCuratedChange={handleWholeDocCuratedChange}
						/>
					{/if}
				</div>
			</div>

			<!-- Right: collapsible metadata + rights (hidable) -->
			{#if detailsPaneOpen}
				<div class="flex w-[28%] shrink-0 flex-col overflow-y-auto border-l border-border-soft bg-alabaster-grey">
					<!-- Details accordion -->
					<div class="border-b border-border-soft">
						<button
							type="button"
							onclick={() => (metadataOpen = !metadataOpen)}
							class="flex w-full items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/10"
						>
							<span>Details</span>
							<span class="text-text-muted">{metadataOpen ? '▴' : '▾'}</span>
						</button>
						{#if metadataOpen}
							<div class="px-4 pb-5 pt-1">
								<ObjectEditDetails metadata={editData.metadata} onMetadataChange={handleMetadataChange} />
							</div>
						{/if}
					</div>
					<!-- Rights accordion -->
					<div class="border-b border-border-soft">
						<button
							type="button"
							onclick={() => (rightsOpen = !rightsOpen)}
							class="flex w-full items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/10"
						>
							<span>Rights & Access</span>
							<span class="text-text-muted">{rightsOpen ? '▴' : '▾'}</span>
						</button>
						{#if rightsOpen}
							<div class="px-4 pb-5 pt-1">
								<ObjectEditRights rights={editData.rights} onRightsChange={handleRightsChange} />
							</div>
						{/if}
					</div>
				</div>
			{/if}

		<!-- ════════════════ IMAGE: two-column, image-heavy ════════════════ -->
		{:else if object.mediaType === 'image'}

			<!-- Left: full-height image -->
			<div class="flex w-[55%] shrink-0 items-center justify-center border-r border-border-soft bg-[#0a0f12] p-6">
				<img
					src={object.imageUrl}
					alt={object.imageAlt}
					class="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
				/>
			</div>

			<!-- Right: unified form (no source-text section for images) -->
			<div class="flex min-w-0 flex-1 flex-col bg-surface-white">
				<div class="shrink-0 border-b border-border-soft px-5 py-3">
					<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Object details</p>
					<p class="mt-0.5 text-[10px] text-text-muted">
						Images have no machine-extracted text — enrich metadata and access settings directly.
					</p>
				</div>
				<div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
					<ObjectEditDetails metadata={editData.metadata} onMetadataChange={handleMetadataChange} />
					<div class="border-t border-border-soft pt-5">
						<p class="mb-4 text-[10px] uppercase tracking-[0.2em] text-blue-slate">Rights & Access</p>
						<ObjectEditRights rights={editData.rights} onRightsChange={handleRightsChange} />
					</div>
				</div>
			</div>

		<!-- ════════════════ AUDIO: two-column, segments-forward ════════════════ -->
		{:else if object.mediaType === 'audio' && isAudioEditData(editData)}

			<!-- Left: waveform reference + segment index -->
			<div class="flex w-[30%] shrink-0 flex-col border-r border-white/10 bg-[#1f2f38]">
				<!-- Waveform -->
				<div class="shrink-0 border-b border-white/10 p-5">
					<p class="text-[9px] uppercase tracking-[0.12em] text-pale-sky/45">Audio reference</p>
					<p class="mt-1 text-sm font-medium text-white/80">{object.title}</p>
					<p class="mt-0.5 text-[10px] text-white/35">
						{formatTimestamp(object.durationSeconds)} ·
						{editData.curatedTranscript.filter((s) => s.curatedText).length}/{editData.curatedTranscript.length} segments curated
					</p>
					<div class="mt-4 flex h-14 items-end gap-0.5">
						{#each object.waveform as level, i (i)}
							<div class="w-full rounded-t bg-pale-sky/35" style="height: {Math.max(8, level)}%"></div>
						{/each}
					</div>
				</div>
				<!-- Segment index -->
				<div class="flex-1 overflow-y-auto">
					<div class="border-b border-white/8 px-4 py-2">
						<p class="text-[9px] uppercase tracking-[0.15em] text-white/25">Segments</p>
					</div>
					{#each editData.curatedTranscript as seg (seg.id)}
						<div class="border-b border-white/5 px-4 py-2.5">
							<div class="flex items-center justify-between gap-2">
								<span class="text-[10px] tabular-nums text-pale-sky/55">
									{formatTimestamp(seg.startSeconds)} → {formatTimestamp(seg.endSeconds)}
								</span>
								<span
									class="h-1.5 w-1.5 shrink-0 rounded-full {seg.curatedText
										? 'bg-pearl-beige'
										: 'border border-white/20'}"
								></span>
							</div>
							{#if seg.speaker}
								<p class="mt-0.5 text-[10px] text-white/40">{seg.speaker}</p>
							{/if}
							{#if seg.curatedText}
								<p class="mt-1 line-clamp-1 text-[10px] italic text-pale-sky/50">{seg.curatedText}</p>
							{:else}
								<p class="mt-0.5 text-[10px] italic text-white/20">Uncurated</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Center: segment editor cards -->
			<div class="flex min-w-0 flex-1 flex-col overflow-hidden bg-alabaster-grey">
				<!-- Editor header -->
				<div class="shrink-0 flex items-center justify-between border-b border-border-soft bg-surface-white px-5 py-3">
					<div>
						<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Transcript curation</p>
						<p class="mt-0.5 text-[10px] text-text-muted">
							Source text is read-only; curated text is yours to refine per segment.
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<button
							type="button"
							onclick={handleCopyAllAudio}
							class="rounded-full border border-border-soft bg-surface-white px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-blue-slate transition hover:bg-pale-sky/20"
						>
							Copy all from source
						</button>
						<button
							type="button"
							onclick={() => (detailsPaneOpen = !detailsPaneOpen)}
							class="rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {detailsPaneOpen
								? 'border-blue-slate bg-blue-slate text-surface-white'
								: 'border-border-soft text-blue-slate hover:bg-pale-sky/20'}"
						>
							Details
						</button>
					</div>
				</div>
				<!-- Scrollable segment cards -->
				<div class="flex-1 overflow-y-auto">
					<div class="space-y-3 p-5">
						{#each editData.curatedTranscript as seg (seg.id)}
							{@const sourceSeg = getAudioSourceSeg(seg.id)}
							<div class="rounded-2xl border border-border-soft bg-surface-white p-4 shadow-[0_2px_10px_rgba(31,47,56,0.06)]">
								<!-- Segment header -->
								<div class="mb-3 flex items-center justify-between gap-3">
									<span class="rounded-full bg-pale-sky/25 px-2.5 py-1 text-[9px] tabular-nums text-blue-slate">
										{formatTimestamp(seg.startSeconds)} → {formatTimestamp(seg.endSeconds)}
									</span>
									<div class="flex items-center gap-2">
										{#if seg.curatedText}
											<span class="h-1.5 w-1.5 rounded-full bg-pearl-beige" title="Has curated text"></span>
										{/if}
										<button
											type="button"
											onclick={() => handleCopyAudioSegment(seg.id)}
											class="rounded-full border border-blue-slate/25 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-blue-slate transition hover:bg-pale-sky/30"
										>
											Copy from source
										</button>
									</div>
								</div>
								<!-- Speaker -->
								<div class="mb-3">
									<label class="block text-[9px] uppercase tracking-[0.15em] text-blue-slate/55">Speaker</label>
									<input
										class="mt-1 w-full rounded-lg border border-border-soft bg-pearl-beige/12 px-3 py-1.5 text-sm text-text-ink placeholder:text-text-muted/40 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
										placeholder="Speaker name..."
										value={seg.speaker}
										oninput={(e) => handleAudioSegmentField(seg.id, 'speaker', e.currentTarget.value)}
									/>
								</div>
								<!-- Source text -->
								{#if sourceSeg}
									<div class="mb-3 rounded-lg border border-blue-slate/10 bg-pale-sky/15 px-3 py-2.5">
										<p class="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-blue-slate/45">Source transcript</p>
										<p class="text-sm leading-relaxed text-blue-slate/75">{sourceSeg.text}</p>
									</div>
								{/if}
								<!-- Curated textarea -->
								<div>
									<label class="block text-[9px] uppercase tracking-[0.15em] text-blue-slate/55">Curated text</label>
									<textarea
										class="mt-1 w-full resize-none rounded-lg border border-pearl-beige/50 bg-pearl-beige/12 px-3 py-2 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/40 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
										rows="3"
										placeholder="Curated transcript text..."
										value={seg.curatedText}
										oninput={(e) => handleAudioSegmentField(seg.id, 'curatedText', e.currentTarget.value)}
									></textarea>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Right: hidable details pane -->
			{#if detailsPaneOpen}
				<div class="flex w-[28%] shrink-0 flex-col overflow-y-auto border-l border-border-soft bg-alabaster-grey">
					<div class="border-b border-border-soft">
						<button
							type="button"
							onclick={() => (metadataOpen = !metadataOpen)}
							class="flex w-full items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/10"
						>
							<span>Details</span>
							<span class="text-text-muted">{metadataOpen ? '▴' : '▾'}</span>
						</button>
						{#if metadataOpen}
							<div class="px-4 pb-5 pt-1">
								<ObjectEditDetails metadata={editData.metadata} onMetadataChange={handleMetadataChange} />
							</div>
						{/if}
					</div>
					<div class="border-b border-border-soft">
						<button
							type="button"
							onclick={() => (rightsOpen = !rightsOpen)}
							class="flex w-full items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/10"
						>
							<span>Rights & Access</span>
							<span class="text-text-muted">{rightsOpen ? '▴' : '▾'}</span>
						</button>
						{#if rightsOpen}
							<div class="px-4 pb-5 pt-1">
								<ObjectEditRights rights={editData.rights} onRightsChange={handleRightsChange} />
							</div>
						{/if}
					</div>
				</div>
			{/if}

		<!-- ════════════════ VIDEO: two-column, dual-track ════════════════ -->
		{:else if object.mediaType === 'video' && isVideoEditData(editData)}

			<!-- Left: poster + curation overview -->
			<div class="flex w-[35%] shrink-0 flex-col border-r border-white/10 bg-[#0a0f12]">
				<!-- Poster image -->
				<div class="shrink-0 border-b border-white/10">
					<img src={object.posterUrl} alt="Video poster" class="w-full object-cover" />
				</div>
				<!-- Curation overview -->
				<div class="flex-1 overflow-y-auto p-4">
					<!-- Caption preview -->
					<p class="mb-2 text-[9px] uppercase tracking-[0.15em] text-white/25">
						Captions — {editData.curatedCaptions.filter((c) => c.curatedText).length}/{editData.curatedCaptions.length} curated
					</p>
					{#each editData.curatedCaptions as cap (cap.id)}
						{@const sourceCap = getVideoSourceCap(cap.id)}
						<div class="mb-2 rounded-xl bg-white/5 px-3 py-2.5">
							<p class="mb-1 text-[9px] tabular-nums text-white/25">
								{formatTimestamp(cap.startSeconds)} → {formatTimestamp(cap.endSeconds)}
							</p>
							{#if cap.curatedText}
								<p class="text-xs text-white/70">{cap.curatedText}</p>
							{:else if sourceCap}
								<p class="text-xs italic text-white/30">{sourceCap.text}</p>
							{:else}
								<p class="text-xs italic text-white/15">Uncurated</p>
							{/if}
						</div>
					{/each}
					<!-- Transcript preview -->
					<p class="mb-2 mt-5 text-[9px] uppercase tracking-[0.15em] text-white/25">
						Transcript — {editData.curatedTranscript.filter((s) => s.curatedText).length}/{editData.curatedTranscript.length} curated
					</p>
					{#each editData.curatedTranscript as seg (seg.id)}
						<div class="mb-2 rounded-xl bg-white/5 px-3 py-2">
							<p class="text-[9px] tabular-nums text-white/25">
								{formatTimestamp(seg.startSeconds)} → {formatTimestamp(seg.endSeconds)}
							</p>
							{#if seg.curatedText}
								<p class="mt-0.5 line-clamp-1 text-xs text-white/55">{seg.curatedText}</p>
							{:else}
								<p class="mt-0.5 text-xs italic text-white/15">Uncurated</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<!-- Center: transcript/captions sub-tabs -->
			<div class="flex min-w-0 flex-1 flex-col overflow-hidden bg-alabaster-grey">
				<!-- Sub-tab strip -->
				<div class="shrink-0 flex items-center justify-between border-b border-border-soft bg-surface-white px-5 py-3">
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => (activeVideoTab = 'transcript')}
							class="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {activeVideoTab === 'transcript'
								? 'bg-blue-slate text-surface-white'
								: 'border border-border-soft text-text-muted hover:bg-pale-sky/20 hover:text-blue-slate'}"
						>
							Transcript
						</button>
						<button
							type="button"
							onclick={() => (activeVideoTab = 'captions')}
							class="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {activeVideoTab === 'captions'
								? 'bg-blue-slate text-surface-white'
								: 'border border-border-soft text-text-muted hover:bg-pale-sky/20 hover:text-blue-slate'}"
						>
							Captions
						</button>
					</div>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={activeVideoTab === 'transcript' ? handleCopyAllVideoTranscript : handleCopyAllVideoCaptions}
							class="rounded-full border border-border-soft bg-surface-white px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-blue-slate transition hover:bg-pale-sky/20"
						>
							Copy all from source
						</button>
						<button
							type="button"
							onclick={() => (detailsPaneOpen = !detailsPaneOpen)}
							class="rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {detailsPaneOpen
								? 'border-blue-slate bg-blue-slate text-surface-white'
								: 'border-border-soft text-blue-slate hover:bg-pale-sky/20'}"
						>
							Details
						</button>
					</div>
				</div>
				<!-- Scrollable content -->
				<div class="flex-1 overflow-y-auto">
					{#if activeVideoTab === 'transcript'}
						<!-- Transcript segment cards -->
						<div class="space-y-3 p-5">
							{#each editData.curatedTranscript as seg (seg.id)}
								{@const sourceSeg = getVideoSourceSeg(seg.id)}
								<div class="rounded-2xl border border-border-soft bg-surface-white p-4 shadow-[0_2px_10px_rgba(31,47,56,0.06)]">
									<div class="mb-3 flex items-center justify-between gap-3">
										<span class="rounded-full bg-pale-sky/25 px-2.5 py-1 text-[9px] tabular-nums text-blue-slate">
											{formatTimestamp(seg.startSeconds)} → {formatTimestamp(seg.endSeconds)}
										</span>
										<div class="flex items-center gap-2">
											{#if seg.curatedText}
												<span class="h-1.5 w-1.5 rounded-full bg-pearl-beige"></span>
											{/if}
											<button
												type="button"
												onclick={() => handleCopyVideoSegment(seg.id)}
												class="rounded-full border border-blue-slate/25 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-blue-slate transition hover:bg-pale-sky/30"
											>
												Copy from source
											</button>
										</div>
									</div>
									{#if sourceSeg}
										<div class="mb-3 rounded-lg border border-blue-slate/10 bg-pale-sky/15 px-3 py-2.5">
											<p class="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-blue-slate/45">Source transcript</p>
											<p class="text-sm leading-relaxed text-blue-slate/75">{sourceSeg.text}</p>
										</div>
									{/if}
									<div>
										<label class="block text-[9px] uppercase tracking-[0.15em] text-blue-slate/55">Curated text</label>
										<textarea
											class="mt-1 w-full resize-none rounded-lg border border-pearl-beige/50 bg-pearl-beige/12 px-3 py-2 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/40 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
											rows="3"
											placeholder="Curated transcript text..."
											value={seg.curatedText}
											oninput={(e) => handleVideoTranscriptChange(seg.id, e.currentTarget.value)}
										></textarea>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<!-- Caption segment cards -->
						<div class="space-y-3 p-5">
							{#each editData.curatedCaptions as cap (cap.id)}
								{@const sourceCap = getVideoSourceCap(cap.id)}
								<div class="rounded-2xl border border-border-soft bg-surface-white p-4 shadow-[0_2px_10px_rgba(31,47,56,0.06)]">
									<div class="mb-3 flex items-center justify-between gap-3">
										<span class="rounded-full bg-pale-sky/25 px-2.5 py-1 text-[9px] tabular-nums text-blue-slate">
											{formatTimestamp(cap.startSeconds)} → {formatTimestamp(cap.endSeconds)}
										</span>
										<div class="flex items-center gap-2">
											{#if cap.curatedText}
												<span class="h-1.5 w-1.5 rounded-full bg-pearl-beige"></span>
											{/if}
											<button
												type="button"
												onclick={() => handleCopyVideoCaption(cap.id)}
												class="rounded-full border border-blue-slate/25 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-blue-slate transition hover:bg-pale-sky/30"
											>
												Copy from source
											</button>
										</div>
									</div>
									{#if sourceCap}
										<div class="mb-3 rounded-lg border border-blue-slate/10 bg-pale-sky/15 px-3 py-2.5">
											<p class="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-blue-slate/45">Source caption</p>
											<p class="text-sm leading-relaxed text-blue-slate/75">{sourceCap.text}</p>
										</div>
									{/if}
									<div>
										<label class="block text-[9px] uppercase tracking-[0.15em] text-blue-slate/55">Curated caption</label>
										<textarea
											class="mt-1 w-full resize-none rounded-lg border border-pearl-beige/50 bg-pearl-beige/12 px-3 py-2 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/40 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
											rows="2"
											placeholder="Curated caption text..."
											value={cap.curatedText}
											oninput={(e) => handleVideoCaptionChange(cap.id, e.currentTarget.value)}
										></textarea>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Right: hidable details pane -->
			{#if detailsPaneOpen}
				<div class="flex w-[28%] shrink-0 flex-col overflow-y-auto border-l border-border-soft bg-alabaster-grey">
					<div class="border-b border-border-soft">
						<button
							type="button"
							onclick={() => (metadataOpen = !metadataOpen)}
							class="flex w-full items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/10"
						>
							<span>Details</span>
							<span class="text-text-muted">{metadataOpen ? '▴' : '▾'}</span>
						</button>
						{#if metadataOpen}
							<div class="px-4 pb-5 pt-1">
								<ObjectEditDetails metadata={editData.metadata} onMetadataChange={handleMetadataChange} />
							</div>
						{/if}
					</div>
					<div class="border-b border-border-soft">
						<button
							type="button"
							onclick={() => (rightsOpen = !rightsOpen)}
							class="flex w-full items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/10"
						>
							<span>Rights & Access</span>
							<span class="text-text-muted">{rightsOpen ? '▴' : '▾'}</span>
						</button>
						{#if rightsOpen}
							<div class="px-4 pb-5 pt-1">
								<ObjectEditRights rights={editData.rights} onRightsChange={handleRightsChange} />
							</div>
						{/if}
					</div>
				</div>
			{/if}

		{/if}
	</div>
</div>
