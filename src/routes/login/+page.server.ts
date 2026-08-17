import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { LoginErrorCode } from '$lib/auth/loginErrors';
import { loginWithBackend, setSessionCookie } from '$lib/server/auth';
import { isApiClientError } from '$lib/server/apiClient';
import { isTrustedOrigin } from '$lib/server/csrf';

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		if (!isTrustedOrigin(request, new URL(request.url).origin)) {
			return fail(403, {
				errorCode: 'invalidOrigin' satisfies LoginErrorCode
			});
		}

		const data = await request.formData();
		const username = String(data.get('username') ?? '').trim();
		const password = String(data.get('password') ?? '').trim();
		const tenantIdRaw = String(data.get('tenantId') ?? '').trim();

		if (!username || !password) {
			return fail(400, {
				errorCode: 'credentialsRequired' satisfies LoginErrorCode,
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
			if (isApiClientError(error) && (error.status === 400 || error.status === 401)) {
				return fail(error.status, {
					errorCode: 'invalidCredentials' satisfies LoginErrorCode,
					username
				});
			}

			return fail(401, {
				errorCode: 'loginFailed' satisfies LoginErrorCode,
				username
			});
		}

		throw redirect(303, '/');
	}
};
