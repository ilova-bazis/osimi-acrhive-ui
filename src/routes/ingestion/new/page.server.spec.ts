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
				cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-default/setup'
		});

		expect(createDraftMock).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					classificationType: 'document',
					itemKind: 'document',
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
				cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-01/setup'
		});
	});

	it('derives classification type from item kind when omitted', async () => {
		const form = new FormData();
		form.set('name', 'Photo batch');
		form.set('itemKind', 'photo');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		createDraftMock.mockResolvedValue({ batchId: 'batch-photo' });

		await expect(
			actions.default({
				request,
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-photo/setup'
		});

		expect(createDraftMock).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					itemKind: 'photo',
					classificationType: 'image'
				})
			})
		);
	});

	it('stores scanned document item kind for setup redirect', async () => {
		const form = new FormData();
		form.set('name', 'Magazine scans');
		form.set('classificationType', 'magazine_article');
		form.set('itemKind', 'scanned_document');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });
		const setCookie = vi.fn();

		createDraftMock.mockResolvedValue({ batchId: 'batch-magazine' });

		await expect(
			actions.default({
				request,
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1', set: setCookie, delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-magazine/setup'
		});

		expect(createDraftMock).toHaveBeenCalledWith(
			expect.objectContaining({
				payload: expect.objectContaining({
					classificationType: 'magazine_article',
					itemKind: 'scanned_document'
				})
			})
		);
		expect(setCookie).toHaveBeenCalledWith(
			'ingestion-item-kind:batch-magazine',
			'scanned_document',
			expect.objectContaining({ path: '/ingestion/batch-magazine' })
		);
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
			cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 502,
			data: { error: 'Request failed for ingestions.create' }
		});
	});

	it('returns fail(400) when item kind is unknown without calling createDraft', async () => {
		const form = new FormData();
		form.set('itemKind', 'unknown_kind');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await actions.default({
			request,
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid item kind.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when classification type is unknown without calling createDraft', async () => {
		const form = new FormData();
		form.set('classificationType', 'unknown_type');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await actions.default({
			request,
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid classification type.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when pipeline preset is unknown without calling createDraft', async () => {
		const form = new FormData();
		form.set('pipelinePreset', 'unknown_preset');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await actions.default({
			request,
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid pipeline preset.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when access level is unknown without calling createDraft', async () => {
		const form = new FormData();
		form.set('accessLevel', 'unknown_access');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await actions.default({
			request,
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid access level.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when classification and item kind are incompatible without calling createDraft', async () => {
		const form = new FormData();
		form.set('classificationType', 'image');
		form.set('itemKind', 'document');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await actions.default({
			request,
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Incompatible classification type and item kind.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when preset and item kind are incompatible without calling createDraft', async () => {
		const form = new FormData();
		form.set('classificationType', 'image');
		form.set('itemKind', 'photo');
		form.set('pipelinePreset', 'ocr_text');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await actions.default({
			request,
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
			cookies: { get: () => 'token-1', set: vi.fn(), delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Incompatible pipeline preset and item kind.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});
});
