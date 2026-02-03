<script lang="ts">
	let {
		library,
		title,
		subtitle,
		sessionLabel,
		sessionValue,
		locales,
		locale,
		onLocaleChange,
		textSizes,
		textSize,
		textSizeLabel = 'Text size',
		localeLabel = 'UI',
		onTextSizeChange
	} = $props<{
		library: string;
		title: string;
		subtitle: string;
		sessionLabel: string;
		sessionValue: string;
		locales: ReadonlyArray<{ key: string; label: string }>;
		locale: string;
		onLocaleChange: (value: string) => void;
		textSizes: ReadonlyArray<{ key: string; label: string }>;
		textSize: string;
		textSizeLabel?: string;
		localeLabel?: string;
		onTextSizeChange: (value: string) => void;
	}>();
</script>

<header class="border-b border-border-soft bg-surface-white px-6 py-5">
	<div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
		<div>
			<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{library}</p>
			<h1 class="font-display text-2xl text-burnt-peach">{title}</h1>
			<p class="mt-1 text-sm text-text-muted">{subtitle}</p>
		</div>
		<div class="flex flex-wrap items-center gap-4 text-xs text-blue-slate">
			<div class="flex items-center gap-2">
				<span class="text-text-muted">{textSizeLabel}</span>
				<div class="flex items-center gap-1 rounded-full border border-border-soft bg-surface-white px-2 py-1">
					{#each textSizes as size (size.key)}
						<button
							onclick={() => onTextSizeChange(size.key)}
							class={`rounded-full px-2 py-1 ${
								textSize === size.key
									? 'bg-blue-slate text-surface-white'
									: 'text-blue-slate'
							}`}
							aria-pressed={textSize === size.key}
						>
							{size.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-text-muted">{localeLabel}</span>
				<div class="flex items-center gap-1 rounded-full border border-border-soft bg-surface-white px-2 py-1">
					{#each locales as item (item.key)}
						<button
							onclick={() => onLocaleChange(item.key)}
							class={`rounded-full px-2 py-1 ${
								locale === item.key
									? 'bg-blue-slate text-surface-white'
									: 'text-blue-slate'
							}`}
							aria-pressed={locale === item.key}
						>
							{item.label}
						</button>
					{/each}
				</div>
			</div>
			<div class="rounded-full border border-border-soft bg-surface-white px-4 py-2 text-xs text-blue-slate">
				{sessionLabel}: {sessionValue}
			</div>
		</div>
	</div>
</header>
