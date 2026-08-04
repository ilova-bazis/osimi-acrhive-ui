import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { ObjectRow } from '$lib/services/objects';

vi.mock('$app/paths', () => ({
	resolve: (path: string, params?: Record<string, string>) =>
		params ? Object.entries(params).reduce((result, [key, value]) => result.replace(`[${key}]`, value), path) : path
}));

import ObjectsTable from './ObjectsTable.svelte';

const baseRow: Omit<ObjectRow, 'id' | 'objectId' | 'title' | 'canDownload' | 'accessReasonCode' | 'indicators'> = {
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
	createdAt: '2026-08-03T00:00:00.000Z',
	updatedAt: '2026-08-03T00:00:00.000Z'
};

describe('ObjectsTable', () => {
	it('renders materialized PDF and OCR indicators without IDX', async () => {
		const rows: ObjectRow[] = [
			{
				...baseRow,
				id: 'OBJ-1',
				objectId: 'OBJ-1',
				title: 'Restricted object',
				canDownload: false,
				accessReasonCode: 'FORBIDDEN_POLICY',
				indicators: { accessPdf: true, ocr: true }
			},
			{
				...baseRow,
				id: 'OBJ-2',
				objectId: 'OBJ-2',
				title: 'No derivatives',
				canDownload: true,
				accessReasonCode: 'OK',
				indicators: { accessPdf: false, ocr: false }
			}
		];

		render(ObjectsTable, {
			rows,
			returnTo: '/objects?q=ledger',
			selectedIds: [],
			onToggleSelection: vi.fn(),
			hasActiveFilters: false,
			queryEntries: [],
			nextCursor: null,
			showFirstPage: false,
			filteredCount: 2,
			totalCount: 2
		});

		await expect.element(page.getByText('PDF', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('OCR', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('IDX', { exact: true })).not.toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: 'Restricted object' }).first()).toHaveAttribute(
			'href',
			'/objects/OBJ-1?returnTo=%2Fobjects%3Fq%3Dledger',
		);
	});
});
