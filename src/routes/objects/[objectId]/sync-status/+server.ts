import { json } from '@sveltejs/kit';

import { objectEditService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import type { RequestHandler } from './$types';

const responseHeaders = { 'cache-control': 'private, no-store' };
const statusJson = (body: unknown, status = 200): Response =>
	json(body, { status, headers: responseHeaders });

export const GET: RequestHandler = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) return statusJson({ error: 'Unauthorized' }, 401);
	if (!params.objectId) return statusJson({ error: 'Object not found.' }, 404);

	try {
		const result = await objectEditService.getObjectArchiveSync({
			context: { fetchFn: fetch, token },
			objectId: params.objectId,
		});
		return statusJson({
			objectId: result.objectId,
			currentRevision: result.currentRevision,
			latestSubmittedRevision: result.latestSubmittedRevision,
			latestAppliedRevision: result.latestAppliedRevision,
			archiveOutOfSync: result.archiveOutOfSync,
			activeSubmission: result.activeSubmission,
			latestSubmission: result.latestSubmission,
		});
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			return statusJson({ error: 'Unauthorized' }, 401);
		}
		if (isApiClientError(cause)) {
			return statusJson(
				{ error: 'Failed to load archive synchronization status.', requestId: cause.requestId },
				cause.status >= 400 && cause.status < 500 ? cause.status : 502,
			);
		}
		return statusJson({ error: 'Failed to load archive synchronization status.' }, 502);
	}
};
