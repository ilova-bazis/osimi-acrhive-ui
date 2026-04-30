<script lang="ts">
	import Icon from './Icon.svelte';
	import Chip from './Chip.svelte';

	let {
		icon,
		title,
		sub,
		selected,
		onclick,
		badge,
		native,
		compact = false,
		disabled = false,
	} = $props<{
		icon?: string;
		title: string;
		sub?: string;
		selected: boolean;
		onclick: () => void;
		badge?: string;
		native?: string;
		compact?: boolean;
		disabled?: boolean;
	}>();
</script>

<button
	type="button"
	aria-pressed={selected}
	{onclick}
	{disabled}
	class={`text-left flex flex-col transition-all rounded-2xl border outline-none font-body
		${compact ? 'py-3 px-4 gap-1' : 'py-4 px-5 gap-2'}
		${selected && !disabled
			? 'bg-pale-sky/20 border-blue-slate'
			: disabled
			? 'bg-alabaster-grey/60 border-border-soft'
			: 'bg-surface-white border-border-soft hover:bg-pale-sky/12'
		}
	`}
>
	<div class="flex items-center gap-2 w-full">
		{#if icon}
			<Icon name={icon} size={16} />
		{/if}
		<span class={`font-display flex-1 ${compact ? 'text-sm' : 'text-base'}`}>{title}</span>
		{#if badge}
			<Chip variant="peach">{badge}</Chip>
		{/if}
	</div>
	{#if native}
		<span class="farsi text-xs text-text-muted">{native}</span>
	{/if}
	{#if sub}
		<span class="text-xs text-text-muted leading-snug">{sub}</span>
	{/if}
</button>
