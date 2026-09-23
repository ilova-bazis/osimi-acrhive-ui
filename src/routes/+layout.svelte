<script lang="ts">
	import './layout.css';
	import { page } from '$app/stores';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import AppMobileHeader from '$lib/components/AppMobileHeader.svelte';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte';
	import { setSession } from '$lib/auth/session';
import type { Session } from '$lib/auth/types';
import { locale } from '$lib/i18n/locale';
import type { IngestionStatus } from '$lib/services/ingestionOverview';
import { onMount } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

let { children, data } = $props<{
	children: () => unknown;
	data: {
		session: Session | null;
		activeBatches: {
			id: string;
			name: string;
			done: number;
			total: number;
			status: IngestionStatus | null;
			statusRaw: string;
		}[];
	};
}>();

	const isPublicRoute = (pathname: string) =>
		pathname === '/login' || pathname.startsWith('/login/');

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

	let routeScrollport = $state<HTMLDivElement>();
	const routeScrollPositions = new SvelteMap<string, number>();
	let pendingRestore = 0;
	let restoringFromHistory = false;

	const scrollKey = (url: URL) => `${url.pathname}${url.search}`;

	beforeNavigate((navigation) => {
		const fromKey = scrollKey($page.url);
		const toKey = navigation.to ? scrollKey(navigation.to.url) : null;
		if (toKey === fromKey) return;

		if (routeScrollport) {
			routeScrollPositions.set(fromKey, routeScrollport.scrollTop);
		}

		if (navigation.type === 'popstate') {
			restoringFromHistory = true;
			pendingRestore = toKey ? (routeScrollPositions.get(toKey) ?? 0) : 0;
		}
	});

	afterNavigate(() => {
		if (!routeScrollport) return;
		routeScrollport.scrollTop = restoringFromHistory ? pendingRestore : 0;
		restoringFromHistory = false;
		pendingRestore = 0;
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</svelte:head>

{#if showSidebar}
	<div class="app-mobile-frame lg:grid lg:grid-cols-[232px_1fr]">
		<div class="hidden lg:block">
			<AppSidebar
				currentPath={$page.url.pathname}
				username={data.session!.username}
				role={data.session!.role}
				activeBatches={data.activeBatches}
				onLogout={handleLogout}
			/>
		</div>
		<div class="app-content-column">
			<div class="app-desktop-utility-row hidden lg:flex">
				<LocaleSwitcher />
			</div>
			<AppMobileHeader currentPath={$page.url.pathname} onLogout={handleLogout} />
			<div class="app-route-scrollport" data-modal-scroll-root bind:this={routeScrollport}>
				{@render children()}
			</div>
		</div>
	</div>
{:else}
	{@render children()}
{/if}
