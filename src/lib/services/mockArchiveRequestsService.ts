import type { ArchiveRequestsService } from './archiveRequests';

export const mockArchiveRequestsService: ArchiveRequestsService = {
	listArchiveRequests: async () => ({
		requests: [
			{
				id: 'req-001',
				tenantId: 'tenant-1',
				targetType: 'object',
				targetId: 'OBJ-20260202-000312',
				actionType: 'object_resync',
				requestedBy: 'user-1',
				dedupeKey: 'object_resync:OBJ-20260202-000312',
				status: 'PENDING',
				failureReason: null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				completedAt: null
			},
			{
				id: 'req-002',
				tenantId: 'tenant-1',
				targetType: 'object',
				targetId: 'OBJ-20260202-000312',
				actionType: 'artifact_fetch',
				requestedBy: 'user-1',
				dedupeKey: 'artifact_fetch:OBJ-20260202-000312:original',
				status: 'PROCESSING',
				failureReason: null,
				createdAt: new Date(Date.now() - 60000).toISOString(),
				updatedAt: new Date().toISOString(),
				completedAt: null
			}
		],
		nextCursor: null,
		filteredCount: 2
	})
};
