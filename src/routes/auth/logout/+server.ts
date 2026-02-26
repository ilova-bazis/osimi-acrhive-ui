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

	if (token) {
		await logoutWithBackend(fetch, token);
	}

	clearSessionCookie(cookies);

	return json({ status: 'ok' });
};
