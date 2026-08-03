import { z } from 'zod';
import { error, fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';

import { objectEditService } from '$lib/services';
import type { ObjectEditMetadata, ObjectEditPayload } from '$lib/services/objectEdit';
import { ObjectEditLockedError, ObjectEditRevisionConflictError } from '$lib/services/objectEdit';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';

const objectEditMetadataSchema = z
	.object({
		title: z.string(),
		publicationDate: z.string(),
		datePrecision: z.enum(['none', 'year', 'month', 'day']),
		dateApproximate: z.boolean(),
		language: z.string().nullable(),
		tags: z.array(z.string()),
		people: z.array(z.string()),
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

const objectEditPagesSchema = z.array(
	z.object({
		pageNumber: z.number().int().positive(),
		curatedText: z.string(),
	}),
);

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

const parseSaveDraftPayload = (formData: FormData): SaveDraftPayload | null => {
	try {
		const revision = z.coerce.number().int().min(0).parse(formData.get('revision'));
		const rawMetadata = parseOptionalJsonFormField(formData, 'metadata');
		const rawRights = parseOptionalJsonFormField(formData, 'rights');
		if ((rawMetadata === undefined) !== (rawRights === undefined)) return null;
		const metadata = rawMetadata === undefined ? null : objectEditMetadataSchema.parse(rawMetadata);
		const rights = rawRights === undefined ? null : objectEditRightsSchema.parse(rawRights);
		const rawPages = parseOptionalJsonFormField(formData, 'pages');
		const pages = rawPages === undefined ? null : objectEditPagesSchema.parse(rawPages);
		if (!metadata && !pages?.length) return null;
		return { revision, metadata, rights, pages };
	} catch {
		return null;
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
			return fail(404, { error: 'Object not found.' });
		}

		const payload = parseSaveDraftPayload(await request.formData());
		if (!payload) {
			return fail(400, { error: 'Invalid form payload.' });
		}

		const context = { fetchFn: fetch, token };
		let metadataSaved = false;
		let revision: number;

		try {
			const editPayload = await objectEditService.getObjectEditPayload({ context, objectId });
			if (!canSaveDraft(editPayload, payload)) {
				return fail(403, { error: 'You do not have permission to save this draft.' });
			}
			if (payload.revision !== editPayload.revision) {
				return fail(409, {
					error: 'This object changed while you were editing. Review the refreshed values before retrying.',
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
						error: metadataSaved
							? 'Metadata saved, but document curation needs review before retrying.'
							: 'This object changed while you were editing. Review the refreshed values before retrying.',
						recovery: toRecovery(metadataSaved ? 'partial' : 'conflict', editPayload, metadataSaved),
					});
				}
			}

			if (metadataSaved) {
				if (refreshed) {
					return fail(isApiClientError(cause) ? cause.status || 502 : 502, {
						error: 'Metadata saved, but document curation failed. Review the refreshed values before retrying.',
						recovery: toRecovery('partial', refreshed, true),
					});
				}

				return fail(isApiClientError(cause) ? cause.status || 502 : 502, {
					error: 'Metadata saved, but document curation failed. Refresh before retrying.',
				});
			}

			if (isApiClientError(cause)) {
				return fail(cause.status || 502, {
					error: cause.requestId
						? `Failed to save draft (request: ${cause.requestId}).`
						: 'Failed to save draft.',
				});
			}

			return fail(502, { error: 'Failed to save draft.' });
		}
	},

	submitCuration: async ({ params, locals, cookies, fetch, request }) => {
		const token = cookies.get(AUTH_COOKIE_NAME);
		if (!locals.session || !token) {
			throw redirect(303, '/login');
		}

		const objectId = params.objectId;
		if (!objectId) {
			return fail(404, { error: 'Object not found.' });
		}

		const formData = await request.formData();
		const reviewNote = String(formData.get('reviewNote') ?? '').trim() || null;
		const revision = z.coerce.number().int().min(0).safeParse(formData.get('revision'));
		if (!revision.success) {
			return fail(400, { error: 'Invalid form payload.' });
		}
		const context = { fetchFn: fetch, token };

		try {
			const editPayload = await objectEditService.getObjectEditPayload({ context, objectId });
			if (!editPayload.capabilities.canSubmitReview) {
				return fail(403, { error: 'You do not have permission to submit this object for review.' });
			}
			if (revision.data !== editPayload.revision) {
				return fail(409, {
					error: 'This object changed while you were editing. Review the refreshed values before submitting.',
					recovery: toRecovery('conflict', editPayload),
				});
			}

			const result = await objectEditService.submitObjectCuration({
				context,
				objectId,
				revision: revision.data,
				reviewNote,
			});

			return {
				success: true,
				curationState: result.curationState,
				requestId: result.requestId,
				requestStatus: result.requestStatus,
			};
		} catch (cause) {
			if (isUnauthorizedError(cause)) {
				clearSessionCookie(cookies);
				throw redirect(303, '/login');
			}

			if (cause instanceof ObjectEditLockedError) {
				return fail(423, { locked: true });
			}

			if (cause instanceof ObjectEditRevisionConflictError) {
				const editPayload = await refreshEditPayload(context, objectId);
				if (editPayload) {
					return fail(409, {
						error: 'This object changed while you were editing. Review the refreshed values before submitting.',
						recovery: toRecovery('conflict', editPayload),
					});
				}
			}

			if (isApiClientError(cause)) {
				return fail(cause.status || 502, {
					error: cause.requestId
						? `Failed to submit curation (request: ${cause.requestId}).`
						: 'Failed to submit curation.',
				});
			}

			return fail(502, { error: 'Failed to submit curation.' });
		}
	},
};
