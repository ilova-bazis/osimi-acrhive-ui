import { objectEditService } from '$lib/services';
import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import { isUnauthorizedError } from '$lib/server/apiClient';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const objectId = params.objectId;
	if (!objectId) {
		return json({ error: 'Object not found.' }, { status: 404 });
	}

	try {
		const result = await objectEditService.releaseEditLock({
			context: { fetchFn: fetch, token },
			objectId,
		});
		return json({ released: result.released });
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}
		// Best-effort: don't error loudly on lock release failures
		return json({ released: false });
	}
};
