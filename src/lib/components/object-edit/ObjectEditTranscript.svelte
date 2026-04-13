<script lang="ts">
	import type { ObjectViewRecord } from '$lib/objectView/types';

	type TranscriptEditMode = 'transcript' | 'captions';

	let {
		object,
		curatedTranscript,
		curatedCaptions,
		onCuratedTranscriptChange,
		onCuratedCaptionsChange
	}: {
		object: ObjectViewRecord;
		curatedTranscript: Array<{ id: string; startSeconds: number; endSeconds: number; text: string; curatedText: string; speaker?: string }>;
		curatedCaptions?: Array<{ id: string; startSeconds: number; endSeconds: number; curatedText: string }>;
		onCuratedTranscriptChange: (segments: Array<{ id: string; startSeconds: number; endSeconds: number; curatedText: string; speaker?: string }>) => void;
		onCuratedCaptionsChange?: (captions: Array<{ id: string; startSeconds: number; endSeconds: number; curatedText: string }>) => void;
	} = $props();

	let editMode = $state<TranscriptEditMode>(
		object.mediaType === 'video' && curatedCaptions ? 'transcript' : 'transcript'
	);
	let activeSegmentIndex = $state(0);
	let showSourcePanel = $state(true);

	let sourceTranscript = $derived(
		object.mediaType === 'audio' || object.mediaType === 'video'
			? object.transcript
			: []
	);

	const formatDuration = (seconds: number): string => {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	};

	const updateCuratedText = (index: number, text: string): void => {
		const updated = curatedTranscript.map((seg, i) =>
			i === index ? { ...seg, curatedText: text } : seg
		);
		onCuratedTranscriptChange(updated);
	};

	const updateSpeaker = (index: number, speaker: string): void => {
		const updated = curatedTranscript.map((seg, i) =>
			i === index ? { ...seg, speaker } : seg
		);
		onCuratedTranscriptChange(updated);
	};

	const copyFromSource = (index: number): void => {
		const source = sourceTranscript[index];
		if (!source) return;
		const updated = curatedTranscript.map((seg, i) =>
			i === index ? { ...seg, curatedText: source.text } : seg
		);
		onCuratedTranscriptChange(updated);
	};

	const copyAllFromSource = (): void => {
		const updated = curatedTranscript.map((seg, i) => {
			const source = sourceTranscript[i];
			return { ...seg, curatedText: source?.text ?? seg.curatedText };
		});
		onCuratedTranscriptChange(updated);
	};

	const updateCaptionText = (index: number, text: string): void => {
		if (!curatedCaptions || !onCuratedCaptionsChange) return;
		const updated = curatedCaptions.map((cap, i) =>
			i === index ? { ...cap, curatedText: text } : cap
		);
		onCuratedCaptionsChange(updated);
	};
</script>

