<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';
	import ObjectThumbnail from '$lib/components/ObjectThumbnail.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';
	import type { ArchiveRequest } from '$lib/services/archiveRequests';
	import type {
		ObjectArtifact,
		ObjectAvailableFile,
		ObjectDetail,
	} from '$lib/services/objects';
	import type { FileStatus } from '$lib/types';
	import type { ActionData } from './$types';

	type TabId = 'files' | 'access' | 'requests' | 'raw';

	let {
		data,
		form
	} = $props<{
		data: {
			detail: ObjectDetail;
			artifacts: ObjectArtifact[];
			artifactsError: string | null;
			availableFiles: ObjectAvailableFile[];
			availableFilesError: string | null;
			pendingRequests: ArchiveRequest[];
			pendingRequestsError: string | null;
		};
		form?: ActionData;
	}>();

	const detail = $derived(data.detail);
	const artifacts = $derived(data.artifacts);
	const artifactsError = $derived(data.artifactsError);
	const availableFiles = $derived(data.availableFiles);
	const availableFilesError = $derived(data.availableFilesError);
	const pendingRequests = $derived(data.pendingRequests);
	const pendingRequestsError = $derived(data.pendingRequestsError);

	let activeTab = $state<TabId>('files');
	let showRawManifest = $state(false);
	let showResyncConfirm = $state(false);
	let resyncRunning = $state(false);
	let resyncMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	const runResync = async () => {
		showResyncConfirm = false;
		resyncRunning = true;
		resyncMessage = null;
		try {
			const response = await fetch(resolve('/objects/[objectId]/resync', { objectId: detail.objectId }), { method: 'POST' });
			if (response.status === 401) {
				window.location.href = resolve('/login');
				return;
			}
			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				resyncMessage = { type: 'error', text: payload?.error ?? t('objects.resync.failed') };
			} else {
				resyncMessage = { type: 'success', text: t('objects.resync.success') };
				await invalidateAll();
			}
		} catch {
			resyncMessage = { type: 'error', text: t('objects.resync.failed') };
		} finally {
			resyncRunning = false;
		}
	};

	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);

	const availabilityLabel = (value: ObjectDetail['availabilityState']): string => value.replace(/_/g, ' ');
	const processingLabel = (value: ObjectDetail['processingState']): string => value.replace(/_/g, ' ');
	const curationLabel = (value: ObjectDetail['curationState']): string => value.replace(/_/g, ' ');
	const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleString() : '-');

	const accessLevelLabel = (value: ObjectDetail['accessLevel']): string =>
		value === 'private'
			? t('ingestionSetup.batchIntent.accessLevels.private')
			: value === 'family'
				? t('ingestionSetup.batchIntent.accessLevels.family')
				: t('ingestionSetup.batchIntent.accessLevels.public');

	const toTone = (
		status: ObjectDetail['processingState'],
		curationState: ObjectDetail['curationState']
	): FileStatus => {
		if (status.endsWith('failed') || curationState.endsWith('failed')) return 'failed';
		if (curationState === 'needs_review' || curationState === 'review_in_progress') return 'needs-review';
		if (status === 'queued') return 'queued';
		if (status === 'index_done' || status === 'processing_skipped') return 'approved';
		return 'processing';
	};

	const stringifyPayload = (payload: unknown): string => {
		if (payload === null || typeof payload === 'undefined') {
			return t('values.unknown');
		}

		try {
			return JSON.stringify(payload, null, 2);
		} catch {
			return String(payload);
		}
	};

	const formatSize = (bytes: number): string => {
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		return `${(kb / 1024).toFixed(1)} MB`;
	};

	const formatOptionalSize = (bytes: number | null): string => (bytes === null ? '-' : formatSize(bytes));
	const asRecord = (value: unknown): Record<string, unknown> | null => {
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			return value as Record<string, unknown>;
		}
		return null;
	};

	const asText = (value: unknown): string | null => {
		if (typeof value !== 'string') {
			return null;
		}
		const normalized = value.trim();
		return normalized.length > 0 ? normalized : null;
	};

	const resolveDescription = (item: ObjectDetail): string | null => {
		const fromMetadata = asText(item.metadata.description) ?? asText(item.metadata.summary);
		if (fromMetadata) {
			return fromMetadata;
		}

		const manifest = asRecord(item.ingestManifest);
		const classification = manifest ? asRecord(manifest.classification) : null;
		return classification ? asText(classification.summary) : null;
	};

	const descriptionText = $derived(resolveDescription(detail));
	const displayTags = $derived.by(() => {
		const unique: string[] = [];
		for (const tag of detail.tags) {
			const normalized = tag.trim();
			if (normalized.length > 0 && !unique.includes(normalized)) {
				unique.push(normalized);
			}
		}
		return unique;
	});
	const displayTitle = $derived(
		detail.title ?? formatTemplate(t('objects.detail.untitled'), { suffix: detail.objectId.slice(-6) })
	);

	const tabIds: TabId[] = ['files', 'access', 'requests', 'raw'];
