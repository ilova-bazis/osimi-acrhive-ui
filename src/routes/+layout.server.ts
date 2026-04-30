import { ingestionOverviewService } from '$lib/services';
import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	let activeBatches: { id: string; name: string; done: number; total: number; status: string }[] = [];

	if (locals.session && token) {
		try {
			const summary = await ingestionOverviewService.getSummary({ fetchFn: fetch, token });
			activeBatches = summary.activeAndRecent
				.filter((b) => b.status === 'ingesting' || b.status === 'uploading' || b.status === 'queued')
				.map((b) => ({
					id: b.id,
					name: b.name,
					done: b.progress.completed,
					total: b.progress.total,
					status: b.status,
				}));
		} catch {
			// non-fatal — sidebar shows empty batch list
		}
	}

	return { session: locals.session, activeBatches };
};
