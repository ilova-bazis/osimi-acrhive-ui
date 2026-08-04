import type { IngestionDto, IngestionResourceDto, IngestionsListResponseDto } from '$lib/api/schemas/ingestions';
import type {
	IngestionActionCapabilities,
	IngestionBatch,
	IngestionOverviewSummary,
	IngestionStatus,
	StagingPurge
} from '$lib/services/ingestionOverview';
import { actionsFromCapabilities } from '$lib/services/ingestionOverview';

const resolveIngestionId = (dto: IngestionResourceDto, index: number): string =>
	dto.id ?? dto.ingestion_id ?? dto.batch_id ?? dto.batch_label ?? `ingestion-${index + 1}`;

const resolveBatchName = (dto: IngestionResourceDto, fallbackId: string): string => dto.batch_label ?? fallbackId;

const resolveCreatedAt = (dto: IngestionResourceDto): string =>
	dto.created_at ?? dto.updated_at ?? new Date(0).toISOString();

export const mapIngestionStatus = (rawStatus: string | undefined): IngestionStatus => {
	const normalized = (rawStatus ?? '').toLowerCase();

	if (normalized.includes('draft')) return 'draft';
	if (normalized.includes('upload')) return 'uploading';
	if (normalized.includes('cancel')) return 'canceled';
	if (normalized.includes('complete') && normalized.includes('error')) {
		return 'completed_with_errors';
	}
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

const toProgress = (dto: IngestionResourceDto, status: IngestionStatus): IngestionBatch['progress'] => {
	const completed =
		dto.processed_objects ?? dto.objects_processed ?? dto.completed_count ?? (status === 'completed' ? 1 : 0);
	const total = dto.total_objects ?? dto.object_count ?? dto.total_count ?? (completed > 0 ? completed : 1);

	return {
		completed,
		total: total >= completed ? total : completed
	};
};

const toActionCapabilities = (dto: IngestionResourceDto): IngestionActionCapabilities => ({
	canResume: dto.action_capabilities.can_resume,
	canRetry: dto.action_capabilities.can_retry,
	canCancel: dto.action_capabilities.can_cancel,
	canRestore: dto.action_capabilities.can_restore,
	canDelete: dto.action_capabilities.can_delete
});

const toStagingPurge = (dto: IngestionResourceDto): StagingPurge => ({
	state: dto.staging_purge.state.toLowerCase() as StagingPurge['state'],
	startedAt: dto.staging_purge.started_at,
	purgedAt: dto.staging_purge.purged_at
});

const toBatch = (dto: IngestionResourceDto, index: number): IngestionBatch => {
	const id = resolveIngestionId(dto, index);
	const status = mapIngestionStatus(dto.status);
	const actionCapabilities = toActionCapabilities(dto);

	return {
		id,
		name: resolveBatchName(dto, id),
		createdAt: resolveCreatedAt(dto),
		status,
		progress: toProgress(dto, status),
		actionCapabilities,
		stagingPurge: toStagingPurge(dto),
		actions: ['view', ...actionsFromCapabilities(actionCapabilities)]
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
		(total, batch) =>
			total +
			(batch.status === 'completed' || batch.status === 'completed_with_errors'
				? batch.progress.completed
				: 0),
		0
	);

	return {
		stats: {
			totalBatches: allBatches.length,
			objectsCreated,
			inProgress: allBatches.filter((batch) => batch.status === 'ingesting' || batch.status === 'queued').length,
			needsAttention: allBatches.filter(
				(batch) => batch.status === 'failed' || batch.status === 'completed_with_errors'
			).length
		},
		activeAndRecent,
		drafts,
		nextCursor: response.next_cursor ?? null
	};
};

export const mapCreatedIngestionBatchId = (dto: IngestionDto): string =>
	dto.id ?? dto.ingestion_id ?? dto.batch_id ?? dto.batch_label ?? '';
