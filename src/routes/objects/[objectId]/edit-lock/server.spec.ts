import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '$lib/server/apiClient';

const { releaseEditLockMock } = vi.hoisted(() => ({
	releaseEditLockMock: vi.fn(),
}));

vi.mock('$lib/services', () => ({
	objectEditService: {
		releaseEditLock: releaseEditLockMock,
	},
}));

import { DELETE } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'archiver' };

const makeEvent = (overrides: Record<string, unknown> = {}) =>
	({
		request: new Request('https://example.test/objects/OBJ-1/edit-lock', { method: 'DELETE' }),
		params: { objectId: 'OBJ-1' },
		locals: { session },
		cookies: { get: () => 'token-1', delete: vi.fn() },
		fetch: vi.fn(),
		...overrides,
	}) as never;

describe('/objects/[objectId]/edit-lock +server', () => {
	beforeEach(() => {
		releaseEditLockMock.mockReset();
	});

	it('returns 401 when auth is missing', async () => {
		const response = await DELETE(
			makeEvent({ locals: { session: null }, cookies: { get: () => undefined, delete: vi.fn() } }),
		);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});

	it('releases the edit lock for authenticated users', async () => {
		releaseEditLockMock.mockResolvedValue({ objectId: 'OBJ-1', released: true });

		const response = await DELETE(makeEvent());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ released: true });
		expect(releaseEditLockMock).toHaveBeenCalledWith(expect.objectContaining({ objectId: 'OBJ-1' }));
	});

	it('returns 401 when backend rejects lock release as unauthorized', async () => {
		releaseEditLockMock.mockRejectedValue(
			new ApiClientError({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' }),
		);

		const response = await DELETE(makeEvent());

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Unauthorized' });
	});

	it('returns best-effort released false for generic release failures', async () => {
		releaseEditLockMock.mockRejectedValue(new Error('backend unavailable'));

		const response = await DELETE(makeEvent());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ released: false });
	});
});
