import { objectsService } from '$lib/services';
import { clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import {
	mutationBackendErrorResponse,
	mutationErrorResponse
} from '$lib/server/mutationErrorResponse';
import { isAuthFailureResponse, mapApiErrorStatus, requireMutationAuth } from '$lib/server/routeGuards';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const canRequestResync = (role: string | undefined): boolean => role === 'admin' || role === 'archiver';

export const POST: RequestHandler = async ({ params, locals, cookies, fetch, request }) => {
	const auth = requireMutationAuth({ request, locals, cookies });
	if (isAuthFailureResponse(auth)) return auth;
	const { session, token } = auth;
	if (!canRequestResync(session.role)) {
		return mutationErrorResponse(403, 'forbidden', 'Forbidden');
	}
	if (!params.objectId) {
		return mutationErrorResponse(404, 'notFound', 'Object not found.');
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
			return mutationErrorResponse(401, 'unauthorized', 'Unauthorized');
		}

		if (isApiClientError(cause)) {
			return mutationBackendErrorResponse(
				mapApiErrorStatus(cause.status),
				cause.code,
				cause.message,
				{ requestId: cause.requestId }
			);
		}

		return mutationErrorResponse(500, 'unexpected', 'Unexpected resync error.');
	}
};
