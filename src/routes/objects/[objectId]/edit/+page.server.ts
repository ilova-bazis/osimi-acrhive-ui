import { z } from 'zod';
import { error, fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';

import { objectEditService } from '$lib/services';
import type { ObjectEditMetadata, ObjectEditPayload } from '$lib/services/objectEdit';
import { ObjectEditLockedError } from '$lib/services/objectEdit';
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

const parseJsonFormField = (formData: FormData, name: string): unknown => {
	const value = formData.get(name);
	if (typeof value !== 'string') throw new Error(`Missing ${name}`);
	return JSON.parse(value);
};

const parseOptionalJsonFormField = (formData: FormData, name: string): unknown | null => {
	const value = formData.get(name);
	if (value === null) return null;
	if (typeof value !== 'string') throw new Error(`Invalid ${name}`);
	return JSON.parse(value);
};

const parseSaveDraftPayload = (
	formData: FormData,
): {
	metadata: ObjectEditMetadata;
	rights: { rightsNote: string | null; sensitivityNote: string | null };
	pages: Array<{ pageNumber: number; curatedText: string }> | null;
} | null => {
	try {
		const metadata = objectEditMetadataSchema.parse(parseJsonFormField(formData, 'metadata'));
		const rights = objectEditRightsSchema.parse(parseJsonFormField(formData, 'rights'));
		const rawPages = parseOptionalJsonFormField(formData, 'pages');
		const pages = rawPages === null ? null : objectEditPagesSchema.parse(rawPages);
		return { metadata, rights, pages };
	} catch {
		return null;
	}
};

const canSaveDraft = (
	editPayload: ObjectEditPayload,
	pages: Array<{ pageNumber: number; curatedText: string }> | null,
): boolean => {
	const hasPageChanges = Boolean(pages?.length);
	if (hasPageChanges && !editPayload.capabilities.canCurateText) return false;
	return editPayload.capabilities.canEditMetadata || (hasPageChanges && editPayload.capabilities.canCurateText);
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

		try {
			const editPayload = await objectEditService.getObjectEditPayload({ context, objectId });
			if (!canSaveDraft(editPayload, payload.pages)) {
				return fail(403, { error: 'You do not have permission to save this draft.' });
			}

			if (editPayload.capabilities.canEditMetadata) {
				await objectEditService.saveObjectMetadata({
					context,
					objectId,
					metadata: payload.metadata,
					rights: payload.rights,
				});
				metadataSaved = true;
			}

			if (payload.pages && payload.pages.length > 0) {
				await objectEditService.saveDocumentCuration({
					context,
					objectId,
					pages: payload.pages,
				});
			}

			return { success: true };
		} catch (cause) {
			if (isUnauthorizedError(cause)) {
				clearSessionCookie(cookies);
				throw redirect(303, '/login');
			}

			if (cause instanceof ObjectEditLockedError) {
				return fail(423, { locked: true });
			}

			if (isApiClientError(cause)) {
				if (metadataSaved && payload.pages?.length) {
					return fail(cause.status || 502, {
						error: cause.requestId
							? `Metadata saved, but document curation failed (request: ${cause.requestId}).`
							: 'Metadata saved, but document curation failed.',
					});
				}

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
		const context = { fetchFn: fetch, token };

		try {
			const editPayload = await objectEditService.getObjectEditPayload({ context, objectId });
			if (!editPayload.capabilities.canSubmitReview) {
				return fail(403, { error: 'You do not have permission to submit this object for review.' });
			}

			const result = await objectEditService.submitObjectCuration({
				context,
				objectId,
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
