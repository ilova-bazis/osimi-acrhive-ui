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

const createDeferred = <T>() => {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, resolve, reject };
};

const unauthorized = new ApiClientError({
	status: 401,
	code: 'UNAUTHORIZED',
	message: 'Unauthorized'
});

const badRequest = new ApiClientError({
	status: 400,
	code: 'BAD_REQUEST',
	message: 'Invalid search query.'
});

const unavailable = new ApiClientError({
	status: 503,
	code: 'UNKNOWN_ERROR',
	message: 'Unavailable'
});

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

	it('accepts a trimmed q at the backend maximum', () => {
		const q = 'x'.repeat(256);
		const url = new URL('https://example.test/objects');
		url.searchParams.set('q', `  ${q}  `);

		expect(_parseObjectsFilters(url).q).toBe(q);
	});

	it('rejects a direct URL q beyond the backend maximum', () => {
		const url = new URL('https://example.test/objects');
		url.searchParams.set('q', 'x'.repeat(257));

		expect(() => _parseObjectsFilters(url)).toThrow(
			expect.objectContaining({
				status: 400,
				body: { message: 'Search query must be 256 characters or fewer.' }
			})
		);
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
			returnTo: '/objects?q=archive&limit=10',
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

	it('rejects an oversized pasted query without backend requests', async () => {
		const url = new URL('https://example.test/objects');
		url.searchParams.set('q', 'x'.repeat(257));

		await expect(load(makeEvent({ url: url.toString() }))).rejects.toMatchObject({
			status: 400,
			body: { message: 'Search query must be 256 characters or fewer.' }
		});
		expect(listRecentMock).not.toHaveBeenCalled();
		expect(listObjectsMock).not.toHaveBeenCalled();
	});

	it('preserves backend bad requests instead of mapping them to 502', async () => {
		listObjectsMock.mockRejectedValue(
			new ApiClientError({ status: 400, code: 'BAD_REQUEST', message: 'Invalid search query.' })
		);

		await expect(load(makeEvent())).rejects.toMatchObject({
			status: 400,
			body: { message: 'Invalid search query.' }
		});
	});

	it.each([
		['recent 400 settles before list 401', 'recent', badRequest, unauthorized],
		['recent 401 settles before list 400', 'recent', unauthorized, badRequest],
		['recent 503 settles before list 401', 'recent', unavailable, unauthorized],
		['recent 401 settles before list 503', 'recent', unauthorized, unavailable],
		['list 400 settles before recent 401', 'list', unauthorized, badRequest],
		['list 401 settles before recent 400', 'list', badRequest, unauthorized],
		['list 503 settles before recent 401', 'list', unauthorized, unavailable],
		['list 401 settles before recent 503', 'list', unavailable, unauthorized]
	])('prioritizes unauthorized when %s', async (_label, first, recentError, listError) => {
		const recent = createDeferred<unknown>();
		const list = createDeferred<unknown>();
		listRecentMock.mockReturnValue(recent.promise);
		listObjectsMock.mockReturnValue(list.promise);
		const deleteCookie = vi.fn();

		const outcome = Promise.resolve(load(makeEvent({ deleteCookie })));
		const settled = { value: false };
		void outcome.then(
			() => {
				settled.value = true;
			},
			() => {
				settled.value = true;
			}
		);

		expect(listRecentMock).toHaveBeenCalledTimes(1);
		expect(listObjectsMock).toHaveBeenCalledTimes(1);

		if (first === 'recent') {
			recent.reject(recentError);
		} else {
			list.reject(listError);
		}
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(settled.value).toBe(false);

		if (first === 'recent') {
			list.reject(listError);
		} else {
			recent.reject(recentError);
		}

		await expect(outcome).rejects.toMatchObject({
			status: 303,
			location: '/login'
		});
		expect(deleteCookie).toHaveBeenCalledTimes(1);
		expect(deleteCookie).toHaveBeenCalledWith('osimi_session', { path: '/' });
	});
});
