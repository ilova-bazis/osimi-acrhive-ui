import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { loginWithBackend, setSessionCookie } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const data = await request.formData();
		const username = String(data.get('username') ?? '').trim();
		const password = String(data.get('password') ?? '').trim();
		const tenantIdRaw = String(data.get('tenantId') ?? '').trim();

		if (!username || !password) {
			return fail(400, {
				error: 'Username and password are required.',
				username
			});
		}

		try {
			const { token } = await loginWithBackend(
				fetch,
				username,
				password,
				tenantIdRaw || undefined
			);
			setSessionCookie(cookies, token);
		} catch (error) {
			return fail(401, {
				error: error instanceof Error ? error.message : 'Login failed',
				username
			});
		}

		throw redirect(303, '/');
	}
};
