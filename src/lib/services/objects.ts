export type ProcessingState =
	| 'queued'
	| 'ingesting'
	| 'ingested'
	| 'derivatives_running'
	| 'derivatives_done'
	| 'ocr_running'
	| 'ocr_done'
	| 'index_running'
	| 'index_done'
	| 'processing_failed'
	| 'processing_skipped';

export type CurationState =
	| 'needs_review'
	| 'review_in_progress'
	| 'reviewed'
	| 'curation_failed';

export type AvailabilityState =
	| 'AVAILABLE'
	| 'ARCHIVED'
	| 'RESTORE_PENDING'
	| 'RESTORING'
	| 'UNAVAILABLE';

export type AccessLevel = 'private' | 'family' | 'public';

export type EmbargoKind = 'none' | 'timed' | 'curation_state';

export type AccessReasonCode =
	| 'OK'
	| 'FORBIDDEN_POLICY'
	| 'EMBARGO_ACTIVE'
	| 'RESTORE_REQUIRED'
	| 'RESTORE_IN_PROGRESS'
	| 'TEMP_UNAVAILABLE';

export type ObjectIndicators = {
	accessPdf: boolean;
	ocr: boolean;
	index: boolean;
};

export type ObjectRow = {
	id: string;
	objectId: string;
	thumbnailArtifactId: string | null;
	title: string | null;
	type: string;
	processingState: ProcessingState;
	curationState: CurationState;
	availabilityState: AvailabilityState;
	accessLevel: AccessLevel;
	language: string | null;
	tenantId: string;
	sourceIngestionId: string | null;
	sourceBatchLabel: string | null;
	metadata: Record<string, unknown>;
	embargoUntil: string | null;
	embargoKind: EmbargoKind;
	embargoCurationState: CurationState | null;
	rightsNote: string | null;
	sensitivityNote: string | null;
	canDownload: boolean;
	accessReasonCode: AccessReasonCode;
	createdAt: string;
	updatedAt: string;
	indicators: ObjectIndicators;
};

export type ObjectDetail = ObjectRow & {
	ingestManifest: Record<string, unknown> | null;
	isAuthorized: boolean;
	isDeliverable: boolean;
};

export type ObjectArtifact = {
	id: string;
	kind: string;
	variant: string | null;
	storageKey: string;
	contentType: string;
	sizeBytes: number;
	createdAt: string;
};

export type ObjectAvailableFile = {
	id: string;
	archiveFileKey: string;
	artifactKind: string;
	variant: string | null;
	displayName: string;
	contentType: string | null;
	sizeBytes: number | null;
	checksumSha256: string | null;
	metadata: Record<string, unknown>;
	isAvailable: boolean;
	syncedAt: string;
};

export type ObjectDownloadRequestStatus =
	| 'QUEUED'
	| 'IN_PROGRESS'
	| 'COMPLETED'
	| 'FAILED'
	| 'CANCELED'
	| string;

export type ObjectDownloadRequest = {
	id: string;
	availableFileId: string;
	requestedBy: string;
	artifactKind: string;
	variant: string | null;
	status: ObjectDownloadRequestStatus;
	failureReason: string | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
};

export type CreateObjectDownloadRequestResult = {
	status: 'available' | 'queued';
	objectId: string;
	artifact: ObjectArtifact | null;
	request: ObjectDownloadRequest | null;
};

export type ObjectsListResponse = {
	rows: ObjectRow[];
	limit: number;
	totalCount: number;
	filteredCount: number;
	nextCursor?: string | null;
};

export type ObjectsSort =
	| 'created_at_desc'
	| 'created_at_asc'
	| 'updated_at_desc'
	| 'updated_at_asc'
	| 'title_asc'
	| 'title_desc';

export type ObjectsFilters = {
	q?: string;
	availabilityState?: AvailabilityState;
	accessLevel?: AccessLevel;
	language?: string;
	batchLabel?: string;
	type?: string;
	from?: string;
	to?: string;
	tag?: string;
	cursor?: string;
	limit?: number;
	sort?: ObjectsSort;
};

export type ObjectsRequestContext = {
	fetchFn: typeof fetch;
	token: string;
};

export type ObjectsListRequest = {
	filters: ObjectsFilters;
	context: ObjectsRequestContext;
};

export type ObjectsRecentRequest = {
	context: ObjectsRequestContext;
	limit?: number;
};

export type ObjectDetailRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type ObjectArtifactsRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type ObjectAvailableFilesRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type ObjectDownloadRequestsRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type CreateObjectDownloadRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	availableFileId: string;
};

export type ObjectsService = {
	listObjects: (request: ObjectsListRequest) => Promise<ObjectsListResponse>;
	listRecent: (request: ObjectsRecentRequest) => Promise<ObjectRow[]>;
	getObjectDetail: (request: ObjectDetailRequest) => Promise<ObjectDetail>;
	listObjectArtifacts: (request: ObjectArtifactsRequest) => Promise<ObjectArtifact[]>;
	listObjectAvailableFiles: (request: ObjectAvailableFilesRequest) => Promise<ObjectAvailableFile[]>;
	listObjectDownloadRequests: (
		request: ObjectDownloadRequestsRequest
	) => Promise<ObjectDownloadRequest[]>;
	createObjectDownloadRequest: (
		request: CreateObjectDownloadRequest
	) => Promise<CreateObjectDownloadRequestResult>;
};