<div class="space-y-4">
	{#if object.mediaType === 'video'}
		<!-- Mode tabs for video -->
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={() => (editMode = 'transcript')}
				class="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {editMode === 'transcript'
					? 'bg-blue-slate text-surface-white'
					: 'border border-border-soft text-text-muted hover:bg-pale-sky/30'}"
			>
				Transcript
			</button>
			<button
				type="button"
				onclick={() => (editMode = 'captions')}
				class="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition {editMode === 'captions'
					? 'bg-blue-slate text-surface-white'
					: 'border border-border-soft text-text-muted hover:bg-pale-sky/30'}"
			>
				Captions / Subtitles
			</button>
		</div>
	{/if}

	{#if editMode === 'transcript'}
		<!-- Source toggle -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Transcript segments</span>
				<span class="text-[9px] uppercase tracking-[0.12em] text-text-muted">{sourceTranscript.length} segments</span>
			</div>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => (showSourcePanel = !showSourcePanel)}
					class="rounded-full border border-border-soft px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-text-muted transition hover:bg-pale-sky/20"
				>
					{showSourcePanel ? 'Hide source' : 'Show source'}
				</button>
				<button
					type="button"
					onclick={copyAllFromSource}
					class="rounded-full border border-blue-slate/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-blue-slate transition hover:bg-pale-sky/30"
				>
					Copy all from source
				</button>
			</div>
		</div>

		<!-- Segment list -->
		<div class="space-y-3">
			{#each curatedTranscript as segment, i (segment.id)}
				<button
					type="button"
					onclick={() => (activeSegmentIndex = i)}
					class="w-full text-left"
				>
					<div class="rounded-xl border transition {activeSegmentIndex === i
						? 'border-pearl-beige/60 bg-pearl-beige/8'
						: 'border-border-soft bg-surface-white hover:bg-pale-sky/10'}">
						<!-- Segment header (clickable) -->
						<div class="flex items-center gap-3 px-4 py-2.5">
							<span class="rounded-full bg-pale-sky/30 px-2 py-0.5 font-mono text-[11px] text-blue-slate">
								{formatDuration(segment.startSeconds)}
							</span>
							{#if 'speaker' in segment && segment.speaker}
								<span class="text-[10px] uppercase tracking-[0.12em] text-text-muted">{segment.speaker}</span>
							{/if}
							<span class="flex-1 truncate text-sm text-text-ink">
								{segment.curatedText || sourceTranscript[i]?.text || 'Empty segment'}
							</span>
							{#if segment.curatedText}
								<span class="inline-block h-1.5 w-1.5 rounded-full bg-pearl-beige"></span>
							{/if}
							<span class="text-[9px] text-text-muted">▸</span>
						</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- Active segment editor -->
		{#if curatedTranscript[activeSegmentIndex]}
			{@const activeSegment = curatedTranscript[activeSegmentIndex]}
			{@const activeSource = sourceTranscript[activeSegmentIndex]}
			<div class="rounded-xl border border-pearl-beige/50 bg-pearl-beige/5 p-4">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-blue-slate/10 px-2.5 py-1 font-mono text-[11px] text-blue-slate">
						{formatDuration(activeSegment.startSeconds)} – {formatDuration(activeSegment.endSeconds)}
					</span>
					{#if activeSegment.curatedText !== (activeSource?.text ?? '')}
						<span class="rounded-full bg-pearl-beige/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-burnt-peach">Edited</span>
					{/if}
				</div>

				{#if showSourcePanel && activeSource}
					<div class="mb-3 rounded-lg border border-blue-slate/10 bg-pale-sky/15 px-3 py-2 text-sm text-blue-slate/80">
						<p class="mb-1 text-[9px] uppercase tracking-[0.12em] text-blue-slate/50">Source transcription</p>
						{activeSource.text}
					</div>
				{/if}

				<textarea
					class="w-full resize-none rounded-lg border border-pearl-beige/40 bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/50"
					rows="3"
					placeholder="Curated transcript for this segment..."
					value={activeSegment.curatedText}
					oninput={(e) => updateCuratedText(activeSegmentIndex, e.currentTarget.value)}
				></textarea>

				{#if 'speaker' in activeSegment}
					<div class="mt-2">
						<label class="text-[9px] uppercase tracking-[0.12em] text-text-muted">Speaker</label>
						<input
							class="mt-1 w-full rounded-lg border border-border-soft bg-pearl-beige/10 px-3 py-1.5 text-sm text-text-ink focus:border-pearl-beige focus:outline-none"
							placeholder="Speaker name"
							value={activeSegment.speaker ?? ''}
							oninput={(e) => updateSpeaker(activeSegmentIndex, e.currentTarget.value)}
						/>
					</div>
				{/if}

				<div class="mt-2 flex justify-end">
					<button
						type="button"
						onclick={() => copyFromSource(activeSegmentIndex)}
						class="rounded-full border border-blue-slate/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-blue-slate transition hover:bg-pale-sky/30"
					>
						Copy from source
					</button>
				</div>
			</div>
		{/if}
	{:else if editMode === 'captions' && curatedCaptions}
		<!-- Captions/subtitles editor -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Captions / Subtitles</span>
				<span class="text-[9px] uppercase tracking-[0.12em] text-text-muted">{curatedCaptions.length} cues</span>
			</div>
		</div>

		<div class="space-y-3">
			{#each curatedCaptions as caption, i (caption.id)}
				<div class="rounded-xl border border-border-soft bg-surface-white p-4">
					<div class="mb-2 flex items-center gap-3">
						<span class="rounded-full bg-pale-sky/30 px-2 py-0.5 font-mono text-[11px] text-blue-slate">
							{formatDuration(caption.startSeconds)} → {formatDuration(caption.endSeconds)}
						</span>
						{#if caption.curatedText}
							<span class="inline-block h-1.5 w-1.5 rounded-full bg-pearl-beige"></span>
						{/if}
					</div>
					<textarea
						class="w-full resize-none rounded-lg border border-pearl-beige/40 bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/50"
						rows="2"
						placeholder="Caption text..."
						value={caption.curatedText}
						oninput={(e) => updateCaptionText(i, e.currentTarget.value)}
					></textarea>
				</div>
			{/each}
		</div>
	{/if}
</div>