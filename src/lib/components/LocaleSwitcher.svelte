<script lang="ts">
	import { locale } from '$lib/i18n/locale';
	import { translate } from '$lib/i18n/translate';
	import { translations, type LocaleKey, type TranslationKey } from '$lib/i18n/translations';

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const options: ReadonlyArray<{ key: LocaleKey; label: string }> = (
		Object.keys(translations) as LocaleKey[]
	).map((key) => ({
		key,
		label: key.toUpperCase()
	}));

	const select = (key: LocaleKey) => {
		locale.setLocale(key);
	};
</script>

<div
	class="flex items-center gap-1 rounded-full border border-border-soft bg-surface-white p-1"
	role="group"
	aria-label={t('header.localeSelector')}
>
	{#each options as option (option.key)}
		<button
			type="button"
			aria-pressed={$locale === option.key}
			onclick={() => select(option.key)}
			class={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.16em] transition ${
				$locale === option.key
					? 'bg-blue-slate text-surface-white'
					: 'text-blue-slate hover:bg-pale-sky/35'
			}`}
		>
			{option.label}
		</button>
	{/each}
</div>
