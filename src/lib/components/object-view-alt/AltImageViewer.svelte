<script lang="ts">
	import AltMediaRequestBanner from './AltMediaRequestBanner.svelte';

	type Availability = 'AVAILABLE' | 'ARCHIVED' | 'RESTORE_PENDING' | 'RESTORING' | 'UNAVAILABLE';

	let {
		imageUrl,
		imageAlt,
		hasZoom,
		availability = 'AVAILABLE',
		onRequestAccess
	} = $props<{
		imageUrl: string;
		imageAlt: string;
		hasZoom: boolean;
		availability?: Availability;
		onRequestAccess?: () => void;
	}>();

	let zoom = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let dragging = $state(false);
	let controlsVisible = $state(true);
	let pointerStartX = 0;
	let pointerStartY = 0;
	let originOffsetX = 0;
	let originOffsetY = 0;
	let fadeTimer = 0;

	const isAvailable = $derived(availability === 'AVAILABLE');
	const clampZoom = (value: number): number => Math.min(2.5, Math.max(1, value));
	const isPanned = $derived(zoom > 1.02);

	const resetFadeTimer = (): void => {
		controlsVisible = true;
		window.clearTimeout(fadeTimer);
		fadeTimer = window.setTimeout(() => { controlsVisible = false; }, 2500);
	};

	const onPointerDown = (event: PointerEvent): void => {
		if (!isAvailable || !isPanned) return;
		dragging = true;
		pointerStartX = event.clientX;
		pointerStartY = event.clientY;
		originOffsetX = offsetX;
		originOffsetY = offsetY;
	};

	const onPointerMove = (event: PointerEvent): void => {
		if (!dragging) return;
		offsetX = originOffsetX + (event.clientX - pointerStartX);
		offsetY = originOffsetY + (event.clientY - pointerStartY);
	};

	const stopDragging = (): void => {
		dragging = false;
	};

	const resetView = (): void => {
		zoom = 1;
		offsetX = 0;
		offsetY = 0;
	};

	$effect(() => {
		if (zoom <= 1.02) {
			offsetX = 0;
			offsetY = 0;
		}
	});
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={stopDragging} />

<div
	class="absolute inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#1a2a33_0%,#0e171c_65%)]"
	onpointermove={resetFadeTimer}
	role="presentation"
>
	<!-- Image (dimmed + blurred when not available) -->
	<img
		src={imageUrl}
		alt={imageAlt}
		class="max-h-[92%] max-w-[92%] select-none object-contain transition-all duration-300 {isAvailable && isPanned ? 'cursor-grab active:cursor-grabbing' : ''} {!isAvailable ? 'opacity-30 blur-[3px]' : ''}"
		draggable="false"
		onpointerdown={onPointerDown}
		style={isAvailable ? `transform: translate(${offsetX}px, ${offsetY}px) scale(${zoom});` : ''}
	/>

	{#if !isAvailable}
		<!-- Request banner centered over image -->
		<div class="absolute inset-0 flex items-center justify-center p-8">
			<div class="w-full max-w-sm">
				<AltMediaRequestBanner
					{availability}
					mediaLabel="image"
					variant="dark"
					onRequest={onRequestAccess ?? (() => {})}
				/>
			</div>
		</div>
	{:else}
		<!-- Bottom controls bar (only when available) -->
		<div
			class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-black/50 to-transparent px-6 pb-5 pt-12 transition-opacity duration-400 {controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}"
		>
			<p class="text-xs text-white/35">
				{isPanned ? 'Drag to pan' : 'Zoom to inspect'}
			</p>

			<div class="flex items-center gap-1.5">
				<button
					type="button"
					class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-sm text-pale-sky backdrop-blur transition hover:bg-white/15 disabled:opacity-30"
					disabled={!hasZoom}
					onclick={() => (zoom = clampZoom(zoom - 0.3))}
					aria-label="Zoom out"
				>&minus;</button>
				<span class="min-w-[3rem] rounded-full border border-white/15 bg-white/8 px-2 py-1 text-center text-[10px] text-white/80 backdrop-blur">{Math.round(zoom * 100)}%</span>
				<button
					type="button"
					class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-sm text-pale-sky backdrop-blur transition hover:bg-white/15 disabled:opacity-30"
					disabled={!hasZoom}
					onclick={() => (zoom = clampZoom(zoom + 0.3))}
					aria-label="Zoom in"
				>+</button>
				{#if isPanned}
					<button
						type="button"
						class="ml-1 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-pale-sky backdrop-blur transition hover:bg-white/15"
						onclick={resetView}
					>Reset</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
