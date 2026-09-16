import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { updateMock, getPipelineCapabilityContextMock } = vi.hoisted(() => ({
	updateMock: vi.fn(),
	getPipelineCapabilityContextMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionDetailService: {
		update: updateMock,
		getPipelineCapabilityContext: getPipelineCapabilityContextMock
	}
}));

import { PATCH } from './+server';

const validSummary = {
	title: {
		primary: 'Batch 1',
		original_script: null,
		translations: []
	},
	classification: {
		tags: [],
		summary: null
	},
	dates: {
		published: {
			value: null,
			approximate: false,
			confidence: 'medium',
			note: null
		},
		created: {
			value: null,
			approximate: false,
			confidence: 'medium',
			note: null
		}
	}
};

describe('/ingestion/[batchId]/metadata +server', () => {
	beforeEach(() => {
		updateMock.mockReset();
		getPipelineCapabilityContextMock.mockReset();
		getPipelineCapabilityContextMock.mockResolvedValue({
			classificationType: 'document',
			itemKind: 'document',
			pipelinePreset: 'auto',
			itemOverrides: []
		});
	});

	it('returns 401 when auth is missing', async () => {
		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', { method: 'PATCH', body: '{}' }),
			locals: { session: null },
			cookies: { get: () => undefined, delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(401);
	});

	it('updates ingestion metadata and returns ok', async () => {
		updateMock.mockResolvedValue(undefined);

		const response = await PATCH({
			params: { batchId: 'batch-1' },
		request: new Request('https://example.test', {
			method: 'PATCH',
			body: JSON.stringify({
				batchLabel: 'Batch 1',
				classificationType: 'document',
				itemKind: 'document',
				languageCode: 'en',
				pipelinePreset: 'auto',
				accessLevel: 'private',
				summary: validSummary
			})
		}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ batchId: 'batch-1' }));
	});

	it('maps backend errors to response status', async () => {
		updateMock.mockRejectedValue(
			new ApiClientError({
				status: 409,
				code: 'UNKNOWN_ERROR',
				message: 'Cannot update ingestion'
			})
		);

		const response = await PATCH({
			params: { batchId: 'batch-1' },
		request: new Request('https://example.test', {
			method: 'PATCH',
			body: JSON.stringify({
				batchLabel: 'Batch 1',
				classificationType: 'document',
				itemKind: 'document',
				languageCode: 'en',
				pipelinePreset: 'auto',
				accessLevel: 'private',
				summary: validSummary
			})
		}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(409);
	});

	it('rejects partial summary payload', async () => {
		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', {
				method: 'PATCH',
				body: JSON.stringify({
					summary: {
						title: {
							primary: 'Only title'
						}
					}
				})
			}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(400);
	});

	it('rejects invalid item kind and classification type values', async () => {
		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', {
				method: 'PATCH',
				body: JSON.stringify({
					classificationType: 'photo',
					itemKind: 'image'
				})
			}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(400);
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects incompatible pipeline preset update with code INVALID_PIPELINE_CAPABILITY', async () => {
		getPipelineCapabilityContextMock.mockResolvedValue({
			classificationType: 'document',
			itemKind: 'document',
			pipelinePreset: 'auto',
			itemOverrides: []
		});

		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', {
				method: 'PATCH',
				body: JSON.stringify({
					pipelinePreset: 'ocr_text'
				})
			}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data).toMatchObject({
			error: 'Incompatible pipeline preset.',
			code: 'INVALID_PIPELINE_CAPABILITY'
		});
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects preset change when an item has an incompatible override', async () => {
		getPipelineCapabilityContextMock.mockResolvedValue({
			classificationType: 'other',
			itemKind: 'video',
			pipelinePreset: 'video_transcript',
			itemOverrides: ['photo']
		});

		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', {
				method: 'PATCH',
				body: JSON.stringify({
					pipelinePreset: 'video_transcript'
				})
			}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.code).toBe('INVALID_PIPELINE_CAPABILITY');
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('rejects an empty-string item override as unknown', async () => {
		getPipelineCapabilityContextMock.mockResolvedValue({
			classificationType: 'document',
			itemKind: 'scanned_document',
			pipelinePreset: 'auto',
			itemOverrides: ['']
		});

		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', {
				method: 'PATCH',
				body: JSON.stringify({ pipelinePreset: 'auto' })
			}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({
			code: 'INVALID_PIPELINE_CAPABILITY',
			details: { reason: 'unknown_item_kind', rawItemKind: '' }
		});
		expect(updateMock).not.toHaveBeenCalled();
	});

	it('uses the canonical classification fallback when batch item kind is missing', async () => {
		getPipelineCapabilityContextMock.mockResolvedValue({
			classificationType: 'document',
			itemKind: undefined,
			pipelinePreset: 'auto',
			itemOverrides: []
		});

		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', {
				method: 'PATCH',
				body: JSON.stringify({ pipelinePreset: 'ocr_text' })
			}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(updateMock).toHaveBeenCalled();
	});

	it('does not load capability context for unrelated metadata updates', async () => {
		const response = await PATCH({
			params: { batchId: 'batch-1' },
			request: new Request('https://example.test', {
				method: 'PATCH',
				body: JSON.stringify({ batchLabel: 'Renamed batch' })
			}),
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(getPipelineCapabilityContextMock).not.toHaveBeenCalled();
		expect(updateMock).toHaveBeenCalled();
	});
});
