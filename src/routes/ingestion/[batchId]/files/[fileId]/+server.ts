import { ingestionSetupService } from '$lib/services';
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

export const DELETE: RequestHandler = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

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
