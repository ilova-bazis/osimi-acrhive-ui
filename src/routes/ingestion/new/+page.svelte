<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import type { ActionData } from './$types';
	import Icon from '$lib/components/Icon.svelte';
	import ChoiceCard from '$lib/components/ChoiceCard.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import FootnoteBar from '$lib/components/FootnoteBar.svelte';

	let { form } = $props<{ form: ActionData }>();

	// --- form state ---
	let name = $state('');
	let selectedKind = $state('newspaper');
	let selectedLang = $state('fa');
	let selectedPreset = $state('auto');
	let selectedVisibility = $state('private');
	let tagsInput = $state('');
	let summaryTags = $state<string[]>([]);
	let notes = $state('');
	let submitting = $state(false);

	// Kind → server field mapping
	type KindDef = { id: string; icon: string; label: string; sub: string; itemKind: string; classificationType: string };
	const kinds: KindDef[] = [
		// Scanned physical documents
		{ id: 'newspaper',  icon: 'pages',      label: 'Newspaper',        sub: 'Periodicals, broadsheets',          itemKind: 'scanned_document', classificationType: 'newspaper_article' },
		{ id: 'magazine',   icon: 'pages',      label: 'Magazine',         sub: 'Journals, magazines, reviews',      itemKind: 'scanned_document', classificationType: 'magazine_article' },
		{ id: 'book',       icon: 'book',       label: 'Book',             sub: 'Scanned bound volumes, pamphlets',  itemKind: 'scanned_document', classificationType: 'book' },
		{ id: 'manuscript', icon: 'manuscript', label: 'Manuscript',       sub: 'Handwritten or typescript',         itemKind: 'scanned_document', classificationType: 'manuscript' },
		{ id: 'letter',     icon: 'manuscript', label: 'Letter',           sub: 'Correspondence, official letters',  itemKind: 'scanned_document', classificationType: 'letter' },
		{ id: 'report',     icon: 'file',       label: 'Report',           sub: 'Official reports, records',         itemKind: 'scanned_document', classificationType: 'report' },
		{ id: 'scanned',    icon: 'file',       label: 'Scanned Document', sub: 'Any other scanned physical item',   itemKind: 'scanned_document', classificationType: 'document' },
		// Photos
		{ id: 'photo',      icon: 'image',      label: 'Photograph',       sub: 'Prints, slides, negatives, scans',  itemKind: 'photo',            classificationType: 'image' },
		// Audio & video
		{ id: 'interview',  icon: 'audio',      label: 'Interview',        sub: 'Recorded spoken interviews',        itemKind: 'audio',            classificationType: 'interview' },
		{ id: 'speech',     icon: 'audio',      label: 'Speech',           sub: 'Lectures, speeches, broadcasts',    itemKind: 'audio',            classificationType: 'speech' },
		{ id: 'audio',      icon: 'audio',      label: 'Audio',            sub: 'Music, oral history, other audio',  itemKind: 'audio',            classificationType: 'other' },
		{ id: 'video',      icon: 'video',      label: 'Video',            sub: 'Footage, film, ceremonies',         itemKind: 'video',            classificationType: 'other' },
		// Born-digital documents
		{ id: 'ebook',      icon: 'book',       label: 'Ebook / Book',     sub: 'Born-digital book or ebook file',   itemKind: 'document',         classificationType: 'book' },
		{ id: 'dig-report', icon: 'file',       label: 'Digital Report',   sub: 'PDF report or official document',   itemKind: 'document',         classificationType: 'report' },
		{ id: 'document',   icon: 'file',       label: 'Document',         sub: 'Articles, PDFs, other digital files', itemKind: 'document',       classificationType: 'document' },
		// Catch-all
		{ id: 'other',      icon: 'file',       label: 'Other',            sub: 'Mixed or uncategorized material',   itemKind: 'other',            classificationType: 'other' },
	];

	type LangDef = { id: string; label: string; native: string };
	const languages: LangDef[] = [
		{ id: 'fa',      label: 'Persian',  native: 'فارسی' },
		{ id: 'tg',      label: 'Tajik',    native: 'Тоҷикӣ' },
		{ id: 'en',      label: 'English',  native: 'English' },
		{ id: 'ru',      label: 'Russian',  native: 'Русский' },
		{ id: 'mixed',   label: 'Mixed',    native: 'Multiple' },
		{ id: 'unknown', label: 'Unknown',  native: 'Detect' },
	];

	type PresetDef = { id: string; label: string; sub: string };
	const presets: PresetDef[] = [
		{ id: 'auto',                     label: 'Auto',                sub: 'Detect content and run appropriate pipelines' },
		{ id: 'ocr_text',                 label: 'OCR + Index',         sub: 'Extract text from scanned pages, build search index' },
		{ id: 'audio_transcript',         label: 'Transcribe Audio',    sub: 'Speech-to-text from audio with speaker diarization' },
		{ id: 'video_transcript',         label: 'Transcribe Video',    sub: 'Speech-to-text from video footage' },
		{ id: 'ocr_and_audio_transcript', label: 'OCR + Audio',         sub: 'Extract text and transcribe audio tracks' },
		{ id: 'ocr_and_video_transcript', label: 'OCR + Video',         sub: 'Extract text and transcribe video footage' },
		{ id: 'none',                     label: 'Store only',          sub: 'Catalog and store — no AI processing' },
	];

	const visibilityOptions = [
		{ id: 'private', label: 'Private',  sub: 'Only you' },
		{ id: 'family',  label: 'Team',     sub: 'Your team' },
		{ id: 'public',  label: 'Public',   sub: 'Everyone' },
	];

	const currentKind = $derived(kinds.find((k) => k.id === selectedKind) ?? kinds[0]);
	const errorMessage = $derived(form?.error ?? '');

	const allowedPresets = $derived(new Set<string>(
		({
			scanned_document: ['auto', 'none', 'ocr_text'],
			photo:            ['auto', 'none'],
			audio:            ['auto', 'none', 'audio_transcript'],
			video:            ['auto', 'none', 'video_transcript', 'ocr_and_video_transcript'],
			document:         ['auto', 'none'],
			other:            presets.map((p) => p.id),
		} as Record<string, string[]>)[currentKind.itemKind] ?? ['auto', 'none']
	));

	const suggestedPresetId = $derived(
		({
			scanned_document: 'ocr_text',
			photo:            'none',
			audio:            'audio_transcript',
			video:            'video_transcript',
			document:         'none',
			other:            'auto',
		} as Record<string, string>)[currentKind.itemKind] ?? 'auto'
	);

	const suggestedPresetLabel = $derived(
		presets.find((p) => p.id === suggestedPresetId)?.label ?? ''
	);

	// Auto-switch preset to the suggestion when the media category changes.
	// Only fires when itemKind changes (e.g. scanned→audio), not within a category
	// (newspaper→magazine). Uses untrack so manual preset picks don't re-trigger.
	$effect(() => {
		const suggested = suggestedPresetId;
		if (!allowedPresets.has(untrack(() => selectedPreset))) {
			selectedPreset = suggested;
		}
	});

	const STEPS = [
		{ id: 'describe', label: 'Describe' },
		{ id: 'setup',    label: 'Upload & tune' },
		{ id: 'review',   label: 'Review' },
	];

	const addTag = () => {
		const t = tagsInput.trim().replace(/^#/, '');
		if (t && !summaryTags.includes(t)) summaryTags = [...summaryTags, t];
		tagsInput = '';
	};

	const removeTag = (tag: string) => { summaryTags = summaryTags.filter((t) => t !== tag); };
</script>

<!-- Page fills the main column from the layout grid -->
<div class="flex flex-col min-h-screen">

	<!-- Sticky top-bar -->
	<header class="sticky top-0 z-20 border-b border-border-soft bg-alabaster-grey px-4 py-4 sm:px-6">
		<div class="mx-auto flex w-full max-w-6xl items-start justify-between gap-6">
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-2 text-xs text-text-muted">
					<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingestion</span>
					<Icon name="chevron-r" size={12} />
					<span>New batch</span>
				</div>
				<h1 class="font-display text-2xl text-text-ink m-0 leading-tight">
					{name.trim() || 'Bring new material into the archive'}
				</h1>
			</div>
			<div class="flex flex-shrink-0 items-center gap-3 pt-1">
				<Stamp>Draft · not yet submitted</Stamp>
				<a
					href={resolve('/ingestion')}
					class="inline-flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
				>
					<Icon name="x" size={13} /> Discard
				</a>
			</div>
		</div>
	</header>

	<!-- Scrollable body -->
	<form
		id="new-batch-form"
		method="POST"
		class="flex-1 overflow-y-auto px-4 py-8 sm:px-6"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => { await update(); submitting = false; };
		}}
	>
		<!-- Hidden server fields derived from ChoiceCard selections -->
		<input type="hidden" name="itemKind" value={currentKind.itemKind} />
		<input type="hidden" name="classificationType" value={currentKind.classificationType} />
		<input type="hidden" name="languageCode" value={selectedLang} />
		<input type="hidden" name="pipelinePreset" value={selectedPreset} />
		<input type="hidden" name="accessLevel" value={selectedVisibility} />
		<input type="hidden" name="summaryTags" value={summaryTags.join(',')} />

		<div class="mx-auto flex w-full max-w-6xl flex-col gap-6">

			<!-- Batch name -->
			<div class="flex flex-col gap-2">
				<label for="name" class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Batch name</label>
				<input
					id="name"
					name="name"
					type="text"
					class="w-full border border-border-soft bg-surface-white px-4 py-[10px] text-sm text-text-ink rounded-2xl focus:outline-none focus:border-blue-slate focus:ring-2 focus:ring-blue-slate/25 transition-all"
					placeholder="e.g. NoorMags Issue 80–82, Family letters 1974"
					bind:value={name}
				/>
			</div>

			<!-- Kind -->
			<div class="flex flex-col gap-3">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">What kind of material is this?</span>
				<div class="grid grid-cols-3 gap-3 md:grid-cols-4">
					{#each kinds as kind (kind.id)}
						<ChoiceCard
							icon={kind.icon}
							title={kind.label}
							sub={kind.sub}
							selected={selectedKind === kind.id}
							onclick={() => { selectedKind = kind.id; }}
						/>
					{/each}
				</div>
			</div>

			<!-- Language -->
			<div class="flex flex-col gap-3">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Primary language</span>
				<div class="grid grid-cols-3 gap-3 md:grid-cols-6">
					{#each languages as lang (lang.id)}
						<ChoiceCard
							title={lang.label}
							native={lang.native}
							selected={selectedLang === lang.id}
							onclick={() => { selectedLang = lang.id; }}
						/>
					{/each}
				</div>
			</div>

			<!-- Pipeline preset -->
			<div class="flex flex-col gap-3">
				<div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
					<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Processing pipeline</span>
					<span class="text-xs text-text-muted">— {suggestedPresetLabel} suggested</span>
				</div>
				<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
					{#each presets as preset (preset.id)}
						<ChoiceCard
							title={preset.label}
							sub={preset.sub}
							selected={selectedPreset === preset.id}
							disabled={!allowedPresets.has(preset.id)}
							onclick={() => { selectedPreset = preset.id; }}
						/>
					{/each}
				</div>
			</div>

			<!-- Visibility -->
			<div class="flex flex-col gap-3">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Visibility</span>
				<div class="grid grid-cols-3 gap-3 max-w-md">
					{#each visibilityOptions as vis (vis.id)}
						<ChoiceCard
							title={vis.label}
							sub={vis.sub}
							selected={selectedVisibility === vis.id}
							onclick={() => { selectedVisibility = vis.id; }}
							compact
						/>
					{/each}
				</div>
			</div>

			<!-- Provenance / notes -->
			<div class="flex flex-col gap-2">
				<label for="summary" class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Provenance &amp; notes</label>
				<textarea
					id="summary"
					name="summary"
					rows="4"
					class="w-full border border-border-soft bg-surface-white px-4 py-[10px] text-sm text-text-ink rounded-2xl resize-vertical focus:outline-none focus:border-blue-slate focus:ring-2 focus:ring-blue-slate/25 transition-all leading-relaxed"
					placeholder="Donor, condition, context — anything the next archivist should know."
					bind:value={notes}
				></textarea>
			</div>

			<!-- Tags -->
			<div class="flex flex-col gap-2">
				<label for="tagsInput" class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Tags</label>
				<div class="flex items-center gap-2">
					<input
						id="tagsInput"
						type="text"
						class="flex-1 border border-border-soft bg-surface-white px-4 py-[10px] text-sm text-text-ink rounded-2xl focus:outline-none focus:border-blue-slate focus:ring-2 focus:ring-blue-slate/25 transition-all"
						placeholder="People, places, themes — press Enter to add"
						bind:value={tagsInput}
						onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
					/>
					<button
						type="button"
						class="flex-shrink-0 rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
						onclick={addTag}
					>Add</button>
				</div>
				{#if summaryTags.length > 0}
					<div class="flex flex-wrap gap-2 mt-1">
						{#each summaryTags as tag (tag)}
							<button
								type="button"
								onclick={() => removeTag(tag)}
								class="inline-flex items-center gap-1 rounded-full border border-border-soft bg-pale-sky/20 px-3 py-1 text-xs text-blue-slate hover:bg-pale-sky/40 transition-all"
							>
								{tag}
								<Icon name="x" size={10} />
							</button>
						{/each}
					</div>
				{/if}
			</div>

			{#if errorMessage}
				<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-4 py-3 text-xs text-burnt-peach">
					{errorMessage}
				</p>
			{/if}

		</div>
	</form>

	<!-- Sticky footnote bar -->
	<FootnoteBar>
		{#snippet left()}
			<span class="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-text-muted">Step 1 of 3</span>
			<Stepper steps={STEPS} current={0} />
		{/snippet}
		{#snippet right()}
			<a
				href={resolve('/ingestion')}
				class="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
			>
				Cancel
			</a>
			<button
				type="submit"
				form="new-batch-form"
				disabled={submitting}
				class="inline-flex items-center gap-2 rounded-full bg-blue-slate text-surface-white px-5 py-2 text-xs uppercase tracking-[0.2em] border border-blue-slate hover:bg-blue-slate-mid-dark transition-all disabled:opacity-40 disabled:pointer-events-none"
			>
				{submitting ? 'Creating…' : 'Continue'}
				<Icon name="arrow-r" size={13} />
			</button>
		{/snippet}
	</FootnoteBar>
</div>
