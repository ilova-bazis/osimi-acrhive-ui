<script lang="ts">
	import { fly } from 'svelte/transition';

	export type SupportSheetState = 'hidden' | 'peek' | 'expanded';

	export type Tab = {
		id: string;
		label: string;
	};

	let {
		state,
		title,
		variant = 'light',
		activeTab,
		tabs = [],
		onStateChange,
		onTabChange,
		children
	} = $props<{
		state: SupportSheetState;
		title: string;
		variant?: 'light' | 'dark';
		activeTab?: string;
		tabs?: Tab[];
		onStateChange: (state: SupportSheetState) => void;
		onTabChange?: (tabId: string) => void;
		children?: () => unknown;
	}>();

	const handleToggle = (): void => {
		if (state === 'peek') onStateChange('expanded');
		else if (state === 'expanded') onStateChange('peek');
	};

	const handleTabSelect = (tabId: string): void => {
		if (onTabChange && tabId !== activeTab) {
			onTabChange(tabId);
		}
	};
</script>

{#if state === 'expanded'}
	<button
		type="button"
		class="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
		aria-label="Close support panel"
		onclick={() => onStateChange('hidden')}
	></button>
{/if}

{#if state !== 'hidden'}
	<aside
		class={`fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[1.6rem] border-t shadow-[0_-12px_40px_rgba(31,47,56,0.18)] ${variant === 'dark' ? 'border-white/10 bg-[#111a1f]/96 text-white' : 'border-border-soft bg-surface-white/96 text-text-ink'}`}
		in:fly={{ y: 240, duration: 220 }}
		out:fly={{ y: 240, duration: 180 }}
	>
		<button
			type="button"
			class="flex w-full flex-col items-center px-5 pb-2 pt-3"
			onclick={handleToggle}
			aria-label={state === 'peek' ? 'Expand support panel' : 'Collapse support panel'}
		>
			<div class={`h-1 w-9 rounded-full ${variant === 'dark' ? 'bg-white/18' : 'bg-text-muted/25'}`}></div>
		</button>

		<div class={`flex items-center justify-between gap-4 px-5 ${state === 'expanded' ? `pb-3 border-b ${variant === 'dark' ? 'border-white/8' : 'border-border-soft'}` : 'pb-3'}`}>
			<div class="min-w-0">
				<p class={`text-xs uppercase tracking-[0.2em] ${variant === 'dark' ? 'text-white/35' : 'text-blue-slate'}`}>Support</p>
				<h2 class="mt-1 truncate text-sm font-medium">{title}</h2>
			</div>
			<button
				type="button"
				class={`shrink-0 rounded-full border p-1.5 transition ${variant === 'dark' ? 'border-white/10 text-white/55 hover:text-white' : 'border-border-soft text-text-muted hover:text-blue-slate'}`}
				aria-label="Close support panel"
				onclick={() => onStateChange('hidden')}
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" class="h-4 w-4" aria-hidden="true">
					<path d="M5 5l10 10M15 5L5 15" stroke-linecap="round" />
				</svg>
			</button>
		</div>

		{#if tabs.length > 0}
			<div class={`flex gap-1 px-5 py-2 ${state === 'expanded' ? 'border-b border-border-soft/50' : ''} ${variant === 'dark' ? '' : ''}`}>
				{#each tabs as tab (tab.id)}
					<button
						type="button"
						onclick={() => handleTabSelect(tab.id)}
						class={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.2em] transition ${activeTab === tab.id ? (variant === 'dark' ? 'bg-surface-white text-text-ink shadow-sm' : 'bg-blue-slate text-surface-white shadow-sm') : (variant === 'dark' ? 'text-white/55 hover:bg-white/10' : 'text-text-muted hover:text-text-ink hover:bg-alabaster-grey/50')}`}
					>
						{tab.label}
					</button>
				{/each}
			</div>
		{/if}

		<div class={`overflow-y-auto px-5 py-5 ${state === 'peek' ? 'max-h-[25vh]' : 'max-h-[65vh]'}`}>
			{@render children?.()}
		</div>
	</aside>
{/if}
