<script lang="ts">
	let {
		title,
		url,
		emptyLabel = 'No text available.',
		compact = false
	} = $props<{
		title: string;
		url: string | null;
		emptyLabel?: string;
		compact?: boolean;
	}>();

	let text = $state<string | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!url) {
			text = null;
			error = null;
			loading = false;
			return;
		}

		let cancelled = false;
		loading = true;
		text = null;
		error = null;

		void fetch(url)
			.then(async (response) => {
				if (!response.ok) {
					throw new Error('Failed to load text preview.');
				}
				return response.text();
			})
			.then((value) => {
				if (cancelled) return;
				text = value.trim().length > 0 ? value : null;
			})
			.catch(() => {
				if (cancelled) return;
				error = 'Unable to load preview.';
			})
			.finally(() => {
				if (cancelled) return;
				loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<section class="rounded-[1.4rem] border border-border-soft bg-surface-white/90 p-4">
	<div class="flex items-center justify-between gap-3">
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{title}</p>
		{#if loading}
			<p class="text-xs text-text-muted">Loading</p>
		{/if}
	</div>

	{#if error}
		<p class="mt-3 text-sm text-burnt-peach">{error}</p>
	{:else if text}
		<div class={`mt-3 overflow-y-auto rounded-2xl border border-border-soft bg-alabaster-grey/30 p-4 text-sm leading-relaxed text-text-ink ${compact ? 'max-h-48' : 'max-h-72'}`}>
			<p class="whitespace-pre-wrap">{text}</p>
		</div>
	{:else if !loading}
		<p class="mt-3 text-sm text-text-muted">{emptyLabel}</p>
	{/if}
</section>
