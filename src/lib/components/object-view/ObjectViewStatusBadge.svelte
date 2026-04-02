<script lang="ts">
	import type { ObjectViewStatus } from '$lib/objectView/types';

	let { status } = $props<{ status: ObjectViewStatus }>();

	const toneClass = $derived.by(() => {
		switch (status) {
			case 'READY':
				return 'border-blue-slate/25 bg-pale-sky/45 text-blue-slate';
			case 'PROCESSING':
				return 'border-blue-slate/30 bg-alabaster-grey/80 text-blue-slate';
			case 'NEEDS_REVIEW':
				return 'border-burnt-peach/40 bg-pearl-beige/85 text-burnt-peach';
		}
	});
</script>

<span class={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${toneClass}`}>
	<span class="h-2 w-2 rounded-full bg-current"></span>
	{status.replace('_', ' ')}
</span>
