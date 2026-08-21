import {
	mapObjectEditPayload,
	mapReleaseLockResult,
	mapSaveDocumentCurationResult,
	mapSaveMetadataResult,
	mapSubmitCurationResult,
} from '$lib/api/mappers/objectEditMapper';
import {
	objectEditPayloadSchema,
	objectCurationPublicationSchema,
	releaseLockResultSchema,
	saveDocumentCurationRequestSchema,
	saveDocumentCurationResultSchema,
	saveMetadataRequestSchema,
	saveMetadataResultSchema,
	submitCurationRequestSchema,
	submitCurationResultSchema,
} from '$lib/api/schemas/objectEdit';
import { ApiClientError, backendRequest } from '$lib/server/apiClient';
import type {
	ObjectEditService,
	ReleaseLockRequest,
	SaveDocumentCurationRequest,
	SaveMetadataRequest,
	SubmitCurationRequest,
} from './objectEdit';
import { ObjectEditLockedError, ObjectEditRevisionConflictError } from './objectEdit';

const toObjectEditPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/edit`;

const toObjectMetadataPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/metadata`;

const toDocumentCurationPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/curation/document`;

const toCurationSubmitPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/curation/submit`;

const toCurationPublicationPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/curation-publication`;

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

	getCurationPublication: async ({ context, objectId }) => {
		const response = await backendRequest({
			fetchFn: context.fetchFn,
			path: toCurationPublicationPath(objectId),
			context: 'objectEdit.publication',
			method: 'GET',
			token: context.token,
			responseSchema: objectCurationPublicationSchema,
		});
		return {
			objectId: response.object_id,
			request: response.request
				? {
					id: response.request.id,
					status: response.request.status,
					failureReason: response.request.failure_reason,
					publicationRevision: response.request.publication_revision,
					targetVersion: response.request.target_version,
					createdAt: response.request.created_at,
					updatedAt: response.request.updated_at,
					completedAt: response.request.completed_at,
				}
				: null,
		};
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

	submitObjectCuration: async ({ context, objectId, revision, reviewNote }: SubmitCurationRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toCurationSubmitPath(objectId),
				context: 'objectEdit.submit',
				method: 'POST',
				token: context.token,
				body: {
					revision,
					review_note: reviewNote,
				},
				requestSchema: submitCurationRequestSchema,
				responseSchema: submitCurationResultSchema,
			});

			return mapSubmitCurationResult(response);
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
