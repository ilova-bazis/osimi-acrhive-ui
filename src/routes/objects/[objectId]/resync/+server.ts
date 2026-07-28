import { objectsService } from '$lib/services';
import { clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { isAuthFailureResponse, mapApiErrorStatus, requireMutationAuth } from '$lib/server/routeGuards';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const canRequestResync = (role: string | undefined): boolean => role === 'admin' || role === 'archiver';

export const POST: RequestHandler = async ({ params, locals, cookies, fetch, request }) => {
	const auth = requireMutationAuth({ request, locals, cookies });
	if (isAuthFailureResponse(auth)) return auth;
	const { session, token } = auth;
	if (!canRequestResync(session.role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}
	if (!params.objectId) {
		return json({ error: 'Object not found.' }, { status: 404 });
	}

	try {
		const result = await objectsService.requestResync({
			context: { fetchFn: fetch, token },
			objectId: params.objectId
		});

		return json({ ok: true, status: result.status });
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (isApiClientError(cause)) {
			return json(
				{ error: cause.message, requestId: cause.requestId },
				{ status: mapApiErrorStatus(cause.status) }
			);
		}

		return json({ error: 'Unexpected resync error.' }, { status: 500 });
	}
};
