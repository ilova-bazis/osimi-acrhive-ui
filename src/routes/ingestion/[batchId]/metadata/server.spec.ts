import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { updateMock } = vi.hoisted(() => ({
	updateMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionDetailService: {
		update: updateMock
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
});
