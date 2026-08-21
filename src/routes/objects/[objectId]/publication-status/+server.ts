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
		const result = await objectEditService.getCurationPublication({
			context: { fetchFn: fetch, token },
			objectId: params.objectId,
		});
		const request = result.request;
		return statusJson({
			request: request
				? {
						id: request.id,
						status: request.status,
						failureReason: request.failureReason,
						createdAt: request.createdAt,
						updatedAt: request.updatedAt,
						completedAt: request.completedAt,
						publicationRevision: request.publicationRevision,
						targetVersion: request.targetVersion,
					}
				: null,
		});
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			return statusJson({ error: 'Unauthorized' }, 401);
		}
		if (isApiClientError(cause)) {
			return statusJson(
				{ error: 'Failed to load publication status.', requestId: cause.requestId },
				cause.status >= 400 && cause.status < 500 ? cause.status : 502,
			);
		}
		return statusJson({ error: 'Failed to load publication status.' }, 502);
	}
};
