import { objectEditService } from '$lib/services';
import { isUnauthorizedError } from '$lib/server/apiClient';
import { isAuthFailureResponse, requireMutationAuth } from '$lib/server/routeGuards';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals, cookies, fetch, request }) => {
	const auth = requireMutationAuth({ request, locals, cookies });
	if (isAuthFailureResponse(auth)) return auth;
	const { token } = auth;

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
