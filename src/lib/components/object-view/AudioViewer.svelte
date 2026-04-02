<script lang="ts">
	import type { ObjectViewTranscriptSegment } from '$lib/objectView/types';

	let {
		durationSeconds,
		waveform,
		transcript
	} = $props<{
		durationSeconds: number;
		waveform: number[];
		transcript: ObjectViewTranscriptSegment[];
	}>();

	let playing = $state(false);
	let currentTime = $state(24);
	let showTranscript = $state(true);
	let tickHandle = 0;

	const progress = $derived(currentTime / durationSeconds);
	const activeSegmentId = $derived(
		transcript.find(
			(segment: ObjectViewTranscriptSegment) =>
				currentTime >= segment.startSeconds && currentTime < segment.endSeconds
		)?.id ?? null
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
	<div class="border-b border-border-soft bg-pale-sky/16 px-5 py-4 sm:px-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Audio viewer</p>
				<p class="mt-1 text-sm text-text-muted">Playback is simulated for prototype review; transcript remains read-only.</p>
			</div>
			<button type="button" class={`rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.2em] transition ${showTranscript ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`} onclick={() => (showTranscript = !showTranscript)}>
				Transcript
			</button>
		</div>
	</div>

	<div class="grid gap-0 lg:grid-cols-[1.3fr_0.9fr]">
		<div class="border-b border-border-soft p-5 lg:border-b-0 lg:border-r lg:p-8">
			<div class="rounded-[1.7rem] border border-border-soft bg-[linear-gradient(180deg,#f7f3eb_0%,#fefdf9_100%)] p-6 shadow-inner">
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Listening room</p>
						<p class="mt-2 text-sm text-text-muted">Focus on cadence and speech without accidental edits.</p>
					</div>
					<button type="button" class="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-slate text-surface-white shadow-[0_10px_20px_rgba(79,109,122,0.28)] transition hover:bg-blue-slate-mid-dark" onclick={() => (playing = !playing)} aria-label={playing ? 'Pause audio' : 'Play audio'}>
						{#if playing}
							<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M6 4h3v12H6zm5 0h3v12h-3z" /></svg>
						{:else}
							<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M6 4.5l9 5.5-9 5.5z" /></svg>
						{/if}
					</button>
				</div>

				<div class="mt-8 flex h-40 items-end gap-2 rounded-[1.4rem] border border-blue-slate/10 bg-blue-slate-deep px-4 py-5">
					{#each waveform as bar, index (`bar-${index}`)}
						<div class={`w-full rounded-full ${index / waveform.length <= progress ? 'bg-pearl-beige' : 'bg-pale-sky/35'}`} style={`height: ${bar}%;`}></div>
					{/each}
				</div>

				<div class="mt-6">
					<div class="h-2 rounded-full bg-alabaster-grey">
						<div class="h-full rounded-full bg-blue-slate transition-[width] duration-200" style={`width: ${progress * 100}%`}></div>
					</div>
					<div class="mt-3 flex items-center justify-between text-sm text-text-muted">
						<span>{formatTime(currentTime)}</span>
						<span>{formatTime(durationSeconds)}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="bg-alabaster-grey/35 p-5 lg:p-6">
			<div class="flex items-center justify-between gap-3">
				<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Transcript</p>
				<p class="text-xs text-text-muted">Tap a line to jump</p>
			</div>

			{#if showTranscript}
				<div class="mt-4 space-y-3">
					{#each transcript as segment (segment.id)}
						<button
							type="button"
							onclick={() => {
								currentTime = segment.startSeconds;
								playing = true;
							}}
							class={`w-full rounded-2xl border px-4 py-3 text-left transition ${activeSegmentId === segment.id ? 'border-blue-slate/35 bg-pale-sky/35' : 'border-border-soft bg-surface-white hover:border-blue-slate/30 hover:bg-surface-white'}`}
						>
							<div class="flex items-center justify-between gap-3 text-xs text-text-muted">
								<span>{formatTime(segment.startSeconds)} - {formatTime(segment.endSeconds)}</span>
								{#if segment.speaker}<span>{segment.speaker}</span>{/if}
							</div>
							<p class="mt-2 text-sm leading-relaxed text-text-ink">{segment.text}</p>
						</button>
					{/each}
				</div>
			{:else}
				<div class="mt-4 rounded-2xl border border-dashed border-border-soft bg-surface-white/80 px-5 py-10 text-center text-sm text-text-muted">
					Transcript hidden. Playback remains available above.
				</div>
			{/if}
		</div>
	</div>
</section>
