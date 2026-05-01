<script lang="ts">
	import { base } from '$app/paths';
	import Icon from './Icon.svelte';
	import ThinProgress from './ThinProgress.svelte';

	type NavItem = { label: string; icon: string; href: string; matchPrefix?: string; badge?: string };
	type ActiveBatch = { id: string; name: string; done: number; total: number; status: string };

	let {
		currentPath,
		username,
		role,
		activeBatches = [],
		onLogout,
	} = $props<{
		currentPath: string;
		username: string;
		role: string;
		activeBatches?: ActiveBatch[];
		onLogout: () => void;
	}>();

	const navItems: NavItem[] = [
		{ label: 'Dashboard', icon: 'home', href: '/' },
		{ label: 'Overview', icon: 'archive', href: '/ingestion', matchPrefix: '/ingestion' },
		{ label: 'New Batch', icon: 'plus', href: '/ingestion/new' },
		{ label: 'Objects', icon: 'pages', href: '/objects', matchPrefix: '/objects' },
	];

	const isActive = (item: NavItem) => {
		if (item.href === '/') return currentPath === '/';
		const prefix = item.matchPrefix ?? item.href;
		if (prefix === '/ingestion') {
			return currentPath === '/ingestion' || (currentPath.startsWith('/ingestion/') && !currentPath.startsWith('/ingestion/new'));
		}
		return currentPath === item.href || currentPath.startsWith(`${item.href}/`);
	};

	const initials = $derived(
		username
			.split(/[\s._-]/)
			.slice(0, 2)
			.map((w: string) => w[0]?.toUpperCase() ?? '')
			.join('')
	);

	const batchTone = (status: string): 'ink' | 'peach' | 'sky' =>
		status === 'completed' ? 'ink' : status === 'failed' ? 'peach' : 'sky';
</script>

<aside class="flex flex-col gap-7 bg-surface-white border-r border-border-soft px-[18px] py-6 sticky top-0 h-screen overflow-y-auto">

	<!-- Brand -->
	<div class="flex items-center gap-3 pl-1">
		<img src="/logo.png" alt="Osimi Digital Library" width="32" height="32" class="flex-shrink-0" />
		<div class="flex flex-col leading-tight">
			<span class="font-display text-base tracking-[0.005em] text-text-ink">Osimi</span>
			<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">Digital Library</span>
		</div>
	</div>

	<!-- Nav -->
	<nav class="flex flex-col gap-[2px]">
		{#each navItems as item (item.href)}
			<a
				href={base + item.href}
				class={`flex items-center gap-[10px] px-[10px] py-2 rounded-xl text-sm transition-all no-underline
					${isActive(item)
						? 'bg-pale-sky/20 border border-border-soft text-text-ink font-medium'
						: 'border border-transparent text-text-muted hover:text-text-ink hover:bg-pale-sky/12'
					}
				`}
			>
				<Icon name={item.icon} size={15} />
				<span class="flex-1">{item.label}</span>
				{#if item.badge}
					<span class="font-mono text-xs text-text-muted bg-alabaster-grey px-[6px] py-[1px] rounded-full">{item.badge}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<hr class="border-border-soft m-0" />

	<!-- Active batches -->
	{#if activeBatches.length > 0}
		<div class="flex flex-col gap-3 pl-1">
			<span class="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">Active batches</span>
			<div class="flex flex-col gap-4">
				{#each activeBatches as batch (batch.id)}
					<div class="flex flex-col gap-1">
						<span class="text-sm text-blue-slate-deep leading-snug">{batch.name}</span>
						<div class="flex items-center gap-2 text-xs text-text-muted">
							<span class="font-mono">{batch.done}/{batch.total}</span>
							<span class="w-px h-2 bg-border-soft"></span>
							<span class="capitalize">{batch.status}</span>
						</div>
						<ThinProgress value={batch.done} total={batch.total} tone={batchTone(batch.status)} />
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- User profile -->
	<div class="mt-auto pt-4 flex items-center gap-3 pl-1">
		<div class="w-[26px] h-[26px] rounded-full bg-pale-sky flex items-center justify-center font-display font-semibold text-sm text-blue-slate border border-border-soft flex-shrink-0">
			{initials}
		</div>
		<div class="flex flex-col min-w-0 flex-1">
			<span class="text-sm text-text-ink truncate">{username}</span>
			<span class="text-xs text-text-muted capitalize">{role}</span>
		</div>
		<button
			type="button"
			onclick={onLogout}
			class="text-xs text-text-muted hover:text-text-ink transition-colors border-none bg-transparent cursor-pointer p-0"
			title="Sign out"
		>
			<Icon name="x" size={13} />
		</button>
	</div>
</aside>
