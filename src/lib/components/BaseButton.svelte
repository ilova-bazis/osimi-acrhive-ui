<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		variant = 'default',
		type = 'button',
		class: className = '',
		children,
		...rest
	} = $props<{
		variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'peach';
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		children?: () => unknown;
	} & HTMLButtonAttributes>();

	const variantClass = $derived(
		variant === 'primary'   ? 'bg-blue-slate-deep text-surface-white border-blue-slate-deep' :
		variant === 'secondary' ? 'border border-blue-slate text-blue-slate' :
		variant === 'ghost'     ? 'border-transparent hover:bg-pale-sky/20 hover:border-border-soft' :
		variant === 'peach'     ? 'bg-burnt-peach text-surface-white border-burnt-peach' :
		'border border-border-soft text-text-ink hover:bg-pale-sky/10'
	);
</script>

<button
	{type}
	class={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[10.5px] uppercase tracking-[0.2em] font-medium border transition-all ${variantClass} ${className}`}
	{...rest}
>
	{@render children?.()}
</button>
