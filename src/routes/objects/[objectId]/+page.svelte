<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Chip from '$lib/components/Chip.svelte';
	import ObjectDetailInfoDrawer from '$lib/components/object-detail/ObjectDetailInfoDrawer.svelte';
	import ObjectDetailTopBar from '$lib/components/object-detail/ObjectDetailTopBar.svelte';
	import ObjectSupportSheet from '$lib/components/object-detail/ObjectSupportSheet.svelte';
	import ObjectViewerCanvas from '$lib/components/object-detail/ObjectViewerCanvas.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';
	import type { ArchiveRequest } from '$lib/services/archiveRequests';
	import type {
		ObjectArtifact,
		ObjectAvailableFile,
		ObjectDetail
	} from '$lib/services/objects';
	import type { FileStatus } from '$lib/types';
	import type { ActionData } from './$types';

	type TabId = 'files' | 'access' | 'requests' | 'raw';
	type SupportSheetState = 'hidden' | 'peek' | 'expanded';

	type ObjectViewer = {
		mediaType: 'document' | 'image' | 'audio' | 'video';
		primarySource: {
			status: 'available' | 'request_required' | 'request_pending' | 'restricted' | 'temporarily_unavailable';
			availableFileId: string | null;
		};
	};

	let {
		data,
		form
	} = $props<{
		data: {
			detail: ObjectDetail;
			viewer: ObjectViewer | null;
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
	const viewer = $derived(data.viewer);
	const artifacts = $derived(data.artifacts);
	const artifactsError = $derived(data.artifactsError);
	const availableFiles = $derived(data.availableFiles);
	const availableFilesError = $derived(data.availableFilesError);
	const pendingRequests = $derived(data.pendingRequests);
	const pendingRequestsError = $derived(data.pendingRequestsError);

	let activeTab = $state<TabId>('files');
	let supportSheetState = $state<SupportSheetState>('hidden');
	let infoOpen = $state(false);
	let showRawManifest = $state(false);
	let showResyncConfirm = $state(false);
	let resyncRunning = $state(false);
	let resyncMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let requestForm = $state<HTMLFormElement | null>(null);

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
	const reviewLabel = $derived.by(() => {
		if (viewer?.primarySource.status === 'available') return 'Media available in read-only mode';
		if (viewer?.primarySource.status === 'request_pending') return 'Primary media request in progress';
		if (viewer?.primarySource.status === 'request_required') return 'Primary media available on request';
		if (viewer?.primarySource.status === 'restricted') return 'Preview artifacts only';
		return 'Read-only object inspection';
	});
	const mediaTypeLabel = $derived(viewer?.mediaType ?? detail.type.toLowerCase());
	const pageBgClass = $derived.by(() => {
		if (viewer?.mediaType === 'document') return 'bg-[linear-gradient(180deg,#f5f2eb_0%,#edf1f2_100%)]';
		if (viewer?.mediaType === 'audio') return 'bg-[#1f2f38]';
		return 'bg-[#0a0f12]';
	});
	const introTextClass = $derived.by(() =>
		viewer?.mediaType === 'document' ? 'text-text-muted' : 'text-white/65'
	);
	const introLabelClass = $derived.by(() =>
		viewer?.mediaType === 'document' ? 'text-blue-slate' : 'text-white/45'
	);
	const requestableAvailableFileId = $derived(viewer?.primarySource.availableFileId ?? '');
	const requestPrimaryMedia = (): void => {
		(requestForm as HTMLFormElement | null)?.requestSubmit();
	};

	$effect(() => {
		if (viewer?.primarySource.status !== 'request_pending') return;

		const interval = window.setInterval(() => {
			void invalidateAll();
		}, 12000);

		return () => {
			window.clearInterval(interval);
		};
	});

	const tabIds: TabId[] = ['files', 'access', 'requests', 'raw'];
	const activeTabLabel = $derived(t(`objects.detail.tabs.${activeTab}`));
	const supportVariant = $derived(viewer?.mediaType === 'document' ? 'light' : 'dark');

	const handleTabSelect = (tab: TabId): void => {
		if (activeTab !== tab) {
			activeTab = tab;
			if (supportSheetState === 'hidden') {
				supportSheetState = 'expanded';
			}
			return;
		}

		if (supportSheetState === 'hidden') supportSheetState = 'expanded';
		else if (supportSheetState === 'peek' || supportSheetState === 'expanded') supportSheetState = 'hidden';
	};
</script>

<ObjectDetailTopBar
	backHref={resolve('/objects')}
	title={displayTitle}
	objectId={detail.objectId}
	processingLabel={processingLabel(detail.processingState)}
	processingTone={toTone(detail.processingState, detail.curationState)}
	availabilityLabel={availabilityLabel(detail.availabilityState)}
	accessLevelLabel={accessLevelLabel(detail.accessLevel)}
	reviewLabel={reviewLabel}
	onInfoToggle={() => (infoOpen = !infoOpen)}
	onResync={() => (showResyncConfirm = true)}
	{resyncRunning}
	{resyncMessage}
/>


<main class={`min-h-screen ${pageBgClass}`}>
	<div class="mx-auto flex max-w-[96rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
		<div class="max-w-3xl">
			<p class={`text-xs uppercase tracking-[0.2em] ${introLabelClass}`}>{mediaTypeLabel} object</p>
			<p class={`mt-2 text-sm leading-relaxed ${introTextClass}`}>{descriptionText ?? 'Read-only object inspection with media-first access, preview artifacts, and request-aware behavior.'}</p>
			<div class="mt-4 flex flex-wrap items-center gap-2">
				<Chip class="border-border-soft bg-surface-white/80 text-[10px] uppercase tracking-[0.18em] text-text-muted">View mode</Chip>
				{#if viewer}
					<Chip class="border-blue-slate/20 bg-pale-sky/18 text-[10px] uppercase tracking-[0.18em] text-blue-slate">{viewer.mediaType}</Chip>
				{/if}
				{#if viewer?.primarySource.status === 'request_required'}
					<Chip class="border-pearl-beige bg-pearl-beige/60 text-[10px] uppercase tracking-[0.18em] text-blue-slate">Request required</Chip>
				{:else if viewer?.primarySource.status === 'request_pending'}
					<Chip class="border-blue-slate/20 bg-alabaster-grey/80 text-[10px] uppercase tracking-[0.18em] text-blue-slate">Request pending</Chip>
				{:else if viewer?.primarySource.status === 'available'}
					<Chip class="border-blue-slate/20 bg-pale-sky/18 text-[10px] uppercase tracking-[0.18em] text-blue-slate">Available now</Chip>
				{/if}
			</div>
		</div>

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

		<section class="space-y-4">
			{#if form?.message}
				<p class="rounded-xl border border-blue-slate/35 bg-pale-sky/25 px-4 py-3 text-sm text-blue-slate">
					{form.message}
				</p>
			{/if}
			{#if form?.error}
				<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-4 py-3 text-sm text-burnt-peach">
					{form.error}
				</p>
			{/if}
			<form bind:this={requestForm} method="POST" action="?/requestDownload" class="hidden">
				<input type="hidden" name="availableFileId" value={requestableAvailableFileId} />
			</form>
			<ObjectViewerCanvas
				objectId={detail.objectId}
				title={displayTitle}
				{viewer}
				onRequest={requestPrimaryMedia}
			/>
		</section>

		<section class="pb-24">
		{#if supportSheetState === 'hidden'}
			<div class="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4">
				<button
					type="button"
					onclick={() => (supportSheetState = 'expanded')}
					class={`pointer-events-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition ${supportVariant === 'dark' ? 'border-white/10 bg-black/30 text-white/70 hover:bg-white/10 hover:text-white' : 'border-border-soft bg-surface-white/80 text-text-muted hover:border-blue-slate/35 hover:text-blue-slate'}`}
				>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4" aria-hidden="true">
						<path d="M10 3v14M3 10h14" stroke-linecap="round" />
					</svg>
					Support
				</button>
			</div>
		{/if}

		<ObjectSupportSheet
			state={supportSheetState}
			title={activeTabLabel}
			variant={supportVariant}
			activeTab={activeTab}
			tabs={tabIds.map((id) => ({ id, label: t(`objects.detail.tabs.${id}`) }))}
			onStateChange={(state) => (supportSheetState = state)}
			onTabChange={(tabId) => handleTabSelect(tabId as TabId)}
		>
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
						<div class="mt-4 divide-y divide-border-soft/70 rounded-xl border border-border-soft/70 bg-transparent">
							{#each artifacts as artifact (artifact.id)}
								<div class="p-3 first:rounded-t-xl last:rounded-b-xl">
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
						<div class="mt-4 divide-y divide-border-soft/70 rounded-xl border border-border-soft/70 bg-transparent">
							{#each availableFiles as file (file.id)}
								<div class="p-3 first:rounded-t-xl last:rounded-b-xl">
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
		</ObjectSupportSheet>
	</section>
	</div>
</main>

<ObjectDetailInfoDrawer
	open={infoOpen}
	title={displayTitle}
	description={descriptionText}
	tags={displayTags}
	type={detail.type}
	language={detail.language}
	createdAt={formatDate(detail.createdAt)}
	updatedAt={formatDate(detail.updatedAt)}
	sourceBatchLabel={detail.sourceBatchLabel}
	sourceIngestionId={detail.sourceIngestionId}
	rightsNote={detail.rightsNote}
	sensitivityNote={detail.sensitivityNote}
	onClose={() => (infoOpen = false)}
/>
