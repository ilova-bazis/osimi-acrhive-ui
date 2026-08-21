import { z } from 'zod';
import { error, fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';

import { objectEditService } from '$lib/services';
import type { ObjectEditMetadata, ObjectEditPayload } from '$lib/services/objectEdit';
import { ObjectEditLockedError, ObjectEditRevisionConflictError } from '$lib/services/objectEdit';
import type {
	ObjectEditErrorCode,
	ObjectEditField,
	ObjectEditFieldErrorCode,
	ObjectEditFieldErrors
} from '$lib/services/objectEditErrors';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { ApiClientError, isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';

const fieldErrorCode = (field: ObjectEditField): ObjectEditFieldErrorCode => {
	if (field === 'title') return 'titleRequired';
	if (field === 'publicationDate') return 'publicationDateInvalid';
	if (field === 'tags') return 'tagsBlank';
	if (field === 'people') return 'peopleBlank';
	if (field === 'pages') return 'pagesInvalid';
	return 'invalidValue';
};

const toField = (path: ReadonlyArray<string | number>): ObjectEditField | null => {
	const joined = path.join('.');
	if (joined === 'title' || joined === 'metadata.title') return 'title';
	if (joined === 'publicationDate' || joined === 'metadata.publication_date') return 'publicationDate';
	if (joined === 'tags' || joined.startsWith('tags.') || joined === 'metadata.tags' || joined.startsWith('metadata.tags.')) return 'tags';
	if (joined === 'people' || joined.startsWith('people.') || joined === 'metadata.people' || joined.startsWith('metadata.people.')) return 'people';
	if (joined === 'description' || joined === 'metadata.description') return 'description';
	if (joined === 'rightsNote' || joined === 'rights.rights_note') return 'rightsNote';
	if (joined === 'sensitivityNote' || joined === 'rights.sensitivity_note') return 'sensitivityNote';
	if (
		joined === 'pages' ||
		joined.startsWith('pages.') ||
		joined.endsWith('.pageNumber') ||
		joined.endsWith('.curatedText')
	) {
		return 'pages';
	}
	return null;
};

const toZodFieldErrors = (error: z.ZodError): ObjectEditFieldErrors => {
	const fieldErrors: ObjectEditFieldErrors = {};
	for (const issue of error.issues) {
		const field = toField(issue.path.map((segment) => (typeof segment === 'symbol' ? String(segment) : segment)));
		if (field && !fieldErrors[field]) fieldErrors[field] = fieldErrorCode(field);
	}
	return fieldErrors;
};

const toBackendFieldErrors = (details: unknown): ObjectEditFieldErrors => {
	if (!Array.isArray(details)) return {};

	const fieldErrors: ObjectEditFieldErrors = {};
	for (const detail of details) {
		if (!detail || typeof detail !== 'object' || !('path' in detail) || typeof detail.path !== 'string') continue;
		const field = toField(detail.path.replaceAll('[', '.').replaceAll(']', '').split('.'));
		if (field && !fieldErrors[field]) fieldErrors[field] = fieldErrorCode(field);
	}
	return fieldErrors;
};

const objectEditMetadataSchema = z
	.object({
		title: z.string().trim().min(1),
		publicationDate: z.string(),
		datePrecision: z.enum(['none', 'year', 'month', 'day']),
		dateApproximate: z.boolean(),
		language: z.string().nullable(),
		tags: z.array(z.string().trim().min(1)),
		people: z.array(z.string().trim().min(1)),
		description: z.string().nullable(),
	})
	.refine(
		(metadata) => {
			if (metadata.datePrecision === 'none') return metadata.publicationDate === '';
			if (metadata.datePrecision === 'year') return /^\d{4}$/.test(metadata.publicationDate);
			if (metadata.datePrecision === 'month') return /^\d{4}-\d{2}$/.test(metadata.publicationDate);
			return /^\d{4}-\d{2}-\d{2}$/.test(metadata.publicationDate);
		},
		{ message: 'Publication date does not match selected precision.', path: ['publicationDate'] },
	);

const objectEditRightsSchema = z.object({
	rightsNote: z.string().nullable(),
	sensitivityNote: z.string().nullable(),
});

const objectEditPagesSchema = z
	.array(
		z.object({
			pageNumber: z.number().int().positive(),
			curatedText: z.string(),
		}),
	)
	.superRefine((pages, context) => {
		const pageNumbers = new Set<number>();
		for (const [index, page] of pages.entries()) {
			if (pageNumbers.has(page.pageNumber)) {
				context.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'pageNumber'] });
			}
			pageNumbers.add(page.pageNumber);
		}
	});

