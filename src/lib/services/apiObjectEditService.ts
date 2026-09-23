import {
	mapObjectArchiveSync,
	mapObjectEditPayload,
	mapReleaseLockResult,
	mapSaveDocumentCurationResult,
	mapSaveMetadataResult,
	mapSubmitObjectChangesResult,
} from '$lib/api/mappers/objectEditMapper';
import {
	objectEditPayloadSchema,
	objectArchiveSyncSchema,
	releaseLockResultSchema,
	retryObjectChangeSubmissionRequestSchema,
	saveDocumentCurationRequestSchema,
	saveDocumentCurationResultSchema,
	saveMetadataRequestSchema,
	saveMetadataResultSchema,
	submitObjectChangesRequestSchema,
	submitObjectChangesResultSchema,
} from '$lib/api/schemas/objectEdit';
import { ApiClientError, backendRequest } from '$lib/server/apiClient';
import type {
	ObjectEditService,
	ReleaseLockRequest,
	RetryObjectChangeSubmissionRequest,
	SaveDocumentCurationRequest,
	SaveMetadataRequest,
	SubmitObjectChangesRequest,
} from './objectEdit';
import { ObjectEditLockedError, ObjectEditRevisionConflictError } from './objectEdit';

const toObjectEditPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/edit`;

const toObjectMetadataPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/metadata`;

const toDocumentCurationPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/curation/document`;

const toObjectChangesSubmitPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/changes/submit`;

const toObjectChangesStatusPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/changes/status`;

const toObjectChangeSubmissionRetryPath = (objectId: string, requestId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/change-submissions/${encodeURIComponent(requestId)}/retry`;

const toEditLockPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/edit-lock`;

const extractLockDetails = (error: ApiClientError): { lockedBy: string | null; lockedUntil: string | null } => {
	const det = error.details as { locked_by?: unknown; locked_until?: unknown } | null;
	return {
		lockedBy: typeof det?.locked_by === 'string' ? det.locked_by : null,
		lockedUntil: typeof det?.locked_until === 'string' ? det.locked_until : null,
	};
};

const rethrowEditConflict = (error: unknown): never => {
	if (error instanceof ApiClientError && error.code === 'REVISION_CONFLICT') {
		const details = error.details as { latest_revision?: unknown } | null;
		throw new ObjectEditRevisionConflictError(
			typeof details?.latest_revision === 'number' ? details.latest_revision : null,
		);
	}
	if (error instanceof ApiClientError && error.status === 423) {
		const { lockedBy, lockedUntil } = extractLockDetails(error);
		throw new ObjectEditLockedError(lockedBy, lockedUntil);
	}
	throw error;
};

export const apiObjectEditService: ObjectEditService = {
	getObjectEditPayload: async ({ context, objectId }) => {
		const response = await backendRequest({
			fetchFn: context.fetchFn,
			path: toObjectEditPath(objectId),
			context: 'objectEdit.get',
			method: 'GET',
			token: context.token,
			responseSchema: objectEditPayloadSchema,
		});

		return mapObjectEditPayload(response);
	},

	getObjectArchiveSync: async ({ context, objectId }) => {
		const response = await backendRequest({
			fetchFn: context.fetchFn,
			path: toObjectChangesStatusPath(objectId),
			context: 'objectEdit.syncStatus',
			method: 'GET',
			token: context.token,
			responseSchema: objectArchiveSyncSchema,
		});
		return mapObjectArchiveSync(response);
	},

	saveObjectMetadata: async ({ context, objectId, revision, metadata, rights }: SaveMetadataRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toObjectMetadataPath(objectId),
				context: 'objectEdit.metadata',
				method: 'PATCH',
				token: context.token,
				body: {
					revision,
					metadata: {
						title: metadata.title,
						publication_date: metadata.publicationDate,
						date_precision: metadata.datePrecision,
						date_approximate: metadata.dateApproximate,
						language: metadata.language,
						tags: metadata.tags,
						people: metadata.people,
						description: metadata.description,
					},
					rights: {
						rights_note: rights.rightsNote,
						sensitivity_note: rights.sensitivityNote,
					},
				},
				requestSchema: saveMetadataRequestSchema,
				responseSchema: saveMetadataResultSchema,
			});

			return mapSaveMetadataResult(response);
		} catch (e) {
			return rethrowEditConflict(e);
		}
	},

	saveDocumentCuration: async ({ context, objectId, revision, pages }: SaveDocumentCurationRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toDocumentCurationPath(objectId),
				context: 'objectEdit.document',
				method: 'PUT',
				token: context.token,
				body: {
					revision,
					pages: pages.map((p) => ({
						page_number: p.pageNumber,
						curated_text: p.curatedText,
					})),
				},
				requestSchema: saveDocumentCurationRequestSchema,
				responseSchema: saveDocumentCurationResultSchema,
			});

			return mapSaveDocumentCurationResult(response);
		} catch (e) {
			return rethrowEditConflict(e);
		}
	},

	submitObjectChanges: async ({ context, objectId, revision, submissionNote }: SubmitObjectChangesRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toObjectChangesSubmitPath(objectId),
				context: 'objectEdit.submitChanges',
				method: 'POST',
				token: context.token,
				body: {
					revision,
					submission_note: submissionNote,
				},
				requestSchema: submitObjectChangesRequestSchema,
				responseSchema: submitObjectChangesResultSchema,
			});

			return mapSubmitObjectChangesResult(response);
		} catch (e) {
			return rethrowEditConflict(e);
		}
	},

	retryObjectChangeSubmission: async ({ context, objectId, requestId, retryReason }: RetryObjectChangeSubmissionRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toObjectChangeSubmissionRetryPath(objectId, requestId),
				context: 'objectEdit.retrySync',
				method: 'POST',
				token: context.token,
				body: {
					retry_reason: retryReason,
				},
				requestSchema: retryObjectChangeSubmissionRequestSchema,
				responseSchema: submitObjectChangesResultSchema,
			});

			return mapSubmitObjectChangesResult(response);
		} catch (e) {
			return rethrowEditConflict(e);
		}
	},

	releaseEditLock: async ({ context, objectId }: ReleaseLockRequest) => {
		const response = await backendRequest({
			fetchFn: context.fetchFn,
			path: toEditLockPath(objectId),
			context: 'objectEdit.releaseLock',
			method: 'DELETE',
			token: context.token,
			responseSchema: releaseLockResultSchema,
		});

		return mapReleaseLockResult(response);
	},
};
