import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listArchiveRequestsMock } = vi.hoisted(() => ({
	listArchiveRequestsMock: vi.fn(),
}));

vi.mock('$lib/services', () => ({
	archiveRequestsService: { listArchiveRequests: listArchiveRequestsMock },
}));

import { GET } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'archiver' };
const makeEvent = (authenticated = true) => ({
	params: { objectId: 'OBJ-1' },
	locals: { session: authenticated ? session : null },
	cookies: { get: () => authenticated ? 'token-1' : undefined, delete: vi.fn() },
	fetch: vi.fn(),
}) as never;

describe('/objects/[objectId]/publication-status +server', () => {
	beforeEach(() => listArchiveRequestsMock.mockReset());

	it('returns the latest curated OCR publication request', async () => {
		listArchiveRequestsMock.mockResolvedValue({
			requests: [{
				id: 'req-1', status: 'FAILED', failureReason: 'Archive unavailable',
				createdAt: '2026-08-04T12:00:00.000Z', updatedAt: '2026-08-04T12:01:00.000Z',
				completedAt: '2026-08-04T12:01:00.000Z',
			}],
			nextCursor: null,
			filteredCount: 1,
		});

		const response = await GET(makeEvent());

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			request: {
				id: 'req-1', status: 'FAILED', failureReason: 'Archive unavailable',
				createdAt: '2026-08-04T12:00:00.000Z', updatedAt: '2026-08-04T12:01:00.000Z',
				completedAt: '2026-08-04T12:01:00.000Z',
			},
		});
		expect(listArchiveRequestsMock).toHaveBeenCalledWith(expect.objectContaining({
			filters: { targetType: 'object', targetId: 'OBJ-1', actionType: 'curation_apply', limit: 1 },
		}));
	});

	it('returns an empty status when the object has never been published', async () => {
		listArchiveRequestsMock.mockResolvedValue({ requests: [], nextCursor: null, filteredCount: 0 });
		const response = await GET(makeEvent());
		expect(await response.json()).toEqual({ request: null });
	});

	it('requires authentication', async () => {
		const response = await GET(makeEvent(false));
		expect(response.status).toBe(401);
		expect(listArchiveRequestsMock).not.toHaveBeenCalled();
	});
});
