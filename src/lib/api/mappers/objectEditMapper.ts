import type {
	ObjectEditDocumentPageDto,
	ObjectEditPayloadDto,
	ReleaseLockResultDto,
	SaveDocumentCurationResultDto,
	SaveMetadataResultDto,
	SubmitCurationResultDto,
} from '$lib/api/schemas/objectEdit';
import type {
	ObjectEditCurationPayload,
	ObjectEditDocumentPage,
	ObjectEditPayload,
	ReleaseLockResult,
	SaveDocumentCurationResult,
	SaveMetadataResult,
	SubmitCurationResult,
} from '$lib/services/objectEdit';

export const mapObjectEditDocumentPage = (raw: ObjectEditDocumentPageDto): ObjectEditDocumentPage => ({
	pageNumber: raw.page_number,
	label: raw.label,
	machineText: raw.machine_text,
	curatedText: raw.curated_text ?? '',
	status: raw.status,
});

const mapObjectEditCurationPayload = (
	raw: ObjectEditPayloadDto['curation_payload'],
): ObjectEditCurationPayload => {
	if (raw.kind === 'document') {
		return {
			kind: 'document',
			machineOcrArtifactId: raw.machine_ocr_artifact_id,
			pageCount: raw.page_count,
			pages: raw.pages.map(mapObjectEditDocumentPage),
		};
	}
	return { kind: raw.kind };
};

export const mapObjectEditPayload = (raw: ObjectEditPayloadDto): ObjectEditPayload => ({
	objectId: raw.object_id,
	mediaType: raw.media_type,
	lock: {
		locked: raw.lock.locked,
		lockedBy: raw.lock.locked_by,
		lockedUntil: raw.lock.locked_until,
	},
	curationState: raw.curation_state,
	draft: raw.draft
		? { updatedAt: raw.draft.updated_at, updatedBy: raw.draft.updated_by }
		: null,
	metadata: {
		title: raw.metadata.title,
		publicationDate: raw.metadata.publication_date,
		datePrecision: raw.metadata.date_precision,
		dateApproximate: raw.metadata.date_approximate,
		language: raw.metadata.language,
		tags: raw.metadata.tags,
		people: raw.metadata.people,
		description: raw.metadata.description,
	},
	rights: {
		accessLevel: raw.rights.access_level,
		rightsNote: raw.rights.rights_note,
		sensitivityNote: raw.rights.sensitivity_note,
	},
	capabilities: {
		canEditMetadata: raw.capabilities.can_edit_metadata,
		canCurateText: raw.capabilities.can_curate_text,
		canSubmitReview: raw.capabilities.can_submit_review,
	},
	curation: mapObjectEditCurationPayload(raw.curation_payload),
});

export const mapSaveMetadataResult = (raw: SaveMetadataResultDto): SaveMetadataResult => ({
	objectId: raw.object_id,
	curationState: raw.curation_state,
	updatedAt: raw.updated_at,
});

export const mapSaveDocumentCurationResult = (
	raw: SaveDocumentCurationResultDto,
): SaveDocumentCurationResult => ({
	objectId: raw.object_id,
	updatedCount: raw.updated_count,
	updatedAt: raw.updated_at,
});

export const mapSubmitCurationResult = (raw: SubmitCurationResultDto): SubmitCurationResult => ({
	objectId: raw.object_id,
	curationState: raw.curation_state,
	submittedAt: raw.submitted_at,
	submittedBy: raw.submitted_by,
	requestId: raw.request.id,
	requestStatus: raw.request.status,
});

export const mapReleaseLockResult = (raw: ReleaseLockResultDto): ReleaseLockResult => ({
	objectId: raw.object_id,
	released: raw.released,
});