</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
		<div class="flex items-center justify-between gap-4">
			<a
				href={resolve('/objects')}
				class="flex items-center gap-1.5 text-[11px] text-text-muted transition-colors hover:text-blue-slate"
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-3.5 w-3.5 shrink-0" aria-hidden="true">
					<path d="M12 4L6 10L12 16" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				{t('objects.detail.back')}
			</a>
			<div class="flex items-center gap-3">
				{#if resyncMessage}
					<p class={`text-[11px] ${resyncMessage.type === 'success' ? 'text-blue-slate' : 'text-burnt-peach'}`}>
						{resyncMessage.text}
					</p>
				{/if}
				<button
					type="button"
					onclick={() => (showResyncConfirm = true)}
					disabled={resyncRunning}
					class="flex items-center gap-1.5 text-[11px] text-text-muted transition-colors hover:text-blue-slate disabled:cursor-not-allowed disabled:opacity-40"
				>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class={`h-3.5 w-3.5 shrink-0 ${resyncRunning ? 'animate-spin' : ''}`} aria-hidden="true">
						<path d="M4.5 10a5.5 5.5 0 1 1 1.4 3.7" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M4.5 14.5v-4h4" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{t('objects.resync.button')}
				</button>
			</div>
		</div>
		<h1 class="mt-4 font-display text-2xl text-text-ink">{displayTitle}</h1>
		<p class="mt-1 text-xs text-text-muted">{detail.objectId}</p>
		<div class="mt-3 flex flex-wrap items-center gap-2">
			<StatusBadge
				status={toTone(detail.processingState, detail.curationState)}
				label={processingLabel(detail.processingState)}
			/>
			<Chip class="border-blue-slate/30 bg-pale-sky/25 text-[10px] text-blue-slate">
				{availabilityLabel(detail.availabilityState)}
			</Chip>
			<Chip class="border-border-soft bg-alabaster-grey/60 text-[10px] text-text-muted">
				{accessLevelLabel(detail.accessLevel)}
			</Chip>
		</div>
	</section>

{#if showResyncConfirm}
	<button
		type="button"
		aria-label="Close"
		class="fixed inset-0 z-40 bg-blue-slate/35"
		onclick={() => (showResyncConfirm = false)}
	></button>
	<div class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.resync.confirmTitle')}</p>
		<p class="mt-3 text-sm text-text-muted">{t('objects.resync.confirmBody')}</p>
		<div class="mt-5 flex justify-end gap-3">
			<button
				type="button"
				onclick={() => (showResyncConfirm = false)}
				class="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted hover:border-blue-slate/35 hover:text-blue-slate"
			>
				{t('common.cancel')}
			</button>
			<button
				type="button"
				onclick={runResync}
				class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white hover:bg-blue-slate-mid-dark"
			>
				{t('common.confirm')}
			</button>
		</div>
	</div>
{/if}

	<section class="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
		<article class="rounded-2xl border border-border-soft bg-surface-white p-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.preview.title')}</p>
			<p class="mt-1 text-sm text-text-muted">{t('objects.detail.preview.subtitle')}</p>
			<ObjectThumbnail
				objectId={detail.objectId}
				thumbnailArtifactId={detail.thumbnailArtifactId}
				objectType={detail.type}
				class="mt-4 h-72 w-full"
			/>
		</article>

		<article class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.description.title')}</p>
			<p class="mt-3 text-sm leading-relaxed text-text-ink">
				{descriptionText ?? t('objects.detail.description.empty')}
			</p>
			{#if displayTags.length > 0}
				<div class="mt-4">
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">
						{t('objects.detail.description.tags')}
					</p>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each displayTags as tag (tag)}
							<Chip class="border-blue-slate/30 bg-pale-sky/20 text-[10px] text-blue-slate">{tag}</Chip>
						{/each}
					</div>
				</div>
			{/if}
			<div class="mt-5 grid gap-3 text-sm text-text-muted sm:grid-cols-2">
				<p>{t('objects.detail.provenance.type')}: <span class="text-text-ink">{detail.type}</span></p>
				<p>{t('objects.detail.access.language')}: <span class="text-text-ink">{detail.language ?? '-'}</span></p>
				<p>{t('objects.detail.provenance.created')}: <span class="text-text-ink">{formatDate(detail.createdAt)}</span></p>
				<p>{t('objects.detail.provenance.updated')}: <span class="text-text-ink">{formatDate(detail.updatedAt)}</span></p>
				{#if detail.sourceBatchLabel}
					<p>
						{t('objects.detail.provenance.batch')}: <span class="text-text-ink">{detail.sourceBatchLabel}</span>
					</p>
				{/if}
				{#if detail.sourceIngestionId}
					<p>
						{t('objects.detail.provenance.ingestion')}: <a href={resolve('/ingestion/[batchId]', { batchId: detail.sourceIngestionId })} class="text-blue-slate underline-offset-2 hover:underline">{detail.sourceIngestionId}</a>
					</p>
				{/if}
			</div>
		</article>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white">
		<div class="px-6 pt-5">
			<div class="inline-flex gap-0.5 rounded-xl bg-alabaster-grey/70 p-1">
				{#each tabIds as tab (tab)}
					<button
						type="button"
						onclick={() => {
							activeTab = tab;
						}}
						class={activeTab === tab
							? 'rounded-lg bg-surface-white px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate shadow-sm'
							: 'rounded-lg px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-text-muted transition-colors hover:text-text-ink'}
					>
						{t(`objects.detail.tabs.${tab}`)}
					</button>
				{/each}
			</div>
		</div>

		<div class="px-6 pb-6 pt-5">

		{#if activeTab === 'files'}
			<div class="grid gap-6 xl:grid-cols-2">
				<article>
					<div class="flex items-center justify-between gap-3">
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.artifacts.title')}</p>
						<p class="text-xs text-text-muted">
							{formatTemplate(t('objects.detail.artifacts.count'), { count: artifacts.length })}
						</p>
					</div>

					{#if artifactsError}
						<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
							{artifactsError}
						</p>
					{:else if artifacts.length === 0}
						<p class="mt-4 text-sm text-text-muted">{t('objects.detail.artifacts.empty')}</p>
					{:else}
						<div class="mt-4 space-y-3">
							{#each artifacts as artifact (artifact.id)}
								<div class="rounded-xl border border-border-soft bg-alabaster-grey/35 p-3">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div class="text-sm text-text-ink">
											<p class="font-medium">{artifact.kind}</p>
											<p class="text-xs text-text-muted">
												{artifact.variant ?? '-'} · {artifact.contentType} · {formatSize(artifact.sizeBytes)}
											</p>
											<p class="mt-1 text-xs text-text-muted">{formatDate(artifact.createdAt)}</p>
										</div>
										<a
											href={resolve('/objects/[objectId]/artifacts/[artifactId]/download', {
												objectId: detail.objectId,
												artifactId: artifact.id
											})}
											class="text-[11px] text-blue-slate underline-offset-2 hover:underline"
										>
											{t('objects.detail.artifacts.download')}
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</article>

				<article>
					<div class="flex items-center justify-between gap-3">
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">
							{t('objects.detail.availableFiles.title')}
						</p>
						<p class="text-xs text-text-muted">
							{formatTemplate(t('objects.detail.availableFiles.count'), {
								count: availableFiles.length
							})}
						</p>
					</div>

					{#if form?.message}
						<p class="mt-4 rounded-xl border border-blue-slate/35 bg-pale-sky/25 px-3 py-2 text-xs text-blue-slate">
							{form.message}
						</p>
					{/if}
					{#if form?.error}
						<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
							{form.error}
						</p>
					{/if}

					{#if availableFilesError}
						<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
							{availableFilesError}
						</p>
					{:else if availableFiles.length === 0}
						<p class="mt-4 text-sm text-text-muted">{t('objects.detail.availableFiles.empty')}</p>
					{:else}
						<div class="mt-4 space-y-3">
							{#each availableFiles as file (file.id)}
								<div class="rounded-xl border border-border-soft bg-alabaster-grey/35 p-3">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div class="text-sm text-text-ink">
											<p class="font-medium">{file.displayName}</p>
											<p class="text-xs text-text-muted">
												{file.artifactKind} · {file.variant ?? '-'} · {file.contentType ?? '-'} · {formatOptionalSize(file.sizeBytes)}
											</p>
											<p class="mt-1 text-xs text-text-muted">{formatDate(file.syncedAt)}</p>
										</div>
										<form method="POST" action="?/requestDownload">
											<input type="hidden" name="availableFileId" value={file.id} />
											<button
												type="submit"
												disabled={!file.isAvailable}
												class="text-[11px] text-blue-slate underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
											>
												{t('objects.detail.availableFiles.requestDownload')}
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</article>
			</div>
		{:else if activeTab === 'access'}
			<article>
				<div class="flex flex-wrap items-center gap-2">
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.access.title')}</p>
					{#if detail.canDownload}
						<Chip class="border-blue-slate/30 bg-pale-sky/20 text-blue-slate">
							{t('objects.detail.access.canDownload')}
						</Chip>
					{:else}
						<Chip class="border-burnt-peach/35 bg-pearl-beige text-burnt-peach">
							{t('objects.detail.access.restricted')}
						</Chip>
					{/if}
				</div>
				<p class="mt-3 text-sm text-text-muted">{t(`objects.table.reasons.${detail.accessReasonCode}`)}</p>
				<div class="mt-4 grid gap-3 text-sm text-text-muted sm:grid-cols-2">
					<p>{t('objects.detail.access.authorized')}: <span class="text-text-ink">{detail.isAuthorized ? t('objects.detail.common.yes') : t('objects.detail.common.no')}</span></p>
					<p>{t('objects.detail.access.deliverable')}: <span class="text-text-ink">{detail.isDeliverable ? t('objects.detail.common.yes') : t('objects.detail.common.no')}</span></p>
					<p>{t('objects.detail.access.embargoUntil')}: <span class="text-text-ink">{formatDate(detail.embargoUntil)}</span></p>
					<p>{t('objects.detail.metrics.curation')}: <span class="text-text-ink">{curationLabel(detail.curationState)}</span></p>
				</div>
				{#if detail.rightsNote}
					<p class="mt-3 text-sm text-text-muted">
						{t('objects.detail.access.rightsNote')}: <span class="text-text-ink">{detail.rightsNote}</span>
					</p>
				{/if}
				{#if detail.sensitivityNote}
					<p class="mt-2 text-sm text-text-muted">
						{t('objects.detail.access.sensitivityNote')}: <span class="text-text-ink">{detail.sensitivityNote}</span>
					</p>
				{/if}
			</article>
		{:else if activeTab === 'requests'}
			<section>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">
						{t('objects.detail.pendingRequests.title')}
					</p>
					<p class="text-xs text-text-muted">
						{formatTemplate(t('objects.detail.pendingRequests.count'), {
							count: pendingRequests.length
						})}
					</p>
				</div>

				{#if pendingRequestsError}
					<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
						{pendingRequestsError}
					</p>
				{:else if pendingRequests.length === 0}
					<p class="mt-4 text-sm text-text-muted">{t('objects.detail.pendingRequests.empty')}</p>
				{:else}
					<div class="mt-4 overflow-x-auto">
						<table class="min-w-full divide-y divide-border-soft text-left">
							<thead>
								<tr class="text-xs uppercase tracking-[0.2em] text-text-muted">
									<th class="py-3 pr-4">{t('objects.detail.pendingRequests.action')}</th>
									<th class="py-3 pr-4">{t('objects.detail.pendingRequests.status')}</th>
									<th class="py-3">{t('objects.detail.pendingRequests.requested')}</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border-soft">
								{#each pendingRequests as request (request.id)}
									<tr class="text-sm text-text-ink">
										<td class="py-3 pr-4">{request.actionType.replace(/_/g, ' ')}</td>
										<td class="py-3 pr-4">
											<span class="rounded-full border border-border-soft px-2 py-1 text-xs text-text-muted">
												{request.status}
											</span>
										</td>
										<td class="py-3">{formatDate(request.createdAt)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>
		{:else}
			<section>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.manifest.title')}</p>
				<p class="mt-1 text-sm text-text-muted">{t('objects.detail.manifest.subtitle')}</p>
				<button
					type="button"
					onclick={() => {
						showRawManifest = !showRawManifest;
					}}
					class="mt-4 text-[11px] text-blue-slate underline-offset-2 hover:underline"
				>
					{showRawManifest ? t('objects.detail.manifest.hide') : t('objects.detail.manifest.show')}
				</button>
				{#if showRawManifest}
					<pre class="mt-4 overflow-x-auto rounded-xl border border-border-soft bg-alabaster-grey/40 p-4 text-xs text-text-muted">{stringifyPayload(detail.ingestManifest)}</pre>
				{/if}
			</section>
		{/if}

		</div>
	</section>
</main>
