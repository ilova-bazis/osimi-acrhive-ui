<script lang="ts">
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';

	const dictionary = $derived(translations[$locale]);
	const t = (key: string): string => {
		const segments = key.split('.');
		let current: Record<string, unknown> = dictionary as Record<string, unknown>;
		for (const segment of segments) {
			if (typeof current[segment] === 'undefined') return key;
			current = current[segment] as Record<string, unknown>;
		}
		return current as unknown as string;
	};

	const format = (template: string, values: Record<string, string | number>) =>
		template.replace(/\{(\w+)\}/g, (match, key) =>
			Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
		);

	let {
		groupId,
		label,
		fileCount,
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
		fileCount: number;
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
	let labelInput = $state(label ?? '');

	$effect(() => {
		if (!editingLabel) {
			labelInput = label ?? '';
		}
	});

	const commitLabel = () => {
		editingLabel = false;
		onLabelChange(labelInput.trim());
	};

	const fileCountLabel = $derived(
		fileCount === 1
			? format(t('ingestionSetup.objectGroup.fileCountOne'), { count: fileCount })
			: format(t('ingestionSetup.objectGroup.fileCount'), { count: fileCount })
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
		aria-label={label ?? format(t('ingestionSetup.objectGroup.defaultLabel'), { id: groupId.slice(0, 6) })}
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
				autofocus
			/>
		{:else}
			<button
				type="button"
				class="min-w-0 flex-1 truncate text-left text-sm font-medium text-text-ink hover:text-blue-slate"
				onclick={(e) => {
					e.stopPropagation();
					onSelect?.();
					labelInput = label ?? '';
					editingLabel = true;
				}}
				title="Click to rename"
			>
				{label || format(t('ingestionSetup.objectGroup.defaultLabel'), { id: groupId.slice(0, 6) })}
			</button>
		{/if}

		<span class="shrink-0 text-xs text-text-muted">— {fileCountLabel}</span>

		{#if incomplete}
			<span class="shrink-0 text-[10px] text-burnt-peach" title="Missing required metadata (title, date, tags)">●</span>
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
