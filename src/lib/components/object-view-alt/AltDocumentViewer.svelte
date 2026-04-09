<script lang="ts">
	import type { ObjectViewDocumentPage } from '$lib/objectView/types';
	import AltMediaRequestBanner from './AltMediaRequestBanner.svelte';

	type Availability = 'AVAILABLE' | 'ARCHIVED' | 'RESTORE_PENDING' | 'RESTORING' | 'UNAVAILABLE';

	let {
		title,
		pages,
		hasOcr,
		availability = 'AVAILABLE',
		onRequestAccess
	} = $props<{
		title: string;
		pages: ObjectViewDocumentPage[];
		hasOcr: boolean;
		availability?: Availability;
		onRequestAccess?: () => void;
	}>();

	let zoom = $state(1);
	let showOcr = $state(false);
	let scrollContainer = $state<HTMLDivElement | null>(null);
	let currentPage = $state(1);
	let controlsVisible = $state(true);
	let fadeTimer = 0;

	const isAvailable = $derived(availability === 'AVAILABLE');
	const totalPages = $derived(pages.length);
	const zoomLabel = $derived(`${Math.round(zoom * 100)}%`);

	const clampZoom = (value: number): number => Math.min(1.6, Math.max(0.7, value));

	const resetFadeTimer = (): void => {
		controlsVisible = true;
		window.clearTimeout(fadeTimer);
		fadeTimer = window.setTimeout(() => { controlsVisible = false; }, 3000);
	};

	const updateCurrentPage = (): void => {
		if (!scrollContainer) return;
		const pageNodes = Array.from(scrollContainer.querySelectorAll<HTMLElement>('[data-page-index]'));
		if (pageNodes.length === 0) return;

		let candidate = 1;
		for (const node of pageNodes) {
			const index = Number(node.dataset.pageIndex ?? '1');
			if (node.offsetTop - scrollContainer.scrollTop <= 240) {
				candidate = index;
			}
		}
		currentPage = candidate;
	};
</script>

<div
	class="absolute inset-0 flex flex-col bg-[linear-gradient(180deg,#f5f2eb_0%,#ece6d8_100%)]"
	onpointermove={resetFadeTimer}
	role="presentation"
>
	<!-- Toolbar -->
	<div class="flex shrink-0 items-center justify-between gap-3 border-b border-[#d7ccb4]/50 bg-[#faf7f0]/80 px-4 py-2 backdrop-blur sm:px-6">
		<div class="flex items-center gap-2">
			<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Document</p>
			<span class="h-3 w-px bg-blue-slate/20"></span>
			<p class="text-[10px] text-text-muted">{totalPages} pages</p>
			{#if !isAvailable}
				<span class="h-3 w-px bg-blue-slate/20"></span>
				<p class="text-[10px] text-burnt-peach">Preview quality</p>
			{/if}
		</div>
		<div class="flex items-center gap-1.5">
			<button
				type="button"
				class="rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:opacity-35 disabled:cursor-not-allowed"
				onclick={() => (zoom = clampZoom(zoom - 0.1))}
				disabled={!isAvailable}
			>-</button>
			<span class="min-w-[3.5rem] rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-center text-[10px] uppercase tracking-[0.2em] text-text-ink">{zoomLabel}</span>
			<button
				type="button"
				class="rounded-full border border-border-soft bg-surface-white px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20 disabled:opacity-35 disabled:cursor-not-allowed"
				onclick={() => (zoom = clampZoom(zoom + 0.1))}
				disabled={!isAvailable}
			>+</button>
			<span class="mx-1 h-4 w-px bg-border-soft"></span>
			<button
				type="button"
				class="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition {showOcr
					? 'border-blue-slate bg-blue-slate text-surface-white'
					: 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'} {!hasOcr ? 'cursor-not-allowed opacity-40' : ''}"
				disabled={!hasOcr}
				onclick={() => (showOcr = !showOcr)}
			>OCR</button>
		</div>
	</div>

	<!-- Scrollable pages -->
	<div
		bind:this={scrollContainer}
		class="flex-1 overflow-y-auto overflow-x-hidden"
		onscroll={updateCurrentPage}
	>
		<!-- Request banner when not available -->
		{#if !isAvailable}
			<div class="mx-auto max-w-xl px-4 pt-6">
				<AltMediaRequestBanner
					{availability}
					mediaLabel="document scans"
					variant="light"
					onRequest={onRequestAccess ?? (() => {})}
				/>
			</div>
		{/if}

		<div class="mx-auto px-4 py-6 sm:px-8" style="max-width: {Math.round(64 * (isAvailable ? zoom : 1))}rem;">
			{#each pages as page, index (page.id)}
				<article
					data-page-index={index + 1}
					class="relative mb-6"
				>
					<div class="relative overflow-hidden rounded-lg border border-[#d7ccb4]/60 bg-[#fbf8f1] shadow-[0_4px_20px_rgba(79,109,122,0.1)]">
						<img
							src={page.imageUrl}
							alt="{title} {page.label}"
							loading="lazy"
							class="block h-auto w-full select-none {!isAvailable ? 'opacity-60' : ''}"
							draggable="false"
						/>
						{#if !isAvailable}
							<div class="absolute right-3 top-3 rounded-full border border-burnt-peach/25 bg-pearl-beige/80 px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] text-burnt-peach">
								Preview
							</div>
						{/if}
					</div>
					{#if showOcr}
						<div class="mt-2 rounded-lg border border-blue-slate/10 bg-surface-white/90 px-4 py-3">
							<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">OCR excerpt — {page.label}</p>
							<p class="mt-1.5 select-text text-sm leading-relaxed text-text-ink">{page.ocrText}</p>
						</div>
					{/if}
					<p class="mt-2 text-center text-xs text-text-muted/50">{page.label}</p>
				</article>
			{/each}
		</div>
	</div>

	<!-- Floating page indicator -->
	<div
		class="absolute bottom-4 right-4 z-10 rounded-full border border-border-soft bg-surface-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate shadow-sm backdrop-blur transition-opacity duration-400 {controlsVisible ? 'opacity-100' : 'opacity-0'}"
	>
		{currentPage} / {totalPages}
	</div>
</div>
