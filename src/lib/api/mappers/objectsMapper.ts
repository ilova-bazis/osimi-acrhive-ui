import type {
	ObjectArtifactDto,
	ObjectArtifactsResponseDto,
	ObjectAvailableFileDto,
	ObjectAvailableFilesResponseDto,
	ObjectDetailItemDto,
	ObjectDetailResponseDto,
	ObjectDownloadRequestDto,
	ObjectDownloadRequestsResponseDto,
	ObjectListItemDto,
	ObjectsListResponseDto,
	CreateObjectDownloadRequestResponseDto
} from '$lib/api/schemas/objects';
import type {
	CreateObjectDownloadRequestResult,
	ObjectArtifact,
	ObjectAvailableFile,
	ObjectDetail,
	ObjectDownloadRequest,
	ObjectIndicators,
	ObjectRow,
	ObjectsListResponse
} from '$lib/services/objects';

const toBooleanFlag = (value: 0 | 1 | undefined): boolean => value === 1;

const toIndicators = (item: ObjectListItemDto): ObjectIndicators => ({
	accessPdf: toBooleanFlag(item.has_access_pdf),
	ocr: toBooleanFlag(item.has_ocr),
	index: toBooleanFlag(item.has_index)
});

const toObjectRow = (item: ObjectListItemDto): ObjectRow => ({
	id: item.id,
	objectId: item.object_id,
	thumbnailArtifactId: item.thumbnail_artifact_id,
	title: item.title,
	processingState: item.processing_state,
	curationState: item.curation_state,
	availabilityState: item.availability_state,
	accessLevel: item.access_level,
	type: item.type,
	language: item.language ?? null,
	tenantId: item.tenant_id,
	sourceIngestionId: item.source_ingestion_id,
	sourceBatchLabel: item.source_batch_label,
	metadata: item.metadata,
	createdAt: item.created_at,
	updatedAt: item.updated_at,
	embargoUntil: item.embargo_until,
	embargoKind: item.embargo_kind,
	embargoCurationState: item.embargo_curation_state,
	rightsNote: item.rights_note,
	sensitivityNote: item.sensitivity_note,
	canDownload: item.can_download,
	accessReasonCode: item.access_reason_code,
	indicators: toIndicators(item)
});

const toObjectDetail = (item: ObjectDetailItemDto): ObjectDetail => ({
	...toObjectRow(item),
	ingestManifest: item.ingest_manifest ?? null,
	isAuthorized: item.is_authorized ?? true,
	isDeliverable: item.is_deliverable ?? item.can_download
});

const toObjectArtifact = (item: ObjectArtifactDto): ObjectArtifact => ({
	id: item.id,
	kind: item.kind,
	variant: item.variant ?? null,
	storageKey: item.storage_key,
	contentType: item.content_type,
	sizeBytes: item.size_bytes,
	createdAt: item.created_at
});

const toObjectAvailableFile = (item: ObjectAvailableFileDto): ObjectAvailableFile => ({
	id: item.id,
	archiveFileKey: item.archive_file_key,
	artifactKind: item.artifact_kind,
	variant: item.variant,
	displayName: item.display_name,
	contentType: item.content_type,
	sizeBytes: item.size_bytes,
	checksumSha256: item.checksum_sha256,
	metadata: item.metadata,
	isAvailable: item.is_available,
	syncedAt: item.synced_at
});

const toObjectDownloadRequest = (item: ObjectDownloadRequestDto): ObjectDownloadRequest => ({
	id: item.id,
	availableFileId: item.available_file_id,
	requestedBy: item.requested_by,
	artifactKind: item.artifact_kind,
	variant: item.variant,
	status: item.status,
	failureReason: item.failure_reason,
	createdAt: item.created_at,
	updatedAt: item.updated_at,
	completedAt: item.completed_at
});

export const mapObjectsList = (params: {
	response: ObjectsListResponseDto;
	limit: number;
}): ObjectsListResponse => {
	const rows = params.response.objects.map(toObjectRow);

	return {
		rows,
		limit: params.limit,
		totalCount: params.response.total_count,
		filteredCount: params.response.filtered_count,
		nextCursor: params.response.next_cursor
	};
};

export const mapObjectDetail = (response: ObjectDetailResponseDto): ObjectDetail =>
	toObjectDetail(response.object);

export const mapObjectArtifacts = (response: ObjectArtifactsResponseDto): ObjectArtifact[] =>
	response.artifacts.map(toObjectArtifact);

export const mapObjectAvailableFiles = (
	response: ObjectAvailableFilesResponseDto
): ObjectAvailableFile[] => response.available_files.map(toObjectAvailableFile);

export const mapObjectDownloadRequests = (
	response: ObjectDownloadRequestsResponseDto
): ObjectDownloadRequest[] => response.requests.map(toObjectDownloadRequest);

export const mapCreateObjectDownloadRequestResponse = (
	response: CreateObjectDownloadRequestResponseDto
): CreateObjectDownloadRequestResult => ({
	status: response.status,
	objectId: response.object_id,
	artifact: response.artifact ? toObjectArtifact(response.artifact) : null,
	request: response.request ? toObjectDownloadRequest(response.request) : null
});
