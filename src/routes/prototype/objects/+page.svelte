<script lang="ts">
	import Chip from '$lib/components/Chip.svelte';
	import ObjectViewStatusBadge from '$lib/components/object-view/ObjectViewStatusBadge.svelte';
	import { mockObjectViews } from '$lib/objectView/mockObjects';
</script>

<main class="min-h-screen bg-[linear-gradient(180deg,#f5f2eb_0%,#eef3f4_100%)] px-6 py-10">
	<div class="mx-auto max-w-6xl">
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Prototype</p>
		<h1 class="mt-3 font-display text-4xl text-text-ink">Object View Review</h1>
		<p class="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">Browse the four mocked object states below. Each route is fully local and focused on read-only viewing rather than metadata editing.</p>

		<div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{#each mockObjectViews as object (object.id)}
				<div class="w-full rounded-[1.6rem] border border-border-soft bg-surface-white p-5 text-left shadow-[0_18px_45px_rgba(31,47,56,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(31,47,56,0.12)]">
					<div class="flex items-center justify-between gap-3">
						<Chip class="border-blue-slate/20 bg-pale-sky/20 text-[10px] uppercase tracking-[0.2em] text-blue-slate">{object.mediaType}</Chip>
						<ObjectViewStatusBadge status={object.status} />
					</div>
					<h2 class="mt-5 font-display text-2xl text-text-ink">{object.title}</h2>
					<p class="mt-2 text-sm text-text-muted">{object.subtitle}</p>
					<div class="mt-5 flex items-center gap-2">
						<button
							type="button"
							onclick={() => {
								window.location.href = `/prototype/objects/${object.id}`;
							}}
							class="rounded-full border border-border-soft bg-surface-white px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/20"
						>
							Open view
						</button>
						<button
							type="button"
							onclick={() => {
								window.location.href = `/prototype/objects/${object.id}/edit`;
							}}
							class="rounded-full bg-blue-slate px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-surface-white transition hover:bg-blue-slate-mid-dark"
						>
							Open edit
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</main>
