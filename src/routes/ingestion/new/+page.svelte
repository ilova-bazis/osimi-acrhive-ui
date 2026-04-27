<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { translate } from '$lib/i18n/translate';

	let { form } = $props<{ form: ActionData }>();

	let name = $state('');
	let itemKind = $state('document');
	let classificationType = $state('document');
	let languageCode = $state('en');
	let pipelinePreset = $state('auto');
	let accessLevel = $state('private');
	let embargoUntil = $state('');
	let rightsNote = $state('');
	let sensitivityNote = $state('');
	let summary = $state('');
	let tagsInput = $state('');
	let summaryTags = $state<string[]>([]);
	let submitting = $state(false);
	let classificationChangedByKind = $state(false);

	$effect(() => {
		if (!classificationChangedByKind) return;
		const id = setTimeout(() => { classificationChangedByKind = false; }, 3000);
		return () => clearTimeout(id);
	});

	const addTag = () => {
		const normalized = tagsInput.trim().replace(/^#/, '');
		if (!normalized) return;
		if (!summaryTags.includes(normalized)) {
			summaryTags = [...summaryTags, normalized];
		}
		tagsInput = '';
	};

	const removeTag = (tag: string) => {
		summaryTags = summaryTags.filter((item) => item !== tag);
	};

	const errorMessage = $derived(form?.error ?? '');
	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);
	const requiresDetailedClassification = $derived(
		itemKind === 'document' || itemKind === 'scanned_document'
	);
	const pipelineHint = $derived(t(`ingestionNew.fields.pipelineHints.${pipelinePreset}`));

	const applyClassificationDefault = (kind: string) => {
		let next = 'document';
		if (kind === 'photo') next = 'image';
		else if (kind === 'audio' || kind === 'video' || kind === 'other') next = 'other';

		if (next !== classificationType) {
			classificationType = next;
			classificationChangedByKind = true;
		}
	};
</script>

