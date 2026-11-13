import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';

import { locale } from '$lib/i18n/locale';
import type { ObjectRow } from '$lib/services/objects';

vi.mock('$app/paths', () => ({
	resolve: (path: string, params?: Record<string, string>) =>
		Object.entries(params ?? {}).reduce(
			(result, [key, value]) => result.replace(`[${key}]`, value),
			path
		)
}));

import ObjectsPage from './+page.svelte';

const row = (id: string): ObjectRow => ({
	id,
	objectId: id,
	title: id,
	description: null,
	thumbnailArtifactId: null,
	type: 'DOCUMENT',
	processingState: 'index_done',
	curationState: 'reviewed',
	availabilityState: 'AVAILABLE',
	accessLevel: 'private',
	language: 'en',
	tags: [],
	tenantId: 'tenant-1',
	sourceIngestionId: null,
	sourceBatchLabel: null,
	metadata: {},
	embargoUntil: null,
	embargoKind: 'none',
	embargoCurationState: null,
	rightsNote: null,
	sensitivityNote: null,
	canDownload: true,
	accessReasonCode: 'OK',
	createdAt: '2026-08-03T00:00:00.000Z',
	updatedAt: '2026-08-03T00:00:00.000Z',
	indicators: { accessPdf: false, ocr: false }
});

const renderPage = () => render(ObjectsPage, {
	data: {
		recent: [],
		list: { rows: [row('OBJ-1'), row('OBJ-2')], filteredCount: 2, totalCount: 2 },
		filters: { limit: 25 },
		returnTo: '/objects',
		session: { role: 'archiver' }
	}
});

const requestResync = async (): Promise<void> => {
	await page.getByRole('button', { name: 'Select visible' }).click();
	await page.getByRole('button', { name: 'Resync selected' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
};

describe('bulk resync notification localization', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		locale.setLocale('en');
	});

	it('preserves partial-success counts and retranslates them after selection is cleared', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
			results: [{ objectId: 'OBJ-1', ok: true }, { objectId: 'OBJ-2', ok: false }]
		}), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		renderPage();
		await requestResync();

		await expect.element(page.getByText('Resync requested for 1 of 2 objects.')).toBeInTheDocument();
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ objectIds: ['OBJ-1', 'OBJ-2'] });
		await expect.element(page.getByRole('button', { name: 'Resync selected' })).not.toBeInTheDocument();

		locale.setLocale('ru');
		await expect.element(page.getByText('Синхронизация запрошена для 1 из 2 объектов.')).toBeInTheDocument();
	});

	it('retranslates a network failure without showing the native exception', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		renderPage();
		await requestResync();

		await expect.element(page.getByText('Failed to request resync.')).toBeInTheDocument();
		locale.setLocale('ru');
		await expect.element(page.getByText('Не удалось запросить синхронизацию.')).toBeInTheDocument();
		await expect.element(page.getByText('Failed to fetch')).not.toBeInTheDocument();
	});
});
