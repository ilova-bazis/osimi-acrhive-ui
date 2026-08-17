import { describe, expect, it } from 'vitest';

import { isShellRouteActive, shellNavItems } from './appShell';

describe('appShell navigation', () => {
	const byHref = (href: string) => shellNavItems.find((item) => item.href === href)!;

	it('defines the four supported shell destinations', () => {
		expect(shellNavItems.map((item) => item.href)).toEqual([
			'/',
			'/ingestion',
			'/ingestion/new',
			'/objects'
		]);
	});

	it('activates Dashboard only at the root', () => {
		const dashboard = byHref('/');
		expect(isShellRouteActive('/', dashboard)).toBe(true);
		expect(isShellRouteActive('/ingestion', dashboard)).toBe(false);
		expect(isShellRouteActive('/objects', dashboard)).toBe(false);
	});

	it('activates Overview for the ingestion list and nested ingestion routes', () => {
		const overview = byHref('/ingestion');
		expect(isShellRouteActive('/ingestion', overview)).toBe(true);
		expect(isShellRouteActive('/ingestion/batch-1', overview)).toBe(true);
		expect(isShellRouteActive('/ingestion/batch-1/setup', overview)).toBe(true);
		expect(isShellRouteActive('/ingestion/batch-1/review', overview)).toBe(true);
		expect(isShellRouteActive('/', overview)).toBe(false);
		expect(isShellRouteActive('/objects', overview)).toBe(false);
	});

	it('activates New batch for the new-ingestion route and its descendants', () => {
		const overview = byHref('/ingestion');
		const newBatch = byHref('/ingestion/new');
		expect(isShellRouteActive('/ingestion/new', newBatch)).toBe(true);
		expect(isShellRouteActive('/ingestion/new/step', newBatch)).toBe(true);
		expect(isShellRouteActive('/ingestion/new', overview)).toBe(false);
		expect(isShellRouteActive('/ingestion/new/step', overview)).toBe(false);
	});

	it('matches only at path-segment boundaries', () => {
		const overview = byHref('/ingestion');
		const newBatch = byHref('/ingestion/new');
		const objects = byHref('/objects');

		expect(isShellRouteActive('/ingestion/newspaper', overview)).toBe(true);
		expect(isShellRouteActive('/ingestion/newspaper', newBatch)).toBe(false);
		expect(isShellRouteActive('/ingestion-old', overview)).toBe(false);
		expect(isShellRouteActive('/ingestion-old', newBatch)).toBe(false);
		expect(isShellRouteActive('/objects-old', objects)).toBe(false);
	});

	it('activates Objects for the list and nested object routes', () => {
		const objects = byHref('/objects');
		expect(isShellRouteActive('/objects', objects)).toBe(true);
		expect(isShellRouteActive('/objects/obj-1', objects)).toBe(true);
		expect(isShellRouteActive('/objects/obj-1/edit', objects)).toBe(true);
		expect(isShellRouteActive('/ingestion', objects)).toBe(false);
	});

	it('honors a matchPrefix that differs from the item href', () => {
		const item = { href: '/ingestion', matchPrefix: '/objects' } as const;
		expect(isShellRouteActive('/objects/obj-1', item)).toBe(true);
		expect(isShellRouteActive('/ingestion/batch-1', item)).toBe(false);
	});
});
