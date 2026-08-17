<script lang="ts">
	import { locale } from '$lib/i18n/locale';
	import { translate } from '$lib/i18n/translate';
import { translations, type TranslationKey } from '$lib/i18n/translations';

	let {
		title,
		url,
		emptyLabel = 'No text available.',
		compact = false
	} = $props<{
		title: string;
		url: string | null;
		emptyLabel?: string;
		compact?: boolean;
	}>();

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	let text = $state<string | null>(null);
	let loading = $state(false);
	let failed = $state(false);

	$effect(() => {
		if (!url) {
			text = null;
			failed = false;
			loading = false;
			return;
		}

		let cancelled = false;
		loading = true;
		text = null;
		failed = false;

		void fetch(url)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error('Failed to load text preview.');
				}
				return response.text();
			})
			.then((value) => {
				if (cancelled) return;
				text = value.trim().length > 0 ? value : null;
			})
			.catch(() => {
				if (cancelled) return;
				failed = true;
			})
			.finally(() => {
				if (cancelled) return;
				loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<section class="rounded-[1.4rem] border border-border-soft bg-surface-white/90 p-4">
	<div class="flex items-center justify-between gap-3">
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{title}</p>
		{#if loading}
			<p class="text-xs text-text-muted">{t('objects.detail.viewer.loading')}</p>
		{/if}
	</div>

	{#if failed}
		<p class="mt-3 text-sm text-burnt-peach">{t('objects.detail.viewer.loadFailed')}</p>
	{:else if text}
		<div class={`mt-3 overflow-y-auto rounded-2xl border border-border-soft bg-alabaster-grey/30 p-4 text-sm leading-relaxed text-text-ink ${compact ? 'max-h-48' : 'max-h-72'}`}>
			<p class="whitespace-pre-wrap">{text}</p>
		</div>
	{:else if !loading}
		<p class="mt-3 text-sm text-text-muted">{emptyLabel}</p>
	{/if}
</section>
