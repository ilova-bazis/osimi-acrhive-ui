<script lang="ts">
	import StatusBadge from './StatusBadge.svelte';

	let { title, subtitle, countLabel, statuses } = $props<{
		title: string;
		subtitle: string;
		countLabel: string;
		statuses: { key: string; label: string }[];
	}>();
</script>

<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
	<div class="flex items-center justify-between">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{title}</p>
			<p class="mt-1 text-sm text-text-muted">{subtitle}</p>
		</div>
		<div class="text-xs text-text-muted">{countLabel}</div>
	</div>
	<div class="mt-4 flex flex-wrap gap-3">
		{#each statuses as status (status.key)}
			<StatusBadge status={status.key} label={status.label} />
		{/each}
	</div>
</div>
