import { beforeEach, describe, expect, it, vi } from 'vitest';

const { backendRequestMock } = vi.hoisted(() => ({
	backendRequestMock: vi.fn(),
}));

vi.mock('$lib/server/apiClient', () => ({
	backendRequest: backendRequestMock,
}));

vi.mock('$env/dynamic/private', () => ({
	env: {},
}));

import { apiObjectsService } from './apiObjectsService';
import { createObjectDownloadRequestRequestSchema } from '$lib/api/schemas/objects';

const context = { fetchFn: vi.fn() as never, token: 'token-1' };

describe('apiObjectsService', () => {
	beforeEach(() => {
		backendRequestMock.mockReset();
	});

	it('maps create download request body to backend shape', async () => {
		backendRequestMock.mockResolvedValue({
			status: 'queued',
			object_id: 'OBJ-1',
			request: {
				id: '11111111-1111-4111-8111-111111111111',
				available_file_id: '22222222-2222-4222-8222-222222222222',
				requested_by: 'u1',
				artifact_kind: 'original',
				variant: null,
				status: 'PENDING',
				failure_reason: null,
				created_at: '2026-05-24T01:00:00.000Z',
				updated_at: '2026-05-24T01:00:00.000Z',
				completed_at: null,
			},
		});

		await apiObjectsService.createObjectDownloadRequest({
			context,
			objectId: 'OBJ-1',
			availableFileId: '22222222-2222-4222-8222-222222222222',
		});

		expect(backendRequestMock).toHaveBeenCalledWith(
				expect.objectContaining({
					path: '/api/objects/OBJ-1/download-requests',
					method: 'POST',
					body: { available_file_id: '22222222-2222-4222-8222-222222222222' },
					requestSchema: createObjectDownloadRequestRequestSchema,
				}),
			);
	});

	it('maps resync requests to backend path', async () => {
		backendRequestMock.mockResolvedValue({
			status: 'queued',
			object_id: 'OBJ-1',
			request: {
				id: 'req-1',
				tenant_id: 'tenant-1',
				target_type: 'object',
				target_id: 'OBJ-1',
				action_type: 'object_resync',
				action_payload: {},
				requested_by: 'u1',
				dedupe_key: 'object-resync:OBJ-1',
				status: 'PENDING',
				failure_reason: null,
				created_at: '2026-05-24T01:00:00.000Z',
				updated_at: '2026-05-24T01:00:00.000Z',
				completed_at: null,
			},
		});

		await apiObjectsService.requestResync({ context, objectId: 'OBJ-1' });

		expect(backendRequestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				path: '/api/objects/OBJ-1/resync',
				method: 'POST',
			}),
		);
	});
});
