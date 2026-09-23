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

import { actions, load } from './+page.server';

const ATTEMPT = {
	idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
	attemptCreatedAt: '2026-09-21T08:15:00.000Z'
};

const buildForm = (fields: Record<string, string> = {}): FormData => {
	const form = new FormData();
	form.set('idempotencyKey', ATTEMPT.idempotencyKey);
	form.set('attemptCreatedAt', ATTEMPT.attemptCreatedAt);
	for (const [key, value] of Object.entries(fields)) form.set(key, value);
	return form;
};

const buildRequest = (fields: Record<string, string> = {}): Request =>
	new Request('https://example.test/ingestion/new', { method: 'POST', body: buildForm(fields) });

const runAction = (request: Request, setCookie: ReturnType<typeof vi.fn> = vi.fn()) =>
	actions.default({
		request,
		locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
		cookies: { get: () => 'token-1', set: setCookie, delete: vi.fn() },
		fetch: vi.fn()
	} as never);

describe('/ingestion/new +page.server', () => {
	beforeEach(() => {
		createDraftMock.mockReset();
	});

	describe('load', () => {
		it('returns a valid attempt key and RFC3339 timestamp', async () => {
			const data = (await load({} as never)) as { idempotencyKey: string; attemptCreatedAt: string };

			expect(data.idempotencyKey).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
			);
			expect(Number.isNaN(new Date(data.attemptCreatedAt).getTime())).toBe(false);
		});

		it('issues a different key for each page load', async () => {
			const first = (await load({} as never)) as { idempotencyKey: string };
			const second = (await load({} as never)) as { idempotencyKey: string };

			expect(first.idempotencyKey).not.toBe(second.idempotencyKey);
		});
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

	it('fails before calling createDraft when attempt data is missing', async () => {
		const request = new Request('https://example.test/ingestion/new', {
			method: 'POST',
			body: new FormData()
		});
		const result = await runAction(request);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid creation attempt.', code: 'INVALID_ATTEMPT' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('fails before calling createDraft when the idempotency key is malformed', async () => {
		const form = buildForm();
		form.set('idempotencyKey', 'not-a-uuid');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await runAction(request);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid creation attempt.', code: 'INVALID_ATTEMPT' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it.each(['not-a-date', '2026-09-21', '09/21/2026', '21.09.2026 08:15'])(
		'fails before calling createDraft when the attempt timestamp is not RFC3339 (%s)',
		async (rawAttemptCreatedAt) => {
			const form = buildForm();
			form.set('attemptCreatedAt', rawAttemptCreatedAt);
			const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

			const result = await runAction(request);

			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Invalid creation attempt.', code: 'INVALID_ATTEMPT' }
			});
			expect(createDraftMock).not.toHaveBeenCalled();
		}
	);

	it('does not echo invalid attempt values back in action data', async () => {
		const form = buildForm();
		form.set('idempotencyKey', 'not-a-uuid');
		form.set('attemptCreatedAt', 'not-a-date');
		const request = new Request('https://example.test/ingestion/new', { method: 'POST', body: form });

		const result = await runAction(request);

		expect(result).toMatchObject({
			status: 400,
			data: {
				idempotencyKey: undefined,
				attemptCreatedAt: undefined
			}
		});
	});

	it('uses defaults when fields are empty and derives the fallback name from the attempt timestamp', async () => {
		createDraftMock.mockResolvedValue({ batchId: 'batch-default' });

		await expect(runAction(buildRequest({ name: '   ' }))).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-default/setup'
		});

		expect(createDraftMock).toHaveBeenCalledWith(
			expect.objectContaining({
				context: expect.objectContaining({
					idempotencyKey: ATTEMPT.idempotencyKey
				}),
				payload: expect.objectContaining({
					name: expect.stringContaining('2026-09-21-08-15'),
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

	it('builds identical create payloads for repeated blank-name attempts', async () => {
		createDraftMock.mockResolvedValue({ batchId: 'batch-stable' });

		await expect(runAction(buildRequest({ name: '   ' }))).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-stable/setup'
		});
		await expect(runAction(buildRequest({ name: '   ' }))).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-stable/setup'
		});

		expect(createDraftMock).toHaveBeenCalledTimes(2);
		expect(createDraftMock.mock.calls[1][0].payload).toEqual(
			createDraftMock.mock.calls[0][0].payload
		);
	});

	it('creates draft and redirects to setup screen', async () => {
		createDraftMock.mockResolvedValue({ batchId: 'batch-01' });

		await expect(runAction(buildRequest({ name: 'Batch 01' }))).rejects.toMatchObject({
			status: 303,
			location: '/ingestion/batch-01/setup'
		});
	});

	it('derives classification type from item kind when omitted', async () => {
		createDraftMock.mockResolvedValue({ batchId: 'batch-photo' });

		await expect(runAction(buildRequest({ name: 'Photo batch', itemKind: 'photo' }))).rejects.toMatchObject({
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
		const setCookie = vi.fn();
		createDraftMock.mockResolvedValue({ batchId: 'batch-magazine' });

		await expect(
			runAction(
				buildRequest({ name: 'Magazine scans', classificationType: 'magazine_article', itemKind: 'scanned_document' }),
				setCookie
			)
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
			'ingestion-item-kind-batch-magazine',
			'scanned_document',
			expect.objectContaining({ path: '/ingestion/batch-magazine' })
		);
	});

	it('returns fail(502) for backend errors and preserves the attempt data and normalized values', async () => {
		createDraftMock.mockRejectedValue(
			new ApiClientError({
				status: 502,
				code: 'UNKNOWN_ERROR',
				message: 'Request failed for ingestions.create'
			})
		);

		const result = await runAction(
			buildRequest({ name: 'Batch 01', itemKind: 'photo', languageCode: 'ru' })
		);

		expect(result).toMatchObject({
			status: 502,
			data: {
				error: 'Request failed for ingestions.create',
				code: 'UNKNOWN_ERROR',
				idempotencyKey: ATTEMPT.idempotencyKey,
				attemptCreatedAt: ATTEMPT.attemptCreatedAt,
				values: {
					name: 'Batch 01',
					classificationType: 'image',
					itemKind: 'photo',
					languageCode: 'ru',
					pipelinePreset: 'auto',
					accessLevel: 'private'
				}
			}
		});
	});

	it('returns fail(409) for idempotency conflicts without rotating the key', async () => {
		createDraftMock.mockRejectedValue(
			new ApiClientError({
				status: 409,
				code: 'CONFLICT',
				message: 'Idempotency key was already used for a different request.'
			})
		);

		const result = await runAction(
			buildRequest({ name: 'Batch 01', summary: 'Summary text', summaryTags: 'tag-one, tag-two' })
		);

		expect(result).toMatchObject({
			status: 409,
			data: {
				error: 'Idempotency key was already used for a different request.',
				code: 'CONFLICT',
				idempotencyKey: ATTEMPT.idempotencyKey,
				attemptCreatedAt: ATTEMPT.attemptCreatedAt,
				values: {
					name: 'Batch 01',
					summary: 'Summary text',
					summaryTags: ['tag-one', 'tag-two']
				}
			}
		});
	});

	it('returns fail(400) when item kind is unknown without calling createDraft', async () => {
		const result = await runAction(buildRequest({ itemKind: 'unknown_kind' }));

		expect(result).toMatchObject({
			status: 400,
			data: {
				error: 'Invalid item kind.',
				code: 'INVALID_PIPELINE_CAPABILITY',
				idempotencyKey: ATTEMPT.idempotencyKey
			}
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when classification type is unknown without calling createDraft', async () => {
		const result = await runAction(buildRequest({ classificationType: 'unknown_type' }));

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid classification type.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when pipeline preset is unknown without calling createDraft', async () => {
		const result = await runAction(buildRequest({ pipelinePreset: 'unknown_preset' }));

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid pipeline preset.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when access level is unknown without calling createDraft', async () => {
		const result = await runAction(buildRequest({ accessLevel: 'unknown_access' }));

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Invalid access level.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when classification and item kind are incompatible without calling createDraft', async () => {
		const result = await runAction(
			buildRequest({ classificationType: 'image', itemKind: 'document' })
		);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Incompatible classification type and item kind.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});

	it('returns fail(400) when preset and item kind are incompatible without calling createDraft', async () => {
		const result = await runAction(
			buildRequest({ classificationType: 'image', itemKind: 'photo', pipelinePreset: 'ocr_text' })
		);

		expect(result).toMatchObject({
			status: 400,
			data: { error: 'Incompatible pipeline preset and item kind.', code: 'INVALID_PIPELINE_CAPABILITY' }
		});
		expect(createDraftMock).not.toHaveBeenCalled();
	});
});
