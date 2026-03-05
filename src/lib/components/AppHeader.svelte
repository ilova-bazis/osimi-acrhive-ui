<script lang="ts">
	import { resolve } from '$app/paths';

	type NavItem = {
		label: string;
		href: string;
		matchPrefix?: string;
	};

	type LocaleOption = {
		key: string;
		label: string;
	};

	let {
		library,
		title,
		username,
		role,
		navItems = [],
		currentPath = '/',
		logoutLabel = 'Sign out',
		locales = [],
		locale = 'en',
		localeLabel = 'UI',
		onLocaleChange,
		onLogout
	} = $props<{
		library: string;
		title: string;
		username: string;
		role: string;
		navItems?: NavItem[];
		currentPath?: string;
		logoutLabel?: string;
		locales?: ReadonlyArray<LocaleOption>;
		locale?: string;
		localeLabel?: string;
		onLocaleChange?: (locale: string) => void;
		onLogout?: () => Promise<void> | void;
	}>();

	const isActive = (item: NavItem) => {
		if (item.href === '/') {
			return currentPath === '/';
		}

		const matcher = item.matchPrefix ?? item.href;
		return currentPath === matcher || currentPath.startsWith(`${matcher}/`);
	};
</script>

<header class="border-b border-border-soft bg-surface-white px-6 py-4">
	<div class="mx-auto flex max-w-6xl flex-col gap-4">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<p class="text-xs uppercase tracking-[0.2em] text-blue-slate">{library}</p>
				<h1 class="font-display text-2xl text-burnt-peach">{title}</h1>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				{#if locales.length > 0}
					<label class="flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3 py-2 text-xs text-blue-slate">
						<span class="uppercase tracking-[0.16em]">{localeLabel}</span>
						<select
							value={locale}
							onchange={(event) => onLocaleChange?.(event.currentTarget.value)}
							class="rounded-full border border-border-soft bg-surface-white px-2 py-1 text-xs text-blue-slate"
						>
							{#each locales as option (option.key)}
								<option value={option.key}>{option.label}</option>
							{/each}
						</select>
					</label>
				{/if}
				<div class="rounded-full border border-border-soft bg-surface-white px-4 py-2 text-xs text-blue-slate">
					{username} · {role}
				</div>
				<button
					type="button"
					onclick={() => onLogout?.()}
					class="rounded-full border border-blue-slate px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-slate transition hover:bg-pale-sky/35"
				>
					{logoutLabel}
				</button>
			</div>
		</div>

		{#if navItems.length > 0}
			<nav aria-label="Primary" class="-mx-1 overflow-x-auto pb-1">
				<div class="flex min-w-max items-center gap-2 px-1">
					{#each navItems as item (item.href)}
						<a
							href={resolve(item.href)}
							aria-current={isActive(item) ? 'page' : undefined}
							class={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
								isActive(item)
									? 'bg-blue-slate text-surface-white'
									: 'border border-border-soft text-blue-slate hover:bg-pale-sky/35'
							}`}
						>
							{item.label}
						</a>
					{/each}
				</div>
			</nav>
		{/if}
	</div>
</header>
