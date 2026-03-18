import type { ArchiveRequestDto, ArchiveRequestsListResponseDto } from '$lib/api/schemas/archiveRequests';
import type { ArchiveRequest, ArchiveRequestsListResponse } from '$lib/services/archiveRequests';

const toArchiveRequest = (item: ArchiveRequestDto): ArchiveRequest => ({
	id: item.id,
	tenantId: item.tenant_id,
	targetType: item.target_type,
	targetId: item.target_id,
	actionType: item.action_type,
	requestedBy: item.requested_by,
	dedupeKey: item.dedupe_key,
	status: item.status,
	failureReason: item.failure_reason,
	createdAt: item.created_at,
	updatedAt: item.updated_at,
	completedAt: item.completed_at
});

export const mapArchiveRequestsList = (
	response: ArchiveRequestsListResponseDto
): ArchiveRequestsListResponse => ({
	requests: response.requests.map(toArchiveRequest),
	nextCursor: response.next_cursor,
	filteredCount: response.filtered_count
});
