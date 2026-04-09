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
	tags: string[];
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

export type ObjectViewerMediaType = 'document' | 'image' | 'audio' | 'video';

export type ObjectViewerSourceType =
	| 'original'
	| 'access_copy'
	| 'stream'
	| 'preview'
	| 'other';

export type ObjectViewerPrimarySourceStatus =
	| 'available'
	| 'request_required'
	| 'request_pending'
	| 'restricted'
	| 'temporarily_unavailable';

export type ObjectViewerActiveRequest = {
	id: string;
	actionType: 'artifact_fetch';
	status: 'PENDING' | 'PROCESSING';
	createdAt: string;
	updatedAt: string;
};

export type ObjectViewerArtifactRef = {
	available: true;
	artifactId: string;
	contentType: string | null;
	displayName: string | null;
	metadata: Record<string, unknown>;
};

export type ObjectViewerPreviewArtifacts = {
	thumbnail: ObjectViewerArtifactRef | null;
	poster: ObjectViewerArtifactRef | null;
	ocrText: ObjectViewerArtifactRef | null;
	transcript: ObjectViewerArtifactRef | null;
	captions: ObjectViewerArtifactRef | null;
};

export type ObjectViewerPrimarySource = {
	sourceType: ObjectViewerSourceType;
	artifactKind:
		| 'original'
		| 'preview'
		| 'pdf'
		| 'ocr_text'
		| 'thumbnail'
		| 'web_version'
		| 'transcript'
		| 'other';
	variant: string | null;
	status: ObjectViewerPrimarySourceStatus;
	availableFileId: string | null;
	artifactId: string | null;
	displayName: string | null;
	contentType: string | null;
	sizeBytes: number | null;
	accessReasonCode: AccessReasonCode;
};

export type ObjectViewerDocumentPage = {
	pageNumber: number;
	label: string | null;
	imageArtifactId: string | null;
	ocrTextArtifactId: string | null;
};

export type DocumentViewerPayload = {
	kind: 'document';
	artifactId: string | null;
	contentType: string | null;
	ocrTextArtifactId: string | null;
	pageCount: number | null;
	pages?: ObjectViewerDocumentPage[];
};

export type ImageViewerPayload = {
	kind: 'image';
	artifactId: string | null;
	contentType: string | null;
	width: number | null;
	height: number | null;
};

export type AudioViewerPayload = {
	kind: 'audio';
	artifactId: string | null;
	contentType: string | null;
	transcriptArtifactId: string | null;
	durationSeconds: number | null;
};

export type VideoViewerPayload = {
	kind: 'video';
	artifactId: string | null;
	contentType: string | null;
	posterArtifactId: string | null;
	transcriptArtifactId: string | null;
	captionsArtifactId: string | null;
	durationSeconds: number | null;
};

export type ObjectViewerPayload =
	| DocumentViewerPayload
	| ImageViewerPayload
	| AudioViewerPayload
	| VideoViewerPayload;

export type ObjectViewer = {
	mediaType: ObjectViewerMediaType;
	primarySource: ObjectViewerPrimarySource;
	activeRequest: ObjectViewerActiveRequest | null;
	previewArtifacts: ObjectViewerPreviewArtifacts;
	viewerPayload: ObjectViewerPayload;
};

export type ObjectDetailResponse = {
	detail: ObjectDetail;
	viewer: ObjectViewer | null;
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
	| 'PENDING'
	| 'PROCESSING'
	| 'COMPLETED'
	| 'FAILED'
	| 'CANCELED';

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

export type CreateObjectDownloadRequest = {
	context: ObjectsRequestContext;
	objectId: string;
	availableFileId: string;
};

export type ObjectResyncRequestStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';

export type ObjectResyncRequest = {
	id: string;
	tenantId: string;
	targetType: string;
	targetId: string;
	actionType: string;
	actionPayload: Record<string, unknown>;
	requestedBy: string;
	dedupeKey: string;
	status: ObjectResyncRequestStatus;
	failureReason: string | null;
	failureDetails: unknown | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
};

export type CreateObjectResyncResult = {
	status: 'queued';
	objectId: string;
	request: ObjectResyncRequest;
};

export type RequestResyncRequest = {
	context: ObjectsRequestContext;
	objectId: string;
};

export type ObjectsService = {
	listObjects: (request: ObjectsListRequest) => Promise<ObjectsListResponse>;
	listRecent: (request: ObjectsRecentRequest) => Promise<ObjectRow[]>;
	getObjectDetail: (request: ObjectDetailRequest) => Promise<ObjectDetailResponse>;
	listObjectArtifacts: (request: ObjectArtifactsRequest) => Promise<ObjectArtifact[]>;
	listObjectAvailableFiles: (request: ObjectAvailableFilesRequest) => Promise<ObjectAvailableFile[]>;
	createObjectDownloadRequest: (
		request: CreateObjectDownloadRequest
	) => Promise<CreateObjectDownloadRequestResult>;
	requestResync: (request: RequestResyncRequest) => Promise<CreateObjectResyncResult>;
};
