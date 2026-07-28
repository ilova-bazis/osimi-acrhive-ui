<script lang="ts">
	let {
		value,
		total,
		tone = 'ink',
	} = $props<{
		value: number;
		total: number;
		tone?: 'ink' | 'peach' | 'sky';
	}>();

	const boundedTotal = $derived(Math.max(0, total));
	const boundedValue = $derived(Math.min(boundedTotal, Math.max(0, value)));
	const pct = $derived(boundedTotal ? Math.min(100, (boundedValue / boundedTotal) * 100) : 0);

	const fillClass = $derived(
		tone === 'peach' ? 'bg-burnt-peach'
		: tone === 'sky' ? 'bg-blue-slate'
		: 'bg-blue-slate-deep'
	);
</script>

<div
	class="h-[2px] bg-alabaster-grey rounded-full overflow-hidden relative"
	role="progressbar"
	aria-valuemin="0"
	aria-valuemax={boundedTotal}
	aria-valuenow={boundedValue}
>
	<div
		class={`h-full ${fillClass} transition-[width] duration-[400ms] ease-out`}
		style={`width: ${pct}%`}
	></div>
</div>
