<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import type { ObjectViewMediaType } from '$lib/objectView/types';

	type ObjectViewMediaAccess = {
		state: 'available' | 'request_required' | 'request_pending' | 'restricted' | 'temporarily_unavailable';
		action: 'read' | 'view' | 'listen' | 'watch';
		reasonCode: 'OK' | 'FORBIDDEN_POLICY' | 'EMBARGO_ACTIVE' | 'RESTORE_REQUIRED' | 'RESTORE_IN_PROGRESS' | 'TEMP_UNAVAILABLE';
		requestLabel: string;
		helperText: string;
		availableNow: Array<'thumbnail' | 'ocr' | 'transcript' | 'captions' | 'poster' | 'access_pdf' | 'index'>;
		pendingRequest?: {
			id: string;
			status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
			requestedAt: string;
			estimatedReadyLabel: string;
		};
	};

	type ObjectViewPreviewArtifact = ObjectViewMediaAccess['availableNow'][number];

	let {
		mediaType,
		access,
		onRequest,
		requestDisabled = false
	} = $props<{
		mediaType: ObjectViewMediaType;
		access: ObjectViewMediaAccess;
		onRequest: () => void;
		requestDisabled?: boolean;
	}>();

	const actionVerb = $derived.by(() => {
		switch (access.action) {
			case 'read':
				return 'Reading copy';
			case 'view':
				return 'Viewing copy';
			case 'listen':
				return 'Listening copy';
			case 'watch':
				return 'Streaming copy';
		}
	});

	const stateLabel = $derived.by(() => {
		switch (access.state) {
			case 'available':
				return 'Ready now';
			case 'request_required':
				return 'Request required';
			case 'request_pending':
				return 'Preparation in progress';
			case 'restricted':
				return 'Restricted';
			case 'temporarily_unavailable':
				return 'Temporarily unavailable';
		}
	});

	const stateClass = $derived.by(() => {
		switch (access.state) {
			case 'available':
				return 'border-blue-slate/25 bg-pale-sky/25 text-blue-slate';
			case 'request_required':
				return 'border-pearl-beige bg-pearl-beige/55 text-blue-slate';
			case 'request_pending':
				return 'border-blue-slate/25 bg-alabaster-grey/80 text-blue-slate';
			case 'restricted':
				return 'border-burnt-peach/35 bg-pearl-beige/75 text-burnt-peach';
			case 'temporarily_unavailable':
				return 'border-blue-slate/18 bg-alabaster-grey/80 text-text-muted';
		}
	});

	const availableArtifactLabel = (artifact: ObjectViewPreviewArtifact): string => {
		if (artifact === 'ocr') return 'OCR text';
		if (artifact === 'access_pdf') return 'Access PDF';
		if (artifact === 'index') return 'Index';
		if (artifact === 'transcript') return 'Transcript';
		if (artifact === 'captions') return 'Captions';
		if (artifact === 'poster') return 'Poster frame';
		return 'Thumbnail';
	};

	const mediaBackdrop = $derived.by(() => {
		if (mediaType === 'image' || mediaType === 'video') return 'from-[#18272d] via-[#22363f] to-[#10181c] text-white';
		if (mediaType === 'audio') return 'from-[#f4ede0] via-[#fbf9f2] to-[#eef2f3] text-text-ink';
		return 'from-[#f1e7d5] via-[#faf7ef] to-[#f0e7d8] text-text-ink';
	});
</script>

<section class={`overflow-hidden rounded-[2rem] border border-border-soft bg-gradient-to-br ${mediaBackdrop} shadow-[0_24px_70px_rgba(31,47,56,0.12)]`}>
	<div class="flex min-h-[34rem] flex-col justify-between p-6 sm:p-8 lg:p-10">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<p class="text-[10px] uppercase tracking-[0.2em] opacity-70">Media access</p>
				<h2 class="mt-3 font-display text-3xl sm:text-4xl">{actionVerb} is not immediately available</h2>
				<p class="mt-3 max-w-2xl text-sm leading-relaxed opacity-85">{access.helperText}</p>
			</div>
			<span class={`rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.2em] ${stateClass}`}>{stateLabel}</span>
		</div>

		<div class="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
			<div class="rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
				<p class="text-[10px] uppercase tracking-[0.2em] opacity-70">Available now</p>
				<div class="mt-3 flex flex-wrap gap-2">
					{#each access.availableNow as artifact (artifact)}
						<Chip class="border-white/15 bg-white/10 text-[10px] uppercase tracking-[0.18em] text-current">{availableArtifactLabel(artifact)}</Chip>
					{/each}
				</div>
				<p class="mt-4 text-sm leading-relaxed opacity-80">Users can still inspect preview materials while the full media is restored or staged.</p>
			</div>

			<div class="rounded-[1.6rem] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
				<p class="text-[10px] uppercase tracking-[0.2em] opacity-70">Request status</p>
				{#if access.state === 'request_required'}
					<p class="mt-3 text-sm leading-relaxed opacity-85">This object opens in read-only preview first. Requesting access prepares the source media for safe viewing without exposing editing controls.</p>
					<button type="button" onclick={onRequest} disabled={requestDisabled} class="mt-5 rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate-mid-dark disabled:cursor-not-allowed disabled:opacity-45">
						{access.requestLabel}
					</button>
					{#if requestDisabled}
						<p class="mt-3 text-xs opacity-75">A preferred source file is not yet available for request.</p>
					{/if}
				{:else if access.state === 'request_pending' && access.pendingRequest}
					<p class="mt-3 text-sm opacity-85">Request <span class="font-medium">{access.pendingRequest.id}</span> is {access.pendingRequest.status.toLowerCase()}.</p>
					<p class="mt-2 text-sm opacity-75">Requested at {new Date(access.pendingRequest.requestedAt).toLocaleTimeString()} · {access.pendingRequest.estimatedReadyLabel}</p>
					<div class="mt-5 h-2 rounded-full bg-white/14">
						<div class="h-full w-2/3 rounded-full bg-pearl-beige"></div>
					</div>
				{:else}
					<p class="mt-3 text-sm leading-relaxed opacity-80">This media cannot be prepared right now. Preview artifacts remain available for review.</p>
				{/if}
			</div>
		</div>
	</div>
</section>
