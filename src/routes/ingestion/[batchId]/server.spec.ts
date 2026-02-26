import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { deleteMock } = vi.hoisted(() => ({
	deleteMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionDetailService: {
		delete: deleteMock
	}
}));

import { DELETE } from './+server';

describe('/ingestion/[batchId] +server', () => {
	beforeEach(() => {
		deleteMock.mockReset();
	});

	it('returns 401 when auth missing', async () => {
		const response = await DELETE({
			params: { batchId: 'batch-1' },
			locals: { session: null },
			cookies: { get: () => undefined, delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(401);
	});

	it('deletes ingestion and returns ok', async () => {
		deleteMock.mockResolvedValue(undefined);

		const response = await DELETE({
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(deleteMock).toHaveBeenCalledWith(expect.objectContaining({ batchId: 'batch-1' }));
	});

	it('maps backend errors to response status', async () => {
		deleteMock.mockRejectedValue(
			new ApiClientError({
				status: 409,
				code: 'UNKNOWN_ERROR',
				message: 'Only drafts can be deleted'
			})
		);

		const response = await DELETE({
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(409);
	});
});
