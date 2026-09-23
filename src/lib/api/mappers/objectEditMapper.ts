import type {
	ObjectArchiveSyncDto,
	ObjectEditDocumentPageDto,
	ObjectEditPayloadDto,
	ReleaseLockResultDto,
	SaveDocumentCurationResultDto,
	SaveMetadataResultDto,
	SubmitObjectChangesResultDto,
} from '$lib/api/schemas/objectEdit';
import type {
	ObjectArchiveSync,
	ObjectArchiveSyncSubmission,
	ObjectEditCurationPayload,
	ObjectEditDocumentPage,
	ObjectEditPayload,
	ReleaseLockResult,
	SaveDocumentCurationResult,
	SaveMetadataResult,
	SubmitObjectChangesResult,
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
	revision: raw.revision,
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
		canSubmitChanges: raw.capabilities.can_submit_changes,
	},
	curation: mapObjectEditCurationPayload(raw.curation_payload),
});

export const mapSaveMetadataResult = (raw: SaveMetadataResultDto): SaveMetadataResult => ({
	objectId: raw.object_id,
	revision: raw.revision,
	curationState: raw.curation_state,
	updatedAt: raw.updated_at,
});

export const mapSaveDocumentCurationResult = (
	raw: SaveDocumentCurationResultDto,
): SaveDocumentCurationResult => ({
	objectId: raw.object_id,
	revision: raw.revision,
	updatedCount: raw.updated_count,
	updatedAt: raw.updated_at,
});

export const mapSubmitObjectChangesResult = (raw: SubmitObjectChangesResultDto): SubmitObjectChangesResult => ({
	objectId: raw.object_id,
	currentRevision: raw.current_revision,
	submittedRevision: raw.submitted_revision,
	submission: {
		id: raw.submission.id,
		requestId: raw.submission.request_id,
		status: raw.submission.status,
		submittedAt: raw.submission.submitted_at,
		submittedBy: raw.submission.submitted_by,
	},
});

export const mapObjectArchiveSyncSubmission = (
	raw: ObjectArchiveSyncDto['latest_submission'],
): ObjectArchiveSyncSubmission | null => {
	if (!raw) return null;
	return {
		id: raw.id,
		requestId: raw.request_id,
		submittedRevision: raw.submitted_revision,
		status: raw.status,
		submittedAt: raw.submitted_at,
		submittedBy: raw.submitted_by,
		completedAt: raw.completed_at,
		failureReason: raw.failure_reason,
	};
};

export const mapObjectArchiveSync = (raw: ObjectArchiveSyncDto): ObjectArchiveSync => ({
	objectId: raw.object_id,
	currentRevision: raw.current_revision,
	latestSubmittedRevision: raw.latest_submitted_revision,
	latestAppliedRevision: raw.latest_applied_revision,
	archiveOutOfSync: raw.archive_out_of_sync,
	activeSubmission: mapObjectArchiveSyncSubmission(raw.active_submission),
	latestSubmission: mapObjectArchiveSyncSubmission(raw.latest_submission),
});

export const mapReleaseLockResult = (raw: ReleaseLockResultDto): ReleaseLockResult => ({
	objectId: raw.object_id,
	released: raw.released,
});
