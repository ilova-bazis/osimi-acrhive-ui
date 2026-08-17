<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BaseDialog from '$lib/components/BaseDialog.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import ObjectDetailInfoDrawer from '$lib/components/object-detail/ObjectDetailInfoDrawer.svelte';
	import ObjectDetailTopBar from '$lib/components/object-detail/ObjectDetailTopBar.svelte';
	import ObjectSupportSheet from '$lib/components/object-detail/ObjectSupportSheet.svelte';
	import ObjectViewerCanvas from '$lib/components/object-detail/ObjectViewerCanvas.svelte';
	import { formatCount, formatDateTime, formatFileSize } from '$lib/i18n/format';
	import {
		availabilityStateKeys,
		curationStateKeys,
		knownMediaTypeKey,
		knownRequestActionKey,
		mediaTypeKeys,
		processingStateKeys,
		requestStatusKeys
	} from '$lib/i18n/domainLabels';
	import { locale } from '$lib/i18n/locale';
	import { translations, type TranslationKey } from '$lib/i18n/translations';
	import { formatPlural, formatTemplate, translate } from '$lib/i18n/translate';
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
			backHref: string;
			viewer: ObjectViewer | null;
			artifacts: ObjectArtifact[];
			artifactsError: { code: 'loadFailed'; requestId: string | null } | null;
			availableFiles: ObjectAvailableFile[];
			availableFilesError: { code: 'loadFailed'; requestId: string | null } | null;
			pendingRequests: ArchiveRequest[];
			pendingRequestsError: { code: 'loadFailed'; requestId: string | null } | null;
			session?: { role: string } | null;
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
	const t = (key: TranslationKey) => translate(dictionary, key);

	const availabilityLabel = (value: ObjectDetail['availabilityState']): string =>
		t(availabilityStateKeys[value]);
	const processingLabel = (value: ObjectDetail['processingState']): string =>
		t(processingStateKeys[value]);
	const curationLabel = (value: ObjectDetail['curationState']): string =>
		t(curationStateKeys[value]);
	const reasonLabel = (value: ObjectDetail['accessReasonCode']): string =>
		t(`objects.table.reasons.${value}`);
	const formatDate = (value: string | null): string =>
		formatDateTime(value, $locale, t('values.unknown'));

	const accessLevelLabel = (value: ObjectDetail['accessLevel']): string =>
		value === 'private'
			? t('ingestionSetup.batchIntent.accessLevels.private')
			: value === 'family'
				? t('ingestionSetup.batchIntent.accessLevels.family')
				: t('ingestionSetup.batchIntent.accessLevels.public');

	const LOAD_ERROR_KEYS = {
		artifacts: {
			plain: 'objects.detail.errors.loadArtifacts',
			request: 'objects.detail.errors.loadArtifactsRequest'
		},
		availableFiles: {
			plain: 'objects.detail.errors.loadAvailableFiles',
			request: 'objects.detail.errors.loadAvailableFilesRequest'
		},
		pendingRequests: {
			plain: 'objects.detail.errors.loadPendingRequests',
			request: 'objects.detail.errors.loadPendingRequestsRequest'
		}
	} as const satisfies Record<string, { plain: TranslationKey; request: TranslationKey }>;

	const loadErrorLabel = (
		errorState: { code: 'loadFailed'; requestId: string | null } | null,
		keyBase: keyof typeof LOAD_ERROR_KEYS
	): string | null => {
		if (!errorState) return null;
		return errorState.requestId
			? formatTemplate(t(LOAD_ERROR_KEYS[keyBase].request), {
					requestId: errorState.requestId
				})
			: t(LOAD_ERROR_KEYS[keyBase].plain);
	};

	const DOWNLOAD_MESSAGE_KEYS = {
		available: 'objects.detail.downloadMessages.available',
		completed: 'objects.detail.downloadMessages.completed',
		queued: 'objects.detail.downloadMessages.queued'
	} as const satisfies Record<string, TranslationKey>;

	const downloadMessageLabel = (code: string | undefined): string | null => {
		if (!code) return null;
		const key = (DOWNLOAD_MESSAGE_KEYS as Record<string, TranslationKey>)[code];
		return key ? t(key) : null;
	};

	const requestErrorLabel = (
		errorCode: string | undefined,
		requestId: string | null | undefined
	): string | null => {
		if (!errorCode) return null;
		if (errorCode === 'missingFileId') return t('objects.detail.errors.missingFileId');
		if (errorCode === 'invalidFileId') return t('objects.detail.errors.invalidFileId');
		if (errorCode === 'requestDownloadFailed') {
			return requestId
				? formatTemplate(t('objects.detail.errors.requestDownloadFailedRequest'), { requestId })
				: t('objects.detail.errors.requestDownloadFailed');
		}
		return null;
	};

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

	const formatSize = (bytes: number): string => formatFileSize(bytes, $locale);

	const formatOptionalSize = (bytes: number | null): string =>
		bytes === null ? t('values.unknown') : formatSize(bytes);
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
		if (viewer?.primarySource.status === 'available') return t('objects.detail.review.available');
		if (viewer?.primarySource.status === 'request_pending') return t('objects.detail.review.requestPending');
		if (viewer?.primarySource.status === 'request_required') return t('objects.detail.review.requestRequired');
		if (viewer?.primarySource.status === 'restricted') return t('objects.detail.review.restricted');
		return t('objects.detail.review.readOnly');
	});
	const resolveMediaTypeLabel = (currentViewer: ObjectViewer | null, objectType: string): string => {
		if (currentViewer) return t(mediaTypeKeys[currentViewer.mediaType]);
		const key = knownMediaTypeKey(objectType);
		return key ? t(key) : objectType;
	};
	const mediaTypeLabel = $derived(resolveMediaTypeLabel(viewer, detail.type));
	const requestActionLabel = (actionType: string): string => {
		const key = knownRequestActionKey(actionType);
		return key ? t(key) : actionType;
	};
	const requestStatusLabel = (status: ArchiveRequest['status']): string =>
		t(requestStatusKeys[status]);
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
	const canRequestResync = $derived(data.session?.role === 'archiver' || data.session?.role === 'admin');
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
	backHref={data.backHref}
	title={displayTitle}
	objectId={detail.objectId}
	processingLabel={processingLabel(detail.processingState)}
	processingTone={toTone(detail.processingState, detail.curationState)}
	availabilityLabel={availabilityLabel(detail.availabilityState)}
	accessLevelLabel={accessLevelLabel(detail.accessLevel)}
	reviewLabel={reviewLabel}
	onInfoToggle={() => (infoOpen = !infoOpen)}
	onResync={() => (showResyncConfirm = true)}
	{canRequestResync}
	{resyncRunning}
	{resyncMessage}
