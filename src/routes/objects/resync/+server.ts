import { objectsService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, cookies, fetch, request }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let objectIds: string[];
	try {
		const body = await request.json();
		if (!Array.isArray(body?.objectIds) || body.objectIds.length === 0) {
			return json({ error: 'objectIds must be a non-empty array.' }, { status: 400 });
		}
		objectIds = body.objectIds.slice(0, 50);
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const context = { fetchFn: fetch, token };
	const results: { objectId: string; ok: boolean; error?: string }[] = [];

	for (const objectId of objectIds) {
		try {
			await objectsService.requestResync({ context, objectId });
			results.push({ objectId, ok: true });
		} catch (cause) {
			if (isUnauthorizedError(cause)) {
				clearSessionCookie(cookies);
				return json({ error: 'Unauthorized' }, { status: 401 });
			}

			const errorMessage = isApiClientError(cause)
				? cause.message
				: 'Unexpected error.';
			results.push({ objectId, ok: false, error: errorMessage });
		}
	}

	return json({ results });
};
