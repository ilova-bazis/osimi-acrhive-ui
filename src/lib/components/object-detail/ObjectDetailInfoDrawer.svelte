<script lang="ts">
	import { fly } from 'svelte/transition';
	import Chip from '$lib/components/Chip.svelte';
	import { knownLanguageKey, knownMediaTypeKey } from '$lib/i18n/domainLabels';
	import { locale } from '$lib/i18n/locale';
	import { translate } from '$lib/i18n/translate';
import { translations, type TranslationKey } from '$lib/i18n/translations';

	let {
		open,
		title,
		description,
		tags,
		type,
		language,
		createdAt,
		updatedAt,
		sourceBatchLabel,
		sourceIngestionId,
		rightsNote,
		sensitivityNote,
		onClose
	} = $props<{
		open: boolean;
		title: string;
		description: string | null;
		tags: string[];
		type: string;
		language: string | null;
		createdAt: string;
		updatedAt: string;
		sourceBatchLabel: string | null;
		sourceIngestionId: string | null;
		rightsNote: string | null;
		sensitivityNote: string | null;
		onClose: () => void;
	}>();

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const knownTypeKey = $derived(knownMediaTypeKey(type));
	const knownLanguageKeyForValue = $derived(
		language ? knownLanguageKey(language) : null
	);
	const typeLabel = $derived(knownTypeKey ? t(knownTypeKey) : type);
	const languageLabel = $derived(
		language
			? knownLanguageKeyForValue
				? t(knownLanguageKeyForValue)
				: language
			: t('values.unknown')
	);

	const details = $derived([
		{ label: t('objects.detail.info.type'), value: typeLabel },
		{ label: t('objects.detail.info.language'), value: languageLabel },
		{ label: t('objects.detail.info.created'), value: createdAt },
		{ label: t('objects.detail.info.updated'), value: updatedAt },
		{ label: t('objects.detail.info.batch'), value: sourceBatchLabel ?? t('values.unknown') },
		{ label: t('objects.detail.info.ingestion'), value: sourceIngestionId ?? t('values.unknown') }
	]);
</script>

{#if open}
	<button type="button" class="fixed inset-0 z-30 bg-blue-slate/18 backdrop-blur-[1px]" aria-label={t('objects.detail.info.closeBackdrop')} onclick={onClose}></button>
	<aside
		class="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border-soft bg-surface-white shadow-[-12px_0_40px_rgba(31,47,56,0.18)]"
		in:fly={{ x: 24, duration: 180 }}
		out:fly={{ x: 24, duration: 160 }}
	>
		<div class="flex items-start justify-between gap-3 border-b border-border-soft px-5 py-5">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.info.kicker')}</p>
				<h2 class="mt-2 font-display text-2xl text-text-ink">{title}</h2>
				<p class="mt-2 text-sm text-text-muted">{t('objects.detail.info.description')}</p>
			</div>
			<button type="button" class="rounded-full border border-border-soft p-2 text-text-muted transition hover:text-blue-slate" aria-label={t('objects.detail.info.close')} onclick={onClose}>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4" aria-hidden="true">
					<path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
				</svg>
			</button>
		</div>

		<div class="flex-1 space-y-6 overflow-y-auto px-5 py-5">
			<section class="grid gap-3 sm:grid-cols-2">
				{#each details as detail (detail.label)}
					<div class="rounded-2xl border border-border-soft bg-alabaster-grey/40 px-4 py-3">
						<p class="text-xs uppercase tracking-[0.2em] text-text-muted">{detail.label}</p>
						<p class="mt-2 break-words text-sm text-text-ink">{detail.value}</p>
					</div>
				{/each}
			</section>

			{#if tags.length > 0}
				<section>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.info.tags')}</p>
					<div class="mt-3 flex flex-wrap gap-2">
						{#each tags as tag (tag)}
							<Chip class="border-blue-slate/20 bg-pale-sky/25 text-xs uppercase tracking-[0.2em] text-blue-slate">{tag}</Chip>
						{/each}
					</div>
				</section>
			{/if}

			<section>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.info.descriptionTitle')}</p>
				<p class="mt-3 text-sm leading-relaxed text-text-ink">{description ?? t('objects.detail.info.noDescription')}</p>
			</section>

			{#if rightsNote}
				<section>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.info.rightsNote')}</p>
					<p class="mt-3 rounded-2xl border border-pearl-beige bg-pearl-beige/45 px-4 py-4 text-sm leading-relaxed text-text-ink">{rightsNote}</p>
				</section>
			{/if}

			{#if sensitivityNote}
				<section>
					<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.detail.info.sensitivityNote')}</p>
					<p class="mt-3 rounded-2xl border border-burnt-peach/25 bg-pearl-beige/40 px-4 py-4 text-sm leading-relaxed text-text-ink">{sensitivityNote}</p>
				</section>
			{/if}
		</div>
	</aside>
{/if}
