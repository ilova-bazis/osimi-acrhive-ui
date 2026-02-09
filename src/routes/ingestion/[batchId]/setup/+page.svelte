<script lang="ts">
	import type { FileStatus } from '$lib/types';
	import { translations, type LocaleKey } from '$lib/i18n/translations';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	let { data } = $props<{ data: { batchId: string } }>();

	const batchId = data.batchId;
	let locale = $state<LocaleKey>('en');
	const dictionary = $derived(translations[locale]);

	const t = (key: string) => {
		const segments = key.split('.');
		let current: Record<string, unknown> = dictionary as Record<string, unknown>;
		for (const segment of segments) {
			if (typeof current[segment] === 'undefined') {
				return key;
			}
			current = current[segment] as Record<string, unknown>;
		}
		return current as unknown as string;
	};

	const format = (template: string, values: Record<string, string | number>) =>
		template.replace(/\{(\w+)\}/g, (match, key) =>
			Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
		);

	let files = $state<Array<{ id: number; name: string; type: string; size: string; status: FileStatus }>>([]);
	let nextFileId = 1;
	let dragDepth = $state(0);
	let isDragging = $state(false);
	let isGlobalDragging = $state(false);
	let fileInput: HTMLInputElement | null = null;

	const classificationTypes = [
		'document',
		'newspaper_article',
		'magazine_article',
		'book_chapter',
		'book',
		'photo',
		'letter',
		'speech',
		'interview',
		'other'
	] as const;

	const languages = ['persian', 'tajik', 'english', 'mixed'] as const;

	const pipelinePresets = [
		'auto',
		'photos',
		'newspapers',
		'audioVideo'
	] as const;

	let selectedIds = $state<Set<number>>(new Set());
	let activeFileId = $state(0);
	let batchDefaults = $state({
		language: '',
		classificationType: '',
		tags: '',
		pipelinePreset: 'auto'
	});

	let fileOverrides =
		$state<Record<number, { language?: string; classificationType?: string; tags?: string; notes?: string }>>({});


	const toggleSelection = (id: number) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	};

	const setActiveFile = (id: number) => {
		activeFileId = id;
		selectedIds = new Set([id]);
	};

	const toReadableSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		const mb = kb / 1024;
		return `${mb.toFixed(1)} MB`;
	};

	const toTypeKey = (mimeType: string) => {
		if (mimeType.startsWith('image/')) {
			return mimeType.includes('jpeg') || mimeType.includes('png') ? 'photo' : 'image';
		}
		if (mimeType === 'application/pdf') return 'pdf';
		if (mimeType.startsWith('audio/')) return 'audio';
		if (mimeType.startsWith('video/')) return 'video';
		return 'document';
	};

	const addFiles = (incoming: FileList | File[]) => {
		const list = Array.from(incoming);
		if (!list.length) return;
		const mapped = list.map((file) => ({
			id: nextFileId++,
			name: file.name,
			type: toTypeKey(file.type),
			size: toReadableSize(file.size),
			status: 'queued' as FileStatus
		}));
		files = [...files, ...mapped];
		if (!activeFileId && mapped.length) {
			setActiveFile(mapped[0].id);
		}
	};

	const handleFileInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement;
		if (target.files) {
			addFiles(target.files);
			target.value = '';
		}
	};

	const handleDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragDepth = 0;
		isDragging = false;
		isGlobalDragging = false;
		if (event.dataTransfer?.files) {
			addFiles(event.dataTransfer.files);
		}
	};

	const handleDragEnter = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragDepth += 1;
		isDragging = true;
		isGlobalDragging = true;
	};

	const handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
		isDragging = true;
		isGlobalDragging = true;
	};

	const handleDragLeave = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragDepth = Math.max(0, dragDepth - 1);
		if (dragDepth === 0) {
			isDragging = false;
			isGlobalDragging = false;
		}
	};

	const handleGlobalDragEnter = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		isGlobalDragging = true;
	};

	const handleGlobalDragLeave = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (dragDepth === 0) {
			isGlobalDragging = false;
		}
	};

	const handleGlobalDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		isGlobalDragging = false;
	};

	const removeFile = (id: number) => {
		files = files.filter((file) => file.id !== id);
		selectedIds = new Set(Array.from(selectedIds).filter((selected) => selected !== id));
		if (activeFileId === id) {
			activeFileId = files[0]?.id ?? 0;
			if (activeFileId) {
				selectedIds = new Set([activeFileId]);
			}
		}
		if (!files.length) {
			selectedIds = new Set();
		}
	};

	const updateFileOverrides = (fileId: number, patch: Record<string, string>) => {
		fileOverrides = {
			...fileOverrides,
			[fileId]: {
				...fileOverrides[fileId],
				...patch
			}
		};
	};

	const getEffectiveValue = (
		fileId: number,
		key: 'language' | 'classificationType'
	): string | undefined => {
		const override = fileOverrides[fileId]?.[key];
		if (override && override.trim().length > 0) {
			return override;
		}
		const batchValue = batchDefaults[key];
		if (batchValue && batchValue.trim().length > 0) {
			return batchValue;
		}
		return undefined;
	};

	const isReady = () =>
		files.length > 0 &&
		files.every(
			(file) =>
				Boolean(getEffectiveValue(file.id, 'language')) &&
				Boolean(getEffectiveValue(file.id, 'classificationType'))
		);


	const statusKey = (status: FileStatus) => (status === 'needs-review' ? 'needsReview' : status);
	const statusLabel = (status: FileStatus) => t(`statuses.${statusKey(status)}`);

	const languageLabel = (value: string) =>
		value ? t(`ingestionSetup.languages.${value}`) : t('values.unknown');
	const pipelineLabel = (value: string) => t(`ingestionSetup.pipelinePresets.${value}`);

	let showConfirm = $state(false);

	const getMissingFields = (fileId: number) => {
		const missing: string[] = [];
		if (!getEffectiveValue(fileId, 'language')) {
			missing.push(t('ingestionSetup.overrides.language'));
		}
		if (!getEffectiveValue(fileId, 'classificationType')) {
			missing.push(t('ingestionSetup.overrides.classificationType'));
		}
		return missing;
	};

	const missingSummaries = () =>
		files
			.map((file) => ({ file, missing: getMissingFields(file.id) }))
			.filter((entry) => entry.missing.length > 0);

	const missingCount = () => missingSummaries().length;
	const objectCount = () => files.length;
