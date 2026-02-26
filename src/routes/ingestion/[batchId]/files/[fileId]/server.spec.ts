import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { deleteFileMock } = vi.hoisted(() => ({
	deleteFileMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionSetupService: {
		deleteFile: deleteFileMock
	}
}));

import { DELETE } from './+server';

describe('/ingestion/[batchId]/files/[fileId] +server', () => {
	beforeEach(() => {
		deleteFileMock.mockReset();
	});

	it('returns 401 when auth is missing', async () => {
		const response = await DELETE({
			params: { batchId: 'batch-1', fileId: 'file-1' },
			locals: { session: null },
			cookies: { get: () => undefined, delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(401);
	});

	it('deletes ingestion file and returns ok', async () => {
		deleteFileMock.mockResolvedValue(undefined);

		const response = await DELETE({
			params: { batchId: 'batch-1', fileId: 'file-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(200);
		expect(deleteFileMock).toHaveBeenCalledWith(
			expect.objectContaining({ batchId: 'batch-1', fileId: 'file-1' })
		);
	});

	it('maps conflict from backend to 409', async () => {
		deleteFileMock.mockRejectedValue(
			new ApiClientError({
				status: 409,
				code: 'UNKNOWN_ERROR',
				message: 'Cannot remove committed file'
			})
		);

		const response = await DELETE({
			params: { batchId: 'batch-1', fileId: 'file-1' },
			locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
			cookies: { get: () => 'token-1', delete: vi.fn() },
			fetch: vi.fn()
		} as never);

		expect(response.status).toBe(409);
	});
});
