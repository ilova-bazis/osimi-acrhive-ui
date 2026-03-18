import { archiveRequestsListResponseSchema } from '$lib/api/schemas/archiveRequests';
import { mapArchiveRequestsList } from '$lib/api/mappers/archiveRequestsMapper';
import { backendRequest } from '$lib/server/apiClient';
import type { ArchiveRequestsFilters, ArchiveRequestsService } from './archiveRequests';

const toArchiveRequestsPath = (filters: ArchiveRequestsFilters): string => {
	const params = new URLSearchParams();

	if (filters.limit) params.set('limit', String(filters.limit));
	if (filters.cursor) params.set('cursor', filters.cursor);
	if (filters.targetType) params.set('target_type', filters.targetType);
	if (filters.targetId) params.set('target_id', filters.targetId);
	if (filters.actionType) params.set('action_type', filters.actionType);
	if (filters.activeOnly) params.set('active_only', 'true');

	return `/api/archive-requests?${params.toString()}`;
};

export const apiArchiveRequestsService: ArchiveRequestsService = {
	listArchiveRequests: async ({ context, filters }) => {
		const response = await backendRequest({
			fetchFn: context.fetchFn,
			path: toArchiveRequestsPath(filters),
			context: 'archiveRequests.list',
			method: 'GET',
			token: context.token,
			responseSchema: archiveRequestsListResponseSchema
		});

		return mapArchiveRequestsList(response);
	}
};
