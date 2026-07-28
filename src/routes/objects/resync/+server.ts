import { objectsService } from '$lib/services';
import { clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { isAuthFailureResponse, requireMutationAuth } from '$lib/server/routeGuards';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';

const bulkResyncSchema = z.object({
	objectIds: z.array(z.string().trim().min(1)).min(1).max(50)
});

const canRequestResync = (role: string | undefined): boolean => role === 'admin' || role === 'archiver';

export const POST: RequestHandler = async ({ locals, cookies, fetch, request }) => {
	const auth = requireMutationAuth({ request, locals, cookies });
	if (isAuthFailureResponse(auth)) return auth;
	const { session, token } = auth;
	if (!canRequestResync(session.role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	let objectIds: string[];
	try {
		const body = await request.json();
		const parsed = bulkResyncSchema.safeParse(body);
		if (!parsed.success) {
			return json({ error: 'objectIds must be a non-empty array.' }, { status: 400 });
		}
		objectIds = Array.from(new Set(parsed.data.objectIds));
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
