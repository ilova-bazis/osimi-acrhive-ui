<script lang="ts">
	let {
		imageUrl,
		imageAlt,
		hasZoom
	} = $props<{
		imageUrl: string;
		imageAlt: string;
		hasZoom: boolean;
	}>();

	let zoom = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let dragging = $state(false);
	let pointerStartX = 0;
	let pointerStartY = 0;
	let originOffsetX = 0;
	let originOffsetY = 0;

	const clampZoom = (value: number): number => Math.min(2.2, Math.max(1, value));

	const onPointerDown = (event: PointerEvent): void => {
		if (zoom <= 1.02) return;
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

	$effect(() => {
		if (zoom <= 1.02) {
			offsetX = 0;
			offsetY = 0;
		}
	});
</script>

<svelte:window onpointermove={onPointerMove} onpointerup={stopDragging} />

<section class="relative overflow-hidden rounded-[2rem] border border-blue-slate/20 bg-[#111b20] shadow-[0_28px_80px_rgba(17,27,32,0.35)]">
	<div class="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/12 bg-[#122027]/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-pale-sky backdrop-blur">
		<span>Image viewer</span>
		<span class="text-pale-sky/60">Read-only</span>
	</div>

	<div class="absolute right-4 top-4 z-10 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
		<button type="button" class="rounded-full border border-white/12 bg-[#122027]/80 px-3 py-2 text-pale-sky transition hover:bg-[#1a2b33] disabled:opacity-50" disabled={!hasZoom} onclick={() => (zoom = clampZoom(zoom - 0.2))}>Zoom out</button>
		<span class="rounded-full border border-white/12 bg-[#122027]/80 px-3 py-2 text-white">{Math.round(zoom * 100)}%</span>
		<button type="button" class="rounded-full border border-white/12 bg-[#122027]/80 px-3 py-2 text-pale-sky transition hover:bg-[#1a2b33] disabled:opacity-50" disabled={!hasZoom} onclick={() => (zoom = clampZoom(zoom + 0.2))}>Zoom in</button>
		<button type="button" class="rounded-full border border-white/12 bg-[#122027]/80 px-3 py-2 text-pale-sky transition hover:bg-[#1a2b33]" onclick={() => { zoom = 1; offsetX = 0; offsetY = 0; }}>Reset</button>
	</div>

	<div class="flex min-h-[70vh] items-center justify-center bg-[radial-gradient(circle_at_top,#2b4650_0%,#111b20_55%,#0b1418_100%)] p-6 sm:p-10">
		<div class="relative w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0f1a1e] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-6">
			<div class="absolute inset-x-6 bottom-4 z-10 flex items-center justify-between rounded-full border border-white/10 bg-[#122027]/72 px-4 py-2 text-xs text-pale-sky backdrop-blur">
				<span>{zoom > 1 ? 'Drag to pan the image' : 'Zoom in for closer inspection'}</span>
				<span>Annotations disabled</span>
			</div>
			<div class="flex min-h-[58vh] items-center justify-center overflow-hidden rounded-[1.2rem] bg-[#0a1318]">
				<img
					src={imageUrl}
					alt={imageAlt}
					class={`max-h-[72vh] w-auto max-w-full select-none object-contain transition-transform duration-150 ${zoom > 1.02 ? 'cursor-grab active:cursor-grabbing' : ''}`}
					draggable="false"
					onpointerdown={onPointerDown}
					style={`transform: translate(${offsetX}px, ${offsetY}px) scale(${zoom});`}
				/>
			</div>
		</div>
	</div>
</section>
