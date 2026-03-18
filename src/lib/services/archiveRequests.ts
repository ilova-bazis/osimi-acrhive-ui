export type ArchiveRequestStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

export type ArchiveRequest = {
	id: string;
	tenantId: string;
	targetType: string;
	targetId: string;
	actionType: string;
	requestedBy: string;
	dedupeKey: string;
	status: ArchiveRequestStatus;
	failureReason: string | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
};

export type ArchiveRequestsFilters = {
	targetType?: 'object' | 'ingestion';
	targetId?: string;
	actionType?: 'object_resync' | 'artifact_fetch';
	activeOnly?: boolean;
	limit?: number;
	cursor?: string;
};

export type ArchiveRequestsListResponse = {
	requests: ArchiveRequest[];
	nextCursor: string | null;
	filteredCount: number;
};

export type ArchiveRequestsContext = {
	fetchFn: typeof fetch;
	token: string;
};

export type ListArchiveRequestsRequest = {
	context: ArchiveRequestsContext;
	filters: ArchiveRequestsFilters;
};

export type ArchiveRequestsService = {
	listArchiveRequests: (request: ListArchiveRequestsRequest) => Promise<ArchiveRequestsListResponse>;
};
