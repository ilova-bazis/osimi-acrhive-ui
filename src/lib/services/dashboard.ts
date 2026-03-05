import type { Role } from '$lib/auth/types';

export type DashboardActivity = {
	id: string;
	title: string;
	description: string;
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
	primaryAction: string;
	secondaryAction: string;
	roleTagline: string;
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
