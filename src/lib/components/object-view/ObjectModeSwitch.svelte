<script lang="ts">
	let { editHref = '#', editDisabled = false } = $props<{ editHref?: string; editDisabled?: boolean }>();
</script>

<div class="inline-flex items-center rounded-full border border-border-soft bg-surface-white/90 p-1 text-[10px] uppercase tracking-[0.2em] shadow-sm backdrop-blur">
	<span class="rounded-full bg-blue-slate px-3 py-1.5 text-surface-white">View</span>
	{#if editDisabled}
		<button
			type="button"
			aria-disabled={true}
			title="Edit mode is intentionally not implemented in this prototype."
			class="rounded-full px-3 py-1.5 cursor-not-allowed text-text-muted/70"
		>
			Edit
		</button>
	{:else}
		<a
			href={editHref}
			title={editHref}
			class="rounded-full px-3 py-1.5 text-blue-slate hover:bg-pale-sky/35"
		>
			Edit
		</a>
	{/if}
</div>
