import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { createDraftMock } = vi.hoisted(() => ({
	createDraftMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionNewService: {
		createDraft: createDraftMock
	}
}));

import { actions } from './+page.server';

describe('/ingestion/new +page.server', () => {
	beforeEach(() => {
		createDraftMock.mockReset();
	});

	it('redirects to login when session or token is missing', async () => {
		const request = new Request('https://example.test/ingestion/new', { method: 'POST' });

		await expect(
			actions.default({
				request,
				locals: { session: null },
				cookies: { get: () => undefined, delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('uses defaults when fields are empty', async () => {
		const form = new FormData();
		form.set('name', '   ');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		createDraftMock.mockResolvedValue({ batchId: 'batch-default' });

		await expect(
			actions.default({
				request,
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-default/setup'
		});

		expect(createDraftMock).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					documentType: 'document',
					languageCode: 'en',
					pipelinePreset: 'auto',
					accessLevel: 'private',
					summary: expect.objectContaining({
						title: expect.objectContaining({ primary: expect.any(String) }),
						classification: expect.objectContaining({ tags: expect.any(Array) }),
						dates: expect.any(Object)
					})
				})
			})
		);
	});

	it('creates draft and redirects to setup screen', async () => {
		const form = new FormData();
		form.set('name', 'Batch 01');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		createDraftMock.mockResolvedValue({ batchId: 'batch-01' });

		await expect(
			actions.default({
				request,
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-01/setup'
		});
	});

	it('returns fail(502) for backend errors', async () => {
		const form = new FormData();
		form.set('name', 'Batch 01');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		createDraftMock.mockRejectedValue(
			new ApiClientError({
				status: 502,
				code: 'UNKNOWN_ERROR',
				message: 'Request failed for ingestions.create'
			})
		);

		const result = await actions.default({
			request,
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 502,
			data: { error: 'Request failed for ingestions.create' }
		});
	});
});
