import type { Role } from '$lib/auth/types';

export type DashboardRoleCopyCode = 'admin' | 'archiver' | 'viewer';

export type DashboardActivityEventCode =
	| 'INGESTION_SUBMITTED'
	| 'INGESTION_QUEUED'
	| 'INGESTION_PROCESSING'
	| 'INGESTION_COMPLETED'
	| 'INGESTION_FAILED'
	| 'INGESTION_CANCELED'
	| 'LEASE_GRANTED'
	| 'LEASE_RENEWED'
	| 'LEASE_EXPIRED'
	| 'LEASE_RELEASED'
	| 'FILE_VALIDATED'
	| 'FILE_FAILED'
	| 'PIPELINE_STEP_STARTED'
	| 'PIPELINE_STEP_COMPLETED'
	| 'PIPELINE_STEP_FAILED'
	| 'INGESTION_ITEM_CREATED'
	| 'INGESTION_ITEM_UPDATED'
	| 'INGESTION_ITEM_PROCESSING'
	| 'INGESTION_ITEM_COMPLETED'
	| 'INGESTION_ITEM_FAILED'
	| 'OBJECT_CREATED'
	| 'ARTIFACT_CREATED';

export type DashboardActivityDescription =
	| { code: 'raw'; text: string }
	| { code: 'ingestionUpdated'; id: string }
	| { code: 'objectUpdated'; id: string }
	| { code: 'recorded' };

export type DashboardActivity = {
	id: string;
	eventCode: DashboardActivityEventCode | null;
	typeFallback: string;
	description: DashboardActivityDescription;
	timestamp: string;
	type: string;
	ingestionId: string | null;
	objectId: string | null;
	actorUserId: string | null;
	payload: unknown;
};

export type DashboardSummary = {
	metrics: {
		activeBatches: number;
		needsReview: number;
		pendingUploads: number;
	};
	roleCopyCode: DashboardRoleCopyCode;
	recentActivity: DashboardActivity[];
};

export type DashboardSummaryRequest = {
	role: Role;
	fetchFn: typeof fetch;
	token: string;
};

export type DashboardActivityRequest = {
	fetchFn: typeof fetch;
	token: string;
	limit?: number;
	cursor?: string;
	ingestionId?: string;
};

export type DashboardService = {
	getSummary: (request: DashboardSummaryRequest) => Promise<DashboardSummary>;
	getActivity: (request: DashboardActivityRequest) => Promise<DashboardActivity[]>;
};
