import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { getDetailMock, getActivityMock } = vi.hoisted(() => ({
	getDetailMock: vi.fn(),
	getActivityMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	 ingestionDetailService: {
		getDetail: getDetailMock
	},
	dashboardService: {
		getActivity: getActivityMock
	}
}));

import { load } from './+page.server';

describe('/ingestion/[batchId] +page.server', () => {
	beforeEach(() => {
		getDetailMock.mockReset();
		getActivityMock.mockReset();
		getActivityMock.mockResolvedValue([]);
	});

	it('redirects to login when auth is missing', async () => {
		await expect(
			load({
				params: { batchId: 'batch-1' },
				locals: { session: null },
				cookies: { get: () => undefined, delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('returns detail for authenticated requests', async () => {
		const detail = {
			id: 'batch-1',
			batchLabel: 'Batch 1',
			status: 'ingesting',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
			processedObjects: 1,
			totalObjects: 2,
			files: []
		};

		getDetailMock.mockResolvedValue(detail);

		await expect(
			load({
				params: { batchId: 'batch-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).resolves.toEqual({ detail, activity: [], activityError: null });
		expect(getActivityMock).toHaveBeenCalledWith(
			expect.objectContaining({ ingestionId: 'batch-1' })
		);
	});

	it('throws 404 when backend reports not found', async () => {
		getDetailMock.mockRejectedValue(
			new ApiClientError({
				status: 404,
				code: 'NOT_FOUND',
				message: 'Not found'
			})
		);

		await expect(
			load({
				params: { batchId: 'batch-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({ status: 404 });
	});

	it('returns detail with non-blocking activity error when log fetch fails', async () => {
		const detail = {
			id: 'batch-1',
			batchLabel: 'Batch 1',
			status: 'failed',
			createdAt: '2026-01-01T00:00:00.000Z',
			updatedAt: '2026-01-01T00:00:00.000Z',
			processedObjects: 1,
			totalObjects: 2,
			files: []
		};

		getDetailMock.mockResolvedValue(detail);
		getActivityMock.mockRejectedValue(
			new ApiClientError({
				status: 502,
				code: 'BAD_REQUEST',
				message: 'Activity unavailable',
				requestId: 'req-123'
			})
		);

		await expect(
			load({
				params: { batchId: 'batch-1' },
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).resolves.toEqual({
			detail,
			activity: [],
			activityError: 'Failed to load activity logs (request: req-123).'
		});
	});
});
