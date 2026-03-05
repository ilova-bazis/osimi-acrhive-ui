import { dashboardService, ingestionDetailService } from '$lib/services';
import { AUTH_COOKIE_NAME, clearSessionCookie } from '$lib/server/auth';
import { isApiClientError, isUnauthorizedError } from '$lib/server/apiClient';
import { error, redirect } from '@sveltejs/kit';
import type { DashboardActivity } from '$lib/services/dashboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	try {
		const detail = await ingestionDetailService.getDetail({
			fetchFn: fetch,
			token,
			batchId: params.batchId
		});

		let activity: DashboardActivity[] = [];
		let activityError: string | null = null;
		try {
			activity = await dashboardService.getActivity({
				fetchFn: fetch,
				token,
				ingestionId: detail.id,
				limit: 50
			});
		} catch (activityCause) {
			if (isUnauthorizedError(activityCause)) {
				clearSessionCookie(cookies);
				throw redirect(303, '/login');
			}

			if (isApiClientError(activityCause)) {
				activityError = activityCause.requestId
					? `Failed to load activity logs (request: ${activityCause.requestId}).`
					: 'Failed to load activity logs.';
			} else {
				activityError = 'Failed to load activity logs.';
			}
		}

		return {
			detail,
			activity,
			activityError
		};
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			clearSessionCookie(cookies);
			throw redirect(303, '/login');
		}

		if (isApiClientError(cause)) {
			if (cause.status === 404) {
				throw error(404, {
					message: 'Ingestion not found.'
				});
			}

			throw error(502, {
				message: cause.requestId
					? `Failed to load ingestion details (request: ${cause.requestId}).`
					: 'Failed to load ingestion details.'
			});
		}

		throw cause;
	}
};
