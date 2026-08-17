<script lang="ts">
	import { tick } from 'svelte';
	import { locale } from '$lib/i18n/locale';
	import { formatFileSize } from '$lib/i18n/format';
	import { formatTemplate, translate } from '$lib/i18n/translate';
import { translations, type TranslationKey } from '$lib/i18n/translations';
	import Icon from '$lib/components/Icon.svelte';
	import type {
		IngestionPreviewItem,
		PreviewPresentation
	} from '$lib/ingestion/previewPresentation';

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);


	let {
		open,
		items,
		activeIndex,
		onSelect,
		onCheckAgain,
		onClose
	} = $props<{
		open: boolean;
		items: IngestionPreviewItem[];
		activeIndex: number;
		onSelect: (index: number) => void;
		onCheckAgain?: (fileId: string) => void;
		onClose: () => void;
	}>();

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let closeButtonEl = $state<HTMLButtonElement | null>(null);
	let savedInvoker: HTMLElement | null = null;
	let failedImageKeys = $state<Record<string, boolean>>({});
	let stripButtons = $state<(HTMLButtonElement | null)[]>([]);

	const clampedIndex = $derived(
		Math.min(Math.max(activeIndex, 0), Math.max(items.length - 1, 0))
	);
	const current = $derived(items[clampedIndex] ?? null);
	const hasPrevious = $derived(clampedIndex > 0);
	const hasNext = $derived(clampedIndex < items.length - 1);
	const canNavigate = $derived(items.length > 1);
	const imageKey = $derived(
		current?.preview.status === 'ready'
			? `${current.id}:${current.preview.url}`
			: current?.id ?? ''
	);
	const imageFailed = $derived(Boolean(failedImageKeys[imageKey]));

	const mediaKindLabel = (item: IngestionPreviewItem): string => {
		const kind = item.mediaType === 'document' ? 'document' : item.mediaType;
		return t(`ingestionSetup.fileTypes.${kind}`);
	};

	const stateTitle = (status: PreviewPresentation['status']): string => {
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

	$effect(() => {
		const dialog = dialogEl;
		if (!dialog) return;
		if (open) {
			if (!dialog.open) {
				savedInvoker =
					document.activeElement instanceof HTMLElement
						? document.activeElement
						: null;
				dialog.showModal();
			}
			void tick().then(() => closeButtonEl?.focus());
		} else if (dialog.open) {
			dialog.close();
			if (savedInvoker?.isConnected) savedInvoker.focus();
		}
	});

	$effect(() => {
		if (!open) return;
		const activeId = current?.id;
		const index = clampedIndex;
		void activeId;
		void tick().then(() => {
			if (!dialogEl?.open) return;
			if (dialogEl.contains(document.activeElement)) return;
			(stripButtons[index] ?? closeButtonEl)?.focus();
		});
	});

	const handleCancel = (event: Event): void => {
		event.preventDefault();
		onClose();
	};

	const handleKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'ArrowLeft' && canNavigate) {
			event.preventDefault();
			if (hasPrevious) onSelect(clampedIndex - 1);
		} else if (event.key === 'ArrowRight' && canNavigate) {
			event.preventDefault();
			if (hasNext) onSelect(clampedIndex + 1);
		} else if (event.key === 'Home' && canNavigate) {
			event.preventDefault();
			onSelect(0);
		} else if (event.key === 'End' && canNavigate) {
			event.preventDefault();
			onSelect(items.length - 1);
		}
	};

	const markImageFailed = (): void => {
		failedImageKeys = { ...failedImageKeys, [imageKey]: true };
	};

	const dialogLabel = $derived(
		current
			? formatTemplate(t('ingestionSetup.previewViewer.dialogLabel'), {
					name: current.name
				})
			: t('ingestionSetup.previewViewer.dialogLabelFallback')
	);
</script>

<dialog
	bind:this={dialogEl}
	class="inset-0 m-0 h-full w-full max-h-none max-w-none items-center justify-center bg-transparent p-0 text-pearl-beige backdrop:bg-dark-grey/70 backdrop:backdrop-blur-sm"
	aria-label={dialogLabel}
	oncancel={handleCancel}
	onclick={(event) => {
		if (event.target === dialogEl) onClose();
	}}
	onkeydown={handleKeydown}
