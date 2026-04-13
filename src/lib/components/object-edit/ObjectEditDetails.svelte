<script lang="ts">
	import type { EditableMetadata } from '$lib/objectView/mockEditData';

	type DatePrecision = 'none' | 'year' | 'month' | 'day';

	let {
		metadata,
		onMetadataChange
	}: {
		metadata: EditableMetadata;
		onMetadataChange: (patch: Partial<EditableMetadata>) => void;
	} = $props();

	let tagInput = $state('');
	let personInput = $state('');

	let localDatePrecision = $state<DatePrecision>(metadata.datePrecision);
	let localDateApproximate = $state(metadata.dateApproximate);

	$effect(() => {
		localDatePrecision = metadata.datePrecision;
		localDateApproximate = metadata.dateApproximate;
	});

	const setDatePrecision = (precision: DatePrecision): void => {
		localDatePrecision = precision;
		if (precision === 'none') {
			onMetadataChange({ datePrecision: 'none', publicationDate: '', dateApproximate: false });
		} else {
			onMetadataChange({ datePrecision: precision });
		}
	};

	const addTag = (): void => {
		const tag = tagInput.trim();
		if (!tag) return;
		if (!metadata.tags.includes(tag)) {
			onMetadataChange({ tags: [...metadata.tags, tag] });
		}
		tagInput = '';
	};

	const removeTag = (tag: string): void => {
		onMetadataChange({ tags: metadata.tags.filter((t) => t !== tag) });
	};

	const addPerson = (): void => {
		const person = personInput.trim();
		if (!person) return;
		if (!metadata.people.includes(person)) {
			onMetadataChange({ people: [...metadata.people, person] });
		}
		personInput = '';
	};

	const removePerson = (person: string): void => {
		onMetadataChange({ people: metadata.people.filter((p) => p !== person) });
	};
</script>

<div class="space-y-5">
	<!-- Title -->
	<div>
		<label for="edit-title" class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Title</label>
		<input
			id="edit-title"
			class="mt-2 w-full rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
			placeholder="Object title"
			value={metadata.title}
			oninput={(e) => onMetadataChange({ title: e.currentTarget.value })}
		/>
	</div>

	<!-- Date -->
	<div>
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Date</p>
		<div class="mt-2 grid grid-cols-2 gap-2">
			<select
				class="rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink focus:border-pearl-beige focus:outline-none"
				value={localDatePrecision}
				onchange={(e) => setDatePrecision(e.currentTarget.value as DatePrecision)}
			>
				<option value="none">No date</option>
				<option value="year">Year</option>
				<option value="month">Year–Month</option>
				<option value="day">Full date</option>
			</select>
			{#if localDatePrecision === 'year'}
				<input
					type="number"
					min="1000"
					max="2999"
					placeholder="YYYY"
					class="rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none"
					value={metadata.publicationDate?.substring(0, 4) ?? ''}
					oninput={(e) => onMetadataChange({ publicationDate: e.currentTarget.value, datePrecision: 'year' })}
				/>
			{:else if localDatePrecision === 'month'}
				<input
					type="month"
					class="rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink focus:border-pearl-beige focus:outline-none"
					value={metadata.publicationDate?.substring(0, 7) ?? ''}
					onchange={(e) => onMetadataChange({ publicationDate: e.currentTarget.value, datePrecision: 'month' })}
				/>
			{:else if localDatePrecision === 'day'}
				<input
					type="date"
					class="rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink focus:border-pearl-beige focus:outline-none"
					value={metadata.publicationDate ?? ''}
					onchange={(e) => onMetadataChange({ publicationDate: e.currentTarget.value, datePrecision: 'day' })}
				/>
			{/if}
		</div>
		{#if localDatePrecision !== 'none'}
			<label class="mt-2 flex items-center gap-2 text-xs text-text-muted">
				<input
					type="checkbox"
					checked={localDateApproximate}
					onchange={(e) => {
						localDateApproximate = e.currentTarget.checked;
						onMetadataChange({ dateApproximate: e.currentTarget.checked });
					}}
				/>
				Approximate date
			</label>
		{/if}
	</div>

	<!-- Language -->
	<div>
		<label for="edit-language" class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Language</label>
		<input
			id="edit-language"
			class="mt-2 w-full rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
			placeholder="e.g. Tajik, Persian, Russian"
			value={metadata.language}
			oninput={(e) => onMetadataChange({ language: e.currentTarget.value })}
		/>
	</div>

	<!-- Tags -->
	<div>
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Tags</p>
		<div class="mt-2 flex items-center gap-2">
			<input
				class="w-full rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none"
				placeholder="Add tag..."
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
				class="rounded-full border border-blue-slate/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/30"
			>
				Add
			</button>
		</div>
		{#if metadata.tags.length > 0}
			<div class="mt-2 flex flex-wrap gap-2">
				{#each metadata.tags as tag (tag)}
					<button
						type="button"
						onclick={() => removeTag(tag)}
						class="rounded-full border border-blue-slate/30 bg-pale-sky/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-blue-slate transition hover:border-burnt-peach/50 hover:text-burnt-peach"
					>
						{tag} ×
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- People -->
	<div>
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">People</p>
		<div class="mt-2 flex items-center gap-2">
			<input
				class="w-full rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none"
				placeholder="Add person..."
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
				class="rounded-full border border-blue-slate/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/30"
			>
				Add
			</button>
		</div>
		{#if metadata.people.length > 0}
			<div class="mt-2 flex flex-wrap gap-2">
				{#each metadata.people as person (person)}
					<button
						type="button"
						onclick={() => removePerson(person)}
						class="rounded-full border border-blue-slate/30 bg-pale-sky/20 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-blue-slate transition hover:border-burnt-peach/50 hover:text-burnt-peach"
					>
						{person} ×
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Description -->
	<div>
		<label for="edit-description" class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Description</label>
		<textarea
			id="edit-description"
			rows="3"
			class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
			placeholder="Describe this object..."
			value={metadata.description}
			oninput={(e) => onMetadataChange({ description: e.currentTarget.value })}
		></textarea>
	</div>
</div>