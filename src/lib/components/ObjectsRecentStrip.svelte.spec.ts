import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { ObjectRow } from '$lib/services/objects';

vi.mock('$app/paths', () => ({
	resolve: (path: string, params?: Record<string, string>) => {
		if (!path.startsWith('/')) {
			throw new Error(`Cannot use \`resolve(...)\` with a non-absolute pathname or route ID (got "${path}").`);
		}
		return params ? Object.entries(params).reduce((result, [key, value]) => result.replace(`[${key}]`, value), path) : path;
	},
}));

import { locale } from '$lib/i18n/locale';
import ObjectsRecentStrip from './ObjectsRecentStrip.svelte';

const recent: ObjectRow = {
	id: 'OBJ-20260804-RECENT1', objectId: 'OBJ-20260804-RECENT1', thumbnailArtifactId: null,
	title: 'Recent production object', type: 'DOCUMENT', processingState: 'index_done', curationState: 'reviewed',
	availabilityState: 'AVAILABLE', accessLevel: 'private', language: 'en', tags: [], tenantId: 'tenant-1',
	sourceIngestionId: null, sourceBatchLabel: null, metadata: {}, embargoUntil: null, embargoKind: 'none',
	embargoCurationState: null, rightsNote: null, sensitivityNote: null, canDownload: true,
	accessReasonCode: 'OK', indicators: { accessPdf: false, ocr: false },
	createdAt: '2026-08-04T00:00:00.000Z', updatedAt: '2026-08-04T00:00:00.000Z',
};

describe('ObjectsRecentStrip', () => {
	it('links recent objects to production detail with a filtered return target', async () => {
		render(ObjectsRecentStrip, { recent: [recent], returnTo: '/objects?q=recent&sort=updated_at_desc' });

		await expect.element(page.getByRole('link', { name: /Recent production object/ })).toHaveAttribute(
			'href',
			'/objects/OBJ-20260804-RECENT1?returnTo=%2Fobjects%3Fq%3Drecent%26sort%3Dupdated_at_desc',
		);
		await expect.element(page.getByText('Prototype object not found.')).not.toBeInTheDocument();
	});
});

describe('ObjectsRecentStrip plural counts', () => {
	it('renders Russian plural forms for recent counts', async () => {
		locale.setLocale('ru');
		try {
			const single: ObjectRow = { ...recent };
			render(ObjectsRecentStrip, { recent: [single], returnTo: '/objects' });
			await expect.element(page.getByText('Последний 1 объект')).toBeInTheDocument();

			const two = Array.from({ length: 2 }, (_, index) => ({
				...recent,
				id: `OBJ-20260804-RECENT${index + 2}`,
				objectId: `OBJ-20260804-RECENT${index + 2}`,
			}));
			render(ObjectsRecentStrip, { recent: two, returnTo: '/objects' });
			await expect.element(page.getByText('Последние 2 объекта')).toBeInTheDocument();

			const many = Array.from({ length: 5 }, (_, index) => ({
				...recent,
				id: `OBJ-20260804-RECENT${index + 2}`,
				objectId: `OBJ-20260804-RECENT${index + 2}`,
			}));
			render(ObjectsRecentStrip, { recent: many, returnTo: '/objects' });
			await expect.element(page.getByText('Последние 5 объектов')).toBeInTheDocument();
		} finally {
			locale.setLocale('en');
		}
	});

	it('renders English plural forms for recent counts', async () => {
		const single: ObjectRow = { ...recent };
		render(ObjectsRecentStrip, { recent: [single], returnTo: '/objects' });
		await expect.element(page.getByText('Last 1 object')).toBeInTheDocument();

		const many = Array.from({ length: 5 }, (_, index) => ({
			...recent,
			id: `OBJ-20260804-RECENT${index + 2}`,
			objectId: `OBJ-20260804-RECENT${index + 2}`,
		}));
		render(ObjectsRecentStrip, { recent: many, returnTo: '/objects' });
		await expect.element(page.getByText('Last 5 objects')).toBeInTheDocument();
	});
});
