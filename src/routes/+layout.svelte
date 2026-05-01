<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import { session, setSession } from '$lib/auth/session';
	import type { Session } from '$lib/auth/types';
	import { locale } from '$lib/i18n/locale';
	import { onMount } from 'svelte';

	let { children, data } = $props<{
		children: () => unknown;
		data: {
			session: Session | null;
			activeBatches: { id: string; name: string; done: number; total: number; status: string }[];
		};
	}>();

	const isPublicRoute = (pathname: string) =>
		pathname === '/login' || pathname.startsWith('/login/') ||
		pathname === '/prototype' || pathname.startsWith('/prototype/') ||
		pathname === '/ingestion-proto' || pathname.startsWith('/ingestion-proto/');

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

	const showSidebar = $derived(!!data.session && !isPublicRoute($page.url.pathname));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if showSidebar}
	<div class="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
		<div class="hidden lg:block">
			<AppSidebar
				currentPath={$page.url.pathname}
				username={data.session!.username}
				role={data.session!.role}
				activeBatches={data.activeBatches}
				onLogout={handleLogout}
			/>
		</div>
		<div class="flex flex-col min-h-screen min-w-0">
			{@render children()}
		</div>
	</div>
{:else}
	{@render children()}
{/if}
