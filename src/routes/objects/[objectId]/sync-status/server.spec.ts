import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getObjectArchiveSyncMock } = vi.hoisted(() => ({
	getObjectArchiveSyncMock: vi.fn(),
}));

vi.mock('$lib/services', () => ({
	objectEditService: { getObjectArchiveSync: getObjectArchiveSyncMock },
}));

import { GET } from './+server';

const session = { id: 'u1', username: 'test', tenantId: null, role: 'archiver' };
const makeEvent = (authenticated = true) => ({
	params: { objectId: 'OBJ-1' },
	locals: { session: authenticated ? session : null },
	cookies: { get: () => authenticated ? 'token-1' : undefined, delete: vi.fn() },
	fetch: vi.fn(),
}) as never;

describe('/objects/[objectId]/sync-status +server', () => {
	beforeEach(() => getObjectArchiveSyncMock.mockReset());

	it('returns the latest archive synchronization status', async () => {
		getObjectArchiveSyncMock.mockResolvedValue({
			objectId: 'OBJ-1',
			currentRevision: 6,
			latestSubmittedRevision: 5,
			latestAppliedRevision: 5,
			archiveOutOfSync: true,
			activeSubmission: null,
			latestSubmission: {
				id: 'sub-1',
				requestId: 'req-1',
				submittedRevision: 5,
				status: 'COMPLETED',
				submittedAt: '2026-08-04T12:00:00.000Z',
				submittedBy: 'u1',
				completedAt: '2026-08-04T12:01:00.000Z',
				failureReason: null,
			},
		});

		const response = await GET(makeEvent());

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(await response.json()).toEqual({
			objectId: 'OBJ-1',
			currentRevision: 6,
			latestSubmittedRevision: 5,
			latestAppliedRevision: 5,
			archiveOutOfSync: true,
			activeSubmission: null,
			latestSubmission: {
				id: 'sub-1',
				requestId: 'req-1',
				submittedRevision: 5,
				status: 'COMPLETED',
				submittedAt: '2026-08-04T12:00:00.000Z',
				submittedBy: 'u1',
				completedAt: '2026-08-04T12:01:00.000Z',
				failureReason: null,
			},
		});
		expect(getObjectArchiveSyncMock).toHaveBeenCalledWith(expect.objectContaining({
			objectId: 'OBJ-1',
		}));
	});

	it('returns an empty status when the object has never been submitted', async () => {
		getObjectArchiveSyncMock.mockResolvedValue({
			objectId: 'OBJ-1',
			currentRevision: 2,
			latestSubmittedRevision: null,
			latestAppliedRevision: null,
			archiveOutOfSync: true,
			activeSubmission: null,
			latestSubmission: null,
		});
		const response = await GET(makeEvent());
		expect(await response.json()).toEqual({
			objectId: 'OBJ-1',
			currentRevision: 2,
			latestSubmittedRevision: null,
			latestAppliedRevision: null,
			archiveOutOfSync: true,
			activeSubmission: null,
			latestSubmission: null,
		});
	});

	it('requires authentication', async () => {
		const response = await GET(makeEvent(false));
		expect(response.status).toBe(401);
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(getObjectArchiveSyncMock).not.toHaveBeenCalled();
	});
});
