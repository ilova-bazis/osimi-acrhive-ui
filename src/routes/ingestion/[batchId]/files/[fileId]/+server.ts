import { ingestionSetupService } from '$lib/services';
import { clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
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
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (isApiClientError(cause)) {
			return json(
				{
					error: cause.message,
					requestId: cause.requestId
				},
				{ status: mapApiErrorStatus(cause.status) }
			);
		}

		return json({ error: 'Unexpected file removal error.' }, { status: 500 });
	}
};
