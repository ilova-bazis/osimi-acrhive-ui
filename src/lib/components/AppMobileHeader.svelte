<script lang="ts">
	import { resolve } from '$app/paths';
	import { locale } from '$lib/i18n/locale';
	import { translate } from '$lib/i18n/translate';
import { translations, type TranslationKey } from '$lib/i18n/translations';
	import { isShellRouteActive, shellNavItems } from '$lib/navigation/appShell';
	import Icon from './Icon.svelte';
	import LocaleSwitcher from './LocaleSwitcher.svelte';

	let {
		currentPath,
		onLogout
	} = $props<{
		currentPath: string;
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
</script>

<header class="shrink-0 border-b border-border-soft bg-surface-white lg:hidden">
	<div class="flex items-center justify-between gap-3 px-4 py-3">
		<div class="flex items-center gap-2 min-w-0">
			<img
				src="/logo.png"
				alt=""
				width="28"
				height="28"
				class="flex-shrink-0"
			/>
			<div class="flex flex-col leading-tight min-w-0">
				<span class="font-display text-sm tracking-[0.005em] text-text-ink truncate">Osimi</span>
				<span class="text-[10px] uppercase tracking-[0.2em] text-blue-slate truncate">
					{t('header.librarySubtitle')}
				</span>
			</div>
		</div>
		<div class="flex items-center gap-2 flex-shrink-0">
			<LocaleSwitcher />
			<button
				type="button"
				onclick={onLogout}
				aria-label={t('header.signOut')}
				title={t('header.signOut')}
				class="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft text-text-muted hover:text-text-ink transition-colors bg-transparent cursor-pointer"
			>
				<Icon name="x" size={13} />
			</button>
		</div>
	</div>
	<nav
		aria-label={t('header.nav.primaryLabel')}
		class="overflow-x-auto border-t border-border-soft"
	>
		<div class="flex min-w-max items-center gap-1 px-2 py-2">
			{#each navItems as item (item.href)}
				<a
					href={resolve(item.href)}
					aria-current={isShellRouteActive(currentPath, item) ? 'page' : undefined}
					class={`flex items-center gap-[6px] rounded-full px-3 py-1.5 text-xs no-underline transition whitespace-nowrap ${
						isShellRouteActive(currentPath, item)
							? 'bg-blue-slate text-surface-white'
							: 'border border-border-soft text-blue-slate hover:bg-pale-sky/35'
					}`}
				>
					<Icon name={item.icon} size={13} />
					<span>{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</header>
