<script lang="ts">
	let {
		top,
		left,
		right,
	} = $props<{
		top?: () => unknown;
		left?: () => unknown;
		right?: () => unknown;
	}>();
</script>

<footer class="sticky bottom-0 z-30 border-t border-border-soft bg-alabaster-grey px-4 py-2 sm:px-6">
	<div class="mx-auto w-full max-w-6xl space-y-1.5">
		{#if top}
			<div class="flex items-center justify-center text-center">
				{@render top?.()}
			</div>
		{/if}
		<div class="flex w-full items-center justify-between gap-5">
			<div class="flex items-center gap-4">
				{@render left?.()}
			</div>
			<div class="flex items-center gap-3">
				{@render right?.()}
			</div>
		</div>
	</div>
</footer>
