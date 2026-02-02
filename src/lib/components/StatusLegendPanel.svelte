<script lang="ts">
	import StatusBadge from './StatusBadge.svelte';

	let { title, subtitle, countLabel, statuses } = $props<{
		title: string;
		subtitle: string;
		countLabel: string;
		statuses: { key: string; label: string }[];
	}>();
</script>

<div class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-white)] px-6 py-5">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">{title}</p>
			<p class="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
		</div>
		<div class="text-xs text-[var(--text-muted)]">{countLabel}</div>
	</div>
	<div class="mt-4 flex flex-wrap gap-3">
		{#each statuses as status}
			<StatusBadge status={status.key} label={status.label} />
		{/each}
	</div>
</div>