const parseOptionalJsonFormField = (formData: FormData, name: string): unknown | undefined => {
	const value = formData.get(name);
	if (value === null) return undefined;
	if (typeof value !== 'string') throw new Error(`Invalid ${name}`);
	return JSON.parse(value);
};

type SaveDraftPayload = {
	revision: number;
	metadata: ObjectEditMetadata | null;
	rights: { rightsNote: string | null; sensitivityNote: string | null } | null;
	pages: Array<{ pageNumber: number; curatedText: string }> | null;
};

type SaveDraftPayloadParseResult =
	| { payload: SaveDraftPayload; fieldErrors: ObjectEditFieldErrors }
	| { payload: null; fieldErrors: ObjectEditFieldErrors };

const parseSaveDraftPayload = (formData: FormData): SaveDraftPayloadParseResult => {
	try {
		const revision = z.coerce.number().int().min(0).parse(formData.get('revision'));
		const rawMetadata = parseOptionalJsonFormField(formData, 'metadata');
		const rawRights = parseOptionalJsonFormField(formData, 'rights');
		if ((rawMetadata === undefined) !== (rawRights === undefined)) return { payload: null, fieldErrors: {} };
		const metadata = rawMetadata === undefined ? null : objectEditMetadataSchema.parse(rawMetadata);
		const rights = rawRights === undefined ? null : objectEditRightsSchema.parse(rawRights);
		const rawPages = parseOptionalJsonFormField(formData, 'pages');
		const pages = rawPages === undefined ? null : objectEditPagesSchema.parse(rawPages);
		if (!metadata && !pages?.length) return { payload: null, fieldErrors: {} };
		return { payload: { revision, metadata, rights, pages }, fieldErrors: {} };
	} catch (cause) {
		return {
			payload: null,
			fieldErrors: cause instanceof z.ZodError ? toZodFieldErrors(cause) : {},
		};
	}
};

const canSaveDraft = (
	editPayload: ObjectEditPayload,
	payload: SaveDraftPayload,
): boolean => {
	const hasPageChanges = Boolean(payload.pages?.length);
	if (hasPageChanges && !editPayload.capabilities.canCurateText) return false;
	if (payload.metadata && !editPayload.capabilities.canEditMetadata) return false;
	return Boolean(payload.metadata || hasPageChanges);
};

const toRecovery = (
	kind: 'conflict' | 'partial',
	editPayload: ObjectEditPayload,
	metadataSaved = false,
): {
	id: string;
	kind: 'conflict' | 'partial';
	savedDomains: Array<'metadata'>;
	editPayload: ObjectEditPayload;
} => ({
	id: crypto.randomUUID(),
	kind,
	savedDomains: metadataSaved ? ['metadata'] : [],
	editPayload,
});

const refreshEditPayload = async (
	context: { fetchFn: typeof fetch; token: string },
	objectId: string,
): Promise<ObjectEditPayload | null> => {
	try {
		return await objectEditService.getObjectEditPayload({ context, objectId });
	} catch {
		return null;
	}
};

const isProjectionUnavailableError = (cause: unknown): cause is ApiClientError => {
	if (!isApiClientError(cause) || cause.status !== 409) return false;
	if (!cause.details || typeof cause.details !== 'object' || Array.isArray(cause.details)) return false;
	return 'code' in cause.details && cause.details.code === 'PROJECTION_UNAVAILABLE';
};

const activePublicationFromError = (
	cause: unknown,
): { requestId: string; requestStatus: 'PENDING' | 'PROCESSING' } | null => {
	if (!isApiClientError(cause) || cause.status !== 409) return null;
	const details = cause.details;
	if (!details || typeof details !== 'object' || Array.isArray(details)) return null;
	const record = details as Record<string, unknown>;
	const requestId = record.existing_request_id;
	const requestStatus = record.existing_request_status;
	if (
		cause.code !== 'PUBLICATION_ALREADY_ACTIVE' ||
		typeof requestId !== 'string' ||
		(requestStatus !== 'PENDING' && requestStatus !== 'PROCESSING')
	) return null;
	return { requestId, requestStatus };
};

