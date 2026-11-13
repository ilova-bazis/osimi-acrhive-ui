import { ingestionSetupService } from '$lib/services';
import { clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import {
	mutationBackendErrorResponse,
	mutationErrorResponse
} from '$lib/server/mutationErrorResponse';
import { isAuthFailureResponse, mapApiErrorStatus, requireMutationAuth } from '$lib/server/routeGuards';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals, cookies, fetch, request }) => {
	const auth = requireMutationAuth({ request, locals, cookies });
	if (isAuthFailureResponse(auth)) return auth;
	const { token } = auth;

	try {
		await ingestionSetupService.deleteFile({
			batchId: params.batchId,
			fileId: params.fileId,
			context: {
				fetchFn: fetch,
				token
			}
		});

		return json({ ok: true });
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

		return mutationErrorResponse(500, 'unexpected', 'Unexpected file removal error.');
	}
};
