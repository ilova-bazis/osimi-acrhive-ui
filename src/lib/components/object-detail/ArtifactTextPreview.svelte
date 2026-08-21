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

	const TEXT_MIME_TYPES = new Set(['text/plain', 'text/vtt']);

	const normalizeMime = (header: string | null): string | null => {
		if (!header) return null;
		const base = header.split(';')[0]?.trim().toLowerCase() ?? '';
		return base.length > 0 ? base : null;
	};

	const isLoginPath = (value: string): boolean => {
		try {
			const pathname = new URL(value, 'http://localhost').pathname;
			return pathname === '/login' || pathname.startsWith('/login/');
		} catch {
			return value === '/login' || value.startsWith('/login/');
		}
	};

	const isRenderableResponse = (response: Response): boolean => {
		if (!response.ok) return false;
		if (response.redirected) return false;
		if (isLoginPath(response.url)) return false;
		const mime = normalizeMime(response.headers.get('content-type'));
		if (!mime) return false;
		return TEXT_MIME_TYPES.has(mime);
	};

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
				if (!isRenderableResponse(response)) {
					throw new Error('Unsupported text preview response.');
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
