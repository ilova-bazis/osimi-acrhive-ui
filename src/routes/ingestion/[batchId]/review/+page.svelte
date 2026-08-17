<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import FootnoteBar from '$lib/components/FootnoteBar.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import { locale } from '$lib/i18n/locale';
	import { formatCount, formatFileSize } from '$lib/i18n/format';
	import { translations, type TranslationKey } from '$lib/i18n/translations';
	import { knownReviewLanguageKey, knownReviewPipelinePresetKey } from '$lib/i18n/domainLabels';
	import { knownFileStatusKey } from '$lib/i18n/statusLabels';
	import { formatPlural, formatTemplate, translate } from '$lib/i18n/translate';
	import type { IngestionDetail, IngestionDetailFile } from '$lib/services/ingestionDetail';
	import type { ItemKind } from '$lib/ingestion/kindMappings';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const batchId = $derived(data.batchId);
	const batchTitle = $derived.by(() => {
		const title = data.summary?.title;
		if (typeof title === 'string' && title.trim()) {
			return title.trim();
		}
		if (
			title !== null &&
			typeof title === 'object' &&
			typeof (title as { primary?: unknown }).primary === 'string'
		) {
			const primary = ((title as { primary: string }).primary ?? '').trim();
			if (primary) return primary;
		}
		return data.batchLabel || batchId;
	});

	type PipelineCapability = 'ocr' | 'index' | 'transcribe';

	const PIPELINE_CAPABILITIES: Readonly<Record<string, readonly PipelineCapability[]>> = {
		none: [],
		ocr_text: ['ocr', 'index'],
		audio_transcript: ['transcribe'],
		video_transcript: ['transcribe'],
		ocr_and_audio_transcript: ['ocr', 'index', 'transcribe'],
		ocr_and_video_transcript: ['ocr', 'index', 'transcribe']
	};

	const isAutoPreset = $derived(data.pipelinePreset === 'auto');

	const pipelineCapabilities = $derived(
		PIPELINE_CAPABILITIES[data.pipelinePreset] ?? []
	);

	let confirmed = $state(false);
	let submitting = $state(false);
	let submitError = $state('');

	const STEPS = $derived([
		{ id: 'configure', label: t('ingestionNew.steps.configure') },
		{ id: 'upload', label: t('ingestionNew.steps.upload') },
		{ id: 'review', label: t('ingestionNew.steps.review') },
	]);

	const FILE_PREVIEW_LIMIT = 8;

	const previewUrlFor = (fileId: string): string =>
		resolve('/ingestion/[batchId]/files/[fileId]/preview', { batchId, fileId });

	const kindLabel = (kind: ItemKind): string => t(`ingestionReview.kind.${kind}`);

	const kindIcon = (contentType: string | null): string => {
		const mediaType = contentType?.split('/')[0];
		if (mediaType === 'image') return 'image';
		if (mediaType === 'video') return 'video';
		if (mediaType === 'audio') return 'audio';
		return 'file';
	};

	const presetLabel = (preset: string): string => {
		const key = knownReviewPipelinePresetKey(preset);
		return key ? t(key) : preset;
	};

	const visibilityLabel = (level: IngestionDetail['accessLevel']): string =>
		t(`ingestionReview.visibility.${level}`);

	const languageLabel = (code: string): string => {
		const key = knownReviewLanguageKey(code);
		return key ? t(key) : code;
	};

	const fileStatusLabel = (file: IngestionDetailFile): string => {
		const key = knownFileStatusKey(file.status);
		return key ? t(key) : file.statusRaw || t('values.unknown');
	};

	const moreFilesLabel = (count: number): string => {
		const template = formatPlural(
			dictionary,
			'ingestionReview.table.moreFiles',
			count,
			$locale
		);
		return formatTemplate(template, { count: formatCount(count, $locale) });
	};

	const setupEndpoint = $derived(
		resolve('/ingestion/[batchId]/setup', { batchId })
	);

	const beginProcessing = async () => {
		if (!confirmed || submitting) return;
		submitting = true;
		submitError = '';
		try {
			const res = await fetch(setupEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'submit' }),
			});
			if (res.status === 401) {
				await goto(resolve('/login'));
				return;
			}
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(
					(body as { error?: string }).error ?? t('ingestionReview.errors.submitFailed')
				);
			}
			await goto(resolve('/ingestion'));
		} catch (err) {
			submitError =
				err instanceof Error ? err.message : t('ingestionReview.errors.submitFailed');
		} finally {
			submitting = false;
		}
	};
</script>

