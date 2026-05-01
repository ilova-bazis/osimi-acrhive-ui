<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import Stepper from '$lib/components/Stepper.svelte';
	import Stamp from '$lib/components/Stamp.svelte';
	import FootnoteBar from '$lib/components/FootnoteBar.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const batchId = $derived(data.batchId);
	const batchTitle = $derived(
		typeof data.summary?.title === 'string' && data.summary.title.trim()
			? data.summary.title.trim()
			: data.batchLabel || batchId
	);

	let confirmed = $state(false);
	let submitting = $state(false);
	let submitError = $state('');

	const STEPS = [
		{ id: 'configure', label: 'Configure' },
		{ id: 'upload', label: 'Upload' },
		{ id: 'review', label: 'Review' },
	];

	const FILE_PREVIEW_LIMIT = 8;

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
	};

	const kindLabel = (kind: string): string => ({
		scanned_document: 'Newspaper',
		photo: 'Photograph',
		audio: 'Audio',
		video: 'Video',
		document: 'Document',
		other: 'Other',
	}[kind] ?? kind);

	const presetLabel = (preset: string): string => ({
		auto: 'Auto',
		ocr_text: 'OCR + Index',
		audio_transcript: 'Transcribe',
		none: 'Store only',
	}[preset] ?? preset);

	const visibilityLabel = (level: string): string => ({
		private: 'Private',
		family: 'Team',
		public: 'Public',
	}[level] ?? level);

	const setupEndpoint = $derived(
		resolve('/ingestion/[batchId]/setup', { batchId })
	);

	const beginProcessing = async () => {
		if (!confirmed || submitting) return;
		submitting = true;
		submitError = '';
		try {
			const res = await fetch(setupEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'submit' }),
			});
			if (res.status === 401) {
				await goto(resolve('/login'));
				return;
			}
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error((body as { error?: string }).error ?? 'Failed to submit ingestion.');
			}
			await goto(resolve('/ingestion'));
		} catch (err) {
			submitError = err instanceof Error ? err.message : 'Failed to submit ingestion.';
		} finally {
			submitting = false;
		}
	};
</script>

<div class="flex flex-col min-h-screen">

<!-- Sticky top-bar -->
<header class="sticky top-0 z-20 border-b border-border-soft bg-alabaster-grey px-4 sm:px-6 py-4">
	<div class="mx-auto flex w-full max-w-6xl items-start justify-between gap-6">
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2 text-xs text-text-muted">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingestion</span>
				<Icon name="chevron-r" size={12} />
				<span class="font-mono text-xs">{batchId}</span>
				<Icon name="chevron-r" size={12} />
				<span>Review</span>
			</div>
			<h1 class="font-display text-2xl text-text-ink m-0 leading-tight">{batchTitle}</h1>
		</div>
		<div class="flex items-center gap-3 pt-1 flex-shrink-0">
			<Stamp>Ready to submit</Stamp>
			<a
				href={resolve('/ingestion')}
				class="inline-flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
			>
				<Icon name="x" size={13} /> Discard
			</a>
		</div>
	</div>
</header>

