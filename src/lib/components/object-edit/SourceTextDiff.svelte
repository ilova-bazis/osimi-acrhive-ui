<script lang="ts">
	import { locale } from '$lib/i18n/locale';
	import { translations, type TranslationKey } from '$lib/i18n/translations';
	import { formatTemplate, translate } from '$lib/i18n/translate';

	let {
		sourceLabel = 'Auto-extracted',
		curatedLabel = 'Curated',
		sourceText,
		curatedText,
		confidence,
		onCuratedChange
	}: {
		sourceLabel?: string;
		curatedLabel?: string;
		sourceText: string;
		curatedText: string;
		confidence?: number;
		onCuratedChange: (text: string) => void;
	} = $props();

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const handleCopyFromSource = (): void => {
		onCuratedChange(sourceText);
	};

	const handleReset = (): void => {
		onCuratedChange('');
	};
</script>

<div class="flex gap-4">
	<!-- Source (read-only) -->
	<div class="flex min-w-0 flex-1 flex-col">
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{sourceLabel}</span>
				{#if confidence !== undefined}
					<span class="rounded-full bg-pale-sky/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-blue-slate">
						{formatTemplate(t('objectEdit.editor.confidence'), { confidence })}
					</span>
				{/if}
			</div>
			<span class="text-[9px] uppercase tracking-[0.12em] text-text-muted">{t('objectEdit.editor.readOnly')}</span>
		</div>
		<div class="flex-1 overflow-y-auto rounded-xl border border-blue-slate/15 bg-pale-sky/20 px-4 py-3 text-sm leading-relaxed text-blue-slate/85">
			{#if sourceText}
				{sourceText}
			{:else}
				<span class="italic text-text-muted">{t('objectEdit.editor.noSourceText')}</span>
			{/if}
		</div>
	</div>

	<!-- Curated (editable) -->
	<div class="flex min-w-0 flex-1 flex-col">
		<div class="mb-2 flex items-center justify-between">
			<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{curatedLabel}</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={handleCopyFromSource}
					class="rounded-full border border-blue-slate/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-blue-slate transition hover:bg-pale-sky/30"
				>
					{t('objectEdit.editor.copyFromSource')}
				</button>
				{#if curatedText}
					<button
						type="button"
						onclick={handleReset}
						class="text-[9px] uppercase tracking-[0.12em] text-burnt-peach/80 transition hover:text-burnt-peach"
					>
						{t('objectEdit.editor.reset')}
					</button>
				{/if}
			</div>
		</div>
		<textarea
			class="flex-1 resize-none rounded-xl border border-pearl-beige/50 bg-pearl-beige/15 px-4 py-3 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
			rows="8"
			placeholder={t('objectEdit.editor.curatedPlaceholder')}
			value={curatedText}
			oninput={(e) => onCuratedChange(e.currentTarget.value)}
		></textarea>
	</div>
</div>
