import {
	dashboardActivityResponseSchema,
	dashboardSummaryResponseSchema
} from '$lib/api/schemas/dashboard';
import { mapActivity, mapDashboardSummary } from '$lib/api/mappers/dashboardMapper';
import { backendRequest } from '$lib/server/apiClient';
import type { DashboardService } from './dashboard';

const toDashboardActivityPath = (params: {
	limit?: number;
	cursor?: string;
	ingestionId?: string;
}): string => {
	const query = new URLSearchParams();
	if (typeof params.limit === 'number') {
		query.set('limit', String(params.limit));
	}
	if (params.cursor) {
		query.set('cursor', params.cursor);
	}
	if (params.ingestionId) {
		query.set('ingestion_id', params.ingestionId);
	}
	const suffix = query.toString();
	return suffix ? `/api/dashboard/activity?${suffix}` : '/api/dashboard/activity';
};

export const apiDashboardService: DashboardService = {
	getSummary: async ({ fetchFn, role, token }) => {
		const [summaryResponse, activityResponse] = await Promise.all([
			backendRequest({
				fetchFn,
				path: '/api/dashboard/summary',
				context: 'dashboard.summary',
				method: 'GET',
				token,
				responseSchema: dashboardSummaryResponseSchema
			}),
			backendRequest({
				fetchFn,
				path: toDashboardActivityPath({}),
				context: 'dashboard.activity',
				method: 'GET',
				token,
				responseSchema: dashboardActivityResponseSchema
			})
		]);

		return mapDashboardSummary({ role, summaryResponse, activityResponse });
	},
	getActivity: async ({ fetchFn, token, limit, cursor, ingestionId }) => {
		const activityResponse = await backendRequest({
			fetchFn,
			path: toDashboardActivityPath({ limit, cursor, ingestionId }),
			context: 'dashboard.activity',
			method: 'GET',
			token,
			responseSchema: dashboardActivityResponseSchema
		});

		return mapActivity(activityResponse);
	}
};
