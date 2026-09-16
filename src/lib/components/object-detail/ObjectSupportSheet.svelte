<script lang="ts">
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import BaseDialog from '$lib/components/BaseDialog.svelte';
	import { locale } from '$lib/i18n/locale';
	import { translate } from '$lib/i18n/translate';
import { translations, type TranslationKey } from '$lib/i18n/translations';

	export type SupportSheetState = 'hidden' | 'peek' | 'expanded';

	export type Tab = {
		id: string;
		label: string;
	};

	let {
		state: sheetState,
		title,
		variant = 'light',
		activeTab,
		tabs = [],
		idPrefix,
		orientation = 'horizontal',
		launcherFocus,
		onStateChange,
		onTabChange,
		children
	} = $props<{
		state: SupportSheetState;
		title: string;
		variant?: 'light' | 'dark';
		activeTab?: string;
		tabs?: Tab[];
		idPrefix: string;
		orientation?: 'horizontal' | 'vertical';
		launcherFocus?: () => HTMLElement | null;
		onStateChange: (state: SupportSheetState) => void;
		onTabChange?: (tabId: string) => void;
		children?: () => unknown;
	}>();

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	let focusedTabId = $state<string | null>(null);
	let peekHandleEl = $state<HTMLButtonElement | null>(null);
	let restoreToPeekHandle = false;

	const selectedTabId = $derived.by(() => {
		if (activeTab !== undefined && tabs.some((tab: Tab) => tab.id === activeTab)) {
			return activeTab;
		}
		return tabs[0]?.id ?? null;
	});

	const effectiveFocusedTabId = $derived.by(() => {
		if (focusedTabId !== null && tabs.some((tab: Tab) => tab.id === focusedTabId)) {
			return focusedTabId;
		}
		return selectedTabId;
	});

	const tabIndexById = (tabId: string): number =>
		effectiveFocusedTabId === tabId ? 0 : -1;

	let previousSheetState: SupportSheetState | null = null;
	$effect.pre(() => {
		if (previousSheetState === sheetState) return;
		previousSheetState = sheetState;
		focusedTabId = null;
	});

	const handleToggle = (): void => {
		if (sheetState === 'peek') {
			onStateChange('expanded');
		} else if (sheetState === 'expanded') {
			restoreToPeekHandle = true;
			onStateChange('peek');
		}
	};

	const handleTabSelect = (tabId: string): void => {
		focusedTabId = tabId;
		if (onTabChange && tabId !== activeTab) {
			onTabChange(tabId);
		}
	};

	const handleTabKeydown = (event: KeyboardEvent, tabId: string): void => {
		const index = tabs.findIndex((tab: Tab) => tab.id === tabId);
		if (index === -1 || tabs.length === 0) return;
		const horizontal = orientation !== 'vertical';
		const backward = horizontal ? 'ArrowLeft' : 'ArrowUp';
		const forward = horizontal ? 'ArrowRight' : 'ArrowDown';
		if (event.key === backward || event.key === forward || event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			let nextIndex = index;
			if (event.key === 'Home') nextIndex = 0;
			else if (event.key === 'End') nextIndex = tabs.length - 1;
			else if (event.key === backward) nextIndex = (index - 1 + tabs.length) % tabs.length;
			else nextIndex = (index + 1) % tabs.length;
			const nextId = tabs[nextIndex]?.id;
			if (!nextId) return;
			focusedTabId = nextId;
			document.getElementById(`${idPrefix}-tab-${nextId}`)?.focus();
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleTabSelect(tabId);
		}
	};

	const sheetClasses = (dark: boolean): string =>
		dark
			? 'border-white/10 bg-[#111a1f]/96 text-white'
			: 'border-border-soft bg-surface-white/96 text-text-ink';
	const tabListClasses = (dark: boolean): string =>
		dark ? 'text-white/55' : 'text-text-muted';
	const handleBarClasses = (dark: boolean): string =>
		dark ? 'bg-white/18' : 'bg-text-muted/25';
	const kickerClasses = (dark: boolean): string =>
		dark ? 'text-white/35' : 'text-blue-slate';
	const closeButtonClasses = (dark: boolean): string =>
		dark
			? 'border-white/10 text-white/55 hover:text-white'
			: 'border-border-soft text-text-muted hover:text-blue-slate';
	const tabClasses = (tabId: string, dark: boolean): string =>
		selectedTabId === tabId
			? dark
				? 'bg-surface-white text-text-ink shadow-sm'
				: 'bg-blue-slate text-surface-white shadow-sm'
			: dark
				? 'text-white/55 hover:bg-white/10'
				: 'text-text-muted hover:text-text-ink hover:bg-alabaster-grey/50';
</script>

