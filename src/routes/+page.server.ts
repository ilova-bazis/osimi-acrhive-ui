import { dashboardService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	try {
		const summary = await dashboardService.getSummary({
			role: locals.session.role,
			fetchFn: fetch,
			token
		});

		return {
			summary
		};
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			throw redirect(303, '/login');
		}

		if (isApiClientError(cause)) {
			throw error(502, {
				message: cause.requestId
					? `Failed to load dashboard (request: ${cause.requestId}).`
					: 'Failed to load dashboard.'
			});
		}

		throw cause;
	}
};
