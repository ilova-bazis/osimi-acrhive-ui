import type { ObjectListItemDto, ObjectsListResponseDto } from '$lib/api/schemas/objects';
import type { ObjectIndicators, ObjectRow, ObjectsListResponse } from '$lib/services/objects';

const toBooleanFlag = (value: 0 | 1 | undefined): boolean => value === 1;

const toIndicators = (item: ObjectListItemDto): ObjectIndicators => ({
	accessPdf: toBooleanFlag(item.has_access_pdf),
	ocr: toBooleanFlag(item.has_ocr),
	index: toBooleanFlag(item.has_index)
});

const toObjectRow = (item: ObjectListItemDto): ObjectRow => ({
	id: item.id,
	objectId: item.object_id,
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
