<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { session, setSession } from '$lib/auth/session';
	import type { Session } from '$lib/auth/types';

	type AppNavItem = {
		label: string;
		href: string;
		matchPrefix?: string;
	};

	let { children, data } = $props<{ children: () => unknown; data: { session: Session | null } }>();

	const isPublicRoute = (pathname: string) =>
		pathname === '/login' || pathname.startsWith('/login/') || pathname === '/prototype' || pathname.startsWith('/prototype/');

	const navItems: AppNavItem[] = [
		{ label: 'Dashboard', href: '/' },
		{ label: 'Ingestion', href: '/ingestion', matchPrefix: '/ingestion' },
		{ label: 'Objects', href: '/objects', matchPrefix: '/objects' }
	];

	const currentTitle = () => {
		const path = $page.url.pathname;
		if (path.startsWith('/ingestion')) return 'Ingestion';
		if (path.startsWith('/objects')) return 'Objects';
		return 'Dashboard';
	};

	$effect(() => {
		setSession(data.session);
	});

	const handleLogout = async () => {
		await fetch('/auth/logout', { method: 'POST' });
		setSession(null);
		window.location.href = '/login';
	};
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if $session && !isPublicRoute($page.url.pathname)}
	<AppHeader
		library="Osimi Digital Library"
		title={currentTitle()}
		username={$session.username}
		role={$session.role}
		navItems={navItems}
		currentPath={$page.url.pathname}
		logoutLabel="Sign out"
		onLogout={handleLogout}
	/>
{/if}

{@render children()}
