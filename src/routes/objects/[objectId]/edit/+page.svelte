<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';
	import SourceTextDiff from '$lib/components/object-edit/SourceTextDiff.svelte';
	import type { ObjectEditDocumentPage, ObjectEditMetadata, ObjectEditPayload } from '$lib/services/objectEdit';

	let { data, form } = $props<{
		data: { editPayload: ObjectEditPayload; isLockedByOtherUser: boolean };
		form: {
			success?: boolean;
			locked?: boolean;
			error?: string;
			curationState?: string;
			recovery?: {
				id: string;
				kind: 'conflict' | 'partial';
				savedDomains: Array<'metadata'>;
				editPayload: ObjectEditPayload;
			};
		} | null;
	}>();

	const payload = $derived(data.editPayload);
	type PageEdit = { pageNumber: number; machineText: string; curatedText: string };

	const toPageEdits = (editPayload: ObjectEditPayload): PageEdit[] =>
		editPayload.curation.kind === 'document'
			? editPayload.curation.pages.map((page: ObjectEditDocumentPage) => ({
					pageNumber: page.pageNumber,
					machineText: page.machineText,
					curatedText: page.curatedText,
				}))
			: [];

	type EditableSnapshot = {
		title: string;
		publicationDate: string;
		datePrecision: 'none' | 'year' | 'month' | 'day';
		dateApproximate: boolean;
		language: string;
		description: string;
		tags: string[];
		people: string[];
		rightsNote: string;
		sensitivityNote: string;
		pages: Array<{ pageNumber: number; curatedText: string }>;
	};

	const toEditableSnapshot = (editPayload: ObjectEditPayload): EditableSnapshot =>
		({
			title: editPayload.metadata.title,
			publicationDate: editPayload.metadata.publicationDate,
			datePrecision: editPayload.metadata.datePrecision,
			dateApproximate: editPayload.metadata.dateApproximate,
			language: editPayload.metadata.language ?? '',
			description: editPayload.metadata.description ?? '',
			tags: [...editPayload.metadata.tags],
			people: [...editPayload.metadata.people],
			rightsNote: editPayload.rights.rightsNote ?? '',
			sensitivityNote: editPayload.rights.sensitivityNote ?? '',
			pages: toPageEdits(editPayload).map((page) => ({
				pageNumber: page.pageNumber,
				curatedText: page.curatedText,
			})),
		});

	const toSnapshot = (editPayload: ObjectEditPayload): string => JSON.stringify(toEditableSnapshot(editPayload));

	const payloadResetKey = $derived(
		`${payload.objectId}:${payload.revision}:${payload.draft?.updatedAt ?? 'none'}:${payload.curationState}`
	);

	// Editable metadata state
	let title = $state('');
	let publicationDate = $state('');
	let datePrecision = $state<'none' | 'year' | 'month' | 'day'>('none');
	let dateApproximate = $state(false);
	let language = $state('');
	let description = $state('');
	let tags = $state<string[]>([]);
	let people = $state<string[]>([]);

	// Rights notes
	let rightsNote = $state('');
	let sensitivityNote = $state('');

	// Tag / person input helpers
	let tagInput = $state('');
	let personInput = $state('');

	const addTag = (): void => {
		const t = tagInput.trim();
		if (t && !tags.includes(t)) tags = [...tags, t];
		tagInput = '';
	};
	const removeTag = (t: string): void => { tags = tags.filter((x) => x !== t); };
	const addPerson = (): void => {
		const p = personInput.trim();
		if (p && !people.includes(p)) people = [...people, p];
		personInput = '';
	};
	const removePerson = (p: string): void => { people = people.filter((x) => x !== p); };

	// OCR page state (document objects only)
	let pages = $state<PageEdit[]>([]);
	let activePageIdx = $state(0);

	const handlePageCuratedChange = (idx: number, text: string): void => {
		pages = pages.map((p, i) => (i === idx ? { ...p, curatedText: text } : p));
	};

	// Dirty tracking
	let initialSnapshot = $state('');
	let activePayloadResetKey = $state<string | null>(null);
	let activeRecoveryId = $state<string | null>(null);
	const currentSnapshot = (): EditableSnapshot => ({
		title,
		publicationDate,
		datePrecision,
		dateApproximate,
		language,
		description,
		tags,
		people,
		rightsNote,
		sensitivityNote,
		pages: pages.map((page) => ({ pageNumber: page.pageNumber, curatedText: page.curatedText })),
	});
	const initialEditableSnapshot = (): EditableSnapshot | null => {
		try {
			return initialSnapshot ? (JSON.parse(initialSnapshot) as EditableSnapshot) : null;
		} catch {
			return null;
		}
	};
	const isDirty = $derived(
		JSON.stringify(currentSnapshot()) !== initialSnapshot
	);
	const metadataChanged = $derived.by(() => {
		const initial = initialEditableSnapshot();
		if (!initial) return false;
		const current = currentSnapshot();
		return JSON.stringify({ ...current, pages: undefined }) !== JSON.stringify({ ...initial, pages: undefined });
	});
	const changedPages = $derived.by(() => {
		const initial = initialEditableSnapshot();
		if (!initial) return [];
		const initialPages = new Map(initial.pages.map((page) => [page.pageNumber, page.curatedText]));
		return pages
			.filter((page) => initialPages.get(page.pageNumber) !== page.curatedText)
			.map((page) => ({ pageNumber: page.pageNumber, curatedText: page.curatedText }));
	});

	// UI state
	let detailsPaneOpen = $state(true);
	let metadataOpen = $state(true);
	let rightsOpen = $state(false);
	let saving = $state(false);
	let submitting = $state(false);

	const resetEditState = (editPayload: ObjectEditPayload, resetKey: string): void => {
		title = editPayload.metadata.title;
		publicationDate = editPayload.metadata.publicationDate;
		datePrecision = editPayload.metadata.datePrecision;
		dateApproximate = editPayload.metadata.dateApproximate;
		language = editPayload.metadata.language ?? '';
		description = editPayload.metadata.description ?? '';
		tags = [...editPayload.metadata.tags];
		people = [...editPayload.metadata.people];
		rightsNote = editPayload.rights.rightsNote ?? '';
		sensitivityNote = editPayload.rights.sensitivityNote ?? '';
		pages = toPageEdits(editPayload);
		activePageIdx = 0;
		tagInput = '';
		personInput = '';
		initialSnapshot = toSnapshot(editPayload);
		activePayloadResetKey = resetKey;
	};

	$effect(() => {
		if (activePayloadResetKey === payloadResetKey) return;
		resetEditState(payload, payloadResetKey);
	});

	const applyRecovery = (editPayload: ObjectEditPayload, preserveMetadata: boolean): void => {
		const initial = initialEditableSnapshot();
		const current = currentSnapshot();
		resetEditState(editPayload, payloadResetKey);
		if (!initial) return;

		if (preserveMetadata) {
			if (current.title !== initial.title) title = current.title;
			if (current.publicationDate !== initial.publicationDate) publicationDate = current.publicationDate;
			if (current.datePrecision !== initial.datePrecision) datePrecision = current.datePrecision;
			if (current.dateApproximate !== initial.dateApproximate) dateApproximate = current.dateApproximate;
			if (current.language !== initial.language) language = current.language;
			if (current.description !== initial.description) description = current.description;
			if (JSON.stringify(current.tags) !== JSON.stringify(initial.tags)) tags = current.tags;
			if (JSON.stringify(current.people) !== JSON.stringify(initial.people)) people = current.people;
			if (current.rightsNote !== initial.rightsNote) rightsNote = current.rightsNote;
			if (current.sensitivityNote !== initial.sensitivityNote) sensitivityNote = current.sensitivityNote;
		}

		const initialPages = new Map(initial.pages.map((page) => [page.pageNumber, page.curatedText]));
		const localPages = new Map(current.pages.map((page) => [page.pageNumber, page.curatedText]));
		pages = pages.map((page) =>
			initialPages.get(page.pageNumber) !== localPages.get(page.pageNumber) &&
			page.curatedText !== localPages.get(page.pageNumber)
				? { ...page, curatedText: localPages.get(page.pageNumber) ?? page.curatedText }
				: page,
		);
	};

	$effect(() => {
		const recovery = form?.recovery;
		if (!recovery || recovery.id === activeRecoveryId) return;
		applyRecovery(recovery.editPayload, !recovery.savedDomains.includes('metadata'));
		activeRecoveryId = recovery.id;
	});

	// Form payload builders
	const buildMetadata = (): ObjectEditMetadata => ({
		title,
		publicationDate,
		datePrecision,
		dateApproximate,
		language: language.trim() || null,
		tags,
		people,
		description: description.trim() || null,
	});
	const buildRights = () => ({
		rightsNote: rightsNote.trim() || null,
		sensitivityNote: sensitivityNote.trim() || null,
	});
	// Inject hidden inputs before submit
	const prepareSaveDraft = (formEl: HTMLFormElement): void => {
		const set = (name: string, value: string) => {
			let el = formEl.elements.namedItem(name) as HTMLInputElement | null;
			if (!el) {
				el = document.createElement('input');
				el.type = 'hidden';
				el.name = name;
				formEl.appendChild(el);
			}
			el.value = value;
		};
		const remove = (name: string) => formEl.querySelector(`input[name="${name}"]`)?.remove();
		set('revision', String(payload.revision));
		if (metadataChanged) {
			set('metadata', JSON.stringify(buildMetadata()));
			set('rights', JSON.stringify(buildRights()));
		} else {
			remove('metadata');
			remove('rights');
		}
		if (changedPages.length > 0) {
			set('pages', JSON.stringify(changedPages));
		} else {
			remove('pages');
		}
	};

	// Lock release helpers
	const releaseLockUrl = $derived(`/objects/${payload.objectId}/edit-lock`);

	// Release lock when navigating away within the app
	beforeNavigate(() => {
		if (!data.isLockedByOtherUser) {
			fetch(releaseLockUrl, { method: 'DELETE' });
		}
	});

	// Release lock when tab/browser closes
	$effect(() => {
		if (data.isLockedByOtherUser) return;
		const handler = () => {
			fetch(releaseLockUrl, { method: 'DELETE', keepalive: true });
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});
</script>

<svelte:head>
	<title>Edit: {payload.metadata.title} — Osimi Archive</title>
</svelte:head>

<div class="flex h-screen flex-col overflow-hidden bg-alabaster-grey">

	<!-- Top bar -->
	<header class="flex shrink-0 items-center gap-3 border-b border-border-soft bg-surface-white/95 px-4 py-2.5 backdrop-blur sm:px-6">
		<a
			href={resolve('/objects/[objectId]', { objectId: payload.objectId })}
			class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-soft bg-surface-white px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
		>
			← Object
		</a>
		<h1 class="min-w-0 flex-1 truncate font-display text-lg text-text-ink">{payload.metadata.title}</h1>
		<Chip class="shrink-0 border-blue-slate/20 bg-pale-sky/20 text-[10px] uppercase tracking-[0.18em] text-blue-slate">
			{payload.mediaType}
		</Chip>
		<Chip class="shrink-0 text-[10px] uppercase tracking-[0.18em] {isDirty ? 'border-pearl-beige bg-pearl-beige/65 text-burnt-peach' : 'border-blue-slate/20 bg-pale-sky/20 text-blue-slate'}">
			{isDirty ? 'Unsaved changes' : 'No changes'}
		</Chip>

		{#if form?.locked}
			<span class="shrink-0 rounded-full bg-burnt-peach/10 px-3 py-1.5 text-[10px] text-burnt-peach">
				Another user started editing this object. Your changes could not be saved.
			</span>
			<button
				type="button"
				onclick={() => location.reload()}
				class="shrink-0 rounded-full border border-burnt-peach/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-burnt-peach transition hover:bg-burnt-peach/10"
			>
				Refresh
			</button>
		{/if}
		{#if form?.error}
			<span class="shrink-0 rounded-full bg-burnt-peach/10 px-3 py-1.5 text-[10px] text-burnt-peach">
				{form.error}
			</span>
		{/if}
		{#if form?.recovery}
			<span class="shrink-0 rounded-full bg-pearl-beige/65 px-3 py-1.5 text-[10px] text-burnt-peach">
				{form.recovery.kind === 'partial' ? 'Partial save recovered. Review and retry remaining changes.' : 'Server changes loaded. Review your rebased edits before retrying.'}
			</span>
		{/if}

		{#if payload.capabilities.canEditMetadata || payload.capabilities.canCurateText}
			<div class="ml-1 flex shrink-0 items-center gap-2">
				<form
					id="form-save"
					method="POST"
					action="?/saveDraft"
					use:enhance={({ formElement }) => {
						prepareSaveDraft(formElement);
						saving = true;
						return async ({ update, result }) => {
							await update({ reset: false, invalidateAll: result.type === 'success' });
							saving = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={saving || !isDirty}
						class="rounded-full border border-border-soft bg-surface-white px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:pointer-events-none disabled:opacity-40"
					>
						{saving ? 'Saving…' : 'Save draft'}
					</button>
				</form>

				{#if payload.capabilities.canSubmitReview}
					<form
						id="form-submit"
						method="POST"
						action="?/submitCuration"
						use:enhance={() => {
							submitting = true;
						return async ({ update, result }) => {
							await update({ reset: false, invalidateAll: result.type === 'success' });
								submitting = false;
							};
						}}
					>
						<input type="hidden" name="reviewNote" value="" />
						<input type="hidden" name="revision" value={payload.revision} />
						<button
							type="submit"
							disabled={submitting || isDirty}
							class="rounded-full bg-blue-slate px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate-mid-dark disabled:pointer-events-none disabled:opacity-40"
							title={isDirty ? 'Save draft before submitting' : undefined}
						>
							{submitting ? 'Submitting…' : 'Submit for review'}
						</button>
					</form>
				{/if}
			</div>
		{/if}
	</header>

	<!-- Locked-by-other-user banner -->
	{#if data.isLockedByOtherUser}
		<div class="shrink-0 border-b border-burnt-peach/20 bg-burnt-peach/8 px-4 py-2.5 sm:px-6">
			<p class="text-[11px] text-burnt-peach">
				This object is currently being edited by another user. It will be available after they finish.
			</p>
		</div>
	{/if}

	<!-- Main editing area -->
	<div class="flex min-h-0 flex-1 overflow-hidden">

		{#if payload.curation.kind === 'document' && payload.capabilities.canCurateText}
			<!-- Document: left image column + center OCR editor + right details -->

			<!-- Left: page navigator -->
			<div class="flex w-[28%] shrink-0 flex-col border-r border-blue-slate/10 bg-[#f5f2eb]">
				<div class="shrink-0 border-b border-blue-slate/10 px-3 py-2">
					<p class="text-[9px] uppercase tracking-[0.15em] text-blue-slate/45">
						{payload.curation.pageCount != null ? `${payload.curation.pageCount} pages` : 'Document pages'}
					</p>
				</div>

				<!-- Page thumbnails strip -->
				<div class="flex-1 overflow-y-auto p-2">
					<div class="space-y-1">
						{#each pages as page, i (page.pageNumber)}
							<button
								type="button"
								onclick={() => (activePageIdx = i)}
								class="w-full rounded-xl border px-3 py-2.5 text-left transition {i === activePageIdx
									? 'border-blue-slate bg-blue-slate text-surface-white'
									: 'border-border-soft bg-surface-white/70 text-text-ink hover:bg-pale-sky/20'}"
							>
								<div class="flex items-center justify-between gap-2">
									<span class="text-[10px] font-medium">
										{payload.curation.pages[i]?.label ?? `Page ${page.pageNumber}`}
									</span>
									{#if page.curatedText}
										<span
											class="h-1.5 w-1.5 shrink-0 rounded-full {i === activePageIdx ? 'bg-pearl-beige' : 'bg-pearl-beige/80'}"
											title="Has curated text"
										></span>
									{:else}
										<span class="h-1.5 w-1.5 shrink-0 rounded-full border {i === activePageIdx ? 'border-surface-white/40' : 'border-blue-slate/20'}"></span>
									{/if}
								</div>
								<p class="mt-0.5 text-[9px] {i === activePageIdx ? 'text-surface-white/60' : 'text-text-muted'}">
									{payload.curation.pages[i]?.status === 'edited' ? 'Edited' : 'Machine OCR'}
								</p>
							</button>
						{/each}
					</div>
				</div>

				<!-- Page nav controls -->
				{#if pages.length > 0}
					<div class="shrink-0 border-t border-blue-slate/10 px-3 py-2 flex items-center justify-between">
						<button
							type="button"
							onclick={() => (activePageIdx = Math.max(0, activePageIdx - 1))}
							disabled={activePageIdx === 0}
							class="rounded-full border border-border-soft px-3 py-1.5 text-[10px] text-blue-slate transition hover:bg-pale-sky/20 disabled:pointer-events-none disabled:opacity-30"
						>←</button>
						<span class="text-[9px] text-text-muted">{activePageIdx + 1} / {pages.length}</span>
						<button
							type="button"
							onclick={() => (activePageIdx = Math.min(pages.length - 1, activePageIdx + 1))}
							disabled={activePageIdx === pages.length - 1}
							class="rounded-full border border-border-soft px-3 py-1.5 text-[10px] text-blue-slate transition hover:bg-pale-sky/20 disabled:pointer-events-none disabled:opacity-30"
						>→</button>
					</div>
				{/if}
			</div>

			<!-- Center: OCR diff editor -->
			<div class="flex min-w-0 flex-1 flex-col border-r border-border-soft bg-surface-white">
				<div class="shrink-0 border-b border-border-soft px-5 py-3 flex items-center justify-between gap-3">
					<div>
						<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">
							{#if payload.curation.kind === 'document'}
								{payload.curation.pages[activePageIdx]?.label ?? `Page ${pages[activePageIdx]?.pageNumber ?? ''}`}
							{/if}
						</p>
						<p class="mt-0.5 text-[10px] text-text-muted">
							{pages[activePageIdx]?.curatedText
								? 'Curation in progress — compare source and refine below'
								: 'No curated text yet — copy from source or write from scratch'}
						</p>
					</div>
					<button
						type="button"
						onclick={() => (detailsPaneOpen = !detailsPaneOpen)}
						class="shrink-0 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {detailsPaneOpen
							? 'border-blue-slate bg-blue-slate text-surface-white'
							: 'border-border-soft text-blue-slate hover:bg-pale-sky/20'}"
					>
						Details
					</button>
				</div>
				<div class="min-h-0 flex-1 overflow-y-auto p-5">
					{#if pages[activePageIdx]}
						{@const p = pages[activePageIdx]}
						<SourceTextDiff
							sourceLabel="OCR text"
							curatedLabel="Curated text"
							sourceText={p.machineText}
							curatedText={p.curatedText}
							onCuratedChange={(text) => handlePageCuratedChange(activePageIdx, text)}
						/>
					{/if}
				</div>
			</div>

			<!-- Right: collapsible metadata + rights -->
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
						{#if metadataOpen && payload.capabilities.canEditMetadata}
							<div class="px-4 pb-5 pt-1">
								{@render metadataFields()}
							</div>
						{:else if metadataOpen}
							<div class="px-4 pb-4 pt-1">
								<p class="text-[10px] text-text-muted">Metadata is read-only for your role.</p>
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
								{@render rightsFields()}
							</div>
						{/if}
					</div>
				</div>
			{/if}

		{:else}
			<!-- Non-document or viewer: full metadata/rights form -->
			<div class="flex min-w-0 flex-1 flex-col bg-surface-white">
				<div class="shrink-0 border-b border-border-soft px-5 py-3">
					<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Object details</p>
					<p class="mt-0.5 text-[10px] text-text-muted">
						{#if payload.curation.kind === 'image'}
							Images have no machine-extracted text — enrich metadata and access settings directly.
						{:else if payload.curation.kind === 'audio' || payload.curation.kind === 'video'}
							Transcript curation for {payload.curation.kind} objects is not yet available. You can edit metadata below.
						{:else}
							Edit metadata and access settings for this object.
						{/if}
					</p>
				</div>
				{#if payload.capabilities.canEditMetadata}
					<div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
						{@render metadataFields()}
						<div class="border-t border-border-soft pt-5">
							<p class="mb-4 text-[10px] uppercase tracking-[0.2em] text-blue-slate">Rights & Access</p>
							{@render rightsFields()}
						</div>
					</div>
				{:else}
					<div class="p-5">
						<p class="text-[10px] text-text-muted">Metadata is read-only for your role.</p>
					</div>
				{/if}
			</div>
		{/if}

	</div>
</div>

{#snippet metadataFields()}
	<div class="space-y-4">
		<!-- Title -->
		<div>
			<label class="block text-[10px] uppercase tracking-[0.2em] text-blue-slate" for="edit-title">Title</label>
			<input
				id="edit-title"
				type="text"
				class="mt-1.5 w-full rounded-lg border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
				value={title}
				oninput={(e) => (title = e.currentTarget.value)}
			/>
		</div>

		<!-- Publication date -->
		<div>
			<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Date precision</p>
			<div class="mt-1.5 flex gap-1.5">
				{#each (['none', 'year', 'month', 'day'] as const) as p (p)}
					<button
						type="button"
						onclick={() => { datePrecision = p; if (p === 'none') { publicationDate = ''; dateApproximate = false; } }}
						class="rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] transition {datePrecision === p ? 'bg-blue-slate text-surface-white' : 'border border-border-soft text-text-muted hover:bg-pale-sky/20'}"
					>{p}</button>
				{/each}
			</div>
			{#if datePrecision !== 'none'}
				<input
					type="text"
					class="mt-1.5 w-full rounded-lg border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
					placeholder={datePrecision === 'year' ? 'YYYY' : datePrecision === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'}
					value={publicationDate}
					oninput={(e) => (publicationDate = e.currentTarget.value)}
				/>
				<label class="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted">
					<input type="checkbox" bind:checked={dateApproximate} class="rounded" />
					Approximate date
				</label>
			{/if}
		</div>

		<!-- Language -->
		<div>
			<label class="block text-[10px] uppercase tracking-[0.2em] text-blue-slate" for="edit-lang">Language</label>
			<input
				id="edit-lang"
				type="text"
				class="mt-1.5 w-full rounded-lg border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
				placeholder="e.g. Tajik"
				value={language}
				oninput={(e) => (language = e.currentTarget.value)}
			/>
		</div>

		<!-- Tags -->
		<div>
			<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Tags</p>
			<div class="mt-1.5 flex flex-wrap gap-1.5">
				{#each tags as tag (tag)}
					<span class="inline-flex items-center gap-1 rounded-full border border-border-soft bg-pale-sky/20 px-2.5 py-1 text-[10px] text-blue-slate">
						{tag}
						<button type="button" onclick={() => removeTag(tag)} class="text-text-muted hover:text-burnt-peach">×</button>
					</span>
				{/each}
			</div>
			<div class="mt-1.5 flex gap-1.5">
				<input
					type="text"
					class="min-w-0 flex-1 rounded-lg border border-border-soft bg-surface-white px-3 py-1.5 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
					placeholder="Add tag…"
					bind:value={tagInput}
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
				/>
				<button type="button" onclick={addTag} class="rounded-lg border border-border-soft px-3 py-1.5 text-[10px] text-blue-slate transition hover:bg-pale-sky/20">Add</button>
			</div>
		</div>

		<!-- People -->
		<div>
			<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">People</p>
			<div class="mt-1.5 flex flex-wrap gap-1.5">
				{#each people as person (person)}
					<span class="inline-flex items-center gap-1 rounded-full border border-border-soft bg-pale-sky/20 px-2.5 py-1 text-[10px] text-blue-slate">
						{person}
						<button type="button" onclick={() => removePerson(person)} class="text-text-muted hover:text-burnt-peach">×</button>
					</span>
				{/each}
			</div>
			<div class="mt-1.5 flex gap-1.5">
				<input
					type="text"
					class="min-w-0 flex-1 rounded-lg border border-border-soft bg-surface-white px-3 py-1.5 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
					placeholder="Add person…"
					bind:value={personInput}
					onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPerson(); } }}
				/>
				<button type="button" onclick={addPerson} class="rounded-lg border border-border-soft px-3 py-1.5 text-[10px] text-blue-slate transition hover:bg-pale-sky/20">Add</button>
			</div>
		</div>

		<!-- Description -->
		<div>
			<label class="block text-[10px] uppercase tracking-[0.2em] text-blue-slate" for="edit-desc">Description</label>
			<textarea
				id="edit-desc"
				class="mt-1.5 w-full resize-y rounded-lg border border-border-soft bg-surface-white px-3 py-2 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
				rows="4"
				placeholder="Description…"
				value={description}
				oninput={(e) => (description = e.currentTarget.value)}
			></textarea>
		</div>
	</div>
{/snippet}

{#snippet rightsFields()}
	<div class="space-y-4">
		<!-- Access level (read-only in V1 edit contract) -->
		<div>
			<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Access level</p>
			<p class="mt-1 rounded-lg border border-border-soft bg-surface-white/60 px-3 py-2 text-sm capitalize text-text-ink">
				{payload.rights.accessLevel}
				<span class="ml-2 text-[9px] uppercase tracking-[0.1em] text-text-muted">(read-only)</span>
			</p>
		</div>

		<!-- Rights note -->
		<div>
			<label class="block text-[10px] uppercase tracking-[0.2em] text-blue-slate" for="edit-rights-note">Rights note</label>
			<textarea
				id="edit-rights-note"
				class="mt-1.5 w-full resize-y rounded-lg border border-border-soft bg-surface-white px-3 py-2 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
				rows="3"
				placeholder="Rights note…"
				value={rightsNote}
				oninput={(e) => (rightsNote = e.currentTarget.value)}
			></textarea>
		</div>

		<!-- Sensitivity note -->
		<div>
			<label class="block text-[10px] uppercase tracking-[0.2em] text-blue-slate" for="edit-sensitivity-note">Sensitivity note</label>
			<textarea
				id="edit-sensitivity-note"
				class="mt-1.5 w-full resize-y rounded-lg border border-border-soft bg-surface-white px-3 py-2 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/50 focus:border-blue-slate/40 focus:outline-none focus:ring-1 focus:ring-blue-slate/20"
				rows="3"
				placeholder="Sensitivity note…"
				value={sensitivityNote}
				oninput={(e) => (sensitivityNote = e.currentTarget.value)}
			></textarea>
		</div>
	</div>
{/snippet}
