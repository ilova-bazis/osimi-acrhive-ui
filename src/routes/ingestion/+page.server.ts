import { ingestionOverviewService } from '$lib/services';

export const load = async () => {
	const summary = await ingestionOverviewService.getSummary();

	return {
		summary
	};
};