>
	{#if current}
		<div class="flex h-full items-center justify-center p-3 md:p-6">
			<div class="flex max-h-full w-full max-w-[1100px] flex-col gap-3">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<div class="flex min-w-0 items-baseline gap-2">
						<p class="min-w-0 truncate text-sm" title={current.name}>
							{current.name}
						</p>
						<p
							class="shrink-0 font-mono text-[11px] text-pearl-beige/70"
							aria-live="polite"
						>
							{formatTemplate(t('ingestionSetup.previewViewer.counter'), {
								current: clampedIndex + 1,
								total: items.length
							})}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-3">
						<p class="font-mono text-[10px] text-pearl-beige/60">
							{current.contentType ?? mediaKindLabel(current)} · {formatFileSize(current.sizeBytes, $locale)}
						</p>
						<button
							bind:this={closeButtonEl}
							type="button"
							class="rounded-full border border-pearl-beige/40 px-3 py-1 text-xs text-pearl-beige transition hover:bg-pearl-beige/15"
							onclick={onClose}
						>
							{t('ingestionSetup.previewViewer.close')}
						</button>
					</div>
				</div>

				<div class="flex min-h-0 flex-1 items-center justify-center gap-2 md:gap-4">
					{#if canNavigate}
						<button
							type="button"
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pearl-beige/40 text-xl text-pearl-beige transition hover:bg-pearl-beige/15 disabled:cursor-default disabled:opacity-25 md:h-11 md:w-11"
							disabled={!hasPrevious}
							onclick={() => onSelect(clampedIndex - 1)}
							aria-label={t('ingestionSetup.previewViewer.previous')}
						>
							‹
						</button>
					{/if}

					<div
						class="flex max-h-full min-h-0 w-full max-w-[70vw] flex-col overflow-hidden rounded-xl border border-pearl-beige/25 bg-surface-white shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:max-w-[60vw]"
					>
						{#if current.preview.status === 'ready' && !imageFailed}
							<img
								src={current.preview.url}
								alt={current.name}
								class="max-h-[68vh] w-full object-contain"
								onerror={markImageFailed}
							/>
						{:else if current.preview.status === 'pending'}
							<div class="flex flex-col items-center justify-center gap-3 bg-pale-sky px-6 py-12 text-center text-blue-slate">
								<span
									class="inline-block h-6 w-6 rounded-full border-2 border-blue-slate/25 border-t-blue-slate motion-safe:animate-spin"
									aria-hidden="true"
								></span>
								<p class="text-sm font-medium">{stateTitle('pending')}</p>
								<p class="max-w-xs text-xs text-blue-slate/80">
									{t('ingestionSetup.previewViewer.pendingNote')}
								</p>
							</div>
						{:else if current.preview.status === 'check-timeout'}
							<div class="flex flex-col items-center justify-center gap-3 bg-pearl-beige px-6 py-12 text-center text-burnt-peach">
								<Icon name="warn" size={28} />
								<p class="text-sm font-medium">{stateTitle('check-timeout')}</p>
								<p class="max-w-xs text-xs text-burnt-peach/80">
									{t('ingestionSetup.previewViewer.checkTimedOutNote')}
								</p>
							</div>
							{#if onCheckAgain}
								<div class="flex flex-wrap items-center justify-center gap-3 border-t border-border-soft bg-alabaster-grey px-4 py-3">
									<button
										type="button"
										class="rounded-full border border-burnt-peach bg-burnt-peach px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-surface-white transition hover:bg-burnt-peach/85"
										onclick={() => onCheckAgain(current.id)}
									>
										{t('ingestionSetup.previewViewer.checkAgain')}
									</button>
									<span class="text-[10px] text-text-muted">
										{t('ingestionSetup.previewViewer.checkAgainHint')}
									</span>
								</div>
							{/if}
						{:else if current.preview.status === 'failed' || imageFailed}
							<div class="flex flex-col items-center justify-center gap-3 bg-burnt-peach/10 px-6 py-12 text-center text-burnt-peach">
								<Icon name="warn" size={28} />
								<p class="text-sm font-medium">
									{imageFailed
										? t('ingestionSetup.previewViewer.loadFailed')
										: stateTitle('failed')}
								</p>
								<p class="max-w-xs text-xs text-burnt-peach/80">
									{imageFailed
										? t('ingestionSetup.previewViewer.loadFailedNote')
										: t('ingestionSetup.previewViewer.failedNote')}
								</p>
							</div>
						{:else if current.preview.status === 'purged'}
							<div class="flex flex-col items-center justify-center gap-3 bg-alabaster-grey px-6 py-12 text-center text-text-muted">
								<Icon name="archive" size={28} />
								<p class="text-sm font-medium">{stateTitle('purged')}</p>
								<p class="max-w-xs text-xs text-text-muted/80">
									{t('ingestionSetup.files.previewPurged')}
								</p>
							</div>
						{:else}
							<div class="flex flex-col items-center justify-center gap-3 bg-alabaster-grey px-6 py-12 text-center text-text-muted">
								<Icon name={fileKindIcon(current.mediaType)} size={28} />
								<p class="text-sm font-medium">{stateTitle('unsupported')}</p>
								<p class="max-w-xs text-xs text-text-muted/80">
									{t('ingestionSetup.previewViewer.unsupportedNote')}
								</p>
							</div>
						{/if}
					</div>

					{#if canNavigate}
						<button
							type="button"
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-pearl-beige/40 text-xl text-pearl-beige transition hover:bg-pearl-beige/15 disabled:cursor-default disabled:opacity-25 md:h-11 md:w-11"
							disabled={!hasNext}
							onclick={() => onSelect(clampedIndex + 1)}
							aria-label={t('ingestionSetup.previewViewer.next')}
						>
							›
						</button>
					{/if}
				</div>

				{#if canNavigate}
					<div
						class="flex gap-2 overflow-x-auto pb-1 pt-1"
						role="group"
						aria-label={t('ingestionSetup.previewViewer.objectFiles')}
					>
						{#each items as item, index (item.id)}
							<button
								bind:this={stripButtons[index]}
								type="button"
								class={`h-14 w-12 shrink-0 overflow-hidden rounded border transition ${
									index === clampedIndex
										? 'border-pearl-beige opacity-100'
										: 'border-pearl-beige/25 opacity-70 hover:opacity-100'
								}`}
								onclick={() => onSelect(index)}
								aria-label={formatTemplate(
									t('ingestionSetup.previewViewer.openFile'),
									{
										name: item.name,
										position: index + 1,
										total: items.length
									}
								)}
								aria-current={index === clampedIndex ? 'true' : 'false'}
							>
								{#if item.preview.status === 'ready'}
									<img
										src={item.preview.url}
										alt=""
										class="h-full w-full object-cover"
									/>
								{:else}
									<span
										class="flex h-full w-full items-center justify-center bg-alabaster-grey"
									>
										<Icon
											name={
												item.preview.status === 'failed' ||
												item.preview.status === 'check-timeout'
													? 'warn'
													: fileKindIcon(item.mediaType)
											}
											size={14}
										/>
									</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</dialog>
