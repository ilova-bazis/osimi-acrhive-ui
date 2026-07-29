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

	it('maps legacy document_type without inventing a missing item_kind', async () => {
		backendRequestMock.mockResolvedValueOnce({
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
		}).mockResolvedValueOnce({ items: [] });

		const detail = await apiIngestionDetailService.getDetail({
			fetchFn: vi.fn() as never,
			token: 'token-1',
			batchId: 'ing-1'
		});

		expect(detail.classificationType).toBe('image');
		expect(detail.itemKind).toBeUndefined();
	});

	it('keeps new classification_type and item_kind values from detail response', async () => {
		backendRequestMock.mockResolvedValueOnce({
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
		}).mockResolvedValueOnce({ items: [] });

		const detail = await apiIngestionDetailService.getDetail({
			fetchFn: vi.fn() as never,
			token: 'token-1',
			batchId: 'ing-2'
		});

		expect(detail.classificationType).toBe('manuscript');
		expect(detail.itemKind).toBe('scanned_document');
	});

	it('preserves persisted item summaries when mapping detail items', async () => {
		const summary = {
			classification: { tags: ['archive'], summary: 'Item summary' },
			dates: { published: { value: '2026', approximate: false } }
		};
		backendRequestMock
			.mockResolvedValueOnce({
				items: [
					{
						id: 'item-1',
						ingestion_id: 'ing-3',
						item_index: 1,
						status: 'DRAFT',
						title: 'Stored title',
						summary,
						created_at: '2026-01-01T00:00:00.000Z',
						updated_at: '2026-01-02T00:00:00.000Z'
					}
				]
			})
			.mockResolvedValueOnce({ files: [] });

		const items = await apiIngestionDetailService.listItems({
			fetchFn: vi.fn() as never,
			token: 'token-1',
			batchId: 'ing-3'
		});

		expect(items[0]).toEqual({
			id: 'item-1',
			itemIndex: 1,
			label: 'Stored title',
			status: 'DRAFT',
			summary,
			files: []
		});
	});

	it('maps a missing item summary to an empty object', async () => {
		backendRequestMock
			.mockResolvedValueOnce({
				items: [
					{
						id: 'item-1',
						ingestion_id: 'ing-4',
						item_index: 1,
						status: 'DRAFT',
						created_at: '2026-01-01T00:00:00.000Z',
						updated_at: '2026-01-02T00:00:00.000Z'
					}
				]
			})
			.mockResolvedValueOnce({ files: [] });

		const items = await apiIngestionDetailService.listItems({
			fetchFn: vi.fn() as never,
			token: 'token-1',
			batchId: 'ing-4'
		});

		expect(items[0]?.summary).toEqual({});
	});

	it('rejects detail loads when item list fetch fails', async () => {
		backendRequestMock
			.mockResolvedValueOnce({
				ingestion: {
					ingestion_id: 'ing-3',
					batch_label: 'Batch 3',
					status: 'DRAFT',
					classification_type: 'document',
					item_kind: 'document',
					language_code: 'en',
					pipeline_preset: 'none',
					access_level: 'private',
					created_at: '2026-01-01T00:00:00.000Z',
					updated_at: '2026-01-02T00:00:00.000Z'
				},
				files: []
			})
			.mockRejectedValueOnce(new Error('items failed'));

		await expect(
			apiIngestionDetailService.getDetail({
				fetchFn: vi.fn() as never,
				token: 'token-1',
				batchId: 'ing-3'
			})
		).rejects.toThrow('items failed');
	});

	it('rejects item loads when item-file fetch fails', async () => {
		backendRequestMock
			.mockResolvedValueOnce({
				items: [
					{
						id: 'item-1',
						ingestion_id: 'ing-4',
						item_index: 1,
						status: 'DRAFT',
						created_at: '2026-01-01T00:00:00.000Z',
						updated_at: '2026-01-02T00:00:00.000Z'
					}
				]
			})
			.mockRejectedValueOnce(new Error('files failed'));

		await expect(
			apiIngestionDetailService.listItems({
				fetchFn: vi.fn() as never,
				token: 'token-1',
				batchId: 'ing-4'
			})
		).rejects.toThrow('files failed');
	});

});
