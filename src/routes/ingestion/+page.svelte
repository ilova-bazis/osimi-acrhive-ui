<script lang="ts">
	import type { IngestionBatch, IngestionOverviewSummary, IngestionStatus } from '$lib/services/ingestionOverview';
	import type { FileStatus } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data } = $props<{ data: { summary: IngestionOverviewSummary } }>();

	const summary: IngestionOverviewSummary = data.summary;
	const activeAndRecent: IngestionBatch[] = summary.activeAndRecent;
	const drafts: IngestionBatch[] = summary.drafts;

	const statusLabelMap: Record<IngestionStatus, string> = {
		draft: 'Draft',
		ingesting: 'Ingesting',
		completed: 'Completed',
		failed: 'Failed'
	};

	const statusToneMap: Record<IngestionStatus, FileStatus> = {
		draft: 'queued',
		ingesting: 'processing',
		completed: 'approved',
		failed: 'failed'
	};

	const actionLabelMap: Record<IngestionBatch['action'], string> = {
		view: 'View',
		resume: 'Resume',
		retry: 'Retry'
	};

	const getStatusTone = (status: IngestionStatus) => statusToneMap[status];
	const getStatusLabel = (status: IngestionStatus) => statusLabelMap[status];
	const getActionLabel = (action: IngestionBatch['action']) => actionLabelMap[action];

	const formatDate = (value: string) => new Date(value).toLocaleString();

	const emptyState = activeAndRecent.length === 0 && drafts.length === 0;
</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingestion</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">Ingestion</h2>
		</div>
		<a
			href="/ingestion/new"
			class="inline-flex items-center gap-2 rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
		>
			➕ New Ingestion
		</a>
	</section>

	{#if emptyState}
		<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-8 text-center">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">No ingestions yet</p>
			<h3 class="mt-3 font-display text-xl text-text-ink">Start your first ingestion</h3>
			<p class="mt-2 text-sm text-text-muted">
				Ingestion happens in batches. Create your first batch to begin the workflow.
			</p>
			<a
				href="/ingestion/new"
				class="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
			>
				Start your first ingestion
			</a>
		</section>
	{:else}
		<section class="grid gap-3 md:grid-cols-4">
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Total batches</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.totalBatches}</p>
				<p class="mt-1 text-xs text-text-muted">All batches tracked.</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Objects created</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.objectsCreated}</p>
				<p class="mt-1 text-xs text-text-muted">Items from ingestions.</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">In progress</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.inProgress}</p>
				<p class="mt-1 text-xs text-text-muted">Pipelines running.</p>
			</div>
			<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Failed / attention</p>
				<p class="mt-2 text-2xl font-semibold text-text-ink">{summary.stats.needsAttention}</p>
				<p class="mt-1 text-xs text-text-muted">Needs action.</p>
			</div>
		</section>

		<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Active & recent batches</p>
					<p class="mt-1 text-sm text-text-muted">Track ongoing and completed ingestions.</p>
				</div>
			</div>
			<div class="mt-5">
				<div class="hidden border-b border-border-soft pb-3 text-xs uppercase tracking-[0.2em] text-text-muted md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:gap-3">
					<span>Batch</span>
					<span>Created</span>
					<span>Progress</span>
					<span class="text-right">Action</span>
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
								{batch.progress.completed} / {batch.progress.total} objects
							</p>
							<div class="flex justify-start md:justify-end">
								<button class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">
									{getActionLabel(batch.action)}
								</button>
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
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Draft batches</p>
						<p class="mt-1 text-sm text-text-muted">Finish setup before ingestion begins.</p>
					</div>
				</div>
				<div class="mt-5">
					<div class="hidden border-b border-border-soft pb-3 text-xs uppercase tracking-[0.2em] text-text-muted md:grid md:grid-cols-[2fr_1fr_1fr_auto] md:gap-3">
						<span>Batch</span>
						<span>Created</span>
						<span>Progress</span>
						<span class="text-right">Action</span>
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
									{batch.progress.completed} / {batch.progress.total} objects
								</p>
								<div class="flex justify-start md:justify-end">
									<button class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">
										Continue setup
									</button>
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