</script>

<main
	class="mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-6 px-6 py-10"
	ondragenter={handleGlobalDragEnter}
	ondragleave={handleGlobalDragLeave}
	ondrop={handleGlobalDrop}
>
	<section class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.header.kicker')}</p>
			<h2 class="mt-2 font-display text-2xl text-text-ink">{t('ingestionSetup.header.title')}</h2>
			<p class="mt-2 text-sm text-text-muted">
				{format(t('ingestionSetup.header.subtitle'), { batchId })}
			</p>
		</div>
	</section>

	<section class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
		<div class="space-y-5">
			<div
				class={`relative rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
					isDragging || isGlobalDragging
						? 'border-blue-slate bg-pearl-beige/70 shadow-[0_0_0_4px_rgba(79,109,122,0.25)]'
						: 'border-border-soft bg-pearl-beige/60'
				}`}
				ondragenter={handleDragEnter}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.dropzone.label')}</p>
				<p class="mt-3 font-display text-xl text-text-ink">
					{isDragging || isGlobalDragging
						? t('ingestionSetup.dropzone.headlineDragging')
						: t('ingestionSetup.dropzone.headline')}
				</p>
				<p class="mt-2 text-xs text-text-muted">
					{isDragging || isGlobalDragging
						? t('ingestionSetup.dropzone.supportDragging')
						: t('ingestionSetup.dropzone.support')}
				</p>
				<p class="mt-2 text-sm text-text-muted">{t('ingestionSetup.dropzone.details')}</p>
				<button
					onclick={() => fileInput?.click()}
					class="mt-5 rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
				>
					{t('ingestionSetup.dropzone.browse')}
				</button>
				<input
					bind:this={fileInput}
					type="file"
					multiple
					class="hidden"
					onchange={handleFileInput}
				/>
			</div>

			<div class="rounded-2xl border border-border-soft bg-surface-white">
				<div class="border-b border-border-soft px-6 py-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.files.title')}</p>
							<p class="mt-1 text-sm text-text-muted">{t('ingestionSetup.files.subtitle')}</p>
						</div>
						<div class="text-xs text-text-muted">
							{format(t('ingestionSetup.files.selectedCount'), { count: selectedIds.size })}
						</div>
					</div>
				</div>
				{#if files.length === 0}
					<div class="px-6 py-8 text-center text-sm text-text-muted">
						{t('ingestionSetup.files.empty')}
					</div>
				{:else}
					<div class="divide-y divide-border-soft">
						{#each files as file (file.id)}
							<div
								class={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 ${
									file.id === activeFileId ? 'bg-pale-sky/12' : ''
								}`}
								onclick={() => setActiveFile(file.id)}
							>
								<label class="flex items-start gap-3">
									<input
										type="checkbox"
										class="mt-1 h-4 w-4 rounded border-border-soft text-blue-slate"
										checked={selectedIds.has(file.id)}
										onclick={(event) => event.stopPropagation()}
										onchange={() => toggleSelection(file.id)}
									/>
								<div>
									<p class="text-sm font-medium text-text-ink">{file.name}</p>
									<p class="mt-1 text-xs text-text-muted">
										{t(`ingestionSetup.fileTypes.${file.type}`)} · {file.size}
									</p>
								</div>
								</label>
								<div class="flex items-center gap-3">
								<button
									class="text-xs uppercase tracking-[0.2em] text-blue-slate"
									onclick={(event) => {
										event.stopPropagation();
										removeFile(file.id);
									}}
								>
									{t('common.remove')}
								</button>
								<StatusBadge status={file.status} label={statusLabel(file.status)} />
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		</div>

		<aside class="space-y-5">
			<div class="rounded-2xl border border-border-strong bg-blue-slate-deep px-6 py-6 text-pale-sky">
				<p class="text-xs uppercase tracking-[0.2em] text-burnt-peach">{t('ingestionSetup.batchIntent.title')}</p>
				<p class="mt-2 text-sm text-pale-sky">{t('ingestionSetup.batchIntent.description')}</p>
				<div class="mt-4 space-y-3 text-sm">
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.language')}
						</label>
						<select
							class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							value={batchDefaults.language}
							onchange={(event) => (batchDefaults.language = event.currentTarget.value)}
						>
							<option value="">{t('ingestionSetup.batchIntent.selectLanguage')}</option>
							{#each languages as language}
								<option value={language}>{t(`ingestionSetup.languages.${language}`)}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.classificationType')}
						</label>
						<select
							class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							value={batchDefaults.classificationType}
							onchange={(event) => (batchDefaults.classificationType = event.currentTarget.value)}
						>
							<option value="">{t('ingestionSetup.batchIntent.selectType')}</option>
							{#each classificationTypes as type}
								<option value={type}>{t(`ingestionSetup.classificationTypes.${type}`)}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.tags')}
						</label>
						<input
							class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							placeholder={t('ingestionSetup.batchIntent.tagsPlaceholder')}
							value={batchDefaults.tags}
							oninput={(event) => (batchDefaults.tags = event.currentTarget.value)}
						/>
					</div>
					<div>
						<label class="text-xs uppercase tracking-[0.2em] text-burnt-peach">
							{t('ingestionSetup.batchIntent.pipelinePreset')}
						</label>
						<select
							class="mt-2 w-full rounded-xl border border-pale-sky/30 bg-blue-slate-deep px-3 py-2 text-sm text-surface-white"
							value={batchDefaults.pipelinePreset}
							onchange={(event) => (batchDefaults.pipelinePreset = event.currentTarget.value)}
						>
							{#each pipelinePresets as preset}
								<option value={preset}>{t(`ingestionSetup.pipelinePresets.${preset}`)}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>


			<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.overrides.title')}</p>
				<p class="mt-2 text-sm text-text-muted">{t('ingestionSetup.overrides.subtitle')}</p>
				{#if activeFileId === 0}
					<div class="mt-4 rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3 text-sm text-text-muted">
						<p class="text-sm text-text-ink">{t('ingestionSetup.overrides.emptyTitle')}</p>
						<p class="mt-1 text-xs text-text-muted">{t('ingestionSetup.overrides.emptyBody')}</p>
					</div>
				{:else}
					<div class="mt-4 space-y-3 text-sm">
						<div>
							<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
								{t('ingestionSetup.overrides.language')}
							</label>
							<select
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={fileOverrides[activeFileId]?.language ?? ''}
								onchange={(event) => updateFileOverrides(activeFileId, { language: event.currentTarget.value })}
							>
								<option value="">{t('ingestionSetup.overrides.useBatchDefault')}</option>
								{#each languages as language}
									<option value={language}>{t(`ingestionSetup.languages.${language}`)}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
								{t('ingestionSetup.overrides.classificationType')}
							</label>
							<select
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								value={fileOverrides[activeFileId]?.classificationType ?? ''}
								onchange={(event) => updateFileOverrides(activeFileId, { classificationType: event.currentTarget.value })}
							>
								<option value="">{t('ingestionSetup.overrides.useBatchDefault')}</option>
								{#each classificationTypes as type}
									<option value={type}>{t(`ingestionSetup.classificationTypes.${type}`)}</option>
								{/each}
							</select>
						</div>
						<div>
							<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
								{t('ingestionSetup.overrides.tags')}
							</label>
							<input
								class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								placeholder={t('ingestionSetup.overrides.tagsPlaceholder')}
								value={fileOverrides[activeFileId]?.tags ?? ''}
								oninput={(event) => updateFileOverrides(activeFileId, { tags: event.currentTarget.value })}
							/>
						</div>
						<div>
							<label class="text-xs uppercase tracking-[0.2em] text-blue-slate">
								{t('ingestionSetup.overrides.notes')}
							</label>
							<textarea
								rows="3"
								class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
								placeholder={t('ingestionSetup.overrides.notesPlaceholder')}
								value={fileOverrides[activeFileId]?.notes ?? ''}
								oninput={(event) => updateFileOverrides(activeFileId, { notes: event.currentTarget.value })}
							></textarea>
						</div>
					</div>
				{/if}
			</div>
		</aside>
	</section>

	<section class="rounded-2xl border border-border-soft bg-surface-white px-6 py-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div class="space-y-2">
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.readiness.title')}</p>
				<p class="text-sm text-text-muted">
					{isReady()
						? t('ingestionSetup.readiness.ready')
						: t('ingestionSetup.readiness.missing')}
				</p>
				{#if !isReady()}
					<div class="rounded-xl border border-border-soft bg-pale-sky/15 px-4 py-3 text-xs text-text-muted">
						<p>{format(t('ingestionSetup.readiness.missingCount'), { count: missingCount() })}</p>
						<ul class="mt-2 space-y-1">
							{#each missingSummaries() as entry (entry.file.id)}
								<li>
									<span class="text-text-ink">{entry.file.name}</span>
									· {entry.missing.join(', ')}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
			<button
				disabled={!isReady()}
				onclick={() => (showConfirm = true)}
				class={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.2em] text-surface-white ${
					isReady() ? 'bg-blue-slate' : 'bg-blue-slate/40 text-surface-white/70'
				}`}
			>
				{t('common.startIngestion')}
			</button>
		</div>
	</section>

	{#if showConfirm}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-dark-grey/60 px-6">
			<div class="w-full max-w-xl rounded-2xl border border-border-soft bg-surface-white p-6 shadow-[0_30px_80px_rgba(31,47,56,0.35)]">
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.confirmation.title')}</p>
						<h3 class="mt-2 font-display text-xl text-text-ink">{t('ingestionSetup.confirmation.subtitle')}</h3>
					</div>
					<button class="text-sm text-text-muted" onclick={() => (showConfirm = false)}>
						{t('common.close')}
					</button>
				</div>
				<div class="mt-4 space-y-3 text-sm text-text-muted">
					<p><span class="text-text-ink">{t('ingestionSetup.confirmation.batch')}</span> · {batchId}</p>
					<p><span class="text-text-ink">{t('ingestionSetup.confirmation.files')}</span> · {files.length}</p>
					<p><span class="text-text-ink">{t('ingestionSetup.confirmation.objects')}</span> · {objectCount()}</p>
					<p>
						<span class="text-text-ink">{t('ingestionSetup.confirmation.languages')}</span> ·
						{Array.from(new Set(files.map((file) => getEffectiveValue(file.id, 'language') ?? '')))
							.filter((value) => value.length > 0)
							.map((value) => languageLabel(value))
							.join(', ') || t('values.unknown')}
					</p>
					<p>
						<span class="text-text-ink">{t('ingestionSetup.confirmation.pipeline')}</span> ·
						{pipelineLabel(batchDefaults.pipelinePreset)}
					</p>
				</div>
				<div class="mt-6 flex flex-wrap items-center justify-end gap-3">
					<button
						class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate"
						onclick={() => (showConfirm = false)}
					>
						{t('common.cancel')}
					</button>
					<button
						class="rounded-full bg-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-surface-white"
						onclick={() => (window.location.href = `/ingestion/${batchId}`)}
					>
						{t('common.confirmStart')}
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>
