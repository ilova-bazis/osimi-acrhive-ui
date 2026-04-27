import {
	mapObjectEditPayload,
	mapReleaseLockResult,
	mapSaveDocumentCurationResult,
	mapSaveMetadataResult,
	mapSubmitCurationResult,
} from '$lib/api/mappers/objectEditMapper';
import {
	objectEditPayloadSchema,
	releaseLockResultSchema,
	saveDocumentCurationResultSchema,
	saveMetadataResultSchema,
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
import { ObjectEditLockedError } from './objectEdit';

const toObjectEditPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/edit`;

const toObjectMetadataPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/metadata`;

const toDocumentCurationPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/curation/document`;

const toCurationSubmitPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/curation/submit`;

const toEditLockPath = (objectId: string) =>
	`/api/objects/${encodeURIComponent(objectId)}/edit-lock`;

const extractLockDetails = (error: ApiClientError): { lockedBy: string | null; lockedUntil: string | null } => {
	const det = error.details as { locked_by?: unknown; locked_until?: unknown } | null;
	return {
		lockedBy: typeof det?.locked_by === 'string' ? det.locked_by : null,
		lockedUntil: typeof det?.locked_until === 'string' ? det.locked_until : null,
	};
};

const rethrowLocked = (error: unknown): never => {
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

	saveObjectMetadata: async ({ context, objectId, metadata, rights }: SaveMetadataRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toObjectMetadataPath(objectId),
				context: 'objectEdit.metadata',
				method: 'PATCH',
				token: context.token,
				body: {
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
				responseSchema: saveMetadataResultSchema,
			});

			return mapSaveMetadataResult(response);
		} catch (e) {
			return rethrowLocked(e);
		}
	},

	saveDocumentCuration: async ({ context, objectId, pages }: SaveDocumentCurationRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toDocumentCurationPath(objectId),
				context: 'objectEdit.document',
				method: 'PUT',
				token: context.token,
				body: {
					pages: pages.map((p) => ({
						page_number: p.pageNumber,
						curated_text: p.curatedText,
					})),
				},
				responseSchema: saveDocumentCurationResultSchema,
			});

			return mapSaveDocumentCurationResult(response);
		} catch (e) {
			return rethrowLocked(e);
		}
	},

	submitObjectCuration: async ({ context, objectId, reviewNote }: SubmitCurationRequest) => {
		try {
			const response = await backendRequest({
				fetchFn: context.fetchFn,
				path: toCurationSubmitPath(objectId),
				context: 'objectEdit.submit',
				method: 'POST',
				token: context.token,
				body: {
					review_note: reviewNote,
				},
				responseSchema: submitCurationResultSchema,
			});

			return mapSubmitCurationResult(response);
		} catch (e) {
			return rethrowLocked(e);
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
