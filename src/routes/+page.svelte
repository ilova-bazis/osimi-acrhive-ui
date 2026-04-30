<script lang="ts">
	import { resolve } from '$app/paths';
	import type { DashboardSummary } from '$lib/services/dashboard';
	import { session } from '$lib/auth/session';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';

	let { data } = $props<{ data: { summary: DashboardSummary } }>();

	const displayName = $derived($session?.username ?? 'Guest');
	const summary = $derived(data.summary);
	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);
</script>

<main class="page-container">
<div class="page-inner">
	<div class="flex items-start justify-between gap-6">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate font-medium">{t('dashboard.title')}</p>
			<h1 class="mt-1 font-display text-2xl text-text-ink leading-tight">{formatTemplate(t('dashboard.welcome'), { name: displayName })}</h1>
			<p class="mt-1 text-sm text-text-muted">{summary.roleTagline}</p>
		</div>
		<div class="flex shrink-0 items-center gap-3 pt-1">
			<a
				href={resolve('/ingestion')}
				class="rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white transition-colors hover:bg-blue-slate-mid-dark"
			>
				{t('dashboard.ingestion')}
			</a>
			<button class="rounded-full border border-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate transition-colors hover:bg-pale-sky/20">
				{summary.secondaryAction}
			</button>
		</div>
	</div>

	<section class="grid gap-4 md:grid-cols-3">
		<div class="rounded-2xl border border-border-soft bg-surface-white px-5 py-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('dashboard.metrics.activeBatches')}</p>
			<p class="mt-3 text-3xl font-semibold text-text-ink">{summary.metrics.activeBatches}</p>
			<p class="mt-2 text-sm text-text-muted">{t('dashboard.metrics.activeBatchesHint')}</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-5 py-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('dashboard.metrics.needsReview')}</p>
			<p class="mt-3 text-3xl font-semibold text-text-ink">{summary.metrics.needsReview}</p>
			<p class="mt-2 text-sm text-text-muted">{t('dashboard.metrics.needsReviewHint')}</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-5 py-5">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('dashboard.metrics.pendingUploads')}</p>
			<p class="mt-3 text-3xl font-semibold text-text-ink">{summary.metrics.pendingUploads}</p>
			<p class="mt-2 text-sm text-text-muted">{t('dashboard.metrics.pendingUploadsHint')}</p>
		</div>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('dashboard.recentActivity')}</p>
			<p class="text-xs text-text-muted">{t('dashboard.lastDays')}</p>
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
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('dashboard.intentTitle')}</p>
		<p class="mt-2 text-sm text-text-muted">{t('dashboard.intentBody')}</p>
	</section>
</div>
</main>
