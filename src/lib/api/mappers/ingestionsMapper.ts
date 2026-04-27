import type { IngestionDto, IngestionsListResponseDto } from '$lib/api/schemas/ingestions';
import type {
	IngestionAction,
	IngestionBatch,
	IngestionOverviewSummary,
	IngestionStatus
} from '$lib/services/ingestionOverview';

const resolveIngestionId = (dto: IngestionDto, index: number): string =>
	dto.id ?? dto.ingestion_id ?? dto.batch_id ?? dto.batch_label ?? `ingestion-${index + 1}`;

const resolveBatchName = (dto: IngestionDto, fallbackId: string): string => dto.batch_label ?? fallbackId;

const resolveCreatedAt = (dto: IngestionDto): string =>
	dto.created_at ?? dto.updated_at ?? new Date(0).toISOString();

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

const toProgress = (dto: IngestionDto, status: IngestionStatus): IngestionBatch['progress'] => {
	const completed =
		dto.processed_objects ?? dto.objects_processed ?? dto.completed_count ?? (status === 'completed' ? 1 : 0);
	const total = dto.total_objects ?? dto.object_count ?? dto.total_count ?? (completed > 0 ? completed : 1);

	return {
		completed,
		total: total >= completed ? total : completed
	};
};

const toActions = (status: IngestionStatus): IngestionAction[] => {
	if (status === 'draft') return ['resume', 'delete'];
	if (status === 'uploading') return ['resume', 'cancel', 'delete'];
	if (status === 'queued') return ['view', 'cancel'];
	if (status === 'ingesting') return ['view'];
	if (status === 'failed') return ['view', 'retry', 'cancel'];
	if (status === 'canceled') return ['view', 'restore', 'delete'];
	return ['view'];
};

const toBatch = (dto: IngestionDto, index: number): IngestionBatch => {
	const id = resolveIngestionId(dto, index);
	const status = toIngestionStatus(dto.status);

	return {
		id,
		name: resolveBatchName(dto, id),
		createdAt: resolveCreatedAt(dto),
		status,
		progress: toProgress(dto, status),
		actions: toActions(status)
	};
};

export const mapIngestionOverviewSummary = (
	response: IngestionsListResponseDto
): IngestionOverviewSummary => {
	const allBatches = response.ingestions.map(toBatch);
	const drafts = allBatches.filter(
		(batch) => batch.status === 'draft' || batch.status === 'uploading' || batch.status === 'canceled'
	);
	const activeAndRecent = allBatches.filter(
		(batch) => batch.status !== 'draft' && batch.status !== 'uploading' && batch.status !== 'canceled'
	);

	const objectsCreated = allBatches.reduce(
		(total, batch) => total + (batch.status === 'completed' ? batch.progress.completed : 0),
		0
	);

	return {
		stats: {
			totalBatches: allBatches.length,
			objectsCreated,
			inProgress: allBatches.filter((batch) => batch.status === 'ingesting' || batch.status === 'queued').length,
			needsAttention: allBatches.filter((batch) => batch.status === 'failed').length
		},
		activeAndRecent,
		drafts,
		nextCursor: response.next_cursor ?? null
	};
};

export const mapCreatedIngestionBatchId = (dto: IngestionDto): string =>
	dto.id ?? dto.ingestion_id ?? dto.batch_id ?? dto.batch_label ?? '';
