<script lang="ts">
	import { untrack } from 'svelte';
	import type { ObjectItemMetadata } from '$lib/models';
	import { locale } from '$lib/i18n/locale';
	import { translations } from '$lib/i18n/translations';

	const dictionary = $derived(translations[$locale]);
	const t = (key: string): string => {
		const segments = key.split('.');
		let current: Record<string, unknown> = dictionary as Record<string, unknown>;
		for (const segment of segments) {
			if (typeof current[segment] === 'undefined') return key;
			current = current[segment] as Record<string, unknown>;
		}
		return current as unknown as string;
	};

	let {
		objectKey,
		objectLabel,
		metadata,
		batchTitle,
		batchTags,
		batchDate,
		batchDescription,
		onMetadataChange
	} = $props<{
		objectKey: string | null;
		objectLabel: string;
		metadata: ObjectItemMetadata;
		batchTitle: string;
		batchTags: string[];
		batchDate: { value: string | null; approximate: boolean } | null;
		batchDescription: string;
		onMetadataChange: (patch: Partial<ObjectItemMetadata>) => void;
	}>();

	type DatePrecision = 'none' | 'year' | 'month' | 'day';

	const inferPrecision = (value: string | null): DatePrecision => {
		if (!value) return 'none';
		if (/^\d{4}$/.test(value)) return 'year';
		if (/^\d{4}-\d{2}$/.test(value)) return 'month';
		if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'day';
		return 'none';
	};

	let tagInput = $state('');
	let personInput = $state('');
	let localDatePrecision = $state<DatePrecision>('none');
	let localDateApproximate = $state(false);

	// Sync local state when the selected object changes
	$effect(() => {
		objectKey; // track objectKey changes
		untrack(() => {
			localDatePrecision = inferPrecision(metadata.date?.value ?? null);
			localDateApproximate = metadata.date?.approximate ?? false;
			tagInput = '';
			personInput = '';
		});
	});

	const setDatePrecision = (precision: DatePrecision) => {
		localDatePrecision = precision;
		if (precision === 'none') {
			onMetadataChange({ date: undefined });
		} else {
			onMetadataChange({ date: { value: null, approximate: localDateApproximate } });
		}
	};

	const updateDateValue = (value: string) => {
		onMetadataChange({ date: { value: value || null, approximate: localDateApproximate } });
	};

	const toggleApproximate = (checked: boolean) => {
		localDateApproximate = checked;
		onMetadataChange({ date: { value: metadata.date?.value ?? null, approximate: checked } });
	};

	const addTag = () => {
		const tag = tagInput.trim().replace(/^#/, '');
		if (!tag) return;
		const existing = metadata.tags ?? [];
		if (!existing.includes(tag)) {
			onMetadataChange({ tags: [...existing, tag] });
		}
		tagInput = '';
	};

	const removeTag = (tag: string) => {
		onMetadataChange({ tags: (metadata.tags ?? []).filter((t: string) => t !== tag) });
	};

	const addPerson = () => {
		const person = personInput.trim();
		if (!person) return;
		const existing = metadata.people ?? [];
		if (!existing.includes(person)) {
			onMetadataChange({ people: [...existing, person] });
		}
		personInput = '';
	};

	const removePerson = (person: string) => {
		onMetadataChange({ people: (metadata.people ?? []).filter((p: string) => p !== person) });
	};

	// Date display value derived from metadata
	const dateInputValue = $derived(metadata.date?.value ?? '');
</script>

<div class="rounded-2xl border border-border-soft bg-surface-white px-6 py-6">
	<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.objectMetadata.title')}</p>

	{#if objectKey === null}
		<p class="mt-4 text-sm text-text-muted">
			{t('ingestionSetup.objectMetadata.empty')}
		</p>
	{:else}
		<p class="mt-1 truncate text-sm font-medium text-text-ink">{objectLabel}</p>

		<div class="mt-4 space-y-4">
			<!-- Title -->
			<div>
				<label
					for="obj-title-{objectKey}"
					class="text-xs uppercase tracking-[0.2em] text-blue-slate"
				>
					{t('ingestionSetup.objectMetadata.fields.title')}
				</label>
				<input
					id="obj-title-{objectKey}"
					class="mt-2 w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/60"
					placeholder={batchTitle || t('ingestionSetup.objectMetadata.fields.titlePlaceholder')}
					value={metadata.title ?? ''}
					oninput={(e) =>
						onMetadataChange({ title: e.currentTarget.value.trim() || undefined })}
				/>
			</div>

			<!-- Date -->
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.objectMetadata.fields.date')}</p>
				<div class="mt-2 grid grid-cols-2 gap-2">
					<select
						class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
						value={localDatePrecision}
						onchange={(e) => setDatePrecision(e.currentTarget.value as DatePrecision)}
					>
						<option value="none">{t('ingestionSetup.objectMetadata.fields.precisionNone')}</option>
						<option value="year">{t('ingestionSetup.objectMetadata.fields.precisionYear')}</option>
						<option value="month">{t('ingestionSetup.objectMetadata.fields.precisionMonth')}</option>
						<option value="day">{t('ingestionSetup.objectMetadata.fields.precisionDay')}</option>
					</select>
					{#if localDatePrecision === 'year'}
						<input
							type="number"
							min="1000"
							max="2999"
							placeholder={batchDate?.value?.substring(0, 4) ?? 'YYYY'}
							class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/60"
							value={dateInputValue}
							oninput={(e) => updateDateValue(e.currentTarget.value)}
						/>
					{:else if localDatePrecision === 'month'}
						<input
							type="month"
							placeholder={batchDate?.value?.substring(0, 7) ?? ''}
							class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
							value={dateInputValue}
							onchange={(e) => updateDateValue(e.currentTarget.value)}
						/>
					{:else if localDatePrecision === 'day'}
						<input
							type="date"
							class="rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
							value={dateInputValue}
							onchange={(e) => updateDateValue(e.currentTarget.value)}
						/>
					{:else}
						<div></div>
					{/if}
				</div>
				{#if localDatePrecision !== 'none'}
					<label class="mt-2 flex items-center gap-2 text-xs text-text-muted">
						<input
							type="checkbox"
							checked={localDateApproximate}
							onchange={(e) => toggleApproximate(e.currentTarget.checked)}
						/>
						{t('ingestionSetup.objectMetadata.fields.approximateDate')}
					</label>
				{/if}
			</div>

			<!-- Tags -->
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.objectMetadata.fields.tags')}</p>
				<div class="mt-2 flex items-center gap-2">
					<input
						class="w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
						placeholder={t('ingestionSetup.objectMetadata.fields.tagsPlaceholder')}
						value={tagInput}
						oninput={(e) => (tagInput = e.currentTarget.value)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ',') {
								e.preventDefault();
								addTag();
							}
						}}
					/>
					<button
						type="button"
						onclick={addTag}
						class="rounded-full border border-blue-slate/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate"
					>
						{t('ingestionSetup.objectMetadata.fields.addTag')}
					</button>
				</div>
				{#if (metadata.tags && metadata.tags.length > 0) || batchTags.length > 0}
					<div class="mt-2 flex flex-wrap gap-2">
						{#each metadata.tags ?? [] as tag (tag)}
							<button
								type="button"
								onclick={() => removeTag(tag)}
								class="rounded-full border border-blue-slate/40 bg-pale-sky/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-blue-slate"
							>
								{tag} ×
							</button>
						{/each}
						{#each batchTags as tag (tag)}
							{#if !metadata.tags?.includes(tag)}
								<span
									class="rounded-full border border-border-soft px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-text-muted"
									title={t('ingestionSetup.objectMetadata.fields.batchTagHint')}
								>
									{tag}
								</span>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Description -->
			<div>
				<label
					for="obj-desc-{objectKey}"
					class="text-xs uppercase tracking-[0.2em] text-blue-slate"
				>
					{t('ingestionSetup.objectMetadata.fields.description')}
				</label>
				<textarea
					id="obj-desc-{objectKey}"
					rows="2"
					class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/60"
					placeholder={batchDescription || t('ingestionSetup.objectMetadata.fields.descriptionPlaceholder')}
					value={metadata.description ?? ''}
					oninput={(e) =>
						onMetadataChange({ description: e.currentTarget.value || undefined })}
				></textarea>
			</div>

			<!-- People -->
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{t('ingestionSetup.objectMetadata.fields.people')}</p>
				<div class="mt-2 flex items-center gap-2">
					<input
						class="w-full rounded-xl border border-border-soft bg-surface-white px-3 py-2 text-sm text-text-ink"
						placeholder={t('ingestionSetup.objectMetadata.fields.peoplePlaceholder')}
						value={personInput}
						oninput={(e) => (personInput = e.currentTarget.value)}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								addPerson();
							}
						}}
					/>
					<button
						type="button"
						onclick={addPerson}
						class="rounded-full border border-blue-slate/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate"
					>
						{t('ingestionSetup.objectMetadata.fields.addPerson')}
					</button>
				</div>
				{#if metadata.people && metadata.people.length > 0}
					<div class="mt-2 flex flex-wrap gap-2">
						{#each metadata.people as person (person)}
							<button
								type="button"
								onclick={() => removePerson(person)}
								class="rounded-full border border-blue-slate/40 bg-pale-sky/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-blue-slate"
							>
								{person} ×
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
