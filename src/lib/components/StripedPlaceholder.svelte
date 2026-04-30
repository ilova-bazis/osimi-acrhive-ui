<script lang="ts">
	let {
		width = '100%',
		height = 80,
		label,
	} = $props<{
		width?: string;
		height?: number;
		label?: string;
	}>();
</script>

<div
	class="border border-dashed border-border-strong rounded-sm flex items-center justify-center font-mono text-[11px] text-text-muted tracking-[0.04em]"
	style={`width: ${width}; height: ${height}px; background-image: repeating-linear-gradient(135deg, var(--alabaster-grey) 0 6px, rgb(var(--palette-pearl-beige) / 0.4) 6px 12px)`}
>
	{label ?? ''}
</div>
