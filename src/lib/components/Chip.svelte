<script lang="ts">
	let {
		variant = 'default',
		class: className = '',
		children,
	} = $props<{
		variant?: 'default' | 'sky' | 'peach' | 'warn' | 'ok' | 'ai';
		class?: string;
		children?: () => unknown;
	}>();

	const variantClass = $derived(
		variant === 'sky'   ? 'bg-pale-sky text-blue-slate border-transparent' :
		variant === 'peach' ? 'bg-pearl-beige/60 text-burnt-peach border-transparent' :
		variant === 'warn'  ? 'bg-pearl-beige text-burnt-peach border-transparent' :
		variant === 'ok'    ? 'bg-pale-sky/40 text-blue-slate-deep border-transparent' :
		variant === 'ai'    ? 'bg-pale-sky/30 text-blue-slate border-blue-slate/20 font-mono text-[10px] lowercase tracking-[0.02em]' :
		'bg-alabaster-grey text-text-muted border-border-soft'
	);
</script>

<span class={`inline-flex items-center rounded-full border px-[10px] py-[3px] text-[10.5px] font-medium tracking-[0.04em] uppercase whitespace-nowrap ${variantClass} ${className}`}>
	{@render children?.()}
</span>
