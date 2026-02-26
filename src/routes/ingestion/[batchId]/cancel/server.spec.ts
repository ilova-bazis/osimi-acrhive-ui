import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { cancelMock } = vi.hoisted(() => ({
	cancelMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionDetailService: {
		cancel: cancelMock
	}
}));

import { POST } from './+server';

describe('/ingestion/[batchId]/cancel +server', () => {
	beforeEach(() => {
		cancelMock.mockReset();
	});

	it('returns 401 when auth missing', async () => {
		const response = await POST({
			params: { batchId: 'batch-1' },
			locals: { session: null },
			cookies: { get: () => undefined, delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(401);
	});

	it('cancels ingestion and returns ok', async () => {
		cancelMock.mockResolvedValue(undefined);

		const response = await POST({
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(cancelMock).toHaveBeenCalledWith(expect.objectContaining({ batchId: 'batch-1' }));
	});

	it('maps backend errors to response status', async () => {
		cancelMock.mockRejectedValue(
			new ApiClientError({
				status: 409,
				code: 'UNKNOWN_ERROR',
				message: 'Cannot cancel after processing start'
			})
		);

		const response = await POST({
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(409);
	});
});
