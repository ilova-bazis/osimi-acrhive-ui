<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;

	let name = '';
	let description = '';

	$: errorMessage = form?.error ?? '';
</script>

<main class="mx-auto flex min-h-[80vh] max-w-5xl flex-col gap-6 px-6 py-10">
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingestion</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">New Ingestion</h2>
			<p class="mt-2 text-sm text-text-muted">
				Create a new batch with a human-readable name. You can add files and intent details next.
			</p>
		</div>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<form class="space-y-5" method="POST">
			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="name">Batch name</label>
				<input
					id="name"
					name="name"
					type="text"
					class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
					placeholder="e.g. NoorMags Issue 80-82"
					bind:value={name}
					required
				/>
			</div>
			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="description">
					Description / notes (optional)
				</label>
				<textarea
					id="description"
					name="description"
					rows="4"
					class="w-full resize-none rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
					placeholder="Add any context that will help the archival review."
					bind:value={description}
				></textarea>
			</div>
			{#if errorMessage}
				<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
					{errorMessage}
				</p>
			{/if}
			<div class="flex flex-wrap items-center justify-end gap-3">
				<button
					type="submit"
					class="rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
				>
					Continue to setup
				</button>
			</div>
		</form>
	</section>
</main>
