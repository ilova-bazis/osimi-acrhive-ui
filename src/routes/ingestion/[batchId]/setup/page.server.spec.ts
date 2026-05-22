import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCapabilitiesMock, getDetailMock } = vi.hoisted(() => ({
	getCapabilitiesMock: vi.fn(),
	getDetailMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionCapabilitiesService: {
		getCapabilities: getCapabilitiesMock
	},
	ingestionDetailService: {
		getDetail: getDetailMock
	}
}));

import { load } from './+page.server';

describe('/ingestion/[batchId]/setup +page.server', () => {
	beforeEach(() => {
		getCapabilitiesMock.mockReset();
		getDetailMock.mockReset();
	});

	it('uses the redirect cookie item kind when detail item kind is missing', async () => {
		getCapabilitiesMock.mockResolvedValue({
			mediaKinds: ['image', 'audio', 'video', 'document'],
			extensionsByKind: { image: ['jpg'], audio: ['mp3'], video: ['mp4'], document: ['pdf'] },
			mimeByKind: { image: ['image/jpeg'], audio: ['audio/mpeg'], video: ['video/mp4'], document: ['application/pdf'] },
			mimeAliases: {}
		});
		getDetailMock.mockResolvedValue({
			id: 'batch-1',
			batchLabel: 'Batch 1',
			status: 'draft',
			classificationType: 'magazine_article',
			itemKind: undefined,
			languageCode: 'en',
			pipelinePreset: 'auto',
			accessLevel: 'private',
			embargoUntil: null,
			rightsNote: null,
			sensitivityNote: null,
			summary: {},
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-02T00:00:00.000Z',
			processedObjects: 0,
			totalObjects: 0,
			files: [],
			items: []
		});
		const deleteCookie = vi.fn();

		const result = await load({
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: {
				get: (name: string) => {
					if (name === 'ingestion-item-kind:batch-1') return 'scanned_document';
					return 'token-1';
				},
				delete: deleteCookie
			},
			fetch: vi.fn()
		} as never);

		const pageData = result as Exclude<typeof result, void>;
		expect(pageData.metadata.itemKind).toBe('scanned_document');
		expect(deleteCookie).toHaveBeenCalledWith('ingestion-item-kind:batch-1', {
			path: '/ingestion/batch-1'
		});
	});

	it('preserves missing detail item kind when there is no redirect cookie', async () => {
		getCapabilitiesMock.mockResolvedValue({
			mediaKinds: ['image', 'audio', 'video', 'document'],
			extensionsByKind: { image: ['jpg'], audio: ['mp3'], video: ['mp4'], document: ['pdf'] },
			mimeByKind: { image: ['image/jpeg'], audio: ['audio/mpeg'], video: ['video/mp4'], document: ['application/pdf'] },
			mimeAliases: {}
		});
		getDetailMock.mockResolvedValue({
			id: 'batch-2',
			batchLabel: 'Batch 2',
			status: 'draft',
			classificationType: 'magazine_article',
			itemKind: undefined,
			languageCode: 'en',
			pipelinePreset: 'auto',
			accessLevel: 'private',
			embargoUntil: null,
			rightsNote: null,
			sensitivityNote: null,
			summary: {},
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-02T00:00:00.000Z',
			processedObjects: 0,
			totalObjects: 0,
			files: [],
			items: []
		});

		const result = await load({
			params: { batchId: 'batch-2' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: {
				get: () => 'token-1',
				delete: vi.fn()
			},
			fetch: vi.fn()
		} as never);

		const pageData = result as Exclude<typeof result, void>;
		expect(pageData.metadata.classificationType).toBe('magazine_article');
		expect(pageData.metadata.itemKind).toBeUndefined();
	});
});
