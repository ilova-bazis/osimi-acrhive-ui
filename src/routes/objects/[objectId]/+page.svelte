<script lang="ts">
	import { resolve } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';
	import type { ObjectRow } from '$lib/services/objects';
	import type { FileStatus } from '$lib/types';
import type { ActionData } from './$types';

	type ObjectDetail = ObjectRow & {
		ingestManifest: Record<string, unknown> | null;
		isAuthorized: boolean;
		isDeliverable: boolean;
	};

	type ObjectArtifact = {
		id: string;
		kind: string;
		variant: string | null;
		storageKey: string;
		contentType: string;
		sizeBytes: number;
		createdAt: string;
	};

	type ObjectAvailableFile = {
		id: string;
		archiveFileKey: string;
		artifactKind: string;
		variant: string | null;
		displayName: string;
		contentType: string | null;
		sizeBytes: number | null;
		checksumSha256: string | null;
		metadata: Record<string, unknown>;
		isAvailable: boolean;
		syncedAt: string;
	};

	type ObjectDownloadRequest = {
		id: string;
		availableFileId: string;
		requestedBy: string;
		artifactKind: string;
		variant: string | null;
		status: string;
		failureReason: string | null;
		createdAt: string;
		updatedAt: string;
		completedAt: string | null;
	};

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
			downloadRequests: ObjectDownloadRequest[];
			downloadRequestsError: string | null;
		};
		form?: ActionData;
	}>();

	const detail = $derived(data.detail);
	const artifacts = $derived(data.artifacts);
	const artifactsError = $derived(data.artifactsError);
	const availableFiles = $derived(data.availableFiles);
	const availableFilesError = $derived(data.availableFilesError);
	const downloadRequests = $derived(data.downloadRequests);
	const downloadRequestsError = $derived(data.downloadRequestsError);
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

	const toTone = (status: ObjectDetail['processingState'], curationState: ObjectDetail['curationState']): FileStatus => {
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

	const isCompletedRequest = (status: string): boolean => status === 'COMPLETED';

</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<section class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.title')}</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">
				{detail.title ?? formatTemplate(t('objects.detail.untitled'), { suffix: detail.objectId.slice(-6) })}
			</h2>
			<p class="mt-1 text-xs text-text-muted">{detail.objectId}</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href={resolve('/objects')}
				class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
			>
				{t('objects.detail.back')}
			</a>
		</div>
	</section>

	<section class="grid gap-3 md:grid-cols-4">
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.metrics.processing')}</p>
			<div class="mt-2">
				<StatusBadge
					status={toTone(detail.processingState, detail.curationState)}
					label={processingLabel(detail.processingState)}
				/>
			</div>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.metrics.curation')}</p>
			<p class="mt-2 text-sm text-text-ink">{curationLabel(detail.curationState)}</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.metrics.availability')}</p>
			<p class="mt-2 text-sm text-text-ink">{availabilityLabel(detail.availabilityState)}</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.metrics.access')}</p>
			<p class="mt-2 text-sm text-text-ink">{accessLevelLabel(detail.accessLevel)}</p>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
		<article class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
			<div class="flex flex-wrap items-center gap-2">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.access.title')}</p>
				{#if detail.canDownload}
					<Chip class="border-blue-slate/30 bg-pale-sky/20 text-blue-slate">{t('objects.detail.access.canDownload')}</Chip>
				{:else}
					<Chip class="border-burnt-peach/35 bg-pearl-beige text-burnt-peach">{t('objects.detail.access.restricted')}</Chip>
				{/if}
			</div>
			<p class="mt-3 text-sm text-text-muted">{t(`objects.table.reasons.${detail.accessReasonCode}`)}</p>
			<div class="mt-4 grid gap-3 text-sm text-text-muted sm:grid-cols-2">
				<p>{t('objects.detail.access.authorized')}: <span class="text-text-ink">{detail.isAuthorized ? t('objects.detail.common.yes') : t('objects.detail.common.no')}</span></p>
				<p>{t('objects.detail.access.deliverable')}: <span class="text-text-ink">{detail.isDeliverable ? t('objects.detail.common.yes') : t('objects.detail.common.no')}</span></p>
				<p>{t('objects.detail.access.embargoUntil')}: <span class="text-text-ink">{formatDate(detail.embargoUntil)}</span></p>
				<p>{t('objects.detail.access.language')}: <span class="text-text-ink">{detail.language ?? '-'}</span></p>
			</div>
			{#if detail.rightsNote}
				<p class="mt-3 text-sm text-text-muted">{t('objects.detail.access.rightsNote')}: <span class="text-text-ink">{detail.rightsNote}</span></p>
			{/if}
			{#if detail.sensitivityNote}
				<p class="mt-2 text-sm text-text-muted">{t('objects.detail.access.sensitivityNote')}: <span class="text-text-ink">{detail.sensitivityNote}</span></p>
			{/if}
		</article>

		<article class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.provenance.title')}</p>
			<div class="mt-4 space-y-2 text-sm text-text-muted">
				<p>{t('objects.detail.provenance.created')}: <span class="text-text-ink">{formatDate(detail.createdAt)}</span></p>
				<p>{t('objects.detail.provenance.updated')}: <span class="text-text-ink">{formatDate(detail.updatedAt)}</span></p>
				<p>{t('objects.detail.provenance.type')}: <span class="text-text-ink">{detail.type}</span></p>
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

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.artifacts.title')}</p>
			<p class="text-xs text-text-muted">{formatTemplate(t('objects.detail.artifacts.count'), { count: artifacts.length })}</p>
		</div>

		{#if artifactsError}
			<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
				{artifactsError}
			</p>
		{:else if artifacts.length === 0}
			<p class="mt-4 text-sm text-text-muted">{t('objects.detail.artifacts.empty')}</p>
		{:else}
			<div class="mt-4 overflow-x-auto">
				<table class="min-w-full divide-y divide-border-soft text-left">
					<thead>
						<tr class="text-xs uppercase tracking-[0.2em] text-text-muted">
							<th class="py-3 pr-4">{t('objects.detail.artifacts.kind')}</th>
							<th class="py-3 pr-4">{t('objects.detail.artifacts.variant')}</th>
							<th class="py-3 pr-4">{t('objects.detail.artifacts.contentType')}</th>
							<th class="py-3 pr-4">{t('objects.detail.artifacts.size')}</th>
							<th class="py-3 pr-4">{t('objects.detail.artifacts.created')}</th>
							<th class="py-3">{t('objects.detail.artifacts.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-soft">
						{#each artifacts as artifact (artifact.id)}
							<tr class="text-sm text-text-ink">
								<td class="py-3 pr-4">{artifact.kind}</td>
								<td class="py-3 pr-4">{artifact.variant ?? '-'}</td>
								<td class="py-3 pr-4">{artifact.contentType}</td>
								<td class="py-3 pr-4">{formatSize(artifact.sizeBytes)}</td>
								<td class="py-3 pr-4">{formatDate(artifact.createdAt)}</td>
								<td class="py-3">
									<a
										href={resolve('/objects/[objectId]/artifacts/[artifactId]/download', {
											objectId: detail.objectId,
											artifactId: artifact.id
										})}
										class="inline-flex rounded-full border border-blue-slate px-3 py-1 text-xs uppercase tracking-[0.18em] text-blue-slate"
									>
										{t('objects.detail.artifacts.download')}
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.availableFiles.title')}</p>
			<p class="text-xs text-text-muted">{formatTemplate(t('objects.detail.availableFiles.count'), { count: availableFiles.length })}</p>
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
			<div class="mt-4 overflow-x-auto">
				<table class="min-w-full divide-y divide-border-soft text-left">
					<thead>
						<tr class="text-xs uppercase tracking-[0.2em] text-text-muted">
							<th class="py-3 pr-4">{t('objects.detail.availableFiles.displayName')}</th>
							<th class="py-3 pr-4">{t('objects.detail.availableFiles.kind')}</th>
							<th class="py-3 pr-4">{t('objects.detail.availableFiles.variant')}</th>
							<th class="py-3 pr-4">{t('objects.detail.availableFiles.contentType')}</th>
							<th class="py-3 pr-4">{t('objects.detail.availableFiles.size')}</th>
							<th class="py-3 pr-4">{t('objects.detail.availableFiles.syncedAt')}</th>
							<th class="py-3">{t('objects.detail.availableFiles.actions')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-soft">
						{#each availableFiles as file (file.id)}
							<tr class="text-sm text-text-ink">
								<td class="py-3 pr-4">{file.displayName}</td>
								<td class="py-3 pr-4">{file.artifactKind}</td>
								<td class="py-3 pr-4">{file.variant ?? '-'}</td>
								<td class="py-3 pr-4">{file.contentType ?? '-'}</td>
								<td class="py-3 pr-4">{formatOptionalSize(file.sizeBytes)}</td>
								<td class="py-3 pr-4">{formatDate(file.syncedAt)}</td>
								<td class="py-3">
									<form method="POST" action="?/requestDownload">
										<input type="hidden" name="availableFileId" value={file.id} />
										<button
											type="submit"
											disabled={!file.isAvailable}
											class="inline-flex rounded-full border border-blue-slate px-3 py-1 text-xs uppercase tracking-[0.18em] text-blue-slate disabled:cursor-not-allowed disabled:opacity-40"
										>
											{t('objects.detail.availableFiles.requestDownload')}
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.downloadRequests.title')}</p>
			<p class="text-xs text-text-muted">{formatTemplate(t('objects.detail.downloadRequests.count'), { count: downloadRequests.length })}</p>
		</div>

		{#if downloadRequestsError}
			<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
				{downloadRequestsError}
			</p>
		{:else if downloadRequests.length === 0}
			<p class="mt-4 text-sm text-text-muted">{t('objects.detail.downloadRequests.empty')}</p>
		{:else}
			<div class="mt-4 overflow-x-auto">
				<table class="min-w-full divide-y divide-border-soft text-left">
					<thead>
						<tr class="text-xs uppercase tracking-[0.2em] text-text-muted">
							<th class="py-3 pr-4">{t('objects.detail.downloadRequests.kind')}</th>
							<th class="py-3 pr-4">{t('objects.detail.downloadRequests.variant')}</th>
							<th class="py-3 pr-4">{t('objects.detail.downloadRequests.status')}</th>
							<th class="py-3 pr-4">{t('objects.detail.downloadRequests.created')}</th>
							<th class="py-3 pr-4">{t('objects.detail.downloadRequests.updated')}</th>
							<th class="py-3">{t('objects.detail.downloadRequests.completed')}</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-soft">
						{#each downloadRequests as request (request.id)}
							<tr class="text-sm text-text-ink">
								<td class="py-3 pr-4">{request.artifactKind}</td>
								<td class="py-3 pr-4">{request.variant ?? '-'}</td>
								<td class="py-3 pr-4">
									<span class={isCompletedRequest(request.status)
										? 'rounded-full border border-blue-slate/35 bg-pale-sky/30 px-2 py-1 text-xs text-blue-slate'
										: 'rounded-full border border-border-soft px-2 py-1 text-xs text-text-muted'}>
										{request.status}
									</span>
								</td>
								<td class="py-3 pr-4">{formatDate(request.createdAt)}</td>
								<td class="py-3 pr-4">{formatDate(request.updatedAt)}</td>
								<td class="py-3">{formatDate(request.completedAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.manifest.title')}</p>
		<p class="mt-1 text-sm text-text-muted">{t('objects.detail.manifest.subtitle')}</p>
		<pre class="mt-4 overflow-x-auto rounded-xl border border-border-soft bg-alabaster-grey/40 p-4 text-xs text-text-muted">{stringifyPayload(detail.ingestManifest)}</pre>
	</section>
</main>
