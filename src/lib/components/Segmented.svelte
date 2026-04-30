<script lang="ts">
	type Option = { id: string; label: string };

	let {
		options,
		value,
		onchange,
	} = $props<{
		options: Option[];
		value: string;
		onchange: (id: string) => void;
	}>();
</script>

<div class="inline-flex bg-pale-sky/20 border border-border-soft rounded-full p-[3px]">
	{#each options as option (option.id)}
		<button
			type="button"
			onclick={() => onchange(option.id)}
			class={`px-[14px] py-[6px] text-[10.5px] uppercase tracking-[0.2em] font-medium rounded-full border-none cursor-pointer transition-all
				${value === option.id
					? 'bg-surface-white text-text-ink shadow-sm'
					: 'bg-transparent text-text-muted hover:text-text-ink'
				}
			`}
		>
			{option.label}
		</button>
	{/each}
</div>
