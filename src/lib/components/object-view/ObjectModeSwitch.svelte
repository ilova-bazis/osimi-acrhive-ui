<script lang="ts">
	let { editHref = '#', editDisabled = true } = $props<{ editHref?: string; editDisabled?: boolean }>();
</script>

<div class="inline-flex items-center rounded-full border border-border-soft bg-surface-white/90 p-1 text-[10px] uppercase tracking-[0.2em] shadow-sm backdrop-blur">
	<span class="rounded-full bg-blue-slate px-3 py-1.5 text-surface-white">View</span>
	<button
		type="button"
		aria-disabled={editDisabled}
		title={editDisabled ? 'Edit mode is intentionally not implemented in this prototype.' : editHref}
		class={`rounded-full px-3 py-1.5 ${editDisabled ? 'cursor-not-allowed text-text-muted/70' : 'text-blue-slate hover:bg-pale-sky/35'}`}
	>
		Edit
	</button>
</div>
