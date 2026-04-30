<script lang="ts">
	let { children } = $props<{ children: () => unknown }>();
</script>

<span class="inline-block font-mono text-xs uppercase tracking-[0.16em] text-burnt-peach border border-burnt-peach/45 bg-pearl-beige/70 px-2 py-[2px] rounded-sm">
	{@render children()}
</span>
