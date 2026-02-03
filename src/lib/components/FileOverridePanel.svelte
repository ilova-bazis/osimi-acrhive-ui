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

<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
	<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{title}</p>
	<p class="mt-1 text-sm text-text-muted">{subtitle}</p>
	<div class="mt-4 space-y-3 text-sm text-text-ink">
		{#each fields as field (field.label)}
			<div class="flex items-center justify-between">
				<span>{field.label}</span>
				<span class="text-blue-slate">{field.value}</span>
			</div>
		{/each}
		<div class="flex flex-wrap gap-2">
			{#each badges as badge (badge.label)}
				<Chip
					class={
						badge.tone === 'attention'
							? 'border-border-soft bg-pearl-beige/45 text-burnt-peach'
							: 'border-border-soft bg-pale-sky/25 text-blue-slate'
					}
				>
					{badge.label}
				</Chip>
			{/each}
		</div>
		<p class="rounded-xl border border-pearl-beige/70 bg-pearl-beige/55 p-3 text-xs text-text-muted">
			{note}
		</p>
	</div>
</div>
