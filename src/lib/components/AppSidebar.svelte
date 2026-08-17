<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale } from '$lib/i18n/locale';
	import { batchStatusKey } from '$lib/i18n/statusLabels';
	import { translations, type TranslationKey } from '$lib/i18n/translations';
	import { translate } from '$lib/i18n/translate';
	import { isShellRouteActive, shellNavItems } from '$lib/navigation/appShell';
	import type { IngestionStatus } from '$lib/services/ingestionOverview';
	import Icon from './Icon.svelte';
	import LocaleSwitcher from './LocaleSwitcher.svelte';
	import ThinProgress from './ThinProgress.svelte';

	type ActiveBatch = {
		id: string;
		name: string;
		done: number;
		total: number;
		status: IngestionStatus | null;
		statusRaw: string;
	};

	let {
		currentPath,
		username,
		role,
		activeBatches = [],
		onLogout
	} = $props<{
		currentPath: string;
		username: string;
		role: string;
		activeBatches?: ActiveBatch[];
		onLogout: () => void;
	}>();

	const dictionary = $derived(translations[$locale]);
	const t = (key: TranslationKey) => translate(dictionary, key);

	const navItems = $derived(
		shellNavItems.map((item) => ({
			...item,
			label: t(item.labelKey)
		}))
	);

	const statusLabel = (batch: ActiveBatch): string => {
		const key = batchStatusKey(batch.status);
		return key ? t(key) : batch.statusRaw;
	};

	const initials = $derived(
		username
			.split(/[\s._-]/)
			.slice(0, 2)
			.map((w: string) => w[0]?.toUpperCase() ?? '')
			.join('')
	);

	const batchTone = (batch: ActiveBatch): 'ink' | 'peach' | 'sky' =>
		batch.status === 'completed'
			? 'ink'
			: batch.status === 'failed' || batch.status === 'completed_with_errors'
				? 'peach'
				: 'sky';
</script>

<aside
	class="flex flex-col gap-7 bg-surface-white border-r border-border-soft px-[18px] py-6 sticky top-0 h-screen overflow-y-auto"
>
	<!-- Brand -->
	<div class="flex items-center gap-3 pl-1">
		<img
			src="/logo.png"
			alt=""
			width="32"
			height="32"
			class="flex-shrink-0"
		/>
		<div class="flex flex-col leading-tight">
			<span class="font-display text-base tracking-[0.005em] text-text-ink">Osimi</span>
			<span class="text-xs uppercase tracking-[0.2em] text-blue-slate">
				{t('header.librarySubtitle')}
			</span>
		</div>
	</div>

	<!-- Nav -->
	<nav class="flex flex-col gap-[2px]" aria-label={t('header.nav.primaryLabel')}>
		{#each navItems as item (item.href)}
			<a
				href={resolve(item.href)}
				aria-current={isShellRouteActive(currentPath, item) ? 'page' : undefined}
				class={`flex items-center gap-[10px] px-[10px] py-2 rounded-xl text-sm transition-all no-underline
					${isShellRouteActive(currentPath, item)
						? 'bg-pale-sky/20 border border-border-soft text-text-ink font-medium'
						: 'border border-transparent text-text-muted hover:text-text-ink hover:bg-pale-sky/12'
					}
				`}
			>
				<Icon name={item.icon} size={15} />
				<span class="flex-1">{item.label}</span>
			</a>
		{/each}
	</nav>

	<hr class="border-border-soft m-0" />

	<!-- Active batches -->
	{#if activeBatches.length > 0}
		<div class="flex flex-col gap-3 pl-1">
			<span class="text-xs uppercase tracking-[0.2em] text-text-muted font-medium">
				{t('header.activeBatches')}
			</span>
			<div class="flex flex-col gap-4">
				{#each activeBatches as batch (batch.id)}
					<div class="flex flex-col gap-1">
						<span class="text-sm text-blue-slate-deep leading-snug">{batch.name}</span>
						<div class="flex items-center gap-2 text-xs text-text-muted">
							<span class="font-mono">{batch.done}/{batch.total}</span>
							<span class="w-px h-2 bg-border-soft"></span>
							<span class="capitalize">{statusLabel(batch)}</span>
						</div>
						<ThinProgress value={batch.done} total={batch.total} tone={batchTone(batch)} />
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="pt-2 pl-1">
		<LocaleSwitcher />
	</div>

	<!-- User profile -->
	<div class="mt-auto pt-4 flex items-center gap-3 pl-1">
		<div
			class="w-[26px] h-[26px] rounded-full bg-pale-sky flex items-center justify-center font-display font-semibold text-sm text-blue-slate border border-border-soft flex-shrink-0"
		>
			{initials}
		</div>
		<div class="flex flex-col min-w-0 flex-1">
			<span class="text-sm text-text-ink truncate">{username}</span>
			<span class="text-xs text-text-muted capitalize">{role}</span>
		</div>
		<button
			type="button"
			onclick={onLogout}
			aria-label={t('header.signOut')}
			title={t('header.signOut')}
			class="text-xs text-text-muted hover:text-text-ink transition-colors border-none bg-transparent cursor-pointer p-0"
		>
			<Icon name="x" size={13} />
		</button>
	</div>
</aside>
