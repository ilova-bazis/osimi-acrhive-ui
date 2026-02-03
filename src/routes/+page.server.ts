import { dashboardService } from '$lib/services';

export const load = async ({ locals }: { locals: App.Locals }) => {
	const role = locals.session?.role ?? 'viewer';
	const summary = await dashboardService.getSummary(role);

	return {
		summary
	};
};
