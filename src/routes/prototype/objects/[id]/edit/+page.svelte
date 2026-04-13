<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import type { ObjectViewRecord } from '$lib/objectView/types';

	type EditTab = 'metadata' | 'content' | 'review' | 'history';

	type EditablePayload = {
		title: string;
		description: string;
		tags: string;
		people: string;
		eventDate: string;
		place: string;
		rightsNote: string;
		sensitivityNote: string;
		curatedText: string;
		curatedCaptions: string;
		reviewNote: string;
		readyForReview: boolean;
	};

	let {
		data
	} = $props<{
		data: {
			object: ObjectViewRecord;
			reviewItems: Array<{ id: string; title: string; mediaType: ObjectViewRecord['mediaType'] }>;
		};
	}>();

	let activeTab = $state<EditTab>('content');
	let activeObjectId = $state('');
	let title = $state('');
	let description = $state('');
	let tags = $state('');
	let people = $state('');
	let eventDate = $state('');
	let place = $state('');
	let rightsNote = $state('');
	let sensitivityNote = $state('');
	let curatedText = $state('');
	let curatedCaptions = $state('');
	let reviewNote = $state('');
	let readyForReview = $state(false);
	let savedSnapshot = $state('');
	let lastSavedAt = $state<string | null>(null);
	let activity = $state<Array<{ at: string; label: string }>>([]);

	const object = $derived(data.object as ObjectViewRecord);

	const formatTimestamp = (seconds: number): string => {
		const m = Math.floor(seconds / 60);
		const s = String(seconds % 60).padStart(2, '0');
		return `${m}:${s}`;
	};

	const automaticText = $derived.by(() => {
		if (object.mediaType === 'document') {
			return object.pages
				.slice(0, 4)
				.map((page: { ocrText: string }, index: number) => `Page ${index + 1}: ${page.ocrText}`)
				.join('\n\n');
		}

		if (object.mediaType === 'audio') {
			return object.transcript
				.map((segment: { startSeconds: number; endSeconds: number; speaker?: string; text: string }) => `[${formatTimestamp(segment.startSeconds)}-${formatTimestamp(segment.endSeconds)}] ${segment.speaker ? `${segment.speaker}: ` : ''}${segment.text}`)
				.join('\n');
		}

		if (object.mediaType === 'video') {
			return object.transcript
				.map((segment: { startSeconds: number; endSeconds: number; text: string }) => `[${formatTimestamp(segment.startSeconds)}-${formatTimestamp(segment.endSeconds)}] ${segment.text}`)
				.join('\n');
		}

		return [
			'Studio portrait detected with formal composition and garment texture details.',
			'Potential entities: adult subject, embroidered coat, backdrop curtain.',
			'Suggested themes: portraiture, textile, studio photography.'
		].join('\n');
	});

	const automaticCaptions = $derived.by(() => {
		if (object.mediaType !== 'video') return '';
		return object.subtitles
			.map((cue: { startSeconds: number; endSeconds: number; text: string }) => `${formatTimestamp(cue.startSeconds)} --> ${formatTimestamp(cue.endSeconds)} ${cue.text}`)
			.join('\n');
	});

	const buildPayload = (): EditablePayload => ({
		title,
		description,
		tags,
		people,
		eventDate,
		place,
		rightsNote,
		sensitivityNote,
		curatedText,
		curatedCaptions,
		reviewNote,
		readyForReview
	});

	const hasUnsavedChanges = $derived(JSON.stringify(buildPayload()) !== savedSnapshot);
	const draftState = $derived.by(() => {
		if (hasUnsavedChanges) return 'Unsaved changes';
		if (lastSavedAt) return `Draft saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
		return 'No changes yet';
	});

	const initializeEditor = (): void => {
		title = object.title;
		description = object.metadata.description;
		tags = object.metadata.tags.map((tag: { label: string }) => tag.label).join(', ');
		people = object.mediaType === 'image' ? 'Unknown sitter' : object.mediaType === 'audio' ? 'Zarina T.' : object.mediaType === 'video' ? 'Family members, visitors' : 'Editorial staff';
		eventDate = object.metadata.publicationDate;
		place = object.mediaType === 'image' ? 'Dushanbe studio' : object.mediaType === 'video' ? 'Khorog courtyard' : object.mediaType === 'audio' ? 'Interview room, Dushanbe' : 'Samarkand';
		rightsNote = object.metadata.rightsNote;
		sensitivityNote = object.mediaType === 'audio' ? 'Contains personal migration history.' : '';
		curatedText = automaticText;
		curatedCaptions = automaticCaptions;
		reviewNote = '';
		readyForReview = false;
		activeTab = 'content';
		activity = [
			{ at: '09:05', label: 'Machine extraction available for editor review' },
			{ at: '09:10', label: 'Curator opened media-specific editing workspace' }
		];
		savedSnapshot = JSON.stringify(buildPayload());
		lastSavedAt = null;
	};

	const saveDraft = (): void => {
		savedSnapshot = JSON.stringify(buildPayload());
		lastSavedAt = new Date().toISOString();
		activity = [{ at: new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), label: 'Draft saved' }, ...activity].slice(0, 6);
	};

	const submitReview = (): void => {
		readyForReview = true;
		saveDraft();
		activity = [{ at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), label: 'Marked ready for review queue' }, ...activity].slice(0, 6);
	};

	$effect(() => {
		if (object.id === activeObjectId) return;
		activeObjectId = object.id;
		initializeEditor();
	});
</script>

<main class="min-h-screen bg-[linear-gradient(180deg,#f5f2eb_0%,#edf1f2_100%)]">
	<header class="sticky top-0 z-20 border-b border-border-soft bg-surface-white/90 backdrop-blur">
		<div class="mx-auto flex max-w-[110rem] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
			<button
				type="button"
				onclick={() => {
					window.location.href = `/prototype/objects/${object.id}`;
				}}
				class="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
			>
				Back to view
			</button>
			<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Editing prototype</p>
			<h1 class="min-w-0 truncate font-display text-xl text-text-ink sm:text-2xl">{title}</h1>
			<Chip class="border-blue-slate/20 bg-pale-sky/22 text-[10px] uppercase tracking-[0.18em] text-blue-slate">{object.mediaType}</Chip>
			<Chip class={`text-[10px] uppercase tracking-[0.18em] ${hasUnsavedChanges ? 'border-pearl-beige bg-pearl-beige/65 text-burnt-peach' : 'border-blue-slate/20 bg-pale-sky/20 text-blue-slate'}`}>{draftState}</Chip>
			<div class="ml-auto flex items-center gap-2">
				<button
					type="button"
					onclick={saveDraft}
					class="rounded-full border border-border-soft bg-surface-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
				>
					Save draft
				</button>
				<button
					type="button"
					onclick={submitReview}
					class="rounded-full bg-blue-slate px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate-mid-dark"
				>
					Submit review
				</button>
			</div>
		</div>
	</header>

	<section class="border-b border-border-soft bg-surface-white/70 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-[110rem] flex-wrap items-center gap-2">
			<p class="mr-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">Switch object</p>
			{#each data.reviewItems as item (item.id)}
				<button
					type="button"
					onclick={() => {
						window.location.href = `/prototype/objects/${item.id}/edit`;
					}}
					class={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${item.id === object.id ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`}
				>
					{item.mediaType}
				</button>
			{/each}
		</div>
	</section>

	<div class="mx-auto grid max-w-[110rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8">
		<section class="rounded-[1.8rem] border border-border-soft bg-surface-white p-5 shadow-[0_18px_45px_rgba(31,47,56,0.08)] sm:p-6">
			<div class="flex flex-wrap items-start justify-between gap-3 border-b border-border-soft pb-4">
				<div>
					<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Media context</p>
					<p class="mt-2 text-sm text-text-muted">Keep reference media visible while curating metadata and extracted text.</p>
				</div>
				<div class="flex flex-wrap gap-2">
					{#each object.mediaAccess.availableNow as available (available)}
						<Chip class="border-blue-slate/20 bg-pale-sky/20 text-[10px] uppercase tracking-[0.18em] text-blue-slate">{available}</Chip>
					{/each}
				</div>
			</div>

			{#if object.mediaType === 'document'}
				<div class="mt-5 space-y-4">
					<div class="overflow-hidden rounded-2xl border border-border-soft bg-[#f7f1e3] p-3">
						<img src={object.pages[0]?.imageUrl} alt={object.pages[0]?.label ?? object.title} class="h-auto w-full rounded-xl object-cover object-top" />
					</div>
					<div class="grid gap-2 sm:grid-cols-3">
						{#each object.pages.slice(0, 3) as page (page.id)}
							<div class="rounded-xl border border-border-soft bg-alabaster-grey/35 px-3 py-2">
								<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">{page.label}</p>
								<p class="mt-1 line-clamp-2 text-xs text-text-ink">OCR available</p>
							</div>
						{/each}
					</div>
				</div>
			{:else if object.mediaType === 'image'}
				<div class="mt-5 overflow-hidden rounded-[1.5rem] border border-border-soft bg-[#132128] p-3 sm:p-5">
					<img src={object.imageUrl} alt={object.imageAlt} class="h-auto w-full rounded-[1.1rem] object-cover" />
				</div>
			{:else if object.mediaType === 'audio'}
				<div class="mt-5 rounded-[1.5rem] border border-border-soft bg-[#1f2f38] p-5 text-white">
					<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/70">Audio reference</p>
					<div class="mt-4 flex h-24 items-end gap-1">
						{#each object.waveform as level, idx (idx)}
							<div class="w-full rounded-full bg-pale-sky/70" style={`height:${Math.max(10, level)}%`}></div>
						{/each}
					</div>
					<p class="mt-4 text-xs text-pale-sky/85">Duration {Math.floor(object.durationSeconds / 60)}:{String(object.durationSeconds % 60).padStart(2, '0')}</p>
				</div>
			{:else}
				<div class="mt-5 overflow-hidden rounded-[1.5rem] border border-border-soft bg-[#132128] p-3 sm:p-5">
					<img src={object.posterUrl} alt="Video poster" class="h-auto w-full rounded-[1.1rem] object-cover" />
					<div class="mt-4 space-y-2">
						{#each object.subtitles.slice(0, 2) as cue (cue.id)}
							<div class="rounded-xl bg-black/30 px-4 py-3 text-sm text-white">{cue.text}</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<section class="rounded-[1.8rem] border border-border-soft bg-surface-white p-5 shadow-[0_18px_45px_rgba(31,47,56,0.08)] sm:p-6">
			<div class="flex flex-wrap gap-1.5 border-b border-border-soft pb-4">
				{#each ['metadata', 'content', 'review', 'history'] as tab (tab)}
					<button
						type="button"
						onclick={() => (activeTab = tab as EditTab)}
						class={`rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${activeTab === tab ? 'bg-blue-slate text-surface-white' : 'bg-alabaster-grey/45 text-text-muted hover:bg-pale-sky/20 hover:text-blue-slate'}`}
					>
						{tab}
					</button>
				{/each}
			</div>

			{#if activeTab === 'metadata'}
				<div class="mt-5 grid gap-4">
					<label class="grid gap-2">
						<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Title</span>
						<input bind:value={title} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40" />
					</label>
					<label class="grid gap-2">
						<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Description</span>
						<textarea bind:value={description} rows={4} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40"></textarea>
					</label>
					<div class="grid gap-4 sm:grid-cols-2">
						<label class="grid gap-2">
							<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">People</span>
							<input bind:value={people} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40" />
						</label>
						<label class="grid gap-2">
							<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Tags</span>
							<input bind:value={tags} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40" />
						</label>
						<label class="grid gap-2">
							<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Date</span>
							<input bind:value={eventDate} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40" />
						</label>
						<label class="grid gap-2">
							<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Place</span>
							<input bind:value={place} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40" />
						</label>
					</div>
					<label class="grid gap-2">
						<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Rights note</span>
						<textarea bind:value={rightsNote} rows={3} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40"></textarea>
					</label>
					<label class="grid gap-2">
						<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Sensitivity note</span>
						<textarea bind:value={sensitivityNote} rows={2} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40"></textarea>
					</label>
				</div>
			{:else if activeTab === 'content'}
				<div class="mt-5 space-y-4">
					<div class="flex items-center justify-between gap-3 rounded-2xl border border-border-soft bg-alabaster-grey/35 px-4 py-3">
						<p class="text-xs text-text-ink">Machine extraction on the left, curator text on the right.</p>
						<button
							type="button"
							onclick={() => {
								curatedText = automaticText;
								if (object.mediaType === 'video') curatedCaptions = automaticCaptions;
							}}
							class="rounded-full border border-border-soft bg-surface-white px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
						>
							Accept extraction as baseline
						</button>
					</div>

					<div class="grid gap-4 xl:grid-cols-2">
						<label class="grid gap-2">
							<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Automatic {object.mediaType === 'document' ? 'OCR text' : object.mediaType === 'image' ? 'vision notes' : 'transcript'}</span>
							<textarea value={automaticText} rows={14} readonly class="rounded-xl border border-border-soft bg-alabaster-grey/35 px-3 py-2 text-sm text-text-muted outline-none"></textarea>
						</label>
						<label class="grid gap-2">
							<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Curated {object.mediaType === 'document' ? 'full text' : object.mediaType === 'image' ? 'description' : 'transcript'}</span>
							<textarea bind:value={curatedText} rows={14} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40"></textarea>
						</label>
					</div>

					{#if object.mediaType === 'video'}
						<div class="grid gap-4 xl:grid-cols-2">
							<label class="grid gap-2">
								<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Automatic captions</span>
								<textarea value={automaticCaptions} rows={8} readonly class="rounded-xl border border-border-soft bg-alabaster-grey/35 px-3 py-2 text-sm text-text-muted outline-none"></textarea>
							</label>
							<label class="grid gap-2">
								<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Curated captions</span>
								<textarea bind:value={curatedCaptions} rows={8} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40"></textarea>
							</label>
						</div>
					{/if}
				</div>
			{:else if activeTab === 'review'}
				<div class="mt-5 space-y-4">
					<div class="rounded-2xl border border-border-soft bg-alabaster-grey/35 px-4 py-4">
						<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Readiness checklist</p>
						<div class="mt-3 space-y-2 text-sm text-text-ink">
							<label class="flex items-center gap-2"><input type="checkbox" checked={title.trim().length > 0} /> Title validated</label>
							<label class="flex items-center gap-2"><input type="checkbox" checked={description.trim().length > 0} /> Description reviewed</label>
							<label class="flex items-center gap-2"><input type="checkbox" checked={curatedText.trim().length > 0} /> Curated text completed</label>
							<label class="flex items-center gap-2"><input type="checkbox" checked={tags.trim().length > 0} /> Keywords normalized</label>
						</div>
					</div>
					<label class="grid gap-2">
						<span class="text-[10px] uppercase tracking-[0.2em] text-text-muted">Reviewer handoff note</span>
						<textarea bind:value={reviewNote} rows={5} class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink outline-none transition focus:border-blue-slate/40" placeholder="Explain uncertain names, low-confidence segments, or policy decisions."></textarea>
					</label>
					<label class="flex items-center gap-2 text-sm text-text-ink">
						<input type="checkbox" bind:checked={readyForReview} /> Mark this object ready for reviewer queue
					</label>
				</div>
			{:else}
				<div class="mt-5 space-y-3">
					{#each activity as item, index (item.at + item.label)}
						<div class="rounded-xl border border-border-soft bg-alabaster-grey/30 px-4 py-3">
							<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">{index === 0 ? 'Latest' : 'Event'} · {item.at}</p>
							<p class="mt-1 text-sm text-text-ink">{item.label}</p>
						</div>
					{/each}
					<p class="text-xs text-text-muted">Prototype note: history is local-only for UX exploration; production should use persisted object revision events.</p>
				</div>
			{/if}
		</section>
	</div>
</main>