/>


<main class={`min-h-full lg:min-h-screen ${pageBgClass}`}>
	<div class="mx-auto flex max-w-[96rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
		<div class="max-w-3xl">
			<p class={`text-xs uppercase tracking-[0.2em] ${introLabelClass}`}>{formatTemplate(t('objects.detail.typeObject'), { type: mediaTypeLabel })}</p>
			<p class={`mt-2 text-sm leading-relaxed ${introTextClass}`}>{descriptionText ?? t('objects.detail.fallbackDescription')}</p>
			<div class="mt-4 flex flex-wrap items-center gap-2">
				<Chip class="border-border-soft bg-surface-white/80 text-xs uppercase tracking-[0.2em] text-text-muted">{t('objects.detail.viewMode')}</Chip>
				{#if data.session?.role === 'archiver' || data.session?.role === 'admin'}
					<a
						href={resolve('/objects/[objectId]/edit', { objectId: detail.objectId })}
						class="inline-flex items-center rounded-full border border-blue-slate/30 bg-surface-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
					>
						{t('objects.detail.edit')}
					</a>
				{/if}
				{#if viewer}
					<Chip class="border-blue-slate/20 bg-pale-sky/18 text-xs uppercase tracking-[0.2em] text-blue-slate">{mediaTypeLabel}</Chip>
				{/if}
				{#if viewer?.primarySource.status === 'request_required'}
					<Chip class="border-pearl-beige bg-pearl-beige/60 text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.chips.requestRequired')}</Chip>
				{:else if viewer?.primarySource.status === 'request_pending'}
					<Chip class="border-blue-slate/20 bg-alabaster-grey/80 text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.chips.requestPending')}</Chip>
				{:else if viewer?.primarySource.status === 'available'}
					<Chip class="border-blue-slate/20 bg-pale-sky/18 text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.chips.availableNow')}</Chip>
				{/if}
			</div>
		</div>

<BaseDialog
	open={showResyncConfirm}
	labelledBy="resync-dialog-title"
	onClose={() => (showResyncConfirm = false)}
>
	<p id="resync-dialog-title" class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.resync.confirmTitle')}</p>
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
</BaseDialog>

		<section class="space-y-4">
			{#if form?.messageCode}
				<p class="rounded-xl border border-blue-slate/35 bg-pale-sky/25 px-4 py-3 text-sm text-blue-slate">
					{downloadMessageLabel(form.messageCode)}
				</p>
			{/if}
			{#if requestErrorLabel(form?.errorCode, form?.requestId)}
				<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-4 py-3 text-sm text-burnt-peach">
					{requestErrorLabel(form?.errorCode, form?.requestId)}
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
					class={`pointer-events-auto inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${supportVariant === 'dark' ? 'border-white/10 bg-black/30 text-white/70 hover:bg-white/10 hover:text-white' : 'border-border-soft bg-surface-white/80 text-text-muted hover:border-blue-slate/35 hover:text-blue-slate'}`}
				>
					<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4" aria-hidden="true">
						<path d="M10 3v14M3 10h14" stroke-linecap="round" />
					</svg>
					{t('objects.detail.support')}
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
							{formatTemplate(formatPlural(dictionary, 'objects.detail.artifacts.count', artifacts.length, $locale), { count: formatCount(artifacts.length, $locale) })}
						</p>
					</div>

					{#if loadErrorLabel(artifactsError, 'artifacts')}
						<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
							{loadErrorLabel(artifactsError, 'artifacts')}
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
											class="text-xs text-blue-slate underline-offset-2 hover:underline"
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
							{formatTemplate(formatPlural(dictionary, 'objects.detail.availableFiles.count', availableFiles.length, $locale), {
								count: formatCount(availableFiles.length, $locale)
							})}
						</p>
					</div>

					{#if form?.messageCode}
						<p class="mt-4 rounded-xl border border-blue-slate/35 bg-pale-sky/25 px-3 py-2 text-xs text-blue-slate">
							{downloadMessageLabel(form.messageCode)}
						</p>
					{/if}
					{#if requestErrorLabel(form?.errorCode, form?.requestId)}
						<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
							{requestErrorLabel(form?.errorCode, form?.requestId)}
						</p>
					{/if}

					{#if loadErrorLabel(availableFilesError, 'availableFiles')}
						<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
							{loadErrorLabel(availableFilesError, 'availableFiles')}
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
												class="text-xs text-blue-slate underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
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
				<p class="mt-3 text-sm text-text-muted">{reasonLabel(detail.accessReasonCode)}</p>
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
						{formatTemplate(formatPlural(dictionary, 'objects.detail.pendingRequests.count', pendingRequests.length, $locale), {
							count: formatCount(pendingRequests.length, $locale)
						})}
					</p>
				</div>

				{#if loadErrorLabel(pendingRequestsError, 'pendingRequests')}
					<p class="mt-4 rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
						{loadErrorLabel(pendingRequestsError, 'pendingRequests')}
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
										<td class="py-3 pr-4">{requestActionLabel(request.actionType)}</td>
										<td class="py-3 pr-4">
											<span class="rounded-full border border-border-soft px-2 py-1 text-xs text-text-muted">
												{requestStatusLabel(request.status)}
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
					class="mt-4 text-xs text-blue-slate underline-offset-2 hover:underline"
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
