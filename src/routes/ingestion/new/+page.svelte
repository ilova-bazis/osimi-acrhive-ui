<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;

	let name = '';
	let documentType = 'document';
	let languageCode = 'en';
	let pipelinePreset = 'auto';
	let accessLevel = 'private';
	let embargoUntil = '';
	let rightsNote = '';
	let sensitivityNote = '';
	let summary = '';
	let tagsInput = '';
	let summaryTags: string[] = [];

	const addTag = () => {
		const normalized = tagsInput.trim().replace(/^#/, '');
		if (!normalized) return;
		if (!summaryTags.includes(normalized)) {
			summaryTags = [...summaryTags, normalized];
		}
		tagsInput = '';
	};

	const removeTag = (tag: string) => {
		summaryTags = summaryTags.filter((item) => item !== tag);
	};

	$: errorMessage = form?.error ?? '';
</script>

<main class="mx-auto flex min-h-[80vh] max-w-5xl flex-col gap-6 px-6 py-10">
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Ingestion</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">New Ingestion</h2>
			<p class="mt-2 text-sm text-text-muted">
				Create a new batch with a human-readable name. You can add files and intent details next.
			</p>
		</div>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
		<form class="space-y-5" method="POST">
			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="name">Batch name</label>
				<input
					id="name"
					name="name"
					type="text"
					class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
					placeholder="e.g. NoorMags Issue 80-82 (optional)"
					bind:value={name}
				/>
			</div>
			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="documentType">Document type</label>
				<select
					id="documentType"
					name="documentType"
					class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
					bind:value={documentType}
				>
					<option value="document">Document</option>
					<option value="newspaper_article">Newspaper article</option>
					<option value="magazine_article">Magazine article</option>
					<option value="book_chapter">Book chapter</option>
					<option value="book">Book</option>
					<option value="photo">Photo</option>
					<option value="letter">Letter</option>
					<option value="speech">Speech</option>
					<option value="interview">Interview</option>
					<option value="other">Other</option>
				</select>
			</div>
			<div class="grid gap-4 md:grid-cols-3">
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="languageCode">Language code</label>
					<input
						id="languageCode"
						name="languageCode"
						type="text"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={languageCode}
					/>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="pipelinePreset">Pipeline preset</label>
					<select
						id="pipelinePreset"
						name="pipelinePreset"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={pipelinePreset}
					>
						<option value="auto">Auto</option>
						<option value="none">None</option>
						<option value="ocr_text">OCR text</option>
						<option value="audio_transcript">Audio transcript</option>
						<option value="video_transcript">Video transcript</option>
						<option value="ocr_and_audio_transcript">OCR + audio transcript</option>
						<option value="ocr_and_video_transcript">OCR + video transcript</option>
					</select>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="accessLevel">Access level</label>
					<select
						id="accessLevel"
						name="accessLevel"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={accessLevel}
					>
						<option value="private">Private</option>
						<option value="family">Family</option>
						<option value="public">Public</option>
					</select>
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="embargoUntil">Embargo until</label>
					<input
						id="embargoUntil"
						name="embargoUntil"
						type="datetime-local"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={embargoUntil}
					/>
				</div>
				<div class="space-y-2">
					<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="rightsNote">Rights note</label>
					<input
						id="rightsNote"
						name="rightsNote"
						type="text"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						bind:value={rightsNote}
					/>
				</div>
			</div>
			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="sensitivityNote">Sensitivity note</label>
				<input
					id="sensitivityNote"
					name="sensitivityNote"
					type="text"
					class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
					bind:value={sensitivityNote}
				/>
			</div>
			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="summaryTagsInput">Summary tags</label>
				<div class="flex items-center gap-2">
					<input
						id="summaryTagsInput"
						type="text"
						class="w-full rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
						placeholder="Type a tag and press Add"
						bind:value={tagsInput}
						onkeydown={(event) => {
							if (event.key === 'Enter') {
								event.preventDefault();
								addTag();
							}
						}}
					/>
					<button
						type="button"
						class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
						onclick={addTag}
					>
						Add
					</button>
				</div>
				<input type="hidden" name="summaryTags" value={summaryTags.join(',')} />
				{#if summaryTags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each summaryTags as tag (tag)}
							<button
								type="button"
								onclick={() => removeTag(tag)}
								class="rounded-full border border-border-soft bg-pale-sky/30 px-3 py-1 text-xs text-blue-slate"
							>
								{tag} ×
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<div class="space-y-2">
				<label class="text-xs uppercase tracking-[0.2em] text-blue-slate" for="summary">Summary (optional)</label>
				<textarea
					id="summary"
					name="summary"
					rows="3"
					class="w-full resize-none rounded-xl border border-border-soft bg-surface-white px-4 py-3 text-sm text-text-ink focus:outline-none focus:ring-2 focus:ring-blue-slate/30"
					placeholder="Optional high-level context for this ingestion"
					bind:value={summary}
				></textarea>
			</div>
			{#if errorMessage}
				<p class="rounded-xl border border-burnt-peach/45 bg-pearl-beige/70 px-3 py-2 text-xs text-burnt-peach">
					{errorMessage}
				</p>
			{/if}
			<div class="flex flex-wrap items-center justify-end gap-3">
				<button
					type="submit"
					class="rounded-full bg-blue-slate px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
				>
					Continue to setup
				</button>
			</div>
		</form>
	</section>
</main>
