<script lang="ts">
	import type { StatusBadgeTone } from '$lib/types';
	import Chip from './Chip.svelte';

	let { title, subtitle, fields, badges, note } = $props<{
		title: string;
		subtitle: string;
		fields: { label: string; value: string }[];
		badges: ReadonlyArray<{ label: string; tone: StatusBadgeTone }>;
		note: string;
	}>();
</script>

<div class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-white)] px-6 py-5">
	<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">{title}</p>
	<p class="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
	<div class="mt-4 space-y-3 text-sm text-[var(--text-ink)]">
		{#each fields as field}
			<div class="flex items-center justify-between">
				<span>{field.label}</span>
				<span class="text-[var(--blue-slate)]">{field.value}</span>
			</div>
		{/each}
		<div class="flex flex-wrap gap-2">
			{#each badges as badge}
				<Chip
					class={
						badge.tone === 'attention'
							? 'border-[var(--border-soft)] bg-[rgba(232,218,178,0.45)] text-[var(--burnt-peach)]'
							: 'border-[var(--border-soft)] bg-[rgba(192,214,223,0.25)] text-[var(--blue-slate)]'
					}
				>
					{badge.label}
				</Chip>
			{/each}
		</div>
		<p class="rounded-xl border border-[rgba(232,218,178,0.7)] bg-[rgba(232,218,178,0.55)] p-3 text-xs text-[var(--text-muted)]">
			{note}
		</p>
	</div>
</div>