{#snippet sheetBody(isExpanded: boolean)}
	{#if isExpanded}
		<div class="flex items-center justify-between gap-4 px-5 pb-3 border-b {variant === 'dark' ? 'border-white/8' : 'border-border-soft'}">
			<div class="min-w-0">
				<p class="text-xs uppercase tracking-[0.2em] {kickerClasses(variant === 'dark')}">{t('objects.detail.supportSheet.kicker')}</p>
				<h2 class="mt-1 truncate text-sm font-medium">{title}</h2>
			</div>
			<button
				type="button"
				class="shrink-0 rounded-full border p-1.5 transition {closeButtonClasses(variant === 'dark')}"
				aria-label={t('objects.detail.supportSheet.close')}
				data-dialog-initial-focus={tabs.length === 0 ? '' : undefined}
				onclick={() => onStateChange('hidden')}
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4" aria-hidden="true">
					<path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	{:else}
		<div class="flex items-center justify-between gap-4 px-5 pb-3">
			<div class="min-w-0">
				<p class="text-xs uppercase tracking-[0.2em] {kickerClasses(variant === 'dark')}">{t('objects.detail.supportSheet.kicker')}</p>
				<h2 class="mt-1 truncate text-sm font-medium">{title}</h2>
			</div>
			<button
				type="button"
				class="shrink-0 rounded-full border p-1.5 transition {closeButtonClasses(variant === 'dark')}"
				aria-label={t('objects.detail.supportSheet.close')}
				onclick={() => onStateChange('hidden')}
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4" aria-hidden="true">
					<path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	{/if}

	{#if tabs.length > 0}
		<div
			role="tablist"
			aria-orientation={orientation}
			class="flex gap-1 px-5 py-2 {isExpanded ? 'border-b border-border-soft/50' : ''} {tabListClasses(variant === 'dark')}"
		>
			{#each tabs as tab (tab.id)}
				<button
					type="button"
					role="tab"
					id={`${idPrefix}-tab-${tab.id}`}
					aria-controls={`${idPrefix}-panel-${tab.id}`}
					aria-selected={selectedTabId === tab.id}
					tabindex={tabIndexById(tab.id)}
					onclick={() => handleTabSelect(tab.id)}
					onkeydown={(event) => handleTabKeydown(event, tab.id)}
					class="rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-slate/40 {tabClasses(tab.id, variant === 'dark')}"
					data-dialog-initial-focus={isExpanded && selectedTabId === tab.id ? '' : undefined}
				>
					{tab.label}
				</button>
			{/each}
		</div>
	{/if}

	{#if tabs.length > 0}
		{#each tabs as tab (tab.id)}
			<div
				role="tabpanel"
				id={`${idPrefix}-panel-${tab.id}`}
				aria-labelledby={`${idPrefix}-tab-${tab.id}`}
				tabindex="0"
				hidden={selectedTabId !== tab.id}
				class="overflow-y-auto px-5 py-5 {isExpanded ? 'max-h-[65vh]' : 'max-h-[25vh]'}"
			>
				{#if selectedTabId === tab.id}
					{@render children?.()}
				{/if}
			</div>
		{/each}
	{:else}
		<div class="overflow-y-auto px-5 py-5 {isExpanded ? 'max-h-[65vh]' : 'max-h-[25vh]'}">
			{@render children?.()}
		</div>
	{/if}
{/snippet}

{#if sheetState === "expanded"}
	<BaseDialog
		open={true}
		label={t('objects.detail.supportSheet.kicker')}
		onClose={() => onStateChange('hidden')}
		containerClass="items-end"
		panelClass="flex w-full flex-col rounded-t-[1.6rem] border-t shadow-[0_-12px_40px_rgba(31,47,56,0.18)] {sheetClasses(variant === 'dark')}"
		restoreFocus={() => {
			if (!restoreToPeekHandle) return launcherFocus?.() ?? null;
			const handle = (peekHandleEl ??
				document.getElementById(`${idPrefix}-peek-handle`)) as HTMLElement | null;
			if (handle?.isConnected) {
				restoreToPeekHandle = false;
				return handle;
			}
			void tick().then(() => {
				restoreToPeekHandle = false;
				const late = (peekHandleEl ??
					document.getElementById(`${idPrefix}-peek-handle`)) as HTMLElement | null;
				if (late?.isConnected) late.focus();
			});
			return null;
		}}
	>
		<button
			type="button"
			class="flex w-full flex-col items-center px-5 pb-2 pt-3"
			onclick={handleToggle}
			aria-label={t('objects.detail.supportSheet.collapse')}
		>
			<div class="h-1 w-9 rounded-full {handleBarClasses(variant === 'dark')}"></div>
		</button>
		{@render sheetBody(true)}
	</BaseDialog>
{:else if sheetState === "peek"}
	<aside
		class="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[1.6rem] border-t shadow-[0_-12px_40px_rgba(31,47,56,0.18)] {sheetClasses(variant === 'dark')}"
		in:fly={{ y: 240, duration: 220 }}
		out:fly={{ y: 240, duration: 180 }}
	>
		<button
			bind:this={peekHandleEl}
			type="button"
			id={`${idPrefix}-peek-handle`}
			class="flex w-full flex-col items-center px-5 pb-2 pt-3"
			onclick={handleToggle}
			aria-label={t('objects.detail.supportSheet.expand')}
		>
			<div class="h-1 w-9 rounded-full {handleBarClasses(variant === 'dark')}"></div>
		</button>
		{@render sheetBody(false)}
	</aside>
{/if}
