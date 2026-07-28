import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { listRecentMock, listObjectsMock } = vi.hoisted(() => ({
	listRecentMock: vi.fn(),
	listObjectsMock: vi.fn()
}));

vi.mock('$lib/services', () => ({
	objectsService: {
		listRecent: listRecentMock,
		listObjects: listObjectsMock
	}
}));

import { _parseObjectsFilters, load } from './+page.server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'archiver' };

const makeEvent = (overrides: {
	session?: typeof session | null;
	token?: string | undefined;
	deleteCookie?: ReturnType<typeof vi.fn>;
	url?: string;
} = {}) =>
	({
		locals: { session: overrides.session === undefined ? session : overrides.session },
		cookies: { get: () => overrides.token ?? 'token-1', delete: overrides.deleteCookie ?? vi.fn() },
		fetch: vi.fn(),
		url: new URL(overrides.url ?? 'https://example.test/objects')
	}) as never;

describe('parseObjectsFilters', () => {
	it('normalizes allowed enum values and text params', () => {
		const url = new URL('https://example.test/objects?q=test&availability_state=AVAILABLE&access_level=family&sort=updated_at_desc&language=en&batch_label=batch-1&type=DOCUMENT&from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z&tag=history&cursor=abc&limit=50');

		const parsed = _parseObjectsFilters(url);

		expect(parsed).toMatchObject({
			q: 'test',
			availabilityState: 'AVAILABLE',
			accessLevel: 'family',
			sort: 'updated_at_desc',
			language: 'en',
			batchLabel: 'batch-1',
			type: 'DOCUMENT',
			from: '2026-01-01T00:00:00Z',
			to: '2026-12-31T23:59:59Z',
			tag: 'history',
			cursor: 'abc',
			limit: 50
		});
	});

	it('drops invalid enum values and clamps limit', () => {
		const url = new URL('https://example.test/objects?availability_state=INVALID&access_level=oops&sort=bad&limit=500');

		const parsed = _parseObjectsFilters(url);

		expect(parsed.availabilityState).toBeUndefined();
		expect(parsed.accessLevel).toBeUndefined();
		expect(parsed.sort).toBe('created_at_desc');
		expect(parsed.limit).toBe(200);
	});
});

describe('/objects +page.server', () => {
	beforeEach(() => {
		listRecentMock.mockReset();
		listObjectsMock.mockReset();
		listRecentMock.mockResolvedValue([]);
		listObjectsMock.mockResolvedValue({ rows: [], nextCursor: null, filteredCount: 0, totalCount: 0 });
	});

	it('redirects to login when auth is missing', async () => {
		await expect(load(makeEvent({ session: null, token: undefined }))).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
	});

	it('loads recent objects and filtered object list', async () => {
		const recent = [{ id: 'row-recent' }];
		const list = { rows: [{ id: 'row-1' }], nextCursor: 'next', filteredCount: 1, totalCount: 5 };
		listRecentMock.mockResolvedValue(recent);
		listObjectsMock.mockResolvedValue(list);

		await expect(load(makeEvent({ url: 'https://example.test/objects?q=archive&limit=10' }))).resolves.toEqual({
			recent,
			list,
			filters: expect.objectContaining({ q: 'archive', limit: 10 }),
			session
		});
		expect(listRecentMock).toHaveBeenCalledWith(expect.objectContaining({ context: expect.any(Object) }));
		expect(listObjectsMock).toHaveBeenCalledWith(
			expect.objectContaining({ filters: expect.objectContaining({ q: 'archive', limit: 10 }) })
		);
	});

	it('clears auth cookie and redirects on unauthorized backend response', async () => {
		const deleteCookie = vi.fn();
		listRecentMock.mockRejectedValue(
			new ApiClientError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' })
		);

		await expect(load(makeEvent({ deleteCookie }))).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(deleteCookie).toHaveBeenCalledWith('osimi_session', { path: '/' });
	});

	it('maps API failures to 502 with request context', async () => {
		listObjectsMock.mockRejectedValue(
			new ApiClientError({ status: 503, code: 'UNKNOWN_ERROR', message: 'Unavailable', requestId: 'req-1' })
		);

		await expect(load(makeEvent())).rejects.toMatchObject({
			status: 502,
			body: { message: 'Failed to load objects (request: req-1).' }
		});
	});
});
