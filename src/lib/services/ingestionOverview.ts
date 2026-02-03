export type IngestionStatus = 'draft' | 'ingesting' | 'completed' | 'failed';

export type IngestionAction = 'view' | 'resume' | 'retry';

export type IngestionBatch = {
	id: string;
	name: string;
	createdAt: string;
	status: IngestionStatus;
	progress: {
		completed: number;
		total: number;
	};
	action: IngestionAction;
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
};

export type IngestionOverviewService = {
	getSummary: () => Promise<IngestionOverviewSummary>;
};
