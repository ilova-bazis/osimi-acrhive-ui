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
		if (playing) startTicker();
		else stopTicker();

		return () => stopTicker();
	});
</script>

<section class="overflow-hidden rounded-[2rem] border border-border-soft bg-surface-white shadow-[0_24px_70px_rgba(31,47,56,0.12)]">
	<div class="border-b border-border-soft bg-surface-white px-5 py-4 sm:px-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Video viewer</p>
				<p class="mt-1 text-sm text-text-muted">Captions and transcript can be revealed without entering edit mode.</p>
			</div>
			<div class="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
				<button type="button" class={`rounded-full border px-3 py-2 transition ${captionsOn ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`} onclick={() => (captionsOn = !captionsOn)}>Captions</button>
				<button type="button" class={`rounded-full border px-3 py-2 transition ${showTranscript ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`} onclick={() => (showTranscript = !showTranscript)}>Transcript</button>
			</div>
		</div>
	</div>

	<div class="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
		<div class="border-b border-border-soft bg-[#0f171b] p-4 lg:border-b-0 lg:border-r lg:p-6">
			<div class="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
				<img src={posterUrl} alt="Mock video poster" class="h-auto w-full" />
				<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent"></div>
				{#if captionsOn && activeCue}
					<div class="absolute inset-x-8 bottom-24 rounded-2xl bg-black/66 px-4 py-3 text-center text-sm leading-relaxed text-white shadow-lg backdrop-blur">
						{activeCue.text}
					</div>
				{/if}
				<div class="absolute inset-x-4 bottom-4 rounded-[1.2rem] border border-white/10 bg-black/55 px-4 py-4 text-white backdrop-blur">
					<div class="flex items-center gap-4">
						<button type="button" class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-pearl-beige text-blue-slate transition hover:bg-[#f1e6c8]" onclick={() => (playing = !playing)} aria-label={playing ? 'Pause video' : 'Play video'}>
							{#if playing}
								<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M6 4h3v12H6zm5 0h3v12h-3z" /></svg>
							{:else}
								<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M6 4.5l9 5.5-9 5.5z" /></svg>
							{/if}
						</button>
						<div class="min-w-0 flex-1">
							<div class="h-2 rounded-full bg-white/20">
								<div class="h-full rounded-full bg-pearl-beige transition-[width] duration-200" style={`width: ${progress * 100}%`}></div>
							</div>
							<div class="mt-2 flex items-center justify-between text-xs text-white/80">
								<span>{formatTime(currentTime)}</span>
								<span>{formatTime(durationSeconds)}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="bg-alabaster-grey/35 p-5 lg:p-6">
			<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Scene notes</p>
			<p class="mt-2 text-sm text-text-muted">Use this panel to review spoken content without exposing editing affordances.</p>

			{#if showTranscript}
				<div class="mt-4 space-y-3">
					{#each transcript as segment (segment.id)}
						<button
							type="button"
							onclick={() => {
								currentTime = segment.startSeconds;
								playing = true;
							}}
							class="w-full rounded-2xl border border-border-soft bg-surface-white px-4 py-3 text-left transition hover:border-blue-slate/35 hover:bg-pale-sky/18"
						>
							<p class="text-xs text-text-muted">{formatTime(segment.startSeconds)} - {formatTime(segment.endSeconds)}</p>
							<p class="mt-2 text-sm leading-relaxed text-text-ink">{segment.text}</p>
						</button>
					{/each}
				</div>
			{:else}
				<div class="mt-4 rounded-2xl border border-dashed border-border-soft bg-surface-white/80 px-5 py-10 text-center text-sm text-text-muted">
					Transcript hidden. Captions can still stay visible over the player.
				</div>
			{/if}
		</div>
	</div>
</section>
