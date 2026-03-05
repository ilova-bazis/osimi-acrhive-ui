<script lang="ts">
	import BaseButton from '$lib/components/BaseButton.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';

	let {
		selectionCount = 0,
		filteredCount = 0,
		totalCount = 0,
		visibleCount = 0,
		onSelectVisible,
		onClearSelection,
		onCopySelection,
		selectionCopied = false
	} = $props<{
		selectionCount?: number;
		filteredCount?: number;
		totalCount?: number;
		visibleCount?: number;
		onSelectVisible?: () => void;
		onClearSelection?: () => void;
		onCopySelection?: () => void;
		selectionCopied?: boolean;
	}>();

	const dictionary = $derived(translations[$locale]);
	const t = (key: string) => translate(dictionary as Record<string, unknown>, key);
</script>

<header class="flex flex-wrap items-start justify-between gap-4">
	<div>
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('objects.header.title')}</p>
		<h2 class="mt-2 font-display text-2xl text-text-ink">{t('objects.header.title')}</h2>
		<p class="mt-2 text-sm text-text-muted">{t('objects.header.subtitle')}</p>
		<p class="mt-2 text-xs text-text-muted">
			{formatTemplate(t('objects.header.matching'), { filtered: filteredCount, total: totalCount })}
		</p>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<BaseButton
			variant="secondary"
			onclick={() => onSelectVisible?.()}
			disabled={visibleCount === 0 || selectionCount === visibleCount}
			class="disabled:opacity-50"
		>
			{t('objects.header.selectVisible')}
		</BaseButton>
		{#if selectionCount > 0}
			<BaseButton variant="secondary" onclick={() => onClearSelection?.()}>
				{t('objects.header.clearSelection')}
			</BaseButton>
			<BaseButton variant="secondary" onclick={() => onCopySelection?.()}>
				{selectionCopied ? t('objects.header.copiedSelection') : t('objects.header.copySelectionIds')}
			</BaseButton>
		{/if}
	</div>
</header>

{#if selectionCount > 0}
	<p class="rounded-2xl border border-blue-slate/25 bg-pale-sky/30 px-4 py-2 text-xs text-blue-slate">
		{formatTemplate(t('objects.header.selectionState'), { selected: selectionCount, visible: visibleCount })}
	</p>
{/if}
