<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
</script>

<section class="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Component</p>
		<h1 class="font-display text-3xl text-burnt-peach">Chip</h1>
		<p class="mt-2 text-sm text-text-muted">Pill styling for tags and metadata.</p>
	</header>
	<div class="flex flex-wrap gap-3">
		<Chip class="border-border-soft bg-surface-white text-blue-slate">
			Creates local staging batch
		</Chip>
		<Chip class="border-pale-sky/40 bg-pale-sky/18 text-blue-slate">
			Tehran
		</Chip>
		<Chip class="border-border-soft bg-pearl-beige/45 text-burnt-peach">
			Needs review
		</Chip>
	</div>
</section>
