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

	const pct = $derived(total ? Math.min(100, (value / total) * 100) : 0);

	const fillClass = $derived(
		tone === 'peach' ? 'bg-burnt-peach'
		: tone === 'sky' ? 'bg-blue-slate'
		: 'bg-blue-slate-deep'
	);
</script>

<div class="h-[2px] bg-alabaster-grey rounded-full overflow-hidden relative">
	<div
		class={`h-full ${fillClass} transition-[width] duration-[400ms] ease-out`}
		style={`width: ${pct}%`}
	></div>
</div>
