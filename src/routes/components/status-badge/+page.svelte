<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
</script>

<section class="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-[var(--blue-slate)]">Component</p>
		<h1 class="font-display text-3xl text-[var(--burnt-peach)]">StatusBadge</h1>
		<p class="mt-2 text-sm text-[var(--text-muted)]">Palette-defined file state badges.</p>
	</header>
	<div class="flex flex-wrap gap-3">
		<StatusBadge status="queued" label="Queued" />
		<StatusBadge status="processing" label="Processing" />
		<StatusBadge status="extracted" label="Extracted" />
		<StatusBadge status="needs-review" label="Needs Review" />
		<StatusBadge status="approved" label="Approved" />
		<StatusBadge status="blocked" label="Blocked" />
		<StatusBadge status="skipped" label="Skipped" />
		<StatusBadge status="failed" label="Failed" />
	</div>
</section>
