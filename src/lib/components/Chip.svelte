<script lang="ts">
	let { class: className = '', children } = $props<{ class?: string; children?: () => unknown }>();
</script>

<span class={`rounded-full border px-3 py-1 text-xs ${className}`}>
	{@render children?.()}
</span>
