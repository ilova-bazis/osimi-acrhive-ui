<script lang="ts">
	import { browser } from '$app/environment';
	import { translations, type LocaleKey } from '$lib/i18n/translations';
	import { sampleBatch } from '$lib/data/seed';
	import {
		fileStatusOrder,
		mapBatchItemsToFiles,
		mapIntentFields,
		mapOverrideBadges,
		mapOverrideFields,
		mapStatusList
	} from '$lib/ui/mapBatch';
	import type { FileItem, FileStatus } from '$lib/types';
	import BatchIntentPanel from '$lib/components/BatchIntentPanel.svelte';
	import DropzonePanel from '$lib/components/DropzonePanel.svelte';
	import FileListPanel from '$lib/components/FileListPanel.svelte';
	import FileOverridePanel from '$lib/components/FileOverridePanel.svelte';
	import FooterActions from '$lib/components/FooterActions.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusLegendPanel from '$lib/components/StatusLegendPanel.svelte';

	const locales = [
		{ key: 'en', label: 'EN' },
		{ key: 'ru', label: 'RU' }
	] as const;
	const textSizes = [
		{ key: 'small', label: 'A-' },
		{ key: 'default', label: 'A' },
		{ key: 'large', label: 'A+' }
	] as const;

	const statuses: FileStatus[] = fileStatusOrder;
	const sessionValue = sampleBatch.title;
	const files: FileItem[] = mapBatchItemsToFiles(sampleBatch.items);

	let selectedId = files[0]?.id;
	let locale: LocaleKey = 'en';
	let textSize: 'small' | 'default' | 'large' = 'default';

	$: dictionary = translations[locale];

	$: fontScaleValue = (() => {
		switch (textSize) {
			case 'small':
				return 0.92;
			case 'large':
				return 1.22;
			default:
				return 1;
		}
	})();

	$: if (browser) {
		document.documentElement.style.setProperty('--font-scale', String(fontScaleValue));
	}

	const t = (key: string, dict: Record<string, unknown>) => {
		const segments = key.split('.');
		let current: Record<string, unknown> = dict;
		for (const segment of segments) {
			if (typeof current[segment] === 'undefined') {
				return key;
			}
			current = current[segment] as Record<string, unknown>;
		}
		return current as unknown as string;
	};

	const statusKey = (state: string) => (state === 'needs-review' ? 'needsReview' : state);

	$: statusLabels = Object.fromEntries(
		statuses.map((status) => [status, t(`statuses.${statusKey(status)}`, dictionary)])
	) as Record<FileStatus, string>;

	$: legendStatuses = mapStatusList(statusLabels);

	$: intentFields = mapIntentFields(sampleBatch, {
		language: t('intent.language', dictionary),
		category: t('intent.category', dictionary),
		preset: t('intent.preset', dictionary),
		visibility: t('intent.visibility', dictionary)
	});

	$: selectedFile = files.find((file) => file.id === selectedId);
	$: selectedItem = sampleBatch.items.find((item) => item.originalFilename === selectedFile?.name);
	const batchTags = Array.from(
		new Set(sampleBatch.items.flatMap((item) => item.tags ?? []).filter((tag) => tag.length > 0))
	);

	$: overrideFields = mapOverrideFields(
		selectedItem,
		{
			language: t('overrides.language', dictionary),
			documentType: t('overrides.documentType', dictionary)
		},
		t('values.unknown', dictionary)
	);

	$: overrideBadges = mapOverrideBadges(selectedItem, {
		pipelines: {
			ocr: t('pipelines.ocr', dictionary),
			layoutOcr: t('pipelines.layoutOcr', dictionary),
			speechToText: t('pipelines.speechToText', dictionary),
			imageTagging: t('pipelines.imageTagging', dictionary)
		},
		attention: t('overrides.badgeThree', dictionary)
	});

	$: overrideNote = selectedItem?.notes ?? t('overrides.note', dictionary);
</script>

<div class="min-h-screen bg-alabaster-grey text-text-ink">
	<PageHeader
		library={t('header.library', dictionary)}
		title={t('app.title', dictionary)}
		subtitle={t('app.subtitle', dictionary)}
		sessionLabel={t('app.session', dictionary)}
		sessionValue={sessionValue}
		locales={locales}
		locale={locale}
		textSizes={textSizes}
		textSize={textSize}
		textSizeLabel={t('header.textSize', dictionary)}
		localeLabel={t('header.locale', dictionary)}
		onLocaleChange={(value) => (locale = value as LocaleKey)}
		onTextSizeChange={(value) => (textSize = value as typeof textSize)}
	/>

	<main class="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.6fr_1fr]">
		<section class="space-y-6">
			<DropzonePanel
				label={t('dropzone.label', dictionary)}
				headline={t('dropzone.headline', dictionary)}
				support={t('dropzone.support', dictionary)}
				badges={[t('dropzone.badgeOne', dictionary), t('dropzone.badgeTwo', dictionary)]}
			/>

			<StatusLegendPanel
				title={t('legend.title', dictionary)}
				subtitle={t('legend.subtitle', dictionary)}
				countLabel={t('legend.count', dictionary)}
				statuses={legendStatuses}
			/>

			<FileListPanel
				title={t('files.title', dictionary)}
				subtitle={t('files.subtitle', dictionary)}
				files={files}
				selectedId={selectedId}
				statusLabels={statusLabels}
				onSelect={(file) => (selectedId = file.id)}
			/>
		</section>

		<aside class="space-y-6">
		<BatchIntentPanel
			title={t('intent.title', dictionary)}
			description={t('intent.description', dictionary)}
			fields={intentFields}
			tags={batchTags}
			tagsLabel={t('intent.tags', dictionary)}
			heading={sessionValue}
		/>

			<FileOverridePanel
				title={t('overrides.title', dictionary)}
				subtitle={t('overrides.subtitle', dictionary)}
				fields={overrideFields}
				badges={overrideBadges}
				note={overrideNote}
			/>
		</aside>
	</main>

	<FooterActions
		note={t('footer.note', dictionary)}
		secondaryLabel={t('footer.download', dictionary)}
		primaryLabel={t('footer.start', dictionary)}
	/>
</div>
