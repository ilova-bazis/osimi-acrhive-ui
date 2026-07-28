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

const makeEvent = (body: unknown, overrides: Record<string, unknown> = {}) =>
	({
		request: new Request('https://example.test/objects/resync', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
		locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'archiver' } },
		cookies: { get: () => 'token-1', delete: vi.fn() },
		fetch: vi.fn(),
		...overrides,
	}) as never;

describe('/objects/resync +server', () => {
	beforeEach(() => {
		requestResyncMock.mockReset();
		requestResyncMock.mockResolvedValue({ status: 'queued' });
	});

	it('rejects non-archiver/admin users', async () => {
		const response = await POST(
			makeEvent(
				{ objectIds: ['OBJ-1'] },
				{ locals: { session: { id: 'u1', username: 'test', tenantId: null, role: 'viewer' } } },
			),
		);

		expect(response.status).toBe(403);
		expect(requestResyncMock).not.toHaveBeenCalled();
	});

	it('rejects untrusted origins before resyncing objects', async () => {
		const response = await POST(
			makeEvent(
				{ objectIds: ['OBJ-1'] },
				{
					request: new Request('https://example.test/objects/resync', {
						method: 'POST',
						headers: { origin: 'https://evil.test' },
						body: JSON.stringify({ objectIds: ['OBJ-1'] }),
					}),
				},
			),
		);

		expect(response.status).toBe(403);
		expect(requestResyncMock).not.toHaveBeenCalled();
	});

	it('rejects invalid object id arrays', async () => {
		const response = await POST(makeEvent({ objectIds: ['OBJ-1', ''] }));

		expect(response.status).toBe(400);
		expect(requestResyncMock).not.toHaveBeenCalled();
	});

	it('rejects more than 50 object ids', async () => {
		const response = await POST(makeEvent({ objectIds: Array.from({ length: 51 }, (_, index) => `OBJ-${index}`) }));

		expect(response.status).toBe(400);
		expect(requestResyncMock).not.toHaveBeenCalled();
	});

	it('dedupes ids and returns per-object results', async () => {
		const response = await POST(makeEvent({ objectIds: ['OBJ-1', 'OBJ-1', 'OBJ-2'] }));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			results: [
				{ objectId: 'OBJ-1', ok: true },
				{ objectId: 'OBJ-2', ok: true },
			],
		});
		expect(requestResyncMock).toHaveBeenCalledTimes(2);
	});
});
