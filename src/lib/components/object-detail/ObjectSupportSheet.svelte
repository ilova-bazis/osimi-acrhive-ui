<script lang="ts">
	import { fly } from 'svelte/transition';

	export type SupportSheetState = 'hidden' | 'peek' | 'expanded';

	let {
		state,
		title,
		variant = 'light',
		onStateChange,
		children
	} = $props<{
		state: SupportSheetState;
		title: string;
		variant?: 'light' | 'dark';
		onStateChange: (state: SupportSheetState) => void;
		children?: () => unknown;
	}>();

	const handleToggle = (): void => {
		if (state === 'peek') onStateChange('expanded');
		else if (state === 'expanded') onStateChange('peek');
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

		<div class={`flex items-center justify-between gap-4 px-5 pb-3 ${state === 'expanded' ? `border-b ${variant === 'dark' ? 'border-white/8' : 'border-border-soft'}` : ''}`}>
			<div class="min-w-0">
				<p class={`text-[10px] uppercase tracking-[0.2em] ${variant === 'dark' ? 'text-white/35' : 'text-blue-slate'}`}>Support</p>
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

		{#if state === 'expanded'}
			<div class="max-h-[65vh] overflow-y-auto px-5 py-5">
				{@render children?.()}
			</div>
		{/if}
	</aside>
{/if}
