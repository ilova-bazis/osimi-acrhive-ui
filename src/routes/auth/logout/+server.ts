import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
	AUTH_COOKIE_NAME,
	clearSessionCookie,
	logoutWithBackend
} from '$lib/server/auth';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);

	if (token) {
		await logoutWithBackend(fetch, token);
	}

	clearSessionCookie(cookies);

	return json({ status: 'ok' });
};
