<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import type { Session } from '$lib/auth/types';

	let { data, children } = $props<{ data: { session: Session | null }; children: () => unknown }>();

	const isPublicRoute = (pathname: string) =>
		pathname === '/login' || pathname.startsWith('/login/') || pathname === '/prototype' || pathname.startsWith('/prototype/');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if data?.session && !isPublicRoute($page.url.pathname)}
	<AppHeader
		library="Osimi Digital Library"
		title="Dashboard"
		username={data.session.username}
		role={data.session.role}
		logoutLabel="Sign out"
	/>
{/if}

{@render children()}
