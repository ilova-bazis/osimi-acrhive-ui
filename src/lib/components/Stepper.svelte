<script lang="ts">
	import Icon from './Icon.svelte';

	type Step = { id: string; label: string };

	let {
		steps,
		current,
		onJump,
	} = $props<{
		steps: Step[];
		current: number;
		onJump?: (index: number) => void;
	}>();
</script>

<ol class="flex items-center gap-3 list-none m-0 p-0">
	{#each steps as step, i}
		{@const state = i < current ? 'done' : i === current ? 'current' : 'todo'}
		<li
			class="flex items-center gap-2.5"
			style={state === 'todo' ? 'opacity: 0.4' : ''}
		>
			<button
				type="button"
				disabled={state !== 'done'}
				onclick={() => state === 'done' && onJump?.(i)}
				class={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold leading-none border
					${state === 'done' ? 'bg-text-ink text-surface-white border-text-ink cursor-pointer' : ''}
					${state === 'current' ? 'bg-burnt-peach text-surface-white border-burnt-peach cursor-default' : ''}
					${state === 'todo' ? 'bg-transparent text-text-muted border-border-strong cursor-default' : ''}
				`}
			>
				{#if state === 'done'}
					<Icon name="check" size={10} stroke={2.5} />
				{:else}
					{String(i + 1).padStart(2, '0')}
				{/if}
			</button>
			<span class={`text-xs uppercase tracking-[0.2em] whitespace-nowrap
				${state === 'current' ? 'font-medium text-text-ink' : 'text-text-muted'}
			`}>
				{step.label}
			</span>
		</li>
		{#if i < steps.length - 1}
			<li aria-hidden="true" class="w-6 flex-none self-center h-px bg-border-strong opacity-50"></li>
		{/if}
	{/each}
</ol>
