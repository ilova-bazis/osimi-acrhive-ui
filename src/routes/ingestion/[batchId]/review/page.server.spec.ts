import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDetailMock } = vi.hoisted(() => ({
	getDetailMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionDetailService: {
		getDetail: getDetailMock
	}
}));

import { load } from './+page.server';

describe('/ingestion/[batchId]/review +page.server', () => {
	beforeEach(() => {
		getDetailMock.mockReset();
	});

	it('redirects non-submittable ingestions directly to detail', async () => {
		getDetailMock.mockResolvedValue({
			status: 'completed',
			actionCapabilities: { canResume: false }
		});

		await expect(
			load({
				params: { batchId: 'batch-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1' },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/ingestion/batch-1' });
	});

	it('resolves itemKind from classification default when absent and passes items', async () => {
		getDetailMock.mockResolvedValue({
			batchLabel: 'Newspaper batch',
			classificationType: 'newspaper_article',
			itemKind: null,
			languageCode: 'en',
			pipelinePreset: 'ocr_text',
			accessLevel: 'private',
			summary: {},
			files: [{ id: 'f1', sizeBytes: 100 }],
			items: [{ id: 'item-1', itemKind: null }, { id: 'item-2', itemKind: 'photo' }],
			actionCapabilities: { canResume: true }
		});

		const result = await load({
			params: { batchId: 'batch-2' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1' },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			batchId: 'batch-2',
			classificationType: 'newspaper_article',
			itemKind: 'scanned_document',
			pipelinePreset: 'ocr_text',
			items: [{ id: 'item-1', itemKind: null }, { id: 'item-2', itemKind: 'photo' }]
		});
	});
});
