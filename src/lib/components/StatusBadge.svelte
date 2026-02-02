<script lang="ts">
	import type { FileStatus } from '$lib/types';

	let { status, label } = $props<{ status: FileStatus; label: string }>();

	const badgeClass = () => {
		switch (status) {
			case 'queued':
				return 'text-[var(--blue-slate)] border-[rgba(79,109,122,0.35)] bg-transparent';
			case 'processing':
				return 'text-[var(--blue-slate)] border-[rgba(79,109,122,0.25)] bg-[rgba(192,214,223,0.55)]';
			case 'extracted':
				return 'text-[var(--blue-slate)] border-[rgba(79,109,122,0.25)] bg-[rgba(192,214,223,0.75)]';
			case 'needs-review':
				return 'text-[var(--burnt-peach)] border-[rgba(221,110,66,0.45)] bg-[rgba(232,218,178,0.75)]';
			case 'approved':
				return 'text-[var(--blue-slate)] border-[rgba(79,109,122,0.25)] bg-[rgba(192,214,223,0.6)]';
			case 'blocked':
				return 'text-[var(--burnt-peach)] border-[rgba(221,110,66,0.7)] bg-[rgba(232,218,178,0.6)]';
			case 'skipped':
				return 'text-[rgba(79,109,122,0.85)] border-[rgba(79,109,122,0.25)] bg-[rgba(234,234,234,0.8)]';
			case 'failed':
				return 'text-[var(--burnt-peach)] border-[rgba(221,110,66,0.55)] bg-[rgba(221,110,66,0.12)]';
			default:
				return 'text-[var(--blue-slate)] border-[rgba(79,109,122,0.25)] bg-transparent';
		}
	};
</script>

<span class={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${badgeClass()}`}>
	<span class="h-2 w-2 rounded-full bg-current"></span>
	{label}
</span>
