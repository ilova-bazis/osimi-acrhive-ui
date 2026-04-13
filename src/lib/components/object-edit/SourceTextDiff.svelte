<script lang="ts">
	let {
		sourceLabel = 'Auto-extracted',
		curatedLabel = 'Curated',
		sourceText,
		curatedText,
		confidence,
		onCuratedChange
	}: {
		sourceLabel?: string;
		curatedLabel?: string;
		sourceText: string;
		curatedText: string;
		confidence?: number;
		onCuratedChange: (text: string) => void;
	} = $props();

	const handleCopyFromSource = (): void => {
		onCuratedChange(sourceText);
	};

	const handleReset = (): void => {
		onCuratedChange('');
	};
</script>

<div class="flex gap-4">
	<!-- Source (read-only) -->
	<div class="flex min-w-0 flex-1 flex-col">
		<div class="mb-2 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{sourceLabel}</span>
				{#if confidence !== undefined}
					<span class="rounded-full bg-pale-sky/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-blue-slate">
						{confidence}% confidence
					</span>
				{/if}
			</div>
			<span class="text-[9px] uppercase tracking-[0.12em] text-text-muted">Read-only</span>
		</div>
		<div class="flex-1 overflow-y-auto rounded-xl border border-blue-slate/15 bg-pale-sky/20 px-4 py-3 text-sm leading-relaxed text-blue-slate/85">
			{sourceText || '<span class="italic text-text-muted">No source text available</span>'}
		</div>
	</div>

	<!-- Curated (editable) -->
	<div class="flex min-w-0 flex-1 flex-col">
		<div class="mb-2 flex items-center justify-between">
			<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">{curatedLabel}</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={handleCopyFromSource}
					class="rounded-full border border-blue-slate/30 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-blue-slate transition hover:bg-pale-sky/30"
				>
					Copy from source
				</button>
				{#if curatedText}
					<button
						type="button"
						onclick={handleReset}
						class="text-[9px] uppercase tracking-[0.12em] text-burnt-peach/80 transition hover:text-burnt-peach"
					>
						Reset
					</button>
				{/if}
			</div>
		</div>
		<textarea
			class="flex-1 resize-none rounded-xl border border-pearl-beige/50 bg-pearl-beige/15 px-4 py-3 text-sm leading-relaxed text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
			rows="8"
			placeholder="Enter curated text, or copy from source and edit..."
			value={curatedText}
			oninput={(e) => onCuratedChange(e.currentTarget.value)}
		></textarea>
	</div>
</div>