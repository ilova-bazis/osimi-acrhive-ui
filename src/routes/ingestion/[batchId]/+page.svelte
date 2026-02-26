<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { IngestionDetail } from '$lib/services/ingestionDetail';
	import type { FileStatus } from '$lib/types';

	let { data } = $props<{ data: { detail: IngestionDetail } }>();

	const detail = data.detail;

	type DetailAction = 'resume' | 'retry' | 'cancel' | 'restore' | 'delete';

	const actionLabels: Record<DetailAction, string> = {
		resume: 'Resume',
		retry: 'Retry',
		cancel: 'Cancel',
		restore: 'Restore',
		delete: 'Delete'
	};

	const detailActions: DetailAction[] = (() => {
		if (detail.status === 'draft') return ['resume', 'delete'];
		if (detail.status === 'uploading') return ['resume', 'cancel', 'delete'];
		if (detail.status === 'queued') return ['cancel'];
		if (detail.status === 'failed') return ['retry', 'cancel'];
		if (detail.status === 'canceled') return ['restore', 'delete'];
		return [];
	})();

	const actionEndpoint = (action: DetailAction): string => {
		if (action === 'retry') return resolve(`/ingestion/${detail.id}/retry`);
		if (action === 'cancel') return resolve(`/ingestion/${detail.id}/cancel`);
		if (action === 'restore') return resolve(`/ingestion/${detail.id}/restore`);
		if (action === 'delete') return resolve(`/ingestion/${detail.id}`);
		return resolve(`/ingestion/${detail.id}`);
	};

	let actionError = $state('');
	let runningAction = $state<DetailAction | null>(null);
	let confirmAction = $state<DetailAction | null>(null);

	const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
		const payload = await response.json().catch(() => null);
		if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
			return payload.error;
		}
		return fallback;
	};

	const runAction = async (action: DetailAction): Promise<void> => {
		actionError = '';

		if (action === 'resume') {
			await goto(resolve(`/ingestion/${detail.id}/setup`));
			return;
		}

		runningAction = action;
		try {
			const response = await fetch(actionEndpoint(action), {
				method: action === 'delete' ? 'DELETE' : 'POST'
			});

			if (response.status === 401) {
				await goto(resolve('/login'));
				return;
			}

			if (!response.ok) {
				throw new Error(await readErrorMessage(response, `Failed to ${actionLabels[action].toLowerCase()} ingestion.`));
			}

			if (action === 'delete') {
				await goto(resolve('/ingestion'));
				return;
			}

			await invalidateAll();
		} catch (error) {
			actionError = error instanceof Error ? error.message : 'Action failed.';
		} finally {
			runningAction = null;
		}
	};

	const askConfirmation = (action: DetailAction) => {
		if (action === 'resume') {
			void runAction(action);
			return;
		}

		confirmAction = action;
	};

	const confirmActionLabel = (): string => (confirmAction ? actionLabels[confirmAction] : '');
	const confirmActionMessage = (): string => {
		if (confirmAction === 'delete') {
			return 'Delete this ingestion? This action cannot be undone.';
		}

		if (confirmAction === 'cancel') {
			return 'Cancel this ingestion? You can restore it later while processing has not started.';
		}

		if (confirmAction === 'retry') {
			return 'Retry this ingestion now?';
		}

		if (confirmAction === 'restore') {
			return 'Restore this canceled ingestion?';
		}

		return '';
	};

	const toTone = (status: IngestionDetail['status']): FileStatus => {
		if (status === 'completed') return 'approved';
		if (status === 'failed') return 'failed';
		if (status === 'ingesting') return 'processing';
		return 'queued';
	};

	const toFileTone = (status: string): FileStatus => {
		const normalized = status.toLowerCase();
		if (normalized.includes('fail') || normalized.includes('error')) return 'failed';
		if (normalized.includes('upload') || normalized.includes('valid') || normalized.includes('done')) {
			return 'approved';
		}
		if (normalized.includes('process') || normalized.includes('queue')) return 'processing';
		return 'queued';
	};

	const formatDate = (value: string | null): string => (value ? new Date(value).toLocaleString() : 'Unknown');
	const formatSize = (size: number | null): string => {
		if (size === null) return '-';
		if (size < 1024) return `${size} B`;
		const kb = size / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		return `${(kb / 1024).toFixed(1)} MB`;
	};
