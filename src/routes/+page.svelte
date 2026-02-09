<script lang="ts">
	import type { DashboardSummary } from '$lib/services/dashboard';
	import { session } from '$lib/auth/session';

	let { data } = $props<{ data: { summary: DashboardSummary } }>();

	const displayName = $derived($session?.username ?? 'Guest');
	const summary = data.summary;
</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Dashboard</p>
		<h2 class="mt-3 font-display text-2xl text-text-ink">Welcome back, {displayName}</h2>
		<p class="mt-2 text-sm text-text-muted">{summary.roleTagline}</p>
		<div class="mt-5 flex flex-wrap gap-3">
			<a
				href="/ingestion"
				class="rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
			>
				Ingestion
			</a>
			<button class="rounded-full border border-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate">
				{summary.secondaryAction}
			</button>
		</div>
	</section>

	<section class="grid gap-4 md:grid-cols-3">
		<div class="rounded-2xl border border-border-soft bg-surface-white px-5 py-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Active batches</p>
			<p class="mt-3 text-3xl font-semibold text-text-ink">{summary.metrics.activeBatches}</p>
			<p class="mt-2 text-sm text-text-muted">Currently in processing or review.</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-5 py-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Needs review</p>
			<p class="mt-3 text-3xl font-semibold text-text-ink">{summary.metrics.needsReview}</p>
			<p class="mt-2 text-sm text-text-muted">Human confirmation required before publish.</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-5 py-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Pending uploads</p>
			<p class="mt-3 text-3xl font-semibold text-text-ink">{summary.metrics.pendingUploads}</p>
			<p class="mt-2 text-sm text-text-muted">Staged items awaiting batch assignment.</p>
		</div>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Recent activity</p>
			<p class="text-xs text-text-muted">Last 7 days</p>
		</div>
		<div class="mt-4 space-y-4">
			{#each summary.recentActivity as item (item.id)}
				<div class="flex flex-col gap-1 rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<p class="text-sm font-medium text-text-ink">{item.title}</p>
						<p class="text-xs text-text-muted">{new Date(item.timestamp).toLocaleString()}</p>
					</div>
					<p class="text-xs text-text-muted">{item.description}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="rounded-2xl border border-border-soft bg-pearl-beige/60 px-6 py-6">
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Human intent checkpoint</p>
		<p class="mt-2 text-sm text-text-muted">
			Every ingestion begins with declared intent and ends with human review. Keep batches scoped and deliberate.
		</p>
	</section>
</main>
