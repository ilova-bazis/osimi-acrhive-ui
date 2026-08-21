import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCurationPublicationMock } = vi.hoisted(() => ({
	getCurationPublicationMock: vi.fn(),
}));

vi.mock('$lib/services', () => ({
	objectEditService: { getCurationPublication: getCurationPublicationMock },
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
	beforeEach(() => getCurationPublicationMock.mockReset());

	it('returns the latest curated OCR publication request', async () => {
		getCurationPublicationMock.mockResolvedValue({
			objectId: 'OBJ-1',
			request: {
				id: 'req-1', status: 'FAILED', failureReason: 'Archive unavailable',
				publicationRevision: 5, targetVersion: '20260804',
				createdAt: '2026-08-04T12:00:00.000Z', updatedAt: '2026-08-04T12:01:00.000Z',
				completedAt: '2026-08-04T12:01:00.000Z',
			},
		});

		const response = await GET(makeEvent());

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(await response.json()).toEqual({
			request: {
				id: 'req-1', status: 'FAILED', failureReason: 'Archive unavailable',
				publicationRevision: 5, targetVersion: '20260804',
				createdAt: '2026-08-04T12:00:00.000Z', updatedAt: '2026-08-04T12:01:00.000Z',
				completedAt: '2026-08-04T12:01:00.000Z',
			},
		});
		expect(getCurationPublicationMock).toHaveBeenCalledWith(expect.objectContaining({
			objectId: 'OBJ-1',
		}));
	});

	it('returns an empty status when the object has never been published', async () => {
		getCurationPublicationMock.mockResolvedValue({ objectId: 'OBJ-1', request: null });
		const response = await GET(makeEvent());
		expect(await response.json()).toEqual({ request: null });
	});

	it('requires authentication', async () => {
		const response = await GET(makeEvent(false));
		expect(response.status).toBe(401);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(getCurationPublicationMock).not.toHaveBeenCalled();
	});
});