<!-- Body: 2-column -->
<div class="flex-1 grid overflow-hidden mx-auto w-full max-w-6xl" style="grid-template-columns: 1fr 380px">

	<!-- Left: main review content -->
	<div class="overflow-y-auto px-6 py-8 flex flex-col gap-6 border-r border-border-soft">

		<div class="flex flex-col gap-1">
			<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Step 03 — Review what will run</span>
			<p class="text-sm text-text-muted leading-relaxed max-w-prose">
				Check the summary below before beginning. Once submitted, files will be uploaded and the selected pipelines will run automatically.
			</p>
		</div>

		<!-- Stats grid -->
		<div class="grid grid-cols-4 border border-border-soft rounded-2xl overflow-hidden">
			{#each [
				{ label: 'Files included', value: String(data.enabledFiles.length), sub: data.skippedFiles.length > 0 ? `${data.skippedFiles.length} skipped` : 'all included' },
				{ label: 'Total volume', value: formatBytes(data.totalSizeBytes), sub: 'to upload' },
				{ label: 'Language', value: data.languageCode.toUpperCase(), sub: 'primary' },
				{ label: 'Pipeline', value: presetLabel(data.pipelinePreset), sub: 'preset' },
			] as stat, i (stat.label)}
				<div class={`px-5 py-4 flex flex-col gap-1 ${i < 3 ? 'border-r border-border-soft' : ''}`}>
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{stat.label}</span>
					<span class="font-display text-2xl text-text-ink leading-tight">{stat.value}</span>
					<span class="text-xs text-text-muted">{stat.sub}</span>
				</div>
			{/each}
		</div>

		<!-- Pipeline flow -->
		<div class="flex flex-col gap-2">
			<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Pipeline</span>
			<div class="flex items-center gap-2 flex-wrap">
				<div class="flex items-center gap-[6px] bg-surface-white border border-border-soft rounded-xl px-3 py-2">
					<Icon name="upload" size={13} />
					<span class="text-xs text-text-ink">Upload</span>
				</div>
				<span class="text-text-muted flex-shrink-0"><Icon name="chevron-r" size={13} /></span>
				{#if data.pipelinePreset === 'ocr_text' || data.pipelinePreset === 'auto'}
					<div class="flex items-center gap-[6px] bg-pale-sky/20 border border-blue-slate/20 rounded-xl px-3 py-2">
						<Icon name="sparkle" size={13} />
						<span class="text-xs text-text-ink">OCR</span>
					</div>
					<span class="text-text-muted flex-shrink-0"><Icon name="chevron-r" size={13} /></span>
				{/if}
				{#if data.pipelinePreset === 'audio_transcript' || data.pipelinePreset === 'auto'}
					<div class="flex items-center gap-[6px] bg-pale-sky/20 border border-blue-slate/20 rounded-xl px-3 py-2">
						<Icon name="audio" size={13} />
						<span class="text-xs text-text-ink">Transcribe</span>
					</div>
					<span class="text-text-muted flex-shrink-0"><Icon name="chevron-r" size={13} /></span>
				{/if}
				<div class="flex items-center gap-[6px] bg-pearl-beige/40 border border-burnt-peach/30 rounded-xl px-3 py-2">
					<Icon name="archive" size={13} />
					<span class="text-xs text-text-ink">Archive</span>
				</div>
			</div>
		</div>

		<!-- Files table -->
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<span class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">Files</span>
				{#if data.skippedFiles.length > 0}
					<Chip variant="peach">{data.skippedFiles.length} skipped</Chip>
				{/if}
			</div>

			<div class="border border-border-soft rounded-2xl overflow-hidden">
				<!-- Header -->
				<div class="grid px-4 py-2 bg-alabaster-grey border-b border-border-soft" style="grid-template-columns: 1fr 80px 60px">
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted">Name</span>
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted text-right">Size</span>
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted text-right">Status</span>
				</div>

				{#each data.enabledFiles.slice(0, FILE_PREVIEW_LIMIT) as file (file.id)}
					<div class="grid px-4 py-[10px] border-b border-border-soft last:border-b-0 items-center" style="grid-template-columns: 1fr 80px 60px">
						<span class="text-sm text-text-ink truncate pr-4">{file.name}</span>
						<span class="font-mono text-xs text-text-muted text-right">{file.sizeBytes != null ? formatBytes(file.sizeBytes) : '—'}</span>
						<div class="flex justify-end">
							<Chip variant="ok">{file.status}</Chip>
						</div>
					</div>
				{/each}

				{#if data.enabledFiles.length > FILE_PREVIEW_LIMIT}
					<div class="px-4 py-3 text-xs text-text-muted border-t border-border-soft">
						+{data.enabledFiles.length - FILE_PREVIEW_LIMIT} more file{data.enabledFiles.length - FILE_PREVIEW_LIMIT === 1 ? '' : 's'}
					</div>
				{/if}

				{#if data.enabledFiles.length === 0}
					<div class="px-4 py-6 text-sm text-text-muted text-center">No files to process.</div>
				{/if}
			</div>
		</div>

		{#if submitError}
			<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-4 py-3 text-xs text-burnt-peach">
				{submitError}
			</p>
		{/if}

		<!-- Confirm block -->
		<div class="bg-surface-white border border-border-soft rounded-2xl p-5 flex flex-col gap-3">
			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={confirmed}
					class="mt-[3px] flex-shrink-0 w-4 h-4 accent-blue-slate-deep cursor-pointer"
				/>
				<div class="flex flex-col gap-1">
					<span class="font-display text-base text-text-ink leading-snug">
						I understand what will be processed and want to begin.
					</span>
					<span class="text-sm text-text-muted leading-relaxed">
						Files will be uploaded and pipelines will run. This action cannot be undone without canceling the batch.
					</span>
				</div>
			</label>
		</div>

	</div>

	<!-- Right: summary rail -->
	<div class="overflow-y-auto bg-pale-sky/10 border-l border-border-soft px-6 py-8 flex flex-col gap-6">

		<div class="flex flex-col gap-2">
			<Stamp>Ready to submit</Stamp>
			<h2 class="font-display text-2xl text-text-ink leading-snug m-0">{batchTitle}</h2>
		</div>

		<hr class="border-border-soft m-0" />

		<!-- Batch metadata -->
		<div class="flex flex-col gap-3">
			{#each [
				{ label: 'Kind', value: kindLabel(data.itemKind) },
				{ label: 'Language', value: data.languageCode.toUpperCase() },
				{ label: 'Pipeline', value: presetLabel(data.pipelinePreset) },
				{ label: 'Visibility', value: visibilityLabel(data.accessLevel) },
			] as row (row.label)}
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs uppercase tracking-[0.2em] text-text-muted">{row.label}</span>
					<span class="text-sm text-text-ink font-medium">{row.value}</span>
				</div>
			{/each}
		</div>

		<hr class="border-border-soft m-0" />

		<!-- File stats -->
		<div class="flex flex-col gap-3">
			<span class="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">Counts</span>
			{#each [
				{ label: 'Files to process', value: String(data.enabledFiles.length) },
				{ label: 'Skipped', value: String(data.skippedFiles.length) },
				{ label: 'Total upload', value: formatBytes(data.totalSizeBytes) },
				{ label: 'Objects', value: String(data.items.length) },
			] as row (row.label)}
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs text-text-muted">{row.label}</span>
					<span class="font-mono text-xs text-text-ink">{row.value}</span>
				</div>
			{/each}
		</div>

		<hr class="border-border-soft m-0" />

		<!-- Pipeline footprint -->
		<div class="flex flex-col gap-3">
			<span class="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">Pipeline footprint</span>
			{#if data.pipelinePreset === 'none'}
				<span class="text-sm text-text-muted">Store only — no AI processing.</span>
			{:else}
				<div class="flex flex-wrap gap-2">
					<Chip variant="sky">Upload</Chip>
					{#if data.pipelinePreset === 'auto' || data.pipelinePreset === 'ocr_text'}
						<Chip variant="sky">OCR</Chip>
						<Chip variant="sky">Index</Chip>
					{/if}
					{#if data.pipelinePreset === 'auto' || data.pipelinePreset === 'audio_transcript'}
						<Chip variant="sky">Transcribe</Chip>
					{/if}
					<Chip variant="sky">Archive</Chip>
				</div>
			{/if}
		</div>

	</div>

</div>

<!-- Footer -->
<FootnoteBar>
	{#snippet left()}
		<span class="whitespace-nowrap text-xs uppercase tracking-[0.2em] text-text-muted">Step 3 of 3</span>
		<span class="hidden sm:flex">
			<Stepper
				steps={STEPS}
				current={2}
				onJump={(i) => {
					if (i === 0) goto(resolve('/ingestion/new'));
					else if (i === 1) goto(resolve('/ingestion/[batchId]/setup', { batchId }));
				}}
			/>
		</span>
	{/snippet}
	{#snippet right()}
		<a
			href={resolve('/ingestion/[batchId]/setup', { batchId })}
			class="inline-flex items-center gap-2 rounded-full border border-border-soft px-5 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:bg-pale-sky/20 hover:text-text-ink transition-all"
		>
			<Icon name="arrow-l" size={13} /> Back to setup
		</a>
		<button
			disabled={!confirmed || submitting}
			onclick={beginProcessing}
			class="inline-flex items-center gap-2 rounded-full bg-burnt-peach text-surface-white px-5 py-2 text-xs uppercase tracking-[0.2em] border border-burnt-peach transition-all disabled:opacity-40 disabled:pointer-events-none"
		>
			{submitting ? 'Submitting…' : 'Begin processing'}
			<Icon name="arrow-r" size={13} />
		</button>
	{/snippet}
</FootnoteBar>

</div>
