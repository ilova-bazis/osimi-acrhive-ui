import { redirect } from '@sveltejs/kit';
import { getSessionCookieName } from '$lib/server/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.set(getSessionCookieName(), '', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0
	});

	throw redirect(303, '/login');
};

export const GET: RequestHandler = async () => {
	throw redirect(303, '/login');
};
