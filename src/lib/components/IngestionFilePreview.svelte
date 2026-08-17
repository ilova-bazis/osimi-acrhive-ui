<script lang="ts">
	import { locale } from '$lib/i18n/locale';
	import { formatCount, formatFileSize } from '$lib/i18n/format';
	import { formatPlural, formatTemplate, translate } from '$lib/i18n/translate';
import { translations, type TranslationKey } from '$lib/i18n/translations';
	import Icon from '$lib/components/Icon.svelte';
	import type {
		IngestionPreviewItem,
		PreviewPresentation
	} from '$lib/ingestion/previewPresentation';

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);


	let {
		files,
		onPreview,
		onCheckAgain
	} = $props<{
		files: IngestionPreviewItem[];
		onPreview: (fileId: string) => void;
		onCheckAgain?: (fileId: string) => void;
	}>();

	let failedImageKeys = $state<Record<string, boolean>>({});

	const imageKey = (file: IngestionPreviewItem): string =>
		file.preview.status === 'ready' ? `${file.id}:${file.preview.url}` : file.id;

	const imageFailed = (file: IngestionPreviewItem): boolean =>
		Boolean(failedImageKeys[imageKey(file)]);

	const markImageFailed = (file: IngestionPreviewItem): void => {
		failedImageKeys = { ...failedImageKeys, [imageKey(file)]: true };
	};

	const stateLabel = (status: PreviewPresentation['status']): string => {
		switch (status) {
			case 'ready':
				return t('ingestionSetup.previewViewer.ready');
			case 'pending':
				return t('ingestionSetup.previewViewer.pending');
			case 'check-timeout':
				return t('ingestionSetup.previewViewer.checkTimedOut');
			case 'failed':
				return t('ingestionSetup.previewViewer.failed');
			case 'purged':
				return t('ingestionSetup.previewViewer.purged');
			default:
				return t('ingestionSetup.previewViewer.unsupported');
		}
	};

	const fileKindIcon = (mediaType: IngestionPreviewItem['mediaType']): string => {
		if (mediaType === 'audio') return 'audio';
		if (mediaType === 'document') return 'book';
		if (mediaType === 'video') return 'video';
		return 'image';
	};

	const tileAriaLabel = (file: IngestionPreviewItem, index: number): string =>
		formatTemplate(t('ingestionSetup.previewViewer.openFile'), {
			name: file.name,
			position: index + 1,
			total: files.length
		});
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-baseline justify-between">
		<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">
			{t('ingestionSetup.previewViewer.objectFiles')}
		</p>
		<p class="font-mono text-[10px] text-text-muted">
			{formatTemplate(formatPlural(dictionary, 'ingestionSetup.previewViewer.itemsCount', files.length, $locale), {
				count: formatCount(files.length, $locale)
			})}
		</p>
	</div>

	<div
		class="flex gap-3 overflow-x-auto pb-2"
		role="group"
		aria-label={t('ingestionSetup.previewViewer.objectFiles')}
	>
		{#each files as file, index (file.id)}
			<div class="flex w-24 shrink-0 snap-start flex-col gap-1.5">
				<div
					class="relative h-32 w-full overflow-hidden rounded-lg border border-border-soft bg-alabaster-grey/50"
				>
					{#if file.preview.status === 'ready' && !imageFailed(file)}
						<button
							type="button"
							class="h-full w-full cursor-zoom-in border-0 bg-transparent p-0"
							onclick={() => onPreview(file.id)}
							aria-label={tileAriaLabel(file, index)}
						>
							<img
								src={file.preview.url}
								alt=""
								class="h-full w-full object-cover"
								onerror={() => markImageFailed(file)}
							/>
						</button>
					{:else if file.preview.status === 'pending'}
						<button
							type="button"
							class="flex h-full w-full cursor-zoom-in flex-col items-center justify-center gap-1.5 border-0 bg-pale-sky/30 p-2 text-center text-blue-slate"
							onclick={() => onPreview(file.id)}
							aria-label={tileAriaLabel(file, index)}
						>
							<span
								class="inline-block h-4 w-4 rounded-full border-2 border-blue-slate/25 border-t-blue-slate motion-safe:animate-spin"
								aria-hidden="true"
							></span>
							<span class="text-[9px] uppercase leading-tight tracking-[0.14em]">
								{stateLabel('pending')}
							</span>
						</button>
					{:else if file.preview.status === 'check-timeout'}
						<button
							type="button"
							class="flex h-full w-full cursor-zoom-in flex-col items-center justify-center gap-1.5 border-0 bg-burnt-peach/10 p-2 text-center text-burnt-peach"
							onclick={() => onPreview(file.id)}
							aria-label={tileAriaLabel(file, index)}
						>
							<Icon name="warn" size={16} />
							<span class="text-[9px] uppercase leading-tight tracking-[0.14em]">
								{stateLabel('check-timeout')}
							</span>
						</button>
						{#if onCheckAgain}
							<button
								type="button"
								class="absolute inset-x-0 bottom-0 z-10 flex min-h-10 items-center justify-center border-0 bg-burnt-peach px-1 text-[9px] font-medium uppercase tracking-[0.14em] text-surface-white transition hover:bg-burnt-peach/85 md:min-h-11"
								onclick={() => onCheckAgain(file.id)}
							>
								{t('ingestionSetup.previewViewer.checkAgain')}
							</button>
						{/if}
					{:else if file.preview.status === 'failed' || imageFailed(file)}
						<button
							type="button"
							class="flex h-full w-full cursor-zoom-in flex-col items-center justify-center gap-1.5 border-0 bg-burnt-peach/10 p-2 text-center text-burnt-peach"
							onclick={() => onPreview(file.id)}
							aria-label={tileAriaLabel(file, index)}
						>
							<Icon name="warn" size={16} />
							<span class="text-[9px] uppercase leading-tight tracking-[0.14em]">
								{imageFailed(file)
									? t('ingestionSetup.previewViewer.loadFailed')
									: stateLabel('failed')}
							</span>
						</button>
					{:else if file.preview.status === 'purged'}
						<button
							type="button"
							class="flex h-full w-full cursor-zoom-in flex-col items-center justify-center gap-1.5 border-0 bg-alabaster-grey/70 p-2 text-center text-text-muted"
							onclick={() => onPreview(file.id)}
							aria-label={tileAriaLabel(file, index)}
						>
							<Icon name="archive" size={16} />
							<span class="text-[9px] uppercase leading-tight tracking-[0.14em]">
								{stateLabel('purged')}
							</span>
						</button>
					{:else}
						<button
							type="button"
							class="flex h-full w-full cursor-zoom-in flex-col items-center justify-center gap-1.5 border-0 bg-alabaster-grey/70 p-2 text-center text-text-muted"
							onclick={() => onPreview(file.id)}
							aria-label={tileAriaLabel(file, index)}
						>
							<Icon name={fileKindIcon(file.mediaType)} size={18} />
							<span class="text-[9px] uppercase leading-tight tracking-[0.14em]">
								{stateLabel('unsupported')}
							</span>
						</button>
					{/if}
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="font-mono text-[9px] text-text-muted/70"
						>{index + 1}</span
					>
					<span
						class="line-clamp-2 break-all text-[11px] leading-tight text-text-ink"
						title={file.name}
					>
						{file.name}
					</span>
					<span class="font-mono text-[9px] text-text-muted/60"
						>{formatFileSize(file.sizeBytes, $locale)}</span
					>
				</div>
			</div>
		{/each}
	</div>
</div>
