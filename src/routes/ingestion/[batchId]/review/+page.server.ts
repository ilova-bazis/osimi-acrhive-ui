import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import { defaultItemKindForClassification } from '$lib/ingestion/kindMappings';
import { ingestionDetailService } from '$lib/services';
import { isUnauthorizedError } from '$lib/server/apiClient';
import { redirect } from '@sveltejs/kit';
import type { IngestionDetail } from '$lib/services/ingestionDetail';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	let detail: IngestionDetail;
	try {
		detail = await ingestionDetailService.getDetail({
			fetchFn: fetch,
			token,
			batchId: params.batchId
		});
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			throw redirect(303, '/login');
		}
		throw redirect(303, `/ingestion/${params.batchId}/setup`);
	}

	if (!detail.actionCapabilities.canResume) {
		throw redirect(303, `/ingestion/${params.batchId}`);
	}

	const enabledFiles = detail.files.filter((f) => f.status !== 'skipped');
	const skippedFiles = detail.files.filter((f) => f.status === 'skipped');
	const totalSizeBytes = enabledFiles.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);

	return {
		batchId: params.batchId,
		batchLabel: detail.batchLabel,
		classificationType: detail.classificationType,
		itemKind: detail.itemKind ?? defaultItemKindForClassification(detail.classificationType),
		languageCode: detail.languageCode,
		pipelinePreset: detail.pipelinePreset,
		accessLevel: detail.accessLevel,
		summary: detail.summary,
		enabledFiles,
		skippedFiles,
		totalSizeBytes,
		items: detail.items
	};
};
