export type IngestionStatus =
	| 'draft'
	| 'uploading'
	| 'queued'
	| 'ingesting'
	| 'completed'
	| 'failed'
	| 'canceled';

export type IngestionAction = 'view' | 'resume' | 'retry' | 'cancel' | 'restore' | 'delete';

export type IngestionBatch = {
	id: string;
	name: string;
	createdAt: string;
	status: IngestionStatus;
	progress: {
		completed: number;
		total: number;
	};
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
