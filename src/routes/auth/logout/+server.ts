import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
	AUTH_COOKIE_NAME,
	clearSessionCookie,
	logoutWithBackend
} from '$lib/server/auth';
import { isTrustedOrigin } from '$lib/server/csrf';

export const POST: RequestHandler = async ({ cookies, fetch, request, url }) => {
	if (!isTrustedOrigin(request, url.origin)) {
		return json({ error: 'Invalid request origin.' }, { status: 403 });
	}

	const token = cookies.get(AUTH_COOKIE_NAME);

	try {
		if (token) {
			await logoutWithBackend(fetch, token);
		}
	} catch {
		// Local logout must succeed even if remote token invalidation is unavailable.
	} finally {
		clearSessionCookie(cookies);
	}

	return json({ status: 'ok' });
};
