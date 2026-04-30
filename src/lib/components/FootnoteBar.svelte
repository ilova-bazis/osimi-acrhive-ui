<script lang="ts">
	let {
		left,
		right,
	} = $props<{
		left?: () => unknown;
		right?: () => unknown;
	}>();
</script>

<footer class="sticky bottom-0 z-30 border-t border-border-soft bg-alabaster-grey px-4 py-[14px] sm:px-6">
	<div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-5">
		<div class="flex items-center gap-4">
			{@render left?.()}
		</div>
		<div class="flex items-center gap-3">
			{@render right?.()}
		</div>
	</div>
</footer>
