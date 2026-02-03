import { fail, redirect } from '@sveltejs/kit';
import { authenticateDemoUser, createSessionToken, getSessionCookieName } from '$lib/server/auth';
import { dev } from '$app/environment';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = String(data.get('username') ?? '').trim();
		const password = String(data.get('password') ?? '');

		const match = authenticateDemoUser(username, password);
		if (!match) {
			return fail(400, { error: 'Invalid username or password.' });
		}

		const { token } = createSessionToken(match.username, match.role);
		cookies.set(getSessionCookieName(), token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 8
		});

		throw redirect(303, '/');
	}
};
