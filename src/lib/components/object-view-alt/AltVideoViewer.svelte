<script lang="ts">
	import type { ObjectViewSubtitleCue, ObjectViewTranscriptSegment } from '$lib/objectView/types';

	let {
		posterUrl,
		durationSeconds,
		subtitles,
		transcript
	} = $props<{
		posterUrl: string;
		durationSeconds: number;
		subtitles: ObjectViewSubtitleCue[];
		transcript: ObjectViewTranscriptSegment[];
	}>();

	let playing = $state(false);
	let captionsOn = $state(true);
	let showTranscript = $state(false);
	let currentTime = $state(18);
	let controlsVisible = $state(true);
	let fadeTimer = 0;
	let tickHandle = 0;

	const progress = $derived(currentTime / durationSeconds);
	const activeCue = $derived(
		subtitles.find(
			(cue: ObjectViewSubtitleCue) => currentTime >= cue.startSeconds && currentTime < cue.endSeconds
		) ?? null
	);

	const formatTime = (value: number): string => {
		const minutes = Math.floor(value / 60);
		const seconds = Math.floor(value % 60);
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	};

	const resetFadeTimer = (): void => {
		controlsVisible = true;
		window.clearTimeout(fadeTimer);
		if (playing) {
			fadeTimer = window.setTimeout(() => { controlsVisible = false; }, 2500);
		}
	};

	const startTicker = (): void => {
		window.clearInterval(tickHandle);
		tickHandle = window.setInterval(() => {
			currentTime = currentTime >= durationSeconds ? 0 : Math.min(durationSeconds, currentTime + 1);
		}, 1000);
	};

	const stopTicker = (): void => {
		window.clearInterval(tickHandle);
	};

	$effect(() => {
		if (playing) {
			startTicker();
			resetFadeTimer();
		} else {
			stopTicker();
			controlsVisible = true;
			window.clearTimeout(fadeTimer);
		}
		return () => { stopTicker(); window.clearTimeout(fadeTimer); };
	});
</script>

<div
	class="absolute inset-0 flex overflow-hidden bg-[#0a0f12]"
	onpointermove={resetFadeTimer}
	role="presentation"
>
	<!-- Video area -->
	<div class="relative min-w-0 flex-1">
		<!-- Poster -->
		<img
			src={posterUrl}
			alt="Video preview"
			class="h-full w-full object-contain"
			draggable="false"
		/>

		<!-- Gradient overlay for controls legibility -->
		<div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

		<!-- Captions -->
		{#if captionsOn && activeCue}
			<div class="absolute inset-x-0 bottom-28 z-10 text-center">
				<span class="inline-block rounded-lg bg-black/60 px-4 py-2 text-sm leading-relaxed text-white shadow backdrop-blur-sm sm:text-base">
					{activeCue.text}
				</span>
			</div>
		{/if}

		<!-- Bottom control bar -->
		<div
			class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-10 transition-opacity duration-400 {controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'}"
		>
			<div class="mx-auto max-w-4xl">
				<!-- Progress bar -->
				<div class="h-1 rounded-full bg-white/15">
					<div
						class="h-full rounded-full bg-pearl-beige transition-[width] duration-200"
						style="width: {progress * 100}%"
					></div>
				</div>

				<div class="mt-3 flex items-center gap-3">
					<button
						type="button"
						class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pearl-beige text-blue-slate-deep transition hover:bg-[#f1e6c8] active:scale-95"
						onclick={() => (playing = !playing)}
						aria-label={playing ? 'Pause' : 'Play'}
					>
						{#if playing}
							<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true"><path d="M6 4h3v12H6zm5 0h3v12h-3z" /></svg>
						{:else}
							<svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true"><path d="M6 4.5l9 5.5-9 5.5z" /></svg>
						{/if}
					</button>

					<span class="text-xs tabular-nums text-white/70">{formatTime(currentTime)} / {formatTime(durationSeconds)}</span>

					<div class="flex-1"></div>

					<button
						type="button"
						class="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] transition {captionsOn
							? 'border-pearl-beige/30 bg-pearl-beige/15 text-pearl-beige'
							: 'border-white/15 text-white/40 hover:text-white/60'}"
						onclick={() => (captionsOn = !captionsOn)}
					>CC</button>

					<button
						type="button"
						class="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] transition {showTranscript
							? 'border-pearl-beige/30 bg-pearl-beige/15 text-pearl-beige'
							: 'border-white/15 text-white/40 hover:text-white/60'}"
						onclick={() => (showTranscript = !showTranscript)}
					>Notes</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Transcript side panel -->
	{#if showTranscript}
		<aside class="flex w-80 shrink-0 flex-col border-l border-white/8 bg-[#0e181e]">
			<div class="shrink-0 border-b border-white/6 px-4 py-3">
				<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/40">Scene notes</p>
			</div>
			<div class="flex-1 overflow-y-auto px-3 py-3">
				<div class="space-y-1">
					{#each transcript as segment (segment.id)}
						<button
							type="button"
							onclick={() => { currentTime = segment.startSeconds; playing = true; }}
							class="w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/5"
						>
							<p class="text-[10px] tabular-nums text-pale-sky/30">{formatTime(segment.startSeconds)} – {formatTime(segment.endSeconds)}</p>
							<p class="mt-1 text-sm leading-relaxed text-pale-sky/60">{segment.text}</p>
						</button>
					{/each}
				</div>
			</div>
		</aside>
	{/if}
</div>