export const load = async ({ params, locals, cookies, fetch }: RequestEvent) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	const objectId = params.objectId;
	if (!objectId) {
		throw error(404, { message: 'Object not found.' });
	}

	const context = { fetchFn: fetch, token };

	try {
		const editPayload = await objectEditService.getObjectEditPayload({ context, objectId });
		const isLockedByOtherUser =
			editPayload.lock.locked && editPayload.lock.lockedBy !== locals.session.id;
		return { editPayload, isLockedByOtherUser };
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			throw redirect(303, '/login');
		}

		if (isApiClientError(cause)) {
			if (cause.status === 403) {
				throw error(403, { message: 'You do not have permission to edit this object.' });
			}
			if (cause.status === 404) {
				throw error(404, { message: 'Object not found.' });
			}
			throw error(502, {
				message: cause.requestId
					? `Failed to load object edit state (request: ${cause.requestId}).`
					: 'Failed to load object edit state.',
			});
		}

		throw cause;
	}
};

export const actions: Actions = {
	saveDraft: async ({ params, locals, cookies, fetch, request }) => {
		const token = cookies.get(AUTH_COOKIE_NAME);
		if (!locals.session || !token) {
			throw redirect(303, '/login');
		}

		const objectId = params.objectId;
		if (!objectId) {
			return fail(404, { errorCode: 'objectNotFound' satisfies ObjectEditErrorCode });
		}

		const parsedPayload = parseSaveDraftPayload(await request.formData());
		if (!parsedPayload.payload) {
			return fail(400, {
				errorCode: (Object.keys(parsedPayload.fieldErrors).length > 0
					? 'highlightedFields'
					: 'invalidPayload') satisfies ObjectEditErrorCode,
				fieldErrors: parsedPayload.fieldErrors,
			});
		}
		const payload = parsedPayload.payload;

		const context = { fetchFn: fetch, token };
		let metadataSaved = false;
		let revision: number;

		try {
			const editPayload = await objectEditService.getObjectEditPayload({ context, objectId });
			if (!canSaveDraft(editPayload, payload)) {
				return fail(403, { errorCode: 'saveForbidden' satisfies ObjectEditErrorCode });
			}
			if (payload.revision !== editPayload.revision) {
				return fail(409, {
					errorCode: 'changedBeforeSave' satisfies ObjectEditErrorCode,
					recovery: toRecovery('conflict', editPayload),
				});
			}
			revision = payload.revision;

			if (payload.metadata && payload.rights) {
				const result = await objectEditService.saveObjectMetadata({
					context,
					objectId,
					revision,
					metadata: payload.metadata,
					rights: payload.rights,
				});
				revision = result.revision;
				metadataSaved = true;
			}

			if (payload.pages && payload.pages.length > 0) {
				const result = await objectEditService.saveDocumentCuration({
					context,
					objectId,
					revision,
					pages: payload.pages,
				});
				revision = result.revision;
			}

			return { success: true, revision };
		} catch (cause) {
			if (isUnauthorizedError(cause)) {
				clearSessionCookie(cookies);
				throw redirect(303, '/login');
			}

			if (cause instanceof ObjectEditLockedError && !metadataSaved) {
				return fail(423, { locked: true });
			}

			const refreshed = metadataSaved ? await refreshEditPayload(context, objectId) : null;
			if (cause instanceof ObjectEditRevisionConflictError) {
				const editPayload = refreshed ?? (await refreshEditPayload(context, objectId));
				if (editPayload) {
					return fail(409, {
						errorCode: (metadataSaved
							? 'partialConflict'
							: 'changedBeforeSave') satisfies ObjectEditErrorCode,
						recovery: toRecovery(metadataSaved ? 'partial' : 'conflict', editPayload, metadataSaved),
					});
				}
			}

			const fieldErrors =
				isApiClientError(cause) && cause.code === 'VALIDATION_FAILED'
					? toBackendFieldErrors(cause.details)
					: null;

			if (metadataSaved) {
				if (refreshed) {
					return fail(isApiClientError(cause) ? cause.status || 502 : 502, {
						errorCode: 'partialFailedReview' satisfies ObjectEditErrorCode,
						recovery: toRecovery('partial', refreshed, true),
						...(fieldErrors ? { fieldErrors } : {}),
					});
				}

				return fail(isApiClientError(cause) ? cause.status || 502 : 502, {
					errorCode: 'partialFailedRefresh' satisfies ObjectEditErrorCode,
					...(fieldErrors ? { fieldErrors } : {}),
				});
			}

			if (isApiClientError(cause)) {
				if (cause.code === 'VALIDATION_FAILED') {
					return fail(422, {
						errorCode: 'validationFailed' satisfies ObjectEditErrorCode,
						fieldErrors,
					});
				}
				return fail(cause.status || 502, {
					errorCode: 'saveFailed' satisfies ObjectEditErrorCode,
					...(cause.requestId ? { errorRequestId: cause.requestId } : {}),
				});
			}

			return fail(502, { errorCode: 'saveFailed' satisfies ObjectEditErrorCode });
		}
	},

	submitCuration: async ({ params, locals, cookies, fetch, request }) => {
		const token = cookies.get(AUTH_COOKIE_NAME);
		if (!locals.session || !token) {
			return fail(401, { sessionRequired: true });
		}

		const objectId = params.objectId;
		if (!objectId) {
			return fail(404, { errorCode: 'objectNotFound' satisfies ObjectEditErrorCode });
		}

		const formData = await request.formData();
		const reviewNote = String(formData.get('reviewNote') ?? '').trim() || null;
		const revision = z.coerce.number().int().min(0).safeParse(formData.get('revision'));
		if (!revision.success) {
			return fail(400, { errorCode: 'invalidPayload' satisfies ObjectEditErrorCode });
		}
		const context = { fetchFn: fetch, token };

		try {
			const editPayload = await objectEditService.getObjectEditPayload({ context, objectId });
			if (editPayload.curation.kind !== 'document' || editPayload.curation.pages.length === 0) {
				return fail(409, {
					errorCode: 'ocrUnavailable' satisfies ObjectEditErrorCode,
					projectionUnavailable: true,
				});
			}
			if (!editPayload.capabilities.canSubmitReview) {
				return fail(403, { errorCode: 'publishForbidden' satisfies ObjectEditErrorCode });
			}
			const result = await objectEditService.submitObjectCuration({
				context,
				objectId,
				revision: revision.data,
				reviewNote,
			});

			return {
				success: true,
				revision: result.revision,
				curationState: result.curationState,
				requestId: result.requestId,
				requestStatus: result.requestStatus,
			};
		} catch (cause) {
			if (isUnauthorizedError(cause)) {
				clearSessionCookie(cookies);
				return fail(401, { sessionRequired: true });
			}

			const activePublication = activePublicationFromError(cause);
			if (activePublication) {
				return fail(409, {
					publicationAlreadyActive: true,
					...activePublication,
				});
			}

			if (cause instanceof ObjectEditLockedError) {
				return fail(423, { locked: true });
			}

			if (cause instanceof ObjectEditRevisionConflictError) {
				const editPayload = await refreshEditPayload(context, objectId);
				if (editPayload) {
					return fail(409, {
						errorCode: 'changedBeforePublish' satisfies ObjectEditErrorCode,
						recovery: toRecovery('conflict', editPayload),
					});
				}
			}

			if (isProjectionUnavailableError(cause)) {
				return fail(409, {
					errorCode: 'ocrUnavailable' satisfies ObjectEditErrorCode,
					...(cause.requestId ? { errorRequestId: cause.requestId } : {}),
					projectionUnavailable: true,
				});
			}

			if (isApiClientError(cause)) {
				return fail(cause.status || 502, {
					errorCode: 'publishFailed' satisfies ObjectEditErrorCode,
					...(cause.requestId ? { errorRequestId: cause.requestId } : {}),
				});
			}

			return fail(502, { errorCode: 'publishFailed' satisfies ObjectEditErrorCode });
		}
	},
};
