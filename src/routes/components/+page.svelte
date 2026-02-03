<script lang="ts">
	const componentLinks = [
		{ name: 'PageHeader', path: '/components/page-header' },
		{ name: 'FooterActions', path: '/components/footer-actions' },
		{ name: 'BaseButton', path: '/components/base-button' },
		{ name: 'Chip', path: '/components/chip' },
		{ name: 'StatusBadge', path: '/components/status-badge' },
		{ name: 'DropzonePanel', path: '/components/dropzone-panel' },
		{ name: 'StatusLegendPanel', path: '/components/status-legend-panel' },
		{ name: 'FileListPanel', path: '/components/file-list-panel' },
		{ name: 'BatchIntentPanel', path: '/components/batch-intent-panel' },
		{ name: 'FileOverridePanel', path: '/components/file-override-panel' }
	];
</script>

<section class="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-6 px-6 py-16">
	<header>
		<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">Osimi Digital Library</p>
		<h1 class="font-display text-3xl text-burnt-peach">Component Gallery</h1>
		<p class="mt-2 text-sm text-text-muted">
			Browse isolated component previews. Each page renders a single component with sample props.
		</p>
	</header>

	<div class="grid gap-3 md:grid-cols-2">
		{#each componentLinks as item (item.path)}
			<a
				href={item.path}
				class="flex items-center justify-between rounded-2xl border border-border-soft bg-surface-white px-5 py-4 text-sm text-blue-slate transition hover:bg-pale-sky/35"
			>
				<span>{item.name}</span>
				<span class="text-xs uppercase tracking-[0.2em] text-text-muted">View</span>
			</a>
		{/each}
	</div>
</section>
