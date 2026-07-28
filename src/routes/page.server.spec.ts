import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { getSummaryMock } = vi.hoisted(() => ({
	getSummaryMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	dashboardService: {
		getSummary: getSummaryMock
	}
}));

import { load } from './+page.server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'archiver' };

const makeEvent = (overrides: {
	session?: typeof session | null;
	token?: string | undefined;
	deleteCookie?: ReturnType<typeof vi.fn>;
} = {}) =>
	({
		locals: { session: overrides.session === undefined ? session : overrides.session },
		cookies: { get: () => overrides.token ?? 'token-1', delete: overrides.deleteCookie ?? vi.fn() },
		fetch: vi.fn()
	}) as never;

describe('/ +page.server', () => {
	beforeEach(() => {
		getSummaryMock.mockReset();
		getSummaryMock.mockResolvedValue({ stats: {}, activity: [] });
	});

	it('redirects to login when auth is missing', async () => {
		await expect(load(makeEvent({ session: null, token: undefined }))).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('loads dashboard summary for authenticated users', async () => {
		const summary = { stats: { totalBatches: 1 }, activity: [] };
		getSummaryMock.mockResolvedValue(summary);

		await expect(load(makeEvent())).resolves.toEqual({ summary });
		expect(getSummaryMock).toHaveBeenCalledWith({
			role: 'archiver',
			fetchFn: expect.any(Function),
			token: 'token-1'
		});
	});

	it('clears auth cookie and redirects on unauthorized backend response', async () => {
		const deleteCookie = vi.fn();
		getSummaryMock.mockRejectedValue(
			new ApiClientError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
		);

		await expect(load(makeEvent({ deleteCookie }))).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(deleteCookie).toHaveBeenCalledWith('osimi_session', { path: '/' });
	});

	it('maps API failures to 502 with request context', async () => {
		getSummaryMock.mockRejectedValue(
			new ApiClientError({ status: 503, code: 'UNKNOWN_ERROR', message: 'Unavailable', requestId: 'req-1' })
		);

		await expect(load(makeEvent())).rejects.toMatchObject({
			status: 502,
			body: { message: 'Failed to load dashboard (request: req-1).' }
		});
	});
});
