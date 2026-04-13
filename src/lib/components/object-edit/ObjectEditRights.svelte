<script lang="ts">
	import type { EditableRights } from '$lib/objectView/mockEditData';

	let {
		rights,
		onRightsChange
	}: {
		rights: EditableRights;
		onRightsChange: (patch: Partial<EditableRights>) => void;
	} = $props();

	const accessLevels: Array<{ value: EditableRights['accessLevel']; label: string; description: string }> = [
		{ value: 'Private', label: 'Private', description: 'Only you and assigned curators' },
		{ value: 'Family', label: 'Family', description: 'Family members and approved researchers' },
		{ value: 'Public', label: 'Public', description: 'Anyone with the link can view' }
	];
</script>

<div class="space-y-5">
	<!-- Access level -->
	<div>
		<p class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Access level</p>
		<div class="mt-2 flex gap-2">
			{#each accessLevels as level (level.value)}
				<button
					type="button"
					onclick={() => onRightsChange({ accessLevel: level.value })}
					class="flex-1 rounded-xl border px-3 py-3 text-left transition {rights.accessLevel === level.value
						? 'border-blue-slate bg-blue-slate/5'
						: 'border-border-soft bg-surface-white hover:bg-pale-sky/15'}"
				>
					<p class="text-sm font-medium {rights.accessLevel === level.value ? 'text-blue-slate' : 'text-text-ink'}">{level.label}</p>
					<p class="mt-0.5 text-[10px] text-text-muted">{level.description}</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- Rights note -->
	<div>
		<label for="edit-rights-note" class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Rights note</label>
		<textarea
			id="edit-rights-note"
			rows="3"
			class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
			placeholder="Describe usage rights, attribution requirements, or restrictions..."
			value={rights.rightsNote}
			oninput={(e) => onRightsChange({ rightsNote: e.currentTarget.value })}
		></textarea>
	</div>

	<!-- Sensitivity note -->
	<div>
		<label for="edit-sensitivity" class="text-[10px] uppercase tracking-[0.2em] text-blue-slate">Sensitivity note</label>
		<textarea
			id="edit-sensitivity"
			rows="2"
			class="mt-2 w-full resize-none rounded-xl border border-border-soft bg-pearl-beige/15 px-3 py-2 text-sm text-text-ink placeholder:text-text-muted/50 focus:border-pearl-beige focus:outline-none focus:ring-1 focus:ring-pearl-beige/60"
			placeholder="Flag content sensitivities, cultural considerations, or privacy concerns..."
			value={rights.sensitivityNote}
			oninput={(e) => onRightsChange({ sensitivityNote: e.currentTarget.value })}
		></textarea>
		<p class="mt-1.5 text-[10px] text-text-muted">Sensitivity notes inform curators and future users about cultural, personal, or ethical considerations.</p>
	</div>
</div>