<script lang="ts">
	import AudioViewer from '$lib/components/object-view/AudioViewer.svelte';
	import DocumentViewer from '$lib/components/object-view/DocumentViewer.svelte';
	import ImageViewer from '$lib/components/object-view/ImageViewer.svelte';
	import ObjectInfoDrawer from '$lib/components/object-view/ObjectInfoDrawer.svelte';
	import ObjectMediaGate from '$lib/components/object-view/ObjectMediaGate.svelte';
	import ObjectTopBar from '$lib/components/object-view/ObjectTopBar.svelte';
	import VideoViewer from '$lib/components/object-view/VideoViewer.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import type { ObjectViewRecord } from '$lib/objectView/types';

	type ObjectViewMediaAccess = {
		state: 'available' | 'request_required' | 'request_pending' | 'restricted' | 'temporarily_unavailable';
		action: 'read' | 'view' | 'listen' | 'watch';
		reasonCode: 'OK' | 'FORBIDDEN_POLICY' | 'EMBARGO_ACTIVE' | 'RESTORE_REQUIRED' | 'RESTORE_IN_PROGRESS' | 'TEMP_UNAVAILABLE';
		requestLabel: string;
		helperText: string;
		availableNow: Array<'thumbnail' | 'ocr' | 'transcript' | 'captions' | 'poster'>;
		pendingRequest?: {
			id: string;
			status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
			requestedAt: string;
			estimatedReadyLabel: string;
		};
	};

	let {
		data
	} = $props<{
		data: {
			object: ObjectViewRecord;
			reviewItems: Array<{ id: string; title: string; mediaType: ObjectViewRecord['mediaType'] }>;
	};
	}>();

	const emptyMediaAccess = (): ObjectViewMediaAccess => ({
		state: 'temporarily_unavailable',
		action: 'view',
		reasonCode: 'TEMP_UNAVAILABLE',
		requestLabel: 'Request media',
		helperText: '',
		availableNow: []
	});

	let infoOpen = $state(false);
	let activeObjectId = $state('');
	let mediaAccess = $state<ObjectViewMediaAccess>(emptyMediaAccess());

	const object = $derived(data.object as ObjectViewRecord & { mediaAccess: ObjectViewMediaAccess });
	const accessStateLabel = $derived(mediaAccess.state.replace(/_/g, ' '));
	const accessToneClass = $derived.by(() => {
		if (mediaAccess.state === 'available') return 'border-blue-slate/25 bg-pale-sky/25 text-blue-slate';
		if (mediaAccess.state === 'request_pending') return 'border-blue-slate/25 bg-alabaster-grey/80 text-blue-slate';
		if (mediaAccess.state === 'request_required') return 'border-pearl-beige bg-pearl-beige/60 text-blue-slate';
		return 'border-burnt-peach/30 bg-pearl-beige/75 text-burnt-peach';
	});

	const availableLabel = (value: string): string => {
		if (value === 'ocr') return 'OCR text';
		if (value === 'transcript') return 'Transcript';
		if (value === 'captions') return 'Captions';
		if (value === 'poster') return 'Poster frame';
		return 'Thumbnail';
	};

	const availableMessage = (): string => {
		if (object.mediaType === 'audio') return 'Listening copy is staged and ready. Transcript remains read-only.';
		if (object.mediaType === 'video') return 'Streaming copy is ready. Captions remain read-only.';
		if (object.mediaType === 'image') return 'Full-resolution image is ready for close viewing.';
		return 'Reading copy is ready alongside OCR preview.';
	};

	const toggleInfo = (): void => {
		infoOpen = !infoOpen;
	};

	const requestMediaAccess = (): void => {
		if (mediaAccess.state !== 'request_required') return;

		mediaAccess = {
			...mediaAccess,
			state: 'request_pending',
			reasonCode: 'RESTORE_IN_PROGRESS',
			helperText: 'Request queued. Preview materials stay available while the source media is prepared.',
			pendingRequest: {
				id: `req-${object.id}`,
				status: 'PROCESSING',
				requestedAt: new Date().toISOString(),
				estimatedReadyLabel: 'Prototype auto-unlocks after a short delay'
			}
		};
	};

	const handleKeydown = (event: KeyboardEvent): void => {
		if (event.key.toLowerCase() === 'i') infoOpen = !infoOpen;
		if (event.key.toLowerCase() === 'r') requestMediaAccess();
		if (event.key === 'Escape') infoOpen = false;
	};

	$effect(() => {
		if (data.object.id !== activeObjectId) {
			activeObjectId = data.object.id;
			mediaAccess = structuredClone((data.object as ObjectViewRecord & { mediaAccess: ObjectViewMediaAccess }).mediaAccess);
			infoOpen = false;
		}
	});

	$effect(() => {
		if (mediaAccess.state !== 'request_pending') return;

		const timeout = window.setTimeout(() => {
			mediaAccess = {
				...mediaAccess,
				state: 'available',
				reasonCode: 'OK',
				helperText: availableMessage(),
				pendingRequest: mediaAccess.pendingRequest
					? {
						...mediaAccess.pendingRequest,
						status: 'COMPLETED'
					}
					: undefined
			};
		}, 3600);

		return () => {
			window.clearTimeout(timeout);
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<ObjectTopBar
	backHref="/prototype/objects"
	title={object.title}
	status={object.status}
	reviewLabel={object.reviewLabel}
	onInfoToggle={toggleInfo}
/>

<main class="min-h-screen bg-[linear-gradient(180deg,#f5f2eb_0%,#edf1f2_100%)]">
	<section class="border-b border-border-soft bg-surface-white/70 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
		<div class="mx-auto flex max-w-[96rem] flex-wrap items-center gap-2">
			<p class="mr-2 text-[10px] uppercase tracking-[0.2em] text-text-muted">Review mocked objects</p>
			{#each data.reviewItems as item (item.id)}
				<button
					type="button"
					onclick={() => {
						window.location.href = `/prototype/objects/${item.id}`;
					}}
					class={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${item.id === object.id ? 'border-blue-slate bg-blue-slate text-surface-white' : 'border-border-soft bg-surface-white text-blue-slate hover:bg-pale-sky/20'}`}
				>
					{item.mediaType}
				</button>
			{/each}
			<Chip class="ml-auto border-border-soft bg-surface-white text-[10px] uppercase tracking-[0.2em] text-text-muted">Press I for info - R to request media</Chip>
		</div>
	</section>

	<div class="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
		<div class="mb-5 max-w-3xl">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{object.mediaType} object</p>
			<p class="mt-2 text-sm leading-relaxed text-text-muted">{object.subtitle} The page stays intentionally calm and read-only so the object itself remains the primary focus.</p>
			<div class="mt-4">
				<button
					type="button"
					onclick={() => {
						window.location.href = `/prototype/objects/${object.id}/edit`;
					}}
					class="inline-flex items-center rounded-full border border-border-soft bg-surface-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
				>
					Open editing prototype
				</button>
			</div>
			<div class="mt-4 flex flex-wrap items-center gap-2">
				<Chip class={`text-[10px] uppercase tracking-[0.2em] ${accessToneClass}`}>{accessStateLabel}</Chip>
				{#each mediaAccess.availableNow as artifact (artifact)}
					<Chip class="border-blue-slate/20 bg-pale-sky/18 text-[10px] uppercase tracking-[0.18em] text-blue-slate">{availableLabel(artifact)}</Chip>
				{/each}
			</div>
		</div>

		{#if mediaAccess.state === 'available' && object.mediaType === 'document'}
			<DocumentViewer title={object.title} pages={object.pages} hasOcr={object.hasOcr} />
		{:else if mediaAccess.state === 'available' && object.mediaType === 'image'}
			<ImageViewer imageUrl={object.imageUrl} imageAlt={object.imageAlt} hasZoom={object.hasZoom} />
		{:else if mediaAccess.state === 'available' && object.mediaType === 'audio'}
			<AudioViewer durationSeconds={object.durationSeconds} waveform={object.waveform} transcript={object.transcript} />
		{:else if mediaAccess.state === 'available' && object.mediaType === 'video'}
			<VideoViewer posterUrl={object.posterUrl} durationSeconds={object.durationSeconds} subtitles={object.subtitles} transcript={object.transcript} />
		{:else}
			<div class="space-y-6">
				<ObjectMediaGate mediaType={object.mediaType} access={mediaAccess} onRequest={requestMediaAccess} />

				<section class="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
					<article class="rounded-[1.8rem] border border-border-soft bg-surface-white p-5 shadow-[0_18px_45px_rgba(31,47,56,0.08)] sm:p-6">
						<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">What can be inspected now</p>
						<p class="mt-2 text-sm leading-relaxed text-text-muted">Preview materials stay visible while the source media is staged. This keeps the page media-first without pretending the original file is instantly ready.</p>

						{#if object.mediaType === 'document'}
							<div class="mt-5 grid gap-4 sm:grid-cols-2">
								{#each object.pages.slice(0, 2) as page (page.id)}
									<div class="overflow-hidden rounded-[1.2rem] border border-border-soft bg-[#f7f1e3] p-3">
										<img src={page.imageUrl} alt={page.label} class="h-52 w-full rounded-xl object-cover object-top" />
										<p class="mt-3 text-xs uppercase tracking-[0.2em] text-text-muted">{page.label}</p>
										<p class="mt-2 text-sm leading-relaxed text-text-ink">{page.ocrText}</p>
									</div>
								{/each}
							</div>
						{:else if object.mediaType === 'image'}
							<div class="mt-5 overflow-hidden rounded-[1.5rem] border border-border-soft bg-[#132128] p-3 sm:p-5">
								<img src={object.imageUrl} alt={object.imageAlt} class="h-auto w-full rounded-[1.1rem] object-cover opacity-85" />
							</div>
						{:else if object.mediaType === 'audio'}
							<div class="mt-5 space-y-3">
								{#each object.transcript.slice(0, 3) as segment (segment.id)}
									<div class="rounded-2xl border border-border-soft bg-alabaster-grey/35 px-4 py-3">
										<p class="text-xs text-text-muted">{Math.floor(segment.startSeconds / 60)}:{String(segment.startSeconds % 60).padStart(2, '0')}</p>
										<p class="mt-2 text-sm leading-relaxed text-text-ink">{segment.text}</p>
									</div>
								{/each}
							</div>
						{:else}
							<div class="mt-5 overflow-hidden rounded-[1.5rem] border border-border-soft bg-[#132128] p-3 sm:p-5">
								<img src={object.posterUrl} alt="Video poster preview" class="h-auto w-full rounded-[1.1rem] object-cover opacity-90" />
								<div class="mt-4 space-y-2">
									{#each object.subtitles.slice(0, 2) as cue (cue.id)}
										<div class="rounded-xl bg-black/30 px-4 py-3 text-sm text-white">{cue.text}</div>
									{/each}
								</div>
							</div>
						{/if}
					</article>

					<article class="rounded-[1.8rem] border border-border-soft bg-surface-white p-5 shadow-[0_18px_45px_rgba(31,47,56,0.08)] sm:p-6">
						<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Access flow in view mode</p>
						<div class="mt-4 space-y-4">
							<div class="rounded-2xl border border-border-soft bg-alabaster-grey/35 px-4 py-4">
								<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">1. Browse safely</p>
								<p class="mt-2 text-sm text-text-ink">Users review thumbnails, OCR, transcripts, or captions without any risk of accidental edits.</p>
							</div>
							<div class="rounded-2xl border border-border-soft bg-alabaster-grey/35 px-4 py-4">
								<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">2. Request source media</p>
								<p class="mt-2 text-sm text-text-ink">The request button lives inside the media canvas, so access feels like part of viewing instead of file management.</p>
							</div>
							<div class="rounded-2xl border border-border-soft bg-alabaster-grey/35 px-4 py-4">
								<p class="text-[10px] uppercase tracking-[0.2em] text-text-muted">3. Return to viewing</p>
								<p class="mt-2 text-sm text-text-ink">Once preparation completes, the gate disappears and the full viewer opens in the same place.</p>
							</div>
						</div>
					</article>
				</section>
			</div>
		{/if}
	</div>
</main>

<ObjectInfoDrawer open={infoOpen} metadata={object.metadata} onClose={() => (infoOpen = false)} />
