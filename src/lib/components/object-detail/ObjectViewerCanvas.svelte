<script lang="ts">
	import AltMediaRequestBanner from '$lib/components/object-view-alt/AltMediaRequestBanner.svelte';
	import ArtifactTextPreview from '$lib/components/object-detail/ArtifactTextPreview.svelte';

	type ObjectViewerArtifactRef = {
		available: true;
		artifactId: string;
		contentType: string | null;
		displayName: string | null;
		metadata: Record<string, unknown>;
	};

	type ObjectViewerDocumentPage = {
		pageNumber: number;
		label: string | null;
		imageArtifactId: string | null;
		ocrTextArtifactId: string | null;
	};

	type ObjectViewer = {
		mediaType: 'document' | 'image' | 'audio' | 'video';
		primarySource: {
			sourceType: 'original' | 'access_copy' | 'stream' | 'preview' | 'other';
			status: 'available' | 'request_required' | 'request_pending' | 'restricted' | 'temporarily_unavailable';
			accessReasonCode: 'OK' | 'FORBIDDEN_POLICY' | 'EMBARGO_ACTIVE' | 'RESTORE_REQUIRED' | 'RESTORE_IN_PROGRESS' | 'TEMP_UNAVAILABLE';
			displayName: string | null;
			contentType: string | null;
			sizeBytes: number | null;
		};
		activeRequest: {
			id: string;
			status: 'PENDING' | 'PROCESSING';
			createdAt: string;
		} | null;
		previewArtifacts: {
			thumbnail: ObjectViewerArtifactRef | null;
			poster: ObjectViewerArtifactRef | null;
			ocrText: ObjectViewerArtifactRef | null;
			transcript: ObjectViewerArtifactRef | null;
			captions: ObjectViewerArtifactRef | null;
		};
		viewerPayload:
			| {
					kind: 'document';
					artifactId: string | null;
					contentType: string | null;
					ocrTextArtifactId: string | null;
					pageCount: number | null;
					pages?: ObjectViewerDocumentPage[];
				}
			| {
					kind: 'image';
					artifactId: string | null;
					contentType: string | null;
					width: number | null;
					height: number | null;
				}
			| {
					kind: 'audio';
					artifactId: string | null;
					contentType: string | null;
					transcriptArtifactId: string | null;
					durationSeconds: number | null;
				}
			| {
					kind: 'video';
					artifactId: string | null;
					contentType: string | null;
					posterArtifactId: string | null;
					transcriptArtifactId: string | null;
					captionsArtifactId: string | null;
					durationSeconds: number | null;
				};
	};

	let {
		objectId,
		title,
		viewer,
		onRequest
	} = $props<{
		objectId: string;
		title: string;
		viewer: ObjectViewer | null;
		onRequest: () => void;
	}>();

	const artifactViewHref = (artifactId: string): string =>
		`/objects/${encodeURIComponent(objectId)}/artifacts/${encodeURIComponent(artifactId)}/view`;

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

	const documentPages = $derived.by(() => {
		if (!viewer || viewer.viewerPayload.kind !== 'document' || !viewer.viewerPayload.pages) return [];

		return viewer.viewerPayload.pages
			.filter((page: ObjectViewerDocumentPage) => page.imageArtifactId)
			.map((page: ObjectViewerDocumentPage) => ({
				id: `${objectId}-page-${page.pageNumber}`,
				label: page.label ?? `Page ${page.pageNumber}`,
				imageUrl: artifactViewHref(page.imageArtifactId as string),
				ocrText: ''
			}));
	});

	const transcriptHref = $derived.by(() => {
		if (!viewer?.previewArtifacts.transcript) return null;
		return artifactViewHref(viewer.previewArtifacts.transcript.artifactId);
	});

	const ocrHref = $derived.by(() => {
		if (!viewer?.previewArtifacts.ocrText) return null;
		return artifactViewHref(viewer.previewArtifacts.ocrText.artifactId);
	});

	const captionsHref = $derived.by(() => {
		if (!viewer?.previewArtifacts.captions) return null;
		return artifactViewHref(viewer.previewArtifacts.captions.artifactId);
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
	const imageStageClass = $derived.by(() =>
		viewer?.primarySource.status === 'available'
			? 'bg-[radial-gradient(ellipse_at_center,#1a2a33_0%,#0e171c_65%)]'
			: 'bg-[#0a0f12]'
	);
</script>

<svelte:window onpointermove={onImagePointerMove} onpointerup={stopImageDragging} />

{#if !viewer}
	<section class="min-h-[70vh] rounded-[2rem] bg-surface-white/70 p-8">
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Viewer unavailable</p>
		<p class="mt-3 text-sm leading-relaxed text-text-muted">This object does not yet expose a media viewer contract.</p>
	</section>

{:else if viewer.viewerPayload.kind === 'document'}
	<div class="relative min-h-[76vh] overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#f5f2eb_0%,#ece6d8_100%)]">
		<div class="flex shrink-0 items-center justify-between gap-3 border-b border-[#d7ccb4]/50 bg-[#faf7f0]/80 px-4 py-2 backdrop-blur sm:px-6">
			<div class="flex items-center gap-2">
				<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Document</p>
				<span class="h-3 w-px bg-blue-slate/20"></span>
				<p class="text-[10px] text-text-muted">{viewer.viewerPayload.pageCount ?? totalDocumentPages} pages</p>
				{#if !isAvailable}
					<span class="h-3 w-px bg-blue-slate/20"></span>
					<p class="text-[10px] text-burnt-peach">Preview quality</p>
				{/if}
			</div>
			<div class="flex items-center gap-1.5">
				<button type="button" class="rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:cursor-not-allowed disabled:opacity-35" onclick={() => (documentZoom = clampDocumentZoom(documentZoom - 0.1))} disabled={!isAvailable}>-</button>
				<span class="min-w-[3.5rem] rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-center text-[10px] uppercase tracking-[0.2em] text-text-ink">{Math.round(documentZoom * 100)}%</span>
				<button type="button" class="rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:cursor-not-allowed disabled:opacity-35" onclick={() => (documentZoom = clampDocumentZoom(documentZoom + 0.1))} disabled={!isAvailable}>+</button>
				{#if ocrHref}
					<button type="button" class={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition ${showDocumentOcr ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`} onclick={() => (showDocumentOcr = !showDocumentOcr)}>OCR</button>
				{/if}
			</div>
		</div>

		<div bind:this={documentScrollContainer} class="h-[calc(76vh-3.25rem)] overflow-y-auto overflow-x-hidden" onscroll={updateDocumentPage}>
			{#if !isAvailable}
				<div class="mx-auto max-w-xl px-4 pt-6">
					<AltMediaRequestBanner availability={availability} mediaLabel="document scans" variant="light" onRequest={onRequest} />
				</div>
			{/if}

			{#if documentPages.length > 0}
				<div class="mx-auto px-4 py-6 sm:px-8" style={`max-width: ${Math.round(64 * (isAvailable ? documentZoom : 1))}rem;`}>
					{#each documentPages as page, index (page.id)}
						<article data-page-index={index + 1} class="mb-6">
							<div class="overflow-hidden rounded-lg border border-[#d7ccb4]/60 bg-[#fbf8f1] shadow-[0_4px_20px_rgba(79,109,122,0.1)]">
								<img src={page.imageUrl} alt={`${title} ${page.label}`} loading="lazy" class={`block h-auto w-full select-none ${!isAvailable ? 'opacity-60' : ''}`} draggable="false" />
							</div>
							{#if showDocumentOcr && ocrHref}
								<div class="mt-2 overflow-hidden rounded-lg border border-blue-slate/10 bg-surface-white/90 px-4 py-3">
									<ArtifactTextPreview title={`OCR excerpt - ${page.label}`} url={ocrHref} compact={true} emptyLabel="No OCR preview is available." />
								</div>
							{/if}
							<p class="mt-2 text-center text-xs text-text-muted/50">{page.label}</p>
						</article>
					{/each}
				</div>
			{:else if viewer.viewerPayload.artifactId}
				<iframe src={artifactViewHref(viewer.viewerPayload.artifactId)} title={title} class="h-full min-h-[32rem] w-full bg-white"></iframe>
			{/if}
		</div>

		<div class="absolute bottom-4 right-4 z-10 rounded-full border border-border-soft bg-surface-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate shadow-sm backdrop-blur">
			{currentDocumentPage} / {Math.max(totalDocumentPages, viewer.viewerPayload.pageCount ?? 1)}
		</div>
	</div>

{:else if viewer.viewerPayload.kind === 'image'}
	<div class={`relative flex min-h-[76vh] items-center justify-center overflow-hidden rounded-[2rem] ${imageStageClass}`}>
		{#if viewer.viewerPayload.artifactId}
			<img
				src={artifactViewHref(viewer.viewerPayload.artifactId)}
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
					<AltMediaRequestBanner availability={availability} mediaLabel="image" variant="dark" onRequest={onRequest} />
				</div>
			</div>
		{:else}
			<div class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-black/50 to-transparent px-6 pb-5 pt-12">
				<p class="text-xs text-white/35">{imageZoom > 1.02 ? 'Drag to pan' : 'Zoom to inspect'}</p>
				<div class="flex items-center gap-1.5">
					<button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-sm text-pale-sky backdrop-blur transition hover:bg-white/15" onclick={() => (imageZoom = clampImageZoom(imageZoom - 0.3))} aria-label="Zoom out">-</button>
					<span class="min-w-[3rem] rounded-full border border-white/15 bg-white/8 px-2 py-1 text-center text-[10px] text-white/80 backdrop-blur">{Math.round(imageZoom * 100)}%</span>
					<button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-sm text-pale-sky backdrop-blur transition hover:bg-white/15" onclick={() => (imageZoom = clampImageZoom(imageZoom + 0.3))} aria-label="Zoom in">+</button>
					{#if imageZoom > 1.02}
						<button type="button" class="ml-1 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-pale-sky backdrop-blur transition hover:bg-white/15" onclick={() => { imageZoom = 1; imageOffsetX = 0; imageOffsetY = 0; }}>Reset</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{:else if viewer.viewerPayload.kind === 'audio' && viewer.viewerPayload.artifactId}
	<div class="min-h-[76vh] overflow-hidden rounded-[2rem] bg-[#1f2f38]">
		<div class="flex h-full flex-col">
			<div class="shrink-0 px-6 pb-6 pt-8">
				<div class="mx-auto w-full max-w-3xl">
					{#if isAvailable}
						<div class="rounded-[1.6rem] border border-white/6 bg-[#162228] px-5 py-5">
							<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/45">Listening room</p>
							<audio controls class="mt-4 w-full" src={artifactViewHref(viewer.viewerPayload.artifactId)}>
								<track kind="captions" />
							</audio>
						</div>
					{:else}
						<AltMediaRequestBanner availability={availability} mediaLabel="audio file" variant="dark" onRequest={onRequest} />
					{/if}
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto border-t border-white/8 bg-[#182730]">
				<div class="mx-auto max-w-3xl px-6 py-4">
					<div class="grid gap-4">
						{#if transcriptHref}
							<ArtifactTextPreview title="Transcript" url={transcriptHref} emptyLabel="Transcript is not available." />
						{/if}
						{#if captionsHref}
							<ArtifactTextPreview title="Captions" url={captionsHref} compact={true} emptyLabel="Captions are not available." />
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if viewer.viewerPayload.kind === 'video' && viewer.viewerPayload.artifactId}
	<div class="min-h-[76vh] overflow-hidden rounded-[2rem] bg-[#0a0f12]">
		<div class="flex h-full flex-col lg:flex-row">
			<div class="relative min-w-0 flex-1">
				{#if viewer.viewerPayload.posterArtifactId}
					<img src={artifactViewHref(viewer.viewerPayload.posterArtifactId)} alt="Video preview" class={`h-full w-full object-contain ${!isAvailable ? 'opacity-40' : ''}`} draggable="false" />
				{/if}
				<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

				{#if !isAvailable}
					<div class="absolute inset-0 flex items-center justify-center p-8">
						<div class="w-full max-w-sm">
							<AltMediaRequestBanner availability={availability} mediaLabel="video file" variant="dark" onRequest={onRequest} />
						</div>
					</div>
				{:else}
					<div class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-10">
						<div class="mx-auto max-w-4xl">
							<video controls class="w-full rounded-[1.2rem] bg-black" poster={viewer.viewerPayload.posterArtifactId ? artifactViewHref(viewer.viewerPayload.posterArtifactId) : undefined} src={artifactViewHref(viewer.viewerPayload.artifactId)}>
								<track kind="captions" />
							</video>
						</div>
					</div>
				{/if}
			</div>

			{#if transcriptHref || captionsHref || !isAvailable}
				<aside class="flex w-full shrink-0 flex-col border-t border-white/8 bg-[#0e181e] lg:w-80 lg:border-l lg:border-t-0">
					<div class="shrink-0 border-b border-white/6 px-4 py-3">
						<div class="flex items-center justify-between">
							<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/40">Scene notes</p>
							{#if !isAvailable}
								<span class="text-[9px] uppercase tracking-[0.15em] text-pale-sky/25">Preview available</span>
							{/if}
						</div>
					</div>
					<div class="flex-1 overflow-y-auto px-3 py-3">
						<div class="grid gap-3">
							{#if transcriptHref}
								<ArtifactTextPreview title="Transcript" url={transcriptHref} compact={true} emptyLabel="Transcript is not available." />
							{/if}
							{#if captionsHref}
								<ArtifactTextPreview title="Captions" url={captionsHref} compact={true} emptyLabel="Captions are not available." />
							{/if}
						</div>
					</div>
				</aside>
			{/if}
		</div>
	</div>
{:else}
	<div class="min-h-[76vh] rounded-[2rem] bg-surface-white/70 p-8">
		<AltMediaRequestBanner availability={availability} mediaLabel={viewer.mediaType} variant={viewer.mediaType === 'document' ? 'light' : 'dark'} onRequest={onRequest} />
	</div>
{/if}
