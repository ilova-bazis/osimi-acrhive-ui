<script lang="ts">
	import Chip from './Chip.svelte';

let { title, description, fields, tags, tagsLabel = 'Tags', heading = 'NoorMags Issue 76-79' } = $props<{
	title: string;
	description: string;
	fields: { label: string; value: string }[];
	tags: string[];
	tagsLabel?: string;
	heading?: string;
}>();
</script>

<div class="rounded-2xl border border-border-strong bg-blue-slate px-6 py-6 text-pale-sky">
	<p class="text-xs uppercase tracking-[0.2em] text-burnt-peach">{title}</p>
<h2 class="mt-3 font-display text-xl text-surface-white">{heading}</h2>
	<p class="mt-2 text-sm text-pale-sky">{description}</p>
	<div class="mt-5 space-y-3 text-sm">
		{#each fields as field (field.label)}
			<div class="flex items-center justify-between border-b border-pale-sky/20 pb-3">
				<span class="text-pale-sky">{field.label}</span>
				<span class="text-surface-white">{field.value}</span>
			</div>
		{/each}
	</div>
	{#if tags.length}
		<div class="mt-5">
			<p class="text-xs uppercase tracking-[0.2em] text-burnt-peach">{tagsLabel}</p>
			<div class="mt-3 flex flex-wrap gap-2 text-xs">
				{#each tags as tag (tag)}
					<Chip class="border-pale-sky/40 bg-pale-sky/18">{tag}</Chip>
				{/each}
			</div>
		</div>
	{/if}
</div>
