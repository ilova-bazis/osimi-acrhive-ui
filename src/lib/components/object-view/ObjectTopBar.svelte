<script lang="ts">
	import ObjectModeSwitch from '$lib/components/object-view/ObjectModeSwitch.svelte';
	import ObjectViewStatusBadge from '$lib/components/object-view/ObjectViewStatusBadge.svelte';
	import type { ObjectViewStatus } from '$lib/objectView/types';

	let {
		backHref,
		title,
		status,
		reviewLabel,
		onInfoToggle
	} = $props<{
		backHref: string;
		title: string;
		status: ObjectViewStatus;
		reviewLabel: string;
		onInfoToggle: () => void;
	}>();
</script>

<header class="sticky top-0 z-20 border-b border-border-soft bg-surface-white/92 backdrop-blur">
	<div class="mx-auto flex max-w-[96rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
		<div class="flex min-w-0 items-center gap-3 sm:gap-4">
			<button
				type="button"
				onclick={() => {
					window.location.href = backHref;
				}}
				class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface-white text-blue-slate transition hover:bg-pale-sky/25"
				aria-label="Back"
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4" aria-hidden="true">
					<path d="M11.5 4.5L6 10l5.5 5.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<div class="min-w-0">
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="truncate font-display text-xl text-text-ink sm:text-2xl">{title}</h1>
					<ObjectViewStatusBadge {status} />
				</div>
				<p class="mt-1 truncate text-xs text-text-muted sm:text-sm">Read-only object view. {reviewLabel}.</p>
			</div>
		</div>

		<div class="flex shrink-0 items-center gap-2 sm:gap-3">
			<button
				type="button"
				onclick={onInfoToggle}
				class="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/25"
			>
				<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" class="h-4 w-4" aria-hidden="true">
					<circle cx="10" cy="10" r="7" />
					<path d="M10 8v4" stroke-linecap="round" />
					<circle cx="10" cy="6" r="0.8" fill="currentColor" stroke="none" />
				</svg>
				Info
			</button>
			<ObjectModeSwitch />
		</div>
	</div>
</header>