<main class="mx-auto flex min-h-[80vh] w-full max-w-6xl flex-col gap-6 px-6 py-10">
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div class="max-w-3xl space-y-2">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.title')}</p>
			<h2 class="font-display text-3xl text-text-ink">{t('ingestionNew.title')}</h2>
			<p class="text-sm text-text-muted">
				{t('ingestionNew.description')}
			</p>
		</div>
		<div class="rounded-2xl border border-blue-slate/30 bg-pale-sky/25 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-blue-slate">
			{t('ingestionNew.defaults')}
		</div>
	</section>

	<form
		method="POST"
		class="grid gap-5 lg:grid-cols-[1.6fr_1fr]"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<section class="space-y-5 rounded-3xl border border-border-soft bg-surface-white p-6">
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2 md:col-span-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="name">{t('ingestionNew.fields.batchLabel')}</label>
					<input
						id="name"
						name="name"
						type="text"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						placeholder={t('ingestionNew.fields.batchLabelPlaceholder')}
						bind:value={name}
					/>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="itemKind">{t('ingestionNew.fields.itemKind')}</label>
					<select
						id="itemKind"
						name="itemKind"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={itemKind}
						onchange={(event) => applyClassificationDefault(event.currentTarget.value)}
					>
						<option value="document">{t('ingestionSetup.itemKinds.document')}</option>
						<option value="scanned_document">{t('ingestionSetup.itemKinds.scanned_document')}</option>
						<option value="photo">{t('ingestionSetup.itemKinds.photo')}</option>
						<option value="audio">{t('ingestionSetup.itemKinds.audio')}</option>
						<option value="video">{t('ingestionSetup.itemKinds.video')}</option>
						<option value="other">{t('ingestionSetup.itemKinds.other')}</option>
					</select>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="classificationType">{t('ingestionNew.fields.classificationType')}</label>
					<select
						id="classificationType"
						name="classificationType"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={classificationType}
					>
						<option value="newspaper_article">{t('ingestionSetup.classificationTypes.newspaper_article')}</option>
						<option value="magazine_article">{t('ingestionSetup.classificationTypes.magazine_article')}</option>
						<option value="book_chapter">{t('ingestionSetup.classificationTypes.book_chapter')}</option>
						<option value="book">{t('ingestionSetup.classificationTypes.book')}</option>
						<option value="letter">{t('ingestionSetup.classificationTypes.letter')}</option>
						<option value="speech">{t('ingestionSetup.classificationTypes.speech')}</option>
						<option value="interview">{t('ingestionSetup.classificationTypes.interview')}</option>
						<option value="report">{t('ingestionSetup.classificationTypes.report')}</option>
						<option value="manuscript">{t('ingestionSetup.classificationTypes.manuscript')}</option>
						<option value="image">{t('ingestionSetup.classificationTypes.image')}</option>
						<option value="document">{t('ingestionSetup.classificationTypes.document')}</option>
						<option value="other">{t('ingestionSetup.classificationTypes.other')}</option>
					</select>
					{#if requiresDetailedClassification}
						<p class="text-[11px] text-text-muted">{t('ingestionNew.fields.classificationHintDocument')}</p>
					{:else}
						<p class="text-[11px] text-text-muted">{t('ingestionNew.fields.classificationHintAuto')}</p>
					{/if}
					{#if classificationChangedByKind}
						<p class="text-[11px] text-blue-slate">{t('ingestionNew.fields.classificationUpdatedByKind')}</p>
					{/if}
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="languageCode">{t('ingestionNew.fields.languageCode')}</label>
					<select
						id="languageCode"
						name="languageCode"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={languageCode}
					>
						<option value="en">{t('ingestionSetup.languages.en')}</option>
						<option value="ru">{t('ingestionSetup.languages.ru')}</option>
						<option value="tg">{t('ingestionSetup.languages.tg')}</option>
						<option value="fa">{t('ingestionSetup.languages.fa')}</option>
					</select>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="pipelinePreset">{t('ingestionNew.fields.pipelinePreset')}</label>
					<select
						id="pipelinePreset"
						name="pipelinePreset"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={pipelinePreset}
					>
						<option value="auto">{t('ingestionSetup.pipelinePresets.auto')}</option>
						<option value="none">{t('ingestionSetup.pipelinePresets.none')}</option>
						<option value="ocr_text">{t('ingestionSetup.pipelinePresets.ocr_text')}</option>
						<option value="audio_transcript">{t('ingestionSetup.pipelinePresets.audio_transcript')}</option>
						<option value="video_transcript">{t('ingestionSetup.pipelinePresets.video_transcript')}</option>
						<option value="ocr_and_audio_transcript">{t('ingestionSetup.pipelinePresets.ocr_and_audio_transcript')}</option>
						<option value="ocr_and_video_transcript">{t('ingestionSetup.pipelinePresets.ocr_and_video_transcript')}</option>
					</select>
					<p class="text-[11px] text-text-muted">{pipelineHint}</p>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="accessLevel">{t('ingestionNew.fields.accessLevel')}</label>
					<select
						id="accessLevel"
						name="accessLevel"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={accessLevel}
					>
						<option value="private">{t('ingestionSetup.batchIntent.accessLevels.private')}</option>
						<option value="family">{t('ingestionSetup.batchIntent.accessLevels.family')}</option>
						<option value="public">{t('ingestionSetup.batchIntent.accessLevels.public')}</option>
					</select>
				</div>
			</div>

			<div class="rounded-2xl border border-border-soft bg-alabaster-grey px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionNew.policyNotes')}</p>
				<div class="mt-3 grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="embargoUntil">{t('ingestionNew.fields.embargoUntil')}</label>
						<input
							id="embargoUntil"
							name="embargoUntil"
							type="datetime-local"
							class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
							bind:value={embargoUntil}
						/>
					</div>
					<div class="space-y-2">
						<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="rightsNote">{t('ingestionNew.fields.rightsNote')}</label>
						<input
							id="rightsNote"
							name="rightsNote"
							type="text"
							class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
							bind:value={rightsNote}
						/>
					</div>
					<div class="space-y-2 md:col-span-2">
						<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="sensitivityNote">{t('ingestionNew.fields.sensitivityNote')}</label>
						<input
							id="sensitivityNote"
							name="sensitivityNote"
							type="text"
							class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
							bind:value={sensitivityNote}
						/>
					</div>
				</div>
			</div>
		</section>

		<section class="space-y-5 rounded-3xl border border-border-soft bg-surface-white p-6">
			<div class="space-y-2">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionNew.summary.title')}</p>
				<p class="text-sm text-text-muted">{t('ingestionNew.summary.subtitle')}</p>
			</div>

			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="summaryTagsInput">{t('ingestionNew.summary.tags')}</label>
				<div class="flex items-center gap-2">
					<input
						id="summaryTagsInput"
						type="text"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						placeholder={t('ingestionNew.summary.tagsPlaceholder')}
						bind:value={tagsInput}
						onkeydown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								addTag();
							}
						}}
					/>
					<button
						type="button"
						class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
						onclick={addTag}
					>
						{t('ingestionNew.summary.add')}
					</button>
				</div>
				<input type="hidden" name="summaryTags" value={summaryTags.join(',')} />
				{#if summaryTags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each summaryTags as tag (tag)}
							<button
								type="button"
								onclick={() => removeTag(tag)}
								class="rounded-full border border-border-soft bg-pale-sky/30 px-3 py-1 text-xs text-blue-slate"
							>
								{tag} ×
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="summary">{t('ingestionNew.summary.summaryText')}</label>
				<textarea
					id="summary"
					name="summary"
					rows="6"
					class="w-full resize-none rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
					placeholder={t('ingestionNew.summary.summaryPlaceholder')}
					bind:value={summary}
				></textarea>
			</div>

			{#if errorMessage}
				<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
					{errorMessage}
				</p>
			{/if}

			<div class="flex items-center justify-end gap-3">
				<a
					href={resolve('/ingestion')}
					class="rounded-full border border-border-soft bg-surface-white px-5 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
				>
					{t('ingestionNew.cancel')}
				</a>
				<button
					type="submit"
					disabled={submitting}
					class="rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white disabled:pointer-events-none disabled:opacity-40"
				>
					{submitting ? t('ingestionNew.creating') : t('ingestionNew.continue')}
				</button>
			</div>
		</section>
	</form>
</main>
