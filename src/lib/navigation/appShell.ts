import type { TranslationKey } from '$lib/i18n/translations';

export type ShellNavHref = '/' | '/ingestion' | '/ingestion/new' | '/objects';

export type ShellNavItem = {
	href: ShellNavHref;
	matchPrefix?: ShellNavHref;
	icon: string;
	labelKey: TranslationKey;
};

export const shellNavItems: ReadonlyArray<ShellNavItem> = [
	{ href: '/', icon: 'home', labelKey: 'header.nav.dashboard' },
	{ href: '/ingestion', matchPrefix: '/ingestion', icon: 'archive', labelKey: 'header.nav.overview' },
	{ href: '/ingestion/new', icon: 'plus', labelKey: 'header.nav.newBatch' },
	{ href: '/objects', matchPrefix: '/objects', icon: 'pages', labelKey: 'header.nav.objects' }
];

const isAtOrBelow = (pathname: string, prefix: string): boolean =>
	pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isShellRouteActive = (
	currentPath: string,
	item: Pick<ShellNavItem, 'href' | 'matchPrefix'>
): boolean => {
	if (item.href === '/') return currentPath === '/';
	const prefix = item.matchPrefix ?? item.href;
	if (prefix === '/ingestion') {
		return (
			isAtOrBelow(currentPath, '/ingestion') &&
			!isAtOrBelow(currentPath, '/ingestion/new')
		);
	}
	return isAtOrBelow(currentPath, prefix);
};
