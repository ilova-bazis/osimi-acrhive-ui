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
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';
	import type { FileStatus } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data } = $props<{ data: { summary: IngestionOverviewSummary } }>();

	const summary = $derived(data.summary);
	const activeAndRecent = $derived(summary.activeAndRecent);
	const drafts = $derived(summary.drafts);
 	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);

	const statusLabelMap = $derived({
		draft: t('ingestionOverview.statuses.draft'),
		uploading: t('ingestionOverview.statuses.uploading'),
		queued: t('ingestionOverview.statuses.queued'),
		ingesting: t('ingestionOverview.statuses.ingesting'),
		completed: t('ingestionOverview.statuses.completed'),
		failed: t('ingestionOverview.statuses.failed'),
		canceled: t('ingestionOverview.statuses.canceled')
	});

	const statusToneMap: Record<string, FileStatus> = {
		draft: 'queued',
		uploading: 'processing',
		queued: 'processing',
		ingesting: 'processing',
		completed: 'approved',
		failed: 'failed',
		canceled: 'blocked'
	};

	const actionLabelMap = $derived({
		view: t('ingestionOverview.actions.view'),
		resume: t('ingestionOverview.actions.resume'),
		retry: t('ingestionOverview.actions.retry'),
		cancel: t('ingestionOverview.actions.cancel'),
		restore: t('ingestionOverview.actions.restore'),
		delete: t('ingestionOverview.actions.delete')
	});

	const getStatusTone = (status: IngestionStatus) => statusToneMap[status] ?? 'queued';
	const getStatusLabel = (status: IngestionStatus) =>
		statusLabelMap[status as keyof typeof statusLabelMap] ?? status;
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

			if (response.status === 409) {
				throw new Error(t('ingestionOverview.errors.deleteConflict'));
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

	const formatDate = (value: string) => new Date(value).toLocaleString();

	const emptyState = $derived(activeAndRecent.length === 0 && drafts.length === 0);
</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<div class="flex justify-end">
		<a
			href={resolve('/ingestion/new')}
			class="inline-flex items-center gap-2 rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white transition-colors hover:bg-blue-slate-mid-dark"
		>
			{t('ingestionOverview.newIngestion')}
		</a>
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
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.totalBatches}</p>
				<p class="mt-1 text-xs text-text-muted">{t('ingestionOverview.stats.totalBatchesHint')}</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.stats.objectsCreated')}</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.objectsCreated}</p>
				<p class="mt-1 text-xs text-text-muted">{t('ingestionOverview.stats.objectsCreatedHint')}</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.stats.inProgress')}</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.inProgress}</p>
				<p class="mt-1 text-xs text-text-muted">{t('ingestionOverview.stats.inProgressHint')}</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionOverview.stats.needsAttention')}</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.needsAttention}</p>
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
				{#each activeAndRecent as batch (batch.id)}
					<article class="rounded-2xl border border-border-soft bg-surface-white px-5 py-4">
						<div class="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
							<div class="flex flex-wrap items-center gap-3">
								<div>
									<p class="text-sm font-semibold text-text-ink">{batch.name}</p>
									<p class="mt-1 text-xs text-text-muted">{batch.id}</p>
								</div>
								<StatusBadge status={getStatusTone(batch.status)} label={getStatusLabel(batch.status)} />
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
													class="rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-blue-slate hover:bg-pale-sky/25 disabled:opacity-50"
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
					{#each drafts as batch (batch.id)}
						<article class="rounded-2xl border border-border-soft bg-pearl-beige/20 px-5 py-4">
							<div class="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center">
								<div class="flex flex-wrap items-center gap-3">
									<div>
										<p class="text-sm font-semibold text-text-ink">{batch.name}</p>
										<p class="mt-1 text-xs text-text-muted">{batch.id}</p>
									</div>
									<StatusBadge status={getStatusTone(batch.status)} label={getStatusLabel(batch.status)} />
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
														class="rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-blue-slate hover:bg-pale-sky/25 disabled:opacity-50"
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
				</div>
			</section>
		{/if}
	{/if}
</main>
