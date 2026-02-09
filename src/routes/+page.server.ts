import { dashboardService } from '$lib/services';

export const load = async () => {
	const summary = await dashboardService.getSummary('viewer');

	return {
		summary
	};
};
