import { json } from '@sveltejs/kit';

import { archiveRequestsService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) return json({ error: 'Unauthorized' }, { status: 401 });
	if (!params.objectId) return json({ error: 'Object not found.' }, { status: 404 });

	try {
		const result = await archiveRequestsService.listArchiveRequests({
			context: { fetchFn: fetch, token },
			filters: {
				targetType: 'object',
				targetId: params.objectId,
				actionType: 'curation_apply',
				limit: 1,
			},
		});
		const request = result.requests[0] ?? null;
		return json({
			request: request
				? {
						id: request.id,
						status: request.status,
						failureReason: request.failureReason,
						createdAt: request.createdAt,
						updatedAt: request.updatedAt,
						completedAt: request.completedAt,
					}
				: null,
		});
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		if (isApiClientError(cause)) {
			return json(
				{ error: 'Failed to load publication status.', requestId: cause.requestId },
				{ status: cause.status >= 400 && cause.status < 500 ? cause.status : 502 },
			);
		}
		return json({ error: 'Failed to load publication status.' }, { status: 502 });
	}
};
