<script lang="ts">
	import type { ObjectViewTranscriptSegment } from '$lib/objectView/types';
	import AltMediaRequestBanner from './AltMediaRequestBanner.svelte';

	type Availability = 'AVAILABLE' | 'ARCHIVED' | 'RESTORE_PENDING' | 'RESTORING' | 'UNAVAILABLE';

	let {
		durationSeconds,
		waveform,
		transcript,
		availability = 'AVAILABLE',
		onRequestAccess
	} = $props<{
		durationSeconds: number;
		waveform: number[];
		transcript: ObjectViewTranscriptSegment[];
		availability?: Availability;
		onRequestAccess?: () => void;
	}>();

	let playing = $state(false);
	let currentTime = $state(24);
	let showTranscript = $state(true);
	let tickHandle = 0;

	const isAvailable = $derived(availability === 'AVAILABLE');
	const progress = $derived(isAvailable ? currentTime / durationSeconds : 0);
	const activeSegmentId = $derived(
		isAvailable
			? (transcript.find(
					(segment: ObjectViewTranscriptSegment) =>
						currentTime >= segment.startSeconds && currentTime < segment.endSeconds
				)?.id ?? null)
			: null
	);

	const formatTime = (value: number): string => {
		const minutes = Math.floor(value / 60);
		const seconds = Math.floor(value % 60);
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
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
		if (playing && isAvailable) startTicker();
		else stopTicker();
		return () => stopTicker();
	});
</script>

<div class="absolute inset-0 flex flex-col overflow-hidden bg-[#1f2f38]">
	<!-- Player area -->
	<div class="flex shrink-0 flex-col items-center px-6 pb-6 pt-8">
		<div class="w-full max-w-3xl">
			{#if isAvailable}
				<!-- Available: full player -->
				<div class="flex items-center gap-5">
					<button
						type="button"
						class="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-pearl-beige text-blue-slate-deep shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-[#f1e6c8] active:scale-95"
						onclick={() => (playing = !playing)}
						aria-label={playing ? 'Pause' : 'Play'}
					>
						{#if playing}
							<svg viewBox="0 0 20 20" fill="currentColor" class="h-6 w-6" aria-hidden="true"><path d="M6 4h3v12H6zm5 0h3v12h-3z" /></svg>
						{:else}
							<svg viewBox="0 0 20 20" fill="currentColor" class="h-6 w-6" aria-hidden="true"><path d="M6 4.5l9 5.5-9 5.5z" /></svg>
						{/if}
					</button>
					<div class="min-w-0 flex-1">
						<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/45">{playing ? 'Now playing' : 'Listening room'}</p>
						<div class="mt-2 flex items-center gap-2 text-sm text-pale-sky/60">
							<span>{formatTime(currentTime)}</span>
							<div class="h-1 flex-1 rounded-full bg-white/10">
								<div class="h-full rounded-full bg-pearl-beige transition-[width] duration-200" style="width: {progress * 100}%"></div>
							</div>
							<span>{formatTime(durationSeconds)}</span>
						</div>
					</div>
				</div>

				<!-- Waveform -->
				<div class="mt-5 flex h-32 items-end gap-1 rounded-xl border border-white/6 bg-[#162228] px-3 py-3">
					{#each waveform as bar, index (`bar-${index}`)}
						<div
							class="w-full rounded-sm transition-colors duration-200 {index / waveform.length <= progress ? 'bg-pearl-beige' : 'bg-pale-sky/18'}"
							style="height: {bar}%;"
						></div>
					{/each}
				</div>
			{:else}
				<!-- Not available: request banner + flat waveform placeholder -->
				<AltMediaRequestBanner
					{availability}
					mediaLabel="audio file"
					variant="dark"
					onRequest={onRequestAccess ?? (() => {})}
				/>

				<div class="mt-5 flex h-32 items-end gap-1 rounded-xl border border-white/6 bg-[#162228] px-3 py-3">
					{#each waveform as _, index (`bar-${index}`)}
						<div class="w-full rounded-sm bg-pale-sky/8" style="height: 12%;"></div>
					{/each}
				</div>

				<div class="mt-3 flex items-center gap-2 text-sm text-pale-sky/30">
					<span>0:00</span>
					<div class="h-1 flex-1 rounded-full bg-white/6"></div>
					<span>{formatTime(durationSeconds)}</span>
				</div>
			{/if}

			<!-- Transcript toggle -->
			<div class="mt-3 flex items-center justify-between">
				<p class="text-[10px] uppercase tracking-[0.2em] text-pale-sky/35">{isAvailable ? 'Read-only playback' : 'Transcript available'}</p>
				<button
					type="button"
					class="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] transition {showTranscript
						? 'border-pearl-beige/30 bg-pearl-beige/15 text-pearl-beige'
						: 'border-white/12 text-pale-sky/40 hover:text-pale-sky/60'}"
					onclick={() => (showTranscript = !showTranscript)}
				>Transcript</button>
			</div>
		</div>
	</div>

	<!-- Transcript panel (always available regardless of media state) -->
	{#if showTranscript}
		<div class="min-h-0 flex-1 overflow-y-auto border-t border-white/8 bg-[#182730]">
			<div class="mx-auto max-w-3xl px-6 py-4">
				<div class="space-y-1.5">
					{#each transcript as segment (segment.id)}
						<button
							type="button"
							onclick={() => { if (isAvailable) { currentTime = segment.startSeconds; playing = true; } }}
							class="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition {!isAvailable ? 'cursor-default' : ''} {activeSegmentId === segment.id
								? 'bg-white/8'
								: isAvailable ? 'hover:bg-white/4' : ''}"
						>
							<span class="shrink-0 pt-0.5 text-[10px] tabular-nums {activeSegmentId === segment.id ? 'text-pearl-beige/60' : 'text-pale-sky/25'}">{formatTime(segment.startSeconds)}</span>
							<div class="min-w-0 flex-1">
								{#if segment.speaker}
									<p class="text-[10px] uppercase tracking-[0.15em] {activeSegmentId === segment.id ? 'text-pearl-beige/50' : 'text-pale-sky/30'}">{segment.speaker}</p>
								{/if}
								<p class="mt-0.5 text-sm leading-relaxed {activeSegmentId === segment.id
									? 'text-pearl-beige'
									: 'text-pale-sky/50 group-hover:text-pale-sky/65'}">
									{segment.text}
								</p>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
