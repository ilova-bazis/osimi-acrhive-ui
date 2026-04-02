<script lang="ts">
	import ObjectModeSwitch from '$lib/components/object-view/ObjectModeSwitch.svelte';
	import ObjectViewStatusBadge from '$lib/components/object-view/ObjectViewStatusBadge.svelte';
	import type { ObjectViewStatus } from '$lib/objectView/types';

	let {
		backHref,
		title,
		status,
		reviewLabel,
		onInfoToggle,
		variant = 'dark'
	} = $props<{
		backHref: string;
		title: string;
		status: ObjectViewStatus;
		reviewLabel: string;
		onInfoToggle: () => void;
		variant?: 'light' | 'dark';
	}>();

	const isDark = $derived(variant === 'dark');
</script>

<header class="relative z-20 shrink-0 border-b {isDark ? 'border-white/8 bg-[#0e1a1f]' : 'border-border-soft bg-surface-white'}">
	<div class="mx-auto flex max-w-[96rem] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
		<div class="flex min-w-0 items-center gap-3">
			<a
				href={backHref}
				class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition {isDark
					? 'border-white/12 text-pale-sky hover:bg-white/8'
					: 'border-border-soft text-blue-slate hover:bg-pale-sky/20'}"
				aria-label="Back"
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true">
					<path d="M11.5 4.5L6 10l5.5 5.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</a>
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="truncate font-display text-lg {isDark ? 'text-surface-white' : 'text-text-ink'}">{title}</h1>
					{#if !isDark}
						<ObjectViewStatusBadge {status} />
					{:else}
						<span class="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-pale-sky">
							<span class="h-1.5 w-1.5 rounded-full {status === 'NEEDS_REVIEW' ? 'bg-burnt-peach' : 'bg-pale-sky'}"></span>
							{status.replace('_', ' ')}
						</span>
					{/if}
				</div>
				<p class="mt-0.5 truncate text-xs {isDark ? 'text-pale-sky/50' : 'text-text-muted'}">{reviewLabel}</p>
			</div>
		</div>

		<div class="flex shrink-0 items-center gap-2">
			<button
				type="button"
				onclick={onInfoToggle}
				class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition {isDark
					? 'border-white/12 text-pale-sky hover:bg-white/8'
					: 'border-border-soft text-blue-slate hover:bg-pale-sky/20'}"
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" class="h-3.5 w-3.5" aria-hidden="true">
					<circle cx="10" cy="10" r="7" />
					<path d="M10 8v4" stroke-linecap="round" />
					<circle cx="10" cy="6" r="0.8" fill="currentColor" stroke="none" />
				</svg>
				Info
			</button>
			{#if isDark}
				<div class="inline-flex items-center rounded-full border border-white/12 bg-white/6 p-1 text-[10px] uppercase tracking-[0.2em]">
					<span class="rounded-full bg-pale-sky/25 px-2.5 py-1 text-pale-sky">View</span>
					<span class="cursor-not-allowed rounded-full px-2.5 py-1 text-white/25" title="Edit mode is not implemented in this prototype.">Edit</span>
				</div>
			{:else}
				<ObjectModeSwitch />
			{/if}
		</div>
	</div>
</header>
