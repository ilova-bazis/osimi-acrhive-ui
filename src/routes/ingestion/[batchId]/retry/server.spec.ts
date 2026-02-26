import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { retryMock } = vi.hoisted(() => ({
	retryMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionDetailService: {
		retry: retryMock
	}
}));

import { POST } from './+server';

describe('/ingestion/[batchId]/retry +server', () => {
	beforeEach(() => {
		retryMock.mockReset();
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

	it('retries ingestion and returns ok', async () => {
		retryMock.mockResolvedValue(undefined);

		const response = await POST({
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(retryMock).toHaveBeenCalledWith(
			expect.objectContaining({
				batchId: 'batch-1'
			})
		);
	});

	it('maps backend errors to response status', async () => {
		retryMock.mockRejectedValue(
			new ApiClientError({
				status: 423,
				code: 'LOCKED',
				message: 'Ingestion is locked'
			})
		);

		const response = await POST({
			params: { batchId: 'batch-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(423);
	});
});
