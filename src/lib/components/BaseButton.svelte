<script lang="ts">
	let {
		variant = 'primary',
		type = 'button',
		class: className = '',
		children,
		...rest
	} = $props<{
		variant?: 'primary' | 'secondary';
		type?: 'button' | 'submit' | 'reset';
		class?: string;
		children?: () => unknown;
	}>();

	const variantClass = () =>
		variant === 'primary'
			? 'bg-[var(--blue-slate)] text-[var(--surface-white)]'
			: 'border border-[var(--blue-slate)] text-[var(--blue-slate)]';
</script>

<button
	{type}
	class={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] ${variantClass()} ${className}`}
	{...rest}
>
	{@render children?.()}
</button>
