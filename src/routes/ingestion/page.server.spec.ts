import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { getSummaryMock } = vi.hoisted(() => ({
	getSummaryMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	ingestionOverviewService: {
		getSummary: getSummaryMock
	}
}));

import { load } from './+page.server';

describe('/ingestion +page.server', () => {
	beforeEach(() => {
		getSummaryMock.mockReset();
	});

	it('redirects to login when session or token is missing', async () => {
		await expect(
			load({
				locals: { session: null },
				cookies: { get: () => undefined, delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('returns ingestion summary for authenticated users', async () => {
		const summary = {
			stats: {
				totalBatches: 1,
				objectsCreated: 4,
				inProgress: 0,
				needsAttention: 0
			},
			activeAndRecent: [],
			drafts: []
		};

		getSummaryMock.mockResolvedValue(summary);

		await expect(
			load({
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1', delete: vi.fn() },
				fetch: vi.fn()
			} as never)
		).resolves.toEqual({ summary });
	});

	it('clears auth cookie and redirects on unauthorized backend response', async () => {
		const deleteMock = vi.fn();
		getSummaryMock.mockRejectedValue(
			new ApiClientError({
				status: 401,
				code: 'UNAUTHORIZED',
				message: 'Unauthorized'
			})
		);

		await expect(
			load({
				locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'operator' } },
				cookies: { get: () => 'token-1', delete: deleteMock },
				fetch: vi.fn()
			} as never)
		).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});

		expect(deleteMock).toHaveBeenCalledWith('osimi_session', { path: '/' });
	});
});
