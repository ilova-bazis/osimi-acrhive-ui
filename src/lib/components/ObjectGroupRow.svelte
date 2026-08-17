<script lang="ts">
	import { tick } from 'svelte';
	import { locale } from '$lib/i18n/locale';
	import { formatCount } from '$lib/i18n/format';
	import { formatPlural, formatTemplate, translate } from '$lib/i18n/translate';
import { translations, type TranslationKey } from '$lib/i18n/translations';

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);


	let {
		groupId,
		label,
		fileCount = 0,
		collapsed = false,
		dragOver = false,
		active = false,
		ungroupDisabled = false,
		incomplete = false,
		onToggleCollapse,
		onUngroup,
		onLabelChange,
		onSelect,
		onDragOver,
		onDragLeave,
		onDrop,
		children
	} = $props<{
		groupId: string;
		label?: string;
		fileCount?: number;
		collapsed?: boolean;
		dragOver?: boolean;
		active?: boolean;
		ungroupDisabled?: boolean;
		incomplete?: boolean;
		onToggleCollapse: () => void;
		onUngroup: () => void;
		onLabelChange: (label: string) => void;
		onSelect?: () => void;
		onDragOver: (event: DragEvent) => void;
		onDragLeave: (event: DragEvent) => void;
		onDrop: (event: DragEvent) => void;
		children?: () => unknown;
	}>();

	let editingLabel = $state(false);
	let labelInput = $state('');
	let labelInputElement = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (!editingLabel) {
			labelInput = label ?? '';
		}
	});

	const commitLabel = () => {
		editingLabel = false;
		onLabelChange(labelInput.trim());
	};

	const startLabelEdit = async (): Promise<void> => {
		onSelect?.();
		labelInput = label ?? '';
		editingLabel = true;
		await tick();
		labelInputElement?.focus();
		labelInputElement?.select();
	};

	const fileCountLabel = $derived(
		formatTemplate(formatPlural(dictionary, 'ingestionSetup.objectGroup.fileCount', fileCount, $locale), {
			count: formatCount(fileCount, $locale)
		})
	);
</script>

<div
	class={`border-b border-border-soft transition ${dragOver ? 'bg-pale-sky/20 ring-1 ring-inset ring-blue-slate/30' : ''}`}
>
	<div
		class={`flex items-center gap-3 px-6 py-3 transition cursor-pointer
			${active ? 'bg-pale-sky/20' : 'bg-pale-sky/8 hover:bg-pale-sky/15'}`}
		onclick={() => onSelect?.()}
		role="button"
		tabindex="0"
		onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(); }}
		ondragover={onDragOver}
		ondragleave={onDragLeave}
		ondrop={onDrop}
		aria-label={label ?? formatTemplate(t('ingestionSetup.objectGroup.defaultLabel'), { id: groupId.slice(0, 6) })}
	>
		<button
			type="button"
			class="shrink-0 text-xs text-blue-slate transition-transform"
			style={collapsed ? 'transform: rotate(-90deg)' : ''}
			onclick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
			aria-label={collapsed ? t('ingestionSetup.objectGroup.expandAriaLabel') : t('ingestionSetup.objectGroup.collapseAriaLabel')}
		>
			▾
		</button>

		<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate/70">{t('ingestionSetup.objectGroup.typeLabel')}</span>

		{#if editingLabel}
			<input
				bind:this={labelInputElement}
				class="min-w-0 flex-1 rounded-lg border border-blue-slate/40 bg-surface-white px-2 py-0.5 text-sm text-text-ink focus:outline-none focus:ring-1 focus:ring-blue-slate"
				bind:value={labelInput}
				onblur={commitLabel}
				onkeydown={(e) => {
					if (e.key === 'Enter') commitLabel();
					if (e.key === 'Escape') {
						labelInput = label ?? '';
						editingLabel = false;
					}
				}}
				onclick={(e) => e.stopPropagation()}
			/>
		{:else}
			<button
				type="button"
				class="min-w-0 flex-1 truncate text-left text-sm font-medium text-text-ink hover:text-blue-slate"
				onclick={(e) => {
					e.stopPropagation();
					void startLabelEdit();
				}}
				title={t('ingestionSetup.objectGroup.renameHint')}
			>
				{label || formatTemplate(t('ingestionSetup.objectGroup.defaultLabel'), { id: groupId.slice(0, 6) })}
			</button>
		{/if}

		<span class="shrink-0 text-xs text-text-muted">— {fileCountLabel}</span>

		{#if incomplete}
			<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-burnt-peach" title={t('ingestionSetup.objectGroup.missingMetadataHint')}></span>
		{/if}

		<button
			type="button"
			class={`shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.15em] ${ungroupDisabled ? 'cursor-not-allowed border-blue-slate/15 text-blue-slate/35' : 'border-blue-slate/30 text-blue-slate hover:border-burnt-peach/60 hover:text-burnt-peach'}`}
			disabled={ungroupDisabled}
			title={ungroupDisabled ? t('ingestionSetup.objectGroup.ungroupDisabledTooltip') : undefined}
			onclick={(e) => { e.stopPropagation(); if (!ungroupDisabled) onUngroup(); }}
		>
			{t('ingestionSetup.objectGroup.ungroup')}
		</button>
	</div>

	{#if !collapsed}
		{@render children?.()}
	{/if}
</div>
