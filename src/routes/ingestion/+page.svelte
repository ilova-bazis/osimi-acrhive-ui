<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type {
		IngestionAction,
		IngestionBatch,
		IngestionOverviewSummary,
		IngestionStatus
	} from '$lib/services/ingestionOverview';
	import { locale } from '$lib/i18n/locale';
import { translations, type TranslationKey } from '$lib/i18n/translations';
import { formatCount, formatDateTime } from '$lib/i18n/format';
import { formatTemplate, translate } from '$lib/i18n/translate';
import { batchStatusKey, batchStatusTone } from '$lib/i18n/statusLabels';
import type { FileStatus } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data } = $props<{ data: { summary: IngestionOverviewSummary; activePage: number; draftPage: number } }>();

	const PAGE_SIZE = 10;

	const summary = $derived(data.summary);
	const activeAndRecent = $derived(summary.activeAndRecent);
	const drafts = $derived(summary.drafts);
	const activePage = $derived(data.activePage);
	const draftPage = $derived(data.draftPage);
	const activeTotalPages = $derived(Math.max(1, Math.ceil(activeAndRecent.length / PAGE_SIZE)));
	const draftTotalPages  = $derived(Math.max(1, Math.ceil(drafts.length / PAGE_SIZE)));
	const activePageItems  = $derived(activeAndRecent.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE));
	const draftPageItems   = $derived(drafts.slice((draftPage - 1) * PAGE_SIZE, draftPage * PAGE_SIZE));

	const goActivePage = (page: number) => {
		const qs = draftPage > 1 ? `?ap=${page}&dp=${draftPage}` : `?ap=${page}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(resolve('/ingestion') + qs);
	};
	const goDraftPage = (page: number) => {
		const qs = activePage > 1 ? `?ap=${activePage}&dp=${page}` : `?dp=${page}`;
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(resolve('/ingestion') + qs);
	};
 	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const actionLabelMap = $derived({
		view: t('ingestionOverview.actions.view'),
		resume: t('ingestionOverview.actions.resume'),
		retry: t('ingestionOverview.actions.retry'),
		cancel: t('ingestionOverview.actions.cancel'),
		restore: t('ingestionOverview.actions.restore'),
		delete: t('ingestionOverview.actions.delete')
	});

	const getStatusTone = (status: IngestionStatus | null): FileStatus => batchStatusTone(status);
	const getStatusLabel = (batch: IngestionBatch): string => {
		const key = batchStatusKey(batch.status);
		return key ? t(key) : batch.statusRaw || t('values.unknown');
	};
	const getActionLabel = (action: IngestionAction) =>
		actionLabelMap[action as keyof typeof actionLabelMap] ?? action;

	const getActionPath = (batchId: string, action: string): string => {
		if (action === 'retry') return resolve(`/ingestion/${batchId}/retry`);
		if (action === 'cancel') return resolve(`/ingestion/${batchId}/cancel`);
		if (action === 'restore') return resolve(`/ingestion/${batchId}/restore`);
		if (action === 'delete') return resolve(`/ingestion/${batchId}`);

		return resolve(`/ingestion/${batchId}`);
	};

	let actingBatchId = $state('');
	let actionError = $state('');

	const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
		const payload = await response.json().catch(() => null);
		if (
			payload &&
			typeof payload === 'object' &&
			'error' in payload &&
			typeof payload.error === 'string'
		) {
			return payload.error;
		}
		return fallback;
	};

	const runBatchAction = async (batch: IngestionBatch, action: IngestionAction): Promise<void> => {
		actionError = '';

		if (action === 'view') {
			await goto(resolve(`/ingestion/${batch.id}`));
			return;
		}

		if (action === 'resume') {
			await goto(resolve(`/ingestion/${batch.id}/setup`));
			return;
		}

		actingBatchId = batch.id;
		try {
			const actionMethodMap: Record<string, 'POST' | 'DELETE'> = {
				delete: 'DELETE'
			};
			const method = actionMethodMap[action] ?? 'POST';
			const response = await fetch(getActionPath(batch.id, action), {
				method
			});

			if (response.status === 401) {
				await goto(resolve('/login'));
				return;
			}

			if (!response.ok) {
				throw new Error(
					await readErrorMessage(
						response,
						formatTemplate(t('ingestionOverview.errors.failedNamed'), {
							action: getActionLabel(action).toLowerCase(),
							name: batch.name
						})
					)
				);
			}

			await invalidateAll();
		} catch (error) {
			actionError =
				error instanceof Error
					? error.message
					: formatTemplate(t('ingestionOverview.errors.failed'), {
						action: getActionLabel(action).toLowerCase()
					});
		} finally {
			actingBatchId = '';
		}
	};

	const isActionRunning = (batchId: string): boolean => actingBatchId === batchId;

	const formatDate = (value: string) =>
		formatDateTime(value, $locale, t('values.unknown'));

	const emptyState = $derived(activeAndRecent.length === 0 && drafts.length === 0);
</script>

<main class="page-container">
<div class="page-inner">
	<div class="flex items-start justify-between gap-6">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">{t('ingestionOverview.title')}</p>
			<h1 class="mt-1 font-display text-2xl text-text-ink leading-tight">{t('ingestionOverview.heading')}</h1>
			<p class="mt-1 text-sm text-text-muted">{formatTemplate(t('ingestionOverview.statsLine'), { total: formatCount(summary.stats.totalBatches, $locale), inProgress: formatCount(summary.stats.inProgress, $locale) })}</p>
		</div>
		<div class="flex shrink-0 items-center gap-3 pt-1">
			<a
				href={resolve('/ingestion/new')}
				class="inline-flex items-center gap-2 rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white transition-colors hover:bg-blue-slate-mid-dark"
			>
				{t('ingestionOverview.newIngestion')}
			</a>
		</div>
	</div>

	{#if emptyState}
		<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-8 text-center">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.emptyKicker')}</p>
			<h3 class="mt-3 font-display text-xl text-text-ink">{t('ingestionOverview.emptyTitle')}</h3>
			<p class="mt-2 text-sm text-text-muted">{t('ingestionOverview.emptyBody')}</p>
			<a
				href={resolve('/ingestion/new')}
				class="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
			>
				{t('ingestionOverview.emptyTitle')}
			</a>
		</section>
	{:else}
		<section class="grid gap-3 md:grid-cols-4">
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.stats.totalBatches')}</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{formatCount(summary.stats.totalBatches, $locale)}</p>
				<p class="mt-1 text-xs text-text-muted">{t('ingestionOverview.stats.totalBatchesHint')}</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.stats.objectsCreated')}</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{formatCount(summary.stats.objectsCreated, $locale)}</p>
				<p class="mt-1 text-xs text-text-muted">{t('ingestionOverview.stats.objectsCreatedHint')}</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.stats.inProgress')}</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{formatCount(summary.stats.inProgress, $locale)}</p>
				<p class="mt-1 text-xs text-text-muted">{t('ingestionOverview.stats.inProgressHint')}</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.stats.needsAttention')}</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{formatCount(summary.stats.needsAttention, $locale)}</p>
				<p class="mt-1 text-xs text-text-muted">{t('ingestionOverview.stats.needsAttentionHint')}</p>
			</div>
		</section>

		<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.sections.activeRecent')}</p>
					<p class="mt-1 text-sm text-text-muted">{t('ingestionOverview.sections.activeRecentHint')}</p>
				</div>
				{#if actionError}
					<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
						{actionError}
					</p>
				{/if}
			</div>
			<div class="mt-5">
				<div class="hidden border-b border-border-soft pb-3 text-xs uppercase tracking-[0.2em] text-text-muted md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:gap-3">
					<span>{t('ingestionOverview.table.batch')}</span>
					<span>{t('ingestionOverview.table.created')}</span>
					<span>{t('ingestionOverview.table.progress')}</span>
					<span class="text-right">{t('ingestionOverview.table.action')}</span>
				</div>
				<div class="mt-4 space-y-3">
				{#each activePageItems as batch (batch.id)}
					<article class="rounded-2xl border border-border-soft bg-surface-white px-5 py-4">
						<div class="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
							<div class="flex flex-wrap items-center gap-3">
								<div>
									<a href={resolve(`/ingestion/${batch.id}`)} class="text-sm font-medium text-text-ink hover:underline">{batch.name}</a>
									<p class="mt-1 text-xs text-text-muted">{batch.id}</p>
								</div>
								<StatusBadge status={getStatusTone(batch.status)} label={getStatusLabel(batch)} />
							</div>
							<p class="text-xs text-text-muted">{formatDate(batch.createdAt)}</p>
							<p class="text-xs text-text-muted">
								{formatTemplate(t('ingestionOverview.table.objects'), {
									completed: formatCount(batch.progress.completed, $locale),
									total: formatCount(batch.progress.total, $locale)
								})}
							</p>
							<div class="flex justify-start md:justify-end">
								<details class="group relative">
									<summary
										class="cursor-pointer list-none rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
									>
										{isActionRunning(batch.id)
											? t('ingestionOverview.actions.working')
											: t('ingestionOverview.actions.menu')}
									</summary>
									<div class="absolute right-0 z-10 mt-2 min-w-40 rounded-xl border border-border-soft bg-surface-white p-2 shadow-lg">
										<div class="flex flex-col gap-1">
											{#each batch.actions as action (action)}
												<button
													onclick={() => runBatchAction(batch, action)}
													disabled={isActionRunning(batch.id)}
													class="rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-blue-slate hover:bg-pale-sky/25 disabled:opacity-50"
												>
													{getActionLabel(action)}
												</button>
											{/each}
										</div>
									</div>
								</details>
							</div>
						</div>
					</article>
				{/each}
				</div>
				{#if activeTotalPages > 1}
					<div class="mt-4 flex items-center justify-between border-t border-border-soft pt-3 text-xs">
						<button
							onclick={() => goActivePage(activePage - 1)}
							disabled={activePage <= 1}
							class="rounded-full border border-border-soft px-3 py-1.5 uppercase tracking-[0.2em] text-blue-slate disabled:pointer-events-none disabled:opacity-30"
						>{t('ingestionOverview.pagination.prev')}</button>
						<span class="text-text-muted">{activePage} / {activeTotalPages}</span>
						<button
							onclick={() => goActivePage(activePage + 1)}
							disabled={activePage >= activeTotalPages}
							class="rounded-full border border-border-soft px-3 py-1.5 uppercase tracking-[0.2em] text-blue-slate disabled:pointer-events-none disabled:opacity-30"
						>{t('ingestionOverview.pagination.next')}</button>
					</div>
				{/if}
			</div>
		</section>

		{#if drafts.length}
			<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.sections.drafts')}</p>
						<p class="mt-1 text-sm text-text-muted">{t('ingestionOverview.sections.draftsHint')}</p>
					</div>
				</div>
				<div class="mt-5">
					<div class="hidden border-b border-border-soft pb-3 text-xs uppercase tracking-[0.2em] text-text-muted md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:gap-3">
						<span>{t('ingestionOverview.table.batch')}</span>
						<span>{t('ingestionOverview.table.created')}</span>
						<span>{t('ingestionOverview.table.progress')}</span>
						<span class="text-right">{t('ingestionOverview.table.action')}</span>
					</div>
					<div class="mt-4 space-y-3">
					{#each draftPageItems as batch (batch.id)}
						<article class="rounded-2xl border border-border-soft bg-pearl-beige/20 px-5 py-4">
							<div class="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
								<div class="flex flex-wrap items-center gap-3">
									<div>
										<a href={resolve(`/ingestion/${batch.id}`)} class="text-sm font-medium text-text-ink hover:underline">{batch.name}</a>
										<p class="mt-1 text-xs text-text-muted">{batch.id}</p>
									</div>
									<StatusBadge status={getStatusTone(batch.status)} label={getStatusLabel(batch)} />
								</div>
								<p class="text-xs text-text-muted">{formatDate(batch.createdAt)}</p>
								<p class="text-xs text-text-muted">
									{formatTemplate(t('ingestionOverview.table.objects'), {
										completed: batch.progress.completed,
										total: batch.progress.total
									})}
								</p>
								<div class="flex justify-start md:justify-end">
									<details class="group relative">
										<summary
											class="cursor-pointer list-none rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
										>
											{isActionRunning(batch.id)
												? t('ingestionOverview.actions.working')
												: t('ingestionOverview.actions.menu')}
										</summary>
										<div class="absolute right-0 z-10 mt-2 min-w-40 rounded-xl border border-border-soft bg-surface-white p-2 shadow-lg">
											<div class="flex flex-col gap-1">
												{#each batch.actions as action (action)}
													<button
														onclick={() => runBatchAction(batch, action)}
														disabled={isActionRunning(batch.id)}
														class="rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-blue-slate hover:bg-pale-sky/25 disabled:opacity-50"
													>
														{getActionLabel(action)}
													</button>
												{/each}
											</div>
										</div>
									</details>
								</div>
							</div>
						</article>
					{/each}
					</div>
					{#if draftTotalPages > 1}
						<div class="mt-4 flex items-center justify-between border-t border-border-soft pt-3 text-xs">
							<button
								onclick={() => goDraftPage(draftPage - 1)}
								disabled={draftPage <= 1}
								class="rounded-full border border-border-soft px-3 py-1.5 uppercase tracking-[0.2em] text-blue-slate disabled:pointer-events-none disabled:opacity-30"
							>{t('ingestionOverview.pagination.prev')}</button>
							<span class="text-text-muted">{draftPage} / {draftTotalPages}</span>
							<button
								onclick={() => goDraftPage(draftPage + 1)}
								disabled={draftPage >= draftTotalPages}
								class="rounded-full border border-border-soft px-3 py-1.5 uppercase tracking-[0.2em] text-blue-slate disabled:pointer-events-none disabled:opacity-30"
							>{t('ingestionOverview.pagination.next')}</button>
						</div>
					{/if}
				</div>
			</section>
		{/if}
	{/if}
</div>
</main>
