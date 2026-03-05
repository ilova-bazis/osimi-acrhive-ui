import { beforeEach, describe, expect, it, vi } from 'vitest';

const { backendRequestMock } = vi.hoisted(() => ({
	backendRequestMock: vi.fn()
}));

vi.mock('$lib/server/apiClient', () => ({
	backendRequest: backendRequestMock
}));

import { apiIngestionDetailService } from './apiIngestionDetailService';

describe('apiIngestionDetailService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
	});

	it('maps legacy document_type and missing item_kind from detail response', async () => {
		backendRequestMock.mockResolvedValue({
			ingestion: {
				ingestion_id: 'ing-1',
				batch_label: 'Batch 1',
				status: 'DRAFT',
				document_type: 'photo',
				language_code: 'en',
				pipeline_preset: 'auto',
				access_level: 'private',
				created_at: '2026-01-01T00:00:00.000Z',
				updated_at: '2026-01-02T00:00:00.000Z'
			},
			files: []
		});

		const detail = await apiIngestionDetailService.getDetail({
			fetchFn: vi.fn() as never,
			token: 'token-1',
			batchId: 'ing-1'
		});

		expect(detail.classificationType).toBe('image');
		expect(detail.itemKind).toBe('document');
	});

	it('keeps new classification_type and item_kind values from detail response', async () => {
		backendRequestMock.mockResolvedValue({
			ingestion: {
				ingestion_id: 'ing-2',
				batch_label: 'Batch 2',
				status: 'DRAFT',
				classification_type: 'manuscript',
				item_kind: 'scanned_document',
				language_code: 'tg',
				pipeline_preset: 'none',
				access_level: 'family',
				created_at: '2026-01-01T00:00:00.000Z',
				updated_at: '2026-01-02T00:00:00.000Z'
			},
			files: []
		});

		const detail = await apiIngestionDetailService.getDetail({
			fetchFn: vi.fn() as never,
			token: 'token-1',
			batchId: 'ing-2'
		});

		expect(detail.classificationType).toBe('manuscript');
		expect(detail.itemKind).toBe('scanned_document');
	});
});
