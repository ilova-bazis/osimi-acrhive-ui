<script lang="ts">
	import type { ObjectViewDocumentPage } from '$lib/objectView/types';

	let {
		title,
		pages,
		hasOcr
	} = $props<{
		title: string;
		pages: ObjectViewDocumentPage[];
		hasOcr: boolean;
	}>();

	let zoom = $state(1);
	let showOcr = $state(false);
	let scrollContainer = $state<HTMLDivElement | null>(null);
	let currentPage = $state(1);

	const totalPages = $derived(pages.length);
	const zoomLabel = $derived(`${Math.round(zoom * 100)}%`);

	const clampZoom = (value: number): number => Math.min(1.8, Math.max(0.8, value));

	const updateCurrentPage = (): void => {
		if (!scrollContainer) return;
		const pageNodes = Array.from(scrollContainer.querySelectorAll<HTMLElement>('[data-page-index]'));
		if (pageNodes.length === 0) return;

		let candidate = 1;
		for (const node of pageNodes) {
			const index = Number(node.dataset.pageIndex ?? '1');
			if (node.offsetTop - scrollContainer.scrollTop <= 220) {
				candidate = index;
			}
		}
		currentPage = candidate;
	};

	const formatPageLabel = (index: number): string => `Page ${index} / ${totalPages}`;
</script>

<section class="relative overflow-hidden rounded-[2rem] border border-border-soft bg-[#f2ecde] shadow-[0_24px_70px_rgba(31,47,56,0.12)]">
	<div class="flex items-center justify-between gap-3 border-b border-border-soft bg-surface-white/80 px-4 py-3 backdrop-blur sm:px-6">
		<div>
			<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Document viewer</p>
			<p class="mt-1 text-sm text-text-muted">Continuous reading surface for scanned pages. Read-only by design.</p>
		</div>
		<div class="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate">
			<button type="button" class="rounded-full border border-border-soft bg-surface-white px-3 py-2 transition hover:bg-pale-sky/20" onclick={() => (zoom = clampZoom(zoom - 0.1))}>Zoom out</button>
			<span class="rounded-full border border-border-soft bg-surface-white px-3 py-2 text-text-ink">{zoomLabel}</span>
			<button type="button" class="rounded-full border border-border-soft bg-surface-white px-3 py-2 transition hover:bg-pale-sky/20" onclick={() => (zoom = clampZoom(zoom + 0.1))}>Zoom in</button>
			<button type="button" class={`rounded-full border px-3 py-2 transition ${showOcr ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'} ${!hasOcr ? 'cursor-not-allowed opacity-50' : ''}`} disabled={!hasOcr} onclick={() => (showOcr = !showOcr)}>
				OCR layer
			</button>
		</div>
	</div>

	<div class="relative h-[calc(100vh-13rem)] min-h-[44rem] overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff,transparent_32%),linear-gradient(180deg,#f5efe4_0%,#ede4d2_100%)]">
		<div class="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-border-soft bg-surface-white/90 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate shadow-sm">
			{formatPageLabel(currentPage)}
		</div>

		<div bind:this={scrollContainer} class="h-full overflow-y-auto px-4 py-6 sm:px-10" onscroll={updateCurrentPage}>
			<div class="mx-auto flex w-full max-w-5xl flex-col items-center gap-6">
				{#each pages as page, index (page.id)}
					<article data-page-index={index + 1} class="relative w-full max-w-[54rem] rounded-[1.75rem] border border-[#d7ccb4] bg-[#fbf8f1] p-3 shadow-[0_22px_60px_rgba(79,109,122,0.16)] sm:p-5">
						<div class="overflow-hidden rounded-[1.2rem] border border-[#ddd0ba] bg-surface-white" style={`transform: scale(${zoom}); transform-origin: top center;`}>
							<img src={page.imageUrl} alt={`${title} ${page.label}`} loading="lazy" class="h-auto w-full select-none" draggable="false" />
							{#if showOcr}
								<div class="pointer-events-none absolute inset-x-10 bottom-10 rounded-2xl border border-blue-slate/15 bg-surface-white/88 px-4 py-3 text-sm leading-relaxed text-text-ink shadow-sm backdrop-blur sm:inset-x-16">
									<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">OCR excerpt</p>
									<p class="mt-2 select-text">{page.ocrText}</p>
								</div>
							{/if}
						</div>
						<div class="mt-3 flex items-center justify-between px-1 text-xs text-text-muted">
							<span>{page.label}</span>
							<span>{index + 1 === 1 ? 'Archival scan' : 'Read-only page'}</span>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>
