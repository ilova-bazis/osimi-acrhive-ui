<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { loadSession, logoutSession, session, sessionLoading } from '$lib/auth/session';

	let { children } = $props<{ children: () => unknown }>();

	const isPublicRoute = (pathname: string) =>
		pathname === '/login' || pathname.startsWith('/login/') || pathname === '/prototype' || pathname.startsWith('/prototype/');

	const enforceRouteAccess = async () => {
		const pathname = $page.url.pathname;
		if (!isPublicRoute(pathname) && !$session && !$sessionLoading) {
			await goto('/login');
		}
		if (pathname === '/login' && $session) {
			await goto('/');
		}
	};

	onMount(async () => {
		await loadSession();
		await enforceRouteAccess();
	});

	$effect(() => {
		enforceRouteAccess();
	});

	const handleLogout = async () => {
		await logoutSession();
		await goto('/login');
	};
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if $session && !isPublicRoute($page.url.pathname)}
	<AppHeader
		library="Osimi Digital Library"
		title="Dashboard"
		username={$session.username}
		role={$session.role}
		logoutLabel="Sign out"
		onLogout={handleLogout}
	/>
{/if}

{@render children()}
