import {
	cancelIngestionResponseSchema,
	deleteIngestionResponseSchema,
	ingestionDetailResponseSchema,
	retryIngestionResponseSchema,
	restoreIngestionResponseSchema,
	updateIngestionRequestSchema,
	type IngestionDto,
	type IngestionFileDto
} from '$lib/api/schemas/ingestions';
import { backendRequest } from '$lib/server/apiClient';
import type { IngestionDetail, IngestionDetailFile, IngestionDetailService } from './ingestionDetail';
import type { IngestionStatus } from './ingestionOverview';

const toIngestionPath = (batchId: string): string => `/api/ingestions/${encodeURIComponent(batchId)}`;
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

const mapDetail = (ingestion: IngestionDto, files: IngestionFileDto[]): IngestionDetail => {
	const id = ingestion.id ?? ingestion.ingestion_id ?? ingestion.batch_id ?? ingestion.batch_label ?? 'unknown';
	const processedObjects =
		ingestion.processed_objects ?? ingestion.objects_processed ?? ingestion.completed_count ?? 0;
	const totalObjects = ingestion.total_objects ?? ingestion.object_count ?? ingestion.total_count ?? processedObjects;

	return {
		id,
		batchLabel: ingestion.batch_label ?? id,
		status: toIngestionStatus(ingestion.status),
		documentType: ingestion.document_type ?? 'document',
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
		files: files.map(mapFile)
	};
};

export const apiIngestionDetailService: IngestionDetailService = {
	getDetail: async ({ fetchFn, token, batchId }) => {
		const response = await backendRequest({
			fetchFn,
			path: toIngestionPath(batchId),
			context: 'ingestions.detail',
			method: 'GET',
			token,
			responseSchema: ingestionDetailResponseSchema
		});

		return mapDetail(response.ingestion, response.files ?? []);
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
				document_type: payload.documentType,
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
