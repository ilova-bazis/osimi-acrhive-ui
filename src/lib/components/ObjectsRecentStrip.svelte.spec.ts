import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { ObjectRow } from '$lib/services/objects';

vi.mock('$app/paths', () => ({
	resolve: (path: string, params?: Record<string, string>) =>
		params ? Object.entries(params).reduce((result, [key, value]) => result.replace(`[${key}]`, value), path) : path,
}));

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
