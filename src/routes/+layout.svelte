<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { session, setSession } from '$lib/auth/session';
	import type { Session } from '$lib/auth/types';

	let { children, data } = $props<{ children: () => unknown; data: { session: Session | null } }>();

	const isPublicRoute = (pathname: string) =>
		pathname === '/login' || pathname.startsWith('/login/') || pathname === '/prototype' || pathname.startsWith('/prototype/');

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
		title="Dashboard"
		username={$session.username}
		role={$session.role}
		logoutLabel="Sign out"
		onLogout={handleLogout}
	/>
{/if}

{@render children()}
