export type IngestionStatus =
	| 'draft'
	| 'uploading'
	| 'queued'
	| 'ingesting'
	| 'completed'
	| 'completed_with_errors'
	| 'failed'
	| 'canceled';

export type IngestionAction = 'view' | 'resume' | 'retry' | 'cancel' | 'restore' | 'delete';

export type IngestionActionCapabilities = {
	canResume: boolean;
	canRetry: boolean;
	canCancel: boolean;
	canRestore: boolean;
	canDelete: boolean;
};

export type StagingPurge = {
	state: 'not_scheduled' | 'pending' | 'purged';
	startedAt: string | null;
	purgedAt: string | null;
};

export const NO_INGESTION_ACTION_CAPABILITIES: IngestionActionCapabilities = {
	canResume: false,
	canRetry: false,
	canCancel: false,
	canRestore: false,
	canDelete: false
};

export const actionsFromCapabilities = (
	capabilities: IngestionActionCapabilities
): Exclude<IngestionAction, 'view'>[] => [
	...(capabilities.canResume ? ['resume' as const] : []),
	...(capabilities.canRetry ? ['retry' as const] : []),
	...(capabilities.canCancel ? ['cancel' as const] : []),
	...(capabilities.canRestore ? ['restore' as const] : []),
	...(capabilities.canDelete ? ['delete' as const] : [])
];

export type IngestionBatch = {
	id: string;
	name: string;
	createdAt: string;
	status: IngestionStatus;
	progress: {
		completed: number;
		total: number;
	};
	actionCapabilities: IngestionActionCapabilities;
	stagingPurge: StagingPurge;
	actions: IngestionAction[];
};

export type IngestionStats = {
	totalBatches: number;
	objectsCreated: number;
	inProgress: number;
	needsAttention: number;
};

export type IngestionOverviewSummary = {
	stats: IngestionStats;
	activeAndRecent: IngestionBatch[];
	drafts: IngestionBatch[];
	nextCursor: string | null;
};

export type IngestionOverviewRequest = {
	fetchFn: typeof fetch;
	token: string;
	limit?: number;
	cursor?: string;
};

export type IngestionOverviewService = {
	getSummary: (request: IngestionOverviewRequest) => Promise<IngestionOverviewSummary>;
};
