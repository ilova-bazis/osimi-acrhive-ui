<script lang="ts">
	import type { FileStatus } from '$lib/types';

	let { status, label } = $props<{ status: FileStatus; label: string }>();

	const badgeClass = () => {
		switch (status) {
			case 'queued':
				return 'text-blue-slate border-blue-slate/35 bg-transparent';
			case 'processing':
				return 'text-blue-slate border-blue-slate/25 bg-pale-sky/55';
			case 'extracted':
				return 'text-blue-slate border-blue-slate/25 bg-pale-sky/75';
			case 'needs-review':
				return 'text-burnt-peach border-burnt-peach/45 bg-pearl-beige/75';
			case 'approved':
				return 'text-blue-slate border-blue-slate/25 bg-pale-sky/60';
			case 'blocked':
				return 'text-burnt-peach border-burnt-peach/70 bg-pearl-beige/60';
			case 'skipped':
				return 'text-blue-slate/85 border-blue-slate/25 bg-alabaster-grey/80';
			case 'failed':
				return 'text-burnt-peach border-burnt-peach/55 bg-burnt-peach/12';
			default:
				return 'text-blue-slate border-blue-slate/25 bg-transparent';
		}
	};
</script>

<span class={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${badgeClass()}`}>
	<span class="h-2 w-2 rounded-full bg-current"></span>
	{label}
</span>
