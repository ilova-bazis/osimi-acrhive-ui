<script lang="ts">
	import BaseButton from './BaseButton.svelte';

	let { note, primaryLabel, secondaryLabel } = $props<{
		note: string;
		primaryLabel: string;
		secondaryLabel: string;
	}>();
</script>

<footer class="border-t border-[var(--border-soft)] bg-[var(--surface-white)]">
	<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
		<p class="text-sm text-[var(--text-muted)]">{note}</p>
		<div class="flex flex-wrap gap-3">
			<BaseButton variant="secondary">{secondaryLabel}</BaseButton>
			<BaseButton variant="primary">{primaryLabel}</BaseButton>
		</div>
	</div>
</footer>
