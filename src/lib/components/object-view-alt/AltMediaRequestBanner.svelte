<script lang="ts">
	type Availability = 'AVAILABLE' | 'ARCHIVED' | 'RESTORE_PENDING' | 'RESTORING' | 'UNAVAILABLE';

	let {
		availability,
		mediaLabel,
		variant = 'dark',
		onRequest
	} = $props<{
		availability: Availability;
		mediaLabel: string;
		variant?: 'light' | 'dark';
		onRequest: () => void;
	}>();

	const isDark = $derived(variant === 'dark');
	const isRestoring = $derived(availability === 'RESTORE_PENDING' || availability === 'RESTORING');
</script>

{#if availability !== 'AVAILABLE'}
	<div class="flex flex-col items-center gap-4 rounded-2xl border px-6 py-6 text-center {isDark
		? 'border-white/10 bg-white/6 backdrop-blur'
		: 'border-blue-slate/12 bg-blue-slate/6 backdrop-blur'}">

		<!-- Icon -->
		<div class="inline-flex h-12 w-12 items-center justify-center rounded-full {isDark ? 'bg-white/8' : 'bg-blue-slate/8'}">
			{#if availability === 'UNAVAILABLE'}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6 {isDark ? 'text-pale-sky/50' : 'text-text-muted'}" aria-hidden="true">
					<circle cx="12" cy="12" r="9" />
					<path d="M8 12h8" stroke-linecap="round" />
				</svg>
			{:else if isRestoring}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6 {isDark ? 'text-pearl-beige' : 'text-blue-slate'}" aria-hidden="true">
					<path d="M4.5 12a7.5 7.5 0 1 1 2 5.1" stroke-linecap="round" stroke-linejoin="round" />
					<path d="M4.5 17.5v-5h5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6 {isDark ? 'text-pale-sky/70' : 'text-blue-slate'}" aria-hidden="true">
					<rect x="3" y="6" width="18" height="13" rx="2" />
					<path d="M3 10h18" />
					<path d="M8 14h2" stroke-linecap="round" />
				</svg>
			{/if}
		</div>

		<!-- Message -->
		{#if availability === 'UNAVAILABLE'}
			<div>
				<p class="text-sm font-medium {isDark ? 'text-pale-sky/70' : 'text-text-ink'}">Not available</p>
				<p class="mt-1 text-xs {isDark ? 'text-pale-sky/40' : 'text-text-muted'}">This {mediaLabel} is not currently available for access.</p>
			</div>
		{:else if isRestoring}
			<div>
				<p class="text-sm font-medium {isDark ? 'text-pearl-beige' : 'text-blue-slate'}">
					<span class="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full {isDark ? 'bg-pearl-beige' : 'bg-blue-slate'}"></span>
					Restoring
				</p>
				<p class="mt-1 text-xs {isDark ? 'text-pale-sky/40' : 'text-text-muted'}">Your {mediaLabel} will be ready shortly. This usually takes a few minutes.</p>
			</div>
		{:else}
			<div>
				<p class="text-sm font-medium {isDark ? 'text-pale-sky/80' : 'text-text-ink'}">Stored in archive</p>
				<p class="mt-1 text-xs {isDark ? 'text-pale-sky/40' : 'text-text-muted'}">This {mediaLabel} is in long-term storage. Request access to view the full file.</p>
			</div>
			<button
				type="button"
				class="rounded-full px-5 py-2 text-[10px] uppercase tracking-[0.2em] transition {isDark
					? 'bg-pearl-beige text-blue-slate-deep hover:bg-[#f1e6c8]'
					: 'bg-blue-slate text-surface-white hover:bg-blue-slate-mid-dark'}"
				onclick={onRequest}
			>
				Request access
			</button>
		{/if}
	</div>
{/if}
