import { ingestionOverviewService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies, fetch, url }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	const activePage = Math.max(1, parseInt(url.searchParams.get('ap') ?? '1', 10) || 1);
	const draftPage  = Math.max(1, parseInt(url.searchParams.get('dp') ?? '1', 10) || 1);

	try {
		const summary = await ingestionOverviewService.getSummary({
			fetchFn: fetch,
			token
		});

		return { summary, activePage, draftPage };
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			throw redirect(303, '/login');
		}

		if (isApiClientError(cause)) {
			throw error(502, {
				message: cause.requestId
					? `Failed to load ingestions (request: ${cause.requestId}).`
					: 'Failed to load ingestions.'
			});
		}

		throw cause;
	}
};
