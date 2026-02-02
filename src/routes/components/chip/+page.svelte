<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
</script>

<section class="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">Component</p>
		<h1 class="font-display text-3xl text-[var(--burnt-peach)]">Chip</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">Pill styling for tags and metadata.</p>
	</header>
	<div class="flex flex-wrap gap-3">
		<Chip class="border-[var(--border-soft)] bg-[var(--surface-white)] text-[var(--blue-slate)]">
			Creates local staging batch
		</Chip>
		<Chip class="border-[rgba(192,214,223,0.4)] bg-[rgba(192,214,223,0.18)] text-[var(--blue-slate)]">
			Tehran
		</Chip>
		<Chip class="border-[var(--border-soft)] bg-[rgba(232,218,178,0.45)] text-[var(--burnt-peach)]">
			Needs review
		</Chip>
	</div>
</section>
