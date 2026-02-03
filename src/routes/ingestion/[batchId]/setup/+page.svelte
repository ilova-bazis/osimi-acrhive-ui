<script lang="ts">
	import type { FileStatus } from '$lib/types';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data } = $props<{ data: { batchId: string } }>();

	const batchId = data.batchId;

	const files = [
		{ id: 1, name: 'noormags_080_page1.tiff', type: 'Image', size: '12.4 MB', status: 'queued' },
		{ id: 2, name: 'noormags_080_page2.tiff', type: 'Image', size: '11.8 MB', status: 'queued' },
		{ id: 3, name: 'noormags_080_page3.tiff', type: 'Image', size: '13.1 MB', status: 'queued' },
		{ id: 4, name: 'cover_photo_1980.jpg', type: 'Photo', size: '4.2 MB', status: 'queued' }
	] as const;

	let selectedIds = new Set<number>([1]);

	const toggleSelection = (id: number) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	};

	const statusLabelMap: Record<FileStatus, string> = {
		queued: 'Staged',
		processing: 'Processing',
		extracted: 'Extracted',
		'needs-review': 'Needs Review',
		approved: 'Approved',
		blocked: 'Blocked',
		skipped: 'Skipped',
		failed: 'Failed'
	};
</script>

<main class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10">
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">New ingestion</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">Batch setup</h2>
			<p class="mt-2 text-sm text-text-muted">Draft batch {batchId} · No processing until you confirm.</p>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
		<div class="space-y-5">
			<div class="rounded-2xl border border-border-soft bg-pearl-beige/60 px-6 py-8 text-center">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Upload files</p>
				<p class="mt-3 font-display text-xl text-text-ink">Drag files here or click to browse</p>
				<p class="mt-2 text-sm text-text-muted">
					Images, PDFs, audio, video, and archives. Files stay staged until you start ingestion.
				</p>
			</div>

			<div class="rounded-2xl border border-border-soft bg-surface-white">
				<div class="border-b border-border-soft px-6 py-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Files</p>
							<p class="mt-1 text-sm text-text-muted">Select files to override metadata or group into objects.</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<p class="text-xs text-text-muted">Selected {selectedIds.size}</p>
							<button
								disabled={selectedIds.size < 2}
								class="rounded-full border border-blue-slate px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate disabled:cursor-not-allowed disabled:opacity-40"
							>
								Group as one object
							</button>
							<button
								disabled={selectedIds.size < 1}
								class="rounded-full border border-blue-slate px-3 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate disabled:cursor-not-allowed disabled:opacity-40"
							>
								Ungroup
							</button>
						</div>
					</div>
				</div>
				<div class="divide-y divide-border-soft">
					{#each files as file (file.id)}
						<div class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
							<label class="flex items-start gap-3">
								<input
									type="checkbox"
									class="mt-1 h-4 w-4 rounded border-border-soft text-blue-slate"
									checked={selectedIds.has(file.id)}
									onchange={() => toggleSelection(file.id)}
								/>
								<div>
									<p class="text-sm font-medium text-text-ink">{file.name}</p>
									<p class="mt-1 text-xs text-text-muted">{file.type} · {file.size}</p>
								</div>
							</label>
							<StatusBadge status={file.status} label={statusLabelMap[file.status]} />
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Grouping</p>
				<p class="mt-2 text-sm text-text-muted">
					Each group becomes one archive object when ingestion starts. Default is one file per object.
				</p>
				<div class="mt-4 rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3 text-xs text-text-muted">
					Selected {selectedIds.size} files · Use “Group as one object” to combine them.
				</div>
			</div>
		</div>

		<aside class="space-y-5">
			<div class="rounded-2xl border border-border-strong bg-blue-slate-deep px-6 py-6 text-pale-sky">
				<p class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Batch intent</p>
				<p class="mt-2 text-sm text-pale-sky">
					Set batch defaults that apply to all files unless overridden.
				</p>
				<div class="mt-4 space-y-3 text-sm">
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Default language</label>
						<select class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white">
							<option>Persian</option>
							<option>Tajik</option>
							<option>English</option>
							<option>Mixed / Unknown</option>
						</select>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Document type</label>
						<select class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white">
							<option>document</option>
							<option>newspaper_article</option>
							<option>magazine_article</option>
							<option>book_chapter</option>
							<option>book</option>
							<option>photo</option>
							<option>letter</option>
							<option>speech</option>
							<option>interview</option>
							<option>other</option>
						</select>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Tags</label>
						<input
							class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							placeholder="People, places, themes"
						/>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">Pipeline preset</label>
						<select class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white">
							<option>Auto</option>
							<option>Photos only (no OCR)</option>
							<option>Newspapers (layout OCR + review)</option>
							<option>Audio/Video (speech-to-text)</option>
						</select>
					</div>
				</div>
			</div>

			<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Per-file overrides</p>
				<p class="mt-2 text-sm text-text-muted">
					Overrides apply to the selected file and take precedence over batch defaults.
				</p>
				<div class="mt-4 space-y-3 text-sm">
					<div class="flex items-center justify-between">
						<span>Language</span>
						<span class="text-blue-slate">Persian</span>
					</div>
					<div class="flex items-center justify-between">
						<span>Document type</span>
						<span class="text-blue-slate">newspaper_article</span>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">Tags</label>
						<input
							class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
							placeholder="Tags for this file"
						/>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">Notes</label>
						<textarea
							rows="3"
							class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
							placeholder="Human context for this file"
						></textarea>
					</div>
				</div>
			</div>
		</aside>
	</section>

	<footer class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<p class="text-sm text-text-muted">
				At least one file and required metadata are needed before ingestion can start.
			</p>
			<button
				disabled
				class="rounded-full bg-blue-slate/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white/70"
			>
				Start ingestion
			</button>
		</div>
	</footer>
</main>