</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingestion Details</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">{detail.batchLabel}</h2>
			<p class="mt-2 text-sm text-text-muted">{detail.id}</p>
		</div>
		<div class="flex items-center gap-2">
			{#if detailActions.length > 0}
				<details class="group relative">
					<summary
						class="cursor-pointer list-none rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
					>
						{runningAction ? 'Working...' : 'Actions'}
					</summary>
					<div class="absolute right-0 z-10 mt-2 min-w-44 rounded-xl border border-border-soft bg-surface-white p-2 shadow-lg">
						<div class="flex flex-col gap-1">
							{#each detailActions as action (action)}
								<button
									type="button"
									onclick={() => askConfirmation(action)}
									disabled={runningAction !== null}
									class="rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-blue-slate hover:bg-pale-sky/25 disabled:opacity-50"
								>
									{actionLabels[action]}
								</button>
							{/each}
						</div>
					</div>
				</details>
			{/if}
			<a
				href={resolve('/ingestion')}
				class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
			>
				Back to ingestion
			</a>
		</div>
	</section>

	{#if actionError}
		<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
			{actionError}
		</p>
	{/if}

	<section class="grid gap-3 md:grid-cols-4">
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Status</p>
			<div class="mt-2">
				<StatusBadge status={toTone(detail.status)} label={detail.status} />
			</div>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Created</p>
			<p class="mt-2 text-sm text-text-ink">{formatDate(detail.createdAt)}</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Updated</p>
			<p class="mt-2 text-sm text-text-ink">{formatDate(detail.updatedAt)}</p>
		</div>
		<div class="rounded-2xl border border-border-soft bg-surface-white px-4 py-4">
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Progress</p>
			<p class="mt-2 text-sm text-text-ink">{detail.processedObjects} / {detail.totalObjects}</p>
		</div>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Files</p>
			<p class="mt-1 text-sm text-text-muted">Files currently registered in this ingestion batch.</p>
		</div>

		{#if detail.files.length === 0}
			<p class="mt-5 text-sm text-text-muted">No files found for this ingestion.</p>
		{:else}
			<div class="mt-5 overflow-x-auto">
				<table class="min-w-full divide-y divide-border-soft text-left">
					<thead>
						<tr class="text-xs uppercase tracking-[0.2em] text-text-muted">
							<th class="py-3 pr-4">File</th>
							<th class="py-3 pr-4">Status</th>
							<th class="py-3 pr-4">Type</th>
							<th class="py-3 pr-4">Size</th>
							<th class="py-3">Created</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-soft">
						{#each detail.files as file (file.id)}
							<tr class="text-sm text-text-ink">
								<td class="py-3 pr-4">{file.name}</td>
								<td class="py-3 pr-4"><StatusBadge status={toFileTone(file.status)} label={file.status} /></td>
								<td class="py-3 pr-4">{file.contentType ?? '-'}</td>
								<td class="py-3 pr-4">{formatSize(file.sizeBytes)}</td>
								<td class="py-3">{formatDate(file.createdAt)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	{#if confirmAction}
		<div class="fixed inset-0 z-40 bg-blue-slate/35" role="presentation" onclick={() => (confirmAction = null)}></div>
		<div class="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
			<div class="w-full max-w-md rounded-2xl border border-border-soft bg-surface-white p-6 shadow-2xl">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Confirm action</p>
				<h3 class="mt-2 font-display text-xl text-text-ink">{confirmActionLabel}</h3>
				<p class="mt-3 text-sm text-text-muted">{confirmActionMessage}</p>
				<div class="mt-6 flex justify-end gap-3">
					<button
						type="button"
						class="rounded-full border border-border-soft px-4 py-2 text-xs uppercase tracking-[0.2em] text-text-muted"
						onclick={() => (confirmAction = null)}
					>
						Close
					</button>
					<button
						type="button"
						class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
						onclick={() => {
							const action = confirmAction;
							confirmAction = null;
							if (action) {
								void runAction(action);
							}
						}}
					>
						Confirm
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>
