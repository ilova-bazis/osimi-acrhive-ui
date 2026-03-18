import { objectsService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const mapApiErrorStatus = (status: number): number => {
	if (status === 400 || status === 401 || status === 403 || status === 404 || status === 409 || status === 423) {
		return status;
	}

	return 502;
};

export const POST: RequestHandler = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
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
