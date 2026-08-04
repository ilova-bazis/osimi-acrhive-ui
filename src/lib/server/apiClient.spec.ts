import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { ApiClientError, backendRequest } from './apiClient';

const jsonResponse = (body: unknown, status = 200): Response =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});

describe('backendRequest', () => {
	it('validates successful backend responses', async () => {
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.success',
				responseSchema: z.object({ ok: z.literal(true) })
			})
		).resolves.toEqual({ ok: true });
	});

	it('throws INVALID_RESPONSE when successful backend responses fail schema validation', async () => {
		const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: false }));

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.invalid',
				responseSchema: z.object({ ok: z.literal(true) })
			})
		).rejects.toMatchObject({
			code: 'INVALID_RESPONSE',
			status: 502,
			message: 'Invalid backend response for test.invalid'
		});
	});

	it('validates request payloads before sending', async () => {
		const fetchFn = vi.fn();

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.request',
				method: 'POST',
				body: { name: '' },
				requestSchema: z.object({ name: z.string().min(1) }),
				responseSchema: z.object({ ok: z.boolean() })
			})
		).rejects.toMatchObject({
			code: 'BAD_REQUEST',
			status: 400,
			message: 'Invalid request payload for test.request'
		});
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('preserves canonical backend error messages and request ids', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(
				{
					request_id: 'req-1',
					error: { code: 'NOT_FOUND', message: 'Missing object', details: { object_id: 'OBJ-1' } }
				},
				404
			)
		);

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.error',
				responseSchema: z.object({ ok: z.boolean() })
			})
		).rejects.toMatchObject({
			code: 'NOT_FOUND',
			status: 404,
			message: 'Missing object',
			requestId: 'req-1',
			details: { object_id: 'OBJ-1' }
		});
	});

	it('maps backend revision conflicts without collapsing them into unknown errors', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(
				{
					request_id: 'req-conflict',
					error: {
						code: 'REVISION_CONFLICT',
						message: 'Object metadata revision is stale.',
						details: { latest_revision: 5 }
					}
				},
				409
			)
		);

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.revisionConflict',
				responseSchema: z.object({ ok: z.boolean() })
			})
		).rejects.toMatchObject({
			code: 'REVISION_CONFLICT',
			status: 409,
			requestId: 'req-conflict',
			details: { latest_revision: 5 }
		});
	});

	it('preserves validation failures and field details', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(
				{
					request_id: 'req-validation',
					error: {
						code: 'VALIDATION_FAILED',
						message: 'Validation failed.',
						details: [{ path: 'metadata.title', code: 'TOO_SMALL' }]
					}
				},
				422
			)
		);

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.validation',
				responseSchema: z.object({ ok: z.boolean() })
			})
		).rejects.toMatchObject({
			code: 'VALIDATION_FAILED',
			status: 422,
			requestId: 'req-validation',
			details: [{ path: 'metadata.title', code: 'TOO_SMALL' }]
		});
	});

	it('preserves alternate backend error messages and request ids', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse({ request_id: 'req-2', message: 'Alternate error shape' }, 500)
		);

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.alternateError',
				responseSchema: z.object({ ok: z.boolean() })
			})
		).rejects.toMatchObject({
			code: 'UNKNOWN_ERROR',
			status: 500,
			message: 'Alternate error shape',
			requestId: 'req-2'
		});
	});

	it('converts fetch rejections to NETWORK_ERROR', async () => {
		const fetchFn = vi.fn().mockRejectedValue(new Error('connection refused'));

		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.network',
				responseSchema: z.object({ ok: z.boolean() })
			})
		).rejects.toBeInstanceOf(ApiClientError);
		await expect(
			backendRequest({
				fetchFn,
				path: '/api/test',
				context: 'test.network',
				responseSchema: z.object({ ok: z.boolean() })
			})
		).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0, message: 'connection refused' });
	});
});
