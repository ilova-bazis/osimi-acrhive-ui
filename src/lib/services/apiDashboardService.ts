import {
	dashboardActivityResponseSchema,
	dashboardSummaryResponseSchema
} from '$lib/api/schemas/dashboard';
import { mapDashboardSummary } from '$lib/api/mappers/dashboardMapper';
import { backendRequest } from '$lib/server/apiClient';
import type { DashboardService } from './dashboard';

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
				path: '/api/dashboard/activity',
				context: 'dashboard.activity',
				method: 'GET',
				token,
				responseSchema: dashboardActivityResponseSchema
			})
		]);

		return mapDashboardSummary({ role, summaryResponse, activityResponse });
	}
};
