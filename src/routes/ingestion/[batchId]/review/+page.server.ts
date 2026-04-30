import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import { ingestionDetailService } from '$lib/services';
import { isUnauthorizedError } from '$lib/server/apiClient';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const SUBMITTABLE_STATUSES = new Set(['draft', 'uploading']);

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

		if (!SUBMITTABLE_STATUSES.has(detail.status)) {
			throw redirect(303, `/ingestion/${params.batchId}/setup`);
		}

		const enabledFiles = detail.files.filter((f) => f.status !== 'skipped');
		const skippedFiles = detail.files.filter((f) => f.status === 'skipped');
		const totalSizeBytes = enabledFiles.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);

		return {
			batchId: params.batchId,
			batchLabel: detail.batchLabel,
			classificationType: detail.classificationType,
			itemKind: detail.itemKind,
			languageCode: detail.languageCode,
			pipelinePreset: detail.pipelinePreset,
			accessLevel: detail.accessLevel,
			summary: detail.summary,
			enabledFiles,
			skippedFiles,
			totalSizeBytes,
			items: detail.items
		};
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			throw redirect(303, '/login');
		}
		throw redirect(303, `/ingestion/${params.batchId}/setup`);
	}
};
