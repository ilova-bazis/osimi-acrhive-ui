import {
	cancelIngestionResponseSchema,
	deleteIngestionResponseSchema,
	ingestionDetailResponseSchema,
	listItemFilesResponseSchema,
	listItemsResponseSchema,
	retryIngestionResponseSchema,
	restoreIngestionResponseSchema,
	updateIngestionRequestSchema,
	type IngestionDto,
	type IngestionFileDto,
	type IngestionItemDto,
	type IngestionItemFileDto
} from '$lib/api/schemas/ingestions';
import { backendRequest } from '$lib/server/apiClient';
import type {
	IngestionDetail,
	IngestionDetailFile,
	IngestionDetailItem,
	IngestionDetailItemFile,
	IngestionDetailService,
	ListItemsRequest
} from './ingestionDetail';
import type { IngestionStatus } from './ingestionOverview';

const toIngestionPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}`;
const toItemsPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/items`;
const toItemFilesPath = (batchId: string, itemId: string): string =>
	`/api/ingestions/${encodeURIComponent(batchId)}/items/${encodeURIComponent(itemId)}/files`;
const toRetryPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/retry`;
const toCancelPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/cancel`;
const toRestorePath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}/restore`;

const toIngestionStatus = (rawStatus: string | undefined): IngestionStatus => {
	const normalized = (rawStatus ?? '').toLowerCase();

	if (normalized.includes('draft')) return 'draft';
	if (normalized.includes('upload')) return 'uploading';
	if (normalized.includes('cancel')) return 'canceled';
	if (normalized.includes('fail') || normalized.includes('error')) {
		return 'failed';
	}
	if (normalized.includes('complete') || normalized.includes('done') || normalized.includes('success')) {
		return 'completed';
	}
	if (normalized.includes('queue') || normalized.includes('submitted')) {
		return 'queued';
	}
	if (
		normalized.includes('ingest') ||
		normalized.includes('process') ||
		normalized.includes('running')
	) {
		return 'ingesting';
	}

	return 'draft';
};

const defaultSummary = (title: string) => ({
	title: {
		primary: title,
		original_script: null,
		translations: []
	},
	classification: {
		tags: [],
		summary: null
	},
	dates: {
		published: {
			value: null,
			approximate: false,
			confidence: 'medium' as const,
			note: null
		},
		created: {
			value: null,
			approximate: false,
			confidence: 'medium' as const,
			note: null
		}
	}
});

const DEFAULT_CLASSIFICATION_TYPE = 'document' as const;
const DEFAULT_ITEM_KIND = 'document' as const;

const normalizeClassificationType = (
	value: string | undefined
):
	| 'newspaper_article'
	| 'magazine_article'
	| 'book_chapter'
	| 'book'
	| 'letter'
	| 'speech'
	| 'interview'
	| 'report'
	| 'manuscript'
	| 'image'
	| 'document'
	| 'other' => {
	if (value === 'newspaper_article') return value;
	if (value === 'magazine_article') return value;
	if (value === 'book_chapter') return value;
	if (value === 'book') return value;
	if (value === 'letter') return value;
	if (value === 'speech') return value;
	if (value === 'interview') return value;
	if (value === 'report') return value;
	if (value === 'manuscript') return value;
	if (value === 'image') return value;
	if (value === 'other') return value;
	if (value === 'photo') return 'image';
	return DEFAULT_CLASSIFICATION_TYPE;
};

const normalizeItemKind = (
	value: string | undefined
): 'photo' | 'audio' | 'video' | 'scanned_document' | 'document' | 'other' => {
	if (value === 'photo') return value;
	if (value === 'audio') return value;
	if (value === 'video') return value;
	if (value === 'scanned_document') return value;
	if (value === 'other') return value;
	return DEFAULT_ITEM_KIND;
};

	const toAccessLevel = (value: string | undefined): 'private' | 'family' | 'public' => {
		if (value === 'family' || value === 'public') return value;
		return 'private';
	};

const mapFile = (dto: IngestionFileDto, index: number): IngestionDetailFile => ({
	id: dto.id ?? dto.file_id ?? `file-${index + 1}`,
	name: dto.filename ?? dto.file_name ?? `File ${index + 1}`,
	status: dto.status ?? 'UNKNOWN',
	contentType: dto.content_type ?? null,
	sizeBytes: dto.size_bytes ?? null,
	createdAt: dto.created_at ?? null
});

const mapItemFile = (dto: IngestionItemFileDto): IngestionDetailItemFile => ({
	id: dto.id,
	ingestionFileId: dto.ingestion_file_id,
	sortOrder: dto.sort_order,
	...(dto.role ? { role: dto.role } : {})
});

const mapItem = (dto: IngestionItemDto, files: IngestionDetailItemFile[]): IngestionDetailItem => {
	const title = typeof dto.title === 'string' && dto.title.length > 0 ? dto.title : undefined;
	return {
		id: dto.id,
		itemIndex: dto.item_index,
		...(title ? { label: title } : {}),
		status: dto.status,
		files
	};
};

const mapDetail = (
	ingestion: IngestionDto,
	files: IngestionFileDto[],
	items: IngestionDetailItem[]
): IngestionDetail => {
	const id = ingestion.id ?? ingestion.ingestion_id ?? ingestion.batch_id ?? ingestion.batch_label ?? 'unknown';
	const processedObjects =
		ingestion.processed_objects ?? ingestion.objects_processed ?? ingestion.completed_count ?? 0;
	const totalObjects = ingestion.total_objects ?? ingestion.object_count ?? ingestion.total_count ?? processedObjects;

	return {
		id,
		batchLabel: ingestion.batch_label ?? id,
		status: toIngestionStatus(ingestion.status),
		classificationType: normalizeClassificationType(
			ingestion.classification_type ?? ingestion.document_type
		),
		itemKind: normalizeItemKind(ingestion.item_kind),
		languageCode: ingestion.language_code ?? 'en',
		pipelinePreset: ingestion.pipeline_preset ?? 'auto',
		accessLevel: toAccessLevel(ingestion.access_level),
		embargoUntil: ingestion.embargo_until ?? null,
		rightsNote: ingestion.rights_note ?? null,
		sensitivityNote: ingestion.sensitivity_note ?? null,
		summary: ingestion.summary ?? defaultSummary(ingestion.batch_label ?? id),
		createdAt: ingestion.created_at ?? ingestion.updated_at ?? new Date(0).toISOString(),
		updatedAt: ingestion.updated_at ?? ingestion.created_at ?? new Date(0).toISOString(),
		processedObjects,
		totalObjects,
		files: files.map(mapFile),
		items
	};
};

const fetchItemsWithFiles = async (
	fetchFn: typeof fetch,
	token: string,
	batchId: string
): Promise<IngestionDetailItem[]> => {
	const itemsResponse = await backendRequest({
		fetchFn,
		path: toItemsPath(batchId),
		context: 'ingestions.items.list',
		method: 'GET',
		token,
		responseSchema: listItemsResponseSchema
	});

	const items = itemsResponse.items;
	if (items.length === 0) return [];

	const itemFilesResults = await Promise.allSettled(
		items.map((item) =>
			backendRequest({
				fetchFn,
				path: toItemFilesPath(batchId, item.id),
				context: 'ingestions.items.files.list',
				method: 'GET',
				token,
				responseSchema: listItemFilesResponseSchema
			})
		)
	);

	return items.map((item, index) => {
		const filesResult = itemFilesResults[index];
		const files =
			filesResult.status === 'fulfilled'
				? filesResult.value.files.map(mapItemFile)
				: [];
		return mapItem(item, files);
	});
};

export const apiIngestionDetailService: IngestionDetailService = {
	getDetail: async ({ fetchFn, token, batchId }) => {
		const [detailResponse, items] = await Promise.all([
			backendRequest({
				fetchFn,
				path: toIngestionPath(batchId),
				context: 'ingestions.detail',
				method: 'GET',
				token,
				responseSchema: ingestionDetailResponseSchema
			}),
			fetchItemsWithFiles(fetchFn, token, batchId).catch(() => [] as IngestionDetailItem[])
		]);

		return mapDetail(detailResponse.ingestion, detailResponse.files ?? [], items);
	},
	listItems: async ({ fetchFn, token, batchId }: ListItemsRequest): Promise<IngestionDetailItem[]> => {
		return fetchItemsWithFiles(fetchFn, token, batchId);
	},
	retry: async ({ fetchFn, token, batchId }) => {
		await backendRequest({
			fetchFn,
			path: toRetryPath(batchId),
			context: 'ingestions.retry',
			method: 'POST',
			token,
			responseSchema: retryIngestionResponseSchema
		});
	},
	cancel: async ({ fetchFn, token, batchId }) => {
		await backendRequest({
			fetchFn,
			path: toCancelPath(batchId),
			context: 'ingestions.cancel',
			method: 'POST',
			token,
			responseSchema: cancelIngestionResponseSchema
		});
	},
	restore: async ({ fetchFn, token, batchId }) => {
		await backendRequest({
			fetchFn,
			path: toRestorePath(batchId),
			context: 'ingestions.restore',
			method: 'POST',
			token,
			responseSchema: restoreIngestionResponseSchema
		});
	},
	delete: async ({ fetchFn, token, batchId }) => {
		await backendRequest({
			fetchFn,
			path: toIngestionPath(batchId),
			context: 'ingestions.delete',
			method: 'DELETE',
			token,
			responseSchema: deleteIngestionResponseSchema
		});
	},
	update: async ({ fetchFn, token, batchId, payload }) => {
		await backendRequest({
			fetchFn,
			path: toIngestionPath(batchId),
			context: 'ingestions.update',
			method: 'PATCH',
			token,
			body: {
				batch_label: payload.batchLabel,
				classification_type: payload.classificationType,
				item_kind: payload.itemKind,
				language_code: payload.languageCode,
				pipeline_preset: payload.pipelinePreset,
				access_level: payload.accessLevel,
				embargo_until: payload.embargoUntil,
				rights_note: payload.rightsNote,
				sensitivity_note: payload.sensitivityNote,
				summary: payload.summary
			},
			requestSchema: updateIngestionRequestSchema,
			responseSchema: restoreIngestionResponseSchema
		});
	}
};
