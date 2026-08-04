import { AUTH_COOKIE_NAME } from '$lib/server/auth';
import { ingestionCapabilitiesService, ingestionDetailService } from '$lib/services';
import { DEFAULT_INGESTION_CAPABILITIES } from '$lib/services/ingestionCapabilities';
import { isUnauthorizedError } from '$lib/server/apiClient';
import { error, redirect } from '@sveltejs/kit';
import type { IngestionDetail, IngestionDetailFile, IngestionDetailItem } from '$lib/services/ingestionDetail';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, cookies, fetch }) => {
	const token = cookies.get(AUTH_COOKIE_NAME);
	if (!locals.session || !token) {
		throw redirect(303, '/login');
	}

	let capabilities = DEFAULT_INGESTION_CAPABILITIES;
	let existingFiles: IngestionDetailFile[] = [];
	let items: IngestionDetailItem[] = [];
	let detail: IngestionDetail;
	let metadata = {
		classificationType: 'document',
		itemKind: undefined as
			| undefined
			| 'photo'
			| 'audio'
			| 'video'
			| 'scanned_document'
			| 'document'
			| 'other',
		languageCode: 'en',
		pipelinePreset: 'auto',
		accessLevel: 'private' as 'private' | 'family' | 'public',
		embargoUntil: null as string | null,
		rightsNote: null as string | null,
		sensitivityNote: null as string | null,
		summary: {} as Record<string, unknown>
	};

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

		throw error(502, 'Failed to load ingestion setup details.');
	}

	if (!detail.actionCapabilities.canResume) {
		throw redirect(303, `/ingestion/${params.batchId}`);
	}

	try {
		capabilities = await ingestionCapabilitiesService.getCapabilities({
			fetchFn: fetch,
			token
		});
	} catch (cause) {
		if (isUnauthorizedError(cause)) {
			throw redirect(303, '/login');
		}
	}

	existingFiles = detail.files;

	const cookieItemKind = cookies.get(`ingestion-item-kind:${params.batchId}`);
	const fallbackItemKind =
		cookieItemKind === 'photo' ||
		cookieItemKind === 'audio' ||
		cookieItemKind === 'video' ||
		cookieItemKind === 'scanned_document' ||
		cookieItemKind === 'document' ||
		cookieItemKind === 'other'
			? cookieItemKind
			: null;

	metadata = {
		classificationType: detail.classificationType,
		itemKind: fallbackItemKind ?? detail.itemKind,
		languageCode: detail.languageCode,
		pipelinePreset: detail.pipelinePreset,
		accessLevel: detail.accessLevel,
		embargoUntil: detail.embargoUntil,
		rightsNote: detail.rightsNote,
		sensitivityNote: detail.sensitivityNote,
		summary: detail.summary
	};
	if (fallbackItemKind) {
		cookies.delete(`ingestion-item-kind:${params.batchId}`, {
			path: `/ingestion/${params.batchId}`
		});
	}
	items = detail.items;

	return {
		batchId: params.batchId,
		capabilities,
		existingFiles,
		items,
		metadata
	};
};
