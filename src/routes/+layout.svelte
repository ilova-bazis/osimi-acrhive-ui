<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { session, setSession } from '$lib/auth/session';
	import type { Session } from '$lib/auth/types';
	import { locale } from '$lib/i18n/locale';
	import { translations, type LocaleKey } from '$lib/i18n/translations';
	import { onMount } from 'svelte';

	type AppNavItem = {
		label: string;
		href: string;
		matchPrefix?: string;
	};

	let { children, data } = $props<{ children: () => unknown; data: { session: Session | null } }>();

	const isPublicRoute = (pathname: string) =>
		pathname === '/login' || pathname.startsWith('/login/') ||
		pathname === '/prototype' || pathname.startsWith('/prototype/') ||
		pathname === '/ingestion-proto' || pathname.startsWith('/ingestion-proto/');

	const dictionary = $derived(translations[$locale]);

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

	const navItems = $derived<AppNavItem[]>([
		{ label: t('header.nav.dashboard'), href: '/' },
		{ label: t('header.nav.ingestion'), href: '/ingestion', matchPrefix: '/ingestion' },
		{ label: t('header.nav.objects'), href: '/objects', matchPrefix: '/objects' }
	]);

	const currentTitle = () => {
		const path = $page.url.pathname;
		if (path.startsWith('/ingestion')) return t('header.nav.ingestion');
		if (path.startsWith('/objects')) return t('header.nav.objects');
		return t('header.nav.dashboard');
	};

	const localeOptions = [
		{ key: 'en', label: 'EN' },
		{ key: 'ru', label: 'RU' }
	] as const;

	$effect(() => {
		setSession(data.session);
	});

	onMount(() => {
		locale.init();
	});

	const handleLogout = async () => {
		await fetch('/auth/logout', { method: 'POST' });
		setSession(null);
		window.location.href = '/login';
	};
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data.session && !isPublicRoute($page.url.pathname)}
	<AppHeader
		library={t('header.library')}
		title={currentTitle()}
		username={data.session.username}
		role={data.session.role}
		navItems={navItems}
		currentPath={$page.url.pathname}
		logoutLabel={t('header.signOut')}
		locale={$locale}
		locales={localeOptions}
		localeLabel={t('header.locale')}
		onLocaleChange={(value: string) => locale.setLocale(value as LocaleKey)}
		onLogout={handleLogout}
	/>
{/if}

{@render children()}
