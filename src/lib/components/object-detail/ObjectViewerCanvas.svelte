<script lang="ts">
	import MediaRequestBanner from '$lib/components/object-detail/MediaRequestBanner.svelte';
	import ArtifactTextPreview from '$lib/components/object-detail/ArtifactTextPreview.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations, type TranslationKey } from '$lib/i18n/translations';
	import { formatCount } from '$lib/i18n/format';
	import { mediaTypeKeys } from '$lib/i18n/domainLabels';
	import { formatPlural, formatTemplate, translate } from '$lib/i18n/translate';
	import type {
		DocumentViewerPayload,
		ObjectViewer,
		ObjectViewerDocumentPage
	} from '$lib/services/objects';

	let {
		objectId,
		title,
		viewer,
		onRequest
	} = $props<{
		objectId: string;
		title: string;
		viewer: ObjectViewer | null;
		onRequest?: () => void;
	}>();

	const artifactViewHref = (artifactId: string): string =>
		`/objects/${encodeURIComponent(objectId)}/artifacts/${encodeURIComponent(artifactId)}/view`;

	const usableArtifactId = (value: string | null | undefined): string | null => {
		const trimmed = (value ?? '').trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const localizeMediaType = (mediaType: ObjectViewer['mediaType']): string =>
		t(mediaTypeKeys[mediaType]);
	const mediaTypeLabel = $derived(viewer ? localizeMediaType(viewer.mediaType) : '');
	const documentMediaLabel = $derived(t('objects.detail.viewer.documentScans'));
	const audioMediaLabel = $derived(t('objects.detail.viewer.audioFile'));
	const videoMediaLabel = $derived(t('objects.detail.viewer.videoFile'));

	const documentPayload = $derived(
		viewer?.viewerPayload.kind === 'document' ? viewer.viewerPayload : null
	);
	const imagePayload = $derived(
		viewer?.viewerPayload.kind === 'image' ? viewer.viewerPayload : null
	);
	const audioPayload = $derived(
		viewer?.viewerPayload.kind === 'audio' ? viewer.viewerPayload : null
	);
	const videoPayload = $derived(
		viewer?.viewerPayload.kind === 'video' ? viewer.viewerPayload : null
	);

	const documentArtifactId = $derived(usableArtifactId(documentPayload?.artifactId));
	const imageArtifactId = $derived(usableArtifactId(imagePayload?.artifactId));
	const audioArtifactId = $derived(usableArtifactId(audioPayload?.artifactId));
	const videoArtifactId = $derived(usableArtifactId(videoPayload?.artifactId));
	const posterArtifactId = $derived(usableArtifactId(videoPayload?.posterArtifactId));

	let documentZoom = $state(1);
	let showDocumentOcr = $state(false);
	let currentDocumentPage = $state(1);
	let documentScrollContainer = $state<HTMLDivElement | null>(null);

	let imageZoom = $state(1);
	let imageOffsetX = $state(0);
	let imageOffsetY = $state(0);
	let imageDragging = $state(false);
	let imagePointerStartX = 0;
	let imagePointerStartY = 0;
	let imageOriginOffsetX = 0;
	let imageOriginOffsetY = 0;

	const clampDocumentZoom = (value: number): number => Math.min(1.6, Math.max(0.75, value));
	const clampImageZoom = (value: number): number => Math.min(2.5, Math.max(1, value));

	const updateDocumentPage = (): void => {
		if (!documentScrollContainer) return;
		const pageNodes = Array.from(documentScrollContainer.querySelectorAll<HTMLElement>('[data-page-index]'));
		if (pageNodes.length === 0) return;

		let candidate = 1;
		for (const node of pageNodes) {
			const index = Number(node.dataset.pageIndex ?? '1');
			if (node.offsetTop - documentScrollContainer.scrollTop <= 240) {
				candidate = index;
			}
		}
		currentDocumentPage = candidate;
	};

	const onImagePointerDown = (event: PointerEvent): void => {
		if (imageZoom <= 1.02) return;
		imageDragging = true;
		imagePointerStartX = event.clientX;
		imagePointerStartY = event.clientY;
		imageOriginOffsetX = imageOffsetX;
		imageOriginOffsetY = imageOffsetY;
	};

	const onImagePointerMove = (event: PointerEvent): void => {
		if (!imageDragging) return;
		imageOffsetX = imageOriginOffsetX + (event.clientX - imagePointerStartX);
		imageOffsetY = imageOriginOffsetY + (event.clientY - imagePointerStartY);
	};

	const stopImageDragging = (): void => {
		imageDragging = false;
	};

	$effect(() => {
		if (imageZoom <= 1.02) {
			imageOffsetX = 0;
			imageOffsetY = 0;
		}
	});

	type RenderedDocumentPage = {
		id: string;
		pageNumber: number;
		label: string;
		imageUrl: string | null;
		ocrUrl: string | null;
		ocrArtifactId: string | null;
	};

	const documentPages: RenderedDocumentPage[] = $derived.by(() => {
		const payload: DocumentViewerPayload | null = documentPayload;
		if (!payload?.pages) return [];

		return payload.pages
			.map((page: ObjectViewerDocumentPage) => {
				const imageId = usableArtifactId(page.imageArtifactId);
				const ocrId = usableArtifactId(page.ocrTextArtifactId);
				return {
					id: `${objectId}-page-${page.pageNumber}`,
					pageNumber: page.pageNumber,
					label: page.label?.trim() || formatTemplate(t('objects.detail.viewer.pageLabel'), { number: page.pageNumber }),
					imageUrl: imageId ? artifactViewHref(imageId) : null,
					ocrUrl: ocrId ? artifactViewHref(ocrId) : null,
					ocrArtifactId: ocrId
				};
			})
			.filter(
				(page: RenderedDocumentPage) =>
					page.imageUrl !== null || page.ocrUrl !== null
			);
	});

	const aggregateOcrHref = $derived.by(() => {
		const payloadId = usableArtifactId(documentPayload?.ocrTextArtifactId);
		const id = payloadId ?? usableArtifactId(viewer?.previewArtifacts.ocrText?.artifactId);
		return id ? artifactViewHref(id) : null;
	});

	const transcriptHref = $derived.by(() => {
		if (!viewer) return null;
		const payload = viewer.viewerPayload;
		const payloadId =
			payload.kind === 'audio' || payload.kind === 'video'
				? usableArtifactId(payload.transcriptArtifactId)
				: null;
		const id = payloadId ?? usableArtifactId(viewer.previewArtifacts.transcript?.artifactId);
		return id ? artifactViewHref(id) : null;
	});

	const captionsHref = $derived.by(() => {
		if (!viewer) return null;
		const payload = viewer.viewerPayload;
		const payloadId = payload.kind === 'video' ? usableArtifactId(payload.captionsArtifactId) : null;
		const id = payloadId ?? usableArtifactId(viewer.previewArtifacts.captions?.artifactId);
		return id ? artifactViewHref(id) : null;
	});

	const availability = $derived.by(() => {
		if (!viewer) return 'UNAVAILABLE' as const;
		if (viewer.primarySource.status === 'available') return 'AVAILABLE' as const;
		if (viewer.primarySource.status === 'request_pending') return 'RESTORING' as const;
		if (viewer.primarySource.status === 'request_required') return 'ARCHIVED' as const;
		return 'UNAVAILABLE' as const;
	});

	const isAvailable = $derived(availability === 'AVAILABLE');
	const totalDocumentPages = $derived(documentPages.length);
	const hasImagePageOcr = $derived(documentPages.some((page) => page.imageUrl && page.ocrUrl));
	const showDocumentOcrToggle = $derived(Boolean(aggregateOcrHref) || hasImagePageOcr);
	const hasDocumentVisual = $derived(documentPages.length > 0 || Boolean(documentArtifactId));
	const showDocumentEmptyState = $derived(
		isAvailable &&
			documentPages.length === 0 &&
			!documentArtifactId &&
			!(showDocumentOcr && aggregateOcrHref)
	);

	$effect(() => {
		if (currentDocumentPage > totalDocumentPages) {
			currentDocumentPage = totalDocumentPages > 0 ? totalDocumentPages : 1;
		}
	});

	const imageStageClass = $derived.by(() =>
		viewer?.primarySource.status === 'available'
			? 'bg-[radial-gradient(ellipse_at_center,#1a2a33_0%,#0e171c_65%)]'
			: 'bg-[#0a0f12]'
	);
</script>

<svelte:window onpointermove={onImagePointerMove} onpointerup={stopImageDragging} />

{#snippet mediaUnavailableCard(dark: boolean, label: string)}
	<div class={`rounded-2xl border px-6 py-6 text-center backdrop-blur ${dark ? 'border-white/10 bg-white/6' : 'border-blue-slate/12 bg-blue-slate/6'}`}>
		<p class={`text-sm font-medium ${dark ? 'text-pale-sky/80' : 'text-text-ink'}`}>{t('objects.detail.viewer.mediaUnavailable')}</p>
		<p class={`mt-1 text-xs ${dark ? 'text-pale-sky/40' : 'text-text-muted'}`}>{formatTemplate(t('objects.detail.viewer.mediaUnavailableBody'), { media: label })}</p>
	</div>
{/snippet}

{#if !viewer}
	<section class="min-h-[70vh] rounded-[2rem] bg-surface-white/70 p-8">
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.viewer.unavailable')}</p>
		<p class="mt-3 text-sm leading-relaxed text-text-muted">{t('objects.detail.viewer.unavailableBody')}</p>
	</section>

{:else if viewer.viewerPayload.kind === 'document'}
	<div class="relative min-h-[76vh] overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#f5f2eb_0%,#ece6d8_100%)]">
		<div class="flex shrink-0 items-center justify-between gap-3 border-b border-[#d7ccb4]/50 bg-[#faf7f0]/80 px-4 py-2 backdrop-blur sm:px-6">
			<div class="flex items-center gap-2">
				<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{t(mediaTypeKeys.document)}</p>
				<span class="h-3 w-px bg-blue-slate/20"></span>
				<p class="text-[10px] text-text-muted">{formatTemplate(formatPlural(dictionary, 'objects.detail.viewer.pages', viewer.viewerPayload.pageCount ?? totalDocumentPages, $locale), { count: formatCount(viewer.viewerPayload.pageCount ?? totalDocumentPages, $locale) })}</p>
				{#if !isAvailable}
					<span class="h-3 w-px bg-blue-slate/20"></span>
					<p class="text-[10px] text-burnt-peach">{t('objects.detail.viewer.previewQuality')}</p>
				{/if}
			</div>
			<div class="flex items-center gap-1.5">
				<button type="button" class="rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:cursor-not-allowed disabled:opacity-35" onclick={() => (documentZoom = clampDocumentZoom(documentZoom - 0.1))} disabled={!isAvailable || !hasDocumentVisual} aria-label={t('objects.detail.viewer.zoomOut')}>-</button>
				<span class="min-w-[3.5rem] rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-center text-[10px] uppercase tracking-[0.2em] text-text-ink">{Math.round(documentZoom * 100)}%</span>
				<button type="button" class="rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:cursor-not-allowed disabled:opacity-35" onclick={() => (documentZoom = clampDocumentZoom(documentZoom + 0.1))} disabled={!isAvailable || !hasDocumentVisual} aria-label={t('objects.detail.viewer.zoomIn')}>+</button>
				{#if showDocumentOcrToggle}
					<button type="button" class={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition ${showDocumentOcr ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`} onclick={() => (showDocumentOcr = !showDocumentOcr)}>{t('objects.detail.viewer.ocr')}</button>
				{/if}
			</div>
		</div>

		<div bind:this={documentScrollContainer} class="h-[calc(76vh-3.25rem)] overflow-y-auto overflow-x-hidden" onscroll={updateDocumentPage}>
			{#if !isAvailable}
				<div class="mx-auto max-w-xl px-4 pt-6">
					<MediaRequestBanner availability={availability} mediaLabel={documentMediaLabel} variant="light" onRequest={onRequest} />
				</div>
			{/if}

			{#if documentPages.length > 0}
				<div class="mx-auto px-4 py-6 sm:px-8" style={`max-width: ${Math.round(64 * (isAvailable ? documentZoom : 1))}rem;`}>
					{#each documentPages as page, index (page.id)}
						<article data-page-index={index + 1} class="mb-6">
							{#if page.imageUrl}
								<div class="overflow-hidden rounded-lg border border-[#d7ccb4]/60 bg-[#fbf8f1] shadow-[0_4px_20px_rgba(79,109,122,0.1)]">
									<img src={page.imageUrl} alt={`${title} ${page.label}`} loading="lazy" class={`block h-auto w-full select-none ${!isAvailable ? 'opacity-60' : ''}`} draggable="false" />
								</div>
							{/if}
							{#if page.ocrUrl && (!page.imageUrl || showDocumentOcr)}
								<div class="mt-2 overflow-hidden rounded-lg border border-blue-slate/10 bg-surface-white/90 px-4 py-3">
									<ArtifactTextPreview title={formatTemplate(t('objects.detail.viewer.ocrExcerpt'), { page: page.label })} url={page.ocrUrl} compact={true} emptyLabel={t('objects.detail.viewer.noOcrPreview')} />
								</div>
							{/if}
							<p class="mt-2 text-center text-xs text-text-muted/50">{page.label}</p>
						</article>
					{/each}
				</div>
			{:else if documentArtifactId}
				<iframe src={artifactViewHref(documentArtifactId)} title={title} class="h-full min-h-[32rem] w-full bg-white"></iframe>
			{:else if showDocumentEmptyState}
				<div class="mx-auto max-w-xl px-4 py-10">
					{@render mediaUnavailableCard(false, documentMediaLabel)}
				</div>
			{/if}

			{#if showDocumentOcr && aggregateOcrHref}
				<div class="mx-auto max-w-4xl px-4 py-6 sm:px-8">
					<ArtifactTextPreview title={t('objects.detail.viewer.aggregateOcr')} url={aggregateOcrHref} emptyLabel={t('objects.detail.viewer.noOcrPreview')} />
				</div>
			{/if}
		</div>

		{#if documentPages.length > 0}
			<div class="absolute bottom-4 right-4 z-10 rounded-full border border-border-soft bg-surface-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate shadow-sm backdrop-blur">
				{currentDocumentPage} / {totalDocumentPages}
			</div>
		{/if}
	</div>

{:else if viewer.viewerPayload.kind === 'image'}
	<div class={`relative flex min-h-[76vh] items-center justify-center overflow-hidden rounded-[2rem] ${imageStageClass}`}>
		{#if imageArtifactId}
			<img
				src={artifactViewHref(imageArtifactId)}
				alt={title}
				class={`max-h-[92%] max-w-[92%] select-none object-contain transition-all duration-300 ${isAvailable && imageZoom > 1.02 ? 'cursor-grab active:cursor-grabbing' : ''} ${!isAvailable ? 'opacity-30 blur-[3px]' : ''}`}
				draggable="false"
				onpointerdown={onImagePointerDown}
				style={isAvailable ? `transform: translate(${imageOffsetX}px, ${imageOffsetY}px) scale(${imageZoom});` : ''}
			/>
		{/if}

		{#if !isAvailable}
			<div class="absolute inset-0 flex items-center justify-center p-8">
				<div class="w-full max-w-sm">
					<MediaRequestBanner availability={availability} mediaLabel={mediaTypeLabel} variant="dark" onRequest={onRequest} />
				</div>
			</div>
		{:else if imageArtifactId}
			<div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-black/50 to-transparent px-6 pb-5 pt-12">
				<p class="text-xs text-white/35">{imageZoom > 1.02 ? t('objects.detail.viewer.dragToPan') : t('objects.detail.viewer.zoomToInspect')}</p>
				<div class="flex items-center gap-1.5">
					<button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-sm text-pale-sky backdrop-blur transition hover:bg-white/15" onclick={() => (imageZoom = clampImageZoom(imageZoom - 0.3))} aria-label={t('objects.detail.viewer.zoomOut')}>-</button>
					<span class="min-w-[3rem] rounded-full border border-white/15 bg-white/8 px-2 py-1 text-center text-[10px] text-white/80 backdrop-blur">{Math.round(imageZoom * 100)}%</span>
					<button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-sm text-pale-sky backdrop-blur transition hover:bg-white/15" onclick={() => (imageZoom = clampImageZoom(imageZoom + 0.3))} aria-label={t('objects.detail.viewer.zoomIn')}>+</button>
					{#if imageZoom > 1.02}
						<button type="button" class="ml-1 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-pale-sky backdrop-blur transition hover:bg-white/15" onclick={() => { imageZoom = 1; imageOffsetX = 0; imageOffsetY = 0; }}>{t('objects.detail.viewer.reset')}</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="absolute inset-0 flex items-center justify-center p-8">
				<div class="w-full max-w-sm">
					{@render mediaUnavailableCard(true, mediaTypeLabel)}
				</div>
			</div>
		{/if}
	</div>
{:else if viewer.viewerPayload.kind === 'audio'}
	<div class="min-h-[76vh] overflow-hidden rounded-[2rem] bg-[#1f2f38]">
		<div class="flex h-full flex-col">
			<div class="shrink-0 px-6 pb-6 pt-8">
				<div class="mx-auto w-full max-w-3xl">
					{#if isAvailable}
						{#if audioArtifactId}
							<div class="rounded-[1.6rem] border border-white/6 bg-[#162228] px-5 py-5">
								<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/45">{t('objects.detail.viewer.listeningRoom')}</p>
								<audio controls class="mt-4 w-full" src={artifactViewHref(audioArtifactId)}></audio>
							</div>
						{:else}
							{@render mediaUnavailableCard(true, audioMediaLabel)}
						{/if}
					{:else}
						<MediaRequestBanner availability={availability} mediaLabel={audioMediaLabel} variant="dark" onRequest={onRequest} />
					{/if}
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto border-t border-white/8 bg-[#182730]">
				<div class="mx-auto max-w-3xl px-6 py-4">
					<div class="grid gap-4">
						{#if transcriptHref}
							<ArtifactTextPreview title={t('objects.detail.viewer.transcript')} url={transcriptHref} emptyLabel={t('objects.detail.viewer.transcriptEmpty')} />
						{/if}
						{#if captionsHref}
							<ArtifactTextPreview title={t('objects.detail.viewer.captions')} url={captionsHref} compact={true} emptyLabel={t('objects.detail.viewer.captionsEmpty')} />
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if viewer.viewerPayload.kind === 'video'}
	<div class="min-h-[76vh] overflow-hidden rounded-[2rem] bg-[#0a0f12]">
		<div class="flex h-full flex-col lg:flex-row">
			<div class="relative min-w-0 flex-1">
				{#if posterArtifactId}
					<img src={artifactViewHref(posterArtifactId)} alt={t('objects.detail.viewer.videoPreview')} class={`h-full w-full object-contain ${!isAvailable ? 'opacity-40' : ''}`} draggable="false" />
				{/if}
				<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

				{#if !isAvailable}
					<div class="absolute inset-0 flex items-center justify-center p-8">
						<div class="w-full max-w-sm">
							<MediaRequestBanner availability={availability} mediaLabel={videoMediaLabel} variant="dark" onRequest={onRequest} />
						</div>
					</div>
				{:else if videoArtifactId}
					<div class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-10">
						<div class="mx-auto max-w-4xl">
							<!-- svelte-ignore a11y_media_has_caption -->
							<video controls class="w-full rounded-[1.2rem] bg-black" poster={posterArtifactId ? artifactViewHref(posterArtifactId) : undefined} src={artifactViewHref(videoArtifactId)}></video>
						</div>
					</div>
				{:else}
					<div class="absolute inset-0 flex items-center justify-center p-8">
						<div class="w-full max-w-sm">
							{@render mediaUnavailableCard(true, videoMediaLabel)}
						</div>
					</div>
				{/if}
			</div>

			{#if transcriptHref || captionsHref || !isAvailable}
				<aside class="flex w-full shrink-0 flex-col border-t border-white/8 bg-[#0e181e] lg:w-80 lg:border-l lg:border-t-0">
					<div class="shrink-0 border-b border-white/6 px-4 py-3">
						<div class="flex items-center justify-between">
							<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/40">{t('objects.detail.viewer.sceneNotes')}</p>
							{#if !isAvailable}
								<span class="text-[9px] uppercase tracking-[0.15em] text-pale-sky/25">{t('objects.detail.viewer.previewAvailable')}</span>
							{/if}
						</div>
					</div>
					<div class="flex-1 overflow-y-auto px-3 py-3">
						<div class="grid gap-3">
							{#if transcriptHref}
								<ArtifactTextPreview title={t('objects.detail.viewer.transcript')} url={transcriptHref} compact={true} emptyLabel={t('objects.detail.viewer.transcriptEmpty')} />
							{/if}
							{#if captionsHref}
								<ArtifactTextPreview title={t('objects.detail.viewer.captions')} url={captionsHref} compact={true} emptyLabel={t('objects.detail.viewer.captionsEmpty')} />
							{/if}
						</div>
					</div>
				</aside>
			{/if}
		</div>
	</div>
{:else}
	<div class="min-h-[76vh] rounded-[2rem] bg-surface-white/70 p-8">
		<MediaRequestBanner availability={availability} mediaLabel={mediaTypeLabel} variant={viewer.mediaType === 'document' ? 'light' : 'dark'} onRequest={onRequest} />
	</div>
{/if}
