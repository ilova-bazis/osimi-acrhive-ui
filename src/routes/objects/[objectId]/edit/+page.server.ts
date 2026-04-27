import { objectEditService } from '$lib/services';
import type { ObjectEditMetadata } from '$lib/services/objectEdit';
import { ObjectEditLockedError } from '$lib/services/objectEdit';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { error, fail, redirect, type Actions, type RequestEvent } from '@sveltejs/kit';

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

		const formData = await request.formData();

		let metadata: ObjectEditMetadata;
		let rights: { rightsNote: string | null; sensitivityNote: string | null };
		try {
			metadata = JSON.parse(String(formData.get('metadata') ?? 'null'));
			rights = JSON.parse(String(formData.get('rights') ?? 'null'));
			if (!metadata || !rights) throw new Error('Missing fields');
		} catch {
			return fail(400, { error: 'Invalid form payload.' });
		}

		const pagesRaw = formData.get('pages');
		const pages: Array<{ pageNumber: number; curatedText: string }> | null = pagesRaw
			? JSON.parse(String(pagesRaw))
			: null;

		const context = { fetchFn: fetch, token };

		try {
			await objectEditService.saveObjectMetadata({
				context,
				objectId,
				metadata,
				rights,
			});

			if (pages && pages.length > 0) {
				await objectEditService.saveDocumentCuration({
					context,
					objectId,
					pages,
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
