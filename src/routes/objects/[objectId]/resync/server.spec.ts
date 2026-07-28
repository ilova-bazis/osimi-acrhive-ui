import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestResyncMock } = vi.hoisted(() => ({
	requestResyncMock: vi.fn(),
}));

vi.mock('$lib/services', () => ({
	objectsService: {
		requestResync: requestResyncMock,
	},
}));

import { POST } from './+server';

const makeEvent = (overrides: Record<string, unknown> = {}) =>
	({
		request: new Request('https://example.test/objects/OBJ-1/resync', { method: 'POST' }),
		params: { objectId: 'OBJ-1' },
		locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
		cookies: { get: () => 'token-1', delete: vi.fn() },
		fetch: vi.fn(),
		...overrides,
	}) as never;

describe('/objects/[objectId]/resync +server', () => {
	beforeEach(() => {
		requestResyncMock.mockReset();
		requestResyncMock.mockResolvedValue({ status: 'queued', objectId: 'OBJ-1' });
	});

	it('rejects non-archiver/admin users', async () => {
		const response = await POST(
			makeEvent({ locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'viewer' } } }),
		);

		expect(response.status).toBe(403);
		expect(requestResyncMock).not.toHaveBeenCalled();
	});

	it('returns 404 when object id is missing', async () => {
		const response = await POST(makeEvent({ params: {} }));

		expect(response.status).toBe(404);
		expect(requestResyncMock).not.toHaveBeenCalled();
	});

	it('queues resync for archivers', async () => {
		const response = await POST(makeEvent());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true, status: 'queued' });
		expect(requestResyncMock).toHaveBeenCalledWith(expect.objectContaining({ objectId: 'OBJ-1' }));
	});
});