<div class="flex flex-col min-h-full lg:min-h-screen">

<!-- Sticky top-bar -->
<header class="sticky top-0 z-20 border-b border-border-soft bg-alabaster-grey px-4 sm:px-6 py-4">
	<div class="mx-auto flex w-full max-w-6xl items-start justify-between gap-6">
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2 text-xs text-text-muted">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('header.nav.ingestion')}</span>
				<Icon name="chevron-r" size={12} />
				<span class="font-mono text-xs">{batchId}</span>
				<Icon name="chevron-r" size={12} />
				<span>{t('ingestionNew.steps.review')}</span>
			</div>
			<h1 class="font-display text-2xl text-text-ink m-0 leading-tight">{batchTitle}</h1>
		</div>
		<div class="flex items-center gap-3 pt-1 flex-shrink-0">
			<Stamp>{t('ingestionReview.stampReady')}</Stamp>
			<a
				href={resolve('/ingestion')}
				class="inline-flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
			>
				<Icon name="x" size={13} /> {t('ingestionReview.discard')}
			</a>
		</div>
	</div>
</header>

<!-- Body: 2-column -->
<div
	class="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 overflow-visible lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_380px] lg:overflow-hidden"
>

	<!-- Left: main review content -->
	<div
		class="flex flex-col gap-6 border-b border-border-soft px-6 py-8 lg:overflow-y-auto lg:border-b-0 lg:border-r"
	>

		<div class="flex flex-col gap-1">
			<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">{t('ingestionReview.kicker')}</span>
			<p class="text-sm text-text-muted leading-relaxed max-w-prose">
				{t('ingestionReview.intro')}
			</p>
		</div>

		<!-- Stats grid -->
		<div class="grid grid-cols-2 overflow-hidden rounded-2xl border border-border-soft lg:grid-cols-4">
			{#each [
				{ label: t('ingestionReview.stats.filesIncluded'), value: formatCount(data.enabledFiles.length, $locale), sub: data.skippedFiles.length > 0 ? formatTemplate(t('ingestionReview.stats.skippedCount'), { count: formatCount(data.skippedFiles.length, $locale) }) : t('ingestionReview.stats.allIncluded') },
				{ label: t('ingestionReview.stats.totalVolume'), value: formatFileSize(data.totalSizeBytes, $locale), sub: t('ingestionReview.stats.toUpload') },
				{ label: t('ingestionReview.stats.language'), value: languageLabel(data.languageCode), sub: t('ingestionReview.stats.primary') },
				{ label: t('ingestionReview.stats.pipeline'), value: presetLabel(data.pipelinePreset), sub: t('ingestionReview.stats.presetSub') },
			] as stat, i (stat.label)}
				<div
					class={`flex flex-col gap-1 px-5 py-4 ${
						i < 3 ? 'lg:border-r lg:border-border-soft' : ''
					} ${i % 2 === 0 ? 'border-r border-border-soft' : ''}`}
				>
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{stat.label}</span>
					<span class="font-display text-2xl text-text-ink leading-tight">{stat.value}</span>
					<span class="text-xs text-text-muted">{stat.sub}</span>
				</div>
			{/each}
		</div>

		<!-- Pipeline flow -->
		<div class="flex flex-col gap-2">
			<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">{t('ingestionReview.summary.pipeline')}</span>
			<div class="flex items-center gap-2 flex-wrap">
				<div class="flex items-center gap-[6px] bg-surface-white border border-border-soft rounded-xl px-3 py-2">
					<Icon name="upload" size={13} />
					<span class="text-xs text-text-ink">{t('ingestionReview.flow.upload')}</span>
				</div>
				<span class="text-text-muted flex-shrink-0"><Icon name="chevron-r" size={13} /></span>
				{#if isAutoPreset}
					<div class="flex items-center gap-[6px] bg-pale-sky/20 border border-blue-slate/20 rounded-xl px-3 py-2">
						<Icon name="sparkle" size={13} />
						<span class="text-xs text-text-ink">{t('ingestionReview.flow.detect')}</span>
					</div>
					<span class="text-text-muted flex-shrink-0"><Icon name="chevron-r" size={13} /></span>
				{/if}
				{#if pipelineCapabilities.includes('ocr')}
					<div class="flex items-center gap-[6px] bg-pale-sky/20 border border-blue-slate/20 rounded-xl px-3 py-2">
						<Icon name="sparkle" size={13} />
						<span class="text-xs text-text-ink">{t('pipelines.ocr')}</span>
					</div>
					<span class="text-text-muted flex-shrink-0"><Icon name="chevron-r" size={13} /></span>
				{/if}
				{#if pipelineCapabilities.includes('transcribe')}
					<div class="flex items-center gap-[6px] bg-pale-sky/20 border border-blue-slate/20 rounded-xl px-3 py-2">
						<Icon name="audio" size={13} />
						<span class="text-xs text-text-ink">{t('ingestionReview.flow.transcribe')}</span>
					</div>
					<span class="text-text-muted flex-shrink-0"><Icon name="chevron-r" size={13} /></span>
				{/if}
				<div class="flex items-center gap-[6px] bg-pearl-beige/40 border border-burnt-peach/30 rounded-xl px-3 py-2">
					<Icon name="archive" size={13} />
					<span class="text-xs text-text-ink">{t('ingestionReview.flow.archive')}</span>
				</div>
			</div>
		</div>

		<!-- Files table -->
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">{t('ingestionDetail.files.title')}</span>
				{#if data.skippedFiles.length > 0}
					<Chip variant="peach">{formatTemplate(t('ingestionReview.stats.skippedCount'), { count: data.skippedFiles.length })}</Chip>
				{/if}
			</div>

			<div class="overflow-x-auto rounded-2xl border border-border-soft">
				<!-- Header -->
				<div class="grid min-w-[400px] border-b border-border-soft bg-alabaster-grey px-4 py-2" style="grid-template-columns: 48px 1fr 80px 60px">
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('objects.table.headers.preview')}</span>
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{t('ingestionReview.table.name')}</span>
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted text-right">{t('ingestionDetail.files.headers.size')}</span>
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted text-right">{t('ingestionDetail.metrics.status')}</span>
				</div>

				{#each data.enabledFiles.slice(0, FILE_PREVIEW_LIMIT) as file (file.id)}
					{@const hasPreview = file.preview?.status === 'ready'}
					<div class="grid min-w-[400px] items-center border-b border-border-soft px-4 py-[10px] last:border-b-0" style="grid-template-columns: 48px 1fr 80px 60px">
						<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-border-soft bg-alabaster-grey/50">
							{#if hasPreview}
								<img
									src={previewUrlFor(file.id)}
									alt={file.name}
									class="h-full w-full object-cover"
									onerror={(event) => {
										const image = event.currentTarget as HTMLImageElement;
										image.style.display = 'none';
										image.nextElementSibling?.classList.remove('hidden');
									}}
								/>
								<span class="hidden items-center justify-center text-text-muted/70">
									<Icon name={kindIcon(file.contentType)} size={14} />
								</span>
							{:else}
								<span class="flex items-center justify-center text-text-muted/70">
									<Icon name={kindIcon(file.contentType)} size={14} />
								</span>
							{/if}
						</div>
						<span class="text-sm text-text-ink truncate pr-4">{file.name}</span>
						<span class="font-mono text-xs text-text-muted text-right">{file.sizeBytes != null ? formatFileSize(file.sizeBytes, $locale) : t('values.unknown')}</span>
						<div class="flex justify-end">
							<Chip variant="ok">{fileStatusLabel(file)}</Chip>
						</div>
					</div>
				{/each}

				{#if data.enabledFiles.length > FILE_PREVIEW_LIMIT}
					<div class="px-4 py-3 text-xs text-text-muted border-t border-border-soft">
						{moreFilesLabel(data.enabledFiles.length - FILE_PREVIEW_LIMIT)}
					</div>
				{/if}

				{#if data.enabledFiles.length === 0}
					<div class="px-4 py-6 text-sm text-text-muted text-center">{t('ingestionReview.table.empty')}</div>
				{/if}
			</div>
		</div>

		{#if submitError}
			<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-4 py-3 text-xs text-burnt-peach">
				{submitError}
			</p>
		{/if}

		<!-- Confirm block -->
		<div class="bg-surface-white border border-border-soft rounded-2xl p-5 flex flex-col gap-3">
			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={confirmed}
					class="mt-[3px] flex-shrink-0 w-4 h-4 accent-blue-slate-deep cursor-pointer"
				/>
				<div class="flex flex-col gap-1">
					<span class="font-display text-base text-text-ink leading-snug">
						{t('ingestionReview.confirm.title')}
					</span>
					<span class="text-sm text-text-muted leading-relaxed">
						{t('ingestionReview.confirm.body')}
					</span>
				</div>
			</label>
		</div>

	</div>

	<!-- Right: summary rail -->
	<div
		class="flex flex-col gap-6 bg-pale-sky/10 px-6 py-8 lg:overflow-y-auto lg:border-l lg:border-border-soft"
	>

		<div class="flex flex-col gap-2">
			<Stamp>{t('ingestionReview.stampReady')}</Stamp>
			<h2 class="font-display text-2xl text-text-ink leading-snug m-0">{batchTitle}</h2>
		</div>

		<hr class="border-border-soft m-0" />

		<!-- Batch metadata -->
		<div class="flex flex-col gap-3">
			{#each [
				{ label: t('ingestionReview.summary.kind'), value: kindLabel(data.itemKind) },
				{ label: t('ingestionReview.summary.language'), value: languageLabel(data.languageCode) },
				{ label: t('ingestionReview.summary.pipeline'), value: presetLabel(data.pipelinePreset) },
				{ label: t('ingestionReview.summary.visibility'), value: visibilityLabel(data.accessLevel) },
			] as row (row.label)}
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{row.label}</span>
					<span class="text-sm text-text-ink font-medium">{row.value}</span>
				</div>
			{/each}
		</div>

		<hr class="border-border-soft m-0" />

		<!-- File stats -->
		<div class="flex flex-col gap-3">
			<span class="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">{t('ingestionReview.counts.title')}</span>
			{#each [
				{ label: t('ingestionReview.counts.filesToProcess'), value: formatCount(data.enabledFiles.length, $locale) },
				{ label: t('ingestionReview.counts.skipped'), value: formatCount(data.skippedFiles.length, $locale) },
				{ label: t('ingestionReview.counts.totalUpload'), value: formatFileSize(data.totalSizeBytes, $locale) },
				{ label: t('ingestionReview.counts.objects'), value: formatCount(data.items.length, $locale) },
			] as row (row.label)}
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs text-text-muted">{row.label}</span>
					<span class="font-mono text-xs text-text-ink">{row.value}</span>
				</div>
			{/each}
		</div>

		<hr class="border-border-soft m-0" />

		<!-- Pipeline footprint -->
		<div class="flex flex-col gap-3">
			<span class="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">{t('ingestionReview.footprint.title')}</span>
			{#if data.pipelinePreset === 'none'}
				<span class="text-sm text-text-muted">{t('ingestionReview.footprint.none')}</span>
			{:else}
				<div class="flex flex-wrap gap-2">
					<Chip variant="sky">{t('ingestionReview.footprint.upload')}</Chip>
					{#if isAutoPreset}
						<Chip variant="sky">{t('ingestionReview.footprint.detect')}</Chip>
					{:else}
						{#if pipelineCapabilities.includes('ocr')}
							<Chip variant="sky">{t('ingestionReview.footprint.ocr')}</Chip>
						{/if}
						{#if pipelineCapabilities.includes('index')}
							<Chip variant="sky">{t('ingestionReview.footprint.index')}</Chip>
						{/if}
						{#if pipelineCapabilities.includes('transcribe')}
							<Chip variant="sky">{t('ingestionReview.footprint.transcribe')}</Chip>
						{/if}
					{/if}
					<Chip variant="sky">{t('ingestionReview.footprint.archive')}</Chip>
				</div>
			{/if}
		</div>

	</div>

</div>

<!-- Footer -->
<FootnoteBar>
	{#snippet left()}
		<span class="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-text-muted">{formatTemplate(t('ingestionNew.stepCounter'), { current: 3, total: 3 })}</span>
		<span class="hidden sm:flex">
			<Stepper
				steps={STEPS}
				current={2}
				onJump={(i) => {
					if (i === 0) goto(resolve('/ingestion/new'));
					else if (i === 1) goto(resolve('/ingestion/[batchId]/setup', { batchId }));
				}}
			/>
		</span>
	{/snippet}
	{#snippet right()}
		<a
			href={resolve('/ingestion/[batchId]/setup', { batchId })}
			class="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
		>
			<Icon name="arrow-l" size={13} /> {t('ingestionReview.backToSetup')}
		</a>
		<button
			disabled={!confirmed || submitting}
			onclick={beginProcessing}
			class="inline-flex items-center gap-2 rounded-full bg-burnt-peach text-surface-white px-5 py-2 text-xs uppercase tracking-[0.2em] border border-burnt-peach transition-all disabled:opacity-40 disabled:pointer-events-none"
		>
			{submitting ? t('ingestionReview.submitting') : t('ingestionReview.beginProcessing')}
			<Icon name="arrow-r" size={13} />
		</button>
	{/snippet}
</FootnoteBar>

</div>
