<script lang="ts">
	import BaseButton from '$lib/components/BaseButton.svelte';
</script>

<section class="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">Component</p>
		<h1 class="font-display text-3xl text-[var(--burnt-peach)]">BaseButton</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">Primary and secondary CTA styles.</p>
	</header>
	<div class="flex flex-wrap gap-4">
		<BaseButton variant="primary">Start ingestion</BaseButton>
		<BaseButton variant="secondary">Download catalog.json</BaseButton>
	</div>
</section>
